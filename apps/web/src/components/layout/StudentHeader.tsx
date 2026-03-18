/**
 * StudentHeader — Barre de navigation type Udemy pour l'espace étudiant.
 * Éléments : Logo, lien Découvrir, barre de recherche, Mon apprentissage (dropdown au hover),
 * icônes Favoris / Notifications / Profil. Sous-barre : catégories (Développement, Business, etc.).
 * Pas d'inscription publique, pas de panier ni Subscribe / Enseigner.
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { APP_NAME } from '@facam-academia/shared';
import { api } from '@/lib/api-client';

const LOGO_SRC = '/Facam%20Academia-02-02%202.png';

interface ApiCourse {
  id: string;
  title: string;
  imageUrl?: string;
  progress?: number;
}

export function StudentHeader(props: Readonly<{ user: { fullName: string; email: string } }>) {
  const { user } = props;
  const [searchQuery, setSearchQuery] = useState('');
  const [myLearningOpen, setMyLearningOpen] = useState(false);
  const [myCourses, setMyCourses] = useState<ApiCourse[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadMyCourses = useCallback(async () => {
    try {
      const res = await api.get<{ data: ApiCourse[] }>('/formations?limit=20');
      setMyCourses(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMyCourses([]);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    loadMyCourses();
  }, [loadMyCourses]);

  // Recharger à l'ouverture du dropdown pour refléter la progression la plus récente
  useEffect(() => {
    if (!myLearningOpen) return;
    loadMyCourses();
  }, [myLearningOpen, loadMyCourses]);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMyLearningOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Barre principale */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 font-montserrat shadow-sm">
        <div className="flex h-14 md:h-[72px] items-center gap-3 md:gap-4 px-4 md:px-6">
          {/* Logo */}
          <Link href="/student" className="flex-shrink-0">
            <Image
              src={LOGO_SRC}
              alt={APP_NAME}
              width={120}
              height={34}
              className="h-7 md:h-8 w-auto object-contain"
              priority
            />
          </Link>

          {/* Découvrir */}
          <Link
            href="/student"
            className="text-sm font-medium text-gray-700 hover:text-facam-blue transition-colors hidden sm:block"
          >
            Découvrir
          </Link>

          {/* Barre de recherche */}
          <div className="flex-1 max-w-xl relative hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              <input
                type="search"
                placeholder="Que souhaitez-vous apprendre ?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 md:h-11 rounded-full border border-gray-300 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:border-facam-blue focus:bg-white transition-all placeholder:text-gray-500"
                aria-label="Rechercher un cours"
              />
            </div>
          </div>

          {/* Droite : Mon apprentissage + icônes */}
          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            {/* Mon apprentissage avec dropdown */}
            <div className="relative h-full flex items-center" ref={dropdownRef}>
              <button
                type="button"
                onMouseEnter={() => setMyLearningOpen(true)}
                onClick={() => setMyLearningOpen((o) => !o)}
                className="text-sm font-medium text-gray-700 hover:text-facam-blue py-2 flex items-center"
                aria-expanded={myLearningOpen}
                aria-haspopup="true"
                aria-label="Ouvrir Mon apprentissage"
              >
                Mon apprentissage
              </button>

              {/* Dropdown (style image 4 Udemy) */}
              <div
                onMouseLeave={() => setMyLearningOpen(false)}
                className={`absolute top-full right-0 w-[360px] max-w-[calc(100vw-2rem)] bg-white border border-gray-200 shadow-xl rounded-md overflow-hidden transition-all duration-200 z-50 ${
                  myLearningOpen
                    ? 'opacity-100 visible mt-0'
                    : 'opacity-0 invisible -mt-2 pointer-events-none'
                }`}
              >
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-3">
                    {myCourses.map((course) => (
                      <Link
                        key={course.id}
                        href={`/student/modules/${course.id}`}
                        onClick={() => setMyLearningOpen(false)}
                        className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                      >
                        <div className="relative w-24 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                          <Image
                            src={course.imageUrl || '/placeholder-course.jpg'}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-facam-dark line-clamp-2">
                            {course.title}
                          </p>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                            <div
                              className="bg-facam-blue h-1.5 rounded-full transition-all"
                              style={{ width: `${course.progress ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/student/my-learning"
                    onClick={() => setMyLearningOpen(false)}
                    className="block mt-4"
                  >
                    <Button className="w-full font-bold" variant="accent" size="lg">
                      Aller à Mon apprentissage
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Profil — lien vers la page Compte */}
            <Link
              href="/student/compte"
              className="flex items-center justify-center size-8 md:size-9 rounded-full bg-facam-dark text-white font-bold text-sm hover:bg-facam-blue transition-colors focus:outline-none focus:ring-2 focus:ring-facam-blue focus:ring-offset-2"
              aria-label="Mon compte"
            >
              {user.fullName.charAt(0).toUpperCase()}
            </Link>
          </div>
        </div>

        {/* Sous-barre : Liens rapides (données depuis l’API, pas de mock) */}
        <div className="border-t border-gray-100 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 px-4 md:px-6 py-2 min-w-max">
            <Link
              href="/student/modules"
              className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full whitespace-nowrap transition-colors"
            >
              Tous les modules
            </Link>
            <Link
              href="/student/my-learning"
              className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full whitespace-nowrap transition-colors"
            >
              Mon apprentissage
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
