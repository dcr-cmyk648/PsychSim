import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  RemoteSourceDiscoveryManifestSchema,
  SourceManifestSchema,
  type RemoteSourceCandidate,
} from '@psychsim/schemas';
import {
  planGoogleDriveSync,
  pullNextGoogleDriveSource,
  type RcloneDriveEntry,
} from './google-drive-sync';

const timestamp = '2026-07-27T20:00:00.000Z';

const remoteEntry = (
  overrides: Partial<RcloneDriveEntry> & Pick<RcloneDriveEntry, 'ID' | 'Name'>,
): RcloneDriveEntry => {
  const { ID, Name, ...rest } = overrides;
  return {
    ID,
    IsDir: false,
    MimeType: 'application/pdf',
    ModTime: '2026-07-27T19:00:00.000Z',
    Name,
    Path: Name,
    Size: 400,
    Hashes: {},
    ...rest,
  };
};

const existingCandidate = (
  overrides: Partial<RemoteSourceCandidate> = {},
): RemoteSourceCandidate => ({
  schemaVersion: 1,
  id: 'source-candidate.google-drive.existing',
  provider: 'google_drive',
  providerFileId: 'drive-source-1',
  providerFolderId: 'drive-folder-1',
  filename: 'existing.pdf',
  mediaType: 'application/pdf',
  sizeBytes: 400,
  sourceModifiedAt: '2026-07-27T19:00:00.000Z',
  discoveredAt: '2026-07-27T19:10:00.000Z',
  webViewUrl: 'https://drive.google.com/open?id=drive-source-1',
  status: 'pulled',
  sha256: 'a'.repeat(64),
  reviewOrder: 1,
  ...overrides,
});

const manifest = (candidates: RemoteSourceCandidate[] = []) =>
  RemoteSourceDiscoveryManifestSchema.parse({
    schemaVersion: 1,
    provider: 'google_drive',
    folderId: 'drive-folder-1',
    folderName: 'PsychSim documents',
    lastScannedAt: '2026-07-27T19:15:00.000Z',
    candidates,
  });

describe('Google Drive read-only sync planner', () => {
  it('discovers a new source without scheduling a download', () => {
    const plan = planGoogleDriveSync({
      manifest: manifest(),
      remoteEntries: [remoteEntry({ ID: 'new-source', Name: 'new-source.pdf' })],
      localReviewHashes: new Set(),
      localReviewNames: new Set(),
      timestamp,
    });

    expect(plan.sources).toHaveLength(1);
    expect(plan.sources[0]).toMatchObject({
      action: 'discover',
      candidate: {
        providerFileId: 'new-source',
        filename: 'new-source.pdf',
        status: 'discovered',
        sha256: null,
      },
    });
  });

  it('schedules a new review bundle for validated local intake', () => {
    const plan = planGoogleDriveSync({
      manifest: manifest(),
      remoteEntries: [
        remoteEntry({
          ID: 'review-1',
          Name: 'psychsim-feedback.review-bundle.json',
          MimeType: 'application/json',
          Hashes: { sha256: 'b'.repeat(64) },
        }),
      ],
      localReviewHashes: new Set(),
      localReviewNames: new Set(),
      timestamp,
    });

    expect(plan.reviewBundles).toEqual([
      expect.objectContaining({
        action: 'pull',
        remote: expect.objectContaining({ ID: 'review-1' }),
      }),
    ]);
    expect(plan.sources).toHaveLength(0);
  });

  it('does not redownload an unchanged pulled source', () => {
    const candidate = existingCandidate();
    const plan = planGoogleDriveSync({
      manifest: manifest([candidate]),
      remoteEntries: [
        remoteEntry({
          ID: candidate.providerFileId,
          Name: candidate.filename,
          ModTime: candidate.sourceModifiedAt,
          Hashes: { sha256: candidate.sha256! },
        }),
      ],
      localReviewHashes: new Set(),
      localReviewNames: new Set(),
      timestamp,
    });

    expect(plan.sources[0]?.action).toBe('unchanged');
  });

  it('repulls a changed source only when its prior revision was already pulled', () => {
    const candidate = existingCandidate();
    const plan = planGoogleDriveSync({
      manifest: manifest([candidate]),
      remoteEntries: [
        remoteEntry({
          ID: candidate.providerFileId,
          Name: candidate.filename,
          ModTime: '2026-07-27T19:30:00.000Z',
        }),
      ],
      localReviewHashes: new Set(),
      localReviewNames: new Set(),
      timestamp,
    });

    expect(plan.sources[0]?.action).toBe('repull');
  });

  it('refreshes metadata but does not pull a changed source that was never approved for intake', () => {
    const candidate = existingCandidate({ status: 'discovered', sha256: null });
    const plan = planGoogleDriveSync({
      manifest: manifest([candidate]),
      remoteEntries: [
        remoteEntry({
          ID: candidate.providerFileId,
          Name: 'renamed.pdf',
          ModTime: '2026-07-27T19:30:00.000Z',
        }),
      ],
      localReviewHashes: new Set(),
      localReviewNames: new Set(),
      timestamp,
    });

    expect(plan.sources[0]).toMatchObject({
      action: 'refresh_metadata',
      candidate: { filename: 'renamed.pdf', status: 'discovered', sha256: null },
    });
  });

  it('uses a local content hash to avoid redownloading an existing review bundle', () => {
    const bundleHash = 'c'.repeat(64);
    const plan = planGoogleDriveSync({
      manifest: manifest(),
      remoteEntries: [
        remoteEntry({
          ID: 'review-2',
          Name: 'psychsim-feedback.review-bundle.json',
          Hashes: { sha256: bundleHash },
        }),
      ],
      localReviewHashes: new Set([bundleHash]),
      localReviewNames: new Set(),
      timestamp,
    });

    expect(plan.reviewBundles[0]?.action).toBe('unchanged');
  });

  it('retains stable review order for one-at-a-time source intake', () => {
    const laterCandidate = existingCandidate({
      id: 'source-candidate.google-drive.later',
      providerFileId: 'later',
      filename: 'later.pdf',
      status: 'discovered',
      sha256: null,
      reviewOrder: 3,
    });
    const earlierCandidate = existingCandidate({
      id: 'source-candidate.google-drive.earlier',
      providerFileId: 'earlier',
      filename: 'earlier.pdf',
      status: 'discovered',
      sha256: null,
      reviewOrder: 2,
    });
    const plan = planGoogleDriveSync({
      manifest: manifest([laterCandidate, earlierCandidate]),
      remoteEntries: [
        remoteEntry({
          ID: laterCandidate.providerFileId,
          Name: laterCandidate.filename,
          ModTime: laterCandidate.sourceModifiedAt,
        }),
        remoteEntry({
          ID: earlierCandidate.providerFileId,
          Name: earlierCandidate.filename,
          ModTime: earlierCandidate.sourceModifiedAt,
        }),
      ],
      localReviewHashes: new Set(),
      localReviewNames: new Set(),
      timestamp,
    });

    expect(
      plan.sources
        .filter((item) => item.candidate.status === 'discovered')
        .sort((left, right) => left.candidate.reviewOrder - right.candidate.reviewOrder)
        .map((item) => item.candidate.id),
    ).toEqual(['source-candidate.google-drive.earlier', 'source-candidate.google-drive.later']);
  });

  it('pulls and scans exactly one discovered source through a mocked read-only remote', async () => {
    const root = await mkdtemp(join(tmpdir(), 'psychsim-drive-pull-'));
    const manifestPath = join(root, 'manifests', 'google-drive-discovery.json');
    const sourceInbox = join(root, 'inbox');
    const reviewInbox = join(root, 'review-inbox');
    const entry = remoteEntry({
      ID: 'one-source',
      Name: 'one-source.txt',
      Path: 'one-source.txt',
      MimeType: 'text/plain',
      Size: 19,
    });
    const calls: string[][] = [];
    try {
      const report = await pullNextGoogleDriveSource(undefined, {
        manifestPath,
        sourceInbox,
        reviewInbox,
        now: () => timestamp,
        runCommand: async (args) => {
          calls.push([...args]);
          if (args[0] === 'lsjson') {
            return { stdout: JSON.stringify([entry]), stderr: '' };
          }
          if (args[0] === 'copyto') {
            await writeFile(args[2]!, 'bounded source text');
            return { stdout: '', stderr: '' };
          }
          throw new Error(`Unexpected rclone command ${args[0]}`);
        },
      });

      expect(calls.filter((args) => args[0] === 'copyto')).toHaveLength(1);
      expect(report).toMatchObject({
        filename: 'one-source.txt',
        sizeBytes: 19,
      });
      const driveManifest = RemoteSourceDiscoveryManifestSchema.parse(
        JSON.parse(await readFile(manifestPath, 'utf8')) as unknown,
      );
      expect(driveManifest.candidates).toEqual([
        expect.objectContaining({
          providerFileId: 'one-source',
          status: 'pulled',
          sha256: report.sha256,
        }),
      ]);
      const sourceManifest = SourceManifestSchema.parse(
        JSON.parse(
          await readFile(join(root, 'manifests', 'source-manifest.json'), 'utf8'),
        ) as unknown,
      );
      expect(sourceManifest.entries).toEqual([
        expect.objectContaining({
          filename: expect.stringContaining('one-source.txt'),
          status: 'discovered',
          sha256: report.sha256,
        }),
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
