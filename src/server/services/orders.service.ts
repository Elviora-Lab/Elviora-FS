import 'server-only';

import { Prisma } from '@prisma/client';
import { customAlphabet } from 'nanoid';

import { prisma } from '@/lib/db';

import { events } from '@/server/events';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { cartRepo } from '@/server/repositories/cart.repo';
import { ordersRepo } from '@/server/repositories/orders.repo';
import { couponsService } from '@/server/services/coupons.service';

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
    couponCode?: string;
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
        // Accumulate money with Prisma.Decimal — never JS floats — so the stored
        // totals exactly match the sum of line prices.
        const subtotal = cart.items.reduce(
          (sum, item) => sum.add(new Prisma.Decimal(item.price).mul(item.quantity)),
          new Prisma.Decimal(0),
        );

        // Evaluate the coupon (if any) against the subtotal. Validation throws
        // a 400; the usage count is incremented atomically further below.
        let discount = new Prisma.Decimal(0);
        let appliedCoupon: { id: string } | null = null;
        if (opts.couponCode) {
          const evaluation = await couponsService.evaluate(opts.couponCode, subtotal);
          discount = evaluation.discount;
          appliedCoupon = { id: evaluation.coupon.id };
        }
        const totalAmount = subtotal.minus(discount);

        const order = await tx.order.create({
          data: {
            userId: opts.userId,
            orderNumber: newOrderNumber(),
            subtotal,
            discountAmount: discount,
            totalAmount,
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
                totalPrice: new Prisma.Decimal(item.price).mul(item.quantity),
              })),
            },
            statusHistory: { create: { status: 'PENDING' } },
          },
          include: { items: true },
        });

        // Decrement stock for each variant atomically. The `stockQuantity >=
        // quantity` guard is part of the WHERE clause, so two concurrent
        // checkouts of the last unit cannot both succeed — the loser's
        // updateMany affects 0 rows and we roll the whole transaction back.
        for (const item of cart.items) {
          if (item.variantId) {
            const { count } = await tx.productVariant.updateMany({
              where: { id: item.variantId, stockQuantity: { gte: item.quantity } },
              data: { stockQuantity: { decrement: item.quantity } },
            });
            if (count === 0) {
              throw new BadRequestError(`Insufficient stock for ${item.product.name}`);
            }
          }
        }

        // Redeem the coupon atomically. The column-comparison guard
        // (`used_count < usage_limit`) lives in the WHERE so concurrent
        // redemptions can't exceed the limit — if it affects 0 rows the coupon
        // was exhausted/deactivated between validation and now, and we roll back.
        if (appliedCoupon) {
          const affected = await tx.$executeRaw`
            UPDATE "coupons"
            SET "used_count" = "used_count" + 1
            WHERE "id" = ${appliedCoupon.id}::uuid
              AND "is_active" = true
              AND ("usage_limit" IS NULL OR "used_count" < "usage_limit")`;
          if (affected === 0) {
            throw new BadRequestError('This coupon is no longer available');
          }
          await tx.couponUsage.create({
            data: { couponId: appliedCoupon.id, userId: opts.userId, orderId: order.id },
          });
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
