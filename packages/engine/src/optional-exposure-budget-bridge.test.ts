import {
  OptionalExposureBudgetBridgeArtifactSchema,
  OptionalExposureBudgetBridgeRequestSchema,
  ResolvedExposureInventorySchema,
  type ClinicalRuleReview,
  type OptionalExposureBudgetBridgeProfile,
  type OptionalExposureBudgetBridgeRequest,
  type OptionalExposureContribution,
  type OptionalExposureReferenceHorizon,
  type OptionalFeatureBudgetSelectionArtifact,
  type OptionalFeatureBudgetSelectionRequest,
  type PatientOptionalFeatureModuleDefinition,
  type PatientTemplate,
  type TemplateOptionalFeatureIncompatibility,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  bridgeOptionalExposureFromBudget,
  fingerprintOptionalExposureBudgetBridgeProfile,
  fingerprintOptionalExposureReferenceHorizon,
  verifyOptionalExposureBudgetBridgeContext,
  verifyOptionalExposureBudgetBridgeIntegrity,
} from './optional-exposure-budget-bridge';
import {
  fingerprintOptionalFeatureModuleDefinition,
  selectOptionalFeaturesWithinBudget,
} from './optional-feature-budget-selector';
import { fingerprintTemplateConditionSelectionTemplate } from './template-condition-selector';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-30T00:30:00.000Z',
  sourceUseNoteIds: [
    'source-use.test.optional-exposure.two',
    'source-use.test.optional-exposure.one',
  ],
};

const makeTemplate = (
  maximumSelectedModules = 2,
  additionalFeatureBudget = 3,
): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-template.test.optional-exposure',
  compilationMode: 'attachment_only.v6',
  careSetting: 'outpatient_psychiatry',
  internalLabel: 'Synthetic optional exposure fixture',
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
    additionalFeatureBudget,
    maximumSelectedModules,
    selectedModules: [],
    targetEnvelope: null,
  },
  presentationRichnessEnvelope: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'presentation-richness.test.optional-exposure',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['diagnostic_attribution'],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const moduleDefinition = (
  id: string,
  moduleKind: 'substance_use' | 'prior_treatment',
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

const alcoholDefinition = () =>
  moduleDefinition('optional-feature.test.exposure.alcohol', 'substance_use');
const mixedExposureDefinition = () =>
  moduleDefinition('optional-feature.test.exposure.mixed', 'substance_use');
const nonExposureDefinition = () =>
  moduleDefinition('optional-feature.test.prior-treatment', 'prior_treatment');

const defaultDefinitions = (): PatientOptionalFeatureModuleDefinition[] => [
  alcoholDefinition(),
  mixedExposureDefinition(),
  nonExposureDefinition(),
];

interface OptionalRequestOptions {
  readonly seed?: string;
  readonly maximumSelectedModules?: number;
  readonly additionalFeatureBudget?: number;
  readonly definitions?: PatientOptionalFeatureModuleDefinition[];
  readonly incompatibilities?: TemplateOptionalFeatureIncompatibility[];
  readonly countWeights?: readonly number[];
}

const makeOptionalFeatureRequest = (
  options: OptionalRequestOptions = {},
): OptionalFeatureBudgetSelectionRequest => {
  const definitions = options.definitions ?? defaultDefinitions();
  const template = makeTemplate(
    options.maximumSelectedModules ?? 2,
    options.additionalFeatureBudget ?? 3,
  );
  return {
    schemaVersion: 1,
    id: 'optional-feature-budget-request.test.optional-exposure',
    template,
    moduleDefinitions: definitions,
    profile: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'optional-feature-profile.test.optional-exposure',
      modelVersion: 'weighted-optional-feature-budget-selection.v1',
      templateRef: {
        id: template.id,
        contentVersion: template.contentVersion,
      },
      templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
      countWeights: Array.from(
        { length: template.complexityProfile.maximumSelectedModules + 1 },
        (_, selectionCount) => ({
          schemaVersion: 1 as const,
          selectionCount,
          gameSelectionWeight: options.countWeights?.[selectionCount] ?? selectionCount + 1,
        }),
      ),
      candidateBindings: definitions.map((definition, index) => ({
        schemaVersion: 1,
        id: `optional-feature-binding.test.exposure.${index}`,
        moduleRef: {
          id: definition.id,
          contentVersion: definition.contentVersion,
        },
        moduleFingerprint: fingerprintOptionalFeatureModuleDefinition(definition),
        selectedModuleId: `patient-optional-feature.test.exposure.${index}`,
        cost: definition.id === mixedExposureDefinition().id ? 2 : 1,
        impact: definition.moduleKind === 'substance_use' ? 'fit_modifier' : 'background',
        complexityContributions: [
          {
            id: `complexity-contribution.test.exposure.${index}`,
            label: `Synthetic exposure contribution ${index}`,
            dimension: definition.moduleKind === 'substance_use' ? 'diagnostic' : 'information',
            weight: 1,
            review: approvedReview,
          },
        ],
        gameSelectionWeight: [7, 5, 3][index] ?? 1,
        review: approvedReview,
      })),
      incompatibilities: options.incompatibilities ?? [],
      review: approvedReview,
    },
    seed: options.seed ?? 'seed.optional-exposure',
  };
};

const expectOptionalArtifact = (
  request: OptionalFeatureBudgetSelectionRequest,
): OptionalFeatureBudgetSelectionArtifact => {
  const result = selectOptionalFeaturesWithinBudget(request);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const selectedDefinitionIds = (artifact: OptionalFeatureBudgetSelectionArtifact): string[] =>
  artifact.candidateEvaluations
    .filter((evaluation) => evaluation.disposition === 'selected')
    .map((evaluation) => evaluation.moduleRef.id)
    .sort();

const findOptionalArtifact = (
  options: OptionalRequestOptions,
  predicate: (artifact: OptionalFeatureBudgetSelectionArtifact) => boolean,
): OptionalFeatureBudgetSelectionArtifact => {
  for (let index = 0; index < 4_000; index += 1) {
    const request = makeOptionalFeatureRequest({
      ...options,
      seed: `seed.optional-exposure.${index}`,
    });
    const result = selectOptionalFeaturesWithinBudget(request);
    if (result.ok && predicate(result.value)) return result.value;
  }
  throw new Error('Could not find a deterministic optional-exposure fixture seed.');
};

const alcoholContribution = (): OptionalExposureContribution => ({
  useEntrySpecifications: [
    {
      schemaVersion: 1,
      id: 'exposure-use-entry.test.alcohol',
      agent: {
        kind: 'other_substance',
        identityId: 'other-substance.test.alcohol',
        identityContentVersion: '1.0.0',
      },
      mostRecentUse: { kind: 'current' },
      currentAmount: {
        quantity: 6,
        unitLabel: 'standard drinks',
        frequencyLabel: 'daily',
      },
      prescriptionRelationship: 'not_applicable',
      misuseTruth: true,
    },
  ],
});

const mixedExposureContribution = (): OptionalExposureContribution => ({
  useEntrySpecifications: [
    {
      schemaVersion: 1,
      id: 'exposure-use-entry.test.magnesium',
      agent: {
        kind: 'supplement',
        identityId: 'supplement.test.magnesium',
        identityContentVersion: '1.0.0',
      },
      mostRecentUse: {
        kind: 'elapsed',
        value: 2,
        unit: 'week',
      },
      currentAmount: null,
      prescriptionRelationship: 'not_applicable',
      misuseTruth: false,
    },
    {
      schemaVersion: 1,
      id: 'exposure-use-entry.test.gabapentin',
      agent: {
        kind: 'medication',
        identityId: 'medication.test.gabapentin',
        identityContentVersion: '1.0.0',
      },
      mostRecentUse: { kind: 'current' },
      currentAmount: {
        quantity: 900,
        unitLabel: 'mg',
        frequencyLabel: 'daily',
      },
      prescriptionRelationship: 'prescribed_to_patient',
      misuseTruth: false,
    },
    {
      schemaVersion: 1,
      id: 'exposure-use-entry.test.methylphenidate',
      agent: {
        kind: 'medication',
        identityId: 'medication.test.methylphenidate',
        identityContentVersion: '1.0.0',
      },
      mostRecentUse: {
        kind: 'elapsed',
        value: 3,
        unit: 'day',
      },
      currentAmount: null,
      prescriptionRelationship: 'not_prescribed_to_patient',
      misuseTruth: true,
    },
  ],
});

const defaultContributions = (): Readonly<Record<string, OptionalExposureContribution>> => ({
  [alcoholDefinition().id]: alcoholContribution(),
  [mixedExposureDefinition().id]: mixedExposureContribution(),
});

const mappedContributions = (
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
  contributions: Readonly<Record<string, OptionalExposureContribution>>,
): Readonly<Record<string, OptionalExposureContribution>> =>
  Object.fromEntries(
    optionalArtifact.selectionRequest.moduleDefinitions
      .filter((definition) => definition.moduleKind === 'substance_use')
      .map((definition) => {
        const contribution = contributions[definition.id];
        if (!contribution) {
          throw new Error(`Missing synthetic exposure contribution for ${definition.id}.`);
        }
        return [definition.id, contribution];
      }),
  );

const agentKey = (agent: {
  readonly kind: string;
  readonly identityId: string;
  readonly identityContentVersion: string;
}) => `${agent.kind}\u0000${agent.identityId}\u0000${agent.identityContentVersion}`;

const makeReferenceHorizon = (
  contributions: Readonly<Record<string, OptionalExposureContribution>>,
): OptionalExposureReferenceHorizon => {
  const agentRefs = new Map<
    string,
    OptionalExposureContribution['useEntrySpecifications'][number]['agent']
  >();
  Object.values(contributions).forEach((contribution) =>
    contribution.useEntrySpecifications.forEach((entry) =>
      agentRefs.set(agentKey(entry.agent), entry.agent),
    ),
  );
  return {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'exposure-reference-horizon.test.synthetic',
    agentRefs: [...agentRefs.values()].sort((left, right) =>
      agentKey(left).localeCompare(agentKey(right)),
    ),
  };
};

const makeBridgeProfile = (
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
  referenceHorizon: OptionalExposureReferenceHorizon,
  contributions: Readonly<Record<string, OptionalExposureContribution>>,
): OptionalExposureBudgetBridgeProfile => {
  const optionalRequest = optionalArtifact.selectionRequest;
  return {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-exposure-budget-bridge-profile.test.synthetic',
    modelVersion: 'optional-exposure-budget-bridge.v1',
    templateRef: optionalArtifact.templateRef,
    templateFingerprint: optionalArtifact.templateFingerprint,
    optionalFeatureProfileRef: optionalArtifact.profileRef,
    optionalFeatureProfileFingerprint: optionalArtifact.profileFingerprint,
    referenceHorizonRef: {
      id: referenceHorizon.id,
      contentVersion: referenceHorizon.contentVersion,
    },
    referenceHorizonFingerprint: fingerprintOptionalExposureReferenceHorizon(referenceHorizon),
    mappings: optionalRequest.moduleDefinitions
      .filter((definition) => definition.moduleKind === 'substance_use')
      .map((definition) => {
        const binding = optionalRequest.profile.candidateBindings.find(
          (candidate) => candidate.moduleRef.id === definition.id,
        )!;
        return {
          schemaVersion: 1,
          id: `optional-exposure-mapping.test.${definition.id}`,
          moduleRef: binding.moduleRef,
          moduleFingerprint: binding.moduleFingerprint,
          optionalFeatureBindingId: binding.id,
          selectedModuleId: binding.selectedModuleId,
          contribution: structuredClone(contributions[definition.id]!),
          review: approvedReview,
        };
      }),
    review: approvedReview,
  };
};

const makeBridgeRequest = (
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
  contributions: Readonly<Record<string, OptionalExposureContribution>> = defaultContributions(),
): OptionalExposureBudgetBridgeRequest => {
  const relevantContributions = mappedContributions(optionalArtifact, contributions);
  const referenceHorizon = makeReferenceHorizon(relevantContributions);
  return {
    schemaVersion: 1,
    id: 'optional-exposure-budget-bridge-request.test.synthetic',
    optionalFeatureArtifact: optionalArtifact,
    referenceHorizon,
    bridgeProfile: makeBridgeProfile(optionalArtifact, referenceHorizon, relevantContributions),
  };
};

const expectBridgeArtifact = (request: unknown) => {
  const result = bridgeOptionalExposureFromBudget(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('optional exposure budget bridge', () => {
  it('returns null for zero selected modules without asserting nonuse', () => {
    const optionalArtifact = expectOptionalArtifact(
      makeOptionalFeatureRequest({
        maximumSelectedModules: 0,
        countWeights: [1],
      }),
    );
    const request = makeBridgeRequest(optionalArtifact);
    expect(OptionalExposureBudgetBridgeRequestSchema.parse(request)).toEqual(request);
    const before = JSON.stringify(request);
    const artifact = expectBridgeArtifact(request);
    expect(JSON.stringify(request)).toBe(before);
    expect(OptionalExposureBudgetBridgeArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.selectedExposureModuleDefinitionIds).toEqual([]);
    expect(artifact.materializedExposureContribution).toBeNull();
    expect(artifact.materializedUseEntryIds).toEqual([]);
    expect(verifyOptionalExposureBudgetBridgeIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(verifyOptionalExposureBudgetBridgeContext({ artifact, request })).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('ignores a selected non-substance module while preserving D-201 spending', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 1 },
      (artifact) =>
        selectedDefinitionIds(artifact).length === 1 &&
        selectedDefinitionIds(artifact)[0] === nonExposureDefinition().id,
    );
    const artifact = expectBridgeArtifact(makeBridgeRequest(optionalArtifact));
    expect(artifact.materializedExposureContribution).toBeNull();
    expect(artifact.selectedExposureModuleDefinitionIds).toEqual([]);
    expect(artifact.bridgeRequest.optionalFeatureArtifact).toEqual(optionalArtifact);
    expect(artifact.optionalFeatureArtifactRef).toEqual({
      id: optionalArtifact.id,
      inputFingerprint: optionalArtifact.inputFingerprint,
      payloadFingerprint: optionalArtifact.payloadFingerprint,
    });
    expect(artifact.bridgeRequest.optionalFeatureArtifact.totalSpent).toBe(
      optionalArtifact.totalSpent,
    );
    expect(artifact.bridgeRequest.optionalFeatureArtifact.remainingBudget).toBe(
      optionalArtifact.remainingBudget,
    );
  });

  it('additively materializes all agent kinds and exact exposure truth from two modules', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2, additionalFeatureBudget: 3 },
      (artifact) => {
        const selected = selectedDefinitionIds(artifact);
        return (
          selected.length === 2 &&
          selected.includes(alcoholDefinition().id) &&
          selected.includes(mixedExposureDefinition().id)
        );
      },
    );
    const request = makeBridgeRequest(optionalArtifact);
    const artifact = expectBridgeArtifact(request);
    const entries = artifact.materializedExposureContribution!.useEntries;

    expect(entries).toHaveLength(4);
    expect(new Set(entries.map((entry) => entry.agent.kind))).toEqual(
      new Set(['medication', 'supplement', 'other_substance']),
    );
    expect(
      entries.find((entry) => entry.agent.identityId === 'other-substance.test.alcohol'),
    ).toMatchObject({
      mostRecentUse: { kind: 'current' },
      currentAmount: {
        quantity: 6,
        unitLabel: 'standard drinks',
        frequencyLabel: 'daily',
      },
      prescriptionRelationship: 'not_applicable',
      misuseTruth: true,
    });
    expect(
      entries.find((entry) => entry.agent.identityId === 'supplement.test.magnesium'),
    ).toMatchObject({
      mostRecentUse: { kind: 'elapsed', value: 2, unit: 'week' },
      currentAmount: null,
      prescriptionRelationship: 'not_applicable',
      misuseTruth: false,
    });
    expect(
      entries.find((entry) => entry.agent.identityId === 'medication.test.gabapentin'),
    ).toMatchObject({
      mostRecentUse: { kind: 'current' },
      prescriptionRelationship: 'prescribed_to_patient',
      misuseTruth: false,
    });
    expect(
      entries.find((entry) => entry.agent.identityId === 'medication.test.methylphenidate'),
    ).toMatchObject({
      mostRecentUse: { kind: 'elapsed', value: 3, unit: 'day' },
      currentAmount: null,
      prescriptionRelationship: 'not_prescribed_to_patient',
      misuseTruth: true,
    });

    const selectedEvaluations = artifact.candidateEvaluations.filter(
      (evaluation) => evaluation.disposition === 'selected_by_optional_feature',
    );
    expect(selectedEvaluations).toHaveLength(2);
    selectedEvaluations.forEach((evaluation) => {
      const upstream = optionalArtifact.candidateEvaluations.find(
        (candidate) => candidate.moduleRef.id === evaluation.moduleRef.id,
      )!;
      expect(evaluation.optionalFeatureSelectionOrdinal).toBe(upstream.selectionOrdinal);
      expect(evaluation.optionalFeatureStableDrawId).toBe(upstream.stableDrawId);
      expect(evaluation.optionalFeatureBindingId).toBe(upstream.bindingId);
      expect(evaluation.selectedModuleId).toBe(upstream.moduleSnapshot.id);
      evaluation.useEntryIds.forEach((useEntryId) => {
        const entry = entries.find((candidate) => candidate.id === useEntryId)!;
        expect(entry.resolution).toEqual({
          origin: 'deterministic_generation',
          generationProfileId: artifact.bridgeProfileRef.id,
          generationProfileContentVersion: artifact.bridgeProfileRef.contentVersion,
          resolverVersion: artifact.resolverVersion,
          stableDrawId: upstream.stableDrawId,
        });
      });
    });
    expect(optionalArtifact.totalSpent).toBe(3);
    expect(optionalArtifact.remainingBudget).toBe(0);
    expect(artifact.bridgeRequest.optionalFeatureArtifact.totalSpent).toBe(3);
    expect(artifact.bridgeRequest.optionalFeatureArtifact.remainingBudget).toBe(0);
    expect(artifact.bridgeRequest.optionalFeatureArtifact.resultingComplexityProfile).toEqual(
      optionalArtifact.resultingComplexityProfile,
    );
  });

  it('keeps one semantic exposure-agent summary across content-version changes', () => {
    const optionalArtifact = findOptionalArtifact({ maximumSelectedModules: 1 }, (artifact) =>
      selectedDefinitionIds(artifact).includes(alcoholDefinition().id),
    );
    const entry = expectBridgeArtifact(makeBridgeRequest(optionalArtifact))
      .materializedExposureContribution!.useEntries[0]!;
    const crossedVersionDuplicate = structuredClone(entry);
    crossedVersionDuplicate.id = 'exposure-use.test.crossed-version-duplicate';
    crossedVersionDuplicate.agent.identityContentVersion = '2.0.0';

    expect(
      ResolvedExposureInventorySchema.safeParse({
        schemaVersion: 1,
        id: 'resolved-exposure-inventory.test.crossed-version-duplicate',
        useEntries: [entry, crossedVersionDuplicate],
      }).success,
    ).toBe(false);
  });

  it('requires explicit D-201 incompatibility for same-agent alternatives', () => {
    const recentDefinition = moduleDefinition(
      'optional-feature.test.exposure.cannabis-current',
      'substance_use',
    );
    const pastDefinition = moduleDefinition(
      'optional-feature.test.exposure.cannabis-past',
      'substance_use',
    );
    const definitions = [recentDefinition, pastDefinition];
    const currentContribution: OptionalExposureContribution = {
      useEntrySpecifications: [
        {
          schemaVersion: 1,
          id: 'exposure-use-entry.test.cannabis-current',
          agent: {
            kind: 'other_substance',
            identityId: 'other-substance.test.cannabis',
            identityContentVersion: '1.0.0',
          },
          mostRecentUse: { kind: 'current' },
          currentAmount: {
            quantity: 1,
            unitLabel: 'use episode',
            frequencyLabel: 'daily',
          },
          prescriptionRelationship: 'not_applicable',
          misuseTruth: false,
        },
      ],
    };
    const pastContribution: OptionalExposureContribution = {
      useEntrySpecifications: [
        {
          schemaVersion: 1,
          id: 'exposure-use-entry.test.cannabis-past',
          agent: {
            kind: 'other_substance',
            identityId: 'other-substance.test.cannabis',
            identityContentVersion: '1.0.0',
          },
          mostRecentUse: { kind: 'elapsed', value: 2, unit: 'month' },
          currentAmount: null,
          prescriptionRelationship: 'not_applicable',
          misuseTruth: false,
        },
      ],
    };
    const contributions = {
      [recentDefinition.id]: currentContribution,
      [pastDefinition.id]: pastContribution,
    };

    const coSelectableArtifact = findOptionalArtifact(
      { definitions, maximumSelectedModules: 1 },
      () => true,
    );
    expect(
      bridgeOptionalExposureFromBudget(makeBridgeRequest(coSelectableArtifact, contributions)).ok,
    ).toBe(false);

    const incompatibility: TemplateOptionalFeatureIncompatibility = {
      schemaVersion: 1,
      id: 'optional-feature-incompatibility.test.cannabis-alternatives',
      leftModuleId: recentDefinition.id,
      rightModuleId: pastDefinition.id,
      reason: 'Current and past cannabis summaries are mutually exclusive alternatives.',
      review: approvedReview,
    };
    const incompatibleArtifact = findOptionalArtifact(
      {
        definitions,
        maximumSelectedModules: 1,
        incompatibilities: [incompatibility],
      },
      () => true,
    );
    expect(
      bridgeOptionalExposureFromBudget(makeBridgeRequest(incompatibleArtifact, contributions)).ok,
    ).toBe(true);

    const mixedVersionContributions = structuredClone(contributions);
    mixedVersionContributions[
      pastDefinition.id
    ]!.useEntrySpecifications[0]!.agent.identityContentVersion = '2.0.0';
    expect(
      bridgeOptionalExposureFromBudget(
        makeBridgeRequest(incompatibleArtifact, mixedVersionContributions),
      ).ok,
    ).toBe(false);
  });

  it('rejects malformed positive entries and duplicate entry or agent identities', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2 },
      (artifact) => artifact.selectedCount > 0,
    );
    const base = makeBridgeRequest(optionalArtifact);

    const empty = structuredClone(base);
    empty.bridgeProfile.mappings[0]!.contribution.useEntrySpecifications = [];
    expect(bridgeOptionalExposureFromBudget(empty).ok).toBe(false);

    const currentWithoutAmount = structuredClone(base);
    const currentEntry = currentWithoutAmount.bridgeProfile.mappings
      .flatMap((mapping) => mapping.contribution.useEntrySpecifications)
      .find((entry) => entry.mostRecentUse.kind === 'current')!;
    currentEntry.currentAmount = null;
    expect(bridgeOptionalExposureFromBudget(currentWithoutAmount).ok).toBe(false);

    const elapsedWithAmount = structuredClone(base);
    const elapsedEntry = elapsedWithAmount.bridgeProfile.mappings
      .flatMap((mapping) => mapping.contribution.useEntrySpecifications)
      .find((entry) => entry.mostRecentUse.kind === 'elapsed')!;
    elapsedEntry.currentAmount = {
      quantity: 1,
      unitLabel: 'unit',
      frequencyLabel: 'daily',
    };
    expect(bridgeOptionalExposureFromBudget(elapsedWithAmount).ok).toBe(false);

    const nonMedicationPrescription = structuredClone(base);
    const nonMedicationEntry = nonMedicationPrescription.bridgeProfile.mappings
      .flatMap((mapping) => mapping.contribution.useEntrySpecifications)
      .find((entry) => entry.agent.kind !== 'medication')!;
    nonMedicationEntry.prescriptionRelationship = 'prescribed_to_patient';
    expect(bridgeOptionalExposureFromBudget(nonMedicationPrescription).ok).toBe(false);

    const duplicateId = structuredClone(base);
    const allDuplicateEntries = duplicateId.bridgeProfile.mappings.flatMap(
      (mapping) => mapping.contribution.useEntrySpecifications,
    );
    allDuplicateEntries[1]!.id = allDuplicateEntries[0]!.id;
    expect(bridgeOptionalExposureFromBudget(duplicateId).ok).toBe(false);

    const duplicateAgent = structuredClone(base);
    const bundle = duplicateAgent.bridgeProfile.mappings.find(
      (mapping) => mapping.moduleRef.id === mixedExposureDefinition().id,
    )!.contribution.useEntrySpecifications;
    bundle[1]!.agent = structuredClone(bundle[0]!.agent);
    expect(bridgeOptionalExposureFromBudget(duplicateAgent).ok).toBe(false);
  });

  it('rejects incomplete, non-substance, stale, and crossed mappings', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2 },
      (artifact) => artifact.selectedCount > 0,
    );
    const base = makeBridgeRequest(optionalArtifact);
    const invalidRequests: OptionalExposureBudgetBridgeRequest[] = [];

    const missing = structuredClone(base);
    missing.bridgeProfile.mappings.pop();
    invalidRequests.push(missing);

    const nonSubstance = structuredClone(base);
    const nonSubstanceBinding =
      nonSubstance.optionalFeatureArtifact.selectionRequest.profile.candidateBindings.find(
        (binding) => binding.moduleRef.id === nonExposureDefinition().id,
      )!;
    nonSubstance.bridgeProfile.mappings[0]!.moduleRef = nonSubstanceBinding.moduleRef;
    nonSubstance.bridgeProfile.mappings[0]!.moduleFingerprint =
      nonSubstanceBinding.moduleFingerprint;
    nonSubstance.bridgeProfile.mappings[0]!.optionalFeatureBindingId = nonSubstanceBinding.id;
    nonSubstance.bridgeProfile.mappings[0]!.selectedModuleId = nonSubstanceBinding.selectedModuleId;
    invalidRequests.push(nonSubstance);

    const staleFingerprint = structuredClone(base);
    staleFingerprint.bridgeProfile.mappings[0]!.moduleFingerprint =
      'fingerprint.optional-feature-budget.stale.fnv1a64.0000000000000000';
    invalidRequests.push(staleFingerprint);

    const staleBinding = structuredClone(base);
    staleBinding.bridgeProfile.mappings[0]!.optionalFeatureBindingId =
      'optional-feature-binding.test.stale';
    invalidRequests.push(staleBinding);

    const staleSelectedRecord = structuredClone(base);
    staleSelectedRecord.bridgeProfile.mappings[0]!.selectedModuleId =
      'patient-optional-feature.test.stale';
    invalidRequests.push(staleSelectedRecord);

    const crossedTemplate = structuredClone(base);
    crossedTemplate.bridgeProfile.templateRef.id = 'patient-template.test.other';
    invalidRequests.push(crossedTemplate);

    const crossedProfile = structuredClone(base);
    crossedProfile.bridgeProfile.optionalFeatureProfileRef.id =
      'optional-feature-profile.test.other';
    invalidRequests.push(crossedProfile);

    for (const invalid of invalidRequests) {
      expect(bridgeOptionalExposureFromBudget(invalid).ok).toBe(false);
    }
  });

  it('requires an exact typed agent reference horizon', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2 },
      (artifact) => artifact.selectedCount > 0,
    );
    const base = makeBridgeRequest(optionalArtifact);

    const missing = structuredClone(base);
    missing.referenceHorizon.agentRefs.pop();
    expect(bridgeOptionalExposureFromBudget(missing).ok).toBe(false);

    const unused = structuredClone(base);
    unused.referenceHorizon.agentRefs.push({
      kind: 'other_substance',
      identityId: 'other-substance.test.unused',
      identityContentVersion: '1.0.0',
    });
    expect(bridgeOptionalExposureFromBudget(unused).ok).toBe(false);

    const duplicate = structuredClone(base);
    duplicate.referenceHorizon.agentRefs.push(
      structuredClone(duplicate.referenceHorizon.agentRefs[0]!),
    );
    expect(bridgeOptionalExposureFromBudget(duplicate).ok).toBe(false);

    const staleVersion = structuredClone(base);
    staleVersion.referenceHorizon.agentRefs[0]!.identityContentVersion = '2.0.0';
    expect(bridgeOptionalExposureFromBudget(staleVersion).ok).toBe(false);

    const wrongKind = structuredClone(base);
    wrongKind.referenceHorizon.agentRefs[0]!.kind =
      wrongKind.referenceHorizon.agentRefs[0]!.kind === 'medication' ? 'supplement' : 'medication';
    expect(bridgeOptionalExposureFromBudget(wrongKind).ok).toBe(false);
  });

  it('normalizes set-like input, preserves immutability, and replays deterministically', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2, additionalFeatureBudget: 3 },
      (artifact) => {
        const selected = selectedDefinitionIds(artifact);
        return (
          selected.includes(alcoholDefinition().id) &&
          selected.includes(mixedExposureDefinition().id)
        );
      },
    );
    const request = makeBridgeRequest(optionalArtifact);
    const before = JSON.stringify(request);
    const reordered = structuredClone(request);
    reordered.referenceHorizon.agentRefs.reverse();
    reordered.bridgeProfile.mappings.reverse();
    reordered.bridgeProfile.review.sourceUseNoteIds.reverse();
    reordered.bridgeProfile.mappings.forEach((mapping) => {
      mapping.review.sourceUseNoteIds.reverse();
      mapping.contribution.useEntrySpecifications.reverse();
    });
    reordered.bridgeProfile.referenceHorizonFingerprint =
      fingerprintOptionalExposureReferenceHorizon(reordered.referenceHorizon);

    expect(fingerprintOptionalExposureReferenceHorizon(reordered.referenceHorizon)).toBe(
      fingerprintOptionalExposureReferenceHorizon(request.referenceHorizon),
    );
    expect(fingerprintOptionalExposureBudgetBridgeProfile(reordered.bridgeProfile)).toBe(
      fingerprintOptionalExposureBudgetBridgeProfile(request.bridgeProfile),
    );
    expect(expectBridgeArtifact(reordered)).toEqual(expectBridgeArtifact(request));
    expect(expectBridgeArtifact(structuredClone(request))).toEqual(expectBridgeArtifact(request));
    expect(JSON.stringify(request)).toBe(before);
  });

  it('detects nested D-201, materialized truth, resolution, trace, and context tampering', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2, additionalFeatureBudget: 3 },
      (candidate) => selectedDefinitionIds(candidate).includes(mixedExposureDefinition().id),
    );
    const request = makeBridgeRequest(optionalArtifact);
    const artifact = expectBridgeArtifact(request);
    const mutations: Array<(value: typeof artifact) => void> = [
      (value) => {
        value.bridgeRequest.optionalFeatureArtifact.selectionRequest.seed =
          'seed.optional-exposure.tampered';
      },
      (value) => {
        value.materializedExposureContribution!.useEntries[0]!.misuseTruth =
          !value.materializedExposureContribution!.useEntries[0]!.misuseTruth;
      },
      (value) => {
        const resolution = value.materializedExposureContribution!.useEntries[0]!.resolution;
        if (resolution.origin !== 'deterministic_generation') {
          throw new Error('Expected deterministic exposure resolution.');
        }
        resolution.stableDrawId = 'optional-feature-draw.test.tampered-resolution';
      },
      (value) => {
        value.candidateEvaluations.find(
          (candidate) => candidate.disposition === 'selected_by_optional_feature',
        )!.optionalFeatureStableDrawId = 'optional-feature-draw.test.tampered';
      },
      (value) => {
        value.materializedUseEntryIds[0] = 'exposure-use-entry.test.tampered';
      },
      (value) => {
        value.payloadFingerprint =
          'fingerprint.optional-exposure-budget-bridge.output.fnv1a64.0000000000000000';
      },
    ];
    for (const mutate of mutations) {
      const changed = structuredClone(artifact);
      mutate(changed);
      expect(verifyOptionalExposureBudgetBridgeIntegrity(changed).ok).toBe(false);
    }

    const otherOptionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2, additionalFeatureBudget: 3 },
      (candidate) =>
        candidate.payloadFingerprint !== optionalArtifact.payloadFingerprint &&
        selectedDefinitionIds(candidate).includes(mixedExposureDefinition().id),
    );
    expect(
      verifyOptionalExposureBudgetBridgeContext({
        artifact,
        request: makeBridgeRequest(otherOptionalArtifact),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });
});
