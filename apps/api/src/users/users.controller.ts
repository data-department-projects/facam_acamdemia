/**
 * Contrôleur utilisateurs : CRUD réservé à l'admin, liste et détail.
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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { ROLES } from '../core/constants';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER)
  creer(@Body() createUserDto: CreateUserDto) {
    return this.usersService.creer(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER)
  trouverTous(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('role') role?: string
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return this.usersService.trouverTous({ page: pageNum, limit: limitNum, role });
  }

  @Get('test')
  getTest(): { status: string } {
    return { status: 'users ok' };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER)
  trouverUn(@Param('id') id: string) {
    return this.usersService.trouverUn(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER)
  mettreAJour(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.mettreAJour(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.PLATFORM_MANAGER)
  supprimer(@Param('id') id: string) {
    return this.usersService.supprimer(id);
  }
}
