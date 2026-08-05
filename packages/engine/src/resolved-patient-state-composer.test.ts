import {
  BodyMassIndexDerivationDefinitionSchema,
  ConditionClinicalDurationAttachmentArtifactSchema,
  ConditionClinicalDurationAttachmentRequestSchema,
  ConditionClinicalDurationSourceValidationArtifactSchema,
  ConditionFunctionalImpairmentAttachmentArtifactSchema,
  ConditionFunctionalImpairmentAttachmentRequestSchema,
  ConditionFunctionalImpairmentSourceValidationArtifactSchema,
  FrozenConditionFunctionalImpairmentProjectionSchema,
  MeasurementDefinitionSchema,
  PatientClinicalResultAttachmentArtifactSchema,
  PatientOwnedMeasurementValueProfileSchema,
  PatientSceneSourceDefinitionCatalogSchema,
  PostCompositionPatientStateAssemblyArtifactSchema,
  ResolvedPatientStateCompositionArtifactSchema,
  ResolvedPatientStateCompositionRequestSchema,
  ResolvedPatientStateSourceValidationArtifactSchema,
  type ClinicalDurationProfile,
  type ClinicalRuleReview,
  type ConditionClinicalDurationResolutionArtifact,
  type ConditionFunctionalImpairmentProfile,
  type ConditionFunctionalImpairmentResolutionArtifact,
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
  type PatientSceneSourceInstanceDefinition,
  type PatientStateScopedSource,
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
import {
  validateConditionClinicalDurationSources,
  verifyConditionClinicalDurationSourceValidationIntegrity,
} from './condition-clinical-duration-source-validation';
import { resolveConditionClinicalDuration } from './clinical-duration-profile-resolver';
import {
  attachConditionFunctionalImpairments,
  verifyConditionFunctionalImpairmentAttachmentIntegrity,
} from './condition-functional-impairment-attachment';
import {
  projectConditionFunctionalImpairmentAttachment,
  verifyConditionFunctionalImpairmentProjection,
} from './condition-functional-impairment-projection';
import { resolveConditionFunctionalImpairment } from './condition-functional-impairment-profile-resolver';
import {
  validateConditionFunctionalImpairmentSources,
  verifyConditionFunctionalImpairmentSourceValidationIntegrity,
} from './condition-functional-impairment-source-validation';
import {
  attachPatientClinicalResults,
  verifyPatientClinicalResultAttachmentIntegrity,
} from './patient-clinical-result-attachment';
import { compileBodyMassIndexDerivation } from './body-mass-index-derivation-compiler';
import { materializeBodyMassIndexMeasurement } from './body-mass-index-measurement-materializer';
import { compilePatientClinicalResultCollection } from './patient-clinical-result-collection-compiler';
import { compilePatientOwnedMeasurement } from './patient-owned-measurement-compiler';
import { compileTestPatientTemplateClinicalResultRecipe } from './patient-template-clinical-result-recipe-test-fixture';
import {
  assemblePostCompositionPatientState,
  verifyPostCompositionPatientStateAssemblyIntegrity,
} from './post-composition-patient-state-assembler';
import { compilePatientSceneSourceInstancesFromCatalog } from './catalog-patient-scene-source-instance-compiler';
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
import {
  compilePatientSceneSourceInstances,
  derivePatientSceneSourceInstanceId,
} from './patient-scene-source-instance-compiler';
import {
  validateResolvedPatientStateSources,
  verifyResolvedPatientStateSourceValidationIntegrity,
} from './resolved-patient-state-source-validation';

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
    currentMedicationReportedBenefits: [],
    currentMedicationDosePositions: [],
    medicationChangeTemporalRelationships: [],
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
    functionalImpairments: [],
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
  readonly source?: PatientStateScopedSource;
}): ConditionClinicalDurationResolutionArtifact => {
  const result = resolveConditionClinicalDuration({
    schemaVersion: 1,
    id: `condition-duration-request.test.attachment.${input.requestSuffix}`,
    patientStateId: input.patientStateId,
    conditionState: structuredClone(input.condition),
    profile: makeDurationProfile(input.condition, input.profileSuffix),
    source: input.source ?? {
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

const makeFunctionalImpairmentProfile = (
  condition: ConditionState,
  profileSuffix: string,
): ConditionFunctionalImpairmentProfile => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: `functional-impairment-profile.test.attachment.${profileSuffix}`,
  relatedDiagnosisId: condition.diagnosisDefinitionId,
  options: [
    {
      id: `functional-impairment-option.test.attachment.${profileSuffix}.none`,
      level: 'none',
    },
    {
      id: `functional-impairment-option.test.attachment.${profileSuffix}.moderate`,
      level: 'moderate',
    },
  ],
  developerOpinionIds: ['developer-opinion.test.functional-impairment-attachment'],
  review: approvedReview,
});

const expectFunctionalImpairmentResolution = (input: {
  readonly patientStateId: string;
  readonly condition: ConditionState;
  readonly profileSuffix: string;
  readonly requestSuffix: string;
  readonly seed: string;
  readonly source?: PatientStateScopedSource;
}): ConditionFunctionalImpairmentResolutionArtifact => {
  const result = resolveConditionFunctionalImpairment({
    schemaVersion: 1,
    id: `condition-functional-impairment-request.test.attachment.${input.requestSuffix}`,
    patientStateId: input.patientStateId,
    conditionState: structuredClone(input.condition),
    profile: makeFunctionalImpairmentProfile(input.condition, input.profileSuffix),
    source: input.source ?? {
      kind: 'patient_report',
      sourceInstanceId: `source-instance.patient.test.functional-impairment.${input.requestSuffix}`,
    },
    timeScopeId: input.condition.timeScopeId,
    seed: input.seed,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const expectFunctionalImpairmentAttachment = (
  patientStateCompositionArtifact: ReturnType<typeof expectComposition>,
  functionalImpairmentResolutionArtifacts: readonly ConditionFunctionalImpairmentResolutionArtifact[],
) => {
  const result = attachConditionFunctionalImpairments({
    schemaVersion: 1,
    id: 'condition-functional-impairment-attachment-request.test',
    patientStateCompositionArtifact,
    functionalImpairmentResolutionArtifacts,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const expectFunctionalImpairmentProjection = (
  attachment: ReturnType<typeof expectFunctionalImpairmentAttachment>,
) => {
  const result = projectConditionFunctionalImpairmentAttachment(attachment);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const expectPatientSceneSourceHorizon = (
  patientStateId: string,
  definitions: readonly {
    readonly schemaVersion: 1;
    readonly contentVersion: string;
    readonly id: string;
    readonly kind: PatientStateScopedSource['kind'];
  }[],
) => {
  const result = compilePatientSceneSourceInstances({
    schemaVersion: 1,
    id: 'patient-scene-source-instance-request.test.functional-impairment',
    patientStateId,
    definitions,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('D-289 post-composition condition-functional-impairment attachment', () => {
  it('binds an empty exact collection without mutating the D-208 composition', () => {
    const composition = expectComposition(makeScenario([]).request);
    const before = JSON.stringify(composition);
    const attachment = expectFunctionalImpairmentAttachment(composition, []);

    expect(JSON.stringify(composition)).toBe(before);
    expect(
      ConditionFunctionalImpairmentAttachmentRequestSchema.parse(attachment.attachmentRequest),
    ).toEqual(attachment.attachmentRequest);
    expect(ConditionFunctionalImpairmentAttachmentArtifactSchema.parse(attachment)).toEqual(
      attachment,
    );
    expect(attachment.basePatientStateRef.id).toBe(composition.composedPatientState?.id);
    expect(attachment.functionalImpairmentResolutionRefs).toEqual([]);
    expect(attachment.attachedFunctionalImpairments).toEqual([]);
    expect(verifyConditionFunctionalImpairmentAttachmentIntegrity(attachment)).toEqual({
      ok: true,
      value: attachment,
    });
  });

  it('attaches one genuine D-267 result without another draw or complexity charge', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const resolution = expectFunctionalImpairmentResolution({
      patientStateId: baseState.id,
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'focus-current',
      requestSuffix: 'focus-current',
      seed: 'seed.test.functional-impairment-attachment.focus',
    });
    const attachment = expectFunctionalImpairmentAttachment(composition, [resolution]);

    expect(attachment.attachedFunctionalImpairments).toEqual([
      resolution.resolvedFunctionalImpairment,
    ]);
    expect(attachment.functionalImpairmentResolutionRefs).toEqual([
      {
        id: resolution.id,
        payloadFingerprint: resolution.payloadFingerprint,
        patientStateId: baseState.id,
        conditionStateId: resolution.conditionStateId,
        profileRef: resolution.profileRef,
        resolvedFunctionalImpairmentId: resolution.resolvedFunctionalImpairment.id,
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

  it('normalizes multiple exact condition/profile results without losing their targets', () => {
    const composition = expectComposition(makeScenario([moduleIds.comorbidity]).request);
    const baseState = composition.composedPatientState!;
    const resolutions = baseState.conditionStates.map((condition, index) =>
      expectFunctionalImpairmentResolution({
        patientStateId: baseState.id,
        condition,
        profileSuffix: index === 0 ? 'condition-a' : 'condition-b',
        requestSuffix: index === 0 ? 'condition-a' : 'condition-b',
        seed: `seed.test.functional-impairment-attachment.condition-${index}`,
      }),
    );
    const forward = expectFunctionalImpairmentAttachment(composition, resolutions);
    const reversed = expectFunctionalImpairmentAttachment(composition, [...resolutions].reverse());

    expect(reversed).toEqual(forward);
    expect(
      forward.attachedFunctionalImpairments
        .map((impairment) => impairment.target.conditionStateId)
        .sort(),
    ).toEqual(baseState.conditionStates.map((condition) => condition.id).sort());
  });

  it('rejects crossed patient/condition coordinates and a non-composed D-208 state', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const wrongPatient = expectFunctionalImpairmentResolution({
      patientStateId: 'resolved-patient-state.test.other',
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'wrong-patient',
      requestSuffix: 'wrong-patient',
      seed: 'seed.test.functional-impairment-attachment.wrong-patient',
    });
    expect(
      attachConditionFunctionalImpairments({
        schemaVersion: 1,
        id: 'condition-functional-impairment-attachment-request.test.wrong-patient',
        patientStateCompositionArtifact: composition,
        functionalImpairmentResolutionArtifacts: [wrongPatient],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_CONTEXT_MISMATCH' },
    });

    const changedCondition = {
      ...baseState.conditionStates[0]!,
      clinicalStateId: 'clinical-state.test.changed',
    };
    const wrongCondition = expectFunctionalImpairmentResolution({
      patientStateId: baseState.id,
      condition: changedCondition,
      profileSuffix: 'wrong-condition',
      requestSuffix: 'wrong-condition',
      seed: 'seed.test.functional-impairment-attachment.wrong-condition',
    });
    expect(
      attachConditionFunctionalImpairments({
        schemaVersion: 1,
        id: 'condition-functional-impairment-attachment-request.test.wrong-condition',
        patientStateCompositionArtifact: composition,
        functionalImpairmentResolutionArtifacts: [wrongCondition],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONDITION_CONTEXT_MISMATCH' },
    });

    const notComposed = expectComposition(makeScenario([moduleIds.other]).request);
    expect(
      attachConditionFunctionalImpairments({
        schemaVersion: 1,
        id: 'condition-functional-impairment-attachment-request.test.not-composed',
        patientStateCompositionArtifact: notComposed,
        functionalImpairmentResolutionArtifacts: [],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_NOT_COMPOSED' },
    });
  });

  it('rejects duplicate assignments and detects upstream or replay tampering', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const first = expectFunctionalImpairmentResolution({
      patientStateId: baseState.id,
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'duplicate',
      requestSuffix: 'duplicate-a',
      seed: 'seed.test.functional-impairment-attachment.duplicate-a',
    });
    const second = expectFunctionalImpairmentResolution({
      patientStateId: baseState.id,
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'duplicate',
      requestSuffix: 'duplicate-b',
      seed: 'seed.test.functional-impairment-attachment.duplicate-b',
    });
    expect(
      attachConditionFunctionalImpairments({
        schemaVersion: 1,
        id: 'condition-functional-impairment-attachment-request.test.duplicate',
        patientStateCompositionArtifact: composition,
        functionalImpairmentResolutionArtifacts: [first, second],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const crossedComposition = structuredClone(composition);
    crossedComposition.compositionRequest.corePatientState.demographics.ageYears += 1;
    expect(
      attachConditionFunctionalImpairments({
        schemaVersion: 1,
        id: 'condition-functional-impairment-attachment-request.test.invalid-composition',
        patientStateCompositionArtifact: crossedComposition,
        functionalImpairmentResolutionArtifacts: [first],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_COMPOSITION_INVALID' },
    });

    const crossedResolution = structuredClone(first);
    crossedResolution.compileRequest.seed = 'seed.test.functional-impairment-attachment.changed';
    expect(
      attachConditionFunctionalImpairments({
        schemaVersion: 1,
        id: 'condition-functional-impairment-attachment-request.test.invalid-resolution',
        patientStateCompositionArtifact: composition,
        functionalImpairmentResolutionArtifacts: [crossedResolution],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'FUNCTIONAL_IMPAIRMENT_RESOLUTION_INVALID' },
    });

    const attachment = expectFunctionalImpairmentAttachment(composition, [first]);
    const tampered = structuredClone(attachment);
    tampered.inputFingerprint =
      'fingerprint.condition-functional-impairment-attachment.input.fnv1a64.0000000000000000';
    expect(verifyConditionFunctionalImpairmentAttachmentIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'INPUT_FINGERPRINT_MISMATCH' },
    });
  });
});

describe('D-290 target-redacted condition-functional-impairment projection', () => {
  it('projects an empty exact D-289 binding without manufacturing a result', () => {
    const composition = expectComposition(makeScenario([]).request);
    const attachment = expectFunctionalImpairmentAttachment(composition, []);
    const projection = expectFunctionalImpairmentProjection(attachment);

    expect(projection).toEqual({
      schemaVersion: 1,
      id: `condition-functional-impairment-projection.${attachment.payloadFingerprint.slice(-16)}`,
      patientStateId: attachment.basePatientStateRef.id,
      functionalImpairments: [],
    });
    expect(FrozenConditionFunctionalImpairmentProjectionSchema.parse(projection)).toEqual(
      projection,
    );
    expect(verifyConditionFunctionalImpairmentProjection(attachment, projection)).toEqual({
      ok: true,
      value: projection,
    });
  });

  it('retains only level, source kind, and time while redacting target and generation audit', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const resolution = expectFunctionalImpairmentResolution({
      patientStateId: baseState.id,
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'projection',
      requestSuffix: 'projection',
      seed: 'seed.test.functional-impairment-projection',
    });
    const attachment = expectFunctionalImpairmentAttachment(composition, [resolution]);
    const projection = expectFunctionalImpairmentProjection(attachment);

    expect(projection.functionalImpairments).toEqual([
      {
        schemaVersion: 1,
        id: resolution.resolvedFunctionalImpairment.id,
        level: resolution.resolvedFunctionalImpairment.level,
        sourceKind: 'patient_report',
        timeScopeId: resolution.timeScopeId,
      },
    ]);
    const frozen = projection.functionalImpairments[0]!;
    expect(frozen).not.toHaveProperty('target');
    expect(frozen).not.toHaveProperty('conditionStateId');
    expect(frozen).not.toHaveProperty('relatedDiagnosisId');
    expect(frozen).not.toHaveProperty('functionalImpairmentProfileId');
    expect(frozen).not.toHaveProperty('functionalImpairmentOptionId');
    expect(frozen).not.toHaveProperty('source');
    expect(frozen).not.toHaveProperty('sourceInstanceId');
    expect(frozen).not.toHaveProperty('resolution');
    expect(frozen).not.toHaveProperty('stableDrawId');
    expect(projection).not.toHaveProperty('attachmentRequest');
    expect(projection).not.toHaveProperty('payloadFingerprint');
  });

  it('uses one stable ID-ordered projection for set-like D-289 inputs', () => {
    const composition = expectComposition(makeScenario([moduleIds.comorbidity]).request);
    const baseState = composition.composedPatientState!;
    const resolutions = baseState.conditionStates.map((condition, index) =>
      expectFunctionalImpairmentResolution({
        patientStateId: baseState.id,
        condition,
        profileSuffix: `projection-${index}`,
        requestSuffix: `projection-${index}`,
        seed: `seed.test.functional-impairment-projection.${index}`,
      }),
    );
    const forward = expectFunctionalImpairmentAttachment(composition, resolutions);
    const reversed = expectFunctionalImpairmentAttachment(composition, [...resolutions].reverse());
    const forwardProjection = expectFunctionalImpairmentProjection(forward);
    const reversedProjection = expectFunctionalImpairmentProjection(reversed);

    expect(reversedProjection).toEqual(forwardProjection);
    expect(forwardProjection.functionalImpairments.map((record) => record.id)).toEqual(
      forwardProjection.functionalImpairments.map((record) => record.id).sort(),
    );
  });

  it('rejects a tampered D-289 source or a crossed projection', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const resolution = expectFunctionalImpairmentResolution({
      patientStateId: baseState.id,
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'tamper',
      requestSuffix: 'tamper',
      seed: 'seed.test.functional-impairment-projection.tamper',
    });
    const attachment = expectFunctionalImpairmentAttachment(composition, [resolution]);
    const projection = expectFunctionalImpairmentProjection(attachment);

    const tamperedAttachment = structuredClone(attachment);
    tamperedAttachment.inputFingerprint =
      'fingerprint.condition-functional-impairment-attachment.input.fnv1a64.0000000000000000';
    expect(projectConditionFunctionalImpairmentAttachment(tamperedAttachment)).toMatchObject({
      ok: false,
      error: { code: 'FUNCTIONAL_IMPAIRMENT_ATTACHMENT_INVALID' },
    });

    const invalidProjection = structuredClone(projection);
    invalidProjection.functionalImpairments.push(projection.functionalImpairments[0]!);
    expect(
      verifyConditionFunctionalImpairmentProjection(attachment, invalidProjection),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PROJECTION' },
    });

    const crossedProjection = structuredClone(projection);
    crossedProjection.functionalImpairments[0]!.level =
      crossedProjection.functionalImpairments[0]!.level === 'severe' ? 'mild' : 'severe';
    expect(
      verifyConditionFunctionalImpairmentProjection(attachment, crossedProjection),
    ).toMatchObject({
      ok: false,
      error: { code: 'PROJECTION_MISMATCH' },
    });
  });
});

describe('D-292 condition-functional-impairment source validation', () => {
  it('validates an empty D-289 collection against an empty exact-patient D-291 horizon', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const attachment = expectFunctionalImpairmentAttachment(composition, []);
    const sourceHorizon = expectPatientSceneSourceHorizon(baseState.id, []);
    const result = validateConditionFunctionalImpairmentSources({
      schemaVersion: 1,
      id: 'condition-functional-impairment-source-validation-request.test.empty',
      functionalImpairmentAttachment: attachment,
      sourceInstanceCompilation: sourceHorizon,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.validatedSourceBindings).toEqual([]);
    expect(result.value.projection.functionalImpairments).toEqual([]);
    expect(ConditionFunctionalImpairmentSourceValidationArtifactSchema.parse(result.value)).toEqual(
      result.value,
    );
    expect(verifyConditionFunctionalImpairmentSourceValidationIntegrity(result.value)).toEqual({
      ok: true,
      value: result.value,
    });
  });

  it('proves one D-267 source against the independent D-291 horizon and carries D-290 forward', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const sourceHorizon = expectPatientSceneSourceHorizon(baseState.id, [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'patient-scene-source-definition.test.functional-impairment.patient-report',
        kind: 'patient_report',
      },
    ]);
    const sourceInstance = sourceHorizon.sourceInstances[0]!;
    const resolution = expectFunctionalImpairmentResolution({
      patientStateId: baseState.id,
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'source-validation',
      requestSuffix: 'source-validation',
      seed: 'seed.test.functional-impairment-source-validation',
      source: {
        kind: sourceInstance.kind,
        sourceInstanceId: sourceInstance.id,
      },
    });
    const attachment = expectFunctionalImpairmentAttachment(composition, [resolution]);
    const result = validateConditionFunctionalImpairmentSources({
      schemaVersion: 1,
      id: 'condition-functional-impairment-source-validation-request.test.complete',
      functionalImpairmentAttachment: attachment,
      sourceInstanceCompilation: sourceHorizon,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.validatedSourceBindings).toEqual([
      {
        resolvedFunctionalImpairmentId: resolution.resolvedFunctionalImpairment.id,
        sourceInstanceId: sourceInstance.id,
        sourceKind: 'patient_report',
      },
    ]);
    expect(result.value.projection).toEqual(expectFunctionalImpairmentProjection(attachment));
    expect(result.value).not.toHaveProperty('credibility');
    expect(result.value).not.toHaveProperty('accuracy');
    expect(result.value).not.toHaveProperty('informationActionId');
  });

  it('rejects a crossed patient horizon, a missing instance, or a crossed source kind', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const sourceHorizon = expectPatientSceneSourceHorizon(baseState.id, [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'patient-scene-source-definition.test.functional-impairment.patient-report',
        kind: 'patient_report',
      },
    ]);
    const sourceInstance = sourceHorizon.sourceInstances[0]!;
    const missingSourceResolution = expectFunctionalImpairmentResolution({
      patientStateId: baseState.id,
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'missing-source',
      requestSuffix: 'missing-source',
      seed: 'seed.test.functional-impairment-source-validation.missing',
    });
    expect(
      validateConditionFunctionalImpairmentSources({
        schemaVersion: 1,
        id: 'condition-functional-impairment-source-validation-request.test.missing-source',
        functionalImpairmentAttachment: expectFunctionalImpairmentAttachment(composition, [
          missingSourceResolution,
        ]),
        sourceInstanceCompilation: sourceHorizon,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_REFERENCE_INVALID' },
    });

    const crossedKindResolution = expectFunctionalImpairmentResolution({
      patientStateId: baseState.id,
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'crossed-kind',
      requestSuffix: 'crossed-kind',
      seed: 'seed.test.functional-impairment-source-validation.crossed-kind',
      source: {
        kind: 'collateral_report',
        sourceInstanceId: sourceInstance.id,
      },
    });
    expect(
      validateConditionFunctionalImpairmentSources({
        schemaVersion: 1,
        id: 'condition-functional-impairment-source-validation-request.test.crossed-kind',
        functionalImpairmentAttachment: expectFunctionalImpairmentAttachment(composition, [
          crossedKindResolution,
        ]),
        sourceInstanceCompilation: sourceHorizon,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_REFERENCE_INVALID' },
    });

    const correctResolution = expectFunctionalImpairmentResolution({
      patientStateId: baseState.id,
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'crossed-patient',
      requestSuffix: 'crossed-patient',
      seed: 'seed.test.functional-impairment-source-validation.crossed-patient',
      source: {
        kind: sourceInstance.kind,
        sourceInstanceId: sourceInstance.id,
      },
    });
    expect(
      validateConditionFunctionalImpairmentSources({
        schemaVersion: 1,
        id: 'condition-functional-impairment-source-validation-request.test.crossed-patient',
        functionalImpairmentAttachment: expectFunctionalImpairmentAttachment(composition, [
          correctResolution,
        ]),
        sourceInstanceCompilation: expectPatientSceneSourceHorizon(
          'resolved-patient-state.test.other',
          [],
        ),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_CONTEXT_MISMATCH' },
    });
  });

  it('detects upstream and retained-artifact tampering', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const attachment = expectFunctionalImpairmentAttachment(composition, []);
    const sourceHorizon = expectPatientSceneSourceHorizon(baseState.id, []);
    const result = validateConditionFunctionalImpairmentSources({
      schemaVersion: 1,
      id: 'condition-functional-impairment-source-validation-request.test.tamper',
      functionalImpairmentAttachment: attachment,
      sourceInstanceCompilation: sourceHorizon,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);

    const upstreamTamper = structuredClone(sourceHorizon);
    upstreamTamper.inputFingerprint =
      'fingerprint.patient-scene-source-instance-compilation.input.fnv1a64.0000000000000000';
    expect(
      validateConditionFunctionalImpairmentSources({
        schemaVersion: 1,
        id: 'condition-functional-impairment-source-validation-request.test.upstream-tamper',
        functionalImpairmentAttachment: attachment,
        sourceInstanceCompilation: upstreamTamper,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_HORIZON_INVALID' },
    });

    const retainedTamper = structuredClone(result.value);
    retainedTamper.inputFingerprint =
      'fingerprint.condition-functional-impairment-source-validation.input.fnv1a64.0000000000000000';
    expect(
      verifyConditionFunctionalImpairmentSourceValidationIntegrity(retainedTamper),
    ).toMatchObject({
      ok: false,
      error: { code: 'INPUT_FINGERPRINT_MISMATCH' },
    });
  });
});

describe('D-294 condition-clinical-duration source validation', () => {
  it('validates an empty D-264 attachment against an empty exact-patient D-291 horizon', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const attachment = expectDurationAttachment(composition, []);
    const sourceHorizon = expectPatientSceneSourceHorizon(baseState.id, []);
    const result = validateConditionClinicalDurationSources({
      schemaVersion: 1,
      id: 'condition-clinical-duration-source-validation-request.test.empty',
      durationAttachment: attachment,
      sourceInstanceCompilation: sourceHorizon,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.validatedSourceBindings).toEqual([]);
    expect(result.value.composedPatientStateRef).toEqual({
      id: attachment.composedPatientState.id,
      fingerprint: attachment.composedPatientStateFingerprint,
    });
    expect(ConditionClinicalDurationSourceValidationArtifactSchema.parse(result.value)).toEqual(
      result.value,
    );
    expect(verifyConditionClinicalDurationSourceValidationIntegrity(result.value)).toEqual({
      ok: true,
      value: result.value,
    });
  });

  it('proves one D-263 duration source and preserves the exact D-264 composed-state reference', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const sourceHorizon = expectPatientSceneSourceHorizon(baseState.id, [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'patient-scene-source-definition.test.condition-duration.patient-report',
        kind: 'patient_report',
      },
    ]);
    const sourceInstance = sourceHorizon.sourceInstances[0]!;
    const resolution = expectDurationResolution({
      patientStateId: baseState.id,
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'source-validation',
      requestSuffix: 'source-validation',
      seed: 'seed.test.condition-duration-source-validation',
      source: {
        kind: sourceInstance.kind,
        sourceInstanceId: sourceInstance.id,
      },
    });
    const attachment = expectDurationAttachment(composition, [resolution]);
    const result = validateConditionClinicalDurationSources({
      schemaVersion: 1,
      id: 'condition-clinical-duration-source-validation-request.test.complete',
      durationAttachment: attachment,
      sourceInstanceCompilation: sourceHorizon,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.validatedSourceBindings).toEqual([
      {
        resolvedClinicalDurationId: resolution.resolvedDuration.id,
        sourceInstanceId: sourceInstance.id,
        sourceKind: 'patient_report',
      },
    ]);
    expect(result.value.patientStateId).toBe(baseState.id);
    expect(result.value.composedPatientStateRef.id).toBe(attachment.composedPatientState.id);
    expect(result.value.composedPatientStateRef.id).not.toBe(baseState.id);
    expect(result.value).not.toHaveProperty('credibility');
    expect(result.value).not.toHaveProperty('probability');
    expect(result.value).not.toHaveProperty('informationActionId');
  });

  it('rejects a crossed patient horizon, a missing instance, or a crossed source kind', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const sourceHorizon = expectPatientSceneSourceHorizon(baseState.id, [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'patient-scene-source-definition.test.condition-duration.patient-report',
        kind: 'patient_report',
      },
    ]);
    const sourceInstance = sourceHorizon.sourceInstances[0]!;

    expect(
      validateConditionClinicalDurationSources({
        schemaVersion: 1,
        id: 'condition-clinical-duration-source-validation-request.test.missing',
        durationAttachment: expectDurationAttachment(composition, [
          expectDurationResolution({
            patientStateId: baseState.id,
            condition: baseState.conditionStates[0]!,
            profileSuffix: 'missing-source',
            requestSuffix: 'missing-source',
            seed: 'seed.test.condition-duration-source-validation.missing',
          }),
        ]),
        sourceInstanceCompilation: sourceHorizon,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_REFERENCE_INVALID' },
    });

    expect(
      validateConditionClinicalDurationSources({
        schemaVersion: 1,
        id: 'condition-clinical-duration-source-validation-request.test.crossed-kind',
        durationAttachment: expectDurationAttachment(composition, [
          expectDurationResolution({
            patientStateId: baseState.id,
            condition: baseState.conditionStates[0]!,
            profileSuffix: 'crossed-kind',
            requestSuffix: 'crossed-kind',
            seed: 'seed.test.condition-duration-source-validation.crossed-kind',
            source: {
              kind: 'collateral_report',
              sourceInstanceId: sourceInstance.id,
            },
          }),
        ]),
        sourceInstanceCompilation: sourceHorizon,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_REFERENCE_INVALID' },
    });

    const correctResolution = expectDurationResolution({
      patientStateId: baseState.id,
      condition: baseState.conditionStates[0]!,
      profileSuffix: 'crossed-patient',
      requestSuffix: 'crossed-patient',
      seed: 'seed.test.condition-duration-source-validation.crossed-patient',
      source: {
        kind: sourceInstance.kind,
        sourceInstanceId: sourceInstance.id,
      },
    });
    expect(
      validateConditionClinicalDurationSources({
        schemaVersion: 1,
        id: 'condition-clinical-duration-source-validation-request.test.crossed-patient',
        durationAttachment: expectDurationAttachment(composition, [correctResolution]),
        sourceInstanceCompilation: expectPatientSceneSourceHorizon(
          'resolved-patient-state.test.other',
          [],
        ),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_CONTEXT_MISMATCH' },
    });
  });

  it('detects upstream and retained-artifact tampering', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const attachment = expectDurationAttachment(composition, []);
    const sourceHorizon = expectPatientSceneSourceHorizon(baseState.id, []);
    const result = validateConditionClinicalDurationSources({
      schemaVersion: 1,
      id: 'condition-clinical-duration-source-validation-request.test.tamper',
      durationAttachment: attachment,
      sourceInstanceCompilation: sourceHorizon,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);

    const upstreamTamper = structuredClone(attachment);
    upstreamTamper.inputFingerprint =
      'fingerprint.condition-clinical-duration-attachment.input.fnv1a64.0000000000000000';
    expect(
      validateConditionClinicalDurationSources({
        schemaVersion: 1,
        id: 'condition-clinical-duration-source-validation-request.test.upstream-tamper',
        durationAttachment: upstreamTamper,
        sourceInstanceCompilation: sourceHorizon,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'DURATION_ATTACHMENT_INVALID' },
    });

    const retainedTamper = structuredClone(result.value);
    retainedTamper.inputFingerprint =
      'fingerprint.condition-clinical-duration-source-validation.input.fnv1a64.0000000000000000';
    expect(verifyConditionClinicalDurationSourceValidationIntegrity(retainedTamper)).toMatchObject({
      ok: false,
      error: { code: 'INPUT_FINGERPRINT_MISMATCH' },
    });
  });
});

const patientStateSourceDefinitions = (): PatientSceneSourceInstanceDefinition[] => [
  {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-scene-source-definition.test.composed-state.patient-report',
    kind: 'patient_report',
  },
  {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-scene-source-definition.test.composed-state.collateral-report',
    kind: 'collateral_report',
  },
  {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-scene-source-definition.test.composed-state.record-review',
    kind: 'record_review',
  },
  {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-scene-source-definition.test.composed-state.clinician-observation',
    kind: 'clinician_observation',
  },
  {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-scene-source-definition.test.composed-state.measurement',
    kind: 'measurement',
  },
  {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-scene-source-definition.test.composed-state.laboratory-result',
    kind: 'laboratory_result',
  },
];

const patientStateSourceId = (
  definitions: readonly PatientSceneSourceInstanceDefinition[],
  kind: PatientSceneSourceInstanceDefinition['kind'],
): string => derivePatientSceneSourceInstanceId(definitions.find((entry) => entry.kind === kind)!);

const makePatientStateSourceValidationScenario = () => {
  const definitions = patientStateSourceDefinitions();
  const patientReportSourceId = patientStateSourceId(definitions, 'patient_report');
  const collateralReportSourceId = patientStateSourceId(definitions, 'collateral_report');
  const recordReviewSourceId = patientStateSourceId(definitions, 'record_review');
  const clinicianObservationSourceId = patientStateSourceId(definitions, 'clinician_observation');
  const measurementSourceId = patientStateSourceId(definitions, 'measurement');
  const laboratoryResultSourceId = patientStateSourceId(definitions, 'laboratory_result');
  const base = makeScenario([]).request;
  const conditionStateId = base.corePatientState.conditionStates[0]!.id;
  const regimenEntryId = 'medication-regimen-entry.test.composed-state.source-validation';
  const observationId = 'categorical-observation.test.composed-state.restlessness';
  const propositionId = 'latent-proposition.test.composed-state.attended-appointment';
  const corePatientState: ResolvedPatientState = {
    ...base.corePatientState,
    diagnosisRecordEntries: [
      {
        schemaVersion: 1,
        id: 'diagnosis-record.test.composed-state.source-validation',
        mappedDiagnosisDefinitionId: null,
        mappedDiagnosisDefinitionContentVersion: null,
        recordedLabel: 'Historical chart diagnosis',
        assertion: 'historical',
        source: {
          kind: 'record_review',
          sourceInstanceId: recordReviewSourceId,
        },
        timeScopeId: 'time-scope.historical',
        resolution: {
          origin: 'authored',
          ownerId: 'patient-template.test.patient-state-composition',
          ownerContentVersion: '1.0.0',
        },
      },
    ],
    medicationRegimenEntries: [
      {
        recordVersion: 2,
        id: regimenEntryId,
        medicationIdentityId: 'medication.test.composed-state.sertraline',
        clinicalRole: 'psychiatric',
        status: 'active',
        adherence: 'consistent',
        prescribedForDiagnosisId: null,
        source: 'patient_report',
        knownAtOpening: true,
        impactClassification: 'fit_relevant',
      },
    ],
    currentMedicationReportedBenefits: [
      {
        recordVersion: 1,
        id: 'current-medication-benefit.test.composed-state.source-validation',
        subject: {
          kind: 'current_regimen_entry',
          modelVersion: 'finding-record-subject.v1',
          regimenEntryId,
        },
        reportedBenefit: 'partial',
        source: {
          kind: 'patient_report',
          sourceInstanceId: patientReportSourceId,
        },
        timeScopeId: 'time-scope.current',
      },
    ],
    currentMedicationDosePositions: [
      {
        recordVersion: 1,
        id: 'current-medication-dose-position.test.composed-state.source-validation',
        subject: {
          kind: 'current_regimen_entry',
          modelVersion: 'finding-record-subject.v1',
          regimenEntryId,
        },
        position: 'below_maximum',
        source: {
          kind: 'collateral_report',
          sourceInstanceId: collateralReportSourceId,
        },
        timeScopeId: 'time-scope.current',
      },
    ],
    medicationChangeTemporalRelationships: [
      {
        recordVersion: 1,
        id: 'medication-change-temporal.test.composed-state.source-validation',
        subject: {
          kind: 'current_regimen_entry',
          modelVersion: 'finding-record-subject.v1',
          regimenEntryId,
        },
        changeKind: 'increased',
        changeTimeScopeId: 'time-scope.recent',
        target: {
          kind: 'categorical_observation',
          categoricalObservationId: observationId,
        },
        targetTimeScopeId: 'time-scope.current',
        relationship: 'change_before_target',
        source: {
          kind: 'record_review',
          sourceInstanceId: recordReviewSourceId,
        },
      },
    ],
    measurements: [
      {
        schemaVersion: 1,
        id: 'measurement.test.composed-state.weight',
        definitionId: 'measurement.weight',
        definitionContentVersion: '1.0.0',
        value: 82,
        displayValue: '82 kg',
        unit: {
          display: 'kg',
          ucumCode: 'kg',
        },
        contextValues: [],
        timeScopeId: 'time-scope.current',
        source: {
          kind: 'measurement',
          sourceInstanceId: measurementSourceId,
        },
        interpretation: {
          kind: 'not_interpreted',
        },
        resolution: {
          origin: 'authored',
          ownerId: 'patient-template.test.patient-state-composition',
          ownerContentVersion: '1.0.0',
        },
      },
    ],
    categoricalObservations: [
      {
        schemaVersion: 1,
        id: observationId,
        definitionId: 'categorical-observation.test.restlessness',
        definitionContentVersion: '1.0.0',
        valueId: 'categorical-value.present',
        displayValue: 'Restlessness observed',
        timeScopeId: 'time-scope.current',
        source: {
          kind: 'clinician_observation',
          sourceInstanceId: clinicianObservationSourceId,
        },
        interpretationIds: [],
        resolution: {
          origin: 'authored',
          ownerId: 'patient-template.test.patient-state-composition',
          ownerContentVersion: '1.0.0',
        },
      },
    ],
    structuredTestResults: [
      {
        schemaVersion: 1,
        id: 'structured-test-result.test.composed-state.tsh',
        testDefinitionId: 'test.tsh',
        testDefinitionContentVersion: '1.0.0',
        source: {
          kind: 'laboratory_result',
          sourceInstanceId: laboratoryResultSourceId,
        },
        timeScopeId: 'time-scope.current',
        resolution: {
          origin: 'authored',
          ownerId: 'patient-template.test.patient-state-composition',
          ownerContentVersion: '1.0.0',
        },
        kind: 'binary',
        outcome: 'negative',
        displayValue: 'No flagged result',
        interpretationIds: [],
      },
    ],
    clinicalDurations: [
      {
        schemaVersion: 1,
        id: 'clinical-duration.test.composed-state.current-episode',
        target: {
          kind: 'condition_state',
          conditionStateId,
        },
        value: 8,
        unit: 'week',
        durationProfileId: 'clinical-duration-profile.test.composed-state',
        durationProfileContentVersion: '1.0.0',
        durationOptionId: 'clinical-duration-option.test.eight-weeks',
        relatedDiagnosisId: base.corePatientState.conditionStates[0]!.diagnosisDefinitionId,
        interpretation: 'supports_authored_state',
        criterionId: null,
        source: {
          kind: 'patient_report',
          sourceInstanceId: patientReportSourceId,
        },
        timeScopeId: 'time-scope.current',
        resolution: {
          origin: 'authored',
          ownerId: 'patient-template.test.patient-state-composition',
          ownerContentVersion: '1.0.0',
        },
      },
    ],
    functionalImpairments: [
      {
        schemaVersion: 1,
        id: 'functional-impairment.test.composed-state.current-episode',
        target: {
          kind: 'condition_state',
          conditionStateId,
        },
        attribution: 'condition_attributed',
        level: 'moderate',
        functionalImpairmentProfileId:
          'functional-impairment-profile.test.composed-state.current-episode',
        functionalImpairmentProfileContentVersion: '1.0.0',
        functionalImpairmentOptionId:
          'functional-impairment-option.test.composed-state.current-episode.moderate',
        relatedDiagnosisId: base.corePatientState.conditionStates[0]!.diagnosisDefinitionId,
        source: {
          kind: 'patient_report',
          sourceInstanceId: patientReportSourceId,
        },
        timeScopeId: 'time-scope.current',
        resolution: {
          origin: 'authored',
          ownerId: 'patient-template.test.patient-state-composition',
          ownerContentVersion: '1.0.0',
        },
      },
    ],
    subjectiveBurdenRecords: [
      {
        schemaVersion: 1,
        id: 'subjective-burden.test.composed-state.current-episode',
        target: {
          kind: 'condition_state',
          conditionStateId,
        },
        ordinalScaleId: 'ordinal-scale.test.subjective-burden',
        ordinalScaleContentVersion: '1.0.0',
        ordinalValueId: 'ordinal-value.test.somewhat-bothersome',
        source: {
          kind: 'patient_report',
          sourceInstanceId: patientReportSourceId,
        },
        timeScopeId: 'time-scope.current',
        resolution: {
          origin: 'authored',
          ownerId: 'patient-template.test.patient-state-composition',
          ownerContentVersion: '1.0.0',
        },
      },
    ],
    propositionState: {
      schemaVersion: 1,
      id: 'resolved-proposition-state.test.composed-state.source-validation',
      propositions: [
        {
          schemaVersion: 1,
          id: propositionId,
          definitionId: 'latent-proposition-definition.test.attended-appointment',
          definitionContentVersion: '1.0.0',
          auditStatement: 'The patient attended the named appointment.',
          truth: true,
          resolution: {
            origin: 'authored',
            ownerId: 'patient-template.test.patient-state-composition',
            ownerContentVersion: '1.0.0',
          },
        },
      ],
      evidence: [
        {
          schemaVersion: 1,
          id: 'proposition-evidence.test.composed-state.patient-report',
          propositionId,
          assertion: 'supports',
          relationshipToTruth: 'aligned',
          source: {
            kind: 'patient_report',
            sourceInstanceId: patientReportSourceId,
          },
          timeScopeId: 'time-scope.current',
          claimOriginId: 'claim-origin.test.composed-state.patient-report',
          dependencyGroupIds: [],
          resolution: {
            origin: 'authored',
            ownerId: 'patient-template.test.patient-state-composition',
            ownerContentVersion: '1.0.0',
          },
        },
      ],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
  };
  const composition = expectComposition({
    ...base,
    id: 'patient-state-composition-request.test.source-validation',
    corePatientState,
  });
  const sourceHorizon = expectPatientSceneSourceHorizon(
    composition.composedPatientState!.id,
    definitions,
  );
  return {
    composition,
    definitions,
    sourceHorizon,
  };
};

describe('D-301 composed patient-state source validation', () => {
  it('validates an empty source-bearing state against an empty exact-patient horizon', () => {
    const composition = expectComposition(makeScenario([]).request);
    const sourceHorizon = expectPatientSceneSourceHorizon(composition.composedPatientState!.id, []);
    const result = validateResolvedPatientStateSources({
      schemaVersion: 1,
      id: 'resolved-patient-state-source-validation-request.test.empty',
      patientStateComposition: composition,
      sourceInstanceCompilation: sourceHorizon,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.validatedSourceBindings).toEqual([]);
    expect(ResolvedPatientStateSourceValidationArtifactSchema.parse(result.value)).toEqual(
      result.value,
    );
    expect(verifyResolvedPatientStateSourceValidationIntegrity(result.value)).toEqual({
      ok: true,
      value: result.value,
    });
  });

  it('proves exact-kind ownership for every source-bearing patient-state lane', () => {
    const { composition, sourceHorizon } = makePatientStateSourceValidationScenario();
    const result = validateResolvedPatientStateSources({
      schemaVersion: 1,
      id: 'resolved-patient-state-source-validation-request.test.complete',
      patientStateComposition: composition,
      sourceInstanceCompilation: sourceHorizon,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.validatedSourceBindings).toHaveLength(11);
    expect(
      result.value.validatedSourceBindings.filter(
        (binding) => binding.validationMode === 'source_and_kind',
      ),
    ).toHaveLength(11);
    expect(result.value.validatedSourceBindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lane: 'categorical_observation',
          sourceKind: 'clinician_observation',
        }),
        expect.objectContaining({
          lane: 'measurement',
          sourceKind: 'measurement',
        }),
        expect.objectContaining({
          lane: 'functional_impairment',
          sourceKind: 'patient_report',
        }),
        expect.objectContaining({
          lane: 'structured_test_result',
          sourceKind: 'laboratory_result',
        }),
      ]),
    );
    expect(
      result.value.validatedSourceBindings.every((binding) => binding.sourceDefinitionId),
    ).toBe(true);
    expect(result.value).not.toHaveProperty('credibility');
    expect(result.value).not.toHaveProperty('accuracy');
    expect(result.value).not.toHaveProperty('points');
  });

  it('rejects a crossed patient, missing source, or exact-kind mismatch in every lane', () => {
    const { composition, definitions } = makePatientStateSourceValidationScenario();
    expect(
      validateResolvedPatientStateSources({
        schemaVersion: 1,
        id: 'resolved-patient-state-source-validation-request.test.crossed-patient',
        patientStateComposition: composition,
        sourceInstanceCompilation: expectPatientSceneSourceHorizon(
          'resolved-patient-state.test.crossed',
          definitions,
        ),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_CONTEXT_MISMATCH' },
    });

    expect(
      validateResolvedPatientStateSources({
        schemaVersion: 1,
        id: 'resolved-patient-state-source-validation-request.test.missing-source',
        patientStateComposition: composition,
        sourceInstanceCompilation: expectPatientSceneSourceHorizon(
          composition.composedPatientState!.id,
          definitions.filter((definition) => definition.kind !== 'measurement'),
        ),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_REFERENCE_INVALID' },
    });

    const measurementMismatchRequest = structuredClone(composition.compositionRequest);
    measurementMismatchRequest.id =
      'patient-state-composition-request.test.source-validation.measurement-kind-mismatch';
    measurementMismatchRequest.corePatientState.measurements[0]!.source.kind = 'laboratory_result';
    const measurementMismatchComposition = expectComposition(measurementMismatchRequest);
    expect(
      validateResolvedPatientStateSources({
        schemaVersion: 1,
        id: 'resolved-patient-state-source-validation-request.test.measurement-kind-mismatch',
        patientStateComposition: measurementMismatchComposition,
        sourceInstanceCompilation: expectPatientSceneSourceHorizon(
          measurementMismatchComposition.composedPatientState!.id,
          definitions,
        ),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_REFERENCE_INVALID' },
    });

    const base = makeScenario([]).request;
    const recordDefinition = definitions.find((definition) => definition.kind === 'record_review')!;
    const mismatchedComposition = expectComposition({
      ...base,
      id: 'patient-state-composition-request.test.source-validation.kind-mismatch',
      corePatientState: {
        ...base.corePatientState,
        diagnosisRecordEntries: [
          {
            schemaVersion: 1,
            id: 'diagnosis-record.test.composed-state.kind-mismatch',
            mappedDiagnosisDefinitionId: null,
            mappedDiagnosisDefinitionContentVersion: null,
            recordedLabel: 'Crossed source-kind fixture',
            assertion: 'questioned',
            source: {
              kind: 'collateral_report',
              sourceInstanceId: derivePatientSceneSourceInstanceId(recordDefinition),
            },
            timeScopeId: 'time-scope.current',
            resolution: {
              origin: 'authored',
              ownerId: 'patient-template.test.patient-state-composition',
              ownerContentVersion: '1.0.0',
            },
          },
        ],
      },
    });
    expect(
      validateResolvedPatientStateSources({
        schemaVersion: 1,
        id: 'resolved-patient-state-source-validation-request.test.kind-mismatch',
        patientStateComposition: mismatchedComposition,
        sourceInstanceCompilation: expectPatientSceneSourceHorizon(
          mismatchedComposition.composedPatientState!.id,
          definitions,
        ),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_REFERENCE_INVALID' },
    });
  });

  it('detects upstream and retained-artifact tampering', () => {
    const { composition, sourceHorizon } = makePatientStateSourceValidationScenario();
    const result = validateResolvedPatientStateSources({
      schemaVersion: 1,
      id: 'resolved-patient-state-source-validation-request.test.tamper',
      patientStateComposition: composition,
      sourceInstanceCompilation: sourceHorizon,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);

    const upstreamTamper = structuredClone(composition);
    upstreamTamper.inputFingerprint =
      'fingerprint.resolved-patient-state-composition.input.fnv1a64.0000000000000000';
    expect(
      validateResolvedPatientStateSources({
        schemaVersion: 1,
        id: 'resolved-patient-state-source-validation-request.test.upstream-tamper',
        patientStateComposition: upstreamTamper,
        sourceInstanceCompilation: sourceHorizon,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_COMPOSITION_INVALID' },
    });

    const retainedTamper = structuredClone(result.value);
    retainedTamper.inputFingerprint =
      'fingerprint.resolved-patient-state-source-validation.input.fnv1a64.0000000000000000';
    expect(verifyResolvedPatientStateSourceValidationIntegrity(retainedTamper)).toMatchObject({
      ok: false,
      error: { code: 'INPUT_FINGERPRINT_MISMATCH' },
    });
  });
});

const clinicalResultSourceCatalog = PatientSceneSourceDefinitionCatalogSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'registry.catalog.patient-scene-source-definitions.test.result-attachment',
  definitions: [
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'patient-scene-source-role.test.result-attachment.measurement',
      kind: 'measurement',
    },
  ],
});

const clinicalResultMeasurementDefinition = MeasurementDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'measurement.test.result-attachment.weight',
  label: 'Synthetic attachment weight',
  domain: 'anthropometric',
  unit: {
    display: 'kg',
    ucumCode: 'kg',
    displayPrecision: 1,
  },
  availableThroughActionIds: ['info.physical.weight-bmi'],
  allowedContextDimensionIds: [],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const clinicalResultHeightDefinition = MeasurementDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'measurement.test.result-attachment.height',
  label: 'Synthetic attachment height',
  domain: 'anthropometric',
  unit: {
    display: 'cm',
    ucumCode: 'cm',
    displayPrecision: 1,
  },
  availableThroughActionIds: ['info.physical.weight-bmi'],
  allowedContextDimensionIds: [],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const clinicalResultBodyMassIndexDefinition = MeasurementDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'measurement.test.result-attachment.bmi',
  label: 'Synthetic attachment BMI',
  domain: 'anthropometric',
  unit: {
    display: 'kg/m²',
    ucumCode: 'kg/m2',
    displayPrecision: 1,
  },
  availableThroughActionIds: ['info.physical.weight-bmi'],
  allowedContextDimensionIds: [],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const clinicalResultBodyMassIndexDerivation = BodyMassIndexDerivationDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'measurement-derivation.test.result-attachment.bmi',
  kind: 'body_mass_index_from_metric_height_weight',
  heightMeasurementDefinitionRef: {
    id: clinicalResultHeightDefinition.id,
    contentVersion: clinicalResultHeightDefinition.contentVersion,
  },
  weightMeasurementDefinitionRef: {
    id: clinicalResultMeasurementDefinition.id,
    contentVersion: clinicalResultMeasurementDefinition.contentVersion,
  },
  outputMeasurementDefinitionRef: {
    id: clinicalResultBodyMassIndexDefinition.id,
    contentVersion: clinicalResultBodyMassIndexDefinition.contentVersion,
  },
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const makeClinicalResultCollection = (patientStateId: string) => {
  const coordinate = patientStateId.split('.').at(-1)!;
  const sourceCompilation = compilePatientSceneSourceInstancesFromCatalog({
    schemaVersion: 1,
    id: `catalog-patient-scene-source-instance-request.test.result-attachment.${coordinate}`,
    patientStateId,
    sourceDefinitionCatalog: clinicalResultSourceCatalog,
  });
  if (!sourceCompilation.ok) throw new Error(sourceCompilation.error.message);
  const valueProfile = PatientOwnedMeasurementValueProfileSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-owned-measurement-profile.test.result-attachment.weight',
    measurementDefinitionRef: {
      id: clinicalResultMeasurementDefinition.id,
      contentVersion: clinicalResultMeasurementDefinition.contentVersion,
    },
    value: 82.4,
    displayValue: '82.4',
    contextValues: [],
    sourceUseNoteIds: [],
    medicalReviewStatus: 'unreviewed',
    review: {
      status: 'unreviewed',
      reviewerId: null,
      reviewedAt: null,
      sourceUseNoteIds: [],
    },
  });
  const measurementCompilation = compilePatientOwnedMeasurement({
    schemaVersion: 1,
    id: `patient-owned-measurement-request.test.result-attachment.${coordinate}`,
    patientStateId,
    measurementDefinition: clinicalResultMeasurementDefinition,
    valueProfile,
    sourceDefinitionRef: {
      id: 'patient-scene-source-role.test.result-attachment.measurement',
      contentVersion: '1.0.0',
    },
    sourceInstanceCompilation: sourceCompilation.value,
    timeScopeId: 'time-scope.current',
  });
  if (!measurementCompilation.ok) throw new Error(measurementCompilation.error.message);
  const collection = compilePatientClinicalResultCollection({
    schemaVersion: 1,
    id: `patient-clinical-result-collection-request.test.result-attachment.${coordinate}`,
    patientStateId,
    sourceInstanceCompilation: sourceCompilation.value,
    numericStructuredTestCompilations: [],
    patientOwnedStructuredTestCompilations: [],
    measurementCompilations: [measurementCompilation.value],
    categoricalObservationCompilations: [],
  });
  if (!collection.ok) throw new Error(collection.error.message);
  return collection.value;
};

const makeBodyMassIndexClinicalResultFixture = (patientStateId: string, suffix: string) => {
  const coordinate = `${patientStateId.split('.').at(-1)!}.${suffix}`;
  const sourceCompilation = compilePatientSceneSourceInstancesFromCatalog({
    schemaVersion: 1,
    id: `catalog-patient-scene-source-instance-request.test.result-attachment.bmi.${coordinate}`,
    patientStateId,
    sourceDefinitionCatalog: clinicalResultSourceCatalog,
  });
  if (!sourceCompilation.ok) throw new Error(sourceCompilation.error.message);
  const compileMeasurement = (
    definition: typeof clinicalResultMeasurementDefinition,
    value: number,
    label: string,
  ) => {
    const valueProfile = PatientOwnedMeasurementValueProfileSchema.parse({
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: `patient-owned-measurement-profile.test.result-attachment.bmi.${suffix}.${label}`,
      measurementDefinitionRef: {
        id: definition.id,
        contentVersion: definition.contentVersion,
      },
      value,
      displayValue: value.toFixed(definition.unit.displayPrecision),
      contextValues: [],
      sourceUseNoteIds: [],
      medicalReviewStatus: 'unreviewed',
      review: {
        status: 'unreviewed',
        reviewerId: null,
        reviewedAt: null,
        sourceUseNoteIds: [],
      },
    });
    const compilation = compilePatientOwnedMeasurement({
      schemaVersion: 1,
      id: `patient-owned-measurement-request.test.result-attachment.bmi.${coordinate}.${label}`,
      patientStateId,
      measurementDefinition: definition,
      valueProfile,
      sourceDefinitionRef: {
        id: 'patient-scene-source-role.test.result-attachment.measurement',
        contentVersion: '1.0.0',
      },
      sourceInstanceCompilation: sourceCompilation.value,
      timeScopeId: 'time-scope.current',
    });
    if (!compilation.ok) throw new Error(compilation.error.message);
    return compilation.value;
  };
  const height = compileMeasurement(clinicalResultHeightDefinition, 170, 'height');
  const weight = compileMeasurement(clinicalResultMeasurementDefinition, 82.4, 'weight');
  const collection = compilePatientClinicalResultCollection({
    schemaVersion: 1,
    id: `patient-clinical-result-collection-request.test.result-attachment.bmi.${coordinate}`,
    patientStateId,
    sourceInstanceCompilation: sourceCompilation.value,
    numericStructuredTestCompilations: [],
    patientOwnedStructuredTestCompilations: [],
    measurementCompilations: [height, weight],
    categoricalObservationCompilations: [],
  });
  if (!collection.ok) throw new Error(collection.error.message);
  const derivation = compileBodyMassIndexDerivation({
    schemaVersion: 1,
    id: `body-mass-index-derivation-request.test.result-attachment.${coordinate}`,
    patientStateId,
    derivationDefinition: clinicalResultBodyMassIndexDerivation,
    heightMeasurementDefinition: clinicalResultHeightDefinition,
    weightMeasurementDefinition: clinicalResultMeasurementDefinition,
    outputMeasurementDefinition: clinicalResultBodyMassIndexDefinition,
    resultCollectionCompilation: collection.value,
    heightResolvedMeasurementId: height.resolvedMeasurement.id,
    weightResolvedMeasurementId: weight.resolvedMeasurement.id,
  });
  if (!derivation.ok) throw new Error(derivation.error.message);
  const materialization = materializeBodyMassIndexMeasurement({
    schemaVersion: 1,
    id: `body-mass-index-measurement-materialization-request.test.result-attachment.${coordinate}`,
    derivationCompilation: derivation.value,
  });
  if (!materialization.ok) throw new Error(materialization.error.message);
  return {
    collection: collection.value,
    materialization: materialization.value,
  };
};

describe('D-311 patient clinical-result attachment', () => {
  it('replaces only empty D-208 result lanes with one exact D-320-owned result set', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = structuredClone(composition.composedPatientState!);
    const collection = makeClinicalResultCollection(baseState.id);
    const recipeCompilation = compileTestPatientTemplateClinicalResultRecipe({
      coordinate: 'result-attachment.complete',
      patientStateCompositionArtifact: composition,
      resultCollectionCompilation: collection,
    });
    const request = {
      schemaVersion: 1 as const,
      id: 'patient-clinical-result-attachment-request.test.complete',
      patientStateCompositionArtifact: composition,
      templateClinicalResultRecipeCompilation: recipeCompilation,
    };
    const first = attachPatientClinicalResults(request);
    const replay = attachPatientClinicalResults(request);

    expect(first.ok).toBe(true);
    expect(replay).toEqual(first);
    if (!first.ok) throw new Error(first.error.message);
    expect(PatientClinicalResultAttachmentArtifactSchema.parse(first.value)).toEqual(first.value);
    expect(first.value.composedPatientState.id).not.toBe(baseState.id);
    expect(first.value.composedPatientState.measurements).toEqual(collection.measurements);
    expect(first.value.composedPatientState.categoricalObservations).toEqual([]);
    expect(first.value.composedPatientState.structuredTestResults).toEqual([]);
    expect(first.value.attachedRecordIds).toEqual({
      measurementIds: collection.measurements.map((record) => record.id),
      categoricalObservationIds: [],
      structuredTestResultIds: [],
    });
    expect(composition.composedPatientState).toEqual(baseState);
    expect(verifyPatientClinicalResultAttachmentIntegrity(first.value)).toEqual({
      ok: true,
      value: first.value,
    });
    expect(JSON.stringify(first.value)).not.toMatch(
      /patientInstance|informationActionResult|points?|score|clinical correctness/i,
    );
  });

  it('attaches D-317 BMI beside the exact D-310 inputs without modifying or nesting the collection', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const fixture = makeBodyMassIndexClinicalResultFixture(baseState.id, 'primary');
    const frozenCollection = structuredClone(fixture.collection);
    const recipeCompilation = compileTestPatientTemplateClinicalResultRecipe({
      coordinate: 'result-attachment.derived-bmi',
      patientStateCompositionArtifact: composition,
      resultCollectionCompilation: fixture.collection,
      derivedMeasurementMaterializations: [fixture.materialization],
    });
    const result = attachPatientClinicalResults({
      schemaVersion: 1,
      id: 'patient-clinical-result-attachment-request.test.derived-bmi',
      patientStateCompositionArtifact: composition,
      templateClinicalResultRecipeCompilation: recipeCompilation,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);

    expect(fixture.collection).toEqual(frozenCollection);
    expect(fixture.collection.measurements).toHaveLength(2);
    expect(result.value.composedPatientState.measurements).toHaveLength(3);
    expect(
      result.value.composedPatientState.measurements.find(
        (measurement) => measurement.source.kind === 'derived_measurement',
      ),
    ).toEqual(fixture.materialization.resolvedMeasurement);
    expect(result.value.derivedMeasurementMaterializationRefs).toEqual([
      {
        id: fixture.materialization.id,
        payloadFingerprint: fixture.materialization.payloadFingerprint,
        resolvedMeasurementId: fixture.materialization.resolvedMeasurement.id,
      },
    ]);
    expect(verifyPatientClinicalResultAttachmentIntegrity(result.value)).toEqual({
      ok: true,
      value: result.value,
    });

    const assembled = assemblePostCompositionPatientState({
      schemaVersion: 1,
      id: 'post-composition-patient-state-assembly-request.test.derived-bmi',
      patientStateCompositionArtifact: composition,
      conditionClinicalDurationSourceValidationArtifact: null,
      conditionFunctionalImpairmentSourceValidationArtifact: null,
      patientClinicalResultAttachmentArtifact: result.value,
    });
    expect(assembled.ok).toBe(true);
    if (!assembled.ok) throw new Error(assembled.error.message);
    expect(assembled.value.composedPatientState.measurements).toEqual(
      result.value.composedPatientState.measurements,
    );
  }, 15_000);

  it('rejects a crossed patient, preexisting result lane, raw collection, or invalid recipe', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = composition.composedPatientState!;
    const collection = makeClinicalResultCollection(baseState.id);
    const crossedCollection = makeClinicalResultCollection(
      'resolved-patient-state.test.result-attachment.crossed',
    );
    expect(
      attachPatientClinicalResults({
        schemaVersion: 1,
        id: 'patient-clinical-result-attachment-request.test.crossed-patient',
        patientStateCompositionArtifact: composition,
        templateClinicalResultRecipeCompilation: compileTestPatientTemplateClinicalResultRecipe({
          coordinate: 'result-attachment.crossed-patient',
          patientStateCompositionArtifact: composition,
          resultCollectionCompilation: crossedCollection,
        }),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_CONTEXT_MISMATCH' },
    });

    const preexistingRequest = makeScenario([]).request;
    preexistingRequest.id = 'patient-state-composition-request.test.result-attachment.preexisting';
    preexistingRequest.corePatientState.measurements = [
      {
        schemaVersion: 1,
        id: 'measurement.test.result-attachment.preexisting',
        definitionId: clinicalResultMeasurementDefinition.id,
        definitionContentVersion: clinicalResultMeasurementDefinition.contentVersion,
        value: 80,
        displayValue: '80.0',
        unit: {
          display: 'kg',
          ucumCode: 'kg',
        },
        contextValues: [],
        timeScopeId: 'time-scope.current',
        source: {
          kind: 'measurement',
          sourceInstanceId: 'patient-scene-source-instance.test.result-attachment.preexisting',
        },
        interpretation: {
          kind: 'not_interpreted',
        },
        resolution: {
          origin: 'authored',
          ownerId: 'patient-template.test.result-attachment.preexisting',
          ownerContentVersion: '1.0.0',
        },
      },
    ];
    const preexistingComposition = expectComposition(preexistingRequest);
    const preexistingCollection = makeClinicalResultCollection(
      preexistingComposition.composedPatientState!.id,
    );
    expect(
      attachPatientClinicalResults({
        schemaVersion: 1,
        id: 'patient-clinical-result-attachment-request.test.preexisting',
        patientStateCompositionArtifact: preexistingComposition,
        templateClinicalResultRecipeCompilation: compileTestPatientTemplateClinicalResultRecipe({
          coordinate: 'result-attachment.preexisting',
          patientStateCompositionArtifact: preexistingComposition,
          resultCollectionCompilation: preexistingCollection,
        }),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PREEXISTING_RESULT_LANE' },
    });

    expect(
      attachPatientClinicalResults({
        schemaVersion: 1,
        id: 'patient-clinical-result-attachment-request.test.raw-collection',
        patientStateCompositionArtifact: composition,
        resultCollectionCompilation: collection,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const differentTemplate = {
      ...makeTemplate(),
      id: 'patient-template.test.patient-state-composition.different',
      internalLabel: 'Synthetic different template for D-321 mismatch proof',
    };
    expect(
      attachPatientClinicalResults({
        schemaVersion: 1,
        id: 'patient-clinical-result-attachment-request.test.template-mismatch',
        patientStateCompositionArtifact: composition,
        templateClinicalResultRecipeCompilation: compileTestPatientTemplateClinicalResultRecipe({
          coordinate: 'result-attachment.template-mismatch',
          patientStateCompositionArtifact: composition,
          resultCollectionCompilation: collection,
          templateOverride: differentTemplate,
        }),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'TEMPLATE_CONTEXT_MISMATCH' },
    });

    const invalidRecipe = structuredClone(
      compileTestPatientTemplateClinicalResultRecipe({
        coordinate: 'result-attachment.invalid-recipe',
        patientStateCompositionArtifact: composition,
        resultCollectionCompilation: collection,
      }),
    );
    invalidRecipe.compileRequest.resultCollectionCompilation.inputFingerprint =
      'fingerprint.patient-clinical-result-collection-compilation.input.fnv1a64.0000000000000000';
    expect(
      attachPatientClinicalResults({
        schemaVersion: 1,
        id: 'patient-clinical-result-attachment-request.test.invalid-recipe',
        patientStateCompositionArtifact: composition,
        templateClinicalResultRecipeCompilation: invalidRecipe,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'TEMPLATE_CLINICAL_RESULT_RECIPE_INVALID' },
    });
  });

  it('detects upstream and retained-output tampering', () => {
    const composition = expectComposition(makeScenario([]).request);
    const collection = makeClinicalResultCollection(composition.composedPatientState!.id);
    const result = attachPatientClinicalResults({
      schemaVersion: 1,
      id: 'patient-clinical-result-attachment-request.test.tamper',
      patientStateCompositionArtifact: composition,
      templateClinicalResultRecipeCompilation: compileTestPatientTemplateClinicalResultRecipe({
        coordinate: 'result-attachment.tamper',
        patientStateCompositionArtifact: composition,
        resultCollectionCompilation: collection,
      }),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);

    const upstreamTamper = structuredClone(result.value);
    upstreamTamper.attachmentRequest.patientStateCompositionArtifact.inputFingerprint =
      'fingerprint.resolved-patient-state-composition.input.fnv1a64.0000000000000000';
    expect(verifyPatientClinicalResultAttachmentIntegrity(upstreamTamper)).toMatchObject({
      ok: false,
      error: { code: 'INPUT_FINGERPRINT_MISMATCH' },
    });

    const retainedTamper = structuredClone(result.value);
    retainedTamper.composedPatientState.measurements[0]!.value = 91.7;
    expect(verifyPatientClinicalResultAttachmentIntegrity(retainedTamper)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });
});

const makeDurationSourceValidation = (composition: ReturnType<typeof expectComposition>) => {
  const baseState = composition.composedPatientState!;
  const coordinate = baseState.id.split('.').at(-1)!;
  const sourceHorizon = expectPatientSceneSourceHorizon(baseState.id, [
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'patient-scene-source-definition.test.post-composition.patient-report',
      kind: 'patient_report',
    },
  ]);
  const sourceInstance = sourceHorizon.sourceInstances[0]!;
  const durationResolution = expectDurationResolution({
    patientStateId: baseState.id,
    condition: baseState.conditionStates[0]!,
    profileSuffix: `post-composition-${coordinate}`,
    requestSuffix: `post-composition-${coordinate}`,
    seed: 'seed.test.post-composition-duration',
    source: {
      kind: sourceInstance.kind,
      sourceInstanceId: sourceInstance.id,
    },
  });
  const attachment = expectDurationAttachment(composition, [durationResolution]);
  const sourceValidation = validateConditionClinicalDurationSources({
    schemaVersion: 1,
    id: `condition-clinical-duration-source-validation-request.test.post-composition.${coordinate}`,
    durationAttachment: attachment,
    sourceInstanceCompilation: sourceHorizon,
  });
  if (!sourceValidation.ok) throw new Error(sourceValidation.error.message);
  return sourceValidation.value;
};

const makeFunctionalImpairmentSourceValidation = (
  composition: ReturnType<typeof expectComposition>,
) => {
  const baseState = composition.composedPatientState!;
  const coordinate = baseState.id.split('.').at(-1)!;
  const sourceHorizon = expectPatientSceneSourceHorizon(baseState.id, [
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'patient-scene-source-definition.test.post-composition.functional-impairment',
      kind: 'patient_report',
    },
  ]);
  const sourceInstance = sourceHorizon.sourceInstances[0]!;
  const impairmentResolution = expectFunctionalImpairmentResolution({
    patientStateId: baseState.id,
    condition: baseState.conditionStates[0]!,
    profileSuffix: `post-composition-${coordinate}`,
    requestSuffix: `post-composition-${coordinate}`,
    seed: 'seed.test.post-composition-functional-impairment',
    source: {
      kind: sourceInstance.kind,
      sourceInstanceId: sourceInstance.id,
    },
  });
  const attachment = expectFunctionalImpairmentAttachment(composition, [impairmentResolution]);
  const sourceValidation = validateConditionFunctionalImpairmentSources({
    schemaVersion: 1,
    id: `condition-functional-impairment-source-validation-request.test.post-composition.${coordinate}`,
    functionalImpairmentAttachment: attachment,
    sourceInstanceCompilation: sourceHorizon,
  });
  if (!sourceValidation.ok) throw new Error(sourceValidation.error.message);
  return sourceValidation.value;
};

const makeClinicalResultAttachment = (composition: ReturnType<typeof expectComposition>) => {
  const baseState = composition.composedPatientState!;
  const collection = makeClinicalResultCollection(baseState.id);
  const result = attachPatientClinicalResults({
    schemaVersion: 1,
    id: `patient-clinical-result-attachment-request.test.post-composition.${baseState.id
      .split('.')
      .at(-1)}`,
    patientStateCompositionArtifact: composition,
    templateClinicalResultRecipeCompilation: compileTestPatientTemplateClinicalResultRecipe({
      coordinate: `post-composition.${baseState.id.split('.').at(-1)}`,
      patientStateCompositionArtifact: composition,
      resultCollectionCompilation: collection,
    }),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('D-312/D-314 post-composition patient-state assembly', () => {
  it('composes exact D-294 duration, D-292 impairment, and D-311 result owners', () => {
    const composition = expectComposition(makeScenario([]).request);
    const baseState = structuredClone(composition.composedPatientState!);
    const durationValidation = makeDurationSourceValidation(composition);
    const impairmentValidation = makeFunctionalImpairmentSourceValidation(composition);
    const resultAttachment = makeClinicalResultAttachment(composition);
    const request = {
      schemaVersion: 1 as const,
      id: 'post-composition-patient-state-assembly-request.test.complete',
      patientStateCompositionArtifact: composition,
      conditionClinicalDurationSourceValidationArtifact: durationValidation,
      conditionFunctionalImpairmentSourceValidationArtifact: impairmentValidation,
      patientClinicalResultAttachmentArtifact: resultAttachment,
    };
    const first = assemblePostCompositionPatientState(request);
    const replay = assemblePostCompositionPatientState(request);

    expect(first.ok).toBe(true);
    expect(replay).toEqual(first);
    if (!first.ok) throw new Error(first.error.message);
    expect(PostCompositionPatientStateAssemblyArtifactSchema.parse(first.value)).toEqual(
      first.value,
    );
    expect(first.value.composedPatientState.id).not.toBe(baseState.id);
    expect(first.value.composedPatientState.clinicalDurations).toEqual(
      durationValidation.compileRequest.durationAttachment.composedPatientState.clinicalDurations,
    );
    expect(first.value.composedPatientState.functionalImpairments).toEqual(
      impairmentValidation.compileRequest.functionalImpairmentAttachment
        .attachedFunctionalImpairments,
    );
    expect(first.value.composedPatientState.measurements).toEqual(
      resultAttachment.composedPatientState.measurements,
    );
    expect(first.value.attachedRecordIds).toEqual({
      clinicalDurationIds:
        durationValidation.compileRequest.durationAttachment.composedPatientState.clinicalDurations.map(
          (record) => record.id,
        ),
      functionalImpairmentIds:
        impairmentValidation.compileRequest.functionalImpairmentAttachment.attachedFunctionalImpairments.map(
          (record) => record.id,
        ),
      measurementIds: resultAttachment.composedPatientState.measurements.map((record) => record.id),
      categoricalObservationIds: [],
      structuredTestResultIds: [],
    });
    expect(composition.composedPatientState).toEqual(baseState);
    expect(verifyPostCompositionPatientStateAssemblyIntegrity(first.value)).toEqual({
      ok: true,
      value: first.value,
    });
    expect(JSON.stringify(first.value)).not.toMatch(
      /patientInstance|informationActionResult|points?|score|clinical correctness/i,
    );
  }, 15_000);

  it('accepts each typed lane owner alone without fabricating the other lanes', () => {
    const composition = expectComposition(makeScenario([]).request);
    const durationValidation = makeDurationSourceValidation(composition);
    const impairmentValidation = makeFunctionalImpairmentSourceValidation(composition);
    const resultAttachment = makeClinicalResultAttachment(composition);

    const durationOnly = assemblePostCompositionPatientState({
      schemaVersion: 1,
      id: 'post-composition-patient-state-assembly-request.test.duration-only',
      patientStateCompositionArtifact: composition,
      conditionClinicalDurationSourceValidationArtifact: durationValidation,
      conditionFunctionalImpairmentSourceValidationArtifact: null,
      patientClinicalResultAttachmentArtifact: null,
    });
    expect(durationOnly.ok).toBe(true);
    if (!durationOnly.ok) throw new Error(durationOnly.error.message);
    expect(durationOnly.value.composedPatientState.clinicalDurations).toHaveLength(1);
    expect(durationOnly.value.composedPatientState.functionalImpairments).toEqual([]);
    expect(durationOnly.value.composedPatientState.measurements).toEqual([]);

    const impairmentOnly = assemblePostCompositionPatientState({
      schemaVersion: 1,
      id: 'post-composition-patient-state-assembly-request.test.impairment-only',
      patientStateCompositionArtifact: composition,
      conditionClinicalDurationSourceValidationArtifact: null,
      conditionFunctionalImpairmentSourceValidationArtifact: impairmentValidation,
      patientClinicalResultAttachmentArtifact: null,
    });
    expect(impairmentOnly.ok).toBe(true);
    if (!impairmentOnly.ok) throw new Error(impairmentOnly.error.message);
    expect(impairmentOnly.value.composedPatientState.clinicalDurations).toEqual([]);
    expect(impairmentOnly.value.composedPatientState.functionalImpairments).toHaveLength(1);
    expect(impairmentOnly.value.composedPatientState.measurements).toEqual([]);

    const resultOnly = assemblePostCompositionPatientState({
      schemaVersion: 1,
      id: 'post-composition-patient-state-assembly-request.test.result-only',
      patientStateCompositionArtifact: composition,
      conditionClinicalDurationSourceValidationArtifact: null,
      conditionFunctionalImpairmentSourceValidationArtifact: null,
      patientClinicalResultAttachmentArtifact: resultAttachment,
    });
    expect(resultOnly.ok).toBe(true);
    if (!resultOnly.ok) throw new Error(resultOnly.error.message);
    expect(resultOnly.value.composedPatientState.clinicalDurations).toEqual([]);
    expect(resultOnly.value.composedPatientState.functionalImpairments).toEqual([]);
    expect(resultOnly.value.composedPatientState.measurements).toHaveLength(1);
    expect(resultOnly.value.composedPatientState.id).not.toBe(
      durationOnly.value.composedPatientState.id,
    );
    expect(impairmentOnly.value.composedPatientState.id).not.toBe(
      durationOnly.value.composedPatientState.id,
    );
  });

  it('rejects an empty request, crossed D-208 roots, and preexisting base lanes', () => {
    const composition = expectComposition(makeScenario([]).request);
    expect(
      assemblePostCompositionPatientState({
        schemaVersion: 1,
        id: 'post-composition-patient-state-assembly-request.test.empty',
        patientStateCompositionArtifact: composition,
        conditionClinicalDurationSourceValidationArtifact: null,
        conditionFunctionalImpairmentSourceValidationArtifact: null,
        patientClinicalResultAttachmentArtifact: null,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const crossedRequest = makeScenario([]).request;
    crossedRequest.id = 'patient-state-composition-request.test.post-composition.crossed';
    crossedRequest.corePatientState.demographics.ageYears += 1;
    const crossedComposition = expectComposition(crossedRequest);
    expect(
      assemblePostCompositionPatientState({
        schemaVersion: 1,
        id: 'post-composition-patient-state-assembly-request.test.crossed',
        patientStateCompositionArtifact: crossedComposition,
        conditionClinicalDurationSourceValidationArtifact: null,
        conditionFunctionalImpairmentSourceValidationArtifact: null,
        patientClinicalResultAttachmentArtifact: makeClinicalResultAttachment(composition),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'ATTACHMENT_ROOT_MISMATCH' },
    });

    const preexistingRequest = makeScenario([]).request;
    preexistingRequest.id = 'patient-state-composition-request.test.post-composition.preexisting';
    const preexistingImpairment =
      makeFunctionalImpairmentSourceValidation(composition).compileRequest
        .functionalImpairmentAttachment.attachedFunctionalImpairments[0]!;
    preexistingRequest.corePatientState.functionalImpairments = [preexistingImpairment];
    preexistingRequest.corePatientState.measurements = [
      {
        schemaVersion: 1,
        id: 'measurement.test.post-composition.preexisting',
        definitionId: clinicalResultMeasurementDefinition.id,
        definitionContentVersion: clinicalResultMeasurementDefinition.contentVersion,
        value: 80,
        displayValue: '80.0',
        unit: {
          display: 'kg',
          ucumCode: 'kg',
        },
        contextValues: [],
        timeScopeId: 'time-scope.current',
        source: {
          kind: 'measurement',
          sourceInstanceId: 'patient-scene-source-instance.test.post-composition.preexisting',
        },
        interpretation: {
          kind: 'not_interpreted',
        },
        resolution: {
          origin: 'authored',
          ownerId: 'patient-template.test.post-composition.preexisting',
          ownerContentVersion: '1.0.0',
        },
      },
    ];
    const preexistingComposition = expectComposition(preexistingRequest);
    expect(
      assemblePostCompositionPatientState({
        schemaVersion: 1,
        id: 'post-composition-patient-state-assembly-request.test.preexisting',
        patientStateCompositionArtifact: preexistingComposition,
        conditionClinicalDurationSourceValidationArtifact:
          makeDurationSourceValidation(preexistingComposition),
        conditionFunctionalImpairmentSourceValidationArtifact: null,
        patientClinicalResultAttachmentArtifact: null,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'BASE_LANE_NOT_EMPTY' },
    });
  });

  it('detects invalid upstream and retained-output tampering', () => {
    const composition = expectComposition(makeScenario([]).request);
    const durationValidation = makeDurationSourceValidation(composition);
    const impairmentValidation = makeFunctionalImpairmentSourceValidation(composition);
    const result = assemblePostCompositionPatientState({
      schemaVersion: 1,
      id: 'post-composition-patient-state-assembly-request.test.tamper',
      patientStateCompositionArtifact: composition,
      conditionClinicalDurationSourceValidationArtifact: durationValidation,
      conditionFunctionalImpairmentSourceValidationArtifact: impairmentValidation,
      patientClinicalResultAttachmentArtifact: makeClinicalResultAttachment(composition),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);

    const invalidUpstream = structuredClone(durationValidation);
    invalidUpstream.inputFingerprint =
      'fingerprint.condition-clinical-duration-source-validation.input.fnv1a64.0000000000000000';
    expect(
      assemblePostCompositionPatientState({
        ...result.value.assemblyRequest,
        id: 'post-composition-patient-state-assembly-request.test.invalid-upstream',
        conditionClinicalDurationSourceValidationArtifact: invalidUpstream,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'DURATION_SOURCE_VALIDATION_INVALID' },
    });

    const invalidImpairment = structuredClone(impairmentValidation);
    invalidImpairment.inputFingerprint =
      'fingerprint.condition-functional-impairment-source-validation.input.fnv1a64.0000000000000000';
    expect(
      assemblePostCompositionPatientState({
        ...result.value.assemblyRequest,
        id: 'post-composition-patient-state-assembly-request.test.invalid-impairment',
        conditionFunctionalImpairmentSourceValidationArtifact: invalidImpairment,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'FUNCTIONAL_IMPAIRMENT_SOURCE_VALIDATION_INVALID' },
    });

    const retainedTamper = structuredClone(result.value);
    retainedTamper.composedPatientState.measurements[0]!.value = 91.7;
    expect(verifyPostCompositionPatientStateAssemblyIntegrity(retainedTamper)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });
});
