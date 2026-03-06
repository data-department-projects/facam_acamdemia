/**
 * Page "Mot de passe oublié" : formulaire email pour recevoir l'OTP par email (Resend).
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? 'Une erreur est survenue.');
        return;
      }
      setSent(true);
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
          <p className="text-green-800 font-medium">
            Si un compte existe pour cet email, vous recevrez un code à 6 chiffres dans les
            prochaines minutes.
          </p>
          <p className="text-green-700 text-sm mt-2">Le code expire dans 3 minutes.</p>
        </div>
        <Link
          href={`/forgot-password/verify?email=${encodeURIComponent(email.trim())}`}
          className="block"
        >
          <Button variant="primary" className="w-full h-12">
            Saisir le code reçu
          </Button>
        </Link>
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-facam-dark">Mot de passe oublié</h2>
        <p className="mt-2 text-gray-600">
          Saisissez votre email pour recevoir un code de réinitialisation (valable 3 minutes).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-12"
        />
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
        <Button type="submit" className="w-full h-12" variant="primary" disabled={loading}>
          {loading ? 'Envoi en cours...' : 'Envoyer le code'}
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
