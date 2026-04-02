/**
 * Client API central — Appels HTTP vers le backend NestJS avec JWT.
 * Gère l'URL de base, l'en-tête Authorization et les erreurs communes.
 * Rôle : un seul point d'entrée pour toutes les requêtes API (maintenabilité).
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

/**
 * Récupère le token JWT stocké (localStorage côté client).
 * À appeler uniquement dans un contexte où window est défini.
 * Accepte un token stocké en chaîne brute ou en JSON.
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('facam_token');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'string' ? parsed : null;
    } catch {
      return raw;
    }
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
  /** Évite une boucle si le refresh renvoie encore 401. */
  _retriedAfterRefresh?: boolean;
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Obtient un nouveau JWT via le cookie httpOnly `facam_refresh` (une requête à la fois).
 */
export async function tryRefreshAccessToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { accessToken?: string };
        if (typeof data.accessToken === 'string' && data.accessToken.length > 0) {
          setAccessToken(data.accessToken);
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

/** Révoque le refresh côté API et efface le cookie (à appeler avant de vider le localStorage). */
export async function logoutRefreshSession(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // déconnexion best-effort
  }
}

/**
 * Message d'erreur lisible pour les échecs réseau (évite d'afficher "Failed to fetch" brut).
 */
function normalizeNetworkError(error: unknown): Error {
  const message =
    error instanceof TypeError && error.message === 'Failed to fetch'
      ? "Serveur inaccessible. Vérifiez que l'API est démarrée et que NEXT_PUBLIC_API_URL est correct."
      : error instanceof Error
        ? error.message
        : 'Erreur réseau';
  return new Error(message);
}

/**
 * Effectue une requête vers l'API avec Authorization Bearer si token présent.
 * Lance une erreur avec status et message en cas de réponse non OK.
 * Gère les erreurs réseau (Failed to fetch) et les réponses non-JSON.
 */
export async function apiRequest<T>(path: string, config: RequestConfig = {}): Promise<T> {
  const { body, token, headers: customHeaders, _retriedAfterRefresh, ...rest } = config;
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  let authToken: string | null = null;
  try {
    authToken = token ?? (typeof window !== 'undefined' ? getAccessToken() : null);
  } catch {
    // localStorage invalide ou JSON.parse du token a échoué
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const fetchInit: RequestInit = {
    ...rest,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  };
  if (typeof window !== 'undefined') {
    fetchInit.credentials = 'include';
  }

  let res: Response;
  try {
    res = await fetch(url, fetchInit);
  } catch (e) {
    throw normalizeNetworkError(e);
  }

  let data: unknown;
  try {
    const text = await res.text();
    data = text.length ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!res.ok) {
    const pathLower = path.toLowerCase();
    const canTryRefresh =
      typeof window !== 'undefined' &&
      !_retriedAfterRefresh &&
      res.status === 401 &&
      !pathLower.includes('/auth/login') &&
      !pathLower.includes('/auth/refresh') &&
      !pathLower.includes('/auth/logout');

    if (canTryRefresh && (await tryRefreshAccessToken())) {
      return apiRequest<T>(path, {
        ...config,
        _retriedAfterRefresh: true,
      });
    }

    const message =
      typeof (data as { message?: string | string[] }).message === 'string'
        ? (data as { message: string }).message
        : Array.isArray((data as { message?: string[] }).message)
          ? (data as { message: string[] }).message.join(', ')
          : res.status === 401
            ? 'Session expirée ou non authentifié. Reconnectez-vous.'
            : res.status >= 500
              ? 'Erreur serveur. Réessayez plus tard.'
              : res.statusText || 'Erreur réseau';
    const err = new Error(message) as Error & { status: number; data: ApiError };
    err.status = res.status;
    err.data = data as ApiError;
    throw err;
  }
  return data as T;
}

/** Méthodes GET / POST / PUT / PATCH / DELETE pour faciliter les appels. */
export const api = {
  get: <T>(path: string, config?: RequestConfig) =>
    apiRequest<T>(path, { ...config, method: 'GET' }),

  post: <T>(path: string, body?: Record<string, unknown>, config?: RequestConfig) =>
    apiRequest<T>(path, { ...config, method: 'POST', body }),

  put: <T>(path: string, body?: Record<string, unknown>, config?: RequestConfig) =>
    apiRequest<T>(path, { ...config, method: 'PUT', body }),

  patch: <T>(path: string, body?: Record<string, unknown>, config?: RequestConfig) =>
    apiRequest<T>(path, { ...config, method: 'PATCH', body }),

  delete: <T>(path: string, config?: RequestConfig) =>
    apiRequest<T>(path, { ...config, method: 'DELETE' }),
};
