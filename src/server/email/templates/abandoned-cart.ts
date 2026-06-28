import 'server-only';

import { siteConfig } from '@/config/site';

export function abandonedCartEmail({
  name,
  itemNames,
}: {
  name?: string | null;
  itemNames: string[];
}) {
  const subject = `You left something behind at ${siteConfig.name}`;
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const list = itemNames
    .slice(0, 6)
    .map((n) => `<li style="margin: 4px 0;">${n}</li>`)
    .join('');
  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #15171B;">
      <h1 style="font-weight: 300; letter-spacing: 0.12em; text-transform: uppercase; font-size: 18px;">${siteConfig.name}</h1>
      <h2 style="font-weight: 300; font-size: 28px; margin: 24px 0 8px;">Your edit is waiting.</h2>
      <p style="line-height: 1.6;">${greeting} you left these in your bag:</p>
      <ul style="line-height: 1.6; padding-left: 20px;">${list}</ul>
      <p style="margin: 28px 0;">
        <a href="${siteConfig.url}/cart" style="display: inline-block; background: #15171B; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Return to your bag</a>
      </p>
      <p style="line-height: 1.6; font-size: 13px; color: #6b7280;">Items sell out fast — complete your order before they're gone.</p>
    </div>
  `;
  const text = `${greeting} you left ${itemNames.length} item(s) in your ${siteConfig.name} bag. Complete your order: ${siteConfig.url}/cart`;
  return { subject, html, text };
}
