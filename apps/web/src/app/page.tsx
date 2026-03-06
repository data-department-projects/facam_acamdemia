/**
 * Page d'accueil (route `/`) — délègue au composant marketing `HomeLanding`.
 * Objectif : garder la route légère et isoler la home premium dans `src/components/marketing/home`.
 */

import { HomeLanding } from '@/components/marketing/home/HomeLanding';

export default function Page() {
  return <HomeLanding />;
}
