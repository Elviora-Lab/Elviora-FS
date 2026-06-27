import { describe, expect, it, vi } from 'vitest';

import { cache } from '@/server/cache/cache';

// Redis is unconfigured in tests, so only the process-local tier is exercised.
describe('cache', () => {
  it('stores and returns a value within its TTL', async () => {
    await cache.set('k1', { a: 1 }, 60);
    expect(await cache.get('k1')).toEqual({ a: 1 });
  });

  it('returns null after delete', async () => {
    await cache.set('k2', 'v', 60);
    await cache.delete('k2');
    expect(await cache.get('k2')).toBeNull();
  });

  it('wrap calls the producer once and caches the result', async () => {
    const producer = vi.fn(async () => 'fresh');
    const a = await cache.wrap('k3', 60, producer);
    const b = await cache.wrap('k3', 60, producer);
    expect(a).toBe('fresh');
    expect(b).toBe('fresh');
    expect(producer).toHaveBeenCalledTimes(1);
  });

  it('wrap is single-flight under concurrency (no stampede)', async () => {
    let calls = 0;
    const producer = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 20));
      return calls;
    };
    const [a, b, c] = await Promise.all([
      cache.wrap('k4', 60, producer),
      cache.wrap('k4', 60, producer),
      cache.wrap('k4', 60, producer),
    ]);
    expect(calls).toBe(1);
    expect([a, b, c]).toEqual([1, 1, 1]);
  });
});
