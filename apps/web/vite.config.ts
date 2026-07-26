import { execFileSync } from 'node:child_process';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

import { personalKnowledgeWorkbenchBridge } from './personal-knowledge-workbench-plugin';

const REVIEWER_BUILD = process.env.VITE_PSYCHSIM_REVIEW_BUILD === '1';
const LOCAL_TICKET_FILE_NAME =
  process.env.PSYCHSIM_E2E === '1' ? 'tickets.e2e.json' : 'tickets.json';
const LOCAL_TICKET_PATH = fileURLToPath(
  new URL(
    `../../content/generated/local-review-tickets/${LOCAL_TICKET_FILE_NAME}`,
    import.meta.url,
  ),
);
const LOCAL_TICKET_DISPLAY_PATH = `content/generated/local-review-tickets/${LOCAL_TICKET_FILE_NAME}`;
const MAX_REVIEW_BUNDLE_BYTES = 20_000_000;

const resolveDistributionId = (): string => {
  const supplied = process.env.VITE_PSYCHSIM_DISTRIBUTION_ID ?? process.env.GITHUB_SHA;
  if (supplied) return supplied.toLowerCase();
  try {
    return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], {
      encoding: 'utf8',
      cwd: fileURLToPath(new URL('../..', import.meta.url)),
    })
      .trim()
      .toLowerCase();
  } catch {
    return 'development';
  }
};

const distribution = {
  schemaVersion: 1 as const,
  distributionId: resolveDistributionId(),
  buildKind: REVIEWER_BUILD ? ('portable_reviewer' as const) : ('player' as const),
  channel: process.env.VITE_PSYCHSIM_DISTRIBUTION_CHANNEL ?? 'local',
};

const distributionManifest = (): Plugin => ({
  name: 'psychsim-distribution-manifest',
  apply: 'build',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: `${JSON.stringify(distribution, null, 2)}\n`,
    });
  },
});

const localTicketWriter = (): Plugin => ({
  name: 'psychsim-local-ticket-writer',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__psychsim/local-review-tickets', async (request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      if (request.method !== 'PUT') {
        response.statusCode = 405;
        response.end(JSON.stringify({ ok: false, error: 'Use PUT for the local ticket writer.' }));
        return;
      }
      try {
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of request) {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          size += buffer.length;
          if (size > MAX_REVIEW_BUNDLE_BYTES) {
            throw new Error('Developer review bundle exceeds the 20 MB local-development limit.');
          }
          chunks.push(buffer);
        }
        const raw = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
        if (
          typeof raw !== 'object' ||
          raw === null ||
          !('exportVersion' in raw) ||
          raw.exportVersion !== 6 ||
          !('completedAttempts' in raw) ||
          !Array.isArray(raw.completedAttempts) ||
          !('tickets' in raw) ||
          !Array.isArray(raw.tickets) ||
          !('attemptReviews' in raw) ||
          !Array.isArray(raw.attemptReviews) ||
          !('databaseEntryReviews' in raw) ||
          !Array.isArray(raw.databaseEntryReviews) ||
          !('flags' in raw) ||
          !Array.isArray(raw.flags) ||
          !raw.tickets.every(
            (ticket) =>
              typeof ticket === 'object' &&
              ticket !== null &&
              'reviewerNotes' in ticket &&
              typeof ticket.reviewerNotes === 'string',
          ) ||
          !raw.attemptReviews.every(
            (review) =>
              typeof review === 'object' &&
              review !== null &&
              'reviewerNote' in review &&
              typeof review.reviewerNote === 'string' &&
              'availableOptions' in review &&
              Array.isArray(review.availableOptions) &&
              'attemptSnapshot' in review &&
              typeof review.attemptSnapshot === 'object' &&
              review.attemptSnapshot !== null,
          ) ||
          !raw.databaseEntryReviews.every(
            (review) =>
              typeof review === 'object' &&
              review !== null &&
              'reviewerNote' in review &&
              typeof review.reviewerNote === 'string' &&
              'entrySnapshot' in review &&
              typeof review.entrySnapshot === 'object' &&
              review.entrySnapshot !== null,
          ) ||
          !raw.flags.every(
            (flag) =>
              typeof flag === 'object' &&
              flag !== null &&
              'attemptId' in flag &&
              typeof flag.attemptId === 'string' &&
              'note' in flag &&
              typeof flag.note === 'string',
          ) ||
          !raw.completedAttempts.every(
            (attempt) =>
              typeof attempt === 'object' &&
              attempt !== null &&
              'id' in attempt &&
              typeof attempt.id === 'string' &&
              'caseInstance' in attempt &&
              typeof attempt.caseInstance === 'object' &&
              attempt.caseInstance !== null &&
              'receipt' in attempt &&
              typeof attempt.receipt === 'object' &&
              attempt.receipt !== null,
          )
        ) {
          throw new Error('Developer review bundle has an unsupported shape.');
        }
        await mkdir(dirname(LOCAL_TICKET_PATH), { recursive: true });
        const temporaryPath = `${LOCAL_TICKET_PATH}.tmp`;
        await writeFile(temporaryPath, `${JSON.stringify(raw, null, 2)}\n`, {
          encoding: 'utf8',
          mode: 0o600,
        });
        await rename(temporaryPath, LOCAL_TICKET_PATH);
        response.statusCode = 200;
        response.end(JSON.stringify({ ok: true, path: LOCAL_TICKET_DISPLAY_PATH }));
      } catch (caught) {
        response.statusCode = 400;
        response.end(
          JSON.stringify({
            ok: false,
            error: caught instanceof Error ? caught.message : 'Could not write ticket bundle.',
          }),
        );
      }
    });
  },
});

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  define: {
    __PSYCHSIM_DISTRIBUTION__: JSON.stringify(distribution),
  },
  plugins: [
    react(),
    distributionManifest(),
    localTicketWriter(),
    ...(REVIEWER_BUILD ? [] : [personalKnowledgeWorkbenchBridge()]),
  ],
  build: {
    sourcemap: true,
  },
});
