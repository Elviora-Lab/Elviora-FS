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
    if (memory.size >= MEMORY_MAX_KEYS) memory.clear();
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

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') ?? 'unknown';
}
