import 'server-only';

import { jwtVerify, SignJWT } from 'jose';

import { serverEnv } from '@/config/env';

const ACCESS_TTL_SECONDS = 60 * 15; // 15 minutes
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const RESET_TTL_SECONDS = 60 * 30; // 30 minutes

const ISSUER = 'elviora';
const ACCESS_AUDIENCE = 'elviora:access';
const REFRESH_AUDIENCE = 'elviora:refresh';
const RESET_AUDIENCE = 'elviora:pwreset';

export type AccessClaims = {
  sub: string; // user id
  role: 'CUSTOMER' | 'VIP' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN' | 'SUPPORT';
  email: string;
};

export type RefreshClaims = {
  sub: string;
  jti: string; // refresh-token id (for rotation/revocation)
};

function secret(kind: 'access' | 'refresh') {
  const raw =
    kind === 'access'
      ? serverEnv.JWT_SECRET
      : (serverEnv.JWT_REFRESH_SECRET ?? serverEnv.JWT_SECRET);
  if (!raw) throw new Error(`Missing ${kind === 'access' ? 'JWT_SECRET' : 'JWT_REFRESH_SECRET'}`);
  return new TextEncoder().encode(raw);
}

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(ACCESS_AUDIENCE)
    .setSubject(claims.sub)
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(secret('access'));
}

export async function signRefreshToken(claims: RefreshClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(REFRESH_AUDIENCE)
    .setSubject(claims.sub)
    .setExpirationTime(`${REFRESH_TTL_SECONDS}s`)
    .sign(secret('refresh'));
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, secret('access'), {
    issuer: ISSUER,
    audience: ACCESS_AUDIENCE,
  });
  return payload as unknown as AccessClaims;
}

export async function verifyRefreshToken(token: string): Promise<RefreshClaims> {
  const { payload } = await jwtVerify(token, secret('refresh'), {
    issuer: ISSUER,
    audience: REFRESH_AUDIENCE,
  });
  return payload as unknown as RefreshClaims;
}

/**
 * Stateless password-reset token: a short-lived JWT bound to the user id with
 * a dedicated audience so it can't be used as an access/refresh token.
 */
export async function signPasswordResetToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(RESET_AUDIENCE)
    .setSubject(userId)
    .setExpirationTime(`${RESET_TTL_SECONDS}s`)
    .sign(secret('access'));
}

export async function verifyPasswordResetToken(token: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, secret('access'), {
    issuer: ISSUER,
    audience: RESET_AUDIENCE,
  });
  return { sub: String(payload.sub) };
}

export const tokenTtl = {
  access: ACCESS_TTL_SECONDS,
  refresh: REFRESH_TTL_SECONDS,
  reset: RESET_TTL_SECONDS,
};
