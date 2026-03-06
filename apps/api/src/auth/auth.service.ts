/**
 * Service d'authentification : connexion, mise à jour première connexion.
 */

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import type { LoginDto } from './dto/login.dto';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';

const OTP_EXPIRATION_MINUTES = 3;
const SALT_ROUNDS = 10;

export interface ReponseConnexion {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    firstLoginAt: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService
  ) {}

  /**
   * Authentifie un utilisateur et retourne un JWT + infos utilisateur.
   * Met à jour firstLoginAt pour un étudiant à sa première connexion.
   */
  async seConnecter(loginDto: LoginDto): Promise<ReponseConnexion> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase().trim() },
    });
    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }
    const motDePasseValide = await this.verifierMotDePasse(loginDto.password, user.passwordHash);
    if (!motDePasseValide) {
      throw new UnauthorizedException('Identifiants incorrects');
    }
    const estPremiereConnexion = user.role === 'student' && user.firstLoginAt === null;
    if (estPremiereConnexion) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { firstLoginAt: new Date() },
      });
    }
    const utilisateurAvecDate = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, fullName: true, role: true, firstLoginAt: true },
    });
    if (!utilisateurAvecDate) {
      throw new UnauthorizedException('Erreur lors de la récupération du profil');
    }
    const payload: UtilisateurPayload = {
      sub: utilisateurAvecDate.id,
      email: utilisateurAvecDate.email,
      role: utilisateurAvecDate.role,
      fullName: utilisateurAvecDate.fullName,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: {
        id: utilisateurAvecDate.id,
        email: utilisateurAvecDate.email,
        fullName: utilisateurAvecDate.fullName,
        role: utilisateurAvecDate.role,
        firstLoginAt: utilisateurAvecDate.firstLoginAt?.toISOString() ?? null,
      },
    };
  }

  /**
   * Récupère le profil utilisateur (pour GET /auth/me).
   */
  async getProfil(userId: string): Promise<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    firstLoginAt: string | null;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, role: true, firstLoginAt: true },
    });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      firstLoginAt: user.firstLoginAt?.toISOString() ?? null,
    };
  }

  /**
   * Demande d'OTP pour réinitialisation : génère un code 6 chiffres, le stocke (3 min), envoie l'email.
   */
  async demanderOtpReinitialisation(email: string): Promise<{ message: string }> {
    const emailNorm = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: emailNorm } });
    if (!user) {
      return { message: 'Si ce compte existe, un email avec le code vous a été envoyé.' };
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRATION_MINUTES);
    await this.prisma.passwordResetOtp.deleteMany({ where: { email: emailNorm } });
    await this.prisma.passwordResetOtp.create({
      data: { email: emailNorm, code, expiresAt },
    });
    const result = await this.emailService.envoyerOtpReinitialisation(emailNorm, code);
    if (!result.success) {
      throw new BadRequestException(result.error ?? "Impossible d'envoyer l'email");
    }
    return { message: 'Si ce compte existe, un email avec le code vous a été envoyé.' };
  }

  /**
   * Vérifie l'OTP (email + code). Retourne { valid: true } si le code est valide et non expiré.
   */
  async verifierOtp(email: string, code: string): Promise<{ valid: boolean }> {
    const emailNorm = email.toLowerCase().trim();
    const otp = await this.prisma.passwordResetOtp.findFirst({
      where: { email: emailNorm, code },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || new Date() > otp.expiresAt) {
      return { valid: false };
    }
    return { valid: true };
  }

  /**
   * Change le mot de passe (utilisateur connecté, vérification par mot de passe actuel).
   */
  async changerMotDePasse(
    email: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const emailNorm = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: emailNorm } });
    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }
    const motDePasseValide = await this.verifierMotDePasse(currentPassword, user.passwordHash);
    if (!motDePasseValide) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { email: emailNorm },
      data: { passwordHash },
    });
    return { message: 'Mot de passe mis à jour avec succès.' };
  }

  /**
   * Réinitialise le mot de passe après vérification de l'OTP.
   */
  async reinitialiserMotDePasse(
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const { valid } = await this.verifierOtp(email, code);
    if (!valid) {
      throw new BadRequestException('Code invalide ou expiré');
    }
    const emailNorm = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { email: emailNorm },
      data: { passwordHash },
    });
    await this.prisma.passwordResetOtp.deleteMany({ where: { email: emailNorm } });
    return { message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' };
  }

  private async verifierMotDePasse(motDePasseClair: string, hash: string | null): Promise<boolean> {
    if (!hash) {
      return false;
    }
    return bcrypt.compare(motDePasseClair, hash);
  }
}
