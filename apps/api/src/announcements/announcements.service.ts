/**
 * Service messages de module : envoi (responsable) + lecture (apprenants).
 *
 * Règles :
 * - Un responsable de module ne peut envoyer que sur SON module (Module.managerId).
 * - Étudiants/employés : lecture uniquement des messages des modules où ils sont inscrits.
 */

import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES, type RoleType } from '../core/constants';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async sendFromManager(userId: string, role: RoleType, content: string): Promise<{ id: string }> {
    if (role !== ROLES.MODULE_MANAGER_INTERNAL && role !== ROLES.MODULE_MANAGER_EXTERNAL) {
      throw new ForbiddenException('Accès refusé');
    }

    const module_ = await this.prisma.module.findFirst({
      where: { managerId: userId },
      select: { id: true },
    });
    if (!module_) {
      throw new NotFoundException("Aucun module n'est associé à ce compte responsable.");
    }

    const row = await this.prisma.moduleAnnouncement.create({
      data: { moduleId: module_.id, authorId: userId, content },
      select: { id: true },
    });
    return row;
  }

  async listSentByManager(
    userId: string,
    role: RoleType
  ): Promise<{ id: string; content: string; createdAt: string; moduleId: string }[]> {
    if (role !== ROLES.MODULE_MANAGER_INTERNAL && role !== ROLES.MODULE_MANAGER_EXTERNAL) {
      throw new ForbiddenException('Accès refusé');
    }

    const module_ = await this.prisma.module.findFirst({
      where: { managerId: userId },
      select: { id: true },
    });
    if (!module_) return [];

    const rows = await this.prisma.moduleAnnouncement.findMany({
      where: { moduleId: module_.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, moduleId: true, content: true, createdAt: true },
      take: 200,
    });
    return rows.map((r) => ({
      id: r.id,
      moduleId: r.moduleId,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async listForLearner(
    userId: string,
    role: RoleType
  ): Promise<
    {
      id: string;
      content: string;
      createdAt: string;
      moduleId: string;
      moduleTitle: string;
      isRead: boolean;
    }[]
  > {
    if (role !== ROLES.STUDENT && role !== ROLES.EMPLOYEE) {
      throw new ForbiddenException('Accès refusé');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      select: { moduleId: true },
    });
    const moduleIds = Array.from(new Set(enrollments.map((e) => e.moduleId)));
    if (moduleIds.length === 0) return [];

    const rows = await this.prisma.moduleAnnouncement.findMany({
      where: { moduleId: { in: moduleIds } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        moduleId: true,
        content: true,
        createdAt: true,
        module: { select: { title: true } },
      },
      take: 200,
    });

    const ids = rows.map((r) => r.id);
    const reads = ids.length
      ? await this.prisma.moduleAnnouncementRead.findMany({
          where: { userId, announcementId: { in: ids } },
          select: { announcementId: true },
        })
      : [];
    const readSet = new Set(reads.map((r) => r.announcementId));

    return rows.map((r) => ({
      id: r.id,
      moduleId: r.moduleId,
      moduleTitle: r.module.title,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      isRead: readSet.has(r.id),
    }));
  }

  async unreadCountForLearner(userId: string, role: RoleType): Promise<{ unreadCount: number }> {
    if (role !== ROLES.STUDENT && role !== ROLES.EMPLOYEE) {
      throw new ForbiddenException('Accès refusé');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      select: { moduleId: true },
    });
    const moduleIds = Array.from(new Set(enrollments.map((e) => e.moduleId)));
    if (moduleIds.length === 0) return { unreadCount: 0 };

    const announcements = await this.prisma.moduleAnnouncement.findMany({
      where: { moduleId: { in: moduleIds } },
      select: { id: true },
      take: 500,
    });
    const ids = announcements.map((a) => a.id);
    if (ids.length === 0) return { unreadCount: 0 };

    const readCount = await this.prisma.moduleAnnouncementRead.count({
      where: { userId, announcementId: { in: ids } },
    });
    return { unreadCount: Math.max(0, ids.length - readCount) };
  }

  async markReadForLearner(
    userId: string,
    role: RoleType,
    ids: string[]
  ): Promise<{ ok: true; marked: number }> {
    if (role !== ROLES.STUDENT && role !== ROLES.EMPLOYEE) {
      throw new ForbiddenException('Accès refusé');
    }
    const uniqueIds = Array.from(new Set((ids ?? []).filter((id) => typeof id === 'string' && id)));
    if (uniqueIds.length === 0) return { ok: true, marked: 0 };

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      select: { moduleId: true },
    });
    const moduleIds = Array.from(new Set(enrollments.map((e) => e.moduleId)));
    if (moduleIds.length === 0) return { ok: true, marked: 0 };

    const allowed = await this.prisma.moduleAnnouncement.findMany({
      where: { id: { in: uniqueIds }, moduleId: { in: moduleIds } },
      select: { id: true },
    });
    const allowedIds = allowed.map((a) => a.id);
    if (allowedIds.length === 0) return { ok: true, marked: 0 };

    const created = await this.prisma.moduleAnnouncementRead.createMany({
      data: allowedIds.map((announcementId) => ({ announcementId, userId })),
      skipDuplicates: true,
    });
    return { ok: true, marked: created.count };
  }
}
