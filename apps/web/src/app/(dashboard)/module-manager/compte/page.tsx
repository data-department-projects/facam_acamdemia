/**
 * Page Compte — Espace responsable de module.
 * Affiche le profil et le formulaire de changement de mot de passe,
 * comme pour l’étudiant, afin que le responsable puisse gérer son mot de passe.
 */

'use client';

import { CompteContent } from '@/components/account/CompteContent';

export default function ModuleManagerComptePage() {
  return (
    <CompteContent
      backHref="/module-manager"
      homeHref="/module-manager"
      roleLabel="Responsable de module"
    />
  );
}
