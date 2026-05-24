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

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const now = Date.now();
    const hit = local.get(key);
    if (hit && hit.expiresAt > now) return hit.value as T;
    if (hit) local.delete(key);

    const redis = getRedis();
    if (!redis) return null;
    try {
      const raw = await redis.get(key);
      if (!raw) return null;
      const value = JSON.parse(raw) as T;
      local.set(key, { value, expiresAt: now + DEFAULT_TTL_SECONDS * 1000 });
      return value;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
    local.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
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
    const fresh = await producer();
    await cache.set(key, fresh, ttlSeconds);
    return fresh;
  },
};
