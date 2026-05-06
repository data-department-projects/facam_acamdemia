/**
 * AnalyticsService — agrégations "business" pour piloter la plateforme.
 * Le temps de présence est mesuré par les pings heartbeat (1 ping = 2 min d'activité réelle).
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
const PING_INTERVAL_MINUTES = 2;

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

type ModulesStatsParams = {
  from?: string;
  to?: string;
  moduleType?: string;
  moduleId?: string;
};

function clampModuleType(moduleType?: string): 'interne' | 'externe' | 'all' {
  if (!moduleType) return 'all';
  const t = moduleType.toLowerCase();
  if (t === 'interne' || t === 'externe') return t;
  return 'all';
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

    // Minutes de présence réelle : comptage des pings (1 ping = PING_INTERVAL_MINUTES minutes)
    const pingRows = await this.prisma.userActivityPing.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: from, lte: to },
        user: userWhere,
        ...(moduleId ? { moduleId } : {}),
      },
      _count: { _all: true },
    });
    const minutesByUser = new Map<string, number>();
    for (const row of pingRows) {
      minutesByUser.set(row.userId, row._count._all * PING_INTERVAL_MINUTES);
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

    // Minutes de présence réelle : comptage des pings (1 ping = PING_INTERVAL_MINUTES minutes)
    const pingRows = await this.prisma.userActivityPing.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: from, lte: to },
        userId: { in: userIds },
        ...(moduleId ? { moduleId } : {}),
      },
      _count: { _all: true },
    });
    const minutesByUser = new Map<string, number>();
    for (const row of pingRows) {
      minutesByUser.set(row.userId, row._count._all * PING_INTERVAL_MINUTES);
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
                module: { select: { title: true } },
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
        chapterTitle: string | null;
        moduleId: string;
        moduleTitle: string;
        isFinal: boolean;
        attempts: number;
        passed: number;
        best: number;
        avgSum: number;
        scores: number[];
      }
    >();
    for (const a of attempts) {
      const q = a.quiz;
      const existing = perQuizMap.get(q.id) ?? {
        quizId: q.id,
        title: q.title,
        chapterTitle: q.chapter?.title ?? null,
        moduleId: q.moduleId,
        moduleTitle: q.module.title,
        isFinal: q.isFinal,
        attempts: 0,
        passed: 0,
        best: 0,
        avgSum: 0,
        scores: [],
      };
      existing.attempts += 1;
      existing.passed += a.passed ? 1 : 0;
      const score = a.scorePercent ?? 0;
      existing.avgSum += score;
      existing.scores.push(score);
      if (score > existing.best) existing.best = score;
      perQuizMap.set(q.id, existing);
    }
    const perQuiz = Array.from(perQuizMap.values())
      .map((q) => ({
        quizId: q.quizId,
        title: q.title,
        chapterTitle: q.chapterTitle,
        moduleId: q.moduleId,
        moduleTitle: q.moduleTitle,
        isFinal: q.isFinal,
        attempts: q.attempts,
        passRate: q.attempts > 0 ? Math.round((q.passed / q.attempts) * 100) : 0,
        avgScore: q.attempts > 0 ? Math.round(q.avgSum / q.attempts) : 0,
        bestScore: q.best,
        scores: q.scores,
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

    // Présence réelle par jour (pings heartbeat, 1 ping = PING_INTERVAL_MINUTES minutes)
    const pings = await this.prisma.userActivityPing.findMany({
      where: {
        userId,
        createdAt: { gte: from, lte: to },
        ...(moduleId ? { moduleId } : {}),
      },
      select: { createdAt: true },
    });
    const minutesByDay = new Map<string, number>();
    for (const ping of pings) {
      const d = ping.createdAt;
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
      minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + PING_INTERVAL_MINUTES);
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
      progressPercent: e.completedAt != null ? 100 : e.progressPercent,
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

  /**
   * Statistiques des modules (admin) — KPIs, graphiques, tableaux drill-down.
   * Filtres: période, type de module (interne/externe), moduleId spécifique.
   */
  async adminModulesStats(params: ModulesStatsParams) {
    const { from, to } = this.computeRange(params.from, params.to);
    const moduleType = clampModuleType(params.moduleType);
    const moduleId = params.moduleId?.trim() ? params.moduleId.trim() : null;

    // Filtrer les modules par type
    const moduleWhere: Prisma.ModuleWhereInput = {
      ...(moduleType !== 'all' ? { moduleType } : {}),
      ...(moduleId ? { id: moduleId } : {}),
    };

    const allModules = await this.prisma.module.findMany({
      where: moduleWhere,
      select: { id: true, title: true, moduleType: true },
    });
    const moduleIds = allModules.map((m) => m.id);

    // KPIs de base
    const totalModules = allModules.length;

    // Étudiants et employés selon le type de module
    const studentRole = moduleType === 'interne' ? [] : ['student'];
    const employeeRole = moduleType === 'externe' ? [] : ['employee'];
    const roles = [...studentRole, ...employeeRole];
    if (roles.length === 0) roles.push('student', 'employee');

    const [totalStudents, totalEmployees] = await Promise.all([
      this.prisma.user.count({ where: { role: 'student' } }),
      this.prisma.user.count({ where: { role: 'employee' } }),
    ]);

    // Enrollments filtrés
    const enrollmentWhere: Prisma.EnrollmentWhereInput = {
      moduleId: { in: moduleIds },
    };

    const enrollments = await this.prisma.enrollment.findMany({
      where: enrollmentWhere,
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true, avatarUrl: true } },
        module: { select: { id: true, title: true } },
      },
    });

    const totalCertified = enrollments.filter((e) => e.completedAt != null).length;
    const completionRate =
      enrollments.length > 0 ? Math.round((totalCertified / enrollments.length) * 100) : 0;

    // Quiz attempts sur la période
    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        submittedAt: { gte: from, lte: to },
        quiz: { moduleId: { in: moduleIds } },
        scorePercent: { not: null },
      },
      select: {
        id: true,
        userId: true,
        quizId: true,
        scorePercent: true,
        passed: true,
        submittedAt: true,
        quiz: { select: { moduleId: true, isFinal: true, chapterId: true } },
      },
    });

    const quizzesTakenCount = attempts.length;
    const avgQuizScore =
      quizzesTakenCount > 0
        ? Math.round(
            attempts.reduce((acc, a) => acc + (a.scorePercent ?? 0), 0) / quizzesTakenCount
          )
        : null;

    // Performance par module (certifiés vs en cours)
    const modulesPerformance = allModules.map((mod) => {
      const modEnrollments = enrollments.filter((e) => e.moduleId === mod.id);
      const certified = modEnrollments.filter((e) => e.completedAt != null).length;
      const inProgress = modEnrollments.length - certified;
      const studentCertified = modEnrollments.filter(
        (e) => e.user.role === 'student' && e.completedAt != null
      ).length;
      const studentInProgress = modEnrollments.filter(
        (e) => e.user.role === 'student' && e.completedAt == null
      ).length;
      const employeeCertified = modEnrollments.filter(
        (e) => e.user.role === 'employee' && e.completedAt != null
      ).length;
      const employeeInProgress = modEnrollments.filter(
        (e) => e.user.role === 'employee' && e.completedAt == null
      ).length;

      // Meilleur score quiz final pour ce module
      const finalAttempts = attempts.filter(
        (a) => a.quiz.moduleId === mod.id && a.quiz.isFinal === true
      );
      const bestFinalScore =
        finalAttempts.length > 0 ? Math.max(...finalAttempts.map((a) => a.scorePercent ?? 0)) : 0;

      return {
        moduleId: mod.id,
        moduleTitle: mod.title,
        certified,
        inProgress,
        studentCertified,
        studentInProgress,
        employeeCertified,
        employeeInProgress,
        bestFinalScore,
      };
    });

    // Tableau modules avec quiz par chapitre
    const chapters = await this.prisma.chapter.findMany({
      where: { moduleId: { in: moduleIds } },
      select: { id: true, title: true, moduleId: true },
    });

    const quizzes = await this.prisma.quiz.findMany({
      where: { moduleId: { in: moduleIds } },
      select: { id: true, title: true, moduleId: true, chapterId: true, isFinal: true },
    });

    const modulesTable = allModules.map((mod) => {
      const modQuizzes = quizzes.filter((q) => q.moduleId === mod.id);
      const totalQuizzes = modQuizzes.length;

      // Score moyen quiz final
      const finalQuiz = modQuizzes.find((q) => q.isFinal);
      const finalAttempts = finalQuiz ? attempts.filter((a) => a.quizId === finalQuiz.id) : [];
      const avgFinalScore =
        finalAttempts.length > 0
          ? Math.round(
              finalAttempts.reduce((acc, a) => acc + (a.scorePercent ?? 0), 0) /
                finalAttempts.length
            )
          : null;

      // Quiz par chapitre
      const modChapters = chapters.filter((ch) => ch.moduleId === mod.id);
      const chaptersQuizzes = modChapters.map((ch) => {
        const chQuizzes = modQuizzes.filter((q) => q.chapterId === ch.id && !q.isFinal);
        const chAttempts = attempts.filter((a) => chQuizzes.some((q) => q.id === a.quizId));
        const avgScore =
          chAttempts.length > 0
            ? Math.round(
                chAttempts.reduce((acc, a) => acc + (a.scorePercent ?? 0), 0) / chAttempts.length
              )
            : null;
        return {
          chapterId: ch.id,
          chapterTitle: ch.title,
          quizCount: chQuizzes.length,
          avgScore,
        };
      });

      return {
        moduleId: mod.id,
        moduleTitle: mod.title,
        totalQuizzes,
        avgFinalScore,
        chaptersQuizzes,
      };
    });

    // Liste des apprenants (étudiants et employés)
    const baseLearners = enrollments
      .filter((e, idx, arr) => arr.findIndex((x) => x.user.id === e.user.id) === idx)
      .map((e) => ({
        userId: e.user.id,
        fullName: e.user.fullName,
        email: e.user.email,
        role: e.user.role,
        avatarUrl: e.user.avatarUrl,
      }));

    // Détails des scores pour le drill-down (quiz final par module)
    const finalScoreDetails = allModules.map((mod) => {
      const finalQuiz = quizzes.find((q) => q.moduleId === mod.id && q.isFinal);
      if (!finalQuiz) return { moduleId: mod.id, learners: [] };

      const finalAttempts = attempts.filter((a) => a.quizId === finalQuiz.id);
      const bestByUser = new Map<string, number>();
      for (const a of finalAttempts) {
        const prev = bestByUser.get(a.userId) ?? -1;
        if ((a.scorePercent ?? 0) > prev) bestByUser.set(a.userId, a.scorePercent ?? 0);
      }

      const learners = Array.from(bestByUser.entries()).map(([userId, bestScore]) => {
        const enrollment = enrollments.find((e) => e.user.id === userId && e.moduleId === mod.id);
        return {
          userId,
          fullName: enrollment?.user.fullName ?? 'Inconnu',
          role: enrollment?.user.role ?? 'student',
          bestScore,
        };
      });

      return { moduleId: mod.id, learners };
    });

    // Détails des scores pour le drill-down (quiz par chapitre)
    const chapterQuizDetails = chapters.map((ch) => {
      const chQuizzes = quizzes.filter((q) => q.chapterId === ch.id && !q.isFinal);
      const chAttempts = attempts.filter((a) => chQuizzes.some((q) => q.id === a.quizId));

      const bestByUser = new Map<string, number>();
      for (const a of chAttempts) {
        const prev = bestByUser.get(a.userId) ?? -1;
        if ((a.scorePercent ?? 0) > prev) bestByUser.set(a.userId, a.scorePercent ?? 0);
      }

      const learners = Array.from(bestByUser.entries()).map(([userId, bestScore]) => {
        const enrollment = enrollments.find((e) => e.user.id === userId);
        return {
          userId,
          fullName: enrollment?.user.fullName ?? 'Inconnu',
          role: enrollment?.user.role ?? 'student',
          bestScore,
        };
      });

      return { chapterId: ch.id, learners };
    });

    const learnerIds = baseLearners.map((u) => u.userId);
    const minutesByUser = new Map<string, number>();
    if (learnerIds.length > 0) {
      const pingRows = await this.prisma.userActivityPing.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: from, lte: to },
          userId: { in: learnerIds },
        },
        _count: { _all: true },
      });
      for (const row of pingRows) {
        minutesByUser.set(row.userId, row._count._all * PING_INTERVAL_MINUTES);
      }
    }

    // Score moyen par user
    const scoreAggByUser = new Map<string, { attempts: number; sum: number }>();
    for (const a of attempts) {
      const u = scoreAggByUser.get(a.userId) ?? { attempts: 0, sum: 0 };
      u.attempts += 1;
      u.sum += a.scorePercent ?? 0;
      scoreAggByUser.set(a.userId, u);
    }

    const learnersTable = baseLearners.map((u) => ({
      ...u,
      minutesLearned: minutesByUser.get(u.userId) ?? 0,
    }));
    const mostInvested = learnersTable
      .map((u) => {
        const minutesLearned = u.minutesLearned;
        const scoreAgg = scoreAggByUser.get(u.userId) ?? { attempts: 0, sum: 0 };
        const avgQuizScore =
          scoreAgg.attempts > 0 ? Math.round(scoreAgg.sum / scoreAgg.attempts) : 0;
        const engagementScore = Math.round(
          Math.min(100, minutesLearned / 5 + scoreAgg.attempts * 2)
        );
        return {
          userId: u.userId,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          avatarUrl: u.avatarUrl,
          minutesLearned,
          quizzesTaken: scoreAgg.attempts,
          avgQuizScore,
          engagementScore,
        };
      })
      .sort((a, b) => b.minutesLearned - a.minutesLearned || b.engagementScore - a.engagementScore)
      .slice(0, 8);

    return {
      filters: {
        from: from.toISOString(),
        to: to.toISOString(),
        moduleType,
        moduleId,
      },
      kpi: {
        totalModules,
        totalStudents,
        totalEmployees,
        totalCertified,
        completionRate,
        avgQuizScore,
        quizzesTakenCount,
      },
      modulesPerformance,
      modulesTable,
      learnersTable,
      mostInvested,
      finalScoreDetails,
      chapterQuizDetails,
    };
  }
}
