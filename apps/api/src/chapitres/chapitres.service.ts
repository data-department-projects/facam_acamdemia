/**
 * Service des chapitres et éléments : CRUD (responsable du module ou admin).
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppStorageService } from '../storage/app-storage.service';
import type { CreateChapitreDto } from './dto/create-chapitre.dto';
import type { UpdateChapitreDto } from './dto/update-chapitre.dto';
import type { CreateChapterItemDto } from './dto/create-chapter-item.dto';

@Injectable()
export class ChapitresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appStorage: AppStorageService
  ) {}

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
    const lectureSeulement = role === 'student' || role === 'employee';
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
    const lectureSeulement = role === 'student' || role === 'employee';
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
    const lectureSeulement = role === 'student' || role === 'employee';
    await this.verifierDroitsModule(chapitre.moduleId, userId, role, lectureSeulement);
    return chapitre;
  }

  /**
   * Téléchargement “propre” : renvoie une URL signée vers le document d’un item.
   * L’API vérifie les droits (inscription au module pour student/employee).
   */
  async getSignedDocumentDownloadUrl(
    itemId: string,
    userId: string,
    role: string
  ): Promise<{ url: string }> {
    this.appStorage.assertReady();
    const item = await this.prisma.chapterItem.findUnique({
      where: { id: itemId },
      include: { chapter: { include: { module: true } } },
    });
    if (!item || item.type !== 'document' || !item.documentUrl) {
      throw new NotFoundException('Document introuvable');
    }
    const moduleId = item.chapter.moduleId;
    const lectureSeulement = role === 'student' || role === 'employee';
    await this.verifierDroitsModule(moduleId, userId, role, lectureSeulement);
    const { signedUrl } = await this.appStorage.createSignedUrlFromPublicUrl(item.documentUrl);
    return { url: signedUrl };
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

  /**
   * Nouvel élément « document » + fichier dans `cours/{moduleId}/{chapterId}/`.
   */
  async ajouterDocumentAuChapitre(
    chapterId: string,
    file: { buffer: Buffer; mimetype: string; originalname?: string },
    userId: string,
    role: string,
    meta?: { title?: string; documentLabel?: string }
  ): Promise<{ id: string; title: string; type: string; documentUrl: string }> {
    this.appStorage.assertReady();
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier document vide ou invalide.');
    }
    const ext = this.appStorage.extForChapterDocMime(file.mimetype);
    if (!ext) {
      throw new BadRequestException('Type de fichier non accepté (PDF, PPTX, DOCX, DOC, PPT).');
    }
    const chapitre = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { module: true, items: true },
    });
    if (!chapitre) {
      throw new NotFoundException('Chapitre introuvable');
    }
    await this.verifierDroitsModule(chapitre.moduleId, userId, role);
    const moduleId = chapitre.moduleId;
    const maxOrder = chapitre.items.reduce((m, i) => Math.max(m, i.order), 0);
    const order = maxOrder + 1;
    const title =
      meta?.title?.trim() ||
      (file.originalname ? file.originalname.replace(/\.[^.]+$/, '') : 'Document') ||
      'Document';
    let publicUrl: string;
    try {
      const uploaded = await this.appStorage.uploadChapterDocument(
        moduleId,
        chapterId,
        file.buffer,
        file.mimetype,
        file.originalname
      );
      publicUrl = uploaded.publicUrl;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Échec du téléversement';
      throw new InternalServerErrorException(msg);
    }
    const item = await this.prisma.chapterItem.create({
      data: {
        chapterId,
        type: 'document',
        order,
        title: title.slice(0, 200),
        documentLabel: meta?.documentLabel?.trim() || title.slice(0, 200),
        documentUrl: publicUrl,
      },
      select: { id: true, title: true, type: true, documentUrl: true },
    });
    return item as { id: string; title: string; type: string; documentUrl: string };
  }

  /**
   * Remplace le fichier d’un item document existant (même chapitre / module).
   */
  async remplacerDocumentItem(
    itemId: string,
    file: { buffer: Buffer; mimetype: string; originalname?: string },
    userId: string,
    role: string,
    meta?: { documentLabel?: string }
  ): Promise<{ id: string; documentUrl: string }> {
    this.appStorage.assertReady();
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier document vide ou invalide.');
    }
    const ext = this.appStorage.extForChapterDocMime(file.mimetype);
    if (!ext) {
      throw new BadRequestException('Type de fichier non accepté (PDF, PPTX, DOCX, DOC, PPT).');
    }
    const item = await this.prisma.chapterItem.findUnique({
      where: { id: itemId },
      include: { chapter: { include: { module: true } } },
    });
    if (!item || item.type !== 'document') {
      throw new NotFoundException('Élément document introuvable');
    }
    const moduleId = item.chapter.moduleId;
    const chapterId = item.chapterId;
    await this.verifierDroitsModule(moduleId, userId, role);
    const previousUrl = item.documentUrl;
    let publicUrl: string;
    try {
      const uploaded = await this.appStorage.uploadChapterDocument(
        moduleId,
        chapterId,
        file.buffer,
        file.mimetype,
        file.originalname
      );
      publicUrl = uploaded.publicUrl;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Échec du téléversement';
      throw new InternalServerErrorException(msg);
    }
    await this.prisma.chapterItem.update({
      where: { id: itemId },
      data: {
        documentUrl: publicUrl,
        ...(meta?.documentLabel?.trim()
          ? { documentLabel: meta.documentLabel.trim().slice(0, 200) }
          : {}),
      },
    });
    if (previousUrl) {
      await this.appStorage.removeChapterDocumentByUrlIfOwned(previousUrl, moduleId, chapterId);
    }
    return { id: itemId, documentUrl: publicUrl };
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
    if (lectureSeulement && (role === 'student' || role === 'employee')) {
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
