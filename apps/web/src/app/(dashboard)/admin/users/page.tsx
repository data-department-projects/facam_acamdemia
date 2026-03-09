/**
 * Gestion des utilisateurs — Liste des comptes et création (étudiant, responsable de module).
 * L'administrateur peut créer des comptes étudiants et responsables (avec module assigné).
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MOCK_USERS, MOCK_MODULES } from '@/data/mock';

const ROLE_LABELS: Record<string, string> = {
  student: 'Étudiant',
  module_manager: 'Responsable module',
  admin: 'Administrateur',
  platform_manager: 'Responsable plateforme',
  support: 'Support technique',
};

type CreateRole = 'student' | 'module_manager';

export default function AdminUsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [role, setRole] = useState<CreateRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [message, setMessage] = useState<'success' | 'error' | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    // TODO: appeler api.post('/users', { email, fullName, password, role, moduleId: role === 'module_manager' ? moduleId : undefined })
    // Pour l'instant on simule un succès
    await new Promise((r) => setTimeout(r, 500));
    setMessage('success');
    setFullName('');
    setEmail('');
    setPassword('');
    setModuleId('');
    setShowForm(false);
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
          Compte créé avec succès. (À brancher sur l&apos;API POST /users.)
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
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
                required
              />
              {role === 'module_manager' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Module assigné
                  </label>
                  <select
                    value={moduleId}
                    onChange={(e) => setModuleId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">— Sélectionner un module —</option>
                    {MOCK_MODULES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" variant="accent">
                  Créer le compte
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 font-medium text-gray-700">Nom</th>
                  <th className="pb-3 font-medium text-gray-700">Email</th>
                  <th className="pb-3 font-medium text-gray-700">Rôle</th>
                  <th className="pb-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_USERS.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100">
                    <td className="py-3 font-medium text-facam-dark">{u.fullName}</td>
                    <td className="py-3 text-gray-600">{u.email}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <Button variant="ghost" size="sm">
                        Modifier
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Création et modification des comptes à connecter à l&apos;API POST /users.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
