import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  CaseBlueprintSchema,
  ClinicalReviewTicketSchema,
  DiagnosisClassificationReleaseSchema,
  EvidenceContributionSchema,
  EvidenceSourceDefinitionSchema,
  SourceUseDecisionCatalogSchema,
} from '@psychsim/schemas';
import {
  approvedCaseBlueprints,
  catalogs,
  startingClinic,
  validateCaseBlueprint,
  validateCatalogs,
  validateContentRegistry,
} from '@psychsim/content-runtime';
import { reviewerCaseBlueprints } from '@psychsim/content-runtime/reviewer';
import { resolveClinicForProgressionMode } from '@psychsim/engine';
import { contentRegistry } from '../../../packages/content-runtime/src/registry';
import {
  developerLiteratureSynthesisProposals,
  validateLiteratureSynthesisProposals,
} from '../../../packages/content-runtime/src/literature-synthesis';
import { milestoneTwoClinicalAuditTickets } from '../../../packages/content-runtime/src/milestone-two-review-tickets';
import {
  developerSourceRequests,
  validateSourceRequests,
} from '../../../packages/content-runtime/src/source-requests';
import canmatReviewTicketsJson from '../../../content/cases/review/canmat-2023-mdd-source-review.tickets.json';
import recommendedGuidelineReviewTicketsJson from '../../../content/cases/review/recommended-guidelines-source-intake.tickets.json';
import scaffoldReviewTicketsJson from '../../../content/cases/review/review-basic-mdd-scaffold.tickets.json';
import whoScaffoldReviewTicketsJson from '../../../content/cases/review/review-who-mhgap-mdd-initial.tickets.json';
import whoDepressionReviewTicketsJson from '../../../content/cases/review/who-mhgap-2023-depression-source-review.tickets.json';
import {
  getSingleDiagnosisClassificationRegistryEntry,
  readDiagnosisClassification,
  validateDiagnosisClassification,
  validateDiagnosisClassificationBindings,
} from './diagnosis-classification';

const checkedInReviewTickets = [
  ...milestoneTwoClinicalAuditTickets,
  ...ClinicalReviewTicketSchema.array().parse(canmatReviewTicketsJson),
  ...ClinicalReviewTicketSchema.array().parse(recommendedGuidelineReviewTicketsJson),
  ...ClinicalReviewTicketSchema.array().parse(scaffoldReviewTicketsJson),
  ...ClinicalReviewTicketSchema.array().parse(whoScaffoldReviewTicketsJson),
  ...ClinicalReviewTicketSchema.array().parse(whoDepressionReviewTicketsJson),
];

const reviewCaseDirectory = resolve('content/cases/review');
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
    diagnosisClassificationMaterialized
      ? 'diagnosis-classification'
      : 'diagnosis-classification-manifest (local cache not materialized)',
    {
      valid: diagnosisClassificationIssues.length === 0,
      issues: diagnosisClassificationIssues,
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
