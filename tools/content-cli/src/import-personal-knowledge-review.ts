import { pathToFileURL } from 'node:url';

import { importPersonalKnowledgeClassification } from './personal-knowledge-workspace';

export const runImportPersonalKnowledgeReviewCli = async (
  args: readonly string[],
): Promise<void> => {
  args = args.filter((argument) => argument !== '--');
  if (args.length !== 1) {
    throw new Error('Usage: pnpm content:knowledge:import -- /private/path/to/classification.json');
  }
  const result = await importPersonalKnowledgeClassification(args[0]!);
  console.log(`${result.imported ? 'IMPORTED' : 'UNCHANGED'} one private semantic classification.`);
  console.log(
    `${result.workspace.sourceUnitCandidates.length} source-unit candidates; ${result.workspace.opinionCandidates.length} opinion candidates; ${result.workspace.bibliographicCandidates.length} bibliographic candidates.`,
  );
  console.log('No private titles, summaries, citations, source text, or paths were printed.');
  console.log('No evidence, clinical rule, point value, ticket, or approval was created.');
};

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) {
  await runImportPersonalKnowledgeReviewCli(process.argv.slice(2));
}
