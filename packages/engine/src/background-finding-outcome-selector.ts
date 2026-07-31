import {
  BackgroundFindingOutcomeArtifactSchema,
  BackgroundFindingOutcomeRequestSchema,
  type BackgroundFindingFingerprint,
  type BackgroundFindingHorizon,
  type BackgroundFindingOutcomeArtifact,
  type BackgroundFindingOutcomeProfile,
  type BackgroundFindingOutcomeRequest,
  type BackgroundFindingProfileBinding,
  type BackgroundFindingSelectionEvaluation,
  type ClinicalRuleReview,
  type FindingDefinition,
  type FindingResolutionCandidate,
} from '@psychsim/schemas';

import { verifyConditionFindingCardinalityIntegrity } from './condition-finding-cardinality-selector';
import { seededUnit } from './rng';

export const BACKGROUND_FINDING_OUTCOME_SELECTOR_VERSION = '1.0.0';

export type BackgroundFindingOutcomeSelectionResult =
  | { readonly ok: true; readonly value: BackgroundFindingOutcomeArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'INVALID_CONDITION_FINDING_ARTIFACT'
          | 'STALE_PROFILE_FINGERPRINT'
          | 'INVALID_FINDING_VALUE'
          | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type BackgroundFindingOutcomeIntegrityResult =
  | { readonly ok: true; readonly value: BackgroundFindingOutcomeArtifact }
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

export type BackgroundFindingOutcomeContextResult =
  | { readonly ok: true; readonly value: BackgroundFindingOutcomeArtifact }
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

const fingerprint = (scope: string, value: unknown): BackgroundFindingFingerprint =>
  `fingerprint.background-finding.${scope}.fnv1a64.${hashToHex64(
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
  profile: BackgroundFindingOutcomeProfile,
): BackgroundFindingOutcomeProfile => ({
  ...profile,
  outcomes: [...profile.outcomes]
    .map((outcome) => ({
      ...outcome,
      proposedValue: { ...outcome.proposedValue },
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
  developerOpinionIds: uniqueSorted(profile.developerOpinionIds),
  review: normalizeReview(profile.review),
});

const normalizeHorizon = (horizon: BackgroundFindingHorizon): BackgroundFindingHorizon => ({
  ...horizon,
  targets: [...horizon.targets].sort((left, right) => compareStrings(left.id, right.id)),
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
  request: BackgroundFindingOutcomeRequest,
): BackgroundFindingOutcomeRequest => ({
  ...request,
  horizon: normalizeHorizon(request.horizon),
  profiles: [...request.profiles]
    .map(normalizeProfile)
    .sort((left, right) =>
      compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
    ),
  profileBindings: [...request.profileBindings].sort((left, right) =>
    compareStrings(left.id, right.id),
  ),
  findingDefinitions: [...request.findingDefinitions]
    .map(normalizeDefinition)
    .sort((left, right) =>
      compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
    ),
});

export const fingerprintBackgroundFindingOutcomeProfile = (
  profile: BackgroundFindingOutcomeProfile,
): BackgroundFindingFingerprint => fingerprint('profile', normalizeProfile(profile));

export const fingerprintBackgroundFindingHorizon = (
  horizon: BackgroundFindingHorizon,
): BackgroundFindingFingerprint => fingerprint('horizon', normalizeHorizon(horizon));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const weightedChoice = <
  Value extends {
    readonly gameGenerationWeight: number;
  },
>(
  values: readonly Value[],
  unit: number,
): Value => {
  const totalWeight = values.reduce((sum, value) => sum + value.gameGenerationWeight, 0);
  let cursor = unit * totalWeight;
  for (const value of values) {
    cursor -= value.gameGenerationWeight;
    if (cursor < 0) return value;
  }
  return values.at(-1)!;
};

const profileProvenanceIds = (profile: {
  readonly developerOpinionIds: readonly string[];
  readonly review: ClinicalRuleReview;
}): string[] => uniqueSorted([...profile.review.sourceUseNoteIds, ...profile.developerOpinionIds]);

const drawContext = (input: {
  readonly conditionFindingRef: {
    readonly id: string;
    readonly payloadFingerprint: string;
  };
  readonly horizonRef: {
    readonly id: string;
    readonly fingerprint: string;
  };
  readonly binding: BackgroundFindingProfileBinding;
  readonly findingDefinitionId: string;
  readonly seed: string;
}): { readonly key: string; readonly stableDrawId: string } => {
  const payload = {
    conditionFindingRef: input.conditionFindingRef,
    horizonRef: input.horizonRef,
    bindingId: input.binding.id,
    horizonTargetId: input.binding.horizonTargetId,
    profileRef: input.binding.profileRef,
    profileFingerprint: input.binding.profileFingerprint,
    findingDefinitionId: input.findingDefinitionId,
  };
  const key = JSON.stringify(canonicalizeObjectKeys(payload));
  return {
    key,
    stableDrawId: stableId('stable-draw.background-finding.outcome', {
      ...payload,
      seedFingerprint: hashToHex64(input.seed),
    }),
  };
};

const candidateIdentity = (input: {
  readonly conditionFindingRef: {
    readonly id: string;
    readonly payloadFingerprint: string;
  };
  readonly horizonRef: {
    readonly id: string;
    readonly fingerprint: string;
  };
  readonly binding: BackgroundFindingProfileBinding;
  readonly findingDefinitionId: string;
  readonly outcomeId: string;
  readonly stableDrawId: string;
}): string =>
  stableId('finding-candidate.background-variation', {
    conditionFindingRef: input.conditionFindingRef,
    horizonRef: input.horizonRef,
    bindingId: input.binding.id,
    profileRef: input.binding.profileRef,
    findingDefinitionId: input.findingDefinitionId,
    outcomeId: input.outcomeId,
    stableDrawId: input.stableDrawId,
  });

const buildCandidate = (input: {
  readonly conditionFindingRef: {
    readonly id: string;
    readonly payloadFingerprint: string;
  };
  readonly horizonRef: {
    readonly id: string;
    readonly fingerprint: string;
  };
  readonly binding: BackgroundFindingProfileBinding;
  readonly profile: BackgroundFindingOutcomeProfile;
  readonly findingDefinitionId: string;
  readonly findingDefinitionContentVersion: string;
  readonly outcome: BackgroundFindingOutcomeProfile['outcomes'][number];
  readonly stableDrawId: string;
}): FindingResolutionCandidate => {
  const candidateId = candidateIdentity({
    conditionFindingRef: input.conditionFindingRef,
    horizonRef: input.horizonRef,
    binding: input.binding,
    findingDefinitionId: input.findingDefinitionId,
    outcomeId: input.outcome.id,
    stableDrawId: input.stableDrawId,
  });
  const provenanceIds = profileProvenanceIds(input.profile);
  return {
    schemaVersion: 1,
    id: candidateId,
    findingDefinitionId: input.findingDefinitionId,
    findingDefinitionContentVersion: input.findingDefinitionContentVersion,
    kind: 'background_variation',
    proposedValue: { ...input.outcome.proposedValue },
    uncertainty: input.outcome.uncertainty,
    contributions: [
      {
        schemaVersion: 1,
        id: stableId('finding-contribution.background.catalog-definition', {
          candidateId,
          findingDefinitionId: input.findingDefinitionId,
        }),
        ownerKind: 'catalog_definition',
        ownerId: input.findingDefinitionId,
        ownerContentVersion: input.findingDefinitionContentVersion,
        role: 'identity',
        provenanceIds: [],
      },
      {
        schemaVersion: 1,
        id: stableId('finding-contribution.background.generation-profile', {
          candidateId,
          profileRef: input.binding.profileRef,
        }),
        ownerKind: 'generation_profile',
        ownerId: input.profile.id,
        ownerContentVersion: input.profile.contentVersion,
        role: 'generated_value',
        provenanceIds,
      },
    ],
    resolution: {
      origin: 'deterministic_generation',
      generationProfileId: input.profile.id,
      generationProfileContentVersion: input.profile.contentVersion,
      resolverVersion: BACKGROUND_FINDING_OUTCOME_SELECTOR_VERSION,
      stableDrawId: input.stableDrawId,
    },
    review: normalizeReview(input.profile.review),
  };
};

const artifactPayload = (
  artifact: Omit<BackgroundFindingOutcomeArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  resolverVersion: artifact.resolverVersion,
  requestId: artifact.requestId,
  conditionFindingRef: artifact.conditionFindingRef,
  horizonRef: artifact.horizonRef,
  seed: artifact.seed,
  profileReferences: artifact.profileReferences,
  profileBindings: artifact.profileBindings,
  selections: artifact.selections,
  candidates: artifact.candidates,
  inputFingerprint: artifact.inputFingerprint,
});

const buildArtifact = (
  request: BackgroundFindingOutcomeRequest,
): BackgroundFindingOutcomeArtifact => {
  const conditionFindingRef = {
    id: request.conditionFindingArtifact.id,
    payloadFingerprint: request.conditionFindingArtifact.payloadFingerprint,
  };
  const horizonRef = {
    id: request.horizon.id,
    fingerprint: fingerprintBackgroundFindingHorizon(request.horizon),
  };
  const profileById = new Map(request.profiles.map((profile) => [profile.id, profile]));
  const targetById = new Map(request.horizon.targets.map((target) => [target.id, target]));
  const selections: BackgroundFindingSelectionEvaluation[] = [];
  const candidates: FindingResolutionCandidate[] = [];

  for (const binding of request.profileBindings) {
    const profile = profileById.get(binding.profileRef.id)!;
    const target = targetById.get(binding.horizonTargetId)!;
    const draw = drawContext({
      conditionFindingRef,
      horizonRef,
      binding,
      findingDefinitionId: target.findingDefinitionId,
      seed: request.seed,
    });
    const selected = weightedChoice(profile.outcomes, seededUnit(request.seed, draw.key));
    const candidate = buildCandidate({
      conditionFindingRef,
      horizonRef,
      binding,
      profile,
      findingDefinitionId: target.findingDefinitionId,
      findingDefinitionContentVersion: target.findingDefinitionContentVersion,
      outcome: selected,
      stableDrawId: draw.stableDrawId,
    });
    candidates.push(candidate);
    selections.push({
      bindingId: binding.id,
      horizonTargetId: target.id,
      findingDefinitionId: target.findingDefinitionId,
      findingDefinitionContentVersion: target.findingDefinitionContentVersion,
      profileRef: { ...binding.profileRef },
      profileFingerprint: binding.profileFingerprint,
      stableDrawId: draw.stableDrawId,
      developerOpinionIds: [...profile.developerOpinionIds],
      review: normalizeReview(profile.review),
      outcomeEvaluations: profile.outcomes.map((outcome) => ({
        outcomeId: outcome.id,
        proposedValue: { ...outcome.proposedValue },
        uncertainty: outcome.uncertainty,
        gameGenerationWeight: outcome.gameGenerationWeight,
        selected: outcome.id === selected.id,
        candidateId: outcome.id === selected.id ? candidate.id : null,
      })),
    });
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    resolverVersion: BACKGROUND_FINDING_OUTCOME_SELECTOR_VERSION,
    requestId: request.id,
    conditionFindingRef,
    horizonRef,
    seed: request.seed,
    profileReferences: request.profiles.map((profile) => ({
      id: profile.id,
      contentVersion: profile.contentVersion,
      fingerprint: fingerprintBackgroundFindingOutcomeProfile(profile),
    })),
    profileBindings: request.profileBindings.map((binding) => ({
      ...binding,
      profileRef: { ...binding.profileRef },
    })),
    selections: selections.sort((left, right) => compareStrings(left.bindingId, right.bindingId)),
    candidates: candidates.sort((left, right) => compareStrings(left.id, right.id)),
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
  return BackgroundFindingOutcomeArtifactSchema.parse({
    ...withoutIdentity,
    id: `background-finding-outcomes.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
};

const invalidCandidateValue = (request: BackgroundFindingOutcomeRequest): string | null => {
  const definitionById = new Map(
    request.findingDefinitions.map((definition) => [definition.id, definition]),
  );
  for (const profile of request.profiles) {
    const definition = definitionById.get(profile.findingDefinitionId)!;
    for (const outcome of profile.outcomes) {
      if (!definition.valueSpecification.allowedValues.includes(outcome.proposedValue.value)) {
        return `${profile.id} outcome ${outcome.id} proposes ${outcome.proposedValue.value}, which is unavailable in ${definition.id}@${definition.contentVersion}.`;
      }
    }
  }
  return null;
};

export const selectBackgroundFindingOutcomes = (
  input: unknown,
): BackgroundFindingOutcomeSelectionResult => {
  const parsed = BackgroundFindingOutcomeRequestSchema.safeParse(input);
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
  const conditionFindingIntegrity = verifyConditionFindingCardinalityIntegrity(
    request.conditionFindingArtifact,
  );
  if (!conditionFindingIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CONDITION_FINDING_ARTIFACT',
        message: `${conditionFindingIntegrity.error.code}: ${conditionFindingIntegrity.error.message}`,
      },
    };
  }
  const profileById = new Map(request.profiles.map((profile) => [profile.id, profile]));
  for (const binding of request.profileBindings) {
    const profile = profileById.get(binding.profileRef.id)!;
    const expectedFingerprint = fingerprintBackgroundFindingOutcomeProfile(profile);
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

const expectedDrawContext = (
  artifact: BackgroundFindingOutcomeArtifact,
  binding: BackgroundFindingProfileBinding,
  findingDefinitionId: string,
): { readonly key: string; readonly stableDrawId: string } =>
  drawContext({
    conditionFindingRef: artifact.conditionFindingRef,
    horizonRef: artifact.horizonRef,
    binding,
    findingDefinitionId,
    seed: artifact.seed,
  });

export const verifyBackgroundFindingOutcomeIntegrity = (
  value: unknown,
): BackgroundFindingOutcomeIntegrityResult => {
  const parsed = BackgroundFindingOutcomeArtifactSchema.safeParse(value);
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
  if (artifact.resolverVersion !== BACKGROUND_FINDING_OUTCOME_SELECTOR_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_RESOLVER_VERSION',
        message: `${artifact.id} uses unsupported background selector ${artifact.resolverVersion}.`,
      },
    };
  }
  const bindingById = new Map(artifact.profileBindings.map((binding) => [binding.id, binding]));
  const selectionByCandidateId = new Map<
    string,
    {
      readonly selection: BackgroundFindingSelectionEvaluation;
      readonly outcome: BackgroundFindingSelectionEvaluation['outcomeEvaluations'][number];
    }
  >();
  for (const selection of artifact.selections) {
    const binding = bindingById.get(selection.bindingId)!;
    const expectedContext = expectedDrawContext(artifact, binding, selection.findingDefinitionId);
    if (selection.stableDrawId !== expectedContext.stableDrawId) {
      return {
        ok: false,
        error: {
          code: 'DRAW_CONTEXT_MISMATCH',
          message: `${selection.bindingId} does not match its saved background-outcome draw context.`,
        },
      };
    }
    const selected = selection.outcomeEvaluations.find((outcome) => outcome.selected)!;
    const expectedSelected = weightedChoice(
      [...selection.outcomeEvaluations].sort((left, right) =>
        compareStrings(left.outcomeId, right.outcomeId),
      ),
      seededUnit(artifact.seed, expectedContext.key),
    );
    if (selected.outcomeId !== expectedSelected.outcomeId) {
      return {
        ok: false,
        error: {
          code: 'DRAW_CONTEXT_MISMATCH',
          message: `${selection.bindingId} selected an outcome inconsistent with its frozen weights, seed, and draw context.`,
        },
      };
    }
    const reconstructedProfile: BackgroundFindingOutcomeProfile = {
      schemaVersion: 1,
      contentVersion: selection.profileRef.contentVersion,
      id: selection.profileRef.id,
      modelVersion: 'weighted-background-finding.v1',
      findingDefinitionId: selection.findingDefinitionId,
      findingDefinitionContentVersion: selection.findingDefinitionContentVersion,
      outcomes: selection.outcomeEvaluations.map((outcome) => ({
        schemaVersion: 1,
        id: outcome.outcomeId,
        proposedValue: { ...outcome.proposedValue },
        uncertainty: outcome.uncertainty,
        gameGenerationWeight: outcome.gameGenerationWeight,
      })),
      developerOpinionIds: [...selection.developerOpinionIds],
      review: { ...selection.review },
    };
    if (
      fingerprintBackgroundFindingOutcomeProfile(reconstructedProfile) !==
      selection.profileFingerprint
    ) {
      return {
        ok: false,
        error: {
          code: 'PROVENANCE_MISMATCH',
          message: `${selection.bindingId} does not preserve the exact profile payload named by its fingerprint.`,
        },
      };
    }
    selectionByCandidateId.set(selected.candidateId!, { selection, outcome: selected });
  }
  for (const candidate of artifact.candidates) {
    const matched = selectionByCandidateId.get(candidate.id)!;
    const { selection, outcome } = matched;
    const binding = bindingById.get(selection.bindingId)!;
    const expectedCandidateId = candidateIdentity({
      conditionFindingRef: artifact.conditionFindingRef,
      horizonRef: artifact.horizonRef,
      binding,
      findingDefinitionId: selection.findingDefinitionId,
      outcomeId: outcome.outcomeId,
      stableDrawId: selection.stableDrawId,
    });
    const expectedProvenanceIds = uniqueSorted([
      ...selection.review.sourceUseNoteIds,
      ...selection.developerOpinionIds,
    ]);
    const definitionContribution = candidate.contributions.find(
      (contribution) =>
        contribution.ownerKind === 'catalog_definition' &&
        contribution.ownerId === selection.findingDefinitionId &&
        contribution.ownerContentVersion === selection.findingDefinitionContentVersion,
    );
    const profileContribution = candidate.contributions.find(
      (contribution) =>
        contribution.ownerKind === 'generation_profile' &&
        contribution.ownerId === selection.profileRef.id &&
        contribution.ownerContentVersion === selection.profileRef.contentVersion,
    );
    if (
      candidate.id !== expectedCandidateId ||
      candidate.kind !== 'background_variation' ||
      candidate.findingDefinitionId !== selection.findingDefinitionId ||
      candidate.findingDefinitionContentVersion !== selection.findingDefinitionContentVersion ||
      JSON.stringify(candidate.proposedValue) !== JSON.stringify(outcome.proposedValue) ||
      candidate.uncertainty !== outcome.uncertainty ||
      JSON.stringify(candidate.review) !== JSON.stringify(normalizeReview(selection.review)) ||
      candidate.contributions.length !== 2 ||
      !definitionContribution ||
      definitionContribution.id !==
        stableId('finding-contribution.background.catalog-definition', {
          candidateId: candidate.id,
          findingDefinitionId: selection.findingDefinitionId,
        }) ||
      definitionContribution.role !== 'identity' ||
      definitionContribution.provenanceIds.length !== 0 ||
      !profileContribution ||
      profileContribution.id !==
        stableId('finding-contribution.background.generation-profile', {
          candidateId: candidate.id,
          profileRef: selection.profileRef,
        }) ||
      profileContribution.role !== 'generated_value' ||
      profileContribution.provenanceIds.join('\u0000') !== expectedProvenanceIds.join('\u0000') ||
      candidate.resolution?.origin !== 'deterministic_generation' ||
      candidate.resolution.generationProfileId !== selection.profileRef.id ||
      candidate.resolution.generationProfileContentVersion !==
        selection.profileRef.contentVersion ||
      candidate.resolution.resolverVersion !== artifact.resolverVersion ||
      candidate.resolution.stableDrawId !== selection.stableDrawId
    ) {
      return {
        ok: false,
        error: {
          code: 'PROVENANCE_MISMATCH',
          message: `${candidate.id} does not preserve its exact background profile, outcome, and draw provenance.`,
        },
      };
    }
  }

  const expectedPayloadFingerprint = fingerprint('output', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `background-finding-outcomes.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen background-finding payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyBackgroundFindingOutcomeContext = (input: {
  readonly artifact: unknown;
  readonly request: unknown;
}): BackgroundFindingOutcomeContextResult => {
  const integrity = verifyBackgroundFindingOutcomeIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = selectBackgroundFindingOutcomes(input.request);
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
        message: `${integrity.value.id} does not match deterministic selection from its exact D-197 artifact, horizon, profiles, definitions, bindings, and seed.`,
      },
    };
  }
  return { ok: true, value: integrity.value };
};
