import { createHash } from 'node:crypto';
import {
  chmod,
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';

import { publicClinicalCatalog } from '@psychsim/content-runtime';
import {
  ClinicalReviewTicketSchema,
  SchemaVersionSchema,
  SourceChunkSchema,
  SourceDocumentSchema,
  SourceReviewAtomicProposalSchema,
  SourceReviewSnapshotSchema,
  SourceReviewTicketFeedSchema,
  StableIdSchema,
  type ClinicalReviewTicket,
  type SourceChunk,
  type SourceReviewSnapshot,
  type SourceReviewTicketFeed,
} from '@psychsim/schemas';
import { z } from 'zod';
import { calculateSourceChunkProvenanceHash } from './source-pipeline';

const MAX_PRIVATE_FILE_BYTES = 5_000_000;
const DEFAULT_SOURCE_ROOT = resolve('content/source-docs');
const DEFAULT_DRAFT_PATH = resolve('content/source-docs/manifests/source-review-drafts.json');
const DEFAULT_GENERATED_ROOT = resolve('content/generated/source-review');
const DEFAULT_FEED_PATH = resolve(DEFAULT_GENERATED_ROOT, 'tickets.json');
const DEFAULT_LOCATOR_PATH = resolve('content/source-docs/manifests/source-review-units.json');

const SourceReviewSelectorSchema = z
  .object({
    kind: z.literal('section_instance'),
    sectionInstance: z.number().int().positive(),
  })
  .strict();

const SourceReviewCurrentnessSchema = z
  .object({
    status: z.enum(['needs_currentness_review', 'current', 'superseded', 'retired']),
    evaluatedThrough: z.string().date().nullable(),
    note: z.string().min(1).max(500),
  })
  .strict();

const SourceReviewRightsStateSchema = z
  .object({
    status: z.enum([
      'not_assessed',
      'private_processing_only',
      'permission_required',
      'excluded',
      'source_use_decision',
    ]),
    sourceUseDecisionId: StableIdSchema.nullable(),
    portableReviewAllowed: z.boolean(),
    note: z.string().min(1).max(600),
  })
  .strict();

const SourceReviewDraftUnitSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    documentId: StableIdSchema,
    selector: SourceReviewSelectorSchema,
    sourceHeadingExcluded: z.literal(true),
    boundaryEvidenceStatus: z.enum(['parser_clean', 'unresolved_extraction_warning']),
    derivedDisplayTitle: z.string().min(1).max(180),
    ticketType: z.enum([
      'technical',
      'case_construction',
      'test_generation',
      'medication_fit',
      'treatment_pathway',
      'scoring',
      'narrative',
      'clinical_conflict',
      'source_gap',
    ]),
    priority: z.enum(['low', 'medium', 'high', 'blocking']),
    requiresClinicalAcumen: z.boolean(),
    proposedRouting: z.string().min(1).max(500),
    decisionQuestion: z.string().min(1).max(800),
    publicTargetContentIds: z.array(StableIdSchema).max(30),
    unresolvedTargetLabels: z.array(z.string().min(1).max(180)).max(30),
    dependencyTicketIds: z.array(StableIdSchema).max(30),
    conflictContentIds: z.array(StableIdSchema).max(30),
    originalSummary: z.string().min(1).max(700),
    atomicProposals: z.array(SourceReviewAtomicProposalSchema).min(1).max(4),
    uncertainty: z.array(z.string().min(1).max(300)).max(10),
    conflicts: z.array(z.string().min(1).max(500)).max(10),
    currentness: SourceReviewCurrentnessSchema,
    rightsState: SourceReviewRightsStateSchema,
    boundaryState: z.enum(['confirmed', 'uncertain']),
    boundaryQuestion: z.string().min(1).max(600).nullable(),
    resurfacingTrigger: z.string().min(1).max(500).nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

const SourceReviewDraftSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    draftVersion: z.literal(1),
    generatedAt: z.string().datetime(),
    units: z.array(SourceReviewDraftUnitSchema).length(1),
  })
  .strict();

const SourceReviewPrivateChunkLocatorSchema = z
  .object({
    id: StableIdSchema,
    ordinal: z.number().int().nonnegative(),
    textHash: z.string().regex(/^[a-f0-9]{64}$/),
    provenanceHash: z.string().regex(/^[a-f0-9]{64}$/),
    page: z.number().int().positive().optional(),
    sectionInstance: z.number().int().positive(),
    sectionPath: z.array(z.string().min(1)).min(1),
  })
  .strict();

const SourceReviewPrivateLocatorSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    ticketId: StableIdSchema,
    packetHash: z.string().regex(/^[a-f0-9]{64}$/),
    sourceUnitFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    draftUnitId: StableIdSchema,
    documentId: StableIdSchema,
    parserVersion: z.literal('psychsim-source-parser-5'),
    documentExtractedTextHash: z.string().regex(/^[a-f0-9]{64}$/),
    extractionWarnings: z.array(z.string().min(1).max(1000)).max(50),
    extractionWarningCount: z.number().int().nonnegative(),
    selector: SourceReviewSelectorSchema,
    chunks: z.array(SourceReviewPrivateChunkLocatorSchema).min(1),
  })
  .strict();

const SourceReviewPrivateLocatorManifestSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    manifestVersion: z.literal(1),
    generatedAt: z.string().datetime(),
    entries: z.array(SourceReviewPrivateLocatorSchema).max(100),
  })
  .strict();

interface SourceExtractionArtifact {
  schemaVersion: 1;
  document: z.infer<typeof SourceDocumentSchema>;
  chunks: SourceChunk[];
}

export interface PrepareSourceReviewPacketsOptions {
  sourceRoot?: string;
  draftPath?: string;
  generatedRoot?: string;
  feedPath?: string;
  locatorPath?: string;
  publicTargetIds?: readonly string[];
}

export interface SourceReviewPacketReport {
  tickets: number;
  sourceUnits: number;
  feedPath: string;
  locatorPath: string;
}

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, canonicalize(nested)]),
  );
};

export const canonicalSourceReviewJson = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

const sha256 = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');

export const calculateSourceReviewPacketHash = (
  snapshot: Omit<SourceReviewSnapshot, 'packetHash'>,
): string => sha256(canonicalSourceReviewJson(snapshot));

const pathInside = (parent: string, child: string): boolean => {
  const relativePath = relative(parent, child);
  return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath);
};

const exists = async (path: string): Promise<boolean> => {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
};

const assertRegularPrivateFile = async (path: string, label: string): Promise<void> => {
  const stat = await lstat(path);
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.size > MAX_PRIVATE_FILE_BYTES ||
    (stat.mode & 0o777) !== 0o600
  ) {
    throw new Error(`${label} must be one private mode-0600 regular file.`);
  }
};

const assertPathUnderRoot = async (
  path: string,
  allowedRoot: string,
  label: string,
): Promise<void> => {
  const rootStat = await lstat(allowedRoot);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error(`${label} root must be a real directory.`);
  }
  const resolvedRoot = await realpath(allowedRoot);
  const resolvedParent = await realpath(dirname(path));
  const resolvedCandidate = resolve(resolvedParent, basename(path));
  if (
    !pathInside(resolvedRoot, resolvedCandidate) ||
    (resolvedParent !== resolvedRoot && !pathInside(resolvedRoot, resolvedParent))
  ) {
    throw new Error(`${label} escapes its protected root.`);
  }
  if (await exists(path)) {
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) throw new Error(`${label} cannot be a symlink.`);
    const resolvedPath = await realpath(path);
    if (!pathInside(resolvedRoot, resolvedPath)) {
      throw new Error(`${label} escapes its protected root.`);
    }
  }
};

const readPrivateJson = async (
  path: string,
  allowedRoot: string,
  label: string,
): Promise<unknown> => {
  await assertRegularPrivateFile(path, label);
  await assertPathUnderRoot(path, allowedRoot, label);
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
};

const prepareOutputPath = async (
  path: string,
  allowedRoot: string,
  label: string,
): Promise<void> => {
  await mkdir(allowedRoot, { recursive: true, mode: 0o700 });
  if (resolve(dirname(path)) !== resolve(allowedRoot)) {
    throw new Error(`${label} must be a direct child of its protected output root.`);
  }
  await assertPathUnderRoot(path, allowedRoot, label);
};

const restorePrivateFile = async (path: string, priorBytes: Buffer | null): Promise<void> => {
  if (priorBytes === null) {
    if (await exists(path)) await unlink(path);
    return;
  }
  await writeFile(path, priorBytes, { mode: 0o600 });
  await chmod(path, 0o600);
};

const writePrivateJsonPairTransaction = async (
  first: { path: string; value: unknown },
  second: { path: string; value: unknown },
): Promise<void> => {
  const nonce = `${process.pid}.${Date.now()}`;
  const firstTemporaryPath = `${first.path}.${nonce}.tmp`;
  const secondTemporaryPath = `${second.path}.${nonce}.tmp`;
  const priorBytes = await Promise.all(
    [first.path, second.path].map(async (path) => ((await exists(path)) ? readFile(path) : null)),
  );
  const firstPriorBytes = priorBytes[0]!;
  const secondPriorBytes = priorBytes[1]!;
  let firstCommitted = false;
  let secondCommitted = false;
  try {
    await Promise.all(
      [first, second].map(async (entry, index) => {
        const temporaryPath = index === 0 ? firstTemporaryPath : secondTemporaryPath;
        await writeFile(temporaryPath, `${JSON.stringify(entry.value, null, 2)}\n`, {
          encoding: 'utf8',
          mode: 0o600,
        });
        await chmod(temporaryPath, 0o600);
      }),
    );
    // Commit the private locator first, then the safe feed. Any failure restores
    // the prior pair so an answered packet can always be traced to one locator.
    await rename(firstTemporaryPath, first.path);
    firstCommitted = true;
    await chmod(first.path, 0o600);
    await rename(secondTemporaryPath, second.path);
    secondCommitted = true;
    await chmod(second.path, 0o600);
  } catch (error) {
    await Promise.all(
      [firstTemporaryPath, secondTemporaryPath].map(async (path) => {
        try {
          await unlink(path);
        } catch {
          // A successful rename consumes its temporary file.
        }
      }),
    );
    const restoreErrors: unknown[] = [];
    if (firstCommitted) {
      try {
        await restorePrivateFile(first.path, firstPriorBytes);
      } catch (restoreError) {
        restoreErrors.push(restoreError);
      }
    }
    if (secondCommitted) {
      try {
        await restorePrivateFile(second.path, secondPriorBytes);
      } catch (restoreError) {
        restoreErrors.push(restoreError);
      }
    }
    if (restoreErrors.length > 0) {
      throw new AggregateError(
        [error, ...restoreErrors],
        'Source-review pair update failed and could not be fully rolled back.',
      );
    }
    throw error;
  }
};

const parseExtractionArtifact = (value: unknown): SourceExtractionArtifact => {
  const envelope = z
    .object({
      schemaVersion: z.literal(1),
      document: SourceDocumentSchema,
      chunks: z.array(SourceChunkSchema).min(1),
    })
    .strict()
    .parse(value);
  if (envelope.chunks.some((chunk) => chunk.sourceDocumentId !== envelope.document.id)) {
    throw new Error('Source-review artifact chunks do not all belong to their document.');
  }
  if (
    envelope.document.parserVersion === 'psychsim-source-parser-5' &&
    (envelope.document.extractionWarnings === undefined ||
      envelope.document.extractionWarningCount === undefined)
  ) {
    throw new Error('Parser-v5 source-review artifacts require warning provenance.');
  }
  for (const [index, chunk] of envelope.chunks.entries()) {
    const expectedId = `${envelope.document.id.replace('source-document.', 'source-chunk.')}.${index + 1}`;
    if (
      chunk.id !== expectedId ||
      chunk.ordinal !== index ||
      sha256(chunk.text) !== chunk.textHash ||
      !chunk.provenanceHash ||
      calculateSourceChunkProvenanceHash(chunk) !== chunk.provenanceHash
    ) {
      throw new Error(`Source-review artifact integrity failed at chunk ordinal ${index}.`);
    }
  }
  if (
    sha256(envelope.chunks.map((chunk) => chunk.text).join('\n\n')) !==
    envelope.document.extractedTextHash
  ) {
    throw new Error('Source-review artifact combined extracted-text hash is invalid.');
  }
  return envelope;
};

const selectCompleteSection = (
  artifact: SourceExtractionArtifact,
  selector: z.infer<typeof SourceReviewSelectorSchema>,
): SourceChunk[] => {
  const ordered = artifact.chunks
    .filter((chunk) => chunk.sectionInstance === selector.sectionInstance)
    .sort((left, right) => left.ordinal - right.ordinal);
  if (ordered.length === 0) {
    throw new Error('Source-review selector did not resolve a logical heading unit.');
  }
  if (ordered.some((chunk) => !chunk.provenanceHash || !chunk.sectionPath)) {
    throw new Error('Source-review packets require parser-v5 structured provenance.');
  }
  const expectedPath = canonicalSourceReviewJson(ordered[0]?.sectionPath);
  if (
    ordered.some(
      (chunk) =>
        chunk.sectionInstance !== selector.sectionInstance ||
        canonicalSourceReviewJson(chunk.sectionPath) !== expectedPath,
    )
  ) {
    throw new Error('Source-review selection crossed a logical authored-unit boundary.');
  }
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index]!.ordinal !== ordered[index - 1]!.ordinal + 1) {
      throw new Error('Source-review authored-unit chunks must be contiguous.');
    }
  }
  return ordered;
};

const locatorMaterial = (
  artifact: SourceExtractionArtifact,
  chunks: readonly SourceChunk[],
): Omit<
  z.infer<typeof SourceReviewPrivateLocatorSchema>,
  'schemaVersion' | 'ticketId' | 'packetHash' | 'sourceUnitFingerprint' | 'draftUnitId'
> => ({
  documentId: artifact.document.id,
  parserVersion: 'psychsim-source-parser-5',
  documentExtractedTextHash: artifact.document.extractedTextHash,
  extractionWarnings: artifact.document.extractionWarnings ?? [],
  extractionWarningCount: artifact.document.extractionWarningCount ?? 0,
  selector: {
    kind: 'section_instance',
    sectionInstance: chunks[0]!.sectionInstance!,
  },
  chunks: chunks.map((chunk) => ({
    id: chunk.id,
    ordinal: chunk.ordinal,
    textHash: chunk.textHash,
    provenanceHash: chunk.provenanceHash!,
    ...(chunk.page ? { page: chunk.page } : {}),
    sectionInstance: chunk.sectionInstance!,
    sectionPath: chunk.sectionPath!,
  })),
});

const sourceUnitFingerprintFor = (material: ReturnType<typeof locatorMaterial>): string =>
  sha256(canonicalSourceReviewJson(material));

const assertSafeProjectionDoesNotExposeLocators = (
  feed: SourceReviewTicketFeed,
  artifacts: readonly {
    artifact: SourceExtractionArtifact;
    chunks: readonly SourceChunk[];
  }[],
): void => {
  const serialized = JSON.stringify(feed);
  for (const { artifact } of artifacts) {
    const forbidden = [
      artifact.document.id,
      artifact.document.sourceManifestEntryId,
      ...artifact.chunks.map((chunk) => chunk.id),
      ...artifact.chunks.flatMap((chunk) => chunk.sectionPath ?? []),
      ...artifact.chunks.map((chunk) => chunk.text),
    ];
    if (forbidden.some((value) => serialized.includes(value))) {
      throw new Error(
        'Source-review safe projection exposes a private locator, source heading, or raw text.',
      );
    }
  }
};

const publicTargetSet = (options: PrepareSourceReviewPacketsOptions): ReadonlySet<string> =>
  new Set(options.publicTargetIds ?? publicClinicalCatalog.entries.map((entry) => entry.id));

const assertPublicTargets = (ticket: ClinicalReviewTicket, targets: ReadonlySet<string>): void => {
  const referenced = [
    ...ticket.targetContentIds,
    ...ticket.sourceReviewSnapshot!.atomicProposals.flatMap(
      (proposal) => proposal.publicTargetContentIds,
    ),
  ];
  const unavailable = [...new Set(referenced.filter((targetId) => !targets.has(targetId)))];
  if (unavailable.length > 0) {
    throw new Error(
      `Source-review packet references targets outside the public clinical catalog: ${unavailable.join(', ')}`,
    );
  }
};

const assertWarningBoundary = (
  unit: z.infer<typeof SourceReviewDraftUnitSchema>,
  artifact: SourceExtractionArtifact,
): void => {
  const warningCount = artifact.document.extractionWarningCount ?? 0;
  if (warningCount > 0) {
    if (
      unit.boundaryEvidenceStatus !== 'unresolved_extraction_warning' ||
      unit.boundaryState !== 'uncertain' ||
      unit.boundaryQuestion === null ||
      unit.uncertainty.length === 0
    ) {
      throw new Error(
        'A source with extraction warnings requires an uncertain boundary, explicit question, and uncertainty note.',
      );
    }
    return;
  }
  if (unit.boundaryEvidenceStatus !== 'parser_clean') {
    throw new Error('A warning-free source must use the parser-clean boundary evidence status.');
  }
};

interface ValidatedSourceReviewState {
  feed: SourceReviewTicketFeed;
  locators: z.infer<typeof SourceReviewPrivateLocatorManifestSchema>;
  inspectedArtifacts: Array<{
    artifact: SourceExtractionArtifact;
    chunks: readonly SourceChunk[];
  }>;
}

const emptyState = (generatedAt: string): ValidatedSourceReviewState => ({
  feed: SourceReviewTicketFeedSchema.parse({
    schemaVersion: 1,
    projectionVersion: 1,
    generatedAt,
    tickets: [],
  }),
  locators: SourceReviewPrivateLocatorManifestSchema.parse({
    schemaVersion: 1,
    manifestVersion: 1,
    generatedAt,
    entries: [],
  }),
  inspectedArtifacts: [],
});

const loadValidatedState = async (
  options: PrepareSourceReviewPacketsOptions,
): Promise<ValidatedSourceReviewState | null> => {
  const sourceRoot = resolve(options.sourceRoot ?? DEFAULT_SOURCE_ROOT);
  const generatedRoot = resolve(options.generatedRoot ?? DEFAULT_GENERATED_ROOT);
  const feedPath = resolve(options.feedPath ?? DEFAULT_FEED_PATH);
  const locatorPath = resolve(options.locatorPath ?? DEFAULT_LOCATOR_PATH);
  const feedExists = await exists(feedPath);
  const locatorExists = await exists(locatorPath);
  if (!feedExists && !locatorExists) return null;
  if (feedExists !== locatorExists) {
    throw new Error('Source-review feed and private locator must exist as a pair.');
  }
  const feed = SourceReviewTicketFeedSchema.parse(
    await readPrivateJson(feedPath, generatedRoot, 'Source-review ticket feed'),
  );
  const locators = SourceReviewPrivateLocatorManifestSchema.parse(
    await readPrivateJson(
      locatorPath,
      resolve(sourceRoot, 'manifests'),
      'Source-review locator manifest',
    ),
  );
  const targetIds = publicTargetSet(options);
  const ticketIds = new Set<string>();
  const packetHashes = new Set<string>();
  for (const locator of locators.entries) {
    if (ticketIds.has(locator.ticketId)) {
      throw new Error(`Duplicate private locator ticket ID: ${locator.ticketId}`);
    }
    ticketIds.add(locator.ticketId);
    if (packetHashes.has(locator.packetHash)) {
      throw new Error(`Duplicate private locator packet hash: ${locator.packetHash}`);
    }
    packetHashes.add(locator.packetHash);
  }
  if (locators.entries.length !== feed.tickets.length) {
    throw new Error('Source-review feed and locator manifest are not one-to-one.');
  }
  const locatorsByTicket = new Map(locators.entries.map((entry) => [entry.ticketId, entry]));
  const inspectedArtifacts: ValidatedSourceReviewState['inspectedArtifacts'] = [];
  for (const ticket of feed.tickets) {
    assertPublicTargets(ticket, targetIds);
    const snapshot = ticket.sourceReviewSnapshot!;
    const locator = locatorsByTicket.get(ticket.id);
    if (!locator || locator.packetHash !== snapshot.packetHash) {
      throw new Error(`Source-review ticket ${ticket.id} has no matching private locator.`);
    }
    const artifactPath = resolve(sourceRoot, 'extracted', `${locator.documentId}.json`);
    const artifact = parseExtractionArtifact(
      await readPrivateJson(
        artifactPath,
        resolve(sourceRoot, 'extracted'),
        'Source-review extraction artifact',
      ),
    );
    if (
      artifact.document.id !== locator.documentId ||
      artifact.document.parserVersion !== locator.parserVersion
    ) {
      throw new Error(`Source-review locator ${ticket.id} resolved the wrong source document.`);
    }
    const chunks = selectCompleteSection(artifact, locator.selector);
    const recomputedMaterial = locatorMaterial(artifact, chunks);
    const storedMaterial = {
      documentId: locator.documentId,
      parserVersion: locator.parserVersion,
      documentExtractedTextHash: locator.documentExtractedTextHash,
      extractionWarnings: locator.extractionWarnings,
      extractionWarningCount: locator.extractionWarningCount,
      selector: locator.selector,
      chunks: locator.chunks,
    };
    const sourceUnitFingerprint = sourceUnitFingerprintFor(recomputedMaterial);
    if (
      canonicalSourceReviewJson(storedMaterial) !== canonicalSourceReviewJson(recomputedMaterial) ||
      locator.sourceUnitFingerprint !== sourceUnitFingerprint ||
      snapshot.sourceUnitFingerprint !== sourceUnitFingerprint
    ) {
      throw new Error(`Source-review locator ${ticket.id} no longer matches its source artifact.`);
    }
    const snapshotWithoutHash = Object.fromEntries(
      Object.entries(snapshot).filter(([key]) => key !== 'packetHash'),
    ) as Omit<SourceReviewSnapshot, 'packetHash'>;
    if (
      calculateSourceReviewPacketHash(snapshotWithoutHash) !== snapshot.packetHash ||
      locator.packetHash !== snapshot.packetHash
    ) {
      throw new Error(`Source-review ticket ${ticket.id} has an invalid packet hash.`);
    }
    inspectedArtifacts.push({ artifact, chunks });
  }
  assertSafeProjectionDoesNotExposeLocators(feed, inspectedArtifacts);
  return { feed, locators, inspectedArtifacts };
};

export const prepareSourceReviewPackets = async (
  options: PrepareSourceReviewPacketsOptions = {},
): Promise<SourceReviewPacketReport> => {
  const sourceRoot = resolve(options.sourceRoot ?? DEFAULT_SOURCE_ROOT);
  const generatedRoot = resolve(options.generatedRoot ?? DEFAULT_GENERATED_ROOT);
  const draftPath = resolve(options.draftPath ?? DEFAULT_DRAFT_PATH);
  const feedPath = resolve(options.feedPath ?? DEFAULT_FEED_PATH);
  const locatorPath = resolve(options.locatorPath ?? DEFAULT_LOCATOR_PATH);
  await prepareOutputPath(feedPath, generatedRoot, 'Source-review ticket feed');
  await prepareOutputPath(
    locatorPath,
    resolve(sourceRoot, 'manifests'),
    'Source-review locator manifest',
  );
  const draft = SourceReviewDraftSchema.parse(
    await readPrivateJson(draftPath, resolve(sourceRoot, 'manifests'), 'Source-review draft'),
  );
  const prior = (await loadValidatedState(options)) ?? emptyState(draft.generatedAt);
  const unit = draft.units[0]!;
  const artifactPath = resolve(sourceRoot, 'extracted', `${unit.documentId}.json`);
  const artifact = parseExtractionArtifact(
    await readPrivateJson(
      artifactPath,
      resolve(sourceRoot, 'extracted'),
      'Source-review extraction artifact',
    ),
  );
  if (
    artifact.document.id !== unit.documentId ||
    artifact.document.parserVersion !== 'psychsim-source-parser-5'
  ) {
    throw new Error(`Source-review unit ${unit.id} requires its parser-v5 source document.`);
  }
  assertWarningBoundary(unit, artifact);
  const chunks = selectCompleteSection(artifact, unit.selector);
  const material = locatorMaterial(artifact, chunks);
  const sourceUnitFingerprint = sourceUnitFingerprintFor(material);
  const snapshotWithoutHash: Omit<SourceReviewSnapshot, 'packetHash'> = {
    schemaVersion: 1,
    packetVersion: 1,
    sourceUnitFingerprint,
    projectionPolicy: 'original_paraphrase_no_source_text',
    derivedDisplayTitle: unit.derivedDisplayTitle,
    decisionQuestion: unit.decisionQuestion,
    proposedRouting: unit.proposedRouting,
    reviewContext: {
      ticketType: unit.ticketType,
      priority: unit.priority,
      requiresClinicalAcumen: unit.requiresClinicalAcumen,
      dependencyTicketIds: unit.dependencyTicketIds,
      conflictContentIds: unit.conflictContentIds,
      resurfacingTrigger: unit.resurfacingTrigger,
    },
    originalSummary: unit.originalSummary,
    atomicProposals: unit.atomicProposals,
    publicTargetContentIds: unit.publicTargetContentIds,
    unresolvedTargetLabels: unit.unresolvedTargetLabels,
    uncertainty: unit.uncertainty,
    conflicts: unit.conflicts,
    currentness: unit.currentness,
    rightsState: unit.rightsState,
    boundaryState: unit.boundaryState,
    boundaryQuestion: unit.boundaryQuestion,
    medicalReviewStatus: 'unreviewed',
    runtimeEffect: false,
  };
  const packetHash = calculateSourceReviewPacketHash(snapshotWithoutHash);
  const snapshot = SourceReviewSnapshotSchema.parse({
    ...snapshotWithoutHash,
    packetHash,
  });
  const ticketId = `ticket.source-review.${packetHash.slice(0, 24)}`;
  const ticket = ClinicalReviewTicketSchema.parse({
    schemaVersion: 1,
    id: ticketId,
    title: snapshot.derivedDisplayTitle,
    sourceKind: 'source_claim',
    sourceAuthority: 'source_document',
    ticketType: unit.ticketType,
    priority: unit.priority,
    status: 'proposed',
    requiresClinicalAcumen: unit.requiresClinicalAcumen,
    attemptId: null,
    blueprintId: null,
    caseContentVersion: null,
    receiptItemId: null,
    receiptItemSnapshot: null,
    targetContentIds: snapshot.publicTargetContentIds,
    dependencyTicketIds: unit.dependencyTicketIds,
    conflictContentIds: unit.conflictContentIds,
    proposedRouting: snapshot.proposedRouting,
    guidance: snapshot.decisionQuestion,
    sourceReviewSnapshot: snapshot,
    reviewerNotes: '',
    reviewerNotesUpdatedAt: null,
    resurfacingTrigger: unit.resurfacingTrigger,
    resolution: null,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
  });
  assertPublicTargets(ticket, publicTargetSet(options));
  const newLocator = SourceReviewPrivateLocatorSchema.parse({
    schemaVersion: 1,
    ticketId,
    packetHash,
    sourceUnitFingerprint,
    draftUnitId: unit.id,
    ...material,
  });
  const existingTicket = prior.feed.tickets.find(
    (candidate) => candidate.sourceReviewSnapshot?.packetHash === packetHash,
  );
  const priorPacketForSourceUnit = prior.locators.entries.find(
    (candidate) => candidate.sourceUnitFingerprint === sourceUnitFingerprint,
  );
  if (priorPacketForSourceUnit && !existingTicket) {
    throw new Error(
      'This source unit already has a different immutable packet. A future explicit supersession record is required before replacing it.',
    );
  }
  const tickets = existingTicket ? prior.feed.tickets : [...prior.feed.tickets, ticket];
  const entries = existingTicket ? prior.locators.entries : [...prior.locators.entries, newLocator];
  const feed = SourceReviewTicketFeedSchema.parse({
    schemaVersion: 1,
    projectionVersion: 1,
    generatedAt: draft.generatedAt,
    tickets,
  });
  const locatorManifest = SourceReviewPrivateLocatorManifestSchema.parse({
    schemaVersion: 1,
    manifestVersion: 1,
    generatedAt: draft.generatedAt,
    entries,
  });
  assertSafeProjectionDoesNotExposeLocators(feed, [
    ...prior.inspectedArtifacts,
    { artifact, chunks },
  ]);
  await writePrivateJsonPairTransaction(
    { path: locatorPath, value: locatorManifest },
    { path: feedPath, value: feed },
  );
  const validated = await loadValidatedState(options);
  if (!validated) throw new Error('Source-review output pair was not persisted.');
  return {
    tickets: validated.feed.tickets.length,
    sourceUnits: validated.locators.entries.length,
    feedPath,
    locatorPath,
  };
};

export const validateSourceReviewPrivateState = async (
  options: PrepareSourceReviewPacketsOptions = {},
): Promise<SourceReviewPacketReport | null> => {
  const feedPath = resolve(options.feedPath ?? DEFAULT_FEED_PATH);
  const locatorPath = resolve(options.locatorPath ?? DEFAULT_LOCATOR_PATH);
  const state = await loadValidatedState(options);
  return state
    ? {
        tickets: state.feed.tickets.length,
        sourceUnits: state.locators.entries.length,
        feedPath,
        locatorPath,
      }
    : null;
};
