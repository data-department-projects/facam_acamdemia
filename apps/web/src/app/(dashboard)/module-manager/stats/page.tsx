/**
 * Statistiques détaillées du responsable de module : taux de complétion, temps passé, tentatives.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MOCK_STATS_MODULE_MANAGER } from '@/data/mock';

export default function ModuleManagerStatsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Statistiques du module</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Étudiants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{MOCK_STATS_MODULE_MANAGER.totalStudents ?? 0}</p>
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
            <CardTitle className="text-sm font-medium text-slate-600">Taux de réussite</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-slate-500">(calcul backend)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Temps moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-slate-500">(calcul backend)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export et rapports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Export CSV/Excel des notes et progression, rapports par période : à brancher sur l’API
            backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
