/**
 * CountdownBanner — Bandeau compte à rebours pour l'accès étudiant (30 jours).
 * Style inspiré du "minteur" : bandeau visible (cyan/bleu clair), texte "Fin dans X j X h X min X s".
 * À connaître : calcul du temps restant à partir de firstLoginAt + 30 jours, mise à jour en temps réel (setInterval).
 */

'use client';

import { useState, useEffect } from 'react';

const ACCESS_DAYS = 30;

function formatRemaining(endDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const diff = Math.max(0, endDate.getTime() - now.getTime());
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const h = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const s = Math.floor((diff % (60 * 1000)) / 1000);
  return { days, hours: h, minutes: m, seconds: s };
}

export interface CountdownBannerProps {
  /** Date de première connexion ; fin d'accès = firstLoginAt + 30 jours */
  firstLoginAt: string | null;
  /** Texte d'appel à l'action (optionnel) */
  callToAction?: string;
  /** Masquer le bandeau si l'accès est expiré */
  hideWhenExpired?: boolean;
}

export function CountdownBanner({
  firstLoginAt,
  callToAction = 'Accélérez le développement de vos compétences',
  hideWhenExpired = true,
}: CountdownBannerProps) {
  const [remaining, setRemaining] = useState<ReturnType<typeof formatRemaining> | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!firstLoginAt) {
      setRemaining(null);
      return;
    }
    const start = new Date(firstLoginAt);
    const end = new Date(start);
    end.setDate(end.getDate() + ACCESS_DAYS);

    const tick = () => {
      const r = formatRemaining(end);
      setRemaining(r);
      if (r.days === 0 && r.hours === 0 && r.minutes === 0 && r.seconds === 0) {
        setExpired(true);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [firstLoginAt]);

  if (!firstLoginAt || remaining === null) return null;
  if (hideWhenExpired && expired) return null;

  const isUrgent = remaining.days < 3;

  return (
    <div
      className={
        isUrgent
          ? 'bg-red-100 text-red-900 border-b border-red-200'
          : 'bg-[#cce5f0] text-[#001b61] border-b border-[#001b61]/20'
      }
      role="timer"
      aria-live="polite"
      aria-label={`Temps restant : ${remaining.days} jours ${remaining.hours} heures ${remaining.minutes} minutes ${remaining.seconds} secondes`}
    >
      <div className="container mx-auto px-4 md:px-6 py-3 flex flex-wrap items-center justify-center gap-2 md:gap-4 text-sm font-montserrat">
        <span className="font-bold">
          Fin dans {remaining.days} j {remaining.hours} h {remaining.minutes} min{' '}
          {remaining.seconds} s
        </span>
        <span className="hidden sm:inline text-gray-600">|</span>
        <span className="text-center">{callToAction}</span>
      </div>
    </div>
  );
}
