/**
 * Contrôleur d'authentification : connexion (POST), health smoke test.
 */

import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Connexion : retourne un JWT d’accès court + pose un refresh httpOnly pour renouvellement sans ré‑identification.
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const data = await this.authService.seConnecter(loginDto);
    await this.authService.createRefreshSession(res, data.user.id);
    return data;
  }

  /**
   * Renouvelle le JWT d’accès à partir du cookie refresh (appelé par le client après expiration du bearer).
   */
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refreshWithCookie(req, res);
  }

  /**
   * Invalide le refresh côté serveur et supprime le cookie (logout explicite ou inactivité).
   */
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logoutRefresh(req, res);
    return { ok: true };
  }

  /**
   * Mot de passe oublié : envoie un OTP par email (expiration 3 minutes).
   */
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.demanderOtpReinitialisation(dto.email);
  }

  /**
   * Vérification de l'OTP reçu par email.
   */
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifierOtp(dto.email, dto.code);
  }

  /**
   * Réinitialisation du mot de passe (email + OTP + nouveau mot de passe).
   */
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.reinitialiserMotDePasse(dto.email, dto.code, dto.newPassword);
  }

  /**
   * Changement de mot de passe (utilisateur connecté : email + mot de passe actuel + nouveau).
   */
  @Post('change-password')
  async changePassword(@Body() dto: ChangePasswordDto) {
    return this.authService.changerMotDePasse(dto.email, dto.currentPassword, dto.newPassword);
  }

  /**
   * Smoke test : vérifie que le module auth répond (route protégée optionnelle).
   */
  @Get('test')
  getTest(): { status: string } {
    return { status: 'auth ok' };
  }

  /**
   * Profil courant (pour vérifier le token et récupérer firstLoginAt à jour).
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: UtilisateurPayload) {
    return this.authService.getProfil(user.sub);
  }

  /**
   * Avatar : multipart field `file`, max 2 Mo, JPG/PNG/WebP (voir validation côté service).
   */
  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    })
  )
  async uploadAvatar(
    @CurrentUser() user: UtilisateurPayload,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number } | undefined
  ) {
    if (!file) {
      throw new BadRequestException('Fichier image requis (champ multipart « file »).');
    }
    return this.authService.telechargerAvatar(user.sub, file);
  }
}
