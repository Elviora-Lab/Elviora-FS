/**
 * Shade helpers for the admin products table. Pure functions — safe to import
 * from both server and client components.
 *
 * A product's shade is encoded in its slug (e.g. "…-cs-40"); the real colour
 * lives in its variants, whose `shade` labels look like "CS-40 @#RRGGBB". So we
 * derive the shade code from the slug, then find the matching variant to pull an
 * exact hex. Descriptive names (lipsticks: "BLOOD-RED") that have no variant hex
 * fall back to a keyword→colour guess.
 */

// Normalise a shade code for comparison: drop punctuation and strip leading
// zeros from number groups so "FP-3" matches the variant labelled "FP-03".
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\d+/g, (d) => String(parseInt(d, 10)));

/**
 * Short shade label from a slug: strip the leading tokens it shares with the
 * product name (the common base), leaving the distinguishing tail —
 * "nail-polish-color-show-cs-40" + "…Color Show" → "CS-40". Falls back to the
 * full slug when nothing distinctive remains (non-shade products).
 */
export function shadeFromSlug(slug: string, name: string): string {
  const nameTokens = new Set(
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/),
  );
  const slugTokens = slug.split('-').filter(Boolean);
  let i = 0;
  while (i < slugTokens.length && nameTokens.has(slugTokens[i]!)) i++;
  const rest = slugTokens.slice(i);
  return rest.length ? rest.join('-').toUpperCase() : slug;
}

/** Pull the `@#RRGGBB` hex out of a variant shade label, if present. */
function variantHex(shade: string): string | null {
  const m = shade.match(/@#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/);
  return m ? `#${m[1]}` : null;
}

/** The code/name part of a variant shade label, minus hex and parentheticals. */
function variantCode(shade: string): string {
  return shade
    .replace(/@#?[0-9a-fA-F]{3,8}\b/i, '')
    .replace(/\(.*?\)/g, '')
    .trim();
}

/** Exact hex for a product's shade, matched against its own variants. */
function variantHexForShade(
  shade: string,
  variants: Array<{ shade: string | null }>,
): string | null {
  // Match on the full code and on the code with its family prefix stripped
  // (so "CS-WHITE" also matches a variant simply labelled "White").
  const keys = new Set([norm(shade), norm(shade.replace(/^(cs|st|fp|sp)-/i, ''))]);
  for (const v of variants) {
    if (v.shade && keys.has(norm(variantCode(v.shade)))) {
      const hex = variantHex(v.shade);
      if (hex) return hex;
    }
  }
  return null;
}

/** First variant that carries a usable hex — a representative colour. */
function firstVariantHex(variants: Array<{ shade: string | null }>): string | null {
  for (const v of variants) {
    if (v.shade) {
      const hex = variantHex(v.shade);
      if (hex) return hex;
    }
  }
  return null;
}

// Approximate swatch colours for descriptive shade names (best-effort — used
// only when there's no exact variant hex, e.g. lipstick shades named by colour).
const SHADE_COLORS: Record<string, string> = {
  'blood-red': '#7f1418',
  'brick-red': '#9c4536',
  'cherry-red': '#a4133c',
  'deep-red': '#8b1a1a',
  'bright-pink': '#ff4da6',
  'hot-pink': '#ff2e88',
  'baby-pink': '#f7b8d0',
  'deep-maroon': '#4a1522',
  'caramel-nude': '#b5814f',
  'deep-peach': '#f28e63',
  'deep-orange': '#c85a1b',
  red: '#c0392b',
  pink: '#ff69b4',
  maroon: '#6d2233',
  nude: '#d2a679',
  peach: '#ffb07c',
  orange: '#e67e22',
  coral: '#ff6f61',
  brown: '#6b4423',
  plum: '#6a2c5a',
  purple: '#7d3c98',
  violet: '#7d3c98',
  berry: '#7b2d43',
  wine: '#5e1f2e',
  rose: '#c76b7f',
  mauve: '#a86b7f',
  fuchsia: '#c724b1',
  fuchia: '#c724b1',
  magenta: '#c2185b',
  mulberry: '#8f3b5a',
  marsala: '#964f4f',
  rosewood: '#8b4b54',
  beige: '#d9c2a6',
  tan: '#c68e5f',
  almond: '#c9a887',
  peanut: '#c99a6b',
  mink: '#6b5545',
  ivory: '#efe4cf',
  petal: '#f6c6d4',
  mango: '#ff9f2e',
  citrus: '#e6a817',
  white: '#f2f2f2',
  black: '#222222',
  blue: '#2f5fd0',
  navy: '#1f2f6b',
  green: '#2e8b57',
  mint: '#7ad0a8',
  yellow: '#e6c200',
  gold: '#d4af37',
  golden: '#d4af37',
  silver: '#c0c0c0',
  smokey: '#7a7d80',
  smoky: '#7a7d80',
  grey: '#9aa0a6',
  gray: '#9aa0a6',
};

/** Best-effort swatch colour from a descriptive shade name; null if unknown. */
function shadeKeywordColor(shade: string): string | null {
  const key = shade.toLowerCase();
  if (SHADE_COLORS[key]) return SHADE_COLORS[key];
  let hit: string | null = null;
  for (const token of key.split(/[-\s]+/)) {
    if (SHADE_COLORS[token]) hit = SHADE_COLORS[token]; // base noun usually last
  }
  return hit;
}

/**
 * Resolve the dot colour for a product's shade:
 *  1. exact hex from the variant matching this product's shade code;
 *  2. keyword guess for descriptive names (e.g. lipstick "BLOOD-RED");
 *  3. for a base/family product (no specific shade in the slug), a
 *     representative hex from its first variant.
 * Returns null when none apply (e.g. a fixer/primer with no colour).
 *
 * `slug` is used only to tell a base product apart from a specific shade:
 * `shadeFromSlug` returns the raw slug for base products, so `shade === slug`
 * means "no specific shade" — only then do we fall back to the first variant,
 * to avoid painting a specific shade with the wrong colour.
 */
export function resolveShadeColor(
  shade: string,
  variants: Array<{ shade: string | null }>,
  slug: string,
): string | null {
  const exact = variantHexForShade(shade, variants);
  if (exact) return exact;
  const keyword = shadeKeywordColor(shade);
  if (keyword) return keyword;
  if (shade === slug) return firstVariantHex(variants); // base/family product
  return null;
}
