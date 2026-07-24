import { resolve } from 'node:path';

import {
  getSingleDiagnosisClassificationRegistryEntry,
  readDiagnosisClassification,
  searchDiagnosisClassification,
} from './diagnosis-classification';
import { contentRegistry } from '../../../packages/content-runtime/src/registry';

const query = process.argv.slice(2).join(' ').trim();
if (!query) throw new Error('Usage: pnpm content:diagnoses:search -- <code or phrase>');

const directory = resolve(getSingleDiagnosisClassificationRegistryEntry(contentRegistry).path);
const { catalog } = await readDiagnosisClassification(
  resolve(directory, 'release.json'),
  resolve(directory, 'terms.json'),
);
const matches = searchDiagnosisClassification(catalog, query);
if (matches.length === 0) {
  console.log(`No diagnosis-classification terms matched "${query}".`);
} else {
  for (const term of matches) {
    console.log(
      `${term.code}\t${term.longDescription}\t${term.billable ? 'billable' : 'category'}`,
    );
  }
}
