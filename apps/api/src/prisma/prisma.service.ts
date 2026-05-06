/**
 * PrismaService — Injection du client Prisma v7 dans NestJS.
 * Prisma v7 exige un driver adapter : @prisma/adapter-pg pour PostgreSQL.
 * Le PrismaClient reçoit l'adapter dans son constructeur.
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL ?? '';
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
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
