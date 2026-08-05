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

const opinionId = 'developer-opinion.psychosis-history-result-boundary.2026-07-28';
const actionId = 'info.history.psychosis';
const horizonId = 'finding-projection-horizon.history.psychotic-symptoms';
const assemblyId = 'universal-action-result-assembly.history.psychotic-symptoms';

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
  reviewedAt: '2026-07-28T19:12:59.000Z',
  sourceUseNoteIds: [],
};

const candidate = (
  suffix: string,
  findingDefinitionId: string,
  value: 'present' | 'subthreshold',
): FindingResolutionCandidate => {
  const definition = findingById.get(findingDefinitionId);
  if (!definition) throw new Error(`Missing psychosis-history finding ${findingDefinitionId}.`);
  return {
    schemaVersion: 1,
    id: `finding-candidate.test.psychosis-history.${suffix}`,
    findingDefinitionId,
    findingDefinitionContentVersion: definition.contentVersion,
    kind: 'case_critical',
    proposedValue: { kind: 'outcome', value },
    uncertainty: 'none',
    contributions: [
      {
        schemaVersion: 1,
        id: `finding-contribution.test.psychosis-history.${suffix}`,
        ownerKind: 'patient_template',
        ownerId: 'patient-template.test.psychosis-history',
        ownerContentVersion: '1.0.0',
        role: 'constraint',
        provenanceIds: ['provenance.test.psychosis-history'],
      },
    ],
    resolution: {
      origin: 'authored',
      ownerId: 'patient-template.test.psychosis-history',
      ownerContentVersion: '1.0.0',
    },
    review: approvedReview,
  };
};

const compileResult = () => {
  const patientStateId = 'resolved-patient-state.test.psychosis-history';
  const findingRequest: SharedFindingCompileRequest = {
    schemaVersion: 1,
    id: 'finding-compilation-request.test.psychosis-history',
    patientStateId,
    seed: 'seed.test.psychosis-history',
    findingDefinitions,
    candidates: [
      candidate('hallucinations', 'finding.history.reported-hallucinations', 'present'),
      candidate(
        'suspiciousness',
        'finding.history.current-self-reported-suspiciousness',
        'subthreshold',
      ),
    ],
    propositionState: {
      schemaVersion: 1,
      id: 'resolved-proposition-state.test.psychosis-history',
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
      id: 'resolved-exposure-inventory.test.psychosis-history',
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
    id: 'decision-action-horizon.test.psychosis-history',
    informationActionIds: [actionId],
    startMedicationIds: [],
    regimenEntryOperations: [],
    interventionIds: [],
    dispositionIds: [],
  };
  const instrumentResponses = compileInstrumentItemResponses({
    schemaVersion: 1,
    id: 'instrument-response-request.test.psychosis-history',
    sharedFindingCompilation: shared.value,
    findingProjectionHorizon: horizonDefinition.horizon,
    actionCatalog: assembly.actionCatalog,
    actionHorizon: deriveInstrumentInformationActionHorizon(actionHorizon),
    instrumentDefinitions: [],
  });
  if (!instrumentResponses.ok) throw new Error(instrumentResponses.error.message);

  const result = compileUniversalActionResults({
    schemaVersion: 1,
    id: 'universal-action-result-request.test.psychosis-history',
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

describe('checked-in psychosis-history result', () => {
  it('pins one current patient-report action to six separate findings', () => {
    expect(action.id).toBe(actionId);
    expect(horizonDefinition.projectionRefs).toHaveLength(12);
    expect(projections).toHaveLength(12);
    expect(findingDefinitions).toHaveLength(6);
    expect([...findingIds]).toEqual(
      expect.arrayContaining([
        'finding.history.reported-hallucinations',
        'finding.history.reported-delusional-beliefs',
        'finding.history.current-self-reported-suspiciousness',
        'finding.history.current-self-reported-ideas-of-reference',
        'finding.history.current-self-reported-persecutory-ideation',
        'finding.history.current-self-reported-thought-disorganization',
      ]),
    );
    expect([...findingIds]).not.toEqual(
      expect.arrayContaining([
        'finding.mse.current-observed-thought-disorganization',
        'finding.mse.current-observed-grandiosity',
      ]),
    );
    expect(
      findingDefinitions.find(
        (finding) => finding.id === 'finding.history.reported-hallucinations',
      ),
    ).toEqual(expect.objectContaining({ label: 'Current self-reported hallucinations' }));
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
          'fingerprint.information-action.info.history.psychosis.fnv1a64.b83bdc1cc9d91aac',
        sourceKinds: ['finding_projections'],
      }),
    ]);
  });

  it('preserves hidden subthreshold state and derives explicit closed negatives', () => {
    const { artifact, shared } = compileResult();
    expect(shared.findings).toHaveLength(6);
    expect(
      shared.findings.find(
        (finding) =>
          finding.definitionId === 'finding.history.current-self-reported-suspiciousness',
      )?.value,
    ).toEqual({ kind: 'outcome', value: 'subthreshold' });
    expect(
      shared.projections.find(
        (projection) =>
          projection.projectionId ===
          'finding-projection.history.psychotic-symptoms.suspiciousness.present',
      )?.response,
    ).toEqual({ kind: 'finding_outcome', outcome: 'present' });
    expect(
      shared.findings.find(
        (finding) =>
          finding.definitionId === 'finding.history.current-self-reported-ideas-of-reference',
      )?.value,
    ).toEqual({ kind: 'outcome', value: 'absent' });
    expect(artifact.status).toBe('complete');
    expect(artifact.bindingCandidates).toHaveLength(1);
    expect(artifact.bindingCandidates[0]!.sources).toHaveLength(6);
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

  it('keeps paranoia, truth, appraisal, diagnosis, and scoring outside the result', () => {
    const canonicalAliases = findingDefinitions.flatMap((finding) => finding.aliases);
    expect(canonicalAliases).not.toContain('Paranoia');
    expect(JSON.stringify({ horizonDefinition, assembly, projections })).not.toMatch(
      /proposition truth|belief appraisal|psychosis diagnosis|bipolar diagnosis|treatment recommendation|point value|score/i,
    );
  });
});
