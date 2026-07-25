import { pathToFileURL } from 'node:url';

import {
  loadPersonalKnowledgePilotProfile,
  nextPersonalKnowledgePilotQueueEntry,
  refreshPersonalKnowledgePilotQueue,
} from './personal-knowledge-workspace';

const valueAfter = (args: readonly string[], flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

export const runPersonalKnowledgeIndexCli = async (args: readonly string[]): Promise<void> => {
  args = args.filter((argument) => argument !== '--');
  const allowed = new Set(['--refresh', '--next', '--profile']);
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    if (!allowed.has(argument)) throw new Error(`Unknown personal-knowledge option: ${argument}`);
    if (argument === '--profile') index += 1;
  }
  if (!args.includes('--refresh')) {
    throw new Error('The initial personal-knowledge index requires the explicit --refresh flag.');
  }
  const profilePath = valueAfter(args, '--profile');
  const queue = await refreshPersonalKnowledgePilotQueue({
    ...(profilePath ? { profilePath } : {}),
  });
  const profile = await loadPersonalKnowledgePilotProfile(profilePath);
  const active = queue.entries.filter((entry) => entry.state !== 'stale');
  console.log(`PASS private pilot queue: ${profile.label}`);
  console.log(
    `${active.length} candidate sources (${active.filter((entry) => entry.state === 'queued').length} queued; ${active.filter((entry) => entry.state === 'released').length} released; ${active.filter((entry) => entry.state === 'partially_classified').length} partially classified; ${active.filter((entry) => ['classified', 'adjudicated'].includes(entry.state)).length} fully classified/adjudicated).`,
  );
  console.log('No note title, text, OCR, attachment, excerpt, or private path was printed.');
  if (args.includes('--next')) {
    const next = nextPersonalKnowledgePilotQueueEntry(queue);
    console.log(
      next ? `Next opaque note record: ${next.noteRecordId}` : 'No queued source remains.',
    );
  }
};

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) {
  await runPersonalKnowledgeIndexCli(process.argv.slice(2));
}
