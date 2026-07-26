import { createHash } from 'node:crypto';
import { chmod, lstat, mkdir, readFile, realpath, rename, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

import { catalogs, medicationIdentities } from '@psychsim/content-runtime';
import { z } from 'zod';

import {
  loadAppleNotesIntakeManifestMetadata,
  readAppleNotesTitlePlaintextSnapshot,
} from './apple-notes-provider';
import { DEFAULT_SOURCE_ROOT } from './source-pipeline';

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const TargetKindSchema = z.enum(['medication', 'diagnosis', 'intervention', 'test']);
const WarningSchema = z.enum([
  'Lexical matches are triage signals only; they are not clinical claims or evidence.',
  'This inventory is medically unreviewed and has no gameplay, scoring, or approval effect.',
  'HTML, attachments, OCR, composites, extracted chunks, and remote Drive sources are excluded.',
  'No private source prose or excerpts are stored in this inventory.',
]);

const TermMatchSchema = z
  .object({
    term: z.string().min(1).max(300),
    count: z.number().int().positive(),
  })
  .strict();

const TargetMatchSchema = z
  .object({
    targetKind: TargetKindSchema,
    targetId: z.string().min(1).max(180),
    totalMatches: z.number().int().positive(),
    termMatches: z.array(TermMatchSchema).min(1),
  })
  .strict();

const InventoryEntrySchema = z
  .object({
    noteRecordId: z.string().min(1).max(180),
    sourceDocumentId: z.string().min(1).max(180),
    titleHash: Sha256Schema,
    plaintextHash: Sha256Schema,
    sourceModifiedAtProvider: z.string().min(1).max(100),
    matches: z.array(TargetMatchSchema),
  })
  .strict();

const InventoryTargetSchema = z
  .object({
    targetKind: TargetKindSchema,
    targetId: z.string().min(1).max(180),
    label: z.string().min(1).max(300),
    terms: z.array(z.string().min(1).max(300)).min(1),
    matchedSourceRevisions: z.number().int().nonnegative(),
    totalMatches: z.number().int().nonnegative(),
  })
  .strict();

export const PersonalKnowledgeLexicalInventorySchema = z
  .object({
    schemaVersion: z.literal(1),
    inventoryVersion: z.literal(1),
    id: z.string().regex(/^personal-knowledge-inventory\.[a-f0-9]{24}$/),
    scope: z.literal('apple_notes_title_plaintext_only'),
    classification: z.literal('lexical_triage_only'),
    medicalReviewStatus: z.literal('unreviewed'),
    clinicalUse: z.literal('none'),
    sourceRevisionFingerprint: Sha256Schema,
    targetCatalogFingerprint: Sha256Schema,
    summary: z
      .object({
        eligibleSourceRevisions: z.number().int().nonnegative(),
        matchedSourceRevisions: z.number().int().nonnegative(),
        unmatchedSourceRevisions: z.number().int().nonnegative(),
        targetIdentityCount: z.number().int().nonnegative(),
        matchedTargetIdentityCount: z.number().int().nonnegative(),
        totalMatches: z.number().int().nonnegative(),
        attachmentRecordsExcluded: z.number().int().nonnegative(),
        ocrRecordsExcluded: z.number().int().nonnegative(),
        remoteSourcesInspected: z.literal(0),
      })
      .strict(),
    targets: z.array(InventoryTargetSchema),
    entries: z.array(InventoryEntrySchema),
    warnings: z.array(WarningSchema).length(4),
  })
  .strict();

export type PersonalKnowledgeLexicalInventory = z.infer<
  typeof PersonalKnowledgeLexicalInventorySchema
>;
export type PersonalKnowledgeInventoryTargetKind = z.infer<typeof TargetKindSchema>;

export interface PersonalKnowledgeInventoryTarget {
  targetKind: PersonalKnowledgeInventoryTargetKind;
  targetId: string;
  label: string;
  terms: readonly string[];
}

export interface PersonalKnowledgeInventorySnapshot {
  noteRecordId: string;
  sourceDocumentId: string;
  titleHash: string;
  plaintextHash: string;
  sourceModifiedAtProvider: string;
  title: string;
  plaintext: string;
}

export interface PersonalKnowledgeInventorySource {
  snapshots: readonly PersonalKnowledgeInventorySnapshot[];
  attachmentRecordsExcluded: number;
  ocrRecordsExcluded: number;
}

const WARNINGS = [
  'Lexical matches are triage signals only; they are not clinical claims or evidence.',
  'This inventory is medically unreviewed and has no gameplay, scoring, or approval effect.',
  'HTML, attachments, OCR, composites, extracted chunks, and remote Drive sources are excluded.',
  'No private source prose or excerpts are stored in this inventory.',
] as const;

const sha256 = (value: Uint8Array | string): string =>
  createHash('sha256').update(value).digest('hex');

const normalize = (value: string): string => value.normalize('NFKC').toLocaleLowerCase('en-US');

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const isWordCharacter = (value: string | undefined): boolean =>
  value !== undefined && /[\p{L}\p{N}]/u.test(value);

export const countBoundaryAwareLiteralMatches = (haystack: string, term: string): number => {
  const normalizedHaystack = normalize(haystack);
  const needle = normalize(term);
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while (offset <= normalizedHaystack.length - needle.length) {
    const match = normalizedHaystack.indexOf(needle, offset);
    if (match < 0) break;
    const before = match > 0 ? normalizedHaystack[match - 1] : undefined;
    const after = normalizedHaystack[match + needle.length];
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

const normalizedTerms = (values: readonly string[]): string[] => {
  const byNormalized = new Map<string, string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = normalize(trimmed);
    if (!byNormalized.has(key)) byNormalized.set(key, trimmed);
  }
  return [...byNormalized.values()].sort((left, right) =>
    compareText(normalize(left), normalize(right)),
  );
};

export const buildDefaultPersonalKnowledgeInventoryTargets =
  (): PersonalKnowledgeInventoryTarget[] =>
    [
      ...medicationIdentities.map((identity) => ({
        targetKind: 'medication' as const,
        targetId: identity.id,
        label: identity.label,
        terms: normalizedTerms([
          identity.label,
          identity.normalizedIngredientName,
          ...identity.aliases,
        ]),
      })),
      ...catalogs.diagnoses.map((diagnosis) => ({
        targetKind: 'diagnosis' as const,
        targetId: diagnosis.id,
        label: diagnosis.label,
        terms: normalizedTerms([diagnosis.label]),
      })),
      ...catalogs.treatments
        .filter((treatment) => treatment.kind !== 'disposition')
        .map((treatment) => ({
          targetKind: 'intervention' as const,
          targetId: treatment.id,
          label: treatment.label,
          terms: normalizedTerms([treatment.label]),
        })),
      ...catalogs.tests.map((test) => ({
        targetKind: 'test' as const,
        targetId: test.id,
        label: test.label,
        terms: normalizedTerms([test.label]),
      })),
    ].sort((left, right) =>
      compareText(
        `${left.targetKind}\u0000${left.targetId}`,
        `${right.targetKind}\u0000${right.targetId}`,
      ),
    );

const stableSourceFingerprint = (
  snapshots: readonly PersonalKnowledgeInventorySnapshot[],
): string =>
  sha256(
    JSON.stringify(
      snapshots.map((snapshot) => ({
        noteRecordId: snapshot.noteRecordId,
        sourceDocumentId: snapshot.sourceDocumentId,
        titleHash: snapshot.titleHash,
        plaintextHash: snapshot.plaintextHash,
        sourceModifiedAtProvider: snapshot.sourceModifiedAtProvider,
      })),
    ),
  );

const stableTargetFingerprint = (targets: readonly PersonalKnowledgeInventoryTarget[]): string =>
  sha256(
    JSON.stringify(
      targets.map((target) => ({
        targetKind: target.targetKind,
        targetId: target.targetId,
        label: target.label,
        terms: target.terms,
      })),
    ),
  );

export const buildPersonalKnowledgeLexicalInventory = (
  source: PersonalKnowledgeInventorySource,
  rawTargets: readonly PersonalKnowledgeInventoryTarget[],
): PersonalKnowledgeLexicalInventory => {
  const sourceIds = source.snapshots.map((snapshot) => snapshot.noteRecordId);
  if (new Set(sourceIds).size !== sourceIds.length) {
    throw new Error('Personal-knowledge inventory source revision IDs must be unique.');
  }
  const targets = rawTargets
    .map((target) => ({ ...target, terms: normalizedTerms(target.terms) }))
    .sort((left, right) =>
      compareText(
        `${left.targetKind}\u0000${left.targetId}`,
        `${right.targetKind}\u0000${right.targetId}`,
      ),
    );
  const targetKeys = targets.map((target) => `${target.targetKind}\u0000${target.targetId}`);
  if (new Set(targetKeys).size !== targetKeys.length) {
    throw new Error('Personal-knowledge inventory target identities must be unique.');
  }
  if (targets.some((target) => target.terms.length === 0)) {
    throw new Error('Every inventory target requires at least one explicit term.');
  }
  const snapshots = [...source.snapshots].sort((left, right) =>
    compareText(left.noteRecordId, right.noteRecordId),
  );

  const entries = snapshots.map((snapshot) => {
    const text = `${snapshot.title}\n${snapshot.plaintext}`;
    const matches = targets.flatMap((target) => {
      const termMatches = target.terms
        .map((term) => ({ term, count: countBoundaryAwareLiteralMatches(text, term) }))
        .filter((match) => match.count > 0);
      const totalMatches = termMatches.reduce((sum, match) => sum + match.count, 0);
      return totalMatches > 0
        ? [
            {
              targetKind: target.targetKind,
              targetId: target.targetId,
              totalMatches,
              termMatches,
            },
          ]
        : [];
    });
    return {
      noteRecordId: snapshot.noteRecordId,
      sourceDocumentId: snapshot.sourceDocumentId,
      titleHash: snapshot.titleHash,
      plaintextHash: snapshot.plaintextHash,
      sourceModifiedAtProvider: snapshot.sourceModifiedAtProvider,
      matches,
    };
  });

  const targetSummaries = targets.map((target) => {
    const matches = entries.flatMap((entry) =>
      entry.matches.filter(
        (match) => match.targetKind === target.targetKind && match.targetId === target.targetId,
      ),
    );
    return {
      ...target,
      terms: [...target.terms],
      matchedSourceRevisions: matches.length,
      totalMatches: matches.reduce((sum, match) => sum + match.totalMatches, 0),
    };
  });
  const matchedSourceRevisions = entries.filter((entry) => entry.matches.length > 0).length;
  const sourceRevisionFingerprint = stableSourceFingerprint(snapshots);
  const targetCatalogFingerprint = stableTargetFingerprint(targets);

  return PersonalKnowledgeLexicalInventorySchema.parse({
    schemaVersion: 1,
    inventoryVersion: 1,
    id: `personal-knowledge-inventory.${sha256(
      `${sourceRevisionFingerprint}|${targetCatalogFingerprint}`,
    ).slice(0, 24)}`,
    scope: 'apple_notes_title_plaintext_only',
    classification: 'lexical_triage_only',
    medicalReviewStatus: 'unreviewed',
    clinicalUse: 'none',
    sourceRevisionFingerprint,
    targetCatalogFingerprint,
    summary: {
      eligibleSourceRevisions: entries.length,
      matchedSourceRevisions,
      unmatchedSourceRevisions: entries.length - matchedSourceRevisions,
      targetIdentityCount: targetSummaries.length,
      matchedTargetIdentityCount: targetSummaries.filter((target) => target.totalMatches > 0)
        .length,
      totalMatches: targetSummaries.reduce((sum, target) => sum + target.totalMatches, 0),
      attachmentRecordsExcluded: source.attachmentRecordsExcluded,
      ocrRecordsExcluded: source.ocrRecordsExcluded,
      remoteSourcesInspected: 0,
    },
    targets: targetSummaries,
    entries,
    warnings: WARNINGS,
  });
};

export const validatePersonalKnowledgeLexicalInventory = (
  inventory: PersonalKnowledgeLexicalInventory,
): PersonalKnowledgeLexicalInventory => {
  const parsed = PersonalKnowledgeLexicalInventorySchema.parse(inventory);
  const entryIds = parsed.entries.map((entry) => entry.noteRecordId);
  const targetKeys = parsed.targets.map((target) => `${target.targetKind}\u0000${target.targetId}`);
  if (
    new Set(entryIds).size !== entryIds.length ||
    JSON.stringify(entryIds) !== JSON.stringify([...entryIds].sort(compareText)) ||
    new Set(targetKeys).size !== targetKeys.length ||
    JSON.stringify(targetKeys) !== JSON.stringify([...targetKeys].sort(compareText))
  ) {
    throw new Error('Personal-knowledge lexical inventory ordering or identity is invalid.');
  }
  const aggregateByTarget = new Map<
    string,
    { matchedSourceRevisions: number; totalMatches: number }
  >(targetKeys.map((key) => [key, { matchedSourceRevisions: 0, totalMatches: 0 }]));
  for (const entry of parsed.entries) {
    const matchKeys = entry.matches.map((match) => `${match.targetKind}\u0000${match.targetId}`);
    if (
      new Set(matchKeys).size !== matchKeys.length ||
      JSON.stringify(matchKeys) !== JSON.stringify([...matchKeys].sort(compareText))
    ) {
      throw new Error('Personal-knowledge entry matches must be unique and sorted.');
    }
    for (const match of entry.matches) {
      const key = `${match.targetKind}\u0000${match.targetId}`;
      const aggregate = aggregateByTarget.get(key);
      if (!aggregate) {
        throw new Error('Personal-knowledge entry references an unknown target identity.');
      }
      if (
        match.totalMatches !==
        match.termMatches.reduce((sum, termMatch) => sum + termMatch.count, 0)
      ) {
        throw new Error('Personal-knowledge target match totals are inconsistent.');
      }
      aggregate.matchedSourceRevisions += 1;
      aggregate.totalMatches += match.totalMatches;
    }
  }
  for (const target of parsed.targets) {
    const aggregate = aggregateByTarget.get(`${target.targetKind}\u0000${target.targetId}`)!;
    if (
      target.matchedSourceRevisions !== aggregate.matchedSourceRevisions ||
      target.totalMatches !== aggregate.totalMatches
    ) {
      throw new Error('Personal-knowledge target aggregate is inconsistent.');
    }
  }
  const sourceFingerprint = sha256(
    JSON.stringify(
      parsed.entries.map((entry) => ({
        noteRecordId: entry.noteRecordId,
        sourceDocumentId: entry.sourceDocumentId,
        titleHash: entry.titleHash,
        plaintextHash: entry.plaintextHash,
        sourceModifiedAtProvider: entry.sourceModifiedAtProvider,
      })),
    ),
  );
  const targetFingerprint = sha256(
    JSON.stringify(
      parsed.targets.map((target) => ({
        targetKind: target.targetKind,
        targetId: target.targetId,
        label: target.label,
        terms: target.terms,
      })),
    ),
  );
  const matchedEntries = parsed.entries.filter((entry) => entry.matches.length > 0);
  const totalMatches = parsed.entries.reduce(
    (sum, entry) =>
      sum + entry.matches.reduce((matchSum, match) => matchSum + match.totalMatches, 0),
    0,
  );
  const matchedTargetCount = [...aggregateByTarget.values()].filter(
    (aggregate) => aggregate.totalMatches > 0,
  ).length;
  const expectedId = `personal-knowledge-inventory.${sha256(
    `${sourceFingerprint}|${targetFingerprint}`,
  ).slice(0, 24)}`;
  if (
    parsed.id !== expectedId ||
    parsed.sourceRevisionFingerprint !== sourceFingerprint ||
    parsed.targetCatalogFingerprint !== targetFingerprint ||
    parsed.summary.eligibleSourceRevisions !== parsed.entries.length ||
    parsed.summary.matchedSourceRevisions !== matchedEntries.length ||
    parsed.summary.unmatchedSourceRevisions !== parsed.entries.length - matchedEntries.length ||
    parsed.summary.targetIdentityCount !== parsed.targets.length ||
    parsed.summary.matchedTargetIdentityCount !== matchedTargetCount ||
    parsed.summary.totalMatches !== totalMatches
  ) {
    throw new Error('Personal-knowledge lexical inventory derived values are inconsistent.');
  }
  return parsed;
};

export const loadAuthorizedAppleNotesInventorySource = async (
  sourceRoot = DEFAULT_SOURCE_ROOT,
): Promise<PersonalKnowledgeInventorySource> => {
  const manifest = await loadAppleNotesIntakeManifestMetadata(sourceRoot);
  if (!manifest) throw new Error('No local Apple Notes intake manifest is available.');
  const eligibleNotes = manifest.notes
    .filter(
      (note) =>
        !note.locked &&
        ['exported', 'unchanged'].includes(note.exportStatus) &&
        note.titleHash !== null &&
        note.plaintextHash !== null &&
        note.sourceDocumentId !== null,
    )
    .sort((left, right) => compareText(left.id, right.id));
  const snapshots = await Promise.all(
    eligibleNotes.map(async (note) => {
      const snapshot = await readAppleNotesTitlePlaintextSnapshot(note.id, sourceRoot);
      if (
        snapshot.note.id !== note.id ||
        snapshot.note.sourceDocumentId !== note.sourceDocumentId ||
        snapshot.note.titleHash !== note.titleHash ||
        snapshot.note.plaintextHash !== note.plaintextHash ||
        snapshot.note.modifiedAtProvider !== note.modifiedAtProvider
      ) {
        throw new Error(`${note.id} no longer matches the private intake manifest.`);
      }
      return {
        noteRecordId: note.id,
        sourceDocumentId: note.sourceDocumentId!,
        titleHash: note.titleHash!,
        plaintextHash: note.plaintextHash!,
        sourceModifiedAtProvider: note.modifiedAtProvider,
        title: snapshot.title,
        plaintext: snapshot.plaintext,
      };
    }),
  );
  const attachments = manifest.notes.flatMap((note) => note.attachmentRecords);
  return {
    snapshots,
    attachmentRecordsExcluded: attachments.length,
    ocrRecordsExcluded: attachments.filter((attachment) => attachment.ocrStatus === 'completed')
      .length,
  };
};

export const DEFAULT_PERSONAL_KNOWLEDGE_INVENTORY_PATH = resolve(
  'content/generated/personal-knowledge/corpus-lexical-inventory.json',
);

const pathInside = (parent: string, child: string): boolean => {
  const relation = relative(resolve(parent), resolve(child));
  return relation === '' || (!relation.startsWith('..') && !isAbsolute(relation));
};

export const writePrivatePersonalKnowledgeInventory = async (
  inventory: PersonalKnowledgeLexicalInventory,
  outputPath = DEFAULT_PERSONAL_KNOWLEDGE_INVENTORY_PATH,
  protectedRoot = resolve('content/generated/personal-knowledge'),
): Promise<void> => {
  const parsed = validatePersonalKnowledgeLexicalInventory(inventory);
  const root = resolve(protectedRoot);
  const path = resolve(outputPath);
  if (!pathInside(root, path)) {
    throw new Error('Personal-knowledge inventory output resolves outside its protected root.');
  }
  await mkdir(root, { recursive: true, mode: 0o700 });
  await chmod(root, 0o700);
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error('Personal-knowledge inventory root must be a private regular directory.');
  }
  const resolvedRoot = await realpath(root);
  const outputDirectory = dirname(path);
  await mkdir(outputDirectory, { recursive: true, mode: 0o700 });
  await chmod(outputDirectory, 0o700);
  const resolvedDirectory = await realpath(outputDirectory);
  if (!pathInside(resolvedRoot, resolvedDirectory)) {
    throw new Error('Personal-knowledge inventory directory escaped its protected root.');
  }
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(parsed, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  await chmod(temporaryPath, 0o600);
  await rename(temporaryPath, path);
  await chmod(path, 0o600);
  const fileStat = await lstat(path);
  if (!fileStat.isFile() || fileStat.isSymbolicLink() || (fileStat.mode & 0o777) !== 0o600) {
    throw new Error('Personal-knowledge inventory must be a private 0600 regular file.');
  }
  const stored = PersonalKnowledgeLexicalInventorySchema.parse(
    JSON.parse(await readFile(path, 'utf8')) as unknown,
  );
  validatePersonalKnowledgeLexicalInventory(stored);
};
