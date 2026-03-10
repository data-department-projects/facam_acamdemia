/**
 * Page d'accueil Étudiant — Données depuis l’API (GET /formations : modules inscrits avec progression).
 * Style Udemy : recommandations et « Continuer votre apprentissage ».
 */

'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { CourseCard } from '@/components/student/CourseCard';
import { getModuleDisplayImage } from '@/lib/utils';
import type { Module } from '@/types';

interface ApiModule {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  firstVideoUrl?: string | null;
  chaptersCount?: number;
  progress?: number;
  completedAt?: string | null;
}

export default function StudentDashboardPage() {
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // catalogue=1 : afficher tous les modules (pas seulement ceux où l'étudiant est inscrit)
    api
      .get<{ data: ApiModule[] }>('/formations?limit=50&catalogue=1')
      .then((res) => {
        if (!cancelled) {
          const raw = res?.data ?? (Array.isArray(res) ? res : []);
          setModules(Array.isArray(raw) ? raw : []);
        }
      })
      .catch(() => {
        if (!cancelled) setModules([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const inProgress = modules.filter((m) => (m.progress ?? 0) > 0 && (m.progress ?? 0) < 100);

  const toCourse = (m: ApiModule): Module => ({
    id: m.id,
    title: m.title,
    description: m.description ?? '',
    imageUrl: getModuleDisplayImage(m),
    durationHours: 0,
    chaptersCount: m.chaptersCount ?? 0,
    progress: m.progress,
    completedAt: m.completedAt ?? undefined,
  });

  return (
    <div className="pb-12 bg-white">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <h2 className="text-xl font-bold text-facam-dark mb-6 font-montserrat">
          Recommandé pour vous
        </h2>
        {loading ? (
          <p className="text-gray-500">Chargement des modules…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((mod) => (
              <CourseCard key={mod.id} course={toCourse(mod)} />
            ))}
          </div>
        )}
        {!loading && modules.length === 0 && (
          <p className="text-gray-500">
            Aucun module. Contactez l’administrateur pour être inscrit.
          </p>
        )}
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8 border-t border-gray-100">
        <h2 className="text-xl font-bold text-facam-dark mb-6 font-montserrat">
          Continuer votre apprentissage
        </h2>
        {loading ? (
          <p className="text-gray-500">Chargement…</p>
        ) : inProgress.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {inProgress.map((mod) => (
              <CourseCard key={mod.id} course={toCourse(mod)} showProgress />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Aucun cours en cours. Découvrez les modules ci-dessus.</p>
        )}
      </div>
    </div>
  );
}
