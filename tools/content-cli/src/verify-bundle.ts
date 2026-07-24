import { resolve } from 'node:path';

import { verifyProductionBundle } from './bundle-safety';

const bundleDirectory = resolve('apps/web/dist');
const reviewerBuild = process.env.VITE_PSYCHSIM_REVIEW_BUILD === '1';
const report = await verifyProductionBundle(bundleDirectory, {
  reviewerBuild,
});
if (!report.safe) {
  console.error(
    `${reviewerBuild ? 'Portable Reviewer' : 'Player'} bundle safety verification failed:`,
  );
  report.violations.forEach((violation) => console.error(`  - ${violation}`));
  process.exitCode = 1;
} else {
  console.log(
    `${reviewerBuild ? 'Portable Reviewer' : 'Player'} bundle safety passed (${report.filesScanned} files scanned).`,
  );
}
