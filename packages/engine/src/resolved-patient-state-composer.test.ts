import {
  ConditionClinicalDurationAttachmentArtifactSchema,
  ConditionClinicalDurationAttachmentRequestSchema,
  ResolvedPatientStateCompositionArtifactSchema,
  ResolvedPatientStateCompositionRequestSchema,
  type ClinicalDurationProfile,
  type ClinicalRuleReview,
  type ConditionClinicalDurationResolutionArtifact,
  type ConditionState,
  type OptionalComorbidityBridgeProfile,
  type OptionalExposureBudgetBridgeProfile,
  type OptionalExposureContribution,
  type OptionalExposureReferenceHorizon,
  type OptionalFeatureBudgetSelectionArtifact,
  type OptionalFeatureBudgetSelectionRequest,
  type OptionalPriorTreatmentBridgeProfile,
  type OptionalPriorTreatmentContribution,
  type OptionalPriorTreatmentReferenceHorizon,
  type OptionalReactionHistoryBridgeProfile,
  type OptionalReactionHistoryReferenceHorizon,
  type PatientOptionalFeatureModuleDefinition,
  type PatientReactionHistory,
  type PatientTemplate,
  type PatientTemplateConditionConstraint,
  type ResolvedConditionSource,
  type ResolvedPatientState,
  type ResolvedPatientStateCompositionRequest,
  type TemplateConditionSelectionRequest,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  attachConditionClinicalDurations,
  verifyConditionClinicalDurationAttachmentIntegrity,
} from './condition-clinical-duration-attachment';
import { resolveConditionClinicalDuration } from './clinical-duration-profile-resolver';
import {
  bridgeOptionalComorbiditiesFromBudget,
  fingerprintOptionalComorbidityBridgeProfile,
} from './optional-comorbidity-budget-bridge';
import {
  bridgeOptionalExposureFromBudget,
  fingerprintOptionalExposureBudgetBridgeProfile,
  fingerprintOptionalExposureReferenceHorizon,
} from './optional-exposure-budget-bridge';
import {
  fingerprintOptionalFeatureModuleDefinition,
  selectOptionalFeaturesWithinBudget,
} from './optional-feature-budget-selector';
import {
  bridgeOptionalPriorTreatmentHistoryFromBudget,
  fingerprintOptionalPriorTreatmentBridgeProfile,
  fingerprintOptionalPriorTreatmentReferenceHorizon,
} from './optional-prior-treatment-bridge';
import {
  bridgeOptionalReactionHistoryFromBudget,
  fingerprintOptionalReactionHistoryBridgeProfile,
  fingerprintOptionalReactionHistoryReferenceHorizon,
} from './optional-reaction-history-bridge';
import {
  composeResolvedPatientState,
  verifyResolvedPatientStateCompositionContext,
  verifyResolvedPatientStateCompositionIntegrity,
} from './resolved-patient-state-composer';
import {
  fingerprintTemplateConditionSelectionProfile,
  fingerprintTemplateConditionSelectionTemplate,
} from './template-condition-selector';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-30T02:00:00.000Z',
  sourceUseNoteIds: ['source-use.test.patient-state-composition'],
};

const moduleIds = {
  comorbidity: 'optional-feature.test.composition.comorbidity',
  reaction: 'optional-feature.test.composition.reaction',
  priorTreatment: 'optional-feature.test.composition.prior-treatment',
  exposure: 'optional-feature.test.composition.exposure',
  sourceReport: 'optional-feature.test.composition.source-report',
  other: 'optional-feature.test.composition.other',
} as const;

const requiredCondition = (): PatientTemplateConditionConstraint => ({
  schemaVersion: 1,
  id: 'template-condition.test.composition.focus',
  diagnosisDefinitionId: 'diagnosis.test.composition.focus',
  diagnosisDefinitionContentVersion: '1.0.0',
  clinicalStateId: 'clinical-state.current',
  timeScopeId: 'time-scope.current',
  encounterRelevance: 'focus',
  severityId: null,
  specifierIds: [],
});

const optionalCondition = (): PatientTemplateConditionConstraint => ({
  schemaVersion: 1,
  id: 'template-condition.test.composition.comorbidity',
  diagnosisDefinitionId: 'diagnosis.test.composition.comorbidity',
  diagnosisDefinitionContentVersion: '1.0.0',
  clinicalStateId: 'clinical-state.current',
  timeScopeId: 'time-scope.current',
  encounterRelevance: 'contributing',
  severityId: null,
  specifierIds: [],
});

const makeTemplate = (): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-template.test.patient-state-composition',
  compilationMode: 'attachment_only.v6',
  careSetting: 'outpatient_psychiatry',
  internalLabel: 'Synthetic core-plus-optional patient-state composition fixture',
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
  requiredConditions: [requiredCondition()],
  optionalConditionSelectionGroups: [
    {
      schemaVersion: 1,
      id: 'template-condition-group.test.composition.comorbidities',
      minimumSelections: 0,
      maximumSelections: 1,
      candidates: [optionalCondition()],
    },
  ],
  complexityProfile: {
    modelVersion: 'additional-feature-budget.v1',
    measurementStatus: 'budget_only',
    additionalFeatureBudget: 3,
    maximumSelectedModules: 3,
    selectedModules: [],
    targetEnvelope: null,
  },
  presentationRichnessEnvelope: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'presentation-richness.test.patient-state-composition',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: [
      'diagnostic_attribution',
      'prior_response_or_intolerance',
      'comorbidity_fit',
    ],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const moduleDefinition = (
  id: string,
  moduleKind:
    | 'allergy_reaction'
    | 'prior_treatment'
    | 'comorbidity'
    | 'substance_use'
    | 'source_report'
    | 'other',
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

const definitions = (): PatientOptionalFeatureModuleDefinition[] => [
  moduleDefinition(moduleIds.comorbidity, 'comorbidity'),
  moduleDefinition(moduleIds.reaction, 'allergy_reaction'),
  moduleDefinition(moduleIds.priorTreatment, 'prior_treatment'),
  moduleDefinition(moduleIds.exposure, 'substance_use'),
  moduleDefinition(moduleIds.sourceReport, 'source_report'),
  moduleDefinition(moduleIds.other, 'other'),
];

const makeOptionalFeatureRequest = (seed: string): OptionalFeatureBudgetSelectionRequest => {
  const template = makeTemplate();
  const moduleDefinitions = definitions();
  return {
    schemaVersion: 1,
    id: 'optional-feature-budget-request.test.patient-state-composition',
    template,
    moduleDefinitions,
    profile: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'optional-feature-profile.test.patient-state-composition',
      modelVersion: 'weighted-optional-feature-budget-selection.v1',
      templateRef: { id: template.id, contentVersion: template.contentVersion },
      templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
      countWeights: [0, 1, 2, 3].map((selectionCount) => ({
        schemaVersion: 1 as const,
        selectionCount,
        gameSelectionWeight: 1,
      })),
      candidateBindings: moduleDefinitions.map((definition, index) => ({
        schemaVersion: 1,
        id: `optional-feature-binding.test.composition.${index}`,
        moduleRef: {
          id: definition.id,
          contentVersion: definition.contentVersion,
        },
        moduleFingerprint: fingerprintOptionalFeatureModuleDefinition(definition),
        selectedModuleId: `patient-optional-feature.test.composition.${index}`,
        cost: 1,
        impact:
          definition.moduleKind === 'other'
            ? 'background'
            : definition.moduleKind === 'comorbidity'
              ? 'fit_modifier'
              : 'companion_safety',
        complexityContributions: [
          {
            id: `complexity-contribution.test.composition.${index}`,
            label: `Synthetic composition contribution ${index}`,
            dimension:
              definition.moduleKind === 'comorbidity'
                ? 'diagnostic'
                : definition.moduleKind === 'allergy_reaction'
                  ? 'pharmacologic'
                  : definition.moduleKind === 'prior_treatment'
                    ? 'information'
                    : 'workup',
            weight: 1,
            review: approvedReview,
          },
        ],
        gameSelectionWeight: 1,
        review: approvedReview,
      })),
      incompatibilities: [],
      review: approvedReview,
    },
    seed,
  };
};

const selectedDefinitionIds = (artifact: OptionalFeatureBudgetSelectionArtifact): string[] =>
  artifact.candidateEvaluations
    .filter((evaluation) => evaluation.disposition === 'selected')
    .map((evaluation) => evaluation.moduleRef.id)
    .sort();

const findOptionalArtifact = (
  selectedIds: readonly string[],
): OptionalFeatureBudgetSelectionArtifact => {
  const expected = [...selectedIds].sort().join('\u0000');
  for (let index = 0; index < 20_000; index += 1) {
    const result = selectOptionalFeaturesWithinBudget(
      makeOptionalFeatureRequest(`seed.patient-state-composition.${index}`),
    );
    if (result.ok && selectedDefinitionIds(result.value).join('\u0000') === expected) {
      return result.value;
    }
  }
  throw new Error(`Could not find selected module fixture: ${expected}`);
};

const makeConditionRequest = (
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
): TemplateConditionSelectionRequest => {
  const template = optionalArtifact.selectionRequest.template;
  const profile: TemplateConditionSelectionRequest['profile'] = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'condition-profile.test.patient-state-composition',
    modelVersion: 'weighted-template-condition-selection.v1',
    templateRef: { id: template.id, contentVersion: template.contentVersion },
    templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
    groupProfiles: [
      {
        schemaVersion: 1,
        id: 'condition-profile-group.test.patient-state-composition',
        groupId: 'template-condition-group.test.composition.comorbidities',
        countWeights: [0, 1].map((selectionCount) => ({
          schemaVersion: 1 as const,
          selectionCount,
          gameSelectionWeight: 1,
        })),
        candidateWeights: [
          {
            schemaVersion: 1,
            templateConditionId: optionalCondition().id,
            gameSelectionWeight: 1,
          },
        ],
      },
    ],
    incompatibilities: [],
  };
  return {
    schemaVersion: 1,
    id: 'condition-selection-request.test.patient-state-composition',
    template,
    profile,
    seed: 'condition-seed.test.patient-state-composition',
  };
};

const makeConditionSource = (
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
): ResolvedConditionSource => {
  const conditionRequest = makeConditionRequest(optionalArtifact);
  const binding = optionalArtifact.selectionRequest.profile.candidateBindings.find(
    (candidate) => candidate.moduleRef.id === moduleIds.comorbidity,
  )!;
  const bridgeProfile: OptionalComorbidityBridgeProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-comorbidity-profile.test.patient-state-composition',
    modelVersion: 'optional-comorbidity-condition-bridge.v1',
    templateRef: optionalArtifact.templateRef,
    templateFingerprint: optionalArtifact.templateFingerprint,
    optionalFeatureProfileRef: optionalArtifact.profileRef,
    optionalFeatureProfileFingerprint: optionalArtifact.profileFingerprint,
    conditionProfileRef: {
      id: conditionRequest.profile.id,
      contentVersion: conditionRequest.profile.contentVersion,
    },
    conditionProfileFingerprint: fingerprintTemplateConditionSelectionProfile(
      conditionRequest.profile,
    ),
    mappings: [
      {
        schemaVersion: 1,
        id: 'optional-comorbidity-mapping.test.patient-state-composition',
        moduleRef: binding.moduleRef,
        moduleFingerprint: binding.moduleFingerprint,
        optionalFeatureBindingId: binding.id,
        selectedModuleId: binding.selectedModuleId,
        groupId: 'template-condition-group.test.composition.comorbidities',
        templateConditionId: optionalCondition().id,
        review: approvedReview,
      },
    ],
    review: approvedReview,
  };
  expect(fingerprintOptionalComorbidityBridgeProfile(bridgeProfile)).toMatch(
    /^fingerprint\.optional-comorbidity-bridge\./,
  );
  const result = bridgeOptionalComorbiditiesFromBudget({
    schemaVersion: 1,
    id: 'optional-comorbidity-request.test.patient-state-composition',
    optionalFeatureArtifact: optionalArtifact,
    conditionSelectionRequest: conditionRequest,
    bridgeProfile,
  });
  if (!result.ok) {
    throw new Error('error' in result ? result.error.message : result.conflict.code);
  }
  return {
    schemaVersion: 1,
    sourceKind: 'optional_comorbidity_bridge',
    artifact: result.value,
  };
};

const reactionHistory = (): PatientReactionHistory => ({
  status: 'entries_present',
  medicationAssessmentStatus: 'entries_present',
  records: [
    {
      schemaVersion: 1,
      id: 'patient-reaction.test.composition.haloperidol',
      trigger: {
        kind: 'medication',
        medicationId: 'medication.test.haloperidol',
      },
      recordedAs: 'adverse_reaction',
      manifestationIds: ['reaction-manifestation.test.oculogyric-crisis'],
      reportedSeverity: 'severe',
      interpretedAs: null,
      source: 'outside_record',
      status: 'historical',
    },
  ],
});

const makeReactionBridge = (optionalArtifact: OptionalFeatureBudgetSelectionArtifact) => {
  const referenceHorizon: OptionalReactionHistoryReferenceHorizon = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'reaction-horizon.test.patient-state-composition',
    medicationRefs: [{ id: 'medication.test.haloperidol', contentVersion: '1.0.0' }],
    nonMedicationTriggerRefs: [],
    manifestationRefs: [
      {
        id: 'reaction-manifestation.test.oculogyric-crisis',
        contentVersion: '1.0.0',
      },
    ],
  };
  const binding = optionalArtifact.selectionRequest.profile.candidateBindings.find(
    (candidate) => candidate.moduleRef.id === moduleIds.reaction,
  )!;
  const bridgeProfile: OptionalReactionHistoryBridgeProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-reaction-profile.test.patient-state-composition',
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
    mappings: [
      {
        schemaVersion: 1,
        id: 'optional-reaction-mapping.test.patient-state-composition',
        moduleRef: binding.moduleRef,
        moduleFingerprint: binding.moduleFingerprint,
        optionalFeatureBindingId: binding.id,
        selectedModuleId: binding.selectedModuleId,
        reactionHistory: reactionHistory(),
        review: approvedReview,
      },
    ],
    review: approvedReview,
  };
  expect(fingerprintOptionalReactionHistoryBridgeProfile(bridgeProfile)).toMatch(
    /^fingerprint\.optional-reaction-history-bridge\./,
  );
  const result = bridgeOptionalReactionHistoryFromBudget({
    schemaVersion: 1,
    id: 'optional-reaction-request.test.patient-state-composition',
    optionalFeatureArtifact: optionalArtifact,
    referenceHorizon,
    bridgeProfile,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const priorTreatmentContribution = (): OptionalPriorTreatmentContribution => ({
  medicationTrials: [
    {
      schemaVersion: 1,
      id: 'medication-trial.test.composition.optional-sertraline',
      medicationId: 'medication.test.sertraline',
      exposure: {
        duration: { value: 10, unit: 'week' },
        maximumDose: { amount: 200, unit: 'mg', frequency: 'daily' },
      },
      adequacy: 'adequate',
      adherence: 'consistent',
      response: 'partial',
      tolerability: 'tolerated',
      source: 'outside_record',
      summary: 'A distinct prior sertraline trial supplied by the optional module.',
    },
  ],
  psychotherapyTrials: [
    {
      schemaVersion: 1,
      id: 'psychotherapy-trial.test.composition.cbt',
      interventionId: 'treatment.test.cognitive-behavioral-therapy',
      status: 'completed',
      engagement: 'adequate',
      response: 'partial',
      source: 'patient_report',
      summary: 'A prior course of cognitive behavioral therapy.',
    },
  ],
  currentProviders: [],
  priorLevelsOfCare: [],
});

const makePriorTreatmentBridge = (optionalArtifact: OptionalFeatureBudgetSelectionArtifact) => {
  const contribution = priorTreatmentContribution();
  const referenceHorizon: OptionalPriorTreatmentReferenceHorizon = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'prior-treatment-horizon.test.patient-state-composition',
    medicationRefs: [{ id: 'medication.test.sertraline', contentVersion: '1.0.0' }],
    psychotherapyInterventionRefs: [
      {
        id: 'treatment.test.cognitive-behavioral-therapy',
        contentVersion: '1.0.0',
      },
    ],
  };
  const binding = optionalArtifact.selectionRequest.profile.candidateBindings.find(
    (candidate) => candidate.moduleRef.id === moduleIds.priorTreatment,
  )!;
  const bridgeProfile: OptionalPriorTreatmentBridgeProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-prior-treatment-profile.test.patient-state-composition',
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
    mappings: [
      {
        schemaVersion: 1,
        id: 'optional-prior-treatment-mapping.test.patient-state-composition',
        moduleRef: binding.moduleRef,
        moduleFingerprint: binding.moduleFingerprint,
        optionalFeatureBindingId: binding.id,
        selectedModuleId: binding.selectedModuleId,
        contribution,
        review: approvedReview,
      },
    ],
    review: approvedReview,
  };
  expect(fingerprintOptionalPriorTreatmentBridgeProfile(bridgeProfile)).toMatch(
    /^fingerprint\.optional-prior-treatment-bridge\./,
  );
  const result = bridgeOptionalPriorTreatmentHistoryFromBudget({
    schemaVersion: 1,
    id: 'optional-prior-treatment-request.test.patient-state-composition',
    optionalFeatureArtifact: optionalArtifact,
    referenceHorizon,
    bridgeProfile,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const exposureContribution = (): OptionalExposureContribution => ({
  useEntrySpecifications: [
    {
      schemaVersion: 1,
      id: 'exposure-use-entry.test.composition.alcohol',
      agent: {
        kind: 'other_substance',
        identityId: 'other-substance.test.alcohol',
        identityContentVersion: '1.0.0',
      },
      mostRecentUse: { kind: 'current' },
      currentAmount: {
        quantity: 2,
        unitLabel: 'standard drinks',
        frequencyLabel: 'weekly',
      },
      prescriptionRelationship: 'not_applicable',
      misuseTruth: false,
    },
  ],
});

const makeExposureBridge = (optionalArtifact: OptionalFeatureBudgetSelectionArtifact) => {
  const contribution = exposureContribution();
  const referenceHorizon: OptionalExposureReferenceHorizon = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'exposure-horizon.test.patient-state-composition',
    agentRefs: [contribution.useEntrySpecifications[0]!.agent],
  };
  const binding = optionalArtifact.selectionRequest.profile.candidateBindings.find(
    (candidate) => candidate.moduleRef.id === moduleIds.exposure,
  )!;
  const bridgeProfile: OptionalExposureBudgetBridgeProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-exposure-profile.test.patient-state-composition',
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
    mappings: [
      {
        schemaVersion: 1,
        id: 'optional-exposure-mapping.test.patient-state-composition',
        moduleRef: binding.moduleRef,
        moduleFingerprint: binding.moduleFingerprint,
        optionalFeatureBindingId: binding.id,
        selectedModuleId: binding.selectedModuleId,
        contribution,
        review: approvedReview,
      },
    ],
    review: approvedReview,
  };
  expect(fingerprintOptionalExposureBudgetBridgeProfile(bridgeProfile)).toMatch(
    /^fingerprint\.optional-exposure-budget-bridge\./,
  );
  const result = bridgeOptionalExposureFromBudget({
    schemaVersion: 1,
    id: 'optional-exposure-request.test.patient-state-composition',
    optionalFeatureArtifact: optionalArtifact,
    referenceHorizon,
    bridgeProfile,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const makeCoreState = (conditionSource: ResolvedConditionSource): ResolvedPatientState => {
  const requiredIds = new Set(
    conditionSource.artifact.conditionBindings
      .filter((binding) => binding.kind === 'required')
      .map((binding) => binding.conditionStateId),
  );
  return {
    schemaVersion: 1,
    id: 'resolved-patient-state.test.composition.core',
    demographics: {
      recordVersion: 2,
      ageYears: 46,
      reviewedAgeBandId: 'age-band.middle-adult',
      sexForReference: 'female',
    },
    conditionStates: conditionSource.artifact.conditionStates.filter((state) =>
      requiredIds.has(state.id),
    ),
    diagnosisRecordEntries: [],
    medicationRegimenEntries: [],
    exposureInventory: {
      schemaVersion: 1,
      id: 'resolved-exposure-inventory.test.composition.core',
      useEntries: [
        {
          schemaVersion: 1,
          id: 'exposure-use-entry.test.composition.caffeine',
          agent: {
            kind: 'other_substance',
            identityId: 'other-substance.test.caffeine',
            identityContentVersion: '1.0.0',
          },
          mostRecentUse: { kind: 'current' },
          currentAmount: {
            quantity: 2,
            unitLabel: 'cups',
            frequencyLabel: 'daily',
          },
          prescriptionRelationship: 'not_applicable',
          misuseTruth: false,
          resolution: {
            origin: 'authored',
            ownerId: 'patient-template.test.patient-state-composition',
            ownerContentVersion: '1.0.0',
          },
        },
      ],
    },
    treatmentHistory: {
      medicationTrials: [
        {
          schemaVersion: 1,
          id: 'medication-trial.test.composition.core-sertraline',
          medicationId: 'medication.test.sertraline',
          exposure: {
            duration: { value: 4, unit: 'week' },
            maximumDose: { amount: 50, unit: 'mg', frequency: 'daily' },
          },
          adequacy: 'inadequate',
          adherence: 'consistent',
          response: 'unknown',
          tolerability: 'tolerated',
          source: 'patient_report',
          summary: 'A distinct short prior sertraline trial in required core history.',
        },
      ],
      psychotherapyTrials: [],
      currentProviders: [],
      priorLevelsOfCare: [],
    },
    medicationTolerabilityFindings: [],
    reactionHistory: {
      status: 'documented_none',
      medicationAssessmentStatus: 'documented_none',
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
      id: 'resolved-proposition-state.test.composition.core',
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    clinicalTagIds: ['clinical-tag.test.two', 'clinical-tag.test.one'],
    reportedSafetyPlanningAbility: 'unassessed',
  };
};

interface Scenario {
  readonly request: ResolvedPatientStateCompositionRequest;
}

const makeScenario = (selectedIds: readonly string[]): Scenario => {
  const optionalFeatureArtifact = findOptionalArtifact(selectedIds);
  const conditionSource = makeConditionSource(optionalFeatureArtifact);
  return {
    request: {
      schemaVersion: 1,
      id: 'patient-state-composition-request.test.synthetic',
      corePatientState: makeCoreState(conditionSource),
      reactionHistoryOwnership: 'optional_alternative_default',
      optionalFeatureArtifact,
      conditionSource,
      reactionHistoryBridgeArtifact: makeReactionBridge(optionalFeatureArtifact),
      priorTreatmentBridgeArtifact: makePriorTreatmentBridge(optionalFeatureArtifact),
      exposureBridgeArtifact: makeExposureBridge(optionalFeatureArtifact),
      findingTextureBridgeArtifact: null,
    },
  };
};

const expectComposition = (request: unknown) => {
  const result = composeResolvedPatientState(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('resolved patient-state composer', () => {
  it('retains the complete core default when D-201 selects zero modules', () => {
    const { request } = makeScenario([]);
    expect(ResolvedPatientStateCompositionRequestSchema.parse(request)).toEqual(request);
    const before = JSON.stringify(request);
    const artifact = expectComposition(request);

    expect(JSON.stringify(request)).toBe(before);
    expect(ResolvedPatientStateCompositionArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.status).toBe('composed');
    expect(artifact.selectedModuleAudits).toEqual([]);
    expect(artifact.compositionRequest.optionalFeatureArtifact.totalSpent).toBe(0);
    expect(artifact.compositionRequest.optionalFeatureArtifact.remainingBudget).toBe(3);
    expect(artifact.composedPatientState!.reactionHistory).toEqual(
      request.corePatientState.reactionHistory,
    );
    expect(artifact.composedPatientState!.treatmentHistory).toEqual(
      request.corePatientState.treatmentHistory,
    );
    expect(artifact.composedPatientState!.exposureInventory).toEqual(
      request.corePatientState.exposureInventory,
    );
    expect(artifact.coverageDiagnostics).toEqual([
      {
        schemaVersion: 1,
        code: 'unsupported_other_candidate',
        moduleDefinitionId: moduleIds.other,
        selected: false,
        blocking: false,
      },
    ]);
    expect(verifyResolvedPatientStateCompositionIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(verifyResolvedPatientStateCompositionContext({ artifact, request })).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('composes condition, prior-treatment, and exposure modules under one exact budget', () => {
    const { request } = makeScenario([
      moduleIds.comorbidity,
      moduleIds.priorTreatment,
      moduleIds.exposure,
    ]);
    const artifact = expectComposition(request);
    const state = artifact.composedPatientState!;

    expect(state.conditionStates).toHaveLength(2);
    expect(state.conditionStates).toEqual(
      [...request.conditionSource.artifact.conditionStates].sort((left, right) =>
        left.id.localeCompare(right.id),
      ),
    );
    expect(state.treatmentHistory.medicationTrials).toHaveLength(2);
    expect(state.treatmentHistory.medicationTrials.map((trial) => trial.medicationId)).toEqual([
      'medication.test.sertraline',
      'medication.test.sertraline',
    ]);
    expect(state.treatmentHistory.psychotherapyTrials).toHaveLength(1);
    expect(state.exposureInventory.useEntries).toHaveLength(2);
    expect(request.optionalFeatureArtifact.totalSpent).toBe(3);
    expect(request.optionalFeatureArtifact.remainingBudget).toBe(0);
    expect(artifact.selectedModuleAudits).toHaveLength(3);
    expect(artifact.selectedModuleAudits.map((audit) => audit.cost)).toEqual([1, 1, 1]);
    expect(artifact.selectedModuleAudits.map((audit) => audit.selectionOrdinal)).toEqual([0, 1, 2]);
    expect(artifact.selectedModuleAudits.at(-1)?.remainingBudgetAfter).toBe(0);
  });

  it('replaces a deliberate core reaction default while other selected lanes remain additive', () => {
    const { request } = makeScenario([
      moduleIds.reaction,
      moduleIds.priorTreatment,
      moduleIds.exposure,
    ]);
    const artifact = expectComposition(request);
    const state = artifact.composedPatientState!;

    expect(request.corePatientState.reactionHistory.status).toBe('documented_none');
    expect(state.reactionHistory).toEqual(reactionHistory());
    expect(state.treatmentHistory.medicationTrials).toHaveLength(2);
    expect(state.exposureInventory.useEntries).toHaveLength(2);
    expect(
      artifact.selectedModuleAudits.find((audit) => audit.moduleDefinitionId === moduleIds.reaction)
        ?.materializedRecordIds,
    ).toEqual(['patient-reaction.test.composition.haloperidol']);
  });

  it('keeps a selected unowned other module auditable without composing or rerolling it', () => {
    const { request } = makeScenario([moduleIds.other]);
    const artifact = expectComposition(request);

    expect(artifact.status).toBe('not_composed');
    expect(artifact.composedPatientState).toBeNull();
    expect(artifact.composedPatientStateFingerprint).toBeNull();
    expect(artifact.blockers).toEqual([
      {
        kind: 'unsupported_selected_module',
        moduleDefinitionId: moduleIds.other,
        bindingId: request.optionalFeatureArtifact.candidateEvaluations.find(
          (evaluation) => evaluation.moduleRef.id === moduleIds.other,
        )!.bindingId,
        selectedModuleId: request.optionalFeatureArtifact.candidateEvaluations.find(
          (evaluation) => evaluation.moduleRef.id === moduleIds.other,
        )!.moduleSnapshot.id,
      },
    ]);
    expect(artifact.compositionRequest.optionalFeatureArtifact.totalSpent).toBe(1);
    expect(artifact.compositionRequest.optionalFeatureArtifact.remainingBudget).toBe(2);
    expect(artifact.selectedModuleAudits[0]).toMatchObject({
      moduleKind: 'other',
      ownerKind: 'unowned_other',
      materializationStatus: 'unsupported',
      materializedRecordIds: [],
    });
  });

  it('preserves one selected source-report modifier for post-truth projection without changing truth', () => {
    const { request } = makeScenario([moduleIds.sourceReport]);
    const coreState = structuredClone(request.corePatientState);
    const artifact = expectComposition(request);

    expect(artifact.status).toBe('composed');
    expect({
      ...artifact.composedPatientState,
      id: coreState.id,
      clinicalTagIds: coreState.clinicalTagIds,
    }).toEqual(coreState);
    expect(artifact.blockers).toEqual([]);
    expect(artifact.compositionRequest.optionalFeatureArtifact.totalSpent).toBe(1);
    expect(artifact.compositionRequest.optionalFeatureArtifact.remainingBudget).toBe(2);
    expect(artifact.selectedModuleAudits).toEqual([
      expect.objectContaining({
        moduleDefinitionId: moduleIds.sourceReport,
        moduleKind: 'source_report',
        ownerKind: 'source_report_selection',
        materializationStatus: 'deferred_to_post_truth',
        materializedRecordIds: [],
        cost: 1,
      }),
    ]);
    expect(verifyResolvedPatientStateCompositionIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('rejects core and optional record collisions rather than deduplicating them', () => {
    const { request } = makeScenario([moduleIds.priorTreatment]);
    request.corePatientState.treatmentHistory.medicationTrials[0] = {
      ...request.corePatientState.treatmentHistory.medicationTrials[0]!,
      id: 'medication-trial.test.composition.optional-sertraline',
    };
    const result = composeResolvedPatientState(request);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected a collision failure.');
    expect(result.error.code).toBe('INVALID_OUTPUT');
    expect(result.error.message).toContain('medicationTrials IDs must be unique');
  });

  it('rejects a semantic exposure-agent collision even when content versions differ', () => {
    const { request } = makeScenario([moduleIds.exposure]);
    request.corePatientState.exposureInventory.useEntries[0] = {
      ...request.corePatientState.exposureInventory.useEntries[0]!,
      agent: {
        kind: 'other_substance',
        identityId: 'other-substance.test.alcohol',
        identityContentVersion: '9.9.9',
      },
    };
    const result = composeResolvedPatientState(request);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected a semantic-agent collision failure.');
    expect(result.error.code).toBe('INVALID_OUTPUT');
    expect(result.error.message).toContain('at most one summary per agent');
  });

  it('rejects crossed D-201 bridge and condition-source contexts', () => {
    const first = makeScenario([moduleIds.priorTreatment]);
    const second = makeScenario([moduleIds.exposure]);
    const crossedBridge = structuredClone(first.request);
    crossedBridge.priorTreatmentBridgeArtifact = second.request.priorTreatmentBridgeArtifact;
    const bridgeResult = composeResolvedPatientState(crossedBridge);
    expect(bridgeResult.ok).toBe(false);
    if (bridgeResult.ok) throw new Error('Expected crossed bridge rejection.');
    expect(bridgeResult.error.code).toBe('OPTIONAL_FEATURE_CONTEXT_MISMATCH');

    const crossedSource = structuredClone(first.request);
    crossedSource.conditionSource = second.request.conditionSource;
    const sourceResult = composeResolvedPatientState(crossedSource);
    expect(sourceResult.ok).toBe(false);
    if (sourceResult.ok) throw new Error('Expected crossed condition-source rejection.');
    expect(sourceResult.error.code).toBe('CONDITION_SOURCE_CONTEXT_MISMATCH');
  });

  it('rejects core condition state that is not the exact required-source subset', () => {
    const { request } = makeScenario([]);
    request.corePatientState.conditionStates[0] = {
      ...request.corePatientState.conditionStates[0]!,
      clinicalStateId: 'clinical-state.test.changed',
    };
    const result = composeResolvedPatientState(request);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected core/source condition mismatch.');
    expect(result.error.code).toBe('CORE_CONDITION_STATE_MISMATCH');
  });

  it('normalizes core set ordering and deterministically detects output and context tampering', () => {
    const { request } = makeScenario([moduleIds.priorTreatment]);
    const reordered = structuredClone(request);
    reordered.corePatientState.clinicalTagIds.reverse();
    const first = expectComposition(request);
    const second = expectComposition(reordered);
    expect(second).toEqual(first);

    const tampered = structuredClone(first);
    tampered.composedPatientState!.demographics.ageYears += 1;
    expect(verifyResolvedPatientStateCompositionIntegrity(tampered)).toMatchObject({
      ok: false,
    });

    const changedContext = structuredClone(request);
    changedContext.corePatientState.reportedSafetyPlanningAbility = 'reports_able';
    expect(
      verifyResolvedPatientStateCompositionContext({
        artifact: first,
        request: changedContext,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });
});

const makeDurationProfile = (
  condition: ConditionState,
  profileSuffix: string,
): ClinicalDurationProfile => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: `duration-profile.test.attachment.${profileSuffix}`,
  relatedDiagnosisId: condition.diagnosisDefinitionId,
  interpretation: 'supports_authored_state',
  criterionId: null,
  options: [
    {
      id: `duration-option.test.attachment.${profileSuffix}.two-weeks`,
      value: 2,
      unit: 'week',
      displayValueVariants: ['two weeks'],
    },
    {
      id: `duration-option.test.attachment.${profileSuffix}.eight-weeks`,
      value: 8,
      unit: 'week',
      displayValueVariants: ['eight weeks'],
    },
  ],
  developerOpinionIds: ['developer-opinion.test.duration-attachment'],
  review: approvedReview,
});

const expectDurationResolution = (input: {
  readonly patientStateId: string;
  readonly condition: ConditionState;
  readonly profileSuffix: string;
  readonly requestSuffix: string;
  readonly seed: string;
}): ConditionClinicalDurationResolutionArtifact => {
  const result = resolveConditionClinicalDuration({
    schemaVersion: 1,
    id: `condition-duration-request.test.attachment.${input.requestSuffix}`,
    patientStateId: input.patientStateId,
    conditionState: structuredClone(input.condition),
    profile: makeDurationProfile(input.condition, input.profileSuffix),
    source: {
      kind: 'patient_report',
      sourceInstanceId: `source-instance.patient.test.attachment.${input.requestSuffix}`,
    },
    timeScopeId: input.condition.timeScopeId,
    seed: input.seed,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const expectDurationAttachment = (
  patientStateCompositionArtifact: ReturnType<typeof expectComposition>,
  durationResolutionArtifacts: readonly ConditionClinicalDurationResolutionArtifact[],
) => {
  const result = attachConditionClinicalDurations({
    schemaVersion: 1,
    id: 'condition-duration-attachment-request.test',
    patientStateCompositionArtifact,
    durationResolutionArtifacts,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('D-264 post-composition condition-duration attachment', () => {
  it('preserves the exact D-208 state when there are no duration resolutions', () => {
    const composition = expectComposition(makeScenario([]).request);
    const before = JSON.stringify(composition);
    const attachment = expectDurationAttachment(composition, []);

    expect(JSON.stringify(composition)).toBe(before);
    expect(
      ConditionClinicalDurationAttachmentRequestSchema.parse(attachment.attachmentRequest),
    ).toEqual(attachment.attachmentRequest);
    expect(ConditionClinicalDurationAttachmentArtifactSchema.parse(attachment)).toEqual(attachment);
    expect(attachment.composedPatientState).toEqual(composition.composedPatientState);
    expect(attachment.durationResolutionRefs).toEqual([]);
    expect(attachment.attachedDurationIds).toEqual([]);
    expect(verifyConditionClinicalDurationAttachmentIntegrity(attachment)).toEqual({
      ok: true,
      value: attachment,
    });
  });

  it('attaches one genuine D-263 result without another draw or complexity charge', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const resolution = expectDurationResolution({
      patientStateId: baseState.id,
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'focus-current',
      requestSuffix: 'focus-current',
      seed: 'seed.test.duration-attachment.focus',
    });
    const attachment = expectDurationAttachment(composition, [resolution]);

    expect(attachment.composedPatientState.id).not.toBe(baseState.id);
    expect(attachment.composedPatientState.clinicalDurations).toEqual([
      resolution.resolvedDuration,
    ]);
    expect(attachment.durationResolutionRefs).toEqual([
      {
        id: resolution.id,
        payloadFingerprint: resolution.payloadFingerprint,
        patientStateId: baseState.id,
        conditionStateId: resolution.conditionStateId,
        profileRef: resolution.profileRef,
        resolvedDurationId: resolution.resolvedDuration.id,
      },
    ]);
    expect(
      attachment.attachmentRequest.patientStateCompositionArtifact.compositionRequest
        .optionalFeatureArtifact.totalSpent,
    ).toBe(composition.compositionRequest.optionalFeatureArtifact.totalSpent);
    expect(
      attachment.attachmentRequest.patientStateCompositionArtifact.compositionRequest
        .optionalFeatureArtifact.selectionDraws,
    ).toEqual(composition.compositionRequest.optionalFeatureArtifact.selectionDraws);
  });

  it('normalizes multiple exact condition/profile attachments without losing their targets', () => {
    const composition = expectComposition(makeScenario([moduleIds.comorbidity]).request);
    const baseState = composition.composedPatientState!;
    expect(baseState.conditionStates).toHaveLength(2);
    const resolutions = baseState.conditionStates.map((condition, index) =>
      expectDurationResolution({
        patientStateId: baseState.id,
        condition,
        profileSuffix: index === 0 ? 'condition-a' : 'condition-b',
        requestSuffix: index === 0 ? 'condition-a' : 'condition-b',
        seed: `seed.test.duration-attachment.condition-${index}`,
      }),
    );
    const forward = expectDurationAttachment(composition, resolutions);
    const reversed = expectDurationAttachment(composition, [...resolutions].reverse());

    expect(reversed).toEqual(forward);
    expect(forward.composedPatientState.clinicalDurations).toHaveLength(2);
    expect(
      forward.composedPatientState.clinicalDurations
        .map((duration) =>
          duration.target.kind === 'condition_state' ? duration.target.conditionStateId : null,
        )
        .sort(),
    ).toEqual(
      [...baseState.conditionStates]
        .sort((left, right) => left.id.localeCompare(right.id))
        .map((condition) => condition.id),
    );
  });

  it('rejects crossed patient and condition coordinates plus non-composed D-208 state', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const wrongPatient = expectDurationResolution({
      patientStateId: 'resolved-patient-state.test.other',
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'wrong-patient',
      requestSuffix: 'wrong-patient',
      seed: 'seed.test.duration-attachment.wrong-patient',
    });
    expect(
      attachConditionClinicalDurations({
        schemaVersion: 1,
        id: 'condition-duration-attachment-request.test.wrong-patient',
        patientStateCompositionArtifact: composition,
        durationResolutionArtifacts: [wrongPatient],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_CONTEXT_MISMATCH' },
    });

    const changedCondition = {
      ...baseState.conditionStates[0]!,
      clinicalStateId: 'clinical-state.test.changed',
    };
    const wrongCondition = expectDurationResolution({
      patientStateId: baseState.id,
      condition: changedCondition,
      profileSuffix: 'wrong-condition',
      requestSuffix: 'wrong-condition',
      seed: 'seed.test.duration-attachment.wrong-condition',
    });
    expect(
      attachConditionClinicalDurations({
        schemaVersion: 1,
        id: 'condition-duration-attachment-request.test.wrong-condition',
        patientStateCompositionArtifact: composition,
        durationResolutionArtifacts: [wrongCondition],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONDITION_CONTEXT_MISMATCH' },
    });

    const notComposed = expectComposition(makeScenario([moduleIds.other]).request);
    expect(
      attachConditionClinicalDurations({
        schemaVersion: 1,
        id: 'condition-duration-attachment-request.test.not-composed',
        patientStateCompositionArtifact: notComposed,
        durationResolutionArtifacts: [],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_NOT_COMPOSED' },
    });
  });

  it('rejects duplicate assignments and replacement of an existing condition/profile duration', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const first = expectDurationResolution({
      patientStateId: baseState.id,
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'duplicate',
      requestSuffix: 'duplicate-a',
      seed: 'seed.test.duration-attachment.duplicate-a',
    });
    const second = expectDurationResolution({
      patientStateId: baseState.id,
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'duplicate',
      requestSuffix: 'duplicate-b',
      seed: 'seed.test.duration-attachment.duplicate-b',
    });
    expect(
      attachConditionClinicalDurations({
        schemaVersion: 1,
        id: 'condition-duration-attachment-request.test.duplicate',
        patientStateCompositionArtifact: composition,
        durationResolutionArtifacts: [first, second],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const scenarioWithDuration = makeScenario([]);
    const coreState = scenarioWithDuration.request.corePatientState;
    const coreResolution = expectDurationResolution({
      patientStateId: coreState.id,
      condition: coreState.conditionStates[0]!,
      profileSuffix: 'existing',
      requestSuffix: 'existing-core',
      seed: 'seed.test.duration-attachment.existing-core',
    });
    coreState.clinicalDurations = [coreResolution.resolvedDuration];
    const compositionWithDuration = expectComposition(scenarioWithDuration.request);
    const composedState = compositionWithDuration.composedPatientState!;
    const replacement = expectDurationResolution({
      patientStateId: composedState.id,
      condition: composedState.conditionStates[0]!,
      profileSuffix: 'existing',
      requestSuffix: 'existing-replacement',
      seed: 'seed.test.duration-attachment.existing-replacement',
    });
    expect(
      attachConditionClinicalDurations({
        schemaVersion: 1,
        id: 'condition-duration-attachment-request.test.existing',
        patientStateCompositionArtifact: compositionWithDuration,
        durationResolutionArtifacts: [replacement],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'DURATION_ASSIGNMENT_COLLISION' },
    });
  });

  it('verifies both upstream artifacts and detects attachment replay tampering', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const resolution = expectDurationResolution({
      patientStateId: baseState.id,
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'integrity',
      requestSuffix: 'integrity',
      seed: 'seed.test.duration-attachment.integrity',
    });

    const crossedComposition = structuredClone(composition);
    crossedComposition.compositionRequest.corePatientState.demographics.ageYears += 1;
    expect(
      attachConditionClinicalDurations({
        schemaVersion: 1,
        id: 'condition-duration-attachment-request.test.invalid-composition',
        patientStateCompositionArtifact: crossedComposition,
        durationResolutionArtifacts: [resolution],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_COMPOSITION_INVALID' },
    });

    const crossedResolution = structuredClone(resolution);
    crossedResolution.compileRequest.seed = 'seed.test.duration-attachment.changed';
    expect(
      attachConditionClinicalDurations({
        schemaVersion: 1,
        id: 'condition-duration-attachment-request.test.invalid-resolution',
        patientStateCompositionArtifact: composition,
        durationResolutionArtifacts: [crossedResolution],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'DURATION_RESOLUTION_INVALID' },
    });

    const attachment = expectDurationAttachment(composition, [resolution]);
    const tampered = structuredClone(attachment);
    tampered.inputFingerprint =
      'fingerprint.condition-clinical-duration-attachment.input.fnv1a64.0000000000000000';
    expect(verifyConditionClinicalDurationAttachmentIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'INPUT_FINGERPRINT_MISMATCH' },
    });
  });
});
