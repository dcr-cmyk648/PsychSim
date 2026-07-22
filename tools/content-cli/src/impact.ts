import { findAffectedContentIds } from '@psychsim/content-runtime';
import { contentRegistry } from '../../../packages/content-runtime/src/registry';

const targetIds = process.argv.slice(2);
if (targetIds.length === 0) {
  console.error('Usage: pnpm content:impact <stable-content-id> [more-ids]');
  process.exitCode = 1;
} else {
  const affected = findAffectedContentIds(contentRegistry, targetIds);
  console.log(`Targets: ${targetIds.join(', ')}`);
  if (affected.length === 0) {
    console.log('Affected dependents: none registered');
  } else {
    console.log('Affected dependents:');
    for (const id of affected) console.log(`  - ${id}`);
  }
}
