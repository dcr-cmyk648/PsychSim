import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { AppleNotesLocalAcknowledgementSchema } from '@psychsim/schemas';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  auditAppleNotesFolder,
  syncAppleNotesFolder,
  validateAppleNotesManifest,
  type AppleNotesFolderAudit,
  type AppleNotesProvider,
} from './apple-notes-provider';

const temporaryRoots: string[] = [];
const makeRoot = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'psychsim-apple-notes-'));
  temporaryRoots.push(root);
  return root;
};

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true })));
});

const folderAudit = (
  modifiedAtProvider = 'July 24, 2026 at 1:00:00 PM',
): AppleNotesFolderAudit => ({
  providerAccountId: 'provider-account',
  providerFolderId: 'provider-folder',
  folderName: 'Psych research',
  folderShared: true,
  notes: [
    {
      providerNoteId: 'provider-note-1',
      createdAtProvider: 'July 1, 2026 at 9:00:00 AM',
      modifiedAtProvider,
      locked: false,
      shared: true,
      attachmentMetadata: [
        {
          providerNoteId: 'provider-note-1',
          ordinal: 1,
          providerAttachmentId: 'provider-attachment-1',
          providerContentIdentifier: 'cid-1',
          createdAtProvider: 'July 1, 2026 at 9:01:00 AM',
          modifiedAtProvider,
        },
      ],
    },
  ],
});

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

const makeProvider = (audit = folderAudit()) => {
  let activeAudit = audit;
  const auditFolder = vi.fn(async () => activeAudit);
  const exportNote = vi.fn<AppleNotesProvider['exportNote']>(
    async ({ providerNoteId, destinationDirectory }) => {
      const note = activeAudit.notes.find(
        (candidate) => candidate.providerNoteId === providerNoteId,
      );
      if (!note) throw new Error('Test note not found.');
      await mkdir(destinationDirectory, { recursive: true });
      await Promise.all([
        writeFile(join(destinationDirectory, 'title.txt'), 'Private research title'),
        writeFile(join(destinationDirectory, 'plaintext.txt'), 'Brief private takeaway'),
        writeFile(join(destinationDirectory, 'body.html'), '<p>Brief private takeaway</p>'),
        ...note.attachmentMetadata.map((attachment) =>
          writeFile(
            join(
              destinationDirectory,
              `attachment-${attachment.ordinal.toString().padStart(4, '0')}.bin`,
            ),
            onePixelPng,
          ),
        ),
      ]);
      return {
        providerNoteId,
        modifiedAtProvider: note.modifiedAtProvider,
        attachmentMetadata: note.attachmentMetadata,
      };
    },
  );
  const provider: AppleNotesProvider = {
    auditFolder,
    exportNote,
  };
  return {
    provider,
    exportNote,
    setAudit: (nextAudit: AppleNotesFolderAudit) => {
      activeAudit = nextAudit;
    },
  };
};

const acknowledgement = AppleNotesLocalAcknowledgementSchema.parse({
  schemaVersion: 1,
  noIdentifiablePatientInformation: true,
  authorizedForLocalProcessing: true,
  sharedMaterialRightsAcknowledged: true,
  acknowledgedAt: '2026-07-24T17:00:00.000Z',
  acknowledgedBy: 'Local test',
});

describe('Apple Notes local source intake', () => {
  it('audits provider metadata without exporting note content', async () => {
    const root = await makeRoot();
    const { provider, exportNote } = makeProvider();
    const report = await auditAppleNotesFolder({
      folderName: 'Psych research',
      sourceRoot: root,
      provider,
      now: () => '2026-07-24T17:00:00.000Z',
    });

    expect(report).toMatchObject({ notes: 1, attachments: 1, lockedNotes: 0, sharedNotes: 1 });
    expect(exportNote).not.toHaveBeenCalled();
    const manifestText = await readFile(join(root, 'manifests', 'apple-notes-intake.json'), 'utf8');
    expect(manifestText).not.toContain('Private research title');
    expect(manifestText).not.toContain('Brief private takeaway');
  });

  it('exports, hashes, locally OCRs, and queues a deterministic Markdown composite', async () => {
    const root = await makeRoot();
    const { provider, exportNote } = makeProvider();
    const ocrRunner = vi.fn(async (_input: string, _mediaType: string, output: string) => {
      await writeFile(output, 'Attachment OCR takeaway');
    });

    const report = await syncAppleNotesFolder({
      folderName: 'Psych research',
      sourceRoot: root,
      provider,
      acknowledgement,
      ocrRunner,
      now: () => '2026-07-24T17:00:00.000Z',
    });

    expect(report).toMatchObject({
      exported: 1,
      unchanged: 0,
      quarantined: 0,
      ocrCompleted: 1,
      compositeFilesQueued: 1,
    });
    expect(exportNote).toHaveBeenCalledOnce();
    expect(ocrRunner).toHaveBeenCalledOnce();
    const manifest = await validateAppleNotesManifest(root);
    expect(manifest?.acknowledgement).toEqual(acknowledgement);
    expect(manifest?.notes[0]).toMatchObject({
      exportStatus: 'exported',
      sourceDocumentId: expect.stringMatching(/^source-document\./),
    });
    const filename = manifest!.notes[0]!.compositeInboxFilename!;
    const composite = await readFile(join(root, 'inbox', filename), 'utf8');
    expect(composite).toContain('Brief private takeaway');
    expect(composite).toContain('Attachment OCR takeaway');
  });

  it('is idempotent when provider modification metadata is unchanged', async () => {
    const root = await makeRoot();
    const { provider, exportNote } = makeProvider();
    const options = {
      folderName: 'Psych research',
      sourceRoot: root,
      provider,
      acknowledgement,
      ocrRunner: async (_input: string, _mediaType: string, output: string) =>
        writeFile(output, 'OCR'),
      now: () => '2026-07-24T17:00:00.000Z',
    };

    await syncAppleNotesFolder(options);
    const second = await syncAppleNotesFolder({
      ...options,
      now: () => '2026-07-24T18:00:00.000Z',
    });

    expect(second).toMatchObject({ exported: 0, unchanged: 1, compositeFilesQueued: 0 });
    expect(exportNote).toHaveBeenCalledOnce();
  });

  it('re-exports an attachment-only change and never self-links duplicate provenance', async () => {
    const root = await makeRoot();
    const { provider, exportNote, setAudit } = makeProvider();
    const options = {
      folderName: 'Psych research',
      sourceRoot: root,
      provider,
      acknowledgement,
      ocrRunner: async (_input: string, _mediaType: string, output: string) =>
        writeFile(output, 'OCR'),
      now: () => '2026-07-24T17:00:00.000Z',
    };
    await syncAppleNotesFolder(options);

    const originalAudit = folderAudit();
    const changedAudit: AppleNotesFolderAudit = {
      ...originalAudit,
      notes: originalAudit.notes.map((note) => ({
        ...note,
        attachmentMetadata: note.attachmentMetadata.map((attachment) => ({
          ...attachment,
          modifiedAtProvider: 'July 24, 2026 at 2:00:00 PM',
        })),
      })),
    };
    setAudit(changedAudit);
    const changed = await syncAppleNotesFolder({
      ...options,
      now: () => '2026-07-24T18:00:00.000Z',
    });

    expect(changed).toMatchObject({ exported: 1, unchanged: 0 });
    expect(exportNote).toHaveBeenCalledTimes(2);
    const textChangedAudit: AppleNotesFolderAudit = {
      ...changedAudit,
      notes: changedAudit.notes.map((note) => ({
        ...note,
        modifiedAtProvider: 'July 24, 2026 at 3:00:00 PM',
      })),
    };
    setAudit(textChangedAudit);
    await syncAppleNotesFolder({
      ...options,
      now: () => '2026-07-24T19:00:00.000Z',
    });
    expect(exportNote).toHaveBeenCalledTimes(3);
    const manifest = await validateAppleNotesManifest(root);
    expect(manifest?.notes[0]?.attachmentRecords[0]?.duplicateOfId).toBeNull();
  });

  it('retains removed attachments as missing and reimports a restored note', async () => {
    const root = await makeRoot();
    const { provider, exportNote, setAudit } = makeProvider();
    const options = {
      folderName: 'Psych research',
      sourceRoot: root,
      provider,
      acknowledgement,
      ocrRunner: async (_input: string, _mediaType: string, output: string) =>
        writeFile(output, 'OCR'),
      now: () => '2026-07-24T17:00:00.000Z',
    };
    await syncAppleNotesFolder(options);

    const originalAudit = folderAudit();
    const noteWithoutAttachment: AppleNotesFolderAudit = {
      ...originalAudit,
      notes: originalAudit.notes.map((note) => ({ ...note, attachmentMetadata: [] })),
    };
    setAudit(noteWithoutAttachment);
    await syncAppleNotesFolder({ ...options, now: () => '2026-07-24T18:00:00.000Z' });
    expect((await validateAppleNotesManifest(root))?.notes[0]?.attachmentRecords).toEqual([
      expect.objectContaining({ exportStatus: 'missing' }),
    ]);

    setAudit({ ...folderAudit(), notes: [] });
    await auditAppleNotesFolder({
      folderName: 'Psych research',
      sourceRoot: root,
      provider,
      now: () => '2026-07-24T19:00:00.000Z',
    });
    expect((await validateAppleNotesManifest(root))?.notes[0]?.exportStatus).toBe('missing');

    setAudit(folderAudit());
    const restored = await syncAppleNotesFolder({
      ...options,
      now: () => '2026-07-24T20:00:00.000Z',
    });
    expect(restored).toMatchObject({ exported: 1, unchanged: 0 });
    expect(exportNote).toHaveBeenCalledTimes(3);
    expect((await validateAppleNotesManifest(root))?.notes[0]).toMatchObject({
      exportStatus: 'exported',
      attachmentRecords: [expect.objectContaining({ exportStatus: 'exported' })],
    });
  });

  it('quarantines a note whose title, body, and local OCR are all empty', async () => {
    const root = await makeRoot();
    const originalAudit = folderAudit();
    const audit: AppleNotesFolderAudit = {
      ...originalAudit,
      notes: originalAudit.notes.map((note) => ({ ...note, attachmentMetadata: [] })),
    };
    const provider: AppleNotesProvider = {
      auditFolder: vi.fn(async () => audit),
      exportNote: vi.fn(async ({ providerNoteId, destinationDirectory }) => {
        await mkdir(destinationDirectory, { recursive: true });
        await Promise.all([
          writeFile(join(destinationDirectory, 'title.txt'), ' '),
          writeFile(join(destinationDirectory, 'plaintext.txt'), '\n'),
          writeFile(join(destinationDirectory, 'body.html'), '<p></p>'),
        ]);
        return {
          providerNoteId,
          modifiedAtProvider: audit.notes[0]!.modifiedAtProvider,
          attachmentMetadata: [],
        };
      }),
    };

    const report = await syncAppleNotesFolder({
      folderName: 'Psych research',
      sourceRoot: root,
      provider,
      acknowledgement,
      now: () => '2026-07-24T17:00:00.000Z',
    });

    expect(report).toMatchObject({ exported: 0, quarantined: 1 });
    expect((await validateAppleNotesManifest(root))?.notes[0]?.exportStatus).toBe('quarantined');
  });

  it('retains processed attachment provenance when a later empty-note check quarantines the note', async () => {
    const root = await makeRoot();
    const audit = folderAudit();
    const provider: AppleNotesProvider = {
      auditFolder: vi.fn(async () => audit),
      exportNote: vi.fn(async ({ providerNoteId, destinationDirectory }) => {
        await mkdir(destinationDirectory, { recursive: true });
        await Promise.all([
          writeFile(join(destinationDirectory, 'title.txt'), ' '),
          writeFile(join(destinationDirectory, 'plaintext.txt'), '\n'),
          writeFile(join(destinationDirectory, 'body.html'), '<p></p>'),
          writeFile(join(destinationDirectory, 'attachment-0001.bin'), onePixelPng),
        ]);
        return {
          providerNoteId,
          modifiedAtProvider: audit.notes[0]!.modifiedAtProvider,
          attachmentMetadata: audit.notes[0]!.attachmentMetadata,
        };
      }),
    };

    const report = await syncAppleNotesFolder({
      folderName: 'Psych research',
      sourceRoot: root,
      provider,
      acknowledgement,
      ocrRunner: async (_input, _mediaType, output) => writeFile(output, ' '),
      now: () => '2026-07-24T17:00:00.000Z',
    });

    expect(report).toMatchObject({ exported: 0, quarantined: 1, ocrEmpty: 1 });
    expect((await validateAppleNotesManifest(root))?.notes[0]).toMatchObject({
      exportStatus: 'quarantined',
      attachmentRecords: [
        {
          exportStatus: 'exported',
          relativePath: expect.stringContaining('attachment-0001.bin'),
          mediaType: 'image/png',
          sizeBytes: onePixelPng.length,
          sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
          ocrStatus: 'empty',
          ocrTextHash: null,
          error: null,
        },
      ],
    });
  });

  it('quarantines an unavailable attachment without discarding the note text', async () => {
    const root = await makeRoot();
    const audit = folderAudit();
    const provider: AppleNotesProvider = {
      auditFolder: vi.fn(async () => audit),
      exportNote: vi.fn(async ({ providerNoteId, destinationDirectory }) => {
        await mkdir(destinationDirectory, { recursive: true });
        await Promise.all([
          writeFile(join(destinationDirectory, 'title.txt'), 'Usable note title'),
          writeFile(join(destinationDirectory, 'plaintext.txt'), 'Usable private takeaway'),
          writeFile(join(destinationDirectory, 'body.html'), '<p>Usable private takeaway</p>'),
        ]);
        return {
          providerNoteId,
          modifiedAtProvider: audit.notes[0]!.modifiedAtProvider,
          attachmentMetadata: audit.notes[0]!.attachmentMetadata.map((attachment) => ({
            ...attachment,
            exportSucceeded: false,
          })),
        };
      }),
    };

    const report = await syncAppleNotesFolder({
      folderName: 'Psych research',
      sourceRoot: root,
      provider,
      acknowledgement,
      ocrRunner: async (_input, _mediaType, output) => writeFile(output, 'unreachable'),
      now: () => '2026-07-24T17:00:00.000Z',
    });

    expect(report).toMatchObject({
      exported: 1,
      quarantined: 0,
      attachmentQuarantined: 1,
      ocrFailed: 1,
    });
    const manifest = await validateAppleNotesManifest(root);
    expect(manifest?.notes[0]).toMatchObject({
      exportStatus: 'exported',
      attachmentRecords: [
        {
          exportStatus: 'quarantined',
          relativePath: null,
          sha256: null,
          ocrStatus: 'failed',
          error: 'Notes could not export this attachment through its public scripting interface.',
        },
      ],
    });
    const filename = manifest!.notes[0]!.compositeInboxFilename!;
    const composite = await readFile(join(root, 'inbox', filename), 'utf8');
    expect(composite).toContain('Usable private takeaway');
    expect(composite).toContain('[No OCR text: failed]');
  });

  it('checkpoints each note so an interrupted bulk run resumes without re-exporting prior work', async () => {
    const root = await makeRoot();
    const first = folderAudit().notes[0]!;
    const second = {
      ...structuredClone(first),
      providerNoteId: 'provider-note-2',
      attachmentMetadata: first.attachmentMetadata.map((attachment) => ({
        ...attachment,
        providerNoteId: 'provider-note-2',
        providerAttachmentId: 'provider-attachment-2',
        providerContentIdentifier: 'cid-2',
      })),
    };
    const { provider, exportNote } = makeProvider({
      ...folderAudit(),
      notes: [first, second],
    });
    const options = {
      folderName: 'Psych research',
      sourceRoot: root,
      provider,
      acknowledgement,
      ocrRunner: async (_input: string, _mediaType: string, output: string) =>
        writeFile(output, 'OCR'),
      now: () => '2026-07-24T17:00:00.000Z',
    };

    await expect(
      syncAppleNotesFolder({
        ...options,
        onNoteCheckpoint: async (_noteId, completedCount) => {
          if (completedCount === 1) throw new Error('Simulated interruption');
        },
      }),
    ).rejects.toThrow('Simulated interruption');
    expect(
      (await validateAppleNotesManifest(root))?.notes.map((note) => note.exportStatus),
    ).toEqual(['exported', 'metadata_only']);

    const resumed = await syncAppleNotesFolder(options);
    expect(resumed).toMatchObject({ exported: 1, unchanged: 1, quarantined: 0 });
    expect(exportNote).toHaveBeenCalledTimes(2);
  });

  it('retains locked notes as quarantined metadata without reading them', async () => {
    const root = await makeRoot();
    const audit = folderAudit();
    const { provider, exportNote } = makeProvider({
      ...audit,
      notes: audit.notes.map((note) => ({ ...note, locked: true })),
    });

    const report = await syncAppleNotesFolder({
      folderName: 'Psych research',
      sourceRoot: root,
      provider,
      acknowledgement,
      now: () => '2026-07-24T17:00:00.000Z',
    });

    expect(report).toMatchObject({ exported: 0, quarantined: 1, lockedNotes: 1 });
    expect(exportNote).not.toHaveBeenCalled();
  });
});
