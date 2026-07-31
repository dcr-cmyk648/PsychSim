import {
  OptionalReactionHistoryBridgeArtifactSchema,
  OptionalReactionHistoryBridgeRequestSchema,
  type ClinicalRuleReview,
  type OptionalReactionHistoryBridgeArtifact,
  type OptionalReactionHistoryBridgeFingerprint,
  type OptionalReactionHistoryBridgeProfile,
  type OptionalReactionHistoryBridgeRequest,
  type OptionalReactionHistoryCandidateEvaluation,
  type OptionalReactionHistoryMapping,
  type OptionalReactionHistoryReferenceHorizon,
  type PatientReactionHistory,
} from '@psychsim/schemas';

import { verifyOptionalFeatureBudgetSelectionIntegrity } from './optional-feature-budget-selector';

export const OPTIONAL_REACTION_HISTORY_BRIDGE_VERSION = '1.0.0';

export type OptionalReactionHistoryBridgeErrorCode =
  | 'INVALID_REQUEST'
  | 'OPTIONAL_FEATURE_ARTIFACT_INVALID'
  | 'REFERENCE_HORIZON_FINGERPRINT_MISMATCH'
  | 'INVALID_OUTPUT';

export interface OptionalReactionHistoryBridgeError {
  readonly code: OptionalReactionHistoryBridgeErrorCode;
  readonly message: string;
  readonly contentIds: readonly string[];
}

export type OptionalReactionHistoryBridgeResult =
  | { readonly ok: true; readonly value: OptionalReactionHistoryBridgeArtifact }
  | { readonly ok: false; readonly error: OptionalReactionHistoryBridgeError };

export type OptionalReactionHistoryBridgeIntegrityResult =
  | { readonly ok: true; readonly value: OptionalReactionHistoryBridgeArtifact }
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

export type OptionalReactionHistoryBridgeContextResult =
  | { readonly ok: true; readonly value: OptionalReactionHistoryBridgeArtifact }
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

const fingerprint = (scope: string, value: unknown): OptionalReactionHistoryBridgeFingerprint =>
  `fingerprint.optional-reaction-history-bridge.${scope}.fnv1a64.${hashToHex64(
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

const normalizeReactionHistory = (history: PatientReactionHistory): PatientReactionHistory => ({
  ...history,
  records: [...history.records]
    .map((record) => ({
      ...record,
      trigger: { ...record.trigger },
      manifestationIds: [...record.manifestationIds].sort(compareStrings),
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
});

const normalizeMapping = (
  mapping: OptionalReactionHistoryMapping,
): OptionalReactionHistoryMapping => ({
  ...mapping,
  moduleRef: { ...mapping.moduleRef },
  reactionHistory: normalizeReactionHistory(mapping.reactionHistory),
  review: normalizeReview(mapping.review),
});

const normalizeReferenceHorizon = (
  horizon: OptionalReactionHistoryReferenceHorizon,
): OptionalReactionHistoryReferenceHorizon => {
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
    nonMedicationTriggerRefs: sortReferences(horizon.nonMedicationTriggerRefs),
    manifestationRefs: sortReferences(horizon.manifestationRefs),
  };
};

const normalizeProfile = (
  profile: OptionalReactionHistoryBridgeProfile,
): OptionalReactionHistoryBridgeProfile => ({
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
  request: OptionalReactionHistoryBridgeRequest,
): OptionalReactionHistoryBridgeRequest => ({
  ...request,
  optionalFeatureArtifact: request.optionalFeatureArtifact,
  referenceHorizon: normalizeReferenceHorizon(request.referenceHorizon),
  bridgeProfile: normalizeProfile(request.bridgeProfile),
});

export const fingerprintOptionalReactionHistoryReferenceHorizon = (
  horizon: OptionalReactionHistoryReferenceHorizon,
): OptionalReactionHistoryBridgeFingerprint =>
  fingerprint('reference-horizon', normalizeReferenceHorizon(horizon));

export const fingerprintOptionalReactionHistoryBridgeProfile = (
  profile: OptionalReactionHistoryBridgeProfile,
): OptionalReactionHistoryBridgeFingerprint => fingerprint('profile', normalizeProfile(profile));

const validateRequest = (
  request: OptionalReactionHistoryBridgeRequest,
):
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly code: Exclude<
        OptionalReactionHistoryBridgeErrorCode,
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
  const expectedHorizonFingerprint = fingerprintOptionalReactionHistoryReferenceHorizon(
    request.referenceHorizon,
  );
  if (request.bridgeProfile.referenceHorizonFingerprint !== expectedHorizonFingerprint) {
    return {
      ok: false,
      code: 'REFERENCE_HORIZON_FINGERPRINT_MISMATCH',
      message:
        'The optional reaction-history bridge profile does not pin its exact normalized reference horizon.',
      contentIds: [request.referenceHorizon.id, request.bridgeProfile.id],
    };
  }
  return { ok: true };
};

const artifactPayload = (
  artifact: Omit<OptionalReactionHistoryBridgeArtifact, 'id' | 'payloadFingerprint'>,
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
  selectedReactionModuleDefinitionId: artifact.selectedReactionModuleDefinitionId,
  selectedMappingId: artifact.selectedMappingId,
  selectedOptionalFeatureBindingId: artifact.selectedOptionalFeatureBindingId,
  selectedModuleId: artifact.selectedModuleId,
  optionalFeatureSelectionOrdinal: artifact.optionalFeatureSelectionOrdinal,
  optionalFeatureStableDrawId: artifact.optionalFeatureStableDrawId,
  materializedReactionHistory: artifact.materializedReactionHistory,
  materializedReactionRecordIds: artifact.materializedReactionRecordIds,
  bridgeRequest: artifact.bridgeRequest,
  inputFingerprint: artifact.inputFingerprint,
});

const buildArtifact = (
  request: OptionalReactionHistoryBridgeRequest,
): OptionalReactionHistoryBridgeArtifact => {
  const selectedByModuleId = new Map(
    request.optionalFeatureArtifact.candidateEvaluations
      .filter((evaluation) => evaluation.disposition === 'selected')
      .map((evaluation) => [evaluation.moduleRef.id, evaluation]),
  );
  const candidateEvaluations: OptionalReactionHistoryCandidateEvaluation[] =
    request.bridgeProfile.mappings.map((mapping) => {
      const selected = selectedByModuleId.get(mapping.moduleRef.id);
      return {
        mappingId: mapping.id,
        moduleRef: mapping.moduleRef,
        moduleFingerprint: mapping.moduleFingerprint,
        optionalFeatureBindingId: mapping.optionalFeatureBindingId,
        selectedModuleId: mapping.selectedModuleId,
        reactionRecordIds: mapping.reactionHistory.records.map((record) => record.id),
        disposition: selected ? 'selected_by_optional_feature' : 'not_selected',
        optionalFeatureSelectionOrdinal: selected?.selectionOrdinal ?? null,
        optionalFeatureStableDrawId: selected?.stableDrawId ?? null,
      };
    });
  const selectedEvaluation =
    candidateEvaluations.find(
      (evaluation) => evaluation.disposition === 'selected_by_optional_feature',
    ) ?? null;
  const selectedMapping = selectedEvaluation
    ? request.bridgeProfile.mappings.find((mapping) => mapping.id === selectedEvaluation.mappingId)!
    : null;
  const inputFingerprint = fingerprint('input', request);
  const bridgeProfileFingerprint = fingerprintOptionalReactionHistoryBridgeProfile(
    request.bridgeProfile,
  );
  const referenceHorizonFingerprint = fingerprintOptionalReactionHistoryReferenceHorizon(
    request.referenceHorizon,
  );
  const withoutIdentity = {
    schemaVersion: 1 as const,
    resolverVersion: OPTIONAL_REACTION_HISTORY_BRIDGE_VERSION,
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
    selectedReactionModuleDefinitionId: selectedEvaluation?.moduleRef.id ?? null,
    selectedMappingId: selectedEvaluation?.mappingId ?? null,
    selectedOptionalFeatureBindingId: selectedEvaluation?.optionalFeatureBindingId ?? null,
    selectedModuleId: selectedEvaluation?.selectedModuleId ?? null,
    optionalFeatureSelectionOrdinal: selectedEvaluation?.optionalFeatureSelectionOrdinal ?? null,
    optionalFeatureStableDrawId: selectedEvaluation?.optionalFeatureStableDrawId ?? null,
    materializedReactionHistory: selectedMapping?.reactionHistory ?? null,
    materializedReactionRecordIds: selectedEvaluation?.reactionRecordIds ?? [],
    bridgeRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
  return OptionalReactionHistoryBridgeArtifactSchema.parse({
    ...withoutIdentity,
    id: `optional-reaction-history-bridge.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
};

export const bridgeOptionalReactionHistoryFromBudget = (
  input: unknown,
): OptionalReactionHistoryBridgeResult => {
  const parsed = OptionalReactionHistoryBridgeRequestSchema.safeParse(input);
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

export const verifyOptionalReactionHistoryBridgeIntegrity = (
  input: unknown,
): OptionalReactionHistoryBridgeIntegrityResult => {
  const parsed = OptionalReactionHistoryBridgeArtifactSchema.safeParse(input);
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
  if (artifact.resolverVersion !== OPTIONAL_REACTION_HISTORY_BRIDGE_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_RESOLVER_VERSION',
        message: `${artifact.id} uses unsupported optional reaction-history bridge ${artifact.resolverVersion}.`,
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
    artifact.id !== `optional-reaction-history-bridge.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen reaction-history audit payload.`,
      },
    };
  }
  const replay = bridgeOptionalReactionHistoryFromBudget(artifact.bridgeRequest);
  if (!replay.ok || !sameCanonicalValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained bridge request does not reproduce the exact D-201-authorized reaction-history payload.',
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyOptionalReactionHistoryBridgeContext = (input: {
  readonly artifact: unknown;
  readonly request: unknown;
}): OptionalReactionHistoryBridgeContextResult => {
  const integrity = verifyOptionalReactionHistoryBridgeIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = bridgeOptionalReactionHistoryFromBudget(input.request);
  if (!expected.ok || !sameCanonicalValue(expected.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message:
          'The optional reaction-history artifact does not match this exact authoring request.',
      },
    };
  }
  return { ok: true, value: integrity.value };
};
