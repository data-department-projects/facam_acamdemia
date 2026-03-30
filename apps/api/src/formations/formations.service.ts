/**
 * Service des modules de formation : CRUD, liste pour étudiant (avec progression si inscrit).
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppStorageService } from '../storage/app-storage.service';
import type { CreateFormationDto } from './dto/create-formation.dto';
import type { UpdateFormationDto } from './dto/update-formation.dto';

/** Normalise moduleType en minuscules pour cohérence avec le schéma (interne | externe). */
function normalizeModuleType(value: string | null | undefined): string | null {
  if (value == null || typeof value !== 'string') return null;
  const lower = value.toLowerCase();
  return lower === 'interne' || lower === 'externe' ? lower : null;
}

@Injectable()
export class FormationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appStorage: AppStorageService
  ) {}

  /**
   * Crée un module de formation (admin). Le responsable est assigné via la création d'un utilisateur.
   */
  async creer(dto: CreateFormationDto): Promise<{ id: string; title: string }> {
    const module_ = await this.prisma.module.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        description: dto.description,
        moduleType: dto.moduleType ?? null,
        teaserVideoUrl: dto.teaserVideoUrl,
        level: dto.level,
        sharePointFolderUrl: dto.sharePointFolderUrl,
        authorName: dto.authorName,
        authorBio: dto.authorBio,
        authorAvatarUrl: dto.authorAvatarUrl,
      },
      select: { id: true, title: true },
    });
    return module_;
  }

  /**
   * Liste tous les modules (étudiant : ceux auxquels il est inscrit ; admin : tous).
   */
  async trouverTous(params: {
    userId: string;
    role: string;
    page: number;
    limit: number;
    catalogue?: boolean;
  }): Promise<{ data: unknown[]; total: number; page: number; limit: number; totalPages: number }> {
    const { userId, role, page, limit, catalogue } = params;
    const skip = (page - 1) * limit;
    const isStudent = role === 'student';
    const isEmployee = role === 'employee';
    const isLearner = isStudent || isEmployee;
    const isModuleManager =
      role === 'module_manager_internal' || role === 'module_manager_external';
    // moduleType en base peut être un ENUM (EXTERNE/INTERNE) ou texte (externe/interne) : on accepte les deux.
    const where: Prisma.ModuleWhereInput = {};
    if (isModuleManager) {
      where.managerId = userId;
      // Ne pas filtrer par moduleType : le responsable ne gère qu'un seul module (celui assigné par l'admin).
    } else if ((isStudent || isEmployee) && !catalogue) {
      where.enrollments = { some: { userId } };
      if (isStudent) where.moduleType = { in: ['externe', 'EXTERNE'] };
      else if (isEmployee) where.moduleType = { in: ['interne', 'INTERNE'] };
    } else if (catalogue) {
      if (isStudent) where.moduleType = { in: ['externe', 'EXTERNE'] };
      else if (isEmployee) where.moduleType = { in: ['interne', 'INTERNE'] };
    }
    const [data, total] = await Promise.all([
      this.prisma.module.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { chapters: true, quizzes: true } },
          ...(isLearner
            ? {
                enrollments: {
                  where: { userId },
                  select: {
                    progressPercent: true,
                    lastViewedChapterId: true,
                    completedAt: true,
                  },
                },
              }
            : {}),
        },
      }),
      this.prisma.module.count({ where }),
    ]);
    const moduleIds = data.map((m) => m.id);
    const firstVideoByModule = await this.getFirstVideoUrlByModuleIds(moduleIds);
    const dataAvecProgression = data.map((m) => {
      const enrollment =
        isLearner &&
        (m as { enrollments?: Array<{ progressPercent: number; completedAt: Date | null }> })
          .enrollments?.[0];
      return {
        id: m.id,
        title: m.title,
        subtitle: m.subtitle,
        description: m.description,
        prerequisites: m.prerequisites ?? null,
        imageUrl: m.imageUrl,
        firstVideoUrl: firstVideoByModule[m.id] ?? null,
        durationHours: 0,
        chaptersCount: m._count.chapters,
        quizCount: m._count.quizzes,
        level: m.level,
        moduleType: normalizeModuleType((m as { moduleType?: string | null }).moduleType),
        learningObjectives:
          (m as { learningObjectives?: string | null }).learningObjectives ?? null,
        authorName: m.authorName,
        ...(enrollment
          ? {
              progress: enrollment.progressPercent,
              completedAt: enrollment.completedAt?.toISOString() ?? null,
            }
          : {}),
      };
    });
    const totalPages = Math.ceil(total / limit) || 1;
    return { data: dataAvecProgression, total, page, limit, totalPages };
  }

  /**
   * Récupère un module par ID (détail pour page présentation).
   */
  async trouverUn(id: string, userId?: string, role?: string): Promise<unknown> {
    const module_ = await this.prisma.module.findUnique({
      where: { id },
      include: {
        courses: {
          orderBy: { order: 'asc' },
          include: {
            chapters: {
              orderBy: { order: 'asc' },
              include: { items: { orderBy: { order: 'asc' } }, quizzes: true },
            },
          },
        },
        chapters: {
          where: { courseId: null },
          orderBy: { order: 'asc' },
          include: { items: { orderBy: { order: 'asc' } }, quizzes: true },
        },
        _count: { select: { chapters: true, quizzes: true } },
      },
    });
    if (!module_) {
      throw new NotFoundException('Module introuvable');
    }
    let enrollment = null;
    if (userId && (role === 'student' || role === 'employee')) {
      enrollment = await this.prisma.enrollment.findFirst({
        where: { userId, moduleId: id },
        select: {
          progressPercent: true,
          lastViewedChapterId: true,
          lastViewedItemId: true,
          completedAt: true,
        },
      });
    }
    const dureeMinutes = await this.calculerDureeTotaleMinutes(id);
    const finalQuiz = await this.prisma.quiz.findFirst({
      where: { moduleId: id, isFinal: true },
      select: { id: true },
    });
    const firstVideoByModule = await this.getFirstVideoUrlByModuleIds([id]);
    return {
      id: module_.id,
      title: module_.title,
      subtitle: module_.subtitle,
      description: module_.description,
      prerequisites: module_.prerequisites ?? null,
      learningObjectives:
        (module_ as { learningObjectives?: string | null }).learningObjectives ?? null,
      moduleType: normalizeModuleType(module_.moduleType),
      imageUrl: module_.imageUrl,
      firstVideoUrl: firstVideoByModule[id] ?? null,
      teaserVideoUrl: module_.teaserVideoUrl,
      level: module_.level,
      sharePointFolderUrl: module_.sharePointFolderUrl,
      authorName: module_.authorName,
      authorBio: module_.authorBio,
      authorAvatarUrl: module_.authorAvatarUrl,
      durationHours: Math.round((dureeMinutes / 60) * 10) / 10,
      chaptersCount: module_._count.chapters,
      quizCount: module_._count.quizzes,
      finalQuizId: finalQuiz?.id ?? null,
      courses: (module_ as { courses?: unknown[] }).courses,
      chapters: module_.chapters,
      ...(enrollment
        ? {
            progress: enrollment.progressPercent,
            lastViewedChapterId: enrollment.lastViewedChapterId,
            lastViewedItemId: enrollment.lastViewedItemId,
            completedAt: enrollment.completedAt?.toISOString() ?? null,
          }
        : {}),
    };
  }

  /**
   * Image de couverture : upload Supabase (`images/modules/{moduleId}/…`), remplace l’URL en base et supprime l’ancien fichier si c’était notre storage.
   */
  async telechargerCouvertureModule(
    moduleId: string,
    file: { buffer: Buffer; mimetype: string },
    userId: string,
    role: string
  ): Promise<{ imageUrl: string }> {
    this.appStorage.assertReady();
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier image vide ou invalide.');
    }
    const ext = this.appStorage.extForModuleImageMime(file.mimetype);
    if (!ext) {
      throw new BadRequestException('Format non accepté pour la couverture : JPG, PNG ou WebP.');
    }
    const module_ = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module_) {
      throw new NotFoundException('Module introuvable');
    }
    const peutModifier =
      role === 'admin' || role === 'platform_manager' || module_.managerId === userId;
    if (!peutModifier) {
      throw new ForbiddenException('Vous ne pouvez pas modifier ce module');
    }
    const previousUrl = module_.imageUrl;
    let publicUrl: string;
    try {
      const uploaded = await this.appStorage.uploadModuleCoverImage(
        moduleId,
        file.buffer,
        file.mimetype
      );
      publicUrl = uploaded.publicUrl;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Échec du téléversement';
      throw new InternalServerErrorException(msg);
    }
    await this.prisma.module.update({
      where: { id: moduleId },
      data: { imageUrl: publicUrl },
    });
    if (previousUrl) {
      await this.appStorage.removeModuleCoverImageByUrlIfOwned(previousUrl, moduleId);
    }
    return { imageUrl: publicUrl };
  }

  /**
   * Met à jour un module (admin ou responsable de ce module).
   */
  async mettreAJour(
    id: string,
    dto: UpdateFormationDto,
    userId: string,
    role: string
  ): Promise<{ id: string; title: string }> {
    const module_ = await this.prisma.module.findUnique({ where: { id } });
    if (!module_) {
      throw new NotFoundException('Module introuvable');
    }
    const peutModifier =
      role === 'admin' || role === 'platform_manager' || module_.managerId === userId;
    if (!peutModifier) {
      throw new ForbiddenException('Vous ne pouvez pas modifier ce module');
    }
    const updated = await this.prisma.module.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.moduleType !== undefined && { moduleType: dto.moduleType }),
        ...(dto.prerequisites !== undefined && { prerequisites: dto.prerequisites }),
        ...(dto.learningObjectives !== undefined && {
          learningObjectives: dto.learningObjectives,
        }),
        ...(dto.teaserVideoUrl !== undefined && { teaserVideoUrl: dto.teaserVideoUrl }),
        ...(dto.level !== undefined && { level: dto.level }),
        ...(dto.sharePointFolderUrl !== undefined && {
          sharePointFolderUrl: dto.sharePointFolderUrl,
        }),
        ...(dto.authorName !== undefined && { authorName: dto.authorName }),
        ...(dto.authorBio !== undefined && { authorBio: dto.authorBio }),
        ...(dto.authorAvatarUrl !== undefined && { authorAvatarUrl: dto.authorAvatarUrl }),
      },
      select: { id: true, title: true },
    });
    return updated;
  }

  /**
   * Supprime un module (admin ou responsable). Si le module a un responsable assigné,
   * celui-ci est également supprimé pour garder la cohérence des données.
   */
  async supprimer(id: string, userId: string, role: string): Promise<{ message: string }> {
    const module_ = await this.prisma.module.findUnique({ where: { id } });
    if (!module_) {
      throw new NotFoundException('Module introuvable');
    }
    const peutSupprimer =
      role === 'admin' || role === 'platform_manager' || module_.managerId === userId;
    if (!peutSupprimer) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer ce module');
    }
    const managerId = module_.managerId;
    await this.prisma.module.delete({ where: { id } });
    if (managerId) {
      await this.prisma.user.delete({ where: { id: managerId } }).catch(() => {
        // Ignore si l'utilisateur a déjà été supprimé (évite erreur en cas de race)
      });
    }
    return { message: 'Module supprimé' };
  }

  /**
   * Retourne la première vidéo (URL YouTube) par module pour utiliser comme image de présentation.
   * Ordre : premier chapitre (order), premier item vidéo (order).
   */
  private async getFirstVideoUrlByModuleIds(moduleIds: string[]): Promise<Record<string, string>> {
    if (moduleIds.length === 0) return {};
    const items = await this.prisma.chapterItem.findMany({
      where: {
        type: 'video',
        videoUrl: { not: null },
        chapter: { moduleId: { in: moduleIds } },
      },
      orderBy: [{ chapter: { order: 'asc' } }, { order: 'asc' }],
      select: {
        videoUrl: true,
        chapter: { select: { moduleId: true } },
      },
    });
    const result: Record<string, string> = {};
    for (const item of items) {
      const moduleId = (item.chapter as { moduleId: string }).moduleId;
      if (moduleId && !result[moduleId] && item.videoUrl) {
        result[moduleId] = item.videoUrl;
      }
    }
    return result;
  }

  private async calculerDureeTotaleMinutes(moduleId: string): Promise<number> {
    const items = await this.prisma.chapterItem.findMany({
      where: { chapter: { moduleId } },
      select: { durationMinutes: true },
    });
    return items.reduce((acc, i) => acc + (i.durationMinutes ?? 0), 0);
  }

  /**
   * Statistiques dashboard pour le responsable de module (uniquement ses modules).
   * KPIs, graphique fin / en cours, par chapitre, inscriptions par mois, tableau étudiants.
   */
  async statsDashboard(
    userId: string,
    role: string,
    year?: number
  ): Promise<{
    totalModules: number;
    totalEnrolled: number;
    completionRate: number;
    avgQuizScore: number | null;
    pie: {
      finished: number;
      inProgress: number;
      finishedPercent: number;
      inProgressPercent: number;
    };
    byChapter: { chapterId: string; chapterTitle: string; order: number; count: number }[];
    enrollmentsByMonth: { month: number; count: number }[];
    studentsTable: {
      enrollmentId: string;
      userId: string;
      fullName: string;
      email: string;
      progressPercent: number;
      completedAt: string | null;
      quizzesCompleted: number;
      totalQuizzes: number;
      finalQuizScore: number | null;
      finalQuizPassedAt: string | null;
    }[];
  }> {
    const isManager = role === 'module_manager_internal' || role === 'module_manager_external';
    const moduleWhereFinal: Prisma.ModuleWhereInput = isManager ? { managerId: userId } : {};
    const moduleIds = (
      await this.prisma.module.findMany({
        where: moduleWhereFinal,
        select: { id: true },
      })
    ).map((m) => m.id);

    const totalModules = moduleIds.length;
    if (totalModules === 0) {
      return {
        totalModules: 0,
        totalEnrolled: 0,
        completionRate: 0,
        avgQuizScore: null,
        pie: { finished: 0, inProgress: 0, finishedPercent: 0, inProgressPercent: 0 },
        byChapter: [],
        enrollmentsByMonth: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 })),
        studentsTable: [],
      };
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { moduleId: { in: moduleIds } },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        module: {
          select: {
            id: true,
            _count: { select: { quizzes: true } },
          },
        },
      },
    });

    const totalEnrolled = enrollments.length;
    const finished = enrollments.filter((e) => e.completedAt != null).length;
    const completionRate = totalEnrolled > 0 ? Math.round((finished / totalEnrolled) * 100) : 0;

    const quizAttempts = await this.prisma.quizAttempt.findMany({
      where: {
        quiz: { moduleId: { in: moduleIds }, isFinal: false },
        scorePercent: { not: null },
      },
      select: { scorePercent: true },
    });
    const avgQuizScore =
      quizAttempts.length > 0
        ? Math.round(
            quizAttempts.reduce((acc, a) => acc + (a.scorePercent ?? 0), 0) / quizAttempts.length
          )
        : null;

    const finishedPercent = totalEnrolled > 0 ? Math.round((finished / totalEnrolled) * 100) : 0;
    const inProgressPercent = totalEnrolled > 0 ? 100 - finishedPercent : 0;

    const chapters = await this.prisma.chapter.findMany({
      where: { moduleId: { in: moduleIds } },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, order: true },
    });
    const byChapter = chapters.map((ch) => ({
      chapterId: ch.id,
      chapterTitle: ch.title,
      order: ch.order,
      count: enrollments.filter((e) => e.lastViewedChapterId === ch.id).length,
    }));

    const yearFilter = year ?? new Date().getFullYear();
    const enrollmentsWithDate = await this.prisma.enrollment.findMany({
      where: {
        moduleId: { in: moduleIds },
        enrolledAt: {
          gte: new Date(yearFilter, 0, 1),
          lt: new Date(yearFilter + 1, 0, 1),
        },
      },
      select: { enrolledAt: true },
    });
    const monthCounts: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) monthCounts[m] = 0;
    for (const e of enrollmentsWithDate) {
      const m = e.enrolledAt.getMonth() + 1;
      monthCounts[m] = (monthCounts[m] ?? 0) + 1;
    }
    const enrollmentsByMonth = Object.entries(monthCounts).map(([month, count]) => ({
      month: Number(month),
      count,
    }));

    const enrollmentIds = enrollments.map((e) => e.id);
    const attemptsByEnrollment = await this.prisma.quizAttempt.groupBy({
      by: ['enrollmentId', 'quizId'],
      where: {
        enrollmentId: { in: enrollmentIds },
        passed: true,
      },
    });
    const quizzesCompletedByEnrollment: Record<string, Set<string>> = {};
    for (const a of attemptsByEnrollment) {
      if (!a.enrollmentId) continue;
      if (!quizzesCompletedByEnrollment[a.enrollmentId])
        quizzesCompletedByEnrollment[a.enrollmentId] = new Set();
      quizzesCompletedByEnrollment[a.enrollmentId].add(a.quizId);
    }

    // Score final = dernière tentative réussie du quiz final (QCM), score en %
    const finalAttempts = await this.prisma.quizAttempt.findMany({
      where: {
        enrollmentId: { in: enrollmentIds },
        passed: true,
        quiz: { isFinal: true },
      },
      include: { quiz: { select: { moduleId: true } } },
      orderBy: { submittedAt: 'desc' },
    });
    const finalByEnrollment: Record<string, { scorePercent: number; submittedAt: Date }> = {};
    for (const e of enrollments) {
      const attempt = finalAttempts.find(
        (a) => a.enrollmentId === e.id && a.quiz.moduleId === e.moduleId
      );
      if (attempt) {
        finalByEnrollment[e.id] = {
          scorePercent: attempt.scorePercent ?? 0,
          submittedAt: attempt.submittedAt,
        };
      }
    }

    const studentsTable = enrollments.map((e) => {
      const quizCount = (e.module as { _count?: { quizzes: number } })._count?.quizzes ?? 0;
      const completedSet = quizzesCompletedByEnrollment[e.id];
      const quizzesCompleted = completedSet ? completedSet.size : 0;
      const finalInfo = finalByEnrollment[e.id];
      return {
        enrollmentId: e.id,
        userId: e.user.id,
        fullName: e.user.fullName,
        email: e.user.email,
        progressPercent: e.progressPercent,
        completedAt: e.completedAt?.toISOString() ?? null,
        quizzesCompleted,
        totalQuizzes: quizCount,
        finalQuizScore: finalInfo?.scorePercent ?? null,
        finalQuizPassedAt: finalInfo?.submittedAt?.toISOString() ?? null,
      };
    });

    return {
      totalModules,
      totalEnrolled,
      completionRate,
      avgQuizScore,
      pie: {
        finished,
        inProgress: totalEnrolled - finished,
        finishedPercent,
        inProgressPercent,
      },
      byChapter,
      enrollmentsByMonth,
      studentsTable,
    };
  }

  /**
   * Détail d'un étudiant pour la page Stats : progression, score final (%), scores par quiz de chapitre.
   */
  async statsStudentDetail(
    enrollmentId: string,
    userId: string,
    role: string
  ): Promise<{
    fullName: string;
    progressPercent: number;
    finalQuizScore: number | null;
    finalQuizPassedAt: string | null;
    chapterScores: { chapterTitle: string; scorePercent: number }[];
  }> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: { select: { fullName: true } },
        module: {
          select: { id: true, managerId: true },
        },
      },
    });
    if (!enrollment) {
      throw new NotFoundException('Inscription introuvable');
    }
    const module_ = enrollment.module as { id: string; managerId: string | null };
    const peutVoir =
      role === 'admin' || role === 'platform_manager' || module_.managerId === userId;
    if (!peutVoir) {
      throw new ForbiddenException('Accès refusé');
    }
    const finalAttempt = await this.prisma.quizAttempt.findFirst({
      where: {
        enrollmentId,
        passed: true,
        quiz: { moduleId: module_.id, isFinal: true },
      },
      orderBy: { submittedAt: 'desc' },
      select: { scorePercent: true, submittedAt: true },
    });
    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        enrollmentId,
        quiz: { moduleId: module_.id, isFinal: false },
      },
      include: {
        quiz: {
          include: {
            chapter: { select: { title: true } },
          },
        },
      },
    });
    const chapterScores = attempts.map((a) => ({
      chapterTitle: (a.quiz.chapter as { title: string } | null)?.title ?? 'Quiz',
      scorePercent: a.scorePercent ?? 0,
    }));
    return {
      fullName: enrollment.user.fullName,
      progressPercent: enrollment.progressPercent,
      finalQuizScore: finalAttempt?.scorePercent ?? null,
      finalQuizPassedAt: finalAttempt?.submittedAt?.toISOString() ?? null,
      chapterScores,
    };
  }
}
