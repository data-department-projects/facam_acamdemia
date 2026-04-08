/**
 * Client de la page détail module — Données depuis GET /formations/:id (module + chapitres).
 * Affiche infos Udemy, chapitres et CTA Commencer / Reprendre.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Star,
  ChevronDown,
  ChevronUp,
  Play,
  FileText,
  Lightbulb,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RichTextContent } from '@/components/ui/RichTextContent';
import { api } from '@/lib/api-client';

/** Élément d'un chapitre : vidéo, document ou quiz */
interface ApiChapterItem {
  id: string;
  title: string;
  order: number;
  type: string;
  durationMinutes?: number | null;
  videoUrl?: string | null;
  documentLabel?: string | null;
  documentUrl?: string | null;
  quizId?: string | null;
}

interface ApiChapter {
  id: string;
  title: string;
  order: number;
  items?: ApiChapterItem[];
  quizzes?: { id: string; title: string }[];
}

interface ApiModule {
  id: string;
  title: string;
  subtitle?: string;
  description?: string | null;
  prerequisites?: string | null;
  learningObjectives?: string | null;
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

/** Formate des minutes en "M:SS" ou "H:MM:SS" pour l'affichage. */
function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || minutes < 0) return '0:00';
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const s = Math.round((minutes % 1) * 60) || 0;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Durée totale d'un chapitre (somme des durationMinutes des items). */
function chapterDurationMinutes(ch: ApiChapter): number {
  const items = ch.items ?? [];
  return items.reduce((acc, it) => acc + (it.durationMinutes ?? 0), 0);
}

export function StudentModuleDetailClient({ moduleId }: { moduleId: string }) {
  const [module_, setModule_] = useState<ApiModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Ids des chapitres ouverts (repliables). */
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);
  const [starting, setStarting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusChapterOrderRaw = searchParams.get('chapterOrder');
  const focusChapterOrder = focusChapterOrderRaw ? Number(focusChapterOrderRaw) : null;

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

  const chapters = useMemo(() => {
    if (!module_) return [];
    return (module_.chapters ?? [])
      .slice()
      .sort((a: ApiChapter, b: ApiChapter) => a.order - b.order)
      .map((ch: ApiChapter) => ({
        ...ch,
        items: (ch.items ?? []).slice().sort((a, b) => a.order - b.order),
      }));
  }, [module_]);

  // Si on arrive ici depuis un quiz "Revoir les ressources", on ouvre automatiquement le chapitre demandé
  // et on scroll sur sa section dans la liste.
  useEffect(() => {
    if (!focusChapterOrder || !Number.isInteger(focusChapterOrder) || focusChapterOrder <= 0)
      return;
    if (chapters.length === 0) return;
    const ch = chapters.find((c) => c.order === focusChapterOrder);
    if (!ch) return;

    setExpandAll(false);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(ch.id);
      return next;
    });

    // Laisser le DOM se peindre avant de scroller.
    const t = globalThis.setTimeout(() => {
      const el = document.getElementById(`chapter-${focusChapterOrder}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    return () => globalThis.clearTimeout(t);
  }, [chapters, focusChapterOrder]);

  const totalSessions = useMemo(
    () => chapters.reduce((acc, ch) => acc + (ch.items?.length ?? 0), 0),
    [chapters]
  );

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

  const totalDurationHours = module_.durationHours ?? 0;
  const hasTotalDuration = totalDurationHours > 0;
  const totalDurationLabel =
    totalDurationHours >= 1
      ? `${Math.floor(totalDurationHours)} h ${Math.round((totalDurationHours % 1) * 60)} min`
      : `${Math.round(totalDurationHours * 60)} min`;

  const isChapterExpanded = (ch: ApiChapter) => expandAll || expandedIds.has(ch.id);
  const toggleChapter = (ch: ApiChapter) => {
    setExpandAll(false);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(ch.id)) next.delete(ch.id);
      else next.add(ch.id);
      return next;
    });
  };
  const expandAllSections = () => setExpandAll(true);

  const progressPercent = module_.progress ?? 0;
  /** L'utilisateur est inscrit au module si l'API renvoie une progression (même 0). */
  const isEnrolled = module_.progress !== undefined && module_.progress !== null;
  const rating = 4.8;
  const reviewCount: number = 0;
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
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-montserrat leading-tight text-white">
                {module_.title}
              </h1>
              {(module_.description || module_.subtitle) && (
                <p className="mt-3 text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl">
                  {module_.description ?? module_.subtitle}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm">
                <span className="font-bold text-facam-yellow">
                  {rating.toFixed(1).replace('.', ',')}
                </span>
                <div className="flex text-facam-yellow" aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={`star-${i}`} className="size-4 fill-current" />
                  ))}
                </div>
                <span className="text-gray-400 underline decoration-gray-400 underline-offset-2 cursor-default">
                  ({formatCount(reviewCount)} note{reviewCount === 1 ? '' : 's'})
                </span>
                <span className="text-gray-400">Français</span>
              </div>
              <p className="mt-3 text-sm text-gray-400">
                Créé par{' '}
                <span className="text-white underline decoration-white/70 underline-offset-2 hover:decoration-white">
                  {instructor}
                </span>
              </p>
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
            {module_.prerequisites && (
              <section className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-facam-dark mb-4 font-montserrat">
                  Prérequis
                </h2>
                <RichTextContent content={module_.prerequisites} className="text-gray-700" />
              </section>
            )}
            {module_.learningObjectives && (
              <section className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-facam-dark mb-4 font-montserrat">
                  Objectifs du module
                </h2>
                <RichTextContent content={module_.learningObjectives} className="text-gray-700" />
              </section>
            )}
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <h2 className="text-xl font-bold text-facam-dark px-6 pt-6 pb-4 font-montserrat">
                Chapitres et ressources
              </h2>
              {chapters.length === 0 ? (
                <p className="text-gray-500 px-6 pb-6">Aucun chapitre disponible.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 px-6 pb-3 text-sm text-gray-600">
                    <span>
                      {chapters.length} section{chapters.length === 1 ? '' : 's'} • {totalSessions}{' '}
                      session{totalSessions === 1 ? '' : 's'}
                      {hasTotalDuration ? ` • ${totalDurationLabel} de durée totale` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={expandAllSections}
                      className="font-medium text-facam-blue hover:underline"
                    >
                      Développer toutes les sections
                    </button>
                  </div>
                  <div className="border-t border-gray-200">
                    {chapters.map((ch, i) => {
                      const expanded = isChapterExpanded(ch);
                      const sessionsCount = ch.items?.length ?? 0;
                      const chDurationMin = chapterDurationMinutes(ch);
                      const hasChapterDuration = chDurationMin > 0;
                      const chDurationLabel =
                        chDurationMin >= 60
                          ? `${Math.floor(chDurationMin / 60)} h ${chDurationMin % 60} min`
                          : `${chDurationMin} min`;
                      return (
                        <div
                          key={ch.id}
                          id={`chapter-${ch.order}`}
                          className="border-b border-gray-100 last:border-b-0 scroll-mt-24"
                        >
                          <button
                            type="button"
                            onClick={() => toggleChapter(ch)}
                            className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              {expanded ? (
                                <ChevronUp className="size-5 flex-shrink-0 text-gray-500" />
                              ) : (
                                <ChevronDown className="size-5 flex-shrink-0 text-gray-500" />
                              )}
                              <span className="font-semibold text-facam-dark truncate">
                                {i + 1}. {ch.title}
                              </span>
                            </span>
                            <span className="flex-shrink-0 text-sm text-gray-500">
                              {sessionsCount} session{sessionsCount === 1 ? '' : 's'}
                              {hasChapterDuration ? ` • ${chDurationLabel}` : ''}
                            </span>
                          </button>
                          {expanded && (
                            <div className="bg-gray-50/50 px-6 pb-4">
                              <ul className="space-y-1 pt-1">
                                {(ch.items ?? []).map((item) => {
                                  const isVideo = item.type === 'video';
                                  const isDocument = item.type === 'document';
                                  const isQuiz = item.type === 'quiz';
                                  const isOther =
                                    item.type !== 'video' &&
                                    item.type !== 'document' &&
                                    item.type !== 'quiz';
                                  const durationStr = formatDuration(item.durationMinutes);
                                  return (
                                    <li
                                      key={item.id}
                                      className="flex items-center gap-3 py-2 pl-7 text-sm"
                                    >
                                      <span className="flex-shrink-0 text-gray-500">
                                        {isVideo && <Play className="size-4" />}
                                        {isDocument && <FileText className="size-4" />}
                                        {isQuiz && <ClipboardList className="size-4" />}
                                        {isOther && <Lightbulb className="size-4" />}
                                      </span>
                                      <span className="min-w-0 flex-1 font-medium text-facam-dark truncate">
                                        {item.title}
                                      </span>
                                      {(item.durationMinutes ?? 0) > 0 && (
                                        <span className="flex-shrink-0 text-gray-500 tabular-nums">
                                          {durationStr}
                                        </span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                              <div className="mt-3 pl-7">
                                <Link
                                  href={`/student/modules/${moduleId}/chapitre/${ch.order}`}
                                  className="text-sm font-medium text-facam-blue hover:underline"
                                >
                                  Voir le chapitre →
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
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
                  {isEnrolled ? (
                    <Link href={`/student/modules/${moduleId}/chapitre/1`} className="block">
                      <Button
                        variant="accent"
                        size="lg"
                        className="w-full font-bold text-base py-3"
                      >
                        {progressPercent > 0
                          ? "Reprendre là où j'en étais"
                          : 'Reprendre la formation'}
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="accent"
                      size="lg"
                      className="w-full font-bold text-base py-3"
                      disabled={starting}
                      onClick={async () => {
                        setStarting(true);
                        try {
                          await api.post<{ moduleId: string }>('/enrollments/start', {
                            moduleId,
                          });
                          router.push(`/student/modules/${moduleId}/chapitre/1`);
                        } catch {
                          setStarting(false);
                        }
                      }}
                    >
                      {starting ? 'Inscription…' : 'Commencer la formation'}
                    </Button>
                  )}
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
