import 'server-only';

import { siteConfig } from '@/config/site';

export function passwordResetEmail({ resetUrl }: { resetUrl: string }) {
  const subject = `Reset your ${siteConfig.name} password`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #15171B;">
      <h1 style="font-weight: 300; letter-spacing: 0.12em; text-transform: uppercase; font-size: 18px;">${siteConfig.name}</h1>
      <h2 style="font-weight: 300; font-size: 28px; margin: 24px 0 8px;">Reset your password</h2>
      <p style="line-height: 1.6;">We received a request to reset your password. Click the button below to choose a new one. This link expires in 30 minutes.</p>
      <p style="margin: 28px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #15171B; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Set a new password</a>
      </p>
      <p style="line-height: 1.6; font-size: 13px; color: #6b7280;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
      <p style="line-height: 1.6; font-size: 12px; color: #9ca3af; margin-top: 16px; word-break: break-all;">${resetUrl}</p>
    </div>
  `;
  const text = `Reset your ${siteConfig.name} password (link expires in 30 minutes): ${resetUrl}`;
  return { subject, html, text };
}
