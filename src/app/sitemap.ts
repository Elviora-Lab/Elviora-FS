import type { MetadataRoute } from 'next';

import { siteConfig } from '@/config/site';

import { prisma } from '@/lib/db';

// Regenerate at most hourly so the sitemap reflects new products/posts without
// querying the DB on every crawl.
export const revalidate = 3600;

const STATIC_PATHS: Array<[string, MetadataRoute.Sitemap[number]['changeFrequency'], number]> = [
  ['/', 'weekly', 1.0],
  ['/products', 'daily', 0.9],
  ['/blog', 'weekly', 0.7],
  ['/categories', 'weekly', 0.6],
  ['/about', 'monthly', 0.5],
  ['/contact', 'monthly', 0.4],
  ['/faq', 'monthly', 0.4],
  ['/shipping', 'monthly', 0.4],
  ['/gift-cards', 'monthly', 0.4],
  ['/sustainability', 'monthly', 0.3],
  ['/careers', 'monthly', 0.3],
  ['/press', 'monthly', 0.3],
  ['/privacy', 'yearly', 0.2],
  ['/terms', 'yearly', 0.2],
  ['/accessibility', 'yearly', 0.2],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const [products, categories, posts] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, publishedAt: true },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = STATIC_PATHS.map(
    ([path, changeFrequency, priority]) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    }),
  );

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/categories/${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.publishedAt ?? now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...postRoutes];
}
