'use server';

import { revalidatePath } from 'next/cache';
import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

import { withAction } from '../_with-action';

import { requireAdmin } from '@/server/auth/guards';
import { ordersRepo } from '@/server/repositories/orders.repo';

const statusValues = Object.values(OrderStatus) as [OrderStatus, ...OrderStatus[]];

const updateStatusBody = z.object({
  orderId: z.string().uuid(),
  status: z.enum(statusValues),
  note: z.string().max(500).optional(),
});

export const updateOrderStatus = withAction(async (input: z.infer<typeof updateStatusBody>) => {
  const session = await requireAdmin();
  const { orderId, status, note } = updateStatusBody.parse(input);
  await ordersRepo.setStatus(orderId, status, note, session.sub);
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  return { orderId, status };
});
