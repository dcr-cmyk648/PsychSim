import { pathToFileURL } from 'node:url';

import { AppleNotesCodexReviewAcknowledgementSchema } from '@psychsim/schemas';

import { prepareAppleNotesCodexReviewPacket } from './apple-notes-codex-review';
import { parseAppleNotesCodexReviewCliArgs } from './prepare-apple-notes-codex-review';
import { loadAppleNotesIntakeManifestMetadata } from './apple-notes-provider';
import {
  loadPersonalKnowledgePilotProfile,
  loadPersonalKnowledgePilotQueue,
  nextPersonalKnowledgePilotReviewSelection,
  recordPersonalKnowledgePacketRelease,
} from './personal-knowledge-workspace';

const removeProfileFlag = (
  args: readonly string[],
): { remaining: string[]; profilePath: string | undefined } => {
  const remaining: string[] = [];
  let profilePath: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--profile') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error('--profile requires a path.');
      profilePath = value;
      index += 1;
    } else {
      remaining.push(args[index]!);
    }
  }
  return { remaining, profilePath };
};

export const runPreparePersonalKnowledgeReviewCli = async (
  args: readonly string[],
  now = (): string => new Date().toISOString(),
): Promise<void> => {
  args = args.filter((argument) => argument !== '--');
  const { remaining, profilePath } = removeProfileFlag(args);
  if (
    remaining.includes('--next') ||
    remaining.includes('--note-id') ||
    remaining.includes('--segment')
  ) {
    throw new Error('The pilot queue selects the next source; omit generic packet selectors.');
  }
  const parsed = parseAppleNotesCodexReviewCliArgs([...remaining, '--next']);
  const profile = await loadPersonalKnowledgePilotProfile(profilePath);
  const queue = await loadPersonalKnowledgePilotQueue(profile.id);
  if (!queue) throw new Error('Refresh the personal-knowledge pilot queue first.');
  const next = nextPersonalKnowledgePilotReviewSelection(queue);
  if (!next) throw new Error('No queued personal-knowledge pilot segment remains.');
  const manifest = await loadAppleNotesIntakeManifestMetadata();
  const currentNote = manifest?.notes.find((note) => note.id === next.entry.noteRecordId);
  if (
    !currentNote ||
    currentNote.sourceDocumentId !== next.entry.sourceDocumentId ||
    currentNote.titleHash !== next.entry.titleHash ||
    currentNote.plaintextHash !== next.entry.plaintextHash ||
    currentNote.modifiedAtProvider !== next.entry.sourceModifiedAtProvider
  ) {
    throw new Error(
      'The queued Apple Notes revision changed; refresh the personal-knowledge index before release.',
    );
  }
  const acknowledgedAt = now();
  const acknowledgement = AppleNotesCodexReviewAcknowledgementSchema.parse({
    schemaVersion: 1,
    contentScope: 'apple_notes_title_plaintext_only',
    noIdentifiablePatientInformation: true,
    authorizedForExternalAiProcessing: true,
    titlePlaintextTransmissionRightsAcknowledged: true,
    sharedMaterialRightsAcknowledged: true,
    appropriateToTransmitToOpenAiCodex: true,
    provider: 'openai_codex',
    modelIdentifier: parsed.modelIdentifier,
    acknowledgedAt,
    acknowledgedBy: parsed.acknowledgedBy,
  });
  const report = await prepareAppleNotesCodexReviewPacket({
    selector: {
      kind: 'exact',
      noteId: next.entry.noteRecordId,
      segmentOrdinal: next.segmentOrdinal,
    },
    acknowledgement,
    now: () => acknowledgedAt,
  });
  await recordPersonalKnowledgePacketRelease(
    profile.id,
    next.entry.noteRecordId,
    report.packetId,
    report.segmentOrdinal,
    report.segmentCount,
  );
  console.log(`${report.reused ? 'Reused' : 'Prepared'} one private pilot packet.`);
  console.log(`Packet ID: ${report.packetId}`);
  console.log(`Segment: ${report.segmentOrdinal + 1}/${report.segmentCount}`);
  console.log(`Packet SHA-256: ${report.packetSha256}`);
  console.log(`Private packet path: ${report.packetPath}`);
  console.log('No source text was printed. Attachments, OCR, and HTML remain excluded.');
  console.log('No provider or API call was made.');
};

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) {
  await runPreparePersonalKnowledgeReviewCli(process.argv.slice(2));
}
