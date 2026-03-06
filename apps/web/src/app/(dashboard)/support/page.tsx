/**
 * Monitoring Support Technique : erreurs système, santé des services (mock).
 * Aucun accès aux données sensibles (PRD).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertCircle, Server, Database } from 'lucide-react';

export default function SupportMonitoringPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Monitoring</h1>
      <p className="text-slate-600">
        Vue d’état des services. Aucun accès aux données personnelles ou contenus pédagogiques.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">API</CardTitle>
            <Server className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="font-medium text-green-700">Opérationnel</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Base de données</CardTitle>
            <Database className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="font-medium text-green-700">Opérationnel</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Erreurs (24h)</CardTitle>
            <AlertCircle className="size-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="font-medium text-amber-700">Voir les logs</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
