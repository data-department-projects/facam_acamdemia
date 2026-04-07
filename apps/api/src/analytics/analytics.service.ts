/**
 * AnalyticsService — agrégations "business" pour piloter la plateforme.
 *
 * Notes:
 * - Le "temps d'apprentissage" est estimé à partir des ressources complétées:
 *   somme des `durationMinutes` des items vidéo/quiz complétés (EnrollmentProgress).
 *   C'est un proxy robuste sans tracking temps réel (pas de heartbeat).
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type OverviewParams = {
  requesterId: string;
  from?: string;
  to?: string;
  role?: string;
  moduleId?: string;
};

type LearnersParams = {
  from?: string;
  to?: string;
  role?: string;
  moduleId?: string;
  q?: string;
  sort?: string;
  page?: string;
  limit?: string;
};

type LearnerDetailParams = {
  userId: string;
  from?: string;
  to?: string;
  moduleId?: string;
};

function parseDateOrThrow(value: string | undefined, label: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new BadRequestException(`Date invalide: ${label}`);
  return d;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function clampRole(role?: string): 'student' | 'employee' | 'all' {
  if (!role) return 'all';
  const r = role.toLowerCase();
  if (r === 'student' || r === 'employee') return r;
  return 'all';
}

function clampSort(
  sort?: string
): 'performance' | 'engagement' | 'minutes' | 'quizzes' | 'progress' | 'name' {
  if (!sort) return 'performance';
  const s = sort.toLowerCase();
  if (s === 'engagement' || s === 'minutes' || s === 'quizzes' || s === 'progress' || s === 'name')
    return s;
  return 'performance';
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private computeRange(from?: string, to?: string) {
    const fromRaw = parseDateOrThrow(from, 'from');
    const toRaw = parseDateOrThrow(to, 'to');
    const now = new Date();
    const toDate = toRaw ? endOfDay(toRaw) : endOfDay(now);
    const fromDate = fromRaw
      ? startOfDay(fromRaw)
      : startOfDay(new Date(toDate.getTime() - 30 * 86400000));
    if (fromDate > toDate) throw new BadRequestException('Période invalide: from > to');
    return { from: fromDate, to: toDate };
  }

  async adminOverview(params: OverviewParams) {
    const { from, to } = this.computeRange(params.from, params.to);

    const role = clampRole(params.role);
    const moduleId = params.moduleId?.trim() ? params.moduleId.trim() : null;

    const userWhere: Prisma.UserWhereInput =
      role === 'all' ? { role: { in: ['student', 'employee'] } } : { role };

    const enrollmentWhere: Prisma.EnrollmentWhereInput = {
      user: userWhere,
      ...(moduleId ? { moduleId } : {}),
    };

    const [totalLearners, totalEnrollments] = await Promise.all([
      this.prisma.user.count({ where: userWhere }),
      this.prisma.enrollment.count({ where: enrollmentWhere }),
    ]);

    const completedEnrollments = await this.prisma.enrollment.count({
      where: { ...enrollmentWhere, completedAt: { not: null } },
    });
    const completionRate =
      totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    // Tentatives de quiz (chapitres + final) sur la période, filtrées par enrollment
    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        submittedAt: { gte: from, lte: to },
        enrollment: enrollmentWhere,
        scorePercent: { not: null },
      },
      select: {
        id: true,
        scorePercent: true,
        passed: true,
        submittedAt: true,
        quizId: true,
        userId: true,
      },
    });

    const quizzesPassedCount = attempts.filter((a) => a.passed === true).length;
    const quizzesTakenCount = attempts.length;
    const avgScore =
      quizzesTakenCount > 0
        ? Math.round(
            attempts.reduce((acc, a) => acc + (a.scorePercent ?? 0), 0) / quizzesTakenCount
          )
        : null;
    const passRate =
      quizzesTakenCount > 0 ? Math.round((quizzesPassedCount / quizzesTakenCount) * 100) : 0;

    // Scores par quiz (avg + attempts)
    const quizIds = Array.from(new Set(attempts.map((a) => a.quizId)));
    const quizMeta = quizIds.length
      ? await this.prisma.quiz.findMany({
          where: { id: { in: quizIds } },
          select: { id: true, title: true, isFinal: true, moduleId: true },
        })
      : [];
    const quizTitleById = new Map(quizMeta.map((q) => [q.id, q.title]));

    const perQuizMap = new Map<
      string,
      { quizId: string; title: string; attempts: number; passed: number; scoreSum: number }
    >();
    for (const a of attempts) {
      const existing = perQuizMap.get(a.quizId) ?? {
        quizId: a.quizId,
        title: quizTitleById.get(a.quizId) ?? 'Quiz',
        attempts: 0,
        passed: 0,
        scoreSum: 0,
      };
      existing.attempts += 1;
      existing.passed += a.passed ? 1 : 0;
      existing.scoreSum += a.scorePercent ?? 0;
      perQuizMap.set(a.quizId, existing);
    }
    const perQuiz = Array.from(perQuizMap.values())
      .map((q) => ({
        quizId: q.quizId,
        title: q.title,
        attempts: q.attempts,
        avgScore: q.attempts > 0 ? Math.round(q.scoreSum / q.attempts) : 0,
        passRate: q.attempts > 0 ? Math.round((q.passed / q.attempts) * 100) : 0,
      }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 12);

    // Série temporelle: par jour (score moyen + nb tentatives)
    const byDay = new Map<string, { day: string; attempts: number; scoreSum: number }>();
    for (const a of attempts) {
      const d = a.submittedAt;
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
      const existing = byDay.get(key) ?? { day: key, attempts: 0, scoreSum: 0 };
      existing.attempts += 1;
      existing.scoreSum += a.scorePercent ?? 0;
      byDay.set(key, existing);
    }
    const performanceOverTime = Array.from(byDay.values())
      .sort((a, b) => a.day.localeCompare(b.day))
      .map((d) => ({
        day: d.day,
        attempts: d.attempts,
        avgScore: d.attempts > 0 ? Math.round(d.scoreSum / d.attempts) : 0,
      }));

    // Minutes apprises: proxy basé sur items complétés (EnrollmentProgress) pendant période
    const progressRows = await this.prisma.enrollmentProgress.findMany({
      where: {
        completedAt: { gte: from, lte: to },
        enrollment: enrollmentWhere,
      },
      select: {
        enrollment: { select: { userId: true } },
        chapterItem: { select: { durationMinutes: true, type: true } },
      },
    });
    const minutesByUser = new Map<string, number>();
    for (const row of progressRows) {
      const userId = row.enrollment.userId;
      const minutes = row.chapterItem.durationMinutes ?? 0;
      // On compte surtout les vidéos et quiz; les documents n'ont pas de durée.
      const type = row.chapterItem.type;
      if (type !== 'video' && type !== 'quiz') continue;
      minutesByUser.set(userId, (minutesByUser.get(userId) ?? 0) + minutes);
    }

    // "Meilleur score sur les 3 quiz principaux" = top 3 quizzes les plus tentés sur la période (global filtres)
    const top3QuizIds = Array.from(perQuizMap.values())
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 3)
      .map((q) => q.quizId);

    // Profil performance / investissement
    const users = await this.prisma.user.findMany({
      where: userWhere,
      select: { id: true, fullName: true, email: true, role: true, avatarUrl: true },
      take: 500,
    });

    // Score moyen par user sur la période
    const scoreAggByUser = new Map<string, { attempts: number; sum: number; bestOnTop3: number }>();
    for (const a of attempts) {
      const u = scoreAggByUser.get(a.userId) ?? { attempts: 0, sum: 0, bestOnTop3: 0 };
      u.attempts += 1;
      u.sum += a.scorePercent ?? 0;
      scoreAggByUser.set(a.userId, u);
    }
    // Best score on each of top3 quizzes, then take max (or avg best). We'll compute avg best.
    if (top3QuizIds.length > 0) {
      const bestByUserQuiz = new Map<string, Map<string, number>>();
      for (const a of attempts) {
        if (!top3QuizIds.includes(a.quizId)) continue;
        const m = bestByUserQuiz.get(a.userId) ?? new Map<string, number>();
        const prev = m.get(a.quizId) ?? -1;
        const score = a.scorePercent ?? 0;
        if (score > prev) m.set(a.quizId, score);
        bestByUserQuiz.set(a.userId, m);
      }
      for (const [userId, m] of bestByUserQuiz.entries()) {
        const values = top3QuizIds.map((id) => m.get(id) ?? 0);
        const avgBest = Math.round(values.reduce((acc, v) => acc + v, 0) / top3QuizIds.length);
        const agg = scoreAggByUser.get(userId) ?? { attempts: 0, sum: 0, bestOnTop3: 0 };
        agg.bestOnTop3 = avgBest;
        scoreAggByUser.set(userId, agg);
      }
    }

    // Progression moyenne par user (sur tous enrollments)
    const progressByUser = await this.prisma.enrollment.groupBy({
      by: ['userId'],
      where: enrollmentWhere,
      _avg: { progressPercent: true },
      _count: { _all: true },
    });
    const avgProgressByUser = new Map<string, number>();
    for (const row of progressByUser) {
      avgProgressByUser.set(row.userId, Math.round(row._avg.progressPercent ?? 0));
    }

    const learnerRows = users.map((u) => {
      const scoreAgg = scoreAggByUser.get(u.id) ?? { attempts: 0, sum: 0, bestOnTop3: 0 };
      const avg = scoreAgg.attempts > 0 ? Math.round(scoreAgg.sum / scoreAgg.attempts) : 0;
      const minutesLearned = minutesByUser.get(u.id) ?? 0;
      const avgProgress = avgProgressByUser.get(u.id) ?? 0;
      const engagementScore = Math.round(
        Math.min(100, minutesLearned / 5 + scoreAgg.attempts * 2 + avgProgress * 0.3)
      );
      return {
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
        avgQuizScore: avg,
        quizzesTaken: scoreAgg.attempts,
        bestScoreTop3Quizzes: scoreAgg.bestOnTop3,
        minutesLearned,
        avgProgress,
        engagementScore,
      };
    });

    const topPerformers = learnerRows
      .slice()
      .sort((a, b) => b.avgQuizScore - a.avgQuizScore || b.quizzesTaken - a.quizzesTaken)
      .slice(0, 8);
    const mostInvested = learnerRows
      .slice()
      .sort((a, b) => b.minutesLearned - a.minutesLearned || b.engagementScore - a.engagementScore)
      .slice(0, 8);

    // Top 3 quizzes meta
    const top3Quizzes = top3QuizIds.map((id) => ({
      quizId: id,
      title: quizTitleById.get(id) ?? 'Quiz',
    }));

    return {
      filters: { from: from.toISOString(), to: to.toISOString(), role, moduleId },
      kpi: {
        totalLearners,
        totalEnrollments,
        completionRate,
        quizzesTakenCount,
        avgQuizScore: avgScore,
        passRate,
      },
      performanceOverTime,
      perQuiz,
      top3Quizzes,
      topPerformers,
      mostInvested,
    };
  }

  async adminLearners(params: LearnersParams) {
    const { from, to } = this.computeRange(params.from, params.to);
    const role = clampRole(params.role);
    const moduleId = params.moduleId?.trim() ? params.moduleId.trim() : null;
    const q = params.q?.trim() ? params.q.trim() : '';
    const sort = clampSort(params.sort);
    const pageNum = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
    const limitNum = Math.min(100, Math.max(10, parseInt(params.limit ?? '25', 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const userWhere: Prisma.UserWhereInput = {
      ...(role === 'all' ? { role: { in: ['student', 'employee'] } } : { role }),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    // On pagine sur les utilisateurs, puis on calcule métriques pour ce sous-ensemble.
    const [total, users] = await Promise.all([
      this.prisma.user.count({ where: userWhere }),
      this.prisma.user.findMany({
        where: userWhere,
        orderBy: { fullName: 'asc' },
        select: { id: true, fullName: true, email: true, role: true, avatarUrl: true },
        skip,
        take: limitNum,
      }),
    ]);

    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) {
      return {
        data: [],
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      };
    }

    const enrollmentWhere: Prisma.EnrollmentWhereInput = {
      userId: { in: userIds },
      ...(moduleId ? { moduleId } : {}),
    };

    // Progression moyenne par user (sur enrollments filtrés moduleId)
    const progressAgg = await this.prisma.enrollment.groupBy({
      by: ['userId'],
      where: enrollmentWhere,
      _avg: { progressPercent: true },
      _count: { _all: true },
    });
    const avgProgressByUser = new Map<string, number>();
    const enrollmentsCountByUser = new Map<string, number>();
    for (const row of progressAgg) {
      avgProgressByUser.set(row.userId, Math.round(row._avg.progressPercent ?? 0));
      enrollmentsCountByUser.set(row.userId, row._count._all ?? 0);
    }

    // Tentatives quiz sur période
    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        submittedAt: { gte: from, lte: to },
        userId: { in: userIds },
        ...(moduleId ? { quiz: { moduleId } } : {}),
        scorePercent: { not: null },
      },
      select: { userId: true, quizId: true, scorePercent: true, passed: true },
    });

    // top3 quiz ids (sur ce slice)
    const quizAttemptsCount = new Map<string, number>();
    for (const a of attempts)
      quizAttemptsCount.set(a.quizId, (quizAttemptsCount.get(a.quizId) ?? 0) + 1);
    const top3QuizIds = Array.from(quizAttemptsCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    const aggByUser = new Map<string, { attempts: number; sum: number; passed: number }>();
    const bestTop3ByUserQuiz = new Map<string, Map<string, number>>();
    for (const a of attempts) {
      const u = aggByUser.get(a.userId) ?? { attempts: 0, sum: 0, passed: 0 };
      u.attempts += 1;
      u.sum += a.scorePercent ?? 0;
      u.passed += a.passed ? 1 : 0;
      aggByUser.set(a.userId, u);

      if (top3QuizIds.includes(a.quizId)) {
        const m = bestTop3ByUserQuiz.get(a.userId) ?? new Map<string, number>();
        const prev = m.get(a.quizId) ?? -1;
        const score = a.scorePercent ?? 0;
        if (score > prev) m.set(a.quizId, score);
        bestTop3ByUserQuiz.set(a.userId, m);
      }
    }

    // Minutes apprises (proxy) sur période
    const progressRows = await this.prisma.enrollmentProgress.findMany({
      where: {
        completedAt: { gte: from, lte: to },
        enrollment: enrollmentWhere,
      },
      select: {
        enrollment: { select: { userId: true } },
        chapterItem: { select: { type: true, durationMinutes: true } },
      },
    });
    const minutesByUser = new Map<string, number>();
    for (const row of progressRows) {
      const type = row.chapterItem.type;
      if (type !== 'video' && type !== 'quiz') continue;
      minutesByUser.set(
        row.enrollment.userId,
        (minutesByUser.get(row.enrollment.userId) ?? 0) + (row.chapterItem.durationMinutes ?? 0)
      );
    }

    const rows = users.map((u) => {
      const agg = aggByUser.get(u.id) ?? { attempts: 0, sum: 0, passed: 0 };
      const avgQuizScore = agg.attempts > 0 ? Math.round(agg.sum / agg.attempts) : 0;
      const passRate = agg.attempts > 0 ? Math.round((agg.passed / agg.attempts) * 100) : 0;
      const minutesLearned = minutesByUser.get(u.id) ?? 0;
      const avgProgress = avgProgressByUser.get(u.id) ?? 0;
      const enrollmentsCount = enrollmentsCountByUser.get(u.id) ?? 0;
      const bestMap = bestTop3ByUserQuiz.get(u.id) ?? new Map<string, number>();
      const bestTop3 =
        top3QuizIds.length > 0
          ? Math.round(
              top3QuizIds.map((id) => bestMap.get(id) ?? 0).reduce((a, b) => a + b, 0) /
                top3QuizIds.length
            )
          : 0;
      const engagementScore = Math.round(
        Math.min(
          100,
          minutesLearned / 5 + agg.attempts * 2 + avgProgress * 0.3 + enrollmentsCount * 4
        )
      );
      return {
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
        enrollmentsCount,
        avgProgress,
        quizzesTaken: agg.attempts,
        avgQuizScore,
        passRate,
        bestScoreTop3Quizzes: bestTop3,
        minutesLearned,
        engagementScore,
      };
    });

    const sorted = rows.slice().sort((a, b) => {
      if (sort === 'minutes') return b.minutesLearned - a.minutesLearned;
      if (sort === 'quizzes') return b.quizzesTaken - a.quizzesTaken;
      if (sort === 'progress') return b.avgProgress - a.avgProgress;
      if (sort === 'engagement') return b.engagementScore - a.engagementScore;
      if (sort === 'name') return a.fullName.localeCompare(b.fullName);
      return b.avgQuizScore - a.avgQuizScore || b.bestScoreTop3Quizzes - a.bestScoreTop3Quizzes;
    });

    return {
      meta: { from: from.toISOString(), to: to.toISOString(), role, moduleId, q, sort },
      data: sorted,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };
  }

  async adminLearnerDetail(params: LearnerDetailParams) {
    const { from, to } = this.computeRange(params.from, params.to);
    const moduleId = params.moduleId?.trim() ? params.moduleId.trim() : null;
    const userId = params.userId;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    if (!user) throw new BadRequestException('Utilisateur introuvable');

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId, ...(moduleId ? { moduleId } : {}) },
      include: { module: { select: { id: true, title: true, moduleType: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    const enrollmentIds = enrollments.map((e) => e.id);
    const moduleIds = enrollments.map((e) => e.moduleId);

    const attempts = enrollmentIds.length
      ? await this.prisma.quizAttempt.findMany({
          where: {
            enrollmentId: { in: enrollmentIds },
            submittedAt: { gte: from, lte: to },
            scorePercent: { not: null },
          },
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
                isFinal: true,
                moduleId: true,
                chapter: { select: { title: true, order: true } },
              },
            },
          },
          orderBy: { submittedAt: 'asc' },
        })
      : [];

    const attemptsTaken = attempts.length;
    const avgQuizScore =
      attemptsTaken > 0
        ? Math.round(attempts.reduce((acc, a) => acc + (a.scorePercent ?? 0), 0) / attemptsTaken)
        : null;
    const passedCount = attempts.filter((a) => a.passed).length;
    const passRate = attemptsTaken > 0 ? Math.round((passedCount / attemptsTaken) * 100) : 0;

    // Per quiz stats
    const perQuizMap = new Map<
      string,
      {
        quizId: string;
        title: string;
        isFinal: boolean;
        attempts: number;
        passed: number;
        best: number;
        avgSum: number;
      }
    >();
    for (const a of attempts) {
      const q = a.quiz;
      const existing = perQuizMap.get(q.id) ?? {
        quizId: q.id,
        title: q.title,
        isFinal: q.isFinal,
        attempts: 0,
        passed: 0,
        best: 0,
        avgSum: 0,
      };
      existing.attempts += 1;
      existing.passed += a.passed ? 1 : 0;
      const score = a.scorePercent ?? 0;
      existing.avgSum += score;
      if (score > existing.best) existing.best = score;
      perQuizMap.set(q.id, existing);
    }
    const perQuiz = Array.from(perQuizMap.values())
      .map((q) => ({
        quizId: q.quizId,
        title: q.title,
        isFinal: q.isFinal,
        attempts: q.attempts,
        passRate: q.attempts > 0 ? Math.round((q.passed / q.attempts) * 100) : 0,
        avgScore: q.attempts > 0 ? Math.round(q.avgSum / q.attempts) : 0,
        bestScore: q.best,
      }))
      .sort((a, b) => (a.isFinal === b.isFinal ? b.attempts - a.attempts : a.isFinal ? -1 : 1));

    // Timeline by day (avg score + attempts)
    const byDay = new Map<string, { day: string; attempts: number; scoreSum: number }>();
    for (const a of attempts) {
      const d = a.submittedAt;
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
      const existing = byDay.get(key) ?? { day: key, attempts: 0, scoreSum: 0 };
      existing.attempts += 1;
      existing.scoreSum += a.scorePercent ?? 0;
      byDay.set(key, existing);
    }
    const performanceOverTime = Array.from(byDay.values())
      .sort((a, b) => a.day.localeCompare(b.day))
      .map((d) => ({
        day: d.day,
        attempts: d.attempts,
        avgScore: d.attempts > 0 ? Math.round(d.scoreSum / d.attempts) : 0,
      }));

    // Minutes learned by day (EnrollmentProgress)
    const progressRows = enrollmentIds.length
      ? await this.prisma.enrollmentProgress.findMany({
          where: { enrollmentId: { in: enrollmentIds }, completedAt: { gte: from, lte: to } },
          select: {
            completedAt: true,
            chapterItem: { select: { type: true, durationMinutes: true } },
          },
        })
      : [];
    const minutesByDay = new Map<string, number>();
    for (const row of progressRows) {
      const type = row.chapterItem.type;
      if (type !== 'video' && type !== 'quiz') continue;
      const d = row.completedAt;
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
      minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + (row.chapterItem.durationMinutes ?? 0));
    }
    const minutesTimeline = Array.from(minutesByDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, minutes]) => ({ day, minutes }));
    const totalMinutes = minutesTimeline.reduce((acc, d) => acc + d.minutes, 0);

    // Quiz principaux (top3 par tentatives sur ce learner)
    const quizCount = new Map<string, number>();
    for (const a of attempts) quizCount.set(a.quizId, (quizCount.get(a.quizId) ?? 0) + 1);
    const top3QuizIds = Array.from(quizCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);
    const bestByQuiz = new Map<string, number>();
    for (const a of attempts) {
      if (!top3QuizIds.includes(a.quizId)) continue;
      const prev = bestByQuiz.get(a.quizId) ?? -1;
      const score = a.scorePercent ?? 0;
      if (score > prev) bestByQuiz.set(a.quizId, score);
    }
    const bestTop3 =
      top3QuizIds.length > 0
        ? Math.round(
            top3QuizIds.map((id) => bestByQuiz.get(id) ?? 0).reduce((a, b) => a + b, 0) /
              top3QuizIds.length
          )
        : 0;

    const enrollmentsCompact = enrollments.map((e) => ({
      enrollmentId: e.id,
      moduleId: e.module.id,
      moduleTitle: e.module.title,
      moduleType: e.module.moduleType,
      progressPercent: e.progressPercent,
      completedAt: e.completedAt?.toISOString() ?? null,
      enrolledAt: e.enrolledAt.toISOString(),
      lastViewedChapterId: e.lastViewedChapterId,
      lastViewedItemId: e.lastViewedItemId,
    }));

    const engagementScore = Math.round(
      Math.min(
        100,
        totalMinutes / 5 +
          attemptsTaken * 2 +
          (enrollmentsCompact.reduce((acc, e) => acc + e.progressPercent, 0) /
            Math.max(1, enrollmentsCompact.length)) *
            0.3
      )
    );

    return {
      filters: { from: from.toISOString(), to: to.toISOString(), moduleId },
      user,
      kpi: {
        attemptsTaken,
        avgQuizScore,
        passRate,
        bestScoreTop3Quizzes: bestTop3,
        totalMinutesLearned: totalMinutes,
        engagementScore,
      },
      enrollments: enrollmentsCompact,
      performanceOverTime,
      minutesTimeline,
      perQuiz,
      modulesInScope: Array.from(new Set(moduleIds)),
    };
  }
}
