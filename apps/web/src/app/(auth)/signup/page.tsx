/**
 * Page d'inscription — Intégrée dans le nouveau layout split.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { UserRole } from '@/types';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Simulation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push('/login');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-facam-dark">Créer un compte</h2>
        <p className="mt-2 text-gray-600">Rejoignez FACAM ACADEMIA et boostez votre carrière.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Nom complet"
          type="text"
          placeholder="Jean Dupont"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="h-12"
        />
        <Input
          label="Email"
          type="email"
          placeholder="jean@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-12"
        />
        <Input
          label="Mot de passe"
          type="password"
          placeholder="Minimum 6 caractères"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="h-12"
        />

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-facam-dark">Je suis</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`p-3 rounded-lg border-2 text-sm font-bold transition-all ${
                role === 'student'
                  ? 'border-facam-blue bg-facam-blue-tint text-facam-blue'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              Étudiant
            </button>
            <button
              type="button"
              onClick={() => setRole('module_manager')}
              className={`p-3 rounded-lg border-2 text-sm font-bold transition-all ${
                role === 'module_manager'
                  ? 'border-facam-blue bg-facam-blue-tint text-facam-blue'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              Formateur
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full h-12 text-lg" variant="accent" disabled={loading}>
          {loading ? 'Création...' : "S'inscrire gratuitement"}
        </Button>
      </form>

      <div className="text-center text-sm text-gray-600">
        En vous inscrivant, vous acceptez nos{' '}
        <Link href="#" className="underline">
          Conditions d'utilisation
        </Link>
        .
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Déjà inscrit ?</span>
        </div>
      </div>

      <div className="text-center">
        <Link href="/login">
          <Button variant="outline" className="w-full h-12">
            Se connecter
          </Button>
        </Link>
      </div>
    </div>
  );
}
