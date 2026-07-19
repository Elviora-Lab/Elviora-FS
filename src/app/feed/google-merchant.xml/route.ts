import { siteConfig } from '@/config/site';

import { prisma } from '@/lib/db';

// Regenerate at most hourly — Merchant Center refetches on its own schedule.
export const revalidate = 3600;

const XML_ESCAPES: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  "'": '&apos;',
  '"': '&quot;',
};
const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => XML_ESCAPES[c]!);

/**
 * Google Merchant Center product feed (RSS 2.0 + the g: namespace).
 *
 * Served at /feed/google-merchant.xml. Point Merchant Center at this URL as a
 * scheduled fetch. We have no GTINs in the catalog, so we declare
 * `identifier_exists=no` and rely on brand — the correct signal for a brand
 * whose items don't carry manufacturer barcodes.
 */
export async function GET() {
  const products = await prisma.product
    .findMany({
      where: { isActive: true },
      select: {
        name: true,
        slug: true,
        sku: true,
        shortDescription: true,
        fullDescription: true,
        price: true,
        comparePrice: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          select: { imageUrl: true },
        },
        variants: { where: { isActive: true }, select: { price: true, stockQuantity: true } },
      },
    })
    .catch(() => []);

  const items = products
    .map((p) => {
      const image = p.images[0]?.imageUrl;
      if (!image) return ''; // Merchant Center requires an image_link.

      const link = `${siteConfig.url}/products/${p.slug}`;
      const variantPrices = p.variants.map((v) => Number(v.price)).filter((n) => n > 0);
      const price = variantPrices.length ? Math.min(...variantPrices) : Number(p.price);
      const compare = p.comparePrice ? Number(p.comparePrice) : 0;
      const inStock = p.variants.some((v) => v.stockQuantity > 0);
      const description = (p.shortDescription || p.fullDescription || p.name).slice(0, 4900);
      const onSale = compare > price;

      const priceTags = onSale
        ? `<g:price>${compare.toFixed(2)} PKR</g:price><g:sale_price>${price.toFixed(2)} PKR</g:sale_price>`
        : `<g:price>${price.toFixed(2)} PKR</g:price>`;

      const additionalImages = p.images
        .slice(1, 11)
        .map((i) => `<g:additional_image_link>${esc(i.imageUrl)}</g:additional_image_link>`)
        .join('');

      return `<item>
  <g:id>${esc(p.sku)}</g:id>
  <title>${esc(p.name)}</title>
  <description>${esc(description)}</description>
  <link>${esc(link)}</link>
  <g:image_link>${esc(image)}</g:image_link>
  ${additionalImages}
  <g:availability>${inStock ? 'in_stock' : 'out_of_stock'}</g:availability>
  ${priceTags}
  <g:brand>${esc(p.brand?.name || siteConfig.name)}</g:brand>
  <g:condition>new</g:condition>
  <g:identifier_exists>no</g:identifier_exists>
  <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining</g:google_product_category>
  ${p.category?.name ? `<g:product_type>${esc(p.category.name)}</g:product_type>` : ''}
</item>`;
    })
    .filter(Boolean)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${esc(siteConfig.name)}</title>
<link>${siteConfig.url}</link>
<description>${esc(siteConfig.description)}</description>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
