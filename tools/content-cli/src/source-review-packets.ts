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
  AppleNotesCodexReviewPacketSchema,
  ClinicalReviewTicketSchema,
  SchemaVersionSchema,
  SourceChunkSchema,
  SourceDocumentSchema,
  SourceReviewAtomicProposalSchema,
  SourceReviewSnapshotSchema,
  SourceReviewTicketFeedSchema,
  StableIdSchema,
  type ClinicalReviewTicket,
  type DeveloperOpinionCandidate,
  type PersonalKnowledgePilotQueueEntry,
  type PersonalKnowledgeSemanticRun,
  type PersonalKnowledgeWorkspace,
  type SourceChunk,
  type SourceReviewSnapshot,
  type SourceReviewTicketFeed,
} from '@psychsim/schemas';
import { z } from 'zod';
import { validateAppleNotesCodexReviewAudit } from './apple-notes-codex-review';
import {
  loadPersonalKnowledgePilotProfile,
  loadPersonalKnowledgePilotQueue,
  loadPersonalKnowledgeWorkspace,
  validatePersonalKnowledgePrivateState,
  validatePersonalKnowledgeWorkspace,
} from './personal-knowledge-workspace';
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
    atomicProposals: z.array(SourceReviewAtomicProposalSchema).min(1).max(8),
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

const StructuredSourceReviewPrivateLocatorSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    locatorKind: z.literal('parser_v5_section'),
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

const PersonalKnowledgeCandidateFingerprintSchema = z
  .object({
    id: StableIdSchema,
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

const PersonalKnowledgeOpinionFingerprintSchema =
  PersonalKnowledgeCandidateFingerprintSchema.extend({
    safeProposalId: StableIdSchema,
  }).strict();

const PersonalKnowledgeSourceReviewPrivateLocatorSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    locatorKind: z.literal('personal_knowledge_classification'),
    ticketId: StableIdSchema,
    packetHash: z.string().regex(/^[a-f0-9]{64}$/),
    sourceUnitFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    profileId: StableIdSchema,
    queueEntryId: StableIdSchema,
    noteRecordId: StableIdSchema,
    sourceDocumentId: StableIdSchema,
    titleHash: z.string().regex(/^[a-f0-9]{64}$/),
    plaintextHash: z.string().regex(/^[a-f0-9]{64}$/),
    expectedSegmentCount: z.number().int().positive().max(2048),
    semanticRuns: z
      .array(
        z
          .object({
            id: StableIdSchema,
            runFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
            packetId: StableIdSchema,
            packetSha256: z.string().regex(/^[a-f0-9]{64}$/),
            outputSha256: z.string().regex(/^[a-f0-9]{64}$/),
            auditEntryId: StableIdSchema,
            auditEntryFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
            segmentOrdinal: z.number().int().nonnegative().max(2047),
            segmentHash: z.string().regex(/^[a-f0-9]{64}$/),
            modelIdentifier: z.string().min(1).max(200),
            promptVersion: z.string().min(1).max(120),
            classifiedAt: z.string().datetime(),
          })
          .strict(),
      )
      .min(1)
      .max(2048),
    sourceUnitCandidates: z.array(PersonalKnowledgeCandidateFingerprintSchema).min(1).max(100),
    opinionCandidates: z.array(PersonalKnowledgeOpinionFingerprintSchema).min(1).max(8),
    bibliographicCandidates: z.array(PersonalKnowledgeCandidateFingerprintSchema).max(100),
  })
  .strict();

const SourceReviewPrivateLocatorSchema = z.discriminatedUnion('locatorKind', [
  StructuredSourceReviewPrivateLocatorSchema,
  PersonalKnowledgeSourceReviewPrivateLocatorSchema,
]);

const SourceReviewPrivateLocatorManifestSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    manifestVersion: z.literal(1),
    generatedAt: z.string().datetime(),
    entries: z.array(SourceReviewPrivateLocatorSchema).max(100),
  })
  .strict();

const parseSourceReviewPrivateLocatorManifest = (
  value: unknown,
): z.infer<typeof SourceReviewPrivateLocatorManifestSchema> => {
  const migrated = z
    .object({
      schemaVersion: SchemaVersionSchema,
      manifestVersion: z.literal(1),
      generatedAt: z.string().datetime(),
      entries: z.array(z.record(z.string(), z.unknown())).max(100),
    })
    .strict()
    .parse(value);
  return SourceReviewPrivateLocatorManifestSchema.parse({
    ...migrated,
    entries: migrated.entries.map((entry) =>
      entry.locatorKind === undefined ? { ...entry, locatorKind: 'parser_v5_section' } : entry,
    ),
  });
};

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
  z.infer<typeof StructuredSourceReviewPrivateLocatorSchema>,
  'schemaVersion' | 'ticketId' | 'packetHash' | 'sourceUnitFingerprint' | 'draftUnitId'
> => ({
  locatorKind: 'parser_v5_section',
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

const sourceUnitFingerprintFor = (material: ReturnType<typeof locatorMaterial>): string => {
  const legacyFingerprintMaterial = Object.fromEntries(
    Object.entries(material).filter(([key]) => key !== 'locatorKind'),
  );
  return sha256(canonicalSourceReviewJson(legacyFingerprintMaterial));
};

type PersonalKnowledgeReviewContext = {
  profile: Awaited<ReturnType<typeof loadPersonalKnowledgePilotProfile>>;
  queue: NonNullable<Awaited<ReturnType<typeof loadPersonalKnowledgePilotQueue>>>;
  workspace: NonNullable<Awaited<ReturnType<typeof loadPersonalKnowledgeWorkspace>>>;
  audit: NonNullable<Awaited<ReturnType<typeof validateAppleNotesCodexReviewAudit>>>;
  packetsById: ReadonlyMap<string, z.infer<typeof AppleNotesCodexReviewPacketSchema>>;
};

type PersonalKnowledgeReviewMaterial = Omit<
  z.infer<typeof PersonalKnowledgeSourceReviewPrivateLocatorSchema>,
  'schemaVersion' | 'ticketId' | 'packetHash' | 'sourceUnitFingerprint'
>;

const candidateFingerprint = (candidate: {
  id: string;
}): {
  id: string;
  fingerprint: string;
} => ({
  id: candidate.id,
  fingerprint: sha256(canonicalSourceReviewJson(candidate)),
});

const safeProposalIdForCandidate = (candidate: { id: string }): string =>
  `source-proposal.personal-knowledge.${candidateFingerprint(candidate).fingerprint.slice(0, 24)}`;

const uniqueSortedStrings = (values: readonly string[]): string[] =>
  [...new Set(values)].sort((left, right) => left.localeCompare(right));

const personalKnowledgeAtomicProposalsFor = (
  opinionCandidates: readonly DeveloperOpinionCandidate[],
) =>
  opinionCandidates.map((candidate) => {
    if (candidate.summary.length > 400) {
      throw new Error(
        `Personal-knowledge opinion ${candidate.id} is too long for a concise review packet.`,
      );
    }
    return SourceReviewAtomicProposalSchema.parse({
      schemaVersion: 1,
      id: safeProposalIdForCandidate(candidate),
      proposalType: 'developer_opinion',
      summary: candidate.summary,
      publicTargetContentIds: uniqueSortedStrings(
        candidate.targets.flatMap((target) =>
          target.resolution === 'resolved' ? [target.targetContentId] : [],
        ),
      ),
      unresolvedTargetLabels: uniqueSortedStrings(
        candidate.targets.flatMap((target) =>
          target.resolution === 'unresolved' ? [target.searchLabel] : [],
        ),
      ),
      uncertainty: [
        'Currentness, formal evidence support, and any later point balance remain separately unreviewed.',
      ],
    });
  });

const loadPersonalKnowledgeReviewContext = async (
  sourceRoot: string,
): Promise<PersonalKnowledgeReviewContext> => {
  await validatePersonalKnowledgePrivateState(sourceRoot);
  const profile = await loadPersonalKnowledgePilotProfile();
  const [queue, workspace, audit] = await Promise.all([
    loadPersonalKnowledgePilotQueue(profile.id, sourceRoot),
    loadPersonalKnowledgeWorkspace(sourceRoot),
    validateAppleNotesCodexReviewAudit(sourceRoot),
  ]);
  if (!queue || !workspace || !audit) {
    throw new Error(
      'Personal-knowledge review requires validated queue, workspace, and audit state.',
    );
  }
  validatePersonalKnowledgeWorkspace(workspace);
  if (queue.profileId !== profile.id) {
    throw new Error('Personal-knowledge queue does not match its tracked pilot profile.');
  }
  const packetsById = new Map<string, z.infer<typeof AppleNotesCodexReviewPacketSchema>>();
  for (const auditEntry of audit.entries) {
    const packetPath = resolve(sourceRoot, auditEntry.packetRelativePath);
    await assertPathUnderRoot(packetPath, sourceRoot, 'Personal-knowledge review packet');
    await assertRegularPrivateFile(packetPath, 'Personal-knowledge review packet');
    const packet = AppleNotesCodexReviewPacketSchema.parse(
      JSON.parse(await readFile(packetPath, 'utf8')) as unknown,
    );
    packetsById.set(packet.id, packet);
  }
  return { profile, queue, workspace, audit, packetsById };
};

const personalKnowledgeMaterialForEntry = (
  entry: PersonalKnowledgePilotQueueEntry,
  context: PersonalKnowledgeReviewContext,
): {
  material: PersonalKnowledgeReviewMaterial;
  sourceUnitCandidates: PersonalKnowledgeWorkspace['sourceUnitCandidates'];
  opinionCandidates: DeveloperOpinionCandidate[];
  bibliographicCandidates: PersonalKnowledgeWorkspace['bibliographicCandidates'];
} => {
  if (
    !['classified', 'adjudicated'].includes(entry.state) ||
    entry.expectedSegmentCount === null ||
    entry.classifiedSegmentOrdinals.length !== entry.expectedSegmentCount
  ) {
    throw new Error('A personal-knowledge review packet requires one fully classified revision.');
  }
  const auditByPacket = new Map(
    context.audit.entries.map((auditEntry) => [auditEntry.packetId, auditEntry]),
  );
  const runByPacket = new Map(context.workspace.semanticRuns.map((run) => [run.packetId, run]));
  const orderedAuditEntries = entry.releasedPacketIds
    .map((packetId) => auditByPacket.get(packetId))
    .sort((left, right) => (left?.segmentOrdinal ?? -1) - (right?.segmentOrdinal ?? -1));
  if (
    orderedAuditEntries.length !== entry.expectedSegmentCount ||
    orderedAuditEntries.some(
      (auditEntry, index) =>
        !auditEntry ||
        auditEntry.noteRecordId !== entry.noteRecordId ||
        auditEntry.relatedSourceDocumentId !== entry.sourceDocumentId ||
        auditEntry.titleHash !== entry.titleHash ||
        auditEntry.plaintextHash !== entry.plaintextHash ||
        auditEntry.segmentOrdinal !== index,
    )
  ) {
    throw new Error('Personal-knowledge review revision no longer matches its audited packets.');
  }
  const runs = orderedAuditEntries.map((auditEntry) => runByPacket.get(auditEntry!.packetId));
  if (runs.some((run): run is undefined => !run)) {
    throw new Error('Personal-knowledge review revision is missing a semantic run.');
  }
  const typedRuns = runs as PersonalKnowledgeSemanticRun[];
  const runIds = new Set(typedRuns.map((run) => run.id));
  const sourceUnitCandidates = context.workspace.sourceUnitCandidates
    .filter((candidate) => runIds.has(candidate.semanticRunId))
    .sort((left, right) => left.id.localeCompare(right.id));
  const opinionCandidates = context.workspace.opinionCandidates
    .filter((candidate) => runIds.has(candidate.semanticRunId))
    .sort((left, right) => left.id.localeCompare(right.id));
  const bibliographicCandidates = context.workspace.bibliographicCandidates
    .filter((candidate) => runIds.has(candidate.semanticRunId))
    .sort((left, right) => left.id.localeCompare(right.id));
  if (
    sourceUnitCandidates.length === 0 ||
    opinionCandidates.length === 0 ||
    sourceUnitCandidates.some(
      (candidate) =>
        candidate.boundaryState !== 'complete' ||
        candidate.rightsState !== 'private_processing_only' ||
        candidate.reviewStatus !== 'proposed' ||
        candidate.currentness !== 'needs_currentness_review',
    ) ||
    opinionCandidates.some(
      (candidate) =>
        candidate.reviewStatus !== 'proposed' ||
        candidate.medicalReviewStatus !== 'unreviewed' ||
        candidate.currentness !== 'needs_currentness_review' ||
        !candidate.needsHumanReview,
    ) ||
    bibliographicCandidates.some(
      (candidate) =>
        candidate.reviewStatus !== 'proposed' ||
        candidate.verificationStatus !== 'unverified' ||
        candidate.matchedEvidenceSourceId !== null,
    )
  ) {
    throw new Error(
      'Personal-knowledge review may project only complete, private, entirely unreviewed candidates.',
    );
  }
  const sourceUnitCandidateIds = new Set(sourceUnitCandidates.map((candidate) => candidate.id));
  const opinionCandidateIds = new Set(opinionCandidates.map((candidate) => candidate.id));
  const bibliographicCandidateIds = new Set(
    bibliographicCandidates.map((candidate) => candidate.id),
  );
  if (
    bibliographicCandidates.some(
      (candidate) =>
        candidate.sourceUnitIds.length > 0 ||
        candidate.sourceUnitCandidateIds.some((id) => !sourceUnitCandidateIds.has(id)),
    ) ||
    opinionCandidates.some(
      (candidate) =>
        candidate.sourceUnitIds.length > 0 ||
        candidate.sourceUnitCandidateIds.some((id) => !sourceUnitCandidateIds.has(id)) ||
        candidate.nearbyBibliographicCandidateIds.some((id) => !bibliographicCandidateIds.has(id)),
    )
  ) {
    throw new Error(
      'Personal-knowledge review candidates cross the selected source-revision boundary.',
    );
  }
  if (
    context.workspace.sourceUnits.some((unit) =>
      unit.originCandidateIds.some((id) => sourceUnitCandidateIds.has(id)),
    ) ||
    context.workspace.opinions.some((opinion) =>
      opinion.originCandidateIds.some((id) => opinionCandidateIds.has(id)),
    )
  ) {
    throw new Error('Reviewed personal-knowledge records cannot be reprojected as new candidates.');
  }
  const material: PersonalKnowledgeReviewMaterial = {
    locatorKind: 'personal_knowledge_classification',
    profileId: context.profile.id,
    queueEntryId: entry.id,
    noteRecordId: entry.noteRecordId,
    sourceDocumentId: entry.sourceDocumentId,
    titleHash: entry.titleHash,
    plaintextHash: entry.plaintextHash,
    expectedSegmentCount: entry.expectedSegmentCount,
    semanticRuns: typedRuns.map((run) => {
      const auditEntry = auditByPacket.get(run.packetId)!;
      return {
        id: run.id,
        runFingerprint: sha256(canonicalSourceReviewJson(run)),
        packetId: run.packetId,
        packetSha256: run.packetSha256,
        outputSha256: run.outputSha256,
        auditEntryId: auditEntry.id,
        auditEntryFingerprint: sha256(canonicalSourceReviewJson(auditEntry)),
        segmentOrdinal: auditEntry.segmentOrdinal,
        segmentHash: auditEntry.segmentHash,
        modelIdentifier: run.modelIdentifier,
        promptVersion: run.promptVersion,
        classifiedAt: run.classifiedAt,
      };
    }),
    sourceUnitCandidates: sourceUnitCandidates.map(candidateFingerprint),
    opinionCandidates: opinionCandidates.map((candidate) => ({
      ...candidateFingerprint(candidate),
      safeProposalId: safeProposalIdForCandidate(candidate),
    })),
    bibliographicCandidates: bibliographicCandidates.map(candidateFingerprint),
  };
  return { material, sourceUnitCandidates, opinionCandidates, bibliographicCandidates };
};

const personalKnowledgeSourceUnitFingerprintFor = (
  material: PersonalKnowledgeReviewMaterial,
): string => sha256(canonicalSourceReviewJson(material));

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

const assertSafeProjectionDoesNotExposePersonalKnowledgeLocators = (
  feed: SourceReviewTicketFeed,
  locators: readonly z.infer<typeof PersonalKnowledgeSourceReviewPrivateLocatorSchema>[],
  context: PersonalKnowledgeReviewContext | null,
): void => {
  if (locators.length > 0 && !context) {
    throw new Error('Personal-knowledge safe projection requires its private validation context.');
  }
  const serialized = JSON.stringify(feed);
  const forbidden = locators.flatMap((locator) => [
    locator.queueEntryId,
    locator.noteRecordId,
    locator.sourceDocumentId,
    locator.titleHash,
    locator.plaintextHash,
    ...locator.semanticRuns.flatMap((run) => [
      run.id,
      run.runFingerprint,
      run.packetId,
      run.packetSha256,
      run.outputSha256,
      run.auditEntryId,
      run.auditEntryFingerprint,
      run.segmentHash,
      context?.packetsById.get(run.packetId)?.title ?? '',
      context?.packetsById.get(run.packetId)?.plaintextSegment ?? '',
    ]),
    ...locator.sourceUnitCandidates.flatMap((candidate) => [candidate.id, candidate.fingerprint]),
    ...locator.opinionCandidates.flatMap((candidate) => [candidate.id, candidate.fingerprint]),
    ...locator.bibliographicCandidates.flatMap((candidate) => [
      candidate.id,
      candidate.fingerprint,
    ]),
    ...(context?.workspace.sourceUnitCandidates
      .filter((candidate) =>
        locator.sourceUnitCandidates.some((reference) => reference.id === candidate.id),
      )
      .flatMap((candidate) => [
        candidate.title ?? '',
        candidate.byline ?? '',
        candidate.venue ?? '',
        candidate.url ?? '',
      ]) ?? []),
    ...(context?.workspace.bibliographicCandidates
      .filter((candidate) =>
        locator.bibliographicCandidates.some((reference) => reference.id === candidate.id),
      )
      .flatMap((candidate) => [
        candidate.title ?? '',
        candidate.citationText ?? '',
        candidate.url ?? '',
      ]) ?? []),
  ]);
  if (forbidden.filter((value) => value.length > 0).some((value) => serialized.includes(value))) {
    throw new Error(
      'Source-review safe projection exposes a private personal-knowledge locator or hash.',
    );
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
  const locators = parseSourceReviewPrivateLocatorManifest(
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
  let personalKnowledgeContext: PersonalKnowledgeReviewContext | null = null;
  for (const ticket of feed.tickets) {
    assertPublicTargets(ticket, targetIds);
    const snapshot = ticket.sourceReviewSnapshot!;
    const locator = locatorsByTicket.get(ticket.id);
    if (!locator || locator.packetHash !== snapshot.packetHash) {
      throw new Error(`Source-review ticket ${ticket.id} has no matching private locator.`);
    }
    if (locator.locatorKind === 'parser_v5_section') {
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
        locatorKind: locator.locatorKind,
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
        canonicalSourceReviewJson(storedMaterial) !==
          canonicalSourceReviewJson(recomputedMaterial) ||
        locator.sourceUnitFingerprint !== sourceUnitFingerprint ||
        snapshot.sourceUnitFingerprint !== sourceUnitFingerprint
      ) {
        throw new Error(
          `Source-review locator ${ticket.id} no longer matches its source artifact.`,
        );
      }
      inspectedArtifacts.push({ artifact, chunks });
    } else {
      personalKnowledgeContext ??= await loadPersonalKnowledgeReviewContext(sourceRoot);
      const entry = personalKnowledgeContext.queue.entries.find(
        (candidate) => candidate.id === locator.queueEntryId,
      );
      if (!entry) {
        throw new Error(`Source-review locator ${ticket.id} no longer has its queue entry.`);
      }
      const { material, opinionCandidates } = personalKnowledgeMaterialForEntry(
        entry,
        personalKnowledgeContext,
      );
      const sourceUnitFingerprint = personalKnowledgeSourceUnitFingerprintFor(material);
      const storedMaterial = Object.fromEntries(
        Object.entries(locator).filter(
          ([key]) =>
            !['schemaVersion', 'ticketId', 'packetHash', 'sourceUnitFingerprint'].includes(key),
        ),
      );
      if (
        canonicalSourceReviewJson(storedMaterial) !== canonicalSourceReviewJson(material) ||
        locator.sourceUnitFingerprint !== sourceUnitFingerprint ||
        snapshot.sourceUnitFingerprint !== sourceUnitFingerprint ||
        canonicalSourceReviewJson(snapshot.atomicProposals) !==
          canonicalSourceReviewJson(personalKnowledgeAtomicProposalsFor(opinionCandidates))
      ) {
        throw new Error(
          `Source-review locator ${ticket.id} no longer matches its personal-knowledge classification.`,
        );
      }
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
  }
  assertSafeProjectionDoesNotExposeLocators(feed, inspectedArtifacts);
  assertSafeProjectionDoesNotExposePersonalKnowledgeLocators(
    feed,
    locators.entries.filter(
      (locator): locator is z.infer<typeof PersonalKnowledgeSourceReviewPrivateLocatorSchema> =>
        locator.locatorKind === 'personal_knowledge_classification',
    ),
    personalKnowledgeContext,
  );
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

export const preparePersonalKnowledgeSourceReviewPacket = async (
  options: PrepareSourceReviewPacketsOptions = {},
): Promise<SourceReviewPacketReport> => {
  const sourceRoot = resolve(options.sourceRoot ?? DEFAULT_SOURCE_ROOT);
  const generatedRoot = resolve(options.generatedRoot ?? DEFAULT_GENERATED_ROOT);
  const feedPath = resolve(options.feedPath ?? DEFAULT_FEED_PATH);
  const locatorPath = resolve(options.locatorPath ?? DEFAULT_LOCATOR_PATH);
  await prepareOutputPath(feedPath, generatedRoot, 'Source-review ticket feed');
  await prepareOutputPath(
    locatorPath,
    resolve(sourceRoot, 'manifests'),
    'Source-review locator manifest',
  );
  const context = await loadPersonalKnowledgeReviewContext(sourceRoot);
  const prior = (await loadValidatedState(options)) ?? emptyState(context.workspace.updatedAt);
  const representedQueueEntryIds = new Set(
    prior.locators.entries
      .filter(
        (locator): locator is z.infer<typeof PersonalKnowledgeSourceReviewPrivateLocatorSchema> =>
          locator.locatorKind === 'personal_knowledge_classification',
      )
      .map((locator) => locator.queueEntryId),
  );
  const entry =
    context.queue.entries.find(
      (candidate) =>
        candidate.state === 'classified' && !representedQueueEntryIds.has(candidate.id),
    ) ??
    context.queue.entries.find(
      (candidate) => candidate.state === 'classified' && representedQueueEntryIds.has(candidate.id),
    );
  if (!entry) {
    throw new Error('No fully classified personal-knowledge revision is ready for review.');
  }
  const { material, opinionCandidates, bibliographicCandidates } =
    personalKnowledgeMaterialForEntry(entry, context);
  if (opinionCandidates.length > 8) {
    throw new Error(
      'One personal-knowledge review revision cannot contain more than eight atomic opinions.',
    );
  }
  const sourceUnitFingerprint = personalKnowledgeSourceUnitFingerprintFor(material);
  const atomicProposals = personalKnowledgeAtomicProposalsFor(opinionCandidates);
  const publicTargetContentIds = uniqueSortedStrings(
    atomicProposals.flatMap((proposal) => proposal.publicTargetContentIds),
  );
  const unresolvedTargetLabels = uniqueSortedStrings(
    atomicProposals.flatMap((proposal) => proposal.unresolvedTargetLabels),
  );
  const generatedAt = material.semanticRuns
    .map((run) => run.classifiedAt)
    .sort()
    .at(-1)!;
  const snapshotWithoutHash: Omit<SourceReviewSnapshot, 'packetHash'> = {
    schemaVersion: 1,
    packetVersion: 1,
    sourceUnitFingerprint,
    projectionPolicy: 'original_paraphrase_no_source_text',
    derivedDisplayTitle: 'Review one classified personal-knowledge revision',
    decisionQuestion:
      'Which candidate opinions should be preserved, revised, rejected, or sent for current evidence review?',
    proposedRouting:
      'Record reviewer guidance only. The response creates no clinical rule, point value, formal evidence relationship, or approval.',
    reviewContext: {
      ticketType: publicTargetContentIds.some((id) => id.startsWith('medication.'))
        ? 'medication_fit'
        : 'clinical_conflict',
      priority: 'medium',
      requiresClinicalAcumen: true,
      dependencyTicketIds: [],
      conflictContentIds: [],
      resurfacingTrigger:
        'Resurface each preserved opinion when a new overlapping formal source is added.',
    },
    originalSummary: `One fully classified personal-knowledge revision yielded ${opinionCandidates.length} concise Developer-opinion candidate${opinionCandidates.length === 1 ? '' : 's'} for human review.`,
    atomicProposals,
    publicTargetContentIds,
    unresolvedTargetLabels,
    uncertainty: [
      `${bibliographicCandidates.length} nearby bibliographic lead${bibliographicCandidates.length === 1 ? '' : 's'} remain unverified and are not evidence.`,
      'These candidates are medically unreviewed and have no gameplay effect.',
    ],
    conflicts: [],
    currentness: {
      status: 'needs_currentness_review',
      evaluatedThrough: null,
      note: 'No current literature comparison has yet been attached to these personal takeaways.',
    },
    rightsState: {
      status: 'private_processing_only',
      sourceUseDecisionId: null,
      portableReviewAllowed: false,
      note: 'The user authorized bounded local review of their private Notes; this does not grant formal-source or redistribution rights.',
    },
    boundaryState: 'confirmed',
    boundaryQuestion: null,
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
    ticketType: snapshot.reviewContext.ticketType,
    priority: snapshot.reviewContext.priority,
    status: 'proposed',
    requiresClinicalAcumen: true,
    attemptId: null,
    blueprintId: null,
    caseContentVersion: null,
    receiptItemId: null,
    receiptItemSnapshot: null,
    targetContentIds: snapshot.publicTargetContentIds,
    dependencyTicketIds: [],
    conflictContentIds: [],
    proposedRouting: snapshot.proposedRouting,
    guidance: snapshot.decisionQuestion,
    sourceReviewSnapshot: snapshot,
    reviewerNotes: '',
    reviewerNotesUpdatedAt: null,
    resurfacingTrigger: snapshot.reviewContext.resurfacingTrigger,
    resolution: null,
    createdAt: generatedAt,
    updatedAt: generatedAt,
  });
  assertPublicTargets(ticket, publicTargetSet(options));
  const newLocator = PersonalKnowledgeSourceReviewPrivateLocatorSchema.parse({
    schemaVersion: 1,
    ticketId,
    packetHash,
    sourceUnitFingerprint,
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
      'This personal-knowledge revision already has a different immutable packet. An explicit supersession record is required before replacing it.',
    );
  }
  const tickets = existingTicket ? prior.feed.tickets : [...prior.feed.tickets, ticket];
  const entries = existingTicket ? prior.locators.entries : [...prior.locators.entries, newLocator];
  const feed = SourceReviewTicketFeedSchema.parse({
    schemaVersion: 1,
    projectionVersion: 1,
    generatedAt,
    tickets,
  });
  const locatorManifest = SourceReviewPrivateLocatorManifestSchema.parse({
    schemaVersion: 1,
    manifestVersion: 1,
    generatedAt,
    entries,
  });
  assertSafeProjectionDoesNotExposeLocators(feed, prior.inspectedArtifacts);
  assertSafeProjectionDoesNotExposePersonalKnowledgeLocators(
    feed,
    entries.filter(
      (locator): locator is z.infer<typeof PersonalKnowledgeSourceReviewPrivateLocatorSchema> =>
        locator.locatorKind === 'personal_knowledge_classification',
    ),
    context,
  );
  await writePrivateJsonPairTransaction(
    { path: locatorPath, value: locatorManifest },
    { path: feedPath, value: feed },
  );
  const validated = await loadValidatedState(options);
  if (!validated)
    throw new Error('Personal-knowledge source-review output pair was not persisted.');
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
