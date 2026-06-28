import 'server-only';

import { type Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

export const couponsRepo = {
  /** Look up an active coupon by its (case-sensitive) code. */
  findActiveByCode(code: string) {
    return prisma.coupon.findFirst({ where: { code, isActive: true } });
  },
};

/** Admin-side coupon management (full visibility, ignores isActive filter). */
export const adminCouponsRepo = {
  list() {
    return prisma.coupon.findMany({
      orderBy: { id: 'desc' },
      include: { _count: { select: { usages: true } } },
      take: 200,
    });
  },

  findByCode(code: string) {
    return prisma.coupon.findUnique({ where: { code } });
  },

  create(data: Prisma.CouponCreateInput) {
    return prisma.coupon.create({ data });
  },

  setActive(id: string, isActive: boolean) {
    return prisma.coupon.update({ where: { id }, data: { isActive } });
  },

  delete(id: string) {
    return prisma.coupon.delete({ where: { id } });
  },
};
