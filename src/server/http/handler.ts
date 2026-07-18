import 'server-only';

import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';
import { ZodError } from 'zod';

import { isDev } from '@/config/env';

import { HttpError, InternalError } from './errors';
import { isSameSiteRequest } from './origin';
import { apiError } from './response';

type RouteCtx<Params extends Record<string, string> = Record<string, string>> = {
  params: Promise<Params>;
};

type HandlerFn<Params extends Record<string, string>> = (
  req: Request,
  ctx: RouteCtx<Params>,
) => Promise<Response>;

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SESSION_COOKIES = ['elv_at=', 'elv_rt=', 'elv_guest='];

/**
 * CSRF gate for cookie-authenticated mutations (SameSite=Lax alone doesn't
 * cover same-site XSS or a compromised subdomain). A browser always attaches
 * `Origin` (or at least `Referer`) to a cross-site POST, so a mutation that
 * rides session cookies AND carries a cross-site Origin/Referer is rejected.
 * Requests with neither header (curl, webhooks, cron) aren't a CSRF vector —
 * they don't originate from a victim's browser — and pass through.
 */
function csrfError(req: Request): Response | null {
  if (!MUTATING_METHODS.has(req.method)) return null;
  const cookie = req.headers.get('cookie') ?? '';
  if (!SESSION_COOKIES.some((c) => cookie.includes(c))) return null;
  if (!req.headers.get('origin') && !req.headers.get('referer')) return null;
  if (isSameSiteRequest(req)) return null;
  return apiError('Cross-site request rejected', { code: 'FORBIDDEN', status: 403 });
}

/**
 * Wraps a route handler with:
 *  - CSRF rejection of cross-site cookie-authenticated mutations
 *  - centralized error → API envelope conversion
 *  - Zod → 422 with field-level details
 *  - Prisma errors → tasteful messages (P2002 unique violation, P2025 not found)
 *  - last-resort 500 + log
 *
 * Usage:
 *   export const GET = createHandler(async (req) => { ... });
 */
export function createHandler<Params extends Record<string, string> = Record<string, string>>(
  fn: HandlerFn<Params>,
): (req: Request, ctx: RouteCtx<Params>) => Promise<Response> {
  return async (req, ctx) => {
    try {
      const csrf = csrfError(req);
      if (csrf) return csrf;
      return await fn(req, ctx);
    } catch (err) {
      return toApiError(err, req);
    }
  };
}

function toApiError(err: unknown, req: Request): Response {
  // Domain HTTP errors.
  if (err instanceof HttpError) {
    const retryAfter = (err as unknown as { retryAfter?: number }).retryAfter;
    return apiError(err.message, {
      code: err.code,
      status: err.status,
      errors: err.details,
      headers: retryAfter ? { 'Retry-After': String(retryAfter) } : undefined,
    });
  }

  // Zod validation failures.
  if (err instanceof ZodError) {
    return apiError('Validation failed', {
      code: 'VALIDATION_ERROR',
      status: 422,
      errors: err.issues.map((i) => ({
        path: i.path.join('.'),
        code: i.code,
        message: i.message,
      })),
    });
  }

  // Prisma known errors.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ');
      return apiError(target ? `A record with this ${target} already exists` : 'Duplicate value', {
        code: 'CONFLICT',
        status: 409,
      });
    }
    if (err.code === 'P2025') {
      return apiError('Record not found', { code: 'NOT_FOUND', status: 404 });
    }
    if (err.code === 'P2003') {
      return apiError('Related record is missing', { code: 'BAD_REQUEST', status: 400 });
    }
  }

  // Fallthrough → 500.
  if (isDev) {
    // eslint-disable-next-line no-console
    console.error('[api:error]', req.method, new URL(req.url).pathname, err);
  } else {
    // Report unexpected 500s to Sentry (no-op when DSN unset).
    Sentry.captureException(err, {
      tags: { area: 'api', method: req.method, path: new URL(req.url).pathname },
    });
    // eslint-disable-next-line no-console
    console.error('[api:error]', err);
  }
  const fallback = new InternalError();
  return apiError(fallback.message, { code: fallback.code, status: fallback.status });
}
