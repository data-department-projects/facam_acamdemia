/**
 * `Reveal` — Wrapper d'animation "on-scroll" pour les sections marketing.
 * Objectif : standardiser des apparitions fluides (fade/slide) et garder le code lisible.
 */

'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';

export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}>) {
  const reduce = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : y, filter: reduce ? 'none' : 'blur(6px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: reduce ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      {children}
    </motion.div>
  );
}
