'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Last-touch UTM capture. Whenever a landing (or client navigation) carries
 * `utm_*` params, store them in a first-party cookie (overwrite = last-touch).
 * The cookie is read server-side at checkout to stamp the order, powering
 * first-party campaign attribution on /admin/pixel. Reads `window.location`
 * directly (not useSearchParams) so it needs no Suspense boundary in the layout.
 */
const COOKIE = 'elv_utm';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function UtmCapture() {
  const pathname = usePathname();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('utm_source');
    const medium = params.get('utm_medium');
    const campaign = params.get('utm_campaign');
    if (!source && !medium && !campaign) return; // last-touch: only set when this visit has UTMs

    const value = JSON.stringify({
      s: (source ?? '').slice(0, 120),
      m: (medium ?? '').slice(0, 120),
      c: (campaign ?? '').slice(0, 160),
    });
    document.cookie = `${COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
  }, [pathname]);

  return null;
}
