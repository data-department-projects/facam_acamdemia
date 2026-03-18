/**
 * Page d'accueil Étudiant — Données depuis l’API (GET /formations : modules inscrits avec progression).
 * Style Udemy : recommandations et « Continuer votre apprentissage ».
 */

'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { CourseCard } from '@/components/student/CourseCard';
import { StudentTrainingCarousel } from '@/components/student/StudentTrainingCarousel';
import { FacamStairwayVideosSection } from '@/components/student/FacamStairwayVideosSection';
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
  const [myModules, setMyModules] = useState<ApiModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMy, setLoadingMy] = useState(true);

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

  useEffect(() => {
    let cancelled = false;
    // Sans catalogue=1 : uniquement les modules où l'étudiant est inscrit (avec progression)
    api
      .get<{ data: ApiModule[] }>('/formations?limit=50')
      .then((res) => {
        if (!cancelled) {
          setMyModules(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {
        if (!cancelled) setMyModules([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMy(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // "En cours" = inscrit et non terminé. On affiche aussi les modules à 0% (démarrés mais pas encore complétés).
  const inProgress = myModules.filter(
    (m) => (m.completedAt ?? null) === null && (m.progress ?? 0) < 100
  );

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
        <StudentTrainingCarousel className="mb-10" />
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

      <div className="container mx-auto px-4 md:px-6">
        <FacamStairwayVideosSection className="border-t border-gray-100" />
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8 border-t border-gray-100">
        <h2 className="text-xl font-bold text-facam-dark mb-6 font-montserrat">
          Continuer votre apprentissage
        </h2>
        {(() => {
          if (loadingMy) return <p className="text-gray-500">Chargement…</p>;
          if (inProgress.length === 0)
            return (
              <p className="text-gray-500">
                Aucun cours en cours. Découvrez les modules ci-dessus.
              </p>
            );
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {inProgress.map((mod) => (
                <CourseCard key={mod.id} course={toCourse(mod)} showProgress />
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
