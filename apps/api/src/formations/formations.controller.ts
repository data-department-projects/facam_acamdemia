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
} from '@nestjs/common';
import { FormationsService } from './formations.service';
import { CreateFormationDto } from './dto/create-formation.dto';
import { UpdateFormationDto } from './dto/update-formation.dto';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';
import { ROLES } from '../core/constants';

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
    @Query('limit') limit = '20'
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return this.formationsService.trouverTous({
      userId: user.sub,
      role: user.role,
      page: pageNum,
      limit: limitNum,
    });
  }

  @Get('test')
  getTest(): { status: string } {
    return { status: 'formations ok' };
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
