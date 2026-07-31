import {
  OptionalPriorTreatmentBridgeArtifactSchema,
  OptionalPriorTreatmentBridgeRequestSchema,
  type ClinicalRuleReview,
  type OptionalFeatureBudgetSelectionArtifact,
  type OptionalFeatureBudgetSelectionRequest,
  type OptionalPriorTreatmentBridgeProfile,
  type OptionalPriorTreatmentBridgeRequest,
  type OptionalPriorTreatmentContribution,
  type OptionalPriorTreatmentReferenceHorizon,
  type PatientOptionalFeatureModuleDefinition,
  type PatientTemplate,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  bridgeOptionalPriorTreatmentHistoryFromBudget,
  fingerprintOptionalPriorTreatmentBridgeProfile,
  fingerprintOptionalPriorTreatmentReferenceHorizon,
  verifyOptionalPriorTreatmentBridgeContext,
  verifyOptionalPriorTreatmentBridgeIntegrity,
} from './optional-prior-treatment-bridge';
import {
  fingerprintOptionalFeatureModuleDefinition,
  selectOptionalFeaturesWithinBudget,
} from './optional-feature-budget-selector';
import { fingerprintTemplateConditionSelectionTemplate } from './template-condition-selector';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-29T23:30:00.000Z',
  sourceUseNoteIds: [
    'source-use.test.optional-prior-treatment.two',
    'source-use.test.optional-prior-treatment.one',
  ],
};

const makeTemplate = (
  maximumSelectedModules = 2,
  additionalFeatureBudget = 3,
): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-template.test.optional-prior-treatment',
  compilationMode: 'attachment_only.v6',
  careSetting: 'outpatient_psychiatry',
  internalLabel: 'Synthetic optional prior-treatment fixture',
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
    id: 'presentation-richness.test.optional-prior-treatment',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['prior_response_or_intolerance'],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const moduleDefinition = (
  id: string,
  moduleKind: 'prior_treatment' | 'allergy_reaction',
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

const longTrialsDefinition = () =>
  moduleDefinition('optional-feature.test.prior-treatment.long-trials', 'prior_treatment');
const careHistoryDefinition = () =>
  moduleDefinition('optional-feature.test.prior-treatment.care-history', 'prior_treatment');
const nonPriorDefinition = () =>
  moduleDefinition('optional-feature.test.reaction-background', 'allergy_reaction');

const defaultDefinitions = (): PatientOptionalFeatureModuleDefinition[] => [
  longTrialsDefinition(),
  careHistoryDefinition(),
  nonPriorDefinition(),
];

interface OptionalRequestOptions {
  readonly seed?: string;
  readonly maximumSelectedModules?: number;
  readonly additionalFeatureBudget?: number;
  readonly definitions?: PatientOptionalFeatureModuleDefinition[];
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
    id: 'optional-feature-budget-request.test.optional-prior-treatment',
    template,
    moduleDefinitions: definitions,
    profile: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'optional-feature-profile.test.optional-prior-treatment',
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
        id: `optional-feature-binding.test.prior-treatment.${index}`,
        moduleRef: {
          id: definition.id,
          contentVersion: definition.contentVersion,
        },
        moduleFingerprint: fingerprintOptionalFeatureModuleDefinition(definition),
        selectedModuleId: `patient-optional-feature.test.prior-treatment.${index}`,
        cost: definition.id === longTrialsDefinition().id ? 2 : 1,
        impact: definition.moduleKind === 'prior_treatment' ? 'fit_modifier' : 'background',
        complexityContributions: [
          {
            id: `complexity-contribution.test.prior-treatment.${index}`,
            label: `Synthetic prior-treatment contribution ${index}`,
            dimension:
              definition.moduleKind === 'prior_treatment' ? 'pharmacologic' : 'information',
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
    seed: options.seed ?? 'seed.optional-prior-treatment',
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
      seed: `seed.optional-prior-treatment.${index}`,
    });
    const result = selectOptionalFeaturesWithinBudget(request);
    if (result.ok && predicate(result.value)) return result.value;
  }
  throw new Error('Could not find a deterministic optional prior-treatment fixture seed.');
};

const makeMedicationTrials = (count = 15) =>
  Array.from({ length: count }, (_, index) => ({
    schemaVersion: 1 as const,
    id: `medication-trial.test.long-history.${String(index + 1).padStart(2, '0')}`,
    medicationId: [
      'medication.test.sertraline',
      'medication.test.sertraline',
      'medication.test.bupropion',
      'medication.test.mirtazapine',
    ][index % 4]!,
    exposure: {
      duration: {
        value: 6 + index,
        unit: 'week' as const,
      },
      maximumDose: {
        amount: 10 + index,
        unit: 'mg',
        frequency: 'daily',
      },
    },
    adequacy: index % 3 === 0 ? ('adequate' as const) : ('unclear' as const),
    adherence: index % 4 === 0 ? ('inconsistent' as const) : ('consistent' as const),
    response: index % 5 === 0 ? ('partial' as const) : ('none' as const),
    tolerability: index % 6 === 0 ? ('limited' as const) : ('tolerated' as const),
    source: index % 2 === 0 ? ('patient_report' as const) : ('outside_record' as const),
    summary: `Synthetic prior medication trial ${index + 1}.`,
  }));

const longTrialsContribution = (): OptionalPriorTreatmentContribution => ({
  medicationTrials: makeMedicationTrials(),
  psychotherapyTrials: [],
  currentProviders: [],
  priorLevelsOfCare: [],
});

const careHistoryContribution = (): OptionalPriorTreatmentContribution => ({
  medicationTrials: [],
  psychotherapyTrials: [
    {
      schemaVersion: 1,
      id: 'psychotherapy-trial.test.cbt',
      interventionId: 'treatment.test.cognitive-behavioral-therapy',
      status: 'completed',
      engagement: 'adequate',
      response: 'partial',
      source: 'patient_report',
      summary: 'Completed a prior course of cognitive behavioral therapy.',
    },
  ],
  currentProviders: [
    {
      schemaVersion: 1,
      id: 'treatment-provider.test.current-therapist',
      providerType: 'therapist',
      active: true,
      source: 'prescriber_record',
      summary: 'Currently established with an outpatient therapist.',
    },
  ],
  priorLevelsOfCare: [
    {
      schemaVersion: 1,
      id: 'prior-level-of-care.test.inpatient',
      level: 'inpatient_psychiatry',
      occurrenceCount: 2,
      source: 'outside_record',
      summary: 'Two prior psychiatric hospitalizations are documented.',
    },
  ],
});

const defaultContributions = (): Readonly<Record<string, OptionalPriorTreatmentContribution>> => ({
  [longTrialsDefinition().id]: longTrialsContribution(),
  [careHistoryDefinition().id]: careHistoryContribution(),
});

const makeReferenceHorizon = (
  contributions: Readonly<Record<string, OptionalPriorTreatmentContribution>>,
): OptionalPriorTreatmentReferenceHorizon => {
  const medicationIds = new Set<string>();
  const interventionIds = new Set<string>();
  Object.values(contributions).forEach((contribution) => {
    contribution.medicationTrials.forEach((trial) => medicationIds.add(trial.medicationId));
    contribution.psychotherapyTrials.forEach((trial) => interventionIds.add(trial.interventionId));
  });
  const refs = (ids: Set<string>) =>
    [...ids].sort().map((id) => ({
      id,
      contentVersion: '1.0.0',
    }));
  return {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'prior-treatment-reference-horizon.test.synthetic',
    medicationRefs: refs(medicationIds),
    psychotherapyInterventionRefs: refs(interventionIds),
  };
};

const mappedContributions = (
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
  contributions: Readonly<Record<string, OptionalPriorTreatmentContribution>>,
): Readonly<Record<string, OptionalPriorTreatmentContribution>> =>
  Object.fromEntries(
    optionalArtifact.selectionRequest.moduleDefinitions
      .filter((definition) => definition.moduleKind === 'prior_treatment')
      .map((definition) => {
        const contribution = contributions[definition.id];
        if (!contribution) {
          throw new Error(`Missing synthetic contribution for ${definition.id}.`);
        }
        return [definition.id, contribution];
      }),
  );

const makeBridgeProfile = (
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
  referenceHorizon: OptionalPriorTreatmentReferenceHorizon,
  contributions: Readonly<Record<string, OptionalPriorTreatmentContribution>>,
): OptionalPriorTreatmentBridgeProfile => {
  const optionalRequest = optionalArtifact.selectionRequest;
  return {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-prior-treatment-bridge-profile.test.synthetic',
    modelVersion: 'optional-prior-treatment-bridge.v1',
    templateRef: optionalArtifact.templateRef,
    templateFingerprint: optionalArtifact.templateFingerprint,
    optionalFeatureProfileRef: optionalArtifact.profileRef,
    optionalFeatureProfileFingerprint: optionalArtifact.profileFingerprint,
    referenceHorizonRef: {
      id: referenceHorizon.id,
      contentVersion: referenceHorizon.contentVersion,
    },
    referenceHorizonFingerprint:
      fingerprintOptionalPriorTreatmentReferenceHorizon(referenceHorizon),
    mappings: optionalRequest.moduleDefinitions
      .filter((definition) => definition.moduleKind === 'prior_treatment')
      .map((definition) => {
        const binding = optionalRequest.profile.candidateBindings.find(
          (candidate) => candidate.moduleRef.id === definition.id,
        )!;
        return {
          schemaVersion: 1,
          id: `optional-prior-treatment-mapping.test.${definition.id}`,
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
  contributions: Readonly<
    Record<string, OptionalPriorTreatmentContribution>
  > = defaultContributions(),
): OptionalPriorTreatmentBridgeRequest => {
  const relevantContributions = mappedContributions(optionalArtifact, contributions);
  const referenceHorizon = makeReferenceHorizon(relevantContributions);
  return {
    schemaVersion: 1,
    id: 'optional-prior-treatment-bridge-request.test.synthetic',
    optionalFeatureArtifact: optionalArtifact,
    referenceHorizon,
    bridgeProfile: makeBridgeProfile(optionalArtifact, referenceHorizon, relevantContributions),
  };
};

const expectBridgeArtifact = (request: unknown) => {
  const result = bridgeOptionalPriorTreatmentHistoryFromBudget(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('optional prior-treatment budget bridge', () => {
  it('returns null for zero selected modules without fabricating an empty history state', () => {
    const optionalArtifact = expectOptionalArtifact(
      makeOptionalFeatureRequest({
        maximumSelectedModules: 0,
        countWeights: [1],
      }),
    );
    const request = makeBridgeRequest(optionalArtifact);
    expect(OptionalPriorTreatmentBridgeRequestSchema.parse(request)).toEqual(request);
    const before = JSON.stringify(request);
    const artifact = expectBridgeArtifact(request);
    expect(JSON.stringify(request)).toBe(before);
    expect(OptionalPriorTreatmentBridgeArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.selectedPriorTreatmentModuleDefinitionIds).toEqual([]);
    expect(artifact.materializedTreatmentHistoryContribution).toBeNull();
    expect(artifact.materializedRecordIds).toEqual({
      medicationTrialIds: [],
      psychotherapyTrialIds: [],
      currentProviderIds: [],
      priorLevelOfCareIds: [],
    });
    expect(verifyOptionalPriorTreatmentBridgeIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(verifyOptionalPriorTreatmentBridgeContext({ artifact, request })).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('ignores a selected non-prior module and preserves the complete D-201 artifact', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 1 },
      (artifact) =>
        selectedDefinitionIds(artifact).length === 1 &&
        selectedDefinitionIds(artifact)[0] === nonPriorDefinition().id,
    );
    const artifact = expectBridgeArtifact(makeBridgeRequest(optionalArtifact));
    expect(artifact.materializedTreatmentHistoryContribution).toBeNull();
    expect(artifact.selectedPriorTreatmentModuleDefinitionIds).toEqual([]);
    expect(artifact.bridgeRequest.optionalFeatureArtifact).toEqual(optionalArtifact);
    expect(artifact.optionalFeatureArtifactRef).toEqual({
      id: optionalArtifact.id,
      inputFingerprint: optionalArtifact.inputFingerprint,
      payloadFingerprint: optionalArtifact.payloadFingerprint,
    });
  });

  it('materializes exactly one selected prior-treatment contribution with its original draw', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 1 },
      (artifact) =>
        selectedDefinitionIds(artifact).length === 1 &&
        selectedDefinitionIds(artifact)[0] === careHistoryDefinition().id,
    );
    const artifact = expectBridgeArtifact(makeBridgeRequest(optionalArtifact));
    const history = artifact.materializedTreatmentHistoryContribution!;
    const selectedEvaluation = artifact.candidateEvaluations.find(
      (evaluation) => evaluation.disposition === 'selected_by_optional_feature',
    )!;
    const upstreamEvaluation = optionalArtifact.candidateEvaluations.find(
      (evaluation) => evaluation.moduleRef.id === careHistoryDefinition().id,
    )!;

    expect(artifact.selectedPriorTreatmentModuleDefinitionIds).toEqual([
      careHistoryDefinition().id,
    ]);
    expect(history.medicationTrials).toEqual([]);
    expect(history.psychotherapyTrials).toHaveLength(1);
    expect(history.currentProviders).toHaveLength(1);
    expect(history.priorLevelsOfCare).toHaveLength(1);
    expect(selectedEvaluation.optionalFeatureSelectionOrdinal).toBe(
      upstreamEvaluation.selectionOrdinal,
    );
    expect(selectedEvaluation.optionalFeatureStableDrawId).toBe(upstreamEvaluation.stableDrawId);
    expect(artifact.bridgeRequest.optionalFeatureArtifact.totalSpent).toBe(
      optionalArtifact.totalSpent,
    );
    expect(artifact.bridgeRequest.optionalFeatureArtifact.remainingBudget).toBe(
      optionalArtifact.remainingBudget,
    );
  });

  it('additively materializes every lane, a 15-trial history, and repeated medications', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2, additionalFeatureBudget: 3 },
      (artifact) => {
        const selected = selectedDefinitionIds(artifact);
        return (
          selected.length === 2 &&
          selected.includes(longTrialsDefinition().id) &&
          selected.includes(careHistoryDefinition().id)
        );
      },
    );
    const request = makeBridgeRequest(optionalArtifact);
    const artifact = expectBridgeArtifact(request);
    const history = artifact.materializedTreatmentHistoryContribution!;

    expect(history.medicationTrials).toHaveLength(15);
    expect(history.psychotherapyTrials).toHaveLength(1);
    expect(history.currentProviders).toHaveLength(1);
    expect(history.priorLevelsOfCare).toHaveLength(1);
    expect(new Set(history.medicationTrials.map((trial) => trial.id))).toHaveLength(15);
    expect(
      history.medicationTrials.filter(
        (trial) => trial.medicationId === 'medication.test.sertraline',
      ).length,
    ).toBeGreaterThan(1);
    expect(history.medicationTrials[0]!.exposure).toEqual({
      duration: { value: 6, unit: 'week' },
      maximumDose: { amount: 10, unit: 'mg', frequency: 'daily' },
    });
    expect(history.psychotherapyTrials[0]).toMatchObject({
      interventionId: 'treatment.test.cognitive-behavioral-therapy',
      status: 'completed',
      engagement: 'adequate',
      response: 'partial',
    });
    expect(history.currentProviders[0]).toMatchObject({
      providerType: 'therapist',
      active: true,
    });
    expect(history.priorLevelsOfCare[0]).toMatchObject({
      level: 'inpatient_psychiatry',
      occurrenceCount: 2,
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
    });
    expect(optionalArtifact.totalSpent).toBe(3);
    expect(optionalArtifact.remainingBudget).toBe(0);
    expect(artifact.bridgeRequest.optionalFeatureArtifact.totalSpent).toBe(3);
    expect(artifact.bridgeRequest.optionalFeatureArtifact.remainingBudget).toBe(0);
    expect(artifact.bridgeRequest.optionalFeatureArtifact.resultingComplexityProfile).toEqual(
      optionalArtifact.resultingComplexityProfile,
    );
  });

  it('rejects empty and duplicate contribution identities while allowing repeated treatment IDs', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2 },
      (artifact) => artifact.selectedCount > 0,
    );
    const base = makeBridgeRequest(optionalArtifact);

    const empty = structuredClone(base);
    empty.bridgeProfile.mappings[0]!.contribution = {
      medicationTrials: [],
      psychotherapyTrials: [],
      currentProviders: [],
      priorLevelsOfCare: [],
    };
    expect(bridgeOptionalPriorTreatmentHistoryFromBudget(empty).ok).toBe(false);

    const duplicateWithin = structuredClone(base);
    const duplicateWithinLongHistory = duplicateWithin.bridgeProfile.mappings.find(
      (mapping) => mapping.moduleRef.id === longTrialsDefinition().id,
    )!;
    duplicateWithinLongHistory.contribution.medicationTrials[1]!.id =
      duplicateWithinLongHistory.contribution.medicationTrials[0]!.id;
    expect(bridgeOptionalPriorTreatmentHistoryFromBudget(duplicateWithin).ok).toBe(false);

    const duplicateAcrossLanes = structuredClone(base);
    const duplicateAcrossLongHistory = duplicateAcrossLanes.bridgeProfile.mappings.find(
      (mapping) => mapping.moduleRef.id === longTrialsDefinition().id,
    )!;
    const duplicateAcrossCareHistory = duplicateAcrossLanes.bridgeProfile.mappings.find(
      (mapping) => mapping.moduleRef.id === careHistoryDefinition().id,
    )!;
    duplicateAcrossCareHistory.contribution.currentProviders[0]!.id =
      duplicateAcrossLongHistory.contribution.medicationTrials[0]!.id;
    expect(bridgeOptionalPriorTreatmentHistoryFromBudget(duplicateAcrossLanes).ok).toBe(false);

    const validLongHistory = base.bridgeProfile.mappings.find(
      (mapping) => mapping.moduleRef.id === longTrialsDefinition().id,
    )!;
    expect(validLongHistory.contribution.medicationTrials[0]!.medicationId).toBe(
      validLongHistory.contribution.medicationTrials[1]!.medicationId,
    );
    expect(bridgeOptionalPriorTreatmentHistoryFromBudget(base).ok).toBe(true);
  });

  it('rejects incomplete, non-prior, stale, and crossed mappings', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2 },
      (artifact) => artifact.selectedCount > 0,
    );
    const base = makeBridgeRequest(optionalArtifact);
    const invalidRequests: OptionalPriorTreatmentBridgeRequest[] = [];

    const missing = structuredClone(base);
    missing.bridgeProfile.mappings.pop();
    invalidRequests.push(missing);

    const nonPrior = structuredClone(base);
    const nonPriorBinding =
      nonPrior.optionalFeatureArtifact.selectionRequest.profile.candidateBindings.find(
        (binding) => binding.moduleRef.id === nonPriorDefinition().id,
      )!;
    nonPrior.bridgeProfile.mappings[0]!.moduleRef = nonPriorBinding.moduleRef;
    nonPrior.bridgeProfile.mappings[0]!.moduleFingerprint = nonPriorBinding.moduleFingerprint;
    nonPrior.bridgeProfile.mappings[0]!.optionalFeatureBindingId = nonPriorBinding.id;
    nonPrior.bridgeProfile.mappings[0]!.selectedModuleId = nonPriorBinding.selectedModuleId;
    invalidRequests.push(nonPrior);

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
      expect(bridgeOptionalPriorTreatmentHistoryFromBudget(invalid).ok).toBe(false);
    }
  });

  it('requires an exact medication and psychotherapy reference horizon', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2 },
      (artifact) => artifact.selectedCount > 0,
    );
    const base = makeBridgeRequest(optionalArtifact);

    const missingMedication = structuredClone(base);
    missingMedication.referenceHorizon.medicationRefs.pop();
    expect(bridgeOptionalPriorTreatmentHistoryFromBudget(missingMedication).ok).toBe(false);

    const unusedIntervention = structuredClone(base);
    unusedIntervention.referenceHorizon.psychotherapyInterventionRefs.push({
      id: 'treatment.test.unused',
      contentVersion: '1.0.0',
    });
    expect(bridgeOptionalPriorTreatmentHistoryFromBudget(unusedIntervention).ok).toBe(false);

    const duplicateMedication = structuredClone(base);
    duplicateMedication.referenceHorizon.medicationRefs.push(
      structuredClone(duplicateMedication.referenceHorizon.medicationRefs[0]!),
    );
    expect(bridgeOptionalPriorTreatmentHistoryFromBudget(duplicateMedication).ok).toBe(false);

    const duplicateAcrossLanes = structuredClone(base);
    duplicateAcrossLanes.referenceHorizon.psychotherapyInterventionRefs.push(
      structuredClone(duplicateAcrossLanes.referenceHorizon.medicationRefs[0]!),
    );
    expect(bridgeOptionalPriorTreatmentHistoryFromBudget(duplicateAcrossLanes).ok).toBe(false);

    const unpinnedVersionChange = structuredClone(base);
    unpinnedVersionChange.referenceHorizon.medicationRefs[0]!.contentVersion = '2.0.0';
    expect(bridgeOptionalPriorTreatmentHistoryFromBudget(unpinnedVersionChange).ok).toBe(false);

    const wrongLane = structuredClone(base);
    const medicationRef = wrongLane.referenceHorizon.medicationRefs.shift()!;
    wrongLane.referenceHorizon.psychotherapyInterventionRefs.push(medicationRef);
    expect(bridgeOptionalPriorTreatmentHistoryFromBudget(wrongLane).ok).toBe(false);
  });

  it('normalizes set-like inputs, preserves immutability, and replays deterministically', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2, additionalFeatureBudget: 3 },
      (artifact) => {
        const selected = selectedDefinitionIds(artifact);
        return (
          selected.includes(longTrialsDefinition().id) &&
          selected.includes(careHistoryDefinition().id)
        );
      },
    );
    const request = makeBridgeRequest(optionalArtifact);
    const before = JSON.stringify(request);
    const reordered = structuredClone(request);
    reordered.referenceHorizon.medicationRefs.reverse();
    reordered.referenceHorizon.psychotherapyInterventionRefs.reverse();
    reordered.bridgeProfile.mappings.reverse();
    reordered.bridgeProfile.review.sourceUseNoteIds.reverse();
    reordered.bridgeProfile.mappings.forEach((mapping) => {
      mapping.review.sourceUseNoteIds.reverse();
      mapping.contribution.medicationTrials.reverse();
      mapping.contribution.psychotherapyTrials.reverse();
      mapping.contribution.currentProviders.reverse();
      mapping.contribution.priorLevelsOfCare.reverse();
    });
    reordered.bridgeProfile.referenceHorizonFingerprint =
      fingerprintOptionalPriorTreatmentReferenceHorizon(reordered.referenceHorizon);

    expect(fingerprintOptionalPriorTreatmentReferenceHorizon(reordered.referenceHorizon)).toBe(
      fingerprintOptionalPriorTreatmentReferenceHorizon(request.referenceHorizon),
    );
    expect(fingerprintOptionalPriorTreatmentBridgeProfile(reordered.bridgeProfile)).toBe(
      fingerprintOptionalPriorTreatmentBridgeProfile(request.bridgeProfile),
    );
    expect(expectBridgeArtifact(reordered)).toEqual(expectBridgeArtifact(request));
    expect(expectBridgeArtifact(structuredClone(request))).toEqual(expectBridgeArtifact(request));
    expect(JSON.stringify(request)).toBe(before);
  });

  it('detects nested D-201, materialized records, trace, fingerprint, and context tampering', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2, additionalFeatureBudget: 3 },
      (candidate) => selectedDefinitionIds(candidate).includes(longTrialsDefinition().id),
    );
    const request = makeBridgeRequest(optionalArtifact);
    const artifact = expectBridgeArtifact(request);
    const mutations: Array<(value: typeof artifact) => void> = [
      (value) => {
        value.bridgeRequest.optionalFeatureArtifact.selectionRequest.seed =
          'seed.optional-prior-treatment.tampered';
      },
      (value) => {
        value.materializedTreatmentHistoryContribution!.medicationTrials[0]!.response = 'remission';
      },
      (value) => {
        value.candidateEvaluations.find(
          (candidate) => candidate.disposition === 'selected_by_optional_feature',
        )!.optionalFeatureStableDrawId = 'optional-feature-draw.test.tampered';
      },
      (value) => {
        value.materializedRecordIds.medicationTrialIds[0] = 'medication-trial.test.tampered';
      },
      (value) => {
        value.payloadFingerprint =
          'fingerprint.optional-prior-treatment-bridge.output.fnv1a64.0000000000000000';
      },
    ];
    for (const mutate of mutations) {
      const changed = structuredClone(artifact);
      mutate(changed);
      expect(verifyOptionalPriorTreatmentBridgeIntegrity(changed).ok).toBe(false);
    }

    const otherOptionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2, additionalFeatureBudget: 3 },
      (candidate) =>
        candidate.payloadFingerprint !== optionalArtifact.payloadFingerprint &&
        selectedDefinitionIds(candidate).includes(longTrialsDefinition().id),
    );
    expect(
      verifyOptionalPriorTreatmentBridgeContext({
        artifact,
        request: makeBridgeRequest(otherOptionalArtifact),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });
});
