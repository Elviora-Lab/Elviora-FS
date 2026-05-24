import 'server-only';

import { type ZodSchema } from 'zod';

import { BadRequestError } from './errors';

/**
 * Parse a JSON request body against a Zod schema.
 * Throws ZodError on validation failure (caught by createHandler → 422).
 */
export async function parseJson<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new BadRequestError('Request body must be valid JSON');
  }
  return schema.parse(json);
}

/**
 * Parse the search params of a request against a Zod schema. Numbers, booleans,
 * etc. should be wrapped with z.coerce.* in the schema since URL params are strings.
 */
export function parseQuery<T>(req: Request, schema: ZodSchema<T>): T {
  const url = new URL(req.url);
  const obj: Record<string, string | string[]> = {};
  for (const key of url.searchParams.keys()) {
    const all = url.searchParams.getAll(key);
    obj[key] = all.length > 1 ? all : (all[0] ?? '');
  }
  return schema.parse(obj);
}

/**
 * Parse dynamic route params (App Router passes them as a Promise in Next 15).
 */
export async function parseParams<T>(
  ctx: { params: Promise<unknown> },
  schema: ZodSchema<T>,
): Promise<T> {
  const raw = await ctx.params;
  return schema.parse(raw);
}
