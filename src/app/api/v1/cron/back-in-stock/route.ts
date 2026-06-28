import { NextResponse } from 'next/server';

import { cronAuthError } from '@/server/http/cron';
import { stockNotifyService } from '@/server/services/stock-notify.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const denied = cronAuthError(req);
  if (denied) return denied;

  const result = await stockNotifyService.sweepRestocked();
  return NextResponse.json({ ok: true, ...result });
}
