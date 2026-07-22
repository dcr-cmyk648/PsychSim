import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';

import {
  SourceChunkSchema,
  SourceDocumentSchema,
  SourceManifestEntrySchema,
  SourceManifestSchema,
  type SourceChunk,
  type SourceDocument,
  type SourceManifest,
  type SourceManifestEntry,
} from '@psychsim/schemas';

export const SOURCE_PARSER_VERSION = 'psychsim-source-parser-1';
export const DEFAULT_SOURCE_ROOT = resolve('content/source-docs');
const MAX_SOURCE_BYTES = 50 * 1024 * 1024;
const MAX_CHUNK_CHARACTERS = 6_000;

export interface SourcePipelineOptions {
  root?: string;
  now?: () => string;
}

export interface SourceScanReport {
  discovered: number;
  duplicates: number;
  quarantined: number;
  unchanged: number;
  manifestPath: string;
}

export interface SourceExtractionReport {
  extracted: number;
  archivedDuplicates: number;
  quarantined: number;
  manifestPath: string;
}

interface SourcePaths {
  root: string;
  inbox: string;
  processed: string;
  archive: string;
  quarantine: string;
  extracted: string;
  manifests: string;
  manifest: string;
}

interface ExtractedPiece {
  text: string;
  page?: number;
  section?: string;
}

const sourcePaths = (root = DEFAULT_SOURCE_ROOT): SourcePaths => ({
  root,
  inbox: join(root, 'inbox'),
  processed: join(root, 'processed'),
  archive: join(root, 'archive'),
  quarantine: join(root, 'quarantine'),
  extracted: join(root, 'extracted'),
  manifests: join(root, 'manifests'),
  manifest: join(root, 'manifests', 'source-manifest.json'),
});

const sha256 = (value: Uint8Array | string): string =>
  createHash('sha256').update(value).digest('hex');

const nowIso = (options: SourcePipelineOptions): string =>
  options.now?.() ?? new Date().toISOString();

const mediaTypeFor = (filename: string): string => {
  switch (extname(filename).toLocaleLowerCase()) {
    case '.pdf':
      return 'application/pdf';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.txt':
      return 'text/plain';
    case '.md':
    case '.markdown':
      return 'text/markdown';
    default:
      return 'application/octet-stream';
  }
};

const manifestEntryId = (hash: string, filename: string): string =>
  `source-manifest.${hash.slice(0, 18)}.${sha256(filename.toLocaleLowerCase()).slice(0, 8)}`;

const sourceDocumentId = (hash: string): string => `source-document.${hash.slice(0, 20)}`;

const retainedFilename = (entry: SourceManifestEntry): string =>
  `${entry.id}--${basename(entry.filename)}`;

const exists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const ensureFolders = async (paths: SourcePaths): Promise<void> => {
  await Promise.all(
    [
      paths.inbox,
      paths.processed,
      paths.archive,
      paths.quarantine,
      paths.extracted,
      paths.manifests,
    ].map((path) => mkdir(path, { recursive: true })),
  );
};

const emptyManifest = (timestamp: string): SourceManifest =>
  SourceManifestSchema.parse({
    schemaVersion: 1,
    manifestVersion: 1,
    parserVersion: SOURCE_PARSER_VERSION,
    updatedAt: timestamp,
    entries: [],
  });

export const loadSourceManifest = async (
  root = DEFAULT_SOURCE_ROOT,
  timestamp = new Date().toISOString(),
): Promise<SourceManifest> => {
  const path = sourcePaths(root).manifest;
  try {
    return SourceManifestSchema.parse(JSON.parse(await readFile(path, 'utf8')) as unknown);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyManifest(timestamp);
    throw error;
  }
};

const writeJsonAtomic = async (path: string, value: unknown): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  await rename(temporaryPath, path);
};

const writeManifest = async (
  paths: SourcePaths,
  entries: readonly SourceManifestEntry[],
  timestamp: string,
): Promise<SourceManifest> => {
  const manifest = SourceManifestSchema.parse({
    schemaVersion: 1,
    manifestVersion: 1,
    parserVersion: SOURCE_PARSER_VERSION,
    updatedAt: timestamp,
    entries,
  });
  await writeJsonAtomic(paths.manifest, manifest);
  return manifest;
};

const moveRetained = async (
  sourcePath: string,
  destinationDirectory: string,
  entry: SourceManifestEntry,
): Promise<void> => {
  if (!(await exists(sourcePath))) return;
  await mkdir(destinationDirectory, { recursive: true });
  const destination = join(destinationDirectory, retainedFilename(entry));
  if (await exists(destination)) return;
  await rename(sourcePath, destination);
};

export const scanSourceInbox = async (
  options: SourcePipelineOptions = {},
): Promise<SourceScanReport> => {
  const paths = sourcePaths(options.root);
  await ensureFolders(paths);
  const timestamp = nowIso(options);
  const manifest = await loadSourceManifest(paths.root, timestamp);
  const entries = [...manifest.entries];
  let discovered = 0;
  let duplicates = 0;
  let quarantined = 0;
  let unchanged = 0;
  const directoryEntries = await readdir(paths.inbox, { withFileTypes: true });

  for (const directoryEntry of directoryEntries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    if (directoryEntry.name.startsWith('.') || !directoryEntry.isFile()) continue;
    const path = join(paths.inbox, directoryEntry.name);
    const fileStat = await stat(path);
    const bytes = await readFile(path);
    const hash = sha256(bytes);
    const existingExact = entries.find(
      (entry) => entry.sha256 === hash && entry.filename === directoryEntry.name,
    );
    if (existingExact) {
      unchanged += 1;
      if (existingExact.status === 'extracted') {
        await moveRetained(path, paths.processed, existingExact);
      } else if (existingExact.status === 'duplicate') {
        await moveRetained(path, paths.archive, existingExact);
      } else if (existingExact.status === 'quarantined') {
        await moveRetained(path, paths.quarantine, existingExact);
      }
      continue;
    }

    const duplicateOf = entries.find(
      (entry) => entry.sha256 === hash && entry.status !== 'duplicate',
    );
    const mediaType = mediaTypeFor(directoryEntry.name);
    const unsupported = mediaType === 'application/octet-stream';
    const tooLarge = fileStat.size > MAX_SOURCE_BYTES;
    const status = duplicateOf
      ? 'duplicate'
      : unsupported || tooLarge
        ? 'quarantined'
        : 'discovered';
    const error = unsupported
      ? `Unsupported source type: ${extname(directoryEntry.name) || '(no extension)'}`
      : tooLarge
        ? `Source exceeds the ${MAX_SOURCE_BYTES.toLocaleString()} byte safety limit.`
        : undefined;
    const entry = SourceManifestEntrySchema.parse({
      schemaVersion: 1,
      id: manifestEntryId(hash, directoryEntry.name),
      filename: directoryEntry.name,
      mediaType,
      sha256: hash,
      sizeBytes: fileStat.size,
      parserVersion: SOURCE_PARSER_VERSION,
      status,
      duplicateOfId: duplicateOf?.id ?? null,
      discoveredAt: timestamp,
      updatedAt: timestamp,
      ...(error ? { error } : {}),
    });
    entries.push(entry);
    if (status === 'duplicate') duplicates += 1;
    else if (status === 'quarantined') quarantined += 1;
    else discovered += 1;

    if (status === 'duplicate') await moveRetained(path, paths.archive, entry);
    if (status === 'quarantined') await moveRetained(path, paths.quarantine, entry);
  }

  await writeManifest(paths, entries, timestamp);
  return { discovered, duplicates, quarantined, unchanged, manifestPath: paths.manifest };
};

const normalizeExtractedText = (value: string): string =>
  value
    .replaceAll('\u0000', '')
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();

const splitLongText = (
  text: string,
  context: Omit<ExtractedPiece, 'text'> = {},
): ExtractedPiece[] => {
  const normalized = normalizeExtractedText(text);
  if (!normalized) return [];
  const paragraphs = normalized.split(/\n\s*\n/);
  const pieces: ExtractedPiece[] = [];
  let current = '';
  const flush = (): void => {
    if (!current.trim()) return;
    pieces.push({ ...context, text: current.trim() });
    current = '';
  };
  for (const paragraph of paragraphs) {
    if (paragraph.length > MAX_CHUNK_CHARACTERS) {
      flush();
      for (let offset = 0; offset < paragraph.length; offset += MAX_CHUNK_CHARACTERS) {
        pieces.push({ ...context, text: paragraph.slice(offset, offset + MAX_CHUNK_CHARACTERS) });
      }
      continue;
    }
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length > MAX_CHUNK_CHARACTERS) flush();
    current = current ? `${current}\n\n${paragraph}` : paragraph;
  }
  flush();
  return pieces;
};

const extractPdf = async (bytes: Buffer): Promise<ExtractedPiece[]> => {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const document = await getDocument({
    data: new Uint8Array(bytes),
    disableFontFace: true,
    isEvalSupported: false,
    useWorkerFetch: false,
  }).promise;
  const pieces: ExtractedPiece[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .filter(Boolean)
        .join(' ');
      pieces.push(...splitLongText(text, { page: pageNumber }));
    }
  } finally {
    await document.destroy();
  }
  return pieces;
};

const extractDocx = async (bytes: Buffer): Promise<ExtractedPiece[]> => {
  const { extractRawText } = await import('mammoth');
  const result = await extractRawText({ buffer: bytes });
  return splitLongText(result.value);
};

const extractMarkdown = (bytes: Buffer): ExtractedPiece[] => {
  const text = bytes.toString('utf8');
  const lines = text.split(/\r?\n/);
  const sections: ExtractedPiece[] = [];
  let heading: string | undefined;
  let sectionLines: string[] = [];
  const flush = (): void => {
    sections.push(...splitLongText(sectionLines.join('\n'), heading ? { section: heading } : {}));
    sectionLines = [];
  };
  for (const line of lines) {
    const match = /^(#{1,6})\s+(.+)$/.exec(line);
    if (match) {
      flush();
      heading = match[2]?.trim();
    } else {
      sectionLines.push(line);
    }
  }
  flush();
  return sections;
};

const extractPieces = async (
  entry: SourceManifestEntry,
  bytes: Buffer,
): Promise<ExtractedPiece[]> => {
  switch (entry.mediaType) {
    case 'application/pdf':
      return extractPdf(bytes);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractDocx(bytes);
    case 'text/markdown':
      return extractMarkdown(bytes);
    case 'text/plain':
      return splitLongText(bytes.toString('utf8'));
    default:
      throw new Error(`No parser registered for ${entry.mediaType}.`);
  }
};

const sourcePathForEntry = async (
  paths: SourcePaths,
  entry: SourceManifestEntry,
): Promise<string | null> => {
  const inboxPath = join(paths.inbox, entry.filename);
  if (await exists(inboxPath)) return inboxPath;
  const processedPath = join(paths.processed, retainedFilename(entry));
  if (await exists(processedPath)) return processedPath;
  return null;
};

export const extractDiscoveredSources = async (
  options: SourcePipelineOptions = {},
): Promise<SourceExtractionReport> => {
  const paths = sourcePaths(options.root);
  await ensureFolders(paths);
  const timestamp = nowIso(options);
  let manifest = await loadSourceManifest(paths.root, timestamp);
  let entries = [...manifest.entries];
  let extracted = 0;
  let archivedDuplicates = 0;
  let quarantined = 0;

  for (const originalEntry of entries) {
    let entry = entries.find((candidate) => candidate.id === originalEntry.id)!;
    if (entry.status === 'duplicate') {
      const path = await sourcePathForEntry(paths, entry);
      if (path) await moveRetained(path, paths.archive, entry);
      archivedDuplicates += 1;
      continue;
    }
    if (!['discovered', 'extracting'].includes(entry.status)) continue;
    const sourcePath = await sourcePathForEntry(paths, entry);
    if (!sourcePath) {
      entry = SourceManifestEntrySchema.parse({
        ...entry,
        status: 'quarantined',
        updatedAt: timestamp,
        error: 'Source bytes are missing from both inbox and processed storage.',
      });
      entries = entries.map((candidate) => (candidate.id === entry.id ? entry : candidate));
      quarantined += 1;
      continue;
    }

    entry = SourceManifestEntrySchema.parse({
      ...entry,
      status: 'extracting',
      updatedAt: timestamp,
      error: undefined,
    });
    entries = entries.map((candidate) => (candidate.id === entry.id ? entry : candidate));
    manifest = await writeManifest(paths, entries, timestamp);

    try {
      const bytes = await readFile(sourcePath);
      if (sha256(bytes) !== entry.sha256) throw new Error('Source hash changed after scanning.');
      const pieces = await extractPieces(entry, bytes);
      if (pieces.length === 0) throw new Error('Parser produced no extractable text.');
      const combinedHash = sha256(pieces.map((piece) => piece.text).join('\n\n'));
      const documentId = sourceDocumentId(entry.sha256);
      const document: SourceDocument = SourceDocumentSchema.parse({
        schemaVersion: 1,
        id: documentId,
        sourceManifestEntryId: entry.id,
        mediaType: entry.mediaType,
        extractedTextHash: combinedHash,
        parserVersion: SOURCE_PARSER_VERSION,
        processedAt: timestamp,
      });
      const chunks: SourceChunk[] = pieces.map((piece, ordinal) =>
        SourceChunkSchema.parse({
          schemaVersion: 1,
          id: `source-chunk.${entry.sha256.slice(0, 20)}.${ordinal + 1}`,
          sourceDocumentId: documentId,
          ordinal,
          ...(piece.page ? { page: piece.page } : {}),
          ...(piece.section ? { section: piece.section } : {}),
          text: piece.text,
          textHash: sha256(piece.text),
        }),
      );
      await writeJsonAtomic(join(paths.extracted, `${documentId}.json`), {
        schemaVersion: 1,
        document,
        chunks,
      });
      await moveRetained(sourcePath, paths.processed, entry);
      entry = SourceManifestEntrySchema.parse({
        ...entry,
        status: 'extracted',
        updatedAt: timestamp,
        error: undefined,
      });
      entries = entries.map((candidate) => (candidate.id === entry.id ? entry : candidate));
      extracted += 1;
    } catch (error) {
      await moveRetained(sourcePath, paths.quarantine, entry);
      entry = SourceManifestEntrySchema.parse({
        ...entry,
        status: 'quarantined',
        updatedAt: timestamp,
        error: (error instanceof Error ? error.message : 'Unknown extraction error').slice(0, 1000),
      });
      entries = entries.map((candidate) => (candidate.id === entry.id ? entry : candidate));
      quarantined += 1;
    }
  }

  await writeManifest(paths, entries, timestamp);
  return { extracted, archivedDuplicates, quarantined, manifestPath: paths.manifest };
};

export const listExtractedSourceArtifacts = async (
  root = DEFAULT_SOURCE_ROOT,
): Promise<string[]> => {
  const directory = sourcePaths(root).extracted;
  await mkdir(directory, { recursive: true });
  return (await readdir(directory))
    .filter((filename) => filename.startsWith('source-document.') && filename.endsWith('.json'))
    .map((filename) => join(directory, filename))
    .sort();
};
