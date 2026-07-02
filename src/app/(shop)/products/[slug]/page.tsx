import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { siteConfig } from '@/config/site';

import { buildMetadata } from '@/lib/seo/metadata';

import { ProductDetail } from './_components/product-detail';

import { productsService } from '@/server/services/products.service';

type Params = Promise<{ slug: string }>;

// ISR: the PDP is the same for everyone; view tracking happens via a client
// beacon, so the page itself can be cached and revalidated periodically.
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  try {
    // Metadata pass — don't count this as a product view.
    const product = await productsService.getBySlug(slug, { track: false });
    return buildMetadata({
      title: product.seoTitle ?? product.name,
      description: product.seoDescription ?? product.shortDescription ?? siteConfig.description,
      path: `/products/${slug}`,
      image: product.images[0]?.imageUrl,
    });
  } catch {
    return buildMetadata({ title: 'Not found', path: `/products/${slug}`, noIndex: true });
  }
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params;

  let product;
  try {
    // No view emit here — keeps the render cacheable; the beacon logs the view.
    // Hidden products throw here → notFound() (not publicly reachable).
    product = await productsService.getBySlug(slug, { track: false });
  } catch {
    notFound();
  }

  return <ProductDetail slug={slug} product={product} />;
}
