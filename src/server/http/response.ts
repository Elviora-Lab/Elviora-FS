import 'server-only';

import { NextResponse } from 'next/server';

/**
 * Standard API response envelope — consumed by RTK Query on the client.
 * Matches the shape the frontend's `normalizeError` expects.
 */
export type ApiSuccessEnvelope<T> = {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorEnvelope = {
  success: false;
  message: string;
  data: null;
  meta?: Record<string, unknown>;
  errors?: Array<{ path?: string; code: string; message: string }>;
};

export function apiSuccess<T>(
  data: T,
  init: {
    message?: string;
    meta?: Record<string, unknown>;
    status?: number;
    headers?: HeadersInit;
  } = {},
) {
  const body: ApiSuccessEnvelope<T> = {
    success: true,
    message: init.message ?? 'OK',
    data,
    ...(init.meta ? { meta: init.meta } : {}),
  };
  return NextResponse.json(body, { status: init.status ?? 200, headers: init.headers });
}

export function apiError(
  message: string,
  init: {
    code?: string;
    status?: number;
    errors?: ApiErrorEnvelope['errors'];
    meta?: Record<string, unknown>;
    headers?: HeadersInit;
  } = {},
) {
  const status = init.status ?? 500;
  const body: ApiErrorEnvelope = {
    success: false,
    message,
    data: null,
    ...(init.meta ? { meta: init.meta } : {}),
    ...(init.errors?.length ? { errors: init.errors } : {}),
  };
  return NextResponse.json(body, { status, headers: init.headers });
}

export function apiNoContent(headers?: HeadersInit) {
  return new NextResponse(null, { status: 204, headers });
}
