/**
 * Gestion des comptes utilisateurs : liste, création, modification, rôles.
 * Validation des comptes étudiants / responsables (mock).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MOCK_USERS } from '@/data/mock';

const ROLE_LABELS: Record<string, string> = {
  student: 'Étudiant',
  module_manager: 'Responsable module',
  admin: 'Administrateur',
  platform_manager: 'Responsable plateforme',
  support: 'Support technique',
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Gestion des utilisateurs</h1>
        <Button>Nouvel utilisateur</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comptes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 font-medium text-slate-700">Nom</th>
                  <th className="pb-3 font-medium text-slate-700">Email</th>
                  <th className="pb-3 font-medium text-slate-700">Rôle</th>
                  <th className="pb-3 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_USERS.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100">
                    <td className="py-3 font-medium text-slate-900">{u.fullName}</td>
                    <td className="py-3 text-slate-600">{u.email}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
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
          <p className="mt-4 text-sm text-slate-500">
            Création, modification et validation des comptes à connecter à l’API backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
