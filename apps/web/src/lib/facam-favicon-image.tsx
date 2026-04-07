/**
 * Favicon à partir du logo officiel FACAM ACADEMIA (même fichier que `Header.tsx`).
 * On lit le PNG haute résolution depuis `public`, puis on le compose dans une tuile carrée nette (ImageResponse).
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';

/** Nom du fichier dans `apps/web/public` (logo horizontal utilisé sur le site). */
const LOGO_FILENAME = 'Facam Academia-02-02 2.png';

export async function createFacamLogoFaviconResponse(px: number): Promise<ImageResponse> {
  const logoPath = path.join(process.cwd(), 'public', LOGO_FILENAME);
  const buf = await readFile(logoPath);
  const dataUri = `data:image/png;base64,${buf.toString('base64')}`;
  /** Marge autour du logo pour qu’il ne touche pas les bords une fois réduit dans l’onglet. */
  const inner = Math.round(px * 0.88);

  return new ImageResponse(
    <div
      style={{
        width: px,
        height: px,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
      }}
    >
      {/* Satori / ImageResponse exige <img>, pas next/image (rendu côté serveur, pas LCP navigateur). */}
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (next/og) */}
      <img
        src={dataUri}
        alt=""
        width={inner}
        height={inner}
        style={{
          objectFit: 'contain',
        }}
      />
    </div>,
    { width: px, height: px }
  );
}
