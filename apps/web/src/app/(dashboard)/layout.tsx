/**
 * Layout des espaces connectés (étudiant, responsable, admin, support).
 * Affiche Header + Sidebar selon le rôle ; redirige vers /login si non connecté.
 */

import { DashboardShell } from '@/components/layout/DashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
