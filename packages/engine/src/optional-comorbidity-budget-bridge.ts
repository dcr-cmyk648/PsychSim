import {
  OptionalComorbidityBridgeArtifactSchema,
  OptionalComorbidityBridgeRequestSchema,
  type ConditionState,
  type OptionalComorbidityBridgeArtifact,
  type OptionalComorbidityBridgeCandidateEvaluation,
  type OptionalComorbidityBridgeFingerprint,
  type OptionalComorbidityBridgeGroupAudit,
  type OptionalComorbidityBridgeProfile,
  type OptionalComorbidityBridgeRequest,
  type OptionalComorbidityConditionMapping,
  type PatientTemplateConditionConstraint,
  type ResolvedTemplateConditionBinding,
} from '@psychsim/schemas';

import {
  fingerprintTemplateConditionSelectionProfile,
  fingerprintTemplateConditionSelectionTemplate,
  normalizeTemplateConditionSelectionRequest,
} from './template-condition-selector';
import { verifyOptionalFeatureBudgetSelectionIntegrity } from './optional-feature-budget-selector';

export const OPTIONAL_COMORBIDITY_BUDGET_BRIDGE_VERSION = '1.0.0';

export type OptionalComorbidityBridgeErrorCode =
  | 'INVALID_REQUEST'
  | 'OPTIONAL_FEATURE_ARTIFACT_INVALID'
  | 'TEMPLATE_MISMATCH'
  | 'PROFILE_FINGERPRINT_MISMATCH'
  | 'GROUP_CAPACITY_EXCEEDED'
  | 'INVALID_OUTPUT';

export interface OptionalComorbidityBridgeError {
  readonly code: OptionalComorbidityBridgeErrorCode;
  readonly message: string;
  readonly contentIds: readonly string[];
}

export type OptionalComorbidityBridgeResult =
  | {
      readonly ok: true;
      readonly value: OptionalComorbidityBridgeArtifact & {
        readonly status: 'selected';
      };
    }
  | {
      readonly ok: false;
      readonly conflict: {
        readonly code: 'LITERAL_CONDITION_INCOMPATIBILITY';
        readonly disposition: 'retry_or_quarantine';
        readonly artifact: OptionalComorbidityBridgeArtifact & {
          readonly status: 'literal_condition_incompatibility';
        };
      };
    }
  | { readonly ok: false; readonly error: OptionalComorbidityBridgeError };

export type OptionalComorbidityBridgeIntegrityResult =
  | { readonly ok: true; readonly value: OptionalComorbidityBridgeArtifact }
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

export type OptionalComorbidityBridgeContextResult =
  | { readonly ok: true; readonly value: OptionalComorbidityBridgeArtifact }
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

const fingerprint = (scope: string, value: unknown): OptionalComorbidityBridgeFingerprint =>
  `fingerprint.optional-comorbidity-bridge.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalizeObjectKeys(value)))}`;

const sameCanonicalValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const normalizeReview = <Review extends { readonly sourceUseNoteIds: readonly string[] }>(
  review: Review,
): Review => ({
  ...review,
  sourceUseNoteIds: uniqueSorted(review.sourceUseNoteIds),
});

const normalizeMapping = (
  mapping: OptionalComorbidityConditionMapping,
): OptionalComorbidityConditionMapping => ({
  ...mapping,
  review: normalizeReview(mapping.review),
});

const normalizeProfile = (
  profile: OptionalComorbidityBridgeProfile,
): OptionalComorbidityBridgeProfile => ({
  ...profile,
  mappings: [...profile.mappings]
    .map(normalizeMapping)
    .sort((left, right) => compareStrings(left.moduleRef.id, right.moduleRef.id)),
  review: normalizeReview(profile.review),
});

const normalizeRequest = (
  request: OptionalComorbidityBridgeRequest,
): OptionalComorbidityBridgeRequest => ({
  ...request,
  conditionSelectionRequest: normalizeTemplateConditionSelectionRequest(
    request.conditionSelectionRequest,
  ),
  bridgeProfile: normalizeProfile(request.bridgeProfile),
});

export const fingerprintOptionalComorbidityBridgeProfile = (
  profile: OptionalComorbidityBridgeProfile,
): OptionalComorbidityBridgeFingerprint => fingerprint('profile', normalizeProfile(profile));

const materializeRequiredCondition = (
  request: OptionalComorbidityBridgeRequest,
  constraint: PatientTemplateConditionConstraint,
): ConditionState => {
  const template = request.conditionSelectionRequest.template;
  const resolution = {
    origin: 'authored' as const,
    ownerId: template.id,
    ownerContentVersion: template.contentVersion,
  };
  return {
    schemaVersion: 1,
    id: stableId('condition-state', {
      templateRef: { id: template.id, contentVersion: template.contentVersion },
      templateConditionId: constraint.id,
      resolution,
    }),
    diagnosisDefinitionId: constraint.diagnosisDefinitionId,
    diagnosisDefinitionContentVersion: constraint.diagnosisDefinitionContentVersion,
    clinicalStateId: constraint.clinicalStateId,
    timeScopeId: constraint.timeScopeId,
    encounterRelevance: constraint.encounterRelevance,
    severityId: constraint.severityId,
    specifierIds: [...constraint.specifierIds],
    origin: 'authored',
    resolution,
  };
};

const materializeOptionalCondition = (
  request: OptionalComorbidityBridgeRequest,
  constraint: PatientTemplateConditionConstraint,
  optionalFeatureStableDrawId: string,
): ConditionState => {
  const profile = request.bridgeProfile;
  const template = request.conditionSelectionRequest.template;
  const resolution = {
    origin: 'deterministic_generation' as const,
    generationProfileId: profile.id,
    generationProfileContentVersion: profile.contentVersion,
    resolverVersion: OPTIONAL_COMORBIDITY_BUDGET_BRIDGE_VERSION,
    stableDrawId: optionalFeatureStableDrawId,
  };
  return {
    schemaVersion: 1,
    id: stableId('condition-state', {
      templateRef: { id: template.id, contentVersion: template.contentVersion },
      templateConditionId: constraint.id,
      resolution,
    }),
    diagnosisDefinitionId: constraint.diagnosisDefinitionId,
    diagnosisDefinitionContentVersion: constraint.diagnosisDefinitionContentVersion,
    clinicalStateId: constraint.clinicalStateId,
    timeScopeId: constraint.timeScopeId,
    encounterRelevance: constraint.encounterRelevance,
    severityId: constraint.severityId,
    specifierIds: [...constraint.specifierIds],
    origin: 'generated_optional',
    resolution,
  };
};

const requiredBinding = (
  constraint: PatientTemplateConditionConstraint,
  condition: ConditionState,
): ResolvedTemplateConditionBinding => ({
  schemaVersion: 1,
  id: stableId('condition-binding', {
    kind: 'required',
    templateConditionId: constraint.id,
    conditionStateId: condition.id,
  }),
  kind: 'required',
  templateConditionId: constraint.id,
  conditionStateId: condition.id,
});

const optionalBinding = (
  groupId: string,
  constraint: PatientTemplateConditionConstraint,
  condition: ConditionState,
): ResolvedTemplateConditionBinding => ({
  schemaVersion: 1,
  id: stableId('condition-binding', {
    kind: 'optional_group',
    groupId,
    templateConditionId: constraint.id,
    conditionStateId: condition.id,
  }),
  kind: 'optional_group',
  groupId,
  templateConditionId: constraint.id,
  conditionStateId: condition.id,
});

const validateRequest = (
  request: OptionalComorbidityBridgeRequest,
):
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly code: Exclude<
        OptionalComorbidityBridgeErrorCode,
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
  const optionalTemplate = request.optionalFeatureArtifact.selectionRequest.template;
  const conditionTemplate = request.conditionSelectionRequest.template;
  const optionalTemplateFingerprint =
    fingerprintTemplateConditionSelectionTemplate(optionalTemplate);
  const conditionTemplateFingerprint =
    fingerprintTemplateConditionSelectionTemplate(conditionTemplate);
  if (
    !sameCanonicalValue(optionalTemplate, conditionTemplate) ||
    optionalTemplateFingerprint !== conditionTemplateFingerprint ||
    request.bridgeProfile.templateFingerprint !== conditionTemplateFingerprint
  ) {
    return {
      ok: false,
      code: 'TEMPLATE_MISMATCH',
      message:
        'The D-201 artifact, D-196 request, and bridge profile must retain one exact normalized patient template.',
      contentIds: uniqueSorted([optionalTemplate.id, conditionTemplate.id]),
    };
  }
  const expectedOptionalProfileFingerprint = request.optionalFeatureArtifact.profileFingerprint;
  const expectedConditionProfileFingerprint = fingerprintTemplateConditionSelectionProfile(
    request.conditionSelectionRequest.profile,
  );
  if (
    request.bridgeProfile.optionalFeatureProfileFingerprint !==
      expectedOptionalProfileFingerprint ||
    request.bridgeProfile.conditionProfileFingerprint !== expectedConditionProfileFingerprint ||
    request.conditionSelectionRequest.profile.templateFingerprint !== conditionTemplateFingerprint
  ) {
    return {
      ok: false,
      code: 'PROFILE_FINGERPRINT_MISMATCH',
      message:
        'The bridge must pin the exact D-201 and D-196 profile payloads plus their shared template.',
      contentIds: [
        request.bridgeProfile.id,
        request.optionalFeatureArtifact.profileRef.id,
        request.conditionSelectionRequest.profile.id,
      ],
    };
  }
  const selectedByModuleId = new Map(
    request.optionalFeatureArtifact.candidateEvaluations
      .filter((evaluation) => evaluation.disposition === 'selected')
      .map((evaluation) => [evaluation.moduleRef.id, evaluation]),
  );
  const groupsById = new Map(
    conditionTemplate.optionalConditionSelectionGroups.map((group) => [group.id, group]),
  );
  const selectedCountsByGroup = new Map<string, number>();
  for (const mapping of request.bridgeProfile.mappings) {
    if (!selectedByModuleId.has(mapping.moduleRef.id)) continue;
    selectedCountsByGroup.set(
      mapping.groupId,
      (selectedCountsByGroup.get(mapping.groupId) ?? 0) + 1,
    );
  }
  const overCapacityGroupIds = [...selectedCountsByGroup].flatMap(([groupId, count]) => {
    const group = groupsById.get(groupId);
    return group && count > group.maximumSelections ? [groupId] : [];
  });
  if (overCapacityGroupIds.length > 0) {
    return {
      ok: false,
      code: 'GROUP_CAPACITY_EXCEEDED',
      message:
        'D-201 selected more mapped comorbidities than an exact D-196 optional group permits.',
      contentIds: uniqueSorted(overCapacityGroupIds),
    };
  }
  return { ok: true };
};

const artifactPayload = (
  artifact: Omit<OptionalComorbidityBridgeArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  resolverVersion: artifact.resolverVersion,
  requestId: artifact.requestId,
  status: artifact.status,
  templateRef: artifact.templateRef,
  templateFingerprint: artifact.templateFingerprint,
  optionalFeatureArtifactRef: artifact.optionalFeatureArtifactRef,
  conditionRequestRef: artifact.conditionRequestRef,
  optionalFeatureProfileRef: artifact.optionalFeatureProfileRef,
  optionalFeatureProfileFingerprint: artifact.optionalFeatureProfileFingerprint,
  conditionProfileRef: artifact.conditionProfileRef,
  conditionProfileFingerprint: artifact.conditionProfileFingerprint,
  bridgeProfileRef: artifact.bridgeProfileRef,
  bridgeProfileFingerprint: artifact.bridgeProfileFingerprint,
  requiredTemplateConditionIds: artifact.requiredTemplateConditionIds,
  selectedComorbidityModuleDefinitionIds: artifact.selectedComorbidityModuleDefinitionIds,
  groupAudits: artifact.groupAudits,
  conditionStates: artifact.conditionStates,
  conditionBindings: artifact.conditionBindings,
  conflicts: artifact.conflicts,
  bridgeRequest: artifact.bridgeRequest,
  inputFingerprint: artifact.inputFingerprint,
});

const buildArtifact = (
  request: OptionalComorbidityBridgeRequest,
): OptionalComorbidityBridgeArtifact => {
  const template = request.conditionSelectionRequest.template;
  const conditionProfile = request.conditionSelectionRequest.profile;
  const templateRef = { id: template.id, contentVersion: template.contentVersion };
  const templateFingerprint = fingerprintTemplateConditionSelectionTemplate(template);
  const conditionProfileFingerprint =
    fingerprintTemplateConditionSelectionProfile(conditionProfile);
  const bridgeProfileFingerprint = fingerprintOptionalComorbidityBridgeProfile(
    request.bridgeProfile,
  );
  const conditionRequestFingerprint = fingerprint(
    'condition-request',
    request.conditionSelectionRequest,
  );
  const selectedOptionalByModuleId = new Map(
    request.optionalFeatureArtifact.candidateEvaluations
      .filter((evaluation) => evaluation.disposition === 'selected')
      .map((evaluation) => [evaluation.moduleRef.id, evaluation]),
  );
  const mappingByConditionKey = new Map(
    request.bridgeProfile.mappings.map((mapping) => [
      `${mapping.groupId}\u0000${mapping.templateConditionId}`,
      mapping,
    ]),
  );
  const conditionStates: ConditionState[] = [];
  const conditionBindings: ResolvedTemplateConditionBinding[] = [];
  const stateByTemplateConditionId = new Map<string, ConditionState>();

  for (const constraint of template.requiredConditions) {
    const state = materializeRequiredCondition(request, constraint);
    conditionStates.push(state);
    conditionBindings.push(requiredBinding(constraint, state));
    stateByTemplateConditionId.set(constraint.id, state);
  }

  const groupProfileById = new Map(
    conditionProfile.groupProfiles.map((profile) => [profile.groupId, profile]),
  );
  const groupAudits: OptionalComorbidityBridgeGroupAudit[] =
    template.optionalConditionSelectionGroups.map((group) => {
      const groupProfile = groupProfileById.get(group.id)!;
      const configuredWeightByConditionId = new Map(
        groupProfile.candidateWeights.map((candidate) => [
          candidate.templateConditionId,
          candidate.gameSelectionWeight,
        ]),
      );
      const candidateEvaluations: OptionalComorbidityBridgeCandidateEvaluation[] =
        group.candidates.map((constraint) => {
          const mapping = mappingByConditionKey.get(`${group.id}\u0000${constraint.id}`)!;
          const optionalEvaluation = selectedOptionalByModuleId.get(mapping.moduleRef.id);
          if (!optionalEvaluation) {
            return {
              mappingId: mapping.id,
              moduleRef: mapping.moduleRef,
              moduleFingerprint: mapping.moduleFingerprint,
              optionalFeatureBindingId: mapping.optionalFeatureBindingId,
              selectedModuleId: mapping.selectedModuleId,
              groupId: group.id,
              templateConditionId: constraint.id,
              configuredGameSelectionWeight: configuredWeightByConditionId.get(constraint.id)!,
              disposition: 'not_selected',
              optionalFeatureSelectionOrdinal: null,
              optionalFeatureStableDrawId: null,
              conditionStateId: null,
            };
          }
          const state = materializeOptionalCondition(
            request,
            constraint,
            optionalEvaluation.stableDrawId!,
          );
          conditionStates.push(state);
          conditionBindings.push(optionalBinding(group.id, constraint, state));
          stateByTemplateConditionId.set(constraint.id, state);
          return {
            mappingId: mapping.id,
            moduleRef: mapping.moduleRef,
            moduleFingerprint: mapping.moduleFingerprint,
            optionalFeatureBindingId: mapping.optionalFeatureBindingId,
            selectedModuleId: mapping.selectedModuleId,
            groupId: group.id,
            templateConditionId: constraint.id,
            configuredGameSelectionWeight: configuredWeightByConditionId.get(constraint.id)!,
            disposition: 'selected_by_optional_feature',
            optionalFeatureSelectionOrdinal: optionalEvaluation.selectionOrdinal,
            optionalFeatureStableDrawId: optionalEvaluation.stableDrawId,
            conditionStateId: state.id,
          };
        });
      return {
        groupId: group.id,
        configuredCountWeights: [...groupProfile.countWeights],
        minimumSelections: 0,
        maximumSelections: group.maximumSelections,
        selectedCount: candidateEvaluations.filter(
          (candidate) => candidate.disposition === 'selected_by_optional_feature',
        ).length,
        candidateEvaluations,
      };
    });

  const conflicts = conditionProfile.incompatibilities.flatMap((incompatibility) => {
    const left = stateByTemplateConditionId.get(incompatibility.leftTemplateConditionId);
    const right = stateByTemplateConditionId.get(incompatibility.rightTemplateConditionId);
    return left && right
      ? [
          {
            incompatibilityId: incompatibility.id,
            leftTemplateConditionId: incompatibility.leftTemplateConditionId,
            rightTemplateConditionId: incompatibility.rightTemplateConditionId,
            leftConditionStateId: left.id,
            rightConditionStateId: right.id,
            reason: incompatibility.reason,
            review: incompatibility.review,
          },
        ]
      : [];
  });
  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    resolverVersion: OPTIONAL_COMORBIDITY_BUDGET_BRIDGE_VERSION,
    requestId: request.id,
    status:
      conflicts.length === 0
        ? ('selected' as const)
        : ('literal_condition_incompatibility' as const),
    templateRef,
    templateFingerprint,
    optionalFeatureArtifactRef: {
      id: request.optionalFeatureArtifact.id,
      inputFingerprint: request.optionalFeatureArtifact.inputFingerprint,
      payloadFingerprint: request.optionalFeatureArtifact.payloadFingerprint,
    },
    conditionRequestRef: {
      id: request.conditionSelectionRequest.id,
      bridgeInputFingerprint: conditionRequestFingerprint,
    },
    optionalFeatureProfileRef: request.optionalFeatureArtifact.profileRef,
    optionalFeatureProfileFingerprint: request.optionalFeatureArtifact.profileFingerprint,
    conditionProfileRef: {
      id: conditionProfile.id,
      contentVersion: conditionProfile.contentVersion,
    },
    conditionProfileFingerprint,
    bridgeProfileRef: {
      id: request.bridgeProfile.id,
      contentVersion: request.bridgeProfile.contentVersion,
    },
    bridgeProfileFingerprint,
    requiredTemplateConditionIds: template.requiredConditions.map((condition) => condition.id),
    selectedComorbidityModuleDefinitionIds: groupAudits
      .flatMap((group) =>
        group.candidateEvaluations.flatMap((evaluation) =>
          evaluation.disposition === 'selected_by_optional_feature'
            ? [evaluation.moduleRef.id]
            : [],
        ),
      )
      .sort(compareStrings),
    groupAudits,
    conditionStates: [...conditionStates].sort((left, right) => compareStrings(left.id, right.id)),
    conditionBindings: [...conditionBindings].sort((left, right) =>
      compareStrings(left.id, right.id),
    ),
    conflicts,
    bridgeRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
  return OptionalComorbidityBridgeArtifactSchema.parse({
    ...withoutIdentity,
    id: `optional-comorbidity-bridge.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
};

export const bridgeOptionalComorbiditiesFromBudget = (
  input: unknown,
): OptionalComorbidityBridgeResult => {
  const parsed = OptionalComorbidityBridgeRequestSchema.safeParse(input);
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
    const artifact = buildArtifact(request);
    return artifact.status === 'selected'
      ? {
          ok: true,
          value: artifact as OptionalComorbidityBridgeArtifact & {
            readonly status: 'selected';
          },
        }
      : {
          ok: false,
          conflict: {
            code: 'LITERAL_CONDITION_INCOMPATIBILITY',
            disposition: 'retry_or_quarantine',
            artifact: artifact as OptionalComorbidityBridgeArtifact & {
              readonly status: 'literal_condition_incompatibility';
            },
          },
        };
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

export const verifyOptionalComorbidityBridgeIntegrity = (
  input: unknown,
): OptionalComorbidityBridgeIntegrityResult => {
  const parsed = OptionalComorbidityBridgeArtifactSchema.safeParse(input);
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
  if (artifact.resolverVersion !== OPTIONAL_COMORBIDITY_BUDGET_BRIDGE_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_RESOLVER_VERSION',
        message: `${artifact.id} uses unsupported optional-comorbidity bridge ${artifact.resolverVersion}.`,
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
    artifact.id !== `optional-comorbidity-bridge.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen optional-comorbidity audit payload.`,
      },
    };
  }
  const replay = bridgeOptionalComorbiditiesFromBudget(artifact.bridgeRequest);
  const replayArtifact = replay.ok
    ? replay.value
    : 'conflict' in replay
      ? replay.conflict.artifact
      : null;
  if (replayArtifact === null || !sameCanonicalValue(replayArtifact, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained bridge request does not reproduce the exact D-201-authorized condition audit.',
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyOptionalComorbidityBridgeContext = (input: {
  readonly artifact: unknown;
  readonly request: unknown;
}): OptionalComorbidityBridgeContextResult => {
  const integrity = verifyOptionalComorbidityBridgeIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = bridgeOptionalComorbiditiesFromBudget(input.request);
  const expectedArtifact = expected.ok
    ? expected.value
    : 'conflict' in expected
      ? expected.conflict.artifact
      : null;
  if (expectedArtifact === null || !sameCanonicalValue(expectedArtifact, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message:
          expectedArtifact === null && 'error' in expected
            ? `${expected.error.code}: ${expected.error.message}`
            : 'The optional-comorbidity bridge artifact does not match this exact request.',
      },
    };
  }
  return { ok: true, value: integrity.value };
};
