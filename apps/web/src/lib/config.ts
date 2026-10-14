/** URL interna da API NestJS (usada só no servidor do Next). */
export const API_URL = process.env.API_URL ?? 'http://localhost:3333';

/** URL pública do site (metadados, sitemap, links absolutos). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** Cookie httpOnly com o token de acesso do painel. */
export const SESSION_COOKIE = 'mf_session';

/** Tag de cache de tudo que o site público lê da API. */
export const PUBLIC_CACHE_TAG = 'public-site';

export const DEFAULT_IMAGES = {
  logo: '/images/logo.png',
  hero: '/images/hero.webp',
  about: '/images/sobre.webp',
  /** Gerados a partir da logo; servidos pelas convenções de arquivo do Next em src/app. */
  shareImage: '/opengraph-image.png',
  favicon: '/icon.png',
} as const;
