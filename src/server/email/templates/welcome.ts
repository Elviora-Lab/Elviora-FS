import 'server-only';

import { siteConfig } from '@/config/site';

export function welcomeEmail({ name }: { name: string }) {
  const subject = `Welcome to ${siteConfig.name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #15171B;">
      <h1 style="font-weight: 300; letter-spacing: 0.12em; text-transform: uppercase; font-size: 18px;">${siteConfig.name}</h1>
      <h2 style="font-weight: 300; font-size: 32px; margin: 24px 0 8px;">Welcome, ${name}.</h2>
      <p style="line-height: 1.6;">Thank you for joining us. Your ritual begins now.</p>
      <p style="margin-top: 32px;"><a href="${siteConfig.url}/products" style="color: #15171B; font-weight: 600;">Explore the edit →</a></p>
    </div>
  `;
  return { subject, html };
}
