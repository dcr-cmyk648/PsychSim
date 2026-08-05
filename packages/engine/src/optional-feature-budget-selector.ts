import {
  OptionalFeatureBudgetSelectionArtifactSchema,
  OptionalFeatureBudgetSelectionRequestSchema,
  type OptionalFeatureBudgetFingerprint,
  type OptionalFeatureBudgetSelectionArtifact,
  type OptionalFeatureBudgetSelectionRequest,
  type OptionalFeatureCandidateEvaluation,
  type OptionalFeatureModuleReference,
  type OptionalFeatureSelectionDraw,
  type PatientOptionalFeatureModule,
  type PatientOptionalFeatureModuleDefinition,
  type PatientTemplate,
  type TemplateOptionalFeatureCandidateBinding,
  type TemplateOptionalFeatureIncompatibility,
  type TemplateOptionalFeatureSelectionProfile,
} from '@psychsim/schemas';

import { seededUnit } from './rng';
import { fingerprintTemplateConditionSelectionTemplate } from './template-condition-selector';

export const OPTIONAL_FEATURE_BUDGET_SELECTOR_VERSION = '3.0.0';

export type OptionalFeatureBudgetSelectionErrorCode =
  | 'INVALID_REQUEST'
  | 'TEMPLATE_FINGERPRINT_MISMATCH'
  | 'MODULE_FINGERPRINT_MISMATCH'
  | 'INFEASIBLE_SELECTION_COUNT'
  | 'NO_ELIGIBLE_MODULE'
  | 'INVALID_OUTPUT';

export interface OptionalFeatureBudgetSelectionError {
  readonly code: OptionalFeatureBudgetSelectionErrorCode;
  readonly message: string;
  readonly contentIds: readonly string[];
}

export type OptionalFeatureBudgetSelectionResult =
  | { readonly ok: true; readonly value: OptionalFeatureBudgetSelectionArtifact }
  | { readonly ok: false; readonly error: OptionalFeatureBudgetSelectionError };

export type OptionalFeatureBudgetSelectionIntegrityResult =
  | { readonly ok: true; readonly value: OptionalFeatureBudgetSelectionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_RESOLVER_VERSION'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH'
          | 'REPLAY_MISMATCH';
        readonly message: string;
      };
    };

export type OptionalFeatureBudgetSelectionContextResult =
  | { readonly ok: true; readonly value: OptionalFeatureBudgetSelectionArtifact }
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

const fingerprint = (scope: string, value: unknown): OptionalFeatureBudgetFingerprint =>
  `fingerprint.optional-feature-budget.${scope}.fnv1a64.${hashToHex64(
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

const normalizeTemplate = (template: PatientTemplate): PatientTemplate => ({
  ...template,
  review: normalizeReview(template.review),
  compatibleLocationRefs: [...template.compatibleLocationRefs].sort((left, right) =>
    compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
  ),
  requiredConditions: [...template.requiredConditions]
    .map((condition) => ({
      ...condition,
      specifierIds: uniqueSorted(condition.specifierIds),
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
  optionalConditionSelectionGroups: [...template.optionalConditionSelectionGroups]
    .map((group) => ({
      ...group,
      candidates: [...group.candidates]
        .map((condition) => ({
          ...condition,
          specifierIds: uniqueSorted(condition.specifierIds),
        }))
        .sort((left, right) => compareStrings(left.id, right.id)),
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
  presentationRichnessEnvelope: {
    ...template.presentationRichnessEnvelope,
    decisionDriverCategories: uniqueSorted(
      template.presentationRichnessEnvelope.decisionDriverCategories,
    ) as PatientTemplate['presentationRichnessEnvelope']['decisionDriverCategories'],
  },
});

const normalizeModuleDefinition = (
  definition: PatientOptionalFeatureModuleDefinition,
): PatientOptionalFeatureModuleDefinition => ({
  ...definition,
  review: normalizeReview(definition.review),
});

const normalizeCandidateBinding = (
  binding: TemplateOptionalFeatureCandidateBinding,
): TemplateOptionalFeatureCandidateBinding => ({
  ...binding,
  complexityContributions: [...binding.complexityContributions]
    .map((contribution) => ({
      ...contribution,
      review: normalizeReview(contribution.review),
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
  review: normalizeReview(binding.review),
});

const normalizeIncompatibility = (
  incompatibility: TemplateOptionalFeatureIncompatibility,
): TemplateOptionalFeatureIncompatibility => ({
  ...incompatibility,
  review: normalizeReview(incompatibility.review),
});

const normalizeProfile = (
  profile: TemplateOptionalFeatureSelectionProfile,
): TemplateOptionalFeatureSelectionProfile => ({
  ...profile,
  countWeights: [...profile.countWeights].sort(
    (left, right) => left.selectionCount - right.selectionCount,
  ),
  candidateBindings: [...profile.candidateBindings]
    .map(normalizeCandidateBinding)
    .sort((left, right) => compareStrings(left.moduleRef.id, right.moduleRef.id)),
  incompatibilities: [...profile.incompatibilities]
    .map(normalizeIncompatibility)
    .sort((left, right) => compareStrings(left.id, right.id)),
  review: normalizeReview(profile.review),
});

const normalizeRequest = (
  request: OptionalFeatureBudgetSelectionRequest,
): OptionalFeatureBudgetSelectionRequest => ({
  ...request,
  template: normalizeTemplate(request.template),
  moduleDefinitions: [...request.moduleDefinitions]
    .map(normalizeModuleDefinition)
    .sort((left, right) => compareStrings(left.id, right.id)),
  profile: normalizeProfile(request.profile),
});

export const fingerprintOptionalFeatureModuleDefinition = (
  definition: PatientOptionalFeatureModuleDefinition,
): OptionalFeatureBudgetFingerprint =>
  fingerprint('module-definition', normalizeModuleDefinition(definition));

export const fingerprintOptionalFeatureSelectionProfile = (
  profile: TemplateOptionalFeatureSelectionProfile,
): OptionalFeatureBudgetFingerprint => fingerprint('profile', normalizeProfile(profile));

const fingerprintOptionalFeatureDrawProfile = (
  profile: TemplateOptionalFeatureSelectionProfile,
): OptionalFeatureBudgetFingerprint =>
  fingerprint(
    'draw-profile',
    Object.fromEntries(
      Object.entries(normalizeProfile(profile)).filter(([key]) => key !== 'templateFingerprint'),
    ),
  );

const weightedChoice = <Value extends { readonly gameSelectionWeight: number }>(
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
  readonly templateRef: { readonly id: string; readonly contentVersion: string };
  readonly profileRef: { readonly id: string; readonly contentVersion: string };
  readonly drawProfileFingerprint: OptionalFeatureBudgetFingerprint;
  readonly moduleReferences: readonly OptionalFeatureModuleReference[];
  readonly seed: string;
  readonly lane: 'count' | 'candidate';
  readonly ordinal: number | null;
}

const drawContext = (
  input: DrawContextInput,
): { readonly key: string; readonly stableDrawId: string } => {
  const payload = {
    templateRef: input.templateRef,
    profileRef: input.profileRef,
    drawProfileFingerprint: input.drawProfileFingerprint,
    moduleReferences: input.moduleReferences,
    lane: input.lane,
    ordinal: input.ordinal,
  };
  const key = JSON.stringify(canonicalizeObjectKeys(payload));
  return {
    key,
    stableDrawId: stableId(
      input.lane === 'count'
        ? 'stable-draw.optional-feature-budget.count'
        : 'stable-draw.optional-feature-budget.candidate',
      {
        ...payload,
        seedFingerprint: hashToHex64(input.seed),
      },
    ),
  };
};

const incompatibilitiesFor = (
  leftModuleId: string,
  rightModuleId: string,
  incompatibilities: readonly TemplateOptionalFeatureIncompatibility[],
): TemplateOptionalFeatureIncompatibility[] =>
  incompatibilities.filter(
    (incompatibility) =>
      (incompatibility.leftModuleId === leftModuleId &&
        incompatibility.rightModuleId === rightModuleId) ||
      (incompatibility.leftModuleId === rightModuleId &&
        incompatibility.rightModuleId === leftModuleId),
  );

const blockingIncompatibilities = (
  moduleId: string,
  selectedModuleIds: ReadonlySet<string>,
  incompatibilities: readonly TemplateOptionalFeatureIncompatibility[],
): TemplateOptionalFeatureIncompatibility[] =>
  [...selectedModuleIds].flatMap((selectedModuleId) =>
    incompatibilitiesFor(moduleId, selectedModuleId, incompatibilities),
  );

const hasFeasibleCompletion = (
  candidates: readonly TemplateOptionalFeatureCandidateBinding[],
  selectedModuleIds: ReadonlySet<string>,
  remainingBudget: number,
  requiredAdditionalCount: number,
  incompatibilities: readonly TemplateOptionalFeatureIncompatibility[],
): boolean => {
  if (requiredAdditionalCount === 0) return true;
  if (candidates.length < requiredAdditionalCount) return false;
  const preliminarilyEligible = candidates.filter(
    (candidate) =>
      !selectedModuleIds.has(candidate.moduleRef.id) &&
      candidate.cost <= remainingBudget &&
      blockingIncompatibilities(candidate.moduleRef.id, selectedModuleIds, incompatibilities)
        .length === 0,
  );
  if (preliminarilyEligible.length < requiredAdditionalCount) return false;
  const minimumRequiredCost = preliminarilyEligible
    .map((candidate) => candidate.cost)
    .sort((left, right) => left - right)
    .slice(0, requiredAdditionalCount)
    .reduce((total, cost) => total + cost, 0);
  if (minimumRequiredCost > remainingBudget) return false;
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index]!;
    if (
      selectedModuleIds.has(candidate.moduleRef.id) ||
      candidate.cost > remainingBudget ||
      blockingIncompatibilities(candidate.moduleRef.id, selectedModuleIds, incompatibilities)
        .length > 0
    ) {
      continue;
    }
    const nextSelected = new Set(selectedModuleIds);
    nextSelected.add(candidate.moduleRef.id);
    if (
      hasFeasibleCompletion(
        candidates.slice(index + 1),
        nextSelected,
        remainingBudget - candidate.cost,
        requiredAdditionalCount - 1,
        incompatibilities,
      )
    ) {
      return true;
    }
  }
  return false;
};

const validateRequest = (
  request: OptionalFeatureBudgetSelectionRequest,
):
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly code:
        | 'TEMPLATE_FINGERPRINT_MISMATCH'
        | 'MODULE_FINGERPRINT_MISMATCH'
        | 'INFEASIBLE_SELECTION_COUNT';
      readonly message: string;
      readonly contentIds: readonly string[];
    } => {
  const expectedTemplateFingerprint = fingerprintTemplateConditionSelectionTemplate(
    request.template,
  );
  if (request.profile.templateFingerprint !== expectedTemplateFingerprint) {
    return {
      ok: false,
      code: 'TEMPLATE_FINGERPRINT_MISMATCH',
      message: `${request.profile.id} does not pin the exact payload of ${request.template.id}.`,
      contentIds: [request.profile.id, request.template.id],
    };
  }
  const definitionById = new Map(
    request.moduleDefinitions.map((definition) => [definition.id, definition]),
  );
  const staleModuleIds = request.profile.candidateBindings.flatMap((binding) => {
    const definition = definitionById.get(binding.moduleRef.id);
    return definition === undefined ||
      binding.moduleFingerprint !== fingerprintOptionalFeatureModuleDefinition(definition)
      ? [binding.moduleRef.id]
      : [];
  });
  if (staleModuleIds.length > 0) {
    return {
      ok: false,
      code: 'MODULE_FINGERPRINT_MISMATCH',
      message:
        'Every optional-feature binding must pin the exact reusable module-definition payload.',
      contentIds: uniqueSorted(staleModuleIds),
    };
  }
  const budget = request.template.complexityProfile.additionalFeatureBudget;
  for (const countWeight of request.profile.countWeights) {
    if (
      !hasFeasibleCompletion(
        request.profile.candidateBindings,
        new Set(),
        budget,
        countWeight.selectionCount,
        request.profile.incompatibilities,
      )
    ) {
      return {
        ok: false,
        code: 'INFEASIBLE_SELECTION_COUNT',
        message: `${request.profile.id} offers selection count ${countWeight.selectionCount}, but no compatible candidate subset fits the encounter budget.`,
        contentIds: [request.profile.id, request.template.id],
      };
    }
  }
  return { ok: true };
};

const materializeModule = (
  binding: TemplateOptionalFeatureCandidateBinding,
  definition: PatientOptionalFeatureModuleDefinition,
): PatientOptionalFeatureModule => ({
  id: binding.selectedModuleId,
  moduleKind: definition.moduleKind,
  moduleId: definition.id,
  cost: binding.cost,
  impact: binding.impact,
  complexityContributions: binding.complexityContributions.map((contribution) => ({
    ...contribution,
    review: { ...contribution.review },
  })),
});

const artifactPayload = (
  artifact: Omit<OptionalFeatureBudgetSelectionArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  resolverVersion: artifact.resolverVersion,
  requestId: artifact.requestId,
  templateRef: artifact.templateRef,
  templateFingerprint: artifact.templateFingerprint,
  profileRef: artifact.profileRef,
  profileFingerprint: artifact.profileFingerprint,
  moduleReferences: artifact.moduleReferences,
  seed: artifact.seed,
  baselineComplexityUnits: artifact.baselineComplexityUnits,
  additionalFeatureBudget: artifact.additionalFeatureBudget,
  maximumSelectedModules: artifact.maximumSelectedModules,
  countEvaluations: artifact.countEvaluations,
  selectedCount: artifact.selectedCount,
  countStableDrawId: artifact.countStableDrawId,
  selectionDraws: artifact.selectionDraws,
  candidateEvaluations: artifact.candidateEvaluations,
  totalSpent: artifact.totalSpent,
  remainingBudget: artifact.remainingBudget,
  resultingComplexityProfile: artifact.resultingComplexityProfile,
  selectionRequest: artifact.selectionRequest,
  inputFingerprint: artifact.inputFingerprint,
});

const buildArtifact = (
  request: OptionalFeatureBudgetSelectionRequest,
):
  | { readonly ok: true; readonly value: OptionalFeatureBudgetSelectionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'NO_ELIGIBLE_MODULE' | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    } => {
  const templateRef = {
    id: request.template.id,
    contentVersion: request.template.contentVersion,
  };
  const templateFingerprint = fingerprintTemplateConditionSelectionTemplate(request.template);
  const profileRef = {
    id: request.profile.id,
    contentVersion: request.profile.contentVersion,
  };
  const profileFingerprint = fingerprintOptionalFeatureSelectionProfile(request.profile);
  const drawProfileFingerprint = fingerprintOptionalFeatureDrawProfile(request.profile);
  const moduleReferences: OptionalFeatureModuleReference[] = request.moduleDefinitions.map(
    (definition) => ({
      id: definition.id,
      contentVersion: definition.contentVersion,
      fingerprint: fingerprintOptionalFeatureModuleDefinition(definition),
    }),
  );
  const definitionById = new Map(
    request.moduleDefinitions.map((definition) => [definition.id, definition]),
  );
  const bindingByModuleId = new Map(
    request.profile.candidateBindings.map((binding) => [binding.moduleRef.id, binding]),
  );
  const countDraw = drawContext({
    templateRef,
    profileRef,
    drawProfileFingerprint,
    moduleReferences,
    seed: request.seed,
    lane: 'count',
    ordinal: null,
  });
  const selectedCountWeight = weightedChoice(
    request.profile.countWeights,
    seededUnit(request.seed, countDraw.key),
  );
  const selectedModuleIds = new Set<string>();
  const selectedTraceByModuleId = new Map<
    string,
    { readonly ordinal: number; readonly stableDrawId: string }
  >();
  const selectionDraws: OptionalFeatureSelectionDraw[] = [];
  let remainingBudget = request.template.complexityProfile.additionalFeatureBudget;

  for (let ordinal = 0; ordinal < selectedCountWeight.selectionCount; ordinal += 1) {
    const requiredAfterSelection = selectedCountWeight.selectionCount - ordinal - 1;
    const candidateEvaluations: OptionalFeatureSelectionDraw['candidateEvaluations'] =
      request.profile.candidateBindings.map((binding) => {
        if (selectedModuleIds.has(binding.moduleRef.id)) {
          return {
            moduleDefinitionId: binding.moduleRef.id,
            bindingId: binding.id,
            gameSelectionWeight: binding.gameSelectionWeight,
            eligibility: 'already_selected' as const,
            blockingIncompatibilityIds: [],
          };
        }
        if (binding.cost > remainingBudget) {
          return {
            moduleDefinitionId: binding.moduleRef.id,
            bindingId: binding.id,
            gameSelectionWeight: binding.gameSelectionWeight,
            eligibility: 'exceeds_remaining_budget' as const,
            blockingIncompatibilityIds: [],
          };
        }
        const blockers = blockingIncompatibilities(
          binding.moduleRef.id,
          selectedModuleIds,
          request.profile.incompatibilities,
        );
        if (blockers.length > 0) {
          return {
            moduleDefinitionId: binding.moduleRef.id,
            bindingId: binding.id,
            gameSelectionWeight: binding.gameSelectionWeight,
            eligibility: 'incompatible_with_selected' as const,
            blockingIncompatibilityIds: blockers.map((blocker) => blocker.id).sort(compareStrings),
          };
        }
        const nextSelected = new Set(selectedModuleIds);
        nextSelected.add(binding.moduleRef.id);
        const remainingCandidates = request.profile.candidateBindings.filter(
          (candidate) =>
            candidate.moduleRef.id !== binding.moduleRef.id &&
            !selectedModuleIds.has(candidate.moduleRef.id),
        );
        const preservesCompletion = hasFeasibleCompletion(
          remainingCandidates,
          nextSelected,
          remainingBudget - binding.cost,
          requiredAfterSelection,
          request.profile.incompatibilities,
        );
        return {
          moduleDefinitionId: binding.moduleRef.id,
          bindingId: binding.id,
          gameSelectionWeight: binding.gameSelectionWeight,
          eligibility: preservesCompletion
            ? ('eligible' as const)
            : ('would_block_feasible_completion' as const),
          blockingIncompatibilityIds: [],
        };
      });
    const eligible = candidateEvaluations
      .filter((evaluation) => evaluation.eligibility === 'eligible')
      .map((evaluation) => bindingByModuleId.get(evaluation.moduleDefinitionId)!);
    if (eligible.length === 0) {
      return {
        ok: false,
        error: {
          code: 'NO_ELIGIBLE_MODULE',
          message: `No optional feature can complete ordinal ${ordinal} within the remaining budget.`,
          contentIds: [request.template.id, request.profile.id],
        },
      };
    }
    const candidateDraw = drawContext({
      templateRef,
      profileRef,
      drawProfileFingerprint,
      moduleReferences,
      seed: request.seed,
      lane: 'candidate',
      ordinal,
    });
    const selected = weightedChoice(eligible, seededUnit(request.seed, candidateDraw.key));
    const budgetBefore = remainingBudget;
    remainingBudget -= selected.cost;
    selectedModuleIds.add(selected.moduleRef.id);
    selectedTraceByModuleId.set(selected.moduleRef.id, {
      ordinal,
      stableDrawId: candidateDraw.stableDrawId,
    });
    selectionDraws.push({
      selectionOrdinal: ordinal,
      selectedModuleDefinitionId: selected.moduleRef.id,
      selectedBindingId: selected.id,
      stableDrawId: candidateDraw.stableDrawId,
      remainingBudgetBefore: budgetBefore,
      remainingBudgetAfter: remainingBudget,
      candidateEvaluations,
    });
  }

  const candidateEvaluations: OptionalFeatureCandidateEvaluation[] =
    request.profile.candidateBindings.map((binding) => {
      const definition = definitionById.get(binding.moduleRef.id)!;
      const selection = selectedTraceByModuleId.get(binding.moduleRef.id);
      return {
        bindingId: binding.id,
        moduleRef: binding.moduleRef,
        moduleFingerprint: binding.moduleFingerprint,
        moduleSnapshot: materializeModule(binding, definition),
        gameSelectionWeight: binding.gameSelectionWeight,
        review: binding.review,
        disposition: selection === undefined ? 'not_selected' : 'selected',
        selectionOrdinal: selection?.ordinal ?? null,
        stableDrawId: selection?.stableDrawId ?? null,
      };
    });
  const selectedModules = candidateEvaluations
    .filter((evaluation) => evaluation.disposition === 'selected')
    .sort((left, right) => (left.selectionOrdinal ?? 0) - (right.selectionOrdinal ?? 0))
    .map((evaluation) => evaluation.moduleSnapshot);
  const totalSpent = request.template.complexityProfile.additionalFeatureBudget - remainingBudget;
  const baselineComplexityUnits =
    request.template.complexityProfile.modelVersion === 'baseline-plus-additional-budget.v2'
      ? request.template.complexityProfile.baselineComplexityUnits
      : null;
  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    resolverVersion: OPTIONAL_FEATURE_BUDGET_SELECTOR_VERSION,
    requestId: request.id,
    templateRef,
    templateFingerprint,
    profileRef,
    profileFingerprint,
    moduleReferences,
    seed: request.seed,
    baselineComplexityUnits,
    additionalFeatureBudget: request.template.complexityProfile.additionalFeatureBudget,
    maximumSelectedModules: request.template.complexityProfile.maximumSelectedModules,
    countEvaluations: request.profile.countWeights.map((entry) => ({
      selectionCount: entry.selectionCount,
      gameSelectionWeight: entry.gameSelectionWeight,
      selected: entry.selectionCount === selectedCountWeight.selectionCount,
    })),
    selectedCount: selectedCountWeight.selectionCount,
    countStableDrawId: countDraw.stableDrawId,
    selectionDraws,
    candidateEvaluations,
    totalSpent,
    remainingBudget,
    resultingComplexityProfile: {
      ...request.template.complexityProfile,
      selectedModules,
    },
    selectionRequest: request,
    inputFingerprint,
  };
  try {
    const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
    return {
      ok: true,
      value: OptionalFeatureBudgetSelectionArtifactSchema.parse({
        ...withoutIdentity,
        id: `optional-feature-budget-selection.${payloadFingerprint.slice(-16)}`,
        payloadFingerprint,
      }),
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

export const selectOptionalFeaturesWithinBudget = (
  input: unknown,
): OptionalFeatureBudgetSelectionResult => {
  const parsed = OptionalFeatureBudgetSelectionRequestSchema.safeParse(input);
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
  return buildArtifact(request);
};

export const verifyOptionalFeatureBudgetSelectionIntegrity = (
  input: unknown,
): OptionalFeatureBudgetSelectionIntegrityResult => {
  const parsed = OptionalFeatureBudgetSelectionArtifactSchema.safeParse(input);
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
  if (artifact.resolverVersion !== OPTIONAL_FEATURE_BUDGET_SELECTOR_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_RESOLVER_VERSION',
        message: `${artifact.id} uses unsupported optional-feature selector ${artifact.resolverVersion}.`,
      },
    };
  }
  const expectedInputFingerprint = fingerprint('input', artifact.selectionRequest);
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact normalized selection request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('output', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `optional-feature-budget-selection.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen optional-feature audit payload.`,
      },
    };
  }
  const replay = selectOptionalFeaturesWithinBudget(artifact.selectionRequest);
  if (!replay.ok || !sameCanonicalValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained optional-feature request does not reproduce the exact count, feasibility, selection, budget, and provenance audit.',
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyOptionalFeatureBudgetSelectionContext = (input: {
  readonly artifact: unknown;
  readonly request: unknown;
}): OptionalFeatureBudgetSelectionContextResult => {
  const integrity = verifyOptionalFeatureBudgetSelectionIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = selectOptionalFeaturesWithinBudget(input.request);
  if (!expected.ok || !sameCanonicalValue(expected.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: expected.ok
          ? 'The optional-feature artifact does not match this exact request.'
          : `${expected.error.code}: ${expected.error.message}`,
      },
    };
  }
  return { ok: true, value: integrity.value };
};
