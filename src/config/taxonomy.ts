/**
 * Merchandising taxonomy — the storefront's category → subcategory tree.
 *
 * Consumed by:
 *  - `src/config/navigation.ts` — header mega-menu + mobile drawer
 *  - `prisma/seed.ts` / `prisma/seed-subcategories.ts` — DB rows
 *
 * Slugs are the real `categories.slug` values (route: `/categories/[slug]`),
 * so nav links, seeded rows, and product filters always agree.
 *
 * IMPORTANT: this list is STATIC and must mirror the `categories` table. It is
 * not read from the DB, so a slug here that no longer exists there renders a
 * menu link to an empty category page — which is exactly how this drifted
 * before: an aspirational Kitchen/Storage/Cleaning tree survived a catalog
 * swap and every link resolved to zero products. When categories change in the
 * DB, update this file in the same commit (`select slug, name from categories`).
 *
 * `children` is currently empty for every entry — the catalog has one flat
 * level. `SubcategoryDef.match` keywords are consumed by
 * `prisma/seed-subcategories.ts`, which is a no-op while there are no
 * children; populate both together if a second level is introduced.
 *
 * "Uncategorized" is deliberately absent: it is a real DB category (a holding
 * pen for unclassified imports) but not something to advertise in the menu.
 * Those products remain reachable via /products and search.
 */

export type SubcategoryDef = {
  name: string;
  slug: string;
  /** Shown on the category landing page and stored on the DB row. */
  description?: string;
  /** Display position among siblings (menus, chips, DB `sort_order`). */
  sortOrder: number;
  /**
   * Case-insensitive substrings matched against product names when
   * auto-assigning products to subcategories. Within a parent, array order
   * is the match priority — keep more specific entries earlier (e.g.
   * "liquid lipstick" must be tested before "lipstick").
   */
  match: string[];
};

export type CategoryDef = {
  name: string;
  slug: string;
  /** Short blurb — homepage tile caption + category page tagline. */
  description?: string;
  children: SubcategoryDef[];
};

export const CATEGORY_TREE: CategoryDef[] = [
  {
    name: 'Kitchen Accessories',
    slug: 'kitchen-accessories',
    description: 'Tools that earn their drawer space',
    children: [],
  },
  {
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Everyday pieces for a calmer home',
    children: [],
  },
  {
    name: 'Health & Beauty',
    slug: 'health-beauty',
    description: 'Grooming and self-care essentials',
    children: [],
  },
  {
    name: 'Random Gadgets',
    slug: 'random-gadgets',
    description: 'Clever one-job tools worth the space',
    children: [],
  },
  {
    name: 'Wardrobe & Organizers',
    slug: 'wardrobe-organizers',
    description: 'Keep clothes and clutter in their place',
    children: [],
  },
  {
    name: 'Home & Wall Decor',
    slug: 'home-wall-decor',
    description: 'Finishing touches for every room',
    children: [],
  },
  {
    name: 'Babies & Toys',
    slug: 'babies-toys',
    description: 'Safe, practical picks for little ones',
    children: [],
  },
  {
    name: 'Mobile Accessories',
    slug: 'mobile-accessories',
    description: 'Small add-ons for phones and devices',
    children: [],
  },
];

/** Children of a category in display order (menus, chips, seed rows). */
export function orderedChildren(cat: CategoryDef): SubcategoryDef[] {
  return [...cat.children].sort((a, b) => a.sortOrder - b.sortOrder);
}
