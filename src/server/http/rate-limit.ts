import 'server-only';

import { RateLimitedError } from './errors';

import { getRedis } from '@/server/cache/redis';

/**
 * Fixed-window rate limiter.
 *
 * Uses Redis (shared across instances) when configured, and falls back to a
 * per-instance in-memory window otherwise so local/dev still gets basic
 * protection. Throws {@link RateLimitedError} (HTTP 429) when the limit is
 * exceeded; the central handler attaches a `Retry-After` header.
 */
type RateLimitOptions = {
  /** Caller-scoped identity, e.g. `login:1.2.3.4`. */
  key: string;
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
};

// Per-instance fallback store. Bounded so a flood of distinct keys can't grow
// it without limit.
const memory = new Map<string, { count: number; resetAt: number }>();
const MEMORY_MAX_KEYS = 10_000;

export async function enforceRateLimit({ key, limit, windowSeconds }: RateLimitOptions) {
  const redis = getRedis();
  if (redis) {
    try {
      const redisKey = `rl:${key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) await redis.expire(redisKey, windowSeconds);
      if (count > limit) {
        const ttl = await redis.ttl(redisKey);
        throw new RateLimitedError(
          'Too many requests. Please try again later.',
          ttl > 0 ? ttl : windowSeconds,
        );
      }
      return;
    } catch (err) {
      if (err instanceof RateLimitedError) throw err;
      // Redis transport error — degrade to the in-memory limiter below.
    }
  }

  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    if (memory.size >= MEMORY_MAX_KEYS) {
      // Evict expired windows first; if none are expired, drop the oldest
      // entries (Map preserves insertion order ≈ window start order). Never
      // clear() — that would reset every active limit at once, letting an
      // attacker flush the limiter by burning through distinct keys.
      for (const [k, v] of memory) {
        if (v.resetAt <= now) memory.delete(k);
        if (memory.size < MEMORY_MAX_KEYS) break;
      }
      while (memory.size >= MEMORY_MAX_KEYS) {
        const oldest = memory.keys().next().value;
        if (oldest === undefined) break;
        memory.delete(oldest);
      }
    }
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return;
  }
  entry.count += 1;
  if (entry.count > limit) {
    throw new RateLimitedError(
      'Too many requests. Please try again later.',
      Math.ceil((entry.resetAt - now) / 1000),
    );
  }
}

/**
 * Best-effort client IP. Prefer `x-real-ip` — on Vercel the platform sets it
 * and a client cannot override it, whereas the FIRST x-forwarded-for hop is
 * attacker-controlled (any value the client sends is simply prepended to).
 */
export function clientIp(req: Request): string {
  const real = req.headers.get('x-real-ip')?.trim();
  if (real) return real;
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    // Fall back to the LAST hop — appended by the proxy in front of us, not
    // chosen by the client.
    const hops = xff.split(',');
    const last = hops[hops.length - 1]?.trim();
    if (last) return last;
  }
  return 'unknown';
}

/**
 * Client IP inside a server action, where no Request object exists.
 * Reads the same proxy headers via next/headers (same trust order as
 * {@link clientIp}: platform-set x-real-ip first, then the last XFF hop).
 */
export async function clientIpFromAction(): Promise<string> {
  const { headers } = await import('next/headers');
  const h = await headers();
  const real = h.get('x-real-ip')?.trim();
  if (real) return real;
  const xff = h.get('x-forwarded-for');
  if (xff) {
    const hops = xff.split(',');
    const last = hops[hops.length - 1]?.trim();
    if (last) return last;
  }
  return 'unknown';
}

/**
 * Non-throwing variant for best-effort beacon endpoints (click/track), which
 * must always resolve 204. Returns false when the caller should drop the event.
 */
export async function isRateLimited(opts: RateLimitOptions): Promise<boolean> {
  try {
    await enforceRateLimit(opts);
    return false;
  } catch (err) {
    if (err instanceof RateLimitedError) return true;
    throw err;
  }
}
