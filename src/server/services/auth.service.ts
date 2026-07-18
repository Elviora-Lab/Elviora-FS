import 'server-only';

import { siteConfig } from '@/config/site';

import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  issueSession,
  type SessionUser,
  signPasswordResetToken,
  verifyPassword,
  verifyPasswordResetToken,
} from '@/server/auth';
import { sendEmail } from '@/server/email';
import { passwordResetEmail } from '@/server/email/templates/password-reset';
import { events } from '@/server/events';
import { ConflictError, UnauthorizedError } from '@/server/http/errors';
import { refreshTokensRepo } from '@/server/repositories/refresh-tokens.repo';
import { usersRepo } from '@/server/repositories/users.repo';

export const authService = {
  async register(input: { name: string; email: string; password: string }) {
    const existing = await usersRepo.findByEmail(input.email);
    if (existing) throw new ConflictError('An account with this email already exists');

    const [firstName, ...rest] = input.name.trim().split(' ');
    const user = await usersRepo.create({
      email: input.email.toLowerCase(),
      passwordHash: await hashPassword(input.password),
      firstName: firstName ?? null,
      lastName: rest.length ? rest.join(' ') : null,
    });

    const tokens = await issueSession(toSessionUser(user));

    events.emit('user.registered', {
      userId: user.id,
      email: user.email,
      name: input.name,
    });

    return { user: publicUser(user), ...tokens };
  },

  async login(input: { email: string; password: string }) {
    const user = await usersRepo.findByEmail(input.email);
    if (!user) {
      // Run a dummy compare so the no-such-user path costs the same as a wrong
      // password — otherwise response timing leaks which emails are registered.
      await verifyPassword(input.password, DUMMY_PASSWORD_HASH);
      throw new UnauthorizedError('Invalid email or password');
    }

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Invalid email or password');

    void usersRepo.updateLastLogin(user.id);

    const tokens = await issueSession(toSessionUser(user));
    return { user: publicUser(user), ...tokens };
  },

  /**
   * Email a password-reset link. Always resolves the same way regardless of
   * whether the email exists, so it can't be used to enumerate accounts.
   */
  async requestPasswordReset(email: string) {
    const user = await usersRepo.findByEmail(email);
    if (user) {
      const token = await signPasswordResetToken(user.id);
      const resetUrl = `${siteConfig.url}/reset-password?token=${encodeURIComponent(token)}`;
      const { subject, html, text } = passwordResetEmail({ resetUrl });
      await sendEmail({ to: user.email, subject, html, text });
    }
    return { ok: true as const };
  },

  async resetPassword(token: string, newPassword: string) {
    let sub: string;
    try {
      ({ sub } = await verifyPasswordResetToken(token));
    } catch {
      throw new UnauthorizedError('This reset link is invalid or has expired');
    }
    const user = await usersRepo.findById(sub);
    if (!user) throw new UnauthorizedError('This reset link is invalid or has expired');
    await usersRepo.update(user.id, { passwordHash: await hashPassword(newPassword) });
    await refreshTokensRepo.revokeAllForUser(user.id);
    return { ok: true as const };
  },

  async me(userId: string) {
    const user = await usersRepo.findById(userId);
    if (!user) throw new UnauthorizedError();
    return publicUser(user);
  },
};

function toSessionUser(user: {
  id: string;
  email: string;
  role: SessionUser['role'];
}): SessionUser {
  return { id: user.id, email: user.email, role: user.role };
}

function publicUser(user: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  profileImage: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    role: user.role,
    avatarUrl: user.profileImage ?? undefined,
  };
}
