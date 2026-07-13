import 'server-only';

import { OrderStatus, ShipmentStatus } from '@prisma/client';

import { prisma } from '@/lib/db';

import { transitionOrder } from '@/server/services/order-transitions.service';
import { mapPostExStatus, trackPostExOrder } from '@/server/shipping/postex';

/** Shipment states we no longer poll — the parcel's journey is over. */
const TERMINAL: ShipmentStatus[] = [
  ShipmentStatus.DELIVERED,
  ShipmentStatus.RETURNED,
  ShipmentStatus.FAILED,
];

export type PostExSyncResult = {
  checked: number;
  updated: number;
  delivered: number;
  returned: number;
};

/**
 * Poll PostEx for every open consignment and reconcile our records: update the
 * shipment status, and when a parcel reaches a terminal step, transition the
 * order (Delivered → notify the customer; Returned → restock). Idempotent — a
 * status that hasn't moved writes nothing, and `transitionOrder` no-ops on an
 * unchanged status, so re-running never double-fires an email or a restock.
 */
export async function syncPostExShipments(): Promise<PostExSyncResult> {
  const shipments = await prisma.shipment.findMany({
    where: {
      courierName: 'PostEx',
      trackingNumber: { not: null },
      shipmentStatus: { notIn: TERMINAL },
    },
    select: { id: true, trackingNumber: true, shipmentStatus: true, orderId: true },
    take: 200,
  });

  const result: PostExSyncResult = { checked: 0, updated: 0, delivered: 0, returned: 0 };

  for (const s of shipments) {
    if (!s.trackingNumber) continue;
    result.checked += 1;
    try {
      const { status } = await trackPostExOrder(s.trackingNumber);
      const mapped = mapPostExStatus(status);

      if (mapped.shipment !== s.shipmentStatus) {
        await prisma.shipment.update({
          where: { id: s.id },
          data: {
            shipmentStatus: mapped.shipment,
            ...(mapped.shipment === ShipmentStatus.DELIVERED ? { deliveredAt: new Date() } : {}),
          },
        });
        result.updated += 1;
      }

      if (mapped.terminal && mapped.order) {
        await transitionOrder(s.orderId, mapped.order, `PostEx: ${status}`);
        if (mapped.order === OrderStatus.DELIVERED) result.delivered += 1;
        if (mapped.order === OrderStatus.RETURNED) result.returned += 1;
      }
    } catch {
      // Best-effort sweep: one courier hiccup shouldn't abort the rest.
    }
  }

  return result;
}
