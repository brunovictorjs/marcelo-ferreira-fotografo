import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../config/env.js';
import { Clock, EventBus, FileStorage, Mailer } from '../shared/application/ports.js';
import { PrismaService } from './database/prisma.service.js';
import { EventEmitterEventBus } from './events/event-emitter.event-bus.js';
import { ConsoleMailer, ResendMailer } from './mail/mailers.js';
import { LocalFileStorage } from './storage/local.file-storage.js';
import { SupabaseFileStorage } from './storage/supabase.file-storage.js';

/**
 * Adaptadores técnicos compartilhados por todos os módulos. Cada porta tem
 * um adaptador de desenvolvimento e um de produção, escolhidos pelo .env.
 */
@Global()
@Module({
  providers: [
    PrismaService,
    { provide: EventBus, useClass: EventEmitterEventBus },
    { provide: Clock, useValue: { now: () => new Date() } satisfies Clock },
    {
      provide: FileStorage,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): FileStorage => {
        if (config.get('STORAGE_DRIVER', { infer: true }) === 'supabase') {
          const client = createClient(
            config.get('SUPABASE_URL', { infer: true })!,
            config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true })!,
            { auth: { persistSession: false } },
          );
          return new SupabaseFileStorage(client, config.get('SUPABASE_STORAGE_BUCKET', { infer: true }));
        }
        return new LocalFileStorage(
          config.get('UPLOADS_DIR', { infer: true }),
          config.get('API_PUBLIC_URL', { infer: true }),
        );
      },
    },
    {
      provide: Mailer,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): Mailer =>
        config.get('MAIL_DRIVER', { infer: true }) === 'resend'
          ? new ResendMailer(config.get('RESEND_API_KEY', { infer: true })!, config.get('MAIL_FROM', { infer: true }))
          : new ConsoleMailer(),
    },
  ],
  exports: [PrismaService, EventBus, Clock, FileStorage, Mailer],
})
export class InfrastructureModule {}
