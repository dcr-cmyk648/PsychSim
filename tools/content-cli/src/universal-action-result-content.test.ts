import {
  ClinicalDurationProfileCatalogSchema,
  FindingProjectionCatalogSchema,
  FindingProjectionHorizonCatalogSchema,
  ResolvedPatientStateSchema,
  UniversalActionResultAssemblyCatalogSchema,
  type ClinicalRuleReview,
  type FindingResolutionCandidate,
  type SharedFindingCompileRequest,
} from '@psychsim/schemas';
import { catalogs } from '@psychsim/content-runtime';
import {
  compileInstrumentItemResponses,
  compileSharedFindings,
  compileTargetScopedPatientValueProjections,
  compileUniversalActionResults,
  deriveInstrumentInformationActionHorizon,
  fingerprintInformationActionPayload,
  verifyUniversalActionResultArtifactIntegrity,
} from '@psychsim/engine/authoring';
import { describe, expect, it } from 'vitest';

import findingProjectionHorizonsJson from '../../../content/catalogs/findings/projection-horizons.json';
import findingProjectionsJson from '../../../content/catalogs/findings/projections.json';
import universalActionResultAssembliesJson from '../../../content/catalogs/actions/universal-action-result-assemblies.json';
import clinicalDurationProfilesJson from '../../../content/catalogs/durations/profiles.json';

const projectionCatalog = FindingProjectionCatalogSchema.parse(findingProjectionsJson);
const horizonCatalog = FindingProjectionHorizonCatalogSchema.parse(findingProjectionHorizonsJson);
const assemblyCatalog = UniversalActionResultAssemblyCatalogSchema.parse(
  universalActionResultAssembliesJson,
);
const durationProfileCatalog = ClinicalDurationProfileCatalogSchema.parse(
  clinicalDurationProfilesJson,
);
const horizonDefinition = horizonCatalog.horizons[0]!;
const assembly = assemblyCatalog.assemblies[0]!;
const action = assembly.actionCatalog.actions[0]!;
const foundationAssembly = assemblyCatalog.assemblies.find(
  (candidate) =>
    candidate.id === 'universal-action-result-assembly.mdd-initial-assessment-foundation',
)!;
const presentingProblemAction = foundationAssembly.actionCatalog.actions.find(
  (candidate) => candidate.id === 'info.history.presenting-problem',
)!;
const foundationDepressiveSymptomsAction = foundationAssembly.actionCatalog.actions.find(
  (candidate) => candidate.id === 'info.history.depressive-symptoms',
)!;
const durationDefinition = foundationAssembly.targetScopedPatientValueProjectionDefinitions[0]!;

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

const compileFoundationUniversalResult = () => {
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
    conditionStates: [
      {
        schemaVersion: 1,
        id: 'condition-state.test.action-result-content.mdd',
        diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
        diagnosisDefinitionContentVersion: '1.4.0',
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
    findingProjectionHorizon: horizonDefinition.horizon,
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
    findingProjectionHorizon: horizonDefinition.horizon,
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

describe('checked-in universal action-result content', () => {
  it('pins the exact projection set and current information-action payload', () => {
    expect(horizonCatalog.id).toBe('registry.catalog.finding-projection-horizons');
    expect(horizonDefinition.projectionRefs).toHaveLength(49);
    expect(new Set(horizonDefinition.projectionRefs.map((reference) => reference.id))).toEqual(
      new Set(projectionCatalog.projections.map((projection) => projection.id)),
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
        diagnosisDefinitionContentVersion: '1.4.0',
      },
      sourceKind: 'patient_report',
      timeScopeId: 'time-scope.current',
    });
    expect(foundationAssembly.recipes).toEqual([
      expect.objectContaining({
        informationActionId: presentingProblemAction.id,
        sourceKinds: ['target_scoped_patient_value_reveals'],
      }),
      expect.objectContaining({
        informationActionId: foundationDepressiveSymptomsAction.id,
        sourceKinds: ['finding_projections'],
      }),
    ]);
  });

  it('routes current-episode duration and compact symptoms through one complete foundation', () => {
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
    expect(bindingByActionId.get(presentingProblemAction.id)?.sources).toEqual([
      expect.objectContaining({
        kind: 'target_scoped_patient_value_reveal',
        definitionId:
          'target-scoped-definition.history.presenting-problem.mdd-current-episode-duration',
      }),
    ]);
    expect(verifyUniversalActionResultArtifactIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });
});
