import 'server-only';

import { z } from 'zod';

export const addressBody = z.object({
  fullName: z.string().min(2).max(160),
  phone: z.string().min(6).max(32).optional(),
  country: z.string().length(2, 'Use a 2-letter ISO country code'),
  city: z.string().min(1).max(120),
  area: z.string().max(160).optional(),
  addressLine1: z.string().min(3).max(255),
  addressLine2: z.string().max(255).optional(),
  postalCode: z.string().max(20).optional(),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressBody>;
