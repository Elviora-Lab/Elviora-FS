import 'server-only';

import { serverEnv } from '@/config/env';

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

  // PostEx returns HTTP 200 with a `statusCode` ("200" on success).
  if (!res.ok || (json?.statusCode && String(json.statusCode) !== '200')) {
    throw new Error(json?.statusMessage || `PostEx request failed (HTTP ${res.status})`);
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
    customerPhone: input.customerPhone,
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
  // PostEx exposes the current status under a few possible keys depending on
  // API version; fall back gracefully.
  const status =
    (dist['transactionStatusMessage'] as string) ||
    (dist['orderStatus'] as string) ||
    (dist['transactionStatus'] as string) ||
    'Unknown';
  return { status: String(status) };
}
