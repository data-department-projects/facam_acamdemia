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
    const isManagerRole =
      dto.role === ROLES.MODULE_MANAGER_INTERNAL || dto.role === ROLES.MODULE_MANAGER_EXTERNAL;
    if (isManagerRole && !dto.moduleId) {
      throw new BadRequestException('Un responsable de module doit être assigné à un module');
    }
    if (dto.moduleId) {
      const moduleExiste = await this.prisma.module.findUnique({
        where: { id: dto.moduleId },
        select: { id: true, moduleType: true, managerId: true },
      });
      if (!moduleExiste) {
        throw new BadRequestException('Module introuvable');
      }
      if (moduleExiste.managerId) {
        throw new ConflictException('Ce module a déjà un responsable assigné');
      }
      if (dto.role === ROLES.MODULE_MANAGER_INTERNAL && moduleExiste.moduleType !== 'interne') {
        throw new BadRequestException(
          'Le responsable module interne doit être assigné à un module de type Interne'
        );
      }
      if (dto.role === ROLES.MODULE_MANAGER_EXTERNAL && moduleExiste.moduleType !== 'externe') {
        throw new BadRequestException(
          'Le responsable module externe doit être assigné à un module de type Externe'
        );
      }
    }
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: emailNormalise,
        passwordHash,
        fullName: dto.fullName.trim(),
        role: dto.role,
        ...(isManagerRole && dto.moduleId
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
          managedModule: { select: { id: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit) || 1;
    const dataWithModuleId = data.map((u) => ({
      ...u,
      moduleId: (u as { managedModule?: { id: string } | null }).managedModule?.id ?? null,
      managedModule: undefined,
    }));
    return { data: dataWithModuleId, total, page, limit, totalPages };
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
    moduleId: string | null;
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
        managedModule: { select: { id: true } },
      },
    });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    const { managedModule, ...rest } = user;
    return {
      ...rest,
      firstLoginAt: user.firstLoginAt?.toISOString() ?? null,
      moduleId: managedModule?.id ?? null,
    };
  }

  /**
   * Met à jour un utilisateur (champs partiels : nom, rôle, module, mot de passe).
   */
  async mettreAJour(
    id: string,
    dto: UpdateUserDto
  ): Promise<{ id: string; email: string; fullName: string; role: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: { managedModule: { select: { id: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    if (dto.moduleId !== undefined) {
      if (dto.moduleId === null || dto.moduleId === '') {
        await this.prisma.module.updateMany({
          where: { managerId: id },
          data: { managerId: null },
        });
      } else {
        const moduleExiste = await this.prisma.module.findUnique({
          where: { id: dto.moduleId },
          select: { id: true, moduleType: true, managerId: true },
        });
        if (!moduleExiste) {
          throw new BadRequestException('Module introuvable');
        }
        if (moduleExiste.managerId && moduleExiste.managerId !== id) {
          throw new ConflictException('Ce module a déjà un autre responsable assigné');
        }
        const roleToCheck = dto.role ?? existing.role;
        if (
          roleToCheck === ROLES.MODULE_MANAGER_INTERNAL &&
          moduleExiste.moduleType !== 'interne'
        ) {
          throw new BadRequestException(
            'Le responsable module interne doit être assigné à un module de type Interne'
          );
        }
        if (
          roleToCheck === ROLES.MODULE_MANAGER_EXTERNAL &&
          moduleExiste.moduleType !== 'externe'
        ) {
          throw new BadRequestException(
            'Le responsable module externe doit être assigné à un module de type Externe'
          );
        }
      }
    }
    const updateData: {
      fullName?: string;
      role?: string;
      avatarUrl?: string;
      passwordHash?: string;
      managedModule?: { connect: { id: string } } | { disconnect: boolean };
    } = {};
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName.trim();
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;
    if (dto.password?.trim()) {
      updateData.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }
    if (dto.moduleId !== undefined) {
      if (dto.moduleId === null || dto.moduleId === '') {
        updateData.managedModule = { disconnect: true };
      } else {
        const roleToUse = dto.role ?? existing.role;
        const isManager =
          roleToUse === ROLES.MODULE_MANAGER_INTERNAL ||
          roleToUse === ROLES.MODULE_MANAGER_EXTERNAL;
        if (isManager) updateData.managedModule = { connect: { id: dto.moduleId } };
      }
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
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
