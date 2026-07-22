import chokidar from 'chokidar';
import { resolve } from 'node:path';

import { extractDiscoveredSources, scanSourceInbox } from './source-pipeline';

const inbox = resolve('content/source-docs/inbox');
let pending: Promise<void> = Promise.resolve();
const processInbox = (): void => {
  pending = pending
    .then(async () => {
      const scan = await scanSourceInbox();
      const extraction = await extractDiscoveredSources();
      console.log(
        `[source-watch] ${scan.discovered} new, ${scan.duplicates} duplicate; ${extraction.extracted} extracted, ${extraction.quarantined} quarantined.`,
      );
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : 'Source watch failed.');
    });
};

console.log(`Watching ${inbox}. Source text stays local and is treated as untrusted data.`);
const watcher = chokidar.watch(inbox, {
  ignoreInitial: false,
  ignored: /(^|[/\\])\../,
  awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
});
watcher.on('add', processInbox).on('change', processInbox);

const close = async (): Promise<void> => {
  await watcher.close();
  await pending;
  process.exit(0);
};
process.once('SIGINT', () => void close());
process.once('SIGTERM', () => void close());
