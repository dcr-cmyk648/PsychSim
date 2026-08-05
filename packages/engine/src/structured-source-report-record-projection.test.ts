import { describe, expect, it } from 'vitest';

import {
  ResolvedPatientStateSchema,
  StructuredPatientStateRevealDefinitionSchema,
  StructuredSourceReportProfileSchema,
  StructuredSourceReportRecordProjectionArtifactSchema,
  type ClinicalRuleReview,
} from '@psychsim/schemas';

import { compilePatientSceneSourceInstances } from './patient-scene-source-instance-compiler';
import {
  compileStructuredSourceReports,
  fingerprintStructuredSourceReportDefinition,
} from './structured-source-report-compiler';
import {
  projectValidatedStructuredSourceReportRecords,
  verifyStructuredSourceReportRecordProjectionIntegrity,
} from './structured-source-report-record-projection';
import { validateStructuredSourceReportSources } from './structured-source-report-source-validation';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-08-04T12:00:00.000Z',
  sourceUseNoteIds: [],
};

const makePatientState = () =>
  ResolvedPatientStateSchema.parse({
    schemaVersion: 1,
    id: 'resolved-patient-state.test.source-validated-record-projection',
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
      id: 'resolved-exposure-inventory.test.source-validated-record-projection',
      useEntries: [],
    },
    treatmentHistory: {
      medicationTrials: [
        {
          schemaVersion: 1,
          id: 'medication-trial.test.fluoxetine',
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
          summary: 'Twelve weeks with partial benefit.',
        },
      ],
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
      id: 'resolved-proposition-state.test.source-validated-record-projection',
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    clinicalTagIds: [],
    reportedSafetyPlanningAbility: 'unassessed',
  });

const makeFixture = (behavior: 'report_all' | 'none_reported' = 'report_all') => {
  const patientState = makePatientState();
  const sourceHorizonResult = compilePatientSceneSourceInstances({
    schemaVersion: 1,
    id: 'patient-scene-source-instance-request.test.source-validated-record-projection',
    patientStateId: patientState.id,
    definitions: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'patient-scene-source-definition.test.patient-report',
        kind: 'patient_report',
      },
    ],
  });
  expect(sourceHorizonResult.ok).toBe(true);
  if (!sourceHorizonResult.ok) throw new Error(sourceHorizonResult.error.message);
  const sourceHorizon = sourceHorizonResult.value;
  const patientReportSource = sourceHorizon.sourceInstances[0]!;

  const definition = StructuredPatientStateRevealDefinitionSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'structured-reveal-definition.test.prior-trials',
    modelVersion: 'structured-patient-state-reveal.v1',
    label: 'Prior medication trials',
    informationActionId: 'info.history.prior-trials',
    informationActionPayloadFingerprint:
      'fingerprint.information-action.prior-trials.fnv1a64.0123456789abcdef',
    allowedSourceKinds: ['patient_report'],
    lanes: ['medication_trials'],
    singletonFields: [],
    lifecycle: 'approved',
    review: approvedReview,
  });
  const profile = StructuredSourceReportProfileSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `source-report-profile.test.prior-trials.${behavior}`,
    modelVersion: 'structured-source-report-profile.v1',
    label: 'Prior medication trials',
    definitionRef: {
      id: definition.id,
      contentVersion: definition.contentVersion,
    },
    definitionFingerprint: fingerprintStructuredSourceReportDefinition(definition),
    source: {
      kind: 'patient_report',
      sourceInstanceId: patientReportSource.id,
    },
    timeScopeId: 'time-scope.longitudinal',
    claimOriginId: 'claim-origin.test.prior-trials',
    dependencyGroupIds: [],
    laneBehaviors: [{ lane: 'medication_trials', behavior }],
    singletonBehaviors: [],
    developerOpinionIds: ['developer-opinion.test.prior-trials'],
    lifecycle: 'approved',
    review: approvedReview,
  });
  const reportResult = compileStructuredSourceReports({
    schemaVersion: 1,
    id: `structured-source-report-request.test.record-projection.${behavior}`,
    patientState,
    definitions: [definition],
    profiles: [profile],
  });
  expect(reportResult.ok).toBe(true);
  if (!reportResult.ok) throw new Error(reportResult.error.message);
  const sourceValidationResult = validateStructuredSourceReportSources({
    schemaVersion: 1,
    id: `structured-source-report-source-validation-request.test.record-projection.${behavior}`,
    structuredSourceReport: reportResult.value,
    sourceInstanceCompilation: sourceHorizon,
  });
  expect(sourceValidationResult.ok).toBe(true);
  if (!sourceValidationResult.ok) throw new Error(sourceValidationResult.error.message);
  return sourceValidationResult.value;
};

const expectProjection = (behavior: 'report_all' | 'none_reported' = 'report_all') => {
  const sourceValidation = makeFixture(behavior);
  const result = projectValidatedStructuredSourceReportRecords({
    schemaVersion: 1,
    id: `structured-source-report-record-projection-request.test.${behavior}`,
    sourceValidation,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('D-350 source-validated structured-report record projection', () => {
  it('derives one exact D-349 safe projection from every D-299 recipe', () => {
    const artifact = expectProjection();

    expect(StructuredSourceReportRecordProjectionArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.projections).toHaveLength(1);
    expect(artifact.projections[0]).toMatchObject({
      patientStateId: 'resolved-patient-state.test.source-validated-record-projection',
      definitionId: 'structured-reveal-definition.test.prior-trials',
      informationActionId: 'info.history.prior-trials',
      source: { kind: 'patient_report' },
      laneStatements: [
        {
          lane: 'medication_trials',
          presentationStatus: 'items_present',
          records: [
            {
              lane: 'medication_trials',
              recordId: 'medication-trial.test.fluoxetine',
              duration: { value: 12, unit: 'week' },
              highestReportedDose: {
                amount: 40,
                unit: 'mg',
                frequency: 'daily',
              },
            },
          ],
        },
      ],
    });
    expect(verifyStructuredSourceReportRecordProjectionIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('retains the exact source-validation authority and no hidden record fields', () => {
    const artifact = expectProjection();
    const serialized = JSON.stringify(artifact.projections);

    expect(artifact.sourceValidationRef).toEqual({
      id: artifact.compileRequest.sourceValidation.id,
      payloadFingerprint: artifact.compileRequest.sourceValidation.payloadFingerprint,
    });
    expect(serialized).not.toContain('"adequacy"');
    expect(serialized).not.toContain('"summary"');
    expect(serialized).not.toContain('"relationshipToTruth"');
    expect(serialized).not.toContain('"omittedTruthRecordIds"');
  });

  it('preserves a source-reported negative without copying the omitted positive trial', () => {
    const artifact = expectProjection('none_reported');

    expect(artifact.projections[0]?.laneStatements).toEqual([
      {
        lane: 'medication_trials',
        presentationStatus: 'none_reported',
        records: [],
      },
    ]);
    expect(JSON.stringify(artifact.projections)).not.toContain('medication-trial.test.fluoxetine');
  });

  it('rejects a raw D-215 report in place of the required source-validated D-299 artifact', () => {
    const sourceValidation = makeFixture();

    expect(
      projectValidatedStructuredSourceReportRecords({
        schemaVersion: 1,
        id: 'structured-source-report-record-projection-request.test.raw-report',
        sourceValidation: sourceValidation.compileRequest.structuredSourceReport,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('detects safe-view and retained source-validation tampering', () => {
    const artifact = expectProjection();
    const changedProjection = structuredClone(artifact);
    const trial = changedProjection.projections[0]?.laneStatements[0]?.records.find(
      (record) => record.lane === 'medication_trials',
    );
    if (trial === undefined || trial.lane !== 'medication_trials') {
      throw new Error('Missing medication-trial projection.');
    }
    trial.response = 'remission';
    expect(verifyStructuredSourceReportRecordProjectionIntegrity(changedProjection).ok).toBe(false);

    const changedValidation = structuredClone(artifact);
    changedValidation.compileRequest.sourceValidation.patientStateId =
      'resolved-patient-state.test.other';
    expect(verifyStructuredSourceReportRecordProjectionIntegrity(changedValidation).ok).toBe(false);
  });
});
