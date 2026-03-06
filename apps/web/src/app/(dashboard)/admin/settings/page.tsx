/**
 * Paramètres plateforme (admin) : configuration générale (mock).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>

      <Card>
        <CardHeader>
          <CardTitle>Plateforme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">
            Configuration générale (nom, logo, emails, intégrations SharePoint/YouTube) à gérer côté
            backend.
          </p>
          <Button variant="outline" disabled>
            Enregistrer (backend)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
