import { cookies } from 'next/headers';

import { setAuthCookies } from '@/server/auth/cookies';
import { getGuestId, regenerateGuestId } from '@/server/auth/guest-session';
import { createHandler } from '@/server/http/handler';
import { parseJson } from '@/server/http/parse';
import { clientIp, enforceRateLimit } from '@/server/http/rate-limit';
import { apiSuccess } from '@/server/http/response';
import { cartRepo } from '@/server/repositories/cart.repo';
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

  // Session-fixation defense: carry the guest cart over, then rotate the guest
  // id so the pre-login cookie value doesn't follow the authenticated session.
  const guestId = await getGuestId();
  if (guestId) {
    await cartRepo.claimGuestCart(user.id, guestId).catch(() => undefined);
  }
  await regenerateGuestId();

  // Refresh token is set as an httpOnly cookie only — never returned in the body.
  return apiSuccess({ user, accessToken }, { message: 'Signed in' });
});
