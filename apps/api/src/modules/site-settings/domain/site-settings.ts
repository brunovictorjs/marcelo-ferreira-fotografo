import type { SiteSettings } from '@mf/shared';
import { domainEvent, type Actor, type DomainEvent } from '../../../shared/domain/domain-event.js';

export type SettingsSection = keyof SiteSettings;
export const SETTINGS_SECTIONS: SettingsSection[] = ['hero', 'clients', 'about', 'contact', 'seo'];

const SECTION_LABEL: Record<SettingsSection, string> = {
  hero: 'o hero',
  clients: 'os logos de clientes',
  about: 'o Sobre mim',
  contact: 'os dados de contato',
  seo: 'os metadados (SEO)',
};

/** Conteúdo padrão — o mesmo texto do protótipo, editável no painel. */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  hero: {
    kicker: 'FOTOGRAFIA',
    line1: 'SUA HISTÓRIA,',
    line2: 'EM FOCO.',
    script: 'por Marcelo Ferreira',
    text: 'Retratos, eventos e projetos para marcas, com direção cuidadosa do primeiro clique à entrega. Conte o que você quer registrar e agende uma conversa.',
    primaryButton: 'AGENDAR ENSAIO',
    secondaryButton: 'VER PORTFÓLIO',
    since: '',
    tagline: 'LUZ • OLHAR • HISTÓRIA',
    imageUrl: null,
  },
  clients: { visible: true, title: 'CLIENTES E PUBLICAÇÕES', logos: [] },
  about: {
    opening: '',
    text: '',
    chips: ['ATENDE TODO O BRASIL'],
    signature: 'Marcelo Ferreira',
    since: '',
    imageUrl: null,
  },
  contact: {
    recipientEmail: '',
    ccEmails: '',
    whatsapp: '',
    instagram: '',
    city: '',
    responseTime: '24H',
  },
  seo: {
    title: 'Marcelo Ferreira Fotografia',
    description: 'Retratos, casamentos, eventos e fotografia para marcas. Agende seu ensaio com Marcelo Ferreira.',
    shareImageUrl: null,
    faviconUrl: null,
  },
};

/** Coleta todas as URLs de imagem usadas nas configurações. */
export function imageUrlsOf(s: SiteSettings): Set<string> {
  const urls = [
    s.hero.imageUrl,
    s.about.imageUrl,
    s.seo.shareImageUrl,
    s.seo.faviconUrl,
    ...s.clients.logos.map((l) => l.imageUrl),
  ];
  return new Set(urls.filter((u): u is string => !!u));
}

/** Devolve um evento por seção alterada (alimenta a "Atividade recente"). */
export function diffSettings(before: SiteSettings, after: SiteSettings, actor: Actor): DomainEvent[] {
  return SETTINGS_SECTIONS.filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k])).map((section) =>
    domainEvent('site.settings.updated', actor, { section, label: SECTION_LABEL[section] }),
  );
}
