'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

import { currentPromotion } from '@/config/promotions';

import { cn } from '@/lib/cn';

/**
 * Compact festive campaign pill for the hero — emerald + gold, links to the
 * shop. Phase-aware copy (build-up vs live) and renders nothing when no
 * campaign is running.
 */
export function PromoPill({ className }: { className?: string }) {
  const active = currentPromotion();
  if (!active) return null;

  const { promo, phase } = active;
  const startShort = new Date(promo.startsAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
  const text =
    phase === 'live'
      ? `${promo.name} · ${promo.percentOff}% off — code ${promo.code}`
      : `${promo.name} · ${promo.percentOff}% off — from ${startShort}`;

  return (
    <Link
      href="/products"
      data-track="cta"
      data-track-label="hero-promo"
      className={cn(
        'group inline-flex w-fit items-center gap-2 rounded-full border border-brand-gold/40 bg-[#0a4b32] px-3.5 py-1.5',
        'text-[11px] font-medium uppercase tracking-[0.16em] text-brand-champagne shadow-sm',
        'transition-transform duration-300 ease-editorial hover:-translate-y-0.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-champagne/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <Sparkles className="size-3.5" aria-hidden />
      {text}
      <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}
