import Link from 'next/link';

import { mainNav } from '@/config/navigation';

import { buildMetadata } from '@/lib/seo/metadata';

import { Section, SectionHeading } from '@/design-system/primitives/section';

export const metadata = buildMetadata({
  title: 'Shop by category',
  description: 'Browse Elviora — skincare, makeup, fragrance, and body.',
  path: '/categories',
});

export default function CategoriesIndexPage() {
  // Derive top-level categories from nav config until the live API is wired
  // into a Server Component (call `categoriesService.list()` here).
  const top = mainNav.filter((n) => n.href.startsWith('/categories'));

  return (
    <Section>
      <div className="container flex flex-col gap-10">
        <SectionHeading
          eyebrow="The House"
          title="Shop by category"
          description="A curated edit, organised the way your ritual actually unfolds."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {top.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-md bg-gradient-pearl p-6 transition-shadow hover:shadow-card"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative flex flex-col gap-1">
                <span className="eyebrow">Discover</span>
                <h3 className="font-serif text-2xl font-light">{cat.label}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  );
}
