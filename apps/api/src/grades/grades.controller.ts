/**
 * Contrôleur grades — conservé pour compatibilité (test).
 * La correction manuelle du quiz final a été supprimée : le quiz final est un QCM,
 * le score et la réussite sont calculés automatiquement selon le seuil défini par le responsable.
 */

import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { ROLES, MODULE_MANAGER_ROLES } from '../core/constants';

@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER, ...MODULE_MANAGER_ROLES)
export class GradesController {
  @Get('test')
  getTest(): { status: string } {
    return { status: 'grades ok' };
  }
}
