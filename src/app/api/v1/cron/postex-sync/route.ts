import { NextResponse } from 'next/server';

import { cronAuthError } from '@/server/http/cron';
import { syncPostExShipments } from '@/server/services/postex-sync.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Reconcile PostEx consignment statuses into our orders. Also runs daily as
 * part of the back-in-stock cron (to stay within the Hobby 2-cron limit); this
 * standalone endpoint lets you trigger it on demand, or give it a dedicated
 * schedule on a plan that allows more cron jobs.
 */
export async function GET(req: Request) {
  const denied = cronAuthError(req);
  if (denied) return denied;

  const result = await syncPostExShipments();
  return NextResponse.json({ ok: true, ...result });
}
