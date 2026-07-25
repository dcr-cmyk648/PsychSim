import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import {
  access,
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';

import {
  AppleNotesAttachmentRecordSchema,
  AppleNotesIntakeManifestSchema,
  AppleNotesLocalAcknowledgementSchema,
  AppleNotesNoteRecordSchema,
  type AppleNotesAttachmentRecord,
  type AppleNotesIntakeManifest,
  type AppleNotesLocalAcknowledgement,
  type AppleNotesNoteRecord,
} from '@psychsim/schemas';

import { DEFAULT_SOURCE_ROOT, loadSourceManifest } from './source-pipeline';

const FIELD_DELIMITER = String.fromCharCode(31);
const RECORD_DELIMITER = String.fromCharCode(30);
const APPLE_NOTES_PROVIDER_VERSION = 'psychsim-apple-notes-provider-1';
const APPLE_NOTES_OCR_ENGINE = 'macos-vision-vnrecognizetextrequest-accurate-1';
const MAX_ATTACHMENT_BYTES = 100 * 1024 * 1024;
const MAX_OCR_TEXT_BYTES = 4 * 1024 * 1024;
const PROCESS_TIMEOUT_MS = 180_000;

const scriptsRoot = resolve('tools/content-cli/scripts');
const metadataScriptPath = join(scriptsRoot, 'apple-notes-metadata.applescript');
const exportScriptPath = join(scriptsRoot, 'apple-notes-export.applescript');
const ocrSourcePath = join(scriptsRoot, 'apple-notes-vision-ocr.swift');

export interface AppleNotesAttachmentMetadata {
  providerNoteId: string;
  ordinal: number;
  providerAttachmentId: string;
  providerContentIdentifier: string | null;
  createdAtProvider: string;
  modifiedAtProvider: string;
  exportSucceeded?: boolean;
}

interface AppleNotesNoteMetadata {
  providerNoteId: string;
  createdAtProvider: string;
  modifiedAtProvider: string;
  locked: boolean;
  shared: boolean;
  attachmentMetadata: readonly AppleNotesAttachmentMetadata[];
}

export interface AppleNotesFolderAudit {
  providerAccountId: string;
  providerFolderId: string;
  folderName: string;
  folderShared: boolean;
  notes: readonly AppleNotesNoteMetadata[];
}

export interface AppleNotesProvider {
  auditFolder(folderName: string): Promise<AppleNotesFolderAudit>;
  exportNote(input: {
    folderName: string;
    providerNoteId: string;
    destinationDirectory: string;
  }): Promise<AppleNotesExportReceipt>;
}

export interface AppleNotesExportReceipt {
  providerNoteId: string;
  modifiedAtProvider: string;
  attachmentMetadata: readonly AppleNotesAttachmentMetadata[];
}

export interface AppleNotesAuditOptions {
  folderName: string;
  sourceRoot?: string;
  provider?: AppleNotesProvider;
  now?: () => string;
}

export interface AppleNotesSyncOptions extends AppleNotesAuditOptions {
  acknowledgement: AppleNotesLocalAcknowledgement;
  ocr?: boolean;
  ocrRunner?: (inputPath: string, mediaType: string, outputPath: string) => Promise<void>;
  ocrEngineId?: string;
  /**
   * Test/diagnostic hook invoked only after the private manifest has safely
   * checkpointed one note. It must never receive source text.
   */
  onNoteCheckpoint?: (noteId: string, completedCount: number) => Promise<void>;
}

export interface AppleNotesAuditReport {
  folderName: string;
  notes: number;
  attachments: number;
  lockedNotes: number;
  sharedNotes: number;
  manifestPath: string;
}

export interface AppleNotesSyncReport extends AppleNotesAuditReport {
  exported: number;
  unchanged: number;
  quarantined: number;
  attachmentQuarantined: number;
  ocrCompleted: number;
  ocrEmpty: number;
  ocrUnsupported: number;
  ocrFailed: number;
  compositeFilesQueued: number;
}

const sha256 = (value: Uint8Array | string): string =>
  createHash('sha256').update(value).digest('hex');

const noteRecordId = (providerId: string): string =>
  `apple-note.${sha256(providerId).slice(0, 24)}`;

const attachmentRecordId = (providerId: string): string =>
  `apple-note-attachment.${sha256(providerId).slice(0, 24)}`;

const pathsFor = (sourceRoot = DEFAULT_SOURCE_ROOT) => {
  const root = resolve(sourceRoot);
  return {
    root,
    inbox: join(root, 'inbox'),
    manifest: join(root, 'manifests', 'apple-notes-intake.json'),
    privateRoot: join(root, 'extracted', 'apple-notes-private'),
  };
};

const pathInside = (parent: string, child: string): boolean => {
  const relation = relative(resolve(parent), resolve(child));
  return relation !== '' && !relation.startsWith('..') && !isAbsolute(relation);
};

const writeJsonAtomic = async (path: string, value: unknown): Promise<void> => {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temporaryDirectory = await mkdtemp(join(dirname(path), '.apple-notes-write-'));
  await chmod(temporaryDirectory, 0o700);
  const temporaryPath = join(temporaryDirectory, 'manifest.json');
  try {
    await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
    await rename(temporaryPath, path);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
  await chmod(path, 0o600);
};

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const run = async (
  command: string,
  args: readonly string[],
  maximumStdoutBytes = 2 * 1024 * 1024,
  timeoutMs = PROCESS_TIMEOUT_MS,
): Promise<string> =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(command, [...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let stdoutBytes = 0;
    let settled = false;
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 2_000).unref();
    }, timeoutMs);
    timeout.unref();
    child.stdout.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes <= maximumStdoutBytes) stdoutChunks.push(chunk);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      if (stderrChunks.reduce((total, value) => total + value.length, 0) < 32_000) {
        stderrChunks.push(chunk);
      }
    });
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (stdoutBytes > maximumStdoutBytes) {
        reject(new Error(`${command} exceeded its bounded metadata output.`));
        return;
      }
      if (code !== 0) {
        const error = Buffer.concat(stderrChunks).toString('utf8').trim().slice(0, 1000);
        reject(
          new Error(
            `${command} failed or timed out (${code ?? 'signal'}): ${error || 'no details'}`,
          ),
        );
        return;
      }
      resolvePromise(Buffer.concat(stdoutChunks).toString('utf8').trim());
    });
  });

const withManifestLock = async <T>(
  manifestPath: string,
  operation: () => Promise<T>,
): Promise<T> => {
  const lockPath = `${manifestPath}.lock`;
  await mkdir(dirname(lockPath), { recursive: true, mode: 0o700 });
  const acquire = async (
    allowStaleRecovery: boolean,
  ): Promise<Awaited<ReturnType<typeof open>>> => {
    try {
      const handle = await open(lockPath, 'wx', 0o600);
      await handle.writeFile(
        `${JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() })}\n`,
      );
      return handle;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      if (!allowStaleRecovery) {
        throw new Error('Apple Notes intake is already running in this workspace.');
      }
      let ownerPid: number | null = null;
      try {
        const record = JSON.parse(await readFile(lockPath, 'utf8')) as { pid?: unknown };
        ownerPid =
          typeof record.pid === 'number' && Number.isInteger(record.pid) ? record.pid : null;
      } catch {
        ownerPid = null;
      }
      if (ownerPid === null) {
        throw new Error(
          'Apple Notes intake lock is incomplete; verify no intake is running, then remove the local .lock file.',
        );
      }
      try {
        process.kill(ownerPid, 0);
        throw new Error(`Apple Notes intake is already running as process ${ownerPid}.`);
      } catch (ownerError) {
        if ((ownerError as NodeJS.ErrnoException).code !== 'ESRCH') throw ownerError;
      }
      await unlink(lockPath);
      return acquire(false);
    }
  };
  const handle = await acquire(true);
  try {
    return await operation();
  } finally {
    await handle.close();
    await unlink(lockPath).catch(() => undefined);
  }
};

const parseBoolean = (value: string): boolean => value.toLocaleLowerCase() === 'true';

const parseAppleNotesMetadata = (value: string, folderName: string): AppleNotesFolderAudit => {
  const records = value
    .split(RECORD_DELIMITER)
    .map((record) => record.split(FIELD_DELIMITER))
    .filter((fields) => fields.length > 1);
  const folderRecords = records.filter((fields) => fields[0] === 'F');
  if (folderRecords.length !== 1) {
    throw new Error(
      `Expected exactly one Apple Notes folder named “${folderName}”; found ${folderRecords.length}.`,
    );
  }
  const folder = folderRecords[0]!;
  const attachmentByNoteId = new Map<string, AppleNotesAttachmentMetadata[]>();
  for (const fields of records.filter((candidate) => candidate[0] === 'A')) {
    const providerNoteId = fields[1] ?? '';
    const attachment: AppleNotesAttachmentMetadata = {
      providerNoteId,
      ordinal: Number.parseInt(fields[2] ?? '', 10),
      providerAttachmentId: fields[3] ?? '',
      providerContentIdentifier: fields[4] ? fields[4] : null,
      createdAtProvider: fields[5] ?? '',
      modifiedAtProvider: fields[6] ?? '',
    };
    if (
      !attachment.providerNoteId ||
      !Number.isInteger(attachment.ordinal) ||
      attachment.ordinal < 1 ||
      !attachment.providerAttachmentId ||
      !attachment.createdAtProvider ||
      !attachment.modifiedAtProvider
    ) {
      throw new Error('Apple Notes returned an invalid attachment metadata record.');
    }
    const existing = attachmentByNoteId.get(providerNoteId) ?? [];
    existing.push(attachment);
    attachmentByNoteId.set(providerNoteId, existing);
  }
  const notes = records
    .filter((fields) => fields[0] === 'N')
    .map<AppleNotesNoteMetadata>((fields) => {
      const providerNoteId = fields[1] ?? '';
      const expectedAttachments = Number.parseInt(fields[6] ?? '', 10);
      const attachmentMetadata = (attachmentByNoteId.get(providerNoteId) ?? []).sort(
        (left, right) => left.ordinal - right.ordinal,
      );
      if (
        !providerNoteId ||
        !fields[2] ||
        !fields[3] ||
        !Number.isInteger(expectedAttachments) ||
        expectedAttachments !== attachmentMetadata.length
      ) {
        throw new Error('Apple Notes returned an invalid note metadata record.');
      }
      return {
        providerNoteId,
        createdAtProvider: fields[2],
        modifiedAtProvider: fields[3],
        locked: parseBoolean(fields[4] ?? 'false'),
        shared: parseBoolean(fields[5] ?? 'false'),
        attachmentMetadata,
      };
    })
    .sort((left, right) => left.providerNoteId.localeCompare(right.providerNoteId));
  const expectedNotes = Number.parseInt(folder[4] ?? '', 10);
  if (notes.length !== expectedNotes) {
    throw new Error(
      `Apple Notes reported ${expectedNotes} notes but returned ${notes.length} metadata records.`,
    );
  }
  return {
    providerAccountId: folder[1]!,
    providerFolderId: folder[2]!,
    folderName,
    folderShared: parseBoolean(folder[3] ?? 'false'),
    notes,
  };
};

const parseAppleNotesExportReceipt = (
  value: string,
  expectedNoteId: string,
): AppleNotesExportReceipt => {
  const records = value
    .split(RECORD_DELIMITER)
    .map((record) => record.split(FIELD_DELIMITER))
    .filter((fields) => fields.length > 1);
  const exportRecords = records.filter((fields) => fields[0] === 'E');
  if (exportRecords.length !== 1) {
    throw new Error('Apple Notes did not return one private-export receipt.');
  }
  const exported = exportRecords[0]!;
  const providerNoteId = exported[1] ?? '';
  const modifiedAtProvider = exported[2] ?? '';
  const expectedAttachments = Number.parseInt(exported[3] ?? '', 10);
  if (
    providerNoteId !== expectedNoteId ||
    !modifiedAtProvider ||
    !Number.isInteger(expectedAttachments) ||
    expectedAttachments < 0
  ) {
    throw new Error('Apple Notes returned an invalid private-export receipt.');
  }
  const attachmentMetadata = records
    .filter((fields) => fields[0] === 'A')
    .map<AppleNotesAttachmentMetadata>((fields) => ({
      providerNoteId,
      ordinal: Number.parseInt(fields[1] ?? '', 10),
      providerAttachmentId: fields[2] ?? '',
      providerContentIdentifier: fields[3] ? fields[3] : null,
      createdAtProvider: fields[4] ?? '',
      modifiedAtProvider: fields[5] ?? '',
      exportSucceeded: parseBoolean(fields[6] ?? 'true'),
    }))
    .sort((left, right) => left.ordinal - right.ordinal);
  if (
    attachmentMetadata.length !== expectedAttachments ||
    attachmentMetadata.some(
      (attachment) =>
        !Number.isInteger(attachment.ordinal) ||
        attachment.ordinal < 1 ||
        !attachment.providerAttachmentId ||
        !attachment.createdAtProvider ||
        !attachment.modifiedAtProvider,
    )
  ) {
    throw new Error('Apple Notes returned invalid attachment export provenance.');
  }
  return { providerNoteId, modifiedAtProvider, attachmentMetadata };
};

export const macOsAppleNotesProvider: AppleNotesProvider = {
  async auditFolder(folderName) {
    const output = await run('/usr/bin/osascript', [metadataScriptPath, folderName]);
    return parseAppleNotesMetadata(output, folderName);
  },
  async exportNote({ folderName, providerNoteId, destinationDirectory }) {
    const output = await run('/usr/bin/osascript', [
      exportScriptPath,
      folderName,
      providerNoteId,
      destinationDirectory,
    ]);
    return parseAppleNotesExportReceipt(output, providerNoteId);
  },
};

const loadManifest = async (path: string): Promise<AppleNotesIntakeManifest | null> => {
  try {
    return AppleNotesIntakeManifestSchema.parse(
      JSON.parse(await readFile(path, 'utf8')) as unknown,
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
};

const mergeAttachments = (
  metadata: readonly AppleNotesAttachmentMetadata[],
  previous: AppleNotesNoteRecord | undefined,
): AppleNotesAttachmentRecord[] => {
  const priorByProviderId = new Map(
    previous?.attachmentRecords.map((attachment) => [
      attachment.providerAttachmentId,
      attachment,
    ]) ?? [],
  );
  const currentProviderIds = new Set(metadata.map((attachment) => attachment.providerAttachmentId));
  const current = metadata.map((attachment) => {
    const prior = priorByProviderId.get(attachment.providerAttachmentId);
    const unchanged =
      prior?.exportStatus !== 'missing' &&
      prior?.ordinal === attachment.ordinal &&
      prior?.providerContentIdentifier === attachment.providerContentIdentifier &&
      prior?.createdAtProvider === attachment.createdAtProvider &&
      prior?.modifiedAtProvider === attachment.modifiedAtProvider;
    return AppleNotesAttachmentRecordSchema.parse({
      schemaVersion: 1,
      id: attachmentRecordId(attachment.providerAttachmentId),
      providerAttachmentId: attachment.providerAttachmentId,
      providerContentIdentifier: attachment.providerContentIdentifier,
      ordinal: attachment.ordinal,
      createdAtProvider: attachment.createdAtProvider,
      modifiedAtProvider: attachment.modifiedAtProvider,
      exportStatus: unchanged && prior ? prior.exportStatus : 'pending',
      relativePath: unchanged && prior ? prior.relativePath : null,
      mediaType: unchanged && prior ? prior.mediaType : null,
      sizeBytes: unchanged && prior ? prior.sizeBytes : null,
      sha256: unchanged && prior ? prior.sha256 : null,
      duplicateOfId: unchanged && prior ? prior.duplicateOfId : null,
      ocrStatus: unchanged && prior ? prior.ocrStatus : 'not_requested',
      ocrEngine: unchanged && prior ? prior.ocrEngine : null,
      ocrTextHash: unchanged && prior ? prior.ocrTextHash : null,
      error: unchanged && prior ? prior.error : null,
    });
  });
  const missing = (previous?.attachmentRecords ?? [])
    .filter((attachment) => !currentProviderIds.has(attachment.providerAttachmentId))
    .map((attachment) =>
      AppleNotesAttachmentRecordSchema.parse({ ...attachment, exportStatus: 'missing' }),
    );
  return [...current, ...missing];
};

const sameAttachmentSnapshot = (
  metadata: readonly AppleNotesAttachmentMetadata[],
  previous: AppleNotesNoteRecord | undefined,
): boolean => {
  if (!previous) return false;
  const priorActive = previous.attachmentRecords.filter(
    (attachment) => attachment.exportStatus !== 'missing',
  );
  return (
    priorActive.length === metadata.length &&
    metadata.every((attachment) => {
      const prior = priorActive.find(
        (candidate) => candidate.providerAttachmentId === attachment.providerAttachmentId,
      );
      return (
        prior?.ordinal === attachment.ordinal &&
        prior.providerContentIdentifier === attachment.providerContentIdentifier &&
        prior.createdAtProvider === attachment.createdAtProvider &&
        prior.modifiedAtProvider === attachment.modifiedAtProvider
      );
    })
  );
};

const auditToManifest = (
  audit: AppleNotesFolderAudit,
  previous: AppleNotesIntakeManifest | null,
  timestamp: string,
): AppleNotesIntakeManifest => {
  if (
    previous &&
    (previous.providerAccountId !== audit.providerAccountId ||
      previous.providerFolderId !== audit.providerFolderId ||
      previous.folderName !== audit.folderName)
  ) {
    throw new Error(
      'Apple Notes provider folder identity changed; archive the prior private manifest before selecting another folder.',
    );
  }
  const priorByProviderId = new Map(
    previous?.notes.map((note) => [note.providerNoteId, note]) ?? [],
  );
  const currentProviderIds = new Set(audit.notes.map((note) => note.providerNoteId));
  const currentNotes = audit.notes.map((metadata) => {
    const prior = priorByProviderId.get(metadata.providerNoteId);
    const unchanged =
      prior?.exportStatus !== 'missing' &&
      prior?.modifiedAtProvider === metadata.modifiedAtProvider &&
      sameAttachmentSnapshot(metadata.attachmentMetadata, prior);
    return AppleNotesNoteRecordSchema.parse({
      schemaVersion: 1,
      id: noteRecordId(metadata.providerNoteId),
      providerNoteId: metadata.providerNoteId,
      createdAtProvider: metadata.createdAtProvider,
      modifiedAtProvider: metadata.modifiedAtProvider,
      locked: metadata.locked,
      shared: metadata.shared,
      exportStatus: unchanged && prior ? prior.exportStatus : 'metadata_only',
      titleHash: unchanged && prior ? prior.titleHash : null,
      plaintextHash: unchanged && prior ? prior.plaintextHash : null,
      htmlHash: unchanged && prior ? prior.htmlHash : null,
      compositeHash: unchanged && prior ? prior.compositeHash : null,
      compositeInboxFilename: unchanged && prior ? prior.compositeInboxFilename : null,
      sourceDocumentId: unchanged && prior ? prior.sourceDocumentId : null,
      attachmentRecords: mergeAttachments(metadata.attachmentMetadata, prior),
      error: unchanged && prior ? prior.error : null,
    });
  });
  const missingNotes = (previous?.notes ?? [])
    .filter((note) => !currentProviderIds.has(note.providerNoteId))
    .map((note) => AppleNotesNoteRecordSchema.parse({ ...note, exportStatus: 'missing' }));
  return AppleNotesIntakeManifestSchema.parse({
    schemaVersion: 1,
    manifestVersion: 1,
    provider: 'apple_notes',
    folderName: audit.folderName,
    providerAccountId: audit.providerAccountId,
    providerFolderId: audit.providerFolderId,
    folderShared: audit.folderShared,
    lastAuditedAt: timestamp,
    lastSynchronizedAt: previous?.lastSynchronizedAt ?? null,
    acknowledgement: previous?.acknowledgement ?? null,
    notes: [...currentNotes, ...missingNotes],
  });
};

const auditAppleNotesFolderUnlocked = async (
  options: AppleNotesAuditOptions,
): Promise<AppleNotesAuditReport> => {
  const paths = pathsFor(options.sourceRoot);
  const provider = options.provider ?? macOsAppleNotesProvider;
  const timestamp = options.now?.() ?? new Date().toISOString();
  const previous = await loadManifest(paths.manifest);
  const audit = await provider.auditFolder(options.folderName);
  const manifest = auditToManifest(audit, previous, timestamp);
  await writeJsonAtomic(paths.manifest, manifest);
  return {
    folderName: audit.folderName,
    notes: audit.notes.length,
    attachments: audit.notes.reduce((total, note) => total + note.attachmentMetadata.length, 0),
    lockedNotes: audit.notes.filter((note) => note.locked).length,
    sharedNotes: audit.notes.filter((note) => note.shared).length,
    manifestPath: paths.manifest,
  };
};

export const auditAppleNotesFolder = async (
  options: AppleNotesAuditOptions,
): Promise<AppleNotesAuditReport> => {
  const paths = pathsFor(options.sourceRoot);
  return withManifestLock(paths.manifest, () => auditAppleNotesFolderUnlocked(options));
};

const mediaTypeForFile = async (path: string): Promise<string> =>
  (await run('/usr/bin/file', ['-b', '--mime-type', path], 8_192)).trim();

let ocrBinaryPromise: Promise<string> | undefined;
const getPrivateOcrBinary = async (): Promise<string> => {
  if (!ocrBinaryPromise) {
    ocrBinaryPromise = (async () => {
      const buildDirectory = await mkdtemp(join(tmpdir(), 'psychsim-apple-notes-ocr-'));
      await chmod(buildDirectory, 0o700);
      const binaryPath = join(buildDirectory, 'vision-ocr');
      await run(
        '/usr/bin/xcrun',
        [
          'swiftc',
          ocrSourcePath,
          '-o',
          binaryPath,
          '-framework',
          'Vision',
          '-framework',
          'PDFKit',
          '-framework',
          'AppKit',
          '-framework',
          'ImageIO',
        ],
        8_192,
      );
      await chmod(binaryPath, 0o700);
      return binaryPath;
    })();
  }
  return ocrBinaryPromise;
};

const defaultOcrRunner = async (
  inputPath: string,
  mediaType: string,
  outputPath: string,
): Promise<void> => {
  const binaryPath = await getPrivateOcrBinary();
  await run(binaryPath, [inputPath, mediaType, outputPath], 8_192);
};

let defaultOcrEnginePromise: Promise<string> | undefined;
const getDefaultOcrEngineId = async (): Promise<string> => {
  if (!defaultOcrEnginePromise) {
    defaultOcrEnginePromise = (async () => {
      const [sourceBytes, osBuild, sdkVersion] = await Promise.all([
        readFile(ocrSourcePath),
        run('/usr/bin/sw_vers', ['-buildVersion'], 8_192),
        run('/usr/bin/xcrun', ['--show-sdk-version'], 8_192),
      ]);
      return `${APPLE_NOTES_OCR_ENGINE};source=${sha256(sourceBytes).slice(0, 16)};os=${osBuild};sdk=${sdkVersion}`;
    })();
  }
  return defaultOcrEnginePromise;
};

const sha256File = async (path: string): Promise<string> =>
  new Promise((resolvePromise, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(path);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolvePromise(hash.digest('hex')));
  });

const assertPrivateRegularFile = async (privateRoot: string, path: string): Promise<void> => {
  const metadata = await lstat(path);
  if (!metadata.isFile() || metadata.isSymbolicLink()) {
    throw new Error('Apple Notes export produced a non-regular private file.');
  }
  const [resolvedRoot, resolvedPath] = await Promise.all([realpath(privateRoot), realpath(path)]);
  if (!pathInside(resolvedRoot, resolvedPath)) {
    throw new Error('Apple Notes export resolved outside the protected private root.');
  }
};

const privateRelativePath = (paths: ReturnType<typeof pathsFor>, absolutePath: string): string => {
  if (!pathInside(paths.privateRoot, absolutePath)) {
    throw new Error('Refusing to record an Apple Notes private path outside the protected root.');
  }
  return relative(paths.root, absolutePath);
};

const safeResetDerivedDirectory = async (
  privateRoot: string,
  destinationDirectory: string,
): Promise<void> => {
  if (!pathInside(privateRoot, destinationDirectory)) {
    throw new Error('Refusing to reset a path outside the Apple Notes private derivative root.');
  }
  await rm(destinationDirectory, { recursive: true, force: true });
  await mkdir(destinationDirectory, { recursive: true, mode: 0o700 });
  await chmod(destinationDirectory, 0o700);
};

const revisionIdFor = (note: AppleNotesNoteRecord): string =>
  sha256(
    [
      note.providerNoteId,
      note.modifiedAtProvider,
      APPLE_NOTES_PROVIDER_VERSION,
      ...note.attachmentRecords
        .filter((attachment) => attachment.exportStatus !== 'missing')
        .sort((left, right) => left.ordinal - right.ordinal)
        .map(
          (attachment) =>
            `${attachment.ordinal}:${attachment.providerAttachmentId}:${attachment.modifiedAtProvider}`,
        ),
    ].join('\u0000'),
  ).slice(0, 20);

const noteDirectoryFor = (paths: ReturnType<typeof pathsFor>, note: AppleNotesNoteRecord): string =>
  join(paths.privateRoot, 'notes', note.id, revisionIdFor(note));

const processAttachment = async (input: {
  paths: ReturnType<typeof pathsFor>;
  noteDirectory: string;
  attachment: AppleNotesAttachmentRecord;
  priorHashOwner: Map<string, string>;
  ocr: boolean;
  ocrEngine: string | null;
  ocrRunner: NonNullable<AppleNotesSyncOptions['ocrRunner']>;
}): Promise<AppleNotesAttachmentRecord> => {
  const filePath = join(
    input.noteDirectory,
    `attachment-${input.attachment.ordinal.toString().padStart(4, '0')}.bin`,
  );
  try {
    await assertPrivateRegularFile(input.paths.privateRoot, filePath);
    await chmod(filePath, 0o600);
    const fileStat = await stat(filePath);
    const hash = await sha256File(filePath);
    const mediaType = await mediaTypeForFile(filePath);
    const existingHashOwner = input.priorHashOwner.get(hash);
    const duplicateOfId =
      existingHashOwner && existingHashOwner !== input.attachment.id ? existingHashOwner : null;
    if (!existingHashOwner) input.priorHashOwner.set(hash, input.attachment.id);
    let ocrStatus: AppleNotesAttachmentRecord['ocrStatus'] = input.ocr
      ? 'pending'
      : 'not_requested';
    let ocrTextHash: string | null = null;
    let error: string | null = null;
    let exportStatus: AppleNotesAttachmentRecord['exportStatus'] = 'exported';
    if (fileStat.size > MAX_ATTACHMENT_BYTES) {
      exportStatus = 'quarantined';
      ocrStatus = input.ocr ? 'failed' : 'not_requested';
      error = `Attachment exceeds the ${MAX_ATTACHMENT_BYTES.toLocaleString()} byte local OCR limit; bytes were retained and hashed but OCR was skipped.`;
    } else if (input.ocr) {
      if (!(mediaType.startsWith('image/') || mediaType === 'application/pdf')) {
        ocrStatus = 'unsupported';
      } else {
        const ocrPath = `${filePath}.ocr.txt`;
        try {
          await input.ocrRunner(filePath, mediaType, ocrPath);
          await assertPrivateRegularFile(input.paths.privateRoot, ocrPath);
          await chmod(ocrPath, 0o600);
          const ocrStat = await stat(ocrPath);
          if (ocrStat.size > MAX_OCR_TEXT_BYTES) {
            throw new Error(
              `Local OCR output exceeds the ${MAX_OCR_TEXT_BYTES.toLocaleString()} byte limit.`,
            );
          }
          const ocrText = await readFile(ocrPath, 'utf8');
          if (ocrText.trim()) {
            ocrStatus = 'completed';
            ocrTextHash = sha256(ocrText);
          } else {
            ocrStatus = 'empty';
          }
        } catch (caught) {
          ocrStatus = 'failed';
          error = (caught instanceof Error ? caught.message : 'Unknown OCR failure').slice(0, 1000);
        }
      }
    }
    return AppleNotesAttachmentRecordSchema.parse({
      ...input.attachment,
      exportStatus,
      relativePath: privateRelativePath(input.paths, filePath),
      mediaType,
      sizeBytes: fileStat.size,
      sha256: hash,
      duplicateOfId,
      ocrStatus,
      ocrEngine: input.ocr ? input.ocrEngine : null,
      ocrTextHash,
      error,
    });
  } catch (caught) {
    return AppleNotesAttachmentRecordSchema.parse({
      ...input.attachment,
      exportStatus: 'quarantined',
      relativePath: null,
      mediaType: null,
      sizeBytes: null,
      sha256: null,
      duplicateOfId: null,
      ocrStatus: 'failed',
      ocrEngine: input.ocr ? input.ocrEngine : null,
      ocrTextHash: null,
      error: (caught instanceof Error ? caught.message : 'Unknown attachment failure').slice(
        0,
        1000,
      ),
    });
  }
};

const buildComposite = async (
  noteDirectory: string,
  attachments: readonly AppleNotesAttachmentRecord[],
): Promise<{
  bytes: Buffer;
  titleHash: string;
  plaintextHash: string;
  htmlHash: string;
  hasReviewableText: boolean;
}> => {
  const [title, plaintext, html] = await Promise.all([
    readFile(join(noteDirectory, 'title.txt'), 'utf8'),
    readFile(join(noteDirectory, 'plaintext.txt'), 'utf8'),
    readFile(join(noteDirectory, 'body.html'), 'utf8'),
  ]);
  const sections = [
    '# Apple Notes research item',
    '',
    '## Note title',
    '',
    title.trim(),
    '',
    '## Note text',
    '',
    plaintext.trim(),
  ];
  let hasReviewableText = Boolean(title.trim() || plaintext.trim());
  for (const attachment of attachments.filter(
    (candidate) => candidate.exportStatus !== 'missing',
  )) {
    const attachmentPath = join(
      noteDirectory,
      `attachment-${attachment.ordinal.toString().padStart(4, '0')}.bin`,
    );
    const ocrPath = `${attachmentPath}.ocr.txt`;
    if (attachment.ocrStatus === 'completed' && (await fileExists(ocrPath))) {
      const ocrText = (await readFile(ocrPath, 'utf8')).trim();
      if (ocrText) hasReviewableText = true;
      sections.push('', `## Attachment ${attachment.ordinal} OCR`, '', ocrText);
    } else {
      sections.push(
        '',
        `## Attachment ${attachment.ordinal}`,
        '',
        `[No OCR text: ${attachment.ocrStatus.replaceAll('_', ' ')}]`,
      );
    }
  }
  const composite = `${sections.join('\n').trim()}\n`;
  return {
    bytes: Buffer.from(composite, 'utf8'),
    titleHash: sha256(title),
    plaintextHash: sha256(plaintext),
    htmlHash: sha256(html),
    hasReviewableText,
  };
};

const syncAppleNotesFolderUnlocked = async (
  options: AppleNotesSyncOptions,
): Promise<AppleNotesSyncReport> => {
  const acknowledgement = AppleNotesLocalAcknowledgementSchema.parse(options.acknowledgement);
  const paths = pathsFor(options.sourceRoot);
  const provider = options.provider ?? macOsAppleNotesProvider;
  const ocr = options.ocr ?? true;
  const ocrRunner = options.ocrRunner ?? defaultOcrRunner;
  const timestamp = options.now?.() ?? new Date().toISOString();
  await auditAppleNotesFolderUnlocked(options);
  let manifest = (await loadManifest(paths.manifest))!;
  const hasOcrCandidate =
    ocr &&
    manifest.notes.some(
      (note) =>
        note.exportStatus !== 'missing' &&
        !note.locked &&
        note.attachmentRecords.some((attachment) => attachment.exportStatus !== 'missing'),
    );
  const ocrEngine = hasOcrCandidate
    ? (options.ocrEngineId ??
      (options.ocrRunner
        ? `${APPLE_NOTES_OCR_ENGINE};custom-runner`
        : await getDefaultOcrEngineId()))
    : null;
  manifest = AppleNotesIntakeManifestSchema.parse({
    ...manifest,
    acknowledgement,
  });
  await writeJsonAtomic(paths.manifest, manifest);
  await Promise.all([
    mkdir(paths.inbox, { recursive: true, mode: 0o700 }),
    mkdir(paths.privateRoot, { recursive: true, mode: 0o700 }),
  ]);
  await chmod(paths.privateRoot, 0o700);

  const priorHashOwner = new Map<string, string>();
  for (const note of manifest.notes) {
    for (const attachment of note.attachmentRecords) {
      if (attachment.sha256 && !priorHashOwner.has(attachment.sha256)) {
        priorHashOwner.set(attachment.sha256, attachment.id);
      }
    }
  }

  let exported = 0;
  let unchanged = 0;
  let quarantined = 0;
  let compositeFilesQueued = 0;
  const nextNotes: AppleNotesNoteRecord[] = [];
  const auditedNotes = manifest.notes;
  const checkpoint = async (index: number): Promise<void> => {
    manifest = AppleNotesIntakeManifestSchema.parse({
      ...manifest,
      lastSynchronizedAt: timestamp,
      acknowledgement,
      notes: [...nextNotes, ...auditedNotes.slice(index + 1)],
    });
    await writeJsonAtomic(paths.manifest, manifest);
    await options.onNoteCheckpoint?.(auditedNotes[index]!.id, index + 1);
  };
  for (const [index, note] of auditedNotes.entries()) {
    if (note.exportStatus === 'missing') {
      nextNotes.push(note);
      await checkpoint(index);
      continue;
    }
    if (note.locked) {
      nextNotes.push(
        AppleNotesNoteRecordSchema.parse({
          ...note,
          exportStatus: 'quarantined',
          error: 'Locked Apple Note was retained as metadata only.',
        }),
      );
      quarantined += 1;
      await checkpoint(index);
      continue;
    }
    if (
      ['exported', 'unchanged'].includes(note.exportStatus) &&
      note.compositeHash &&
      note.sourceDocumentId
    ) {
      nextNotes.push(
        AppleNotesNoteRecordSchema.parse({ ...note, exportStatus: 'unchanged', error: null }),
      );
      unchanged += 1;
      await checkpoint(index);
      continue;
    }

    const noteDirectory = noteDirectoryFor(paths, note);
    const latestAttachmentRecords = [...note.attachmentRecords];
    try {
      await safeResetDerivedDirectory(paths.privateRoot, noteDirectory);
      const exportReceipt = await provider.exportNote({
        folderName: options.folderName,
        providerNoteId: note.providerNoteId,
        destinationDirectory: noteDirectory,
      });
      if (
        exportReceipt.providerNoteId !== note.providerNoteId ||
        exportReceipt.modifiedAtProvider !== note.modifiedAtProvider ||
        !sameAttachmentSnapshot(exportReceipt.attachmentMetadata, note)
      ) {
        throw new Error(
          'Apple Note changed between metadata audit and export; the note was retained for a clean retry.',
        );
      }
      await Promise.all(
        ['title.txt', 'plaintext.txt', 'body.html'].map(async (filename) => {
          const path = join(noteDirectory, filename);
          await assertPrivateRegularFile(paths.privateRoot, path);
          await chmod(path, 0o600);
        }),
      );
      for (const [attachmentIndex, attachment] of note.attachmentRecords.entries()) {
        if (attachment.exportStatus === 'missing') continue;
        const exportedAttachment = exportReceipt.attachmentMetadata.find(
          (candidate) => candidate.providerAttachmentId === attachment.providerAttachmentId,
        );
        if (exportedAttachment?.exportSucceeded === false) {
          const attachmentPath = join(
            noteDirectory,
            `attachment-${attachment.ordinal.toString().padStart(4, '0')}.bin`,
          );
          await rm(attachmentPath, { force: true });
          await rm(`${attachmentPath}.ocr.txt`, { force: true });
          latestAttachmentRecords[attachmentIndex] = AppleNotesAttachmentRecordSchema.parse({
            ...attachment,
            exportStatus: 'quarantined',
            relativePath: null,
            mediaType: null,
            sizeBytes: null,
            sha256: null,
            duplicateOfId: null,
            ocrStatus: ocr ? 'failed' : 'not_requested',
            ocrEngine,
            ocrTextHash: null,
            error: 'Notes could not export this attachment through its public scripting interface.',
          });
          continue;
        }
        latestAttachmentRecords[attachmentIndex] = await processAttachment({
          paths,
          noteDirectory,
          attachment,
          priorHashOwner,
          ocr,
          ocrEngine,
          ocrRunner,
        });
      }
      const composite = await buildComposite(noteDirectory, latestAttachmentRecords);
      if (!composite.hasReviewableText) {
        throw new Error('Apple Note and local OCR produced no reviewable text.');
      }
      const compositeHash = sha256(composite.bytes);
      const filename = `${note.id}.${compositeHash.slice(0, 16)}.md`;
      const inboxPath = join(paths.inbox, filename);
      if (await fileExists(inboxPath)) {
        if ((await sha256File(inboxPath)) !== compositeHash) {
          throw new Error('Existing Apple Notes source-queue file failed its SHA-256 check.');
        }
      } else {
        await writeFile(inboxPath, composite.bytes, { mode: 0o600 });
        compositeFilesQueued += 1;
      }
      nextNotes.push(
        AppleNotesNoteRecordSchema.parse({
          ...note,
          exportStatus: 'exported',
          titleHash: composite.titleHash,
          plaintextHash: composite.plaintextHash,
          htmlHash: composite.htmlHash,
          compositeHash,
          compositeInboxFilename: filename,
          sourceDocumentId: `source-document.${compositeHash.slice(0, 20)}`,
          attachmentRecords: latestAttachmentRecords,
          error: null,
        }),
      );
      exported += 1;
    } catch (caught) {
      nextNotes.push(
        AppleNotesNoteRecordSchema.parse({
          ...note,
          exportStatus: 'quarantined',
          attachmentRecords: latestAttachmentRecords,
          error: (caught instanceof Error ? caught.message : 'Unknown note export failure').slice(
            0,
            1000,
          ),
        }),
      );
      quarantined += 1;
    }
    await checkpoint(index);
  }
  manifest = AppleNotesIntakeManifestSchema.parse({
    ...manifest,
    lastSynchronizedAt: timestamp,
    acknowledgement,
    notes: nextNotes,
  });
  await writeJsonAtomic(paths.manifest, manifest);
  const attachments = manifest.notes.flatMap((note) =>
    note.attachmentRecords.filter((attachment) => attachment.exportStatus !== 'missing'),
  );
  return {
    folderName: manifest.folderName,
    notes: manifest.notes.filter((note) => note.exportStatus !== 'missing').length,
    attachments: attachments.length,
    lockedNotes: manifest.notes.filter((note) => note.locked).length,
    sharedNotes: manifest.notes.filter((note) => note.shared).length,
    manifestPath: paths.manifest,
    exported,
    unchanged,
    quarantined,
    attachmentQuarantined: attachments.filter(
      (attachment) => attachment.exportStatus === 'quarantined',
    ).length,
    ocrCompleted: attachments.filter((attachment) => attachment.ocrStatus === 'completed').length,
    ocrEmpty: attachments.filter((attachment) => attachment.ocrStatus === 'empty').length,
    ocrUnsupported: attachments.filter((attachment) => attachment.ocrStatus === 'unsupported')
      .length,
    ocrFailed: attachments.filter((attachment) => attachment.ocrStatus === 'failed').length,
    compositeFilesQueued,
  };
};

export const syncAppleNotesFolder = async (
  options: AppleNotesSyncOptions,
): Promise<AppleNotesSyncReport> => {
  const paths = pathsFor(options.sourceRoot);
  return withManifestLock(paths.manifest, () => syncAppleNotesFolderUnlocked(options));
};

export const validateAppleNotesManifest = async (
  sourceRoot = DEFAULT_SOURCE_ROOT,
): Promise<AppleNotesIntakeManifest | null> => {
  const paths = pathsFor(sourceRoot);
  const manifest = await loadManifest(paths.manifest);
  if (!manifest) return null;
  const sourceManifest = await loadSourceManifest(paths.root);
  const noteIds = new Set<string>();
  const providerNoteIds = new Set<string>();
  const attachmentIds = new Set<string>();
  const providerAttachmentIds = new Set<string>();
  const attachmentsById = new Map<string, AppleNotesAttachmentRecord>();
  for (const note of manifest.notes) {
    if (noteIds.has(note.id)) throw new Error(`Duplicate Apple Notes note record: ${note.id}`);
    noteIds.add(note.id);
    if (providerNoteIds.has(note.providerNoteId)) {
      throw new Error(`Duplicate Apple Notes provider note ID in ${note.id}.`);
    }
    providerNoteIds.add(note.providerNoteId);
    const activeOrdinals = new Set<number>();
    for (const attachment of note.attachmentRecords) {
      if (attachmentIds.has(attachment.id)) {
        throw new Error(`Duplicate Apple Notes attachment record: ${attachment.id}`);
      }
      attachmentIds.add(attachment.id);
      attachmentsById.set(attachment.id, attachment);
      if (providerAttachmentIds.has(attachment.providerAttachmentId)) {
        throw new Error(`Duplicate Apple Notes provider attachment ID in ${note.id}.`);
      }
      providerAttachmentIds.add(attachment.providerAttachmentId);
      if (attachment.exportStatus !== 'missing') {
        if (activeOrdinals.has(attachment.ordinal)) {
          throw new Error(`Duplicate active Apple Notes attachment ordinal in ${note.id}.`);
        }
        activeOrdinals.add(attachment.ordinal);
      }
      if (attachment.relativePath) {
        const privatePath = resolve(paths.root, attachment.relativePath);
        if (!pathInside(paths.privateRoot, privatePath)) {
          throw new Error(`${attachment.id} points outside the protected Apple Notes root.`);
        }
        await assertPrivateRegularFile(paths.privateRoot, privatePath);
        if (attachment.sha256 !== (await sha256File(privatePath))) {
          throw new Error(`${attachment.id} no longer matches its recorded SHA-256.`);
        }
      }
      if (attachment.ocrStatus === 'completed') {
        if (!attachment.relativePath || !attachment.ocrTextHash || !attachment.ocrEngine) {
          throw new Error(`${attachment.id} has incomplete completed-OCR provenance.`);
        }
        const ocrPath = `${resolve(paths.root, attachment.relativePath)}.ocr.txt`;
        await assertPrivateRegularFile(paths.privateRoot, ocrPath);
        if ((await sha256File(ocrPath)) !== attachment.ocrTextHash) {
          throw new Error(`${attachment.id} OCR text no longer matches its recorded SHA-256.`);
        }
      }
    }
    if (['exported', 'unchanged'].includes(note.exportStatus)) {
      if (
        !manifest.acknowledgement ||
        !note.titleHash ||
        !note.plaintextHash ||
        !note.htmlHash ||
        !note.compositeHash ||
        !note.compositeInboxFilename ||
        !note.sourceDocumentId
      ) {
        throw new Error(`${note.id} has incomplete acknowledged export provenance.`);
      }
      const noteDirectory = noteDirectoryFor(paths, note);
      const titlePath = join(noteDirectory, 'title.txt');
      const plaintextPath = join(noteDirectory, 'plaintext.txt');
      const htmlPath = join(noteDirectory, 'body.html');
      await Promise.all(
        [titlePath, plaintextPath, htmlPath].map((path) =>
          assertPrivateRegularFile(paths.privateRoot, path),
        ),
      );
      const [titleHash, plaintextHash, htmlHash] = await Promise.all([
        sha256File(titlePath),
        sha256File(plaintextPath),
        sha256File(htmlPath),
      ]);
      if (
        titleHash !== note.titleHash ||
        plaintextHash !== note.plaintextHash ||
        htmlHash !== note.htmlHash
      ) {
        throw new Error(`${note.id} private note export no longer matches its recorded hashes.`);
      }
      const composite = await buildComposite(noteDirectory, note.attachmentRecords);
      if (!composite.hasReviewableText || sha256(composite.bytes) !== note.compositeHash) {
        throw new Error(`${note.id} deterministic composite no longer matches its recorded hash.`);
      }
      const expectedSourceDocumentId = `source-document.${note.compositeHash.slice(0, 20)}`;
      if (note.sourceDocumentId !== expectedSourceDocumentId) {
        throw new Error(`${note.id} has an invalid source-document relationship.`);
      }
      const inboxPath = join(paths.inbox, note.compositeInboxFilename);
      if (await fileExists(inboxPath)) {
        if ((await sha256File(inboxPath)) !== note.compositeHash) {
          throw new Error(`${note.id} queued composite failed its SHA-256 check.`);
        }
      } else {
        const sourceEntry = sourceManifest.entries.find(
          (entry) =>
            entry.filename === note.compositeInboxFilename && entry.sha256 === note.compositeHash,
        );
        if (!sourceEntry) {
          throw new Error(`${note.id} composite is absent from both inbox and source manifest.`);
        }
      }
    }
  }
  for (const attachment of attachmentsById.values()) {
    if (attachment.duplicateOfId) {
      if (attachment.duplicateOfId === attachment.id) {
        throw new Error(`${attachment.id} cannot duplicate itself.`);
      }
      if (!attachmentsById.has(attachment.duplicateOfId)) {
        throw new Error(`${attachment.id} has an unknown duplicate attachment target.`);
      }
    }
  }
  return manifest;
};
