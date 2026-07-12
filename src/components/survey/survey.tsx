'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

import { submitSurvey } from '@/server/actions/survey.actions';

type Kind = 'exit_intent' | 'post_purchase';

/**
 * On-site micro-survey — a small, dismissible, one-question card that collects
 * zero-party data (the qualitative "why"). Shows at most once per browser
 * (localStorage). Triggers:
 *   - `immediate` — after a short beat (post-purchase, on the success page).
 *   - `exit`      — on exit-intent (desktop) or a dwell fallback (mobile).
 */
export function Survey({
  kind,
  question,
  prompt,
  options,
  orderId,
  trigger = 'immediate',
  delayMs = 40000,
  skipPaths = [],
}: {
  kind: Kind;
  question: string;
  prompt: string;
  options: string[];
  orderId?: string;
  trigger?: 'immediate' | 'dwell';
  delayMs?: number;
  skipPaths?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    const key = `survey_seen_${kind}`;
    if (localStorage.getItem(key)) return;
    if (skipPaths.some((p) => window.location.pathname.startsWith(p))) return;

    const reveal = () => {
      if (shown.current) return;
      shown.current = true;
      localStorage.setItem(key, '1'); // ask at most once — never nag
      setOpen(true);
    };

    // `immediate` shows after a short beat; `dwell` after a longer browse. We
    // deliberately do NOT hook exit-intent — the storefront's ExitIntentNudge
    // already owns that moment, and two exit popups would be hostile.
    const t = setTimeout(reveal, trigger === 'immediate' ? 1200 : delayMs);
    return () => clearTimeout(t);
  }, [kind, trigger, delayMs, skipPaths]);

  async function answer(value: string) {
    setDone(true);
    try {
      await submitSurvey({
        kind,
        question,
        answer: value.slice(0, 500),
        orderId,
        pagePath: window.location.pathname,
      });
    } catch {
      /* best-effort — a survey hiccup must never bother the shopper */
    }
    setTimeout(() => setOpen(false), 1600);
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(92vw,340px)] rounded-xl border border-border bg-card p-4 shadow-elevated">
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Dismiss"
        className="absolute right-2 top-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
      {done ? (
        <p className="py-2 text-sm text-success">Thank you — that really helps us. 🤍</p>
      ) : (
        <>
          <p className="mb-3 pr-4 text-sm font-medium">{prompt}</p>
          <div className="flex flex-col gap-2">
            {options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => answer(o)}
                className="rounded-md border border-border px-3 py-2 text-left text-sm transition-colors hover:border-foreground/40 hover:bg-muted"
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
