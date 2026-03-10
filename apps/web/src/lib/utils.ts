/**
 * Utilitaires partagés pour le frontend FACAM ACADEMIA.
 * cn() fusionne les classes Tailwind de manière prédictive (tailwind-merge + clsx).
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine des noms de classes avec gestion des conflits Tailwind.
 * Utilisé partout pour les className conditionnelles.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extrait l'ID d'une URL YouTube et retourne l'URL de la miniature (image de présentation).
 * Supporte : youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 */
export function getYoutubeThumbnailUrl(videoUrl: string | null | undefined): string | null {
  if (!videoUrl?.trim()) return null;
  const match = videoUrl.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
  );
  if (!match) return null;
  return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
}

/**
 * URL d'affichage pour un module : image dédiée, ou miniature de la première vidéo YouTube, ou placeholder.
 */
export function getModuleDisplayImage(module: {
  imageUrl?: string | null;
  firstVideoUrl?: string | null;
}): string {
  if (module.imageUrl?.trim()) return module.imageUrl;
  const thumb = getYoutubeThumbnailUrl(module.firstVideoUrl ?? undefined);
  return thumb ?? '/placeholder-course.jpg';
}
