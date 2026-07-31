import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The deterministic pipeline audit can keep a fork worker busy for more
    // than Vitest's fixed RPC acknowledgement window. Threads preserve the
    // same isolation while allowing the complete suite to report and exit.
    pool: 'threads',
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
