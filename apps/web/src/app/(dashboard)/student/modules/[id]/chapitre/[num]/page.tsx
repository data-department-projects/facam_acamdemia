/**
 * Interface de suivi d'un module : contenu du chapitre (vidéo / document) + sommaire à droite.
 * Disposition : colonne gauche 65-70 % (lecteur vidéo, documents, barre de progression, quiz),
 * colonne droite 30-35 % (sommaire interactif). En bas : Commentaires et Questions / Discussions.
 */

import Link from 'next/link';
import { FileText, FileQuestion } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MOCK_CHAPTERS, MOCK_MODULES } from '@/data/mock';
import { ModuleCourseSidebar } from '@/components/student/ModuleCourseSidebar';
import { ModuleCommentsSection } from '@/components/student/ModuleCommentsSection';
import { ModuleDiscussionsSection } from '@/components/student/ModuleDiscussionsSection';

interface PageProps {
  params: Promise<{ id: string; num: string }>;
}

/** Extrait l'ID vidéo YouTube depuis une URL ou un embed */
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Colonne principale : contenu (65-70 %) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <h1 className="text-xl font-bold text-facam-dark px-4 pt-4 font-montserrat">
                {chapter.title}
              </h1>

              {/* Lecteur vidéo (YouTube embed ou placeholder) */}
              <div className="aspect-video w-full bg-slate-900 mt-4">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={chapter.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400 text-sm">
                    Vidéo du chapitre (lien YouTube à configurer)
                  </div>
                )}
              </div>

              {/* Barre de progression du chapitre (indicateur visuel) */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Chapitre {order} sur {chapters.length}
                </span>
                <div className="w-32 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-facam-blue transition-all"
                    style={{ width: `${(order / chapters.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Ressources téléchargeables */}
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

            {/* Lien quiz du chapitre */}
            {chapter.quizId && (
              <Link href={`/student/modules/${moduleId}/quiz?chapter=${chapter.id}`}>
                <Button variant="outline" className="w-full sm:w-auto">
                  <FileQuestion className="mr-2 size-4" />
                  Passer le quiz du chapitre
                </Button>
              </Link>
            )}

            {/* Navigation Précédent / Suivant */}
            <div className="flex justify-between text-sm">
              <Link
                href={
                  order > 1
                    ? `/student/modules/${moduleId}/chapitre/${order - 1}`
                    : `/student/modules/${moduleId}`
                }
                className="text-facam-blue hover:underline font-medium"
              >
                ← Précédent
              </Link>
              <Link
                href={
                  order < chapters.length
                    ? `/student/modules/${moduleId}/chapitre/${order + 1}`
                    : `/student/modules/${moduleId}/test-final`
                }
                className="text-facam-blue hover:underline font-medium"
              >
                {order < chapters.length ? 'Suivant →' : 'Quiz final →'}
              </Link>
            </div>

            {/* Zone Commentaires */}
            <ModuleCommentsSection moduleId={moduleId} />

            {/* Zone Questions / Discussions */}
            <ModuleDiscussionsSection moduleId={moduleId} />
          </div>

          {/* Colonne droite : sommaire du module (30-35 %) */}
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
