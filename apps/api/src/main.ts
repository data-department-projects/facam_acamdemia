import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

/**
 * Point d'entrée de l'API FACAM ACADEMIA.
 * Démarre le serveur Nest.js (utilisé en production via Vercel serverless ou en local).
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  /**
   * Reverse-proxy TLS (Render / Vercel / etc.) :
   * Nécessaire pour que Express/Nest calcule correctement l’IP, le protocole (https) et les cookies Secure.
   */
  const httpAdapter = app.getHttpAdapter();
  const httpInstance = httpAdapter?.getInstance?.();
  if (httpInstance && typeof httpInstance.set === 'function') {
    httpInstance.set('trust proxy', 1);
  }

  app.use(cookieParser());
  app.use(helmet());
  app.use(compression());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Graceful shutdown (SIGTERM) : important pour les redéploiements et arrêts contrôlés en production.
  app.enableShutdownHooks();

  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin
      ? corsOrigin
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean)
      : true,
    credentials: true,
  });
  const port = process.env.PORT ?? 3001;
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);

  // Timeouts serveur (évite certaines classes de connexions “pendantes” en prod).
  const server = app.getHttpServer();
  if (server && typeof server === 'object') {
    // Node http.Server
    (server as { keepAliveTimeout?: number }).keepAliveTimeout = 65_000;
    (server as { headersTimeout?: number }).headersTimeout = 70_000;
  }

  logger.log(`API FACAM ACADEMIA listening on http://${host}:${port}`);
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
