import { prepareSourceReviewPackets } from './source-review-packets';

prepareSourceReviewPackets()
  .then((report) => {
    console.log(
      `Prepared ${report.tickets} immutable local source-review ticket(s) from ${report.sourceUnits} bounded source unit(s).`,
    );
    console.log(`Safe feed: ${report.feedPath}`);
    console.log(`Private locators: ${report.locatorPath}`);
    console.log('No database entry, clinical rule, point value, or runtime content changed.');
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
