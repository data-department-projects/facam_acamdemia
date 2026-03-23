/**
 * ChapterVideoAndQuiz — Bloc vidéo + déblocage du quiz après visionnage.
 * L'étudiant doit confirmer avoir vu la vidéo pour afficher le lien vers le quiz (UX demandée).
 * Rôle : respecter la règle "quiz débloqué uniquement après la vidéo".
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FileQuestion, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';

interface ChapterVideoAndQuizProps {
  embedUrl: string | null;
  chapterTitle: string;
  description?: string;
  moduleId: string;
  chapterId: string;
  chapterOrder: number;
  enrollmentId: string | null;
  videoItemId: string | null;
  quizItemId: string | null;
  quizId: string | null;
  nextHref: string;
  initialVideoCompleted?: boolean;
  initialQuizCompleted?: boolean;
}

export function ChapterVideoAndQuiz({
  embedUrl,
  chapterTitle,
  description,
  moduleId,
  chapterId,
  chapterOrder,
  enrollmentId,
  videoItemId,
  quizItemId,
  quizId,
  nextHref,
  initialVideoCompleted = false,
  initialQuizCompleted = false,
}: ChapterVideoAndQuizProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [videoMarkedComplete, setVideoMarkedComplete] = useState(initialVideoCompleted);
  const [savingProgress, setSavingProgress] = useState(false);
  const iframeId = useMemo(() => `chapter-video-${chapterId}`, [chapterId]);
  const quizUnlocked =
    (initialQuizCompleted || (!!embedUrl ? videoMarkedComplete : true)) && quizId;

  const embedUrlWithApi = useMemo(() => {
    if (!embedUrl) return null;
    try {
      const url = new URL(embedUrl);
      url.searchParams.set('enablejsapi', '1');
      if (typeof window !== 'undefined') {
        url.searchParams.set('origin', window.location.origin);
      }
      return url.toString();
    } catch {
      return embedUrl;
    }
  }, [embedUrl]);

  useEffect(() => {
    if (!embedUrlWithApi) return;
    if (!iframeRef.current) return;

    let cancelled = false;
    let player: { destroy?: () => void } | null = null;

    const markVideoComplete = async () => {
      if (cancelled || videoMarkedComplete) return;
      setVideoMarkedComplete(true);
      if (!enrollmentId) return;
      setSavingProgress(true);
      try {
        if (videoItemId) {
          await api.post(`/enrollments/${enrollmentId}/complete-item`, {
            chapterItemId: videoItemId,
          });
        }
        await api.patch(`/enrollments/${enrollmentId}/progression`, {
          lastViewedChapterId: chapterId,
          lastViewedItemId: videoItemId ?? undefined,
        });
      } catch {
        // best-effort: l'UX continue même si la sauvegarde échoue
      } finally {
        if (!cancelled) setSavingProgress(false);
      }
    };

    const setupPlayer = () => {
      const win = window as Window & {
        YT?: {
          PlayerState?: { ENDED: number };
          Player?: new (
            elementId: string,
            config: { events?: { onStateChange?: (event: { data: number }) => void } }
          ) => { destroy?: () => void };
        };
      };

      if (!win.YT?.Player || !win.YT?.PlayerState) return;
      player = new win.YT.Player(iframeId, {
        events: {
          onStateChange: (event) => {
            if (event.data === win.YT?.PlayerState?.ENDED) {
              void markVideoComplete();
            }
          },
        },
      });
    };

    const ensureYoutubeApi = () => {
      const win = window as Window & {
        YT?: unknown;
        onYouTubeIframeAPIReady?: () => void;
      };
      if (win.YT) {
        setupPlayer();
        return;
      }
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);
      }
      const previousReady = win.onYouTubeIframeAPIReady;
      win.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        setupPlayer();
      };
    };

    ensureYoutubeApi();

    return () => {
      cancelled = true;
      player?.destroy?.();
    };
  }, [embedUrlWithApi, iframeId, enrollmentId, chapterId, videoItemId, videoMarkedComplete]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <h1 className="text-xl font-bold text-facam-dark px-4 pt-4 font-montserrat">
        {chapterTitle}
      </h1>

      {/* Lecteur vidéo */}
      <div className="aspect-video w-full bg-slate-900 mt-4">
        {embedUrlWithApi ? (
          <iframe
            ref={iframeRef}
            id={iframeId}
            src={embedUrlWithApi}
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

      {/* Déblocage du quiz : automatique à la fin de la vidéo */}
      <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
        {!quizUnlocked ? (
          <p className="text-sm text-gray-700">
            Le quiz se débloquera automatiquement à la fin de la vidéo.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-green-700">
              <CheckCircle className="size-4 text-facam-yellow" />
              Quiz débloqué{savingProgress ? ' (sauvegarde...)' : ''}
            </span>
            <Link
              href={`/student/modules/${moduleId}/quiz?quizId=${quizId}&next=${encodeURIComponent(nextHref)}&chapterId=${encodeURIComponent(chapterId)}&chapterOrder=${chapterOrder}&quizItemId=${encodeURIComponent(quizItemId ?? '')}`}
            >
              <Button variant="accent" size="md">
                <FileQuestion className="mr-2 size-4" />
                Passer le quiz du chapitre
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
