'use server';

import { revalidatePath } from 'next/cache';
import { PaymentMethod, Prisma } from '@prisma/client';
import { z } from 'zod';

import { serverEnv } from '@/config/env';

import { prisma } from '@/lib/db';

import { withAction } from './_with-action';

import { requireUser } from '@/server/auth/guards';
import { BadRequestError } from '@/server/http/errors';
import { createPaymentIntent } from '@/server/payments/stripe';
import { addressesService } from '@/server/services/addresses.service';
import { ordersService } from '@/server/services/orders.service';
import { addressBody } from '@/server/validators/addresses.schema';

const placeOrderInput = z.object({
  /** Either an existing address id… */
  addressId: z.string().uuid().optional(),
  /** …or a new address payload to persist on the fly. */
  address: addressBody.optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().max(500).optional(),
  couponCode: z.string().min(1).max(64).optional(),
});

/**
 * Place an order from the user's server-side cart.
 *
 * Resolves (or creates) the shipping address, calls `ordersService.createFromCart`
 * (which already wraps stock decrement + cart clear in a single tx), and
 * records the chosen payment method as a PENDING payment row. Stripe charges
 * are reconciled by the webhook handler at /api/v1/webhooks/stripe.
 */
export const placeOrder = withAction(async (raw: unknown) => {
  const session = await requireUser();
  const input = placeOrderInput.parse(raw);

  if (!input.addressId && !input.address) {
    throw new BadRequestError('Provide a shipping address');
  }

  // Resolve the shipping address.
  const shippingAddress = input.addressId
    ? await addressesService.getOwned(input.addressId, session.sub)
    : await addressesService.create(session.sub, input.address!);

  // Find the user's server cart.
  const cart = await prisma.cart.findFirst({
    where: { userId: session.sub },
    include: { items: true },
  });
  if (!cart || cart.items.length === 0) {
    throw new BadRequestError('Your bag is empty');
  }

  const order = await ordersService.createFromCart({
    userId: session.sub,
    cartId: cart.id,
    notes: input.notes,
    couponCode: input.couponCode,
    shippingAddress: {
      fullName: shippingAddress.fullName,
      phone: shippingAddress.phone ?? null,
      country: shippingAddress.country,
      city: shippingAddress.city,
      area: shippingAddress.area ?? null,
      addressLine1: shippingAddress.addressLine1,
      addressLine2: shippingAddress.addressLine2 ?? null,
      postalCode: shippingAddress.postalCode ?? null,
    },
  });

  // Record the chosen payment method. The actual amount is captured/cleared
  // by the PSP webhook (Stripe) or by an operator (COD/bank transfer).
  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      paymentMethod: input.paymentMethod,
      // order.totalAmount is already a Decimal — pass it through, don't round-trip
      // through a JS float.
      amount: new Prisma.Decimal(order.totalAmount),
      paymentStatus: 'PENDING',
    },
  });

  // For card payments, open a Stripe PaymentIntent and return its client_secret
  // so the browser can confirm the charge. `metadata.orderId` is what the Stripe
  // webhook reads to reconcile the order; the PI id is stored as the payment's
  // transactionId so refunds can be matched back. Non-card methods (COD/bank)
  // skip this and are settled by an operator.
  let clientSecret: string | null = null;
  if (input.paymentMethod === PaymentMethod.CARD && serverEnv.STRIPE_SECRET_KEY) {
    const intent = await createPaymentIntent({
      amountMinor: Math.round(Number(order.totalAmount) * 100),
      currency: order.currency,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
      customerEmail: session.email,
    });
    clientSecret = intent.client_secret;
    await prisma.payment.update({
      where: { id: payment.id },
      data: { transactionId: intent.id },
    });
  }

  // `order.created` is emitted once by ordersService.createFromCart — do not
  // re-emit here, or every order would trigger its side effects twice.

  revalidatePath('/account/orders');
  return { orderId: order.id, orderNumber: order.orderNumber, clientSecret };
});
