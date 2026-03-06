/**
 * Contrôleur des avis (notation + commentaires) sur les modules.
 */

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('test')
  getTest(): { status: string } {
    return { status: 'reviews ok' };
  }

  @Get('module/:moduleId')
  trouverParModule(@Param('moduleId') moduleId: string) {
    return this.reviewsService.trouverParModule(moduleId);
  }

  @Post('module/:moduleId')
  @UseGuards(JwtAuthGuard)
  creer(
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: UtilisateurPayload
  ) {
    return this.reviewsService.creer(moduleId, user.sub, dto);
  }
}
