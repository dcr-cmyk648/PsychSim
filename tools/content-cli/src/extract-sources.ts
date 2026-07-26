import { extractDiscoveredSources } from './source-pipeline';

const arguments_ = process.argv.slice(2);
const refreshEntryIds: string[] = [];
for (let index = 0; index < arguments_.length; index += 1) {
  const argument = arguments_[index];
  if (argument === '--') continue;
  if (argument !== '--refresh-entry') {
    throw new Error(`Unknown content:extract argument: ${argument}`);
  }
  const entryId = arguments_[index + 1];
  if (!entryId) throw new Error('--refresh-entry requires one source manifest entry ID.');
  refreshEntryIds.push(entryId);
  index += 1;
}

const report = await extractDiscoveredSources({ refreshEntryIds });
console.log(
  `Source extraction complete: ${report.extracted} extracted, ${report.refreshed} explicitly refreshed, ${report.archivedDuplicates} duplicate retained in archive, ${report.quarantined} quarantined.`,
);
console.log(`Manifest: ${report.manifestPath}`);
