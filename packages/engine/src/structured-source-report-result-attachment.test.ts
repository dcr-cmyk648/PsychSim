import { describe, expect, it } from 'vitest';

import {
  ResolvedPatientStateSchema,
  StructuredPatientStateRevealDefinitionSchema,
  StructuredSourceReportProfileSchema,
  StructuredSourceReportResultAttachmentArtifactSchema,
  UniversalActionResultCompileRequestSchema,
  type ClinicalRuleReview,
  type FindingDefinition,
  type InformationActionDefinition,
  type SharedFindingCompileRequest,
} from '@psychsim/schemas';

import {
  compileInstrumentItemResponses,
  deriveInstrumentInformationActionHorizon,
} from './instrument-item-response-compiler';
import { compilePatientSceneSourceInstances } from './patient-scene-source-instance-compiler';
import { compileSharedFindings } from './shared-finding-compiler';
import {
  compileStructuredSourceReports,
  fingerprintStructuredSourceReportDefinition,
} from './structured-source-report-compiler';
import { projectValidatedStructuredSourceReportRecords } from './structured-source-report-record-projection';
import {
  attachValidatedStructuredSourceReportResults,
  verifyStructuredSourceReportResultAttachmentIntegrity,
} from './structured-source-report-result-attachment';
import { validateStructuredSourceReportSources } from './structured-source-report-source-validation';
import { translateUniversalActionResultArtifact } from './universal-action-result-attachment';
import {
  compileUniversalActionResults,
  fingerprintInformationActionPayload,
} from './universal-action-result-compiler';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-08-04T12:00:00.000Z',
  sourceUseNoteIds: [],
};

const authoredResolution = {
  origin: 'authored',
  ownerId: 'patient-template.test.source-report-result-attachment',
  ownerContentVersion: '1.0.0',
} as const;

const makeAction = (coordinate: string): InformationActionDefinition => ({
  id: `info.history.test-prior-trials-${coordinate}`,
  label: 'Prior medication trials',
  searchAliases: ['past medication'],
  category: 'history',
  soapSection: 'subjective',
  resultSource: 'patient_report',
  description: 'Review prior medication trials.',
  serviceId: `service.history.test-prior-trials-${coordinate}`,
  repeatable: false,
});

const compileFindingFoundation = (coordinate: string, patientStateId: string) => {
  const definition: FindingDefinition = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `finding.history.test-foundation-${coordinate}`,
    label: 'Synthetic finding foundation',
    aliases: [],
    semanticKind: 'history',
    valueSpecification: {
      kind: 'outcome',
      allowedValues: ['present', 'absent'],
    },
    allowedPresentationProjections: ['status'],
    lifecycle: 'approved',
    medicalReviewStatus: 'unreviewed',
  };
  const request: SharedFindingCompileRequest = {
    schemaVersion: 1,
    id: `finding-compilation-request.test.source-report-result-attachment-${coordinate}`,
    patientStateId,
    seed: `seed.test.source-report-result-attachment-${coordinate}`,
    findingDefinitions: [definition],
    candidates: [
      {
        schemaVersion: 1,
        id: `finding-candidate.test.foundation-${coordinate}`,
        findingDefinitionId: definition.id,
        findingDefinitionContentVersion: definition.contentVersion,
        kind: 'case_critical',
        proposedValue: { kind: 'outcome', value: 'present' },
        uncertainty: 'none',
        contributions: [
          {
            schemaVersion: 1,
            id: `finding-contribution.test.foundation-${coordinate}`,
            ownerKind: 'patient_template',
            ownerId: `patient-template.test.source-report-result-attachment-${coordinate}`,
            ownerContentVersion: '1.0.0',
            role: 'constraint',
            provenanceIds: [`provenance.test.foundation-${coordinate}`],
          },
        ],
        resolution: authoredResolution,
        review: approvedReview,
      },
    ],
    propositionState: {
      schemaVersion: 1,
      id: `resolved-proposition-state.test.source-report-result-attachment-${coordinate}`,
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    propositionDefinitions: [],
    projections: [],
    expressionBanks: [],
    projectionHorizon: {
      schemaVersion: 1,
      id: `finding-projection-horizon.test.source-report-result-attachment-${coordinate}`,
      targets: [],
    },
  };
  const result = compileSharedFindings(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return { request, artifact: result.value };
};

const makePatientState = (
  coordinate: string,
  sharedFindingCompilation: ReturnType<typeof compileFindingFoundation>['artifact'],
) =>
  ResolvedPatientStateSchema.parse({
    schemaVersion: 1,
    id: `resolved-patient-state.test.source-report-result-attachment-${coordinate}`,
    demographics: {
      recordVersion: 2,
      ageYears: 48,
      reviewedAgeBandId: 'age-band.middle-adult',
      sexForReference: 'female',
    },
    conditionStates: [],
    diagnosisRecordEntries: [],
    medicationRegimenEntries: [],
    exposureInventory: {
      schemaVersion: 1,
      id: `resolved-exposure-inventory.test.source-report-result-attachment-${coordinate}`,
      useEntries: [],
    },
    treatmentHistory: {
      medicationTrials: [
        {
          schemaVersion: 1,
          id: `medication-trial.test.fluoxetine-${coordinate}`,
          medicationId: 'medication.fluoxetine',
          exposure: {
            duration: { value: 12, unit: 'week' },
            maximumDose: {
              amount: 40,
              unit: 'mg',
              frequency: 'daily',
            },
          },
          adequacy: 'adequate',
          adherence: 'consistent',
          response: 'partial',
          tolerability: 'tolerated',
          source: 'patient_report',
          summary: 'Synthetic authoring-only trial summary.',
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
      status: 'unassessed',
      medicationAssessmentStatus: 'unassessed',
      records: [],
    },
    canonicalFindings: sharedFindingCompilation.findings,
    measurements: [],
    categoricalObservations: [],
    structuredTestResults: [],
    clinicalContexts: [],
    clinicalDurations: [],
    functionalImpairments: [],
    subjectiveBurdenRecords: [],
    propositionState: {
      schemaVersion: 1,
      id: `resolved-proposition-state.test.source-report-result-attachment-${coordinate}`,
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    clinicalTagIds: [],
    reportedSafetyPlanningAbility: 'unassessed',
  });

const makePipeline = (
  coordinate: string,
  behavior: 'report_all' | 'none_reported' = 'report_all',
) => {
  const patientStateId = `resolved-patient-state.test.source-report-result-attachment-${coordinate}`;
  const findingFoundation = compileFindingFoundation(coordinate, patientStateId);
  const patientState = makePatientState(coordinate, findingFoundation.artifact);
  const action = makeAction(coordinate);
  const actionFingerprint = fingerprintInformationActionPayload(action);
  const actionCatalog = {
    schemaVersion: 1 as const,
    contentVersion: '1.0.0',
    id: `information-action-catalog.test.source-report-result-attachment-${coordinate}`,
    actions: [action],
  };
  const actionHorizon = {
    schemaVersion: 1 as const,
    id: `decision-action-horizon.test.source-report-result-attachment-${coordinate}`,
    informationActionIds: [action.id],
    startMedicationIds: [],
    regimenEntryOperations: [],
    interventionIds: [],
    dispositionIds: [],
  };
  const sourceHorizonResult = compilePatientSceneSourceInstances({
    schemaVersion: 1,
    id: `patient-scene-source-instance-request.test.result-attachment-${coordinate}`,
    patientStateId: patientState.id,
    definitions: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: `patient-scene-source-definition.test.patient-report-${coordinate}`,
        kind: 'patient_report',
      },
    ],
  });
  expect(sourceHorizonResult.ok).toBe(true);
  if (!sourceHorizonResult.ok) throw new Error(sourceHorizonResult.error.message);
  const sourceHorizon = sourceHorizonResult.value;
  const sourceInstance = sourceHorizon.sourceInstances[0]!;
  const definition = StructuredPatientStateRevealDefinitionSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `structured-reveal-definition.test.prior-trials-${coordinate}`,
    modelVersion: 'structured-patient-state-reveal.v1',
    label: 'Prior medication trials',
    informationActionId: action.id,
    informationActionPayloadFingerprint: actionFingerprint,
    allowedSourceKinds: ['patient_report'],
    lanes: ['medication_trials'],
    singletonFields: [],
    lifecycle: 'approved',
    review: approvedReview,
  });
  const profile = StructuredSourceReportProfileSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `source-report-profile.test.prior-trials-${coordinate}`,
    modelVersion: 'structured-source-report-profile.v1',
    label: 'Prior medication trials',
    definitionRef: {
      id: definition.id,
      contentVersion: definition.contentVersion,
    },
    definitionFingerprint: fingerprintStructuredSourceReportDefinition(definition),
    source: {
      kind: 'patient_report',
      sourceInstanceId: sourceInstance.id,
    },
    timeScopeId: 'time-scope.longitudinal',
    claimOriginId: `claim-origin.test.prior-trials-${coordinate}`,
    dependencyGroupIds: [],
    laneBehaviors: [{ lane: 'medication_trials', behavior }],
    singletonBehaviors: [],
    developerOpinionIds: [`developer-opinion.test.prior-trials-${coordinate}`],
    lifecycle: 'approved',
    review: approvedReview,
  });
  const reportResult = compileStructuredSourceReports({
    schemaVersion: 1,
    id: `structured-source-report-request.test.result-attachment-${coordinate}`,
    patientState,
    definitions: [definition],
    profiles: [profile],
  });
  expect(reportResult.ok).toBe(true);
  if (!reportResult.ok) throw new Error(reportResult.error.message);
  const sourceValidationResult = validateStructuredSourceReportSources({
    schemaVersion: 1,
    id: `structured-source-report-source-validation-request.test.result-attachment-${coordinate}`,
    structuredSourceReport: reportResult.value,
    sourceInstanceCompilation: sourceHorizon,
  });
  expect(sourceValidationResult.ok).toBe(true);
  if (!sourceValidationResult.ok) throw new Error(sourceValidationResult.error.message);
  const recordProjectionResult = projectValidatedStructuredSourceReportRecords({
    schemaVersion: 1,
    id: `structured-source-report-record-projection-request.test.result-attachment-${coordinate}`,
    sourceValidation: sourceValidationResult.value,
  });
  expect(recordProjectionResult.ok).toBe(true);
  if (!recordProjectionResult.ok) throw new Error(recordProjectionResult.error.message);

  const instrumentCompilation = compileInstrumentItemResponses({
    schemaVersion: 1,
    id: `instrument-response-request.test.result-attachment-${coordinate}`,
    sharedFindingCompilation: findingFoundation.artifact,
    findingProjectionHorizon: findingFoundation.request.projectionHorizon,
    actionCatalog,
    actionHorizon: deriveInstrumentInformationActionHorizon(actionHorizon),
    instrumentDefinitions: [],
  });
  expect(instrumentCompilation.ok).toBe(true);
  if (!instrumentCompilation.ok) throw new Error(instrumentCompilation.error.message);
  const universalRequest = UniversalActionResultCompileRequestSchema.parse({
    schemaVersion: 1,
    id: `universal-action-result-request.test.result-attachment-${coordinate}`,
    patientState,
    actionCatalog,
    actionHorizon,
    sharedFindingCompilation: findingFoundation.artifact,
    findingProjectionHorizon: findingFoundation.request.projectionHorizon,
    instrumentItemResponseCompilation: instrumentCompilation.value,
    targetScopedPatientValueProjectionArtifact: null,
    structuredRevealEnvelopes: sourceValidationResult.value.projectionRecipes.map((recipe) => ({
      definition: recipe.definition,
      patientState,
      resolved: recipe.resolved,
    })),
    measurementDefinitions: [],
    categoricalObservationDefinitions: [],
    testDefinitions: [],
    recipes: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: `universal-action-result-recipe.test.prior-trials-${coordinate}`,
        modelVersion: 'universal-action-result.v1',
        informationActionId: action.id,
        informationActionPayloadFingerprint: actionFingerprint,
        sourceKinds: ['structured_state_reveals'],
        lifecycle: 'review',
        medicalReviewStatus: 'unreviewed',
      },
    ],
  });
  const universalResult = compileUniversalActionResults(universalRequest);
  if (!universalResult.ok) throw new Error(universalResult.error.message);
  expect(universalResult.ok).toBe(true);

  return {
    action,
    recordProjection: recordProjectionResult.value,
    universalResults: universalResult.value,
  };
};

const expectAttachment = (
  coordinate: string,
  behavior: 'report_all' | 'none_reported' = 'report_all',
) => {
  const pipeline = makePipeline(coordinate, behavior);
  const result = attachValidatedStructuredSourceReportResults({
    schemaVersion: 1,
    id: `structured-source-report-result-attachment-request.test.${coordinate}`,
    sourceValidatedRecordProjection: pipeline.recordProjection,
    universalActionResults: pipeline.universalResults,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return { pipeline, artifact: result.value };
};

describe('D-351 source-validated structured-report result attachment', () => {
  it('joins the exact D-350 safe fields to the matching D-214 result translation', () => {
    const { pipeline, artifact } = expectAttachment('complete');

    expect(StructuredSourceReportResultAttachmentArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.structuredStateReveals).toHaveLength(1);
    expect(artifact.structuredStateRecordProjections).toEqual(
      pipeline.recordProjection.projections,
    );
    expect(artifact.resultBindingRequests).toEqual([
      {
        schemaVersion: 1,
        id: expect.any(String),
        informationActionId: pipeline.action.id,
        sources: [
          {
            kind: 'structured_state_reveal',
            resolvedProjectionId: artifact.structuredStateReveals[0]!.id,
            definitionId: artifact.structuredStateReveals[0]!.definitionId,
            definitionContentVersion: artifact.structuredStateReveals[0]!.definitionContentVersion,
          },
        ],
      },
    ]);
    expect(verifyStructuredSourceReportResultAttachmentIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('preserves duration and highest reported dose without exposing trial adequacy or summaries', () => {
    const { artifact } = expectAttachment('safe-fields');
    const serialized = JSON.stringify(artifact.structuredStateRecordProjections);

    expect(serialized).toContain('"duration":{"value":12,"unit":"week"}');
    expect(serialized).toContain('"highestReportedDose"');
    expect(serialized).not.toContain('"adequacy"');
    expect(serialized).not.toContain('"summary"');
  });

  it('keeps a source-reported none result empty through both reveal layers', () => {
    const { artifact } = expectAttachment('none-reported', 'none_reported');

    expect(artifact.structuredStateReveals[0]?.laneStatements).toEqual([
      {
        lane: 'medication_trials',
        presentationStatus: 'none_reported',
        presentedRecordIds: [],
      },
    ]);
    expect(artifact.structuredStateRecordProjections[0]?.laneStatements).toEqual([
      {
        lane: 'medication_trials',
        presentationStatus: 'none_reported',
        records: [],
      },
    ]);
  });

  it('rejects crossed patients and a caller-supplied D-214 translation', () => {
    const first = makePipeline('crossed-a');
    const second = makePipeline('crossed-b');

    expect(
      attachValidatedStructuredSourceReportResults({
        schemaVersion: 1,
        id: 'structured-source-report-result-attachment-request.test.crossed',
        sourceValidatedRecordProjection: first.recordProjection,
        universalActionResults: second.universalResults,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const translated = translateUniversalActionResultArtifact(first.universalResults);
    expect(translated.ok).toBe(true);
    expect(
      attachValidatedStructuredSourceReportResults({
        schemaVersion: 1,
        id: 'structured-source-report-result-attachment-request.test.raw-d214',
        sourceValidatedRecordProjection: first.recordProjection,
        universalActionResults: translated.ok ? translated.value : null,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('detects record-field and result-binding tampering', () => {
    const { artifact } = expectAttachment('tampering');
    const changedRecord = structuredClone(artifact);
    const record = changedRecord.structuredStateRecordProjections[0]?.laneStatements[0]?.records[0];
    if (record === undefined || record.lane !== 'medication_trials') {
      throw new Error('Missing projected medication trial.');
    }
    record.response = 'remission';
    expect(verifyStructuredSourceReportResultAttachmentIntegrity(changedRecord).ok).toBe(false);

    const changedBinding = structuredClone(artifact);
    changedBinding.resultBindingRequests[0]!.informationActionId =
      'info.history.test-unrelated-action';
    expect(verifyStructuredSourceReportResultAttachmentIntegrity(changedBinding).ok).toBe(false);
  });
});
