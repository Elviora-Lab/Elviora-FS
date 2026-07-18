import { z } from 'zod';

import { prisma } from '@/lib/db';

import { getSession } from '@/server/auth/get-session';
import { getGuestId } from '@/server/auth/guest-session';
import { createHandler } from '@/server/http/handler';
import { isSameSiteRequest } from '@/server/http/origin';
import { clientIp, isRateLimited } from '@/server/http/rate-limit';
import { apiNoContent } from '@/server/http/response';

export const runtime = 'nodejs';

/**
 * First-party clickstream ingest.
 *
 * The browser's delegated click listener (`@/components/analytics/click-tracker`)
 * batches meaningful link/button clicks and `navigator.sendBeacon`s them here on
 * a timer / on page hide. This endpoint stamps server-derived identity
 * (session user + guest cookie) onto each row — the client never sends identity —
 * and bulk-inserts into `click_event_logs`.
 *
 * Best-effort by design: it always resolves 204 and never throws, so a tracking
 * hiccup can never surface to the shopper. Invalid/oversized payloads are
 * silently dropped rather than 4xx'd.
 */

const TARGET_TYPES = ['product', 'nav', 'cta', 'banner', 'link', 'button', 'other'] as const;

const clickSchema = z.object({
  targetType: z.enum(TARGET_TYPES),
  targetId: z.string().min(1).max(128).optional(),
  label: z.string().min(1).max(160).optional(),
  href: z.string().min(1).max(512).optional(),
  pagePath: z.string().min(1).max(512),
  position: z.number().int().min(0).max(1_000_000).optional(),
});

// Cap the batch so a malicious/buggy client can't insert thousands per request.
const bodySchema = z.object({ events: z.array(clickSchema).min(1).max(30) });

// Cheap crawler filter — clickstream should reflect humans, not bots.
const BOT_UA = /bot|crawl|spider|slurp|bing|headless|lighthouse|preview|monitor|curl|wget/i;

export const POST = createHandler(async (req) => {
  // Same-site guard — only accept beacons from our own pages. Requests with
  // neither a same-site Origin nor Referer are dropped (scripted traffic).
  if (!isSameSiteRequest(req)) return apiNoContent();

  // Throttle per IP; drop silently (204) so a flood can't poison the
  // clickstream or surface errors to the shopper.
  if (await isRateLimited({ key: `click:${clientIp(req)}`, limit: 30, windowSeconds: 60 })) {
    return apiNoContent();
  }

  const ua = req.headers.get('user-agent') ?? '';
  if (BOT_UA.test(ua)) return apiNoContent();

  // sendBeacon delivers a Blob; read as text so we tolerate any content-type.
  const raw = await req.text().catch(() => '');
  let json: unknown = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    return apiNoContent();
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiNoContent();

  // Never record back-office (/admin) activity — the clickstream is
  // storefront-only. Defense in depth: the client already skips these.
  const events = parsed.data.events.filter((e) => !e.pagePath.startsWith('/admin'));
  if (!events.length) return apiNoContent();

  const [session, guestId] = await Promise.all([getSession(req), getGuestId()]);
  const userId = session?.sub ?? null;

  try {
    await prisma.clickEventLog.createMany({
      data: events.map((e) => ({
        userId,
        guestId,
        targetType: e.targetType,
        targetId: e.targetId ?? null,
        label: e.label ?? null,
        href: e.href ?? null,
        pagePath: e.pagePath,
        position: e.position ?? null,
      })),
    });
  } catch {
    /* best-effort — never surface a tracking failure to the shopper */
  }

  return apiNoContent();
});
