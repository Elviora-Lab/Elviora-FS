/**
 * Brand colors are the source of truth for the design system.
 * They are exposed to CSS via `--brand-*` custom properties in
 * `src/styles/tokens.css` and mapped into Tailwind under `colors.brand.*`.
 *
 * Use these constants only in JS-side code (e.g. dynamic charts, framer
 * variants, programmatic SVG). For component styling, prefer Tailwind classes.
 */
export const brandColors = {
  ivory: 'hsl(38 40% 96%)',
  pearl: 'hsl(36 30% 92%)',
  champagne: 'hsl(38 45% 80%)',
  gold: 'hsl(36 55% 55%)',
  beige: 'hsl(32 25% 78%)',
  charcoal: 'hsl(220 12% 18%)',
  rose: 'hsl(12 35% 78%)',
} as const;

export type BrandColor = keyof typeof brandColors;
