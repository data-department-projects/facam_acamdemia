/**
 * Favicon : logo FACAM ACADEMIA (PNG officiel), rendu en 128×128.
 * `runtime: nodejs` requis pour lire le fichier sous `public/`.
 */
import { createFacamLogoFaviconResponse } from '@/lib/facam-favicon-image';

export const runtime = 'nodejs';

export const size = { width: 128, height: 128 };
export const contentType = 'image/png';

export default async function Icon() {
  return createFacamLogoFaviconResponse(128);
}
