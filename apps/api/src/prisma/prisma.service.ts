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
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
