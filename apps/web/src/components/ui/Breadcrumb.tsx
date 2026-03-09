/**
 * Breadcrumb (fil d'Ariane) — Navigation claire pour l'étudiant.
 * Affiche le chemin : Accueil > Module > Cours > Chapitre.
 * Rôle : améliorer l'UX et le repérage dans la plateforme e-learning.
 */

'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Composant Breadcrumb : liste d'éléments cliquables avec séparateur.
 * Le dernier élément n'est pas un lien (page courante).
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={cn('flex items-center gap-1 text-sm text-gray-600 flex-wrap', className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="size-4 text-gray-400 flex-shrink-0" aria-hidden />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="font-medium text-facam-blue hover:text-facam-dark hover:underline transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? 'font-semibold text-facam-dark' : 'text-gray-600')}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
