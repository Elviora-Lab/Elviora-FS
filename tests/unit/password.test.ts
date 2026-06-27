import { describe, expect, it } from 'vitest';

import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from '@/server/auth/password';

describe('password', () => {
  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('s3cret-pa55!');
    expect(await verifyPassword('s3cret-pa55!', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('s3cret-pa55!');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('returns false for an empty hash instead of throwing', async () => {
    expect(await verifyPassword('anything', '')).toBe(false);
  });

  it('uses a valid bcrypt hash for the timing-equalizer that never matches', async () => {
    expect(DUMMY_PASSWORD_HASH.startsWith('$2')).toBe(true);
    expect(await verifyPassword('anything', DUMMY_PASSWORD_HASH)).toBe(false);
  });
});
