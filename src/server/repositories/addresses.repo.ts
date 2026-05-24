import 'server-only';

import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

export const addressesRepo = {
  listForUser(userId: string) {
    return prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  },

  findByIdForUser(id: string, userId: string) {
    return prisma.userAddress.findFirst({ where: { id, userId } });
  },

  /**
   * Create an address. When the new address is the default, clear the
   * existing default in the same transaction — the DB has a partial-unique
   * index that would otherwise reject the second `isDefault = true` row.
   */
  async create(userId: string, data: Omit<Prisma.UserAddressCreateInput, 'user'>) {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.userAddress.create({
        data: { ...data, user: { connect: { id: userId } } },
      });
    });
  },

  delete(id: string, userId: string) {
    return prisma.userAddress.deleteMany({ where: { id, userId } });
  },
};
