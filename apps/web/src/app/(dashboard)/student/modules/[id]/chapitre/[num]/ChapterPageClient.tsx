/**
 * Client de la page chapitre — Données depuis GET /formations/:moduleId (module + chapitres avec items).
 * Affiche vidéo, ressources, quiz et sidebar.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { ModuleCourseSidebar } from '@/components/student/ModuleCourseSidebar';
import { ChapterVideoAndQuiz } from '@/components/student/ChapterVideoAndQuiz';
import { ModuleCommentsSection } from '@/components/student/ModuleCommentsSection';
import { api } from '@/lib/api-client';
import { buildDownloadFilename, downloadFileFromUrl } from '@/lib/download-file';

interface ChapterItem {
  id: string;
  type: string;
  title?: string;
  videoUrl?: string;
  documentLabel?: string;
  documentUrl?: string;
  quizId?: string;
  createdAt?: string;
}

interface ApiChapter {
  id: string;
  title: string;
  order: number;
  createdAt?: string;
  items?: ChapterItem[];
  quizzes?: { id: string }[];
}

interface ApiModule {
  id: string;
  title: string;
  progress?: number;
  completedAt?: string | null;
  lastViewedChapterId?: string | null;
  lastViewedItemId?: string | null;
  chapters?: ApiChapter[];
}

function getYoutubeEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?rel=0`;
  return null;
}

export function ChapterPageClient({
  moduleId,
  chapterOrder,
}: {
  moduleId: string;
  chapterOrder: number;
}) {
  const [module_, setModule_] = useState<ApiModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [completedItemIds, setCompletedItemIds] = useState<Set<string>>(new Set());
  const [progressItemsLoaded, setProgressItemsLoaded] = useState(false);
  const [enrolledAt, setEnrolledAt] = useState<string | null>(null);
  const [hasCertificate, setHasCertificate] = useState<boolean | null>(null);
  const [warningOrder, setWarningOrder] = useState<number | null>(null);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [dismissedWarningOrder, setDismissedWarningOrder] = useState<number | null>(null);
  const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReviewMode = searchParams.get('review') === '1';

  useEffect(() => {
    let cancelled = false;
    api
      .get<ApiModule>(`/formations/${moduleId}`)
      .then((data) => {
        if (!cancelled) setModule_(data);
      })
      .catch(() => {
        if (!cancelled) setModule_(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  // Assure l'existence de l'inscription (idempotent) et récupère l'enrollmentId
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api
        .post<{ id: string; moduleId: string }>('/enrollments/start', { moduleId })
        .then((res) => res.id)
        .catch(() => null),
      api
        .get<{ id: string; moduleId: string }[]>('/enrollments')
        .then((list) => {
          const arr = Array.isArray(list) ? list : [];
          const en = arr.find((e) => e.moduleId === moduleId);
          return en?.id ?? null;
        })
        .catch(() => null),
    ]).then(([fromStart, fromList]) => {
      if (cancelled) return;
      setEnrollmentId(fromStart ?? fromList);
    });
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  // Charge les infos d'inscription (date d'inscription) et le statut certificat.
  useEffect(() => {
    if (!enrollmentId) return;

    let cancelled = false;

    const load = async () => {
      try {
        const [cert, enrollment] = await Promise.allSettled([
          api.get<unknown>(`/certificates/enrollment/${enrollmentId}`),
          api.get<{ enrolledAt?: string; lastViewedChapterId?: string }>(
            `/enrollments/${enrollmentId}`
          ),
        ]);

        if (cancelled) return;

        setHasCertificate(cert.status === 'fulfilled');
        const enrolled =
          enrollment.status === 'fulfilled' && typeof enrollment.value?.enrolledAt === 'string'
            ? enrollment.value.enrolledAt
            : null;
        setEnrolledAt(enrolled);
      } finally {
        // no-op
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [enrollmentId]);

  // Charge la liste des items complétés pour afficher la progression réelle dans la sidebar
  useEffect(() => {
    if (!enrollmentId) return;
    setProgressItemsLoaded(false);
    let cancelled = false;
    api
      .get<{ chapterItemIds: string[] }>(`/enrollments/${enrollmentId}/progress-items`)
      .then((res) => {
        if (cancelled) return;
        const ids = Array.isArray(res.chapterItemIds) ? res.chapterItemIds : [];
        setCompletedItemIds(new Set(ids));
      })
      .catch(() => {
        if (!cancelled) setCompletedItemIds(new Set());
      })
      .finally(() => {
        if (!cancelled) setProgressItemsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [enrollmentId]);

  const chapters = useMemo(
    () => (module_?.chapters ?? []).slice().sort((a, b) => a.order - b.order),
    [module_]
  );
  const chapter = chapters.find((c) => c.order === chapterOrder);
  const currentIndex = chapters.findIndex((c) => c.order === chapterOrder);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const videoItem = chapter?.items?.find((i) => i.type === 'video') ?? null;
  const embedUrl = getYoutubeEmbedUrl(videoItem?.videoUrl);
  const documentUrls = (chapter?.items ?? [])
    .filter((i) => i.type === 'document' && i.documentUrl)
    .map((i) => ({ itemId: i.id, label: i.documentLabel ?? i.title ?? 'Document' }));
  const downloadChapterDocument = async (itemId: string, label: string) => {
    setDownloadingItemId(itemId);
    try {
      const res = await api.get<{ url: string }>(
        `/chapitres/items/${itemId}/document-download-url`
      );
      if (!res?.url) return;
      const filename = buildDownloadFilename({ label, url: res.url, fallbackExt: 'pdf' });
      await downloadFileFromUrl(res.url, filename);
    } catch {
      // Best-effort: on évite d'ajouter une UI d'erreur visible (demande produit).
    } finally {
      setDownloadingItemId((prev) => (prev === itemId ? null : prev));
    }
  };

  const quizId =
    (chapter?.quizzes?.[0] as { id: string } | undefined)?.id ??
    (chapter?.items?.find((i) => i.type === 'quiz') as ChapterItem | undefined)?.quizId ??
    null;
  const quizItemId =
    chapter?.items?.find((i) => i.type === 'quiz' && (i.quizId ?? null) === quizId)?.id ?? null;

  const completedChapterOrders = useMemo(() => {
    // Pour autoriser la révision et garder un parcours clair :
    // - si un quiz existe dans le chapitre, sa validation suffit pour considérer le chapitre complété
    // - sinon, on se base sur les vidéos (documents toujours optionnels)
    const result = new Set<number>();
    for (const ch of chapters) {
      const quizItems = (ch.items ?? []).filter((it) => it.type === 'quiz');
      const required =
        quizItems.length > 0
          ? quizItems
          : (ch.items ?? []).filter((it) => it.type === 'video' || it.type === 'quiz');
      if (required.length === 0) continue;
      const ok = required.every((it) => completedItemIds.has(it.id));
      if (ok) result.add(ch.order);
    }
    return result;
  }, [chapters, completedItemIds]);

  // Détection “Udemy-like” : nouveaux chapitres/items ajoutés après inscription,
  // mais dont les éléments requis ne sont pas encore complétés.
  const computedWarningOrder = useMemo(() => {
    if (!progressItemsLoaded) return null;
    if (!enrolledAt) return null;
    if (hasCertificate === true) return null;
    const enrolledDateMs = new Date(enrolledAt).getTime();
    if (Number.isNaN(enrolledDateMs)) return null;

    for (const ch of chapters) {
      const quizItems = (ch.items ?? []).filter((it) => it.type === 'quiz');
      const required =
        quizItems.length > 0
          ? quizItems
          : (ch.items ?? []).filter((it) => it.type === 'video' || it.type === 'quiz');

      if (required.length === 0) continue;

      const incompleteRequired = required.filter((it) => !completedItemIds.has(it.id));
      if (incompleteRequired.length === 0) continue;

      const isNew =
        !!ch.createdAt && new Date(ch.createdAt).getTime() > enrolledDateMs
          ? true
          : incompleteRequired.some(
              (it) => !!it.createdAt && new Date(it.createdAt).getTime() > enrolledDateMs
            );

      if (isNew) return ch.order;
    }

    return null;
  }, [chapters, completedItemIds, enrolledAt, hasCertificate, progressItemsLoaded]);

  useEffect(() => {
    if (computedWarningOrder == null) {
      setWarningOrder(null);
      setWarningModalOpen(false);
      return;
    }
    setWarningOrder(computedWarningOrder);
    if (dismissedWarningOrder === computedWarningOrder) return;
    setWarningModalOpen(true);
  }, [computedWarningOrder, dismissedWarningOrder]);
  const sidebarChapters = useMemo(
    () =>
      chapters.map((ch, idx) => ({
        id: ch.id,
        title: ch.title,
        order: ch.order,
        durationMinutes: 15,
        items: [
          ...(ch.items?.some((i) => i.type === 'video')
            ? [
                {
                  id: (ch.items ?? []).find((i) => i.type === 'video')?.id ?? `${ch.id}-video`,
                  title: 'Lecture',
                  order: 0,
                  type: 'video' as const,
                },
              ]
            : []),
          ...(ch.items?.some((i) => i.documentUrl)
            ? [{ id: `${ch.id}-doc`, title: 'Ressources', order: 0, type: 'document' as const }]
            : []),
          ...((ch.quizzes?.length ?? 0) > 0
            ? [
                {
                  id:
                    (ch.items ?? []).find((i) => i.type === 'quiz')?.id ??
                    (ch.quizzes as { id: string }[])[0]?.id ??
                    ch.id,
                  title: 'Quiz du chapitre',
                  order: 1,
                  type: 'quiz' as const,
                  isQuiz: true,
                  href: (() => {
                    const quizId =
                      (ch.quizzes as { id: string }[] | undefined)?.[0]?.id ??
                      (ch.items ?? []).find((i) => i.type === 'quiz')?.quizId ??
                      null;
                    const quizItemId = (ch.items ?? []).find((i) => i.type === 'quiz')?.id ?? null;
                    if (!quizId || !quizItemId) return undefined;
                    const next =
                      idx < chapters.length - 1
                        ? `/student/modules/${moduleId}/chapitre/${chapters[idx + 1]?.order}`
                        : `/student/modules/${moduleId}/test-final`;
                    return `/student/modules/${moduleId}/quiz?quizId=${encodeURIComponent(quizId)}&next=${encodeURIComponent(next)}&chapterId=${encodeURIComponent(ch.id)}&chapterOrder=${ch.order}&quizItemId=${encodeURIComponent(quizItemId)}`;
                  })(),
                },
              ]
            : []),
        ],
      })),
    [chapters, moduleId]
  );

  const progressPercent = module_?.progress ?? 0;
  const isCertified =
    hasCertificate === true || module_?.completedAt != null || (module_?.progress ?? 0) >= 100;

  const nextHref = nextChapter
    ? `/student/modules/${moduleId}/chapitre/${nextChapter.order}`
    : `/student/modules/${moduleId}/test-final`;
  const chapterQuizCompleted = quizItemId ? completedItemIds.has(quizItemId) : true;
  const hasNextChapter = !!nextChapter;
  const canAccessNext = !hasNextChapter || chapterQuizCompleted;

  // Si l'utilisateur s'était arrêté sur le quiz (échec), on le renvoie directement au quiz
  useEffect(() => {
    if (isReviewMode) return;
    if (!module_ || !chapter) return;
    if (!module_.lastViewedItemId) return;
    if (!quizId || !quizItemId) return;
    // Si le quiz est déjà validé (item complété), on ne force pas un nouveau passage.
    if (completedItemIds.has(quizItemId)) return;
    if (module_.lastViewedItemId !== quizItemId) return;
    router.replace(
      `/student/modules/${moduleId}/quiz?quizId=${encodeURIComponent(quizId)}&next=${encodeURIComponent(nextHref)}&chapterId=${encodeURIComponent(chapter.id)}&chapterOrder=${chapterOrder}&quizItemId=${encodeURIComponent(quizItemId)}`
    );
  }, [
    isReviewMode,
    module_,
    chapter,
    quizId,
    quizItemId,
    moduleId,
    nextHref,
    router,
    completedItemIds,
    chapterOrder,
  ]);

  // Blocage navigation directe : impossible d'ouvrir un chapitre si le précédent n'est pas validé.
  useEffect(() => {
    if (!progressItemsLoaded) return;
    if (isCertified) return;
    if (!module_ || currentIndex <= 0) return;
    if (!prevChapter) return;
    if (!completedChapterOrders.has(prevChapter.order)) {
      router.replace(`/student/modules/${moduleId}/chapitre/${prevChapter.order}`);
    }
  }, [
    module_,
    progressItemsLoaded,
    isCertified,
    currentIndex,
    prevChapter,
    completedChapterOrders,
    moduleId,
    router,
  ]);

  // Si un chapitre a été supprimé pendant la progression, on évite le message “introuvable”.
  // On redirige silencieusement vers le premier chapitre accessible après l'ordre demandé.
  useEffect(() => {
    if (!module_ || !progressItemsLoaded) return;
    if (chapter) return;
    if (chapters.length === 0) return;

    const startIdx = Math.max(
      0,
      chapters.findIndex((c) => c.order >= chapterOrder)
    );
    let targetOrder: number | null = null;

    for (let idx = startIdx; idx < chapters.length; idx++) {
      const ch = chapters[idx];
      if (idx === 0) {
        targetOrder = ch.order;
        break;
      }
      const prev = chapters[idx - 1];
      if (completedChapterOrders.has(prev.order)) {
        targetOrder = ch.order;
        break;
      }
    }

    if (targetOrder == null) targetOrder = chapters[0]?.order ?? null;
    if (!targetOrder) return;
    router.replace(`/student/modules/${moduleId}/chapitre/${targetOrder}`);
  }, [
    module_,
    progressItemsLoaded,
    chapter,
    chapters,
    chapterOrder,
    completedChapterOrders,
    moduleId,
    router,
  ]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-6">
        <p className="text-gray-500">Chargement du chapitre…</p>
      </div>
    );
  }

  if (!module_) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Chapitre ou module introuvable.
        <Link href={`/student/modules/${moduleId}`} className="ml-2 underline">
          Retour au module
        </Link>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-6">
        <p className="text-gray-500">Redirection…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {warningModalOpen && warningOrder != null ? (
        <Modal
          open={warningModalOpen}
          onClose={() => {
            setWarningModalOpen(false);
            setDismissedWarningOrder(warningOrder);
          }}
          title="Nouveau chapitre ajouté"
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Un nouveau chapitre a été ajouté pendant votre progression. Avant d'obtenir votre
              certification, complétez le chapitre correspondant.
            </p>
            <p className="text-xs text-slate-500">Chapitre {warningOrder}.</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => {
                  setWarningModalOpen(false);
                  setDismissedWarningOrder(warningOrder);
                  router.replace(`/student/modules/${moduleId}/chapitre/${warningOrder}`);
                }}
              >
                Aller au chapitre
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setWarningModalOpen(false);
                  setDismissedWarningOrder(warningOrder);
                }}
              >
                Continuer
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
      <div className="container mx-auto px-4 md:px-6 py-6">
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Accueil', href: '/student' },
              { label: module_.title, href: `/student/modules/${moduleId}` },
              { label: `Chapitre ${chapterOrder} : ${chapter.title}` },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <ChapterVideoAndQuiz
              embedUrl={embedUrl}
              chapterTitle={chapter.title}
              description={undefined}
              moduleId={moduleId}
              chapterId={chapter.id}
              chapterOrder={chapterOrder}
              enrollmentId={enrollmentId}
              videoItemId={videoItem?.id ?? null}
              quizItemId={quizItemId}
              quizId={quizId}
              nextHref={nextHref}
              initialVideoCompleted={videoItem?.id ? completedItemIds.has(videoItem.id) : false}
              initialQuizCompleted={quizItemId ? completedItemIds.has(quizItemId) : false}
            />

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                  Chapitre {chapterOrder} sur {chapters.length}
                </span>
                <span>{progressPercent} % du module</span>
              </div>
              <ProgressBar value={progressPercent} height="sm" showLabel={false} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  Ressources téléchargeables
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {documentUrls.length === 0 ? (
                  <p className="text-slate-500 text-sm">Aucun document pour ce chapitre.</p>
                ) : (
                  documentUrls.map((doc, i) => (
                    <button
                      key={i}
                      type="button"
                      className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors"
                      onClick={() => void downloadChapterDocument(doc.itemId, doc.label)}
                      disabled={downloadingItemId === doc.itemId}
                    >
                      <FileText className="size-5 text-slate-500" />
                      <span className="min-w-0 flex-1 truncate font-medium text-slate-900">
                        {doc.label}
                      </span>
                      {downloadingItemId === doc.itemId ? (
                        <Loader2
                          className="size-5 animate-spin text-facam-yellow"
                          aria-label="Téléchargement…"
                        />
                      ) : (
                        <Download className="size-5 text-facam-yellow" aria-hidden />
                      )}
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link
                href={
                  prevChapter
                    ? `/student/modules/${moduleId}/chapitre/${prevChapter.order}`
                    : `/student/modules/${moduleId}`
                }
                className="text-sm font-medium text-facam-blue hover:underline"
              >
                ← Précédent
              </Link>
              {canAccessNext ? (
                <Link href={nextHref}>
                  <Button variant="accent" size="lg">
                    {hasNextChapter ? 'Chapitre suivant →' : 'Passer au quiz final →'}
                  </Button>
                </Link>
              ) : (
                <div className="text-right">
                  <Button variant="accent" size="lg" disabled>
                    Chapitre suivant verrouillé
                  </Button>
                  <p className="mt-1 text-xs text-amber-700">
                    Réussissez le quiz du chapitre pour continuer.
                  </p>
                </div>
              )}
            </div>

            {isCertified ? (
              <ModuleCommentsSection moduleId={moduleId} />
            ) : (
              <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Commentaires et avis</p>
                <p className="mt-1 text-sm text-slate-600">
                  Disponible après avoir terminé le module et obtenu votre certificat.
                </p>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24">
              <ModuleCourseSidebar
                moduleId={moduleId}
                moduleTitle={module_.title}
                chapters={sidebarChapters}
                currentChapterOrder={chapterOrder}
                completedChapterOrders={completedChapterOrders}
                completedItemIds={completedItemIds}
                progressReady={progressItemsLoaded}
                isCertified={isCertified}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
