import { auditAppleNotesFolder } from './apple-notes-provider';

const valueAfter = (flag: string): string | undefined => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const folderName = valueAfter('--folder') ?? 'Psych research';
const report = await auditAppleNotesFolder({ folderName });

console.log(
  `Apple Notes audit complete: ${report.notes} notes, ${report.attachments} attachments, ${report.lockedNotes} locked, ${report.sharedNotes} shared.`,
);
console.log(`Private metadata manifest: ${report.manifestPath}`);
console.log('No note title, body, or attachment bytes were read by this audit.');
