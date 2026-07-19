'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

import { cn } from '@/lib/cn';

/**
 * Promise ticker — the first 100ms of the page belong to reciprocity and
 * risk-reversal, not products. One honest published fact at a time; the whole
 * band deep-links to the Spend & Save ladder where the economics live.
 *
 * The first fact is server-rendered (zero CLS); rotation starts only after
 * hydration and never runs under prefers-reduced-motion (tap still cycles).
 */
const FACTS: Array<{ text: string; pill?: string }> = [
  { text: '10% off your first order', pill: 'WELCOME10' },
  { text: 'Cash on delivery, nationwide' },
  { text: 'Free delivery over Rs 8,000' },
  { text: 'Changed your mind? 2–3 day returns' },
];

const ROTATE_MS = 4000;
const DISMISS_KEY = 'kitchenly.offers.dismissed';

export function OfferTicker() {
  // 'unknown' until sessionStorage is read — a dismissed ticker never flashes.
  const [state, setState] = useState<'unknown' | 'shown' | 'hidden'>('unknown');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    try {
      setState(window.sessionStorage.getItem(DISMISS_KEY) === '1' ? 'hidden' : 'shown');
    } catch {
      setState('shown');
    }
    setReduced(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  }, []);

  useEffect(() => {
    if (state !== 'shown' || paused || reduced) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % FACTS.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [state, paused, reduced]);

  if (state === 'hidden') return null;

  function dismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setState('hidden');
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* best-effort */
    }
  }

  return (
    <div
      className="surface-navy relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Link
        href="/#savings"
        // Manual cycle for keyboard/reduced-motion users happens via the
        // rotation itself on pointer devices; the link's job is the ladder.
        className="relative block h-10 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        aria-label="See how Spend & Save works"
        data-track="cta"
        data-track-label="offer-ticker"
      >
        {FACTS.map((fact, i) => (
          <span
            key={fact.text}
            aria-hidden={i !== index}
            className={cn(
              'absolute inset-0 flex items-center justify-center gap-2 px-10 text-[12px] font-medium tracking-[0.08em] text-foreground/90',
              'transition-all duration-300 ease-swift motion-reduce:transition-none',
              i === index ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
              // Before hydration only the first fact is visible (SSR parity).
              state === 'unknown' && i !== 0 && 'opacity-0',
            )}
          >
            {fact.pill ? (
              <span className="animate-pop-in rounded-full bg-brand-ember px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white motion-reduce:animate-none">
                {fact.pill}
              </span>
            ) : null}
            <span className="truncate uppercase">{fact.text}</span>
          </span>
        ))}
      </Link>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss offers"
        className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
