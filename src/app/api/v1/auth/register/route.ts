import { cookies } from 'next/headers';

import { setAuthCookies } from '@/server/auth/cookies';
import { createHandler } from '@/server/http/handler';
import { parseJson } from '@/server/http/parse';
import { apiSuccess } from '@/server/http/response';
import { authService } from '@/server/services/auth.service';
import { registerBody } from '@/server/validators/auth.schema';

export const runtime = 'nodejs';

export const POST = createHandler(async (req) => {
  const body = await parseJson(req, registerBody);
  const { user, accessToken, refreshToken } = await authService.register(body);

  const jar = await cookies();
  setAuthCookies(jar, { accessToken, refreshToken, role: user.role });

  return apiSuccess(
    { user, accessToken, refreshToken },
    { status: 201, message: 'Account created' },
  );
});
