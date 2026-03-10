/**
 * Dashboard administrateur — Vue globale : indicateurs issus de l’API (utilisateurs, modules, complétions).
 * Données réelles depuis Supabase, pas de simulation.
 */

import AdminDashboardClient from './AdminDashboardClient';

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
