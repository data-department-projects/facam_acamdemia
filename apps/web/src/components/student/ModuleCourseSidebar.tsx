/**
 * ModuleCourseSidebar — Sommaire interactif du module (colonne droite en cours de formation).
 * Affiche chapitres + éléments, élément en cours mis en évidence, cases à cocher (progression).
 * Style inspiré Udemy : "Contenu du cours" avec numéro, titre, durée, type (vidéo / document / quiz).
 */

'use client';

import Link from 'next/link';
import { Check, HelpCircle } from 'lucide-react';

export interface ChapterSidebarItem {
  id: string;
  title: string;
  order: number;
  durationMinutes?: number;
  type: 'video' | 'document' | 'quiz';
  isQuiz?: boolean;
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
          {sortedChapters.map((ch) => {
            const isCurrent = ch.order === currentChapterOrder;
            const completed = completedChapterOrders.has(ch.order);
            const duration = ch.durationMinutes ?? 0;

            return (
              <li key={ch.id}>
                <Link
                  href={`/student/modules/${moduleId}/chapitre/${ch.order}`}
                  className={`flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                    isCurrent ? 'bg-facam-blue-tint border-l-4 border-l-facam-blue' : ''
                  }`}
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 text-xs font-medium">
                    {completed ? (
                      <Check className="size-3.5 text-green-600" aria-hidden />
                    ) : (
                      ch.order
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-facam-dark line-clamp-2">{ch.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {duration > 0 && formatDuration(duration)}
                      {ch.items?.some((i) => i.isQuiz) && (
                        <span className="inline-flex items-center gap-1 ml-1">
                          <HelpCircle className="size-3" /> Quiz
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
