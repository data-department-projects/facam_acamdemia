/**
 * Service des inscriptions : création (admin), liste par utilisateur, mise à jour position.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import type { UpdateProgressionDto } from './dto/update-progression.dto';

function isAdminLike(role: string, roles?: string[]): boolean {
  const all = roles?.length ? roles : [role];
  return all.includes('admin') || all.includes('platform_manager');
}

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Démarre un module pour l'utilisateur courant (étudiant/employé) : crée une inscription
   * si elle n'existe pas. Idempotent : si déjà inscrit, retourne l'inscription existante.
   */
  async demarrerModule(
    moduleId: string,
    userId: string,
    role: string
  ): Promise<{ id: string; moduleId: string; alreadyEnrolled: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true, role: true },
    });
    const userRoles = user?.roles?.length ? user.roles : user?.role ? [user.role] : [role];
    const isLearner = userRoles.includes('student') || userRoles.includes('employee');
    if (!isLearner) {
      throw new ForbiddenException('Seuls les étudiants et employés peuvent démarrer un module');
    }
    const module_ = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module_) {
      throw new NotFoundException('Module introuvable');
    }
    const existing = await this.prisma.enrollment.findFirst({
      where: { userId, moduleId },
      select: { id: true, moduleId: true },
    });
    if (existing) {
      return {
        id: existing.id,
        moduleId: existing.moduleId,
        alreadyEnrolled: true,
      };
    }
    const enrollment = await this.prisma.enrollment.create({
      data: { userId, moduleId },
      select: { id: true, moduleId: true },
    });
    return {
      id: enrollment.id,
      moduleId: enrollment.moduleId,
      alreadyEnrolled: false,
    };
  }

  /**
   * Inscrit un étudiant à un module (admin uniquement).
   */
  async creer(dto: CreateEnrollmentDto): Promise<{ id: string; userId: string; moduleId: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, role: true, roles: true },
    });
    const targetRoles = user?.roles?.length ? user.roles : user?.role ? [user.role] : [];
    const estApprenant = targetRoles.includes('student') || targetRoles.includes('employee');
    if (!user || !estApprenant) {
      throw new NotFoundException('Apprenant introuvable');
    }
    const module_ = await this.prisma.module.findUnique({ where: { id: dto.moduleId } });
    if (!module_) {
      throw new NotFoundException('Module introuvable');
    }
    const existe = await this.prisma.enrollment.findFirst({
      where: { userId: dto.userId, moduleId: dto.moduleId },
    });
    if (existe) {
      throw new ConflictException('Cet étudiant est déjà inscrit à ce module');
    }
    const enrollment = await this.prisma.enrollment.create({
      data: { userId: dto.userId, moduleId: dto.moduleId },
      select: { id: true, userId: true, moduleId: true },
    });
    return enrollment;
  }

  /**
   * Liste les inscriptions de l'utilisateur courant (ou d'un étudiant pour admin).
   */
  async trouverPourUtilisateur(
    userId: string,
    role: string,
    userIdCible?: string,
    roles?: string[]
  ): Promise<unknown[]> {
    const id = userIdCible ?? userId;
    if (userIdCible && !isAdminLike(role, roles)) {
      throw new ForbiddenException('Accès refusé');
    }
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: id },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            authorName: true,
            _count: { select: { chapters: true } },
          },
        },
      },
    });
    return enrollments.map((e) => ({
      id: e.id,
      moduleId: e.moduleId,
      progressPercent: e.completedAt ? 100 : e.progressPercent,
      lastViewedChapterId: e.lastViewedChapterId,
      lastViewedItemId: e.lastViewedItemId,
      completedAt: e.completedAt?.toISOString() ?? null,
      enrolledAt: e.enrolledAt.toISOString(),
      module: e.module,
    }));
  }

  /**
   * Met à jour la position de lecture (dernier chapitre / élément vu) et recalcule le pourcentage.
   */
  async mettreAJourProgression(
    enrollmentId: string,
    dto: UpdateProgressionDto,
    userId: string,
    role: string,
    roles?: string[]
  ): Promise<{ progressPercent: number }> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { module: { include: { chapters: { include: { items: true } } } } },
    });
    if (!enrollment) {
      throw new NotFoundException('Inscription introuvable');
    }
    if (enrollment.userId !== userId && !isAdminLike(role, roles)) {
      throw new ForbiddenException('Accès refusé');
    }
    const totalItems = enrollment.module.chapters.reduce((acc, ch) => acc + ch.items.length, 0);
    let progressPercent = enrollment.progressPercent;
    await this.prisma.$transaction(async (tx) => {
      if (dto.lastViewedItemId && totalItems > 0) {
        const completed = await tx.enrollmentProgress.count({ where: { enrollmentId } });
        progressPercent = Math.min(100, Math.round((completed / totalItems) * 100));
      }
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          ...(dto.lastViewedChapterId !== undefined && {
            lastViewedChapterId: dto.lastViewedChapterId,
          }),
          ...(dto.lastViewedItemId !== undefined && { lastViewedItemId: dto.lastViewedItemId }),
          progressPercent,
        },
      });
    });
    return { progressPercent };
  }

  /**
   * Marque un élément de chapitre comme complété pour une inscription.
   */
  async marquerElementComplété(
    enrollmentId: string,
    chapterItemId: string,
    userId: string,
    role: string,
    roles?: string[]
  ): Promise<{ completed: boolean }> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { module: { include: { chapters: { include: { items: true } } } } },
    });
    if (!enrollment) {
      throw new NotFoundException('Inscription introuvable');
    }
    if (enrollment.userId !== userId && !isAdminLike(role, roles)) {
      throw new ForbiddenException('Accès refusé');
    }
    const itemAppartientAuModule = enrollment.module.chapters.some((ch) =>
      ch.items.some((it) => it.id === chapterItemId)
    );
    if (!itemAppartientAuModule) {
      throw new NotFoundException('Élément introuvable dans ce module');
    }
    const totalItems = enrollment.module.chapters.reduce((acc, ch) => acc + ch.items.length, 0);
    await this.prisma.$transaction(async (tx) => {
      await tx.enrollmentProgress.upsert({
        where: { enrollmentId_chapterItemId: { enrollmentId, chapterItemId } },
        create: { enrollmentId, chapterItemId },
        update: {},
      });
      const completed = await tx.enrollmentProgress.count({ where: { enrollmentId } });
      const progressPercent =
        totalItems > 0 ? Math.min(100, Math.round((completed / totalItems) * 100)) : 0;
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: { progressPercent },
      });
    });
    return { completed: true };
  }

  /**
   * Retourne la liste des éléments complétés (chapterItemId) pour une inscription.
   * Utilisé par le front pour afficher la progression réelle dans le sommaire (sidebar).
   */
  async listerElementsCompletes(
    enrollmentId: string,
    userId: string,
    role: string,
    roles?: string[]
  ): Promise<{ chapterItemIds: string[] }> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, userId: true },
    });
    if (!enrollment) {
      throw new NotFoundException('Inscription introuvable');
    }
    if (enrollment.userId !== userId && !isAdminLike(role, roles)) {
      throw new ForbiddenException('Accès refusé');
    }
    const rows = await this.prisma.enrollmentProgress.findMany({
      where: { enrollmentId },
      select: { chapterItemId: true },
    });
    return { chapterItemIds: rows.map((r) => r.chapterItemId) };
  }

  /**
   * Enregistre un ping d'activité (heartbeat toutes les 2 min depuis le frontend).
   * Rate-limited : un seul ping par utilisateur par minute est conservé.
   */
  async enregistrerPing(
    userId: string,
    moduleId?: string,
    enrollmentId?: string
  ): Promise<{ ok: boolean }> {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recent = await this.prisma.userActivityPing.count({
      where: { userId, createdAt: { gte: oneMinuteAgo } },
    });
    if (recent > 0) return { ok: true };
    await this.prisma.userActivityPing.create({
      data: { userId, moduleId: moduleId ?? null, enrollmentId: enrollmentId ?? null },
    });
    return { ok: true };
  }

  /**
   * Compte des inscriptions complétées (admin / platform_manager) pour le dashboard.
   */
  async compterCompletions(): Promise<{ totalCompletions: number }> {
    const totalCompletions = await this.prisma.enrollment.count({
      where: { completedAt: { not: null } },
    });
    return { totalCompletions };
  }

  /**
   * Récupère une inscription par ID.
   */
  async trouverUn(
    enrollmentId: string,
    userId: string,
    role: string,
    roles?: string[]
  ): Promise<unknown> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { module: true },
    });
    if (!enrollment) {
      throw new NotFoundException('Inscription introuvable');
    }
    if (enrollment.userId !== userId && !isAdminLike(role, roles)) {
      throw new ForbiddenException('Accès refusé');
    }
    return {
      ...enrollment,
      completedAt: enrollment.completedAt?.toISOString() ?? null,
      enrolledAt: enrollment.enrolledAt.toISOString(),
    };
  }
}
