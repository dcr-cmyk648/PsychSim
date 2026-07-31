import {
  PresentationRichnessEnvelopeSchema,
  type PresentationRichnessEnvelope,
  type ResolvedPatientState,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  evaluatePresentationRichness,
  verifyPresentationRichnessContext,
  verifyPresentationRichnessIntegrity,
} from './presentation-richness';

const authoredResolution = {
  origin: 'authored',
  ownerId: 'patient-template.test.richness',
  ownerContentVersion: '1.0.0',
} as const;

const templateRef = {
  id: 'patient-template.test.richness',
  contentVersion: '1.0.0',
} as const;

const makeEnvelope = (
  priorEffortExpectation: PresentationRichnessEnvelope['priorEffortExpectation'] = {
    kind: 'not_required',
  },
): PresentationRichnessEnvelope => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'presentation-richness.test.focused-encounter',
  modelVersion: 'presentation-richness.v1',
  decisionDriverCategories: [
    'regimen_transition',
    'diagnostic_attribution',
    'prior_response_or_intolerance',
  ],
  priorEffortExpectation,
});

const makePatientState = (): ResolvedPatientState => ({
  schemaVersion: 1,
  id: 'resolved-patient-state.test.richness',
  demographics: {
    recordVersion: 2,
    ageYears: 47,
    reviewedAgeBandId: 'age-band.middle-adult',
    sexForReference: 'female',
  },
  conditionStates: [
    {
      schemaVersion: 1,
      id: 'condition-state.test.mdd',
      diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      encounterRelevance: 'focus',
      severityId: 'diagnosis-severity.mdd.moderate',
      specifierIds: [],
      origin: 'authored',
      resolution: authoredResolution,
    },
  ],
  diagnosisRecordEntries: [],
  medicationRegimenEntries: [],
  exposureInventory: {
    schemaVersion: 1,
    id: 'resolved-exposure-inventory.test.richness',
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
    id: 'resolved-proposition-state.test.richness',
    propositions: [],
    evidence: [],
    dependencyGroups: [],
    beliefAppraisals: [],
  },
  clinicalTagIds: [],
  reportedSafetyPlanningAbility: 'unassessed',
});

const expectEvaluation = (state: ResolvedPatientState, envelope: PresentationRichnessEnvelope) => {
  const result = evaluatePresentationRichness({
    templateRef,
    envelope,
    patientState: state,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const medicationTrial = (index: number) => ({
  schemaVersion: 1 as const,
  id: `medication-trial.test.richness-${index}`,
  medicationId: `medication.test-${index}`,
  exposure: {
    duration: { value: 8, unit: 'week' as const },
    maximumDose: null,
  },
  adequacy: 'adequate' as const,
  adherence: 'consistent' as const,
  response: 'none' as const,
  tolerability: 'tolerated' as const,
  source: 'patient_report' as const,
  summary: `Synthetic prior medication trial ${index}.`,
});

describe('presentation richness evaluator', () => {
  it('enumerates exact frozen domains and counts structured prior effort', () => {
    const state = makePatientState();
    state.medicationRegimenEntries.push({
      recordVersion: 2,
      id: 'regimen-entry.test.richness',
      medicationIdentityId: 'medication.sertraline',
      clinicalRole: 'psychiatric',
      status: 'active',
      adherence: 'consistent',
      prescribedForDiagnosisId: 'diagnosis.major-depressive-disorder',
      source: 'patient_report',
      knownAtOpening: true,
      impactClassification: 'fit_relevant',
    });
    state.exposureInventory.useEntries.push({
      schemaVersion: 1,
      id: 'exposure-use.test.richness',
      agent: {
        kind: 'supplement',
        identityId: 'supplement.magnesium',
        identityContentVersion: '1.0.0',
      },
      mostRecentUse: { kind: 'current' },
      currentAmount: {
        quantity: 1,
        unitLabel: 'tablet',
        frequencyLabel: 'most evenings',
      },
      prescriptionRelationship: 'not_applicable',
      misuseTruth: false,
      resolution: authoredResolution,
    });
    state.treatmentHistory.medicationTrials.push(medicationTrial(1));
    state.treatmentHistory.psychotherapyTrials.push({
      schemaVersion: 1,
      id: 'psychotherapy-trial.test.richness',
      interventionId: 'intervention.psychotherapy.cbt',
      status: 'completed',
      engagement: 'adequate',
      response: 'partial',
      source: 'patient_report',
      summary: 'Synthetic prior psychotherapy trial.',
    });
    state.treatmentHistory.currentProviders.push({
      schemaVersion: 1,
      id: 'provider-record.test.richness',
      providerType: 'therapist',
      active: true,
      source: 'patient_report',
      summary: 'Synthetic current therapist.',
    });
    state.treatmentHistory.priorLevelsOfCare.push({
      schemaVersion: 1,
      id: 'level-of-care.test.richness',
      level: 'inpatient_psychiatry',
      occurrenceCount: 3,
      source: 'outside_record',
      summary: 'Synthetic prior admissions.',
    });

    const evaluation = expectEvaluation(
      state,
      makeEnvelope({ kind: 'multiple_expected', minimumEffortUnits: 2 }),
    );

    expect(evaluation.priorEffort).toMatchObject({
      status: 'met',
      totalEffortUnits: 6,
    });
    expect(evaluation.priorEffort.contributions).toEqual([
      {
        kind: 'current_provider',
        recordId: 'provider-record.test.richness',
        effortUnits: 1,
      },
      {
        kind: 'medication_trial',
        recordId: 'medication-trial.test.richness-1',
        effortUnits: 1,
      },
      {
        kind: 'prior_level_of_care',
        recordId: 'level-of-care.test.richness',
        effortUnits: 3,
      },
      {
        kind: 'psychotherapy_trial',
        recordId: 'psychotherapy-trial.test.richness',
        effortUnits: 1,
      },
    ]);
    expect(
      Object.fromEntries(
        evaluation.domainCounts.map(({ domain, recordCount, recordIds }) => [
          domain,
          { recordCount, recordIds },
        ]),
      ),
    ).toEqual({
      internal_condition: {
        recordCount: 1,
        recordIds: ['condition-state.test.mdd'],
      },
      chart_diagnosis: { recordCount: 0, recordIds: [] },
      current_regimen_entry: {
        recordCount: 1,
        recordIds: ['regimen-entry.test.richness'],
      },
      exposure: {
        recordCount: 1,
        recordIds: ['exposure-use.test.richness'],
      },
      medication_trial: {
        recordCount: 1,
        recordIds: ['medication-trial.test.richness-1'],
      },
      psychotherapy_trial: {
        recordCount: 1,
        recordIds: ['psychotherapy-trial.test.richness'],
      },
      current_provider: {
        recordCount: 1,
        recordIds: ['provider-record.test.richness'],
      },
      prior_level_of_care: {
        recordCount: 1,
        recordIds: ['level-of-care.test.richness'],
      },
      reaction_record: { recordCount: 0, recordIds: [] },
      canonical_finding: { recordCount: 0, recordIds: [] },
    });
    expect(evaluation.diagnostics).toEqual([]);
  });

  it('rejects malformed template expectations before evaluation', () => {
    expect(
      PresentationRichnessEnvelopeSchema.safeParse({
        ...makeEnvelope(),
        decisionDriverCategories: [],
      }).success,
    ).toBe(false);
    expect(
      PresentationRichnessEnvelopeSchema.safeParse({
        ...makeEnvelope(),
        decisionDriverCategories: ['safety', 'safety'],
      }).success,
    ).toBe(false);
    expect(
      PresentationRichnessEnvelopeSchema.safeParse({
        ...makeEnvelope(),
        priorEffortExpectation: {
          kind: 'multiple_expected',
          minimumEffortUnits: 1,
        },
      }).success,
    ).toBe(false);
    expect(
      PresentationRichnessEnvelopeSchema.safeParse({
        ...makeEnvelope(),
        priorEffortExpectation: {
          kind: 'treatment_naive_exception',
          reason: ' ',
        },
      }).success,
    ).toBe(false);
  });

  it('has no global maximum for extensive prior treatment', () => {
    const state = makePatientState();
    for (let index = 1; index <= 15; index += 1) {
      state.treatmentHistory.medicationTrials.push(medicationTrial(index));
    }

    const evaluation = expectEvaluation(
      state,
      makeEnvelope({ kind: 'multiple_expected', minimumEffortUnits: 2 }),
    );

    expect(evaluation.priorEffort.totalEffortUnits).toBe(15);
    expect(evaluation.priorEffort.status).toBe('met');
    expect(evaluation.domainCounts).toContainEqual({
      domain: 'medication_trial',
      recordCount: 15,
      recordIds: Array.from(
        { length: 15 },
        (_, index) => `medication-trial.test.richness-${index + 1}`,
      ).sort(),
    });
  });

  it('reports expectation shortfalls and inconsistent exceptions without blocking', () => {
    const state = makePatientState();
    const unmet = expectEvaluation(
      state,
      makeEnvelope({ kind: 'multiple_expected', minimumEffortUnits: 2 }),
    );
    expect(unmet.priorEffort.status).toBe('unmet');
    expect(unmet.diagnostics).toEqual([
      expect.objectContaining({
        code: 'prior_effort_expectation_unmet',
        impact: 'nonblocking',
      }),
    ]);

    const exceptionApplied = expectEvaluation(
      state,
      makeEnvelope({
        kind: 'treatment_naive_exception',
        reason: 'This focused template deliberately models a first treatment decision.',
      }),
    );
    expect(exceptionApplied.priorEffort.status).toBe('exception_applied');
    expect(exceptionApplied.diagnostics).toEqual([]);

    state.treatmentHistory.medicationTrials.push(medicationTrial(1));
    const exceptionConflict = expectEvaluation(
      state,
      makeEnvelope({
        kind: 'treatment_naive_exception',
        reason: 'This focused template deliberately models a first treatment decision.',
      }),
    );
    expect(exceptionConflict.priorEffort.status).toBe('exception_inconsistent');
    expect(exceptionConflict.diagnostics).toEqual([
      expect.objectContaining({
        code: 'treatment_naive_exception_has_prior_efforts',
        impact: 'nonblocking',
      }),
    ]);
  });

  it('is deterministic, order-normalized, and does not mutate inputs', () => {
    const state = makePatientState();
    state.treatmentHistory.medicationTrials.push(medicationTrial(2), medicationTrial(1));
    const envelope = makeEnvelope({ kind: 'multiple_expected', minimumEffortUnits: 2 });
    const before = JSON.stringify({ state, envelope });
    const first = expectEvaluation(state, envelope);
    expect(JSON.stringify({ state, envelope })).toBe(before);

    const reorderedState = structuredClone(state);
    reorderedState.treatmentHistory.medicationTrials.reverse();
    const reorderedEnvelope = structuredClone(envelope);
    reorderedEnvelope.decisionDriverCategories.reverse();
    expect(expectEvaluation(reorderedState, reorderedEnvelope)).toEqual(first);
  });

  it('rejects tampered payloads and stale patient context', () => {
    const state = makePatientState();
    const envelope = makeEnvelope();
    const evaluation = expectEvaluation(state, envelope);
    expect(verifyPresentationRichnessIntegrity(evaluation)).toEqual({
      ok: true,
      value: evaluation,
    });

    const unsupported = structuredClone(evaluation);
    unsupported.evaluatorVersion = '9.0.0';
    expect(verifyPresentationRichnessIntegrity(unsupported)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_EVALUATOR_VERSION' },
    });

    const envelopeChanged = structuredClone(evaluation);
    envelopeChanged.envelope.decisionDriverCategories = ['safety'];
    expect(verifyPresentationRichnessIntegrity(envelopeChanged)).toMatchObject({
      ok: false,
      error: { code: 'ENVELOPE_FINGERPRINT_MISMATCH' },
    });

    const inputChanged = structuredClone(evaluation);
    inputChanged.patientStateFingerprint =
      'fingerprint.decision.patient-state.fnv1a64.0000000000000000';
    expect(verifyPresentationRichnessIntegrity(inputChanged)).toMatchObject({
      ok: false,
      error: { code: 'INPUT_FINGERPRINT_MISMATCH' },
    });

    const shortfall = expectEvaluation(
      state,
      makeEnvelope({ kind: 'multiple_expected', minimumEffortUnits: 2 }),
    );
    const payloadChanged = structuredClone(shortfall);
    payloadChanged.diagnostics[0]!.message = 'A schema-valid but unauthenticated change.';
    expect(verifyPresentationRichnessIntegrity(payloadChanged)).toMatchObject({
      ok: false,
      error: { code: 'PAYLOAD_FINGERPRINT_MISMATCH' },
    });

    const changedState = structuredClone(state);
    changedState.demographics.ageYears += 1;
    expect(
      verifyPresentationRichnessContext({
        evaluation,
        templateRef,
        envelope,
        patientState: changedState,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });

  it('remains an authoring diagnostic without points, scoring, or quarantine semantics', () => {
    const serialized = JSON.stringify(expectEvaluation(makePatientState(), makeEnvelope()));
    for (const forbidden of [
      '"points"',
      '"score"',
      '"clinicalScore"',
      '"payout"',
      '"probability"',
      '"difficultyTier"',
      '"quarantine"',
      '"reroll"',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
