import {
  EncounterResultBindingRequestSchema,
  FrozenInstrumentItemResponseSchema,
  FrozenStructuredPatientStateRevealSchema,
  FrozenTargetScopedPatientValueRevealSchema,
  type EncounterResultBindingRequest,
  type FrozenInstrumentItemResponse,
  type FrozenStructuredPatientStateReveal,
  type FrozenTargetScopedPatientValueReveal,
  type StructuredPatientStateRevealProjectionEnvelope,
  type UniversalActionResultArtifact,
} from '@psychsim/schemas';

import { verifyUniversalActionResultArtifactIntegrity } from './universal-action-result-compiler';

export interface UniversalActionResultAttachment {
  resultBindingRequests: EncounterResultBindingRequest[];
  structuredStateReveals: FrozenStructuredPatientStateReveal[];
  instrumentItemResponses: FrozenInstrumentItemResponse[];
  targetScopedPatientValueReveals: FrozenTargetScopedPatientValueReveal[];
}

export type UniversalActionResultAttachmentErrorCode =
  | 'INVALID_ARTIFACT'
  | 'INCOMPLETE_COVERAGE'
  | 'ACTION_HORIZON_MISMATCH'
  | 'SOURCE_CONTEXT_MISMATCH'
  | 'INVALID_OUTPUT';

export type UniversalActionResultAttachmentResult =
  | { readonly ok: true; readonly value: UniversalActionResultAttachment }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: UniversalActionResultAttachmentErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
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

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: UniversalActionResultAttachmentErrorCode,
  message: string,
  contentIds: readonly string[],
): UniversalActionResultAttachmentResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

const possibleStableId = (value: unknown): string[] => {
  if (
    value !== null &&
    typeof value === 'object' &&
    'id' in value &&
    typeof (value as { readonly id?: unknown }).id === 'string'
  ) {
    return [(value as { readonly id: string }).id];
  }
  return [];
};

const versionedKey = (value: { readonly id: string; readonly contentVersion: string }): string =>
  `${value.id}\u0000${value.contentVersion}`;

type StructuredRevealSingletonStatement =
  StructuredPatientStateRevealProjectionEnvelope['resolved']['singletonStatements'][number];

const sanitizeSingletonStatement = (
  statement: StructuredRevealSingletonStatement,
): FrozenStructuredPatientStateReveal['singletonStatements'][number] => {
  switch (statement.field) {
    case 'reaction_history_status':
      return {
        field: statement.field,
        presentedValue: statement.presentedValue,
      };
    case 'medication_reaction_assessment_status':
      return {
        field: statement.field,
        presentedValue: statement.presentedValue,
      };
    case 'reported_safety_planning_ability':
      return {
        field: statement.field,
        presentedValue: statement.presentedValue,
      };
  }
};

const sanitizeStructuredReveal = (
  envelope: StructuredPatientStateRevealProjectionEnvelope,
): unknown => ({
  schemaVersion: envelope.resolved.schemaVersion,
  id: envelope.resolved.id,
  definitionId: envelope.resolved.definitionId,
  definitionContentVersion: envelope.resolved.definitionContentVersion,
  informationActionId: envelope.resolved.informationActionId,
  informationActionPayloadFingerprint: envelope.resolved.informationActionPayloadFingerprint,
  patientStateId: envelope.resolved.patientStateId,
  source: { ...envelope.resolved.source },
  timeScopeId: envelope.resolved.timeScopeId,
  laneStatements: envelope.resolved.laneStatements.map((statement) => ({
    lane: statement.lane,
    presentationStatus: statement.presentationStatus,
    presentedRecordIds: [...statement.includedTruthRecordIds],
  })),
  singletonStatements: envelope.resolved.singletonStatements.map(sanitizeSingletonStatement),
});

const sameIdSet = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length &&
  uniqueSorted(left).join('\u0000') === uniqueSorted(right).join('\u0000');

const validateActionHorizon = (
  artifact: UniversalActionResultArtifact,
  expectedInformationActionIds: readonly string[] | undefined,
): UniversalActionResultAttachmentResult | null => {
  const horizonIds = artifact.compileRequest.actionHorizon.informationActionIds;
  const candidateIds = artifact.bindingCandidates.map((candidate) => candidate.informationActionId);
  if (
    new Set(candidateIds).size !== candidateIds.length ||
    !sameIdSet(candidateIds, horizonIds) ||
    (expectedInformationActionIds !== undefined &&
      !sameIdSet(horizonIds, expectedInformationActionIds))
  ) {
    return fail(
      'ACTION_HORIZON_MISMATCH',
      'D-214 requires exactly one complete D-213 binding candidate for every expected information action.',
      [artifact.id, ...horizonIds, ...candidateIds, ...(expectedInformationActionIds ?? [])],
    );
  }
  return null;
};

/**
 * Mechanically translates one complete, verified D-213 artifact. It performs
 * no finding generation, action selection, scoring, economy, complexity
 * accounting, reveal, persistence, or runtime work.
 */
export const translateUniversalActionResultArtifact = (
  value: unknown,
  expectedInformationActionIds?: readonly string[],
): UniversalActionResultAttachmentResult => {
  const integrity = verifyUniversalActionResultArtifactIntegrity(value);
  if (!integrity.ok) {
    return fail('INVALID_ARTIFACT', integrity.error.message, possibleStableId(value));
  }
  const artifact = integrity.value;
  if (artifact.status !== 'complete') {
    return fail(
      'INCOMPLETE_COVERAGE',
      `${artifact.id} does not provide complete result coverage for its focused information-action horizon.`,
      [artifact.id, ...artifact.diagnostics.map((diagnostic) => diagnostic.id)],
    );
  }
  const horizonError = validateActionHorizon(artifact, expectedInformationActionIds);
  if (horizonError !== null) return horizonError;

  const request = artifact.compileRequest;
  const findingProjections = new Map(
    request.sharedFindingCompilation.projections.map((projection) => [projection.id, projection]),
  );
  const structuredReveals = new Map(
    request.structuredRevealEnvelopes.map((envelope) => [envelope.resolved.id, envelope]),
  );
  const measurements = new Map(
    request.patientState.measurements.map((measurement) => [measurement.id, measurement]),
  );
  const measurementDefinitions = new Map(
    request.measurementDefinitions.map((definition) => [versionedKey(definition), definition]),
  );
  const observations = new Map(
    request.patientState.categoricalObservations.map((observation) => [
      observation.id,
      observation,
    ]),
  );
  const observationDefinitions = new Map(
    request.categoricalObservationDefinitions.map((definition) => [
      versionedKey(definition),
      definition,
    ]),
  );
  const testResults = new Map(
    request.patientState.structuredTestResults.map((result) => [result.id, result]),
  );
  const testDefinitions = new Map(
    request.testDefinitions.map((definition) => [versionedKey(definition), definition]),
  );
  const instrumentResponses = new Map(
    request.instrumentItemResponseCompilation.responses.map((response) => [response.id, response]),
  );
  const instrumentEvaluationsByResponseId = new Map(
    request.instrumentItemResponseCompilation.evaluations.flatMap((evaluation) =>
      evaluation.status === 'complete' ? [[evaluation.responseId, evaluation] as const] : [],
    ),
  );
  const targetScopedArtifact = request.targetScopedPatientValueProjectionArtifact;
  const targetScopedReveals = new Map(
    (targetScopedArtifact?.frozenReveals ?? []).map((reveal) => [reveal.id, reveal]),
  );
  const targetScopedEvaluationsByRevealId = new Map(
    (targetScopedArtifact?.evaluations ?? []).flatMap((evaluation) =>
      evaluation.status === 'complete' ? [[evaluation.frozenRevealId, evaluation] as const] : [],
    ),
  );

  const referencedStructuredRevealIds = new Set<string>();
  const referencedInstrumentResponseIds = new Set<string>();
  const referencedTargetScopedRevealIds = new Set<string>();
  const resultBindingRequests: EncounterResultBindingRequest[] = [];

  for (const candidate of artifact.bindingCandidates) {
    const selectors: EncounterResultBindingRequest['sources'] = [];
    for (const source of candidate.sources) {
      switch (source.kind) {
        case 'finding_projection': {
          const projection = findingProjections.get(source.resolvedProjectionId);
          if (
            projection === undefined ||
            projection.projectionId !== source.projectionId ||
            projection.projectionContentVersion !== source.projectionContentVersion ||
            projection.target.kind !== 'information_action' ||
            projection.target.actionId !== candidate.informationActionId
          ) {
            return fail(
              'SOURCE_CONTEXT_MISMATCH',
              `${source.resolvedProjectionId} is not the exact D-193 projection for ${candidate.informationActionId}.`,
              [artifact.id, candidate.id, source.resolvedProjectionId, source.projectionId],
            );
          }
          selectors.push({
            kind: 'finding_projection',
            projectionId: source.projectionId,
            projectionContentVersion: source.projectionContentVersion,
          });
          break;
        }
        case 'structured_state_reveal': {
          const envelope = structuredReveals.get(source.resolvedProjectionId);
          if (
            envelope === undefined ||
            envelope.definition.id !== source.definitionId ||
            envelope.definition.contentVersion !== source.definitionContentVersion ||
            envelope.definition.informationActionId !== candidate.informationActionId ||
            envelope.resolved.definitionId !== source.definitionId ||
            envelope.resolved.definitionContentVersion !== source.definitionContentVersion ||
            envelope.resolved.informationActionId !== candidate.informationActionId ||
            envelope.resolved.patientStateId !== request.patientState.id ||
            !sameExactValue(envelope.patientState, request.patientState)
          ) {
            return fail(
              'SOURCE_CONTEXT_MISMATCH',
              `${source.resolvedProjectionId} is not an exact D-212 source view for ${candidate.informationActionId} and the frozen patient state.`,
              [
                artifact.id,
                candidate.id,
                source.resolvedProjectionId,
                source.definitionId,
                request.patientState.id,
              ],
            );
          }
          referencedStructuredRevealIds.add(envelope.resolved.id);
          selectors.push({
            kind: 'structured_state_reveal',
            resolvedProjectionId: envelope.resolved.id,
            definitionId: envelope.definition.id,
            definitionContentVersion: envelope.definition.contentVersion,
          });
          break;
        }
        case 'measurement': {
          const measurement = measurements.get(source.measurementId);
          const definition = measurementDefinitions.get(
            `${source.definitionId}\u0000${source.definitionContentVersion}`,
          );
          if (
            measurement === undefined ||
            definition === undefined ||
            measurement.definitionId !== definition.id ||
            measurement.definitionContentVersion !== definition.contentVersion ||
            !definition.availableThroughActionIds.includes(candidate.informationActionId)
          ) {
            return fail(
              'SOURCE_CONTEXT_MISMATCH',
              `${source.measurementId} is not an exact measurement available through ${candidate.informationActionId}.`,
              [artifact.id, candidate.id, source.measurementId, source.definitionId],
            );
          }
          selectors.push({ kind: 'measurement', measurementId: source.measurementId });
          break;
        }
        case 'categorical_observation': {
          const observation = observations.get(source.categoricalObservationId);
          const definition = observationDefinitions.get(
            `${source.definitionId}\u0000${source.definitionContentVersion}`,
          );
          if (
            observation === undefined ||
            definition === undefined ||
            observation.definitionId !== definition.id ||
            observation.definitionContentVersion !== definition.contentVersion ||
            !definition.availableThroughActionIds.includes(candidate.informationActionId)
          ) {
            return fail(
              'SOURCE_CONTEXT_MISMATCH',
              `${source.categoricalObservationId} is not an exact observation available through ${candidate.informationActionId}.`,
              [artifact.id, candidate.id, source.categoricalObservationId, source.definitionId],
            );
          }
          selectors.push({
            kind: 'categorical_observation',
            categoricalObservationId: source.categoricalObservationId,
          });
          break;
        }
        case 'structured_test_result': {
          const result = testResults.get(source.structuredTestResultId);
          const definition = testDefinitions.get(
            `${source.testDefinitionId}\u0000${source.testDefinitionContentVersion}`,
          );
          if (
            result === undefined ||
            definition === undefined ||
            result.testDefinitionId !== definition.id ||
            result.testDefinitionContentVersion !== definition.contentVersion ||
            definition.actionId !== candidate.informationActionId
          ) {
            return fail(
              'SOURCE_CONTEXT_MISMATCH',
              `${source.structuredTestResultId} is not the exact structured test result for ${candidate.informationActionId}.`,
              [artifact.id, candidate.id, source.structuredTestResultId, source.testDefinitionId],
            );
          }
          selectors.push({
            kind: 'structured_test_result',
            structuredTestResultId: source.structuredTestResultId,
          });
          break;
        }
        case 'instrument_item_response': {
          const response = instrumentResponses.get(source.responseId);
          const evaluation = instrumentEvaluationsByResponseId.get(source.responseId);
          if (
            response === undefined ||
            evaluation === undefined ||
            evaluation.informationActionId !== candidate.informationActionId ||
            response.instrumentDefinitionId !== source.instrumentDefinitionId ||
            response.instrumentContentVersion !== source.instrumentContentVersion ||
            response.itemId !== source.itemId
          ) {
            return fail(
              'SOURCE_CONTEXT_MISMATCH',
              `${source.responseId} is not the exact D-220 instrument response for ${candidate.informationActionId}.`,
              [
                artifact.id,
                candidate.id,
                source.responseId,
                source.instrumentDefinitionId,
                source.itemId,
              ],
            );
          }
          referencedInstrumentResponseIds.add(response.id);
          selectors.push({
            kind: 'instrument_item_response',
            responseId: response.id,
            instrumentDefinitionId: response.instrumentDefinitionId,
            instrumentContentVersion: response.instrumentContentVersion,
            itemId: response.itemId,
          });
          break;
        }
        case 'target_scoped_patient_value_reveal': {
          const reveal = targetScopedReveals.get(source.frozenRevealId);
          const evaluation = targetScopedEvaluationsByRevealId.get(source.frozenRevealId);
          if (
            reveal === undefined ||
            evaluation === undefined ||
            evaluation.informationActionId !== candidate.informationActionId ||
            evaluation.definitionId !== source.definitionId ||
            evaluation.definitionContentVersion !== source.definitionContentVersion ||
            evaluation.definitionFingerprint !== source.definitionFingerprint ||
            reveal.payloadFingerprint !== source.frozenRevealPayloadFingerprint ||
            reveal.definitionId !== source.definitionId ||
            reveal.definitionContentVersion !== source.definitionContentVersion ||
            reveal.definitionFingerprint !== source.definitionFingerprint ||
            reveal.informationActionId !== candidate.informationActionId ||
            reveal.patientStateId !== request.patientState.id
          ) {
            return fail(
              'SOURCE_CONTEXT_MISMATCH',
              `${source.frozenRevealId} is not the exact frozen target-scoped patient value for ${candidate.informationActionId}.`,
              [
                artifact.id,
                candidate.id,
                source.frozenRevealId,
                source.definitionId,
                request.patientState.id,
              ],
            );
          }
          referencedTargetScopedRevealIds.add(reveal.id);
          selectors.push({
            kind: 'target_scoped_patient_value_reveal',
            frozenRevealId: reveal.id,
            definitionId: reveal.definitionId,
            definitionContentVersion: reveal.definitionContentVersion,
            definitionFingerprint: reveal.definitionFingerprint,
          });
          break;
        }
      }
    }
    const parsedRequest = EncounterResultBindingRequestSchema.safeParse({
      schemaVersion: candidate.schemaVersion,
      id: candidate.id,
      informationActionId: candidate.informationActionId,
      sources: selectors,
    });
    if (!parsedRequest.success) {
      return fail(
        'INVALID_OUTPUT',
        `D-214 could not freeze encounter-result binding request ${candidate.id}: ${parsedRequest.error.issues
          .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
          .join('; ')}`,
        [artifact.id, candidate.id, candidate.informationActionId],
      );
    }
    resultBindingRequests.push(parsedRequest.data);
  }

  const frozenStructuredStateReveals: FrozenStructuredPatientStateReveal[] = [];
  for (const id of [...referencedStructuredRevealIds].sort(compareStrings)) {
    const parsedReveal = FrozenStructuredPatientStateRevealSchema.safeParse(
      sanitizeStructuredReveal(structuredReveals.get(id)!),
    );
    if (!parsedReveal.success) {
      return fail(
        'INVALID_OUTPUT',
        `D-214 could not freeze structured patient-state reveal ${id}: ${parsedReveal.error.issues
          .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
          .join('; ')}`,
        [artifact.id, id],
      );
    }
    frozenStructuredStateReveals.push(parsedReveal.data);
  }
  const frozenInstrumentItemResponses: FrozenInstrumentItemResponse[] = [];
  for (const id of [...referencedInstrumentResponseIds].sort(compareStrings)) {
    const response = instrumentResponses.get(id)!;
    const evaluation = instrumentEvaluationsByResponseId.get(id)!;
    const parsedResponse = FrozenInstrumentItemResponseSchema.safeParse({
      schemaVersion: response.schemaVersion,
      id: response.id,
      informationActionId: evaluation.informationActionId,
      instrumentDefinitionId: response.instrumentDefinitionId,
      instrumentContentVersion: response.instrumentContentVersion,
      itemId: response.itemId,
      responseScaleId: response.responseScaleId,
      responseOptionId: response.responseOptionId,
      timeScopeId: response.timeScopeId,
      respondentSourceKind: response.respondentSourceKind,
      rightsBoundaryId: response.rightsBoundaryId,
    });
    if (!parsedResponse.success) {
      return fail(
        'INVALID_OUTPUT',
        `D-214 could not freeze instrument item response ${id}: ${parsedResponse.error.issues
          .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
          .join('; ')}`,
        [artifact.id, id],
      );
    }
    frozenInstrumentItemResponses.push(parsedResponse.data);
  }
  const frozenTargetScopedPatientValueReveals: FrozenTargetScopedPatientValueReveal[] = [];
  for (const id of [...referencedTargetScopedRevealIds].sort(compareStrings)) {
    const reveal = targetScopedReveals.get(id)!;
    const parsedReveal = FrozenTargetScopedPatientValueRevealSchema.safeParse({
      schemaVersion: reveal.schemaVersion,
      id: reveal.id,
      definitionId: reveal.definitionId,
      definitionContentVersion: reveal.definitionContentVersion,
      definitionFingerprint: reveal.definitionFingerprint,
      informationActionId: reveal.informationActionId,
      informationActionPayloadFingerprint: reveal.informationActionPayloadFingerprint,
      patientStateId: reveal.patientStateId,
      values: reveal.values.map((value) => ({ ...value })),
      payloadFingerprint: reveal.payloadFingerprint,
    });
    if (!parsedReveal.success) {
      return fail(
        'INVALID_OUTPUT',
        `D-214 could not freeze target-scoped patient-value reveal ${id}: ${parsedReveal.error.issues
          .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
          .join('; ')}`,
        [artifact.id, id],
      );
    }
    frozenTargetScopedPatientValueReveals.push(parsedReveal.data);
  }

  return {
    ok: true,
    value: {
      resultBindingRequests,
      structuredStateReveals: frozenStructuredStateReveals,
      instrumentItemResponses: frozenInstrumentItemResponses,
      targetScopedPatientValueReveals: frozenTargetScopedPatientValueReveals,
    },
  };
};
