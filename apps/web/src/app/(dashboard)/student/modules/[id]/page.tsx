/**
 * Page de détails d'un cours — Données depuis l’API (GET /formations/:id avec chapitres).
 * Délègue au client pour le chargement et l’affichage.
 */

import { StudentModuleDetailClient } from './StudentModuleDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentModuleDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <StudentModuleDetailClient moduleId={id} />;
}
