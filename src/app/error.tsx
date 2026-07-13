'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    // eslint-disable-next-line no-console
    console.error('App error:', error);
  }, [error]);

  return (
    <main className="grid min-h-[60vh] place-items-center px-6 py-20">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="eyebrow">Something interrupted us</span>
        <h1 className="editorial-heading text-display-md">An unexpected error occurred.</h1>
        <p className="text-sm text-muted-foreground">
          Please try again. If the issue persists, our concierge is here to help.
        </p>
        <Button onClick={reset} size="lg" className="mt-2">
          Try again
        </Button>
        {error.digest ? (
          // A traceable reference: this hash also appears in the server logs, so
          // a shopper who reports it lets us find the exact error.
          <p className="mt-1 font-mono text-[11px] text-muted-foreground/60">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}
