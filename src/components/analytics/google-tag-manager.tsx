'use client';

import Script from 'next/script';

import { isProd, publicEnv } from '@/config/env';

/**
 * Google Tag Manager — container loader + <noscript> fallback.
 *
 * GTM lets you manage marketing/analytics tags (GA, ads pixels, …) from the GTM
 * UI without code changes. Two parts, mirroring Google's snippet: the loader
 * script (rendered afterInteractive) and a <noscript> iframe that must sit right
 * after <body> opens. Both load in production only, and only when a container id
 * is configured (`NEXT_PUBLIC_GTM_ID`).
 *
 * ⚠️ If this container also fires a GA4 tag for the same property as
 * `<GoogleAnalytics />` (G-8YZQ1VCSM3), events DOUBLE-COUNT. Use GTM *or* the
 * direct gtag for GA4 — not both.
 */
export const GTM_ID = publicEnv.NEXT_PUBLIC_GTM_ID;
export const gtmEnabled = isProd && Boolean(GTM_ID);

/** GTM loader — goes in <head> per Google; afterInteractive is Next's equivalent. */
export function GoogleTagManager() {
  if (!gtmEnabled) return null;
  return (
    <Script id="gtm-base" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}

/** GTM <noscript> fallback — must render immediately after <body> opens. */
export function GoogleTagManagerNoScript() {
  if (!gtmEnabled) return null;
  return (
    <noscript>
      <iframe
        title="Google Tag Manager"
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}
