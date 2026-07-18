import { cookies, headers } from 'next/headers';
import { z } from 'zod';

import { prisma } from '@/lib/db';

import { capiEnabled, type CapiUserData, sendCapiEvent } from '@/server/analytics/meta-capi';
import { getSession } from '@/server/auth/get-session';
import { getGuestId } from '@/server/auth/guest-session';
import { createHandler } from '@/server/http/handler';
import { isSameSiteRequest } from '@/server/http/origin';
import { clientIp, isRateLimited } from '@/server/http/rate-limit';
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
 * the mid-funnel events (`AddToCart`, `InitiateCheckout`, `AddPaymentInfo`).
 *
 * Match quality: for logged-in shoppers we enrich `user_data` with the phone,
 * name and city/country on file (see `loadMatchData`) on top of the email +
 * external_id + cookies/IP/UA — lifting Event Match Quality on these mid-funnel
 * events, which Meta's Events Manager flags as under-matched.
 *
 * Best-effort: always resolves 204 and never throws, so a tracking hiccup can
 * never surface to the shopper.
 */

const bodySchema = z.object({
  event: z.enum(['AddToCart', 'InitiateCheckout', 'AddPaymentInfo']),
  eventId: z.string().min(1).max(100),
  eventSourceUrl: z.string().url().optional(),
  customData: z.record(z.unknown()).optional(),
});

/**
 * Additional CAPI match keys for a logged-in user — phone, name and the default
 * address's city/country. These aren't in the JWT (only sub/email/role are), so
 * we read them from the profile. Best-effort: returns {} on any error, and null
 * fields are simply omitted by `buildUserData`.
 */
async function loadMatchData(userId: string | undefined): Promise<Partial<CapiUserData>> {
  if (!userId) return {};
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phone: true,
        firstName: true,
        lastName: true,
        addresses: {
          where: { isDefault: true },
          select: { phone: true, city: true, country: true },
          take: 1,
        },
      },
    });
    if (!user) return {};
    const addr = user.addresses[0];
    return {
      phone: user.phone ?? addr?.phone ?? null,
      firstName: user.firstName,
      lastName: user.lastName,
      city: addr?.city ?? null,
      country: addr?.country ?? null,
    };
  } catch {
    return {};
  }
}

export const POST = createHandler(async (req) => {
  // Nothing to do unless CAPI is configured.
  if (!capiEnabled()) return apiNoContent();

  // Same-site guard — only accept beacons from our own pages. Requests with
  // neither a same-site Origin nor Referer are dropped (scripted traffic).
  if (!isSameSiteRequest(req)) return apiNoContent();

  // Throttle per IP; drop silently (204) so a flood can't inflate CAPI events.
  if (await isRateLimited({ key: `track:${clientIp(req)}`, limit: 30, windowSeconds: 60 })) {
    return apiNoContent();
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

  const match = await loadMatchData(session?.sub);

  await sendCapiEvent({
    eventName: body.event,
    eventId: body.eventId,
    eventSourceUrl: body.eventSourceUrl,
    userData: {
      email: session?.email ?? null,
      phone: match.phone ?? null,
      firstName: match.firstName ?? null,
      lastName: match.lastName ?? null,
      city: match.city ?? null,
      country: match.country ?? null,
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
