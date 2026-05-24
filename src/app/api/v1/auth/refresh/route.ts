import { cookies } from 'next/headers';

import { REFRESH_COOKIE, setAuthCookies } from '@/server/auth/cookies';
import { issueSession } from '@/server/auth/session';
import { verifyRefreshToken } from '@/server/auth/tokens';
import { UnauthorizedError } from '@/server/http/errors';
import { createHandler } from '@/server/http/handler';
import { apiSuccess } from '@/server/http/response';
import { usersRepo } from '@/server/repositories/users.repo';

export const runtime = 'nodejs';

export const POST = createHandler(async () => {
  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!refresh) throw new UnauthorizedError('No refresh token');

  let claims;
  try {
    claims = await verifyRefreshToken(refresh);
  } catch {
    throw new UnauthorizedError('Refresh token invalid');
  }

  const user = await usersRepo.findById(claims.sub);
  if (!user) throw new UnauthorizedError();

  const tokens = await issueSession({ id: user.id, email: user.email, role: user.role });
  setAuthCookies(jar, { ...tokens, role: user.role });

  return apiSuccess({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
});
