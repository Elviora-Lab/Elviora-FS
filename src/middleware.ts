import { type NextRequest, NextResponse } from 'next/server';

import { ADMIN_PREFIXES, AUTH_ROUTES, PROTECTED_PREFIXES } from '@/config/routes';

/**
 * Edge middleware — runs before every matched request.
 *
 * Reads `auth-token` (httpOnly cookie set by your auth gateway). For the
 * client-side scaffold using localStorage, the cookie is mirrored on sign-in;
 * swap this for the real signed cookie / JWT verification in production.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get('auth-token')?.value;
  const role = req.cookies.get('auth-role')?.value as 'customer' | 'admin' | undefined;
  const isAuthed = Boolean(token);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname === p);

  // Redirect signed-in users away from auth pages.
  if (isAuthed && isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/account';
    return NextResponse.redirect(url);
  }

  // Gate protected routes.
  if (isProtected && !isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Role-based gate for admin.
  if (isAdmin) {
    if (!isAuthed) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    if (role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - Next internals (_next/*)
     * - Static files (favicon, images, fonts)
     * - API routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|fonts|api/).*)',
  ],
};
