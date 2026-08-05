import {
  BackgroundFindingOutcomeProfileCatalogSchema,
  BodyMassIndexDerivationDefinitionSchema,
  CategoricalObservationDefinitionSchema,
  ClinicalDurationProfileCatalogSchema,
  ConditionFindingProfileCatalogSchema,
  DecisionBalanceCatalogSchema,
  DecisionPolicyCatalogSchema,
  DiagnosisDefinitionSchema,
  type ClinicalDurationProfile,
  type ConditionClinicalDurationAttachmentArtifact,
  type ConditionClinicalDurationSourceValidationArtifact,
  type ConditionFunctionalImpairmentProfile,
  type ConditionFunctionalImpairmentSourceValidationArtifact,
  MeasurementDefinitionSchema,
  MedicationRegimenKnowledgeCatalogSchema,
  PatientOwnedMeasurementValueProfileSchema,
  PatientSceneSourceDefinitionCatalogSchema,
  FindingPipelineAuditArtifactSchema,
  FindingPipelineAuditRequestSchema,
  FacilityMoveWaitingSlotMigrationArtifactSchema,
  EmptyAuthorizedPatientSlotFillArtifactSchema,
  FindingProjectionCatalogSchema,
  FindingProjectionHorizonCatalogSchema,
  GeneratedCategoricalObservationValueProfileSchema,
  GeneratedMeasurementValueProfileSchema,
  GeneratedCompletedEncounterAttemptPersistenceRecordSchema,
  GeneratedCompletedEncounterAttemptSchema,
  GeneratedEncounterSettlementInputSchema,
  GeneratedWaitingSlotLauncherPresentationAttachmentArtifactSchema,
  LocationPatientSlotOccupancySnapshotArtifactSchema,
  PatientLauncherPresentationCatalogSchema,
  PatientClinicalResultResourceSetSchema,
  PatientSlotLifecycleTransitionArtifactSchema,
  PatientSlotRefillReconciliationArtifactSchema,
  PatientSlotFillSeedAuthorityArtifactSchema,
  PatientTemplateClinicalResultAttachmentOrchestrationArtifactSchema,
  PatientTemplateClinicalResultFindingPipelineOrchestrationArtifactSchema,
  PatientTemplateClinicalResultMaterializationArtifactSchema,
  PatientTemplateClinicalResultMaterializationContextArtifactSchema,
  PatientTemplatePostCompositionAssemblyOrchestrationArtifactSchema,
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
  FindingDefinitionSchema,
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
  StructuredSourceReportProfileSchema,
  type StructuredSourceReportSelectionArtifact,
  type StructuredSourceReportSelectionHorizon,
  type StructuredSourceReportSelectionProfile,
  type TemplateConditionSelectionRequest,
  type TemplateConditionSelectionProfile,
  type WeightedFindingTendencyApplicabilityDefinition,
  type WeightedFindingTendencyProfile,
  type UniversalActionResultAssemblyRecipe,
  UniversalActionResultAssemblyCatalogSchema,
  VariantPoolDefinitionSchema,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import launcherPresentationsJson from '../../../content/catalogs/presentations/launcher-presentations.json';
import variantPoolsJson from '../../../content/catalogs/demographics/variant-pools.json';
import clinicalDurationProfilesJson from '../../../content/catalogs/durations/profiles.json';
import conditionFindingProfilesJson from '../../../content/catalogs/diagnoses/condition-finding-profiles.json';
import mddDiagnosisJson from '../../../content/catalogs/diagnoses/definitions/major-depressive-disorder.diagnosis.json';
import decisionBalanceCatalogJson from '../../../content/catalogs/decision-policies/balances.json';
import decisionPolicyCatalogJson from '../../../content/catalogs/decision-policies/catalog.json';
import universalActionResultAssembliesJson from '../../../content/catalogs/actions/universal-action-result-assemblies.json';
import backgroundFindingOutcomeProfilesJson from '../../../content/catalogs/findings/background-outcome-profiles.json';
import currentActiveSuicidalIdeationJson from '../../../content/catalogs/findings/definitions/current-active-suicidal-ideation.finding.json';
import currentAnhedoniaJson from '../../../content/catalogs/findings/definitions/current-anhedonia.finding.json';
import currentDecreasedSleepNeedJson from '../../../content/catalogs/findings/definitions/current-decreased-sleep-need.finding.json';
import currentElevatedIrritableMoodJson from '../../../content/catalogs/findings/definitions/current-elevated-irritable-mood.finding.json';
import currentExcessiveGuiltJson from '../../../content/catalogs/findings/definitions/current-excessive-guilt.finding.json';
import currentFatigueLowEnergyJson from '../../../content/catalogs/findings/definitions/current-fatigue-low-energy.finding.json';
import currentGrandiosityJson from '../../../content/catalogs/findings/definitions/current-grandiosity.finding.json';
import currentHighRiskSpendingJson from '../../../content/catalogs/findings/definitions/current-high-risk-spending.finding.json';
import currentHypersomniaJson from '../../../content/catalogs/findings/definitions/current-hypersomnia.finding.json';
import currentIncreasedAppetiteJson from '../../../content/catalogs/findings/definitions/current-increased-appetite.finding.json';
import currentIncreasedGoalDirectedActivityJson from '../../../content/catalogs/findings/definitions/current-increased-goal-directed-activity.finding.json';
import currentIndecisionJson from '../../../content/catalogs/findings/definitions/current-indecision.finding.json';
import currentInsomniaJson from '../../../content/catalogs/findings/definitions/current-insomnia.finding.json';
import currentObservedPsychomotorAgitationJson from '../../../content/catalogs/findings/definitions/current-observed-psychomotor-agitation.finding.json';
import currentObservedPsychomotorSlowingJson from '../../../content/catalogs/findings/definitions/current-observed-psychomotor-slowing.finding.json';
import currentPassiveDeathWishJson from '../../../content/catalogs/findings/definitions/current-passive-death-wish.finding.json';
import currentPressuredSpeechJson from '../../../content/catalogs/findings/definitions/current-pressured-speech.finding.json';
import currentRacingThoughtsJson from '../../../content/catalogs/findings/definitions/current-racing-thoughts.finding.json';
import currentReducedAppetiteJson from '../../../content/catalogs/findings/definitions/current-reduced-appetite.finding.json';
import currentSelfReportedConcentrationDifficultyJson from '../../../content/catalogs/findings/definitions/current-self-reported-concentration-difficulty.finding.json';
import currentSelfReportedAccessToSuicideMeansJson from '../../../content/catalogs/findings/definitions/current-self-reported-access-to-suicide-means.finding.json';
import currentSelfReportedIdeasOfReferenceJson from '../../../content/catalogs/findings/definitions/current-self-reported-ideas-of-reference.finding.json';
import currentSelfReportedImpulsivityJson from '../../../content/catalogs/findings/definitions/current-self-reported-impulsivity.finding.json';
import currentSelfReportedPersecutoryIdeationJson from '../../../content/catalogs/findings/definitions/current-self-reported-persecutory-ideation.finding.json';
import currentSelfReportedPsychomotorAgitationJson from '../../../content/catalogs/findings/definitions/current-self-reported-psychomotor-agitation.finding.json';
import currentSelfReportedSuspiciousnessJson from '../../../content/catalogs/findings/definitions/current-self-reported-suspiciousness.finding.json';
import currentSelfReportedThoughtDisorganizationJson from '../../../content/catalogs/findings/definitions/current-self-reported-thought-disorganization.finding.json';
import currentPsychomotorSlowingJson from '../../../content/catalogs/findings/definitions/current-psychomotor-slowing.finding.json';
import currentUnintentionalWeightGainJson from '../../../content/catalogs/findings/definitions/current-unintentional-weight-gain.finding.json';
import currentUnintentionalWeightLossJson from '../../../content/catalogs/findings/definitions/current-unintentional-weight-loss.finding.json';
import currentWorthlessnessJson from '../../../content/catalogs/findings/definitions/current-worthlessness.finding.json';
import currentSpecificSuicidePlanJson from '../../../content/catalogs/findings/definitions/current-specific-suicide-plan.finding.json';
import currentSuicidalIntentJson from '../../../content/catalogs/findings/definitions/current-suicidal-intent.finding.json';
import currentSuicidePreparatoryBehaviorJson from '../../../content/catalogs/findings/definitions/current-suicide-preparatory-behavior.finding.json';
import depressedMoodJson from '../../../content/catalogs/findings/definitions/depressed-mood.finding.json';
import pastEpisodicDecreasedSleepNeedJson from '../../../content/catalogs/findings/definitions/past-episodic-decreased-sleep-need.finding.json';
import pastEpisodicElevatedIrritableMoodJson from '../../../content/catalogs/findings/definitions/past-episodic-elevated-irritable-mood.finding.json';
import pastEpisodicGrandiosityJson from '../../../content/catalogs/findings/definitions/past-episodic-grandiosity.finding.json';
import pastEpisodicHighRiskSpendingJson from '../../../content/catalogs/findings/definitions/past-episodic-high-risk-spending.finding.json';
import pastEpisodicIncreasedGoalDirectedActivityJson from '../../../content/catalogs/findings/definitions/past-episodic-increased-goal-directed-activity.finding.json';
import pastEpisodicPressuredSpeechJson from '../../../content/catalogs/findings/definitions/past-episodic-pressured-speech.finding.json';
import pastEpisodicRacingThoughtsJson from '../../../content/catalogs/findings/definitions/past-episodic-racing-thoughts.finding.json';
import pastEpisodicSelfReportedImpulsivityJson from '../../../content/catalogs/findings/definitions/past-episodic-self-reported-impulsivity.finding.json';
import reportedDelusionalBeliefsJson from '../../../content/catalogs/findings/definitions/reported-delusional-beliefs.finding.json';
import reportedHallucinationsJson from '../../../content/catalogs/findings/definitions/reported-hallucinations.finding.json';
import recentSuicideAttemptJson from '../../../content/catalogs/findings/definitions/recent-suicide-attempt.finding.json';
import selfReportedCurrentFunctionalImpactJson from '../../../content/catalogs/findings/definitions/self-reported-current-functional-impact.finding.json';
import suicideAttemptHistoryJson from '../../../content/catalogs/findings/definitions/suicide-attempt-history.finding.json';
import suicidePreparatoryBehaviorHistoryJson from '../../../content/catalogs/findings/definitions/suicide-preparatory-behavior-history.finding.json';
import medicationRegimenCatalogJson from '../../../content/catalogs/medications/regimen-knowledge.json';
import currentMedicationRegimenAccurateProfileJson from '../../../content/catalogs/patient-scene-sources/structured-report-profiles/current-medication-regimen-accurate.profile.json';
import reactionHistoryAccurateProfileJson from '../../../content/catalogs/patient-scene-sources/structured-report-profiles/reaction-history-accurate.profile.json';
import substanceUseAccurateProfileJson from '../../../content/catalogs/patient-scene-sources/structured-report-profiles/substance-use-accurate.profile.json';
import findingProjectionHorizonsJson from '../../../content/catalogs/findings/projection-horizons.json';
import findingProjectionsJson from '../../../content/catalogs/findings/projections.json';
import {
  fingerprintBackgroundFindingHorizon,
  fingerprintBackgroundFindingOutcomeProfile,
  selectBackgroundFindingOutcomes,
} from './background-finding-outcome-selector';
import {
  fingerprintCatalogInstanceRecipe,
  verifyCatalogCompiledInstanceIntegrity,
} from './catalog-instance-compiler';
import { compilePatientSceneSourceInstancesFromCatalog } from './catalog-patient-scene-source-instance-compiler';
import {
  fingerprintClinicalDurationProfile,
  resolveConditionClinicalDuration,
} from './clinical-duration-profile-resolver';
import {
  attachConditionClinicalDurations,
  verifyConditionClinicalDurationAttachmentIntegrity,
} from './condition-clinical-duration-attachment';
import {
  validateConditionClinicalDurationSources,
  verifyConditionClinicalDurationSourceValidationIntegrity,
} from './condition-clinical-duration-source-validation';
import { attachConditionFunctionalImpairments } from './condition-functional-impairment-attachment';
import { resolveConditionFunctionalImpairment } from './condition-functional-impairment-profile-resolver';
import {
  validateConditionFunctionalImpairmentSources,
  verifyConditionFunctionalImpairmentSourceValidationIntegrity,
} from './condition-functional-impairment-source-validation';
import {
  fingerprintConditionFindingCardinalityProfile,
  selectConditionFindingCardinalityCandidates,
} from './condition-finding-cardinality-selector';
import {
  composeFindingPipelineAudit,
  verifyFindingPipelineAuditContext,
  verifyFindingPipelineAuditIntegrity,
} from './finding-pipeline-audit-composer';
import {
  attachDecisionBalance,
  NATIVE_DECISION_BALANCE_COMPILER_VERSION,
} from './decision-balance';
import {
  adaptDiagnosisInformationPrerequisite,
  adaptDiagnosisInformationRecommendation,
  adaptDiagnosisInformationRequirement,
} from './diagnosis-information-prerequisite-adapter';
import {
  compileGeneratedCompletedEncounterAttempt,
  createGeneratedCompletedEncounterAttemptPersistenceRecord,
  verifyGeneratedCompletedEncounterAttemptContext,
  verifyGeneratedCompletedEncounterAttemptIntegrity,
  verifyGeneratedCompletedEncounterAttemptPersistenceRecord,
} from './generated-completed-attempt-compiler';
import {
  compileGeneratedWaitingSlotLauncherPresentationAttachment,
  verifyGeneratedWaitingSlotLauncherPresentationAttachmentIntegrity,
} from './generated-waiting-slot-launcher-presentation-attachment';
import { calculateSatisfactionState } from './satisfaction';
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
import {
  orchestratePatientTemplateClinicalResultAttachment,
  verifyPatientTemplateClinicalResultAttachmentOrchestrationIntegrity,
} from './patient-template-clinical-result-attachment-orchestrator';
import {
  orchestratePatientTemplateClinicalResultFindingPipeline,
  verifyPatientTemplateClinicalResultFindingPipelineOrchestrationIntegrity,
} from './patient-template-clinical-result-finding-pipeline-orchestrator';
import {
  compilePatientTemplateClinicalResultMaterialization,
  verifyPatientTemplateClinicalResultMaterializationIntegrity,
} from './patient-template-clinical-result-materialization-compiler';
import {
  compilePatientTemplateClinicalResultMaterializationContext,
  verifyPatientTemplateClinicalResultMaterializationContextIntegrity,
} from './patient-template-clinical-result-materialization-context-compiler';
import { compilePatientTemplateClinicalResultResourceCoverage } from './patient-template-clinical-result-resource-coverage-compiler';
import {
  orchestratePatientTemplatePostCompositionAssembly,
  verifyPatientTemplatePostCompositionAssemblyOrchestrationIntegrity,
} from './patient-template-post-composition-assembly-orchestrator';
import { attachPatientClinicalResults } from './patient-clinical-result-attachment';
import { compileBodyMassIndexDerivation } from './body-mass-index-derivation-compiler';
import { materializeBodyMassIndexMeasurement } from './body-mass-index-measurement-materializer';
import { compilePatientClinicalResultCollection } from './patient-clinical-result-collection-compiler';
import { compileGeneratedCategoricalObservation } from './generated-categorical-observation-compiler';
import { compileGeneratedMeasurement } from './generated-measurement-compiler';
import { adaptFocusedMedicationRegimenRoute } from './medication-regimen-route-adapter';
import { compilePatientOwnedMeasurement } from './patient-owned-measurement-compiler';
import { compileTestPatientTemplateClinicalResultRecipe } from './patient-template-clinical-result-recipe-test-fixture';
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
import { compilePatientSceneSourceInstances } from './patient-scene-source-instance-compiler';
import {
  assemblePostCompositionPatientState,
  verifyPostCompositionPatientStateAssemblyIntegrity,
} from './post-composition-patient-state-assembler';
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

const checkedInLauncherPresentationCatalog =
  PatientLauncherPresentationCatalogSchema.parse(launcherPresentationsJson);
const checkedInLauncherVariantPools = VariantPoolDefinitionSchema.array().parse(variantPoolsJson);
const checkedInLauncherPresentationProfile = checkedInLauncherPresentationCatalog.profiles.find(
  (profile) => profile.id === 'patient-launcher-presentation-profile.mdd-current-episode',
)!;
const checkedInLauncherFirstNamePool = checkedInLauncherVariantPools.find(
  (pool) => pool.id === checkedInLauncherPresentationProfile.firstNamePoolRef.id,
)!;
const checkedInLauncherLastNamePool = checkedInLauncherVariantPools.find(
  (pool) => pool.id === checkedInLauncherPresentationProfile.lastNamePoolRef.id,
)!;
const checkedInMddDurationProfile = ClinicalDurationProfileCatalogSchema.parse(
  clinicalDurationProfilesJson,
).profiles.find((profile) => profile.id === 'duration-profile.mdd.current-episode')!;
const checkedInMddFindingProfile = ConditionFindingProfileCatalogSchema.parse(
  conditionFindingProfilesJson,
).profiles.find((profile) => profile.id === 'condition-finding-profile.mdd.current-episode')!;
const checkedInMddFunctionalImpactFinding = FindingDefinitionSchema.parse(
  selfReportedCurrentFunctionalImpactJson,
);
const checkedInMddFunctionalImpactProfile = BackgroundFindingOutcomeProfileCatalogSchema.parse(
  backgroundFindingOutcomeProfilesJson,
).profiles.find(
  (profile) => profile.id === 'background-finding-profile.mdd-outpatient.current-functional-impact',
)!;
const checkedInMddFindingDefinitions = FindingDefinitionSchema.array()
  .parse([
    currentActiveSuicidalIdeationJson,
    currentAnhedoniaJson,
    currentExcessiveGuiltJson,
    currentFatigueLowEnergyJson,
    currentHypersomniaJson,
    currentIncreasedAppetiteJson,
    currentIndecisionJson,
    currentInsomniaJson,
    currentObservedPsychomotorAgitationJson,
    currentObservedPsychomotorSlowingJson,
    currentPassiveDeathWishJson,
    currentReducedAppetiteJson,
    currentSelfReportedConcentrationDifficultyJson,
    currentSelfReportedPsychomotorAgitationJson,
    currentPsychomotorSlowingJson,
    currentUnintentionalWeightGainJson,
    currentUnintentionalWeightLossJson,
    currentWorthlessnessJson,
    depressedMoodJson,
  ])
  .sort((left, right) => left.id.localeCompare(right.id));
const checkedInFindingProjectionCatalog =
  FindingProjectionCatalogSchema.parse(findingProjectionsJson);
const checkedInFindingProjectionHorizonCatalog = FindingProjectionHorizonCatalogSchema.parse(
  findingProjectionHorizonsJson,
);
const checkedInMddDepressiveSymptomsProjectionHorizon =
  checkedInFindingProjectionHorizonCatalog.horizons.find(
    (horizon) => horizon.id === 'finding-projection-horizon.history.depressive-symptoms',
  )!;
const checkedInMddInitialAssessmentProjectionHorizon =
  checkedInFindingProjectionHorizonCatalog.horizons.find(
    (horizon) => horizon.id === 'finding-projection-horizon.mdd-initial-assessment-foundation',
  )!;
const checkedInFindingProjectionByKey = new Map(
  checkedInFindingProjectionCatalog.projections.map(
    (projection) => [`${projection.id}@${projection.contentVersion}`, projection] as const,
  ),
);
const checkedInMddDepressiveSymptomsProjections =
  checkedInMddDepressiveSymptomsProjectionHorizon.projectionRefs.map(
    (reference) =>
      checkedInFindingProjectionByKey.get(`${reference.id}@${reference.contentVersion}`)!,
  );
const checkedInMddInitialAssessmentProjections =
  checkedInMddInitialAssessmentProjectionHorizon.projectionRefs.map(
    (reference) =>
      checkedInFindingProjectionByKey.get(`${reference.id}@${reference.contentVersion}`)!,
  );
const checkedInMddDepressiveSymptomsFindingIds = new Set(
  checkedInMddDepressiveSymptomsProjections.flatMap((projection) =>
    projection.sourceBindings.flatMap((binding) =>
      binding.kind === 'canonical_finding' ? [binding.findingDefinitionId] : [],
    ),
  ),
);
const checkedInMddDepressiveSymptomsFindingDefinitions = checkedInMddFindingDefinitions.filter(
  (definition) => checkedInMddDepressiveSymptomsFindingIds.has(definition.id),
);
const checkedInManiaHistoryProjectionHorizon =
  checkedInFindingProjectionHorizonCatalog.horizons.find(
    (horizon) => horizon.id === 'finding-projection-horizon.history.mania-hypomania',
  )!;
const checkedInManiaHistoryProjections = checkedInManiaHistoryProjectionHorizon.projectionRefs.map(
  (reference) =>
    checkedInFindingProjectionByKey.get(`${reference.id}@${reference.contentVersion}`)!,
);
const checkedInManiaHistoryFindingIds = new Set(
  checkedInManiaHistoryProjections.flatMap((projection) =>
    projection.sourceBindings.flatMap((binding) =>
      binding.kind === 'canonical_finding' ? [binding.findingDefinitionId] : [],
    ),
  ),
);
const checkedInManiaHistoryFindingDefinitions = FindingDefinitionSchema.array()
  .parse([
    currentDecreasedSleepNeedJson,
    currentElevatedIrritableMoodJson,
    currentGrandiosityJson,
    currentHighRiskSpendingJson,
    currentIncreasedGoalDirectedActivityJson,
    currentPressuredSpeechJson,
    currentRacingThoughtsJson,
    currentSelfReportedImpulsivityJson,
    pastEpisodicDecreasedSleepNeedJson,
    pastEpisodicElevatedIrritableMoodJson,
    pastEpisodicGrandiosityJson,
    pastEpisodicHighRiskSpendingJson,
    pastEpisodicIncreasedGoalDirectedActivityJson,
    pastEpisodicPressuredSpeechJson,
    pastEpisodicRacingThoughtsJson,
    pastEpisodicSelfReportedImpulsivityJson,
  ])
  .sort((left, right) => left.id.localeCompare(right.id));
const checkedInPsychosisHistoryProjectionHorizon =
  checkedInFindingProjectionHorizonCatalog.horizons.find(
    (horizon) => horizon.id === 'finding-projection-horizon.history.psychotic-symptoms',
  )!;
const checkedInPsychosisHistoryProjections =
  checkedInPsychosisHistoryProjectionHorizon.projectionRefs.map(
    (reference) =>
      checkedInFindingProjectionByKey.get(`${reference.id}@${reference.contentVersion}`)!,
  );
const checkedInPsychosisHistoryFindingIds = new Set(
  checkedInPsychosisHistoryProjections.flatMap((projection) =>
    projection.sourceBindings.flatMap((binding) =>
      binding.kind === 'canonical_finding' ? [binding.findingDefinitionId] : [],
    ),
  ),
);
const checkedInPsychosisHistoryFindingDefinitions = FindingDefinitionSchema.array()
  .parse([
    currentSelfReportedIdeasOfReferenceJson,
    currentSelfReportedPersecutoryIdeationJson,
    currentSelfReportedSuspiciousnessJson,
    currentSelfReportedThoughtDisorganizationJson,
    reportedDelusionalBeliefsJson,
    reportedHallucinationsJson,
  ])
  .sort((left, right) => left.id.localeCompare(right.id));
const checkedInSuicideSafetyProjectionHorizon =
  checkedInFindingProjectionHorizonCatalog.horizons.find(
    (horizon) => horizon.id === 'finding-projection-horizon.history.suicide-safety',
  )!;
const checkedInSuicideSafetyProjections =
  checkedInSuicideSafetyProjectionHorizon.projectionRefs.map(
    (reference) =>
      checkedInFindingProjectionByKey.get(`${reference.id}@${reference.contentVersion}`)!,
  );
const checkedInSuicideSafetyFindingIds = new Set(
  checkedInSuicideSafetyProjections.flatMap((projection) =>
    projection.sourceBindings.flatMap((binding) =>
      binding.kind === 'canonical_finding' ? [binding.findingDefinitionId] : [],
    ),
  ),
);
const checkedInSuicideSafetyFindingDefinitions = FindingDefinitionSchema.array()
  .parse([
    currentActiveSuicidalIdeationJson,
    currentPassiveDeathWishJson,
    currentSelfReportedAccessToSuicideMeansJson,
    currentSpecificSuicidePlanJson,
    currentSuicidalIntentJson,
    currentSuicidePreparatoryBehaviorJson,
    recentSuicideAttemptJson,
    suicideAttemptHistoryJson,
    suicidePreparatoryBehaviorHistoryJson,
  ])
  .sort((left, right) => left.id.localeCompare(right.id));
const checkedInUniversalActionResultAssemblyCatalog =
  UniversalActionResultAssemblyCatalogSchema.parse(universalActionResultAssembliesJson);
const checkedInMddDepressiveSymptomsActionResultAssembly =
  checkedInUniversalActionResultAssemblyCatalog.assemblies.find(
    (assembly) => assembly.id === 'universal-action-result-assembly.history.depressive-symptoms',
  )!;
const checkedInMddInitialAssessmentActionResultAssembly =
  checkedInUniversalActionResultAssemblyCatalog.assemblies.find(
    (assembly) =>
      assembly.id === 'universal-action-result-assembly.mdd-initial-assessment-foundation',
  )!;
const checkedInManiaHistoryActionResultAssembly =
  checkedInUniversalActionResultAssemblyCatalog.assemblies.find(
    (assembly) => assembly.id === 'universal-action-result-assembly.history.mania-hypomania',
  )!;
const checkedInPsychosisHistoryActionResultAssembly =
  checkedInUniversalActionResultAssemblyCatalog.assemblies.find(
    (assembly) => assembly.id === 'universal-action-result-assembly.history.psychotic-symptoms',
  )!;
const checkedInSuicideSafetyActionResultAssembly =
  checkedInUniversalActionResultAssemblyCatalog.assemblies.find(
    (assembly) => assembly.id === 'universal-action-result-assembly.history.suicide-safety',
  )!;
const checkedInMedicationReconciliationActionResultAssembly =
  checkedInUniversalActionResultAssemblyCatalog.assemblies.find(
    (assembly) =>
      assembly.id === 'universal-action-result-assembly.history.medication-reconciliation',
  )!;
const checkedInReactionHistoryActionResultAssembly =
  checkedInUniversalActionResultAssemblyCatalog.assemblies.find(
    (assembly) =>
      assembly.id === 'universal-action-result-assembly.history.allergies-adverse-reactions',
  )!;
const checkedInSubstanceUseActionResultAssembly =
  checkedInUniversalActionResultAssemblyCatalog.assemblies.find(
    (assembly) => assembly.id === 'universal-action-result-assembly.history.substance-use',
  )!;
const checkedInAccurateStructuredHistoryProfiles = StructuredSourceReportProfileSchema.array()
  .parse([
    currentMedicationRegimenAccurateProfileJson,
    reactionHistoryAccurateProfileJson,
    substanceUseAccurateProfileJson,
  ])
  .sort((left, right) => left.id.localeCompare(right.id));
const checkedInMddDiagnosis = DiagnosisDefinitionSchema.parse(mddDiagnosisJson);
const checkedInMddDecisionPolicy = DecisionPolicyCatalogSchema.parse(
  decisionPolicyCatalogJson,
).policies.find((policy) => policy.id === 'decision-policy.mdd-initial-medication')!;
const checkedInDecisionBalanceCatalog = DecisionBalanceCatalogSchema.parse(
  decisionBalanceCatalogJson,
);
const checkedInMddGeneratedDecisionBalanceCatalog = DecisionBalanceCatalogSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'registry.catalog.decision-balances.test.generated-mdd',
  balances: checkedInDecisionBalanceCatalog.balances.filter((balance) =>
    [
      'balance.mdd-antidepressant-mania-history',
      'balance.mdd-passive-death-wish-safety-assessment',
    ].includes(balance.id),
  ),
});
const checkedInMddExpandedDecisionBalanceCatalog = DecisionBalanceCatalogSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'registry.catalog.decision-balances.test.generated-mdd-expanded',
  balances: checkedInDecisionBalanceCatalog.balances.filter((balance) =>
    [
      'balance.mdd-antidepressant-mania-history',
      'balance.mdd-initial-depressive-syndrome-assessment',
      'balance.mdd-passive-death-wish-safety-assessment',
    ].includes(balance.id),
  ),
});
const checkedInMddPrimaryRouteDecisionBalanceCatalog = DecisionBalanceCatalogSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'registry.catalog.decision-balances.test.generated-mdd-primary-route',
  balances: checkedInDecisionBalanceCatalog.balances.filter((balance) =>
    [
      'balance.mdd-antidepressant-mania-history',
      'balance.mdd-initial-depressive-syndrome-assessment',
      'balance.mdd-initial-one-first-line-antidepressant',
      'balance.mdd-passive-death-wish-safety-assessment',
    ].includes(balance.id),
  ),
});
const checkedInMddMedicationRegimenCatalog = MedicationRegimenKnowledgeCatalogSchema.parse(
  medicationRegimenCatalogJson,
);
const checkedInMddPrimaryRoute = checkedInMddMedicationRegimenCatalog.focusedRoutes.find(
  (route) => route.id === 'medication-regimen-route.mdd-initial-one-first-line-antidepressant',
)!;
const checkedInMddPrimaryRouteCandidate = (() => {
  const result = adaptFocusedMedicationRegimenRoute({
    route: checkedInMddPrimaryRoute,
    diagnosis: checkedInMddDiagnosis,
    medicationClasses: checkedInMddMedicationRegimenCatalog.medicationClasses,
    classMemberships: checkedInMddMedicationRegimenCatalog.classMemberships,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
})();
const checkedInMddPassiveDeathWishSafetyCandidate = (() => {
  const result = adaptDiagnosisInformationRequirement({
    diagnosis: checkedInMddDiagnosis,
    diagnosisRuleId: 'rule.diagnosis-mdd.passive-death-wish-safety-assessment',
    policy: checkedInMddDecisionPolicy,
    primaryRoute: checkedInMddPrimaryRoute,
    medicationClasses: checkedInMddMedicationRegimenCatalog.medicationClasses,
    classMemberships: checkedInMddMedicationRegimenCatalog.classMemberships,
    findingDefinitions: checkedInSuicideSafetyFindingDefinitions,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
})();
const checkedInMddManiaHistoryPrerequisiteCandidate = (() => {
  const result = adaptDiagnosisInformationPrerequisite({
    diagnosis: checkedInMddDiagnosis,
    diagnosisRuleId: 'rule.diagnosis-mdd.initial-route-antidepressant-mania-history',
    policy: checkedInMddDecisionPolicy,
    primaryRoute: checkedInMddPrimaryRoute,
    medicationClasses: checkedInMddMedicationRegimenCatalog.medicationClasses,
    classMemberships: checkedInMddMedicationRegimenCatalog.classMemberships,
    findingDefinitions: checkedInSuicideSafetyFindingDefinitions,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
})();
const checkedInMddDepressiveSyndromeRequirementCandidate = (() => {
  const result = adaptDiagnosisInformationRequirement({
    diagnosis: checkedInMddDiagnosis,
    diagnosisRuleId: 'rule.diagnosis-mdd.initial-depressive-syndrome-assessment',
    policy: checkedInMddDecisionPolicy,
    primaryRoute: checkedInMddPrimaryRoute,
    medicationClasses: checkedInMddMedicationRegimenCatalog.medicationClasses,
    classMemberships: checkedInMddMedicationRegimenCatalog.classMemberships,
    findingDefinitions: checkedInMddFindingDefinitions,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
})();
const checkedInMddEpisodeCourseRequirementCandidate = (() => {
  const result = adaptDiagnosisInformationRequirement({
    diagnosis: checkedInMddDiagnosis,
    diagnosisRuleId: 'rule.diagnosis-mdd.initial-episode-course-assessment',
    policy: checkedInMddDecisionPolicy,
    primaryRoute: checkedInMddPrimaryRoute,
    medicationClasses: checkedInMddMedicationRegimenCatalog.medicationClasses,
    classMemberships: checkedInMddMedicationRegimenCatalog.classMemberships,
    findingDefinitions: checkedInMddFindingDefinitions,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
})();
const checkedInMddMedicationReconciliationPrerequisiteCandidate = (() => {
  const result = adaptDiagnosisInformationPrerequisite({
    diagnosis: checkedInMddDiagnosis,
    diagnosisRuleId: 'rule.diagnosis-mdd.any-medication-reconciliation',
    policy: checkedInMddDecisionPolicy,
    primaryRoute: checkedInMddPrimaryRoute,
    medicationClasses: checkedInMddMedicationRegimenCatalog.medicationClasses,
    classMemberships: checkedInMddMedicationRegimenCatalog.classMemberships,
    findingDefinitions: checkedInMddFindingDefinitions,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
})();
const checkedInMddMedicationReactionPrerequisiteCandidate = (() => {
  const result = adaptDiagnosisInformationPrerequisite({
    diagnosis: checkedInMddDiagnosis,
    diagnosisRuleId: 'rule.diagnosis-mdd.any-medication-reaction-history',
    policy: checkedInMddDecisionPolicy,
    primaryRoute: checkedInMddPrimaryRoute,
    medicationClasses: checkedInMddMedicationRegimenCatalog.medicationClasses,
    classMemberships: checkedInMddMedicationRegimenCatalog.classMemberships,
    findingDefinitions: checkedInMddFindingDefinitions,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
})();
const checkedInMddSubstanceHistoryRecommendationCandidate = (() => {
  const result = adaptDiagnosisInformationRecommendation({
    diagnosis: checkedInMddDiagnosis,
    diagnosisRuleId: 'rule.diagnosis-mdd.substance-history',
    policy: checkedInMddDecisionPolicy,
    primaryRoute: checkedInMddPrimaryRoute,
    medicationClasses: checkedInMddMedicationRegimenCatalog.medicationClasses,
    classMemberships: checkedInMddMedicationRegimenCatalog.classMemberships,
    findingDefinitions: checkedInMddFindingDefinitions,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
})();
const checkedInMddQualitativeDecisionCandidates = [
  checkedInMddPrimaryRouteCandidate,
  checkedInMddPassiveDeathWishSafetyCandidate,
  checkedInMddManiaHistoryPrerequisiteCandidate,
  checkedInMddDepressiveSyndromeRequirementCandidate,
];
const checkedInMddCoverageAuditDecisionCandidates = [
  ...checkedInMddQualitativeDecisionCandidates,
  checkedInMddEpisodeCourseRequirementCandidate,
  checkedInMddMedicationReconciliationPrerequisiteCandidate,
  checkedInMddMedicationReactionPrerequisiteCandidate,
  checkedInMddSubstanceHistoryRecommendationCandidate,
];
const checkedInMddBalancedDecisionCandidates = checkedInMddQualitativeDecisionCandidates.map(
  (candidate) => {
    const result = attachDecisionBalance({
      candidate,
      balanceCatalog: checkedInMddGeneratedDecisionBalanceCatalog,
    });
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
  },
);
const checkedInMddExpandedBalancedDecisionCandidates =
  checkedInMddQualitativeDecisionCandidates.map((candidate) => {
    const result = attachDecisionBalance({
      candidate,
      balanceCatalog: checkedInMddExpandedDecisionBalanceCatalog,
    });
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
  });
const checkedInMddPrimaryRouteBalancedDecisionCandidates =
  checkedInMddQualitativeDecisionCandidates.map((candidate) => {
    const result = attachDecisionBalance({
      candidate,
      balanceCatalog: checkedInMddPrimaryRouteDecisionBalanceCatalog,
    });
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
  });

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

const selectFixedStructuredReports = (input: {
  readonly template: PatientTemplate;
  readonly assembly: UniversalActionResultAssemblyRecipe;
  readonly profiles: readonly StructuredSourceReportProfile[];
  readonly seed: string;
}): StructuredSourceReportSelectionArtifact => {
  const definitionsByKey = new Map(
    input.assembly.structuredRevealDefinitions.map(
      (definition) => [`${definition.id}\u0000${definition.contentVersion}`, definition] as const,
    ),
  );
  const profiles = [...input.profiles].sort((left, right) => left.id.localeCompare(right.id));
  if (
    profiles.length !== input.assembly.structuredRevealDefinitions.length ||
    profiles.some(
      (profile) =>
        !definitionsByKey.has(
          `${profile.definitionRef.id}\u0000${profile.definitionRef.contentVersion}`,
        ),
    )
  ) {
    throw new Error('Expected one exact fixed profile per structured reveal definition.');
  }
  const horizon: StructuredSourceReportSelectionHorizon = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'source-report-selection-horizon.test.pipeline-accurate-structured-history',
    modelVersion: 'structured-source-report-selection.v1',
    assemblyRecipeRef: {
      id: input.assembly.id,
      contentVersion: input.assembly.contentVersion,
    },
    assemblyRecipeFingerprint: fingerprintStructuredSourceReportSelectionAssembly(input.assembly),
    pools: profiles.map((profile) => ({
      id: `source-view-slot.${profile.id}`,
      definitionRef: { ...profile.definitionRef },
      definitionFingerprint: profile.definitionFingerprint,
      source: { ...profile.source },
      timeScopeId: profile.timeScopeId,
      claimOriginId: profile.claimOriginId,
      dependencyGroupIds: [...profile.dependencyGroupIds],
    })),
    lifecycle: 'approved',
  };
  const selectionProfile: StructuredSourceReportSelectionProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'source-report-selection-profile.test.pipeline-accurate-structured-history',
    modelVersion: 'structured-source-report-selection-profile.v1',
    horizonRef: {
      id: horizon.id,
      contentVersion: horizon.contentVersion,
    },
    horizonFingerprint: fingerprintStructuredSourceReportSelectionHorizon(horizon),
    careSetting: input.template.careSetting,
    policies: horizon.pools.map((pool, index) => ({
      slotId: pool.id,
      mode: 'fixed' as const,
      candidate: {
        profileRef: {
          id: profiles[index]!.id,
          contentVersion: profiles[index]!.contentVersion,
        },
        profileFingerprint: fingerprintStructuredSourceReportProfile(profiles[index]!),
      },
    })),
    developerOpinionIds: [
      ...new Set(profiles.flatMap((profile) => profile.developerOpinionIds)),
    ].sort(),
    lifecycle: 'approved',
    review: structuredClone(profiles[0]!.review),
  };
  const result = selectStructuredSourceReportBehaviors({
    schemaVersion: 1,
    id: 'source-report-selection-request.test.pipeline-accurate-structured-history',
    seed: input.seed,
    template: input.template,
    assemblyRecipe: input.assembly,
    horizon,
    selectionProfile,
    profiles,
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
  currentMedicationReportedBenefits: [],
  currentMedicationDosePositions: [],
  medicationChangeTemporalRelationships: [],
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
  functionalImpairments: [],
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

const primaryRuleRefFor = (diagnosisDefinitionContentVersion = '1.0.0') => ({
  kind: 'medication_regimen_route' as const,
  id: 'route.test.pipeline-mdd-first-line',
  contentVersion: '1.0.0',
  ownerId: 'diagnosis.major-depressive-disorder',
  ownerContentVersion: diagnosisDefinitionContentVersion,
});

const decisionPolicy = (diagnosisDefinitionContentVersion = '1.0.0'): DecisionPolicyDefinition => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'decision-policy.test.pipeline-mdd-first-line',
  label: 'Synthetic immediate treatment decision',
  focusedDecisionId: 'decision.test.pipeline-immediate-treatment',
  primaryRouteRef: primaryRuleRefFor(diagnosisDefinitionContentVersion),
  explicitSupportingRuleRefs: [],
  developerOpinionIds: [],
  review: approvedReview,
});

const decisionRules = (
  diagnosisDefinitionContentVersion = '1.0.0',
  depressiveSymptomsInformationActionId = depressiveSymptomsAction.id,
): DecisionRuleCandidateDefinition[] => {
  const exactPrimaryRuleRef = primaryRuleRefFor(diagnosisDefinitionContentVersion);
  return [
    {
      schemaVersion: 1,
      ruleRef: exactPrimaryRuleRef,
      label: 'Synthetic broad first-line route',
      ruleKind: 'primary_route',
      discoveryLane: 'primary_policy_only',
      patientWhen: {
        type: 'fact',
        fact: {
          recordKind: 'condition',
          identityId: 'diagnosis.major-depressive-disorder',
          identityContentVersion: diagnosisDefinitionContentVersion,
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
        ownerContentVersion: diagnosisDefinitionContentVersion,
      },
      label: 'Synthetic medication-reconciliation prerequisite',
      ruleKind: 'prerequisite',
      discoveryLane: 'automatic_guardrail',
      patientWhen: {
        type: 'fact',
        fact: {
          recordKind: 'condition',
          identityId: 'diagnosis.major-depressive-disorder',
          identityContentVersion: diagnosisDefinitionContentVersion,
          attributeId: 'condition.presence',
          valueId: 'state.present',
        },
      },
      actionWhen: {
        match: 'any',
        targets: [
          {
            kind: 'information_action',
            informationActionId: depressiveSymptomsInformationActionId,
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
              informationActionId: depressiveSymptomsInformationActionId,
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
};

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

const makeCheckedInMddProjectionRecipe = (
  seed = 'seed.d193-and-d194',
  includeFunctionalImpact = false,
): FindingPipelineSharedFindingRecipe => {
  const projectionHorizon = includeFunctionalImpact
    ? checkedInMddInitialAssessmentProjectionHorizon
    : checkedInMddDepressiveSymptomsProjectionHorizon;
  const projections = includeFunctionalImpact
    ? checkedInMddInitialAssessmentProjections
    : checkedInMddDepressiveSymptomsProjections;
  return {
    schemaVersion: 1,
    id: includeFunctionalImpact
      ? 'finding-compilation-recipe.test.pipeline-checked-in-mdd-initial-assessment'
      : 'finding-compilation-recipe.test.pipeline-checked-in-mdd',
    seed,
    findingDefinitions: [
      ...checkedInMddDepressiveSymptomsFindingDefinitions,
      ...(includeFunctionalImpact ? [checkedInMddFunctionalImpactFinding] : [textureFinding]),
    ],
    propositionDefinitions: [],
    projections: structuredClone(projections),
    expressionBanks: [],
    projectionHorizon: structuredClone(projectionHorizon.horizon),
  };
};

const addCheckedInManiaHistoryResult = (
  sharedFindingRecipe: FindingPipelineSharedFindingRecipe,
  assembly: UniversalActionResultAssemblyRecipe,
): void => {
  sharedFindingRecipe.id = 'finding-compilation-recipe.test.pipeline-checked-in-mdd-plus-mania';
  sharedFindingRecipe.projectionHorizon.id =
    'finding-projection-horizon.test.pipeline-checked-in-mdd-plus-mania';
  sharedFindingRecipe.findingDefinitions.push(
    ...structuredClone(checkedInManiaHistoryFindingDefinitions),
  );
  sharedFindingRecipe.projections.push(...structuredClone(checkedInManiaHistoryProjections));
  sharedFindingRecipe.projectionHorizon.targets.push(
    ...structuredClone(checkedInManiaHistoryProjectionHorizon.horizon.targets),
  );
  assembly.actionCatalog.actions.push(
    ...structuredClone(checkedInManiaHistoryActionResultAssembly.actionCatalog.actions),
  );
  assembly.recipes.push(...structuredClone(checkedInManiaHistoryActionResultAssembly.recipes));
  assembly.id = 'universal-action-result-assembly.test.pipeline-checked-in-mdd-plus-mania';
  assembly.actionCatalog.id = 'information-action-catalog.test.pipeline-checked-in-mdd-plus-mania';
};

const addCheckedInPsychosisHistoryResult = (
  sharedFindingRecipe: FindingPipelineSharedFindingRecipe,
  assembly: UniversalActionResultAssemblyRecipe,
): void => {
  const includesManiaHistory = assembly.actionCatalog.actions.some(
    (action) => action.id === 'info.history.mania',
  );
  const suffix = includesManiaHistory ? 'plus-mania-psychosis' : 'plus-psychosis';
  sharedFindingRecipe.id = `finding-compilation-recipe.test.pipeline-checked-in-mdd-${suffix}`;
  sharedFindingRecipe.projectionHorizon.id = `finding-projection-horizon.test.pipeline-checked-in-mdd-${suffix}`;
  sharedFindingRecipe.findingDefinitions.push(
    ...structuredClone(checkedInPsychosisHistoryFindingDefinitions),
  );
  sharedFindingRecipe.projections.push(...structuredClone(checkedInPsychosisHistoryProjections));
  sharedFindingRecipe.projectionHorizon.targets.push(
    ...structuredClone(checkedInPsychosisHistoryProjectionHorizon.horizon.targets),
  );
  assembly.actionCatalog.actions.push(
    ...structuredClone(checkedInPsychosisHistoryActionResultAssembly.actionCatalog.actions),
  );
  assembly.recipes.push(...structuredClone(checkedInPsychosisHistoryActionResultAssembly.recipes));
  assembly.id = `universal-action-result-assembly.test.pipeline-checked-in-mdd-${suffix}`;
  assembly.actionCatalog.id = `information-action-catalog.test.pipeline-checked-in-mdd-${suffix}`;
};

const addCheckedInSuicideSafetyResult = (
  sharedFindingRecipe: FindingPipelineSharedFindingRecipe,
  assembly: UniversalActionResultAssemblyRecipe,
): void => {
  const includedHistoryKinds = [
    assembly.actionCatalog.actions.some((action) => action.id === 'info.history.mania')
      ? 'mania'
      : null,
    assembly.actionCatalog.actions.some((action) => action.id === 'info.history.psychosis')
      ? 'psychosis'
      : null,
    'safety',
  ].filter((value): value is string => value !== null);
  const suffix = `plus-${includedHistoryKinds.join('-')}`;
  sharedFindingRecipe.id = `finding-compilation-recipe.test.pipeline-checked-in-mdd-${suffix}`;
  sharedFindingRecipe.projectionHorizon.id = `finding-projection-horizon.test.pipeline-checked-in-mdd-${suffix}`;
  const existingDefinitionKeys = new Set(
    sharedFindingRecipe.findingDefinitions.map(
      (definition) => `${definition.id}@${definition.contentVersion}`,
    ),
  );
  for (const definition of structuredClone(checkedInSuicideSafetyFindingDefinitions)) {
    const key = `${definition.id}@${definition.contentVersion}`;
    if (existingDefinitionKeys.has(key)) continue;
    sharedFindingRecipe.findingDefinitions.push(definition);
    existingDefinitionKeys.add(key);
  }
  sharedFindingRecipe.projections.push(...structuredClone(checkedInSuicideSafetyProjections));
  sharedFindingRecipe.projectionHorizon.targets.push(
    ...structuredClone(checkedInSuicideSafetyProjectionHorizon.horizon.targets),
  );
  assembly.actionCatalog.actions.push(
    ...structuredClone(checkedInSuicideSafetyActionResultAssembly.actionCatalog.actions),
  );
  assembly.recipes.push(...structuredClone(checkedInSuicideSafetyActionResultAssembly.recipes));
  assembly.id = `universal-action-result-assembly.test.pipeline-checked-in-mdd-${suffix}`;
  assembly.actionCatalog.id = `information-action-catalog.test.pipeline-checked-in-mdd-${suffix}`;
};

const addCheckedInAccurateStructuredHistoryResults = (
  assembly: UniversalActionResultAssemblyRecipe,
): void => {
  for (const sourceAssembly of [
    checkedInMedicationReconciliationActionResultAssembly,
    checkedInReactionHistoryActionResultAssembly,
    checkedInSubstanceUseActionResultAssembly,
  ]) {
    assembly.actionCatalog.actions.push(...structuredClone(sourceAssembly.actionCatalog.actions));
    assembly.structuredRevealDefinitions.push(
      ...structuredClone(sourceAssembly.structuredRevealDefinitions),
    );
    assembly.recipes.push(...structuredClone(sourceAssembly.recipes));
  }
  assembly.id = 'universal-action-result-assembly.test.pipeline-accurate-structured-history';
  assembly.actionCatalog.id =
    'information-action-catalog.test.pipeline-accurate-structured-history';
};

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
  includeOptionalSourceReport = false,
  mddDiagnosisDefinitionContentVersion = '1.0.0',
  findingProjectionHorizonId = 'finding-projection-horizon.test.pipeline',
  universalActionResultAssemblyRecipeRef = {
    id: 'universal-action-result-assembly.test.finding-pipeline',
    contentVersion: '1.0.0',
  },
  selectedDecisionPolicy: DecisionPolicyDefinition = decisionPolicy(
    mddDiagnosisDefinitionContentVersion,
  ),
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
  focusedDecisionId: selectedDecisionPolicy.focusedDecisionId,
  primaryPolicyRef: {
    id: selectedDecisionPolicy.id,
    contentVersion: selectedDecisionPolicy.contentVersion,
  },
  decisionActionHorizonId: 'decision-action-horizon.test.pipeline',
  decisionActionHorizonFingerprint: recipeFingerprints.decisionActionHorizonFingerprint,
  diagnosisSelectionHorizonId: 'diagnosis-selection-horizon.test.pipeline',
  diagnosisSelectionHorizonFingerprint: recipeFingerprints.diagnosisSelectionHorizonFingerprint,
  findingProjectionHorizonId,
  findingProjectionHorizonFingerprint: recipeFingerprints.findingProjectionHorizonFingerprint,
  universalActionResultAssemblyRecipeRef,
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
      diagnosisDefinitionContentVersion: mddDiagnosisDefinitionContentVersion,
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
    additionalFeatureBudget:
      includeOptionalComorbidity || includeOptionalFindingTexture || includeOptionalSourceReport
        ? 1
        : 0,
    maximumSelectedModules:
      includeOptionalComorbidity || includeOptionalFindingTexture || includeOptionalSourceReport
        ? 1
        : 0,
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

const selectFindingSourceReportOptionalFeature = (
  template: PatientTemplate,
  seed = 'seed.d201.selected-finding-source-report',
): OptionalFeatureBudgetSelectionArtifact => {
  const moduleDefinition: PatientOptionalFeatureModuleDefinition = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-feature.test.pipeline-finding-source-report',
    label: 'Synthetic low-energy self-report minimization',
    moduleKind: 'source_report',
    lifecycle: 'approved',
    medicalReviewStatus: 'approved',
    review: approvedReview,
  };
  const moduleFingerprint = fingerprintOptionalFeatureModuleDefinition(moduleDefinition);
  const result = selectOptionalFeaturesWithinBudget({
    schemaVersion: 1,
    id: 'optional-feature-budget-request.test.pipeline-finding-source-report',
    template: structuredClone(template),
    moduleDefinitions: [moduleDefinition],
    profile: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'optional-feature-profile.test.pipeline-finding-source-report',
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
          id: 'optional-feature-binding.test.pipeline-finding-source-report',
          moduleRef: {
            id: moduleDefinition.id,
            contentVersion: moduleDefinition.contentVersion,
          },
          moduleFingerprint,
          selectedModuleId: 'patient-optional-feature.test.pipeline-finding-source-report',
          cost: 1,
          impact: 'fit_modifier',
          complexityContributions: [
            {
              id: 'complexity-contribution.test.pipeline-finding-source-report',
              label: 'Synthetic inaccurate patient report',
              dimension: 'information',
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
      result.ok
        ? 'Expected one selected synthetic finding source-report module.'
        : result.error.message,
    );
  }
  return result.value;
};

const prepareFindingSourceReportProjections = (
  sharedFindingRecipe: FindingPipelineSharedFindingRecipe,
): void => {
  const baseProjection = sharedFindingRecipe.projections[0]!;
  const inaccurateProjection = {
    ...structuredClone(baseProjection),
    id: 'finding-projection.test.pipeline-low-energy-minimized',
    response: {
      kind: 'finding_outcome' as const,
      outcome: 'absent' as const,
    },
    expressionBankId: null,
    expressionBankContentVersion: null,
  };
  sharedFindingRecipe.projections.push(inaccurateProjection);
  sharedFindingRecipe.projectionHorizon.targets[0]!.allowedResponses.push({
    kind: 'finding_outcome',
    outcome: 'absent',
  });
};

const attachFindingSourceReportProjectionPolicy = (
  sharedFindingRecipe: FindingPipelineSharedFindingRecipe,
  optionalArtifact: OptionalFeatureBudgetSelectionArtifact,
): void => {
  const baseProjection = sharedFindingRecipe.projections.find(
    (projection) => projection.id === 'finding-projection.test.pipeline-low-energy',
  )!;
  const inaccurateProjection = sharedFindingRecipe.projections.find(
    (projection) => projection.id === 'finding-projection.test.pipeline-low-energy-minimized',
  )!;
  const binding = optionalArtifact.selectionRequest.profile.candidateBindings[0]!;
  sharedFindingRecipe.findingSourceReportProjectionPolicy = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'finding-source-report-policy.test.pipeline-low-energy',
    modelVersion: 'finding-source-report-projection.v1',
    optionalFeatureArtifact: optionalArtifact,
    slots: [
      {
        schemaVersion: 1,
        id: 'finding-source-report-slot.test.pipeline-low-energy-present',
        source: {
          kind: 'patient_report',
          sourceInstanceId: 'source-instance.test.pipeline-patient-history',
        },
        timeScopeId: 'time-scope.current',
        claimOriginId: 'claim-origin.test.pipeline-patient',
        dependencyGroupIds: [],
        baseProjectionRef: {
          id: baseProjection.id,
          contentVersion: baseProjection.contentVersion,
        },
        modifiers: [
          {
            moduleRef: { ...binding.moduleRef },
            moduleFingerprint: binding.moduleFingerprint,
            optionalFeatureBindingId: binding.id,
            selectedModuleId: binding.selectedModuleId,
            projectionRef: {
              id: inaccurateProjection.id,
              contentVersion: inaccurateProjection.contentVersion,
            },
          },
        ],
      },
    ],
    developerOpinionIds: ['developer-opinion.test.pipeline-finding-source-report'],
    lifecycle: 'approved',
    review: approvedReview,
  };
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

const selectConditionFindings = (
  conditionSource: ResolvedConditionSource,
  seed = 'seed.d197',
  useCheckedInMddFindingProfile = false,
) => {
  const conditionState = conditionSource.artifact.conditionStates.find(
    (state) => state.diagnosisDefinitionId === 'diagnosis.major-depressive-disorder',
  );
  if (conditionState === undefined) {
    throw new Error('Expected the synthetic MDD condition state.');
  }
  const syntheticProfile: ConditionFindingCardinalityProfile = {
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
  const profile = useCheckedInMddFindingProfile ? checkedInMddFindingProfile : syntheticProfile;
  const profileFindingDefinitions = useCheckedInMddFindingProfile
    ? checkedInMddFindingDefinitions
    : [coreFinding];
  const result = selectConditionFindingCardinalityCandidates({
    schemaVersion: 1,
    id: 'condition-finding-cardinality-request.test.pipeline',
    conditionSource,
    profiles: [profile],
    conditionProfileBindings: [
      {
        schemaVersion: 1,
        id: useCheckedInMddFindingProfile
          ? 'condition-finding-binding.test.pipeline-checked-in-mdd'
          : 'condition-finding-binding.test.pipeline-mdd',
        conditionStateId: conditionState.id,
        profileRef: {
          id: profile.id,
          contentVersion: profile.contentVersion,
        },
        profileFingerprint: fingerprintConditionFindingCardinalityProfile(profile),
      },
    ],
    findingDefinitions: profileFindingDefinitions,
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
  const targetSlug =
    targetFinding.id === coreFinding.id
      ? 'low-energy'
      : targetFinding.id === checkedInMddFunctionalImpactFinding.id
        ? 'functional-impact'
        : 'sleep';
  const profile: BackgroundFindingOutcomeProfile =
    targetFinding.id === checkedInMddFunctionalImpactFinding.id
      ? checkedInMddFunctionalImpactProfile
      : {
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
  matchingDiagnosisContentVersion = '1.0.0',
) => {
  const targetSlug =
    targetFinding.id === coreFinding.id
      ? 'low-energy'
      : targetFinding.id === checkedInMddFunctionalImpactFinding.id
        ? 'functional-impact'
        : 'sleep';
  const baselineOutcomeValues = background.selections[0]!.outcomeEvaluations.map(
    (outcome) => outcome.proposedValue.value,
  );
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
      allocations: baselineOutcomeValues.map((value) => ({
        schemaVersion: 1,
        proposedValue: { kind: 'outcome' as const, value },
        addedGameGenerationWeight: value === 'present' ? 7 : value === 'subthreshold' ? 2 : 0,
      })),
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
          identityContentVersion: matchingDiagnosisContentVersion,
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
  readonly includeCheckedInAccurateStructuredHistoryReports?: boolean;
  readonly includeInstrument?: boolean;
  readonly includeTargetScopedDuration?: boolean;
  readonly includeConditionScopedDuration?: boolean;
  readonly useCheckedInMddDurationProfile?: boolean;
  readonly useCheckedInMddFunctionalImpactProfile?: boolean;
  readonly omitConditionScopedDurationResultProjection?: boolean;
  readonly useCheckedInMddFindingProfile?: boolean;
  readonly includeCheckedInManiaHistoryResult?: boolean;
  readonly includeCheckedInPsychosisHistoryResult?: boolean;
  readonly includeCheckedInSuicideSafetyResult?: boolean;
  readonly includeCheckedInMddDiagnosisSelection?: boolean;
  readonly useCheckedInMddDecisionPolicy?: boolean;
  readonly useCheckedInMddDecisionBalances?: boolean;
  readonly useCheckedInMddDepressiveSyndromeBalance?: boolean;
  readonly useCheckedInMddPrimaryRouteBalance?: boolean;
  readonly useCheckedInMddCoverageAuditRules?: boolean;
  readonly includeFunctionalImpairment?: boolean;
  readonly includeClinicalResult?: boolean;
  readonly includeDerivedBodyMassIndex?: boolean;
  readonly useGeneratedMeasurements?: boolean;
  readonly useGeneratedCategoricalObservations?: boolean;
  readonly includeFindingTextureBridge?: boolean;
  readonly includeFindingSourceReportBridge?: boolean;
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
  readonly includeServiceBackedIntervention?: boolean;
}

const makeConditionDurationAttachment = (
  patientStateCompositionArtifact: ResolvedPatientStateCompositionArtifact,
  seed: string,
  sourceInstanceId = 'source-instance.test.pipeline-history',
  useCheckedInMddDurationProfile = false,
): ConditionClinicalDurationAttachmentArtifact => {
  const patientState = patientStateCompositionArtifact.composedPatientState;
  if (patientState === null) throw new Error('Expected a composed D-208 patient state.');
  const conditionState = patientState.conditionStates.find(
    (condition) => condition.diagnosisDefinitionId === 'diagnosis.major-depressive-disorder',
  );
  if (conditionState === undefined) {
    throw new Error('Expected the synthetic MDD condition state.');
  }
  const syntheticProfile: ClinicalDurationProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'duration-profile.test.pipeline-mdd-current',
    relatedDiagnosisId: conditionState.diagnosisDefinitionId,
    interpretation: 'supports_authored_state',
    criterionId: null,
    options: [
      {
        id: 'duration-option.test.pipeline-mdd-current.four-weeks',
        value: 4,
        unit: 'week',
        displayValueVariants: ['four weeks'],
      },
      {
        id: 'duration-option.test.pipeline-mdd-current.eight-weeks',
        value: 8,
        unit: 'week',
        displayValueVariants: ['eight weeks'],
      },
    ],
    developerOpinionIds: ['developer-opinion.test.pipeline-mdd-duration'],
    review: approvedReview,
  };
  const profile = useCheckedInMddDurationProfile ? checkedInMddDurationProfile : syntheticProfile;
  const resolution = resolveConditionClinicalDuration({
    schemaVersion: 1,
    id: 'condition-duration-request.test.pipeline-mdd-current',
    patientStateId: patientState.id,
    conditionState,
    profile,
    source: {
      kind: 'patient_report',
      sourceInstanceId,
    },
    timeScopeId: 'time-scope.current',
    seed,
  });
  if (!resolution.ok) throw new Error(resolution.error.message);
  const attachment = attachConditionClinicalDurations({
    schemaVersion: 1,
    id: 'condition-duration-attachment-request.test.pipeline',
    patientStateCompositionArtifact,
    durationResolutionArtifacts: [resolution.value],
  });
  if (!attachment.ok) throw new Error(attachment.error.message);
  return attachment.value;
};

const makeConditionDurationSourceValidation = (
  patientStateCompositionArtifact: ResolvedPatientStateCompositionArtifact,
  seed: string,
  useCheckedInMddDurationProfile = false,
): ConditionClinicalDurationSourceValidationArtifact => {
  const patientState = patientStateCompositionArtifact.composedPatientState;
  if (patientState === null) throw new Error('Expected a composed D-208 patient state.');
  const sourceHorizon = compilePatientSceneSourceInstances({
    schemaVersion: 1,
    id: 'patient-scene-source-instance-request.test.pipeline-duration',
    patientStateId: patientState.id,
    definitions: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'patient-scene-source-definition.test.pipeline-duration.patient-report',
        kind: 'patient_report',
      },
    ],
  });
  if (!sourceHorizon.ok) throw new Error(sourceHorizon.error.message);
  const sourceInstance = sourceHorizon.value.sourceInstances[0];
  if (sourceInstance === undefined) throw new Error('Expected one duration patient-report source.');
  const durationAttachment = makeConditionDurationAttachment(
    patientStateCompositionArtifact,
    seed,
    sourceInstance.id,
    useCheckedInMddDurationProfile,
  );
  const validation = validateConditionClinicalDurationSources({
    schemaVersion: 1,
    id: 'condition-clinical-duration-source-validation-request.test.pipeline',
    durationAttachment,
    sourceInstanceCompilation: sourceHorizon.value,
  });
  if (!validation.ok) throw new Error(validation.error.message);
  return validation.value;
};

const makeConditionFunctionalImpairmentSourceValidation = (
  patientStateCompositionArtifact: ResolvedPatientStateCompositionArtifact,
  seed: string,
): ConditionFunctionalImpairmentSourceValidationArtifact => {
  const patientState = patientStateCompositionArtifact.composedPatientState;
  if (patientState === null) throw new Error('Expected a composed D-208 patient state.');
  const conditionState = patientState.conditionStates.find(
    (condition) => condition.diagnosisDefinitionId === 'diagnosis.major-depressive-disorder',
  );
  if (conditionState === undefined) {
    throw new Error('Expected the synthetic MDD condition state.');
  }
  const sourceHorizon = compilePatientSceneSourceInstances({
    schemaVersion: 1,
    id: 'patient-scene-source-instance-request.test.pipeline-functional-impairment',
    patientStateId: patientState.id,
    definitions: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'patient-scene-source-definition.test.pipeline-functional-impairment.patient-report',
        kind: 'patient_report',
      },
    ],
  });
  if (!sourceHorizon.ok) throw new Error(sourceHorizon.error.message);
  const sourceInstance = sourceHorizon.value.sourceInstances[0];
  if (sourceInstance === undefined) {
    throw new Error('Expected one functional-impairment patient-report source.');
  }
  const profile: ConditionFunctionalImpairmentProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'functional-impairment-profile.test.pipeline-mdd-current',
    relatedDiagnosisId: conditionState.diagnosisDefinitionId,
    options: [
      {
        id: 'functional-impairment-option.test.pipeline-mdd-current.mild',
        level: 'mild',
      },
      {
        id: 'functional-impairment-option.test.pipeline-mdd-current.moderate',
        level: 'moderate',
      },
    ],
    developerOpinionIds: ['developer-opinion.test.pipeline-mdd-functional-impairment'],
    review: approvedReview,
  };
  const resolution = resolveConditionFunctionalImpairment({
    schemaVersion: 1,
    id: 'condition-functional-impairment-request.test.pipeline-mdd-current',
    patientStateId: patientState.id,
    conditionState,
    profile,
    source: {
      kind: sourceInstance.kind,
      sourceInstanceId: sourceInstance.id,
    },
    timeScopeId: conditionState.timeScopeId,
    seed,
  });
  if (!resolution.ok) throw new Error(resolution.error.message);
  const attachment = attachConditionFunctionalImpairments({
    schemaVersion: 1,
    id: 'condition-functional-impairment-attachment-request.test.pipeline',
    patientStateCompositionArtifact,
    functionalImpairmentResolutionArtifacts: [resolution.value],
  });
  if (!attachment.ok) throw new Error(attachment.error.message);
  const validation = validateConditionFunctionalImpairmentSources({
    schemaVersion: 1,
    id: 'condition-functional-impairment-source-validation-request.test.pipeline',
    functionalImpairmentAttachment: attachment.value,
    sourceInstanceCompilation: sourceHorizon.value,
  });
  if (!validation.ok) throw new Error(validation.error.message);
  return validation.value;
};

const pipelineMeasurementSourceCatalog = PatientSceneSourceDefinitionCatalogSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'registry.catalog.patient-scene-source-definitions.test.pipeline-measurement',
  definitions: [
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'patient-scene-source-role.test.pipeline-clinician-observation',
      kind: 'clinician_observation',
    },
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'patient-scene-source-role.test.pipeline-measurement',
      kind: 'measurement',
    },
  ],
});

const pipelineClinicianObservationSourceDefinition =
  pipelineMeasurementSourceCatalog.definitions.find(
    (definition) =>
      definition.id === 'patient-scene-source-role.test.pipeline-clinician-observation',
  );
const pipelineMeasurementSourceDefinition = pipelineMeasurementSourceCatalog.definitions.find(
  (definition) => definition.id === 'patient-scene-source-role.test.pipeline-measurement',
);
if (
  pipelineClinicianObservationSourceDefinition === undefined ||
  pipelineMeasurementSourceDefinition === undefined
) {
  throw new Error('Expected both synthetic pipeline clinical-result source definitions.');
}

const pipelineWeightDefinition = MeasurementDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'measurement.test.pipeline-weight',
  label: 'Synthetic pipeline weight',
  domain: 'anthropometric',
  unit: {
    display: 'kg',
    ucumCode: 'kg',
    displayPrecision: 1,
  },
  availableThroughActionIds: [depressiveSymptomsAction.id],
  allowedContextDimensionIds: [],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const pipelineHeightDefinition = MeasurementDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'measurement.test.pipeline-height',
  label: 'Synthetic pipeline height',
  domain: 'anthropometric',
  unit: {
    display: 'cm',
    ucumCode: 'cm',
    displayPrecision: 1,
  },
  availableThroughActionIds: [depressiveSymptomsAction.id],
  allowedContextDimensionIds: [],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const pipelineBodyMassIndexDefinition = MeasurementDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'measurement.test.pipeline-bmi',
  label: 'Synthetic pipeline BMI',
  domain: 'anthropometric',
  unit: {
    display: 'kg/m²',
    ucumCode: 'kg/m2',
    displayPrecision: 1,
  },
  availableThroughActionIds: [depressiveSymptomsAction.id],
  allowedContextDimensionIds: [],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const pipelineAppearanceDefinition = CategoricalObservationDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'observation.test.pipeline-appearance',
  label: 'Synthetic pipeline appearance',
  domain: 'physical_exam',
  allowedValueIds: [
    'observation-value.test.pipeline-appearance.a',
    'observation-value.test.pipeline-appearance.b',
  ],
  availableThroughActionIds: [depressiveSymptomsAction.id],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const pipelineBodyMassIndexDerivationDefinition = BodyMassIndexDerivationDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'measurement-derivation.test.pipeline-bmi',
  kind: 'body_mass_index_from_metric_height_weight',
  heightMeasurementDefinitionRef: {
    id: pipelineHeightDefinition.id,
    contentVersion: pipelineHeightDefinition.contentVersion,
  },
  weightMeasurementDefinitionRef: {
    id: pipelineWeightDefinition.id,
    contentVersion: pipelineWeightDefinition.contentVersion,
  },
  outputMeasurementDefinitionRef: {
    id: pipelineBodyMassIndexDefinition.id,
    contentVersion: pipelineBodyMassIndexDefinition.contentVersion,
  },
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const makePatientClinicalResultAttachment = (
  patientStateCompositionArtifact: ResolvedPatientStateCompositionArtifact,
  includeDerivedBodyMassIndex = false,
  useGeneratedMeasurements = false,
  useGeneratedCategoricalObservations = false,
) => {
  const patientState = patientStateCompositionArtifact.composedPatientState;
  if (patientState === null) throw new Error('Expected a composed D-208 patient state.');
  const sourceCompilation = compilePatientSceneSourceInstancesFromCatalog({
    schemaVersion: 1,
    id: 'catalog-patient-scene-source-instance-request.test.pipeline-measurement',
    patientStateId: patientState.id,
    sourceDefinitionCatalog: pipelineMeasurementSourceCatalog,
  });
  if (!sourceCompilation.ok) throw new Error(sourceCompilation.error.message);
  const compileMeasurement = (
    definition: typeof pipelineWeightDefinition,
    value: number,
    coordinate: string,
  ) => {
    if (useGeneratedMeasurements) {
      const generationProfile = GeneratedMeasurementValueProfileSchema.parse({
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: `measurement-generation-profile.test.pipeline-${coordinate}`,
        measurementDefinitionRef: {
          id: definition.id,
          contentVersion: definition.contentVersion,
        },
        priority: 0,
        when: {
          anyDiagnosisIds: [],
          allClinicalTagIds: [],
        },
        valueBands: [
          {
            id: `measurement-generation-band.test.pipeline-${coordinate}`,
            minimum: coordinate === 'height' ? 160 : 70,
            maximum: coordinate === 'height' ? 180 : 90,
            relativeWeight: 1,
          },
        ],
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
      const compilation = compileGeneratedMeasurement({
        schemaVersion: 1,
        id: `generated-measurement-request.test.pipeline-${coordinate}`,
        patientStateId: patientState.id,
        seed: `seed.test.pipeline-initial-generated-${coordinate}`,
        measurementDefinition: definition,
        generationContext: {
          ageYears: patientState.demographics.ageYears,
          sexForReference: patientState.demographics.sexForReference,
          diagnosisIds: [
            ...new Set(
              patientState.conditionStates.map((condition) => condition.diagnosisDefinitionId),
            ),
          ].sort(),
          clinicalTagIds: [...patientState.clinicalTagIds].sort(),
        },
        generationProfiles: [generationProfile],
        sourceDefinitionRef: {
          id: pipelineMeasurementSourceDefinition.id,
          contentVersion: pipelineMeasurementSourceDefinition.contentVersion,
        },
        sourceInstanceCompilation: sourceCompilation.value,
        timeScopeId: 'time-scope.current',
      });
      if (!compilation.ok) throw new Error(compilation.error.message);
      return compilation.value;
    }
    const compilation = compilePatientOwnedMeasurement({
      schemaVersion: 1,
      id: `patient-owned-measurement-request.test.pipeline-${coordinate}`,
      patientStateId: patientState.id,
      measurementDefinition: definition,
      valueProfile: PatientOwnedMeasurementValueProfileSchema.parse({
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: `patient-owned-measurement-profile.test.pipeline-${coordinate}`,
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
      }),
      sourceDefinitionRef: {
        id: pipelineMeasurementSourceDefinition.id,
        contentVersion: pipelineMeasurementSourceDefinition.contentVersion,
      },
      sourceInstanceCompilation: sourceCompilation.value,
      timeScopeId: 'time-scope.current',
    });
    if (!compilation.ok) throw new Error(compilation.error.message);
    return compilation.value;
  };
  const weightCompilation = compileMeasurement(pipelineWeightDefinition, 82.4, 'weight');
  const heightCompilation = includeDerivedBodyMassIndex
    ? compileMeasurement(pipelineHeightDefinition, 170, 'height')
    : null;
  const generatedObservationCompilation = useGeneratedCategoricalObservations
    ? (() => {
        const generationProfile = GeneratedCategoricalObservationValueProfileSchema.parse({
          schemaVersion: 1,
          contentVersion: '1.0.0',
          id: 'observation-generation-profile.test.pipeline-appearance',
          observationDefinitionRef: {
            id: pipelineAppearanceDefinition.id,
            contentVersion: pipelineAppearanceDefinition.contentVersion,
          },
          priority: 0,
          when: {
            anyDiagnosisIds: [],
            allClinicalTagIds: [],
          },
          valueOptions: pipelineAppearanceDefinition.allowedValueIds.map((valueId, index) => ({
            id: `observation-generation-option.test.pipeline-appearance.${index + 1}`,
            valueId,
            displayValue: `Synthetic pipeline appearance ${index + 1}`,
            relativeWeight: 1,
          })),
          sourceUseNoteIds: [],
          medicalReviewStatus: 'unreviewed',
          review: {
            status: 'unreviewed',
            reviewerId: null,
            reviewedAt: null,
            sourceUseNoteIds: [],
          },
        });
        const compilation = compileGeneratedCategoricalObservation({
          schemaVersion: 1,
          id: 'generated-categorical-observation-request.test.pipeline-appearance',
          patientStateId: patientState.id,
          seed: 'seed.test.pipeline-initial-generated-appearance',
          observationDefinition: pipelineAppearanceDefinition,
          generationContext: {
            ageYears: patientState.demographics.ageYears,
            sexForReference: patientState.demographics.sexForReference,
            diagnosisIds: [
              ...new Set(
                patientState.conditionStates.map((condition) => condition.diagnosisDefinitionId),
              ),
            ].sort(),
            clinicalTagIds: [...patientState.clinicalTagIds].sort(),
          },
          generationProfiles: [generationProfile],
          sourceDefinitionRef: {
            id: pipelineClinicianObservationSourceDefinition.id,
            contentVersion: pipelineClinicianObservationSourceDefinition.contentVersion,
          },
          sourceInstanceCompilation: sourceCompilation.value,
          timeScopeId: 'time-scope.current',
        });
        if (!compilation.ok) throw new Error(compilation.error.message);
        return compilation.value;
      })()
    : null;
  const collection = compilePatientClinicalResultCollection({
    schemaVersion: 1,
    id: 'patient-clinical-result-collection-request.test.pipeline',
    patientStateId: patientState.id,
    sourceInstanceCompilation: sourceCompilation.value,
    numericStructuredTestCompilations: [],
    patientOwnedStructuredTestCompilations: [],
    measurementCompilations:
      heightCompilation === null ? [weightCompilation] : [heightCompilation, weightCompilation],
    categoricalObservationCompilations:
      generatedObservationCompilation === null ? [] : [generatedObservationCompilation],
  });
  if (!collection.ok) throw new Error(collection.error.message);
  const derivedMeasurementMaterializations = [];
  if (heightCompilation !== null) {
    const derivation = compileBodyMassIndexDerivation({
      schemaVersion: 1,
      id: 'body-mass-index-derivation-request.test.pipeline',
      patientStateId: patientState.id,
      derivationDefinition: pipelineBodyMassIndexDerivationDefinition,
      heightMeasurementDefinition: pipelineHeightDefinition,
      weightMeasurementDefinition: pipelineWeightDefinition,
      outputMeasurementDefinition: pipelineBodyMassIndexDefinition,
      resultCollectionCompilation: collection.value,
      heightResolvedMeasurementId: heightCompilation.resolvedMeasurement.id,
      weightResolvedMeasurementId: weightCompilation.resolvedMeasurement.id,
    });
    if (!derivation.ok) throw new Error(derivation.error.message);
    const materialization = materializeBodyMassIndexMeasurement({
      schemaVersion: 1,
      id: 'body-mass-index-measurement-materialization-request.test.pipeline',
      derivationCompilation: derivation.value,
    });
    if (!materialization.ok) throw new Error(materialization.error.message);
    derivedMeasurementMaterializations.push(materialization.value);
  }
  const recipeCompilation = compileTestPatientTemplateClinicalResultRecipe({
    coordinate: `pipeline.${includeDerivedBodyMassIndex ? 'with-bmi' : 'direct-only'}`,
    patientStateCompositionArtifact,
    resultCollectionCompilation: collection.value,
    derivedMeasurementMaterializations,
  });
  const attachment = attachPatientClinicalResults({
    schemaVersion: 1,
    id: 'patient-clinical-result-attachment-request.test.pipeline',
    patientStateCompositionArtifact,
    templateClinicalResultRecipeCompilation: recipeCompilation,
  });
  if (!attachment.ok) throw new Error(attachment.error.message);
  return attachment.value;
};

const makePostCompositionPatientStateAssembly = (
  patientStateCompositionArtifact: ResolvedPatientStateCompositionArtifact,
  durationSourceValidationArtifact: ConditionClinicalDurationSourceValidationArtifact | null,
  functionalImpairmentSourceValidationArtifact: ConditionFunctionalImpairmentSourceValidationArtifact | null,
  includeClinicalResult = false,
  includeDerivedBodyMassIndex = false,
  useGeneratedMeasurements = false,
  useGeneratedCategoricalObservations = false,
) => {
  const assembly = assemblePostCompositionPatientState({
    schemaVersion: 1,
    id: 'post-composition-patient-state-assembly-request.test.pipeline',
    patientStateCompositionArtifact,
    conditionClinicalDurationSourceValidationArtifact: durationSourceValidationArtifact,
    conditionFunctionalImpairmentSourceValidationArtifact:
      functionalImpairmentSourceValidationArtifact,
    patientClinicalResultAttachmentArtifact: includeClinicalResult
      ? makePatientClinicalResultAttachment(
          patientStateCompositionArtifact,
          includeDerivedBodyMassIndex,
          useGeneratedMeasurements,
          useGeneratedCategoricalObservations,
        )
      : null,
  });
  if (!assembly.ok) throw new Error(assembly.error.message);
  return assembly.value;
};

const makeRequestFixture = (
  options: PipelineRequestOptions = {},
): {
  readonly request: FindingPipelineAuditRequest;
  readonly slotSelection: ReturnType<typeof compilePipelineSlotSelection>;
} => {
  if (
    (options.includeCheckedInManiaHistoryResult === true ||
      options.includeCheckedInPsychosisHistoryResult === true ||
      options.includeCheckedInSuicideSafetyResult === true) &&
    options.useCheckedInMddFindingProfile !== true
  ) {
    throw new Error('Checked-in history results require the checked-in MDD fixture.');
  }
  if (
    options.useCheckedInMddDecisionPolicy === true &&
    (options.useCheckedInMddFindingProfile !== true ||
      options.includeCheckedInSuicideSafetyResult !== true)
  ) {
    throw new Error(
      'The checked-in MDD decision-policy proof requires checked-in MDD findings and safety result.',
    );
  }
  if (
    options.useCheckedInMddDecisionBalances === true &&
    options.useCheckedInMddDecisionPolicy !== true
  ) {
    throw new Error('Checked-in MDD balances require the checked-in MDD decision policy.');
  }
  if (
    options.useCheckedInMddDepressiveSyndromeBalance === true &&
    options.useCheckedInMddDecisionBalances !== true
  ) {
    throw new Error('The depressive-syndrome balance extends the checked-in MDD balance fixture.');
  }
  if (
    options.useCheckedInMddPrimaryRouteBalance === true &&
    options.useCheckedInMddDepressiveSyndromeBalance !== true
  ) {
    throw new Error(
      'The primary-route balance extends the expanded checked-in MDD balance fixture.',
    );
  }
  if (
    options.useCheckedInMddCoverageAuditRules === true &&
    options.useCheckedInMddDecisionPolicy !== true
  ) {
    throw new Error('The checked-in MDD coverage audit requires the checked-in decision policy.');
  }
  if (
    options.includeCheckedInAccurateStructuredHistoryReports === true &&
    options.useCheckedInMddFindingProfile !== true
  ) {
    throw new Error(
      'The checked-in accurate structured-history proof requires the generated MDD fixture.',
    );
  }
  if (
    options.includeCheckedInMddDiagnosisSelection === true &&
    options.useCheckedInMddFindingProfile !== true
  ) {
    throw new Error(
      'The checked-in MDD diagnosis-selection proof requires the generated MDD fixture.',
    );
  }
  if (
    options.useCheckedInMddFunctionalImpactProfile === true &&
    (options.useCheckedInMddFindingProfile !== true ||
      options.includeConditionScopedDuration !== true ||
      options.useCheckedInMddDurationProfile !== true ||
      options.omitConditionScopedDurationResultProjection === true)
  ) {
    throw new Error(
      'The checked-in MDD functional-impact proof requires the complete checked-in initial-assessment finding, duration, and result owners.',
    );
  }
  if (
    options.includeCheckedInAccurateStructuredHistoryReports === true &&
    options.includeStructuredReport === true
  ) {
    throw new Error('The checked-in and synthetic structured-report fixtures cannot be combined.');
  }
  const mddDiagnosisDefinitionContentVersion =
    options.useCheckedInMddFindingProfile === true
      ? checkedInMddFindingProfile.conditionScope.diagnosisDefinitionContentVersion
      : '1.0.0';
  const selectedDecisionPolicy =
    options.useCheckedInMddDecisionPolicy === true
      ? checkedInMddDecisionPolicy
      : decisionPolicy(mddDiagnosisDefinitionContentVersion);
  const selectedDecisionRules =
    options.useCheckedInMddDecisionPolicy === true
      ? options.useCheckedInMddCoverageAuditRules === true
        ? checkedInMddCoverageAuditDecisionCandidates
        : options.useCheckedInMddDecisionBalances === true
          ? options.useCheckedInMddPrimaryRouteBalance === true
            ? checkedInMddPrimaryRouteBalancedDecisionCandidates
            : options.useCheckedInMddDepressiveSyndromeBalance === true
              ? checkedInMddExpandedBalancedDecisionCandidates
              : checkedInMddBalancedDecisionCandidates
          : checkedInMddQualitativeDecisionCandidates
      : [
          ...(options.decisionRules ??
            decisionRules(
              mddDiagnosisDefinitionContentVersion,
              options.useCheckedInMddFindingProfile === true
                ? checkedInMddDepressiveSymptomsActionResultAssembly.actionCatalog.actions[0]!.id
                : depressiveSymptomsAction.id,
            )),
        ];
  const depressiveSymptomsInformationAction =
    options.useCheckedInMddFindingProfile === true
      ? checkedInMddDepressiveSymptomsActionResultAssembly.actionCatalog.actions[0]!
      : depressiveSymptomsAction;
  const maniaHistoryInformationAction =
    checkedInManiaHistoryActionResultAssembly.actionCatalog.actions[0]!;
  const psychosisHistoryInformationAction =
    checkedInPsychosisHistoryActionResultAssembly.actionCatalog.actions[0]!;
  const suicideSafetyInformationAction =
    checkedInSuicideSafetyActionResultAssembly.actionCatalog.actions[0]!;
  const presentingProblemInformationAction =
    checkedInMddInitialAssessmentActionResultAssembly.actionCatalog.actions.find(
      (action) => action.id === 'info.history.presenting-problem',
    )!;
  const softTarget =
    options.useCheckedInMddFunctionalImpactProfile === true
      ? checkedInMddFunctionalImpactFinding
      : options.softTarget === 'core'
        ? coreFinding
        : textureFinding;
  const sharedFindingRecipe =
    options.useCheckedInMddFindingProfile === true
      ? makeCheckedInMddProjectionRecipe(
          'seed.pending-d233-authority',
          options.useCheckedInMddFunctionalImpactProfile === true,
        )
      : makeProjectionRecipe(softTarget !== coreFinding, 'seed.pending-d233-authority');
  if (options.includeFindingSourceReportBridge === true) {
    prepareFindingSourceReportProjections(sharedFindingRecipe);
  }
  const includeClinicalResult =
    options.includeClinicalResult === true ||
    options.includeDerivedBodyMassIndex === true ||
    options.useGeneratedMeasurements === true ||
    options.useGeneratedCategoricalObservations === true;
  const decisionActionHorizon: CatalogInstanceCompileRequest['decisionActionHorizon'] = {
    schemaVersion: 1,
    id: 'decision-action-horizon.test.pipeline',
    informationActionIds: [
      ...(options.useCheckedInMddFunctionalImpactProfile === true
        ? [presentingProblemInformationAction.id]
        : []),
      depressiveSymptomsInformationAction.id,
      ...(options.includeCheckedInManiaHistoryResult === true
        ? [maniaHistoryInformationAction.id]
        : []),
      ...(options.includeCheckedInPsychosisHistoryResult === true
        ? [psychosisHistoryInformationAction.id]
        : []),
      ...(options.includeCheckedInSuicideSafetyResult === true
        ? [suicideSafetyInformationAction.id]
        : []),
      ...(options.includeCheckedInAccurateStructuredHistoryReports === true
        ? [
            checkedInMedicationReconciliationActionResultAssembly.actionCatalog.actions[0]!.id,
            checkedInReactionHistoryActionResultAssembly.actionCatalog.actions[0]!.id,
            checkedInSubstanceUseActionResultAssembly.actionCatalog.actions[0]!.id,
          ]
        : []),
      ...(options.useCheckedInMddFindingProfile === true && includeClinicalResult
        ? [depressiveSymptomsAction.id]
        : []),
    ],
    startMedicationIds: ['medication.bupropion'],
    regimenEntryOperations: [],
    interventionIds: options.includeServiceBackedIntervention
      ? ['intervention.test.pipeline-brief-counseling']
      : [],
    dispositionIds: ['disposition.outpatient'],
  };
  const diagnosisSelectionHorizon: CatalogInstanceCompileRequest['diagnosisSelectionHorizon'] = {
    schemaVersion: 1,
    id: 'diagnosis-selection-horizon.test.pipeline',
    allowEmptySelection: true,
    options:
      options.includeCheckedInMddDiagnosisSelection === true
        ? [
            {
              id: 'diagnosis-option.generated-mdd.major-depressive-disorder',
              diagnosisDefinitionId: checkedInMddDiagnosis.id,
              diagnosisDefinitionContentVersion: checkedInMddDiagnosis.contentVersion,
            },
          ]
        : [],
  };
  const universalActionResultAssemblyRecipe =
    options.useCheckedInMddFindingProfile === true
      ? structuredClone(
          options.useCheckedInMddFunctionalImpactProfile === true
            ? checkedInMddInitialAssessmentActionResultAssembly
            : checkedInMddDepressiveSymptomsActionResultAssembly,
        )
      : makeUniversalActionResultAssemblyRecipe();
  if (options.includeCheckedInManiaHistoryResult === true) {
    addCheckedInManiaHistoryResult(sharedFindingRecipe, universalActionResultAssemblyRecipe);
  }
  if (options.includeCheckedInPsychosisHistoryResult === true) {
    addCheckedInPsychosisHistoryResult(sharedFindingRecipe, universalActionResultAssemblyRecipe);
  }
  if (options.includeCheckedInSuicideSafetyResult === true) {
    addCheckedInSuicideSafetyResult(sharedFindingRecipe, universalActionResultAssemblyRecipe);
  }
  if (options.includeCheckedInAccurateStructuredHistoryReports === true) {
    addCheckedInAccurateStructuredHistoryResults(universalActionResultAssemblyRecipe);
  }
  if (options.useCheckedInMddFindingProfile === true && includeClinicalResult) {
    universalActionResultAssemblyRecipe.actionCatalog.actions.push(depressiveSymptomsAction);
  }
  const syntheticClinicalResultRecipe =
    (): UniversalActionResultAssemblyRecipe['recipes'][number] => {
      const existing = universalActionResultAssemblyRecipe.recipes.find(
        (recipe) => recipe.informationActionId === depressiveSymptomsAction.id,
      );
      if (existing !== undefined) return existing;
      const created: UniversalActionResultAssemblyRecipe['recipes'][number] = {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'universal-action-result-recipe.test.pipeline-synthetic-clinical-results',
        modelVersion: 'universal-action-result.v1',
        informationActionId: depressiveSymptomsAction.id,
        informationActionPayloadFingerprint:
          fingerprintInformationActionPayload(depressiveSymptomsAction),
        sourceKinds: ['measurements'],
        lifecycle: 'approved',
        medicalReviewStatus: 'unreviewed',
      };
      universalActionResultAssemblyRecipe.recipes.push(created);
      return created;
    };
  if (includeClinicalResult) {
    universalActionResultAssemblyRecipe.measurementDefinitions.push(
      ...(options.includeDerivedBodyMassIndex === true
        ? [pipelineHeightDefinition, pipelineWeightDefinition, pipelineBodyMassIndexDefinition]
        : [pipelineWeightDefinition]),
    );
    const recipe = syntheticClinicalResultRecipe();
    if (!recipe.sourceKinds.includes('measurements')) {
      recipe.sourceKinds.push('measurements');
    }
  }
  if (options.useGeneratedCategoricalObservations === true) {
    universalActionResultAssemblyRecipe.categoricalObservationDefinitions.push(
      pipelineAppearanceDefinition,
    );
    const recipe = syntheticClinicalResultRecipe();
    if (!recipe.sourceKinds.includes('categorical_observations')) {
      recipe.sourceKinds.push('categorical_observations');
    }
  }
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
      durationProfileContentVersion: '1.0.0',
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
  if (
    options.includeConditionScopedDuration &&
    options.omitConditionScopedDurationResultProjection !== true &&
    options.useCheckedInMddFunctionalImpactProfile !== true
  ) {
    universalActionResultAssemblyRecipe.targetScopedPatientValueProjectionDefinitions.push({
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'target-scoped-definition.test.pipeline-mdd-duration',
      modelVersion: 'target-scoped-patient-value-projection.v1',
      label: 'Current depressive episode duration',
      informationActionId: depressiveSymptomsAction.id,
      informationActionPayloadFingerprint:
        fingerprintInformationActionPayload(depressiveSymptomsAction),
      valueKind: 'clinical_duration',
      durationProfileId:
        options.useCheckedInMddDurationProfile === true
          ? checkedInMddDurationProfile.id
          : 'duration-profile.test.pipeline-mdd-current',
      durationProfileContentVersion:
        options.useCheckedInMddDurationProfile === true
          ? checkedInMddDurationProfile.contentVersion
          : '1.0.0',
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
    if (
      !universalActionResultAssemblyRecipe.recipes[0]!.sourceKinds.includes(
        'target_scoped_patient_value_reveals',
      )
    ) {
      universalActionResultAssemblyRecipe.recipes[0]!.sourceKinds.push(
        'target_scoped_patient_value_reveals',
      );
    }
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
    options.includeFindingSourceReportBridge === true,
    mddDiagnosisDefinitionContentVersion,
    sharedFindingRecipe.projectionHorizon.id,
    {
      id: universalActionResultAssemblyRecipe.id,
      contentVersion: universalActionResultAssemblyRecipe.contentVersion,
    },
    selectedDecisionPolicy,
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
    options.includeCheckedInAccurateStructuredHistoryReports === true
      ? selectFixedStructuredReports({
          template,
          assembly: universalActionResultAssemblyRecipe,
          profiles: checkedInAccurateStructuredHistoryProfiles,
          seed: patientGenerationSeed,
        })
      : structuredReactionDefinition === null
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
              : options.includeFindingSourceReportBridge === true
                ? selectFindingSourceReportOptionalFeature(template, patientGenerationSeed)
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
  if (options.includeFindingSourceReportBridge === true) {
    attachFindingSourceReportProjectionPolicy(
      sharedFindingRecipe,
      conditionSetup.optionalFeatureArtifact,
    );
  }
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
  const conditionClinicalDurationSourceValidationArtifact =
    options.includeConditionScopedDuration === true
      ? makeConditionDurationSourceValidation(
          patientStateCompositionArtifact,
          patientGenerationSeed,
          options.useCheckedInMddDurationProfile === true,
        )
      : null;
  const conditionFunctionalImpairmentSourceValidationArtifact =
    options.includeFunctionalImpairment === true
      ? makeConditionFunctionalImpairmentSourceValidation(
          patientStateCompositionArtifact,
          patientGenerationSeed,
        )
      : null;
  const postCompositionPatientStateAssemblyArtifact =
    conditionClinicalDurationSourceValidationArtifact === null &&
    conditionFunctionalImpairmentSourceValidationArtifact === null &&
    !includeClinicalResult
      ? null
      : makePostCompositionPatientStateAssembly(
          patientStateCompositionArtifact,
          conditionClinicalDurationSourceValidationArtifact,
          conditionFunctionalImpairmentSourceValidationArtifact,
          includeClinicalResult,
          options.includeDerivedBodyMassIndex === true,
          options.useGeneratedMeasurements === true,
          options.useGeneratedCategoricalObservations === true,
        );
  const conditionFinding = selectConditionFindings(
    preFindingPatientStateOrchestrationArtifact.conditionSource,
    patientGenerationSeed,
    options.useCheckedInMddFindingProfile === true,
  );
  if (options.useCheckedInMddFindingProfile === true) {
    const definitionByKey = new Map<string, FindingDefinition>(
      checkedInMddFindingDefinitions.map(
        (definition) => [`${definition.id}@${definition.contentVersion}`, definition] as const,
      ),
    );
    const existingDefinitionKeys = new Set(
      sharedFindingRecipe.findingDefinitions.map(
        (definition) => `${definition.id}@${definition.contentVersion}`,
      ),
    );
    for (const candidate of conditionFinding.candidates) {
      const key = `${candidate.findingDefinitionId}@${candidate.findingDefinitionContentVersion}`;
      if (existingDefinitionKeys.has(key)) continue;
      const definition = definitionByKey.get(key);
      if (definition === undefined) {
        throw new Error(`Missing checked-in D-197 finding definition ${key}.`);
      }
      sharedFindingRecipe.findingDefinitions.push(definition);
      existingDefinitionKeys.add(key);
    }
  }
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
    mddDiagnosisDefinitionContentVersion,
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
      patientTemplatePostCompositionAssemblyOrchestrationArtifact: null,
      postCompositionPatientStateAssemblyArtifact,
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
                  durationProfileContentVersion: '1.0.0',
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
          decisionPolicy: selectedDecisionPolicy,
          decisionRules: selectedDecisionRules,
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

const makeClinicalResultMaterializationContextFixture = (options: PipelineRequestOptions = {}) => {
  const requestFixture = makeRequestFixture({
    ...options,
    includeDerivedBodyMassIndex: true,
  });
  const request = requestFixture.request;
  const assembly = request.postCompositionPatientStateAssemblyArtifact;
  const attachment = assembly?.assemblyRequest.patientClinicalResultAttachmentArtifact ?? null;
  if (attachment === null) {
    throw new Error('Expected one synthetic D-311 clinical-result attachment.');
  }
  const recipeCompilation = attachment.attachmentRequest.templateClinicalResultRecipeCompilation;
  const collection = recipeCompilation.compileRequest.resultCollectionCompilation;
  const exactById = <Entry extends { readonly id: string }>(entries: readonly Entry[]): Entry[] => [
    ...new Map(entries.map((entry) => [entry.id, entry] as const)).values(),
  ];
  const derivedCompilations =
    recipeCompilation.compileRequest.derivedMeasurementMaterializations.map(
      (materialization) => materialization.materializationRequest.derivationCompilation,
    );
  const resourceSet = PatientClinicalResultResourceSetSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-clinical-result-resource-set.test.pipeline-materialization-context',
    testDefinitions: exactById([
      ...collection.compileRequest.numericStructuredTestCompilations.map(
        (compilation) => compilation.compileRequest.testDefinition,
      ),
      ...collection.compileRequest.patientOwnedStructuredTestCompilations.map(
        (compilation) => compilation.compileRequest.testDefinition,
      ),
    ]),
    referenceIntervalSets: exactById(
      collection.compileRequest.numericStructuredTestCompilations.flatMap(
        (compilation) => compilation.compileRequest.referenceIntervalSets,
      ),
    ),
    patientOwnedTestResultProfiles: exactById(
      collection.compileRequest.patientOwnedStructuredTestCompilations.map(
        (compilation) => compilation.compileRequest.resultProfile,
      ),
    ),
    measurementDefinitions: exactById([
      ...collection.compileRequest.measurementCompilations.map(
        (compilation) => compilation.compileRequest.measurementDefinition,
      ),
      ...derivedCompilations.map(
        (compilation) => compilation.compileRequest.outputMeasurementDefinition,
      ),
    ]),
    patientOwnedMeasurementValueProfiles: exactById(
      collection.compileRequest.measurementCompilations.flatMap((compilation) =>
        'valueProfile' in compilation.compileRequest
          ? [compilation.compileRequest.valueProfile]
          : [],
      ),
    ),
    generatedMeasurementValueProfiles: exactById(
      collection.compileRequest.measurementCompilations.flatMap((compilation) =>
        'generationProfiles' in compilation.compileRequest
          ? compilation.compileRequest.generationProfiles
          : [],
      ),
    ),
    categoricalObservationDefinitions: exactById(
      collection.compileRequest.categoricalObservationCompilations.map(
        (compilation) => compilation.compileRequest.observationDefinition,
      ),
    ),
    patientOwnedCategoricalObservationValueProfiles: exactById(
      collection.compileRequest.categoricalObservationCompilations.flatMap((compilation) =>
        'valueProfile' in compilation.compileRequest
          ? [compilation.compileRequest.valueProfile]
          : [],
      ),
    ),
    generatedCategoricalObservationValueProfiles: exactById(
      collection.compileRequest.categoricalObservationCompilations.flatMap((compilation) =>
        'generationProfiles' in compilation.compileRequest
          ? compilation.compileRequest.generationProfiles
          : [],
      ),
    ),
    bodyMassIndexDerivationDefinitions: exactById(
      derivedCompilations.map((compilation) => compilation.compileRequest.derivationDefinition),
    ),
    sourceDefinitionCatalog:
      collection.compileRequest.sourceInstanceCompilation.compileRequest.sourceDefinitionCatalog,
  });
  const resourceCoverage = compilePatientTemplateClinicalResultResourceCoverage({
    schemaVersion: 1,
    id: 'patient-template-clinical-result-resource-coverage-request.test.pipeline-context',
    recipeHorizonArtifact: recipeCompilation.compileRequest.recipeHorizonArtifact,
    resourceSet,
  });
  if (!resourceCoverage.ok) throw new Error(resourceCoverage.error.message);
  const contextRequest = {
    schemaVersion: 1 as const,
    id: 'patient-template-clinical-result-materialization-context-request.test.pipeline',
    patientSlotFillSeedAuthorityArtifact: request.patientSlotFillSeedAuthorityArtifact,
    patientStateCompositionArtifact:
      request.preFindingPatientStateOrchestrationArtifact.patientStateCompositionArtifact,
    resourceCoverageArtifact: resourceCoverage.value,
  };
  return {
    ...requestFixture,
    request,
    resourceSet,
    resourceCoverage: resourceCoverage.value,
    contextRequest,
  };
};

const compileClinicalResultMaterializationFixture = (options: PipelineRequestOptions = {}) => {
  const fixture = makeClinicalResultMaterializationContextFixture(options);
  const context = compilePatientTemplateClinicalResultMaterializationContext(
    fixture.contextRequest,
  );
  if (!context.ok) throw new Error(`${context.error.code}: ${context.error.message}`);
  const materialization = compilePatientTemplateClinicalResultMaterialization({
    schemaVersion: 1,
    id: 'patient-template-clinical-result-materialization-request.test.attachment-orchestration',
    materializationContextArtifact: context.value,
  });
  if (!materialization.ok) {
    throw new Error(`${materialization.error.code}: ${materialization.error.message}`);
  }
  return { ...fixture, context: context.value, materialization: materialization.value };
};

const compileClinicalResultAttachmentOrchestrationFixture = (
  options: PipelineRequestOptions = {},
) => {
  const fixture = compileClinicalResultMaterializationFixture(options);
  const attachment = orchestratePatientTemplateClinicalResultAttachment({
    schemaVersion: 1,
    id: 'patient-template-clinical-result-attachment-orchestration-request.test.post-composition',
    materializationArtifact: fixture.materialization,
  });
  if (!attachment.ok) {
    throw new Error(`${attachment.error.code}: ${attachment.error.message}`);
  }
  return { ...fixture, attachmentOrchestration: attachment.value };
};

const makeCanonicalResultEnabledFindingPipelineRequest = (options: PipelineRequestOptions = {}) => {
  const fixture = compileClinicalResultAttachmentOrchestrationFixture(options);
  const existingAssembly = fixture.request.postCompositionPatientStateAssemblyArtifact;
  if (existingAssembly === null) {
    throw new Error('Expected one synthetic result-enabled D-312 fixture.');
  }
  const orchestration = orchestratePatientTemplatePostCompositionAssembly({
    schemaVersion: 1,
    id: `patient-template-post-composition-assembly-orchestration-request.test.d200.${options.generationRoot ?? 'default'}`,
    clinicalResultAttachmentOrchestrationArtifact: fixture.attachmentOrchestration,
    conditionClinicalDurationSourceValidationArtifact:
      existingAssembly.assemblyRequest.conditionClinicalDurationSourceValidationArtifact,
    conditionFunctionalImpairmentSourceValidationArtifact:
      existingAssembly.assemblyRequest.conditionFunctionalImpairmentSourceValidationArtifact,
  });
  if (!orchestration.ok) {
    throw new Error(`${orchestration.error.code}: ${orchestration.error.message}`);
  }
  const request = FindingPipelineAuditRequestSchema.parse({
    ...fixture.request,
    patientTemplatePostCompositionAssemblyOrchestrationArtifact: orchestration.value,
    postCompositionPatientStateAssemblyArtifact: null,
  });
  return {
    ...fixture,
    request,
    postCompositionOrchestration: orchestration.value,
  };
};

const makeClinicalResultFindingPipelineOrchestrationFixture = (
  options: PipelineRequestOptions = {},
) => {
  const fixture = makeClinicalResultMaterializationContextFixture(options);
  const resultBearingAssembly = fixture.request.postCompositionPatientStateAssemblyArtifact;
  if (resultBearingAssembly === null) {
    throw new Error('Expected one synthetic result-bearing D-312 fixture.');
  }
  const duration =
    resultBearingAssembly.assemblyRequest.conditionClinicalDurationSourceValidationArtifact;
  const impairment =
    resultBearingAssembly.assemblyRequest.conditionFunctionalImpairmentSourceValidationArtifact;
  const resultFreeAssembly =
    duration === null && impairment === null
      ? null
      : makePostCompositionPatientStateAssembly(
          fixture.contextRequest.patientStateCompositionArtifact,
          duration,
          impairment,
        );
  const baseFindingPipelineAuditRequest = FindingPipelineAuditRequestSchema.parse({
    ...fixture.request,
    patientTemplatePostCompositionAssemblyOrchestrationArtifact: null,
    postCompositionPatientStateAssemblyArtifact: resultFreeAssembly,
  });
  return {
    ...fixture,
    orchestrationRequest: {
      schemaVersion: 1 as const,
      id: `patient-template-clinical-result-finding-pipeline-orchestration-request.test.${options.generationRoot ?? 'default'}`,
      baseFindingPipelineAuditRequest,
      resourceCoverageArtifact: fixture.resourceCoverage,
    },
  };
};

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
      ...[
        ...new Set(
          input.universalActionResultAssemblyRecipe.actionCatalog.actions.map(
            (action) => action.serviceId,
          ),
        ),
      ].map((serviceId) => ({
        schemaVersion: 1 as const,
        contentVersion: '1.0.0',
        id: serviceId,
        fulfillmentMethods: [
          {
            id: `fulfillment.test.${serviceId}`,
            requiredCapabilities: [],
          },
        ],
      })),
      ...(input.decisionActionHorizon.interventionIds.includes(
        'intervention.test.pipeline-brief-counseling',
      )
        ? [
            {
              schemaVersion: 1 as const,
              contentVersion: '1.0.0',
              id: 'service.test.pipeline-brief-counseling',
              fulfillmentMethods: [
                {
                  id: 'fulfillment.test.pipeline-brief-counseling.outside',
                  requiredCapabilities: [],
                },
                {
                  id: 'fulfillment.test.pipeline-brief-counseling.in-house',
                  requiredCapabilities: [],
                },
              ],
            },
          ]
        : []),
    ],
    medications: [
      {
        contentVersion: '1.0.0',
        id: 'medication.bupropion',
      },
    ],
    treatments: [
      ...(input.decisionActionHorizon.interventionIds.includes(
        'intervention.test.pipeline-brief-counseling',
      )
        ? [
            {
              schemaVersion: 1 as const,
              contentVersion: '1.0.0',
              id: 'intervention.test.pipeline-brief-counseling',
              label: 'Synthetic brief counseling',
              searchAliases: [],
              kind: 'nonmedication' as const,
              category: 'behavioral' as const,
              safeReferral: false,
              requiredCapabilities: [],
              fulfillmentServiceId: 'service.test.pipeline-brief-counseling',
            },
          ]
        : []),
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
    clinicalResultResourceCoverageArtifact: null,
  };
  return { ...fixture, input };
};

const makeClinicalResultFillFixture = (options: PipelineRequestOptions = {}) => {
  const fixture = makeClinicalResultFindingPipelineOrchestrationFixture(options);
  const input: EmptyAuthorizedPatientSlotFillCompileInput = {
    schemaVersion: 1,
    id: `empty-authorized-patient-slot-fill-request.test.clinical-results.${options.generationRoot ?? 'default'}`,
    seedAuthorityCompileInput: fixture.slotSelection.patientSlotFillSeedAuthorityCompileInput,
    seedAuthorityArtifact: fixture.slotSelection.patientSlotFillSeedAuthorityArtifact,
    findingPipelineAuditRequest: fixture.orchestrationRequest.baseFindingPipelineAuditRequest,
    clinicalResultResourceCoverageArtifact: fixture.resourceCoverage,
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
        kind: method.id.endsWith('.outside')
          ? ('outside_referral' as const)
          : ('in_house' as const),
        operatingCost: method.id.endsWith('.outside')
          ? 60
          : method.id.endsWith('.in-house')
            ? 20
            : 25,
        qualityModifier: 1,
      })),
    })),
  };
};

const generatedSettlementForWaiting = (
  waitingSlot: FrozenGeneratedWaitingSlot,
  options: {
    readonly baseReimbursement?: number;
    readonly challengeBonus?: number;
    readonly clinicPoints?: number;
    readonly lifetimePointsEarned?: number;
    readonly satisfaction?: number;
  } = {},
): GeneratedCompletedEncounterAttemptCompileInput['settlement'] => {
  const audit = waitingSlot.findingPipelineAuditArtifact;
  const snapshot = audit.catalogSnapshot;
  if (snapshot === null) throw new Error('Expected a compiled catalog snapshot.');
  const operationalContext =
    snapshot.operationalAdmissionArtifact.compileRequest.selectedLocationResourceArtifact
      .compileRequest.clinicOperationalContext;
  const satisfactionConfiguration = {
    schemaVersion: 1 as const,
    contentVersion: '1.0.0',
    curve: 'rational_half_saturation' as const,
    halfSaturationPoints: 20,
    multiplierCap: 1.15,
  };
  const satisfaction = options.satisfaction ?? 0;
  const satisfactionState = calculateSatisfactionState(satisfaction, satisfactionConfiguration);
  return {
    producerRef: {
      id: 'engine.generated-settlement.test',
      contentVersion: '1.0.0',
    },
    economyPolicy: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: `economy-policy.test.${snapshot.template.id}`,
      modelVersion: 'generated-encounter-economy-policy.v1',
      label: 'Synthetic generated-encounter economy',
      templateRef: {
        id: snapshot.template.id,
        contentVersion: snapshot.template.contentVersion,
      },
      templateFingerprint: audit.patientSlotFillSeedAuthorityArtifact.selectedTemplateFingerprint,
      balanceStatus: 'provisional_balance',
      baseReimbursement: options.baseReimbursement ?? 400,
      challengeBonus: options.challengeBonus ?? 0,
    },
    clinicState: {
      schemaVersion: operationalContext.schemaVersion,
      id: operationalContext.clinicStateId,
      label: 'Synthetic generated-attempt clinic',
      facilityId: operationalContext.facilityId,
      facilityTier: operationalContext.facilityTier,
      locationIds: [...operationalContext.locationIds],
      activeLocationId: snapshot.location.id,
      departmentIds: [...operationalContext.departmentIds],
      capabilities: [],
      ownedUpgradeIds: [...operationalContext.ownedUpgradeIds],
      ownedEquipmentIds: [...operationalContext.ownedEquipmentIds],
      staffConfigurations: structuredClone(operationalContext.staffConfigurations),
      formularyIds: [...operationalContext.formularyIds],
      clinicPoints: options.clinicPoints ?? 0,
      lifetimePointsEarned: options.lifetimePointsEarned ?? 0,
      debugUnlocksAllProgression:
        audit.patientSlotFillSeedAuthorityArtifact.coordinates.mode !== 'standard',
      satisfaction: satisfactionState.rawPoints,
      satisfactionMultiplier: satisfactionState.multiplier,
    },
    satisfactionConfigurationOwner: {
      ownerRef: {
        id: 'registry.catalog.decor.test',
        contentVersion: satisfactionConfiguration.contentVersion,
      },
      configuration: satisfactionConfiguration,
    },
  };
};

const createNativeGeneratedAttempt = (input: {
  readonly attemptId: string;
  readonly mode: ProgressionMode;
  readonly frozenWaitingSlot: FrozenGeneratedWaitingSlot;
  readonly actionEvents?: readonly GeneratedEncounterActionEventInput[];
  readonly pointDerivation?: GeneratedCompletedEncounterAttemptCompileInput['pointDerivation'];
  readonly settlement?: GeneratedCompletedEncounterAttemptCompileInput['settlement'];
}) => {
  const snapshot = input.frozenWaitingSlot.findingPipelineAuditArtifact.catalogSnapshot;
  if (snapshot === null) throw new Error('Expected a compiled catalog snapshot.');
  const diagnosisDefinitionsById = new Map([
    [checkedInMddDiagnosis.id, checkedInMddDiagnosis] as const,
  ]);
  const diagnosisDefinitions = snapshot.encounterInstance.diagnosisSelectionHorizon.options.map(
    (option) => {
      const definition = diagnosisDefinitionsById.get(option.diagnosisDefinitionId);
      if (
        definition === undefined ||
        definition.contentVersion !== option.diagnosisDefinitionContentVersion
      ) {
        throw new Error(
          `No exact checked-in diagnosis owner is available for ${option.diagnosisDefinitionId}@${option.diagnosisDefinitionContentVersion}.`,
        );
      }
      return definition;
    },
  );
  const compileInput: GeneratedCompletedEncounterAttemptCompileInput = {
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
    diagnosisSelectionOwners: { definitions: diagnosisDefinitions },
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
    settlement: input.settlement ?? generatedSettlementForWaiting(input.frozenWaitingSlot),
  };
  const compiled = compileGeneratedCompletedEncounterAttempt(compileInput);
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
    patientTemplatePostCompositionAssemblyOrchestrationArtifact: null,
    postCompositionPatientStateAssemblyArtifact: null,
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
    patientTemplatePostCompositionAssemblyOrchestrationArtifact: null,
    postCompositionPatientStateAssemblyArtifact: null,
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
    expect(artifact.composerVersion).toBe('27.0.0');
    expect(artifact.patientSlotFillSeedAuthorityArtifact).toEqual(
      request.patientSlotFillSeedAuthorityArtifact,
    );
    expect(preFindingOf(artifact)).toEqual(preFindingOf(request));
    expect(patientStateCompositionOf(artifact)).toEqual(patientStateCompositionOf(request));
    expect(artifact.postCompositionPatientStateAssemblyArtifact).toBeNull();
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

  it('reuses one D-201 source-report cost to alter only the exact D-193 patient-report projection', () => {
    const request = makeRequest({ includeFindingSourceReportBridge: true });
    const optionalArtifact =
      preFindingOf(request).patientStateCompositionArtifact.compositionRequest
        .optionalFeatureArtifact;
    expect(optionalArtifact.selectedCount).toBe(1);
    expect(optionalArtifact.totalSpent).toBe(1);

    const artifact = expectComposed(request);
    if (artifact.catalogSnapshot === null) {
      throw new Error('Expected the D-258 fixture to retain one compiled catalog snapshot.');
    }
    const finding = artifact.catalogSnapshot.patientInstance.sharedFindingCompilation.findings.find(
      (entry) => entry.definitionId === coreFinding.id,
    );
    const projection =
      artifact.catalogSnapshot.patientInstance.sharedFindingCompilation.projections.find(
        (entry) => entry.projectionId === 'finding-projection.test.pipeline-low-energy-minimized',
      );
    expect(finding?.value).toEqual({ kind: 'outcome', value: 'present' });
    expect(projection).toMatchObject({
      response: { kind: 'finding_outcome', outcome: 'absent' },
      resolution: {
        sourceReportSelection: {
          complexityModule: {
            cost: 1,
            stableDrawId: optionalArtifact.candidateEvaluations[0]!.stableDrawId,
          },
        },
      },
    });
    expect(
      patientStateCompositionOf(artifact).selectedModuleAudits.find(
        (entry) => entry.moduleKind === 'source_report',
      ),
    ).toMatchObject({
      materializationStatus: 'deferred_to_post_truth',
      cost: 1,
      materializedRecordIds: [],
    });
    expect(
      artifact.catalogCompileRequest.sharedFindingRequest.findingSourceReportProjectionPolicy
        ?.optionalFeatureArtifact,
    ).toEqual(optionalArtifact);
    expect(verifyFindingPipelineAuditIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });

    const omitted = makeRequest({ includeFindingSourceReportBridge: true });
    delete downstreamOf(omitted).catalogCompileRecipe.sharedFindingRecipe
      .findingSourceReportProjectionPolicy;
    expect(composeFindingPipelineAudit(omitted)).toMatchObject({
      ok: false,
      error: { code: 'ARTIFACT_CHAIN_MISMATCH' },
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

  it('routes one verified D-312 condition-duration assembly through D-194 and D-240', () => {
    const request = makeRequest({ includeConditionScopedDuration: true });
    const postCompositionAssembly = request.postCompositionPatientStateAssemblyArtifact;
    if (postCompositionAssembly === null) {
      throw new Error('Expected one D-312 post-composition patient-state assembly.');
    }
    const durationSourceValidation =
      postCompositionAssembly.assemblyRequest.conditionClinicalDurationSourceValidationArtifact;
    if (durationSourceValidation === null) {
      throw new Error('Expected D-312 to retain one D-294 duration branch.');
    }
    const durationAttachment = durationSourceValidation.compileRequest.durationAttachment;
    expect(verifyPostCompositionPatientStateAssemblyIntegrity(postCompositionAssembly)).toEqual({
      ok: true,
      value: postCompositionAssembly,
    });
    expect(
      verifyConditionClinicalDurationSourceValidationIntegrity(durationSourceValidation),
    ).toEqual({
      ok: true,
      value: durationSourceValidation,
    });
    expect(verifyConditionClinicalDurationAttachmentIntegrity(durationAttachment)).toEqual({
      ok: true,
      value: durationAttachment,
    });
    expect(patientStateCompositionOf(request).composedPatientState?.clinicalDurations).toEqual([]);

    const artifact = expectComposed(request);
    if (artifact.catalogSnapshot === null) {
      throw new Error('Expected D-200 to retain one compiled D-194 snapshot.');
    }
    const snapshot = artifact.catalogSnapshot;
    const resolvedDuration = durationAttachment.composedPatientState.clinicalDurations[0];
    const targetArtifact =
      snapshot.universalActionResultArtifact.compileRequest
        .targetScopedPatientValueProjectionArtifact;
    const reveal = snapshot.patientInstance.targetScopedPatientValueReveals[0];

    expect(artifact.postCompositionPatientStateAssemblyArtifact).toEqual(postCompositionAssembly);
    expect(artifact.catalogCompileRequest.basePatientState).toEqual(
      postCompositionAssembly.composedPatientState,
    );
    expect(artifact.catalogCompileRequest.sharedFindingRequest.patientStateId).toBe(
      postCompositionAssembly.composedPatientState.id,
    );
    expect(snapshot.patientInstance.patientState.clinicalDurations).toContainEqual(
      resolvedDuration,
    );
    expect(targetArtifact?.compileRequest.patientState).toEqual(
      snapshot.patientInstance.patientState,
    );
    expect(targetArtifact?.evaluations).toContainEqual(
      expect.objectContaining({
        definitionId: 'target-scoped-definition.test.pipeline-mdd-duration',
        status: 'complete',
      }),
    );
    expect(reveal).toEqual(targetArtifact?.frozenReveals[0]);
    expect(reveal?.values).toContainEqual(
      expect.objectContaining({
        kind: 'clinical_duration',
        value: resolvedDuration?.value,
        unit: resolvedDuration?.unit,
        sourceKind: 'patient_report',
      }),
    );
    expect(
      durationAttachment.attachmentRequest.patientStateCompositionArtifact.compositionRequest
        .optionalFeatureArtifact.totalSpent,
    ).toBe(
      patientStateCompositionOf(request).compositionRequest.optionalFeatureArtifact.totalSpent,
    );
    expect(verifyFindingPipelineAuditIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(verifyFindingPipelineAuditContext({ artifact, request })).toEqual({
      ok: true,
      value: artifact,
    });

    const wrongSeedRequest = makeRequest({ includeConditionScopedDuration: true });
    wrongSeedRequest.postCompositionPatientStateAssemblyArtifact =
      makePostCompositionPatientStateAssembly(
        patientStateCompositionOf(wrongSeedRequest),
        makeConditionDurationSourceValidation(
          patientStateCompositionOf(wrongSeedRequest),
          'seed.test.pipeline-wrong-duration-root',
        ),
        null,
      );
    expect(composeFindingPipelineAudit(wrongSeedRequest)).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_SEED_CONTEXT_MISMATCH' },
    });

    const crossedRequest = makeRequest({ includeConditionScopedDuration: true });
    crossedRequest.postCompositionPatientStateAssemblyArtifact = makeRequest({
      includeConditionScopedDuration: true,
      generationRoot: 'generation-root.test.crossed-duration',
    }).postCompositionPatientStateAssemblyArtifact;
    expect(composeFindingPipelineAudit(crossedRequest)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const droppedAttachment = structuredClone(artifact);
    droppedAttachment.postCompositionPatientStateAssemblyArtifact = null;
    expect(verifyFindingPipelineAuditIntegrity(droppedAttachment)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });

    const legacyRawDuration = {
      ...request,
      postCompositionPatientStateAssemblyArtifact: undefined,
      conditionClinicalDurationSourceValidationArtifact: durationSourceValidation,
    };
    expect(FindingPipelineAuditRequestSchema.safeParse(legacyRawDuration).success).toBe(false);
  }, 15_000);

  it('preserves the canonical D-328 duration and clinical-result branches together through D-194', () => {
    const fixture = makeCanonicalResultEnabledFindingPipelineRequest({
      includeConditionScopedDuration: true,
    });
    const { request, postCompositionOrchestration } = fixture;
    const postCompositionAssembly = postCompositionOrchestration.postCompositionAssembly;
    expect(verifyPostCompositionPatientStateAssemblyIntegrity(postCompositionAssembly)).toEqual({
      ok: true,
      value: postCompositionAssembly,
    });
    expect(postCompositionAssembly.composedPatientState.clinicalDurations).toHaveLength(1);
    expect(postCompositionAssembly.composedPatientState.measurements).toHaveLength(3);

    const artifact = expectComposed(request);
    if (artifact.catalogSnapshot === null) {
      throw new Error('Expected D-200 to retain one compiled D-194 snapshot.');
    }
    expect(artifact.patientTemplatePostCompositionAssemblyOrchestrationArtifact).toEqual(
      postCompositionOrchestration,
    );
    expect(artifact.postCompositionPatientStateAssemblyArtifact).toEqual(postCompositionAssembly);
    expect(artifact.catalogCompileRequest.basePatientState).toEqual(
      postCompositionAssembly.composedPatientState,
    );
    expect(artifact.catalogSnapshot.patientInstance.patientState.clinicalDurations).toEqual(
      postCompositionAssembly.composedPatientState.clinicalDurations,
    );
    expect(artifact.catalogSnapshot.patientInstance.patientState.measurements).toEqual(
      postCompositionAssembly.composedPatientState.measurements,
    );
    expect(verifyFindingPipelineAuditIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(verifyFindingPipelineAuditContext({ artifact, request })).toEqual({
      ok: true,
      value: artifact,
    });

    const rawD312Bypass = {
      ...request,
      patientTemplatePostCompositionAssemblyOrchestrationArtifact: null,
      postCompositionPatientStateAssemblyArtifact: postCompositionAssembly,
    };
    expect(FindingPipelineAuditRequestSchema.safeParse(rawD312Bypass).success).toBe(false);
    expect(composeFindingPipelineAudit(rawD312Bypass)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  }, 90_000);

  it('routes D-318 BMI through canonical D-328 and the existing D-194/D-213/D-214 measurement path', () => {
    const fixture = makeCanonicalResultEnabledFindingPipelineRequest();
    const { request, postCompositionOrchestration } = fixture;
    const postCompositionAssembly = postCompositionOrchestration.postCompositionAssembly;
    const resultAttachment =
      postCompositionAssembly.assemblyRequest.patientClinicalResultAttachmentArtifact;
    if (resultAttachment === null) {
      throw new Error('Expected one D-311 derived-measurement attachment.');
    }
    expect(
      resultAttachment.attachmentRequest.templateClinicalResultRecipeCompilation.compileRequest
        .resultCollectionCompilation.measurements,
    ).toHaveLength(2);
    expect(
      resultAttachment.attachmentRequest.templateClinicalResultRecipeCompilation.compileRequest
        .derivedMeasurementMaterializations,
    ).toHaveLength(1);
    expect(postCompositionAssembly.composedPatientState.measurements).toHaveLength(3);
    const derivedMeasurement = postCompositionAssembly.composedPatientState.measurements.find(
      (measurement) => measurement.source.kind === 'derived_measurement',
    );
    expect(derivedMeasurement).toBeDefined();

    const artifact = expectComposed(request);
    if (artifact.catalogSnapshot === null || derivedMeasurement === undefined) {
      throw new Error('Expected one final D-194 snapshot with derived BMI.');
    }
    const snapshot = artifact.catalogSnapshot;
    expect(artifact.patientTemplatePostCompositionAssemblyOrchestrationArtifact).toEqual(
      postCompositionOrchestration,
    );
    expect(snapshot.patientInstance.patientState.measurements).toEqual(
      postCompositionAssembly.composedPatientState.measurements,
    );
    const requestMeasurementSources =
      snapshot.encounterInstance.resultBindingRequests[0]?.sources.filter(
        (source) => source.kind === 'measurement',
      ) ?? [];
    const frozenMeasurementSources =
      snapshot.encounterInstance.resultBindings[0]?.sources.filter(
        (source) => source.kind === 'measurement',
      ) ?? [];
    expect(requestMeasurementSources).toHaveLength(3);
    expect(requestMeasurementSources).toContainEqual({
      kind: 'measurement',
      measurementId: derivedMeasurement.id,
    });
    expect(frozenMeasurementSources).toHaveLength(3);
    expect(frozenMeasurementSources).toContainEqual({
      kind: 'measurement',
      measurementId: derivedMeasurement.id,
    });
    expect(snapshot.patientInstance.patientState.measurements).toContainEqual(derivedMeasurement);
    expect(verifyCatalogCompiledInstanceIntegrity(snapshot)).toEqual({
      ok: true,
      value: snapshot,
    });
    expect(verifyFindingPipelineAuditIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  }, 15_000);

  it('rejects crossed, tampered, or dropped D-328 authority at the D-200 result boundary', () => {
    const fixture = makeCanonicalResultEnabledFindingPipelineRequest();
    const artifact = expectComposed(fixture.request);
    expect(composeFindingPipelineAudit(fixture.request)).toEqual({
      ok: true,
      value: artifact,
    });

    const foreign = makeCanonicalResultEnabledFindingPipelineRequest({
      generationRoot: 'generation-root.test.foreign-d329',
    });
    const crossedRequest = {
      ...fixture.request,
      patientTemplatePostCompositionAssemblyOrchestrationArtifact:
        foreign.postCompositionOrchestration,
    };
    expect(FindingPipelineAuditRequestSchema.safeParse(crossedRequest).success).toBe(false);
    expect(composeFindingPipelineAudit(crossedRequest)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const tamperedRequest = structuredClone(fixture.request);
    tamperedRequest.patientTemplatePostCompositionAssemblyOrchestrationArtifact!.composedPatientStateId =
      'resolved-patient-state.test.tampered-d329';
    expect(composeFindingPipelineAudit(tamperedRequest)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const droppedAuthority = structuredClone(artifact);
    droppedAuthority.patientTemplatePostCompositionAssemblyOrchestrationArtifact = null;
    expect(verifyFindingPipelineAuditIntegrity(droppedAuthority)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  }, 30_000);

  it('orchestrates the complete result-free D-200 plus D-324 input through D-325–D-329', () => {
    const fixture = makeClinicalResultFindingPipelineOrchestrationFixture();
    const result = orchestratePatientTemplateClinicalResultFindingPipeline(
      fixture.orchestrationRequest,
    );
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    const artifact = result.value;
    const basePatient =
      fixture.orchestrationRequest.baseFindingPipelineAuditRequest
        .preFindingPatientStateOrchestrationArtifact.patientStateCompositionArtifact
        .composedPatientState;
    const finalPatient =
      artifact.findingPipelineAuditArtifact.catalogSnapshot?.patientInstance.patientState;

    expect(
      PatientTemplateClinicalResultFindingPipelineOrchestrationArtifactSchema.parse(artifact),
    ).toEqual(artifact);
    expect(basePatient?.measurements).toEqual([]);
    expect(finalPatient?.measurements).toHaveLength(3);
    expect(
      artifact.findingPipelineAuditArtifact
        .patientTemplatePostCompositionAssemblyOrchestrationArtifact,
    ).toEqual(artifact.resultPostCompositionOrchestrationArtifact);
    expect(
      artifact.findingPipelineAuditArtifact.postCompositionPatientStateAssemblyArtifact,
    ).toEqual(artifact.resultPostCompositionOrchestrationArtifact.postCompositionAssembly);
    expect(
      verifyPatientTemplateClinicalResultFindingPipelineOrchestrationIntegrity(artifact),
    ).toEqual({ ok: true, value: artifact });
    expect(
      orchestratePatientTemplateClinicalResultFindingPipeline(fixture.orchestrationRequest),
    ).toEqual(result);
    expect(artifact).not.toHaveProperty('pointRules');
    expect(artifact).not.toHaveProperty('complexityCost');
    expect(artifact).not.toHaveProperty('encounterState');
  }, 45_000);

  it('preserves one generated observation and its original D-356 draw through D-327–D-330', () => {
    const fixture = makeClinicalResultFindingPipelineOrchestrationFixture({
      useGeneratedCategoricalObservations: true,
    });
    const result = orchestratePatientTemplateClinicalResultFindingPipeline(
      fixture.orchestrationRequest,
    );
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    const artifact = result.value;
    const attachmentOrchestration =
      artifact.resultPostCompositionOrchestrationArtifact.compileRequest
        .clinicalResultAttachmentOrchestrationArtifact;
    const materialization = attachmentOrchestration.compileRequest.materializationArtifact;
    const recipeCompilation = materialization.templateClinicalResultRecipeCompilation;
    const collection = recipeCompilation.compileRequest.resultCollectionCompilation;
    const generatedCompilations =
      collection.compileRequest.categoricalObservationCompilations.filter(
        (compilation) => 'generationDraws' in compilation,
      );
    const generatedCompilation = generatedCompilations[0];
    if (generatedCompilation === undefined || !('generationDraws' in generatedCompilation)) {
      throw new Error('Expected one generated categorical-observation compilation.');
    }
    const attachedPatient =
      attachmentOrchestration.patientClinicalResultAttachment.composedPatientState;
    const finalPatient =
      artifact.findingPipelineAuditArtifact.catalogSnapshot?.patientInstance.patientState;
    if (finalPatient === undefined) throw new Error('Expected one compiled D-330 patient.');

    expect(generatedCompilations).toHaveLength(1);
    expect(generatedCompilation.compileRequest.seed).toBe(
      fixture.orchestrationRequest.baseFindingPipelineAuditRequest
        .patientSlotFillSeedAuthorityArtifact.patientGenerationSeed,
    );
    expect(generatedCompilation.resolvedObservation.resolution).toMatchObject({
      origin: 'deterministic_generation',
      stableDrawId: generatedCompilation.generationDraws.valueOptionStableDrawId,
      generationProfileId: generatedCompilation.selectedProfileRef.id,
      generationProfileContentVersion: generatedCompilation.selectedProfileRef.contentVersion,
    });
    expect(
      collection.members.filter((member) => member.kind === 'generated_categorical_observation'),
    ).toEqual([
      expect.objectContaining({
        compilationRef: {
          id: generatedCompilation.id,
          payloadFingerprint: generatedCompilation.payloadFingerprint,
        },
        resolvedRecordId: generatedCompilation.resolvedObservation.id,
      }),
    ]);
    expect(
      recipeCompilation.directMemberBindings.filter(
        (binding) => binding.kind === 'generated_categorical_observation',
      ),
    ).toEqual([
      expect.objectContaining({
        compilationRef: {
          id: generatedCompilation.id,
          payloadFingerprint: generatedCompilation.payloadFingerprint,
        },
        resolvedRecordId: generatedCompilation.resolvedObservation.id,
      }),
    ]);
    expect(attachedPatient.categoricalObservations).toEqual([
      generatedCompilation.resolvedObservation,
    ]);
    expect(finalPatient.categoricalObservations).toEqual([
      generatedCompilation.resolvedObservation,
    ]);
    expect(
      verifyPatientTemplateClinicalResultFindingPipelineOrchestrationIntegrity(artifact),
    ).toEqual({ ok: true, value: artifact });
    expect(
      orchestratePatientTemplateClinicalResultFindingPipeline(fixture.orchestrationRequest),
    ).toEqual(result);
  }, 60_000);

  it('carries the checked-in current-MDD duration profile through D-263–D-330', () => {
    const fixture = makeClinicalResultFindingPipelineOrchestrationFixture({
      includeConditionScopedDuration: true,
      useCheckedInMddDurationProfile: true,
    });
    const result = orchestratePatientTemplateClinicalResultFindingPipeline(
      fixture.orchestrationRequest,
    );
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    const artifact = result.value;
    const sourceValidation =
      artifact.resultPostCompositionOrchestrationArtifact.postCompositionAssembly.assemblyRequest
        .conditionClinicalDurationSourceValidationArtifact;
    if (sourceValidation === null) {
      throw new Error('Expected one source-validated current-MDD duration.');
    }
    const durationAttachment = sourceValidation.compileRequest.durationAttachment;
    const resolution = durationAttachment.attachmentRequest.durationResolutionArtifacts[0];
    if (resolution === undefined) throw new Error('Expected one D-263 duration resolution.');
    const finalPatient =
      artifact.findingPipelineAuditArtifact.catalogSnapshot?.patientInstance.patientState;
    const reveals =
      artifact.findingPipelineAuditArtifact.catalogSnapshot?.patientInstance
        .targetScopedPatientValueReveals;
    if (finalPatient === undefined || reveals === undefined) {
      throw new Error('Expected one compiled D-330 patient and duration reveal.');
    }

    expect(resolution.compileRequest.profile).toMatchObject({
      id: checkedInMddDurationProfile.id,
      contentVersion: checkedInMddDurationProfile.contentVersion,
    });
    expect(fingerprintClinicalDurationProfile(resolution.compileRequest.profile)).toBe(
      fingerprintClinicalDurationProfile(checkedInMddDurationProfile),
    );
    expect(resolution.compileRequest.seed).toBe(
      fixture.orchestrationRequest.baseFindingPipelineAuditRequest
        .patientSlotFillSeedAuthorityArtifact.patientGenerationSeed,
    );
    expect(resolution.resolvedDuration).toMatchObject({
      durationProfileId: checkedInMddDurationProfile.id,
      durationProfileContentVersion: checkedInMddDurationProfile.contentVersion,
      relatedDiagnosisId: 'diagnosis.major-depressive-disorder',
      timeScopeId: 'time-scope.current',
    });
    expect(
      checkedInMddDurationProfile.options.some(
        (option) =>
          option.id === resolution.resolvedDuration.durationOptionId &&
          option.value === resolution.resolvedDuration.value &&
          option.unit === resolution.resolvedDuration.unit,
      ),
    ).toBe(true);
    expect(finalPatient.clinicalDurations).toEqual([resolution.resolvedDuration]);
    expect(reveals).toContainEqual(
      expect.objectContaining({
        values: [
          expect.objectContaining({
            kind: 'clinical_duration',
            value: resolution.resolvedDuration.value,
            unit: resolution.resolvedDuration.unit,
            sourceKind: 'patient_report',
          }),
        ],
      }),
    );
    expect(
      verifyPatientTemplateClinicalResultFindingPipelineOrchestrationIntegrity(artifact),
    ).toEqual({ ok: true, value: artifact });
    expect(
      orchestratePatientTemplateClinicalResultFindingPipeline(fixture.orchestrationRequest),
    ).toEqual(result);
  }, 60_000);

  it('carries the checked-in current-MDD finding profile through D-197–D-330', () => {
    const fixture = makeClinicalResultFindingPipelineOrchestrationFixture({
      useCheckedInMddFindingProfile: true,
    });
    const result = orchestratePatientTemplateClinicalResultFindingPipeline(
      fixture.orchestrationRequest,
    );
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    if (checkedInMddFindingProfile.modelVersion !== 'condition-finding-dimensions.v1') {
      throw new Error('Expected the checked-in current-MDD dimension profile.');
    }
    const artifact = result.value;
    const conditionFinding = artifact.findingPipelineAuditArtifact.conditionFindingArtifact;
    const selection = conditionFinding.dimensionSelections[0];
    const snapshot = artifact.findingPipelineAuditArtifact.catalogSnapshot;
    const finalPatient = snapshot?.patientInstance.patientState;
    if (selection === undefined || snapshot === null || finalPatient === undefined) {
      throw new Error('Expected one D-197 MDD selection and one D-330 patient.');
    }
    const declaredManifestations = new Set(
      checkedInMddFindingProfile.dimensions.flatMap((dimension) =>
        dimension.manifestations.map(
          (manifestation) =>
            `${manifestation.findingDefinitionId}@${manifestation.findingDefinitionContentVersion}`,
        ),
      ),
    );
    const finalFindingByDefinition = new Map(
      finalPatient.canonicalFindings.map((finding) => [
        `${finding.definitionId}@${finding.definitionContentVersion}`,
        finding,
      ]),
    );
    const depressiveSymptomsResultBinding = snapshot.encounterInstance.resultBindings.find(
      (binding) => binding.informationActionId === 'info.history.depressive-symptoms',
    );

    expect(conditionFinding.seed).toBe(
      fixture.orchestrationRequest.baseFindingPipelineAuditRequest
        .patientSlotFillSeedAuthorityArtifact.patientGenerationSeed,
    );
    expect(conditionFinding.profileReferences).toContainEqual({
      id: checkedInMddFindingProfile.id,
      contentVersion: checkedInMddFindingProfile.contentVersion,
      fingerprint: fingerprintConditionFindingCardinalityProfile(checkedInMddFindingProfile),
    });
    expect(selection).toMatchObject({
      profileRef: {
        id: checkedInMddFindingProfile.id,
        contentVersion: checkedInMddFindingProfile.contentVersion,
      },
    });
    expect(selection.selectedDimensionCount).toBeGreaterThanOrEqual(
      checkedInMddFindingProfile.minimumSelectedDimensions,
    );
    expect(selection.selectedDimensionCount).toBeLessThanOrEqual(
      checkedInMddFindingProfile.maximumSelectedDimensions,
    );
    expect(selection.requirementEvaluations.every((evaluation) => evaluation.satisfied)).toBe(true);
    expect(conditionFinding.candidates).toHaveLength(selection.selectedDimensionCount);
    expect(
      [...checkedInMddDepressiveSymptomsFindingIds].every((findingId) =>
        [...finalFindingByDefinition.keys()].some((key) => key.startsWith(`${findingId}@`)),
      ),
    ).toBe(true);
    expect(
      depressiveSymptomsResultBinding?.sources.filter(
        (source) => source.kind === 'finding_projection',
      ),
    ).toHaveLength(checkedInMddDepressiveSymptomsFindingIds.size);
    for (const candidate of conditionFinding.candidates) {
      const definitionKey = `${candidate.findingDefinitionId}@${candidate.findingDefinitionContentVersion}`;
      expect(declaredManifestations.has(definitionKey)).toBe(true);
      expect(finalFindingByDefinition.get(definitionKey)).toMatchObject({
        definitionId: candidate.findingDefinitionId,
        definitionContentVersion: candidate.findingDefinitionContentVersion,
        value: candidate.proposedValue,
      });
    }
    expect(
      verifyPatientTemplateClinicalResultFindingPipelineOrchestrationIntegrity(artifact),
    ).toEqual({ ok: true, value: artifact });
    expect(
      orchestratePatientTemplateClinicalResultFindingPipeline(fixture.orchestrationRequest),
    ).toEqual(result);
  }, 60_000);

  it('carries checked-in current-MDD findings and duration together through D-330', () => {
    const fixture = makeClinicalResultFindingPipelineOrchestrationFixture({
      includeConditionScopedDuration: true,
      useCheckedInMddDurationProfile: true,
      omitConditionScopedDurationResultProjection: true,
      useCheckedInMddFindingProfile: true,
    });
    const result = orchestratePatientTemplateClinicalResultFindingPipeline(
      fixture.orchestrationRequest,
    );
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    const artifact = result.value;
    const findingArtifact = artifact.findingPipelineAuditArtifact.conditionFindingArtifact;
    const sourceValidation =
      artifact.resultPostCompositionOrchestrationArtifact.postCompositionAssembly.assemblyRequest
        .conditionClinicalDurationSourceValidationArtifact;
    const snapshot = artifact.findingPipelineAuditArtifact.catalogSnapshot;
    if (sourceValidation === null || snapshot === null) {
      throw new Error('Expected one combined checked-in MDD patient snapshot.');
    }
    const durationResolution =
      sourceValidation.compileRequest.durationAttachment.attachmentRequest
        .durationResolutionArtifacts[0];
    if (durationResolution === undefined) {
      throw new Error('Expected one checked-in current-MDD duration resolution.');
    }
    const patientSeed =
      fixture.orchestrationRequest.baseFindingPipelineAuditRequest
        .patientSlotFillSeedAuthorityArtifact.patientGenerationSeed;
    const finalPatient = snapshot.patientInstance.patientState;
    const finalFindingByDefinition = new Map(
      finalPatient.canonicalFindings.map((finding) => [
        `${finding.definitionId}@${finding.definitionContentVersion}`,
        finding,
      ]),
    );

    expect(findingArtifact.seed).toBe(patientSeed);
    expect(durationResolution.compileRequest.seed).toBe(patientSeed);
    expect(findingArtifact.profileReferences).toContainEqual({
      id: checkedInMddFindingProfile.id,
      contentVersion: checkedInMddFindingProfile.contentVersion,
      fingerprint: fingerprintConditionFindingCardinalityProfile(checkedInMddFindingProfile),
    });
    expect(durationResolution.resolvedDuration).toMatchObject({
      durationProfileId: checkedInMddDurationProfile.id,
      durationProfileContentVersion: checkedInMddDurationProfile.contentVersion,
      relatedDiagnosisId: 'diagnosis.major-depressive-disorder',
      timeScopeId: 'time-scope.current',
    });
    expect(finalPatient.clinicalDurations).toEqual([durationResolution.resolvedDuration]);
    for (const candidate of findingArtifact.candidates) {
      expect(
        finalFindingByDefinition.get(
          `${candidate.findingDefinitionId}@${candidate.findingDefinitionContentVersion}`,
        ),
      ).toMatchObject({
        value: candidate.proposedValue,
      });
    }
    expect(snapshot.patientInstance.targetScopedPatientValueReveals).toEqual([]);
    expect(
      verifyPatientTemplateClinicalResultFindingPipelineOrchestrationIntegrity(artifact),
    ).toEqual({ ok: true, value: artifact });
    expect(
      orchestratePatientTemplateClinicalResultFindingPipeline(fixture.orchestrationRequest),
    ).toEqual(result);
  }, 60_000);

  it('adds the checked-in mania-history closure to the combined current-MDD patient', () => {
    const fixture = makeClinicalResultFindingPipelineOrchestrationFixture({
      includeConditionScopedDuration: true,
      useCheckedInMddDurationProfile: true,
      omitConditionScopedDurationResultProjection: true,
      useCheckedInMddFindingProfile: true,
      includeCheckedInManiaHistoryResult: true,
    });
    const result = orchestratePatientTemplateClinicalResultFindingPipeline(
      fixture.orchestrationRequest,
    );
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    const artifact = result.value;
    const snapshot = artifact.findingPipelineAuditArtifact.catalogSnapshot;
    if (snapshot === null) {
      throw new Error('Expected one result-enabled current-MDD patient snapshot.');
    }
    const finalPatient = snapshot.patientInstance.patientState;
    const maniaFindingByDefinition = new Map(
      finalPatient.canonicalFindings
        .filter((finding) => checkedInManiaHistoryFindingIds.has(finding.definitionId))
        .map((finding) => [finding.definitionId, finding]),
    );
    const maniaResultBinding = snapshot.encounterInstance.resultBindings.find(
      (binding) => binding.informationActionId === 'info.history.mania',
    );
    const expectedProjectionIds = new Set(
      checkedInManiaHistoryProjections.map((projection) => projection.id),
    );
    const resolvedProjectionIds = new Set(
      snapshot.patientInstance.sharedFindingCompilation.projections
        .filter((projection) => expectedProjectionIds.has(projection.projectionId))
        .map((projection) => projection.id),
    );

    expect(checkedInManiaHistoryFindingDefinitions).toHaveLength(16);
    expect(checkedInManiaHistoryFindingIds.size).toBe(16);
    expect(maniaFindingByDefinition.size).toBe(16);
    expect(
      [...maniaFindingByDefinition.values()].every(
        (finding) => finding.value.kind === 'outcome' && finding.value.value === 'absent',
      ),
    ).toBe(true);
    expect(
      artifact.findingPipelineAuditArtifact.conditionFindingArtifact.candidates.some((candidate) =>
        checkedInManiaHistoryFindingIds.has(candidate.findingDefinitionId),
      ),
    ).toBe(false);
    expect(maniaResultBinding?.sources).toHaveLength(16);
    expect(
      maniaResultBinding?.sources.every(
        (source) =>
          source.kind === 'finding_projection' &&
          resolvedProjectionIds.has(source.resolvedProjectionId),
      ),
    ).toBe(true);
    expect(
      snapshot.universalActionResultAssemblyRecipe.actionCatalog.actions.find(
        (action) => action.id === 'info.history.mania',
      ),
    ).toEqual(checkedInManiaHistoryActionResultAssembly.actionCatalog.actions[0]);
    expect(
      snapshot.universalActionResultAssemblyRecipe.recipes.find(
        (recipe) => recipe.informationActionId === 'info.history.mania',
      ),
    ).toEqual(checkedInManiaHistoryActionResultAssembly.recipes[0]);
    expect(
      verifyPatientTemplateClinicalResultFindingPipelineOrchestrationIntegrity(artifact),
    ).toEqual({ ok: true, value: artifact });
    expect(
      orchestratePatientTemplateClinicalResultFindingPipeline(fixture.orchestrationRequest),
    ).toEqual(result);
  }, 60_000);

  it('adds the checked-in psychosis-history closure to the combined current-MDD patient', () => {
    const fixture = makeClinicalResultFindingPipelineOrchestrationFixture({
      includeConditionScopedDuration: true,
      useCheckedInMddDurationProfile: true,
      omitConditionScopedDurationResultProjection: true,
      useCheckedInMddFindingProfile: true,
      includeCheckedInManiaHistoryResult: true,
      includeCheckedInPsychosisHistoryResult: true,
    });
    const result = orchestratePatientTemplateClinicalResultFindingPipeline(
      fixture.orchestrationRequest,
    );
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    const artifact = result.value;
    const snapshot = artifact.findingPipelineAuditArtifact.catalogSnapshot;
    if (snapshot === null) {
      throw new Error('Expected one result-enabled current-MDD patient snapshot.');
    }
    const finalPatient = snapshot.patientInstance.patientState;
    const psychosisFindingByDefinition = new Map(
      finalPatient.canonicalFindings
        .filter((finding) => checkedInPsychosisHistoryFindingIds.has(finding.definitionId))
        .map((finding) => [finding.definitionId, finding]),
    );
    const psychosisResultBinding = snapshot.encounterInstance.resultBindings.find(
      (binding) => binding.informationActionId === 'info.history.psychosis',
    );
    const expectedProjectionIds = new Set(
      checkedInPsychosisHistoryProjections.map((projection) => projection.id),
    );
    const resolvedProjectionIds = new Set(
      snapshot.patientInstance.sharedFindingCompilation.projections
        .filter((projection) => expectedProjectionIds.has(projection.projectionId))
        .map((projection) => projection.id),
    );

    expect(checkedInPsychosisHistoryFindingDefinitions).toHaveLength(6);
    expect(checkedInPsychosisHistoryFindingIds.size).toBe(6);
    expect(psychosisFindingByDefinition.size).toBe(6);
    expect(
      [...psychosisFindingByDefinition.values()].every(
        (finding) => finding.value.kind === 'outcome' && finding.value.value === 'absent',
      ),
    ).toBe(true);
    expect(
      artifact.findingPipelineAuditArtifact.conditionFindingArtifact.candidates.some((candidate) =>
        checkedInPsychosisHistoryFindingIds.has(candidate.findingDefinitionId),
      ),
    ).toBe(false);
    expect(psychosisResultBinding?.sources).toHaveLength(6);
    expect(
      psychosisResultBinding?.sources.every(
        (source) =>
          source.kind === 'finding_projection' &&
          resolvedProjectionIds.has(source.resolvedProjectionId),
      ),
    ).toBe(true);
    expect(
      snapshot.encounterInstance.resultBindings.find(
        (binding) => binding.informationActionId === 'info.history.mania',
      )?.sources,
    ).toHaveLength(16);
    expect(finalPatient.clinicalDurations).toHaveLength(1);
    expect(
      snapshot.universalActionResultAssemblyRecipe.actionCatalog.actions.find(
        (action) => action.id === 'info.history.psychosis',
      ),
    ).toEqual(checkedInPsychosisHistoryActionResultAssembly.actionCatalog.actions[0]);
    expect(
      snapshot.universalActionResultAssemblyRecipe.recipes.find(
        (recipe) => recipe.informationActionId === 'info.history.psychosis',
      ),
    ).toEqual(checkedInPsychosisHistoryActionResultAssembly.recipes[0]);
    expect(
      verifyPatientTemplateClinicalResultFindingPipelineOrchestrationIntegrity(artifact),
    ).toEqual({ ok: true, value: artifact });
    expect(
      orchestratePatientTemplateClinicalResultFindingPipeline(fixture.orchestrationRequest),
    ).toEqual(result);
  }, 60_000);

  it('adds the checked-in suicide-safety assessment without replacing MDD safety findings', () => {
    const fixture = makeClinicalResultFindingPipelineOrchestrationFixture({
      includeConditionScopedDuration: true,
      useCheckedInMddDurationProfile: true,
      omitConditionScopedDurationResultProjection: true,
      useCheckedInMddFindingProfile: true,
      includeCheckedInManiaHistoryResult: true,
      includeCheckedInPsychosisHistoryResult: true,
      includeCheckedInSuicideSafetyResult: true,
    });
    const result = orchestratePatientTemplateClinicalResultFindingPipeline(
      fixture.orchestrationRequest,
    );
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    const artifact = result.value;
    const snapshot = artifact.findingPipelineAuditArtifact.catalogSnapshot;
    if (snapshot === null) {
      throw new Error('Expected one result-enabled current-MDD patient snapshot.');
    }
    const finalPatient = snapshot.patientInstance.patientState;
    const selectedCandidateByDefinition = new Map(
      artifact.findingPipelineAuditArtifact.conditionFindingArtifact.candidates.map((candidate) => [
        candidate.findingDefinitionId,
        candidate,
      ]),
    );
    const safetyFindingByDefinition = new Map(
      finalPatient.canonicalFindings
        .filter((finding) => checkedInSuicideSafetyFindingIds.has(finding.definitionId))
        .map((finding) => [finding.definitionId, finding]),
    );
    const safetyResultBinding = snapshot.encounterInstance.resultBindings.find(
      (binding) => binding.informationActionId === 'info.history.suicide-safety',
    );
    const expectedProjectionIds = new Set(
      checkedInSuicideSafetyProjections.map((projection) => projection.id),
    );
    const resolvedProjectionIds = new Set(
      snapshot.patientInstance.sharedFindingCompilation.projections
        .filter((projection) => expectedProjectionIds.has(projection.projectionId))
        .map((projection) => projection.id),
    );

    expect(checkedInSuicideSafetyFindingDefinitions).toHaveLength(9);
    expect(checkedInSuicideSafetyFindingIds.size).toBe(9);
    expect(safetyFindingByDefinition.size).toBe(9);
    expect(
      [...selectedCandidateByDefinition.keys()].filter((findingDefinitionId) =>
        checkedInSuicideSafetyFindingIds.has(findingDefinitionId),
      ),
    ).toEqual(['finding.safety.current-passive-death-wish']);
    for (const findingDefinitionId of checkedInSuicideSafetyFindingIds) {
      const selectedCandidate = selectedCandidateByDefinition.get(findingDefinitionId);
      expect(safetyFindingByDefinition.get(findingDefinitionId)?.value).toEqual(
        selectedCandidate?.proposedValue ?? { kind: 'outcome', value: 'absent' },
      );
    }
    expect(safetyResultBinding?.sources).toHaveLength(9);
    expect(
      safetyResultBinding?.sources.every(
        (source) =>
          source.kind === 'finding_projection' &&
          resolvedProjectionIds.has(source.resolvedProjectionId),
      ),
    ).toBe(true);
    expect(
      snapshot.encounterInstance.resultBindings.find(
        (binding) => binding.informationActionId === 'info.history.mania',
      )?.sources,
    ).toHaveLength(16);
    expect(
      snapshot.encounterInstance.resultBindings.find(
        (binding) => binding.informationActionId === 'info.history.psychosis',
      )?.sources,
    ).toHaveLength(6);
    expect(
      snapshot.universalActionResultAssemblyRecipe.actionCatalog.actions.find(
        (action) => action.id === 'info.history.suicide-safety',
      ),
    ).toEqual(checkedInSuicideSafetyActionResultAssembly.actionCatalog.actions[0]);
    expect(
      snapshot.universalActionResultAssemblyRecipe.recipes.find(
        (recipe) => recipe.informationActionId === 'info.history.suicide-safety',
      ),
    ).toEqual(checkedInSuicideSafetyActionResultAssembly.recipes[0]);
    expect(
      verifyPatientTemplateClinicalResultFindingPipelineOrchestrationIntegrity(artifact),
    ).toEqual({ ok: true, value: artifact });
    expect(
      orchestratePatientTemplateClinicalResultFindingPipeline(fixture.orchestrationRequest),
    ).toEqual(result);
  }, 60_000);

  it('compiles the reviewed passive-death-wish safety requirement against generated MDD truth', () => {
    const generationRoot = 'g.mdd-policy.0';
    const fixture = makeClinicalResultFindingPipelineOrchestrationFixture({
      includeConditionScopedDuration: true,
      useCheckedInMddDurationProfile: true,
      omitConditionScopedDurationResultProjection: true,
      useCheckedInMddFindingProfile: true,
      includeCheckedInManiaHistoryResult: true,
      includeCheckedInPsychosisHistoryResult: true,
      includeCheckedInSuicideSafetyResult: true,
      useCheckedInMddDecisionPolicy: true,
      generationRoot,
    });
    const result = orchestratePatientTemplateClinicalResultFindingPipeline(
      fixture.orchestrationRequest,
    );
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    const artifact = result.value;
    const snapshot = artifact.findingPipelineAuditArtifact.catalogSnapshot;
    if (snapshot === null) {
      throw new Error('Expected one compiled current-MDD patient and rubric.');
    }
    const passiveDeathWish = snapshot.patientInstance.patientState.canonicalFindings.find(
      (finding) => finding.definitionId === 'finding.safety.current-passive-death-wish',
    );
    const primaryRoute = snapshot.encounterInstance.compiledRubric.includedRules.find(
      (rule) => rule.ruleRef.id === checkedInMddPrimaryRoute.id,
    );
    const safetyRequirement = snapshot.encounterInstance.compiledRubric.includedRules.find(
      (rule) => rule.ruleRef.id === 'rule.diagnosis-mdd.passive-death-wish-safety-assessment',
    );

    expect(snapshot.encounterInstance.compiledRubric.policyRef).toEqual({
      id: checkedInMddDecisionPolicy.id,
      contentVersion: checkedInMddDecisionPolicy.contentVersion,
    });
    expect(passiveDeathWish?.value).toEqual({ kind: 'outcome', value: 'present' });
    expect(primaryRoute).toMatchObject({
      ruleRef: {
        kind: 'medication_regimen_route',
        id: checkedInMddPrimaryRoute.id,
        contentVersion: checkedInMddPrimaryRoute.contentVersion,
      },
      inclusionReason: 'primary_route',
      ruleKind: 'primary_route',
    });
    expect(safetyRequirement).toMatchObject({
      ruleRef: {
        kind: 'diagnosis_rule',
        id: 'rule.diagnosis-mdd.passive-death-wish-safety-assessment',
        contentVersion: checkedInMddDiagnosis.contentVersion,
        ownerId: checkedInMddDiagnosis.id,
        ownerContentVersion: checkedInMddDiagnosis.contentVersion,
      },
      inclusionReason: 'automatic_prerequisite',
      actionWhen: {
        match: 'any',
        targets: [
          {
            kind: 'information_action',
            informationActionId: 'info.history.suicide-safety',
          },
        ],
      },
      triggeredInformationPrerequisite: null,
      balanceRef: null,
    });
    expect(safetyRequirement?.matchedPatientFactBindings).toContainEqual({
      fact: {
        recordKind: 'canonical_finding',
        identityId: 'finding.safety.current-passive-death-wish',
        identityContentVersion: '1.0.0',
        attributeId: 'finding.outcome',
        valueId: 'finding-outcome.present',
      },
      recordIds: [passiveDeathWish!.id],
    });
    expect(
      verifyPatientTemplateClinicalResultFindingPipelineOrchestrationIntegrity(artifact),
    ).toEqual({ ok: true, value: artifact });
    expect(
      orchestratePatientTemplateClinicalResultFindingPipeline(fixture.orchestrationRequest),
    ).toEqual(result);
  }, 60_000);

  it('keeps the reviewed antidepressant trigger distinct from mania-history fulfillment', () => {
    const fixture = makeClinicalResultFindingPipelineOrchestrationFixture({
      includeConditionScopedDuration: true,
      useCheckedInMddDurationProfile: true,
      omitConditionScopedDurationResultProjection: true,
      useCheckedInMddFindingProfile: true,
      includeCheckedInManiaHistoryResult: true,
      includeCheckedInPsychosisHistoryResult: true,
      includeCheckedInSuicideSafetyResult: true,
      useCheckedInMddDecisionPolicy: true,
      generationRoot: 'g.mdd-policy.0',
    });
    const result = orchestratePatientTemplateClinicalResultFindingPipeline(
      fixture.orchestrationRequest,
    );
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    const artifact = result.value;
    const snapshot = artifact.findingPipelineAuditArtifact.catalogSnapshot;
    if (snapshot === null) {
      throw new Error('Expected one compiled current-MDD patient and rubric.');
    }
    const maniaHistoryPrerequisite = snapshot.encounterInstance.compiledRubric.includedRules.find(
      (rule) => rule.ruleRef.id === 'rule.diagnosis-mdd.initial-route-antidepressant-mania-history',
    );
    const reviewedMedicationIds = [
      'medication.bupropion',
      'medication.escitalopram',
      'medication.fluoxetine',
      'medication.mirtazapine',
      'medication.sertraline',
    ];

    expect(snapshot.encounterInstance.decisionActionHorizon.startMedicationIds).toEqual([
      'medication.bupropion',
    ]);
    expect(maniaHistoryPrerequisite).toMatchObject({
      ruleRef: {
        kind: 'diagnosis_rule',
        id: 'rule.diagnosis-mdd.initial-route-antidepressant-mania-history',
        contentVersion: checkedInMddDiagnosis.contentVersion,
        ownerId: checkedInMddDiagnosis.id,
        ownerContentVersion: checkedInMddDiagnosis.contentVersion,
      },
      inclusionReason: 'automatic_prerequisite',
      actionWhen: {
        match: 'any',
        targets: [
          {
            kind: 'information_action',
            informationActionId: 'info.history.mania',
          },
        ],
      },
      triggeredInformationPrerequisite: {
        policyScope: {
          policyRef: {
            id: checkedInMddDecisionPolicy.id,
            contentVersion: checkedInMddDecisionPolicy.contentVersion,
          },
          focusedDecisionId: checkedInMddDecisionPolicy.focusedDecisionId,
        },
        triggerWhen: {
          match: 'any',
          targets: reviewedMedicationIds.map((medicationIdentityId) => ({
            kind: 'medication_start',
            medicationIdentityId,
          })),
        },
        fulfillmentWhen: {
          match: 'any',
          targets: [
            {
              kind: 'information_action',
              informationActionId: 'info.history.mania',
            },
          ],
        },
      },
      matchedActionTargets: [
        {
          kind: 'information_action',
          informationActionId: 'info.history.mania',
        },
      ],
      balanceRef: null,
    });
    expect(maniaHistoryPrerequisite?.matchedPatientFactBindings).toContainEqual({
      fact: {
        recordKind: 'condition',
        identityId: checkedInMddDiagnosis.id,
        identityContentVersion: checkedInMddDiagnosis.contentVersion,
        attributeId: 'condition.presence',
        valueId: 'state.present',
      },
      recordIds: [
        snapshot.patientInstance.patientState.conditionStates.find(
          (condition) => condition.diagnosisDefinitionId === checkedInMddDiagnosis.id,
        )!.id,
      ],
    });
    expect(JSON.stringify(maniaHistoryPrerequisite)).not.toContain('medicationClassId');
    expect(JSON.stringify(maniaHistoryPrerequisite)).not.toContain('medicationTagId');
    expect(JSON.stringify(maniaHistoryPrerequisite)).not.toContain('clinicalTagPresent');
    expect(
      verifyPatientTemplateClinicalResultFindingPipelineOrchestrationIntegrity(artifact),
    ).toEqual({ ok: true, value: artifact });
    expect(
      orchestratePatientTemplateClinicalResultFindingPipeline(fixture.orchestrationRequest),
    ).toEqual(result);
  }, 60_000);

  it('scores reviewed MDD information rules from exact frozen player and database-plan decisions', () => {
    const fixture = makeClinicalResultFillFixture({
      includeConditionScopedDuration: true,
      useCheckedInMddDurationProfile: true,
      omitConditionScopedDurationResultProjection: true,
      useCheckedInMddFindingProfile: true,
      includeCheckedInManiaHistoryResult: true,
      includeCheckedInPsychosisHistoryResult: true,
      includeCheckedInSuicideSafetyResult: true,
      useCheckedInMddDecisionPolicy: true,
      useCheckedInMddDecisionBalances: true,
      generationRoot: 'g.mdd-policy.0',
      mode: 'endgame',
    });
    const fill = expectFillCompiled(fixture.input);
    const waitingSlot = fill.frozenWaitingSlotProposal;
    if (waitingSlot === null) throw new Error('Expected one balanced generated MDD patient.');
    const informationPurchase = (
      informationActionId: string,
      suffix: string,
    ): GeneratedEncounterActionEventInput => ({
      id: `generated-action-event.test.d368.${suffix}`,
      type: 'InformationPurchased',
      purchase: {
        id: `generated-information-purchase.test.d368.${suffix}`,
        informationActionId,
      },
    });
    const treatmentSelection = (
      suffix: string,
      startMedicationIds: readonly string[],
    ): GeneratedEncounterActionEventInput => ({
      id: `generated-action-event.test.d368.${suffix}`,
      type: 'TreatmentSelectionsChanged',
      selections: {
        schemaVersion: 1,
        selectionVersion: 2,
        medicationTransition: {
          selectionVersion: 2,
          startMedicationIds: [...startMedicationIds],
          adjustments: [],
        },
        interventionIds: [],
        dispositionId: null,
      },
    });
    const pointDerivation: GeneratedCompletedEncounterAttemptCompileInput['pointDerivation'] = {
      balanceCatalog: checkedInMddGeneratedDecisionBalanceCatalog,
      medicationRegimenKnowledgeCatalog: checkedInMddMedicationRegimenCatalog,
      databasePlanDecision: {
        schemaVersion: 1,
        selectionVersion: 1,
        informationActionIds: ['info.history.mania', 'info.history.suicide-safety'],
        diagnosisSelections: [],
        treatmentSelection: {
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
    };
    const attempts = [
      {
        name: 'fulfilled',
        expectedCarePoints: 85,
        expectedManiaPoints: 35,
        expectedManiaStatus: 'fulfilled',
        expectedSafetyPoints: 50,
        actionEvents: [
          informationPurchase('info.history.mania', 'fulfilled-mania'),
          informationPurchase('info.history.suicide-safety', 'fulfilled-safety'),
          treatmentSelection('fulfilled-treatment', ['medication.bupropion']),
        ],
      },
      {
        name: 'omitted',
        expectedCarePoints: -130,
        expectedManiaPoints: -50,
        expectedManiaStatus: 'omitted',
        expectedSafetyPoints: -80,
        actionEvents: [treatmentSelection('omitted-treatment', ['medication.bupropion'])],
      },
      {
        name: 'not-triggered',
        expectedCarePoints: 50,
        expectedManiaPoints: 0,
        expectedManiaStatus: 'not_triggered',
        expectedSafetyPoints: 50,
        actionEvents: [informationPurchase('info.history.suicide-safety', 'not-triggered-safety')],
      },
    ] as const;

    for (const scenario of attempts) {
      const attempt = createNativeGeneratedAttempt({
        attemptId: `generated-completed-attempt.test.d368.${scenario.name}`,
        mode: 'endgame',
        frozenWaitingSlot: waitingSlot,
        actionEvents: scenario.actionEvents,
        pointDerivation,
      });
      const traceByRuleId = new Map(
        attempt.pointReport.ruleTrace.flatMap((row) =>
          row.source.kind === 'compiled_decision_rule'
            ? [[row.source.ruleRef.id, row] as const]
            : [],
        ),
      );
      const maniaHistory = traceByRuleId.get(
        'rule.diagnosis-mdd.initial-route-antidepressant-mania-history',
      );
      const detailedSafety = traceByRuleId.get(
        'rule.diagnosis-mdd.passive-death-wish-safety-assessment',
      );

      expect(attempt.pointReport.carePointsEarned, scenario.name).toBe(scenario.expectedCarePoints);
      expect(attempt.pointReport.databasePlanPoints, scenario.name).toBe(85);
      expect(attempt.pointReport.balanceCatalogSnapshot.balances, scenario.name).toHaveLength(2);
      expect(maniaHistory, scenario.name).toMatchObject({
        balanceRef: {
          id: 'balance.mdd-antidepressant-mania-history',
          contentVersion: '1.1.0',
        },
        component: 'workup',
        appliedPoints: scenario.expectedManiaPoints,
        triggeredInformationPrerequisiteEvaluation: {
          status: scenario.expectedManiaStatus,
          triggerSelected: scenario.expectedManiaStatus !== 'not_triggered',
          fulfillmentSelected: scenario.expectedManiaStatus === 'fulfilled',
        },
      });
      expect(detailedSafety, scenario.name).toMatchObject({
        balanceRef: {
          id: 'balance.mdd-passive-death-wish-safety-assessment',
          contentVersion: '1.0.0',
        },
        component: 'workup',
        status: 'applied',
        pointsBeforeCombination: scenario.expectedSafetyPoints,
        appliedPoints: scenario.expectedSafetyPoints,
        triggeredInformationPrerequisiteEvaluation: null,
      });
      expect(verifyGeneratedCompletedEncounterAttemptIntegrity(attempt), scenario.name).toEqual({
        ok: true,
        value: attempt,
      });
    }
  }, 60_000);

  it('scores the checked-in depressive-syndrome assessment as a direct information requirement', () => {
    const fixture = makeClinicalResultFillFixture({
      includeConditionScopedDuration: true,
      useCheckedInMddDurationProfile: true,
      omitConditionScopedDurationResultProjection: true,
      useCheckedInMddFindingProfile: true,
      includeCheckedInManiaHistoryResult: true,
      includeCheckedInPsychosisHistoryResult: true,
      includeCheckedInSuicideSafetyResult: true,
      useCheckedInMddDecisionPolicy: true,
      useCheckedInMddDecisionBalances: true,
      useCheckedInMddDepressiveSyndromeBalance: true,
      generationRoot: 'g.mdd-policy.0',
      mode: 'endgame',
    });
    const fill = expectFillCompiled(fixture.input);
    const waitingSlot = fill.frozenWaitingSlotProposal;
    if (waitingSlot === null) throw new Error('Expected one expanded balanced MDD patient.');
    const informationPurchase = (
      informationActionId: string,
      suffix: string,
    ): GeneratedEncounterActionEventInput => ({
      id: `generated-action-event.test.d369.${suffix}`,
      type: 'InformationPurchased',
      purchase: {
        id: `generated-information-purchase.test.d369.${suffix}`,
        informationActionId,
      },
    });
    const treatmentSelection: GeneratedEncounterActionEventInput = {
      id: 'generated-action-event.test.d369.treatment',
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
    };
    const pointDerivation: GeneratedCompletedEncounterAttemptCompileInput['pointDerivation'] = {
      balanceCatalog: checkedInMddExpandedDecisionBalanceCatalog,
      medicationRegimenKnowledgeCatalog: checkedInMddMedicationRegimenCatalog,
      databasePlanDecision: {
        schemaVersion: 1,
        selectionVersion: 1,
        informationActionIds: [
          'info.history.depressive-symptoms',
          'info.history.mania',
          'info.history.suicide-safety',
        ],
        diagnosisSelections: [],
        treatmentSelection: {
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
    };
    const sharedPurchases = [
      informationPurchase('info.history.mania', 'mania'),
      informationPurchase('info.history.suicide-safety', 'safety'),
    ];
    for (const scenario of [
      {
        name: 'obtained',
        expectedCarePoints: 135,
        expectedDepressiveSyndromePoints: 50,
        actionEvents: [
          informationPurchase('info.history.depressive-symptoms', 'depressive-symptoms'),
          ...sharedPurchases,
          treatmentSelection,
        ],
      },
      {
        name: 'omitted',
        expectedCarePoints: 35,
        expectedDepressiveSyndromePoints: -50,
        actionEvents: [...sharedPurchases, treatmentSelection],
      },
    ] as const) {
      const attempt = createNativeGeneratedAttempt({
        attemptId: `generated-completed-attempt.test.d369.${scenario.name}`,
        mode: 'endgame',
        frozenWaitingSlot: waitingSlot,
        actionEvents: scenario.actionEvents,
        pointDerivation,
      });
      const depressiveSyndromeTrace = attempt.pointReport.ruleTrace.find(
        (row) =>
          row.source.kind === 'compiled_decision_rule' &&
          row.source.ruleRef.id === 'rule.diagnosis-mdd.initial-depressive-syndrome-assessment',
      );

      expect(attempt.pointReport.carePointsEarned, scenario.name).toBe(scenario.expectedCarePoints);
      expect(attempt.pointReport.databasePlanPoints, scenario.name).toBe(135);
      expect(attempt.pointReport.balanceCatalogSnapshot.balances, scenario.name).toHaveLength(3);
      expect(depressiveSyndromeTrace, scenario.name).toMatchObject({
        balanceRef: {
          id: 'balance.mdd-initial-depressive-syndrome-assessment',
          contentVersion: '1.3.0',
        },
        component: 'workup',
        matched: true,
        status: 'applied',
        pointsBeforeCombination: scenario.expectedDepressiveSyndromePoints,
        appliedPoints: scenario.expectedDepressiveSyndromePoints,
        triggeredInformationPrerequisiteEvaluation: null,
      });
      expect(verifyGeneratedCompletedEncounterAttemptIntegrity(attempt), scenario.name).toEqual({
        ok: true,
        value: attempt,
      });
    }
  }, 60_000);

  it('adds the checked-in dominant primary-route balance without inventing an omission penalty', () => {
    const fixture = makeClinicalResultFillFixture({
      includeConditionScopedDuration: true,
      useCheckedInMddDurationProfile: true,
      omitConditionScopedDurationResultProjection: true,
      useCheckedInMddFindingProfile: true,
      includeCheckedInManiaHistoryResult: true,
      includeCheckedInPsychosisHistoryResult: true,
      includeCheckedInSuicideSafetyResult: true,
      useCheckedInMddDecisionPolicy: true,
      useCheckedInMddDecisionBalances: true,
      useCheckedInMddDepressiveSyndromeBalance: true,
      useCheckedInMddPrimaryRouteBalance: true,
      generationRoot: 'g.mdd-policy.0',
      mode: 'endgame',
    });
    const fill = expectFillCompiled(fixture.input);
    const waitingSlot = fill.frozenWaitingSlotProposal;
    if (waitingSlot === null) throw new Error('Expected one primary-route-balanced MDD patient.');
    const informationPurchase = (
      informationActionId: string,
      suffix: string,
    ): GeneratedEncounterActionEventInput => ({
      id: `generated-action-event.test.d370.${suffix}`,
      type: 'InformationPurchased',
      purchase: {
        id: `generated-information-purchase.test.d370.${suffix}`,
        informationActionId,
      },
    });
    const selectedInformationEvents = [
      informationPurchase('info.history.depressive-symptoms', 'depressive-symptoms'),
      informationPurchase('info.history.mania', 'mania'),
      informationPurchase('info.history.suicide-safety', 'safety'),
    ];
    const treatmentSelection: GeneratedEncounterActionEventInput = {
      id: 'generated-action-event.test.d370.treatment',
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
    };
    const pointDerivation: GeneratedCompletedEncounterAttemptCompileInput['pointDerivation'] = {
      balanceCatalog: checkedInMddPrimaryRouteDecisionBalanceCatalog,
      medicationRegimenKnowledgeCatalog: checkedInMddMedicationRegimenCatalog,
      databasePlanDecision: {
        schemaVersion: 1,
        selectionVersion: 1,
        informationActionIds: [
          'info.history.depressive-symptoms',
          'info.history.mania',
          'info.history.suicide-safety',
        ],
        diagnosisSelections: [],
        treatmentSelection: {
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
    };

    for (const scenario of [
      {
        name: 'selected',
        expectedCarePoints: 335,
        expectedPrimaryRoutePoints: 200,
        expectedPrimaryRouteStatus: 'applied',
        actionEvents: [...selectedInformationEvents, treatmentSelection],
      },
      {
        name: 'not-selected',
        expectedCarePoints: 100,
        expectedPrimaryRoutePoints: 0,
        expectedPrimaryRouteStatus: 'not_triggered',
        actionEvents: selectedInformationEvents,
      },
    ] as const) {
      const attempt = createNativeGeneratedAttempt({
        attemptId: `generated-completed-attempt.test.d370.${scenario.name}`,
        mode: 'endgame',
        frozenWaitingSlot: waitingSlot,
        actionEvents: scenario.actionEvents,
        pointDerivation,
      });
      const primaryRouteTrace = attempt.pointReport.ruleTrace.find(
        (row) =>
          row.source.kind === 'compiled_decision_rule' &&
          row.source.ruleRef.id === checkedInMddPrimaryRoute.id,
      );

      expect(attempt.pointReport.carePointsEarned, scenario.name).toBe(scenario.expectedCarePoints);
      expect(attempt.pointReport.databasePlanPoints, scenario.name).toBe(335);
      expect(attempt.pointReport.balanceCatalogSnapshot.balances, scenario.name).toHaveLength(4);
      expect(primaryRouteTrace, scenario.name).toMatchObject({
        balanceRef: {
          id: 'balance.mdd-initial-one-first-line-antidepressant',
          contentVersion: '1.3.0',
        },
        component: 'medication_selection',
        matched: scenario.expectedPrimaryRoutePoints > 0,
        status: scenario.expectedPrimaryRouteStatus,
        pointsBeforeCombination: scenario.expectedPrimaryRoutePoints,
        appliedPoints: scenario.expectedPrimaryRoutePoints,
        triggeredInformationPrerequisiteEvaluation: null,
      });
      expect(verifyGeneratedCompletedEncounterAttemptIntegrity(attempt), scenario.name).toEqual({
        ok: true,
        value: attempt,
      });
    }
  }, 60_000);

  it('settles the scored generated MDD attempt without debiting persistent points', () => {
    const fixture = makeClinicalResultFillFixture({
      includeConditionScopedDuration: true,
      useCheckedInMddDurationProfile: true,
      omitConditionScopedDurationResultProjection: true,
      useCheckedInMddFindingProfile: true,
      includeCheckedInManiaHistoryResult: true,
      includeCheckedInPsychosisHistoryResult: true,
      includeCheckedInSuicideSafetyResult: true,
      useCheckedInMddDecisionPolicy: true,
      useCheckedInMddDecisionBalances: true,
      useCheckedInMddDepressiveSyndromeBalance: true,
      useCheckedInMddPrimaryRouteBalance: true,
      generationRoot: 'g.mdd-policy.2',
      mode: 'standard',
    });
    const fill = expectFillCompiled(fixture.input);
    const waitingSlot = fill.frozenWaitingSlotProposal;
    if (waitingSlot === null) throw new Error('Expected one standard-mode generated MDD patient.');
    const informationPurchase = (
      informationActionId: string,
      suffix: string,
    ): GeneratedEncounterActionEventInput => ({
      id: `generated-action-event.test.d371.${suffix}`,
      type: 'InformationPurchased',
      purchase: {
        id: `generated-information-purchase.test.d371.${suffix}`,
        informationActionId,
      },
    });
    const informationEvents = [
      informationPurchase('info.history.depressive-symptoms', 'depressive-symptoms'),
      informationPurchase('info.history.mania', 'mania'),
      informationPurchase('info.history.suicide-safety', 'safety'),
    ];
    const treatmentSelection: GeneratedEncounterActionEventInput = {
      id: 'generated-action-event.test.d371.treatment',
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
    };
    const pointDerivation: GeneratedCompletedEncounterAttemptCompileInput['pointDerivation'] = {
      balanceCatalog: checkedInMddPrimaryRouteDecisionBalanceCatalog,
      medicationRegimenKnowledgeCatalog: checkedInMddMedicationRegimenCatalog,
      databasePlanDecision: {
        schemaVersion: 1,
        selectionVersion: 1,
        informationActionIds: [
          'info.history.depressive-symptoms',
          'info.history.mania',
          'info.history.suicide-safety',
        ],
        diagnosisSelections: [],
        treatmentSelection: {
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
    };
    const settlement = generatedSettlementForWaiting(waitingSlot, {
      baseReimbursement: 400,
      clinicPoints: 250,
      lifetimePointsEarned: 100,
      satisfaction: 0,
    });
    const selectedRoute = createNativeGeneratedAttempt({
      attemptId: 'generated-completed-attempt.test.d371.selected-route',
      mode: 'standard',
      frozenWaitingSlot: waitingSlot,
      actionEvents: [...informationEvents, treatmentSelection],
      pointDerivation,
      settlement,
    });
    const noRoute = createNativeGeneratedAttempt({
      attemptId: 'generated-completed-attempt.test.d371.no-route',
      mode: 'standard',
      frozenWaitingSlot: waitingSlot,
      actionEvents: informationEvents,
      pointDerivation,
      settlement,
    });

    for (const [name, attempt, expectedCarePoints] of [
      ['selected route', selectedRoute, 335],
      ['no route', noRoute, 100],
    ] as const) {
      expect(attempt.pointReport.carePointsEarned, name).toBe(expectedCarePoints);
      expect(attempt.settlement, name).toMatchObject({
        baseReimbursement: 400,
        challengeBonus: 0,
        satisfactionMultiplier: 1,
        carePoints: expectedCarePoints,
        grossPayout: 400 + expectedCarePoints,
        practiceMode: false,
        persistentPointsBefore: 250,
        lifetimePointsBefore: 100,
      });
      expect(attempt.settlement.informationExpenses, name).toBeGreaterThan(0);
      expect(attempt.settlement.operatingExpenses, name).toBe(
        attempt.settlement.informationExpenses + attempt.settlement.treatmentExpenses,
      );
      expect(attempt.settlement.calculatedPayout, name).toBe(
        attempt.settlement.grossPayout - attempt.settlement.operatingExpenses,
      );
      expect(attempt.settlement.projectedNetPointsEarned, name).toBe(
        Math.max(0, attempt.settlement.calculatedPayout),
      );
      expect(attempt.settlement.bankedPointsEarned, name).toBe(
        attempt.settlement.projectedNetPointsEarned,
      );
      expect(attempt.settlement.persistentPointsAfter, name).toBe(
        250 + attempt.settlement.bankedPointsEarned,
      );
      expect(attempt.settlement.lifetimePointsAfter, name).toBe(
        100 + attempt.settlement.bankedPointsEarned,
      );
      expect(verifyGeneratedCompletedEncounterAttemptIntegrity(attempt), name).toEqual({
        ok: true,
        value: attempt,
      });
    }
    expect(selectedRoute.settlement.projectedNetPointsEarned).toBeGreaterThan(
      noRoute.settlement.projectedNetPointsEarned,
    );

    const floorAttempt = createNativeGeneratedAttempt({
      attemptId: 'generated-completed-attempt.test.d371.floor',
      mode: 'standard',
      frozenWaitingSlot: waitingSlot,
      pointDerivation,
      settlement: generatedSettlementForWaiting(waitingSlot, {
        baseReimbursement: 0,
        clinicPoints: 250,
        lifetimePointsEarned: 100,
        satisfaction: 0,
      }),
    });
    expect(floorAttempt.pointReport.carePointsEarned).toBe(-130);
    expect(floorAttempt.settlement).toMatchObject({
      grossPayout: 0,
      projectedNetPointsEarned: 0,
      bankedPointsEarned: 0,
      persistentPointsBefore: 250,
      persistentPointsAfter: 250,
      lifetimePointsBefore: 100,
      lifetimePointsAfter: 100,
      practiceMode: false,
    });
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(floorAttempt)).toEqual({
      ok: true,
      value: floorAttempt,
    });
  }, 60_000);

  it('reports the remaining generated-MDD information owners as nonblocking coverage gaps', () => {
    const fixture = makeClinicalResultFillFixture({
      includeConditionScopedDuration: true,
      useCheckedInMddDurationProfile: true,
      omitConditionScopedDurationResultProjection: true,
      useCheckedInMddFindingProfile: true,
      includeCheckedInManiaHistoryResult: true,
      includeCheckedInPsychosisHistoryResult: true,
      includeCheckedInSuicideSafetyResult: true,
      useCheckedInMddDecisionPolicy: true,
      useCheckedInMddCoverageAuditRules: true,
      generationRoot: 'g.mdd-policy.0',
      mode: 'endgame',
    });
    const fill = expectFillCompiled(fixture.input);
    const waitingSlot = fill.frozenWaitingSlotProposal;
    if (waitingSlot === null) throw new Error('Expected one generated MDD coverage-audit patient.');
    const snapshot = waitingSlot.findingPipelineAuditArtifact.catalogSnapshot;
    if (snapshot === null) throw new Error('Expected one compiled generated MDD snapshot.');
    const patientState = snapshot.patientInstance.patientState;
    const encounter = snapshot.encounterInstance;
    const uncovered = encounter.compiledRubric.coverageDiagnostics
      .filter((diagnostic) => diagnostic.code === 'uncovered_action')
      .map((diagnostic) => ({
        ruleId: diagnostic.affectedContentIds.find((id) => id.startsWith('rule.')) ?? null,
        informationActionId:
          diagnostic.affectedContentIds.find((id) => id.startsWith('info.')) ?? null,
        impact: diagnostic.impact,
        ticketTargetId: diagnostic.ticketTargetId,
      }))
      .sort((left, right) => (left.ruleId ?? '').localeCompare(right.ruleId ?? ''));

    expect(uncovered).toEqual([
      {
        ruleId: 'rule.diagnosis-mdd.any-medication-reaction-history',
        informationActionId: 'info.history.allergies-adverse-reactions',
        impact: 'nonblocking',
        ticketTargetId: 'ticket.engine.decision-policy.catalog-compiler',
      },
      {
        ruleId: 'rule.diagnosis-mdd.any-medication-reconciliation',
        informationActionId: 'info.history.medication-reconciliation',
        impact: 'nonblocking',
        ticketTargetId: 'ticket.engine.decision-policy.catalog-compiler',
      },
      {
        ruleId: 'rule.diagnosis-mdd.initial-episode-course-assessment',
        informationActionId: 'info.history.presenting-problem',
        impact: 'nonblocking',
        ticketTargetId: 'ticket.engine.decision-policy.catalog-compiler',
      },
      {
        ruleId: 'rule.diagnosis-mdd.substance-history',
        informationActionId: 'info.history.substance-use',
        impact: 'nonblocking',
        ticketTargetId: 'ticket.engine.decision-policy.catalog-compiler',
      },
    ]);
    for (const diagnostic of encounter.compiledRubric.coverageDiagnostics) {
      expect(diagnostic).not.toHaveProperty('points');
      expect(diagnostic).not.toHaveProperty('score');
    }

    expect(encounter.compiledRubric.includedRules.map((rule) => rule.ruleRef.id)).toEqual(
      expect.arrayContaining([
        checkedInMddPrimaryRoute.id,
        'rule.diagnosis-mdd.initial-depressive-syndrome-assessment',
        'rule.diagnosis-mdd.initial-route-antidepressant-mania-history',
        'rule.diagnosis-mdd.passive-death-wish-safety-assessment',
      ]),
    );
    expect(encounter.resultBindings.map((binding) => binding.informationActionId)).not.toEqual(
      expect.arrayContaining(uncovered.map((gap) => gap.informationActionId)),
    );
    expect(
      patientState.clinicalDurations.some(
        (duration) => duration.relatedDiagnosisId === checkedInMddDiagnosis.id,
      ),
    ).toBe(true);
    expect(
      patientState.canonicalFindings.some(
        (finding) => finding.definitionId === 'finding.function.self-reported-current-impact',
      ),
    ).toBe(false);
    expect(patientState.medicationRegimenEntries).toEqual([]);
    expect(patientState.reactionHistory).toEqual({
      status: 'unassessed',
      medicationAssessmentStatus: 'unassessed',
      records: [],
    });
    expect(patientState.exposureInventory.useEntries).toEqual([]);
    expect(snapshot.patientInstance.structuredStateReveals).toEqual([]);
    expect(
      checkedInMddCoverageAuditDecisionCandidates.map((candidate) => candidate.ruleRef.id),
    ).not.toEqual(
      expect.arrayContaining([
        'rule.diagnosis-mdd.initial-first-line-antidepressant',
        'rule.diagnosis-mdd.antidepressant-mania-history',
      ]),
    );
    expect(verifyEmptyAuthorizedPatientSlotFillIntegrity(fill)).toEqual({
      ok: true,
      value: fill,
    });
  }, 60_000);

  it('attaches accurate structured histories as the zero-complexity generated-MDD baseline', () => {
    const fixture = makeClinicalResultFillFixture({
      includeConditionScopedDuration: true,
      useCheckedInMddDurationProfile: true,
      omitConditionScopedDurationResultProjection: true,
      useCheckedInMddFindingProfile: true,
      includeCheckedInManiaHistoryResult: true,
      includeCheckedInPsychosisHistoryResult: true,
      includeCheckedInSuicideSafetyResult: true,
      includeCheckedInAccurateStructuredHistoryReports: true,
      includeCheckedInMddDiagnosisSelection: true,
      useCheckedInMddDecisionPolicy: true,
      useCheckedInMddCoverageAuditRules: true,
      generationRoot: 'g.mdd-policy.0',
      mode: 'endgame',
    });
    const fill = expectFillCompiled(fixture.input);
    const waitingSlot = fill.frozenWaitingSlotProposal;
    if (waitingSlot === null) {
      throw new Error('Expected one generated MDD accurate-history patient.');
    }
    const audit = waitingSlot.findingPipelineAuditArtifact;
    const snapshot = audit.catalogSnapshot;
    if (snapshot === null) {
      throw new Error('Expected one compiled generated MDD accurate-history snapshot.');
    }
    const patientState = snapshot.patientInstance.patientState;
    const optionalFeatures =
      patientStateCompositionOf(audit).compositionRequest.optionalFeatureArtifact;
    const selection = snapshot.structuredSourceReportSelectionArtifact;
    const reports = snapshot.structuredSourceReportArtifact;
    if (selection === null || reports === null) {
      throw new Error('Expected fixed accurate source-report selection and compilation.');
    }

    expect(optionalFeatures).toMatchObject({
      selectedCount: 0,
      totalSpent: 0,
      selectionDraws: [],
      candidateEvaluations: [],
    });
    expect(selection.request.optionalFeatureArtifact).toBeUndefined();
    expect(
      selection.selectedProfileRefs
        .map((reference) => reference.id)
        .sort((left, right) => left.localeCompare(right)),
    ).toEqual(checkedInAccurateStructuredHistoryProfiles.map((profile) => profile.id));
    for (const selected of selection.selections) {
      expect(selected).toMatchObject({
        mode: 'fixed',
        stableDrawId: null,
      });
      expect(selected.candidateEvaluations).toHaveLength(1);
      expect(selected.candidateEvaluations[0]!.gameGenerationWeight).toBeNull();
      expect(selected.candidateEvaluations[0]!.normalizedGameSelectionProbability).toBeNull();
      expect(selected.candidateEvaluations[0]!.complexityModule ?? null).toBeNull();
    }

    expect(patientState.medicationRegimenEntries).toEqual([]);
    expect(patientState.reactionHistory).toEqual({
      status: 'unassessed',
      medicationAssessmentStatus: 'unassessed',
      records: [],
    });
    expect(patientState.exposureInventory.useEntries).toEqual([]);

    const reportByActionId = new Map(
      reports.projectionRecipes.map((recipe) => [
        recipe.resolved.informationActionId,
        recipe.resolved,
      ]),
    );
    expect(reportByActionId.get('info.history.medication-reconciliation')).toMatchObject({
      laneStatements: [
        {
          lane: 'medication_regimen_entries',
          presentationStatus: 'none_reported',
          includedTruthRecordIds: [],
          omittedTruthRecordIds: [],
          relationshipToTruth: 'aligned',
        },
      ],
      singletonStatements: [],
    });
    expect(reportByActionId.get('info.history.allergies-adverse-reactions')).toMatchObject({
      laneStatements: [
        {
          lane: 'reaction_records',
          presentationStatus: 'unassessed',
          includedTruthRecordIds: [],
          omittedTruthRecordIds: [],
          relationshipToTruth: 'indeterminate',
        },
      ],
      singletonStatements: expect.arrayContaining([
        {
          field: 'reaction_history_status',
          truthValue: 'unassessed',
          presentedValue: 'unassessed',
          relationshipToTruth: 'indeterminate',
        },
        {
          field: 'medication_reaction_assessment_status',
          truthValue: 'unassessed',
          presentedValue: 'unassessed',
          relationshipToTruth: 'indeterminate',
        },
      ]),
    });
    expect(reportByActionId.get('info.history.substance-use')).toMatchObject({
      laneStatements: [
        {
          lane: 'exposure_use_entries',
          presentationStatus: 'none_reported',
          includedTruthRecordIds: [],
          omittedTruthRecordIds: [],
          relationshipToTruth: 'aligned',
        },
      ],
      singletonStatements: [],
    });

    const frozenByActionId = new Map(
      snapshot.patientInstance.structuredStateReveals.map((reveal) => [
        reveal.informationActionId,
        reveal,
      ]),
    );
    expect([...frozenByActionId.keys()].sort((left, right) => left.localeCompare(right))).toEqual([
      'info.history.allergies-adverse-reactions',
      'info.history.medication-reconciliation',
      'info.history.substance-use',
    ]);
    expect(frozenByActionId.get('info.history.medication-reconciliation')).toMatchObject({
      laneStatements: [
        {
          lane: 'medication_regimen_entries',
          presentationStatus: 'none_reported',
          presentedRecordIds: [],
        },
      ],
      singletonStatements: [],
    });
    expect(frozenByActionId.get('info.history.allergies-adverse-reactions')).toMatchObject({
      laneStatements: [
        {
          lane: 'reaction_records',
          presentationStatus: 'unassessed',
          presentedRecordIds: [],
        },
      ],
      singletonStatements: expect.arrayContaining([
        {
          field: 'reaction_history_status',
          presentedValue: 'unassessed',
        },
        {
          field: 'medication_reaction_assessment_status',
          presentedValue: 'unassessed',
        },
      ]),
    });
    expect(frozenByActionId.get('info.history.substance-use')).toMatchObject({
      laneStatements: [
        {
          lane: 'exposure_use_entries',
          presentationStatus: 'none_reported',
          presentedRecordIds: [],
        },
      ],
      singletonStatements: [],
    });

    const structuredBindings = snapshot.encounterInstance.resultBindings
      .filter((binding) => frozenByActionId.has(binding.informationActionId))
      .map((binding) => ({
        informationActionId: binding.informationActionId,
        sourceKinds: binding.sources.map((source) => source.kind),
      }))
      .sort((left, right) => left.informationActionId.localeCompare(right.informationActionId));
    expect(structuredBindings).toEqual([
      {
        informationActionId: 'info.history.allergies-adverse-reactions',
        sourceKinds: ['structured_state_reveal'],
      },
      {
        informationActionId: 'info.history.medication-reconciliation',
        sourceKinds: ['structured_state_reveal'],
      },
      {
        informationActionId: 'info.history.substance-use',
        sourceKinds: ['structured_state_reveal'],
      },
    ]);
    expect(
      snapshot.encounterInstance.compiledRubric.coverageDiagnostics
        .filter((diagnostic) => diagnostic.code === 'uncovered_action')
        .flatMap((diagnostic) =>
          diagnostic.affectedContentIds.filter((id) => id.startsWith('info.')),
        ),
    ).toEqual(['info.history.presenting-problem']);
    expect(
      snapshot.encounterInstance.compiledRubric.includedRules.every(
        (rule) => rule.balanceRef === null,
      ),
    ).toBe(true);

    expect(snapshot.encounterInstance.diagnosisSelectionHorizon).toEqual({
      schemaVersion: 1,
      id: 'diagnosis-selection-horizon.test.pipeline',
      allowEmptySelection: true,
      options: [
        {
          id: 'diagnosis-option.generated-mdd.major-depressive-disorder',
          diagnosisDefinitionId: checkedInMddDiagnosis.id,
          diagnosisDefinitionContentVersion: checkedInMddDiagnosis.contentVersion,
        },
      ],
    });
    const purchasedStructuredHistoryActionIds = [
      'info.history.medication-reconciliation',
      'info.history.allergies-adverse-reactions',
      'info.history.substance-use',
    ] as const;
    const diagnosedAttempt = createNativeGeneratedAttempt({
      attemptId: 'generated-completed-attempt.test.d375.structured-history-and-diagnosis',
      mode: 'endgame',
      frozenWaitingSlot: waitingSlot,
      actionEvents: [
        ...purchasedStructuredHistoryActionIds.map(
          (informationActionId, index): GeneratedEncounterActionEventInput => ({
            id: `generated-action-event.test.d375.structured-history.${index + 1}`,
            type: 'InformationPurchased',
            purchase: {
              id: `generated-information-purchase.test.d375.structured-history.${index + 1}`,
              informationActionId,
            },
          }),
        ),
        {
          id: 'generated-action-event.test.d375.family-level-mdd',
          type: 'DiagnosisSelectionsChanged',
          selections: [
            {
              diagnosisId: checkedInMddDiagnosis.id,
              severityId: null,
              specifierIds: [],
            },
          ],
        },
      ],
    });
    expect(diagnosedAttempt.submittedDiagnoses).toEqual([
      {
        diagnosisId: checkedInMddDiagnosis.id,
        severityId: null,
        specifierIds: [],
      },
    ]);
    expect(diagnosedAttempt.pointReport.playerDecision.diagnosisSelections).toEqual(
      diagnosedAttempt.submittedDiagnoses,
    );
    expect(diagnosedAttempt.purchases).toHaveLength(3);
    for (const [index, informationActionId] of purchasedStructuredHistoryActionIds.entries()) {
      const purchase = diagnosedAttempt.purchases[index]!;
      const binding = snapshot.encounterInstance.resultBindings.find(
        (candidate) => candidate.informationActionId === informationActionId,
      );
      expect(purchase).toMatchObject({
        informationActionId,
        resultBindingId: binding?.id,
        operatingCost: 25,
        pricingDerivation: 'native_versioned_service_quote.v1',
      });
      expect(binding?.sources).toEqual([
        expect.objectContaining({
          kind: 'structured_state_reveal',
        }),
      ]);
    }
    expect(diagnosedAttempt.pointReport.playerDecision.informationActionIds).toEqual(
      purchasedStructuredHistoryActionIds,
    );
    expect(diagnosedAttempt.replaySnapshot.diagnosisSelectionOwners).toMatchObject({
      owners: [
        {
          diagnosisOptionId: 'diagnosis-option.generated-mdd.major-depressive-disorder',
          diagnosisRef: {
            id: checkedInMddDiagnosis.id,
            contentVersion: checkedInMddDiagnosis.contentVersion,
          },
          playerSeverityMode: 'family_only',
          allowedSeverityIds: [],
          allowedSpecifiers: [
            {
              specifierId: 'specifier.mdd.psychotic-features',
              exclusiveGroupId: null,
            },
          ],
        },
      ],
    });
    expect(diagnosedAttempt.pointReport.carePointsEarned).toBe(0);
    expect(diagnosedAttempt.settlement).toMatchObject({
      informationExpenses: 75,
      operatingExpenses: 75,
      practiceMode: true,
      projectedNetPointsEarned: 325,
      bankedPointsEarned: 0,
    });
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(diagnosedAttempt)).toEqual({
      ok: true,
      value: diagnosedAttempt,
    });
    const persistedAttempt = createGeneratedCompletedEncounterAttemptPersistenceRecord({
      attempt: diagnosedAttempt,
      completedAt: '2026-08-04T18:00:00.000Z',
    });
    expect(
      GeneratedCompletedEncounterAttemptPersistenceRecordSchema.parse(persistedAttempt),
    ).toEqual(persistedAttempt);
    expect(JSON.parse(JSON.stringify(persistedAttempt))).toEqual(persistedAttempt);
    expect(verifyGeneratedCompletedEncounterAttemptPersistenceRecord(persistedAttempt)).toEqual({
      ok: true,
      value: persistedAttempt,
    });
    expect(persistedAttempt.attempt).toEqual(diagnosedAttempt);
    const completionProof = createGeneratedEncounterCompletionProof({
      attempt: diagnosedAttempt,
      frozenWaitingSlot: waitingSlot,
    });
    expect(JSON.parse(JSON.stringify(completionProof))).toEqual(completionProof);
    expect(verifyGeneratedEncounterCompletionProof(completionProof)).toEqual({
      ok: true,
      value: completionProof,
    });
    expect(completionProof).toMatchObject({
      attemptRef: {
        id: diagnosedAttempt.id,
        payloadFingerprint: diagnosedAttempt.payloadFingerprint,
      },
      waitingSlotId: waitingSlot.id,
      patientInstanceRef: {
        id: snapshot.patientInstance.id,
        payloadFingerprint: snapshot.patientInstance.payloadFingerprint,
      },
    });
    const occupiedInput = occupiedInputAfterFill(fixture, fill);
    const completionHistoryState = emptyCompletionHistory(fill);
    const transitionInput: PatientSlotLifecycleTransitionCompileInput = {
      schemaVersion: 1,
      id: 'patient-slot-lifecycle-transition-request.test.d378.generated-mdd',
      operation: 'complete_encounter',
      mode: 'endgame',
      occupancySnapshotArtifact: fill.proposedOccupancySnapshotArtifact,
      currentOccupancyInput: occupiedInput,
      completionHistoryState,
      distributionProfile:
        fixture.slotSelection.patientSlotFillSeedAuthorityCompileInput.distributionProfile,
      developerRunHistoryState: null,
      targetSlotCoordinateId: fill.slotCoordinate.id,
      completionProof,
    };
    const transitioned = compilePatientSlotLifecycleTransition(transitionInput);
    if (!transitioned.ok) {
      throw new Error(`${transitioned.error.code}: ${transitioned.error.message}`);
    }
    expect(transitioned.value).toMatchObject({
      operation: 'complete_encounter',
      mode: 'endgame',
      vacatedSlotCoordinateIds: [fill.slotCoordinate.id],
      skippedWaitingRecords: [],
      completionRecord: {
        completionOrdinal: 0,
        slotCoordinateId: fill.slotCoordinate.id,
        frozenWaitingSlot: {
          id: waitingSlot.id,
        },
        completionProof: {
          id: completionProof.id,
          attemptRef: completionProof.attemptRef,
          proofFingerprint: completionProof.proofFingerprint,
        },
      },
      proposedCompletionHistoryState: {
        nextCompletionOrdinal: 1,
        entriesNewestFirst: [
          {
            completionOrdinal: 0,
            completionProof: {
              attemptRef: completionProof.attemptRef,
            },
          },
        ],
      },
    });
    expect(
      occupancyEntryAt(
        transitioned.value.proposedOccupancySnapshotArtifact,
        fill.slotCoordinate.id,
      ),
    ).toMatchObject({
      status: 'empty',
      nextFillOrdinal: fill.nextFillOrdinal,
    });
    expect(transitioned.value.completionRecord?.completionProof.attemptSnapshot).toEqual(
      diagnosedAttempt,
    );
    expect(verifyPatientSlotLifecycleTransitionIntegrity(transitioned.value)).toEqual({
      ok: true,
      value: transitioned.value,
    });
    expect(
      verifyPatientSlotLifecycleTransitionContext({
        artifact: transitioned.value,
        currentInput: transitionInput,
      }),
    ).toEqual({
      ok: true,
      value: transitioned.value,
    });
    expect(verifyEmptyAuthorizedPatientSlotFillIntegrity(fill)).toEqual({
      ok: true,
      value: fill,
    });
  }, 120_000);

  it('resolves the reviewed broad functional-impact profile into the generated-MDD presenting history', () => {
    const fixture = makeClinicalResultFillFixture({
      includeConditionScopedDuration: true,
      useCheckedInMddDurationProfile: true,
      useCheckedInMddFunctionalImpactProfile: true,
      useCheckedInMddFindingProfile: true,
      includeCheckedInManiaHistoryResult: true,
      includeCheckedInPsychosisHistoryResult: true,
      includeCheckedInSuicideSafetyResult: true,
      includeCheckedInAccurateStructuredHistoryReports: true,
      includeCheckedInMddDiagnosisSelection: true,
      useCheckedInMddDecisionPolicy: true,
      useCheckedInMddCoverageAuditRules: true,
      includeWeighted: false,
      generationRoot: 'g.mdd-policy.functional-impact.0',
      mode: 'endgame',
    });
    const first = expectFillCompiled(fixture.input);
    const waitingSlot = first.frozenWaitingSlotProposal;
    if (waitingSlot === null) {
      throw new Error(
        `Expected one generated MDD functional-impact patient: ${JSON.stringify(first.diagnostics)}`,
      );
    }
    const audit = waitingSlot.findingPipelineAuditArtifact;
    const snapshot = audit.catalogSnapshot;
    if (snapshot === null) {
      throw new Error('Expected one compiled generated MDD functional-impact snapshot.');
    }

    const selection = audit.backgroundFindingArtifact.selections[0];
    expect(selection).toMatchObject({
      findingDefinitionId: checkedInMddFunctionalImpactFinding.id,
      findingDefinitionContentVersion: checkedInMddFunctionalImpactFinding.contentVersion,
      profileRef: {
        id: checkedInMddFunctionalImpactProfile.id,
        contentVersion: checkedInMddFunctionalImpactProfile.contentVersion,
      },
      developerOpinionIds: checkedInMddFunctionalImpactProfile.developerOpinionIds,
      review: checkedInMddFunctionalImpactProfile.review,
    });
    expect(
      selection?.outcomeEvaluations.map((outcome) => ({
        value: outcome.proposedValue.value,
        weight: outcome.gameGenerationWeight,
      })),
    ).toEqual([
      { value: 'absent', weight: 1244 },
      { value: 'present', weight: 8756 },
    ]);
    const selectedOutcome = selection?.outcomeEvaluations.find((outcome) => outcome.selected);
    expect(selectedOutcome).toBeDefined();

    const patientState = snapshot.patientInstance.patientState;
    expect(
      patientState.canonicalFindings.find(
        (finding) =>
          finding.definitionId === checkedInMddFunctionalImpactFinding.id &&
          finding.definitionContentVersion === checkedInMddFunctionalImpactFinding.contentVersion,
      )?.value,
    ).toEqual(selectedOutcome?.proposedValue);
    expect(patientState.functionalImpairments).toEqual([]);

    const presentingProblemBinding = snapshot.encounterInstance.resultBindings.find(
      (binding) => binding.informationActionId === 'info.history.presenting-problem',
    );
    expect(presentingProblemBinding).toBeDefined();
    expect(presentingProblemBinding?.sources.map((source) => source.kind).sort()).toEqual([
      'finding_projection',
      'target_scoped_patient_value_reveal',
    ]);
    expect(
      snapshot.patientInstance.targetScopedPatientValueReveals.some((reveal) =>
        reveal.values.some(
          (value) => value.kind === 'clinical_duration' && value.sourceKind === 'patient_report',
        ),
      ),
    ).toBe(true);
    expect(
      snapshot.encounterInstance.compiledRubric.coverageDiagnostics.filter(
        (diagnostic) => diagnostic.code === 'uncovered_action',
      ),
    ).toEqual([]);
    expect(
      snapshot.encounterInstance.compiledRubric.includedRules.every(
        (rule) => rule.balanceRef === null,
      ),
    ).toBe(true);
    expect(verifyEmptyAuthorizedPatientSlotFillIntegrity(first)).toEqual({
      ok: true,
      value: first,
    });
  }, 60_000);

  it('preserves result-free duration/impairment branches and rejects replacement D-330 inputs', () => {
    const fixture = makeClinicalResultFindingPipelineOrchestrationFixture({
      includeConditionScopedDuration: true,
      includeFunctionalImpairment: true,
    });
    const result = orchestratePatientTemplateClinicalResultFindingPipeline(
      fixture.orchestrationRequest,
    );
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    const artifact = result.value;
    const finalPatient =
      artifact.findingPipelineAuditArtifact.catalogSnapshot?.patientInstance.patientState;
    expect(finalPatient?.clinicalDurations).toHaveLength(1);
    expect(finalPatient?.functionalImpairments).toHaveLength(1);
    expect(finalPatient?.measurements).toHaveLength(3);
    expect(
      artifact.resultPostCompositionOrchestrationArtifact.postCompositionAssembly.assemblyRequest
        .conditionClinicalDurationSourceValidationArtifact,
    ).toEqual(
      fixture.orchestrationRequest.baseFindingPipelineAuditRequest
        .postCompositionPatientStateAssemblyArtifact?.assemblyRequest
        .conditionClinicalDurationSourceValidationArtifact,
    );
    expect(
      artifact.resultPostCompositionOrchestrationArtifact.postCompositionAssembly.assemblyRequest
        .conditionFunctionalImpairmentSourceValidationArtifact,
    ).toEqual(
      fixture.orchestrationRequest.baseFindingPipelineAuditRequest
        .postCompositionPatientStateAssemblyArtifact?.assemblyRequest
        .conditionFunctionalImpairmentSourceValidationArtifact,
    );

    const prebuiltResultRequest = structuredClone(fixture.orchestrationRequest);
    prebuiltResultRequest.baseFindingPipelineAuditRequest.patientTemplatePostCompositionAssemblyOrchestrationArtifact =
      artifact.resultPostCompositionOrchestrationArtifact;
    expect(
      orchestratePatientTemplateClinicalResultFindingPipeline(prebuiltResultRequest),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const foreign = makeClinicalResultFindingPipelineOrchestrationFixture({
      generationRoot: 'generation-root.test.foreign-d330-coverage',
    });
    expect(
      orchestratePatientTemplateClinicalResultFindingPipeline({
        ...fixture.orchestrationRequest,
        resourceCoverageArtifact: foreign.resourceCoverage,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'MATERIALIZATION_CONTEXT_FAILED' },
    });

    const tampered = structuredClone(artifact);
    tampered.patientStateId = 'resolved-patient-state.test.tampered-d330';
    expect(
      verifyPatientTemplateClinicalResultFindingPipelineOrchestrationIntegrity(tampered),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  }, 60_000);

  it('derives one exact D-325 result-materialization context from D-233, D-208, and D-324', () => {
    const fixture = makeClinicalResultMaterializationContextFixture();
    const result = compilePatientTemplateClinicalResultMaterializationContext(
      fixture.contextRequest,
    );
    if (!result.ok) throw new Error(result.error.message);
    const artifact = result.value;
    const patientState =
      fixture.contextRequest.patientStateCompositionArtifact.composedPatientState;
    if (patientState === null) throw new Error('Expected one composed D-208 patient.');

    expect(
      PatientTemplateClinicalResultMaterializationContextArtifactSchema.parse(artifact),
    ).toEqual(artifact);
    expect(artifact.patientStateId).toBe(patientState.id);
    expect(artifact.patientGenerationSeed).toBe(
      fixture.contextRequest.patientSlotFillSeedAuthorityArtifact.patientGenerationSeed,
    );
    expect(artifact.generationContext).toEqual({
      ageYears: patientState.demographics.ageYears,
      sexForReference: patientState.demographics.sexForReference,
      diagnosisIds: [
        ...new Set(
          patientState.conditionStates.map((condition) => condition.diagnosisDefinitionId),
        ),
      ].sort(),
      clinicalTagIds: [...patientState.clinicalTagIds].sort(),
    });
    expect(artifact.sourceInstanceCompilation.patientStateId).toBe(patientState.id);
    expect(
      artifact.sourceInstanceCompilation.sourceInstanceCompilation.sourceInstances,
    ).toHaveLength(fixture.resourceSet.sourceDefinitionCatalog.definitions.length);
    expect(verifyPatientTemplateClinicalResultMaterializationContextIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(artifact).not.toHaveProperty('resultCollectionCompilation');
    expect(artifact).not.toHaveProperty('pointRules');
    expect(artifact).not.toHaveProperty('complexityCost');
  });

  it('keeps missing D-324 resources as an authoring diagnostic rather than rerolling D-208', () => {
    const fixture = makeClinicalResultMaterializationContextFixture();
    const incompleteCoverage = compilePatientTemplateClinicalResultResourceCoverage({
      schemaVersion: 1,
      id: 'patient-template-clinical-result-resource-coverage-request.test.pipeline-incomplete',
      recipeHorizonArtifact: fixture.resourceCoverage.compileRequest.recipeHorizonArtifact,
      resourceSet: {
        ...fixture.resourceSet,
        patientOwnedMeasurementValueProfiles: [],
      },
    });
    if (!incompleteCoverage.ok) throw new Error(incompleteCoverage.error.message);
    const patientBefore = structuredClone(
      fixture.contextRequest.patientStateCompositionArtifact.composedPatientState,
    );
    expect(
      compilePatientTemplateClinicalResultMaterializationContext({
        ...fixture.contextRequest,
        resourceCoverageArtifact: incompleteCoverage.value,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'RESOURCE_COVERAGE_INCOMPLETE' },
    });
    expect(fixture.contextRequest.patientStateCompositionArtifact.composedPatientState).toEqual(
      patientBefore,
    );
  });

  it('rejects a crossed D-233 seed authority and detects frozen-context tampering', () => {
    const fixture = makeClinicalResultMaterializationContextFixture();
    const foreign = makeRequest({
      includeDerivedBodyMassIndex: true,
      generationRoot: 'generation-root.test.pipeline.foreign-materialization-context',
    });
    expect(
      compilePatientTemplateClinicalResultMaterializationContext({
        ...fixture.contextRequest,
        patientSlotFillSeedAuthorityArtifact: foreign.patientSlotFillSeedAuthorityArtifact,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'TEMPLATE_CONTEXT_MISMATCH' },
    });

    const compiled = compilePatientTemplateClinicalResultMaterializationContext(
      fixture.contextRequest,
    );
    if (!compiled.ok) throw new Error(compiled.error.message);
    const changedContext = structuredClone(compiled.value);
    changedContext.generationContext.clinicalTagIds.push('clinical-tag.test.illicit-tamper');
    expect(
      verifyPatientTemplateClinicalResultMaterializationContextIntegrity(changedContext),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });

  it('orchestrates one exact D-326 D-310/D-317/D-320 materialization from D-325', () => {
    const fixture = makeClinicalResultMaterializationContextFixture();
    const context = compilePatientTemplateClinicalResultMaterializationContext(
      fixture.contextRequest,
    );
    if (!context.ok) throw new Error(context.error.message);
    const request = {
      schemaVersion: 1 as const,
      id: 'patient-template-clinical-result-materialization-request.test.pipeline',
      materializationContextArtifact: context.value,
    };
    const result = compilePatientTemplateClinicalResultMaterialization(request);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    const artifact = result.value;
    const recipeCompilation = artifact.templateClinicalResultRecipeCompilation;
    const collection = recipeCompilation.compileRequest.resultCollectionCompilation;

    expect(PatientTemplateClinicalResultMaterializationArtifactSchema.parse(artifact)).toEqual(
      artifact,
    );
    expect(collection.patientStateId).toBe(context.value.patientStateId);
    expect(collection.measurements).toHaveLength(2);
    expect(recipeCompilation.compileRequest.derivedMeasurementMaterializations).toHaveLength(1);
    expect(recipeCompilation.directMemberBindings).toHaveLength(2);
    expect(recipeCompilation.derivedMeasurementBindings).toHaveLength(1);
    expect(collection.compileRequest.sourceInstanceCompilation).toEqual(
      context.value.sourceInstanceCompilation,
    );
    expect(verifyPatientTemplateClinicalResultMaterializationIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(compilePatientTemplateClinicalResultMaterialization(request)).toEqual(result);
    expect(artifact).not.toHaveProperty('pointRules');
    expect(artifact).not.toHaveProperty('complexityCost');
    expect(artifact).not.toHaveProperty('patientInstance');
    expect(artifact).not.toHaveProperty('encounterInstance');
  });

  it('materializes generated height and weight from D-325 and derives BMI without changing ownership', () => {
    const fixture = makeClinicalResultMaterializationContextFixture({
      useGeneratedMeasurements: true,
    });
    expect(fixture.resourceSet.patientOwnedMeasurementValueProfiles).toEqual([]);
    expect(fixture.resourceSet.generatedMeasurementValueProfiles).toHaveLength(2);
    expect(
      fixture.resourceCoverage.templateCoverage.flatMap((coverage) => coverage.memberCoverage),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recipeMemberKind: 'generated_measurement',
          coverageStatus: 'complete',
        }),
      ]),
    );

    const context = compilePatientTemplateClinicalResultMaterializationContext(
      fixture.contextRequest,
    );
    if (!context.ok) throw new Error(context.error.message);
    const request = {
      schemaVersion: 1 as const,
      id: 'patient-template-clinical-result-materialization-request.test.generated-measurements',
      materializationContextArtifact: context.value,
    };
    const result = compilePatientTemplateClinicalResultMaterialization(request);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    const artifact = result.value;
    const recipeCompilation = artifact.templateClinicalResultRecipeCompilation;
    const collection = recipeCompilation.compileRequest.resultCollectionCompilation;
    const generatedCompilations = collection.compileRequest.measurementCompilations.filter(
      (compilation) => 'generationProfiles' in compilation.compileRequest,
    );

    expect(generatedCompilations).toHaveLength(2);
    expect(
      generatedCompilations.every((compilation) => {
        if (!('generationProfiles' in compilation.compileRequest)) return false;
        return (
          compilation.compileRequest.seed === context.value.patientGenerationSeed &&
          JSON.stringify(compilation.compileRequest.generationContext) ===
            JSON.stringify(context.value.generationContext)
        );
      }),
    ).toBe(true);
    expect(collection.members.map((member) => member.kind)).toEqual([
      'generated_measurement',
      'generated_measurement',
    ]);
    expect(
      collection.measurements.every(
        (measurement) => measurement.resolution.origin === 'deterministic_generation',
      ),
    ).toBe(true);
    expect(recipeCompilation.directMemberBindings.map((binding) => binding.kind)).toEqual([
      'generated_measurement',
      'generated_measurement',
    ]);
    expect(recipeCompilation.compileRequest.derivedMeasurementMaterializations).toHaveLength(1);
    expect(
      recipeCompilation.compileRequest.derivedMeasurementMaterializations[0]?.resolvedMeasurement
        .resolution.origin,
    ).toBe('deterministic_derivation');
    expect(verifyPatientTemplateClinicalResultMaterializationIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(compilePatientTemplateClinicalResultMaterialization(request)).toEqual(result);
  }, 15_000);

  it('materializes one generated categorical observation from the exact D-325 context', () => {
    const fixture = makeClinicalResultMaterializationContextFixture({
      useGeneratedCategoricalObservations: true,
    });
    expect(fixture.resourceSet.patientOwnedCategoricalObservationValueProfiles).toEqual([]);
    expect(fixture.resourceSet.generatedCategoricalObservationValueProfiles).toHaveLength(1);
    expect(
      fixture.resourceCoverage.templateCoverage.flatMap((coverage) => coverage.memberCoverage),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recipeMemberKind: 'generated_categorical_observation',
          coverageStatus: 'complete',
        }),
      ]),
    );

    const context = compilePatientTemplateClinicalResultMaterializationContext(
      fixture.contextRequest,
    );
    if (!context.ok) throw new Error(context.error.message);
    const request = {
      schemaVersion: 1 as const,
      id: 'patient-template-clinical-result-materialization-request.test.generated-observation',
      materializationContextArtifact: context.value,
    };
    const result = compilePatientTemplateClinicalResultMaterialization(request);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    const artifact = result.value;
    const recipeCompilation = artifact.templateClinicalResultRecipeCompilation;
    const collection = recipeCompilation.compileRequest.resultCollectionCompilation;
    const generatedCompilation = collection.compileRequest.categoricalObservationCompilations.find(
      (compilation) => 'generationProfiles' in compilation.compileRequest,
    );
    if (
      generatedCompilation === undefined ||
      !('generationProfiles' in generatedCompilation.compileRequest)
    ) {
      throw new Error('Expected a generated categorical-observation compilation.');
    }

    expect(generatedCompilation.compileRequest.seed).toBe(context.value.patientGenerationSeed);
    expect(generatedCompilation.compileRequest.generationContext).toEqual(
      context.value.generationContext,
    );
    expect(collection.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'generated_categorical_observation',
          resolvedRecordId: generatedCompilation.resolvedObservation.id,
        }),
      ]),
    );
    expect(generatedCompilation.resolvedObservation.resolution.origin).toBe(
      'deterministic_generation',
    );
    expect(generatedCompilation.resolvedObservation.interpretationIds).toEqual([]);
    expect(recipeCompilation.directMemberBindings.map((binding) => binding.kind)).toContain(
      'generated_categorical_observation',
    );
    expect(verifyPatientTemplateClinicalResultMaterializationIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(compilePatientTemplateClinicalResultMaterialization(request)).toEqual(result);
  }, 15_000);

  it('reports a missing exact generated-measurement profile at D-324', () => {
    const fixture = makeClinicalResultMaterializationContextFixture({
      useGeneratedMeasurements: true,
    });
    const incompleteCoverage = compilePatientTemplateClinicalResultResourceCoverage({
      schemaVersion: 1,
      id: 'patient-template-clinical-result-resource-coverage-request.test.generated-profile-missing',
      recipeHorizonArtifact: fixture.resourceCoverage.compileRequest.recipeHorizonArtifact,
      resourceSet: {
        ...fixture.resourceSet,
        generatedMeasurementValueProfiles:
          fixture.resourceSet.generatedMeasurementValueProfiles.slice(1),
      },
    });
    if (!incompleteCoverage.ok) throw new Error(incompleteCoverage.error.message);

    expect(incompleteCoverage.value.coverageStatus).toBe('incomplete');
    expect(
      incompleteCoverage.value.templateCoverage
        .flatMap((coverage) => coverage.memberCoverage)
        .filter((coverage) => coverage.recipeMemberKind === 'generated_measurement')
        .flatMap((coverage) => coverage.requirements)
        .filter((requirement) => requirement.kind === 'generated_measurement_value_profile'),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: 'missing',
          resolvedContentVersion: null,
        }),
      ]),
    );
  });

  it('reports a missing exact generated-observation profile at D-324', () => {
    const fixture = makeClinicalResultMaterializationContextFixture({
      useGeneratedCategoricalObservations: true,
    });
    const incompleteCoverage = compilePatientTemplateClinicalResultResourceCoverage({
      schemaVersion: 1,
      id: 'patient-template-clinical-result-resource-coverage-request.test.generated-observation-profile-missing',
      recipeHorizonArtifact: fixture.resourceCoverage.compileRequest.recipeHorizonArtifact,
      resourceSet: {
        ...fixture.resourceSet,
        generatedCategoricalObservationValueProfiles: [],
      },
    });
    if (!incompleteCoverage.ok) throw new Error(incompleteCoverage.error.message);

    expect(incompleteCoverage.value.coverageStatus).toBe('incomplete');
    expect(
      incompleteCoverage.value.templateCoverage
        .flatMap((coverage) => coverage.memberCoverage)
        .filter((coverage) => coverage.recipeMemberKind === 'generated_categorical_observation')
        .flatMap((coverage) => coverage.requirements)
        .filter(
          (requirement) => requirement.kind === 'generated_categorical_observation_value_profile',
        ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: 'missing',
          resolvedContentVersion: null,
        }),
      ]),
    );
  });

  it('rejects raw caller-authored result resources and seeds at D-326', () => {
    const fixture = makeClinicalResultMaterializationContextFixture();
    expect(
      compilePatientTemplateClinicalResultMaterialization({
        schemaVersion: 1,
        id: 'patient-template-clinical-result-materialization-request.test.raw-input',
        patientGenerationSeed: 'seed.test.illicit-caller-input',
        resourceSet: fixture.resourceSet,
        template:
          fixture.contextRequest.patientSlotFillSeedAuthorityArtifact
            .locationTemplateSelectionArtifact.locationOwnedPatientSlotSelectionArtifact
            .admittedTemplateLocationBindingArtifact.template,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('leaves resource semantics to the exact D-306-through-D-309 compilers', () => {
    const fixture = makeClinicalResultMaterializationContextFixture();
    const crossedResources = structuredClone(fixture.resourceSet);
    const crossedProfile = crossedResources.patientOwnedMeasurementValueProfiles[0];
    if (crossedProfile === undefined) {
      throw new Error('Expected one patient-owned measurement value profile.');
    }
    const foreignDefinition = crossedResources.measurementDefinitions.find(
      (definition) => definition.id !== crossedProfile.measurementDefinitionRef.id,
    );
    if (foreignDefinition === undefined) {
      throw new Error('Expected one foreign measurement definition.');
    }
    crossedProfile.measurementDefinitionRef = {
      id: foreignDefinition.id,
      contentVersion: foreignDefinition.contentVersion,
    };
    const coverage = compilePatientTemplateClinicalResultResourceCoverage({
      schemaVersion: 1,
      id: 'patient-template-clinical-result-resource-coverage-request.test.crossed-semantics',
      recipeHorizonArtifact: fixture.resourceCoverage.compileRequest.recipeHorizonArtifact,
      resourceSet: crossedResources,
    });
    if (!coverage.ok) throw new Error(coverage.error.message);
    expect(coverage.value.coverageStatus).toBe('complete');
    const context = compilePatientTemplateClinicalResultMaterializationContext({
      ...fixture.contextRequest,
      id: 'patient-template-clinical-result-materialization-context-request.test.crossed-semantics',
      resourceCoverageArtifact: coverage.value,
    });
    if (!context.ok) throw new Error(context.error.message);

    expect(
      compilePatientTemplateClinicalResultMaterialization({
        schemaVersion: 1,
        id: 'patient-template-clinical-result-materialization-request.test.crossed-semantics',
        materializationContextArtifact: context.value,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'DIRECT_RESULT_COMPILATION_FAILED' },
    });
  });

  it('detects tampering with the frozen D-326 orchestration artifact', () => {
    const fixture = makeClinicalResultMaterializationContextFixture();
    const context = compilePatientTemplateClinicalResultMaterializationContext(
      fixture.contextRequest,
    );
    if (!context.ok) throw new Error(context.error.message);
    const result = compilePatientTemplateClinicalResultMaterialization({
      schemaVersion: 1,
      id: 'patient-template-clinical-result-materialization-request.test.tamper',
      materializationContextArtifact: context.value,
    });
    if (!result.ok) throw new Error(result.error.message);
    const tampered = structuredClone(result.value);
    tampered.patientStateId = 'patient-state.test.illicit-materialization-tamper';

    expect(verifyPatientTemplateClinicalResultMaterializationIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });

  it('derives one exact D-327 D-311 attachment from D-326 only', () => {
    const fixture = compileClinicalResultMaterializationFixture();
    const basePatientState =
      fixture.context.compileRequest.patientStateCompositionArtifact.composedPatientState;
    if (basePatientState === null) throw new Error('Expected one composed D-208 patient.');
    const baseBefore = structuredClone(basePatientState);
    const request = {
      schemaVersion: 1 as const,
      id: 'patient-template-clinical-result-attachment-orchestration-request.test.pipeline',
      materializationArtifact: fixture.materialization,
    };
    const result = orchestratePatientTemplateClinicalResultAttachment(request);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    const artifact = result.value;
    const attached = artifact.patientClinicalResultAttachment;

    expect(
      PatientTemplateClinicalResultAttachmentOrchestrationArtifactSchema.parse(artifact),
    ).toEqual(artifact);
    expect(basePatientState).toEqual(baseBefore);
    expect(basePatientState.measurements).toEqual([]);
    expect(attached.composedPatientState.measurements).toHaveLength(3);
    expect(attached.composedPatientState.categoricalObservations).toEqual([]);
    expect(attached.composedPatientState.structuredTestResults).toEqual([]);
    expect(attached.attachmentRequest.patientStateCompositionArtifact).toEqual(
      fixture.context.compileRequest.patientStateCompositionArtifact,
    );
    expect(attached.attachmentRequest.templateClinicalResultRecipeCompilation).toEqual(
      fixture.materialization.templateClinicalResultRecipeCompilation,
    );
    expect(verifyPatientTemplateClinicalResultAttachmentOrchestrationIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(orchestratePatientTemplateClinicalResultAttachment(request)).toEqual(result);
    expect(artifact).not.toHaveProperty('pointRules');
    expect(artifact).not.toHaveProperty('complexityCost');
    expect(artifact).not.toHaveProperty('encounterInstance');
  }, 15_000);

  it('rejects caller-selected D-208 and D-320 inputs at D-327', () => {
    const fixture = compileClinicalResultMaterializationFixture();
    expect(
      orchestratePatientTemplateClinicalResultAttachment({
        schemaVersion: 1,
        id: 'patient-template-clinical-result-attachment-orchestration-request.test.raw-inputs',
        patientStateCompositionArtifact:
          fixture.context.compileRequest.patientStateCompositionArtifact,
        templateClinicalResultRecipeCompilation:
          fixture.materialization.templateClinicalResultRecipeCompilation,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('rejects an invalid D-326 chain before D-311 attachment', () => {
    const fixture = compileClinicalResultMaterializationFixture();
    const crossed = structuredClone(fixture.materialization);
    crossed.patientStateId = 'patient-state.test.crossed-before-attachment';
    expect(
      orchestratePatientTemplateClinicalResultAttachment({
        schemaVersion: 1,
        id: 'patient-template-clinical-result-attachment-orchestration-request.test.crossed',
        materializationArtifact: crossed,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('detects tampering with the frozen D-327 attachment orchestration', () => {
    const fixture = compileClinicalResultMaterializationFixture();
    const result = orchestratePatientTemplateClinicalResultAttachment({
      schemaVersion: 1,
      id: 'patient-template-clinical-result-attachment-orchestration-request.test.tamper',
      materializationArtifact: fixture.materialization,
    });
    if (!result.ok) throw new Error(result.error.message);
    const tampered = structuredClone(result.value);
    tampered.attachedPatientStateId = 'patient-state.test.illicit-attachment-tamper';

    expect(
      verifyPatientTemplateClinicalResultAttachmentOrchestrationIntegrity(tampered),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });

  it('derives one exact result-enabled D-328 D-312 assembly from D-327 only', () => {
    const fixture = compileClinicalResultAttachmentOrchestrationFixture();
    const request = {
      schemaVersion: 1 as const,
      id: 'patient-template-post-composition-assembly-orchestration-request.test.result-only',
      clinicalResultAttachmentOrchestrationArtifact: fixture.attachmentOrchestration,
      conditionClinicalDurationSourceValidationArtifact: null,
      conditionFunctionalImpairmentSourceValidationArtifact: null,
    };
    const result = orchestratePatientTemplatePostCompositionAssembly(request);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    const artifact = result.value;
    const assembly = artifact.postCompositionAssembly;

    expect(
      PatientTemplatePostCompositionAssemblyOrchestrationArtifactSchema.parse(artifact),
    ).toEqual(artifact);
    expect(assembly.composedPatientState.measurements).toHaveLength(3);
    expect(assembly.composedPatientState.clinicalDurations).toEqual([]);
    expect(assembly.composedPatientState.functionalImpairments).toEqual([]);
    expect(assembly.assemblyRequest.patientClinicalResultAttachmentArtifact).toEqual(
      fixture.attachmentOrchestration.patientClinicalResultAttachment,
    );
    expect(verifyPatientTemplatePostCompositionAssemblyOrchestrationIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(orchestratePatientTemplatePostCompositionAssembly(request)).toEqual(result);
    expect(artifact).not.toHaveProperty('pointRules');
    expect(artifact).not.toHaveProperty('complexityCost');
    expect(artifact).not.toHaveProperty('encounterInstance');
  }, 15_000);

  it('preserves independent D-294 and D-292 branches under D-327 exact-root assembly', () => {
    const fixture = compileClinicalResultAttachmentOrchestrationFixture({
      includeConditionScopedDuration: true,
      includeFunctionalImpairment: true,
    });
    const existingAssembly = fixture.request.postCompositionPatientStateAssemblyArtifact;
    if (existingAssembly === null) {
      throw new Error('Expected one existing synthetic post-composition assembly.');
    }
    const duration =
      existingAssembly.assemblyRequest.conditionClinicalDurationSourceValidationArtifact;
    const impairment =
      existingAssembly.assemblyRequest.conditionFunctionalImpairmentSourceValidationArtifact;
    if (duration === null || impairment === null) {
      throw new Error('Expected D-294 and D-292 fixture branches.');
    }
    const result = orchestratePatientTemplatePostCompositionAssembly({
      schemaVersion: 1,
      id: 'patient-template-post-composition-assembly-orchestration-request.test.all-branches',
      clinicalResultAttachmentOrchestrationArtifact: fixture.attachmentOrchestration,
      conditionClinicalDurationSourceValidationArtifact: duration,
      conditionFunctionalImpairmentSourceValidationArtifact: impairment,
    });
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);

    expect(
      result.value.postCompositionAssembly.composedPatientState.clinicalDurations,
    ).toHaveLength(1);
    expect(
      result.value.postCompositionAssembly.composedPatientState.functionalImpairments,
    ).toHaveLength(1);
    expect(result.value.postCompositionAssembly.composedPatientState.measurements).toHaveLength(3);
    expect(
      verifyPatientTemplatePostCompositionAssemblyOrchestrationIntegrity(result.value),
    ).toEqual({ ok: true, value: result.value });
  }, 15_000);

  it('rejects raw D-208/D-311 inputs and a crossed optional branch at D-328', () => {
    const fixture = compileClinicalResultAttachmentOrchestrationFixture();
    expect(
      orchestratePatientTemplatePostCompositionAssembly({
        schemaVersion: 1,
        id: 'patient-template-post-composition-assembly-orchestration-request.test.raw-inputs',
        patientStateCompositionArtifact:
          fixture.context.compileRequest.patientStateCompositionArtifact,
        patientClinicalResultAttachmentArtifact:
          fixture.attachmentOrchestration.patientClinicalResultAttachment,
        conditionClinicalDurationSourceValidationArtifact: null,
        conditionFunctionalImpairmentSourceValidationArtifact: null,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const foreign = compileClinicalResultAttachmentOrchestrationFixture({
      includeConditionScopedDuration: true,
      generationRoot: 'generation-root.test.foreign-post-composition-orchestration',
    });
    const foreignAssembly = foreign.request.postCompositionPatientStateAssemblyArtifact;
    const foreignDuration =
      foreignAssembly?.assemblyRequest.conditionClinicalDurationSourceValidationArtifact ?? null;
    if (foreignDuration === null) throw new Error('Expected one foreign D-294 branch.');
    expect(
      orchestratePatientTemplatePostCompositionAssembly({
        schemaVersion: 1,
        id: 'patient-template-post-composition-assembly-orchestration-request.test.crossed-duration',
        clinicalResultAttachmentOrchestrationArtifact: fixture.attachmentOrchestration,
        conditionClinicalDurationSourceValidationArtifact: foreignDuration,
        conditionFunctionalImpairmentSourceValidationArtifact: null,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'POST_COMPOSITION_ASSEMBLY_FAILED' },
    });
  });

  it('detects tampering with the frozen D-328 post-composition orchestration', () => {
    const fixture = compileClinicalResultAttachmentOrchestrationFixture();
    const result = orchestratePatientTemplatePostCompositionAssembly({
      schemaVersion: 1,
      id: 'patient-template-post-composition-assembly-orchestration-request.test.tamper',
      clinicalResultAttachmentOrchestrationArtifact: fixture.attachmentOrchestration,
      conditionClinicalDurationSourceValidationArtifact: null,
      conditionFunctionalImpairmentSourceValidationArtifact: null,
    });
    if (!result.ok) throw new Error(result.error.message);
    const tampered = structuredClone(result.value);
    tampered.composedPatientStateId = 'resolved-patient-state.test.illicit-post-composition-tamper';

    expect(
      verifyPatientTemplatePostCompositionAssemblyOrchestrationIntegrity(tampered),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });

  it('routes one source-validated condition-functional-impairment lane through D-312 and D-194', () => {
    const request = makeRequest({ includeFunctionalImpairment: true });
    const postCompositionAssembly = request.postCompositionPatientStateAssemblyArtifact;
    if (postCompositionAssembly === null) {
      throw new Error('Expected one post-composition functional-impairment assembly.');
    }
    const impairmentValidation =
      postCompositionAssembly.assemblyRequest.conditionFunctionalImpairmentSourceValidationArtifact;
    if (impairmentValidation === null) {
      throw new Error('Expected D-312 to retain one D-292 impairment branch.');
    }
    expect(
      verifyConditionFunctionalImpairmentSourceValidationIntegrity(impairmentValidation),
    ).toEqual({
      ok: true,
      value: impairmentValidation,
    });
    expect(verifyPostCompositionPatientStateAssemblyIntegrity(postCompositionAssembly)).toEqual({
      ok: true,
      value: postCompositionAssembly,
    });
    expect(patientStateCompositionOf(request).composedPatientState?.functionalImpairments).toEqual(
      [],
    );

    const artifact = expectComposed(request);
    if (artifact.catalogSnapshot === null) {
      throw new Error('Expected D-200 to retain one compiled D-194 snapshot.');
    }
    const expectedImpairments =
      impairmentValidation.compileRequest.functionalImpairmentAttachment
        .attachedFunctionalImpairments;
    expect(artifact.composerVersion).toBe('27.0.0');
    expect(artifact.postCompositionPatientStateAssemblyArtifact).toEqual(postCompositionAssembly);
    expect(artifact.catalogCompileRequest.basePatientState.functionalImpairments).toEqual(
      expectedImpairments,
    );
    expect(artifact.catalogSnapshot.patientInstance.patientState.functionalImpairments).toEqual(
      expectedImpairments,
    );
    expect(verifyFindingPipelineAuditIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(verifyFindingPipelineAuditContext({ artifact, request })).toEqual({
      ok: true,
      value: artifact,
    });

    const wrongSeedRequest = makeRequest({ includeFunctionalImpairment: true });
    wrongSeedRequest.postCompositionPatientStateAssemblyArtifact =
      makePostCompositionPatientStateAssembly(
        patientStateCompositionOf(wrongSeedRequest),
        null,
        makeConditionFunctionalImpairmentSourceValidation(
          patientStateCompositionOf(wrongSeedRequest),
          'seed.test.pipeline-wrong-functional-impairment-root',
        ),
      );
    expect(composeFindingPipelineAudit(wrongSeedRequest)).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_SEED_CONTEXT_MISMATCH' },
    });

    const legacyRawImpairment = {
      ...request,
      postCompositionPatientStateAssemblyArtifact: undefined,
      conditionFunctionalImpairmentSourceValidationArtifact: impairmentValidation,
    };
    expect(FindingPipelineAuditRequestSchema.safeParse(legacyRawImpairment).success).toBe(false);
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
    expect(artifact.composerVersion).toBe('27.0.0');
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

  it('derives and atomically fills one exact D-330 clinical-result patient from D-324 coverage', () => {
    const fixture = makeClinicalResultFillFixture();
    const before = structuredClone(fixture.input);
    const fill = expectFillCompiled(fixture.input);
    const orchestration = fill.clinicalResultFindingPipelineOrchestrationArtifact;
    const patient =
      fill.findingPipelineAuditArtifact?.catalogSnapshot?.patientInstance.patientState;

    expect(fixture.input).toEqual(before);
    expect(fill.compilerVersion).toBe('3.0.0');
    expect(fill.status).toBe('filled');
    expect(fill.diagnostics).toEqual([]);
    expect(fill.clinicalResultResourceCoverageArtifact).toEqual(fixture.resourceCoverage);
    expect(orchestration).not.toBeNull();
    expect(orchestration?.findingPipelineAuditArtifact).toEqual(fill.findingPipelineAuditArtifact);
    expect(patient?.measurements).toHaveLength(3);
    expect(fill.frozenWaitingSlotProposal?.findingPipelineAuditArtifact).toEqual(
      fill.findingPipelineAuditArtifact,
    );
    expect(EmptyAuthorizedPatientSlotFillArtifactSchema.parse(fill)).toEqual(fill);
    expect(verifyEmptyAuthorizedPatientSlotFillIntegrity(fill)).toEqual({
      ok: true,
      value: fill,
    });
    expect(
      verifyEmptyAuthorizedPatientSlotFillContext({
        artifact: fill,
        currentInput: fixture.input,
      }),
    ).toEqual({ ok: true, value: fill });
    expect(expectFillCompiled(structuredClone(fixture.input))).toEqual(fill);
  }, 90_000);

  it('binds the checked-in D-332 cosmetic presentation to one exact successful D-331 waiting slot', () => {
    const fixture = makeFillFixture({
      generationRoot: 'generated-patient-root.test.d333-filled',
    });
    const fill = expectFillCompiled(fixture.input);
    const before = structuredClone(fill);
    const result = compileGeneratedWaitingSlotLauncherPresentationAttachment({
      schemaVersion: 1,
      id: 'generated-waiting-slot-launcher-presentation-request.test.d333',
      patientSlotFillArtifact: fill,
      presentationProfile: checkedInLauncherPresentationProfile,
      firstNamePool: checkedInLauncherFirstNamePool,
      lastNamePool: checkedInLauncherLastNamePool,
      complaintBanks: checkedInLauncherPresentationCatalog.complaintBanks,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);

    const catalogSnapshot = fill.findingPipelineAuditArtifact!.catalogSnapshot!;
    expect(fill).toEqual(before);
    expect(result.value.compilerVersion).toBe('1.0.0');
    expect(result.value.patientSlotFillArtifactRef).toEqual({
      id: fill.id,
      inputFingerprint: fill.inputFingerprint,
      payloadFingerprint: fill.payloadFingerprint,
    });
    expect(result.value.catalogPresentationAttachment.compileRequest.catalogSnapshot).toEqual(
      catalogSnapshot,
    );
    expect(result.value.frozenPresentation.waitingSlotRef.id).toBe(
      fill.frozenWaitingSlotProposal!.id,
    );
    expect(result.value.frozenPresentation.patientInstanceRef).toEqual({
      id: catalogSnapshot.patientInstance.id,
      payloadFingerprint: catalogSnapshot.patientInstance.payloadFingerprint,
    });
    expect(result.value.frozenPresentation.resolvedPresentation.patientStateId).toBe(
      catalogSnapshot.patientInstance.patientState.id,
    );
    expect(JSON.stringify(result.value.frozenPresentation)).not.toMatch(
      /"seed"|"diagnosisId"|"pointValue"|"ruleId"/,
    );
    expect(
      GeneratedWaitingSlotLauncherPresentationAttachmentArtifactSchema.parse(result.value),
    ).toEqual(result.value);
    expect(verifyGeneratedWaitingSlotLauncherPresentationAttachmentIntegrity(result.value)).toEqual(
      { ok: true, value: result.value },
    );
    expect(
      compileGeneratedWaitingSlotLauncherPresentationAttachment(
        structuredClone(result.value.compileRequest),
      ),
    ).toEqual(result);

    const tampered = structuredClone(result.value);
    tampered.frozenPresentation.waitingSlotRef.id =
      'frozen-generated-waiting-slot.test.crossed-d333';
    expect(
      verifyGeneratedWaitingSlotLauncherPresentationAttachmentIntegrity(tampered),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  }, 90_000);

  it('rejects blocked D-331 fills and caller-supplied launcher authority at D-333', () => {
    const blockedFixture = makeFillFixture({
      generationRoot: 'generated-patient-root.test.d333-blocked',
      authoredCandidates: [opposingCoreFindingCandidate()],
    });
    const blocked = expectFillCompiled(blockedFixture.input);
    expect(blocked.status).toBe('blocked');
    expect(
      compileGeneratedWaitingSlotLauncherPresentationAttachment({
        schemaVersion: 1,
        id: 'generated-waiting-slot-launcher-presentation-request.test.d333-blocked',
        patientSlotFillArtifact: blocked,
        presentationProfile: checkedInLauncherPresentationProfile,
        firstNamePool: checkedInLauncherFirstNamePool,
        lastNamePool: checkedInLauncherLastNamePool,
        complaintBanks: checkedInLauncherPresentationCatalog.complaintBanks,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_SLOT_FILL_NOT_FILLED' },
    });

    const fixture = makeFillFixture({
      generationRoot: 'generated-patient-root.test.d333-caller-authority',
    });
    const filled = expectFillCompiled(fixture.input);
    expect(
      compileGeneratedWaitingSlotLauncherPresentationAttachment({
        schemaVersion: 1,
        id: 'generated-waiting-slot-launcher-presentation-request.test.d333-extra-authority',
        patientSlotFillArtifact: filled,
        presentationProfile: checkedInLauncherPresentationProfile,
        firstNamePool: checkedInLauncherFirstNamePool,
        lastNamePool: checkedInLauncherLastNamePool,
        complaintBanks: checkedInLauncherPresentationCatalog.complaintBanks,
        patientStateId: 'resolved-patient-state.test.caller-authority',
        seed: 'caller-seed',
        catalogSnapshot: filled.findingPipelineAuditArtifact!.catalogSnapshot,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  }, 90_000);

  it('rejects direct result authority and blocks incomplete D-324 coverage without retaining a partial D-330', () => {
    const prebuilt = makeCanonicalResultEnabledFindingPipelineRequest();
    expect(
      compileEmptyAuthorizedPatientSlotFill({
        schemaVersion: 1,
        id: 'empty-authorized-patient-slot-fill-request.test.prebuilt-d331',
        seedAuthorityCompileInput: prebuilt.slotSelection.patientSlotFillSeedAuthorityCompileInput,
        seedAuthorityArtifact: prebuilt.slotSelection.patientSlotFillSeedAuthorityArtifact,
        findingPipelineAuditRequest: prebuilt.request,
        clinicalResultResourceCoverageArtifact: null,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_INPUT' },
    });

    const fixture = makeClinicalResultFillFixture();
    const incompleteCoverageRequest = structuredClone(fixture.resourceCoverage.compileRequest);
    incompleteCoverageRequest.id =
      'patient-template-clinical-result-resource-coverage-request.test.incomplete-d331';
    incompleteCoverageRequest.resourceSet.measurementDefinitions = [];
    const incompleteCoverage =
      compilePatientTemplateClinicalResultResourceCoverage(incompleteCoverageRequest);
    if (!incompleteCoverage.ok) {
      throw new Error(incompleteCoverage.error.message);
    }
    expect(incompleteCoverage.value.coverageStatus).toBe('incomplete');
    const incompleteInput = {
      ...fixture.input,
      id: 'empty-authorized-patient-slot-fill-request.test.incomplete-d331',
      clinicalResultResourceCoverageArtifact: incompleteCoverage.value,
    };
    const incomplete = expectFillCompiled(incompleteInput);
    expect(incomplete.status).toBe('blocked');
    expect(incomplete.findingPipelineAuditArtifact).toBeNull();
    expect(incomplete.clinicalResultFindingPipelineOrchestrationArtifact).toBeNull();
    expect(incomplete.frozenWaitingSlotProposal).toBeNull();
    expect(incomplete.diagnostics).toMatchObject([{ code: 'patient_compilation_failed' }]);
    expect(verifyEmptyAuthorizedPatientSlotFillIntegrity(incomplete)).toEqual({
      ok: true,
      value: incomplete,
    });

    const valid = expectFillCompiled(fixture.input);
    const tampered = structuredClone(valid);
    tampered.clinicalResultFindingPipelineOrchestrationArtifact!.patientStateId =
      'resolved-patient-state.test.tampered-d331';
    expect(verifyEmptyAuthorizedPatientSlotFillIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  }, 60_000);

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
      diagnosisQualifierValidation: 'exact_frozen_qualifier_owners',
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
        modelVersion: 'generated-encounter-point-report.v7',
        balanceCatalogSnapshot: {
          modelVersion: 'decision-balance-catalog-snapshot.v2',
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

  it('derives service-backed treatment charges from frozen owners and rejects charge tampering', () => {
    const fixture = makeFillFixture({
      mode: 'standard',
      includeServiceBackedIntervention: true,
    });
    const fill = expectFillCompiled(fixture.input);
    const waitingSlot = fill.frozenWaitingSlotProposal;
    if (waitingSlot === null) throw new Error('Expected one frozen waiting patient.');
    const treatmentEvent: GeneratedEncounterActionEventInput = {
      id: 'generated-action-event.test.treatment-service',
      type: 'TreatmentSelectionsChanged',
      selections: {
        schemaVersion: 1,
        selectionVersion: 2,
        medicationTransition: {
          selectionVersion: 2,
          startMedicationIds: [],
          adjustments: [],
        },
        interventionIds: ['intervention.test.pipeline-brief-counseling'],
        dispositionId: 'disposition.outpatient',
      },
    };
    const attempt = createNativeGeneratedAttempt({
      attemptId: 'generated-completed-attempt.test.treatment-service',
      mode: 'standard',
      frozenWaitingSlot: waitingSlot,
      actionEvents: [treatmentEvent],
    });

    expect(attempt.replaySnapshot).toMatchObject({
      modelVersion: 'generated-encounter-replay-snapshot.v5',
      treatmentPricingOwners: [
        {
          treatment: {
            id: 'disposition.outpatient',
            fulfillmentServiceId: null,
          },
        },
        {
          treatment: {
            id: 'intervention.test.pipeline-brief-counseling',
            fulfillmentServiceId: 'service.test.pipeline-brief-counseling',
          },
        },
      ],
    });
    expect(attempt.replaySnapshot.treatmentRuntimeHorizon).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          treatmentRef: expect.objectContaining({
            id: 'intervention.test.pipeline-brief-counseling',
          }),
          availableFulfillmentMethodIds: [
            'fulfillment.test.pipeline-brief-counseling.in-house',
            'fulfillment.test.pipeline-brief-counseling.outside',
          ],
        }),
      ]),
    );
    expect(attempt.settlement).toMatchObject({
      modelVersion: 'generated-encounter-settlement.v4',
      treatmentCharges: [
        {
          actionTarget: {
            kind: 'intervention',
            interventionId: 'intervention.test.pipeline-brief-counseling',
          },
          fulfillmentMethodId: 'fulfillment.test.pipeline-brief-counseling.in-house',
          operatingCost: 20,
          externalCostAvoided: 40,
          upgradeSavings: 0,
          pricingDerivation: 'native_versioned_treatment_service_quote.v1',
        },
      ],
      treatmentExpenses: 20,
      projectedNetPointsEarned: 380,
      bankedPointsEarned: 380,
    });
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(attempt)).toEqual({
      ok: true,
      value: attempt,
    });

    const unselected = createNativeGeneratedAttempt({
      attemptId: 'generated-completed-attempt.test.treatment-service-unselected',
      mode: 'standard',
      frozenWaitingSlot: waitingSlot,
    });
    expect(unselected.settlement.treatmentCharges).toEqual([]);
    expect(unselected.settlement.treatmentExpenses).toBe(0);

    const chargeTamper = structuredClone(attempt);
    chargeTamper.settlement.treatmentCharges[0]!.operatingCost += 1;
    chargeTamper.settlement.treatmentExpenses += 1;
    chargeTamper.settlement.operatingExpenses += 1;
    chargeTamper.settlement.calculatedPayout -= 1;
    chargeTamper.settlement.projectedNetPointsEarned -= 1;
    chargeTamper.settlement.bankedPointsEarned -= 1;
    chargeTamper.settlement.persistentPointsAfter -= 1;
    chargeTamper.settlement.lifetimePointsAfter -= 1;
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(chargeTamper)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });
  });

  it('derives reimbursement, satisfaction, and bank state from exact frozen owners', () => {
    const fixture = makeFillFixture({ mode: 'standard' });
    const fill = expectFillCompiled(fixture.input);
    const waitingSlot = fill.frozenWaitingSlotProposal;
    if (waitingSlot === null) throw new Error('Expected one frozen waiting patient.');
    const settlement = generatedSettlementForWaiting(waitingSlot, {
      baseReimbursement: 500,
      challengeBonus: 25,
      clinicPoints: 125,
      lifetimePointsEarned: 2_000,
      satisfaction: 20,
    });
    const attempt = createNativeGeneratedAttempt({
      attemptId: 'generated-completed-attempt.test.native-settlement-context',
      mode: 'standard',
      frozenWaitingSlot: waitingSlot,
      settlement,
    });

    expect(attempt.replaySnapshot.settlementContext).toMatchObject({
      modelVersion: 'generated-encounter-settlement-context.v1',
      economyPolicy: {
        id: settlement.economyPolicy.id,
        baseReimbursement: 500,
        challengeBonus: 25,
      },
      clinicState: {
        id: settlement.clinicState.id,
        clinicPoints: 125,
        lifetimePointsEarned: 2_000,
        satisfaction: 20,
      },
      derivedSatisfactionMultiplier: 1.075,
    });
    expect(attempt.settlement).toMatchObject({
      settlementDerivation:
        'native_economy_policy_clinic_state_satisfaction_and_service_pricing.v1',
      baseReimbursement: 500,
      challengeBonus: 25,
      satisfactionMultiplier: 1.075,
      grossPayout: 564,
      projectedNetPointsEarned: 564,
      bankedPointsEarned: 564,
      persistentPointsBefore: 125,
      persistentPointsAfter: 689,
      lifetimePointsBefore: 2_000,
      lifetimePointsAfter: 2_564,
    });
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(attempt)).toEqual({
      ok: true,
      value: attempt,
    });

    expect(
      GeneratedEncounterSettlementInputSchema.safeParse({
        producerRef: settlement.producerRef,
        baseReimbursement: 500,
        challengeBonus: 25,
        satisfactionMultiplier: 1.075,
        persistentPointsBefore: 125,
        lifetimePointsBefore: 2_000,
      }).success,
    ).toBe(false);

    const crossedPolicy = structuredClone(settlement);
    crossedPolicy.economyPolicy.templateFingerprint =
      waitingSlot.findingPipelineAuditArtifact.patientSlotFillSeedAuthorityArtifact.coordinates.locationFingerprint;
    expect(() =>
      createNativeGeneratedAttempt({
        attemptId: 'generated-completed-attempt.test.crossed-economy-policy',
        mode: 'standard',
        frozenWaitingSlot: waitingSlot,
        settlement: crossedPolicy,
      }),
    ).toThrow(/exact waiting-patient template/i);

    const staleSatisfaction = structuredClone(settlement);
    staleSatisfaction.clinicState.satisfaction = 0;
    expect(() =>
      createNativeGeneratedAttempt({
        attemptId: 'generated-completed-attempt.test.stale-satisfaction',
        mode: 'standard',
        frozenWaitingSlot: waitingSlot,
        settlement: staleSatisfaction,
      }),
    ).toThrow(/stored clinic satisfaction multiplier/i);

    const contextTamper = structuredClone(attempt);
    contextTamper.replaySnapshot.settlementContext.clinicState.clinicPoints += 1;
    expect(verifyGeneratedCompletedEncounterAttemptIntegrity(contextTamper)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });
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
        diagnosisSelectionOwners: { definitions: [] },
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
        settlement: generatedSettlementForWaiting(fixture.waitingSlot),
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
      modelVersion: 'generated-completed-encounter-attempt.v5',
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
