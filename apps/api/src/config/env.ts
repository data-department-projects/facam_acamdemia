/**
 * Env / Config validation (production readiness).
 * Rôle : valider au démarrage toutes les variables d’environnement critiques, avec des erreurs explicites.
 * À connaître : Nest `ConfigModule.forRoot({ validate })` permet de fail-fast en prod (évite un crash “aléatoire” plus tard).
 */

import { z } from 'zod';

/**
 * Schéma minimal mais robuste.
 * - En prod, on force les secrets et URLs critiques.
 * - En dev, on tolère davantage pour accélérer l’itération locale.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('0.0.0.0'),

  /** CORS : liste d’origines séparées par des virgules (ex: https://app.vercel.app,https://www.mondomaine.com). */
  CORS_ORIGIN: z.string().optional(),

  /** Prisma / Supabase Postgres. */
  DATABASE_URL: z.string().min(1, 'DATABASE_URL est requise'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL est requise').optional(),

  /** Auth */
  JWT_SECRET: z.string().min(1, 'JWT_SECRET est requise'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(30),
  AUTH_REFRESH_SAMESITE: z.enum(['lax', 'none', 'strict']).default('lax'),

  /** Supabase Storage (service role). */
  SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  /** Email OTP (optionnel, mais si SMTP_USER est présent on exige SMTP_PASS). */
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.string().default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM_NAME: z.string().default('facam_academia'),
  APP_LOGO_URL: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = EnvSchema.safeParse(config);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuration invalide (env):\n${message}`);
  }

  // Règles conditionnelles (plus strictes en production)
  const env = parsed.data;
  if (env.NODE_ENV === 'production') {
    if (env.JWT_SECRET.length < 32) {
      throw new Error(
        'Configuration invalide (env): JWT_SECRET doit faire au moins 32 caractères en production.'
      );
    }

    // Si on active le Storage côté API, on veut l’URL + la service role key.
    const supaUrl = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
    if (
      (supaUrl && !env.SUPABASE_SERVICE_ROLE_KEY) ||
      (!supaUrl && env.SUPABASE_SERVICE_ROLE_KEY)
    ) {
      throw new Error(
        'Configuration invalide (env): SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY doivent être définies ensemble.'
      );
    }

    // SMTP : si user défini => pass obligatoire.
    if (env.SMTP_USER && !env.SMTP_PASS) {
      throw new Error(
        'Configuration invalide (env): SMTP_PASS est requis quand SMTP_USER est défini.'
      );
    }
  }

  return env;
}
