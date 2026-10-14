import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import {
  SiteSettingsReader,
  SiteSettingsRepository,
  SiteSettingsUseCases,
} from './application/site-settings.use-cases.js';
import { PrismaSiteSettingsRepository } from './infrastructure/prisma-site-settings.repository.js';
import { SiteSettingsController } from './presentation/site-settings.controller.js';

@Module({
  imports: [MediaModule],
  controllers: [SiteSettingsController],
  providers: [
    { provide: SiteSettingsRepository, useClass: PrismaSiteSettingsRepository },
    SiteSettingsUseCases,
    SiteSettingsReader,
  ],
  exports: [SiteSettingsUseCases, SiteSettingsReader],
})
export class SiteSettingsModule {}
