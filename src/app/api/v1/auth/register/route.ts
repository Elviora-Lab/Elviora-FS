import { cookies } from 'next/headers';

import { setAuthCookies } from '@/server/auth/cookies';
import { createHandler } from '@/server/http/handler';
import { parseJson } from '@/server/http/parse';
import { clientIp, enforceRateLimit } from '@/server/http/rate-limit';
import { apiSuccess } from '@/server/http/response';
import { authService } from '@/server/services/auth.service';
import { registerBody } from '@/server/validators/auth.schema';

export const runtime = 'nodejs';

export const POST = createHandler(async (req) => {
  // Cap new-account creation per IP to limit signup abuse.
  await enforceRateLimit({ key: `register:${clientIp(req)}`, limit: 5, windowSeconds: 3600 });

  const body = await parseJson(req, registerBody);
  const { user, accessToken, refreshToken } = await authService.register(body);

  const jar = await cookies();
  setAuthCookies(jar, { accessToken, refreshToken, role: user.role });

  // Refresh token is set as an httpOnly cookie only — never returned in the body.
  return apiSuccess({ user, accessToken }, { status: 201, message: 'Account created' });
});
