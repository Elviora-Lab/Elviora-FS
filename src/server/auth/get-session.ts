import 'server-only';

import { cookies } from 'next/headers';

import { ACCESS_COOKIE } from './cookies';
import { type AccessClaims, verifyAccessToken } from './tokens';

/**
 * Resolve the current session from cookies OR Authorization header.
 * Returns null when the request is unauthenticated — never throws.
 *
 * Pass `request` when calling from a Route Handler (so the Authorization
 * header is checked); omit it from RSC/Server Action contexts (cookie only).
 */
export async function getSession(request?: Request): Promise<AccessClaims | null> {
  let token: string | undefined;

  // 1. Authorization: Bearer <token> (RTK Query / mobile clients)
  if (request) {
    const auth = request.headers.get('authorization');
    if (auth?.toLowerCase().startsWith('bearer ')) {
      token = auth.slice(7).trim() || undefined;
    }
  }

  // 2. Cookie (browser navigations, server components)
  if (!token) {
    const jar = await cookies();
    token = jar.get(ACCESS_COOKIE)?.value;
  }

  if (!token) return null;

  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}
