/**
 * `RichTextContent` — Rendu sécurisé de contenu riche (HTML) venant de la base.
 *
 * Rôle dans l'app:
 * - Les champs marketing/formation (ex: prérequis, objectifs) peuvent contenir du texte formaté
 *   (gras, listes, liens) et de petites illustrations (images).
 * - Ce composant applique une sanitization côté client avant d'injecter le HTML (anti-XSS).
 *
 * Bases importantes:
 * - **Sanitization**: ne jamais afficher du HTML venant d'une source non fiable sans filtrage.
 * - **Compatibilité**: si le contenu est un texte brut historique, on le rend tel quel.
 */
'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function RichTextContent({
  content,
  className,
}: Readonly<{
  content: string | null | undefined;
  className?: string;
}>) {
  const raw = content ?? '';
  const isHtml = looksLikeHtml(raw);

  const sanitized = useMemo(() => {
    if (!isHtml) return '';
    return DOMPurify.sanitize(raw, {
      USE_PROFILES: { html: true },
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });
  }, [isHtml, raw]);

  if (!raw.trim()) return null;

  if (!isHtml) {
    return <div className={cn('whitespace-pre-line leading-relaxed', className)}>{raw}</div>;
  }

  return (
    <div
      className={cn(
        'prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-a:text-facam-blue',
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
