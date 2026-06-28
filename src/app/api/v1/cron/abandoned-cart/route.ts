import { NextResponse } from 'next/server';

import { cronAuthError } from '@/server/http/cron';
import { cartRecoveryService } from '@/server/services/cart-recovery.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const denied = cronAuthError(req);
  if (denied) return denied;

  const result = await cartRecoveryService.sweepAbandonedCarts();
  return NextResponse.json({ ok: true, ...result });
}
