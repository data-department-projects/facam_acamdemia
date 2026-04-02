/**
 * Helpers de téléchargement côté navigateur.
 *
 * Rôle dans l'app:
 * - Centralise la logique "fetch → blob → <a download>" pour forcer un vrai téléchargement,
 *   au lieu d'ouvrir un nouvel onglet (souvent bloqué par les popups ou affiché inline).
 *
 * Bases importantes:
 * - `window.open()` dépend des popups et du header `Content-Disposition` côté serveur.
 * - Le pattern "blob + a[download]" déclenche un download fiable dans la plupart des navigateurs.
 */
export function sanitizeFilename(input: string): string {
  const trimmed = (input ?? '').trim();
  const base = trimmed || 'document';
  // Remplace les caractères problématiques Windows/macOS et normalise les espaces.
  return base
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

export function inferExtensionFromUrl(url: string, fallback = 'pdf'): string {
  try {
    const u = new URL(url);
    const filename = decodeURIComponent(u.pathname.split('/').pop() || '');
    const match = filename.match(/\.([a-zA-Z0-9]+)$/);
    if (match?.[1]) return match[1].toLowerCase();
    return fallback;
  } catch {
    return fallback;
  }
}

export function buildDownloadFilename(opts: {
  label: string;
  url: string;
  fallbackExt?: string;
}): string {
  const base = sanitizeFilename(opts.label);
  const ext = inferExtensionFromUrl(opts.url, opts.fallbackExt ?? 'pdf');
  // Si le label contient déjà une extension, on ne duplique pas.
  if (base.toLowerCase().endsWith(`.${ext}`)) return base;
  return `${base}.${ext}`;
}

function triggerDirectDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadFileFromUrl(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`Téléchargement impossible (HTTP ${res.status}).`);
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
    }
  } catch (e) {
    // En production, un téléchargement cross-origin peut échouer côté navigateur (CORS).
    // Dans ce cas, on déclenche un téléchargement “direct” via navigation (pas soumis au CORS).
    if (e instanceof TypeError) {
      triggerDirectDownload(url, filename);
      return;
    }
    throw e;
  }
}
