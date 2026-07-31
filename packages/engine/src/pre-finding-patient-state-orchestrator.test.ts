import {
  PreFindingPatientStateOrchestrationArtifactSchema,
  PreFindingPatientStateOrchestrationRequestSchema,
  type ClinicalRuleReview,
  type EncounterCareSetting,
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
  type PreFindingPatientStateOrchestrationRequest,
  type ResolvedConditionSource,
  type ResolvedPatientState,
  type TemplateConditionSelectionRequest,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  bridgeOptionalComorbiditiesFromBudget,
  fingerprintOptionalComorbidityBridgeProfile,
} from './optional-comorbidity-budget-bridge';
import {
  fingerprintOptionalExposureBudgetBridgeProfile,
  fingerprintOptionalExposureReferenceHorizon,
} from './optional-exposure-budget-bridge';
import {
  fingerprintOptionalFeatureModuleDefinition,
  selectOptionalFeaturesWithinBudget,
} from './optional-feature-budget-selector';
import {
  fingerprintOptionalPriorTreatmentBridgeProfile,
  fingerprintOptionalPriorTreatmentReferenceHorizon,
} from './optional-prior-treatment-bridge';
import {
  fingerprintOptionalReactionHistoryBridgeProfile,
  fingerprintOptionalReactionHistoryReferenceHorizon,
} from './optional-reaction-history-bridge';
import {
  orchestratePreFindingPatientState,
  verifyPreFindingPatientStateOrchestrationContext,
  verifyPreFindingPatientStateOrchestrationIntegrity,
} from './pre-finding-patient-state-orchestrator';
import {
  fingerprintTemplateConditionSelectionProfile,
  fingerprintTemplateConditionSelectionTemplate,
  selectTemplateConditions,
} from './template-condition-selector';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-30T16:00:00.000Z',
  sourceUseNoteIds: ['source-use.test.pre-finding-orchestration'],
};

const moduleIds = {
  comorbidity: 'optional-feature.test.orchestration.comorbidity',
  reaction: 'optional-feature.test.orchestration.reaction',
  priorTreatment: 'optional-feature.test.orchestration.prior-treatment',
  exposure: 'optional-feature.test.orchestration.exposure',
  other: 'optional-feature.test.orchestration.other',
} as const;

type ModuleKey = keyof typeof moduleIds;

const moduleKeySlugs: Readonly<Record<ModuleKey, string>> = {
  comorbidity: 'comorbidity',
  reaction: 'reaction',
  priorTreatment: 'prior-treatment',
  exposure: 'exposure',
  other: 'other',
};

const moduleKinds: Readonly<
  Record<
    ModuleKey,
    'allergy_reaction' | 'prior_treatment' | 'comorbidity' | 'substance_use' | 'other'
  >
> = {
  comorbidity: 'comorbidity',
  reaction: 'allergy_reaction',
  priorTreatment: 'prior_treatment',
  exposure: 'substance_use',
  other: 'other',
};

const moduleCosts: Readonly<Record<ModuleKey, number>> = {
  comorbidity: 2,
  reaction: 1,
  priorTreatment: 2,
  exposure: 1,
  other: 3,
};

const requiredCondition = (): PatientTemplateConditionConstraint => ({
  schemaVersion: 1,
  id: 'template-condition.test.orchestration.focus',
  diagnosisDefinitionId: 'diagnosis.test.orchestration.focus',
  diagnosisDefinitionContentVersion: '1.0.0',
  clinicalStateId: 'clinical-state.current',
  timeScopeId: 'time-scope.current',
  encounterRelevance: 'focus',
  severityId: null,
  specifierIds: [],
});

const optionalCondition = (): PatientTemplateConditionConstraint => ({
  schemaVersion: 1,
  id: 'template-condition.test.orchestration.comorbidity',
  diagnosisDefinitionId: 'diagnosis.test.orchestration.comorbidity',
  diagnosisDefinitionContentVersion: '1.0.0',
  clinicalStateId: 'clinical-state.current',
  timeScopeId: 'time-scope.current',
  encounterRelevance: 'contributing',
  severityId: null,
  specifierIds: [],
});

const moduleDefinition = (key: ModuleKey): PatientOptionalFeatureModuleDefinition => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: moduleIds[key],
  label: `Synthetic ${moduleKinds[key]}`,
  moduleKind: moduleKinds[key],
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
  review: approvedReview,
});

interface TemplateOptions {
  readonly modules: readonly ModuleKey[];
  readonly careSetting: EncounterCareSetting;
  readonly budget: number;
  readonly maximumSelectedModules: number;
  readonly internalLabel: string;
}

const makeTemplate = (options: TemplateOptions): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-template.test.pre-finding-orchestration',
  compilationMode: 'attachment_only.v6',
  careSetting: options.careSetting,
  internalLabel: options.internalLabel,
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
  optionalConditionSelectionGroups: options.modules.includes('comorbidity')
    ? [
        {
          schemaVersion: 1,
          id: 'template-condition-group.test.orchestration.comorbidity',
          minimumSelections: 0,
          maximumSelections: 1,
          candidates: [optionalCondition()],
        },
      ]
    : [],
  complexityProfile: {
    modelVersion: 'additional-feature-budget.v1',
    measurementStatus: 'budget_only',
    additionalFeatureBudget: options.budget,
    maximumSelectedModules: options.maximumSelectedModules,
    selectedModules: [],
    targetEnvelope: null,
  },
  presentationRichnessEnvelope: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'presentation-richness.test.pre-finding-orchestration',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: [
      'diagnostic_attribution',
      'prior_response_or_intolerance',
      'comorbidity_fit',
    ],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

interface ScenarioOptions {
  readonly modules?: readonly ModuleKey[];
  readonly selected?: readonly ModuleKey[];
  readonly careSetting?: EncounterCareSetting;
  readonly budget?: number;
  readonly maximumSelectedModules?: number;
  readonly fixedSeed?: string;
  readonly seedPrefix?: string;
  readonly literalConditionConflict?: boolean;
  readonly internalLabel?: string;
  readonly optionalProfileContentVersion?: string;
  readonly reactionHorizonContentVersion?: string;
  readonly coreAgeYears?: number;
}

const makeOptionalFeatureRequest = (
  options: Required<
    Pick<
      ScenarioOptions,
      | 'modules'
      | 'selected'
      | 'careSetting'
      | 'budget'
      | 'maximumSelectedModules'
      | 'internalLabel'
      | 'optionalProfileContentVersion'
    >
  >,
  seed: string,
): OptionalFeatureBudgetSelectionRequest => {
  const template = makeTemplate(options);
  const definitions = options.modules.map(moduleDefinition);
  return {
    schemaVersion: 1,
    id: 'optional-feature-budget-request.test.pre-finding-orchestration',
    template,
    moduleDefinitions: definitions,
    profile: {
      schemaVersion: 1,
      contentVersion: options.optionalProfileContentVersion,
      id: 'optional-feature-profile.test.pre-finding-orchestration',
      modelVersion: 'weighted-optional-feature-budget-selection.v1',
      templateRef: { id: template.id, contentVersion: template.contentVersion },
      templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
      countWeights: Array.from(
        { length: template.complexityProfile.maximumSelectedModules + 1 },
        (_, selectionCount) => ({
          schemaVersion: 1 as const,
          selectionCount,
          gameSelectionWeight: selectionCount === options.selected.length ? 10_000 : 1,
        }),
      ),
      candidateBindings: definitions.map((definition, index) => {
        const key = options.modules[index]!;
        const keySlug = moduleKeySlugs[key];
        return {
          schemaVersion: 1,
          id: `optional-feature-binding.test.orchestration.${keySlug}`,
          moduleRef: {
            id: definition.id,
            contentVersion: definition.contentVersion,
          },
          moduleFingerprint: fingerprintOptionalFeatureModuleDefinition(definition),
          selectedModuleId: `patient-optional-feature.test.orchestration.${keySlug}`,
          cost: moduleCosts[key],
          impact:
            key === 'other'
              ? ('background' as const)
              : key === 'comorbidity'
                ? ('fit_modifier' as const)
                : ('companion_safety' as const),
          complexityContributions: [
            {
              id: `complexity-contribution.test.orchestration.${keySlug}`,
              label: `Synthetic ${key} contribution`,
              dimension:
                key === 'comorbidity'
                  ? ('diagnostic' as const)
                  : key === 'reaction'
                    ? ('pharmacologic' as const)
                    : key === 'priorTreatment'
                      ? ('information' as const)
                      : ('workup' as const),
              weight: 1,
              review: approvedReview,
            },
          ],
          gameSelectionWeight: options.selected.includes(key) ? 10_000 : index + 1,
          review: approvedReview,
        };
      }),
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

const findOptionalFeatureFixture = (
  options: Required<
    Pick<
      ScenarioOptions,
      | 'modules'
      | 'selected'
      | 'careSetting'
      | 'budget'
      | 'maximumSelectedModules'
      | 'internalLabel'
      | 'optionalProfileContentVersion'
    >
  > &
    Pick<ScenarioOptions, 'fixedSeed' | 'seedPrefix'>,
): {
  readonly request: OptionalFeatureBudgetSelectionRequest;
  readonly artifact: OptionalFeatureBudgetSelectionArtifact;
} => {
  const expected = options.selected
    .map((key) => moduleIds[key])
    .sort()
    .join('\u0000');
  const trySeed = (seed: string) => {
    const request = makeOptionalFeatureRequest(options, seed);
    const result = selectOptionalFeaturesWithinBudget(request);
    return result.ok && selectedDefinitionIds(result.value).join('\u0000') === expected
      ? { request, artifact: result.value }
      : null;
  };
  if (options.fixedSeed) {
    const match = trySeed(options.fixedSeed);
    if (match) return match;
    throw new Error(`Fixed seed ${options.fixedSeed} did not select ${expected}.`);
  }
  for (let index = 0; index < 128; index += 1) {
    const match = trySeed(
      `${options.seedPrefix ?? 'seed.pre-finding-orchestration'}.${expected || 'none'}.${index}`,
    );
    if (match) return match;
  }
  throw new Error(
    `Could not construct a deterministic D-201 fixture for ${expected || 'zero selection'}.`,
  );
};

const makeConditionRequest = (
  template: PatientTemplate,
  seed: string,
  literalConditionConflict: boolean,
): TemplateConditionSelectionRequest => ({
  schemaVersion: 1,
  id: 'condition-selection-request.test.pre-finding-orchestration',
  template,
  profile: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'condition-profile.test.pre-finding-orchestration',
    modelVersion: 'weighted-template-condition-selection.v1',
    templateRef: { id: template.id, contentVersion: template.contentVersion },
    templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
    groupProfiles: template.optionalConditionSelectionGroups.map((group) => ({
      schemaVersion: 1,
      id: `condition-profile-group.test.${group.id}`,
      groupId: group.id,
      countWeights: [0, 1].map((selectionCount) => ({
        schemaVersion: 1 as const,
        selectionCount,
        gameSelectionWeight: 1,
      })),
      candidateWeights: group.candidates.map((candidate) => ({
        schemaVersion: 1,
        templateConditionId: candidate.id,
        gameSelectionWeight: 1,
      })),
    })),
    incompatibilities: literalConditionConflict
      ? [
          {
            schemaVersion: 1,
            id: 'condition-incompatibility.test.orchestration.literal',
            leftTemplateConditionId: optionalCondition().id,
            rightTemplateConditionId: requiredCondition().id,
            reason: 'Synthetic literal conflict retained for audit.',
            review: approvedReview,
          },
        ]
      : [],
  },
  seed,
});

const makeComorbidityProfile = (
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
  conditionRequest: TemplateConditionSelectionRequest,
): OptionalComorbidityBridgeProfile => {
  const binding = optionalArtifact.selectionRequest.profile.candidateBindings.find(
    (candidate) => candidate.moduleRef.id === moduleIds.comorbidity,
  );
  if (!binding) throw new Error('Missing comorbidity binding.');
  const profile: OptionalComorbidityBridgeProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-comorbidity-profile.test.pre-finding-orchestration',
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
        id: 'optional-comorbidity-mapping.test.pre-finding-orchestration',
        moduleRef: binding.moduleRef,
        moduleFingerprint: binding.moduleFingerprint,
        optionalFeatureBindingId: binding.id,
        selectedModuleId: binding.selectedModuleId,
        groupId: 'template-condition-group.test.orchestration.comorbidity',
        templateConditionId: optionalCondition().id,
        review: approvedReview,
      },
    ],
    review: approvedReview,
  };
  expect(fingerprintOptionalComorbidityBridgeProfile(profile)).toMatch(
    /^fingerprint\.optional-comorbidity-bridge\./,
  );
  return profile;
};

const reactionHistory = (): PatientReactionHistory => ({
  status: 'entries_present',
  medicationAssessmentStatus: 'entries_present',
  records: [
    {
      schemaVersion: 1,
      id: 'patient-reaction.test.orchestration.haloperidol',
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

const makeReactionInput = (
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
  contentVersion: string,
): NonNullable<PreFindingPatientStateOrchestrationRequest['reactionHistoryBridgeInput']> => {
  const referenceHorizon: OptionalReactionHistoryReferenceHorizon = {
    schemaVersion: 1,
    contentVersion,
    id: 'reaction-horizon.test.pre-finding-orchestration',
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
  );
  if (!binding) throw new Error('Missing reaction binding.');
  const bridgeProfile: OptionalReactionHistoryBridgeProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-reaction-profile.test.pre-finding-orchestration',
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
        id: 'optional-reaction-mapping.test.pre-finding-orchestration',
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
  return {
    schemaVersion: 1,
    id: 'optional-reaction-request.test.pre-finding-orchestration',
    referenceHorizon,
    bridgeProfile,
  };
};

const priorTreatmentContribution = (): OptionalPriorTreatmentContribution => ({
  medicationTrials: [
    {
      schemaVersion: 1,
      id: 'medication-trial.test.orchestration.sertraline',
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
      summary: 'A synthetic prior sertraline trial.',
    },
  ],
  psychotherapyTrials: [],
  currentProviders: [],
  priorLevelsOfCare: [],
});

const makePriorTreatmentInput = (
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
): NonNullable<PreFindingPatientStateOrchestrationRequest['priorTreatmentBridgeInput']> => {
  const referenceHorizon: OptionalPriorTreatmentReferenceHorizon = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'prior-treatment-horizon.test.pre-finding-orchestration',
    medicationRefs: [{ id: 'medication.test.sertraline', contentVersion: '1.0.0' }],
    psychotherapyInterventionRefs: [],
  };
  const binding = optionalArtifact.selectionRequest.profile.candidateBindings.find(
    (candidate) => candidate.moduleRef.id === moduleIds.priorTreatment,
  );
  if (!binding) throw new Error('Missing prior-treatment binding.');
  const bridgeProfile: OptionalPriorTreatmentBridgeProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-prior-treatment-profile.test.pre-finding-orchestration',
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
        id: 'optional-prior-treatment-mapping.test.pre-finding-orchestration',
        moduleRef: binding.moduleRef,
        moduleFingerprint: binding.moduleFingerprint,
        optionalFeatureBindingId: binding.id,
        selectedModuleId: binding.selectedModuleId,
        contribution: priorTreatmentContribution(),
        review: approvedReview,
      },
    ],
    review: approvedReview,
  };
  expect(fingerprintOptionalPriorTreatmentBridgeProfile(bridgeProfile)).toMatch(
    /^fingerprint\.optional-prior-treatment-bridge\./,
  );
  return {
    schemaVersion: 1,
    id: 'optional-prior-treatment-request.test.pre-finding-orchestration',
    referenceHorizon,
    bridgeProfile,
  };
};

const exposureContribution = (): OptionalExposureContribution => ({
  useEntrySpecifications: [
    {
      schemaVersion: 1,
      id: 'exposure-use-entry.test.orchestration.alcohol',
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

const makeExposureInput = (
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
): NonNullable<PreFindingPatientStateOrchestrationRequest['exposureBridgeInput']> => {
  const contribution = exposureContribution();
  const referenceHorizon: OptionalExposureReferenceHorizon = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'exposure-horizon.test.pre-finding-orchestration',
    agentRefs: [contribution.useEntrySpecifications[0]!.agent],
  };
  const binding = optionalArtifact.selectionRequest.profile.candidateBindings.find(
    (candidate) => candidate.moduleRef.id === moduleIds.exposure,
  );
  if (!binding) throw new Error('Missing exposure binding.');
  const bridgeProfile: OptionalExposureBudgetBridgeProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-exposure-profile.test.pre-finding-orchestration',
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
        id: 'optional-exposure-mapping.test.pre-finding-orchestration',
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
  return {
    schemaVersion: 1,
    id: 'optional-exposure-request.test.pre-finding-orchestration',
    referenceHorizon,
    bridgeProfile,
  };
};

const deriveConditionSource = (
  requestId: string,
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
  conditionRequest: TemplateConditionSelectionRequest,
  bridgeProfile: OptionalComorbidityBridgeProfile | null,
): ResolvedConditionSource => {
  if (bridgeProfile !== null) {
    const result = bridgeOptionalComorbiditiesFromBudget({
      schemaVersion: 1,
      id: `${requestId}.optional-comorbidity-bridge`,
      optionalFeatureArtifact: optionalArtifact,
      conditionSelectionRequest: conditionRequest,
      bridgeProfile,
    });
    if (!result.ok && 'error' in result) throw new Error(result.error.message);
    return {
      schemaVersion: 1,
      sourceKind: 'optional_comorbidity_bridge',
      artifact: result.ok ? result.value : result.conflict.artifact,
    };
  }
  const result = selectTemplateConditions(conditionRequest);
  if (!result.ok && 'error' in result) throw new Error(result.error.message);
  return {
    schemaVersion: 1,
    sourceKind: 'template_condition_selection',
    artifact: result.ok ? result.value : result.conflict.artifact,
  };
};

const makeCoreState = (
  conditionSource: ResolvedConditionSource,
  ageYears: number,
): ResolvedPatientState => {
  const requiredStateIds = new Set(
    conditionSource.artifact.conditionBindings
      .filter((binding) => binding.kind === 'required')
      .map((binding) => binding.conditionStateId),
  );
  return {
    schemaVersion: 1,
    id: 'resolved-patient-state.test.pre-finding-orchestration.core',
    demographics: {
      recordVersion: 2,
      ageYears,
      reviewedAgeBandId: 'age-band.middle-adult',
      sexForReference: 'female',
    },
    conditionStates: conditionSource.artifact.conditionStates.filter((state) =>
      requiredStateIds.has(state.id),
    ),
    diagnosisRecordEntries: [],
    medicationRegimenEntries: [],
    exposureInventory: {
      schemaVersion: 1,
      id: 'resolved-exposure-inventory.test.pre-finding-orchestration.core',
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
      id: 'resolved-proposition-state.test.pre-finding-orchestration.core',
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    clinicalTagIds: ['clinical-tag.test.two', 'clinical-tag.test.one'],
    reportedSafetyPlanningAbility: 'unassessed',
  };
};

const makeScenario = (
  partial: ScenarioOptions = {},
): {
  readonly request: PreFindingPatientStateOrchestrationRequest;
  readonly optionalArtifact: OptionalFeatureBudgetSelectionArtifact;
} => {
  const modules = partial.modules ?? [];
  const selected = partial.selected ?? [];
  const maximumSelectedModules = partial.maximumSelectedModules ?? Math.min(3, modules.length);
  const budget = partial.budget ?? (modules.length === 0 ? 0 : 5);
  const fixture = findOptionalFeatureFixture({
    modules,
    selected,
    careSetting: partial.careSetting ?? 'outpatient_psychiatry',
    budget,
    maximumSelectedModules,
    internalLabel: partial.internalLabel ?? 'Synthetic pre-finding orchestration fixture',
    optionalProfileContentVersion: partial.optionalProfileContentVersion ?? '1.0.0',
    fixedSeed: partial.fixedSeed,
    seedPrefix: partial.seedPrefix,
  });
  const requestId = 'pre-finding-request.test.synthetic';
  const conditionRequest = makeConditionRequest(
    fixture.request.template,
    fixture.request.seed,
    partial.literalConditionConflict ?? false,
  );
  const bridgeProfile = modules.includes('comorbidity')
    ? makeComorbidityProfile(fixture.artifact, conditionRequest)
    : null;
  const conditionSource = deriveConditionSource(
    requestId,
    fixture.artifact,
    conditionRequest,
    bridgeProfile,
  );
  return {
    optionalArtifact: fixture.artifact,
    request: {
      schemaVersion: 1,
      id: requestId,
      optionalFeatureSelectionRequest: fixture.request,
      conditionSourcePlan:
        bridgeProfile === null
          ? {
              sourceKind: 'template_condition_selection',
              conditionSelectionRequest: conditionRequest,
            }
          : {
              sourceKind: 'optional_comorbidity_bridge',
              conditionSelectionRequest: conditionRequest,
              bridgeProfile,
            },
      corePatientState: makeCoreState(conditionSource, partial.coreAgeYears ?? 46),
      reactionHistoryOwnership: modules.includes('reaction')
        ? 'optional_alternative_default'
        : 'core_locked',
      reactionHistoryBridgeInput: modules.includes('reaction')
        ? makeReactionInput(fixture.artifact, partial.reactionHorizonContentVersion ?? '1.0.0')
        : null,
      priorTreatmentBridgeInput: modules.includes('priorTreatment')
        ? makePriorTreatmentInput(fixture.artifact)
        : null,
      exposureBridgeInput: modules.includes('exposure')
        ? makeExposureInput(fixture.artifact)
        : null,
    },
  };
};

const expectOrchestration = (request: unknown) => {
  const result = orchestratePreFindingPatientState(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const expectInvalidRequest = (request: unknown): void => {
  const result = orchestratePreFindingPatientState(request);
  expect(result).toMatchObject({
    ok: false,
    error: { code: 'INVALID_REQUEST' },
  });
};

describe('pre-finding patient-state orchestrator', () => {
  it('uses required-only D-196 after one zero-cost D-201 selection pass', () => {
    const { request } = makeScenario();
    expect(PreFindingPatientStateOrchestrationRequestSchema.parse(request)).toEqual(request);
    const artifact = expectOrchestration(request);

    expect(PreFindingPatientStateOrchestrationArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.status).toBe('composed');
    expect(artifact.optionalFeatureArtifact.selectedCount).toBe(0);
    expect(artifact.optionalFeatureArtifact.totalSpent).toBe(0);
    expect(artifact.conditionSource.sourceKind).toBe('template_condition_selection');
    expect(artifact.conditionSource.artifact.conditionStates).toHaveLength(1);
    expect(artifact.reactionHistoryBridgeArtifact).toBeNull();
    expect(artifact.priorTreatmentBridgeArtifact).toBeNull();
    expect(artifact.exposureBridgeArtifact).toBeNull();
    expect(
      artifact.patientStateCompositionArtifact.composedPatientState?.conditionStates,
    ).toHaveLength(1);
  });

  it('keeps a present but unselected comorbidity candidate on the D-202 source path', () => {
    const { request } = makeScenario({
      modules: ['comorbidity'],
      selected: [],
    });
    const artifact = expectOrchestration(request);

    expect(artifact.conditionSource.sourceKind).toBe('optional_comorbidity_bridge');
    if (artifact.conditionSource.sourceKind !== 'optional_comorbidity_bridge') {
      throw new Error('Expected D-202.');
    }
    expect(artifact.conditionSource.artifact.selectedComorbidityModuleDefinitionIds).toEqual([]);
    expect(artifact.conditionSource.artifact.conditionStates).toHaveLength(1);
    expect(artifact.conditionSource.artifact.conditionBindings).toHaveLength(1);
    expect(artifact.optionalFeatureArtifact.totalSpent).toBe(0);
  });

  it('retains complete null-materialization audits for unselected typed lanes', () => {
    const { request } = makeScenario({
      modules: ['reaction', 'priorTreatment', 'exposure'],
      selected: [],
    });
    const artifact = expectOrchestration(request);

    expect(artifact.reactionHistoryBridgeArtifact).toMatchObject({
      materializedReactionHistory: null,
      materializedReactionRecordIds: [],
      selectedReactionModuleDefinitionId: null,
    });
    expect(artifact.priorTreatmentBridgeArtifact).toMatchObject({
      materializedTreatmentHistoryContribution: null,
      selectedPriorTreatmentModuleDefinitionIds: [],
      materializedRecordIds: {
        medicationTrialIds: [],
        psychotherapyTrialIds: [],
        currentProviderIds: [],
        priorLevelOfCareIds: [],
      },
    });
    expect(artifact.exposureBridgeArtifact).toMatchObject({
      materializedExposureContribution: null,
      materializedUseEntryIds: [],
      selectedExposureModuleDefinitionIds: [],
    });
    expect(artifact.patientStateCompositionArtifact.status).toBe('composed');
    expect(artifact.patientStateCompositionArtifact.selectedModuleAudits).toEqual([]);
  });

  it('preserves one exact D-201 accounting artifact through a mixed typed pool', () => {
    const { request } = makeScenario({
      modules: ['comorbidity', 'reaction', 'priorTreatment', 'exposure'],
      selected: ['comorbidity', 'priorTreatment', 'exposure'],
      budget: 5,
      maximumSelectedModules: 3,
    });
    const artifact = expectOrchestration(request);
    const d201 = artifact.optionalFeatureArtifact;

    expect(d201.selectedCount).toBe(3);
    expect(d201.totalSpent).toBe(5);
    expect(d201.remainingBudget).toBe(0);
    expect(artifact.conditionSource.sourceKind).toBe('optional_comorbidity_bridge');
    if (artifact.conditionSource.sourceKind !== 'optional_comorbidity_bridge') {
      throw new Error('Expected D-202.');
    }
    for (const nested of [
      artifact.conditionSource.artifact.bridgeRequest.optionalFeatureArtifact,
      artifact.reactionHistoryBridgeArtifact?.bridgeRequest.optionalFeatureArtifact,
      artifact.priorTreatmentBridgeArtifact?.bridgeRequest.optionalFeatureArtifact,
      artifact.exposureBridgeArtifact?.bridgeRequest.optionalFeatureArtifact,
      artifact.patientStateCompositionArtifact.compositionRequest.optionalFeatureArtifact,
    ]) {
      expect(nested).toEqual(d201);
    }
    expect(
      artifact.patientStateCompositionArtifact.selectedModuleAudits.reduce(
        (total, audit) => total + audit.cost,
        0,
      ),
    ).toBe(d201.totalSpent);
    expect(
      artifact.patientStateCompositionArtifact.selectedModuleAudits.map(
        (audit) => audit.selectionOrdinal,
      ),
    ).toEqual([0, 1, 2]);
  });

  it('retains a D-202 literal conflict as audited not-composed state without reroll or refund', () => {
    const { request } = makeScenario({
      modules: ['comorbidity'],
      selected: ['comorbidity'],
      literalConditionConflict: true,
    });
    const artifact = expectOrchestration(request);

    expect(artifact.status).toBe('not_composed');
    expect(artifact.conditionSource.sourceKind).toBe('optional_comorbidity_bridge');
    if (artifact.conditionSource.sourceKind !== 'optional_comorbidity_bridge') {
      throw new Error('Expected D-202.');
    }
    expect(artifact.conditionSource.artifact.status).toBe('literal_condition_incompatibility');
    expect(artifact.conditionSource.artifact.conflicts).toHaveLength(1);
    expect(artifact.optionalFeatureArtifact.selectedCount).toBe(1);
    expect(artifact.optionalFeatureArtifact.totalSpent).toBe(2);
    expect(artifact.optionalFeatureArtifact.remainingBudget).toBe(3);
    expect(artifact.patientStateCompositionArtifact.composedPatientState).toBeNull();
    expect(artifact.patientStateCompositionArtifact.blockers).toEqual([
      {
        kind: 'literal_condition_incompatibility',
        conflictIds: ['condition-incompatibility.test.orchestration.literal'],
      },
    ]);
  });

  it('keeps a selected unsupported other module charged and audited as not composed', () => {
    const { request } = makeScenario({
      modules: ['other'],
      selected: ['other'],
    });
    const artifact = expectOrchestration(request);

    expect(artifact.status).toBe('not_composed');
    expect(artifact.optionalFeatureArtifact.totalSpent).toBe(3);
    expect(artifact.optionalFeatureArtifact.remainingBudget).toBe(2);
    expect(artifact.patientStateCompositionArtifact.composedPatientState).toBeNull();
    expect(artifact.patientStateCompositionArtifact.coverageDiagnostics).toEqual([
      {
        schemaVersion: 1,
        code: 'unsupported_selected_other',
        moduleDefinitionId: moduleIds.other,
        selected: true,
        blocking: true,
      },
    ]);
    expect(artifact.patientStateCompositionArtifact.selectedModuleAudits[0]).toMatchObject({
      moduleKind: 'other',
      ownerKind: 'unowned_other',
      materializationStatus: 'unsupported',
      cost: 3,
    });
  });

  it('rejects missing or unexpected typed lane inputs', () => {
    const requiredOnly = makeScenario().request;
    const reaction = makeScenario({
      modules: ['reaction'],
      selected: [],
    }).request;
    const prior = makeScenario({
      modules: ['priorTreatment'],
      selected: [],
    }).request;
    const exposure = makeScenario({
      modules: ['exposure'],
      selected: [],
    }).request;

    const invalidRequests: unknown[] = [];
    const missingReaction = structuredClone(reaction);
    missingReaction.reactionHistoryBridgeInput = null;
    invalidRequests.push(missingReaction);
    const unexpectedReaction = structuredClone(requiredOnly);
    unexpectedReaction.reactionHistoryBridgeInput = reaction.reactionHistoryBridgeInput;
    invalidRequests.push(unexpectedReaction);

    const missingPrior = structuredClone(prior);
    missingPrior.priorTreatmentBridgeInput = null;
    invalidRequests.push(missingPrior);
    const unexpectedPrior = structuredClone(requiredOnly);
    unexpectedPrior.priorTreatmentBridgeInput = prior.priorTreatmentBridgeInput;
    invalidRequests.push(unexpectedPrior);

    const missingExposure = structuredClone(exposure);
    missingExposure.exposureBridgeInput = null;
    invalidRequests.push(missingExposure);
    const unexpectedExposure = structuredClone(requiredOnly);
    unexpectedExposure.exposureBridgeInput = exposure.exposureBridgeInput;
    invalidRequests.push(unexpectedExposure);

    invalidRequests.forEach(expectInvalidRequest);
  });

  it('requires explicit reaction-history ownership to agree with the D-201 lane horizon', () => {
    const withReaction = makeScenario({
      modules: ['reaction'],
      selected: [],
    }).request;
    withReaction.reactionHistoryOwnership = 'core_locked';
    expectInvalidRequest(withReaction);

    const withoutReaction = makeScenario().request;
    withoutReaction.reactionHistoryOwnership = 'optional_alternative_default';
    expectInvalidRequest(withoutReaction);
  });

  it('rejects an already-populated or non-budget-only template complexity envelope', () => {
    const selectedScenario = makeScenario({
      modules: ['priorTreatment'],
      selected: ['priorTreatment'],
    });
    const populated = structuredClone(selectedScenario.request);
    populated.optionalFeatureSelectionRequest.template.complexityProfile =
      selectedScenario.optionalArtifact.resultingComplexityProfile;
    populated.conditionSourcePlan.conditionSelectionRequest.template.complexityProfile =
      selectedScenario.optionalArtifact.resultingComplexityProfile;
    expectInvalidRequest(populated);

    const measured = makeScenario().request;
    const authoredEnvelope = {
      diagnostic: { min: 0, max: 1 },
      pharmacologic: { min: 0, max: 1 },
      workup: { min: 0, max: 1 },
      safety_disposition: { min: 0, max: 1 },
      information: { min: 0, max: 1 },
    };
    measured.optionalFeatureSelectionRequest.template.complexityProfile.measurementStatus =
      'authored_envelope';
    measured.optionalFeatureSelectionRequest.template.complexityProfile.targetEnvelope =
      authoredEnvelope;
    measured.conditionSourcePlan.conditionSelectionRequest.template.complexityProfile.measurementStatus =
      'authored_envelope';
    measured.conditionSourcePlan.conditionSelectionRequest.template.complexityProfile.targetEnvelope =
      authoredEnvelope;
    expectInvalidRequest(measured);
  });

  it('rejects same-ID crossed template, seed, profile, horizon, and core contexts', () => {
    const base = makeScenario({
      modules: ['reaction'],
      selected: [],
    });
    const artifact = expectOrchestration(base.request);
    const sameIdD196Profile = structuredClone(base.request);
    sameIdD196Profile.conditionSourcePlan.conditionSelectionRequest.profile.contentVersion =
      '1.0.1';
    const alternatives = [
      makeScenario({
        modules: ['reaction'],
        selected: [],
        seedPrefix: 'seed.pre-finding-orchestration.crossed',
      }).request,
      makeScenario({
        modules: ['reaction'],
        selected: [],
        internalLabel: 'Same identity with a crossed template payload',
      }).request,
      makeScenario({
        modules: ['reaction'],
        selected: [],
        optionalProfileContentVersion: '1.0.1',
      }).request,
      makeScenario({
        modules: ['reaction'],
        selected: [],
        reactionHorizonContentVersion: '1.0.1',
      }).request,
      makeScenario({
        modules: ['reaction'],
        selected: [],
        coreAgeYears: 47,
      }).request,
      sameIdD196Profile,
    ];

    for (const alternative of alternatives) {
      expect(orchestratePreFindingPatientState(alternative).ok).toBe(true);
      expect(
        verifyPreFindingPatientStateOrchestrationContext({
          artifact,
          request: alternative,
        }),
      ).toMatchObject({
        ok: false,
        error: { code: 'CONTEXT_MISMATCH' },
      });
    }

    const crossedD196 = makeScenario().request;
    crossedD196.conditionSourcePlan.conditionSelectionRequest.seed = 'seed.crossed.d196.same-id';
    expectInvalidRequest(crossedD196);

    const crossedD196Template = makeScenario().request;
    crossedD196Template.conditionSourcePlan.conditionSelectionRequest.template = structuredClone(
      crossedD196Template.conditionSourcePlan.conditionSelectionRequest.template,
    );
    crossedD196Template.conditionSourcePlan.conditionSelectionRequest.template.careSetting =
      'emergency_department';
    crossedD196Template.conditionSourcePlan.conditionSelectionRequest.profile.templateFingerprint =
      fingerprintTemplateConditionSelectionTemplate(
        crossedD196Template.conditionSourcePlan.conditionSelectionRequest.template,
      );
    expectInvalidRequest(crossedD196Template);
  });

  it('is deterministic, order-invariant, replayable, and does not mutate caller input', () => {
    const { request } = makeScenario({
      modules: ['comorbidity', 'reaction', 'priorTreatment', 'exposure'],
      selected: ['comorbidity', 'priorTreatment', 'exposure'],
      budget: 5,
      maximumSelectedModules: 3,
    });
    const before = JSON.stringify(request);
    const first = expectOrchestration(request);
    expect(JSON.stringify(request)).toBe(before);
    expect(expectOrchestration(structuredClone(request))).toEqual(first);

    const reordered = structuredClone(request);
    reordered.optionalFeatureSelectionRequest.moduleDefinitions.reverse();
    reordered.optionalFeatureSelectionRequest.profile.candidateBindings.reverse();
    reordered.optionalFeatureSelectionRequest.profile.countWeights.reverse();
    reordered.corePatientState.clinicalTagIds.reverse();
    if (reordered.conditionSourcePlan.sourceKind === 'optional_comorbidity_bridge') {
      reordered.conditionSourcePlan.bridgeProfile.mappings.reverse();
    }
    expect(expectOrchestration(reordered)).toEqual(first);
    expect(verifyPreFindingPatientStateOrchestrationIntegrity(first)).toEqual({
      ok: true,
      value: first,
    });
    expect(
      verifyPreFindingPatientStateOrchestrationContext({
        artifact: first,
        request,
      }),
    ).toEqual({
      ok: true,
      value: first,
    });
  });

  it('rejects root, nested, and deterministic D-202/D-208 identity tampering', () => {
    const { request } = makeScenario({
      modules: ['comorbidity'],
      selected: ['comorbidity'],
    });
    const artifact = expectOrchestration(request);

    const rootTamper = structuredClone(artifact);
    rootTamper.payloadFingerprint =
      'fingerprint.pre-finding-patient-state-orchestration.output.fnv1a64.0000000000000000';
    expect(verifyPreFindingPatientStateOrchestrationIntegrity(rootTamper).ok).toBe(false);

    const nestedTamper = structuredClone(artifact);
    nestedTamper.optionalFeatureArtifact.totalSpent += 1;
    expect(verifyPreFindingPatientStateOrchestrationIntegrity(nestedTamper).ok).toBe(false);

    const wrongD202 = structuredClone(artifact);
    if (wrongD202.conditionSource.sourceKind !== 'optional_comorbidity_bridge') {
      throw new Error('Expected D-202.');
    }
    wrongD202.conditionSource.artifact.requestId = 'wrong.d202.request';
    wrongD202.conditionSource.artifact.bridgeRequest.id = 'wrong.d202.request';
    expect(verifyPreFindingPatientStateOrchestrationIntegrity(wrongD202).ok).toBe(false);

    const wrongD208 = structuredClone(artifact);
    wrongD208.patientStateCompositionArtifact.requestId = 'wrong.d208.request';
    wrongD208.patientStateCompositionArtifact.compositionRequest.id = 'wrong.d208.request';
    expect(verifyPreFindingPatientStateOrchestrationIntegrity(wrongD208).ok).toBe(false);
  });

  it('strictly rejects added runtime, point, probability, or second-complexity authority', () => {
    const request = makeScenario().request;
    for (const [field, value] of [
      ['runtimeCapabilityGrant', 'capability.test.forbidden'],
      ['pointValue', 20],
      ['probability', 0.5],
      ['additionalComplexityCharge', 1],
    ] as const) {
      expectInvalidRequest({
        ...structuredClone(request),
        [field]: value,
      });
    }
  });

  it('uses one selection and accounting algorithm in all four care settings', () => {
    const outpatient = makeScenario({
      modules: ['comorbidity', 'reaction', 'priorTreatment', 'exposure'],
      selected: ['comorbidity', 'priorTreatment', 'exposure'],
      budget: 5,
      maximumSelectedModules: 3,
      careSetting: 'outpatient_psychiatry',
    });
    const fixedSeed = outpatient.request.optionalFeatureSelectionRequest.seed;
    const settings: EncounterCareSetting[] = [
      'outpatient_psychiatry',
      'emergency_department',
      'inpatient_psychiatry',
      'consultation_liaison',
    ];
    const projections = settings.map((careSetting) => {
      const { request } = makeScenario({
        modules: ['comorbidity', 'reaction', 'priorTreatment', 'exposure'],
        selected: ['comorbidity', 'priorTreatment', 'exposure'],
        budget: 5,
        maximumSelectedModules: 3,
        careSetting,
        fixedSeed,
      });
      const artifact = expectOrchestration(request);
      return {
        careSetting: artifact.optionalFeatureArtifact.selectionRequest.template.careSetting,
        selected: selectedDefinitionIds(artifact.optionalFeatureArtifact),
        totalSpent: artifact.optionalFeatureArtifact.totalSpent,
        remainingBudget: artifact.optionalFeatureArtifact.remainingBudget,
        selectionOrdinals: artifact.patientStateCompositionArtifact.selectedModuleAudits.map(
          (audit) => audit.selectionOrdinal,
        ),
        costs: artifact.patientStateCompositionArtifact.selectedModuleAudits
          .map((audit) => audit.cost)
          .sort((left, right) => left - right),
        status: artifact.status,
      };
    });
    const baseline = projections[0]!;
    expect(projections.map((projection) => projection.careSetting)).toEqual(settings);
    for (const projection of projections) {
      expect({
        ...projection,
        careSetting: baseline.careSetting,
      }).toEqual(baseline);
    }
  });
});
