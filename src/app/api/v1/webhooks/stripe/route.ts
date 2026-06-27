import { NextResponse } from 'next/server';
import { type Stripe } from 'stripe';

import { events } from '@/server/events';
import { verifyStripeWebhook } from '@/server/payments/stripe';
import { paymentsService } from '@/server/services/payments.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stripe webhook — verifies signature, then applies idempotent order-state
 * transitions. Stripe redelivers events (at-least-once); the paymentsService
 * transitions are guarded so a redelivery is a safe no-op. Handler failures
 * return 500 so Stripe retries.
 *
 * The handler reads the raw body (required for signature verification) and
 * MUST NOT use createHandler (which parses JSON).
 */
export async function POST(req: Request) {
  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = verifyStripeWebhook(req, rawBody);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.orderId;
        if (orderId) {
          const { transitioned } = await paymentsService.markOrderPaid(orderId, pi.id);
          // Fire non-critical side effects only on the FIRST transition so a
          // redelivery doesn't double-notify the customer.
          if (transitioned) events.emit('order.paid', { orderId });
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.orderId;
        if (orderId) await paymentsService.markPaymentFailed(orderId);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const piId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (piId) await paymentsService.markOrderRefundedByTransaction(piId);
        break;
      }
      default:
        // Ignore other events to keep the handler tight.
        break;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[stripe:webhook]', event.type, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
