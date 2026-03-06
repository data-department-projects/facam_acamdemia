/**
 * Contrôleur d'authentification : connexion (POST), health smoke test.
 */

import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
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
   * Connexion : retourne un JWT et les infos utilisateur (dont firstLoginAt pour le compte à rebours).
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.seConnecter(loginDto);
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
}
