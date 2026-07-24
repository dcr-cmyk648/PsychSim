import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { CaseBlueprintSchema } from '@psychsim/schemas';
import { catalogs, startingClinic, validateCaseBlueprint } from '@psychsim/content-runtime';
import { reviewerCaseBlueprints } from '@psychsim/content-runtime/reviewer';
import { resolveClinicForProgressionMode } from '@psychsim/engine';

const reviewDirectory = resolve('content/cases/review');
const reviewPaths = (await readdir(reviewDirectory))
  .filter((filename) => filename.endsWith('.case.json'))
  .map((filename) => join(reviewDirectory, filename))
  .sort();
const reviewerClinic = resolveClinicForProgressionMode(startingClinic, 'endgame', catalogs);

let failures = 0;

const validateReviewBlueprint = (
  blueprint: ReturnType<typeof CaseBlueprintSchema.parse>,
  sourceLabel: string,
  clinic = startingClinic,
): void => {
  const report = validateCaseBlueprint(blueprint, catalogs, clinic);
  if (blueprint.metadata.lifecycle !== 'review') {
    console.error(
      `FAIL ${blueprint.id}: Developer compile accepts review lifecycle only (${sourceLabel}).`,
    );
    failures += 1;
    return;
  }
  if (blueprint.metadata.medicalReviewStatus !== 'unreviewed') {
    console.error(`FAIL ${blueprint.id}: generated/review content must remain unreviewed.`);
    failures += 1;
    return;
  }
  if (!report.valid) {
    console.error(`FAIL ${blueprint.id}`);
    for (const issue of report.issues) console.error(`  ${issue.code}: ${issue.message}`);
    failures += report.issues.filter((issue) => issue.severity === 'error').length;
  } else {
    console.log(`PASS ${blueprint.id}`);
  }
};

for (const path of reviewPaths) {
  const value = JSON.parse(await readFile(path, 'utf8')) as unknown;
  validateReviewBlueprint(CaseBlueprintSchema.parse(value), path);
}

for (const blueprint of reviewerCaseBlueprints) {
  validateReviewBlueprint(blueprint, 'explicit portable Reviewer cohort', reviewerClinic);
}

if (failures > 0) {
  console.error(`Developer content compile failed with ${failures} error(s).`);
  process.exitCode = 1;
} else {
  console.log(
    `Developer content compile passed (${reviewPaths.length} review files + ${reviewerCaseBlueprints.length} portable Reviewer scenarios).`,
  );
}
