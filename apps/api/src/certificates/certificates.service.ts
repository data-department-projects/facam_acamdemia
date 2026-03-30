/**
 * Service certificats : récupération des données et génération du PDF de certificat.
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';

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
   * Résout les assets PDF (template + signature) depuis un chemin unique.
   * Convention projet:
   * - template: apps/web/public/attestion-template.jpeg
   * - signature: apps/web/public/signature.png
   */
  private resolveCertificateAssets(): {
    templatePath: string | null;
    signaturePath: string | null;
  } {
    const root = process.cwd();
    const templatePath = path.join(root, 'apps', 'web', 'public', 'attestation-template.jpeg');
    const signaturePath = path.join(root, 'apps', 'web', 'public', 'signature.png');

    return {
      templatePath: fs.existsSync(templatePath) ? templatePath : null,
      signaturePath: fs.existsSync(signaturePath) ? signaturePath : null,
    };
  }

  /**
   * Génère le buffer PDF du certificat (FACAM Academia, nom, module, score, date).
   */
  async genererPdfBuffer(data: CertificatePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const { templatePath, signaturePath } = this.resolveCertificateAssets();

      // Nouveau rendu: template officiel en fond + champs dynamiques au-dessus.
      // Si le template n'est pas présent, on conserve l'ancien rendu pour ne pas bloquer la prod.
      const useTemplate = !!templatePath;
      const doc = new PDFDocument({
        size: 'A4',
        layout: useTemplate ? 'landscape' : 'portrait',
        margin: useTemplate ? 0 : 50,
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      if (useTemplate && templatePath) {
        const w = doc.page.width;
        const h = doc.page.height;

        // Fond plein page (template)
        doc.image(templatePath, 0, 0, { width: w, height: h });

        // Champs dynamiques — positions en ratios pour rester stables en A4 paysage
        const safeText = (t: string) => t.replace(/\s+/g, ' ').trim();
        const fullName = safeText(data.fullName);
        const moduleTitle = safeText(data.moduleTitle);
        const dateFormatted = new Date(data.issuedAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        doc.fillColor('#111827'); // slate-900
        doc.font('Times-Roman');

        // Ligne "Nom & prénom" (centre)
        doc.fontSize(22);
        doc.text(fullName, 0, h * 0.515, { width: w, align: 'center' });

        // Ligne "Intitulé formation"
        doc.fontSize(18);
        doc.text(moduleTitle, 0, h * 0.625, { width: w, align: 'center' });

        // Ligne "Date" (format JJ/MM/AAAA)
        doc.fontSize(14);
        doc.text(dateFormatted, w * 0.5, h * 0.665, { width: w * 0.12, align: 'left' });

        // Signature manuscrite: entre "Directeur Général" et le nom, en bas à droite
        if (signaturePath) {
          const sigBox = {
            x: w * 0.73,
            y: h * 0.735,
            width: w * 0.18,
            height: h * 0.09,
          };
          try {
            doc.image(signaturePath, sigBox.x, sigBox.y, {
              fit: [sigBox.width, sigBox.height],
              align: 'center',
              valign: 'center',
            });
          } catch {
            // best-effort: si image invalide, on ne bloque pas le PDF
          }
        }

        doc.end();
        return;
      }

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
