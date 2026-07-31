import {
  CanonicalFindingResolutionEnvelopeSchema,
  CompiledSharedFindingSetSchema,
  FindingProjectionResolutionEnvelopeSchema,
  SharedFindingCompileRequestSchema,
  type CompiledSharedFindingSet,
  type FindingCandidateDisposition,
  type FindingCandidateEvaluation,
  type FindingCompilerFingerprint,
  type FindingDefinition,
  type FindingProjectionResponseValue,
  type FindingProjectionHorizon,
  type FindingProjectionSourceBinding,
  type FindingProjectionTarget,
  type FindingResolutionCandidate,
  type ResolvedCanonicalFinding,
  type ResolvedCanonicalFindingValue,
  type ResolvedFindingProjection,
  type SharedFindingCompilationDiagnostic,
  type SharedFindingCompileRequest,
} from '@psychsim/schemas';

import { seededUnit } from './rng';

export const SHARED_FINDING_COMPILER_VERSION = '1.0.0';

export type SharedFindingCompileErrorCode =
  | 'INVALID_REQUEST'
  | 'STALE_FINDING_REFERENCE'
  | 'INVALID_CANDIDATE_VALUE'
  | 'NO_REVIEWED_VALUE'
  | 'LITERAL_SAME_SCOPE_CONTRADICTION'
  | 'UNAGGREGATED_SOFT_CANDIDATES'
  | 'STALE_PROPOSITION_REFERENCE'
  | 'STALE_PROJECTION_SOURCE'
  | 'UNKNOWN_PROJECTION_TARGET'
  | 'UNSUPPORTED_PROJECTION_RESPONSE'
  | 'MISSING_EXPRESSION_BANK'
  | 'STALE_EXPRESSION_BANK'
  | 'EXPRESSION_BANK_NOT_APPROVED'
  | 'EXPRESSION_CHANNEL_MISMATCH'
  | 'COMPILED_OUTPUT_INVALID';

export interface SharedFindingCompileError {
  readonly code: SharedFindingCompileErrorCode;
  readonly message: string;
  readonly contentIds: readonly string[];
  readonly conflictId: string;
  readonly inputFingerprint: FindingCompilerFingerprint | null;
  readonly conflictingCandidates: readonly FindingResolutionCandidate[];
  readonly disposition: 'invalid_input' | 'retry_or_quarantine';
}

export type SharedFindingCompileResult =
  | { readonly ok: true; readonly value: CompiledSharedFindingSet }
  | { readonly ok: false; readonly error: SharedFindingCompileError };

export type CompiledSharedFindingIntegrityResult =
  | { readonly ok: true; readonly value: CompiledSharedFindingSet }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_SCHEMA' | 'UNSUPPORTED_COMPILER_VERSION' | 'FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

export type CompiledSharedFindingContextResult =
  | { readonly ok: true; readonly value: CompiledSharedFindingSet }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'COMPILED_FINDING_INTEGRITY_INVALID'
          | 'PROJECTION_HORIZON_ID_MISMATCH'
          | 'PROJECTION_HORIZON_FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

export type CompiledSharedFindingSeedContextResult =
  | { readonly ok: true; readonly value: CompiledSharedFindingSet }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'COMPILED_FINDING_INTEGRITY_INVALID' | 'PROJECTION_SEED_CONTEXT_MISMATCH';
        readonly message: string;
        readonly projectionIds: readonly string[];
      };
    };

const compareStrings = (left: string, right: string): number =>
  left === right ? 0 : left < right ? -1 : 1;

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value
      .map(canonicalize)
      .sort((left, right) => compareStrings(JSON.stringify(left), JSON.stringify(right)));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
};

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

const fingerprint = (scope: string, value: unknown): FindingCompilerFingerprint =>
  `fingerprint.finding.${scope}.fnv1a64.${hashToHex64(JSON.stringify(canonicalize(value)))}`;

const exactFingerprint = (scope: string, value: unknown): FindingCompilerFingerprint =>
  `fingerprint.finding.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

export const fingerprintFindingProjectionHorizon = (
  horizon: FindingProjectionHorizon,
): FindingCompilerFingerprint =>
  exactFingerprint('projection-horizon', {
    ...horizon,
    targets: [...horizon.targets].sort((left, right) =>
      compareStrings(
        JSON.stringify(canonicalizeObjectKeys(left.target)),
        JSON.stringify(canonicalizeObjectKeys(right.target)),
      ),
    ),
  });

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const valueKey = (value: ResolvedCanonicalFindingValue): string =>
  JSON.stringify(canonicalizeObjectKeys(value));

type FindingUncertainty = NonNullable<FindingResolutionCandidate['uncertainty']>;

const uncertaintyPriority: Readonly<Record<FindingUncertainty, number>> = {
  none: 0,
  reported_uncertain: 1,
  conflicting_sources: 2,
};

const aggregateUncertainty = (
  candidates: readonly (FindingResolutionCandidate & {
    uncertainty: FindingUncertainty;
  })[],
): FindingUncertainty =>
  candidates.reduce<FindingUncertainty>(
    (current, candidate) =>
      uncertaintyPriority[candidate.uncertainty] > uncertaintyPriority[current]
        ? candidate.uncertainty
        : current,
    'none',
  );

const targetKey = (target: FindingProjectionTarget): string =>
  JSON.stringify(canonicalizeObjectKeys(target));

const responseKey = (response: FindingProjectionResponseValue): string =>
  JSON.stringify(canonicalizeObjectKeys(response));

const stableId = (prefix: string, payload: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalize(payload)))}`;

const normalizeCandidateSnapshot = (
  candidate: FindingResolutionCandidate,
): FindingResolutionCandidate => ({
  ...candidate,
  proposedValue: candidate.proposedValue ? { ...candidate.proposedValue } : null,
  contributions: candidate.contributions
    .map((contribution) => ({
      ...contribution,
      provenanceIds: uniqueSorted(contribution.provenanceIds),
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
  resolution: candidate.resolution === null ? null : { ...candidate.resolution },
  review: {
    ...candidate.review,
    sourceUseNoteIds: uniqueSorted(candidate.review.sourceUseNoteIds),
  },
});

const compileFailure = (
  code: SharedFindingCompileErrorCode,
  message: string,
  contentIds: readonly string[],
  disposition: SharedFindingCompileError['disposition'] = 'invalid_input',
  context: {
    readonly inputFingerprint?: FindingCompilerFingerprint;
    readonly conflictingCandidates?: readonly FindingResolutionCandidate[];
  } = {},
): SharedFindingCompileResult => {
  const normalizedIds = uniqueSorted(contentIds);
  const conflictingCandidates = (context.conflictingCandidates ?? [])
    .map(normalizeCandidateSnapshot)
    .sort((left, right) => compareStrings(left.id, right.id));
  return {
    ok: false,
    error: {
      code,
      message,
      contentIds: normalizedIds,
      conflictId: stableId('finding-conflict', {
        code,
        contentIds: normalizedIds,
        inputFingerprint: context.inputFingerprint ?? null,
        conflictingCandidates,
      }),
      inputFingerprint: context.inputFingerprint ?? null,
      conflictingCandidates,
      disposition,
    },
  };
};

const proposedState = (candidate: FindingResolutionCandidate): string | null => {
  if (candidate.proposedValue === null) return null;
  return valueKey(candidate.proposedValue);
};

const cloneCandidateEvaluation = (
  candidate: FindingResolutionCandidate,
  disposition: FindingCandidateDisposition,
): FindingCandidateEvaluation => ({
  candidateId: candidate.id,
  findingDefinitionId: candidate.findingDefinitionId,
  kind: candidate.kind,
  proposedValue: candidate.proposedValue ? { ...candidate.proposedValue } : null,
  uncertainty: candidate.uncertainty,
  contributionIds: candidate.contributions
    .map((contribution) => contribution.id)
    .sort(compareStrings),
  resolution: candidate.resolution === null ? null : { ...candidate.resolution },
  review: {
    ...candidate.review,
    sourceUseNoteIds: uniqueSorted(candidate.review.sourceUseNoteIds),
  },
  disposition,
});

interface ResolvedFindingAndEvaluations {
  readonly finding: ResolvedCanonicalFinding;
  readonly evaluations: readonly FindingCandidateEvaluation[];
  readonly diagnostics: readonly SharedFindingCompilationDiagnostic[];
}

const resolveOneFinding = (
  request: SharedFindingCompileRequest,
  inputFingerprint: FindingCompilerFingerprint,
  definition: FindingDefinition,
  candidates: readonly FindingResolutionCandidate[],
): SharedFindingCompileResult | ResolvedFindingAndEvaluations => {
  const sortedCandidates = [...candidates].sort((left, right) => compareStrings(left.id, right.id));
  const diagnostics: SharedFindingCompilationDiagnostic[] = sortedCandidates
    .filter((candidate) => candidate.review.status !== 'approved')
    .map((candidate) => ({
      code: 'candidate_not_approved',
      contentIds: [candidate.id],
      message: `${candidate.id} was retained in the audit but did not participate because it is not approved.`,
    }));
  const active = sortedCandidates.filter((candidate) => candidate.review.status === 'approved');
  const activeValueCandidates = active.filter(
    (
      candidate,
    ): candidate is FindingResolutionCandidate & {
      proposedValue: ResolvedCanonicalFindingValue;
      uncertainty: NonNullable<FindingResolutionCandidate['uncertainty']>;
    } =>
      candidate.kind !== 'no_opinion' &&
      candidate.proposedValue !== null &&
      candidate.uncertainty !== null,
  );

  if (activeValueCandidates.length === 0) {
    return compileFailure(
      'NO_REVIEWED_VALUE',
      `${definition.id} has no reviewed value-bearing candidate; the compiler will not invent an absent or normal result.`,
      [definition.id, ...sortedCandidates.map((candidate) => candidate.id)],
      'invalid_input',
      { inputFingerprint, conflictingCandidates: sortedCandidates },
    );
  }

  const overrides = activeValueCandidates.filter(
    (candidate) => candidate.kind === 'patient_override',
  );
  const required = activeValueCandidates.filter((candidate) =>
    ['case_critical', 'diagnostic_requirement', 'cardinality_requirement'].includes(candidate.kind),
  );
  const weighted = activeValueCandidates.filter(
    (candidate) => candidate.kind === 'weighted_tendency',
  );
  const background = activeValueCandidates.filter(
    (candidate) => candidate.kind === 'background_variation',
  );

  let selected: typeof activeValueCandidates = [];
  let selectedTier: 'override' | 'required' | 'weighted' | 'background';
  if (overrides.length > 0) {
    selected = overrides;
    selectedTier = 'override';
  } else if (required.length > 0) {
    selected = required;
    selectedTier = 'required';
  } else if (weighted.length > 0) {
    selected = weighted;
    selectedTier = 'weighted';
  } else {
    selected = background;
    selectedTier = 'background';
  }

  const selectedStates = uniqueSorted(
    selected.map((candidate) => valueKey(candidate.proposedValue)),
  );
  if (selectedStates.length !== 1) {
    const hardConflict = selectedTier === 'override' || selectedTier === 'required';
    return compileFailure(
      hardConflict ? 'LITERAL_SAME_SCOPE_CONTRADICTION' : 'UNAGGREGATED_SOFT_CANDIDATES',
      hardConflict
        ? `${definition.id} has incompatible reviewed hard values at the same resolution scope.`
        : `${definition.id} has multiple already-resolved soft values; a reviewed upstream generation profile must aggregate them before this pass.`,
      [definition.id, ...selected.map((candidate) => candidate.id)],
      hardConflict ? 'retry_or_quarantine' : 'invalid_input',
      { inputFingerprint, conflictingCandidates: selected },
    );
  }

  const selectedState = selectedStates[0]!;
  const selectedUncertainty = aggregateUncertainty(selected);
  const selectedCandidateIds = new Set(selected.map((candidate) => candidate.id));
  const evaluations = sortedCandidates.map((candidate): FindingCandidateEvaluation => {
    if (candidate.review.status !== 'approved') {
      return cloneCandidateEvaluation(candidate, 'not_reviewed');
    }
    if (candidate.kind === 'no_opinion') {
      return cloneCandidateEvaluation(candidate, 'no_opinion');
    }
    if (selectedCandidateIds.has(candidate.id)) {
      return cloneCandidateEvaluation(candidate, 'applied');
    }
    if (proposedState(candidate) === selectedState) {
      return cloneCandidateEvaluation(candidate, 'compatible_not_decisive');
    }
    if (selectedTier === 'override') {
      return cloneCandidateEvaluation(candidate, 'superseded_by_override');
    }
    if (selectedTier === 'required') {
      return cloneCandidateEvaluation(candidate, 'required_value_prevailed');
    }
    return cloneCandidateEvaluation(candidate, 'higher_priority_candidate_prevailed');
  });

  const winning = selected[0]!;
  const contributions = sortedCandidates
    .flatMap((candidate) =>
      candidate.contributions.map((contribution) => ({
        ...contribution,
        provenanceIds: uniqueSorted(contribution.provenanceIds),
      })),
    )
    .sort((left, right) => compareStrings(left.id, right.id));
  const appliedContributionIds = selected
    .flatMap((candidate) => candidate.contributions.map((contribution) => contribution.id))
    .sort(compareStrings);
  const findingInputFingerprint = fingerprint('finding-input', {
    patientStateId: request.patientStateId,
    definition,
    candidates: sortedCandidates,
  });
  const finding = CanonicalFindingResolutionEnvelopeSchema.parse({
    definition,
    resolved: {
      schemaVersion: 1,
      id: stableId('resolved-finding', {
        patientStateId: request.patientStateId,
        definitionId: definition.id,
        definitionContentVersion: definition.contentVersion,
        findingInputFingerprint,
      }),
      definitionId: definition.id,
      definitionContentVersion: definition.contentVersion,
      value: winning.proposedValue,
      resolution: {
        resolverVersion: SHARED_FINDING_COMPILER_VERSION,
        origin: 'compiled',
        uncertainty: selectedUncertainty,
        appliedContributionIds,
      },
      contributions,
    },
  }).resolved;

  return { finding, evaluations, diagnostics };
};

interface ProjectionSourceMatch {
  readonly matched: boolean;
  readonly findingIds: readonly string[];
  readonly propositionIds: readonly string[];
  readonly evidenceIds: readonly string[];
}

const resolvedFindingState = (finding: ResolvedCanonicalFinding): string =>
  finding.value.kind === 'outcome' ? finding.value.value : finding.value.state;

const matchProjectionBinding = (
  binding: FindingProjectionSourceBinding,
  findingsByDefinition: ReadonlyMap<string, ResolvedCanonicalFinding>,
  propositionState: SharedFindingCompileRequest['propositionState'],
): ProjectionSourceMatch => {
  if (binding.kind === 'canonical_finding') {
    const finding = findingsByDefinition.get(binding.findingDefinitionId);
    const matched =
      finding !== undefined &&
      finding.definitionContentVersion === binding.findingDefinitionContentVersion &&
      binding.allowedStates.some((state) => state === resolvedFindingState(finding));
    return {
      matched,
      findingIds: matched ? [finding.id] : [],
      propositionIds: [],
      evidenceIds: [],
    };
  }

  const propositions = propositionState.propositions.filter(
    (proposition) =>
      proposition.definitionId === binding.propositionDefinitionId &&
      proposition.definitionContentVersion === binding.propositionDefinitionContentVersion,
  );
  const propositionIds = new Set(propositions.map((proposition) => proposition.id));
  const evidence = propositionState.evidence
    .filter(
      (entry) =>
        propositionIds.has(entry.propositionId) &&
        binding.allowedAssertions.includes(entry.assertion) &&
        binding.sourceKinds.includes(entry.source.kind) &&
        (binding.timeScopeIds === null || binding.timeScopeIds.includes(entry.timeScopeId)),
    )
    .sort((left, right) => compareStrings(left.id, right.id));
  return {
    matched: evidence.length > 0,
    findingIds: [],
    propositionIds: uniqueSorted(evidence.map((entry) => entry.propositionId)),
    evidenceIds: evidence.map((entry) => entry.id),
  };
};

const compileProjections = (
  request: SharedFindingCompileRequest,
  inputFingerprint: FindingCompilerFingerprint,
  findings: readonly ResolvedCanonicalFinding[],
):
  | {
      readonly projections: readonly ResolvedFindingProjection[];
      readonly diagnostics: readonly SharedFindingCompilationDiagnostic[];
    }
  | SharedFindingCompileResult => {
  const findingsByDefinition = new Map(
    findings.map((finding) => [finding.definitionId, finding] as const),
  );
  const definitionsById = new Map(
    request.findingDefinitions.map((definition) => [definition.id, definition] as const),
  );
  const propositionDefinitionsById = new Map(
    request.propositionDefinitions.map((definition) => [definition.id, definition] as const),
  );
  const expressionBanksById = new Map(
    request.expressionBanks.map((bank) => [bank.id, bank] as const),
  );
  const targetAvailabilityByKey = new Map(
    request.projectionHorizon.targets.map((availability) => [
      targetKey(availability.target),
      availability,
    ]),
  );
  const diagnostics: SharedFindingCompilationDiagnostic[] = [];
  const compiled: ResolvedFindingProjection[] = [];
  const failure = (
    code: SharedFindingCompileErrorCode,
    message: string,
    contentIds: readonly string[],
  ): SharedFindingCompileResult =>
    compileFailure(code, message, contentIds, 'invalid_input', { inputFingerprint });

  for (const proposition of request.propositionState.propositions) {
    const definition = propositionDefinitionsById.get(proposition.definitionId);
    if (!definition || definition.contentVersion !== proposition.definitionContentVersion) {
      return failure(
        'STALE_PROPOSITION_REFERENCE',
        `${proposition.id} references an unavailable proposition definition version.`,
        [proposition.id, proposition.definitionId],
      );
    }
  }

  for (const projection of [...request.projections].sort((left, right) =>
    compareStrings(left.id, right.id),
  )) {
    if (projection.review.status !== 'approved') {
      diagnostics.push({
        code: 'projection_not_approved',
        contentIds: [projection.id],
        message: `${projection.id} was not compiled because its source-to-response mapping is not approved.`,
      });
      continue;
    }

    for (const binding of projection.sourceBindings) {
      if (binding.kind === 'canonical_finding') {
        const definition = definitionsById.get(binding.findingDefinitionId);
        if (!definition || definition.contentVersion !== binding.findingDefinitionContentVersion) {
          return failure(
            'STALE_PROJECTION_SOURCE',
            `${projection.id} references an unavailable canonical finding version.`,
            [projection.id, binding.findingDefinitionId],
          );
        }
        const allowedStates = new Set([
          ...definition.valueSpecification.allowedValues,
          'unknown',
          'unassessed',
        ]);
        if (binding.allowedStates.some((state) => !allowedStates.has(state))) {
          return failure(
            'STALE_PROJECTION_SOURCE',
            `${projection.id} admits a state not allowed by ${definition.id}.`,
            [projection.id, definition.id],
          );
        }
      } else {
        const definition = propositionDefinitionsById.get(binding.propositionDefinitionId);
        if (
          !definition ||
          definition.contentVersion !== binding.propositionDefinitionContentVersion
        ) {
          return failure(
            'STALE_PROJECTION_SOURCE',
            `${projection.id} references an unavailable proposition definition version.`,
            [projection.id, binding.propositionDefinitionId],
          );
        }
      }
    }

    const availability = targetAvailabilityByKey.get(targetKey(projection.target));
    if (!availability) {
      return failure(
        'UNKNOWN_PROJECTION_TARGET',
        `${projection.id} targets an action or instrument item outside the frozen projection horizon.`,
        [projection.id, request.projectionHorizon.id],
      );
    }
    if (
      !availability.allowedResponses.some(
        (response) => responseKey(response) === responseKey(projection.response),
      )
    ) {
      return failure(
        'UNSUPPORTED_PROJECTION_RESPONSE',
        `${projection.id} uses a response not admitted by its exact target.`,
        [projection.id, request.projectionHorizon.id],
      );
    }

    const expressionBank =
      projection.expressionBankId === null
        ? null
        : expressionBanksById.get(projection.expressionBankId);
    if (projection.expressionBankId !== null && !expressionBank) {
      return failure(
        'MISSING_EXPRESSION_BANK',
        `${projection.id} references a missing expression bank.`,
        [projection.id, projection.expressionBankId],
      );
    }
    if (
      expressionBank &&
      expressionBank.contentVersion !== projection.expressionBankContentVersion
    ) {
      return failure(
        'STALE_EXPRESSION_BANK',
        `${projection.id} does not pin the supplied expression-bank version.`,
        [projection.id, expressionBank.id],
      );
    }
    if (
      expressionBank &&
      projection.review.status === 'approved' &&
      (expressionBank.lifecycle !== 'approved' || expressionBank.medicalReviewStatus !== 'approved')
    ) {
      return failure(
        'EXPRESSION_BANK_NOT_APPROVED',
        `${projection.id} cannot compile with an unapproved wording bank.`,
        [projection.id, expressionBank.id],
      );
    }
    if (
      expressionBank &&
      (availability.expressionDisplayChannel === null ||
        !expressionBank.displayChannels.includes(availability.expressionDisplayChannel))
    ) {
      return failure(
        'EXPRESSION_CHANNEL_MISMATCH',
        `${projection.id} uses a wording bank outside the target display channel.`,
        [projection.id, expressionBank.id, request.projectionHorizon.id],
      );
    }

    const matches = projection.sourceBindings.map((binding) =>
      matchProjectionBinding(binding, findingsByDefinition, request.propositionState),
    );
    const matched =
      projection.sourceMatch === 'all'
        ? matches.every((match) => match.matched)
        : matches.some((match) => match.matched);
    if (!matched) continue;

    const contributingResolvedFindingIds = uniqueSorted(
      matches.flatMap((match) => (match.matched ? match.findingIds : [])),
    );
    const propositionIds = uniqueSorted(
      matches.flatMap((match) => (match.matched ? match.propositionIds : [])),
    );
    const evidenceIds = uniqueSorted(
      matches.flatMap((match) => (match.matched ? match.evidenceIds : [])),
    );
    const selectionPayload = {
      patientStateId: request.patientStateId,
      projectionId: projection.id,
      projectionContentVersion: projection.contentVersion,
      expressionBankId: expressionBank?.id ?? null,
      expressionBankContentVersion: expressionBank?.contentVersion ?? null,
      contributingResolvedFindingIds,
      propositionIds,
      evidenceIds,
    };
    const sortedVariants = expressionBank
      ? [...expressionBank.variants].sort((left, right) => compareStrings(left.id, right.id))
      : [];
    const selectedVariant =
      sortedVariants.length === 0
        ? null
        : sortedVariants[
            Math.min(
              sortedVariants.length - 1,
              Math.floor(
                seededUnit(
                  request.seed,
                  `finding-projection:${hashToHex64(
                    JSON.stringify(canonicalize(selectionPayload)),
                  )}`,
                ) * sortedVariants.length,
              ),
            )
          ]!;
    const stableDrawId = selectedVariant
      ? stableId('draw.finding-projection', {
          ...selectionPayload,
          seedFingerprint: hashToHex64(request.seed),
        })
      : null;
    const resolved = FindingProjectionResolutionEnvelopeSchema.parse({
      projection,
      resolved: {
        schemaVersion: 1,
        id: stableId('resolved-finding-projection', {
          ...selectionPayload,
          response: projection.response,
          selectedVariantId: selectedVariant?.id ?? null,
        }),
        projectionId: projection.id,
        projectionContentVersion: projection.contentVersion,
        target: { ...projection.target },
        response: { ...projection.response },
        selectedExpression:
          expressionBank && selectedVariant
            ? {
                bankId: expressionBank.id,
                bankContentVersion: expressionBank.contentVersion,
                variantId: selectedVariant.id,
              }
            : null,
        contributingResolvedFindingIds,
        propositionIds,
        evidenceIds,
        resolution: {
          origin: 'compiled',
          compilerVersion: SHARED_FINDING_COMPILER_VERSION,
          inputFingerprint,
          stableDrawId,
        },
      },
      expressionBank,
    }).resolved;
    compiled.push(resolved);
  }

  return {
    projections: compiled.sort((left, right) =>
      compareStrings(left.projectionId, right.projectionId),
    ),
    diagnostics: diagnostics.sort((left, right) =>
      compareStrings(
        `${left.code}:${left.contentIds.join(',')}`,
        `${right.code}:${right.contentIds.join(',')}`,
      ),
    ),
  };
};

const compilationPayload = (
  compiled: Omit<CompiledSharedFindingSet, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: compiled.schemaVersion,
  compilerVersion: compiled.compilerVersion,
  requestId: compiled.requestId,
  patientStateId: compiled.patientStateId,
  projectionHorizonId: compiled.projectionHorizonId,
  projectionHorizonFingerprint: compiled.projectionHorizonFingerprint,
  inputFingerprint: compiled.inputFingerprint,
  findings: compiled.findings,
  candidateEvaluations: compiled.candidateEvaluations,
  projections: compiled.projections,
  diagnostics: compiled.diagnostics,
});

export const verifyCompiledSharedFindingIntegrity = (
  value: unknown,
): CompiledSharedFindingIntegrityResult => {
  const parsed = CompiledSharedFindingSetSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: parsed.error.issues
          .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
          .join('; '),
      },
    };
  }
  if (parsed.data.compilerVersion !== SHARED_FINDING_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${parsed.data.id} uses unsupported shared-finding compiler ${parsed.data.compilerVersion}.`,
      },
    };
  }
  const expectedFingerprint = exactFingerprint(
    'compiler-output',
    compilationPayload({
      schemaVersion: parsed.data.schemaVersion,
      compilerVersion: parsed.data.compilerVersion,
      requestId: parsed.data.requestId,
      patientStateId: parsed.data.patientStateId,
      projectionHorizonId: parsed.data.projectionHorizonId,
      projectionHorizonFingerprint: parsed.data.projectionHorizonFingerprint,
      inputFingerprint: parsed.data.inputFingerprint,
      findings: parsed.data.findings,
      candidateEvaluations: parsed.data.candidateEvaluations,
      projections: parsed.data.projections,
      diagnostics: parsed.data.diagnostics,
    }),
  );
  const expectedId = `compiled-findings.${expectedFingerprint.split('.').at(-1)!}`;
  if (parsed.data.payloadFingerprint !== expectedFingerprint || parsed.data.id !== expectedId) {
    return {
      ok: false,
      error: {
        code: 'FINGERPRINT_MISMATCH',
        message: `${parsed.data.id} does not match its frozen shared-finding payload.`,
      },
    };
  }
  return { ok: true, value: parsed.data };
};

export const verifyCompiledSharedFindingContext = (input: {
  readonly compiled: unknown;
  readonly projectionHorizon: FindingProjectionHorizon;
}): CompiledSharedFindingContextResult => {
  const integrity = verifyCompiledSharedFindingIntegrity(input.compiled);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'COMPILED_FINDING_INTEGRITY_INVALID',
        message: integrity.error.message,
      },
    };
  }
  if (integrity.value.projectionHorizonId !== input.projectionHorizon.id) {
    return {
      ok: false,
      error: {
        code: 'PROJECTION_HORIZON_ID_MISMATCH',
        message: `${integrity.value.id} was compiled for projection horizon ${integrity.value.projectionHorizonId}, not ${input.projectionHorizon.id}.`,
      },
    };
  }
  if (
    integrity.value.projectionHorizonFingerprint !==
    fingerprintFindingProjectionHorizon(input.projectionHorizon)
  ) {
    return {
      ok: false,
      error: {
        code: 'PROJECTION_HORIZON_FINGERPRINT_MISMATCH',
        message: `${input.projectionHorizon.id} does not match the exact projection-horizon payload frozen into ${integrity.value.id}.`,
      },
    };
  }
  return { ok: true, value: integrity.value };
};

export const verifyCompiledSharedFindingSeedContext = (input: {
  readonly compiled: unknown;
  readonly seed: string;
}): CompiledSharedFindingSeedContextResult => {
  const integrity = verifyCompiledSharedFindingIntegrity(input.compiled);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'COMPILED_FINDING_INTEGRITY_INVALID',
        message: integrity.error.message,
        projectionIds: [],
      },
    };
  }
  const mismatchedProjectionIds = integrity.value.projections
    .filter((projection) => projection.selectedExpression !== null)
    .filter((projection) => {
      const expectedDrawId = stableId('draw.finding-projection', {
        patientStateId: integrity.value.patientStateId,
        projectionId: projection.projectionId,
        projectionContentVersion: projection.projectionContentVersion,
        expressionBankId: projection.selectedExpression?.bankId ?? null,
        expressionBankContentVersion: projection.selectedExpression?.bankContentVersion ?? null,
        contributingResolvedFindingIds: projection.contributingResolvedFindingIds,
        propositionIds: projection.propositionIds,
        evidenceIds: projection.evidenceIds,
        seedFingerprint: hashToHex64(input.seed),
      });
      return projection.resolution.stableDrawId !== expectedDrawId;
    })
    .map((projection) => projection.id)
    .sort(compareStrings);
  if (mismatchedProjectionIds.length > 0) {
    return {
      ok: false,
      error: {
        code: 'PROJECTION_SEED_CONTEXT_MISMATCH',
        message: 'One or more frozen wording draws do not match the saved patient-instance seed.',
        projectionIds: mismatchedProjectionIds,
      },
    };
  }
  return { ok: true, value: integrity.value };
};

export const compileSharedFindings = (input: unknown): SharedFindingCompileResult => {
  const parsed = SharedFindingCompileRequestSchema.safeParse(input);
  if (!parsed.success) {
    return compileFailure(
      'INVALID_REQUEST',
      parsed.error.issues
        .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
        .join('; '),
      [],
    );
  }
  const request = parsed.data;
  const inputFingerprint = fingerprint('input', request);
  const failure = (
    code: SharedFindingCompileErrorCode,
    message: string,
    contentIds: readonly string[],
  ): SharedFindingCompileResult =>
    compileFailure(code, message, contentIds, 'invalid_input', { inputFingerprint });
  const definitions = [...request.findingDefinitions].sort((left, right) =>
    compareStrings(left.id, right.id),
  );
  const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));

  for (const candidate of request.candidates) {
    const definition = definitionsById.get(candidate.findingDefinitionId);
    if (!definition || definition.contentVersion !== candidate.findingDefinitionContentVersion) {
      return failure(
        'STALE_FINDING_REFERENCE',
        `${candidate.id} references an unavailable finding-definition version.`,
        [candidate.id, candidate.findingDefinitionId],
      );
    }
    if (
      candidate.proposedValue?.kind === 'outcome' &&
      !definition.valueSpecification.allowedValues.includes(candidate.proposedValue.value)
    ) {
      return failure(
        'INVALID_CANDIDATE_VALUE',
        `${candidate.id} proposes a value not admitted by ${definition.id}.`,
        [candidate.id, definition.id],
      );
    }
  }

  const findings: ResolvedCanonicalFinding[] = [];
  const evaluations: FindingCandidateEvaluation[] = [];
  const diagnostics: SharedFindingCompilationDiagnostic[] = [];
  for (const definition of definitions) {
    const resolution = resolveOneFinding(
      request,
      inputFingerprint,
      definition,
      request.candidates.filter((candidate) => candidate.findingDefinitionId === definition.id),
    );
    if ('ok' in resolution) return resolution;
    findings.push(resolution.finding);
    evaluations.push(...resolution.evaluations);
    diagnostics.push(...resolution.diagnostics);
  }

  const projectionResult = compileProjections(request, inputFingerprint, findings);
  if ('ok' in projectionResult) return projectionResult;
  diagnostics.push(...projectionResult.diagnostics);

  const payload = {
    schemaVersion: 1 as const,
    compilerVersion: SHARED_FINDING_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: request.patientStateId,
    projectionHorizonId: request.projectionHorizon.id,
    projectionHorizonFingerprint: fingerprintFindingProjectionHorizon(request.projectionHorizon),
    inputFingerprint,
    findings: findings.sort((left, right) => compareStrings(left.definitionId, right.definitionId)),
    candidateEvaluations: evaluations.sort((left, right) =>
      compareStrings(left.candidateId, right.candidateId),
    ),
    projections: [...projectionResult.projections],
    diagnostics: diagnostics.sort((left, right) =>
      compareStrings(
        `${left.code}:${left.contentIds.join(',')}`,
        `${right.code}:${right.contentIds.join(',')}`,
      ),
    ),
  };
  const payloadFingerprint = exactFingerprint('compiler-output', compilationPayload(payload));
  const compiled = CompiledSharedFindingSetSchema.safeParse({
    ...payload,
    id: `compiled-findings.${payloadFingerprint.split('.').at(-1)!}`,
    payloadFingerprint,
  });
  if (!compiled.success) {
    return failure(
      'COMPILED_OUTPUT_INVALID',
      compiled.error.issues
        .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
        .join('; '),
      [request.id],
    );
  }
  return { ok: true, value: compiled.data };
};
