/**
 * Service utilisateurs : CRUD (admin), liste par rôle, création avec mot de passe hashé.
 */

import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { ROLES } from '../core/constants';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée un utilisateur (étudiant ou responsable de module). Responsable = un module assigné.
   */
  async creer(
    dto: CreateUserDto
  ): Promise<{ id: string; email: string; fullName: string; role: string }> {
    const emailNormalise = dto.email.toLowerCase().trim();
    const existe = await this.prisma.user.findUnique({ where: { email: emailNormalise } });
    if (existe) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }
    if (dto.role === ROLES.MODULE_MANAGER && !dto.moduleId) {
      throw new BadRequestException('Un responsable de module doit être assigné à un module');
    }
    if (dto.moduleId) {
      const moduleExiste = await this.prisma.module.findUnique({ where: { id: dto.moduleId } });
      if (!moduleExiste) {
        throw new BadRequestException('Module introuvable');
      }
      const moduleDejaAssigné = await this.prisma.module.findFirst({
        where: { managerId: { not: null }, id: dto.moduleId },
      });
      if (moduleDejaAssigné?.managerId) {
        throw new ConflictException('Ce module a déjà un responsable assigné');
      }
    }
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: emailNormalise,
        passwordHash,
        fullName: dto.fullName.trim(),
        role: dto.role,
        ...(dto.role === ROLES.MODULE_MANAGER && dto.moduleId
          ? { managedModule: { connect: { id: dto.moduleId } } }
          : {}),
      },
      select: { id: true, email: true, fullName: true, role: true },
    });
    return user;
  }

  /**
   * Liste paginée des utilisateurs (optionnel : filtrer par rôle).
   */
  async trouverTous(params: {
    page: number;
    limit: number;
    role?: string;
  }): Promise<{ data: unknown[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page, limit, role } = params;
    const skip = (page - 1) * limit;
    const where = role ? { role } : {};
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          firstLoginAt: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit) || 1;
    return { data, total, page, limit, totalPages };
  }

  /**
   * Récupère un utilisateur par ID.
   */
  async trouverUn(id: string): Promise<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    firstLoginAt: string | null;
    createdAt: Date;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        firstLoginAt: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return {
      ...user,
      firstLoginAt: user.firstLoginAt?.toISOString() ?? null,
    };
  }

  /**
   * Met à jour un utilisateur (champs partiels).
   */
  async mettreAJour(
    id: string,
    dto: UpdateUserDto
  ): Promise<{ id: string; email: string; fullName: string; role: string }> {
    await this.trouverUn(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: { id: true, email: true, fullName: true, role: true },
    });
    return user;
  }

  /**
   * Supprime un utilisateur (attention : cascades Prisma).
   */
  async supprimer(id: string): Promise<{ message: string }> {
    await this.trouverUn(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Utilisateur supprimé' };
  }
}
