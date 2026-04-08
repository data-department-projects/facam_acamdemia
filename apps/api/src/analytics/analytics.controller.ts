/**
 * AnalyticsController — endpoints haut niveau pour dashboards admin.
 */

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';
import { ROLES } from '../core/constants';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('test')
  test() {
    return { status: 'analytics ok' };
  }

  /**
   * Vue globale admin: KPI + charts + top learners.
   * Filtres:
   * - from/to: ISO date
   * - role: student|employee|all
   * - moduleId: restreint à un module
   */
  @Get('admin/overview')
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER)
  overview(
    @CurrentUser() user: UtilisateurPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('role') role?: string,
    @Query('moduleId') moduleId?: string
  ) {
    return this.analyticsService.adminOverview({
      requesterId: user.sub,
      from,
      to,
      role,
      moduleId,
    });
  }

  /**
   * Table apprenants (admin): recherche, tri, pagination, filtres.
   */
  @Get('admin/learners')
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER)
  learners(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('role') role?: string,
    @Query('moduleId') moduleId?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '25'
  ) {
    return this.analyticsService.adminLearners({
      from,
      to,
      role,
      moduleId,
      q,
      sort,
      page,
      limit,
    });
  }

  /**
   * Drill-down apprenant (admin): vue 360° performance + engagement.
   */
  @Get('admin/learner/:userId')
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER)
  learnerDetail(
    @Param('userId') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('moduleId') moduleId?: string
  ) {
    return this.analyticsService.adminLearnerDetail({ userId, from, to, moduleId });
  }
}
