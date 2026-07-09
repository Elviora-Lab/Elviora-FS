import { cookies, headers } from 'next/headers';
import { z } from 'zod';

import { publicEnv } from '@/config/env';

import { capiEnabled, sendCapiEvent } from '@/server/analytics/meta-capi';
import { getSession } from '@/server/auth/get-session';
import { getGuestId } from '@/server/auth/guest-session';
import { createHandler } from '@/server/http/handler';
import { apiNoContent } from '@/server/http/response';

export const runtime = 'nodejs';

/**
 * Client → server relay for Meta Conversions API events.
 *
 * The browser fires the pixel event with an `eventId`; the browser then beacons
 * that same id here so we send the CAPI twin server-side with advanced matching
 * (session email + guest id + `_fbp`/`_fbc` cookies + IP/UA). Meta dedupes the
 * pair on `event_id` + `event_name`, so it counts once but with far better match
 * quality than the browser event alone.
 *
 * Purchase is NOT relayed here — it's sent from `checkout.actions` where the
 * full order + shipping details give even richer matching. This endpoint covers
 * the mid-funnel events (`AddToCart`, `InitiateCheckout`).
 *
 * Best-effort: always resolves 204 and never throws, so a tracking hiccup can
 * never surface to the shopper.
 */

const bodySchema = z.object({
  event: z.enum(['AddToCart', 'InitiateCheckout']),
  eventId: z.string().min(1).max(100),
  eventSourceUrl: z.string().url().optional(),
  customData: z.record(z.unknown()).optional(),
});

export const POST = createHandler(async (req) => {
  // Nothing to do unless CAPI is configured.
  if (!capiEnabled()) return apiNoContent();

  // Same-origin guard — only accept beacons from our own site.
  const origin = req.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(publicEnv.NEXT_PUBLIC_SITE_URL).host) {
        return apiNoContent();
      }
    } catch {
      return apiNoContent();
    }
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiNoContent();
  const body = parsed.data;

  const [session, guestId, cookieStore, headerStore] = await Promise.all([
    getSession(req),
    getGuestId(),
    cookies(),
    headers(),
  ]);

  await sendCapiEvent({
    eventName: body.event,
    eventId: body.eventId,
    eventSourceUrl: body.eventSourceUrl,
    userData: {
      email: session?.email ?? null,
      externalId: session?.sub ?? guestId,
      clientIp: headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: headerStore.get('user-agent'),
      fbp: cookieStore.get('_fbp')?.value ?? null,
      fbc: cookieStore.get('_fbc')?.value ?? null,
    },
    customData: body.customData,
  });

  return apiNoContent();
});
