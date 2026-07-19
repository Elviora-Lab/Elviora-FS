import Link from 'next/link';
import { ArrowRight, BadgeCheck, RotateCcw, ShieldCheck, Star, Truck } from 'lucide-react';

import { routes } from '@/config/routes';

import { buildMetadata } from '@/lib/seo/metadata';

import { ProductCard } from '@/design-system/patterns/product-card';
import { CountUp } from '@/design-system/primitives/count-up';
import { Reveal } from '@/design-system/primitives/reveal';
import { Section, SectionHeading } from '@/design-system/primitives/section';
import { PromoCodeChip } from '@/components/commerce/promo-code-chip';
import { SnapRail } from '@/components/commerce/snap-rail';
import { Button } from '@/components/ui/button';

import { CategoryBento } from './_components/category-bento';
import { CodSteps } from './_components/cod-steps';
import { HeroShowcase } from './_components/hero-showcase';
import { getShowcaseReviews } from './_components/homepage-modules.data';
import { ReviewsCarousel } from './_components/reviews-carousel';
import { SavingsLadder } from './_components/savings-ladder';
import { StatementMarquee } from './_components/statement-marquee';
import { ValuePicks } from './_components/value-picks';

import { reviewsRepo } from '@/server/repositories/reviews.repo';
import { categoriesService } from '@/server/services/categories.service';
import { productsService } from '@/server/services/products.service';
import { promotionsService } from '@/server/services/promotions.service';

export const metadata = buildMetadata({
  title: 'Smart Living Essentials',
  description:
    'Kitchenly — kitchen gadgets, home organization, cleaning and utility essentials chosen for build quality and everyday value, delivered across Pakistan.',
});

// ISR — the homepage is the same for everyone; revalidate periodically so new
// bestsellers surface without rendering fresh on every request.
export const revalidate = 300;

const FREE_DELIVERY_AT = 8000;

/**
 * "The Honest Ledger" — a decision-journey homepage. The order is the
 * psychology: promise (ticker, in the layout) → attention (hero) → trust
 * (ledger) → routing (bento) → consensus (ranked bestsellers) → economics
 * (savings ladder) → concrete route up the ladder (bundles) → freshness
 * (arrivals) → human proof (navy proof wall) → peak-end close (marquee + COD
 * ritual + gift restated). Every number is fetched or published policy;
 * ember orange appears only on money moments.
 */
export default async function HomePage() {
  // Resilient at build/runtime: a DB hiccup yields an empty section rather
  // than a crashed render; ISR repopulates on the next successful revalidate.
  const [
    { items: bestsellers, total: productCount },
    { items: newArrivals },
    categoryTree,
    { items: bundles },
    reviews,
    reviewSummary,
    spendTiers,
  ] = await Promise.all([
    productsService.list({}, 'popular', 1, 8).catch(() => ({ items: [], total: 0 })),
    productsService.list({}, 'newest', 1, 8).catch(() => ({ items: [], total: 0 })),
    categoriesService.tree().catch(() => []),
    productsService
      .list({ category: 'best-selling' }, 'newest', 1, 4)
      .catch(() => ({ items: [], total: 0 })),
    getShowcaseReviews(12).catch(() => []),
    reviewsRepo.globalSummary().catch(() => ({ average: 0, count: 0 })),
    promotionsService.tiersForDisplay().catch(() => []),
  ]);

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
  const bentoCategories = merchandising.map((c, i) => ({
    name: c.name,
    href: routes.category(c.slug),
    blurb: c.description,
    img: categoryImages[i],
    children: c.children.map((child) => child.name),
  }));

  const heroProducts = bestsellers
    .filter((p) => p.imageUrl)
    .slice(0, 4)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      imageUrl: p.imageUrl,
      price: p.price,
      brandLine: p.brandLine,
    }));

  // Social proof is only honest at volume — below 30 reviews the hero line
  // and the "rated by" framing stay silent.
  const proofGate = reviewSummary.count >= 30;
  const ladderTiers =
    spendTiers.length > 0 ? spendTiers : [{ minSubtotal: 1000, discountAmount: 50 }];

  return (
    <>
      {/* ——— Editorial hero + product spotlight ——— */}
      <Section as="section" size="sm" className="surface-cloud relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-1/4 size-[26rem] rounded-full bg-brand-mist/70 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-10 size-[20rem] rounded-full bg-brand-stone/40 blur-3xl"
        />
        <div className="container relative grid items-center gap-10 py-6 md:py-10 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <span className="eyebrow">Kitchen · Home · Everyday</span>
            <h1 className="editorial-heading text-display-lg md:text-display-xl">
              Everything your home runs on.
            </h1>
            <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              Smart home &amp; kitchen essentials — chosen for build quality, delivered anywhere in
              Pakistan, cash at your door.
            </p>
            <PromoCodeChip />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="cta" uppercase>
                <Link href="/products?sort=popular">Shop best sellers</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/categories">Explore categories</Link>
              </Button>
            </div>
            {proofGate ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Star className="size-4 fill-brand-amber text-brand-amber" />
                Rated {reviewSummary.average.toFixed(1)}/5 by{' '}
                {reviewSummary.count.toLocaleString('en-US')} shoppers
              </p>
            ) : null}
          </div>
          <div className="lg:col-span-7">
            <HeroShowcase products={heroProducts} />
          </div>
        </div>
      </Section>

      {/* ——— Trust ledger — all four claims visible at once ——— */}
      <div className="border-y border-border/60 bg-card">
        <div className="container grid grid-cols-2 divide-border/60 md:grid-cols-4 md:divide-x">
          {[
            { icon: ShieldCheck, title: 'Cash on delivery', sub: 'Nationwide' },
            { icon: RotateCcw, title: 'Easy returns', sub: 'Within 2–3 days' },
            { icon: Truck, title: 'Free delivery', sub: 'Over Rs 8,000' },
          ].map((s, i) => (
            <Reveal key={s.title} inView delay={i * 0.06}>
              <div className="flex min-h-11 items-center gap-3 px-2 py-4 md:justify-center">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-mist text-brand-teal">
                  <s.icon className="size-5" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">{s.title}</span>
                  <span className="text-xs text-muted-foreground">{s.sub}</span>
                </span>
              </div>
            </Reveal>
          ))}
          <Reveal inView delay={0.18}>
            <div className="flex min-h-11 items-center gap-3 px-2 py-4 md:justify-center">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-amber/15 text-brand-amber">
                {proofGate ? (
                  <Star className="size-5 fill-current" />
                ) : (
                  <BadgeCheck className="size-5" />
                )}
              </span>
              <span className="flex flex-col leading-tight">
                {proofGate ? (
                  <>
                    <span className="text-sm font-semibold">
                      {reviewSummary.average.toFixed(1)}★ from{' '}
                      <CountUp value={reviewSummary.count} duration={1200} suffix="+" /> reviews
                    </span>
                    <span className="text-xs text-muted-foreground">Verified orders</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-semibold">Quality checked</span>
                    <span className="text-xs text-muted-foreground">Before dispatch</span>
                  </>
                )}
              </span>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ——— Category bento — four doors, one viewport ——— */}
      {bentoCategories.length > 0 && (
        <Section size="sm" className="py-14 md:py-20">
          <div className="container flex flex-col gap-8">
            <SectionHeading
              eyebrow="Find your fit"
              title="Shop by what your home needs"
              description="Four doors in — kitchen, storage, cleaning, and the everyday bits in between."
            />
            <CategoryBento categories={bentoCategories} />
          </div>
        </Section>
      )}

      {/* ——— The bestseller ledger — ranked consensus ——— */}
      {bestsellers.length > 0 && (
        <Section className="border-t border-border/60 bg-muted/50">
          <div className="container flex flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow="Proven by repeat orders"
                title="The bestseller ledger"
                description="Ranked by real orders — the things customers come back for."
              />
              <Link
                href="/products?sort=popular"
                className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
              >
                See the full ledger →
              </Link>
            </div>

            {/* Desktop: ranked grid. */}
            <div className="hidden grid-cols-3 gap-5 md:grid lg:grid-cols-4">
              {bestsellers.slice(0, 8).map((product, i) => (
                <Reveal key={product.id} inView delay={(i % 4) * 0.06}>
                  <ProductCard
                    product={product}
                    listId="home_bestsellers"
                    listName="Home — Best sellers"
                    index={i}
                    rank={i < 3 ? i + 1 : undefined}
                  />
                </Reveal>
              ))}
            </div>

            {/* Mobile: snap rail with progress thread + end-cap. */}
            <div className="md:hidden">
              <SnapRail ariaLabel="Best sellers" itemClassName="w-[72vw] max-w-72">
                {[
                  ...bestsellers
                    .slice(0, 8)
                    .map((product, i) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        listId="home_bestsellers"
                        listName="Home — Best sellers"
                        index={i}
                        rank={i < 3 ? i + 1 : undefined}
                      />
                    )),
                  <EndCap
                    key="endcap"
                    href="/products?sort=popular"
                    label={`See all ${productCount.toLocaleString('en-US')}`}
                  />,
                ]}
              </SnapRail>
            </div>
          </div>
        </Section>
      )}

      {/* ——— Spend & Save ladder — the economics, before the cart ——— */}
      <Section id="savings" size="sm" className="surface-mist scroll-mt-24 py-14 md:py-20">
        <div className="container">
          <SavingsLadder tiers={ladderTiers} freeDeliveryAt={FREE_DELIVERY_AT} />
        </div>
      </Section>

      {/* ——— Worth-it picks — a concrete route up the ladder ——— */}
      {bundles.length > 0 && (
        <Section className="surface-cloud border-t border-border/60">
          <div className="container flex flex-col gap-8">
            <SectionHeading
              eyebrow="Curated for value"
              title="Picks that pull their weight"
              description="Popular together — and a shortcut past the free-delivery line."
            />
            <ValuePicks products={bundles} />
          </div>
        </Section>
      )}

      {/* ——— Just landed — freshness, with restraint ——— */}
      {newArrivals.length > 0 && (
        <Section size="sm" className="py-14 md:py-20">
          <div className="container flex flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow="Fresh this week"
                title="Just landed"
                description="The newest additions to the shelf."
              />
              <Link
                href="/products?sort=newest"
                className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
              >
                Everything new →
              </Link>
            </div>

            {/* Desktop: one restrained row. */}
            <div className="hidden grid-cols-4 gap-5 md:grid">
              {newArrivals.slice(0, 4).map((product, i) => (
                <Reveal key={product.id} inView delay={i * 0.06}>
                  <ProductCard
                    product={{ ...product, isNew: true }}
                    listId="home_new_arrivals"
                    listName="Home — New arrivals"
                    index={i}
                  />
                </Reveal>
              ))}
            </div>

            {/* Mobile: full rail of 8. */}
            <div className="md:hidden">
              <SnapRail ariaLabel="New arrivals" itemClassName="w-[72vw] max-w-72">
                {[
                  ...newArrivals
                    .slice(0, 8)
                    .map((product, i) => (
                      <ProductCard
                        key={product.id}
                        product={{ ...product, isNew: true }}
                        listId="home_new_arrivals"
                        listName="Home — New arrivals"
                        index={i}
                      />
                    )),
                  <EndCap key="endcap" href="/products?sort=newest" label="View all new" />,
                ]}
              </SnapRail>
            </div>
          </div>
        </Section>
      )}

      {/* ——— The proof wall — human voices on the navy chapter ——— */}
      {reviews.length > 0 && (
        <Section className="surface-navy">
          <div className="container grid items-center gap-10 lg:grid-cols-12">
            <Reveal
              inView
              className="flex flex-col items-center gap-3 text-center lg:col-span-4 lg:items-start lg:text-left"
            >
              <span className="eyebrow">From real homes</span>
              <div className="flex items-baseline gap-2 font-serif">
                <span className="text-7xl font-semibold leading-none md:text-8xl">
                  <CountUp value={reviewSummary.average} decimals={1} duration={900} />
                </span>
                <Star className="size-8 fill-brand-amber text-brand-amber" />
              </div>
              <StarMeter average={reviewSummary.average} />
              <p className="text-sm text-muted-foreground">
                from <CountUp value={reviewSummary.count} duration={900} /> verified reviews
              </p>
              <p className="text-xs text-muted-foreground">
                Cash on delivery · Easy 2–3 day returns
              </p>
            </Reveal>
            <div className="lg:col-span-8">
              <ReviewsCarousel reviews={reviews} />
            </div>
          </div>
        </Section>
      )}

      {/* ——— The last word — marquee, COD ritual, peak-end close ——— */}
      <StatementMarquee />
      <Section className="surface-navy border-t border-border/40">
        <div className="container flex flex-col gap-12">
          <SectionHeading
            eyebrow="How buying works"
            title="Pay when it's in your hands."
            description="No card needed, nothing to trust up front — the money leaves your pocket only at your door."
          />
          <CodSteps />
          <Reveal inView className="flex flex-col items-center gap-5 pt-2 text-center">
            <p className="editorial-heading text-display-sm">
              {productCount > 0 ? (
                <>
                  <CountUp value={productCount} suffix="+" /> essentials, one promise — worth the
                  drawer space.
                </>
              ) : (
                'One promise — worth the drawer space.'
              )}
            </p>
            <PromoCodeChip className="border-brand-cloud/30 bg-card/60" />
            <Button asChild size="xl" variant="cta" uppercase>
              <Link href="/products">
                Start shopping <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </Section>
    </>
  );
}

/** Five-star meter whose fill width equals the real average — no rounding up. */
function StarMeter({ average }: { average: number }) {
  const pct = Math.max(0, Math.min(100, (average / 5) * 100));
  return (
    <div className="relative" role="img" aria-label={`${average.toFixed(1)} out of 5 stars`}>
      <div className="flex gap-1 text-border">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="size-5 fill-current" />
        ))}
      </div>
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
        <div className="flex gap-1 text-brand-amber">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className="size-5 fill-current" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Rail end-cap — the "see everything" card that closes a snap rail. */
function EndCap({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex h-full min-h-72 w-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-accent/50 bg-card text-center transition-colors hover:border-accent hover:bg-accent/5"
    >
      <span className="grid size-11 place-items-center rounded-full bg-accent/10 text-accent">
        <ArrowRight className="size-5" />
      </span>
      <span className="px-3 text-sm font-semibold text-accent">{label}</span>
    </Link>
  );
}
