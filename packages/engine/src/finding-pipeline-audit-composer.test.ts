import {
  FindingPipelineAuditArtifactSchema,
  FindingPipelineAuditRequestSchema,
  FacilityMoveWaitingSlotMigrationArtifactSchema,
  EmptyAuthorizedPatientSlotFillArtifactSchema,
  GeneratedCompletedEncounterAttemptPersistenceRecordSchema,
  GeneratedCompletedEncounterAttemptSchema,
  LocationPatientSlotOccupancySnapshotArtifactSchema,
  PatientSlotLifecycleTransitionArtifactSchema,
  PatientSlotRefillReconciliationArtifactSchema,
  PatientSlotFillSeedAuthorityArtifactSchema,
  OptionalComorbidityBridgeArtifactSchema,
  TemplateConditionSelectionArtifactSchema,
  type BackgroundFindingOutcomeProfile,
  type CatalogInstanceCompileRequest,
  type ClinicalRuleReview,
  type ConditionFindingCardinalityProfile,
  type DecisionPolicyDefinition,
  type DecisionRuleCandidateDefinition,
  type EmptyAuthorizedPatientSlotFillCompileInput,
  type FindingDefinition,
  type FindingPipelineAuditRequest,
  type FindingPipelineSharedFindingRecipe,
  type FindingResolutionCandidate,
  type FacilityDefinition,
  type FacilityLocationSuccessorProfile,
  type FacilityMoveWaitingSlotMigrationCompileInput,
  type FrozenGeneratedWaitingSlot,
  type GeneratedCompletedEncounterAttemptCompileInput,
  type GeneratedEncounterActionEventInput,
  type InformationActionDefinition,
  type InstrumentDefinition,
  type LocationDefinition,
  type LocationPatientSlotCapacityArtifact,
  type LocationPatientSlotCapacityCompileRequest,
  type LocationPatientSlotOccupancySnapshotArtifact,
  type LocationPatientSlotCompletionHistoryState,
  type LocationTemplateSelectionArtifact,
  type LocationTemplateSelectionEligibilityOverlay,
  type LocationPatientSlotOccupancySnapshotCompileInput,
  type OptionalComorbidityBridgeProfile,
  type OptionalFindingTextureBridgeProfile,
  type OptionalFeatureBudgetSelectionRequest,
  type OptionalFeatureBudgetSelectionArtifact,
  type PatientOptionalFeatureModuleDefinition,
  type PatientTemplate,
  type PatientSlotFillSeedAuthorityArtifact,
  type PatientSlotFillSeedAuthorityCompileInput,
  type PatientSlotLifecycleTransitionArtifact,
  type PatientSlotLifecycleTransitionCompileInput,
  type PatientSlotRefillReconciliationCompileInput,
  type PatientTemplateLocationAdmissionMatrixArtifact,
  type PatientTemplateLocationAdmissionMatrixRequest,
  type ProgressionMode,
  type PreFindingPatientStateOrchestrationArtifact,
  type PreFindingPatientStateOrchestrationRequest,
  type ResolvedConditionSource,
  type ResolvedPatientState,
  type ResolvedPatientStateCompositionArtifact,
  type StructuredPatientStateRevealDefinition,
  type StructuredSourceReportProfile,
  type StructuredSourceReportSelectionArtifact,
  type StructuredSourceReportSelectionHorizon,
  type StructuredSourceReportSelectionProfile,
  type TemplateConditionSelectionRequest,
  type TemplateConditionSelectionProfile,
  type WeightedFindingTendencyApplicabilityDefinition,
  type WeightedFindingTendencyProfile,
  type UniversalActionResultAssemblyRecipe,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  fingerprintBackgroundFindingHorizon,
  fingerprintBackgroundFindingOutcomeProfile,
  selectBackgroundFindingOutcomes,
} from './background-finding-outcome-selector';
import {
  fingerprintCatalogInstanceRecipe,
  verifyCatalogCompiledInstanceIntegrity,
} from './catalog-instance-compiler';
import {
  fingerprintConditionFindingCardinalityProfile,
  selectConditionFindingCardinalityCandidates,
} from './condition-finding-cardinality-selector';
import {
  composeFindingPipelineAudit,
  verifyFindingPipelineAuditContext,
  verifyFindingPipelineAuditIntegrity,
} from './finding-pipeline-audit-composer';
import { NATIVE_DECISION_BALANCE_COMPILER_VERSION } from './decision-balance';
import {
  compileGeneratedCompletedEncounterAttempt,
  createGeneratedCompletedEncounterAttemptPersistenceRecord,
  verifyGeneratedCompletedEncounterAttemptContext,
  verifyGeneratedCompletedEncounterAttemptIntegrity,
  verifyGeneratedCompletedEncounterAttemptPersistenceRecord,
} from './generated-completed-attempt-compiler';
import {
  compileEmptyAuthorizedPatientSlotFill,
  verifyEmptyAuthorizedPatientSlotFillContext,
  verifyEmptyAuthorizedPatientSlotFillIntegrity,
} from './empty-authorized-patient-slot-fill-compiler';
import {
  compileFacilityMoveWaitingSlotMigration,
  fingerprintFacilityLocationSuccessorFacility,
  verifyFacilityMoveWaitingSlotMigrationContext,
  verifyFacilityMoveWaitingSlotMigrationIntegrity,
} from './facility-move-waiting-slot-migration-compiler';
import {
  compileCapacityBoundLocationTemplateSelectionCertificate,
  compileLocationPatientSlotCapacity,
  verifyCapacityBoundLocationTemplateSelectionCertificateContext,
  verifyCapacityBoundLocationTemplateSelectionCertificateIntegrity,
} from './location-patient-slot-capacity-compiler';
import {
  createLocationTemplateSelectionEligibilityOverlay,
  fingerprintLocationTemplateEligibilitySource,
} from './location-template-selector';
import {
  compileLocationPatientSlotOccupancySnapshot,
  compilePatientSlotFillSeedAuthority,
  getFirstEmptyLocationPatientSlotCoordinateId,
  verifyLocationPatientSlotOccupancySnapshotContext,
  verifyLocationPatientSlotOccupancySnapshotIntegrity,
  verifyPatientSlotFillSeedAuthorityContext,
  verifyPatientSlotFillSeedAuthorityIntegrity,
} from './patient-slot-fill-seed-authority';
import {
  compilePatientSlotLifecycleTransition,
  compilePatientSlotRefillReconciliation,
  createGeneratedEncounterCompletionProof,
  createPatientSlotTemplateEligibilityOverlay,
  fingerprintDeveloperPatientTemplateRunHistoryState,
  verifyGeneratedEncounterCompletionProof,
  verifyPatientSlotLifecycleTransitionContext,
  verifyPatientSlotLifecycleTransitionIntegrity,
  verifyPatientSlotRefillReconciliationContext,
  verifyPatientSlotRefillReconciliationIntegrity,
} from './patient-slot-post-encounter-lifecycle-compiler';
import { compileModePatientTemplateHorizon } from './mode-patient-template-horizon-compiler';
import { bridgeOptionalComorbiditiesFromBudget } from './optional-comorbidity-budget-bridge';
import {
  fingerprintOptionalFindingTextureBridgeProfile,
  fingerprintOptionalFindingTextureReferenceHorizon,
} from './optional-finding-texture-bridge';
import {
  fingerprintOptionalFeatureModuleDefinition,
  selectOptionalFeaturesWithinBudget,
} from './optional-feature-budget-selector';
import { orchestratePreFindingPatientState } from './pre-finding-patient-state-orchestrator';
import {
  compilePatientTemplateLocationAdmissionMatrix,
  fingerprintPatientTemplateLocationAdmissionLocation,
} from './patient-template-location-admission-compiler';
import { compileSelectedLocationOperationalResourceContext } from './selected-location-operational-resource-compiler';
import {
  fingerprintStructuredSourceReportSelectionAssembly,
  fingerprintStructuredSourceReportSelectionHorizon,
  selectStructuredSourceReportBehaviors,
} from './structured-source-report-behavior-selector';
import {
  fingerprintStructuredSourceReportDefinition,
  fingerprintStructuredSourceReportProfile,
} from './structured-source-report-compiler';
import {
  fingerprintTemplateConditionSelectionProfile,
  fingerprintTemplateConditionSelectionTemplate,
  selectTemplateConditions,
} from './template-condition-selector';
import { fingerprintWeightedFindingTendencyProfile } from './weighted-finding-tendency-aggregator';
import {
  compileWeightedFindingTendencyApplicability,
  fingerprintWeightedFindingTendencyApplicabilityDefinition,
} from './weighted-finding-tendency-applicability-compiler';
import { fingerprintInformationActionPayload } from './universal-action-result-compiler';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-29T18:00:00.000Z',
  sourceUseNoteIds: ['source-use.test.finding-pipeline'],
};

const authoredResolution = {
  origin: 'authored',
  ownerId: 'patient-template.test.finding-pipeline',
  ownerContentVersion: '1.0.0',
} as const;

const findingDefinition = (id: string, label: string): FindingDefinition => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id,
  label,
  aliases: [],
  semanticKind: 'history',
  valueSpecification: {
    kind: 'outcome',
    allowedValues: ['present', 'absent', 'subthreshold'],
  },
  allowedPresentationProjections: ['status'],
  lifecycle: 'approved',
  medicalReviewStatus: 'unreviewed',
});

const coreFinding = findingDefinition(
  'finding.history.test.pipeline-low-energy',
  'Current low energy',
);
const textureFinding = findingDefinition(
  'finding.history.test.pipeline-sleep-change',
  'Current sleep change',
);

const opposingCoreFindingCandidate = (): FindingResolutionCandidate => ({
  schemaVersion: 1,
  id: 'finding-candidate.test.pipeline-opposed-low-energy',
  findingDefinitionId: coreFinding.id,
  findingDefinitionContentVersion: coreFinding.contentVersion,
  kind: 'case_critical',
  proposedValue: { kind: 'outcome', value: 'absent' },
  uncertainty: 'none',
  contributions: [
    {
      schemaVersion: 1,
      id: 'finding-contribution.test.pipeline-opposed-low-energy',
      ownerKind: 'patient_template',
      ownerId: 'patient-template.test.finding-pipeline',
      ownerContentVersion: '1.0.0',
      role: 'constraint',
      provenanceIds: ['source-use.test.pipeline-opposed-low-energy'],
    },
  ],
  resolution: authoredResolution,
  review: approvedReview,
});

const depressiveSymptomsAction: InformationActionDefinition = {
  id: 'info.history.test-depressive-symptoms',
  label: 'Depressive symptoms',
  searchAliases: [],
  category: 'history',
  soapSection: 'subjective',
  resultSource: 'patient_report',
  description: 'A neutral synthetic history action.',
  serviceId: 'service.history.basic',
  repeatable: false,
};

const makeUniversalActionResultAssemblyRecipe = (): UniversalActionResultAssemblyRecipe => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'universal-action-result-assembly.test.finding-pipeline',
  modelVersion: 'universal-action-result-assembly.v3',
  actionCatalog: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'information-action-catalog.test.finding-pipeline',
    actions: [depressiveSymptomsAction],
  },
  instrumentDefinitions: [],
  structuredRevealDefinitions: [],
  targetScopedPatientValueProjectionDefinitions: [],
  measurementDefinitions: [],
  categoricalObservationDefinitions: [],
  testDefinitions: [],
  recipes: [
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'universal-action-result-recipe.test.finding-pipeline',
      modelVersion: 'universal-action-result.v1',
      informationActionId: depressiveSymptomsAction.id,
      informationActionPayloadFingerprint:
        fingerprintInformationActionPayload(depressiveSymptomsAction),
      sourceKinds: ['finding_projections'],
      lifecycle: 'approved',
      medicalReviewStatus: 'unreviewed',
    },
  ],
});

const addStructuredReactionReportDefinition = (
  assembly: UniversalActionResultAssemblyRecipe,
): StructuredPatientStateRevealDefinition => {
  const action: InformationActionDefinition = {
    id: 'info.history.test-pipeline-reaction-history',
    label: 'Allergies and adverse reactions',
    searchAliases: [],
    category: 'history',
    soapSection: 'subjective',
    resultSource: 'patient_report',
    description: 'A neutral synthetic reaction-history action.',
    serviceId: 'service.history.basic',
    repeatable: false,
  };
  const informationActionPayloadFingerprint = fingerprintInformationActionPayload(action);
  const definition: StructuredPatientStateRevealDefinition = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'structured-reveal-definition.test.pipeline-reaction-history',
    modelVersion: 'structured-patient-state-reveal.v1',
    label: 'Synthetic reaction history',
    informationActionId: action.id,
    informationActionPayloadFingerprint,
    allowedSourceKinds: ['patient_report'],
    lanes: ['reaction_records'],
    singletonFields: ['reaction_history_status'],
    lifecycle: 'approved',
    review: approvedReview,
  };
  assembly.actionCatalog.actions.push(action);
  assembly.structuredRevealDefinitions.push(definition);
  assembly.recipes.push({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'universal-action-result-recipe.test.pipeline-reaction-history',
    modelVersion: 'universal-action-result.v1',
    informationActionId: action.id,
    informationActionPayloadFingerprint,
    sourceKinds: ['structured_state_reveals'],
    lifecycle: 'approved',
    medicalReviewStatus: 'unreviewed',
  });
  return definition;
};

const selectStructuredReactionReport = (input: {
  readonly template: PatientTemplate;
  readonly assembly: UniversalActionResultAssemblyRecipe;
  readonly definition: StructuredPatientStateRevealDefinition;
  readonly seed: string;
}): StructuredSourceReportSelectionArtifact => {
  const source = {
    kind: 'patient_report' as const,
    sourceInstanceId: 'source-instance.test.pipeline-patient',
  };
  const profile: StructuredSourceReportProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'source-report-profile.test.pipeline-reaction-history',
    modelVersion: 'structured-source-report-profile.v1',
    label: 'Synthetic pipeline reaction history',
    definitionRef: {
      id: input.definition.id,
      contentVersion: input.definition.contentVersion,
    },
    definitionFingerprint: fingerprintStructuredSourceReportDefinition(input.definition),
    source,
    timeScopeId: 'time-scope.longitudinal',
    claimOriginId: 'claim-origin.test.pipeline-reaction-history',
    dependencyGroupIds: [],
    laneBehaviors: [{ lane: 'reaction_records', behavior: 'report_all' }],
    singletonBehaviors: [
      {
        field: 'reaction_history_status',
        presentation: { kind: 'mirror_truth' },
      },
    ],
    developerOpinionIds: ['developer-opinion.test.pipeline-reaction-history'],
    lifecycle: 'approved',
    review: approvedReview,
  };
  const horizon: StructuredSourceReportSelectionHorizon = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'source-report-selection-horizon.test.pipeline-reaction-history',
    modelVersion: 'structured-source-report-selection.v1',
    assemblyRecipeRef: {
      id: input.assembly.id,
      contentVersion: input.assembly.contentVersion,
    },
    assemblyRecipeFingerprint: fingerprintStructuredSourceReportSelectionAssembly(input.assembly),
    pools: [
      {
        id: 'source-view-slot.test.pipeline-reaction-history',
        definitionRef: {
          id: input.definition.id,
          contentVersion: input.definition.contentVersion,
        },
        definitionFingerprint: profile.definitionFingerprint,
        source,
        timeScopeId: profile.timeScopeId,
        claimOriginId: profile.claimOriginId,
        dependencyGroupIds: [],
      },
    ],
    lifecycle: 'approved',
  };
  const selectionProfile: StructuredSourceReportSelectionProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'source-report-selection-profile.test.pipeline-reaction-history',
    modelVersion: 'structured-source-report-selection-profile.v1',
    horizonRef: {
      id: horizon.id,
      contentVersion: horizon.contentVersion,
    },
    horizonFingerprint: fingerprintStructuredSourceReportSelectionHorizon(horizon),
    careSetting: input.template.careSetting,
    policies: [
      {
        slotId: horizon.pools[0]!.id,
        mode: 'fixed',
        candidate: {
          profileRef: {
            id: profile.id,
            contentVersion: profile.contentVersion,
          },
          profileFingerprint: fingerprintStructuredSourceReportProfile(profile),
        },
      },
    ],
    developerOpinionIds: ['developer-opinion.test.pipeline-reaction-history'],
    lifecycle: 'approved',
    review: approvedReview,
  };
  const result = selectStructuredSourceReportBehaviors({
    schemaVersion: 1,
    id: 'source-report-selection-request.test.pipeline-reaction-history',
    seed: input.seed,
    template: input.template,
    assemblyRecipe: input.assembly,
    horizon,
    selectionProfile,
    profiles: [profile],
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const makeBasePatientState = (): ResolvedPatientState => ({
  schemaVersion: 1,
  id: 'resolved-patient-state.test.finding-pipeline',
  demographics: {
    recordVersion: 2,
    ageYears: 42,
    reviewedAgeBandId: 'age-band.middle-adult',
    sexForReference: 'female',
  },
  conditionStates: [],
  diagnosisRecordEntries: [],
  medicationRegimenEntries: [],
  exposureInventory: {
    schemaVersion: 1,
    id: 'resolved-exposure-inventory.test.finding-pipeline',
    useEntries: [],
  },
  treatmentHistory: {
    medicationTrials: [],
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
    id: 'resolved-proposition-state.test.finding-pipeline',
    propositions: [],
    evidence: [],
    dependencyGroups: [],
    beliefAppraisals: [],
  },
  clinicalTagIds: ['clinical-tag.test.pipeline-core-state'],
  reportedSafetyPlanningAbility: 'unassessed',
});

const pipelineSuccessorLocationRef = {
  id: 'location.test.pipeline-outpatient-clinic',
  contentVersion: '1.0.0',
};

const primaryRuleRef = {
  kind: 'medication_regimen_route' as const,
  id: 'route.test.pipeline-mdd-first-line',
  contentVersion: '1.0.0',
  ownerId: 'diagnosis.major-depressive-disorder',
  ownerContentVersion: '1.0.0',
};

const decisionPolicy = (): DecisionPolicyDefinition => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'decision-policy.test.pipeline-mdd-first-line',
  label: 'Synthetic immediate treatment decision',
  focusedDecisionId: 'decision.test.pipeline-immediate-treatment',
  primaryRouteRef: primaryRuleRef,
  explicitSupportingRuleRefs: [],
  developerOpinionIds: [],
  review: approvedReview,
});

const decisionRules = (): DecisionRuleCandidateDefinition[] => [
  {
    schemaVersion: 1,
    ruleRef: primaryRuleRef,
    label: 'Synthetic broad first-line route',
    ruleKind: 'primary_route',
    discoveryLane: 'primary_policy_only',
    patientWhen: {
      type: 'fact',
      fact: {
        recordKind: 'condition',
        identityId: 'diagnosis.major-depressive-disorder',
        identityContentVersion: '1.0.0',
        attributeId: 'condition.presence',
        valueId: 'state.present',
      },
    },
    actionWhen: {
      match: 'any',
      targets: [
        {
          kind: 'medication_start',
          medicationIdentityId: 'medication.bupropion',
        },
      ],
    },
    triggeredInformationPrerequisite: null,
    stance: 'acceptable',
    concernLevel: 'major',
    certaintyLevel: 'moderate',
    effectId: 'effect.test.pipeline-first-line',
    issueId: null,
    specificityPriority: 100,
    rationale: 'Synthetic point-free route used only for a compiler audit.',
    balanceRef: null,
    developerOpinionIds: [],
    review: approvedReview,
  },
  {
    schemaVersion: 1,
    ruleRef: {
      kind: 'diagnosis_rule',
      id: 'rule.test.pipeline-medication-reconciliation-prerequisite',
      contentVersion: '1.0.0',
      ownerId: 'diagnosis.major-depressive-disorder',
      ownerContentVersion: '1.0.0',
    },
    label: 'Synthetic medication-reconciliation prerequisite',
    ruleKind: 'prerequisite',
    discoveryLane: 'automatic_guardrail',
    patientWhen: {
      type: 'fact',
      fact: {
        recordKind: 'condition',
        identityId: 'diagnosis.major-depressive-disorder',
        identityContentVersion: '1.0.0',
        attributeId: 'condition.presence',
        valueId: 'state.present',
      },
    },
    actionWhen: {
      match: 'any',
      targets: [
        {
          kind: 'information_action',
          informationActionId: 'info.history.test-depressive-symptoms',
        },
      ],
    },
    triggeredInformationPrerequisite: {
      schemaVersion: 1,
      policyScope: {
        policyRef: {
          id: 'decision-policy.test.pipeline-mdd-first-line',
          contentVersion: '1.0.0',
        },
        focusedDecisionId: 'decision.test.pipeline-immediate-treatment',
      },
      triggerWhen: {
        match: 'any',
        targets: [{ kind: 'any_medication_start' }],
      },
      fulfillmentWhen: {
        match: 'any',
        targets: [
          {
            kind: 'information_action',
            informationActionId: 'info.history.test-depressive-symptoms',
          },
        ],
      },
    },
    stance: 'required',
    concernLevel: 'major',
    certaintyLevel: 'moderate',
    effectId: null,
    issueId: null,
    specificityPriority: 90,
    rationale: 'Synthetic point-free prerequisite used only to verify D-235 replay.',
    balanceRef: null,
    developerOpinionIds: [],
    review: approvedReview,
  },
];

const makeProjectionRecipe = (includeTextureFinding = true, seed = 'seed.d193-and-d194') => ({
  schemaVersion: 1 as const,
  id: 'finding-compilation-recipe.test.pipeline',
  seed,
  findingDefinitions: includeTextureFinding ? [coreFinding, textureFinding] : [coreFinding],
  propositionDefinitions: [],
  projections: [
    {
      schemaVersion: 1 as const,
      contentVersion: '1.0.0',
      id: 'finding-projection.test.pipeline-low-energy',
      sourceMatch: 'any' as const,
      sourceBindings: [
        {
          kind: 'canonical_finding' as const,
          findingDefinitionId: coreFinding.id,
          findingDefinitionContentVersion: coreFinding.contentVersion,
          allowedStates: ['present' as const],
        },
      ],
      target: {
        kind: 'information_action' as const,
        actionId: 'info.history.test-depressive-symptoms',
      },
      response: {
        kind: 'finding_outcome' as const,
        outcome: 'present' as const,
      },
      expressionBankId: 'finding-expression-bank.test.pipeline-low-energy',
      expressionBankContentVersion: '1.0.0',
      review: approvedReview,
    },
  ],
  expressionBanks: [
    {
      schemaVersion: 1 as const,
      contentVersion: '1.0.0',
      id: 'finding-expression-bank.test.pipeline-low-energy',
      label: 'Synthetic low-energy wording',
      displayChannels: ['patient_history' as const],
      variants: [
        {
          id: 'finding-expression.test.pipeline-low-energy',
          text: 'Low energy',
        },
        {
          id: 'finding-expression.test.pipeline-tired',
          text: 'Tired',
        },
      ],
      lifecycle: 'approved' as const,
      medicalReviewStatus: 'approved' as const,
    },
  ],
  projectionHorizon: {
    schemaVersion: 1 as const,
    id: 'finding-projection-horizon.test.pipeline',
    targets: [
      {
        target: {
          kind: 'information_action' as const,
          actionId: 'info.history.test-depressive-symptoms',
        },
        allowedResponses: [
          {
            kind: 'finding_outcome' as const,
            outcome: 'present' as const,
          },
        ],
        expressionDisplayChannel: 'patient_history' as const,
      },
    ],
  },
});

const addSyntheticInstrumentResponse = (
  sharedFindingRecipe: FindingPipelineSharedFindingRecipe,
  assembly: UniversalActionResultAssemblyRecipe,
): InstrumentDefinition => {
  const itemId = 'instrument-item.test.pipeline-low-energy';
  const responseOptionId = 'response-option.test.pipeline-present';
  const instrument: InstrumentDefinition = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'instrument.test.pipeline-depression-scale',
    modelVersion: 'instrument-item-response-only.v1',
    rightsBoundaryId: 'rights-boundary.test.public',
    items: [
      {
        id: itemId,
        responseScaleId: 'response-scale.test.pipeline-binary',
        responseOptionIds: [responseOptionId],
        informationActionId: depressiveSymptomsAction.id,
        respondentSourceKind: 'patient_report',
        timeScopeId: 'time-scope.current',
      },
    ],
    lifecycle: 'approved',
    medicalReviewStatus: 'approved',
  };
  const baseProjection = sharedFindingRecipe.projections[0]!;
  sharedFindingRecipe.projections.push({
    ...baseProjection,
    id: 'finding-projection.test.pipeline-instrument-low-energy',
    target: {
      kind: 'instrument_item',
      instrumentDefinitionId: instrument.id,
      instrumentContentVersion: instrument.contentVersion,
      itemId,
    },
    response: {
      kind: 'response_option',
      responseOptionId,
    },
    expressionBankId: null,
    expressionBankContentVersion: null,
  });
  sharedFindingRecipe.projectionHorizon.targets.push({
    target: {
      kind: 'instrument_item',
      instrumentDefinitionId: instrument.id,
      instrumentContentVersion: instrument.contentVersion,
      itemId,
    },
    allowedResponses: [{ kind: 'response_option', responseOptionId }],
    expressionDisplayChannel: null,
  });
  assembly.instrumentDefinitions.push(instrument);
  assembly.recipes[0]!.sourceKinds.push('instrument_item_responses');
  return instrument;
};

const makeTemplate = (
  recipeFingerprints: ReturnType<typeof fingerprintCatalogInstanceRecipe>,
  includeOptionalComorbidity = false,
  includeOptionalFindingTexture = false,
): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-template.test.finding-pipeline',
  compilationMode: 'attachment_only.v6',
  careSetting: 'outpatient_psychiatry',
  internalLabel: 'Synthetic finding-pipeline audit template',
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
  review: approvedReview,
  patientPool: 'starter',
  focusedDecisionId: 'decision.test.pipeline-immediate-treatment',
  primaryPolicyRef: {
    id: 'decision-policy.test.pipeline-mdd-first-line',
    contentVersion: '1.0.0',
  },
  decisionActionHorizonId: 'decision-action-horizon.test.pipeline',
  decisionActionHorizonFingerprint: recipeFingerprints.decisionActionHorizonFingerprint,
  diagnosisSelectionHorizonId: 'diagnosis-selection-horizon.test.pipeline',
  diagnosisSelectionHorizonFingerprint: recipeFingerprints.diagnosisSelectionHorizonFingerprint,
  findingProjectionHorizonId: 'finding-projection-horizon.test.pipeline',
  findingProjectionHorizonFingerprint: recipeFingerprints.findingProjectionHorizonFingerprint,
  universalActionResultAssemblyRecipeRef: {
    id: 'universal-action-result-assembly.test.finding-pipeline',
    contentVersion: '1.0.0',
  },
  universalActionResultAssemblyRecipeFingerprint:
    recipeFingerprints.universalActionResultAssemblyRecipeFingerprint,
  compatibleLocationRefs: [
    {
      id: 'location.test.pipeline-solo-office',
      contentVersion: '1.0.0',
    },
    pipelineSuccessorLocationRef,
  ],
  requiredConditions: [
    {
      schemaVersion: 1,
      id: 'template-condition.test.pipeline-mdd',
      diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      encounterRelevance: 'focus',
      severityId: 'diagnosis-severity.mdd.moderate',
      specifierIds: [],
    },
  ],
  optionalConditionSelectionGroups: includeOptionalComorbidity
    ? [
        {
          schemaVersion: 1,
          id: 'template-condition-group.test.pipeline-comorbidity',
          minimumSelections: 0,
          maximumSelections: 1,
          candidates: [
            {
              schemaVersion: 1,
              id: 'template-condition.test.pipeline-anxiety',
              diagnosisDefinitionId: 'diagnosis.test.pipeline-anxiety',
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
    additionalFeatureBudget: includeOptionalComorbidity || includeOptionalFindingTexture ? 1 : 0,
    maximumSelectedModules: includeOptionalComorbidity || includeOptionalFindingTexture ? 1 : 0,
    selectedModules: [],
    targetEnvelope: null,
  },
  presentationRichnessEnvelope: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'presentation-richness.test.finding-pipeline',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['diagnostic_attribution'],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const makeConditionSelectionRequest = (
  template: PatientTemplate,
  seed = 'seed.d196',
): TemplateConditionSelectionRequest => {
  const profile: TemplateConditionSelectionProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'generation-profile.test.pipeline-condition-selection',
    modelVersion: 'weighted-template-condition-selection.v1',
    templateRef: {
      id: template.id,
      contentVersion: template.contentVersion,
    },
    templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
    groupProfiles: [],
    incompatibilities: [],
  };
  return {
    schemaVersion: 1,
    id: 'template-condition-selection-request.test.pipeline',
    template,
    profile,
    seed,
  };
};

const selectConditions = (template: PatientTemplate, seed = 'seed.d196') => {
  const result = selectTemplateConditions(makeConditionSelectionRequest(template, seed));
  if (!result.ok) {
    throw new Error('error' in result ? result.error.message : result.conflict.code);
  }
  return result.value;
};

const selectEmptyOptionalFeatures = (
  template: PatientTemplate,
  seed = 'seed.d196',
): OptionalFeatureBudgetSelectionArtifact => {
  const result = selectOptionalFeaturesWithinBudget({
    schemaVersion: 1,
    id: 'optional-feature-budget-request.test.finding-pipeline.empty',
    template: structuredClone(template),
    moduleDefinitions: [],
    profile: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'optional-feature-profile.test.finding-pipeline.empty',
      modelVersion: 'weighted-optional-feature-budget-selection.v1',
      templateRef: {
        id: template.id,
        contentVersion: template.contentVersion,
      },
      templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
      countWeights: [{ schemaVersion: 1, selectionCount: 0, gameSelectionWeight: 1 }],
      candidateBindings: [],
      incompatibilities: [],
      review: approvedReview,
    },
    seed,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const selectFindingTextureOptionalFeature = (
  template: PatientTemplate,
  seed = 'seed.d201.selected-finding-texture',
): OptionalFeatureBudgetSelectionArtifact => {
  const moduleDefinition: PatientOptionalFeatureModuleDefinition = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-feature.test.pipeline-finding-texture',
    label: 'Synthetic sleep-change texture',
    moduleKind: 'finding_texture',
    lifecycle: 'approved',
    medicalReviewStatus: 'approved',
    review: approvedReview,
  };
  const moduleFingerprint = fingerprintOptionalFeatureModuleDefinition(moduleDefinition);
  const result = selectOptionalFeaturesWithinBudget({
    schemaVersion: 1,
    id: 'optional-feature-budget-request.test.finding-pipeline-texture',
    template: structuredClone(template),
    moduleDefinitions: [moduleDefinition],
    profile: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'optional-feature-profile.test.finding-pipeline-texture',
      modelVersion: 'weighted-optional-feature-budget-selection.v1',
      templateRef: {
        id: template.id,
        contentVersion: template.contentVersion,
      },
      templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
      countWeights: [
        { schemaVersion: 1, selectionCount: 0, gameSelectionWeight: 1 },
        { schemaVersion: 1, selectionCount: 1, gameSelectionWeight: 10_000 },
      ],
      candidateBindings: [
        {
          schemaVersion: 1,
          id: 'optional-feature-binding.test.pipeline-finding-texture',
          moduleRef: {
            id: moduleDefinition.id,
            contentVersion: moduleDefinition.contentVersion,
          },
          moduleFingerprint,
          selectedModuleId: 'patient-optional-feature.test.pipeline-finding-texture',
          cost: 1,
          impact: 'background',
          complexityContributions: [
            {
              id: 'complexity-contribution.test.pipeline-finding-texture',
              label: 'Synthetic diagnostic texture',
              dimension: 'diagnostic',
              weight: 1,
              review: approvedReview,
            },
          ],
          gameSelectionWeight: 10_000,
          review: approvedReview,
        },
      ],
      incompatibilities: [],
      review: approvedReview,
    },
    seed,
  });
  if (!result.ok || result.value.selectedCount !== 1) {
    throw new Error(
      result.ok ? 'Expected one selected synthetic finding-texture module.' : result.error.message,
    );
  }
  return result.value;
};

const makeFindingTextureBridgeInput = (
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
): NonNullable<PreFindingPatientStateOrchestrationRequest['findingTextureBridgeInput']> => {
  const referenceHorizon = {
    schemaVersion: 1 as const,
    contentVersion: '1.0.0',
    id: 'finding-texture-horizon.test.finding-pipeline',
    findingDefinitionRefs: [
      {
        id: textureFinding.id,
        contentVersion: textureFinding.contentVersion,
      },
    ],
  };
  const binding = optionalArtifact.selectionRequest.profile.candidateBindings[0]!;
  const bridgeProfile: OptionalFindingTextureBridgeProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-finding-texture-profile.test.finding-pipeline',
    modelVersion: 'selected-optional-finding-texture.v1',
    templateRef: optionalArtifact.templateRef,
    templateFingerprint: optionalArtifact.templateFingerprint,
    optionalFeatureProfileRef: optionalArtifact.profileRef,
    optionalFeatureProfileFingerprint: optionalArtifact.profileFingerprint,
    referenceHorizonRef: {
      id: referenceHorizon.id,
      contentVersion: referenceHorizon.contentVersion,
    },
    referenceHorizonFingerprint:
      fingerprintOptionalFindingTextureReferenceHorizon(referenceHorizon),
    mappings: [
      {
        schemaVersion: 1,
        id: 'optional-finding-texture-mapping.test.finding-pipeline',
        moduleRef: binding.moduleRef,
        moduleFingerprint: binding.moduleFingerprint,
        optionalFeatureBindingId: binding.id,
        selectedModuleId: binding.selectedModuleId,
        outcomes: [
          {
            schemaVersion: 1,
            id: 'optional-finding-texture-outcome.test.finding-pipeline',
            findingDefinitionId: textureFinding.id,
            findingDefinitionContentVersion: textureFinding.contentVersion,
            proposedValue: { kind: 'outcome', value: 'subthreshold' },
            uncertainty: 'none',
            developerOpinionIds: ['developer-opinion.test.pipeline-finding-texture'],
            review: approvedReview,
          },
        ],
      },
    ],
    review: approvedReview,
  };
  expect(fingerprintOptionalFindingTextureBridgeProfile(bridgeProfile)).toMatch(
    /^fingerprint\.optional-finding-texture-bridge\./,
  );
  return {
    schemaVersion: 1,
    id: 'optional-finding-texture-request.test.finding-pipeline',
    referenceHorizon,
    findingDefinitions: [textureFinding],
    bridgeProfile,
  };
};

const selectBridgedConditionSource = (
  template: PatientTemplate,
  createConditionConflict = false,
  seed = 'seed.d201.selected-comorbidity',
): {
  readonly conditionSource: ResolvedConditionSource;
  readonly optionalFeatureArtifact: OptionalFeatureBudgetSelectionArtifact;
} => {
  const moduleDefinition: PatientOptionalFeatureModuleDefinition = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-feature.test.pipeline-anxiety',
    label: 'Synthetic contributing anxiety condition',
    moduleKind: 'comorbidity',
    lifecycle: 'approved',
    medicalReviewStatus: 'approved',
    review: approvedReview,
  };
  const moduleFingerprint = fingerprintOptionalFeatureModuleDefinition(moduleDefinition);
  const optionalRequest = (seed: string): OptionalFeatureBudgetSelectionRequest => ({
    schemaVersion: 1,
    id: 'optional-feature-budget-request.test.finding-pipeline',
    template: structuredClone(template),
    moduleDefinitions: [moduleDefinition],
    profile: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'optional-feature-profile.test.finding-pipeline',
      modelVersion: 'weighted-optional-feature-budget-selection.v1',
      templateRef: {
        id: template.id,
        contentVersion: template.contentVersion,
      },
      templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
      // This integration fixture must materialize its one optional condition. The schema still
      // requires an explicit zero-count lane; D-201 variety distribution is tested separately.
      countWeights: [
        { schemaVersion: 1, selectionCount: 0, gameSelectionWeight: 1 },
        { schemaVersion: 1, selectionCount: 1, gameSelectionWeight: 10_000 },
      ],
      candidateBindings: [
        {
          schemaVersion: 1,
          id: 'optional-feature-binding.test.pipeline-anxiety',
          moduleRef: {
            id: moduleDefinition.id,
            contentVersion: moduleDefinition.contentVersion,
          },
          moduleFingerprint,
          selectedModuleId: 'patient-optional-feature.test.pipeline-anxiety',
          cost: 1,
          impact: 'fit_modifier',
          complexityContributions: [
            {
              id: 'complexity-contribution.test.pipeline-anxiety',
              label: 'Synthetic diagnostic complexity',
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
  });
  const optionalSelection = selectOptionalFeaturesWithinBudget(optionalRequest(seed));
  if (!optionalSelection.ok || optionalSelection.value.selectedCount !== 1) {
    throw new Error(
      optionalSelection.ok
        ? `Expected ${seed} to select the deterministic one-comorbidity D-201 fixture.`
        : optionalSelection.error.message,
    );
  }
  const optionalArtifact = optionalSelection.value;

  const conditionProfile: TemplateConditionSelectionProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'generation-profile.test.pipeline-bridged-conditions',
    modelVersion: 'weighted-template-condition-selection.v1',
    templateRef: {
      id: template.id,
      contentVersion: template.contentVersion,
    },
    templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
    groupProfiles: [
      {
        schemaVersion: 1,
        id: 'condition-profile-group.test.pipeline-comorbidity',
        groupId: 'template-condition-group.test.pipeline-comorbidity',
        countWeights: [
          { schemaVersion: 1, selectionCount: 0, gameSelectionWeight: 1 },
          { schemaVersion: 1, selectionCount: 1, gameSelectionWeight: 1 },
        ],
        candidateWeights: [
          {
            schemaVersion: 1,
            templateConditionId: 'template-condition.test.pipeline-anxiety',
            gameSelectionWeight: 1,
          },
        ],
      },
    ],
    incompatibilities: createConditionConflict
      ? [
          {
            schemaVersion: 1,
            id: 'condition-incompatibility.test.pipeline-anxiety-versus-focus',
            leftTemplateConditionId: 'template-condition.test.pipeline-anxiety',
            rightTemplateConditionId: 'template-condition.test.pipeline-mdd',
            reason: 'Synthetic literal condition conflict used only to verify blocker propagation.',
            review: approvedReview,
          },
        ]
      : [],
  };
  const conditionSelectionRequest = {
    schemaVersion: 1 as const,
    id: 'condition-selection-request.test.pipeline-bridged',
    template: structuredClone(template),
    profile: conditionProfile,
    seed: optionalArtifact.selectionRequest.seed,
  };
  const optionalBinding = optionalArtifact.selectionRequest.profile.candidateBindings[0]!;
  const bridgeProfile: OptionalComorbidityBridgeProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'bridge-profile.test.finding-pipeline',
    modelVersion: 'optional-comorbidity-condition-bridge.v1',
    templateRef: {
      id: template.id,
      contentVersion: template.contentVersion,
    },
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
        id: 'optional-comorbidity-mapping.test.pipeline-anxiety',
        moduleRef: optionalBinding.moduleRef,
        moduleFingerprint: optionalBinding.moduleFingerprint,
        optionalFeatureBindingId: optionalBinding.id,
        selectedModuleId: optionalBinding.selectedModuleId,
        groupId: 'template-condition-group.test.pipeline-comorbidity',
        templateConditionId: 'template-condition.test.pipeline-anxiety',
        review: approvedReview,
      },
    ],
    review: approvedReview,
  };
  const result = bridgeOptionalComorbiditiesFromBudget({
    schemaVersion: 1,
    id: 'optional-comorbidity-bridge-request.test.finding-pipeline',
    optionalFeatureArtifact: optionalArtifact,
    conditionSelectionRequest,
    bridgeProfile,
  });
  if (!result.ok && 'error' in result) throw new Error(result.error.message);
  const bridgeArtifact = result.ok ? result.value : result.conflict.artifact;
  return {
    optionalFeatureArtifact: optionalArtifact,
    conditionSource: {
      schemaVersion: 1,
      sourceKind: 'optional_comorbidity_bridge',
      artifact: bridgeArtifact,
    },
  };
};

const makeCorePatientState = (conditionSource: ResolvedConditionSource): ResolvedPatientState => {
  const corePatientState = makeBasePatientState();
  const requiredConditionStateIds = new Set(
    conditionSource.artifact.conditionBindings
      .filter((binding) => binding.kind === 'required')
      .map((binding) => binding.conditionStateId),
  );
  corePatientState.conditionStates = conditionSource.artifact.conditionStates.filter((state) =>
    requiredConditionStateIds.has(state.id),
  );
  return corePatientState;
};

const orchestratePatientState = (input: {
  readonly requestId: string;
  readonly conditionSource: ResolvedConditionSource;
  readonly optionalFeatureArtifact: OptionalFeatureBudgetSelectionArtifact;
  readonly findingTextureBridgeInput?: NonNullable<
    PreFindingPatientStateOrchestrationRequest['findingTextureBridgeInput']
  >;
}): PreFindingPatientStateOrchestrationArtifact => {
  const conditionSourcePlan =
    input.conditionSource.sourceKind === 'template_condition_selection'
      ? {
          sourceKind: 'template_condition_selection' as const,
          conditionSelectionRequest: makeConditionSelectionRequest(
            input.optionalFeatureArtifact.selectionRequest.template,
            input.optionalFeatureArtifact.selectionRequest.seed,
          ),
        }
      : {
          sourceKind: 'optional_comorbidity_bridge' as const,
          conditionSelectionRequest:
            input.conditionSource.artifact.bridgeRequest.conditionSelectionRequest,
          bridgeProfile: input.conditionSource.artifact.bridgeRequest.bridgeProfile,
        };
  const result = orchestratePreFindingPatientState({
    schemaVersion: 1,
    id: input.requestId,
    optionalFeatureSelectionRequest: input.optionalFeatureArtifact.selectionRequest,
    conditionSourcePlan,
    corePatientState: makeCorePatientState(input.conditionSource),
    reactionHistoryOwnership: 'core_locked',
    reactionHistoryBridgeInput: null,
    priorTreatmentBridgeInput: null,
    exposureBridgeInput: null,
    findingTextureBridgeInput: input.findingTextureBridgeInput ?? null,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const selectConditionFindings = (conditionSource: ResolvedConditionSource, seed = 'seed.d197') => {
  const conditionState = conditionSource.artifact.conditionStates.find(
    (state) => state.diagnosisDefinitionId === 'diagnosis.major-depressive-disorder',
  );
  if (conditionState === undefined) {
    throw new Error('Expected the synthetic MDD condition state.');
  }
  const profile: ConditionFindingCardinalityProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'condition-finding-profile.test.pipeline-mdd',
    modelVersion: 'condition-finding-cardinality.v1',
    conditionScope: {
      diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      severity: {
        kind: 'exact',
        severityId: 'diagnosis-severity.mdd.moderate',
      },
      requiredSpecifierIds: [],
    },
    requiredOutcomes: [
      {
        schemaVersion: 1,
        id: 'condition-finding-requirement.test.pipeline-low-energy',
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
    id: 'condition-finding-cardinality-request.test.pipeline',
    conditionSource,
    profiles: [profile],
    conditionProfileBindings: [
      {
        schemaVersion: 1,
        id: 'condition-finding-binding.test.pipeline-mdd',
        conditionStateId: conditionState.id,
        profileRef: {
          id: profile.id,
          contentVersion: profile.contentVersion,
        },
        profileFingerprint: fingerprintConditionFindingCardinalityProfile(profile),
      },
    ],
    findingDefinitions: [coreFinding],
    seed,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const selectBackground = (
  conditionFinding: ReturnType<typeof selectConditionFindings>,
  targetFinding: FindingDefinition = textureFinding,
  seed = 'seed.d198',
) => {
  const targetSlug = targetFinding.id === coreFinding.id ? 'low-energy' : 'sleep';
  const profile: BackgroundFindingOutcomeProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `background-finding-profile.test.pipeline-${targetSlug}`,
    modelVersion: 'weighted-background-finding.v1',
    findingDefinitionId: targetFinding.id,
    findingDefinitionContentVersion: targetFinding.contentVersion,
    outcomes: [
      {
        schemaVersion: 1,
        id: 'background-finding-outcome.test.pipeline-sleep.absent',
        proposedValue: { kind: 'outcome', value: 'absent' },
        uncertainty: 'none',
        gameGenerationWeight: 6,
      },
      {
        schemaVersion: 1,
        id: 'background-finding-outcome.test.pipeline-sleep.subthreshold',
        proposedValue: { kind: 'outcome', value: 'subthreshold' },
        uncertainty: 'none',
        gameGenerationWeight: 3,
      },
      {
        schemaVersion: 1,
        id: 'background-finding-outcome.test.pipeline-sleep.present',
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
    id: 'background-finding-horizon.test.pipeline',
    targets: [
      {
        schemaVersion: 1 as const,
        id: `background-finding-target.test.pipeline-${targetSlug}`,
        findingDefinitionId: targetFinding.id,
        findingDefinitionContentVersion: targetFinding.contentVersion,
      },
    ],
  };
  const result = selectBackgroundFindingOutcomes({
    schemaVersion: 1,
    id: 'background-finding-outcome-request.test.pipeline',
    conditionFindingArtifact: conditionFinding,
    horizon,
    profiles: [profile],
    profileBindings: [
      {
        schemaVersion: 1,
        id: `background-finding-binding.test.pipeline-${targetSlug}`,
        horizonTargetId: horizon.targets[0]!.id,
        profileRef: {
          id: profile.id,
          contentVersion: profile.contentVersion,
        },
        profileFingerprint: fingerprintBackgroundFindingOutcomeProfile(profile),
      },
    ],
    findingDefinitions: [targetFinding],
    seed,
  });
  if (!result.ok) throw new Error(result.error.message);
  expect(fingerprintBackgroundFindingHorizon(horizon)).toBe(result.value.horizonRef.fingerprint);
  return result.value;
};

const compileWeightedTendencyApplicability = (
  patientStateCompositionArtifact: ResolvedPatientStateCompositionArtifact,
  background: ReturnType<typeof selectBackground>,
  targetFinding: FindingDefinition = textureFinding,
  matchingDiagnosisId = 'diagnosis.major-depressive-disorder',
  contributorCount = 1,
) => {
  const targetSlug = targetFinding.id === coreFinding.id ? 'low-energy' : 'sleep';
  const entries = Array.from({ length: contributorCount }, (_, index) => {
    const suffix = contributorCount === 1 ? targetSlug : `${targetSlug}-${index + 1}`;
    const profile: WeightedFindingTendencyProfile = {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: `weighted-finding-tendency-profile.test.pipeline-${suffix}`,
      modelVersion: 'additive-categorical-finding-tendency.v1',
      findingDefinitionId: targetFinding.id,
      findingDefinitionContentVersion: targetFinding.contentVersion,
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
          addedGameGenerationWeight: 7,
        },
      ],
      developerOpinionIds: [],
      review: approvedReview,
    };
    const definition: WeightedFindingTendencyApplicabilityDefinition = {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: `weighted-finding-tendency-applicability.test.pipeline-${suffix}`,
      modelVersion: 'typed-patient-fact-tendency-applicability.v1',
      label: `Synthetic ${suffix} applicability`,
      rationale:
        'Synthetic point-free whole-state applicability used only for the D-211 attachment audit.',
      findingDefinitionId: targetFinding.id,
      findingDefinitionContentVersion: targetFinding.contentVersion,
      profileRef: {
        id: profile.id,
        contentVersion: profile.contentVersion,
      },
      profileFingerprint: fingerprintWeightedFindingTendencyProfile(profile),
      patientWhen: {
        type: 'fact',
        fact: {
          recordKind: 'condition',
          identityId: matchingDiagnosisId,
          identityContentVersion: '1.0.0',
          attributeId: 'condition.presence',
          valueId: 'state.present',
        },
      },
      developerOpinionIds: [],
      review: approvedReview,
    };
    expect(fingerprintWeightedFindingTendencyApplicabilityDefinition(definition)).toMatch(
      /^fingerprint\.weighted-finding-applicability\./,
    );
    return { profile, definition };
  });
  const result = compileWeightedFindingTendencyApplicability({
    schemaVersion: 1,
    id: `weighted-finding-tendency-applicability-request.test.pipeline-${targetSlug}`,
    patientStateCompositionArtifact,
    backgroundArtifact: background,
    profiles: entries.map((entry) => entry.profile),
    applicabilityDefinitions: entries.map((entry) => entry.definition),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

interface PipelineRequestOptions {
  readonly includeWeighted?: boolean;
  readonly authoredCandidates?: FindingResolutionCandidate[];
  readonly softTarget?: 'core' | 'texture';
  readonly conditionSourceKind?: 'd196' | 'd202';
  readonly weightedContributorCount?: number;
  readonly includeStructuredReport?: boolean;
  readonly includeInstrument?: boolean;
  readonly includeTargetScopedDuration?: boolean;
  readonly includeFindingTextureBridge?: boolean;
  readonly capacityBaseSlotCount?: number;
  readonly capacitySlotOrdinal?: number;
  readonly generationRoot?: string;
  readonly fillOrdinal?: number;
  readonly mode?: ProgressionMode;
  readonly templateEligibilityOverlay?: LocationTemplateSelectionEligibilityOverlay;
  readonly recentCompletedTemplateIdsNewestFirst?: readonly string[];
  readonly occupiedWaitingSlots?: readonly FrozenGeneratedWaitingSlot[];
  readonly locationLabel?: string;
  readonly decisionRules?: readonly DecisionRuleCandidateDefinition[];
}

const makeRequestFixture = (
  options: PipelineRequestOptions = {},
): {
  readonly request: FindingPipelineAuditRequest;
  readonly slotSelection: ReturnType<typeof compilePipelineSlotSelection>;
} => {
  const softTarget = options.softTarget === 'core' ? coreFinding : textureFinding;
  const sharedFindingRecipe = makeProjectionRecipe(
    softTarget !== coreFinding,
    'seed.pending-d233-authority',
  );
  const decisionActionHorizon: CatalogInstanceCompileRequest['decisionActionHorizon'] = {
    schemaVersion: 1,
    id: 'decision-action-horizon.test.pipeline',
    informationActionIds: ['info.history.test-depressive-symptoms'],
    startMedicationIds: ['medication.bupropion'],
    regimenEntryOperations: [],
    interventionIds: [],
    dispositionIds: ['disposition.outpatient'],
  };
  const diagnosisSelectionHorizon: CatalogInstanceCompileRequest['diagnosisSelectionHorizon'] = {
    schemaVersion: 1,
    id: 'diagnosis-selection-horizon.test.pipeline',
    allowEmptySelection: true,
    options: [],
  };
  const universalActionResultAssemblyRecipe = makeUniversalActionResultAssemblyRecipe();
  if (options.includeTargetScopedDuration) {
    universalActionResultAssemblyRecipe.targetScopedPatientValueProjectionDefinitions.push({
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'target-scoped-definition.test.pipeline-low-energy-duration',
      modelVersion: 'target-scoped-patient-value-projection.v1',
      label: 'Current low-energy duration',
      informationActionId: depressiveSymptomsAction.id,
      informationActionPayloadFingerprint:
        fingerprintInformationActionPayload(depressiveSymptomsAction),
      valueKind: 'clinical_duration',
      durationProfileId: 'duration-profile.test.pipeline-low-energy',
      targetSelector: {
        kind: 'finding_definition',
        findingDefinitionId: coreFinding.id,
        findingDefinitionContentVersion: coreFinding.contentVersion,
      },
      sourceKind: 'patient_report',
      timeScopeId: 'time-scope.current',
      lifecycle: 'approved',
      review: approvedReview,
    });
    universalActionResultAssemblyRecipe.recipes[0]!.sourceKinds.push(
      'target_scoped_patient_value_reveals',
    );
  }
  if (options.includeInstrument) {
    addSyntheticInstrumentResponse(sharedFindingRecipe, universalActionResultAssemblyRecipe);
  }
  const structuredReactionDefinition = options.includeStructuredReport
    ? addStructuredReactionReportDefinition(universalActionResultAssemblyRecipe)
    : null;
  if (structuredReactionDefinition !== null) {
    decisionActionHorizon.informationActionIds.push(
      structuredReactionDefinition.informationActionId,
    );
  }
  const template = makeTemplate(
    fingerprintCatalogInstanceRecipe({
      decisionActionHorizon,
      diagnosisSelectionHorizon,
      findingProjectionHorizon: sharedFindingRecipe.projectionHorizon,
      universalActionResultAssemblyRecipe,
    }),
    options.conditionSourceKind === 'd202',
    options.includeFindingTextureBridge === true,
  );
  const location = {
    schemaVersion: 1 as const,
    contentVersion: '1.0.0',
    id: 'location.test.pipeline-solo-office',
    label: options.locationLabel ?? 'Synthetic solo office',
    facilityTier: 'solo_office' as const,
    careSetting: 'outpatient_psychiatry' as const,
    capabilities: [],
    formularyId: 'formulary.test.starter',
    dispositionIds: ['disposition.outpatient'],
  };
  const slotSelection = compilePipelineSlotSelection({
    template,
    location,
    decisionActionHorizon,
    universalActionResultAssemblyRecipe,
    capacityBaseSlotCount: options.capacityBaseSlotCount,
    capacitySlotOrdinal: options.capacitySlotOrdinal,
    generationRoot: options.generationRoot,
    fillOrdinal: options.fillOrdinal,
    mode: options.mode,
    templateEligibilityOverlay: options.templateEligibilityOverlay,
    recentCompletedTemplateIdsNewestFirst: options.recentCompletedTemplateIdsNewestFirst,
    occupiedWaitingSlots: options.occupiedWaitingSlots,
  });
  const patientGenerationSeed =
    slotSelection.patientSlotFillSeedAuthorityArtifact.patientGenerationSeed;
  sharedFindingRecipe.seed = patientGenerationSeed;
  const structuredSourceReportSelectionArtifact =
    structuredReactionDefinition === null
      ? null
      : selectStructuredReactionReport({
          template,
          assembly: universalActionResultAssemblyRecipe,
          definition: structuredReactionDefinition,
          seed: patientGenerationSeed,
        });
  const conditionSetup =
    options.conditionSourceKind === 'd202'
      ? selectBridgedConditionSource(template, false, patientGenerationSeed)
      : (() => {
          const optionalFeatureArtifact =
            options.includeFindingTextureBridge === true
              ? selectFindingTextureOptionalFeature(template, patientGenerationSeed)
              : selectEmptyOptionalFeatures(template, patientGenerationSeed);
          const conditionSource: ResolvedConditionSource = {
            schemaVersion: 1,
            sourceKind: 'template_condition_selection',
            artifact: selectConditions(template, patientGenerationSeed),
          };
          return {
            conditionSource,
            optionalFeatureArtifact,
          };
        })();
  const preFindingPatientStateOrchestrationArtifact = orchestratePatientState({
    requestId: 'pre-finding-request.test.finding-pipeline',
    conditionSource: conditionSetup.conditionSource,
    optionalFeatureArtifact: conditionSetup.optionalFeatureArtifact,
    findingTextureBridgeInput:
      options.includeFindingTextureBridge === true
        ? makeFindingTextureBridgeInput(conditionSetup.optionalFeatureArtifact)
        : undefined,
  });
  const patientStateCompositionArtifact =
    preFindingPatientStateOrchestrationArtifact.patientStateCompositionArtifact;
  if (patientStateCompositionArtifact.composedPatientState === null) {
    throw new Error('Expected a composed D-208 fixture.');
  }
  const conditionFinding = selectConditionFindings(
    preFindingPatientStateOrchestrationArtifact.conditionSource,
    patientGenerationSeed,
  );
  const background = selectBackground(conditionFinding, softTarget, patientGenerationSeed);
  const matchingDiagnosisId =
    options.includeWeighted === false
      ? 'diagnosis.test.pipeline-unmatched'
      : options.conditionSourceKind === 'd202'
        ? 'diagnosis.test.pipeline-anxiety'
        : 'diagnosis.major-depressive-disorder';
  const applicability = compileWeightedTendencyApplicability(
    patientStateCompositionArtifact,
    background,
    softTarget,
    matchingDiagnosisId,
    options.weightedContributorCount,
  );
  const locationTemplateSelectionArtifact =
    slotSelection.patientSlotFillSeedAuthorityArtifact.locationTemplateSelectionArtifact;
  const selectedLocationResourceArtifact =
    locationTemplateSelectionArtifact.locationOwnedPatientSlotSelectionArtifact
      .admittedTemplateLocationBindingArtifact.operationalAdmissionArtifact.compileRequest
      .selectedLocationResourceArtifact;
  return {
    slotSelection,
    request: {
      schemaVersion: 1,
      id: 'finding-pipeline-audit-request.test.synthetic',
      patientSlotFillSeedAuthorityArtifact: slotSelection.patientSlotFillSeedAuthorityArtifact,
      preFindingPatientStateOrchestrationArtifact,
      downstream: {
        conditionFindingArtifact: conditionFinding,
        backgroundFindingArtifact: background,
        weightedFindingTendencyApplicabilityArtifact: applicability,
        catalogCompileRecipe: {
          schemaVersion: 1,
          id: 'catalog-instance-compile-request.test.pipeline',
          currentSelectedLocationResourceContext: currentPipelineSelectedLocationResourceContext(
            selectedLocationResourceArtifact,
          ),
          deferredFindingScopedDurations: options.includeTargetScopedDuration
            ? [
                {
                  schemaVersion: 1,
                  id: 'clinical-duration.test.pipeline-low-energy',
                  target: {
                    kind: 'canonical_finding_definition',
                    findingDefinitionId: coreFinding.id,
                    findingDefinitionContentVersion: coreFinding.contentVersion,
                  },
                  value: 8,
                  unit: 'week',
                  durationProfileId: 'duration-profile.test.pipeline-low-energy',
                  durationOptionId: 'duration-option.test.pipeline-eight-weeks',
                  relatedDiagnosisId: 'diagnosis.major-depressive-disorder',
                  interpretation: 'context_only',
                  criterionId: null,
                  source: {
                    kind: 'patient_report',
                    sourceInstanceId: 'source-instance.test.history',
                  },
                  timeScopeId: 'time-scope.current',
                  resolution: authoredResolution,
                },
              ]
            : [],
          deferredFindingScopedSubjectiveBurdenRecords: [],
          sharedFindingRecipe,
          authoredFindingCandidates: options.authoredCandidates ?? [],
          decisionPolicy: decisionPolicy(),
          decisionRules: [...(options.decisionRules ?? decisionRules())],
          decisionActionHorizon,
          diagnosisSelectionHorizon,
          universalActionResultAssemblyRecipe,
          structuredSourceReportSelectionArtifact,
        },
      },
    },
  };
};

const makeRequest = (options: PipelineRequestOptions = {}): FindingPipelineAuditRequest =>
  makeRequestFixture(options).request;

const compilePipelineSelectedLocationResource = (
  location: LocationDefinition,
  options: {
    readonly facilityId?: string;
    readonly clinicStateId?: string;
    readonly patientSlotCount?: number;
  } = {},
) => {
  const facilityId = options.facilityId ?? 'facility.test.finding-pipeline';
  const clinicStateId = options.clinicStateId ?? 'clinic.test.finding-pipeline';
  const formularyOwner = {
    schemaVersion: 1 as const,
    id: location.formularyId,
    contentVersion: '1.0.0',
    medicationIds: ['medication.bupropion'],
  };
  const compiled = compileSelectedLocationOperationalResourceContext({
    schemaVersion: 1,
    id: `selected-location-resource-request.test.${location.id}`,
    clinicOperationalContext: {
      schemaVersion: 1,
      modelVersion: 'clinic-operational-context.v1',
      clinicStateId,
      facilityId,
      facilityTier: location.facilityTier,
      locationIds: [location.id],
      departmentIds: location.departmentId ? [location.departmentId] : [],
      ownedUpgradeIds: [],
      ownedEquipmentIds: [],
      staffConfigurations: [],
      formularyIds: [location.formularyId],
    },
    facility: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: facilityId,
      label: 'Synthetic finding-pipeline facility',
      tier: location.facilityTier,
      minimumLifetimePoints: 0,
      patientSlotCount: options.patientSlotCount ?? 1,
      locationIds: [location.id],
      defaultLocationId: location.id,
      allowedDepartmentIds: location.departmentId ? [location.departmentId] : [],
      allowedUpgradeIds: [],
    },
    selectedLocation: location,
    assignmentHorizon: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: `location-resource-assignment-horizon.test.${location.id}`,
      modelVersion: 'clinic-location-resource-assignment-horizon.v1',
      clinicStateId,
      assignments: [
        {
          schemaVersion: 1,
          contentVersion: '1.0.0',
          id: `location-resource-assignment.test.${location.id}`,
          modelVersion: 'selected-location-operational-resource-assignment.v1',
          locationRef: {
            id: location.id,
            contentVersion: location.contentVersion,
          },
          assignedUpgradeRefs: [],
          assignedFormularyRefs: [],
        },
      ],
    },
    upgradeOwners: [],
    formularyOwners: [formularyOwner],
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

const currentPipelineSelectedLocationResourceContext = (
  artifact: ReturnType<typeof compilePipelineSelectedLocationResource>,
): CatalogInstanceCompileRequest['currentSelectedLocationResourceContext'] => {
  const { schemaVersion, id, selectedLocation, ...context } = artifact.compileRequest;
  void schemaVersion;
  void id;
  void selectedLocation;
  return structuredClone(context);
};

const compilePipelineSlotSelection = (input: {
  readonly template: PatientTemplate;
  readonly location: LocationDefinition;
  readonly decisionActionHorizon: CatalogInstanceCompileRequest['decisionActionHorizon'];
  readonly universalActionResultAssemblyRecipe: UniversalActionResultAssemblyRecipe;
  readonly facilityId?: string;
  readonly clinicStateId?: string;
  readonly capacityBaseSlotCount?: number;
  readonly capacitySlotOrdinal?: number;
  readonly generationRoot?: string;
  readonly fillOrdinal?: number;
  readonly mode?: ProgressionMode;
  readonly templateEligibilityOverlay?: LocationTemplateSelectionEligibilityOverlay;
  readonly recentCompletedTemplateIdsNewestFirst?: readonly string[];
  readonly occupiedWaitingSlots?: readonly FrozenGeneratedWaitingSlot[];
}): {
  readonly patientSlotFillSeedAuthorityArtifact: PatientSlotFillSeedAuthorityArtifact;
  readonly patientSlotFillSeedAuthorityCompileInput: PatientSlotFillSeedAuthorityCompileInput;
  readonly occupancySnapshotArtifact: LocationPatientSlotOccupancySnapshotArtifact;
  readonly occupancySnapshotCompileInput: LocationPatientSlotOccupancySnapshotCompileInput;
  readonly admissionMatrixArtifact: PatientTemplateLocationAdmissionMatrixArtifact;
  readonly admissionMatrixRequest: PatientTemplateLocationAdmissionMatrixRequest;
  readonly capacityArtifact: LocationPatientSlotCapacityArtifact;
  readonly capacityRequest: LocationPatientSlotCapacityCompileRequest;
} => {
  const mode = input.mode ?? 'endgame';
  const selectedResource = compilePipelineSelectedLocationResource(input.location, {
    facilityId: input.facilityId,
    clinicStateId: input.clinicStateId,
    patientSlotCount: input.capacityBaseSlotCount,
  });
  const formulary = {
    schemaVersion: 1 as const,
    contentVersion: '1.0.0',
    id: 'formulary.test.starter',
    label: 'Synthetic starter formulary',
    medicationIds: ['medication.bupropion'],
  };
  const templateHorizon = compileModePatientTemplateHorizon({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `mode-patient-template-horizon-request.test.${input.template.id}`,
    modelVersion: 'mode-patient-template-horizon.v1',
    mode,
    approvedTemplates: [structuredClone(input.template)],
    explicitReviewTemplates: [],
  });
  if (!templateHorizon.ok) throw new Error(templateHorizon.error.message);
  const matrixRequest: PatientTemplateLocationAdmissionMatrixRequest = {
    schemaVersion: 1,
    id: `admission-matrix-request.test.${input.template.id}.${input.location.id}`,
    clinicOperationalContext: structuredClone(
      selectedResource.compileRequest.clinicOperationalContext,
    ),
    facility: structuredClone(selectedResource.compileRequest.facility),
    locations: [structuredClone(input.location)],
    assignmentHorizon: structuredClone(selectedResource.compileRequest.assignmentHorizon),
    upgradeOwners: structuredClone(selectedResource.compileRequest.upgradeOwners),
    formularies: [formulary],
    templateHorizonArtifact: templateHorizon.value,
    actionHorizons: [structuredClone(input.decisionActionHorizon)],
    universalActionResultAssemblyRecipes: [
      structuredClone(input.universalActionResultAssemblyRecipe),
    ],
    services: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'service.history.basic',
        fulfillmentMethods: [
          {
            id: 'fulfillment.history.basic',
            requiredCapabilities: [],
          },
        ],
      },
    ],
    medications: [
      {
        contentVersion: '1.0.0',
        id: 'medication.bupropion',
      },
    ],
    treatments: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'disposition.outpatient',
        label: 'Synthetic outpatient disposition',
        searchAliases: [],
        kind: 'disposition',
        category: 'disposition',
        safeReferral: true,
        requiredCapabilities: [],
        fulfillmentServiceId: null,
      },
    ],
  };
  const matrix = compilePatientTemplateLocationAdmissionMatrix(matrixRequest);
  if (!matrix.ok) throw new Error(matrix.error.message);
  const admitted = matrix.value.admissionEvaluations.find(
    (evaluation) => evaluation.status === 'admitted',
  );
  if (admitted === undefined) throw new Error('Expected one admitted D-226 fixture cell.');
  const templateEligibilityOverlay =
    input.templateEligibilityOverlay ??
    createLocationTemplateSelectionEligibilityOverlay({
      mode,
      basis: mode === 'developer' ? 'developer_unrun' : 'all_admitted',
      sourceRunHistoryRef:
        mode === 'developer'
          ? {
              id: 'developer-patient-template-run-history.test.empty',
              payloadFingerprint: fingerprintLocationTemplateEligibilitySource({
                schemaVersion: 1,
                id: 'developer-patient-template-run-history.test.empty',
                modelVersion: 'developer-patient-template-run-history.v1',
                entries: [],
              }),
            }
          : null,
      eligibleTemplates: [
        {
          templateRef: admitted.templateRef,
          templateFingerprint: admitted.templateFingerprint,
        },
      ],
    });
  const capacityRequest = {
    schemaVersion: 1 as const,
    id: `location-patient-slot-capacity-request.test.${input.location.id}`,
    location: structuredClone(input.location),
    capacityProfile: {
      schemaVersion: 1 as const,
      contentVersion: '1.0.0',
      id: `location-patient-slot-capacity-profile.test.${input.location.id}`,
      modelVersion: 'location-patient-slot-capacity.v1' as const,
      locationRef: {
        id: input.location.id,
        contentVersion: input.location.contentVersion,
      },
      locationFingerprint: fingerprintPatientTemplateLocationAdmissionLocation(input.location),
      baseSlotCount: input.capacityBaseSlotCount ?? 1,
      upgradeContributions: [],
    },
    ownershipContext: {
      schemaVersion: 1 as const,
      modelVersion: 'location-patient-slot-capacity-ownership.v1' as const,
      clinicStateId: selectedResource.clinicStateId,
      ownedCapacityUpgradeRefs: [],
    },
    assignedCapacityUpgradeRefs: [],
  };
  const capacity = compileLocationPatientSlotCapacity(capacityRequest);
  if (!capacity.ok) throw new Error(capacity.error.message);
  const occupiedWaitingSlotByCoordinateId = new Map(
    (input.occupiedWaitingSlots ?? []).map((waitingSlot) => [
      waitingSlot.findingPipelineAuditArtifact.patientSlotFillSeedAuthorityArtifact
        .capacityBoundSlotCertificateArtifact.slotCoordinate.id,
      waitingSlot,
    ]),
  );
  const explicitlySelectedCoordinate =
    input.capacitySlotOrdinal === undefined
      ? undefined
      : capacity.value.slotCoordinates.find(
          (entry) =>
            entry.authorization.kind === 'base' &&
            entry.authorization.baseSlotOrdinal === input.capacitySlotOrdinal,
        )?.slotCoordinate;
  const slotCoordinate =
    explicitlySelectedCoordinate ??
    capacity.value.slotCoordinates.find(
      (entry) => !occupiedWaitingSlotByCoordinateId.has(entry.slotCoordinate.id),
    )?.slotCoordinate;
  if (slotCoordinate === undefined) throw new Error('Expected one empty capacity coordinate.');
  const occupancySnapshotCompileInput: LocationPatientSlotOccupancySnapshotCompileInput = {
    schemaVersion: 1,
    id: `location-patient-slot-occupancy-request.test.${input.location.id}`,
    mode,
    capacityArtifact: capacity.value,
    currentCapacityRequest: capacityRequest,
    entries: capacity.value.slotCoordinates.map((entry) => ({
      schemaVersion: 1,
      slotCoordinateId: entry.slotCoordinate.id,
      nextFillOrdinal: occupiedWaitingSlotByCoordinateId.has(entry.slotCoordinate.id)
        ? occupiedWaitingSlotByCoordinateId.get(entry.slotCoordinate.id)!
            .findingPipelineAuditArtifact.patientSlotFillSeedAuthorityArtifact.coordinates
            .fillOrdinal + 1
        : entry.slotCoordinate.id === slotCoordinate.id
          ? (input.fillOrdinal ?? 0)
          : 0,
      frozenWaitingSlot: occupiedWaitingSlotByCoordinateId.get(entry.slotCoordinate.id) ?? null,
    })),
  };
  const occupancy = compileLocationPatientSlotOccupancySnapshot(occupancySnapshotCompileInput);
  if (!occupancy.ok) throw new Error(occupancy.error.message);
  const seedAuthorityCompileInput: PatientSlotFillSeedAuthorityCompileInput = {
    schemaVersion: 1,
    id: `patient-slot-fill-seed-authority-request.test.${input.location.id}`,
    generationRoot: {
      schemaVersion: 1,
      id: `patient-slot-generation-root.test.${mode}`,
      modelVersion: 'patient-slot-generation-root.v1',
      mode,
      seed: input.generationRoot ?? 'generation-root.test.pipeline.default',
    },
    occupancySnapshotArtifact: occupancy.value,
    currentOccupancyInput: occupancySnapshotCompileInput,
    targetSlotCoordinateId: slotCoordinate.id,
    admissionMatrixArtifact: matrix.value,
    currentAdmissionMatrixRequest: matrixRequest,
    distributionProfile: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: `location-template-distribution.test.${input.location.id}`,
      modelVersion: 'location-template-distribution.v1',
      locationRef: {
        id: input.location.id,
        contentVersion: input.location.contentVersion,
      },
      locationFingerprint: fingerprintPatientTemplateLocationAdmissionLocation(input.location),
      templateWeights: [
        {
          templateRef: admitted.templateRef,
          templateFingerprint: admitted.templateFingerprint,
          gameSelectionWeight: 1,
        },
      ],
      repeatSuppression: {
        activeWaitingMultiplierBasisPoints: 2_500,
        recentCompletionMultiplierBasisPoints: 5_000,
        recentCompletionWindowSize: 8,
      },
    },
    recentCompletionContext: {
      schemaVersion: 1,
      id: `location-template-recent-completion-context.test.${input.location.id}`,
      mode,
      locationRef: {
        id: input.location.id,
        contentVersion: input.location.contentVersion,
      },
      recentCompletedTemplateIdsNewestFirst: [
        ...(input.recentCompletedTemplateIdsNewestFirst ?? []),
      ],
    },
    templateEligibilityOverlay,
  };
  const seedAuthority = compilePatientSlotFillSeedAuthority(seedAuthorityCompileInput);
  if (!seedAuthority.ok) throw new Error(seedAuthority.error.message);
  return {
    patientSlotFillSeedAuthorityArtifact: seedAuthority.value,
    patientSlotFillSeedAuthorityCompileInput: seedAuthorityCompileInput,
    occupancySnapshotArtifact: occupancy.value,
    occupancySnapshotCompileInput,
    admissionMatrixArtifact: matrix.value,
    admissionMatrixRequest: matrixRequest,
    capacityArtifact: capacity.value,
    capacityRequest,
  };
};

const expectComposed = (request: unknown) => {
  const result = composeFindingPipelineAudit(request);
  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`);
  }
  expect(result.ok).toBe(true);
  return result.value;
};

const evaluationFor = (artifact: ReturnType<typeof expectComposed>, candidateId: string) =>
  artifact.catalogSnapshot?.patientInstance.sharedFindingCompilation.candidateEvaluations.find(
    (evaluation) => evaluation.candidateId === candidateId,
  );

const downstreamOf = (request: FindingPipelineAuditRequest) => {
  if (request.downstream === null) throw new Error('Expected a ready D-200 request.');
  return request.downstream;
};

const seedAuthorityOf = (value: {
  readonly patientSlotFillSeedAuthorityArtifact: PatientSlotFillSeedAuthorityArtifact;
}): PatientSlotFillSeedAuthorityArtifact => value.patientSlotFillSeedAuthorityArtifact;

const templateSelectionOf = (value: {
  readonly patientSlotFillSeedAuthorityArtifact: PatientSlotFillSeedAuthorityArtifact;
}): LocationTemplateSelectionArtifact => seedAuthorityOf(value).locationTemplateSelectionArtifact;

const capacityCertificateOf = (value: {
  readonly patientSlotFillSeedAuthorityArtifact: PatientSlotFillSeedAuthorityArtifact;
}) => seedAuthorityOf(value).capacityBoundSlotCertificateArtifact;

const makeFillFixture = (options: PipelineRequestOptions = {}) => {
  const fixture = makeRequestFixture(options);
  const input: EmptyAuthorizedPatientSlotFillCompileInput = {
    schemaVersion: 1,
    id: 'empty-authorized-patient-slot-fill-request.test.pipeline',
    seedAuthorityCompileInput: fixture.slotSelection.patientSlotFillSeedAuthorityCompileInput,
    seedAuthorityArtifact: fixture.slotSelection.patientSlotFillSeedAuthorityArtifact,
    findingPipelineAuditRequest: fixture.request,
  };
  return { ...fixture, input };
};

const expectFillCompiled = (input: EmptyAuthorizedPatientSlotFillCompileInput) => {
  const result = compileEmptyAuthorizedPatientSlotFill(input);
  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`);
  }
  return result.value;
};

const occupiedInputAfterFill = (
  fixture: ReturnType<typeof makeFillFixture>,
  fill: ReturnType<typeof expectFillCompiled>,
): LocationPatientSlotOccupancySnapshotCompileInput => ({
  ...structuredClone(fixture.slotSelection.occupancySnapshotCompileInput),
  id: fill.proposedOccupancySnapshotArtifact.requestId,
  entries: fixture.slotSelection.occupancySnapshotCompileInput.entries.map((entry) =>
    entry.slotCoordinateId === fill.slotCoordinate.id
      ? {
          ...entry,
          nextFillOrdinal: fill.nextFillOrdinal,
          frozenWaitingSlot: fill.frozenWaitingSlotProposal,
        }
      : entry,
  ),
});

const emptyCompletionHistory = (
  fill: ReturnType<typeof expectFillCompiled>,
): LocationPatientSlotCompletionHistoryState => ({
  schemaVersion: 1,
  id: `location-patient-slot-completion-history.test.${fill.seedAuthorityArtifact.coordinates.mode}`,
  mode: fill.seedAuthorityArtifact.coordinates.mode,
  locationRef: fill.seedAuthorityArtifact.coordinates.locationRef,
  occupancySnapshotRef: {
    id: fill.proposedOccupancySnapshotArtifact.id,
    payloadFingerprint: fill.proposedOccupancySnapshotArtifact.payloadFingerprint,
  },
  nextCompletionOrdinal: 0,
  entriesNewestFirst: [],
});

const emptyDeveloperRunHistory = () => ({
  schemaVersion: 1 as const,
  id: 'developer-patient-template-run-history.test.lifecycle',
  modelVersion: 'developer-patient-template-run-history.v1' as const,
  entries: [],
});

const generatedServicePricingForWaiting = (waitingSlot: FrozenGeneratedWaitingSlot) => {
  const snapshot = waitingSlot.findingPipelineAuditArtifact.catalogSnapshot;
  if (snapshot === null) throw new Error('Expected a compiled catalog snapshot.');
  return {
    services: snapshot.operationalAdmissionArtifact.compileRequest.services.map((service) => ({
      schemaVersion: service.schemaVersion,
      contentVersion: service.contentVersion,
      id: service.id,
      label: `Synthetic pricing owner ${service.id}`,
      fulfillmentMethods: service.fulfillmentMethods.map((method) => ({
        ...method,
        label: `Synthetic fulfillment ${method.id}`,
        kind: 'in_house' as const,
        operatingCost: 25,
        qualityModifier: 1,
      })),
    })),
  };
};

const createNativeGeneratedAttempt = (input: {
  readonly attemptId: string;
  readonly mode: ProgressionMode;
  readonly frozenWaitingSlot: FrozenGeneratedWaitingSlot;
  readonly actionEvents?: readonly GeneratedEncounterActionEventInput[];
  readonly pointDerivation?: GeneratedCompletedEncounterAttemptCompileInput['pointDerivation'];
}) => {
  const snapshot = input.frozenWaitingSlot.findingPipelineAuditArtifact.catalogSnapshot;
  if (snapshot === null) throw new Error('Expected a compiled catalog snapshot.');
  const compiled = compileGeneratedCompletedEncounterAttempt({
    schemaVersion: 1,
    id: `generated-attempt-compile-request.test.${input.attemptId}`,
    attemptId: input.attemptId,
    mode: input.mode,
    frozenWaitingSlot: input.frozenWaitingSlot,
    engineVersions: {
      encounterEngineVersion: '1.0.0',
      servicePricingEngineVersion: '1.0.0',
      scoringEngineVersion: NATIVE_DECISION_BALANCE_COMPILER_VERSION,
      settlementEngineVersion: '1.0.0',
    },
    actionEvents: [...(input.actionEvents ?? [])],
    servicePricing: generatedServicePricingForWaiting(input.frozenWaitingSlot),
    pointDerivation: input.pointDerivation ?? {
      balanceCatalog: {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'registry.catalog.decision-balances.test.empty',
        balances: [],
      },
      medicationRegimenKnowledgeCatalog: {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'registry.catalog.medication-regimen-knowledge.test.empty',
        medicationClasses: [],
        classMemberships: [],
        focusedRoutes: [],
        contributors: [],
        sourceUseNotes: [],
      },
      databasePlanDecision: {
        schemaVersion: 1,
        selectionVersion: 1,
        informationActionIds: [],
        diagnosisSelections: [],
        treatmentSelection: {
          schemaVersion: 1,
          selectionVersion: 2,
          medicationTransition: {
            selectionVersion: 2,
            startMedicationIds: [],
            adjustments: [],
          },
          interventionIds: [],
          dispositionId: null,
        },
      },
    },
    settlement: {
      producerRef: {
        id: 'engine.generated-settlement.test',
        contentVersion: '1.0.0',
      },
      baseReimbursement: 400,
      challengeBonus: 0,
      satisfactionMultiplier: 1,
      treatmentCharges: [],
      persistentPointsBefore: 0,
      lifetimePointsBefore: 0,
    },
  });
  if (!compiled.ok) {
    throw new Error(`${compiled.error.code}: ${compiled.error.message}`);
  }
  return compiled.value;
};

const createCompletionProofForWaiting = (input: {
  readonly attemptId: string;
  readonly mode: ProgressionMode;
  readonly frozenWaitingSlot: FrozenGeneratedWaitingSlot;
}) => {
  const attempt = createNativeGeneratedAttempt(input);
  return createGeneratedEncounterCompletionProof({
    attempt,
    frozenWaitingSlot: input.frozenWaitingSlot,
  });
};

const makeLifecycleTransitionFixture = (
  options:
    | {
        readonly operation: 'complete_encounter';
        readonly mode?: ProgressionMode;
        readonly capacityBaseSlotCount?: number;
      }
    | {
        readonly operation: 'refresh_waiting_slots';
        readonly mode: 'endgame' | 'developer';
        readonly capacityBaseSlotCount?: number;
      }
    | {
        readonly operation: 'rerandomize_same_template';
        readonly mode: 'developer';
        readonly capacityBaseSlotCount?: number;
      } = { operation: 'complete_encounter' },
) => {
  const mode = options.mode ?? 'endgame';
  const fixture = makeFillFixture({
    mode,
    capacityBaseSlotCount: options.capacityBaseSlotCount,
  });
  const fill = expectFillCompiled(fixture.input);
  const waitingSlot = fill.frozenWaitingSlotProposal;
  if (waitingSlot === null) throw new Error('Expected one frozen waiting patient.');
  const currentOccupancyInput = occupiedInputAfterFill(fixture, fill);
  const completionHistoryState = emptyCompletionHistory(fill);
  const developerRunHistoryState = mode === 'developer' ? emptyDeveloperRunHistory() : null;
  const common = {
    schemaVersion: 1 as const,
    occupancySnapshotArtifact: fill.proposedOccupancySnapshotArtifact,
    currentOccupancyInput,
    completionHistoryState,
    distributionProfile:
      fixture.slotSelection.patientSlotFillSeedAuthorityCompileInput.distributionProfile,
    developerRunHistoryState,
  };
  const input: PatientSlotLifecycleTransitionCompileInput =
    options.operation === 'complete_encounter'
      ? {
          ...common,
          id: `patient-slot-lifecycle-transition-request.test.complete.${mode}`,
          operation: 'complete_encounter',
          mode,
          targetSlotCoordinateId: fill.slotCoordinate.id,
          completionProof: createCompletionProofForWaiting({
            attemptId: `generated-encounter-attempt.test.${mode}`,
            mode,
            frozenWaitingSlot: waitingSlot,
          }),
        }
      : options.operation === 'refresh_waiting_slots'
        ? {
            ...common,
            id: `patient-slot-lifecycle-transition-request.test.refresh.${mode}`,
            operation: 'refresh_waiting_slots',
            mode: options.mode,
            targetSlotCoordinateIds: [fill.slotCoordinate.id],
          }
        : {
            ...common,
            id: 'patient-slot-lifecycle-transition-request.test.rerandomize.developer',
            operation: 'rerandomize_same_template',
            mode: 'developer',
            targetSlotCoordinateId: fill.slotCoordinate.id,
          };
  const transition = compilePatientSlotLifecycleTransition(input);
  if (!transition.ok) {
    throw new Error(`${transition.error.code}: ${transition.error.message}`);
  }
  return { fixture, fill, waitingSlot, input, transition: transition.value };
};

const rebaseFillAttemptAfterTransition = (
  transition: PatientSlotLifecycleTransitionArtifact,
  options: {
    readonly generationRoot?: string;
    readonly currentSlotSelection?: ReturnType<typeof compilePipelineSlotSelection>;
    readonly capacityBaseSlotCount?: number;
    readonly startingOccupancyInput?: LocationPatientSlotOccupancySnapshotCompileInput;
    readonly startingOccupancyArtifact?: LocationPatientSlotOccupancySnapshotArtifact;
    readonly requestSuffix?: string;
  } = {},
): EmptyAuthorizedPatientSlotFillCompileInput => {
  const referenceWaitingSlot =
    transition.completionRecord?.frozenWaitingSlot ??
    transition.skippedWaitingRecords[0]?.frozenWaitingSlot;
  if (referenceWaitingSlot === undefined) {
    throw new Error('Expected one retained completion or skipped waiting patient.');
  }
  const admittedTemplates =
    referenceWaitingSlot.findingPipelineAuditArtifact.patientSlotFillSeedAuthorityArtifact.locationTemplateSelectionArtifact.locationOwnedPatientSlotSelectionArtifact.mechanicallyAdmittedCandidates.map(
      (candidate) => ({
        templateRef: candidate.templateRef,
        templateFingerprint: candidate.templateFingerprint,
      }),
    );
  const startingOccupancyArtifact =
    options.startingOccupancyArtifact ?? transition.proposedOccupancySnapshotArtifact;
  const startingOccupancyInput =
    options.startingOccupancyInput ?? transition.proposedOccupancyInput;
  const templateEligibilityOverlay = createPatientSlotTemplateEligibilityOverlay({
    mode: transition.mode,
    admittedTemplates,
    developerRunHistoryState: transition.proposedDeveloperRunHistoryState,
    sameTemplateConstraint: transition.sameTemplateRefillConstraint,
    activeWaitingTemplates: startingOccupancyArtifact.entries.flatMap((entry) =>
      entry.status === 'occupied'
        ? [
            {
              templateRef: entry.occupiedAssignment.templateRef,
              templateFingerprint: entry.occupiedAssignment.templateFingerprint,
            },
          ]
        : [],
    ),
  });
  const firstEmptyCoordinateId =
    getFirstEmptyLocationPatientSlotCoordinateId(startingOccupancyArtifact);
  if (firstEmptyCoordinateId === null) {
    throw new Error('Expected one empty transition coordinate.');
  }
  const target = startingOccupancyArtifact.entries.find(
    (entry) => entry.capacityCoordinate.slotCoordinate.id === firstEmptyCoordinateId,
  );
  if (target === undefined) throw new Error('Expected the empty transition target.');
  const fixture = makeFillFixture({
    mode: transition.mode,
    capacityBaseSlotCount: options.capacityBaseSlotCount,
    generationRoot: options.generationRoot,
    fillOrdinal: target.nextFillOrdinal,
    occupiedWaitingSlots: startingOccupancyInput.entries.flatMap((entry) =>
      entry.frozenWaitingSlot === null ? [] : [entry.frozenWaitingSlot],
    ),
    recentCompletedTemplateIdsNewestFirst:
      transition.proposedRecentCompletionContext.recentCompletedTemplateIdsNewestFirst,
    templateEligibilityOverlay,
  });
  const input = structuredClone(fixture.input);
  const requestSuffix = options.requestSuffix ?? transition.operation;
  input.id = `empty-authorized-patient-slot-fill-request.test.reconciled.${requestSuffix}`;
  input.seedAuthorityCompileInput.id = `patient-slot-fill-seed-authority-request.test.reconciled.${requestSuffix}`;
  input.seedAuthorityCompileInput.currentOccupancyInput = structuredClone(startingOccupancyInput);
  input.seedAuthorityCompileInput.occupancySnapshotArtifact =
    structuredClone(startingOccupancyArtifact);
  input.seedAuthorityCompileInput.targetSlotCoordinateId = firstEmptyCoordinateId;
  input.seedAuthorityCompileInput.recentCompletionContext = structuredClone(
    transition.proposedRecentCompletionContext,
  );
  if (options.currentSlotSelection !== undefined) {
    input.seedAuthorityCompileInput.admissionMatrixArtifact = structuredClone(
      options.currentSlotSelection.admissionMatrixArtifact,
    );
    input.seedAuthorityCompileInput.currentAdmissionMatrixRequest = structuredClone(
      options.currentSlotSelection.admissionMatrixRequest,
    );
  }
  input.seedAuthorityCompileInput.templateEligibilityOverlay = structuredClone(
    templateEligibilityOverlay,
  );
  const authority = compilePatientSlotFillSeedAuthority(input.seedAuthorityCompileInput);
  if (!authority.ok) throw new Error(`${authority.error.code}: ${authority.error.message}`);
  input.seedAuthorityArtifact = authority.value;
  input.findingPipelineAuditRequest.patientSlotFillSeedAuthorityArtifact = authority.value;
  return input;
};

const reconciliationEligibilityContext = (
  transition: PatientSlotLifecycleTransitionArtifact,
  slotSelection: ReturnType<typeof compilePipelineSlotSelection>,
): Pick<
  PatientSlotRefillReconciliationCompileInput,
  | 'currentAdmissionMatrixArtifact'
  | 'currentAdmissionMatrixRequest'
  | 'generationRoot'
  | 'explicitRetryAfterBlockedAttemptIds'
> => {
  void transition;
  return {
    currentAdmissionMatrixArtifact: slotSelection.admissionMatrixArtifact,
    currentAdmissionMatrixRequest: slotSelection.admissionMatrixRequest,
    generationRoot: slotSelection.patientSlotFillSeedAuthorityCompileInput.generationRoot,
    explicitRetryAfterBlockedAttemptIds: [],
  };
};

const occupancyEntryAt = (
  artifact: LocationPatientSlotOccupancySnapshotArtifact,
  coordinateId: string,
) => {
  const entry = artifact.entries.find(
    (candidate) => candidate.capacityCoordinate.slotCoordinate.id === coordinateId,
  );
  if (entry === undefined) {
    throw new Error(`Missing occupancy coordinate ${coordinateId}.`);
  }
  return entry;
};

const slotSelectionOf = (value: {
  readonly patientSlotFillSeedAuthorityArtifact: PatientSlotFillSeedAuthorityArtifact;
}) => templateSelectionOf(value).locationOwnedPatientSlotSelectionArtifact;

const admittedBindingOf = (value: {
  readonly patientSlotFillSeedAuthorityArtifact: PatientSlotFillSeedAuthorityArtifact;
}) => slotSelectionOf(value).admittedTemplateLocationBindingArtifact;

const preFindingOf = (value: {
  readonly preFindingPatientStateOrchestrationArtifact: PreFindingPatientStateOrchestrationArtifact;
}): PreFindingPatientStateOrchestrationArtifact =>
  value.preFindingPatientStateOrchestrationArtifact;

const patientStateCompositionOf = (value: {
  readonly preFindingPatientStateOrchestrationArtifact: PreFindingPatientStateOrchestrationArtifact;
}): ResolvedPatientStateCompositionArtifact => preFindingOf(value).patientStateCompositionArtifact;

const conditionSourceOf = (request: FindingPipelineAuditRequest): ResolvedConditionSource =>
  preFindingOf(request).conditionSource;

const pipelineSuccessorLocation = (): LocationDefinition => ({
  schemaVersion: 1,
  contentVersion: pipelineSuccessorLocationRef.contentVersion,
  id: pipelineSuccessorLocationRef.id,
  label: 'Synthetic successor outpatient clinic',
  facilityTier: 'outpatient_clinic',
  careSetting: 'outpatient_psychiatry',
  capabilities: [],
  formularyId: 'formulary.test.starter',
  dispositionIds: ['disposition.outpatient'],
});

const sourceFacilityOf = (artifact: ReturnType<typeof expectComposed>): FacilityDefinition =>
  admittedBindingOf(artifact).operationalAdmissionArtifact.compileRequest
    .selectedLocationResourceArtifact.compileRequest.facility;

const makeFacilityMoveMigrationFixture = (
  options: {
    readonly waitingSlotCount?: number;
    readonly targetCapacity?: number;
    readonly omitSuccessorMapping?: boolean;
    readonly targetTemplateContentVersion?: string;
  } = {},
): {
  readonly input: FacilityMoveWaitingSlotMigrationCompileInput;
  readonly sourceArtifacts: readonly ReturnType<typeof expectComposed>[];
  readonly targetCapacityArtifact: LocationPatientSlotCapacityArtifact;
} => {
  const waitingSlotCount = options.waitingSlotCount ?? 1;
  const sourceArtifacts: ReturnType<typeof expectComposed>[] = [];
  const sourceWaitingSlots: FrozenGeneratedWaitingSlot[] = [];
  for (let index = 0; index < waitingSlotCount; index += 1) {
    const artifact = expectComposed(
      makeRequest({
        capacityBaseSlotCount: waitingSlotCount,
        occupiedWaitingSlots: sourceWaitingSlots,
      }),
    );
    sourceArtifacts.push(artifact);
    sourceWaitingSlots.push({
      schemaVersion: 1,
      id: `waiting-slot.test.finding-pipeline.${index + 1}`,
      findingPipelineAuditArtifact: artifact,
    });
  }
  const sourceBinding = admittedBindingOf(sourceArtifacts[0]!);
  const sourceFacility = sourceFacilityOf(sourceArtifacts[0]!);
  const targetLocation = pipelineSuccessorLocation();
  const targetTemplate = structuredClone(sourceBinding.template);
  if (options.targetTemplateContentVersion !== undefined) {
    targetTemplate.contentVersion = options.targetTemplateContentVersion;
  }
  const targetSetup = compilePipelineSlotSelection({
    template: targetTemplate,
    location: targetLocation,
    decisionActionHorizon: sourceArtifacts[0]!.catalogCompileRequest.decisionActionHorizon,
    universalActionResultAssemblyRecipe:
      sourceArtifacts[0]!.catalogCompileRequest.universalActionResultAssemblyRecipe,
    facilityId: 'facility.test.finding-pipeline-successor',
    clinicStateId: 'clinic.test.finding-pipeline-successor',
    capacityBaseSlotCount: options.targetCapacity ?? waitingSlotCount,
  });
  const targetFacility = targetSetup.admissionMatrixRequest.facility;
  const successorProfile: FacilityLocationSuccessorProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'facility-location-successor-profile.test.finding-pipeline',
    modelVersion: 'facility-location-successor.v1',
    sourceFacilityRef: {
      id: sourceFacility.id,
      contentVersion: sourceFacility.contentVersion,
    },
    sourceFacilityFingerprint: fingerprintFacilityLocationSuccessorFacility(sourceFacility),
    targetFacilityRef: {
      id: targetFacility.id,
      contentVersion: targetFacility.contentVersion,
    },
    targetFacilityFingerprint: fingerprintFacilityLocationSuccessorFacility(targetFacility),
    mappings: options.omitSuccessorMapping
      ? []
      : [
          {
            schemaVersion: 1,
            id: 'facility-location-successor-mapping.test.finding-pipeline',
            sourceLocationRef: {
              id: sourceBinding.location.id,
              contentVersion: sourceBinding.location.contentVersion,
            },
            sourceLocationFingerprint: sourceBinding.locationFingerprint,
            successorLocationRef: {
              id: targetLocation.id,
              contentVersion: targetLocation.contentVersion,
            },
            successorLocationFingerprint:
              fingerprintPatientTemplateLocationAdmissionLocation(targetLocation),
          },
        ],
  };
  return {
    input: {
      schemaVersion: 1,
      id: 'facility-move-waiting-slot-migration-request.test.finding-pipeline',
      successorProfile,
      sourceFacility: structuredClone(sourceFacility),
      targetFacility: structuredClone(targetFacility),
      sourceLocations: [structuredClone(sourceBinding.location)],
      targetLocations: [structuredClone(targetLocation)],
      targetAdmissionMatrixArtifact: targetSetup.admissionMatrixArtifact,
      currentTargetAdmissionMatrixRequest: targetSetup.admissionMatrixRequest,
      targetCapacityContexts: [
        {
          capacityArtifact: targetSetup.capacityArtifact,
          currentCapacityRequest: targetSetup.capacityRequest,
        },
      ],
      frozenWaitingSlots: sourceWaitingSlots,
    },
    sourceArtifacts,
    targetCapacityArtifact: targetSetup.capacityArtifact,
  };
};

const makeSelectedOtherBlockedRequest = (): FindingPipelineAuditRequest => {
  const baseRequest = makeRequest();
  const template = structuredClone(admittedBindingOf(baseRequest).template);
  template.complexityProfile.additionalFeatureBudget = 1;
  template.complexityProfile.maximumSelectedModules = 1;
  const moduleDefinition: PatientOptionalFeatureModuleDefinition = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-feature.test.pipeline.unsupported-other',
    label: 'Synthetic unsupported optional module',
    moduleKind: 'other',
    lifecycle: 'approved',
    medicalReviewStatus: 'approved',
    review: approvedReview,
  };
  const optionalRequest = (seed: string): OptionalFeatureBudgetSelectionRequest => ({
    schemaVersion: 1,
    id: 'optional-feature-budget-request.test.pipeline.unsupported-other',
    template,
    moduleDefinitions: [moduleDefinition],
    profile: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'optional-feature-profile.test.pipeline.unsupported-other',
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
          id: 'optional-feature-binding.test.pipeline.unsupported-other',
          moduleRef: {
            id: moduleDefinition.id,
            contentVersion: moduleDefinition.contentVersion,
          },
          moduleFingerprint: fingerprintOptionalFeatureModuleDefinition(moduleDefinition),
          selectedModuleId: 'patient-optional-feature.test.pipeline.unsupported-other',
          cost: 1,
          impact: 'background',
          complexityContributions: [
            {
              id: 'complexity-contribution.test.pipeline.unsupported-other',
              label: 'Synthetic unsupported complexity',
              dimension: 'information',
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
  });
  let optionalFeatureArtifact: OptionalFeatureBudgetSelectionArtifact | null = null;
  let slotSelection: ReturnType<typeof compilePipelineSlotSelection> | null = null;
  for (let index = 0; index < 1_000; index += 1) {
    const candidateSlotSelection = compilePipelineSlotSelection({
      template,
      location: admittedBindingOf(baseRequest).location,
      decisionActionHorizon: downstreamOf(baseRequest).catalogCompileRecipe.decisionActionHorizon,
      universalActionResultAssemblyRecipe:
        downstreamOf(baseRequest).catalogCompileRecipe.universalActionResultAssemblyRecipe,
      generationRoot: `generation-root.test.unsupported-other.${index}`,
    });
    const result = selectOptionalFeaturesWithinBudget(
      optionalRequest(
        candidateSlotSelection.patientSlotFillSeedAuthorityArtifact.patientGenerationSeed,
      ),
    );
    if (result.ok && result.value.selectedCount === 1) {
      optionalFeatureArtifact = result.value;
      slotSelection = candidateSlotSelection;
      break;
    }
  }
  if (optionalFeatureArtifact === null || slotSelection === null) {
    throw new Error('Expected a deterministic selected-other D-201 fixture.');
  }
  const conditionSource: ResolvedConditionSource = {
    schemaVersion: 1,
    sourceKind: 'template_condition_selection',
    artifact: selectConditions(template, optionalFeatureArtifact.selectionRequest.seed),
  };
  const preFindingPatientStateOrchestrationArtifact = orchestratePatientState({
    requestId: 'pre-finding-request.test.blocked-other',
    conditionSource,
    optionalFeatureArtifact,
  });
  const patientStateCompositionArtifact =
    preFindingPatientStateOrchestrationArtifact.patientStateCompositionArtifact;
  if (patientStateCompositionArtifact.status !== 'not_composed') {
    throw new Error('Expected the selected other module to block D-208 composition.');
  }
  return {
    schemaVersion: 1,
    id: 'finding-pipeline-audit-request.test.blocked-other',
    patientSlotFillSeedAuthorityArtifact: slotSelection.patientSlotFillSeedAuthorityArtifact,
    preFindingPatientStateOrchestrationArtifact,
    downstream: null,
  };
};

const makeConditionConflictBlockedRequest = (): FindingPipelineAuditRequest => {
  const baseRequest = makeRequest({ conditionSourceKind: 'd202' });
  const template = structuredClone(admittedBindingOf(baseRequest).template);
  const slotSelection = compilePipelineSlotSelection({
    template,
    location: admittedBindingOf(baseRequest).location,
    decisionActionHorizon: downstreamOf(baseRequest).catalogCompileRecipe.decisionActionHorizon,
    universalActionResultAssemblyRecipe:
      downstreamOf(baseRequest).catalogCompileRecipe.universalActionResultAssemblyRecipe,
  });
  const conditionSetup = selectBridgedConditionSource(
    template,
    true,
    slotSelection.patientSlotFillSeedAuthorityArtifact.patientGenerationSeed,
  );
  const preFindingPatientStateOrchestrationArtifact = orchestratePatientState({
    requestId: 'pre-finding-request.test.blocked-condition-conflict',
    conditionSource: conditionSetup.conditionSource,
    optionalFeatureArtifact: conditionSetup.optionalFeatureArtifact,
  });
  const patientStateCompositionArtifact =
    preFindingPatientStateOrchestrationArtifact.patientStateCompositionArtifact;
  if (patientStateCompositionArtifact.status !== 'not_composed') {
    throw new Error('Expected the condition conflict to block D-208 composition.');
  }
  return {
    schemaVersion: 1,
    id: 'finding-pipeline-audit-request.test.blocked-condition-conflict',
    patientSlotFillSeedAuthorityArtifact: slotSelection.patientSlotFillSeedAuthorityArtifact,
    preFindingPatientStateOrchestrationArtifact,
    downstream: null,
  };
};

describe('finding pipeline audit composer', () => {
  it('strictly composes and retains the complete audited chain and complexity envelope', () => {
    const request = makeRequest();
    const downstream = downstreamOf(request);
    expect(FindingPipelineAuditRequestSchema.parse(request)).toEqual(request);
    const artifact = expectComposed(request);
    expect(FindingPipelineAuditArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.status).toBe('compiled');
    if (artifact.catalogSnapshot === null) {
      throw new Error('Expected the compiled D-200 fixture to retain a D-194 snapshot.');
    }
    expect(artifact.composerVersion).toBe('21.0.0');
    expect(artifact.patientSlotFillSeedAuthorityArtifact).toEqual(
      request.patientSlotFillSeedAuthorityArtifact,
    );
    expect(preFindingOf(artifact)).toEqual(preFindingOf(request));
    expect(patientStateCompositionOf(artifact)).toEqual(patientStateCompositionOf(request));
    expect(Object.hasOwn(artifact, 'patientStateCompositionArtifact')).toBe(false);
    expect(Object.hasOwn(request, 'patientStateCompositionArtifact')).toBe(false);
    expect(artifact.conditionFindingArtifact).toEqual(downstream.conditionFindingArtifact);
    expect(artifact.backgroundFindingArtifact).toEqual(downstream.backgroundFindingArtifact);
    expect(artifact.weightedFindingTendencyApplicabilityArtifact).toEqual(
      downstream.weightedFindingTendencyApplicabilityArtifact,
    );
    expect(artifact.weightedFindingTendencyRequest?.contributorBindings).toEqual(
      downstream.weightedFindingTendencyApplicabilityArtifact.contributorBindings,
    );
    expect(artifact.weightedFindingTendencyRequest?.profiles).toEqual([
      downstream.weightedFindingTendencyApplicabilityArtifact.applicabilityRequest.profiles[0],
    ]);
    expect(artifact.weightedFindingTendencyRequest?.findingDefinitions).toEqual([textureFinding]);
    expect(artifact.weightedFindingTendencyArtifact).not.toBeNull();
    expect(artifact.candidateUnion.map((candidate) => candidate.id)).toEqual(
      [
        ...downstream.conditionFindingArtifact.candidates,
        ...downstream.backgroundFindingArtifact.candidates,
        ...artifact.weightedFindingTendencyArtifact!.candidates,
      ]
        .map((candidate) => candidate.id)
        .sort(),
    );
    expect(artifact.catalogSnapshot?.patientInstance.patientState.conditionStates).toEqual(
      conditionSourceOf(request).artifact.conditionStates,
    );
    expect(artifact.catalogSnapshot?.patientInstance.conditionBindings).toEqual(
      patientStateCompositionOf(request).conditionBindings,
    );
    expect(artifact.catalogCompileRequest.basePatientState).toEqual(
      patientStateCompositionOf(request).composedPatientState,
    );
    expect(artifact.catalogCompileRequest.sharedFindingRequest).toMatchObject({
      patientStateId: patientStateCompositionOf(request).composedPatientState!.id,
      propositionState: patientStateCompositionOf(request).composedPatientState!.propositionState,
    });
    expect(artifact.catalogSnapshot?.patientInstance.patientState.clinicalTagIds).toEqual([
      'clinical-tag.test.pipeline-core-state',
    ]);
    expect(artifact.catalogSnapshot.universalActionResultArtifact).toMatchObject({
      status: 'complete',
      patientStateId: artifact.catalogSnapshot.patientInstance.patientState.id,
      bindingCandidates: [
        {
          informationActionId: 'info.history.test-depressive-symptoms',
        },
      ],
    });
    expect(artifact.catalogCompileRequest.structuredSourceReportSelectionArtifact).toBeNull();
    expect(artifact.catalogSnapshot.structuredSourceReportSelectionArtifact).toBeNull();
    expect(artifact.catalogSnapshot.structuredSourceReportArtifact).toBeNull();
    expect(
      artifact.catalogSnapshot.encounterInstance.resultBindingRequests.map(
        ({ id, informationActionId }) => ({ id, informationActionId }),
      ),
    ).toEqual(
      artifact.catalogSnapshot.universalActionResultArtifact.bindingCandidates.map(
        ({ id, informationActionId }) => ({ id, informationActionId }),
      ),
    );
    expect(artifact.catalogSnapshot?.template.complexityProfile).toEqual({
      modelVersion: 'additional-feature-budget.v1',
      measurementStatus: 'budget_only',
      additionalFeatureBudget: 0,
      maximumSelectedModules: 0,
      selectedModules: [],
      targetEnvelope: null,
    });
    expect(verifyCatalogCompiledInstanceIntegrity(artifact.catalogSnapshot).ok).toBe(true);
    expect(verifyFindingPipelineAuditIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(verifyFindingPipelineAuditContext({ artifact, request })).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('retains, replays, and rejects tampering of a nonempty D-240 attachment', () => {
    const request = makeRequest({ includeTargetScopedDuration: true });
    const artifact = expectComposed(request);
    if (artifact.catalogSnapshot === null) {
      throw new Error('Expected D-200 to retain one compiled catalog snapshot.');
    }
    const snapshot = artifact.catalogSnapshot;
    const targetArtifact =
      snapshot.universalActionResultArtifact.compileRequest
        .targetScopedPatientValueProjectionArtifact;
    const resolvedFinding = snapshot.patientInstance.sharedFindingCompilation.findings.find(
      (finding) => finding.definitionId === coreFinding.id,
    );
    const reveal = snapshot.patientInstance.targetScopedPatientValueReveals[0];

    expect(targetArtifact).not.toBeNull();
    expect(resolvedFinding).toBeDefined();
    expect(reveal).toBeDefined();
    expect(targetArtifact?.compileRequest.patientState).toEqual(
      snapshot.patientInstance.patientState,
    );
    expect(targetArtifact?.compileRequest.definitions).toEqual(
      snapshot.universalActionResultAssemblyRecipe.targetScopedPatientValueProjectionDefinitions,
    );
    expect(snapshot.patientInstance.patientState.clinicalDurations).toContainEqual(
      expect.objectContaining({
        id: 'clinical-duration.test.pipeline-low-energy',
        target: {
          kind: 'canonical_finding',
          canonicalFindingId: resolvedFinding?.id,
        },
      }),
    );
    expect(reveal).toEqual(targetArtifact?.frozenReveals[0]);
    expect(snapshot.encounterInstance.resultBindingRequests[0]?.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'target_scoped_patient_value_reveal',
          frozenRevealId: reveal?.id,
          definitionId: 'target-scoped-definition.test.pipeline-low-energy-duration',
        }),
      ]),
    );
    expect(snapshot.encounterInstance.resultBindings[0]?.sources).toEqual(
      expect.arrayContaining([
        {
          kind: 'target_scoped_patient_value_reveal',
          frozenRevealId: reveal?.id,
        },
      ]),
    );
    expect(verifyCatalogCompiledInstanceIntegrity(snapshot)).toEqual({
      ok: true,
      value: snapshot,
    });
    expect(verifyFindingPipelineAuditIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(verifyFindingPipelineAuditContext({ artifact, request })).toEqual({
      ok: true,
      value: artifact,
    });

    const tampered = structuredClone(artifact);
    tampered.catalogSnapshot!.patientInstance.targetScopedPatientValueReveals[0]!.values[0]!.timeScopeId =
      'time-scope.tampered';
    expect(verifyFindingPipelineAuditIntegrity(tampered).ok).toBe(false);
  });

  it('requires one intact capacity authorization for the exact D-230 coordinate', () => {
    const request = makeRequest();
    const certificate = capacityCertificateOf(request);
    expect(verifyCapacityBoundLocationTemplateSelectionCertificateIntegrity(certificate)).toEqual({
      ok: true,
      value: certificate,
    });

    const withoutCertificate = structuredClone(request) as unknown as Record<string, unknown>;
    delete (withoutCertificate.patientSlotFillSeedAuthorityArtifact as Record<string, unknown>)
      .capacityBoundSlotCertificateArtifact;
    expect(FindingPipelineAuditRequestSchema.safeParse(withoutCertificate).success).toBe(false);
    expect(composeFindingPipelineAudit(withoutCertificate)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const tampered = makeRequest();
    tampered.patientSlotFillSeedAuthorityArtifact.capacityBoundSlotCertificateArtifact.authorization =
      {
        kind: 'base',
        baseSlotOrdinal: 2,
      };
    expect(composeFindingPipelineAudit(tampered)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PATIENT_SLOT_FILL_SEED_AUTHORITY' },
    });

    const crossed = makeRequest({
      capacityBaseSlotCount: 2,
    });
    crossed.patientSlotFillSeedAuthorityArtifact.capacityBoundSlotCertificateArtifact =
      capacityCertificateOf(request);
    expect(FindingPipelineAuditRequestSchema.safeParse(crossed).success).toBe(false);
    expect(composeFindingPipelineAudit(crossed)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('keeps an existing capacity certificate valid when a predeclared upgrade adds coordinates', () => {
    const request = makeRequest();
    const template = admittedBindingOf(request).template;
    const selectedLocation = admittedBindingOf(request).location;
    const setup = compilePipelineSlotSelection({
      template,
      location: selectedLocation,
      decisionActionHorizon: downstreamOf(request).catalogCompileRecipe.decisionActionHorizon,
      universalActionResultAssemblyRecipe:
        downstreamOf(request).catalogCompileRecipe.universalActionResultAssemblyRecipe,
    });
    const upgradeRef = {
      id: 'upgrade.test.finding-pipeline-extra-slot',
      contentVersion: '1.0.0',
    };
    const baseCapacityRequest = structuredClone(setup.capacityRequest);
    baseCapacityRequest.capacityProfile.upgradeContributions = [
      {
        schemaVersion: 1,
        id: 'location-capacity-contribution.test.finding-pipeline-extra-slot',
        upgradeRef,
        additionalSlotCount: 1,
      },
    ];
    const baseCapacity = compileLocationPatientSlotCapacity(baseCapacityRequest);
    if (!baseCapacity.ok) throw new Error(baseCapacity.error.message);
    const certificate = compileCapacityBoundLocationTemplateSelectionCertificate({
      schemaVersion: 1,
      id: 'capacity-bound-location-template-selection-request.test.stable-expansion',
      locationTemplateSelectionArtifact: templateSelectionOf(setup),
      capacityArtifact: baseCapacity.value,
      currentCapacityRequest: baseCapacityRequest,
    });
    if (!certificate.ok) throw new Error(certificate.error.message);

    const expandedRequest = structuredClone(baseCapacityRequest);
    expandedRequest.ownershipContext.ownedCapacityUpgradeRefs = [upgradeRef];
    expandedRequest.assignedCapacityUpgradeRefs = [upgradeRef];
    const expandedCapacity = compileLocationPatientSlotCapacity(expandedRequest);
    if (!expandedCapacity.ok) throw new Error(expandedCapacity.error.message);
    expect(expandedCapacity.value.totalSlotCount).toBe(baseCapacity.value.totalSlotCount + 1);
    expect(
      verifyCapacityBoundLocationTemplateSelectionCertificateContext({
        certificate: certificate.value,
        locationTemplateSelectionArtifact: templateSelectionOf(setup),
        capacityArtifact: expandedCapacity.value,
        currentCapacityRequest: expandedRequest,
      }),
    ).toEqual({ ok: true, value: certificate.value });
  });

  it("derives template, location, and D-219 through D-230's nested D-229/D-228 chain while retaining an independent current resource check", () => {
    const request = makeRequest();
    const binding = admittedBindingOf(request);
    const artifact = expectComposed(request);
    expect(artifact.catalogCompileRequest.template).toEqual(binding.template);
    expect(artifact.catalogCompileRequest.location).toEqual(binding.location);
    expect(artifact.catalogCompileRequest.operationalAdmissionArtifact).toEqual(
      binding.operationalAdmissionArtifact,
    );

    const legacyParallelRoots = structuredClone(request) as unknown as {
      downstream: {
        catalogCompileRecipe: Record<string, unknown>;
      };
    };
    legacyParallelRoots.downstream.catalogCompileRecipe.template = binding.template;
    legacyParallelRoots.downstream.catalogCompileRecipe.location = binding.location;
    legacyParallelRoots.downstream.catalogCompileRecipe.operationalAdmissionArtifact =
      binding.operationalAdmissionArtifact;
    expect(composeFindingPipelineAudit(legacyParallelRoots)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const legacyDirectSlotRoot = structuredClone(request) as unknown as Record<string, unknown>;
    legacyDirectSlotRoot.locationOwnedPatientSlotSelectionArtifact = slotSelectionOf(request);
    delete legacyDirectSlotRoot.patientSlotFillSeedAuthorityArtifact;
    expect(FindingPipelineAuditRequestSchema.safeParse(legacyDirectSlotRoot).success).toBe(false);
    expect(composeFindingPipelineAudit(legacyDirectSlotRoot)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const legacyDirectBindingRoot = structuredClone(request) as unknown as Record<string, unknown>;
    legacyDirectBindingRoot.admittedTemplateLocationBindingArtifact = binding;
    delete legacyDirectBindingRoot.patientSlotFillSeedAuthorityArtifact;
    expect(FindingPipelineAuditRequestSchema.safeParse(legacyDirectBindingRoot).success).toBe(
      false,
    );
    expect(composeFindingPipelineAudit(legacyDirectBindingRoot)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const obsoleteTemplateSelection = structuredClone(request);
    obsoleteTemplateSelection.patientSlotFillSeedAuthorityArtifact.locationTemplateSelectionArtifact.compilerVersion =
      '99.0.0';
    expect(composeFindingPipelineAudit(obsoleteTemplateSelection)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PATIENT_SLOT_FILL_SEED_AUTHORITY' },
    });

    const staleCurrentResources = makeRequest();
    downstreamOf(
      staleCurrentResources,
    ).catalogCompileRecipe.currentSelectedLocationResourceContext.clinicOperationalContext.formularyIds.push(
      'formulary.test.stale-current-context',
    );
    expect(composeFindingPipelineAudit(staleCurrentResources)).toMatchObject({
      ok: false,
      error: { code: 'CATALOG_COMPILATION_FAILED' },
    });
  });

  it('retains and replays D-219 plus the full D-217 → D-215 attachment without changing D-201', () => {
    const request = makeRequest({
      conditionSourceKind: 'd202',
      includeStructuredReport: true,
      includeInstrument: true,
    });
    expect(
      patientStateCompositionOf(request).compositionRequest.optionalFeatureArtifact.totalSpent,
    ).toBeGreaterThan(0);
    const d201Before = JSON.stringify(
      patientStateCompositionOf(request).compositionRequest.optionalFeatureArtifact,
    );
    const selectionBefore = structuredClone(
      downstreamOf(request).catalogCompileRecipe.structuredSourceReportSelectionArtifact,
    );
    const operationalAdmissionBefore = structuredClone(
      admittedBindingOf(request).operationalAdmissionArtifact,
    );
    const artifact = expectComposed(request);
    if (artifact.catalogSnapshot === null) {
      throw new Error('Expected D-218 to retain one compiled catalog snapshot.');
    }

    expect(artifact.catalogCompileRequest.structuredSourceReportSelectionArtifact).toEqual(
      selectionBefore,
    );
    expect(artifact.catalogSnapshot.structuredSourceReportSelectionArtifact).toEqual(
      selectionBefore,
    );
    expect(artifact.catalogSnapshot.structuredSourceReportArtifact).not.toBeNull();
    expect(artifact.catalogSnapshot.instrumentItemResponseCompilation.status).toBe('complete');
    expect(artifact.catalogSnapshot.instrumentItemResponseCompilation.responses).toHaveLength(1);
    expect(artifact.catalogSnapshot.patientInstance.instrumentItemResponses).toHaveLength(1);
    expect(
      artifact.catalogSnapshot.universalActionResultArtifact.compileRequest
        .instrumentItemResponseCompilation,
    ).toEqual(artifact.catalogSnapshot.instrumentItemResponseCompilation);
    expect(
      artifact.catalogSnapshot.encounterInstance.resultBindings.flatMap((binding) =>
        binding.sources.filter((source) => source.kind === 'instrument_item_response'),
      ),
    ).toEqual([
      {
        kind: 'instrument_item_response',
        responseId: artifact.catalogSnapshot.patientInstance.instrumentItemResponses[0]!.id,
      },
    ]);
    expect(artifact.catalogCompileRequest.operationalAdmissionArtifact).toEqual(
      operationalAdmissionBefore,
    );
    expect(artifact.catalogSnapshot.operationalAdmissionArtifact).toEqual(
      operationalAdmissionBefore,
    );
    expect(
      artifact.catalogCompileRequest.operationalAdmissionArtifact.compileRequest
        .selectedLocationResourceArtifact,
    ).toEqual(operationalAdmissionBefore.compileRequest.selectedLocationResourceArtifact);
    expect(
      artifact.catalogSnapshot.universalActionResultArtifact.compileRequest.structuredRevealEnvelopes.map(
        (envelope) => envelope.resolved.id,
      ),
    ).toEqual(
      artifact.catalogSnapshot.structuredSourceReportArtifact?.projectionRecipes.map(
        (recipe) => recipe.resolved.id,
      ),
    );
    expect(
      JSON.stringify(
        patientStateCompositionOf(artifact).compositionRequest.optionalFeatureArtifact,
      ),
    ).toBe(d201Before);
    const playerPayload = JSON.stringify({
      patientInstance: artifact.catalogSnapshot.patientInstance,
      encounterInstance: artifact.catalogSnapshot.encounterInstance,
    });
    expect(playerPayload).not.toMatch(
      /selectedLocationResourceArtifact|clinicOperationalContextFingerprint|assignmentHorizonRef|assignedUpgradeRefs|staffContexts/,
    );
    expect(playerPayload).not.toContain(
      operationalAdmissionBefore.compileRequest.selectedLocationResourceArtifact.id,
    );
    expect(playerPayload).not.toContain(templateSelectionOf(request).id);
    expect(playerPayload).not.toContain(templateSelectionOf(request).distributionProfileRef.id);
    expect(playerPayload).not.toContain(templateSelectionOf(request).stableDrawId);
    expect(playerPayload).not.toContain(
      templateSelectionOf(request).selectionRequest.localRepeatContext.id,
    );
    expect(playerPayload).not.toContain(slotSelectionOf(request).id);
    expect(playerPayload).not.toContain(admittedBindingOf(request).id);
    expect(playerPayload).not.toContain(admittedBindingOf(request).admissionMatrixRef.id);
    expect(verifyCatalogCompiledInstanceIntegrity(artifact.catalogSnapshot).ok).toBe(true);
    expect(verifyFindingPipelineAuditIntegrity(artifact).ok).toBe(true);

    const requestSelectionTampered = structuredClone(artifact);
    requestSelectionTampered.catalogCompileRequest.structuredSourceReportSelectionArtifact!.inputFingerprint =
      'fingerprint.structured-source-report-selection.input.fnv1a64.0000000000000000';
    expect(verifyFindingPipelineAuditIntegrity(requestSelectionTampered).ok).toBe(false);

    const selectionTampered = structuredClone(artifact);
    selectionTampered.catalogSnapshot!.structuredSourceReportSelectionArtifact!.seed =
      'tampered-seed';
    expect(verifyFindingPipelineAuditIntegrity(selectionTampered).ok).toBe(false);

    const reportTampered = structuredClone(artifact);
    reportTampered.catalogSnapshot!.structuredSourceReportArtifact!.compileRequest.patientState.demographics.ageYears += 1;
    expect(verifyFindingPipelineAuditIntegrity(reportTampered).ok).toBe(false);

    const operationalAdmissionTampered = structuredClone(artifact);
    operationalAdmissionTampered.catalogCompileRequest.operationalAdmissionArtifact.informationActionEvaluations[0]!.fulfillmentMethods[0]!.methodId =
      'fulfillment.history.tampered';
    operationalAdmissionTampered.catalogSnapshot!.operationalAdmissionArtifact.informationActionEvaluations[0]!.fulfillmentMethods[0]!.methodId =
      'fulfillment.history.tampered';
    expect(FindingPipelineAuditArtifactSchema.safeParse(operationalAdmissionTampered).success).toBe(
      false,
    );
    expect(verifyFindingPipelineAuditIntegrity(operationalAdmissionTampered).ok).toBe(false);

    const nestedResourceTampered = structuredClone(artifact);
    nestedResourceTampered.catalogCompileRequest.operationalAdmissionArtifact.compileRequest.selectedLocationResourceArtifact.compileRequest.clinicOperationalContext.formularyIds.push(
      'formulary.test.tampered',
    );
    nestedResourceTampered.catalogSnapshot!.operationalAdmissionArtifact.compileRequest.selectedLocationResourceArtifact.compileRequest.clinicOperationalContext.formularyIds.push(
      'formulary.test.tampered',
    );
    expect(FindingPipelineAuditArtifactSchema.safeParse(nestedResourceTampered).success).toBe(
      false,
    );
    expect(verifyFindingPipelineAuditIntegrity(nestedResourceTampered).ok).toBe(false);
  });

  it('composes a genuine D-202 source without simulated D-196 selection provenance', () => {
    const request = makeRequest({
      conditionSourceKind: 'd202',
      weightedContributorCount: 2,
    });
    const artifact = expectComposed(request);
    const conditionSource = conditionSourceOf(request);
    expect(artifact.composerVersion).toBe('21.0.0');
    expect(conditionSource.sourceKind).toBe('optional_comorbidity_bridge');
    if (
      conditionSource.sourceKind !== 'optional_comorbidity_bridge' ||
      patientStateCompositionOf(artifact).compositionRequest.conditionSource.sourceKind !==
        'optional_comorbidity_bridge'
    ) {
      throw new Error('Expected the D-202 source branch.');
    }
    const bridge = conditionSource.artifact;
    expect(OptionalComorbidityBridgeArtifactSchema.parse(bridge)).toEqual(bridge);
    expect(TemplateConditionSelectionArtifactSchema.safeParse(bridge).success).toBe(false);
    expect(patientStateCompositionOf(artifact)).toEqual(patientStateCompositionOf(request));
    expect(artifact.conditionFindingArtifact.conditionSource).toEqual(conditionSource);
    expect(artifact.conditionFindingArtifact.conditionSourceRef).toEqual({
      sourceKind: 'optional_comorbidity_bridge',
      id: bridge.id,
      payloadFingerprint: bridge.payloadFingerprint,
      templateRef: bridge.templateRef,
      templateFingerprint: bridge.templateFingerprint,
    });
    const optionalState = bridge.conditionStates.find(
      (state) => state.diagnosisDefinitionId === 'diagnosis.test.pipeline-anxiety',
    );
    expect(optionalState).toBeDefined();
    const applicabilityEvaluations =
      artifact.weightedFindingTendencyApplicabilityArtifact.evaluations;
    expect(applicabilityEvaluations).toHaveLength(2);
    for (const evaluation of applicabilityEvaluations) {
      expect(evaluation.patientPredicateMatched).toBe(true);
      expect(evaluation.matchedPatientFactBindings).toEqual([
        {
          fact: {
            recordKind: 'condition',
            identityId: 'diagnosis.test.pipeline-anxiety',
            identityContentVersion: '1.0.0',
            attributeId: 'condition.presence',
            valueId: 'state.present',
          },
          recordIds: [optionalState!.id],
        },
      ]);
    }
    expect(artifact.weightedFindingTendencyApplicabilityArtifact.contributorBindings).toHaveLength(
      2,
    );
    expect(
      artifact.weightedFindingTendencyArtifact?.aggregations[0]?.contributorEvaluations,
    ).toHaveLength(2);
    expect(artifact.weightedFindingTendencyRequest?.contributorBindings).toEqual(
      artifact.weightedFindingTendencyApplicabilityArtifact.contributorBindings,
    );
    expect(artifact.conditionFindingArtifact.unboundConditionStateIds).toEqual([optionalState!.id]);
    expect(artifact.catalogSnapshot?.patientInstance.patientState.conditionStates).toEqual(
      bridge.conditionStates,
    );
    expect(artifact.catalogSnapshot?.patientInstance.conditionBindings).toEqual(
      bridge.conditionBindings,
    );
    expect(
      artifact.catalogSnapshot?.patientInstance.conditionBindings.some(
        (binding) => binding.kind === 'optional_group',
      ),
    ).toBe(true);
    expect(bridge.bridgeRequest.optionalFeatureArtifact.totalSpent).toBe(1);
    expect(bridge.bridgeRequest.optionalFeatureArtifact.remainingBudget).toBe(0);
    expect(bridge.bridgeRequest.optionalFeatureArtifact.selectionDraws).toHaveLength(1);
    expect(patientStateCompositionOf(artifact).selectedModuleAudits).toHaveLength(1);
    expect(patientStateCompositionOf(artifact).selectedModuleAudits[0]).toMatchObject({
      moduleKind: 'comorbidity',
      cost: 1,
      remainingBudgetAfter: 0,
    });
    expect(
      artifact.weightedFindingTendencyApplicabilityArtifact.applicabilityRequest
        .patientStateCompositionArtifact.compositionRequest.optionalFeatureArtifact,
    ).toEqual(bridge.bridgeRequest.optionalFeatureArtifact);
    expect(artifact.catalogSnapshot?.template.complexityProfile).toEqual({
      modelVersion: 'additional-feature-budget.v1',
      measurementStatus: 'budget_only',
      additionalFeatureBudget: 1,
      maximumSelectedModules: 1,
      selectedModules: [],
      targetEnvelope: null,
    });
    expect(verifyCatalogCompiledInstanceIntegrity(artifact.catalogSnapshot).ok).toBe(true);
    expect(verifyFindingPipelineAuditIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(verifyFindingPipelineAuditContext({ artifact, request })).toEqual({
      ok: true,
      value: artifact,
    });
    expect(expectComposed(structuredClone(request))).toEqual(artifact);
  });

  it('propagates selected-other and native condition-conflict blockers before D-193/D-194', () => {
    const selectedOther = makeSelectedOtherBlockedRequest();
    expect(FindingPipelineAuditRequestSchema.parse(selectedOther)).toEqual(selectedOther);
    expect(preFindingOf(selectedOther).status).toBe('not_composed');
    expect(
      patientStateCompositionOf(selectedOther).compositionRequest.optionalFeatureArtifact,
    ).toMatchObject({
      totalSpent: 1,
      remainingBudget: 0,
    });
    const selectedOtherResult = composeFindingPipelineAudit(selectedOther);
    expect(selectedOtherResult.ok).toBe(false);
    if (selectedOtherResult.ok) throw new Error('Expected selected-other composition blocker.');
    expect(selectedOtherResult.error).toMatchObject({
      code: 'PATIENT_STATE_COMPOSITION_BLOCKED',
      contentIds: expect.arrayContaining([
        'optional-feature.test.pipeline.unsupported-other',
        'optional-feature-binding.test.pipeline.unsupported-other',
        'patient-optional-feature.test.pipeline.unsupported-other',
      ]),
    });

    const conditionConflict = makeConditionConflictBlockedRequest();
    expect(FindingPipelineAuditRequestSchema.parse(conditionConflict)).toEqual(conditionConflict);
    expect(preFindingOf(conditionConflict).status).toBe('not_composed');
    expect(patientStateCompositionOf(conditionConflict).blockers).toEqual([
      {
        kind: 'literal_condition_incompatibility',
        conflictIds: ['condition-incompatibility.test.pipeline-anxiety-versus-focus'],
      },
    ]);
    const conditionConflictResult = composeFindingPipelineAudit(conditionConflict);
    expect(conditionConflictResult.ok).toBe(false);
    if (conditionConflictResult.ok) {
      throw new Error('Expected native condition composition blocker.');
    }
    expect(conditionConflictResult.error).toMatchObject({
      code: 'PATIENT_STATE_COMPOSITION_BLOCKED',
      contentIds: expect.arrayContaining([
        'condition-incompatibility.test.pipeline-anxiety-versus-focus',
      ]),
    });
  });

  it('rejects crossed D-196/D-202 sources and nested bridge tampering', () => {
    const d196 = makeRequest();
    const d202 = makeRequest({ conditionSourceKind: 'd202' });

    const crossed = structuredClone(d202);
    downstreamOf(crossed).conditionFindingArtifact = downstreamOf(d196).conditionFindingArtifact;
    const crossedResult = composeFindingPipelineAudit(crossed);
    expect(crossedResult.ok).toBe(false);
    if (crossedResult.ok) throw new Error('Expected a crossed source failure.');
    expect(crossedResult.error.code).toBe('INVALID_REQUEST');

    const wrongTemplate = structuredClone(d202);
    wrongTemplate.patientSlotFillSeedAuthorityArtifact = structuredClone(
      d196.patientSlotFillSeedAuthorityArtifact,
    );
    const templateResult = composeFindingPipelineAudit(wrongTemplate);
    expect(templateResult.ok).toBe(false);
    if (templateResult.ok) throw new Error('Expected a crossed template failure.');
    expect(templateResult.error.code).toMatch(
      /^(INVALID_REQUEST|PATIENT_SEED_CONTEXT_MISMATCH|TEMPLATE_CONTEXT_MISMATCH)$/,
    );

    const tamperedRequest = structuredClone(d202);
    const tamperedRequestSource =
      patientStateCompositionOf(tamperedRequest).compositionRequest.conditionSource;
    if (tamperedRequestSource.sourceKind !== 'optional_comorbidity_bridge') {
      throw new Error('Expected the D-202 source branch.');
    }
    tamperedRequestSource.artifact.bridgeRequest.optionalFeatureArtifact.selectionRequest.seed =
      'tampered-d201-seed';
    const tamperedCompose = composeFindingPipelineAudit(tamperedRequest);
    expect(tamperedCompose.ok).toBe(false);
    if (tamperedCompose.ok) throw new Error('Expected nested source tampering to fail.');
    expect(tamperedCompose.error.code).toBe('INVALID_REQUEST');

    const tamperedBridgeRequest = structuredClone(d202);
    const tamperedBridgeRequestSource =
      patientStateCompositionOf(tamperedBridgeRequest).compositionRequest.conditionSource;
    if (tamperedBridgeRequestSource.sourceKind !== 'optional_comorbidity_bridge') {
      throw new Error('Expected the D-202 source branch.');
    }
    tamperedBridgeRequestSource.artifact.bridgeRequest.conditionSelectionRequest.seed =
      'tampered-d202-condition-audit-seed';
    const tamperedBridgeCompose = composeFindingPipelineAudit(tamperedBridgeRequest);
    expect(tamperedBridgeCompose.ok).toBe(false);
    if (tamperedBridgeCompose.ok) {
      throw new Error('Expected nested bridge tampering to fail.');
    }
    expect(tamperedBridgeCompose.error.code).toBe('INVALID_REQUEST');

    const validArtifact = expectComposed(d202);
    const tamperedArtifact = structuredClone(validArtifact);
    const tamperedArtifactSource =
      patientStateCompositionOf(tamperedArtifact).compositionRequest.conditionSource;
    if (tamperedArtifactSource.sourceKind !== 'optional_comorbidity_bridge') {
      throw new Error('Expected the D-202 source branch.');
    }
    tamperedArtifactSource.artifact.bridgeRequest.optionalFeatureArtifact.selectionRequest.seed =
      'tampered-retained-d201-seed';
    expect(verifyFindingPipelineAuditIntegrity(tamperedArtifact)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });

    const tamperedBridgeArtifact = structuredClone(validArtifact);
    const tamperedBridgeArtifactSource =
      patientStateCompositionOf(tamperedBridgeArtifact).compositionRequest.conditionSource;
    if (tamperedBridgeArtifactSource.sourceKind !== 'optional_comorbidity_bridge') {
      throw new Error('Expected the D-202 source branch.');
    }
    tamperedBridgeArtifactSource.artifact.bridgeRequest.conditionSelectionRequest.seed =
      'tampered-retained-d202-condition-audit-seed';
    expect(verifyFindingPipelineAuditIntegrity(tamperedBridgeArtifact)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });

    const tamperedSnapshot = structuredClone(validArtifact);
    const tamperedSnapshotSource =
      patientStateCompositionOf(tamperedSnapshot).compositionRequest.conditionSource;
    if (
      tamperedSnapshotSource.sourceKind !== 'optional_comorbidity_bridge' ||
      tamperedSnapshot.catalogSnapshot === null
    ) {
      throw new Error('Expected a compiled D-202 source artifact.');
    }
    const optionalStateId = tamperedSnapshotSource.artifact.conditionStates.find(
      (state) => state.diagnosisDefinitionId === 'diagnosis.test.pipeline-anxiety',
    )!.id;
    const attachedOptionalState =
      tamperedSnapshot.catalogSnapshot.patientInstance.patientState.conditionStates.find(
        (state) => state.id === optionalStateId,
      )!;
    attachedOptionalState.encounterRelevance = 'background';
    expect(verifyCatalogCompiledInstanceIntegrity(tamperedSnapshot.catalogSnapshot).ok).toBe(false);
    expect(verifyFindingPipelineAuditIntegrity(tamperedSnapshot)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });

  it('is deterministic, shares one pre-finding seed, and binds the D-223 root', () => {
    const request = makeRequest();
    const before = JSON.stringify(request);
    const first = expectComposed(request);
    expect(JSON.stringify(request)).toBe(before);
    expect(expectComposed(structuredClone(request))).toEqual(first);
    const source = patientStateCompositionOf(first).compositionRequest.conditionSource;
    expect(source.sourceKind).toBe('template_condition_selection');
    if (source.sourceKind !== 'template_condition_selection') {
      throw new Error('Expected the D-196 source branch.');
    }
    const patientGenerationSeed = seedAuthorityOf(first).patientGenerationSeed;
    expect(source.artifact.seed).toBe(patientGenerationSeed);
    expect(preFindingOf(first).optionalFeatureArtifact.seed).toBe(source.artifact.seed);
    expect(first.conditionFindingArtifact.seed).toBe(patientGenerationSeed);
    expect(first.backgroundFindingArtifact.seed).toBe(patientGenerationSeed);
    expect(first.weightedFindingTendencyArtifact?.seed).toBe(patientGenerationSeed);
    expect(first.catalogCompileRequest.sharedFindingRequest.seed).toBe(patientGenerationSeed);
    expect(first.catalogSnapshot?.patientInstance.seed).toBe(patientGenerationSeed);
    expect(templateSelectionOf(first).selectionRequest.seed).toBe(
      seedAuthorityOf(first).templateSelectionSeed,
    );
    expect(seedAuthorityOf(first).templateSelectionSeed).not.toBe(patientGenerationSeed);

    const alternate = expectComposed(
      makeRequest({
        generationRoot: 'generation-root.test.alternate-pre-finding-root',
      }),
    );
    expect(preFindingOf(alternate).inputFingerprint).not.toBe(preFindingOf(first).inputFingerprint);
    expect(alternate.inputFingerprint).not.toBe(first.inputFingerprint);
    expect(alternate.payloadFingerprint).not.toBe(first.payloadFingerprint);
  });

  it('rejects legacy direct D-208 or caller-owned D-199 roots and missing D-199 definitions', () => {
    const current = makeRequest();
    const legacyPatientStateRoot = structuredClone(current) as unknown as Record<string, unknown>;
    legacyPatientStateRoot.patientStateCompositionArtifact =
      preFindingOf(current).patientStateCompositionArtifact;
    delete legacyPatientStateRoot.preFindingPatientStateOrchestrationArtifact;
    expect(FindingPipelineAuditRequestSchema.safeParse(legacyPatientStateRoot).success).toBe(false);
    expect(composeFindingPipelineAudit(legacyPatientStateRoot)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const legacy = structuredClone(makeRequest()) as unknown as {
      downstream: Record<string, unknown>;
    };
    legacy.downstream.weightedFindingTendencyArtifact = {
      id: 'legacy-caller-owned-d199',
    };
    expect(FindingPipelineAuditRequestSchema.safeParse(legacy).success).toBe(false);
    const legacyResult = composeFindingPipelineAudit(legacy);
    expect(legacyResult).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const missingDefinition = makeRequest();
    downstreamOf(missingDefinition).catalogCompileRecipe.sharedFindingRecipe.findingDefinitions =
      downstreamOf(
        missingDefinition,
      ).catalogCompileRecipe.sharedFindingRecipe.findingDefinitions.filter(
        (definition) => definition.id !== textureFinding.id,
      );
    const missingDefinitionResult = composeFindingPipelineAudit(missingDefinition);
    expect(missingDefinitionResult.ok).toBe(false);
    if (missingDefinitionResult.ok) {
      throw new Error('Expected exact D-199 target-definition rejection.');
    }
    expect(missingDefinitionResult.error.code).toBe('INVALID_WEIGHTED_TENDENCY_REQUEST');
  });

  it('rejects retained D-210/D-199 tampering and obsolete composer versions', () => {
    const artifact = expectComposed(makeRequest());

    const tamperedApplicability = structuredClone(artifact);
    tamperedApplicability.weightedFindingTendencyApplicabilityArtifact.evaluations[0]!.matchedPatientFactBindings[0]!.recordIds =
      ['resolved-condition-state.test.crossed'];
    expect(verifyFindingPipelineAuditIntegrity(tamperedApplicability)).toMatchObject({
      ok: false,
      error: { code: 'UPSTREAM_INTEGRITY_INVALID' },
    });

    const tamperedRequest = structuredClone(artifact);
    tamperedRequest.weightedFindingTendencyRequest!.contributorBindings[0]!.id =
      'weighted-finding-tendency-binding.test.tampered';
    expect(verifyFindingPipelineAuditIntegrity(tamperedRequest)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });

    const obsolete = structuredClone(artifact);
    obsolete.composerVersion = '3.0.0';
    expect(verifyFindingPipelineAuditIntegrity(obsolete)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_COMPOSER_VERSION' },
    });
  });

  it('rejects crossed or tampered upstream artifacts before attachment', () => {
    const request = makeRequest();
    const crossed = makeRequest({
      includeWeighted: false,
      generationRoot: 'generation-root.test.crossed-condition',
    });
    downstreamOf(crossed).conditionFindingArtifact = downstreamOf(request).conditionFindingArtifact;
    const result = composeFindingPipelineAudit(crossed);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected invalid upstream chain');
    expect(result.error.code).toBe('INVALID_REQUEST');

    const wrongTemplate = makeRequest({ conditionSourceKind: 'd202' });
    wrongTemplate.patientSlotFillSeedAuthorityArtifact = structuredClone(
      makeRequest().patientSlotFillSeedAuthorityArtifact,
    );
    const templateResult = composeFindingPipelineAudit(wrongTemplate);
    expect(templateResult.ok).toBe(false);
    if (templateResult.ok) {
      throw new Error('Expected template context mismatch');
    }
    expect(templateResult.error.code).toMatch(
      /^(INVALID_REQUEST|PATIENT_SEED_CONTEXT_MISMATCH|TEMPLATE_CONTEXT_MISMATCH)$/,
    );

    const crossedBackground = makeRequest({
      includeWeighted: false,
      generationRoot: 'generation-root.test.background-crossover',
    });
    const wrongBackgroundRequest = makeRequest({ includeWeighted: false });
    downstreamOf(wrongBackgroundRequest).backgroundFindingArtifact =
      downstreamOf(crossedBackground).backgroundFindingArtifact;
    const backgroundResult = composeFindingPipelineAudit(wrongBackgroundRequest);
    expect(backgroundResult.ok).toBe(false);
    if (backgroundResult.ok) throw new Error('Expected D-197 to D-198 chain mismatch');
    expect(backgroundResult.error.code).toBe('INVALID_REQUEST');

    const crossedWeighted = makeRequest({
      generationRoot: 'generation-root.test.weighted-crossover',
    });
    const wrongWeightedRequest = makeRequest();
    downstreamOf(wrongWeightedRequest).weightedFindingTendencyApplicabilityArtifact =
      downstreamOf(crossedWeighted).weightedFindingTendencyApplicabilityArtifact;
    const weightedResult = composeFindingPipelineAudit(wrongWeightedRequest);
    expect(weightedResult.ok).toBe(false);
    if (weightedResult.ok) throw new Error('Expected a crossed D-210 chain mismatch');
    expect(weightedResult.error.code).toMatch(/^(INVALID_REQUEST|ARTIFACT_CHAIN_MISMATCH)$/);
  });

  it('rejects tampered D-208 patient state or condition bindings before attachment', () => {
    const obsoletePreFinding = makeRequest();
    preFindingOf(obsoletePreFinding).resolverVersion = '99.0.0';
    const obsoletePreFindingResult = composeFindingPipelineAudit(obsoletePreFinding);
    expect(obsoletePreFindingResult).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PRE_FINDING_PATIENT_STATE_ORCHESTRATION' },
    });

    const request = makeRequest();
    patientStateCompositionOf(request).composedPatientState!.clinicalTagIds = [
      'clinical-tag.test.tampered',
    ];
    const result = composeFindingPipelineAudit(request);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected D-208 state tampering failure');
    expect(result.error.code).toBe('INVALID_REQUEST');

    const droppedBinding = makeRequest();
    patientStateCompositionOf(droppedBinding).conditionBindings = [];
    const bindingResult = composeFindingPipelineAudit(droppedBinding);
    expect(bindingResult.ok).toBe(false);
    if (bindingResult.ok) {
      throw new Error('Expected D-208 binding tampering failure');
    }
    expect(bindingResult.error.code).toBe('INVALID_REQUEST');

    const retained = expectComposed(makeRequest());
    preFindingOf(retained).resolverVersion = '99.0.0';
    expect(verifyFindingPipelineAuditIntegrity(retained)).toMatchObject({
      ok: false,
      error: { code: 'UPSTREAM_INTEGRITY_INVALID' },
    });
  });

  it('uses D-198 without D-199 and D-199 when present while retaining both soft traces', () => {
    const backgroundOnly = expectComposed(makeRequest({ includeWeighted: false }));
    const backgroundCandidate = backgroundOnly.backgroundFindingArtifact.candidates[0]!;
    expect(backgroundOnly.weightedFindingTendencyApplicabilityArtifact.evaluations).toHaveLength(1);
    expect(
      backgroundOnly.weightedFindingTendencyApplicabilityArtifact.evaluations[0],
    ).toMatchObject({
      patientPredicateMatched: false,
      contributorBindingId: null,
      applicabilityContributionId: null,
    });
    expect(backgroundOnly.weightedFindingTendencyApplicabilityArtifact.contributorBindings).toEqual(
      [],
    );
    expect(backgroundOnly.weightedFindingTendencyRequest).toBeNull();
    expect(backgroundOnly.weightedFindingTendencyArtifact).toBeNull();
    expect(evaluationFor(backgroundOnly, backgroundCandidate.id)?.disposition).toBe('applied');

    const weighted = expectComposed(makeRequest());
    const retainedBackground = weighted.backgroundFindingArtifact.candidates[0]!;
    const weightedCandidate = weighted.weightedFindingTendencyArtifact!.candidates[0]!;
    expect(evaluationFor(weighted, weightedCandidate.id)?.disposition).toBe('applied');
    expect(evaluationFor(weighted, retainedBackground.id)?.disposition).toMatch(
      /^(compatible_not_decisive|higher_priority_candidate_prevailed)$/,
    );
    expect(
      weighted.candidateUnion.some((candidate) => candidate.id === retainedBackground.id),
    ).toBe(true);
  });

  it('substitutes a selected D-201 finding texture for the matching D-198 baseline exactly once', () => {
    const artifact = expectComposed(
      makeRequest({
        includeWeighted: false,
        includeFindingTextureBridge: true,
      }),
    );
    const preFinding = preFindingOf(artifact);
    const bridge = preFinding.findingTextureBridgeArtifact;
    const backgroundCandidate = artifact.backgroundFindingArtifact.candidates[0]!;

    expect(bridge).not.toBeNull();
    expect(bridge?.optionalFeatureSelectedCount).toBe(1);
    expect(bridge?.optionalFeatureTotalSpent).toBe(1);
    expect(bridge?.optionalFeatureRemainingBudget).toBe(0);
    expect(bridge?.candidates).toHaveLength(1);
    const textureCandidate = bridge!.candidates[0]!;
    expect(textureCandidate).toMatchObject({
      findingDefinitionId: textureFinding.id,
      kind: 'background_variation',
      proposedValue: { kind: 'outcome', value: 'subthreshold' },
    });
    expect(artifact.candidateUnion.some((candidate) => candidate.id === textureCandidate.id)).toBe(
      true,
    );
    expect(
      artifact.candidateUnion.some((candidate) => candidate.id === backgroundCandidate.id),
    ).toBe(false);
    expect(evaluationFor(artifact, textureCandidate.id)?.disposition).toBe('applied');
    expect(
      artifact.catalogSnapshot?.patientInstance.patientState.canonicalFindings.find(
        (finding) => finding.definitionId === textureFinding.id,
      )?.value,
    ).toEqual({ kind: 'outcome', value: 'subthreshold' });
    expect(preFinding.patientStateCompositionArtifact.selectedModuleAudits).toContainEqual(
      expect.objectContaining({
        moduleKind: 'finding_texture',
        ownerKind: 'finding_texture_bridge',
        materializationStatus: 'materialized',
        cost: 1,
        materializedRecordIds: [textureCandidate.id],
      }),
    );
  });

  it('preserves D-197 hard precedence over soft lanes', () => {
    const artifact = expectComposed(makeRequest({ softTarget: 'core' }));
    const requiredCandidate = artifact.conditionFindingArtifact.candidates[0]!;
    const backgroundCandidate = artifact.backgroundFindingArtifact.candidates[0]!;
    const weightedCandidate = artifact.weightedFindingTendencyArtifact!.candidates[0]!;
    expect(evaluationFor(artifact, requiredCandidate.id)?.disposition).toBe('applied');
    expect(evaluationFor(artifact, backgroundCandidate.id)?.disposition).toMatch(
      /^(compatible_not_decisive|required_value_prevailed)$/,
    );
    expect(evaluationFor(artifact, weightedCandidate.id)?.disposition).toMatch(
      /^(compatible_not_decisive|required_value_prevailed)$/,
    );
    expect(
      artifact.catalogSnapshot?.patientInstance.patientState.canonicalFindings.find(
        (finding) => finding.definitionId === coreFinding.id,
      )?.value,
    ).toEqual({ kind: 'outcome', value: 'present' });
  });

  it('returns a stable hard-conflict audit and rejects union collisions or tampering', () => {
    const opposingCandidate = opposingCoreFindingCandidate();
    const request = makeRequest({
      authoredCandidates: [opposingCandidate],
    });
    const conflict = expectComposed(request);
    expect(conflict.status).toBe('literal_finding_conflict');
    expect(conflict.catalogSnapshot).toBeNull();
    expect(conflict.sharedFindingConflict).toMatchObject({
      code: 'LITERAL_SAME_SCOPE_CONTRADICTION',
      disposition: 'retry_or_quarantine',
    });
    expect(verifyFindingPipelineAuditIntegrity(conflict).ok).toBe(true);
    expect(expectComposed(structuredClone(request))).toEqual(conflict);

    const invalidSelectionConflict = makeRequest({
      authoredCandidates: [opposingCandidate],
      includeStructuredReport: true,
    });
    const invalidSelection =
      downstreamOf(invalidSelectionConflict).catalogCompileRecipe
        .structuredSourceReportSelectionArtifact!;
    invalidSelection.inputFingerprint =
      'fingerprint.structured-source-report-selection.input.fnv1a64.0000000000000000';
    expect(FindingPipelineAuditRequestSchema.safeParse(invalidSelectionConflict).success).toBe(
      true,
    );
    expect(composeFindingPipelineAudit(invalidSelectionConflict).ok).toBe(false);

    const collisionRequest = makeRequest();
    downstreamOf(collisionRequest).catalogCompileRecipe.authoredFindingCandidates = [
      structuredClone(downstreamOf(collisionRequest).conditionFindingArtifact.candidates[0]!),
    ];
    downstreamOf(collisionRequest).catalogCompileRecipe.authoredFindingCandidates[0]!.kind =
      'case_critical';
    const collision = composeFindingPipelineAudit(collisionRequest);
    expect(collision.ok).toBe(false);
    if (collision.ok) throw new Error('Expected union collision');
    expect(collision.error.code).toBe('CANDIDATE_UNION_COLLISION');

    const tampered = structuredClone(conflict);
    tampered.candidateUnion[0]!.findingDefinitionContentVersion = '9.9.9';
    expect(verifyFindingPipelineAuditIntegrity(tampered).ok).toBe(false);

    const compiled = expectComposed(makeRequest());
    const wrongRetainedTemplate = structuredClone(compiled);
    wrongRetainedTemplate.catalogCompileRequest.template.internalLabel =
      'Crossed retained template';
    expect(verifyFindingPipelineAuditIntegrity(wrongRetainedTemplate).ok).toBe(false);

    const wrongRetainedCondition = structuredClone(compiled);
    wrongRetainedCondition.catalogCompileRequest.basePatientState.conditionStates[0] = {
      ...wrongRetainedCondition.catalogCompileRequest.basePatientState.conditionStates[0]!,
      encounterRelevance: 'background',
    };
    expect(verifyFindingPipelineAuditIntegrity(wrongRetainedCondition).ok).toBe(false);

    const wrongRetainedBinding = structuredClone(compiled);
    wrongRetainedBinding.catalogCompileRequest.conditionBindings = [];
    expect(verifyFindingPipelineAuditIntegrity(wrongRetainedBinding).ok).toBe(false);

    const obsoleteComposerVersion = structuredClone(compiled);
    obsoleteComposerVersion.composerVersion = '2.0.0';
    expect(verifyFindingPipelineAuditIntegrity(obsoleteComposerVersion)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_COMPOSER_VERSION' },
    });
  });
});

describe('D-233 empty-slot seed and atomic fill authority', () => {
  it('domain-separates template selection and makes the exact selected template part of the patient seed', () => {
    const baseRequest = makeRequest();
    const templateA = structuredClone(admittedBindingOf(baseRequest).template);
    const templateB = structuredClone(templateA);
    templateB.id = 'patient-template.test.finding-pipeline-alternate';
    const location = admittedBindingOf(baseRequest).location;
    const decisionActionHorizon =
      downstreamOf(baseRequest).catalogCompileRecipe.decisionActionHorizon;
    const assembly =
      downstreamOf(baseRequest).catalogCompileRecipe.universalActionResultAssemblyRecipe;
    const authorityA = compilePipelineSlotSelection({
      template: templateA,
      location,
      decisionActionHorizon,
      universalActionResultAssemblyRecipe: assembly,
    }).patientSlotFillSeedAuthorityArtifact;
    const authorityB = compilePipelineSlotSelection({
      template: templateB,
      location,
      decisionActionHorizon,
      universalActionResultAssemblyRecipe: assembly,
    }).patientSlotFillSeedAuthorityArtifact;

    expect(authorityA.templateSelectionSeed).toBe(authorityB.templateSelectionSeed);
    expect(authorityA.selectedTemplateRef.id).not.toBe(authorityB.selectedTemplateRef.id);
    expect(authorityA.patientGenerationSeed).not.toBe(authorityB.patientGenerationSeed);
    expect(authorityA.templateSelectionSeed).not.toBe(authorityA.patientGenerationSeed);

    const nextOrdinal = compilePipelineSlotSelection({
      template: templateA,
      location,
      decisionActionHorizon,
      universalActionResultAssemblyRecipe: assembly,
      fillOrdinal: 1,
    }).patientSlotFillSeedAuthorityArtifact;
    expect(nextOrdinal.templateSelectionSeed).not.toBe(authorityA.templateSelectionSeed);
    expect(nextOrdinal.patientGenerationSeed).not.toBe(authorityA.patientGenerationSeed);
  });

  it('keeps seed entropy independent of request identities, unrelated slots, weights, and recent-history audit state', () => {
    const fixture = makeRequestFixture({ capacityBaseSlotCount: 2 });
    const original = fixture.slotSelection.patientSlotFillSeedAuthorityArtifact;
    const changedInput = structuredClone(
      fixture.slotSelection.patientSlotFillSeedAuthorityCompileInput,
    );
    changedInput.id = 'patient-slot-fill-seed-authority-request.test.audit-only-change';
    changedInput.currentOccupancyInput.id =
      'location-patient-slot-occupancy-request.test.audit-only-change';
    changedInput.currentOccupancyInput.entries.reverse();
    const unrelated = changedInput.currentOccupancyInput.entries.find(
      (entry) => entry.slotCoordinateId !== original.coordinates.slotCoordinateId,
    );
    if (unrelated === undefined) {
      throw new Error('Expected a second empty coordinate.');
    }
    unrelated.nextFillOrdinal = 7;
    const changedOccupancy = compileLocationPatientSlotOccupancySnapshot(
      changedInput.currentOccupancyInput,
    );
    if (!changedOccupancy.ok) {
      throw new Error(changedOccupancy.error.message);
    }
    changedInput.occupancySnapshotArtifact = changedOccupancy.value;
    changedInput.distributionProfile.templateWeights[0]!.gameSelectionWeight = 17;
    changedInput.recentCompletionContext.id =
      'location-template-recent-completion-context.test.audit-only-change';
    changedInput.recentCompletionContext.recentCompletedTemplateIdsNewestFirst = [
      original.selectedTemplateRef.id,
    ];
    const changed = compilePatientSlotFillSeedAuthority(changedInput);
    if (!changed.ok) throw new Error(changed.error.message);

    expect(verifyLocationPatientSlotOccupancySnapshotIntegrity(changedOccupancy.value)).toEqual({
      ok: true,
      value: changedOccupancy.value,
    });
    expect(
      verifyLocationPatientSlotOccupancySnapshotContext({
        artifact: changedOccupancy.value,
        currentInput: changedInput.currentOccupancyInput,
      }),
    ).toEqual({ ok: true, value: changedOccupancy.value });
    expect(changed.value.templateSelectionSeed).toBe(original.templateSelectionSeed);
    expect(changed.value.patientGenerationSeed).toBe(original.patientGenerationSeed);
    expect(changed.value.inputFingerprint).not.toBe(original.inputFingerprint);
    expect(changed.value.locationTemplateSelectionArtifact.inputFingerprint).not.toBe(
      original.locationTemplateSelectionArtifact.inputFingerprint,
    );
    expect(PatientSlotFillSeedAuthorityArtifactSchema.parse(changed.value)).toEqual(changed.value);
    expect(verifyPatientSlotFillSeedAuthorityIntegrity(changed.value)).toEqual({
      ok: true,
      value: changed.value,
    });
    expect(
      verifyPatientSlotFillSeedAuthorityContext({
        artifact: changed.value,
        currentInput: changedInput,
      }),
    ).toEqual({ ok: true, value: changed.value });

    const crossedMode = structuredClone(changedInput);
    crossedMode.recentCompletionContext.mode = 'developer';
    expect(compilePatientSlotFillSeedAuthority(crossedMode)).toMatchObject({
      ok: false,
      error: { code: 'MODE_CONTEXT_MISMATCH' },
    });
  });

  it('fills canonical empty coordinates one at a time without rerolling an occupied patient', () => {
    const firstFixture = makeFillFixture({ capacityBaseSlotCount: 2 });
    const before = structuredClone(firstFixture.input);
    const first = expectFillCompiled(firstFixture.input);
    const firstCoordinateId = first.seedAuthorityArtifact.coordinates.slotCoordinateId;

    expect(firstFixture.input).toEqual(before);
    expect(
      getFirstEmptyLocationPatientSlotCoordinateId(
        first.seedAuthorityArtifact.occupancySnapshotArtifact,
      ),
    ).toBe(firstCoordinateId);
    expect(EmptyAuthorizedPatientSlotFillArtifactSchema.parse(first)).toEqual(first);
    expect(first).toMatchObject({
      status: 'filled',
      attemptedFillOrdinal: 0,
      nextFillOrdinal: 1,
      diagnostics: [],
    });
    expect(first.frozenWaitingSlotProposal).not.toBeNull();
    expect(
      occupancyEntryAt(first.seedAuthorityArtifact.occupancySnapshotArtifact, firstCoordinateId)
        .status,
    ).toBe('empty');
    const occupiedFirst = occupancyEntryAt(
      first.proposedOccupancySnapshotArtifact,
      firstCoordinateId,
    );
    expect(occupiedFirst.status).toBe('occupied');
    expect(verifyEmptyAuthorizedPatientSlotFillIntegrity(first)).toEqual({
      ok: true,
      value: first,
    });
    expect(
      verifyEmptyAuthorizedPatientSlotFillContext({
        artifact: first,
        currentInput: firstFixture.input,
      }),
    ).toEqual({ ok: true, value: first });
    expect(expectFillCompiled(structuredClone(firstFixture.input))).toEqual(first);

    const firstWaitingSlot = first.frozenWaitingSlotProposal;
    if (firstWaitingSlot === null) {
      throw new Error('Expected the first complete frozen waiting slot.');
    }
    const secondFixture = makeFillFixture({
      capacityBaseSlotCount: 2,
      occupiedWaitingSlots: [firstWaitingSlot],
    });
    const secondCoordinateId =
      secondFixture.slotSelection.patientSlotFillSeedAuthorityArtifact.coordinates.slotCoordinateId;
    expect(secondCoordinateId).not.toBe(firstCoordinateId);
    expect(
      secondFixture.slotSelection.patientSlotFillSeedAuthorityArtifact.localRepeatContext
        .activeWaitingAssignments,
    ).toEqual([
      {
        slotCoordinateId: firstCoordinateId,
        templateId: first.seedAuthorityArtifact.selectedTemplateRef.id,
      },
    ]);
    const second = expectFillCompiled(secondFixture.input);
    expect(second.status).toBe('filled');
    expect(
      second.proposedOccupancySnapshotArtifact.entries.filter(
        (entry) => entry.status === 'occupied',
      ),
    ).toHaveLength(2);
    expect(occupancyEntryAt(second.proposedOccupancySnapshotArtifact, firstCoordinateId)).toEqual(
      occupancyEntryAt(second.seedAuthorityArtifact.occupancySnapshotArtifact, firstCoordinateId),
    );
  });

  it('records hard and literal-conflict blockers, consumes one ordinal, and requires an explicit retry', () => {
    const hardFixture = makeFillFixture();
    const hardCandidate = structuredClone(
      downstreamOf(hardFixture.request).conditionFindingArtifact.candidates[0]!,
    );
    hardCandidate.kind = 'case_critical';
    downstreamOf(hardFixture.request).catalogCompileRecipe.authoredFindingCandidates = [
      hardCandidate,
    ];
    const hardBlocked = expectFillCompiled(hardFixture.input);
    expect(hardBlocked).toMatchObject({
      status: 'blocked',
      attemptedFillOrdinal: 0,
      nextFillOrdinal: 1,
      findingPipelineAuditArtifact: null,
      frozenWaitingSlotProposal: null,
      diagnostics: [{ code: 'patient_compilation_failed' }],
    });
    expect(
      occupancyEntryAt(
        hardBlocked.proposedOccupancySnapshotArtifact,
        hardBlocked.slotCoordinate.id,
      ),
    ).toMatchObject({
      status: 'empty',
      nextFillOrdinal: 1,
      occupiedAssignment: null,
    });
    expect(verifyEmptyAuthorizedPatientSlotFillIntegrity(hardBlocked)).toEqual({
      ok: true,
      value: hardBlocked,
    });
    expect(expectFillCompiled(structuredClone(hardFixture.input))).toEqual(hardBlocked);

    const literalFixture = makeFillFixture({
      authoredCandidates: [opposingCoreFindingCandidate()],
    });
    const literalBlocked = expectFillCompiled(literalFixture.input);
    expect(literalBlocked).toMatchObject({
      status: 'blocked',
      findingPipelineAuditArtifact: {
        status: 'literal_finding_conflict',
      },
      frozenWaitingSlotProposal: null,
      diagnostics: [{ code: 'literal_finding_conflict' }],
    });
    expect(verifyEmptyAuthorizedPatientSlotFillIntegrity(literalBlocked)).toEqual({
      ok: true,
      value: literalBlocked,
    });

    const retryInput = structuredClone(
      hardFixture.slotSelection.patientSlotFillSeedAuthorityCompileInput,
    );
    retryInput.id = 'patient-slot-fill-seed-authority-request.test.explicit-retry';
    retryInput.currentOccupancyInput.id =
      'location-patient-slot-occupancy-request.test.explicit-retry';
    const retryTarget = retryInput.currentOccupancyInput.entries.find(
      (entry) => entry.slotCoordinateId === hardBlocked.slotCoordinate.id,
    );
    if (retryTarget === undefined) throw new Error('Expected the retry target.');
    retryTarget.nextFillOrdinal = hardBlocked.nextFillOrdinal;
    const retryOccupancy = compileLocationPatientSlotOccupancySnapshot(
      retryInput.currentOccupancyInput,
    );
    if (!retryOccupancy.ok) throw new Error(retryOccupancy.error.message);
    retryInput.occupancySnapshotArtifact = retryOccupancy.value;
    const retryAuthority = compilePatientSlotFillSeedAuthority(retryInput);
    if (!retryAuthority.ok) throw new Error(retryAuthority.error.message);
    expect(retryAuthority.value.coordinates.fillOrdinal).toBe(1);
    expect(retryAuthority.value.templateSelectionSeed).not.toBe(
      hardBlocked.seedAuthorityArtifact.templateSelectionSeed,
    );
    expect(retryAuthority.value.patientGenerationSeed).not.toBe(
      hardBlocked.seedAuthorityArtifact.patientGenerationSeed,
    );
  });

  it('rejects unproved relocation and a separately valid occupancy that changes an unrelated row', () => {
    const fixture = makeFillFixture({ capacityBaseSlotCount: 2 });
    const filled = expectFillCompiled(fixture.input);
    const waitingSlot = filled.frozenWaitingSlotProposal;
    if (waitingSlot === null) throw new Error('Expected a frozen patient.');
    const originCoordinateId = filled.slotCoordinate.id;
    const otherCoordinateId = fixture.slotSelection.occupancySnapshotArtifact.entries.find(
      (entry) => entry.capacityCoordinate.slotCoordinate.id !== originCoordinateId,
    )?.capacityCoordinate.slotCoordinate.id;
    if (otherCoordinateId === undefined) {
      throw new Error('Expected an unrelated coordinate.');
    }

    const relocatedInput = structuredClone(fixture.slotSelection.occupancySnapshotCompileInput);
    const relocatedTarget = relocatedInput.entries.find(
      (entry) => entry.slotCoordinateId === otherCoordinateId,
    );
    if (relocatedTarget === undefined) throw new Error('Expected relocation target.');
    relocatedTarget.nextFillOrdinal = 1;
    relocatedTarget.frozenWaitingSlot = waitingSlot;
    expect(compileLocationPatientSlotOccupancySnapshot(relocatedInput)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_WAITING_SLOT' },
    });

    const driftedInput = structuredClone(fixture.slotSelection.occupancySnapshotCompileInput);
    const filledTarget = driftedInput.entries.find(
      (entry) => entry.slotCoordinateId === originCoordinateId,
    );
    const unrelatedTarget = driftedInput.entries.find(
      (entry) => entry.slotCoordinateId === otherCoordinateId,
    );
    if (filledTarget === undefined || unrelatedTarget === undefined) {
      throw new Error('Expected both occupancy rows.');
    }
    filledTarget.nextFillOrdinal = 1;
    filledTarget.frozenWaitingSlot = waitingSlot;
    unrelatedTarget.nextFillOrdinal = 9;
    const driftedOccupancy = compileLocationPatientSlotOccupancySnapshot(driftedInput);
    if (!driftedOccupancy.ok) throw new Error(driftedOccupancy.error.message);
    expect(
      LocationPatientSlotOccupancySnapshotArtifactSchema.parse(driftedOccupancy.value),
    ).toEqual(driftedOccupancy.value);
    const crossed = structuredClone(filled);
    crossed.proposedOccupancySnapshotArtifact = driftedOccupancy.value;
    expect(EmptyAuthorizedPatientSlotFillArtifactSchema.safeParse(crossed).success).toBe(false);
    expect(verifyEmptyAuthorizedPatientSlotFillIntegrity(crossed).ok).toBe(false);
  });
});

describe('D-235 native generated completed-attempt persistence contract', () => {
  const purchaseInputFor = (
    waitingSlot: FrozenGeneratedWaitingSlot,
    suffix: string,
  ): GeneratedEncounterActionEventInput => {
    const snapshot = waitingSlot.findingPipelineAuditArtifact.catalogSnapshot;
    if (snapshot === null) throw new Error('Expected one compiled catalog snapshot.');
    const actionDefinitions = snapshot.universalActionResultAssemblyRecipe.actionCatalog.actions;
    const actionId = snapshot.encounterInstance.decisionActionHorizon.informationActionIds.find(
      (candidateId) =>
        actionDefinitions.some(
          (definition) => definition.id === candidateId && !definition.repeatable,
        ),
    );
    if (actionId === undefined) throw new Error('Expected one nonrepeatable action.');
    const evaluation = snapshot.operationalAdmissionArtifact.informationActionEvaluations.find(
      (candidate) => candidate.informationActionId === actionId,
    );
    const method = evaluation?.fulfillmentMethods.find(
      (candidate) => candidate.availability === 'available_at_selected_location',
    );
    if (method === undefined) throw new Error('Expected one available fulfillment method.');
    return {
      id: `generated-action-event.test.purchase.${suffix}`,
      type: 'InformationPurchased',
      purchase: {
        id: `generated-information-purchase.test.${suffix}`,
        informationActionId: actionId,
      },
    };
  };

  it('freezes one exact patient/encounter, replays action history, and separates persistence time', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'complete_encounter',
      mode: 'standard',
    });
    const purchase = purchaseInputFor(fixture.waitingSlot, 'native');
    const attempt = createNativeGeneratedAttempt({
      attemptId: 'generated-completed-attempt.test.native',
      mode: 'standard',
      frozenWaitingSlot: fixture.waitingSlot,
      actionEvents: [purchase],
    });

    expect(GeneratedCompletedEncounterAttemptSchema.parse(attempt)).toEqual(attempt);
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(attempt)).toEqual({
      ok: true,
      value: attempt,
    });
    expect(
      verifyGeneratedCompletedEncounterAttemptContext({
        attempt,
        frozenWaitingSlot: fixture.waitingSlot,
      }),
    ).toEqual({ ok: true, value: attempt });
    expect(JSON.parse(JSON.stringify(attempt))).toEqual(attempt);
    expect(
      attempt.replaySnapshot.encounterInstance.compiledRubric.includedRules.find(
        (rule) => rule.ruleRef.id === 'rule.test.pipeline-medication-reconciliation-prerequisite',
      )?.triggeredInformationPrerequisite,
    ).not.toBeNull();
    expect(
      attempt.pointReport.ruleTrace.find(
        (row) =>
          row.source.kind === 'compiled_decision_rule' &&
          row.source.ruleRef.id === 'rule.test.pipeline-medication-reconciliation-prerequisite',
      ),
    ).toMatchObject({
      status: 'unbalanced',
      appliedPoints: 0,
      triggeredInformationPrerequisiteEvaluation: {
        status: 'not_triggered',
        triggerSelected: false,
        fulfillmentSelected: true,
      },
    });
    expect(attempt).toMatchObject({
      replaySnapshot: {
        patientInstance: {
          id: fixture.waitingSlot.findingPipelineAuditArtifact.catalogSnapshot!.patientInstance.id,
        },
        encounterInstance: {
          id: fixture.waitingSlot.findingPipelineAuditArtifact.catalogSnapshot!.encounterInstance
            .id,
        },
      },
      purchases: [
        {
          informationActionId:
            purchase.type === 'InformationPurchased' ? purchase.purchase.informationActionId : '',
          operatingCost: 25,
          pricingDerivation: 'native_versioned_service_quote.v1',
        },
      ],
      pointReport: {
        modelVersion: 'generated-encounter-point-report.v6',
        balanceCatalogSnapshot: {
          modelVersion: 'decision-balance-catalog-snapshot.v1',
          balances: [],
        },
        playerDecision: {
          informationActionIds: [
            purchase.type === 'InformationPurchased' ? purchase.purchase.informationActionId : '',
          ],
          diagnosisSelections: [],
        },
        databasePlanDecision: {
          informationActionIds: [],
          diagnosisSelections: [],
        },
        databasePlanRuleTrace: expect.any(Array),
        carePointsEarned: 0,
        databasePlanPoints: 0,
      },
      settlement: {
        informationExpenses: 25,
        projectedNetPointsEarned: 375,
        bankedPointsEarned: 375,
        practiceMode: false,
      },
    });

    const firstRecord = createGeneratedCompletedEncounterAttemptPersistenceRecord({
      attempt,
      completedAt: '2026-07-30T12:00:00.000Z',
    });
    const secondRecord = createGeneratedCompletedEncounterAttemptPersistenceRecord({
      attempt,
      completedAt: '2026-07-30T13:00:00.000Z',
    });
    expect(GeneratedCompletedEncounterAttemptPersistenceRecordSchema.parse(firstRecord)).toEqual(
      firstRecord,
    );
    expect(verifyGeneratedCompletedEncounterAttemptPersistenceRecord(firstRecord)).toEqual({
      ok: true,
      value: firstRecord,
    });
    expect(firstRecord.attempt.replayFingerprint).toBe(secondRecord.attempt.replayFingerprint);
    expect(firstRecord.recordFingerprint).not.toBe(secondRecord.recordFingerprint);
  });

  it('replays chained native rule combination and rejects status, target, or source-row tampering', () => {
    const baseRules = decisionRules();
    const patientWhen = baseRules[0]!.patientWhen;
    const medicationTarget = {
      kind: 'medication_start' as const,
      medicationIdentityId: 'medication.bupropion',
    };
    const secondaryRule = (input: {
      readonly id: string;
      readonly ruleKind: 'fit' | 'contraindication';
      readonly stance: 'acceptable' | 'contraindicated';
      readonly effectId: string | null;
      readonly issueId: string | null;
      readonly specificityPriority: number;
      readonly balanceId: string;
    }): DecisionRuleCandidateDefinition => ({
      schemaVersion: 1,
      ruleRef: {
        kind: 'medication_regimen_contributor',
        id: input.id,
        contentVersion: '1.0.0',
        ownerId: 'diagnosis.major-depressive-disorder',
        ownerContentVersion: '1.0.0',
      },
      label: input.id,
      ruleKind: input.ruleKind,
      discoveryLane: input.ruleKind === 'fit' ? 'full_state_modifier' : 'automatic_guardrail',
      patientWhen,
      actionWhen: { match: 'all', targets: [medicationTarget] },
      triggeredInformationPrerequisite: null,
      stance: input.stance,
      concernLevel: input.ruleKind === 'fit' ? 'moderate' : 'critical',
      certaintyLevel: 'moderate',
      effectId: input.effectId,
      issueId: input.issueId,
      specificityPriority: input.specificityPriority,
      rationale: 'Synthetic D-245 completed-attempt combination fixture.',
      balanceRef: { id: input.balanceId, contentVersion: '1.0.0' },
      developerOpinionIds: [],
      review: approvedReview,
    });
    const generalFit = secondaryRule({
      id: 'medication-regimen-contributor.test.d235-general-fit',
      ruleKind: 'fit',
      stance: 'acceptable',
      effectId: 'effect.test.d235-fit',
      issueId: null,
      specificityPriority: 10,
      balanceId: 'balance.test.d235-general-fit',
    });
    const specificFit = secondaryRule({
      id: 'medication-regimen-contributor.test.d235-specific-fit',
      ruleKind: 'fit',
      stance: 'acceptable',
      effectId: 'effect.test.d235-fit',
      issueId: null,
      specificityPriority: 30,
      balanceId: 'balance.test.d235-specific-fit',
    });
    const stableFirstContraindication = secondaryRule({
      id: 'medication-regimen-contributor.test.d235-contraindication-alpha',
      ruleKind: 'contraindication',
      stance: 'contraindicated',
      effectId: null,
      issueId: 'issue.test.d235-contraindication',
      specificityPriority: 20,
      balanceId: 'balance.test.d235-contraindication-alpha',
    });
    const worstContraindication = secondaryRule({
      id: 'medication-regimen-contributor.test.d235-contraindication-zeta',
      ruleKind: 'contraindication',
      stance: 'contraindicated',
      effectId: null,
      issueId: 'issue.test.d235-contraindication',
      specificityPriority: 40,
      balanceId: 'balance.test.d235-contraindication-zeta',
    });
    const secondaryRules = [
      generalFit,
      specificFit,
      stableFirstContraindication,
      worstContraindication,
    ];
    const fillFixture = makeFillFixture({
      mode: 'endgame',
      decisionRules: [...baseRules, ...secondaryRules],
    });
    const fill = expectFillCompiled(fillFixture.input);
    const waitingSlot = fill.frozenWaitingSlotProposal;
    if (waitingSlot === null) throw new Error('Expected a D-245 waiting patient.');
    const balancePoints = new Map([
      [generalFit.ruleRef.id, 20],
      [specificFit.ruleRef.id, 35],
      [stableFirstContraindication.ruleRef.id, -100],
      [worstContraindication.ruleRef.id, -150],
    ]);
    const balanceCatalog: GeneratedCompletedEncounterAttemptCompileInput['pointDerivation']['balanceCatalog'] =
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'registry.catalog.decision-balances.test.d235-combination',
        balances: secondaryRules.map((rule) => ({
          schemaVersion: 1,
          contentVersion: '1.0.0',
          id: rule.balanceRef!.id,
          ruleRef: rule.ruleRef,
          balanceStatus: 'provisional_balance' as const,
          impactBand:
            rule.ruleKind === 'contraindication' ? ('critical' as const) : ('major' as const),
          component:
            rule.ruleKind === 'contraindication'
              ? ('safety' as const)
              : ('medication_selection' as const),
          pointsWhenMatched: balancePoints.get(rule.ruleRef.id)!,
          unmatchedBehavior: 'not_triggered_zero' as const,
          matchedExplanation: 'Synthetic D-245 rule matched.',
          unmatchedExplanation: 'Synthetic D-245 rule did not match.',
          rationale: 'Synthetic D-245 completed-attempt combination fixture.',
          developerOpinionIds: ['developer-opinion.test.d235-combination'],
        })),
      };
    const pointDerivation: GeneratedCompletedEncounterAttemptCompileInput['pointDerivation'] = {
      balanceCatalog,
      medicationRegimenKnowledgeCatalog: {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'registry.catalog.medication-regimen-knowledge.test.empty',
        medicationClasses: [],
        classMemberships: [],
        focusedRoutes: [],
        contributors: [],
        sourceUseNotes: [],
      },
      databasePlanDecision: {
        schemaVersion: 1,
        selectionVersion: 1,
        informationActionIds: [],
        diagnosisSelections: [],
        treatmentSelection: {
          schemaVersion: 1,
          selectionVersion: 2,
          medicationTransition: {
            selectionVersion: 2,
            startMedicationIds: [],
            adjustments: [],
          },
          interventionIds: [],
          dispositionId: null,
        },
      },
    };
    const attempt = createNativeGeneratedAttempt({
      attemptId: 'generated-completed-attempt.test.d235-combination',
      mode: 'endgame',
      frozenWaitingSlot: waitingSlot,
      actionEvents: [
        {
          id: 'generated-action-event.test.d235-combination-treatment',
          type: 'TreatmentSelectionsChanged',
          selections: {
            schemaVersion: 1,
            selectionVersion: 2,
            medicationTransition: {
              selectionVersion: 2,
              startMedicationIds: ['medication.bupropion'],
              adjustments: [],
            },
            interventionIds: [],
            dispositionId: null,
          },
        },
      ],
      pointDerivation,
    });
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(attempt)).toEqual({
      ok: true,
      value: attempt,
    });
    expect(attempt.pointReport.carePointsEarned).toBe(-150);
    const rowsByRuleId = new Map(
      attempt.pointReport.ruleTrace.flatMap((row) =>
        row.source.kind === 'compiled_decision_rule' ? [[row.source.ruleRef.id, row] as const] : [],
      ),
    );
    expect(rowsByRuleId.get(generalFit.ruleRef.id)).toMatchObject({
      status: 'replaced',
      resolvedByTraceId: rowsByRuleId.get(specificFit.ruleRef.id)?.id,
    });
    expect(rowsByRuleId.get(specificFit.ruleRef.id)).toMatchObject({
      status: 'suppressed',
      resolvedByTraceId: rowsByRuleId.get(stableFirstContraindication.ruleRef.id)?.id,
    });
    expect(rowsByRuleId.get(stableFirstContraindication.ruleRef.id)).toMatchObject({
      status: 'deduplicated',
      resolvedByTraceId: rowsByRuleId.get(worstContraindication.ruleRef.id)?.id,
    });
    expect(rowsByRuleId.get(worstContraindication.ruleRef.id)).toMatchObject({
      status: 'applied',
      appliedPoints: -150,
    });
    expect(
      attempt.pointReport.databasePlanRuleTrace.reduce(
        (total, row) => total + row.appliedPoints,
        0,
      ),
    ).toBe(attempt.pointReport.databasePlanPoints);

    const statusTamper = structuredClone(attempt);
    const statusRow = statusTamper.pointReport.ruleTrace.find(
      (row) =>
        row.source.kind === 'compiled_decision_rule' &&
        row.source.ruleRef.id === specificFit.ruleRef.id,
    );
    if (statusRow === undefined) throw new Error('Expected the specific-fit trace row.');
    statusRow.status = 'replaced';
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(statusTamper)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const targetTamper = structuredClone(attempt);
    const targetRow = targetTamper.pointReport.ruleTrace.find(
      (row) =>
        row.source.kind === 'compiled_decision_rule' &&
        row.source.ruleRef.id === specificFit.ruleRef.id,
    );
    if (targetRow === undefined) throw new Error('Expected the specific-fit target row.');
    targetRow.relatedSelectedActionTargets = [];
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(targetTamper)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const extraSourceRow = structuredClone(attempt);
    extraSourceRow.pointReport.ruleTrace.push({
      ...structuredClone(rowsByRuleId.get(worstContraindication.ruleRef.id)!),
      id: 'generated-point-trace.test.d235-forged-system-row',
      source: {
        kind: 'system_balance_policy',
        ownerRef: {
          id: 'system-balance-policy.test.forged',
          contentVersion: '1.0.0',
        },
      },
      resolvedByTraceId: null,
      combinationExplanation: null,
    });
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(extraSourceRow)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const balanceSnapshotTamper = structuredClone(attempt);
    const frozenMatchedBalance =
      balanceSnapshotTamper.pointReport.balanceCatalogSnapshot.balances.find(
        (balance) => balance.balanceKind === 'matched_rule',
      );
    if (frozenMatchedBalance?.balanceKind !== 'matched_rule') {
      throw new Error('Expected one frozen matched-rule balance.');
    }
    frozenMatchedBalance.pointsWhenMatched += 1;
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(balanceSnapshotTamper)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const databasePlanTraceTamper = structuredClone(attempt);
    const databasePlanRow = databasePlanTraceTamper.pointReport.databasePlanRuleTrace[0];
    if (databasePlanRow === undefined) throw new Error('Expected a database-plan trace row.');
    databasePlanRow.explanation = `${databasePlanRow.explanation} Forged.`;
    expect(
      verifyGeneratedCompletedEncounterAttemptIntegrity(databasePlanTraceTamper),
    ).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });
  });

  it('rejects duplicate purchases and selections outside exact frozen horizons', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'complete_encounter',
      mode: 'endgame',
    });
    const first = purchaseInputFor(fixture.waitingSlot, 'duplicate.1');
    if (first.type !== 'InformationPurchased') throw new Error('Expected a purchase event.');
    const second: GeneratedEncounterActionEventInput = {
      ...first,
      id: 'generated-action-event.test.purchase.duplicate.2',
      purchase: {
        ...first.purchase,
        id: 'generated-information-purchase.test.duplicate.2',
      },
    };
    expect(
      compileGeneratedCompletedEncounterAttempt({
        schemaVersion: 1,
        id: 'generated-attempt-compile-request.test.duplicate-purchase',
        attemptId: 'generated-completed-attempt.test.duplicate-purchase',
        mode: 'endgame',
        frozenWaitingSlot: fixture.waitingSlot,
        engineVersions: {
          encounterEngineVersion: '1.0.0',
          servicePricingEngineVersion: '1.0.0',
          scoringEngineVersion: NATIVE_DECISION_BALANCE_COMPILER_VERSION,
          settlementEngineVersion: '1.0.0',
        },
        actionEvents: [first, second],
        servicePricing: generatedServicePricingForWaiting(fixture.waitingSlot),
        pointDerivation: {
          balanceCatalog: {
            schemaVersion: 1,
            contentVersion: '1.0.0',
            id: 'registry.catalog.decision-balances.test.empty',
            balances: [],
          },
          medicationRegimenKnowledgeCatalog: {
            schemaVersion: 1,
            contentVersion: '1.0.0',
            id: 'registry.catalog.medication-regimen-knowledge.test.empty',
            medicationClasses: [],
            classMemberships: [],
            focusedRoutes: [],
            contributors: [],
            sourceUseNotes: [],
          },
          databasePlanDecision: {
            schemaVersion: 1,
            selectionVersion: 1,
            informationActionIds: [],
            diagnosisSelections: [],
            treatmentSelection: {
              schemaVersion: 1,
              selectionVersion: 2,
              medicationTransition: {
                selectionVersion: 2,
                startMedicationIds: [],
                adjustments: [],
              },
              interventionIds: [],
              dispositionId: null,
            },
          },
        },
        settlement: {
          producerRef: {
            id: 'engine.generated-settlement.test',
            contentVersion: '1.0.0',
          },
          baseReimbursement: 400,
          challengeBonus: 0,
          satisfactionMultiplier: 1,
          treatmentCharges: [],
          persistentPointsBefore: 0,
          lifetimePointsBefore: 0,
        },
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_ACTION_EVENT' },
    });

    const invalidTreatment: GeneratedEncounterActionEventInput = {
      id: 'generated-action-event.test.invalid-treatment',
      type: 'TreatmentSelectionsChanged',
      selections: {
        schemaVersion: 1,
        selectionVersion: 2,
        medicationTransition: {
          selectionVersion: 2,
          startMedicationIds: ['medication.not-in-frozen-horizon'],
          adjustments: [],
        },
        interventionIds: [],
        dispositionId: null,
      },
    };
    const invalid = createNativeGeneratedAttempt;
    expect(() =>
      invalid({
        attemptId: 'generated-completed-attempt.test.invalid-treatment',
        mode: 'endgame',
        frozenWaitingSlot: fixture.waitingSlot,
        actionEvents: [invalidTreatment],
      }),
    ).toThrow(/outside the frozen action horizon/i);
  });

  it('rejects crossed patients and tampered events, point arithmetic, and settlement arithmetic', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'complete_encounter',
      mode: 'endgame',
    });
    const attempt = createNativeGeneratedAttempt({
      attemptId: 'generated-completed-attempt.test.tamper',
      mode: 'endgame',
      frozenWaitingSlot: fixture.waitingSlot,
      actionEvents: [purchaseInputFor(fixture.waitingSlot, 'tamper-pricing')],
    });
    const foreignFixture = makeFillFixture({
      mode: 'endgame',
      fillOrdinal: 41,
    });
    const foreignFill = expectFillCompiled(foreignFixture.input);
    const foreignWaitingSlot = foreignFill.frozenWaitingSlotProposal;
    if (foreignWaitingSlot === null) throw new Error('Expected a foreign waiting patient.');
    expect(
      verifyGeneratedCompletedEncounterAttemptContext({
        attempt,
        frozenWaitingSlot: foreignWaitingSlot,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });

    const eventTamper = structuredClone(attempt);
    const submitted = eventTamper.events.find((event) => event.type === 'EncounterSubmitted');
    if (submitted?.type !== 'EncounterSubmitted') throw new Error('Expected submission.');
    submitted.submittedTreatment.interventionIds.push('treatment.foreign');
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(eventTamper)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const pointTamper = structuredClone(attempt);
    pointTamper.pointReport.carePointsEarned += 1;
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(pointTamper)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const playerDecisionTamper = structuredClone(attempt);
    playerDecisionTamper.pointReport.playerDecision.informationActionIds = [];
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(playerDecisionTamper)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const prerequisiteEvaluationTamper = structuredClone(attempt);
    const prerequisiteTrace = prerequisiteEvaluationTamper.pointReport.ruleTrace.find(
      (row) =>
        row.source.kind === 'compiled_decision_rule' &&
        row.source.ruleRef.id === 'rule.test.pipeline-medication-reconciliation-prerequisite',
    );
    if (
      prerequisiteTrace === undefined ||
      prerequisiteTrace.triggeredInformationPrerequisiteEvaluation === null
    ) {
      throw new Error('Expected one triggered-information prerequisite trace.');
    }
    prerequisiteTrace.triggeredInformationPrerequisiteEvaluation.fulfillmentSelected = false;
    expect(
      verifyGeneratedCompletedEncounterAttemptIntegrity(prerequisiteEvaluationTamper),
    ).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const databasePlanTamper = structuredClone(attempt);
    databasePlanTamper.pointReport.databasePlanDecision.informationActionIds.push(
      databasePlanTamper.replaySnapshot.encounterInstance.decisionActionHorizon
        .informationActionIds[0]!,
    );
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(databasePlanTamper)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const settlementTamper = structuredClone(attempt);
    settlementTamper.settlement.projectedNetPointsEarned += 1;
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(settlementTamper)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const pricingTamper = structuredClone(attempt);
    pricingTamper.purchases[0]!.operatingCost += 1;
    const purchaseEvent = pricingTamper.events.find(
      (event) => event.type === 'InformationPurchased',
    );
    if (purchaseEvent?.type !== 'InformationPurchased') {
      throw new Error('Expected a priced purchase event.');
    }
    purchaseEvent.purchase.operatingCost += 1;
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(pricingTamper)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    expect(
      GeneratedCompletedEncounterAttemptSchema.safeParse({
        schemaVersion: 1,
        modelVersion: 'generated-encounter-attempt-bridge-snapshot.v1',
        opaquePayloadJson: '{}',
      }).success,
    ).toBe(false);
  });
});

describe('D-234 post-encounter patient-slot lifecycle', () => {
  it('preserves the complete attempt, vacates exactly one patient, and updates bounded local history before canonical refill', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'complete_encounter',
      mode: 'endgame',
    });
    const before = structuredClone(fixture.input);
    const transition = fixture.transition;

    expect(fixture.input).toEqual(before);
    expect(PatientSlotLifecycleTransitionArtifactSchema.parse(transition)).toEqual(transition);
    expect(transition).toMatchObject({
      operation: 'complete_encounter',
      mode: 'endgame',
      vacatedSlotCoordinateIds: [fixture.fill.slotCoordinate.id],
      skippedWaitingRecords: [],
      sameTemplateRefillConstraint: null,
    });
    expect(transition.completionRecord).not.toBeNull();
    expect(transition.completionRecord!.completionProof.attemptSnapshot).toMatchObject({
      modelVersion: 'generated-completed-encounter-attempt.v2',
      id: 'generated-encounter-attempt.test.endgame',
      replaySnapshot: {
        waitingSlotRef: { id: fixture.waitingSlot.id },
        patientInstance: {
          id: fixture.waitingSlot.findingPipelineAuditArtifact.catalogSnapshot!.patientInstance.id,
        },
        encounterInstance: {
          id: fixture.waitingSlot.findingPipelineAuditArtifact.catalogSnapshot!.encounterInstance
            .id,
        },
      },
      events: [
        { type: 'EncounterStarted' },
        { type: 'EncounterSubmitted' },
        { type: 'PointReportCalculated' },
        { type: 'SettlementCalculated' },
        { type: 'EncounterCompleted' },
      ],
      pointReport: {
        databasePlanPoints: 0,
        carePointsEarned: 0,
      },
      settlement: {
        projectedNetPointsEarned: 400,
        bankedPointsEarned: 0,
        practiceMode: true,
      },
    });
    expect(
      verifyGeneratedEncounterCompletionProof(transition.completionRecord!.completionProof).ok,
    ).toBe(true);
    expect(transition.proposedCompletionHistoryState).toMatchObject({
      nextCompletionOrdinal: 1,
      entriesNewestFirst: [
        {
          templateRef: fixture.fill.seedAuthorityArtifact.selectedTemplateRef,
          completionOrdinal: 0,
        },
      ],
    });
    expect(
      occupancyEntryAt(
        transition.proposedOccupancySnapshotArtifact,
        fixture.fill.slotCoordinate.id,
      ),
    ).toMatchObject({
      status: 'empty',
      nextFillOrdinal: fixture.fill.nextFillOrdinal,
    });
    expect(verifyPatientSlotLifecycleTransitionIntegrity(transition)).toEqual({
      ok: true,
      value: transition,
    });
    expect(
      verifyPatientSlotLifecycleTransitionContext({
        artifact: transition,
        currentInput: fixture.input,
      }),
    ).toEqual({ ok: true, value: transition });

    const refillAttempt = rebaseFillAttemptAfterTransition(transition);
    const reconciliationInput: PatientSlotRefillReconciliationCompileInput = {
      schemaVersion: 1,
      id: 'patient-slot-refill-reconciliation-request.test.complete',
      transitionArtifact: transition,
      currentTransitionInput: fixture.input,
      ...reconciliationEligibilityContext(transition, fixture.fixture.slotSelection),
      fillAttempts: [refillAttempt],
    };
    const reconciled = compilePatientSlotRefillReconciliation(reconciliationInput);
    if (!reconciled.ok) {
      throw new Error(`${reconciled.error.code}: ${reconciled.error.message}`);
    }
    expect(PatientSlotRefillReconciliationArtifactSchema.parse(reconciled.value)).toEqual(
      reconciled.value,
    );
    expect(reconciled.value).toMatchObject({
      status: 'full',
      fillAttempts: [
        {
          status: 'filled',
          attemptedFillOrdinal: fixture.fill.nextFillOrdinal,
        },
      ],
    });
    expect(reconciled.value.fillAttempts[0]!.seedAuthorityArtifact.patientGenerationSeed).not.toBe(
      fixture.fill.seedAuthorityArtifact.patientGenerationSeed,
    );
    expect(verifyPatientSlotRefillReconciliationIntegrity(reconciled.value)).toEqual({
      ok: true,
      value: reconciled.value,
    });
    expect(
      verifyPatientSlotRefillReconciliationContext({
        artifact: reconciled.value,
        currentInput: reconciliationInput,
      }),
    ).toEqual({ ok: true, value: reconciled.value });
  }, 30_000);

  it('records explicit Endgame refresh as skipped without contaminating completion or run history, and rejects Standard refresh', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'refresh_waiting_slots',
      mode: 'endgame',
    });
    expect(fixture.transition).toMatchObject({
      completionRecord: null,
      skippedWaitingRecords: [
        {
          reason: 'endgame_refresh',
          slotCoordinateId: fixture.fill.slotCoordinate.id,
        },
      ],
      proposedCompletionHistoryState: {
        ...fixture.input.completionHistoryState,
        occupancySnapshotRef: {
          id: fixture.transition.proposedOccupancySnapshotArtifact.id,
          payloadFingerprint:
            fixture.transition.proposedOccupancySnapshotArtifact.payloadFingerprint,
        },
      },
      proposedDeveloperRunHistoryState: null,
    });
    expect(
      compilePatientSlotLifecycleTransition({
        ...fixture.input,
        id: 'patient-slot-lifecycle-transition-request.test.invalid-standard-refresh',
        operation: 'refresh_waiting_slots',
        mode: 'standard',
        targetSlotCoordinateIds: [fixture.fill.slotCoordinate.id],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_INPUT' },
    });
  });

  it('keeps recent completion history newest-first, duplicate-preserving, and bounded by the exact distribution profile', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'complete_encounter',
      mode: 'endgame',
    });
    const authority =
      fixture.waitingSlot.findingPipelineAuditArtifact.patientSlotFillSeedAuthorityArtifact;
    const priorEntries = [2, 1, 0].map((completionOrdinal) => {
      const priorFixture = makeFillFixture({
        mode: 'endgame',
        fillOrdinal: completionOrdinal + 10,
      });
      const priorFill = expectFillCompiled(priorFixture.input);
      const frozenWaitingSlot = priorFill.frozenWaitingSlotProposal;
      if (frozenWaitingSlot === null) {
        throw new Error('Expected one distinct prior frozen waiting patient.');
      }
      const completionProof = createCompletionProofForWaiting({
        attemptId: `generated-encounter-attempt.test.prior.${completionOrdinal}`,
        mode: 'endgame',
        frozenWaitingSlot,
      });
      return {
        schemaVersion: 1 as const,
        id: `patient-slot-completion-history-entry.test.prior.${completionOrdinal}`,
        completionOrdinal,
        mode: 'endgame' as const,
        locationRef: authority.coordinates.locationRef,
        slotCoordinateId: authority.coordinates.slotCoordinateId,
        frozenWaitingSlot,
        completionProof,
        templateRef: authority.selectedTemplateRef,
        templateFingerprint: authority.selectedTemplateFingerprint,
      };
    });
    const input = structuredClone(fixture.input);
    input.id = 'patient-slot-lifecycle-transition-request.test.bounded-history';
    input.completionHistoryState = {
      ...input.completionHistoryState,
      nextCompletionOrdinal: 3,
      entriesNewestFirst: priorEntries,
    };
    input.distributionProfile.repeatSuppression.recentCompletionWindowSize = 3;
    const result = compilePatientSlotLifecycleTransition(input);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    expect(
      result.value.proposedCompletionHistoryState.entriesNewestFirst.map(
        (entry) => entry.completionOrdinal,
      ),
    ).toEqual([3, 2, 1]);
    expect(
      result.value.proposedCompletionHistoryState.entriesNewestFirst.map(
        (entry) => entry.templateRef.id,
      ),
    ).toEqual([
      authority.selectedTemplateRef.id,
      authority.selectedTemplateRef.id,
      authority.selectedTemplateRef.id,
    ]);
    expect(
      result.value.proposedRecentCompletionContext.recentCompletedTemplateIdsNewestFirst,
    ).toEqual([
      authority.selectedTemplateRef.id,
      authority.selectedTemplateRef.id,
      authority.selectedTemplateRef.id,
    ]);
  }, 20_000);

  it('updates exact-version Developer run history on completion and returns an ordinal-free exhausted reconciliation', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'complete_encounter',
      mode: 'developer',
    });
    const transition = fixture.transition;
    expect(transition.proposedDeveloperRunHistoryState?.entries).toEqual([
      {
        schemaVersion: 1,
        templateRef: fixture.fill.seedAuthorityArtifact.selectedTemplateRef,
        templateFingerprint: fixture.fill.seedAuthorityArtifact.selectedTemplateFingerprint,
        firstCompletionRecordId: transition.completionRecord!.id,
        latestCompletionRecordId: transition.completionRecord!.id,
        completionCount: 1,
      },
    ]);
    expect(
      fingerprintDeveloperPatientTemplateRunHistoryState(
        transition.proposedDeveloperRunHistoryState!,
      ),
    ).toMatch(/^fingerprint\.location-template-selection-eligibility\.source\./);
    const admittedTemplates =
      fixture.fill.seedAuthorityArtifact.locationTemplateSelectionArtifact.locationOwnedPatientSlotSelectionArtifact.mechanicallyAdmittedCandidates.map(
        (candidate) => ({
          templateRef: candidate.templateRef,
          templateFingerprint: candidate.templateFingerprint,
        }),
      );
    const exhaustedOverlay = createPatientSlotTemplateEligibilityOverlay({
      mode: 'developer',
      admittedTemplates,
      developerRunHistoryState: transition.proposedDeveloperRunHistoryState,
    });
    expect(exhaustedOverlay).toMatchObject({
      basis: 'developer_unrun',
      eligibleTemplates: [],
    });

    const reconciliationInput: PatientSlotRefillReconciliationCompileInput = {
      schemaVersion: 1,
      id: 'patient-slot-refill-reconciliation-request.test.developer-exhausted',
      transitionArtifact: transition,
      currentTransitionInput: fixture.input,
      ...reconciliationEligibilityContext(transition, fixture.fixture.slotSelection),
      fillAttempts: [],
    };
    const reconciled = compilePatientSlotRefillReconciliation(reconciliationInput);
    if (!reconciled.ok) {
      throw new Error(`${reconciled.error.code}: ${reconciled.error.message}`);
    }
    expect(reconciled.value).toMatchObject({
      status: 'developer_horizon_exhausted',
      fillAttempts: [],
      finalOccupancySnapshotArtifact: transition.proposedOccupancySnapshotArtifact,
    });
    expect(
      occupancyEntryAt(
        reconciled.value.finalOccupancySnapshotArtifact,
        fixture.fill.slotCoordinate.id,
      ).nextFillOrdinal,
    ).toBe(fixture.fill.nextFillOrdinal);

    const nextVersionOverlay = createPatientSlotTemplateEligibilityOverlay({
      mode: 'developer',
      admittedTemplates: [
        ...admittedTemplates,
        {
          templateRef: {
            id: admittedTemplates[0]!.templateRef.id,
            contentVersion: '2.0.0',
          },
          templateFingerprint:
            'fingerprint.patient-template-location-admission-matrix.template.fnv1a64.1111111111111111',
        },
      ],
      developerRunHistoryState: transition.proposedDeveloperRunHistoryState,
    });
    expect(nextVersionOverlay.eligibleTemplates).toEqual([
      {
        templateRef: {
          id: admittedTemplates[0]!.templateRef.id,
          contentVersion: '2.0.0',
        },
        templateFingerprint:
          'fingerprint.patient-template-location-admission-matrix.template.fnv1a64.1111111111111111',
      },
    ]);
  });

  it('rerandomizes one Developer patient only under its exact template without recording a completion', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'rerandomize_same_template',
      mode: 'developer',
    });
    const transition = fixture.transition;
    expect(transition).toMatchObject({
      completionRecord: null,
      skippedWaitingRecords: [{ reason: 'developer_rerandomize' }],
      proposedCompletionHistoryState: {
        ...fixture.input.completionHistoryState,
        occupancySnapshotRef: {
          id: transition.proposedOccupancySnapshotArtifact.id,
          payloadFingerprint: transition.proposedOccupancySnapshotArtifact.payloadFingerprint,
        },
      },
      proposedDeveloperRunHistoryState: fixture.input.developerRunHistoryState,
      sameTemplateRefillConstraint: {
        slotCoordinateId: fixture.fill.slotCoordinate.id,
        templateRef: fixture.fill.seedAuthorityArtifact.selectedTemplateRef,
        templateFingerprint: fixture.fill.seedAuthorityArtifact.selectedTemplateFingerprint,
      },
    });
    const refillAttempt = rebaseFillAttemptAfterTransition(transition);
    expect(
      refillAttempt.seedAuthorityArtifact.locationTemplateSelectionArtifact.selectionRequest
        .eligibilityOverlay,
    ).toMatchObject({
      basis: 'developer_same_template',
      eligibleTemplates: [
        {
          templateRef: fixture.fill.seedAuthorityArtifact.selectedTemplateRef,
          templateFingerprint: fixture.fill.seedAuthorityArtifact.selectedTemplateFingerprint,
        },
      ],
    });
    const reconciliation = compilePatientSlotRefillReconciliation({
      schemaVersion: 1,
      id: 'patient-slot-refill-reconciliation-request.test.developer-rerandomize',
      transitionArtifact: transition,
      currentTransitionInput: fixture.input,
      ...reconciliationEligibilityContext(transition, fixture.fixture.slotSelection),
      fillAttempts: [refillAttempt],
    });
    if (!reconciliation.ok) {
      throw new Error(`${reconciliation.error.code}: ${reconciliation.error.message}`);
    }
    expect(reconciliation.value.status).toBe('full');
    expect(reconciliation.value.fillAttempts[0]!.seedAuthorityArtifact.selectedTemplateRef).toEqual(
      fixture.fill.seedAuthorityArtifact.selectedTemplateRef,
    );
    expect(
      reconciliation.value.fillAttempts[0]!.seedAuthorityArtifact.patientGenerationSeed,
    ).not.toBe(fixture.fill.seedAuthorityArtifact.patientGenerationSeed);
  });

  it('rejects refill attempts crossed from another generation root, distribution profile, or current admission matrix', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'complete_encounter',
      mode: 'endgame',
    });
    const transition = fixture.transition;
    const reconciliationContext = reconciliationEligibilityContext(
      transition,
      fixture.fixture.slotSelection,
    );
    const commonInput = {
      schemaVersion: 1 as const,
      transitionArtifact: transition,
      currentTransitionInput: fixture.input,
      ...reconciliationContext,
    };

    const foreignRootAttempt = rebaseFillAttemptAfterTransition(transition, {
      generationRoot: 'generation-root.test.pipeline.foreign-reconciliation',
    });
    expect(
      compilePatientSlotRefillReconciliation({
        ...commonInput,
        id: 'patient-slot-refill-reconciliation-request.test.foreign-root',
        generationRoot: foreignRootAttempt.seedAuthorityCompileInput.generationRoot,
        fillAttempts: [foreignRootAttempt],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });

    const foreignProfileAttempt = rebaseFillAttemptAfterTransition(transition);
    foreignProfileAttempt.seedAuthorityCompileInput.distributionProfile = {
      ...foreignProfileAttempt.seedAuthorityCompileInput.distributionProfile,
      id: 'location-template-distribution.test.foreign-reconciliation',
      templateWeights:
        foreignProfileAttempt.seedAuthorityCompileInput.distributionProfile.templateWeights.map(
          (weight) => ({
            ...weight,
            gameSelectionWeight: weight.gameSelectionWeight + 1,
          }),
        ),
    };
    const foreignProfileAuthority = compilePatientSlotFillSeedAuthority(
      foreignProfileAttempt.seedAuthorityCompileInput,
    );
    if (!foreignProfileAuthority.ok) {
      throw new Error(
        `${foreignProfileAuthority.error.code}: ${foreignProfileAuthority.error.message}`,
      );
    }
    foreignProfileAttempt.seedAuthorityArtifact = foreignProfileAuthority.value;
    foreignProfileAttempt.findingPipelineAuditRequest.patientSlotFillSeedAuthorityArtifact =
      foreignProfileAuthority.value;
    expect(
      compilePatientSlotRefillReconciliation({
        ...commonInput,
        id: 'patient-slot-refill-reconciliation-request.test.foreign-profile',
        fillAttempts: [foreignProfileAttempt],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'REFILL_SEQUENCE_MISMATCH' },
    });

    const foreignMatrixRequest = structuredClone(
      reconciliationContext.currentAdmissionMatrixRequest,
    );
    foreignMatrixRequest.id = 'admission-matrix-request.test.pipeline.foreign-reconciliation';
    const foreignMatrix = compilePatientTemplateLocationAdmissionMatrix(foreignMatrixRequest);
    if (!foreignMatrix.ok) {
      throw new Error(`${foreignMatrix.error.code}: ${foreignMatrix.error.message}`);
    }
    expect(
      compilePatientSlotRefillReconciliation({
        ...commonInput,
        id: 'patient-slot-refill-reconciliation-request.test.foreign-current-matrix',
        currentAdmissionMatrixRequest: foreignMatrixRequest,
        currentAdmissionMatrixArtifact: foreignMatrix.value,
        fillAttempts: [rebaseFillAttemptAfterTransition(transition)],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'REFILL_SEQUENCE_MISMATCH' },
    });
  }, 15_000);

  it('rejects lossy, incomplete, reordered, and duplicate native attempt histories', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'complete_encounter',
      mode: 'endgame',
    });
    const attempt = createNativeGeneratedAttempt({
      attemptId: 'generated-encounter-attempt.test.native-integrity',
      mode: 'endgame',
      frozenWaitingSlot: fixture.waitingSlot,
    });
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(attempt)).toEqual({
      ok: true,
      value: attempt,
    });

    const lossy = structuredClone(attempt);
    lossy.settlement.satisfactionMultiplier = Number.NaN;
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(lossy)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });

    const missingCompletion = structuredClone(attempt);
    missingCompletion.events.pop();
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(missingCompletion)).toMatchObject({
      ok: false,
    });

    const nonterminalCompletion = structuredClone(attempt);
    const completion = nonterminalCompletion.events.pop()!;
    nonterminalCompletion.events.splice(1, 0, completion);
    nonterminalCompletion.events.forEach((event, ordinal) => {
      event.ordinal = ordinal;
    });
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(nonterminalCompletion)).toMatchObject({
      ok: false,
    });

    const duplicateEvent = structuredClone(attempt);
    duplicateEvent.events[1]!.id = duplicateEvent.events[0]!.id;
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(duplicateEvent)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });

  it('rejects a completed patient replay before bounded history can hide the duplicate', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'complete_encounter',
      mode: 'endgame',
    });
    const replayInput = structuredClone(fixture.input);
    replayInput.id = 'patient-slot-lifecycle-transition-request.test.replayed-completion';
    replayInput.completionHistoryState = {
      ...structuredClone(fixture.transition.proposedCompletionHistoryState),
      occupancySnapshotRef: {
        id: fixture.input.occupancySnapshotArtifact.id,
        payloadFingerprint: fixture.input.occupancySnapshotArtifact.payloadFingerprint,
      },
    };
    replayInput.distributionProfile.repeatSuppression.recentCompletionWindowSize = 1;
    expect(compilePatientSlotLifecycleTransition(replayInput)).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });

  it('rejects Developer exhaustion against a matrix for a changed exact-location payload', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'complete_encounter',
      mode: 'developer',
    });
    const foreign = makeFillFixture({
      mode: 'developer',
      locationLabel: 'Changed synthetic solo office',
    });
    const context = reconciliationEligibilityContext(
      fixture.transition,
      fixture.fixture.slotSelection,
    );
    expect(
      compilePatientSlotRefillReconciliation({
        schemaVersion: 1,
        id: 'patient-slot-refill-reconciliation-request.test.changed-location-matrix',
        transitionArtifact: fixture.transition,
        currentTransitionInput: fixture.input,
        ...context,
        currentAdmissionMatrixArtifact: foreign.slotSelection.admissionMatrixArtifact,
        currentAdmissionMatrixRequest: foreign.slotSelection.admissionMatrixRequest,
        fillAttempts: [],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });

  it('rejects a reconciliation root that differs from another active patient in the same location', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'complete_encounter',
      mode: 'endgame',
      capacityBaseSlotCount: 2,
    });
    const mixedFixture = makeFillFixture({
      mode: 'endgame',
      capacityBaseSlotCount: 2,
      generationRoot: 'generation-root.test.pipeline.mixed-second-patient',
      occupiedWaitingSlots: [fixture.waitingSlot],
    });
    const mixedFill = expectFillCompiled(mixedFixture.input);
    const mixedTransitionInput = structuredClone(fixture.input);
    mixedTransitionInput.id =
      'patient-slot-lifecycle-transition-request.test.mixed-generation-roots';
    mixedTransitionInput.occupancySnapshotArtifact = mixedFill.proposedOccupancySnapshotArtifact;
    mixedTransitionInput.currentOccupancyInput = occupiedInputAfterFill(mixedFixture, mixedFill);
    mixedTransitionInput.completionHistoryState.occupancySnapshotRef = {
      id: mixedFill.proposedOccupancySnapshotArtifact.id,
      payloadFingerprint: mixedFill.proposedOccupancySnapshotArtifact.payloadFingerprint,
    };
    const transition = compilePatientSlotLifecycleTransition(mixedTransitionInput);
    if (!transition.ok) {
      throw new Error(`${transition.error.code}: ${transition.error.message}`);
    }
    expect(
      compilePatientSlotRefillReconciliation({
        schemaVersion: 1,
        id: 'patient-slot-refill-reconciliation-request.test.mixed-generation-roots',
        transitionArtifact: transition.value,
        currentTransitionInput: mixedTransitionInput,
        ...reconciliationEligibilityContext(transition.value, fixture.fixture.slotSelection),
        fillAttempts: [],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  }, 15_000);

  it('rejects duplicate completion identities and a frozen patient relabeled as another history entry', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'complete_encounter',
      mode: 'endgame',
    });
    const authority =
      fixture.waitingSlot.findingPipelineAuditArtifact.patientSlotFillSeedAuthorityArtifact;
    const relabeledEntries = [1, 0].map((completionOrdinal) => {
      const frozenWaitingSlot = structuredClone(fixture.waitingSlot);
      frozenWaitingSlot.id = `waiting-slot.test.duplicate-patient.${completionOrdinal}`;
      const completionProof = createCompletionProofForWaiting({
        attemptId: `generated-encounter-attempt.test.duplicate-patient.${completionOrdinal}`,
        mode: 'endgame',
        frozenWaitingSlot,
      });
      return {
        schemaVersion: 1 as const,
        id: `patient-slot-completion-history-entry.test.duplicate-patient.${completionOrdinal}`,
        completionOrdinal,
        mode: 'endgame' as const,
        locationRef: authority.coordinates.locationRef,
        slotCoordinateId: authority.coordinates.slotCoordinateId,
        frozenWaitingSlot,
        completionProof,
        templateRef: authority.selectedTemplateRef,
        templateFingerprint: authority.selectedTemplateFingerprint,
      };
    });
    const duplicatePatientInput = structuredClone(fixture.input);
    duplicatePatientInput.id =
      'patient-slot-lifecycle-transition-request.test.duplicate-patient-history';
    duplicatePatientInput.completionHistoryState = {
      ...duplicatePatientInput.completionHistoryState,
      nextCompletionOrdinal: 2,
      entriesNewestFirst: relabeledEntries,
    };
    expect(compilePatientSlotLifecycleTransition(duplicatePatientInput)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_INPUT' },
    });

    const duplicateCompletionInput = structuredClone(fixture.input);
    duplicateCompletionInput.id =
      'patient-slot-lifecycle-transition-request.test.duplicate-completion-history';
    duplicateCompletionInput.completionHistoryState = {
      ...duplicateCompletionInput.completionHistoryState,
      nextCompletionOrdinal: 2,
      entriesNewestFirst: [
        {
          ...structuredClone(relabeledEntries[0]!),
          completionOrdinal: 1,
        },
        {
          ...structuredClone(relabeledEntries[0]!),
          id: 'patient-slot-completion-history-entry.test.duplicate-completion.second',
          completionOrdinal: 0,
        },
      ],
    };
    expect(compilePatientSlotLifecycleTransition(duplicateCompletionInput)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_INPUT' },
    });
  });

  it('does not treat changed template content under the same ID and version as a new Developer run', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'complete_encounter',
      mode: 'developer',
    });
    const admitted =
      fixture.fill.seedAuthorityArtifact.locationTemplateSelectionArtifact
        .locationOwnedPatientSlotSelectionArtifact.mechanicallyAdmittedCandidates[0]!;
    const changedFingerprint = admitted.templateFingerprint.endsWith('0')
      ? `${admitted.templateFingerprint.slice(0, -1)}1`
      : `${admitted.templateFingerprint.slice(0, -1)}0`;
    expect(() =>
      createPatientSlotTemplateEligibilityOverlay({
        mode: 'developer',
        admittedTemplates: [
          {
            templateRef: admitted.templateRef,
            templateFingerprint: changedFingerprint,
          },
        ],
        developerRunHistoryState: fixture.transition.proposedDeveloperRunHistoryState,
      }),
    ).toThrow(/fingerprint|version/i);
    const duplicateVersionInput = structuredClone(fixture.input);
    duplicateVersionInput.id =
      'patient-slot-lifecycle-transition-request.test.duplicate-developer-version';
    const priorRun = fixture.transition.proposedDeveloperRunHistoryState!.entries[0]!;
    duplicateVersionInput.developerRunHistoryState = {
      ...fixture.transition.proposedDeveloperRunHistoryState!,
      entries: [
        structuredClone(priorRun),
        {
          ...structuredClone(priorRun),
          templateFingerprint: changedFingerprint,
          firstCompletionRecordId: 'patient-slot-completion-history-entry.test.changed-fingerprint',
          latestCompletionRecordId:
            'patient-slot-completion-history-entry.test.changed-fingerprint',
        },
      ],
    };
    expect(compilePatientSlotLifecycleTransition(duplicateVersionInput)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_INPUT' },
    });
  });

  it('rerandomizes the exact Developer slot and then preserves another vacancy when no unrun template remains', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'rerandomize_same_template',
      mode: 'developer',
      capacityBaseSlotCount: 2,
    });
    const refillAttempt = rebaseFillAttemptAfterTransition(fixture.transition, {
      capacityBaseSlotCount: 2,
      currentSlotSelection: fixture.fixture.slotSelection,
    });
    const reconciliation = compilePatientSlotRefillReconciliation({
      schemaVersion: 1,
      id: 'patient-slot-refill-reconciliation-request.test.rerandomize-with-vacancy',
      transitionArtifact: fixture.transition,
      currentTransitionInput: fixture.input,
      ...reconciliationEligibilityContext(fixture.transition, fixture.fixture.slotSelection),
      fillAttempts: [refillAttempt],
    });
    if (!reconciliation.ok) {
      throw new Error(`${reconciliation.error.code}: ${reconciliation.error.message}`);
    }
    expect(reconciliation.value.status).toBe('developer_horizon_exhausted');
    expect(reconciliation.value.fillAttempts).toHaveLength(1);
    expect(
      occupancyEntryAt(
        reconciliation.value.finalOccupancySnapshotArtifact,
        fixture.fill.slotCoordinate.id,
      ).status,
    ).toBe('occupied');
    expect(
      reconciliation.value.finalOccupancySnapshotArtifact.entries.filter(
        (entry) => entry.status === 'empty',
      ),
    ).toHaveLength(1);
  }, 15_000);

  it('threads multiple vacancies in order and preserves an earlier success when the next fill blocks', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'complete_encounter',
      mode: 'endgame',
      capacityBaseSlotCount: 2,
    });
    const firstAttempt = rebaseFillAttemptAfterTransition(fixture.transition, {
      capacityBaseSlotCount: 2,
      currentSlotSelection: fixture.fixture.slotSelection,
      requestSuffix: 'multi-first',
    });
    const firstCompiled = compileEmptyAuthorizedPatientSlotFill(firstAttempt);
    if (!firstCompiled.ok) {
      throw new Error(`${firstCompiled.error.code}: ${firstCompiled.error.message}`);
    }
    const firstOccupancyInput: LocationPatientSlotOccupancySnapshotCompileInput = {
      ...structuredClone(firstAttempt.seedAuthorityCompileInput.currentOccupancyInput),
      id: firstCompiled.value.proposedOccupancySnapshotArtifact.requestId,
      entries: firstAttempt.seedAuthorityCompileInput.currentOccupancyInput.entries.map((entry) =>
        entry.slotCoordinateId === firstCompiled.value.slotCoordinate.id
          ? {
              ...entry,
              nextFillOrdinal: firstCompiled.value.nextFillOrdinal,
              frozenWaitingSlot: firstCompiled.value.frozenWaitingSlotProposal,
            }
          : entry,
      ),
    };
    const secondAttempt = rebaseFillAttemptAfterTransition(fixture.transition, {
      capacityBaseSlotCount: 2,
      currentSlotSelection: fixture.fixture.slotSelection,
      startingOccupancyInput: firstOccupancyInput,
      startingOccupancyArtifact: firstCompiled.value.proposedOccupancySnapshotArtifact,
      requestSuffix: 'multi-second',
    });
    const context = reconciliationEligibilityContext(
      fixture.transition,
      fixture.fixture.slotSelection,
    );
    const full = compilePatientSlotRefillReconciliation({
      schemaVersion: 1,
      id: 'patient-slot-refill-reconciliation-request.test.multi-full',
      transitionArtifact: fixture.transition,
      currentTransitionInput: fixture.input,
      ...context,
      fillAttempts: [firstAttempt, secondAttempt],
    });
    if (!full.ok) throw new Error(`${full.error.code}: ${full.error.message}`);
    expect(full.value).toMatchObject({
      status: 'full',
      fillAttempts: [{ status: 'filled' }, { status: 'filled' }],
    });

    const blockedSecondAttempt = structuredClone(secondAttempt);
    const hardCandidate = structuredClone(
      downstreamOf(blockedSecondAttempt.findingPipelineAuditRequest).conditionFindingArtifact
        .candidates[0]!,
    );
    hardCandidate.kind = 'case_critical';
    downstreamOf(
      blockedSecondAttempt.findingPipelineAuditRequest,
    ).catalogCompileRecipe.authoredFindingCandidates = [hardCandidate];
    const blocked = compilePatientSlotRefillReconciliation({
      schemaVersion: 1,
      id: 'patient-slot-refill-reconciliation-request.test.multi-blocked',
      transitionArtifact: fixture.transition,
      currentTransitionInput: fixture.input,
      ...context,
      fillAttempts: [firstAttempt, blockedSecondAttempt],
    });
    if (!blocked.ok) throw new Error(`${blocked.error.code}: ${blocked.error.message}`);
    expect(blocked.value).toMatchObject({
      status: 'blocked',
      fillAttempts: [{ status: 'filled' }, { status: 'blocked' }],
    });
    expect(
      occupancyEntryAt(
        blocked.value.finalOccupancySnapshotArtifact,
        firstCompiled.value.slotCoordinate.id,
      ).status,
    ).toBe('occupied');
    expect(
      occupancyEntryAt(
        blocked.value.finalOccupancySnapshotArtifact,
        blocked.value.fillAttempts[1]!.slotCoordinate.id,
      ),
    ).toMatchObject({
      status: 'empty',
      nextFillOrdinal: blocked.value.fillAttempts[1]!.nextFillOrdinal,
    });
  }, 20_000);

  it('stops at the first blocked refill, never retries internally, and rejects replay or payload tampering', () => {
    const fixture = makeLifecycleTransitionFixture({
      operation: 'complete_encounter',
      mode: 'endgame',
    });
    const blockedAttempt = rebaseFillAttemptAfterTransition(fixture.transition);
    const hardCandidate = structuredClone(
      downstreamOf(blockedAttempt.findingPipelineAuditRequest).conditionFindingArtifact
        .candidates[0]!,
    );
    hardCandidate.kind = 'case_critical';
    downstreamOf(
      blockedAttempt.findingPipelineAuditRequest,
    ).catalogCompileRecipe.authoredFindingCandidates = [hardCandidate];
    const reconciliationInput: PatientSlotRefillReconciliationCompileInput = {
      schemaVersion: 1,
      id: 'patient-slot-refill-reconciliation-request.test.blocked',
      transitionArtifact: fixture.transition,
      currentTransitionInput: fixture.input,
      ...reconciliationEligibilityContext(fixture.transition, fixture.fixture.slotSelection),
      fillAttempts: [blockedAttempt],
    };
    const blocked = compilePatientSlotRefillReconciliation(reconciliationInput);
    if (!blocked.ok) throw new Error(`${blocked.error.code}: ${blocked.error.message}`);
    expect(blocked.value).toMatchObject({
      status: 'blocked',
      fillAttempts: [
        {
          status: 'blocked',
          attemptedFillOrdinal: fixture.fill.nextFillOrdinal,
          diagnostics: [{ code: 'patient_compilation_failed' }],
        },
      ],
    });
    const unauthorizedRetryAttempt = structuredClone(blockedAttempt);
    unauthorizedRetryAttempt.id =
      'empty-authorized-patient-slot-fill-request.test.unauthorized-retry';
    expect(
      compilePatientSlotRefillReconciliation({
        ...reconciliationInput,
        id: 'patient-slot-refill-reconciliation-request.test.illegal-retry',
        fillAttempts: [blockedAttempt, unauthorizedRetryAttempt],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'REFILL_AFTER_BLOCKER' },
    });

    const blockedArtifact = blocked.value.fillAttempts[0]!;
    const retryCurrentOccupancyInput: LocationPatientSlotOccupancySnapshotCompileInput = {
      ...structuredClone(blockedAttempt.seedAuthorityCompileInput.currentOccupancyInput),
      id: blockedArtifact.proposedOccupancySnapshotArtifact.requestId,
      entries: blockedAttempt.seedAuthorityCompileInput.currentOccupancyInput.entries.map(
        (entry) =>
          entry.slotCoordinateId === blockedArtifact.slotCoordinate.id
            ? {
                ...entry,
                nextFillOrdinal: blockedArtifact.nextFillOrdinal,
                frozenWaitingSlot: null,
              }
            : entry,
      ),
    };
    const retryFixture = makeFillFixture({
      mode: 'endgame',
      generationRoot: reconciliationInput.generationRoot.seed,
      fillOrdinal: blockedArtifact.nextFillOrdinal,
      recentCompletedTemplateIdsNewestFirst:
        fixture.transition.proposedRecentCompletionContext.recentCompletedTemplateIdsNewestFirst,
      templateEligibilityOverlay:
        blockedAttempt.seedAuthorityCompileInput.templateEligibilityOverlay,
    });
    const authorizedRetryAttempt = structuredClone(retryFixture.input);
    authorizedRetryAttempt.id = 'empty-authorized-patient-slot-fill-request.test.authorized-retry';
    authorizedRetryAttempt.seedAuthorityCompileInput.id =
      'patient-slot-fill-seed-authority-request.test.authorized-retry';
    authorizedRetryAttempt.seedAuthorityCompileInput.currentOccupancyInput =
      retryCurrentOccupancyInput;
    authorizedRetryAttempt.seedAuthorityCompileInput.occupancySnapshotArtifact =
      blockedArtifact.proposedOccupancySnapshotArtifact;
    authorizedRetryAttempt.seedAuthorityCompileInput.targetSlotCoordinateId =
      blockedArtifact.slotCoordinate.id;
    authorizedRetryAttempt.seedAuthorityCompileInput.recentCompletionContext =
      fixture.transition.proposedRecentCompletionContext;
    const authorizedRetryAuthority = compilePatientSlotFillSeedAuthority(
      authorizedRetryAttempt.seedAuthorityCompileInput,
    );
    if (!authorizedRetryAuthority.ok) {
      throw new Error(
        `${authorizedRetryAuthority.error.code}: ${authorizedRetryAuthority.error.message}`,
      );
    }
    authorizedRetryAttempt.seedAuthorityArtifact = authorizedRetryAuthority.value;
    authorizedRetryAttempt.findingPipelineAuditRequest.patientSlotFillSeedAuthorityArtifact =
      authorizedRetryAuthority.value;
    const authorizedRetry = compilePatientSlotRefillReconciliation({
      ...reconciliationInput,
      id: 'patient-slot-refill-reconciliation-request.test.authorized-retry',
      fillAttempts: [blockedAttempt, authorizedRetryAttempt],
      explicitRetryAfterBlockedAttemptIds: [blockedAttempt.id],
    });
    if (!authorizedRetry.ok) {
      throw new Error(`${authorizedRetry.error.code}: ${authorizedRetry.error.message}`);
    }
    expect(authorizedRetry.value).toMatchObject({
      status: 'full',
      fillAttempts: [{ status: 'blocked' }, { status: 'filled' }],
    });
    expect(
      authorizedRetry.value.fillAttempts[1]!.seedAuthorityArtifact.patientGenerationSeed,
    ).not.toBe(authorizedRetry.value.fillAttempts[0]!.seedAuthorityArtifact.patientGenerationSeed);

    const staleCurrentMatrix = structuredClone(reconciliationInput);
    staleCurrentMatrix.currentAdmissionMatrixRequest.locations[0]!.label = 'Stale location payload';
    expect(compilePatientSlotRefillReconciliation(staleCurrentMatrix)).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });

    const tamperedTransition = structuredClone(fixture.transition);
    tamperedTransition.proposedCompletionHistoryState.entriesNewestFirst = [];
    expect(verifyPatientSlotLifecycleTransitionIntegrity(tamperedTransition).ok).toBe(false);
    const tamperedReconciliation = structuredClone(blocked.value);
    tamperedReconciliation.fillAttempts[0]!.nextFillOrdinal += 1;
    expect(verifyPatientSlotRefillReconciliationIntegrity(tamperedReconciliation).ok).toBe(false);
  }, 20_000);
});

describe('facility-move waiting-slot migration compiler', () => {
  it('preserves the frozen patient, seed, template, and historical draw while attaching fresh target proofs', () => {
    const fixture = makeFacilityMoveMigrationFixture();
    const before = structuredClone(fixture.input);
    const result = compileFacilityMoveWaitingSlotMigration(fixture.input);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    const artifact = result.value;
    const source = fixture.sourceArtifacts[0]!;
    const sourcePatient = source.catalogSnapshot?.patientInstance;
    if (sourcePatient === undefined) throw new Error('Expected a frozen source patient.');

    expect(fixture.input).toEqual(before);
    expect(FacilityMoveWaitingSlotMigrationArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.status).toBe('ready_to_commit');
    expect(artifact.diagnostics).toEqual([]);
    expect(artifact.committedMigrations).toHaveLength(1);
    const migration = artifact.committedMigrations[0]!;
    expect(migration.patientInstance).toEqual(sourcePatient);
    expect(migration.patientInstance.seed).toBe(sourcePatient.seed);
    expect(migration.sourceSlotCoordinate).toEqual(capacityCertificateOf(source).slotCoordinate);
    expect(migration.historicalPatientSlotFillSeedAuthorityArtifact).toEqual(
      seedAuthorityOf(source),
    );
    expect(migration.targetAdmittedTemplateLocationBindingArtifact.template).toEqual(
      admittedBindingOf(source).template,
    );
    expect(migration.targetSlotCoordinate.locationRef.id).toBe(pipelineSuccessorLocationRef.id);
    expect(migration.targetCapacityArtifactRef.artifactId).toBe(fixture.targetCapacityArtifact.id);
    expect(
      fixture.targetCapacityArtifact.slotCoordinates.some(
        (entry) =>
          entry.slotCoordinate.id === migration.targetSlotCoordinate.id &&
          JSON.stringify(entry.authorization) ===
            JSON.stringify(migration.targetCapacityAuthorization),
      ),
    ).toBe(true);
    expect(verifyFacilityMoveWaitingSlotMigrationIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(
      verifyFacilityMoveWaitingSlotMigrationContext({
        artifact,
        currentInput: fixture.input,
      }),
    ).toEqual({ ok: true, value: artifact });
  });

  it('blocks the complete move instead of partially migrating when target capacity is short', () => {
    const fixture = makeFacilityMoveMigrationFixture({
      waitingSlotCount: 2,
      targetCapacity: 1,
    });
    const result = compileFacilityMoveWaitingSlotMigration(fixture.input);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);

    expect(result.value.status).toBe('blocked');
    expect(result.value.slotEvaluations.map((evaluation) => evaluation.status)).toEqual([
      'ready',
      'blocked',
    ]);
    expect(result.value.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'target_capacity_exhausted' })]),
    );
    expect(result.value.committedMigrations).toEqual([]);
    expect(verifyFacilityMoveWaitingSlotMigrationIntegrity(result.value).ok).toBe(true);
  });

  it('itemizes a missing occupied-location successor and an unavailable exact template', () => {
    const missingMapping = makeFacilityMoveMigrationFixture({
      omitSuccessorMapping: true,
    });
    const missingResult = compileFacilityMoveWaitingSlotMigration(missingMapping.input);
    if (!missingResult.ok) {
      throw new Error(`${missingResult.error.code}: ${missingResult.error.message}`);
    }
    expect(missingResult.value.status).toBe('blocked');
    expect(missingResult.value.diagnostics).toEqual([
      expect.objectContaining({ code: 'successor_mapping_missing' }),
    ]);
    expect(missingResult.value.committedMigrations).toEqual([]);

    const wrongTemplate = makeFacilityMoveMigrationFixture({
      targetTemplateContentVersion: '2.0.0',
    });
    const wrongTemplateResult = compileFacilityMoveWaitingSlotMigration(wrongTemplate.input);
    if (!wrongTemplateResult.ok) {
      throw new Error(`${wrongTemplateResult.error.code}: ${wrongTemplateResult.error.message}`);
    }
    expect(wrongTemplateResult.value.status).toBe('blocked');
    expect(wrongTemplateResult.value.diagnostics).toEqual([
      expect.objectContaining({ code: 'template_not_admitted_at_successor' }),
    ]);
    expect(wrongTemplateResult.value.committedMigrations).toEqual([]);
  });

  it('rejects a frozen slot relabeled as originating from another facility', () => {
    const fixture = makeFacilityMoveMigrationFixture();
    const crossed = structuredClone(fixture.input);
    crossed.sourceFacility.id = 'facility.test.crossed-source';
    crossed.successorProfile.sourceFacilityRef.id = crossed.sourceFacility.id;
    crossed.successorProfile.sourceFacilityFingerprint =
      fingerprintFacilityLocationSuccessorFacility(crossed.sourceFacility);

    const crossedResult = compileFacilityMoveWaitingSlotMigration(crossed);
    expect(crossedResult).toMatchObject({
      ok: false,
      error: { code: 'INVALID_WAITING_SLOT' },
    });
  });

  it('rejects duplicate source coordinates, semantic tampering, obsolete versions, and stale target context', () => {
    const duplicateFixture = makeFacilityMoveMigrationFixture();
    const duplicate = structuredClone(duplicateFixture.input);
    duplicate.frozenWaitingSlots.push({
      ...structuredClone(duplicate.frozenWaitingSlots[0]!),
      id: 'waiting-slot.test.finding-pipeline.duplicate',
    });
    expect(compileFacilityMoveWaitingSlotMigration(duplicate)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_INPUT' },
    });

    const fixture = makeFacilityMoveMigrationFixture();
    const compiled = compileFacilityMoveWaitingSlotMigration(fixture.input);
    if (!compiled.ok) throw new Error(compiled.error.message);

    const patientTamper = structuredClone(compiled.value);
    patientTamper.slotEvaluations[0]!.proposedMigration!.patientInstance.seed =
      'seed.test.tampered';
    patientTamper.committedMigrations[0]!.patientInstance.seed = 'seed.test.tampered';
    expect(verifyFacilityMoveWaitingSlotMigrationIntegrity(patientTamper)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });

    const obsolete = structuredClone(compiled.value);
    obsolete.compilerVersion = '99.0.0';
    expect(verifyFacilityMoveWaitingSlotMigrationIntegrity(obsolete)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_COMPILER_VERSION' },
    });

    const staleContext = structuredClone(fixture.input);
    staleContext.currentTargetAdmissionMatrixRequest.id =
      'patient-template-location-admission-matrix-request.test.stale';
    expect(
      verifyFacilityMoveWaitingSlotMigrationContext({
        artifact: compiled.value,
        currentInput: staleContext,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });
});
