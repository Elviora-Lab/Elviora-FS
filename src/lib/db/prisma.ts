import { PrismaClient } from '@prisma/client';

import { isDev } from '@/config/env';

/**
 * Prisma client singleton.
 *
 * Next.js dev mode hot-reloads modules — without this guard, each reload
 * creates a new PrismaClient and exhausts the Postgres connection pool.
 * In production the cache is a no-op (module is loaded once).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ['query', 'error', 'warn'] : ['error'],
  });

if (isDev) {
  globalForPrisma.prisma = prisma;
}
