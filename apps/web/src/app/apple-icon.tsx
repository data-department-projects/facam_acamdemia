/**
 * Icône Apple (180×180) — même logo officiel que le favicon standard.
 */
import { createFacamLogoFaviconResponse } from '@/lib/facam-favicon-image';

export const runtime = 'nodejs';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  return createFacamLogoFaviconResponse(180);
}
