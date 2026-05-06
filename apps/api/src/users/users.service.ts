/**
 * Service utilisateurs : CRUD (admin), système multi-rôles, validation employeeId et téléphones.
 * Le champ `role` reste le rôle actif/principal (rétrocompatibilité).
 * Le champ `roles` contient la liste complète des rôles de l'utilisateur.
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
import { ROLES, requiresEmployeeId, isModuleManagerRole } from '../core/constants';

const SALT_ROUNDS = 10;

/** Champs retournés pour un utilisateur dans les réponses API. */
export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  roles: string[];
  employeeId: string | null;
  phoneNumber1: string | null;
  phoneNumber2: string | null;
}

/** Champs retournés pour un utilisateur avec détails complets. */
export interface UserDetailResponse extends UserResponse {
  firstLoginAt: string | null;
  createdAt: Date;
  moduleId: string | null;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Résout la liste de rôles à partir du DTO (rétrocompatibilité role + nouveau roles[]).
   * Quand un responsable de module est créé, il reçoit automatiquement le rôle employee.
   */
  private resolveRoles(dto: { role?: string; roles?: string[] }): string[] {
    const hasRolesArray = dto.roles && dto.roles.length > 0;
    const rolesFromDto = hasRolesArray ? [...dto.roles!] : dto.role ? [dto.role] : [];
    if (rolesFromDto.length === 0) {
      throw new BadRequestException('Au moins un rôle est requis (role ou roles)');
    }
    const hasManagerRole = rolesFromDto.some(isModuleManagerRole);
    if (hasManagerRole && !rolesFromDto.includes(ROLES.EMPLOYEE)) {
      rolesFromDto.push(ROLES.EMPLOYEE);
    }
    return [...new Set(rolesFromDto)];
  }

  /**
   * Crée un utilisateur avec un ou plusieurs rôles.
   * Attribue automatiquement le rôle employee aux responsables de module.
   */
  async creer(dto: CreateUserDto): Promise<UserResponse> {
    const emailNormalise = dto.email.toLowerCase().trim();
    const existe = await this.prisma.user.findUnique({ where: { email: emailNormalise } });
    if (existe) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }
    const roles = this.resolveRoles(dto);
    const hasManagerRole = roles.some(isModuleManagerRole);
    if (hasManagerRole && !dto.moduleId) {
      throw new BadRequestException('Un responsable de module doit être assigné à un module');
    }
    if (requiresEmployeeId(roles) && !dto.employeeId?.trim()) {
      throw new BadRequestException(
        'Le matricule employé (employeeId) est obligatoire pour les employés et responsables'
      );
    }
    if (dto.employeeId?.trim()) {
      const employeeIdExiste = await this.prisma.user.findUnique({
        where: { employeeId: dto.employeeId.trim() },
      });
      if (employeeIdExiste) {
        throw new ConflictException('Ce matricule employé est déjà utilisé');
      }
    }
    if (dto.moduleId) {
      await this.validerModulePourManager(dto.moduleId, roles, null);
    }
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const primaryRole = roles[0];
    const user = await this.prisma.user.create({
      data: {
        email: emailNormalise,
        passwordHash,
        fullName: dto.fullName.trim(),
        role: primaryRole,
        roles,
        employeeId: dto.employeeId?.trim() || null,
        phoneNumber1: dto.phoneNumber1?.trim() || null,
        phoneNumber2: dto.phoneNumber2?.trim() || null,
        ...(hasManagerRole && dto.moduleId
          ? { managedModule: { connect: { id: dto.moduleId } } }
          : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        roles: true,
        employeeId: true,
        phoneNumber1: true,
        phoneNumber2: true,
      },
    });
    return user;
  }

  /**
   * Valide qu'un module peut être assigné à un responsable (type interne/externe cohérent).
   */
  private async validerModulePourManager(
    moduleId: string,
    roles: string[],
    currentUserId: string | null
  ): Promise<void> {
    const moduleExiste = await this.prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true, moduleType: true, managerId: true },
    });
    if (!moduleExiste) {
      throw new BadRequestException('Module introuvable');
    }
    if (moduleExiste.managerId && moduleExiste.managerId !== currentUserId) {
      throw new ConflictException('Ce module a déjà un responsable assigné');
    }
    if (roles.includes(ROLES.MODULE_MANAGER_INTERNAL) && moduleExiste.moduleType !== 'interne') {
      throw new BadRequestException(
        'Le responsable module interne doit être assigné à un module de type Interne'
      );
    }
    if (roles.includes(ROLES.MODULE_MANAGER_EXTERNAL) && moduleExiste.moduleType !== 'externe') {
      throw new BadRequestException(
        'Le responsable module externe doit être assigné à un module de type Externe'
      );
    }
  }

  /**
   * Liste paginée des utilisateurs (optionnel : filtrer par rôle).
   * Le filtre `role` recherche dans le tableau `roles` (contient le rôle).
   */
  async trouverTous(params: {
    page: number;
    limit: number;
    role?: string;
  }): Promise<{ data: unknown[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page, limit, role } = params;
    const skip = (page - 1) * limit;
    const where = role ? { roles: { has: role } } : {};
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
          roles: true,
          employeeId: true,
          phoneNumber1: true,
          phoneNumber2: true,
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
   * Récupère un utilisateur par ID avec tous ses détails.
   */
  async trouverUn(id: string): Promise<UserDetailResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        roles: true,
        employeeId: true,
        phoneNumber1: true,
        phoneNumber2: true,
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
   * Met à jour un utilisateur (champs partiels : nom, rôles, module, mot de passe, employeeId, téléphones).
   */
  async mettreAJour(id: string, dto: UpdateUserDto): Promise<UserResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: { managedModule: { select: { id: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    const newRoles = dto.roles?.length || dto.role ? this.resolveRoles(dto) : undefined;
    if (newRoles && requiresEmployeeId(newRoles)) {
      const effectiveEmployeeId =
        dto.employeeId !== undefined ? dto.employeeId : existing.employeeId;
      if (!effectiveEmployeeId?.trim()) {
        throw new BadRequestException(
          'Le matricule employé est obligatoire pour les employés et responsables'
        );
      }
    }
    if (dto.employeeId?.trim()) {
      const employeeIdExiste = await this.prisma.user.findUnique({
        where: { employeeId: dto.employeeId.trim() },
      });
      if (employeeIdExiste && employeeIdExiste.id !== id) {
        throw new ConflictException('Ce matricule employé est déjà utilisé');
      }
    }
    if (dto.moduleId !== undefined) {
      if (dto.moduleId === null || dto.moduleId === '') {
        await this.prisma.module.updateMany({
          where: { managerId: id },
          data: { managerId: null },
        });
      } else {
        const rolesToCheck = newRoles ?? existing.roles;
        await this.validerModulePourManager(dto.moduleId, rolesToCheck, id);
      }
    }
    const updateData: Record<string, unknown> = {};
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName.trim();
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;
    if (dto.employeeId !== undefined) {
      updateData.employeeId = dto.employeeId?.trim() || null;
    }
    if (dto.phoneNumber1 !== undefined) updateData.phoneNumber1 = dto.phoneNumber1.trim();
    if (dto.phoneNumber2 !== undefined) {
      updateData.phoneNumber2 = dto.phoneNumber2?.trim() || null;
    }
    if (dto.password?.trim()) {
      updateData.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }
    if (newRoles) {
      updateData.roles = newRoles;
      updateData.role = newRoles[0];
    }
    if (dto.moduleId !== undefined) {
      if (dto.moduleId === null || dto.moduleId === '') {
        updateData.managedModule = { disconnect: true };
      } else {
        const rolesToUse = newRoles ?? existing.roles;
        const hasManager = rolesToUse.some(isModuleManagerRole);
        if (hasManager) updateData.managedModule = { connect: { id: dto.moduleId } };
      }
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        roles: true,
        employeeId: true,
        phoneNumber1: true,
        phoneNumber2: true,
      },
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
