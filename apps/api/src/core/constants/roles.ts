/**
 * Rôles utilisateur et constantes métier.
 * Gère le système multi-rôles : un utilisateur peut avoir plusieurs rôles simultanés.
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

/** Rôles qui ont l'interface « responsable de module » (dashboard module-manager). */
export const MODULE_MANAGER_ROLES = [
  ROLES.MODULE_MANAGER_INTERNAL,
  ROLES.MODULE_MANAGER_EXTERNAL,
] as const;

/** Rôles qui ont l'interface « apprenant » (étudiant / employé). */
export const LEARNER_ROLES = [ROLES.STUDENT, ROLES.EMPLOYEE] as const;

/** Rôles qui exigent un matricule employé (employeeId). */
export const ROLES_REQUIRING_EMPLOYEE_ID: readonly RoleType[] = [
  ROLES.EMPLOYEE,
  ROLES.MODULE_MANAGER_INTERNAL,
  ROLES.MODULE_MANAGER_EXTERNAL,
] as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

/** Vérifie si au moins un des rôles donnés exige un matricule employé. */
export function requiresEmployeeId(roles: readonly string[]): boolean {
  return roles.some((r) => (ROLES_REQUIRING_EMPLOYEE_ID as readonly string[]).includes(r));
}

/** Vérifie si un rôle est un rôle de responsable de module. */
export function isModuleManagerRole(role: string): boolean {
  return (MODULE_MANAGER_ROLES as readonly string[]).includes(role);
}

/** Vérifie si la liste de rôles contient au moins un rôle autorisé. */
export function hasAnyRole(userRoles: readonly string[], allowedRoles: readonly string[]): boolean {
  return userRoles.some((r) => allowedRoles.includes(r));
}
