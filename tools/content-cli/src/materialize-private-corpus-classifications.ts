import { createHash } from 'node:crypto';
import { chmod, lstat, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

import {
  EvidenceContributionTypeSchema,
  PersonalKnowledgePrivateCorpusAcknowledgementSchema,
  PersonalKnowledgePrivateCorpusClassificationSchema,
  PersonalKnowledgePrivateSourceCatalogSchema,
  PersonalKnowledgeTargetReferenceSchema,
  SourceChunkSchema,
  SourceDocumentSchema,
  type PersonalKnowledgePrivateCorpusClassification,
  type PersonalKnowledgePrivateSourceCatalog,
} from '@psychsim/schemas';

import privateSourceCatalogJson from '../../../content/catalogs/authoring/personal-knowledge/private-source-catalog.json';
import {
  groupParserV5SourceUnits,
  privateCorpusSourceUnitIdentity,
  type ParserV5ExtractionArtifact,
  type PrivateCorpusSourceUnitGroup,
} from './private-corpus-source-units';

const PartialDateSchema = z
  .string()
  .regex(
    /^\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/,
    'Expected YYYY, YYYY-MM, or YYYY-MM-DD',
  );
const DraftKeySchema = z
  .string()
  .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/)
  .max(120);
const CurrentnessSchema = z.enum(['needs_currentness_review', 'current', 'superseded', 'retired']);
const UnitKindSchema = z.enum([
  'personal_takeaway',
  'self_authored_article',
  'third_party_article',
  'presentation',
  'bibliography',
  'mixed',
  'unknown',
]);
const BoundaryStateSchema = z.enum(['complete', 'partial', 'continuation', 'uncertain']);
const ExcludedMaterialKindSchema = z.enum([
  'third_party_quote',
  'table',
  'figure',
  'instrument',
  'screenshot',
  'patient_information',
  'other',
]);
const DispositionSchema = z.enum([
  'candidate_material',
  'secondary_context',
  'irrelevant',
  'duplicate',
  'needs_more_context',
]);

const SourceUnitDraftSchema = z
  .object({
    unitKind: UnitKindSchema,
    boundaryState: BoundaryStateSchema,
    title: z.string().max(500).nullable(),
    byline: z.string().max(500).nullable(),
    venue: z.string().max(500).nullable(),
    url: z.string().url().nullable(),
    originalDate: PartialDateSchema.nullable(),
    revisedDate: PartialDateSchema.nullable(),
    assertedAuthorship: z.enum(['user_authored', 'coauthored']),
    currentness: CurrentnessSchema,
    excludedMaterialKinds: z.array(ExcludedMaterialKindSchema),
  })
  .strict();

const BibliographicDraftSchema = z
  .object({
    key: DraftKeySchema,
    citationRole: z.enum(['primary_subject', 'embedded_reference', 'mentioned_source', 'unclear']),
    title: z.string().max(500).nullable(),
    authors: z.array(z.string().min(1).max(200)),
    organization: z.string().max(300).nullable(),
    year: z.number().int().min(1800).max(2200).nullable(),
    doi: z.string().max(200).nullable(),
    pmid: z.string().regex(/^\d+$/).nullable(),
    url: z.string().url().nullable(),
    citationText: z.string().max(1200).nullable(),
    targets: z.array(PersonalKnowledgeTargetReferenceSchema),
  })
  .strict();

const OpinionDraftSchema = z
  .object({
    key: DraftKeySchema,
    summary: z.string().min(1).max(800),
    contributionTypes: z.array(EvidenceContributionTypeSchema).min(1),
    asOfDate: PartialDateSchema.nullable(),
    asOfDateBasis: z.enum(['source_date', 'revision_date', 'note_date', 'unknown']),
    currentness: CurrentnessSchema,
    targets: z.array(PersonalKnowledgeTargetReferenceSchema).min(1),
    nearbyBibliographicKeys: z.array(DraftKeySchema),
  })
  .strict();

const CompactPrivateCorpusUnitDraftSchema = z
  .object({
    sourceUnitSelector: z.discriminatedUnion('kind', [
      z
        .object({
          kind: z.literal('section_instance'),
          sectionInstance: z.number().int().positive(),
        })
        .strict(),
      z
        .object({
          kind: z.literal('unsectioned_chunk'),
          ordinal: z.number().int().nonnegative(),
        })
        .strict(),
    ]),
    disposition: DispositionSchema,
    dispositionSummary: z.string().min(1).max(800),
    sourceUnit: SourceUnitDraftSchema,
    bibliographicCandidates: z.array(BibliographicDraftSchema).max(40),
    opinionCandidates: z.array(OpinionDraftSchema).max(8),
  })
  .strict()
  .superRefine((draft, context) => {
    const bibliographyKeys = draft.bibliographicCandidates.map(({ key }) => key);
    const opinionKeys = draft.opinionCandidates.map(({ key }) => key);
    const unknownNearbyKey = draft.opinionCandidates
      .flatMap(({ nearbyBibliographicKeys }) => nearbyBibliographicKeys)
      .find((key) => !bibliographyKeys.includes(key));
    if (
      new Set(bibliographyKeys).size !== bibliographyKeys.length ||
      new Set(opinionKeys).size !== opinionKeys.length ||
      unknownNearbyKey
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['opinionCandidates'],
        message: 'Candidate keys must be unique and every nearby bibliography key must resolve.',
      });
    }
    if ((draft.disposition === 'candidate_material') !== draft.opinionCandidates.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['opinionCandidates'],
        message: 'Only candidate-material units may contain atomic Developer-opinion candidates.',
      });
    }
  });

export const CompactPrivateCorpusDraftBundleSchema = z
  .object({
    schemaVersion: z.literal(1),
    bundleVersion: z.literal(1),
    sourceDescriptorId: z.string().min(1),
    drafts: z.array(CompactPrivateCorpusUnitDraftSchema).min(1),
  })
  .strict()
  .superRefine((bundle, context) => {
    const selectors = bundle.drafts.map(({ sourceUnitSelector }) =>
      sourceUnitSelector.kind === 'section_instance'
        ? `section.${sourceUnitSelector.sectionInstance}`
        : `chunk.${sourceUnitSelector.ordinal}`,
    );
    if (new Set(selectors).size !== selectors.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['drafts'],
        message: 'A compact private-corpus bundle may classify each source unit only once.',
      });
    }
  });
export type CompactPrivateCorpusDraftBundle = z.infer<typeof CompactPrivateCorpusDraftBundleSchema>;

export interface PrivateCorpusSourceContext {
  descriptor: PersonalKnowledgePrivateSourceCatalog['entries'][number];
  artifact: ParserV5ExtractionArtifact;
  groups: PrivateCorpusSourceUnitGroup[];
}

export interface PrivateCorpusMaterializeAuthorization {
  modelIdentifier: string;
  promptVersion: string;
  acknowledgedBy: string;
  acknowledgedAt: string;
}

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');
const stableId = (prefix: string, value: string): string =>
  `${prefix}.${sha256(value).slice(0, 24)}`;
const readJson = async (path: string): Promise<unknown> =>
  JSON.parse(await readFile(path, 'utf8')) as unknown;
const pathInside = (parent: string, child: string): boolean => {
  const relation = relative(resolve(parent), resolve(child));
  return relation === '' || (!relation.startsWith('..') && !isAbsolute(relation));
};

const ExtractionArtifactSchema = z
  .object({
    schemaVersion: z.literal(1),
    document: SourceDocumentSchema,
    chunks: z.array(SourceChunkSchema),
  })
  .strict();

export const resolvePrivateCorpusSourceContexts = async ({
  sourceRoot = resolve('content/source-docs'),
  sourceCatalog = PersonalKnowledgePrivateSourceCatalogSchema.parse(privateSourceCatalogJson),
}: {
  sourceRoot?: string;
  sourceCatalog?: PersonalKnowledgePrivateSourceCatalog;
} = {}): Promise<Map<string, PrivateCorpusSourceContext>> => {
  const contexts = new Map<string, PrivateCorpusSourceContext>();
  for (const descriptor of sourceCatalog.entries) {
    const artifactPath = resolve(
      sourceRoot,
      'extracted',
      `source-document.${descriptor.expectedSha256.slice(0, 20)}.json`,
    );
    const artifact = ExtractionArtifactSchema.parse(await readJson(artifactPath));
    if (
      artifact.document.id !== `source-document.${descriptor.expectedSha256.slice(0, 20)}` ||
      artifact.document.parserVersion !== descriptor.semanticBoundaryReview.parserVersion ||
      artifact.document.extractedTextHash !== descriptor.semanticBoundaryReview.extractedTextHash
    ) {
      throw new Error(`${descriptor.id} no longer matches its reviewed extraction boundary.`);
    }
    contexts.set(descriptor.id, {
      descriptor,
      artifact,
      groups: groupParserV5SourceUnits(artifact, descriptor.unitStrategy),
    });
  }
  return contexts;
};

const selectorKey = (
  selector: z.infer<typeof CompactPrivateCorpusUnitDraftSchema>['sourceUnitSelector'],
): string =>
  selector.kind === 'section_instance'
    ? `section.${selector.sectionInstance}`
    : `chunk.${selector.ordinal}`;

const uniqueTargets = (
  targets: Array<z.infer<typeof PersonalKnowledgeTargetReferenceSchema>>,
): Array<z.infer<typeof PersonalKnowledgeTargetReferenceSchema>> => {
  const byJson = new Map<string, z.infer<typeof PersonalKnowledgeTargetReferenceSchema>>();
  targets.forEach((target) => byJson.set(JSON.stringify(target), target));
  return [...byJson.values()];
};

export const buildPrivateCorpusClassifications = (
  bundleInput: CompactPrivateCorpusDraftBundle,
  contexts: Map<string, PrivateCorpusSourceContext>,
  authorization: PrivateCorpusMaterializeAuthorization,
): PersonalKnowledgePrivateCorpusClassification[] => {
  const bundle = CompactPrivateCorpusDraftBundleSchema.parse(bundleInput);
  const context = contexts.get(bundle.sourceDescriptorId);
  if (!context) {
    throw new Error('The compact bundle references an unenrolled private source.');
  }
  if (context.descriptor.semanticBoundaryReview.status !== 'approved') {
    throw new Error('The compact bundle source does not have an approved semantic boundary.');
  }
  const acknowledgement = PersonalKnowledgePrivateCorpusAcknowledgementSchema.parse({
    schemaVersion: 1,
    contentScope: 'enrolled_private_corpus_source_unit',
    noIdentifiablePatientInformation: true,
    authorizedForExternalAiProcessing: true,
    sourceProcessingRightsAcknowledged: true,
    appropriateToTransmitToOpenAiCodex: true,
    provider: 'openai_codex',
    modelIdentifier: authorization.modelIdentifier,
    acknowledgedAt: authorization.acknowledgedAt,
    acknowledgedBy: authorization.acknowledgedBy,
  });

  return bundle.drafts.map((draft) => {
    const key = selectorKey(draft.sourceUnitSelector);
    const group = context.groups.find((candidate) => candidate.key === key);
    if (!group) throw new Error('A compact bundle selector no longer resolves its source unit.');
    const identity = privateCorpusSourceUnitIdentity(context.artifact, group);
    const semanticInput = JSON.stringify({
      descriptor: context.descriptor.id,
      sourceDocument: context.artifact.document.id,
      identity,
      modelIdentifier: authorization.modelIdentifier,
      promptVersion: authorization.promptVersion,
      acknowledgedBy: authorization.acknowledgedBy,
      draft,
    });
    const classificationId = stableId('private-corpus-classification', semanticInput);
    const sourceUnitCandidateId = stableId(
      'authored-source-unit-candidate',
      `${classificationId}|source-unit`,
    );
    const bibliographyIds = new Map(
      draft.bibliographicCandidates.map(({ key: bibliographyKey }) => [
        bibliographyKey,
        stableId('bibliographic-candidate', `${classificationId}|${bibliographyKey}`),
      ]),
    );
    const allTargets = uniqueTargets([
      ...draft.bibliographicCandidates.flatMap(({ targets }) => targets),
      ...draft.opinionCandidates.flatMap(({ targets }) => targets),
    ]);
    return PersonalKnowledgePrivateCorpusClassificationSchema.parse({
      schemaVersion: 1,
      classificationVersion: 1,
      id: classificationId,
      sourceDescriptorId: context.descriptor.id,
      sourceDocumentId: context.artifact.document.id,
      sourceDocumentSha256: context.descriptor.expectedSha256,
      parserVersion: 'psychsim-source-parser-5',
      developerDatabaseUnitId: identity.id,
      unitFingerprint: identity.fingerprint,
      classifiedAt: authorization.acknowledgedAt,
      modelIdentifier: authorization.modelIdentifier,
      promptVersion: authorization.promptVersion,
      acknowledgement,
      disposition: draft.disposition,
      dispositionSummary: draft.dispositionSummary,
      sourceUnitCandidate: {
        schemaVersion: 1,
        candidateVersion: 1,
        id: sourceUnitCandidateId,
        sourceLocators: identity.sourceLocators,
        ...draft.sourceUnit,
        rightsState: 'private_processing_only',
        targets: allTargets,
        semanticRunId: classificationId,
        reviewStatus: 'proposed',
      },
      bibliographicCandidates: draft.bibliographicCandidates.map((bibliography) => ({
        schemaVersion: 1,
        candidateVersion: 1,
        id: bibliographyIds.get(bibliography.key),
        sourceUnitCandidateIds: [sourceUnitCandidateId],
        sourceUnitIds: [],
        sourceLocators: identity.sourceLocators,
        citationRole: bibliography.citationRole,
        title: bibliography.title,
        authors: bibliography.authors,
        organization: bibliography.organization,
        year: bibliography.year,
        doi: bibliography.doi,
        pmid: bibliography.pmid,
        url: bibliography.url,
        citationText: bibliography.citationText,
        targets: bibliography.targets,
        verificationStatus: 'unverified',
        matchedEvidenceSourceId: null,
        semanticRunId: classificationId,
        reviewStatus: 'proposed',
      })),
      opinionCandidates: draft.opinionCandidates.map((opinion) => ({
        schemaVersion: 1,
        candidateVersion: 1,
        id: stableId('developer-opinion-candidate', `${classificationId}|${opinion.key}`),
        sourceUnitCandidateIds: [sourceUnitCandidateId],
        sourceUnitIds: [],
        sourceLocators: identity.sourceLocators,
        summary: opinion.summary,
        contributionTypes: opinion.contributionTypes,
        asOfDate: opinion.asOfDate,
        asOfDateBasis: opinion.asOfDateBasis,
        currentness: opinion.currentness,
        targets: opinion.targets,
        nearbyBibliographicCandidateIds: opinion.nearbyBibliographicKeys.map((bibliographyKey) =>
          bibliographyIds.get(bibliographyKey),
        ),
        semanticRunId: classificationId,
        reviewStatus: 'proposed',
        medicalReviewStatus: 'unreviewed',
        needsHumanReview: true,
      })),
    });
  });
};

const semanticallyEqualIgnoringTimestamps = (
  left: PersonalKnowledgePrivateCorpusClassification,
  right: PersonalKnowledgePrivateCorpusClassification,
): boolean =>
  JSON.stringify({
    ...left,
    classifiedAt: null,
    acknowledgement: { ...left.acknowledgement, acknowledgedAt: null },
  }) ===
  JSON.stringify({
    ...right,
    classifiedAt: null,
    acknowledgement: { ...right.acknowledgement, acknowledgedAt: null },
  });

export const writePrivateCorpusClassifications = async (
  classifications: PersonalKnowledgePrivateCorpusClassification[],
  outputRoot = resolve('content/source-docs/extracted/personal-knowledge-private/classifications'),
): Promise<{ materialized: number; unchanged: number }> => {
  const root = resolve(outputRoot);
  await mkdir(root, { recursive: true, mode: 0o700 });
  await chmod(root, 0o700);
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink() || (rootStat.mode & 0o777) !== 0o700) {
    throw new Error('Private classification output requires a private 0700 directory.');
  }
  let materialized = 0;
  let unchanged = 0;
  for (const classification of classifications) {
    const parsed = PersonalKnowledgePrivateCorpusClassificationSchema.parse(classification);
    const path = resolve(root, `${parsed.developerDatabaseUnitId}.json`);
    if (!pathInside(root, path)) {
      throw new Error('Private classification output escaped its protected root.');
    }
    try {
      const stat = await lstat(path);
      if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o777) !== 0o600) {
        throw new Error('Existing private classification is not a private regular file.');
      }
      const existing = PersonalKnowledgePrivateCorpusClassificationSchema.parse(
        await readJson(path),
      );
      if (!semanticallyEqualIgnoringTimestamps(existing, parsed)) {
        throw new Error(
          'A different classification already exists for this source unit; use a reviewed supersession workflow.',
        );
      }
      unchanged += 1;
      continue;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    const temporaryPath = `${path}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(parsed, null, 2)}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
    await chmod(temporaryPath, 0o600);
    await rename(temporaryPath, path);
    await chmod(path, 0o600);
    materialized += 1;
  }
  return { materialized, unchanged };
};

interface CliOptions {
  input: string;
  authorization: PrivateCorpusMaterializeAuthorization;
}

const requireArgument = (args: string[], name: string): string => {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error(`Missing required ${name} value.`);
  return value;
};

const parseCliOptions = (args: string[], now: string): CliOptions => {
  const requiredFlags = [
    '--ack-no-phi',
    '--ack-authorized-external-ai-processing',
    '--ack-source-processing-rights',
    '--ack-appropriate-to-transmit',
  ];
  if (requiredFlags.some((flag) => !args.includes(flag))) {
    throw new Error('All private-source authorization acknowledgements are required.');
  }
  return {
    input: resolve(requireArgument(args, '--input')),
    authorization: {
      modelIdentifier: requireArgument(args, '--model'),
      promptVersion: requireArgument(args, '--prompt-version'),
      acknowledgedBy: requireArgument(args, '--acknowledged-by'),
      acknowledgedAt: now,
    },
  };
};

const readPrivateBundle = async (path: string): Promise<CompactPrivateCorpusDraftBundle> => {
  const stat = await lstat(path);
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.size > 2_000_000 ||
    (stat.mode & 0o777) !== 0o600
  ) {
    throw new Error('Private draft input must be a mode-0600 regular file no larger than 2 MB.');
  }
  return CompactPrivateCorpusDraftBundleSchema.parse(await readJson(path));
};

export const runMaterializePrivateCorpusCli = async (
  args: string[],
  now = new Date().toISOString(),
): Promise<{ materialized: number; unchanged: number }> => {
  const options = parseCliOptions(args, now);
  const [bundle, contexts] = await Promise.all([
    readPrivateBundle(options.input),
    resolvePrivateCorpusSourceContexts(),
  ]);
  return writePrivateCorpusClassifications(
    buildPrivateCorpusClassifications(bundle, contexts, options.authorization),
  );
};

const isDirectExecution =
  process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectExecution) {
  runMaterializePrivateCorpusCli(process.argv.slice(2))
    .then(({ materialized, unchanged }) => {
      console.log(`MATERIALIZED ${materialized} · UNCHANGED ${unchanged}`);
      console.log(
        'Private summaries remain local, medically unreviewed, and excluded from gameplay.',
      );
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
