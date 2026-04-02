/**
 * useStudentIdleLogout — Déconnexion automatique après inactivité (étudiant / employé).
 *
 * Rôle :
 * - Réinitialiser un minuteur à chaque activité utilisateur détectée (souris, clavier, scroll, etc.).
 * - Au bout de 15 minutes sans activité : effacer la session locale et rediriger vers `/login?reason=idle`.
 *
 * Points utiles :
 * - Le throttle limite le coût des événements très fréquents (ex. `mousemove`).
 * - `visibilitychange` : au retour sur l’onglet, le minuteur est réarmé (l’utilisateur est « actif » à nouveau).
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOutFullClient } from '@/lib/auth';

/** Durée d’inactivité avant déconnexion (15 min). */
export const STUDENT_IDLE_TIMEOUT_MS = 15 * 60 * 1000;

/** Intervalle minimum entre deux réinitialisations du minuteur (évite le surcoût des events bruyants). */
const ACTIVITY_THROTTLE_MS = 1000;

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'wheel',
] as const;

export function useStudentIdleLogout(): void {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastThrottleRef = useRef(0);

  const armLogoutTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      void (async () => {
        await signOutFullClient();
        router.replace('/login?reason=idle');
      })();
    }, STUDENT_IDLE_TIMEOUT_MS);
  }, [router]);

  const onActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastThrottleRef.current < ACTIVITY_THROTTLE_MS) return;
    lastThrottleRef.current = now;
    armLogoutTimer();
  }, [armLogoutTimer]);

  useEffect(() => {
    armLogoutTimer();

    for (const ev of ACTIVITY_EVENTS) {
      globalThis.addEventListener(ev, onActivity, { passive: true });
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') onActivity();
    };
    document.addEventListener('visibilitychange', onVisibility);

    /** Si un autre onglet vide le stockage (déconnexion / inactivité), on aligne cette vue. */
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'facam_token' && e.key !== 'facam_user') return;
      if (e.newValue == null && e.key === 'facam_token') {
        router.replace('/login?reason=idle');
      }
    };
    globalThis.addEventListener('storage', onStorage);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      for (const ev of ACTIVITY_EVENTS) {
        globalThis.removeEventListener(ev, onActivity);
      }
      document.removeEventListener('visibilitychange', onVisibility);
      globalThis.removeEventListener('storage', onStorage);
    };
  }, [armLogoutTimer, onActivity, router]);
}
