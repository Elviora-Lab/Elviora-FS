import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, RotateCcw, ShieldCheck, Sparkles, Truck, Wrench } from 'lucide-react';

import { routes } from '@/config/routes';

import { buildMetadata } from '@/lib/seo/metadata';

import { ProductCard } from '@/design-system/patterns/product-card';
import { CountUp } from '@/design-system/primitives/count-up';
import { Reveal } from '@/design-system/primitives/reveal';
import { Section, SectionHeading } from '@/design-system/primitives/section';
import { Button } from '@/components/ui/button';

import { HeroShowcase } from './_components/hero-showcase';
import { getShowcaseReviews } from './_components/homepage-modules.data';
import { ReviewsCarousel } from './_components/reviews-carousel';
import { StatementMarquee } from './_components/statement-marquee';

import { reviewsRepo } from '@/server/repositories/reviews.repo';
import { categoriesService } from '@/server/services/categories.service';
import { productsService } from '@/server/services/products.service';

export const metadata = buildMetadata({
  title: 'Smart Living Essentials',
  description:
    'Kitchenly — kitchen gadgets, home organization, cleaning and utility essentials chosen for build quality and everyday value, delivered across Pakistan.',
});

// ISR — the homepage is the same for everyone; revalidate periodically so new
// bestsellers surface without rendering fresh on every request.
export const revalidate = 300;

export default async function HomePage() {
  // Resilient at build/runtime: a DB hiccup yields an empty edit rather than a
  // crashed render; ISR repopulates on the next successful revalidate.
  const [
    { items: bestsellers, total: productCount },
    { items: newArrivals },
    categoryTree,
    { items: bundles },
    reviews,
    reviewSummary,
  ] = await Promise.all([
    productsService.list({}, 'popular', 1, 8).catch(() => ({ items: [], total: 0 })),
    productsService.list({}, 'newest', 1, 8).catch(() => ({ items: [], total: 0 })),
    categoriesService.tree().catch(() => []),
    // Curated sets live in the "Best Selling" merchandising category.
    productsService
      .list({ category: 'best-selling' }, 'newest', 1, 4)
      .catch(() => ({ items: [], total: 0 })),
    getShowcaseReviews(12).catch(() => []),
    reviewsRepo.globalSummary().catch(() => ({ average: 0, count: 0 })),
  ]);

  // The merchandising categories (those with subcategories) drive the hero
  // chips and the tiles — name, blurb, and banner image all live on the
  // `categories` rows, so the grid follows the catalog. When a category has no
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
      {/* — Hero: value proposition + shoppable showcase — */}
      <Section as="section" size="sm" className="surface-cloud relative overflow-hidden">
        {/* Soft teal + sand halos — organized and airy. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-1/4 size-[26rem] rounded-full bg-brand-mist/70 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-10 size-[20rem] rounded-full bg-brand-stone/40 blur-3xl"
        />
        <div className="container relative grid items-center gap-12 py-8 md:py-12 lg:grid-cols-2">
          <Reveal className="flex max-w-xl flex-col gap-6">
            <span className="eyebrow">Kitchen · Home · Everyday</span>
            <h1 className="editorial-heading text-display-lg md:text-display-xl">
              Everything your home runs on.
            </h1>
            <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              Kitchen gadgets, storage, cleaning and utility essentials — picked for build quality,
              priced for daily use, delivered across Pakistan.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="cta" uppercase>
                <Link href="/products?sort=popular">Shop best sellers</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/products">Browse everything</Link>
              </Button>
            </div>
            {/* Quick category jump-off */}
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent hover:shadow-soft"
                >
                  {c.name}
                </Link>
              ))}
            </div>
            <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-4 text-sm">
              <div>
                <dt className="font-serif text-2xl font-medium text-foreground">
                  {productCount > 0 ? <CountUp value={productCount} suffix="+" /> : '—'}
                </dt>
                <dd className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Everyday essentials
                </dd>
              </div>
              {reviewSummary.count > 0 ? (
                <div>
                  <dt className="font-serif text-2xl font-medium text-foreground">
                    <CountUp value={reviewSummary.average} decimals={1} suffix="★" />
                  </dt>
                  <dd className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    From {reviewSummary.count.toLocaleString('en-US')} reviews
                  </dd>
                </div>
              ) : (
                <div>
                  <dt className="font-serif text-2xl font-medium text-foreground">Tested</dt>
                  <dd className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    Before we stock it
                  </dd>
                </div>
              )}
              <div>
                <dt className="font-serif text-2xl font-medium text-foreground">COD</dt>
                <dd className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Nationwide delivery
                </dd>
              </div>
            </dl>
          </Reveal>
          <Reveal delay={0.1}>
            <HeroShowcase products={heroProducts} />
          </Reveal>
        </div>
      </Section>

      {/* — Trust strip — */}
      <div className="border-y border-border/60 bg-card">
        <div className="container grid grid-cols-2 gap-x-6 gap-y-3 py-4 md:grid-cols-4">
          {[
            { icon: Truck, title: 'Fast delivery', sub: 'Across Pakistan' },
            { icon: ShieldCheck, title: 'Cash on delivery', sub: 'Pay at your door' },
            { icon: RotateCcw, title: 'Easy returns', sub: 'Within 2–3 days' },
            { icon: BadgeCheck, title: 'Quality checked', sub: 'Every single item' },
          ].map((s) => (
            <div key={s.title} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-mist text-brand-teal">
                <s.icon className="size-5" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-semibold">{s.title}</span>
                <span className="text-xs text-muted-foreground">{s.sub}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* — Shop by category — */}
      {categories.length > 0 && (
        <Section>
          <div className="container">
            <SectionHeading
              eyebrow="Shop by room & task"
              title="Find what your home needs"
              description="Kitchen, storage, cleaning, and the everyday bits in between."
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((c, i) => (
                <Reveal key={c.href} inView delay={i * 0.06}>
                  <Link
                    href={c.href}
                    className="group relative block aspect-[4/3] overflow-hidden rounded-xl border border-border bg-brand-sand transition-all duration-300 ease-swift hover:-translate-y-1 hover:shadow-elevated"
                  >
                    {c.img ? (
                      <Image
                        src={c.img}
                        alt={c.name}
                        fill
                        sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 ease-swift group-hover:scale-105"
                      />
                    ) : (
                      <div className="surface-cloud absolute inset-0" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/75 via-brand-ink/10 to-transparent" />
                    <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-2 text-brand-cloud">
                      <div className="flex min-w-0 flex-col">
                        {c.blurb ? (
                          <span className="truncate text-[11px] uppercase tracking-[0.12em] opacity-80">
                            {c.blurb}
                          </span>
                        ) : null}
                        <span className="font-serif text-2xl font-medium">{c.name}</span>
                      </div>
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-cloud/15 text-sm backdrop-blur-sm transition-all duration-300 group-hover:bg-brand-ember group-hover:text-white">
                        →
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* — Best sellers — */}
      {bestsellers.length > 0 && (
        <Section className="border-t border-border/60 bg-muted/50">
          <div className="container">
            <SectionHeading
              eyebrow="Most loved"
              title="Best sellers"
              description="The tools and essentials our customers reorder, again and again."
            />
            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {bestsellers.slice(0, 8).map((product, i) => (
                <Reveal key={product.id} inView delay={(i % 4) * 0.05}>
                  {/* No `priority` — below the fold; don't compete with hero LCP. */}
                  <ProductCard
                    product={product}
                    listId="home_bestsellers"
                    listName="Home — Best sellers"
                    index={i}
                  />
                </Reveal>
              ))}
            </div>
            <div className="mt-12 flex justify-center">
              <Button asChild size="lg" variant="outline" uppercase>
                <Link href="/products?sort=popular">View all best sellers</Link>
              </Button>
            </div>
          </div>
        </Section>
      )}

      {/* — Statement band — */}
      <StatementMarquee />

      {/* — New arrivals — */}
      {newArrivals.length > 0 && (
        <Section>
          <div className="container">
            <SectionHeading
              eyebrow="Just landed"
              title="New arrivals"
              description="Fresh solutions for the kitchen, the cupboard, and everywhere else."
            />
            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {newArrivals.slice(0, 8).map((product, i) => (
                <Reveal key={product.id} inView delay={(i % 4) * 0.05}>
                  <ProductCard
                    product={product}
                    listId="home_new_arrivals"
                    listName="Home — New arrivals"
                    index={i}
                  />
                </Reveal>
              ))}
            </div>
            <div className="mt-12 flex justify-center">
              <Button asChild size="lg" variant="outline" uppercase>
                <Link href="/products?sort=newest">View all new arrivals</Link>
              </Button>
            </div>
          </div>
        </Section>
      )}

      {/* — Sets & bundles — */}
      {bundles.length > 0 && (
        <Section className="border-t border-border/60">
          <div className="container">
            <SectionHeading
              eyebrow="Bundle & save"
              title="Better together"
              description="Our best-selling combinations, put together for less."
            />
            <div className="mt-12 grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4">
              {bundles.slice(0, 4).map((product, i) => (
                <Reveal key={product.id} inView delay={(i % 4) * 0.05}>
                  <ProductCard
                    product={product}
                    listId="home_bundles"
                    listName="Home — Bundles"
                    index={i}
                  />
                </Reveal>
              ))}
            </div>
            <div className="mt-12 flex justify-center">
              <Button asChild size="lg" variant="outline" uppercase>
                <Link href={routes.category('best-selling')}>View all bundles</Link>
              </Button>
            </div>
          </div>
        </Section>
      )}

      {/* — Why Kitchenly — navy value band — */}
      <Section className="surface-navy">
        <div className="container">
          <SectionHeading
            eyebrow="Why Kitchenly"
            title="Chosen like you'd choose it yourself"
            description="We stock the version of every tool we'd buy for our own homes — then back it up after the sale."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Wrench,
                title: 'Built to last',
                sub: 'We test hinges, seals, blades and coatings before a product earns a listing.',
              },
              {
                icon: Sparkles,
                title: 'Genuinely useful',
                sub: 'No drawer-junk gimmicks — every gadget has to solve a real, daily problem.',
              },
              {
                icon: Truck,
                title: 'Delivered fast',
                sub: 'Dispatched quickly, tracked to your door, cash on delivery nationwide.',
              },
              {
                icon: RotateCcw,
                title: 'Easy to return',
                sub: 'Changed your mind? Returns are simple within 2–3 days of delivery.',
              },
            ].map((v, i) => (
              <Reveal key={v.title} inView delay={i * 0.06}>
                <div className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-teal/50">
                  <span className="grid size-11 place-items-center rounded-xl bg-accent/15 text-accent">
                    <v.icon className="size-5" />
                  </span>
                  <h3 className="font-sans text-base font-semibold">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{v.sub}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* — Social proof: reviews carousel — */}
      {reviews.length > 0 && (
        <Section>
          <div className="container">
            <SectionHeading
              eyebrow="From real homes"
              title="What customers are saying"
              description="Real reviews from verified Kitchenly orders."
            />
            <div className="mt-12">
              <ReviewsCarousel reviews={reviews} />
            </div>
          </div>
        </Section>
      )}

      {/* — The name — */}
      <Section size="sm" className="border-t border-border/60">
        <Reveal inView className="container max-w-3xl text-center">
          <span className="eyebrow">The name</span>
          <p className="mt-4 text-balance font-serif text-2xl font-medium leading-relaxed md:text-3xl">
            <span className="text-foreground">Kitchenly</span>
            <span className="text-muted-foreground">
              {' '}
              — the kitchen way of doing things: practical, organized, and built to last.
            </span>
          </p>
          <p className="mt-6 text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Smart Living Essentials
          </p>
        </Reveal>
      </Section>
    </>
  );
}
