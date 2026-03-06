/**
 * Service certificats : récupération des données pour génération PDF à la volée.
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère les données d'un certificat (pour génération PDF côté client ou serveur).
   */
  async trouverPourInscription(
    enrollmentId: string,
    userId: string,
    role: string
  ): Promise<{
    id: string;
    fullName: string;
    moduleTitle: string;
    finalGrade: number;
    mention: string;
    issuedAt: string;
  }> {
    const certificate = await this.prisma.certificate.findUnique({
      where: { enrollmentId },
      include: { enrollment: true, module: true },
    });
    if (!certificate) {
      throw new NotFoundException('Certificat introuvable');
    }
    if (certificate.userId !== userId && role !== 'admin' && role !== 'platform_manager') {
      throw new ForbiddenException('Accès refusé');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: certificate.userId },
      select: { fullName: true },
    });
    return {
      id: certificate.id,
      fullName: user?.fullName ?? '',
      moduleTitle: certificate.module.title,
      finalGrade: certificate.finalGrade,
      mention: certificate.mention,
      issuedAt: certificate.issuedAt.toISOString(),
    };
  }

  /**
   * Liste les certificats de l'utilisateur courant.
   */
  async trouverPourUtilisateur(userId: string): Promise<unknown[]> {
    const certificates = await this.prisma.certificate.findMany({
      where: { userId },
      include: { module: { select: { id: true, title: true } } },
    });
    return certificates.map((c) => ({
      id: c.id,
      moduleId: c.moduleId,
      moduleTitle: c.module.title,
      finalGrade: c.finalGrade,
      mention: c.mention,
      issuedAt: c.issuedAt.toISOString(),
    }));
  }
}
