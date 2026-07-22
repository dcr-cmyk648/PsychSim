import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { approvedCaseBlueprints, catalogs } from '@psychsim/content-runtime';

import { compilePatientScaffold } from './patient-scaffolding';

const arguments_ = process.argv.slice(2);
const requestPath = arguments_.find((argument) => !argument.startsWith('--'));
const force = arguments_.includes('--force');

if (!requestPath) {
  console.error('Usage: pnpm content:draft <patient-scaffold-request.json> [--force]');
  process.exitCode = 1;
} else {
  const request = JSON.parse(await readFile(resolve(requestPath), 'utf8')) as unknown;
  const compiled = await compilePatientScaffold(request, approvedCaseBlueprints, catalogs, {
    force,
  });
  console.log(`Created medically unreviewed Developer patient: ${compiled.blueprint.id}`);
  console.log(`Review case: ${compiled.blueprintPath}`);
  console.log(`Clinical audit tickets: ${compiled.auditTicketsPath}`);
  console.log(`Local provenance: ${compiled.provenancePath}`);
  console.log(
    'Restart the development server if it was already running so Vite discovers the new file.',
  );
}
