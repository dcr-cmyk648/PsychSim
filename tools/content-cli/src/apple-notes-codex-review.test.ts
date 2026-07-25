import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { mkdtemp } from 'node:fs/promises';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AppleNotesCodexReviewAcknowledgementSchema,
  AppleNotesCodexReviewAuditManifestSchema,
  AppleNotesCodexReviewPacketSchema,
  AppleNotesLocalAcknowledgementSchema,
} from '@psychsim/schemas';

import {
  APPLE_NOTES_CODEX_REVIEW_MAX_PACKET_BYTES,
  APPLE_NOTES_CODEX_REVIEW_MAX_SEGMENT_BYTES,
  prepareAppleNotesCodexReviewPacket,
  validateAppleNotesCodexReviewAudit,
} from './apple-notes-codex-review';
import {
  syncAppleNotesFolder,
  type AppleNotesFolderAudit,
  type AppleNotesProvider,
} from './apple-notes-provider';
import { parseAppleNotesCodexReviewCliArgs } from './prepare-apple-notes-codex-review';

const roots: string[] = [];
const makeRoot = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'psychsim-codex-review-'));
  roots.push(root);
  return root;
};

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

const localAcknowledgement = AppleNotesLocalAcknowledgementSchema.parse({
  schemaVersion: 1,
  noIdentifiablePatientInformation: true,
  authorizedForLocalProcessing: true,
  sharedMaterialRightsAcknowledged: true,
  acknowledgedAt: '2026-07-25T12:00:00.000Z',
  acknowledgedBy: 'Test reviewer',
});

const codexAcknowledgement = AppleNotesCodexReviewAcknowledgementSchema.parse({
  schemaVersion: 1,
  contentScope: 'apple_notes_title_plaintext_only',
  noIdentifiablePatientInformation: true,
  authorizedForExternalAiProcessing: true,
  titlePlaintextTransmissionRightsAcknowledged: true,
  sharedMaterialRightsAcknowledged: true,
  appropriateToTransmitToOpenAiCodex: true,
  provider: 'openai_codex',
  modelIdentifier: 'openai-codex-test-model',
  acknowledgedAt: '2026-07-25T13:00:00.000Z',
  acknowledgedBy: 'Test reviewer',
});

const audit: AppleNotesFolderAudit = {
  providerAccountId: 'account.test',
  providerFolderId: 'folder.test',
  folderName: 'Psych research',
  folderShared: false,
  notes: [
    {
      providerNoteId: 'note.test.1',
      createdAtProvider: '2026-01-01T00:00:00Z',
      modifiedAtProvider: '2026-07-25T00:00:00Z',
      locked: false,
      shared: false,
      attachmentMetadata: [
        {
          providerNoteId: 'note.test.1',
          ordinal: 1,
          providerAttachmentId: 'attachment.test.1',
          providerContentIdentifier: 'public.jpeg',
          createdAtProvider: '2026-01-01T00:00:00Z',
          modifiedAtProvider: '2026-07-25T00:00:00Z',
        },
      ],
    },
  ],
};

const prepareSource = async (
  root: string,
  input: {
    title?: string;
    plaintext?: string;
    body?: string;
    attachment?: string;
    modifiedAtProvider?: string;
  } = {},
): Promise<void> => {
  const modifiedAtProvider = input.modifiedAtProvider ?? '2026-07-25T00:00:00Z';
  const currentAudit: AppleNotesFolderAudit = {
    ...audit,
    notes: audit.notes.map((note) => ({
      ...note,
      modifiedAtProvider,
      attachmentMetadata: note.attachmentMetadata.map((attachment) => ({
        ...attachment,
        modifiedAtProvider,
      })),
    })),
  };
  const provider: AppleNotesProvider = {
    auditFolder: vi.fn().mockResolvedValue(currentAudit),
    exportNote: vi.fn(async ({ destinationDirectory }) => {
      await Promise.all([
        writeFile(join(destinationDirectory, 'title.txt'), input.title ?? 'Private title'),
        writeFile(
          join(destinationDirectory, 'plaintext.txt'),
          input.plaintext ?? 'Private plaintext takeaway',
        ),
        writeFile(join(destinationDirectory, 'body.html'), input.body ?? 'BODY_SENTINEL'),
        writeFile(
          join(destinationDirectory, 'attachment-0001.bin'),
          input.attachment ?? 'ATTACHMENT_SENTINEL',
        ),
      ]);
      return {
        providerNoteId: 'note.test.1',
        modifiedAtProvider,
        attachmentMetadata: [
          {
            ...currentAudit.notes[0]!.attachmentMetadata[0]!,
            exportSucceeded: true,
          },
        ],
      };
    }),
  };
  await syncAppleNotesFolder({
    folderName: 'Psych research',
    sourceRoot: root,
    provider,
    acknowledgement: localAcknowledgement,
    ocr: false,
    now: () => '2026-07-25T12:30:00.000Z',
  });
};

describe('Apple Notes Codex review bridge', () => {
  it('requires every explicit external-processing acknowledgement', () => {
    expect(() =>
      AppleNotesCodexReviewAcknowledgementSchema.parse({
        ...codexAcknowledgement,
        authorizedForExternalAiProcessing: false,
      }),
    ).toThrow();
    expect(() =>
      AppleNotesCodexReviewAcknowledgementSchema.parse({
        ...codexAcknowledgement,
        unexpected: true,
      }),
    ).toThrow();
  });

  it('writes one bounded private title/plaintext packet and a hash-only audit', async () => {
    const root = await makeRoot();
    await prepareSource(root);
    const report = await prepareAppleNotesCodexReviewPacket({
      selector: { kind: 'next' },
      acknowledgement: codexAcknowledgement,
      sourceRoot: root,
      now: () => '2026-07-25T13:05:00.000Z',
    });
    const packetBytes = await readFile(report.packetPath);
    const packet = AppleNotesCodexReviewPacketSchema.parse(
      JSON.parse(packetBytes.toString('utf8')) as unknown,
    );
    expect(packet.title).toBe('Private title');
    expect(packet.plaintextSegment).toBe('Private plaintext takeaway');
    expect(packetBytes.toString('utf8')).not.toContain('BODY_SENTINEL');
    expect(packetBytes.toString('utf8')).not.toContain('ATTACHMENT_SENTINEL');
    expect(packetBytes.byteLength).toBeLessThanOrEqual(APPLE_NOTES_CODEX_REVIEW_MAX_PACKET_BYTES);
    expect((await stat(report.packetPath)).mode & 0o777).toBe(0o600);
    expect((await stat(report.auditPath)).mode & 0o777).toBe(0o600);

    const auditText = await readFile(report.auditPath, 'utf8');
    const auditManifest = AppleNotesCodexReviewAuditManifestSchema.parse(
      JSON.parse(auditText) as unknown,
    );
    expect(auditManifest.entries).toHaveLength(1);
    expect(auditText).not.toContain('Private title');
    expect(auditText).not.toContain('Private plaintext takeaway');
    expect(await validateAppleNotesCodexReviewAudit(root)).toEqual(auditManifest);
  });

  it('segments Unicode deterministically, preserves every character, and advances one packet', async () => {
    const root = await makeRoot();
    const plaintext = `${'🙂'.repeat(2_100)}\n\n${'clinical context '.repeat(700)}`;
    await prepareSource(root, { plaintext });
    const reports = [];
    const first = await prepareAppleNotesCodexReviewPacket({
      selector: { kind: 'next' },
      acknowledgement: codexAcknowledgement,
      sourceRoot: root,
      now: () => '2026-07-25T13:10:00.000Z',
    });
    reports.push(first);
    for (let index = 1; index < first.segmentCount; index += 1) {
      reports.push(
        await prepareAppleNotesCodexReviewPacket({
          selector: { kind: 'next' },
          acknowledgement: codexAcknowledgement,
          sourceRoot: root,
          now: () => `2026-07-25T13:${String(10 + index).padStart(2, '0')}:00.000Z`,
        }),
      );
    }
    const packets = await Promise.all(
      reports.map(async (report) =>
        AppleNotesCodexReviewPacketSchema.parse(
          JSON.parse(await readFile(report.packetPath, 'utf8')) as unknown,
        ),
      ),
    );
    expect(packets.map((packet) => packet.plaintextSegment).join('')).toBe(plaintext);
    for (const [index, packet] of packets.entries()) {
      expect(packet.segmentOrdinal).toBe(index);
      expect(Buffer.byteLength(packet.plaintextSegment, 'utf8')).toBeLessThanOrEqual(
        APPLE_NOTES_CODEX_REVIEW_MAX_SEGMENT_BYTES,
      );
      expect((await stat(reports[index]!.packetPath)).size).toBeLessThanOrEqual(
        APPLE_NOTES_CODEX_REVIEW_MAX_PACKET_BYTES,
      );
    }
    await expect(
      prepareAppleNotesCodexReviewPacket({
        selector: { kind: 'next' },
        acknowledgement: codexAcknowledgement,
        sourceRoot: root,
      }),
    ).rejects.toThrow('No Apple Notes title/plaintext segment remains');
  });

  it('is idempotent for an exact source segment and model', async () => {
    const root = await makeRoot();
    await prepareSource(root);
    const first = await prepareAppleNotesCodexReviewPacket({
      selector: { kind: 'next' },
      acknowledgement: codexAcknowledgement,
      sourceRoot: root,
      now: () => '2026-07-25T13:20:00.000Z',
    });
    const second = await prepareAppleNotesCodexReviewPacket({
      selector: { kind: 'exact', noteId: first.noteRecordId, segmentOrdinal: 0 },
      acknowledgement: codexAcknowledgement,
      sourceRoot: root,
      now: () => '2026-07-25T13:21:00.000Z',
    });
    expect(second).toMatchObject({
      packetId: first.packetId,
      packetSha256: first.packetSha256,
      reused: true,
    });
    expect((await validateAppleNotesCodexReviewAudit(root))?.entries).toHaveLength(1);
  });

  it('keeps segmentation model-independent and reuses audited bytes after out-of-scope metadata changes', async () => {
    const plaintext = `${'clinical context '.repeat(1_200)}\n${'🙂'.repeat(900)}`;
    const shortModelRoot = await makeRoot();
    const longModelRoot = await makeRoot();
    await Promise.all([
      prepareSource(shortModelRoot, { plaintext }),
      prepareSource(longModelRoot, { plaintext }),
    ]);
    const shortModel = await prepareAppleNotesCodexReviewPacket({
      selector: { kind: 'next' },
      acknowledgement: { ...codexAcknowledgement, modelIdentifier: 'x' },
      sourceRoot: shortModelRoot,
    });
    const longModel = await prepareAppleNotesCodexReviewPacket({
      selector: { kind: 'next' },
      acknowledgement: { ...codexAcknowledgement, modelIdentifier: 'm'.repeat(200) },
      sourceRoot: longModelRoot,
    });
    const [shortPacket, longPacket] = await Promise.all(
      [shortModel.packetPath, longModel.packetPath].map(async (path) =>
        AppleNotesCodexReviewPacketSchema.parse(
          JSON.parse(await readFile(path, 'utf8')) as unknown,
        ),
      ),
    );
    if (!shortPacket || !longPacket) throw new Error('Expected both model comparison packets.');
    expect(longPacket.segmentCount).toBe(shortPacket.segmentCount);
    expect(longPacket.plaintextSegment).toBe(shortPacket.plaintextSegment);

    const originalSha = shortModel.packetSha256;
    await prepareSource(shortModelRoot, {
      plaintext,
      attachment: 'CHANGED_ATTACHMENT_OUTSIDE_REVIEW_SCOPE',
      modifiedAtProvider: '2026-07-25T01:00:00Z',
    });
    const reused = await prepareAppleNotesCodexReviewPacket({
      selector: { kind: 'exact', noteId: shortModel.noteRecordId, segmentOrdinal: 0 },
      acknowledgement: { ...codexAcknowledgement, modelIdentifier: 'x' },
      sourceRoot: shortModelRoot,
    });
    expect(reused).toMatchObject({
      packetId: shortModel.packetId,
      packetSha256: originalSha,
      reused: true,
    });
  });

  it('recovers a packet left before audit commit and rejects unrelated orphan files', async () => {
    const root = await makeRoot();
    await prepareSource(root);
    const first = await prepareAppleNotesCodexReviewPacket({
      selector: { kind: 'next' },
      acknowledgement: codexAcknowledgement,
      sourceRoot: root,
      now: () => '2026-07-25T13:25:00.000Z',
    });
    await rm(first.auditPath);
    const recovered = await prepareAppleNotesCodexReviewPacket({
      selector: { kind: 'next' },
      acknowledgement: codexAcknowledgement,
      sourceRoot: root,
      now: () => '2026-07-25T13:26:00.000Z',
    });
    expect(recovered).toMatchObject({ packetId: first.packetId, reused: false });
    expect((await validateAppleNotesCodexReviewAudit(root))?.entries).toHaveLength(1);

    await writeFile(join(dirname(first.packetPath), 'unrelated.json'), '{}\n', { mode: 0o600 });
    await expect(validateAppleNotesCodexReviewAudit(root)).rejects.toThrow('unaudited');
  });

  it('rejects an over-limit title without placing the title in the error', async () => {
    const root = await makeRoot();
    const privateTitle = `DO_NOT_LEAK_${'x'.repeat(2_100)}`;
    await prepareSource(root, { title: privateTitle });
    await expect(
      prepareAppleNotesCodexReviewPacket({
        selector: { kind: 'next' },
        acknowledgement: codexAcknowledgement,
        sourceRoot: root,
      }),
    ).rejects.not.toThrow(privateTitle);
    await expect(
      prepareAppleNotesCodexReviewPacket({
        selector: { kind: 'next' },
        acknowledgement: codexAcknowledgement,
        sourceRoot: root,
      }),
    ).rejects.toThrow('title exceeds');
  });

  it('rejects protected-directory symlinks and sanitizes private packet parse failures', async () => {
    const packetSymlinkRoot = await makeRoot();
    await prepareSource(packetSymlinkRoot);
    const externalPackets = await makeRoot();
    const packetsPath = join(
      packetSymlinkRoot,
      'extracted',
      'apple-notes-private',
      'codex-review',
      'packets',
    );
    await mkdir(dirname(packetsPath), { recursive: true });
    await symlink(externalPackets, packetsPath);
    await expect(
      prepareAppleNotesCodexReviewPacket({
        selector: { kind: 'next' },
        acknowledgement: codexAcknowledgement,
        sourceRoot: packetSymlinkRoot,
      }),
    ).rejects.toThrow(/symlink|non-directory/);

    const manifestSymlinkRoot = await makeRoot();
    const externalManifests = await makeRoot();
    await symlink(externalManifests, join(manifestSymlinkRoot, 'manifests'));
    await expect(
      prepareAppleNotesCodexReviewPacket({
        selector: { kind: 'next' },
        acknowledgement: codexAcknowledgement,
        sourceRoot: manifestSymlinkRoot,
      }),
    ).rejects.toThrow(/symlink|non-directory/);

    const tamperRoot = await makeRoot();
    await prepareSource(tamperRoot);
    const report = await prepareAppleNotesCodexReviewPacket({
      selector: { kind: 'next' },
      acknowledgement: codexAcknowledgement,
      sourceRoot: tamperRoot,
    });
    const privateSentinel = 'PRIVATE_PACKET_SENTINEL';
    const invalidPacket = `{${privateSentinel}`;
    await writeFile(report.packetPath, invalidPacket, { mode: 0o600 });
    const auditManifest = AppleNotesCodexReviewAuditManifestSchema.parse(
      JSON.parse(await readFile(report.auditPath, 'utf8')) as unknown,
    );
    auditManifest.entries[0]!.packetSha256 = createHash('sha256')
      .update(invalidPacket)
      .digest('hex');
    await writeFile(report.auditPath, `${JSON.stringify(auditManifest, null, 2)}\n`, {
      mode: 0o600,
    });
    let message = '';
    try {
      await validateAppleNotesCodexReviewAudit(tamperRoot);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain('invalid private packet JSON/schema');
    expect(message).not.toContain(privateSentinel);
  });

  it('rejects invalid exact ordinals at the direct API boundary', async () => {
    const root = await makeRoot();
    await prepareSource(root);
    await expect(
      prepareAppleNotesCodexReviewPacket({
        selector: { kind: 'exact', noteId: 'apple-note.test', segmentOrdinal: -1 },
        acknowledgement: codexAcknowledgement,
        sourceRoot: root,
      }),
    ).rejects.toThrow('nonnegative integer');
  });

  it('rejects unsafe or ambiguous CLI scopes', () => {
    const required = [
      '--provider',
      'openai-codex',
      '--model',
      'openai-codex-test-model',
      '--ack-no-phi',
      '--ack-authorized-external-ai-processing',
      '--ack-title-plaintext-rights',
      '--ack-shared-material-rights',
      '--ack-appropriate-to-transmit',
      '--acknowledged-by',
      'Test reviewer',
    ];
    expect(parseAppleNotesCodexReviewCliArgs(['--next', ...required]).selector).toEqual({
      kind: 'next',
    });
    expect(() => parseAppleNotesCodexReviewCliArgs(['--all', ...required])).toThrow('Unknown');
    expect(() => parseAppleNotesCodexReviewCliArgs(['--next', '--next', ...required])).toThrow(
      'Duplicate',
    );
    expect(() =>
      parseAppleNotesCodexReviewCliArgs([
        '--next',
        '--note-id',
        'apple-note.test',
        '--segment',
        '1',
        ...required,
      ]),
    ).toThrow('exactly one selector');
    expect(() =>
      parseAppleNotesCodexReviewCliArgs([
        '--next',
        ...required.filter((value) => value !== '--ack-no-phi'),
      ]),
    ).toThrow('explicit acknowledgements');
  });

  it('contains no provider client, network call, API-key access, or child process', async () => {
    const [moduleSource, cliSource] = await Promise.all([
      readFile(new URL('./apple-notes-codex-review.ts', import.meta.url), 'utf8'),
      readFile(new URL('./prepare-apple-notes-codex-review.ts', import.meta.url), 'utf8'),
    ]);
    const combined = `${moduleSource}\n${cliSource}`;
    expect(combined).not.toMatch(/\bfetch\s*\(/);
    expect(combined).not.toContain('OPENAI_API_KEY');
    expect(combined).not.toContain('node:child_process');
    expect(combined).not.toMatch(/from ['"]openai['"]/);
  });
});
