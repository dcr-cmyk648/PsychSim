import {
  ResolvedPatientStateSchema,
  StructuredPatientStateRevealProjectionEnvelopeSchema,
  StructuredSourceReportCompileRequestSchema,
  StructuredSourceReportProfileSchema,
  type ClinicalRuleReview,
  type ResolvedPatientState,
  type StructuredPatientStateRevealDefinition,
  type StructuredSourceReportCompileRequest,
  type StructuredSourceReportLaneBehavior,
  type StructuredSourceReportProfile,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  compileStructuredSourceReports,
  fingerprintStructuredSourceReportDefinition,
  verifyStructuredSourceReportArtifactIntegrity,
} from './structured-source-report-compiler';

const authoredResolution = {
  origin: 'authored',
  ownerId: 'patient-template.test.source-report',
  ownerContentVersion: '1.0.0',
} as const;

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-29T12:00:00.000Z',
  sourceUseNoteIds: [],
};

const makePatientState = (): ResolvedPatientState =>
  ResolvedPatientStateSchema.parse({
    schemaVersion: 1,
    id: 'resolved-patient-state.test.source-report',
    demographics: {
      recordVersion: 2,
      ageYears: 48,
      reviewedAgeBandId: 'age-band.middle-adult',
      sexForReference: 'female',
    },
    conditionStates: [],
    diagnosisRecordEntries: [],
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
      id: 'resolved-exposure-inventory.test.source-report',
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
        {
          schemaVersion: 1,
          id: 'medication-trial.test.venlafaxine',
          medicationId: 'medication.venlafaxine',
          exposure: {
            duration: { value: 8, unit: 'week' },
            maximumDose: null,
          },
          adequacy: 'unclear',
          adherence: 'unknown',
          response: 'none',
          tolerability: 'unknown',
          source: 'outside_record',
          summary: 'An eight-week trial is documented.',
        },
      ],
      psychotherapyTrials: [],
      currentProviders: [],
      priorLevelsOfCare: [],
    },
    medicationTolerabilityFindings: [],
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
      id: 'resolved-proposition-state.test.source-report',
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    clinicalTagIds: [],
    reportedSafetyPlanningAbility: 'reports_able',
  });

const makeDefinition = (
  idSuffix: string,
  lanes: StructuredPatientStateRevealDefinition['lanes'],
  singletonFields: StructuredPatientStateRevealDefinition['singletonFields'] = [],
  allowedSourceKinds: StructuredPatientStateRevealDefinition['allowedSourceKinds'] = [
    'patient_report',
  ],
): StructuredPatientStateRevealDefinition => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: `structured-reveal-definition.test.${idSuffix}`,
  modelVersion: 'structured-patient-state-reveal.v1',
  label: `Test ${idSuffix}`,
  informationActionId: `info.history.test-${idSuffix}`,
  informationActionPayloadFingerprint: `fingerprint.information-action.${idSuffix}.fnv1a64.0123456789abcdef`,
  allowedSourceKinds,
  lanes,
  singletonFields,
  lifecycle: 'approved',
  review: approvedReview,
});

const makeProfile = (
  definition: StructuredPatientStateRevealDefinition,
  idSuffix: string,
  laneBehaviors: StructuredSourceReportLaneBehavior[],
  singletonBehaviors: StructuredSourceReportProfile['singletonBehaviors'] = [],
  overrides: Partial<StructuredSourceReportProfile> = {},
): StructuredSourceReportProfile =>
  StructuredSourceReportProfileSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `source-report-profile.test.${idSuffix}`,
    modelVersion: 'structured-source-report-profile.v1',
    label: `Test ${idSuffix}`,
    definitionRef: { id: definition.id, contentVersion: definition.contentVersion },
    definitionFingerprint: fingerprintStructuredSourceReportDefinition(definition),
    source: {
      kind: 'patient_report',
      sourceInstanceId: `source-instance.test.${idSuffix}`,
    },
    timeScopeId: 'time-scope.longitudinal',
    claimOriginId: `claim-origin.test.${idSuffix}`,
    dependencyGroupIds: [],
    laneBehaviors,
    singletonBehaviors,
    developerOpinionIds: ['developer-opinion.test.source-report'],
    lifecycle: 'approved',
    review: approvedReview,
    ...overrides,
  });

const makeRequest = (
  definitions: StructuredPatientStateRevealDefinition[],
  profiles: StructuredSourceReportProfile[],
  patientState = makePatientState(),
): StructuredSourceReportCompileRequest => ({
  schemaVersion: 1,
  id: 'structured-source-report-request.test',
  patientState,
  definitions,
  profiles,
});

const compileOrThrow = (request: StructuredSourceReportCompileRequest) => {
  const result = compileStructuredSourceReports(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('D-215 structured source-report compiler', () => {
  it('fans one frozen state out across complete populated and empty lanes', () => {
    const definition = makeDefinition('treatment-history', [
      'medication_trials',
      'psychotherapy_trials',
      'current_treatment_providers',
    ]);
    const profile = makeProfile(definition, 'treatment-history', [
      { lane: 'medication_trials', behavior: 'report_all' },
      { lane: 'psychotherapy_trials', behavior: 'report_all' },
      { lane: 'current_treatment_providers', behavior: 'report_all' },
    ]);
    const artifact = compileOrThrow(makeRequest([definition], [profile]));
    const recipe = artifact.projectionRecipes[0]!;

    expect(recipe.resolved.laneStatements).toEqual([
      {
        lane: 'current_treatment_providers',
        presentationStatus: 'none_reported',
        includedTruthRecordIds: [],
        omittedTruthRecordIds: [],
        relationshipToTruth: 'aligned',
      },
      {
        lane: 'medication_trials',
        presentationStatus: 'items_present',
        includedTruthRecordIds: [
          'medication-trial.test.fluoxetine',
          'medication-trial.test.venlafaxine',
        ],
        omittedTruthRecordIds: [],
        relationshipToTruth: 'aligned',
      },
      {
        lane: 'psychotherapy_trials',
        presentationStatus: 'none_reported',
        includedTruthRecordIds: [],
        omittedTruthRecordIds: [],
        relationshipToTruth: 'aligned',
      },
    ]);
    expect(
      StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse({
        definition: recipe.definition,
        patientState: artifact.compileRequest.patientState,
        resolved: recipe.resolved,
      }).success,
    ).toBe(true);
  });

  it.each([
    [
      'report_all',
      'items_present',
      ['medication-trial.test.fluoxetine', 'medication-trial.test.venlafaxine'],
      [],
      'aligned',
    ],
    [
      'none_reported',
      'none_reported',
      [],
      ['medication-trial.test.fluoxetine', 'medication-trial.test.venlafaxine'],
      'misaligned',
    ],
    [
      'unassessed',
      'unassessed',
      [],
      ['medication-trial.test.fluoxetine', 'medication-trial.test.venlafaxine'],
      'indeterminate',
    ],
    [
      'unable_to_assess',
      'unable_to_assess',
      [],
      ['medication-trial.test.fluoxetine', 'medication-trial.test.venlafaxine'],
      'indeterminate',
    ],
  ] as const)(
    'materializes populated-lane %s as one complete whole-lane report',
    (behavior, presentationStatus, includedTruthRecordIds, omittedTruthRecordIds, relation) => {
      const definition = makeDefinition(`populated-${behavior}`, ['medication_trials']);
      const profile = makeProfile(definition, `populated-${behavior}`, [
        { lane: 'medication_trials', behavior },
      ]);
      const statement = compileOrThrow(makeRequest([definition], [profile])).projectionRecipes[0]!
        .resolved.laneStatements[0]!;

      expect(statement).toEqual({
        lane: 'medication_trials',
        presentationStatus,
        includedTruthRecordIds,
        omittedTruthRecordIds,
        relationshipToTruth: relation,
      });
    },
  );

  it.each([
    ['report_all', 'none_reported', 'aligned'],
    ['none_reported', 'none_reported', 'aligned'],
    ['unassessed', 'unassessed', 'indeterminate'],
    ['unable_to_assess', 'unable_to_assess', 'indeterminate'],
  ] as const)(
    'preserves the distinction between empty-lane %s and source uncertainty',
    (behavior, presentationStatus, relation) => {
      const definition = makeDefinition(`empty-${behavior}`, ['psychotherapy_trials']);
      const profile = makeProfile(definition, `empty-${behavior}`, [
        { lane: 'psychotherapy_trials', behavior },
      ]);
      const statement = compileOrThrow(makeRequest([definition], [profile])).projectionRecipes[0]!
        .resolved.laneStatements[0]!;

      expect(statement).toEqual({
        lane: 'psychotherapy_trials',
        presentationStatus,
        includedTruthRecordIds: [],
        omittedTruthRecordIds: [],
        relationshipToTruth: relation,
      });
    },
  );

  it('supports typed singleton mirroring and explicit source-presented values', () => {
    const reactionDefinition = makeDefinition(
      'reactions',
      ['reaction_records'],
      ['reaction_history_status', 'medication_reaction_assessment_status'],
    );
    const safetyDefinition = makeDefinition(
      'safety-planning',
      [],
      ['reported_safety_planning_ability'],
    );
    const reactionProfile = makeProfile(
      reactionDefinition,
      'reactions',
      [{ lane: 'reaction_records', behavior: 'none_reported' }],
      [
        {
          field: 'reaction_history_status',
          presentation: { kind: 'present_value', value: 'documented_none' },
        },
        {
          field: 'medication_reaction_assessment_status',
          presentation: { kind: 'present_value', value: 'documented_none' },
        },
      ],
    );
    const safetyProfile = makeProfile(
      safetyDefinition,
      'safety-planning',
      [],
      [
        {
          field: 'reported_safety_planning_ability',
          presentation: { kind: 'mirror_truth' },
        },
      ],
    );
    const artifact = compileOrThrow(
      makeRequest([safetyDefinition, reactionDefinition], [safetyProfile, reactionProfile]),
    );

    expect(
      artifact.projectionRecipes.flatMap((recipe) => recipe.resolved.singletonStatements),
    ).toEqual(
      expect.arrayContaining([
        {
          field: 'reaction_history_status',
          truthValue: 'entries_present',
          presentedValue: 'documented_none',
          relationshipToTruth: 'misaligned',
        },
        {
          field: 'medication_reaction_assessment_status',
          truthValue: 'entries_present',
          presentedValue: 'documented_none',
          relationshipToTruth: 'misaligned',
        },
        {
          field: 'reported_safety_planning_ability',
          truthValue: 'reports_able',
          presentedValue: 'reports_able',
          relationshipToTruth: 'aligned',
        },
      ]),
    );
  });

  it('projects every remaining closed D-212 lane without inventing a record', () => {
    const patientState = makePatientState();
    patientState.diagnosisRecordEntries = [
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
    ];
    patientState.treatmentHistory.priorLevelsOfCare = [
      {
        schemaVersion: 1,
        id: 'prior-level-of-care.test.php',
        level: 'partial_hospitalization',
        occurrenceCount: 1,
        source: 'patient_report',
        summary: 'One prior partial-hospitalization episode.',
      },
    ];
    patientState.medicationTolerabilityFindings = [
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
    ];
    const definition = makeDefinition('remaining-lanes', [
      'diagnosis_record_entries',
      'medication_regimen_entries',
      'prior_levels_of_care',
      'medication_tolerability_findings',
    ]);
    const profile = makeProfile(definition, 'remaining-lanes', [
      { lane: 'diagnosis_record_entries', behavior: 'report_all' },
      { lane: 'medication_regimen_entries', behavior: 'report_all' },
      { lane: 'prior_levels_of_care', behavior: 'report_all' },
      { lane: 'medication_tolerability_findings', behavior: 'report_all' },
    ]);
    const statements = compileOrThrow(makeRequest([definition], [profile], patientState))
      .projectionRecipes[0]!.resolved.laneStatements;

    expect(statements.map((statement) => statement.includedTruthRecordIds)).toEqual([
      ['diagnosis-record.test.depression-history'],
      ['regimen-entry.test.sertraline'],
      ['tolerability-finding.test.sertraline-sexual'],
      ['prior-level-of-care.test.php'],
    ]);
  });

  it('allows a genuinely unassessed reaction lane to remain unavailable to assess', () => {
    const patientState = makePatientState();
    patientState.reactionHistory = {
      status: 'unassessed',
      medicationAssessmentStatus: 'unassessed',
      records: [],
    };
    const definition = makeDefinition(
      'unassessed-reactions',
      ['reaction_records'],
      ['reaction_history_status'],
    );
    const profile = makeProfile(
      definition,
      'unassessed-reactions',
      [{ lane: 'reaction_records', behavior: 'unable_to_assess' }],
      [
        {
          field: 'reaction_history_status',
          presentation: { kind: 'mirror_truth' },
        },
      ],
    );
    const recipe = compileOrThrow(makeRequest([definition], [profile], patientState))
      .projectionRecipes[0]!;

    expect(recipe.resolved.laneStatements[0]).toMatchObject({
      presentationStatus: 'unable_to_assess',
      relationshipToTruth: 'indeterminate',
    });
    expect(recipe.resolved.singletonStatements[0]).toMatchObject({
      truthValue: 'unassessed',
      presentedValue: 'unassessed',
      relationshipToTruth: 'indeterminate',
    });
  });

  it('keeps a documented-none reaction history explicitly negative and aligned', () => {
    const patientState = makePatientState();
    patientState.reactionHistory = {
      status: 'documented_none',
      medicationAssessmentStatus: 'documented_none',
      records: [],
    };
    const definition = makeDefinition(
      'documented-none-reactions',
      ['reaction_records'],
      ['reaction_history_status'],
    );
    const profile = makeProfile(
      definition,
      'documented-none-reactions',
      [{ lane: 'reaction_records', behavior: 'report_all' }],
      [
        {
          field: 'reaction_history_status',
          presentation: { kind: 'mirror_truth' },
        },
      ],
    );
    const recipe = compileOrThrow(makeRequest([definition], [profile], patientState))
      .projectionRecipes[0]!;

    expect(recipe.resolved.laneStatements[0]).toEqual({
      lane: 'reaction_records',
      presentationStatus: 'none_reported',
      includedTruthRecordIds: [],
      omittedTruthRecordIds: [],
      relationshipToTruth: 'aligned',
    });
    expect(recipe.resolved.singletonStatements[0]).toMatchObject({
      truthValue: 'documented_none',
      presentedValue: 'documented_none',
      relationshipToTruth: 'aligned',
    });
  });

  it('rejects stale definitions, disallowed sources, and incomplete behavior coverage', () => {
    const definition = makeDefinition('validation', ['medication_trials', 'psychotherapy_trials']);
    const baseProfile = makeProfile(definition, 'validation', [
      { lane: 'medication_trials', behavior: 'report_all' },
      { lane: 'psychotherapy_trials', behavior: 'report_all' },
    ]);

    const staleFingerprint = baseProfile.definitionFingerprint.endsWith('0')
      ? `${baseProfile.definitionFingerprint.slice(0, -1)}1`
      : `${baseProfile.definitionFingerprint.slice(0, -1)}0`;
    const stale = compileStructuredSourceReports(
      makeRequest([definition], [{ ...baseProfile, definitionFingerprint: staleFingerprint }]),
    );
    expect(stale).toMatchObject({
      ok: false,
      error: { code: 'STALE_DEFINITION_FINGERPRINT' },
    });

    const disallowed = compileStructuredSourceReports(
      makeRequest(
        [definition],
        [
          {
            ...baseProfile,
            source: {
              kind: 'collateral_report',
              sourceInstanceId: 'source-instance.test.collateral',
            },
          },
        ],
      ),
    );
    expect(disallowed).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_KIND_NOT_ALLOWED' },
    });

    const incomplete = compileStructuredSourceReports(
      makeRequest(
        [definition],
        [
          {
            ...baseProfile,
            laneBehaviors: [{ lane: 'medication_trials', behavior: 'report_all' }],
          },
        ],
      ),
    );
    expect(incomplete).toMatchObject({
      ok: false,
      error: { code: 'BEHAVIOR_COVERAGE_MISMATCH' },
    });

    const duplicateView = {
      ...baseProfile,
      id: 'source-report-profile.test.validation-duplicate',
      label: 'Duplicate source view',
    };
    expect(
      StructuredSourceReportCompileRequestSchema.safeParse(
        makeRequest([definition], [baseProfile, duplicateView]),
      ).success,
    ).toBe(false);
  });

  it('strictly rejects probability, partial-record, complexity, and point fields', () => {
    const definition = makeDefinition('strict', ['medication_trials']);
    const profile = makeProfile(definition, 'strict', [
      { lane: 'medication_trials', behavior: 'report_all' },
    ]);

    for (const extra of [
      { probability: 0.9 },
      { selectionWeight: 4 },
      { includedRecordIds: ['medication-trial.test.fluoxetine'] },
      { complexityCost: 1 },
      { pointDelta: 10 },
    ]) {
      expect(
        StructuredSourceReportProfileSchema.safeParse({
          ...profile,
          ...extra,
        }).success,
      ).toBe(false);
    }

    expect(
      StructuredSourceReportCompileRequestSchema.safeParse({
        ...makeRequest([definition], [profile]),
        complexityBudget: 3,
      }).success,
    ).toBe(false);
  });

  it('normalizes unordered inputs, replays identically, and detects tampering', () => {
    const treatmentDefinition = makeDefinition('determinism-treatment', [
      'medication_trials',
      'psychotherapy_trials',
    ]);
    const exposureDefinition = makeDefinition('determinism-exposure', ['exposure_use_entries']);
    const treatmentProfile = makeProfile(
      treatmentDefinition,
      'determinism-treatment',
      [
        { lane: 'psychotherapy_trials', behavior: 'report_all' },
        { lane: 'medication_trials', behavior: 'report_all' },
      ],
      [],
      { dependencyGroupIds: ['dependency.test.b', 'dependency.test.a'] },
    );
    const exposureProfile = makeProfile(exposureDefinition, 'determinism-exposure', [
      { lane: 'exposure_use_entries', behavior: 'report_all' },
    ]);
    const first = compileOrThrow(
      makeRequest([treatmentDefinition, exposureDefinition], [treatmentProfile, exposureProfile]),
    );
    const second = compileOrThrow(
      makeRequest([exposureDefinition, treatmentDefinition], [exposureProfile, treatmentProfile]),
    );

    expect(second).toEqual(first);
    const reorderedPatient = makePatientState();
    reorderedPatient.medicationRegimenEntries.reverse();
    reorderedPatient.exposureInventory.useEntries.reverse();
    reorderedPatient.treatmentHistory.medicationTrials.reverse();
    const reordered = compileOrThrow(
      makeRequest(
        [exposureDefinition, treatmentDefinition],
        [exposureProfile, treatmentProfile],
        reorderedPatient,
      ),
    );
    expect(reordered).toEqual(first);

    const changedPatient = makePatientState();
    changedPatient.reportedSafetyPlanningAbility = 'reports_unable';
    const changed = compileOrThrow(
      makeRequest(
        [treatmentDefinition, exposureDefinition],
        [treatmentProfile, exposureProfile],
        changedPatient,
      ),
    );
    expect(changed.patientStateId).toBe(first.patientStateId);
    expect(changed.patientStateFingerprint).not.toBe(first.patientStateFingerprint);
    expect(changed.projectionRecipes[0]!.resolved.id).not.toBe(
      first.projectionRecipes[0]!.resolved.id,
    );
    expect(changed.id).not.toBe(first.id);

    expect(verifyStructuredSourceReportArtifactIntegrity(first)).toEqual({
      ok: true,
      value: first,
    });

    const tampered = structuredClone(first);
    tampered.projectionRecipes[0]!.resolved.claimOriginId = 'claim-origin.test.tampered';
    expect(verifyStructuredSourceReportArtifactIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });
  });

  it('contains no optional-complexity, action-cost, scoring, or economy authority', () => {
    const definition = makeDefinition('isolation', ['medication_trials', 'psychotherapy_trials']);
    const profile = makeProfile(definition, 'isolation', [
      { lane: 'medication_trials', behavior: 'report_all' },
      { lane: 'psychotherapy_trials', behavior: 'report_all' },
    ]);
    const serialized = JSON.stringify(compileOrThrow(makeRequest([definition], [profile])));

    for (const forbidden of [
      'complexityBudget',
      'complexityCost',
      'totalSpent',
      'remainingBudget',
      'pointDelta',
      'operatingCost',
      'clinicalScore',
      'settlement',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
