import 'server-only';

import { createHash } from 'node:crypto';

import { publicEnv, serverEnv } from '@/config/env';

/**
 * Meta Conversions API (server-side events).
 *
 * Complements the browser pixel: browser events are increasingly blocked, so we
 * also send the important conversions from the server. Each server event shares
 * an `event_id` with its browser counterpart so Meta deduplicates the pair.
 *
 * No-ops safely unless `META_CAPI_ACCESS_TOKEN` and a pixel id are configured.
 */

const GRAPH_VERSION = 'v21.0';

export function capiEnabled(): boolean {
  return Boolean(serverEnv.META_CAPI_ACCESS_TOKEN && publicEnv.NEXT_PUBLIC_FB_PIXEL_ID);
}

/** SHA-256 hex of a normalized value — Meta requires PII to be hashed. */
function hash(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return createHash('sha256').update(normalized).digest('hex');
}

/** Phone: strip everything but digits before hashing (keep country code). */
function hashPhone(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return undefined;
  return createHash('sha256').update(digits).digest('hex');
}

export type CapiUserData = {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  country?: string | null;
  externalId?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  /** _fbp / _fbc cookies — passed through unhashed for best match rates. */
  fbp?: string | null;
  fbc?: string | null;
};

function buildUserData(u: CapiUserData): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const em = hash(u.email);
  const ph = hashPhone(u.phone);
  const fn = hash(u.firstName);
  const ln = hash(u.lastName);
  const ct = hash(u.city);
  const country = hash(u.country);
  const externalId = hash(u.externalId);
  if (em) data.em = [em];
  if (ph) data.ph = [ph];
  if (fn) data.fn = [fn];
  if (ln) data.ln = [ln];
  if (ct) data.ct = [ct];
  if (country) data.country = [country];
  if (externalId) data.external_id = [externalId];
  if (u.clientIp) data.client_ip_address = u.clientIp;
  if (u.userAgent) data.client_user_agent = u.userAgent;
  if (u.fbp) data.fbp = u.fbp;
  if (u.fbc) data.fbc = u.fbc;
  return data;
}

export type CapiEvent = {
  eventName: string;
  /** Shared with the browser event so Meta dedupes the two. */
  eventId: string;
  /** Unix seconds. Defaults to now. */
  eventTime?: number;
  eventSourceUrl?: string;
  userData: CapiUserData;
  customData?: Record<string, unknown>;
};

/**
 * Send one event to the Conversions API. Best-effort: network/API failures are
 * swallowed so tracking never breaks a checkout. Returns true if sent.
 */
export async function sendCapiEvent(event: CapiEvent): Promise<boolean> {
  if (!capiEnabled()) return false;

  const pixelId = publicEnv.NEXT_PUBLIC_FB_PIXEL_ID;
  const token = serverEnv.META_CAPI_ACCESS_TOKEN as string;
  const eventTime = event.eventTime ?? Math.floor(Date.now() / 1000);

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: event.eventName,
        event_time: eventTime,
        event_id: event.eventId,
        action_source: 'website',
        ...(event.eventSourceUrl ? { event_source_url: event.eventSourceUrl } : {}),
        user_data: buildUserData(event.userData),
        ...(event.customData ? { custom_data: event.customData } : {}),
      },
    ],
    ...(serverEnv.META_CAPI_TEST_EVENT_CODE
      ? { test_event_code: serverEnv.META_CAPI_TEST_EVENT_CODE }
      : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn('[meta-capi] event rejected', res.status, body.slice(0, 300));
      return false;
    }
    return true;
  } catch (error) {
    console.warn('[meta-capi] send failed', error instanceof Error ? error.message : error);
    return false;
  }
}
