/**
 * Rôles utilisateur et constantes métier.
 * Un seul export par fichier : objet ROLES.
 */

export const ROLES = {
  ADMIN: 'admin',
  MODULE_MANAGER: 'module_manager',
  STUDENT: 'student',
  SUPPORT: 'support',
  PLATFORM_MANAGER: 'platform_manager',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];
