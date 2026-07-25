import { createHash } from 'node:crypto';
import {
  access,
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

import {
  AppleNotesCodexReviewAcknowledgementSchema,
  AppleNotesCodexReviewAuditEntrySchema,
  AppleNotesCodexReviewAuditManifestSchema,
  AppleNotesCodexReviewPacketSchema,
  type AppleNotesCodexReviewAcknowledgement,
  type AppleNotesCodexReviewAuditManifest,
  type AppleNotesCodexReviewPacket,
  type AppleNotesNoteRecord,
} from '@psychsim/schemas';

import {
  loadAppleNotesIntakeManifestMetadata,
  readAppleNotesTitlePlaintextSnapshot,
} from './apple-notes-provider';
import { DEFAULT_SOURCE_ROOT } from './source-pipeline';

export const APPLE_NOTES_CODEX_REVIEW_MAX_TITLE_BYTES = 2_048;
export const APPLE_NOTES_CODEX_REVIEW_MAX_SEGMENT_BYTES = 8_192;
export const APPLE_NOTES_CODEX_REVIEW_MAX_PACKET_BYTES = 12_288;
export const APPLE_NOTES_CODEX_REVIEW_MAX_PLAINTEXT_BYTES = 5 * 1024 * 1024;
export const APPLE_NOTES_CODEX_REVIEW_MAX_SEGMENT_COUNT = 2_048;

const REVIEW_BRIDGE_VERSION = 'psychsim-apple-notes-codex-review-1' as const;
const SEGMENTER_VERSION = 'psychsim-utf8-segmenter-1' as const;
const MAX_JSON_TITLE_BYTES = 3_072;
const MAX_JSON_SEGMENT_BYTES = 5_600;

export type AppleNotesCodexReviewSelector =
  | { kind: 'next' }
  | { kind: 'exact'; noteId: string; segmentOrdinal: number };

export interface PrepareAppleNotesCodexReviewOptions {
  selector: AppleNotesCodexReviewSelector;
  acknowledgement: AppleNotesCodexReviewAcknowledgement;
  sourceRoot?: string;
  now?: () => string;
}

export interface AppleNotesCodexReviewPreparationReport {
  packetId: string;
  packetPath: string;
  packetSha256: string;
  auditPath: string;
  noteRecordId: string;
  segmentOrdinal: number;
  segmentCount: number;
  reused: boolean;
}

const sha256 = (value: Uint8Array | string): string =>
  createHash('sha256').update(value).digest('hex');

const byteLength = (value: string): number => Buffer.byteLength(value, 'utf8');

const pathsFor = (sourceRoot = DEFAULT_SOURCE_ROOT) => {
  const root = resolve(sourceRoot);
  const reviewRoot = join(root, 'extracted', 'apple-notes-private', 'codex-review');
  return {
    root,
    reviewRoot,
    packets: join(reviewRoot, 'packets'),
    audit: join(root, 'manifests', 'apple-notes-codex-review-audit.json'),
  };
};

const pathInside = (parent: string, child: string): boolean => {
  const relation = relative(resolve(parent), resolve(child));
  return relation !== '' && !relation.startsWith('..') && !isAbsolute(relation);
};

const pathInsideOrEqual = (parent: string, child: string): boolean =>
  resolve(parent) === resolve(child) || pathInside(parent, child);

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const serializeJson = (value: unknown): Buffer =>
  Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8');

const stableJson = (value: unknown): string => {
  const normalize = (candidate: unknown): unknown => {
    if (Array.isArray(candidate)) return candidate.map(normalize);
    if (candidate && typeof candidate === 'object') {
      return Object.fromEntries(
        Object.entries(candidate as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, nested]) => [key, normalize(nested)]),
      );
    }
    return candidate;
  };
  return JSON.stringify(normalize(value));
};

const ensureDirectoryChain = async (
  root: string,
  target: string,
  createMissing: boolean,
): Promise<boolean> => {
  const resolvedRoot = resolve(root);
  const resolvedTarget = resolve(target);
  if (!pathInsideOrEqual(resolvedRoot, resolvedTarget)) {
    throw new Error('Apple Notes Codex review path resolves outside the source root.');
  }
  const rootStat = await lstat(resolvedRoot);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error('Apple Notes source root must be a real directory.');
  }
  let current = resolvedRoot;
  const relation = relative(resolvedRoot, resolvedTarget);
  for (const component of relation ? relation.split('/') : []) {
    current = join(current, component);
    try {
      const currentStat = await lstat(current);
      if (!currentStat.isDirectory() || currentStat.isSymbolicLink()) {
        throw new Error(
          'Apple Notes Codex review protected path contains a non-directory or symlink.',
        );
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      if (!createMissing) return false;
      await mkdir(current, { mode: 0o700 });
    }
  }
  const realRoot = await realpath(resolvedRoot);
  const realTarget = await realpath(resolvedTarget);
  if (!pathInsideOrEqual(realRoot, realTarget)) {
    throw new Error('Apple Notes Codex review protected path escapes the source root.');
  }
  return true;
};

const prepareProtectedDirectories = async (paths: ReturnType<typeof pathsFor>): Promise<void> => {
  await ensureDirectoryChain(paths.root, dirname(paths.audit), true);
  await ensureDirectoryChain(paths.root, paths.reviewRoot, true);
  await ensureDirectoryChain(paths.root, paths.packets, true);
  await chmod(paths.reviewRoot, 0o700);
  await chmod(paths.packets, 0o700);
};

const writePrivateAtomic = async (path: string, bytes: Uint8Array): Promise<void> => {
  const parentStat = await lstat(dirname(path));
  if (!parentStat.isDirectory() || parentStat.isSymbolicLink()) {
    throw new Error('Apple Notes Codex review destination parent is not a real directory.');
  }
  const temporaryDirectory = await mkdtemp(join(dirname(path), '.codex-review-write-'));
  await chmod(temporaryDirectory, 0o700);
  const temporaryPath = join(temporaryDirectory, 'payload.json');
  try {
    await writeFile(temporaryPath, bytes, { mode: 0o600 });
    await rename(temporaryPath, path);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
  await chmod(path, 0o600);
};

const withAuditLock = async <T>(auditPath: string, operation: () => Promise<T>): Promise<T> => {
  const lockPath = `${auditPath}.lock`;
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
        throw new Error('Apple Notes Codex review preparation is already running.');
      }
      let ownerPid: number | null = null;
      try {
        const lockStat = await lstat(lockPath);
        if (!lockStat.isFile() || lockStat.isSymbolicLink() || (lockStat.mode & 0o777) !== 0o600) {
          throw new Error('The Apple Notes Codex review lock is not a private regular file.');
        }
        const record = JSON.parse(await readFile(lockPath, 'utf8')) as { pid?: unknown };
        ownerPid =
          typeof record.pid === 'number' && Number.isInteger(record.pid) ? record.pid : null;
      } catch (lockError) {
        if (
          lockError instanceof Error &&
          lockError.message.includes('not a private regular file')
        ) {
          throw lockError;
        }
        ownerPid = null;
      }
      if (ownerPid === null) {
        throw new Error(
          'The Apple Notes Codex review lock is incomplete; verify no preparation is running before removing it.',
        );
      }
      try {
        process.kill(ownerPid, 0);
        throw new Error(
          `Apple Notes Codex review preparation is already running as process ${ownerPid}.`,
        );
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

const loadAudit = async (path: string): Promise<AppleNotesCodexReviewAuditManifest | null> => {
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  try {
    return AppleNotesCodexReviewAuditManifestSchema.parse(JSON.parse(text) as unknown);
  } catch {
    throw new Error('Apple Notes Codex review audit has invalid private JSON/schema.');
  }
};

const eligibleNote = (
  note: AppleNotesNoteRecord,
): note is AppleNotesNoteRecord & {
  titleHash: string;
  plaintextHash: string;
  sourceDocumentId: string;
} =>
  !note.locked &&
  ['exported', 'unchanged'].includes(note.exportStatus) &&
  Boolean(note.titleHash && note.plaintextHash && note.sourceDocumentId);

const packetIdFor = (packet: Omit<AppleNotesCodexReviewPacket, 'id'>): string =>
  `apple-notes-codex-review.${sha256(stableJson(packet)).slice(0, 24)}`;

const packetWithoutId = (
  note: AppleNotesNoteRecord & {
    titleHash: string;
    plaintextHash: string;
    sourceDocumentId: string;
  },
  title: string,
  plaintextSegment: string,
  segmentOrdinal: number,
  segmentCount: number,
  modelIdentifier: string,
): Omit<AppleNotesCodexReviewPacket, 'id'> => ({
  schemaVersion: 1,
  packetVersion: 1,
  packetBuilderVersion: REVIEW_BRIDGE_VERSION,
  segmenterVersion: SEGMENTER_VERSION,
  sourceProvider: 'apple_notes',
  contentScope: 'title_plaintext_only',
  reviewPurpose: 'private_semantic_source_classification',
  noteRecordId: note.id,
  relatedSourceDocumentId: note.sourceDocumentId,
  sourceModifiedAtProvider: note.modifiedAtProvider,
  titleHash: note.titleHash,
  plaintextHash: note.plaintextHash,
  segmentOrdinal,
  segmentCount,
  segmentHash: sha256(plaintextSegment),
  preparedForProvider: 'openai_codex',
  modelIdentifier,
  untrustedSourceData: true,
  title,
  plaintextSegment,
});

const makePacket = (
  note: AppleNotesNoteRecord & {
    titleHash: string;
    plaintextHash: string;
    sourceDocumentId: string;
  },
  title: string,
  plaintextSegment: string,
  segmentOrdinal: number,
  segmentCount: number,
  modelIdentifier: string,
): AppleNotesCodexReviewPacket => {
  const withoutId = packetWithoutId(
    note,
    title,
    plaintextSegment,
    segmentOrdinal,
    segmentCount,
    modelIdentifier,
  );
  return AppleNotesCodexReviewPacketSchema.parse({
    id: packetIdFor(withoutId),
    ...withoutId,
  });
};

const codePointBoundaries = (value: string): number[] => {
  const boundaries = [0];
  let offset = 0;
  for (const character of value) {
    offset += character.length;
    boundaries.push(offset);
  }
  return boundaries;
};

const preferredNewlineBoundary = (candidate: string): number | null => {
  const minimumBytes = Math.floor(byteLength(candidate) * 0.6);
  const paragraph = candidate.lastIndexOf('\n\n');
  const newline = candidate.lastIndexOf('\n');
  const index = paragraph >= 0 ? paragraph + 2 : newline >= 0 ? newline + 1 : -1;
  return index > 0 && byteLength(candidate.slice(0, index)) >= minimumBytes ? index : null;
};

const splitPlaintext = (
  note: AppleNotesNoteRecord & {
    titleHash: string;
    plaintextHash: string;
    sourceDocumentId: string;
  },
  title: string,
  plaintext: string,
): string[] => {
  if (!title && !plaintext) {
    throw new Error(`${note.id} has no title/plaintext content eligible for review.`);
  }
  if (
    byteLength(title) > APPLE_NOTES_CODEX_REVIEW_MAX_TITLE_BYTES ||
    byteLength(JSON.stringify(title)) > MAX_JSON_TITLE_BYTES
  ) {
    throw new Error(`${note.id} title exceeds the private review byte limit.`);
  }
  if (byteLength(plaintext) > APPLE_NOTES_CODEX_REVIEW_MAX_PLAINTEXT_BYTES) {
    throw new Error(`${note.id} plaintext exceeds the private review input byte limit.`);
  }
  if (!plaintext) return [''];

  const segments: string[] = [];
  let remaining = plaintext;
  while (remaining.length > 0) {
    const boundaries = codePointBoundaries(remaining);
    let low = 1;
    let high = boundaries.length - 1;
    let acceptedBoundary = 0;
    while (low <= high) {
      const midpoint = Math.floor((low + high) / 2);
      const candidate = remaining.slice(0, boundaries[midpoint]);
      const rawBytes = byteLength(candidate);
      const fits =
        rawBytes <= APPLE_NOTES_CODEX_REVIEW_MAX_SEGMENT_BYTES &&
        byteLength(JSON.stringify(candidate)) <= MAX_JSON_SEGMENT_BYTES;
      if (fits) {
        acceptedBoundary = boundaries[midpoint]!;
        low = midpoint + 1;
      } else {
        high = midpoint - 1;
      }
    }
    if (acceptedBoundary === 0) {
      throw new Error(`${note.id} metadata/title leaves no room for a private review segment.`);
    }
    let boundary = acceptedBoundary;
    if (boundary < remaining.length) {
      const candidate = remaining.slice(0, boundary);
      boundary = preferredNewlineBoundary(candidate) ?? boundary;
    }
    segments.push(remaining.slice(0, boundary));
    if (segments.length > APPLE_NOTES_CODEX_REVIEW_MAX_SEGMENT_COUNT) {
      throw new Error(`${note.id} exceeds the private review segment-count limit.`);
    }
    remaining = remaining.slice(boundary);
  }

  if (segments.join('') !== plaintext) {
    throw new Error(`${note.id} deterministic title/plaintext segmentation failed.`);
  }
  return segments;
};

const selectNoteAndOrdinal = (
  notes: readonly (AppleNotesNoteRecord & {
    titleHash: string;
    plaintextHash: string;
    sourceDocumentId: string;
  })[],
  audit: AppleNotesCodexReviewAuditManifest | null,
  selector: AppleNotesCodexReviewSelector,
): {
  note: AppleNotesNoteRecord & {
    titleHash: string;
    plaintextHash: string;
    sourceDocumentId: string;
  };
  segmentOrdinal: number;
} => {
  if (selector.kind === 'exact') {
    if (!Number.isInteger(selector.segmentOrdinal) || selector.segmentOrdinal < 0) {
      throw new Error('Apple Notes Codex review segment ordinal must be a nonnegative integer.');
    }
    const note = notes.find((candidate) => candidate.id === selector.noteId);
    if (!note) throw new Error(`${selector.noteId} is not eligible for title/plaintext review.`);
    return { note, segmentOrdinal: selector.segmentOrdinal };
  }
  for (const note of notes) {
    const existing = (audit?.entries ?? []).filter(
      (entry) =>
        entry.noteRecordId === note.id &&
        entry.titleHash === note.titleHash &&
        entry.plaintextHash === note.plaintextHash &&
        entry.segmenterVersion === SEGMENTER_VERSION,
    );
    if (existing.length === 0) return { note, segmentOrdinal: 0 };
    const segmentCount = existing[0]!.segmentCount;
    const seen = new Set(existing.map((entry) => entry.segmentOrdinal));
    for (let ordinal = 0; ordinal < segmentCount; ordinal += 1) {
      if (!seen.has(ordinal)) return { note, segmentOrdinal: ordinal };
    }
  }
  throw new Error('No Apple Notes title/plaintext segment remains queued for Codex review.');
};

const assertPrivatePacketFile = async (packetsRoot: string, path: string): Promise<void> => {
  if (!pathInside(packetsRoot, path)) {
    throw new Error('Apple Notes Codex review packet resolves outside its protected directory.');
  }
  const fileStat = await lstat(path);
  if (!fileStat.isFile() || fileStat.isSymbolicLink()) {
    throw new Error('Apple Notes Codex review packet is not a private regular file.');
  }
  if ((fileStat.mode & 0o777) !== 0o600) {
    throw new Error('Apple Notes Codex review packet must have exact mode 0600.');
  }
  const resolvedRoot = await realpath(packetsRoot);
  const resolvedPath = await realpath(path);
  if (!pathInside(resolvedRoot, resolvedPath)) {
    throw new Error('Apple Notes Codex review packet resolves outside its protected directory.');
  }
};

const validateAuditUnlocked = async (
  sourceRoot = DEFAULT_SOURCE_ROOT,
  allowOrphanPackets = false,
): Promise<AppleNotesCodexReviewAuditManifest | null> => {
  const paths = pathsFor(sourceRoot);
  await ensureDirectoryChain(paths.root, dirname(paths.audit), false);
  const packetDirectoryExists = await ensureDirectoryChain(paths.root, paths.packets, false);
  if (packetDirectoryExists) {
    const reviewStat = await lstat(paths.reviewRoot);
    const packetsStat = await lstat(paths.packets);
    if ((reviewStat.mode & 0o777) !== 0o700 || (packetsStat.mode & 0o777) !== 0o700) {
      throw new Error('Apple Notes Codex review private directories must have exact mode 0700.');
    }
  }
  let auditStat: Awaited<ReturnType<typeof lstat>> | null = null;
  try {
    auditStat = await lstat(paths.audit);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  if (
    auditStat &&
    (!auditStat.isFile() || auditStat.isSymbolicLink() || (auditStat.mode & 0o777) !== 0o600)
  ) {
    throw new Error(
      'Apple Notes Codex review audit must be a private regular file with mode 0600.',
    );
  }
  const audit = await loadAudit(paths.audit);
  const packetEntries = packetDirectoryExists
    ? await readdir(paths.packets, { withFileTypes: true })
    : [];
  if (!audit) {
    if (packetEntries.length > 0 && !allowOrphanPackets) {
      throw new Error('Apple Notes Codex review packet directory contains unaudited files.');
    }
    return null;
  }
  if (!auditStat) throw new Error('Apple Notes Codex review audit disappeared during validation.');
  const entryIds = new Set<string>();
  const packetIds = new Set<string>();
  const referencedPaths = new Set<string>();
  const packetsBySourceRevision = new Map<
    string,
    Array<{ entry: (typeof audit.entries)[number]; packet: AppleNotesCodexReviewPacket }>
  >();
  for (const entry of audit.entries) {
    if (entryIds.has(entry.id)) throw new Error(`Duplicate Codex review audit entry: ${entry.id}`);
    entryIds.add(entry.id);
    if (packetIds.has(entry.packetId)) {
      throw new Error(`Duplicate Codex review packet ID: ${entry.packetId}`);
    }
    packetIds.add(entry.packetId);
    const packetPath = resolve(paths.root, entry.packetRelativePath);
    await assertPrivatePacketFile(paths.packets, packetPath);
    const bytes = await readFile(packetPath);
    if (bytes.byteLength > APPLE_NOTES_CODEX_REVIEW_MAX_PACKET_BYTES) {
      throw new Error(`${entry.packetId} exceeds the private packet byte limit.`);
    }
    if (sha256(bytes) !== entry.packetSha256) {
      throw new Error(`${entry.packetId} no longer matches its audited SHA-256.`);
    }
    let packet: AppleNotesCodexReviewPacket;
    try {
      packet = AppleNotesCodexReviewPacketSchema.parse(
        JSON.parse(bytes.toString('utf8')) as unknown,
      );
    } catch {
      throw new Error(`${entry.packetId} has invalid private packet JSON/schema.`);
    }
    if (
      packet.id !== entry.packetId ||
      packet.noteRecordId !== entry.noteRecordId ||
      packet.relatedSourceDocumentId !== entry.relatedSourceDocumentId ||
      packet.titleHash !== entry.titleHash ||
      packet.plaintextHash !== entry.plaintextHash ||
      packet.segmentOrdinal !== entry.segmentOrdinal ||
      packet.segmentCount !== entry.segmentCount ||
      packet.segmentHash !== entry.segmentHash ||
      packet.segmenterVersion !== entry.segmenterVersion ||
      packet.preparedForProvider !== entry.acknowledgement.provider ||
      packet.modelIdentifier !== entry.acknowledgement.modelIdentifier
    ) {
      throw new Error(`${entry.packetId} does not match its hash-only audit entry.`);
    }
    if (
      byteLength(packet.title) > APPLE_NOTES_CODEX_REVIEW_MAX_TITLE_BYTES ||
      byteLength(packet.plaintextSegment) > APPLE_NOTES_CODEX_REVIEW_MAX_SEGMENT_BYTES ||
      sha256(packet.title) !== packet.titleHash ||
      sha256(packet.plaintextSegment) !== packet.segmentHash
    ) {
      throw new Error(`${entry.packetId} has invalid bounded source fields.`);
    }
    const { id: parsedPacketId, ...withoutId } = packet;
    if (packetIdFor(withoutId) !== parsedPacketId) {
      throw new Error(`${entry.packetId} has an invalid deterministic packet ID.`);
    }
    referencedPaths.add(resolve(packetPath));
    const groupKey = [
      packet.noteRecordId,
      packet.titleHash,
      packet.plaintextHash,
      packet.segmenterVersion,
    ].join('\u0000');
    const group = packetsBySourceRevision.get(groupKey) ?? [];
    group.push({ entry, packet });
    packetsBySourceRevision.set(groupKey, group);
  }
  for (const group of packetsBySourceRevision.values()) {
    const segmentCounts = new Set(group.map(({ packet }) => packet.segmentCount));
    const ordinals = group.map(({ packet }) => packet.segmentOrdinal);
    if (
      segmentCounts.size !== 1 ||
      new Set(ordinals).size !== ordinals.length ||
      ordinals.some((ordinal) => ordinal < 0 || ordinal >= group[0]!.packet.segmentCount)
    ) {
      throw new Error('Apple Notes Codex review audit has an inconsistent segment group.');
    }
    const segmentCount = group[0]!.packet.segmentCount;
    if (group.length === segmentCount) {
      const ordered = [...group].sort(
        (left, right) => left.packet.segmentOrdinal - right.packet.segmentOrdinal,
      );
      const reconstructed = ordered.map(({ packet }) => packet.plaintextSegment).join('');
      if (sha256(reconstructed) !== ordered[0]!.packet.plaintextHash) {
        throw new Error(
          'Apple Notes Codex review completed segments do not match their source hash.',
        );
      }
    }
  }
  if (!allowOrphanPackets) {
    for (const directoryEntry of packetEntries) {
      const packetPath = resolve(paths.packets, directoryEntry.name);
      if (
        !directoryEntry.isFile() ||
        directoryEntry.isSymbolicLink() ||
        !directoryEntry.name.endsWith('.json') ||
        !referencedPaths.has(packetPath)
      ) {
        throw new Error('Apple Notes Codex review packet directory contains an unaudited file.');
      }
    }
  }
  return audit;
};

const assertNoUnrelatedOrphanPackets = async (
  sourceRoot: string,
  audit: AppleNotesCodexReviewAuditManifest | null,
  recoverablePacketPath: string,
): Promise<void> => {
  const paths = pathsFor(sourceRoot);
  if (!(await fileExists(paths.packets))) return;
  const referencedPaths = new Set(
    (audit?.entries ?? []).map((entry) => resolve(paths.root, entry.packetRelativePath)),
  );
  for (const entry of await readdir(paths.packets, { withFileTypes: true })) {
    const packetPath = resolve(paths.packets, entry.name);
    if (
      !entry.isFile() ||
      entry.isSymbolicLink() ||
      !entry.name.endsWith('.json') ||
      (!referencedPaths.has(packetPath) && packetPath !== resolve(recoverablePacketPath))
    ) {
      throw new Error('Apple Notes Codex review packet directory contains an unaudited file.');
    }
  }
};

export const prepareAppleNotesCodexReviewPacket = async (
  options: PrepareAppleNotesCodexReviewOptions,
): Promise<AppleNotesCodexReviewPreparationReport> => {
  const acknowledgement = AppleNotesCodexReviewAcknowledgementSchema.parse(options.acknowledgement);
  const paths = pathsFor(options.sourceRoot);
  await prepareProtectedDirectories(paths);
  return withAuditLock(paths.audit, async () => {
    const existingAudit = await validateAuditUnlocked(paths.root, true);
    const intake = await loadAppleNotesIntakeManifestMetadata(paths.root);
    if (!intake) throw new Error('No local Apple Notes intake manifest is available.');
    const notes = intake.notes
      .filter(eligibleNote)
      .sort((left, right) => left.id.localeCompare(right.id));
    const selected = selectNoteAndOrdinal(notes, existingAudit, options.selector);
    const snapshot = await readAppleNotesTitlePlaintextSnapshot(selected.note.id, paths.root);
    if (!eligibleNote(snapshot.note)) {
      throw new Error(`${selected.note.id} is not eligible for title/plaintext review.`);
    }
    if (
      snapshot.note.id !== selected.note.id ||
      snapshot.note.titleHash !== selected.note.titleHash ||
      snapshot.note.plaintextHash !== selected.note.plaintextHash ||
      snapshot.note.sourceDocumentId !== selected.note.sourceDocumentId ||
      snapshot.note.modifiedAtProvider !== selected.note.modifiedAtProvider
    ) {
      throw new Error(
        `${selected.note.id} changed while its private review packet was being prepared; retry.`,
      );
    }
    if (byteLength(snapshot.note.modifiedAtProvider) > 200) {
      throw new Error(`${selected.note.id} has over-limit provider revision metadata.`);
    }
    const segments = splitPlaintext(snapshot.note, snapshot.title, snapshot.plaintext);
    if (selected.segmentOrdinal >= segments.length) {
      throw new Error(`${selected.note.id} does not have the requested review segment.`);
    }
    const packet = makePacket(
      snapshot.note,
      snapshot.title,
      segments[selected.segmentOrdinal]!,
      selected.segmentOrdinal,
      segments.length,
      acknowledgement.modelIdentifier,
    );
    const packetBytes = serializeJson(packet);
    if (
      byteLength(packet.title) > APPLE_NOTES_CODEX_REVIEW_MAX_TITLE_BYTES ||
      byteLength(packet.plaintextSegment) > APPLE_NOTES_CODEX_REVIEW_MAX_SEGMENT_BYTES ||
      packetBytes.byteLength > APPLE_NOTES_CODEX_REVIEW_MAX_PACKET_BYTES
    ) {
      throw new Error(`${selected.note.id} failed private review packet byte limits.`);
    }
    const packetPath = join(paths.packets, `${packet.id}.json`);
    const packetSha256 = sha256(packetBytes);
    await assertNoUnrelatedOrphanPackets(paths.root, existingAudit, packetPath);
    const existingLogicalEntry = existingAudit?.entries.find(
      (entry) =>
        entry.noteRecordId === snapshot.note.id &&
        entry.titleHash === snapshot.note.titleHash &&
        entry.plaintextHash === snapshot.note.plaintextHash &&
        entry.segmenterVersion === SEGMENTER_VERSION &&
        entry.segmentOrdinal === selected.segmentOrdinal,
    );
    if (existingLogicalEntry) {
      if (existingLogicalEntry.segmentCount !== segments.length) {
        throw new Error(
          `${selected.note.id} has an inconsistent audited segment count; manual review is required.`,
        );
      }
      if (
        existingLogicalEntry.acknowledgement.modelIdentifier !== acknowledgement.modelIdentifier
      ) {
        throw new Error(
          `${selected.note.id} segment ${selected.segmentOrdinal} was already released for a different model.`,
        );
      }
      return {
        packetId: existingLogicalEntry.packetId,
        packetPath: resolve(paths.root, existingLogicalEntry.packetRelativePath),
        packetSha256: existingLogicalEntry.packetSha256,
        auditPath: paths.audit,
        noteRecordId: existingLogicalEntry.noteRecordId,
        segmentOrdinal: existingLogicalEntry.segmentOrdinal,
        segmentCount: existingLogicalEntry.segmentCount,
        reused: true,
      };
    }
    const existingEntry = existingAudit?.entries.find((entry) => entry.packetId === packet.id);
    if (existingEntry) {
      return {
        packetId: existingEntry.packetId,
        packetPath: resolve(paths.root, existingEntry.packetRelativePath),
        packetSha256: existingEntry.packetSha256,
        auditPath: paths.audit,
        noteRecordId: existingEntry.noteRecordId,
        segmentOrdinal: existingEntry.segmentOrdinal,
        segmentCount: existingEntry.segmentCount,
        reused: true,
      };
    }
    if (await fileExists(packetPath)) {
      const existingBytes = await readFile(packetPath);
      if (!existingBytes.equals(packetBytes)) {
        throw new Error(`${packet.id} exists with different private packet bytes.`);
      }
      await chmod(packetPath, 0o600);
    } else {
      await writePrivateAtomic(packetPath, packetBytes);
    }
    const releasedForReviewAt = options.now?.() ?? new Date().toISOString();
    const entry = AppleNotesCodexReviewAuditEntrySchema.parse({
      schemaVersion: 1,
      id: `apple-notes-codex-review-audit.${sha256(
        [packetSha256, acknowledgement.acknowledgedAt, acknowledgement.acknowledgedBy].join(
          '\u0000',
        ),
      ).slice(0, 24)}`,
      packetId: packet.id,
      packetRelativePath: relative(paths.root, packetPath),
      packetSha256,
      noteRecordId: packet.noteRecordId,
      relatedSourceDocumentId: packet.relatedSourceDocumentId,
      titleHash: packet.titleHash,
      plaintextHash: packet.plaintextHash,
      segmentOrdinal: packet.segmentOrdinal,
      segmentCount: packet.segmentCount,
      segmentHash: packet.segmentHash,
      segmenterVersion: packet.segmenterVersion,
      acknowledgement,
      releasedForReviewAt,
    });
    const audit = AppleNotesCodexReviewAuditManifestSchema.parse({
      schemaVersion: 1,
      manifestVersion: 1,
      provider: 'apple_notes',
      reviewBridgeVersion: REVIEW_BRIDGE_VERSION,
      updatedAt: releasedForReviewAt,
      entries: [...(existingAudit?.entries ?? []), entry],
    });
    await writePrivateAtomic(paths.audit, serializeJson(audit));
    await validateAuditUnlocked(paths.root);
    return {
      packetId: packet.id,
      packetPath,
      packetSha256,
      auditPath: paths.audit,
      noteRecordId: selected.note.id,
      segmentOrdinal: packet.segmentOrdinal,
      segmentCount: packet.segmentCount,
      reused: false,
    };
  });
};

export const validateAppleNotesCodexReviewAudit = async (
  sourceRoot = DEFAULT_SOURCE_ROOT,
): Promise<AppleNotesCodexReviewAuditManifest | null> => validateAuditUnlocked(resolve(sourceRoot));
