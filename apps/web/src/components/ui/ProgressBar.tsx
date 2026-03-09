/**
 * ProgressBar — Barre de progression visuelle pour le parcours étudiant.
 * Utilisée pour la progression d'un module (pourcentage). Couleur d'accent jaune pour la partie remplie.
 * Rôle : feedback visuel clair sur l'avancement (design system e-learning).
 */

'use client';

import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  /** Pourcentage entre 0 et 100 */
  value: number;
  /** Hauteur de la barre (classes Tailwind ou valeur) */
  height?: 'sm' | 'md' | 'lg';
  /** Classe du conteneur */
  className?: string;
  /** Afficher le label en pourcentage à droite */
  showLabel?: boolean;
  /** Accessibilité : texte pour screen readers */
  ariaLabel?: string;
}

const heightClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3',
};

export function ProgressBar({
  value,
  height = 'md',
  className,
  showLabel = false,
  ariaLabel,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, Number(value)));
  const label = `${Math.round(percent)} %`;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={ariaLabel ?? `Progression : ${label}`}
          className={cn('w-full overflow-hidden rounded-full bg-gray-200', heightClasses[height])}
        >
          <div
            className={cn(
              'h-full rounded-full bg-facam-yellow transition-all duration-300 ease-out',
              heightClasses[height]
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        {showLabel && (
          <span className="text-sm font-medium text-gray-600 tabular-nums shrink-0">{label}</span>
        )}
      </div>
    </div>
  );
}
