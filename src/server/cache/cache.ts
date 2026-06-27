import 'server-only';

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
  async get<T>(key: string): Promise<T | null> {
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
      const value = JSON.parse(raw) as T;
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

  async wrap<T>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<T> {
    const hit = await cache.get<T>(key);
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
