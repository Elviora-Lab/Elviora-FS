import 'server-only';

import { Prisma } from '@prisma/client';
import { customAlphabet } from 'nanoid';

import { prisma } from '@/lib/db';

import { events } from '@/server/events';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { cartRepo } from '@/server/repositories/cart.repo';
import { ordersRepo } from '@/server/repositories/orders.repo';

const orderNumberAlphabet = customAlphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ', 8);
const newOrderNumber = () => `ELV-${new Date().getFullYear()}-${orderNumberAlphabet()}`;

export const ordersService = {
  async listForUser(userId: string, page: number, pageSize: number) {
    const [items, total] = await ordersRepo.listForUser(userId, (page - 1) * pageSize, pageSize);
    return { items, total };
  },

  async getDetail(orderId: string, userId: string) {
    const order = await ordersRepo.findByIdForUser(orderId, userId);
    if (!order) throw new NotFoundError('Order not found');
    return order;
  },

  /**
   * Create an order from a cart. Runs inside a single transaction so the cart
   * is cleared atomically with order creation — no risk of double-charge.
   * The shipping address is denormalized onto the order so the order remains
   * printable even if the customer later edits the source UserAddress.
   */
  async createFromCart(opts: {
    userId: string;
    cartId: string;
    shippingAddress: {
      fullName: string;
      phone: string | null;
      country: string;
      city: string;
      area: string | null;
      addressLine1: string;
      addressLine2: string | null;
      postalCode: string | null;
    };
    currency?: string;
    notes?: string;
  }) {
    return prisma
      .$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({
          where: { id: opts.cartId },
          include: { items: { include: { product: true, variant: true } } },
        });
        if (!cart) throw new NotFoundError('Cart not found');
        if (cart.userId !== opts.userId) throw new NotFoundError('Cart not found');
        if (cart.items.length === 0) throw new BadRequestError('Cart is empty');

        const currency = opts.currency ?? 'PKR';
        const subtotal = cart.items.reduce(
          (sum, item) => sum + Number(item.price) * item.quantity,
          0,
        );

        const order = await tx.order.create({
          data: {
            userId: opts.userId,
            orderNumber: newOrderNumber(),
            subtotal: new Prisma.Decimal(subtotal),
            totalAmount: new Prisma.Decimal(subtotal),
            currency,
            notes: opts.notes,
            shippingFullName: opts.shippingAddress.fullName,
            shippingPhone: opts.shippingAddress.phone,
            shippingCountry: opts.shippingAddress.country,
            shippingCity: opts.shippingAddress.city,
            shippingArea: opts.shippingAddress.area,
            shippingAddressLine1: opts.shippingAddress.addressLine1,
            shippingAddressLine2: opts.shippingAddress.addressLine2,
            shippingPostalCode: opts.shippingAddress.postalCode,
            items: {
              create: cart.items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                productName: item.product.name,
                variantName: variantLabel(item.variant),
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: new Prisma.Decimal(Number(item.price) * item.quantity),
              })),
            },
            statusHistory: { create: { status: 'PENDING' } },
          },
          include: { items: true },
        });

        // Decrement stock for each variant.
        for (const item of cart.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQuantity: { decrement: item.quantity } },
            });
          }
        }

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        return order;
      })
      .then((order) => {
        events.emit('order.created', {
          orderId: order.id,
          userId: opts.userId,
          total: Number(order.totalAmount),
          currency: order.currency,
        });
        return order;
      });
  },
};

function variantLabel(
  v: { size: string | null; shade: string | null; fragrance: string | null } | null,
) {
  if (!v) return null;
  return [v.size, v.shade, v.fragrance].filter(Boolean).join(' · ') || null;
}

// Export cartRepo so checkout flows can pre-read cart (not used here directly).
export { cartRepo };
