import 'server-only';

import { nanoid } from 'nanoid';

import { signAccessToken, signRefreshToken } from './tokens';

export type SessionUser = {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'VIP' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN' | 'SUPPORT';
};

/**
 * Mint an access + refresh token pair for a user.
 * Callers set the resulting tokens as cookies AND return them in the
 * response body so the client can store the access token for Bearer auth.
 */
export async function issueSession(user: SessionUser) {
  const refreshId = nanoid();
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ sub: user.id, role: user.role, email: user.email }),
    signRefreshToken({ sub: user.id, jti: refreshId }),
  ]);
  return { accessToken, refreshToken, refreshId };
}
