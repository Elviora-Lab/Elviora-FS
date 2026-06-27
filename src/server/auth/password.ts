import 'server-only';

import bcrypt from 'bcryptjs';

const ROUNDS = 12;

/**
 * A real bcrypt hash (cost 12) used to equalize the cost of a login attempt
 * when the account doesn't exist. Comparing against this makes the
 * user-missing path spend roughly the same time as the user-found path,
 * closing the timing side-channel that would otherwise reveal which emails
 * are registered. The plaintext is irrelevant — nothing should ever match it.
 */
export const DUMMY_PASSWORD_HASH = '$2a$12$qWU7s7Ui6/PxZOKl4Fa6H.KUi7uVRpmoVrjlpFd6lGmD1U6/yKrde';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}
