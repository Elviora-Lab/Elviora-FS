import 'server-only';

import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';

import { isProd } from '@/config/env';

const GUEST_COOKIE = 'elv_guest';
const GUEST_TTL = 60 * 60 * 24 * 90; // 90 days

/**
 * Returns the current guest session id from cookies; mints one if missing.
 * Use this to anchor pre-login state (carts, recently viewed) without
 * requiring authentication.
 */
/**
 * Read the current guest id without minting one. Use this in Server Components
 * (render), where setting a cookie is not allowed — mint lazily from Server
 * Actions / Route Handlers via {@link getOrCreateGuestId} instead.
 */
export async function getGuestId(): Promise<string | null> {
  return (await cookies()).get(GUEST_COOKIE)?.value ?? null;
}

export async function getOrCreateGuestId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(GUEST_COOKIE)?.value;
  if (existing) return existing;

  const fresh = nanoid(24);
  jar.set(GUEST_COOKIE, fresh, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: GUEST_TTL,
  });
  return fresh;
}
