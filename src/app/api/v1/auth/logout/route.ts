import { cookies } from 'next/headers';

import { clearAuthCookies, REFRESH_COOKIE } from '@/server/auth/cookies';
import { verifyRefreshToken } from '@/server/auth/tokens';
import { createHandler } from '@/server/http/handler';
import { apiSuccess } from '@/server/http/response';
import { refreshTokensRepo } from '@/server/repositories/refresh-tokens.repo';

export const runtime = 'nodejs';

export const POST = createHandler(async () => {
  const jar = await cookies();

  // Revoke the refresh token server-side so it can't be replayed after logout.
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    try {
      const claims = await verifyRefreshToken(refresh);
      await refreshTokensRepo.revoke(claims.jti);
    } catch {
      // Invalid/expired token — nothing to revoke; clearing cookies is enough.
    }
  }

  clearAuthCookies(jar);
  return apiSuccess({ ok: true }, { message: 'Signed out' });
});
