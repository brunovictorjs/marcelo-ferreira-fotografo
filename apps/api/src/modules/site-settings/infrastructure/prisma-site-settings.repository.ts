import { Injectable, Logger } from '@nestjs/common';
import { type SiteSettings, type SiteSettingsDto, siteSettingsSchema } from '@mf/shared';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import type { Actor } from '../../../shared/domain/domain-event.js';
import { SiteSettingsRepository } from '../application/site-settings.use-cases.js';
import { DEFAULT_SITE_SETTINGS, SETTINGS_SECTIONS } from '../domain/site-settings.js';

/** Uma linha por seção (key = hero | clients | about | contact | seo), valor em JSON. */
@Injectable()
export class PrismaSiteSettingsRepository extends SiteSettingsRepository {
  private readonly logger = new Logger(PrismaSiteSettingsRepository.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async load(): Promise<SiteSettingsDto> {
    const rows = await this.prisma.siteSetting.findMany();
    const merged: Record<string, unknown> = structuredClone(DEFAULT_SITE_SETTINGS);
    for (const row of rows) {
      try {
        const defaults = merged[row.key];
        merged[row.key] = { ...(defaults as object), ...(JSON.parse(row.value) as object) };
      } catch {
        this.logger.warn(`Configuração "${row.key}" com JSON inválido — usando o padrão.`);
      }
    }
    const parsed = siteSettingsSchema.safeParse(merged);
    const settings = parsed.success ? parsed.data : DEFAULT_SITE_SETTINGS;
    const latest = rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
    return {
      ...settings,
      updatedAt: latest?.updatedAt.toISOString() ?? null,
      updatedByName: latest?.updatedByName ?? null,
    };
  }

  async save(settings: SiteSettings, actor: Actor): Promise<void> {
    await this.prisma.$transaction(
      SETTINGS_SECTIONS.map((key) => {
        const data = { value: JSON.stringify(settings[key]), updatedById: actor.id, updatedByName: actor.name };
        return this.prisma.siteSetting.upsert({ where: { key }, create: { key, ...data }, update: data });
      }),
    );
  }
}
