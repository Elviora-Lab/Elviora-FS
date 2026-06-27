import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { siteConfig } from '@/config/site';

import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo/json-ld';
import { JsonLd } from '@/lib/seo/json-ld-component';
import { buildMetadata } from '@/lib/seo/metadata';

import { ProductCard } from '@/design-system/patterns/product-card';
import { Breadcrumb } from '@/design-system/primitives/breadcrumb';
import { Section } from '@/design-system/primitives/section';

import { ProductExperience } from './_components/product-experience';
import { ProductReviews } from './_components/product-reviews';
import { ProductViewBeacon } from './_components/product-view-beacon';

import { reviewsRepo } from '@/server/repositories/reviews.repo';
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
    product = await productsService.getBySlug(slug, { track: false });
  } catch {
    notFound();
  }

  const [related, reviewSummary, reviews] = await Promise.all([
    productsService.getRelated(slug, 4).catch(() => []),
    reviewsRepo.summary(product.id),
    reviewsRepo.listApproved(product.id, 10),
  ]);

  const primaryImage = product.images[0]?.imageUrl;
  const galleryImages = product.images.map((img) => ({
    url: img.imageUrl,
    alt: img.altText ?? product.name,
    variantId: img.variantId,
  }));

  // Parse shade swatches: source labels look like "ST-01 @#DA849D" — pull out
  // the hex colour and a clean name so the UI can show a swatch, not a code.
  const variantOptions = product.variants.map((v) => {
    const label = [v.size, v.shade, v.fragrance].filter(Boolean).join(' · ') || v.sku;
    const hexMatch = label.match(/@#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/);
    const name = label
      .replace(/\s*@#?[0-9a-fA-F]{3,8}\b/i, '')
      .replace(/[·\s]+$/, '')
      .trim();
    return {
      id: v.id,
      name: name || v.sku,
      hex: hexMatch ? `#${hexMatch[1]}` : undefined,
      price: Number(v.price),
      stockQuantity: v.stockQuantity,
      isActive: v.isActive,
    };
  });

  const startingPrice = Math.min(...product.variants.map((v) => Number(v.price)));
  const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);

  return (
    <Section>
      <div className="container flex flex-col gap-10">
        <ProductViewBeacon slug={slug} />
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            ...(product.category
              ? [{ label: product.category.name, href: `/categories/${product.category.slug}` }]
              : []),
            { label: product.name },
          ]}
        />

        <ProductExperience
          productId={product.id}
          productName={product.name}
          brandName={product.brand?.name ?? undefined}
          shortDescription={product.shortDescription ?? undefined}
          fullDescription={product.fullDescription ?? undefined}
          skinConcerns={product.skinConcerns.map((pc) => ({
            id: pc.skinConcern.id,
            name: pc.skinConcern.name,
          }))}
          ingredients={product.ingredients.map((pi) => ({
            id: pi.ingredient.id,
            name: pi.ingredient.name,
            description: pi.ingredient.description,
          }))}
          images={galleryImages}
          variants={variantOptions}
          comparePrice={product.comparePrice ? Number(product.comparePrice) : undefined}
          currency="PKR"
          fallbackPrice={startingPrice}
          outOfStock={totalStock === 0}
        />

        {/* Related products */}
        {related.length > 0 ? (
          <section className="flex flex-col gap-6 pt-8">
            <header className="flex flex-col gap-1">
              <span className="eyebrow">You may also love</span>
              <h2 className="editorial-heading text-display-sm">Considered alongside</h2>
            </header>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Reviews */}
        <ProductReviews productId={product.id} summary={reviewSummary} reviews={reviews} />

        {/* SEO */}
        <JsonLd
          data={breadcrumbJsonLd([
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            { label: product.name, href: `/products/${slug}` },
          ])}
        />
        <JsonLd
          data={productJsonLd({
            name: product.name,
            slug: product.slug,
            description: product.shortDescription ?? product.fullDescription ?? '',
            imageUrl: primaryImage ?? '',
            price: startingPrice,
            currency: 'PKR',
            inStock: totalStock > 0,
            brand: product.brand?.name,
          })}
        />
      </div>
    </Section>
  );
}
