import {
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
  compileUniversalActionResults,
  deriveInstrumentInformationActionHorizon,
  fingerprintInformationActionPayload,
  verifyUniversalActionResultArtifactIntegrity,
} from '@psychsim/engine/authoring';
import { describe, expect, it } from 'vitest';

import universalActionResultAssembliesJson from '../../../content/catalogs/actions/universal-action-result-assemblies.json';
import findingProjectionHorizonsJson from '../../../content/catalogs/findings/projection-horizons.json';
import findingProjectionsJson from '../../../content/catalogs/findings/projections.json';

const opinionId = 'developer-opinion.mania-history-source-time-result-boundary.2026-07-28';
const actionId = 'info.history.mania';
const horizonId = 'finding-projection-horizon.history.mania-hypomania';
const assemblyId = 'universal-action-result-assembly.history.mania-hypomania';

const projectionCatalog = FindingProjectionCatalogSchema.parse(findingProjectionsJson);
const horizonCatalog = FindingProjectionHorizonCatalogSchema.parse(findingProjectionHorizonsJson);
const assemblyCatalog = UniversalActionResultAssemblyCatalogSchema.parse(
  universalActionResultAssembliesJson,
);
const horizonDefinition = horizonCatalog.horizons.find((horizon) => horizon.id === horizonId)!;
const assembly = assemblyCatalog.assemblies.find((candidate) => candidate.id === assemblyId)!;
const action = assembly.actionCatalog.actions[0]!;
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
const findingById = new Map(findingDefinitions.map((finding) => [finding.id, finding]));

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.dustin-rowland',
  reviewedAt: '2026-07-28T18:39:12.000Z',
  sourceUseNoteIds: [],
};

const candidate = (
  suffix: string,
  findingDefinitionId: string,
  value: 'present' | 'subthreshold',
): FindingResolutionCandidate => {
  const definition = findingById.get(findingDefinitionId);
  if (!definition) throw new Error(`Missing mania-history finding ${findingDefinitionId}.`);
  return {
    schemaVersion: 1,
    id: `finding-candidate.test.mania-history.${suffix}`,
    findingDefinitionId,
    findingDefinitionContentVersion: definition.contentVersion,
    kind: 'case_critical',
    proposedValue: { kind: 'outcome', value },
    uncertainty: 'none',
    contributions: [
      {
        schemaVersion: 1,
        id: `finding-contribution.test.mania-history.${suffix}`,
        ownerKind: 'patient_template',
        ownerId: 'patient-template.test.mania-history',
        ownerContentVersion: '1.0.0',
        role: 'constraint',
        provenanceIds: ['provenance.test.mania-history'],
      },
    ],
    resolution: {
      origin: 'authored',
      ownerId: 'patient-template.test.mania-history',
      ownerContentVersion: '1.0.0',
    },
    review: approvedReview,
  };
};

const compileResult = () => {
  const patientStateId = 'resolved-patient-state.test.mania-history';
  const findingRequest: SharedFindingCompileRequest = {
    schemaVersion: 1,
    id: 'finding-compilation-request.test.mania-history',
    patientStateId,
    seed: 'seed.test.mania-history',
    findingDefinitions,
    candidates: [
      candidate(
        'current-decreased-sleep-need',
        'finding.history.current-decreased-sleep-need',
        'subthreshold',
      ),
      candidate(
        'past-episodic-grandiosity',
        'finding.history.past-episodic-grandiosity',
        'present',
      ),
    ],
    propositionState: {
      schemaVersion: 1,
      id: 'resolved-proposition-state.test.mania-history',
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
  const shared = compileSharedFindings(findingRequest);
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
      id: 'resolved-exposure-inventory.test.mania-history',
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
    propositionState: findingRequest.propositionState,
    clinicalTagIds: [],
    reportedSafetyPlanningAbility: 'unassessed',
  });
  const actionHorizon = {
    schemaVersion: 1 as const,
    id: 'decision-action-horizon.test.mania-history',
    informationActionIds: [actionId],
    startMedicationIds: [],
    regimenEntryOperations: [],
    interventionIds: [],
    dispositionIds: [],
  };
  const instrumentResponses = compileInstrumentItemResponses({
    schemaVersion: 1,
    id: 'instrument-response-request.test.mania-history',
    sharedFindingCompilation: shared.value,
    findingProjectionHorizon: horizonDefinition.horizon,
    actionCatalog: assembly.actionCatalog,
    actionHorizon: deriveInstrumentInformationActionHorizon(actionHorizon),
    instrumentDefinitions: [],
  });
  if (!instrumentResponses.ok) throw new Error(instrumentResponses.error.message);

  const result = compileUniversalActionResults({
    schemaVersion: 1,
    id: 'universal-action-result-request.test.mania-history',
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
  return { artifact: result.value, shared: shared.value };
};

describe('checked-in mania/hypomania history result', () => {
  it('pins one current action to sixteen separate current and past findings', () => {
    expect(action.id).toBe(actionId);
    expect(horizonDefinition.projectionRefs).toHaveLength(32);
    expect(projections).toHaveLength(32);
    expect(findingDefinitions).toHaveLength(16);
    expect([...findingIds].filter((id) => id.includes('.current-'))).toHaveLength(8);
    expect([...findingIds].filter((id) => id.includes('.past-episodic-'))).toHaveLength(8);
    expect([...findingIds]).not.toContain('finding.mse.current-observed-grandiosity');
    expect(
      projections.every((projection) => projection.developerOpinionIds?.includes(opinionId)),
    ).toBe(true);

    const canonicalAction = catalogs.informationActions.find(
      (candidateAction) => candidateAction.id === actionId,
    )!;
    expect(fingerprintInformationActionPayload(action)).toBe(
      fingerprintInformationActionPayload(canonicalAction),
    );
    expect(assembly.recipes).toEqual([
      expect.objectContaining({
        informationActionId: actionId,
        informationActionPayloadFingerprint:
          'fingerprint.information-action.info.history.mania.fnv1a64.f97ddcf5d184c02d',
        sourceKinds: ['finding_projections'],
      }),
    ]);
  });

  it('keeps hidden subthreshold state while deriving explicit negative rows for missing findings', () => {
    const { artifact, shared } = compileResult();
    expect(shared.findings).toHaveLength(16);
    expect(
      shared.findings.find(
        (finding) => finding.definitionId === 'finding.history.current-decreased-sleep-need',
      )?.value,
    ).toEqual({ kind: 'outcome', value: 'subthreshold' });
    expect(
      shared.projections.find(
        (projection) =>
          projection.projectionId ===
          'finding-projection.history.mania-hypomania.current-decreased-sleep-need.present',
      )?.response,
    ).toEqual({ kind: 'finding_outcome', outcome: 'present' });
    expect(
      shared.findings.find(
        (finding) => finding.definitionId === 'finding.history.past-episodic-decreased-sleep-need',
      )?.value,
    ).toEqual({ kind: 'outcome', value: 'absent' });
    expect(artifact.status).toBe('complete');
    expect(artifact.bindingCandidates).toHaveLength(1);
    expect(artifact.bindingCandidates[0]!.sources).toHaveLength(16);
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

  it('contains no episode, diagnosis, treatment, or point conclusion', () => {
    expect(JSON.stringify({ horizonDefinition, assembly, projections })).not.toMatch(
      /bipolar diagnosis|manic episode|hypomanic episode|treatment recommendation|point value|score/i,
    );
  });
});
