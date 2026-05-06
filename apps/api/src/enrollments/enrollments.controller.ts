/**
 * Contrôleur des inscriptions : création (admin), liste, mise à jour position.
 */

import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { StartModuleDto } from './dto/start-module.dto';
import { UpdateProgressionDto } from './dto/update-progression.dto';
import { CompleteItemDto } from './dto/complete-item.dto';
import { PingActivityDto } from './dto/ping-activity.dto';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';
import { ROLES } from '../core/constants';

@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER)
  creer(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.creer(createEnrollmentDto);
  }

  @Get()
  trouverPourUtilisateur(
    @CurrentUser() user: UtilisateurPayload,
    @Query('userId') userId?: string
  ) {
    return this.enrollmentsService.trouverPourUtilisateur(user.sub, user.role, userId, user.roles);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER)
  getStats() {
    return this.enrollmentsService.compterCompletions();
  }

  @Get('test')
  getTest(): { status: string } {
    return { status: 'enrollments ok' };
  }

  /** Heartbeat de présence : le frontend l'appelle toutes les 2 min pour mesurer le temps réel. */
  @Post('ping')
  @UseGuards(RolesGuard)
  @Roles(ROLES.STUDENT, ROLES.EMPLOYEE)
  enregistrerPing(@Body() dto: PingActivityDto, @CurrentUser() user: UtilisateurPayload) {
    return this.enrollmentsService.enregistrerPing(user.sub, dto.moduleId, dto.enrollmentId);
  }

  /** Inscription à un module par l'étudiant/employé (démarrage). Crée l'enrollment si besoin. */
  @Post('start')
  @UseGuards(RolesGuard)
  @Roles(ROLES.STUDENT, ROLES.EMPLOYEE)
  demarrerModule(@Body() dto: StartModuleDto, @CurrentUser() user: UtilisateurPayload) {
    return this.enrollmentsService.demarrerModule(dto.moduleId, user.sub, user.role);
  }

  @Get(':id')
  trouverUn(@Param('id') id: string, @CurrentUser() user: UtilisateurPayload) {
    return this.enrollmentsService.trouverUn(id, user.sub, user.role, user.roles);
  }

  @Post(':id/complete-item')
  marquerElementComplété(
    @Param('id') id: string,
    @Body() dto: CompleteItemDto,
    @CurrentUser() user: UtilisateurPayload
  ) {
    return this.enrollmentsService.marquerElementComplété(
      id,
      dto.chapterItemId,
      user.sub,
      user.role,
      user.roles
    );
  }

  @Patch(':id/progression')
  mettreAJourProgression(
    @Param('id') id: string,
    @Body() dto: UpdateProgressionDto,
    @CurrentUser() user: UtilisateurPayload
  ) {
    return this.enrollmentsService.mettreAJourProgression(id, dto, user.sub, user.role, user.roles);
  }

  @Get(':id/progress-items')
  listerProgressItems(@Param('id') id: string, @CurrentUser() user: UtilisateurPayload) {
    return this.enrollmentsService.listerElementsCompletes(id, user.sub, user.role, user.roles);
  }
}
