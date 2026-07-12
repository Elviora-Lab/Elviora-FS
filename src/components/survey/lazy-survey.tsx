'use client';

import dynamic from 'next/dynamic';

/**
 * Client-only, lazily-loaded Survey. It's a delayed overlay (post-purchase /
 * dwell), so it never needs to be in the first-load bundle — `ssr: false` keeps
 * its JS out until after hydration.
 */
export const Survey = dynamic(() => import('./survey').then((m) => m.Survey), { ssr: false });
