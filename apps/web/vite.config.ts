import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { chmod, lstat, mkdir, open, realpath, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { ClinicalTicketExportBundleSchema } from '@psychsim/schemas';
import { defineConfig, type Plugin } from 'vite';

import { personalKnowledgeWorkbenchBridge } from './personal-knowledge-workbench-plugin';
import { sourceReviewTicketsBridge } from './source-review-tickets-plugin';

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
const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const isLoopbackAddress = (address: string | undefined): boolean =>
  address === '127.0.0.1' || address === '::1' || address?.startsWith('::ffff:127.') === true;

const writePrivateReviewBundle = async (value: unknown): Promise<void> => {
  const bundle = ClinicalTicketExportBundleSchema.parse(value);
  if (bundle.buildKind !== 'local_developer' || bundle.assignmentId !== null) {
    throw new Error('The local writer accepts only local Developer review bundles.');
  }
  const parent = dirname(LOCAL_TICKET_PATH);
  await mkdir(parent, { recursive: true });
  const [resolvedParent, resolvedProjectRoot] = await Promise.all([
    realpath(parent),
    realpath(PROJECT_ROOT),
  ]);
  if (
    resolvedParent !== resolvedProjectRoot &&
    !resolvedParent.startsWith(`${resolvedProjectRoot}/`)
  ) {
    throw new Error('The local review handoff directory resolves outside the PsychSim repository.');
  }
  const existing = await lstat(LOCAL_TICKET_PATH).catch((caught: unknown) => {
    if ((caught as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw caught;
  });
  if (existing?.isSymbolicLink() || (existing && !existing.isFile())) {
    throw new Error('The local review handoff target must be a regular file.');
  }

  const temporaryPath = `${LOCAL_TICKET_PATH}.${randomUUID()}.tmp`;
  let handle: Awaited<ReturnType<typeof open>> | null = null;
  try {
    handle = await open(temporaryPath, 'wx', 0o600);
    await handle.writeFile(`${JSON.stringify(bundle, null, 2)}\n`, 'utf8');
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temporaryPath, LOCAL_TICKET_PATH);
    await chmod(LOCAL_TICKET_PATH, 0o600);
  } finally {
    await handle?.close().catch(() => undefined);
    await unlink(temporaryPath).catch((caught: unknown) => {
      if ((caught as NodeJS.ErrnoException).code !== 'ENOENT') throw caught;
    });
  }
};

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
      if (!isLoopbackAddress(request.socket.remoteAddress)) {
        response.statusCode = 403;
        response.end(
          JSON.stringify({ ok: false, error: 'The local ticket writer is loopback-only.' }),
        );
        return;
      }
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
        await writePrivateReviewBundle(raw);
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
    ...(REVIEWER_BUILD
      ? []
      : [localTicketWriter(), personalKnowledgeWorkbenchBridge(), sourceReviewTicketsBridge()]),
  ],
  build: {
    sourcemap: true,
  },
});
