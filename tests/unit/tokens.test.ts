import { describe, expect, it } from 'vitest';

import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '@/server/auth/tokens';

describe('tokens', () => {
  it('round-trips an access token with its claims', async () => {
    const token = await signAccessToken({ sub: 'user-1', role: 'CUSTOMER', email: 'a@b.com' });
    const claims = await verifyAccessToken(token);
    expect(claims.sub).toBe('user-1');
    expect(claims.role).toBe('CUSTOMER');
    expect(claims.email).toBe('a@b.com');
  });

  it('round-trips a refresh token with its jti', async () => {
    const token = await signRefreshToken({ sub: 'user-1', jti: 'jti-123' });
    const claims = await verifyRefreshToken(token);
    expect(claims.sub).toBe('user-1');
    expect(claims.jti).toBe('jti-123');
  });

  it('rejects an access token when verified as a refresh token (audience split)', async () => {
    const access = await signAccessToken({ sub: 'user-1', role: 'CUSTOMER', email: 'a@b.com' });
    await expect(verifyRefreshToken(access)).rejects.toThrow();
  });

  it('rejects a tampered token', async () => {
    const token = await signAccessToken({ sub: 'user-1', role: 'CUSTOMER', email: 'a@b.com' });
    await expect(verifyAccessToken(token + 'x')).rejects.toThrow();
  });
});
