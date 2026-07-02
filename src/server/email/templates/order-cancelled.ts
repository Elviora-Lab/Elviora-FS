import 'server-only';

import { siteConfig } from '@/config/site';

export function orderCancelledEmail({ orderNumber }: { orderNumber: string }) {
  const subject = `Your ${siteConfig.name} order ${orderNumber} was cancelled`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #15171B;">
      <h1 style="font-weight: 300; letter-spacing: 0.12em; text-transform: uppercase; font-size: 18px;">${siteConfig.name}</h1>
      <h2 style="font-weight: 300; font-size: 28px; margin: 24px 0 8px;">Order cancelled.</h2>
      <p style="line-height: 1.6;">Order <strong>${orderNumber}</strong> has been cancelled. If you already paid, your refund will follow through your original payment method.</p>
      <p style="line-height: 1.6; margin-top: 16px;">If this wasn't expected, just reply to this email and we'll make it right.</p>
      <p style="margin-top: 32px;"><a href="${siteConfig.url}/products" style="color: #15171B; font-weight: 600;">Continue shopping →</a></p>
    </div>
  `;
  return { subject, html };
}
