import { afterEach, describe, expect, it } from 'vitest';
import { chmod, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SourceReviewTicketFeedSchema } from '@psychsim/schemas';

import {
  hasValidSourceReviewPacketHashes,
  loadSourceReviewTicketFeed,
  respondToSourceReviewTicketRequest,
  sourceReviewTicketsBridge,
} from './source-review-tickets-plugin';

const temporaryDirectories: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

const feed = SourceReviewTicketFeedSchema.parse({
  schemaVersion: 1,
  projectionVersion: 1,
  generatedAt: '2026-07-25T12:00:00.000Z',
  tickets: [],
});

const createPrivateFeed = async (
  value: unknown = feed,
  mode = 0o600,
): Promise<{ root: string; path: string }> => {
  const root = await mkdtemp(join(tmpdir(), 'psychsim-source-review-plugin-'));
  temporaryDirectories.push(root);
  const nested = join(root, 'source-review');
  await mkdir(nested, { mode: 0o700 });
  const path = join(nested, 'tickets.json');
  await writeFile(path, JSON.stringify(value), { mode });
  await chmod(path, mode);
  return { root: nested, path };
};

describe('source-review ticket Vite bridge', () => {
  it('loads one strict private safe projection under the allowed root', async () => {
    const fixture = await createPrivateFeed();
    await expect(loadSourceReviewTicketFeed(fixture.path, fixture.root)).resolves.toEqual(feed);
  });

  it('surfaces invalid fields, permissive modes, and symlinks as validation failures', async () => {
    const raw = await createPrivateFeed({ ...feed, rawText: 'must not pass' });
    await expect(loadSourceReviewTicketFeed(raw.path, raw.root)).rejects.toThrow(
      'failed private validation',
    );
    const publicFile = await createPrivateFeed(feed, 0o644);
    await expect(loadSourceReviewTicketFeed(publicFile.path, publicFile.root)).rejects.toThrow(
      'failed private validation',
    );
    const fixture = await createPrivateFeed();
    const link = join(fixture.root, 'linked.json');
    await symlink(fixture.path, link);
    await expect(loadSourceReviewTicketFeed(link, fixture.root)).rejects.toThrow(
      'failed private validation',
    );
  });

  it('exists only as a serve-time plugin', () => {
    expect(sourceReviewTicketsBridge().apply).toBe('serve');
  });

  it('rejects a packet whose displayed content no longer matches its hash', () => {
    expect(
      hasValidSourceReviewPacketHashes({
        ...feed,
        tickets: [
          {
            sourceReviewSnapshot: {
              packetHash: 'a'.repeat(64),
              originalSummary: 'Tampered summary.',
            },
          },
        ],
      } as unknown as Parameters<typeof hasValidSourceReviewPacketHashes>[0]),
    ).toBe(false);
  });

  it('serves only GET requests arriving over loopback', async () => {
    const response = {
      statusCode: 0,
      headers: new Map<string, string>(),
      body: '',
      setHeader(name: string, value: string) {
        this.headers.set(name, value);
      },
      end(body = '') {
        this.body = body;
      },
    };
    await respondToSourceReviewTicketRequest(
      { method: 'GET', socket: { remoteAddress: '127.0.0.1' } },
      response,
      async () => feed,
    );
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(feed);
    expect(response.headers.get('Cache-Control')).toBe('no-store');

    const remoteResponse = { ...response, statusCode: 0, body: '' };
    await respondToSourceReviewTicketRequest(
      { method: 'GET', socket: { remoteAddress: '192.0.2.10' } },
      remoteResponse,
      async () => {
        throw new Error('A non-loopback request must not load the feed.');
      },
    );
    expect(remoteResponse.statusCode).toBe(404);

    const methodResponse = { ...response, statusCode: 0, body: '' };
    await respondToSourceReviewTicketRequest(
      { method: 'POST', socket: { remoteAddress: '::1' } },
      methodResponse,
      async () => feed,
    );
    expect(methodResponse.statusCode).toBe(405);

    const invalidResponse = { ...response, statusCode: 0, body: '' };
    await respondToSourceReviewTicketRequest(
      { method: 'GET', socket: { remoteAddress: '::1' } },
      invalidResponse,
      async () => {
        throw new Error('Invalid local file.');
      },
    );
    expect(invalidResponse.statusCode).toBe(500);
    expect(invalidResponse.body).toContain('quarantined');
  });
});
