/**
 * `ScrollProgress` — Barre de progression discrète en haut de page.
 * Améliore le "feel" premium (comme beaucoup de landing pages SaaS) sans surcharger l'UI.
 */

'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.25 });

  return (
    <motion.div
      aria-hidden
      className="fixed left-0 right-0 top-0 z-50 h-1 origin-left bg-facam-yellow/90"
      style={{ scaleX }}
    />
  );
}
