/**
 * Page Compte — Espace administrateur.
 * Affiche le profil (nom, email, rôle) et le formulaire de changement de mot de passe,
 * comme pour l’étudiant, afin que l’admin puisse gérer son mot de passe.
 */

'use client';

import { CompteContent } from '@/components/account/CompteContent';

export default function AdminComptePage() {
  return <CompteContent backHref="/admin" homeHref="/admin" roleLabel="Administrateur" />;
}
