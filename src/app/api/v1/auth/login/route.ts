import { cookies } from 'next/headers';

import { setAuthCookies } from '@/server/auth/cookies';
import { createHandler } from '@/server/http/handler';
import { parseJson } from '@/server/http/parse';
import { clientIp, enforceRateLimit } from '@/server/http/rate-limit';
import { apiSuccess } from '@/server/http/response';
import { authService } from '@/server/services/auth.service';
import { loginBody } from '@/server/validators/auth.schema';

export const runtime = 'nodejs';

export const POST = createHandler(async (req) => {
  // Throttle by IP to blunt credential-stuffing / password spraying.
  await enforceRateLimit({ key: `login:${clientIp(req)}`, limit: 10, windowSeconds: 300 });

  const body = await parseJson(req, loginBody);
  const { user, accessToken, refreshToken } = await authService.login(body);

  const jar = await cookies();
  setAuthCookies(jar, { accessToken, refreshToken, role: user.role });

  // Refresh token is set as an httpOnly cookie only — never returned in the body.
  return apiSuccess({ user, accessToken }, { message: 'Signed in' });
});
