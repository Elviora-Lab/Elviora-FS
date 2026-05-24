import 'server-only';

import { type OrderStatus, type Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

export const ordersRepo = {
  listForUser(userId: string, skip: number, take: number) {
    return prisma.$transaction([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { items: true },
      }),
      prisma.order.count({ where: { userId } }),
    ]);
  },

  findByIdForUser(orderId: string, userId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, shipments: true, payments: true, statusHistory: true },
    });
  },

  create(data: Prisma.OrderCreateInput) {
    return prisma.order.create({ data, include: { items: true } });
  },

  setStatus(orderId: string, status: OrderStatus, note?: string, changedBy?: string) {
    return prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { orderStatus: status } }),
      prisma.orderStatusHistory.create({
        data: { orderId, status, note, changedBy },
      }),
    ]);
  },
};
