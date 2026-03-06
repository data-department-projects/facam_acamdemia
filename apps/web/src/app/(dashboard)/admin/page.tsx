/**
 * Dashboard administrateur général : suivi global, modules, utilisateurs.
 */

import { Users, BookOpen, Award, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MOCK_USERS, MOCK_MODULES } from '@/data/mock';

export default function AdminDashboardPage() {
  const totalUsers = MOCK_USERS.length;
  const totalModules = MOCK_MODULES.length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard administrateur</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Utilisateurs</CardTitle>
            <Users className="size-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{totalUsers}</p>
            <p className="text-xs text-slate-500">Comptes actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Modules</CardTitle>
            <BookOpen className="size-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{totalModules}</p>
            <p className="text-xs text-slate-500">Formations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Certificats délivrés
            </CardTitle>
            <Award className="size-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-blue">—</p>
            <p className="text-xs text-slate-500">(backend)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Activité</CardTitle>
            <Activity className="size-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">—</p>
            <p className="text-xs text-slate-500">(logs backend)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <a
            href="/admin/users"
            className="rounded-lg border border-gray-200 p-4 hover:bg-facam-blue-tint"
          >
            Gestion des utilisateurs
          </a>
          <span className="rounded-lg border border-gray-200 p-4 text-gray-400">
            Validation des comptes (backend)
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
