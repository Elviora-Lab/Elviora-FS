'use client';

import Script from 'next/script';

import { isProd, publicEnv } from '@/config/env';

/**
 * Microsoft Clarity — free session replay + heatmaps. Watch how real shoppers
 * move through the store (hesitations, rage-clicks, drop-off points) — the
 * highest-signal way to learn from low traffic. Loads in production only, and
 * only when a project id is configured. View recordings at clarity.microsoft.com.
 */
export function Clarity() {
  const id = publicEnv.NEXT_PUBLIC_CLARITY_ID;
  if (!isProd || !id) return null;

  return (
    <Script id="ms-clarity" strategy="lazyOnload">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${id}");`}
    </Script>
  );
}
