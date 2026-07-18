import { describe, expect, it } from 'vitest';

import { RateLimitedError } from '@/server/http/errors';
import { clientIp, enforceRateLimit } from '@/server/http/rate-limit';

// Redis is unconfigured in tests, so this exercises the in-memory fallback.
describe('enforceRateLimit (memory fallback)', () => {
  it('allows requests up to the limit then throws RateLimitedError', async () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      await expect(enforceRateLimit({ key, limit: 3, windowSeconds: 60 })).resolves.toBeUndefined();
    }
    await expect(enforceRateLimit({ key, limit: 3, windowSeconds: 60 })).rejects.toBeInstanceOf(
      RateLimitedError,
    );
  });

  it('scopes counts per key', async () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    await enforceRateLimit({ key: a, limit: 1, windowSeconds: 60 });
    // Different key still has its full budget.
    await expect(
      enforceRateLimit({ key: b, limit: 1, windowSeconds: 60 }),
    ).resolves.toBeUndefined();
    await expect(enforceRateLimit({ key: a, limit: 1, windowSeconds: 60 })).rejects.toBeInstanceOf(
      RateLimitedError,
    );
  });
});

describe('clientIp', () => {
  it('prefers the platform-set x-real-ip over x-forwarded-for', () => {
    const req = new Request('http://x', {
      headers: { 'x-real-ip': '9.9.9.9', 'x-forwarded-for': '1.1.1.1, 2.2.2.2' },
    });
    expect(clientIp(req)).toBe('9.9.9.9');
  });

  it('falls back to the LAST x-forwarded-for hop (first is client-controlled)', () => {
    const req = new Request('http://x', {
      headers: { 'x-forwarded-for': 'spoofed, 2.2.2.2' },
    });
    expect(clientIp(req)).toBe('2.2.2.2');
  });

  it('returns unknown when no proxy headers exist', () => {
    expect(clientIp(new Request('http://x'))).toBe('unknown');
  });
});
