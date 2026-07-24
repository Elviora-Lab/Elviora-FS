'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { currentPromotion, promotionHeadline } from '@/config/promotions';

import { cn } from '@/lib/cn';

// During the Azadi campaign, only free delivery runs alongside the sale — the
// other promos are paused so nothing competes with AZADI10. The active campaign
// headline is prepended in the component so it leads the marquee.
// (Re-enable a message by uncommenting it.)
const MESSAGES = [
  '🚚 Free shipping on orders over Rs 8,000',
  // '🎁 Spend Rs 1,000, save Rs 50 — up to Rs 250 off',
  // '✨ 10% off your first order — code WELCOME10',
  // '💳 Cash on delivery available',
  // '↩️ Easy 2–3 day returns',
];

const DISMISS_KEY = 'elv_announce_dismissed';

function Row({ messages, ariaHidden = false }: { messages: string[]; ariaHidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden}>
      {messages.map((m, i) => (
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
  // 'unknown' until we've read sessionStorage on the client — rendering
  // nothing during SSR/first paint means a dismissed bar never flashes.
  const [state, setState] = useState<'unknown' | 'shown' | 'hidden'>('unknown');
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    try {
      setState(window.sessionStorage.getItem(DISMISS_KEY) === '1' ? 'hidden' : 'shown');
    } catch {
      setState('shown'); // storage disabled — just show it
    }
  }, []);

  if (state !== 'shown') return null;

  const active = currentPromotion();
  const messages = active ? [promotionHeadline(active.promo, active.phase), ...MESSAGES] : MESSAGES;

  function dismiss() {
    setState('hidden');
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* best-effort */
    }
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        // Festive emerald + gold while a campaign runs; default ink otherwise.
        active ? 'bg-[#0a4b32] text-brand-champagne' : 'bg-foreground text-background',
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={cn(
          'flex w-max animate-marquee py-2 motion-reduce:animate-none',
          paused && '[animation-play-state:paused]',
        )}
      >
        <Row messages={messages} />
        <Row messages={messages} ariaHidden />
      </div>

      {/* Fade + dismiss on the right so text doesn't run under the button. */}
      <div
        className={cn(
          'absolute right-0 top-0 flex h-full items-center bg-gradient-to-l to-transparent pl-8 pr-1.5',
          active ? 'from-[#0a4b32] via-[#0a4b32]' : 'from-foreground via-foreground',
        )}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcements"
          className={cn(
            'grid size-6 place-items-center rounded-full transition-colors',
            active
              ? 'text-brand-champagne/70 hover:bg-white/10 hover:text-brand-champagne'
              : 'text-background/70 hover:bg-background/10 hover:text-background',
          )}
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
