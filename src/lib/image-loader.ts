type ImageLoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

/**
 * Custom `next/image` loader.
 *
 * Instead of routing every image through Vercel's metered Image Optimization
 * (billed per unique source/width/quality/format — which exhausted the plan's
 * 5K/month transformation quota and stopped images from rendering), we resize
 * through each source CDN's own transform params. Result: responsive, optimized
 * images at the right width with ZERO Vercel transformations, because the
 * browser never hits `/_next/image`.
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  // Local/static assets (/public, Next static output) — serve directly.
  if (src.startsWith('/')) return src;

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }

  const host = url.hostname;

  // Shopify CDN — the entire product catalog. `?width=` triggers on-the-fly
  // resizing, and Shopify auto-negotiates WebP/AVIF via the Accept header.
  if (host === 'cdn.shopify.com' || host.endsWith('.shopify.com')) {
    url.searchParams.set('width', String(width));
    return url.toString();
  }

  // Unsplash — editorial imagery.
  if (host === 'images.unsplash.com') {
    url.searchParams.set('w', String(width));
    url.searchParams.set('q', String(quality ?? 75));
    url.searchParams.set('auto', 'format');
    return url.toString();
  }

  // Cloudinary — admin uploads. Inject a delivery transform after /upload/.
  if (host === 'res.cloudinary.com' && url.pathname.includes('/upload/')) {
    const transform = `w_${width},c_limit,q_${quality ?? 'auto'},f_auto`;
    url.pathname = url.pathname.replace('/upload/', `/upload/${transform}/`);
    return url.toString();
  }

  // Any other host (cdn.elviora.com, arbitrary admin URLs): serve as-is.
  return src;
}
