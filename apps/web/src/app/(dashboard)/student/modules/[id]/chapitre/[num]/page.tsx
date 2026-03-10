/**
 * Page chapitre — Délègue au client qui charge les données via GET /formations/:id.
 */

import { ChapterPageClient } from './ChapterPageClient';

interface PageProps {
  params: Promise<{ id: string; num: string }>;
}

export default async function ChapterPage({ params }: PageProps) {
  const { id: moduleId, num } = await params;
  const order = Number.parseInt(num, 10) || 1;
  return <ChapterPageClient moduleId={moduleId} chapterOrder={order} />;
}
