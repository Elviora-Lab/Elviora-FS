'use client';

import { Star } from 'lucide-react';

import { currentPromotion } from '@/config/promotions';

import { cn } from '@/lib/cn';

/**
 * Festive campaign badge for product cards — emerald + gold, star-accented.
 * Phase-aware: shows the discount ("10% Off") once the sale is live, and the
 * campaign name ("Azadi Sale") during the teaser build-up so the shop reads
 * celebratory without claiming a discount that isn't active yet. Renders
 * nothing when no campaign is running.
 */
export function PromoBadge({ className }: { className?: string }) {
  const active = currentPromotion();
  if (!active) return null;

  const { promo, phase } = active;
  const label = phase === 'live' ? `${promo.percentOff}% Off` : promo.name;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-[#0a4b32] px-2 py-1',
        'text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-champagne',
        'shadow-sm ring-1 ring-brand-gold/40',
        className,
      )}
    >
      <Star size={8} fill="currentColor" strokeWidth={0} aria-hidden />
      {label}
    </span>
  );
}
