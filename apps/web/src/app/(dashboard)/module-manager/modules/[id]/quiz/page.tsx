/**
 * Quiz du module — Gestion des quiz contextualisée : Module X, quiz par chapitre + quiz final.
 * Le responsable voit clairement à quel chapitre ou au quiz final chaque quiz est rattaché.
 */

import { ModuleQuizClient } from './ModuleQuizClient';

export default async function ModuleQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModuleQuizClient moduleId={id} />;
}
