/**
 * Merchandising taxonomy — the single source of truth for the storefront's
 * category → subcategory tree.
 *
 * Consumed by:
 *  - `src/config/navigation.ts` — header mega-menu + mobile drawer
 *  - `prisma/seed.ts` / `prisma/seed-subcategories.ts` — DB rows
 *
 * Slugs are the real `categories.slug` values (route: `/categories/[slug]`),
 * so nav links, seeded rows, and product filters always agree.
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
    name: 'Kitchen',
    slug: 'kitchen',
    description: 'Tools that earn their drawer space',
    children: [
      {
        name: 'Kitchen Gadgets',
        slug: 'kitchen-gadgets',
        description: 'Clever one-job tools that save real time.',
        sortOrder: 0,
        match: ['peeler', 'slicer', 'chopper', 'grater', 'opener', 'gadget', 'timer'],
      },
      {
        name: 'Utensils & Prep',
        slug: 'utensils-prep',
        description: 'Spatulas, whisks, boards, and everyday prep.',
        sortOrder: 1,
        match: ['spatula', 'whisk', 'ladle', 'tongs', 'board', 'utensil', 'knife'],
      },
      {
        name: 'Bakeware & Cookware',
        slug: 'bakeware-cookware',
        description: 'Pans, trays, and moulds that bake evenly.',
        sortOrder: 2,
        match: ['pan', 'tray', 'mould', 'mold', 'bakeware', 'pot', 'baking'],
      },
    ],
  },
  {
    name: 'Storage',
    slug: 'storage',
    description: 'A place for everything',
    children: [
      {
        name: 'Containers & Jars',
        slug: 'containers-jars',
        description: 'Airtight, stackable, see-what-you-have storage.',
        sortOrder: 0,
        match: ['container', 'jar', 'airtight', 'canister', 'lunch box'],
      },
      {
        name: 'Racks & Shelves',
        slug: 'racks-shelves',
        description: 'Vertical space your cupboards forgot they had.',
        sortOrder: 1,
        match: ['rack', 'shelf', 'stand', 'holder', 'organiser', 'organizer'],
      },
      {
        name: 'Laundry & Wardrobe',
        slug: 'laundry-wardrobe',
        description: 'Hampers, hangers, and folding helpers.',
        sortOrder: 2,
        match: ['hanger', 'hamper', 'laundry', 'wardrobe', 'basket'],
      },
    ],
  },
  {
    name: 'Cleaning',
    slug: 'cleaning',
    description: 'Faster, easier, actually done',
    children: [
      {
        name: 'Brushes & Scrubbers',
        slug: 'brushes-scrubbers',
        description: 'The right bristle for every surface.',
        sortOrder: 0,
        match: ['brush', 'scrubber', 'sponge', 'scourer'],
      },
      {
        name: 'Mops & Cloths',
        slug: 'mops-cloths',
        description: 'Microfibre and mops that trap the mess.',
        sortOrder: 1,
        match: ['mop', 'cloth', 'microfibre', 'microfiber', 'wiper', 'duster'],
      },
      {
        name: 'Bins & Waste',
        slug: 'bins-waste',
        description: 'Tidy waste sorting for every room.',
        sortOrder: 2,
        match: ['bin', 'waste', 'trash', 'dustbin', 'garbage'],
      },
    ],
  },
  {
    name: 'Home Essentials',
    slug: 'home-essentials',
    description: 'The everyday bits in between',
    children: [
      {
        name: 'Bathroom',
        slug: 'bathroom',
        description: 'Caddies, dispensers, and shower storage.',
        sortOrder: 0,
        match: ['bathroom', 'soap', 'dispenser', 'caddy', 'shower', 'toothbrush'],
      },
      {
        name: 'Hooks & Hangers',
        slug: 'hooks-hangers',
        description: 'Stick-up, screw-in, over-door — hold anything.',
        sortOrder: 1,
        match: ['hook', 'adhesive', 'over door', 'wall mount'],
      },
      {
        name: 'Utility & Hardware',
        slug: 'utility-hardware',
        description: 'Tapes, tools, and small fixes for the house.',
        sortOrder: 2,
        match: ['tape', 'tool', 'utility', 'battery', 'bulb', 'cable'],
      },
    ],
  },
];

/** Children of a category in display order (menus, chips, seed rows). */
export function orderedChildren(cat: CategoryDef): SubcategoryDef[] {
  return [...cat.children].sort((a, b) => a.sortOrder - b.sortOrder);
}
