/**
 * Contrôleur quiz : récupération quiz, soumission tentative.
 */

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';

@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get('test')
  getTest(): { status: string } {
    return { status: 'quiz ok' };
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
