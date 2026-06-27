import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Mirrors the server's UserRole enum (Prisma) exactly — the API returns these
// uppercase values, so the client must not invent a lowercase variant.
export type UserRole = 'CUSTOMER' | 'VIP' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN' | 'SUPPORT';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
};

type AuthState = {
  user: AuthUser | null;
  status: 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated';
  hydrated: boolean;
};

const initialState: AuthState = {
  user: null,
  status: 'idle',
  hydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (s, a: PayloadAction<AuthUser>) => {
      s.user = a.payload;
      s.status = 'authenticated';
    },
    clearUser: (s) => {
      s.user = null;
      s.status = 'unauthenticated';
    },
    setStatus: (s, a: PayloadAction<AuthState['status']>) => {
      s.status = a.payload;
    },
    setHydrated: (s, a: PayloadAction<boolean>) => {
      s.hydrated = a.payload;
    },
  },
});

export const { setUser, clearUser, setStatus, setHydrated } = authSlice.actions;
export const authReducer = authSlice.reducer;
