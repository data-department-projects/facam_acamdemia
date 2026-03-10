/**
 * PrismaService — Injection du client Prisma dans NestJS.
 * Rôle : connexion à la base PostgreSQL, accès aux modèles (User, Module, Quiz, etc.).
 * À connaître : lifecycle (onModuleInit/onModuleDestroy) pour ouvrir/fermer la connexion.
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
  }

  async onModuleInit() {
    // Connexion reportée au premier usage pour ne pas bloquer le démarrage (Railway healthcheck).
    // Si DATABASE_URL est absente ou la DB injoignable, l'app écoute quand même et /health répond.
    try {
      await this.$connect();
    } catch (err) {
      console.error(
        '[Prisma] Connexion DB reportée au premier usage:',
        err instanceof Error ? err.message : err
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
