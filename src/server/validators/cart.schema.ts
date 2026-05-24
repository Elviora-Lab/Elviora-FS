import 'server-only';

import { z } from 'zod';

export const addLineBody = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const updateLineBody = z.object({
  quantity: z.number().int().min(0).max(99),
});

export const lineParams = z.object({ lineId: z.string().uuid() });

export const applyCouponBody = z.object({
  code: z.string().min(1).max(64),
});
