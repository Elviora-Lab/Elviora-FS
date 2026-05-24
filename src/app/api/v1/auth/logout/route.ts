import { cookies } from 'next/headers';

import { clearAuthCookies } from '@/server/auth/cookies';
import { createHandler } from '@/server/http/handler';
import { apiSuccess } from '@/server/http/response';

export const runtime = 'nodejs';

export const POST = createHandler(async () => {
  const jar = await cookies();
  clearAuthCookies(jar);
  return apiSuccess({ ok: true }, { message: 'Signed out' });
});
