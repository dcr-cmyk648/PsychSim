import {
  CatalogCompiledInstanceSnapshotSchema,
  CatalogInstanceCompileRequestSchema,
  type CatalogInstanceCompileRequest,
  type ClinicalRuleReview,
  type DecisionPolicyDefinition,
  type DecisionRuleCandidateDefinition,
  type FindingDefinition,
  type InformationActionDefinition,
  type InstrumentDefinition,
  type LocationDefinition,
  type PatientTemplate,
  type ResolvedPatientState,
  type SharedFindingCompileRequest,
  type StructuredSourceReportProfile,
  type StructuredSourceReportSelectionHorizon,
  type StructuredSourceReportSelectionProfile,
  type TemplateConditionSelectionProfile,
  type UniversalActionResultAssemblyRecipe,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  compileCatalogInstances,
  fingerprintCatalogInstanceRecipe,
  verifyCatalogCompiledInstanceIntegrity,
} from './catalog-instance-compiler';
import { compileEncounterOperationalAdmission } from './encounter-operational-admission-compiler';
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
  fingerprintTemplateConditionSelectionTemplate,
  selectTemplateConditions,
} from './template-condition-selector';
import { fingerprintInformationActionPayload } from './universal-action-result-compiler';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-29T12:00:00.000Z',
  sourceUseNoteIds: [],
};

const authoredResolution = {
  origin: 'authored',
  ownerId: 'patient-template.test.mdd',
  ownerContentVersion: '1.0.0',
} as const;

const conditionState = (
  id: string,
  diagnosisDefinitionId: string,
  encounterRelevance: 'focus' | 'contributing' | 'background',
) => ({
  schemaVersion: 1 as const,
  id,
  diagnosisDefinitionId,
  diagnosisDefinitionContentVersion: '1.0.0',
  clinicalStateId: 'clinical-state.current',
  timeScopeId: 'time-scope.current',
  encounterRelevance,
  severityId:
    diagnosisDefinitionId === 'diagnosis.major-depressive-disorder'
      ? 'diagnosis-severity.mdd.moderate'
      : null,
  specifierIds: [],
  origin:
    diagnosisDefinitionId === 'diagnosis.major-depressive-disorder'
      ? ('authored' as const)
      : ('generated_optional' as const),
  resolution:
    diagnosisDefinitionId === 'diagnosis.major-depressive-disorder'
      ? authoredResolution
      : ({
          origin: 'deterministic_generation',
          generationProfileId: 'generation-profile.test.optional-condition',
          generationProfileContentVersion: '1.0.0',
          resolverVersion: '1.0.0',
          stableDrawId: `stable-draw.test.${id}`,
        } as const),
});

const makeBasePatientState = (): ResolvedPatientState => ({
  schemaVersion: 1,
  id: 'resolved-patient-state.test.catalog-instance',
  demographics: {
    recordVersion: 2,
    ageYears: 42,
    reviewedAgeBandId: 'age-band.middle-adult',
    sexForReference: 'female',
  },
  conditionStates: [
    conditionState('condition-state.test.mdd', 'diagnosis.major-depressive-disorder', 'focus'),
    conditionState(
      'condition-state.test.gad',
      'diagnosis.generalized-anxiety-disorder',
      'contributing',
    ),
    conditionState(
      'condition-state.test.background-insomnia',
      'diagnosis.insomnia-disorder',
      'background',
    ),
  ],
  diagnosisRecordEntries: [],
  medicationRegimenEntries: [],
  exposureInventory: {
    schemaVersion: 1,
    id: 'resolved-exposure-inventory.test.catalog-instance',
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
    id: 'resolved-proposition-state.test.catalog-instance',
    propositions: [],
    evidence: [],
    dependencyGroups: [],
    beliefAppraisals: [],
  },
  clinicalTagIds: [],
  reportedSafetyPlanningAbility: 'unassessed',
});

const findingDefinition: FindingDefinition = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'finding.history.test-low-energy',
  label: 'Current low energy',
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
  id: 'universal-action-result-assembly.test.catalog-instance',
  modelVersion: 'universal-action-result-assembly.v3',
  actionCatalog: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'information-action-catalog.test.catalog-instance',
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
      id: 'universal-action-result-recipe.test.depressive-symptoms',
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

const makeSharedFindingRequest = (
  patientState: ResolvedPatientState,
): SharedFindingCompileRequest => ({
  schemaVersion: 1,
  id: 'finding-compilation-request.test.catalog-instance',
  patientStateId: patientState.id,
  seed: 'catalog-instance-seed-42',
  findingDefinitions: [findingDefinition],
  candidates: [
    {
      schemaVersion: 1,
      id: 'finding-candidate.test.low-energy',
      findingDefinitionId: findingDefinition.id,
      findingDefinitionContentVersion: findingDefinition.contentVersion,
      kind: 'case_critical',
      proposedValue: { kind: 'outcome', value: 'present' },
      uncertainty: 'none',
      contributions: [
        {
          schemaVersion: 1,
          id: 'finding-contribution.test.low-energy',
          ownerKind: 'patient_template',
          ownerId: 'patient-template.test.mdd',
          ownerContentVersion: '1.0.0',
          role: 'constraint',
          provenanceIds: ['provenance.test.low-energy'],
        },
      ],
      resolution: authoredResolution,
      review: approvedReview,
    },
  ],
  propositionState: structuredClone(patientState.propositionState),
  propositionDefinitions: [],
  projections: [
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'finding-projection.test.low-energy-history',
      sourceMatch: 'any',
      sourceBindings: [
        {
          kind: 'canonical_finding',
          findingDefinitionId: findingDefinition.id,
          findingDefinitionContentVersion: findingDefinition.contentVersion,
          allowedStates: ['present'],
        },
      ],
      target: {
        kind: 'information_action',
        actionId: 'info.history.test-depressive-symptoms',
      },
      response: { kind: 'finding_outcome', outcome: 'present' },
      expressionBankId: 'finding-expression-bank.test.low-energy',
      expressionBankContentVersion: '1.0.0',
      review: approvedReview,
    },
  ],
  expressionBanks: [
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'finding-expression-bank.test.low-energy',
      label: 'Synthetic low-energy wording',
      displayChannels: ['patient_history'],
      variants: [
        {
          id: 'finding-expression.test.low-energy',
          text: 'Low energy',
        },
        {
          id: 'finding-expression.test.tired',
          text: 'Tired',
        },
      ],
      lifecycle: 'approved',
      medicalReviewStatus: 'approved',
    },
  ],
  projectionHorizon: {
    schemaVersion: 1,
    id: 'finding-projection-horizon.test.catalog-instance',
    targets: [
      {
        target: {
          kind: 'information_action',
          actionId: 'info.history.test-depressive-symptoms',
        },
        allowedResponses: [{ kind: 'finding_outcome', outcome: 'present' }],
        expressionDisplayChannel: 'patient_history',
      },
    ],
  },
});

const primaryRuleRef = {
  kind: 'medication_regimen_route' as const,
  id: 'route.test.mdd-first-line',
  contentVersion: '1.0.0',
  ownerId: 'diagnosis.major-depressive-disorder',
  ownerContentVersion: '1.0.0',
};

const makeDecisionPolicy = (): DecisionPolicyDefinition => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'decision-policy.test.mdd-first-line',
  label: 'Synthetic MDD immediate treatment decision',
  focusedDecisionId: 'decision.test.immediate-treatment',
  primaryRouteRef: primaryRuleRef,
  explicitSupportingRuleRefs: [],
  developerOpinionIds: ['developer-opinion.test.mdd-route'],
  review: approvedReview,
});

const makeDecisionRules = (): DecisionRuleCandidateDefinition[] => [
  {
    schemaVersion: 1,
    ruleRef: primaryRuleRef,
    label: 'Synthetic first-line route',
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
    effectId: 'effect.test.mdd-first-line',
    issueId: null,
    specificityPriority: 100,
    rationale: 'Synthetic point-free route used only to verify catalog attachments.',
    balanceRef: null,
    developerOpinionIds: ['developer-opinion.test.mdd-route'],
    review: approvedReview,
  },
  {
    schemaVersion: 1,
    ruleRef: {
      kind: 'diagnosis_rule',
      id: 'rule.test.catalog-medication-reconciliation-prerequisite',
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
          id: 'decision-policy.test.mdd-first-line',
          contentVersion: '1.0.0',
        },
        focusedDecisionId: 'decision.test.immediate-treatment',
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
    rationale: 'Synthetic point-free prerequisite used only to verify catalog attachments.',
    balanceRef: null,
    developerOpinionIds: ['developer-opinion.test.mdd-route'],
    review: approvedReview,
  },
];

const makeTemplate = (
  recipeFingerprints: ReturnType<typeof fingerprintCatalogInstanceRecipe>,
): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-template.test.mdd',
  compilationMode: 'attachment_only.v6',
  careSetting: 'outpatient_psychiatry',
  internalLabel: 'Synthetic attachment-only MDD template',
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
  review: approvedReview,
  patientPool: 'starter',
  focusedDecisionId: 'decision.test.immediate-treatment',
  primaryPolicyRef: {
    id: 'decision-policy.test.mdd-first-line',
    contentVersion: '1.0.0',
  },
  decisionActionHorizonId: 'decision-action-horizon.test.catalog-instance',
  decisionActionHorizonFingerprint: recipeFingerprints.decisionActionHorizonFingerprint,
  diagnosisSelectionHorizonId: 'diagnosis-selection-horizon.test.catalog-instance',
  diagnosisSelectionHorizonFingerprint: recipeFingerprints.diagnosisSelectionHorizonFingerprint,
  findingProjectionHorizonId: 'finding-projection-horizon.test.catalog-instance',
  findingProjectionHorizonFingerprint: recipeFingerprints.findingProjectionHorizonFingerprint,
  universalActionResultAssemblyRecipeRef: {
    id: 'universal-action-result-assembly.test.catalog-instance',
    contentVersion: '1.0.0',
  },
  universalActionResultAssemblyRecipeFingerprint:
    recipeFingerprints.universalActionResultAssemblyRecipeFingerprint,
  compatibleLocationRefs: [
    {
      id: 'location.test.solo-office',
      contentVersion: '1.0.0',
    },
  ],
  requiredConditions: [
    {
      schemaVersion: 1,
      id: 'template-condition.test.mdd',
      diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      encounterRelevance: 'focus',
      severityId: 'diagnosis-severity.mdd.moderate',
      specifierIds: [],
    },
  ],
  optionalConditionSelectionGroups: [
    {
      schemaVersion: 1,
      id: 'template-condition-group.test.comorbidity',
      minimumSelections: 0,
      maximumSelections: 2,
      candidates: [
        {
          schemaVersion: 1,
          id: 'template-condition.test.gad',
          diagnosisDefinitionId: 'diagnosis.generalized-anxiety-disorder',
          diagnosisDefinitionContentVersion: '1.0.0',
          clinicalStateId: 'clinical-state.current',
          timeScopeId: 'time-scope.current',
          encounterRelevance: 'contributing',
          severityId: null,
          specifierIds: [],
        },
        {
          schemaVersion: 1,
          id: 'template-condition.test.background-insomnia',
          diagnosisDefinitionId: 'diagnosis.insomnia-disorder',
          diagnosisDefinitionContentVersion: '1.0.0',
          clinicalStateId: 'clinical-state.current',
          timeScopeId: 'time-scope.current',
          encounterRelevance: 'background',
          severityId: null,
          specifierIds: [],
        },
      ],
    },
  ],
  complexityProfile: {
    modelVersion: 'additional-feature-budget.v1',
    measurementStatus: 'budget_only',
    additionalFeatureBudget: 0,
    maximumSelectedModules: 0,
    selectedModules: [],
    targetEnvelope: null,
  },
  presentationRichnessEnvelope: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'presentation-richness.test.mdd',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['diagnostic_attribution'],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const makeRequest = (): CatalogInstanceCompileRequest => {
  const patientState = makeBasePatientState();
  const sharedFindingRequest = makeSharedFindingRequest(patientState);
  const decisionActionHorizon: CatalogInstanceCompileRequest['decisionActionHorizon'] = {
    schemaVersion: 1,
    id: 'decision-action-horizon.test.catalog-instance',
    informationActionIds: ['info.history.test-depressive-symptoms'],
    startMedicationIds: ['medication.bupropion'],
    regimenEntryOperations: [],
    interventionIds: [],
    dispositionIds: ['disposition.outpatient'],
  };
  const diagnosisSelectionHorizon: CatalogInstanceCompileRequest['diagnosisSelectionHorizon'] = {
    schemaVersion: 1,
    id: 'diagnosis-selection-horizon.test.catalog-instance',
    allowEmptySelection: true,
    options: [],
  };
  const universalActionResultAssemblyRecipe = makeUniversalActionResultAssemblyRecipe();
  const recipeFingerprints = fingerprintCatalogInstanceRecipe({
    decisionActionHorizon,
    diagnosisSelectionHorizon,
    findingProjectionHorizon: sharedFindingRequest.projectionHorizon,
    universalActionResultAssemblyRecipe,
  });
  const template = makeTemplate(recipeFingerprints);
  const location: CatalogInstanceCompileRequest['location'] = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'location.test.solo-office',
    label: 'Synthetic solo office',
    facilityTier: 'solo_office',
    careSetting: 'outpatient_psychiatry',
    capabilities: [],
    formularyId: 'formulary.test.starter',
    dispositionIds: ['disposition.outpatient'],
  };
  const selectedLocationResourceArtifact = compileCatalogSelectedLocationResource(location);
  const operationalAdmission = compileEncounterOperationalAdmission({
    schemaVersion: 1,
    id: 'operational-admission-request.test.catalog-instance',
    template,
    selectedLocationResourceArtifact,
    actionHorizon: decisionActionHorizon,
    actionCatalog: universalActionResultAssemblyRecipe.actionCatalog,
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
    formularies: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'formulary.test.starter',
        label: 'Synthetic starter formulary',
        medicationIds: ['medication.bupropion'],
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
  });
  if (!operationalAdmission.ok) throw new Error(operationalAdmission.error.message);
  return {
    schemaVersion: 1,
    id: 'catalog-instance-compile-request.test.mdd',
    template,
    location,
    currentSelectedLocationResourceContext: currentCatalogSelectedLocationResourceContext(
      selectedLocationResourceArtifact,
    ),
    operationalAdmissionArtifact: operationalAdmission.value,
    basePatientState: patientState,
    deferredFindingScopedDurations: [],
    deferredFindingScopedSubjectiveBurdenRecords: [],
    conditionBindings: [
      {
        schemaVersion: 1,
        id: 'condition-binding.test.mdd',
        kind: 'required',
        templateConditionId: 'template-condition.test.mdd',
        conditionStateId: 'condition-state.test.mdd',
      },
      {
        schemaVersion: 1,
        id: 'condition-binding.test.gad',
        kind: 'optional_group',
        groupId: 'template-condition-group.test.comorbidity',
        templateConditionId: 'template-condition.test.gad',
        conditionStateId: 'condition-state.test.gad',
      },
      {
        schemaVersion: 1,
        id: 'condition-binding.test.background-insomnia',
        kind: 'optional_group',
        groupId: 'template-condition-group.test.comorbidity',
        templateConditionId: 'template-condition.test.background-insomnia',
        conditionStateId: 'condition-state.test.background-insomnia',
      },
    ],
    sharedFindingRequest,
    decisionPolicy: makeDecisionPolicy(),
    decisionRules: makeDecisionRules(),
    decisionActionHorizon,
    diagnosisSelectionHorizon,
    universalActionResultAssemblyRecipe,
    structuredSourceReportSelectionArtifact: null,
  };
};

const compileCatalogSelectedLocationResource = (location: LocationDefinition) => {
  const facilityId = 'facility.test.catalog-instance';
  const clinicStateId = 'clinic.test.catalog-instance';
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
      label: 'Synthetic catalog-instance facility',
      tier: location.facilityTier,
      minimumLifetimePoints: 0,
      patientSlotCount: 1,
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

const currentCatalogSelectedLocationResourceContext = (
  artifact: ReturnType<typeof compileCatalogSelectedLocationResource>,
): CatalogInstanceCompileRequest['currentSelectedLocationResourceContext'] => {
  const { schemaVersion, id, selectedLocation, ...context } = artifact.compileRequest;
  void schemaVersion;
  void id;
  void selectedLocation;
  return structuredClone(context);
};

const refreshTemplateRecipeFingerprints = (request: CatalogInstanceCompileRequest): void => {
  Object.assign(
    request.template,
    fingerprintCatalogInstanceRecipe({
      decisionActionHorizon: request.decisionActionHorizon,
      diagnosisSelectionHorizon: request.diagnosisSelectionHorizon,
      findingProjectionHorizon: request.sharedFindingRequest.projectionHorizon,
      universalActionResultAssemblyRecipe: request.universalActionResultAssemblyRecipe,
    }),
  );
};

const refreshOperationalAdmissionArtifact = (request: CatalogInstanceCompileRequest): void => {
  const prior = request.operationalAdmissionArtifact.compileRequest;
  const selectedLocationResourceArtifact = compileCatalogSelectedLocationResource(request.location);
  const refreshed = compileEncounterOperationalAdmission({
    ...prior,
    template: request.template,
    selectedLocationResourceArtifact,
    actionHorizon: request.decisionActionHorizon,
    actionCatalog: request.universalActionResultAssemblyRecipe.actionCatalog,
  });
  if (!refreshed.ok) throw new Error(refreshed.error.message);
  request.currentSelectedLocationResourceContext = currentCatalogSelectedLocationResourceContext(
    selectedLocationResourceArtifact,
  );
  request.operationalAdmissionArtifact = refreshed.value;
};

const addSyntheticInstrumentResponses = (
  request: CatalogInstanceCompileRequest,
  itemCount = 1,
): InstrumentDefinition => {
  const items: InstrumentDefinition['items'] = Array.from({ length: itemCount }, (_, index) => ({
    id: `instrument-item.test.catalog-low-energy-${index + 1}`,
    responseScaleId: 'response-scale.test.catalog-binary',
    responseOptionIds: ['response-option.test.catalog-present'],
    informationActionId: depressiveSymptomsAction.id,
    respondentSourceKind: 'patient_report' as const,
    timeScopeId: 'time-scope.current',
  }));
  const instrumentDefinition: InstrumentDefinition = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'instrument.test.catalog-depression-scale',
    modelVersion: 'instrument-item-response-only.v1',
    rightsBoundaryId: 'rights-boundary.test.public',
    items,
    lifecycle: 'approved',
    medicalReviewStatus: 'approved',
  };
  request.universalActionResultAssemblyRecipe.instrumentDefinitions.push(instrumentDefinition);
  request.universalActionResultAssemblyRecipe.recipes[0]!.sourceKinds.push(
    'instrument_item_responses',
  );
  for (const item of items) {
    request.sharedFindingRequest.projections.push({
      ...request.sharedFindingRequest.projections[0]!,
      id: `finding-projection.test.${item.id}`,
      target: {
        kind: 'instrument_item',
        instrumentDefinitionId: instrumentDefinition.id,
        instrumentContentVersion: instrumentDefinition.contentVersion,
        itemId: item.id,
      },
      response: {
        kind: 'response_option',
        responseOptionId: item.responseOptionIds[0]!,
      },
      expressionBankId: null,
      expressionBankContentVersion: null,
    });
    request.sharedFindingRequest.projectionHorizon.targets.push({
      target: {
        kind: 'instrument_item',
        instrumentDefinitionId: instrumentDefinition.id,
        instrumentContentVersion: instrumentDefinition.contentVersion,
        itemId: item.id,
      },
      allowedResponses: [
        {
          kind: 'response_option',
          responseOptionId: item.responseOptionIds[0]!,
        },
      ],
      expressionDisplayChannel: null,
    });
  }
  refreshTemplateRecipeFingerprints(request);
  refreshOperationalAdmissionArtifact(request);
  return instrumentDefinition;
};

const addTargetScopedMddDuration = (request: CatalogInstanceCompileRequest): void => {
  request.basePatientState.clinicalDurations.push({
    schemaVersion: 1,
    id: 'clinical-duration.test.mdd-current-episode',
    target: {
      kind: 'condition_state',
      conditionStateId: 'condition-state.test.mdd',
    },
    value: 9,
    unit: 'week',
    durationProfileId: 'duration-profile.test.mdd-current-episode',
    durationProfileContentVersion: '1.0.0',
    durationOptionId: 'duration-option.test.mdd-nine-weeks',
    relatedDiagnosisId: 'diagnosis.major-depressive-disorder',
    interpretation: 'supports_authored_state',
    criterionId: null,
    source: {
      kind: 'patient_report',
      sourceInstanceId: 'source-instance.test.patient',
    },
    timeScopeId: 'time-scope.current',
    resolution: authoredResolution,
  });
  request.universalActionResultAssemblyRecipe.targetScopedPatientValueProjectionDefinitions.push({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'target-scoped-definition.test.mdd-duration',
    modelVersion: 'target-scoped-patient-value-projection.v1',
    label: 'Current depressive episode duration',
    informationActionId: depressiveSymptomsAction.id,
    informationActionPayloadFingerprint:
      fingerprintInformationActionPayload(depressiveSymptomsAction),
    valueKind: 'clinical_duration',
    durationProfileId: 'duration-profile.test.mdd-current-episode',
    durationProfileContentVersion: '1.0.0',
    targetSelector: {
      kind: 'condition_definition',
      diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
      diagnosisDefinitionContentVersion: '1.0.0',
    },
    sourceKind: 'patient_report',
    timeScopeId: 'time-scope.current',
    lifecycle: 'approved',
    review: approvedReview,
  });
  request.universalActionResultAssemblyRecipe.recipes[0]!.sourceKinds.push(
    'target_scoped_patient_value_reveals',
  );
  refreshTemplateRecipeFingerprints(request);
  refreshOperationalAdmissionArtifact(request);
};

const addStructuredReactionReveal = (
  request: CatalogInstanceCompileRequest,
  mode: 'fixed' | 'weighted' = 'fixed',
): void => {
  const action: InformationActionDefinition = {
    id: 'info.history.test-reaction-history',
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
  const definition = {
    schemaVersion: 1 as const,
    contentVersion: '1.0.0',
    id: 'structured-reveal-definition.test.reaction-history',
    modelVersion: 'structured-patient-state-reveal.v1' as const,
    label: 'Reaction history',
    informationActionId: action.id,
    informationActionPayloadFingerprint,
    allowedSourceKinds: ['patient_report' as const],
    lanes: ['reaction_records' as const],
    singletonFields: ['reaction_history_status' as const],
    lifecycle: 'approved' as const,
    review: approvedReview,
  };
  request.decisionActionHorizon.informationActionIds.push(action.id);
  request.universalActionResultAssemblyRecipe.actionCatalog.actions.push(action);
  request.universalActionResultAssemblyRecipe.structuredRevealDefinitions.push(definition);
  request.universalActionResultAssemblyRecipe.recipes.push({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'universal-action-result-recipe.test.reaction-history',
    modelVersion: 'universal-action-result.v1',
    informationActionId: action.id,
    informationActionPayloadFingerprint,
    sourceKinds: ['structured_state_reveals'],
    lifecycle: 'review',
    medicalReviewStatus: 'unreviewed',
  });
  refreshTemplateRecipeFingerprints(request);
  refreshOperationalAdmissionArtifact(request);
  const source = {
    kind: 'patient_report' as const,
    sourceInstanceId: 'source-instance.test.patient',
  };
  const profile: StructuredSourceReportProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'source-report-profile.test.reaction-history',
    modelVersion: 'structured-source-report-profile.v1',
    label: 'Synthetic reaction history report',
    definitionRef: {
      id: definition.id,
      contentVersion: definition.contentVersion,
    },
    definitionFingerprint: fingerprintStructuredSourceReportDefinition(definition),
    source,
    timeScopeId: 'time-scope.longitudinal',
    claimOriginId: 'claim-origin.test.reaction-history',
    dependencyGroupIds: ['dependency-group.test.hidden'],
    laneBehaviors: [{ lane: 'reaction_records', behavior: 'report_all' }],
    singletonBehaviors: [
      {
        field: 'reaction_history_status',
        presentation: { kind: 'mirror_truth' },
      },
    ],
    developerOpinionIds: ['developer-opinion.test.reaction-history'],
    lifecycle: 'approved',
    review: approvedReview,
  };
  const alternateProfile: StructuredSourceReportProfile = {
    ...profile,
    id: 'source-report-profile.test.reaction-history.unassessed',
    label: 'Synthetic unassessed reaction history report',
    laneBehaviors: [{ lane: 'reaction_records', behavior: 'unassessed' }],
    singletonBehaviors: [
      {
        field: 'reaction_history_status',
        presentation: { kind: 'present_value', value: 'unassessed' },
      },
    ],
  };
  const profiles = mode === 'fixed' ? [profile] : [profile, alternateProfile];
  const horizon: StructuredSourceReportSelectionHorizon = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'source-report-selection-horizon.test.reaction-history',
    modelVersion: 'structured-source-report-selection.v1',
    assemblyRecipeRef: {
      id: request.universalActionResultAssemblyRecipe.id,
      contentVersion: request.universalActionResultAssemblyRecipe.contentVersion,
    },
    assemblyRecipeFingerprint: fingerprintStructuredSourceReportSelectionAssembly(
      request.universalActionResultAssemblyRecipe,
    ),
    pools: [
      {
        id: 'source-view-slot.test.reaction-history',
        definitionRef: {
          id: definition.id,
          contentVersion: definition.contentVersion,
        },
        definitionFingerprint: fingerprintStructuredSourceReportDefinition(definition),
        source,
        timeScopeId: profile.timeScopeId,
        claimOriginId: profile.claimOriginId,
        dependencyGroupIds: [...profile.dependencyGroupIds],
      },
    ],
    lifecycle: 'approved',
  };
  const selectionProfile: StructuredSourceReportSelectionProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `source-report-selection-profile.test.reaction-history.${request.template.careSetting}`,
    modelVersion: 'structured-source-report-selection-profile.v1',
    horizonRef: {
      id: horizon.id,
      contentVersion: horizon.contentVersion,
    },
    horizonFingerprint: fingerprintStructuredSourceReportSelectionHorizon(horizon),
    careSetting: request.template.careSetting,
    policies:
      mode === 'fixed'
        ? [
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
          ]
        : [
            {
              slotId: horizon.pools[0]!.id,
              mode: 'weighted',
              candidates: profiles.map((candidate) => ({
                profileRef: {
                  id: candidate.id,
                  contentVersion: candidate.contentVersion,
                },
                profileFingerprint: fingerprintStructuredSourceReportProfile(candidate),
                gameGenerationWeight: 1,
              })),
            },
          ],
    developerOpinionIds: ['developer-opinion.test.reaction-history'],
    lifecycle: 'approved',
    review: approvedReview,
  };
  const selection = selectStructuredSourceReportBehaviors({
    schemaVersion: 1,
    id: 'source-report-selection-request.test.reaction-history',
    seed: request.sharedFindingRequest.seed,
    template: request.template,
    assemblyRecipe: request.universalActionResultAssemblyRecipe,
    horizon,
    selectionProfile,
    profiles,
  });
  expect(selection.ok).toBe(true);
  if (!selection.ok) throw new Error(selection.error.message);
  request.structuredSourceReportSelectionArtifact = selection.value;
};

const expectSuccess = (request: unknown) => {
  const result = compileCatalogInstances(request);
  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`);
  }
  expect(result.ok).toBe(true);
  return result.value;
};

describe('catalog instance compiler', () => {
  it('strictly parses and atomically attaches a synthetic patient and encounter', () => {
    const request = makeRequest();
    expect(CatalogInstanceCompileRequestSchema.safeParse(request).success).toBe(true);
    const snapshot = expectSuccess(request);

    expect(CatalogCompiledInstanceSnapshotSchema.parse(snapshot)).toEqual(snapshot);
    expect(snapshot.patientInstance.patientState.canonicalFindings).toEqual(
      snapshot.patientInstance.sharedFindingCompilation.findings,
    );
    expect(snapshot.encounterInstance.compiledRubric.patientStateId).toBe(
      snapshot.patientInstance.patientState.id,
    );
    expect(
      snapshot.encounterInstance.compiledRubric.includedRules.find(
        (rule) => rule.ruleRef.id === 'rule.test.catalog-medication-reconciliation-prerequisite',
      )?.triggeredInformationPrerequisite,
    ).toMatchObject({
      triggerWhen: { targets: [{ kind: 'any_medication_start' }] },
      fulfillmentWhen: {
        targets: [
          {
            kind: 'information_action',
            informationActionId: 'info.history.test-depressive-symptoms',
          },
        ],
      },
    });
    expect(snapshot.encounterInstance.careSetting).toBe('outpatient_psychiatry');
    expect(snapshot.structuredSourceReportSelectionArtifact).toBeNull();
    expect(snapshot.structuredSourceReportArtifact).toBeNull();
    expect(snapshot.universalActionResultArtifact.compileRequest.structuredRevealEnvelopes).toEqual(
      [],
    );
    expect(snapshot.encounterInstance.resultBindings[0]?.sources[0]).toEqual({
      kind: 'finding_projection',
      resolvedProjectionId: snapshot.patientInstance.sharedFindingCompilation.projections[0]?.id,
    });
    expect(snapshot.patientInstance.conditionBindings).toHaveLength(3);
    expect(
      snapshot.patientInstance.patientState.conditionStates.map((state) => state.id),
    ).toContain('condition-state.test.background-insomnia');
    expect(snapshot.presentationRichnessEvaluation).toMatchObject({
      templateRef: {
        id: snapshot.template.id,
        contentVersion: snapshot.template.contentVersion,
      },
      patientStateId: snapshot.patientInstance.patientState.id,
      patientStateFingerprint: snapshot.encounterInstance.compiledRubric.patientStateFingerprint,
      priorEffort: {
        status: 'not_required',
        totalEffortUnits: 0,
      },
      diagnostics: [],
    });
    expect(verifyCatalogCompiledInstanceIntegrity(snapshot)).toEqual({
      ok: true,
      value: snapshot,
    });
  });

  it('attaches multiple D-220 item responses to one action while separating audit and patient views', () => {
    const request = makeRequest();
    const instrument = addSyntheticInstrumentResponses(request, 2);
    const snapshot = expectSuccess(request);
    const fullResponses = snapshot.instrumentItemResponseCompilation.responses;
    const patientResponses = snapshot.patientInstance.instrumentItemResponses;

    expect(snapshot.instrumentItemResponseCompilation.status).toBe('complete');
    expect(fullResponses).toHaveLength(2);
    expect(patientResponses).toHaveLength(2);
    expect(
      snapshot.universalActionResultArtifact.compileRequest.instrumentItemResponseCompilation,
    ).toEqual(snapshot.instrumentItemResponseCompilation);
    expect(snapshot.universalActionResultArtifact.instrumentItemResponseCompilationRef).toEqual({
      id: snapshot.instrumentItemResponseCompilation.id,
      payloadFingerprint: snapshot.instrumentItemResponseCompilation.payloadFingerprint,
    });
    expect(
      snapshot.instrumentItemResponseCompilation.evaluations.map(
        (evaluation) => evaluation.informationActionId,
      ),
    ).toEqual([depressiveSymptomsAction.id, depressiveSymptomsAction.id]);
    expect(
      snapshot.encounterInstance.resultBindings[0]?.sources
        .filter((source) => source.kind === 'instrument_item_response')
        .map((source) => source.responseId)
        .sort(),
    ).toEqual(patientResponses.map((response) => response.id).sort());
    expect(
      patientResponses
        .map((response) => ({
          instrumentDefinitionId: response.instrumentDefinitionId,
          itemId: response.itemId,
          informationActionId: response.informationActionId,
        }))
        .sort((left, right) => left.itemId.localeCompare(right.itemId)),
    ).toEqual(
      instrument.items
        .map((item) => ({
          instrumentDefinitionId: instrument.id,
          itemId: item.id,
          informationActionId: depressiveSymptomsAction.id,
        }))
        .sort((left, right) => left.itemId.localeCompare(right.itemId)),
    );

    const fullAudit = JSON.stringify(fullResponses);
    const patientView = JSON.stringify(patientResponses);
    expect(fullAudit).toMatch(
      /contributingResolvedFindingIds|projectionId|projectionContentVersion|interpretationIds/,
    );
    expect(patientView).not.toMatch(
      /interpretationIds|contributingResolvedFindingIds|propositionIds|evidenceIds|projectionId|projectionContentVersion|compileRequest|evaluations|diagnostics|Fingerprint|selectedExpression/,
    );
    expect(verifyCatalogCompiledInstanceIntegrity(snapshot)).toEqual({
      ok: true,
      value: snapshot,
    });

    const rootTampered = structuredClone(snapshot);
    rootTampered.instrumentItemResponseCompilation.responses[0]!.responseOptionId =
      'response-option.test.catalog-tampered';
    expect(verifyCatalogCompiledInstanceIntegrity(rootTampered).ok).toBe(false);

    const nestedTampered = structuredClone(snapshot);
    nestedTampered.universalActionResultArtifact.compileRequest.instrumentItemResponseCompilation.responses[0]!.rightsBoundaryId =
      'rights-boundary.test.tampered';
    expect(verifyCatalogCompiledInstanceIntegrity(nestedTampered).ok).toBe(false);

    const patientTampered = structuredClone(snapshot);
    patientTampered.patientInstance.instrumentItemResponses[0]!.informationActionId =
      'info.history.test-crossed';
    expect(verifyCatalogCompiledInstanceIntegrity(patientTampered).ok).toBe(false);

    const bindingTampered = structuredClone(snapshot);
    const instrumentBinding = bindingTampered.encounterInstance.resultBindings[0]?.sources.find(
      (source) => source.kind === 'instrument_item_response',
    );
    if (instrumentBinding?.kind === 'instrument_item_response') {
      instrumentBinding.responseId = 'instrument-item-response.test.crossed';
    }
    expect(verifyCatalogCompiledInstanceIntegrity(bindingTampered).ok).toBe(false);

    const responseOmitted = structuredClone(snapshot);
    responseOmitted.patientInstance.instrumentItemResponses.pop();
    expect(verifyCatalogCompiledInstanceIntegrity(responseOmitted)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });

    const responseDuplicated = structuredClone(snapshot);
    responseDuplicated.patientInstance.instrumentItemResponses.push(
      structuredClone(responseDuplicated.patientInstance.instrumentItemResponses[0]!),
    );
    expect(verifyCatalogCompiledInstanceIntegrity(responseDuplicated)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });

  it('compiles D-240 after final patient truth and attaches only its safe focused reveal', () => {
    const request = makeRequest();
    addTargetScopedMddDuration(request);
    const snapshot = expectSuccess(request);
    const artifact =
      snapshot.universalActionResultArtifact.compileRequest
        .targetScopedPatientValueProjectionArtifact;
    const patientReveal = snapshot.patientInstance.targetScopedPatientValueReveals[0];

    expect(artifact).not.toBeNull();
    expect(artifact?.compileRequest.patientState).toEqual(snapshot.patientInstance.patientState);
    expect(artifact?.compileRequest.definitions).toEqual(
      snapshot.universalActionResultAssemblyRecipe.targetScopedPatientValueProjectionDefinitions,
    );
    expect(patientReveal).toEqual(artifact?.frozenReveals[0]);
    expect(snapshot.encounterInstance.resultBindingRequests[0]?.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'target_scoped_patient_value_reveal',
          frozenRevealId: patientReveal?.id,
          definitionId: 'target-scoped-definition.test.mdd-duration',
        }),
      ]),
    );
    expect(snapshot.encounterInstance.resultBindings[0]?.sources).toEqual(
      expect.arrayContaining([
        {
          kind: 'target_scoped_patient_value_reveal',
          frozenRevealId: patientReveal?.id,
        },
      ]),
    );
    expect(JSON.stringify(patientReveal)).not.toMatch(
      /conditionStateId|targetSelector|durationProfileId|durationProfileContentVersion|durationOptionId|criterionId|interpretation|resolution/,
    );
    expect(verifyCatalogCompiledInstanceIntegrity(snapshot)).toEqual({
      ok: true,
      value: snapshot,
    });

    const tampered = structuredClone(snapshot);
    tampered.patientInstance.targetScopedPatientValueReveals[0]!.values[0]!.timeScopeId =
      'time-scope.tampered';
    expect(verifyCatalogCompiledInstanceIntegrity(tampered).ok).toBe(false);
  });

  it('rejects a valid but crossed D-220 and D-213 pair from another instrument owner version', () => {
    const originalRequest = makeRequest();
    addSyntheticInstrumentResponses(originalRequest);
    const original = expectSuccess(originalRequest);

    const alternateRequest = makeRequest();
    const alternateInstrument = addSyntheticInstrumentResponses(alternateRequest);
    alternateInstrument.rightsBoundaryId = 'rights-boundary.test.alternate';
    refreshTemplateRecipeFingerprints(alternateRequest);
    refreshOperationalAdmissionArtifact(alternateRequest);
    const alternate = expectSuccess(alternateRequest);

    const crossed = structuredClone(original);
    crossed.instrumentItemResponseCompilation = structuredClone(
      alternate.instrumentItemResponseCompilation,
    );
    crossed.universalActionResultArtifact = structuredClone(
      alternate.universalActionResultArtifact,
    );
    crossed.patientInstance.instrumentItemResponses = structuredClone(
      alternate.patientInstance.instrumentItemResponses,
    );
    crossed.encounterInstance.resultBindingRequests = structuredClone(
      alternate.encounterInstance.resultBindingRequests,
    );
    crossed.encounterInstance.resultBindings = structuredClone(
      alternate.encounterInstance.resultBindings,
    );
    crossed.encounterInstance.resultBindingRecipeFingerprint =
      alternate.encounterInstance.resultBindingRecipeFingerprint;

    expect(CatalogCompiledInstanceSnapshotSchema.safeParse(crossed).success).toBe(true);
    expect(verifyCatalogCompiledInstanceIntegrity(crossed)).toMatchObject({
      ok: false,
      error: { code: 'INSTRUMENT_ITEM_RESPONSE_CONTEXT_MISMATCH' },
    });
  });

  it('blocks attachment when an instrument item lacks its exact approved owner', () => {
    const request = makeRequest();
    addSyntheticInstrumentResponses(request);
    request.universalActionResultAssemblyRecipe.instrumentDefinitions = [];
    refreshTemplateRecipeFingerprints(request);
    refreshOperationalAdmissionArtifact(request);

    expect(compileCatalogInstances(request)).toMatchObject({
      ok: false,
      error: {
        code: 'INCOMPLETE_INSTRUMENT_ITEM_RESPONSE_COVERAGE',
        contentIds: expect.arrayContaining(['instrument.test.catalog-depression-scale']),
      },
    });
  });

  it.each([
    'outpatient_psychiatry',
    'emergency_department',
    'inpatient_psychiatry',
    'consultation_liaison',
  ] as const)(
    'freezes a matching %s recipe/location context without granting capabilities',
    (careSetting) => {
      const request = makeRequest();
      request.template.careSetting = careSetting;
      request.location.careSetting = careSetting;
      addSyntheticInstrumentResponses(request);
      refreshOperationalAdmissionArtifact(request);
      const originalComplexity = structuredClone(request.template.complexityProfile);
      const snapshot = expectSuccess(request);

      expect(snapshot.template.careSetting).toBe(careSetting);
      expect(snapshot.location.careSetting).toBe(careSetting);
      expect(snapshot.encounterInstance.careSetting).toBe(careSetting);
      expect(snapshot.location.capabilities).toEqual([]);
      expect(snapshot.template.complexityProfile).toEqual(originalComplexity);
      expect(snapshot.instrumentItemResponseCompilation.status).toBe('complete');
      expect(snapshot.patientInstance.instrumentItemResponses).toHaveLength(1);
      expect(verifyCatalogCompiledInstanceIntegrity(snapshot).ok).toBe(true);
    },
  );

  it.each([
    'outpatient_psychiatry',
    'emergency_department',
    'inpatient_psychiatry',
    'consultation_liaison',
  ] as const)('compiles the exact reviewed D-217 → D-215 source behavior for %s', (careSetting) => {
    const request = makeRequest();
    request.template.careSetting = careSetting;
    request.location.careSetting = careSetting;
    addStructuredReactionReveal(request);
    const originalComplexity = structuredClone(request.template.complexityProfile);
    const snapshot = expectSuccess(request);

    expect(snapshot.structuredSourceReportSelectionArtifact?.careSetting).toBe(careSetting);
    expect(
      snapshot.structuredSourceReportSelectionArtifact?.request.selectionProfile.careSetting,
    ).toBe(careSetting);
    expect(snapshot.structuredSourceReportArtifact?.compileRequest.patientState).toEqual(
      snapshot.patientInstance.patientState,
    );
    expect(snapshot.structuredSourceReportArtifact?.compileRequest.definitions).toEqual(
      snapshot.universalActionResultAssemblyRecipe.structuredRevealDefinitions,
    );
    expect(
      snapshot.universalActionResultArtifact.compileRequest.structuredRevealEnvelopes.map(
        (envelope) => envelope.resolved.id,
      ),
    ).toEqual(
      snapshot.structuredSourceReportArtifact?.projectionRecipes.map(
        (recipe) => recipe.resolved.id,
      ),
    );
    expect(snapshot.template.complexityProfile).toEqual(originalComplexity);
    expect(snapshot.location.capabilities).toEqual([]);
    expect(verifyCatalogCompiledInstanceIntegrity(snapshot).ok).toBe(true);
  });

  it('requires and retains one complete exact operational-admission proof before patient compilation', () => {
    const request = makeRequest();
    const complexityBefore = JSON.stringify(request.template.complexityProfile);
    const admissionBefore = structuredClone(request.operationalAdmissionArtifact);
    const snapshot = expectSuccess(request);

    expect(snapshot.operationalAdmissionArtifact).toEqual(admissionBefore);
    expect(
      snapshot.operationalAdmissionArtifact.compileRequest.selectedLocationResourceArtifact,
    ).toEqual(admissionBefore.compileRequest.selectedLocationResourceArtifact);
    expect(snapshot.encounterInstance).toMatchObject({
      operationalAdmissionArtifactId: admissionBefore.id,
      operationalAdmissionFingerprint: admissionBefore.payloadFingerprint,
    });
    expect(JSON.stringify(snapshot.template.complexityProfile)).toBe(complexityBefore);
    const playerPayload = JSON.stringify({
      patientInstance: snapshot.patientInstance,
      encounterInstance: snapshot.encounterInstance,
    });
    expect(playerPayload).not.toMatch(
      /currentSelectedLocationResourceContext|selectedLocationResourceArtifact|clinicOperationalContext|clinicOperationalContextFingerprint|assignmentHorizon|assignedUpgradeRefs|effectiveCapabilityIds|effectiveFormularyRefs|staffContexts|automaticInformationActionIds/,
    );
    expect(playerPayload).not.toContain(
      admissionBefore.compileRequest.selectedLocationResourceArtifact.id,
    );

    const missing = structuredClone(request) as unknown as Record<string, unknown>;
    delete missing.operationalAdmissionArtifact;
    expect(CatalogInstanceCompileRequestSchema.safeParse(missing).success).toBe(false);

    const tampered = structuredClone(request);
    tampered.operationalAdmissionArtifact.informationActionEvaluations[0]!.fulfillmentMethods[0]!.methodId =
      'fulfillment.history.tampered';
    expect(CatalogInstanceCompileRequestSchema.safeParse(tampered).success).toBe(true);
    expect(compileCatalogInstances(tampered)).toMatchObject({
      ok: false,
      error: { code: 'OPERATIONAL_ADMISSION_MISMATCH' },
    });

    const nestedResourceTampered = structuredClone(snapshot);
    nestedResourceTampered.operationalAdmissionArtifact.compileRequest.selectedLocationResourceArtifact.compileRequest.clinicOperationalContext.formularyIds.push(
      'formulary.test.tampered',
    );
    expect(CatalogCompiledInstanceSnapshotSchema.safeParse(nestedResourceTampered).success).toBe(
      true,
    );
    expect(verifyCatalogCompiledInstanceIntegrity(nestedResourceTampered).ok).toBe(false);
  });

  it('rejects stale same-version current resource contexts before attachment', () => {
    const cases: Array<{
      readonly label: string;
      readonly mutate: (request: CatalogInstanceCompileRequest) => void;
    }> = [
      {
        label: 'clinic ownership/configuration',
        mutate: (request) => {
          request.currentSelectedLocationResourceContext.clinicOperationalContext.ownedUpgradeIds.push(
            'upgrade.test.same-version-extra',
          );
        },
      },
      {
        label: 'facility payload',
        mutate: (request) => {
          request.currentSelectedLocationResourceContext.facility.label =
            'Changed facility payload without a version bump';
        },
      },
      {
        label: 'selected or neighboring assignment horizon',
        mutate: (request) => {
          request.currentSelectedLocationResourceContext.assignmentHorizon.assignments[0]!.contentVersion =
            '1.0.1';
        },
      },
      {
        label: 'upgrade-owner horizon',
        mutate: (request) => {
          request.currentSelectedLocationResourceContext.upgradeOwners.push({
            schemaVersion: 1,
            contentVersion: '1.0.0',
            id: 'upgrade.test.same-version-extra',
            kind: 'equipment',
            locationAssignmentMode: 'exclusive_location',
            allowedFacilityTiers: ['solo_office'],
            requiredDepartmentId: null,
            grantsCapabilities: ['capability.test.must-not-leak'],
            grantsFormularyIds: [],
            staffAutomation: null,
          });
        },
      },
      {
        label: 'staff automation',
        mutate: (request) => {
          request.currentSelectedLocationResourceContext.clinicOperationalContext.staffConfigurations.push(
            {
              staffUpgradeId: 'upgrade.test.stale-staff',
              automaticInformationActionIds: ['info.history.test-depressive-symptoms'],
            },
          );
        },
      },
      {
        label: 'formulary membership',
        mutate: (request) => {
          request.currentSelectedLocationResourceContext.formularyOwners[0]!.medicationIds.push(
            'medication.test.same-version-added',
          );
        },
      },
    ];

    for (const entry of cases) {
      const request = makeRequest();
      entry.mutate(request);
      expect(
        compileCatalogInstances(request),
        `Expected stale ${entry.label} context to be rejected.`,
      ).toMatchObject({
        ok: false,
        error: { code: 'OPERATIONAL_ADMISSION_MISMATCH' },
      });
    }
  });

  it('rejects exact same-ID/version location payload crossings in compile and replay', () => {
    const mutations: Array<(location: LocationDefinition) => void> = [
      (location) => {
        location.capabilities.push('capability.test.same-version-added');
      },
      (location) => {
        location.formularyId = 'formulary.test.same-version-crossed';
      },
      (location) => {
        location.dispositionIds.push('disposition.test.same-version-added');
      },
      (location) => {
        location.departmentId = 'department.test.same-version-added';
      },
    ];

    for (const mutate of mutations) {
      const request = makeRequest();
      mutate(request.location);
      expect(compileCatalogInstances(request)).toMatchObject({
        ok: false,
      });

      const snapshot = structuredClone(expectSuccess(makeRequest()));
      mutate(snapshot.location);
      expect(verifyCatalogCompiledInstanceIntegrity(snapshot)).toMatchObject({
        ok: false,
        error: { code: 'OPERATIONAL_ADMISSION_CONTEXT_MISMATCH' },
      });
    }
  });

  it('rejects crossed, unknown, and tampered care-setting contexts', () => {
    const crossed = makeRequest();
    crossed.location.careSetting = 'emergency_department';
    expect(compileCatalogInstances(crossed)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const unknown = makeRequest() as unknown as Record<string, unknown>;
    (unknown.location as Record<string, unknown>).careSetting = 'walk_in_clinic';
    expect(compileCatalogInstances(unknown)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const tampered = structuredClone(expectSuccess(makeRequest()));
    tampered.encounterInstance.careSetting = 'consultation_liaison';
    expect(verifyCatalogCompiledInstanceIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });

  it('retains the full D-212 audit only in D-213 and freezes a redacted structured source view', () => {
    const request = makeRequest();
    addStructuredReactionReveal(request);
    const snapshot = expectSuccess(request);

    const safeView = snapshot.patientInstance.structuredStateReveals[0]!;
    expect(safeView).toMatchObject({
      informationActionId: 'info.history.test-reaction-history',
      patientStateId: snapshot.patientInstance.patientState.id,
      laneStatements: [
        {
          lane: 'reaction_records',
          presentationStatus: 'unassessed',
          presentedRecordIds: [],
        },
      ],
      singletonStatements: [
        {
          field: 'reaction_history_status',
          presentedValue: 'unassessed',
        },
      ],
    });
    expect(JSON.stringify(safeView)).not.toMatch(
      /omittedTruthRecordIds|truthValue|relationshipToTruth|claimOriginId|dependencyGroupIds|resolution/,
    );
    expect(
      JSON.stringify(
        snapshot.universalActionResultArtifact.compileRequest.structuredRevealEnvelopes[0],
      ),
    ).toMatch(/omittedTruthRecordIds/);
    expect(snapshot.structuredSourceReportSelectionArtifact).not.toBeNull();
    expect(snapshot.structuredSourceReportArtifact).not.toBeNull();
    expect(snapshot.structuredSourceReportArtifact?.projectionRecipes[0]?.resolved.id).toBe(
      safeView.id,
    );
    expect(
      snapshot.encounterInstance.resultBindings.find(
        (binding) => binding.informationActionId === 'info.history.test-reaction-history',
      )?.sources,
    ).toEqual([
      {
        kind: 'structured_state_reveal',
        resolvedProjectionId: safeView.id,
      },
    ]);
    expect(verifyCatalogCompiledInstanceIntegrity(snapshot).ok).toBe(true);
  });

  it('retains the exact weighted D-217 selection as the only D-215 profile set', () => {
    const request = makeRequest();
    addStructuredReactionReveal(request, 'weighted');
    const snapshot = expectSuccess(request);
    const selected = snapshot.structuredSourceReportSelectionArtifact?.selectedProfileRefs;
    const compiled = snapshot.structuredSourceReportArtifact?.profileReferences.map(
      (reference) => ({
        id: reference.profileRef.id,
        contentVersion: reference.profileRef.contentVersion,
        fingerprint: reference.profileFingerprint,
      }),
    );

    expect(selected).toHaveLength(1);
    expect(compiled).toEqual(selected);
    expect(
      snapshot.structuredSourceReportSelectionArtifact?.selections[0]?.stableDrawId,
    ).not.toBeNull();
    expect(verifyCatalogCompiledInstanceIntegrity(snapshot).ok).toBe(true);
  });

  it('rejects missing, unexpected, crossed-setting, stale-assembly, and legacy source-report inputs', () => {
    const missing = makeRequest();
    addStructuredReactionReveal(missing);
    missing.structuredSourceReportSelectionArtifact = null;
    expect(compileCatalogInstances(missing)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const source = makeRequest();
    addStructuredReactionReveal(source);
    const unexpected = makeRequest() as unknown as Record<string, unknown>;
    unexpected.structuredSourceReportSelectionArtifact =
      source.structuredSourceReportSelectionArtifact;
    expect(compileCatalogInstances(unexpected)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const crossedSetting = makeRequest();
    addStructuredReactionReveal(crossedSetting);
    crossedSetting.template.careSetting = 'emergency_department';
    crossedSetting.location.careSetting = 'emergency_department';
    expect(compileCatalogInstances(crossedSetting)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const differentSeed = makeRequest();
    addStructuredReactionReveal(differentSeed, 'weighted');
    const selectionUnderAnotherSeed = selectStructuredSourceReportBehaviors({
      ...differentSeed.structuredSourceReportSelectionArtifact!.request,
      seed: 'different-source-report-seed',
    });
    expect(selectionUnderAnotherSeed.ok).toBe(true);
    if (!selectionUnderAnotherSeed.ok) {
      throw new Error(selectionUnderAnotherSeed.error.message);
    }
    differentSeed.structuredSourceReportSelectionArtifact = selectionUnderAnotherSeed.value;
    expect(compileCatalogInstances(differentSeed)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const staleAssembly = makeRequest();
    addStructuredReactionReveal(staleAssembly);
    staleAssembly.universalActionResultAssemblyRecipe.structuredRevealDefinitions[0]!.label =
      'Changed after source behavior selection';
    refreshTemplateRecipeFingerprints(staleAssembly);
    refreshOperationalAdmissionArtifact(staleAssembly);
    expect(compileCatalogInstances(staleAssembly)).toMatchObject({
      ok: false,
      error: { code: 'STRUCTURED_SOURCE_REPORT_SELECTION_MISMATCH' },
    });

    const legacy = {
      ...makeRequest(),
      structuredRevealProjectionRecipes: [],
    };
    expect(CatalogInstanceCompileRequestSchema.safeParse(legacy).success).toBe(false);
  });

  it('detects D-217 and D-215 audit tampering before trusting attached source views', () => {
    const snapshot = expectSuccess(
      (() => {
        const request = makeRequest();
        addStructuredReactionReveal(request, 'weighted');
        return request;
      })(),
    );

    const selectionChanged = structuredClone(snapshot);
    selectionChanged.structuredSourceReportSelectionArtifact!.seed = 'tampered-seed';
    expect(verifyCatalogCompiledInstanceIntegrity(selectionChanged)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });

    const reportChanged = structuredClone(snapshot);
    reportChanged.structuredSourceReportArtifact!.compileRequest.patientState.demographics.ageYears += 1;
    expect(verifyCatalogCompiledInstanceIntegrity(reportChanged)).toMatchObject({
      ok: false,
      error: { code: 'STRUCTURED_SOURCE_REPORT_INTEGRITY_INVALID' },
    });
  });

  it('accepts exact condition states and bindings emitted by the quarantined selector', () => {
    const request = makeRequest();
    const profile: TemplateConditionSelectionProfile = {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'generation-profile.test.catalog-instance-conditions',
      modelVersion: 'weighted-template-condition-selection.v1',
      templateRef: {
        id: request.template.id,
        contentVersion: request.template.contentVersion,
      },
      templateFingerprint: fingerprintTemplateConditionSelectionTemplate(request.template),
      groupProfiles: request.template.optionalConditionSelectionGroups.map((group) => ({
        schemaVersion: 1,
        id: `generation-profile-group.test.${group.id}`,
        groupId: group.id,
        countWeights: [
          {
            schemaVersion: 1,
            selectionCount: group.maximumSelections,
            gameSelectionWeight: 1,
          },
        ],
        candidateWeights: group.candidates.map((candidate) => ({
          schemaVersion: 1,
          templateConditionId: candidate.id,
          gameSelectionWeight: 1,
        })),
      })),
      incompatibilities: [],
    };
    const selection = selectTemplateConditions({
      schemaVersion: 1,
      id: 'template-condition-selection-request.test.catalog-instance',
      template: request.template,
      profile,
      seed: request.sharedFindingRequest.seed,
    });
    expect(selection.ok).toBe(true);
    if (!selection.ok) {
      throw new Error('error' in selection ? selection.error.message : selection.conflict.code);
    }

    request.basePatientState.conditionStates = selection.value.conditionStates;
    request.conditionBindings = selection.value.conditionBindings;
    const snapshot = expectSuccess(request);

    expect(snapshot.patientInstance.conditionBindings).toEqual(selection.value.conditionBindings);
    expect(snapshot.patientInstance.patientState.conditionStates).toEqual(
      selection.value.conditionStates,
    );
    expect(verifyCatalogCompiledInstanceIntegrity(snapshot).ok).toBe(true);
  });

  it('attaches a nonblocking prior-effort shortfall without rejecting a textured patient', () => {
    const request = makeRequest();
    request.template.presentationRichnessEnvelope = {
      ...request.template.presentationRichnessEnvelope,
      decisionDriverCategories: [
        'regimen_transition',
        'diagnostic_attribution',
        'prior_response_or_intolerance',
      ],
      priorEffortExpectation: {
        kind: 'multiple_expected',
        minimumEffortUnits: 2,
      },
    };
    request.basePatientState.diagnosisRecordEntries.push({
      schemaVersion: 1,
      id: 'diagnosis-record.test.questioned-bipolar',
      mappedDiagnosisDefinitionId: 'diagnosis.bipolar-disorder',
      mappedDiagnosisDefinitionContentVersion: '1.0.0',
      recordedLabel: 'Possible bipolar disorder',
      assertion: 'questioned',
      source: {
        kind: 'record_review',
        sourceInstanceId: 'outside-record.test.referral',
      },
      timeScopeId: 'time-scope.historical',
      resolution: authoredResolution,
    });
    refreshOperationalAdmissionArtifact(request);
    const snapshot = expectSuccess(request);

    expect(snapshot.patientInstance.patientState.conditionStates.map((state) => state.id)).toEqual([
      'condition-state.test.background-insomnia',
      'condition-state.test.gad',
      'condition-state.test.mdd',
    ]);
    expect(snapshot.patientInstance.patientState.diagnosisRecordEntries).toHaveLength(1);
    expect(snapshot.presentationRichnessEvaluation.priorEffort).toMatchObject({
      status: 'unmet',
      totalEffortUnits: 0,
    });
    expect(snapshot.presentationRichnessEvaluation.diagnostics).toEqual([
      expect.objectContaining({
        code: 'prior_effort_expectation_unmet',
        impact: 'nonblocking',
      }),
    ]);
    expect(verifyCatalogCompiledInstanceIntegrity(snapshot).ok).toBe(true);
  });

  it('is deterministic, order-invariant, and does not mutate its input', () => {
    const request = makeRequest();
    const before = JSON.stringify(request);
    const first = expectSuccess(request);
    expect(JSON.stringify(request)).toBe(before);

    const reordered = structuredClone(request);
    reordered.basePatientState.conditionStates.reverse();
    reordered.conditionBindings.reverse();
    reordered.location.dispositionIds.reverse();
    reordered.decisionActionHorizon.informationActionIds.reverse();
    expect(expectSuccess(reordered)).toEqual(first);
  });

  it('rejects unknown fields and pre-resolved canonical findings', () => {
    const unknown = { ...makeRequest(), arbitraryCode: 'not allowed' };
    expect(compileCatalogInstances(unknown)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST', inputFingerprint: null },
    });

    const request = makeRequest();
    request.basePatientState.canonicalFindings.push({
      schemaVersion: 1,
      id: 'resolved-finding.test.preexisting',
      definitionId: findingDefinition.id,
      definitionContentVersion: findingDefinition.contentVersion,
      value: { kind: 'outcome', value: 'present' },
      resolution: {
        resolverVersion: '1.0.0',
        origin: 'authored',
        uncertainty: 'none',
        appliedContributionIds: ['finding-contribution.test.preexisting'],
      },
      contributions: [
        {
          schemaVersion: 1,
          id: 'finding-contribution.test.preexisting',
          ownerKind: 'patient_state',
          ownerId: request.basePatientState.id,
          ownerContentVersion: null,
          role: 'authored_value',
          provenanceIds: [],
        },
      ],
    });
    expect(compileCatalogInstances(request)).toMatchObject({
      ok: false,
      error: { code: 'BASE_FINDINGS_NOT_EMPTY' },
    });
  });

  it('rejects stale patient, proposition, policy, location, and disposition attachments', () => {
    const patient = makeRequest();
    patient.sharedFindingRequest.patientStateId = 'resolved-patient-state.test.other';
    expect(compileCatalogInstances(patient)).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_ID_MISMATCH' },
    });

    const proposition = makeRequest();
    proposition.sharedFindingRequest.propositionState.id = 'resolved-proposition-state.test.other';
    expect(compileCatalogInstances(proposition)).toMatchObject({
      ok: false,
      error: { code: 'PROPOSITION_STATE_MISMATCH' },
    });

    const policy = makeRequest();
    policy.template.primaryPolicyRef.contentVersion = '9.0.0';
    refreshOperationalAdmissionArtifact(policy);
    expect(compileCatalogInstances(policy)).toMatchObject({
      ok: false,
      error: { code: 'TEMPLATE_POLICY_MISMATCH' },
    });

    const location = makeRequest();
    location.location.contentVersion = '9.0.0';
    expect(compileCatalogInstances(location)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const disposition = makeRequest();
    disposition.decisionActionHorizon.dispositionIds = ['disposition.inpatient'];
    refreshTemplateRecipeFingerprints(disposition);
    expect(compileCatalogInstances(disposition)).toMatchObject({
      ok: false,
      error: { code: 'OPERATIONAL_ADMISSION_MISMATCH' },
    });

    const horizon = makeRequest();
    horizon.template.decisionActionHorizonId = 'decision-action-horizon.test.other';
    expect(compileCatalogInstances(horizon)).toMatchObject({
      ok: false,
      error: { code: 'OPERATIONAL_ADMISSION_MISMATCH' },
    });

    const sameIdActionPayload = makeRequest();
    sameIdActionPayload.decisionActionHorizon.startMedicationIds.push('medication.sertraline');
    expect(compileCatalogInstances(sameIdActionPayload)).toMatchObject({
      ok: false,
      error: { code: 'OPERATIONAL_ADMISSION_MISMATCH' },
    });

    const sameIdDiagnosisPayload = makeRequest();
    sameIdDiagnosisPayload.diagnosisSelectionHorizon.options.push({
      id: 'diagnosis-option.test.mdd',
      diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
      diagnosisDefinitionContentVersion: '1.0.0',
    });
    expect(compileCatalogInstances(sameIdDiagnosisPayload)).toMatchObject({
      ok: false,
      error: { code: 'TEMPLATE_HORIZON_MISMATCH' },
    });

    const sameIdProjectionPayload = makeRequest();
    sameIdProjectionPayload.sharedFindingRequest.projectionHorizon.targets[0]?.allowedResponses.push(
      {
        kind: 'finding_outcome',
        outcome: 'absent',
      },
    );
    expect(compileCatalogInstances(sameIdProjectionPayload)).toMatchObject({
      ok: false,
      error: { code: 'TEMPLATE_HORIZON_MISMATCH' },
    });

    const sameIdResultRecipe = makeRequest();
    sameIdResultRecipe.universalActionResultAssemblyRecipe.recipes[0]!.sourceKinds = [
      'measurements',
    ];
    expect(compileCatalogInstances(sameIdResultRecipe)).toMatchObject({
      ok: false,
      error: { code: 'TEMPLATE_RESULT_ASSEMBLY_MISMATCH' },
    });
  });

  it('rejects missing condition bindings and out-of-bounds optional selections', () => {
    const missingRequired = makeRequest();
    missingRequired.conditionBindings = missingRequired.conditionBindings.filter(
      (binding) => binding.kind !== 'required',
    );
    expect(compileCatalogInstances(missingRequired)).toMatchObject({
      ok: false,
      error: { code: 'COMPILED_SNAPSHOT_INVALID' },
    });

    const tooMany = makeRequest();
    tooMany.template.optionalConditionSelectionGroups[0]!.maximumSelections = 1;
    refreshOperationalAdmissionArtifact(tooMany);
    expect(compileCatalogInstances(tooMany)).toMatchObject({
      ok: false,
      error: { code: 'COMPILED_SNAPSHOT_INVALID' },
    });
  });

  it('requires every internal condition to be bound with matching required or optional provenance', () => {
    const unbound = makeRequest();
    unbound.conditionBindings = unbound.conditionBindings.filter(
      (binding) => binding.conditionStateId !== 'condition-state.test.background-insomnia',
    );
    expect(compileCatalogInstances(unbound)).toMatchObject({
      ok: false,
      error: { code: 'COMPILED_SNAPSHOT_INVALID' },
    });

    const requiredGenerated = makeRequest();
    const requiredState = requiredGenerated.basePatientState.conditionStates.find(
      (condition) => condition.id === 'condition-state.test.mdd',
    )!;
    requiredState.origin = 'generated_optional';
    requiredState.resolution = {
      origin: 'deterministic_generation',
      generationProfileId: 'generation-profile.test.optional-condition',
      generationProfileContentVersion: '1.0.0',
      resolverVersion: '1.0.0',
      stableDrawId: 'stable-draw.test.required-mismatch',
    };
    expect(compileCatalogInstances(requiredGenerated)).toMatchObject({
      ok: false,
      error: { code: 'COMPILED_SNAPSHOT_INVALID' },
    });

    const optionalAuthored = makeRequest();
    const optionalState = optionalAuthored.basePatientState.conditionStates.find(
      (condition) => condition.id === 'condition-state.test.gad',
    )!;
    optionalState.origin = 'authored';
    optionalState.resolution = authoredResolution;
    expect(compileCatalogInstances(optionalAuthored)).toMatchObject({
      ok: false,
      error: { code: 'COMPILED_SNAPSHOT_INVALID' },
    });

    const foreignRequiredOwner = makeRequest();
    const foreignState = foreignRequiredOwner.basePatientState.conditionStates.find(
      (condition) => condition.id === 'condition-state.test.mdd',
    )!;
    foreignState.resolution = {
      ...authoredResolution,
      ownerId: 'patient-template.test.other',
    };
    expect(compileCatalogInstances(foreignRequiredOwner)).toMatchObject({
      ok: false,
      error: { code: 'COMPILED_SNAPSHOT_INVALID' },
    });
  });

  it('requires every information action to freeze one resolvable result source', () => {
    const incompleteCoverage = makeRequest();
    incompleteCoverage.universalActionResultAssemblyRecipe.recipes[0]!.sourceKinds = [
      'finding_projections',
      'measurements',
    ];
    refreshTemplateRecipeFingerprints(incompleteCoverage);
    refreshOperationalAdmissionArtifact(incompleteCoverage);
    expect(compileCatalogInstances(incompleteCoverage)).toMatchObject({
      ok: false,
      error: { code: 'INCOMPLETE_ACTION_RESULT_COVERAGE' },
    });

    const legacyCallerBinding = {
      ...makeRequest(),
      resultBindings: [],
    };
    expect(CatalogInstanceCompileRequestSchema.safeParse(legacyCallerBinding).success).toBe(false);
  });

  it('resolves deferred finding-scoped duration and burden only after findings compile', () => {
    const request = makeRequest();
    request.deferredFindingScopedDurations = [
      {
        schemaVersion: 1,
        id: 'clinical-duration.test.low-energy',
        target: {
          kind: 'canonical_finding_definition',
          findingDefinitionId: findingDefinition.id,
          findingDefinitionContentVersion: findingDefinition.contentVersion,
        },
        value: 8,
        unit: 'week',
        durationProfileId: 'duration-profile.test.low-energy',
        durationProfileContentVersion: '1.0.0',
        durationOptionId: 'duration-option.test.eight-weeks',
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
    ];
    request.deferredFindingScopedSubjectiveBurdenRecords = [
      {
        schemaVersion: 1,
        id: 'subjective-burden.test.low-energy',
        target: {
          kind: 'canonical_finding_definition',
          findingDefinitionId: findingDefinition.id,
          findingDefinitionContentVersion: findingDefinition.contentVersion,
        },
        ordinalScaleId: 'ordinal-scale.test.bother',
        ordinalScaleContentVersion: '1.0.0',
        ordinalValueId: 'ordinal-value.test.very',
        source: {
          kind: 'patient_report',
          sourceInstanceId: 'source-instance.test.history',
        },
        timeScopeId: 'time-scope.current',
        resolution: authoredResolution,
      },
    ];

    const snapshot = expectSuccess(request);
    const findingId = snapshot.patientInstance.sharedFindingCompilation.findings[0]?.id;
    expect(snapshot.patientInstance.patientState.clinicalDurations[0]?.target).toEqual({
      kind: 'canonical_finding',
      canonicalFindingId: findingId,
    });
    expect(snapshot.patientInstance.patientState.subjectiveBurdenRecords[0]?.target).toEqual({
      kind: 'canonical_finding',
      canonicalFindingId: findingId,
    });
    expect(verifyCatalogCompiledInstanceIntegrity(snapshot).ok).toBe(true);

    const stale = makeRequest();
    stale.deferredFindingScopedDurations = [
      {
        ...request.deferredFindingScopedDurations[0]!,
        id: 'clinical-duration.test.missing-finding',
        target: {
          kind: 'canonical_finding_definition',
          findingDefinitionId: 'finding.history.test.missing',
          findingDefinitionContentVersion: '1.0.0',
        },
      },
    ];
    expect(compileCatalogInstances(stale)).toMatchObject({
      ok: false,
      error: { code: 'UNRESOLVED_FINDING_SCOPED_RECORD' },
    });
  });

  it('automatically binds every active finding projection owned by one information action', () => {
    const request = makeRequest();
    request.sharedFindingRequest.projections.push({
      ...structuredClone(request.sharedFindingRequest.projections[0]!),
      id: 'finding-projection.test.low-energy-orphan',
    });
    const snapshot = expectSuccess(request);
    expect(snapshot.encounterInstance.resultBindings[0]?.sources).toHaveLength(2);
    expect(snapshot.universalActionResultArtifact.bindingCandidates[0]?.sources).toHaveLength(2);
  });

  it('preserves authored diagnosis-option order while normalizing structural record sets', () => {
    const request = makeRequest();
    request.diagnosisSelectionHorizon.options = [
      {
        id: 'diagnosis-option.test.unspecified-depression',
        diagnosisDefinitionId: 'diagnosis.unspecified-depressive-disorder',
        diagnosisDefinitionContentVersion: '1.0.0',
      },
      {
        id: 'diagnosis-option.test.mdd',
        diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
        diagnosisDefinitionContentVersion: '1.0.0',
      },
    ];
    refreshTemplateRecipeFingerprints(request);
    refreshOperationalAdmissionArtifact(request);
    const snapshot = expectSuccess(request);
    expect(
      snapshot.encounterInstance.diagnosisSelectionHorizon.options.map((option) => option.id),
    ).toEqual(['diagnosis-option.test.unspecified-depression', 'diagnosis-option.test.mdd']);
  });

  it('rejects same-ID patient, action, and projection-horizon payload changes', () => {
    const snapshot = expectSuccess(makeRequest());

    const patientChanged = structuredClone(snapshot);
    patientChanged.patientInstance.patientState.demographics.ageYears += 1;
    expect(verifyCatalogCompiledInstanceIntegrity(patientChanged)).toMatchObject({
      ok: false,
      error: { code: 'UNIVERSAL_ACTION_RESULT_CONTEXT_MISMATCH' },
    });

    const actionChanged = structuredClone(snapshot);
    actionChanged.encounterInstance.decisionActionHorizon.startMedicationIds.push(
      'medication.sertraline',
    );
    expect(verifyCatalogCompiledInstanceIntegrity(actionChanged)).toMatchObject({
      ok: false,
      error: { code: 'OPERATIONAL_ADMISSION_CONTEXT_MISMATCH' },
    });

    const horizonChanged = structuredClone(snapshot);
    horizonChanged.encounterInstance.findingProjectionHorizon.targets[0]?.allowedResponses.push({
      kind: 'finding_outcome',
      outcome: 'absent',
    });
    expect(verifyCatalogCompiledInstanceIntegrity(horizonChanged)).toMatchObject({
      ok: false,
      error: { code: 'PROJECTION_HORIZON_CONTEXT_MISMATCH' },
    });

    const seedChanged = structuredClone(snapshot);
    seedChanged.patientInstance.seed = 'different-seed';
    expect(verifyCatalogCompiledInstanceIntegrity(seedChanged)).toMatchObject({
      ok: false,
      error: { code: 'PROJECTION_SEED_CONTEXT_MISMATCH' },
    });

    const staleFrozenResult = structuredClone(snapshot);
    const frozen = staleFrozenResult.encounterInstance.resultBindings[0]?.sources[0];
    if (frozen?.kind === 'finding_projection') {
      frozen.resolvedProjectionId = 'resolved-finding-projection.test.stale';
    }
    expect(verifyCatalogCompiledInstanceIntegrity(staleFrozenResult)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });

  it('detects template and frozen-output payload tampering', () => {
    const snapshot = expectSuccess(makeRequest());
    const templateChanged = structuredClone(snapshot);
    templateChanged.template.internalLabel = 'Changed without a content-version bump';
    expect(verifyCatalogCompiledInstanceIntegrity(templateChanged)).toMatchObject({
      ok: false,
      error: { code: 'OPERATIONAL_ADMISSION_CONTEXT_MISMATCH' },
    });

    const outputChanged = structuredClone(snapshot);
    outputChanged.encounterInstance.payloadFingerprint =
      'fingerprint.catalog-instance.encounter-output.fnv1a64.0000000000000000';
    expect(verifyCatalogCompiledInstanceIntegrity(outputChanged)).toMatchObject({
      ok: false,
      error: { code: 'ENCOUNTER_PAYLOAD_FINGERPRINT_MISMATCH' },
    });

    const locationChanged = structuredClone(snapshot);
    locationChanged.location.formularyId = 'formulary.test.changed';
    expect(verifyCatalogCompiledInstanceIntegrity(locationChanged)).toMatchObject({
      ok: false,
      error: { code: 'OPERATIONAL_ADMISSION_CONTEXT_MISMATCH' },
    });

    const compilerChanged = structuredClone(snapshot);
    compilerChanged.compilerVersion = '10.0.0';
    compilerChanged.patientInstance.compilerVersion = '10.0.0';
    compilerChanged.encounterInstance.compilerVersion = '10.0.0';
    expect(verifyCatalogCompiledInstanceIntegrity(compilerChanged)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_COMPILER_VERSION' },
    });

    const nestedFindingCompilerChanged = structuredClone(snapshot);
    nestedFindingCompilerChanged.patientInstance.sharedFindingCompilation.compilerVersion = '9.0.0';
    for (const finding of nestedFindingCompilerChanged.patientInstance.sharedFindingCompilation
      .findings) {
      if (finding.resolution.origin === 'compiled') {
        finding.resolution.resolverVersion = '9.0.0';
      }
    }
    for (const finding of nestedFindingCompilerChanged.patientInstance.patientState
      .canonicalFindings) {
      if (finding.resolution.origin === 'compiled') {
        finding.resolution.resolverVersion = '9.0.0';
      }
    }
    for (const projection of nestedFindingCompilerChanged.patientInstance.sharedFindingCompilation
      .projections) {
      projection.resolution.compilerVersion = '9.0.0';
    }
    expect(verifyCatalogCompiledInstanceIntegrity(nestedFindingCompilerChanged)).toMatchObject({
      ok: false,
      error: { code: 'SHARED_FINDING_INTEGRITY_INVALID' },
    });

    const nestedRubricCompilerChanged = structuredClone(snapshot);
    nestedRubricCompilerChanged.encounterInstance.compiledRubric.compilerVersion = '9.0.0';
    expect(verifyCatalogCompiledInstanceIntegrity(nestedRubricCompilerChanged)).toMatchObject({
      ok: false,
      error: { code: 'RUBRIC_INTEGRITY_INVALID' },
    });

    const richnessChanged = structuredClone(snapshot);
    richnessChanged.presentationRichnessEvaluation.priorEffort.totalEffortUnits = 1;
    expect(verifyCatalogCompiledInstanceIntegrity(richnessChanged)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });

    const richnessVersionChanged = structuredClone(snapshot);
    richnessVersionChanged.presentationRichnessEvaluation.evaluatorVersion = '9.0.0';
    expect(verifyCatalogCompiledInstanceIntegrity(richnessVersionChanged)).toMatchObject({
      ok: false,
      error: { code: 'PRESENTATION_RICHNESS_INTEGRITY_INVALID' },
    });
  });

  it('keeps this attachment boundary point-free and synthetic-only', () => {
    const serialized = JSON.stringify(expectSuccess(makeRequest()));
    for (const forbidden of [
      '"points"',
      '"score"',
      '"payout"',
      '"par"',
      '"probability"',
      '"weight"',
      '"difficultyTier"',
      '"clinicalScore"',
      '"quarantine"',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
