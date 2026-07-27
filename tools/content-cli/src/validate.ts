import { access, readFile, readdir } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

import {
  CaseBlueprintSchema,
  ClinicalReviewTicketSchema,
  DeveloperOpinionCatalogSchema,
  DiagnosisClassificationReleaseSchema,
  EvidenceContributionSchema,
  EvidenceSourceDefinitionSchema,
  MedicationIdentityDefinitionSchema,
  PersonalKnowledgeAuthoringAliasCatalogSchema,
  PersonalKnowledgePilotProfileSchema,
  PersonalKnowledgePrivateSourceCatalogSchema,
  SourceUseDecisionCatalogSchema,
  SupplementIdentityDefinitionSchema,
} from '@psychsim/schemas';
import {
  approvedCaseBlueprints,
  catalogs,
  medicationIdentities,
  startingClinic,
  validateCaseBlueprint,
  validateCatalogs,
  validateContentRegistry,
  validateMedicationIdentities,
  validateSupplementIdentities,
} from '@psychsim/content-runtime';
import { reviewerCaseBlueprints } from '@psychsim/content-runtime/reviewer';
import { resolveClinicForProgressionMode } from '@psychsim/engine';
import { contentRegistry } from '../../../packages/content-runtime/src/registry';
import { supplementIdentities } from '../../../packages/content-runtime/src/supplement-identities';
import {
  developerLiteratureSynthesisProposals,
  validateLiteratureSynthesisProposals,
} from '../../../packages/content-runtime/src/literature-synthesis';
import { milestoneTwoClinicalAuditTickets } from '../../../packages/content-runtime/src/milestone-two-review-tickets';
import {
  developerSourceRequests,
  validateSourceRequests,
} from '../../../packages/content-runtime/src/source-requests';
import {
  developerTicketLiteratureScoutCatalog,
  validateTicketLiteratureScoutCatalog,
} from '../../../packages/content-runtime/src/ticket-literature-scout';
import {
  getSingleDiagnosisClassificationRegistryEntry,
  readDiagnosisClassification,
  validateDiagnosisClassification,
  validateDiagnosisClassificationBindings,
} from './diagnosis-classification';
import { validatePersonalKnowledgeAliasCatalog } from './developer-database-knowledge';
import { validatePersonalKnowledgePilotProfile } from './personal-knowledge-workspace';

const reviewCaseDirectory = resolve('content/cases/review');
const checkedInReviewTicketFiles = (await readdir(reviewCaseDirectory))
  .filter((fileName) => fileName.endsWith('.tickets.json'))
  .sort();
const checkedInReviewTickets = [
  ...milestoneTwoClinicalAuditTickets,
  ...(
    await Promise.all(
      checkedInReviewTicketFiles.map(async (fileName) =>
        ClinicalReviewTicketSchema.array().parse(
          JSON.parse(await readFile(resolve(reviewCaseDirectory, fileName), 'utf8')) as unknown,
        ),
      ),
    )
  ).flat(),
];

const reviewCaseBlueprints = await Promise.all(
  (await readdir(reviewCaseDirectory))
    .filter((fileName) => fileName.endsWith('.case.json'))
    .sort()
    .map(async (fileName) =>
      CaseBlueprintSchema.parse(
        JSON.parse(await readFile(resolve(reviewCaseDirectory, fileName), 'utf8')) as unknown,
      ),
    ),
);
const allReviewBlueprints = [...reviewCaseBlueprints, ...reviewerCaseBlueprints];

const missingRegistryPaths = (
  await Promise.all(
    contentRegistry.entries.map(async (entry) => {
      try {
        await access(resolve(entry.path));
        return null;
      } catch {
        return entry.path;
      }
    }),
  )
).filter((path): path is string => path !== null);
const registryValidation = validateContentRegistry(contentRegistry, catalogs, [
  ...approvedCaseBlueprints,
  ...allReviewBlueprints,
]);
const reviewerClinic = resolveClinicForProgressionMode(startingClinic, 'endgame', catalogs);
const registryIssues = [
  ...registryValidation.issues,
  ...missingRegistryPaths.map((path) => ({
    severity: 'error' as const,
    code: 'MISSING_REGISTRY_PATH',
    message: path,
  })),
];

const authoringEvidenceEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'evidence_source' && !entry.runtimeIncluded,
);
const authoringEvidenceSources = await Promise.all(
  authoringEvidenceEntries.map(async (entry) =>
    EvidenceSourceDefinitionSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    ),
  ),
);
const authoringEvidenceIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = authoringEvidenceSources.flatMap((source, index) => {
  const entry = authoringEvidenceEntries[index]!;
  return source.id === entry.id
    ? []
    : [
        {
          severity: 'error' as const,
          code: 'AUTHORING_EVIDENCE_REGISTRY_MISMATCH',
          message: `${entry.id} resolves to ${source.id}.`,
        },
      ];
});
const duplicateEvidenceIds = [
  ...catalogs.evidenceSources.map((source) => source.id),
  ...authoringEvidenceSources.map((source) => source.id),
].filter((id, index, ids) => ids.indexOf(id) !== index);
for (const duplicate of new Set(duplicateEvidenceIds)) {
  authoringEvidenceIssues.push({
    severity: 'error',
    code: 'DUPLICATE_RUNTIME_AUTHORING_EVIDENCE_ID',
    message: duplicate,
  });
}

const sourceUseDecisionEntry = contentRegistry.entries.find(
  (entry) => entry.kind === 'source_use_decision_catalog',
);
const sourceUseDecisionCatalog = SourceUseDecisionCatalogSchema.parse(
  JSON.parse(
    await readFile(resolve(sourceUseDecisionEntry?.path ?? 'missing-source-use-catalog'), 'utf8'),
  ) as unknown,
);
const allEvidenceSourceIds = new Set([
  ...catalogs.evidenceSources.map((source) => source.id),
  ...authoringEvidenceSources.map((source) => source.id),
]);
const allEvidenceSourcesById = new Map(
  [...catalogs.evidenceSources, ...authoringEvidenceSources].map((source) => [source.id, source]),
);
const sourceUseDecisionIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
const seenSourceUseDecisionIds = new Set<string>();
const seenSourceUseEvidenceIds = new Set<string>();
for (const decision of sourceUseDecisionCatalog.decisions) {
  if (seenSourceUseDecisionIds.has(decision.id)) {
    sourceUseDecisionIssues.push({
      severity: 'error',
      code: 'DUPLICATE_SOURCE_USE_DECISION_ID',
      message: decision.id,
    });
  }
  if (seenSourceUseEvidenceIds.has(decision.evidenceSourceId)) {
    sourceUseDecisionIssues.push({
      severity: 'error',
      code: 'DUPLICATE_SOURCE_USE_EVIDENCE_DECISION',
      message: decision.evidenceSourceId,
    });
  }
  if (!allEvidenceSourceIds.has(decision.evidenceSourceId)) {
    sourceUseDecisionIssues.push({
      severity: 'error',
      code: 'UNKNOWN_SOURCE_USE_EVIDENCE_SOURCE',
      message: decision.evidenceSourceId,
    });
  }
  const source = allEvidenceSourcesById.get(decision.evidenceSourceId);
  if (source) {
    const policyOverride =
      decision.legalBasis === 'written_permission' || decision.legalBasis === 'fair_use';
    if (
      !policyOverride &&
      decision.permissions.localFullTextStorage &&
      source.accessPolicy.fullTextStatus !== 'public'
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_EXCEEDS_FULL_TEXT_ACCESS',
        message: decision.evidenceSourceId,
      });
    }
    if (
      !policyOverride &&
      decision.permissions.localTextExtraction &&
      source.accessPolicy.localExtractionStatus !== 'allowed'
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_EXCEEDS_EXTRACTION_POLICY',
        message: decision.evidenceSourceId,
      });
    }
    if (
      !policyOverride &&
      decision.permissions.aiAssistedProcessing &&
      source.accessPolicy.aiUseStatus !== 'permitted'
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_EXCEEDS_AI_POLICY',
        message: decision.evidenceSourceId,
      });
    }
    if (
      !policyOverride &&
      (decision.permissions.localStructuredIndexing ||
        decision.permissions.derivedClinicalContent) &&
      source.accessPolicy.adaptationStatus !== 'permitted'
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_EXCEEDS_ADAPTATION_POLICY',
        message: decision.evidenceSourceId,
      });
    }
    if (
      !policyOverride &&
      decision.permissions.runtimeRedistribution &&
      !['public_domain', 'open_license'].includes(source.accessPolicy.reuseStatus)
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_EXCEEDS_REUSE_POLICY',
        message: decision.evidenceSourceId,
      });
    }
    if (
      !policyOverride &&
      decision.permissions.commercialDistribution &&
      source.accessPolicy.commercialUseStatus !== 'permitted'
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_EXCEEDS_COMMERCIAL_POLICY',
        message: decision.evidenceSourceId,
      });
    }
    if (decision.permissions.commercialDistribution && decision.nonCommercialOnly) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_COMMERCIAL_NONCOMMERCIAL_CONFLICT',
        message: decision.evidenceSourceId,
      });
    }
    if (
      decision.legalBasis === 'public_domain' &&
      source.accessPolicy.reuseStatus !== 'public_domain'
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_PUBLIC_DOMAIN_MISMATCH',
        message: decision.evidenceSourceId,
      });
    }
    if (
      decision.legalBasis === 'open_license' &&
      source.accessPolicy.reuseStatus !== 'open_license'
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_OPEN_LICENSE_MISMATCH',
        message: decision.evidenceSourceId,
      });
    }
  }
  seenSourceUseDecisionIds.add(decision.id);
  seenSourceUseEvidenceIds.add(decision.evidenceSourceId);
}
for (const source of allEvidenceSourcesById.values()) {
  if (!seenSourceUseEvidenceIds.has(source.id)) {
    sourceUseDecisionIssues.push({
      severity: 'error',
      code: 'EVIDENCE_SOURCE_WITHOUT_USE_DECISION',
      message: source.id,
    });
  }
}

const medicationIdentityIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
const medicationIdentityRegistryEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'medication_identity_catalog',
);
if (
  medicationIdentityRegistryEntries.length !== 1 ||
  medicationIdentityRegistryEntries[0]?.runtimeIncluded !== true
) {
  medicationIdentityIssues.push({
    severity: 'error',
    code: 'INVALID_MEDICATION_IDENTITY_CATALOG_REGISTRATION',
    message: `Expected one runtime-included medication identity catalog; found ${medicationIdentityRegistryEntries.length}.`,
  });
} else {
  const entry = medicationIdentityRegistryEntries[0]!;
  const registeredIdentityIds = [...entry.categoryIds].sort();
  const importedIdentityIds = medicationIdentities.map((identity) => identity.id).sort();
  if (JSON.stringify(registeredIdentityIds) !== JSON.stringify(importedIdentityIds)) {
    medicationIdentityIssues.push({
      severity: 'error',
      code: 'MEDICATION_IDENTITY_REGISTRY_MEMBER_MISMATCH',
      message: 'The medication identity registry member list must exactly match static imports.',
    });
  }
  const identityFiles = (await readdir(resolve(entry.path)))
    .filter((fileName) => fileName.endsWith('.identity.json'))
    .sort();
  const diskIdentities = await Promise.all(
    identityFiles.map(async (fileName) =>
      MedicationIdentityDefinitionSchema.parse(
        JSON.parse(await readFile(resolve(entry.path, fileName), 'utf8')) as unknown,
      ),
    ),
  );
  const importedById = new Map(medicationIdentities.map((identity) => [identity.id, identity]));
  const diskById = new Map(diskIdentities.map((identity) => [identity.id, identity]));
  medicationIdentityIssues.push(
    ...validateMedicationIdentities(diskIdentities, catalogs).issues.map((issue) => ({
      severity: 'error' as const,
      code: `DISK_${issue.code}`,
      message: issue.message,
    })),
  );
  diskIdentities.forEach((identity, index) => {
    const expectedFileName = `${identity.id.replace(/^medication\./, '')}.identity.json`;
    if (identityFiles[index] !== expectedFileName) {
      medicationIdentityIssues.push({
        severity: 'error',
        code: 'MEDICATION_IDENTITY_FILENAME_MISMATCH',
        message: `${identityFiles[index]} resolves to ${identity.id}; expected ${expectedFileName}.`,
      });
    }
  });
  for (const identity of diskIdentities) {
    const imported = importedById.get(identity.id);
    if (!imported) {
      medicationIdentityIssues.push({
        severity: 'error',
        code: 'UNIMPORTED_MEDICATION_IDENTITY_FILE',
        message: identity.id,
      });
    } else if (JSON.stringify(imported) !== JSON.stringify(identity)) {
      medicationIdentityIssues.push({
        severity: 'error',
        code: 'MEDICATION_IDENTITY_IMPORT_MISMATCH',
        message: identity.id,
      });
    }
  }
  for (const identity of medicationIdentities) {
    if (!diskById.has(identity.id)) {
      medicationIdentityIssues.push({
        severity: 'error',
        code: 'MISSING_MEDICATION_IDENTITY_FILE',
        message: identity.id,
      });
    }
    const decision = sourceUseDecisionCatalog.decisions.find(
      (candidate) => candidate.id === identity.rxnorm.sourceUseDecisionId,
    );
    if (
      !decision ||
      decision.evidenceSourceId !== identity.rxnorm.evidenceSourceId ||
      !decision.permissions.localStructuredIndexing ||
      !decision.permissions.runtimeRedistribution
    ) {
      medicationIdentityIssues.push({
        severity: 'error',
        code: 'INVALID_MEDICATION_IDENTITY_SOURCE_USE',
        message: `${identity.id}: ${identity.rxnorm.sourceUseDecisionId}`,
      });
    }
  }
  medicationIdentityIssues.push(
    ...validateMedicationIdentities(medicationIdentities, catalogs).issues.map((issue) => ({
      severity: 'error' as const,
      code: issue.code,
      message: issue.message,
    })),
  );
}

const supplementIdentityIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
const supplementIdentityRegistryEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'supplement_identity_catalog',
);
if (
  supplementIdentityRegistryEntries.length !== 1 ||
  supplementIdentityRegistryEntries[0]?.runtimeIncluded !== true
) {
  supplementIdentityIssues.push({
    severity: 'error',
    code: 'INVALID_SUPPLEMENT_IDENTITY_CATALOG_REGISTRATION',
    message: `Expected one runtime-included supplement identity catalog; found ${supplementIdentityRegistryEntries.length}.`,
  });
} else {
  const entry = supplementIdentityRegistryEntries[0]!;
  const registeredIds = [...entry.categoryIds].sort();
  const importedIds = supplementIdentities.map((identity) => identity.id).sort();
  if (JSON.stringify(registeredIds) !== JSON.stringify(importedIds)) {
    supplementIdentityIssues.push({
      severity: 'error',
      code: 'SUPPLEMENT_IDENTITY_REGISTRY_MEMBER_MISMATCH',
      message: 'The supplement identity registry member list must exactly match static imports.',
    });
  }
  const identityFiles = (await readdir(resolve(entry.path)))
    .filter((fileName) => fileName.endsWith('.identity.json'))
    .sort();
  const diskIdentities = await Promise.all(
    identityFiles.map(async (fileName) =>
      SupplementIdentityDefinitionSchema.parse(
        JSON.parse(await readFile(resolve(entry.path, fileName), 'utf8')) as unknown,
      ),
    ),
  );
  const importedById = new Map(supplementIdentities.map((identity) => [identity.id, identity]));
  const diskById = new Map(diskIdentities.map((identity) => [identity.id, identity]));
  diskIdentities.forEach((identity, index) => {
    const expectedFileName = `${identity.id.replace(/^supplement\./, '')}.identity.json`;
    if (identityFiles[index] !== expectedFileName) {
      supplementIdentityIssues.push({
        severity: 'error',
        code: 'SUPPLEMENT_IDENTITY_FILENAME_MISMATCH',
        message: `${identityFiles[index]} resolves to ${identity.id}; expected ${expectedFileName}.`,
      });
    }
    const imported = importedById.get(identity.id);
    if (!imported) {
      supplementIdentityIssues.push({
        severity: 'error',
        code: 'UNIMPORTED_SUPPLEMENT_IDENTITY_FILE',
        message: identity.id,
      });
    } else if (JSON.stringify(imported) !== JSON.stringify(identity)) {
      supplementIdentityIssues.push({
        severity: 'error',
        code: 'SUPPLEMENT_IDENTITY_IMPORT_MISMATCH',
        message: identity.id,
      });
    }
  });
  for (const identity of supplementIdentities) {
    if (!diskById.has(identity.id)) {
      supplementIdentityIssues.push({
        severity: 'error',
        code: 'MISSING_SUPPLEMENT_IDENTITY_FILE',
        message: identity.id,
      });
    }
    for (const identifier of identity.identifiers) {
      const decision = sourceUseDecisionCatalog.decisions.find(
        (candidate) => candidate.id === identifier.sourceUseDecisionId,
      );
      if (
        !decision ||
        decision.evidenceSourceId !== identifier.evidenceSourceId ||
        !decision.permissions.localStructuredIndexing ||
        !decision.permissions.runtimeRedistribution ||
        !decision.allowedContributionTypes.includes('classification_mapping')
      ) {
        supplementIdentityIssues.push({
          severity: 'error',
          code: 'INVALID_SUPPLEMENT_IDENTITY_SOURCE_USE',
          message: `${identity.id}: ${identifier.sourceUseDecisionId}`,
        });
      }
    }
  }
  supplementIdentityIssues.push(
    ...validateSupplementIdentities(
      diskIdentities,
      [...catalogs.evidenceSources, ...authoringEvidenceSources],
      medicationIdentities.map((identity) => identity.id),
    ).issues.map((issue) => ({
      severity: 'error' as const,
      code: `DISK_${issue.code}`,
      message: issue.message,
    })),
    ...validateSupplementIdentities(
      supplementIdentities,
      [...catalogs.evidenceSources, ...authoringEvidenceSources],
      medicationIdentities.map((identity) => identity.id),
    ).issues.map((issue) => ({
      severity: 'error' as const,
      code: issue.code,
      message: issue.message,
    })),
  );
}

interface ContributionUse {
  contribution: ReturnType<typeof EvidenceContributionSchema.parse>;
  owner: string;
  runtimeIncluded: boolean;
}

const collectContributionUses = (
  value: unknown,
  owner: string,
  runtimeIncluded: boolean,
  target: ContributionUse[],
): void => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectContributionUses(item, owner, runtimeIncluded, target));
    return;
  }
  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  if (
    ['formal_publication', 'expert_opinion'].includes(String(record.authority)) &&
    Array.isArray(record.evidenceSourceIds) &&
    typeof record.contribution === 'string' &&
    typeof record.generatedBy === 'string'
  ) {
    const parsed = EvidenceContributionSchema.safeParse(record);
    if (parsed.success) {
      target.push({ contribution: parsed.data, owner, runtimeIncluded });
    }
  }
  Object.values(record).forEach((item) =>
    collectContributionUses(item, owner, runtimeIncluded, target),
  );
};

const contributionUses: ContributionUse[] = [];
collectContributionUses(catalogs, 'runtime catalogs', true, contributionUses);
approvedCaseBlueprints.forEach((blueprint) =>
  collectContributionUses(blueprint, blueprint.id, true, contributionUses),
);
allReviewBlueprints.forEach((blueprint) =>
  collectContributionUses(blueprint, blueprint.id, false, contributionUses),
);
const sourceUseDecisionByEvidenceId = new Map(
  sourceUseDecisionCatalog.decisions.map((decision) => [decision.evidenceSourceId, decision]),
);
for (const use of contributionUses) {
  if (use.contribution.authority !== 'formal_publication') continue;
  for (const evidenceSourceId of use.contribution.evidenceSourceIds) {
    const decision = sourceUseDecisionByEvidenceId.get(evidenceSourceId);
    if (!decision) continue;
    if (!decision.permissions.derivedClinicalContent) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_DISALLOWS_DERIVED_CONTRIBUTION',
        message: `${use.owner}: ${evidenceSourceId}`,
      });
    }
    const disallowedContributionTypes = use.contribution.contributionTypes.filter(
      (contributionType) => !decision.allowedContributionTypes.includes(contributionType),
    );
    if (disallowedContributionTypes.length > 0) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_DISALLOWS_CONTRIBUTION_TYPE',
        message: `${use.owner}: ${evidenceSourceId} does not allow ${disallowedContributionTypes.join(', ')}`,
      });
    }
    if (use.contribution.generatedBy === 'ai' && !decision.permissions.aiAssistedProcessing) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_DISALLOWS_AI_CONTRIBUTION',
        message: `${use.owner}: ${evidenceSourceId}`,
      });
    }
    if (
      (use.contribution.sourceDocumentId !== null || use.contribution.sourceChunkIds.length > 0) &&
      !decision.permissions.localTextExtraction
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_DISALLOWS_EXTRACTED_CONTRIBUTION',
        message: `${use.owner}: ${evidenceSourceId}`,
      });
    }
    if (use.runtimeIncluded && !decision.permissions.runtimeRedistribution) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_DISALLOWS_RUNTIME_CONTRIBUTION',
        message: `${use.owner}: ${evidenceSourceId}`,
      });
    }
  }
}

const classificationDirectory = resolve(
  getSingleDiagnosisClassificationRegistryEntry(contentRegistry).path,
);
const diagnosisClassificationReleasePath = resolve(classificationDirectory, 'release.json');
const diagnosisClassificationTermsPath = resolve(classificationDirectory, 'terms.json');
const diagnosisClassificationRelease = DiagnosisClassificationReleaseSchema.parse(
  JSON.parse(await readFile(diagnosisClassificationReleasePath, 'utf8')) as unknown,
);
let diagnosisClassificationMaterialized = false;
const diagnosisClassificationIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
try {
  await access(diagnosisClassificationTermsPath);
  const { catalog: diagnosisClassificationCatalog } = await readDiagnosisClassification(
    diagnosisClassificationReleasePath,
    diagnosisClassificationTermsPath,
  );
  diagnosisClassificationMaterialized = true;
  diagnosisClassificationIssues.push(
    ...validateDiagnosisClassification(
      diagnosisClassificationRelease,
      diagnosisClassificationCatalog,
    ).issues.map((issue) => ({
      severity: 'error' as const,
      ...issue,
    })),
  );
  diagnosisClassificationIssues.push(
    ...validateDiagnosisClassificationBindings(
      catalogs.diagnoses,
      diagnosisClassificationRelease,
      diagnosisClassificationCatalog,
    ).issues.map((issue) => ({
      severity: 'error' as const,
      ...issue,
    })),
  );
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}
if (!diagnosisClassificationMaterialized) {
  diagnosisClassificationIssues.push(
    ...validateDiagnosisClassificationBindings(
      catalogs.diagnoses,
      diagnosisClassificationRelease,
      null,
    ).issues.map((issue) => ({
      severity: 'error' as const,
      ...issue,
    })),
  );
}
if (
  !authoringEvidenceSources.some(
    (source) => source.id === diagnosisClassificationRelease.evidenceSourceId,
  )
) {
  diagnosisClassificationIssues.push({
    severity: 'error',
    code: 'MISSING_CLASSIFICATION_EVIDENCE_SOURCE',
    message: diagnosisClassificationRelease.evidenceSourceId,
  });
}

const personalKnowledgeProfileIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
const personalKnowledgeProfileEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'personal_knowledge_pilot_profile',
);
if (personalKnowledgeProfileEntries.length !== 1) {
  personalKnowledgeProfileIssues.push({
    severity: 'error',
    code: 'PERSONAL_KNOWLEDGE_PROFILE_COUNT',
    message: `Expected one bounded pilot profile; found ${personalKnowledgeProfileEntries.length}.`,
  });
} else {
  const entry = personalKnowledgeProfileEntries[0]!;
  try {
    const profile = PersonalKnowledgePilotProfileSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    );
    if (profile.id !== entry.id) {
      throw new Error(`${entry.id} resolves to ${profile.id}.`);
    }
    validatePersonalKnowledgePilotProfile(profile);
  } catch (error) {
    personalKnowledgeProfileIssues.push({
      severity: 'error',
      code: 'INVALID_PERSONAL_KNOWLEDGE_PROFILE',
      message: error instanceof Error ? error.message : 'Pilot profile validation failed.',
    });
  }
}

const personalKnowledgeCatalogIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
const personalKnowledgeCatalogRoot = resolve('content/catalogs/authoring/personal-knowledge');
const validatePersonalKnowledgeCatalogPath = (path: string): void => {
  const relation = relative(personalKnowledgeCatalogRoot, resolve(path));
  if (relation.startsWith('..') || isAbsolute(relation)) {
    throw new Error(`${path} escapes the personal-knowledge authoring catalog.`);
  }
};
const aliasCatalogEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'personal_knowledge_alias_catalog',
);
const privateSourceCatalogEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'personal_knowledge_source_catalog',
);
if (aliasCatalogEntries.length !== 1 || privateSourceCatalogEntries.length !== 1) {
  personalKnowledgeCatalogIssues.push({
    severity: 'error',
    code: 'PERSONAL_KNOWLEDGE_CATALOG_COUNT',
    message: `Expected one alias catalog and one private-source catalog; found ${aliasCatalogEntries.length} and ${privateSourceCatalogEntries.length}.`,
  });
} else {
  try {
    const aliasEntry = aliasCatalogEntries[0]!;
    const privateSourceEntry = privateSourceCatalogEntries[0]!;
    if (aliasEntry.runtimeIncluded || privateSourceEntry.runtimeIncluded) {
      throw new Error('Personal-knowledge authoring catalogs must remain runtime excluded.');
    }
    validatePersonalKnowledgeCatalogPath(aliasEntry.path);
    validatePersonalKnowledgeCatalogPath(privateSourceEntry.path);
    const aliasCatalog = PersonalKnowledgeAuthoringAliasCatalogSchema.parse(
      JSON.parse(await readFile(resolve(aliasEntry.path), 'utf8')) as unknown,
    );
    const privateSourceCatalog = PersonalKnowledgePrivateSourceCatalogSchema.parse(
      JSON.parse(await readFile(resolve(privateSourceEntry.path), 'utf8')) as unknown,
    );
    if (aliasCatalog.id !== aliasEntry.id || privateSourceCatalog.id !== privateSourceEntry.id) {
      throw new Error('Personal-knowledge registry IDs do not match their tracked catalogs.');
    }
    validatePersonalKnowledgeAliasCatalog(aliasCatalog);
    const sourceIds = privateSourceCatalog.entries.map((entry) => entry.id);
    const sourceHashes = privateSourceCatalog.entries.map((entry) => entry.expectedSha256);
    if (
      new Set(sourceIds).size !== sourceIds.length ||
      new Set(sourceHashes).size !== sourceHashes.length
    ) {
      throw new Error('Private personal-source IDs and SHA-256 values must be unique.');
    }
  } catch (error) {
    personalKnowledgeCatalogIssues.push({
      severity: 'error',
      code: 'INVALID_PERSONAL_KNOWLEDGE_CATALOG',
      message:
        error instanceof Error
          ? error.message
          : 'Personal-knowledge authoring catalog validation failed.',
    });
  }
}

const developerOpinionIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
const developerOpinionEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'developer_opinion_catalog',
);
if (developerOpinionEntries.length !== 1) {
  developerOpinionIssues.push({
    severity: 'error',
    code: 'DEVELOPER_OPINION_CATALOG_COUNT',
    message: `Expected one Developer-opinion catalog; found ${developerOpinionEntries.length}.`,
  });
} else {
  try {
    const entry = developerOpinionEntries[0]!;
    if (entry.runtimeIncluded) {
      throw new Error('Developer opinions must remain outside the gameplay runtime bundle.');
    }
    const catalog = DeveloperOpinionCatalogSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    );
    if (catalog.id !== entry.id) {
      throw new Error(`${entry.id} resolves to ${catalog.id}.`);
    }
    const targetKindById = new Map<string, string>([
      ...catalogs.diagnoses.map((diagnosis) => [diagnosis.id, 'diagnosis'] as const),
      ...medicationIdentities.map((medication) => [medication.id, 'medication'] as const),
      ...catalogs.treatments
        .filter((treatment) => treatment.kind === 'nonmedication')
        .map((treatment) => [treatment.id, 'intervention'] as const),
      ...catalogs.tests.map((test) => [test.id, 'test'] as const),
    ]);
    for (const opinion of catalog.opinions) {
      for (const target of opinion.targets) {
        const actualKind = targetKindById.get(target.targetContentId);
        if (actualKind !== target.targetKind) {
          throw new Error(
            `${opinion.id} targets ${target.targetKind} ${target.targetContentId}, resolved as ${actualKind ?? 'unknown'}.`,
          );
        }
      }
    }
    const developerOpinionIds = new Set(catalog.opinions.map((opinion) => opinion.id));
    for (const policy of catalogs.reactionConcepts.medicationSelectionPolicies) {
      if (!developerOpinionIds.has(policy.developerOpinionId)) {
        throw new Error(
          `${policy.id} references unknown Developer opinion ${policy.developerOpinionId}.`,
        );
      }
    }
    const sourceUseById = new Map(
      sourceUseDecisionCatalog.decisions.map((decision) => [decision.id, decision]),
    );
    for (const relationship of catalog.evidenceRelationships) {
      if (!allEvidenceSourceIds.has(relationship.evidenceSourceId)) {
        throw new Error(
          `${relationship.id} references unknown evidence ${relationship.evidenceSourceId}.`,
        );
      }
      const decision = sourceUseById.get(relationship.sourceUseDecisionId);
      if (
        !decision ||
        decision.evidenceSourceId !== relationship.evidenceSourceId ||
        decision.decisionStatus !== 'permitted_with_conditions' ||
        !decision.permissions.derivedClinicalContent
      ) {
        throw new Error(
          `${relationship.id} lacks a matching derived-content-cleared source-use decision.`,
        );
      }
    }
  } catch (error) {
    developerOpinionIssues.push({
      severity: 'error',
      code: 'INVALID_DEVELOPER_OPINION_CATALOG',
      message:
        error instanceof Error ? error.message : 'Developer-opinion catalog validation failed.',
    });
  }
}

const reports = [
  ['catalogs', validateCatalogs(catalogs)],
  [
    'content-registry',
    {
      valid: registryIssues.length === 0,
      issues: registryIssues,
    },
  ],
  [
    'authoring-evidence',
    {
      valid: authoringEvidenceIssues.length === 0,
      issues: authoringEvidenceIssues,
    },
  ],
  [
    'source-use-decisions',
    {
      valid: sourceUseDecisionIssues.length === 0,
      issues: sourceUseDecisionIssues,
    },
  ],
  [
    'medication-identities',
    {
      valid: medicationIdentityIssues.length === 0,
      issues: medicationIdentityIssues,
    },
  ],
  [
    'supplement-identities',
    {
      valid: supplementIdentityIssues.length === 0,
      issues: supplementIdentityIssues,
    },
  ],
  [
    diagnosisClassificationMaterialized
      ? 'diagnosis-classification'
      : 'diagnosis-classification-manifest (local cache not materialized)',
    {
      valid: diagnosisClassificationIssues.length === 0,
      issues: diagnosisClassificationIssues,
    },
  ],
  [
    'personal-knowledge-pilot-profile',
    {
      valid: personalKnowledgeProfileIssues.length === 0,
      issues: personalKnowledgeProfileIssues,
    },
  ],
  [
    'personal-knowledge-cross-reference-catalogs',
    {
      valid: personalKnowledgeCatalogIssues.length === 0,
      issues: personalKnowledgeCatalogIssues,
    },
  ],
  [
    'developer-opinions',
    {
      valid: developerOpinionIssues.length === 0,
      issues: developerOpinionIssues,
    },
  ],
  [
    'source-needed-requests',
    validateSourceRequests(
      developerSourceRequests,
      catalogs,
      [...approvedCaseBlueprints, ...allReviewBlueprints],
      checkedInReviewTickets,
    ),
  ],
  [
    'literature-synthesis-proposals',
    validateLiteratureSynthesisProposals(
      developerLiteratureSynthesisProposals,
      [...catalogs.evidenceSources, ...authoringEvidenceSources],
      sourceUseDecisionCatalog.decisions,
      [...approvedCaseBlueprints, ...allReviewBlueprints],
      checkedInReviewTickets,
      developerSourceRequests,
    ),
  ],
  [
    'ticket-literature-scout',
    validateTicketLiteratureScoutCatalog(
      developerTicketLiteratureScoutCatalog,
      checkedInReviewTickets,
      developerSourceRequests,
    ),
  ],
  ...approvedCaseBlueprints.map(
    (blueprint) =>
      [blueprint.id, validateCaseBlueprint(blueprint, catalogs, startingClinic)] as const,
  ),
  ...reviewCaseBlueprints.map(
    (blueprint) =>
      [blueprint.id, validateCaseBlueprint(blueprint, catalogs, startingClinic)] as const,
  ),
  ...reviewerCaseBlueprints.map(
    (blueprint) =>
      [blueprint.id, validateCaseBlueprint(blueprint, catalogs, reviewerClinic)] as const,
  ),
] as const;

let failureCount = 0;
for (const [name, report] of reports) {
  if (report.valid) {
    console.log(`PASS ${name}`);
  } else {
    console.error(`FAIL ${name}`);
  }
  for (const issue of report.issues) {
    const issuePath = 'path' in issue ? issue.path : undefined;
    console[issue.severity === 'error' ? 'error' : 'warn'](
      `  ${issue.severity.toUpperCase()} ${issue.code}${issuePath ? ` (${issuePath})` : ''}: ${issue.message}`,
    );
    if (issue.severity === 'error') failureCount += 1;
  }
}

if (failureCount > 0) {
  console.error(`Content validation failed with ${failureCount} error(s).`);
  process.exitCode = 1;
} else {
  console.log('Approved prototype bundle is internally consistent.');
}
