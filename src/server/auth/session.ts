import 'server-only';

import { nanoid } from 'nanoid';

import { signAccessToken, signRefreshToken, tokenTtl } from './tokens';

import { refreshTokensRepo } from '@/server/repositories/refresh-tokens.repo';

export type SessionUser = {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'VIP' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
};

/**
 * Mint an access + refresh token pair for a user.
 * Callers set the resulting tokens as cookies AND return them in the
 * response body so the client can store the access token for Bearer auth.
 *
 * The refresh token's `jti` is persisted so it can be rotated/revoked; a
 * refresh JWT is only honored while its row exists and is unrevoked.
 */
export async function issueSession(user: SessionUser) {
  const refreshId = nanoid();
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ sub: user.id, role: user.role, email: user.email }),
    signRefreshToken({ sub: user.id, jti: refreshId }),
  ]);
  await refreshTokensRepo.create({
    jti: refreshId,
    userId: user.id,
    expiresAt: new Date(Date.now() + tokenTtl.refresh * 1000),
  });
  return { accessToken, refreshToken, refreshId };
}
