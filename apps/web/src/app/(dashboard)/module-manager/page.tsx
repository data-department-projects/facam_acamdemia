/**
 * Dashboard responsable de module — Indicateurs chargés depuis l’API (formations).
 * Données réelles ; stats détaillées (inscrits, complétions par module) à venir côté backend.
 */

'use client';

import { useState, useEffect } from 'react';
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
import { Users, TrendingUp, Target, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { api } from '@/lib/api-client';

interface FormationItem {
  id: string;
  title: string;
  subtitle?: string;
  chaptersCount?: number;
}

interface Paginated<T> {
  data: T[];
  total: number;
}

export default function ModuleManagerDashboardPage() {
  const [modules, setModules] = useState<FormationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api
      .get<Paginated<FormationItem>>('/formations?limit=50')
      .then((res) => {
        if (!cancelled) setModules(Array.isArray(res.data) ? res.data : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setModules([]);
          setError(e instanceof Error ? e.message : 'Impossible de charger les modules.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalModules = modules.length;
  // Ces indicateurs nécessiteraient un endpoint dédié (ex. GET /stats/module-manager)
  const totalStudents = 0;
  const totalCompletions = 0;
  const completionRate = 0;
  const avgProgress = 0;

  const completionByModule =
    totalModules > 0
      ? modules.slice(0, 5).map((m, i) => ({
          name: m.title,
          value: 0,
          color: ['#001b61', '#002a6e', '#ffae03', '#003380', '#004499'][i] ?? '#001b61',
        }))
      : [];

  const scoresEvolution: { name: string; score: number }[] = [];
  const abandonChapters: { name: string; abandon: number }[] = [];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-facam-dark">Dashboard responsable de module</h1>
        <p className="text-gray-500">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-facam-dark">Dashboard responsable de module</h1>
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Modules</CardTitle>
            <Activity className="size-5 text-facam-blue" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-dark">{totalModules}</p>
            <p className="text-xs text-gray-500">Formations visibles</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Étudiants inscrits</CardTitle>
            <Users className="size-5 text-facam-blue" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-dark">{totalStudents || '—'}</p>
            <p className="text-xs text-gray-500">Sur vos modules (API à brancher)</p>
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
            <p className="text-2xl font-bold text-facam-dark">—</p>
            <p className="text-xs text-gray-500">Quiz (API à brancher)</p>
          </CardContent>
        </Card>
      </div>

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
            <CardTitle className="text-base">Modules</CardTitle>
          </CardHeader>
          <CardContent>
            {completionByModule.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={completionByModule}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {completionByModule.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucun module. Les données viennent de l’API.</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Évolution des scores moyens</CardTitle>
          </CardHeader>
          <CardContent>
            {scoresEvolution.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoresEvolution}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#ffae03" radius={[4, 4, 0, 0]} name="Score %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Données à connecter (endpoint stats).</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Chapitres les plus abandonnés</CardTitle>
          <p className="text-sm font-normal text-gray-500">
            Où les étudiants s&apos;arrêtent le plus
          </p>
        </CardHeader>
        <CardContent>
          {abandonChapters.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={abandonChapters} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={50} />
                  <Tooltip />
                  <Bar dataKey="abandon" fill="#001b61" radius={[0, 4, 4, 0]} name="Abandons" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Données à connecter (endpoint stats).</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
