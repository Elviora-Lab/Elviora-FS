'use client';

import dynamic from 'next/dynamic';

/**
 * Below-the-fold homepage sections, loaded client-side after hydration
 * (`ssr: false`) so their JavaScript stays out of the initial page bundle.
 * The shopper sees a skeleton (matched height → no layout shift) until the
 * chunk arrives, which they never notice because these sit far down the page.
 */
export const ShadeSpotlight = dynamic(
  () => import('./shade-spotlight').then((m) => m.ShadeSpotlight),
  {
    ssr: false,
    loading: () => <div className="shimmer h-[28rem] w-full rounded-lg bg-muted/40" />,
  },
);
