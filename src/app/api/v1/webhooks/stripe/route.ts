import { NextResponse } from 'next/server';

import { events } from '@/server/events';
import { verifyStripeWebhook } from '@/server/payments/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stripe webhook — verifies signature, dispatches domain events.
 *
 * The handler reads the raw body (required for signature verification) and
 * MUST NOT use createHandler (which parses JSON). Errors are returned with
 * Stripe-friendly status codes so the dashboard surfaces retries.
 */
export async function POST(req: Request) {
  let event;
  try {
    const rawBody = await req.text();
    event = verifyStripeWebhook(req, rawBody);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      if (pi.metadata?.orderId) {
        events.emit('order.paid', { orderId: pi.metadata.orderId });
      }
      break;
    }
    case 'payment_intent.payment_failed':
      // hook here — notify ops, alert user
      break;
    case 'charge.refunded':
      // hook here — emit refund event, update order status
      break;
    default:
    // Ignore other events to keep the handler tight.
  }

  return NextResponse.json({ received: true });
}
