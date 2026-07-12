import Image from 'next/image';
import Link from 'next/link';

import { routes } from '@/config/routes';

import { buildMetadata } from '@/lib/seo/metadata';

import { ProductCard } from '@/design-system/patterns/product-card';
import { CountUp } from '@/design-system/primitives/count-up';
import { Reveal } from '@/design-system/primitives/reveal';
import { Section, SectionHeading } from '@/design-system/primitives/section';
import { Button } from '@/components/ui/button';

import { HeroShowcase } from './_components/hero-showcase';
import { getShadeSpotlight, getShowcaseReviews } from './_components/homepage-modules.data';
import { ShadeSpotlight } from './_components/lazy-sections';
import { ReviewsCarousel } from './_components/reviews-carousel';
import { StatementMarquee } from './_components/statement-marquee';

import { reviewsRepo } from '@/server/repositories/reviews.repo';
import { categoriesService } from '@/server/services/categories.service';
import { productsService } from '@/server/services/products.service';

export const metadata = buildMetadata({
  title: 'Colour, made luminous.',
  description:
    'Elviora — a curated edit of high-pigment lips, second-skin foundation, and glass-finish nails. Cosmetics designed to wear like light.',
});

// ISR — the homepage is the same for everyone; revalidate periodically so new
// bestsellers surface without rendering fresh on every request.
export const revalidate = 300;

// Editorial imagery (Unsplash, free for commercial use).
const EDITORIAL_IMAGE =
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=85';

export default async function HomePage() {
  // Resilient at build/runtime: a DB hiccup yields an empty edit rather than a
  // crashed render; ISR repopulates on the next successful revalidate.
  const [
    { items: bestsellers, total: productCount },
    categoryTree,
    { items: bundles },
    spotlight,
    reviews,
    reviewSummary,
  ] = await Promise.all([
    productsService.list({}, 'popular', 1, 8).catch(() => ({ items: [], total: 0 })),
    categoriesService.tree().catch(() => []),
    // Curated sets live in the "Best Selling" merchandising category.
    productsService
      .list({ category: 'best-selling' }, 'newest', 1, 4)
      .catch(() => ({ items: [], total: 0 })),
    getShadeSpotlight().catch(() => null),
    getShowcaseReviews(12).catch(() => []),
    reviewsRepo.globalSummary().catch(() => ({ average: 0, count: 0 })),
  ]);

  // The merchandising categories (those with subcategories) drive the hero
  // chips and the tiles — name, blurb, and banner image all live on the
  // `categories` rows, so the edit follows the catalog. When a category has no
  // banner image set, fall back to a representative product image from that
  // category so the tiles never render blank.
  const merchandising = categoryTree.filter((c) => c.children.length > 0);
  const categoryImages = await Promise.all(
    merchandising.map((c) =>
      c.image
        ? Promise.resolve(c.image)
        : productsService
            .list({ category: c.slug }, 'popular', 1, 1)
            .then((r) => r.items[0]?.imageUrl ?? null)
            .catch(() => null),
    ),
  );
  const categories = merchandising.map((c, i) => ({
    name: c.name,
    href: routes.category(c.slug),
    blurb: c.description,
    img: categoryImages[i],
  }));

  // Real, shoppable products power the animated hero showcase.
  const heroProducts = bestsellers
    .filter((p) => p.imageUrl)
    .slice(0, 5)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      imageUrl: p.imageUrl,
      price: p.price,
      brandLine: p.brandLine,
    }));

  return (
    <>
      {/* — Editorial hero — */}
      <Section as="section" size="lg" className="surface-pearl relative overflow-hidden">
        {/* Soft blush halo behind the copy for a cosmetic glow. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-1/4 size-[28rem] rounded-full bg-brand-blush/50 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-10 size-[22rem] rounded-full bg-brand-rosegold/20 blur-3xl"
        />
        <div className="container relative grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="flex max-w-xl flex-col gap-6">
            <span className="eyebrow">The Colour Edit · 2026</span>
            <h1 className="editorial-heading text-display-xl md:text-display-2xl">
              Colour, made luminous.
            </h1>
            <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              High-pigment lips, second-skin foundation, and glass-finish nails — a curated edit of
              cosmetics designed to wear like light, made in small batches.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="gold" uppercase>
                <Link href="/products">Shop the collection</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/products?sort=popular">Bestsellers</Link>
              </Button>
            </div>
            {/* Quick category jump-off */}
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="rounded-full border border-border/70 bg-background/40 px-4 py-1.5 text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  {c.name}
                </Link>
              ))}
            </div>
            <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-4 text-sm">
              <div>
                <dt className="font-serif text-2xl font-light text-foreground">
                  {productCount > 0 ? <CountUp value={productCount} /> : '—'}
                </dt>
                <dd className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Shades & finishes
                </dd>
              </div>
              {reviewSummary.count > 0 ? (
                <div>
                  <dt className="font-serif text-2xl font-light text-foreground">
                    <CountUp value={reviewSummary.average} decimals={1} suffix="★" />
                  </dt>
                  <dd className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    From {reviewSummary.count.toLocaleString('en-US')} reviews
                  </dd>
                </div>
              ) : (
                <div>
                  <dt className="font-serif text-2xl font-light text-foreground">Small-batch</dt>
                  <dd className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Made fresh
                  </dd>
                </div>
              )}
              <div>
                <dt className="font-serif text-2xl font-light text-foreground">Cruelty-free</dt>
                <dd className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Always
                </dd>
              </div>
            </dl>
          </Reveal>
          <Reveal delay={0.1}>
            <HeroShowcase products={heroProducts} />
          </Reveal>
        </div>
      </Section>

      {/* — Shop by category — */}
      {categories.length > 0 && (
        <Section>
          <div className="container">
            <SectionHeading
              eyebrow="The Edit"
              title="Find your finish"
              description="Four ways to play — lips, eyes, face, and nails."
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((c, i) => (
                <Reveal key={c.href} inView delay={i * 0.06}>
                  <Link
                    href={c.href}
                    className="group relative block aspect-[4/5] overflow-hidden rounded-md bg-muted"
                  >
                    {c.img ? (
                      <Image
                        src={c.img}
                        alt={c.name}
                        fill
                        sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="surface-pearl absolute inset-0" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-noir/70 via-brand-noir/10 to-transparent" />
                    <div className="absolute inset-x-5 bottom-5 flex items-end justify-between text-brand-ivory">
                      <div className="flex flex-col">
                        {c.blurb ? (
                          <span className="text-[10px] uppercase tracking-[0.18em] opacity-80">
                            {c.blurb}
                          </span>
                        ) : null}
                        <span className="font-serif text-2xl font-light">{c.name}</span>
                      </div>
                      <span className="text-xs uppercase tracking-[0.14em] opacity-90 transition-opacity group-hover:opacity-100">
                        Shop →
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* — Shop the shades (interactive swatches) — */}
      {spotlight && (
        <Section className="border-t border-border/60">
          <div className="container">
            <SectionHeading
              eyebrow="Shop the shades"
              title="Find your colour"
              description="Tap a swatch — the shade comes to life."
            />
            <div className="mt-12">
              <Reveal inView>
                <ShadeSpotlight product={spotlight} />
              </Reveal>
            </div>
          </div>
        </Section>
      )}

      {/* — Statement band — */}
      <StatementMarquee />

      {/* — Sets & Bundles — */}
      {bundles.length > 0 && (
        <Section className="border-t border-border/60">
          <div className="container">
            <SectionHeading
              eyebrow="Save together"
              title="Sets & Bundles"
              description="Our best-selling pairings, curated together for less."
            />
            <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {bundles.slice(0, 4).map((product, i) => (
                <Reveal key={product.id} inView delay={(i % 4) * 0.05}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
            <div className="mt-12 flex justify-center">
              <Button asChild size="lg" variant="outline" uppercase>
                <Link href={routes.category('best-selling')}>View all sets</Link>
              </Button>
            </div>
          </div>
        </Section>
      )}

      {/* — Bestsellers — */}
      {bestsellers.length > 0 && (
        <Section className="border-t border-border/60">
          <div className="container">
            <SectionHeading
              eyebrow="Most loved"
              title="Bestsellers"
              description="The pieces our community reaches for, again and again."
            />
            <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {bestsellers.slice(0, 8).map((product, i) => (
                <Reveal key={product.id} inView delay={(i % 4) * 0.05}>
                  {/* No `priority` — this section is well below the fold, so its
                      images should lazy-load and not compete with the hero LCP. */}
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
            <div className="mt-12 flex justify-center">
              <Button asChild size="lg" variant="outline" uppercase>
                <Link href="/products">View all</Link>
              </Button>
            </div>
          </div>
        </Section>
      )}

      {/* — Social proof: reviews carousel — */}
      {reviews.length > 0 && (
        <Section className="border-t border-border/60">
          <div className="container">
            <SectionHeading
              eyebrow="Loved by our community"
              title="What everyone's saying"
              description="Real reviews from verified Elviora orders."
            />
            <div className="mt-12">
              <ReviewsCarousel reviews={reviews} />
            </div>
          </div>
        </Section>
      )}

      {/* — Editorial band — */}
      <Section as="section" size="lg">
        <div className="container">
          <Reveal inView className="relative overflow-hidden rounded-xl">
            <div className="relative aspect-[16/10] w-full md:aspect-[21/9]">
              <Image
                src={EDITORIAL_IMAGE}
                alt="Elviora — the colour studio"
                fill
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-noir/80 via-brand-noir/40 to-transparent" />
            </div>
            <div className="absolute inset-0 flex items-center">
              <div className="flex max-w-md flex-col gap-4 px-6 text-brand-ivory md:px-14">
                <span className="text-[11px] uppercase tracking-[0.24em] text-brand-champagne">
                  The House
                </span>
                <h2 className="editorial-heading text-display-md md:text-display-lg">
                  Made in small batches. Worn in every light.
                </h2>
                <p className="text-pretty text-sm leading-relaxed text-brand-ivory/80">
                  Pigments pressed for payoff, formulas kind to skin, shades built for every tone.
                  This is colour, considered.
                </p>
                <div className="mt-2">
                  <Button asChild size="lg" variant="gold" uppercase>
                    <Link href="/products">Discover the collection</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* — The name — */}
      <Section size="sm" className="border-t border-border/60">
        <Reveal inView className="container max-w-3xl text-center">
          <span className="eyebrow">The name</span>
          <p className="mt-4 text-balance font-serif text-2xl font-light leading-relaxed md:text-3xl">
            <span className="text-foreground">Elviora</span>
            <span className="text-muted-foreground">
              {' '}
              — from the Latin <em className="font-serif not-italic text-foreground">elvīra</em>,
              “she who illuminates,” softened with the lyrical Italian ending{' '}
              <em className="font-serif not-italic text-foreground">-iora</em>.
            </span>
          </p>
          <p className="mt-6 text-xs uppercase tracking-[0.32em] text-muted-foreground">
            The Art of Radiant Colour
          </p>
        </Reveal>
      </Section>
    </>
  );
}
