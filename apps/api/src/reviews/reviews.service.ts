/**
 * Service des avis (notation étoiles) sur un module.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async creer(moduleId: string, userId: string, dto: CreateReviewDto): Promise<{ id: string }> {
    const module_ = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module_) {
      throw new NotFoundException('Module introuvable');
    }
    const certificate = await this.prisma.certificate.findFirst({
      where: { moduleId, userId },
      select: { id: true },
    });
    if (!certificate) {
      throw new ForbiddenException(
        'Vous pourrez laisser un avis uniquement après avoir terminé le module et obtenu votre certificat.'
      );
    }
    const existe = await this.prisma.review.findFirst({
      where: { userId, moduleId },
    });
    if (existe) {
      throw new ConflictException('Vous avez déjà laissé un avis sur ce module');
    }
    const review = await this.prisma.review.create({
      data: {
        userId,
        moduleId,
        rating: dto.rating,
        comment: dto.comment,
      },
      select: { id: true },
    });
    return review;
  }

  async trouverParModule(moduleId: string): Promise<unknown[]> {
    const module_ = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module_) {
      throw new NotFoundException('Module introuvable');
    }
    const reviews = await this.prisma.review.findMany({
      where: { moduleId },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      author: r.user.fullName,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
