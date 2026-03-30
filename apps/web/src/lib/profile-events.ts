/**
 * Événement global pour resynchroniser le shell (header, layout) après mise à jour du profil
 * stocké en localStorage, sans prop drilling. Écouté par DashboardShell.
 */

export const PROFILE_UPDATED_EVENT = 'facam-profile-updated';

export function emitProfileUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}
