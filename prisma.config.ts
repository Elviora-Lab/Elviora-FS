import path from 'node:path';

import { config as loadEnv } from 'dotenv';
import type { PrismaConfig } from 'prisma';

// Prisma 6 stops loading env vars automatically when this config file is present.
// Load .env.local first (dev), then .env (prod baseline). First write wins.
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

/**
 * Prisma 6+ config file (replaces the deprecated `package.json#prisma` block).
 * Picks up DATABASE_URL from .env / .env.local automatically.
 */
export default {
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
} satisfies PrismaConfig;
