'use client';

import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { tokenStorage } from '@/services/auth/token-storage';

import { useLogoutMutation } from '../api/auth-api';
import { type AuthUser, clearUser, setUser } from '../store/auth-slice';

export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const status = useAppSelector((s) => s.auth.status);
  const [logoutMutation] = useLogoutMutation();

  const signIn = useCallback(
    (payload: { user: AuthUser; accessToken: string; refreshToken: string }) => {
      tokenStorage.set({ access: payload.accessToken, refresh: payload.refreshToken });
      dispatch(setUser(payload.user));
    },
    [dispatch],
  );

  const signOut = useCallback(async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // best-effort; clear local state regardless
    }
    tokenStorage.clear();
    dispatch(clearUser());
  }, [dispatch, logoutMutation]);

  return {
    user,
    status,
    isAuthenticated: status === 'authenticated' && !!user,
    isAdmin: user?.role === 'admin',
    signIn,
    signOut,
  };
}
