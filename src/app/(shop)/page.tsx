import Image from 'next/image';
import Link from 'next/link';

import { buildMetadata } from '@/lib/seo/metadata';

import { Section, SectionHeading } from '@/design-system/primitives/section';
import { Button } from '@/components/ui/button';

export const metadata = buildMetadata({
  title: 'Refined skincare. Quietly powerful.',
  description:
    'Discover the Elviora ritual — a curated edit of high-performance skincare and editorial cosmetics, formulated with rare botanicals and clinical precision.',
});

export default function HomePage() {
  return (
    <>
      {/* — Editorial hero — */}
      <Section as="section" size="lg" className="relative overflow-hidden bg-gradient-pearl">
        <div className="container relative grid items-center gap-12 lg:grid-cols-2">
          <div className="flex max-w-xl flex-col gap-6">
            <span className="eyebrow">The Spring Edit · 2026</span>
            <h1 className="editorial-heading text-display-xl md:text-display-2xl">
              Quietly luminous skin, every morning.
            </h1>
            <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              A study in restraint — twelve essentials, eighty-four botanicals, one ritual. Crafted
              in small batches, refined in light.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="gold" uppercase>
                <Link href="/products">Shop the edit</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/ai-skincare-assistant">Speak with our concierge</Link>
              </Button>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-brand-pearl shadow-elevated">
            <Image
              src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80"
              alt="Elviora editorial campaign"
              fill
              priority
              sizes="(min-width:1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Section>

      {/* — Categories — */}
      <Section>
        <div className="container">
          <SectionHeading
            eyebrow="Explore"
            title="Three rituals, infinite expression"
            description="From sun-warmed serums to weightless balms — each formula is a quiet promise of luminosity."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Skincare',
                href: '/categories/skincare',
                img: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?auto=format&fit=crop&w=800&q=80',
              },
              {
                name: 'Makeup',
                href: '/categories/makeup',
                img: 'https://images.unsplash.com/photo-1522335789203-aaa2c4c80a90?auto=format&fit=crop&w=800&q=80',
              },
              {
                name: 'Fragrance',
                href: '/categories/fragrance',
                img: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80',
              },
            ].map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group relative block aspect-[4/5] overflow-hidden rounded-md bg-muted"
              >
                <Image
                  src={c.img}
                  alt={c.name}
                  fill
                  sizes="(min-width:768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-background">
                  <span className="font-serif text-2xl font-light">{c.name}</span>
                  <span className="text-xs uppercase tracking-[0.14em] opacity-90 group-hover:opacity-100">
                    Discover →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
