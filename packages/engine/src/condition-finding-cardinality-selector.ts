import {
  ConditionFindingCardinalityArtifactSchema,
  ConditionFindingCardinalityRequestSchema,
  type ClinicalRuleReview,
  type ConditionFindingCardinalityArtifact,
  type ConditionFindingCardinalityFingerprint,
  type ConditionFindingCardinalityGroupSelection,
  type ConditionFindingCardinalityProfile,
  type ConditionFindingCardinalityRequest,
  type ConditionFindingProfileBinding,
  type ConditionFindingRequiredEvaluation,
  type FindingDefinition,
  type FindingResolutionCandidate,
} from '@psychsim/schemas';

import { seededUnit } from './rng';
import { verifyResolvedConditionSourceIntegrity } from './resolved-condition-source';

export const CONDITION_FINDING_CARDINALITY_SELECTOR_VERSION = '2.0.0';

export type ConditionFindingCardinalitySelectionResult =
  | { readonly ok: true; readonly value: ConditionFindingCardinalityArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'INVALID_CONDITION_SOURCE'
          | 'CONDITION_SOURCE_NOT_SELECTED'
          | 'STALE_PROFILE_FINGERPRINT'
          | 'INVALID_FINDING_VALUE'
          | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type ConditionFindingCardinalityIntegrityResult =
  | { readonly ok: true; readonly value: ConditionFindingCardinalityArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_RESOLVER_VERSION'
          | 'CONDITION_SOURCE_INTEGRITY_MISMATCH'
          | 'DRAW_CONTEXT_MISMATCH'
          | 'PROVENANCE_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

export type ConditionFindingCardinalityContextResult =
  | { readonly ok: true; readonly value: ConditionFindingCardinalityArtifact }
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

const fingerprint = (scope: string, value: unknown): ConditionFindingCardinalityFingerprint =>
  `fingerprint.condition-finding-cardinality.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalizeObjectKeys(value)))}`;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const normalizeReview = (review: ClinicalRuleReview): ClinicalRuleReview => ({
  ...review,
  sourceUseNoteIds: uniqueSorted(review.sourceUseNoteIds),
});

const normalizeProfile = (
  profile: ConditionFindingCardinalityProfile,
): ConditionFindingCardinalityProfile => ({
  ...profile,
  conditionScope: {
    ...profile.conditionScope,
    severity: { ...profile.conditionScope.severity },
    requiredSpecifierIds: uniqueSorted(profile.conditionScope.requiredSpecifierIds),
  },
  requiredOutcomes: [...profile.requiredOutcomes]
    .map((outcome) => ({
      ...outcome,
      proposedValue: { ...outcome.proposedValue },
      developerOpinionIds: uniqueSorted(outcome.developerOpinionIds),
      review: normalizeReview(outcome.review),
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
  cardinalityGroups: [...profile.cardinalityGroups]
    .map((group) => ({
      ...group,
      countWeights: [...group.countWeights].sort(
        (left, right) => left.selectionCount - right.selectionCount,
      ),
      members: [...group.members]
        .map((member) => ({
          ...member,
          proposedValue: { ...member.proposedValue },
          developerOpinionIds: uniqueSorted(member.developerOpinionIds),
          review: normalizeReview(member.review),
        }))
        .sort((left, right) => compareStrings(left.id, right.id)),
      developerOpinionIds: uniqueSorted(group.developerOpinionIds),
      review: normalizeReview(group.review),
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
});

const normalizeDefinition = (definition: FindingDefinition): FindingDefinition => ({
  ...definition,
  aliases: [...definition.aliases].sort(compareStrings),
  valueSpecification: {
    ...definition.valueSpecification,
    allowedValues: [...definition.valueSpecification.allowedValues].sort(compareStrings),
  },
  allowedPresentationProjections: [...definition.allowedPresentationProjections].sort(
    compareStrings,
  ),
});

const normalizeRequest = (
  request: ConditionFindingCardinalityRequest,
): ConditionFindingCardinalityRequest => ({
  ...request,
  profiles: [...request.profiles]
    .map(normalizeProfile)
    .sort((left, right) =>
      compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
    ),
  conditionProfileBindings: [...request.conditionProfileBindings].sort((left, right) =>
    compareStrings(left.id, right.id),
  ),
  findingDefinitions: [...request.findingDefinitions]
    .map(normalizeDefinition)
    .sort((left, right) =>
      compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
    ),
});

export const fingerprintConditionFindingCardinalityProfile = (
  profile: ConditionFindingCardinalityProfile,
): ConditionFindingCardinalityFingerprint => fingerprint('profile', normalizeProfile(profile));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const weightedChoice = <
  Value extends {
    readonly gameSelectionWeight: number;
  },
>(
  values: readonly Value[],
  unit: number,
): Value => {
  const totalWeight = values.reduce((sum, value) => sum + value.gameSelectionWeight, 0);
  let cursor = unit * totalWeight;
  for (const value of values) {
    cursor -= value.gameSelectionWeight;
    if (cursor < 0) return value;
  }
  return values.at(-1)!;
};

interface DrawContextInput {
  readonly conditionSourceRef: {
    readonly sourceKind: 'template_condition_selection' | 'optional_comorbidity_bridge';
    readonly id: string;
    readonly payloadFingerprint: string;
    readonly templateRef: {
      readonly id: string;
      readonly contentVersion: string;
    };
    readonly templateFingerprint: string;
  };
  readonly seed: string;
  readonly binding: ConditionFindingProfileBinding;
  readonly lane: 'required' | 'count' | 'member';
  readonly sourceItemId: string;
  readonly ordinal: number | null;
}

const drawContext = (
  input: DrawContextInput,
): {
  readonly key: string;
  readonly stableDrawId: string;
} => {
  const payload = {
    // Preserve the pre-D203 D-196 draw domain. The native fingerprint
    // namespace already distinguishes a D-196 selection from a D-202 bridge.
    conditionSelectionRef: {
      id: input.conditionSourceRef.id,
      payloadFingerprint: input.conditionSourceRef.payloadFingerprint,
    },
    bindingId: input.binding.id,
    conditionStateId: input.binding.conditionStateId,
    profileRef: input.binding.profileRef,
    profileFingerprint: input.binding.profileFingerprint,
    lane: input.lane,
    sourceItemId: input.sourceItemId,
    ordinal: input.ordinal,
  };
  const key = JSON.stringify(canonicalizeObjectKeys(payload));
  return {
    key,
    stableDrawId: stableId(`stable-draw.condition-finding.${input.lane}`, {
      ...payload,
      seedFingerprint: hashToHex64(input.seed),
    }),
  };
};

const provenanceIds = (
  ...records: readonly {
    readonly developerOpinionIds: readonly string[];
    readonly review: ClinicalRuleReview;
  }[]
): string[] =>
  uniqueSorted(
    records.flatMap((record) => [...record.review.sourceUseNoteIds, ...record.developerOpinionIds]),
  );

const buildCandidate = (input: {
  readonly conditionSourceRef: {
    readonly sourceKind: 'template_condition_selection' | 'optional_comorbidity_bridge';
    readonly id: string;
    readonly payloadFingerprint: string;
    readonly templateRef: {
      readonly id: string;
      readonly contentVersion: string;
    };
    readonly templateFingerprint: string;
  };
  readonly binding: ConditionFindingProfileBinding;
  readonly profile: ConditionFindingCardinalityProfile;
  readonly sourceItemId: string;
  readonly kind: 'diagnostic_requirement' | 'cardinality_requirement';
  readonly findingDefinitionId: string;
  readonly findingDefinitionContentVersion: string;
  readonly proposedValue: { readonly kind: 'outcome'; readonly value: string };
  readonly uncertainty: 'none' | 'reported_uncertain' | 'conflicting_sources';
  readonly stableDrawId: string;
  readonly review: ClinicalRuleReview;
  readonly provenanceIds: readonly string[];
}): FindingResolutionCandidate => {
  const candidateId = stableId('finding-candidate.condition-profile', {
    conditionSelectionRef: {
      id: input.conditionSourceRef.id,
      payloadFingerprint: input.conditionSourceRef.payloadFingerprint,
    },
    bindingId: input.binding.id,
    profileRef: input.binding.profileRef,
    sourceItemId: input.sourceItemId,
    findingDefinitionId: input.findingDefinitionId,
    stableDrawId: input.stableDrawId,
  });
  return {
    schemaVersion: 1,
    id: candidateId,
    findingDefinitionId: input.findingDefinitionId,
    findingDefinitionContentVersion: input.findingDefinitionContentVersion,
    kind: input.kind,
    proposedValue: {
      kind: 'outcome',
      value: input.proposedValue.value as
        | 'present'
        | 'absent'
        | 'subthreshold'
        | 'normal'
        | 'high'
        | 'low'
        | 'positive'
        | 'negative',
    },
    uncertainty: input.uncertainty,
    contributions: [
      {
        schemaVersion: 1,
        id: stableId('finding-contribution.condition-profile.patient-state', {
          candidateId,
          conditionStateId: input.binding.conditionStateId,
        }),
        ownerKind: 'condition_state',
        ownerId: input.binding.conditionStateId,
        ownerContentVersion: null,
        role: 'constraint',
        provenanceIds: [...input.provenanceIds],
      },
      {
        schemaVersion: 1,
        id: stableId('finding-contribution.condition-profile.generation-profile', {
          candidateId,
          profileRef: input.binding.profileRef,
        }),
        ownerKind: 'generation_profile',
        ownerId: input.profile.id,
        ownerContentVersion: input.profile.contentVersion,
        role: 'generated_value',
        provenanceIds: [...input.provenanceIds],
      },
    ],
    resolution: {
      origin: 'deterministic_generation',
      generationProfileId: input.profile.id,
      generationProfileContentVersion: input.profile.contentVersion,
      resolverVersion: CONDITION_FINDING_CARDINALITY_SELECTOR_VERSION,
      stableDrawId: input.stableDrawId,
    },
    review: normalizeReview(input.review),
  };
};

const artifactPayload = (
  artifact: Omit<ConditionFindingCardinalityArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  resolverVersion: artifact.resolverVersion,
  requestId: artifact.requestId,
  conditionSource: artifact.conditionSource,
  conditionSourceRef: artifact.conditionSourceRef,
  seed: artifact.seed,
  profileReferences: artifact.profileReferences,
  conditionProfileBindings: artifact.conditionProfileBindings,
  unboundConditionStateIds: artifact.unboundConditionStateIds,
  requiredEvaluations: artifact.requiredEvaluations,
  groupSelections: artifact.groupSelections,
  candidates: artifact.candidates,
  inputFingerprint: artifact.inputFingerprint,
});

const buildArtifact = (
  request: ConditionFindingCardinalityRequest,
  source: Extract<
    ReturnType<typeof verifyResolvedConditionSourceIntegrity>,
    { readonly ok: true }
  >['value'],
): ConditionFindingCardinalityArtifact => {
  const conditionSourceRef = source.sourceRef;
  const profileByKey = new Map(
    request.profiles.map((profile) => [`${profile.id}\u0000${profile.contentVersion}`, profile]),
  );
  const boundConditionStateIds = new Set(
    request.conditionProfileBindings.map((binding) => binding.conditionStateId),
  );
  const requiredEvaluations: ConditionFindingRequiredEvaluation[] = [];
  const groupSelections: ConditionFindingCardinalityGroupSelection[] = [];
  const candidates: FindingResolutionCandidate[] = [];

  for (const binding of request.conditionProfileBindings) {
    const profile = profileByKey.get(
      `${binding.profileRef.id}\u0000${binding.profileRef.contentVersion}`,
    )!;
    for (const requirement of profile.requiredOutcomes) {
      const draw = drawContext({
        conditionSourceRef,
        seed: request.seed,
        binding,
        lane: 'required',
        sourceItemId: requirement.id,
        ordinal: null,
      });
      const candidate = buildCandidate({
        conditionSourceRef,
        binding,
        profile,
        sourceItemId: requirement.id,
        kind: 'diagnostic_requirement',
        findingDefinitionId: requirement.findingDefinitionId,
        findingDefinitionContentVersion: requirement.findingDefinitionContentVersion,
        proposedValue: requirement.proposedValue,
        uncertainty: requirement.uncertainty,
        stableDrawId: draw.stableDrawId,
        review: requirement.review,
        provenanceIds: provenanceIds(requirement),
      });
      candidates.push(candidate);
      requiredEvaluations.push({
        bindingId: binding.id,
        conditionStateId: binding.conditionStateId,
        profileRef: { ...binding.profileRef },
        profileFingerprint: binding.profileFingerprint,
        requirementId: requirement.id,
        findingDefinitionId: requirement.findingDefinitionId,
        findingDefinitionContentVersion: requirement.findingDefinitionContentVersion,
        proposedValue: { ...requirement.proposedValue },
        uncertainty: requirement.uncertainty,
        developerOpinionIds: [...requirement.developerOpinionIds],
        review: normalizeReview(requirement.review),
        stableDrawId: draw.stableDrawId,
        candidateId: candidate.id,
      });
    }

    for (const group of profile.cardinalityGroups) {
      const countDraw = drawContext({
        conditionSourceRef,
        seed: request.seed,
        binding,
        lane: 'count',
        sourceItemId: group.id,
        ordinal: null,
      });
      const countChoice = weightedChoice(
        group.countWeights,
        seededUnit(request.seed, countDraw.key),
      );
      const remaining = group.members.map((member) => ({ ...member }));
      const selectedById = new Map<
        string,
        { readonly ordinal: number; readonly stableDrawId: string }
      >();
      const selectionDraws: ConditionFindingCardinalityGroupSelection['selectionDraws'] = [];
      for (let ordinal = 0; ordinal < countChoice.selectionCount; ordinal += 1) {
        const draw = drawContext({
          conditionSourceRef,
          seed: request.seed,
          binding,
          lane: 'member',
          sourceItemId: group.id,
          ordinal,
        });
        const selected = weightedChoice(remaining, seededUnit(request.seed, draw.key));
        selectedById.set(selected.id, {
          ordinal,
          stableDrawId: draw.stableDrawId,
        });
        selectionDraws.push({
          selectionOrdinal: ordinal,
          selectedMemberId: selected.id,
          stableDrawId: draw.stableDrawId,
        });
        remaining.splice(
          remaining.findIndex((member) => member.id === selected.id),
          1,
        );
      }
      const memberEvaluations = group.members.map((member) => {
        const selection = selectedById.get(member.id);
        const candidate =
          selection === undefined
            ? null
            : buildCandidate({
                conditionSourceRef,
                binding,
                profile,
                sourceItemId: member.id,
                kind: 'cardinality_requirement',
                findingDefinitionId: member.findingDefinitionId,
                findingDefinitionContentVersion: member.findingDefinitionContentVersion,
                proposedValue: member.proposedValue,
                uncertainty: member.uncertainty,
                stableDrawId: selection.stableDrawId,
                review: member.review,
                provenanceIds: provenanceIds(group, member),
              });
        if (candidate) candidates.push(candidate);
        return {
          memberId: member.id,
          findingDefinitionId: member.findingDefinitionId,
          findingDefinitionContentVersion: member.findingDefinitionContentVersion,
          proposedValue: { ...member.proposedValue },
          uncertainty: member.uncertainty,
          gameSelectionWeight: member.gameSelectionWeight,
          developerOpinionIds: [...member.developerOpinionIds],
          review: normalizeReview(member.review),
          selected: selection !== undefined,
          selectionOrdinal: selection?.ordinal ?? null,
          stableDrawId: selection?.stableDrawId ?? null,
          candidateId: candidate?.id ?? null,
        };
      });
      groupSelections.push({
        bindingId: binding.id,
        conditionStateId: binding.conditionStateId,
        profileRef: { ...binding.profileRef },
        profileFingerprint: binding.profileFingerprint,
        groupId: group.id,
        selectedCount: countChoice.selectionCount,
        selectedCountGameWeight: countChoice.gameSelectionWeight,
        countStableDrawId: countDraw.stableDrawId,
        developerOpinionIds: [...group.developerOpinionIds],
        review: normalizeReview(group.review),
        selectionDraws,
        memberEvaluations,
      });
    }
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    resolverVersion: CONDITION_FINDING_CARDINALITY_SELECTOR_VERSION,
    requestId: request.id,
    conditionSource: request.conditionSource,
    conditionSourceRef,
    seed: request.seed,
    profileReferences: request.profiles.map((profile) => ({
      id: profile.id,
      contentVersion: profile.contentVersion,
      fingerprint: fingerprintConditionFindingCardinalityProfile(profile),
    })),
    conditionProfileBindings: request.conditionProfileBindings.map((binding) => ({
      ...binding,
      profileRef: { ...binding.profileRef },
    })),
    unboundConditionStateIds: source.conditionStates
      .filter((condition) => !boundConditionStateIds.has(condition.id))
      .map((condition) => condition.id)
      .sort(compareStrings),
    requiredEvaluations: requiredEvaluations.sort((left, right) =>
      compareStrings(
        `${left.bindingId}\u0000${left.requirementId}`,
        `${right.bindingId}\u0000${right.requirementId}`,
      ),
    ),
    groupSelections: groupSelections.sort((left, right) =>
      compareStrings(
        `${left.bindingId}\u0000${left.groupId}`,
        `${right.bindingId}\u0000${right.groupId}`,
      ),
    ),
    candidates: candidates.sort((left, right) => compareStrings(left.id, right.id)),
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
  return ConditionFindingCardinalityArtifactSchema.parse({
    ...withoutIdentity,
    id: `condition-finding-cardinality.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
};

const invalidCandidateValue = (request: ConditionFindingCardinalityRequest): string | null => {
  const definitionByKey = new Map(
    request.findingDefinitions.map((definition) => [
      `${definition.id}\u0000${definition.contentVersion}`,
      definition,
    ]),
  );
  for (const profile of request.profiles) {
    const outcomes = [
      ...profile.requiredOutcomes,
      ...profile.cardinalityGroups.flatMap((group) => group.members),
    ];
    for (const outcome of outcomes) {
      const definition = definitionByKey.get(
        `${outcome.findingDefinitionId}\u0000${outcome.findingDefinitionContentVersion}`,
      )!;
      if (!definition.valueSpecification.allowedValues.includes(outcome.proposedValue.value)) {
        return `${profile.id} mapping ${outcome.id} proposes ${outcome.proposedValue.value}, which is unavailable in ${definition.id}@${definition.contentVersion}.`;
      }
    }
  }
  return null;
};

export const selectConditionFindingCardinalityCandidates = (
  input: unknown,
): ConditionFindingCardinalitySelectionResult => {
  const parsed = ConditionFindingCardinalityRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  const request = normalizeRequest(parsed.data);
  const conditionIntegrity = verifyResolvedConditionSourceIntegrity(request.conditionSource);
  if (!conditionIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CONDITION_SOURCE',
        message: `${conditionIntegrity.error.code}: ${conditionIntegrity.error.message}`,
      },
    };
  }
  if (conditionIntegrity.value.source.artifact.status !== 'selected') {
    return {
      ok: false,
      error: {
        code: 'CONDITION_SOURCE_NOT_SELECTED',
        message: `${conditionIntegrity.value.source.artifact.id} is a literal condition-incompatibility audit, not resolved condition state.`,
      },
    };
  }
  const profileByKey = new Map(
    request.profiles.map((profile) => [`${profile.id}\u0000${profile.contentVersion}`, profile]),
  );
  for (const binding of request.conditionProfileBindings) {
    const profile = profileByKey.get(
      `${binding.profileRef.id}\u0000${binding.profileRef.contentVersion}`,
    )!;
    const expectedFingerprint = fingerprintConditionFindingCardinalityProfile(profile);
    if (binding.profileFingerprint !== expectedFingerprint) {
      return {
        ok: false,
        error: {
          code: 'STALE_PROFILE_FINGERPRINT',
          message: `${binding.id} does not pin the exact payload of ${profile.id}@${profile.contentVersion}.`,
        },
      };
    }
  }
  const invalidValue = invalidCandidateValue(request);
  if (invalidValue) {
    return {
      ok: false,
      error: {
        code: 'INVALID_FINDING_VALUE',
        message: invalidValue,
      },
    };
  }
  try {
    return { ok: true, value: buildArtifact(request, conditionIntegrity.value) };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
};

const expectedDraw = (input: {
  readonly artifact: ConditionFindingCardinalityArtifact;
  readonly binding: ConditionFindingProfileBinding;
  readonly lane: DrawContextInput['lane'];
  readonly sourceItemId: string;
  readonly ordinal: number | null;
}): string =>
  drawContext({
    conditionSourceRef: input.artifact.conditionSourceRef,
    seed: input.artifact.seed,
    binding: input.binding,
    lane: input.lane,
    sourceItemId: input.sourceItemId,
    ordinal: input.ordinal,
  }).stableDrawId;

export const verifyConditionFindingCardinalityIntegrity = (
  value: unknown,
): ConditionFindingCardinalityIntegrityResult => {
  const parsed = ConditionFindingCardinalityArtifactSchema.safeParse(value);
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
  if (artifact.resolverVersion !== CONDITION_FINDING_CARDINALITY_SELECTOR_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_RESOLVER_VERSION',
        message: `${artifact.id} uses unsupported condition-finding selector ${artifact.resolverVersion}.`,
      },
    };
  }
  const sourceIntegrity = verifyResolvedConditionSourceIntegrity(artifact.conditionSource);
  if (!sourceIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'CONDITION_SOURCE_INTEGRITY_MISMATCH',
        message: `${sourceIntegrity.error.code}: ${sourceIntegrity.error.message}`,
      },
    };
  }
  const bindingById = new Map(
    artifact.conditionProfileBindings.map((binding) => [binding.id, binding]),
  );
  for (const evaluation of artifact.requiredEvaluations) {
    const binding = bindingById.get(evaluation.bindingId)!;
    if (
      evaluation.stableDrawId !==
      expectedDraw({
        artifact,
        binding,
        lane: 'required',
        sourceItemId: evaluation.requirementId,
        ordinal: null,
      })
    ) {
      return {
        ok: false,
        error: {
          code: 'DRAW_CONTEXT_MISMATCH',
          message: `${evaluation.requirementId} does not match its saved required-value draw context.`,
        },
      };
    }
  }
  for (const group of artifact.groupSelections) {
    const binding = bindingById.get(group.bindingId)!;
    if (
      group.countStableDrawId !==
      expectedDraw({
        artifact,
        binding,
        lane: 'count',
        sourceItemId: group.groupId,
        ordinal: null,
      })
    ) {
      return {
        ok: false,
        error: {
          code: 'DRAW_CONTEXT_MISMATCH',
          message: `${group.groupId} does not match its saved count-draw context.`,
        },
      };
    }
    for (const draw of group.selectionDraws) {
      if (
        draw.stableDrawId !==
        expectedDraw({
          artifact,
          binding,
          lane: 'member',
          sourceItemId: group.groupId,
          ordinal: draw.selectionOrdinal,
        })
      ) {
        return {
          ok: false,
          error: {
            code: 'DRAW_CONTEXT_MISMATCH',
            message: `${group.groupId} member draw ${draw.selectionOrdinal} does not match its saved context.`,
          },
        };
      }
    }
  }

  const evaluationByCandidateId = new Map<
    string,
    {
      readonly bindingId: string;
      readonly conditionStateId: string;
      readonly profileRef: { readonly id: string; readonly contentVersion: string };
      readonly stableDrawId: string;
      readonly kind: 'diagnostic_requirement' | 'cardinality_requirement';
      readonly findingDefinitionId: string;
      readonly findingDefinitionContentVersion: string;
      readonly proposedValue: { readonly kind: 'outcome'; readonly value: string };
      readonly uncertainty: 'none' | 'reported_uncertain' | 'conflicting_sources';
      readonly review: ClinicalRuleReview;
      readonly provenanceIds: readonly string[];
    }
  >();
  for (const evaluation of artifact.requiredEvaluations) {
    evaluationByCandidateId.set(evaluation.candidateId, {
      ...evaluation,
      kind: 'diagnostic_requirement',
      provenanceIds: provenanceIds(evaluation),
    });
  }
  for (const group of artifact.groupSelections) {
    for (const member of group.memberEvaluations) {
      if (!member.candidateId || !member.stableDrawId) continue;
      evaluationByCandidateId.set(member.candidateId, {
        bindingId: group.bindingId,
        conditionStateId: group.conditionStateId,
        profileRef: group.profileRef,
        stableDrawId: member.stableDrawId,
        kind: 'cardinality_requirement',
        findingDefinitionId: member.findingDefinitionId,
        findingDefinitionContentVersion: member.findingDefinitionContentVersion,
        proposedValue: member.proposedValue,
        uncertainty: member.uncertainty,
        review: member.review,
        provenanceIds: provenanceIds(group, member),
      });
    }
  }
  for (const candidate of artifact.candidates) {
    const evaluation = evaluationByCandidateId.get(candidate.id)!;
    const conditionContribution = candidate.contributions.find(
      (contribution) =>
        contribution.ownerKind === 'condition_state' &&
        contribution.ownerId === evaluation.conditionStateId &&
        contribution.ownerContentVersion === null,
    );
    const profileContribution = candidate.contributions.find(
      (contribution) =>
        contribution.ownerKind === 'generation_profile' &&
        contribution.ownerId === evaluation.profileRef.id &&
        contribution.ownerContentVersion === evaluation.profileRef.contentVersion,
    );
    const expectedProvenanceIds = [...evaluation.provenanceIds];
    if (
      candidate.kind !== evaluation.kind ||
      candidate.findingDefinitionId !== evaluation.findingDefinitionId ||
      candidate.findingDefinitionContentVersion !== evaluation.findingDefinitionContentVersion ||
      JSON.stringify(candidate.proposedValue) !== JSON.stringify(evaluation.proposedValue) ||
      candidate.uncertainty !== evaluation.uncertainty ||
      JSON.stringify(candidate.review) !== JSON.stringify(normalizeReview(evaluation.review)) ||
      candidate.contributions.length !== 2 ||
      !conditionContribution ||
      conditionContribution.role !== 'constraint' ||
      conditionContribution.provenanceIds.join('\u0000') !== expectedProvenanceIds.join('\u0000') ||
      !profileContribution ||
      profileContribution.role !== 'generated_value' ||
      profileContribution.provenanceIds.join('\u0000') !== expectedProvenanceIds.join('\u0000') ||
      candidate.resolution?.origin !== 'deterministic_generation' ||
      candidate.resolution.generationProfileId !== evaluation.profileRef.id ||
      candidate.resolution.generationProfileContentVersion !==
        evaluation.profileRef.contentVersion ||
      candidate.resolution.resolverVersion !== artifact.resolverVersion ||
      candidate.resolution.stableDrawId !== evaluation.stableDrawId
    ) {
      return {
        ok: false,
        error: {
          code: 'PROVENANCE_MISMATCH',
          message: `${candidate.id} does not preserve its exact condition, profile, and draw provenance.`,
        },
      };
    }
  }

  const expectedPayloadFingerprint = fingerprint('output', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `condition-finding-cardinality.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen condition-finding payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyConditionFindingCardinalityContext = (input: {
  readonly artifact: unknown;
  readonly request: unknown;
}): ConditionFindingCardinalityContextResult => {
  const integrity = verifyConditionFindingCardinalityIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = selectConditionFindingCardinalityCandidates(input.request);
  if (!expected.ok) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: `${expected.error.code}: ${expected.error.message}`,
      },
    };
  }
  if (
    JSON.stringify(canonicalizeObjectKeys(integrity.value)) !==
    JSON.stringify(canonicalizeObjectKeys(expected.value))
  ) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: `${integrity.value.id} does not match deterministic selection from its exact condition selection, profiles, definitions, bindings, and seed.`,
      },
    };
  }
  return { ok: true, value: integrity.value };
};
