/**
 * Rôles utilisateur et constantes métier.
 * Un seul export par fichier : objet ROLES.
 */

export const ROLES = {
  ADMIN: 'admin',
  PLATFORM_MANAGER: 'platform_manager',
  MODULE_MANAGER_INTERNAL: 'module_manager_internal',
  MODULE_MANAGER_EXTERNAL: 'module_manager_external',
  STUDENT: 'student',
  EMPLOYEE: 'employee',
  SUPPORT: 'support',
} as const;

/** Rôles qui ont l’interface « responsable de module » (dashboard module-manager). */
export const MODULE_MANAGER_ROLES = [
  ROLES.MODULE_MANAGER_INTERNAL,
  ROLES.MODULE_MANAGER_EXTERNAL,
] as const;

/** Rôles qui ont l’interface « apprenant » (étudiant / employé). */
export const LEARNER_ROLES = [ROLES.STUDENT, ROLES.EMPLOYEE] as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];
