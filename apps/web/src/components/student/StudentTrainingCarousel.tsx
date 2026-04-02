/**
 * StudentTrainingCarousel — Slider marketing léger pour l'interface étudiant/employé.
 *
 * Rôle:
 * - Afficher un bandeau d'images inspirant (avant les cours recommandés)
 * - Expliquer en 1 phrase le parcours de formation (e-learning → terrain)
 *
 * Points clés à connaître:
 * - `next/image` pour les images optimisées
 * - `framer-motion` pour des animations sobres (respect `prefers-reduced-motion`)
 * - Accessibilité: boutons précédant/suivant + labels + navigation au clavier
 */

'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Slide = {
  imageSrc: string;
  kicker: string;
  title: string;
  description: string;
};

export function StudentTrainingCarousel(
  props: Readonly<{
    className?: string;
  }>
) {
  const { className } = props;
  const reduce = useReducedMotion();

  const slides = useMemo<Slide[]>(
    () => [
      {
        imageSrc: '/F18.jpg',
        kicker: 'Votre parcours de formation',
        title: 'Montez en compétences, étape par étape',
        description:
          'Apprenez en ligne (cours + quiz), validez votre certificat, puis passez au terrain avec une mise en pratique encadrée.',
      },
      {
        imageSrc: '/F35.jpg',
        kicker: 'Industrie hygiène & emballage',
        title: 'Des contenus proches du réel',
        description:
          'Maintenance, production, QHSE… des modules orientés usine pour mieux réussir la transition vers le monde professionnel.',
      },
      {
        imageSrc: '/derniergeneration.png',
        kicker: 'FACAM STAIRWAY',
        title: 'Machines de dernière génération',
        description:
          'Découvrez les standards industriels modernes et préparez-vous à intervenir sur des équipements performants.',
      },
    ],
    []
  );

  const [index, setIndex] = useState(0);

  const go = (dir: -1 | 1) => {
    setIndex((i) => {
      const next = i + dir;
      if (next < 0) return slides.length - 1;
      if (next >= slides.length) return 0;
      return next;
    });
  };

  // Auto-advance (désactivé si reduced motion)
  useEffect(() => {
    if (reduce) return;
    const id = globalThis.setInterval(() => go(1), 8000);
    return () => globalThis.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, slides.length]);

  const current = slides[index];

  return (
    <section className={cn('relative w-full', className)} aria-label="Bandeau de formation">
      <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="relative h-[240px] w-full sm:h-[300px] lg:h-[340px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.imageSrc}
              initial={reduce ? false : { opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              <Image
                src={current.imageSrc}
                alt=""
                fill
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover"
              />
              {/* Overlay: lisibilité + charte FACAM */}
              <div className="absolute inset-0 bg-gradient-to-r from-facam-dark/75 via-facam-blue/45 to-transparent" />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/5" aria-hidden />
            </motion.div>
          </AnimatePresence>

          {/* Card texte (style exemple) */}
          <div className="absolute left-4 top-1/2 w-[min(520px,calc(100%-2rem))] -translate-y-1/2 sm:left-8">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="rounded-2xl bg-white/95 p-5 shadow-lg shadow-black/10 backdrop-blur"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-facam-blue">
                {current.kicker}
              </p>
              <h3 className="mt-2 text-xl font-extrabold text-facam-dark sm:text-2xl">
                {current.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{current.description}</p>
              <p className="mt-3 text-sm font-semibold text-facam-blue">
                Commencez dès aujourd&apos;hui.
              </p>
            </motion.div>
          </div>

          {/* Controls */}
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Slide précédent"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm ring-1 ring-black/5 hover:bg-white focus:outline-none"
          >
            <ChevronLeft className="size-5 text-facam-dark" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Slide suivant"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm ring-1 ring-black/5 hover:bg-white focus:outline-none"
          >
            <ChevronRight className="size-5 text-facam-dark" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.imageSrc}
                type="button"
                aria-label={`Aller au slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-2.5 w-2.5 rounded-full transition-colors',
                  i === index ? 'bg-facam-yellow' : 'bg-white/70 hover:bg-white'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
