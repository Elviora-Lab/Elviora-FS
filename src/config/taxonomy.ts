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
    name: 'Lips',
    slug: 'lips',
    description: 'High-pigment colour',
    children: [
      {
        name: 'Liquid Lipstick',
        slug: 'liquid-lipstick',
        description: 'Weightless liquid colour that sets to a soft, lasting matte.',
        sortOrder: 2,
        match: ['liquid lipstick', 'lip lacquer', 'lip gloss'],
      },
      {
        name: 'Lipstick',
        slug: 'lipstick',
        description: 'Classic bullet lipsticks in velvet, satin, and matte finishes.',
        sortOrder: 1,
        match: ['lipstick'],
      },
    ],
  },
  {
    name: 'Eyes',
    slug: 'eyes',
    description: 'Define & line',
    children: [
      {
        name: 'Eyeshadow',
        slug: 'eyeshadow',
        description: 'Pressed pigments and iridescent shadows for wash-of-colour looks.',
        sortOrder: 1,
        match: ['interferenz', 'eye shadow', 'eyeshadow', 'palette'],
      },
      {
        name: 'Eyeliner',
        slug: 'eyeliner',
        description: 'Cake, gel, and liquid liners for definition from soft to graphic.',
        sortOrder: 2,
        match: ['eyeliner', 'liner'],
      },
      {
        name: 'Mascara',
        slug: 'mascara',
        description: 'Volume and length without the clump.',
        sortOrder: 3,
        match: ['mascara'],
      },
    ],
  },
  {
    name: 'Face',
    slug: 'face',
    description: 'Glow & base',
    children: [
      {
        name: 'Foundation',
        slug: 'foundation',
        description: 'Liquid, powder, and BB formulas for every base ritual.',
        sortOrder: 1,
        match: ['foundation', 'two way cake', 'bb cream'],
      },
      {
        name: 'Concealer',
        slug: 'concealer',
        description: 'Targeted cover that moves with the skin.',
        sortOrder: 2,
        match: ['concealer'],
      },
      {
        name: 'Blush',
        slug: 'blush',
        description: 'Soft flushes of colour for the cheeks.',
        sortOrder: 3,
        match: ['blush'],
      },
      {
        name: 'Highlighter & Contour',
        slug: 'highlighter-contour',
        description: 'Sculpt and glow — light where you want it.',
        sortOrder: 4,
        match: ['highlighter', 'contour'],
      },
      {
        name: 'Face Powder',
        slug: 'face-powder',
        description: 'Loose and pressed powders to set, blur, and finish.',
        sortOrder: 5,
        match: ['face powder', 'loose powder', 'powder'],
      },
      {
        name: 'Primer & Care',
        slug: 'primer-care',
        description: 'Prep, fix, and remove — the bookends of the ritual.',
        sortOrder: 6,
        match: ['primer', 'fixer', 'remover', 'setting spray'],
      },
    ],
  },
  {
    name: 'Nails',
    slug: 'nails',
    description: 'Glass finish',
    children: [
      {
        name: 'Nail Care',
        slug: 'nail-care',
        description: 'Removers and treatments that keep nails ritual-ready.',
        sortOrder: 2,
        match: ['remover', 'cuticle', 'treatment'],
      },
      {
        name: 'Nail Polish',
        slug: 'nail-polish',
        description: 'High-shine lacquers across the full colour spectrum.',
        sortOrder: 1,
        match: ['nail polish', 'lacquer', 'color show'],
      },
    ],
  },
];

/** Children of a category in display order (menus, chips, seed rows). */
export function orderedChildren(cat: CategoryDef): SubcategoryDef[] {
  return [...cat.children].sort((a, b) => a.sortOrder - b.sortOrder);
}
