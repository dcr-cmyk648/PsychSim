import {
  ResolvedPatientStateSchema,
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
  type TargetScopedPatientValueProjectionArtifact,
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
  translateUniversalActionResultArtifact,
  type UniversalActionResultAttachment,
} from './universal-action-result-attachment';
import {
  compileUniversalActionResults,
  fingerprintInformationActionPayload,
} from './universal-action-result-compiler';
import { compileTargetScopedPatientValueProjections } from './target-scoped-patient-value-projection';

const authoredResolution = {
  origin: 'authored',
  ownerId: 'patient-template.test.action-result-attachment',
  ownerContentVersion: '1.0.0',
} as const;

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-29T12:00:00.000Z',
  sourceUseNoteIds: [],
};

const unreviewed: ClinicalRuleReview = {
  status: 'unreviewed',
  reviewerId: null,
  reviewedAt: null,
  sourceUseNoteIds: [],
};

const actionIds = {
  symptoms: 'info.history.test-attachment-symptoms',
  reactions: 'info.history.test-attachment-reactions',
  weight: 'info.physical.test-attachment-weight',
  mse: 'info.physical.test-attachment-mse',
  tsh: 'info.labs.test-attachment-tsh',
  outside: 'info.history.test-attachment-outside',
} as const;

const focusedActionIds = [
  actionIds.symptoms,
  actionIds.reactions,
  actionIds.weight,
  actionIds.mse,
  actionIds.tsh,
];

const makeAction = (
  id: string,
  category: InformationActionDefinition['category'],
  resultSource: InformationActionDefinition['resultSource'],
): InformationActionDefinition => ({
  id,
  label: id,
  searchAliases: [],
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
  id: 'finding.history.test-attachment-low-energy',
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

const makeSharedFindingRequest = (includeInstrumentTarget = false): SharedFindingCompileRequest => {
  const projections: SharedFindingCompileRequest['projections'] = [
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'finding-projection.test.attachment-low-energy',
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
      expressionBankId: null,
      expressionBankContentVersion: null,
      review: approvedReview,
    },
  ];
  const targets: SharedFindingCompileRequest['projectionHorizon']['targets'] = [
    {
      target: { kind: 'information_action', actionId: actionIds.symptoms },
      allowedResponses: [{ kind: 'finding_outcome', outcome: 'present' }],
      expressionDisplayChannel: null,
    },
  ];
  if (includeInstrumentTarget) {
    projections.push({
      ...projections[0]!,
      id: 'finding-projection.test.attachment-instrument-low-energy',
      target: {
        kind: 'instrument_item',
        instrumentDefinitionId: 'instrument.test.attachment-depression-scale',
        instrumentContentVersion: '1.0.0',
        itemId: 'instrument-item.test.attachment-low-energy',
      },
      response: {
        kind: 'response_option',
        responseOptionId: 'response-option.test.attachment-present',
      },
    });
    targets.push({
      target: {
        kind: 'instrument_item',
        instrumentDefinitionId: 'instrument.test.attachment-depression-scale',
        instrumentContentVersion: '1.0.0',
        itemId: 'instrument-item.test.attachment-low-energy',
      },
      allowedResponses: [
        {
          kind: 'response_option',
          responseOptionId: 'response-option.test.attachment-present',
        },
      ],
      expressionDisplayChannel: null,
    });
  }
  return {
    schemaVersion: 1,
    id: 'finding-compilation-request.test.action-result-attachment',
    patientStateId: 'resolved-patient-state.test.action-result-attachment',
    seed: 'seed.test.action-result-attachment',
    findingDefinitions: [findingDefinition],
    candidates: [
      {
        schemaVersion: 1,
        id: 'finding-candidate.test.attachment-low-energy',
        findingDefinitionId: findingDefinition.id,
        findingDefinitionContentVersion: findingDefinition.contentVersion,
        kind: 'case_critical',
        proposedValue: { kind: 'outcome', value: 'present' },
        uncertainty: 'none',
        contributions: [
          {
            schemaVersion: 1,
            id: 'finding-contribution.test.attachment-low-energy',
            ownerKind: 'patient_template',
            ownerId: 'patient-template.test.action-result-attachment',
            ownerContentVersion: '1.0.0',
            role: 'constraint',
            provenanceIds: [],
          },
        ],
        resolution: authoredResolution,
        review: approvedReview,
      },
    ],
    propositionState: {
      schemaVersion: 1,
      id: 'resolved-proposition-state.test.action-result-attachment',
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    propositionDefinitions: [],
    projections,
    expressionBanks: [],
    projectionHorizon: {
      schemaVersion: 1,
      id: 'finding-projection-horizon.test.action-result-attachment',
      targets,
    },
  };
};

const measurementDefinition: MeasurementDefinition = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'measurement.test.attachment-weight',
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
  id: 'observation.test.attachment-appearance',
  label: 'General appearance',
  domain: 'mental_status_exam',
  allowedValueIds: ['observation-value.test.attachment-unremarkable'],
  availableThroughActionIds: [actionIds.mse],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
};

const testDefinition: TestDefinition = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'test.lab.test-attachment-tsh',
  actionId: actionIds.tsh,
  label: 'TSH',
  category: 'laboratory',
  contextInputs: [],
  medicalReviewStatus: 'unreviewed',
  sourceUseNoteIds: [],
  resultContract: {
    kind: 'binary',
    allowedOutcomes: ['positive', 'negative'],
  },
  generator: {
    type: 'patient_owned',
    reason: 'The synthetic patient owns this frozen result.',
  },
};

const instrumentDefinition: InstrumentDefinition = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'instrument.test.attachment-depression-scale',
  modelVersion: 'instrument-item-response-only.v1',
  rightsBoundaryId: 'rights-boundary.test.public',
  items: [
    {
      id: 'instrument-item.test.attachment-low-energy',
      responseScaleId: 'response-scale.test.attachment-binary',
      responseOptionIds: ['response-option.test.attachment-present'],
      informationActionId: actionIds.symptoms,
      respondentSourceKind: 'patient_report',
      timeScopeId: 'time-scope.current',
    },
  ],
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
};

const makeBasePatientState = (): ResolvedPatientState => ({
  schemaVersion: 1,
  id: 'resolved-patient-state.test.action-result-attachment',
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
    id: 'resolved-exposure-inventory.test.action-result-attachment',
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
      id: 'resolved-measurement.test.attachment-weight',
      definitionId: measurementDefinition.id,
      definitionContentVersion: measurementDefinition.contentVersion,
      value: 78.4,
      displayValue: '78.4',
      unit: { display: 'kg', ucumCode: 'kg' },
      contextValues: [],
      timeScopeId: 'time-scope.current',
      sourceInstanceId: 'source-instance.test.attachment-scale',
      interpretation: { kind: 'not_interpreted' },
      resolution: authoredResolution,
    },
  ],
  categoricalObservations: [
    {
      schemaVersion: 1,
      id: 'resolved-observation.test.attachment-appearance',
      definitionId: observationDefinition.id,
      definitionContentVersion: observationDefinition.contentVersion,
      valueId: 'observation-value.test.attachment-unremarkable',
      displayValue: 'Unremarkable',
      timeScopeId: 'time-scope.current',
      sourceInstanceId: 'source-instance.test.attachment-examiner',
      interpretationIds: [],
      resolution: authoredResolution,
    },
  ],
  structuredTestResults: [
    {
      schemaVersion: 1,
      id: 'structured-test-result.test.attachment-tsh',
      testDefinitionId: testDefinition.id,
      testDefinitionContentVersion: testDefinition.contentVersion,
      sourceInstanceId: 'source-instance.test.attachment-laboratory',
      timeScopeId: 'time-scope.current',
      resolution: authoredResolution,
      kind: 'binary',
      outcome: 'negative',
      displayValue: 'Negative',
      interpretationIds: [],
    },
  ],
  clinicalContexts: [],
  clinicalDurations: [],
  subjectiveBurdenRecords: [],
  propositionState: {
    schemaVersion: 1,
    id: 'resolved-proposition-state.test.action-result-attachment',
    propositions: [],
    evidence: [],
    dependencyGroups: [],
    beliefAppraisals: [],
  },
  clinicalTagIds: [],
  reportedSafetyPlanningAbility: 'unassessed',
});

const makeStructuredRevealEnvelope = (
  patientState: ResolvedPatientState,
  action: InformationActionDefinition,
  kind: 'reactions' | 'outside',
): StructuredPatientStateRevealProjectionEnvelope => {
  const informationActionPayloadFingerprint = fingerprintInformationActionPayload(action);
  if (kind === 'reactions') {
    return {
      definition: {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'structured-reveal-definition.test.attachment-reactions',
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
        id: 'structured-reveal.test.attachment-reactions',
        definitionId: 'structured-reveal-definition.test.attachment-reactions',
        definitionContentVersion: '1.0.0',
        informationActionId: action.id,
        informationActionPayloadFingerprint,
        patientStateId: patientState.id,
        source: {
          kind: 'patient_report',
          sourceInstanceId: 'source-instance.test.attachment-patient',
        },
        timeScopeId: 'time-scope.longitudinal',
        claimOriginId: 'claim-origin.test.attachment-reactions',
        dependencyGroupIds: ['dependency-group.test.hidden-audit'],
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
  }
  return {
    definition: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'structured-reveal-definition.test.attachment-outside',
      modelVersion: 'structured-patient-state-reveal.v1',
      label: 'Outside treatment history',
      informationActionId: action.id,
      informationActionPayloadFingerprint,
      allowedSourceKinds: ['patient_report'],
      lanes: ['medication_trials'],
      singletonFields: [],
      lifecycle: 'review',
      review: unreviewed,
    },
    patientState,
    resolved: {
      schemaVersion: 1,
      id: 'structured-reveal.test.attachment-outside',
      definitionId: 'structured-reveal-definition.test.attachment-outside',
      definitionContentVersion: '1.0.0',
      informationActionId: action.id,
      informationActionPayloadFingerprint,
      patientStateId: patientState.id,
      source: {
        kind: 'patient_report',
        sourceInstanceId: 'source-instance.test.attachment-patient',
      },
      timeScopeId: 'time-scope.longitudinal',
      claimOriginId: 'claim-origin.test.attachment-outside',
      dependencyGroupIds: [],
      laneStatements: [
        {
          lane: 'medication_trials',
          presentationStatus: 'none_reported',
          includedTruthRecordIds: [],
          omittedTruthRecordIds: [],
          relationshipToTruth: 'aligned',
        },
      ],
      singletonStatements: [],
      resolution: authoredResolution,
    },
  };
};

const baseRecipeKinds: Readonly<Record<string, UniversalActionResultRecipe['sourceKinds']>> = {
  [actionIds.symptoms]: ['finding_projections'],
  [actionIds.reactions]: ['structured_state_reveals'],
  [actionIds.weight]: ['measurements'],
  [actionIds.mse]: ['categorical_observations'],
  [actionIds.tsh]: ['structured_test_results'],
  [actionIds.outside]: ['structured_state_reveals'],
};

const makeRecipe = (
  action: InformationActionDefinition,
  sourceKinds = baseRecipeKinds[action.id]!,
): UniversalActionResultRecipe => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: `universal-action-result-recipe.${action.id}`,
  modelVersion: 'universal-action-result.v1',
  informationActionId: action.id,
  informationActionPayloadFingerprint: fingerprintInformationActionPayload(action),
  sourceKinds: [...sourceKinds],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const makeArtifact = (
  options: {
    omitMeasurement?: boolean;
    duplicateMeasurementUse?: boolean;
    includeInstrument?: boolean;
    includeTargetScoped?: boolean;
  } = {},
) => {
  const actions = makeActions();
  const sharedRequest = makeSharedFindingRequest(options.includeInstrument);
  const sharedResult = compileSharedFindings(sharedRequest);
  if (!sharedResult.ok) throw new Error(sharedResult.error.message);
  const state = makeBasePatientState();
  if (options.omitMeasurement) state.measurements = [];
  if (options.includeTargetScoped) {
    state.clinicalDurations.push({
      schemaVersion: 1,
      id: 'clinical-duration.test.attachment-low-energy',
      target: {
        kind: 'canonical_finding',
        canonicalFindingId: sharedResult.value.findings[0]!.id,
      },
      value: 9,
      unit: 'week',
      durationProfileId: 'duration-profile.test.attachment-low-energy',
      durationOptionId: 'duration-option.test.attachment-nine-weeks',
      relatedDiagnosisId: 'diagnosis.test.attachment-mdd',
      interpretation: 'supports_authored_state',
      criterionId: null,
      source: {
        kind: 'patient_report',
        sourceInstanceId: 'source-instance.test.attachment-patient',
      },
      timeScopeId: 'time-scope.current',
      resolution: authoredResolution,
    });
  }
  const patientState = ResolvedPatientStateSchema.parse({
    ...state,
    canonicalFindings: sharedResult.value.findings,
  });
  const reactionAction = actions.find((action) => action.id === actionIds.reactions)!;
  const outsideAction = actions.find((action) => action.id === actionIds.outside)!;
  const measurement = {
    ...measurementDefinition,
    availableThroughActionIds: options.duplicateMeasurementUse
      ? [actionIds.weight, actionIds.mse]
      : [actionIds.weight],
  };
  const actionCatalog = {
    schemaVersion: 1 as const,
    contentVersion: '1.0.0',
    id: 'information-action-catalog.test.attachment',
    actions,
  };
  const actionHorizon = {
    schemaVersion: 1 as const,
    id: 'decision-action-horizon.test.attachment',
    informationActionIds: focusedActionIds,
    startMedicationIds: [],
    regimenEntryOperations: [],
    interventionIds: [],
    dispositionIds: [],
  };
  const instrumentCompilation = compileInstrumentItemResponses({
    schemaVersion: 1,
    id: 'instrument-response-request.test.attachment',
    sharedFindingCompilation: sharedResult.value,
    findingProjectionHorizon: sharedRequest.projectionHorizon,
    actionCatalog,
    actionHorizon: deriveInstrumentInformationActionHorizon(actionHorizon),
    instrumentDefinitions: options.includeInstrument ? [instrumentDefinition] : [],
  });
  if (!instrumentCompilation.ok) throw new Error(instrumentCompilation.error.message);
  const recipes = actions.map((action) =>
    action.id === actionIds.mse && options.duplicateMeasurementUse
      ? makeRecipe(action, ['categorical_observations', 'measurements'])
      : makeRecipe(action),
  );
  if (options.includeInstrument) {
    recipes
      .find((recipe) => recipe.informationActionId === actionIds.symptoms)!
      .sourceKinds.push('instrument_item_responses');
  }
  let targetScopedPatientValueProjectionArtifact: TargetScopedPatientValueProjectionArtifact | null =
    null;
  if (options.includeTargetScoped) {
    const symptomsAction = actions.find((action) => action.id === actionIds.symptoms)!;
    const targetScopedCompilation = compileTargetScopedPatientValueProjections({
      schemaVersion: 1,
      id: 'target-scoped-patient-value-request.test.attachment',
      patientState,
      informationActions: [symptomsAction],
      definitions: [
        {
          schemaVersion: 1,
          contentVersion: '1.0.0',
          id: 'target-scoped-definition.test.attachment-low-energy-duration',
          modelVersion: 'target-scoped-patient-value-projection.v1',
          label: 'Current low-energy duration',
          informationActionId: symptomsAction.id,
          informationActionPayloadFingerprint: fingerprintInformationActionPayload(symptomsAction),
          valueKind: 'clinical_duration',
          durationProfileId: 'duration-profile.test.attachment-low-energy',
          targetSelector: {
            kind: 'finding_definition',
            findingDefinitionId: findingDefinition.id,
            findingDefinitionContentVersion: findingDefinition.contentVersion,
          },
          sourceKind: 'patient_report',
          timeScopeId: 'time-scope.current',
          lifecycle: 'approved',
          review: approvedReview,
        },
      ],
    });
    if (!targetScopedCompilation.ok) {
      throw new Error(targetScopedCompilation.error.message);
    }
    targetScopedPatientValueProjectionArtifact = targetScopedCompilation.value;
    recipes
      .find((recipe) => recipe.informationActionId === actionIds.symptoms)!
      .sourceKinds.push('target_scoped_patient_value_reveals');
  }
  const request: UniversalActionResultCompileRequest =
    UniversalActionResultCompileRequestSchema.parse({
      schemaVersion: 1,
      id: 'universal-action-result-request.test.attachment',
      patientState,
      actionCatalog,
      actionHorizon,
      sharedFindingCompilation: sharedResult.value,
      findingProjectionHorizon: sharedRequest.projectionHorizon,
      instrumentItemResponseCompilation: instrumentCompilation.value,
      targetScopedPatientValueProjectionArtifact,
      structuredRevealEnvelopes: [
        makeStructuredRevealEnvelope(patientState, reactionAction, 'reactions'),
        makeStructuredRevealEnvelope(patientState, outsideAction, 'outside'),
      ],
      measurementDefinitions: [measurement],
      categoricalObservationDefinitions: [observationDefinition],
      testDefinitions: [testDefinition],
      recipes,
    });
  const result = compileUniversalActionResults(request);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const expectSuccess = (
  result: ReturnType<typeof translateUniversalActionResultArtifact>,
): UniversalActionResultAttachment => {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('D-214a universal action-result attachment translator', () => {
  it('mechanically maps all five source kinds while preserving candidate and action IDs', () => {
    const artifact = makeArtifact();
    const translated = expectSuccess(
      translateUniversalActionResultArtifact(artifact, focusedActionIds),
    );

    expect(
      translated.resultBindingRequests.map((request) => [request.id, request.informationActionId]),
    ).toEqual(
      artifact.bindingCandidates.map((candidate) => [candidate.id, candidate.informationActionId]),
    );
    expect(
      translated.resultBindingRequests
        .flatMap((request) => request.sources.map((source) => source.kind))
        .sort(),
    ).toEqual([
      'categorical_observation',
      'finding_projection',
      'measurement',
      'structured_state_reveal',
      'structured_test_result',
    ]);
    expect(
      translated.resultBindingRequests.find(
        (request) => request.informationActionId === actionIds.symptoms,
      )?.sources,
    ).toEqual([
      {
        kind: 'finding_projection',
        projectionId: 'finding-projection.test.attachment-low-energy',
        projectionContentVersion: '1.0.0',
      },
    ]);
    expect(translated.instrumentItemResponses).toEqual([]);
  });

  it('attaches one exact D-220 response while keeping compiler audit fields out of patient state', () => {
    const artifact = makeArtifact({ includeInstrument: true });
    const translated = expectSuccess(translateUniversalActionResultArtifact(artifact));
    const response = artifact.compileRequest.instrumentItemResponseCompilation.responses[0]!;
    const evaluation = artifact.compileRequest.instrumentItemResponseCompilation.evaluations[0]!;

    expect(evaluation.informationActionId).toBe(actionIds.symptoms);
    expect(
      translated.resultBindingRequests.find(
        (request) => request.informationActionId === actionIds.symptoms,
      )?.sources,
    ).toContainEqual({
      kind: 'instrument_item_response',
      responseId: response.id,
      instrumentDefinitionId: instrumentDefinition.id,
      instrumentContentVersion: instrumentDefinition.contentVersion,
      itemId: instrumentDefinition.items[0]!.id,
    });
    expect(translated.instrumentItemResponses).toEqual([
      {
        schemaVersion: 1,
        id: response.id,
        informationActionId: actionIds.symptoms,
        instrumentDefinitionId: instrumentDefinition.id,
        instrumentContentVersion: instrumentDefinition.contentVersion,
        itemId: instrumentDefinition.items[0]!.id,
        responseScaleId: 'response-scale.test.attachment-binary',
        responseOptionId: 'response-option.test.attachment-present',
        timeScopeId: 'time-scope.current',
        respondentSourceKind: 'patient_report',
        rightsBoundaryId: 'rights-boundary.test.public',
      },
    ]);

    const serialized = JSON.stringify(translated.instrumentItemResponses);
    expect(serialized).not.toMatch(
      /interpretationIds|contributingResolvedFindingIds|propositionIds|evidenceIds|projectionId|projectionContentVersion|compileRequest|evaluations|diagnostics|Fingerprint|selectedExpression/,
    );

    const tampered = structuredClone(artifact);
    const instrumentSource = tampered.bindingCandidates
      .find((candidate) => candidate.informationActionId === actionIds.symptoms)!
      .sources.find((source) => source.kind === 'instrument_item_response')!;
    instrumentSource.responseId = 'instrument-item-response.test.crossed';
    expect(translateUniversalActionResultArtifact(tampered)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_ARTIFACT' },
    });
  });

  it('attaches only the exact safe D-240 reveal and rejects crossed definition metadata', () => {
    const artifact = makeArtifact({ includeTargetScoped: true });
    const translated = expectSuccess(translateUniversalActionResultArtifact(artifact));
    const targetArtifact = artifact.compileRequest.targetScopedPatientValueProjectionArtifact;
    expect(targetArtifact).not.toBeNull();
    const frozenReveal = targetArtifact!.frozenReveals[0]!;

    expect(
      translated.resultBindingRequests.find(
        (request) => request.informationActionId === actionIds.symptoms,
      )?.sources,
    ).toContainEqual({
      kind: 'target_scoped_patient_value_reveal',
      frozenRevealId: frozenReveal.id,
      definitionId: frozenReveal.definitionId,
      definitionContentVersion: frozenReveal.definitionContentVersion,
      definitionFingerprint: frozenReveal.definitionFingerprint,
    });
    expect(translated.targetScopedPatientValueReveals).toEqual([frozenReveal]);

    const authoringAudit = JSON.stringify(targetArtifact);
    const safeReveal = JSON.stringify(translated.targetScopedPatientValueReveals);
    expect(authoringAudit).toMatch(
      /canonicalFindingId|recordId|targetSelector|durationProfileId|durationOptionId|interpretation|resolution/,
    );
    expect(safeReveal).not.toMatch(
      /canonicalFindingId|recordId|targetSelector|durationProfileId|durationOptionId|relatedDiagnosisId|criterionId|interpretation|resolution|compileRequest|evaluations|projections/,
    );

    const crossedDefinition = structuredClone(artifact);
    const crossedDefinitionSource = crossedDefinition.bindingCandidates
      .find((candidate) => candidate.informationActionId === actionIds.symptoms)!
      .sources.find((source) => source.kind === 'target_scoped_patient_value_reveal');
    expect(crossedDefinitionSource?.kind).toBe('target_scoped_patient_value_reveal');
    if (crossedDefinitionSource?.kind === 'target_scoped_patient_value_reveal') {
      crossedDefinitionSource.definitionId =
        'target-scoped-definition.test.attachment-crossed-duration';
    }
    expect(translateUniversalActionResultArtifact(crossedDefinition)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_ARTIFACT' },
    });

    const crossedFingerprint = structuredClone(artifact);
    const crossedFingerprintSource = crossedFingerprint.bindingCandidates
      .find((candidate) => candidate.informationActionId === actionIds.symptoms)!
      .sources.find((source) => source.kind === 'target_scoped_patient_value_reveal');
    expect(crossedFingerprintSource?.kind).toBe('target_scoped_patient_value_reveal');
    if (crossedFingerprintSource?.kind === 'target_scoped_patient_value_reveal') {
      crossedFingerprintSource.definitionFingerprint =
        'fingerprint.target-scoped-patient-value.crossed.fnv1a64.0123456789abcdef';
    }
    expect(translateUniversalActionResultArtifact(crossedFingerprint)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_ARTIFACT' },
    });
  });

  it('preserves an explicit none report and sanitizes only referenced D-212 views', () => {
    const artifact = makeArtifact();
    const translated = expectSuccess(translateUniversalActionResultArtifact(artifact));

    expect(artifact.compileRequest.structuredRevealEnvelopes).toHaveLength(2);
    expect(translated.structuredStateReveals).toEqual([
      {
        schemaVersion: 1,
        id: 'structured-reveal.test.attachment-reactions',
        definitionId: 'structured-reveal-definition.test.attachment-reactions',
        definitionContentVersion: '1.0.0',
        informationActionId: actionIds.reactions,
        informationActionPayloadFingerprint: fingerprintInformationActionPayload(
          makeActions().find((action) => action.id === actionIds.reactions)!,
        ),
        patientStateId: 'resolved-patient-state.test.action-result-attachment',
        source: {
          kind: 'patient_report',
          sourceInstanceId: 'source-instance.test.attachment-patient',
        },
        timeScopeId: 'time-scope.longitudinal',
        laneStatements: [
          {
            lane: 'reaction_records',
            presentationStatus: 'none_reported',
            presentedRecordIds: [],
          },
        ],
        singletonStatements: [
          {
            field: 'reaction_history_status',
            presentedValue: 'documented_none',
          },
        ],
      },
    ]);
    expect(
      translated.structuredStateReveals.some(
        (reveal) => reveal.id === 'structured-reveal.test.attachment-outside',
      ),
    ).toBe(false);
  });

  it('redacts patient truth and every D-212 audit-only field from the frozen source view', () => {
    const artifact = makeArtifact();
    const translated = expectSuccess(translateUniversalActionResultArtifact(artifact));
    const serialized = JSON.stringify(translated.structuredStateReveals);

    expect(JSON.stringify(artifact.compileRequest.structuredRevealEnvelopes)).toMatch(
      /patientState|omittedTruthRecordIds|truthValue|relationshipToTruth|claimOriginId|dependencyGroupIds|resolution/,
    );
    expect(serialized).not.toMatch(
      /"patientState":|omittedTruthRecordIds|includedTruthRecordIds|truthValue|relationshipToTruth|claimOriginId|dependencyGroupIds|resolution/,
    );
    expect(serialized).toContain('presentedRecordIds');
  });

  it('rejects incomplete D-213 coverage without creating partial attachment output', () => {
    const artifact = makeArtifact({ omitMeasurement: true });
    expect(artifact.status).toBe('incomplete_coverage');

    expect(translateUniversalActionResultArtifact(artifact)).toMatchObject({
      ok: false,
      error: {
        code: 'INCOMPLETE_COVERAGE',
        contentIds: expect.arrayContaining([artifact.id]),
      },
    });
  });

  it('rejects a tampered artifact before translating any source', () => {
    const artifact = makeArtifact();
    const tampered = structuredClone(artifact);
    tampered.bindingCandidates[0]!.informationActionId = actionIds.outside;

    expect(translateUniversalActionResultArtifact(tampered)).toMatchObject({
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        contentIds: [artifact.id],
      },
    });
  });

  it('rejects a valid artifact crossed with a different expected action horizon', () => {
    const artifact = makeArtifact();

    expect(
      translateUniversalActionResultArtifact(artifact, [
        ...focusedActionIds.slice(0, -1),
        actionIds.outside,
      ]),
    ).toMatchObject({
      ok: false,
      error: {
        code: 'ACTION_HORIZON_MISMATCH',
        contentIds: expect.arrayContaining([artifact.id, actionIds.outside, actionIds.tsh]),
      },
    });
  });

  it('preserves reviewed multi-action availability for one frozen measurement', () => {
    const artifact = makeArtifact({ duplicateMeasurementUse: true });
    const translated = expectSuccess(translateUniversalActionResultArtifact(artifact));

    expect(
      translated.resultBindingRequests
        .filter((binding) =>
          binding.sources.some(
            (source) =>
              source.kind === 'measurement' &&
              source.measurementId === 'resolved-measurement.test.attachment-weight',
          ),
        )
        .map((binding) => binding.informationActionId),
    ).toEqual([actionIds.mse, actionIds.weight]);
  });
});
