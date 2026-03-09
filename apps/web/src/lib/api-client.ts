/**
 * Client API central — Appels HTTP vers le backend NestJS avec JWT.
 * Gère l'URL de base, l'en-tête Authorization et les erreurs communes.
 * Rôle : un seul point d'entrée pour toutes les requêtes API (maintenabilité).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

/**
 * Récupère le token JWT stocké (localStorage côté client).
 * À appeler uniquement dans un contexte où window est défini.
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('facam_token');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Stocke le token JWT après login.
 */
export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('facam_token', JSON.stringify(token));
}

/**
 * Supprime le token (déconnexion).
 */
export function clearAccessToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('facam_token');
}

/**
 * Options pour fetch avec typage du body et des headers.
 */
interface RequestConfig extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData;
  token?: string | null;
}

/**
 * Effectue une requête vers l'API avec Authorization Bearer si token présent.
 * Lance une erreur avec status et message en cas de réponse non OK.
 */
export async function apiRequest<T>(path: string, config: RequestConfig = {}): Promise<T> {
  const { body, token, headers: customHeaders, ...rest } = config;
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const authToken = token ?? (typeof window !== 'undefined' ? getAccessToken() : null);
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  const res = await fetch(url, {
    ...rest,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data.message === 'string'
        ? data.message
        : Array.isArray(data.message)
          ? data.message.join(', ')
          : res.statusText || 'Erreur réseau';
    const err = new Error(message) as Error & { status: number; data: ApiError };
    err.status = res.status;
    err.data = data as ApiError;
    throw err;
  }
  return data as T;
}

/** Méthodes GET / POST / PATCH / DELETE pour faciliter les appels. */
export const api = {
  get: <T>(path: string, config?: RequestConfig) =>
    apiRequest<T>(path, { ...config, method: 'GET' }),

  post: <T>(path: string, body?: Record<string, unknown>, config?: RequestConfig) =>
    apiRequest<T>(path, { ...config, method: 'POST', body }),

  patch: <T>(path: string, body?: Record<string, unknown>, config?: RequestConfig) =>
    apiRequest<T>(path, { ...config, method: 'PATCH', body }),

  delete: <T>(path: string, config?: RequestConfig) =>
    apiRequest<T>(path, { ...config, method: 'DELETE' }),
};
