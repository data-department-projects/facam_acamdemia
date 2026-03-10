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
import { Search, PlayCircle, Star } from 'lucide-react';
import { api } from '@/lib/api-client';

const TABS = [
  { id: 'all', label: 'Tous les cours' },
  { id: 'certs', label: 'Certifications' },
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
      <div className="bg-facam-dark text-white pt-8 md:pt-12 pb-4 px-4 md:px-6">
        <div className="container mx-auto">
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
          {/* Carte "Commencer une nouvelle série" */}
          <div className="mb-8 p-6 bg-facam-blue-tint/30 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-bold text-facam-dark font-montserrat mb-2">
              Commencer une nouvelle série
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Nous savons que vous pouvez le faire. Poursuivez vos objectifs !
            </p>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-facam-dark">0</p>
                <p className="text-xs text-gray-500 uppercase">série en cours</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-facam-dark">1/30</p>
                <p className="text-xs text-gray-500 uppercase">min de cours</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-facam-dark">4/1</p>
                <p className="text-xs text-gray-500 uppercase">visité(s)</p>
              </div>
            </div>
          </div>

          {/* Filtres + Tri */}
          <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
            <div className="flex flex-wrap gap-2 md:gap-4">
              <select
                className="border border-gray-300 rounded px-4 py-2.5 text-sm font-medium text-facam-dark bg-white hover:bg-gray-50 focus:outline-none focus:border-facam-blue"
                aria-label="Catégories"
              >
                <option>Catégories</option>
              </select>
              <select
                className="border border-gray-300 rounded px-4 py-2.5 text-sm font-medium text-facam-dark bg-white hover:bg-gray-50 focus:outline-none focus:border-facam-blue"
                aria-label="Progrès"
              >
                <option>Progrès</option>
              </select>
              <select
                className="border border-gray-300 rounded px-4 py-2.5 text-sm font-medium text-facam-dark bg-white hover:bg-gray-50 focus:outline-none focus:border-facam-blue"
                aria-label="Format"
              >
                <option>Format</option>
              </select>
              <button
                type="button"
                className="border border-gray-300 rounded px-4 py-2.5 text-sm font-medium text-facam-dark bg-white hover:bg-gray-50"
              >
                Réinitialiser
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              <input
                type="search"
                placeholder="Rechercher mes cours"
                className="border border-gray-300 pl-9 pr-4 py-2.5 w-48 md:w-64 text-sm focus:outline-none focus:border-facam-blue rounded"
                aria-label="Rechercher mes cours"
              />
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Tri : <span className="font-medium text-facam-dark">Récemment consultés</span>
          </p>

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
