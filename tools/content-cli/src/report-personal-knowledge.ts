import { pathToFileURL } from 'node:url';

import {
  loadPersonalKnowledgePilotProfile,
  loadPersonalKnowledgePilotQueue,
  loadPersonalKnowledgeWorkspace,
  validatePersonalKnowledgeWorkspace,
  writePersonalKnowledgeWorkbenchProjection,
} from './personal-knowledge-workspace';

export const runPersonalKnowledgeStatusCli = async (args: readonly string[]): Promise<void> => {
  args = args.filter((argument) => argument !== '--');
  if (args.length > 0) throw new Error('Personal-knowledge status takes no arguments.');
  const profile = await loadPersonalKnowledgePilotProfile();
  const queue = await loadPersonalKnowledgePilotQueue(profile.id);
  if (!queue) throw new Error('Refresh the personal-knowledge pilot queue first.');
  const workspace = await loadPersonalKnowledgeWorkspace();
  if (workspace) validatePersonalKnowledgeWorkspace(workspace);
  const projection = await writePersonalKnowledgeWorkbenchProjection();
  console.log(`PASS personal-knowledge workflow: ${profile.label}`);
  console.log(
    `${projection.summary.intakeEligibleSources} eligible; ${projection.summary.queuedSources} queued; ${projection.summary.releasedSources} released; ${projection.summary.partiallyClassifiedSources} partially classified; ${projection.summary.classifiedSources} fully classified.`,
  );
  console.log(
    `${projection.summary.opinionCandidates} opinion candidates; ${projection.summary.mappedCandidates} mapped; ${projection.summary.acceptedOpinions} accepted opinions; ${projection.summary.evidenceLinkedOpinions} evidence-linked.`,
  );
  console.log(
    `${projection.summary.ocrAttachmentsOutsideSemanticScope} locally OCRed attachments remain explicitly outside this semantic-review scope.`,
  );
  console.log('Updated the ignored, local-Developer workbench projection.');
  console.log('No private source text, title, citation, summary, or path was printed.');
};

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) {
  await runPersonalKnowledgeStatusCli(process.argv.slice(2));
}
