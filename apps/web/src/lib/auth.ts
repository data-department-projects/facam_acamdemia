/**
 * Helpers d'authentification — Stockage utilisateur multi-rôles et token, redirections par rôle.
 * Le champ `role` représente le rôle actif (interface choisie).
 * Le champ `roles` contient la liste complète des rôles de l'utilisateur.
 */

import type { UserRole } from '@/types';
import { getRoleHome, getDistinctInterfaces } from '@/types';
import { logoutRefreshSession } from '@/lib/api-client';

const USER_STORAGE_KEY = 'facam_user';
const TOKEN_STORAGE_KEY = 'facam_token';
const ACTIVE_ROLE_KEY = 'facam_active_role';

export interface StoredUser {
  id?: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
  fullName: string;
  employeeId?: string | null;
  phoneNumber1?: string | null;
  phoneNumber2?: string | null;
  firstLoginAt?: string | null;
  avatarUrl?: string | null;
}

/**
 * Enregistre l'utilisateur et le token après un login réussi (API ou démo).
 */
export function setAuthSession(user: StoredUser, token?: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
  }
}

/**
 * Récupère l'utilisateur stocké (pour affichage et redirection).
 */
export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUser;
    if (!parsed.roles || !Array.isArray(parsed.roles)) {
      parsed.roles = parsed.role ? [parsed.role] : [];
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Déconnexion : supprime utilisateur, token et rôle actif.
 */
export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(ACTIVE_ROLE_KEY);
}

/**
 * Déconnexion complète : révoque le refresh (cookie httpOnly) puis efface le stockage local.
 */
export async function signOutFullClient(): Promise<void> {
  await logoutRefreshSession();
  clearAuthSession();
}

/**
 * Enregistre le rôle actif choisi par l'utilisateur (page de sélection d'interface).
 */
export function setActiveRole(role: UserRole): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACTIVE_ROLE_KEY, role);
  const user = getStoredUser();
  if (user) {
    user.role = role;
    setAuthSession(user);
  }
}

/**
 * Récupère le rôle actif (interface actuellement choisie).
 */
export function getActiveRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  const role = window.localStorage.getItem(ACTIVE_ROLE_KEY);
  return role as UserRole | null;
}

/**
 * Détermine la redirection post-login en fonction des rôles de l'utilisateur.
 * Si un seul type d'interface est disponible, redirige directement.
 * Si plusieurs interfaces sont disponibles, redirige vers la page de sélection.
 */
export function getPostLoginRedirect(roles: readonly UserRole[]): string {
  const distinctInterfaces = getDistinctInterfaces(roles);
  if (distinctInterfaces.length <= 1) {
    const role = roles[0] ?? 'student';
    return getRoleHome(role);
  }
  return '/select-role';
}

/** Route d'accueil par rôle (rétrocompatibilité — utilise getRoleHome du shared). */
export const ROLE_HOME: Record<UserRole, string> = {
  student: '/student',
  employee: '/student',
  module_manager_internal: '/module-manager',
  module_manager_external: '/module-manager',
  admin: '/admin',
  support: '/support',
  platform_manager: '/admin',
};
