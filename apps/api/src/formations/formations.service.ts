/**
 * Service des modules de formation : CRUD, liste pour étudiant (avec progression si inscrit).
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateFormationDto } from './dto/create-formation.dto';
import type { UpdateFormationDto } from './dto/update-formation.dto';

@Injectable()
export class FormationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée un module de formation (admin). Le responsable est assigné via la création d'un utilisateur.
   */
  async creer(dto: CreateFormationDto): Promise<{ id: string; title: string }> {
    const module_ = await this.prisma.module.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        description: dto.description,
        imageUrl: dto.imageUrl,
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
  }): Promise<{ data: unknown[]; total: number; page: number; limit: number; totalPages: number }> {
    const { userId, role, page, limit } = params;
    const skip = (page - 1) * limit;
    const isStudent = role === 'student';
    const where = isStudent ? { enrollments: { some: { userId } } } : {};
    const [data, total] = await Promise.all([
      this.prisma.module.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { chapters: true, quizzes: true } },
          ...(isStudent
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
    const dataAvecProgression = data.map((m) => {
      const enrollment =
        isStudent &&
        (m as { enrollments?: Array<{ progressPercent: number; completedAt: Date | null }> })
          .enrollments?.[0];
      return {
        id: m.id,
        title: m.title,
        subtitle: m.subtitle,
        description: m.description,
        imageUrl: m.imageUrl,
        durationHours: 0,
        chaptersCount: m._count.chapters,
        quizCount: m._count.quizzes,
        level: m.level,
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
        chapters: {
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
    if (userId && role === 'student') {
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
    return {
      id: module_.id,
      title: module_.title,
      subtitle: module_.subtitle,
      description: module_.description,
      imageUrl: module_.imageUrl,
      teaserVideoUrl: module_.teaserVideoUrl,
      level: module_.level,
      sharePointFolderUrl: module_.sharePointFolderUrl,
      authorName: module_.authorName,
      authorBio: module_.authorBio,
      authorAvatarUrl: module_.authorAvatarUrl,
      durationHours: Math.round((dureeMinutes / 60) * 10) / 10,
      chaptersCount: module_._count.chapters,
      quizCount: module_._count.quizzes,
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
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
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
   * Supprime un module (admin uniquement en production ; ici admin ou responsable).
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
    await this.prisma.module.delete({ where: { id } });
    return { message: 'Module supprimé' };
  }

  private async calculerDureeTotaleMinutes(moduleId: string): Promise<number> {
    const items = await this.prisma.chapterItem.findMany({
      where: { chapter: { moduleId } },
      select: { durationMinutes: true },
    });
    return items.reduce((acc, i) => acc + (i.durationMinutes ?? 0), 0);
  }
}
