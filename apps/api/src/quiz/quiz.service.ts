/**
 * Service quiz : récupération d'un quiz (sans réponses pour l'étudiant), soumission tentative, calcul score.
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SubmitAttemptDto } from './dto/submit-attempt.dto';
import type { UpsertFinalQuizDto } from './dto/upsert-final-quiz.dto';
import { QUIZ_MIN_SCORE_PERCENT } from '../core/constants';

/** Libellé unique pour le certificat (plus de mention Très bien / Bien / etc.). */
const CERTIFICATE_LABEL = 'Validé';
const CHAPTER_QUIZ_MAX_ATTEMPTS = 3;

function normalizeSelectedIndexes(value: unknown): number[] {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((v) => (typeof v === 'number' && Number.isInteger(v) ? v : -1))
          .filter((v) => v >= 0)
      )
    ).sort((a, b) => a - b);
  }
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return [value];
  }
  return [];
}

function normalizeCorrectIndexes(question: {
  correctIndex: number;
  correctIndexes: number[];
}): number[] {
  const multi = Array.isArray(question.correctIndexes) ? question.correctIndexes : [];
  if (multi.length > 0) {
    return Array.from(new Set(multi.filter((v) => Number.isInteger(v) && v >= 0))).sort(
      (a, b) => a - b
    );
  }
  if (Number.isInteger(question.correctIndex) && question.correctIndex >= 0) {
    return [question.correctIndex];
  }
  return [];
}

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
      ...(peutVoirReponses
        ? {
            correctIndex: q.correctIndex,
            correctIndexes: q.correctIndexes,
          }
        : {}),
    }));
    let chapterQuizState: {
      maxAttempts: number;
      attemptsUsed: number;
      attemptsRemaining: number;
      alreadyPassed: boolean;
    } | null = null;

    const isLearner = role === 'student' || role === 'employee';
    if (!quiz.isFinal && isLearner) {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: { userId, moduleId: quiz.moduleId },
        select: { id: true },
      });
      const attemptsWhere = enrollment?.id
        ? { userId, quizId, enrollmentId: enrollment.id }
        : { userId, quizId };
      const attempts = await this.prisma.quizAttempt.findMany({
        where: attemptsWhere,
        select: { passed: true },
      });
      const attemptsUsed = attempts.length;
      const alreadyPassed = attempts.some((a) => a.passed === true);
      chapterQuizState = {
        maxAttempts: CHAPTER_QUIZ_MAX_ATTEMPTS,
        attemptsUsed,
        attemptsRemaining: Math.max(0, CHAPTER_QUIZ_MAX_ATTEMPTS - attemptsUsed),
        alreadyPassed,
      };
    }

    return {
      id: quiz.id,
      title: quiz.title,
      isFinal: quiz.isFinal,
      minScoreToPass: quiz.minScoreToPass,
      questions,
      ...(chapterQuizState ? chapterQuizState : {}),
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
  ): Promise<{
    attemptId: string;
    scorePercent: number | null;
    passed: boolean | null;
    maxAttempts?: number;
    attemptsUsed?: number;
    attemptsRemaining?: number;
  }> {
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

    // Quiz de chapitre : 3 tentatives max pour réussir. Si déjà réussi, on interdit un nouveau passage.
    if (!quiz.isFinal) {
      const attemptsWhere = enrollmentId ? { userId, quizId, enrollmentId } : { userId, quizId };
      const attempts = await this.prisma.quizAttempt.findMany({
        where: attemptsWhere,
        select: { passed: true },
      });
      const attemptsUsed = attempts.length;
      const alreadyPassed = attempts.some((a) => a.passed === true);
      if (alreadyPassed) {
        throw new BadRequestException('Ce quiz de chapitre est déjà validé.');
      }
      if (attemptsUsed >= CHAPTER_QUIZ_MAX_ATTEMPTS) {
        throw new BadRequestException(
          `Limite atteinte : ${CHAPTER_QUIZ_MAX_ATTEMPTS} tentatives maximum pour ce quiz de chapitre.`
        );
      }
    }

    const minScore = quiz.minScoreToPass != null ? quiz.minScoreToPass : QUIZ_MIN_SCORE_PERCENT;
    const correctCount = quiz.questions.reduce((acc, q, i) => {
      const selected = normalizeSelectedIndexes(dto.answers[i]);
      const correct = normalizeCorrectIndexes({
        correctIndex: q.correctIndex,
        correctIndexes: q.correctIndexes,
      });
      const isCorrect =
        selected.length === correct.length &&
        selected.every((value, idx) => value === correct[idx]);
      return acc + (isCorrect ? 1 : 0);
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

    const attemptsWhere = enrollmentId ? { userId, quizId, enrollmentId } : { userId, quizId };
    const attemptsUsed = !quiz.isFinal
      ? await this.prisma.quizAttempt.count({ where: attemptsWhere })
      : null;

    return {
      attemptId: attempt.id,
      scorePercent,
      passed,
      ...(!quiz.isFinal && attemptsUsed != null
        ? {
            maxAttempts: CHAPTER_QUIZ_MAX_ATTEMPTS,
            attemptsUsed,
            attemptsRemaining: Math.max(0, CHAPTER_QUIZ_MAX_ATTEMPTS - attemptsUsed),
          }
        : {}),
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
      correctIndexes: number[];
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
        correctIndexes: q.correctIndexes,
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
        data: dto.questions.map((q, i) => {
          const correctIndexes =
            q.correctIndexes && q.correctIndexes.length > 0 ? q.correctIndexes : [q.correctIndex];
          return {
            quizId,
            questionText: q.questionText,
            options: q.options as unknown as object,
            correctIndex: correctIndexes[0] ?? 0,
            correctIndexes,
            order: i + 1,
          };
        }),
      });
    }
    return { id: quiz.id, title: quiz.title };
  }
}
