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
 * URL d'affichage pour un module : uniquement l'image dédiée du module.
 * Si absente, on n'affiche pas d'image.
 */
export function getModuleDisplayImage(module: { imageUrl?: string | null }): string | null {
  return module.imageUrl?.trim() ? module.imageUrl : null;
}
