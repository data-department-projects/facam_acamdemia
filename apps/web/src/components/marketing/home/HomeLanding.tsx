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
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BookOpen,
  ChevronDown,
  Clock,
  CheckCircle2,
  Factory,
  Handshake,
  Heart,
  Network,
  ShieldCheck,
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

const LEARNING_OUTCOMES = [
  {
    title: 'Un apprentissage ancré dans le terrain',
    description:
      'Progressez rapidement avec des contenus pensés pour les réalités des métiers industriels.',
    icon: Factory,
  },
  {
    title: 'Un environnement sécurisé',
    description:
      'Bénéficiez d’un espace d’apprentissage structuré, avec des accès contrôlés et une progression encadrée.',
    icon: ShieldCheck,
  },
  {
    title: 'Une dynamique de communauté',
    description:
      'Évoluez aux côtés d’autres apprenants engagés, dans un esprit collaboratif proche d’un véritable campus.',
    icon: Heart,
  },
  {
    title: 'Un réseau en construction',
    description:
      'Multipliez les échanges et créez des connexions durables avec des profils variés.',
    icon: Network,
  },
  {
    title: 'Un accompagnement continu',
    description:
      'Profitez d’un suivi clair et régulier pour rester motivé et atteindre vos objectifs.',
    icon: Handshake,
  },
] as const;

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
    title: 'Logistique',
    description: 'Lean, 5S, gestion des flux et pilotage des stocks.',
    image: '/F22.jpg',
    meta: { hours: 10, rating: 4.6, learners: '1,8k' },
  },
  {
    title: 'Production',
    description: 'Pilotage, standards, performance et amélioration continue.',
    image: '/F14.jpg',
    meta: { hours: 11, rating: 4.7, learners: '1,6k' },
  },
  {
    title: 'QHSE - Qualité Sécurité',
    description: 'ISO, risques, audits et culture sécurité.',
    image: '/qhse.jpg',
    meta: { hours: 15, rating: 4.7, learners: '3,2k' },
  },
];

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
  return (
    <div className="min-h-screen bg-white font-montserrat overflow-x-hidden">
      <ScrollProgress />
      <Header user={null} variant="glass" />

      {/* HERO — version “background image” style portfolio */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src={HERO_BG_IMAGE}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
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

        <div className="container-custom relative z-10 flex min-h-[560px] items-center py-24 sm:min-h-[620px] sm:py-28 lg:min-h-[680px] lg:py-32 2xl:min-h-[760px]">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-facam-yellow" aria-hidden />
                <span>FACAM ACADEMIA · Plateforme e-learning industrielle</span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Le canal par lequel
                <br />
                <span className="text-facam-yellow">explose votre talent !</span>
              </h1>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
                FACAM ACADEMIA est une plateforme d’apprentissage en ligne conçue pour permettre aux
                jeunes diplômés de développer des compétences clés dans l’industrie de l’hygiène et
                de l’emballage.
              </p>
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
                Développez des compétences directement opérationnelles sur le marché
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                Passez de la théorie à la pratique grâce à des modules courts, des cas concrets et
                des évaluations régulières pour valider vos acquis.
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
                  </div>
                </div>
              </motion.div>
            </Reveal>
          ))}
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

      {/* Footer accueil — style simple type daisyUI, adapte charte FACAM STAIRWAY */}
      <footer id="footer" className="bg-facam-blue text-facam-white">
        <div className="container-custom py-10">
          <div className="flex flex-col items-center text-center">
            <aside className="flex flex-col items-center">
              <Image
                src="/Facam%20Academia-03%202.png"
                alt={APP_NAME}
                width={170}
                height={48}
                className="h-10 w-auto object-contain"
                priority
              />
              <p className="mt-4 text-base font-bold text-facam-white">
                FACAM ACADEMIA
                <br />
                Le canal par lequel explose votre talent !
              </p>
              <p className="mt-2 text-sm text-facam-white/80">
                Copyright © {new Date().getFullYear()} - Tous droits reserves
              </p>
            </aside>
          </div>
        </div>
      </footer>
    </div>
  );
}
