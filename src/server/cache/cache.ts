import 'server-only';

import { type z } from 'zod';

import { getRedis } from './redis';

/**
 * Tiered cache:
 *   1. Process-local Map (microseconds, per-instance, freed on restart)
 *   2. Redis (optional, shared across instances, persists across restarts)
 *
 * Use for hot, stable data that's expensive to fetch (product detail,
 * category tree, settings). Never cache user-specific data without
 * namespacing the key by user id.
 */
type Entry = { value: unknown; expiresAt: number };
const local = new Map<string, Entry>();

const DEFAULT_TTL_SECONDS = 60;
// Cap the per-instance Map so caching many distinct keys (e.g. every product
// slug) can't grow memory without bound. Eviction is LRU.
const MAX_LOCAL_ENTRIES = 1000;

// In-flight producers, keyed by cache key — used by `wrap` so a cold/expired
// hot key triggers exactly ONE producer call instead of a thundering herd.
const inflight = new Map<string, Promise<unknown>>();

function setLocal(key: string, value: unknown, ttlSeconds: number) {
  // Refresh recency: delete then set moves the key to the end (most-recent).
  local.delete(key);
  local.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  if (local.size > MAX_LOCAL_ENTRIES) {
    const oldest = local.keys().next().value; // first key = least-recently-used
    if (oldest !== undefined) local.delete(oldest);
  }
}

export const cache = {
  /**
   * Pass `schema` to validate data crossing the Redis boundary (shared across
   * instances and deploys — a schema change or poisoned key would otherwise be
   * trusted blindly). Mismatches are treated as a miss and the key is dropped.
   */
  async get<T>(key: string, schema?: z.ZodType<T>): Promise<T | null> {
    const now = Date.now();
    const hit = local.get(key);
    if (hit && hit.expiresAt > now) {
      // Mark as recently used.
      local.delete(key);
      local.set(key, hit);
      return hit.value as T;
    }
    if (hit) local.delete(key);

    const redis = getRedis();
    if (!redis) return null;
    try {
      const raw = await redis.get(key);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      let value: T;
      if (schema) {
        const result = schema.safeParse(parsed);
        if (!result.success) {
          await redis.del(key).catch(() => undefined);
          return null;
        }
        value = result.data;
      } else {
        value = parsed as T;
      }
      // Mirror Redis's remaining TTL locally instead of a fixed default, so the
      // two tiers don't disagree on expiry.
      const pttl = await redis.pttl(key);
      const localTtl = pttl > 0 ? Math.ceil(pttl / 1000) : DEFAULT_TTL_SECONDS;
      setLocal(key, value, localTtl);
      return value;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
    setLocal(key, value, ttlSeconds);
    const redis = getRedis();
    if (!redis) return;
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      /* swallow — local cache still has it */
    }
  },

  async delete(key: string): Promise<void> {
    local.delete(key);
    const redis = getRedis();
    if (!redis) return;
    try {
      await redis.del(key);
    } catch {
      /* swallow */
    }
  },

  async wrap<T>(
    key: string,
    ttlSeconds: number,
    producer: () => Promise<T>,
    schema?: z.ZodType<T>,
  ): Promise<T> {
    const hit = await cache.get<T>(key, schema);
    if (hit !== null) return hit;

    // Single-flight: if another caller is already producing this key, await it
    // rather than running the (expensive) producer again.
    const pending = inflight.get(key);
    if (pending) return pending as Promise<T>;

    const promise = (async () => {
      const fresh = await producer();
      await cache.set(key, fresh, ttlSeconds);
      return fresh;
    })().finally(() => inflight.delete(key));

    inflight.set(key, promise);
    return promise as Promise<T>;
  },
};
