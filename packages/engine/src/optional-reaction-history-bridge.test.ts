import {
  OptionalReactionHistoryBridgeArtifactSchema,
  OptionalReactionHistoryBridgeRequestSchema,
  type ClinicalRuleReview,
  type OptionalFeatureBudgetSelectionArtifact,
  type OptionalFeatureBudgetSelectionRequest,
  type OptionalReactionHistoryBridgeProfile,
  type OptionalReactionHistoryBridgeRequest,
  type OptionalReactionHistoryReferenceHorizon,
  type PatientOptionalFeatureModuleDefinition,
  type PatientReactionHistory,
  type PatientTemplate,
  type TemplateOptionalFeatureIncompatibility,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  bridgeOptionalReactionHistoryFromBudget,
  fingerprintOptionalReactionHistoryBridgeProfile,
  fingerprintOptionalReactionHistoryReferenceHorizon,
  verifyOptionalReactionHistoryBridgeContext,
  verifyOptionalReactionHistoryBridgeIntegrity,
} from './optional-reaction-history-bridge';
import {
  fingerprintOptionalFeatureModuleDefinition,
  selectOptionalFeaturesWithinBudget,
} from './optional-feature-budget-selector';
import { fingerprintTemplateConditionSelectionTemplate } from './template-condition-selector';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-29T22:30:00.000Z',
  sourceUseNoteIds: [
    'source-use.test.optional-reaction-history.two',
    'source-use.test.optional-reaction-history.one',
  ],
};

const makeTemplate = (
  maximumSelectedModules = 2,
  additionalFeatureBudget = 3,
): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-template.test.optional-reaction-history',
  compilationMode: 'attachment_only.v6',
  careSetting: 'outpatient_psychiatry',
  internalLabel: 'Synthetic optional reaction-history fixture',
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
    id: 'presentation-richness.test.optional-reaction-history',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['interaction_or_adverse_effect'],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const moduleDefinition = (
  id: string,
  moduleKind: 'allergy_reaction' | 'prior_treatment',
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

const reactionEntriesDefinition = () =>
  moduleDefinition('optional-feature.test.reaction-entries', 'allergy_reaction');
const reactionNoneDefinition = () =>
  moduleDefinition('optional-feature.test.reaction-none', 'allergy_reaction');
const priorTreatmentDefinition = () =>
  moduleDefinition('optional-feature.test.prior-treatment', 'prior_treatment');

const allDefinitions = (): PatientOptionalFeatureModuleDefinition[] => [
  reactionEntriesDefinition(),
  reactionNoneDefinition(),
  priorTreatmentDefinition(),
];

const pairwiseReactionIncompatibility = (): TemplateOptionalFeatureIncompatibility => ({
  schemaVersion: 1,
  id: 'optional-feature-incompatibility.test.complete-reaction-histories',
  leftModuleId: 'optional-feature.test.reaction-entries',
  rightModuleId: 'optional-feature.test.reaction-none',
  reason: 'Complete reaction-history alternatives cannot both materialize.',
  review: approvedReview,
});

interface OptionalRequestOptions {
  readonly seed?: string;
  readonly maximumSelectedModules?: number;
  readonly additionalFeatureBudget?: number;
  readonly definitions?: PatientOptionalFeatureModuleDefinition[];
  readonly includePairwiseIncompatibility?: boolean;
  readonly countWeights?: readonly number[];
}

const makeOptionalFeatureRequest = (
  options: OptionalRequestOptions = {},
): OptionalFeatureBudgetSelectionRequest => {
  const definitions = options.definitions ?? allDefinitions();
  const template = makeTemplate(
    options.maximumSelectedModules ?? 2,
    options.additionalFeatureBudget ?? 3,
  );
  const hasBothReactionAlternatives =
    definitions.some((definition) => definition.id === reactionEntriesDefinition().id) &&
    definitions.some((definition) => definition.id === reactionNoneDefinition().id);
  return {
    schemaVersion: 1,
    id: 'optional-feature-budget-request.test.optional-reaction-history',
    template,
    moduleDefinitions: definitions,
    profile: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'optional-feature-profile.test.optional-reaction-history',
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
        id: `optional-feature-binding.test.reaction.${index}`,
        moduleRef: {
          id: definition.id,
          contentVersion: definition.contentVersion,
        },
        moduleFingerprint: fingerprintOptionalFeatureModuleDefinition(definition),
        selectedModuleId: `patient-optional-feature.test.reaction.${index}`,
        cost: definition.id === reactionEntriesDefinition().id ? 2 : 1,
        impact: definition.moduleKind === 'allergy_reaction' ? 'fit_modifier' : 'background',
        complexityContributions: [
          {
            id: `complexity-contribution.test.reaction.${index}`,
            label: `Synthetic reaction-history contribution ${index}`,
            dimension:
              definition.moduleKind === 'allergy_reaction' ? 'pharmacologic' : 'information',
            weight: 1,
            review: approvedReview,
          },
        ],
        gameSelectionWeight: [7, 5, 3][index] ?? 1,
        review: approvedReview,
      })),
      incompatibilities:
        hasBothReactionAlternatives && options.includePairwiseIncompatibility !== false
          ? [pairwiseReactionIncompatibility()]
          : [],
      review: approvedReview,
    },
    seed: options.seed ?? 'seed.optional-reaction-history',
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
      seed: `seed.optional-reaction-history.${index}`,
    });
    const result = selectOptionalFeaturesWithinBudget(request);
    if (result.ok && predicate(result.value)) return result.value;
  }
  throw new Error('Could not find a deterministic optional reaction-history fixture seed.');
};

const entriesPresentHistory = (): PatientReactionHistory => ({
  status: 'entries_present',
  medicationAssessmentStatus: 'entries_present',
  records: [
    {
      schemaVersion: 1,
      id: 'patient-reaction.test.haloperidol-oculogyric-crisis',
      trigger: {
        kind: 'medication',
        medicationId: 'medication.test.haloperidol',
      },
      recordedAs: 'allergy',
      manifestationIds: [
        'reaction-manifestation.test.oculogyric-crisis',
        'reaction-manifestation.test.muscle-spasm',
      ],
      reportedSeverity: 'severe',
      interpretedAs: null,
      source: 'outside_record',
      status: 'historical',
    },
    {
      schemaVersion: 1,
      id: 'patient-reaction.test.peanut',
      trigger: {
        kind: 'nonmedication',
        triggerId: 'reaction-trigger.test.peanut',
      },
      recordedAs: 'allergy',
      manifestationIds: ['reaction-manifestation.test.hives'],
      reportedSeverity: 'moderate',
      interpretedAs: null,
      source: 'patient_report',
      status: 'active',
    },
  ],
});

const documentedNoneHistory = (): PatientReactionHistory => ({
  status: 'documented_none',
  medicationAssessmentStatus: 'documented_none',
  records: [],
});

const unassessedHistory = (): PatientReactionHistory => ({
  status: 'unassessed',
  medicationAssessmentStatus: 'unassessed',
  records: [],
});

const historiesByModuleId = (): Readonly<Record<string, PatientReactionHistory>> => ({
  [reactionEntriesDefinition().id]: entriesPresentHistory(),
  [reactionNoneDefinition().id]: documentedNoneHistory(),
});

const makeReferenceHorizon = (
  histories: Readonly<Record<string, PatientReactionHistory>>,
): OptionalReactionHistoryReferenceHorizon => {
  const medicationIds = new Set<string>();
  const nonMedicationTriggerIds = new Set<string>();
  const manifestationIds = new Set<string>();
  Object.values(histories).forEach((history) => {
    history.records.forEach((record) => {
      if (record.trigger.kind === 'medication') {
        medicationIds.add(record.trigger.medicationId);
      } else {
        nonMedicationTriggerIds.add(record.trigger.triggerId);
      }
      record.manifestationIds.forEach((id) => manifestationIds.add(id));
    });
  });
  const refs = (ids: Set<string>) =>
    [...ids].sort().map((id) => ({
      id,
      contentVersion: '1.0.0',
    }));
  return {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'reaction-reference-horizon.test.optional-reaction-history',
    medicationRefs: refs(medicationIds),
    nonMedicationTriggerRefs: refs(nonMedicationTriggerIds),
    manifestationRefs: refs(manifestationIds),
  };
};

const makeBridgeProfile = (
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
  referenceHorizon: OptionalReactionHistoryReferenceHorizon,
  histories: Readonly<Record<string, PatientReactionHistory>>,
): OptionalReactionHistoryBridgeProfile => {
  const optionalRequest = optionalArtifact.selectionRequest;
  return {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-reaction-history-bridge-profile.test.synthetic',
    modelVersion: 'optional-reaction-history-bridge.v1',
    templateRef: optionalArtifact.templateRef,
    templateFingerprint: optionalArtifact.templateFingerprint,
    optionalFeatureProfileRef: optionalArtifact.profileRef,
    optionalFeatureProfileFingerprint: optionalArtifact.profileFingerprint,
    referenceHorizonRef: {
      id: referenceHorizon.id,
      contentVersion: referenceHorizon.contentVersion,
    },
    referenceHorizonFingerprint:
      fingerprintOptionalReactionHistoryReferenceHorizon(referenceHorizon),
    mappings: optionalRequest.moduleDefinitions
      .filter((definition) => definition.moduleKind === 'allergy_reaction')
      .map((definition) => {
        const binding = optionalRequest.profile.candidateBindings.find(
          (candidate) => candidate.moduleRef.id === definition.id,
        )!;
        const history = histories[definition.id];
        if (!history) throw new Error(`Missing synthetic history for ${definition.id}.`);
        return {
          schemaVersion: 1,
          id: `optional-reaction-history-mapping.test.${definition.id}`,
          moduleRef: binding.moduleRef,
          moduleFingerprint: binding.moduleFingerprint,
          optionalFeatureBindingId: binding.id,
          selectedModuleId: binding.selectedModuleId,
          reactionHistory: structuredClone(history),
          review: approvedReview,
        };
      }),
    review: approvedReview,
  };
};

const makeBridgeRequest = (
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
  histories: Readonly<Record<string, PatientReactionHistory>> = historiesByModuleId(),
): OptionalReactionHistoryBridgeRequest => {
  const referenceHorizon = makeReferenceHorizon(histories);
  return {
    schemaVersion: 1,
    id: 'optional-reaction-history-bridge-request.test.synthetic',
    optionalFeatureArtifact: optionalArtifact,
    referenceHorizon,
    bridgeProfile: makeBridgeProfile(optionalArtifact, referenceHorizon, histories),
  };
};

const expectBridgeArtifact = (request: unknown) => {
  const result = bridgeOptionalReactionHistoryFromBudget(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('optional reaction-history budget bridge', () => {
  it('strictly parses a zero-selection bridge and returns null without inventing reaction state', () => {
    const optionalArtifact = expectOptionalArtifact(
      makeOptionalFeatureRequest({
        maximumSelectedModules: 0,
        countWeights: [1],
      }),
    );
    const request = makeBridgeRequest(optionalArtifact);
    expect(OptionalReactionHistoryBridgeRequestSchema.parse(request)).toEqual(request);
    const before = JSON.stringify(request);
    const artifact = expectBridgeArtifact(request);
    expect(JSON.stringify(request)).toBe(before);
    expect(OptionalReactionHistoryBridgeArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.selectedReactionModuleDefinitionId).toBeNull();
    expect(artifact.selectedMappingId).toBeNull();
    expect(artifact.materializedReactionHistory).toBeNull();
    expect(artifact.materializedReactionRecordIds).toEqual([]);
    expect(artifact.candidateEvaluations).toHaveLength(2);
    expect(
      artifact.candidateEvaluations.every(
        (evaluation) => evaluation.disposition === 'not_selected',
      ),
    ).toBe(true);
    expect(verifyOptionalReactionHistoryBridgeIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(verifyOptionalReactionHistoryBridgeContext({ artifact, request })).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('materializes the complete selected entries-present history and exact D-201 trace', () => {
    const optionalArtifact = findOptionalArtifact(
      {
        maximumSelectedModules: 2,
      },
      (artifact) => selectedDefinitionIds(artifact).includes(reactionEntriesDefinition().id),
    );
    const request = makeBridgeRequest(optionalArtifact);
    const artifact = expectBridgeArtifact(request);
    const mapping = artifact.bridgeRequest.bridgeProfile.mappings.find(
      (candidate) => candidate.moduleRef.id === reactionEntriesDefinition().id,
    )!;
    const upstream = optionalArtifact.candidateEvaluations.find(
      (candidate) => candidate.moduleRef.id === reactionEntriesDefinition().id,
    )!;

    expect(artifact.selectedReactionModuleDefinitionId).toBe(reactionEntriesDefinition().id);
    expect(artifact.selectedMappingId).toBe(mapping.id);
    expect(artifact.selectedOptionalFeatureBindingId).toBe(upstream.bindingId);
    expect(artifact.selectedModuleId).toBe(upstream.moduleSnapshot.id);
    expect(artifact.optionalFeatureSelectionOrdinal).toBe(upstream.selectionOrdinal);
    expect(artifact.optionalFeatureStableDrawId).toBe(upstream.stableDrawId);
    expect(artifact.materializedReactionHistory).toEqual(mapping.reactionHistory);
    expect(artifact.materializedReactionRecordIds).toEqual(
      mapping.reactionHistory.records.map((record) => record.id).sort(),
    );
    expect(
      artifact.candidateEvaluations.find(
        (candidate) => candidate.moduleRef.id === reactionEntriesDefinition().id,
      ),
    ).toMatchObject({
      disposition: 'selected_by_optional_feature',
      optionalFeatureSelectionOrdinal: upstream.selectionOrdinal,
      optionalFeatureStableDrawId: upstream.stableDrawId,
    });
  });

  it('preserves a selected documented-none history as a complete alternative', () => {
    const definitions = [reactionNoneDefinition(), priorTreatmentDefinition()];
    const optionalArtifact = findOptionalArtifact(
      {
        definitions,
        maximumSelectedModules: 1,
      },
      (artifact) => selectedDefinitionIds(artifact).includes(reactionNoneDefinition().id),
    );
    const histories = {
      [reactionNoneDefinition().id]: documentedNoneHistory(),
    };
    const artifact = expectBridgeArtifact(makeBridgeRequest(optionalArtifact, histories));
    expect(artifact.materializedReactionHistory).toEqual(documentedNoneHistory());
    expect(artifact.materializedReactionHistory).not.toBeNull();
    expect(artifact.materializedReactionRecordIds).toEqual([]);
  });

  it('preserves selected unassessed state and rejects clinical interpretation', () => {
    const definitions = [reactionEntriesDefinition(), priorTreatmentDefinition()];
    const optionalArtifact = findOptionalArtifact(
      {
        definitions,
        maximumSelectedModules: 1,
      },
      (artifact) => selectedDefinitionIds(artifact).includes(reactionEntriesDefinition().id),
    );
    const histories = {
      [reactionEntriesDefinition().id]: unassessedHistory(),
    };
    const artifact = expectBridgeArtifact(makeBridgeRequest(optionalArtifact, histories));
    expect(artifact.materializedReactionHistory).toEqual(unassessedHistory());

    const interpreted = makeBridgeRequest(optionalArtifact, {
      [reactionEntriesDefinition().id]: entriesPresentHistory(),
    });
    interpreted.bridgeProfile.mappings[0]!.reactionHistory.records[0]!.interpretedAs = 'unclear';
    expect(bridgeOptionalReactionHistoryFromBudget(interpreted).ok).toBe(false);
  });

  it('ignores a selected nonreaction module while preserving D-201 as sole budget authority', () => {
    const definitions = [reactionEntriesDefinition(), priorTreatmentDefinition()];
    const optionalArtifact = findOptionalArtifact(
      {
        definitions,
        maximumSelectedModules: 1,
      },
      (artifact) =>
        selectedDefinitionIds(artifact).length === 1 &&
        selectedDefinitionIds(artifact)[0] === priorTreatmentDefinition().id,
    );
    const histories = {
      [reactionEntriesDefinition().id]: entriesPresentHistory(),
    };
    const artifact = expectBridgeArtifact(makeBridgeRequest(optionalArtifact, histories));
    expect(artifact.materializedReactionHistory).toBeNull();
    expect(artifact.selectedReactionModuleDefinitionId).toBeNull();
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
    expect(artifact.bridgeRequest.optionalFeatureArtifact.resultingComplexityProfile).toEqual(
      optionalArtifact.resultingComplexityProfile,
    );
  });

  it('rejects incomplete, extra, stale, and crossed mapping identities', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2 },
      (artifact) => artifact.selectedCount > 0,
    );
    const base = makeBridgeRequest(optionalArtifact);
    const invalidRequests: OptionalReactionHistoryBridgeRequest[] = [];

    const missing = structuredClone(base);
    missing.bridgeProfile.mappings.pop();
    invalidRequests.push(missing);

    const extra = structuredClone(base);
    const priorBinding =
      extra.optionalFeatureArtifact.selectionRequest.profile.candidateBindings.find(
        (binding) => binding.moduleRef.id === priorTreatmentDefinition().id,
      )!;
    extra.bridgeProfile.mappings[0]!.moduleRef = priorBinding.moduleRef;
    extra.bridgeProfile.mappings[0]!.moduleFingerprint = priorBinding.moduleFingerprint;
    extra.bridgeProfile.mappings[0]!.optionalFeatureBindingId = priorBinding.id;
    extra.bridgeProfile.mappings[0]!.selectedModuleId = priorBinding.selectedModuleId;
    invalidRequests.push(extra);

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

    for (const invalid of invalidRequests) {
      expect(bridgeOptionalReactionHistoryFromBudget(invalid).ok).toBe(false);
    }
  });

  it('requires an exact typed reference horizon and pairwise D-201 alternatives', () => {
    const optionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2 },
      (artifact) => artifact.selectedCount > 0,
    );
    const base = makeBridgeRequest(optionalArtifact);

    const missingMedication = structuredClone(base);
    missingMedication.referenceHorizon.medicationRefs = [];
    expect(bridgeOptionalReactionHistoryFromBudget(missingMedication).ok).toBe(false);

    const unusedManifestation = structuredClone(base);
    unusedManifestation.referenceHorizon.manifestationRefs.push({
      id: 'reaction-manifestation.test.unused',
      contentVersion: '1.0.0',
    });
    expect(bridgeOptionalReactionHistoryFromBudget(unusedManifestation).ok).toBe(false);

    const staleHorizonVersion = structuredClone(base);
    staleHorizonVersion.referenceHorizon.medicationRefs[0]!.contentVersion = '2.0.0';
    expect(bridgeOptionalReactionHistoryFromBudget(staleHorizonVersion).ok).toBe(false);

    const withoutPairwiseArtifact = findOptionalArtifact(
      {
        maximumSelectedModules: 1,
        includePairwiseIncompatibility: false,
      },
      () => true,
    );
    expect(
      bridgeOptionalReactionHistoryFromBudget(makeBridgeRequest(withoutPairwiseArtifact)).ok,
    ).toBe(false);
  });

  it('normalizes set-like inputs and replays deterministically', () => {
    const optionalArtifact = findOptionalArtifact({ maximumSelectedModules: 2 }, (artifact) =>
      selectedDefinitionIds(artifact).includes(reactionEntriesDefinition().id),
    );
    const request = makeBridgeRequest(optionalArtifact);
    const reordered = structuredClone(request);
    reordered.referenceHorizon.medicationRefs.reverse();
    reordered.referenceHorizon.nonMedicationTriggerRefs.reverse();
    reordered.referenceHorizon.manifestationRefs.reverse();
    reordered.bridgeProfile.mappings.reverse();
    reordered.bridgeProfile.review.sourceUseNoteIds.reverse();
    reordered.bridgeProfile.mappings.forEach((mapping) => {
      mapping.review.sourceUseNoteIds.reverse();
      mapping.reactionHistory.records.reverse();
      mapping.reactionHistory.records.forEach((record) => record.manifestationIds.reverse());
    });
    reordered.bridgeProfile.referenceHorizonFingerprint =
      fingerprintOptionalReactionHistoryReferenceHorizon(reordered.referenceHorizon);

    expect(fingerprintOptionalReactionHistoryReferenceHorizon(reordered.referenceHorizon)).toBe(
      fingerprintOptionalReactionHistoryReferenceHorizon(request.referenceHorizon),
    );
    expect(fingerprintOptionalReactionHistoryBridgeProfile(reordered.bridgeProfile)).toBe(
      fingerprintOptionalReactionHistoryBridgeProfile(request.bridgeProfile),
    );
    expect(expectBridgeArtifact(reordered)).toEqual(expectBridgeArtifact(request));
    expect(expectBridgeArtifact(structuredClone(request))).toEqual(expectBridgeArtifact(request));
  });

  it('detects nested D-201, materialized history, trace, fingerprint, and context tampering', () => {
    const optionalArtifact = findOptionalArtifact({ maximumSelectedModules: 2 }, (candidate) =>
      selectedDefinitionIds(candidate).includes(reactionEntriesDefinition().id),
    );
    const request = makeBridgeRequest(optionalArtifact);
    const artifact = expectBridgeArtifact(request);
    const mutations: Array<(value: typeof artifact) => void> = [
      (value) => {
        value.bridgeRequest.optionalFeatureArtifact.selectionRequest.seed =
          'seed.optional-reaction-history.tampered';
      },
      (value) => {
        value.materializedReactionHistory!.records[0]!.reportedSeverity = 'mild';
      },
      (value) => {
        value.candidateEvaluations.find(
          (candidate) => candidate.disposition === 'selected_by_optional_feature',
        )!.optionalFeatureStableDrawId = 'optional-feature-draw.test.tampered';
      },
      (value) => {
        value.payloadFingerprint =
          'fingerprint.optional-reaction-history-bridge.output.fnv1a64.0000000000000000';
      },
    ];
    for (const mutate of mutations) {
      const changed = structuredClone(artifact);
      mutate(changed);
      expect(verifyOptionalReactionHistoryBridgeIntegrity(changed).ok).toBe(false);
    }

    const otherOptionalArtifact = findOptionalArtifact(
      { maximumSelectedModules: 2 },
      (candidate) =>
        candidate.payloadFingerprint !== optionalArtifact.payloadFingerprint &&
        selectedDefinitionIds(candidate).includes(reactionEntriesDefinition().id),
    );
    expect(
      verifyOptionalReactionHistoryBridgeContext({
        artifact,
        request: makeBridgeRequest(otherOptionalArtifact),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });
});
