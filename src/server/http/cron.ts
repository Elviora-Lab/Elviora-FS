import 'server-only';

import { timingSafeEqual } from 'node:crypto';

import { serverEnv } from '@/config/env';

/** Constant-time string comparison — a plain `!==` short-circuits on the first
 *  differing byte, leaking the secret's prefix through response timing. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Guard for cron endpoints. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
 * Returns a Response to short-circuit when unauthorized, or null when allowed.
 */
export function cronAuthError(req: Request): Response | null {
  const secret = serverEnv.CRON_SECRET;
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });

  if (!secret) return json({ error: 'CRON_SECRET is not configured' }, 503);
  const header = req.headers.get('authorization') ?? '';
  if (!safeEqual(header, `Bearer ${secret}`)) {
    return json({ error: 'Unauthorized' }, 401);
  }
  return null;
}
