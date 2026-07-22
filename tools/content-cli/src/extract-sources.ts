import { extractDiscoveredSources } from './source-pipeline';

const report = await extractDiscoveredSources();
console.log(
  `Source extraction complete: ${report.extracted} extracted, ${report.archivedDuplicates} duplicate retained in archive, ${report.quarantined} quarantined.`,
);
console.log(`Manifest: ${report.manifestPath}`);
