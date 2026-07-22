import { resolve } from 'node:path';

import { verifyProductionBundle } from './bundle-safety';

const bundleDirectory = resolve('apps/web/dist');
const report = await verifyProductionBundle(bundleDirectory);
if (!report.safe) {
  console.error('Production bundle safety verification failed:');
  report.violations.forEach((violation) => console.error(`  - ${violation}`));
  process.exitCode = 1;
} else {
  console.log(`Production bundle safety passed (${report.filesScanned} files scanned).`);
}
