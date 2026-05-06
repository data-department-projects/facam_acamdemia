/**
 * Stratégie Passport JWT : valide le token et attache le payload (multi-rôles) à request.user.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { UtilisateurPayload } from '../../core/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  roles?: string[];
  fullName: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'cle-secret-facam-dev',
    });
  }

  async validate(payload: JwtPayload): Promise<UtilisateurPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, fullName: true, role: true, roles: true },
    });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    const effectiveRoles = user.roles.length > 0 ? user.roles : [user.role];
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      roles: effectiveRoles,
      fullName: user.fullName,
    };
  }
}
