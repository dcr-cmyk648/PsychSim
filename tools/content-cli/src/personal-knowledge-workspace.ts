import { createHash } from 'node:crypto';
import {
  access,
  chmod,
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

import {
  AppleNotesCodexReviewPacketSchema,
  PersonalKnowledgeClassificationResultSchema,
  PersonalKnowledgePilotProfileSchema,
  PersonalKnowledgePilotQueueSchema,
  PersonalKnowledgeWorkbenchProjectionSchema,
  PersonalKnowledgeWorkspaceSchema,
  SourceUseDecisionCatalogSchema,
  type AppleNotesIntakeManifest,
  type PersonalKnowledgeClassificationResult,
  type PersonalKnowledgePilotProfile,
  type PersonalKnowledgePilotQueue,
  type PersonalKnowledgePilotQueueEntry,
  type PersonalKnowledgeResolvedTarget,
  type PersonalKnowledgeWorkbenchProjection,
  type PersonalKnowledgeWorkspace,
} from '@psychsim/schemas';
import { catalogs } from '@psychsim/content-runtime';

import sourceUseDecisionsJson from '../../../content/catalogs/evidence/source-use-decisions.json';

import { validateAppleNotesCodexReviewAudit } from './apple-notes-codex-review';
import {
  loadAppleNotesIntakeManifestMetadata,
  readAppleNotesTitlePlaintextSnapshot,
} from './apple-notes-provider';
import { DEFAULT_SOURCE_ROOT } from './source-pipeline';

const DEFAULT_PROFILE_PATH = resolve(
  'content/catalogs/authoring/personal-knowledge/initial-mdd-antidepressant-selection.profile.json',
);
export const DEFAULT_PERSONAL_KNOWLEDGE_PROJECTION_PATH = resolve(
  'content/generated/personal-knowledge/workbench.json',
);
const PRIVATE_SEMANTIC_DIRECTORY = join('extracted', 'apple-notes-private', 'semantic-review');
const MAX_PRIVATE_CLASSIFICATION_BYTES = 2_000_000;
export const PERSONAL_KNOWLEDGE_CLASSIFIER_PROMPT_VERSION = 'personal-knowledge-classifier-1';
const sourceUseDecisions = SourceUseDecisionCatalogSchema.parse(sourceUseDecisionsJson);
const sourceUseDecisionById = new Map(
  sourceUseDecisions.decisions.map((decision) => [decision.id, decision]),
);
const knownEvidenceSourceIds = new Set(
  sourceUseDecisions.decisions.map((decision) => decision.evidenceSourceId),
);

export interface PersonalKnowledgeSnapshot {
  noteRecordId: string;
  sourceDocumentId: string;
  titleHash: string;
  plaintextHash: string;
  sourceModifiedAtProvider: string;
  title: string;
  plaintext: string;
}

export interface PersonalKnowledgeWorkspaceOptions {
  sourceRoot?: string;
  profilePath?: string;
  projectionPath?: string;
  now?: () => string;
}

const sha256 = (value: Uint8Array | string): string =>
  createHash('sha256').update(value).digest('hex');

const timestamp = (options: PersonalKnowledgeWorkspaceOptions): string =>
  options.now?.() ?? new Date().toISOString();

const privatePaths = (
  sourceRoot = DEFAULT_SOURCE_ROOT,
  profileId = 'authoring-pilot.initial-mdd-antidepressant-selection',
) => {
  const root = resolve(sourceRoot);
  const directory = resolve(root, PRIVATE_SEMANTIC_DIRECTORY);
  return {
    root,
    directory,
    queue: join(directory, `${profileId}.queue.json`),
    workspace: join(directory, 'workspace.json'),
  };
};

const pathInside = (root: string, candidate: string): boolean => {
  const relativePath = relative(resolve(root), resolve(candidate));
  return relativePath === '' || (!relativePath.startsWith('..') && !relativePath.startsWith('/'));
};

const exists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const ensurePrivateDirectory = async (root: string, directory: string): Promise<void> => {
  if (!pathInside(root, directory)) {
    throw new Error('Personal-knowledge path resolves outside the protected source root.');
  }
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  const stat = await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o777) !== 0o700) {
    throw new Error('Personal-knowledge workspace directory must be a private 0700 directory.');
  }
  const [resolvedRoot, resolvedDirectory] = await Promise.all([
    realpath(root),
    realpath(directory),
  ]);
  if (!pathInside(resolvedRoot, resolvedDirectory)) {
    throw new Error('Personal-knowledge workspace resolves outside the protected source root.');
  }
};

const writePrivateJsonAtomic = async (
  root: string,
  path: string,
  value: unknown,
): Promise<void> => {
  const directory = dirname(path);
  await ensurePrivateDirectory(root, directory);
  if (!pathInside(root, path)) {
    throw new Error('Personal-knowledge output resolves outside its protected root.');
  }
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  await chmod(temporaryPath, 0o600);
  await rename(temporaryPath, path);
  await chmod(path, 0o600);
};

const readPrivateJson = async (root: string, path: string): Promise<unknown | null> => {
  if (!(await exists(path))) return null;
  if (!pathInside(root, path)) {
    throw new Error('Personal-knowledge input resolves outside its protected root.');
  }
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o777) !== 0o600) {
    throw new Error('Personal-knowledge files must be private regular files with mode 0600.');
  }
  const [resolvedRoot, resolvedPath] = await Promise.all([realpath(root), realpath(path)]);
  if (!pathInside(resolvedRoot, resolvedPath)) {
    throw new Error('Personal-knowledge input resolves outside its protected root.');
  }
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
};

export const readPrivateClassificationResultBytes = async (resultPath: string): Promise<Buffer> => {
  const path = resolve(resultPath);
  const stat = await lstat(path);
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    (stat.mode & 0o777) !== 0o600 ||
    stat.size === 0 ||
    stat.size > MAX_PRIVATE_CLASSIFICATION_BYTES
  ) {
    throw new Error(
      'Personal-knowledge classification input must be a nonempty private 0600 regular file within the size limit.',
    );
  }
  return readFile(path);
};

export const loadPersonalKnowledgePilotProfile = async (
  path = DEFAULT_PROFILE_PATH,
): Promise<PersonalKnowledgePilotProfile> =>
  PersonalKnowledgePilotProfileSchema.parse(JSON.parse(await readFile(path, 'utf8')) as unknown);

const resolvedTargetExists = (target: PersonalKnowledgeResolvedTarget): boolean => {
  switch (target.targetKind) {
    case 'medication':
      return catalogs.medications.some((entry) => entry.id === target.targetContentId);
    case 'diagnosis':
      return catalogs.diagnoses.some((entry) => entry.id === target.targetContentId);
    case 'intervention':
      return catalogs.treatments.some((entry) => entry.id === target.targetContentId);
    case 'test':
      return catalogs.tests.some((entry) => entry.id === target.targetContentId);
    case 'clinical_tag':
      return [
        ...catalogs.medications.flatMap((entry) => entry.tags),
        ...catalogs.diagnoses.flatMap((entry) => entry.baseClinicalTagIds),
      ].includes(target.targetContentId);
    case 'patient_template':
    case 'clinical_rule':
      return false;
  }
};

export const validatePersonalKnowledgePilotProfile = (
  profile: PersonalKnowledgePilotProfile,
): void => {
  const ids = [
    ...profile.requiredTermGroups.map((group) => group.id),
    ...profile.targetMatchers.map((matcher) => matcher.id),
  ];
  if (new Set(ids).size !== ids.length) {
    throw new Error('Personal-knowledge pilot term and matcher IDs must be unique.');
  }
  for (const matcher of profile.targetMatchers) {
    if (!resolvedTargetExists(matcher.target)) {
      throw new Error(`${matcher.id} references an unavailable ${matcher.target.targetContentId}.`);
    }
  }
};

const normalizedText = (value: string): string =>
  value.normalize('NFKC').toLocaleLowerCase('en-US');
const isWordCharacter = (value: string | undefined): boolean =>
  value !== undefined && /[\p{L}\p{N}]/u.test(value);

const literalMatchCount = (haystack: string, term: string): number => {
  const needle = normalizedText(term);
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while (offset <= haystack.length - needle.length) {
    const match = haystack.indexOf(needle, offset);
    if (match < 0) break;
    const before = match > 0 ? haystack[match - 1] : undefined;
    const after = haystack[match + needle.length];
    const startsWithWord = isWordCharacter(needle[0]);
    const endsWithWord = isWordCharacter(needle[needle.length - 1]);
    if (
      (!startsWithWord || !isWordCharacter(before)) &&
      (!endsWithWord || !isWordCharacter(after))
    ) {
      count += 1;
    }
    offset = match + Math.max(needle.length, 1);
  }
  return count;
};

const queueEntryId = (
  profileId: string,
  noteRecordId: string,
  titleHash: string,
  plaintextHash: string,
): string =>
  `personal-knowledge-queue-entry.${sha256(
    `${profileId}|${noteRecordId}|${titleHash}|${plaintextHash}`,
  ).slice(0, 24)}`;

export const buildPersonalKnowledgePilotQueueFromSnapshots = (
  profile: PersonalKnowledgePilotProfile,
  snapshots: readonly PersonalKnowledgeSnapshot[],
  previous: PersonalKnowledgePilotQueue | null,
  generatedAt: string,
): PersonalKnowledgePilotQueue => {
  validatePersonalKnowledgePilotProfile(profile);
  const previousByRevision = new Map(
    (previous?.entries ?? []).map((entry) => [
      `${entry.noteRecordId}|${entry.titleHash}|${entry.plaintextHash}`,
      entry,
    ]),
  );
  const active: PersonalKnowledgePilotQueueEntry[] = [];

  for (const snapshot of snapshots) {
    const searchable = normalizedText(`${snapshot.title}\n${snapshot.plaintext}`);
    const groupMatches = profile.requiredTermGroups.map((group) => ({
      id: group.id,
      count: group.terms.reduce((sum, term) => sum + literalMatchCount(searchable, term), 0),
    }));
    if (groupMatches.some((match) => match.count === 0)) continue;
    const targetMatches = profile.targetMatchers.map((matcher) => ({
      matcher,
      count: matcher.terms.reduce((sum, term) => sum + literalMatchCount(searchable, term), 0),
    }));
    const matchedTargets = targetMatches.filter((match) => match.count > 0);
    const revisionKey = `${snapshot.noteRecordId}|${snapshot.titleHash}|${snapshot.plaintextHash}`;
    const old = previousByRevision.get(revisionKey);
    active.push(
      PersonalKnowledgePilotQueueSchema.shape.entries.element.parse({
        schemaVersion: 1,
        id: queueEntryId(
          profile.id,
          snapshot.noteRecordId,
          snapshot.titleHash,
          snapshot.plaintextHash,
        ),
        profileId: profile.id,
        noteRecordId: snapshot.noteRecordId,
        sourceDocumentId: snapshot.sourceDocumentId,
        titleHash: snapshot.titleHash,
        plaintextHash: snapshot.plaintextHash,
        sourceModifiedAtProvider: snapshot.sourceModifiedAtProvider,
        matchedRequiredGroupIds: groupMatches.map((match) => match.id),
        matchedTargetMatcherIds: matchedTargets.map((match) => match.matcher.id),
        matchedTargetContentIds: [
          ...new Set(matchedTargets.map((match) => match.matcher.target.targetContentId)),
        ],
        distinctSignalCount: groupMatches.length + matchedTargets.length,
        totalMatchCount:
          groupMatches.reduce((sum, match) => sum + match.count, 0) +
          matchedTargets.reduce((sum, match) => sum + match.count, 0),
        state: old?.state ?? 'queued',
        expectedSegmentCount: old?.expectedSegmentCount ?? null,
        releasedPacketIds: old?.releasedPacketIds ?? [],
        releasedSegmentOrdinals: old?.releasedSegmentOrdinals ?? [],
        classifiedSegmentOrdinals: old?.classifiedSegmentOrdinals ?? [],
      }),
    );
  }

  const activeRevisionIds = new Set(active.map((entry) => entry.id));
  const stale = (previous?.entries ?? [])
    .filter((entry) => !activeRevisionIds.has(entry.id))
    .map((entry) => ({ ...entry, state: 'stale' as const }));
  active.sort(
    (left, right) =>
      right.distinctSignalCount - left.distinctSignalCount ||
      right.totalMatchCount - left.totalMatchCount ||
      left.noteRecordId.localeCompare(right.noteRecordId),
  );
  stale.sort((left, right) => left.noteRecordId.localeCompare(right.noteRecordId));
  return PersonalKnowledgePilotQueueSchema.parse({
    schemaVersion: 1,
    queueVersion: 1,
    profileId: profile.id,
    contentScope: profile.contentScope,
    generatedAt,
    entries: [...active, ...stale],
  });
};

const eligibleSnapshots = async (
  manifest: AppleNotesIntakeManifest,
  sourceRoot: string,
): Promise<PersonalKnowledgeSnapshot[]> => {
  const eligible = manifest.notes.filter(
    (
      note,
    ): note is typeof note & {
      titleHash: string;
      plaintextHash: string;
      sourceDocumentId: string;
    } =>
      !note.locked &&
      ['exported', 'unchanged'].includes(note.exportStatus) &&
      note.titleHash !== null &&
      note.plaintextHash !== null &&
      note.sourceDocumentId !== null,
  );
  const snapshots: PersonalKnowledgeSnapshot[] = [];
  for (const note of eligible) {
    const snapshot = await readAppleNotesTitlePlaintextSnapshot(note.id, sourceRoot);
    if (
      snapshot.note.id !== note.id ||
      snapshot.note.sourceDocumentId !== note.sourceDocumentId ||
      snapshot.note.titleHash !== note.titleHash ||
      snapshot.note.plaintextHash !== note.plaintextHash ||
      snapshot.note.modifiedAtProvider !== note.modifiedAtProvider
    ) {
      throw new Error('An Apple Notes revision changed while the private pilot queue was indexed.');
    }
    snapshots.push({
      noteRecordId: snapshot.note.id,
      sourceDocumentId: snapshot.note.sourceDocumentId,
      titleHash: snapshot.note.titleHash,
      plaintextHash: snapshot.note.plaintextHash,
      sourceModifiedAtProvider: snapshot.note.modifiedAtProvider,
      title: snapshot.title,
      plaintext: snapshot.plaintext,
    });
  }
  return snapshots;
};

export const loadPersonalKnowledgePilotQueue = async (
  profileId: string,
  sourceRoot = DEFAULT_SOURCE_ROOT,
): Promise<PersonalKnowledgePilotQueue | null> => {
  const paths = privatePaths(sourceRoot, profileId);
  const raw = await readPrivateJson(paths.root, paths.queue);
  return raw === null ? null : PersonalKnowledgePilotQueueSchema.parse(raw);
};

export const refreshPersonalKnowledgePilotQueue = async (
  options: PersonalKnowledgeWorkspaceOptions = {},
): Promise<PersonalKnowledgePilotQueue> => {
  const sourceRoot = resolve(options.sourceRoot ?? DEFAULT_SOURCE_ROOT);
  const profile = await loadPersonalKnowledgePilotProfile(options.profilePath);
  validatePersonalKnowledgePilotProfile(profile);
  const manifest = await loadAppleNotesIntakeManifestMetadata(sourceRoot);
  if (!manifest) throw new Error('No local Apple Notes intake manifest is available.');
  const previous = await loadPersonalKnowledgePilotQueue(profile.id, sourceRoot);
  const queue = buildPersonalKnowledgePilotQueueFromSnapshots(
    profile,
    await eligibleSnapshots(manifest, sourceRoot),
    previous,
    timestamp(options),
  );
  const paths = privatePaths(sourceRoot, profile.id);
  await writePrivateJsonAtomic(paths.root, paths.queue, queue);
  return queue;
};

export const nextPersonalKnowledgePilotQueueEntry = (
  queue: PersonalKnowledgePilotQueue,
): PersonalKnowledgePilotQueueEntry | null =>
  queue.entries.find((entry) => entry.state === 'partially_classified') ??
  queue.entries.find((entry) => entry.state === 'queued') ??
  null;

export const nextPersonalKnowledgePilotReviewSelection = (
  queue: PersonalKnowledgePilotQueue,
): { entry: PersonalKnowledgePilotQueueEntry; segmentOrdinal: number } | null => {
  if (queue.entries.some((entry) => entry.state === 'released')) {
    throw new Error('Import the currently released pilot packet before preparing another.');
  }
  const entry = nextPersonalKnowledgePilotQueueEntry(queue);
  if (!entry) return null;
  if (entry.expectedSegmentCount === null) return { entry, segmentOrdinal: 0 };
  for (let ordinal = 0; ordinal < entry.expectedSegmentCount; ordinal += 1) {
    if (
      !entry.releasedSegmentOrdinals.includes(ordinal) &&
      !entry.classifiedSegmentOrdinals.includes(ordinal)
    ) {
      return { entry, segmentOrdinal: ordinal };
    }
  }
  return null;
};

export const recordPersonalKnowledgePacketRelease = async (
  profileId: string,
  noteRecordId: string,
  packetId: string,
  segmentOrdinal: number,
  segmentCount: number,
  sourceRoot = DEFAULT_SOURCE_ROOT,
): Promise<void> => {
  const queue = await loadPersonalKnowledgePilotQueue(profileId, sourceRoot);
  if (!queue) throw new Error(`No private pilot queue exists for ${profileId}.`);
  const audit = await validateAppleNotesCodexReviewAudit(sourceRoot);
  const auditEntry = audit?.entries.find((entry) => entry.packetId === packetId);
  if (
    !auditEntry ||
    auditEntry.noteRecordId !== noteRecordId ||
    auditEntry.segmentOrdinal !== segmentOrdinal ||
    auditEntry.segmentCount !== segmentCount
  ) {
    throw new Error('The released packet does not match its private audit record.');
  }
  let found = false;
  const entries = queue.entries.map((entry) => {
    if (
      entry.noteRecordId !== noteRecordId ||
      entry.sourceDocumentId !== auditEntry.relatedSourceDocumentId ||
      entry.titleHash !== auditEntry.titleHash ||
      entry.plaintextHash !== auditEntry.plaintextHash ||
      entry.state === 'stale'
    ) {
      return entry;
    }
    found = true;
    if (entry.expectedSegmentCount !== null && entry.expectedSegmentCount !== segmentCount) {
      throw new Error('A source revision cannot change segment count during review.');
    }
    if (entry.classifiedSegmentOrdinals.includes(segmentOrdinal)) {
      throw new Error('A classified segment cannot be released again.');
    }
    return {
      ...entry,
      state: 'released' as const,
      expectedSegmentCount: segmentCount,
      releasedPacketIds: [...new Set([...entry.releasedPacketIds, packetId])],
      releasedSegmentOrdinals: [
        ...new Set([...entry.releasedSegmentOrdinals, segmentOrdinal]),
      ].sort((left, right) => left - right),
    };
  });
  if (!found) throw new Error('The released packet is not part of the selected pilot queue.');
  const updated = PersonalKnowledgePilotQueueSchema.parse({ ...queue, entries });
  const paths = privatePaths(sourceRoot, profileId);
  await writePrivateJsonAtomic(paths.root, paths.queue, updated);
};

const emptyWorkspace = (updatedAt: string): PersonalKnowledgeWorkspace =>
  PersonalKnowledgeWorkspaceSchema.parse({
    schemaVersion: 1,
    workspaceVersion: 1,
    updatedAt,
    contentScope: 'apple_notes_title_plaintext_only',
    semanticRuns: [],
    sourceUnitCandidates: [],
    sourceUnits: [],
    bibliographicCandidates: [],
    opinionCandidates: [],
    opinions: [],
    opinionEvidenceRelationships: [],
  });

export const loadPersonalKnowledgeWorkspace = async (
  sourceRoot = DEFAULT_SOURCE_ROOT,
): Promise<PersonalKnowledgeWorkspace | null> => {
  const paths = privatePaths(sourceRoot);
  const raw = await readPrivateJson(paths.root, paths.workspace);
  return raw === null ? null : PersonalKnowledgeWorkspaceSchema.parse(raw);
};

const ensureUniqueIds = (label: string, values: readonly { id: string }[]): void => {
  const ids = values.map((value) => value.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`Personal-knowledge ${label} IDs must be unique.`);
  }
};

const validateSupersessionGraph = (
  label: string,
  edges: ReadonlyMap<string, readonly string[]>,
): void => {
  for (const [id, supersedesIds] of edges) {
    if (
      new Set(supersedesIds).size !== supersedesIds.length ||
      supersedesIds.includes(id) ||
      supersedesIds.some((supersededId) => !edges.has(supersededId))
    ) {
      throw new Error(`Personal-knowledge ${label} supersession references are invalid.`);
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) {
      throw new Error(`Personal-knowledge ${label} supersession graph contains a cycle.`);
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const supersededId of edges.get(id) ?? []) visit(supersededId);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of edges.keys()) visit(id);
};

export const validatePersonalKnowledgeWorkspace = (workspace: PersonalKnowledgeWorkspace): void => {
  ensureUniqueIds('semantic run', workspace.semanticRuns);
  ensureUniqueIds('source-unit candidate', workspace.sourceUnitCandidates);
  ensureUniqueIds('source unit', workspace.sourceUnits);
  ensureUniqueIds('bibliographic candidate', workspace.bibliographicCandidates);
  ensureUniqueIds('opinion candidate', workspace.opinionCandidates);
  ensureUniqueIds('opinion', workspace.opinions);
  ensureUniqueIds('opinion-evidence relationship', workspace.opinionEvidenceRelationships);
  const runIds = new Set(workspace.semanticRuns.map((run) => run.id));
  const unitCandidateIds = new Set(workspace.sourceUnitCandidates.map((unit) => unit.id));
  const unitIds = new Set(workspace.sourceUnits.map((unit) => unit.id));
  const bibliographyIds = new Set(workspace.bibliographicCandidates.map((entry) => entry.id));
  const opinionCandidateIds = new Set(workspace.opinionCandidates.map((opinion) => opinion.id));
  const opinionIds = new Set(workspace.opinions.map((opinion) => opinion.id));
  const relationshipIds = new Set(
    workspace.opinionEvidenceRelationships.map((relationship) => relationship.id),
  );
  validateSupersessionGraph(
    'source-unit',
    new Map(workspace.sourceUnits.map((unit) => [unit.id, unit.supersedesUnitIds])),
  );
  validateSupersessionGraph(
    'Developer-opinion',
    new Map(workspace.opinions.map((opinion) => [opinion.id, opinion.supersedesOpinionIds])),
  );
  for (const unit of workspace.sourceUnitCandidates) {
    if (!runIds.has(unit.semanticRunId)) throw new Error(`${unit.id} has an unknown semantic run.`);
  }
  for (const unit of workspace.sourceUnits) {
    if (unit.originCandidateIds.some((id) => !unitCandidateIds.has(id))) {
      throw new Error(`${unit.id} has an unknown source-unit candidate.`);
    }
  }
  for (const bibliography of workspace.bibliographicCandidates) {
    if (!runIds.has(bibliography.semanticRunId)) {
      throw new Error(`${bibliography.id} has an unknown semantic run.`);
    }
    if (
      bibliography.sourceUnitCandidateIds.some((id) => !unitCandidateIds.has(id)) ||
      bibliography.sourceUnitIds.some((id) => !unitIds.has(id))
    ) {
      throw new Error(`${bibliography.id} has an unknown source unit.`);
    }
    if (
      bibliography.matchedEvidenceSourceId !== null &&
      !knownEvidenceSourceIds.has(bibliography.matchedEvidenceSourceId)
    ) {
      throw new Error(`${bibliography.id} has an unknown formal evidence match.`);
    }
  }
  for (const opinion of workspace.opinionCandidates) {
    if (!runIds.has(opinion.semanticRunId)) throw new Error(`${opinion.id} has an unknown run.`);
    if (
      opinion.sourceUnitCandidateIds.some((id) => !unitCandidateIds.has(id)) ||
      opinion.sourceUnitIds.some((id) => !unitIds.has(id)) ||
      opinion.nearbyBibliographicCandidateIds.some((id) => !bibliographyIds.has(id))
    ) {
      throw new Error(`${opinion.id} has an unknown source or bibliographic candidate.`);
    }
  }
  for (const opinion of workspace.opinions) {
    if (
      opinion.originSourceUnitIds.some((id) => !unitIds.has(id)) ||
      opinion.originCandidateIds.some((id) => !opinionCandidateIds.has(id)) ||
      opinion.evidenceRelationshipIds.some((id) => !relationshipIds.has(id))
    ) {
      throw new Error(`${opinion.id} has an unknown origin or evidence relationship.`);
    }
    const actualRelationshipIds = workspace.opinionEvidenceRelationships
      .filter((relationship) => relationship.opinionId === opinion.id)
      .map((relationship) => relationship.id);
    if (
      new Set(opinion.evidenceRelationshipIds).size !== opinion.evidenceRelationshipIds.length ||
      opinion.evidenceRelationshipIds.length !== actualRelationshipIds.length ||
      actualRelationshipIds.some((id) => !opinion.evidenceRelationshipIds.includes(id))
    ) {
      throw new Error(`${opinion.id} evidence-relationship backreferences are inconsistent.`);
    }
  }
  for (const relationship of workspace.opinionEvidenceRelationships) {
    if (!opinionIds.has(relationship.opinionId)) {
      throw new Error(`${relationship.id} has an unknown Developer opinion.`);
    }
    const sourceUseDecision = sourceUseDecisionById.get(relationship.sourceUseDecisionId);
    if (
      !knownEvidenceSourceIds.has(relationship.evidenceSourceId) ||
      !sourceUseDecision ||
      sourceUseDecision.evidenceSourceId !== relationship.evidenceSourceId ||
      sourceUseDecision.decisionStatus !== 'permitted_with_conditions' ||
      !sourceUseDecision.permissions.derivedClinicalContent
    ) {
      throw new Error(`${relationship.id} has inconsistent evidence/source-use provenance.`);
    }
  }
};

const everyLocatorMatchesPacket = (
  result: PersonalKnowledgeClassificationResult,
  packet: ReturnType<typeof AppleNotesCodexReviewPacketSchema.parse>,
): boolean => {
  const locators = [
    ...result.sourceUnitCandidates.flatMap((entry) => entry.sourceLocators),
    ...result.bibliographicCandidates.flatMap((entry) => entry.sourceLocators),
    ...result.opinionCandidates.flatMap((entry) => entry.sourceLocators),
  ];
  return locators.every(
    (locator) =>
      locator.kind === 'apple_notes_packet' &&
      locator.packetId === packet.id &&
      locator.sourceDocumentId === packet.relatedSourceDocumentId &&
      locator.segmentOrdinal === packet.segmentOrdinal &&
      locator.segmentHash === packet.segmentHash,
  );
};

const validateClassificationResult = (
  result: PersonalKnowledgeClassificationResult,
  profile: PersonalKnowledgePilotProfile,
  packet: ReturnType<typeof AppleNotesCodexReviewPacketSchema.parse>,
): void => {
  if (result.packetId !== packet.id || result.modelIdentifier !== packet.modelIdentifier) {
    throw new Error('Classification result does not match the audited packet/model.');
  }
  if (result.promptVersion !== PERSONAL_KNOWLEDGE_CLASSIFIER_PROMPT_VERSION) {
    throw new Error('Classification result uses an unavailable personal-knowledge prompt version.');
  }
  if (result.profileId !== profile.id) {
    throw new Error('Classification result does not match the selected pilot profile.');
  }
  if (!everyLocatorMatchesPacket(result, packet)) {
    throw new Error('Classification provenance exceeds the one audited title/plaintext packet.');
  }
  const allowedTargets = new Set(
    profile.targetMatchers.map((matcher) => matcher.target.targetContentId),
  );
  const targetReferences = [
    ...result.sourceUnitCandidates.flatMap((entry) => entry.targets),
    ...result.bibliographicCandidates.flatMap((entry) => entry.targets),
    ...result.opinionCandidates.flatMap((entry) => entry.targets),
  ];
  for (const target of targetReferences) {
    if (
      target.resolution === 'resolved' &&
      (!allowedTargets.has(target.targetContentId) || !resolvedTargetExists(target))
    ) {
      throw new Error('Classification result contains a target outside the pilot allowlist.');
    }
  }
  const candidates = [
    ...result.sourceUnitCandidates,
    ...result.bibliographicCandidates,
    ...result.opinionCandidates,
  ];
  ensureUniqueIds('classification candidate', candidates);
  if (candidates.some((candidate) => candidate.semanticRunId !== result.id)) {
    throw new Error('Every classification candidate must point to its exact semantic run.');
  }
  const unitIds = new Set(result.sourceUnitCandidates.map((unit) => unit.id));
  const bibliographyIds = new Set(result.bibliographicCandidates.map((entry) => entry.id));
  for (const bibliography of result.bibliographicCandidates) {
    if (bibliography.sourceUnitCandidateIds.some((id) => !unitIds.has(id))) {
      throw new Error(`${bibliography.id} references a source unit outside its classification.`);
    }
  }
  for (const opinion of result.opinionCandidates) {
    if (
      opinion.sourceUnitCandidateIds.some((id) => !unitIds.has(id)) ||
      opinion.nearbyBibliographicCandidateIds.some((id) => !bibliographyIds.has(id))
    ) {
      throw new Error(`${opinion.id} references a candidate outside its classification.`);
    }
  }
};

export const reconcilePersonalKnowledgeQueueClassification = (
  queue: PersonalKnowledgePilotQueue,
  packet: {
    id: string;
    noteRecordId: string;
    relatedSourceDocumentId: string;
    titleHash: string;
    plaintextHash: string;
    segmentOrdinal: number;
    segmentCount: number;
  },
): PersonalKnowledgePilotQueue => {
  let found = false;
  const entries = queue.entries.map((entry) => {
    if (
      entry.state === 'stale' ||
      !entry.releasedPacketIds.includes(packet.id) ||
      entry.noteRecordId !== packet.noteRecordId ||
      entry.sourceDocumentId !== packet.relatedSourceDocumentId ||
      entry.titleHash !== packet.titleHash ||
      entry.plaintextHash !== packet.plaintextHash
    ) {
      return entry;
    }
    found = true;
    if (
      entry.expectedSegmentCount !== packet.segmentCount ||
      !entry.releasedSegmentOrdinals.includes(packet.segmentOrdinal)
    ) {
      throw new Error('Imported packet does not match the queued segment relationship.');
    }
    const classifiedSegmentOrdinals = [
      ...new Set([...entry.classifiedSegmentOrdinals, packet.segmentOrdinal]),
    ].sort((left, right) => left - right);
    return {
      ...entry,
      state:
        classifiedSegmentOrdinals.length === entry.expectedSegmentCount
          ? ('classified' as const)
          : ('partially_classified' as const),
      classifiedSegmentOrdinals,
    };
  });
  if (!found) throw new Error('Imported packet is not released in the pilot queue.');
  return PersonalKnowledgePilotQueueSchema.parse({ ...queue, entries });
};

export const importPersonalKnowledgeClassification = async (
  resultPath: string,
  options: PersonalKnowledgeWorkspaceOptions = {},
): Promise<{ imported: boolean; workspace: PersonalKnowledgeWorkspace }> => {
  const sourceRoot = resolve(options.sourceRoot ?? DEFAULT_SOURCE_ROOT);
  const resultBytes = await readPrivateClassificationResultBytes(resultPath);
  const result = PersonalKnowledgeClassificationResultSchema.parse(
    JSON.parse(resultBytes.toString('utf8')) as unknown,
  );
  const profile = await loadPersonalKnowledgePilotProfile(options.profilePath);
  validatePersonalKnowledgePilotProfile(profile);
  const audit = await validateAppleNotesCodexReviewAudit(sourceRoot);
  const auditEntry = audit?.entries.find((entry) => entry.packetId === result.packetId);
  if (!auditEntry || auditEntry.packetSha256 !== result.packetSha256) {
    throw new Error('Classification result does not match an audited private packet.');
  }
  const packetPath = resolve(sourceRoot, auditEntry.packetRelativePath);
  if (!pathInside(sourceRoot, packetPath)) {
    throw new Error('Audited packet resolves outside the protected source root.');
  }
  const packet = AppleNotesCodexReviewPacketSchema.parse(
    JSON.parse(await readFile(packetPath, 'utf8')) as unknown,
  );
  validateClassificationResult(result, profile, packet);
  const paths = privatePaths(sourceRoot, profile.id);
  const queue = await loadPersonalKnowledgePilotQueue(profile.id, sourceRoot);
  if (!queue) throw new Error('The semantic import requires its private pilot queue.');
  const reconciledQueue = reconcilePersonalKnowledgeQueueClassification(queue, packet);
  const workspace =
    (await loadPersonalKnowledgeWorkspace(sourceRoot)) ?? emptyWorkspace(result.classifiedAt);
  const outputSha256 = sha256(JSON.stringify(result));
  const existingRun = workspace.semanticRuns.find((run) => run.id === result.id);
  if (existingRun) {
    if (existingRun.outputSha256 !== outputSha256) {
      throw new Error('A semantic run ID cannot be reused with different classification output.');
    }
    await writePrivateJsonAtomic(paths.root, paths.queue, reconciledQueue);
    return { imported: false, workspace };
  }
  const updated = PersonalKnowledgeWorkspaceSchema.parse({
    ...workspace,
    updatedAt: timestamp(options),
    semanticRuns: [
      ...workspace.semanticRuns,
      {
        schemaVersion: 1,
        id: result.id,
        profileId: result.profileId,
        packetId: result.packetId,
        packetSha256: result.packetSha256,
        modelIdentifier: result.modelIdentifier,
        promptVersion: result.promptVersion,
        classifiedAt: result.classifiedAt,
        outputSha256,
      },
    ],
    sourceUnitCandidates: [...workspace.sourceUnitCandidates, ...result.sourceUnitCandidates],
    bibliographicCandidates: [
      ...workspace.bibliographicCandidates,
      ...result.bibliographicCandidates,
    ],
    opinionCandidates: [...workspace.opinionCandidates, ...result.opinionCandidates],
  });
  validatePersonalKnowledgeWorkspace(updated);
  await writePrivateJsonAtomic(paths.root, paths.workspace, updated);
  await writePrivateJsonAtomic(paths.root, paths.queue, reconciledQueue);
  return { imported: true, workspace: updated };
};

const targetLabel = (target: PersonalKnowledgeResolvedTarget): string => {
  switch (target.targetKind) {
    case 'medication':
      return (
        catalogs.medications.find((entry) => entry.id === target.targetContentId)?.label ??
        target.targetContentId
      );
    case 'diagnosis':
      return (
        catalogs.diagnoses.find((entry) => entry.id === target.targetContentId)?.label ??
        target.targetContentId
      );
    case 'intervention':
      return (
        catalogs.treatments.find((entry) => entry.id === target.targetContentId)?.label ??
        target.targetContentId
      );
    case 'test':
      return (
        catalogs.tests.find((entry) => entry.id === target.targetContentId)?.label ??
        target.targetContentId
      );
    default:
      return target.targetContentId;
  }
};

export const buildPersonalKnowledgeWorkbenchProjection = (
  profile: PersonalKnowledgePilotProfile,
  queue: PersonalKnowledgePilotQueue,
  workspace: PersonalKnowledgeWorkspace,
  manifest: AppleNotesIntakeManifest,
  generatedAt: string,
): PersonalKnowledgeWorkbenchProjection => {
  const targets = [
    ...new Map(
      profile.targetMatchers.map((matcher) => [matcher.target.targetContentId, matcher.target]),
    ).values(),
  ].filter(
    (
      target,
    ): target is PersonalKnowledgeResolvedTarget & {
      targetKind: 'medication' | 'diagnosis' | 'intervention' | 'test';
    } => ['medication', 'diagnosis', 'intervention', 'test'].includes(target.targetKind),
  );
  const relationshipsByOpinion = new Map<
    string,
    (typeof workspace.opinionEvidenceRelationships)[number][]
  >();
  for (const relationship of workspace.opinionEvidenceRelationships) {
    relationshipsByOpinion.set(relationship.opinionId, [
      ...(relationshipsByOpinion.get(relationship.opinionId) ?? []),
      relationship,
    ]);
  }
  const candidateProjection = (candidate: (typeof workspace.opinionCandidates)[number]) => ({
    id: candidate.id,
    summary: candidate.summary,
    sourceUnitId: candidate.sourceUnitIds[0] ?? candidate.sourceUnitCandidateIds[0]!,
    sourceDate: candidate.asOfDate,
    currentness: candidate.currentness,
    reviewStatus: candidate.reviewStatus,
    unresolvedTargets: candidate.targets
      .filter((target) => target.resolution === 'unresolved')
      .map(({ targetKindHint, searchLabel, role, reason }) => ({
        targetKindHint,
        searchLabel,
        role,
        reason,
      })),
    evidenceRelations: [],
  });
  const opinionProjection = (opinion: (typeof workspace.opinions)[number]) => {
    const relationships = relationshipsByOpinion.get(opinion.id) ?? [];
    return {
      id: opinion.id,
      summary: opinion.summary,
      sourceUnitId: opinion.originSourceUnitIds[0] ?? opinion.originCandidateIds[0]!,
      sourceDate: opinion.asOfDate,
      currentness: opinion.currentness,
      reviewStatus:
        opinion.developerReview.status === 'accepted'
          ? ('accepted' as const)
          : opinion.developerReview.status === 'retired'
            ? ('rejected' as const)
            : ('deferred' as const),
      unresolvedTargets: [],
      evidenceRelations: relationships.map((relationship) => ({
        evidenceSourceId: relationship.evidenceSourceId,
        relationship: relationship.relationType,
        stillExpertBridge: relationship.stillExpertBridge,
        reviewStatus: relationship.review.status,
      })),
    };
  };
  const bibliographyProjection = (
    candidate: (typeof workspace.bibliographicCandidates)[number],
  ) => ({
    id: candidate.id,
    displayCitation:
      candidate.citationText ??
      ([
        candidate.authors.join(', '),
        candidate.title,
        candidate.organization,
        candidate.year?.toString(),
      ]
        .filter((value): value is string => Boolean(value))
        .join('. ') ||
        'Incomplete bibliographic lead'),
    verificationStatus: candidate.verificationStatus,
    matchedEvidenceSourceId: candidate.matchedEvidenceSourceId,
  });

  const dossiers = targets.map((target) => {
    const medication =
      target.targetKind === 'medication'
        ? catalogs.medications.find((entry) => entry.id === target.targetContentId)
        : undefined;
    const diagnosis =
      target.targetKind === 'diagnosis'
        ? catalogs.diagnoses.find((entry) => entry.id === target.targetContentId)
        : undefined;
    const contributions = [
      ...(medication?.sourceUseNotes ?? []),
      ...(diagnosis?.sourceUseNotes ?? []),
    ];
    const targetCandidates = workspace.opinionCandidates.filter((candidate) =>
      candidate.targets.some(
        (entry) =>
          entry.resolution === 'resolved' && entry.targetContentId === target.targetContentId,
      ),
    );
    const targetOpinions = workspace.opinions.filter((opinion) =>
      opinion.targets.some((entry) => entry.targetContentId === target.targetContentId),
    );
    const targetBibliography = workspace.bibliographicCandidates.filter((candidate) =>
      candidate.targets.some(
        (entry) =>
          entry.resolution === 'resolved' && entry.targetContentId === target.targetContentId,
      ),
    );
    const fitEntries = medication?.fitModifiers ?? [];
    return {
      targetId: target.targetContentId,
      targetKind: target.targetKind,
      label: targetLabel(target),
      queuedSourceCount: queue.entries.filter(
        (entry) =>
          entry.state !== 'stale' && entry.matchedTargetContentIds.includes(target.targetContentId),
      ).length,
      sourceUnitCount: new Set([
        ...workspace.sourceUnitCandidates
          .filter((unit) =>
            unit.targets.some(
              (entry) =>
                entry.resolution === 'resolved' && entry.targetContentId === target.targetContentId,
            ),
          )
          .map((unit) => unit.id),
        ...workspace.sourceUnits
          .filter((unit) =>
            unit.targets.some((entry) => entry.targetContentId === target.targetContentId),
          )
          .map((unit) => unit.id),
      ]).size,
      formalEvidenceSourceIds: [
        ...new Set(
          contributions.flatMap((contribution) =>
            contribution.authority === 'formal_publication' ? contribution.evidenceSourceIds : [],
          ),
        ),
      ],
      currentRuleIds: fitEntries.map((entry) => entry.id),
      balanceEntries: fitEntries.map((entry) => ({
        id: entry.id,
        summary: entry.explanation,
        pointDelta: entry.pointDelta,
        reviewStatus: entry.medicalReviewStatus,
      })),
      bibliographicCandidates: targetBibliography.map(bibliographyProjection),
      candidates: [
        ...targetCandidates.map(candidateProjection),
        ...targetOpinions.map(opinionProjection),
      ],
    };
  });
  const unmappedCandidates = workspace.opinionCandidates
    .filter(
      (candidate) =>
        !candidate.targets.some(
          (target) =>
            target.resolution === 'resolved' &&
            targets.some(
              (candidateTarget) => candidateTarget.targetContentId === target.targetContentId,
            ),
        ),
    )
    .map(candidateProjection);
  const sourceUnitCandidates = workspace.sourceUnitCandidates.map((candidate) => ({
    id: candidate.id,
    unitKind: candidate.unitKind,
    boundaryState: candidate.boundaryState,
    currentness: candidate.currentness,
    reviewStatus: candidate.reviewStatus,
    resolvedTargetIds: candidate.targets
      .filter((target) => target.resolution === 'resolved')
      .map((target) => target.targetContentId),
    unresolvedTargetLabels: candidate.targets
      .filter((target) => target.resolution === 'unresolved')
      .map((target) => target.searchLabel),
  }));
  const unmappedBibliographicCandidates = workspace.bibliographicCandidates
    .filter(
      (candidate) =>
        !candidate.targets.some(
          (target) =>
            target.resolution === 'resolved' &&
            targets.some(
              (candidateTarget) => candidateTarget.targetContentId === target.targetContentId,
            ),
        ),
    )
    .map(bibliographyProjection);
  const activeEntries = queue.entries.filter((entry) => entry.state !== 'stale');
  return PersonalKnowledgeWorkbenchProjectionSchema.parse({
    schemaVersion: 1,
    projectionVersion: 1,
    generatedAt,
    pilotTopicId: profile.id,
    summary: {
      intakeEligibleSources: manifest.notes.filter(
        (note) =>
          !note.locked &&
          ['exported', 'unchanged'].includes(note.exportStatus) &&
          note.titleHash &&
          note.plaintextHash &&
          note.sourceDocumentId,
      ).length,
      queuedSources: activeEntries.filter((entry) => entry.state === 'queued').length,
      releasedSources: activeEntries.filter((entry) => entry.state === 'released').length,
      partiallyClassifiedSources: activeEntries.filter(
        (entry) => entry.state === 'partially_classified',
      ).length,
      classifiedSources: activeEntries.filter((entry) =>
        ['classified', 'adjudicated'].includes(entry.state),
      ).length,
      sourceUnits: workspace.sourceUnitCandidates.length + workspace.sourceUnits.length,
      opinionCandidates: workspace.opinionCandidates.length,
      mappedCandidates: workspace.opinionCandidates.length - unmappedCandidates.length,
      unmappedCandidates: unmappedCandidates.length,
      needsCurrentnessReview: [...workspace.opinionCandidates, ...workspace.opinions].filter(
        (entry) => entry.currentness === 'needs_currentness_review',
      ).length,
      bibliographicCandidates: workspace.bibliographicCandidates.length,
      verifiedBibliography: workspace.bibliographicCandidates.filter(
        (entry) => entry.verificationStatus === 'verified_match',
      ).length,
      acceptedOpinions: workspace.opinions.filter(
        (entry) => entry.developerReview.status === 'accepted',
      ).length,
      evidenceLinkedOpinions: new Set(
        workspace.opinionEvidenceRelationships.map((entry) => entry.opinionId),
      ).size,
      ocrAttachmentsOutsideSemanticScope: manifest.notes
        .flatMap((note) => note.attachmentRecords)
        .filter((attachment) => attachment.ocrStatus === 'completed').length,
    },
    dossiers,
    sourceUnitCandidates,
    unmappedCandidates,
    unmappedBibliographicCandidates,
    warnings: [
      'Lexical matches only prioritize review; they are not evidence or clinical claims.',
      'Candidate summaries are medically unreviewed and have no gameplay effect.',
      'Apple Notes attachment and OCR content remains outside this title/plaintext semantic-review scope.',
      'Clinical factors and point balance remain separate records.',
    ],
  });
};

export const writePersonalKnowledgeWorkbenchProjection = async (
  options: PersonalKnowledgeWorkspaceOptions = {},
): Promise<PersonalKnowledgeWorkbenchProjection> => {
  const sourceRoot = resolve(options.sourceRoot ?? DEFAULT_SOURCE_ROOT);
  const profile = await loadPersonalKnowledgePilotProfile(options.profilePath);
  const queue = await loadPersonalKnowledgePilotQueue(profile.id, sourceRoot);
  if (!queue) throw new Error('Refresh the personal-knowledge pilot queue first.');
  const manifest = await loadAppleNotesIntakeManifestMetadata(sourceRoot);
  if (!manifest) throw new Error('No local Apple Notes intake manifest is available.');
  const workspace =
    (await loadPersonalKnowledgeWorkspace(sourceRoot)) ?? emptyWorkspace(timestamp(options));
  validatePersonalKnowledgeWorkspace(workspace);
  const projection = buildPersonalKnowledgeWorkbenchProjection(
    profile,
    queue,
    workspace,
    manifest,
    timestamp(options),
  );
  const projectionPath = resolve(
    options.projectionPath ?? DEFAULT_PERSONAL_KNOWLEDGE_PROJECTION_PATH,
  );
  const generatedRoot = resolve('content/generated');
  await writePrivateJsonAtomic(generatedRoot, projectionPath, projection);
  return projection;
};

export const validatePersonalKnowledgePrivateState = async (
  sourceRoot = DEFAULT_SOURCE_ROOT,
): Promise<{
  queueEntries: number;
  semanticRuns: number;
  opinionCandidates: number;
} | null> => {
  const profile = await loadPersonalKnowledgePilotProfile();
  validatePersonalKnowledgePilotProfile(profile);
  const queue = await loadPersonalKnowledgePilotQueue(profile.id, sourceRoot);
  const workspace = await loadPersonalKnowledgeWorkspace(sourceRoot);
  if (!queue && !workspace) return null;
  if (!queue) throw new Error('A private semantic workspace requires its pilot queue.');
  if (queue.profileId !== profile.id || queue.contentScope !== profile.contentScope) {
    throw new Error('Private pilot queue does not match its tracked profile.');
  }
  ensureUniqueIds('pilot queue entry', queue.entries);
  const activeNoteIds = queue.entries
    .filter((entry) => entry.state !== 'stale')
    .map((entry) => entry.noteRecordId);
  if (new Set(activeNoteIds).size !== activeNoteIds.length) {
    throw new Error('A private pilot queue may have only one active revision per note.');
  }
  const allowedTargets = new Set(
    profile.targetMatchers.map((matcher) => matcher.target.targetContentId),
  );
  if (
    queue.entries.some((entry) =>
      entry.matchedTargetContentIds.some((targetId) => !allowedTargets.has(targetId)),
    )
  ) {
    throw new Error('Private pilot queue contains a target outside its tracked allowlist.');
  }
  const audit = await validateAppleNotesCodexReviewAudit(sourceRoot);
  const auditByPacket = new Map((audit?.entries ?? []).map((entry) => [entry.packetId, entry]));
  const validatedWorkspace = workspace ?? emptyWorkspace(queue.generatedAt);
  validatePersonalKnowledgeWorkspace(validatedWorkspace);
  const runById = new Map(validatedWorkspace.semanticRuns.map((run) => [run.id, run]));
  const runByPacket = new Map<string, (typeof validatedWorkspace.semanticRuns)[number]>();
  for (const run of validatedWorkspace.semanticRuns) {
    if (runByPacket.has(run.packetId)) {
      throw new Error('A private packet cannot have more than one semantic classification run.');
    }
    runByPacket.set(run.packetId, run);
  }
  const locatorMatchesAudit = (
    locator: (typeof validatedWorkspace.sourceUnitCandidates)[number]['sourceLocators'][number],
    auditEntry: NonNullable<typeof audit>['entries'][number],
  ): boolean =>
    locator.kind === 'apple_notes_packet' &&
    locator.packetId === auditEntry.packetId &&
    locator.sourceDocumentId === auditEntry.relatedSourceDocumentId &&
    locator.segmentOrdinal === auditEntry.segmentOrdinal &&
    locator.segmentHash === auditEntry.segmentHash;
  for (const candidate of [
    ...validatedWorkspace.sourceUnitCandidates,
    ...validatedWorkspace.bibliographicCandidates,
    ...validatedWorkspace.opinionCandidates,
  ]) {
    const run = runById.get(candidate.semanticRunId);
    const auditEntry = run ? auditByPacket.get(run.packetId) : undefined;
    if (
      !run ||
      !auditEntry ||
      candidate.sourceLocators.some((locator) => !locatorMatchesAudit(locator, auditEntry))
    ) {
      throw new Error('Private candidate locator provenance does not match its semantic run.');
    }
  }
  for (const unit of validatedWorkspace.sourceUnits) {
    if (
      unit.sourceLocators.some((locator) => {
        if (locator.kind !== 'apple_notes_packet') return true;
        const auditEntry = auditByPacket.get(locator.packetId);
        return !auditEntry || !locatorMatchesAudit(locator, auditEntry);
      })
    ) {
      throw new Error('Reviewed source-unit locator provenance is outside the private audit.');
    }
  }
  for (const entry of queue.entries) {
    if (entry.expectedSegmentCount === null) {
      if (entry.releasedSegmentOrdinals.length > 0 || entry.classifiedSegmentOrdinals.length > 0) {
        throw new Error('Unsegmented queue entries cannot claim segment progress.');
      }
    } else {
      const ordinals = [...entry.releasedSegmentOrdinals, ...entry.classifiedSegmentOrdinals];
      if (
        ordinals.some((ordinal) => ordinal >= entry.expectedSegmentCount!) ||
        new Set(entry.releasedSegmentOrdinals).size !== entry.releasedSegmentOrdinals.length ||
        new Set(entry.classifiedSegmentOrdinals).size !== entry.classifiedSegmentOrdinals.length
      ) {
        throw new Error('Private pilot queue contains invalid segment progress.');
      }
    }
    for (const packetId of entry.releasedPacketIds) {
      const auditEntry = auditByPacket.get(packetId);
      if (
        !auditEntry ||
        auditEntry.noteRecordId !== entry.noteRecordId ||
        auditEntry.relatedSourceDocumentId !== entry.sourceDocumentId ||
        auditEntry.titleHash !== entry.titleHash ||
        auditEntry.plaintextHash !== entry.plaintextHash ||
        auditEntry.segmentCount !== entry.expectedSegmentCount ||
        !entry.releasedSegmentOrdinals.includes(auditEntry.segmentOrdinal)
      ) {
        throw new Error('Private pilot queue contains an unaudited packet relationship.');
      }
      const classified = entry.classifiedSegmentOrdinals.includes(auditEntry.segmentOrdinal);
      if (classified !== runByPacket.has(packetId)) {
        throw new Error(
          'Private pilot queue classification progress does not match its semantic runs.',
        );
      }
    }
  }
  for (const run of validatedWorkspace.semanticRuns) {
    const auditEntry = auditByPacket.get(run.packetId);
    const queueEntry = queue.entries.find((entry) =>
      entry.releasedPacketIds.includes(run.packetId),
    );
    if (
      !auditEntry ||
      auditEntry.packetSha256 !== run.packetSha256 ||
      auditEntry.acknowledgement.modelIdentifier !== run.modelIdentifier ||
      run.profileId !== profile.id ||
      run.promptVersion !== PERSONAL_KNOWLEDGE_CLASSIFIER_PROMPT_VERSION ||
      !queueEntry ||
      !queueEntry.classifiedSegmentOrdinals.includes(auditEntry.segmentOrdinal)
    ) {
      throw new Error('Private semantic run does not match its audited packet.');
    }
  }
  return {
    queueEntries: queue.entries.filter((entry) => entry.state !== 'stale').length,
    semanticRuns: validatedWorkspace.semanticRuns.length,
    opinionCandidates: validatedWorkspace.opinionCandidates.length,
  };
};
