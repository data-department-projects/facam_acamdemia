/**
 * Helpers d'authentification — Stockage utilisateur et token, redirections par rôle.
 * Utilisé par le login et le DashboardShell pour persister la session et rediriger.
 */

import type { UserRole } from '@/types';

const USER_STORAGE_KEY = 'facam_user';
const TOKEN_STORAGE_KEY = 'facam_token';

export interface StoredUser {
  id?: string;
  email: string;
  role: UserRole;
  fullName: string;
  firstLoginAt?: string | null;
  /** URL publique Supabase Storage (bucket avatars) si définie. */
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
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

/**
 * Déconnexion : supprime utilisateur et token.
 */
export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/** Route d'accueil par rôle (après login). */
export const ROLE_HOME: Record<UserRole, string> = {
  student: '/student',
  employee: '/student',
  module_manager_internal: '/module-manager',
  module_manager_external: '/module-manager',
  admin: '/admin',
  support: '/support',
  platform_manager: '/admin',
};
