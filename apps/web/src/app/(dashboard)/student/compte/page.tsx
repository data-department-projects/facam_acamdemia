/**
 * Page Compte — Espace étudiant.
 * Réutilise le composant partagé CompteContent pour profil et changement de mot de passe.
 */

'use client';

import { CompteContent } from '@/components/account/CompteContent';

export default function StudentComptePage() {
  return <CompteContent backHref="/student" homeHref="/student" roleLabel="Étudiant" />;
}
