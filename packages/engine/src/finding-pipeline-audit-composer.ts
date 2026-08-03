import {
  CatalogInstanceCompileRequestSchema,
  FindingPipelineAuditArtifactSchema,
  FindingPipelineAuditRequestSchema,
  WeightedFindingTendencyRequestSchema,
  type AdmittedTemplateLocationBindingArtifact,
  type CapacityBoundLocationTemplateSelectionCertificateArtifact,
  type CatalogInstanceCompileRequest,
  type ConditionClinicalDurationAttachmentArtifact,
  type FindingDefinition,
  type FindingPipelineAuditArtifact,
  type FindingPipelineAuditDownstreamRequest,
  type FindingPipelineAuditFingerprint,
  type FindingPipelineAuditRequest,
  type FindingPipelineLiteralConflict,
  type FindingResolutionCandidate,
  type LocationTemplateSelectionArtifact,
  type PatientSlotFillSeedAuthorityArtifact,
  type ResolvedConditionSource,
  type ResolvedPatientState,
  type ResolvedPatientStateCompositionArtifact,
  type WeightedFindingTendencyApplicabilityArtifact,
  type WeightedFindingTendencyArtifact,
  type WeightedFindingTendencyRequest,
} from '@psychsim/schemas';

import { verifyBackgroundFindingOutcomeIntegrity } from './background-finding-outcome-selector';
import {
  compileCatalogInstances,
  verifyCatalogCompiledInstanceIntegrity,
} from './catalog-instance-compiler';
import { verifyConditionFindingCardinalityIntegrity } from './condition-finding-cardinality-selector';
import { verifyConditionClinicalDurationAttachmentIntegrity } from './condition-clinical-duration-attachment';
import { verifyPatientSlotFillSeedAuthorityIntegrity } from './patient-slot-fill-seed-authority';
import { verifyPreFindingPatientStateOrchestrationIntegrity } from './pre-finding-patient-state-orchestrator';
import { compileSharedFindings, type SharedFindingCompileError } from './shared-finding-compiler';
import { fingerprintTemplateConditionSelectionTemplate } from './template-condition-selector';
import {
  aggregateWeightedFindingTendencies,
  verifyWeightedFindingTendencyContext,
  verifyWeightedFindingTendencyIntegrity,
} from './weighted-finding-tendency-aggregator';
import { verifyWeightedFindingTendencyApplicabilityIntegrity } from './weighted-finding-tendency-applicability-compiler';

export const FINDING_PIPELINE_AUDIT_COMPOSER_VERSION = '23.0.0';

export type FindingPipelineAuditComposeErrorCode =
  | 'INVALID_REQUEST'
  | 'INVALID_PATIENT_SLOT_FILL_SEED_AUTHORITY'
  | 'INVALID_PRE_FINDING_PATIENT_STATE_ORCHESTRATION'
  | 'INVALID_CONDITION_CLINICAL_DURATION_ATTACHMENT'
  | 'PATIENT_SEED_CONTEXT_MISMATCH'
  | 'PATIENT_STATE_COMPOSITION_BLOCKED'
  | 'INVALID_CONDITION_FINDING_ARTIFACT'
  | 'INVALID_BACKGROUND_FINDING_ARTIFACT'
  | 'INVALID_TENDENCY_APPLICABILITY_ARTIFACT'
  | 'INVALID_WEIGHTED_TENDENCY_REQUEST'
  | 'WEIGHTED_TENDENCY_COMPILATION_FAILED'
  | 'INVALID_WEIGHTED_TENDENCY_ARTIFACT'
  | 'ARTIFACT_CHAIN_MISMATCH'
  | 'TEMPLATE_CONTEXT_MISMATCH'
  | 'CANDIDATE_UNION_COLLISION'
  | 'INVALID_CATALOG_REQUEST'
  | 'SHARED_FINDING_COMPILATION_FAILED'
  | 'CATALOG_COMPILATION_FAILED'
  | 'COMPILER_OUTPUT_MISMATCH'
  | 'INVALID_OUTPUT';

export interface FindingPipelineAuditComposeError {
  readonly code: FindingPipelineAuditComposeErrorCode;
  readonly message: string;
  readonly contentIds: readonly string[];
}

export type FindingPipelineAuditComposeResult =
  | { readonly ok: true; readonly value: FindingPipelineAuditArtifact }
  | { readonly ok: false; readonly error: FindingPipelineAuditComposeError };

export type FindingPipelineAuditIntegrityResult =
  | { readonly ok: true; readonly value: FindingPipelineAuditArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPOSER_VERSION'
          | 'UPSTREAM_INTEGRITY_INVALID'
          | 'CANDIDATE_UNION_MISMATCH'
          | 'COMPILED_SNAPSHOT_INVALID'
          | 'COMPILER_CONTEXT_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

export type FindingPipelineAuditContextResult =
  | { readonly ok: true; readonly value: FindingPipelineAuditArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_ARTIFACT' | 'CONTEXT_MISMATCH';
        readonly message: string;
      };
    };

const compareStrings = (left: string, right: string): number =>
  left === right ? 0 : left < right ? -1 : 1;

const canonicalizeObjectKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeObjectKeys);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([key, child]) => [key, canonicalizeObjectKeys(child)]),
    );
  }
  return value;
};

const canonicalizeSetArrays = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value
      .map(canonicalizeSetArrays)
      .sort((left, right) => compareStrings(JSON.stringify(left), JSON.stringify(right)));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([key, child]) => [key, canonicalizeSetArrays(child)]),
    );
  }
  return value;
};

const sameCanonicalValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const sameCanonicalSet = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeSetArrays(left)) === JSON.stringify(canonicalizeSetArrays(right));

const hashToHex64 = (value: string): string => {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, '0');
};

const fingerprint = (scope: string, value: unknown): FindingPipelineAuditFingerprint =>
  `fingerprint.finding-pipeline-audit.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const versionedKey = (value: { readonly id: string; readonly contentVersion: string }): string =>
  `${value.id}\u0000${value.contentVersion}`;

const normalizeCandidate = (candidate: FindingResolutionCandidate): FindingResolutionCandidate => ({
  ...candidate,
  contributions: [...candidate.contributions]
    .map((contribution) => ({
      ...contribution,
      provenanceIds: uniqueSorted(contribution.provenanceIds),
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
  review: {
    ...candidate.review,
    sourceUseNoteIds: uniqueSorted(candidate.review.sourceUseNoteIds),
  },
});

const sortCandidates = (
  candidates: readonly FindingResolutionCandidate[],
): FindingResolutionCandidate[] =>
  [...candidates].map(normalizeCandidate).sort((left, right) => compareStrings(left.id, right.id));

const effectiveBackgroundCandidates = (
  backgroundCandidates: readonly FindingResolutionCandidate[],
  findingTextureCandidates: readonly FindingResolutionCandidate[],
): FindingResolutionCandidate[] => {
  const replacedFindingDefinitionIds = new Set(
    findingTextureCandidates.map((candidate) => candidate.findingDefinitionId),
  );
  return sortCandidates([
    ...backgroundCandidates.filter(
      (candidate) => !replacedFindingDefinitionIds.has(candidate.findingDefinitionId),
    ),
    ...findingTextureCandidates,
  ]);
};

const assembleWeightedTendencyRequest = (input: {
  readonly applicability: WeightedFindingTendencyApplicabilityArtifact;
  readonly background: FindingPipelineAuditDownstreamRequest['backgroundFindingArtifact'];
  readonly findingDefinitions: readonly FindingDefinition[];
}):
  | { readonly ok: true; readonly value: WeightedFindingTendencyRequest | null }
  | { readonly ok: false; readonly message: string; readonly contentIds: readonly string[] } => {
  const bindings = input.applicability.contributorBindings;
  if (bindings.length === 0) return { ok: true, value: null };

  const profileByKey = new Map(
    input.applicability.applicabilityRequest.profiles.map((profile) => [
      versionedKey(profile),
      profile,
    ]),
  );
  const referencedProfileKeys = uniqueSorted(
    bindings.map((binding) => versionedKey(binding.profileRef)),
  );
  const profiles = referencedProfileKeys.flatMap((key) => {
    const profile = profileByKey.get(key);
    return profile === undefined ? [] : [profile];
  });
  if (profiles.length !== referencedProfileKeys.length) {
    return {
      ok: false,
      message: 'D-210 emitted a binding whose exact weighted-tendency profile is unavailable.',
      contentIds: bindings.map((binding) => binding.id),
    };
  }

  const selectionByBindingId = new Map(
    input.background.selections.map((selection) => [selection.bindingId, selection]),
  );
  const definitionByKey = new Map(
    input.findingDefinitions.map((definition) => [versionedKey(definition), definition]),
  );
  const targetDefinitionKeys = uniqueSorted(
    bindings.flatMap((binding) => {
      const selection = selectionByBindingId.get(binding.backgroundSelectionBindingId);
      return selection === undefined
        ? []
        : [
            versionedKey({
              id: selection.findingDefinitionId,
              contentVersion: selection.findingDefinitionContentVersion,
            }),
          ];
    }),
  );
  if (bindings.some((binding) => !selectionByBindingId.has(binding.backgroundSelectionBindingId))) {
    return {
      ok: false,
      message: 'D-210 emitted a binding without an exact D-198 target selection.',
      contentIds: bindings.map((binding) => binding.id),
    };
  }
  const findingDefinitions = targetDefinitionKeys.flatMap((key) => {
    const definition = definitionByKey.get(key);
    return definition === undefined ? [] : [definition];
  });
  if (findingDefinitions.length !== targetDefinitionKeys.length) {
    return {
      ok: false,
      message:
        'The D-200 shared-finding recipe is missing an exact finding-definition payload targeted by D-210.',
      contentIds: targetDefinitionKeys,
    };
  }

  const requestPayload = {
    backgroundRef: {
      id: input.background.id,
      payloadFingerprint: input.background.payloadFingerprint,
    },
    applicabilityRef: {
      id: input.applicability.id,
      payloadFingerprint: input.applicability.payloadFingerprint,
    },
    profiles,
    contributorBindings: bindings,
    findingDefinitions,
  };
  const parsed = WeightedFindingTendencyRequestSchema.safeParse({
    schemaVersion: 1,
    id: `weighted-finding-tendency-request.d211.${hashToHex64(
      JSON.stringify(canonicalizeObjectKeys(requestPayload)),
    )}`,
    backgroundArtifact: input.background,
    profiles,
    contributorBindings: bindings,
    findingDefinitions,
  });
  return parsed.success
    ? { ok: true, value: parsed.data }
    : {
        ok: false,
        message: issuesText(parsed.error.issues),
        contentIds: [
          input.applicability.id,
          input.background.id,
          ...bindings.map((binding) => binding.id),
        ],
      };
};

const auditInputPayload = (
  request: Pick<
    FindingPipelineAuditArtifact,
    | 'requestId'
    | 'patientSlotFillSeedAuthorityArtifact'
    | 'preFindingPatientStateOrchestrationArtifact'
    | 'conditionClinicalDurationAttachmentArtifact'
    | 'conditionFindingArtifact'
    | 'backgroundFindingArtifact'
    | 'weightedFindingTendencyApplicabilityArtifact'
    | 'weightedFindingTendencyRequest'
    | 'weightedFindingTendencyArtifact'
  >,
  catalogCompileInputFingerprint: FindingPipelineAuditArtifact['catalogCompileInputFingerprint'],
): unknown => ({
  requestId: request.requestId,
  patientSlotFillSeedAuthorityRef: {
    id: request.patientSlotFillSeedAuthorityArtifact.id,
    inputFingerprint: request.patientSlotFillSeedAuthorityArtifact.inputFingerprint,
    payloadFingerprint: request.patientSlotFillSeedAuthorityArtifact.payloadFingerprint,
    coordinates: request.patientSlotFillSeedAuthorityArtifact.coordinates,
    templateSelectionSeed: request.patientSlotFillSeedAuthorityArtifact.templateSelectionSeed,
    patientGenerationSeed: request.patientSlotFillSeedAuthorityArtifact.patientGenerationSeed,
    selectedTemplateRef: request.patientSlotFillSeedAuthorityArtifact.selectedTemplateRef,
    selectedTemplateFingerprint:
      request.patientSlotFillSeedAuthorityArtifact.selectedTemplateFingerprint,
  },
  preFindingPatientStateOrchestrationRef: {
    id: request.preFindingPatientStateOrchestrationArtifact.id,
    inputFingerprint: request.preFindingPatientStateOrchestrationArtifact.inputFingerprint,
    payloadFingerprint: request.preFindingPatientStateOrchestrationArtifact.payloadFingerprint,
    status: request.preFindingPatientStateOrchestrationArtifact.status,
  },
  conditionClinicalDurationAttachmentRef:
    request.conditionClinicalDurationAttachmentArtifact === null
      ? null
      : {
          id: request.conditionClinicalDurationAttachmentArtifact.id,
          inputFingerprint: request.conditionClinicalDurationAttachmentArtifact.inputFingerprint,
          composedPatientStateFingerprint:
            request.conditionClinicalDurationAttachmentArtifact.composedPatientStateFingerprint,
          payloadFingerprint:
            request.conditionClinicalDurationAttachmentArtifact.payloadFingerprint,
        },
  conditionFindingRef: {
    id: request.conditionFindingArtifact.id,
    payloadFingerprint: request.conditionFindingArtifact.payloadFingerprint,
  },
  backgroundFindingRef: {
    id: request.backgroundFindingArtifact.id,
    payloadFingerprint: request.backgroundFindingArtifact.payloadFingerprint,
  },
  weightedFindingTendencyApplicabilityRef: {
    id: request.weightedFindingTendencyApplicabilityArtifact.id,
    payloadFingerprint: request.weightedFindingTendencyApplicabilityArtifact.payloadFingerprint,
  },
  weightedFindingTendencyRequest: request.weightedFindingTendencyRequest,
  weightedFindingTendencyRef:
    request.weightedFindingTendencyArtifact === null
      ? null
      : {
          id: request.weightedFindingTendencyArtifact.id,
          payloadFingerprint: request.weightedFindingTendencyArtifact.payloadFingerprint,
        },
  catalogCompileInputFingerprint,
});

const fail = (
  code: FindingPipelineAuditComposeErrorCode,
  message: string,
  contentIds: readonly string[] = [],
): FindingPipelineAuditComposeResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

const resolveVerifiedPreFindingPatientState = (input: {
  readonly patientStateComposition: ResolvedPatientStateCompositionArtifact;
  readonly durationAttachment: ConditionClinicalDurationAttachmentArtifact | null;
}):
  | {
      readonly ok: true;
      readonly value: {
        readonly patientState: ResolvedPatientState;
        readonly durationAttachment: ConditionClinicalDurationAttachmentArtifact | null;
      };
    }
  | { readonly ok: false; readonly message: string } => {
  const composedPatientState = input.patientStateComposition.composedPatientState;
  if (input.patientStateComposition.status !== 'composed' || composedPatientState === null) {
    return {
      ok: false,
      message: 'A pre-finding patient state requires one complete D-208 composition.',
    };
  }
  if (input.durationAttachment === null) {
    return {
      ok: true,
      value: {
        patientState: composedPatientState,
        durationAttachment: null,
      },
    };
  }
  const integrity = verifyConditionClinicalDurationAttachmentIntegrity(input.durationAttachment);
  if (!integrity.ok) {
    return {
      ok: false,
      message: `${integrity.error.code}: ${integrity.error.message}`,
    };
  }
  const attachment = integrity.value;
  if (
    !sameCanonicalValue(
      attachment.attachmentRequest.patientStateCompositionArtifact,
      input.patientStateComposition,
    ) ||
    attachment.patientStateCompositionRef.id !== input.patientStateComposition.id ||
    attachment.patientStateCompositionRef.payloadFingerprint !==
      input.patientStateComposition.payloadFingerprint ||
    attachment.patientStateCompositionRef.composedPatientStateFingerprint !==
      input.patientStateComposition.composedPatientStateFingerprint
  ) {
    return {
      ok: false,
      message:
        'The D-264 duration attachment does not retain the exact D-208 composition nested under this D-223 root.',
    };
  }
  return {
    ok: true,
    value: {
      patientState: attachment.composedPatientState,
      durationAttachment: attachment,
    },
  };
};

const verifyChain = (
  request: FindingPipelineAuditRequest,
):
  | {
      readonly ok: true;
      readonly value: {
        readonly patientSlotFillSeedAuthority: PatientSlotFillSeedAuthorityArtifact;
        readonly locationTemplateSelection: LocationTemplateSelectionArtifact;
        readonly capacityBoundSlotCertificate: CapacityBoundLocationTemplateSelectionCertificateArtifact;
        readonly admittedTemplateLocationBinding: AdmittedTemplateLocationBindingArtifact;
        readonly patientStateComposition: ResolvedPatientStateCompositionArtifact;
        readonly preFindingPatientState: ResolvedPatientState;
        readonly conditionClinicalDurationAttachment: ConditionClinicalDurationAttachmentArtifact | null;
        readonly downstream: FindingPipelineAuditDownstreamRequest;
        readonly weightedTendencyRequest: WeightedFindingTendencyRequest | null;
        readonly weightedTendencyArtifact: WeightedFindingTendencyArtifact | null;
      };
    }
  | {
      readonly ok: false;
      readonly code:
        | 'INVALID_REQUEST'
        | 'INVALID_PATIENT_SLOT_FILL_SEED_AUTHORITY'
        | 'INVALID_PRE_FINDING_PATIENT_STATE_ORCHESTRATION'
        | 'INVALID_CONDITION_CLINICAL_DURATION_ATTACHMENT'
        | 'PATIENT_SEED_CONTEXT_MISMATCH'
        | 'PATIENT_STATE_COMPOSITION_BLOCKED'
        | 'INVALID_CONDITION_FINDING_ARTIFACT'
        | 'INVALID_BACKGROUND_FINDING_ARTIFACT'
        | 'INVALID_TENDENCY_APPLICABILITY_ARTIFACT'
        | 'INVALID_WEIGHTED_TENDENCY_REQUEST'
        | 'WEIGHTED_TENDENCY_COMPILATION_FAILED'
        | 'ARTIFACT_CHAIN_MISMATCH'
        | 'TEMPLATE_CONTEXT_MISMATCH';
      readonly message: string;
      readonly contentIds: readonly string[];
    } => {
  const seedAuthorityIntegrity = verifyPatientSlotFillSeedAuthorityIntegrity(
    request.patientSlotFillSeedAuthorityArtifact,
  );
  if (!seedAuthorityIntegrity.ok) {
    return {
      ok: false,
      code: 'INVALID_PATIENT_SLOT_FILL_SEED_AUTHORITY',
      message: `${seedAuthorityIntegrity.error.code}: ${seedAuthorityIntegrity.error.message}`,
      contentIds: [request.patientSlotFillSeedAuthorityArtifact.id],
    };
  }
  const patientSlotFillSeedAuthority = seedAuthorityIntegrity.value;
  const locationTemplateSelection = patientSlotFillSeedAuthority.locationTemplateSelectionArtifact;
  const capacityBoundSlotCertificate =
    patientSlotFillSeedAuthority.capacityBoundSlotCertificateArtifact;
  const locationOwnedPatientSlotSelection =
    locationTemplateSelection.locationOwnedPatientSlotSelectionArtifact;
  const admittedTemplateLocationBinding =
    locationOwnedPatientSlotSelection.admittedTemplateLocationBindingArtifact;
  const preFindingOrchestrationIntegrity = verifyPreFindingPatientStateOrchestrationIntegrity(
    request.preFindingPatientStateOrchestrationArtifact,
  );
  if (!preFindingOrchestrationIntegrity.ok) {
    return {
      ok: false,
      code: 'INVALID_PRE_FINDING_PATIENT_STATE_ORCHESTRATION',
      message: `${preFindingOrchestrationIntegrity.error.code}: ${preFindingOrchestrationIntegrity.error.message}`,
      contentIds: [request.preFindingPatientStateOrchestrationArtifact.id],
    };
  }
  const preFindingOrchestration = preFindingOrchestrationIntegrity.value;
  const patientGenerationSeed = patientSlotFillSeedAuthority.patientGenerationSeed;
  const orchestrationRequest = preFindingOrchestration.orchestrationRequest;
  const orchestrationSeeds = [
    orchestrationRequest.optionalFeatureSelectionRequest.seed,
    orchestrationRequest.conditionSourcePlan.conditionSelectionRequest.seed,
    preFindingOrchestration.optionalFeatureArtifact.seed,
  ];
  if (orchestrationSeeds.some((seed) => seed !== patientGenerationSeed)) {
    return {
      ok: false,
      code: 'PATIENT_SEED_CONTEXT_MISMATCH',
      message:
        'D-223 optional-feature and condition state must derive from the one D-233 patient-generation seed.',
      contentIds: [
        patientSlotFillSeedAuthority.id,
        preFindingOrchestration.id,
        preFindingOrchestration.conditionSource.artifact.id,
      ],
    };
  }
  const patientStateComposition = preFindingOrchestration.patientStateCompositionArtifact;
  if (
    patientStateComposition.status !== 'composed' ||
    patientStateComposition.composedPatientState === null
  ) {
    return {
      ok: false,
      code: 'PATIENT_STATE_COMPOSITION_BLOCKED',
      message:
        'Finding-pipeline composition requires a complete D-208 patient state; its retained blockers remain authoritative and are never rerolled or refunded here.',
      contentIds: [
        patientStateComposition.id,
        ...patientStateComposition.blockers.flatMap((blocker) =>
          blocker.kind === 'literal_condition_incompatibility'
            ? blocker.conflictIds
            : [blocker.moduleDefinitionId, blocker.bindingId, blocker.selectedModuleId],
        ),
      ],
    };
  }
  if (request.downstream === null) {
    return {
      ok: false,
      code: 'INVALID_REQUEST',
      message: 'A composed D-208 artifact requires the complete downstream pipeline request.',
      contentIds: [patientStateComposition.id],
    };
  }
  const preFindingState = resolveVerifiedPreFindingPatientState({
    patientStateComposition,
    durationAttachment: request.conditionClinicalDurationAttachmentArtifact,
  });
  if (!preFindingState.ok) {
    return {
      ok: false,
      code: 'INVALID_CONDITION_CLINICAL_DURATION_ATTACHMENT',
      message: preFindingState.message,
      contentIds: [
        patientStateComposition.id,
        ...(request.conditionClinicalDurationAttachmentArtifact === null
          ? []
          : [request.conditionClinicalDurationAttachmentArtifact.id]),
      ],
    };
  }
  const downstream = request.downstream;
  const conditionSource = patientStateComposition.compositionRequest.conditionSource;
  const conditionFindingIntegrity = verifyConditionFindingCardinalityIntegrity(
    downstream.conditionFindingArtifact,
  );
  if (!conditionFindingIntegrity.ok) {
    return {
      ok: false,
      code: 'INVALID_CONDITION_FINDING_ARTIFACT',
      message: `${conditionFindingIntegrity.error.code}: ${conditionFindingIntegrity.error.message}`,
      contentIds: [downstream.conditionFindingArtifact.id],
    };
  }
  const backgroundIntegrity = verifyBackgroundFindingOutcomeIntegrity(
    downstream.backgroundFindingArtifact,
  );
  if (!backgroundIntegrity.ok) {
    return {
      ok: false,
      code: 'INVALID_BACKGROUND_FINDING_ARTIFACT',
      message: `${backgroundIntegrity.error.code}: ${backgroundIntegrity.error.message}`,
      contentIds: [downstream.backgroundFindingArtifact.id],
    };
  }
  const applicabilityIntegrity = verifyWeightedFindingTendencyApplicabilityIntegrity(
    downstream.weightedFindingTendencyApplicabilityArtifact,
  );
  if (!applicabilityIntegrity.ok) {
    return {
      ok: false,
      code: 'INVALID_TENDENCY_APPLICABILITY_ARTIFACT',
      message: `${applicabilityIntegrity.error.code}: ${applicabilityIntegrity.error.message}`,
      contentIds: [downstream.weightedFindingTendencyApplicabilityArtifact.id],
    };
  }

  const conditionFinding = conditionFindingIntegrity.value;
  const background = backgroundIntegrity.value;
  const applicability = applicabilityIntegrity.value;
  const structuredSourceSelection =
    downstream.catalogCompileRecipe.structuredSourceReportSelectionArtifact;
  const optionalFeatureArtifact =
    patientStateComposition.compositionRequest.optionalFeatureArtifact;
  const sourceReportComplexityDefinitionIds =
    optionalFeatureArtifact.selectionRequest.moduleDefinitions
      .filter((definition) => definition.moduleKind === 'source_report')
      .map((definition) => definition.id)
      .sort(compareStrings);
  const selectionOptionalFeatureArtifact =
    structuredSourceSelection?.request.optionalFeatureArtifact;
  const findingSourceReportPolicy =
    downstream.catalogCompileRecipe.sharedFindingRecipe.findingSourceReportProjectionPolicy;
  const findingOptionalFeatureArtifact = findingSourceReportPolicy?.optionalFeatureArtifact;
  const structuredMappedDefinitionIds = [
    ...new Set(
      structuredSourceSelection?.request.selectionProfile.policies.flatMap((policy) =>
        policy.mode === 'complexity_gated'
          ? policy.modifiers.map((modifier) => modifier.moduleRef.id)
          : [],
      ) ?? [],
    ),
  ];
  const findingMappedDefinitionIds = [
    ...new Set(
      findingSourceReportPolicy?.slots.flatMap((slot) =>
        slot.modifiers.map((modifier) => modifier.moduleRef.id),
      ) ?? [],
    ),
  ];
  const mappedSourceReportDefinitionIds = [
    ...new Set([...structuredMappedDefinitionIds, ...findingMappedDefinitionIds]),
  ].sort(compareStrings);
  if (
    (selectionOptionalFeatureArtifact !== undefined &&
      !sameCanonicalValue(selectionOptionalFeatureArtifact, optionalFeatureArtifact)) ||
    (findingOptionalFeatureArtifact !== undefined &&
      !sameCanonicalValue(findingOptionalFeatureArtifact, optionalFeatureArtifact)) ||
    sourceReportComplexityDefinitionIds.join('\u0000') !==
      mappedSourceReportDefinitionIds.join('\u0000')
  ) {
    return {
      ok: false,
      code: 'ARTIFACT_CHAIN_MISMATCH',
      message:
        'Every source-report complexity candidate must flow from the one exact D-201 artifact into at least one D-217 structured view or D-258 finding projection; neither path may invent, redraw, omit, or recharge it.',
      contentIds: [
        optionalFeatureArtifact.id,
        ...(structuredSourceSelection === null ? [] : [structuredSourceSelection.id]),
        ...(findingSourceReportPolicy === undefined ? [] : [findingSourceReportPolicy.id]),
      ],
    };
  }
  const downstreamSeeds = [
    conditionFinding.seed,
    background.seed,
    downstream.catalogCompileRecipe.sharedFindingRecipe.seed,
    ...(structuredSourceSelection === null
      ? []
      : [structuredSourceSelection.seed, structuredSourceSelection.request.seed]),
    ...(findingOptionalFeatureArtifact === undefined
      ? []
      : [
          findingOptionalFeatureArtifact.seed,
          findingOptionalFeatureArtifact.selectionRequest.seed,
        ]),
    ...(preFindingState.value.durationAttachment?.attachmentRequest.durationResolutionArtifacts.map(
      (artifact) => artifact.compileRequest.seed,
    ) ?? []),
  ];
  if (downstreamSeeds.some((seed) => seed !== patientGenerationSeed)) {
    return {
      ok: false,
      code: 'PATIENT_SEED_CONTEXT_MISMATCH',
      message:
        'D-197, D-198, any D-263/D-264 duration attachment, D-193/D-194, and any D-217/D-258 source-report projection must share the one D-233 patient-generation seed.',
      contentIds: [
        patientSlotFillSeedAuthority.id,
        conditionFinding.id,
        background.id,
        ...(structuredSourceSelection === null ? [] : [structuredSourceSelection.id]),
      ],
    };
  }
  if (
    !sameCanonicalValue(conditionFinding.conditionSource, conditionSource) ||
    !sameCanonicalValue(
      conditionFinding.conditionSourceRef,
      patientStateComposition.conditionSourceRef,
    )
  ) {
    return {
      ok: false,
      code: 'ARTIFACT_CHAIN_MISMATCH',
      message: 'D-197 does not pin the exact resolved-condition source retained by D-208.',
      contentIds: [patientStateComposition.conditionSourceRef.id, conditionFinding.id],
    };
  }
  if (
    background.conditionFindingRef.id !== conditionFinding.id ||
    background.conditionFindingRef.payloadFingerprint !== conditionFinding.payloadFingerprint
  ) {
    return {
      ok: false,
      code: 'ARTIFACT_CHAIN_MISMATCH',
      message: 'D-198 does not pin the exact supplied D-197 artifact.',
      contentIds: [conditionFinding.id, background.id],
    };
  }
  if (
    !sameCanonicalValue(
      applicability.applicabilityRequest.patientStateCompositionArtifact,
      patientStateComposition,
    ) ||
    !sameCanonicalValue(applicability.applicabilityRequest.backgroundArtifact, background) ||
    applicability.patientStateCompositionRef.id !== patientStateComposition.id ||
    applicability.patientStateCompositionRef.payloadFingerprint !==
      patientStateComposition.payloadFingerprint ||
    applicability.backgroundRef.id !== background.id ||
    applicability.backgroundRef.payloadFingerprint !== background.payloadFingerprint
  ) {
    return {
      ok: false,
      code: 'ARTIFACT_CHAIN_MISMATCH',
      message:
        'D-210 does not retain the exact supplied D-208 patient state and D-198 target artifact.',
      contentIds: [patientStateComposition.id, background.id, applicability.id],
    };
  }

  const template = admittedTemplateLocationBinding.template;
  const orchestrationTemplate =
    preFindingOrchestration.orchestrationRequest.optionalFeatureSelectionRequest.template;
  if (
    !sameCanonicalValue(template, orchestrationTemplate) ||
    patientStateComposition.templateRef.id !== template.id ||
    patientStateComposition.templateRef.contentVersion !== template.contentVersion ||
    patientStateComposition.templateFingerprint !==
      fingerprintTemplateConditionSelectionTemplate(template)
  ) {
    return {
      ok: false,
      code: 'TEMPLATE_CONTEXT_MISMATCH',
      message:
        'The admitted template/location binding template does not match the exact template payload retained by D-208.',
      contentIds: [patientStateComposition.id, template.id],
    };
  }
  const assembledWeightedRequest = assembleWeightedTendencyRequest({
    applicability,
    background,
    findingDefinitions: downstream.catalogCompileRecipe.sharedFindingRecipe.findingDefinitions,
  });
  if (!assembledWeightedRequest.ok) {
    return {
      ok: false,
      code: 'INVALID_WEIGHTED_TENDENCY_REQUEST',
      message: assembledWeightedRequest.message,
      contentIds: assembledWeightedRequest.contentIds,
    };
  }
  const weightedTendencyRequest = assembledWeightedRequest.value;
  let weightedTendencyArtifact: WeightedFindingTendencyArtifact | null = null;
  if (weightedTendencyRequest !== null) {
    const aggregation = aggregateWeightedFindingTendencies(weightedTendencyRequest);
    if (!aggregation.ok) {
      return {
        ok: false,
        code: 'WEIGHTED_TENDENCY_COMPILATION_FAILED',
        message: `${aggregation.error.code}: ${aggregation.error.message}`,
        contentIds: [
          applicability.id,
          background.id,
          ...applicability.contributorBindings.map((binding) => binding.id),
        ],
      };
    }
    weightedTendencyArtifact = aggregation.value;
    if (weightedTendencyArtifact.seed !== patientGenerationSeed) {
      return {
        ok: false,
        code: 'PATIENT_SEED_CONTEXT_MISMATCH',
        message: 'D-199 must retain the same D-233 patient-generation seed as its D-198 baseline.',
        contentIds: [patientSlotFillSeedAuthority.id, weightedTendencyArtifact.id],
      };
    }
  }
  const findingTextureBridge =
    patientStateComposition.compositionRequest.findingTextureBridgeArtifact;
  if (findingTextureBridge !== null) {
    const backgroundByFindingId = new Map(
      background.candidates.map((candidate) => [candidate.findingDefinitionId, candidate]),
    );
    const invalidTextureCandidateIds = findingTextureBridge.candidates
      .filter((candidate) => {
        const baseline = backgroundByFindingId.get(candidate.findingDefinitionId);
        return (
          baseline === undefined ||
          baseline.findingDefinitionContentVersion !== candidate.findingDefinitionContentVersion
        );
      })
      .map((candidate) => candidate.id);
    const weightedTextureCollisions = (weightedTendencyArtifact?.candidates ?? [])
      .filter((candidate) =>
        findingTextureBridge.replacedBackgroundFindingDefinitionIds.includes(
          candidate.findingDefinitionId,
        ),
      )
      .map((candidate) => candidate.id);
    if (invalidTextureCandidateIds.length > 0 || weightedTextureCollisions.length > 0) {
      return {
        ok: false,
        code: 'ARTIFACT_CHAIN_MISMATCH',
        message:
          invalidTextureCandidateIds.length > 0
            ? 'A D-201-selected finding texture lacks the exact D-198 background target it replaces.'
            : 'A selected exact finding texture and a D-199 aggregate target the same finding; this narrow bridge will not guess how to combine them.',
        contentIds: [
          findingTextureBridge.id,
          background.id,
          ...invalidTextureCandidateIds,
          ...weightedTextureCollisions,
        ],
      };
    }
  }
  return {
    ok: true,
    value: {
      patientSlotFillSeedAuthority,
      locationTemplateSelection,
      capacityBoundSlotCertificate,
      admittedTemplateLocationBinding,
      patientStateComposition,
      preFindingPatientState: preFindingState.value.patientState,
      conditionClinicalDurationAttachment: preFindingState.value.durationAttachment,
      downstream,
      weightedTendencyRequest,
      weightedTendencyArtifact,
    },
  };
};

const candidateUnion = (
  downstream: FindingPipelineAuditDownstreamRequest,
  weightedTendencyArtifact: WeightedFindingTendencyArtifact | null,
  findingTextureCandidates: readonly FindingResolutionCandidate[],
):
  | { readonly ok: true; readonly value: FindingResolutionCandidate[] }
  | {
      readonly ok: false;
      readonly candidateIds: readonly string[];
      readonly contributionIds: readonly string[];
    } => {
  const candidates = sortCandidates([
    ...downstream.catalogCompileRecipe.authoredFindingCandidates,
    ...downstream.conditionFindingArtifact.candidates,
    ...effectiveBackgroundCandidates(
      downstream.backgroundFindingArtifact.candidates,
      findingTextureCandidates,
    ),
    ...(weightedTendencyArtifact?.candidates ?? []),
  ]);
  const duplicateCandidateIds = candidates
    .map((candidate) => candidate.id)
    .filter((id, index, values) => values.indexOf(id) !== index);
  const allContributionIds = candidates.flatMap((candidate) =>
    candidate.contributions.map((contribution) => contribution.id),
  );
  const duplicateContributionIds = allContributionIds.filter(
    (id, index, values) => values.indexOf(id) !== index,
  );
  return duplicateCandidateIds.length === 0 && duplicateContributionIds.length === 0
    ? { ok: true, value: candidates }
    : {
        ok: false,
        candidateIds: uniqueSorted(duplicateCandidateIds),
        contributionIds: uniqueSorted(duplicateContributionIds),
      };
};

const assembleCatalogRequest = (
  admittedTemplateLocationBinding: AdmittedTemplateLocationBindingArtifact,
  patientStateComposition: ResolvedPatientStateCompositionArtifact,
  preFindingPatientState: ResolvedPatientState,
  downstream: FindingPipelineAuditDownstreamRequest,
  candidates: readonly FindingResolutionCandidate[],
):
  | { readonly ok: true; readonly value: CatalogInstanceCompileRequest }
  | { readonly ok: false; readonly message: string } => {
  const { sharedFindingRecipe, authoredFindingCandidates, ...catalogRecipe } =
    downstream.catalogCompileRecipe;
  void authoredFindingCandidates;
  const parsed = CatalogInstanceCompileRequestSchema.safeParse({
    ...catalogRecipe,
    template: admittedTemplateLocationBinding.template,
    location: admittedTemplateLocationBinding.location,
    operationalAdmissionArtifact: admittedTemplateLocationBinding.operationalAdmissionArtifact,
    basePatientState: preFindingPatientState,
    conditionBindings: patientStateComposition.conditionBindings,
    sharedFindingRequest: {
      ...sharedFindingRecipe,
      patientStateId: preFindingPatientState.id,
      propositionState: preFindingPatientState.propositionState,
      candidates,
    },
  });
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, message: issuesText(parsed.error.issues) };
};

const literalConflict = (
  error: SharedFindingCompileError,
): FindingPipelineLiteralConflict | null =>
  error.code === 'LITERAL_SAME_SCOPE_CONTRADICTION' &&
  error.disposition === 'retry_or_quarantine' &&
  error.inputFingerprint !== null
    ? {
        code: error.code,
        message: error.message,
        contentIds: [...error.contentIds],
        conflictId: error.conflictId,
        inputFingerprint: error.inputFingerprint,
        conflictingCandidates: sortCandidates(error.conflictingCandidates),
        disposition: error.disposition,
      }
    : null;

const artifactPayload = (
  artifact: Omit<FindingPipelineAuditArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  composerVersion: artifact.composerVersion,
  requestId: artifact.requestId,
  status: artifact.status,
  patientSlotFillSeedAuthorityArtifact: artifact.patientSlotFillSeedAuthorityArtifact,
  preFindingPatientStateOrchestrationArtifact: artifact.preFindingPatientStateOrchestrationArtifact,
  conditionClinicalDurationAttachmentArtifact: artifact.conditionClinicalDurationAttachmentArtifact,
  conditionFindingArtifact: artifact.conditionFindingArtifact,
  backgroundFindingArtifact: artifact.backgroundFindingArtifact,
  weightedFindingTendencyApplicabilityArtifact:
    artifact.weightedFindingTendencyApplicabilityArtifact,
  weightedFindingTendencyRequest: artifact.weightedFindingTendencyRequest,
  weightedFindingTendencyArtifact: artifact.weightedFindingTendencyArtifact,
  candidateUnion: artifact.candidateUnion,
  catalogCompileRequest: artifact.catalogCompileRequest,
  sharedFindingInputFingerprint: artifact.sharedFindingInputFingerprint,
  catalogCompileInputFingerprint: artifact.catalogCompileInputFingerprint,
  sharedFindingConflict: artifact.sharedFindingConflict,
  catalogSnapshot: artifact.catalogSnapshot,
  inputFingerprint: artifact.inputFingerprint,
});

const buildArtifact = (
  request: FindingPipelineAuditRequest,
  downstream: FindingPipelineAuditDownstreamRequest,
  input: {
    readonly candidates: FindingResolutionCandidate[];
    readonly catalogCompileRequest: CatalogInstanceCompileRequest;
    readonly sharedFindingInputFingerprint: FindingPipelineAuditArtifact['sharedFindingInputFingerprint'];
    readonly catalogCompileInputFingerprint: FindingPipelineAuditArtifact['catalogCompileInputFingerprint'];
    readonly conflict: FindingPipelineLiteralConflict | null;
    readonly catalogSnapshot: FindingPipelineAuditArtifact['catalogSnapshot'];
    readonly weightedTendencyRequest: WeightedFindingTendencyRequest | null;
    readonly weightedTendencyArtifact: WeightedFindingTendencyArtifact | null;
  },
): FindingPipelineAuditArtifact => {
  const inputFingerprint = fingerprint(
    'input',
    auditInputPayload(
      {
        requestId: request.id,
        patientSlotFillSeedAuthorityArtifact: request.patientSlotFillSeedAuthorityArtifact,
        preFindingPatientStateOrchestrationArtifact:
          request.preFindingPatientStateOrchestrationArtifact,
        conditionClinicalDurationAttachmentArtifact:
          request.conditionClinicalDurationAttachmentArtifact,
        conditionFindingArtifact: downstream.conditionFindingArtifact,
        backgroundFindingArtifact: downstream.backgroundFindingArtifact,
        weightedFindingTendencyApplicabilityArtifact:
          downstream.weightedFindingTendencyApplicabilityArtifact,
        weightedFindingTendencyRequest: input.weightedTendencyRequest,
        weightedFindingTendencyArtifact: input.weightedTendencyArtifact,
      },
      input.catalogCompileInputFingerprint,
    ),
  );
  const withoutIdentity = {
    schemaVersion: 1 as const,
    composerVersion: FINDING_PIPELINE_AUDIT_COMPOSER_VERSION,
    requestId: request.id,
    status: input.conflict === null ? ('compiled' as const) : ('literal_finding_conflict' as const),
    patientSlotFillSeedAuthorityArtifact: request.patientSlotFillSeedAuthorityArtifact,
    preFindingPatientStateOrchestrationArtifact:
      request.preFindingPatientStateOrchestrationArtifact,
    conditionClinicalDurationAttachmentArtifact:
      request.conditionClinicalDurationAttachmentArtifact,
    conditionFindingArtifact: downstream.conditionFindingArtifact,
    backgroundFindingArtifact: downstream.backgroundFindingArtifact,
    weightedFindingTendencyApplicabilityArtifact:
      downstream.weightedFindingTendencyApplicabilityArtifact,
    weightedFindingTendencyRequest: input.weightedTendencyRequest,
    weightedFindingTendencyArtifact: input.weightedTendencyArtifact,
    candidateUnion: input.candidates,
    catalogCompileRequest: input.catalogCompileRequest,
    sharedFindingInputFingerprint: input.sharedFindingInputFingerprint,
    catalogCompileInputFingerprint: input.catalogCompileInputFingerprint,
    sharedFindingConflict: input.conflict,
    catalogSnapshot: input.catalogSnapshot,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
  return FindingPipelineAuditArtifactSchema.parse({
    ...withoutIdentity,
    id: `finding-pipeline-audit.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
};

/**
 * Audits one D-233 seed-authorized, D-232 capacity-authorized D-230
 * deterministic local-template draw,
 * then composes one complete
 * D-223 pre-finding orchestration artifact followed by a frozen
 * D-197/D-198/D-210 chain. D-210 is the sole applicability-binding source;
 * this composer delegates mass pooling, normalization, and the draw to D-199.
 * It requires every patient randomizer to share D-233's one patient-generation
 * seed, derives every D-193/D-194 attachment through D-230's nested
 * D-229/D-228 chain and D-223's verified D-208 result plus optional verified
 * D-264 state, and never selects or spends the encounter-owned complexity
 * budget again.
 */
export const composeFindingPipelineAudit = (input: unknown): FindingPipelineAuditComposeResult => {
  const parsed = FindingPipelineAuditRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues));
  }
  const request = parsed.data;
  const chain = verifyChain(request);
  if (!chain.ok) {
    return fail(chain.code, chain.message, chain.contentIds);
  }
  const {
    admittedTemplateLocationBinding,
    patientStateComposition,
    preFindingPatientState,
    downstream,
    weightedTendencyRequest,
    weightedTendencyArtifact,
  } = chain.value;
  const union = candidateUnion(
    downstream,
    weightedTendencyArtifact,
    patientStateComposition.compositionRequest.findingTextureBridgeArtifact?.candidates ?? [],
  );
  if (!union.ok) {
    return fail(
      'CANDIDATE_UNION_COLLISION',
      'The D-200 candidate union contains colliding candidate or contribution IDs; composition never deduplicates clinical meaning.',
      [...union.candidateIds, ...union.contributionIds],
    );
  }
  const catalogRequest = assembleCatalogRequest(
    admittedTemplateLocationBinding,
    patientStateComposition,
    preFindingPatientState,
    downstream,
    union.value,
  );
  if (!catalogRequest.ok) {
    return fail('INVALID_CATALOG_REQUEST', catalogRequest.message);
  }

  const findingPreflight = compileSharedFindings(catalogRequest.value.sharedFindingRequest);
  const catalogCompilation = compileCatalogInstances(catalogRequest.value);

  if (!findingPreflight.ok) {
    const conflict = literalConflict(findingPreflight.error);
    if (
      conflict === null ||
      catalogCompilation.ok ||
      catalogCompilation.error.code !== 'SHARED_FINDING_COMPILATION_FAILED' ||
      catalogCompilation.error.inputFingerprint === null
    ) {
      return fail(
        conflict === null ? 'SHARED_FINDING_COMPILATION_FAILED' : 'CATALOG_COMPILATION_FAILED',
        catalogCompilation.ok
          ? `${findingPreflight.error.code}: ${findingPreflight.error.message}`
          : `${catalogCompilation.error.code}: ${catalogCompilation.error.message}`,
        findingPreflight.error.contentIds,
      );
    }
    try {
      return {
        ok: true,
        value: buildArtifact(request, downstream, {
          candidates: union.value,
          catalogCompileRequest: catalogRequest.value,
          sharedFindingInputFingerprint: conflict.inputFingerprint,
          catalogCompileInputFingerprint: catalogCompilation.error.inputFingerprint,
          conflict,
          catalogSnapshot: null,
          weightedTendencyRequest,
          weightedTendencyArtifact,
        }),
      };
    } catch (error) {
      return fail('INVALID_OUTPUT', error instanceof Error ? error.message : String(error));
    }
  }

  if (!catalogCompilation.ok) {
    return fail(
      'CATALOG_COMPILATION_FAILED',
      `${catalogCompilation.error.code}: ${catalogCompilation.error.message}`,
      catalogCompilation.error.contentIds,
    );
  }
  if (
    !sameCanonicalValue(
      findingPreflight.value,
      catalogCompilation.value.patientInstance.sharedFindingCompilation,
    )
  ) {
    return fail(
      'COMPILER_OUTPUT_MISMATCH',
      'The D-193 preflight and the D-194 attachment compiler produced different frozen finding output.',
      [
        findingPreflight.value.id,
        catalogCompilation.value.patientInstance.sharedFindingCompilation.id,
      ],
    );
  }
  try {
    return {
      ok: true,
      value: buildArtifact(request, downstream, {
        candidates: union.value,
        catalogCompileRequest: catalogRequest.value,
        sharedFindingInputFingerprint: findingPreflight.value.inputFingerprint,
        catalogCompileInputFingerprint: catalogCompilation.value.inputFingerprint,
        conflict: null,
        catalogSnapshot: catalogCompilation.value,
        weightedTendencyRequest,
        weightedTendencyArtifact,
      }),
    };
  } catch (error) {
    return fail('INVALID_OUTPUT', error instanceof Error ? error.message : String(error));
  }
};

const verifyEmbeddedChain = (
  artifact: FindingPipelineAuditArtifact,
):
  | {
      readonly ok: true;
      readonly value: {
        readonly patientSlotFillSeedAuthority: PatientSlotFillSeedAuthorityArtifact;
        readonly locationTemplateSelection: LocationTemplateSelectionArtifact;
        readonly capacityBoundSlotCertificate: CapacityBoundLocationTemplateSelectionCertificateArtifact;
        readonly patientStateComposition: ResolvedPatientStateCompositionArtifact;
        readonly preFindingPatientState: ResolvedPatientState;
        readonly conditionSource: ResolvedConditionSource;
      };
    }
  | { readonly ok: false; readonly message: string } => {
  const seedAuthority = verifyPatientSlotFillSeedAuthorityIntegrity(
    artifact.patientSlotFillSeedAuthorityArtifact,
  );
  const preFindingOrchestration = verifyPreFindingPatientStateOrchestrationIntegrity(
    artifact.preFindingPatientStateOrchestrationArtifact,
  );
  const conditionFinding = verifyConditionFindingCardinalityIntegrity(
    artifact.conditionFindingArtifact,
  );
  const background = verifyBackgroundFindingOutcomeIntegrity(artifact.backgroundFindingArtifact);
  const applicability = verifyWeightedFindingTendencyApplicabilityIntegrity(
    artifact.weightedFindingTendencyApplicabilityArtifact,
  );
  const weighted =
    artifact.weightedFindingTendencyArtifact === null
      ? null
      : verifyWeightedFindingTendencyIntegrity(artifact.weightedFindingTendencyArtifact);
  if (!seedAuthority.ok) return { ok: false, message: seedAuthority.error.message };
  const templateSelection = seedAuthority.value.locationTemplateSelectionArtifact;
  const capacityCertificate = seedAuthority.value.capacityBoundSlotCertificateArtifact;
  const slotSelection = templateSelection.locationOwnedPatientSlotSelectionArtifact;
  if (!preFindingOrchestration.ok) {
    return { ok: false, message: preFindingOrchestration.error.message };
  }
  const patientStateComposition = preFindingOrchestration.value.patientStateCompositionArtifact;
  if (
    patientStateComposition.status !== 'composed' ||
    patientStateComposition.composedPatientState === null
  ) {
    return {
      ok: false,
      message:
        'The embedded D-223 artifact does not contain a complete composed D-208 patient state.',
    };
  }
  const conditionSource = patientStateComposition.compositionRequest.conditionSource;
  const preFindingState = resolveVerifiedPreFindingPatientState({
    patientStateComposition,
    durationAttachment: artifact.conditionClinicalDurationAttachmentArtifact,
  });
  if (!preFindingState.ok) {
    return { ok: false, message: preFindingState.message };
  }
  if (!conditionFinding.ok) return { ok: false, message: conditionFinding.error.message };
  if (!background.ok) return { ok: false, message: background.error.message };
  if (!applicability.ok) return { ok: false, message: applicability.error.message };
  if (weighted !== null && !weighted.ok) return { ok: false, message: weighted.error.message };
  const patientGenerationSeed = seedAuthority.value.patientGenerationSeed;
  const orchestrationRequest = preFindingOrchestration.value.orchestrationRequest;
  const structuredSourceSelection =
    artifact.catalogCompileRequest.structuredSourceReportSelectionArtifact;
  const retainedSeeds = [
    orchestrationRequest.optionalFeatureSelectionRequest.seed,
    orchestrationRequest.conditionSourcePlan.conditionSelectionRequest.seed,
    preFindingOrchestration.value.optionalFeatureArtifact.seed,
    conditionFinding.value.seed,
    background.value.seed,
    artifact.catalogCompileRequest.sharedFindingRequest.seed,
    ...(weighted === null ? [] : [weighted.value.seed]),
    ...(structuredSourceSelection === null
      ? []
      : [structuredSourceSelection.seed, structuredSourceSelection.request.seed]),
    ...(artifact.catalogSnapshot === null ? [] : [artifact.catalogSnapshot.patientInstance.seed]),
    ...(preFindingState.value.durationAttachment?.attachmentRequest.durationResolutionArtifacts.map(
      (durationArtifact) => durationArtifact.compileRequest.seed,
    ) ?? []),
  ];
  if (retainedSeeds.some((seed) => seed !== patientGenerationSeed)) {
    return {
      ok: false,
      message:
        'The embedded D-223, optional D-263/D-264 duration path, D-197-through-D-199, D-193/D-194, optional D-217, and final patient snapshot do not share the one D-233 patient-generation seed.',
    };
  }
  if (
    slotSelection.admittedTemplateLocationBindingArtifact.template.id !==
      patientStateComposition.templateRef.id ||
    slotSelection.admittedTemplateLocationBindingArtifact.template.contentVersion !==
      patientStateComposition.templateRef.contentVersion ||
    slotSelection.admittedTemplateLocationBindingArtifact.careSetting !==
      slotSelection.admittedTemplateLocationBindingArtifact.template.careSetting ||
    !sameCanonicalValue(conditionFinding.value.conditionSource, conditionSource) ||
    !sameCanonicalValue(
      conditionFinding.value.conditionSourceRef,
      patientStateComposition.conditionSourceRef,
    ) ||
    background.value.conditionFindingRef.id !== conditionFinding.value.id ||
    background.value.conditionFindingRef.payloadFingerprint !==
      conditionFinding.value.payloadFingerprint ||
    !sameCanonicalValue(
      applicability.value.applicabilityRequest.patientStateCompositionArtifact,
      patientStateComposition,
    ) ||
    !sameCanonicalValue(
      applicability.value.applicabilityRequest.backgroundArtifact,
      background.value,
    ) ||
    applicability.value.patientStateCompositionRef.id !== patientStateComposition.id ||
    applicability.value.patientStateCompositionRef.payloadFingerprint !==
      patientStateComposition.payloadFingerprint ||
    applicability.value.backgroundRef.id !== background.value.id ||
    applicability.value.backgroundRef.payloadFingerprint !== background.value.payloadFingerprint ||
    (applicability.value.contributorBindings.length === 0) !==
      (artifact.weightedFindingTendencyRequest === null) ||
    (applicability.value.contributorBindings.length === 0) !==
      (artifact.weightedFindingTendencyArtifact === null) ||
    (weighted !== null &&
      (weighted.value.backgroundRef.id !== background.value.id ||
        weighted.value.backgroundRef.payloadFingerprint !== background.value.payloadFingerprint ||
        artifact.weightedFindingTendencyRequest === null ||
        !sameCanonicalValue(
          weighted.value.contributorBindings,
          applicability.value.contributorBindings,
        )))
  ) {
    return {
      ok: false,
      message:
        'The embedded D-223/D-208 condition source and D-197 through D-210/D-199 artifacts do not form one exact reference chain.',
    };
  }
  if (artifact.weightedFindingTendencyRequest !== null) {
    const weightedContext = verifyWeightedFindingTendencyContext({
      artifact: artifact.weightedFindingTendencyArtifact,
      request: artifact.weightedFindingTendencyRequest,
    });
    if (!weightedContext.ok) {
      return { ok: false, message: weightedContext.error.message };
    }
  }
  return {
    ok: true,
    value: {
      patientSlotFillSeedAuthority: seedAuthority.value,
      locationTemplateSelection: templateSelection,
      capacityBoundSlotCertificate: capacityCertificate,
      patientStateComposition,
      preFindingPatientState: preFindingState.value.patientState,
      conditionSource,
    },
  };
};

export const verifyFindingPipelineAuditIntegrity = (
  value: unknown,
): FindingPipelineAuditIntegrityResult => {
  const parsed = FindingPipelineAuditArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  const artifact = parsed.data;
  if (artifact.composerVersion !== FINDING_PIPELINE_AUDIT_COMPOSER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPOSER_VERSION',
        message: `${artifact.id} uses unsupported finding-pipeline composer ${artifact.composerVersion}.`,
      },
    };
  }
  const chain = verifyEmbeddedChain(artifact);
  if (!chain.ok) {
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_INTEGRITY_INVALID',
        message: chain.message,
      },
    };
  }
  const expectedWeightedRequest = assembleWeightedTendencyRequest({
    applicability: artifact.weightedFindingTendencyApplicabilityArtifact,
    background: artifact.backgroundFindingArtifact,
    findingDefinitions: artifact.catalogCompileRequest.sharedFindingRequest.findingDefinitions,
  });
  if (
    !expectedWeightedRequest.ok ||
    !sameCanonicalValue(expectedWeightedRequest.value, artifact.weightedFindingTendencyRequest)
  ) {
    return {
      ok: false,
      error: {
        code: 'COMPILER_CONTEXT_MISMATCH',
        message: expectedWeightedRequest.ok
          ? 'The retained D-199 request was not derived exactly from D-210 and the D-193 finding-definition horizon.'
          : expectedWeightedRequest.message,
      },
    };
  }

  const findingTextureCandidates =
    chain.value.patientStateComposition.compositionRequest.findingTextureBridgeArtifact
      ?.candidates ?? [];
  const upstreamCandidates = sortCandidates([
    ...artifact.conditionFindingArtifact.candidates,
    ...effectiveBackgroundCandidates(
      artifact.backgroundFindingArtifact.candidates,
      findingTextureCandidates,
    ),
    ...(artifact.weightedFindingTendencyArtifact?.candidates ?? []),
  ]);
  const candidateById = new Map(
    artifact.candidateUnion.map((candidate) => [candidate.id, candidate]),
  );
  const upstreamIds = new Set(upstreamCandidates.map((candidate) => candidate.id));
  const authoredCandidates = artifact.candidateUnion.filter(
    (candidate) => !upstreamIds.has(candidate.id),
  );
  const allowedAuthoredKinds = new Set(['patient_override', 'case_critical', 'no_opinion']);
  if (
    upstreamCandidates.some(
      (candidate) => !sameCanonicalValue(candidateById.get(candidate.id), candidate),
    ) ||
    authoredCandidates.some((candidate) => !allowedAuthoredKinds.has(candidate.kind)) ||
    !sameCanonicalValue(
      artifact.candidateUnion,
      sortCandidates([...authoredCandidates, ...upstreamCandidates]),
    )
  ) {
    return {
      ok: false,
      error: {
        code: 'CANDIDATE_UNION_MISMATCH',
        message:
          'The candidate union does not preserve every exact upstream candidate plus only permitted authored lanes.',
      },
    };
  }
  if (
    !sameCanonicalValue(
      artifact.candidateUnion,
      sortCandidates(artifact.catalogCompileRequest.sharedFindingRequest.candidates),
    )
  ) {
    return {
      ok: false,
      error: {
        code: 'CANDIDATE_UNION_MISMATCH',
        message:
          'The retained D-194 request does not preserve every candidate payload in the exact composed union.',
      },
    };
  }

  const {
    locationTemplateSelection,
    patientStateComposition,
    preFindingPatientState,
    conditionSource,
  } = chain.value;
  const admittedBinding =
    locationTemplateSelection.locationOwnedPatientSlotSelectionArtifact
      .admittedTemplateLocationBindingArtifact;
  if (
    admittedBinding.template.id !== artifact.catalogCompileRequest.template.id ||
    admittedBinding.template.contentVersion !==
      artifact.catalogCompileRequest.template.contentVersion ||
    !sameCanonicalValue(admittedBinding.template, artifact.catalogCompileRequest.template) ||
    !sameCanonicalValue(admittedBinding.location, artifact.catalogCompileRequest.location) ||
    !sameCanonicalValue(
      admittedBinding.operationalAdmissionArtifact,
      artifact.catalogCompileRequest.operationalAdmissionArtifact,
    ) ||
    patientStateComposition.templateRef.id !== artifact.catalogCompileRequest.template.id ||
    patientStateComposition.templateRef.contentVersion !==
      artifact.catalogCompileRequest.template.contentVersion ||
    patientStateComposition.templateFingerprint !==
      fingerprintTemplateConditionSelectionTemplate(artifact.catalogCompileRequest.template) ||
    !sameCanonicalValue(preFindingPatientState, artifact.catalogCompileRequest.basePatientState) ||
    !sameCanonicalSet(
      patientStateComposition.conditionBindings,
      artifact.catalogCompileRequest.conditionBindings,
    ) ||
    artifact.catalogCompileRequest.sharedFindingRequest.patientStateId !==
      preFindingPatientState.id ||
    !sameCanonicalValue(
      artifact.catalogCompileRequest.sharedFindingRequest.propositionState,
      preFindingPatientState.propositionState,
    )
  ) {
    return {
      ok: false,
      error: {
        code: 'COMPILER_CONTEXT_MISMATCH',
        message:
          'The retained D-193/D-194 request does not derive its exact template, D-208 or verified D-264 pre-finding patient state, proposition state, and condition bindings from the retained upstream chain.',
      },
    };
  }

  const expectedInputFingerprint = fingerprint(
    'input',
    auditInputPayload(artifact, artifact.catalogCompileInputFingerprint),
  );
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'COMPILER_CONTEXT_MISMATCH',
        message:
          'The audit input fingerprint does not bind the exact upstream artifact chain and D-194 request.',
      },
    };
  }

  const findingReplay = compileSharedFindings(artifact.catalogCompileRequest.sharedFindingRequest);
  const catalogReplay = compileCatalogInstances(artifact.catalogCompileRequest);

  if (artifact.status === 'compiled') {
    if (!findingReplay.ok || !catalogReplay.ok) {
      return {
        ok: false,
        error: {
          code: 'COMPILER_CONTEXT_MISMATCH',
          message:
            'The retained D-193/D-194 request does not replay to a compiled finding-pipeline snapshot.',
        },
      };
    }
    const snapshotIntegrity = verifyCatalogCompiledInstanceIntegrity(artifact.catalogSnapshot);
    if (!snapshotIntegrity.ok) {
      return {
        ok: false,
        error: {
          code: 'COMPILED_SNAPSHOT_INVALID',
          message: snapshotIntegrity.error.message,
        },
      };
    }
    if (
      snapshotIntegrity.value.inputFingerprint !== artifact.catalogCompileInputFingerprint ||
      snapshotIntegrity.value.patientInstance.sharedFindingCompilation.inputFingerprint !==
        artifact.sharedFindingInputFingerprint ||
      !sameCanonicalValue(
        findingReplay.value,
        snapshotIntegrity.value.patientInstance.sharedFindingCompilation,
      ) ||
      !sameCanonicalValue(catalogReplay.value, snapshotIntegrity.value) ||
      !sameCanonicalSet(
        snapshotIntegrity.value.patientInstance.patientState.conditionStates,
        conditionSource.artifact.conditionStates,
      ) ||
      !sameCanonicalSet(
        snapshotIntegrity.value.patientInstance.conditionBindings,
        patientStateComposition.conditionBindings,
      )
    ) {
      return {
        ok: false,
        error: {
          code: 'COMPILER_CONTEXT_MISMATCH',
          message:
            'The compiled snapshot does not reproduce the exact D-208 → optional D-264 → D-193 → D-194 request and condition context.',
        },
      };
    }
  } else {
    const replayedConflict = findingReplay.ok ? null : literalConflict(findingReplay.error);
    if (
      replayedConflict === null ||
      catalogReplay.ok ||
      catalogReplay.error.code !== 'SHARED_FINDING_COMPILATION_FAILED' ||
      catalogReplay.error.inputFingerprint !== artifact.catalogCompileInputFingerprint ||
      replayedConflict.inputFingerprint !== artifact.sharedFindingInputFingerprint ||
      !sameCanonicalValue(replayedConflict, artifact.sharedFindingConflict)
    ) {
      return {
        ok: false,
        error: {
          code: 'COMPILER_CONTEXT_MISMATCH',
          message:
            'The retained D-193/D-194 request does not reproduce the exact literal hard-finding conflict.',
        },
      };
    }
  }

  const expectedPayloadFingerprint = fingerprint('output', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `finding-pipeline-audit.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen finding-pipeline audit payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyFindingPipelineAuditContext = (input: {
  readonly artifact: unknown;
  readonly request: unknown;
}): FindingPipelineAuditContextResult => {
  const integrity = verifyFindingPipelineAuditIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = composeFindingPipelineAudit(input.request);
  if (!expected.ok) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: `${expected.error.code}: ${expected.error.message}`,
      },
    };
  }
  if (!sameCanonicalValue(integrity.value, expected.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message:
          'The finding-pipeline artifact does not match deterministic composition from the exact request.',
      },
    };
  }
  return { ok: true, value: integrity.value };
};
