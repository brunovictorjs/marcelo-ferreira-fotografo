import { resolve } from 'node:path';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  if (config.get('TRUST_PROXY', { infer: true })) app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({ origin: config.get('WEB_URL', { infer: true }), credentials: true });
  app.enableShutdownHooks();

  // Storage local (desenvolvimento): arquivos servidos em /uploads.
  if (config.get('STORAGE_DRIVER', { infer: true }) === 'local') {
    app.useStaticAssets(resolve(config.get('UPLOADS_DIR', { infer: true })), {
      prefix: '/uploads/',
      maxAge: '30d',
    });
  }

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`API em http://localhost:${port}`, 'Bootstrap');
}

await bootstrap();
