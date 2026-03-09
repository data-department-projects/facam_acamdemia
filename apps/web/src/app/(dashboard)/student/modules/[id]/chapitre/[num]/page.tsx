/**
 * Page chapitre — Vidéo, description, quiz débloqué après la vidéo, sommaire latéral.
 * Breadcrumb : Accueil > Module > Chapitre X. Barre de progression et bouton "Chapitre suivant".
 */

import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MOCK_CHAPTERS, MOCK_MODULES } from '@/data/mock';
import { ModuleCourseSidebar } from '@/components/student/ModuleCourseSidebar';
import { ChapterVideoAndQuiz } from '@/components/student/ChapterVideoAndQuiz';
import { ModuleCommentsSection } from '@/components/student/ModuleCommentsSection';
import { ModuleDiscussionsSection } from '@/components/student/ModuleDiscussionsSection';

interface PageProps {
  params: Promise<{ id: string; num: string }>;
}

function getYoutubeEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?rel=0`;
  return null;
}

export default async function ChapterPage({ params }: PageProps) {
  const { id: moduleId, num } = await params;
  const order = parseInt(num, 10);
  const module_ = MOCK_MODULES.find((m) => m.id === moduleId);
  const chapters = MOCK_CHAPTERS.filter((c) => c.moduleId === moduleId).sort(
    (a, b) => a.order - b.order
  );
  const chapter = chapters.find((c) => c.order === order);

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

  const embedUrl = getYoutubeEmbedUrl(chapter.videoUrl);
  const completedChapterOrders = new Set(
    module_.progress === 100
      ? chapters.map((c) => c.order)
      : chapters.filter((c) => c.order < order).map((c) => c.order)
  );
  const sidebarChapters = chapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    order: ch.order,
    durationMinutes: 15,
    items: [
      ...(ch.documentUrls.length > 0
        ? [{ id: `${ch.id}-doc`, title: 'Ressources', order: 0, type: 'document' as const }]
        : []),
      ...(ch.quizId
        ? [{ id: ch.quizId, title: 'Quiz', order: 1, type: 'quiz' as const, isQuiz: true }]
        : []),
    ],
  }));

  const progressPercent = Math.round((order / chapters.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 py-6">
        {/* Fil d'Ariane */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Accueil', href: '/student' },
              { label: module_.title, href: `/student/modules/${moduleId}` },
              { label: `Chapitre ${order} : ${chapter.title}` },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-8 space-y-6">
            <ChapterVideoAndQuiz
              embedUrl={embedUrl}
              chapterTitle={chapter.title}
              description={(chapter as { description?: string }).description ?? undefined}
              moduleId={moduleId}
              chapterId={chapter.id}
              quizId={chapter.quizId ?? null}
            />

            {/* Progression du module (barre jaune) */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                  Chapitre {order} sur {chapters.length}
                </span>
                <span>{progressPercent} % du module</span>
              </div>
              <ProgressBar value={progressPercent} height="sm" showLabel={false} />
            </div>

            {/* Ressources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  Ressources téléchargeables
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {chapter.documentUrls.length === 0 ? (
                  <p className="text-slate-500 text-sm">Aucun document pour ce chapitre.</p>
                ) : (
                  chapter.documentUrls.map((doc, i) => (
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

            {/* Navigation Précédent / Chapitre suivant */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link
                href={
                  order > 1
                    ? `/student/modules/${moduleId}/chapitre/${order - 1}`
                    : `/student/modules/${moduleId}`
                }
                className="text-sm font-medium text-facam-blue hover:underline"
              >
                ← Précédent
              </Link>
              <Link
                href={
                  order < chapters.length
                    ? `/student/modules/${moduleId}/chapitre/${order + 1}`
                    : `/student/modules/${moduleId}/test-final`
                }
              >
                <Button variant="accent" size="lg">
                  {order < chapters.length ? 'Chapitre suivant →' : 'Passer au quiz final →'}
                </Button>
              </Link>
            </div>

            <ModuleCommentsSection moduleId={moduleId} />
            <ModuleDiscussionsSection moduleId={moduleId} />
          </div>

          {/* Sidebar : sommaire */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24">
              <ModuleCourseSidebar
                moduleId={moduleId}
                moduleTitle={module_.title}
                chapters={sidebarChapters}
                currentChapterOrder={order}
                completedChapterOrders={completedChapterOrders}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
