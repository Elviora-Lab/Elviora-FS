import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      // Map the app's `@/*` path alias to `src/*`.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `server-only` throws when imported outside an RSC bundle; stub it so the
      // server modules under test can be imported in the Node test runtime.
      'server-only': fileURLToPath(new URL('./tests/stubs/empty.ts', import.meta.url)),
    },
  },
});
