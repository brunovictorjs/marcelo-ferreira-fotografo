import type { MetadataRoute } from 'next';
import { getHomePage } from '@/lib/api/public';
import { SITE_URL } from '@/lib/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { projects } = await getHomePage();
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    ...projects.map((p) => ({
      url: `${SITE_URL}/portfolio/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
