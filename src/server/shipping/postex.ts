import 'server-only';

import { unstable_cache } from 'next/cache';
import { OrderStatus, ShipmentStatus } from '@prisma/client';

import { serverEnv } from '@/config/env';

import { BadRequestError } from '@/server/http/errors';

/**
 * PostEx (Pakistan) merchant API client.
 * Docs: https://api.postex.pk · auth via the `token` header.
 * All calls are no-ops-by-throw when POSTEX_API_TOKEN is unset — callers should
 * gate on `isPostExConfigured()`.
 */
const BASE_URL = 'https://api.postex.pk';

export function isPostExConfigured(): boolean {
  return Boolean(serverEnv.POSTEX_API_TOKEN);
}

/**
 * PostEx's create-order API requires the customer phone in strict local format
 * `03xxxxxxxxx`. Our checkout only validates length (6–32 chars), so shoppers
 * type it every which way (+92, 0092, spaces, dashes, or a bare `3xx…`). We
 * coerce all of those to the one shape PostEx accepts, otherwise the booking is
 * rejected. Returns the digits unchanged if it can't confidently reshape them.
 */
export function toPostExPhone(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('0092'))
    d = d.slice(4); // 0092 300… → 300…
  else if (d.startsWith('92') && d.length === 12) d = d.slice(2); // 92 300… → 300…
  if (!d.startsWith('0')) d = `0${d}`; // 300… → 0300…
  return d;
}

async function postexFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = serverEnv.POSTEX_API_TOKEN;
  if (!token) throw new Error('PostEx is not configured (POSTEX_API_TOKEN missing)');

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', token, ...(init?.headers ?? {}) },
    cache: 'no-store',
  });

  const json = (await res.json().catch(() => null)) as {
    statusCode?: string;
    statusMessage?: string;
    dist?: unknown;
  } | null;

  // PostEx returns HTTP 200 with a `statusCode` ("200" on success). Surface its
  // message as an HttpError so admin server-actions show the real reason
  // (e.g. "invalid city", "duplicate order reference") instead of a generic
  // "Something went wrong" toast.
  if (!res.ok || (json?.statusCode && String(json.statusCode) !== '200')) {
    throw new BadRequestError(
      `PostEx: ${json?.statusMessage || `request failed (HTTP ${res.status})`}`,
    );
  }
  return json as T;
}

export type CreatePostExOrderInput = {
  cityName: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  /** COD amount to collect (0 for prepaid). */
  invoicePayment: number;
  /** Number of pieces in the parcel. */
  items: number;
  orderRefNumber: string;
  orderDetail?: string;
  orderType?: string;
};

/** Book a parcel with PostEx. Returns the assigned tracking number. */
export async function createPostExOrder(
  input: CreatePostExOrderInput,
): Promise<{ trackingNumber: string }> {
  const body = {
    cityName: input.cityName,
    customerName: input.customerName,
    customerPhone: toPostExPhone(input.customerPhone),
    deliveryAddress: input.deliveryAddress,
    invoiceDivision: 1,
    invoicePayment: Math.round(input.invoicePayment),
    items: Math.max(1, input.items),
    orderRefNumber: input.orderRefNumber,
    orderType: input.orderType ?? 'Normal',
    ...(input.orderDetail ? { orderDetail: input.orderDetail } : {}),
    ...(serverEnv.POSTEX_PICKUP_ADDRESS_CODE
      ? { pickupAddressCode: serverEnv.POSTEX_PICKUP_ADDRESS_CODE }
      : {}),
  };

  const json = await postexFetch<{ dist?: { trackingNumber?: string | number } }>(
    '/services/integration/api/order/v3/create-order',
    { method: 'POST', body: JSON.stringify(body) },
  );

  const trackingNumber = json.dist?.trackingNumber;
  if (!trackingNumber) throw new Error('PostEx did not return a tracking number');
  return { trackingNumber: String(trackingNumber) };
}

/** Fetch the latest tracking status for a consignment. Best-effort message. */
export async function trackPostExOrder(trackingNumber: string): Promise<{ status: string }> {
  const json = await postexFetch<{ dist?: Record<string, unknown> }>(
    `/services/integration/api/order/v1/track-order/${encodeURIComponent(trackingNumber)}`,
    { method: 'GET' },
  );
  const dist = json.dist ?? {};
  // Per the guide (3.8.3), the human-readable journey lives in
  // `transactionStatusHistory[]` (each entry has `transactionStatusMessage`);
  // the latest entry is the current step. `transactionStatus` is an optional
  // summary string we fall back to when the history is absent.
  const history = Array.isArray(dist['transactionStatusHistory'])
    ? (dist['transactionStatusHistory'] as Array<{ transactionStatusMessage?: string }>)
    : [];
  const latest = history.length ? history[history.length - 1]?.transactionStatusMessage : undefined;
  const status = latest || (dist['transactionStatus'] as string) || 'Unknown';
  return { status: String(status) };
}

// ---------------------------------------------------------------------------
// Operational cities — used to warn shoppers at checkout when PostEx does not
// deliver to their city (an undeliverable COD order is a wasted courier fee).
// ---------------------------------------------------------------------------

const normalizeCityName = (s: string): string => s.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * The set of cities PostEx delivers to, normalized to lowercase. Cached for a
 * day (this list barely changes) and never throws — an outage returns an empty
 * set so checkout degrades to "no warning" rather than blocking the sale.
 */
const getServiceableCitiesCached = unstable_cache(
  async (): Promise<string[]> => {
    if (!isPostExConfigured()) return [];
    try {
      // NB: the guide (§3.1.2) says to pass `operationalCityType=Delivery`, but
      // PostEx rejects that value with HTTP 400 (no such enum constant). The
      // param-less call returns every operational city with an `isDeliveryCity`
      // flag, so we fetch all and filter on the flag ourselves.
      const json = await postexFetch<{ dist?: Array<Record<string, unknown>> }>(
        '/services/integration/api/order/v2/get-operational-city',
        { method: 'GET' },
      );
      const rows = Array.isArray(json.dist) ? json.dist : [];
      return rows
        .filter((r) => r['isDeliveryCity'] === true || r['isDeliveryCity'] === 'true')
        .map((r) => normalizeCityName(String(r['operationalCityName'] ?? '')))
        .filter(Boolean);
    } catch {
      return [];
    }
  },
  ['postex-serviceable-cities-v2'],
  { revalidate: 60 * 60 * 24, tags: ['postex-cities'] },
);

/**
 * Is a city deliverable by PostEx? Returns `null` when we can't tell (PostEx
 * unconfigured or the city list is unavailable) so callers show no warning
 * rather than a false one.
 */
export async function isPostExCityServiceable(city: string): Promise<boolean | null> {
  const cities = await getServiceableCitiesCached();
  if (cities.length === 0) return null;
  return cities.includes(normalizeCityName(city));
}

// ---------------------------------------------------------------------------
// Airway Bill (shipping label) — a printable PDF for up to 10 consignments.
// ---------------------------------------------------------------------------

/** Fetch the PostEx AWB label PDF for one or more tracking numbers (max 10). */
export async function getPostExAirwayBill(trackingNumbers: string[]): Promise<ArrayBuffer> {
  const token = serverEnv.POSTEX_API_TOKEN;
  if (!token) throw new Error('PostEx is not configured (POSTEX_API_TOKEN missing)');

  const list = trackingNumbers
    .slice(0, 10)
    .map((t) => t.trim())
    .filter(Boolean);
  if (list.length === 0) throw new Error('No tracking numbers provided');

  const qs = new URLSearchParams({ trackingNumbers: list.join(',') });
  const res = await fetch(
    `${BASE_URL}/services/integration/api/order/v1/getinvoice?${qs.toString()}`,
    { method: 'GET', headers: { token }, cache: 'no-store' },
  );

  // On an invalid tracking number PostEx replies HTTP 200 with a JSON error
  // envelope instead of a PDF — surface its message rather than a corrupt file.
  const contentType = res.headers.get('content-type') ?? '';
  if (!res.ok || contentType.includes('application/json')) {
    const json = (await res.json().catch(() => null)) as { statusMessage?: string } | null;
    throw new Error(json?.statusMessage || `PostEx label failed (HTTP ${res.status})`);
  }
  return res.arrayBuffer();
}

// ---------------------------------------------------------------------------
// Cancel a booked consignment (§3.13).
// ---------------------------------------------------------------------------

/** Cancel a PostEx booking. Throws (HTTP 404) if the tracking number is unknown. */
export async function cancelPostExOrder(trackingNumber: string): Promise<void> {
  await postexFetch('/services/integration/api/order/v1/cancel-order', {
    method: 'PUT',
    body: JSON.stringify({ trackingNumber }),
  });
}

// ---------------------------------------------------------------------------
// COD payment / settlement status (§3.14).
// ---------------------------------------------------------------------------

export type PostExPaymentStatus = {
  /** True once PostEx has settled the collected COD cash to the merchant. */
  settled: boolean;
  settlementDate: string | null;
  /** Cash Payment Receipt number (upfront or reserve), for reconciliation. */
  cprNumber: string | null;
};

/** Fetch whether the COD for a consignment has been settled to the merchant. */
export async function getPostExPaymentStatus(trackingNumber: string): Promise<PostExPaymentStatus> {
  const json = await postexFetch<{ dist?: Record<string, unknown> }>(
    `/services/integration/api/order/v1/payment-status/${encodeURIComponent(trackingNumber)}`,
    { method: 'GET' },
  );
  const d = json.dist ?? {};
  return {
    settled: d['settle'] === true || d['settle'] === 'true',
    settlementDate: (d['settlementDate'] as string) || null,
    cprNumber: (d['cprNumber_1'] as string) || (d['cprNumber_2'] as string) || null,
  };
}

// ---------------------------------------------------------------------------
// Status mapping — PostEx's human status → our Shipment/Order enums.
// ---------------------------------------------------------------------------

/**
 * Translate a PostEx status message (from track-order or its history) into our
 * ShipmentStatus, plus the OrderStatus it implies when the step is terminal
 * (Delivered/Returned). Intermediate steps leave the order untouched.
 */
export function mapPostExStatus(raw: string): {
  shipment: ShipmentStatus;
  order?: OrderStatus;
  terminal: boolean;
} {
  const s = raw.toLowerCase();
  if (s.includes('out for delivery'))
    return { shipment: ShipmentStatus.OUT_FOR_DELIVERY, terminal: false };
  if (s.includes('under review') || s.includes('attempt'))
    return { shipment: ShipmentStatus.IN_TRANSIT, terminal: false };
  if (s.includes('deliver'))
    return { shipment: ShipmentStatus.DELIVERED, order: OrderStatus.DELIVERED, terminal: true };
  if (s.includes('return'))
    return { shipment: ShipmentStatus.RETURNED, order: OrderStatus.RETURNED, terminal: true };
  if (s.includes('expired') || s.includes('un-assigned'))
    return { shipment: ShipmentStatus.FAILED, terminal: true };
  // Booked / warehouse / picked / en-route / on root → in transit.
  return { shipment: ShipmentStatus.IN_TRANSIT, terminal: false };
}
