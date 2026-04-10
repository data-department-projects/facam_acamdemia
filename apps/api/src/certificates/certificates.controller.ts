/**
 * Contrôleur certificats : données JSON et téléchargement PDF.
 */

import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';
import { StreamableFile } from '@nestjs/common';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { ROLES } from '../core/constants';
import { BatchCertificatesDto } from './dto/batch-certificates.dto';

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

  /**
   * Téléchargement batch des certificats (ZIP).
   * Réservé admin / platform_manager.
   */
  @Post('batch/download')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER)
  async downloadBatchZip(
    @Body() dto: BatchCertificatesDto,
    @CurrentUser() user: UtilisateurPayload
  ): Promise<StreamableFile> {
    const { buffer, filename } = await this.certificatesService.getBatchZipBuffer(
      dto.enrollmentIds,
      user.sub,
      user.role
    );
    return new StreamableFile(buffer, {
      type: 'application/zip',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}
