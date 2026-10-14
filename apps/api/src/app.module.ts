import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.js';
import { InfrastructureModule } from './infrastructure/infrastructure.module.js';
import { ActivityModule } from './modules/activity/activity.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { InboxModule } from './modules/inbox/inbox.module.js';
import { MediaModule } from './modules/media/media.module.js';
import { PortfolioModule } from './modules/portfolio/portfolio.module.js';
import { PublicSiteModule } from './modules/public-site/public-site.module.js';
import { SiteSettingsModule } from './modules/site-settings/site-settings.module.js';
import { TestimonialsModule } from './modules/testimonials/testimonials.module.js';
import { ApiExceptionFilter } from './shared/presentation/exception.filter.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    InfrastructureModule,
    // Módulos de negócio (bounded contexts)
    IdentityModule,
    MediaModule,
    PortfolioModule,
    CatalogModule,
    TestimonialsModule,
    InboxModule,
    SiteSettingsModule,
    ActivityModule,
    PublicSiteModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}
