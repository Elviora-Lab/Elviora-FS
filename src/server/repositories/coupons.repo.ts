import 'server-only';

import { prisma } from '@/lib/db';

export const couponsRepo = {
  /** Look up an active coupon by its (case-sensitive) code. */
  findActiveByCode(code: string) {
    return prisma.coupon.findFirst({ where: { code, isActive: true } });
  },
};
