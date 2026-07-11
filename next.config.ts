import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

// Report-only Content-Security-Policy. Sources reflect what the app actually
// loads: Next inline hydration ('unsafe-inline'/'unsafe-eval'), GA/GTM, Meta
// Pixel, Sentry, and the image CDNs (Shopify/Supabase/Unsplash/Cloudinary via
// img-src https:). Kept report-only until console shows no legitimate breakage.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.google-analytics.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://connect.facebook.net https://*.facebook.com https://*.supabase.co https://*.sentry.io",
  'frame-src https://www.facebook.com https://td.doubleclick.net',
  "manifest-src 'self'",
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    // Resize through each source CDN (Shopify/Unsplash/Cloudinary) via a custom
    // loader instead of Vercel's metered Image Optimization — the plan's 5K/mo
    // transformation quota was being exhausted, which stopped images rendering.
    // With a loaderFile the optimizer is bypassed entirely (zero transforms);
    // deviceSizes/imageSizes below still drive the responsive srcSet widths.
    loaderFile: './src/lib/image-loader.ts',
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'cdn.elviora.com' },
      // Imported catalog (data/products.json) serves images from Shopify's CDN.
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      // Admins can attach product images by pasting arbitrary HTTPS URLs or
      // uploading to object storage, so allow any HTTPS host for next/image.
      { protocol: 'https', hostname: '**' },
    ],
    // Trimmed width ladders (was 9 device + 8 image sizes) — fewer widths means
    // fewer transformations per image, with negligible impact on how closely a
    // rendered image matches its display size.
    deviceSizes: [640, 828, 1080, 1440, 1920],
    imageSizes: [64, 128, 256, 384],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-icons'],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Force HTTPS for two years incl. subdomains (HSTS preload-eligible).
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Report-only first: this does NOT block anything — it logs violations
          // to the browser console so we can tighten to an enforcing policy
          // safely once we've confirmed nothing legitimate is flagged.
          { key: 'Content-Security-Policy-Report-Only', value: CSP_REPORT_ONLY },
        ],
      },
    ];
  },
};

// Only wrap with Sentry when a DSN is configured (production/preview). The
// Sentry build plugin injects client instrumentation that, in local dev with
// no DSN, triggers Next's "missing bootstrap script" invariant — and there's
// nothing to report to anyway. So local dev runs the plain config.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      telemetry: false,
    })
  : nextConfig;
