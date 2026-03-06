/**
 * Package partagé FACAM ACADEMIA
 * Types, constantes et utilitaires communs entre frontend (Next.js) et backend (Nest.js).
 */

export const APP_NAME = 'FACAM ACADEMIA';

export type UserRole = 'admin' | 'platform_manager' | 'module_manager' | 'student' | 'support';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
