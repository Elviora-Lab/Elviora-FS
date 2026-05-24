import type { AuthUser } from '../store/auth-slice';

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type OAuthProvider = 'google';
