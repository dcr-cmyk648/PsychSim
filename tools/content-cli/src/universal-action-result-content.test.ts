import {
  ClinicalDurationProfileCatalogSchema,
  FindingProjectionCatalogSchema,
  FindingProjectionHorizonCatalogSchema,
  MeasurementCatalogSchema,
  ResolvedPatientStateSchema,
  UniversalActionResultAssemblyCatalogSchema,
  type ClinicalRuleReview,
  type FindingResolutionCandidate,
  type ResolvedPatientState,
  type SharedFindingCompileRequest,
  type StructuredPatientStateRevealDefinition,
  type StructuredSourceReportLaneBehavior,
  type StructuredSourceReportProfile,
  type UniversalActionResultAssemblyCatalog,
} from '@psychsim/schemas';
import { catalogs } from '@psychsim/content-runtime';
import {
  compileInstrumentItemResponses,
  compileSharedFindings,
  compileStructuredSourceReports,
  compileTargetScopedPatientValueProjections,
  compileUniversalActionResults,
  deriveInstrumentInformationActionHorizon,
  fingerprintInformationActionPayload,
  fingerprintStructuredSourceReportDefinition,
  verifyUniversalActionResultArtifactIntegrity,
} from '@psychsim/engine/authoring';
import { describe, expect, it } from 'vitest';

import findingProjectionHorizonsJson from '../../../content/catalogs/findings/projection-horizons.json';
import findingProjectionsJson from '../../../content/catalogs/findings/projections.json';
import universalActionResultAssembliesJson from '../../../content/catalogs/actions/universal-action-result-assemblies.json';
import clinicalDurationProfilesJson from '../../../content/catalogs/durations/profiles.json';
import measurementDefinitionsJson from '../../../content/catalogs/measurements/definitions.json';

const projectionCatalog = FindingProjectionCatalogSchema.parse(findingProjectionsJson);
const horizonCatalog = FindingProjectionHorizonCatalogSchema.parse(findingProjectionHorizonsJson);
const assemblyCatalog = UniversalActionResultAssemblyCatalogSchema.parse(
  universalActionResultAssembliesJson,
);
const durationProfileCatalog = ClinicalDurationProfileCatalogSchema.parse(
  clinicalDurationProfilesJson,
);
const measurementCatalog = MeasurementCatalogSchema.parse(measurementDefinitionsJson);
const horizonDefinition = horizonCatalog.horizons[0]!;
const assembly = assemblyCatalog.assemblies[0]!;
const action = assembly.actionCatalog.actions[0]!;
const safetyHorizonDefinition = horizonCatalog.horizons.find(
  (candidate) => candidate.id === 'finding-projection-horizon.history.suicide-safety',
)!;
const safetyAssembly = assemblyCatalog.assemblies.find(
  (candidate) => candidate.id === 'universal-action-result-assembly.history.suicide-safety',
)!;
const safetyAction = safetyAssembly.actionCatalog.actions[0]!;
const safetyPlanningAssembly = assemblyCatalog.assemblies.find(
  (candidate) =>
    candidate.id === 'universal-action-result-assembly.history.safety-planning-ability',
)!;
const safetyPlanningAction = safetyPlanningAssembly.actionCatalog.actions[0]!;
const safetyPlanningDefinition = safetyPlanningAssembly.structuredRevealDefinitions[0]!;
const medicationReconciliationAssembly = assemblyCatalog.assemblies.find(
  (candidate) =>
    candidate.id === 'universal-action-result-assembly.history.medication-reconciliation',
)!;
const medicationReconciliationAction = medicationReconciliationAssembly.actionCatalog.actions[0]!;
const medicationReconciliationDefinition =
  medicationReconciliationAssembly.structuredRevealDefinitions[0]!;
const reactionHistoryAssembly = assemblyCatalog.assemblies.find(
  (candidate) =>
    candidate.id === 'universal-action-result-assembly.history.allergies-adverse-reactions',
)!;
const reactionHistoryAction = reactionHistoryAssembly.actionCatalog.actions[0]!;
const reactionHistoryDefinition = reactionHistoryAssembly.structuredRevealDefinitions[0]!;
const substanceUseAssembly = assemblyCatalog.assemblies.find(
  (candidate) => candidate.id === 'universal-action-result-assembly.history.substance-use',
)!;
const substanceUseAction = substanceUseAssembly.actionCatalog.actions[0]!;
const substanceUseDefinition = substanceUseAssembly.structuredRevealDefinitions[0]!;
const priorMedicationTrialsAssembly = assemblyCatalog.assemblies.find(
  (candidate) =>
    candidate.id === 'universal-action-result-assembly.history.prior-medication-trials',
)!;
const priorMedicationTrialsAction = priorMedicationTrialsAssembly.actionCatalog.actions[0]!;
const priorMedicationTrialsDefinition =
  priorMedicationTrialsAssembly.structuredRevealDefinitions[0]!;
const fullTreatmentHistoryAssembly = assemblyCatalog.assemblies.find(
  (candidate) => candidate.id === 'universal-action-result-assembly.history.full-treatment-history',
)!;
const fullTreatmentHistoryAction = fullTreatmentHistoryAssembly.actionCatalog.actions[0]!;
const fullTreatmentHistoryDefinition = fullTreatmentHistoryAssembly.structuredRevealDefinitions[0]!;
const medicationEffectsAssembly = assemblyCatalog.assemblies.find(
  (candidate) => candidate.id === 'universal-action-result-assembly.history.medication-effects',
)!;
const medicationEffectsAction = medicationEffectsAssembly.actionCatalog.actions[0]!;
const medicationEffectsDefinition = medicationEffectsAssembly.structuredRevealDefinitions[0]!;
const foundationAssembly = assemblyCatalog.assemblies.find(
  (candidate) =>
    candidate.id === 'universal-action-result-assembly.mdd-initial-assessment-foundation',
)!;
const foundationHorizonDefinition = horizonCatalog.horizons.find(
  (candidate) => candidate.id === 'finding-projection-horizon.mdd-initial-assessment-foundation',
)!;
const presentingProblemAction = foundationAssembly.actionCatalog.actions.find(
  (candidate) => candidate.id === 'info.history.presenting-problem',
)!;
const foundationDepressiveSymptomsAction = foundationAssembly.actionCatalog.actions.find(
  (candidate) => candidate.id === 'info.history.depressive-symptoms',
)!;
const durationDefinition = foundationAssembly.targetScopedPatientValueProjectionDefinitions[0]!;
const weightBmiAssembly = assemblyCatalog.assemblies.find(
  (candidate) => candidate.id === 'universal-action-result-assembly.physical.weight-bmi',
)!;
const weightBmiAction = weightBmiAssembly.actionCatalog.actions[0]!;
const weightBmiMeasurementDefinitions = measurementCatalog.measurements.filter((definition) =>
  [
    'measurement.anthropometric.height',
    'measurement.anthropometric.weight',
    'measurement.anthropometric.bmi',
  ].includes(definition.id),
);
const bodyHabitusObservationDefinitions = measurementCatalog.categoricalObservations.filter(
  (definition) => definition.id === 'observation.physical.body-habitus',
);

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.dustin-rowland',
  reviewedAt: '2026-08-03T13:50:00.000Z',
  sourceUseNoteIds: [],
};

const projectionIds = new Set(horizonDefinition.projectionRefs.map((reference) => reference.id));
const projections = projectionCatalog.projections.filter((projection) =>
  projectionIds.has(projection.id),
);
const findingIds = new Set(
  projections.flatMap((projection) =>
    projection.sourceBindings.flatMap((binding) =>
      binding.kind === 'canonical_finding' ? [binding.findingDefinitionId] : [],
    ),
  ),
);
const findingDefinitions = catalogs.findings.filter((finding) => findingIds.has(finding.id));
const safetyProjectionIds = new Set(
  safetyHorizonDefinition.projectionRefs.map((reference) => reference.id),
);
const safetyProjections = projectionCatalog.projections.filter((projection) =>
  safetyProjectionIds.has(projection.id),
);
const safetyFindingIds = new Set(
  safetyProjections.flatMap((projection) =>
    projection.sourceBindings.flatMap((binding) =>
      binding.kind === 'canonical_finding' ? [binding.findingDefinitionId] : [],
    ),
  ),
);
const safetyFindingDefinitions = catalogs.findings.filter((finding) =>
  safetyFindingIds.has(finding.id),
);
const foundationProjectionIds = new Set(
  foundationHorizonDefinition.projectionRefs.map((reference) => reference.id),
);
const foundationProjections = projectionCatalog.projections.filter((projection) =>
  foundationProjectionIds.has(projection.id),
);
const foundationFindingIds = new Set(
  foundationProjections.flatMap((projection) =>
    projection.sourceBindings.flatMap((binding) =>
      binding.kind === 'canonical_finding' ? [binding.findingDefinitionId] : [],
    ),
  ),
);
const foundationFindingDefinitions = catalogs.findings.filter((finding) =>
  foundationFindingIds.has(finding.id),
);

const sharedFindingRequest = (): SharedFindingCompileRequest => {
  const depressedMood = findingDefinitions.find(
    (finding) => finding.id === 'finding.depressive.depressed-mood',
  )!;
  const candidate: FindingResolutionCandidate = {
    schemaVersion: 1,
    id: 'finding-candidate.test.action-result-content.depressed-mood',
    findingDefinitionId: depressedMood.id,
    findingDefinitionContentVersion: depressedMood.contentVersion,
    kind: 'case_critical',
    proposedValue: { kind: 'outcome', value: 'present' },
    uncertainty: 'none',
    contributions: [
      {
        schemaVersion: 1,
        id: 'finding-contribution.test.action-result-content.depressed-mood',
        ownerKind: 'patient_template',
        ownerId: 'patient-template.test.action-result-content',
        ownerContentVersion: '1.0.0',
        role: 'constraint',
        provenanceIds: ['provenance.test.action-result-content'],
      },
    ],
    resolution: {
      origin: 'authored',
      ownerId: 'patient-template.test.action-result-content',
      ownerContentVersion: '1.0.0',
    },
    review: approvedReview,
  };
  return {
    schemaVersion: 1,
    id: 'finding-compilation-request.test.action-result-content',
    patientStateId: 'resolved-patient-state.test.action-result-content',
    seed: 'seed.test.action-result-content',
    findingDefinitions,
    candidates: [candidate],
    propositionState: {
      schemaVersion: 1,
      id: 'resolved-proposition-state.test.action-result-content',
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    propositionDefinitions: [],
    projections,
    expressionBanks: [],
    projectionHorizon: horizonDefinition.horizon,
  };
};

const foundationSharedFindingRequest = (): SharedFindingCompileRequest => {
  const base = sharedFindingRequest();
  const functionalImpact = foundationFindingDefinitions.find(
    (finding) => finding.id === 'finding.function.self-reported-current-impact',
  );
  if (!functionalImpact) {
    throw new Error('Missing current self-reported functional-impact fixture finding.');
  }
  const functionalImpactCandidate: FindingResolutionCandidate = {
    schemaVersion: 1,
    id: 'finding-candidate.test.action-result-content.functional-impact',
    findingDefinitionId: functionalImpact.id,
    findingDefinitionContentVersion: functionalImpact.contentVersion,
    kind: 'case_critical',
    proposedValue: { kind: 'outcome', value: 'present' },
    uncertainty: 'none',
    contributions: [
      {
        schemaVersion: 1,
        id: 'finding-contribution.test.action-result-content.functional-impact',
        ownerKind: 'patient_template',
        ownerId: 'patient-template.test.action-result-content',
        ownerContentVersion: '1.0.0',
        role: 'constraint',
        provenanceIds: ['provenance.test.action-result-content'],
      },
    ],
    resolution: {
      origin: 'authored',
      ownerId: 'patient-template.test.action-result-content',
      ownerContentVersion: '1.0.0',
    },
    review: approvedReview,
  };
  return {
    ...base,
    findingDefinitions: foundationFindingDefinitions,
    candidates: [...base.candidates, functionalImpactCandidate],
    projections: foundationProjections,
    projectionHorizon: foundationHorizonDefinition.horizon,
  };
};

const safetySharedFindingRequest = (): SharedFindingCompileRequest => {
  const makeCandidate = (
    suffix: string,
    findingDefinitionId: string,
  ): FindingResolutionCandidate => {
    const definition = safetyFindingDefinitions.find(
      (finding) => finding.id === findingDefinitionId,
    );
    if (!definition) throw new Error(`Missing safety finding ${findingDefinitionId}.`);
    return {
      schemaVersion: 1,
      id: `finding-candidate.test.suicide-safety.${suffix}`,
      findingDefinitionId: definition.id,
      findingDefinitionContentVersion: definition.contentVersion,
      kind: 'case_critical',
      proposedValue: { kind: 'outcome', value: 'present' },
      uncertainty: 'none',
      contributions: [
        {
          schemaVersion: 1,
          id: `finding-contribution.test.suicide-safety.${suffix}`,
          ownerKind: 'patient_template',
          ownerId: 'patient-template.test.suicide-safety',
          ownerContentVersion: '1.0.0',
          role: 'constraint',
          provenanceIds: ['provenance.test.suicide-safety'],
        },
      ],
      resolution: {
        origin: 'authored',
        ownerId: 'patient-template.test.suicide-safety',
        ownerContentVersion: '1.0.0',
      },
      review: approvedReview,
    };
  };
  return {
    schemaVersion: 1,
    id: 'finding-compilation-request.test.suicide-safety',
    patientStateId: 'resolved-patient-state.test.suicide-safety',
    seed: 'seed.test.suicide-safety',
    findingDefinitions: safetyFindingDefinitions,
    candidates: [
      makeCandidate('active-ideation', 'finding.safety.current-active-suicidal-ideation'),
      makeCandidate('intent', 'finding.safety.current-suicidal-intent'),
    ],
    propositionState: {
      schemaVersion: 1,
      id: 'resolved-proposition-state.test.suicide-safety',
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    propositionDefinitions: [],
    projections: safetyProjections,
    expressionBanks: [],
    projectionHorizon: safetyHorizonDefinition.horizon,
  };
};

const compileUniversalResult = () => {
  const sharedRequest = sharedFindingRequest();
  const shared = compileSharedFindings(sharedRequest);
  if (!shared.ok) throw new Error(shared.error.message);

  const patientState = ResolvedPatientStateSchema.parse({
    schemaVersion: 1,
    id: sharedRequest.patientStateId,
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
      id: 'resolved-exposure-inventory.test.action-result-content',
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
    canonicalFindings: shared.value.findings,
    measurements: [],
    categoricalObservations: [],
    structuredTestResults: [],
    clinicalContexts: [],
    clinicalDurations: [],
    subjectiveBurdenRecords: [],
    propositionState: sharedRequest.propositionState,
    clinicalTagIds: [],
    reportedSafetyPlanningAbility: 'unassessed',
  });
  const actionHorizon = {
    schemaVersion: 1 as const,
    id: 'decision-action-horizon.test.action-result-content',
    informationActionIds: [action.id],
    startMedicationIds: [],
    regimenEntryOperations: [],
    interventionIds: [],
    dispositionIds: [],
  };
  const instrumentResponses = compileInstrumentItemResponses({
    schemaVersion: 1,
    id: 'instrument-response-request.test.action-result-content',
    sharedFindingCompilation: shared.value,
    findingProjectionHorizon: horizonDefinition.horizon,
    actionCatalog: assembly.actionCatalog,
    actionHorizon: deriveInstrumentInformationActionHorizon(actionHorizon),
    instrumentDefinitions: [],
  });
  if (!instrumentResponses.ok) throw new Error(instrumentResponses.error.message);

  const result = compileUniversalActionResults({
    schemaVersion: 1,
    id: 'universal-action-result-request.test.checked-in-depressive-symptoms',
    patientState,
    actionCatalog: assembly.actionCatalog,
    actionHorizon,
    sharedFindingCompilation: shared.value,
    findingProjectionHorizon: horizonDefinition.horizon,
    instrumentItemResponseCompilation: instrumentResponses.value,
    targetScopedPatientValueProjectionArtifact: null,
    structuredRevealEnvelopes: [],
    measurementDefinitions: [],
    categoricalObservationDefinitions: [],
    testDefinitions: [],
    recipes: assembly.recipes,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const compileSafetyUniversalResult = () => {
  const sharedRequest = safetySharedFindingRequest();
  const shared = compileSharedFindings(sharedRequest);
  if (!shared.ok) throw new Error(shared.error.message);

  const patientState = ResolvedPatientStateSchema.parse({
    schemaVersion: 1,
    id: sharedRequest.patientStateId,
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
      id: 'resolved-exposure-inventory.test.suicide-safety',
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
    canonicalFindings: shared.value.findings,
    measurements: [],
    categoricalObservations: [],
    structuredTestResults: [],
    clinicalContexts: [],
    clinicalDurations: [],
    subjectiveBurdenRecords: [],
    propositionState: sharedRequest.propositionState,
    clinicalTagIds: [],
    reportedSafetyPlanningAbility: 'reports_unable',
  });
  const actionHorizon = {
    schemaVersion: 1 as const,
    id: 'decision-action-horizon.test.suicide-safety',
    informationActionIds: [safetyAction.id],
    startMedicationIds: [],
    regimenEntryOperations: [],
    interventionIds: [],
    dispositionIds: [],
  };
  const instrumentResponses = compileInstrumentItemResponses({
    schemaVersion: 1,
    id: 'instrument-response-request.test.suicide-safety',
    sharedFindingCompilation: shared.value,
    findingProjectionHorizon: safetyHorizonDefinition.horizon,
    actionCatalog: safetyAssembly.actionCatalog,
    actionHorizon: deriveInstrumentInformationActionHorizon(actionHorizon),
    instrumentDefinitions: [],
  });
  if (!instrumentResponses.ok) throw new Error(instrumentResponses.error.message);

  const result = compileUniversalActionResults({
    schemaVersion: 1,
    id: 'universal-action-result-request.test.suicide-safety',
    patientState,
    actionCatalog: safetyAssembly.actionCatalog,
    actionHorizon,
    sharedFindingCompilation: shared.value,
    findingProjectionHorizon: safetyHorizonDefinition.horizon,
    instrumentItemResponseCompilation: instrumentResponses.value,
    targetScopedPatientValueProjectionArtifact: null,
    structuredRevealEnvelopes: [],
    measurementDefinitions: [],
    categoricalObservationDefinitions: [],
    testDefinitions: [],
    recipes: safetyAssembly.recipes,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

type StructuredActionResultFixture = {
  suffix: string;
  assembly: UniversalActionResultAssemblyCatalog['assemblies'][number];
  definition: StructuredPatientStateRevealDefinition;
  patientStateOverrides?: Partial<
    Pick<
      ResolvedPatientState,
      | 'exposureInventory'
      | 'currentMedicationDosePositions'
      | 'currentMedicationReportedBenefits'
      | 'medicationChangeTemporalRelationships'
      | 'medicationRegimenEntries'
      | 'medicationTolerabilityFindings'
      | 'reactionHistory'
      | 'reportedSafetyPlanningAbility'
      | 'treatmentHistory'
    >
  >;
  laneBehaviors: StructuredSourceReportLaneBehavior[];
  singletonBehaviors: StructuredSourceReportProfile['singletonBehaviors'];
  developerOpinionIds: string[];
};

const compileStructuredActionUniversalResult = ({
  suffix,
  assembly: structuredAssembly,
  definition,
  patientStateOverrides = {},
  laneBehaviors,
  singletonBehaviors,
  developerOpinionIds,
}: StructuredActionResultFixture) => {
  const structuredAction = structuredAssembly.actionCatalog.actions[0]!;
  const patientStateId = `resolved-patient-state.test.${suffix}`;
  const unprojectedDefinition = findingDefinitions[0]!;
  const unprojectedCandidate: FindingResolutionCandidate = {
    schemaVersion: 1,
    id: `finding-candidate.test.${suffix}.unprojected`,
    findingDefinitionId: unprojectedDefinition.id,
    findingDefinitionContentVersion: unprojectedDefinition.contentVersion,
    kind: 'background_variation',
    proposedValue: { kind: 'outcome', value: 'absent' },
    uncertainty: 'none',
    contributions: [
      {
        schemaVersion: 1,
        id: `finding-contribution.test.${suffix}.unprojected`,
        ownerKind: 'patient_template',
        ownerId: `patient-template.test.${suffix}`,
        ownerContentVersion: '1.0.0',
        role: 'constraint',
        provenanceIds: [`provenance.test.${suffix}`],
      },
    ],
    resolution: {
      origin: 'authored',
      ownerId: `patient-template.test.${suffix}`,
      ownerContentVersion: '1.0.0',
    },
    review: approvedReview,
  };
  const propositionState = {
    schemaVersion: 1 as const,
    id: `resolved-proposition-state.test.${suffix}`,
    propositions: [],
    evidence: [],
    dependencyGroups: [],
    beliefAppraisals: [],
  };
  const unprojectedFindingRequest: SharedFindingCompileRequest = {
    schemaVersion: 1,
    id: `finding-compilation-request.test.${suffix}`,
    patientStateId,
    seed: `seed.test.${suffix}`,
    findingDefinitions: [unprojectedDefinition],
    candidates: [unprojectedCandidate],
    propositionState,
    propositionDefinitions: [],
    projections: [],
    expressionBanks: [],
    projectionHorizon: {
      schemaVersion: 1,
      id: `finding-projection-horizon.test.${suffix}`,
      targets: [],
    },
  };
  const shared = compileSharedFindings(unprojectedFindingRequest);
  if (!shared.ok) throw new Error(shared.error.message);

  const patientState = ResolvedPatientStateSchema.parse({
    schemaVersion: 1,
    id: patientStateId,
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
      id: `resolved-exposure-inventory.test.${suffix}`,
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
    canonicalFindings: shared.value.findings,
    measurements: [],
    categoricalObservations: [],
    structuredTestResults: [],
    clinicalContexts: [],
    clinicalDurations: [],
    subjectiveBurdenRecords: [],
    propositionState,
    clinicalTagIds: [],
    reportedSafetyPlanningAbility: 'unassessed',
    ...patientStateOverrides,
  });
  const profile: StructuredSourceReportProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `source-report-profile.test.${suffix}`,
    modelVersion: 'structured-source-report-profile.v1',
    label: `Synthetic exact ${suffix} report`,
    definitionRef: {
      id: definition.id,
      contentVersion: definition.contentVersion,
    },
    definitionFingerprint: fingerprintStructuredSourceReportDefinition(definition),
    source: {
      kind: 'patient_report',
      sourceInstanceId: `source-instance.test.${suffix}.patient`,
    },
    timeScopeId: 'time-scope.current',
    claimOriginId: `claim-origin.test.${suffix}`,
    dependencyGroupIds: [],
    laneBehaviors,
    singletonBehaviors,
    developerOpinionIds,
    lifecycle: 'approved',
    review: {
      status: 'approved',
      reviewerId: 'reviewer.dustin-rowland',
      reviewedAt: '2026-07-27T18:10:21.000Z',
      sourceUseNoteIds: [],
    },
  };
  const sourceReports = compileStructuredSourceReports({
    schemaVersion: 1,
    id: `structured-source-report-request.test.${suffix}`,
    patientState,
    definitions: [definition],
    profiles: [profile],
  });
  if (!sourceReports.ok) throw new Error(sourceReports.error.message);
  const structuredRevealEnvelopes = sourceReports.value.projectionRecipes.map((recipe) => ({
    definition: recipe.definition,
    patientState,
    resolved: recipe.resolved,
  }));
  const actionHorizon = {
    schemaVersion: 1 as const,
    id: `decision-action-horizon.test.${suffix}`,
    informationActionIds: [structuredAction.id],
    startMedicationIds: [],
    regimenEntryOperations: [],
    interventionIds: [],
    dispositionIds: [],
  };
  const instrumentResponses = compileInstrumentItemResponses({
    schemaVersion: 1,
    id: `instrument-response-request.test.${suffix}`,
    sharedFindingCompilation: shared.value,
    findingProjectionHorizon: unprojectedFindingRequest.projectionHorizon,
    actionCatalog: structuredAssembly.actionCatalog,
    actionHorizon: deriveInstrumentInformationActionHorizon(actionHorizon),
    instrumentDefinitions: [],
  });
  if (!instrumentResponses.ok) throw new Error(instrumentResponses.error.message);

  const result = compileUniversalActionResults({
    schemaVersion: 1,
    id: `universal-action-result-request.test.${suffix}`,
    patientState,
    actionCatalog: structuredAssembly.actionCatalog,
    actionHorizon,
    sharedFindingCompilation: shared.value,
    findingProjectionHorizon: unprojectedFindingRequest.projectionHorizon,
    instrumentItemResponseCompilation: instrumentResponses.value,
    targetScopedPatientValueProjectionArtifact: null,
    structuredRevealEnvelopes,
    measurementDefinitions: [],
    categoricalObservationDefinitions: [],
    testDefinitions: [],
    recipes: structuredAssembly.recipes,
  });
  if (!result.ok) throw new Error(result.error.message);
  return {
    artifact: result.value,
    resolvedReveal: sourceReports.value.projectionRecipes[0]!.resolved,
  };
};

const compileSafetyPlanningUniversalResult = () =>
  compileStructuredActionUniversalResult({
    suffix: 'safety-planning-ability',
    assembly: safetyPlanningAssembly,
    definition: safetyPlanningDefinition,
    patientStateOverrides: {
      reportedSafetyPlanningAbility: 'reports_unable',
    },
    laneBehaviors: [],
    singletonBehaviors: [
      {
        field: 'reported_safety_planning_ability',
        presentation: { kind: 'mirror_truth' },
      },
    ],
    developerOpinionIds: ['developer-opinion.safety-planning-ability-result.2026-07-27'],
  });

const compileMedicationReconciliationUniversalResult = () =>
  compileStructuredActionUniversalResult({
    suffix: 'medication-reconciliation',
    assembly: medicationReconciliationAssembly,
    definition: medicationReconciliationDefinition,
    patientStateOverrides: {
      medicationRegimenEntries: [
        {
          recordVersion: 2,
          id: 'regimen-entry.test.medication-reconciliation.sertraline',
          medicationIdentityId: 'medication.sertraline',
          clinicalRole: 'psychiatric',
          status: 'active',
          adherence: 'consistent',
          prescribedForDiagnosisId: null,
          source: 'patient_report',
          knownAtOpening: false,
          impactClassification: 'neutral_background',
        },
      ],
    },
    laneBehaviors: [
      {
        lane: 'medication_regimen_entries',
        behavior: 'report_all',
      },
    ],
    singletonBehaviors: [],
    developerOpinionIds: [
      'developer-opinion.treatment-triggered-history-and-prior-reactions.2026-07-27',
    ],
  });

const compileReactionHistoryUniversalResult = () =>
  compileStructuredActionUniversalResult({
    suffix: 'allergies-adverse-reactions',
    assembly: reactionHistoryAssembly,
    definition: reactionHistoryDefinition,
    patientStateOverrides: {
      reactionHistory: {
        status: 'entries_present',
        medicationAssessmentStatus: 'entries_present',
        records: [
          {
            schemaVersion: 1,
            id: 'reaction-record.test.allergies-adverse-reactions.haloperidol',
            trigger: {
              kind: 'medication',
              medicationId: 'medication.haloperidol',
            },
            recordedAs: 'adverse_reaction',
            manifestationIds: ['manifestation.movement.oculogyric-crisis'],
            reportedSeverity: 'severe',
            interpretedAs: null,
            source: 'patient_report',
            status: 'historical',
          },
        ],
      },
    },
    laneBehaviors: [
      {
        lane: 'reaction_records',
        behavior: 'report_all',
      },
    ],
    singletonBehaviors: [
      {
        field: 'reaction_history_status',
        presentation: { kind: 'mirror_truth' },
      },
      {
        field: 'medication_reaction_assessment_status',
        presentation: { kind: 'mirror_truth' },
      },
    ],
    developerOpinionIds: [
      'developer-opinion.treatment-triggered-history-and-prior-reactions.2026-07-27',
    ],
  });

const compileSubstanceUseUniversalResult = () =>
  compileStructuredActionUniversalResult({
    suffix: 'substance-use',
    assembly: substanceUseAssembly,
    definition: substanceUseDefinition,
    patientStateOverrides: {
      exposureInventory: {
        schemaVersion: 1,
        id: 'resolved-exposure-inventory.test.substance-use',
        useEntries: [
          {
            schemaVersion: 1,
            id: 'exposure-use.test.substance-use.cannabis',
            agent: {
              kind: 'other_substance',
              identityId: 'substance.cannabis',
              identityContentVersion: '1.0.0',
            },
            mostRecentUse: { kind: 'current' },
            currentAmount: {
              quantity: 1,
              unitLabel: 'category',
              frequencyLabel: 'moderate',
            },
            prescriptionRelationship: 'not_applicable',
            misuseTruth: false,
            resolution: {
              origin: 'authored',
              ownerId: 'patient-template.test.substance-use',
              ownerContentVersion: '1.0.0',
            },
          },
        ],
      },
    },
    laneBehaviors: [
      {
        lane: 'exposure_use_entries',
        behavior: 'report_all',
      },
    ],
    singletonBehaviors: [],
    developerOpinionIds: [
      'developer-opinion.treatment-triggered-history-and-prior-reactions.2026-07-27',
    ],
  });

const medicationTrialFixture = {
  schemaVersion: 1 as const,
  id: 'medication-trial.test.treatment-history.fluoxetine',
  medicationId: 'medication.fluoxetine',
  exposure: {
    duration: { value: 12, unit: 'week' as const },
    maximumDose: {
      amount: 20,
      unit: 'mg',
      frequency: 'daily',
    },
  },
  adequacy: 'adequate' as const,
  adherence: 'consistent' as const,
  response: 'partial' as const,
  tolerability: 'tolerated' as const,
  source: 'patient_report' as const,
  summary: 'Twelve weeks at a highest reported dose of 20 mg daily.',
};

const compilePriorMedicationTrialsUniversalResult = () =>
  compileStructuredActionUniversalResult({
    suffix: 'prior-medication-trials',
    assembly: priorMedicationTrialsAssembly,
    definition: priorMedicationTrialsDefinition,
    patientStateOverrides: {
      treatmentHistory: {
        medicationTrials: [medicationTrialFixture],
        psychotherapyTrials: [],
        currentProviders: [],
        priorLevelsOfCare: [],
      },
    },
    laneBehaviors: [
      {
        lane: 'medication_trials',
        behavior: 'report_all',
      },
    ],
    singletonBehaviors: [],
    developerOpinionIds: ['developer-opinion.treatment-history-result-boundaries.2026-07-24'],
  });

const compileFullTreatmentHistoryUniversalResult = () =>
  compileStructuredActionUniversalResult({
    suffix: 'full-treatment-history',
    assembly: fullTreatmentHistoryAssembly,
    definition: fullTreatmentHistoryDefinition,
    patientStateOverrides: {
      treatmentHistory: {
        medicationTrials: [medicationTrialFixture],
        psychotherapyTrials: [
          {
            schemaVersion: 1,
            id: 'psychotherapy-trial.test.treatment-history.cbt',
            interventionId: 'intervention.psychotherapy.cbt',
            status: 'completed',
            engagement: 'adequate',
            response: 'partial',
            source: 'patient_report',
            summary: 'Reports a prior course of cognitive behavioral therapy.',
          },
        ],
        currentProviders: [
          {
            schemaVersion: 1,
            id: 'treatment-provider.test.treatment-history.therapist',
            providerType: 'therapist',
            active: true,
            source: 'patient_report',
            summary: 'Currently sees a therapist.',
          },
        ],
        priorLevelsOfCare: [
          {
            schemaVersion: 1,
            id: 'prior-level-of-care.test.treatment-history.inpatient',
            level: 'inpatient_psychiatry',
            occurrenceCount: 1,
            source: 'patient_report',
            summary: 'Reports one prior psychiatric admission.',
          },
        ],
      },
    },
    laneBehaviors: [
      { lane: 'medication_trials', behavior: 'report_all' },
      { lane: 'psychotherapy_trials', behavior: 'report_all' },
      { lane: 'current_treatment_providers', behavior: 'report_all' },
      { lane: 'prior_levels_of_care', behavior: 'report_all' },
    ],
    singletonBehaviors: [],
    developerOpinionIds: ['developer-opinion.treatment-history-result-boundaries.2026-07-24'],
  });

const medicationEffectsRegimenEntry = {
  recordVersion: 2 as const,
  id: 'regimen-entry.test.medication-effects.sertraline',
  medicationIdentityId: 'medication.sertraline',
  clinicalRole: 'psychiatric' as const,
  status: 'active' as const,
  adherence: 'consistent' as const,
  prescribedForDiagnosisId: null,
  source: 'patient_report' as const,
  knownAtOpening: false,
  impactClassification: 'fit_relevant' as const,
};

const compileMedicationEffectsUniversalResult = () =>
  compileStructuredActionUniversalResult({
    suffix: 'medication-effects',
    assembly: medicationEffectsAssembly,
    definition: medicationEffectsDefinition,
    patientStateOverrides: {
      medicationRegimenEntries: [medicationEffectsRegimenEntry],
      medicationTolerabilityFindings: [
        {
          recordVersion: 2,
          id: 'tolerability-finding.test.medication-effects.sexual-function',
          subject: {
            kind: 'current_regimen_entry',
            regimenEntryId: medicationEffectsRegimenEntry.id,
          },
          domain: 'sexual_function',
          findingStatus: 'present',
          manifestationIds: ['manifestation.sexual-function.decreased-libido'],
          source: 'patient_report',
          sourceRateProfileId: null,
        },
      ],
      currentMedicationReportedBenefits: [
        {
          recordVersion: 1,
          id: 'current-medication-benefit.test.medication-effects.sertraline',
          subject: {
            modelVersion: 'finding-record-subject.v1',
            kind: 'current_regimen_entry',
            regimenEntryId: medicationEffectsRegimenEntry.id,
          },
          reportedBenefit: 'partial',
          source: {
            kind: 'patient_report',
            sourceInstanceId: 'source-instance.test.medication-effects.patient',
          },
          timeScopeId: 'time-scope.current',
        },
      ],
      currentMedicationDosePositions: [
        {
          recordVersion: 1,
          id: 'current-medication-dose-position.test.medication-effects.sertraline',
          subject: {
            modelVersion: 'finding-record-subject.v1',
            kind: 'current_regimen_entry',
            regimenEntryId: medicationEffectsRegimenEntry.id,
          },
          position: 'below_maximum',
          source: {
            kind: 'patient_report',
            sourceInstanceId: 'source-instance.test.medication-effects.patient',
          },
          timeScopeId: 'time-scope.current',
        },
      ],
      medicationChangeTemporalRelationships: [],
    },
    laneBehaviors: [
      { lane: 'medication_tolerability_findings', behavior: 'report_all' },
      { lane: 'current_medication_reported_benefits', behavior: 'report_all' },
      { lane: 'current_medication_dose_positions', behavior: 'report_all' },
      { lane: 'medication_change_temporal_relationships', behavior: 'report_all' },
    ],
    singletonBehaviors: [],
    developerOpinionIds: ['developer-opinion.medication-effects-result-boundary.2026-08-04'],
  });

const compileFoundationUniversalResult = () => {
  const sharedRequest = foundationSharedFindingRequest();
  const shared = compileSharedFindings(sharedRequest);
  if (!shared.ok) throw new Error(shared.error.message);

  const patientState = ResolvedPatientStateSchema.parse({
    schemaVersion: 1,
    id: sharedRequest.patientStateId,
    demographics: {
      recordVersion: 2,
      ageYears: 42,
      reviewedAgeBandId: 'age-band.middle-adult',
      sexForReference: 'female',
    },
    conditionStates: [
      {
        schemaVersion: 1,
        id: 'condition-state.test.action-result-content.mdd',
        diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
        diagnosisDefinitionContentVersion: '1.6.0',
        clinicalStateId: 'clinical-state.current-episode',
        timeScopeId: 'time-scope.current',
        encounterRelevance: 'focus',
        severityId: null,
        specifierIds: [],
        origin: 'authored',
        resolution: {
          origin: 'authored',
          ownerId: 'patient-template.test.action-result-content',
          ownerContentVersion: '1.0.0',
        },
      },
    ],
    diagnosisRecordEntries: [],
    medicationRegimenEntries: [],
    exposureInventory: {
      schemaVersion: 1,
      id: 'resolved-exposure-inventory.test.action-result-content',
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
    canonicalFindings: shared.value.findings,
    measurements: [],
    categoricalObservations: [],
    structuredTestResults: [],
    clinicalContexts: [],
    clinicalDurations: [
      {
        schemaVersion: 1,
        id: 'clinical-duration.test.action-result-content.mdd-current-episode',
        target: {
          kind: 'condition_state',
          conditionStateId: 'condition-state.test.action-result-content.mdd',
        },
        value: 8,
        unit: 'week',
        durationProfileId: 'duration-profile.mdd.current-episode',
        durationProfileContentVersion: '1.0.0',
        durationOptionId: 'duration-option.mdd.current-episode.eight-weeks',
        relatedDiagnosisId: 'diagnosis.major-depressive-disorder',
        interpretation: 'supports_authored_state',
        criterionId: null,
        source: {
          kind: 'patient_report',
          sourceInstanceId: 'source-instance.patient.test.action-result-content',
        },
        timeScopeId: 'time-scope.current',
        resolution: {
          origin: 'authored',
          ownerId: 'patient-template.test.action-result-content',
          ownerContentVersion: '1.0.0',
        },
      },
    ],
    subjectiveBurdenRecords: [],
    propositionState: sharedRequest.propositionState,
    clinicalTagIds: [],
    reportedSafetyPlanningAbility: 'unassessed',
  });
  const actionHorizon = {
    schemaVersion: 1 as const,
    id: 'decision-action-horizon.test.action-result-foundation',
    informationActionIds: [presentingProblemAction.id, foundationDepressiveSymptomsAction.id],
    startMedicationIds: [],
    regimenEntryOperations: [],
    interventionIds: [],
    dispositionIds: [],
  };
  const instrumentResponses = compileInstrumentItemResponses({
    schemaVersion: 1,
    id: 'instrument-response-request.test.action-result-foundation',
    sharedFindingCompilation: shared.value,
    findingProjectionHorizon: foundationHorizonDefinition.horizon,
    actionCatalog: foundationAssembly.actionCatalog,
    actionHorizon: deriveInstrumentInformationActionHorizon(actionHorizon),
    instrumentDefinitions: [],
  });
  if (!instrumentResponses.ok) throw new Error(instrumentResponses.error.message);
  const targetScopedValues = compileTargetScopedPatientValueProjections({
    schemaVersion: 1,
    id: 'target-scoped-request.test.action-result-foundation',
    patientState,
    informationActions: [presentingProblemAction],
    definitions: [durationDefinition],
  });
  if (!targetScopedValues.ok) throw new Error(targetScopedValues.error.message);

  const result = compileUniversalActionResults({
    schemaVersion: 1,
    id: 'universal-action-result-request.test.mdd-initial-assessment-foundation',
    patientState,
    actionCatalog: foundationAssembly.actionCatalog,
    actionHorizon,
    sharedFindingCompilation: shared.value,
    findingProjectionHorizon: foundationHorizonDefinition.horizon,
    instrumentItemResponseCompilation: instrumentResponses.value,
    targetScopedPatientValueProjectionArtifact: targetScopedValues.value,
    structuredRevealEnvelopes: [],
    measurementDefinitions: [],
    categoricalObservationDefinitions: [],
    testDefinitions: [],
    recipes: foundationAssembly.recipes,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const compileWeightBmiUniversalResult = () => {
  const patientStateId = 'resolved-patient-state.test.weight-bmi-action-result';
  const baseFindingRequest = sharedFindingRequest();
  const propositionState = {
    schemaVersion: 1 as const,
    id: 'resolved-proposition-state.test.weight-bmi-action-result',
    propositions: [],
    evidence: [],
    dependencyGroups: [],
    beliefAppraisals: [],
  };
  const emptyFindingRequest: SharedFindingCompileRequest = {
    ...baseFindingRequest,
    id: 'finding-compilation-request.test.weight-bmi-action-result',
    patientStateId,
    seed: 'seed.test.weight-bmi-action-result',
    findingDefinitions: [
      baseFindingRequest.findingDefinitions.find(
        (definition) => definition.id === baseFindingRequest.candidates[0]!.findingDefinitionId,
      )!,
    ],
    propositionState,
    projections: [],
    expressionBanks: [],
    projectionHorizon: {
      schemaVersion: 1,
      id: 'finding-projection-horizon.test.weight-bmi-action-result',
      targets: [],
    },
  };
  const shared = compileSharedFindings(emptyFindingRequest);
  if (!shared.ok) throw new Error(shared.error.message);
  const inputMeasurementIds = [
    'resolved-measurement.test.weight-bmi.height',
    'resolved-measurement.test.weight-bmi.weight',
  ];
  const patientState = ResolvedPatientStateSchema.parse({
    schemaVersion: 1,
    id: patientStateId,
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
      id: 'resolved-exposure-inventory.test.weight-bmi-action-result',
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
    canonicalFindings: shared.value.findings,
    measurements: [
      {
        schemaVersion: 1,
        id: inputMeasurementIds[0],
        definitionId: 'measurement.anthropometric.height',
        definitionContentVersion: '1.0.0',
        value: 170,
        displayValue: '170.0',
        unit: { display: 'cm', ucumCode: 'cm' },
        contextValues: [],
        timeScopeId: 'time-scope.current',
        source: {
          kind: 'measurement',
          sourceInstanceId: 'patient-scene-source.test.direct-measurement',
        },
        interpretation: { kind: 'not_interpreted' },
        resolution: {
          origin: 'authored',
          ownerId: 'patient-template.test.weight-bmi-action-result',
          ownerContentVersion: '1.0.0',
        },
      },
      {
        schemaVersion: 1,
        id: inputMeasurementIds[1],
        definitionId: 'measurement.anthropometric.weight',
        definitionContentVersion: '1.0.0',
        value: 82.4,
        displayValue: '82.4',
        unit: { display: 'kg', ucumCode: 'kg' },
        contextValues: [],
        timeScopeId: 'time-scope.current',
        source: {
          kind: 'measurement',
          sourceInstanceId: 'patient-scene-source.test.direct-measurement',
        },
        interpretation: { kind: 'not_interpreted' },
        resolution: {
          origin: 'authored',
          ownerId: 'patient-template.test.weight-bmi-action-result',
          ownerContentVersion: '1.0.0',
        },
      },
      {
        schemaVersion: 1,
        id: 'resolved-measurement.test.weight-bmi.bmi',
        definitionId: 'measurement.anthropometric.bmi',
        definitionContentVersion: '1.0.0',
        value: 82.4 / 1.7 ** 2,
        displayValue: '28.5',
        unit: { display: 'kg/m²', ucumCode: 'kg/m2' },
        contextValues: [],
        timeScopeId: 'time-scope.current',
        source: {
          kind: 'derived_measurement',
          derivationDefinitionId: 'measurement-derivation.bmi.metric-height-weight',
          derivationDefinitionContentVersion: '1.0.0',
          derivationArtifactId: 'body-mass-index-measurement-materialization.test.action-result',
          derivationPayloadFingerprint:
            'fingerprint.body-mass-index-measurement-materialization.test.fnv1a64.0000000000000000',
          inputMeasurementIds,
        },
        interpretation: { kind: 'not_interpreted' },
        resolution: {
          origin: 'deterministic_derivation',
          derivationDefinitionId: 'measurement-derivation.bmi.metric-height-weight',
          derivationDefinitionContentVersion: '1.0.0',
          resolverVersion: '1.0.0',
          inputMeasurementIds,
        },
      },
    ],
    categoricalObservations: [
      {
        schemaVersion: 1,
        id: 'resolved-observation.test.weight-bmi.body-habitus',
        definitionId: 'observation.physical.body-habitus',
        definitionContentVersion: '1.0.0',
        valueId: 'observation-value.body-habitus.increased-muscularity',
        displayValue: 'Increased muscularity',
        timeScopeId: 'time-scope.current',
        source: {
          kind: 'clinician_observation',
          sourceInstanceId: 'patient-scene-source.test.clinician-observation',
        },
        interpretationIds: [],
        resolution: {
          origin: 'authored',
          ownerId: 'patient-template.test.weight-bmi-action-result',
          ownerContentVersion: '1.0.0',
        },
      },
    ],
    structuredTestResults: [],
    clinicalContexts: [],
    clinicalDurations: [],
    subjectiveBurdenRecords: [],
    propositionState,
    clinicalTagIds: [],
    reportedSafetyPlanningAbility: 'unassessed',
  });
  const actionHorizon = {
    schemaVersion: 1 as const,
    id: 'decision-action-horizon.test.weight-bmi-action-result',
    informationActionIds: [weightBmiAction.id],
    startMedicationIds: [],
    regimenEntryOperations: [],
    interventionIds: [],
    dispositionIds: [],
  };
  const instrumentResponses = compileInstrumentItemResponses({
    schemaVersion: 1,
    id: 'instrument-response-request.test.weight-bmi-action-result',
    sharedFindingCompilation: shared.value,
    findingProjectionHorizon: emptyFindingRequest.projectionHorizon,
    actionCatalog: weightBmiAssembly.actionCatalog,
    actionHorizon: deriveInstrumentInformationActionHorizon(actionHorizon),
    instrumentDefinitions: [],
  });
  if (!instrumentResponses.ok) throw new Error(instrumentResponses.error.message);
  const result = compileUniversalActionResults({
    schemaVersion: 1,
    id: 'universal-action-result-request.test.weight-bmi',
    patientState,
    actionCatalog: weightBmiAssembly.actionCatalog,
    actionHorizon,
    sharedFindingCompilation: shared.value,
    findingProjectionHorizon: emptyFindingRequest.projectionHorizon,
    instrumentItemResponseCompilation: instrumentResponses.value,
    targetScopedPatientValueProjectionArtifact: null,
    structuredRevealEnvelopes: [],
    measurementDefinitions: weightBmiAssembly.measurementDefinitions,
    categoricalObservationDefinitions: weightBmiAssembly.categoricalObservationDefinitions,
    testDefinitions: [],
    recipes: weightBmiAssembly.recipes,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('checked-in universal action-result content', () => {
  it('pins the exact projection set and current information-action payload', () => {
    expect(horizonCatalog.id).toBe('registry.catalog.finding-projection-horizons');
    expect(horizonDefinition.projectionRefs).toHaveLength(49);
    expect(new Set(horizonDefinition.projectionRefs.map((reference) => reference.id))).toEqual(
      new Set(
        projectionCatalog.projections
          .filter(
            (projection) =>
              projection.target.kind === 'information_action' &&
              projection.target.actionId === action.id,
          )
          .map((projection) => projection.id),
      ),
    );
    expect(horizonDefinition.horizon.targets).toEqual([
      {
        target: {
          kind: 'information_action',
          actionId: 'info.history.depressive-symptoms',
        },
        allowedResponses: [
          { kind: 'finding_outcome', outcome: 'present' },
          { kind: 'finding_outcome', outcome: 'absent' },
        ],
        expressionDisplayChannel: null,
      },
    ]);

    const currentAction = catalogs.informationActions.find(
      (candidate) => candidate.id === action.id,
    )!;
    expect(fingerprintInformationActionPayload(action)).toBe(
      fingerprintInformationActionPayload(currentAction),
    );
    expect(assembly.recipes).toEqual([
      expect.objectContaining({
        informationActionId: action.id,
        informationActionPayloadFingerprint: fingerprintInformationActionPayload(currentAction),
        sourceKinds: ['finding_projections'],
      }),
    ]);
  });

  it('pins the detailed safety horizon and universal action payload without a risk inference', () => {
    expect(safetyHorizonDefinition.projectionRefs).toHaveLength(18);
    expect(
      new Set(safetyHorizonDefinition.projectionRefs.map((reference) => reference.id)),
    ).toEqual(new Set(safetyProjections.map((projection) => projection.id)));
    expect(safetyFindingDefinitions).toHaveLength(9);
    expect(safetyHorizonDefinition.horizon.targets).toEqual([
      {
        target: {
          kind: 'information_action',
          actionId: safetyAction.id,
        },
        allowedResponses: [
          { kind: 'finding_outcome', outcome: 'present' },
          { kind: 'finding_outcome', outcome: 'absent' },
        ],
        expressionDisplayChannel: null,
      },
    ]);

    const currentAction = catalogs.informationActions.find(
      (candidate) => candidate.id === safetyAction.id,
    )!;
    expect(fingerprintInformationActionPayload(safetyAction)).toBe(
      fingerprintInformationActionPayload(currentAction),
    );
    expect(safetyAssembly.recipes).toEqual([
      expect.objectContaining({
        informationActionId: safetyAction.id,
        informationActionPayloadFingerprint: fingerprintInformationActionPayload(currentAction),
        sourceKinds: ['finding_projections'],
      }),
    ]);
    expect(JSON.stringify(safetyAssembly)).not.toMatch(
      /low risk|high risk|outpatient appropriate|emergency transfer|disposition|score|point/i,
    );
  });

  it('pins safety-planning ability to its typed Subjective singleton only', () => {
    const currentAction = catalogs.informationActions.find(
      (candidate) => candidate.id === safetyPlanningAction.id,
    )!;
    expect(fingerprintInformationActionPayload(safetyPlanningAction)).toBe(
      fingerprintInformationActionPayload(currentAction),
    );
    expect(safetyPlanningDefinition).toMatchObject({
      informationActionId: safetyPlanningAction.id,
      informationActionPayloadFingerprint: fingerprintInformationActionPayload(currentAction),
      allowedSourceKinds: ['patient_report'],
      lanes: [],
      singletonFields: ['reported_safety_planning_ability'],
    });
    expect(safetyPlanningAssembly.recipes).toEqual([
      expect.objectContaining({
        informationActionId: safetyPlanningAction.id,
        informationActionPayloadFingerprint: fingerprintInformationActionPayload(currentAction),
        sourceKinds: ['structured_state_reveals'],
      }),
    ]);
    expect(JSON.stringify(safetyPlanningAssembly)).not.toMatch(
      /outpatient appropriate|risk score|low risk|high risk|written plan exists|disposition|point/i,
    );
  });

  it('pins medication reconciliation to exact current regimen entries only', () => {
    const currentAction = catalogs.informationActions.find(
      (candidate) => candidate.id === medicationReconciliationAction.id,
    )!;
    expect(fingerprintInformationActionPayload(medicationReconciliationAction)).toBe(
      fingerprintInformationActionPayload(currentAction),
    );
    expect(medicationReconciliationDefinition).toMatchObject({
      informationActionId: medicationReconciliationAction.id,
      informationActionPayloadFingerprint: fingerprintInformationActionPayload(currentAction),
      allowedSourceKinds: ['patient_report'],
      lanes: ['medication_regimen_entries'],
      singletonFields: [],
    });
    expect(medicationReconciliationAssembly.recipes).toEqual([
      expect.objectContaining({
        informationActionId: medicationReconciliationAction.id,
        informationActionPayloadFingerprint: fingerprintInformationActionPayload(currentAction),
        sourceKinds: ['structured_state_reveals'],
      }),
    ]);
    expect(JSON.stringify(medicationReconciliationDefinition)).not.toMatch(
      /prior trial|adequate trial|benefit|tolerability|diagnosis|treatment recommendation|score|point/i,
    );
  });

  it('pins allergy and adverse-reaction history to exact records and explicit assessment states', () => {
    const currentAction = catalogs.informationActions.find(
      (candidate) => candidate.id === reactionHistoryAction.id,
    )!;
    expect(fingerprintInformationActionPayload(reactionHistoryAction)).toBe(
      fingerprintInformationActionPayload(currentAction),
    );
    expect(reactionHistoryDefinition).toMatchObject({
      informationActionId: reactionHistoryAction.id,
      informationActionPayloadFingerprint: fingerprintInformationActionPayload(currentAction),
      allowedSourceKinds: ['patient_report'],
      lanes: ['reaction_records'],
      singletonFields: ['reaction_history_status', 'medication_reaction_assessment_status'],
    });
    expect(reactionHistoryAssembly.recipes).toEqual([
      expect.objectContaining({
        informationActionId: reactionHistoryAction.id,
        informationActionPayloadFingerprint: fingerprintInformationActionPayload(currentAction),
        sourceKinds: ['structured_state_reveals'],
      }),
    ]);
    expect(JSON.stringify(reactionHistoryDefinition)).not.toMatch(
      /immune allergy|contraindication|risk score|treatment recommendation|score|point/i,
    );
  });

  it('pins substance-use history to exact patient-reported exposure records only', () => {
    const currentAction = catalogs.informationActions.find(
      (candidate) => candidate.id === substanceUseAction.id,
    )!;
    expect(fingerprintInformationActionPayload(substanceUseAction)).toBe(
      fingerprintInformationActionPayload(currentAction),
    );
    expect(substanceUseDefinition).toMatchObject({
      informationActionId: substanceUseAction.id,
      informationActionPayloadFingerprint: fingerprintInformationActionPayload(currentAction),
      allowedSourceKinds: ['patient_report'],
      lanes: ['exposure_use_entries'],
      singletonFields: [],
    });
    expect(substanceUseAssembly.recipes).toEqual([
      expect.objectContaining({
        informationActionId: substanceUseAction.id,
        informationActionPayloadFingerprint: fingerprintInformationActionPayload(currentAction),
        sourceKinds: ['structured_state_reveals'],
      }),
    ]);
    expect(JSON.stringify(substanceUseDefinition)).not.toMatch(
      /intoxication|withdrawal|substance use disorder|diagnosis|treatment recommendation|score|point/i,
    );
  });

  it('keeps focused prior medication trials separate from full treatment history', () => {
    const currentPriorAction = catalogs.informationActions.find(
      (candidate) => candidate.id === priorMedicationTrialsAction.id,
    )!;
    const currentFullAction = catalogs.informationActions.find(
      (candidate) => candidate.id === fullTreatmentHistoryAction.id,
    )!;
    expect(fingerprintInformationActionPayload(priorMedicationTrialsAction)).toBe(
      fingerprintInformationActionPayload(currentPriorAction),
    );
    expect(fingerprintInformationActionPayload(fullTreatmentHistoryAction)).toBe(
      fingerprintInformationActionPayload(currentFullAction),
    );
    expect(priorMedicationTrialsDefinition).toMatchObject({
      informationActionId: priorMedicationTrialsAction.id,
      informationActionPayloadFingerprint: fingerprintInformationActionPayload(currentPriorAction),
      allowedSourceKinds: ['patient_report'],
      lanes: ['medication_trials'],
      singletonFields: [],
    });
    expect(fullTreatmentHistoryDefinition).toMatchObject({
      informationActionId: fullTreatmentHistoryAction.id,
      informationActionPayloadFingerprint: fingerprintInformationActionPayload(currentFullAction),
      allowedSourceKinds: ['patient_report'],
      lanes: [
        'medication_trials',
        'psychotherapy_trials',
        'current_treatment_providers',
        'prior_levels_of_care',
      ],
      singletonFields: [],
    });
    expect(priorMedicationTrialsAssembly.recipes[0]).toMatchObject({
      sourceKinds: ['structured_state_reveals'],
    });
    expect(fullTreatmentHistoryAssembly.recipes[0]).toMatchObject({
      sourceKinds: ['structured_state_reveals'],
    });
    expect(JSON.stringify(priorMedicationTrialsDefinition)).not.toMatch(
      /psychotherapy|provider|level of care|adequate trial|score|point/i,
    );
  });

  it('pins medication effects to four separate exact-regimen record lanes', () => {
    const currentAction = catalogs.informationActions.find(
      (candidate) => candidate.id === medicationEffectsAction.id,
    )!;
    expect(fingerprintInformationActionPayload(medicationEffectsAction)).toBe(
      fingerprintInformationActionPayload(currentAction),
    );
    expect(medicationEffectsDefinition).toMatchObject({
      informationActionId: medicationEffectsAction.id,
      informationActionPayloadFingerprint: fingerprintInformationActionPayload(currentAction),
      allowedSourceKinds: ['patient_report'],
      lanes: [
        'medication_tolerability_findings',
        'current_medication_reported_benefits',
        'current_medication_dose_positions',
        'medication_change_temporal_relationships',
      ],
      singletonFields: [],
    });
    expect(medicationEffectsAssembly.recipes[0]).toMatchObject({
      sourceKinds: ['structured_state_reveals'],
    });
    expect(JSON.stringify(medicationEffectsDefinition)).not.toMatch(
      /caused by|diagnosis|treatment recommendation|score|point/i,
    );
  });

  it('rejects duplicate static owner IDs', () => {
    const duplicateHorizon = structuredClone(findingProjectionHorizonsJson);
    duplicateHorizon.horizons.push(structuredClone(duplicateHorizon.horizons[0]!));
    expect(FindingProjectionHorizonCatalogSchema.safeParse(duplicateHorizon).success).toBe(false);

    const duplicateAssembly = structuredClone(universalActionResultAssembliesJson);
    duplicateAssembly.assemblies.push(structuredClone(duplicateAssembly.assemblies[0]!));
    expect(UniversalActionResultAssemblyCatalogSchema.safeParse(duplicateAssembly).success).toBe(
      false,
    );
  });

  it('routes all 17 compiled findings through one complete universal result binding', () => {
    const artifact = compileUniversalResult();
    expect(artifact.status).toBe('complete');
    expect(artifact.evaluations).toEqual([
      expect.objectContaining({
        informationActionId: action.id,
        status: 'complete',
        diagnosticIds: [],
      }),
    ]);
    expect(artifact.bindingCandidates).toHaveLength(1);
    expect(artifact.bindingCandidates[0]!.sources).toHaveLength(17);
    expect(
      artifact.bindingCandidates[0]!.sources.every(
        (source) => source.kind === 'finding_projection',
      ),
    ).toBe(true);
    expect(verifyUniversalActionResultArtifactIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('routes all nine detailed safety facts without attaching safety-planning ability', () => {
    const artifact = compileSafetyUniversalResult();
    expect(artifact.status).toBe('complete');
    expect(artifact.evaluations).toEqual([
      expect.objectContaining({
        informationActionId: safetyAction.id,
        status: 'complete',
        diagnosticIds: [],
      }),
    ]);
    expect(artifact.bindingCandidates).toHaveLength(1);
    expect(artifact.bindingCandidates[0]!.sources).toHaveLength(9);
    expect(
      artifact.bindingCandidates[0]!.sources.every(
        (source) => source.kind === 'finding_projection',
      ),
    ).toBe(true);
    expect(JSON.stringify(artifact.bindingCandidates[0])).not.toMatch(
      /reportedSafetyPlanningAbility|reports_unable|outpatient|disposition/i,
    );
    expect(verifyUniversalActionResultArtifactIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('routes the exact reported safety-planning value without a disposition conclusion', () => {
    const { artifact, resolvedReveal } = compileSafetyPlanningUniversalResult();
    expect(artifact.status).toBe('complete');
    expect(artifact.bindingCandidates).toEqual([
      expect.objectContaining({
        informationActionId: safetyPlanningAction.id,
        sources: [
          expect.objectContaining({
            kind: 'structured_state_reveal',
            definitionId: safetyPlanningDefinition.id,
            resolvedProjectionId: resolvedReveal.id,
          }),
        ],
      }),
    ]);
    expect(resolvedReveal.singletonStatements).toEqual([
      {
        field: 'reported_safety_planning_ability',
        truthValue: 'reports_unable',
        presentedValue: 'reports_unable',
        relationshipToTruth: 'aligned',
      },
    ]);
    expect(JSON.stringify(artifact.bindingCandidates[0])).not.toMatch(
      /outpatient|disposition|risk score|written plan/i,
    );
    expect(verifyUniversalActionResultArtifactIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('routes the exact current regimen records without interpreting them', () => {
    const { artifact, resolvedReveal } = compileMedicationReconciliationUniversalResult();
    expect(artifact.status).toBe('complete');
    expect(artifact.bindingCandidates).toEqual([
      expect.objectContaining({
        informationActionId: medicationReconciliationAction.id,
        sources: [
          expect.objectContaining({
            kind: 'structured_state_reveal',
            definitionId: medicationReconciliationDefinition.id,
            resolvedProjectionId: resolvedReveal.id,
          }),
        ],
      }),
    ]);
    expect(resolvedReveal.laneStatements).toEqual([
      {
        lane: 'medication_regimen_entries',
        presentationStatus: 'items_present',
        includedTruthRecordIds: ['regimen-entry.test.medication-reconciliation.sertraline'],
        omittedTruthRecordIds: [],
        relationshipToTruth: 'aligned',
      },
    ]);
    expect(resolvedReveal.singletonStatements).toEqual([]);
    expect(JSON.stringify(artifact.bindingCandidates[0])).not.toMatch(
      /adequate|benefit|tolerability|diagnosis|recommendation|score|point/i,
    );
    expect(verifyUniversalActionResultArtifactIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('routes exact reaction records and statuses without adding an interpretation', () => {
    const { artifact, resolvedReveal } = compileReactionHistoryUniversalResult();
    expect(artifact.status).toBe('complete');
    expect(artifact.bindingCandidates).toEqual([
      expect.objectContaining({
        informationActionId: reactionHistoryAction.id,
        sources: [
          expect.objectContaining({
            kind: 'structured_state_reveal',
            definitionId: reactionHistoryDefinition.id,
            resolvedProjectionId: resolvedReveal.id,
          }),
        ],
      }),
    ]);
    expect(resolvedReveal.laneStatements).toEqual([
      {
        lane: 'reaction_records',
        presentationStatus: 'items_present',
        includedTruthRecordIds: ['reaction-record.test.allergies-adverse-reactions.haloperidol'],
        omittedTruthRecordIds: [],
        relationshipToTruth: 'aligned',
      },
    ]);
    expect(resolvedReveal.singletonStatements).toEqual([
      {
        field: 'medication_reaction_assessment_status',
        truthValue: 'entries_present',
        presentedValue: 'entries_present',
        relationshipToTruth: 'aligned',
      },
      {
        field: 'reaction_history_status',
        truthValue: 'entries_present',
        presentedValue: 'entries_present',
        relationshipToTruth: 'aligned',
      },
    ]);
    expect(JSON.stringify(artifact.bindingCandidates[0])).not.toMatch(
      /immune allergy|contraindication|recommendation|score|point/i,
    );
    expect(verifyUniversalActionResultArtifactIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('routes exact positive-use records without inferring a substance diagnosis', () => {
    const { artifact, resolvedReveal } = compileSubstanceUseUniversalResult();
    expect(artifact.status).toBe('complete');
    expect(artifact.bindingCandidates).toEqual([
      expect.objectContaining({
        informationActionId: substanceUseAction.id,
        sources: [
          expect.objectContaining({
            kind: 'structured_state_reveal',
            definitionId: substanceUseDefinition.id,
            resolvedProjectionId: resolvedReveal.id,
          }),
        ],
      }),
    ]);
    expect(resolvedReveal.laneStatements).toEqual([
      {
        lane: 'exposure_use_entries',
        presentationStatus: 'items_present',
        includedTruthRecordIds: ['exposure-use.test.substance-use.cannabis'],
        omittedTruthRecordIds: [],
        relationshipToTruth: 'aligned',
      },
    ]);
    expect(resolvedReveal.singletonStatements).toEqual([]);
    expect(JSON.stringify(artifact.bindingCandidates[0])).not.toMatch(
      /intoxication|withdrawal|diagnosis|recommendation|score|point/i,
    );
    expect(verifyUniversalActionResultArtifactIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('routes focused medication trials without mixing in other treatment-history lanes', () => {
    const { artifact, resolvedReveal } = compilePriorMedicationTrialsUniversalResult();
    expect(artifact.status).toBe('complete');
    expect(artifact.bindingCandidates).toEqual([
      expect.objectContaining({
        informationActionId: priorMedicationTrialsAction.id,
        sources: [
          expect.objectContaining({
            kind: 'structured_state_reveal',
            definitionId: priorMedicationTrialsDefinition.id,
            resolvedProjectionId: resolvedReveal.id,
          }),
        ],
      }),
    ]);
    expect(resolvedReveal.laneStatements).toEqual([
      {
        lane: 'medication_trials',
        presentationStatus: 'items_present',
        includedTruthRecordIds: ['medication-trial.test.treatment-history.fluoxetine'],
        omittedTruthRecordIds: [],
        relationshipToTruth: 'aligned',
      },
    ]);
    expect(resolvedReveal.singletonStatements).toEqual([]);
    expect(verifyUniversalActionResultArtifactIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('routes all four full treatment-history lanes without merging their record identities', () => {
    const { artifact, resolvedReveal } = compileFullTreatmentHistoryUniversalResult();
    expect(artifact.status).toBe('complete');
    expect(artifact.bindingCandidates).toEqual([
      expect.objectContaining({
        informationActionId: fullTreatmentHistoryAction.id,
        sources: [
          expect.objectContaining({
            kind: 'structured_state_reveal',
            definitionId: fullTreatmentHistoryDefinition.id,
            resolvedProjectionId: resolvedReveal.id,
          }),
        ],
      }),
    ]);
    expect(resolvedReveal.laneStatements).toHaveLength(4);
    expect(resolvedReveal.laneStatements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lane: 'medication_trials',
          includedTruthRecordIds: ['medication-trial.test.treatment-history.fluoxetine'],
        }),
        expect.objectContaining({
          lane: 'psychotherapy_trials',
          includedTruthRecordIds: ['psychotherapy-trial.test.treatment-history.cbt'],
        }),
        expect.objectContaining({
          lane: 'current_treatment_providers',
          includedTruthRecordIds: ['treatment-provider.test.treatment-history.therapist'],
        }),
        expect.objectContaining({
          lane: 'prior_levels_of_care',
          includedTruthRecordIds: ['prior-level-of-care.test.treatment-history.inpatient'],
        }),
      ]),
    );
    expect(resolvedReveal.singletonStatements).toEqual([]);
    expect(verifyUniversalActionResultArtifactIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('routes medication effects as separate records without inventing causality', () => {
    const { artifact, resolvedReveal } = compileMedicationEffectsUniversalResult();
    expect(artifact.status).toBe('complete');
    expect(artifact.bindingCandidates).toEqual([
      expect.objectContaining({
        informationActionId: medicationEffectsAction.id,
        sources: [
          expect.objectContaining({
            kind: 'structured_state_reveal',
            definitionId: medicationEffectsDefinition.id,
            resolvedProjectionId: resolvedReveal.id,
          }),
        ],
      }),
    ]);
    expect(resolvedReveal.laneStatements).toHaveLength(4);
    expect(resolvedReveal.laneStatements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lane: 'medication_tolerability_findings',
          includedTruthRecordIds: ['tolerability-finding.test.medication-effects.sexual-function'],
        }),
        expect.objectContaining({
          lane: 'current_medication_reported_benefits',
          includedTruthRecordIds: ['current-medication-benefit.test.medication-effects.sertraline'],
        }),
        expect.objectContaining({
          lane: 'current_medication_dose_positions',
          includedTruthRecordIds: [
            'current-medication-dose-position.test.medication-effects.sertraline',
          ],
        }),
        expect.objectContaining({
          lane: 'medication_change_temporal_relationships',
          presentationStatus: 'none_reported',
          includedTruthRecordIds: [],
          omittedTruthRecordIds: [],
          relationshipToTruth: 'aligned',
        }),
      ]),
    );
    expect(resolvedReveal.singletonStatements).toEqual([]);
    expect(verifyUniversalActionResultArtifactIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('pins the current-MDD duration profile to the presenting-problem action', () => {
    expect(durationProfileCatalog.profiles).toEqual([
      expect.objectContaining({
        id: 'duration-profile.mdd.current-episode',
        contentVersion: '1.0.0',
        relatedDiagnosisId: 'diagnosis.major-depressive-disorder',
        interpretation: 'supports_authored_state',
        criterionId: null,
      }),
    ]);
    expect(durationDefinition).toMatchObject({
      informationActionId: presentingProblemAction.id,
      informationActionPayloadFingerprint:
        fingerprintInformationActionPayload(presentingProblemAction),
      valueKind: 'clinical_duration',
      durationProfileId: durationProfileCatalog.profiles[0]!.id,
      durationProfileContentVersion: durationProfileCatalog.profiles[0]!.contentVersion,
      targetSelector: {
        kind: 'condition_definition',
        diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
        diagnosisDefinitionContentVersion: '1.6.0',
      },
      sourceKind: 'patient_report',
      timeScopeId: 'time-scope.current',
    });
    expect(foundationHorizonDefinition.projectionRefs).toHaveLength(51);
    expect(foundationFindingDefinitions).toHaveLength(18);
    expect(
      new Set(foundationHorizonDefinition.projectionRefs.map((reference) => reference.id)),
    ).toEqual(
      new Set(
        projectionCatalog.projections
          .filter(
            (projection) =>
              projection.target.kind === 'information_action' &&
              [presentingProblemAction.id, foundationDepressiveSymptomsAction.id].includes(
                projection.target.actionId,
              ),
          )
          .map((projection) => projection.id),
      ),
    );
    expect(foundationHorizonDefinition.horizon.targets).toEqual([
      {
        target: {
          kind: 'information_action',
          actionId: foundationDepressiveSymptomsAction.id,
        },
        allowedResponses: [
          { kind: 'finding_outcome', outcome: 'present' },
          { kind: 'finding_outcome', outcome: 'absent' },
        ],
        expressionDisplayChannel: null,
      },
      {
        target: {
          kind: 'information_action',
          actionId: presentingProblemAction.id,
        },
        allowedResponses: [
          { kind: 'finding_outcome', outcome: 'present' },
          { kind: 'finding_outcome', outcome: 'absent' },
        ],
        expressionDisplayChannel: null,
      },
    ]);
    const functionalImpactProjections = foundationProjections.filter(
      (projection) =>
        projection.target.kind === 'information_action' &&
        projection.target.actionId === presentingProblemAction.id,
    );
    expect(functionalImpactProjections).toHaveLength(2);
    expect(
      functionalImpactProjections.flatMap((projection) =>
        projection.sourceBindings.map((binding) =>
          binding.kind === 'canonical_finding' ? binding.findingDefinitionId : null,
        ),
      ),
    ).toEqual([
      'finding.function.self-reported-current-impact',
      'finding.function.self-reported-current-impact',
    ]);
    expect(foundationAssembly.recipes).toEqual([
      expect.objectContaining({
        informationActionId: presentingProblemAction.id,
        sourceKinds: ['finding_projections', 'target_scoped_patient_value_reveals'],
      }),
      expect.objectContaining({
        informationActionId: foundationDepressiveSymptomsAction.id,
        sourceKinds: ['finding_projections'],
      }),
    ]);
  });

  it('routes duration, broad functional impact, and compact symptoms through one complete foundation', () => {
    const artifact = compileFoundationUniversalResult();
    expect(artifact.status).toBe('complete');
    expect(artifact.evaluations).toEqual([
      expect.objectContaining({
        informationActionId: foundationDepressiveSymptomsAction.id,
        status: 'complete',
      }),
      expect.objectContaining({
        informationActionId: presentingProblemAction.id,
        status: 'complete',
      }),
    ]);
    const bindingByActionId = new Map(
      artifact.bindingCandidates.map((binding) => [binding.informationActionId, binding]),
    );
    expect(bindingByActionId.get(foundationDepressiveSymptomsAction.id)?.sources).toHaveLength(17);
    expect(bindingByActionId.get(presentingProblemAction.id)?.sources).toHaveLength(2);
    expect(bindingByActionId.get(presentingProblemAction.id)?.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'finding_projection',
          projectionId: 'finding-projection.history.presenting-problem.functional-impact.present',
        }),
        expect.objectContaining({
          kind: 'target_scoped_patient_value_reveal',
          definitionId:
            'target-scoped-definition.history.presenting-problem.mdd-current-episode-duration',
        }),
      ]),
    );
    expect(verifyUniversalActionResultArtifactIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('routes separate uninterpreted body habitus, height, weight, and BMI through one action', () => {
    const currentAction = catalogs.informationActions.find(
      (candidate) => candidate.id === weightBmiAction.id,
    )!;
    expect(fingerprintInformationActionPayload(weightBmiAction)).toBe(
      fingerprintInformationActionPayload(currentAction),
    );
    expect(weightBmiAssembly.measurementDefinitions).toEqual(weightBmiMeasurementDefinitions);
    expect(weightBmiAssembly.categoricalObservationDefinitions).toEqual(
      bodyHabitusObservationDefinitions,
    );
    expect(weightBmiAssembly.recipes).toEqual([
      expect.objectContaining({
        informationActionId: weightBmiAction.id,
        sourceKinds: ['categorical_observations', 'measurements'],
      }),
    ]);

    const artifact = compileWeightBmiUniversalResult();
    expect(artifact.status).toBe('complete');
    expect(artifact.bindingCandidates).toHaveLength(1);
    expect(artifact.bindingCandidates[0]).toEqual(
      expect.objectContaining({
        informationActionId: weightBmiAction.id,
        sources: expect.arrayContaining([
          expect.objectContaining({
            kind: 'categorical_observation',
            definitionId: 'observation.physical.body-habitus',
          }),
          expect.objectContaining({
            kind: 'measurement',
            definitionId: 'measurement.anthropometric.bmi',
          }),
          expect.objectContaining({
            kind: 'measurement',
            definitionId: 'measurement.anthropometric.height',
          }),
          expect.objectContaining({
            kind: 'measurement',
            definitionId: 'measurement.anthropometric.weight',
          }),
        ]),
      }),
    );
    expect(artifact.bindingCandidates[0]!.sources).toHaveLength(4);
    expect(
      artifact.compileRequest.patientState.measurements.every(
        (measurement) => measurement.interpretation.kind === 'not_interpreted',
      ),
    ).toBe(true);
    expect(artifact.compileRequest.patientState.categoricalObservations).toEqual([
      expect.objectContaining({
        definitionId: 'observation.physical.body-habitus',
        interpretationIds: [],
      }),
    ]);
    expect(verifyUniversalActionResultArtifactIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });
});
