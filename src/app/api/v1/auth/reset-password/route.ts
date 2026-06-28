import { createHandler } from '@/server/http/handler';
import { parseJson } from '@/server/http/parse';
import { clientIp, enforceRateLimit } from '@/server/http/rate-limit';
import { apiSuccess } from '@/server/http/response';
import { authService } from '@/server/services/auth.service';
import { resetPasswordBody } from '@/server/validators/auth.schema';

export const runtime = 'nodejs';

export const POST = createHandler(async (req) => {
  await enforceRateLimit({
    key: `pwreset-confirm:${clientIp(req)}`,
    limit: 10,
    windowSeconds: 600,
  });

  const { token, password } = await parseJson(req, resetPasswordBody);
  await authService.resetPassword(token, password);

  return apiSuccess(
    { ok: true },
    { message: 'Your password has been updated. You can sign in now.' },
  );
});
