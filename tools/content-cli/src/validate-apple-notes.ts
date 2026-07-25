import { validateAppleNotesManifest } from './apple-notes-provider';
import { validateAppleNotesCodexReviewAudit } from './apple-notes-codex-review';

const manifest = await validateAppleNotesManifest();
if (!manifest) {
  console.log('PASS no local Apple Notes manifest (clean checkout)');
} else {
  const attachments = manifest.notes.flatMap((note) => note.attachmentRecords);
  console.log(
    `PASS Apple Notes private manifest (${manifest.notes.length} note records; ${attachments.length} attachment records)`,
  );
}
const codexReviewAudit = await validateAppleNotesCodexReviewAudit();
if (!codexReviewAudit) {
  console.log('PASS no private Apple Notes Codex review packets');
} else {
  console.log(
    `PASS Apple Notes Codex review audit (${codexReviewAudit.entries.length} bounded packet records)`,
  );
}
