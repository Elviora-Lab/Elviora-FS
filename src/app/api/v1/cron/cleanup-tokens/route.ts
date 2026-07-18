import { NextResponse } from 'next/server';

import { cronAuthError } from '@/server/http/cron';
import { refreshTokensRepo } from '@/server/repositories/refresh-tokens.repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Daily hygiene: purge refresh tokens that are past expiry or were revoked
 * long enough ago that the reuse-detection window has passed. Without this the
 * refresh_tokens table grows without bound (one row per login, forever).
 */
export async function GET(req: Request) {
  const denied = cronAuthError(req);
  if (denied) return denied;

  const purged = await refreshTokensRepo.purgeExpired();
  return NextResponse.json({ ok: true, purged });
}
