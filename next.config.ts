import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    // Vercel bills one Image Optimization "transformation" per unique
    // (source image, width, quality, format). Keep each generated variant
    // cached for 31 days so it isn't re-generated — and re-billed — when the
    // default 30-day cache lapses.
    minimumCacheTTL: 2678400,
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
