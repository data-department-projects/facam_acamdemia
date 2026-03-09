/**
 * CourseCard — Carte de cours type Udemy pour la homepage et les listes.
 * Affiche : image, titre, formateur, note (étoiles), nombre de participants.
 * Utilisé pour : grille d'accueil, recommandations, catalogue.
 * Base à connaître : composants présentiels réutilisables, Next.js Link, Image.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import type { Module } from '@/types';

interface CourseCardProps {
  readonly course: Module;
  /** Afficher la barre de progression (page Mon apprentissage) */
  readonly showProgress?: boolean;
  /** Variante compacte (dropdown, listes) */
  readonly compact?: boolean;
}

export function CourseCard({ course, showProgress = false, compact = false }: CourseCardProps) {
  const progress = course.progress ?? 0;
  const rating = course.rating ?? 4.8;
  const reviewCount = course.reviewCount ?? 1200;
  const instructor = course.instructor ?? 'FACAM ACADEMIA';

  if (compact) {
    return (
      <Link
        href={`/student/modules/${course.id}`}
        className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div className="relative w-24 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-200">
          <Image
            src={course.imageUrl}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            sizes="96px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-facam-dark line-clamp-2 group-hover:text-facam-blue transition-colors">
            {course.title}
          </p>
          {showProgress && (
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
              <div
                className="bg-facam-yellow h-1.5 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/student/modules/${course.id}`} className="group block">
      <div className="relative h-40 w-full overflow-hidden rounded-md border border-gray-200 mb-3 bg-gray-100">
        <Image
          src={course.imageUrl}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>
      <h3 className="font-bold text-facam-dark line-clamp-2 mb-1 group-hover:text-facam-blue transition-colors">
        {course.title}
      </h3>
      <p className="text-xs text-gray-500 mb-1">{instructor}</p>
      <div className="flex items-center gap-1 mb-1">
        <span className="font-bold text-facam-yellow text-sm">{rating.toFixed(1)}</span>
        <div className="flex text-facam-yellow" aria-hidden>
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={`star-${i}`} className="size-3 fill-current" />
          ))}
        </div>
        <span className="text-xs text-gray-400">({formatCount(reviewCount)})</span>
      </div>
      {showProgress && (
        <>
          <div className="w-full bg-gray-200 h-1.5 rounded-full mb-2">
            <div className="bg-facam-yellow h-1.5 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-500">{progress}% terminé</p>
        </>
      )}
      {!showProgress && (
        <div className="font-bold text-facam-dark text-sm">Inclus dans votre formation</div>
      )}
    </Link>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
