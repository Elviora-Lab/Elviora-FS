import Link from 'next/link';

import { mainNav } from '@/config/navigation';

import { buildMetadata } from '@/lib/seo/metadata';

import { Section, SectionHeading } from '@/design-system/primitives/section';

export const metadata = buildMetadata({
  title: 'Shop by category',
  description: 'Browse Elviora — makeup for lips, eyes, face, and nails. Skincare coming soon.',
  path: '/categories',
});

type CategoryCard = { label: string; href: string; comingSoon: boolean };

export default function CategoriesIndexPage() {
  // Derive the category grid from the nav config: flatten the makeup children
  // into their own cards and carry any "coming soon" top-level items through.
  const cards: CategoryCard[] = mainNav.flatMap((n): CategoryCard[] => {
    if (n.comingSoon) return [{ label: n.label, href: n.href, comingSoon: true }];
    if (n.children?.length) {
      return n.children.map((c) => ({ label: c.label, href: c.href, comingSoon: false }));
    }
    if (n.href.startsWith('/categories'))
      return [{ label: n.label, href: n.href, comingSoon: false }];
    return [];
  });

  return (
    <Section>
      <div className="container flex flex-col gap-10">
        <SectionHeading
          eyebrow="The House"
          title="Shop by category"
          description="A curated edit, organised the way your ritual actually unfolds."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((cat) =>
            cat.comingSoon ? (
              <div
                key={cat.href}
                aria-disabled="true"
                className="surface-pearl relative flex aspect-[4/5] cursor-default flex-col justify-end overflow-hidden rounded-md p-6 opacity-70"
              >
                <div className="relative flex flex-col gap-1">
                  <span className="eyebrow">Coming soon</span>
                  <h3 className="font-serif text-2xl font-light text-foreground/60">{cat.label}</h3>
                </div>
              </div>
            ) : (
              <Link
                key={cat.href}
                href={cat.href}
                className="surface-pearl group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-md p-6 transition-shadow hover:shadow-card"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative flex flex-col gap-1">
                  <span className="eyebrow">Discover</span>
                  <h3 className="font-serif text-2xl font-light">{cat.label}</h3>
                </div>
              </Link>
            ),
          )}
        </div>
      </div>
    </Section>
  );
}
