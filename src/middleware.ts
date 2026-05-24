import { type NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

import { ADMIN_PREFIXES, AUTH_ROUTES, PROTECTED_PREFIXES } from '@/config/routes';

const ACCESS_COOKIE = 'elv_at';
const ROLE_COOKIE = 'elv_role';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'STAFF']);

function getSecret() {
  const raw = process.env.JWT_SECRET;
  if (!raw) return null;
  return new TextEncoder().encode(raw);
}

async function verify(token: string) {
  const secret = getSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'elviora',
      audience: 'elviora:access',
    });
    return payload as { sub: string; role: string; email: string };
  } catch {
    return null;
  }
}

/**
 * Edge middleware — runs before every matched request.
 *
 * Verifies the access-token cookie with jose (Edge-compatible). The role-hint
 * cookie is a fast path for RBAC checks; the JWT remains the source of truth
 * and is verified on every protected navigation.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const roleHint = req.cookies.get(ROLE_COOKIE)?.value;

  const claims = token ? await verify(token) : null;
  const isAuthed = !!claims;
  const role = claims?.role ?? roleHint;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname === p);

  if (isAuthed && isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/account';
    return NextResponse.redirect(url);
  }

  if (isProtected && !isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (isAdmin) {
    if (!isAuthed) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    if (!role || !ADMIN_ROLES.has(role)) {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|fonts|api/).*)',
  ],
};
