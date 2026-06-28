import 'server-only';

import { siteConfig } from '@/config/site';

export function backInStockEmail({
  productName,
  productSlug,
}: {
  productName: string;
  productSlug: string;
}) {
  const url = `${siteConfig.url}/products/${productSlug}`;
  const subject = `${productName} is back in stock`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #15171B;">
      <h1 style="font-weight: 300; letter-spacing: 0.12em; text-transform: uppercase; font-size: 18px;">${siteConfig.name}</h1>
      <h2 style="font-weight: 300; font-size: 28px; margin: 24px 0 8px;">It's back.</h2>
      <p style="line-height: 1.6;"><strong>${productName}</strong> is available again — but it won't last long.</p>
      <p style="margin: 28px 0;">
        <a href="${url}" style="display: inline-block; background: #15171B; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Shop it now</a>
      </p>
    </div>
  `;
  const text = `${productName} is back in stock at ${siteConfig.name}: ${url}`;
  return { subject, html, text };
}
