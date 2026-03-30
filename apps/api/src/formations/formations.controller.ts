/**
 * Contrôleur des modules de formation : CRUD, liste, détail.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FormationsService } from './formations.service';
import { MODULE_IMAGE_MAX_BYTES } from '../storage/app-storage.constants';
import { CreateFormationDto } from './dto/create-formation.dto';
import { UpdateFormationDto } from './dto/update-formation.dto';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';
import { ROLES, MODULE_MANAGER_ROLES } from '../core/constants';

@Controller('formations')
export class FormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER)
  creer(@Body() createFormationDto: CreateFormationDto) {
    return this.formationsService.creer(createFormationDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  trouverTous(
    @CurrentUser() user: UtilisateurPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('catalogue') catalogue?: string
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return this.formationsService.trouverTous({
      userId: user.sub,
      role: user.role,
      page: pageNum,
      limit: limitNum,
      catalogue: catalogue === '1' || catalogue === 'true',
    });
  }

  @Get('test')
  getTest(): { status: string } {
    return { status: 'formations ok' };
  }

  @Get('stats/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MODULE_MANAGER_ROLES, ROLES.ADMIN, ROLES.PLATFORM_MANAGER)
  statsDashboard(@CurrentUser() user: UtilisateurPayload, @Query('year') year?: string) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.formationsService.statsDashboard(
      user.sub,
      user.role,
      Number.isFinite(yearNum) ? yearNum : undefined
    );
  }

  @Get('stats/student-detail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MODULE_MANAGER_ROLES, ROLES.ADMIN, ROLES.PLATFORM_MANAGER)
  statsStudentDetail(
    @Query('enrollmentId') enrollmentId: string,
    @CurrentUser() user: UtilisateurPayload
  ) {
    return this.formationsService.statsStudentDetail(enrollmentId, user.sub, user.role);
  }

  /** Couverture module → Supabase `images/modules/{id}/` (multipart `file`, max 5 Mo, JPG/PNG/WebP). */
  @Post(':id/cover-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER, ...MODULE_MANAGER_ROLES)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MODULE_IMAGE_MAX_BYTES },
    })
  )
  async uploadCoverImage(
    @Param('id') id: string,
    @CurrentUser() user: UtilisateurPayload,
    @UploadedFile() file: { buffer: Buffer; mimetype: string } | undefined
  ) {
    if (!file) {
      throw new BadRequestException('Fichier image requis (champ multipart « file »).');
    }
    return this.formationsService.telechargerCouvertureModule(id, file, user.sub, user.role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  trouverUn(@Param('id') id: string, @CurrentUser() user: UtilisateurPayload) {
    return this.formationsService.trouverUn(id, user.sub, user.role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  mettreAJour(
    @Param('id') id: string,
    @Body() updateFormationDto: UpdateFormationDto,
    @CurrentUser() user: UtilisateurPayload
  ) {
    return this.formationsService.mettreAJour(id, updateFormationDto, user.sub, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async supprimer(@Param('id') id: string, @CurrentUser() user: UtilisateurPayload) {
    return this.formationsService.supprimer(id, user.sub, user.role);
  }
}
