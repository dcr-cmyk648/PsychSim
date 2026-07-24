import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { DiagnosisClassificationReleaseSchema } from '@psychsim/schemas';
import { contentRegistry } from '../../../packages/content-runtime/src/registry';
import {
  getSingleDiagnosisClassificationRegistryEntry,
  readDiagnosisClassification,
  validateDiagnosisClassification,
} from './diagnosis-classification';

const directory = resolve(getSingleDiagnosisClassificationRegistryEntry(contentRegistry).path);
const releasePath = resolve(directory, 'release.json');
const termsPath = resolve(directory, 'terms.json');
const releaseManifest = DiagnosisClassificationReleaseSchema.parse(
  JSON.parse(await readFile(releasePath, 'utf8')) as unknown,
);
try {
  await access(termsPath);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  console.log(
    `PASS ${releaseManifest.system} ${releaseManifest.versionLabel} release manifest; local catalog is not materialized. Run content:diagnoses:import to create the gitignored authoring cache.`,
  );
  process.exit(0);
}
const { release, catalog } = await readDiagnosisClassification(releasePath, termsPath);
const report = validateDiagnosisClassification(release, catalog);
if (!report.valid) {
  report.issues.forEach((issue) => console.error(`FAIL ${issue.code}: ${issue.message}`));
  process.exitCode = 1;
} else {
  console.log(
    `PASS ${release.system} ${release.versionLabel}: ${catalog.terms.length} terms; ${release.normalizedTermsSha256}`,
  );
}
