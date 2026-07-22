import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'apps/**/*.{test,spec}.{ts,tsx}',
      'packages/**/*.test.ts',
      'tools/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
    environment: 'node',
    coverage: { reporter: ['text', 'html'] },
  },
});
