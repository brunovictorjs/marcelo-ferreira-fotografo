import { Injectable } from '@nestjs/common';
import type { ContactSettings, SiteSettings, SiteSettingsDto } from '@mf/shared';
import { EventBus } from '../../../shared/application/ports.js';
import type { Actor } from '../../../shared/domain/domain-event.js';
import { MediaService } from '../../media/application/media.service.js';
import { diffSettings, imageUrlsOf } from '../domain/site-settings.js';

export abstract class SiteSettingsRepository {
  abstract load(): Promise<SiteSettingsDto>;
  abstract save(settings: SiteSettings, actor: Actor): Promise<void>;
}

@Injectable()
export class SiteSettingsUseCases {
  constructor(
    private readonly repo: SiteSettingsRepository,
    private readonly media: MediaService,
    private readonly events: EventBus,
  ) {}

  get(): Promise<SiteSettingsDto> {
    return this.repo.load();
  }

  async getPublic(): Promise<SiteSettings> {
    const { updatedAt: _u, updatedByName: _n, ...settings } = await this.repo.load();
    return settings;
  }

  async update(next: SiteSettings, actor: Actor): Promise<SiteSettingsDto> {
    const current = await this.get();
    await this.repo.save(next, actor);
    await this.events.publish(diffSettings(current, next, actor));

    // Imagens trocadas ou removidas deixam de ser usadas: apaga do storage.
    const kept = imageUrlsOf(next);
    await Promise.all([...imageUrlsOf(current)].filter((u) => !kept.has(u)).map((u) => this.media.deleteByUrl(u)));
    return this.get();
  }
}

/** Fachada de leitura usada por outros módulos (ex.: inbox precisa do e-mail de destino). */
@Injectable()
export class SiteSettingsReader {
  constructor(private readonly repo: SiteSettingsRepository) {}

  async contact(): Promise<ContactSettings> {
    return (await this.repo.load()).contact;
  }
}
