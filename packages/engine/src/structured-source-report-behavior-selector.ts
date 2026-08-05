import {
  PatientTemplateSchema,
  StructuredSourceReportSelectionArtifactSchema,
  StructuredSourceReportSelectionRequestSchema,
  type ClinicalRuleReview,
  type PatientTemplate,
  type StructuredSourceReportProfile,
  type StructuredSourceReportSelectionArtifact,
  type StructuredSourceReportSelectionFingerprint,
  type StructuredSourceReportSelectionHorizon,
  type StructuredSourceReportSelectionProfile,
  type StructuredSourceReportSelectionRequest,
  type UniversalActionResultAssemblyRecipe,
} from '@psychsim/schemas';

import { seededUnit } from './rng';
import {
  fingerprintStructuredSourceReportDefinition,
  fingerprintStructuredSourceReportProfile,
  normalizeStructuredSourceReportProfile,
} from './structured-source-report-compiler';
import { verifyOptionalFeatureBudgetSelectionIntegrity } from './optional-feature-budget-selector';
import {
  fingerprintUniversalActionResultAssemblyRecipe,
  normalizeUniversalActionResultAssemblyRecipe,
} from './universal-action-result-compiler';

export const STRUCTURED_SOURCE_REPORT_BEHAVIOR_SELECTOR_VERSION = '2.0.0';

export type StructuredSourceReportBehaviorSelectionResult =
  | { readonly ok: true; readonly value: StructuredSourceReportSelectionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'TEMPLATE_ASSEMBLY_MISMATCH'
          | 'STALE_ASSEMBLY_FINGERPRINT'
          | 'STALE_HORIZON_FINGERPRINT'
          | 'STALE_DEFINITION_FINGERPRINT'
          | 'STALE_PROFILE_FINGERPRINT'
          | 'OPTIONAL_FEATURE_ARTIFACT_INVALID'
          | 'SOURCE_KIND_NOT_ALLOWED'
          | 'PROFILE_BEHAVIOR_COVERAGE_MISMATCH'
          | 'PROFILE_SLOT_CONTEXT_MISMATCH'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type StructuredSourceReportBehaviorSelectionIntegrityResult =
  | { readonly ok: true; readonly value: StructuredSourceReportSelectionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_RESOLVER_VERSION'
          | 'REPLAY_FAILED'
          | 'REPLAY_MISMATCH';
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

const fingerprint = (scope: string, value: unknown): StructuredSourceReportSelectionFingerprint =>
  `fingerprint.structured-source-report-selection.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalizeObjectKeys(value)))}`;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const fail = (
  code: Extract<StructuredSourceReportBehaviorSelectionResult, { ok: false }>['error']['code'],
  message: string,
  contentIds: readonly string[],
): StructuredSourceReportBehaviorSelectionResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

const normalizeReview = (review: ClinicalRuleReview): ClinicalRuleReview => ({
  ...review,
  sourceUseNoteIds: uniqueSorted(review.sourceUseNoteIds),
});

const normalizeTemplate = (template: PatientTemplate): PatientTemplate =>
  PatientTemplateSchema.parse({
    ...template,
    review: normalizeReview(template.review),
    compatibleLocationRefs: [...template.compatibleLocationRefs].sort((left, right) =>
      compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
    ),
    requiredConditions: [...template.requiredConditions]
      .map((condition) => ({
        ...condition,
        specifierIds: [...condition.specifierIds].sort(compareStrings),
      }))
      .sort((left, right) => compareStrings(left.id, right.id)),
    optionalConditionSelectionGroups: [...template.optionalConditionSelectionGroups]
      .map((group) => ({
        ...group,
        candidates: [...group.candidates]
          .map((condition) => ({
            ...condition,
            specifierIds: [...condition.specifierIds].sort(compareStrings),
          }))
          .sort((left, right) => compareStrings(left.id, right.id)),
      }))
      .sort((left, right) => compareStrings(left.id, right.id)),
    presentationRichnessEnvelope: {
      ...template.presentationRichnessEnvelope,
      decisionDriverCategories: [
        ...template.presentationRichnessEnvelope.decisionDriverCategories,
      ].sort(compareStrings),
    },
  });

const normalizeHorizon = (
  horizon: StructuredSourceReportSelectionHorizon,
): StructuredSourceReportSelectionHorizon => ({
  ...horizon,
  assemblyRecipeRef: { ...horizon.assemblyRecipeRef },
  pools: [...horizon.pools]
    .map((pool) => ({
      ...pool,
      definitionRef: { ...pool.definitionRef },
      source: { ...pool.source },
      dependencyGroupIds: uniqueSorted(pool.dependencyGroupIds),
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
});

const normalizeSelectionProfile = (
  profile: StructuredSourceReportSelectionProfile,
): StructuredSourceReportSelectionProfile => ({
  ...profile,
  horizonRef: { ...profile.horizonRef },
  policies: [...profile.policies]
    .map((policy) =>
      policy.mode === 'fixed'
        ? {
            ...policy,
            candidate: {
              ...policy.candidate,
              profileRef: { ...policy.candidate.profileRef },
            },
          }
        : policy.mode === 'weighted'
          ? {
              ...policy,
              candidates: [...policy.candidates]
                .map((candidate) => ({
                  ...candidate,
                  profileRef: { ...candidate.profileRef },
                }))
                .sort((left, right) =>
                  compareStrings(
                    `${left.profileRef.id}@${left.profileRef.contentVersion}`,
                    `${right.profileRef.id}@${right.profileRef.contentVersion}`,
                  ),
                ),
            }
          : {
              ...policy,
              baseCandidate: {
                ...policy.baseCandidate,
                profileRef: { ...policy.baseCandidate.profileRef },
              },
              modifiers: [...policy.modifiers]
                .map((modifier) => ({
                  ...modifier,
                  moduleRef: { ...modifier.moduleRef },
                  candidate: {
                    ...modifier.candidate,
                    profileRef: { ...modifier.candidate.profileRef },
                  },
                }))
                .sort((left, right) =>
                  compareStrings(
                    `${left.moduleRef.id}@${left.moduleRef.contentVersion}`,
                    `${right.moduleRef.id}@${right.moduleRef.contentVersion}`,
                  ),
                ),
            },
    )
    .sort((left, right) => compareStrings(left.slotId, right.slotId)),
  developerOpinionIds: uniqueSorted(profile.developerOpinionIds),
  review: normalizeReview(profile.review),
});

const normalizeRequest = (
  request: StructuredSourceReportSelectionRequest,
): StructuredSourceReportSelectionRequest =>
  StructuredSourceReportSelectionRequestSchema.parse({
    ...request,
    template: normalizeTemplate(request.template),
    assemblyRecipe: normalizeUniversalActionResultAssemblyRecipe(request.assemblyRecipe),
    horizon: normalizeHorizon(request.horizon),
    selectionProfile: normalizeSelectionProfile(request.selectionProfile),
    profiles: [...request.profiles]
      .map(normalizeStructuredSourceReportProfile)
      .sort((left, right) =>
        compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
      ),
    ...(request.optionalFeatureArtifact === undefined
      ? {}
      : { optionalFeatureArtifact: request.optionalFeatureArtifact }),
  });

export const fingerprintStructuredSourceReportSelectionTemplate = (
  template: PatientTemplate,
): StructuredSourceReportSelectionFingerprint =>
  fingerprint('template', normalizeTemplate(template));

export const fingerprintStructuredSourceReportSelectionAssembly = (
  assembly: UniversalActionResultAssemblyRecipe,
): StructuredSourceReportSelectionFingerprint =>
  fingerprint('assembly', normalizeUniversalActionResultAssemblyRecipe(assembly));

export const fingerprintStructuredSourceReportSelectionHorizon = (
  horizon: StructuredSourceReportSelectionHorizon,
): StructuredSourceReportSelectionFingerprint => fingerprint('horizon', normalizeHorizon(horizon));

export const fingerprintStructuredSourceReportSelectionProfile = (
  profile: StructuredSourceReportSelectionProfile,
): StructuredSourceReportSelectionFingerprint =>
  fingerprint('profile', normalizeSelectionProfile(profile));

const versionedKey = (value: { readonly id: string; readonly contentVersion: string }): string =>
  `${value.id}\u0000${value.contentVersion}`;

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

const slotDrawContext = (input: {
  readonly request: StructuredSourceReportSelectionRequest;
  readonly pool: StructuredSourceReportSelectionHorizon['pools'][number];
  readonly policy: Extract<
    StructuredSourceReportSelectionProfile['policies'][number],
    { readonly mode: 'weighted' }
  >;
}): { readonly key: string; readonly stableDrawId: string } => {
  const payload = {
    resolverVersion: STRUCTURED_SOURCE_REPORT_BEHAVIOR_SELECTOR_VERSION,
    careSetting: input.request.template.careSetting,
    horizonId: input.request.horizon.id,
    selectionProfileId: input.request.selectionProfile.id,
    slotId: input.pool.id,
    definitionRef: input.pool.definitionRef,
    source: input.pool.source,
    timeScopeId: input.pool.timeScopeId,
    claimOriginId: input.pool.claimOriginId,
    dependencyGroupIds: input.pool.dependencyGroupIds,
    candidates: input.policy.candidates,
  };
  const key = JSON.stringify(canonicalizeObjectKeys(payload));
  return {
    key,
    stableDrawId: stableId('stable-draw.structured-source-report.behavior', {
      ...payload,
      seedFingerprint: hashToHex64(input.request.seed),
    }),
  };
};

const artifactPayload = (
  artifact: Omit<StructuredSourceReportSelectionArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  resolverVersion: artifact.resolverVersion,
  requestId: artifact.requestId,
  seed: artifact.seed,
  careSetting: artifact.careSetting,
  templateRef: artifact.templateRef,
  assemblyRecipeRef: artifact.assemblyRecipeRef,
  horizonRef: artifact.horizonRef,
  selectionProfileRef: artifact.selectionProfileRef,
  selections: artifact.selections,
  selectedProfileRefs: artifact.selectedProfileRefs,
  request: artifact.request,
  inputFingerprint: artifact.inputFingerprint,
});

const buildArtifact = (
  request: StructuredSourceReportSelectionRequest,
): StructuredSourceReportSelectionArtifact => {
  const policyBySlotId = new Map(
    request.selectionProfile.policies.map((policy) => [policy.slotId, policy] as const),
  );
  const selections: StructuredSourceReportSelectionArtifact['selections'] = [];
  const selectedProfileRefs: StructuredSourceReportSelectionArtifact['selectedProfileRefs'] = [];

  for (const pool of request.horizon.pools) {
    const policy = policyBySlotId.get(pool.id)!;
    if (policy.mode === 'fixed') {
      const selected = policy.candidate;
      selections.push({
        poolId: pool.id,
        definitionRef: { ...pool.definitionRef },
        definitionFingerprint: pool.definitionFingerprint,
        source: { ...pool.source },
        timeScopeId: pool.timeScopeId,
        claimOriginId: pool.claimOriginId,
        dependencyGroupIds: [...pool.dependencyGroupIds],
        mode: 'fixed',
        stableDrawId: null,
        candidateEvaluations: [
          {
            profileRef: { ...selected.profileRef },
            profileFingerprint: selected.profileFingerprint,
            gameGenerationWeight: null,
            normalizedGameSelectionProbability: null,
            selected: true,
          },
        ],
        selectedProfileRef: { ...selected.profileRef },
        selectedProfileFingerprint: selected.profileFingerprint,
      });
      selectedProfileRefs.push({
        ...selected.profileRef,
        fingerprint: selected.profileFingerprint,
      });
      continue;
    }

    if (policy.mode === 'complexity_gated') {
      const optionalEvaluations = new Map(
        request.optionalFeatureArtifact!.candidateEvaluations.map((evaluation) => [
          evaluation.moduleRef.id,
          evaluation,
        ]),
      );
      const selectedModifier = policy.modifiers.find(
        (modifier) => optionalEvaluations.get(modifier.moduleRef.id)?.disposition === 'selected',
      );
      const selected = selectedModifier?.candidate ?? policy.baseCandidate;
      const selectedOptionalEvaluation =
        selectedModifier === undefined
          ? undefined
          : optionalEvaluations.get(selectedModifier.moduleRef.id);
      selections.push({
        poolId: pool.id,
        definitionRef: { ...pool.definitionRef },
        definitionFingerprint: pool.definitionFingerprint,
        source: { ...pool.source },
        timeScopeId: pool.timeScopeId,
        claimOriginId: pool.claimOriginId,
        dependencyGroupIds: [...pool.dependencyGroupIds],
        mode: 'complexity_gated',
        stableDrawId: selectedOptionalEvaluation?.stableDrawId ?? null,
        candidateEvaluations: [
          {
            profileRef: { ...policy.baseCandidate.profileRef },
            profileFingerprint: policy.baseCandidate.profileFingerprint,
            gameGenerationWeight: null,
            normalizedGameSelectionProbability: null,
            selected: selectedModifier === undefined,
          },
          ...policy.modifiers.map((modifier) => {
            const optionalEvaluation = optionalEvaluations.get(modifier.moduleRef.id)!;
            const selectedInComplexityBudget = optionalEvaluation.disposition === 'selected';
            return {
              profileRef: { ...modifier.candidate.profileRef },
              profileFingerprint: modifier.candidate.profileFingerprint,
              gameGenerationWeight: null,
              normalizedGameSelectionProbability: null,
              complexityModule: {
                moduleRef: { ...modifier.moduleRef },
                moduleFingerprint: modifier.moduleFingerprint,
                optionalFeatureBindingId: modifier.optionalFeatureBindingId,
                selectedModuleId: modifier.selectedModuleId,
                cost: optionalEvaluation.moduleSnapshot.cost,
                selectedInComplexityBudget,
                selectionOrdinal: optionalEvaluation.selectionOrdinal,
                stableDrawId: optionalEvaluation.stableDrawId,
              },
              selected:
                selectedModifier?.moduleRef.id === modifier.moduleRef.id &&
                selectedModifier.moduleRef.contentVersion === modifier.moduleRef.contentVersion,
            };
          }),
        ],
        selectedProfileRef: { ...selected.profileRef },
        selectedProfileFingerprint: selected.profileFingerprint,
      });
      selectedProfileRefs.push({
        ...selected.profileRef,
        fingerprint: selected.profileFingerprint,
      });
      continue;
    }

    const draw = slotDrawContext({ request, pool, policy });
    const selected = weightedChoice(policy.candidates, seededUnit(request.seed, draw.key));
    const totalWeight = policy.candidates.reduce(
      (sum, candidate) => sum + candidate.gameGenerationWeight,
      0,
    );
    selections.push({
      poolId: pool.id,
      definitionRef: { ...pool.definitionRef },
      definitionFingerprint: pool.definitionFingerprint,
      source: { ...pool.source },
      timeScopeId: pool.timeScopeId,
      claimOriginId: pool.claimOriginId,
      dependencyGroupIds: [...pool.dependencyGroupIds],
      mode: 'weighted',
      stableDrawId: draw.stableDrawId,
      candidateEvaluations: policy.candidates.map((candidate) => ({
        profileRef: { ...candidate.profileRef },
        profileFingerprint: candidate.profileFingerprint,
        gameGenerationWeight: candidate.gameGenerationWeight,
        normalizedGameSelectionProbability: {
          numerator: candidate.gameGenerationWeight,
          denominator: totalWeight,
          decimal: candidate.gameGenerationWeight / totalWeight,
        },
        selected:
          candidate.profileRef.id === selected.profileRef.id &&
          candidate.profileRef.contentVersion === selected.profileRef.contentVersion,
      })),
      selectedProfileRef: { ...selected.profileRef },
      selectedProfileFingerprint: selected.profileFingerprint,
    });
    selectedProfileRefs.push({
      ...selected.profileRef,
      fingerprint: selected.profileFingerprint,
    });
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    resolverVersion: STRUCTURED_SOURCE_REPORT_BEHAVIOR_SELECTOR_VERSION,
    requestId: request.id,
    seed: request.seed,
    careSetting: request.template.careSetting,
    templateRef: {
      id: request.template.id,
      contentVersion: request.template.contentVersion,
      fingerprint: fingerprintStructuredSourceReportSelectionTemplate(request.template),
    },
    assemblyRecipeRef: {
      id: request.assemblyRecipe.id,
      contentVersion: request.assemblyRecipe.contentVersion,
      fingerprint: fingerprintStructuredSourceReportSelectionAssembly(request.assemblyRecipe),
    },
    horizonRef: {
      id: request.horizon.id,
      contentVersion: request.horizon.contentVersion,
      fingerprint: fingerprintStructuredSourceReportSelectionHorizon(request.horizon),
    },
    selectionProfileRef: {
      id: request.selectionProfile.id,
      contentVersion: request.selectionProfile.contentVersion,
      fingerprint: fingerprintStructuredSourceReportSelectionProfile(request.selectionProfile),
    },
    selections,
    selectedProfileRefs: selectedProfileRefs.sort((left, right) =>
      compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
    ),
    request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
  return StructuredSourceReportSelectionArtifactSchema.parse({
    ...withoutIdentity,
    id: `structured-source-report-selection.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
};

/**
 * Selects one complete reviewed D-215 behavior profile for every exact
 * source-view slot. Fixed slots do not draw. Weighted slots normalize only
 * their own mutually exclusive alternatives and use independent stable
 * substreams. Complexity-gated slots reuse an already-selected D-201
 * source-report module and its original cost/draw without selecting or
 * spending again. No patient truth, action cost, score, economy, persistence,
 * or runtime state participates.
 */
export const selectStructuredSourceReportBehaviors = (
  input: unknown,
): StructuredSourceReportBehaviorSelectionResult => {
  const parsed = StructuredSourceReportSelectionRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }
  const request = normalizeRequest(parsed.data);
  const assemblyFingerprint = fingerprintUniversalActionResultAssemblyRecipe(
    request.assemblyRecipe,
  );
  if (
    request.template.universalActionResultAssemblyRecipeFingerprint !== assemblyFingerprint ||
    request.template.universalActionResultAssemblyRecipeRef.id !== request.assemblyRecipe.id ||
    request.template.universalActionResultAssemblyRecipeRef.contentVersion !==
      request.assemblyRecipe.contentVersion
  ) {
    return fail(
      'TEMPLATE_ASSEMBLY_MISMATCH',
      `${request.template.id} does not pin the exact universal action-result assembly.`,
      [request.template.id, request.assemblyRecipe.id],
    );
  }
  if (
    request.horizon.assemblyRecipeFingerprint !==
    fingerprintStructuredSourceReportSelectionAssembly(request.assemblyRecipe)
  ) {
    return fail(
      'STALE_ASSEMBLY_FINGERPRINT',
      `${request.horizon.id} does not pin the exact assembly payload.`,
      [request.horizon.id, request.assemblyRecipe.id],
    );
  }
  if (
    request.selectionProfile.horizonFingerprint !==
    fingerprintStructuredSourceReportSelectionHorizon(request.horizon)
  ) {
    return fail(
      'STALE_HORIZON_FINGERPRINT',
      `${request.selectionProfile.id} does not pin the exact source-view horizon payload.`,
      [request.selectionProfile.id, request.horizon.id],
    );
  }
  if (request.optionalFeatureArtifact !== undefined) {
    const optionalIntegrity = verifyOptionalFeatureBudgetSelectionIntegrity(
      request.optionalFeatureArtifact,
    );
    if (!optionalIntegrity.ok) {
      return fail(
        'OPTIONAL_FEATURE_ARTIFACT_INVALID',
        `${optionalIntegrity.error.code}: ${optionalIntegrity.error.message}`,
        [request.optionalFeatureArtifact.id],
      );
    }
  }

  const definitionsByKey = new Map(
    request.assemblyRecipe.structuredRevealDefinitions.map(
      (definition) => [versionedKey(definition), definition] as const,
    ),
  );
  const profilesByKey = new Map(
    request.profiles.map((profile) => [versionedKey(profile), profile] as const),
  );
  const policiesBySlotId = new Map(
    request.selectionProfile.policies.map((policy) => [policy.slotId, policy] as const),
  );
  for (const pool of request.horizon.pools) {
    const definition = definitionsByKey.get(versionedKey(pool.definitionRef));
    if (
      !definition ||
      pool.definitionFingerprint !== fingerprintStructuredSourceReportDefinition(definition)
    ) {
      return fail(
        'STALE_DEFINITION_FINGERPRINT',
        `${pool.id} does not pin the exact D-212 definition in the assembly.`,
        [pool.id, pool.definitionRef.id, request.assemblyRecipe.id],
      );
    }
    const policy = policiesBySlotId.get(pool.id)!;
    const candidates =
      policy.mode === 'fixed'
        ? [policy.candidate]
        : policy.mode === 'weighted'
          ? policy.candidates
          : [policy.baseCandidate, ...policy.modifiers.map((modifier) => modifier.candidate)];
    for (const candidate of candidates) {
      const profile = profilesByKey.get(versionedKey(candidate.profileRef));
      if (
        !profile ||
        candidate.profileFingerprint !== fingerprintStructuredSourceReportProfile(profile)
      ) {
        return fail(
          'STALE_PROFILE_FINGERPRINT',
          `${pool.id} does not pin the exact D-215 behavior profile payload.`,
          [pool.id, candidate.profileRef.id],
        );
      }
      if (!definition.allowedSourceKinds.includes(profile.source.kind)) {
        return fail(
          'SOURCE_KIND_NOT_ALLOWED',
          `${profile.source.kind} is not allowed by ${definition.id}.`,
          [pool.id, profile.id, definition.id, profile.source.sourceInstanceId],
        );
      }
      const expectedLanes = [...definition.lanes].sort(compareStrings);
      const actualLanes = profile.laneBehaviors
        .map((behavior) => behavior.lane)
        .sort(compareStrings);
      const expectedFields = [...definition.singletonFields].sort(compareStrings);
      const actualFields = profile.singletonBehaviors
        .map((behavior) => behavior.field)
        .sort(compareStrings);
      if (
        expectedLanes.join('\u0000') !== actualLanes.join('\u0000') ||
        expectedFields.join('\u0000') !== actualFields.join('\u0000')
      ) {
        return fail(
          'PROFILE_BEHAVIOR_COVERAGE_MISMATCH',
          `${profile.id} must resolve every lane and singleton declared by ${definition.id} exactly once.`,
          [pool.id, profile.id, definition.id, ...expectedLanes, ...expectedFields],
        );
      }
      if (
        profile.definitionRef.id !== pool.definitionRef.id ||
        profile.definitionRef.contentVersion !== pool.definitionRef.contentVersion ||
        profile.definitionFingerprint !== pool.definitionFingerprint ||
        profile.source.kind !== pool.source.kind ||
        profile.source.sourceInstanceId !== pool.source.sourceInstanceId ||
        profile.timeScopeId !== pool.timeScopeId ||
        profile.claimOriginId !== pool.claimOriginId ||
        profile.dependencyGroupIds.join('\u0000') !== pool.dependencyGroupIds.join('\u0000')
      ) {
        return fail(
          'PROFILE_SLOT_CONTEXT_MISMATCH',
          `${profile.id} is not the exact complete behavior profile for source-view slot ${pool.id}.`,
          [pool.id, profile.id, pool.definitionRef.id, profile.source.sourceInstanceId],
        );
      }
    }
  }

  try {
    return { ok: true, value: buildArtifact(request) };
  } catch (error) {
    return fail('INVALID_OUTPUT', error instanceof Error ? error.message : String(error), [
      request.id,
      request.template.id,
      request.horizon.id,
      request.selectionProfile.id,
    ]);
  }
};

export const verifyStructuredSourceReportBehaviorSelectionIntegrity = (
  value: unknown,
): StructuredSourceReportBehaviorSelectionIntegrityResult => {
  const parsed = StructuredSourceReportSelectionArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  if (parsed.data.resolverVersion !== STRUCTURED_SOURCE_REPORT_BEHAVIOR_SELECTOR_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_RESOLVER_VERSION',
        message: `${parsed.data.id} uses unsupported source-report behavior selector ${parsed.data.resolverVersion}.`,
      },
    };
  }
  const replay = selectStructuredSourceReportBehaviors(parsed.data.request);
  if (!replay.ok) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_FAILED',
        message: replay.error.message,
      },
    };
  }
  if (!sameExactValue(parsed.data, replay.value)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: `${parsed.data.id} does not match deterministic source-report behavior-selection replay.`,
      },
    };
  }
  return { ok: true, value: parsed.data };
};

export const getSelectedStructuredSourceReportProfiles = (
  value: unknown,
):
  | { readonly ok: true; readonly value: readonly StructuredSourceReportProfile[] }
  | {
      readonly ok: false;
      readonly error: Extract<
        StructuredSourceReportBehaviorSelectionIntegrityResult,
        { readonly ok: false }
      >['error'];
    } => {
  const integrity = verifyStructuredSourceReportBehaviorSelectionIntegrity(value);
  if (!integrity.ok) return integrity;
  const profilesByKey = new Map(
    integrity.value.request.profiles.map((profile) => [versionedKey(profile), profile] as const),
  );
  return {
    ok: true,
    value: integrity.value.selectedProfileRefs.map(
      (reference) => profilesByKey.get(versionedKey(reference))!,
    ),
  };
};
