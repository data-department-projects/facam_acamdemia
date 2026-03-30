/**
 * Page "Mon apprentissage" — Style Udemy (image 5).
 * Titre "Mon apprentissage", sous-barre : Tous les cours, Certifications.
 * Carte "Commencer une nouvelle série"
 * avec stats. Filtres (Catégories, Progrès, Format). Liste des cours avec progression,
 * tri "Récemment consultés".
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  PlayCircle,
  Star,
  BookOpen,
  GraduationCap,
  FlaskConical,
  PencilRuler,
  Calculator,
  PenTool,
  Notebook,
  School,
  Sigma,
  Atom,
  Lightbulb,
  Landmark,
  Binary,
  Compass,
  Shapes,
  Microscope,
  ScrollText,
  FolderPen,
  DraftingCompass,
  Bot,
} from 'lucide-react';
import { api } from '@/lib/api-client';

const TABS = [
  { id: 'all', label: 'Tous les cours' },
  { id: 'certs', label: 'Certifications' },
] as const;

const LEARNING_DOODLES = [
  { Icon: BookOpen, className: '-left-4 top-2 size-16 rotate-[-12deg]' },
  { Icon: GraduationCap, className: 'left-1/4 -top-3 size-14 rotate-[10deg]' },
  { Icon: FlaskConical, className: 'left-[42%] top-10 size-14 rotate-[-8deg]' },
  { Icon: PencilRuler, className: 'right-[28%] -top-2 size-16 rotate-[18deg]' },
  { Icon: Calculator, className: 'right-6 top-4 size-14 rotate-[-14deg]' },
  { Icon: BookOpen, className: 'left-[12%] bottom-1 size-12 rotate-[8deg]' },
  { Icon: FlaskConical, className: 'right-[12%] bottom-1 size-12 rotate-[-6deg]' },
  { Icon: PenTool, className: 'left-[8%] top-14 size-10 rotate-[20deg]' },
  { Icon: Notebook, className: 'left-[30%] top-3 size-10 rotate-[-14deg]' },
  { Icon: School, className: 'left-[58%] top-2 size-10 rotate-[10deg]' },
  { Icon: Sigma, className: 'left-[67%] top-14 size-11 rotate-[-10deg]' },
  { Icon: Atom, className: 'right-[35%] top-10 size-11 rotate-[12deg]' },
  { Icon: GraduationCap, className: 'right-[6%] top-14 size-10 rotate-[6deg]' },
  { Icon: PenTool, className: 'left-[18%] bottom-3 size-9 rotate-[-8deg]' },
  { Icon: Notebook, className: 'left-[36%] bottom-2 size-9 rotate-[10deg]' },
  { Icon: Sigma, className: 'left-[52%] bottom-2 size-9 rotate-[-12deg]' },
  { Icon: School, className: 'left-[72%] bottom-2 size-9 rotate-[9deg]' },
  { Icon: Atom, className: 'right-[20%] bottom-3 size-9 rotate-[-7deg]' },
  { Icon: Calculator, className: 'right-[2%] bottom-2 size-9 rotate-[14deg]' },
  { Icon: Lightbulb, className: 'left-[4%] top-24 size-8 rotate-[8deg]' },
  { Icon: Landmark, className: 'left-[24%] top-20 size-8 rotate-[-10deg]' },
  { Icon: Binary, className: 'left-[48%] top-22 size-8 rotate-[12deg]' },
  { Icon: Compass, className: 'right-[42%] top-22 size-8 rotate-[-14deg]' },
  { Icon: Shapes, className: 'right-[16%] top-22 size-8 rotate-[6deg]' },
  { Icon: Lightbulb, className: 'left-[10%] bottom-6 size-8 rotate-[-6deg]' },
  { Icon: Landmark, className: 'left-[62%] bottom-6 size-8 rotate-[9deg]' },
  { Icon: Compass, className: 'right-[30%] bottom-6 size-8 rotate-[-11deg]' },
  { Icon: Binary, className: 'right-[8%] bottom-6 size-8 rotate-[7deg]' },
  { Icon: Microscope, className: 'left-[34%] top-24 size-7 rotate-[6deg]' },
  { Icon: ScrollText, className: 'left-[54%] top-24 size-7 rotate-[-9deg]' },
  { Icon: FolderPen, className: 'right-[50%] top-24 size-7 rotate-[10deg]' },
  { Icon: DraftingCompass, className: 'right-[24%] top-24 size-7 rotate-[-7deg]' },
  { Icon: Bot, className: 'right-[3%] top-26 size-7 rotate-[8deg]' },
  { Icon: Microscope, className: 'left-[28%] bottom-8 size-7 rotate-[-8deg]' },
  { Icon: ScrollText, className: 'left-[46%] bottom-8 size-7 rotate-[9deg]' },
  { Icon: FolderPen, className: 'left-[82%] bottom-8 size-7 rotate-[-6deg]' },
] as const;

interface ApiModule {
  id: string;
  title: string;
  imageUrl?: string;
  progress?: number;
}

export default function MyLearningPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [myCourses, setMyCourses] = useState<ApiModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: ApiModule[] }>('/formations?limit=50')
      .then((res) => {
        if (!cancelled) setMyCourses(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setMyCourses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-facam-dark">
      {/* En-tête noir type Udemy */}
      <div className="relative overflow-hidden bg-facam-dark px-4 pb-4 pt-8 text-white md:px-6 md:pt-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-12 top-0 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-facam-blue/40 blur-3xl" />
          <div className="absolute left-1/2 top-6 h-24 w-24 -translate-x-1/2 rounded-full bg-white/10 blur-2xl" />
          {LEARNING_DOODLES.map(({ Icon, className }) => (
            <Icon
              key={`doodle-${Icon.displayName ?? Icon.name ?? className}-${className}`}
              className={`absolute text-white/25 blur-[1.5px] ${className}`}
              strokeWidth={1.8}
              aria-hidden
            />
          ))}
        </div>

        <div className="container relative z-10 mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold font-montserrat mb-6 md:mb-8">
            Mon apprentissage
          </h1>
          <div className="flex overflow-x-auto gap-4 md:gap-6 text-sm font-bold border-b border-gray-700 scrollbar-hide pb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="bg-white min-h-[60vh] py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          {/* Recherche uniquement */}
          <div className="mb-6">
            <div className="relative ml-auto w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              <input
                type="search"
                placeholder="Rechercher mes cours"
                className="w-full rounded border border-gray-300 py-2.5 pl-9 pr-4 text-sm focus:border-facam-blue focus:outline-none"
                aria-label="Rechercher mes cours"
              />
            </div>
          </div>

          {/* Grille de cours */}
          {loading ? (
            <p className="text-gray-500">Chargement de vos cours…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {myCourses.map((course) => (
                <div
                  key={course.id}
                  className="border border-gray-200 bg-white group hover:shadow-md transition-shadow rounded-lg overflow-hidden"
                >
                  <Link href={`/student/modules/${course.id}`} className="block">
                    <div className="relative h-40 w-full bg-gray-200">
                      <Image
                        src={course.imageUrl || '/placeholder-course.jpg'}
                        alt={course.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircle className="size-12 text-white" strokeWidth={1.5} />
                      </div>
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/student/modules/${course.id}`}>
                      <h3 className="font-bold text-facam-dark line-clamp-2 mb-2 group-hover:text-facam-blue transition-colors">
                        {course.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-500 mb-3">FACAM ACADEMIA</p>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full mb-2">
                      <div
                        className="bg-facam-blue h-1.5 rounded-full transition-all"
                        style={{ width: `${course.progress ?? 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">
                        {course.progress === 100
                          ? '100% terminés'
                          : `${course.progress ?? 0}% terminés`}
                      </span>
                      <div className="flex items-center gap-1 text-facam-yellow">
                        <Star className="size-3 fill-current" />
                        <span className="text-gray-500">Votre note</span>
                      </div>
                    </div>
                    <Link
                      href={`/student/modules/${course.id}/chapitre/1`}
                      className="mt-4 pt-4 border-t border-gray-100 block text-center text-xs font-bold text-facam-dark uppercase tracking-wide hover:text-facam-blue transition-colors"
                    >
                      {course.progress && course.progress > 0
                        ? 'Reprendre le cours'
                        : 'Commencer le cours'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && myCourses.length === 0 && (
            <p className="text-gray-500">
              Aucun cours. Inscrivez-vous à un module depuis le catalogue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
