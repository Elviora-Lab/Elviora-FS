import type { AuthUser } from '../store/auth-slice';

export type AuthSession = {
  user: AuthUser;
  /**
   * Bearer access token — returned for non-cookie clients (mobile/SSR). The web
   * app authenticates via httpOnly cookies and ignores this. The refresh token
   * is NEVER returned in the body; it stays in an httpOnly cookie only.
   */
  accessToken?: string;
};

export type OAuthProvider = 'google';
