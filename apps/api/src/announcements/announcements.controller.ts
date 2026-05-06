/**
 * Contrôleur messages de module.
 * - Responsable de module : envoi + liste des messages envoyés.
 * - Apprenants : liste des messages reçus (lecture seule).
 */

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';
import { ROLES } from '../core/constants';
import type { RoleType } from '../core/constants';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { MarkAnnouncementsReadDto } from './dto/mark-announcements-read.dto';
import { InternalServerErrorException } from '@nestjs/common';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get('test')
  getTest(): { status: string } {
    return { status: 'Annonce sont bons' };
  }

  /** Envoi d'un message à tous les apprenants du module géré par ce compte. */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(ROLES.MODULE_MANAGER_INTERNAL, ROLES.MODULE_MANAGER_EXTERNAL)
  envoyer(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: UtilisateurPayload) {
    return this.announcementsService.sendFromManager(user.sub, user.role as RoleType, dto.content);
  }

  /** Historique des messages (module manager)  Disponible que pour les managers de modules internes et externes*/
  @Get('sent')
  @UseGuards(RolesGuard)
  @Roles(ROLES.MODULE_MANAGER_INTERNAL, ROLES.MODULE_MANAGER_EXTERNAL)
  listerEnvoyes(@CurrentUser() user: UtilisateurPayload) {
    return this.announcementsService.listSentByManager(user.sub, user.role as RoleType);
  }

  /** Liste des messages reçus (étudiant/employé) */
  @Get('my')
  @UseGuards(RolesGuard)
  @Roles(ROLES.STUDENT, ROLES.EMPLOYEE)
  listerPourMoi(@CurrentUser() user: UtilisateurPayload) {
    try {
      return this.announcementsService.listForLearner(user.sub, user.role as RoleType);
    } catch {
      throw new InternalServerErrorException('Erreur de la récupération de vos messages');
    }
  }

  @Get('unread-count')
  @UseGuards(RolesGuard)
  @Roles(ROLES.STUDENT, ROLES.EMPLOYEE)
  unreadCount(@CurrentUser() user: UtilisateurPayload) {
    return this.announcementsService.unreadCountForLearner(user.sub, user.role as RoleType);
  }

  @Post('mark-read')
  @UseGuards(RolesGuard)
  @Roles(ROLES.STUDENT, ROLES.EMPLOYEE)
  markRead(@Body() dto: MarkAnnouncementsReadDto, @CurrentUser() user: UtilisateurPayload) {
    return this.announcementsService.markReadForLearner(user.sub, user.role as RoleType, dto.ids);
  }
}
