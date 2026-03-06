/**
 * Dashboard responsable de module : statistiques (notes, complétion, tentatives).
 * Graphiques Recharts pour visualisation.
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MOCK_STATS_MODULE_MANAGER } from '@/data/mock';

const COMPLETION_DATA = [
  { name: 'Maintenance', value: 28, color: '#001b61' },
  { name: 'Production', value: 15, color: '#002a6e' },
  { name: 'QHSE', value: 32, color: '#ffae03' },
];

const SCORES_DATA = [
  { name: 'Semaine 1', score: 72 },
  { name: 'Semaine 2', score: 78 },
  { name: 'Semaine 3', score: 75 },
  { name: 'Semaine 4', score: 82 },
];

export default function ModuleManagerDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard responsable de module</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Étudiants inscrits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {MOCK_STATS_MODULE_MANAGER.totalStudents ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Complétions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-blue">
              {MOCK_STATS_MODULE_MANAGER.totalCompletions ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {MOCK_STATS_MODULE_MANAGER.totalModules}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Complétions par module</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={COMPLETION_DATA}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {COMPLETION_DATA.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Évolution des scores moyens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SCORES_DATA}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#001b61" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
