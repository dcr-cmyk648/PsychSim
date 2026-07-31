import {
  OptionalPriorTreatmentBridgeArtifactSchema,
  OptionalPriorTreatmentBridgeRequestSchema,
  type ClinicalRuleReview,
  type OptionalPriorTreatmentBridgeArtifact,
  type OptionalPriorTreatmentBridgeFingerprint,
  type OptionalPriorTreatmentBridgeProfile,
  type OptionalPriorTreatmentBridgeRequest,
  type OptionalPriorTreatmentCandidateEvaluation,
  type OptionalPriorTreatmentContribution,
  type OptionalPriorTreatmentMapping,
  type OptionalPriorTreatmentReferenceHorizon,
  type PatientTreatmentHistory,
} from '@psychsim/schemas';

import { verifyOptionalFeatureBudgetSelectionIntegrity } from './optional-feature-budget-selector';

export const OPTIONAL_PRIOR_TREATMENT_BRIDGE_VERSION = '1.0.0';

export type OptionalPriorTreatmentBridgeErrorCode =
  | 'INVALID_REQUEST'
  | 'OPTIONAL_FEATURE_ARTIFACT_INVALID'
  | 'REFERENCE_HORIZON_FINGERPRINT_MISMATCH'
  | 'INVALID_OUTPUT';

export interface OptionalPriorTreatmentBridgeError {
  readonly code: OptionalPriorTreatmentBridgeErrorCode;
  readonly message: string;
  readonly contentIds: readonly string[];
}

export type OptionalPriorTreatmentBridgeResult =
  | { readonly ok: true; readonly value: OptionalPriorTreatmentBridgeArtifact }
  | { readonly ok: false; readonly error: OptionalPriorTreatmentBridgeError };

export type OptionalPriorTreatmentBridgeIntegrityResult =
  | { readonly ok: true; readonly value: OptionalPriorTreatmentBridgeArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_RESOLVER_VERSION'
          | 'UPSTREAM_INTEGRITY_MISMATCH'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH'
          | 'REPLAY_MISMATCH';
        readonly message: string;
      };
    };

export type OptionalPriorTreatmentBridgeContextResult =
  | { readonly ok: true; readonly value: OptionalPriorTreatmentBridgeArtifact }
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

const hashToHex64 = (value: string): string => {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, '0');
};

const fingerprint = (scope: string, value: unknown): OptionalPriorTreatmentBridgeFingerprint =>
  `fingerprint.optional-prior-treatment-bridge.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameCanonicalValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const normalizeReview = (review: ClinicalRuleReview): ClinicalRuleReview => ({
  ...review,
  sourceUseNoteIds: [...review.sourceUseNoteIds].sort(compareStrings),
});

const normalizeContribution = (
  contribution: OptionalPriorTreatmentContribution,
): OptionalPriorTreatmentContribution => ({
  medicationTrials: [...contribution.medicationTrials]
    .map((trial) => ({
      ...trial,
      exposure:
        trial.exposure === undefined
          ? undefined
          : {
              duration: trial.exposure.duration === null ? null : { ...trial.exposure.duration },
              maximumDose:
                trial.exposure.maximumDose === null ? null : { ...trial.exposure.maximumDose },
            },
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
  psychotherapyTrials: [...contribution.psychotherapyTrials]
    .map((trial) => ({ ...trial }))
    .sort((left, right) => compareStrings(left.id, right.id)),
  currentProviders: [...contribution.currentProviders]
    .map((provider) => ({ ...provider }))
    .sort((left, right) => compareStrings(left.id, right.id)),
  priorLevelsOfCare: [...contribution.priorLevelsOfCare]
    .map((level) => ({ ...level }))
    .sort((left, right) => compareStrings(left.id, right.id)),
});

const normalizeMapping = (
  mapping: OptionalPriorTreatmentMapping,
): OptionalPriorTreatmentMapping => ({
  ...mapping,
  moduleRef: { ...mapping.moduleRef },
  contribution: normalizeContribution(mapping.contribution),
  review: normalizeReview(mapping.review),
});

const normalizeReferenceHorizon = (
  horizon: OptionalPriorTreatmentReferenceHorizon,
): OptionalPriorTreatmentReferenceHorizon => {
  const sortReferences = <
    Reference extends { readonly id: string; readonly contentVersion: string },
  >(
    references: readonly Reference[],
  ): Reference[] =>
    [...references]
      .map((reference) => ({ ...reference }))
      .sort((left, right) =>
        compareStrings(
          `${left.id}\u0000${left.contentVersion}`,
          `${right.id}\u0000${right.contentVersion}`,
        ),
      );
  return {
    ...horizon,
    medicationRefs: sortReferences(horizon.medicationRefs),
    psychotherapyInterventionRefs: sortReferences(horizon.psychotherapyInterventionRefs),
  };
};

const normalizeProfile = (
  profile: OptionalPriorTreatmentBridgeProfile,
): OptionalPriorTreatmentBridgeProfile => ({
  ...profile,
  templateRef: { ...profile.templateRef },
  optionalFeatureProfileRef: { ...profile.optionalFeatureProfileRef },
  referenceHorizonRef: { ...profile.referenceHorizonRef },
  mappings: [...profile.mappings]
    .map(normalizeMapping)
    .sort((left, right) =>
      compareStrings(
        `${left.moduleRef.id}\u0000${left.id}`,
        `${right.moduleRef.id}\u0000${right.id}`,
      ),
    ),
  review: normalizeReview(profile.review),
});

const normalizeRequest = (
  request: OptionalPriorTreatmentBridgeRequest,
): OptionalPriorTreatmentBridgeRequest => ({
  ...request,
  optionalFeatureArtifact: request.optionalFeatureArtifact,
  referenceHorizon: normalizeReferenceHorizon(request.referenceHorizon),
  bridgeProfile: normalizeProfile(request.bridgeProfile),
});

export const fingerprintOptionalPriorTreatmentReferenceHorizon = (
  horizon: OptionalPriorTreatmentReferenceHorizon,
): OptionalPriorTreatmentBridgeFingerprint =>
  fingerprint('reference-horizon', normalizeReferenceHorizon(horizon));

export const fingerprintOptionalPriorTreatmentBridgeProfile = (
  profile: OptionalPriorTreatmentBridgeProfile,
): OptionalPriorTreatmentBridgeFingerprint => fingerprint('profile', normalizeProfile(profile));

const validateRequest = (
  request: OptionalPriorTreatmentBridgeRequest,
):
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly code: Exclude<
        OptionalPriorTreatmentBridgeErrorCode,
        'INVALID_REQUEST' | 'INVALID_OUTPUT'
      >;
      readonly message: string;
      readonly contentIds: readonly string[];
    } => {
  const optionalIntegrity = verifyOptionalFeatureBudgetSelectionIntegrity(
    request.optionalFeatureArtifact,
  );
  if (!optionalIntegrity.ok) {
    return {
      ok: false,
      code: 'OPTIONAL_FEATURE_ARTIFACT_INVALID',
      message: `${optionalIntegrity.error.code}: ${optionalIntegrity.error.message}`,
      contentIds: [request.optionalFeatureArtifact.id],
    };
  }
  const expectedHorizonFingerprint = fingerprintOptionalPriorTreatmentReferenceHorizon(
    request.referenceHorizon,
  );
  if (request.bridgeProfile.referenceHorizonFingerprint !== expectedHorizonFingerprint) {
    return {
      ok: false,
      code: 'REFERENCE_HORIZON_FINGERPRINT_MISMATCH',
      message:
        'The optional prior-treatment bridge profile does not pin its exact normalized reference horizon.',
      contentIds: [request.referenceHorizon.id, request.bridgeProfile.id],
    };
  }
  return { ok: true };
};

const artifactPayload = (
  artifact: Omit<OptionalPriorTreatmentBridgeArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  resolverVersion: artifact.resolverVersion,
  requestId: artifact.requestId,
  templateRef: artifact.templateRef,
  templateFingerprint: artifact.templateFingerprint,
  optionalFeatureArtifactRef: artifact.optionalFeatureArtifactRef,
  optionalFeatureProfileRef: artifact.optionalFeatureProfileRef,
  optionalFeatureProfileFingerprint: artifact.optionalFeatureProfileFingerprint,
  referenceHorizonRef: artifact.referenceHorizonRef,
  referenceHorizonFingerprint: artifact.referenceHorizonFingerprint,
  bridgeProfileRef: artifact.bridgeProfileRef,
  bridgeProfileFingerprint: artifact.bridgeProfileFingerprint,
  candidateEvaluations: artifact.candidateEvaluations,
  selectedPriorTreatmentModuleDefinitionIds: artifact.selectedPriorTreatmentModuleDefinitionIds,
  selectedMappingIds: artifact.selectedMappingIds,
  selectedOptionalFeatureBindingIds: artifact.selectedOptionalFeatureBindingIds,
  selectedModuleIds: artifact.selectedModuleIds,
  materializedTreatmentHistoryContribution: artifact.materializedTreatmentHistoryContribution,
  materializedRecordIds: artifact.materializedRecordIds,
  bridgeRequest: artifact.bridgeRequest,
  inputFingerprint: artifact.inputFingerprint,
});

const buildArtifact = (
  request: OptionalPriorTreatmentBridgeRequest,
): OptionalPriorTreatmentBridgeArtifact => {
  const selectedByModuleId = new Map(
    request.optionalFeatureArtifact.candidateEvaluations
      .filter((evaluation) => evaluation.disposition === 'selected')
      .map((evaluation) => [evaluation.moduleRef.id, evaluation]),
  );
  const candidateEvaluations: OptionalPriorTreatmentCandidateEvaluation[] =
    request.bridgeProfile.mappings.map((mapping) => {
      const selected = selectedByModuleId.get(mapping.moduleRef.id);
      return {
        mappingId: mapping.id,
        moduleRef: mapping.moduleRef,
        moduleFingerprint: mapping.moduleFingerprint,
        optionalFeatureBindingId: mapping.optionalFeatureBindingId,
        selectedModuleId: mapping.selectedModuleId,
        medicationTrialIds: mapping.contribution.medicationTrials.map((record) => record.id),
        psychotherapyTrialIds: mapping.contribution.psychotherapyTrials.map((record) => record.id),
        currentProviderIds: mapping.contribution.currentProviders.map((record) => record.id),
        priorLevelOfCareIds: mapping.contribution.priorLevelsOfCare.map((record) => record.id),
        disposition: selected ? 'selected_by_optional_feature' : 'not_selected',
        optionalFeatureSelectionOrdinal: selected?.selectionOrdinal ?? null,
        optionalFeatureStableDrawId: selected?.stableDrawId ?? null,
      };
    });
  const selectedEvaluations = candidateEvaluations
    .filter((evaluation) => evaluation.disposition === 'selected_by_optional_feature')
    .sort(
      (left, right) =>
        left.optionalFeatureSelectionOrdinal! - right.optionalFeatureSelectionOrdinal!,
    );
  const mappingById = new Map(
    request.bridgeProfile.mappings.map((mapping) => [mapping.id, mapping]),
  );
  const selectedMappings = selectedEvaluations.map(
    (evaluation) => mappingById.get(evaluation.mappingId)!,
  );
  const aggregate: PatientTreatmentHistory | null =
    selectedMappings.length === 0
      ? null
      : {
          medicationTrials: selectedMappings
            .flatMap((mapping) => mapping.contribution.medicationTrials)
            .sort((left, right) => compareStrings(left.id, right.id)),
          psychotherapyTrials: selectedMappings
            .flatMap((mapping) => mapping.contribution.psychotherapyTrials)
            .sort((left, right) => compareStrings(left.id, right.id)),
          currentProviders: selectedMappings
            .flatMap((mapping) => mapping.contribution.currentProviders)
            .sort((left, right) => compareStrings(left.id, right.id)),
          priorLevelsOfCare: selectedMappings
            .flatMap((mapping) => mapping.contribution.priorLevelsOfCare)
            .sort((left, right) => compareStrings(left.id, right.id)),
        };
  const materializedRecordIds = {
    medicationTrialIds: aggregate?.medicationTrials.map((record) => record.id) ?? [],
    psychotherapyTrialIds: aggregate?.psychotherapyTrials.map((record) => record.id) ?? [],
    currentProviderIds: aggregate?.currentProviders.map((record) => record.id) ?? [],
    priorLevelOfCareIds: aggregate?.priorLevelsOfCare.map((record) => record.id) ?? [],
  };
  const inputFingerprint = fingerprint('input', request);
  const referenceHorizonFingerprint = fingerprintOptionalPriorTreatmentReferenceHorizon(
    request.referenceHorizon,
  );
  const bridgeProfileFingerprint = fingerprintOptionalPriorTreatmentBridgeProfile(
    request.bridgeProfile,
  );
  const withoutIdentity = {
    schemaVersion: 1 as const,
    resolverVersion: OPTIONAL_PRIOR_TREATMENT_BRIDGE_VERSION,
    requestId: request.id,
    templateRef: request.optionalFeatureArtifact.templateRef,
    templateFingerprint: request.optionalFeatureArtifact.templateFingerprint,
    optionalFeatureArtifactRef: {
      id: request.optionalFeatureArtifact.id,
      inputFingerprint: request.optionalFeatureArtifact.inputFingerprint,
      payloadFingerprint: request.optionalFeatureArtifact.payloadFingerprint,
    },
    optionalFeatureProfileRef: request.optionalFeatureArtifact.profileRef,
    optionalFeatureProfileFingerprint: request.optionalFeatureArtifact.profileFingerprint,
    referenceHorizonRef: {
      id: request.referenceHorizon.id,
      contentVersion: request.referenceHorizon.contentVersion,
    },
    referenceHorizonFingerprint,
    bridgeProfileRef: {
      id: request.bridgeProfile.id,
      contentVersion: request.bridgeProfile.contentVersion,
    },
    bridgeProfileFingerprint,
    candidateEvaluations,
    selectedPriorTreatmentModuleDefinitionIds: selectedEvaluations
      .map((evaluation) => evaluation.moduleRef.id)
      .sort(compareStrings),
    selectedMappingIds: selectedEvaluations
      .map((evaluation) => evaluation.mappingId)
      .sort(compareStrings),
    selectedOptionalFeatureBindingIds: selectedEvaluations
      .map((evaluation) => evaluation.optionalFeatureBindingId)
      .sort(compareStrings),
    selectedModuleIds: selectedEvaluations
      .map((evaluation) => evaluation.selectedModuleId)
      .sort(compareStrings),
    materializedTreatmentHistoryContribution: aggregate,
    materializedRecordIds,
    bridgeRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
  return OptionalPriorTreatmentBridgeArtifactSchema.parse({
    ...withoutIdentity,
    id: `optional-prior-treatment-bridge.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
};

export const bridgeOptionalPriorTreatmentHistoryFromBudget = (
  input: unknown,
): OptionalPriorTreatmentBridgeResult => {
  const parsed = OptionalPriorTreatmentBridgeRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: issuesText(parsed.error.issues),
        contentIds: [],
      },
    };
  }
  const request = normalizeRequest(parsed.data);
  const validation = validateRequest(request);
  if (!validation.ok) {
    return {
      ok: false,
      error: {
        code: validation.code,
        message: validation.message,
        contentIds: uniqueSorted(validation.contentIds),
      },
    };
  }
  try {
    return { ok: true, value: buildArtifact(request) };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: error instanceof Error ? error.message : String(error),
        contentIds: [request.id],
      },
    };
  }
};

export const verifyOptionalPriorTreatmentBridgeIntegrity = (
  input: unknown,
): OptionalPriorTreatmentBridgeIntegrityResult => {
  const parsed = OptionalPriorTreatmentBridgeArtifactSchema.safeParse(input);
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
  if (artifact.resolverVersion !== OPTIONAL_PRIOR_TREATMENT_BRIDGE_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_RESOLVER_VERSION',
        message: `${artifact.id} uses unsupported optional prior-treatment bridge ${artifact.resolverVersion}.`,
      },
    };
  }
  const upstreamIntegrity = verifyOptionalFeatureBudgetSelectionIntegrity(
    artifact.bridgeRequest.optionalFeatureArtifact,
  );
  if (!upstreamIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_INTEGRITY_MISMATCH',
        message: `${upstreamIntegrity.error.code}: ${upstreamIntegrity.error.message}`,
      },
    };
  }
  const expectedInputFingerprint = fingerprint('input', artifact.bridgeRequest);
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact normalized bridge request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('output', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `optional-prior-treatment-bridge.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen prior-treatment audit payload.`,
      },
    };
  }
  const replay = bridgeOptionalPriorTreatmentHistoryFromBudget(artifact.bridgeRequest);
  if (!replay.ok || !sameCanonicalValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained request does not reproduce the exact D-201-authorized prior-treatment contribution.',
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyOptionalPriorTreatmentBridgeContext = (input: {
  readonly artifact: unknown;
  readonly request: unknown;
}): OptionalPriorTreatmentBridgeContextResult => {
  const integrity = verifyOptionalPriorTreatmentBridgeIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = bridgeOptionalPriorTreatmentHistoryFromBudget(input.request);
  if (!expected.ok || !sameCanonicalValue(expected.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message:
          'The optional prior-treatment artifact does not match this exact authoring request.',
      },
    };
  }
  return { ok: true, value: integrity.value };
};
