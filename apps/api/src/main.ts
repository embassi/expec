// Sentry must be initialised before any other imports so it can instrument them
import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    // Capture 100% of transactions in development, 10% in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const config = app.get(ConfigService);

  // Attach a correlation ID to every request before anything else
  app.use(new CorrelationIdMiddleware().use.bind(new CorrelationIdMiddleware()));

  // Security
  await app.register(require('@fastify/helmet'));
  app.enableCors({
    origin: config.get('CORS_ORIGIN') ?? '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Simsim API running on port ${port}`);
}

bootstrap();
