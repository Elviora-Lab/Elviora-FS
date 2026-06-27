import * as Sentry from '@sentry/nextjs';

/**
 * Sentry init for the Edge runtime (middleware, edge routes). Imported from
 * `instrumentation.ts`'s `register()`. No-op when the DSN is unset.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? 'development',
    tracesSampleRate: process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' ? 0.1 : 1.0,
  });
}
