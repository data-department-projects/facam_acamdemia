'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api-client';

const PING_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Envoie un ping toutes les 2 minutes tant que la page est active.
 * Utilisé sur les pages de consultation de module/quiz pour mesurer le temps réel de présence.
 */
export function useActivityPing(moduleId?: string | null, enrollmentId?: string | null): void {
  const moduleIdRef = useRef(moduleId);
  const enrollmentIdRef = useRef(enrollmentId);

  useEffect(() => {
    moduleIdRef.current = moduleId;
    enrollmentIdRef.current = enrollmentId;
  }, [moduleId, enrollmentId]);

  useEffect(() => {
    const sendPing = (): void => {
      void api
        .post('/enrollments/ping', {
          ...(moduleIdRef.current ? { moduleId: moduleIdRef.current } : {}),
          ...(enrollmentIdRef.current ? { enrollmentId: enrollmentIdRef.current } : {}),
        })
        .catch(() => {
          // silently ignore — heartbeat is best-effort
        });
    };

    sendPing(); // ping immédiat à l'arrivée sur la page
    const interval = setInterval(sendPing, PING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []); // ne dépend pas des IDs : les refs gardent les valeurs à jour
}
