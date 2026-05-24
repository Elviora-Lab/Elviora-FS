import 'server-only';

import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

import { isDev } from '@/config/env';

import { HttpError, InternalError } from './errors';
import { apiError } from './response';

type RouteCtx<Params extends Record<string, string> = Record<string, string>> = {
  params: Promise<Params>;
};

type HandlerFn<Params extends Record<string, string>> = (
  req: Request,
  ctx: RouteCtx<Params>,
) => Promise<Response>;

/**
 * Wraps a route handler with:
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
      return await fn(req, ctx);
    } catch (err) {
      return toApiError(err, req);
    }
  };
}

function toApiError(err: unknown, req: Request): Response {
  // Domain HTTP errors.
  if (err instanceof HttpError) {
    return apiError(err.message, {
      code: err.code,
      status: err.status,
      errors: err.details,
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
    // In production, forward to your observability sink (Sentry/Datadog) here.
    // eslint-disable-next-line no-console
    console.error('[api:error]', err);
  }
  const fallback = new InternalError();
  return apiError(fallback.message, { code: fallback.code, status: fallback.status });
}
