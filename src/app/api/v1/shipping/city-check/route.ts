import { NextResponse } from 'next/server';

import { isPostExCityServiceable } from '@/server/shipping/postex';

export const runtime = 'nodejs';

/**
 * Checkout helper: is a city deliverable by PostEx? Returns
 * `{ serviceable: true | false | null }` — `null` means "can't tell" (PostEx
 * unconfigured or list unavailable), so the client shows no warning. The
 * underlying city list is cached for a day, so this never hammers PostEx.
 */
export async function GET(req: Request) {
  const city = new URL(req.url).searchParams.get('city')?.trim() ?? '';
  if (city.length < 2) return NextResponse.json({ serviceable: null });
  const serviceable = await isPostExCityServiceable(city);
  return NextResponse.json({ serviceable });
}
