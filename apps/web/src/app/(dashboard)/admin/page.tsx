/**
 * Dashboard administrateur — Vue globale : nombre d'étudiants, modules, taux de complétion,
 * activité récente. Design avec cartes et couleur d'accent jaune pour les CTA.
 */

import { Users, BookOpen, Award, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MOCK_USERS, MOCK_MODULES } from '@/data/mock';

/** Données mock pour l'activité récente */
const MOCK_ACTIVITY = [
  {
    id: '1',
    type: 'enrollment',
    text: "Marie Dupont s'est inscrite au module QHSE",
    time: 'Il y a 2 h',
  },
  {
    id: '2',
    type: 'completion',
    text: 'Jean Martin a terminé le module Maintenance',
    time: 'Il y a 5 h',
  },
  {
    id: '3',
    type: 'certificate',
    text: 'Certificat délivré à Sophie Bernard (Production)',
    time: 'Hier',
  },
  { id: '4', type: 'login', text: 'Connexion admin depuis un nouvel appareil', time: 'Hier' },
];

export default function AdminDashboardPage() {
  const totalStudents = MOCK_USERS.filter((u) => u.role === 'student').length;
  const totalModules = MOCK_MODULES.length;
  const totalCompletions = 28; // mock
  const globalCompletionRate =
    totalStudents > 0 ? Math.round((totalCompletions / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-facam-dark">Dashboard administrateur</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Utilisateurs</CardTitle>
            <Users className="size-4 text-facam-blue" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-dark">{MOCK_USERS.length}</p>
            <p className="text-xs text-gray-500">Comptes actifs</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Étudiants</CardTitle>
            <Users className="size-4 text-facam-blue" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-dark">{totalStudents}</p>
            <p className="text-xs text-gray-500">Inscrits</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Modules</CardTitle>
            <BookOpen className="size-4 text-facam-blue" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-dark">{totalModules}</p>
            <p className="text-xs text-gray-500">Formations</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taux de complétion</CardTitle>
            <Award className="size-4 text-facam-yellow" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-yellow">{globalCompletionRate} %</p>
            <p className="text-xs text-gray-500">Global</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-5" />
            Activité récente
          </CardTitle>
          <Link href="/admin/users">
            <Button variant="ghost" size="sm">
              Voir tout
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-gray-100">
            {MOCK_ACTIVITY.map((a) => (
              <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-medium text-facam-dark">{a.text}</p>
                <p className="text-xs text-gray-500">{a.time}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Link href="/admin/users">
            <Button variant="accent">Créer un compte étudiant / responsable</Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="outline">Gestion des utilisateurs</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
