/**
 * Décorateur pour restreindre l'accès par rôle(s).
 * À utiliser avec RolesGuard.
 */

import { SetMetadata } from '@nestjs/common';
import type { RoleType } from '../constants/roles';

export const ROLES_KEY = 'roles';

/**
 * Déclare les rôles autorisés sur une route ou un controller.
 * @param roles - Un ou plusieurs rôles (admin, module_manager_internal, module_manager_external, student, support)
 */
export function Roles(...roles: RoleType[]): ReturnType<typeof SetMetadata> {
  return SetMetadata(ROLES_KEY, roles);
}
