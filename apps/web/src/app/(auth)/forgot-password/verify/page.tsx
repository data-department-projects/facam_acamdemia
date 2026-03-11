/**
 * Page de saisie de l'OTP reçu par email (lien depuis l'email ou après envoi).
 */

'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import { API_BASE } from '@/lib/api-client';

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') ?? '';
  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValid(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? 'Erreur lors de la vérification.');
        return;
      }
      setValid(data.valid === true);
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  if (valid === true) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
          <p className="text-green-800 font-medium">
            Code valide. Définissez votre nouveau mot de passe.
          </p>
        </div>
        <Link
          href={`/forgot-password/reset?email=${encodeURIComponent(email.trim())}&code=${encodeURIComponent(code.trim())}`}
          className="block"
        >
          <Button variant="primary" className="w-full h-12">
            Changer le mot de passe
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
        <h2 className="text-2xl font-bold text-facam-dark">Code reçu par email</h2>
        <p className="mt-2 text-gray-600">
          Entrez le code à 6 chiffres envoyé à votre adresse (valable 3 minutes).
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
          className="h-12"
        />
        <Input
          label="Code à 6 chiffres"
          type="text"
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          required
          className="h-12 text-center text-xl tracking-[0.5em] font-mono"
        />
        {valid === false && (
          <p className="text-sm text-red-600 font-medium">
            Code invalide ou expiré. Demandez un nouveau code.
          </p>
        )}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
        <Button type="submit" className="w-full h-12" variant="primary" disabled={loading}>
          {loading ? 'Vérification...' : 'Vérifier le code'}
        </Button>
      </form>

      <Link
        href="/forgot-password"
        className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:underline"
      >
        <ArrowLeft className="size-4" />
        Nouveau code
      </Link>
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-facam-blue hover:underline"
      >
        Retour à la connexion
      </Link>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-lg" />}>
      <VerifyOtpContent />
    </Suspense>
  );
}
