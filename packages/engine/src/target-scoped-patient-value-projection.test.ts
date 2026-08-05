import {
  FrozenTargetScopedPatientValueRevealSchema,
  ResolvedPatientStateSchema,
  TargetScopedPatientValueSourceValidationArtifactSchema,
  type ClinicalRuleReview,
  type InformationActionDefinition,
  type ResolvedPatientState,
  type TargetScopedPatientValueProjectionCompileRequest,
  type TargetScopedPatientValueProjectionDefinition,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  compileTargetScopedPatientValueProjections,
  verifyTargetScopedPatientValueProjectionArtifactIntegrity,
} from './target-scoped-patient-value-projection';
import {
  validateTargetScopedPatientValueSources,
  verifyTargetScopedPatientValueSourceValidationIntegrity,
} from './target-scoped-patient-value-source-validation';
import { fingerprintInformationActionPayload } from './universal-action-result-compiler';
import { compilePatientSceneSourceInstances } from './patient-scene-source-instance-compiler';

const authoredResolution = {
  origin: 'authored',
  ownerId: 'patient-template.test.target-scoped-values',
  ownerContentVersion: '1.0.0',
} as const;

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-30T12:00:00.000Z',
  sourceUseNoteIds: [],
};

const makeAction = (
  id: string,
  resultSource: InformationActionDefinition['resultSource'] = 'patient_report',
): InformationActionDefinition => ({
  id,
  label: id,
  searchAliases: [`${id} alias`],
  category: 'history',
  soapSection: 'subjective',
  resultSource,
  description: `Neutral description for ${id}.`,
  serviceId: 'service.basic-history',
  repeatable: false,
});

const presentingAction = makeAction('info.history.presenting-problem');
const findingAction = makeAction('info.history.symptom-detail');
const recordsAction = makeAction('info.records.outside-history', 'record_review');

const makePatientState = (
  sourceInstanceIds: {
    readonly patientReport: string;
    readonly recordReview: string;
  } = {
    patientReport: 'source-instance.patient.test',
    recordReview: 'source-instance.record.test',
  },
): ResolvedPatientState =>
  ResolvedPatientStateSchema.parse({
    schemaVersion: 1,
    id: 'resolved-patient-state.test.target-scoped-values',
    demographics: {
      recordVersion: 2,
      ageYears: 39,
      reviewedAgeBandId: 'age-band.adult',
      sexForReference: 'female',
    },
    conditionStates: [
      {
        schemaVersion: 1,
        id: 'condition-state.test.mdd',
        diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
        diagnosisDefinitionContentVersion: '1.3.0',
        clinicalStateId: 'clinical-state.current-episode',
        timeScopeId: 'time-scope.current',
        encounterRelevance: 'focus',
        severityId: null,
        specifierIds: [],
        origin: 'authored',
        resolution: authoredResolution,
      },
    ],
    diagnosisRecordEntries: [],
    medicationRegimenEntries: [],
    exposureInventory: {
      schemaVersion: 1,
      id: 'exposure-inventory.test.target-scoped-values',
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
    canonicalFindings: [
      {
        schemaVersion: 1,
        id: 'canonical-finding.test.fatigue',
        definitionId: 'finding.fatigue-low-energy',
        definitionContentVersion: '1.0.0',
        value: { kind: 'outcome', value: 'present' },
        resolution: {
          resolverVersion: '1.0.0',
          origin: 'authored',
          uncertainty: 'none',
          appliedContributionIds: ['finding-contribution.test.fatigue'],
        },
        contributions: [
          {
            schemaVersion: 1,
            id: 'finding-contribution.test.fatigue',
            ownerKind: 'patient_state',
            ownerId: 'resolved-patient-state.test.target-scoped-values',
            ownerContentVersion: null,
            role: 'authored_value',
            provenanceIds: [],
          },
        ],
      },
    ],
    measurements: [],
    categoricalObservations: [],
    structuredTestResults: [],
    clinicalContexts: [],
    clinicalDurations: [
      {
        schemaVersion: 1,
        id: 'clinical-duration.test.mdd',
        target: {
          kind: 'condition_state',
          conditionStateId: 'condition-state.test.mdd',
        },
        value: 9,
        unit: 'week',
        durationProfileId: 'duration-profile.mdd.current-episode',
        durationProfileContentVersion: '1.0.0',
        durationOptionId: 'duration-option.mdd.nine-weeks',
        relatedDiagnosisId: 'diagnosis.major-depressive-disorder',
        interpretation: 'supports_authored_state',
        criterionId: null,
        source: {
          kind: 'patient_report',
          sourceInstanceId: sourceInstanceIds.patientReport,
        },
        timeScopeId: 'time-scope.current',
        resolution: authoredResolution,
      },
      {
        schemaVersion: 1,
        id: 'clinical-duration.test.fatigue',
        target: {
          kind: 'canonical_finding',
          canonicalFindingId: 'canonical-finding.test.fatigue',
        },
        value: 5,
        unit: 'week',
        durationProfileId: 'duration-profile.finding.fatigue',
        durationProfileContentVersion: '1.0.0',
        durationOptionId: 'duration-option.finding.five-weeks',
        relatedDiagnosisId: null,
        interpretation: 'context_only',
        criterionId: null,
        source: {
          kind: 'patient_report',
          sourceInstanceId: sourceInstanceIds.patientReport,
        },
        timeScopeId: 'time-scope.current',
        resolution: authoredResolution,
      },
      {
        schemaVersion: 1,
        id: 'clinical-duration.test.proposition',
        target: {
          kind: 'latent_proposition',
          propositionId: 'proposition.test.work-change',
        },
        value: 2,
        unit: 'month',
        durationProfileId: 'duration-profile.proposition.work-change',
        durationProfileContentVersion: '1.0.0',
        durationOptionId: 'duration-option.proposition.two-months',
        relatedDiagnosisId: null,
        interpretation: 'context_only',
        criterionId: null,
        source: {
          kind: 'record_review',
          sourceInstanceId: sourceInstanceIds.recordReview,
        },
        timeScopeId: 'time-scope.recent',
        resolution: authoredResolution,
      },
    ],
    functionalImpairments: [
      {
        schemaVersion: 1,
        id: 'condition-functional-impairment.test.mdd',
        target: {
          kind: 'condition_state',
          conditionStateId: 'condition-state.test.mdd',
        },
        attribution: 'condition_attributed',
        level: 'moderate',
        functionalImpairmentProfileId: 'functional-impairment-profile.mdd.current-episode',
        functionalImpairmentProfileContentVersion: '1.0.0',
        functionalImpairmentOptionId: 'functional-impairment-option.mdd.moderate',
        relatedDiagnosisId: 'diagnosis.major-depressive-disorder',
        source: {
          kind: 'patient_report',
          sourceInstanceId: sourceInstanceIds.patientReport,
        },
        timeScopeId: 'time-scope.current',
        resolution: authoredResolution,
      },
    ],
    subjectiveBurdenRecords: [
      {
        schemaVersion: 1,
        id: 'subjective-burden.test.fatigue',
        target: {
          kind: 'canonical_finding',
          canonicalFindingId: 'canonical-finding.test.fatigue',
        },
        ordinalScaleId: 'ordinal-scale.bothersomeness',
        ordinalScaleContentVersion: '1.0.0',
        ordinalValueId: 'ordinal-value.extremely',
        source: {
          kind: 'patient_report',
          sourceInstanceId: sourceInstanceIds.patientReport,
        },
        timeScopeId: 'time-scope.current',
        resolution: authoredResolution,
      },
    ],
    propositionState: {
      schemaVersion: 1,
      id: 'proposition-state.test.target-scoped-values',
      propositions: [
        {
          schemaVersion: 1,
          id: 'proposition.test.work-change',
          definitionId: 'proposition-definition.work-change',
          definitionContentVersion: '1.0.0',
          auditStatement: 'A work change occurred.',
          truth: true,
          resolution: authoredResolution,
        },
      ],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    clinicalTagIds: [],
    reportedSafetyPlanningAbility: 'unassessed',
  });

const durationDefinition = (
  id: string,
  action: InformationActionDefinition,
  overrides: Partial<TargetScopedPatientValueProjectionDefinition> = {},
): TargetScopedPatientValueProjectionDefinition =>
  ({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id,
    modelVersion: 'target-scoped-patient-value-projection.v1',
    label: id,
    informationActionId: action.id,
    informationActionPayloadFingerprint: fingerprintInformationActionPayload(action),
    valueKind: 'clinical_duration',
    durationProfileId: 'duration-profile.mdd.current-episode',
    durationProfileContentVersion: '1.0.0',
    targetSelector: {
      kind: 'condition_definition',
      diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
      diagnosisDefinitionContentVersion: '1.3.0',
    },
    sourceKind: 'patient_report',
    timeScopeId: 'time-scope.current',
    lifecycle: 'approved',
    review: approvedReview,
    ...overrides,
  }) as TargetScopedPatientValueProjectionDefinition;

const burdenDefinition = (
  id: string,
  action: InformationActionDefinition,
  overrides: Partial<TargetScopedPatientValueProjectionDefinition> = {},
): TargetScopedPatientValueProjectionDefinition =>
  ({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id,
    modelVersion: 'target-scoped-patient-value-projection.v1',
    label: id,
    informationActionId: action.id,
    informationActionPayloadFingerprint: fingerprintInformationActionPayload(action),
    valueKind: 'subjective_burden',
    ordinalScaleId: 'ordinal-scale.bothersomeness',
    ordinalScaleContentVersion: '1.0.0',
    targetSelector: {
      kind: 'finding_definition',
      findingDefinitionId: 'finding.fatigue-low-energy',
      findingDefinitionContentVersion: '1.0.0',
    },
    sourceKind: 'patient_report',
    timeScopeId: 'time-scope.current',
    lifecycle: 'approved',
    review: approvedReview,
    ...overrides,
  }) as TargetScopedPatientValueProjectionDefinition;

const impairmentDefinition = (
  id: string,
  action: InformationActionDefinition,
  overrides: Partial<TargetScopedPatientValueProjectionDefinition> = {},
): TargetScopedPatientValueProjectionDefinition =>
  ({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id,
    modelVersion: 'target-scoped-patient-value-projection.v1',
    label: id,
    informationActionId: action.id,
    informationActionPayloadFingerprint: fingerprintInformationActionPayload(action),
    valueKind: 'condition_functional_impairment',
    functionalImpairmentProfileId: 'functional-impairment-profile.mdd.current-episode',
    functionalImpairmentProfileContentVersion: '1.0.0',
    targetSelector: {
      kind: 'condition_definition',
      diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
      diagnosisDefinitionContentVersion: '1.3.0',
    },
    sourceKind: 'patient_report',
    timeScopeId: 'time-scope.current',
    lifecycle: 'approved',
    review: approvedReview,
    ...overrides,
  }) as TargetScopedPatientValueProjectionDefinition;

const propositionDefinition = (
  id: string,
  action: InformationActionDefinition,
): TargetScopedPatientValueProjectionDefinition => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id,
  modelVersion: 'target-scoped-patient-value-projection.v1',
  label: id,
  informationActionId: action.id,
  informationActionPayloadFingerprint: fingerprintInformationActionPayload(action),
  valueKind: 'clinical_duration',
  durationProfileId: 'duration-profile.proposition.work-change',
  durationProfileContentVersion: '1.0.0',
  targetSelector: {
    kind: 'proposition_definition',
    propositionDefinitionId: 'proposition-definition.work-change',
    propositionDefinitionContentVersion: '1.0.0',
  },
  sourceKind: 'record_review',
  timeScopeId: 'time-scope.recent',
  lifecycle: 'approved',
  review: approvedReview,
});

const makeRequest = (
  definitions: TargetScopedPatientValueProjectionDefinition[],
  informationActions: InformationActionDefinition[],
  patientState = makePatientState(),
): TargetScopedPatientValueProjectionCompileRequest => ({
  schemaVersion: 1,
  id: 'target-scoped-patient-value-request.test',
  patientState,
  informationActions,
  definitions,
});

const compileOrThrow = (request: TargetScopedPatientValueProjectionCompileRequest) => {
  const result = compileTargetScopedPatientValueProjections(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const compileSourceHorizon = (
  patientStateId = 'resolved-patient-state.test.target-scoped-values',
  sourceKinds: readonly ('patient_report' | 'record_review')[] = [
    'patient_report',
    'record_review',
  ],
) => {
  const result = compilePatientSceneSourceInstances({
    schemaVersion: 1,
    id: `patient-scene-source-instance-request.test.target-scoped.${patientStateId}`,
    patientStateId,
    definitions: sourceKinds.map((kind) => ({
      schemaVersion: 1 as const,
      contentVersion: '1.0.0',
      id: `patient-scene-source-definition.test.target-scoped.${kind}`,
      kind,
    })),
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const sourceInstanceId = (
  horizon: ReturnType<typeof compileSourceHorizon>,
  kind: 'patient_report' | 'record_review',
): string => {
  const instance = horizon.sourceInstances.find((candidate) => candidate.kind === kind);
  if (!instance) throw new Error(`Expected ${kind} source instance.`);
  return instance.id;
};

describe('D-240 target-scoped patient-value projection compiler', () => {
  it('projects exact condition, finding, and proposition duration, burden, and impairment values', () => {
    const definitions = [
      durationDefinition('target-scoped-definition.test.mdd-duration', presentingAction),
      impairmentDefinition('target-scoped-definition.test.mdd-impairment', presentingAction),
      durationDefinition('target-scoped-definition.test.fatigue-duration', findingAction, {
        durationProfileId: 'duration-profile.finding.fatigue',
        durationProfileContentVersion: '1.0.0',
        targetSelector: {
          kind: 'finding_definition',
          findingDefinitionId: 'finding.fatigue-low-energy',
          findingDefinitionContentVersion: '1.0.0',
        },
      }),
      burdenDefinition('target-scoped-definition.test.fatigue-burden', findingAction),
      propositionDefinition('target-scoped-definition.test.proposition-duration', recordsAction),
    ];
    const artifact = compileOrThrow(
      makeRequest(definitions, [recordsAction, findingAction, presentingAction]),
    );

    expect(artifact.evaluations.map((evaluation) => evaluation.status)).toEqual([
      'complete',
      'complete',
      'complete',
      'complete',
      'complete',
    ]);
    expect(artifact.projections.flatMap((projection) => projection.values)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'clinical_duration',
          recordId: 'clinical-duration.test.mdd',
          value: 9,
          unit: 'week',
          durationProfileId: 'duration-profile.mdd.current-episode',
          durationProfileContentVersion: '1.0.0',
          durationOptionId: 'duration-option.mdd.nine-weeks',
        }),
        expect.objectContaining({
          kind: 'subjective_burden',
          recordId: 'subjective-burden.test.fatigue',
          ordinalValueId: 'ordinal-value.extremely',
        }),
        expect.objectContaining({
          kind: 'condition_functional_impairment',
          recordId: 'condition-functional-impairment.test.mdd',
          level: 'moderate',
          functionalImpairmentProfileId: 'functional-impairment-profile.mdd.current-episode',
          functionalImpairmentProfileContentVersion: '1.0.0',
          functionalImpairmentOptionId: 'functional-impairment-option.mdd.moderate',
        }),
      ]),
    );

    const frozenValues = artifact.frozenReveals.flatMap((reveal) => reveal.values);
    expect(frozenValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'clinical_duration',
          value: 9,
          unit: 'week',
          sourceKind: 'patient_report',
        }),
        expect.objectContaining({
          kind: 'subjective_burden',
          ordinalValueId: 'ordinal-value.extremely',
        }),
        expect.objectContaining({
          kind: 'condition_functional_impairment',
          level: 'moderate',
          sourceKind: 'patient_report',
          timeScopeId: 'time-scope.current',
        }),
      ]),
    );
    const frozenImpairment = frozenValues.find(
      (value) => value.kind === 'condition_functional_impairment',
    );
    expect(frozenImpairment).toBeDefined();
    expect(JSON.stringify(frozenImpairment)).not.toContain('sourceInstanceId');
    expect(JSON.stringify(frozenImpairment)).not.toContain('functionalImpairmentProfile');
    expect(JSON.stringify(frozenImpairment)).not.toContain('functionalImpairmentOption');
    expect(JSON.stringify(frozenValues)).not.toContain('condition-state');
    expect(JSON.stringify(frozenValues)).not.toContain('canonical-finding');
    expect(JSON.stringify(frozenValues)).not.toContain('proposition.test');
    expect(JSON.stringify(frozenValues)).toContain('source-instance');
    expect(JSON.stringify(frozenValues)).not.toContain('duration-profile');
    expect(JSON.stringify(frozenValues)).not.toContain('interpretation');
  });

  it('distinguishes absent targets from missing values at an existing target', () => {
    const absentTarget = durationDefinition(
      'target-scoped-definition.test.absent-target',
      presentingAction,
      {
        targetSelector: {
          kind: 'condition_definition',
          diagnosisDefinitionId: 'diagnosis.bipolar-i-disorder',
          diagnosisDefinitionContentVersion: '1.0.0',
        },
      },
    );
    const missingSource = durationDefinition(
      'target-scoped-definition.test.missing-source',
      findingAction,
      {
        sourceKind: 'collateral_report',
      },
    );
    const artifact = compileOrThrow(
      makeRequest([absentTarget, missingSource], [findingAction, presentingAction]),
    );

    expect(
      Object.fromEntries(
        artifact.evaluations.map((evaluation) => [evaluation.definitionId, evaluation.status]),
      ),
    ).toEqual({
      'target-scoped-definition.test.absent-target': 'not_applicable',
      'target-scoped-definition.test.missing-source': 'missing_required_value',
    });
    expect(artifact.projections).toHaveLength(0);
    expect(artifact.frozenReveals).toHaveLength(0);
  });

  it('requires exact target versions, source/time scopes, and semantic owners', () => {
    const definitions = [
      durationDefinition('target-scoped-definition.test.wrong-version', presentingAction, {
        targetSelector: {
          kind: 'condition_definition',
          diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
          diagnosisDefinitionContentVersion: '9.9.9',
        },
      }),
      durationDefinition('target-scoped-definition.test.wrong-time', findingAction, {
        timeScopeId: 'time-scope.longitudinal',
      }),
      durationDefinition('target-scoped-definition.test.wrong-profile', recordsAction, {
        durationProfileId: 'duration-profile.other',
        durationProfileContentVersion: '1.0.0',
      }),
      durationDefinition(
        'target-scoped-definition.test.wrong-profile-content-version',
        presentingAction,
        {
          durationProfileContentVersion: '2.0.0',
        },
      ),
      impairmentDefinition(
        'target-scoped-definition.test.wrong-impairment-profile',
        presentingAction,
        {
          functionalImpairmentProfileId: 'functional-impairment-profile.other',
        },
      ),
    ];
    const artifact = compileOrThrow(
      makeRequest(definitions, [presentingAction, findingAction, recordsAction]),
    );
    expect(
      Object.fromEntries(
        artifact.evaluations.map((evaluation) => [evaluation.definitionId, evaluation.status]),
      ),
    ).toEqual({
      'target-scoped-definition.test.wrong-profile': 'missing_required_value',
      'target-scoped-definition.test.wrong-profile-content-version': 'missing_required_value',
      'target-scoped-definition.test.wrong-impairment-profile': 'missing_required_value',
      'target-scoped-definition.test.wrong-time': 'missing_required_value',
      'target-scoped-definition.test.wrong-version': 'not_applicable',
    });
  });

  it('rejects a non-condition selector for condition-attributed functional impairment', () => {
    const invalid = impairmentDefinition(
      'target-scoped-definition.test.invalid-impairment-target',
      findingAction,
      {
        targetSelector: {
          kind: 'finding_definition',
          findingDefinitionId: 'finding.fatigue-low-energy',
          findingDefinitionContentVersion: '1.0.0',
        },
      },
    );
    expect(
      compileTargetScopedPatientValueProjections(makeRequest([invalid], [findingAction])),
    ).toMatchObject({
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: expect.stringContaining(
          'condition-functional-impairment projection must select one exact condition definition',
        ),
      },
    });
  });

  it('rejects a stale information-action payload fingerprint', () => {
    const definition = durationDefinition(
      'target-scoped-definition.test.stale-action',
      presentingAction,
      {
        informationActionPayloadFingerprint:
          'fingerprint.information-action.stale.fnv1a64.0000000000000000',
      },
    );
    const result = compileTargetScopedPatientValueProjections(
      makeRequest([definition], [presentingAction]),
    );
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'ACTION_PAYLOAD_FINGERPRINT_MISMATCH' },
    });
  });

  it('keeps unreviewed projection definitions nonexecutable', () => {
    const definition = durationDefinition(
      'target-scoped-definition.test.unreviewed',
      presentingAction,
      {
        lifecycle: 'review',
        review: {
          status: 'in_review',
          reviewerId: null,
          reviewedAt: null,
          sourceUseNoteIds: [],
        },
      },
    );
    expect(
      compileTargetScopedPatientValueProjections(makeRequest([definition], [presentingAction])),
    ).toMatchObject({
      ok: false,
      error: { code: 'UNAPPROVED_DEFINITION' },
    });
  });

  it('rejects overlapping definitions instead of projecting one record twice', () => {
    const result = compileTargetScopedPatientValueProjections(
      makeRequest(
        [
          durationDefinition('target-scoped-definition.test.overlap-a', presentingAction),
          durationDefinition('target-scoped-definition.test.overlap-b', presentingAction),
        ],
        [presentingAction],
      ),
    );
    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'OVERLAPPING_RECORD_PROJECTION',
        contentIds: expect.arrayContaining(['clinical-duration.test.mdd']),
      },
    });
  });

  it('permits explicit reuse through different actions but rejects ambiguous target instances', () => {
    const reused = compileOrThrow(
      makeRequest(
        [
          durationDefinition('target-scoped-definition.test.reuse-a', presentingAction),
          durationDefinition('target-scoped-definition.test.reuse-b', findingAction),
        ],
        [presentingAction, findingAction],
      ),
    );
    expect(reused.projections).toHaveLength(2);

    const patientState = makePatientState();
    const ambiguousState = ResolvedPatientStateSchema.parse({
      ...patientState,
      conditionStates: [
        ...patientState.conditionStates,
        {
          ...patientState.conditionStates[0]!,
          id: 'condition-state.test.mdd.second-instance',
          clinicalStateId: 'clinical-state.historical-episode',
          timeScopeId: 'time-scope.historical',
          encounterRelevance: 'background',
        },
      ],
    });
    const ambiguous = compileOrThrow(
      makeRequest(
        [durationDefinition('target-scoped-definition.test.ambiguous-condition', presentingAction)],
        [presentingAction],
        ambiguousState,
      ),
    );
    expect(ambiguous.evaluations[0]).toMatchObject({
      status: 'ambiguous_target',
      targetInstanceIds: ['condition-state.test.mdd', 'condition-state.test.mdd.second-instance'],
      matchedRecordIds: [],
      valueBindings: [],
      resolvedProjectionId: null,
      frozenRevealId: null,
    });
  });

  it('normalizes request ordering and replays deterministically', () => {
    const firstDefinition = durationDefinition(
      'target-scoped-definition.test.deterministic-duration',
      presentingAction,
    );
    const secondDefinition = burdenDefinition(
      'target-scoped-definition.test.deterministic-burden',
      findingAction,
    );
    const state = makePatientState();
    const reorderedState = ResolvedPatientStateSchema.parse({
      ...state,
      clinicalDurations: [...state.clinicalDurations].reverse(),
      subjectiveBurdenRecords: [...state.subjectiveBurdenRecords].reverse(),
    });
    const first = compileOrThrow(
      makeRequest([firstDefinition, secondDefinition], [presentingAction, findingAction], state),
    );
    const second = compileOrThrow(
      makeRequest(
        [secondDefinition, firstDefinition],
        [findingAction, presentingAction],
        reorderedState,
      ),
    );
    expect(second).toEqual(first);
    expect(verifyTargetScopedPatientValueProjectionArtifactIntegrity(first)).toEqual({
      ok: true,
      value: first,
    });
  });

  it('rejects unsafe frozen fields and detects payload tampering', () => {
    const artifact = compileOrThrow(
      makeRequest(
        [durationDefinition('target-scoped-definition.test.safe-boundary', presentingAction)],
        [presentingAction],
      ),
    );
    const reveal = artifact.frozenReveals[0]!;
    expect(
      FrozenTargetScopedPatientValueRevealSchema.safeParse({
        ...reveal,
        values: reveal.values.map((value) => ({
          ...value,
          target: {
            kind: 'condition_state',
            conditionStateId: 'condition-state.test.mdd',
          },
        })),
      }).success,
    ).toBe(false);

    const tampered = structuredClone(artifact);
    const frozenValue = tampered.frozenReveals[0]!.values[0]!;
    const authoringValue = tampered.projections[0]!.values[0]!;
    if (frozenValue.kind !== 'clinical_duration' || authoringValue.kind !== 'clinical_duration') {
      throw new Error('Expected duration fixture.');
    }
    frozenValue.value = 99;
    authoringValue.value = 99;
    expect(verifyTargetScopedPatientValueProjectionArtifactIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });
  });
});

describe('D-298 target-scoped patient-value source validation', () => {
  const completeProjectionFixture = () => {
    const sourceInstanceCompilation = compileSourceHorizon();
    const patientState = makePatientState({
      patientReport: sourceInstanceId(sourceInstanceCompilation, 'patient_report'),
      recordReview: sourceInstanceId(sourceInstanceCompilation, 'record_review'),
    });
    const targetScopedPatientValueProjection = compileOrThrow(
      makeRequest(
        [
          durationDefinition('target-scoped-definition.test.source-mdd', presentingAction),
          durationDefinition('target-scoped-definition.test.source-fatigue', findingAction, {
            durationProfileId: 'duration-profile.finding.fatigue',
            durationProfileContentVersion: '1.0.0',
            targetSelector: {
              kind: 'finding_definition',
              findingDefinitionId: 'finding.fatigue-low-energy',
              findingDefinitionContentVersion: '1.0.0',
            },
          }),
          burdenDefinition('target-scoped-definition.test.source-burden', findingAction),
          impairmentDefinition('target-scoped-definition.test.source-impairment', presentingAction),
          propositionDefinition('target-scoped-definition.test.source-record', recordsAction),
        ],
        [recordsAction, findingAction, presentingAction],
        patientState,
      ),
    );
    return { sourceInstanceCompilation, targetScopedPatientValueProjection };
  };

  it('validates every projected action/record/value source and retains only frozen reveals', () => {
    const fixture = completeProjectionFixture();
    const result = validateTargetScopedPatientValueSources({
      schemaVersion: 1,
      id: 'target-scoped-patient-value-source-validation-request.test.complete',
      ...fixture,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);

    expect(TargetScopedPatientValueSourceValidationArtifactSchema.parse(result.value)).toEqual(
      result.value,
    );
    expect(result.value.validatedSourceBindings).toHaveLength(5);
    expect(result.value.validatedSourceBindings).toEqual(
      [...result.value.validatedSourceBindings].sort((left, right) =>
        `${left.informationActionId}\u0000${left.recordId}\u0000${left.frozenValueId}`.localeCompare(
          `${right.informationActionId}\u0000${right.recordId}\u0000${right.frozenValueId}`,
        ),
      ),
    );
    expect(result.value.frozenReveals).toEqual(
      fixture.targetScopedPatientValueProjection.frozenReveals,
    );
    expect(JSON.stringify(result.value.frozenReveals)).not.toContain('condition-state');
    expect(JSON.stringify(result.value.frozenReveals)).not.toContain('canonical-finding');
    const frozenImpairment = result.value.frozenReveals
      .flatMap((reveal) => reveal.values)
      .find((value) => value.kind === 'condition_functional_impairment');
    const impairmentBinding = result.value.validatedSourceBindings.find(
      (binding) => binding.recordId === 'condition-functional-impairment.test.mdd',
    );
    expect(frozenImpairment).toBeDefined();
    expect(JSON.stringify(frozenImpairment)).not.toContain('sourceInstanceId');
    expect(impairmentBinding).toMatchObject({
      sourceInstanceId: sourceInstanceId(fixture.sourceInstanceCompilation, 'patient_report'),
      sourceKind: 'patient_report',
    });
    expect(verifyTargetScopedPatientValueSourceValidationIntegrity(result.value)).toEqual({
      ok: true,
      value: result.value,
    });
  });

  it('permits an empty source horizon only when D-240 projected no source-bearing value', () => {
    const sourceInstanceCompilation = compileSourceHorizon(
      'resolved-patient-state.test.target-scoped-values',
      [],
    );
    const targetScopedPatientValueProjection = compileOrThrow(
      makeRequest(
        [
          durationDefinition(
            'target-scoped-definition.test.source-no-complete-value',
            presentingAction,
            { sourceKind: 'collateral_report' },
          ),
        ],
        [presentingAction],
      ),
    );
    expect(targetScopedPatientValueProjection.frozenReveals).toEqual([]);

    const result = validateTargetScopedPatientValueSources({
      schemaVersion: 1,
      id: 'target-scoped-patient-value-source-validation-request.test.empty',
      targetScopedPatientValueProjection,
      sourceInstanceCompilation,
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        validatedSourceBindings: [],
        frozenReveals: [],
      },
    });
  });

  it('rejects missing source instances, crossed patients, and invalid upstream artifacts', () => {
    const fixture = completeProjectionFixture();
    const missingRecordSource = compileSourceHorizon(
      'resolved-patient-state.test.target-scoped-values',
      ['patient_report'],
    );
    expect(
      validateTargetScopedPatientValueSources({
        schemaVersion: 1,
        id: 'target-scoped-patient-value-source-validation-request.test.missing-source',
        targetScopedPatientValueProjection: fixture.targetScopedPatientValueProjection,
        sourceInstanceCompilation: missingRecordSource,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_REFERENCE_INVALID' },
    });

    const crossedPatient = compileSourceHorizon('resolved-patient-state.test.other');
    expect(
      validateTargetScopedPatientValueSources({
        schemaVersion: 1,
        id: 'target-scoped-patient-value-source-validation-request.test.crossed-patient',
        targetScopedPatientValueProjection: fixture.targetScopedPatientValueProjection,
        sourceInstanceCompilation: crossedPatient,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_CONTEXT_MISMATCH' },
    });

    const changedProjection = structuredClone(fixture.targetScopedPatientValueProjection);
    changedProjection.inputFingerprint =
      'fingerprint.target-scoped-patient-value.input.fnv1a64.0000000000000000';
    expect(
      validateTargetScopedPatientValueSources({
        schemaVersion: 1,
        id: 'target-scoped-patient-value-source-validation-request.test.bad-projection',
        targetScopedPatientValueProjection: changedProjection,
        sourceInstanceCompilation: fixture.sourceInstanceCompilation,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'TARGET_SCOPED_PROJECTION_INVALID' },
    });

    const changedHorizon = structuredClone(fixture.sourceInstanceCompilation);
    changedHorizon.inputFingerprint =
      'fingerprint.patient-scene-source-instance-compilation.input.fnv1a64.0000000000000000';
    expect(
      validateTargetScopedPatientValueSources({
        schemaVersion: 1,
        id: 'target-scoped-patient-value-source-validation-request.test.bad-horizon',
        targetScopedPatientValueProjection: fixture.targetScopedPatientValueProjection,
        sourceInstanceCompilation: changedHorizon,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_HORIZON_INVALID' },
    });
  });

  it('detects source-binding and frozen-reveal tampering during replay', () => {
    const fixture = completeProjectionFixture();
    const compiled = validateTargetScopedPatientValueSources({
      schemaVersion: 1,
      id: 'target-scoped-patient-value-source-validation-request.test.tamper',
      ...fixture,
    });
    if (!compiled.ok) throw new Error(compiled.error.message);

    const changedBinding = structuredClone(compiled.value);
    changedBinding.validatedSourceBindings[0]!.sourceKind = 'collateral_report';
    expect(verifyTargetScopedPatientValueSourceValidationIntegrity(changedBinding).ok).toBe(false);

    const changedReveal = structuredClone(compiled.value);
    const frozenValue = changedReveal.frozenReveals[0]!.values[0]!;
    if (frozenValue.kind !== 'clinical_duration') {
      throw new Error('Expected duration fixture.');
    }
    frozenValue.value = 99;
    expect(verifyTargetScopedPatientValueSourceValidationIntegrity(changedReveal).ok).toBe(false);
  });
});
