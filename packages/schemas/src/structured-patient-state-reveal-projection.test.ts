import { describe, expect, it } from 'vitest';

import {
  ResolvedPatientStateSchema,
  StructuredPatientStateRevealDefinitionSchema,
  StructuredPatientStateRevealProjectionEnvelopeSchema,
  type ResolvedPatientState,
  type StructuredPatientStateRevealDefinition,
  type StructuredPatientStateRevealProjectionEnvelope,
} from './index';

const authoredResolution = {
  origin: 'authored',
  ownerId: 'patient-template.test.structured-reveal',
  ownerContentVersion: '1.0.0',
} as const;

const review = {
  status: 'unreviewed',
  reviewerId: null,
  reviewedAt: null,
  sourceUseNoteIds: [],
} as const;

const makePatientState = (): ResolvedPatientState => ({
  schemaVersion: 1,
  id: 'resolved-patient-state.test.structured-reveal',
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
    {
      recordVersion: 2,
      id: 'regimen-entry.test.levothyroxine',
      medicationIdentityId: 'medication.levothyroxine',
      clinicalRole: 'nonpsychiatric',
      status: 'active',
      adherence: 'consistent',
      prescribedForDiagnosisId: null,
      source: 'prescriber_record',
      knownAtOpening: false,
      impactClassification: 'neutral_background',
    },
  ],
  exposureInventory: {
    schemaVersion: 1,
    id: 'resolved-exposure-inventory.test.structured-reveal',
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
        misuseTruth: false,
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
          maximumDose: null,
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
  categoricalObservations: [],
  structuredTestResults: [],
  clinicalContexts: [],
  clinicalDurations: [],
  subjectiveBurdenRecords: [],
  propositionState: {
    schemaVersion: 1,
    id: 'resolved-proposition-state.test.structured-reveal',
    propositions: [],
    evidence: [],
    dependencyGroups: [],
    beliefAppraisals: [],
  },
  clinicalTagIds: [],
  reportedSafetyPlanningAbility: 'reports_able',
});

const makeDefinition = (
  overrides: Partial<StructuredPatientStateRevealDefinition> = {},
): StructuredPatientStateRevealDefinition =>
  StructuredPatientStateRevealDefinitionSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'structured-reveal-definition.test.full-treatment-history',
    modelVersion: 'structured-patient-state-reveal.v1',
    label: 'Full treatment history',
    informationActionId: 'info.history.full-treatment-history',
    informationActionPayloadFingerprint:
      'fingerprint.information-action.full-treatment-history.fnv1a64.0123456789abcdef',
    allowedSourceKinds: ['patient_report'],
    lanes: [
      'medication_trials',
      'psychotherapy_trials',
      'current_treatment_providers',
      'prior_levels_of_care',
    ],
    singletonFields: [],
    lifecycle: 'review',
    review,
    ...overrides,
  });

const makeFullHistoryEnvelope = (): StructuredPatientStateRevealProjectionEnvelope => {
  const definition = makeDefinition();
  const patientState = ResolvedPatientStateSchema.parse(makePatientState());
  return {
    definition,
    patientState,
    resolved: {
      schemaVersion: 1,
      id: 'structured-reveal.test.full-treatment-history.patient',
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
      claimOriginId: 'claim-origin.test.full-treatment-history.patient',
      dependencyGroupIds: [],
      laneStatements: [
        {
          lane: 'medication_trials',
          presentationStatus: 'items_present',
          includedTruthRecordIds: ['medication-trial.test.fluoxetine'],
          omittedTruthRecordIds: [],
          relationshipToTruth: 'aligned',
        },
        {
          lane: 'psychotherapy_trials',
          presentationStatus: 'items_present',
          includedTruthRecordIds: ['psychotherapy-trial.test.cbt'],
          omittedTruthRecordIds: [],
          relationshipToTruth: 'aligned',
        },
        {
          lane: 'current_treatment_providers',
          presentationStatus: 'items_present',
          includedTruthRecordIds: ['treatment-provider.test.therapist'],
          omittedTruthRecordIds: [],
          relationshipToTruth: 'aligned',
        },
        {
          lane: 'prior_levels_of_care',
          presentationStatus: 'items_present',
          includedTruthRecordIds: ['prior-level-of-care.test.php'],
          omittedTruthRecordIds: [],
          relationshipToTruth: 'aligned',
        },
      ],
      singletonStatements: [],
      resolution: authoredResolution,
    },
  };
};

describe('D-212 structured patient-state reveal projection foundation', () => {
  it('groups a complete treatment history while retaining every typed lane and record ID', () => {
    const envelope =
      StructuredPatientStateRevealProjectionEnvelopeSchema.parse(makeFullHistoryEnvelope());

    expect(envelope.resolved.laneStatements.map((statement) => statement.lane)).toEqual([
      'medication_trials',
      'psychotherapy_trials',
      'current_treatment_providers',
      'prior_levels_of_care',
    ]);
    expect(
      envelope.resolved.laneStatements.flatMap((statement) => statement.includedTruthRecordIds),
    ).toEqual([
      'medication-trial.test.fluoxetine',
      'psychotherapy-trial.test.cbt',
      'treatment-provider.test.therapist',
      'prior-level-of-care.test.php',
    ]);
  });

  it('keeps objective exposure truth separate when a patient reports no use', () => {
    const patientState = ResolvedPatientStateSchema.parse(makePatientState());
    const definition = makeDefinition({
      id: 'structured-reveal-definition.test.substance-history',
      label: 'Substance-use history',
      informationActionId: 'info.history.substance-use',
      informationActionPayloadFingerprint:
        'fingerprint.information-action.substance-use.fnv1a64.0123456789abcdef',
      lanes: ['exposure_use_entries'],
    });
    const envelope = {
      definition,
      patientState,
      resolved: {
        schemaVersion: 1,
        id: 'structured-reveal.test.substance-history.patient-denial',
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
        claimOriginId: 'claim-origin.test.substance-history.patient',
        dependencyGroupIds: [],
        laneStatements: [
          {
            lane: 'exposure_use_entries',
            presentationStatus: 'none_reported',
            includedTruthRecordIds: [],
            omittedTruthRecordIds: ['exposure-use.test.cannabis'],
            relationshipToTruth: 'misaligned',
          },
        ],
        singletonStatements: [],
        resolution: authoredResolution,
      },
    } as const;

    const parsed = StructuredPatientStateRevealProjectionEnvelopeSchema.parse(envelope);
    expect(parsed.resolved.laneStatements[0]?.includedTruthRecordIds).toEqual([]);
    expect(parsed.resolved.laneStatements[0]?.omittedTruthRecordIds).toEqual([
      'exposure-use.test.cannabis',
    ]);
    expect(parsed.patientState.exposureInventory.useEntries[0]?.misuseTruth).toBe(false);
  });

  it('distinguishes a source-scoped explicit negative from an unassessed empty collection', () => {
    const patientState = makePatientState();
    patientState.exposureInventory.useEntries = [];
    const definition = makeDefinition({
      id: 'structured-reveal-definition.test.empty-substance-history',
      label: 'Substance-use history',
      informationActionId: 'info.history.substance-use',
      informationActionPayloadFingerprint:
        'fingerprint.information-action.substance-use.fnv1a64.0123456789abcdef',
      lanes: ['exposure_use_entries'],
    });
    const baseResolved = {
      schemaVersion: 1 as const,
      id: 'structured-reveal.test.empty-substance-history',
      definitionId: definition.id,
      definitionContentVersion: definition.contentVersion,
      informationActionId: definition.informationActionId,
      informationActionPayloadFingerprint: definition.informationActionPayloadFingerprint,
      patientStateId: patientState.id,
      source: {
        kind: 'patient_report' as const,
        sourceInstanceId: 'source-instance.test.patient',
      },
      timeScopeId: 'time-scope.longitudinal',
      claimOriginId: 'claim-origin.test.empty-substance-history',
      dependencyGroupIds: [],
      singletonStatements: [],
      resolution: authoredResolution,
    };
    const explicitNegative = {
      definition,
      patientState,
      resolved: {
        ...baseResolved,
        laneStatements: [
          {
            lane: 'exposure_use_entries',
            presentationStatus: 'none_reported',
            includedTruthRecordIds: [],
            omittedTruthRecordIds: [],
            relationshipToTruth: 'aligned',
          },
        ],
      },
    } as const;
    const unassessed = {
      definition,
      patientState,
      resolved: {
        ...baseResolved,
        id: 'structured-reveal.test.unassessed-substance-history',
        claimOriginId: 'claim-origin.test.unassessed-substance-history',
        laneStatements: [
          {
            lane: 'exposure_use_entries',
            presentationStatus: 'unassessed',
            includedTruthRecordIds: [],
            omittedTruthRecordIds: [],
            relationshipToTruth: 'indeterminate',
          },
        ],
      },
    } as const;

    expect(
      StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse(explicitNegative).success,
    ).toBe(true);
    expect(StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse(unassessed).success).toBe(
      true,
    );
    expect(explicitNegative.resolved.laneStatements).not.toEqual(
      unassessed.resolved.laneStatements,
    );
  });

  it('requires included and omitted IDs to exactly partition one closed truth lane', () => {
    const missing = structuredClone(makeFullHistoryEnvelope());
    missing.resolved.laneStatements[0]!.includedTruthRecordIds = [];
    missing.resolved.laneStatements[0]!.presentationStatus = 'none_reported';
    missing.resolved.laneStatements[0]!.relationshipToTruth = 'aligned';
    expect(StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse(missing).success).toBe(
      false,
    );

    const wrongLane = structuredClone(makeFullHistoryEnvelope());
    wrongLane.resolved.laneStatements[0]!.includedTruthRecordIds = ['psychotherapy-trial.test.cbt'];
    expect(StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse(wrongLane).success).toBe(
      false,
    );

    const duplicate = structuredClone(makeFullHistoryEnvelope());
    duplicate.resolved.laneStatements[0]!.omittedTruthRecordIds = [
      'medication-trial.test.fluoxetine',
    ];
    expect(StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse(duplicate).success).toBe(
      false,
    );
  });

  it('requires presentation status and alignment to match the explicit partition', () => {
    const emptyItemsPresent = structuredClone(makeFullHistoryEnvelope());
    emptyItemsPresent.resolved.laneStatements[0]!.includedTruthRecordIds = [];
    emptyItemsPresent.resolved.laneStatements[0]!.omittedTruthRecordIds = [
      'medication-trial.test.fluoxetine',
    ];
    expect(
      StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse(emptyItemsPresent).success,
    ).toBe(false);

    const partialButAligned = structuredClone(makeFullHistoryEnvelope());
    partialButAligned.patientState.medicationRegimenEntries =
      makePatientState().medicationRegimenEntries;
    partialButAligned.definition = makeDefinition({
      id: 'structured-reveal-definition.test.medication-reconciliation',
      label: 'Medication reconciliation',
      informationActionId: 'info.history.medication-reconciliation',
      informationActionPayloadFingerprint:
        'fingerprint.information-action.medication-reconciliation.fnv1a64.0123456789abcdef',
      lanes: ['medication_regimen_entries'],
    });
    partialButAligned.resolved.definitionId = partialButAligned.definition.id;
    partialButAligned.resolved.informationActionId =
      partialButAligned.definition.informationActionId;
    partialButAligned.resolved.informationActionPayloadFingerprint =
      partialButAligned.definition.informationActionPayloadFingerprint;
    partialButAligned.resolved.laneStatements = [
      {
        lane: 'medication_regimen_entries',
        presentationStatus: 'items_present',
        includedTruthRecordIds: ['regimen-entry.test.sertraline'],
        omittedTruthRecordIds: ['regimen-entry.test.levothyroxine'],
        relationshipToTruth: 'aligned',
      },
    ];
    expect(
      StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse(partialButAligned).success,
    ).toBe(false);
  });

  it('keeps reaction status explicit and consistent with the source-presented records', () => {
    const patientState = ResolvedPatientStateSchema.parse(makePatientState());
    const definition = makeDefinition({
      id: 'structured-reveal-definition.test.reactions',
      label: 'Allergies and adverse reactions',
      informationActionId: 'info.history.allergies-adverse-reactions',
      informationActionPayloadFingerprint:
        'fingerprint.information-action.reactions.fnv1a64.0123456789abcdef',
      lanes: ['reaction_records'],
      singletonFields: ['reaction_history_status'],
    });
    const envelope = {
      definition,
      patientState,
      resolved: {
        schemaVersion: 1,
        id: 'structured-reveal.test.reactions.patient',
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
        claimOriginId: 'claim-origin.test.reactions.patient',
        dependencyGroupIds: [],
        laneStatements: [
          {
            lane: 'reaction_records',
            presentationStatus: 'none_reported',
            includedTruthRecordIds: [],
            omittedTruthRecordIds: ['reaction-record.test.haloperidol'],
            relationshipToTruth: 'misaligned',
          },
        ],
        singletonStatements: [
          {
            field: 'reaction_history_status',
            truthValue: 'entries_present',
            presentedValue: 'documented_none',
            relationshipToTruth: 'misaligned',
          },
        ],
        resolution: authoredResolution,
      },
    } as const;
    expect(StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse(envelope).success).toBe(
      true,
    );

    const contradictory = {
      ...envelope,
      resolved: {
        ...envelope.resolved,
        singletonStatements: [
          {
            ...envelope.resolved.singletonStatements[0],
            presentedValue: 'entries_present',
            relationshipToTruth: 'aligned',
          },
        ],
      },
    } as const;
    expect(
      StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse(contradictory).success,
    ).toBe(false);
  });

  it('pins singleton truth and reserves uncertain or unassessed values for indeterminate views', () => {
    const patientState = ResolvedPatientStateSchema.parse(makePatientState());
    const definition = makeDefinition({
      id: 'structured-reveal-definition.test.safety-planning',
      label: 'Safety-planning ability',
      informationActionId: 'info.history.safety-planning-ability',
      informationActionPayloadFingerprint:
        'fingerprint.information-action.safety-planning.fnv1a64.0123456789abcdef',
      lanes: [],
      singletonFields: ['reported_safety_planning_ability'],
    });
    const envelope = {
      definition,
      patientState,
      resolved: {
        schemaVersion: 1,
        id: 'structured-reveal.test.safety-planning.patient',
        definitionId: definition.id,
        definitionContentVersion: definition.contentVersion,
        informationActionId: definition.informationActionId,
        informationActionPayloadFingerprint: definition.informationActionPayloadFingerprint,
        patientStateId: patientState.id,
        source: {
          kind: 'patient_report',
          sourceInstanceId: 'source-instance.test.patient',
        },
        timeScopeId: 'time-scope.current',
        claimOriginId: 'claim-origin.test.safety-planning.patient',
        dependencyGroupIds: [],
        laneStatements: [],
        singletonStatements: [
          {
            field: 'reported_safety_planning_ability',
            truthValue: 'reports_able',
            presentedValue: 'uncertain',
            relationshipToTruth: 'indeterminate',
          },
        ],
        resolution: authoredResolution,
      },
    } as const;
    expect(StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse(envelope).success).toBe(
      true,
    );

    const falseTruth = {
      ...envelope,
      resolved: {
        ...envelope.resolved,
        singletonStatements: [
          {
            ...envelope.resolved.singletonStatements[0],
            truthValue: 'reports_unable',
            presentedValue: 'reports_unable',
            relationshipToTruth: 'aligned',
          },
        ],
      },
    } as const;
    expect(StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse(falseTruth).success).toBe(
      false,
    );
  });

  it('pins definition, action fingerprint, source kind, and patient-state identity exactly', () => {
    const wrongAction = structuredClone(makeFullHistoryEnvelope());
    wrongAction.resolved.informationActionId = 'info.history.other';
    expect(
      StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse(wrongAction).success,
    ).toBe(false);

    const wrongFingerprint = structuredClone(makeFullHistoryEnvelope());
    wrongFingerprint.resolved.informationActionPayloadFingerprint =
      'fingerprint.information-action.other.fnv1a64.0123456789abcdef';
    expect(
      StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse(wrongFingerprint).success,
    ).toBe(false);

    const wrongSource = structuredClone(makeFullHistoryEnvelope());
    wrongSource.resolved.source.kind = 'record_review';
    expect(
      StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse(wrongSource).success,
    ).toBe(false);

    const wrongPatient = structuredClone(makeFullHistoryEnvelope());
    wrongPatient.resolved.patientStateId = 'resolved-patient-state.test.other';
    expect(
      StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse(wrongPatient).success,
    ).toBe(false);
  });

  it('rejects scoring, reliability, reveal state, and complexity accounting at this boundary', () => {
    const envelope = makeFullHistoryEnvelope();
    for (const field of [
      'points',
      'scorePredicate',
      'sourceReliability',
      'revealed',
      'complexityCost',
      'complexityBudget',
    ]) {
      expect(
        StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse({
          ...envelope,
          resolved: {
            ...envelope.resolved,
            [field]: field === 'revealed' ? true : 1,
          },
        }).success,
      ).toBe(false);
    }
  });
});
