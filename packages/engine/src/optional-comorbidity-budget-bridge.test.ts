import {
  ConditionFindingCardinalityRequestSchema,
  OptionalComorbidityBridgeArtifactSchema,
  OptionalComorbidityBridgeRequestSchema,
  ResolvedConditionSourceSchema,
  TemplateConditionSelectionArtifactSchema,
  type ClinicalRuleReview,
  type ConditionFindingCardinalityProfile,
  type FindingDefinition,
  type OptionalComorbidityBridgeProfile,
  type OptionalComorbidityBridgeRequest,
  type OptionalFeatureBudgetSelectionArtifact,
  type OptionalFeatureBudgetSelectionRequest,
  type PatientOptionalFeatureModuleDefinition,
  type PatientTemplate,
  type PatientTemplateConditionConstraint,
  type TemplateConditionSelectionRequest,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  fingerprintConditionFindingCardinalityProfile,
  selectConditionFindingCardinalityCandidates,
  verifyConditionFindingCardinalityContext,
  verifyConditionFindingCardinalityIntegrity,
} from './condition-finding-cardinality-selector';
import {
  bridgeOptionalComorbiditiesFromBudget,
  fingerprintOptionalComorbidityBridgeProfile,
  verifyOptionalComorbidityBridgeContext,
  verifyOptionalComorbidityBridgeIntegrity,
} from './optional-comorbidity-budget-bridge';
import {
  fingerprintOptionalFeatureModuleDefinition,
  selectOptionalFeaturesWithinBudget,
} from './optional-feature-budget-selector';
import {
  fingerprintTemplateConditionSelectionProfile,
  fingerprintTemplateConditionSelectionTemplate,
} from './template-condition-selector';
import { verifyResolvedConditionSourceIntegrity } from './resolved-condition-source';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-29T21:30:00.000Z',
  sourceUseNoteIds: [
    'source-use.test.optional-comorbidity-bridge.two',
    'source-use.test.optional-comorbidity-bridge.one',
  ],
};

const condition = (
  id: string,
  diagnosisDefinitionId: string,
  encounterRelevance: 'focus' | 'contributing' | 'background',
): PatientTemplateConditionConstraint => ({
  schemaVersion: 1,
  id,
  diagnosisDefinitionId,
  diagnosisDefinitionContentVersion: '1.0.0',
  clinicalStateId: 'clinical-state.current',
  timeScopeId: 'time-scope.current',
  encounterRelevance,
  severityId: null,
  specifierIds: [],
});

interface TemplateOptions {
  readonly budget?: number;
  readonly maximumSelectedModules?: number;
  readonly includeOptionalConditions?: boolean;
  readonly optionalGroupMaximum?: number;
  readonly optionalGroupMinimum?: number;
}

const makeTemplate = (options: TemplateOptions = {}): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-template.test.optional-comorbidity-bridge',
  compilationMode: 'attachment_only.v6',
  careSetting: 'outpatient_psychiatry',
  internalLabel: 'Synthetic optional-comorbidity bridge fixture',
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
  requiredConditions: [condition('template-condition.test.focus', 'diagnosis.test.focus', 'focus')],
  optionalConditionSelectionGroups:
    options.includeOptionalConditions === false
      ? []
      : [
          {
            schemaVersion: 1,
            id: 'template-condition-group.test.comorbid',
            minimumSelections: options.optionalGroupMinimum ?? 0,
            maximumSelections: options.optionalGroupMaximum ?? 2,
            candidates: [
              condition(
                'template-condition.test.comorbid-a',
                'diagnosis.test.comorbid-a',
                'contributing',
              ),
              condition(
                'template-condition.test.comorbid-b',
                'diagnosis.test.comorbid-b',
                'contributing',
              ),
            ],
          },
        ],
  complexityProfile: {
    modelVersion: 'additional-feature-budget.v1',
    measurementStatus: 'budget_only',
    additionalFeatureBudget: options.budget ?? 3,
    maximumSelectedModules: options.maximumSelectedModules ?? 2,
    selectedModules: [],
    targetEnvelope: null,
  },
  presentationRichnessEnvelope: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'presentation-richness.test.optional-comorbidity-bridge',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['comorbidity_fit', 'diagnostic_attribution'],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const moduleDefinition = (
  id: string,
  moduleKind: 'comorbidity' | 'prior_treatment',
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
  moduleDefinition('optional-feature.test.comorbidity-a', 'comorbidity'),
  moduleDefinition('optional-feature.test.comorbidity-b', 'comorbidity'),
  moduleDefinition('optional-feature.test.prior-treatment', 'prior_treatment'),
];

const makeOptionalFeatureRequest = (
  template: PatientTemplate,
  definitions: PatientOptionalFeatureModuleDefinition[],
  seed: string,
): OptionalFeatureBudgetSelectionRequest => ({
  schemaVersion: 1,
  id: 'optional-feature-budget-request.test.optional-comorbidity-bridge',
  template,
  moduleDefinitions: definitions,
  profile: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-feature-profile.test.optional-comorbidity-bridge',
    modelVersion: 'weighted-optional-feature-budget-selection.v1',
    templateRef: { id: template.id, contentVersion: template.contentVersion },
    templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
    countWeights: Array.from(
      { length: template.complexityProfile.maximumSelectedModules + 1 },
      (_, selectionCount) => ({
        schemaVersion: 1 as const,
        selectionCount,
        gameSelectionWeight: selectionCount + 1,
      }),
    ),
    candidateBindings: definitions.map((definition, index) => ({
      schemaVersion: 1,
      id: `optional-feature-binding.test.bridge.${index}`,
      moduleRef: {
        id: definition.id,
        contentVersion: definition.contentVersion,
      },
      moduleFingerprint: fingerprintOptionalFeatureModuleDefinition(definition),
      selectedModuleId: `patient-optional-feature.test.bridge.${index}`,
      cost: 1,
      impact: definition.moduleKind === 'comorbidity' ? 'fit_modifier' : 'background',
      complexityContributions: [
        {
          id: `complexity-contribution.test.bridge.${index}`,
          label: `Synthetic bridge contribution ${index}`,
          dimension: definition.moduleKind === 'comorbidity' ? 'diagnostic' : 'information',
          weight: 1,
          review: approvedReview,
        },
      ],
      gameSelectionWeight: [7, 5, 3][index] ?? 1,
      review: approvedReview,
    })),
    incompatibilities: [],
    review: approvedReview,
  },
  seed,
});

const expectOptionalArtifact = (
  request: OptionalFeatureBudgetSelectionRequest,
): OptionalFeatureBudgetSelectionArtifact => {
  const result = selectOptionalFeaturesWithinBudget(request);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const findOptionalArtifact = (
  template: PatientTemplate,
  definitions: PatientOptionalFeatureModuleDefinition[],
  predicate: (artifact: OptionalFeatureBudgetSelectionArtifact) => boolean,
): OptionalFeatureBudgetSelectionArtifact => {
  for (let index = 0; index < 4_000; index += 1) {
    const request = makeOptionalFeatureRequest(template, definitions, `seed.bridge.${index}`);
    const result = selectOptionalFeaturesWithinBudget(request);
    if (result.ok && predicate(result.value)) return result.value;
  }
  throw new Error('Could not find a deterministic optional-feature fixture seed.');
};

const makeConditionRequest = (
  template: PatientTemplate,
  options: {
    readonly seed?: string;
    readonly candidateWeights?: readonly number[];
    readonly countWeights?: readonly number[];
    readonly addFocusComorbidityAConflict?: boolean;
  } = {},
): TemplateConditionSelectionRequest => {
  const profile: TemplateConditionSelectionRequest['profile'] = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'condition-profile.test.optional-comorbidity-bridge',
    modelVersion: 'weighted-template-condition-selection.v1',
    templateRef: { id: template.id, contentVersion: template.contentVersion },
    templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
    groupProfiles: template.optionalConditionSelectionGroups.map((group) => ({
      schemaVersion: 1,
      id: `condition-profile-group.test.${group.id}`,
      groupId: group.id,
      countWeights: Array.from({ length: group.maximumSelections + 1 }, (_, selectionCount) => ({
        schemaVersion: 1 as const,
        selectionCount,
        gameSelectionWeight: options.countWeights?.[selectionCount] ?? selectionCount + 1,
      })),
      candidateWeights: group.candidates.map((candidate, index) => ({
        schemaVersion: 1,
        templateConditionId: candidate.id,
        gameSelectionWeight: options.candidateWeights?.[index] ?? [9, 1][index] ?? 1,
      })),
    })),
    incompatibilities: options.addFocusComorbidityAConflict
      ? [
          {
            schemaVersion: 1,
            id: 'condition-incompatibility.test.focus-comorbid-a',
            leftTemplateConditionId: 'template-condition.test.comorbid-a',
            rightTemplateConditionId: 'template-condition.test.focus',
            reason: 'Synthetic literal conflict.',
            review: approvedReview,
          },
        ]
      : [],
  };
  return {
    schemaVersion: 1,
    id: 'condition-selection-request.test.optional-comorbidity-bridge',
    template: structuredClone(template),
    profile,
    seed: options.seed ?? 'condition-seed.must-not-select-bridge-membership',
  };
};

const targetByModuleId: Readonly<Record<string, string>> = {
  'optional-feature.test.comorbidity-a': 'template-condition.test.comorbid-a',
  'optional-feature.test.comorbidity-b': 'template-condition.test.comorbid-b',
};

const makeBridgeProfile = (
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
  conditionRequest: TemplateConditionSelectionRequest,
): OptionalComorbidityBridgeProfile => {
  const template = conditionRequest.template;
  const optionalRequest = optionalArtifact.selectionRequest;
  return {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'bridge-profile.test.optional-comorbidity',
    modelVersion: 'optional-comorbidity-condition-bridge.v1',
    templateRef: { id: template.id, contentVersion: template.contentVersion },
    templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
    optionalFeatureProfileRef: optionalArtifact.profileRef,
    optionalFeatureProfileFingerprint: optionalArtifact.profileFingerprint,
    conditionProfileRef: {
      id: conditionRequest.profile.id,
      contentVersion: conditionRequest.profile.contentVersion,
    },
    conditionProfileFingerprint: fingerprintTemplateConditionSelectionProfile(
      conditionRequest.profile,
    ),
    mappings: optionalRequest.moduleDefinitions
      .filter((definition) => definition.moduleKind === 'comorbidity')
      .map((definition) => {
        const binding = optionalRequest.profile.candidateBindings.find(
          (candidate) => candidate.moduleRef.id === definition.id,
        )!;
        return {
          schemaVersion: 1,
          id: `optional-comorbidity-mapping.test.${definition.id}`,
          moduleRef: binding.moduleRef,
          moduleFingerprint: binding.moduleFingerprint,
          optionalFeatureBindingId: binding.id,
          selectedModuleId: binding.selectedModuleId,
          groupId: 'template-condition-group.test.comorbid',
          templateConditionId: targetByModuleId[definition.id]!,
          review: approvedReview,
        };
      }),
    review: approvedReview,
  };
};

const makeBridgeRequest = (
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
  conditionRequest = makeConditionRequest(optionalArtifact.selectionRequest.template),
): OptionalComorbidityBridgeRequest => ({
  schemaVersion: 1,
  id: 'optional-comorbidity-bridge-request.test.synthetic',
  optionalFeatureArtifact: optionalArtifact,
  conditionSelectionRequest: conditionRequest,
  bridgeProfile: makeBridgeProfile(optionalArtifact, conditionRequest),
});

const expectBridgeArtifact = (request: unknown) => {
  const result = bridgeOptionalComorbiditiesFromBudget(request);
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error('error' in result ? result.error.message : result.conflict.code);
  }
  return result.value;
};

const selectedComorbidityIds = (artifact: OptionalFeatureBudgetSelectionArtifact): string[] => {
  const kindByDefinitionId = new Map(
    artifact.selectionRequest.moduleDefinitions.map((definition) => [
      definition.id,
      definition.moduleKind,
    ]),
  );
  return artifact.candidateEvaluations
    .filter(
      (evaluation) =>
        evaluation.disposition === 'selected' &&
        kindByDefinitionId.get(evaluation.moduleRef.id) === 'comorbidity',
    )
    .map((evaluation) => evaluation.moduleRef.id)
    .sort();
};

describe('optional comorbidity budget bridge', () => {
  it('strictly parses, deterministically materializes, preserves input, and replays integrity', () => {
    const template = makeTemplate();
    const optionalArtifact = findOptionalArtifact(
      template,
      defaultDefinitions(),
      (artifact) =>
        selectedComorbidityIds(artifact).length === 1 &&
        selectedComorbidityIds(artifact).includes('optional-feature.test.comorbidity-a'),
    );
    const request = makeBridgeRequest(optionalArtifact);
    expect(OptionalComorbidityBridgeRequestSchema.parse(request)).toEqual(request);
    const before = JSON.stringify(request);
    const artifact = expectBridgeArtifact(request);
    expect(JSON.stringify(request)).toBe(before);
    expect(OptionalComorbidityBridgeArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(expectBridgeArtifact(structuredClone(request))).toEqual(artifact);
    expect(verifyOptionalComorbidityBridgeIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(verifyOptionalComorbidityBridgeContext({ artifact, request })).toEqual({
      ok: true,
      value: artifact,
    });
    expect(
      artifact.conditionBindings.filter((binding) => binding.kind === 'required'),
    ).toHaveLength(1);
    expect(
      artifact.conditionBindings.filter((binding) => binding.kind === 'optional_group'),
    ).toHaveLength(1);
    const selected = artifact.groupAudits[0]!.candidateEvaluations.find(
      (evaluation) => evaluation.disposition === 'selected_by_optional_feature',
    )!;
    const upstream = optionalArtifact.candidateEvaluations.find(
      (evaluation) => evaluation.moduleRef.id === selected.moduleRef.id,
    )!;
    expect(selected.optionalFeatureStableDrawId).toBe(upstream.stableDrawId);
  });

  it('keeps zero or non-comorbidity-only selections outside condition materialization', () => {
    const template = makeTemplate({
      includeOptionalConditions: false,
      maximumSelectedModules: 1,
    });
    const definitions = [
      moduleDefinition('optional-feature.test.prior-treatment', 'prior_treatment'),
    ];
    const zeroArtifact = findOptionalArtifact(
      template,
      definitions,
      (artifact) => artifact.selectedCount === 0,
    );
    const zeroBridge = expectBridgeArtifact(makeBridgeRequest(zeroArtifact));
    expect(zeroBridge.selectedComorbidityModuleDefinitionIds).toEqual([]);
    expect(zeroBridge.conditionStates).toHaveLength(1);

    const optionalArtifact = findOptionalArtifact(
      template,
      definitions,
      (artifact) => artifact.selectedCount === 1,
    );
    const artifact = expectBridgeArtifact(makeBridgeRequest(optionalArtifact));
    expect(optionalArtifact.resultingComplexityProfile.selectedModules).toHaveLength(1);
    expect(artifact.selectedComorbidityModuleDefinitionIds).toEqual([]);
    expect(artifact.groupAudits).toEqual([]);
    expect(artifact.conditionStates).toHaveLength(1);
    expect(artifact.conditionBindings).toHaveLength(1);
    expect(artifact.conditionStates[0]!.origin).toBe('authored');
  });

  it('maps multiple selected comorbidities one-to-one without another budget charge', () => {
    const template = makeTemplate();
    const optionalArtifact = findOptionalArtifact(
      template,
      defaultDefinitions(),
      (artifact) => selectedComorbidityIds(artifact).length === 2,
    );
    const artifact = expectBridgeArtifact(makeBridgeRequest(optionalArtifact));
    expect(artifact.selectedComorbidityModuleDefinitionIds).toEqual(
      selectedComorbidityIds(optionalArtifact),
    );
    expect(artifact.groupAudits[0]!.selectedCount).toBe(2);
    expect(
      artifact.conditionBindings.filter((binding) => binding.kind === 'optional_group'),
    ).toHaveLength(2);
    expect(artifact.bridgeRequest.optionalFeatureArtifact.totalSpent).toBe(
      optionalArtifact.totalSpent,
    );
    expect(artifact.bridgeRequest.optionalFeatureArtifact.remainingBudget).toBe(
      optionalArtifact.remainingBudget,
    );
  });

  it('uses D-201 as sole membership authority regardless of D-196 seed or weights', () => {
    const template = makeTemplate();
    const optionalArtifact = findOptionalArtifact(
      template,
      defaultDefinitions(),
      (artifact) => selectedComorbidityIds(artifact).length === 1,
    );
    const firstConditionRequest = makeConditionRequest(template, {
      seed: 'condition-seed.first',
      countWeights: [100, 1, 1],
      candidateWeights: [100, 1],
    });
    const secondConditionRequest = makeConditionRequest(template, {
      seed: 'condition-seed.second',
      countWeights: [1, 1, 100],
      candidateWeights: [1, 100],
    });
    const first = expectBridgeArtifact(makeBridgeRequest(optionalArtifact, firstConditionRequest));
    const second = expectBridgeArtifact(
      makeBridgeRequest(optionalArtifact, secondConditionRequest),
    );
    const semanticProjection = (artifact: typeof first) => ({
      selected: artifact.selectedComorbidityModuleDefinitionIds,
      states: artifact.conditionStates,
      bindings: artifact.conditionBindings,
      provenance: artifact.groupAudits.flatMap((group) =>
        group.candidateEvaluations.map((candidate) => ({
          module: candidate.moduleRef.id,
          disposition: candidate.disposition,
          ordinal: candidate.optionalFeatureSelectionOrdinal,
          stableDrawId: candidate.optionalFeatureStableDrawId,
        })),
      ),
    });
    expect(semanticProjection(second)).toEqual(semanticProjection(first));
    expect(second.payloadFingerprint).not.toBe(first.payloadFingerprint);
  });

  it('rejects a D-201 selection that exceeds an exact D-196 group ceiling', () => {
    const template = makeTemplate({ optionalGroupMaximum: 1 });
    const optionalArtifact = findOptionalArtifact(
      template,
      defaultDefinitions(),
      (artifact) => selectedComorbidityIds(artifact).length === 2,
    );
    const result = bridgeOptionalComorbiditiesFromBudget(makeBridgeRequest(optionalArtifact));
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'GROUP_CAPACITY_EXCEEDED' },
    });
  });

  it('preserves an exact literal incompatibility instead of rerolling or substituting', () => {
    const template = makeTemplate();
    const optionalArtifact = findOptionalArtifact(template, defaultDefinitions(), (artifact) =>
      selectedComorbidityIds(artifact).includes('optional-feature.test.comorbidity-a'),
    );
    const request = makeBridgeRequest(
      optionalArtifact,
      makeConditionRequest(template, { addFocusComorbidityAConflict: true }),
    );
    const result = bridgeOptionalComorbiditiesFromBudget(request);
    expect(result.ok).toBe(false);
    if (result.ok || 'error' in result) {
      throw new Error(result.ok ? 'Expected literal conflict.' : result.error.message);
    }
    expect(result.conflict).toMatchObject({
      code: 'LITERAL_CONDITION_INCOMPATIBILITY',
      disposition: 'retry_or_quarantine',
      artifact: {
        status: 'literal_condition_incompatibility',
        selectedComorbidityModuleDefinitionIds: expect.arrayContaining([
          'optional-feature.test.comorbidity-a',
        ]),
      },
    });
    expect(result.conflict.artifact.conflicts).toHaveLength(1);
    expect(verifyOptionalComorbidityBridgeIntegrity(result.conflict.artifact).ok).toBe(true);
  });

  it('rejects missing, extra, stale, non-comorbidity, duplicate, and nonoptional mappings', () => {
    const template = makeTemplate();
    const optionalArtifact = findOptionalArtifact(
      template,
      defaultDefinitions(),
      (artifact) => selectedComorbidityIds(artifact).length > 0,
    );
    const base = makeBridgeRequest(optionalArtifact);
    const invalidRequests: OptionalComorbidityBridgeRequest[] = [];

    const missing = structuredClone(base);
    missing.bridgeProfile.mappings.pop();
    invalidRequests.push(missing);

    const staleBinding = structuredClone(base);
    staleBinding.bridgeProfile.mappings[0]!.optionalFeatureBindingId =
      'optional-feature-binding.test.stale';
    invalidRequests.push(staleBinding);

    const staleSelectedRecord = structuredClone(base);
    staleSelectedRecord.bridgeProfile.mappings[0]!.selectedModuleId =
      'patient-optional-feature.test.stale';
    invalidRequests.push(staleSelectedRecord);

    const staleFingerprint = structuredClone(base);
    staleFingerprint.bridgeProfile.mappings[0]!.moduleFingerprint =
      'fingerprint.optional-feature-budget.stale.fnv1a64.0000000000000000';
    invalidRequests.push(staleFingerprint);

    const nonComorbidity = structuredClone(base);
    const nonComorbidityBinding =
      nonComorbidity.optionalFeatureArtifact.selectionRequest.profile.candidateBindings.find(
        (binding) => binding.moduleRef.id === 'optional-feature.test.prior-treatment',
      )!;
    nonComorbidity.bridgeProfile.mappings[0]!.moduleRef = nonComorbidityBinding.moduleRef;
    nonComorbidity.bridgeProfile.mappings[0]!.moduleFingerprint =
      nonComorbidityBinding.moduleFingerprint;
    nonComorbidity.bridgeProfile.mappings[0]!.optionalFeatureBindingId = nonComorbidityBinding.id;
    nonComorbidity.bridgeProfile.mappings[0]!.selectedModuleId =
      nonComorbidityBinding.selectedModuleId;
    invalidRequests.push(nonComorbidity);

    const duplicateTarget = structuredClone(base);
    duplicateTarget.bridgeProfile.mappings[1]!.templateConditionId =
      duplicateTarget.bridgeProfile.mappings[0]!.templateConditionId;
    invalidRequests.push(duplicateTarget);

    const requiredTarget = structuredClone(base);
    requiredTarget.bridgeProfile.mappings[0]!.templateConditionId = 'template-condition.test.focus';
    invalidRequests.push(requiredTarget);

    const nonzeroMinimum = structuredClone(base);
    nonzeroMinimum.conditionSelectionRequest.template.optionalConditionSelectionGroups[0]!.minimumSelections = 1;
    invalidRequests.push(nonzeroMinimum);

    const optionalFocus = structuredClone(base);
    optionalFocus.conditionSelectionRequest.template.optionalConditionSelectionGroups[0]!.candidates[0]!.encounterRelevance =
      'focus';
    invalidRequests.push(optionalFocus);

    for (const invalid of invalidRequests) {
      expect(bridgeOptionalComorbiditiesFromBudget(invalid)).toMatchObject({
        ok: false,
        error: { code: 'INVALID_REQUEST' },
      });
    }
  });

  it('rejects exact-template, profile-fingerprint, and upstream-integrity mismatches', () => {
    const template = makeTemplate();
    const optionalArtifact = findOptionalArtifact(
      template,
      defaultDefinitions(),
      (artifact) => selectedComorbidityIds(artifact).length === 1,
    );
    const base = makeBridgeRequest(optionalArtifact);

    const changedTemplate = structuredClone(base);
    changedTemplate.conditionSelectionRequest.template.internalLabel = 'Changed exact template';
    expect(bridgeOptionalComorbiditiesFromBudget(changedTemplate)).toMatchObject({
      ok: false,
      error: { code: 'TEMPLATE_MISMATCH' },
    });

    const staleProfile = structuredClone(base);
    staleProfile.bridgeProfile.conditionProfileFingerprint =
      'fingerprint.template-condition-selector.stale.fnv1a64.0000000000000000';
    expect(bridgeOptionalComorbiditiesFromBudget(staleProfile)).toMatchObject({
      ok: false,
      error: { code: 'PROFILE_FINGERPRINT_MISMATCH' },
    });

    const staleUpstream = structuredClone(base);
    staleUpstream.optionalFeatureArtifact.selectionRequest.seed = 'tampered-upstream-seed';
    expect(bridgeOptionalComorbiditiesFromBudget(staleUpstream)).toMatchObject({
      ok: false,
      error: { code: 'OPTIONAL_FEATURE_ARTIFACT_INVALID' },
    });
  });

  it('normalizes set-like bridge and D-196 input order', () => {
    const template = makeTemplate();
    const optionalArtifact = findOptionalArtifact(
      template,
      defaultDefinitions(),
      (artifact) => selectedComorbidityIds(artifact).length === 1,
    );
    const request = makeBridgeRequest(optionalArtifact);
    const reordered = structuredClone(request);
    reordered.bridgeProfile.mappings.reverse();
    reordered.bridgeProfile.review.sourceUseNoteIds.reverse();
    reordered.conditionSelectionRequest.template.optionalConditionSelectionGroups.reverse();
    reordered.conditionSelectionRequest.template.optionalConditionSelectionGroups.forEach((group) =>
      group.candidates.reverse(),
    );
    reordered.conditionSelectionRequest.profile.groupProfiles.reverse();
    reordered.conditionSelectionRequest.profile.groupProfiles.forEach((group) => {
      group.countWeights.reverse();
      group.candidateWeights.reverse();
    });
    expect(expectBridgeArtifact(reordered)).toEqual(expectBridgeArtifact(request));
  });

  it('detects retained-request, state, binding, audit, payload, and exact-context tampering', () => {
    const template = makeTemplate();
    const optionalArtifact = findOptionalArtifact(
      template,
      defaultDefinitions(),
      (artifact) => selectedComorbidityIds(artifact).length === 1,
    );
    const request = makeBridgeRequest(optionalArtifact);
    const artifact = expectBridgeArtifact(request);
    const mutations: Array<(value: typeof artifact) => void> = [
      (value) => {
        value.bridgeRequest.conditionSelectionRequest.seed = 'tampered-condition-seed';
      },
      (value) => {
        value.groupAudits[0]!.candidateEvaluations[0]!.configuredGameSelectionWeight += 1;
      },
      (value) => {
        value.conditionStates[0]!.clinicalStateId = 'clinical-state.tampered';
      },
      (value) => {
        const binding = value.conditionBindings[0]!;
        const otherState = value.conditionStates.find(
          (state) => state.id !== binding.conditionStateId,
        )!;
        binding.conditionStateId = otherState.id;
      },
      (value) => {
        value.payloadFingerprint =
          'fingerprint.optional-comorbidity-bridge.output.fnv1a64.0000000000000000';
      },
    ];
    for (const mutate of mutations) {
      const changed = structuredClone(artifact);
      mutate(changed);
      expect(verifyOptionalComorbidityBridgeIntegrity(changed).ok).toBe(false);
    }

    const otherArtifact = findOptionalArtifact(
      template,
      defaultDefinitions(),
      (candidate) =>
        candidate.payloadFingerprint !== optionalArtifact.payloadFingerprint &&
        selectedComorbidityIds(candidate).length === 1,
    );
    expect(
      verifyOptionalComorbidityBridgeContext({
        artifact,
        request: makeBridgeRequest(otherArtifact),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });

  it('fingerprints bridge profiles independently of set-like mapping order', () => {
    const template = makeTemplate();
    const optionalArtifact = expectOptionalArtifact(
      makeOptionalFeatureRequest(template, defaultDefinitions(), 'seed.bridge.profile'),
    );
    const request = makeBridgeRequest(optionalArtifact);
    const reversed = structuredClone(request.bridgeProfile);
    reversed.mappings.reverse();
    reversed.review.sourceUseNoteIds.reverse();
    expect(fingerprintOptionalComorbidityBridgeProfile(reversed)).toBe(
      fingerprintOptionalComorbidityBridgeProfile(request.bridgeProfile),
    );
  });

  it('feeds genuine D-202 condition provenance into D-197 without simulated D-196 draws', () => {
    const template = makeTemplate();
    const optionalArtifact = findOptionalArtifact(
      template,
      defaultDefinitions(),
      (artifact) =>
        selectedComorbidityIds(artifact).length === 1 &&
        selectedComorbidityIds(artifact).includes('optional-feature.test.comorbidity-a'),
    );
    const bridgeArtifact = expectBridgeArtifact(makeBridgeRequest(optionalArtifact));
    const conditionSource = {
      schemaVersion: 1 as const,
      sourceKind: 'optional_comorbidity_bridge' as const,
      artifact: bridgeArtifact,
    };
    expect(ResolvedConditionSourceSchema.parse(conditionSource)).toEqual(conditionSource);
    expect(verifyResolvedConditionSourceIntegrity(conditionSource)).toMatchObject({
      ok: true,
      value: {
        sourceRef: {
          sourceKind: 'optional_comorbidity_bridge',
          id: bridgeArtifact.id,
          payloadFingerprint: bridgeArtifact.payloadFingerprint,
        },
      },
    });
    expect(TemplateConditionSelectionArtifactSchema.safeParse(bridgeArtifact).success).toBe(false);

    const findingDefinitions: FindingDefinition[] = bridgeArtifact.conditionStates.map(
      (state, index) => ({
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: `finding.history.test.bridge-condition-${index}`,
        label: `Synthetic bridge condition finding ${index}`,
        aliases: [],
        semanticKind: 'history',
        valueSpecification: {
          kind: 'outcome',
          allowedValues: ['present', 'absent', 'subthreshold'],
        },
        allowedPresentationProjections: ['status'],
        lifecycle: 'approved',
        medicalReviewStatus: 'unreviewed',
      }),
    );
    const profiles: ConditionFindingCardinalityProfile[] = bridgeArtifact.conditionStates.map(
      (state, index) => ({
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: `condition-finding-profile.test.bridge-${index}`,
        modelVersion: 'condition-finding-cardinality.v1',
        conditionScope: {
          diagnosisDefinitionId: state.diagnosisDefinitionId,
          diagnosisDefinitionContentVersion: state.diagnosisDefinitionContentVersion,
          clinicalStateId: state.clinicalStateId,
          timeScopeId: state.timeScopeId,
          severity: { kind: 'any' },
          requiredSpecifierIds: [...state.specifierIds],
        },
        requiredOutcomes: [
          {
            schemaVersion: 1,
            id: `condition-finding-requirement.test.bridge-${index}`,
            findingDefinitionId: findingDefinitions[index]!.id,
            findingDefinitionContentVersion: findingDefinitions[index]!.contentVersion,
            proposedValue: { kind: 'outcome', value: 'present' },
            uncertainty: 'none',
            developerOpinionIds: [],
            review: approvedReview,
          },
        ],
        cardinalityGroups: [],
      }),
    );
    const request = {
      schemaVersion: 1 as const,
      id: 'condition-finding-cardinality-request.test.optional-comorbidity-bridge',
      conditionSource,
      profiles,
      conditionProfileBindings: bridgeArtifact.conditionStates.map((state, index) => ({
        schemaVersion: 1 as const,
        id: `condition-finding-binding.test.bridge-${index}`,
        conditionStateId: state.id,
        profileRef: {
          id: profiles[index]!.id,
          contentVersion: profiles[index]!.contentVersion,
        },
        profileFingerprint: fingerprintConditionFindingCardinalityProfile(profiles[index]!),
      })),
      findingDefinitions,
      seed: 'condition-finding-seed.from-d202',
    };
    expect(ConditionFindingCardinalityRequestSchema.parse(request)).toEqual(request);
    const result = selectConditionFindingCardinalityCandidates(request);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    const artifact = result.value;
    expect(artifact.conditionSource).toEqual(conditionSource);
    expect(artifact.conditionSourceRef).toEqual({
      sourceKind: 'optional_comorbidity_bridge',
      id: bridgeArtifact.id,
      payloadFingerprint: bridgeArtifact.payloadFingerprint,
      templateRef: bridgeArtifact.templateRef,
      templateFingerprint: bridgeArtifact.templateFingerprint,
    });
    expect(
      artifact.candidates
        .map(
          (candidate) =>
            candidate.contributions.find(
              (contribution) => contribution.ownerKind === 'condition_state',
            )!.ownerId,
        )
        .sort(),
    ).toEqual(bridgeArtifact.conditionStates.map((state) => state.id).sort());
    expect(verifyConditionFindingCardinalityIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(verifyConditionFindingCardinalityContext({ artifact, request })).toEqual({
      ok: true,
      value: artifact,
    });
    if (artifact.conditionSource.sourceKind !== 'optional_comorbidity_bridge') {
      throw new Error('Expected the D-202 source branch to remain discriminated.');
    }
    expect(artifact.conditionSource.artifact.bridgeRequest.optionalFeatureArtifact.totalSpent).toBe(
      optionalArtifact.totalSpent,
    );
    expect(
      artifact.conditionSource.artifact.bridgeRequest.optionalFeatureArtifact.remainingBudget,
    ).toBe(optionalArtifact.remainingBudget);

    const conflictResult = bridgeOptionalComorbiditiesFromBudget(
      makeBridgeRequest(
        optionalArtifact,
        makeConditionRequest(template, { addFocusComorbidityAConflict: true }),
      ),
    );
    if (conflictResult.ok || 'error' in conflictResult) {
      throw new Error(
        conflictResult.ok ? 'Expected a literal source conflict.' : conflictResult.error.message,
      );
    }
    const conflictRequest = {
      ...request,
      conditionSource: {
        schemaVersion: 1 as const,
        sourceKind: 'optional_comorbidity_bridge' as const,
        artifact: conflictResult.conflict.artifact,
      },
    };
    expect(ConditionFindingCardinalityRequestSchema.safeParse(conflictRequest).success).toBe(true);
    expect(selectConditionFindingCardinalityCandidates(conflictRequest)).toMatchObject({
      ok: false,
      error: { code: 'CONDITION_SOURCE_NOT_SELECTED' },
    });
  });
});
