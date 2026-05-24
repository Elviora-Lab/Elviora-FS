'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
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
      </div>
    </main>
  );
}
