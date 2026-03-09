/**
 * Redirection : la page Paramètres a été supprimée.
 * Redirige vers le dashboard admin.
 */

import { redirect } from 'next/navigation';

export default function AdminSettingsPage() {
  redirect('/admin');
}
