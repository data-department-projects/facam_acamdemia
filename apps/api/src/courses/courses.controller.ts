/**
 * Contrôleur des cours (Module → Cours → Chapitres).
 * GET /courses?moduleId=xxx (liste des cours d'un module), POST /courses (création).
 */

import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';
import { ROLES, MODULE_MANAGER_ROLES } from '../core/constants';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER, ...MODULE_MANAGER_ROLES)
  trouverParModule(@Query('moduleId') moduleId: string, @CurrentUser() user: UtilisateurPayload) {
    return this.coursesService.trouverParModule(moduleId, user.sub, user.role);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER, ...MODULE_MANAGER_ROLES)
  creer(@Body() dto: CreateCourseDto, @CurrentUser() user: UtilisateurPayload) {
    return this.coursesService.creer(dto, user.sub, user.role);
  }
}
