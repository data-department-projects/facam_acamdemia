/**
 * Service des cours (niveau intermédiaire Module → Cours → Chapitres).
 * CRUD restreint au module assigné pour le responsable, tous les modules pour l'admin.
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifierDroitsModule(
    moduleId: string,
    userId: string,
    role: string
  ): Promise<void> {
    const module_ = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module_) {
      throw new NotFoundException('Module introuvable');
    }
    const peutModifier =
      role === 'admin' || role === 'platform_manager' || module_.managerId === userId;
    if (!peutModifier) {
      throw new ForbiddenException('Vous ne pouvez pas modifier ce module');
    }
  }

  async creer(
    dto: CreateCourseDto,
    userId: string,
    role: string
  ): Promise<{ id: string; title: string; moduleId: string }> {
    await this.verifierDroitsModule(dto.moduleId, userId, role);
    const course = await this.prisma.course.create({
      data: {
        moduleId: dto.moduleId,
        title: dto.title,
        description: dto.description ?? null,
        order: dto.order ?? 1,
      },
      select: { id: true, title: true, moduleId: true },
    });
    return course;
  }

  async trouverParModule(moduleId: string, userId: string, role: string): Promise<unknown[]> {
    if (!moduleId?.trim()) {
      throw new NotFoundException('moduleId requis (query param)');
    }
    await this.verifierDroitsModule(moduleId, userId, role);
    const courses = await this.prisma.course.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { chapters: true } },
        chapters: { orderBy: { order: 'asc' } },
      },
    });
    return courses;
  }
}
