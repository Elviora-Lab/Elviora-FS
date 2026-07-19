import { siteConfig } from '@/config/site';

import { cn } from '@/lib/cn';

/**
 * Kitchenly brand mark — pure SVG, no image asset.
 *
 * A rounded tile with a geometric "K" and an ember "burner-on" dot. Colors
 * ride the semantic tokens (primary / primary-foreground), so the mark
 * adapts automatically on light pages, dark mode, and navy bands
 * (surface-navy repins the tokens and the tile inverts by itself). The
 * ember dot is the one constant — the brand's pilot light.
 *
 * Variants:
 *  - "mark":      square tile only, sits beside the wordmark in tight layouts
 *  - "wordmark":  text-only treatment
 *  - "stack":     large tile + tagline (auth-side panels)
 */
type Variant = 'mark' | 'wordmark' | 'stack';

type BrandLogoProps = {
  variant?: Variant;
  size?: number;
  className?: string;
  /** Kept for API compatibility with the old image-based logo — unused. */
  priority?: boolean;
};

function Mark({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={siteConfig.name}
      className={cn('shrink-0', className)}
    >
      <rect x="1" y="1" width="46" height="46" rx="12" className="fill-primary" />
      {/* Geometric K */}
      <path
        d="M16 13v22"
        className="stroke-primary-foreground"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M31 14 18.5 25.5 32 35"
        fill="none"
        className="stroke-primary-foreground"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ember pilot light */}
      <circle cx="36.5" cy="36.5" r="3.5" className="fill-brand-ember" />
    </svg>
  );
}

export function BrandLogo({ variant = 'mark', size = 36, className }: BrandLogoProps) {
  if (variant === 'wordmark') {
    return <Wordmark size={size} className={className} />;
  }

  if (variant === 'stack') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <Mark size={size} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          {siteConfig.tagline}
        </span>
      </div>
    );
  }

  // mark
  return <Mark size={size} className={className} />;
}

function Wordmark({ size, className }: { size: number; className?: string }) {
  return (
    <span
      className={cn('font-serif font-semibold tracking-tight text-foreground', className)}
      style={{ fontSize: size * 1.4, lineHeight: 1 }}
    >
      {siteConfig.name}
    </span>
  );
}

/**
 * Inline lockup: mark + wordmark side by side — the canonical brand
 * impression used in headers and footers.
 */
export function BrandLockup({
  size = 36,
  className,
  priority: _priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BrandLogo variant="mark" size={size} />
      <BrandLogo variant="wordmark" size={Math.round(size * 0.55)} />
    </span>
  );
}
