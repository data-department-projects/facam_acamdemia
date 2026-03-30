/**
 * Contrôleur des messages support:
 * - création par étudiant/employé
 * - consultation et traitement par support/admin.
 */

import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SupportFeedbackService } from './support-feedback.service';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';
import { ROLES } from '../core/constants';
import { CreateSupportFeedbackDto } from './dto/create-support-feedback.dto';
import { UpdateSupportFeedbackStatusDto } from './dto/update-support-feedback-status.dto';

@Controller('support-feedback')
@UseGuards(JwtAuthGuard)
export class SupportFeedbackController {
  constructor(private readonly service: SupportFeedbackService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(ROLES.STUDENT, ROLES.EMPLOYEE)
  create(@Body() dto: CreateSupportFeedbackDto, @CurrentUser() user: UtilisateurPayload) {
    return this.service.createForLearner(user.sub, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPPORT, ROLES.ADMIN, ROLES.PLATFORM_MANAGER)
  list(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: string
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    return this.service.listForSupport({
      status,
      category,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPPORT, ROLES.ADMIN, ROLES.PLATFORM_MANAGER)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateSupportFeedbackStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }
}
