import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // .tsx too, so component tests are picked up when they land.
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
    },
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
