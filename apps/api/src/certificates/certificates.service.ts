/**
 * Service certificats : récupération des données et génération du PDF de certificat.
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';

/** Données nécessaires pour générer le PDF. */
export interface CertificatePdfData {
  fullName: string;
  moduleTitle: string;
  finalGrade: number;
  issuedAt: string;
}

@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Génère le buffer PDF du certificat (FACAM Academia, nom, module, score, date).
   */
  async genererPdfBuffer(data: CertificatePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100;

      // Bandeau bleu FACAM en haut
      doc.rect(0, 0, doc.page.width, 90).fill('#001b61');
      doc.fillColor('#ffffff').fontSize(28).font('Helvetica-Bold');
      doc.text('FACAM ACADEMIA', 0, 35, { width: doc.page.width, align: 'center' });
      doc.fontSize(12).font('Helvetica');
      doc.text('Certificat de réussite', 0, 62, { width: doc.page.width, align: 'center' });

      doc.fillColor('#000000').moveDown(2);

      doc.fontSize(14).font('Helvetica');
      doc.text(`Ceci certifie que ${data.fullName} a validé avec succès le module :`, 50, 130, {
        width: pageWidth,
        align: 'center',
      });

      doc.moveDown(1.5);
      doc.fillColor('#001b61').fontSize(18).font('Helvetica-Bold');
      doc.text(data.moduleTitle, 50, doc.y, { width: pageWidth, align: 'center' });

      doc.moveDown(2);
      doc.fillColor('#000000').fontSize(12).font('Helvetica');
      const scorePercent = Math.round((data.finalGrade / 20) * 100);
      doc.text(`Score obtenu : ${scorePercent} % (${data.finalGrade}/20)`, 50, doc.y, {
        width: pageWidth,
        align: 'center',
      });

      const dateFormatted = new Date(data.issuedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      doc.moveDown(1.5);
      doc.text(`Délivré le ${dateFormatted}`, 50, doc.y, { width: pageWidth, align: 'center' });

      // Ligne décorative et zone signature
      doc.moveDown(3);
      doc
        .strokeColor('#ffae03')
        .lineWidth(2)
        .moveTo(150, doc.y)
        .lineTo(doc.page.width - 150, doc.y)
        .stroke();
      doc.moveDown(1);
      doc.fontSize(10).fillColor('#6b7280');
      doc.text('Ce certificat atteste de la réussite au test final du module.', 50, doc.y, {
        width: pageWidth,
        align: 'center',
      });

      doc.end();
    });
  }

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
   * Récupère le certificat puis génère le buffer PDF pour téléchargement.
   */
  async getPdfBuffer(
    enrollmentId: string,
    userId: string,
    role: string
  ): Promise<{ buffer: Buffer; filename: string }> {
    const data = await this.trouverPourInscription(enrollmentId, userId, role);
    const pdfData: CertificatePdfData = {
      fullName: data.fullName,
      moduleTitle: data.moduleTitle,
      finalGrade: data.finalGrade,
      issuedAt: data.issuedAt,
    };
    const buffer = await this.genererPdfBuffer(pdfData);
    const safeTitle = data.moduleTitle.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 50);
    const filename = `certificat_${safeTitle}_${data.id}.pdf`;
    return { buffer, filename };
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
