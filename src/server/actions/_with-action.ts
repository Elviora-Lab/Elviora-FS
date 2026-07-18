import 'server-only';

import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

import { HttpError } from '@/server/http/errors';

export type ActionResult<T> =
  | { success: true; data: T; message?: string }
  | {
      success: false;
      message: string;
      code?: string;
      errors?: Array<{ path?: string; message: string }>;
    };

/**
 * Wrap a Server Action with the same error contract as our route handlers.
 * Returns a `{ success, data }` envelope so client components can render
 * inline form errors without throwing.
 */
export function withAction<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
): (...args: Args) => Promise<ActionResult<T>> {
  return async (...args) => {
    try {
      const data = await fn(...args);
      return { success: true, data };
    } catch (err) {
      if (err instanceof ZodError) {
        return {
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Please check the fields below',
          errors: err.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        };
      }
      if (err instanceof HttpError) {
        return { success: false, message: err.message, code: err.code };
      }
      // Same Prisma mapping as createHandler, so forms get "already exists"
      // instead of a generic failure on unique violations etc.
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          const target = (err.meta?.target as string[] | undefined)?.join(', ');
          return {
            success: false,
            code: 'CONFLICT',
            message: target ? `A record with this ${target} already exists` : 'Duplicate value',
          };
        }
        if (err.code === 'P2025') {
          return { success: false, code: 'NOT_FOUND', message: 'Record not found' };
        }
        if (err.code === 'P2003') {
          return { success: false, code: 'BAD_REQUEST', message: 'Related record is missing' };
        }
      }
      // eslint-disable-next-line no-console
      console.error('[action:error]', err);
      return { success: false, message: 'Something went wrong' };
    }
  };
}
