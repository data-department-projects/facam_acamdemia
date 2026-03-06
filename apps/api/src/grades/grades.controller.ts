/**
 * Contrôleur des notes du quiz final : attribution par le responsable.
 */

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { GradesService } from './grades.service';
import { GradeFinalDto } from './dto/grade-final.dto';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';
import { ROLES } from '../core/constants';

@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER, ROLES.MODULE_MANAGER)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post('attempt/:attemptId')
  attribuerNote(
    @Param('attemptId') attemptId: string,
    @Body() dto: GradeFinalDto,
    @CurrentUser() user: UtilisateurPayload
  ) {
    return this.gradesService.attribuerNote(attemptId, dto, user.sub, user.role);
  }

  @Get('test')
  getTest(): { status: string } {
    return { status: 'grades ok' };
  }
}
