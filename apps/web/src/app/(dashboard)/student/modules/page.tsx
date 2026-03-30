/**
 * Catalogue des modules — Spec : sidebar avec liste des modules, contenu = cours du module sélectionné.
 * Données : GET /formations?catalogue=1 (tous les modules), GET /formations/:id (détail avec courses + chapitres).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { BookOpen, ChevronRight, Video } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';
import { getModuleDisplayImage } from '@/lib/utils';

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

interface ApiCourse {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  chapters?: ApiChapter[];
}

interface ApiChapter {
  id: string;
  title: string;
  description?: string | null;
  order: number;
}

interface ModuleDetail {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  courses?: ApiCourse[];
}

export default function StudentModulesCataloguePage() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('moduleId');

  const [modules, setModules] = useState<ApiModule[]>([]);
  const [moduleDetail, setModuleDetail] = useState<ModuleDetail | null>(null);
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadCatalogue = useCallback(async () => {
    try {
      const res = await api.get<{ data?: ApiModule[] }>('/formations?limit=50&catalogue=1');
      const raw = res?.data ?? (Array.isArray(res) ? res : []);
      setModules(Array.isArray(raw) ? raw : []);
    } catch {
      setModules([]);
    } finally {
      setLoadingCatalogue(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogue();
  }, [loadCatalogue]);

  useEffect(() => {
    if (!selectedId) {
      setModuleDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    api
      .get<ModuleDetail>(`/formations/${selectedId}`)
      .then((data) => {
        if (!cancelled) setModuleDetail(data);
      })
      .catch(() => {
        if (!cancelled) setModuleDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selectedModule = modules.find((m) => m.id === selectedId);
  const imgSrc = (mod: ApiModule) => getModuleDisplayImage(mod);

  return (
    <div className="flex gap-6">
      {/* Sidebar : liste des modules (spec) */}
      <aside className="w-56 shrink-0 border-r border-gray-200 pr-4">
        <h2 className="text-sm font-semibold text-facam-dark mb-3">Modules</h2>
        {loadingCatalogue ? (
          <p className="text-xs text-gray-500">Chargement…</p>
        ) : (
          <ul className="space-y-1">
            {modules.map((mod) => (
              <li key={mod.id}>
                <Link
                  href={`/student/modules?moduleId=${encodeURIComponent(mod.id)}`}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    selectedId === mod.id
                      ? 'bg-facam-blue text-white'
                      : 'text-facam-dark hover:bg-gray-100'
                  }`}
                >
                  {mod.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {!loadingCatalogue && modules.length === 0 && (
          <p className="text-xs text-gray-500">Aucun module.</p>
        )}
      </aside>

      {/* Contenu : cours du module sélectionné ou grille des modules */}
      <main className="flex-1 min-w-0">
        {!selectedId ? (
          <>
            <h1 className="text-2xl font-bold text-slate-900">Catalogue des modules</h1>
            <p className="mt-1 text-slate-600 mb-6">
              Sélectionnez un module dans la liste pour voir ses cours, ou parcourez les cartes
              ci-dessous.
            </p>
            {loadingCatalogue ? (
              <p className="text-gray-500">Chargement…</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {modules.map((mod) => (
                  <Card key={mod.id} className="overflow-hidden flex flex-col">
                    <div className="relative h-48 w-full bg-slate-200">
                      <Image
                        src={imgSrc(mod)}
                        alt={mod.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {mod.progress !== undefined && mod.progress > 0 && (
                        <div className="absolute bottom-2 left-2 right-2 h-1.5 rounded-full bg-slate-300">
                          <div
                            className="h-full rounded-full bg-facam-blue"
                            style={{ width: `${mod.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <CardContent className="flex-1 pt-4">
                      <h2 className="font-semibold text-slate-900 line-clamp-2">{mod.title}</h2>
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                        {mod.description ?? ''}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="size-3.5" />
                          {mod.chaptersCount ?? 0} chapitres
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link
                        href={`/student/modules?moduleId=${encodeURIComponent(mod.id)}`}
                        className="w-full"
                      >
                        <Button variant="outline" className="w-full">
                          Voir les cours
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
            {!loadingCatalogue && modules.length === 0 && (
              <p className="text-gray-500">Aucun module disponible.</p>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/student/modules" className="text-facam-blue hover:underline">
                Catalogue
              </Link>
              <ChevronRight className="size-4" />
              <span className="text-facam-dark font-medium">
                {selectedModule?.title ?? moduleDetail?.title ?? selectedId}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              {moduleDetail?.title ?? selectedModule?.title ?? 'Module'}
            </h1>
            {moduleDetail?.description && (
              <p className="text-slate-600 mb-6">{moduleDetail.description}</p>
            )}

            {loadingDetail ? (
              <p className="text-gray-500">Chargement des cours…</p>
            ) : moduleDetail?.courses && moduleDetail.courses.length > 0 ? (
              <div className="space-y-6">
                {(moduleDetail.courses as ApiCourse[])
                  .sort((a, b) => a.order - b.order)
                  .map((course) => {
                    const chapters = (course.chapters ?? []).sort((a, b) => a.order - b.order);
                    return (
                      <Card key={course.id} className="border-gray-200 shadow-sm">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="size-4 text-facam-blue" />
                            <h2 className="font-semibold text-facam-dark">{course.title}</h2>
                          </div>
                          {course.description && (
                            <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                          )}
                          <ul className="space-y-2">
                            {chapters.map((ch) => (
                              <li
                                key={ch.id}
                                className="flex items-center gap-2 text-sm text-gray-700"
                              >
                                <Video className="size-3.5 text-gray-400 shrink-0" />
                                <span>{ch.title}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            ) : (
              <p className="text-gray-500">Aucun cours dans ce module pour l&apos;instant.</p>
            )}

            <div className="mt-6">
              <Link
                href={
                  selectedModule?.progress && selectedModule.progress > 0
                    ? `/student/modules/${selectedId}/chapitre/1`
                    : `/student/modules/${selectedId}`
                }
              >
                <Button variant="accent">
                  {selectedModule?.progress === 100
                    ? 'Voir le module'
                    : selectedModule?.progress && selectedModule.progress > 0
                      ? 'Reprendre le module'
                      : 'Accéder au module'}
                </Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
