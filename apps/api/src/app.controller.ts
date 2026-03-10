import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService
  ) {}

  @Get('health')
  getHealth(): { status: string } {
    return this.appService.getHealth();
  }

  /**
   * Vérifie que le backend peut joindre la base Supabase (PostgreSQL).
   * Utile pour confirmer que DATABASE_URL est bien connectée.
   */
  @Get('health/db')
  async getHealthDb(): Promise<{ database: string; error?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { database: 'ok' };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue';
      return { database: 'error', error: message };
    }
  }
}
