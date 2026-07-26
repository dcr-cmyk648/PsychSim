import { createHash, randomUUID } from 'node:crypto';
import {
  access,
  link,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
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
import { parseFragment, type DefaultTreeAdapterTypes } from 'parse5';

export const SOURCE_PARSER_VERSION = 'psychsim-source-parser-5';
export const DEFAULT_SOURCE_ROOT = resolve('content/source-docs');
const MAX_SOURCE_BYTES = 50 * 1024 * 1024;
const MAX_CHUNK_CHARACTERS = 6_000;
const LEGACY_PARSER_VERSIONS_WITHOUT_STRUCTURED_PROVENANCE = new Set([
  'psychsim-source-parser-1',
  'psychsim-source-parser-2',
]);
const LEGACY_PARSER_VERSIONS_WITHOUT_WARNING_CAPTURE = new Set([
  'psychsim-source-parser-1',
  'psychsim-source-parser-2',
  'psychsim-source-parser-3',
]);
const LEGACY_PARSER_VERSIONS_WITHOUT_WARNING_COUNT = new Set([
  ...LEGACY_PARSER_VERSIONS_WITHOUT_WARNING_CAPTURE,
  'psychsim-source-parser-4',
]);

export interface SourcePipelineOptions {
  root?: string;
  now?: () => string;
  refreshEntryIds?: readonly string[];
  /** Deterministic failure injection for transaction tests; never exposed through the CLI. */
  beforeRefreshManifestWrite?: () => Promise<void> | void;
  /** Deterministic concurrency pause for lock tests; never exposed through the CLI. */
  beforeStaleLockUnlink?: () => Promise<void> | void;
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
  refreshed: number;
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
  extractionHistory: string;
  manifests: string;
  manifest: string;
  operationLock: string;
  refreshTransaction: string;
}

interface ExtractedPiece {
  text: string;
  page?: number;
  section?: string;
  sectionPath?: string[];
  sectionInstance?: number;
}

interface SourceExtractionArtifact {
  schemaVersion: 1;
  document: SourceDocument;
  chunks: SourceChunk[];
}

interface SourceExtractionResult {
  pieces: ExtractedPiece[];
  warnings: string[];
  warningCount: number;
}

interface SourceRefreshTransaction {
  schemaVersion: 1;
  entryId: string;
  sourceSha256: string;
  documentId: string;
  priorParserVersion: string;
  nextParserVersion: string;
  priorHistoryFilename: string;
  stagedArtifactFilename: string;
  newArtifactHash: string;
  originalManifestHash: string;
  createdAt: string;
}

const sourcePaths = (root = DEFAULT_SOURCE_ROOT): SourcePaths => ({
  root,
  inbox: join(root, 'inbox'),
  processed: join(root, 'processed'),
  archive: join(root, 'archive'),
  quarantine: join(root, 'quarantine'),
  extracted: join(root, 'extracted'),
  extractionHistory: join(root, 'extracted', 'history'),
  manifests: join(root, 'manifests'),
  manifest: join(root, 'manifests', 'source-manifest.json'),
  operationLock: join(root, 'manifests', 'source-pipeline.lock'),
  refreshTransaction: join(root, 'manifests', 'source-refresh-transaction.json'),
});

const sha256 = (value: Uint8Array | string): string =>
  createHash('sha256').update(value).digest('hex');

export const sourceParserUsesStructuredProvenance = (parserVersion: string): boolean =>
  !LEGACY_PARSER_VERSIONS_WITHOUT_STRUCTURED_PROVENANCE.has(parserVersion);

export const sourceParserCapturesWarnings = (parserVersion: string): boolean =>
  !LEGACY_PARSER_VERSIONS_WITHOUT_WARNING_CAPTURE.has(parserVersion);

export const sourceParserCapturesWarningCount = (parserVersion: string): boolean =>
  !LEGACY_PARSER_VERSIONS_WITHOUT_WARNING_COUNT.has(parserVersion);

export const calculateSourceChunkProvenanceHash = (
  chunk: Omit<SourceChunk, 'provenanceHash'> | SourceChunk,
): string =>
  sha256(
    JSON.stringify({
      schemaVersion: chunk.schemaVersion,
      id: chunk.id,
      sourceDocumentId: chunk.sourceDocumentId,
      ordinal: chunk.ordinal,
      page: chunk.page ?? null,
      section: chunk.section ?? null,
      sectionPath: chunk.sectionPath ?? null,
      sectionInstance: chunk.sectionInstance ?? null,
      textHash: chunk.textHash,
    }),
  );

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
      paths.extractionHistory,
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

export const validateSourceManifestArtifactCoverage = (
  manifest: SourceManifest,
  documents: readonly Pick<SourceDocument, 'id' | 'sourceManifestEntryId'>[],
): void => {
  const entryById = new Map(manifest.entries.map((entry) => [entry.id, entry]));
  const artifactEntryIds = new Set<string>();
  const artifactDocumentIds = new Set<string>();
  for (const document of documents) {
    const entry = entryById.get(document.sourceManifestEntryId);
    if (!entry) {
      throw new Error(
        `${document.id} references missing manifest entry ${document.sourceManifestEntryId}.`,
      );
    }
    if (entry.status !== 'extracted') {
      throw new Error(
        `${document.id} belongs to manifest entry ${entry.id} with status ${entry.status}.`,
      );
    }
    if (artifactEntryIds.has(entry.id) || artifactDocumentIds.has(document.id)) {
      throw new Error(`${document.id} duplicates an extracted source relationship.`);
    }
    artifactEntryIds.add(entry.id);
    artifactDocumentIds.add(document.id);
  }
  for (const entry of manifest.entries.filter((candidate) => candidate.status === 'extracted')) {
    if (!artifactEntryIds.has(entry.id)) {
      throw new Error(`${entry.id} is extracted but has no matching source-document artifact.`);
    }
  }
};

const writeJsonAtomic = async (path: string, value: unknown): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
    await rename(temporaryPath, path);
  } catch (error) {
    try {
      await unlink(temporaryPath);
    } catch (cleanupError) {
      if ((cleanupError as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new Error(`Atomic JSON write failed and its temporary file could not be removed.`, {
          cause: error,
        });
      }
    }
    throw error;
  }
};

const unlinkIfExists = async (path: string): Promise<void> => {
  try {
    await unlink(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
};

const fileHash = async (path: string): Promise<string | null> => {
  try {
    return sha256(await readFile(path));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
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

const scanSourceInboxUnlocked = async (
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

export const scanSourceInbox = async (
  options: SourcePipelineOptions = {},
): Promise<SourceScanReport> => {
  const paths = sourcePaths(options.root);
  return withSourcePipelineLock(paths, () => scanSourceInboxUnlocked(options), options);
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

const extractPdf = async (bytes: Buffer): Promise<SourceExtractionResult> => {
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
  return { pieces, warnings: [], warningCount: 0 };
};

type HtmlNode = DefaultTreeAdapterTypes.Node;
type HtmlElement = DefaultTreeAdapterTypes.Element;

const isHtmlElement = (node: HtmlNode): node is HtmlElement => 'tagName' in node;

const htmlChildNodes = (node: HtmlNode): HtmlNode[] =>
  'childNodes' in node ? (node.childNodes as HtmlNode[]) : [];

const htmlText = (
  node: HtmlNode,
  excludedTags: ReadonlySet<string> = new Set(['img', 'script', 'style']),
): string => {
  if (node.nodeName === '#text' && 'value' in node) return node.value;
  if (isHtmlElement(node) && excludedTags.has(node.tagName)) return '';
  if (isHtmlElement(node) && node.tagName === 'br') return '\n';
  return htmlChildNodes(node)
    .map((child) => htmlText(child, excludedTags))
    .join('');
};

const normalizeHtmlBlock = (value: string): string => value.replace(/\s+/g, ' ').trim();

const sameSectionPath = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

/**
 * Mammoth produces an inert HTML fragment from the DOCX document tree. This parser keeps only
 * visible text and structural heading context; attributes, links, images, scripts, and styles are
 * neither retained nor executed.
 */
export const extractDocxHtmlFragment = (html: string): ExtractedPiece[] => {
  const fragment = parseFragment(html);
  const groups: Array<{ headingBoundary: number; sectionPath: string[]; blocks: string[] }> = [];
  let currentSectionPath: string[] = [];
  let headingBoundary = 0;

  const emit = (rawText: string): void => {
    const text = normalizeHtmlBlock(rawText);
    if (!text) return;
    const previous = groups.at(-1);
    if (
      !previous ||
      previous.headingBoundary !== headingBoundary ||
      !sameSectionPath(previous.sectionPath, currentSectionPath)
    ) {
      groups.push({
        headingBoundary,
        sectionPath: [...currentSectionPath],
        blocks: [text],
      });
      return;
    }
    previous.blocks.push(text);
  };

  const visitList = (element: HtmlElement, ordered: boolean): void => {
    const items = htmlChildNodes(element).filter(
      (node): node is HtmlElement => isHtmlElement(node) && node.tagName === 'li',
    );
    items.forEach((item, index) => {
      const itemText = htmlText(item, new Set(['img', 'script', 'style', 'ul', 'ol', 'table']));
      emit(`${ordered ? `${index + 1}.` : '-'} ${itemText}`);
      for (const child of htmlChildNodes(item)) {
        if (!isHtmlElement(child)) continue;
        if (child.tagName === 'ul') visitList(child, false);
        if (child.tagName === 'ol') visitList(child, true);
      }
    });
  };

  const visitTable = (element: HtmlElement): void => {
    const visitRows = (node: HtmlNode): void => {
      if (isHtmlElement(node) && node.tagName === 'table' && node !== element) return;
      if (isHtmlElement(node) && node.tagName === 'tr') {
        const cells = htmlChildNodes(node)
          .filter(
            (child): child is HtmlElement =>
              isHtmlElement(child) && ['td', 'th'].includes(child.tagName),
          )
          .map((cell) => normalizeHtmlBlock(htmlText(cell)))
          .filter(Boolean);
        emit(cells.join(' | '));
        return;
      }
      htmlChildNodes(node).forEach(visitRows);
    };
    visitRows(element);
  };

  const visit = (node: HtmlNode): void => {
    if (!isHtmlElement(node)) {
      if (node.nodeName === '#text') emit(htmlText(node));
      return;
    }

    const headingMatch = /^h([1-6])$/.exec(node.tagName);
    if (headingMatch) {
      const heading = normalizeHtmlBlock(htmlText(node));
      if (!heading) return;
      const level = Number(headingMatch[1]);
      currentSectionPath = [...currentSectionPath.slice(0, level - 1), heading];
      headingBoundary += 1;
      return;
    }

    switch (node.tagName) {
      case 'p':
      case 'pre':
        emit(htmlText(node));
        return;
      case 'ul':
        visitList(node, false);
        return;
      case 'ol':
        visitList(node, true);
        return;
      case 'table':
        visitTable(node);
        return;
      case 'img':
      case 'script':
      case 'style':
        return;
      default:
        htmlChildNodes(node).forEach(visit);
    }
  };

  (fragment.childNodes as HtmlNode[]).forEach(visit);
  return groups.flatMap(({ headingBoundary, sectionPath, blocks }) =>
    splitLongText(blocks.join('\n\n'), {
      ...(sectionPath.length > 0
        ? {
            section: sectionPath.at(-1),
            sectionPath: [...sectionPath],
            sectionInstance: headingBoundary,
          }
        : {}),
    }),
  );
};

const extractDocx = async (bytes: Buffer): Promise<SourceExtractionResult> => {
  const { convertToHtml, images } = await import('mammoth');
  const result = await convertToHtml(
    { buffer: bytes },
    {
      includeEmbeddedStyleMap: false,
      convertImage: images.imgElement(async () => ({ src: '' })),
    },
  );
  if (result.messages.some((message) => message.type === 'error')) {
    throw new Error('DOCX conversion reported an extraction error.');
  }
  const warnings = result.messages
    .filter((message) => message.type === 'warning')
    .map((message) => message.message.trim().slice(0, 1000))
    .filter(Boolean);
  return {
    pieces: extractDocxHtmlFragment(result.value),
    warnings: warnings.slice(0, 50),
    warningCount: warnings.length,
  };
};

const extractMarkdown = (bytes: Buffer): ExtractedPiece[] => {
  const text = bytes.toString('utf8');
  const lines = text.split(/\r?\n/);
  const sections: ExtractedPiece[] = [];
  let headingPath: string[] = [];
  let headingBoundary = 0;
  let sectionLines: string[] = [];
  const flush = (): void => {
    sections.push(
      ...splitLongText(
        sectionLines.join('\n'),
        headingPath.length > 0
          ? {
              section: headingPath.at(-1),
              sectionPath: [...headingPath],
              sectionInstance: headingBoundary,
            }
          : {},
      ),
    );
    sectionLines = [];
  };
  for (const line of lines) {
    const match = /^(#{1,6})\s+(.+)$/.exec(line);
    if (match) {
      flush();
      const heading = match[2]?.trim();
      if (heading) {
        const level = match[1]!.length;
        headingPath = [...headingPath.slice(0, level - 1), heading];
        headingBoundary += 1;
      }
    } else {
      sectionLines.push(line);
    }
  }
  flush();
  return sections;
};

const extractSource = async (
  entry: SourceManifestEntry,
  bytes: Buffer,
): Promise<SourceExtractionResult> => {
  switch (entry.mediaType) {
    case 'application/pdf':
      return extractPdf(bytes);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractDocx(bytes);
    case 'text/markdown':
      return { pieces: extractMarkdown(bytes), warnings: [], warningCount: 0 };
    case 'text/plain':
      return { pieces: splitLongText(bytes.toString('utf8')), warnings: [], warningCount: 0 };
    default:
      throw new Error(`No parser registered for ${entry.mediaType}.`);
  }
};

const buildExtractionArtifact = async (
  entry: SourceManifestEntry,
  bytes: Buffer,
  timestamp: string,
): Promise<SourceExtractionArtifact> => {
  if (sha256(bytes) !== entry.sha256) throw new Error('Source hash changed after scanning.');
  const { pieces, warnings, warningCount } = await extractSource(entry, bytes);
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
    extractionWarnings: warnings,
    extractionWarningCount: warningCount,
    processedAt: timestamp,
  });
  const chunks: SourceChunk[] = pieces.map((piece, ordinal) => {
    const chunk = SourceChunkSchema.parse({
      schemaVersion: 1,
      id: `source-chunk.${entry.sha256.slice(0, 20)}.${ordinal + 1}`,
      sourceDocumentId: documentId,
      ordinal,
      ...(piece.page ? { page: piece.page } : {}),
      ...(piece.section ? { section: piece.section } : {}),
      ...(piece.sectionPath ? { sectionPath: piece.sectionPath } : {}),
      ...(piece.sectionInstance ? { sectionInstance: piece.sectionInstance } : {}),
      text: piece.text,
      textHash: sha256(piece.text),
    });
    return SourceChunkSchema.parse({
      ...chunk,
      provenanceHash: calculateSourceChunkProvenanceHash(chunk),
    });
  });
  return { schemaVersion: 1, document, chunks };
};

const parseExtractionArtifact = (raw: unknown): SourceExtractionArtifact => {
  if (!raw || typeof raw !== 'object') throw new Error('Existing extraction artifact is invalid.');
  const value = raw as { schemaVersion?: unknown; document?: unknown; chunks?: unknown };
  if (value.schemaVersion !== 1) {
    throw new Error('Existing extraction artifact has an unsupported schema version.');
  }
  return {
    schemaVersion: 1,
    document: SourceDocumentSchema.parse(value.document),
    chunks: SourceChunkSchema.array().parse(value.chunks),
  };
};

const extractionArtifactHash = (artifact: SourceExtractionArtifact): string =>
  sha256(JSON.stringify(artifact));

const extractionArtifactPath = (paths: SourcePaths, documentId: string): string =>
  join(paths.extracted, `${documentId}.json`);

const validateExtractionArtifactIntegrity = (
  artifact: SourceExtractionArtifact,
  entry: SourceManifestEntry,
): void => {
  const documentId = sourceDocumentId(entry.sha256);
  if (
    artifact.document.id !== documentId ||
    artifact.document.sourceManifestEntryId !== entry.id ||
    artifact.document.parserVersion !== entry.parserVersion
  ) {
    throw new Error(`Extraction provenance is inconsistent for ${entry.id}.`);
  }
  if (artifact.chunks.length === 0) {
    throw new Error(`Extraction artifact for ${entry.id} contains no chunks.`);
  }
  if (
    sourceParserCapturesWarnings(artifact.document.parserVersion) &&
    !artifact.document.extractionWarnings
  ) {
    throw new Error(`Extraction warning provenance is missing for ${entry.id}.`);
  }
  if (
    sourceParserCapturesWarningCount(artifact.document.parserVersion) &&
    artifact.document.extractionWarningCount === undefined
  ) {
    throw new Error(`Extraction warning-count provenance is missing for ${entry.id}.`);
  }
  for (const [index, chunk] of artifact.chunks.entries()) {
    const expectedId = `source-chunk.${entry.sha256.slice(0, 20)}.${index + 1}`;
    if (
      chunk.id !== expectedId ||
      chunk.ordinal !== index ||
      chunk.sourceDocumentId !== artifact.document.id ||
      sha256(chunk.text) !== chunk.textHash
    ) {
      throw new Error(`Extraction chunk integrity failed for ${chunk.id}.`);
    }
    if (
      chunk.provenanceHash &&
      calculateSourceChunkProvenanceHash(chunk) !== chunk.provenanceHash
    ) {
      throw new Error(`Extraction locator provenance failed for ${chunk.id}.`);
    }
    if (
      sourceParserUsesStructuredProvenance(artifact.document.parserVersion) &&
      (!chunk.provenanceHash || (chunk.sectionPath && !chunk.sectionInstance))
    ) {
      throw new Error(`Structured extraction provenance is incomplete for ${chunk.id}.`);
    }
  }
  if (
    sha256(artifact.chunks.map((chunk) => chunk.text).join('\n\n')) !==
    artifact.document.extractedTextHash
  ) {
    throw new Error(`Combined extraction integrity failed for ${entry.id}.`);
  }
};

interface ArchivedExtraction {
  artifactPath: string;
  historyPath: string;
  prior: SourceExtractionArtifact;
}

const archiveExtractionArtifact = async (
  paths: SourcePaths,
  entry: SourceManifestEntry,
): Promise<ArchivedExtraction> => {
  const documentId = sourceDocumentId(entry.sha256);
  const artifactPath = extractionArtifactPath(paths, documentId);
  if (!(await exists(artifactPath))) {
    throw new Error(`Cannot refresh ${entry.id}: its prior extraction artifact is missing.`);
  }
  const prior = parseExtractionArtifact(
    JSON.parse(await readFile(artifactPath, 'utf8')) as unknown,
  );
  validateExtractionArtifactIntegrity(prior, entry);
  const historyName = `${documentId}--${sha256(prior.document.parserVersion).slice(
    0,
    12,
  )}--${prior.document.extractedTextHash.slice(0, 12)}.json`;
  const historyPath = join(paths.extractionHistory, historyName);
  if (await exists(historyPath)) {
    const existingHistory = parseExtractionArtifact(
      JSON.parse(await readFile(historyPath, 'utf8')) as unknown,
    );
    validateExtractionArtifactIntegrity(existingHistory, entry);
    if (JSON.stringify(existingHistory) !== JSON.stringify(prior)) {
      throw new Error(
        `Cannot refresh ${entry.id}: its existing extraction history is not equivalent.`,
      );
    }
  } else {
    await writeJsonAtomic(historyPath, prior);
  }
  return { artifactPath, historyPath, prior };
};

const parseRefreshTransaction = (raw: unknown): SourceRefreshTransaction => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('The source refresh transaction marker is invalid.');
  }
  const value = raw as Partial<SourceRefreshTransaction>;
  const filenames = [value.priorHistoryFilename, value.stagedArtifactFilename];
  if (
    value.schemaVersion !== 1 ||
    typeof value.entryId !== 'string' ||
    typeof value.sourceSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value.sourceSha256) ||
    typeof value.documentId !== 'string' ||
    typeof value.priorParserVersion !== 'string' ||
    typeof value.nextParserVersion !== 'string' ||
    filenames.some(
      (filename) =>
        typeof filename !== 'string' ||
        basename(filename) !== filename ||
        !/^[a-zA-Z0-9._-]+$/.test(filename),
    ) ||
    typeof value.newArtifactHash !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value.newArtifactHash) ||
    typeof value.originalManifestHash !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value.originalManifestHash) ||
    typeof value.createdAt !== 'string' ||
    Number.isNaN(Date.parse(value.createdAt))
  ) {
    throw new Error('The source refresh transaction marker has an unsupported shape.');
  }
  return value as SourceRefreshTransaction;
};

const recoverInterruptedSourceRefresh = async (paths: SourcePaths): Promise<void> => {
  if (!(await exists(paths.refreshTransaction))) return;
  const transaction = parseRefreshTransaction(
    JSON.parse(await readFile(paths.refreshTransaction, 'utf8')) as unknown,
  );
  const manifest = await loadSourceManifest(paths.root);
  const entry = manifest.entries.find((candidate) => candidate.id === transaction.entryId);
  if (
    !entry ||
    entry.sha256 !== transaction.sourceSha256 ||
    sourceDocumentId(entry.sha256) !== transaction.documentId
  ) {
    throw new Error(
      `Cannot recover interrupted source refresh ${transaction.entryId}: manifest provenance changed.`,
    );
  }
  const artifactPath = extractionArtifactPath(paths, transaction.documentId);
  const stagedPath = join(paths.extractionHistory, transaction.stagedArtifactFilename);
  if (entry.parserVersion === transaction.nextParserVersion) {
    const current = parseExtractionArtifact(
      JSON.parse(await readFile(artifactPath, 'utf8')) as unknown,
    );
    validateExtractionArtifactIntegrity(current, entry);
    if (extractionArtifactHash(current) !== transaction.newArtifactHash) {
      throw new Error(
        `Cannot recover interrupted source refresh ${transaction.entryId}: committed artifact hash changed.`,
      );
    }
  } else if (entry.parserVersion === transaction.priorParserVersion) {
    const priorEntry = SourceManifestEntrySchema.parse({
      ...entry,
      parserVersion: transaction.priorParserVersion,
      status: 'extracted',
      error: undefined,
    });
    const historyPath = join(paths.extractionHistory, transaction.priorHistoryFilename);
    const prior = parseExtractionArtifact(
      JSON.parse(await readFile(historyPath, 'utf8')) as unknown,
    );
    validateExtractionArtifactIntegrity(prior, priorEntry);
    await writeJsonAtomic(artifactPath, prior);
  } else {
    throw new Error(
      `Cannot recover interrupted source refresh ${transaction.entryId}: manifest parser version is neither the prior nor proposed version.`,
    );
  }
  await unlinkIfExists(stagedPath);
  await unlinkIfExists(paths.refreshTransaction);
};

interface SourcePipelineLock {
  schemaVersion: 1;
  token: string;
  pid: number;
  createdAt: string;
}

const parseSourcePipelineLock = (raw: unknown): SourcePipelineLock => {
  if (!raw || typeof raw !== 'object') throw new Error('Source-pipeline lock is invalid.');
  const value = raw as Partial<SourcePipelineLock>;
  if (
    value.schemaVersion !== 1 ||
    typeof value.token !== 'string' ||
    !/^[a-f0-9-]{36}$/.test(value.token) ||
    typeof value.pid !== 'number' ||
    !Number.isInteger(value.pid) ||
    value.pid <= 0 ||
    typeof value.createdAt !== 'string' ||
    Number.isNaN(Date.parse(value.createdAt))
  ) {
    throw new Error('Source-pipeline lock has an unsupported shape.');
  }
  return value as SourcePipelineLock;
};

const processIsAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ESRCH';
  }
};

const acquireSourcePipelineLock = async (
  paths: SourcePaths,
  options: SourcePipelineOptions,
): Promise<() => Promise<void>> => {
  await mkdir(paths.manifests, { recursive: true });
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const lock: SourcePipelineLock = {
      schemaVersion: 1,
      token: randomUUID(),
      pid: process.pid,
      createdAt: new Date().toISOString(),
    };
    try {
      const handle = await open(paths.operationLock, 'wx', 0o600);
      try {
        await handle.writeFile(`${JSON.stringify(lock, null, 2)}\n`, 'utf8');
      } catch (error) {
        await unlinkIfExists(paths.operationLock);
        throw error;
      } finally {
        await handle.close();
      }
      return async () => {
        const current = parseSourcePipelineLock(
          JSON.parse(await readFile(paths.operationLock, 'utf8')) as unknown,
        );
        if (current.token !== lock.token) {
          throw new Error('Refusing to release a source-pipeline lock owned by another operation.');
        }
        await unlinkIfExists(paths.operationLock);
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      let existing: SourcePipelineLock;
      try {
        existing = parseSourcePipelineLock(
          JSON.parse(await readFile(paths.operationLock, 'utf8')) as unknown,
        );
      } catch {
        throw new Error(
          `Source-pipeline lock ${paths.operationLock} is unreadable; inspect it before retrying.`,
        );
      }
      if (processIsAlive(existing.pid)) {
        throw new Error(
          `Source processing is already active in process ${existing.pid}; retry after it finishes.`,
        );
      }
      // A single fixed hard-link target is an atomic recovery claim. Only its owner may unlink the
      // stale lock. A unique target would let several contenders claim the same inode and re-open
      // the compare/unlink race this claim exists to prevent.
      const staleClaimPath = `${paths.operationLock}.stale-claim`;
      try {
        await link(paths.operationLock, staleClaimPath);
      } catch (claimError) {
        if ((claimError as NodeJS.ErrnoException).code === 'ENOENT') continue;
        if ((claimError as NodeJS.ErrnoException).code === 'EEXIST') {
          throw new Error(
            `Source-pipeline stale-lock recovery is already active or its claim requires inspection: ${staleClaimPath}`,
          );
        }
        throw claimError;
      }
      try {
        const claimed = parseSourcePipelineLock(
          JSON.parse(await readFile(staleClaimPath, 'utf8')) as unknown,
        );
        let currentStat: Awaited<ReturnType<typeof stat>> | null;
        try {
          currentStat = await stat(paths.operationLock);
        } catch (statError) {
          if ((statError as NodeJS.ErrnoException).code !== 'ENOENT') throw statError;
          currentStat = null;
        }
        const claimedStat = await stat(staleClaimPath);
        if (
          claimed.token === existing.token &&
          currentStat &&
          currentStat.dev === claimedStat.dev &&
          currentStat.ino === claimedStat.ino
        ) {
          await options.beforeStaleLockUnlink?.();
          await unlinkIfExists(paths.operationLock);
        }
      } finally {
        await unlinkIfExists(staleClaimPath);
      }
    }
  }
  throw new Error('Could not acquire the source-pipeline lock.');
};

async function withSourcePipelineLock<T>(
  paths: SourcePaths,
  operation: () => Promise<T>,
  options: SourcePipelineOptions = {},
): Promise<T> {
  await ensureFolders(paths);
  const release = await acquireSourcePipelineLock(paths, options);
  try {
    await recoverInterruptedSourceRefresh(paths);
    return await operation();
  } finally {
    await release();
  }
}

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

const processedSourcePathForEntry = async (
  paths: SourcePaths,
  entry: SourceManifestEntry,
): Promise<string | null> => {
  const processedPath = join(paths.processed, retainedFilename(entry));
  return (await exists(processedPath)) ? processedPath : null;
};

const extractDiscoveredSourcesUnlocked = async (
  options: SourcePipelineOptions = {},
): Promise<SourceExtractionReport> => {
  const paths = sourcePaths(options.root);
  await ensureFolders(paths);
  const timestamp = nowIso(options);
  const originalManifestHash = await fileHash(paths.manifest);
  let manifest = await loadSourceManifest(paths.root, timestamp);
  let entries = [...manifest.entries];
  let extracted = 0;
  const refreshed = 0;
  let archivedDuplicates = 0;
  let quarantined = 0;
  const refreshEntryIds = new Set(options.refreshEntryIds ?? []);
  if (refreshEntryIds.size > 1) {
    throw new Error('Source refresh accepts exactly one manifest entry at a time.');
  }

  for (const entryId of refreshEntryIds) {
    const entry = entries.find((candidate) => candidate.id === entryId);
    if (!entry) throw new Error(`Cannot refresh unknown source manifest entry ${entryId}.`);
    if (entry.status !== 'extracted') {
      throw new Error(`Cannot refresh ${entryId}: its current status is ${entry.status}.`);
    }
    if (entry.parserVersion === SOURCE_PARSER_VERSION) {
      throw new Error(`Cannot refresh ${entryId}: it already uses ${SOURCE_PARSER_VERSION}.`);
    }
  }

  for (const originalEntry of entries) {
    let entry = entries.find((candidate) => candidate.id === originalEntry.id)!;
    if (refreshEntryIds.size > 0 && !refreshEntryIds.has(entry.id)) continue;
    if (refreshEntryIds.has(entry.id)) {
      const sourcePath = await processedSourcePathForEntry(paths, entry);
      if (!sourcePath) {
        throw new Error(
          `Cannot refresh ${entry.id}: source bytes are missing from processed storage.`,
        );
      }
      let archived: ArchivedExtraction | undefined;
      let artifactReplaced = false;
      let stagedPath: string | undefined;
      let transactionWritten = false;
      try {
        const artifact = await buildExtractionArtifact(
          entry,
          await readFile(sourcePath),
          timestamp,
        );
        const refreshedEntry = SourceManifestEntrySchema.parse({
          ...entry,
          parserVersion: SOURCE_PARSER_VERSION,
          status: 'extracted',
          updatedAt: timestamp,
          error: undefined,
        });
        archived = await archiveExtractionArtifact(paths, entry);
        if (!originalManifestHash) {
          throw new Error(`Cannot refresh ${entry.id}: its source manifest is missing.`);
        }
        const stagedArtifactFilename = `refresh-stage.${artifact.document.id}.${randomUUID()}.json`;
        stagedPath = join(paths.extractionHistory, stagedArtifactFilename);
        const transaction: SourceRefreshTransaction = {
          schemaVersion: 1,
          entryId: entry.id,
          sourceSha256: entry.sha256,
          documentId: artifact.document.id,
          priorParserVersion: entry.parserVersion,
          nextParserVersion: SOURCE_PARSER_VERSION,
          priorHistoryFilename: basename(archived.historyPath),
          stagedArtifactFilename,
          newArtifactHash: extractionArtifactHash(artifact),
          originalManifestHash,
          createdAt: timestamp,
        };
        await writeJsonAtomic(paths.refreshTransaction, transaction);
        transactionWritten = true;
        await writeJsonAtomic(stagedPath, artifact);
        await rename(stagedPath, archived.artifactPath);
        artifactReplaced = true;
        const refreshedEntries = entries.map((candidate) =>
          candidate.id === refreshedEntry.id ? refreshedEntry : candidate,
        );
        await options.beforeRefreshManifestWrite?.();
        if ((await fileHash(paths.manifest)) !== originalManifestHash) {
          throw new Error(
            'The source manifest changed during refresh; refusing to overwrite concurrent updates.',
          );
        }
        await writeManifest(paths, refreshedEntries, timestamp);
      } catch (error) {
        let rollbackError: unknown;
        if (artifactReplaced && archived) {
          try {
            await writeJsonAtomic(archived.artifactPath, archived.prior);
          } catch (caught) {
            rollbackError = caught;
          }
        }
        try {
          if (stagedPath) await unlinkIfExists(stagedPath);
          if (transactionWritten) await unlinkIfExists(paths.refreshTransaction);
        } catch (caught) {
          rollbackError ??= caught;
        }
        if (rollbackError && archived) {
          throw new Error(
            `Refresh failed for ${entry.id}, and automatic rollback or cleanup failed. The validated prior artifact remains recoverable at ${archived.historyPath}. ${
              rollbackError instanceof Error ? rollbackError.message : 'Unknown rollback error.'
            }`,
            { cause: error },
          );
        }
        throw new Error(
          `Refresh failed for ${entry.id}; its prior extraction and manifest entry were preserved. ${
            error instanceof Error ? error.message : 'Unknown extraction error.'
          }`,
          { cause: error },
        );
      }
      try {
        await unlinkIfExists(paths.refreshTransaction);
      } catch (error) {
        throw new Error(
          `Refresh committed for ${entry.id}, but its recovery marker could not be removed. The next source command will verify and clear it. ${
            error instanceof Error ? error.message : 'Unknown cleanup error.'
          }`,
          { cause: error },
        );
      }
      return {
        extracted: 0,
        refreshed: 1,
        archivedDuplicates: 0,
        quarantined: 0,
        manifestPath: paths.manifest,
      };
    }
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
      const artifact = await buildExtractionArtifact(entry, bytes, timestamp);
      await writeJsonAtomic(extractionArtifactPath(paths, artifact.document.id), artifact);
      await moveRetained(sourcePath, paths.processed, entry);
      entry = SourceManifestEntrySchema.parse({
        ...entry,
        parserVersion: SOURCE_PARSER_VERSION,
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
  return { extracted, refreshed, archivedDuplicates, quarantined, manifestPath: paths.manifest };
};

export const extractDiscoveredSources = async (
  options: SourcePipelineOptions = {},
): Promise<SourceExtractionReport> => {
  const paths = sourcePaths(options.root);
  return withSourcePipelineLock(paths, () => extractDiscoveredSourcesUnlocked(options), options);
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
