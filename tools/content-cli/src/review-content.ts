import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { CaseBlueprintSchema } from '@psychsim/schemas';

import { listExtractedSourceArtifacts } from './source-pipeline';

const artifacts = await listExtractedSourceArtifacts();
console.log(`Extracted source documents: ${artifacts.length}`);
for (const path of artifacts) {
  const raw = JSON.parse(await readFile(path, 'utf8')) as {
    document?: { id?: string; mediaType?: string };
    chunks?: unknown[];
  };
  console.log(
    `  - ${raw.document?.id ?? path} · ${raw.document?.mediaType ?? 'unknown'} · ${raw.chunks?.length ?? 0} chunks`,
  );
}

const reviewDirectory = resolve('content/cases/review');
const reviewPaths = (await readdir(reviewDirectory))
  .filter((filename) => filename.endsWith('.case.json'))
  .map((filename) => join(reviewDirectory, filename))
  .sort();
console.log(`Developer review patients: ${reviewPaths.length}`);
for (const path of reviewPaths) {
  const value = JSON.parse(await readFile(path, 'utf8')) as unknown;
  const blueprint = CaseBlueprintSchema.parse(value);
  console.log(`  - ${blueprint.id} · ${blueprint.metadata.medicalReviewStatus} · ${path}`);
}
