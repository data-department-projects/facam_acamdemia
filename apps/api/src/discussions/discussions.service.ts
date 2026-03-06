/**
 * Service des discussions (questions / réponses) sur un module.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDiscussionDto } from './dto/create-discussion.dto';

@Injectable()
export class DiscussionsService {
  constructor(private readonly prisma: PrismaService) {}

  async creer(moduleId: string, userId: string, dto: CreateDiscussionDto): Promise<{ id: string }> {
    const module_ = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module_) {
      throw new NotFoundException('Module introuvable');
    }
    const discussion = await this.prisma.discussion.create({
      data: {
        moduleId,
        userId,
        parentId: dto.parentId,
        content: dto.content,
      },
      select: { id: true },
    });
    return discussion;
  }

  async trouverParModule(moduleId: string): Promise<unknown[]> {
    const module_ = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module_) {
      throw new NotFoundException('Module introuvable');
    }
    const discussions = await this.prisma.discussion.findMany({
      where: { moduleId, parentId: null },
      include: {
        user: { select: { fullName: true } },
        replies: {
          include: { user: { select: { fullName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return discussions.map((d) => ({
      id: d.id,
      content: d.content,
      author: d.user.fullName,
      createdAt: d.createdAt.toISOString(),
      replies: d.replies.map((r) => ({
        id: r.id,
        content: r.content,
        author: r.user.fullName,
        createdAt: r.createdAt.toISOString(),
      })),
    }));
  }
}
