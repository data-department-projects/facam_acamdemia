/**
 * Page de connexion — Appel API POST /auth/login puis fallback comptes démo si API indisponible.
 * Stocke le JWT et l'utilisateur (facam_token, facam_user) pour le reste de l'app.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { setAuthSession, ROLE_HOME } from '@/lib/auth';
import { api, setAccessToken } from '@/lib/api-client';
import type { UserRole } from '@/types';

// Fallback local si API indisponible — admin aligné sur le seed (Admin123!)
const DEMO_ACCOUNTS: Record<string, { password: string; role: UserRole; fullName: string }> = {
  'admin@facam.com': { password: 'Admin123!', role: 'admin', fullName: 'Administrateur FACAM' },
};

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    firstLoginAt: string | null;
  };
}

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

    const emailTrimmed = email.trim().toLowerCase();

    try {
      const res = await api.post<LoginResponse>('/auth/login', {
        email: emailTrimmed,
        password,
      });
      setAccessToken(res.accessToken);
      setAuthSession(
        {
          id: res.user.id,
          email: res.user.email,
          fullName: res.user.fullName,
          role: res.user.role as UserRole,
          firstLoginAt: res.user.firstLoginAt,
        },
        res.accessToken
      );
      router.push(ROLE_HOME[res.user.role as UserRole]);
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion';
      if (typeof (err as { status?: number }).status === 'number') {
        setError(message);
        setLoading(false);
        return;
      }
    }

    // Fallback : comptes démo (si API indisponible ou identifiants non reconnus)
    const account = DEMO_ACCOUNTS[emailTrimmed];
    if (!account || account.password !== password) {
      setError('Identifiants incorrects.');
      setLoading(false);
      return;
    }

    const existing =
      typeof window !== 'undefined' ? window.localStorage.getItem('facam_user') : null;
    let firstLoginAt: string | undefined;
    try {
      const parsed = existing ? JSON.parse(existing) : {};
      const sameUser = parsed.email === emailTrimmed;
      if (account.role === 'student') {
        firstLoginAt =
          sameUser && parsed.firstLoginAt ? parsed.firstLoginAt : new Date().toISOString();
      } else {
        firstLoginAt = undefined;
      }
    } catch {
      firstLoginAt = account.role === 'student' ? new Date().toISOString() : undefined;
    }
    setAuthSession({
      email: emailTrimmed,
      role: account.role,
      fullName: account.fullName,
      firstLoginAt,
    });
    router.push(ROLE_HOME[account.role]);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-facam-dark">Bon retour !</h2>
        <p className="mt-2 text-gray-600">Connectez-vous pour continuer votre apprentissage.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
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

        <Button type="submit" className="w-full h-12 text-lg" variant="accent" disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-facam-blue-tint/50 rounded-lg text-xs text-gray-500 text-center border border-facam-blue/10">
        <p className="font-semibold mb-1">Compte admin (créé par le seed) :</p>
        admin@facam.com — Mot de passe : Admin123!
      </div>
    </div>
  );
}
