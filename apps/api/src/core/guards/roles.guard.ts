/**
 * Guard des rôles : vérifie que l'utilisateur courant possède au moins un rôle autorisé.
 * Compatible multi-rôles : vérifie dans `roles[]` puis fallback sur `role` (rétrocompatibilité).
 * À utiliser après JwtAuthGuard (pour avoir request.user).
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RoleType } from '../constants/roles';
import type { UtilisateurPayload } from '../decorators/current-user.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesExiges = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!rolesExiges?.length) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user?: UtilisateurPayload }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Accès refusé');
    }
    const userRoles: string[] = user.roles?.length ? user.roles : [user.role];
    const aUnRoleAutorise = userRoles.some((r) => rolesExiges.includes(r as RoleType));
    if (!aUnRoleAutorise) {
      throw new ForbiddenException('Droits insuffisants');
    }
    return true;
  }
}
