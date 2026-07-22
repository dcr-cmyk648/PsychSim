import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { CaseBlueprintSchema } from '@psychsim/schemas';
import { catalogs, startingClinic, validateCaseBlueprint } from '@psychsim/content-runtime';

const reviewDirectory = resolve('content/cases/review');
const reviewPaths = (await readdir(reviewDirectory))
  .filter((filename) => filename.endsWith('.case.json'))
  .map((filename) => join(reviewDirectory, filename))
  .sort();

let failures = 0;
for (const path of reviewPaths) {
  const value = JSON.parse(await readFile(path, 'utf8')) as unknown;
  const blueprint = CaseBlueprintSchema.parse(value);
  const report = validateCaseBlueprint(blueprint, catalogs, startingClinic);
  if (blueprint.metadata.lifecycle !== 'review') {
    console.error(
      `FAIL ${blueprint.id}: Developer compile accepts review lifecycle only (${path}).`,
    );
    failures += 1;
    continue;
  }
  if (blueprint.metadata.medicalReviewStatus !== 'unreviewed') {
    console.error(`FAIL ${blueprint.id}: generated/review content must remain unreviewed.`);
    failures += 1;
    continue;
  }
  if (!report.valid) {
    console.error(`FAIL ${blueprint.id}`);
    for (const issue of report.issues) console.error(`  ${issue.code}: ${issue.message}`);
    failures += report.issues.filter((issue) => issue.severity === 'error').length;
  } else {
    console.log(`PASS ${blueprint.id}`);
  }
}

if (failures > 0) {
  console.error(`Developer content compile failed with ${failures} error(s).`);
  process.exitCode = 1;
} else {
  console.log(`Developer content compile passed (${reviewPaths.length} patient files).`);
}
