/**
 * Logs système (Support) — Aucun mock.
 * Lorsqu’un endpoint API de logs sera disponible, le brancher ici.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

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
          <p className="text-slate-500">
            Aucun endpoint de logs exposé pour l’instant. Connectez un système de logs (ex. API
            dédiée ou export) pour afficher les données ici.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
