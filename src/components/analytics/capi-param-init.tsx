'use client';

import { useEffect } from 'react';

import { pixelEnabled } from '@/lib/analytics/meta-pixel';

/**
 * Meta CAPI Parameter Builder — client side.
 *
 * On first mount it captures the `_fbp` / `_fbc` first-party cookies as early as
 * possible and — crucially — generates `_fbc` from a `?fbclid` ad-click param
 * when the cookie is absent, so ad-driven visits keep their click id. Our
 * server-side Conversions API calls (`@/server/analytics/meta-capi`) then read
 * those cookies, which materially lifts Event Match Quality for paid traffic.
 *
 * The package is a browser UMD bundle (references `self`), so it is loaded via a
 * dynamic import INSIDE the effect — effects never run during SSR, so the bundle
 * is only ever evaluated in the browser. Rendered in the root layout; only
 * active in production (mirrors the pixel).
 */
export function CapiParamInit() {
  useEffect(() => {
    if (!pixelEnabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const mod = await import('meta-capi-param-builder-clientjs');
        if (cancelled) return;
        if (typeof mod.processAndCollectAllParams === 'function') {
          await mod.processAndCollectAllParams(window.location.href);
        }
      } catch {
        /* best-effort — tracking must never break the page */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
