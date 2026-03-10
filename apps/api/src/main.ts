import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Point d'entrée de l'API FACAM ACADEMIA.
 * Démarre le serveur Nest.js (utilisé en production via Vercel serverless ou en local).
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
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
  console.log(`API FACAM ACADEMIA listening on http://${host}:${port}`);
}

void bootstrap();
