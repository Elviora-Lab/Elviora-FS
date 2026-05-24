import 'server-only';

import { publicEnv, serverEnv } from '@/config/env';

/**
 * Google OAuth — scaffold.
 *
 * Implementation outline:
 *  1. Redirect the user to `/api/v1/auth/google` → builds the consent URL with
 *     `state` (CSRF) + `nonce`. State is mirrored to a short-lived cookie.
 *  2. Google calls back to `/api/v1/auth/google/callback` with `code`.
 *  3. Exchange the code for tokens at https://oauth2.googleapis.com/token.
 *  4. Verify the id_token (jose.jwtVerify with Google's JWKS).
 *  5. Upsert User by `email`, mint our own session via `issueSession`.
 *
 * Fill in the fetch calls and JWKS verification before going live.
 */
export function getGoogleAuthUrl(state: string): string {
  const clientId = publicEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Google OAuth is not configured');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${publicEnv.NEXT_PUBLIC_SITE_URL}/api/v1/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    state,
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function isGoogleOAuthConfigured() {
  return Boolean(publicEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID && serverEnv.GOOGLE_CLIENT_SECRET);
}
