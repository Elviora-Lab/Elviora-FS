import Image from 'next/image';
import Link from 'next/link';

import { mainNav } from '@/config/navigation';
import { routes } from '@/config/routes';

import { buildMetadata } from '@/lib/seo/metadata';

import { Section, SectionHeading } from '@/design-system/primitives/section';

import { categoriesService } from '@/server/services/categories.service';

export const metadata = buildMetadata({
  title: 'Shop by category',
  description:
    'Browse Kitchenly categories — kitchen tools, home organization, cleaning, and everyday essentials.',
  path: '/categories',
});

export const revalidate = 300;

type CategoryCard = {
  label: string;
  href: string;
  comingSoon: boolean;
  image?: string | null;
  subLabels?: string[];
};

export default async function CategoriesIndexPage() {
  // Merchandising categories (those with subcategories) come from the DB —
  // name, banner image, and subcategory names all live on `categories` rows.
  // "Coming soon" placeholders stay in the nav config until they exist.
  const tree = await categoriesService.tree().catch(() => []);
  const cards: CategoryCard[] = [
    ...tree
      .filter((c) => c.children.length > 0)
      .map((c) => ({
        label: c.name,
        href: routes.category(c.slug),
        comingSoon: false,
        image: c.image,
        subLabels: c.children.map((child) => child.name),
      })),
    ...mainNav
      .filter((n) => n.comingSoon)
      .map((n) => ({ label: n.label, href: n.href, comingSoon: true })),
  ];

  return (
    <Section>
      <div className="container flex flex-col gap-10">
        <SectionHeading
          eyebrow="The House"
          title="Shop by category"
          description="Organized the way your home actually works — room by room, task by task."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((cat) =>
            cat.comingSoon ? (
              <div
                key={cat.href}
                aria-disabled="true"
                className="surface-cloud relative flex aspect-[4/5] cursor-default flex-col justify-end overflow-hidden rounded-md p-6 opacity-70"
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
                className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-md p-6 transition-shadow hover:shadow-card"
              >
                {cat.image ? (
                  <>
                    <Image
                      src={cat.image}
                      alt={cat.label}
                      fill
                      sizes="(min-width:1024px) 25vw, (min-width:768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-swift group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/75 via-brand-ink/15 to-transparent" />
                  </>
                ) : (
                  <>
                    <div className="surface-cloud absolute inset-0" />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </>
                )}
                <div
                  className={`relative flex flex-col gap-1 ${cat.image ? 'text-brand-cloud' : ''}`}
                >
                  <span className={`eyebrow ${cat.image ? 'text-brand-cloud/80' : ''}`}>
                    Discover
                  </span>
                  <h3 className="font-serif text-2xl font-light">{cat.label}</h3>
                  {cat.subLabels?.length ? (
                    <p
                      className={`text-xs leading-relaxed ${
                        cat.image ? 'text-brand-cloud/80' : 'text-muted-foreground'
                      }`}
                    >
                      {cat.subLabels.join(' · ')}
                    </p>
                  ) : null}
                </div>
              </Link>
            ),
          )}
        </div>
      </div>
    </Section>
  );
}
