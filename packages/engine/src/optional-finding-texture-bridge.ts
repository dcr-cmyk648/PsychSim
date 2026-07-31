import {
  OptionalFindingTextureBridgeArtifactSchema,
  OptionalFindingTextureBridgeRequestSchema,
  type ClinicalRuleReview,
  type FindingDefinition,
  type FindingResolutionCandidate,
  type OptionalFindingTextureBridgeArtifact,
  type OptionalFindingTextureBridgeFingerprint,
  type OptionalFindingTextureBridgeProfile,
  type OptionalFindingTextureBridgeRequest,
  type OptionalFindingTextureCandidateEvaluation,
  type OptionalFindingTextureMapping,
  type OptionalFindingTextureReferenceHorizon,
} from '@psychsim/schemas';

import { verifyOptionalFeatureBudgetSelectionIntegrity } from './optional-feature-budget-selector';

export const OPTIONAL_FINDING_TEXTURE_BRIDGE_VERSION = '1.0.0';

export type OptionalFindingTextureBridgeErrorCode =
  | 'INVALID_REQUEST'
  | 'OPTIONAL_FEATURE_ARTIFACT_INVALID'
  | 'REFERENCE_HORIZON_FINGERPRINT_MISMATCH'
  | 'INVALID_OUTPUT';

export interface OptionalFindingTextureBridgeError {
  readonly code: OptionalFindingTextureBridgeErrorCode;
  readonly message: string;
  readonly contentIds: readonly string[];
}

export type OptionalFindingTextureBridgeResult =
  | { readonly ok: true; readonly value: OptionalFindingTextureBridgeArtifact }
  | { readonly ok: false; readonly error: OptionalFindingTextureBridgeError };

export type OptionalFindingTextureBridgeIntegrityResult =
  | { readonly ok: true; readonly value: OptionalFindingTextureBridgeArtifact }
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

export type OptionalFindingTextureBridgeContextResult =
  | { readonly ok: true; readonly value: OptionalFindingTextureBridgeArtifact }
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

const fingerprint = (scope: string, value: unknown): OptionalFindingTextureBridgeFingerprint =>
  `fingerprint.optional-finding-texture-bridge.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameCanonicalValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalizeObjectKeys(value)))}`;

const normalizeReview = (review: ClinicalRuleReview): ClinicalRuleReview => ({
  ...review,
  sourceUseNoteIds: [...review.sourceUseNoteIds].sort(compareStrings),
});

const normalizeMapping = (
  mapping: OptionalFindingTextureMapping,
): OptionalFindingTextureMapping => ({
  ...mapping,
  moduleRef: { ...mapping.moduleRef },
  outcomes: [...mapping.outcomes]
    .map((outcome) => ({
      ...outcome,
      developerOpinionIds: [...outcome.developerOpinionIds].sort(compareStrings),
      review: normalizeReview(outcome.review),
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
});

const normalizeReferenceHorizon = (
  horizon: OptionalFindingTextureReferenceHorizon,
): OptionalFindingTextureReferenceHorizon => ({
  ...horizon,
  findingDefinitionRefs: [...horizon.findingDefinitionRefs].sort((left, right) =>
    compareStrings(left.id, right.id),
  ),
});

const normalizeProfile = (
  profile: OptionalFindingTextureBridgeProfile,
): OptionalFindingTextureBridgeProfile => ({
  ...profile,
  templateRef: { ...profile.templateRef },
  optionalFeatureProfileRef: { ...profile.optionalFeatureProfileRef },
  referenceHorizonRef: { ...profile.referenceHorizonRef },
  mappings: [...profile.mappings]
    .map(normalizeMapping)
    .sort((left, right) => compareStrings(left.id, right.id)),
  review: normalizeReview(profile.review),
});

const normalizeFindingDefinition = (definition: FindingDefinition): FindingDefinition => ({
  ...definition,
  aliases: [...definition.aliases].sort(compareStrings),
  allowedPresentationProjections: [...definition.allowedPresentationProjections].sort(
    compareStrings,
  ),
});

const normalizeRequest = (
  request: OptionalFindingTextureBridgeRequest,
): OptionalFindingTextureBridgeRequest => ({
  ...request,
  optionalFeatureArtifact: request.optionalFeatureArtifact,
  referenceHorizon: normalizeReferenceHorizon(request.referenceHorizon),
  findingDefinitions: [...request.findingDefinitions]
    .map(normalizeFindingDefinition)
    .sort((left, right) => compareStrings(left.id, right.id)),
  bridgeProfile: normalizeProfile(request.bridgeProfile),
});

export const fingerprintOptionalFindingTextureReferenceHorizon = (
  horizon: OptionalFindingTextureReferenceHorizon,
): OptionalFindingTextureBridgeFingerprint =>
  fingerprint('reference-horizon', normalizeReferenceHorizon(horizon));

export const fingerprintOptionalFindingTextureBridgeProfile = (
  profile: OptionalFindingTextureBridgeProfile,
): OptionalFindingTextureBridgeFingerprint => fingerprint('profile', normalizeProfile(profile));

const validateRequest = (
  request: OptionalFindingTextureBridgeRequest,
):
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly code: Exclude<
        OptionalFindingTextureBridgeErrorCode,
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
  const expectedHorizonFingerprint = fingerprintOptionalFindingTextureReferenceHorizon(
    request.referenceHorizon,
  );
  if (request.bridgeProfile.referenceHorizonFingerprint !== expectedHorizonFingerprint) {
    return {
      ok: false,
      code: 'REFERENCE_HORIZON_FINGERPRINT_MISMATCH',
      message:
        'The optional finding-texture bridge profile does not pin its exact normalized finding horizon.',
      contentIds: [request.referenceHorizon.id, request.bridgeProfile.id],
    };
  }
  return { ok: true };
};

const artifactPayload = (
  artifact: Omit<OptionalFindingTextureBridgeArtifact, 'id' | 'payloadFingerprint'>,
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
  optionalFeatureSelectedCount: artifact.optionalFeatureSelectedCount,
  optionalFeatureTotalSpent: artifact.optionalFeatureTotalSpent,
  optionalFeatureRemainingBudget: artifact.optionalFeatureRemainingBudget,
  candidateEvaluations: artifact.candidateEvaluations,
  selectedTextureModuleDefinitionIds: artifact.selectedTextureModuleDefinitionIds,
  selectedMappingIds: artifact.selectedMappingIds,
  selectedOptionalFeatureBindingIds: artifact.selectedOptionalFeatureBindingIds,
  selectedModuleIds: artifact.selectedModuleIds,
  replacedBackgroundFindingDefinitionIds: artifact.replacedBackgroundFindingDefinitionIds,
  candidates: artifact.candidates,
  bridgeRequest: artifact.bridgeRequest,
  inputFingerprint: artifact.inputFingerprint,
});

const buildArtifact = (
  request: OptionalFindingTextureBridgeRequest,
): OptionalFindingTextureBridgeArtifact => {
  const selectedByModuleId = new Map(
    request.optionalFeatureArtifact.candidateEvaluations
      .filter((evaluation) => evaluation.disposition === 'selected')
      .map((evaluation) => [evaluation.moduleRef.id, evaluation]),
  );
  const candidates: FindingResolutionCandidate[] = [];
  const candidateEvaluations: OptionalFindingTextureCandidateEvaluation[] =
    request.bridgeProfile.mappings.map((mapping) => {
      const selected = selectedByModuleId.get(mapping.moduleRef.id);
      const outcomeEvaluations = mapping.outcomes.map((outcome) => {
        if (!selected || selected.selectionOrdinal === null || selected.stableDrawId === null) {
          return {
            outcomeId: outcome.id,
            findingDefinitionId: outcome.findingDefinitionId,
            findingDefinitionContentVersion: outcome.findingDefinitionContentVersion,
            proposedValue: { ...outcome.proposedValue },
            candidateId: null,
          };
        }
        const identityPayload = {
          requestId: request.id,
          profileId: request.bridgeProfile.id,
          profileContentVersion: request.bridgeProfile.contentVersion,
          mappingId: mapping.id,
          outcomeId: outcome.id,
          moduleDefinitionId: mapping.moduleRef.id,
          selectedModuleId: mapping.selectedModuleId,
          optionalFeatureStableDrawId: selected.stableDrawId,
          findingDefinitionId: outcome.findingDefinitionId,
          findingDefinitionContentVersion: outcome.findingDefinitionContentVersion,
        };
        const contributionId = stableId('finding-contribution.optional-texture', identityPayload);
        const candidateId = stableId('finding-candidate.optional-texture', identityPayload);
        candidates.push({
          schemaVersion: 1,
          id: candidateId,
          findingDefinitionId: outcome.findingDefinitionId,
          findingDefinitionContentVersion: outcome.findingDefinitionContentVersion,
          kind: 'background_variation',
          proposedValue: { ...outcome.proposedValue },
          uncertainty: outcome.uncertainty,
          contributions: [
            {
              schemaVersion: 1,
              id: contributionId,
              ownerKind: 'generation_profile',
              ownerId: request.bridgeProfile.id,
              ownerContentVersion: request.bridgeProfile.contentVersion,
              role: 'generated_value',
              provenanceIds: uniqueSorted([
                ...outcome.developerOpinionIds,
                ...outcome.review.sourceUseNoteIds,
              ]),
            },
          ],
          resolution: {
            origin: 'deterministic_generation',
            generationProfileId: request.bridgeProfile.id,
            generationProfileContentVersion: request.bridgeProfile.contentVersion,
            resolverVersion: OPTIONAL_FINDING_TEXTURE_BRIDGE_VERSION,
            stableDrawId: selected.stableDrawId,
          },
          review: normalizeReview(outcome.review),
        });
        return {
          outcomeId: outcome.id,
          findingDefinitionId: outcome.findingDefinitionId,
          findingDefinitionContentVersion: outcome.findingDefinitionContentVersion,
          proposedValue: { ...outcome.proposedValue },
          candidateId,
        };
      });
      return {
        mappingId: mapping.id,
        moduleRef: { ...mapping.moduleRef },
        moduleFingerprint: mapping.moduleFingerprint,
        optionalFeatureBindingId: mapping.optionalFeatureBindingId,
        selectedModuleId: mapping.selectedModuleId,
        disposition: selected ? 'selected_by_optional_feature' : 'not_selected',
        optionalFeatureSelectionOrdinal: selected?.selectionOrdinal ?? null,
        optionalFeatureStableDrawId: selected?.stableDrawId ?? null,
        outcomeEvaluations,
      };
    });
  const selectedEvaluations = candidateEvaluations
    .filter((evaluation) => evaluation.disposition === 'selected_by_optional_feature')
    .sort(
      (left, right) =>
        left.optionalFeatureSelectionOrdinal! - right.optionalFeatureSelectionOrdinal!,
    );
  const normalizedCandidates = candidates.sort((left, right) => compareStrings(left.id, right.id));
  const inputFingerprint = fingerprint('input', request);
  const referenceHorizonFingerprint = fingerprintOptionalFindingTextureReferenceHorizon(
    request.referenceHorizon,
  );
  const bridgeProfileFingerprint = fingerprintOptionalFindingTextureBridgeProfile(
    request.bridgeProfile,
  );
  const withoutIdentity = {
    schemaVersion: 1 as const,
    resolverVersion: OPTIONAL_FINDING_TEXTURE_BRIDGE_VERSION,
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
    optionalFeatureSelectedCount: request.optionalFeatureArtifact.selectedCount,
    optionalFeatureTotalSpent: request.optionalFeatureArtifact.totalSpent,
    optionalFeatureRemainingBudget: request.optionalFeatureArtifact.remainingBudget,
    candidateEvaluations,
    selectedTextureModuleDefinitionIds: selectedEvaluations
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
    replacedBackgroundFindingDefinitionIds: normalizedCandidates
      .map((candidate) => candidate.findingDefinitionId)
      .sort(compareStrings),
    candidates: normalizedCandidates,
    bridgeRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
  return OptionalFindingTextureBridgeArtifactSchema.parse({
    ...withoutIdentity,
    id: `optional-finding-texture-bridge.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
};

export const bridgeOptionalFindingTextureFromBudget = (
  input: unknown,
): OptionalFindingTextureBridgeResult => {
  const parsed = OptionalFindingTextureBridgeRequestSchema.safeParse(input);
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

export const verifyOptionalFindingTextureBridgeIntegrity = (
  input: unknown,
): OptionalFindingTextureBridgeIntegrityResult => {
  const parsed = OptionalFindingTextureBridgeArtifactSchema.safeParse(input);
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
  if (artifact.resolverVersion !== OPTIONAL_FINDING_TEXTURE_BRIDGE_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_RESOLVER_VERSION',
        message: `${artifact.id} uses unsupported optional finding-texture bridge ${artifact.resolverVersion}.`,
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
    artifact.id !== `optional-finding-texture-bridge.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen optional finding-texture audit payload.`,
      },
    };
  }
  const replay = bridgeOptionalFindingTextureFromBudget(artifact.bridgeRequest);
  if (!replay.ok || !sameCanonicalValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained request does not reproduce the exact D-201-authorized optional finding texture.',
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyOptionalFindingTextureBridgeContext = (input: {
  readonly artifact: unknown;
  readonly request: unknown;
}): OptionalFindingTextureBridgeContextResult => {
  const integrity = verifyOptionalFindingTextureBridgeIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = bridgeOptionalFindingTextureFromBudget(input.request);
  if (!expected.ok || !sameCanonicalValue(expected.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message:
          'The optional finding-texture artifact does not match this exact authoring request.',
      },
    };
  }
  return { ok: true, value: integrity.value };
};
