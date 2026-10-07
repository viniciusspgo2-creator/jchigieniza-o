import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { SITE_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fallback seguro: sitemap funciona mesmo com banco vazio/fora do ar.
  const posts = await db.post
    .findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    })
    .catch((e) => {
      console.error('[sitemap] banco indisponível — sitemap sem artigos:', e);
      return [] as Awaited<ReturnType<typeof db.post.findMany>>;
    });

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/galeria`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}/privacidade`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.2,
    },
  ];
}
