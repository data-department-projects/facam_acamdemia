/**
 * Guard des rôles : vérifie que l'utilisateur courant a l'un des rôles autorisés.
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
    const aUnRoleAutorise = rolesExiges.includes(user.role as RoleType);
    if (!aUnRoleAutorise) {
      throw new ForbiddenException('Droits insuffisants');
    }
    return true;
  }
}
