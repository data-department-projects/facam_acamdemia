/**
 * Page de connexion — Formulaire e-mail / mot de passe.
 * Comptes créés par l'administration (pas d'inscription publique).
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { UserRole } from '@/types';

const DEMO_ACCOUNTS: Record<string, { password: string; role: UserRole; fullName: string }> = {
  'etudiant@facam.com': { password: 'demo123', role: 'student', fullName: 'Étudiant Demo' },
  'responsable@facam.com': {
    password: 'demo123',
    role: 'module_manager',
    fullName: 'Responsable Demo',
  },
  'admin@facam.com': { password: 'demo123', role: 'admin', fullName: 'Admin Demo' },
  'support@facam.com': { password: 'demo123', role: 'support', fullName: 'Support Demo' },
};

const ROLE_HOME: Record<UserRole, string> = {
  student: '/student',
  module_manager: '/module-manager',
  admin: '/admin',
  support: '/support',
  platform_manager: '/admin',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const account = DEMO_ACCOUNTS[email.trim().toLowerCase()];
    if (!account || account.password !== password) {
      setError('Identifiants incorrects. Essayez un compte démo.');
      setLoading(false);
      return;
    }

    if (typeof window !== 'undefined') {
      const storageKey = 'facam_user';
      const existing = window.localStorage.getItem(storageKey);
      let firstLoginAt: string | undefined;
      try {
        const parsed = existing ? JSON.parse(existing) : {};
        const sameUser = parsed.email === email.trim().toLowerCase();
        if (account.role === 'student') {
          firstLoginAt =
            sameUser && parsed.firstLoginAt ? parsed.firstLoginAt : new Date().toISOString();
        } else {
          firstLoginAt = undefined;
        }
      } catch {
        firstLoginAt = account.role === 'student' ? new Date().toISOString() : undefined;
      }
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          email: email.trim(),
          role: account.role,
          fullName: account.fullName,
          firstLoginAt,
        })
      );
    }
    router.push(ROLE_HOME[account.role]);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-facam-dark">Bon retour !</h2>
        <p className="mt-2 text-gray-600">Connectez-vous pour continuer votre apprentissage.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email professionnel"
          type="email"
          placeholder="ex: jean.dupont@entreprise.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-12"
        />
        <div className="space-y-1">
          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="h-12"
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-facam-blue hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full h-12 text-lg" variant="primary" disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-facam-blue-tint/50 rounded-lg text-xs text-gray-500 text-center border border-facam-blue/10">
        <p className="font-semibold mb-1">Comptes Démo :</p>
        etudiant@facam.com / responsable@facam.com
        <br />
        Mot de passe : demo123
      </div>
    </div>
  );
}
