import {
  WeightedFindingTendencyApplicabilityArtifactSchema,
  WeightedFindingTendencyApplicabilityRequestSchema,
  type ClinicalRuleReview,
  type DecisionMatchedPatientFactBinding,
  type DecisionPatientFactKey,
  type DecisionPatientPredicate,
  type FindingContribution,
  type WeightedFindingTendencyApplicabilityArtifact,
  type WeightedFindingTendencyApplicabilityDefinition,
  type WeightedFindingTendencyApplicabilityEvaluation,
  type WeightedFindingTendencyApplicabilityFingerprint,
  type WeightedFindingTendencyApplicabilityRequest,
  type WeightedFindingTendencyBinding,
  type WeightedFindingTendencyProfile,
} from '@psychsim/schemas';

import {
  verifyBackgroundFindingOutcomeIntegrity,
  type BackgroundFindingOutcomeIntegrityResult,
} from './background-finding-outcome-selector';
import {
  collectDecisionPatientFacts,
  matchDecisionPatientPredicateAgainstFacts,
  normalizeDecisionPatientPredicate,
  serializeDecisionPatientFactKey,
} from './decision-policy';
import { verifyResolvedPatientStateCompositionIntegrity } from './resolved-patient-state-composer';
import { fingerprintWeightedFindingTendencyProfile } from './weighted-finding-tendency-aggregator';

export const WEIGHTED_FINDING_TENDENCY_APPLICABILITY_COMPILER_VERSION = '1.0.0';

export type WeightedFindingTendencyApplicabilityCompileErrorCode =
  | 'INVALID_REQUEST'
  | 'INVALID_PATIENT_STATE_COMPOSITION'
  | 'PATIENT_STATE_COMPOSITION_BLOCKED'
  | 'INVALID_BACKGROUND_ARTIFACT'
  | 'STALE_PROFILE_FINGERPRINT'
  | 'APPLICABILITY_INDEX_STALE'
  | 'D199_BINDING_LIMIT_EXCEEDED'
  | 'INVALID_OUTPUT';

export type WeightedFindingTendencyApplicabilityCompileResult =
  | { readonly ok: true; readonly value: WeightedFindingTendencyApplicabilityArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: WeightedFindingTendencyApplicabilityCompileErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type WeightedFindingTendencyApplicabilityIntegrityResult =
  | { readonly ok: true; readonly value: WeightedFindingTendencyApplicabilityArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'INVALID_PATIENT_STATE_COMPOSITION'
          | 'INVALID_BACKGROUND_ARTIFACT'
          | 'REPLAY_MISMATCH';
        readonly message: string;
      };
    };

export type WeightedFindingTendencyApplicabilityContextResult =
  | { readonly ok: true; readonly value: WeightedFindingTendencyApplicabilityArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_ARTIFACT' | 'INVALID_REQUEST' | 'CONTEXT_MISMATCH';
        readonly message: string;
      };
    };

export interface WeightedFindingTendencyApplicabilityIndex {
  readonly compilerVersion: typeof WEIGHTED_FINDING_TENDENCY_APPLICABILITY_COMPILER_VERSION;
  readonly fingerprint: WeightedFindingTendencyApplicabilityFingerprint;
  readonly definitionKeys: readonly string[];
  readonly definitionFingerprintsByKey: ReadonlyMap<
    string,
    WeightedFindingTendencyApplicabilityFingerprint
  >;
  readonly definitionKeysByPatientFact: ReadonlyMap<string, readonly string[]>;
}

export interface WeightedFindingTendencyApplicabilityCompileOptions {
  readonly discoveryStrategy?: 'scan' | 'index';
  readonly applicabilityIndex?: WeightedFindingTendencyApplicabilityIndex;
}

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

const fingerprint = (
  scope: string,
  value: unknown,
): WeightedFindingTendencyApplicabilityFingerprint =>
  `fingerprint.weighted-finding-applicability.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalizeObjectKeys(value)))}`;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const definitionKey = (definition: {
  readonly id: string;
  readonly contentVersion: string;
}): string => `${definition.id}\u0000${definition.contentVersion}`;

const profileKey = (profile: { readonly id: string; readonly contentVersion: string }): string =>
  `${profile.id}\u0000${profile.contentVersion}`;

const normalizeReview = (review: ClinicalRuleReview): ClinicalRuleReview => ({
  ...review,
  sourceUseNoteIds: uniqueSorted(review.sourceUseNoteIds),
});

const normalizeFactBindings = (
  bindings: readonly DecisionMatchedPatientFactBinding[],
): DecisionMatchedPatientFactBinding[] =>
  [...bindings]
    .map((binding) => ({
      fact: { ...binding.fact },
      recordIds: uniqueSorted(binding.recordIds),
    }))
    .sort((left, right) =>
      compareStrings(
        serializeDecisionPatientFactKey(left.fact),
        serializeDecisionPatientFactKey(right.fact),
      ),
    );

const normalizeDefinition = (
  definition: WeightedFindingTendencyApplicabilityDefinition,
): WeightedFindingTendencyApplicabilityDefinition => ({
  ...definition,
  profileRef: { ...definition.profileRef },
  patientWhen: normalizeDecisionPatientPredicate(definition.patientWhen)!,
  developerOpinionIds: uniqueSorted(definition.developerOpinionIds),
  review: normalizeReview(definition.review),
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
      compareStrings(
        JSON.stringify(canonicalizeObjectKeys(left.proposedValue)),
        JSON.stringify(canonicalizeObjectKeys(right.proposedValue)),
      ),
    ),
  developerOpinionIds: uniqueSorted(profile.developerOpinionIds),
  review: normalizeReview(profile.review),
});

const normalizeRequest = (
  request: WeightedFindingTendencyApplicabilityRequest,
): WeightedFindingTendencyApplicabilityRequest => ({
  ...request,
  profiles: [...request.profiles]
    .map(normalizeProfile)
    .sort((left, right) => compareStrings(profileKey(left), profileKey(right))),
  applicabilityDefinitions: [...request.applicabilityDefinitions]
    .map(normalizeDefinition)
    .sort((left, right) => compareStrings(definitionKey(left), definitionKey(right))),
});

export const fingerprintWeightedFindingTendencyApplicabilityDefinition = (
  definition: WeightedFindingTendencyApplicabilityDefinition,
): WeightedFindingTendencyApplicabilityFingerprint =>
  fingerprint('definition', normalizeDefinition(definition));

const collectPredicateFacts = (
  predicate: DecisionPatientPredicate,
): readonly DecisionPatientFactKey[] => {
  switch (predicate.type) {
    case 'fact':
      return [predicate.fact];
    case 'same_record_all':
      return predicate.facts;
    case 'all':
    case 'any':
      return predicate.predicates.flatMap(collectPredicateFacts);
  }
};

const normalizeIndexEntries = (
  entries: ReadonlyMap<string, readonly string[]>,
): ReadonlyMap<string, readonly string[]> =>
  new Map(
    [...entries.entries()]
      .map(([fact, definitions]) => [fact, uniqueSorted(definitions)] as const)
      .sort(([left], [right]) => compareStrings(left, right)),
  );

const indexFingerprint = (input: {
  readonly definitionKeys: readonly string[];
  readonly definitionFingerprintsByKey: ReadonlyMap<
    string,
    WeightedFindingTendencyApplicabilityFingerprint
  >;
  readonly definitionKeysByPatientFact: ReadonlyMap<string, readonly string[]>;
}): WeightedFindingTendencyApplicabilityFingerprint =>
  fingerprint('index', {
    compilerVersion: WEIGHTED_FINDING_TENDENCY_APPLICABILITY_COMPILER_VERSION,
    definitionKeys: uniqueSorted(input.definitionKeys),
    definitionFingerprints: [...input.definitionFingerprintsByKey.entries()].sort(
      ([left], [right]) => compareStrings(left, right),
    ),
    entries: [...normalizeIndexEntries(input.definitionKeysByPatientFact).entries()],
  });

export const buildWeightedFindingTendencyApplicabilityIndex = (
  definitions: readonly WeightedFindingTendencyApplicabilityDefinition[],
): WeightedFindingTendencyApplicabilityIndex => {
  const normalized = [...definitions]
    .map(normalizeDefinition)
    .sort((left, right) => compareStrings(definitionKey(left), definitionKey(right)));
  const mutable = new Map<string, Set<string>>();
  for (const definition of normalized) {
    const key = definitionKey(definition);
    for (const fact of collectPredicateFacts(definition.patientWhen)) {
      const serialized = serializeDecisionPatientFactKey(fact);
      const values = mutable.get(serialized) ?? new Set<string>();
      values.add(key);
      mutable.set(serialized, values);
    }
  }
  const definitionKeysByPatientFact = normalizeIndexEntries(
    new Map([...mutable.entries()].map(([key, values]) => [key, [...values]] as const)),
  );
  const definitionKeys = normalized.map(definitionKey);
  const definitionFingerprintsByKey = new Map(
    normalized.map(
      (definition) =>
        [
          definitionKey(definition),
          fingerprintWeightedFindingTendencyApplicabilityDefinition(definition),
        ] as const,
    ),
  );
  return {
    compilerVersion: WEIGHTED_FINDING_TENDENCY_APPLICABILITY_COMPILER_VERSION,
    fingerprint: indexFingerprint({
      definitionKeys,
      definitionFingerprintsByKey,
      definitionKeysByPatientFact,
    }),
    definitionKeys,
    definitionFingerprintsByKey,
    definitionKeysByPatientFact,
  };
};

const exactIndex = (
  supplied: WeightedFindingTendencyApplicabilityIndex | undefined,
  expected: WeightedFindingTendencyApplicabilityIndex,
): boolean => {
  if (
    !supplied ||
    supplied.compilerVersion !== WEIGHTED_FINDING_TENDENCY_APPLICABILITY_COMPILER_VERSION ||
    supplied.fingerprint !==
      indexFingerprint({
        definitionKeys: supplied.definitionKeys,
        definitionFingerprintsByKey: supplied.definitionFingerprintsByKey,
        definitionKeysByPatientFact: supplied.definitionKeysByPatientFact,
      }) ||
    supplied.fingerprint !== expected.fingerprint
  ) {
    return false;
  }
  return (
    JSON.stringify(uniqueSorted(supplied.definitionKeys)) ===
      JSON.stringify(expected.definitionKeys) &&
    JSON.stringify([...supplied.definitionFingerprintsByKey.entries()].sort()) ===
      JSON.stringify([...expected.definitionFingerprintsByKey.entries()]) &&
    JSON.stringify([...normalizeIndexEntries(supplied.definitionKeysByPatientFact).entries()]) ===
      JSON.stringify([...expected.definitionKeysByPatientFact.entries()])
  );
};

const fail = (
  code: WeightedFindingTendencyApplicabilityCompileErrorCode,
  message: string,
  contentIds: readonly string[] = [],
): WeightedFindingTendencyApplicabilityCompileResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const verifyUpstreamBackground = (artifact: unknown): BackgroundFindingOutcomeIntegrityResult =>
  verifyBackgroundFindingOutcomeIntegrity(artifact);

const applicabilityContribution = (input: {
  readonly definition: WeightedFindingTendencyApplicabilityDefinition;
  readonly definitionFingerprint: WeightedFindingTendencyApplicabilityFingerprint;
  readonly backgroundSelectionBindingId: string;
  readonly horizonTargetId: string;
  readonly patientStateId: string;
  readonly patientStateFingerprint: string;
  readonly matchedPatientFactBindings: readonly DecisionMatchedPatientFactBinding[];
}): FindingContribution => {
  const identity = {
    patientStateId: input.patientStateId,
    patientStateFingerprint: input.patientStateFingerprint,
    definitionRef: {
      id: input.definition.id,
      contentVersion: input.definition.contentVersion,
      fingerprint: input.definitionFingerprint,
    },
    target: {
      backgroundSelectionBindingId: input.backgroundSelectionBindingId,
      horizonTargetId: input.horizonTargetId,
      findingDefinitionId: input.definition.findingDefinitionId,
      findingDefinitionContentVersion: input.definition.findingDefinitionContentVersion,
    },
    profileRef: input.definition.profileRef,
    profileFingerprint: input.definition.profileFingerprint,
    matchedPatientFactBindings: normalizeFactBindings(input.matchedPatientFactBindings),
  };
  return {
    schemaVersion: 1,
    id: stableId('finding-contribution.tendency-applicability', identity),
    ownerKind: 'generation_profile',
    ownerId: input.definition.id,
    ownerContentVersion: input.definition.contentVersion,
    role: 'constraint',
    provenanceIds: uniqueSorted([
      ...input.definition.review.sourceUseNoteIds,
      ...input.definition.developerOpinionIds,
    ]),
  };
};

const contributorBinding = (input: {
  readonly definition: WeightedFindingTendencyApplicabilityDefinition;
  readonly definitionFingerprint: WeightedFindingTendencyApplicabilityFingerprint;
  readonly backgroundSelectionBindingId: string;
  readonly horizonTargetId: string;
  readonly patientStateId: string;
  readonly patientStateFingerprint: string;
  readonly matchedPatientFactBindings: readonly DecisionMatchedPatientFactBinding[];
}): WeightedFindingTendencyBinding => {
  const contribution = applicabilityContribution(input);
  return {
    schemaVersion: 1,
    id: stableId('weighted-finding-tendency-binding.applicability', {
      contributionId: contribution.id,
      profileRef: input.definition.profileRef,
      profileFingerprint: input.definition.profileFingerprint,
      backgroundSelectionBindingId: input.backgroundSelectionBindingId,
    }),
    backgroundSelectionBindingId: input.backgroundSelectionBindingId,
    profileRef: { ...input.definition.profileRef },
    profileFingerprint: input.definition.profileFingerprint,
    applicabilityContributions: [contribution],
  };
};

const artifactPayload = (
  artifact: Omit<WeightedFindingTendencyApplicabilityArtifact, 'id' | 'payloadFingerprint'>,
): unknown => artifact;

export const compileWeightedFindingTendencyApplicability = (
  value: unknown,
  options: WeightedFindingTendencyApplicabilityCompileOptions = {},
): WeightedFindingTendencyApplicabilityCompileResult => {
  const parsed = WeightedFindingTendencyApplicabilityRequestSchema.safeParse(value);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues));
  }
  const request = normalizeRequest(parsed.data);
  const patientStateIntegrity = verifyResolvedPatientStateCompositionIntegrity(
    request.patientStateCompositionArtifact,
  );
  if (!patientStateIntegrity.ok) {
    return fail('INVALID_PATIENT_STATE_COMPOSITION', patientStateIntegrity.error.message, [
      request.patientStateCompositionArtifact.id,
    ]);
  }
  const patientComposition = patientStateIntegrity.value;
  if (
    patientComposition.status !== 'composed' ||
    patientComposition.composedPatientState === null ||
    patientComposition.composedPatientStateFingerprint === null
  ) {
    const blockerIds = patientComposition.blockers.flatMap((blocker) =>
      blocker.kind === 'literal_condition_incompatibility'
        ? blocker.conflictIds
        : [blocker.moduleDefinitionId, blocker.bindingId, blocker.selectedModuleId],
    );
    return fail(
      'PATIENT_STATE_COMPOSITION_BLOCKED',
      `${patientComposition.id} has no complete patient state; its upstream blockers remain authoritative.`,
      [patientComposition.id, ...blockerIds],
    );
  }
  const backgroundIntegrity = verifyUpstreamBackground(request.backgroundArtifact);
  if (!backgroundIntegrity.ok) {
    return fail('INVALID_BACKGROUND_ARTIFACT', backgroundIntegrity.error.message, [
      request.backgroundArtifact.id,
    ]);
  }

  const profileByKey = new Map(
    request.profiles.map((profile) => [profileKey(profile), profile] as const),
  );
  for (const definition of request.applicabilityDefinitions) {
    const profile = profileByKey.get(profileKey(definition.profileRef))!;
    const actualFingerprint = fingerprintWeightedFindingTendencyProfile(profile);
    if (actualFingerprint !== definition.profileFingerprint) {
      return fail(
        'STALE_PROFILE_FINGERPRINT',
        `${definition.id} does not pin the exact payload of ${profile.id}@${profile.contentVersion}.`,
        [definition.id, profile.id],
      );
    }
  }

  const expectedIndex = buildWeightedFindingTendencyApplicabilityIndex(
    request.applicabilityDefinitions,
  );
  const strategy = options.discoveryStrategy ?? 'scan';
  if (strategy === 'index' && !exactIndex(options.applicabilityIndex, expectedIndex)) {
    return fail(
      'APPLICABILITY_INDEX_STALE',
      'The supplied applicability index does not match the complete exact definition universe.',
      request.applicabilityDefinitions.map((definition) => definition.id),
    );
  }

  const patientFacts = collectDecisionPatientFacts(patientComposition.composedPatientState);
  const matchesByDefinitionKey = new Map(
    request.applicabilityDefinitions.map((definition) => [
      definitionKey(definition),
      matchDecisionPatientPredicateAgainstFacts(definition.patientWhen, patientFacts),
    ]),
  );
  if (strategy === 'index') {
    const indexedDefinitionKeys = new Set<string>();
    for (const fact of patientFacts) {
      for (const key of options.applicabilityIndex!.definitionKeysByPatientFact.get(
        serializeDecisionPatientFactKey(fact.key),
      ) ?? []) {
        indexedDefinitionKeys.add(key);
      }
    }
    const scanMatches = request.applicabilityDefinitions
      .filter((definition) => matchesByDefinitionKey.get(definitionKey(definition))!.matched)
      .map(definitionKey)
      .sort(compareStrings);
    const indexedMatches = request.applicabilityDefinitions
      .filter(
        (definition) =>
          indexedDefinitionKeys.has(definitionKey(definition)) &&
          matchesByDefinitionKey.get(definitionKey(definition))!.matched,
      )
      .map(definitionKey)
      .sort(compareStrings);
    if (JSON.stringify(scanMatches) !== JSON.stringify(indexedMatches)) {
      return fail(
        'APPLICABILITY_INDEX_STALE',
        'Indexed discovery did not produce the exact semantic full-scan match set.',
        request.applicabilityDefinitions.map((definition) => definition.id),
      );
    }
  }

  const selectionByFindingId = new Map(
    backgroundIntegrity.value.selections.map((selection) => [
      selection.findingDefinitionId,
      selection,
    ]),
  );
  const definitionReferences = request.applicabilityDefinitions.map((definition) => ({
    id: definition.id,
    contentVersion: definition.contentVersion,
    fingerprint: fingerprintWeightedFindingTendencyApplicabilityDefinition(definition),
  }));
  const definitionFingerprintByKey = new Map(
    definitionReferences.map((reference) => [definitionKey(reference), reference.fingerprint]),
  );
  const evaluations: WeightedFindingTendencyApplicabilityEvaluation[] = [];
  const bindings: WeightedFindingTendencyBinding[] = [];
  for (const definition of request.applicabilityDefinitions) {
    const match = matchesByDefinitionKey.get(definitionKey(definition))!;
    const matchedPatientFactBindings = match.matched ? normalizeFactBindings(match.bindings) : [];
    const selection = selectionByFindingId.get(definition.findingDefinitionId);
    const target =
      selection === undefined
        ? ({
            status: 'unavailable',
            reason: 'missing_finding',
            actualContentVersion: null,
          } as const)
        : selection.findingDefinitionContentVersion !== definition.findingDefinitionContentVersion
          ? ({
              status: 'unavailable',
              reason: 'content_version_mismatch',
              actualContentVersion: selection.findingDefinitionContentVersion,
            } as const)
          : ({
              status: 'available',
              backgroundSelectionBindingId: selection.bindingId,
              horizonTargetId: selection.horizonTargetId,
            } as const);
    const definitionFingerprint = definitionFingerprintByKey.get(definitionKey(definition))!;
    const binding =
      match.matched && target.status === 'available'
        ? contributorBinding({
            definition,
            definitionFingerprint,
            backgroundSelectionBindingId: target.backgroundSelectionBindingId,
            horizonTargetId: target.horizonTargetId,
            patientStateId: patientComposition.composedPatientState.id,
            patientStateFingerprint: patientComposition.composedPatientStateFingerprint,
            matchedPatientFactBindings,
          })
        : null;
    if (binding !== null) bindings.push(binding);
    evaluations.push({
      definitionRef: {
        id: definition.id,
        contentVersion: definition.contentVersion,
        fingerprint: definitionFingerprint,
      },
      findingDefinitionId: definition.findingDefinitionId,
      findingDefinitionContentVersion: definition.findingDefinitionContentVersion,
      profileRef: { ...definition.profileRef },
      profileFingerprint: definition.profileFingerprint,
      patientWhen: normalizeDecisionPatientPredicate(definition.patientWhen)!,
      patientPredicateMatched: match.matched,
      matchedPatientFactBindings,
      target,
      contributorBindingId: binding?.id ?? null,
      applicabilityContributionId: binding?.applicabilityContributions[0]!.id ?? null,
    });
  }
  const contributorBindings = bindings.sort((left, right) => compareStrings(left.id, right.id));
  const countByTarget = new Map<string, number>();
  for (const binding of contributorBindings) {
    countByTarget.set(
      binding.backgroundSelectionBindingId,
      (countByTarget.get(binding.backgroundSelectionBindingId) ?? 0) + 1,
    );
  }
  if ([...countByTarget.values()].some((count) => count > 64)) {
    return fail(
      'D199_BINDING_LIMIT_EXCEEDED',
      'More than 64 independently reviewed applicability definitions matched one D-199 target.',
      contributorBindings.map((binding) => binding.id),
    );
  }

  const inputFingerprint = fingerprint('input', request);
  const draft: Omit<WeightedFindingTendencyApplicabilityArtifact, 'id' | 'payloadFingerprint'> = {
    schemaVersion: 1,
    compilerVersion: WEIGHTED_FINDING_TENDENCY_APPLICABILITY_COMPILER_VERSION,
    requestId: request.id,
    patientStateCompositionRef: {
      id: patientComposition.id,
      payloadFingerprint: patientComposition.payloadFingerprint,
      composedPatientStateId: patientComposition.composedPatientState.id,
      composedPatientStateFingerprint: patientComposition.composedPatientStateFingerprint,
    },
    backgroundRef: {
      id: backgroundIntegrity.value.id,
      payloadFingerprint: backgroundIntegrity.value.payloadFingerprint,
    },
    definitionReferences,
    profileReferences: request.profiles.map((profile) => ({
      id: profile.id,
      contentVersion: profile.contentVersion,
      fingerprint: fingerprintWeightedFindingTendencyProfile(profile),
    })),
    applicabilityIndexFingerprint: expectedIndex.fingerprint,
    evaluations,
    contributorBindings,
    applicabilityRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('output', artifactPayload(draft));
  const output: WeightedFindingTendencyApplicabilityArtifact = {
    ...draft,
    id: `weighted-finding-applicability.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  };
  const validated = WeightedFindingTendencyApplicabilityArtifactSchema.safeParse(output);
  if (!validated.success) {
    return fail('INVALID_OUTPUT', issuesText(validated.error.issues), [
      request.id,
      patientComposition.id,
      backgroundIntegrity.value.id,
    ]);
  }
  return { ok: true, value: validated.data };
};

export const verifyWeightedFindingTendencyApplicabilityIntegrity = (
  value: unknown,
): WeightedFindingTendencyApplicabilityIntegrityResult => {
  const parsed = WeightedFindingTendencyApplicabilityArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  if (parsed.data.compilerVersion !== WEIGHTED_FINDING_TENDENCY_APPLICABILITY_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${parsed.data.id} uses unsupported applicability compiler ${parsed.data.compilerVersion}.`,
      },
    };
  }
  const patientStateIntegrity = verifyResolvedPatientStateCompositionIntegrity(
    parsed.data.applicabilityRequest.patientStateCompositionArtifact,
  );
  if (!patientStateIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_PATIENT_STATE_COMPOSITION',
        message: patientStateIntegrity.error.message,
      },
    };
  }
  const backgroundIntegrity = verifyUpstreamBackground(
    parsed.data.applicabilityRequest.backgroundArtifact,
  );
  if (!backgroundIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_BACKGROUND_ARTIFACT',
        message: backgroundIntegrity.error.message,
      },
    };
  }
  const replay = compileWeightedFindingTendencyApplicability(parsed.data.applicabilityRequest);
  if (!replay.ok || JSON.stringify(replay.value) !== JSON.stringify(parsed.data)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: replay.ok
          ? `${parsed.data.id} does not match deterministic full-scan replay.`
          : `${parsed.data.id} cannot replay: ${replay.error.message}`,
      },
    };
  }
  return { ok: true, value: parsed.data };
};

export const verifyWeightedFindingTendencyApplicabilityContext = (input: {
  readonly artifact: unknown;
  readonly request: unknown;
}): WeightedFindingTendencyApplicabilityContextResult => {
  const integrity = verifyWeightedFindingTendencyApplicabilityIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: { code: 'INVALID_ARTIFACT', message: integrity.error.message },
    };
  }
  const replay = compileWeightedFindingTendencyApplicability(input.request);
  if (!replay.ok) {
    return {
      ok: false,
      error: { code: 'INVALID_REQUEST', message: replay.error.message },
    };
  }
  if (JSON.stringify(replay.value) !== JSON.stringify(integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: `${integrity.value.id} was not compiled from the supplied exact applicability context.`,
      },
    };
  }
  return { ok: true, value: integrity.value };
};
