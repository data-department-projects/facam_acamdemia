/**
 * FacamStairwayVideosSection — Section vidéos “FACAM STAIRWAY” pour l’accueil étudiant/employé.
 *
 * Rôle:
 * - Mettre en avant 3 vidéos YouTube (cartes cliquables, style carousel)
 * - Ouvrir une modal de lecture sans quitter la page
 *
 * À connaître:
 * - Embeds YouTube via iframe (avec autoplay au clic)
 * - Miniatures via `https://i.ytimg.com/vi/<id>/hqdefault.jpg`
 * - Accessibilité: boutons, titres, fermeture modal (ESC + overlay)
 */

'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Play, X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type VideoItem = {
  title: string;
  url: string;
};

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    // youtu.be/<id>
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '').trim();
      return id || null;
    }
    // youtube.com/watch?v=<id>
    const v = u.searchParams.get('v');
    if (v) return v;
    // youtube.com/embed/<id>
    const parts = u.pathname.split('/').filter(Boolean);
    const embedIdx = parts.indexOf('embed');
    if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1] ?? null;
    return null;
  } catch {
    return null;
  }
}

function toEmbedUrl(videoUrl: string, autoplay: boolean) {
  const id = getYouTubeId(videoUrl);
  if (!id) return null;
  const qs = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    autoplay: autoplay ? '1' : '0',
  });
  return `https://www.youtube.com/embed/${id}?${qs.toString()}`;
}

export function FacamStairwayVideosSection(
  props: Readonly<{
    className?: string;
  }>
) {
  const { className } = props;
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<VideoItem | null>(null);

  const videos = useMemo<VideoItem[]>(
    () => [
      {
        url: 'https://youtu.be/9Ec1v2NyKno?si=YFE1rst9hf_LRWII',
        title: "Vers l'excellence industrielle",
      },
      {
        url: 'https://youtu.be/Qgy0hWXX6Lg?si=0wkl3SPPEjSRWwPh',
        title: 'Au cœur de notre outil industriel',
      },
      {
        url: 'https://youtu.be/gDXRzznj0SA?si=OsPMkMjyZziKg2zN',
        title: 'Histoire de FACAM',
      },
    ],
    []
  );

  const cards = videos.map((v) => {
    const id = getYouTubeId(v.url);
    return {
      ...v,
      thumb: id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '/placeholder-course.jpg',
    };
  });

  const embedUrl = active ? toEmbedUrl(active.url, open) : null;

  return (
    <section className={cn('py-8', className)} aria-label="FACAM STAIRWAY vidéos">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-facam-blue">
            FACAM STAIRWAY
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-facam-dark font-montserrat">
            Découvrez nos vidéos
          </h2>
        </div>
      </div>

      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {cards.map((v) => (
            <button
              key={v.url}
              type="button"
              onClick={() => {
                setActive({ title: v.title, url: v.url });
                setOpen(true);
              }}
              className="snap-start group min-w-[260px] sm:min-w-[320px] md:min-w-[360px] rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden text-left"
              aria-label={`Lire la vidéo: ${v.title}`}
            >
              <div className="relative h-40 w-full bg-gray-100">
                <Image
                  src={v.thumb}
                  alt={v.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 320px, 360px"
                />
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute left-3 top-3 grid size-10 place-items-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5">
                  <Play className="size-5 text-facam-dark" aria-hidden />
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-extrabold text-facam-dark line-clamp-2">{v.title}</p>
                <p className="mt-1 text-xs text-gray-500">Vidéo YouTube • Cliquez pour regarder</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open && active && (
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Lecture vidéo: ${active.title}`}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <motion.div
              initial={reduce ? false : { y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { y: 12, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
                <p className="text-sm font-bold text-facam-dark line-clamp-1">{active.title}</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex size-9 items-center justify-center rounded-full hover:bg-gray-100"
                  aria-label="Fermer"
                >
                  <X className="size-4 text-gray-700" />
                </button>
              </div>

              <div className="relative aspect-video w-full bg-black">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={active.title}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
                    Vidéo indisponible
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
