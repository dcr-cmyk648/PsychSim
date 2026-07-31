import {
  WeightedFindingTendencyApplicabilityArtifactSchema,
  WeightedFindingTendencyApplicabilityRequestSchema,
  type BackgroundFindingOutcomeArtifact,
  type BackgroundFindingOutcomeProfile,
  type ClinicalRuleReview,
  type ConditionFindingCardinalityProfile,
  type DecisionPatientFactKey,
  type DecisionPatientPredicate,
  type FindingDefinition,
  type OptionalComorbidityBridgeProfile,
  type OptionalFeatureBudgetSelectionArtifact,
  type OptionalFeatureBudgetSelectionRequest,
  type PatientOptionalFeatureModuleDefinition,
  type PatientTemplate,
  type ResolvedConditionSource,
  type ResolvedPatientState,
  type ResolvedPatientStateCompositionArtifact,
  type TemplateConditionSelectionProfile,
  type WeightedFindingTendencyApplicabilityDefinition,
  type WeightedFindingTendencyApplicabilityRequest,
  type WeightedFindingTendencyProfile,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  fingerprintBackgroundFindingOutcomeProfile,
  selectBackgroundFindingOutcomes,
} from './background-finding-outcome-selector';
import {
  fingerprintConditionFindingCardinalityProfile,
  selectConditionFindingCardinalityCandidates,
} from './condition-finding-cardinality-selector';
import { bridgeOptionalComorbiditiesFromBudget } from './optional-comorbidity-budget-bridge';
import {
  fingerprintOptionalFeatureModuleDefinition,
  selectOptionalFeaturesWithinBudget,
} from './optional-feature-budget-selector';
import { composeResolvedPatientState } from './resolved-patient-state-composer';
import {
  fingerprintTemplateConditionSelectionProfile,
  fingerprintTemplateConditionSelectionTemplate,
  selectTemplateConditions,
} from './template-condition-selector';
import {
  buildWeightedFindingTendencyApplicabilityIndex,
  compileWeightedFindingTendencyApplicability,
  fingerprintWeightedFindingTendencyApplicabilityDefinition,
  verifyWeightedFindingTendencyApplicabilityContext,
  verifyWeightedFindingTendencyApplicabilityIntegrity,
} from './weighted-finding-tendency-applicability-compiler';
import { fingerprintWeightedFindingTendencyProfile } from './weighted-finding-tendency-aggregator';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-30T04:00:00.000Z',
  sourceUseNoteIds: ['source-use.test.tendency-applicability'],
};

const requiredDiagnosisId = 'diagnosis.test.applicability-focus';
const optionalDiagnosisId = 'diagnosis.test.applicability-comorbidity';

const textureFinding: FindingDefinition = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'finding.history.test.applicability-sleep-change',
  label: 'Synthetic sleep change',
  aliases: [],
  semanticKind: 'history',
  valueSpecification: {
    kind: 'outcome',
    allowedValues: ['present', 'absent', 'subthreshold'],
  },
  allowedPresentationProjections: ['status'],
  lifecycle: 'approved',
  medicalReviewStatus: 'unreviewed',
};

const coreFinding: FindingDefinition = {
  ...textureFinding,
  id: 'finding.history.test.applicability-low-energy',
  label: 'Synthetic low energy',
};

const makeTemplate = (includeOptionalComorbidity = true): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: includeOptionalComorbidity
    ? 'patient-template.test.tendency-applicability'
    : 'patient-template.test.tendency-applicability-blocked',
  compilationMode: 'attachment_only.v6',
  careSetting: 'outpatient_psychiatry',
  internalLabel: 'Synthetic whole-state tendency applicability fixture',
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
  review: approvedReview,
  patientPool: 'starter',
  focusedDecisionId: 'decision.test.applicability',
  primaryPolicyRef: {
    id: 'decision-policy.test.applicability',
    contentVersion: '1.0.0',
  },
  decisionActionHorizonId: 'decision-action-horizon.test.applicability',
  decisionActionHorizonFingerprint:
    'fingerprint.catalog-instance.action-horizon.fnv1a64.0000000000000001',
  diagnosisSelectionHorizonId: 'diagnosis-selection-horizon.test.applicability',
  diagnosisSelectionHorizonFingerprint:
    'fingerprint.catalog-instance.diagnosis-horizon.fnv1a64.0000000000000002',
  findingProjectionHorizonId: 'finding-projection-horizon.test.applicability',
  findingProjectionHorizonFingerprint:
    'fingerprint.finding.projection-horizon.fnv1a64.0000000000000003',
  universalActionResultAssemblyRecipeRef: {
    id: 'universal-action-result-assembly.test.synthetic',
    contentVersion: '1.0.0',
  },
  universalActionResultAssemblyRecipeFingerprint:
    'fingerprint.universal-action-result.assembly-recipe.fnv1a64.0000000000000004',
  compatibleLocationRefs: [{ id: 'location.test.synthetic', contentVersion: '1.0.0' }],
  requiredConditions: [
    {
      schemaVersion: 1,
      id: 'template-condition.test.applicability-focus',
      diagnosisDefinitionId: requiredDiagnosisId,
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      encounterRelevance: 'focus',
      severityId: 'diagnosis-severity.test.moderate',
      specifierIds: [],
    },
  ],
  optionalConditionSelectionGroups: includeOptionalComorbidity
    ? [
        {
          schemaVersion: 1,
          id: 'template-condition-group.test.applicability-comorbidity',
          minimumSelections: 0,
          maximumSelections: 1,
          candidates: [
            {
              schemaVersion: 1,
              id: 'template-condition.test.applicability-comorbidity',
              diagnosisDefinitionId: optionalDiagnosisId,
              diagnosisDefinitionContentVersion: '1.0.0',
              clinicalStateId: 'clinical-state.current',
              timeScopeId: 'time-scope.current',
              encounterRelevance: 'contributing',
              severityId: null,
              specifierIds: [],
            },
          ],
        },
      ]
    : [],
  complexityProfile: {
    modelVersion: 'additional-feature-budget.v1',
    measurementStatus: 'budget_only',
    additionalFeatureBudget: 1,
    maximumSelectedModules: 1,
    selectedModules: [],
    targetEnvelope: null,
  },
  presentationRichnessEnvelope: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'presentation-richness.test.tendency-applicability',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['diagnostic_attribution'],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const makeCoreState = (): ResolvedPatientState => ({
  schemaVersion: 1,
  id: 'resolved-patient-state.test.tendency-applicability-core',
  demographics: {
    recordVersion: 2,
    ageYears: 44,
    reviewedAgeBandId: 'age-band.middle-adult',
    sexForReference: 'female',
  },
  conditionStates: [],
  diagnosisRecordEntries: [],
  medicationRegimenEntries: [],
  exposureInventory: {
    schemaVersion: 1,
    id: 'resolved-exposure-inventory.test.tendency-applicability',
    useEntries: [],
  },
  treatmentHistory: {
    medicationTrials: [
      {
        schemaVersion: 1,
        id: 'medication-trial.test.sertraline-remission',
        medicationId: 'medication.sertraline',
        exposure: { duration: null, maximumDose: null },
        adequacy: 'adequate',
        adherence: 'consistent',
        response: 'remission',
        tolerability: 'tolerated',
        source: 'patient_report',
        summary: 'Synthetic adequate trial with remission.',
      },
      {
        schemaVersion: 1,
        id: 'medication-trial.test.sertraline-none',
        medicationId: 'medication.sertraline',
        exposure: { duration: null, maximumDose: null },
        adequacy: 'inadequate',
        adherence: 'consistent',
        response: 'none',
        tolerability: 'tolerated',
        source: 'patient_report',
        summary: 'Synthetic inadequate trial without response.',
      },
      {
        schemaVersion: 1,
        id: 'medication-trial.test.fluoxetine-none',
        medicationId: 'medication.fluoxetine',
        exposure: { duration: null, maximumDose: null },
        adequacy: 'adequate',
        adherence: 'consistent',
        response: 'none',
        tolerability: 'tolerated',
        source: 'patient_report',
        summary: 'Synthetic adequate trial without response.',
      },
    ],
    psychotherapyTrials: [],
    currentProviders: [],
    priorLevelsOfCare: [],
  },
  medicationTolerabilityFindings: [],
  reactionHistory: {
    status: 'unassessed',
    medicationAssessmentStatus: 'unassessed',
    records: [],
  },
  canonicalFindings: [],
  measurements: [],
  categoricalObservations: [],
  structuredTestResults: [],
  clinicalContexts: [],
  clinicalDurations: [],
  subjectiveBurdenRecords: [],
  propositionState: {
    schemaVersion: 1,
    id: 'resolved-proposition-state.test.tendency-applicability',
    propositions: [],
    evidence: [],
    dependencyGroups: [],
    beliefAppraisals: [],
  },
  clinicalTagIds: ['clinical-tag.test.must-never-match'],
  reportedSafetyPlanningAbility: 'unassessed',
});

const findSelectedOptionalArtifact = (
  request: (seed: string) => OptionalFeatureBudgetSelectionRequest,
): OptionalFeatureBudgetSelectionArtifact => {
  for (let index = 0; index < 2_000; index += 1) {
    const result = selectOptionalFeaturesWithinBudget(request(`seed.d210.${index}`));
    if (result.ok && result.value.selectedCount === 1) return result.value;
  }
  throw new Error('Expected one deterministic selected D-201 module.');
};

const makeComposedState = (): {
  readonly composition: ResolvedPatientStateCompositionArtifact;
  readonly conditionSource: ResolvedConditionSource;
} => {
  const template = makeTemplate();
  const moduleDefinition: PatientOptionalFeatureModuleDefinition = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-feature.test.applicability-comorbidity',
    label: 'Synthetic optional comorbidity',
    moduleKind: 'comorbidity',
    lifecycle: 'approved',
    medicalReviewStatus: 'approved',
    review: approvedReview,
  };
  const moduleFingerprint = fingerprintOptionalFeatureModuleDefinition(moduleDefinition);
  const optionalArtifact = findSelectedOptionalArtifact((seed) => ({
    schemaVersion: 1,
    id: 'optional-feature-budget-request.test.tendency-applicability',
    template: structuredClone(template),
    moduleDefinitions: [moduleDefinition],
    profile: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'optional-feature-profile.test.tendency-applicability',
      modelVersion: 'weighted-optional-feature-budget-selection.v1',
      templateRef: { id: template.id, contentVersion: template.contentVersion },
      templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
      countWeights: [
        { schemaVersion: 1, selectionCount: 0, gameSelectionWeight: 1 },
        { schemaVersion: 1, selectionCount: 1, gameSelectionWeight: 9 },
      ],
      candidateBindings: [
        {
          schemaVersion: 1,
          id: 'optional-feature-binding.test.applicability-comorbidity',
          moduleRef: {
            id: moduleDefinition.id,
            contentVersion: moduleDefinition.contentVersion,
          },
          moduleFingerprint,
          selectedModuleId: 'patient-optional-feature.test.applicability-comorbidity',
          cost: 1,
          impact: 'fit_modifier',
          complexityContributions: [
            {
              id: 'complexity-contribution.test.applicability-comorbidity',
              label: 'Synthetic diagnostic texture',
              dimension: 'diagnostic',
              weight: 1,
              review: approvedReview,
            },
          ],
          gameSelectionWeight: 1,
          review: approvedReview,
        },
      ],
      incompatibilities: [],
      review: approvedReview,
    },
    seed,
  }));

  const conditionProfile: TemplateConditionSelectionProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'generation-profile.test.applicability-conditions',
    modelVersion: 'weighted-template-condition-selection.v1',
    templateRef: { id: template.id, contentVersion: template.contentVersion },
    templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
    groupProfiles: [
      {
        schemaVersion: 1,
        id: 'condition-profile-group.test.applicability-comorbidity',
        groupId: 'template-condition-group.test.applicability-comorbidity',
        countWeights: [
          { schemaVersion: 1, selectionCount: 0, gameSelectionWeight: 1 },
          { schemaVersion: 1, selectionCount: 1, gameSelectionWeight: 1 },
        ],
        candidateWeights: [
          {
            schemaVersion: 1,
            templateConditionId: 'template-condition.test.applicability-comorbidity',
            gameSelectionWeight: 1,
          },
        ],
      },
    ],
    incompatibilities: [],
  };
  const optionalBinding = optionalArtifact.selectionRequest.profile.candidateBindings[0]!;
  const bridgeProfile: OptionalComorbidityBridgeProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'bridge-profile.test.tendency-applicability-comorbidity',
    modelVersion: 'optional-comorbidity-condition-bridge.v1',
    templateRef: { id: template.id, contentVersion: template.contentVersion },
    templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
    optionalFeatureProfileRef: optionalArtifact.profileRef,
    optionalFeatureProfileFingerprint: optionalArtifact.profileFingerprint,
    conditionProfileRef: {
      id: conditionProfile.id,
      contentVersion: conditionProfile.contentVersion,
    },
    conditionProfileFingerprint: fingerprintTemplateConditionSelectionProfile(conditionProfile),
    mappings: [
      {
        schemaVersion: 1,
        id: 'optional-comorbidity-mapping.test.applicability',
        moduleRef: optionalBinding.moduleRef,
        moduleFingerprint: optionalBinding.moduleFingerprint,
        optionalFeatureBindingId: optionalBinding.id,
        selectedModuleId: optionalBinding.selectedModuleId,
        groupId: 'template-condition-group.test.applicability-comorbidity',
        templateConditionId: 'template-condition.test.applicability-comorbidity',
        review: approvedReview,
      },
    ],
    review: approvedReview,
  };
  const bridged = bridgeOptionalComorbiditiesFromBudget({
    schemaVersion: 1,
    id: 'optional-comorbidity-bridge-request.test.tendency-applicability',
    optionalFeatureArtifact: optionalArtifact,
    conditionSelectionRequest: {
      schemaVersion: 1,
      id: 'condition-selection-request.test.tendency-applicability',
      template: structuredClone(template),
      profile: conditionProfile,
      seed: 'seed.d210.condition-audit',
    },
    bridgeProfile,
  });
  if (!bridged.ok) {
    throw new Error('error' in bridged ? bridged.error.message : bridged.conflict.code);
  }
  const conditionSource: ResolvedConditionSource = {
    schemaVersion: 1,
    sourceKind: 'optional_comorbidity_bridge',
    artifact: bridged.value,
  };
  const corePatientState = makeCoreState();
  const requiredConditionStateIds = new Set(
    conditionSource.artifact.conditionBindings
      .filter((binding) => binding.kind === 'required')
      .map((binding) => binding.conditionStateId),
  );
  corePatientState.conditionStates = conditionSource.artifact.conditionStates.filter((state) =>
    requiredConditionStateIds.has(state.id),
  );
  const composed = composeResolvedPatientState({
    schemaVersion: 1,
    id: 'patient-state-composition-request.test.tendency-applicability',
    corePatientState,
    reactionHistoryOwnership: 'core_locked',
    optionalFeatureArtifact: optionalArtifact,
    conditionSource,
    reactionHistoryBridgeArtifact: null,
    priorTreatmentBridgeArtifact: null,
    exposureBridgeArtifact: null,
  });
  if (!composed.ok) throw new Error(composed.error.message);
  return { composition: composed.value, conditionSource };
};

const makeConditionFindingArtifact = (conditionSource: ResolvedConditionSource) => {
  const conditionState = conditionSource.artifact.conditionStates.find(
    (state) => state.diagnosisDefinitionId === requiredDiagnosisId,
  );
  if (!conditionState) throw new Error('Expected required synthetic condition state.');
  const profile: ConditionFindingCardinalityProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'condition-finding-profile.test.tendency-applicability',
    modelVersion: 'condition-finding-cardinality.v1',
    conditionScope: {
      diagnosisDefinitionId: requiredDiagnosisId,
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      severity: {
        kind: 'exact',
        severityId: 'diagnosis-severity.test.moderate',
      },
      requiredSpecifierIds: [],
    },
    requiredOutcomes: [
      {
        schemaVersion: 1,
        id: 'condition-finding-requirement.test.applicability-low-energy',
        findingDefinitionId: coreFinding.id,
        findingDefinitionContentVersion: coreFinding.contentVersion,
        proposedValue: { kind: 'outcome', value: 'present' },
        uncertainty: 'none',
        developerOpinionIds: [],
        review: approvedReview,
      },
    ],
    cardinalityGroups: [],
  };
  const result = selectConditionFindingCardinalityCandidates({
    schemaVersion: 1,
    id: 'condition-finding-cardinality-request.test.tendency-applicability',
    conditionSource,
    profiles: [profile],
    conditionProfileBindings: [
      {
        schemaVersion: 1,
        id: 'condition-finding-binding.test.tendency-applicability',
        conditionStateId: conditionState.id,
        profileRef: { id: profile.id, contentVersion: profile.contentVersion },
        profileFingerprint: fingerprintConditionFindingCardinalityProfile(profile),
      },
    ],
    findingDefinitions: [coreFinding],
    seed: 'seed.d210.condition-findings',
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const makeBackgroundArtifact = (
  conditionSource: ResolvedConditionSource,
): BackgroundFindingOutcomeArtifact => {
  const conditionFindingArtifact = makeConditionFindingArtifact(conditionSource);
  const profile: BackgroundFindingOutcomeProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'background-finding-profile.test.tendency-applicability',
    modelVersion: 'weighted-background-finding.v1',
    findingDefinitionId: textureFinding.id,
    findingDefinitionContentVersion: textureFinding.contentVersion,
    outcomes: [
      {
        schemaVersion: 1,
        id: 'background-outcome.test.applicability-absent',
        proposedValue: { kind: 'outcome', value: 'absent' },
        uncertainty: 'none',
        gameGenerationWeight: 6,
      },
      {
        schemaVersion: 1,
        id: 'background-outcome.test.applicability-subthreshold',
        proposedValue: { kind: 'outcome', value: 'subthreshold' },
        uncertainty: 'none',
        gameGenerationWeight: 3,
      },
      {
        schemaVersion: 1,
        id: 'background-outcome.test.applicability-present',
        proposedValue: { kind: 'outcome', value: 'present' },
        uncertainty: 'none',
        gameGenerationWeight: 1,
      },
    ],
    developerOpinionIds: [],
    review: approvedReview,
  };
  const horizon = {
    schemaVersion: 1 as const,
    id: 'background-finding-horizon.test.tendency-applicability',
    targets: [
      {
        schemaVersion: 1 as const,
        id: 'background-finding-target.test.tendency-applicability',
        findingDefinitionId: textureFinding.id,
        findingDefinitionContentVersion: textureFinding.contentVersion,
      },
    ],
  };
  const result = selectBackgroundFindingOutcomes({
    schemaVersion: 1,
    id: 'background-finding-request.test.tendency-applicability',
    conditionFindingArtifact,
    horizon,
    profiles: [profile],
    profileBindings: [
      {
        schemaVersion: 1,
        id: 'background-finding-binding.test.tendency-applicability',
        horizonTargetId: horizon.targets[0]!.id,
        profileRef: { id: profile.id, contentVersion: profile.contentVersion },
        profileFingerprint: fingerprintBackgroundFindingOutcomeProfile(profile),
      },
    ],
    findingDefinitions: [textureFinding],
    seed: 'seed.d210.background',
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const makeProfile = (
  suffix: string,
  findingContentVersion = textureFinding.contentVersion,
): WeightedFindingTendencyProfile => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: `weighted-finding-tendency-profile.test.applicability-${suffix}`,
  modelVersion: 'additive-categorical-finding-tendency.v1',
  findingDefinitionId: textureFinding.id,
  findingDefinitionContentVersion: findingContentVersion,
  outcomeSetSemantics: 'mutually_exclusive_exhaustive',
  allocations: [
    {
      schemaVersion: 1,
      proposedValue: { kind: 'outcome', value: 'absent' },
      addedGameGenerationWeight: 0,
    },
    {
      schemaVersion: 1,
      proposedValue: { kind: 'outcome', value: 'subthreshold' },
      addedGameGenerationWeight: 2,
    },
    {
      schemaVersion: 1,
      proposedValue: { kind: 'outcome', value: 'present' },
      addedGameGenerationWeight: 5,
    },
  ],
  developerOpinionIds: [],
  review: approvedReview,
});

const makeDefinition = (
  suffix: string,
  patientWhen: DecisionPatientPredicate,
  findingContentVersion = textureFinding.contentVersion,
): {
  readonly profile: WeightedFindingTendencyProfile;
  readonly definition: WeightedFindingTendencyApplicabilityDefinition;
} => {
  const profile = makeProfile(suffix, findingContentVersion);
  return {
    profile,
    definition: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: `tendency-applicability.test.${suffix}`,
      modelVersion: 'typed-patient-fact-tendency-applicability.v1',
      label: `Synthetic ${suffix} tendency applicability`,
      rationale: 'Synthetic point-free applicability used only for deterministic compiler tests.',
      findingDefinitionId: textureFinding.id,
      findingDefinitionContentVersion: findingContentVersion,
      profileRef: { id: profile.id, contentVersion: profile.contentVersion },
      profileFingerprint: fingerprintWeightedFindingTendencyProfile(profile),
      patientWhen,
      developerOpinionIds: [],
      review: approvedReview,
    },
  };
};

const fact = (
  recordKind: DecisionPatientFactKey['recordKind'],
  identityId: string,
  identityContentVersion: string | null,
  attributeId: string,
  valueId: string,
): DecisionPatientFactKey => ({
  recordKind,
  identityId,
  identityContentVersion,
  attributeId,
  valueId,
});

const conditionPresence = (identityId: string, contentVersion = '1.0.0') =>
  fact('condition', identityId, contentVersion, 'condition.presence', 'state.present');

const medicationTrialFact = (
  medicationId: string,
  attributeId: 'medication-trial.adequacy' | 'medication-trial.response',
  valueId: string,
) => fact('medication_trial', medicationId, null, attributeId, valueId);

const makeRequest = (
  composition: ResolvedPatientStateCompositionArtifact,
  backgroundArtifact: BackgroundFindingOutcomeArtifact,
  entries: readonly ReturnType<typeof makeDefinition>[],
): WeightedFindingTendencyApplicabilityRequest => ({
  schemaVersion: 1,
  id: 'tendency-applicability-request.test.synthetic',
  patientStateCompositionArtifact: composition,
  backgroundArtifact,
  profiles: entries.map((entry) => entry.profile),
  applicabilityDefinitions: entries.map((entry) => entry.definition),
});

const makeFixture = () => {
  const { composition, conditionSource } = makeComposedState();
  return {
    composition,
    conditionSource,
    backgroundArtifact: makeBackgroundArtifact(conditionSource),
  };
};

const makeBlockedComposition = (): ResolvedPatientStateCompositionArtifact => {
  const template = makeTemplate(false);
  const definition: PatientOptionalFeatureModuleDefinition = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-feature.test.applicability-other',
    label: 'Synthetic unsupported other module',
    moduleKind: 'other',
    lifecycle: 'approved',
    medicalReviewStatus: 'approved',
    review: approvedReview,
  };
  const definitionFingerprint = fingerprintOptionalFeatureModuleDefinition(definition);
  const optionalArtifact = findSelectedOptionalArtifact((seed) => ({
    schemaVersion: 1,
    id: 'optional-feature-budget-request.test.applicability-blocked',
    template: structuredClone(template),
    moduleDefinitions: [definition],
    profile: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'optional-feature-profile.test.applicability-blocked',
      modelVersion: 'weighted-optional-feature-budget-selection.v1',
      templateRef: { id: template.id, contentVersion: template.contentVersion },
      templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
      countWeights: [
        { schemaVersion: 1, selectionCount: 0, gameSelectionWeight: 1 },
        { schemaVersion: 1, selectionCount: 1, gameSelectionWeight: 9 },
      ],
      candidateBindings: [
        {
          schemaVersion: 1,
          id: 'optional-feature-binding.test.applicability-other',
          moduleRef: { id: definition.id, contentVersion: definition.contentVersion },
          moduleFingerprint: definitionFingerprint,
          selectedModuleId: 'patient-optional-feature.test.applicability-other',
          cost: 1,
          impact: 'background',
          complexityContributions: [
            {
              id: 'complexity-contribution.test.applicability-other',
              label: 'Synthetic unsupported complexity',
              dimension: 'workup',
              weight: 1,
              review: approvedReview,
            },
          ],
          gameSelectionWeight: 1,
          review: approvedReview,
        },
      ],
      incompatibilities: [],
      review: approvedReview,
    },
    seed,
  }));
  const conditionProfile: TemplateConditionSelectionProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'generation-profile.test.applicability-blocked-conditions',
    modelVersion: 'weighted-template-condition-selection.v1',
    templateRef: { id: template.id, contentVersion: template.contentVersion },
    templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
    groupProfiles: [],
    incompatibilities: [],
  };
  const selectedConditions = selectTemplateConditions({
    schemaVersion: 1,
    id: 'condition-selection-request.test.applicability-blocked',
    template,
    profile: conditionProfile,
    seed: 'seed.d210.blocked-conditions',
  });
  if (!selectedConditions.ok) {
    throw new Error(
      'error' in selectedConditions
        ? selectedConditions.error.message
        : selectedConditions.conflict.code,
    );
  }
  const conditionSource: ResolvedConditionSource = {
    schemaVersion: 1,
    sourceKind: 'template_condition_selection',
    artifact: selectedConditions.value,
  };
  const corePatientState = makeCoreState();
  corePatientState.conditionStates = conditionSource.artifact.conditionStates;
  const composed = composeResolvedPatientState({
    schemaVersion: 1,
    id: 'patient-state-composition-request.test.applicability-blocked',
    corePatientState,
    reactionHistoryOwnership: 'core_locked',
    optionalFeatureArtifact: optionalArtifact,
    conditionSource,
    reactionHistoryBridgeArtifact: null,
    priorTreatmentBridgeArtifact: null,
    exposureBridgeArtifact: null,
  });
  if (!composed.ok) throw new Error(composed.error.message);
  return composed.value;
};

describe('whole-state weighted-finding tendency applicability', () => {
  it('matches required and D-201-selected optional facts without changing complexity accounting', () => {
    const fixture = makeFixture();
    const entries = [
      makeDefinition('required-condition', {
        type: 'fact',
        fact: conditionPresence(requiredDiagnosisId),
      }),
      makeDefinition('optional-condition', {
        type: 'fact',
        fact: conditionPresence(optionalDiagnosisId),
      }),
    ];
    const request = makeRequest(fixture.composition, fixture.backgroundArtifact, entries);
    expect(WeightedFindingTendencyApplicabilityRequestSchema.parse(request)).toBeDefined();

    const result = compileWeightedFindingTendencyApplicability(request);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(WeightedFindingTendencyApplicabilityArtifactSchema.parse(result.value)).toBeDefined();
    expect(result.value.contributorBindings).toHaveLength(2);
    const optionalEvaluation = result.value.evaluations.find(
      (evaluation) => evaluation.definitionRef.id === entries[1]!.definition.id,
    )!;
    const optionalState = fixture.composition.composedPatientState!.conditionStates.find(
      (state) => state.diagnosisDefinitionId === optionalDiagnosisId,
    )!;
    expect(optionalEvaluation.patientPredicateMatched).toBe(true);
    expect(optionalEvaluation.matchedPatientFactBindings[0]!.recordIds).toEqual([optionalState.id]);
    const frozenBudget =
      result.value.applicabilityRequest.patientStateCompositionArtifact.compositionRequest
        .optionalFeatureArtifact;
    expect(frozenBudget.totalSpent).toBe(1);
    expect(frozenBudget.remainingBudget).toBe(0);
    expect(
      result.value.applicabilityRequest.patientStateCompositionArtifact.selectedModuleAudits,
    ).toHaveLength(1);
  });

  it('requires same-record joins and never multiplies one definition by record count', () => {
    const fixture = makeFixture();
    const sertraline = makeDefinition('sertraline-same-record', {
      type: 'same_record_all',
      facts: [
        medicationTrialFact(
          'medication.sertraline',
          'medication-trial.adequacy',
          'trial-adequacy.adequate',
        ),
        medicationTrialFact(
          'medication.sertraline',
          'medication-trial.response',
          'trial-response.none',
        ),
      ],
    });
    const fluoxetine = makeDefinition('fluoxetine-same-record', {
      type: 'same_record_all',
      facts: [
        medicationTrialFact(
          'medication.fluoxetine',
          'medication-trial.adequacy',
          'trial-adequacy.adequate',
        ),
        medicationTrialFact(
          'medication.fluoxetine',
          'medication-trial.response',
          'trial-response.none',
        ),
      ],
    });
    const result = compileWeightedFindingTendencyApplicability(
      makeRequest(fixture.composition, fixture.backgroundArtifact, [sertraline, fluoxetine]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    const byId = new Map(
      result.value.evaluations.map((evaluation) => [evaluation.definitionRef.id, evaluation]),
    );
    expect(byId.get(sertraline.definition.id)?.patientPredicateMatched).toBe(false);
    const matched = byId.get(fluoxetine.definition.id)!;
    expect(matched.patientPredicateMatched).toBe(true);
    expect(matched.matchedPatientFactBindings).toHaveLength(2);
    expect(
      matched.matchedPatientFactBindings.every(
        (binding) => binding.recordIds.join() === 'medication-trial.test.fluoxetine-none',
      ),
    ).toBe(true);
    expect(
      result.value.contributorBindings.filter(
        (binding) => binding.id === matched.contributorBindingId,
      ),
    ).toHaveLength(1);
  });

  it('treats missing known state as a nonmatch rather than converting unassessed to negative', () => {
    const fixture = makeFixture();
    const entry = makeDefinition('reaction-history-known', {
      type: 'fact',
      fact: fact(
        'reaction_history',
        'patient.reaction-history',
        null,
        'reaction-history.status',
        'reaction-history-status.entries_present',
      ),
    });
    const result = compileWeightedFindingTendencyApplicability(
      makeRequest(fixture.composition, fixture.backgroundArtifact, [entry]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.evaluations[0]).toMatchObject({
      patientPredicateMatched: false,
      matchedPatientFactBindings: [],
      contributorBindingId: null,
      applicabilityContributionId: null,
    });
    expect(result.value.contributorBindings).toEqual([]);
  });

  it('pins exact patient-fact versions and audits a background target version mismatch', () => {
    const fixture = makeFixture();
    const wrongFactVersion = makeDefinition('wrong-patient-version', {
      type: 'fact',
      fact: conditionPresence(requiredDiagnosisId, '2.0.0'),
    });
    const targetVersionMismatch = makeDefinition(
      'wrong-target-version',
      {
        type: 'fact',
        fact: fact(
          'demographics',
          'patient.demographics',
          null,
          'demographics.reviewed-age-band',
          'age-band.middle-adult',
        ),
      },
      '2.0.0',
    );
    const result = compileWeightedFindingTendencyApplicability(
      makeRequest(fixture.composition, fixture.backgroundArtifact, [
        wrongFactVersion,
        targetVersionMismatch,
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    const byId = new Map(
      result.value.evaluations.map((evaluation) => [evaluation.definitionRef.id, evaluation]),
    );
    expect(byId.get(wrongFactVersion.definition.id)?.patientPredicateMatched).toBe(false);
    expect(byId.get(targetVersionMismatch.definition.id)).toMatchObject({
      patientPredicateMatched: true,
      target: {
        status: 'unavailable',
        reason: 'content_version_mismatch',
        actualContentVersion: '1.0.0',
      },
      contributorBindingId: null,
    });
  });

  it('keeps semantic scan and exact reverse-index discovery byte-equivalent and order-invariant', () => {
    const fixture = makeFixture();
    const entries = [
      makeDefinition('index-required', {
        type: 'fact',
        fact: conditionPresence(requiredDiagnosisId),
      }),
      makeDefinition('index-optional', {
        type: 'fact',
        fact: conditionPresence(optionalDiagnosisId),
      }),
    ];
    const request = makeRequest(fixture.composition, fixture.backgroundArtifact, entries);
    const reversed: WeightedFindingTendencyApplicabilityRequest = {
      ...request,
      profiles: [...request.profiles].reverse(),
      applicabilityDefinitions: [...request.applicabilityDefinitions].reverse(),
    };
    const scan = compileWeightedFindingTendencyApplicability(request);
    const index = buildWeightedFindingTendencyApplicabilityIndex(reversed.applicabilityDefinitions);
    const indexed = compileWeightedFindingTendencyApplicability(reversed, {
      discoveryStrategy: 'index',
      applicabilityIndex: index,
    });
    expect(scan.ok).toBe(true);
    expect(indexed.ok).toBe(true);
    if (!scan.ok || !indexed.ok) throw new Error('Expected both discovery paths to compile.');
    expect(indexed.value).toEqual(scan.value);
  });

  it('rejects a reverse index from a stale exact definition payload', () => {
    const fixture = makeFixture();
    const original = makeDefinition('stale-index', {
      type: 'fact',
      fact: conditionPresence(requiredDiagnosisId),
    });
    const request = makeRequest(fixture.composition, fixture.backgroundArtifact, [original]);
    const staleIndex = buildWeightedFindingTendencyApplicabilityIndex(
      request.applicabilityDefinitions,
    );
    const changed: WeightedFindingTendencyApplicabilityRequest = {
      ...request,
      applicabilityDefinitions: [
        {
          ...request.applicabilityDefinitions[0]!,
          rationale: 'A different exact reviewed payload with the same ID and predicate.',
        },
      ],
    };
    const result = compileWeightedFindingTendencyApplicability(changed, {
      discoveryStrategy: 'index',
      applicabilityIndex: staleIndex,
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'APPLICABILITY_INDEX_STALE' },
    });
  });

  it('replays deterministically and rejects trace tampering or crossed context', () => {
    const fixture = makeFixture();
    const entry = makeDefinition('replay', {
      type: 'fact',
      fact: conditionPresence(requiredDiagnosisId),
    });
    const request = makeRequest(fixture.composition, fixture.backgroundArtifact, [entry]);
    const first = compileWeightedFindingTendencyApplicability(request);
    const second = compileWeightedFindingTendencyApplicability(structuredClone(request));
    expect(first.ok).toBe(true);
    expect(second).toEqual(first);
    if (!first.ok) throw new Error(first.error.message);
    expect(verifyWeightedFindingTendencyApplicabilityIntegrity(first.value).ok).toBe(true);
    expect(
      verifyWeightedFindingTendencyApplicabilityContext({
        artifact: first.value,
        request,
      }).ok,
    ).toBe(true);

    const tampered = structuredClone(first.value);
    tampered.evaluations[0]!.matchedPatientFactBindings[0]!.recordIds = [
      'condition-state.test.tampered',
    ];
    expect(verifyWeightedFindingTendencyApplicabilityIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const changedContext: WeightedFindingTendencyApplicabilityRequest = {
      ...request,
      applicabilityDefinitions: [
        {
          ...request.applicabilityDefinitions[0]!,
          rationale: 'Changed exact applicability context.',
        },
      ],
    };
    expect(
      verifyWeightedFindingTendencyApplicabilityContext({
        artifact: first.value,
        request: changedContext,
      }),
    ).toMatchObject({ ok: false, error: { code: 'CONTEXT_MISMATCH' } });
    expect(
      fingerprintWeightedFindingTendencyApplicabilityDefinition(
        changedContext.applicabilityDefinitions[0]!,
      ),
    ).not.toBe(first.value.definitionReferences[0]!.fingerprint);
  });

  it('propagates a valid D-208 blocker without fallback, reroll, or budget refund', () => {
    const fixture = makeFixture();
    const blockedComposition = makeBlockedComposition();
    expect(blockedComposition.status).toBe('not_composed');
    expect(blockedComposition.compositionRequest.optionalFeatureArtifact.totalSpent).toBe(1);
    expect(blockedComposition.compositionRequest.optionalFeatureArtifact.remainingBudget).toBe(0);
    const entry = makeDefinition('blocked', {
      type: 'fact',
      fact: conditionPresence(requiredDiagnosisId),
    });
    const result = compileWeightedFindingTendencyApplicability(
      makeRequest(blockedComposition, fixture.backgroundArtifact, [entry]),
    );
    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'PATIENT_STATE_COMPOSITION_BLOCKED',
      },
    });
    if (result.ok) throw new Error('Expected blocked patient-state composition.');
    expect(result.error.contentIds).toEqual(
      expect.arrayContaining([
        blockedComposition.id,
        'optional-feature.test.applicability-other',
        'optional-feature-binding.test.applicability-other',
        'patient-optional-feature.test.applicability-other',
      ]),
    );
  });
});
