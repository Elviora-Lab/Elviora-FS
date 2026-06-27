import * as Sentry from '@sentry/nextjs';

/**
 * Sentry init for the Node.js server runtime. Imported from
 * `instrumentation.ts`'s `register()`. No-op when the DSN is unset, so local
 * dev and unconfigured environments don't emit or error.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? 'development',
    tracesSampleRate: process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' ? 0.1 : 1.0,
  });
}
