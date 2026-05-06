/**
 * Service certificats : récupération des données et génération du PDF de certificat.
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';

function isAdminLike(role: string, roles?: string[]): boolean {
  const all = roles?.length ? roles : [role];
  return all.includes('admin') || all.includes('platform_manager');
}

/** Données nécessaires pour générer le PDF. */
export interface CertificatePdfData {
  fullName: string;
  moduleTitle: string;
  startDate: string;
  endDate: string;
  issuedAt: string;
}

interface CertificateTemplateLayout {
  fullNameY: number;
  moduleTitleY: number;
  moduleTitleX: number;
  moduleTitleWidth: number;
  periodY: number;
  periodStartX: number;
  periodStartWidth: number;
  periodEndX: number;
  periodEndWidth: number;
  issuedDateY: number;
  issuedDateX: number;
  issuedDateWidth: number;
  nameMaxWidth: number;
  moduleMaxWidth: number;
  dateMaxWidth: number;
  signatureX: number;
  signatureY: number;
  signatureWidth: number;
  signatureHeight: number;
}

@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Coordonnées calibrées pour le template officiel FACAM STAIRWAY.
   * Valeurs exprimées en ratio de page (0..1) pour garder la stabilité sur A4 paysage.
   */
  private readonly layout: Readonly<CertificateTemplateLayout> = {
    fullNameY: 0.505,
    moduleTitleY: 0.626,
    moduleTitleX: 0.34,
    moduleTitleWidth: 0.17,
    periodY: 0.636,
    periodStartX: 0.5345,
    periodStartWidth: 0.11,
    periodEndX: 0.6745,
    periodEndWidth: 0.11,
    issuedDateY: 0.669,
    issuedDateX: 0.63,
    issuedDateWidth: 0.15,
    nameMaxWidth: 0.62,
    moduleMaxWidth: 0.17,
    dateMaxWidth: 0.18,
    signatureX: 0.705,
    signatureY: 0.82,
    signatureWidth: 0.16,
    signatureHeight: 0.055,
  };

  /**
   * Ajuste la taille de police pour garder un rendu propre sur les noms/cours longs.
   */
  private fitFontSize(params: {
    doc: PDFDocument;
    text: string;
    maxWidth: number;
    preferred: number;
    min: number;
    fontName: string;
  }): number {
    const { doc, text, maxWidth, preferred, min, fontName } = params;
    const measurableDoc = doc as PDFDocument & { widthOfString: (value: string) => number };
    let size = preferred;
    doc.font(fontName).fontSize(size);
    while (size > min && measurableDoc.widthOfString(text) > maxWidth) {
      size -= 1;
      doc.font(fontName).fontSize(size);
    }
    return size;
  }

  /**
   * Construit une ligne de texte centrée avec dimension adaptative.
   */
  private drawCenteredText(params: {
    doc: PDFDocument;
    text: string;
    y: number;
    pageWidth: number;
    fontName: string;
    preferredSize: number;
    minSize: number;
    maxWidthRatio: number;
    color?: string;
  }): void {
    const {
      doc,
      text,
      y,
      pageWidth,
      fontName,
      preferredSize,
      minSize,
      maxWidthRatio,
      color = '#111827',
    } = params;
    const size = this.fitFontSize({
      doc,
      text,
      maxWidth: pageWidth * maxWidthRatio,
      preferred: preferredSize,
      min: minSize,
      fontName,
    });
    doc.fillColor(color).font(fontName).fontSize(size);
    doc.text(text, 0, y, { width: pageWidth, align: 'center' });
  }

  /**
   * Ecrit un texte centré dans une zone précise (x/y/width).
   */
  private drawTextInBox(params: {
    doc: PDFDocument;
    text: string;
    x: number;
    y: number;
    width: number;
    fontName: string;
    preferredSize: number;
    minSize: number;
    maxWidth: number;
    align?: 'left' | 'center';
    color?: string;
  }): void {
    const {
      doc,
      text,
      x,
      y,
      width,
      fontName,
      preferredSize,
      minSize,
      maxWidth,
      align = 'center',
      color = '#111827',
    } = params;
    const size = this.fitFontSize({
      doc,
      text,
      maxWidth,
      preferred: preferredSize,
      min: minSize,
      fontName,
    });
    doc.fillColor(color).font(fontName).fontSize(size);
    doc.text(text, x, y, { width, align });
  }

  /**
   * Résout les assets PDF (template + signature).
   *
   * Ordre de priorité :
   * 1. Variables d'environnement CERTIFICATE_TEMPLATE_PATH / CERTIFICATE_SIGNATURE_PATH
   *    → À configurer sur Render (chemin absolu vers les fichiers uploadés sur le serveur)
   * 2. Chemins relatifs à __dirname (fonctionne en dev src/ et en prod dist/src/)
   *    → Couvre le cas monorepo où apps/web/public/ est accessible depuis l'API
   * 3. Chemins relatifs à process.cwd() (fallback)
   */
  private resolveCertificateAssets(): {
    templatePath: string | null;
    signaturePath: string | null;
  } {
    // — Priorité 1 : variables d'environnement —
    const templateEnv = process.env.CERTIFICATE_TEMPLATE_PATH;
    const signatureEnv = process.env.CERTIFICATE_SIGNATURE_PATH;
    if (templateEnv && fs.existsSync(templateEnv)) {
      return {
        templatePath: templateEnv,
        signaturePath: signatureEnv && fs.existsSync(signatureEnv) ? signatureEnv : null,
      };
    }

    const templateCandidates = [
      'attestation-template.jpeg',
      'attestation-template.jpg',
      'attestation-template.png',
      'template.jpeg',
      'template.jpg',
      'template.png',
    ];
    const signatureCandidates = ['signature.png', 'signature.jpeg', 'signature.jpg'];

    // — Priorité 2 : apps/api/assets/ copié par nest-cli.json dans dist/assets/ au build —
    // __dirname/../.. = apps/api/ (dev) ou apps/api/dist/ (prod) → même chemin relatif
    const dirnameBasedDirs = [
      path.join(__dirname, '..', '..', 'assets'), // apps/api/assets/ ou dist/assets/
      path.join(__dirname, '..', '..', '..', 'apps', 'web', 'public'), // monorepo dev
      path.join(__dirname, '..', '..', '..', '..', 'apps', 'web', 'public'), // monorepo prod (dist/)
    ];

    // — Priorité 3 : process.cwd() —
    const cwd = process.cwd();
    const cwdBasedDirs = [
      path.join(cwd, 'apps', 'web', 'public'),
      path.join(cwd, '..', 'web', 'public'),
      path.join(cwd, '..', '..', 'apps', 'web', 'public'),
    ];

    let templatePath: string | null = null;
    let signaturePath: string | null = null;

    for (const dir of [...dirnameBasedDirs, ...cwdBasedDirs]) {
      if (!fs.existsSync(dir)) continue;
      if (!templatePath) {
        for (const file of templateCandidates) {
          const candidate = path.join(dir, file);
          if (fs.existsSync(candidate)) {
            templatePath = candidate;
            break;
          }
        }
      }
      if (!signaturePath) {
        for (const file of signatureCandidates) {
          const candidate = path.join(dir, file);
          if (fs.existsSync(candidate)) {
            signaturePath = candidate;
            break;
          }
        }
      }
      if (templatePath && signaturePath) break;
    }

    return { templatePath, signaturePath };
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
        const safeText = (t: string) => t.replaceAll(/\s+/g, ' ').trim();
        const fullName = safeText(data.fullName);
        const moduleTitle = safeText(data.moduleTitle);
        const startDate = new Date(data.startDate).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const endDate = new Date(data.endDate).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const dateFormatted = new Date(data.issuedAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        doc.fillColor('#111827');
        doc.font('Helvetica');

        // Bloc texte dynamique calé sur le template fourni.
        this.drawCenteredText({
          doc,
          text: fullName,
          y: h * this.layout.fullNameY,
          pageWidth: w,
          fontName: 'Helvetica-Bold',
          preferredSize: 34,
          minSize: 20,
          maxWidthRatio: this.layout.nameMaxWidth,
        });
        this.drawTextInBox({
          doc,
          text: moduleTitle,
          x: w * this.layout.moduleTitleX,
          y: h * this.layout.moduleTitleY,
          width: w * this.layout.moduleTitleWidth,
          preferredSize: 20,
          minSize: 12,
          maxWidth: w * this.layout.moduleMaxWidth,
          fontName: 'Helvetica',
          align: 'left',
        });
        this.drawTextInBox({
          doc,
          text: startDate,
          x: w * this.layout.periodStartX,
          y: h * this.layout.periodY,
          width: w * this.layout.periodStartWidth,
          preferredSize: 16,
          minSize: 10,
          maxWidth: w * this.layout.dateMaxWidth,
          fontName: 'Helvetica',
          align: 'left',
        });
        this.drawTextInBox({
          doc,
          text: endDate,
          x: w * this.layout.periodEndX,
          y: h * this.layout.periodY,
          width: w * this.layout.periodEndWidth,
          preferredSize: 16,
          minSize: 10,
          maxWidth: w * this.layout.dateMaxWidth,
          fontName: 'Helvetica',
          align: 'left',
        });
        this.drawTextInBox({
          doc,
          text: dateFormatted,
          x: w * this.layout.issuedDateX,
          y: h * this.layout.issuedDateY,
          width: w * this.layout.issuedDateWidth,
          preferredSize: 16,
          minSize: 10,
          maxWidth: w * this.layout.dateMaxWidth,
          fontName: 'Helvetica',
        });

        // Signature manuscrite: entre "Directeur Général" et le nom, en bas à droite
        if (signaturePath) {
          const sigBox = {
            x: w * this.layout.signatureX,
            y: h * this.layout.signatureY,
            width: w * this.layout.signatureWidth,
            height: h * this.layout.signatureHeight,
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
      doc.text(`Ce document certifie que ${data.fullName}`, 50, 130, {
        width: pageWidth,
        align: 'center',
      });

      doc.moveDown(1.5);
      doc.fillColor('#001b61').fontSize(18).font('Helvetica-Bold');
      doc.text(`a terminé avec succès le cours en ${data.moduleTitle}`, 50, doc.y, {
        width: pageWidth,
        align: 'center',
      });

      doc.moveDown(1.2);
      doc.fillColor('#000000').fontSize(12).font('Helvetica');
      doc.text(`de ${data.startDate} à ${data.endDate}`, 50, doc.y, {
        width: pageWidth,
        align: 'center',
      });

      const dateFormatted = new Date(data.issuedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      doc.moveDown(1.5);
      doc.text(`Délivré par le programme FACAM ACADEMIA, ce ${dateFormatted}`, 50, doc.y, {
        width: pageWidth,
        align: 'center',
      });

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
    role: string,
    roles?: string[]
  ): Promise<{
    id: string;
    fullName: string;
    moduleTitle: string;
    startDate: string;
    endDate: string;
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
    if (certificate.userId !== userId && !isAdminLike(role, roles)) {
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
      startDate: certificate.enrollment.enrolledAt.toISOString(),
      endDate: (certificate.enrollment.completedAt ?? certificate.issuedAt).toISOString(),
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
    role: string,
    roles?: string[]
  ): Promise<{ buffer: Buffer; filename: string }> {
    const data = await this.trouverPourInscription(enrollmentId, userId, role, roles);
    const pdfData: CertificatePdfData = {
      fullName: data.fullName,
      moduleTitle: data.moduleTitle,
      startDate: data.startDate,
      endDate: data.endDate,
      issuedAt: data.issuedAt,
    };
    const buffer = await this.genererPdfBuffer(pdfData);
    const safeName = data.fullName.replaceAll(/[^a-zA-Z0-9-_]/g, '_').slice(0, 60) || data.id;
    const filename = `certificat_${safeName}.pdf`;
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
      enrollmentId: c.enrollmentId,
      moduleTitle: c.module.title,
      finalGrade: c.finalGrade,
      mention: c.mention,
      issuedAt: c.issuedAt.toISOString(),
    }));
  }
}
