/**
 * Client de la page chapitre — Données depuis GET /formations/:moduleId (module + chapitres avec items).
 * Affiche vidéo, ressources, quiz et sidebar.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ModuleCourseSidebar } from '@/components/student/ModuleCourseSidebar';
import { ChapterVideoAndQuiz } from '@/components/student/ChapterVideoAndQuiz';
import { ModuleCommentsSection } from '@/components/student/ModuleCommentsSection';
import { ModuleDiscussionsSection } from '@/components/student/ModuleDiscussionsSection';
import { api } from '@/lib/api-client';

interface ChapterItem {
  id: string;
  type: string;
  title?: string;
  videoUrl?: string;
  documentLabel?: string;
  documentUrl?: string;
  quizId?: string;
}

interface ApiChapter {
  id: string;
  title: string;
  order: number;
  items?: ChapterItem[];
  quizzes?: { id: string }[];
}

interface ApiModule {
  id: string;
  title: string;
  progress?: number;
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-6">
        <p className="text-gray-500">Chargement du chapitre…</p>
      </div>
    );
  }

  const chapters = (module_?.chapters ?? []).sort((a, b) => a.order - b.order);
  const chapter = chapters.find((c) => c.order === chapterOrder);

  if (!chapter || !module_) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Chapitre ou module introuvable.
        <Link href={`/student/modules/${moduleId}`} className="ml-2 underline">
          Retour au module
        </Link>
      </div>
    );
  }

  const videoItem = chapter.items?.find((i) => i.type === 'video');
  const embedUrl = getYoutubeEmbedUrl(videoItem?.videoUrl);
  const documentUrls = (chapter.items ?? [])
    .filter((i) => i.type === 'document' && i.documentUrl)
    .map((i) => ({ label: i.documentLabel ?? 'Document', url: i.documentUrl! }));
  const quizId =
    (chapter.quizzes?.[0] as { id: string } | undefined)?.id ??
    (chapter.items?.find((i) => i.type === 'quiz') as ChapterItem | undefined)?.quizId ??
    null;

  const completedChapterOrders = new Set(
    (module_.progress === 100 ? chapters.map((c) => c.order) : []).concat(
      chapters.filter((c) => c.order < chapterOrder).map((c) => c.order)
    )
  );
  const sidebarChapters = chapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    order: ch.order,
    durationMinutes: 15,
    items: [
      ...(ch.items?.some((i) => i.documentUrl)
        ? [{ id: `${ch.id}-doc`, title: 'Ressources', order: 0, type: 'document' as const }]
        : []),
      ...((ch.quizzes?.length ?? 0) > 0
        ? [
            {
              id: (ch.quizzes as { id: string }[])[0]?.id ?? ch.id,
              title: 'Quiz',
              order: 1,
              type: 'quiz' as const,
              isQuiz: true,
            },
          ]
        : []),
    ],
  }));

  const progressPercent =
    chapters.length > 0 ? Math.round((chapterOrder / chapters.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
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
              quizId={quizId}
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
                    <a
                      key={i}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors"
                    >
                      <FileText className="size-5 text-slate-500" />
                      <span className="font-medium text-slate-900">{doc.label}</span>
                    </a>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link
                href={
                  chapterOrder > 1
                    ? `/student/modules/${moduleId}/chapitre/${chapterOrder - 1}`
                    : `/student/modules/${moduleId}`
                }
                className="text-sm font-medium text-facam-blue hover:underline"
              >
                ← Précédent
              </Link>
              <Link
                href={
                  chapterOrder < chapters.length
                    ? `/student/modules/${moduleId}/chapitre/${chapterOrder + 1}`
                    : `/student/modules/${moduleId}/test-final`
                }
              >
                <Button variant="accent" size="lg">
                  {chapterOrder < chapters.length ? 'Chapitre suivant →' : 'Passer au quiz final →'}
                </Button>
              </Link>
            </div>

            <ModuleCommentsSection moduleId={moduleId} />
            <ModuleDiscussionsSection moduleId={moduleId} />
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24">
              <ModuleCourseSidebar
                moduleId={moduleId}
                moduleTitle={module_.title}
                chapters={sidebarChapters}
                currentChapterOrder={chapterOrder}
                completedChapterOrders={completedChapterOrders}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
