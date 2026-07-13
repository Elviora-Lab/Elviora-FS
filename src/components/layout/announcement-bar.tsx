'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/cn';

// Repeated exposure to reasons-to-buy: the Spend & Save reward, the free-shipping
// threshold, the first-order code, and COD/returns reassurance.
const MESSAGES = [
  '🎁 Spend Rs 1,000, save Rs 50 — up to Rs 250 off',
  '🚚 Free shipping on orders over Rs 8,000',
  '✨ 10% off your first order — code WELCOME10',
  '💳 Cash on delivery available',
  '↩️ Easy 2–3 day returns',
];

const DISMISS_KEY = 'elv_announce_dismissed';

function Row({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden}>
      {MESSAGES.map((m, i) => (
        <span
          key={i}
          className="mx-6 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.14em]"
        >
          {m}
        </span>
      ))}
    </div>
  );
}

export function AnnouncementBar() {
  const [hidden, setHidden] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY) === '1') setHidden(true);
    } catch {
      /* storage disabled */
    }
  }, []);

  if (hidden) return null;

  function dismiss() {
    setHidden(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* best-effort */
    }
  }

  return (
    <div
      className="relative overflow-hidden bg-foreground text-background"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={cn(
          'flex w-max animate-marquee py-2 motion-reduce:animate-none',
          paused && '[animation-play-state:paused]',
        )}
      >
        <Row />
        <Row ariaHidden />
      </div>

      {/* Fade + dismiss on the right so text doesn't run under the button. */}
      <div className="absolute right-0 top-0 flex h-full items-center bg-gradient-to-l from-foreground via-foreground to-transparent pl-8 pr-1.5">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcements"
          className="grid size-6 place-items-center rounded-full text-background/70 transition-colors hover:bg-background/10 hover:text-background"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
