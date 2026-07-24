import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const iconDirectory = resolve('apps/web/public/icons');
const source = await readFile(resolve(iconDirectory, 'psychsim.svg'), 'utf8');
const localChrome = existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const browser = await chromium.launch({
  headless: true,
  ...(localChrome ? { channel: 'chrome' as const } : {}),
});

try {
  for (const size of [180, 192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<style>html,body,svg{width:100%;height:100%;margin:0;display:block;overflow:hidden;background:#030806}</style>${source}`,
    );
    await page.screenshot({
      path: resolve(iconDirectory, `psychsim-${size}.png`),
      type: 'png',
      animations: 'disabled',
    });
    await page.close();
  }
} finally {
  await browser.close();
}

console.log('Generated PsychSim app icons at 180, 192, and 512 pixels.');
