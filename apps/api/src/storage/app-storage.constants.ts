/**
 * Constantes du bucket unique Supabase (`app-storage`) et chemins logiques.
 * profils/ — avatars ; images/modules/ — couvertures ; cours/ — pièces jointes pédagogiques.
 */

export const APP_STORAGE_BUCKET = 'app-storage';

/** Ancien bucket (suppression uniquement si l’URL pointe encore dessus). */
export const LEGACY_AVATARS_BUCKET = 'avatars';

export const STORAGE_PREFIX = {
  profils: 'profils',
  moduleImages: 'images/modules',
  cours: 'cours',
} as const;

export const PROFILE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const MODULE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const CHAPTER_DOC_MAX_BYTES = 50 * 1024 * 1024;

export const MODULE_IMAGE_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const CHAPTER_DOC_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.ms-powerpoint': 'ppt',
};
