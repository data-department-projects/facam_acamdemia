/**
 * Page de définition du nouveau mot de passe (après OTP vérifié).
 */

'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import { API_BASE } from '@/lib/api-client';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const code = searchParams.get('code') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? 'Une erreur est survenue.');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
          <p className="text-green-800 font-medium">
            Mot de passe mis à jour. Redirection vers la connexion...
          </p>
        </div>
        <Link href="/login">
          <Button variant="primary" className="w-full h-12">
            Se connecter
          </Button>
        </Link>
      </div>
    );
  }

  if (!email || !code) {
    return (
      <div className="space-y-6">
        <p className="text-red-600">Lien invalide ou expiré. Recommencez la procédure.</p>
        <Link href="/forgot-password">
          <Button variant="outline" className="w-full">
            Mot de passe oublié
          </Button>
        </Link>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-facam-blue hover:underline"
        >
          <ArrowLeft className="size-4" />
          Connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-facam-dark">Nouveau mot de passe</h2>
        <p className="mt-2 text-gray-600">Choisissez un mot de passe d’au moins 6 caractères.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Nouveau mot de passe"
          type="password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          className="h-12"
        />
        <Input
          label="Confirmer le mot de passe"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          className="h-12"
        />
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
        <Button type="submit" className="w-full h-12" variant="primary" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
        </Button>
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-facam-blue hover:underline"
      >
        <ArrowLeft className="size-4" />
        Retour à la connexion
      </Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-lg" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
