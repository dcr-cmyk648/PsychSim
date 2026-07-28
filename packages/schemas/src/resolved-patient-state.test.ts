import { describe, expect, it } from 'vitest';

import { ResolvedPatientStateSchema } from './index';

const authoredResolution = {
  origin: 'authored',
  ownerId: 'patient-template.test.complex',
  ownerContentVersion: '1.0.0',
} as const;

const generatedResolution = (stableDrawId: string) =>
  ({
    origin: 'deterministic_generation',
    generationProfileId: 'generation-profile.test.complex',
    generationProfileContentVersion: '1.0.0',
    resolverVersion: '1.0.0',
    stableDrawId,
  }) as const;

const makeState = () => ({
  schemaVersion: 1,
  id: 'resolved-patient-state.test.complex',
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
      clinicalStateId: 'clinical-state.current-episode',
      timeScopeId: 'time-scope.current',
      encounterRelevance: 'focus',
      severityId: 'diagnosis-severity.mdd.moderate',
      specifierIds: [],
      origin: 'authored',
      resolution: authoredResolution,
    },
    {
      schemaVersion: 1,
      id: 'condition-state.test.gad',
      diagnosisDefinitionId: 'diagnosis.generalized-anxiety-disorder',
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      encounterRelevance: 'contributing',
      severityId: null,
      specifierIds: [],
      origin: 'generated_optional',
      resolution: generatedResolution('draw.test.condition.gad'),
    },
  ],
  diagnosisRecordEntries: [
    {
      schemaVersion: 1,
      id: 'diagnosis-record.test.mdd.problem-list',
      mappedDiagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
      mappedDiagnosisDefinitionContentVersion: '1.0.0',
      recordedLabel: 'Major depressive disorder',
      assertion: 'asserted',
      source: {
        kind: 'record_review',
        sourceInstanceId: 'source-instance.test.problem-list',
      },
      timeScopeId: 'time-scope.current',
      resolution: authoredResolution,
    },
    {
      schemaVersion: 1,
      id: 'diagnosis-record.test.mdd.outside-record',
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
    {
      schemaVersion: 1,
      id: 'diagnosis-record.test.bipolar-question',
      mappedDiagnosisDefinitionId: 'diagnosis.bipolar-disorder',
      mappedDiagnosisDefinitionContentVersion: '1.0.0',
      recordedLabel: 'Rule out bipolar disorder',
      assertion: 'questioned',
      source: {
        kind: 'patient_report',
        sourceInstanceId: 'source-instance.test.patient',
      },
      timeScopeId: 'time-scope.historical',
      resolution: authoredResolution,
    },
  ],
  medicationRegimenEntries: [
    {
      recordVersion: 2,
      id: 'regimen-entry.test.aripiprazole.one',
      medicationIdentityId: 'medication.aripiprazole',
      clinicalRole: 'psychiatric',
      status: 'active',
      adherence: 'consistent',
      prescribedForDiagnosisId: 'diagnosis.major-depressive-disorder',
      source: 'patient_report',
      knownAtOpening: true,
      impactClassification: 'fit_relevant',
    },
    {
      recordVersion: 2,
      id: 'regimen-entry.test.aripiprazole.two',
      medicationIdentityId: 'medication.aripiprazole',
      clinicalRole: 'psychiatric',
      status: 'prescribed_not_taking',
      adherence: 'not_taking',
      prescribedForDiagnosisId: 'diagnosis.bipolar-disorder',
      source: 'outside_record',
      knownAtOpening: false,
      impactClassification: 'companion_safety',
    },
    {
      recordVersion: 2,
      id: 'regimen-entry.test.levothyroxine',
      medicationIdentityId: 'medication.levothyroxine',
      clinicalRole: 'nonpsychiatric',
      status: 'active',
      adherence: 'consistent',
      prescribedForDiagnosisId: null,
      source: 'prescriber_record',
      knownAtOpening: true,
      impactClassification: 'neutral_background',
    },
  ],
  exposureInventory: {
    schemaVersion: 1,
    id: 'resolved-exposure-inventory.test.complex',
    useEntries: [
      {
        schemaVersion: 1,
        id: 'exposure-use.test.magnesium',
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
        resolution: {
          origin: 'authored',
          ownerId: 'patient-template.test.complex',
          ownerContentVersion: '1.0.0',
        },
      },
    ],
  },
  treatmentHistory: {
    medicationTrials: [
      {
        schemaVersion: 1,
        id: 'medication-trial.test.sertraline.one',
        medicationId: 'medication.sertraline',
        exposure: {
          duration: { value: 10, unit: 'week' },
          maximumDose: null,
        },
        adequacy: 'adequate',
        adherence: 'consistent',
        response: 'partial',
        tolerability: 'tolerated',
        source: 'patient_report',
        summary: 'Reported a partial response during a prior trial.',
      },
      {
        schemaVersion: 1,
        id: 'medication-trial.test.sertraline.two',
        medicationId: 'medication.sertraline',
        exposure: {
          duration: { value: 3, unit: 'week' },
          maximumDose: null,
        },
        adequacy: 'inadequate',
        adherence: 'unknown',
        response: 'unknown',
        tolerability: 'unknown',
        source: 'outside_record',
        summary: 'A separate short trial appears in an outside record.',
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
        summary: 'Previously completed a course of therapy.',
      },
    ],
    currentProviders: [
      {
        schemaVersion: 1,
        id: 'provider-record.test.therapist',
        providerType: 'therapist',
        active: true,
        source: 'patient_report',
        summary: 'Reports an active outpatient therapist.',
      },
    ],
    priorLevelsOfCare: [
      {
        schemaVersion: 1,
        id: 'level-of-care.test.inpatient',
        level: 'inpatient_psychiatry',
        occurrenceCount: 1,
        source: 'outside_record',
        summary: 'One prior inpatient psychiatric admission is documented.',
      },
    ],
  },
  medicationTolerabilityFindings: [
    {
      recordVersion: 2,
      id: 'tolerability.test.aripiprazole.activation',
      subject: {
        kind: 'current_regimen_entry',
        regimenEntryId: 'regimen-entry.test.aripiprazole.one',
      },
      domain: 'activation',
      findingStatus: 'present',
      manifestationIds: ['reaction-manifestation.restlessness'],
      source: 'patient_report',
      sourceRateProfileId: null,
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
        manifestationIds: ['reaction-manifestation.oculogyric-crisis'],
        reportedSeverity: 'severe',
        interpretedAs: null,
        source: 'patient_report',
        status: 'historical',
      },
    ],
  },
  canonicalFindings: [
    {
      schemaVersion: 1,
      id: 'resolved-finding.test.low-energy',
      definitionId: 'finding.history.current-self-reported-fatigue-low-energy',
      definitionContentVersion: '1.0.0',
      value: {
        kind: 'outcome',
        value: 'present',
      },
      resolution: {
        resolverVersion: '1.0.0',
        origin: 'authored',
        uncertainty: 'none',
        appliedContributionIds: ['finding-contribution.test.low-energy'],
      },
      contributions: [
        {
          schemaVersion: 1,
          id: 'finding-contribution.test.low-energy',
          ownerKind: 'patient_state',
          ownerId: 'resolved-patient-state.test.complex',
          ownerContentVersion: null,
          role: 'authored_value',
          provenanceIds: [],
        },
      ],
    },
  ],
  measurements: [
    {
      schemaVersion: 1,
      id: 'resolved-measurement.test.weight',
      definitionId: 'measurement.anthropometric.weight',
      definitionContentVersion: '1.0.0',
      value: 82.4,
      displayValue: '82.4',
      unit: {
        display: 'kg',
        ucumCode: 'kg',
      },
      contextValues: [],
      timeScopeId: 'time-scope.current',
      sourceInstanceId: 'source-instance.test.scale',
      interpretation: {
        kind: 'not_interpreted',
      },
      resolution: authoredResolution,
    },
  ],
  categoricalObservations: [
    {
      schemaVersion: 1,
      id: 'resolved-observation.test.body-habitus',
      definitionId: 'observation.physical.body-habitus',
      definitionContentVersion: '1.0.0',
      valueId: 'observation-value.body-habitus.average',
      displayValue: 'Average body habitus',
      timeScopeId: 'time-scope.current',
      sourceInstanceId: 'source-instance.test.clinician',
      interpretationIds: [],
      resolution: authoredResolution,
    },
  ],
  structuredTestResults: [
    {
      schemaVersion: 1,
      id: 'structured-test-result.test.pregnancy',
      testDefinitionId: 'test.lab.pregnancy',
      testDefinitionContentVersion: '1.1.0',
      sourceInstanceId: 'source-instance.test.laboratory',
      timeScopeId: 'time-scope.current',
      resolution: authoredResolution,
      kind: 'binary',
      outcome: 'negative',
      displayValue: 'Negative',
      interpretationIds: [],
    },
  ],
  clinicalContexts: [
    {
      dimensionId: 'clinical-context.test.sleep',
      optionId: 'clinical-context-option.test.insomnia',
      addedClinicalTagIds: ['clinical-tag.sleep.insomnia'],
      findingBindings: [],
    },
  ],
  clinicalDurations: [
    {
      schemaVersion: 1,
      id: 'clinical-duration.test.low-energy',
      target: {
        kind: 'canonical_finding',
        canonicalFindingId: 'resolved-finding.test.low-energy',
      },
      value: 4,
      unit: 'month',
      durationProfileId: 'duration-profile.test.low-energy',
      durationOptionId: 'duration-option.test.four-months',
      relatedDiagnosisId: 'diagnosis.major-depressive-disorder',
      interpretation: 'supports_authored_state',
      criterionId: null,
      source: {
        kind: 'patient_report',
        sourceInstanceId: 'source-instance.test.patient',
      },
      timeScopeId: 'time-scope.current',
      resolution: generatedResolution('draw.test.duration.low-energy'),
    },
  ],
  subjectiveBurdenRecords: [
    {
      schemaVersion: 1,
      id: 'subjective-burden.test.patient.low-energy',
      target: {
        kind: 'canonical_finding',
        canonicalFindingId: 'resolved-finding.test.low-energy',
      },
      ordinalScaleId: 'ordinal-scale.test.bothersomeness',
      ordinalScaleContentVersion: '1.0.0',
      ordinalValueId: 'ordinal-value.test.very',
      source: {
        kind: 'patient_report',
        sourceInstanceId: 'source-instance.test.patient',
      },
      timeScopeId: 'time-scope.current',
      resolution: authoredResolution,
    },
    {
      schemaVersion: 1,
      id: 'subjective-burden.test.collateral.low-energy',
      target: {
        kind: 'canonical_finding',
        canonicalFindingId: 'resolved-finding.test.low-energy',
      },
      ordinalScaleId: 'ordinal-scale.test.bothersomeness',
      ordinalScaleContentVersion: '1.0.0',
      ordinalValueId: 'ordinal-value.test.somewhat',
      source: {
        kind: 'collateral_report',
        sourceInstanceId: 'source-instance.test.collateral',
      },
      timeScopeId: 'time-scope.current',
      resolution: authoredResolution,
    },
  ],
  propositionState: {
    schemaVersion: 1,
    id: 'resolved-proposition-state.test.complex',
    propositions: [
      {
        schemaVersion: 1,
        id: 'patient-proposition.test.adherence',
        definitionId: 'proposition.test.took-medication',
        definitionContentVersion: '1.0.0',
        auditStatement: 'The patient took the medication as recorded.',
        truth: true,
        resolution: authoredResolution,
      },
    ],
    evidence: [
      {
        schemaVersion: 1,
        id: 'patient-evidence.test.adherence.patient',
        propositionId: 'patient-proposition.test.adherence',
        assertion: 'opposes',
        relationshipToTruth: 'misaligned',
        source: {
          kind: 'patient_report',
          sourceInstanceId: 'source-instance.test.patient',
        },
        timeScopeId: 'time-scope.current',
        claimOriginId: 'claim-origin.test.adherence.patient',
        dependencyGroupIds: [],
        resolution: generatedResolution('draw.test.evidence.adherence.patient'),
      },
      {
        schemaVersion: 1,
        id: 'patient-evidence.test.adherence.collateral',
        propositionId: 'patient-proposition.test.adherence',
        assertion: 'supports',
        relationshipToTruth: 'aligned',
        source: {
          kind: 'collateral_report',
          sourceInstanceId: 'source-instance.test.collateral',
        },
        timeScopeId: 'time-scope.current',
        claimOriginId: 'claim-origin.test.adherence.collateral',
        dependencyGroupIds: [],
        resolution: generatedResolution('draw.test.evidence.adherence.collateral'),
      },
    ],
    dependencyGroups: [],
    beliefAppraisals: [],
  },
  clinicalTagIds: ['clinical-tag.sleep.insomnia'],
  reportedSafetyPlanningAbility: 'uncertain',
});

describe('resolved patient-state foundation', () => {
  it('round-trips a complex point-free snapshot with repeated identities and conflicting sources', () => {
    const parsed = ResolvedPatientStateSchema.parse(makeState());

    expect(
      parsed.medicationRegimenEntries.filter(
        (entry) => entry.medicationIdentityId === 'medication.aripiprazole',
      ),
    ).toHaveLength(2);
    expect(
      parsed.diagnosisRecordEntries.filter(
        (entry) => entry.mappedDiagnosisDefinitionId === 'diagnosis.major-depressive-disorder',
      ),
    ).toHaveLength(2);
    expect(parsed.propositionState.evidence.map((entry) => entry.relationshipToTruth)).toEqual([
      'misaligned',
      'aligned',
    ]);
    expect(parsed.subjectiveBurdenRecords.map((entry) => entry.ordinalValueId)).toEqual([
      'ordinal-value.test.very',
      'ordinal-value.test.somewhat',
    ]);
    expect(parsed.exposureInventory.useEntries[0]?.agent).toEqual({
      kind: 'supplement',
      identityId: 'supplement.magnesium',
      identityContentVersion: '1.0.0',
    });
  });

  it('does not require chart claims to activate conditions or conditions to create chart claims', () => {
    const chartOnly = makeState();
    chartOnly.conditionStates = [];
    expect(ResolvedPatientStateSchema.safeParse(chartOnly).success).toBe(true);

    const internalOnly = makeState();
    internalOnly.diagnosisRecordEntries = [];
    expect(ResolvedPatientStateSchema.safeParse(internalOnly).success).toBe(true);
  });

  it('keeps prescription-list records separate from objective medication use', () => {
    const state = makeState();
    state.exposureInventory.useEntries.push({
      schemaVersion: 1,
      id: 'exposure-use.test.gabapentin',
      agent: {
        kind: 'medication',
        identityId: 'medication.gabapentin',
        identityContentVersion: '1.0.0',
      },
      mostRecentUse: { kind: 'current' },
      currentAmount: {
        quantity: 1,
        unitLabel: 'capsule',
        frequencyLabel: 'occasionally',
      },
      prescriptionRelationship: 'not_prescribed_to_patient',
      misuseTruth: false,
      resolution: {
        origin: 'authored',
        ownerId: 'patient-template.test.complex',
        ownerContentVersion: '1.0.0',
      },
    });

    const parsed = ResolvedPatientStateSchema.parse(state);
    expect(
      parsed.medicationRegimenEntries.some(
        (entry) => entry.medicationIdentityId === 'medication.gabapentin',
      ),
    ).toBe(false);
    expect(
      parsed.exposureInventory.useEntries.some(
        (entry) => entry.agent.identityId === 'medication.gabapentin',
      ),
    ).toBe(true);
  });

  it('allows repeated medication and diagnosis identities but rejects repeated record IDs', () => {
    const state = makeState();
    state.medicationRegimenEntries[1]!.id = state.medicationRegimenEntries[0]!.id;

    expect(ResolvedPatientStateSchema.safeParse(state).success).toBe(false);
  });

  it('rejects orphaned duration, burden, and medication-tolerability references', () => {
    const durationState = makeState();
    durationState.clinicalDurations[0]!.target.canonicalFindingId = 'resolved-finding.test.missing';
    expect(ResolvedPatientStateSchema.safeParse(durationState).success).toBe(false);

    const burdenState = makeState();
    burdenState.subjectiveBurdenRecords[0]!.target.canonicalFindingId =
      'resolved-finding.test.missing';
    expect(ResolvedPatientStateSchema.safeParse(burdenState).success).toBe(false);

    const tolerabilityState = makeState();
    tolerabilityState.medicationTolerabilityFindings[0]!.subject.regimenEntryId =
      'regimen-entry.test.missing';
    expect(ResolvedPatientStateSchema.safeParse(tolerabilityState).success).toBe(false);
  });

  it('rejects half-mapped chart diagnoses without judging their accuracy', () => {
    const state = makeState();
    expect(
      ResolvedPatientStateSchema.safeParse({
        ...state,
        diagnosisRecordEntries: state.diagnosisRecordEntries.map((entry, index) =>
          index === 2
            ? {
                ...entry,
                mappedDiagnosisDefinitionContentVersion: null,
              }
            : entry,
        ),
      }).success,
    ).toBe(false);
  });

  it('resolves each canonical finding definition once while retaining many source views', () => {
    const state = makeState();
    const duplicate = structuredClone(state.canonicalFindings[0]!);
    duplicate.id = 'resolved-finding.test.low-energy.duplicate';
    duplicate.contributions[0]!.id = 'finding-contribution.test.low-energy.duplicate';
    duplicate.resolution.appliedContributionIds = [
      'finding-contribution.test.low-energy.duplicate',
    ];
    state.canonicalFindings.push(duplicate);

    expect(ResolvedPatientStateSchema.safeParse(state).success).toBe(false);
  });

  it('keeps unassessed reaction and safety-planning state explicit rather than treating it as false', () => {
    const state = makeState();
    state.reactionHistory = {
      status: 'unassessed',
      medicationAssessmentStatus: 'unassessed',
      records: [],
    };
    state.reportedSafetyPlanningAbility = 'unassessed';

    const parsed = ResolvedPatientStateSchema.parse(state);
    expect(parsed.reactionHistory.status).toBe('unassessed');
    expect(parsed.reportedSafetyPlanningAbility).toBe('unassessed');
  });

  it.each([
    'points',
    'revealedActionIds',
    'treatmentRecommendation',
    'inferredDiagnosisId',
    'optionalComorbidityIds',
    'difficultyTier',
    'locationId',
    'economy',
  ])('rejects out-of-bound patient-state field %s', (field) => {
    const state = { ...makeState(), [field]: field };
    expect(ResolvedPatientStateSchema.safeParse(state).success).toBe(false);
  });
});
