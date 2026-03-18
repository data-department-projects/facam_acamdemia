/**
 * Service des notes du quiz final (désactivé).
 * La correction manuelle par le responsable a été supprimée : le quiz final est un QCM,
 * le score et le certificat sont calculés automatiquement selon le seuil défini à la création du quiz.
 * Ce service n'est plus utilisé par le contrôleur.
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { GradeFinalDto } from './dto/grade-final.dto';
import { CERTIFICATE_MIN_GRADE } from '../core/constants';

const MENTIONS: Array<{ seuil: number; mention: string }> = [
  { seuil: 16, mention: 'Très bien' },
  { seuil: 14, mention: 'Bien' },
  { seuil: 12, mention: 'Assez bien' },
  { seuil: 10, mention: 'Passable' },
];

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Attribue une note sur 20 à une tentative de quiz final. Crée le certificat si >= 10.
   */
  async attribuerNote(
    attemptId: string,
    dto: GradeFinalDto,
    userId: string,
    role: string
  ): Promise<{ id: string; gradeOver20: number; mention: string; certificateCreated: boolean }> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { quiz: { include: { module: true } }, enrollment: true },
    });
    if (!attempt) {
      throw new NotFoundException('Tentative introuvable');
    }
    if (!attempt.quiz.isFinal) {
      throw new BadRequestException("Ce quiz n'est pas un quiz final");
    }
    const peutNoter =
      role === 'admin' || role === 'platform_manager' || attempt.quiz.module.managerId === userId;
    if (!peutNoter) {
      throw new ForbiddenException('Vous ne pouvez pas noter ce quiz');
    }
    if (!attempt.enrollmentId) {
      throw new BadRequestException('Tentative sans inscription associée');
    }
    const mention = this.calculerMention(dto.gradeOver20);
    const existing = await this.prisma.finalQuizGrade.findUnique({
      where: { attemptId },
    });
    if (existing) {
      throw new BadRequestException('Cette tentative a déjà été notée');
    }
    const grade = await this.prisma.finalQuizGrade.create({
      data: {
        attemptId,
        enrollmentId: attempt.enrollmentId,
        gradeOver20: dto.gradeOver20,
        mention,
        gradedById: userId,
        comment: dto.comment,
      },
      select: { id: true, gradeOver20: true, mention: true },
    });
    let certificateCreated = false;
    if (dto.gradeOver20 >= CERTIFICATE_MIN_GRADE && attempt.enrollment) {
      await this.prisma.certificate.create({
        data: {
          enrollmentId: attempt.enrollmentId,
          userId: attempt.userId,
          moduleId: attempt.quiz.moduleId,
          finalGrade: dto.gradeOver20,
          mention,
        },
      });
      await this.prisma.enrollment.update({
        where: { id: attempt.enrollmentId },
        data: { completedAt: new Date() },
      });
      certificateCreated = true;
    }
    return {
      id: grade.id,
      gradeOver20: grade.gradeOver20,
      mention: grade.mention ?? '',
      certificateCreated,
    };
  }

  private calculerMention(gradeOver20: number): string {
    for (const m of MENTIONS) {
      if (gradeOver20 >= m.seuil) {
        return m.mention;
      }
    }
    return 'Non admis';
  }
}
