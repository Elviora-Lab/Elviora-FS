/**
 * Brand colors are the source of truth for the design system.
 * They are exposed to CSS via `--brand-*` custom properties in
 * `src/styles/tokens.css` and mapped into Tailwind under `colors.brand.*`.
 *
 * Use these constants only in JS-side code (e.g. dynamic charts, framer
 * variants, programmatic SVG). For component styling, prefer Tailwind classes.
 */
export const brandColors = {
  ivory: 'hsl(36 44% 96%)',
  pearl: 'hsl(34 32% 93%)',
  champagne: 'hsl(36 48% 83%)',
  gold: 'hsl(36 60% 56%)',
  rosegold: 'hsl(16 58% 66%)',
  blush: 'hsl(350 58% 90%)',
  rose: 'hsl(350 46% 80%)',
  mauve: 'hsl(325 22% 60%)',
  plum: 'hsl(318 32% 24%)',
  beige: 'hsl(30 28% 81%)',
  nude: 'hsl(26 34% 85%)',
  charcoal: 'hsl(320 16% 13%)',
  noir: 'hsl(320 18% 7%)',
} as const;

export type BrandColor = keyof typeof brandColors;
