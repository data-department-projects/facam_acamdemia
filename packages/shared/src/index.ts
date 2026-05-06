/**
 * Package partagé FACAM ACADEMIA
 * Types, constantes et utilitaires communs entre frontend (Next.js) et backend (Nest.js).
 */

export const APP_NAME = 'FACAM ACADEMIA';

export type UserRole =
  | 'admin'
  | 'platform_manager'
  | 'module_manager_internal'
  | 'module_manager_external'
  | 'student'
  | 'employee'
  | 'support';

/** Rôles ayant accès à l'interface « responsable de module ». */
export const MODULE_MANAGER_ROLE_VALUES: readonly UserRole[] = [
  'module_manager_internal',
  'module_manager_external',
] as const;

/** Rôles ayant accès à l'interface « apprenant ». */
export const LEARNER_ROLE_VALUES: readonly UserRole[] = ['student', 'employee'] as const;

/**
 * Détermine la route d'accueil à partir d'un rôle unique.
 * Utilisé pour la redirection post-login quand l'utilisateur n'a qu'un seul rôle
 * ou a déjà choisi son interface active.
 */
export function getRoleHome(role: UserRole): string {
  const mapping: Record<UserRole, string> = {
    student: '/student',
    employee: '/student',
    module_manager_internal: '/module-manager',
    module_manager_external: '/module-manager',
    admin: '/admin',
    support: '/support',
    platform_manager: '/admin',
  };
  return mapping[role];
}

/** Label d'affichage pour chaque rôle (utilisé dans la page de sélection et l'admin). */
export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Étudiant',
  employee: 'Employé',
  module_manager_internal: 'Responsable module interne',
  module_manager_external: 'Responsable module externe',
  admin: 'Administrateur',
  platform_manager: 'Responsable plateforme',
  support: 'Support technique',
};

/**
 * Détermine le type d'interface à afficher pour un rôle donné.
 * Permet de regrouper les rôles partageant la même interface.
 */
export type InterfaceType = 'student' | 'module-manager' | 'admin' | 'support';

export function getInterfaceForRole(role: UserRole): InterfaceType {
  if (role === 'student' || role === 'employee') return 'student';
  if (role === 'module_manager_internal' || role === 'module_manager_external')
    return 'module-manager';
  if (role === 'admin' || role === 'platform_manager') return 'admin';
  return 'support';
}

/**
 * Déduplique les interfaces accessibles à partir d'une liste de rôles.
 * Retourne les rôles uniques (un par interface distincte).
 */
export function getDistinctInterfaces(roles: readonly UserRole[]): UserRole[] {
  const seen = new Set<InterfaceType>();
  const result: UserRole[] = [];
  for (const role of roles) {
    const iface = getInterfaceForRole(role);
    if (!seen.has(iface)) {
      seen.add(iface);
      result.push(role);
    }
  }
  return result;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
