'use client';

import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { useLogoutMutation } from '../api/auth-api';
import { type AuthUser, clearUser, setUser } from '../store/auth-slice';

// Roles that may access the admin surface — must match the server's
// requireAdmin guard (src/server/auth/guards.ts).
const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'STAFF']);

export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const status = useAppSelector((s) => s.auth.status);
  const [logoutMutation] = useLogoutMutation();

  const signIn = useCallback(
    // The login/register response already set the httpOnly auth cookies; the
    // client only needs to mirror the user into Redux for instant UI.
    (user: AuthUser) => {
      dispatch(setUser(user));
    },
    [dispatch],
  );

  const signOut = useCallback(async () => {
    try {
      // Server clears (and revokes) the auth cookies.
      await logoutMutation().unwrap();
    } catch {
      // best-effort; clear local state regardless
    }
    dispatch(clearUser());
  }, [dispatch, logoutMutation]);

  return {
    user,
    status,
    isAuthenticated: status === 'authenticated' && !!user,
    isAdmin: !!user && ADMIN_ROLES.has(user.role),
    signIn,
    signOut,
  };
}
