/**
 * CourseContentAccordion — Accordéon "Contenu du cours" type Udemy (image 3).
 * Affiche : nombre de sections, leçons, durée totale ; liste des sections dépliables
 * avec titre, durée. Pas de prix ni panier.
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Play } from 'lucide-react';
import type { CourseSection } from '@/types';

interface CourseContentAccordionProps {
  sections: CourseSection[];
  totalLessons: number;
  totalDurationMinutes: number;
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function CourseContentAccordion({
  sections,
  totalLessons,
  totalDurationMinutes,
}: CourseContentAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id ?? null);
  const hasTotalDuration = totalDurationMinutes > 0;

  return (
    <div className="border border-gray-200 rounded-b-none rounded-t-lg overflow-hidden">
      {/* En-tête avec stats */}
      <button
        type="button"
        onClick={() => setOpenId(openId ? null : (sections[0]?.id ?? null))}
        className="w-full flex items-center justify-between px-4 py-4 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors text-left"
      >
        <h3 className="font-bold text-facam-dark text-lg">Contenu du cours</h3>
        <span className="text-sm text-gray-600">
          {sections.length} section(s) · {totalLessons} leçon(s)
          {hasTotalDuration ? ` · ${formatDuration(totalDurationMinutes)}` : ''}
        </span>
        {openId ? (
          <ChevronUp className="size-5 text-gray-500 ml-2" />
        ) : (
          <ChevronDown className="size-5 text-gray-500 ml-2" />
        )}
      </button>

      {/* Liste des sections (accordéon) */}
      <div className="divide-y divide-gray-100">
        {sections.map((section) => {
          const isOpen = openId === section.id;
          return (
            <div key={section.id} className="bg-white">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : section.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <ChevronUp className="size-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="size-5 text-gray-500 flex-shrink-0" />
                  )}
                  <span className="font-medium text-facam-dark">{section.title}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {section.lessonCount} leçon(s)
                  {section.durationMinutes > 0
                    ? ` · ${formatDuration(section.durationMinutes)}`
                    : ''}
                </span>
              </button>
              {isOpen && (
                <div className="bg-gray-50/50 px-4 pb-3 pt-1">
                  <ul className="space-y-1">
                    {section.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex items-center gap-3 py-2 text-sm text-gray-700"
                      >
                        <Play className="size-4 text-gray-400 flex-shrink-0" />
                        <span className="flex-1">{lesson.title}</span>
                        <span className="text-gray-400 text-xs">
                          {formatDuration(lesson.durationMinutes)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
