import 'server-only';

import { publicEnv } from '@/config/env';

/**
 * True when the request carries a same-site `Origin` or `Referer` header.
 *
 * Browser-issued beacons (fetch/sendBeacon) always include at least one of
 * them; a bare scripted request (curl, bot) typically has neither. Requests
 * missing both are rejected — treating "no Origin" as trusted would let
 * direct scripted requests poison analytics/CAPI data.
 */
export function isSameSiteRequest(req: Request): boolean {
  let siteHost: string;
  try {
    siteHost = new URL(publicEnv.NEXT_PUBLIC_SITE_URL).host;
  } catch {
    return false;
  }
  const hostOf = (value: string): string | null => {
    try {
      return new URL(value).host;
    } catch {
      return null;
    }
  };

  const origin = req.headers.get('origin');
  if (origin) return hostOf(origin) === siteHost;
  const referer = req.headers.get('referer');
  if (referer) return hostOf(referer) === siteHost;
  return false;
}
