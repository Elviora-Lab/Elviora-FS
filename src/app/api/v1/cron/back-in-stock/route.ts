import { NextResponse } from 'next/server';

import { cronAuthError } from '@/server/http/cron';
import { syncPostExShipments } from '@/server/services/postex-sync.service';
import { stockNotifyService } from '@/server/services/stock-notify.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const denied = cronAuthError(req);
  if (denied) return denied;

  const result = await stockNotifyService.sweepRestocked();
  // Piggyback the daily PostEx status reconciliation here so it runs on a
  // schedule without spending a 3rd cron slot (Vercel Hobby allows only 2).
  const postex = await syncPostExShipments();
  return NextResponse.json({ ok: true, ...result, postex });
}
