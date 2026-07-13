import 'server-only';

import { isProd, publicEnv, serverEnv } from '@/config/env';

/**
 * Google Analytics 4 — Measurement Protocol (server-side events).
 *
 * The server twin of the browser gtag.js tag (`@/lib/analytics/google`): browser
 * events are increasingly blocked, so we also send the important conversions
 * (Purchase, Refund) straight from the server. GA4 dedupes a browser + server
 * event that share the same `transaction_id`, exactly like Meta's CAPI dedupes
 * on `event_id` — so counting stays correct while coverage improves.
 *
 * No-ops safely unless `GA_API_SECRET` and a Measurement ID are configured.
 *
 * @see https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */

const ENDPOINT = 'https://www.google-analytics.com/mp/collect';

export function gaMpEnabled(): boolean {
  // Gate on `isProd` (matching the browser gtag) so local/preview orders never
  // send a real server-side Purchase/Refund to the production GA4 property.
  return Boolean(isProd && serverEnv.GA_API_SECRET && publicEnv.NEXT_PUBLIC_GA_ID);
}

/**
 * Extract the GA4 `client_id` from a raw `_ga` cookie value. The cookie looks
 * like `GA1.1.1234567890.1728000000`; the client_id is the trailing
 * `<random>.<timestamp>` pair. Returns null when the cookie is absent/malformed
 * so the caller can decide whether to synthesize a fallback.
 */
export function clientIdFromGaCookie(gaCookie: string | null | undefined): string | null {
  if (!gaCookie) return null;
  // `GA1.<domainDepth>.<random>.<timestamp>` → keep the last two segments.
  const parts = gaCookie.split('.');
  if (parts.length < 4) return null;
  return parts.slice(-2).join('.');
}

/** GA4 client_id fallback (`<uint32>.<unixSeconds>`) when no `_ga` cookie. */
function fallbackClientId(): string {
  const rand = Math.floor(Math.random() * 2 ** 31);
  return `${rand}.${Math.floor(Date.now() / 1000)}`;
}

type GaMpEvent = { name: string; params: Record<string, unknown> };

type SendOpts = {
  /** Raw `_ga` cookie value; a fallback client_id is synthesized if missing. */
  gaCookie?: string | null;
  /** Explicit client_id (wins over the cookie). */
  clientId?: string | null;
  /** GA4 user_id for signed-in shoppers (cross-device stitching). */
  userId?: string | null;
  /** GA4 session id (from the `_ga_<STREAM>` cookie) so the event joins the
   *  right session; optional — the event still records without it. */
  sessionId?: string | null;
};

/** Extract the GA4 `session_id` from a `_ga_<STREAM_ID>` cookie value
 *  (`GS1.1.<session_id>.…`) — the 3rd dot-segment. */
export function sessionIdFromGaSessionCookie(value: string | null | undefined): string | null {
  if (!value) return null;
  const parts = value.split('.');
  return parts.length >= 3 ? (parts[2] ?? null) : null;
}

/**
 * Send one or more events via the Measurement Protocol. Best-effort: network/API
 * failures are swallowed so tracking never breaks a checkout. Returns true if
 * the request was dispatched (GA4 returns 204 and does NOT validate the body in
 * production — use the /debug/mp/collect endpoint to validate while wiring).
 */
export async function sendGaMpEvents(events: GaMpEvent[], opts: SendOpts): Promise<boolean> {
  if (!gaMpEnabled() || events.length === 0) return false;

  const measurementId = publicEnv.NEXT_PUBLIC_GA_ID as string;
  const apiSecret = serverEnv.GA_API_SECRET as string;
  const clientId = opts.clientId || clientIdFromGaCookie(opts.gaCookie) || fallbackClientId();
  const debug = publicEnv.NEXT_PUBLIC_GA_DEBUG === 'true';

  // GA4 needs `engagement_time_msec` (and ideally `session_id`) on each event to
  // record sessions/engagement correctly; `debug_mode` routes to DebugView.
  const enriched = events.map((e) => ({
    name: e.name,
    params: {
      engagement_time_msec: 100,
      ...(opts.sessionId ? { session_id: opts.sessionId } : {}),
      ...(debug ? { debug_mode: true } : {}),
      ...e.params,
    },
  }));

  const body: Record<string, unknown> = {
    client_id: clientId,
    ...(opts.userId ? { user_id: opts.userId } : {}),
    // Mirror the browser Consent Mode defaults (granted — no CMP today).
    // NB: the MP consent object uses UPPERCASE values, unlike gtag.
    consent: { ad_user_data: 'GRANTED', ad_personalization: 'GRANTED' },
    events: enriched,
  };

  try {
    const res = await fetch(
      `${ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.warn('[ga-mp] event rejected', res.status);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('[ga-mp] send failed', error instanceof Error ? error.message : error);
    return false;
  }
}

export type GaMpItem = {
  item_id: string;
  item_name?: string;
  item_brand?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
};

/** Server-side GA4 `purchase` — deduped against the browser one via transaction_id. */
export function gaTrackPurchase(
  p: {
    orderId: string;
    value: number;
    currency: string;
    tax?: number;
    shipping?: number;
    coupon?: string;
    items?: GaMpItem[];
  },
  opts: SendOpts,
): Promise<boolean> {
  const params: Record<string, unknown> = {
    transaction_id: p.orderId,
    currency: p.currency,
    value: p.value,
    ...(p.tax != null ? { tax: p.tax } : {}),
    ...(p.shipping != null ? { shipping: p.shipping } : {}),
    ...(p.coupon ? { coupon: p.coupon } : {}),
    ...(p.items?.length ? { items: p.items } : {}),
  };
  return sendGaMpEvents([{ name: 'purchase', params }], opts);
}

/** Server-side GA4 `refund` — full (no items) or partial (with items). */
export function gaTrackRefund(
  p: { orderId: string; value?: number; currency?: string; items?: GaMpItem[] },
  opts: SendOpts,
): Promise<boolean> {
  const params: Record<string, unknown> = {
    transaction_id: p.orderId,
    ...(p.currency ? { currency: p.currency } : {}),
    ...(p.value != null ? { value: p.value } : {}),
    ...(p.items?.length ? { items: p.items } : {}),
  };
  return sendGaMpEvents([{ name: 'refund', params }], opts);
}
