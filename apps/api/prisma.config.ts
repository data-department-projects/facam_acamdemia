/**
 * Configuration Prisma v7 — Utilisée par le CLI (migrate, generate, studio, seed).
 * Le CLI a besoin de la connexion directe (DIRECT_URL, port 5432) car le pooler Supabase
 * (port 6543) ne supporte pas les commandes DDL nécessaires aux migrations.
 * Le runtime (PrismaService dans NestJS) utilise DATABASE_URL (pooler) via l'adapter.
 */

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// DIRECT_URL est requis pour les migrations (prisma migrate) mais pas pour prisma generate.
// En CI le variable n'est pas définie : on omet le datasource pour éviter PrismaConfigEnvError.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  ...(process.env.DIRECT_URL ? { datasource: { url: env('DIRECT_URL') } } : {}),
});
