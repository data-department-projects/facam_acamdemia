/**
 * Service des messages support:
 * - création par apprenant
 * - consultation et suivi par équipe support
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateSupportFeedbackDto } from './dto/create-support-feedback.dto';

@Injectable()
export class SupportFeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async createForLearner(userId: string, dto: CreateSupportFeedbackDto): Promise<{ id: string }> {
    const created = await this.prisma.supportFeedback.create({
      data: {
        userId,
        subject: dto.subject.trim(),
        category: dto.category,
        priority: dto.priority,
        message: dto.message.trim(),
        contactEmail: dto.contactEmail?.trim() || null,
      },
      select: { id: true },
    });
    return created;
  }

  async listForSupport(filters?: {
    status?: string;
    category?: string;
    limit?: number;
  }): Promise<unknown[]> {
    const rows = await this.prisma.supportFeedback.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.category ? { category: filters.category } : {}),
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, Math.max(1, filters?.limit ?? 50)),
    });
    return rows.map((r) => ({
      id: r.id,
      subject: r.subject,
      category: r.category,
      priority: r.priority,
      message: r.message,
      contactEmail: r.contactEmail,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      user: r.user,
    }));
  }

  async updateStatus(id: string, status: string): Promise<{ id: string; status: string }> {
    const exists = await this.prisma.supportFeedback.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('Message support introuvable');
    }
    const updated = await this.prisma.supportFeedback.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
    return updated;
  }
}
