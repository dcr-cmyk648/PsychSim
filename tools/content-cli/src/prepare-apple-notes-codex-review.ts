import { pathToFileURL } from 'node:url';

import { AppleNotesCodexReviewAcknowledgementSchema } from '@psychsim/schemas';

import {
  prepareAppleNotesCodexReviewPacket,
  type AppleNotesCodexReviewSelector,
} from './apple-notes-codex-review';

const BOOLEAN_FLAGS = new Set([
  '--next',
  '--ack-no-phi',
  '--ack-authorized-external-ai-processing',
  '--ack-title-plaintext-rights',
  '--ack-shared-material-rights',
  '--ack-appropriate-to-transmit',
]);
const VALUE_FLAGS = new Set([
  '--note-id',
  '--segment',
  '--provider',
  '--model',
  '--acknowledged-by',
]);
const REQUIRED_ACKNOWLEDGEMENTS = [
  '--ack-no-phi',
  '--ack-authorized-external-ai-processing',
  '--ack-title-plaintext-rights',
  '--ack-shared-material-rights',
  '--ack-appropriate-to-transmit',
] as const;

export interface AppleNotesCodexReviewCliArguments {
  selector: AppleNotesCodexReviewSelector;
  provider: 'openai-codex';
  modelIdentifier: string;
  acknowledgedBy: string;
}

export const parseAppleNotesCodexReviewCliArgs = (
  args: readonly string[],
): AppleNotesCodexReviewCliArguments => {
  const booleans = new Set<string>();
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    if (!argument.startsWith('--')) {
      throw new Error(`Unexpected positional argument: ${argument}`);
    }
    if (!BOOLEAN_FLAGS.has(argument) && !VALUE_FLAGS.has(argument)) {
      throw new Error(`Unknown Apple Notes Codex review option: ${argument}`);
    }
    if (booleans.has(argument) || values.has(argument)) {
      throw new Error(`Duplicate Apple Notes Codex review option: ${argument}`);
    }
    if (BOOLEAN_FLAGS.has(argument)) {
      booleans.add(argument);
      continue;
    }
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`${argument} requires a value.`);
    }
    values.set(argument, value);
    index += 1;
  }

  const missingAcknowledgements = REQUIRED_ACKNOWLEDGEMENTS.filter((flag) => !booleans.has(flag));
  if (missingAcknowledgements.length > 0) {
    throw new Error(
      `Apple Notes title/plaintext review requires explicit acknowledgements: ${missingAcknowledgements.join(', ')}`,
    );
  }
  const provider = values.get('--provider');
  if (provider !== 'openai-codex') {
    throw new Error('--provider must be exactly openai-codex.');
  }
  const modelIdentifier = values.get('--model')?.trim();
  const acknowledgedBy = values.get('--acknowledged-by')?.trim();
  if (!modelIdentifier) throw new Error('--model requires the exact exposed model identifier.');
  if (!acknowledgedBy) throw new Error('--acknowledged-by requires the acknowledging person.');

  const next = booleans.has('--next');
  const noteId = values.get('--note-id');
  const segmentText = values.get('--segment');
  if (Number(next) + Number(Boolean(noteId)) !== 1) {
    throw new Error('Choose exactly one selector: --next or --note-id with --segment.');
  }
  let selector: AppleNotesCodexReviewSelector;
  if (next) {
    if (segmentText) throw new Error('--segment may be used only with --note-id.');
    selector = { kind: 'next' };
  } else {
    if (!segmentText) throw new Error('--note-id requires --segment.');
    const segment = Number(segmentText);
    if (!Number.isInteger(segment) || segment < 1) {
      throw new Error('--segment must be a positive, one-based integer.');
    }
    selector = { kind: 'exact', noteId: noteId!, segmentOrdinal: segment - 1 };
  }
  return { selector, provider, modelIdentifier, acknowledgedBy };
};

export const runAppleNotesCodexReviewCli = async (
  args: readonly string[],
  now = (): string => new Date().toISOString(),
): Promise<void> => {
  const parsed = parseAppleNotesCodexReviewCliArgs(args);
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
    selector: parsed.selector,
    acknowledgement,
    now: () => acknowledgedAt,
  });
  console.log(`${report.reused ? 'Reused' : 'Prepared'} private packet: ${report.packetId}`);
  console.log(`Segment: ${report.segmentOrdinal + 1}/${report.segmentCount}`);
  console.log(`Packet SHA-256: ${report.packetSha256}`);
  console.log(`Private packet path: ${report.packetPath}`);
  console.log(`Hash-only audit path: ${report.auditPath}`);
  console.log('No source text was printed. HTML, attachments, and OCR were excluded.');
  console.log('No provider or API call was made.');
};

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) {
  await runAppleNotesCodexReviewCli(process.argv.slice(2));
}
