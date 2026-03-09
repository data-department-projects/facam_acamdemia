/**
 * Page d'inscription — Désactivée : les comptes sont créés par l'administrateur.
 * Affiche un message explicatif et redirige vers la connexion.
 */

'use client';

import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-facam-blue-tint">
          <UserPlus className="size-8 text-facam-blue" />
        </div>
        <h2 className="text-2xl font-bold text-facam-dark">Inscription désactivée</h2>
        <p className="mt-2 text-gray-600">
          Les comptes étudiants et responsables sont créés par l&apos;administrateur de la
          plateforme. Contactez votre administrateur pour obtenir un accès.
        </p>
      </div>

      <div className="rounded-lg border border-facam-blue/20 bg-facam-blue-tint/30 p-4 text-sm text-facam-dark">
        <p className="font-medium">Vous avez déjà un compte ?</p>
        <p className="mt-1 text-gray-600">
          Connectez-vous avec l&apos;email et le mot de passe fournis par votre administrateur.
        </p>
      </div>

      <Link href="/login" className="block">
        <Button variant="accent" className="w-full h-12 text-base">
          Se connecter
        </Button>
      </Link>
    </div>
  );
}
