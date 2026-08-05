import {
  OptionalFeatureBudgetSelectionArtifactSchema,
  OptionalFeatureBudgetSelectionRequestSchema,
  PatientComplexityProfileSchema,
  type ClinicalRuleReview,
  type OptionalFeatureBudgetSelectionRequest,
  type PatientOptionalFeatureModuleDefinition,
  type PatientTemplate,
  type TemplateOptionalFeatureCandidateBinding,
  type TemplateOptionalFeatureIncompatibility,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  fingerprintOptionalFeatureModuleDefinition,
  selectOptionalFeaturesWithinBudget,
  verifyOptionalFeatureBudgetSelectionContext,
  verifyOptionalFeatureBudgetSelectionIntegrity,
} from './optional-feature-budget-selector';
import { fingerprintTemplateConditionSelectionTemplate } from './template-condition-selector';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-29T20:00:00.000Z',
  sourceUseNoteIds: ['source-use.test.optional-feature-budget'],
};

const makeTemplate = (budget = 4, maximumSelectedModules = 2): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-template.test.optional-feature-budget',
  compilationMode: 'attachment_only.v6',
  careSetting: 'outpatient_psychiatry',
  internalLabel: 'Synthetic optional-feature budget fixture',
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
  review: approvedReview,
  patientPool: 'starter',
  focusedDecisionId: 'decision.test.immediate-treatment',
  primaryPolicyRef: {
    id: 'decision-policy.test.synthetic',
    contentVersion: '1.0.0',
  },
  decisionActionHorizonId: 'decision-action-horizon.test.synthetic',
  decisionActionHorizonFingerprint:
    'fingerprint.catalog-instance.action-horizon.fnv1a64.0000000000000001',
  diagnosisSelectionHorizonId: 'diagnosis-selection-horizon.test.synthetic',
  diagnosisSelectionHorizonFingerprint:
    'fingerprint.catalog-instance.diagnosis-horizon.fnv1a64.0000000000000002',
  findingProjectionHorizonId: 'finding-projection-horizon.test.synthetic',
  findingProjectionHorizonFingerprint:
    'fingerprint.finding.projection-horizon.fnv1a64.0000000000000003',
  universalActionResultAssemblyRecipeRef: {
    id: 'universal-action-result-assembly.test.synthetic',
    contentVersion: '1.0.0',
  },
  universalActionResultAssemblyRecipeFingerprint:
    'fingerprint.universal-action-result.assembly-recipe.fnv1a64.0000000000000004',
  compatibleLocationRefs: [
    {
      id: 'location.test.synthetic',
      contentVersion: '1.0.0',
    },
  ],
  requiredConditions: [
    {
      schemaVersion: 1,
      id: 'template-condition.test.focus',
      diagnosisDefinitionId: 'diagnosis.test.focus',
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      encounterRelevance: 'focus',
      severityId: null,
      specifierIds: [],
    },
  ],
  optionalConditionSelectionGroups: [],
  complexityProfile: {
    modelVersion: 'additional-feature-budget.v1',
    measurementStatus: 'budget_only',
    additionalFeatureBudget: budget,
    maximumSelectedModules,
    selectedModules: [],
    targetEnvelope: null,
  },
  presentationRichnessEnvelope: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'presentation-richness.test.optional-feature-budget',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['diagnostic_attribution'],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const moduleDefinition = (
  id: string,
  moduleKind: 'allergy_reaction' | 'prior_treatment' | 'comorbidity' | 'substance_use' | 'other',
): PatientOptionalFeatureModuleDefinition => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id,
  label: `Synthetic ${moduleKind}`,
  moduleKind,
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
  review: approvedReview,
});

const defaultDefinitions = (): PatientOptionalFeatureModuleDefinition[] => [
  moduleDefinition('optional-feature.test.allergy', 'allergy_reaction'),
  moduleDefinition('optional-feature.test.comorbidity', 'comorbidity'),
  moduleDefinition('optional-feature.test.prior-treatment', 'prior_treatment'),
  moduleDefinition('optional-feature.test.substance-use', 'substance_use'),
];

const bindingFor = (
  definition: PatientOptionalFeatureModuleDefinition,
  index: number,
  cost: number,
  gameSelectionWeight: number,
): TemplateOptionalFeatureCandidateBinding => ({
  schemaVersion: 1,
  id: `optional-feature-binding.test.${index}`,
  moduleRef: {
    id: definition.id,
    contentVersion: definition.contentVersion,
  },
  moduleFingerprint: fingerprintOptionalFeatureModuleDefinition(definition),
  selectedModuleId: `patient-optional-feature.test.${index}`,
  cost,
  impact: index % 2 === 0 ? 'fit_modifier' : 'background',
  complexityContributions: [
    {
      id: `complexity-contribution.test.optional-feature.${index}`,
      label: `Synthetic optional contribution ${index}`,
      dimension: ['diagnostic', 'pharmacologic', 'workup', 'information'][index % 4] as
        | 'diagnostic'
        | 'pharmacologic'
        | 'workup'
        | 'information',
      weight: 1,
      review: approvedReview,
    },
  ],
  gameSelectionWeight,
  review: approvedReview,
});

interface RequestOptions {
  readonly budget?: number;
  readonly maximumSelectedModules?: number;
  readonly seed?: string;
  readonly definitions?: PatientOptionalFeatureModuleDefinition[];
  readonly costs?: readonly number[];
  readonly candidateWeights?: readonly number[];
  readonly countWeights?: readonly number[];
  readonly incompatibilities?: TemplateOptionalFeatureIncompatibility[];
}

const makeRequest = (options: RequestOptions = {}): OptionalFeatureBudgetSelectionRequest => {
  const definitions = options.definitions ?? defaultDefinitions();
  const template = makeTemplate(options.budget ?? 4, options.maximumSelectedModules ?? 2);
  const countWeights = Array.from(
    { length: template.complexityProfile.maximumSelectedModules + 1 },
    (_, selectionCount) => ({
      schemaVersion: 1 as const,
      selectionCount,
      gameSelectionWeight: options.countWeights?.[selectionCount] ?? selectionCount + 1,
    }),
  );
  return {
    schemaVersion: 1,
    id: 'optional-feature-budget-request.test.synthetic',
    template,
    moduleDefinitions: definitions,
    profile: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'optional-feature-profile.test.synthetic',
      modelVersion: 'weighted-optional-feature-budget-selection.v1',
      templateRef: {
        id: template.id,
        contentVersion: template.contentVersion,
      },
      templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
      countWeights,
      candidateBindings: definitions.map((definition, index) =>
        bindingFor(
          definition,
          index,
          options.costs?.[index] ?? [1, 3, 1, 2][index] ?? 1,
          options.candidateWeights?.[index] ?? [5, 2, 4, 3][index] ?? 1,
        ),
      ),
      incompatibilities: options.incompatibilities ?? [],
      review: approvedReview,
    },
    seed: options.seed ?? 'seed.optional-feature-budget',
  };
};

const expectSelected = (request: unknown) => {
  const result = selectOptionalFeaturesWithinBudget(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const findSeedForCount = (
  baseOptions: RequestOptions,
  selectedCount: number,
): { readonly request: OptionalFeatureBudgetSelectionRequest; readonly seed: string } => {
  for (let index = 0; index < 2_000; index += 1) {
    const seed = `seed.optional-feature-budget.count-${selectedCount}.${index}`;
    const request = makeRequest({ ...baseOptions, seed });
    const result = selectOptionalFeaturesWithinBudget(request);
    if (result.ok && result.value.selectedCount === selectedCount) return { request, seed };
  }
  throw new Error(`Could not find a deterministic seed for count ${selectedCount}`);
};

const makeV2Request = (seed: string): OptionalFeatureBudgetSelectionRequest => {
  const definitions = Array.from({ length: 24 }, (_, index) =>
    moduleDefinition(
      `optional-feature.test.high-complexity.${String(index + 1).padStart(2, '0')}`,
      'prior_treatment',
    ),
  );
  const template = makeTemplate();
  template.contentVersion = '2.0.0';
  template.complexityProfile = {
    modelVersion: 'baseline-plus-additional-budget.v2',
    measurementStatus: 'budget_only',
    baselineComplexityUnits: 1,
    additionalFeatureBudget: 96,
    maximumSelectedModules: 24,
    selectedModules: [],
    targetEnvelope: null,
  };
  return {
    schemaVersion: 1,
    id: 'optional-feature-budget-request.test.high-complexity',
    template,
    moduleDefinitions: definitions,
    profile: {
      schemaVersion: 1,
      contentVersion: '2.0.0',
      id: 'optional-feature-profile.test.high-complexity',
      modelVersion: 'weighted-optional-feature-budget-selection.v2',
      templateRef: {
        id: template.id,
        contentVersion: template.contentVersion,
      },
      templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
      countWeights: Array.from({ length: 25 }, (_, selectionCount) => ({
        schemaVersion: 1 as const,
        selectionCount,
        gameSelectionWeight: selectionCount === 24 ? 10_000 : 1,
      })),
      candidateBindings: definitions.map((definition, index) =>
        bindingFor(definition, index, (index % 6) + 1, 1),
      ),
      incompatibilities: [],
      review: approvedReview,
    },
    seed,
  };
};

describe('optional feature budget selector', () => {
  it('strictly parses, selects deterministically, preserves input, and verifies replay', () => {
    const request = makeRequest();
    expect(OptionalFeatureBudgetSelectionRequestSchema.parse(request)).toEqual(request);
    const before = JSON.stringify(request);
    const artifact = expectSelected(request);
    expect(JSON.stringify(request)).toBe(before);
    expect(artifact.baselineComplexityUnits).toBeNull();
    expect(OptionalFeatureBudgetSelectionArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(expectSelected(structuredClone(request))).toEqual(artifact);
    expect(verifyOptionalFeatureBudgetSelectionIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(verifyOptionalFeatureBudgetSelectionContext({ artifact, request })).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('preserves the legacy envelope while accepting a traced 24-module v2 patient', () => {
    const legacyDefinition = defaultDefinitions()[0]!;
    const legacyBinding = bindingFor(legacyDefinition, 0, 4, 1);
    const legacyCostFour = {
      ...makeRequest().template.complexityProfile,
      selectedModules: [
        {
          id: legacyBinding.selectedModuleId,
          moduleKind: 'allergy_reaction' as const,
          moduleId: legacyDefinition.id,
          cost: legacyBinding.cost,
          impact: legacyBinding.impact,
          complexityContributions: legacyBinding.complexityContributions,
        },
      ],
    };
    expect(PatientComplexityProfileSchema.safeParse(legacyCostFour).success).toBe(false);

    let artifact: ReturnType<typeof expectSelected> | null = null;
    for (let index = 0; index < 100; index += 1) {
      const candidate = expectSelected(makeV2Request(`seed.high-complexity.${index}`));
      if (candidate.selectedCount === 24) {
        artifact = candidate;
        break;
      }
    }
    expect(artifact).not.toBeNull();
    expect(artifact!.resolverVersion).toBe('3.0.0');
    expect(artifact!.baselineComplexityUnits).toBe(1);
    expect(artifact!.selectedCount).toBe(24);
    expect(artifact!.selectionDraws).toHaveLength(24);
    expect(artifact!.selectionDraws.at(-1)?.selectionOrdinal).toBe(23);
    expect(artifact!.totalSpent).toBe(84);
    expect(artifact!.remainingBudget).toBe(12);
    expect(artifact!.resultingComplexityProfile).toMatchObject({
      modelVersion: 'baseline-plus-additional-budget.v2',
      baselineComplexityUnits: 1,
      additionalFeatureBudget: 96,
      maximumSelectedModules: 24,
    });
    expect(
      artifact!.candidateEvaluations.every((evaluation) => evaluation.stableDrawId !== null),
    ).toBe(true);
    expect(verifyOptionalFeatureBudgetSelectionIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('is invariant to set-like input order while different seeds vary allowed selections', () => {
    const request = makeRequest();
    const reordered = structuredClone(request);
    reordered.moduleDefinitions.reverse();
    reordered.profile.countWeights.reverse();
    reordered.profile.candidateBindings.reverse();
    reordered.profile.candidateBindings.forEach((binding) =>
      binding.complexityContributions.reverse(),
    );
    expect(expectSelected(reordered)).toEqual(expectSelected(request));

    const signatures = new Set<string>();
    for (let index = 0; index < 200; index += 1) {
      const artifact = expectSelected(
        makeRequest({ seed: `seed.optional-feature-budget.variation.${index}` }),
      );
      signatures.add(
        `${artifact.selectedCount}:${artifact.resultingComplexityProfile.selectedModules
          .map((module) => module.moduleId)
          .sort()
          .join(',')}`,
      );
    }
    expect(signatures.size).toBeGreaterThan(2);
  });

  it('treats the budget as a maximum, records unspent capacity, and never exceeds either cap', () => {
    for (let index = 0; index < 300; index += 1) {
      const artifact = expectSelected(
        makeRequest({ seed: `seed.optional-feature-budget.bounds.${index}` }),
      );
      expect(artifact.totalSpent).toBeLessThanOrEqual(artifact.additionalFeatureBudget);
      expect(artifact.remainingBudget).toBe(artifact.additionalFeatureBudget - artifact.totalSpent);
      expect(artifact.selectedCount).toBeLessThanOrEqual(artifact.maximumSelectedModules);
    }
    const zeroCount = findSeedForCount({}, 0);
    const zeroArtifact = expectSelected(zeroCount.request);
    expect(zeroArtifact.totalSpent).toBe(0);
    expect(zeroArtifact.remainingBudget).toBe(4);
    expect(zeroArtifact.resultingComplexityProfile.selectedModules).toEqual([]);
  });

  it('does not spend or resize optional complexity merely because the care setting changes', () => {
    const outpatientRequest = makeRequest({ seed: 'seed.optional-feature-budget.care-setting' });
    const edRequest = structuredClone(outpatientRequest);
    edRequest.template.careSetting = 'emergency_department';
    edRequest.profile.templateFingerprint = fingerprintTemplateConditionSelectionTemplate(
      edRequest.template,
    );

    const outpatient = expectSelected(outpatientRequest);
    const emergency = expectSelected(edRequest);
    expect(emergency.templateFingerprint).not.toBe(outpatient.templateFingerprint);
    expect(emergency.profileFingerprint).not.toBe(outpatient.profileFingerprint);
    expect(emergency.countStableDrawId).toBe(outpatient.countStableDrawId);
    expect(emergency.selectedCount).toBe(outpatient.selectedCount);
    expect(emergency.totalSpent).toBe(outpatient.totalSpent);
    expect(emergency.remainingBudget).toBe(outpatient.remainingBudget);
    expect(emergency.additionalFeatureBudget).toBe(outpatient.additionalFeatureBudget);
    expect(
      emergency.resultingComplexityProfile.selectedModules.map((module) => module.moduleId),
    ).toEqual(
      outpatient.resultingComplexityProfile.selectedModules.map((module) => module.moduleId),
    );
    expect(emergency.selectionDraws.map((draw) => draw.stableDrawId)).toEqual(
      outpatient.selectionDraws.map((draw) => draw.stableDrawId),
    );
  });

  it('supports a zero-budget, zero-module recipe without inventing optional texture', () => {
    const artifact = expectSelected(
      makeRequest({
        budget: 0,
        maximumSelectedModules: 0,
        definitions: [],
        countWeights: [1],
      }),
    );
    expect(artifact.selectedCount).toBe(0);
    expect(artifact.candidateEvaluations).toEqual([]);
    expect(artifact.selectionDraws).toEqual([]);
    expect(artifact.totalSpent).toBe(0);
    expect(artifact.remainingBudget).toBe(0);
  });

  it('uses exact feasibility look-ahead so an expensive high-weight draw cannot block completion', () => {
    const definitions = [
      moduleDefinition('optional-feature.test.expensive', 'other'),
      moduleDefinition('optional-feature.test.cheap-a', 'prior_treatment'),
      moduleDefinition('optional-feature.test.cheap-b', 'substance_use'),
    ];
    const options: RequestOptions = {
      budget: 2,
      maximumSelectedModules: 2,
      definitions,
      costs: [2, 1, 1],
      candidateWeights: [10_000, 1, 1],
      countWeights: [1, 1, 10_000],
    };
    const { request } = findSeedForCount(options, 2);
    const artifact = expectSelected(request);
    const firstStepExpensive = artifact.selectionDraws[0]!.candidateEvaluations.find(
      (evaluation) => evaluation.moduleDefinitionId === 'optional-feature.test.expensive',
    );
    expect(firstStepExpensive?.eligibility).toBe('would_block_feasible_completion');
    expect(
      artifact.resultingComplexityProfile.selectedModules.map((module) => module.cost),
    ).toEqual([1, 1]);
    expect(artifact.totalSpent).toBe(2);
  });

  it('rejects an explicitly weighted count when no compatible subset can fit the budget', () => {
    const result = selectOptionalFeaturesWithinBudget(
      makeRequest({
        budget: 1,
        maximumSelectedModules: 2,
        definitions: defaultDefinitions().slice(0, 2),
        costs: [1, 1],
      }),
    );
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'INFEASIBLE_SELECTION_COUNT' },
    });
  });

  it('never selects an explicitly incompatible module pair', () => {
    const incompatibility: TemplateOptionalFeatureIncompatibility = {
      schemaVersion: 1,
      id: 'optional-feature-incompatibility.test.allergy-comorbidity',
      leftModuleId: 'optional-feature.test.allergy',
      rightModuleId: 'optional-feature.test.comorbidity',
      reason: 'Synthetic literal incompatibility used only to test selection.',
      review: approvedReview,
    };
    for (let index = 0; index < 300; index += 1) {
      const artifact = expectSelected(
        makeRequest({
          budget: 5,
          seed: `seed.optional-feature-budget.incompatibility.${index}`,
          incompatibilities: [incompatibility],
        }),
      );
      const selectedIds = new Set(
        artifact.resultingComplexityProfile.selectedModules.map((module) => module.moduleId),
      );
      expect(
        selectedIds.has(incompatibility.leftModuleId) &&
          selectedIds.has(incompatibility.rightModuleId),
      ).toBe(false);
    }
  });

  it('records the exact incompatibility that blocks a candidate after another is selected', () => {
    const definitions = [
      moduleDefinition('optional-feature.test.a', 'other'),
      moduleDefinition('optional-feature.test.b', 'other'),
      moduleDefinition('optional-feature.test.c', 'other'),
    ];
    const incompatibility: TemplateOptionalFeatureIncompatibility = {
      schemaVersion: 1,
      id: 'optional-feature-incompatibility.test.a-b',
      leftModuleId: 'optional-feature.test.a',
      rightModuleId: 'optional-feature.test.b',
      reason: 'Synthetic trace-only incompatibility.',
      review: approvedReview,
    };
    let artifact: ReturnType<typeof expectSelected> | null = null;
    for (let index = 0; index < 2_000; index += 1) {
      const candidate = expectSelected(
        makeRequest({
          budget: 2,
          maximumSelectedModules: 2,
          definitions,
          costs: [1, 1, 1],
          candidateWeights: [10_000, 1, 1],
          countWeights: [1, 1, 10_000],
          incompatibilities: [incompatibility],
          seed: `seed.optional-feature-budget.blocker.${index}`,
        }),
      );
      if (
        candidate.selectedCount === 2 &&
        candidate.selectionDraws[0]?.selectedModuleDefinitionId === 'optional-feature.test.a'
      ) {
        artifact = candidate;
        break;
      }
    }
    expect(artifact).not.toBeNull();
    const blocked = artifact!.selectionDraws[1]!.candidateEvaluations.find(
      (evaluation) => evaluation.moduleDefinitionId === 'optional-feature.test.b',
    );
    expect(blocked).toMatchObject({
      eligibility: 'incompatible_with_selected',
      blockingIncompatibilityIds: [incompatibility.id],
    });
  });

  it('uses incompatibility look-ahead and rejects a count made infeasible only by incompatibility', () => {
    const definitions = [
      moduleDefinition('optional-feature.test.a', 'other'),
      moduleDefinition('optional-feature.test.b', 'other'),
      moduleDefinition('optional-feature.test.c', 'other'),
    ];
    const incompatibilities: TemplateOptionalFeatureIncompatibility[] = [
      {
        schemaVersion: 1,
        id: 'optional-feature-incompatibility.test.a-b',
        leftModuleId: 'optional-feature.test.a',
        rightModuleId: 'optional-feature.test.b',
        reason: 'Synthetic look-ahead incompatibility A-B.',
        review: approvedReview,
      },
      {
        schemaVersion: 1,
        id: 'optional-feature-incompatibility.test.a-c',
        leftModuleId: 'optional-feature.test.a',
        rightModuleId: 'optional-feature.test.c',
        reason: 'Synthetic look-ahead incompatibility A-C.',
        review: approvedReview,
      },
    ];
    const options: RequestOptions = {
      budget: 2,
      maximumSelectedModules: 2,
      definitions,
      costs: [1, 1, 1],
      candidateWeights: [10_000, 1, 1],
      countWeights: [1, 1, 10_000],
      incompatibilities,
    };
    const { request } = findSeedForCount(options, 2);
    const artifact = expectSelected(request);
    expect(
      artifact.selectionDraws[0]!.candidateEvaluations.find(
        (evaluation) => evaluation.moduleDefinitionId === 'optional-feature.test.a',
      )?.eligibility,
    ).toBe('would_block_feasible_completion');
    expect(
      artifact.resultingComplexityProfile.selectedModules.map((module) => module.moduleId).sort(),
    ).toEqual(['optional-feature.test.b', 'optional-feature.test.c']);

    const twoDefinitions = definitions.slice(0, 2);
    const impossible = selectOptionalFeaturesWithinBudget(
      makeRequest({
        budget: 2,
        maximumSelectedModules: 2,
        definitions: twoDefinitions,
        costs: [1, 1],
        incompatibilities: [incompatibilities[0]!],
      }),
    );
    expect(impossible).toMatchObject({
      ok: false,
      error: { code: 'INFEASIBLE_SELECTION_COUNT' },
    });
  });

  it('keeps required template state outside the optional budget and changes only the result profile', () => {
    const request = findSeedForCount({}, 2).request;
    const originalRequired = structuredClone(request.template.requiredConditions);
    const artifact = expectSelected(request);
    expect(request.template.requiredConditions).toEqual(originalRequired);
    expect(request.template.complexityProfile.selectedModules).toEqual([]);
    expect(artifact.selectionRequest.template.requiredConditions).toEqual(originalRequired);
    expect(artifact.resultingComplexityProfile.selectedModules).toHaveLength(2);
    expect(artifact.totalSpent).toBe(
      artifact.resultingComplexityProfile.selectedModules.reduce(
        (total, module) => total + module.cost,
        0,
      ),
    );
  });

  it('rejects stale module and template fingerprints plus duplicate candidate ownership', () => {
    const staleModule = makeRequest();
    staleModule.profile.candidateBindings[0]!.moduleFingerprint =
      'fingerprint.optional-feature-budget.module-definition.fnv1a64.0000000000000000';
    expect(selectOptionalFeaturesWithinBudget(staleModule)).toMatchObject({
      ok: false,
      error: { code: 'MODULE_FINGERPRINT_MISMATCH' },
    });

    const staleTemplate = makeRequest();
    staleTemplate.template.internalLabel = 'Mutated after profile fingerprinting';
    expect(selectOptionalFeaturesWithinBudget(staleTemplate)).toMatchObject({
      ok: false,
      error: { code: 'TEMPLATE_FINGERPRINT_MISMATCH' },
    });

    const duplicate = makeRequest();
    duplicate.profile.candidateBindings[1]!.moduleRef =
      duplicate.profile.candidateBindings[0]!.moduleRef;
    expect(OptionalFeatureBudgetSelectionRequestSchema.safeParse(duplicate).success).toBe(false);
  });

  it('detects selection, budget, provenance, retained-request, and fingerprint tampering', () => {
    const artifact = expectSelected(findSeedForCount({}, 2).request);
    const tamperCases = [
      (candidate: typeof artifact) => {
        candidate.totalSpent = 0;
      },
      (candidate: typeof artifact) => {
        candidate.baselineComplexityUnits = 1;
      },
      (candidate: typeof artifact) => {
        candidate.remainingBudget = 6;
      },
      (candidate: typeof artifact) => {
        candidate.candidateEvaluations[0]!.review.reviewerId = 'reviewer.tampered';
      },
      (candidate: typeof artifact) => {
        candidate.selectionRequest.profile.candidateBindings[0]!.cost = 3;
      },
      (candidate: typeof artifact) => {
        candidate.countStableDrawId = 'stable-draw.optional-feature-budget.tampered-count';
      },
      (candidate: typeof artifact) => {
        candidate.selectionDraws[0]!.stableDrawId =
          'stable-draw.optional-feature-budget.tampered-candidate';
      },
      (candidate: typeof artifact) => {
        candidate.selectionDraws[0]!.candidateEvaluations[0]!.eligibility =
          'would_block_feasible_completion';
      },
      (candidate: typeof artifact) => {
        candidate.selectionDraws[0]!.candidateEvaluations[0]!.eligibility =
          'incompatible_with_selected';
        candidate.selectionDraws[0]!.candidateEvaluations[0]!.blockingIncompatibilityIds = [
          'optional-feature-incompatibility.test.tampered',
        ];
      },
      (candidate: typeof artifact) => {
        candidate.candidateEvaluations[0]!.moduleSnapshot.cost = 3;
      },
      (candidate: typeof artifact) => {
        candidate.payloadFingerprint =
          'fingerprint.optional-feature-budget.output.fnv1a64.0000000000000000';
        candidate.id = 'optional-feature-budget-selection.0000000000000000';
      },
    ];
    for (const mutate of tamperCases) {
      const candidate = structuredClone(artifact);
      mutate(candidate);
      expect(verifyOptionalFeatureBudgetSelectionIntegrity(candidate).ok).toBe(false);
    }
  });

  it('rejects a stale exact request during context replay', () => {
    const request = makeRequest();
    const artifact = expectSelected(request);
    const stale = makeRequest({ seed: 'seed.optional-feature-budget.stale-context' });
    expect(
      verifyOptionalFeatureBudgetSelectionContext({
        artifact,
        request: stale,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });
});
