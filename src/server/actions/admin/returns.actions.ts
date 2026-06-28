'use server';

import { revalidatePath } from 'next/cache';
import { ReturnStatus } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/db';

import { withAction } from '../_with-action';

import { requireAdmin } from '@/server/auth/guards';
import { sendEmail } from '@/server/email';
import { returnUpdateEmail } from '@/server/email/templates/return-update';
import { NotFoundError } from '@/server/http/errors';
import { notifyUser } from '@/server/notifications';
import { ordersRepo } from '@/server/repositories/orders.repo';
import { returnsRepo } from '@/server/repositories/returns.repo';

const setStatusBody = z.object({
  id: z.string().uuid(),
  status: z.enum([ReturnStatus.APPROVED, ReturnStatus.REJECTED, ReturnStatus.REFUNDED]),
  adminNote: z.string().max(1000).optional(),
});

/** Admin moves a return request forward; REFUNDED also refunds the order. */
export const setReturnStatus = withAction(async (input: z.infer<typeof setStatusBody>) => {
  const session = await requireAdmin();
  const { id, status, adminNote } = setStatusBody.parse(input);

  const rr = await returnsRepo.findById(id);
  if (!rr) throw new NotFoundError('Return request not found');

  await returnsRepo.setStatus(id, status, adminNote);

  // Marking the return refunded flips the order to REFUNDED, which deducts it
  // from recognized revenue (orderStatus + paymentStatus both signal it).
  if (status === 'REFUNDED') {
    await ordersRepo.setStatus(rr.orderId, 'REFUNDED', `Refunded via return request`, session.sub);
    await prisma.order.update({
      where: { id: rr.orderId },
      data: { paymentStatus: 'REFUNDED' },
    });
  }

  // Notify + email the customer.
  await notifyAndEmail(rr.order.userId, rr.order.orderNumber, status);

  revalidatePath('/admin/returns');
  revalidatePath(`/admin/orders/${rr.orderId}`);
  return { id, status };
});

async function notifyAndEmail(userId: string | null, orderNumber: string, status: ReturnStatus) {
  if (!userId) return;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  await notifyUser({
    userId,
    type: 'ORDER_UPDATE',
    title: `Return ${status.toLowerCase()}`,
    message: `Your return for order ${orderNumber} is now ${status.toLowerCase()}.`,
  });
  if (user?.email) {
    const { subject, html, text } = returnUpdateEmail({ orderNumber, status });
    await sendEmail({ to: user.email, subject, html, text });
  }
}
