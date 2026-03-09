/**
 * Page de détails d'un cours — Style Udemy (image 2 + 3).
 * Layout : titre, sous-titre, note, participants, créateur, date, langue.
 * Sections : "Ce que vous apprendrez" (liste à puces), "Contenu du cours" (accordéon).
 * Bouton "Commencer le cours" à la place du panier / prix. Pas de paiement ni partage.
 */

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CourseContentAccordion } from '@/components/student/CourseContentAccordion';
import { MOCK_MODULES, MOCK_CHAPTERS } from '@/data/mock';

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default async function StudentModuleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const module_ = MOCK_MODULES.find((m) => m.id === id);
  const chapters = MOCK_CHAPTERS.filter((c) => c.moduleId === id).sort((a, b) => a.order - b.order);

  if (!module_) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          Module introuvable.
          <Link href="/student" className="ml-2 underline">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  const sections = module_.sections ?? [];
  const totalLessons = sections.reduce((acc, s) => acc + s.lessonCount, 0);
  const totalDurationMinutes = sections.reduce((acc, s) => acc + s.durationMinutes, 0);
  const rating = module_.rating ?? 4.8;
  const reviewCount = module_.reviewCount ?? 1200;
  const instructor = module_.instructor ?? 'FACAM ACADEMIA';
  const lastUpdated = module_.lastUpdated ?? 'Récent';
  const language = module_.language ?? 'Français';
  const learningOutcomes = module_.learningOutcomes ?? [];
  const prerequisites = module_.prerequisites ?? [];
  const levelLabel =
    module_.level === 'debutant'
      ? 'Débutant'
      : module_.level === 'intermediaire'
        ? 'Intermédiaire'
        : module_.level === 'avance'
          ? 'Avancé'
          : null;

  const progressPercent = module_.progress ?? 0;

  return (
    <div className="bg-white min-h-screen">
      {/* Fil d'Ariane */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 py-3">
          <Breadcrumb items={[{ label: 'Accueil', href: '/student' }, { label: module_.title }]} />
        </div>
      </div>

      {/* Bandeau principal : image + infos (style Udemy) */}
      <div className="bg-facam-dark text-white">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold font-montserrat leading-tight">
                {module_.title}
              </h1>
              {module_.subtitle && (
                <p className="mt-2 text-gray-300 text-sm md:text-base line-clamp-2">
                  {module_.subtitle}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                <span className="font-bold text-facam-yellow">{rating.toFixed(1)}</span>
                <div className="flex text-facam-yellow" aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={`star-${i}`} className="size-4 fill-current" />
                  ))}
                </div>
                <span className="text-gray-400">({formatCount(reviewCount)} participants)</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-400">
                <span>Par {instructor}</span>
                <span>·</span>
                <span>Mis à jour {lastUpdated}</span>
                <span>·</span>
                <span>{language}</span>
              </div>
            </div>
            <div className="relative w-full md:w-80 h-44 md:h-52 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
              <Image
                src={module_.imageUrl}
                alt={module_.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 320px"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            {/* Ce que vous apprendrez */}
            {learningOutcomes.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-facam-dark mb-4 font-montserrat">
                  Ce que vous apprendrez
                </h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 list-disc list-inside text-gray-700">
                  {learningOutcomes.map((outcome) => (
                    <li key={outcome} className="text-sm md:text-base">
                      {outcome}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Prérequis */}
            {prerequisites.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-facam-dark mb-4 font-montserrat">
                  Prérequis
                </h2>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {prerequisites.map((pre) => (
                    <li key={pre} className="text-sm md:text-base">
                      {pre}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Contenu du cours (accordéon) */}
            {sections.length > 0 ? (
              <section>
                <CourseContentAccordion
                  sections={sections}
                  totalLessons={totalLessons}
                  totalDurationMinutes={totalDurationMinutes}
                />
              </section>
            ) : (
              <section className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-facam-dark mb-4 font-montserrat">
                  Chapitres et ressources
                </h2>
                {chapters.length === 0 ? (
                  <p className="text-gray-500">Aucun chapitre disponible.</p>
                ) : (
                  <ul className="space-y-2">
                    {chapters.map((ch, i) => (
                      <li
                        key={ch.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <span className="font-medium text-facam-dark">
                          {i + 1}. {ch.title}
                        </span>
                        <Link
                          href={`/student/modules/${id}/chapitre/${ch.order}`}
                          className="text-sm font-medium text-facam-blue hover:underline"
                        >
                          Voir
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          {/* Colonne latérale : Carte d'information + CTA (style Udemy) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              {/* Zone visuelle (image / teaser) */}
              <div className="relative w-full aspect-video rounded-t-lg overflow-hidden bg-gray-100">
                <Image
                  src={module_.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 320px"
                />
              </div>
              <div className="p-5 space-y-4">
                {/* Formateur */}
                <div className="flex items-start gap-3">
                  {module_.instructorAvatarUrl ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                      <Image
                        src={module_.instructorAvatarUrl}
                        alt={module_.instructor ?? 'Formateur'}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-facam-blue text-white flex items-center justify-center font-bold flex-shrink-0">
                      {(module_.instructor ?? 'F').charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-facam-dark text-sm">Formateur</p>
                    <p className="text-gray-900 font-medium">
                      {module_.instructor ?? 'FACAM ACADEMIA'}
                    </p>
                    {module_.instructorBio && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {module_.instructorBio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Infos clés */}
                <ul className="space-y-2 text-sm text-gray-700 border-t border-gray-100 pt-4">
                  <li className="flex justify-between">
                    <span className="text-gray-500">Durée totale</span>
                    <span className="font-medium">{module_.durationHours} h de vidéos</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-500">Chapitres</span>
                    <span className="font-medium">{module_.chaptersCount}</span>
                  </li>
                  {(module_.quizCount ?? 0) > 0 && (
                    <li className="flex justify-between">
                      <span className="text-gray-500">Quiz</span>
                      <span className="font-medium">{module_.quizCount}</span>
                    </li>
                  )}
                  {(module_.downloadableResourcesCount ?? 0) > 0 && (
                    <li className="flex justify-between">
                      <span className="text-gray-500">Ressources</span>
                      <span className="font-medium">
                        {module_.downloadableResourcesCount} (PDF, etc.)
                      </span>
                    </li>
                  )}
                  {levelLabel && (
                    <li className="flex justify-between">
                      <span className="text-gray-500">Niveau</span>
                      <span className="font-medium">{levelLabel}</span>
                    </li>
                  )}
                  {module_.hasCertificate && (
                    <li className="text-facam-blue font-medium">Certificat à la clé</li>
                  )}
                </ul>

                {/* Progression du module */}
                {progressPercent > 0 && (
                  <div className="pt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Votre progression</span>
                      <span>{progressPercent} %</span>
                    </div>
                    <ProgressBar value={progressPercent} height="sm" showLabel={false} />
                  </div>
                )}

                {/* Boutons d'action — jaune (accent) pour CTA principal */}
                <div className="pt-4 space-y-2">
                  {progressPercent > 0 ? (
                    <>
                      <Link href={`/student/modules/${id}/chapitre/1`} className="block">
                        <Button
                          variant="accent"
                          size="lg"
                          className="w-full font-bold text-base py-3"
                        >
                          Reprendre là où j&apos;en étais
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link href={`/student/modules/${id}/chapitre/1`} className="block">
                      <Button
                        variant="accent"
                        size="lg"
                        className="w-full font-bold text-base py-3"
                      >
                        Commencer la formation
                      </Button>
                    </Link>
                  )}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Accès inclus dans votre formation. Aucun paiement requis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
