'use client';

import { useEffect, useRef } from 'react';

import { useAppSelector } from '@/store/hooks';

import { analytics } from '@/lib/analytics';

/**
 * Keeps GA4 `user_id` in sync with the signed-in shopper for cross-device
 * reporting. Sets the id when a user is present (login / hydrated session) and
 * sends `null` on logout. Lives inside the Redux provider (it reads the auth
 * slice). No-ops in dev / when GA isn't loaded.
 */
export function GaIdentity() {
  const userId = useAppSelector((s) => s.auth.user?.id ?? null);
  const last = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (last.current === userId) return;
    last.current = userId;
    analytics.setUser({ userId });
  }, [userId]);

  return null;
}
