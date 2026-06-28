import { createHandler } from '@/server/http/handler';
import { parseJson } from '@/server/http/parse';
import { clientIp, enforceRateLimit } from '@/server/http/rate-limit';
import { apiSuccess } from '@/server/http/response';
import { authService } from '@/server/services/auth.service';
import { forgotPasswordBody } from '@/server/validators/auth.schema';

export const runtime = 'nodejs';

export const POST = createHandler(async (req) => {
  // Throttle so this can't be used to spam inboxes or probe for accounts.
  await enforceRateLimit({ key: `pwreset:${clientIp(req)}`, limit: 5, windowSeconds: 600 });

  const { email } = await parseJson(req, forgotPasswordBody);
  await authService.requestPasswordReset(email);

  // Always the same response — never reveal whether the email is registered.
  return apiSuccess(
    { ok: true },
    { message: 'If an account exists for that email, a reset link is on its way.' },
  );
});
