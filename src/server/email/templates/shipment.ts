import 'server-only';

import { siteConfig } from '@/config/site';

export function shipmentEmail({
  orderNumber,
  courierName,
  trackingNumber,
}: {
  orderNumber: string;
  courierName?: string | null;
  trackingNumber?: string | null;
}) {
  const subject = `Your ${siteConfig.name} order ${orderNumber} has shipped`;
  const tracking = trackingNumber
    ? `<p style="line-height: 1.6; margin-top: 16px;">Courier: <strong>${courierName ?? 'Courier'}</strong><br/>Tracking #: <strong>${trackingNumber}</strong></p>`
    : '';
  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #15171B;">
      <h1 style="font-weight: 300; letter-spacing: 0.12em; text-transform: uppercase; font-size: 18px;">${siteConfig.name}</h1>
      <h2 style="font-weight: 300; font-size: 28px; margin: 24px 0 8px;">Your order is on its way.</h2>
      <p style="line-height: 1.6;">Order <strong>${orderNumber}</strong> has shipped and is heading to you.</p>
      ${tracking}
      <p style="margin-top: 32px;"><a href="${siteConfig.url}/account/orders" style="color: #15171B; font-weight: 600;">Track your order →</a></p>
    </div>
  `;
  const text = `Your ${siteConfig.name} order ${orderNumber} has shipped.${
    trackingNumber ? ` Tracking #: ${trackingNumber} (${courierName ?? 'Courier'}).` : ''
  }`;
  return { subject, html, text };
}
