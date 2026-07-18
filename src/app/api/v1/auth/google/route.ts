import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

import { isProd } from '@/config/env';

import { getGoogleAuthUrl, isGoogleOAuthConfigured } from '@/server/auth/oauth/google';
import { BadRequestError } from '@/server/http/errors';
import { createHandler } from '@/server/http/handler';

export const runtime = 'nodejs';

export const GET = createHandler(async () => {
  if (!isGoogleOAuthConfigured()) {
    throw new BadRequestError('Google OAuth is not configured');
  }
  const state = nanoid(32);
  const url = getGoogleAuthUrl(state);
  const res = NextResponse.redirect(url);
  res.cookies.set('elv_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  });
  return res;
});
