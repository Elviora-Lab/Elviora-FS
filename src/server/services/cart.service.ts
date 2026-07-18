import 'server-only';

import { prisma } from '@/lib/db';

import { events } from '@/server/events';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { cartRepo } from '@/server/repositories/cart.repo';

export const cartService = {
  async getCart(opts: { userId: string | null; sessionId: string }) {
    const cart = await cartRepo.findOrCreate({
      userId: opts.userId ?? undefined,
      sessionId: opts.sessionId,
    });
    return serializeCart(cart);
  },

  async addLine(
    opts: { userId: string | null; sessionId: string },
    payload: { variantId: string; quantity: number },
  ) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: payload.variantId },
      include: { product: true },
    });
    if (!variant || !variant.isActive) throw new NotFoundError('Variant not found');

    const cart = await cartRepo.findOrCreate({
      userId: opts.userId ?? undefined,
      sessionId: opts.sessionId,
    });

    const existing = cart.items.find(
      (i) => i.variantId === payload.variantId && i.productId === variant.productId,
    );
    const totalQuantity = (existing?.quantity ?? 0) + payload.quantity;
    if (variant.stockQuantity < totalQuantity) {
      throw new BadRequestError('Requested quantity exceeds stock');
    }

    await cartRepo.upsertLine(cart.id, {
      productId: variant.productId,
      variantId: variant.id,
      quantity: payload.quantity,
      price: Number(variant.price),
    });

    events.emit('cart.line.added', {
      userId: opts.userId,
      productId: variant.productId,
      variantId: variant.id,
    });

    const refreshed = await cartRepo.findById(cart.id);
    return refreshed ? serializeCart(refreshed) : null;
  },

  async updateLineQuantity(
    opts: { userId: string | null; sessionId: string },
    payload: { lineId: string; quantity: number },
  ) {
    const cart = await cartRepo.findOrCreate({
      userId: opts.userId ?? undefined,
      sessionId: opts.sessionId,
    });

    // Re-validate stock on quantity increase — `addLine` checks stock, but the
    // line could otherwise be bumped to any quantity here, bypassing that gate.
    const line = cart.items.find((i) => i.id === payload.lineId);
    if (!line) throw new NotFoundError('Cart line not found');
    if (payload.quantity > 0 && line.variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: line.variantId },
        select: { stockQuantity: true, isActive: true },
      });
      if (!variant || !variant.isActive) throw new NotFoundError('Variant not found');
      if (variant.stockQuantity < payload.quantity) {
        throw new BadRequestError('Requested quantity exceeds stock');
      }
    }

    const affected = await cartRepo.updateLineQuantity(cart.id, payload.lineId, payload.quantity);
    if (affected === 0) throw new NotFoundError('Cart line not found');

    const refreshed = await cartRepo.findById(cart.id);
    return refreshed ? serializeCart(refreshed) : null;
  },

  async removeLine(opts: { userId: string | null; sessionId: string }, lineId: string) {
    const cart = await cartRepo.findOrCreate({
      userId: opts.userId ?? undefined,
      sessionId: opts.sessionId,
    });
    const affected = await cartRepo.removeLine(cart.id, lineId);
    if (affected === 0) throw new NotFoundError('Cart line not found');

    const refreshed = await cartRepo.findById(cart.id);
    return refreshed ? serializeCart(refreshed) : null;
  },
};

function serializeCart(cart: Awaited<ReturnType<typeof cartRepo.findOrCreate>>) {
  const lines = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    slug: item.product.slug,
    name: item.product.name,
    imageUrl: item.product.images[0]?.imageUrl ?? '',
    unitPrice: Number(item.price),
    quantity: item.quantity,
    currency: 'PKR',
  }));

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  return {
    id: cart.id,
    lines,
    subtotal,
    discountTotal: 0,
    shippingTotal: 0,
    taxTotal: 0,
    total: subtotal,
    currency: 'PKR',
    couponCode: null as string | null,
  };
}
