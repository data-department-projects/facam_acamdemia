/**
 * Décorateur pour récupérer l'utilisateur courant depuis le contexte de la requête (JWT).
 * Le payload inclut `roles` (liste complète) et `role` (rôle actif, rétrocompatibilité).
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UtilisateurPayload {
  sub: string;
  email: string;
  role: string;
  roles: string[];
  fullName: string;
}

export const CurrentUser = createParamDecorator<
  keyof UtilisateurPayload | undefined,
  ExecutionContext
>(
  (
    data: keyof UtilisateurPayload | undefined,
    ctx: ExecutionContext
  ): UtilisateurPayload | string | string[] => {
    const request = ctx.switchToHttp().getRequest<{ user?: UtilisateurPayload }>();
    const user = request.user;
    if (!user) {
      return '' as unknown as UtilisateurPayload;
    }
    if (data) {
      return user[data];
    }
    return user;
  }
);
