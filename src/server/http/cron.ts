import 'server-only';

import { serverEnv } from '@/config/env';

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
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return json({ error: 'Unauthorized' }, 401);
  }
  return null;
}
