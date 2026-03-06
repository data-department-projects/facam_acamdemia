/**
 * Service quiz : récupération d'un quiz (sans réponses pour l'étudiant), soumission tentative, calcul score.
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { QUIZ_MIN_SCORE_PERCENT } from '../core/constants';

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
   * Soumet une tentative de quiz. QCM : calcul du score et passed si >= 70 %. Quiz final : pas de score auto.
   */
  async soumettreTentative(
    quizId: string,
    dto: SubmitAttemptDto,
    userId: string
  ): Promise<{ attemptId: string; scorePercent: number | null; passed: boolean | null }> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!quiz) {
      throw new NotFoundException('Quiz introuvable');
    }
    const enrollmentId = dto.enrollmentId ?? null;
    let scorePercent: number | null = null;
    let passed: boolean | null = null;
    if (!quiz.isFinal) {
      const correctCount = quiz.questions.reduce((acc, q, i) => {
        const selectedIndex = dto.answers[i] ?? -1;
        return acc + (selectedIndex === q.correctIndex ? 1 : 0);
      }, 0);
      scorePercent =
        quiz.questions.length > 0 ? Math.round((correctCount / quiz.questions.length) * 100) : 0;
      passed = scorePercent >= QUIZ_MIN_SCORE_PERCENT;
    }
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
}
