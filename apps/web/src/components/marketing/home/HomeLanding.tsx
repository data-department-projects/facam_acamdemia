/**
 * `HomeLanding` — Page d'accueil marketing (version premium).
 * Inspirée des meilleurs standards SaaS (hero, preuves sociales, valeur, parcours, CTA) avec animations sobres.
 *
 * Contraintes:
 * - Identité FACAM (bleu/jaune), typographie Montserrat
 * - Animations légères (performances, accessibilité, reduced motion)
 * - Sections explicitement exclues: celles demandées par l'utilisateur (pas de reprise à l'identique)
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Heart,
  LockKeyhole,
  PhoneCall,
  UsersRound,
  Quote,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { APP_NAME } from '@facam-academia/shared';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/marketing/home/Reveal';
import { ScrollProgress } from '@/components/marketing/home/ScrollProgress';

/** Image hero en fond (fichier public "hero.jpg") */
const HERO_BG_IMAGE = '/hero.jpg';

const QUICK_VALUE = [
  {
    title: 'Interface claire',
    desc: 'Une expérience fluide pour apprendre vite, sans friction.',
    icon: Sparkles,
  },
  {
    title: 'Parcours complets',
    desc: 'Cours, quiz, ressources et validation finale au même endroit.',
    icon: BookOpen,
  },
  {
    title: 'Accessible partout',
    desc: 'Mobile, tablette, ordinateur: votre campus vous suit.',
    icon: Users,
  },
];

const DOMAINS = [
  'Maintenance industrielle',
  'Production & Logistique',
  'QHSE / HSE',
  'Automatisme & régulation',
  'Électricité industrielle',
  'Mécanique & méthodes',
  'Management & leadership',
  'Data & performance',
];

const KEY_METRICS = [
  { value: 2500, suffix: '+', label: 'Apprenants', icon: Users },
  { value: 50, suffix: '+', label: 'Formations', icon: BookOpen },
  { value: 98, suffix: '%', label: 'Taux de réussite', icon: Award },
  { value: 30, suffix: ' j', label: 'Accès flexible', icon: Clock },
] as const;

const LEARNING_OUTCOMES = [
  {
    title: 'Apprendre en pratique',
    description: 'Des modules orientés terrain pour progresser vite vers les métiers industriels.',
    icon: UsersRound,
    side: 'left',
  },
  {
    title: 'Confidentialité',
    description: 'Un espace d’apprentissage sécurisé, avec des accès et une progression maîtrisés.',
    icon: LockKeyhole,
    side: 'left',
  },
  {
    title: 'Communauté',
    description:
      'Brisez la glace et avancez avec d’autres apprenants motivés, comme dans un vrai campus.',
    icon: Heart,
    side: 'left',
  },
  {
    title: 'Ouverture & réseau',
    description: 'Élargissez votre cercle et créez des liens forts avec des profils variés.',
    icon: Users,
    side: 'right',
  },
  {
    title: 'Accompagnement',
    description: 'Une communication claire et un suivi pour garder le cap et valider vos acquis.',
    icon: PhoneCall,
    side: 'right',
  },
] as const;

const AWARDS = [
  {
    image: '/prices/uemoa-logo.png',
    caption: 'Agrément UEMOA',
  },
  {
    image: '/prices/ECOWAS.png',
    caption: 'Reconnaissance CEDEAO',
  },
  {
    image: '/prices/number-one-image.png',
    caption: 'Pionnière de notre secteur industriel.',
  },
] as const;

const BRANDS = [
  { name: 'Blambox', tagline: 'Manufacturing Excellence', logo: '/brands/blambox-logo.png' },
  { name: 'Kleena', tagline: 'Tissue Products', logo: '/brands/kleena-logo.png' },
  { name: 'Angel Soft', tagline: 'Softness & Comfort', logo: '/brands/angel-soft-logo.png' },
  { name: 'Baby Well', tagline: 'Baby Care', logo: '/brands/baby-well-logo.png' },
  { name: 'Lala', tagline: 'Feminine Hygiene', logo: '/brands/lala-logo.png' },
  { name: 'Comfort+', tagline: 'Premium Quality', logo: '/brands/comfort-plus-logo.png' },
];

const FAQ_ITEMS = [
  {
    question: "Qu'est-ce que FACAM ACADEMIA et comment fonctionne la plateforme ?",
    answer:
      "FACAM ACADEMIA est une plateforme e-learning dédiée aux métiers de l'industrie. Vous suivez des modules en ligne (vidéos, quiz, ressources) puis validez un parcours pour obtenir un certificat.",
  },
  {
    question: "L'utilisation de la plateforme est-elle gratuite ?",
    answer:
      "L'accès dépend de votre statut : certains parcours sont pris en charge par l'entreprise ou un partenaire, d'autres sont accessibles via un compte apprenant créé par l'administrateur.",
  },
  {
    question: 'Comment assurez-vous ma progression et ma réussite ?',
    answer:
      'Chaque module est structuré en chapitres avec quiz, activités pratiques et un suivi de progression pour vous aider à atteindre vos objectifs.',
  },
  {
    question: 'Puis-je suivre les formations depuis mon pays en Afrique ?',
    answer:
      "Oui, la plateforme est accessible en ligne partout où vous disposez d'une connexion Internet, sur ordinateur comme sur mobile.",
  },
  {
    question: "À quel type de contenu puis-je m'attendre ?",
    answer:
      'Des vidéos courtes, des démonstrations, des cas pratiques, des quiz et des ressources téléchargeables, le tout orienté terrain et adapté aux réalités industrielles.',
  },
];

const ENTERPRISE_BENEFITS = [
  {
    title: 'Rapport qualité prix',
    description: 'Des produits d’hygiène accessibles, durables et au coût maîtrisé.',
  },
  {
    title: 'Innovation',
    description: 'Processus modernes, équipements performants et amélioration continue.',
  },
  {
    title: 'Excellence',
    description: 'Exigence à chaque étape : production, contrôle qualité et conformité.',
  },
  {
    title: 'Leadership',
    description: 'Capital humain, impact positif durable et écosystème responsable.',
  },
] as const;

const LEARNING_STEPS = [
  {
    title: 'Choisissez votre parcours',
    description:
      'Sélectionnez une formation (maintenance, QHSE, production…) selon votre profil et vos objectifs.',
    icon: BookOpen,
  },
  {
    title: 'Apprenez par la pratique',
    description:
      'Vidéos courtes, cas terrain, ressources téléchargeables — le tout structuré chapitre par chapitre.',
    icon: Sparkles,
  },
  {
    title: 'Validez avec des quiz',
    description:
      'Des évaluations régulières pour mesurer vos progrès, renforcer vos acquis et rester motivé.',
    icon: CheckCircle2,
  },
  {
    title: 'Obtenez votre certificat',
    description:
      'Terminez le parcours, passez l’évaluation finale et valorisez votre montée en compétences.',
    icon: Award,
  },
];

/** Programmes phares — chemins vers les images dans public (maintenance.jpg, production.jpg, qhse.jpg) */
const FEATURED_PROGRAMS = [
  {
    title: 'Maintenance industrielle',
    description: 'Préventive, corrective, diagnostic et méthodes.',
    image: '/F18.jpg',
    meta: { hours: 12, rating: 4.8, learners: '2,5k' },
  },
  {
    title: 'Production & Logistique',
    description: 'Lean, 5S, gestion des flux et pilotage des stocks.',
    image: '/F22.jpg',
    meta: { hours: 10, rating: 4.6, learners: '1,8k' },
  },
  {
    title: 'QHSE - Qualité Sécurité',
    description: 'ISO, risques, audits et culture sécurité.',
    image: '/qhse.jpg',
    meta: { hours: 15, rating: 4.7, learners: '3,2k' },
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Des formations directement applicables en entreprise. J'ai obtenu une certification QHSE et une promotion dans les 6 mois.",
    author: 'Aïcha D.',
    role: 'Responsable qualité',
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
  {
    quote:
      "Le rythme adapté et les quiz m'ont permis de valider le parcours Maintenance en un mois. Le certificat est reconnu par mon employeur.",
    author: 'Moussa K.',
    role: 'Technicien maintenance',
    avatar: 'https://i.pravatar.cc/150?img=12',
  },
  {
    quote:
      'Plateforme claire, formateurs experts. La meilleure décision pour mon évolution vers un poste en production.',
    author: 'Sophie T.',
    role: "Chef d'équipe",
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
];

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

function formatCompactNumber(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n);
}

function useCountUp(target: number, durationMs: number, enabled: boolean) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (target - from) * eased);
      setValue(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [durationMs, enabled, target]);

  return value;
}

function MetricCard({
  metric,
  index,
}: Readonly<{
  metric: (typeof KEY_METRICS)[number];
  index: number;
}>) {
  const reduce = useReducedMotion();
  const v = useCountUp(metric.value, 900 + index * 120, !reduce);
  const Icon = metric.icon;

  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-center"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-facam-yellow/10 blur-3xl" />
      <div className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl bg-white/10 text-facam-yellow">
        <Icon className="size-6" aria-hidden />
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-white">
        {formatCompactNumber(v)}
        <span className="text-white/90">{metric.suffix}</span>
      </p>
      <p className="mt-1 text-sm font-medium text-white/70">{metric.label}</p>
      <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <p className="mt-3 text-xs font-semibold text-white/60">
        Mesurez votre progression, pas juste le temps passé.
      </p>
    </motion.div>
  );
}

function SafeImage({
  src,
  alt,
  sizes,
  className,
  fill,
  priority,
}: Readonly<{
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
}>) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={[
          'flex h-full w-full items-center justify-center bg-gradient-to-br from-facam-blue-tint to-white',
          className ?? '',
        ].join(' ')}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      priority={priority}
      sizes={sizes}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function LogoTicker() {
  const reduce = useReducedMotion();
  const items = [
    'Industrie',
    'Maintenance',
    'QHSE',
    'Production',
    'Logistique',
    'Automatisme',
    'Électricité',
    'Méthodes',
  ];

  const row = [...items, ...items];

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
      <motion.div
        className="flex w-max gap-3 py-2"
        animate={reduce ? undefined : { x: ['0%', '-50%'] }}
        transition={reduce ? undefined : { duration: 22, ease: 'linear', repeat: Infinity }}
      >
        {row.map((label, i) => (
          <div
            key={`${label}-${i}`}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-facam-dark shadow-sm"
          >
            {label}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function SectionShell({
  id,
  className,
  children,
}: Readonly<{
  id?: string;
  className?: string;
  children: React.ReactNode;
}>) {
  return (
    <section id={id} className={className}>
      <div className="container-custom">{children}</div>
    </section>
  );
}

export function HomeLanding() {
  const reduce = useReducedMotion();
  const featuredBrands = useMemo(() => BRANDS, []);

  return (
    <div className="min-h-screen bg-white font-montserrat overflow-x-hidden">
      <ScrollProgress />
      <Header user={null} variant="glass" />

      {/* HERO — version “background image” style portfolio */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image src={HERO_BG_IMAGE} alt="" fill priority sizes="100vw" className="object-cover" />
          {/* Overlay charte FACAM (bleu/dark) pour garantir la lisibilité */}
          <div className="absolute inset-0 bg-facam-dark/65" aria-hidden />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(0,13,50,0.82) 0%, rgba(0,27,97,0.60) 55%, rgba(0,27,97,0.25) 100%)',
            }}
            aria-hidden
          />
        </div>

        <div className="container-custom relative z-10 py-24 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-facam-yellow" aria-hidden />
                <span>FACAM ACADEMIA · Plateforme e-learning industrie</span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Apprenez les métiers de l&apos;industrie
                <br />
                <span className="text-facam-yellow">comme dans un vrai campus.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
                FACAM ACADEMIA est une plateforme e-learning dédiée aux jeunes diplômés pour
                approfondir leurs compétences dans l’industrie des produits d’hygiène et
                d’emballage. Apprenez en ligne, validez votre certificat, puis passez au terrain
                avec un test sur place et une mise en pratique concrète.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link href="/login" className="inline-flex">
                  <Button
                    size="lg"
                    className="rounded-full bg-facam-yellow px-8 text-facam-dark hover:brightness-105 shadow-facam-yellow focus-visible:ring-0 focus-visible:ring-offset-0"
                  >
                    Connexion <ArrowRight />
                  </Button>
                </Link>
                <Link href="#programmes" className="inline-flex">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full border-white/35 text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/60"
                  >
                    Découvrir
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Preuve sociale — inspirée: bandeau/éléments en mouvement (sans "100 clients") */}
      <SectionShell className="bg-white py-10">
        <Reveal>
          <div className="flex flex-col items-center gap-6">
            <p className="text-sm font-semibold text-gray-500">
              Une expérience conçue pour les métiers de l’industrie
            </p>
            <LogoTicker />
          </div>
        </Reveal>
      </SectionShell>

      {/* Ce que vous apprendrez — section claire inspirée de l’exemple */}
      <SectionShell className="bg-white py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch">
          {/* Colonne gauche : visuel apprenant dans un cadre rectangulaire */}
          <Reveal className="lg:col-span-5">
            <div className="relative h-full">
              <div className="relative h-full min-h-[320px] w-full overflow-hidden rounded-3xl bg-facam-blue-tint/40 shadow-lg lg:min-h-[380px]">
                <SafeImage
                  src="/learn.jpg"
                  alt="Apprenant en formation en ligne"
                  fill
                  sizes="(max-width: 1024px) 100vw, 420px"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>

          {/* Colonne droite : titre + description + puces */}
          <Reveal className="lg:col-span-7">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-facam-blue">
                Ce que vous apprendrez
              </p>
              <h2 className="mt-2 text-3xl font-bold text-facam-dark">
                Construisez des compétences prêtes pour l&apos;emploi.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                Nos parcours vous aident à passer de la théorie à la pratique, avec des modules
                courts, des cas concrets et des évaluations régulières pour valider vos acquis.
              </p>

              <div className="mt-6 space-y-4">
                {LEARNING_OUTCOMES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="mt-0.5 inline-flex size-9 items-center justify-center rounded-full bg-facam-blue-tint text-facam-blue">
                        <Icon className="size-4" aria-hidden />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-facam-dark">{item.title}</p>
                        <p className="text-xs text-gray-600 leading-relaxed sm:text-sm">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </SectionShell>

      {/* Valeur immédiate — 3 cartes premium */}
      <SectionShell className="bg-white py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          <Reveal className="lg:col-span-4">
            <h2 className="text-3xl font-bold text-facam-dark">
              Une plateforme complète, flexible et évolutive
            </h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Tout est pensé pour une prise en main rapide et une progression mesurable, du premier
              cours jusqu’au certificat.
            </p>
            <div className="mt-6">
              <Link href="/login">
                <Button variant="primary">
                  Se connecter <ArrowRight />
                </Button>
              </Link>
            </div>
          </Reveal>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {QUICK_VALUE.map((f, idx) => {
                const Icon = f.icon;
                return (
                  <Reveal key={f.title} delay={0.08 * idx}>
                    <motion.div
                      whileHover={reduce ? undefined : { y: -6 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                      className="h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-facam-blue-tint text-facam-blue">
                          <Icon className="size-5" aria-hidden />
                        </div>
                        <h3 className="font-bold text-facam-dark">{f.title}</h3>
                      </div>
                      <p className="mt-3 text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                    </motion.div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </SectionShell>

      {/* Parcours — donne du rythme et clarifie l'expérience */}
      <SectionShell className="bg-white py-6">
        <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-facam-blue-tint p-8 md:p-10">
          <Reveal>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-facam-blue">Un chemin clair</p>
                <h2 className="mt-2 text-3xl font-bold text-facam-dark">
                  Un parcours guidé, du premier cours au certificat
                </h2>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  On ne vous laisse pas seul : étapes, quiz, suivi de progression et validation
                  finale pour apprendre efficacement.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="#programmes">
                  <Button variant="accent">
                    Découvrir les formations <ArrowRight />
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LEARNING_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.title} delay={0.05 * idx}>
                  <motion.div
                    whileHover={reduce ? undefined : { y: -6 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className="group h-full rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-facam-blue-tint text-facam-blue">
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <span className="text-xs font-bold text-gray-400">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-facam-dark">{step.title}</h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{step.description}</p>
                    <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <p className="mt-3 text-xs font-semibold text-facam-blue/90">
                      Étape {idx + 1} · Progression suivie
                    </p>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </SectionShell>

      {/* Domaines — inspiré "adapté à tous les secteurs" */}
      <SectionShell className="bg-gray-50 py-16">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-facam-dark">Adaptée à tous les profils</h2>
              <p className="mt-2 text-gray-600">
                Que vous soyez étudiant, technicien ou manager, trouvez un parcours adapté.
              </p>
            </div>
            <Link href="#programmes" className="inline-flex">
              <Button variant="outline">Explorer les domaines</Button>
            </Link>
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {DOMAINS.map((d, idx) => (
            <Reveal key={d} delay={0.03 * idx}>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-semibold text-facam-dark shadow-sm hover:border-facam-blue/30">
                {d}
              </div>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      {/* Formations — catégories + highlights (plus vivant) */}
      <SectionShell className="bg-white py-20">
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 md:p-12">
          <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-facam-yellow/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-facam-blue/10 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.55) 1px, transparent 0)',
              backgroundSize: '22px 22px',
            }}
            aria-hidden
          />

          <Reveal>
            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-facam-blue">Formations</p>
                <h2 className="mt-2 text-3xl font-bold text-facam-dark">
                  Un parcours complet, du e-learning à la pratique terrain
                </h2>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  Sur FACAM ACADEMIA, vous apprenez d’abord en ligne (vidéos, quiz, ressources) et
                  validez votre certificat. Ensuite, vous passez un test sur place, puis vous
                  démarrez une période de mise en pratique concrète pour transformer vos acquis en
                  compétences opérationnelles.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="#programmes">
                  <Button variant="accent">
                    Voir les parcours <ArrowRight />
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="relative z-10 mt-10">
              <div className="relative rounded-3xl border border-gray-200 bg-white/70 px-6 py-8 shadow-sm md:px-10">
                {/* Ligne de timeline (desktop: au centre / mobile: à gauche) */}
                <div
                  className="pointer-events-none absolute inset-y-8 left-5 w-px bg-gradient-to-b from-transparent via-facam-blue/25 to-transparent md:left-1/2 md:-translate-x-1/2"
                  aria-hidden
                />

                {[
                  {
                    k: '1',
                    title: 'Parcours e-learning',
                    desc: 'Modules structurés, vidéos, quiz et ressources pour progresser étape par étape.',
                    icon: BookOpen,
                  },
                  {
                    k: '2',
                    title: 'Certificat FACAM',
                    desc: 'Validation en fin de parcours pour attester des compétences acquises.',
                    icon: Award,
                  },
                  {
                    k: '3',
                    title: 'Test sur place',
                    desc: 'Évaluation en présentiel pour confirmer la maîtrise et préparer la suite.',
                    icon: CheckCircle2,
                  },
                  {
                    k: '4',
                    title: 'Mise en pratique',
                    desc: 'Période d’application concrète sur site pour devenir opérationnel.',
                    icon: Sparkles,
                  },
                ].map((step, idx) => {
                  const Icon = step.icon;
                  const isRight = idx % 2 === 1;
                  let initialX = 0;
                  if (!reduce) initialX = isRight ? 24 : -24;
                  const initial = reduce ? false : { opacity: 0, y: 14, x: initialX };

                  return (
                    <motion.div
                      key={step.k}
                      initial={initial}
                      whileInView={reduce ? undefined : { opacity: 1, y: 0, x: 0 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{ duration: 0.55, ease: 'easeOut', delay: idx * 0.06 }}
                      className="relative grid grid-cols-1 gap-4 py-6 md:grid-cols-2 md:gap-10"
                    >
                      {/* Colonne gauche (desktop) */}
                      <div className={isRight ? 'md:col-start-1 md:col-end-2 md:text-right' : ''}>
                        {!isRight && (
                          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-gray-200">
                            <div className="flex items-start gap-3 md:flex-row-reverse md:justify-end">
                              <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-facam-blue-tint text-facam-blue">
                                <Icon className="size-5" aria-hidden />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-facam-dark">
                                  {step.k}) {step.title}
                                </p>
                                <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                                  {step.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Colonne droite (desktop) */}
                      <div className={isRight ? '' : 'md:col-start-2 md:col-end-3'}>
                        {isRight && (
                          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-gray-200">
                            <div className="flex items-start gap-3">
                              <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-facam-blue-tint text-facam-blue">
                                <Icon className="size-5" aria-hidden />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-facam-dark">
                                  {step.k}) {step.title}
                                </p>
                                <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                                  {step.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Marker */}
                      <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2">
                        <motion.div
                          initial={reduce ? false : { scale: 0.95, opacity: 0.9 }}
                          animate={reduce ? undefined : { scale: [1, 1.06, 1], opacity: [1, 1, 1] }}
                          transition={{
                            duration: 2.2,
                            ease: 'easeInOut',
                            repeat: reduce ? 0 : Infinity,
                            delay: idx * 0.15,
                          }}
                          className="grid size-9 place-items-center rounded-xl bg-facam-blue text-white shadow-facam"
                        >
                          <span className="text-sm font-extrabold">{step.k}</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* Cartes de catégories supprimées à la demande */}
        </div>
      </SectionShell>

      {/* Chiffres clés — version premium + animation */}
      <section className="relative overflow-hidden bg-facam-dark py-20 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-28 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-facam-yellow/12 blur-3xl" />
          <div className="absolute -bottom-36 -left-28 h-[520px] w-[520px] rounded-full bg-facam-blue-mid/45 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
            aria-hidden
          />
        </div>

        <div className="container-custom relative z-10">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold text-white/70">Impact & communauté</p>
              <h2 className="mt-2 text-3xl font-bold">Nos chiffres clés</h2>
              <p className="mt-3 text-white/75">
                Une plateforme pensée pour apprendre vite, progresser, et valoriser des compétences
                concrètes.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {KEY_METRICS.map((m, idx) => (
              <Reveal key={m.label} delay={0.05 * idx}>
                <MetricCard metric={m} index={idx} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-white/55">
              Données indicatives (évoluent avec la communauté). Les statistiques exactes sont
              recalculées au fil des inscriptions et validations.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Récompenses et reconnaissances — une ligne + deux badges */}
      <SectionShell className="bg-gray-50 py-20">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 md:p-12">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold text-facam-blue">Nos distinctions</p>
              <h2 className="mt-2 text-3xl font-bold text-facam-dark">Une plateforme reconnue</h2>
              <p className="mt-3 text-gray-600 leading-relaxed">
                {APP_NAME} s’appuie sur des partenaires institutionnels et industriels pour garantir
                la qualité des parcours et la pertinence des compétences visées.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mx-auto mt-8 flex max-w-5xl flex-wrap items-center justify-center gap-x-12 gap-y-8 lg:flex-nowrap lg:justify-between">
              {AWARDS.map((a) => (
                <motion.div
                  key={a.image}
                  whileHover={reduce ? undefined : { y: -2 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="flex w-56 flex-col items-center gap-2"
                >
                  <div className="relative h-14 w-44 md:h-16 md:w-48 lg:h-18 lg:w-52">
                    <SafeImage
                      src={a.image}
                      alt={a.caption}
                      fill
                      sizes="(max-width: 768px) 176px, (max-width: 1024px) 192px, 208px"
                      className="object-contain"
                    />
                  </div>
                  <p className="text-center text-xs font-semibold text-gray-600">{a.caption}</p>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </SectionShell>

      {/* Programmes — cartes inspirées "valeur ajoutée" + courses */}
      <SectionShell id="programmes" className="bg-white py-20">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <Reveal className="max-w-2xl">
            <h2 className="text-3xl font-bold text-facam-dark">Programmes phares</h2>
            <p className="mt-2 text-gray-600 leading-relaxed">
              Des modules courts, concrets et orientés terrain, avec quiz et ressources.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <Link href="/login" className="inline-flex">
              <Button variant="accent">
                Accéder aux cours <ArrowRight />
              </Button>
            </Link>
          </Reveal>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {FEATURED_PROGRAMS.map((p, idx) => (
            <Reveal key={p.title} delay={0.08 * idx}>
              <motion.div
                whileHover={reduce ? undefined : { y: -8 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="relative aspect-[16/11] w-full overflow-hidden">
                  <SafeImage
                    src={p.image}
                    alt={p.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                    sizes="(max-width: 1024px) 92vw, 420px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                    <div className="inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 text-xs font-semibold">
                      <Clock className="size-3.5" aria-hidden />
                      {p.meta.hours}h
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 text-xs font-semibold">
                      <Star className="size-3.5 fill-current text-facam-yellow" aria-hidden />
                      {p.meta.rating} · {p.meta.learners}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-bold text-facam-dark">{p.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{p.description}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">Certificat inclus</span>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-sm font-bold text-facam-blue"
                    >
                      Voir <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      {/* Nos marques / partenaires formation — style portfolio premium */}
      <SectionShell className="bg-white py-20">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-facam-blue">Notre portefeuille</p>
            <h2 className="mt-2 text-3xl font-bold text-facam-dark">
              Nos marques & partenaires de confiance
            </h2>
            <p className="mt-3 text-gray-600">
              Un écosystème de marques engagées pour des produits fiables, performants et adaptés à
              différents besoins du marché.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {featuredBrands.map((brand, idx) => (
            <Reveal key={brand.name} delay={0.05 * idx}>
              <motion.div
                whileHover={
                  reduce ? undefined : { y: -6, boxShadow: '0 18px 40px rgba(0,0,0,0.12)' }
                }
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="group flex h-full flex-col items-center justify-between overflow-hidden rounded-3xl border border-gray-200 bg-white px-4 py-6 text-center shadow-sm"
              >
                <div className="relative mb-4 flex h-16 w-24 items-center justify-center rounded-2xl border border-gray-100 bg-white">
                  <SafeImage
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    sizes="96px"
                    className="object-contain p-2"
                  />
                </div>

                <p className="text-sm font-bold text-facam-dark">{brand.name}</p>
                <p className="mt-1 text-xs text-gray-500">{brand.tagline}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      {/* Témoignages — avis de nos apprenants (fond clair, cartes premium) */}
      <SectionShell className="bg-gray-50 py-20">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-facam-dark">Avis de nos apprenants</h2>
            <p className="mt-3 text-gray-600">
              Des retours concrets sur l’impact des parcours, la clarté de la plateforme et
              l’accompagnement proposé.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t, idx) => (
            <Reveal key={t.author} delay={0.08 * idx}>
              <motion.div
                whileHover={reduce ? undefined : { y: -8 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="h-full rounded-3xl border border-gray-200 bg-white p-7 text-left shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-11 overflow-hidden rounded-full bg-gray-100">
                      <SafeImage src={t.avatar} alt="" fill className="object-cover" sizes="44px" />
                    </div>
                    <div>
                      <p className="font-bold text-facam-dark">{t.author}</p>
                      <p className="text-sm text-gray-500">{t.role}</p>
                    </div>
                  </div>
                  <Quote className="size-8 text-facam-yellow/80" aria-hidden />
                </div>
                <p className="mt-4 text-sm text-gray-700 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-1 text-facam-yellow">
                  {STAR_VALUES.map((v) => (
                    <Star key={v} className="size-4 fill-current" aria-hidden />
                  ))}
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      {/* Espace entreprise */}
      <SectionShell id="entreprises" className="bg-gray-50 py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-6">
            <p className="text-sm font-semibold text-facam-blue">Espace entreprise</p>
            <h2 className="mt-2 text-3xl font-bold text-facam-dark">
              FACAM STAIRWAY : industrie, savoir-faire et équipements modernes
            </h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              FACAM STAIRWAY s’appuie sur des machines de dernière génération et des standards
              industriels exigeants pour produire des solutions d’hygiène et d’emballage adaptées au
              marché. Nos valeurs guident chaque décision.
            </p>

            <div className="mt-6 space-y-3">
              {ENTERPRISE_BENEFITS.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="mt-0.5 size-5 text-facam-blue" aria-hidden />
                  <div>
                    <p className="font-semibold text-facam-dark">{benefit.title}</p>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login">
                <Button variant="primary">
                  Commencer le parcours <ArrowRight />
                </Button>
              </Link>
              <Link href="#footer">
                <Button variant="outline" className="border-facam-blue/30 text-facam-blue">
                  Visite & informations pratiques
                </Button>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.12} className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              {/* Image de présentation de l'entreprise — à remplacer par un visuel fourni */}
              <div className="relative aspect-[16/9] w-full bg-facam-blue-tint">
                <SafeImage
                  src="/F10.jpg"
                  alt="Présentation de l’entreprise et de ses installations"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 560px"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-black/0 to-transparent" />
              </div>
            </div>
          </Reveal>
        </div>
      </SectionShell>

      {/* FAQ */}
      <SectionShell id="faq" className="bg-white py-20">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-facam-dark">Foire aux questions (FAQ)</h2>
            <p className="mt-3 text-gray-600">
              Quelques réponses rapides aux questions les plus fréquentes de nos apprenants et
              partenaires.
            </p>
          </div>
        </Reveal>

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {FAQ_ITEMS.map((item, idx) => (
            <Reveal key={item.question} delay={0.04 * idx}>
              <details className="group rounded-2xl border border-gray-200 bg-white p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                  <span className="text-sm font-semibold text-facam-dark">{item.question}</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-transform group-open:rotate-180">
                    <ChevronDown className="size-4" aria-hidden />
                  </span>
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      {/* CTA final */}
      <SectionShell className="bg-white py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-facam-blue-tint p-10 md:p-14">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-facam-yellow/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-facam-blue/15 blur-3xl" />

            <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <h2 className="text-3xl font-bold text-facam-dark">
                  Prêt à passer au niveau supérieur ?
                </h2>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  Créez votre compte, choisissez un parcours et progressez avec des étapes claires,
                  des quiz et un certificat à la clé.
                </p>
                <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    'Modules courts et orientés terrain',
                    'Progression et quiz intégrés',
                    'Ressources téléchargeables',
                    'Certificat à la fin du parcours',
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="mt-0.5 size-5 text-facam-blue" aria-hidden />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-4 lg:justify-self-end">
                <div className="flex flex-col gap-3">
                  <Link href="/login" className="inline-flex">
                    <Button variant="accent" size="lg" className="w-full">
                      Se connecter <ArrowRight />
                    </Button>
                  </Link>
                  <p className="text-sm text-gray-500 text-center">
                    Les comptes sont créés par l&apos;administrateur.
                  </p>
                </div>
                <p className="mt-3 text-center text-xs text-gray-500">
                  Aucun paiement requis pour découvrir la plateforme.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </SectionShell>

      {/* Footer — propre, organisé et esthétique */}
      <footer id="footer" className="relative bg-facam-dark text-white">
        {/* Séparateur visuel en haut du footer */}
        <div
          className="h-px w-full bg-gradient-to-r from-transparent via-facam-yellow/40 to-transparent"
          aria-hidden
        />
        <div className="container-custom py-16">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            {/* Marque et description */}
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-3">
                <Image
                  src="/Facam%20Academia-03%202.png"
                  alt={APP_NAME}
                  width={150}
                  height={40}
                  className="h-9 w-auto object-contain"
                  priority
                />
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
                La plateforme premium de formation industrielle en ligne. Formez-vous, validez vos
                compétences et certifiez-vous.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/login">
                  <Button variant="accent" size="sm">
                    Se connecter
                  </Button>
                </Link>
                <Link href="#programmes">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/25 text-white hover:border-white/50"
                  >
                    Programmes
                  </Button>
                </Link>
              </div>
            </div>
            {/* Liens principaux */}
            <div className="lg:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-facam-yellow/90">
                Navigation
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-white/75">
                <li>
                  <Link href="#programmes" className="transition-colors hover:text-white">
                    Programmes
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="transition-colors hover:text-white">
                    Connexion
                  </Link>
                </li>
              </ul>
            </div>
            {/* Entreprise */}
            <div className="lg:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-facam-yellow/90">
                Entreprise
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-white/75">
                <li>
                  <Link href="/#entreprises" className="transition-colors hover:text-white">
                    Former vos équipes
                  </Link>
                </li>
                <li>
                  <Link href="/#entreprises" className="transition-colors hover:text-white">
                    Partenariats
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Barre inférieure */}
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} {APP_NAME}. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4 text-sm text-white/60">
              <span className="rounded-full bg-white/10 px-3 py-1">FR</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
