import * as Sentry from '@sentry/nextjs';

/**
 * Next.js instrumentation hook — runs once when a server instance boots.
 * Initializes Sentry per-runtime and wires domain-event listeners. Listeners
 * touch Prisma, so they only register in the Node runtime (never Edge).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
    const { registerEventListeners } = await import('@/server/events/listeners');
    registerEventListeners();
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Lets Sentry capture errors thrown in nested React Server Components.
export const onRequestError = Sentry.captureRequestError;
