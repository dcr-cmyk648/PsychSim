import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { DiagnosisClassificationReleaseSchema } from '@psychsim/schemas';
import { contentRegistry } from '../../../packages/content-runtime/src/registry';

import {
  getSingleDiagnosisClassificationRegistryEntry,
  normalizedDiagnosisTermsSha256,
  parseIcd10CmOrderText,
  validateDiagnosisClassification,
  verifyClassificationSourceMember,
} from './diagnosis-classification';

const classificationDirectory = resolve(
  getSingleDiagnosisClassificationRegistryEntry(contentRegistry).path,
);
const releasePath = resolve(classificationDirectory, 'release.json');
const outputPath = resolve(classificationDirectory, 'terms.json');
const inputPath = process.argv[2] ? resolve(process.argv[2]) : null;

if (!inputPath) {
  throw new Error('Usage: pnpm content:diagnoses:import -- /path/to/icd10cm-order-2026.txt');
}

const [releaseBytes, sourceBytes] = await Promise.all([readFile(releasePath), readFile(inputPath)]);
const release = DiagnosisClassificationReleaseSchema.parse(
  JSON.parse(releaseBytes.toString('utf8')) as unknown,
);
verifyClassificationSourceMember(sourceBytes, release);
const catalog = parseIcd10CmOrderText(
  sourceBytes.toString('utf8'),
  release.id,
  release.includedCodePrefixes,
);
const generatedHash = normalizedDiagnosisTermsSha256(catalog);
if (generatedHash !== release.normalizedTermsSha256) {
  throw new Error(
    `Generated catalog SHA-256 mismatch: expected ${release.normalizedTermsSha256}; found ${generatedHash}.`,
  );
}
const report = validateDiagnosisClassification(release, catalog);
if (!report.valid) {
  throw new Error(report.issues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'));
}

await mkdir(dirname(outputPath), { recursive: true });
const temporaryPath = `${outputPath}.tmp`;
await writeFile(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
await rename(temporaryPath, outputPath);
console.log(`Imported ${catalog.terms.length} ${release.system} terms to ${outputPath}.`);
