import { validateAppleNotesManifest } from './apple-notes-provider';

const manifest = await validateAppleNotesManifest();
if (!manifest) {
  console.log('PASS no local Apple Notes manifest (clean checkout)');
} else {
  const attachments = manifest.notes.flatMap((note) => note.attachmentRecords);
  console.log(
    `PASS Apple Notes private manifest (${manifest.notes.length} note records; ${attachments.length} attachment records)`,
  );
}
