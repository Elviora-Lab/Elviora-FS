import 'server-only';

import { prisma } from '@/lib/db';

/**
 * Persistence for issued refresh tokens. The store is the source of truth for
 * whether a (cryptographically valid) refresh JWT is still honored — enabling
 * rotation, logout revocation, and reuse detection.
 */
export const refreshTokensRepo = {
  create(data: { jti: string; userId: string; expiresAt: Date }) {
    return prisma.refreshToken.create({ data });
  },

  findByJti(jti: string) {
    return prisma.refreshToken.findUnique({ where: { jti } });
  },

  /** Revoke a single token if still active. Returns rows affected. */
  async revoke(jti: string, replacedBy?: string) {
    const { count } = await prisma.refreshToken.updateMany({
      where: { jti, revokedAt: null },
      data: { revokedAt: new Date(), replacedBy: replacedBy ?? null },
    });
    return count;
  },

  /** Revoke every active token for a user — used on reuse detection. */
  async revokeAllForUser(userId: string) {
    const { count } = await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count;
  },

  /**
   * Purge rows that no longer serve any purpose: tokens past their JWT expiry
   * (unverifiable anyway), and tokens revoked more than `revokedGraceDays` ago.
   * Recently-revoked rows are kept — presenting one is how token-theft reuse
   * is detected, so deleting them immediately would blind that check.
   */
  async purgeExpired(revokedGraceDays = 30) {
    const now = new Date();
    const revokedBefore = new Date(now.getTime() - revokedGraceDays * 24 * 60 * 60 * 1000);
    const { count } = await prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { revokedAt: { lt: revokedBefore } }],
      },
    });
    return count;
  },
};
