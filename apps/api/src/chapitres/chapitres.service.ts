/**
 * Service des chapitres et éléments : CRUD (responsable du module ou admin).
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateChapitreDto } from './dto/create-chapitre.dto';
import type { CreateChapterItemDto } from './dto/create-chapter-item.dto';

@Injectable()
export class ChapitresService {
  constructor(private readonly prisma: PrismaService) {}

  async creerChapitre(
    dto: CreateChapitreDto,
    userId: string,
    role: string
  ): Promise<{ id: string; title: string; order: number }> {
    await this.verifierDroitsModule(dto.moduleId, userId, role);
    const chapitre = await this.prisma.chapter.create({
      data: {
        moduleId: dto.moduleId,
        title: dto.title,
        order: dto.order,
      },
      select: { id: true, title: true, order: true },
    });
    return chapitre;
  }

  async creerElement(
    dto: CreateChapterItemDto,
    userId: string,
    role: string
  ): Promise<{ id: string; title: string; type: string }> {
    const chapitre = await this.prisma.chapter.findUnique({
      where: { id: dto.chapterId },
      include: { module: true },
    });
    if (!chapitre) {
      throw new NotFoundException('Chapitre introuvable');
    }
    await this.verifierDroitsModule(chapitre.moduleId, userId, role);
    const item = await this.prisma.chapterItem.create({
      data: {
        chapterId: dto.chapterId,
        type: dto.type,
        order: dto.order,
        title: dto.title,
        durationMinutes: dto.durationMinutes,
        videoUrl: dto.videoUrl,
        documentLabel: dto.documentLabel,
        documentUrl: dto.documentUrl,
        quizId: dto.quizId,
      },
      select: { id: true, title: true, type: true },
    });
    return item;
  }

  async trouverParModule(moduleId: string, userId: string, role: string): Promise<unknown[]> {
    const lectureSeulement = role === 'student';
    await this.verifierDroitsModule(moduleId, userId, role, lectureSeulement);
    const chapitres = await this.prisma.chapter.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
      include: {
        items: { orderBy: { order: 'asc' } },
        quizzes: true,
      },
    });
    return chapitres;
  }

  async trouverUnChapitre(chapitreId: string, userId: string, role: string): Promise<unknown> {
    const chapitre = await this.prisma.chapter.findUnique({
      where: { id: chapitreId },
      include: { module: true, items: { orderBy: { order: 'asc' } }, quizzes: true },
    });
    if (!chapitre) {
      throw new NotFoundException('Chapitre introuvable');
    }
    const lectureSeulement = role === 'student';
    await this.verifierDroitsModule(chapitre.moduleId, userId, role, lectureSeulement);
    return chapitre;
  }

  private async verifierDroitsModule(
    moduleId: string,
    userId: string,
    role: string,
    lectureSeulement = false
  ): Promise<void> {
    const module_ = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module_) {
      throw new NotFoundException('Module introuvable');
    }
    const peutModifier =
      role === 'admin' || role === 'platform_manager' || module_.managerId === userId;
    if (peutModifier) {
      return;
    }
    if (lectureSeulement && role === 'student') {
      const inscription = await this.prisma.enrollment.findFirst({
        where: { userId, moduleId },
      });
      if (inscription) {
        return;
      }
    }
    throw new ForbiddenException('Vous ne pouvez pas accéder à ce module');
  }
}
