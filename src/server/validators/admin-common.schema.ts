import { z } from 'zod';

/**
 * Shared input schemas for admin Server Actions. Every action must parse its
 * input — raw `{ id: string }` params would otherwise flow unvalidated into
 * Prisma queries.
 */
export const idInput = z.object({ id: z.string().uuid() });

export const idToggleActiveInput = z.object({
  id: z.string().uuid(),
  isActive: z.boolean(),
});
