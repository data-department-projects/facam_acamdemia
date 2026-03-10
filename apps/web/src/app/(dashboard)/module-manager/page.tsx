/**
 * Dashboard responsable de module — Statistiques utiles : inscrits, taux de complétion,
 * scores moyens aux quiz, quiz final, chapitres abandonnés, progression moyenne.
 * Design : cartes, graphiques Recharts, couleur d'accent jaune pour les indicateurs positifs.
 */

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Users, TrendingUp, Award, Target, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MOCK_STATS_MODULE_MANAGER } from '@/data/mock';

const COMPLETION_BY_MODULE = [
  { name: 'Maintenance', value: 28, color: '#001b61' },
  { name: 'Production', value: 15, color: '#002a6e' },
  { name: 'QHSE', value: 32, color: '#ffae03' },
];

const SCORES_EVOLUTION = [
  { name: 'Semaine 1', score: 72 },
  { name: 'Semaine 2', score: 78 },
  { name: 'Semaine 3', score: 75 },
  { name: 'Semaine 4', score: 82 },
];

const ABANDON_CHAPTERS = [
  { name: 'Ch. 3', abandon: 12 },
  { name: 'Ch. 5', abandon: 8 },
  { name: 'Ch. 7', abandon: 15 },
  { name: 'Ch. 9', abandon: 6 },
];

export default function ModuleManagerDashboardPage() {
  const totalStudents = MOCK_STATS_MODULE_MANAGER.totalStudents ?? 0;
  const totalCompletions = MOCK_STATS_MODULE_MANAGER.totalCompletions ?? 0;
  const completionRate =
    totalStudents > 0 ? Math.round((totalCompletions / totalStudents) * 100) : 0;
  const avgProgress = 64; // mock

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-facam-dark">Dashboard responsable de module</h1>

      {/* Cartes KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Étudiants inscrits</CardTitle>
            <Users className="size-5 text-facam-blue" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-dark">{totalStudents}</p>
            <p className="text-xs text-gray-500">Sur vos modules</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taux de complétion</CardTitle>
            <Target className="size-5 text-facam-yellow" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-yellow">{completionRate} %</p>
            <p className="text-xs text-gray-500">{totalCompletions} formations terminées</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Score moyen quiz</CardTitle>
            <TrendingUp className="size-5 text-facam-blue" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-dark">76 %</p>
            <p className="text-xs text-gray-500">Quiz chapitres</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Quiz final (moy.)</CardTitle>
            <Award className="size-5 text-facam-yellow" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-dark">14,2 / 20</p>
            <p className="text-xs text-gray-500">Note moyenne</p>
          </CardContent>
        </Card>
      </div>

      {/* Progression moyenne */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Progression moyenne des étudiants</CardTitle>
          <Activity className="size-5 text-gray-500" />
        </CardHeader>
        <CardContent>
          <ProgressBar value={avgProgress} height="lg" showLabel />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Complétions par module</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={COMPLETION_BY_MODULE}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {COMPLETION_BY_MODULE.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Évolution des scores moyens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SCORES_EVOLUTION}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#ffae03" radius={[4, 4, 0, 0]} name="Score %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Chapitres les plus abandonnés</CardTitle>
          <p className="text-sm text-gray-500 font-normal">
            Où les étudiants s&apos;arrêtent le plus
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ABANDON_CHAPTERS} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={50} />
                <Tooltip />
                <Bar dataKey="abandon" fill="#001b61" radius={[0, 4, 4, 0]} name="Abandons" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
