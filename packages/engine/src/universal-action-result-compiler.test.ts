import {
  ResolvedPatientStateSchema,
  UniversalActionResultArtifactSchema,
  UniversalActionResultCompileRequestSchema,
  type CategoricalObservationDefinition,
  type ClinicalRuleReview,
  type FindingDefinition,
  type InformationActionDefinition,
  type InstrumentDefinition,
  type MeasurementDefinition,
  type ResolvedPatientState,
  type SharedFindingCompileRequest,
  type StructuredPatientStateRevealProjectionEnvelope,
  type TargetScopedPatientValueProjectionDefinition,
  type TestDefinition,
  type UniversalActionResultCompileRequest,
  type UniversalActionResultRecipe,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import { compileSharedFindings } from './shared-finding-compiler';
import {
  compileInstrumentItemResponses,
  deriveInstrumentInformationActionHorizon,
} from './instrument-item-response-compiler';
import {
  compileUniversalActionResults,
  fingerprintInformationActionPayload,
  verifyUniversalActionResultArtifactIntegrity,
} from './universal-action-result-compiler';
import { compileTargetScopedPatientValueProjections } from './target-scoped-patient-value-projection';

const authoredResolution = {
  origin: 'authored',
  ownerId: 'patient-template.test.universal-action-result',
  ownerContentVersion: '1.0.0',
} as const;

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-29T12:00:00.000Z',
  sourceUseNoteIds: ['source-use-note.test.universal-action-result'],
};

const unreviewed: ClinicalRuleReview = {
  status: 'unreviewed',
  reviewerId: null,
  reviewedAt: null,
  sourceUseNoteIds: [],
};

const actionIds = {
  symptoms: 'info.history.test-symptoms',
  reactions: 'info.history.test-reactions',
  weight: 'info.physical.test-weight',
  mse: 'info.physical.test-mse',
  tsh: 'info.labs.test-tsh',
  outside: 'info.history.test-outside',
} as const;

const makeAction = (
  id: string,
  category: InformationActionDefinition['category'],
  resultSource: InformationActionDefinition['resultSource'],
): InformationActionDefinition => ({
  id,
  label: id,
  searchAliases: [`alias ${id}`],
  category,
  soapSection: category === 'history' ? 'subjective' : 'objective',
  resultSource,
  description: `Neutral description for ${id}.`,
  serviceId: `service.${id}`,
  repeatable: false,
});

const makeActions = (): InformationActionDefinition[] => [
  makeAction(actionIds.symptoms, 'history', 'patient_report'),
  makeAction(actionIds.reactions, 'history', 'patient_report'),
  makeAction(actionIds.weight, 'physical', 'measurement'),
  makeAction(actionIds.mse, 'physical', 'clinician_observation'),
  makeAction(actionIds.tsh, 'labs', 'laboratory'),
  makeAction(actionIds.outside, 'history', 'patient_report'),
];

const findingDefinition: FindingDefinition = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'finding.history.test-low-energy',
  label: 'Current low energy',
  aliases: [],
  semanticKind: 'history',
  valueSpecification: {
    kind: 'outcome',
    allowedValues: ['present', 'absent', 'subthreshold'],
  },
  allowedPresentationProjections: ['status'],
  lifecycle: 'approved',
  medicalReviewStatus: 'unreviewed',
};

const makeSharedFindingRequest = (
  extraTarget: 'instrument' | 'unknown_action' | null = null,
): SharedFindingCompileRequest => {
  const targets: SharedFindingCompileRequest['projectionHorizon']['targets'] = [
    {
      target: { kind: 'information_action', actionId: actionIds.symptoms },
      allowedResponses: [{ kind: 'finding_outcome', outcome: 'present' }],
      expressionDisplayChannel: 'patient_history',
    },
  ];
  if (extraTarget === 'instrument') {
    targets.push({
      target: {
        kind: 'instrument_item',
        instrumentDefinitionId: 'instrument.test.depression-scale',
        instrumentContentVersion: '1.0.0',
        itemId: 'instrument-item.test.low-energy',
      },
      allowedResponses: [
        { kind: 'response_option', responseOptionId: 'response-option.test.present' },
      ],
      expressionDisplayChannel: null,
    });
  }
  if (extraTarget === 'unknown_action') {
    targets.push({
      target: { kind: 'information_action', actionId: 'info.history.test-unknown' },
      allowedResponses: [{ kind: 'finding_outcome', outcome: 'present' }],
      expressionDisplayChannel: 'patient_history',
    });
  }
  const projections: SharedFindingCompileRequest['projections'] = [
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'finding-projection.test.low-energy',
      sourceMatch: 'any',
      sourceBindings: [
        {
          kind: 'canonical_finding',
          findingDefinitionId: findingDefinition.id,
          findingDefinitionContentVersion: findingDefinition.contentVersion,
          allowedStates: ['present'],
        },
      ],
      target: { kind: 'information_action', actionId: actionIds.symptoms },
      response: { kind: 'finding_outcome', outcome: 'present' },
      expressionBankId: 'finding-expression-bank.test.low-energy',
      expressionBankContentVersion: '1.0.0',
      review: approvedReview,
    },
  ];
  if (extraTarget === 'instrument') {
    projections.push({
      ...projections[0]!,
      id: 'finding-projection.test.instrument-low-energy',
      target: {
        kind: 'instrument_item',
        instrumentDefinitionId: 'instrument.test.depression-scale',
        instrumentContentVersion: '1.0.0',
        itemId: 'instrument-item.test.low-energy',
      },
      response: {
        kind: 'response_option',
        responseOptionId: 'response-option.test.present',
      },
      expressionBankId: null,
      expressionBankContentVersion: null,
    });
  }
  return {
    schemaVersion: 1,
    id: 'finding-compilation-request.test.universal-action-result',
    patientStateId: 'resolved-patient-state.test.universal-action-result',
    seed: 'seed.test.universal-action-result',
    findingDefinitions: [findingDefinition],
    candidates: [
      {
        schemaVersion: 1,
        id: 'finding-candidate.test.low-energy',
        findingDefinitionId: findingDefinition.id,
        findingDefinitionContentVersion: findingDefinition.contentVersion,
        kind: 'case_critical',
        proposedValue: { kind: 'outcome', value: 'present' },
        uncertainty: 'none',
        contributions: [
          {
            schemaVersion: 1,
            id: 'finding-contribution.test.low-energy',
            ownerKind: 'patient_template',
            ownerId: 'patient-template.test.universal-action-result',
            ownerContentVersion: '1.0.0',
            role: 'constraint',
            provenanceIds: ['provenance.test.low-energy'],
          },
        ],
        resolution: authoredResolution,
        review: approvedReview,
      },
    ],
    propositionState: {
      schemaVersion: 1,
      id: 'resolved-proposition-state.test.universal-action-result',
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    propositionDefinitions: [],
    projections,
    expressionBanks: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'finding-expression-bank.test.low-energy',
        label: 'Low-energy expressions',
        displayChannels: ['patient_history'],
        variants: [
          { id: 'finding-expression.test.low-energy', text: 'Low energy' },
          { id: 'finding-expression.test.tired', text: 'Tired' },
        ],
        lifecycle: 'approved',
        medicalReviewStatus: 'approved',
      },
    ],
    projectionHorizon: {
      schemaVersion: 1,
      id: 'finding-projection-horizon.test.universal-action-result',
      targets,
    },
  };
};

const measurementDefinition: MeasurementDefinition = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'measurement.test.weight',
  label: 'Weight',
  domain: 'anthropometric',
  unit: { display: 'kg', ucumCode: 'kg', displayPrecision: 1 },
  availableThroughActionIds: [actionIds.weight],
  allowedContextDimensionIds: [],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
};

const observationDefinition: CategoricalObservationDefinition = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'observation.test.mse-appearance',
  label: 'General appearance',
  domain: 'mental_status_exam',
  allowedValueIds: ['observation-value.test.unremarkable'],
  availableThroughActionIds: [actionIds.mse],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
};

const testDefinition: TestDefinition = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'test.lab.test-tsh',
  actionId: actionIds.tsh,
  label: 'TSH',
  category: 'laboratory',
  contextInputs: [],
  medicalReviewStatus: 'unreviewed',
  sourceUseNoteIds: [],
  resultContract: {
    kind: 'binary',
    allowedOutcomes: ['positive', 'negative', 'indeterminate'],
  },
  generator: {
    type: 'patient_owned',
    reason: 'The frozen patient owns the decision-relevant result.',
  },
};

const makeBasePatientState = (): ResolvedPatientState => ({
  schemaVersion: 1,
  id: 'resolved-patient-state.test.universal-action-result',
  demographics: {
    recordVersion: 2,
    ageYears: 44,
    reviewedAgeBandId: 'age-band.middle-adult',
    sexForReference: 'female',
  },
  conditionStates: [],
  diagnosisRecordEntries: [],
  medicationRegimenEntries: [],
  exposureInventory: {
    schemaVersion: 1,
    id: 'resolved-exposure-inventory.test.universal-action-result',
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
  canonicalFindings: [],
  measurements: [
    {
      schemaVersion: 1,
      id: 'resolved-measurement.test.weight',
      definitionId: measurementDefinition.id,
      definitionContentVersion: measurementDefinition.contentVersion,
      value: 78.4,
      displayValue: '78.4',
      unit: { display: 'kg', ucumCode: 'kg' },
      contextValues: [],
      timeScopeId: 'time-scope.current',
      sourceInstanceId: 'source-instance.test.scale',
      interpretation: { kind: 'not_interpreted' },
      resolution: authoredResolution,
    },
  ],
  categoricalObservations: [
    {
      schemaVersion: 1,
      id: 'resolved-observation.test.mse-appearance',
      definitionId: observationDefinition.id,
      definitionContentVersion: observationDefinition.contentVersion,
      valueId: 'observation-value.test.unremarkable',
      displayValue: 'Unremarkable',
      timeScopeId: 'time-scope.current',
      sourceInstanceId: 'source-instance.test.examiner',
      interpretationIds: [],
      resolution: authoredResolution,
    },
  ],
  structuredTestResults: [
    {
      schemaVersion: 1,
      id: 'structured-test-result.test.tsh',
      testDefinitionId: testDefinition.id,
      testDefinitionContentVersion: testDefinition.contentVersion,
      sourceInstanceId: 'source-instance.test.laboratory',
      timeScopeId: 'time-scope.current',
      resolution: authoredResolution,
      kind: 'binary',
      outcome: 'negative',
      displayValue: 'Within reference range',
      interpretationIds: ['interpretation.test.within-reference-range'],
    },
  ],
  clinicalContexts: [],
  clinicalDurations: [],
  subjectiveBurdenRecords: [],
  propositionState: {
    schemaVersion: 1,
    id: 'resolved-proposition-state.test.universal-action-result',
    propositions: [],
    evidence: [],
    dependencyGroups: [],
    beliefAppraisals: [],
  },
  clinicalTagIds: [],
  reportedSafetyPlanningAbility: 'unassessed',
});

const makeStructuredReactionEnvelope = (
  patientState: ResolvedPatientState,
  action: InformationActionDefinition,
): StructuredPatientStateRevealProjectionEnvelope => {
  const informationActionPayloadFingerprint = fingerprintInformationActionPayload(action);
  return {
    definition: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'structured-reveal-definition.test.reactions',
      modelVersion: 'structured-patient-state-reveal.v1',
      label: 'Allergies and adverse reactions',
      informationActionId: action.id,
      informationActionPayloadFingerprint,
      allowedSourceKinds: ['patient_report'],
      lanes: ['reaction_records'],
      singletonFields: ['reaction_history_status'],
      lifecycle: 'review',
      review: unreviewed,
    },
    patientState,
    resolved: {
      schemaVersion: 1,
      id: 'structured-reveal.test.reactions',
      definitionId: 'structured-reveal-definition.test.reactions',
      definitionContentVersion: '1.0.0',
      informationActionId: action.id,
      informationActionPayloadFingerprint,
      patientStateId: patientState.id,
      source: {
        kind: 'patient_report',
        sourceInstanceId: 'source-instance.test.patient',
      },
      timeScopeId: 'time-scope.longitudinal',
      claimOriginId: 'claim-origin.test.reactions',
      dependencyGroupIds: [],
      laneStatements: [
        {
          lane: 'reaction_records',
          presentationStatus: 'none_reported',
          includedTruthRecordIds: [],
          omittedTruthRecordIds: [],
          relationshipToTruth: 'aligned',
        },
      ],
      singletonStatements: [
        {
          field: 'reaction_history_status',
          truthValue: 'documented_none',
          presentedValue: 'documented_none',
          relationshipToTruth: 'aligned',
        },
      ],
      resolution: authoredResolution,
    },
  };
};

const recipeKinds: Readonly<Record<string, UniversalActionResultRecipe['sourceKinds']>> = {
  [actionIds.symptoms]: ['finding_projections'],
  [actionIds.reactions]: ['structured_state_reveals'],
  [actionIds.weight]: ['measurements'],
  [actionIds.mse]: ['categorical_observations'],
  [actionIds.tsh]: ['structured_test_results'],
  [actionIds.outside]: ['structured_state_reveals'],
};

const instrumentDefinition: InstrumentDefinition = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'instrument.test.depression-scale',
  modelVersion: 'instrument-item-response-only.v1',
  rightsBoundaryId: 'rights-boundary.test.public',
  items: [
    {
      id: 'instrument-item.test.low-energy',
      responseScaleId: 'response-scale.test.binary',
      responseOptionIds: ['response-option.test.present'],
      informationActionId: actionIds.symptoms,
      respondentSourceKind: 'patient_report',
      timeScopeId: 'time-scope.current',
    },
  ],
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
};

const makeRecipe = (action: InformationActionDefinition): UniversalActionResultRecipe => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: `universal-action-result-recipe.${action.id}`,
  modelVersion: 'universal-action-result.v1',
  informationActionId: action.id,
  informationActionPayloadFingerprint: fingerprintInformationActionPayload(action),
  sourceKinds: [...recipeKinds[action.id]!],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const makeRequest = (
  options: {
    omitMeasurement?: boolean;
    extraFindingProjectionTarget?: 'instrument' | 'unknown_action';
  } = {},
): UniversalActionResultCompileRequest => {
  const actions = makeActions();
  const sharedRequest = makeSharedFindingRequest(options.extraFindingProjectionTarget ?? null);
  const sharedResult = compileSharedFindings(sharedRequest);
  if (!sharedResult.ok) throw new Error(sharedResult.error.message);
  const patientState = ResolvedPatientStateSchema.parse({
    ...makeBasePatientState(),
    canonicalFindings: sharedResult.value.findings,
    measurements: options.omitMeasurement ? [] : makeBasePatientState().measurements,
  });
  const reactionAction = actions.find((action) => action.id === actionIds.reactions)!;
  const actionCatalog = {
    schemaVersion: 1 as const,
    contentVersion: '1.0.0',
    id: 'information-action-catalog.test.universal',
    actions,
  };
  const actionHorizon = {
    schemaVersion: 1 as const,
    id: 'decision-action-horizon.test.universal',
    informationActionIds: [
      actionIds.symptoms,
      actionIds.reactions,
      actionIds.weight,
      actionIds.mse,
      actionIds.tsh,
    ],
    startMedicationIds: [],
    regimenEntryOperations: [],
    interventionIds: [],
    dispositionIds: [],
  };
  const instrumentDefinitions =
    options.extraFindingProjectionTarget === 'instrument' ? [instrumentDefinition] : [];
  const instrumentCompilation = compileInstrumentItemResponses({
    schemaVersion: 1,
    id: 'instrument-response-request.test.universal',
    sharedFindingCompilation: sharedResult.value,
    findingProjectionHorizon: sharedRequest.projectionHorizon,
    actionCatalog,
    actionHorizon: deriveInstrumentInformationActionHorizon(actionHorizon),
    instrumentDefinitions,
  });
  if (!instrumentCompilation.ok) throw new Error(instrumentCompilation.error.message);
  const recipes = actions.map(makeRecipe);
  if (options.extraFindingProjectionTarget === 'instrument') {
    recipes
      .find((recipe) => recipe.informationActionId === actionIds.symptoms)!
      .sourceKinds.push('instrument_item_responses');
  }
  return UniversalActionResultCompileRequestSchema.parse({
    schemaVersion: 1,
    id: 'universal-action-result-request.test',
    patientState,
    actionCatalog,
    actionHorizon,
    sharedFindingCompilation: sharedResult.value,
    findingProjectionHorizon: sharedRequest.projectionHorizon,
    instrumentItemResponseCompilation: instrumentCompilation.value,
    targetScopedPatientValueProjectionArtifact: null,
    structuredRevealEnvelopes: [makeStructuredReactionEnvelope(patientState, reactionAction)],
    measurementDefinitions: [measurementDefinition],
    categoricalObservationDefinitions: [observationDefinition],
    testDefinitions: [testDefinition],
    recipes,
  });
};

const expectSuccess = (request: unknown) => {
  const result = compileUniversalActionResults(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const attachTargetScopedDuration = (
  request: UniversalActionResultCompileRequest,
  status: 'complete' | 'not_applicable' | 'missing' | 'ambiguous' | 'complete_and_missing',
): void => {
  const action = request.actionCatalog.actions.find(
    (candidate) => candidate.id === actionIds.symptoms,
  )!;
  const conditionStates =
    status === 'not_applicable'
      ? []
      : [
          {
            schemaVersion: 1 as const,
            id: 'condition-state.test.mdd',
            diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
            diagnosisDefinitionContentVersion: '1.0.0',
            clinicalStateId: 'clinical-state.current',
            timeScopeId: 'time-scope.current',
            encounterRelevance: 'focus' as const,
            severityId: null,
            specifierIds: [],
            origin: 'authored' as const,
            resolution: authoredResolution,
          },
          ...(status === 'ambiguous'
            ? [
                {
                  schemaVersion: 1 as const,
                  id: 'condition-state.test.mdd.second',
                  diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
                  diagnosisDefinitionContentVersion: '1.0.0',
                  clinicalStateId: 'clinical-state.historical',
                  timeScopeId: 'time-scope.historical',
                  encounterRelevance: 'background' as const,
                  severityId: null,
                  specifierIds: [],
                  origin: 'authored' as const,
                  resolution: authoredResolution,
                },
              ]
            : []),
        ];
  const hasValue = status === 'complete' || status === 'complete_and_missing';
  request.patientState = ResolvedPatientStateSchema.parse({
    ...request.patientState,
    conditionStates,
    clinicalDurations: hasValue
      ? [
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
              sourceInstanceId: 'source-instance.test.patient',
            },
            timeScopeId: 'time-scope.current',
            resolution: authoredResolution,
          },
        ]
      : [],
  });
  request.structuredRevealEnvelopes = request.structuredRevealEnvelopes.map((envelope) => ({
    ...envelope,
    patientState: request.patientState,
  }));
  const definition = (
    id: string,
    durationProfileId: string,
  ): TargetScopedPatientValueProjectionDefinition => ({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id,
    modelVersion: 'target-scoped-patient-value-projection.v1',
    label: id,
    informationActionId: action.id,
    informationActionPayloadFingerprint: fingerprintInformationActionPayload(action),
    valueKind: 'clinical_duration',
    durationProfileId,
    durationProfileContentVersion: '1.0.0',
    targetSelector: {
      kind: 'condition_definition',
      diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
      diagnosisDefinitionContentVersion: '1.0.0',
    },
    sourceKind: 'patient_report',
    timeScopeId: 'time-scope.current',
    lifecycle: 'approved',
    review: approvedReview,
  });
  const definitions = [
    definition(
      'target-scoped-definition.test.mdd-duration',
      'duration-profile.mdd.current-episode',
    ),
    ...(status === 'complete_and_missing'
      ? [
          definition(
            'target-scoped-definition.test.mdd-duration.secondary',
            'duration-profile.mdd.secondary',
          ),
        ]
      : []),
  ];
  const projection = compileTargetScopedPatientValueProjections({
    schemaVersion: 1,
    id: `target-scoped-request.test.${status}`,
    patientState: request.patientState,
    informationActions: [action],
    definitions,
  });
  if (!projection.ok) throw new Error(projection.error.message);
  request.targetScopedPatientValueProjectionArtifact = projection.value;
  request.recipes
    .find((recipe) => recipe.informationActionId === action.id)!
    .sourceKinds.push('target_scoped_patient_value_reveals');
};

describe('D-213 universal information-action result compiler', () => {
  it('requires exactly one recipe for every action in the exact catalog', () => {
    const request = makeRequest();
    const missing = structuredClone(request);
    missing.recipes.pop();
    expect(compileUniversalActionResults(missing)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const duplicate = structuredClone(request);
    duplicate.recipes[1] = duplicate.recipes[0]!;
    expect(compileUniversalActionResults(duplicate)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('resolves all five frozen owner classes and keeps an out-of-horizon action neutral', () => {
    const compiled = expectSuccess(makeRequest());

    expect(UniversalActionResultArtifactSchema.parse(compiled)).toEqual(compiled);
    expect(compiled.status).toBe('complete');
    expect(compiled.bindingCandidates).toHaveLength(5);
    expect(
      compiled.bindingCandidates
        .flatMap((binding) => binding.sources.map((source) => source.kind))
        .sort(),
    ).toEqual([
      'categorical_observation',
      'finding_projection',
      'measurement',
      'structured_state_reveal',
      'structured_test_result',
    ]);
    expect(
      compiled.evaluations.find(
        (evaluation) => evaluation.informationActionId === actionIds.outside,
      ),
    ).toMatchObject({
      status: 'outside_action_horizon',
      sourceEvaluations: [],
      bindingCandidate: null,
      diagnosticIds: [],
    });
  });

  it('normalizes semantically unordered catalog, recipe, horizon, and definition arrays', () => {
    const first = expectSuccess(makeRequest());
    const reordered = makeRequest();
    reordered.actionCatalog.actions.reverse();
    reordered.actionHorizon.informationActionIds.reverse();
    reordered.recipes.reverse();
    reordered.structuredRevealEnvelopes.reverse();
    reordered.measurementDefinitions.reverse();
    reordered.categoricalObservationDefinitions.reverse();
    reordered.testDefinitions.reverse();

    expect(expectSuccess(reordered)).toEqual(first);
  });

  it('reports missing source coverage without fabricating a normal, negative, or empty result', () => {
    const compiled = expectSuccess(makeRequest({ omitMeasurement: true }));
    const weight = compiled.evaluations.find(
      (evaluation) => evaluation.informationActionId === actionIds.weight,
    );

    expect(compiled.status).toBe('incomplete_coverage');
    expect(weight).toMatchObject({
      status: 'incomplete_coverage',
      bindingCandidate: null,
      sourceEvaluations: [
        {
          sourceKind: 'measurements',
          status: 'missing',
          sources: [],
        },
      ],
    });
    expect(compiled.bindingCandidates).toHaveLength(4);
    expect(JSON.stringify(weight)).not.toMatch(/normal|negative|documented_none/);
  });

  it('treats an explicit D-212 documented-none report as data rather than inferring it from an empty array', () => {
    const compiled = expectSuccess(makeRequest());
    const reaction = compiled.bindingCandidates.find(
      (binding) => binding.informationActionId === actionIds.reactions,
    );

    expect(reaction?.sources).toEqual([
      {
        kind: 'structured_state_reveal',
        resolvedProjectionId: 'structured-reveal.test.reactions',
        definitionId: 'structured-reveal-definition.test.reactions',
        definitionContentVersion: '1.0.0',
      },
    ]);
    expect(reaction).not.toHaveProperty('reactionHistory');
    expect(reaction).not.toHaveProperty('omittedTruthRecordIds');
  });

  it('pins D-212 views and recipes to the exact patient and information-action payload', () => {
    const staleAction = makeRequest();
    staleAction.actionCatalog.actions.find((action) => action.id === actionIds.reactions)!.label =
      'Changed reaction label';
    expect(compileUniversalActionResults(staleAction)).toMatchObject({
      ok: false,
      error: { code: 'ACTION_PAYLOAD_FINGERPRINT_MISMATCH' },
    });

    const crossedPatient = makeRequest();
    const envelope = crossedPatient.structuredRevealEnvelopes[0]!;
    envelope.patientState.id = 'resolved-patient-state.test.crossed';
    envelope.resolved.patientStateId = envelope.patientState.id;
    expect(compileUniversalActionResults(crossedPatient)).toMatchObject({
      ok: false,
      error: { code: 'STRUCTURED_REVEAL_STATE_MISMATCH' },
    });
  });

  it('attaches exact D-220 instrument responses and rejects unknown information actions from the complete finding horizon', () => {
    const withInstrument = expectSuccess(
      makeRequest({ extraFindingProjectionTarget: 'instrument' }),
    );
    expect(withInstrument.diagnostics).toEqual([]);
    expect(
      withInstrument.bindingCandidates
        .find((binding) => binding.informationActionId === actionIds.symptoms)
        ?.sources.map((source) => source.kind),
    ).toEqual(expect.arrayContaining(['finding_projection', 'instrument_item_response']));

    expect(
      compileUniversalActionResults(
        makeRequest({ extraFindingProjectionTarget: 'unknown_action' }),
      ),
    ).toMatchObject({
      ok: false,
      error: {
        code: 'UNKNOWN_SOURCE_ACTION',
        contentIds: expect.arrayContaining(['info.history.test-unknown']),
      },
    });
  });

  it('requires the action recipe to declare its exact D-220 response source', () => {
    const request = makeRequest({ extraFindingProjectionTarget: 'instrument' });
    request.recipes.find(
      (recipe) => recipe.informationActionId === actionIds.symptoms,
    )!.sourceKinds = ['finding_projections'];

    expect(compileUniversalActionResults(request)).toMatchObject({
      ok: false,
      error: {
        code: 'UNDECLARED_ACTION_OWNED_SOURCE',
        contentIds: expect.arrayContaining([actionIds.symptoms]),
      },
    });
  });

  it('routes only safe D-240 frozen reveals through the exact owning action', () => {
    const request = makeRequest();
    attachTargetScopedDuration(request, 'complete');
    const compiled = expectSuccess(request);
    const symptoms = compiled.bindingCandidates.find(
      (binding) => binding.informationActionId === actionIds.symptoms,
    );
    const targetSource = symptoms?.sources.find(
      (source) => source.kind === 'target_scoped_patient_value_reveal',
    );

    expect(targetSource).toMatchObject({
      kind: 'target_scoped_patient_value_reveal',
      definitionId: 'target-scoped-definition.test.mdd-duration',
    });
    expect(compiled.targetScopedPatientValueProjectionArtifactRef).toEqual({
      id: request.targetScopedPatientValueProjectionArtifact!.id,
      payloadFingerprint: request.targetScopedPatientValueProjectionArtifact!.payloadFingerprint,
    });
    expect(JSON.stringify(targetSource)).not.toMatch(
      /targetSelector|conditionStateId|durationProfileId|durationProfileContentVersion|durationOptionId|criterionId|interpretation|resolution/,
    );
  });

  it('keeps D-240 not-applicable definitions neutral when another result owner resolves', () => {
    const request = makeRequest();
    attachTargetScopedDuration(request, 'not_applicable');
    const compiled = expectSuccess(request);
    const symptoms = compiled.evaluations.find(
      (evaluation) => evaluation.informationActionId === actionIds.symptoms,
    );

    expect(symptoms).toMatchObject({
      status: 'complete',
      sourceEvaluations: expect.arrayContaining([
        {
          sourceKind: 'target_scoped_patient_value_reveals',
          status: 'not_applicable',
          sources: [],
        },
      ]),
    });
    expect(symptoms?.bindingCandidate?.sources.map((source) => source.kind)).not.toContain(
      'target_scoped_patient_value_reveal',
    );
  });

  it('does not let a complete D-240 value mask a missing or ambiguous same-action definition', () => {
    for (const status of ['missing', 'ambiguous', 'complete_and_missing'] as const) {
      const request = makeRequest();
      attachTargetScopedDuration(request, status);
      const compiled = expectSuccess(request);
      const symptoms = compiled.evaluations.find(
        (evaluation) => evaluation.informationActionId === actionIds.symptoms,
      );

      expect(symptoms).toMatchObject({
        status: 'incomplete_coverage',
        bindingCandidate: null,
        sourceEvaluations: expect.arrayContaining([
          {
            sourceKind: 'target_scoped_patient_value_reveals',
            status: 'missing',
            sources: [],
          },
        ]),
      });
      expect(compiled.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
        status === 'ambiguous'
          ? 'ambiguous_target_scoped_value'
          : 'missing_required_target_scoped_value',
      );
    }
  });

  it('requires a declared D-240 owner even when its current target is not applicable', () => {
    const omitted = makeRequest();
    attachTargetScopedDuration(omitted, 'not_applicable');
    omitted.recipes.find(
      (recipe) => recipe.informationActionId === actionIds.symptoms,
    )!.sourceKinds = ['finding_projections'];
    expect(compileUniversalActionResults(omitted)).toMatchObject({
      ok: false,
      error: { code: 'UNDECLARED_ACTION_OWNED_SOURCE' },
    });

    const absent = makeRequest();
    absent.recipes
      .find((recipe) => recipe.informationActionId === actionIds.symptoms)!
      .sourceKinds.push('target_scoped_patient_value_reveals');
    const incomplete = expectSuccess(absent);
    expect(incomplete.status).toBe('incomplete_coverage');
    expect(incomplete.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'missing_required_source',
          sourceKind: 'target_scoped_patient_value_reveals',
        }),
      ]),
    );
  });

  it('rejects tampered or crossed D-220 artifacts before attaching a response', () => {
    const tampered = makeRequest({ extraFindingProjectionTarget: 'instrument' });
    tampered.instrumentItemResponseCompilation.responses[0]!.rightsBoundaryId =
      'rights-boundary.test.tampered';
    expect(compileUniversalActionResults(tampered)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_INSTRUMENT_ITEM_RESPONSES' },
    });

    const crossed = makeRequest({ extraFindingProjectionTarget: 'instrument' });
    crossed.instrumentItemResponseCompilation = makeRequest().instrumentItemResponseCompilation;
    expect(compileUniversalActionResults(crossed)).toMatchObject({
      ok: false,
      error: { code: 'INSTRUMENT_ITEM_RESPONSE_CONTEXT_MISMATCH' },
    });
  });

  it('rejects omission of action-owned finding, structured-state, or test sources', () => {
    const request = makeRequest();
    request.recipes.find(
      (recipe) => recipe.informationActionId === actionIds.symptoms,
    )!.sourceKinds = ['measurements'];
    expect(compileUniversalActionResults(request)).toMatchObject({
      ok: false,
      error: { code: 'UNDECLARED_ACTION_OWNED_SOURCE' },
    });
  });

  it('uses explicit measurement and observation availability without making those owners exclusive', () => {
    const request = makeRequest();
    request.measurementDefinitions[0]!.availableThroughActionIds.push(actionIds.mse);
    request.recipes.find((recipe) => recipe.informationActionId === actionIds.mse)!.sourceKinds = [
      'categorical_observations',
      'measurements',
    ];
    const compiled = expectSuccess(request);
    const mse = compiled.bindingCandidates.find(
      (binding) => binding.informationActionId === actionIds.mse,
    );
    expect(mse?.sources.map((source) => source.kind)).toEqual([
      'categorical_observation',
      'measurement',
    ]);
  });

  it('rejects stale exact measurement, observation, and test definition versions', () => {
    for (const kind of ['measurement', 'observation', 'test'] as const) {
      const request = makeRequest();
      if (kind === 'measurement') request.measurementDefinitions[0]!.contentVersion = '2.0.0';
      if (kind === 'observation')
        request.categoricalObservationDefinitions[0]!.contentVersion = '2.0.0';
      if (kind === 'test') request.testDefinitions[0]!.contentVersion = '2.0.0';
      expect(compileUniversalActionResults(request)).toMatchObject({
        ok: false,
        error: {
          code:
            kind === 'measurement'
              ? 'INVALID_MEASUREMENT_SOURCE'
              : kind === 'observation'
                ? 'INVALID_OBSERVATION_SOURCE'
                : 'INVALID_TEST_SOURCE',
        },
      });
    }
  });

  it('replays exactly, rejects tampering, and contains no complexity or scoring contract', () => {
    const compiled = expectSuccess(makeRequest());
    expect(verifyUniversalActionResultArtifactIntegrity(compiled)).toEqual({
      ok: true,
      value: compiled,
    });

    const tampered = structuredClone(compiled);
    tampered.evaluations[0]!.informationActionPayloadFingerprint =
      'fingerprint.information-action.tampered.fnv1a64.0123456789abcdef';
    expect(verifyUniversalActionResultArtifactIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });
    expect(JSON.stringify(compiled)).not.toMatch(
      /complexityBudget|complexityCost|selectedModule|points|score|payout/,
    );
  });
});
