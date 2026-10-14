import 'server-only';
import type { HomePageDto, PublicProjectPageDto, SiteSettings } from '@mf/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { API_URL, PUBLIC_CACHE_TAG } from '../config';
import { ApiError } from './errors';

/**
 * Leituras do site público. Ficam em cache no servidor (Cache Components) e
 * são invalidadas pela tag PUBLIC_CACHE_TAG sempre que o painel altera algo.
 */
async function getJson<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, { headers: { accept: 'application/json' } });
  if (res.status === 404) return null;
  if (!res.ok) throw await ApiError.fromResponse(res);
  return (await res.json()) as T;
}

export async function getHomePage(): Promise<HomePageDto> {
  'use cache';
  cacheTag(PUBLIC_CACHE_TAG);
  cacheLife('hours');
  const home = await getJson<HomePageDto>('/public/home');
  if (!home) throw new Error('API não retornou a página inicial.');
  return home;
}

export async function getProjectPage(slug: string): Promise<PublicProjectPageDto | null> {
  'use cache';
  cacheTag(PUBLIC_CACHE_TAG);
  cacheLife('hours');
  return getJson<PublicProjectPageDto>(`/public/projects/${encodeURIComponent(slug)}`);
}

export async function getPublicSettings(): Promise<SiteSettings> {
  'use cache';
  cacheTag(PUBLIC_CACHE_TAG);
  cacheLife('hours');
  const settings = await getJson<SiteSettings>('/public/settings');
  if (!settings) throw new Error('API não retornou as configurações do site.');
  return settings;
}
