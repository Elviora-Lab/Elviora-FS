import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load .env.local first for local development, then .env as a baseline.
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

/**
 * Prisma CLI config. Keep the datasource URL in `schema.prisma` for Prisma
 * 6.x compatibility; this file only carries CLI-only settings such as seed.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
