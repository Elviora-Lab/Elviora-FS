import 'server-only';

import { z } from 'zod';

export const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const strongPassword = z
  .string()
  .min(8)
  .max(128)
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/[a-z]/, 'Include at least one lowercase letter')
  .regex(/[0-9]/, 'Include at least one number');

export const registerBody = z.object({
  name: z.string().min(2).max(160),
  email: z.string().email(),
  password: strongPassword,
});

export const forgotPasswordBody = z.object({
  email: z.string().email(),
});

export const resetPasswordBody = z.object({
  token: z.string().min(10),
  password: strongPassword,
});

export type LoginBody = z.infer<typeof loginBody>;
export type RegisterBody = z.infer<typeof registerBody>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBody>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBody>;
