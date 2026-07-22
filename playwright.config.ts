import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

const localChromeChannel =
  process.platform === 'darwin' &&
  existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    ? ('chrome' as const)
    : undefined;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:43817',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm --prefix apps/web run dev -- --host 127.0.0.1 --port 43817 --strictPort',
    url: 'http://127.0.0.1:43817',
    reuseExistingServer: false,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(localChromeChannel ? { channel: localChromeChannel } : {}),
      },
    },
  ],
});
