import 'server-only';

import { type Prisma, type ReturnStatus } from '@prisma/client';

import { prisma } from '@/lib/db';

export const returnsRepo = {
  findByOrder(orderId: string) {
    return prisma.returnRequest.findUnique({ where: { orderId } });
  },

  findById(id: string) {
    return prisma.returnRequest.findUnique({
      where: { id },
      include: { order: { select: { id: true, orderNumber: true, userId: true } } },
    });
  },

  create(data: { orderId: string; userId: string; reason: string; comment?: string }) {
    return prisma.returnRequest.create({ data });
  },

  listForAdmin(status?: ReturnStatus) {
    return prisma.returnRequest.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        order: { select: { orderNumber: true, totalAmount: true, currency: true } },
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });
  },

  setStatus(id: string, status: ReturnStatus, adminNote?: string, tx?: Prisma.TransactionClient) {
    return (tx ?? prisma).returnRequest.update({
      where: { id },
      data: { status, adminNote, resolvedAt: status === 'REQUESTED' ? null : new Date() },
    });
  },
};
