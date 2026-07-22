import { scanSourceInbox } from './source-pipeline';

const report = await scanSourceInbox();
console.log(
  `Source scan complete: ${report.discovered} new, ${report.duplicates} duplicate, ${report.quarantined} quarantined, ${report.unchanged} unchanged.`,
);
console.log(`Manifest: ${report.manifestPath}`);
