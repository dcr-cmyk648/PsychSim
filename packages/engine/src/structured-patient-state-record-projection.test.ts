import { describe, expect, it } from 'vitest';

import {
  FrozenStructuredPatientStateRecordProjectionSchema,
  ResolvedPatientStateSchema,
  StructuredPatientStateRevealDefinitionSchema,
  StructuredPatientStateRevealProjectionEnvelopeSchema,
  getStructuredPatientStateRevealLaneRecordIds,
  type ResolvedPatientState,
  type StructuredPatientStateRevealLane,
  type StructuredPatientStateRevealProjectionEnvelope,
} from '@psychsim/schemas';

import {
  projectStructuredPatientStateRecords,
  verifyStructuredPatientStateRecordProjection,
} from './structured-patient-state-record-projection';

const authoredResolution = {
  origin: 'authored',
  ownerId: 'patient-template.test.record-projection',
  ownerContentVersion: '1.0.0',
} as const;

const lanes: StructuredPatientStateRevealLane[] = [
  'diagnosis_record_entries',
  'medication_regimen_entries',
  'exposure_use_entries',
  'medication_trials',
  'psychotherapy_trials',
  'current_treatment_providers',
  'prior_levels_of_care',
  'medication_tolerability_findings',
  'current_medication_reported_benefits',
  'current_medication_dose_positions',
  'medication_change_temporal_relationships',
  'reaction_records',
];

const makePatientState = (): ResolvedPatientState =>
  ResolvedPatientStateSchema.parse({
    schemaVersion: 1,
    id: 'resolved-patient-state.test.record-projection',
    demographics: {
      recordVersion: 2,
      ageYears: 48,
      reviewedAgeBandId: 'age-band.middle-adult',
      sexForReference: 'female',
    },
    conditionStates: [],
    diagnosisRecordEntries: [
      {
        schemaVersion: 1,
        id: 'diagnosis-record.test.depression-history',
        mappedDiagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
        mappedDiagnosisDefinitionContentVersion: '1.0.0',
        recordedLabel: 'Depression',
        assertion: 'historical',
        source: {
          kind: 'record_review',
          sourceInstanceId: 'source-instance.test.outside-record',
        },
        timeScopeId: 'time-scope.historical',
        resolution: authoredResolution,
      },
    ],
    medicationRegimenEntries: [
      {
        recordVersion: 2,
        id: 'regimen-entry.test.sertraline',
        medicationIdentityId: 'medication.sertraline',
        clinicalRole: 'psychiatric',
        status: 'active',
        adherence: 'intermittent',
        prescribedForDiagnosisId: 'diagnosis.major-depressive-disorder',
        source: 'patient_report',
        knownAtOpening: false,
        impactClassification: 'fit_relevant',
      },
    ],
    exposureInventory: {
      schemaVersion: 1,
      id: 'resolved-exposure-inventory.test.record-projection',
      useEntries: [
        {
          schemaVersion: 1,
          id: 'exposure-use.test.cannabis',
          agent: {
            kind: 'other_substance',
            identityId: 'substance.cannabis',
            identityContentVersion: '1.0.0',
          },
          mostRecentUse: { kind: 'current' },
          currentAmount: {
            quantity: 1,
            unitLabel: 'portion',
            frequencyLabel: 'most evenings',
          },
          prescriptionRelationship: 'not_applicable',
          misuseTruth: true,
          resolution: authoredResolution,
        },
      ],
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
      psychotherapyTrials: [
        {
          schemaVersion: 1,
          id: 'psychotherapy-trial.test.cbt',
          interventionId: 'intervention.psychotherapy.cbt',
          status: 'completed',
          engagement: 'adequate',
          response: 'partial',
          source: 'patient_report',
          summary: 'Prior course of CBT with partial benefit.',
        },
      ],
      currentProviders: [
        {
          schemaVersion: 1,
          id: 'treatment-provider.test.therapist',
          providerType: 'therapist',
          active: true,
          source: 'patient_report',
          summary: 'Currently sees a therapist.',
        },
      ],
      priorLevelsOfCare: [
        {
          schemaVersion: 1,
          id: 'prior-level-of-care.test.php',
          level: 'partial_hospitalization',
          occurrenceCount: 1,
          source: 'patient_report',
          summary: 'One prior partial-hospitalization episode.',
        },
      ],
    },
    medicationTolerabilityFindings: [
      {
        recordVersion: 2,
        id: 'tolerability-finding.test.sertraline-sexual',
        subject: {
          kind: 'current_regimen_entry',
          regimenEntryId: 'regimen-entry.test.sertraline',
        },
        domain: 'sexual_function',
        findingStatus: 'present',
        manifestationIds: ['manifestation.sexual.delayed-orgasm'],
        source: 'patient_report',
        sourceRateProfileId: 'rate-profile.test.hidden',
      },
    ],
    currentMedicationReportedBenefits: [
      {
        recordVersion: 1,
        id: 'current-medication-benefit.test.sertraline',
        subject: {
          modelVersion: 'finding-record-subject.v1',
          kind: 'current_regimen_entry',
          regimenEntryId: 'regimen-entry.test.sertraline',
        },
        reportedBenefit: 'partial',
        source: {
          kind: 'patient_report',
          sourceInstanceId: 'source-instance.test.patient',
        },
        timeScopeId: 'time-scope.current',
      },
    ],
    currentMedicationDosePositions: [
      {
        recordVersion: 1,
        id: 'current-medication-dose-position.test.sertraline',
        subject: {
          modelVersion: 'finding-record-subject.v1',
          kind: 'current_regimen_entry',
          regimenEntryId: 'regimen-entry.test.sertraline',
        },
        position: 'below_maximum',
        source: {
          kind: 'record_review',
          sourceInstanceId: 'source-instance.test.prescriber-record',
        },
        timeScopeId: 'time-scope.current',
      },
    ],
    medicationChangeTemporalRelationships: [
      {
        recordVersion: 1,
        id: 'medication-change-temporal.test.sertraline-increase',
        subject: {
          modelVersion: 'finding-record-subject.v1',
          kind: 'current_regimen_entry',
          regimenEntryId: 'regimen-entry.test.sertraline',
        },
        changeKind: 'increased',
        changeTimeScopeId: 'time-scope.recent',
        target: {
          kind: 'categorical_observation',
          categoricalObservationId: 'categorical-observation.test.pacing',
        },
        targetTimeScopeId: 'time-scope.current',
        relationship: 'change_before_target',
        source: {
          kind: 'patient_report',
          sourceInstanceId: 'source-instance.test.patient',
        },
      },
    ],
    reactionHistory: {
      status: 'entries_present',
      medicationAssessmentStatus: 'entries_present',
      records: [
        {
          schemaVersion: 1,
          id: 'reaction-record.test.haloperidol',
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
    canonicalFindings: [],
    measurements: [],
    categoricalObservations: [
      {
        schemaVersion: 1,
        id: 'categorical-observation.test.pacing',
        definitionId: 'categorical-observation-definition.test.pacing',
        definitionContentVersion: '1.0.0',
        valueId: 'categorical-observation-value.present',
        displayValue: 'Pacing observed',
        timeScopeId: 'time-scope.current',
        source: {
          kind: 'clinician_observation',
          sourceInstanceId: 'source-instance.test.clinician',
        },
        interpretationIds: [],
        resolution: authoredResolution,
      },
    ],
    structuredTestResults: [],
    clinicalContexts: [],
    clinicalDurations: [],
    functionalImpairments: [],
    subjectiveBurdenRecords: [],
    propositionState: {
      schemaVersion: 1,
      id: 'resolved-proposition-state.test.record-projection',
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    clinicalTagIds: [],
    reportedSafetyPlanningAbility: 'reports_able',
  });

const makeEnvelope = (): StructuredPatientStateRevealProjectionEnvelope => {
  const patientState = makePatientState();
  const definition = StructuredPatientStateRevealDefinitionSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'structured-reveal-definition.test.record-projection',
    modelVersion: 'structured-patient-state-reveal.v1',
    label: 'Structured history',
    informationActionId: 'info.history.structured-record-projection',
    informationActionPayloadFingerprint:
      'fingerprint.information-action.structured-record-projection.fnv1a64.0123456789abcdef',
    allowedSourceKinds: ['patient_report'],
    lanes,
    singletonFields: [
      'reaction_history_status',
      'medication_reaction_assessment_status',
      'reported_safety_planning_ability',
    ],
    lifecycle: 'review',
    review: {
      status: 'unreviewed',
      reviewerId: null,
      reviewedAt: null,
      sourceUseNoteIds: [],
    },
  });
  return StructuredPatientStateRevealProjectionEnvelopeSchema.parse({
    definition,
    patientState,
    resolved: {
      schemaVersion: 1,
      id: 'structured-reveal.test.record-projection',
      definitionId: definition.id,
      definitionContentVersion: definition.contentVersion,
      informationActionId: definition.informationActionId,
      informationActionPayloadFingerprint: definition.informationActionPayloadFingerprint,
      patientStateId: patientState.id,
      source: {
        kind: 'patient_report',
        sourceInstanceId: 'source-instance.test.patient',
      },
      timeScopeId: 'time-scope.longitudinal',
      claimOriginId: 'claim-origin.test.record-projection',
      dependencyGroupIds: [],
      laneStatements: lanes.map((lane) => {
        const recordIds = getStructuredPatientStateRevealLaneRecordIds(patientState, lane);
        return {
          lane,
          presentationStatus: 'items_present',
          includedTruthRecordIds: recordIds,
          omittedTruthRecordIds: [],
          relationshipToTruth: 'aligned',
        };
      }),
      singletonStatements: [
        {
          field: 'reaction_history_status',
          truthValue: 'entries_present',
          presentedValue: 'entries_present',
          relationshipToTruth: 'aligned',
        },
        {
          field: 'medication_reaction_assessment_status',
          truthValue: 'entries_present',
          presentedValue: 'entries_present',
          relationshipToTruth: 'aligned',
        },
        {
          field: 'reported_safety_planning_ability',
          truthValue: 'reports_able',
          presentedValue: 'reports_able',
          relationshipToTruth: 'aligned',
        },
      ],
      resolution: authoredResolution,
    },
  });
};

const expectProjection = () => {
  const result = projectStructuredPatientStateRecords(makeEnvelope());
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('D-349 minimized structured patient-state record projection', () => {
  it('projects every closed lane into a stable, independently typed record shape', () => {
    const projection = expectProjection();

    expect(projection.laneStatements.map((statement) => statement.lane)).toEqual([...lanes].sort());
    expect(
      projection.laneStatements.flatMap((statement) =>
        statement.records.map((record) => record.recordId),
      ),
    ).toHaveLength(12);
    expect(FrozenStructuredPatientStateRecordProjectionSchema.parse(projection)).toEqual(
      projection,
    );
    expect(verifyStructuredPatientStateRecordProjection(makeEnvelope(), projection)).toEqual({
      ok: true,
      value: projection,
    });
  });

  it('shows observed medication-trial duration and highest reported dose without adequacy', () => {
    const projection = expectProjection();
    const trial = projection.laneStatements
      .find((statement) => statement.lane === 'medication_trials')
      ?.records.find((record) => record.lane === 'medication_trials');

    expect(trial).toEqual({
      schemaVersion: 1,
      lane: 'medication_trials',
      recordId: 'medication-trial.test.fluoxetine',
      medicationId: 'medication.fluoxetine',
      duration: { value: 12, unit: 'week' },
      highestReportedDose: {
        amount: 40,
        unit: 'mg',
        frequency: 'daily',
      },
      adherence: 'consistent',
      response: 'partial',
      tolerability: 'tolerated',
    });
    expect(trial).not.toHaveProperty('adequacy');
    expect(trial).not.toHaveProperty('summary');
    expect(trial).not.toHaveProperty('source');
  });

  it('keeps hidden exposure truth, reaction interpretation, and authoring classifications out', () => {
    const projection = expectProjection();
    const serialized = JSON.stringify(projection);

    expect(serialized).not.toContain('misuseTruth');
    expect(serialized).not.toContain('interpretedAs');
    expect(serialized).not.toContain('sourceRateProfileId');
    expect(serialized).not.toContain('impactClassification');
    expect(serialized).not.toContain('prescribedForDiagnosisId');
    expect(serialized).not.toContain('relationshipToTruth');
    expect(serialized).not.toContain('omittedTruthRecordIds');
    expect(serialized).not.toContain('mappedDiagnosisDefinitionId');
  });

  it('preserves source-presented none separately without leaking an omitted positive truth record', () => {
    const envelope = makeEnvelope();
    const statement = envelope.resolved.laneStatements.find(
      (candidate) => candidate.lane === 'exposure_use_entries',
    );
    if (statement === undefined) throw new Error('Missing exposure lane.');
    statement.presentationStatus = 'none_reported';
    statement.omittedTruthRecordIds = [...statement.includedTruthRecordIds];
    statement.includedTruthRecordIds = [];
    statement.relationshipToTruth = 'misaligned';

    const result = projectStructuredPatientStateRecords(envelope);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(
      result.value.laneStatements.find((candidate) => candidate.lane === 'exposure_use_entries'),
    ).toEqual({
      lane: 'exposure_use_entries',
      presentationStatus: 'none_reported',
      records: [],
    });
    expect(JSON.stringify(result.value)).not.toContain('exposure-use.test.cannabis');
  });

  it('normalizes lane and record order without changing the projected payload', () => {
    const baseline = expectProjection();
    const reordered = makeEnvelope();
    reordered.resolved.laneStatements.reverse();
    reordered.definition.lanes.reverse();
    reordered.patientState.medicationRegimenEntries.reverse();

    const result = projectStructuredPatientStateRecords(reordered);
    expect(result).toEqual({ ok: true, value: baseline });
  });

  it('rejects forbidden field injection and detects otherwise schema-valid tampering', () => {
    const projection = expectProjection();
    const withAdequacy = structuredClone(projection) as unknown as {
      laneStatements: Array<{ lane: string; records: Array<Record<string, unknown>> }>;
    };
    const medicationTrial = withAdequacy.laneStatements
      .find((statement) => statement.lane === 'medication_trials')
      ?.records.at(0);
    if (medicationTrial === undefined) throw new Error('Missing projected medication trial.');
    medicationTrial.adequacy = 'adequate';
    expect(FrozenStructuredPatientStateRecordProjectionSchema.safeParse(withAdequacy).success).toBe(
      false,
    );

    const tampered = structuredClone(projection);
    const benefit = tampered.laneStatements
      .find((statement) => statement.lane === 'current_medication_reported_benefits')
      ?.records.find((record) => record.lane === 'current_medication_reported_benefits');
    if (benefit === undefined) throw new Error('Missing projected medication benefit.');
    benefit.reportedBenefit = 'substantial';
    expect(verifyStructuredPatientStateRecordProjection(makeEnvelope(), tampered)).toMatchObject({
      ok: false,
      error: { code: 'PROJECTION_MISMATCH' },
    });
  });

  it('fails closed when the source view no longer exactly partitions its frozen patient lane', () => {
    const invalid = makeEnvelope();
    invalid.resolved.laneStatements[0]!.includedTruthRecordIds = ['record.missing'];

    expect(projectStructuredPatientStateRecords(invalid)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_ENVELOPE' },
    });
  });
});
