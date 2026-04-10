/**
 * Service d'authentification : connexion, mise à jour première connexion.
 */

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AppStorageService } from '../storage/app-storage.service';
import type { LoginDto } from './dto/login.dto';
import type { UtilisateurPayload } from '../core/decorators/current-user.decorator';
import { FACAM_REFRESH_COOKIE } from './refresh.constants';

/** Fichier mémoire Multer (évite la dépendance stricte à @types/express/multer). */
export interface FichierAvatarUpload {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

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
    avatarUrl: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly appStorage: AppStorageService
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
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        firstLoginAt: true,
        avatarUrl: true,
      },
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
    const accessToken = this.jwtService.sign(payload, { expiresIn: this.accessExpiresIn() });
    return {
      accessToken,
      user: {
        id: utilisateurAvecDate.id,
        email: utilisateurAvecDate.email,
        fullName: utilisateurAvecDate.fullName,
        role: utilisateurAvecDate.role,
        firstLoginAt: utilisateurAvecDate.firstLoginAt?.toISOString() ?? null,
        avatarUrl: utilisateurAvecDate.avatarUrl ?? null,
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
    avatarUrl: string | null;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        firstLoginAt: true,
        avatarUrl: true,
      },
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
      avatarUrl: user.avatarUrl ?? null,
    };
  }

  /**
   * Enregistre un nouvel avatar : validation MIME/taille (multer), upload Storage,
   * mise à jour Prisma, puis suppression best-effort de l’ancien fichier.
   */
  async telechargerAvatar(
    userId: string,
    file: FichierAvatarUpload
  ): Promise<{ avatarUrl: string }> {
    this.appStorage.assertReady();
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier image vide ou invalide.');
    }
    const ext = this.appStorage.extForProfileMime(file.mimetype);
    if (!ext) {
      throw new BadRequestException('Format non accepté : JPG, PNG ou WebP uniquement.');
    }
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, avatarUrl: true },
    });
    if (!existing) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    const previousUrl = existing.avatarUrl;
    let publicUrl: string;
    try {
      const uploaded = await this.appStorage.uploadUserProfileImage(
        userId,
        file.buffer,
        file.mimetype
      );
      publicUrl = uploaded.publicUrl;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Échec du téléversement';
      throw new InternalServerErrorException(msg);
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: publicUrl },
    });
    if (previousUrl) {
      await this.appStorage.removeUserProfileImageByUrlIfOwned(previousUrl, userId);
    }
    return { avatarUrl: publicUrl };
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

  /** Durée du bearer uniquement ; le refresh cookie prolonge la session si l’utilisateur est actif. */
  private accessExpiresIn(): string {
    return this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
  }

  private refreshDays(): number {
    const n = Number(this.configService.get<string>('REFRESH_TOKEN_DAYS') ?? 30);
    return Number.isFinite(n) && n > 0 ? n : 30;
  }

  private hashRefresh(raw: string): string {
    return createHash('sha256').update(raw, 'utf8').digest('hex');
  }

  /**
   * Front Vercel + API Render (ou tout hébergeur) = origines différentes → `AUTH_REFRESH_SAMESITE=none` + HTTPS obligatoire.
   * Front et API sur le même site (ex. app. et api. même domaine) → `lax` suffit souvent.
   */
  private refreshCookieSameSite(): 'lax' | 'none' | 'strict' {
    const raw = (this.configService.get<string>('AUTH_REFRESH_SAMESITE') ?? 'lax').toLowerCase();
    if (raw === 'none' || raw === 'strict') return raw;
    return 'lax';
  }

  /** `SameSite=None` impose `Secure=true` (navigateurs). */
  private refreshCookieSecure(sameSite: 'lax' | 'none' | 'strict'): boolean {
    if (sameSite === 'none') return true;
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private setRefreshCookie(res: Response, raw: string, maxAgeDays: number): void {
    const sameSite = this.refreshCookieSameSite();
    const secure = this.refreshCookieSecure(sameSite);
    res.cookie(FACAM_REFRESH_COOKIE, raw, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(res: Response): void {
    const sameSite = this.refreshCookieSameSite();
    const secure = this.refreshCookieSecure(sameSite);
    res.clearCookie(FACAM_REFRESH_COOKIE, {
      path: '/',
      httpOnly: true,
      secure,
      sameSite,
    });
  }

  /**
   * Crée un refresh token (rotation à chaque nouvelle session navigateur).
   * Un seul refresh actif par compte évite l’accumulation de sessions zombies.
   */
  async createRefreshSession(res: Response, userId: string): Promise<void> {
    const days = this.refreshDays();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    const raw = randomBytes(32).toString('base64url');
    const tokenHash = this.hashRefresh(raw);
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
    this.setRefreshCookie(res, raw, days);
  }

  /**
   * Émet un nouveau JWT d’accès si le cookie refresh est valide ; rotation du refresh.
   */
  async refreshWithCookie(req: Request, res: Response): Promise<{ accessToken: string }> {
    const raw = req.cookies[FACAM_REFRESH_COOKIE] as string | undefined;
    if (!raw) {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Session expirée');
    }
    const tokenHash = this.hashRefresh(raw);
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: { select: { id: true, email: true, role: true, fullName: true } },
      },
    });
    if (!row || row.revokedAt || row.expiresAt <= new Date()) {
      await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Session expirée');
    }

    const days = this.refreshDays();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    const newRaw = randomBytes(32).toString('base64url');
    const newHash = this.hashRefresh(newRaw);

    await this.prisma.$transaction([
      this.prisma.refreshToken.delete({ where: { id: row.id } }),
      this.prisma.refreshToken.create({
        data: {
          userId: row.userId,
          tokenHash: newHash,
          expiresAt,
        },
      }),
    ]);

    this.setRefreshCookie(res, newRaw, days);

    const payload: UtilisateurPayload = {
      sub: row.user.id,
      email: row.user.email,
      role: row.user.role,
      fullName: row.user.fullName,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: this.accessExpiresIn() });
    return { accessToken };
  }

  /**
   * Révoque le refresh (logout navigateur ou inactivité côté client).
   */
  async logoutRefresh(req: Request, res: Response): Promise<void> {
    const raw = req.cookies[FACAM_REFRESH_COOKIE] as string | undefined;
    if (raw) {
      const tokenHash = this.hashRefresh(raw);
      await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
    }
    this.clearRefreshCookie(res);
  }
}
