/**
 * Avatar utilisateur : image distante (URL Supabase publique) ou initiales sur fond brand.
 * Utilisé dans les en-têtes et la page compte pour un rendu cohérent et accessible.
 */

'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { initialsFromFullName } from '@/lib/avatar-validation';

const boxSize = {
  sm: 'size-8 md:size-9',
  md: 'size-14',
  lg: 'size-24',
} as const;

const textSize = {
  sm: 'text-xs md:text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
} as const;

/** Largeur max affichée (CSS) par taille — pour `sizes` Next/Image (≈2× pour écrans Retina). */
const sizesHint = {
  sm: '(max-width: 768px) 72px, 80px',
  md: '112px',
  lg: '192px',
} as const;

export interface UserAvatarProps {
  fullName: string;
  avatarUrl?: string | null;
  size?: keyof typeof boxSize;
  className?: string;
  /** Priorité Next/Image (ex. header sticky). */
  priority?: boolean;
}

export function UserAvatar({
  fullName,
  avatarUrl,
  size = 'sm',
  className,
  priority = false,
}: UserAvatarProps) {
  const initials = initialsFromFullName(fullName);

  if (avatarUrl) {
    return (
      <span
        className={cn(
          // `block` + `leading-none` + `aspect-square` : évite le vide sous l’image (effet « croissant »
          // dû à la ligne de base des éléments inline) et garantit un cercle plein.
          'relative block shrink-0 overflow-hidden rounded-full bg-gray-200 leading-none aspect-square ring-2 ring-white/80',
          boxSize[size],
          className
        )}
      >
        <Image
          src={avatarUrl}
          alt=""
          fill
          className="object-cover object-center"
          priority={priority}
          sizes={sizesHint[size]}
          quality={90}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-facam-dark font-bold leading-none text-white ring-2 ring-white/80 aspect-square',
        boxSize[size],
        textSize[size],
        className
      )}
      aria-hidden={!fullName}
    >
      {initials}
    </span>
  );
}
