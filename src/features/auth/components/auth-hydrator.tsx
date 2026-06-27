'use client';

import { useEffect } from 'react';

import { useAppDispatch } from '@/store/hooks';

import { useMeQuery } from '../api/auth-api';
import { clearUser, setHydrated, setUser } from '../store/auth-slice';

/**
 * AuthHydrator
 * ----------------------------------------------------------------------
 * Bridges the server session (httpOnly cookie) → Redux auth state on load.
 *
 * Without this, `useAuth().isAuthenticated` is `false` after every page
 * reload even though the session cookie is still valid: Redux auth state is
 * in-memory and only gets populated by an in-session `signIn()`.
 *
 * Calls `/auth/me` once on mount (RTK Query dedups + caches). On success the
 * user is written to Redux; on a 401 the state is cleared. Either way the
 * store is marked hydrated so gated UI can stop showing a loading state.
 *
 * Renders nothing.
 */
export function AuthHydrator() {
  const dispatch = useAppDispatch();
  const { data, isSuccess, isError, isLoading } = useMeQuery();

  useEffect(() => {
    if (isLoading) return;
    if (isSuccess && data) {
      dispatch(setUser(data));
    } else if (isError) {
      dispatch(clearUser());
    }
    dispatch(setHydrated(true));
  }, [data, isSuccess, isError, isLoading, dispatch]);

  return null;
}
