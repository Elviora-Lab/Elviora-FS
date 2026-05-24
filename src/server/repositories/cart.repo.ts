import 'server-only';

import { prisma } from '@/lib/db';

export const cartRepo = {
  async findOrCreate(opts: { userId?: string; sessionId?: string }) {
    if (!opts.userId && !opts.sessionId) {
      throw new Error('cartRepo.findOrCreate requires userId or sessionId');
    }
    const where = opts.userId ? { userId: opts.userId } : { sessionId: opts.sessionId! };
    const existing = await prisma.cart.findFirst({ where, include: cartInclude });
    if (existing) return existing;
    return prisma.cart.create({
      data: { userId: opts.userId, sessionId: opts.sessionId },
      include: cartInclude,
    });
  },

  findById(id: string) {
    return prisma.cart.findUnique({ where: { id }, include: cartInclude });
  },

  async upsertLine(
    cartId: string,
    payload: {
      productId: string;
      variantId: string | null;
      quantity: number;
      price: number;
    },
  ) {
    // Prisma compound uniques don't match nullable parts, so we do
    // find → update | create explicitly, inside a transaction to close the
    // race between the SELECT and INSERT.
    return prisma.$transaction(async (tx) => {
      const existing = await tx.cartItem.findFirst({
        where: {
          cartId,
          productId: payload.productId,
          variantId: payload.variantId,
        },
        select: { id: true },
      });
      if (existing) {
        return tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: { increment: payload.quantity }, price: payload.price },
        });
      }
      return tx.cartItem.create({ data: { cartId, ...payload } });
    });
  },

  updateLineQuantity(lineId: string, quantity: number) {
    if (quantity <= 0) return prisma.cartItem.delete({ where: { id: lineId } });
    return prisma.cartItem.update({ where: { id: lineId }, data: { quantity } });
  },

  removeLine(lineId: string) {
    return prisma.cartItem.delete({ where: { id: lineId } });
  },

  clear(cartId: string) {
    return prisma.cartItem.deleteMany({ where: { cartId } });
  },

  applyCoupon(cartId: string, _code: string) {
    // Note: schema stores couponCode on `coupon_usages` (post-order). For the
    // pre-order cart hint, we'd add a `couponCode` column on `carts` in a future
    // migration. For now this is a no-op placeholder.
    return prisma.cart.findUnique({ where: { id: cartId }, include: cartInclude });
  },
};

const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
      variant: { select: { id: true, sku: true, size: true, shade: true, fragrance: true } },
    },
  },
} as const;
