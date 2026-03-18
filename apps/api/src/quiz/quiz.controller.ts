/**
 * Contrôleur quiz : récupération quiz, soumission tentative.
 */

import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { UpsertFinalQuizDto } from './dto/upsert-final-quiz.dto';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';
import { ROLES, MODULE_MANAGER_ROLES } from '../core/constants';

@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get('test')
  getTest(): { status: string } {
    return { status: 'quiz ok' };
  }

  @Get('final')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER, ...MODULE_MANAGER_ROLES)
  trouverQuizFinal(@Query('moduleId') moduleId: string, @CurrentUser() user: UtilisateurPayload) {
    return this.quizService.trouverQuizFinal(moduleId, user.sub, user.role);
  }

  @Put('final')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER, ...MODULE_MANAGER_ROLES)
  upsertQuizFinal(@Body() dto: UpsertFinalQuizDto, @CurrentUser() user: UtilisateurPayload) {
    return this.quizService.upsertQuizFinal(dto, user.sub, user.role);
  }

  @Get(':id')
  trouverUn(@Param('id') id: string, @CurrentUser() user: UtilisateurPayload) {
    return this.quizService.trouverUn(id, user.sub, user.role);
  }

  @Post(':id/submit')
  soumettreTentative(
    @Param('id') id: string,
    @Body() dto: SubmitAttemptDto,
    @CurrentUser() user: UtilisateurPayload
  ) {
    return this.quizService.soumettreTentative(id, dto, user.sub);
  }

  @Get(':id/attempts')
  trouverTentatives(@Param('id') id: string, @CurrentUser() user: UtilisateurPayload) {
    return this.quizService.trouverTentativesPourQuiz(id, user.sub, user.role);
  }
}
