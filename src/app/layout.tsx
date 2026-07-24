import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';

import { AppProviders } from '@/providers/app-providers';

import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/json-ld';
import { JsonLd } from '@/lib/seo/json-ld-component';
import { defaultMetadata } from '@/lib/seo/metadata';

import { CapiParamInit } from '@/components/analytics/capi-param-init';
import { Clarity } from '@/components/analytics/clarity';
import { ClickTracker } from '@/components/analytics/click-tracker';
import { GaIdentity } from '@/components/analytics/ga-identity';
// Paused: GTM (GTM-NFSGW8RX) now manages GA4 client-side — loading gtag directly
// too would double-count. Re-enable if you remove the GA4 tag from GTM.
// import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import {
  GoogleTagManager,
  GoogleTagManagerNoScript,
} from '@/components/analytics/google-tag-manager';
import { MetaIdentity } from '@/components/analytics/meta-identity';
import { MetaPixel } from '@/components/analytics/meta-pixel';
import { UtmCapture } from '@/components/analytics/utm-capture';

import '@/styles/globals.css';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBF7EF' },
    { media: '(prefers-color-scheme: dark)', color: '#15171B' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {/* GTM <noscript> must be the first thing inside <body>. */}
        <GoogleTagManagerNoScript />
        <GoogleTagManager />
        <MetaPixel />
        <Clarity />
        <CapiParamInit />
        <UtmCapture />
        <ClickTracker />
        {/* Paused — GTM now owns GA4 (see google-tag-manager.tsx). Re-enable with the import above. */}
        {/* <GoogleAnalytics /> */}
        <AppProviders>
          <GaIdentity />
          <MetaIdentity />
          {children}
        </AppProviders>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
      </body>
    </html>
  );
}
