/**
 * Contenu commun de la page "Mon compte" : profil (photo, nom, email, rôle, première connexion),
 * téléversement d’avatar (Supabase via API) et formulaire de changement de mot de passe.
 * Utilisé par les espaces étudiant, responsable de module et administrateur pour éviter la duplication.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Shield, Calendar, ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { API_BASE, getAccessToken } from '@/lib/api-client';
import type { StoredUser } from '@/lib/auth';
import { signOutFullClient } from '@/lib/auth';
import { UserAvatar } from '@/components/account/UserAvatar';
import { AvatarUploader } from '@/components/account/AvatarUploader';

export interface CompteContentProps {
  /** Lien de retour (ex: /student, /admin, /module-manager) */
  backHref: string;
  /** Lien "Retour au tableau de bord" (souvent identique à backHref) */
  homeHref: string;
  /** Libellé du rôle affiché (ex: "Étudiant", "Administrateur", "Responsable de module") */
  roleLabel: string;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function CompteContent({ backHref, homeHref, roleLabel }: CompteContentProps) {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [hasApiToken, setHasApiToken] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    setHasApiToken(!!getAccessToken());
  }, [mounted]);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    const raw = window.localStorage.getItem('facam_user');
    if (!raw) return;
    try {
      const u = JSON.parse(raw) as StoredUser;
      setUser(u);
    } catch {
      // ignore
    }
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-facam-blue border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-gray-600">Aucune information de compte disponible.</p>
        <Link href={backHref} className="mt-4 inline-block">
          <Button variant="outline">Retour</Button>
        </Link>
      </div>
    );
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (newPassword !== confirmPassword) {
      setPwdError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setPwdLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          currentPassword,
          newPassword,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setPwdError(data.message ?? 'Une erreur est survenue.');
        return;
      }
      setPwdSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPwdError("Impossible de contacter le serveur. Vérifiez que l'API est démarrée.");
    } finally {
      setPwdLoading(false);
    }
  };

  const canShowLogout = user.role === 'student' || user.role === 'employee';
  const handleLogout = async () => {
    await signOutFullClient();
    router.replace('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-facam-blue mb-8 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Retour au tableau de bord
        </Link>

        <div className="max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold text-facam-dark mb-2">Mon compte</h1>
          <p className="text-gray-600 mb-8">Consultez et gérez vos informations personnelles.</p>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex items-start gap-4">
                <UserAvatar fullName={user.fullName} avatarUrl={user.avatarUrl} size="md" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Nom complet</p>
                  <p className="text-lg font-bold text-facam-dark">{user.fullName}</p>
                </div>
              </div>

              {user && hasApiToken && (
                <div className="border-t border-gray-100 pt-6">
                  <AvatarUploader user={user} onUserUpdate={(u) => setUser(u)} />
                </div>
              )}
              {user && !hasApiToken && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Connectez-vous via l’API pour modifier votre photo de profil (session sans jeton).
                </p>
              )}

              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-facam-blue-tint flex items-center justify-center text-facam-blue">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Adresse e-mail</p>
                    <p className="text-facam-dark font-medium">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-facam-blue-tint flex items-center justify-center text-facam-blue">
                    <Shield className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Rôle</p>
                    <p className="text-facam-dark font-medium">{roleLabel}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-facam-blue-tint flex items-center justify-center text-facam-blue">
                    <Calendar className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Première connexion</p>
                    <p className="text-facam-dark font-medium">{formatDate(user.firstLoginAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Changement de mot de passe */}
          <div className="mt-10 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-facam-blue-tint flex items-center justify-center text-facam-blue">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-facam-dark">Changer le mot de passe</h2>
                  <p className="text-sm text-gray-500">
                    Saisissez votre mot de passe actuel et le nouveau.
                  </p>
                </div>
              </div>

              {pwdSuccess && (
                <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
                  Mot de passe mis à jour avec succès.
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <Input
                  label="Mot de passe actuel"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <Input
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                {pwdError && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                    {pwdError}
                  </div>
                )}
                <Button type="submit" variant="primary" disabled={pwdLoading}>
                  {pwdLoading ? 'Enregistrement...' : 'Mettre à jour le mot de passe'}
                </Button>
              </form>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={homeHref}>
              <Button variant="primary">Retour au tableau de bord</Button>
            </Link>
            {canShowLogout ? (
              <Button variant="outline" onClick={() => void handleLogout()}>
                Déconnexion
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="outline">Changer de compte</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
