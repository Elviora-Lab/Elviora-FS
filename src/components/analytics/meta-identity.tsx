'use client';

import { useEffect, useRef } from 'react';

import { useAppSelector } from '@/store/hooks';

import { analytics } from '@/lib/analytics';

/**
 * Attaches Meta Advanced Matching to the browser pixel as soon as a signed-in
 * shopper is known — on app load for a hydrated session, and again right after
 * login (the auth slice updates, this re-runs).
 *
 * Previously `identify()` only fired at checkout, so a logged-in shopper's
 * upper-funnel browser events (ViewContent / AddToCart / Search) carried no
 * email and scored low Event Match Quality. The pixel hashes the email
 * client-side; the server (CAPI) sends the same identifiers, so the two dedupe.
 *
 * Email only — it's the strongest match key and all the client auth slice holds;
 * phone is still added at checkout (browser) and by CAPI server-side for
 * logged-in users. Lives inside the Redux provider. No-ops in dev / until the
 * pixel loads (guarded in `metaPixel.identify`).
 */
export function MetaIdentity() {
  const email = useAppSelector((s) => s.auth.user?.email ?? null);
  const last = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (last.current === email) return;
    last.current = email;
    if (email) analytics.identify({ email });
  }, [email]);

  return null;
}
