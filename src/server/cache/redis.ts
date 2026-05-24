import 'server-only';

import Redis from 'ioredis';

import { serverEnv } from '@/config/env';

let client: Redis | null = null;

/**
 * Returns a singleton Redis client, or null when REDIS_URL is not configured.
 * Callers must handle the null case — never assume Redis is available.
 */
export function getRedis(): Redis | null {
  if (!serverEnv.REDIS_URL) return null;
  if (client) return client;
  client = new Redis(serverEnv.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
  });
  client.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[redis]', err.message);
  });
  return client;
}
