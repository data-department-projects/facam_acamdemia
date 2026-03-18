/**
 * Service quiz : récupération d'un quiz (sans réponses pour l'étudiant), soumission tentative, calcul score.
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SubmitAttemptDto } from './dto/submit-attempt.dto';
import type { UpsertFinalQuizDto } from './dto/upsert-final-quiz.dto';
import { QUIZ_MIN_SCORE_PERCENT } from '../core/constants';

/** Libellé unique pour le certificat (plus de mention Très bien / Bien / etc.). */
const CERTIFICATE_LABEL = 'Validé';

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère un quiz par ID avec les questions (sans correctIndex pour l'étudiant).
   */
  async trouverUn(quizId: string, userId: string, role: string): Promise<unknown> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        module: true,
      },
    });
    if (!quiz) {
      throw new NotFoundException('Quiz introuvable');
    }
    const peutVoirReponses =
      role === 'admin' || role === 'platform_manager' || quiz.module.managerId === userId;
    const questions = quiz.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options as string[],
      order: q.order,
      points: q.points,
      ...(peutVoirReponses ? { correctIndex: q.correctIndex } : {}),
    }));
    return {
      id: quiz.id,
      title: quiz.title,
      isFinal: quiz.isFinal,
      minScoreToPass: quiz.minScoreToPass,
      questions,
    };
  }

  /**
   * Soumet une tentative de quiz. QCM et quiz final : calcul du score en pourcentage et passed
   * selon le seuil du quiz (minScoreToPass ou 70 %). Si quiz final réussi et enrollmentId fourni,
   * met à jour l'inscription (completedAt) et crée le certificat pour permettre la vue/téléchargement.
   */
  async soumettreTentative(
    quizId: string,
    dto: SubmitAttemptDto,
    userId: string
  ): Promise<{ attemptId: string; scorePercent: number | null; passed: boolean | null }> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        module: true,
      },
    });
    if (!quiz) {
      throw new NotFoundException('Quiz introuvable');
    }
    const enrollmentId = dto.enrollmentId ?? null;
    const minScore = quiz.minScoreToPass != null ? quiz.minScoreToPass : QUIZ_MIN_SCORE_PERCENT;
    const correctCount = quiz.questions.reduce((acc, q, i) => {
      const selectedIndex = dto.answers[i] ?? -1;
      return acc + (selectedIndex === q.correctIndex ? 1 : 0);
    }, 0);
    const scorePercent =
      quiz.questions.length > 0 ? Math.round((correctCount / quiz.questions.length) * 100) : 0;
    const passed = scorePercent >= minScore;

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        enrollmentId,
        scorePercent,
        passed,
        answers: dto.answers as unknown as object,
      },
      select: { id: true },
    });

    // Quiz final réussi avec inscription : compléter l'enrollment et créer le certificat si absent
    if (quiz.isFinal && passed && enrollmentId && quiz.module) {
      const finalGrade = Math.min(20, Math.round((scorePercent / 100) * 20));
      const existingCert = await this.prisma.certificate.findUnique({
        where: { enrollmentId },
      });
      if (!existingCert) {
        await this.prisma.certificate.create({
          data: {
            enrollmentId,
            userId,
            moduleId: quiz.module.id,
            finalGrade,
            mention: CERTIFICATE_LABEL,
          },
        });
      }
      await this.prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { completedAt: new Date() },
      });
    }

    return {
      attemptId: attempt.id,
      scorePercent,
      passed,
    };
  }

  /**
   * Liste les tentatives d'un quiz (pour le responsable : correction quiz final).
   */
  async trouverTentativesPourQuiz(
    quizId: string,
    userId: string,
    role: string
  ): Promise<unknown[]> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { module: true },
    });
    if (!quiz) {
      throw new NotFoundException('Quiz introuvable');
    }
    const peutVoir =
      role === 'admin' || role === 'platform_manager' || quiz.module.managerId === userId;
    if (!peutVoir || !quiz.isFinal) {
      throw new ForbiddenException('Accès refusé ou quiz non final');
    }
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        enrollment: { select: { id: true } },
      },
    });
    return attempts.map((a) => ({
      id: a.id,
      userId: a.userId,
      user: a.user,
      enrollmentId: a.enrollmentId,
      answers: a.answers,
      submittedAt: a.submittedAt.toISOString(),
    }));
  }

  /**
   * Récupère le quiz final d'un module (pour responsable / admin). Retourne null si aucun.
   */
  async trouverQuizFinal(
    moduleId: string,
    userId: string,
    role: string
  ): Promise<{
    id: string;
    title: string;
    minScoreToPass: number;
    questions: {
      id: string;
      questionText: string;
      options: string[];
      correctIndex: number;
      order: number;
    }[];
  } | null> {
    const module_ = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module_) {
      throw new NotFoundException('Module introuvable');
    }
    const peutVoir =
      role === 'admin' || role === 'platform_manager' || module_.managerId === userId;
    if (!peutVoir) {
      throw new ForbiddenException('Vous ne pouvez pas accéder à ce module');
    }
    const quiz = await this.prisma.quiz.findFirst({
      where: { moduleId, isFinal: true },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!quiz) return null;
    return {
      id: quiz.id,
      title: quiz.title,
      minScoreToPass: quiz.minScoreToPass,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        options: q.options as string[],
        correctIndex: q.correctIndex,
        order: q.order,
      })),
    };
  }

  /**
   * Crée ou met à jour le quiz final du module (remplace toutes les questions).
   */
  async upsertQuizFinal(
    dto: UpsertFinalQuizDto,
    userId: string,
    role: string
  ): Promise<{ id: string; title: string }> {
    const module_ = await this.prisma.module.findUnique({ where: { id: dto.moduleId } });
    if (!module_) {
      throw new NotFoundException('Module introuvable');
    }
    const peutModifier =
      role === 'admin' || role === 'platform_manager' || module_.managerId === userId;
    if (!peutModifier) {
      throw new ForbiddenException('Vous ne pouvez pas modifier ce module');
    }
    const minScore = Math.min(100, Math.max(0, dto.minScoreToPass ?? 80));
    let quiz = await this.prisma.quiz.findFirst({
      where: { moduleId: dto.moduleId, isFinal: true },
    });
    if (quiz) {
      await this.prisma.quizQuestion.deleteMany({ where: { quizId: quiz.id } });
      await this.prisma.quiz.update({
        where: { id: quiz.id },
        data: { minScoreToPass: minScore },
      });
    } else {
      quiz = await this.prisma.quiz.create({
        data: {
          moduleId: dto.moduleId,
          chapterId: null,
          title: `Quiz final — ${module_.title}`,
          isFinal: true,
          minScoreToPass: minScore,
        },
      });
    }
    const quizId = quiz.id;
    if (dto.questions?.length) {
      await this.prisma.quizQuestion.createMany({
        data: dto.questions.map((q, i) => ({
          quizId,
          questionText: q.questionText,
          options: q.options as unknown as object,
          correctIndex: q.correctIndex,
          order: i + 1,
        })),
      });
    }
    return { id: quiz.id, title: quiz.title };
  }
}
