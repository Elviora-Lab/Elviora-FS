import { cookies } from 'next/headers';

import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from '@/server/auth/cookies';
import { issueSession } from '@/server/auth/session';
import { verifyRefreshToken } from '@/server/auth/tokens';
import { UnauthorizedError } from '@/server/http/errors';
import { createHandler } from '@/server/http/handler';
import { clientIp, enforceRateLimit } from '@/server/http/rate-limit';
import { apiSuccess } from '@/server/http/response';
import { refreshTokensRepo } from '@/server/repositories/refresh-tokens.repo';
import { usersRepo } from '@/server/repositories/users.repo';

export const runtime = 'nodejs';

export const POST = createHandler(async (req) => {
  await enforceRateLimit({ key: `refresh:${clientIp(req)}`, limit: 30, windowSeconds: 300 });

  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!refresh) throw new UnauthorizedError('No refresh token');

  let claims;
  try {
    claims = await verifyRefreshToken(refresh);
  } catch {
    throw new UnauthorizedError('Refresh token invalid');
  }

  const stored = await refreshTokensRepo.findByJti(claims.jti);

  // Reuse / theft detection: the JWT is cryptographically valid but its server
  // record is gone or already revoked → assume the token family is compromised
  // and revoke every active token for the user, forcing a fresh login.
  if (!stored || stored.revokedAt) {
    await refreshTokensRepo.revokeAllForUser(claims.sub);
    clearAuthCookies(jar);
    throw new UnauthorizedError('Refresh token reuse detected');
  }

  if (stored.expiresAt.getTime() < Date.now()) {
    await refreshTokensRepo.revoke(claims.jti);
    clearAuthCookies(jar);
    throw new UnauthorizedError('Refresh token expired');
  }

  const user = await usersRepo.findById(claims.sub);
  if (!user) throw new UnauthorizedError();

  // Rotate: mint a new pair, then revoke the presented token and link it to its
  // successor for auditing.
  const tokens = await issueSession({ id: user.id, email: user.email, role: user.role });
  await refreshTokensRepo.revoke(claims.jti, tokens.refreshId);
  setAuthCookies(jar, { ...tokens, role: user.role });

  // Refresh token is rotated into the httpOnly cookie only — not the body.
  return apiSuccess({ accessToken: tokens.accessToken });
});
