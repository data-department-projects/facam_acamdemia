/**
 * ChapterVideoAndQuiz — Bloc vidéo + déblocage du quiz après visionnage.
 * L'étudiant doit confirmer avoir vu la vidéo pour afficher le lien vers le quiz (UX demandée).
 * Rôle : respecter la règle "quiz débloqué uniquement après la vidéo".
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileQuestion, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChapterVideoAndQuizProps {
  embedUrl: string | null;
  chapterTitle: string;
  description?: string;
  moduleId: string;
  chapterId: string;
  quizId: string | null;
}

export function ChapterVideoAndQuiz({
  embedUrl,
  chapterTitle,
  description,
  moduleId,
  chapterId,
  quizId,
}: ChapterVideoAndQuizProps) {
  const [videoMarkedComplete, setVideoMarkedComplete] = useState(false);
  const quizUnlocked = videoMarkedComplete && quizId;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <h1 className="text-xl font-bold text-facam-dark px-4 pt-4 font-montserrat">
        {chapterTitle}
      </h1>

      {/* Lecteur vidéo */}
      <div className="aspect-video w-full bg-slate-900 mt-4">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={chapterTitle}
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

      {/* Description du chapitre */}
      {description && (
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
        </div>
      )}

      {/* Déblocage du quiz : bouton "J'ai terminé la vidéo" */}
      <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
        {!videoMarkedComplete ? (
          <Button
            variant="accent"
            className="w-full sm:w-auto"
            onClick={() => setVideoMarkedComplete(true)}
          >
            J&apos;ai terminé la vidéo — débloquer le quiz
          </Button>
        ) : quizUnlocked ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-green-700">
              <CheckCircle className="size-4 text-facam-yellow" />
              Quiz débloqué
            </span>
            <Link href={`/student/modules/${moduleId}/quiz?quizId=${quizId}`}>
              <Button variant="accent" size="md">
                <FileQuestion className="mr-2 size-4" />
                Passer le quiz du chapitre
              </Button>
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
