/**
 * Service des chapitres et éléments : CRUD (responsable du module ou admin).
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateChapitreDto } from './dto/create-chapitre.dto';
import type { UpdateChapitreDto } from './dto/update-chapitre.dto';
import type { CreateChapterItemDto } from './dto/create-chapter-item.dto';

@Injectable()
export class ChapitresService {
  constructor(private readonly prisma: PrismaService) {}

  async creerChapitre(
    dto: CreateChapitreDto,
    userId: string,
    role: string
  ): Promise<{ id: string; title: string; order: number }> {
    let moduleId: string;
    const courseId = dto.courseId ?? null;
    if (courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: { module: true },
      });
      if (!course) {
        throw new NotFoundException('Cours introuvable');
      }
      moduleId = course.moduleId;
      await this.verifierDroitsModule(moduleId, userId, role);
    } else {
      if (!dto.moduleId) {
        throw new NotFoundException('moduleId ou courseId requis');
      }
      moduleId = dto.moduleId;
      await this.verifierDroitsModule(moduleId, userId, role);
    }

    const chapitre = await this.prisma.chapter.create({
      data: {
        moduleId,
        courseId,
        title: dto.title,
        description: dto.description ?? null,
        order: dto.order,
      },
      select: { id: true, title: true, order: true },
    });

    let itemOrder = 1;
    if (dto.videoUrl) {
      await this.prisma.chapterItem.create({
        data: {
          chapterId: chapitre.id,
          type: 'video',
          order: itemOrder++,
          title: dto.videoTitle?.trim() || dto.title,
          videoUrl: dto.videoUrl.trim(),
        },
      });
    }

    if (dto.quizQuestions && dto.quizQuestions.length > 0) {
      const minScore = Math.min(100, Math.max(0, dto.minScoreToPass ?? 70));
      const quiz = await this.prisma.quiz.create({
        data: {
          moduleId,
          chapterId: chapitre.id,
          title: `Quiz — ${dto.title}`,
          isFinal: false,
          minScoreToPass: minScore,
        },
      });
      await this.prisma.quizQuestion.createMany({
        data: dto.quizQuestions.map((q, i) => ({
          quizId: quiz.id,
          questionText: q.questionText,
          options: q.options as unknown as object,
          correctIndex:
            (q.correctIndexes && q.correctIndexes.length > 0
              ? q.correctIndexes[0]
              : q.correctIndex) ?? 0,
          correctIndexes:
            q.correctIndexes && q.correctIndexes.length > 0 ? q.correctIndexes : [q.correctIndex],
          order: i + 1,
        })),
      });
      await this.prisma.chapterItem.create({
        data: {
          chapterId: chapitre.id,
          type: 'quiz',
          order: itemOrder,
          title: quiz.title,
          quizId: quiz.id,
        },
      });
    }

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

  /** Liste les chapitres d’un cours (spec Module → Cours → Chapitres). */
  async trouverParCourse(courseId: string, userId: string, role: string): Promise<unknown[]> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { module: true },
    });
    if (!course) {
      throw new NotFoundException('Cours introuvable');
    }
    const lectureSeulement = role === 'student';
    await this.verifierDroitsModule(course.moduleId, userId, role, lectureSeulement);
    const chapitres = await this.prisma.chapter.findMany({
      where: { courseId },
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

  async mettreAJourChapitre(
    chapitreId: string,
    dto: UpdateChapitreDto,
    userId: string,
    role: string
  ): Promise<{ id: string; title: string }> {
    const chapitre = await this.prisma.chapter.findUnique({
      where: { id: chapitreId },
      include: { module: true },
    });
    if (!chapitre) {
      throw new NotFoundException('Chapitre introuvable');
    }
    await this.verifierDroitsModule(chapitre.moduleId, userId, role);
    const updated = await this.prisma.chapter.update({
      where: { id: chapitreId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
      select: { id: true, title: true },
    });
    return updated;
  }

  async supprimerChapitre(chapitreId: string, userId: string, role: string): Promise<void> {
    const chapitre = await this.prisma.chapter.findUnique({
      where: { id: chapitreId },
      include: { module: true },
    });
    if (!chapitre) {
      throw new NotFoundException('Chapitre introuvable');
    }
    await this.verifierDroitsModule(chapitre.moduleId, userId, role);
    await this.prisma.chapter.delete({ where: { id: chapitreId } });
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
