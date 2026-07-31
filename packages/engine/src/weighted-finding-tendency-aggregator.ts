import {
  WeightedFindingTendencyArtifactSchema,
  WeightedFindingTendencyRequestSchema,
  type BackgroundFindingOutcomeProfile,
  type ClinicalRuleReview,
  type FindingContribution,
  type FindingDefinition,
  type FindingResolutionCandidate,
  type WeightedFindingTendencyAggregation,
  type WeightedFindingTendencyArtifact,
  type WeightedFindingTendencyBinding,
  type WeightedFindingTendencyContributorEvaluation,
  type WeightedFindingTendencyFingerprint,
  type WeightedFindingTendencyOutcomeEvaluation,
  type WeightedFindingTendencyProfile,
  type WeightedFindingTendencyRequest,
} from '@psychsim/schemas';

import {
  fingerprintBackgroundFindingOutcomeProfile,
  verifyBackgroundFindingOutcomeIntegrity,
} from './background-finding-outcome-selector';
import { seededUnit } from './rng';

export const WEIGHTED_FINDING_TENDENCY_AGGREGATOR_VERSION = '1.0.0';

export type WeightedFindingTendencyAggregationResult =
  | { readonly ok: true; readonly value: WeightedFindingTendencyArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'INVALID_BACKGROUND_ARTIFACT'
          | 'STALE_PROFILE_FINGERPRINT'
          | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type WeightedFindingTendencyIntegrityResult =
  | { readonly ok: true; readonly value: WeightedFindingTendencyArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_RESOLVER_VERSION'
          | 'DRAW_CONTEXT_MISMATCH'
          | 'PROVENANCE_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

export type WeightedFindingTendencyContextResult =
  | { readonly ok: true; readonly value: WeightedFindingTendencyArtifact }
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

const fingerprint = (scope: string, value: unknown): WeightedFindingTendencyFingerprint =>
  `fingerprint.weighted-finding-tendency.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalizeObjectKeys(value)))}`;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const valueKey = (value: { readonly kind: 'outcome'; readonly value: string }): string =>
  JSON.stringify(canonicalizeObjectKeys(value));

const normalizeReview = (review: ClinicalRuleReview): ClinicalRuleReview => ({
  ...review,
  sourceUseNoteIds: uniqueSorted(review.sourceUseNoteIds),
});

const normalizeContribution = (contribution: FindingContribution): FindingContribution => ({
  ...contribution,
  provenanceIds: uniqueSorted(contribution.provenanceIds),
});

const normalizeProfile = (
  profile: WeightedFindingTendencyProfile,
): WeightedFindingTendencyProfile => ({
  ...profile,
  allocations: [...profile.allocations]
    .map((allocation) => ({
      ...allocation,
      proposedValue: { ...allocation.proposedValue },
    }))
    .sort((left, right) =>
      compareStrings(valueKey(left.proposedValue), valueKey(right.proposedValue)),
    ),
  developerOpinionIds: uniqueSorted(profile.developerOpinionIds),
  review: normalizeReview(profile.review),
});

const normalizeBinding = (
  binding: WeightedFindingTendencyBinding,
): WeightedFindingTendencyBinding => ({
  ...binding,
  profileRef: { ...binding.profileRef },
  applicabilityContributions: [...binding.applicabilityContributions]
    .map(normalizeContribution)
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
  request: WeightedFindingTendencyRequest,
): WeightedFindingTendencyRequest => ({
  ...request,
  profiles: [...request.profiles]
    .map(normalizeProfile)
    .sort((left, right) =>
      compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
    ),
  contributorBindings: [...request.contributorBindings]
    .map(normalizeBinding)
    .sort((left, right) => compareStrings(left.id, right.id)),
  findingDefinitions: [...request.findingDefinitions]
    .map(normalizeDefinition)
    .sort((left, right) =>
      compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
    ),
});

export const fingerprintWeightedFindingTendencyProfile = (
  profile: WeightedFindingTendencyProfile,
): WeightedFindingTendencyFingerprint => fingerprint('profile', normalizeProfile(profile));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const weightedChoice = <
  Value extends {
    readonly pooledGameGenerationWeight: number;
  },
>(
  values: readonly Value[],
  unit: number,
): Value => {
  const totalWeight = values.reduce((sum, value) => sum + value.pooledGameGenerationWeight, 0);
  let cursor = unit * totalWeight;
  for (const value of values) {
    cursor -= value.pooledGameGenerationWeight;
    if (cursor < 0) return value;
  }
  return values.at(-1)!;
};

const drawContext = (input: {
  readonly horizonTargetId: string;
  readonly findingDefinitionId: string;
  readonly findingDefinitionContentVersion: string;
  readonly seed: string;
}): { readonly key: string; readonly stableDrawId: string } => {
  const target = {
    horizonTargetId: input.horizonTargetId,
    findingDefinitionId: input.findingDefinitionId,
    findingDefinitionContentVersion: input.findingDefinitionContentVersion,
    resolverVersion: WEIGHTED_FINDING_TENDENCY_AGGREGATOR_VERSION,
  };
  const key = JSON.stringify(canonicalizeObjectKeys(target));
  return {
    key,
    stableDrawId: stableId('stable-draw.weighted-finding-tendency', {
      ...target,
      seedFingerprint: hashToHex64(input.seed),
    }),
  };
};

const compositeGenerationProfileId = (input: {
  readonly backgroundSelectionBindingId: string;
  readonly contributorEvaluations: readonly WeightedFindingTendencyContributorEvaluation[];
}): string =>
  stableId('generation-profile.weighted-finding-tendency', {
    backgroundSelectionBindingId: input.backgroundSelectionBindingId,
    contributors: [...input.contributorEvaluations]
      .sort((left, right) => compareStrings(left.bindingId, right.bindingId))
      .map((evaluation) => ({
        bindingId: evaluation.bindingId,
        profileRef: evaluation.profileRef,
        profileFingerprint: evaluation.profileFingerprint,
      })),
  });

const candidateIdentity = (input: {
  readonly backgroundRef: WeightedFindingTendencyArtifact['backgroundRef'];
  readonly aggregation: WeightedFindingTendencyAggregation;
  readonly selectedValue: WeightedFindingTendencyOutcomeEvaluation['proposedValue'];
}): string =>
  stableId('finding-candidate.weighted-tendency', {
    backgroundRef: input.backgroundRef,
    backgroundSelectionBindingId: input.aggregation.backgroundSelectionBindingId,
    contributorBindings: [...input.aggregation.contributorEvaluations]
      .sort((left, right) => compareStrings(left.bindingId, right.bindingId))
      .map((evaluation) => ({
        bindingId: evaluation.bindingId,
        profileRef: evaluation.profileRef,
        profileFingerprint: evaluation.profileFingerprint,
      })),
    findingDefinitionId: input.aggregation.findingDefinitionId,
    findingDefinitionContentVersion: input.aggregation.findingDefinitionContentVersion,
    selectedValue: input.selectedValue,
    stableDrawId: input.aggregation.stableDrawId,
  });

const profileProvenanceIds = (profile: {
  readonly developerOpinionIds: readonly string[];
  readonly review: ClinicalRuleReview;
}): string[] => uniqueSorted([...profile.review.sourceUseNoteIds, ...profile.developerOpinionIds]);

const buildCandidate = (input: {
  readonly backgroundRef: WeightedFindingTendencyArtifact['backgroundRef'];
  readonly aggregation: WeightedFindingTendencyAggregation;
  readonly selected: WeightedFindingTendencyOutcomeEvaluation;
}): FindingResolutionCandidate => {
  const candidateId = candidateIdentity({
    backgroundRef: input.backgroundRef,
    aggregation: input.aggregation,
    selectedValue: input.selected.proposedValue,
  });
  const baselineProvenanceIds = uniqueSorted([
    ...input.aggregation.backgroundReview.sourceUseNoteIds,
    ...input.aggregation.backgroundDeveloperOpinionIds,
  ]);
  const profileContributions: FindingContribution[] = input.aggregation.contributorEvaluations.map(
    (evaluation) => ({
      schemaVersion: 1,
      id: stableId('finding-contribution.weighted-tendency.generation-profile', {
        candidateId,
        bindingId: evaluation.bindingId,
        profileRef: evaluation.profileRef,
      }),
      ownerKind: 'generation_profile',
      ownerId: evaluation.profileRef.id,
      ownerContentVersion: evaluation.profileRef.contentVersion,
      role: 'generated_value',
      provenanceIds: profileProvenanceIds(evaluation),
    }),
  );
  const fixedContributions: FindingContribution[] = [
    {
      schemaVersion: 1,
      id: stableId('finding-contribution.weighted-tendency.catalog-definition', {
        candidateId,
        findingDefinitionId: input.aggregation.findingDefinitionId,
      }),
      ownerKind: 'catalog_definition',
      ownerId: input.aggregation.findingDefinitionId,
      ownerContentVersion: input.aggregation.findingDefinitionContentVersion,
      role: 'identity',
      provenanceIds: [],
    },
    {
      schemaVersion: 1,
      id: stableId('finding-contribution.weighted-tendency.background-profile', {
        candidateId,
        profileRef: input.aggregation.backgroundProfileRef,
      }),
      ownerKind: 'generation_profile',
      ownerId: input.aggregation.backgroundProfileRef.id,
      ownerContentVersion: input.aggregation.backgroundProfileRef.contentVersion,
      role: 'generated_value',
      provenanceIds: baselineProvenanceIds,
    },
  ];
  return {
    schemaVersion: 1,
    id: candidateId,
    findingDefinitionId: input.aggregation.findingDefinitionId,
    findingDefinitionContentVersion: input.aggregation.findingDefinitionContentVersion,
    kind: 'weighted_tendency',
    proposedValue: { ...input.selected.proposedValue },
    uncertainty: input.selected.uncertainty,
    contributions: [
      ...fixedContributions,
      ...profileContributions,
      ...input.aggregation.contributorEvaluations.flatMap((evaluation) =>
        evaluation.applicabilityContributions.map(normalizeContribution),
      ),
    ].sort((left, right) => compareStrings(left.id, right.id)),
    resolution: {
      origin: 'deterministic_generation',
      generationProfileId: compositeGenerationProfileId(input.aggregation),
      generationProfileContentVersion: WEIGHTED_FINDING_TENDENCY_AGGREGATOR_VERSION,
      resolverVersion: WEIGHTED_FINDING_TENDENCY_AGGREGATOR_VERSION,
      stableDrawId: input.aggregation.stableDrawId,
    },
    review: normalizeReview(input.aggregation.backgroundReview),
  };
};

const artifactPayload = (
  artifact: Omit<WeightedFindingTendencyArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  resolverVersion: artifact.resolverVersion,
  requestId: artifact.requestId,
  backgroundRef: artifact.backgroundRef,
  seed: artifact.seed,
  profileReferences: artifact.profileReferences,
  contributorBindings: artifact.contributorBindings,
  aggregations: artifact.aggregations,
  candidates: artifact.candidates,
  inputFingerprint: artifact.inputFingerprint,
});

const buildArtifact = (
  request: WeightedFindingTendencyRequest,
): WeightedFindingTendencyArtifact => {
  const backgroundRef = {
    id: request.backgroundArtifact.id,
    payloadFingerprint: request.backgroundArtifact.payloadFingerprint,
  };
  const profileByKey = new Map(
    request.profiles.map((profile) => [`${profile.id}\u0000${profile.contentVersion}`, profile]),
  );
  const bindingsBySelection = new Map<string, WeightedFindingTendencyBinding[]>();
  for (const binding of request.contributorBindings) {
    const bindings = bindingsBySelection.get(binding.backgroundSelectionBindingId) ?? [];
    bindings.push(binding);
    bindingsBySelection.set(binding.backgroundSelectionBindingId, bindings);
  }
  const aggregations: WeightedFindingTendencyAggregation[] = [];
  const candidates: FindingResolutionCandidate[] = [];

  for (const backgroundSelection of request.backgroundArtifact.selections) {
    const bindings = bindingsBySelection
      .get(backgroundSelection.bindingId)
      ?.sort((left, right) => compareStrings(left.id, right.id));
    if (!bindings) continue;
    const contributorEvaluations: WeightedFindingTendencyContributorEvaluation[] = bindings.map(
      (binding) => {
        const profile = profileByKey.get(
          `${binding.profileRef.id}\u0000${binding.profileRef.contentVersion}`,
        )!;
        return {
          bindingId: binding.id,
          profileRef: { ...binding.profileRef },
          profileFingerprint: binding.profileFingerprint,
          applicabilityContributions: binding.applicabilityContributions.map(normalizeContribution),
          allocations: profile.allocations.map((allocation) => ({
            ...allocation,
            proposedValue: { ...allocation.proposedValue },
          })),
          developerOpinionIds: [...profile.developerOpinionIds],
          review: normalizeReview(profile.review),
        };
      },
    );
    const totalPooledGameGenerationWeight = backgroundSelection.outcomeEvaluations.reduce(
      (sum, baseline) =>
        sum +
        baseline.gameGenerationWeight +
        contributorEvaluations.reduce(
          (contributorSum, contributor) =>
            contributorSum +
            contributor.allocations.find(
              (allocation) =>
                valueKey(allocation.proposedValue) === valueKey(baseline.proposedValue),
            )!.addedGameGenerationWeight,
          0,
        ),
      0,
    );
    const draw = drawContext({
      horizonTargetId: backgroundSelection.horizonTargetId,
      findingDefinitionId: backgroundSelection.findingDefinitionId,
      findingDefinitionContentVersion: backgroundSelection.findingDefinitionContentVersion,
      seed: request.backgroundArtifact.seed,
    });
    const unevaluatedOutcomes: WeightedFindingTendencyOutcomeEvaluation[] =
      backgroundSelection.outcomeEvaluations
        .map((baseline) => {
          const contributorGameGenerationWeight = contributorEvaluations.reduce(
            (sum, contributor) =>
              sum +
              contributor.allocations.find(
                (allocation) =>
                  valueKey(allocation.proposedValue) === valueKey(baseline.proposedValue),
              )!.addedGameGenerationWeight,
            0,
          );
          const pooledGameGenerationWeight =
            baseline.gameGenerationWeight + contributorGameGenerationWeight;
          return {
            baselineOutcomeId: baseline.outcomeId,
            proposedValue: { ...baseline.proposedValue },
            uncertainty: baseline.uncertainty,
            baselineGameGenerationWeight: baseline.gameGenerationWeight,
            contributorGameGenerationWeight,
            pooledGameGenerationWeight,
            normalizedGameSelectionProbability: {
              numerator: pooledGameGenerationWeight,
              denominator: totalPooledGameGenerationWeight,
              decimal: pooledGameGenerationWeight / totalPooledGameGenerationWeight,
            },
            selected: false,
            candidateId: null,
          };
        })
        .sort((left, right) =>
          compareStrings(valueKey(left.proposedValue), valueKey(right.proposedValue)),
        );
    const selected = weightedChoice(
      unevaluatedOutcomes,
      seededUnit(request.backgroundArtifact.seed, draw.key),
    );
    const aggregation: WeightedFindingTendencyAggregation = {
      backgroundSelectionBindingId: backgroundSelection.bindingId,
      horizonTargetId: backgroundSelection.horizonTargetId,
      findingDefinitionId: backgroundSelection.findingDefinitionId,
      findingDefinitionContentVersion: backgroundSelection.findingDefinitionContentVersion,
      backgroundProfileRef: { ...backgroundSelection.profileRef },
      backgroundProfileFingerprint: backgroundSelection.profileFingerprint,
      backgroundStableDrawId: backgroundSelection.stableDrawId,
      backgroundDeveloperOpinionIds: [...backgroundSelection.developerOpinionIds],
      backgroundReview: normalizeReview(backgroundSelection.review),
      contributorEvaluations,
      totalPooledGameGenerationWeight,
      stableDrawId: draw.stableDrawId,
      outcomeEvaluations: unevaluatedOutcomes,
    };
    const provisionalSelected = aggregation.outcomeEvaluations.find(
      (outcome) => valueKey(outcome.proposedValue) === valueKey(selected.proposedValue),
    )!;
    const candidate = buildCandidate({
      backgroundRef,
      aggregation,
      selected: provisionalSelected,
    });
    const completedAggregation: WeightedFindingTendencyAggregation = {
      ...aggregation,
      outcomeEvaluations: aggregation.outcomeEvaluations.map((outcome) =>
        valueKey(outcome.proposedValue) === valueKey(selected.proposedValue)
          ? { ...outcome, selected: true, candidateId: candidate.id }
          : outcome,
      ),
    };
    aggregations.push(completedAggregation);
    candidates.push(candidate);
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    resolverVersion: WEIGHTED_FINDING_TENDENCY_AGGREGATOR_VERSION,
    requestId: request.id,
    backgroundRef,
    seed: request.backgroundArtifact.seed,
    profileReferences: request.profiles.map((profile) => ({
      id: profile.id,
      contentVersion: profile.contentVersion,
      fingerprint: fingerprintWeightedFindingTendencyProfile(profile),
    })),
    contributorBindings: request.contributorBindings.map(normalizeBinding),
    aggregations: aggregations.sort((left, right) =>
      compareStrings(left.backgroundSelectionBindingId, right.backgroundSelectionBindingId),
    ),
    candidates: candidates.sort((left, right) => compareStrings(left.id, right.id)),
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
  return WeightedFindingTendencyArtifactSchema.parse({
    ...withoutIdentity,
    id: `weighted-finding-tendencies.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
};

export const aggregateWeightedFindingTendencies = (
  input: unknown,
): WeightedFindingTendencyAggregationResult => {
  const parsed = WeightedFindingTendencyRequestSchema.safeParse(input);
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
  const backgroundIntegrity = verifyBackgroundFindingOutcomeIntegrity(request.backgroundArtifact);
  if (!backgroundIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_BACKGROUND_ARTIFACT',
        message: `${backgroundIntegrity.error.code}: ${backgroundIntegrity.error.message}`,
      },
    };
  }
  const profileByKey = new Map(
    request.profiles.map((profile) => [`${profile.id}\u0000${profile.contentVersion}`, profile]),
  );
  for (const binding of request.contributorBindings) {
    const profile = profileByKey.get(
      `${binding.profileRef.id}\u0000${binding.profileRef.contentVersion}`,
    )!;
    if (binding.profileFingerprint !== fingerprintWeightedFindingTendencyProfile(profile)) {
      return {
        ok: false,
        error: {
          code: 'STALE_PROFILE_FINGERPRINT',
          message: `${binding.id} does not pin the exact payload of ${profile.id}@${profile.contentVersion}.`,
        },
      };
    }
  }
  try {
    return { ok: true, value: buildArtifact(request) };
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

const reconstructedContributorProfile = (input: {
  readonly aggregation: WeightedFindingTendencyAggregation;
  readonly evaluation: WeightedFindingTendencyContributorEvaluation;
}): WeightedFindingTendencyProfile => ({
  schemaVersion: 1,
  contentVersion: input.evaluation.profileRef.contentVersion,
  id: input.evaluation.profileRef.id,
  modelVersion: 'additive-categorical-finding-tendency.v1',
  findingDefinitionId: input.aggregation.findingDefinitionId,
  findingDefinitionContentVersion: input.aggregation.findingDefinitionContentVersion,
  outcomeSetSemantics: 'mutually_exclusive_exhaustive',
  allocations: input.evaluation.allocations.map((allocation) => ({
    ...allocation,
    proposedValue: { ...allocation.proposedValue },
  })),
  developerOpinionIds: [...input.evaluation.developerOpinionIds],
  review: { ...input.evaluation.review },
});

const reconstructedBackgroundProfile = (
  aggregation: WeightedFindingTendencyAggregation,
): BackgroundFindingOutcomeProfile => ({
  schemaVersion: 1,
  contentVersion: aggregation.backgroundProfileRef.contentVersion,
  id: aggregation.backgroundProfileRef.id,
  modelVersion: 'weighted-background-finding.v1',
  findingDefinitionId: aggregation.findingDefinitionId,
  findingDefinitionContentVersion: aggregation.findingDefinitionContentVersion,
  outcomes: aggregation.outcomeEvaluations.map((outcome) => ({
    schemaVersion: 1,
    id: outcome.baselineOutcomeId,
    proposedValue: { ...outcome.proposedValue },
    uncertainty: outcome.uncertainty,
    gameGenerationWeight: outcome.baselineGameGenerationWeight,
  })),
  developerOpinionIds: [...aggregation.backgroundDeveloperOpinionIds],
  review: { ...aggregation.backgroundReview },
});

export const verifyWeightedFindingTendencyIntegrity = (
  value: unknown,
): WeightedFindingTendencyIntegrityResult => {
  const parsed = WeightedFindingTendencyArtifactSchema.safeParse(value);
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
  if (artifact.resolverVersion !== WEIGHTED_FINDING_TENDENCY_AGGREGATOR_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_RESOLVER_VERSION',
        message: `${artifact.id} uses unsupported weighted-tendency resolver ${artifact.resolverVersion}.`,
      },
    };
  }
  const bindingById = new Map(artifact.contributorBindings.map((binding) => [binding.id, binding]));
  const candidateById = new Map(artifact.candidates.map((candidate) => [candidate.id, candidate]));
  for (const aggregation of artifact.aggregations) {
    if (
      fingerprintBackgroundFindingOutcomeProfile(reconstructedBackgroundProfile(aggregation)) !==
      aggregation.backgroundProfileFingerprint
    ) {
      return {
        ok: false,
        error: {
          code: 'PROVENANCE_MISMATCH',
          message: `${aggregation.backgroundSelectionBindingId} does not preserve its exact D-198 baseline profile payload.`,
        },
      };
    }
    for (const evaluation of aggregation.contributorEvaluations) {
      const binding = bindingById.get(evaluation.bindingId)!;
      const reconstructed = reconstructedContributorProfile({
        aggregation,
        evaluation,
      });
      if (
        fingerprintWeightedFindingTendencyProfile(reconstructed) !==
          evaluation.profileFingerprint ||
        evaluation.profileFingerprint !== binding.profileFingerprint
      ) {
        return {
          ok: false,
          error: {
            code: 'PROVENANCE_MISMATCH',
            message: `${evaluation.bindingId} does not preserve its exact weighted-tendency profile payload.`,
          },
        };
      }
    }
    const draw = drawContext({
      horizonTargetId: aggregation.horizonTargetId,
      findingDefinitionId: aggregation.findingDefinitionId,
      findingDefinitionContentVersion: aggregation.findingDefinitionContentVersion,
      seed: artifact.seed,
    });
    const selected = aggregation.outcomeEvaluations.find((outcome) => outcome.selected)!;
    const expectedSelected = weightedChoice(
      [...aggregation.outcomeEvaluations].sort((left, right) =>
        compareStrings(valueKey(left.proposedValue), valueKey(right.proposedValue)),
      ),
      seededUnit(artifact.seed, draw.key),
    );
    if (
      aggregation.stableDrawId !== draw.stableDrawId ||
      valueKey(selected.proposedValue) !== valueKey(expectedSelected.proposedValue)
    ) {
      return {
        ok: false,
        error: {
          code: 'DRAW_CONTEXT_MISMATCH',
          message: `${aggregation.backgroundSelectionBindingId} selected an outcome inconsistent with its frozen mass, seed, and target draw.`,
        },
      };
    }
    const candidate = candidateById.get(selected.candidateId!)!;
    const expectedCandidate = buildCandidate({
      backgroundRef: artifact.backgroundRef,
      aggregation,
      selected: { ...selected, candidateId: null, selected: false },
    });
    if (
      JSON.stringify(canonicalizeObjectKeys(candidate)) !==
      JSON.stringify(canonicalizeObjectKeys(expectedCandidate))
    ) {
      return {
        ok: false,
        error: {
          code: 'PROVENANCE_MISMATCH',
          message: `${candidate.id} does not preserve its exact baseline, contributors, selected value, and applicability provenance.`,
        },
      };
    }
  }
  const expectedPayloadFingerprint = fingerprint('output', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `weighted-finding-tendencies.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen weighted-tendency payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyWeightedFindingTendencyContext = (input: {
  readonly artifact: unknown;
  readonly request: unknown;
}): WeightedFindingTendencyContextResult => {
  const integrity = verifyWeightedFindingTendencyIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = aggregateWeightedFindingTendencies(input.request);
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
        message: `${integrity.value.id} does not match deterministic aggregation from its exact D-198 artifact, contributor profiles, bindings, definitions, and seed.`,
      },
    };
  }
  return { ok: true, value: integrity.value };
};
