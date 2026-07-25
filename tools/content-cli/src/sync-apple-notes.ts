import { AppleNotesLocalAcknowledgementSchema } from '@psychsim/schemas';

import { syncAppleNotesFolder } from './apple-notes-provider';
import { extractDiscoveredSources, scanSourceInbox } from './source-pipeline';

const hasFlag = (flag: string): boolean => process.argv.includes(flag);
const valueAfter = (flag: string): string | undefined => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const folderName = valueAfter('--folder') ?? 'Psych research';
const acknowledgedBy = valueAfter('--acknowledged-by');
const missingAcknowledgements = [
  ['--ack-no-phi', hasFlag('--ack-no-phi')],
  ['--ack-authorized-local-processing', hasFlag('--ack-authorized-local-processing')],
  ['--ack-shared-material-rights', hasFlag('--ack-shared-material-rights')],
  ['--acknowledged-by <name>', Boolean(acknowledgedBy)],
]
  .filter(([, present]) => !present)
  .map(([flag]) => flag);

if (missingAcknowledgements.length > 0) {
  throw new Error(
    `Apple Notes body/attachment export requires explicit local-processing acknowledgements: ${missingAcknowledgements.join(', ')}`,
  );
}

const acknowledgement = AppleNotesLocalAcknowledgementSchema.parse({
  schemaVersion: 1,
  noIdentifiablePatientInformation: true,
  authorizedForLocalProcessing: true,
  sharedMaterialRightsAcknowledged: true,
  acknowledgedAt: new Date().toISOString(),
  acknowledgedBy,
});
const report = await syncAppleNotesFolder({
  folderName,
  acknowledgement,
  ocr: !hasFlag('--skip-ocr'),
});
const scan = await scanSourceInbox();
const extraction = await extractDiscoveredSources();

console.log(
  `Apple Notes sync complete: ${report.exported} exported, ${report.unchanged} unchanged, ${report.quarantined} quarantined.`,
);
console.log(
  `Attachments: ${report.attachmentQuarantined} quarantined. Local OCR: ${report.ocrCompleted} completed, ${report.ocrEmpty} empty, ${report.ocrUnsupported} unsupported, ${report.ocrFailed} failed.`,
);
console.log(
  `Source pipeline: ${scan.discovered} new, ${scan.duplicates} duplicate; ${extraction.extracted} extracted, ${extraction.quarantined} quarantined.`,
);
console.log(`Private manifest: ${report.manifestPath}`);
console.log('No source text was printed or transmitted. All derived material remains local-only.');
