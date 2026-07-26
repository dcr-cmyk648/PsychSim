import { createHash } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { isAbsolute, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SourceReviewTicketFeedSchema, type SourceReviewTicketFeed } from '@psychsim/schemas';
import type { Plugin } from 'vite';

export const SOURCE_REVIEW_TICKETS_ENDPOINT = '/__psychsim/source-review-tickets';
const MAX_PROJECTION_BYTES = 2_000_000;
const GENERATED_ROOT = fileURLToPath(
  new URL('../../content/generated/source-review/', import.meta.url),
);
const PROJECTION_FILE_NAME = process.env.PSYCHSIM_E2E === '1' ? 'tickets.e2e.json' : 'tickets.json';
const DEFAULT_PROJECTION_PATH = fileURLToPath(
  new URL(`../../content/generated/source-review/${PROJECTION_FILE_NAME}`, import.meta.url),
);

const pathInside = (parent: string, child: string): boolean => {
  const relativePath = relative(parent, child);
  return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath);
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, canonicalize(nested)]),
  );
};

export const hasValidSourceReviewPacketHashes = (feed: SourceReviewTicketFeed): boolean =>
  feed.tickets.every((ticket) => {
    const snapshot = ticket.sourceReviewSnapshot!;
    const snapshotWithoutHash = Object.fromEntries(
      Object.entries(snapshot).filter(([key]) => key !== 'packetHash'),
    );
    const packetHash = createHash('sha256')
      .update(JSON.stringify(canonicalize(snapshotWithoutHash)), 'utf8')
      .digest('hex');
    return packetHash === snapshot.packetHash;
  });

export const isSourceReviewLoopback = (address: string | undefined): boolean =>
  address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';

export const loadSourceReviewTicketFeed = async (
  path = DEFAULT_PROJECTION_PATH,
  allowedRoot = GENERATED_ROOT,
): Promise<SourceReviewTicketFeed | null> => {
  try {
    const stat = await lstat(path);
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      stat.size > MAX_PROJECTION_BYTES ||
      (stat.mode & 0o777) !== 0o600
    ) {
      throw new Error('Local source-review feed is not a private regular file.');
    }
    const [resolvedPath, resolvedRoot] = await Promise.all([realpath(path), realpath(allowedRoot)]);
    if (!pathInside(resolvedRoot, resolvedPath)) {
      throw new Error('Local source-review feed escapes its generated root.');
    }
    const feed = SourceReviewTicketFeedSchema.parse(
      JSON.parse(await readFile(resolvedPath, 'utf8')) as unknown,
    );
    if (!hasValidSourceReviewPacketHashes(feed)) {
      throw new Error('Local source-review feed contains an invalid packet hash.');
    }
    return feed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw new Error('Local source-review feed failed private validation.', { cause: error });
  }
};

interface SourceReviewRequest {
  method?: string;
  socket: { remoteAddress?: string };
}

interface SourceReviewResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}

export const respondToSourceReviewTicketRequest = async (
  request: SourceReviewRequest,
  response: SourceReviewResponse,
  loadFeed = loadSourceReviewTicketFeed,
): Promise<void> => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  if (!isSourceReviewLoopback(request.socket.remoteAddress)) {
    response.statusCode = 404;
    response.end(JSON.stringify({ ok: false, error: 'Not found.' }));
    return;
  }
  if (request.method !== 'GET') {
    response.statusCode = 405;
    response.end(JSON.stringify({ ok: false, error: 'Use GET.' }));
    return;
  }
  let feed: SourceReviewTicketFeed | null;
  try {
    feed = await loadFeed();
  } catch {
    response.statusCode = 500;
    response.end(
      JSON.stringify({
        ok: false,
        error: 'Source-review tickets were quarantined after local validation failed.',
      }),
    );
    return;
  }
  if (!feed) {
    response.statusCode = 404;
    response.end(JSON.stringify({ ok: false, error: 'Source-review tickets are unavailable.' }));
    return;
  }
  response.statusCode = 200;
  response.end(JSON.stringify(feed));
};

export const sourceReviewTicketsBridge = (): Plugin => ({
  name: 'psychsim-source-review-tickets',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use(SOURCE_REVIEW_TICKETS_ENDPOINT, async (request, response) => {
      await respondToSourceReviewTicketRequest(request, response);
    });
  },
});
