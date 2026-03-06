/**
 * Décorateur pour récupérer l'utilisateur courant depuis le contexte de la requête (JWT).
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UtilisateurPayload {
  sub: string;
  email: string;
  role: string;
  fullName: string;
}

export const CurrentUser = createParamDecorator<
  keyof UtilisateurPayload | undefined,
  ExecutionContext
>(
  (
    data: keyof UtilisateurPayload | undefined,
    ctx: ExecutionContext
  ): UtilisateurPayload | string => {
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
