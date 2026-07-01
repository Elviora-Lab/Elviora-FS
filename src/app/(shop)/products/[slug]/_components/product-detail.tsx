import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo/json-ld';
import { JsonLd } from '@/lib/seo/json-ld-component';

import { ProductCard } from '@/design-system/patterns/product-card';
import { Breadcrumb } from '@/design-system/primitives/breadcrumb';
import { Section } from '@/design-system/primitives/section';

import { ProductExperience } from './product-experience';
import { ProductReviews } from './product-reviews';
import { ProductViewBeacon } from './product-view-beacon';

import { reviewsRepo } from '@/server/repositories/reviews.repo';
import { productsService } from '@/server/services/products.service';

type PdpProduct = Awaited<ReturnType<typeof productsService.getBySlug>>;

/**
 * Shared product-detail render used by both the public PDP (ISR) and the
 * admin-only preview route. `trackView` renders the view beacon; the preview
 * turns it off so admin previews don't inflate view counts.
 */
export async function ProductDetail({
  slug,
  product,
  trackView = true,
}: {
  slug: string;
  product: PdpProduct;
  trackView?: boolean;
}) {
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
        {trackView ? <ProductViewBeacon slug={slug} /> : null}
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
