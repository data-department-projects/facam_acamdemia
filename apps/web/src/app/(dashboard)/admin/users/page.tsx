/**
 * Gestion des utilisateurs — Liste des comptes et création (étudiant, responsable de module).
 * Branché sur l'API : GET /users, POST /users, GET /formations pour les modules.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api-client';

const ROLE_LABELS: Record<string, string> = {
  student: 'Étudiant',
  module_manager: 'Responsable module',
  admin: 'Administrateur',
  platform_manager: 'Responsable plateforme',
  support: 'Support technique',
};

type CreateRole = 'student' | 'module_manager';

interface ModuleItem {
  id: string;
  title: string;
}

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export default function AdminUsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [role, setRole] = useState<CreateRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [message, setMessage] = useState<'success' | 'error' | null>(null);
  const [messageText, setMessageText] = useState('');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoadError(null);
      const res = await api.get<{ data: UserItem[] }>('/users?limit=100');
      setUsers(Array.isArray(res.data) ? res.data : ((res as { data?: UserItem[] }).data ?? []));
    } catch (e) {
      setUsers([]);
      setLoadError(
        e instanceof Error ? e.message : 'Impossible de charger la liste des utilisateurs.'
      );
    } finally {
      setLoadingList(false);
    }
  };

  const loadModules = useCallback(async () => {
    try {
      const res = await api.get<{ data: ModuleItem[] }>('/formations?limit=100');
      setModules(
        Array.isArray(res.data) ? res.data : ((res as { data?: ModuleItem[] }).data ?? [])
      );
    } catch (e) {
      setModules([]);
      if (showForm)
        setLoadError(e instanceof Error ? e.message : 'Impossible de charger les modules.');
    }
  }, [showForm]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (showForm) loadModules();
  }, [showForm, loadModules]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const payload: Record<string, string> = {
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        password,
        role,
      };
      if (role === 'module_manager' && moduleId) payload.moduleId = moduleId;
      await api.post('/users', payload);
      setMessage('success');
      setMessageText('Compte créé avec succès.');
      setFullName('');
      setEmail('');
      setPassword('');
      setModuleId('');
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setMessage('error');
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création du compte.';
      setMessageText(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-facam-dark">Gestion des utilisateurs</h1>
        <Button variant="accent" onClick={() => setShowForm(true)}>
          Nouvel utilisateur
        </Button>
      </div>

      {message === 'success' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 text-sm">
          {messageText}
        </div>
      )}
      {message === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          {messageText}
        </div>
      )}
      {loadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
          {loadError}
        </div>
      )}

      {showForm && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Créer un compte</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Fermer
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label
                  htmlFor="create-role"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Rôle
                </label>
                <select
                  id="create-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as CreateRole)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="student">Étudiant</option>
                  <option value="module_manager">Responsable de module</option>
                </select>
              </div>
              <Input
                label="Nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Dupont"
                required
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean.dupont@facam.com"
                required
              />
              <Input
                label="Mot de passe (initial)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
              {role === 'module_manager' && (
                <div>
                  <label
                    htmlFor="create-module"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Module assigné
                  </label>
                  <select
                    id="create-module"
                    value={moduleId}
                    onChange={(e) => setModuleId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    required={role === 'module_manager'}
                  >
                    <option value="">— Sélectionner un module —</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                  {modules.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      Aucun module pour l’instant. Créez-en un depuis la section Formations /
                      Modules.
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" variant="accent" disabled={loading}>
                  {loading ? 'Création...' : 'Créer le compte'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Comptes</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 font-medium text-gray-700">Nom</th>
                    <th className="pb-3 font-medium text-gray-700">Email</th>
                    <th className="pb-3 font-medium text-gray-700">Rôle</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-gray-500">
                        Aucun utilisateur. Créez un compte avec le bouton « Nouvel utilisateur ».
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-100">
                        <td className="py-3 font-medium text-facam-dark">{u.fullName}</td>
                        <td className="py-3 text-gray-600">{u.email}</td>
                        <td className="py-3">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                            {ROLE_LABELS[u.role] ?? u.role}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
