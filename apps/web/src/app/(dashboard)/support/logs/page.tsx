/**
 * Logs système (Support) : liste des entrées log (info, warn, error).
 * Données mock ; à connecter au backend.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MOCK_LOGS } from '@/data/mock';
import { cn } from '@/lib/utils';

const levelStyles = {
  info: 'bg-slate-100 text-slate-700',
  warn: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
};

export default function SupportLogsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Logs système</h1>
      <p className="text-slate-600">
        Historique des événements (sources : api, auth, db, system). Données sensibles exclues.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Dernières entrées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {MOCK_LOGS.map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-3 font-mono text-sm"
              >
                <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                <span
                  className={cn('rounded px-2 py-0.5 text-xs font-medium', levelStyles[log.level])}
                >
                  {log.level}
                </span>
                {log.source && <span className="text-slate-500">[{log.source}]</span>}
                <span className="text-slate-900">{log.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
