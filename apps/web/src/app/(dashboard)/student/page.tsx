/**
 * Page d'accueil Étudiant — Style Udemy (homepage).
 * Barre catégories dans le header ; sections de cours recommandés / disponibles.
 * Clic sur un cours → page de détails du cours.
 */

'use client';

import { MOCK_MODULES } from '@/data/mock';
import { CourseCard } from '@/components/student/CourseCard';

export default function StudentDashboardPage() {
  return (
    <div className="pb-12 bg-white">
      {/* Section recommandations / modules disponibles */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        <h2 className="text-xl font-bold text-facam-dark mb-6 font-montserrat">
          Recommandé pour vous
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_MODULES.map((mod) => (
            <CourseCard key={mod.id} course={mod} />
          ))}
        </div>
      </div>

      {/* Section "En cours" optionnelle */}
      <div className="container mx-auto px-4 md:px-6 py-8 border-t border-gray-100">
        <h2 className="text-xl font-bold text-facam-dark mb-6 font-montserrat">
          Continuer votre apprentissage
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_MODULES.filter((m) => (m.progress ?? 0) > 0 && (m.progress ?? 0) < 100).map(
            (mod) => (
              <CourseCard key={mod.id} course={mod} showProgress />
            )
          )}
        </div>
        {MOCK_MODULES.filter((m) => (m.progress ?? 0) > 0 && (m.progress ?? 0) < 100).length ===
          0 && (
          <p className="text-gray-500">Aucun cours en cours. Découvrez les modules ci-dessus.</p>
        )}
      </div>
    </div>
  );
}
