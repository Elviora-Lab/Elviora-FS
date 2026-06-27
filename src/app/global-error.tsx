'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Catches errors thrown in the root layout (which `error.tsx` cannot). Must
 * render its own <html>/<body>. Reports to Sentry, then shows a minimal shell.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '100vh',
          fontFamily: 'Georgia, serif',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontWeight: 300 }}>Something went wrong</h1>
          <p style={{ color: '#666' }}>Please try again.</p>
          <button onClick={reset} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
