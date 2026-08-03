import { createHash, randomUUID } from 'node:crypto';
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  readdir,
  rename,
  unlink,
} from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';

import {
  AppleNotesIntakeManifestSchema,
  ConditionFindingProfileCatalogSchema,
  DecisionBalanceCatalogSchema,
  DecisionPolicyCatalogSchema,
  DeveloperDatabaseKnowledgeProjectionSchema,
  DeveloperOpinionCatalogSchema,
  EvidenceSourceDefinitionSchema,
  ExposureCatalogSchema,
  MedicationRegimenKnowledgeCatalogSchema,
  PersonalKnowledgeAuthoringAliasCatalogSchema,
  PersonalKnowledgePrivateCorpusClassificationSchema,
  PersonalKnowledgePrivateSourceCatalogSchema,
  PersonalKnowledgeWorkbenchProjectionSchema,
  RemoteSourceDiscoveryManifestSchema,
  SourceChunkSchema,
  SourceDocumentSchema,
  SourceManifestSchema,
  SourceUseDecisionCatalogSchema,
  UniversalActionResultAssemblyCatalogSchema,
  type DeveloperDatabaseKnowledgeProjection,
  type DeveloperDatabaseSemanticState,
  type DeveloperDatabaseSourceKind,
  type DeveloperDatabaseSourceSurface,
  type DeveloperOpinion,
  type DeveloperOpinionCatalog,
  type EvidenceContribution,
  type EvidenceSourceDefinition,
  type OpinionEvidenceRelationship,
  type PersonalKnowledgeAuthoringAliasCatalog,
  type PersonalKnowledgePrivateCorpusClassification,
  type PersonalKnowledgePrivateSourceCatalog,
  type PersonalKnowledgeWorkbenchProjection,
  type PublicClinicalCatalogEntry,
  type SourceChunk,
  type SourceDocument,
  type SourceManifest,
  type SourceUseDecision,
} from '@psychsim/schemas';
import { catalogs, publicClinicalCatalog } from '@psychsim/content-runtime';

import aliasCatalogJson from '../../../content/catalogs/authoring/personal-knowledge/cross-reference-aliases.json';
import conditionFindingProfileCatalogJson from '../../../content/catalogs/diagnoses/condition-finding-profiles.json';
import decisionBalanceCatalogJson from '../../../content/catalogs/decision-policies/balances.json';
import decisionPolicyCatalogJson from '../../../content/catalogs/decision-policies/catalog.json';
import privateSourceCatalogJson from '../../../content/catalogs/authoring/personal-knowledge/private-source-catalog.json';
import developerOpinionsJson from '../../../content/catalogs/evidence/opinions/developer-opinions.json';
import exposureCatalogJson from '../../../content/catalogs/exposures/definitions.json';
import medicationRegimenKnowledgeCatalogJson from '../../../content/catalogs/medications/regimen-knowledge.json';
import registryJson from '../../../content/registry.json';
import sourceUseDecisionsJson from '../../../content/catalogs/evidence/source-use-decisions.json';
import universalActionResultAssemblyCatalogJson from '../../../content/catalogs/actions/universal-action-result-assemblies.json';
import {
  loadPersonalKnowledgePilotProfile,
  loadPersonalKnowledgePilotQueue,
} from './personal-knowledge-workspace';
import {
  calculateSourceChunkProvenanceHash,
  DEFAULT_SOURCE_ROOT,
  sourceParserUsesStructuredProvenance,
  validateSourceManifestArtifactCoverage,
} from './source-pipeline';
import {
  groupParserV5SourceUnits,
  privateCorpusSourceUnitIdentity,
} from './private-corpus-source-units';

interface ExtractionArtifact {
  schemaVersion: 1;
  document: SourceDocument;
  chunks: SourceChunk[];
}

interface SurfaceText {
  surface: DeveloperDatabaseSourceSurface;
  text: string;
}

interface PersonalKnowledgeRevisionIdentity {
  noteRecordId: string;
  sourceDocumentId: string;
  titleHash: string;
  plaintextHash: string;
  sourceModifiedAtProvider: string;
}

type WorkbenchCandidate =
  PersonalKnowledgeWorkbenchProjection['dossiers'][number]['candidates'][number];

export interface DeveloperDatabaseCorpusUnitInput {
  id: string;
  sourceKind: DeveloperDatabaseSourceKind;
  sourceRole: 'personal_research_note' | 'user_authored_article' | 'private_notes';
  displayLabel: string;
  sourceModifiedAt: string | null;
  boundaryState: 'complete' | 'warning' | 'unstructured';
  accessState: 'fully_indexed' | 'partially_indexed' | 'quarantined';
  semanticState: DeveloperDatabaseSemanticState;
  surfaces: readonly SurfaceText[];
}

export interface DeveloperDatabaseKnowledgeBuildInput {
  units: readonly DeveloperDatabaseCorpusUnitInput[];
  aliasCatalog: PersonalKnowledgeAuthoringAliasCatalog;
  workbench: PersonalKnowledgeWorkbenchProjection | null;
  privateCorpusClassifications?: readonly PersonalKnowledgePrivateCorpusClassification[];
  evidenceSources: readonly EvidenceSourceDefinition[];
  sourceUseDecisions: readonly SourceUseDecision[];
  developerOpinions: readonly DeveloperOpinion[];
  opinionEvidenceRelationships: readonly OpinionEvidenceRelationship[];
  generatedAt: string;
  appleNotesRevisions: number;
  appleNotesAttachmentRecords: number;
  appleNotesOcrCompleted: number;
  privateDriveDocuments: number;
}

const sha256 = (value: Uint8Array | string): string =>
  createHash('sha256').update(value).digest('hex');

const normalize = (value: string): string =>
  value.normalize('NFKC').toLocaleLowerCase('en-US').trim();

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const medicationRegimenKnowledgeCatalog = MedicationRegimenKnowledgeCatalogSchema.parse(
  medicationRegimenKnowledgeCatalogJson,
);
const authoringClinicalRegistryKinds = new Set([
  'finding_projection_catalog',
  'finding_projection_horizon_catalog',
  'universal_action_result_assembly_catalog',
  'clinical_duration_profile_catalog',
  'condition_finding_profile_catalog',
  'race_ethnicity_catalog',
]);
const authoringClinicalRegistryIds = (
  registryJson as {
    entries: Array<{
      id: string;
      kind: string;
      runtimeIncluded: boolean;
      categoryIds?: string[];
    }>;
  }
).entries.flatMap((entry) =>
  !entry.runtimeIncluded && authoringClinicalRegistryKinds.has(entry.kind)
    ? [entry.id, ...(entry.categoryIds ?? [])]
    : [],
);
const authoringDiagnosisRuleIds = catalogs.diagnoses.flatMap((diagnosis) => [
  ...diagnosis.baseRules.map((rule) => rule.id),
  ...(diagnosis.severityAxis === null
    ? []
    : [
        diagnosis.severityAxis.id,
        ...(diagnosis.severityAxis.derivationPolicy === null
          ? []
          : [diagnosis.severityAxis.derivationPolicy.id]),
        ...diagnosis.severityAxis.levels.map((level) => level.id),
      ]),
  ...diagnosis.specifiers.map((specifier) => specifier.id),
  ...diagnosis.complexityContributions.map((contribution) => contribution.id),
]);
const universalActionResultAssemblyCatalog = UniversalActionResultAssemblyCatalogSchema.parse(
  universalActionResultAssemblyCatalogJson,
);
const authoringActionResultRuleIds = universalActionResultAssemblyCatalog.assemblies.flatMap(
  (assembly) => [
    assembly.id,
    ...assembly.structuredRevealDefinitions.map((definition) => definition.id),
    ...assembly.targetScopedPatientValueProjectionDefinitions.map((definition) => definition.id),
    ...assembly.recipes.map((recipe) => recipe.id),
  ],
);
const authoringClinicalRuleIds = new Set(
  [
    ...medicationRegimenKnowledgeCatalog.medicationClasses,
    ...medicationRegimenKnowledgeCatalog.classMemberships,
    ...medicationRegimenKnowledgeCatalog.focusedRoutes,
    ...medicationRegimenKnowledgeCatalog.contributors,
    ...DecisionPolicyCatalogSchema.parse(decisionPolicyCatalogJson).policies,
    ...DecisionBalanceCatalogSchema.parse(decisionBalanceCatalogJson).balances,
    ...ExposureCatalogSchema.parse(exposureCatalogJson).misuseGenerationPriors,
    ...ConditionFindingProfileCatalogSchema.parse(conditionFindingProfileCatalogJson).profiles,
    ...authoringClinicalRegistryIds.map((id) => ({ id })),
    ...authoringDiagnosisRuleIds.map((id) => ({ id })),
    ...authoringActionResultRuleIds.map((id) => ({ id })),
  ].map((entry) => entry.id),
);

const normalizeSearchText = (value: string): string =>
  value.normalize('NFKC').toLocaleLowerCase('en-US');

const isWordCharacter = (value: string | undefined): boolean =>
  value !== undefined && /[\p{L}\p{N}]/u.test(value);

interface TermSpan {
  term: string;
  start: number;
  end: number;
}

const boundaryAwareTermSpans = (text: string, term: string): TermSpan[] => {
  const haystack = normalizeSearchText(text);
  const needle = normalizeSearchText(term).trim();
  if (!needle) return [];
  const spans: TermSpan[] = [];
  let offset = 0;
  while (offset <= haystack.length - needle.length) {
    const start = haystack.indexOf(needle, offset);
    if (start < 0) break;
    const end = start + needle.length;
    const startsWithWord = isWordCharacter(needle[0]);
    const endsWithWord = isWordCharacter(needle[needle.length - 1]);
    if (
      (!startsWithWord || !isWordCharacter(haystack[start - 1])) &&
      (!endsWithWord || !isWordCharacter(haystack[end]))
    ) {
      spans.push({ term, start, end });
    }
    offset = start + 1;
  }
  return spans;
};

export const nonOverlappingTermMatches = (
  surfaces: readonly SurfaceText[],
  terms: readonly string[],
): Array<{
  term: string;
  count: number;
  surfaces: DeveloperDatabaseSourceSurface[];
}> => {
  const counts = new Map<
    string,
    { term: string; count: number; surfaces: Set<DeveloperDatabaseSourceSurface> }
  >();
  for (const { surface, text } of surfaces) {
    const spans = terms
      .flatMap((term) => boundaryAwareTermSpans(text, term))
      .sort(
        (left, right) =>
          left.start - right.start ||
          right.end - right.start - (left.end - left.start) ||
          compareText(normalize(left.term), normalize(right.term)),
      );
    let acceptedEnd = -1;
    for (const span of spans) {
      if (span.start < acceptedEnd) continue;
      acceptedEnd = span.end;
      const key = normalize(span.term);
      const current = counts.get(key) ?? {
        term: span.term,
        count: 0,
        surfaces: new Set<DeveloperDatabaseSourceSurface>(),
      };
      current.count += 1;
      current.surfaces.add(surface);
      counts.set(key, current);
    }
  }
  return [...counts.values()]
    .map(({ term, count, surfaces: matchedSurfaces }) => ({
      term,
      count,
      surfaces: [...matchedSurfaces].sort(compareText),
    }))
    .sort((left, right) => compareText(normalize(left.term), normalize(right.term)));
};

const normalizedTerms = (values: readonly string[]): string[] => {
  const byNormalized = new Map<string, string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed.length < 2) continue;
    const key = normalize(trimmed);
    if (!byNormalized.has(key)) byNormalized.set(key, trimmed);
  }
  return [...byNormalized.values()].sort((left, right) =>
    compareText(normalize(left), normalize(right)),
  );
};

const abbreviationTerms = (value: string): string[] =>
  [...value.matchAll(/\(([A-Za-z][A-Za-z0-9-]{1,14})\)/g)]
    .map((match) => match[1]!)
    .filter((term) => term.length >= 2);

const baseTermsForEntry = (entry: PublicClinicalCatalogEntry): string[] => {
  const terms = [entry.label, ...abbreviationTerms(entry.label)];
  switch (entry.kind) {
    case 'medication':
      terms.push(entry.normalizedIngredientName, ...entry.aliases);
      break;
    case 'reference':
      if (entry.doi) terms.push(entry.doi);
      if (entry.pmid) terms.push(entry.pmid);
      break;
    case 'test':
      break;
    case 'condition':
    case 'intervention':
    case 'disposition':
    case 'investigation':
      break;
  }
  return normalizedTerms(terms);
};

export const validatePersonalKnowledgeAliasCatalog = (
  rawCatalog: PersonalKnowledgeAuthoringAliasCatalog,
): PersonalKnowledgeAuthoringAliasCatalog => {
  const catalog = PersonalKnowledgeAuthoringAliasCatalogSchema.parse(rawCatalog);
  const entryById = new Map(publicClinicalCatalog.entries.map((entry) => [entry.id, entry]));
  const aliasOwners = new Map<string, string>();
  for (const entry of catalog.entries) {
    const target = entryById.get(entry.targetContentId);
    if (!target) {
      throw new Error(`${entry.id} references unknown database entry ${entry.targetContentId}.`);
    }
    if (target.categoryId !== entry.targetCategoryId) {
      throw new Error(
        `${entry.id} classifies ${entry.targetContentId} as ${entry.targetCategoryId}, not ${target.categoryId}.`,
      );
    }
    for (const alias of entry.aliases) {
      const normalizedAlias = normalize(alias);
      const existingOwner = aliasOwners.get(normalizedAlias);
      if (existingOwner && existingOwner !== entry.targetContentId) {
        throw new Error(
          `Authoring alias “${alias}” ambiguously targets ${existingOwner} and ${entry.targetContentId}.`,
        );
      }
      aliasOwners.set(normalizedAlias, entry.targetContentId);
    }
  }
  return catalog;
};

const buildTargetTerms = (
  aliasCatalog: PersonalKnowledgeAuthoringAliasCatalog,
): Map<string, string[]> => {
  const aliasesByTarget = new Map(
    aliasCatalog.entries.map((entry) => [entry.targetContentId, entry.aliases]),
  );
  return new Map(
    publicClinicalCatalog.entries.map((entry) => [
      entry.id,
      normalizedTerms([...baseTermsForEntry(entry), ...(aliasesByTarget.get(entry.id) ?? [])]),
    ]),
  );
};

const substantiveWorkbenchForFingerprint = (
  workbench: PersonalKnowledgeWorkbenchProjection | null,
) =>
  workbench
    ? {
        schemaVersion: workbench.schemaVersion,
        projectionVersion: workbench.projectionVersion,
        pilotTopicId: workbench.pilotTopicId,
        summary: workbench.summary,
        dossiers: workbench.dossiers,
        sourceUnitCandidates: workbench.sourceUnitCandidates,
        unmappedCandidates: workbench.unmappedCandidates,
        unmappedBibliographicCandidates: workbench.unmappedBibliographicCandidates,
        warnings: workbench.warnings,
      }
    : null;

const buildInputFingerprint = (input: DeveloperDatabaseKnowledgeBuildInput): string =>
  sha256(
    JSON.stringify({
      units: [...input.units]
        .sort((left, right) => compareText(left.id, right.id))
        .map((unit) => ({
          id: unit.id,
          sourceKind: unit.sourceKind,
          sourceRole: unit.sourceRole,
          sourceModifiedAt: unit.sourceModifiedAt,
          boundaryState: unit.boundaryState,
          accessState: unit.accessState,
          semanticState: unit.semanticState,
          surfaces: [...unit.surfaces]
            .sort((left, right) => compareText(left.surface, right.surface))
            .map((surface) => ({
              surface: surface.surface,
              textHash: sha256(surface.text),
            })),
        })),
      aliasCatalog: input.aliasCatalog,
      publicCatalog: publicClinicalCatalog,
      workbench: substantiveWorkbenchForFingerprint(input.workbench),
      privateCorpusClassifications: [...(input.privateCorpusClassifications ?? [])].sort(
        (left, right) => compareText(left.id, right.id),
      ),
      evidenceSources: [...input.evidenceSources].sort((left, right) =>
        compareText(left.id, right.id),
      ),
      sourceUseDecisions: [...input.sourceUseDecisions].sort((left, right) =>
        compareText(left.id, right.id),
      ),
      developerOpinions: [...input.developerOpinions].sort((left, right) =>
        compareText(left.id, right.id),
      ),
      opinionEvidenceRelationships: [...input.opinionEvidenceRelationships].sort((left, right) =>
        compareText(left.id, right.id),
      ),
    }),
  );

const sourceUseStatus = (
  decision: SourceUseDecision | undefined,
):
  | 'permitted_with_conditions'
  | 'metadata_only'
  | 'blocked_pending_permission'
  | 'not_reviewed'
  | 'not_recorded' => decision?.decisionStatus ?? 'not_recorded';

const formalSourceProjection = (
  source: EvidenceSourceDefinition,
  decision: SourceUseDecision | undefined,
) => ({
  id: source.id,
  title: source.title,
  citation: source.citation,
  url: source.url,
  sourceUseDecisionId: decision?.id ?? null,
  sourceUseStatus: sourceUseStatus(decision),
  derivedClinicalContentPermitted: decision?.permissions.derivedClinicalContent ?? false,
  runtimeRedistributionPermitted: decision?.permissions.runtimeRedistribution ?? false,
  attributionStatement: decision?.attributionStatement ?? null,
  requiredNotices: decision?.requiredNotices ?? [],
  sourceUseReviewedAt: decision?.reviewedAt ?? null,
  medicalReviewStatus: source.medicalReviewStatus,
});

const formalContributionProjection = (
  contribution: EvidenceContribution,
  evidenceById: ReadonlyMap<string, EvidenceSourceDefinition>,
  decisionByEvidenceId: ReadonlyMap<string, SourceUseDecision>,
) => ({
  id: contribution.id,
  authority: contribution.authority,
  summary: contribution.contribution,
  contributionTypes: contribution.contributionTypes,
  evidenceSources: contribution.evidenceSourceIds.map((sourceId) => {
    const source = evidenceById.get(sourceId);
    if (!source) throw new Error(`${contribution.id} references unknown source ${sourceId}.`);
    const decision = decisionByEvidenceId.get(sourceId);
    if (
      contribution.authority === 'formal_publication' &&
      (!decision || !decision.permissions.derivedClinicalContent)
    ) {
      throw new Error(
        `${contribution.id} cannot be projected as derived content under ${sourceId}'s source-use decision.`,
      );
    }
    return formalSourceProjection(source, decision);
  }),
  generatedBy: contribution.generatedBy,
  medicalReviewStatus: contribution.medicalReviewStatus,
});

const developerOpinionProjection = (
  opinion: DeveloperOpinion,
  relationships: readonly OpinionEvidenceRelationship[],
  evidenceById: ReadonlyMap<string, EvidenceSourceDefinition>,
  decisionByEvidenceId: ReadonlyMap<string, SourceUseDecision>,
) => {
  const publicEntryIds = new Set(publicClinicalCatalog.entries.map((entry) => entry.id));
  return {
    id: opinion.id,
    summary: opinion.summary,
    developerId: opinion.developerId,
    contributionTypes: opinion.contributionTypes,
    asOfDate: opinion.asOfDate,
    currentness: opinion.currentness,
    targetEntryIds: opinion.targets
      .map((target) => target.targetContentId)
      .filter((targetContentId) => publicEntryIds.has(targetContentId))
      .sort(compareText),
    reviewStatus: opinion.developerReview.status,
    reviewedBy: opinion.developerReview.reviewerId,
    reviewedAt: opinion.developerReview.reviewedAt,
    reviewNote: opinion.developerReview.note,
    evidenceRelationships: relationships
      .filter((relationship) => relationship.opinionId === opinion.id)
      .map((relationship) => {
        const source = evidenceById.get(relationship.evidenceSourceId);
        if (!source) {
          throw new Error(
            `${relationship.id} references unknown source ${relationship.evidenceSourceId}.`,
          );
        }
        const decision = decisionByEvidenceId.get(relationship.evidenceSourceId);
        if (
          !decision ||
          decision.id !== relationship.sourceUseDecisionId ||
          decision.decisionStatus !== 'permitted_with_conditions' ||
          !decision.permissions.derivedClinicalContent
        ) {
          throw new Error(
            `${relationship.id} lacks a matching derived-content-cleared source-use decision.`,
          );
        }
        return {
          id: relationship.id,
          relationType: relationship.relationType,
          relationshipSummary: relationship.relationshipSummary,
          sourceLocation: relationship.sourceLocation,
          applicabilityLimitations: relationship.applicabilityLimitations,
          stillExpertBridge: relationship.stillExpertBridge,
          evidenceSource: formalSourceProjection(source, decision),
          reviewStatus: relationship.review.status,
        };
      })
      .sort((left, right) => compareText(left.id, right.id)),
    ruleEligibility: opinion.ruleEligibility,
  };
};

const relatedEntryMap = (
  developerOpinions: readonly DeveloperOpinion[],
  opinionEvidenceRelationships: readonly OpinionEvidenceRelationship[],
): Map<string, Set<string>> => {
  const existingIds = new Set(publicClinicalCatalog.entries.map((entry) => entry.id));
  const relationships = new Map<string, Set<string>>(
    publicClinicalCatalog.entries.map((entry) => [entry.id, new Set<string>()]),
  );
  const connect = (left: string, right: string): void => {
    if (left === right || !existingIds.has(left) || !existingIds.has(right)) return;
    relationships.get(left)!.add(right);
    relationships.get(right)!.add(left);
  };
  for (const entry of publicClinicalCatalog.entries) {
    if (entry.kind === 'medication') connect(entry.id, entry.identityEvidenceSourceId);
    if (entry.kind === 'test') connect(entry.id, entry.relatedActionId);
    if (entry.kind === 'reference') {
      for (const relation of entry.sourceRelations) connect(entry.id, relation.sourceId);
    }
  }
  for (const diagnosis of catalogs.diagnoses) {
    for (const contribution of diagnosis.sourceUseNotes) {
      for (const targetContentId of contribution.targetContentIds) {
        for (const sourceId of contribution.evidenceSourceIds) {
          connect(targetContentId, sourceId);
        }
      }
    }
  }
  for (const medication of catalogs.medications) {
    for (const contribution of medication.sourceUseNotes) {
      for (const targetContentId of contribution.targetContentIds) {
        for (const sourceId of contribution.evidenceSourceIds) {
          connect(targetContentId, sourceId);
        }
      }
    }
  }
  const relationshipsByOpinionId = new Map<string, OpinionEvidenceRelationship[]>();
  for (const relationship of opinionEvidenceRelationships) {
    relationshipsByOpinionId.set(relationship.opinionId, [
      ...(relationshipsByOpinionId.get(relationship.opinionId) ?? []),
      relationship,
    ]);
  }
  for (const opinion of developerOpinions) {
    for (const target of opinion.targets) {
      for (const relationship of relationshipsByOpinionId.get(opinion.id) ?? []) {
        connect(target.targetContentId, relationship.evidenceSourceId);
      }
    }
  }
  return relationships;
};

const rulesForEntry = (entry: PublicClinicalCatalogEntry) => {
  if (entry.kind === 'medication') {
    const medication = catalogs.medications.find((candidate) => candidate.id === entry.id);
    if (!medication) return [];
    return [
      ...medication.fitModifiers.map((modifier) => ({
        id: modifier.id,
        ruleKind: 'active_medication_fit' as const,
        summary: modifier.explanation,
        pointDelta: modifier.pointDelta,
        stance: null,
        medicalReviewStatus: modifier.medicalReviewStatus,
        sourceUseNoteIds: modifier.sourceUseNoteIds,
      })),
      ...medication.authorOverrides.map((modifier) => ({
        id: modifier.id,
        ruleKind: 'inactive_author_override' as const,
        summary: modifier.explanation,
        pointDelta: modifier.pointDelta,
        stance: null,
        medicalReviewStatus: modifier.medicalReviewStatus,
        sourceUseNoteIds: modifier.sourceUseNoteIds,
      })),
    ].sort((left, right) => compareText(left.id, right.id));
  }
  if (entry.kind !== 'condition') return [];
  const diagnosis = catalogs.diagnoses.find((candidate) => candidate.id === entry.id);
  if (!diagnosis) return [];
  const rules = [
    ...diagnosis.baseRules,
    ...(diagnosis.severityAxis?.levels.flatMap((level) => level.rules) ?? []),
    ...diagnosis.specifiers.flatMap((specifier) => specifier.rules),
  ];
  return rules
    .map((rule) => ({
      id: rule.id,
      ruleKind: 'diagnosis_recommendation' as const,
      summary: `${rule.label}: ${rule.rationale}`,
      pointDelta: null,
      stance: rule.stance,
      medicalReviewStatus: rule.review.status,
      sourceUseNoteIds: rule.review.sourceUseNoteIds,
    }))
    .sort((left, right) => compareText(left.id, right.id));
};

const contributionsForEntry = (entry: PublicClinicalCatalogEntry): EvidenceContribution[] => {
  const entryRuleIds = new Set(rulesForEntry(entry).map((rule) => rule.id));
  return [
    ...catalogs.diagnoses.flatMap((diagnosis) => diagnosis.sourceUseNotes),
    ...catalogs.medications.flatMap((medication) => medication.sourceUseNotes),
  ].filter(
    (contribution) =>
      contribution.targetContentIds.includes(entry.id) ||
      contribution.targetContentIds.some((targetContentId) => entryRuleIds.has(targetContentId)),
  );
};

export const buildDeveloperDatabaseKnowledgeProjection = (
  input: DeveloperDatabaseKnowledgeBuildInput,
): DeveloperDatabaseKnowledgeProjection => {
  const aliasCatalog = validatePersonalKnowledgeAliasCatalog(input.aliasCatalog);
  const targetTerms = buildTargetTerms(aliasCatalog);
  const publicEntryIds = new Set(publicClinicalCatalog.entries.map((entry) => entry.id));
  const dossierTargetIds = (input.workbench?.dossiers ?? []).map((dossier) => dossier.targetId);
  const unknownDossierTarget = dossierTargetIds.find((targetId) => !publicEntryIds.has(targetId));
  if (unknownDossierTarget) {
    throw new Error(
      `Personal-knowledge workbench dossier targets unknown database entry ${unknownDossierTarget}.`,
    );
  }
  if (new Set(dossierTargetIds).size !== dossierTargetIds.length) {
    throw new Error('Personal-knowledge workbench dossiers require unique target IDs.');
  }
  const evidenceById = new Map(input.evidenceSources.map((source) => [source.id, source]));
  const decisionByEvidenceId = new Map(
    input.sourceUseDecisions.map((decision) => [decision.evidenceSourceId, decision]),
  );
  const dossierByTarget = new Map(
    (input.workbench?.dossiers ?? []).map((dossier) => [dossier.targetId, dossier]),
  );
  const relationships = relatedEntryMap(
    input.developerOpinions,
    input.opinionEvidenceRelationships,
  );
  const sortedUnits = [...input.units].sort((left, right) => compareText(left.id, right.id));
  const unitIds = new Set(sortedUnits.map((unit) => unit.id));
  const privateCorpusClassifications = (input.privateCorpusClassifications ?? [])
    .map((classification) =>
      PersonalKnowledgePrivateCorpusClassificationSchema.parse(classification),
    )
    .sort((left, right) => compareText(left.id, right.id));
  if (
    new Set(privateCorpusClassifications.map((classification) => classification.id)).size !==
      privateCorpusClassifications.length ||
    new Set(
      privateCorpusClassifications.map((classification) => classification.developerDatabaseUnitId),
    ).size !== privateCorpusClassifications.length
  ) {
    throw new Error('Private-corpus semantic classifications require unique run and unit IDs.');
  }
  const classificationByUnitId = new Map(
    privateCorpusClassifications.map((classification) => [
      classification.developerDatabaseUnitId,
      classification,
    ]),
  );
  const unknownClassifiedUnitId = privateCorpusClassifications
    .map((classification) => classification.developerDatabaseUnitId)
    .find((unitId) => !unitIds.has(unitId));
  if (unknownClassifiedUnitId) {
    throw new Error(
      `Private-corpus semantic classification targets unknown unit ${unknownClassifiedUnitId}.`,
    );
  }
  const safeCandidateByTarget = new Map<string, Array<WorkbenchCandidate>>();
  const safeBibliographyByTarget = new Map<
    string,
    Array<
      PersonalKnowledgeWorkbenchProjection['dossiers'][number]['bibliographicCandidates'][number]
    >
  >();
  const safeUnmappedCandidates = [...(input.workbench?.unmappedCandidates ?? [])];
  const safeUnmappedBibliographicCandidates = [
    ...(input.workbench?.unmappedBibliographicCandidates ?? []),
  ];
  const publicEntryById = new Map(publicClinicalCatalog.entries.map((entry) => [entry.id, entry]));
  const expectedTargetKind = (
    entry: PublicClinicalCatalogEntry,
  ): 'medication' | 'diagnosis' | 'intervention' | 'test' | null => {
    switch (entry.kind) {
      case 'medication':
        return 'medication';
      case 'condition':
        return 'diagnosis';
      case 'intervention':
        return 'intervention';
      case 'test':
        return 'test';
      case 'disposition':
      case 'supplement':
      case 'investigation':
      case 'reference':
        return null;
    }
  };
  for (const opinion of input.developerOpinions) {
    for (const target of opinion.targets) {
      if (target.targetKind === 'clinical_rule') {
        if (!authoringClinicalRuleIds.has(target.targetContentId)) {
          throw new Error(
            `${opinion.id} targets unknown authoring-only clinical rule ${target.targetContentId}.`,
          );
        }
        continue;
      }
      if (!['medication', 'diagnosis', 'intervention', 'test'].includes(target.targetKind)) {
        throw new Error(
          `${opinion.id} targets unsupported authoring-only ${target.targetKind} ${target.targetContentId}.`,
        );
      }
      const publicEntry = publicEntryById.get(target.targetContentId);
      if (!publicEntry || expectedTargetKind(publicEntry) !== target.targetKind) {
        throw new Error(
          `${opinion.id} targets ${target.targetKind} entry ${target.targetContentId} outside the compatible public database.`,
        );
      }
    }
  }
  for (const classification of privateCorpusClassifications) {
    for (const opinion of classification.opinionCandidates) {
      const unresolvedTargets = opinion.targets.flatMap((target) =>
        target.resolution === 'unresolved'
          ? [
              {
                targetKindHint: target.targetKindHint,
                searchLabel: target.searchLabel,
                role: target.role,
                reason: target.reason,
              },
            ]
          : [],
      );
      const projectedCandidate = {
        id: opinion.id,
        summary: opinion.summary,
        sourceUnitId: classification.sourceUnitCandidate.id,
        sourceDate: opinion.asOfDate,
        currentness: opinion.currentness,
        reviewStatus: opinion.reviewStatus,
        contributionTypes: opinion.contributionTypes,
        resolvedTargets: opinion.targets.flatMap((target) =>
          target.resolution === 'resolved'
            ? [
                {
                  targetKind: target.targetKind,
                  targetContentId: target.targetContentId,
                  role: target.role,
                },
              ]
            : [],
        ),
        unresolvedTargets,
        evidenceRelations: [],
      };
      let resolvedTargetCount = 0;
      for (const target of opinion.targets) {
        if (target.resolution !== 'resolved') continue;
        const publicEntry = publicEntryById.get(target.targetContentId);
        if (!publicEntry || expectedTargetKind(publicEntry) !== target.targetKind) {
          throw new Error(
            `${opinion.id} resolves ${target.targetKind} target ${target.targetContentId} outside the compatible public database.`,
          );
        }
        const candidates = safeCandidateByTarget.get(target.targetContentId) ?? [];
        candidates.push(projectedCandidate);
        safeCandidateByTarget.set(target.targetContentId, candidates);
        resolvedTargetCount += 1;
      }
      if (resolvedTargetCount === 0) {
        safeUnmappedCandidates.push(projectedCandidate);
      }
    }
    for (const bibliography of classification.bibliographicCandidates) {
      const displayCitation =
        bibliography.citationText ??
        [
          bibliography.authors.join(', '),
          bibliography.title,
          bibliography.organization,
          bibliography.year,
        ]
          .filter((value) => value !== null && value !== '')
          .join('. ');
      const projectedBibliography = {
        id: bibliography.id,
        displayCitation: displayCitation || 'Unverified bibliography candidate',
        verificationStatus: bibliography.verificationStatus,
        matchedEvidenceSourceId: bibliography.matchedEvidenceSourceId,
      };
      let resolvedTargetCount = 0;
      for (const target of bibliography.targets) {
        if (target.resolution !== 'resolved') continue;
        const publicEntry = publicEntryById.get(target.targetContentId);
        if (!publicEntry || expectedTargetKind(publicEntry) !== target.targetKind) {
          throw new Error(
            `${bibliography.id} resolves ${target.targetKind} target ${target.targetContentId} outside the compatible public database.`,
          );
        }
        const candidates = safeBibliographyByTarget.get(target.targetContentId) ?? [];
        candidates.push(projectedBibliography);
        safeBibliographyByTarget.set(target.targetContentId, candidates);
        resolvedTargetCount += 1;
      }
      if (resolvedTargetCount === 0) {
        safeUnmappedBibliographicCandidates.push(projectedBibliography);
      }
    }
  }

  const candidateUniverseById = new Map<string, WorkbenchCandidate>();
  const registerCandidate = (candidate: WorkbenchCandidate): void => {
    const existing = candidateUniverseById.get(candidate.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(candidate)) {
      throw new Error(`${candidate.id} has divergent Developer database projections.`);
    }
    candidateUniverseById.set(candidate.id, candidate);
  };
  for (const dossier of input.workbench?.dossiers ?? []) {
    dossier.candidates.forEach(registerCandidate);
  }
  (input.workbench?.unmappedCandidates ?? []).forEach(registerCandidate);
  for (const candidates of safeCandidateByTarget.values()) {
    candidates.forEach(registerCandidate);
  }
  safeUnmappedCandidates.forEach(registerCandidate);
  const candidateUniverse = [...candidateUniverseById.values()].sort((left, right) =>
    compareText(left.id, right.id),
  );
  const unresolvedTargetOccurrences = candidateUniverse.flatMap((candidate) =>
    candidate.unresolvedTargets.map((target) => ({
      candidateId: candidate.id,
      targetKindHint: target.targetKindHint,
      searchLabel: target.searchLabel,
      role: target.role,
      reason: target.reason,
    })),
  );
  const identityOccurrencesByKey = new Map<string, typeof unresolvedTargetOccurrences>();
  for (const occurrence of unresolvedTargetOccurrences) {
    const key = JSON.stringify({
      normalizedSearchLabel: normalize(occurrence.searchLabel),
      targetKindHint: occurrence.targetKindHint,
    });
    identityOccurrencesByKey.set(key, [...(identityOccurrencesByKey.get(key) ?? []), occurrence]);
  }
  const identityGaps = [...identityOccurrencesByKey.entries()]
    .map(([key, occurrences]) => {
      const normalizedSearchLabel = normalize(occurrences[0]!.searchLabel);
      const targetKindHint = occurrences[0]!.targetKindHint;
      const candidateEntryIds = publicClinicalCatalog.entries
        .filter(
          (entry) =>
            (targetKindHint === null || expectedTargetKind(entry) === targetKindHint) &&
            (targetTerms.get(entry.id) ?? []).some(
              (term) => normalize(term) === normalizedSearchLabel,
            ),
        )
        .map((entry) => entry.id)
        .sort(compareText);
      const supportsCatalogEntry =
        targetKindHint === null ||
        ['medication', 'diagnosis', 'intervention', 'test'].includes(targetKindHint);
      const status =
        candidateEntryIds.length === 1
          ? ('likely_existing_entry' as const)
          : candidateEntryIds.length > 1
            ? ('ambiguous_existing_entries' as const)
            : !supportsCatalogEntry
              ? ('non_catalog_target' as const)
              : targetKindHint === null
                ? ('needs_kind_review' as const)
                : ('proposed_new_catalog_entry' as const);
      return {
        id: `catalog-identity-gap.${sha256(key).slice(0, 24)}`,
        normalizedSearchLabel,
        displayLabel: [...occurrences]
          .map((occurrence) => occurrence.searchLabel)
          .sort(compareText)[0]!,
        targetKindHint,
        status,
        candidateEntryIds,
        occurrences: [...occurrences].sort(
          (left, right) =>
            compareText(left.candidateId, right.candidateId) ||
            compareText(left.role, right.role) ||
            compareText(left.reason, right.reason),
        ),
        reviewRequired: true as const,
      };
    })
    .sort(
      (left, right) =>
        compareText(left.normalizedSearchLabel, right.normalizedSearchLabel) ||
        compareText(left.targetKindHint ?? '', right.targetKindHint ?? ''),
    );
  const indexedTermOwners = new Map<string, Set<string>>();
  for (const entry of publicClinicalCatalog.entries) {
    for (const term of targetTerms.get(entry.id) ?? []) {
      const normalizedTerm = normalize(term);
      indexedTermOwners.set(
        normalizedTerm,
        new Set([...(indexedTermOwners.get(normalizedTerm) ?? []), entry.id]),
      );
    }
  }
  const overlappingTerms = [...indexedTermOwners.entries()]
    .filter(([, entryIds]) => entryIds.size > 1)
    .map(([normalizedTerm, entryIds]) => ({
      id: `catalog-term-overlap.${sha256(normalizedTerm).slice(0, 24)}`,
      normalizedTerm,
      entryIds: [...entryIds].sort(compareText),
      reviewStatus: 'needs_developer_review' as const,
    }))
    .sort((left, right) => compareText(left.normalizedTerm, right.normalizedTerm));

  const signalByTarget = new Map<
    string,
    Array<{
      unitId: string;
      sourceKind: DeveloperDatabaseSourceKind;
      sourceRole: DeveloperDatabaseCorpusUnitInput['sourceRole'];
      sourceModifiedAt: string | null;
      surfaces: DeveloperDatabaseSourceSurface[];
      semanticState: DeveloperDatabaseSemanticState;
      totalMatches: number;
      matchedTerms: Array<{
        term: string;
        count: number;
        surfaces: DeveloperDatabaseSourceSurface[];
      }>;
    }>
  >();
  const corpusUnits = sortedUnits.map((unit) => {
    const semanticClassification = classificationByUnitId.get(unit.id);
    const semanticState =
      semanticClassification && !['reviewed_no_change', 'incorporated'].includes(unit.semanticState)
        ? semanticClassification.opinionCandidates.length > 0
          ? ('candidate_created' as const)
          : ('classified_no_candidate' as const)
        : unit.semanticState;
    const targetEntryIds: string[] = [];
    let totalMatches = 0;
    for (const entry of publicClinicalCatalog.entries) {
      const matchedTerms = nonOverlappingTermMatches(
        unit.surfaces,
        targetTerms.get(entry.id) ?? [],
      );
      if (matchedTerms.length === 0) continue;
      const entryTotal = matchedTerms.reduce((sum, match) => sum + match.count, 0);
      targetEntryIds.push(entry.id);
      totalMatches += entryTotal;
      const signals = signalByTarget.get(entry.id) ?? [];
      signals.push({
        unitId: unit.id,
        sourceKind: unit.sourceKind,
        sourceRole: unit.sourceRole,
        sourceModifiedAt: unit.sourceModifiedAt,
        surfaces: [...new Set(matchedTerms.flatMap((match) => match.surfaces))].sort(compareText),
        semanticState,
        totalMatches: entryTotal,
        matchedTerms,
      });
      signalByTarget.set(entry.id, signals);
    }
    return {
      id: unit.id,
      sourceKind: unit.sourceKind,
      sourceRole: unit.sourceRole,
      displayLabel: unit.displayLabel,
      sourceModifiedAt: unit.sourceModifiedAt,
      surfaces: [...new Set(unit.surfaces.map((surface) => surface.surface))].sort(compareText),
      boundaryState: unit.boundaryState,
      accessState: unit.accessState,
      semanticState,
      semanticDisposition: semanticClassification?.disposition ?? null,
      semanticSummary: semanticClassification?.dispositionSummary ?? null,
      targetEntryIds: targetEntryIds.sort(compareText),
      totalMatches,
    };
  });

  const records = publicClinicalCatalog.entries.map((entry) => {
    const lexicalSignals = (signalByTarget.get(entry.id) ?? []).sort((left, right) =>
      compareText(left.unitId, right.unitId),
    );
    const dossier = dossierByTarget.get(entry.id);
    const candidateSummaries = [
      ...(dossier?.candidates ?? []),
      ...(safeCandidateByTarget.get(entry.id) ?? []),
    ].sort((left, right) => compareText(left.id, right.id));
    if (
      new Set(candidateSummaries.map((candidate) => candidate.id)).size !==
      candidateSummaries.length
    ) {
      throw new Error(`${entry.id} has duplicate semantic candidate IDs.`);
    }
    const bibliographicCandidates = [
      ...(dossier?.bibliographicCandidates ?? []),
      ...(safeBibliographyByTarget.get(entry.id) ?? []),
    ].sort((left, right) => compareText(left.id, right.id));
    if (
      new Set(bibliographicCandidates.map((candidate) => candidate.id)).size !==
      bibliographicCandidates.length
    ) {
      throw new Error(`${entry.id} has duplicate bibliography candidate IDs.`);
    }
    const entryTargetKind = expectedTargetKind(entry);
    const entryTermKeys = new Set((targetTerms.get(entry.id) ?? []).map(normalize));
    const directCandidateIds = new Set(candidateSummaries.map((candidate) => candidate.id));
    const unresolvedCandidateMentions = candidateUniverse.filter(
      (candidate) =>
        !directCandidateIds.has(candidate.id) &&
        candidate.unresolvedTargets.some(
          (target) =>
            (target.targetKindHint === null || target.targetKindHint === entryTargetKind) &&
            entryTermKeys.has(normalize(target.searchLabel)),
        ),
    );
    const developerOpinions = input.developerOpinions
      .filter((opinion) => opinion.targets.some((target) => target.targetContentId === entry.id))
      .map((opinion) =>
        developerOpinionProjection(
          opinion,
          input.opinionEvidenceRelationships,
          evidenceById,
          decisionByEvidenceId,
        ),
      )
      .sort((left, right) => compareText(left.id, right.id));
    const accepted =
      candidateSummaries.some((candidate) => candidate.reviewStatus === 'accepted') ||
      developerOpinions.some((opinion) => opinion.reviewStatus === 'accepted');
    const compilationState = accepted
      ? ('reviewed_knowledge' as const)
      : candidateSummaries.length > 0
        ? ('candidate_material' as const)
        : lexicalSignals.length > 0
          ? ('lexically_linked' as const)
          : entry.kind === 'medication' && entry.authoringStatus === 'identity_only'
            ? ('identity_only' as const)
            : ('no_personal_match' as const);
    return {
      entryId: entry.id,
      categoryId: entry.categoryId,
      label: entry.label,
      compilationState,
      indexedTerms: targetTerms.get(entry.id) ?? [entry.label],
      personalSourceUnitCount: lexicalSignals.length,
      personalSourceTotalMatches: lexicalSignals.reduce(
        (sum, signal) => sum + signal.totalMatches,
        0,
      ),
      lexicalSignals,
      candidateSummaries,
      unresolvedCandidateMentions,
      bibliographicCandidates,
      formalContributions: contributionsForEntry(entry)
        .map((contribution) =>
          formalContributionProjection(contribution, evidenceById, decisionByEvidenceId),
        )
        .sort((left, right) => compareText(left.id, right.id)),
      developerOpinions,
      ruleSummaries: rulesForEntry(entry),
      relatedEntryIds: [...(relationships.get(entry.id) ?? [])].sort(compareText),
    };
  });
  const unitsWithTargetMatches = corpusUnits.filter(
    (unit) => unit.targetEntryIds.length > 0,
  ).length;
  const unmappedCandidateSummaries = safeUnmappedCandidates.sort((left, right) =>
    compareText(left.id, right.id),
  );
  const unmappedBibliographicCandidates = safeUnmappedBibliographicCandidates.sort((left, right) =>
    compareText(left.id, right.id),
  );
  const candidateIds = new Set([
    ...records.flatMap((record) => record.candidateSummaries.map(({ id }) => id)),
    ...unmappedCandidateSummaries.map(({ id }) => id),
  ]);
  const acceptedOpinionIds = new Set([
    ...records.flatMap((record) =>
      record.candidateSummaries
        .filter((candidate) => candidate.reviewStatus === 'accepted')
        .map(({ id }) => id),
    ),
    ...records.flatMap((record) =>
      record.developerOpinions
        .filter((opinion) => opinion.reviewStatus === 'accepted')
        .map(({ id }) => id),
    ),
    ...unmappedCandidateSummaries
      .filter((candidate) => candidate.reviewStatus === 'accepted')
      .map(({ id }) => id),
  ]);
  const formalSourceIds = new Set(
    records.flatMap((record) => [
      ...record.formalContributions.flatMap((contribution) =>
        contribution.evidenceSources.map((source) => source.id),
      ),
      ...record.developerOpinions.flatMap((opinion) =>
        opinion.evidenceRelationships.map((relationship) => relationship.evidenceSource.id),
      ),
    ]),
  );
  const formalSourceRegistry = [...input.evidenceSources]
    .map((source) => formalSourceProjection(source, decisionByEvidenceId.get(source.id)))
    .sort((left, right) => compareText(left.title, right.title) || compareText(left.id, right.id));

  return DeveloperDatabaseKnowledgeProjectionSchema.parse({
    schemaVersion: 1,
    projectionVersion: 2,
    generatedAt: input.generatedAt,
    catalogContentVersion: publicClinicalCatalog.catalogContentVersion,
    inputFingerprint: buildInputFingerprint(input),
    summary: {
      personalSourceDocuments: input.appleNotesRevisions + input.privateDriveDocuments,
      appleNotesRevisions: input.appleNotesRevisions,
      appleNotesAttachmentRecords: input.appleNotesAttachmentRecords,
      appleNotesOcrCompleted: input.appleNotesOcrCompleted,
      privateDriveDocuments: input.privateDriveDocuments,
      userAuthoredArchiveUnits: corpusUnits.filter(
        (unit) => unit.sourceKind === 'user_authored_archive',
      ).length,
      sourceUnits: corpusUnits.length,
      fullyIndexedUnits: corpusUnits.filter((unit) => unit.accessState === 'fully_indexed').length,
      partiallyIndexedUnits: corpusUnits.filter((unit) => unit.accessState === 'partially_indexed')
        .length,
      quarantinedUnits: corpusUnits.filter((unit) => unit.accessState === 'quarantined').length,
      unitsWithTargetMatches,
      unitsWithoutTargetMatches: corpusUnits.length - unitsWithTargetMatches,
      targetEntries: records.length,
      matchedTargetEntries: records.filter((record) => record.personalSourceUnitCount > 0).length,
      totalLexicalMatches: records.reduce(
        (sum, record) => sum + record.personalSourceTotalMatches,
        0,
      ),
      semanticallyClassifiedUnits: corpusUnits.filter((unit) =>
        [
          'classified_no_candidate',
          'candidate_created',
          'reviewed_no_change',
          'incorporated',
        ].includes(unit.semanticState),
      ).length,
      candidateSummaries: candidateIds.size,
      acceptedOpinions: acceptedOpinionIds.size,
      formalContributions: records.reduce(
        (sum, record) => sum + record.formalContributions.length,
        0,
      ),
      formalSources: formalSourceIds.size,
      registeredFormalSources: formalSourceRegistry.length,
    },
    corpusUnits,
    records,
    formalSourceRegistry,
    unmappedCandidateSummaries,
    unmappedBibliographicCandidates,
    catalogIdentityAudit: {
      identityGaps,
      overlappingTerms,
    },
    warnings: [
      'Every listed personal source unit was indexed locally, but lexical links are retrieval signals—not clinical claims, diagnoses, evidence, or approval.',
      'A source can be physically extracted and lexically linked without being semantically summarized, clinically reviewed, or incorporated into a database rule.',
      'Apple Notes composite indexing includes locally available attachment OCR; partial-access units preserve failed or unsupported attachment extraction instead of hiding it.',
      'Private source prose, headings, filenames, provider IDs, document/chunk IDs, and filesystem paths are excluded from this browser projection.',
      'Formal-source contributions, Developer-opinion candidates, executable clinical rules, and game-balance points remain separate lanes.',
      'Every atomized unresolved target is retained in the catalog identity audit as a likely match, an ambiguity, a proposed new entry, a non-catalog target, or a kind-review gap; none is auto-merged.',
      'This projection is local-Developer-only, medically unreviewed, runtime-excluded, and has no gameplay effect.',
    ],
  });
};

const readJson = async (path: string): Promise<unknown> =>
  JSON.parse(await readFile(path, 'utf8')) as unknown;

const validateArtifact = (
  artifact: ExtractionArtifact,
  manifest: SourceManifest,
): ExtractionArtifact => {
  const entry = manifest.entries.find(
    (candidate) => candidate.id === artifact.document.sourceManifestEntryId,
  );
  if (!entry || entry.status !== 'extracted') {
    throw new Error(`${artifact.document.id} lacks an extracted source-manifest entry.`);
  }
  if (entry.parserVersion !== artifact.document.parserVersion) {
    throw new Error(`${artifact.document.id} parser provenance changed.`);
  }
  for (const chunk of artifact.chunks) {
    if (
      chunk.sourceDocumentId !== artifact.document.id ||
      sha256(chunk.text) !== chunk.textHash ||
      (chunk.provenanceHash &&
        calculateSourceChunkProvenanceHash(chunk) !== chunk.provenanceHash) ||
      (sourceParserUsesStructuredProvenance(artifact.document.parserVersion) &&
        !chunk.provenanceHash)
    ) {
      throw new Error(`${chunk.id} failed extraction integrity validation.`);
    }
  }
  if (
    sha256(
      [...artifact.chunks]
        .sort((left, right) => left.ordinal - right.ordinal)
        .map((chunk) => chunk.text)
        .join('\n\n'),
    ) !== artifact.document.extractedTextHash
  ) {
    throw new Error(`${artifact.document.id} combined text hash changed.`);
  }
  return artifact;
};

const loadArtifacts = async (
  sourceRoot: string,
  manifest: SourceManifest,
): Promise<Map<string, ExtractionArtifact>> => {
  const extractedRoot = resolve(sourceRoot, 'extracted');
  const artifactPaths = (await readdir(extractedRoot))
    .filter((filename) => /^source-document\..+\.json$/.test(filename))
    .sort(compareText);
  const artifacts = new Map<string, ExtractionArtifact>();
  for (const filename of artifactPaths) {
    const raw = (await readJson(join(extractedRoot, filename))) as {
      schemaVersion?: unknown;
      document?: unknown;
      chunks?: unknown;
    };
    if (raw.schemaVersion !== 1) throw new Error(`${filename} has an unsupported schema version.`);
    const artifact = validateArtifact(
      {
        schemaVersion: 1,
        document: SourceDocumentSchema.parse(raw.document),
        chunks: SourceChunkSchema.array().parse(raw.chunks),
      },
      manifest,
    );
    artifacts.set(artifact.document.id, artifact);
  }
  validateSourceManifestArtifactCoverage(
    manifest,
    [...artifacts.values()].map((artifact) => artifact.document),
  );
  return artifacts;
};

const semanticStateForQueueState = (
  queueState: string | undefined,
): DeveloperDatabaseSemanticState => {
  switch (queueState) {
    case 'queued':
    case 'released':
      return 'queued';
    case 'partially_classified':
      return 'partially_classified';
    case 'classified':
      return 'candidate_created';
    case 'adjudicated':
      return 'incorporated';
    default:
      return 'not_semantically_reviewed';
  }
};

export const personalKnowledgeRevisionKey = (revision: PersonalKnowledgeRevisionIdentity): string =>
  [
    revision.noteRecordId,
    revision.sourceDocumentId,
    revision.titleHash,
    revision.plaintextHash,
    revision.sourceModifiedAtProvider,
  ].join('|');

export const buildQueueStateByRevision = (
  entries: readonly (PersonalKnowledgeRevisionIdentity & { id: string; state: string })[],
): Map<string, string> => {
  const states = new Map<string, string>();
  for (const entry of entries) {
    const key = personalKnowledgeRevisionKey(entry);
    if (states.has(key)) {
      throw new Error(`Personal-knowledge queue has duplicate current revision ${entry.id}.`);
    }
    states.set(key, entry.state);
  }
  return states;
};

export const appleNoteSurfaces = (chunks: readonly SourceChunk[]): SurfaceText[] => {
  const collected = new Map<DeveloperDatabaseSourceSurface, string[]>();
  let current: DeveloperDatabaseSourceSurface | null = null;
  for (const chunk of [...chunks].sort((left, right) => left.ordinal - right.ordinal)) {
    if (chunk.section === 'Note title') current = 'note_title';
    else if (chunk.section === 'Note text') current = 'note_plaintext';
    else if (/^Attachment \d+ OCR$/.test(chunk.section ?? '')) current = 'attachment_ocr';
    else current = null;
    if (current) {
      collected.set(current, [...(collected.get(current) ?? []), chunk.text]);
    }
  }
  return [...collected.entries()].map(([surface, texts]) => ({
    surface,
    text: texts.join('\n\n'),
  }));
};

const makeOpaqueUnitId = (value: string): string => `knowledge-unit.${sha256(value).slice(0, 24)}`;

const loadWorkbenchIfPresent = async (
  path = resolve('content/generated/personal-knowledge/workbench.json'),
): Promise<PersonalKnowledgeWorkbenchProjection | null> => {
  try {
    return PersonalKnowledgeWorkbenchProjectionSchema.parse(await readJson(path));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
};

const loadPrivateCorpusClassifications = async (
  sourceRoot: string,
): Promise<PersonalKnowledgePrivateCorpusClassification[]> => {
  const directory = resolve(
    sourceRoot,
    'extracted',
    'personal-knowledge-private',
    'classifications',
  );
  let filenames: string[];
  try {
    filenames = (await readdir(directory))
      .filter((filename) => filename.endsWith('.json'))
      .sort(compareText);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  const directoryStat = await lstat(directory);
  if (
    !directoryStat.isDirectory() ||
    directoryStat.isSymbolicLink() ||
    (directoryStat.mode & 0o077) !== 0
  ) {
    throw new Error('Private-corpus semantic classifications require a private directory.');
  }
  const resolvedDirectory = await realpath(directory);
  const classifications: PersonalKnowledgePrivateCorpusClassification[] = [];
  for (const filename of filenames) {
    const path = resolve(directory, filename);
    const stat = await lstat(path);
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      stat.size > 2_000_000 ||
      (stat.mode & 0o777) !== 0o600
    ) {
      throw new Error(`${filename} failed the private semantic-classification file boundary.`);
    }
    const resolvedPath = await realpath(path);
    const relation = relative(resolvedDirectory, resolvedPath);
    if (!relation || relation.startsWith('..') || isAbsolute(relation)) {
      throw new Error(`${filename} escaped the private semantic-classification root.`);
    }
    classifications.push(
      PersonalKnowledgePrivateCorpusClassificationSchema.parse(await readJson(resolvedPath)),
    );
  }
  return classifications;
};

const loadFormalEvidenceCatalog = async (): Promise<EvidenceSourceDefinition[]> => {
  const registry = registryJson as {
    entries?: Array<{ kind?: unknown; path?: unknown; id?: unknown }>;
  };
  const paths = (registry.entries ?? [])
    .filter((entry) => entry.kind === 'evidence_source' && typeof entry.path === 'string')
    .map((entry) => resolve(entry.path as string));
  const formalRoot = resolve('content/catalogs/evidence/formal');
  const sources: EvidenceSourceDefinition[] = [];
  for (const path of paths) {
    const relation = relative(formalRoot, path);
    if (!relation || relation.startsWith('..') || isAbsolute(relation)) {
      throw new Error('Evidence registry path escaped the formal-source catalog.');
    }
    sources.push(EvidenceSourceDefinitionSchema.parse(await readJson(path)));
  }
  return sources.sort((left, right) => compareText(left.id, right.id));
};

const groupParserV5Units = (
  artifact: ExtractionArtifact,
  sourceKind: 'user_authored_archive' | 'private_drive_notes',
  sourceRole: 'user_authored_article' | 'private_notes',
  sourceModifiedAt: string | null,
  unitStrategy: 'parser_v5_section_instance' | 'parser_v5_unsectioned_chunks',
): DeveloperDatabaseCorpusUnitInput[] =>
  groupParserV5SourceUnits(artifact, unitStrategy).map((group, index) => ({
    id: privateCorpusSourceUnitIdentity(artifact, group).id,
    sourceKind,
    sourceRole,
    displayLabel:
      sourceKind === 'user_authored_archive'
        ? `User-authored archive unit ${String(index + 1).padStart(2, '0')}`
        : `Private Drive notes unit ${String(index + 1).padStart(2, '0')}`,
    sourceModifiedAt,
    boundaryState:
      (artifact.document.extractionWarningCount ?? 0) > 0
        ? 'warning'
        : unitStrategy === 'parser_v5_section_instance' && group.chunks[0]?.sectionInstance
          ? 'complete'
          : 'unstructured',
    accessState: 'fully_indexed',
    semanticState: 'not_semantically_reviewed',
    surfaces: [
      {
        surface: 'structured_document',
        text: group.chunks.map((chunk) => chunk.text).join('\n\n'),
      },
    ],
  }));

export const loadCurrentDeveloperDatabaseKnowledgeInput = async (
  sourceRoot = DEFAULT_SOURCE_ROOT,
): Promise<DeveloperDatabaseKnowledgeBuildInput> => {
  const root = resolve(sourceRoot);
  const [manifest, appleManifest, driveManifest, artifacts, workbench, evidenceSources] =
    await Promise.all([
      readJson(join(root, 'manifests', 'source-manifest.json')).then((raw) =>
        SourceManifestSchema.parse(raw),
      ),
      readJson(join(root, 'manifests', 'apple-notes-intake.json')).then((raw) =>
        AppleNotesIntakeManifestSchema.parse(raw),
      ),
      readJson(join(root, 'manifests', 'google-drive-discovery.json')).then((raw) =>
        RemoteSourceDiscoveryManifestSchema.parse(raw),
      ),
      readJson(join(root, 'manifests', 'source-manifest.json'))
        .then((raw) => SourceManifestSchema.parse(raw))
        .then((parsed) => loadArtifacts(root, parsed)),
      loadWorkbenchIfPresent(),
      loadFormalEvidenceCatalog(),
    ]);
  const profile = await loadPersonalKnowledgePilotProfile();
  const queue = await loadPersonalKnowledgePilotQueue(profile.id, root);
  const queueEntries = queue?.entries ?? [];
  const queueStateByRevision = buildQueueStateByRevision(queueEntries);

  const eligibleNotes = appleManifest.notes
    .filter(
      (note) =>
        !note.locked &&
        ['exported', 'unchanged'].includes(note.exportStatus) &&
        note.sourceDocumentId,
    )
    .sort((left, right) => compareText(left.id, right.id));
  const units: DeveloperDatabaseCorpusUnitInput[] = eligibleNotes.map((note, index) => {
    const artifact = artifacts.get(note.sourceDocumentId!);
    if (!artifact) throw new Error(`${note.id} has no extracted composite artifact.`);
    if (!note.titleHash || !note.plaintextHash) {
      throw new Error(`${note.id} lacks title/plaintext hashes for semantic revision matching.`);
    }
    const activeAttachments = note.attachmentRecords.filter(
      (attachment) => attachment.exportStatus !== 'missing',
    );
    const partial = activeAttachments.some(
      (attachment) =>
        attachment.exportStatus === 'quarantined' ||
        ['failed', 'unsupported', 'not_requested'].includes(attachment.ocrStatus),
    );
    return {
      id: makeOpaqueUnitId(
        `${note.sourceDocumentId}|${note.modifiedAtProvider}|${artifact.document.extractedTextHash}`,
      ),
      sourceKind: 'apple_notes',
      sourceRole: 'personal_research_note',
      displayLabel: `Apple Notes research item ${String(index + 1).padStart(3, '0')}`,
      sourceModifiedAt: note.modifiedAtProvider,
      boundaryState: 'complete',
      accessState: partial ? 'partially_indexed' : 'fully_indexed',
      semanticState: semanticStateForQueueState(
        queueStateByRevision.get(
          personalKnowledgeRevisionKey({
            noteRecordId: note.id,
            sourceDocumentId: note.sourceDocumentId!,
            titleHash: note.titleHash,
            plaintextHash: note.plaintextHash,
            sourceModifiedAtProvider: note.modifiedAtProvider,
          }),
        ),
      ),
      surfaces: appleNoteSurfaces(artifact.chunks),
    };
  });

  const privateSourceCatalog =
    PersonalKnowledgePrivateSourceCatalogSchema.parse(privateSourceCatalogJson);
  const manifestEntryByHash = new Map(manifest.entries.map((entry) => [entry.sha256, entry]));
  const privateSourceBindings = new Map<
    string,
    {
      descriptor: PersonalKnowledgePrivateSourceCatalog['entries'][number];
      artifact: ExtractionArtifact;
    }
  >();
  for (const descriptor of privateSourceCatalog.entries) {
    const manifestEntry = manifestEntryByHash.get(descriptor.expectedSha256);
    if (!manifestEntry || manifestEntry.status !== 'extracted') {
      throw new Error(`${descriptor.id} is not present as an extracted private source.`);
    }
    const documentId = `source-document.${descriptor.expectedSha256.slice(0, 20)}`;
    const artifact = artifacts.get(documentId);
    if (!artifact) throw new Error(`${descriptor.id} extraction artifact is missing.`);
    if (
      descriptor.semanticBoundaryReview.extractedTextHash !== artifact.document.extractedTextHash
    ) {
      throw new Error(`${descriptor.id} semantic-boundary review is stale for extracted text.`);
    }
    privateSourceBindings.set(descriptor.id, { descriptor, artifact });
    const driveCandidate = driveManifest.candidates.find(
      (candidate) => candidate.sha256 === descriptor.expectedSha256,
    );
    units.push(
      ...groupParserV5Units(
        artifact,
        descriptor.sourceKind,
        descriptor.sourceRole,
        driveCandidate?.sourceModifiedAt ?? null,
        descriptor.unitStrategy,
      ),
    );
  }

  const privateCorpusClassifications = await loadPrivateCorpusClassifications(root);
  const seenClassificationIds = new Set<string>();
  const seenClassificationUnits = new Set<string>();
  for (const classification of privateCorpusClassifications) {
    if (
      seenClassificationIds.has(classification.id) ||
      seenClassificationUnits.has(classification.developerDatabaseUnitId)
    ) {
      throw new Error('Private-corpus semantic classifications contain duplicate IDs or units.');
    }
    seenClassificationIds.add(classification.id);
    seenClassificationUnits.add(classification.developerDatabaseUnitId);
    const binding = privateSourceBindings.get(classification.sourceDescriptorId);
    if (!binding) {
      throw new Error(
        `${classification.id} references unenrolled source ${classification.sourceDescriptorId}.`,
      );
    }
    const { descriptor, artifact } = binding;
    if (descriptor.semanticBoundaryReview.status !== 'approved') {
      throw new Error(`${classification.id} cannot use a pending semantic boundary.`);
    }
    if (
      classification.sourceDocumentSha256 !== descriptor.expectedSha256 ||
      classification.sourceDocumentId !== artifact.document.id ||
      classification.parserVersion !== artifact.document.parserVersion
    ) {
      throw new Error(`${classification.id} source identity or parser provenance changed.`);
    }
    const matchingGroup = groupParserV5SourceUnits(artifact, descriptor.unitStrategy).find(
      (group) =>
        privateCorpusSourceUnitIdentity(artifact, group).id ===
        classification.developerDatabaseUnitId,
    );
    if (!matchingGroup) {
      throw new Error(`${classification.id} no longer resolves its exact parser-v5 source unit.`);
    }
    const expectedIdentity = privateCorpusSourceUnitIdentity(artifact, matchingGroup);
    const expectedLocators = [...expectedIdentity.sourceLocators].sort((left, right) =>
      compareText(left.sourceChunkId, right.sourceChunkId),
    );
    const actualLocators = classification.sourceUnitCandidate.sourceLocators
      .map((locator) => {
        if (locator.kind !== 'source_chunk') {
          throw new Error(`${classification.id} must use source-chunk locators.`);
        }
        return locator;
      })
      .sort((left, right) => compareText(left.sourceChunkId, right.sourceChunkId));
    if (
      JSON.stringify(actualLocators) !== JSON.stringify(expectedLocators) ||
      classification.unitFingerprint !== expectedIdentity.fingerprint
    ) {
      throw new Error(`${classification.id} source-unit hashes or locators changed.`);
    }
    if (
      classification.sourceUnitCandidate.rightsState !== 'private_processing_only' ||
      !['user_authored', 'coauthored'].includes(
        classification.sourceUnitCandidate.assertedAuthorship,
      )
    ) {
      throw new Error(`${classification.id} cannot claim formal-source authority.`);
    }
  }

  const sourceUseDecisions = SourceUseDecisionCatalogSchema.parse(sourceUseDecisionsJson).decisions;
  const developerOpinionCatalog: DeveloperOpinionCatalog =
    DeveloperOpinionCatalogSchema.parse(developerOpinionsJson);
  return {
    units,
    aliasCatalog: PersonalKnowledgeAuthoringAliasCatalogSchema.parse(aliasCatalogJson),
    workbench,
    privateCorpusClassifications,
    evidenceSources,
    sourceUseDecisions,
    developerOpinions: developerOpinionCatalog.opinions,
    opinionEvidenceRelationships: developerOpinionCatalog.evidenceRelationships,
    generatedAt: manifest.updatedAt,
    appleNotesRevisions: eligibleNotes.length,
    appleNotesAttachmentRecords: appleManifest.notes.flatMap((note) => note.attachmentRecords)
      .length,
    appleNotesOcrCompleted: appleManifest.notes
      .flatMap((note) => note.attachmentRecords)
      .filter((attachment) => attachment.ocrStatus === 'completed').length,
    privateDriveDocuments: privateSourceCatalog.entries.length,
  };
};

export const DEFAULT_DEVELOPER_DATABASE_KNOWLEDGE_PATH = resolve(
  'content/generated/personal-knowledge/database-cross-reference.json',
);

const pathInside = (parent: string, child: string): boolean => {
  const relation = relative(resolve(parent), resolve(child));
  return relation === '' || (!relation.startsWith('..') && !isAbsolute(relation));
};

const nearestExistingPath = async (
  candidatePath: string,
): Promise<{ path: string; isDirectory: boolean; isSymbolicLink: boolean }> => {
  let candidate = resolve(candidatePath);
  while (true) {
    try {
      const stat = await lstat(candidate);
      return {
        path: candidate,
        isDirectory: stat.isDirectory(),
        isSymbolicLink: stat.isSymbolicLink(),
      };
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error;
      const parent = dirname(candidate);
      if (parent === candidate) throw error;
      candidate = parent;
    }
  }
};

const unlinkIfPresent = async (path: string): Promise<void> => {
  try {
    await unlink(path);
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error;
  }
};

export const writeDeveloperDatabaseKnowledgeProjection = async (
  projection: DeveloperDatabaseKnowledgeProjection,
  outputPath = DEFAULT_DEVELOPER_DATABASE_KNOWLEDGE_PATH,
  protectedRoot = resolve('content/generated/personal-knowledge'),
): Promise<void> => {
  const parsed = DeveloperDatabaseKnowledgeProjectionSchema.parse(projection);
  const requestedRoot = resolve(protectedRoot);
  const requestedPath = resolve(outputPath);
  if (!pathInside(requestedRoot, requestedPath)) {
    throw new Error('Developer database projection output escaped its protected root.');
  }

  const existingRootAncestor = await nearestExistingPath(requestedRoot);
  if (
    (existingRootAncestor.path === requestedRoot && existingRootAncestor.isSymbolicLink) ||
    !existingRootAncestor.isDirectory
  ) {
    throw new Error('Developer database projection root must be a private regular directory.');
  }
  const canonicalRoot = resolve(
    await realpath(existingRootAncestor.path),
    relative(existingRootAncestor.path, requestedRoot),
  );
  await mkdir(canonicalRoot, { recursive: true, mode: 0o700 });
  const rootStat = await lstat(canonicalRoot);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error('Developer database projection root must be a private regular directory.');
  }
  await chmod(canonicalRoot, 0o700);

  const canonicalPath = resolve(canonicalRoot, relative(requestedRoot, requestedPath));
  const canonicalDirectory = dirname(canonicalPath);
  const existingDirectoryAncestor = await nearestExistingPath(canonicalDirectory);
  if (
    existingDirectoryAncestor.isSymbolicLink ||
    !existingDirectoryAncestor.isDirectory ||
    !pathInside(canonicalRoot, await realpath(existingDirectoryAncestor.path))
  ) {
    throw new Error('Developer database projection directory escaped its protected root.');
  }
  await mkdir(canonicalDirectory, { recursive: true, mode: 0o700 });
  const resolvedDirectory = await realpath(canonicalDirectory);
  if (!pathInside(canonicalRoot, resolvedDirectory)) {
    throw new Error('Developer database projection directory escaped its protected root.');
  }

  try {
    const existingOutput = await lstat(canonicalPath);
    if (!existingOutput.isFile() || existingOutput.isSymbolicLink()) {
      throw new Error('Developer database projection output must be a regular file.');
    }
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error;
  }

  const temporaryPath = join(
    resolvedDirectory,
    `.${basename(canonicalPath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  let temporaryHandle: Awaited<ReturnType<typeof open>> | null = null;
  try {
    temporaryHandle = await open(temporaryPath, 'wx', 0o600);
    await temporaryHandle.writeFile(`${JSON.stringify(parsed, null, 2)}\n`, {
      encoding: 'utf8',
    });
    await temporaryHandle.sync();
    await temporaryHandle.close();
    temporaryHandle = null;
    const temporaryStat = await lstat(temporaryPath);
    if (
      !temporaryStat.isFile() ||
      temporaryStat.isSymbolicLink() ||
      (temporaryStat.mode & 0o777) !== 0o600
    ) {
      throw new Error('Developer database temporary projection must be a private regular file.');
    }
    await rename(temporaryPath, canonicalPath);
  } finally {
    await temporaryHandle?.close();
    await unlinkIfPresent(temporaryPath);
  }
  await chmod(canonicalPath, 0o600);
  const stat = await lstat(canonicalPath);
  if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o777) !== 0o600) {
    throw new Error('Developer database projection must be a private 0600 regular file.');
  }
};

export const compileCurrentDeveloperDatabaseKnowledge = async (
  sourceRoot = DEFAULT_SOURCE_ROOT,
): Promise<DeveloperDatabaseKnowledgeProjection> => {
  const projection = buildDeveloperDatabaseKnowledgeProjection(
    await loadCurrentDeveloperDatabaseKnowledgeInput(sourceRoot),
  );
  await writeDeveloperDatabaseKnowledgeProjection(projection);
  return projection;
};

export const validateCurrentDeveloperDatabaseKnowledge = async (
  sourceRoot = DEFAULT_SOURCE_ROOT,
  projectionPath = DEFAULT_DEVELOPER_DATABASE_KNOWLEDGE_PATH,
  protectedRoot = resolve('content/generated/personal-knowledge'),
): Promise<DeveloperDatabaseKnowledgeProjection> => {
  const root = resolve(protectedRoot);
  const path = resolve(projectionPath);
  if (!pathInside(root, path)) {
    throw new Error('Developer database projection validation escaped its protected root.');
  }
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o777) !== 0o600) {
    throw new Error('Developer database projection must be a private 0600 regular file.');
  }
  const [resolvedRoot, resolvedPath] = await Promise.all([realpath(root), realpath(path)]);
  if (!pathInside(resolvedRoot, resolvedPath)) {
    throw new Error('Developer database projection resolved outside its protected root.');
  }
  const stored = DeveloperDatabaseKnowledgeProjectionSchema.parse(await readJson(resolvedPath));
  const current = buildDeveloperDatabaseKnowledgeProjection(
    await loadCurrentDeveloperDatabaseKnowledgeInput(sourceRoot),
  );
  if (stored.inputFingerprint !== current.inputFingerprint) {
    throw new Error(
      'Developer database projection is stale for the current private corpus or tracked catalogs.',
    );
  }
  if (JSON.stringify(stored) !== JSON.stringify(current)) {
    throw new Error(
      'Developer database projection does not match deterministic recompilation despite its fingerprint.',
    );
  }
  return stored;
};
