/**
 * Client de la page détail module — Données depuis GET /formations/:id (module + chapitres).
 * Affiche infos Udemy, chapitres et CTA Commencer / Reprendre.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { api } from '@/lib/api-client';

interface ApiChapter {
  id: string;
  title: string;
  order: number;
}

interface ApiModule {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  durationHours?: number;
  chaptersCount?: number;
  quizCount?: number;
  level?: string;
  authorName?: string;
  authorBio?: string;
  authorAvatarUrl?: string;
  progress?: number;
  lastViewedChapterId?: string | null;
  completedAt?: string | null;
  chapters?: ApiChapter[];
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function StudentModuleDetailClient({ moduleId }: { moduleId: string }) {
  const [module_, setModule_] = useState<ApiModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<ApiModule>(`/formations/${moduleId}`)
      .then((data) => {
        if (!cancelled) setModule_(data);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Module introuvable');
          setModule_(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Chargement du module…</p>
      </div>
    );
  }
  if (error || !module_) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error ?? 'Module introuvable.'}
          <Link href="/student" className="ml-2 underline">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  const chapters = (module_.chapters ?? []).sort((a, b) => a.order - b.order);
  const progressPercent = module_.progress ?? 0;
  const rating = 4.8;
  const reviewCount = 0;
  const instructor = module_.authorName ?? 'FACAM ACADEMIA';
  const levelLabel =
    module_.level === 'debutant'
      ? 'Débutant'
      : module_.level === 'intermediaire'
        ? 'Intermédiaire'
        : module_.level === 'avance'
          ? 'Avancé'
          : null;
  const imgSrc = module_.imageUrl || '/placeholder-course.jpg';

  return (
    <div className="bg-white min-h-screen">
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 py-3">
          <Breadcrumb items={[{ label: 'Accueil', href: '/student' }, { label: module_.title }]} />
        </div>
      </div>

      <div className="bg-facam-dark text-white">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold font-montserrat leading-tight">
                {module_.title}
              </h1>
              {module_.subtitle && (
                <p className="mt-2 text-gray-300 text-sm md:text-base line-clamp-2">
                  {module_.subtitle}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                <span className="font-bold text-facam-yellow">{rating.toFixed(1)}</span>
                <div className="flex text-facam-yellow" aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={`star-${i}`} className="size-4 fill-current" />
                  ))}
                </div>
                {reviewCount > 0 && (
                  <span className="text-gray-400">({formatCount(reviewCount)} participants)</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-400">
                <span>Par {instructor}</span>
                <span>·</span>
                <span>Français</span>
              </div>
            </div>
            <div className="relative w-full md:w-80 h-44 md:h-52 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
              <Image
                src={imgSrc}
                alt={module_.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 320px"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-facam-dark mb-4 font-montserrat">
                Chapitres et ressources
              </h2>
              {chapters.length === 0 ? (
                <p className="text-gray-500">Aucun chapitre disponible.</p>
              ) : (
                <ul className="space-y-2">
                  {chapters.map((ch, i) => (
                    <li
                      key={ch.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="font-medium text-facam-dark">
                        {i + 1}. {ch.title}
                      </span>
                      <Link
                        href={`/student/modules/${moduleId}/chapitre/${ch.order}`}
                        className="text-sm font-medium text-facam-blue hover:underline"
                      >
                        Voir
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="relative w-full aspect-video rounded-t-lg overflow-hidden bg-gray-100">
                <Image
                  src={imgSrc}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 320px"
                />
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-facam-blue text-white flex items-center justify-center font-bold flex-shrink-0">
                    {(instructor ?? 'F').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-facam-dark text-sm">Formateur</p>
                    <p className="text-gray-900 font-medium">{instructor}</p>
                    {module_.authorBio && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {module_.authorBio}
                      </p>
                    )}
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-gray-700 border-t border-gray-100 pt-4">
                  <li className="flex justify-between">
                    <span className="text-gray-500">Durée totale</span>
                    <span className="font-medium">{module_.durationHours ?? 0} h</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-500">Chapitres</span>
                    <span className="font-medium">{module_.chaptersCount ?? chapters.length}</span>
                  </li>
                  {(module_.quizCount ?? 0) > 0 && (
                    <li className="flex justify-between">
                      <span className="text-gray-500">Quiz</span>
                      <span className="font-medium">{module_.quizCount}</span>
                    </li>
                  )}
                  {levelLabel && (
                    <li className="flex justify-between">
                      <span className="text-gray-500">Niveau</span>
                      <span className="font-medium">{levelLabel}</span>
                    </li>
                  )}
                  <li className="text-facam-blue font-medium">Certificat à la clé</li>
                </ul>

                {progressPercent > 0 && (
                  <div className="pt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Votre progression</span>
                      <span>{progressPercent} %</span>
                    </div>
                    <ProgressBar value={progressPercent} height="sm" showLabel={false} />
                  </div>
                )}

                <div className="pt-4 space-y-2">
                  <Link href={`/student/modules/${moduleId}/chapitre/1`} className="block">
                    <Button variant="accent" size="lg" className="w-full font-bold text-base py-3">
                      {progressPercent > 0
                        ? "Reprendre là où j'en étais"
                        : 'Commencer la formation'}
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Accès inclus dans votre formation. Aucun paiement requis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
