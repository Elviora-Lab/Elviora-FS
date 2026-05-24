import 'server-only';

import { type ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import { type cookies } from 'next/headers';

import { isProd } from '@/config/env';

import { tokenTtl } from './tokens';

export const ACCESS_COOKIE = 'elv_at'; // access token
export const REFRESH_COOKIE = 'elv_rt'; // refresh token
export const ROLE_COOKIE = 'elv_role'; // cheap RBAC hint for Edge middleware

type CookieJar = Awaited<ReturnType<typeof cookies>> | ResponseCookies;

const baseOpts = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/',
};

export function setAuthCookies(
  jar: CookieJar,
  payload: { accessToken: string; refreshToken: string; role: string },
) {
  jar.set(ACCESS_COOKIE, payload.accessToken, { ...baseOpts, maxAge: tokenTtl.access });
  jar.set(REFRESH_COOKIE, payload.refreshToken, { ...baseOpts, maxAge: tokenTtl.refresh });
  // Role cookie is httpOnly false-equivalent (still httpOnly true is fine here —
  // middleware reads it server-side; the client never needs it).
  jar.set(ROLE_COOKIE, payload.role, { ...baseOpts, maxAge: tokenTtl.refresh });
}

export function clearAuthCookies(jar: CookieJar) {
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(ROLE_COOKIE);
}
