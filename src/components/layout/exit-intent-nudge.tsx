'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Gift } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useCart } from '@/features/cart/hooks/use-cart';

const SHOWN_KEY = 'elv_exit_shown';
const CODE = 'WELCOME10';

/**
 * Exit-intent nudge — when a shopper with items in their bag moves to leave
 * (cursor darts to the top of the window), gently offer the first-order code so
 * the near-miss converts instead of bouncing. Desktop only (touch has no
 * reliable exit signal) and shown at most once per session.
 */
export function ExitIntentNudge() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const fired = useRef(false);
  const countRef = useRef(count);
  countRef.current = count;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Skip touch devices — no meaningful "leaving" gesture.
    if (window.matchMedia?.('(pointer: coarse)').matches) return;
    try {
      if (window.sessionStorage.getItem(SHOWN_KEY) === '1') return;
    } catch {
      /* storage disabled */
    }

    function onMouseOut(e: MouseEvent) {
      if (fired.current) return;
      // Only when the cursor exits the top of the window with items in the bag.
      if (e.clientY > 8 || e.relatedTarget || countRef.current <= 0) return;
      fired.current = true;
      setOpen(true);
      try {
        window.sessionStorage.setItem(SHOWN_KEY, '1');
      } catch {
        /* best-effort */
      }
    }

    document.addEventListener('mouseout', onMouseOut);
    return () => document.removeEventListener('mouseout', onMouseOut);
  }, []);

  function copyCode() {
    navigator.clipboard?.writeText(CODE).then(
      () => toast.success('Code copied'),
      () => undefined,
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="size-5 text-accent" /> Wait — here&apos;s 10% off
          </DialogTitle>
          <DialogDescription>
            Don&apos;t leave your bag behind. Use this code at checkout and save 10% on your first
            order.
          </DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onClick={copyCode}
          className="w-full rounded-md border border-dashed border-accent bg-accent/10 py-3 text-center font-mono text-lg font-semibold tracking-[0.3em] transition-colors hover:bg-accent/15"
          aria-label={`Copy code ${CODE}`}
        >
          {CODE}
        </button>

        <Button asChild size="lg" variant="gold" uppercase onClick={() => setOpen(false)}>
          <Link href="/checkout">Complete my order</Link>
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          No thanks
        </button>
      </DialogContent>
    </Dialog>
  );
}
