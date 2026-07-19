'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/cn';

/**
 * Tactile reciprocity: a coupon the shopper can *take*. Tapping copies the
 * code — the dashed "ticket" border turns solid teal and the label confirms.
 * A possessed discount wants to be spent (endowment effect), and every claim
 * here is real: the code exists and applies to first orders.
 */
export function PromoCodeChip({
  code = 'WELCOME10',
  label = '10% off your first order',
  className,
}: {
  code?: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(code).then(
      () => {
        setCopied(true);
        analytics.selectPromotion?.({
          promotionId: code,
          promotionName: 'promo-code-chip',
          creativeName: 'copy-chip',
          creativeSlot: 'home',
          items: [],
        });
        setTimeout(() => setCopied(false), 2400);
      },
      () => undefined,
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      data-track="cta"
      data-track-label="copy-welcome10"
      className={cn(
        'group inline-flex min-h-11 w-fit items-center gap-3 rounded-xl border-2 border-dashed px-4 py-2 text-left',
        'transition-all duration-300 ease-swift active:scale-[0.97]',
        copied
          ? 'border-solid border-accent bg-accent/10'
          : 'border-border bg-card hover:border-accent/60 hover:shadow-soft',
        className,
      )}
      aria-live="polite"
    >
      <span className="font-mono text-sm font-bold tracking-[0.14em] text-brand-ember">{code}</span>
      <span className="hidden text-xs text-muted-foreground sm:inline">{label}</span>
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-semibold',
          copied ? 'text-accent' : 'text-muted-foreground group-hover:text-accent',
        )}
      >
        {copied ? (
          <>
            <Check className="size-3.5 animate-pop-in motion-reduce:animate-none" /> Copied
          </>
        ) : (
          <>
            <Copy className="size-3.5" /> Tap to copy
          </>
        )}
      </span>
    </button>
  );
}
