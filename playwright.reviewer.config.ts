import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

const localChromeChannel =
  process.platform === 'darwin' &&
  existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    ? ('chrome' as const)
    : undefined;
const includeWebKit =
  process.env.CI === 'true' || process.env.PSYCHSIM_TEST_REVIEWER_WEBKIT === '1';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'reviewer-mobile.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:43818',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm --prefix apps/web run preview -- --host 127.0.0.1 --port 43818 --strictPort',
    url: 'http://127.0.0.1:43818',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'mobile-reviewer-pixel-7',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
        ...(localChromeChannel ? { channel: localChromeChannel } : {}),
      },
    },
    {
      name: 'mobile-reviewer-320px',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 320, height: 700 },
        ...(localChromeChannel ? { channel: localChromeChannel } : {}),
      },
    },
    ...(includeWebKit
      ? [
          {
            name: 'mobile-reviewer-iphone-webkit',
            use: {
              ...devices['iPhone 13'],
            },
          },
        ]
      : []),
  ],
});
