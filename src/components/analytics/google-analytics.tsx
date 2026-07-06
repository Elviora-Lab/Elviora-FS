'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

import { ga, GA_ID, gaEnabled } from '@/lib/analytics/google';

/**
 * Google Analytics 4 (gtag.js) base tag.
 *
 * Loads gtag once and lets the `config` call send the initial `page_view`, then
 * fires a fresh `page_view` on each client-side navigation (App Router route
 * changes don't reload the page, so gtag wouldn't see them otherwise). Rendered
 * in the root layout; only active in production when a Measurement ID is set.
 *
 * Mirror of `<MetaPixel />`. Like it, this keys page views on `usePathname`
 * only, so query-string-only navigations (e.g. `/search?q=…`) don't emit a new
 * page_view.
 */
export function GoogleAnalytics() {
  const pathname = usePathname();
  const initialised = useRef(false);

  useEffect(() => {
    if (!gaEnabled) return;
    // The `config` call already sends a page_view on first load — skip that
    // first effect run so it isn't double-counted, then fire on every route.
    if (!initialised.current) {
      initialised.current = true;
      return;
    }
    ga.pageView({ page_location: window.location.href, page_title: document.title });
  }, [pathname]);

  if (!gaEnabled) return null;

  return (
    <>
      <Script
        id="ga-gtag-loader"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script id="ga-gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
