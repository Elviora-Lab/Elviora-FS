'use client';

import { useState } from 'react';
import Image from 'next/image';

import { siteConfig } from '@/config/site';

import { cn } from '@/lib/cn';

/**
 * Brand mark.
 *
 * Sourced from `public/logo.png` — save your logo there.
 * If the file is missing or fails to load, the component gracefully falls
 * back to the editorial wordmark — no broken-image icons, ever.
 *
 * Variants:
 *  - "mark":      square image only, sits beside the wordmark in tight layouts
 *  - "wordmark":  text-only editorial treatment
 *  - "stack":     large square + tagline (auth-side panels)
 */
type Variant = 'mark' | 'wordmark' | 'stack';

type BrandLogoProps = {
  variant?: Variant;
  size?: number;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  variant = 'mark',
  size = 36,
  className,
  priority = false,
}: BrandLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (variant === 'wordmark') {
    return <Wordmark size={size} className={className} />;
  }

  // For mark + stack we try the image first, fall back to wordmark on error.
  if (imageFailed) {
    if (variant === 'stack') {
      return (
        <div className={cn('flex flex-col items-center gap-2', className)}>
          <Wordmark size={Math.round(size / 6)} />
          <span className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
            The Art of Radiant Beauty
          </span>
        </div>
      );
    }
    // mark fallback — small wordmark sized to roughly match the requested mark.
    return <Wordmark size={Math.round(size / 2.2)} className={className} />;
  }

  if (variant === 'stack') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <Image
          src="/logo.png"
          alt={siteConfig.name}
          width={size}
          height={size}
          priority={priority}
          onError={() => setImageFailed(true)}
          className="rounded-md"
        />
        <span className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
          The Art of Radiant Beauty
        </span>
      </div>
    );
  }

  // mark
  return (
    <Image
      src="/logo.png"
      alt={siteConfig.name}
      width={size}
      height={size}
      priority={priority}
      onError={() => setImageFailed(true)}
      className={cn('rounded-md object-cover', className)}
    />
  );
}

function Wordmark({ size, className }: { size: number; className?: string }) {
  return (
    <span
      className={cn('font-serif font-light uppercase tracking-[0.22em] text-foreground', className)}
      style={{ fontSize: size }}
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
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <BrandLogo variant="mark" size={size} priority={priority} />
      <BrandLogo variant="wordmark" size={Math.round(size * 0.55)} />
    </span>
  );
}
