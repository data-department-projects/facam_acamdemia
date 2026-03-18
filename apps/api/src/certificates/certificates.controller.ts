/**
 * Contrôleur certificats : données JSON et téléchargement PDF.
 */

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';
import { StreamableFile } from '@nestjs/common';

@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('test')
  getTest(): { status: string } {
    return { status: 'certificates ok' };
  }

  /** Téléchargement du certificat en PDF (route plus spécifique avant :enrollmentId). */
  @Get('enrollment/:enrollmentId/download')
  async downloadPdf(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() user: UtilisateurPayload
  ): Promise<StreamableFile> {
    const { buffer, filename } = await this.certificatesService.getPdfBuffer(
      enrollmentId,
      user.sub,
      user.role
    );
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Get('enrollment/:enrollmentId')
  trouverPourInscription(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() user: UtilisateurPayload
  ) {
    return this.certificatesService.trouverPourInscription(enrollmentId, user.sub, user.role);
  }

  @Get('my')
  trouverPourUtilisateur(@CurrentUser() user: UtilisateurPayload) {
    return this.certificatesService.trouverPourUtilisateur(user.sub);
  }
}
