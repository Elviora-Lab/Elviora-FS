import {
  type BaseQueryFn,
  type FetchArgs,
  fetchBaseQuery,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query';

import { publicEnv } from '@/config/env';

import { tokenStorage } from '@/services/auth/token-storage';

/**
 * Raw fetch wrapper — attaches the access token and standard headers.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: publicEnv.NEXT_PUBLIC_API_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = tokenStorage.getAccess();
    if (token) headers.set('authorization', `Bearer ${token}`);
    if (!headers.has('accept')) headers.set('accept', 'application/json');
    headers.set('x-client', 'elviora-web');
    return headers;
  },
});

type Mutex = { promise: Promise<void> | null };
const refreshMutex: Mutex = { promise: null };

async function refreshAccessToken(): Promise<boolean> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return false;

  try {
    const res = await fetch(`${publicEnv.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken: string; refreshToken?: string };
    if (!data.accessToken) return false;
    tokenStorage.set({ access: data.accessToken, refresh: data.refreshToken });
    return true;
  } catch {
    return false;
  }
}

/**
 * Base query with:
 *  - 401 → single-flight refresh → retry
 *  - 5xx → up to N retries with exponential backoff
 *  - cancellation via AbortSignal propagation (handled by fetchBaseQuery)
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    if (!refreshMutex.promise) {
      refreshMutex.promise = (async () => {
        const ok = await refreshAccessToken();
        if (!ok) tokenStorage.clear();
      })().finally(() => {
        refreshMutex.promise = null;
      });
    }
    await refreshMutex.promise;

    if (tokenStorage.getAccess()) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  // 5xx retry — bounded
  let attempts = 0;
  while (
    result.error &&
    typeof result.error.status === 'number' &&
    result.error.status >= 500 &&
    attempts < 2
  ) {
    attempts += 1;
    await new Promise((r) => setTimeout(r, 250 * 2 ** attempts));
    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};
