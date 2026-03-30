/**
 * ModuleCourseSidebar — Sommaire interactif du module (colonne droite en cours de formation).
 * Affiche chapitres + éléments, élément en cours mis en évidence, cases à cocher (progression).
 * Style inspiré Udemy : "Contenu du cours" avec numéro, titre, durée, type (vidéo / document / quiz).
 */

'use client';

import Link from 'next/link';
import { Check, HelpCircle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChapterSidebarItem {
  id: string;
  title: string;
  order: number;
  durationMinutes?: number;
  type: 'video' | 'document' | 'quiz';
  isQuiz?: boolean;
  /** Si fourni, permet de naviguer directement vers l'item (quiz). */
  href?: string;
}

interface ModuleCourseSidebarProps {
  moduleId: string;
  moduleTitle: string;
  chapters: Array<{
    id: string;
    title: string;
    order: number;
    durationMinutes?: number;
    items?: ChapterSidebarItem[];
  }>;
  currentChapterOrder: number;
  completedChapterOrders?: Set<number>;
  completedItemIds?: Set<string>;
  /** True quand les progress-items sont chargés (sinon on évite de verrouiller par erreur). */
  progressReady?: boolean;
  /** True si le module est déjà certifié/terminé: pas de verrouillage. */
  isCertified?: boolean;
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function ModuleCourseSidebar({
  moduleId,
  moduleTitle,
  chapters,
  currentChapterOrder,
  completedChapterOrders = new Set(),
  completedItemIds = new Set(),
  progressReady = false,
  isCertified = false,
}: ModuleCourseSidebarProps) {
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="font-bold text-facam-dark text-sm">Contenu du cours</h2>
        <p className="text-xs text-gray-500 truncate mt-0.5" title={moduleTitle}>
          {moduleTitle}
        </p>
      </div>
      <nav className="max-h-[70vh] overflow-y-auto" aria-label="Sommaire du module">
        <ul className="divide-y divide-gray-100">
          {sortedChapters.map((ch, idx) => {
            const isCurrent = ch.order === currentChapterOrder;
            const completed = completedChapterOrders.has(ch.order);
            const prev = idx > 0 ? sortedChapters[idx - 1] : null;
            const isLocked =
              !isCertified && progressReady && !!prev && !completedChapterOrders.has(prev.order);
            const duration = ch.durationMinutes ?? 0;

            const content = (
              <>
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 text-xs font-medium">
                  {completed ? (
                    <Check className="size-3.5 text-facam-yellow" aria-hidden />
                  ) : isLocked ? (
                    <Lock className="size-3.5 text-gray-400" aria-hidden />
                  ) : (
                    ch.order
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm font-medium line-clamp-2',
                      isLocked ? 'text-gray-400' : 'text-facam-dark'
                    )}
                  >
                    {ch.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {duration > 0 && formatDuration(duration)}
                    {ch.items?.some((i) => i.isQuiz) && (
                      <span className="inline-flex items-center gap-1 ml-1">
                        <HelpCircle className="size-3" /> Quiz
                      </span>
                    )}
                  </p>
                </div>
              </>
            );

            if (isLocked) {
              return (
                <li key={ch.id}>
                  <span
                    className="flex items-center gap-3 px-4 py-3 text-left cursor-not-allowed bg-gray-50"
                    aria-label={`Chapitre ${ch.order} : verrouillé`}
                  >
                    {content}
                  </span>
                </li>
              );
            }

            return (
              <li key={ch.id}>
                <div
                  className={cn(
                    'px-4 py-3 transition-colors hover:bg-gray-50',
                    isCurrent && 'bg-facam-blue-tint border-l-4 border-l-facam-yellow'
                  )}
                >
                  <Link
                    href={`/student/modules/${moduleId}/chapitre/${ch.order}`}
                    className="flex items-center gap-3 text-left"
                  >
                    {content}
                  </Link>

                  {/* Sous-items (vidéo / ressources / quiz) */}
                  {(ch.items?.length ?? 0) > 0 && (
                    <ul className="mt-2 space-y-1 pl-9">
                      {(ch.items ?? []).map((it) => {
                        const done = completedItemIds.has(it.id);
                        const label =
                          it.type === 'quiz'
                            ? 'Quiz'
                            : it.type === 'document'
                              ? 'Ressources'
                              : 'Vidéo';

                        const row = (
                          <span
                            className={cn(
                              'flex items-center gap-2 rounded-md px-2 py-1 text-xs',
                              done ? 'text-facam-dark' : 'text-gray-600',
                              it.type === 'quiz' && 'font-semibold'
                            )}
                          >
                            <span className="inline-flex size-4 items-center justify-center rounded border border-gray-200 bg-white">
                              {done ? (
                                <Check className="size-3 text-facam-yellow" aria-hidden />
                              ) : (
                                <span
                                  className="h-1.5 w-1.5 rounded-full bg-gray-300"
                                  aria-hidden
                                />
                              )}
                            </span>
                            <span className="truncate">
                              {label}
                              {it.title ? ` · ${it.title}` : ''}
                            </span>
                          </span>
                        );

                        // Quiz: lien direct si href fourni. Autres: restent informatifs (navigation via chapitre).
                        return (
                          <li key={it.id}>
                            {it.href ? (
                              <Link href={it.href} className="block hover:bg-white/70 rounded-md">
                                {row}
                              </Link>
                            ) : (
                              row
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
