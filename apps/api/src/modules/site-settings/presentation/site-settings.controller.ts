import { Body, Controller, Get, Put } from '@nestjs/common';
import { type SiteSettings, siteSettingsSchema } from '@mf/shared';
import type { Actor } from '../../../shared/domain/domain-event.js';
import { CurrentActor } from '../../../shared/presentation/auth.decorators.js';
import { ZodValidationPipe } from '../../../shared/presentation/zod-validation.pipe.js';
import { SiteSettingsUseCases } from '../application/site-settings.use-cases.js';

@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly settings: SiteSettingsUseCases) {}

  @Get()
  get() {
    return this.settings.get();
  }

  /** "Salvar e publicar": grava todas as seções de uma vez. */
  @Put()
  update(@Body(new ZodValidationPipe(siteSettingsSchema)) body: SiteSettings, @CurrentActor() actor: Actor) {
    return this.settings.update(body, actor);
  }
}
