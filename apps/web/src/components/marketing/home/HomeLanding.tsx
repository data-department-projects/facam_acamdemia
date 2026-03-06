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
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { APP_NAME } from '@facam-academia/shared';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Hero3D } from '@/components/ui/Hero3D';
import { Reveal } from '@/components/marketing/home/Reveal';
import { ScrollProgress } from '@/components/marketing/home/ScrollProgress';

const HERO_IMAGE = '/image%20hero.jpg';

const TRUST_CHIPS = [
  { label: 'Certifications', icon: Award },
  { label: 'Formateurs experts', icon: GraduationCap },
  { label: 'Parcours guidés', icon: Sparkles },
  { label: 'Accès flexible', icon: Clock },
];

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

const STATS = [
  { value: '2 500+', label: 'Apprenants', icon: Users },
  { value: '50+', label: 'Formations', icon: BookOpen },
  { value: '98%', label: 'Taux de réussite', icon: Award },
  { value: '30 j', label: 'Accès flexible', icon: Clock },
];

const FEATURED_PROGRAMS = [
  {
    title: 'Maintenance industrielle',
    description: 'Préventive, corrective, diagnostic et méthodes.',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=900&h=650&fit=crop',
    meta: { hours: 12, rating: 4.8, learners: '2,5k' },
  },
  {
    title: 'Production & Logistique',
    description: 'Lean, 5S, gestion des flux et pilotage des stocks.',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&h=650&fit=crop',
    meta: { hours: 10, rating: 4.6, learners: '1,8k' },
  },
  {
    title: 'QHSE - Qualité Sécurité',
    description: 'ISO, risques, audits et culture sécurité.',
    image: 'https://images.unsplash.com/photo-1569931721096-b8c4d011d2b8?w=900&h=650&fit=crop',
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

function RatingBadge() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white">
        <span className="font-bold">4.8</span>
        <span
          className="flex items-center gap-0.5 text-facam-yellow"
          aria-label="Note moyenne 4.8 sur 5"
        >
          {STAR_VALUES.map((v) => (
            <Star key={v} className="size-4 fill-current" aria-hidden />
          ))}
        </span>
        <span className="text-white/70 text-sm">Évaluation apprenants</span>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white">
        <ShieldCheck className="size-4 text-facam-yellow" aria-hidden />
        <span className="font-bold">A+</span>
        <span className="text-white/70 text-sm">Qualité plateforme</span>
      </div>
    </div>
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
    <div className="min-h-screen bg-white font-montserrat">
      <ScrollProgress />
      <Header user={null} />

      {/* HERO — inspiré SaaS premium: texte + preuves sociales + visuel, fond animé */}
      <section className="relative overflow-hidden bg-facam-dark text-white">
        <div className="absolute inset-0 opacity-80">
          <Hero3D />
        </div>

        <div className="absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-facam-yellow/15 blur-3xl" />
          <div className="absolute -bottom-28 -left-24 h-[420px] w-[420px] rounded-full bg-facam-blue-mid/55 blur-3xl" />
        </div>

        <div className="container-custom relative z-10 grid min-h-[86vh] grid-cols-1 items-center gap-10 py-16 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-7">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90">
                <Sparkles className="size-4 text-facam-yellow" aria-hidden />
                <span>Plateforme e-learning industrielle — édition 2026</span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Formez-vous, validez, <span className="text-facam-yellow">certifiez-vous</span>.
                <br />
                Accélérez votre carrière avec {APP_NAME}.
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                Des parcours structurés, conçus avec des professionnels, pour maîtriser les
                compétences recherchées en industrie: maintenance, QHSE, production, automatisme et
                plus.
              </p>
            </Reveal>

            <Reveal delay={0.22}>
              <div className="mt-7">
                <RatingBadge />
              </div>
            </Reveal>

            <Reveal delay={0.28}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/signup" className="inline-flex">
                  <Button variant="accent" size="lg" className="px-7">
                    Commencer maintenant <ArrowRight />
                  </Button>
                </Link>
                <Link href="#programmes" className="inline-flex">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:border-white/50"
                  >
                    Voir les programmes
                  </Button>
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.34}>
              <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  'Accès 30 jours pour terminer votre formation',
                  'Quiz et ressources téléchargeables',
                  'Certificat en fin de parcours',
                  'Support et accompagnement',
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2 text-white/85">
                    <CheckCircle2 className="mt-0.5 size-5 text-facam-yellow" aria-hidden />
                    <span className="text-sm">{t}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-5">
            <Reveal delay={0.12} y={24}>
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-facam-yellow/30 to-facam-blue-mid/30 blur-2xl" />
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3 shadow-[0_25px_60px_-25px_rgba(0,0,0,0.6)]">
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-black/30">
                    <Image
                      src={HERO_IMAGE}
                      alt="FACAM ACADEMIA — apprentissage moderne"
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 1024px) 90vw, 560px"
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {TRUST_CHIPS.map((c) => {
                      const Icon = c.icon;
                      return (
                        <div
                          key={c.label}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center"
                        >
                          <Icon className="mx-auto size-4 text-facam-yellow" aria-hidden />
                          <p className="mt-1 text-xs font-semibold text-white/85">{c.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
              <Link href="/signup">
                <Button variant="primary">
                  Créer un compte <ArrowRight />
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

      {/* Stats — visuel premium */}
      <SectionShell className="bg-white py-16">
        <Reveal>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {STATS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm"
                >
                  <div className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl bg-facam-blue-tint text-facam-blue">
                    <Icon className="size-6" aria-hidden />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-facam-dark">{s.value}</p>
                  <p className="mt-1 text-sm font-medium text-gray-500">{s.label}</p>
                  {idx === 0 && (
                    <p className="mt-2 text-xs text-gray-400">
                      Données indicatives (évoluent avec la communauté)
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Reveal>
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
                  <Image
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

      {/* Témoignages — inspiré, mais adapté FACAM */}
      <section className="bg-facam-dark py-20 text-white">
        <div className="container-custom">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold">Ils progressent avec {APP_NAME}</h2>
              <p className="mt-3 text-white/75">
                Des retours concrets sur l’impact des parcours, la clarté et l’accompagnement.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, idx) => (
              <Reveal key={t.author} delay={0.08 * idx}>
                <div className="h-full rounded-3xl border border-white/10 bg-white/5 p-7">
                  <Quote className="size-10 text-facam-yellow/60" aria-hidden />
                  <p className="mt-4 text-white/90 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="relative size-11 overflow-hidden rounded-full bg-white/10">
                      <Image src={t.avatar} alt="" fill className="object-cover" sizes="44px" />
                    </div>
                    <div>
                      <p className="font-bold">{t.author}</p>
                      <p className="text-sm text-white/65">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

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
                  <Link href="/signup" className="inline-flex">
                    <Button variant="accent" size="lg" className="w-full">
                      Créer un compte <ArrowRight />
                    </Button>
                  </Link>
                  <Link href="/login" className="inline-flex">
                    <Button variant="outline" size="lg" className="w-full">
                      J’ai déjà un compte
                    </Button>
                  </Link>
                </div>
                <p className="mt-3 text-center text-xs text-gray-500">
                  Aucun paiement requis pour découvrir la plateforme.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </SectionShell>

      {/* Footer — épuré */}
      <footer className="bg-facam-dark text-white">
        <div className="container-custom py-14">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            <div>
              <p className="font-blacksword text-3xl text-facam-yellow">{APP_NAME}</p>
              <p className="mt-3 text-sm text-white/70">
                La plateforme premium de formation industrielle en ligne.
              </p>
            </div>
            <div>
              <p className="font-bold">Plateforme</p>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>
                  <Link href="#programmes" className="hover:text-white">
                    Programmes
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-white">
                    Inscription
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white">
                    Connexion
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-bold">Entreprise</p>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>
                  <Link href="/#footer" className="hover:text-white">
                    Former vos équipes
                  </Link>
                </li>
                <li>
                  <Link href="/#footer" className="hover:text-white">
                    Partenariats
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-white">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-bold">Légal</p>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>
                  <Link href="/#footer" className="hover:text-white">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/#footer" className="hover:text-white">
                    Conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} FACAM ACADEMIA. Tous droits réservés.
            </p>
            <p className="text-sm text-white/60">FR</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
