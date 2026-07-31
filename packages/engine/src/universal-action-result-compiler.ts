import {
  CategoricalObservationResolutionEnvelopeSchema,
  MeasurementResolutionEnvelopeSchema,
  StructuredTestResultEnvelopeSchema,
  UniversalActionResultAssemblyRecipeSchema,
  UniversalActionResultArtifactSchema,
  UniversalActionResultCompileRequestSchema,
  type CategoricalObservationDefinition,
  type DecisionActionHorizon,
  type InformationActionDefinition,
  type InstrumentDefinition,
  type MeasurementDefinition,
  type StructuredPatientStateRevealProjectionEnvelope,
  type TargetScopedPatientValueProjectionArtifact,
  type TestDefinition,
  type UniversalActionResultAssemblyRecipe,
  type UniversalActionResultArtifact,
  type UniversalActionResultBindingCandidate,
  type UniversalActionResultCompileRequest,
  type UniversalActionResultCoverageDiagnostic,
  type UniversalActionResultEvaluation,
  type UniversalActionResultFingerprint,
  type UniversalActionResultRecipe,
  type UniversalActionResultResolvedSource,
  type UniversalActionResultSourceEvaluation,
  type UniversalActionResultSourceKind,
  type UniversalInformationActionCatalog,
} from '@psychsim/schemas';

import { verifyCompiledSharedFindingContext } from './shared-finding-compiler';
import {
  deriveInstrumentInformationActionHorizon,
  verifyInstrumentItemResponseCompilationIntegrity,
} from './instrument-item-response-compiler';
import {
  fingerprintInformationActionPayload,
  normalizeInformationActionForFingerprint,
} from './information-action-fingerprint';
import { normalizeResolvedPatientState } from './resolved-patient-state-normalizer';
import {
  normalizeTargetScopedPatientValueProjectionDefinition,
  verifyTargetScopedPatientValueProjectionArtifactIntegrity,
} from './target-scoped-patient-value-projection';

export { fingerprintInformationActionPayload } from './information-action-fingerprint';

export const UNIVERSAL_ACTION_RESULT_COMPILER_VERSION = '3.0.0';

export type UniversalActionResultCompileErrorCode =
  | 'INVALID_REQUEST'
  | 'INVALID_SHARED_FINDING_COMPILATION'
  | 'PATIENT_STATE_MISMATCH'
  | 'INVALID_INSTRUMENT_ITEM_RESPONSES'
  | 'INCOMPLETE_INSTRUMENT_ITEM_RESPONSES'
  | 'INSTRUMENT_ITEM_RESPONSE_CONTEXT_MISMATCH'
  | 'INVALID_INSTRUMENT_ITEM_RESPONSE_SOURCE'
  | 'INVALID_TARGET_SCOPED_PATIENT_VALUE_PROJECTIONS'
  | 'TARGET_SCOPED_PATIENT_VALUE_CONTEXT_MISMATCH'
  | 'ACTION_PAYLOAD_FINGERPRINT_MISMATCH'
  | 'UNKNOWN_SOURCE_ACTION'
  | 'STRUCTURED_REVEAL_STATE_MISMATCH'
  | 'INVALID_MEASUREMENT_SOURCE'
  | 'INVALID_OBSERVATION_SOURCE'
  | 'INVALID_TEST_SOURCE'
  | 'UNDECLARED_ACTION_OWNED_SOURCE'
  | 'INVALID_OUTPUT';

export type UniversalActionResultCompileResult =
  | { readonly ok: true; readonly value: UniversalActionResultArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: UniversalActionResultCompileErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type UniversalActionResultIntegrityResult =
  | { readonly ok: true; readonly value: UniversalActionResultArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'REPLAY_FAILED'
          | 'REPLAY_MISMATCH';
        readonly message: string;
      };
    };

const compareStrings = (left: string, right: string): number =>
  left === right ? 0 : left < right ? -1 : 1;

const canonicalizeObjectKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeObjectKeys);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([key, child]) => [key, canonicalizeObjectKeys(child)]),
    );
  }
  return value;
};

const hashToHex64 = (value: string): string => {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, '0');
};

const fingerprint = (scope: string, value: unknown): UniversalActionResultFingerprint =>
  `fingerprint.universal-action-result.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalizeObjectKeys(value)))}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const sortById = <T extends { readonly id: string }>(values: readonly T[]): T[] =>
  [...values].sort((left, right) => compareStrings(left.id, right.id));

const sameCanonicalValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const normalizeAction = (action: InformationActionDefinition): InformationActionDefinition => ({
  ...normalizeInformationActionForFingerprint(action),
});

const normalizeActionCatalog = (
  catalog: UniversalInformationActionCatalog,
): UniversalInformationActionCatalog => ({
  ...catalog,
  actions: sortById(catalog.actions.map(normalizeAction)),
});

const normalizeActionHorizon = (horizon: DecisionActionHorizon): DecisionActionHorizon => ({
  ...horizon,
  informationActionIds: uniqueSorted(horizon.informationActionIds),
  startMedicationIds: uniqueSorted(horizon.startMedicationIds),
  regimenEntryOperations: [...horizon.regimenEntryOperations]
    .map((entry) => ({
      ...entry,
      operations: [...entry.operations].sort(compareStrings),
    }))
    .sort((left, right) => compareStrings(left.regimenEntryId, right.regimenEntryId)),
  interventionIds: uniqueSorted(horizon.interventionIds),
  dispositionIds: uniqueSorted(horizon.dispositionIds),
});

const normalizeRecipe = (recipe: UniversalActionResultRecipe): UniversalActionResultRecipe => ({
  ...recipe,
  sourceKinds: [...recipe.sourceKinds].sort(compareStrings),
});

const normalizeMeasurementDefinition = (
  definition: MeasurementDefinition,
): MeasurementDefinition => ({
  ...definition,
  availableThroughActionIds: uniqueSorted(definition.availableThroughActionIds),
  allowedContextDimensionIds: uniqueSorted(definition.allowedContextDimensionIds),
});

const normalizeObservationDefinition = (
  definition: CategoricalObservationDefinition,
): CategoricalObservationDefinition => ({
  ...definition,
  allowedValueIds: uniqueSorted(definition.allowedValueIds),
  availableThroughActionIds: uniqueSorted(definition.availableThroughActionIds),
});

const normalizeTestDefinition = (definition: TestDefinition): TestDefinition => ({
  ...definition,
  contextInputs: [...definition.contextInputs].sort(compareStrings),
  sourceUseNoteIds: uniqueSorted(definition.sourceUseNoteIds),
});

const normalizeInstrumentDefinition = (definition: InstrumentDefinition): InstrumentDefinition => ({
  ...definition,
  items: [...definition.items]
    .map((item) => ({
      ...item,
      responseOptionIds: uniqueSorted(item.responseOptionIds),
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
});

const normalizeStructuredRevealEnvelope = (
  envelope: StructuredPatientStateRevealProjectionEnvelope,
): StructuredPatientStateRevealProjectionEnvelope => ({
  ...envelope,
  definition: {
    ...envelope.definition,
    allowedSourceKinds: [...envelope.definition.allowedSourceKinds].sort(compareStrings),
    lanes: [...envelope.definition.lanes].sort(compareStrings),
    singletonFields: [...envelope.definition.singletonFields].sort(compareStrings),
    review: {
      ...envelope.definition.review,
      sourceUseNoteIds: uniqueSorted(envelope.definition.review.sourceUseNoteIds),
    },
  },
  resolved: {
    ...envelope.resolved,
    dependencyGroupIds: uniqueSorted(envelope.resolved.dependencyGroupIds),
    laneStatements: [...envelope.resolved.laneStatements]
      .map((statement) => ({
        ...statement,
        includedTruthRecordIds: uniqueSorted(statement.includedTruthRecordIds),
        omittedTruthRecordIds: uniqueSorted(statement.omittedTruthRecordIds),
      }))
      .sort((left, right) => compareStrings(left.lane, right.lane)),
    singletonStatements: [...envelope.resolved.singletonStatements].sort((left, right) =>
      compareStrings(left.field, right.field),
    ),
  },
});

const normalizeStructuredRevealDefinition = (
  definition: UniversalActionResultAssemblyRecipe['structuredRevealDefinitions'][number],
): UniversalActionResultAssemblyRecipe['structuredRevealDefinitions'][number] => ({
  ...definition,
  allowedSourceKinds: [...definition.allowedSourceKinds].sort(compareStrings),
  lanes: [...definition.lanes].sort(compareStrings),
  singletonFields: [...definition.singletonFields].sort(compareStrings),
  review: {
    ...definition.review,
    sourceUseNoteIds: uniqueSorted(definition.review.sourceUseNoteIds),
  },
});

export const normalizeUniversalActionResultAssemblyRecipe = (
  recipe: UniversalActionResultAssemblyRecipe,
): UniversalActionResultAssemblyRecipe =>
  UniversalActionResultAssemblyRecipeSchema.parse({
    ...recipe,
    actionCatalog: normalizeActionCatalog(recipe.actionCatalog),
    instrumentDefinitions: sortById(
      recipe.instrumentDefinitions.map(normalizeInstrumentDefinition),
    ),
    structuredRevealDefinitions: sortById(
      recipe.structuredRevealDefinitions.map(normalizeStructuredRevealDefinition),
    ),
    targetScopedPatientValueProjectionDefinitions: [
      ...recipe.targetScopedPatientValueProjectionDefinitions,
    ]
      .map(normalizeTargetScopedPatientValueProjectionDefinition)
      .sort((left, right) =>
        compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
      ),
    measurementDefinitions: sortById(
      recipe.measurementDefinitions.map(normalizeMeasurementDefinition),
    ),
    categoricalObservationDefinitions: sortById(
      recipe.categoricalObservationDefinitions.map(normalizeObservationDefinition),
    ),
    testDefinitions: sortById(recipe.testDefinitions.map(normalizeTestDefinition)),
    recipes: [...recipe.recipes]
      .map(normalizeRecipe)
      .sort((left, right) => compareStrings(left.informationActionId, right.informationActionId)),
  });

const normalizeRequest = (
  request: UniversalActionResultCompileRequest,
): UniversalActionResultCompileRequest =>
  UniversalActionResultCompileRequestSchema.parse({
    ...request,
    actionCatalog: normalizeActionCatalog(request.actionCatalog),
    actionHorizon: normalizeActionHorizon(request.actionHorizon),
    structuredRevealEnvelopes: [...request.structuredRevealEnvelopes]
      .map(normalizeStructuredRevealEnvelope)
      .sort((left, right) => compareStrings(left.resolved.id, right.resolved.id)),
    measurementDefinitions: sortById(
      request.measurementDefinitions.map(normalizeMeasurementDefinition),
    ),
    categoricalObservationDefinitions: sortById(
      request.categoricalObservationDefinitions.map(normalizeObservationDefinition),
    ),
    testDefinitions: sortById(request.testDefinitions.map(normalizeTestDefinition)),
    recipes: [...request.recipes]
      .map(normalizeRecipe)
      .sort((left, right) => compareStrings(left.informationActionId, right.informationActionId)),
  });

export const fingerprintUniversalInformationActionCatalog = (
  catalog: UniversalInformationActionCatalog,
): UniversalActionResultFingerprint =>
  fingerprint('action-catalog', normalizeActionCatalog(catalog));

export const fingerprintUniversalActionResultRecipe = (
  recipe: UniversalActionResultRecipe,
): UniversalActionResultFingerprint => fingerprint('recipe', normalizeRecipe(recipe));

export const fingerprintUniversalActionResultAssemblyRecipe = (
  recipe: UniversalActionResultAssemblyRecipe,
): UniversalActionResultFingerprint =>
  fingerprint('assembly-recipe', normalizeUniversalActionResultAssemblyRecipe(recipe));

const recipeReference = (recipe: UniversalActionResultRecipe) => ({
  id: recipe.id,
  contentVersion: recipe.contentVersion,
  fingerprint: fingerprintUniversalActionResultRecipe(recipe),
});

const sourceKey = (source: UniversalActionResultResolvedSource): string =>
  JSON.stringify(canonicalizeObjectKeys(source));

const sourceContentId = (source: UniversalActionResultResolvedSource): string => {
  switch (source.kind) {
    case 'finding_projection':
    case 'structured_state_reveal':
      return source.resolvedProjectionId;
    case 'measurement':
      return source.measurementId;
    case 'categorical_observation':
      return source.categoricalObservationId;
    case 'structured_test_result':
      return source.structuredTestResultId;
    case 'instrument_item_response':
      return source.responseId;
    case 'target_scoped_patient_value_reveal':
      return source.frozenRevealId;
  }
};

const normalizeSources = (
  sources: readonly UniversalActionResultResolvedSource[],
): UniversalActionResultResolvedSource[] =>
  [...sources].sort((left, right) => compareStrings(sourceKey(left), sourceKey(right)));

const fail = (
  code: UniversalActionResultCompileErrorCode,
  message: string,
  contentIds: readonly string[],
): UniversalActionResultCompileResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

type SourcesByAction = Map<
  string,
  Map<UniversalActionResultSourceKind, UniversalActionResultResolvedSource[]>
>;

type TargetScopedPatientValueSourceState = {
  readonly status: 'resolved' | 'not_applicable' | 'missing';
  readonly diagnosticIds: readonly string[];
};

const addSource = (
  index: SourcesByAction,
  actionId: string,
  kind: UniversalActionResultSourceKind,
  source: UniversalActionResultResolvedSource,
): void => {
  const byKind = index.get(actionId) ?? new Map();
  const sources = byKind.get(kind) ?? [];
  sources.push(source);
  byKind.set(kind, sources);
  index.set(actionId, byKind);
};

const getSources = (
  index: SourcesByAction,
  actionId: string,
  kind: UniversalActionResultSourceKind,
): UniversalActionResultResolvedSource[] => normalizeSources(index.get(actionId)?.get(kind) ?? []);

const validateDefinitionActions = (
  actionIds: ReadonlySet<string>,
  actionReferences: readonly string[],
): string[] => actionReferences.filter((actionId) => !actionIds.has(actionId));

const buildSourceIndex = (
  request: UniversalActionResultCompileRequest,
):
  | {
      readonly ok: true;
      readonly sources: SourcesByAction;
      readonly diagnostics: UniversalActionResultCoverageDiagnostic[];
      readonly targetScopedPatientValueStates: ReadonlyMap<
        string,
        TargetScopedPatientValueSourceState
      >;
    }
  | { readonly ok: false; readonly result: UniversalActionResultCompileResult } => {
  const actionIds = new Set(request.actionCatalog.actions.map((action) => action.id));
  const sources: SourcesByAction = new Map();
  const diagnostics: UniversalActionResultCoverageDiagnostic[] = [];
  const targetScopedPatientValueStates = new Map<string, TargetScopedPatientValueSourceState>();
  const instrumentArtifact = request.instrumentItemResponseCompilation;
  const instrumentEvaluations = new Map(
    instrumentArtifact.evaluations.map((evaluation) => [
      JSON.stringify(canonicalizeObjectKeys(evaluation.target)),
      evaluation,
    ]),
  );
  const instrumentResponses = new Map(
    instrumentArtifact.responses.map((response) => [response.id, response]),
  );

  for (const availability of request.findingProjectionHorizon.targets) {
    if (availability.target.kind === 'information_action') {
      if (!actionIds.has(availability.target.actionId)) {
        return {
          ok: false,
          result: fail(
            'UNKNOWN_SOURCE_ACTION',
            `${request.findingProjectionHorizon.id} includes information action ${availability.target.actionId}, which is absent from the exact universal catalog.`,
            [request.findingProjectionHorizon.id, availability.target.actionId],
          ),
        };
      }
      continue;
    }
    const evaluation = instrumentEvaluations.get(
      JSON.stringify(canonicalizeObjectKeys(availability.target)),
    );
    if (!evaluation || evaluation.status !== 'complete') {
      return {
        ok: false,
        result: fail(
          'INVALID_INSTRUMENT_ITEM_RESPONSE_SOURCE',
          `${availability.target.itemId} lacks one complete D-220 evaluation.`,
          [
            request.findingProjectionHorizon.id,
            availability.target.instrumentDefinitionId,
            availability.target.itemId,
          ],
        ),
      };
    }
    const response = instrumentResponses.get(evaluation.responseId);
    if (
      !response ||
      response.instrumentDefinitionId !== availability.target.instrumentDefinitionId ||
      response.instrumentContentVersion !== availability.target.instrumentContentVersion ||
      response.itemId !== availability.target.itemId ||
      !actionIds.has(evaluation.informationActionId)
    ) {
      return {
        ok: false,
        result: fail(
          'INVALID_INSTRUMENT_ITEM_RESPONSE_SOURCE',
          `${availability.target.itemId} does not resolve to one exact action-owned D-220 response.`,
          [
            request.findingProjectionHorizon.id,
            availability.target.instrumentDefinitionId,
            availability.target.itemId,
            evaluation.responseId,
            evaluation.informationActionId,
          ],
        ),
      };
    }
    addSource(sources, evaluation.informationActionId, 'instrument_item_responses', {
      kind: 'instrument_item_response',
      responseId: response.id,
      instrumentDefinitionId: response.instrumentDefinitionId,
      instrumentContentVersion: response.instrumentContentVersion,
      itemId: response.itemId,
    });
  }

  for (const projection of request.sharedFindingCompilation.projections) {
    if (projection.target.kind === 'instrument_item') {
      continue;
    }
    if (!actionIds.has(projection.target.actionId)) {
      return {
        ok: false,
        result: fail(
          'UNKNOWN_SOURCE_ACTION',
          `${projection.id} targets information action ${projection.target.actionId}, which is absent from the exact universal catalog.`,
          [projection.id, projection.target.actionId],
        ),
      };
    }
    addSource(sources, projection.target.actionId, 'finding_projections', {
      kind: 'finding_projection',
      resolvedProjectionId: projection.id,
      projectionId: projection.projectionId,
      projectionContentVersion: projection.projectionContentVersion,
    });
  }

  for (const envelope of request.structuredRevealEnvelopes) {
    if (!sameCanonicalValue(envelope.patientState, request.patientState)) {
      return {
        ok: false,
        result: fail(
          'STRUCTURED_REVEAL_STATE_MISMATCH',
          `${envelope.resolved.id} does not project the exact frozen patient state supplied to D-213.`,
          [envelope.resolved.id, envelope.patientState.id, request.patientState.id],
        ),
      };
    }
    const action = request.actionCatalog.actions.find(
      (candidate) => candidate.id === envelope.definition.informationActionId,
    );
    if (!action) {
      return {
        ok: false,
        result: fail(
          'UNKNOWN_SOURCE_ACTION',
          `${envelope.resolved.id} targets an information action absent from the exact universal catalog.`,
          [envelope.resolved.id, envelope.definition.informationActionId],
        ),
      };
    }
    const expectedActionFingerprint = fingerprintInformationActionPayload(action);
    if (
      envelope.definition.informationActionPayloadFingerprint !== expectedActionFingerprint ||
      envelope.resolved.informationActionPayloadFingerprint !== expectedActionFingerprint
    ) {
      return {
        ok: false,
        result: fail(
          'ACTION_PAYLOAD_FINGERPRINT_MISMATCH',
          `${envelope.resolved.id} does not pin the current exact information-action payload.`,
          [envelope.resolved.id, action.id],
        ),
      };
    }
    addSource(sources, action.id, 'structured_state_reveals', {
      kind: 'structured_state_reveal',
      resolvedProjectionId: envelope.resolved.id,
      definitionId: envelope.definition.id,
      definitionContentVersion: envelope.definition.contentVersion,
    });
  }

  const targetScopedArtifact = request.targetScopedPatientValueProjectionArtifact;
  if (targetScopedArtifact !== null) {
    const integrity =
      verifyTargetScopedPatientValueProjectionArtifactIntegrity(targetScopedArtifact);
    if (!integrity.ok) {
      return {
        ok: false,
        result: fail('INVALID_TARGET_SCOPED_PATIENT_VALUE_PROJECTIONS', integrity.error.message, [
          targetScopedArtifact.id,
        ]),
      };
    }
    const artifact: TargetScopedPatientValueProjectionArtifact = integrity.value;
    if (
      artifact.patientStateId !== request.patientState.id ||
      !sameCanonicalValue(
        artifact.compileRequest.patientState,
        normalizeResolvedPatientState(request.patientState),
      )
    ) {
      return {
        ok: false,
        result: fail(
          'TARGET_SCOPED_PATIENT_VALUE_CONTEXT_MISMATCH',
          `${artifact.id} does not project the exact frozen patient state supplied to D-213.`,
          [artifact.id, artifact.patientStateId, request.patientState.id],
        ),
      };
    }
    for (const action of artifact.compileRequest.informationActions) {
      const catalogAction = request.actionCatalog.actions.find(
        (candidate) => candidate.id === action.id,
      );
      if (
        catalogAction === undefined ||
        !sameCanonicalValue(normalizeAction(action), normalizeAction(catalogAction)) ||
        fingerprintInformationActionPayload(action) !==
          fingerprintInformationActionPayload(catalogAction)
      ) {
        return {
          ok: false,
          result: fail(
            'ACTION_PAYLOAD_FINGERPRINT_MISMATCH',
            `${artifact.id} does not retain the exact current payload for ${action.id}.`,
            [artifact.id, action.id],
          ),
        };
      }
    }

    const revealById = new Map(artifact.frozenReveals.map((reveal) => [reveal.id, reveal]));
    const evaluationsByAction = new Map<
      string,
      TargetScopedPatientValueProjectionArtifact['evaluations']
    >();
    for (const evaluation of artifact.evaluations) {
      const action = request.actionCatalog.actions.find(
        (candidate) => candidate.id === evaluation.informationActionId,
      );
      if (action === undefined) {
        return {
          ok: false,
          result: fail(
            'UNKNOWN_SOURCE_ACTION',
            `${evaluation.definitionId} targets an action absent from the exact universal catalog.`,
            [artifact.id, evaluation.definitionId, evaluation.informationActionId],
          ),
        };
      }
      const actionEvaluations = evaluationsByAction.get(evaluation.informationActionId) ?? [];
      actionEvaluations.push(evaluation);
      evaluationsByAction.set(evaluation.informationActionId, actionEvaluations);
      if (evaluation.status !== 'complete') continue;
      const reveal = revealById.get(evaluation.frozenRevealId!);
      if (
        reveal === undefined ||
        reveal.definitionId !== evaluation.definitionId ||
        reveal.definitionContentVersion !== evaluation.definitionContentVersion ||
        reveal.definitionFingerprint !== evaluation.definitionFingerprint ||
        reveal.informationActionId !== evaluation.informationActionId ||
        reveal.informationActionPayloadFingerprint !==
          fingerprintInformationActionPayload(action) ||
        reveal.patientStateId !== request.patientState.id
      ) {
        return {
          ok: false,
          result: fail(
            'TARGET_SCOPED_PATIENT_VALUE_CONTEXT_MISMATCH',
            `${evaluation.definitionId} does not resolve to one exact frozen target-scoped reveal for ${evaluation.informationActionId}.`,
            [
              artifact.id,
              evaluation.definitionId,
              evaluation.frozenRevealId ?? evaluation.informationActionId,
            ],
          ),
        };
      }
      addSource(sources, evaluation.informationActionId, 'target_scoped_patient_value_reveals', {
        kind: 'target_scoped_patient_value_reveal',
        frozenRevealId: reveal.id,
        frozenRevealPayloadFingerprint: reveal.payloadFingerprint,
        definitionId: reveal.definitionId,
        definitionContentVersion: reveal.definitionContentVersion,
        definitionFingerprint: reveal.definitionFingerprint,
      });
    }

    for (const [actionId, evaluations] of evaluationsByAction) {
      const blocking = evaluations.filter(
        (evaluation) =>
          evaluation.status === 'missing_required_value' ||
          evaluation.status === 'ambiguous_target',
      );
      if (blocking.length > 0) {
        const diagnosticIds = blocking.map((evaluation) => {
          const diagnostic: UniversalActionResultCoverageDiagnostic = {
            schemaVersion: 1,
            id: stableId('diagnostic.target-scoped-patient-value', {
              actionId,
              artifactId: artifact.id,
              definitionId: evaluation.definitionId,
              status: evaluation.status,
            }),
            code:
              evaluation.status === 'missing_required_value'
                ? 'missing_required_target_scoped_value'
                : 'ambiguous_target_scoped_value',
            informationActionId: actionId,
            sourceKind: 'target_scoped_patient_value_reveals',
            contentIds: uniqueSorted([
              actionId,
              artifact.id,
              evaluation.definitionId,
              ...evaluation.targetInstanceIds,
            ]),
            message:
              evaluation.status === 'missing_required_value'
                ? `${evaluation.definitionId} has one applicable target but no matching frozen patient value.`
                : `${evaluation.definitionId} matches multiple patient-state targets and cannot be projected unambiguously.`,
          };
          diagnostics.push(diagnostic);
          return diagnostic.id;
        });
        targetScopedPatientValueStates.set(actionId, {
          status: 'missing',
          diagnosticIds,
        });
      } else if (evaluations.some((evaluation) => evaluation.status === 'complete')) {
        targetScopedPatientValueStates.set(actionId, {
          status: 'resolved',
          diagnosticIds: [],
        });
      } else {
        targetScopedPatientValueStates.set(actionId, {
          status: 'not_applicable',
          diagnosticIds: [],
        });
      }
    }
  }

  const measurementDefinitions = new Map(
    request.measurementDefinitions.map((definition) => [
      `${definition.id}\u0000${definition.contentVersion}`,
      definition,
    ]),
  );
  for (const definition of request.measurementDefinitions) {
    const unknownActions = validateDefinitionActions(
      actionIds,
      definition.availableThroughActionIds,
    );
    if (unknownActions.length > 0) {
      return {
        ok: false,
        result: fail(
          'UNKNOWN_SOURCE_ACTION',
          `${definition.id} references information actions outside the exact universal catalog.`,
          [definition.id, ...unknownActions],
        ),
      };
    }
  }
  for (const measurement of request.patientState.measurements) {
    const definition = measurementDefinitions.get(
      `${measurement.definitionId}\u0000${measurement.definitionContentVersion}`,
    );
    const envelope = definition
      ? MeasurementResolutionEnvelopeSchema.safeParse({
          definition,
          resolved: measurement,
        })
      : null;
    if (!definition || !envelope?.success) {
      return {
        ok: false,
        result: fail(
          'INVALID_MEASUREMENT_SOURCE',
          `${measurement.id} lacks its exact valid measurement-definition version.`,
          [measurement.id, measurement.definitionId],
        ),
      };
    }
    for (const actionId of definition.availableThroughActionIds) {
      addSource(sources, actionId, 'measurements', {
        kind: 'measurement',
        measurementId: measurement.id,
        definitionId: definition.id,
        definitionContentVersion: definition.contentVersion,
      });
    }
  }

  const observationDefinitions = new Map(
    request.categoricalObservationDefinitions.map((definition) => [
      `${definition.id}\u0000${definition.contentVersion}`,
      definition,
    ]),
  );
  for (const definition of request.categoricalObservationDefinitions) {
    const unknownActions = validateDefinitionActions(
      actionIds,
      definition.availableThroughActionIds,
    );
    if (unknownActions.length > 0) {
      return {
        ok: false,
        result: fail(
          'UNKNOWN_SOURCE_ACTION',
          `${definition.id} references information actions outside the exact universal catalog.`,
          [definition.id, ...unknownActions],
        ),
      };
    }
  }
  for (const observation of request.patientState.categoricalObservations) {
    const definition = observationDefinitions.get(
      `${observation.definitionId}\u0000${observation.definitionContentVersion}`,
    );
    const envelope = definition
      ? CategoricalObservationResolutionEnvelopeSchema.safeParse({
          definition,
          resolved: observation,
        })
      : null;
    if (!definition || !envelope?.success) {
      return {
        ok: false,
        result: fail(
          'INVALID_OBSERVATION_SOURCE',
          `${observation.id} lacks its exact valid categorical-observation definition version.`,
          [observation.id, observation.definitionId],
        ),
      };
    }
    for (const actionId of definition.availableThroughActionIds) {
      addSource(sources, actionId, 'categorical_observations', {
        kind: 'categorical_observation',
        categoricalObservationId: observation.id,
        definitionId: definition.id,
        definitionContentVersion: definition.contentVersion,
      });
    }
  }

  const testDefinitions = new Map(
    request.testDefinitions.map((definition) => [
      `${definition.id}\u0000${definition.contentVersion}`,
      definition,
    ]),
  );
  for (const definition of request.testDefinitions) {
    if (!actionIds.has(definition.actionId)) {
      return {
        ok: false,
        result: fail(
          'UNKNOWN_SOURCE_ACTION',
          `${definition.id} targets information action ${definition.actionId}, which is absent from the exact universal catalog.`,
          [definition.id, definition.actionId],
        ),
      };
    }
  }
  for (const result of request.patientState.structuredTestResults) {
    const definition = testDefinitions.get(
      `${result.testDefinitionId}\u0000${result.testDefinitionContentVersion}`,
    );
    const envelope = definition
      ? StructuredTestResultEnvelopeSchema.safeParse({ definition, result })
      : null;
    if (!definition || !envelope?.success) {
      return {
        ok: false,
        result: fail(
          'INVALID_TEST_SOURCE',
          `${result.id} lacks its exact valid test-definition version.`,
          [result.id, result.testDefinitionId],
        ),
      };
    }
    addSource(sources, definition.actionId, 'structured_test_results', {
      kind: 'structured_test_result',
      structuredTestResultId: result.id,
      testDefinitionId: definition.id,
      testDefinitionContentVersion: definition.contentVersion,
    });
  }

  return {
    ok: true,
    sources,
    diagnostics: diagnostics.sort((left, right) => compareStrings(left.id, right.id)),
    targetScopedPatientValueStates,
  };
};

const artifactPayload = (
  artifact: Omit<UniversalActionResultArtifact, 'id' | 'payloadFingerprint'>,
): unknown => artifact;

/**
 * Compiles a complete catalog audit and future D-194-compatible binding
 * candidates. It never calls D-194, purchases an action, reveals a result, or
 * reads optional-complexity accounting.
 */
export const compileUniversalActionResults = (
  input: unknown,
): UniversalActionResultCompileResult => {
  const parsed = UniversalActionResultCompileRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }
  const request = normalizeRequest(parsed.data);
  const actionsById = new Map(request.actionCatalog.actions.map((action) => [action.id, action]));
  const recipesByAction = new Map(
    request.recipes.map((recipe) => [recipe.informationActionId, recipe]),
  );

  for (const recipe of request.recipes) {
    const action = actionsById.get(recipe.informationActionId)!;
    if (
      recipe.informationActionPayloadFingerprint !== fingerprintInformationActionPayload(action)
    ) {
      return fail(
        'ACTION_PAYLOAD_FINGERPRINT_MISMATCH',
        `${recipe.id} does not pin the current exact payload for ${action.id}.`,
        [recipe.id, action.id],
      );
    }
  }

  const findingIntegrity = verifyCompiledSharedFindingContext({
    compiled: request.sharedFindingCompilation,
    projectionHorizon: request.findingProjectionHorizon,
  });
  if (!findingIntegrity.ok) {
    return fail('INVALID_SHARED_FINDING_COMPILATION', findingIntegrity.error.message, [
      request.sharedFindingCompilation.id,
      request.findingProjectionHorizon.id,
    ]);
  }
  if (
    findingIntegrity.value.patientStateId !== request.patientState.id ||
    !sameCanonicalValue(
      sortById(findingIntegrity.value.findings),
      sortById(request.patientState.canonicalFindings),
    )
  ) {
    return fail(
      'PATIENT_STATE_MISMATCH',
      'D-213 requires the exact patient state and D-193 finding output for the same frozen patient.',
      [request.patientState.id, findingIntegrity.value.id],
    );
  }

  const instrumentIntegrity = verifyInstrumentItemResponseCompilationIntegrity(
    request.instrumentItemResponseCompilation,
  );
  if (!instrumentIntegrity.ok) {
    return fail('INVALID_INSTRUMENT_ITEM_RESPONSES', instrumentIntegrity.error.message, [
      request.instrumentItemResponseCompilation.id,
    ]);
  }
  if (instrumentIntegrity.value.status !== 'complete') {
    return fail(
      'INCOMPLETE_INSTRUMENT_ITEM_RESPONSES',
      `${instrumentIntegrity.value.id} does not provide complete instrument item-response coverage.`,
      [
        instrumentIntegrity.value.id,
        ...instrumentIntegrity.value.diagnostics.map((diagnostic) => diagnostic.id),
      ],
    );
  }
  const instrumentRequest = instrumentIntegrity.value.compileRequest;
  const expectedInstrumentActionHorizon = deriveInstrumentInformationActionHorizon(
    request.actionHorizon,
  );
  if (
    instrumentIntegrity.value.patientStateId !== request.patientState.id ||
    instrumentRequest.sharedFindingCompilation.id !== request.sharedFindingCompilation.id ||
    instrumentRequest.sharedFindingCompilation.payloadFingerprint !==
      request.sharedFindingCompilation.payloadFingerprint ||
    !sameCanonicalValue(
      instrumentRequest.findingProjectionHorizon,
      request.findingProjectionHorizon,
    ) ||
    !sameCanonicalValue(instrumentRequest.actionCatalog, request.actionCatalog) ||
    !sameCanonicalValue(instrumentRequest.actionHorizon, expectedInstrumentActionHorizon)
  ) {
    return fail(
      'INSTRUMENT_ITEM_RESPONSE_CONTEXT_MISMATCH',
      'D-213 requires the exact complete D-220 artifact for the same patient, findings, projection horizon, action catalog, and focused information-action horizon.',
      [
        request.patientState.id,
        request.sharedFindingCompilation.id,
        request.findingProjectionHorizon.id,
        request.actionCatalog.id,
        request.actionHorizon.id,
        instrumentIntegrity.value.id,
      ],
    );
  }

  const indexed = buildSourceIndex(request);
  if (!indexed.ok) return indexed.result;

  for (const action of request.actionCatalog.actions) {
    const recipe = recipesByAction.get(action.id)!;
    for (const sourceKind of [
      'finding_projections',
      'instrument_item_responses',
      'structured_state_reveals',
      'target_scoped_patient_value_reveals',
      'structured_test_results',
    ] as const) {
      if (
        (getSources(indexed.sources, action.id, sourceKind).length > 0 ||
          (sourceKind === 'target_scoped_patient_value_reveals' &&
            indexed.targetScopedPatientValueStates.has(action.id))) &&
        !recipe.sourceKinds.includes(sourceKind)
      ) {
        return fail(
          'UNDECLARED_ACTION_OWNED_SOURCE',
          `${recipe.id} omits exact ${sourceKind} already owned by ${action.id}.`,
          [
            recipe.id,
            action.id,
            ...getSources(indexed.sources, action.id, sourceKind).map(sourceContentId),
          ],
        );
      }
    }
  }

  const inHorizon = new Set(request.actionHorizon.informationActionIds);
  const diagnostics = [...indexed.diagnostics];
  const evaluations: UniversalActionResultEvaluation[] = [];
  const bindingCandidates: UniversalActionResultBindingCandidate[] = [];

  for (const action of request.actionCatalog.actions) {
    const recipe = recipesByAction.get(action.id)!;
    const recipeRef = recipeReference(recipe);
    const actionFingerprint = fingerprintInformationActionPayload(action);
    if (!inHorizon.has(action.id)) {
      evaluations.push({
        informationActionId: action.id,
        informationActionPayloadFingerprint: actionFingerprint,
        recipeRef,
        status: 'outside_action_horizon',
        sourceEvaluations: [],
        bindingCandidate: null,
        diagnosticIds: [],
      });
      continue;
    }

    const sourceEvaluations: UniversalActionResultSourceEvaluation[] = recipe.sourceKinds.map(
      (sourceKind) => {
        const sources = getSources(indexed.sources, action.id, sourceKind);
        if (sourceKind !== 'target_scoped_patient_value_reveals') {
          return sources.length > 0
            ? { sourceKind, status: 'resolved' as const, sources }
            : { sourceKind, status: 'missing' as const, sources: [] };
        }
        const state = indexed.targetScopedPatientValueStates.get(action.id);
        if (state?.status === 'resolved' && sources.length > 0) {
          return { sourceKind, status: 'resolved' as const, sources };
        }
        if (state?.status === 'not_applicable') {
          return { sourceKind, status: 'not_applicable' as const, sources: [] };
        }
        return { sourceKind, status: 'missing' as const, sources: [] };
      },
    );
    const missing = sourceEvaluations.filter((evaluation) => evaluation.status === 'missing');
    if (missing.length > 0) {
      const diagnosticIds = missing.flatMap((evaluation) => {
        if (evaluation.sourceKind === 'target_scoped_patient_value_reveals') {
          const targetState = indexed.targetScopedPatientValueStates.get(action.id);
          if (targetState !== undefined && targetState.diagnosticIds.length > 0) {
            return [...targetState.diagnosticIds];
          }
        }
        const diagnostic: UniversalActionResultCoverageDiagnostic = {
          schemaVersion: 1,
          id: stableId('diagnostic.missing-action-result-source', {
            actionId: action.id,
            sourceKind: evaluation.sourceKind,
            recipeId: recipe.id,
          }),
          code: 'missing_required_source',
          informationActionId: action.id,
          sourceKind: evaluation.sourceKind,
          contentIds: [action.id, recipe.id],
          message: `${action.id} has no frozen ${evaluation.sourceKind} source required by ${recipe.id}.`,
        };
        diagnostics.push(diagnostic);
        return [diagnostic.id];
      });
      evaluations.push({
        informationActionId: action.id,
        informationActionPayloadFingerprint: actionFingerprint,
        recipeRef,
        status: 'incomplete_coverage',
        sourceEvaluations,
        bindingCandidate: null,
        diagnosticIds: uniqueSorted(diagnosticIds),
      });
      continue;
    }

    const bindingSources = normalizeSources(
      sourceEvaluations.flatMap((evaluation) =>
        evaluation.status === 'resolved' ? evaluation.sources : [],
      ),
    );
    if (bindingSources.length === 0) {
      const diagnostic: UniversalActionResultCoverageDiagnostic = {
        schemaVersion: 1,
        id: stableId('diagnostic.no-applicable-action-result-source', {
          actionId: action.id,
          recipeId: recipe.id,
        }),
        code: 'no_applicable_result_source',
        informationActionId: action.id,
        sourceKind: 'target_scoped_patient_value_reveals',
        contentIds: [action.id, recipe.id],
        message: `${action.id} has no applicable frozen result source under ${recipe.id}.`,
      };
      diagnostics.push(diagnostic);
      evaluations.push({
        informationActionId: action.id,
        informationActionPayloadFingerprint: actionFingerprint,
        recipeRef,
        status: 'incomplete_coverage',
        sourceEvaluations,
        bindingCandidate: null,
        diagnosticIds: [diagnostic.id],
      });
      continue;
    }
    const bindingCandidate: UniversalActionResultBindingCandidate = {
      schemaVersion: 1,
      id: stableId('action-result-binding', {
        actionId: action.id,
        recipeRef,
        sources: bindingSources,
      }),
      informationActionId: action.id,
      sources: bindingSources,
    };
    bindingCandidates.push(bindingCandidate);
    evaluations.push({
      informationActionId: action.id,
      informationActionPayloadFingerprint: actionFingerprint,
      recipeRef,
      status: 'complete',
      sourceEvaluations,
      bindingCandidate,
      diagnosticIds: [],
    });
  }

  evaluations.sort((left, right) =>
    compareStrings(left.informationActionId, right.informationActionId),
  );
  bindingCandidates.sort((left, right) =>
    compareStrings(left.informationActionId, right.informationActionId),
  );
  diagnostics.sort((left, right) => compareStrings(left.id, right.id));
  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity: Omit<UniversalActionResultArtifact, 'id' | 'payloadFingerprint'> = {
    schemaVersion: 1,
    compilerVersion: UNIVERSAL_ACTION_RESULT_COMPILER_VERSION,
    requestId: request.id,
    status: evaluations.some((evaluation) => evaluation.status === 'incomplete_coverage')
      ? 'incomplete_coverage'
      : 'complete',
    patientStateId: request.patientState.id,
    actionCatalogRef: {
      id: request.actionCatalog.id,
      contentVersion: request.actionCatalog.contentVersion,
      fingerprint: fingerprintUniversalInformationActionCatalog(request.actionCatalog),
    },
    actionHorizonRef: {
      id: request.actionHorizon.id,
      fingerprint: fingerprint('action-horizon', request.actionHorizon),
    },
    sharedFindingCompilationRef: {
      id: findingIntegrity.value.id,
      payloadFingerprint: findingIntegrity.value.payloadFingerprint,
      projectionHorizonId: findingIntegrity.value.projectionHorizonId,
      projectionHorizonFingerprint: findingIntegrity.value.projectionHorizonFingerprint,
    },
    instrumentItemResponseCompilationRef: {
      id: instrumentIntegrity.value.id,
      payloadFingerprint: instrumentIntegrity.value.payloadFingerprint,
    },
    targetScopedPatientValueProjectionArtifactRef:
      request.targetScopedPatientValueProjectionArtifact === null
        ? null
        : {
            id: request.targetScopedPatientValueProjectionArtifact.id,
            payloadFingerprint:
              request.targetScopedPatientValueProjectionArtifact.payloadFingerprint,
          },
    recipeReferences: request.recipes.map(recipeReference),
    evaluations,
    bindingCandidates,
    diagnostics,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
  const output = UniversalActionResultArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `universal-action-results.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [request.id]);
  }
  return { ok: true, value: output.data };
};

export const verifyUniversalActionResultArtifactIntegrity = (
  value: unknown,
): UniversalActionResultIntegrityResult => {
  const parsed = UniversalActionResultArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  if (parsed.data.compilerVersion !== UNIVERSAL_ACTION_RESULT_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${parsed.data.id} uses unsupported compiler ${parsed.data.compilerVersion}.`,
      },
    };
  }
  const replay = compileUniversalActionResults(parsed.data.compileRequest);
  if (!replay.ok) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_FAILED',
        message: `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  if (!sameCanonicalValue(parsed.data, replay.value)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: `${parsed.data.id} does not match deterministic D-213 replay.`,
      },
    };
  }
  return { ok: true, value: parsed.data };
};
