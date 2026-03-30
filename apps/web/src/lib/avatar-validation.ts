/**
 * Règles de validation des avatars (alignées avec l’API Nest + bucket Supabase).
 * Réutilisables côté client pour un feedback immédiat avant envoi multipart.
 */

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const AVATAR_ACCEPT_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const AVATAR_ACCEPT_INPUT = AVATAR_ACCEPT_MIME.join(',');

export function validateAvatarFile(file: File): { ok: true } | { ok: false; message: string } {
  if (!AVATAR_ACCEPT_MIME.includes(file.type as (typeof AVATAR_ACCEPT_MIME)[number])) {
    return {
      ok: false,
      message: 'Format non supporté. Utilisez JPG, PNG ou WebP.',
    };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return {
      ok: false,
      message: 'Fichier trop volumineux (maximum 2 Mo).',
    };
  }
  return { ok: true };
}

/** Initiales affichées en secours (1–2 caractères). */
export function initialsFromFullName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
