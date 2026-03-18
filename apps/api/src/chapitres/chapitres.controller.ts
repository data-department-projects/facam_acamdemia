/**
 * Contrôleur des chapitres et éléments de chapitre.
 */

import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ChapitresService } from './chapitres.service';
import { CreateChapitreDto } from './dto/create-chapitre.dto';
import { UpdateChapitreDto } from './dto/update-chapitre.dto';
import { CreateChapterItemDto } from './dto/create-chapter-item.dto';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';
import { ROLES, MODULE_MANAGER_ROLES } from '../core/constants';

@Controller('chapitres')
@UseGuards(JwtAuthGuard)
export class ChapitresController {
  constructor(private readonly chapitresService: ChapitresService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER, ...MODULE_MANAGER_ROLES)
  creerChapitre(@Body() dto: CreateChapitreDto, @CurrentUser() user: UtilisateurPayload) {
    return this.chapitresService.creerChapitre(dto, user.sub, user.role);
  }

  @Post('items')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER, ...MODULE_MANAGER_ROLES)
  creerElement(@Body() dto: CreateChapterItemDto, @CurrentUser() user: UtilisateurPayload) {
    return this.chapitresService.creerElement(dto, user.sub, user.role);
  }

  @Get('module/:moduleId')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER, ...MODULE_MANAGER_ROLES)
  trouverParModule(@Param('moduleId') moduleId: string, @CurrentUser() user: UtilisateurPayload) {
    return this.chapitresService.trouverParModule(moduleId, user.sub, user.role);
  }

  @Get('course/:courseId')
  @UseGuards(RolesGuard)
  @Roles(
    ROLES.ADMIN,
    ROLES.PLATFORM_MANAGER,
    ...MODULE_MANAGER_ROLES,
    ROLES.STUDENT,
    ROLES.EMPLOYEE
  )
  trouverParCourse(@Param('courseId') courseId: string, @CurrentUser() user: UtilisateurPayload) {
    return this.chapitresService.trouverParCourse(courseId, user.sub, user.role);
  }

  @Get('test')
  getTest(): { status: string } {
    return { status: 'chapitres ok' };
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(
    ROLES.ADMIN,
    ROLES.PLATFORM_MANAGER,
    ...MODULE_MANAGER_ROLES,
    ROLES.STUDENT,
    ROLES.EMPLOYEE
  )
  trouverUn(@Param('id') id: string, @CurrentUser() user: UtilisateurPayload) {
    return this.chapitresService.trouverUnChapitre(id, user.sub, user.role);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER, ...MODULE_MANAGER_ROLES)
  mettreAJour(
    @Param('id') id: string,
    @Body() dto: UpdateChapitreDto,
    @CurrentUser() user: UtilisateurPayload
  ) {
    return this.chapitresService.mettreAJourChapitre(id, dto, user.sub, user.role);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER, ...MODULE_MANAGER_ROLES)
  async supprimer(@Param('id') id: string, @CurrentUser() user: UtilisateurPayload) {
    await this.chapitresService.supprimerChapitre(id, user.sub, user.role);
    return { message: 'Chapitre supprimé' };
  }
}
