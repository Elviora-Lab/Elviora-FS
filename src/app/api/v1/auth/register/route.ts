import { cookies } from 'next/headers';

import { setAuthCookies } from '@/server/auth/cookies';
import { getGuestId, regenerateGuestId } from '@/server/auth/guest-session';
import { createHandler } from '@/server/http/handler';
import { parseJson } from '@/server/http/parse';
import { clientIp, enforceRateLimit } from '@/server/http/rate-limit';
import { apiSuccess } from '@/server/http/response';
import { cartRepo } from '@/server/repositories/cart.repo';
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

  // Session-fixation defense: carry the guest cart over, then rotate the guest
  // id so the pre-signup cookie value doesn't follow the authenticated session.
  const guestId = await getGuestId();
  if (guestId) {
    await cartRepo.claimGuestCart(user.id, guestId).catch(() => undefined);
  }
  await regenerateGuestId();

  // Refresh token is set as an httpOnly cookie only — never returned in the body.
  return apiSuccess({ user, accessToken }, { status: 201, message: 'Account created' });
});
