/**
 * Contrôleur des discussions (questions / réponses) sur les modules.
 */

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { DiscussionsService } from './discussions.service';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';

@Controller('discussions')
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @Get('test')
  getTest(): { status: string } {
    return { status: 'discussions ok' };
  }

  @Get('module/:moduleId')
  trouverParModule(@Param('moduleId') moduleId: string) {
    return this.discussionsService.trouverParModule(moduleId);
  }

  @Post('module/:moduleId')
  @UseGuards(JwtAuthGuard)
  creer(
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateDiscussionDto,
    @CurrentUser() user: UtilisateurPayload
  ) {
    return this.discussionsService.creer(moduleId, user.sub, dto);
  }
}
