import {
  InstrumentItemResponseCompilationArtifactSchema,
  InstrumentItemResponseCompileRequestSchema,
  type FindingProjectionHorizon,
  type DecisionActionHorizon,
  type InstrumentInformationActionHorizon,
  type InstrumentDefinition,
  type InstrumentItemDefinition,
  type InstrumentItemResponse,
  type InstrumentItemResponseCompilationArtifact,
  type InstrumentItemResponseCompileRequest,
  type InstrumentItemResponseCompilerFingerprint,
  type InstrumentItemResponseCoverageDiagnostic,
  type InstrumentItemResponseCoverageDiagnosticCode,
  type InstrumentItemResponseEvaluation,
  type UniversalInformationActionCatalog,
} from '@psychsim/schemas';

import {
  fingerprintFindingProjectionHorizon,
  verifyCompiledSharedFindingContext,
} from './shared-finding-compiler';

export const INSTRUMENT_ITEM_RESPONSE_COMPILER_VERSION = '1.0.0';

export type InstrumentItemResponseCompileErrorCode =
  | 'INVALID_REQUEST'
  | 'COMPILED_FINDING_CONTEXT_INVALID'
  | 'INVALID_OUTPUT';

export type InstrumentItemResponseCompileResult =
  | { readonly ok: true; readonly value: InstrumentItemResponseCompilationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: InstrumentItemResponseCompileErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type InstrumentItemResponseIntegrityResult =
  | { readonly ok: true; readonly value: InstrumentItemResponseCompilationArtifact }
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

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value
      .map(canonicalize)
      .sort((left, right) => compareStrings(JSON.stringify(left), JSON.stringify(right)));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
};

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

const fingerprint = (scope: string, value: unknown): InstrumentItemResponseCompilerFingerprint =>
  `fingerprint.instrument-item-response.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalize(value)),
  )}`;

const exactFingerprint = (
  scope: string,
  value: unknown,
): InstrumentItemResponseCompilerFingerprint =>
  `fingerprint.instrument-item-response.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalize(value)))}`;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const targetKey = (target: {
  readonly instrumentDefinitionId: string;
  readonly instrumentContentVersion: string;
  readonly itemId: string;
}): string =>
  [target.instrumentDefinitionId, target.instrumentContentVersion, target.itemId].join('\u0000');

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const normalizeProjectionHorizon = (
  horizon: FindingProjectionHorizon,
): FindingProjectionHorizon => ({
  ...horizon,
  targets: [...horizon.targets].sort((left, right) =>
    compareStrings(JSON.stringify(left.target), JSON.stringify(right.target)),
  ),
});

const normalizeActionCatalog = (
  catalog: UniversalInformationActionCatalog,
): UniversalInformationActionCatalog => ({
  ...catalog,
  actions: [...catalog.actions]
    .map((action) => ({
      ...action,
      searchAliases: [...action.searchAliases].sort(compareStrings),
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
});

const normalizeActionHorizon = (
  horizon: InstrumentInformationActionHorizon,
): InstrumentInformationActionHorizon => ({
  ...horizon,
  informationActionIds: uniqueSorted(horizon.informationActionIds),
});

/**
 * D-221 derives the narrow D-220 action context from the full encounter
 * horizon. Unrelated medication, intervention, and disposition edits neither
 * enter nor invalidate this instrument-administration horizon.
 */
export const deriveInstrumentInformationActionHorizon = (
  horizon: Pick<DecisionActionHorizon, 'schemaVersion' | 'id' | 'informationActionIds'>,
): InstrumentInformationActionHorizon => {
  const informationActionIds = uniqueSorted(horizon.informationActionIds);
  return {
    schemaVersion: horizon.schemaVersion,
    id: stableId('instrument-information-action-horizon', {
      decisionActionHorizonId: horizon.id,
      informationActionIds,
    }),
    informationActionIds,
  };
};

const normalizeInstrumentDefinition = (definition: InstrumentDefinition): InstrumentDefinition => ({
  ...definition,
  items: [...definition.items]
    .map((item) => ({
      ...item,
      responseOptionIds: uniqueSorted(item.responseOptionIds),
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
});

const normalizeRequest = (
  request: InstrumentItemResponseCompileRequest,
): InstrumentItemResponseCompileRequest => ({
  ...request,
  findingProjectionHorizon: normalizeProjectionHorizon(request.findingProjectionHorizon),
  actionCatalog: normalizeActionCatalog(request.actionCatalog),
  actionHorizon: normalizeActionHorizon(request.actionHorizon),
  instrumentDefinitions: [...request.instrumentDefinitions]
    .map(normalizeInstrumentDefinition)
    .sort((left, right) => compareStrings(left.id, right.id)),
});

export const fingerprintInstrumentDefinition = (
  definition: InstrumentDefinition,
): InstrumentItemResponseCompilerFingerprint =>
  fingerprint('instrument-definition', normalizeInstrumentDefinition(definition));

export const fingerprintInstrumentItemDefinition = (
  instrumentDefinition: InstrumentDefinition,
  itemDefinition: InstrumentItemDefinition,
): InstrumentItemResponseCompilerFingerprint =>
  fingerprint('instrument-item-definition', {
    instrumentDefinitionId: instrumentDefinition.id,
    instrumentContentVersion: instrumentDefinition.contentVersion,
    item: {
      ...itemDefinition,
      responseOptionIds: uniqueSorted(itemDefinition.responseOptionIds),
    },
  });

const fingerprintActionCatalog = (
  catalog: UniversalInformationActionCatalog,
): InstrumentItemResponseCompilerFingerprint =>
  fingerprint('action-catalog', normalizeActionCatalog(catalog));

const fingerprintActionHorizon = (
  horizon: InstrumentInformationActionHorizon,
): InstrumentItemResponseCompilerFingerprint =>
  fingerprint('action-horizon', normalizeActionHorizon(horizon));

const fail = (
  code: InstrumentItemResponseCompileErrorCode,
  message: string,
  contentIds: readonly string[],
): InstrumentItemResponseCompileResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

interface EvaluationAccumulator {
  readonly evaluation: InstrumentItemResponseEvaluation;
  readonly response: InstrumentItemResponse | null;
  readonly diagnostics: readonly InstrumentItemResponseCoverageDiagnostic[];
}

const makeDiagnostic = (
  code: InstrumentItemResponseCoverageDiagnosticCode,
  target: Extract<
    FindingProjectionHorizon['targets'][number]['target'],
    { readonly kind: 'instrument_item' }
  >,
  contentIds: readonly string[],
  message: string,
): InstrumentItemResponseCoverageDiagnostic => ({
  schemaVersion: 1,
  id: stableId(`diagnostic.instrument-item-response.${code}`, {
    target,
    contentIds: uniqueSorted(contentIds),
  }),
  code,
  target,
  contentIds: uniqueSorted(contentIds),
  message,
});

const incompleteEvaluation = (
  target: Extract<
    FindingProjectionHorizon['targets'][number]['target'],
    { readonly kind: 'instrument_item' }
  >,
  input: {
    readonly definitionFingerprint: InstrumentItemResponseCompilerFingerprint | null;
    readonly itemFingerprint: InstrumentItemResponseCompilerFingerprint | null;
    readonly informationActionId: string | null;
    readonly projectionIds: readonly string[];
    readonly diagnostics: readonly InstrumentItemResponseCoverageDiagnostic[];
  },
): EvaluationAccumulator => ({
  evaluation: {
    schemaVersion: 1,
    target,
    status: 'incomplete_coverage',
    instrumentDefinitionFingerprint: input.definitionFingerprint,
    itemDefinitionFingerprint: input.itemFingerprint,
    informationActionId: input.informationActionId,
    resolvedProjectionIds: uniqueSorted(input.projectionIds),
    responseId: null,
    diagnosticIds: input.diagnostics.map((diagnostic) => diagnostic.id).sort(compareStrings),
  },
  response: null,
  diagnostics: input.diagnostics,
});

const evaluateInstrumentTarget = (
  request: InstrumentItemResponseCompileRequest,
  availability: FindingProjectionHorizon['targets'][number] & {
    readonly target: Extract<
      FindingProjectionHorizon['targets'][number]['target'],
      { readonly kind: 'instrument_item' }
    >;
  },
): EvaluationAccumulator => {
  const target = availability.target;
  const definition = request.instrumentDefinitions.find(
    (candidate) => candidate.id === target.instrumentDefinitionId,
  );
  const targetProjectionIds = request.sharedFindingCompilation.projections
    .filter(
      (projection) =>
        projection.target.kind === 'instrument_item' &&
        targetKey(projection.target) === targetKey(target),
    )
    .map((projection) => projection.id)
    .sort(compareStrings);
  if (!definition) {
    const diagnostic = makeDiagnostic(
      'instrument_definition_missing',
      target,
      [target.instrumentDefinitionId],
      `${target.instrumentDefinitionId}@${target.instrumentContentVersion} is not present in the exact instrument-definition input.`,
    );
    return incompleteEvaluation(target, {
      definitionFingerprint: null,
      itemFingerprint: null,
      informationActionId: null,
      projectionIds: targetProjectionIds,
      diagnostics: [diagnostic],
    });
  }
  const definitionFingerprint = fingerprintInstrumentDefinition(definition);
  if (definition.contentVersion !== target.instrumentContentVersion) {
    const diagnostic = makeDiagnostic(
      'instrument_definition_missing',
      target,
      [definition.id],
      `${target.instrumentDefinitionId} is present only at ${definition.contentVersion}; the target requires ${target.instrumentContentVersion}.`,
    );
    return incompleteEvaluation(target, {
      definitionFingerprint,
      itemFingerprint: null,
      informationActionId: null,
      projectionIds: targetProjectionIds,
      diagnostics: [diagnostic],
    });
  }
  const item = definition.items.find((candidate) => candidate.id === target.itemId);
  const itemFingerprint = item ? fingerprintInstrumentItemDefinition(definition, item) : null;
  if (!item) {
    const diagnostic = makeDiagnostic(
      'item_definition_missing',
      target,
      [definition.id, target.itemId],
      `${target.itemId} is not owned by ${definition.id}@${definition.contentVersion}.`,
    );
    return incompleteEvaluation(target, {
      definitionFingerprint,
      itemFingerprint,
      informationActionId: null,
      projectionIds: targetProjectionIds,
      diagnostics: [diagnostic],
    });
  }

  const diagnostics: InstrumentItemResponseCoverageDiagnostic[] = [];
  if (definition.lifecycle !== 'approved' || definition.medicalReviewStatus !== 'approved') {
    diagnostics.push(
      makeDiagnostic(
        'instrument_definition_not_approved',
        target,
        [definition.id],
        `${definition.id}@${definition.contentVersion} is retained for audit but is not approved for compilation.`,
      ),
    );
  }
  if (!request.actionCatalog.actions.some((action) => action.id === item.informationActionId)) {
    diagnostics.push(
      makeDiagnostic(
        'information_action_missing',
        target,
        [definition.id, item.id, item.informationActionId],
        `${item.informationActionId} is not present in the exact universal information-action catalog.`,
      ),
    );
  } else if (!request.actionHorizon.informationActionIds.includes(item.informationActionId)) {
    diagnostics.push(
      makeDiagnostic(
        'information_action_outside_horizon',
        target,
        [definition.id, item.id, item.informationActionId],
        `${item.informationActionId} is not available in the focused decision-action horizon.`,
      ),
    );
  } else {
    const action = request.actionCatalog.actions.find(
      (candidate) => candidate.id === item.informationActionId,
    )!;
    if (action.resultSource !== item.respondentSourceKind) {
      diagnostics.push(
        makeDiagnostic(
          'information_action_source_mismatch',
          target,
          [definition.id, item.id, item.informationActionId],
          `${item.informationActionId} uses ${action.resultSource}, not the reviewed ${item.respondentSourceKind} instrument respondent source.`,
        ),
      );
    }
  }
  const allowedResponseOptionIds = availability.allowedResponses
    .flatMap((response) => (response.kind === 'response_option' ? [response.responseOptionId] : []))
    .sort(compareStrings);
  if (
    allowedResponseOptionIds.length !== availability.allowedResponses.length ||
    allowedResponseOptionIds.join('\u0000') !==
      [...item.responseOptionIds].sort(compareStrings).join('\u0000')
  ) {
    diagnostics.push(
      makeDiagnostic(
        'instrument_target_response_options_invalid',
        target,
        [definition.id, item.id],
        `${target.itemId} must expose exactly its reviewed response-option set in the frozen projection horizon.`,
      ),
    );
  }
  if (availability.expressionDisplayChannel !== null) {
    diagnostics.push(
      makeDiagnostic(
        'instrument_target_display_channel_not_null',
        target,
        [definition.id, item.id],
        `${target.itemId} cannot use an unstructured finding-expression display channel.`,
      ),
    );
  }

  const projections = request.sharedFindingCompilation.projections
    .filter(
      (projection) =>
        projection.target.kind === 'instrument_item' &&
        targetKey(projection.target) === targetKey(target),
    )
    .sort((left, right) => compareStrings(left.id, right.id));
  if (projections.length === 0) {
    diagnostics.push(
      makeDiagnostic(
        'response_not_resolved',
        target,
        [definition.id, item.id],
        `${target.itemId} has no frozen D-193 response projection.`,
      ),
    );
  } else if (projections.length > 1) {
    diagnostics.push(
      makeDiagnostic(
        'multiple_responses_resolved',
        target,
        [definition.id, item.id, ...projections.map((projection) => projection.id)],
        `${target.itemId} has multiple frozen D-193 response projections; D-220 will not choose or deduplicate them.`,
      ),
    );
  } else if (projections[0]!.response.kind !== 'response_option') {
    diagnostics.push(
      makeDiagnostic(
        'response_option_required',
        target,
        [definition.id, item.id, projections[0]!.id],
        `${target.itemId} requires an explicit response-option projection.`,
      ),
    );
  } else if (projections[0]!.selectedExpression !== null) {
    diagnostics.push(
      makeDiagnostic(
        'instrument_projection_expression_present',
        target,
        [definition.id, item.id, projections[0]!.id],
        `${target.itemId} cannot substitute an unstructured finding expression for instrument-owned presentation.`,
      ),
    );
  } else if (!item.responseOptionIds.includes(projections[0]!.response.responseOptionId)) {
    diagnostics.push(
      makeDiagnostic(
        'response_option_not_allowed',
        target,
        [definition.id, item.id, projections[0]!.response.responseOptionId],
        `${projections[0]!.response.responseOptionId} is not admitted by ${target.itemId}.`,
      ),
    );
  }

  if (diagnostics.length > 0) {
    return incompleteEvaluation(target, {
      definitionFingerprint,
      itemFingerprint,
      informationActionId: item.informationActionId,
      projectionIds: projections.map((projection) => projection.id),
      diagnostics: diagnostics.sort((left, right) => compareStrings(left.id, right.id)),
    });
  }

  const projection = projections[0]!;
  if (projection.response.kind !== 'response_option') {
    const diagnostic = makeDiagnostic(
      'response_option_required',
      target,
      [definition.id, item.id, projection.id],
      `${target.itemId} requires an explicit response-option projection.`,
    );
    return incompleteEvaluation(target, {
      definitionFingerprint,
      itemFingerprint,
      informationActionId: item.informationActionId,
      projectionIds: [projection.id],
      diagnostics: [diagnostic],
    });
  }
  const response: InstrumentItemResponse = {
    schemaVersion: 1,
    id: stableId('instrument-item-response', {
      target,
      projectionId: projection.id,
      projectionContentVersion: projection.projectionContentVersion,
      responseOptionId: projection.response.responseOptionId,
    }),
    instrumentDefinitionId: definition.id,
    instrumentContentVersion: definition.contentVersion,
    itemId: item.id,
    responseScaleId: item.responseScaleId,
    responseOptionId: projection.response.responseOptionId,
    timeScopeId: item.timeScopeId,
    respondentSourceKind: item.respondentSourceKind,
    rightsBoundaryId: definition.rightsBoundaryId,
    interpretationIds: [],
    contributingResolvedFindingIds: uniqueSorted(projection.contributingResolvedFindingIds),
    propositionIds: uniqueSorted(projection.propositionIds),
    evidenceIds: uniqueSorted(projection.evidenceIds),
    projectionId: projection.projectionId,
    projectionContentVersion: projection.projectionContentVersion,
  };
  return {
    evaluation: {
      schemaVersion: 1,
      target,
      status: 'complete',
      instrumentDefinitionFingerprint: definitionFingerprint,
      itemDefinitionFingerprint: itemFingerprint!,
      informationActionId: item.informationActionId,
      resolvedProjectionIds: [projection.id],
      responseId: response.id,
      diagnosticIds: [],
    },
    response,
    diagnostics: [],
  };
};

const artifactPayload = (
  artifact: Omit<InstrumentItemResponseCompilationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => artifact;

export const compileInstrumentItemResponses = (
  input: unknown,
): InstrumentItemResponseCompileResult => {
  const parsed = InstrumentItemResponseCompileRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }
  const exactFindingContext = verifyCompiledSharedFindingContext({
    compiled: parsed.data.sharedFindingCompilation,
    projectionHorizon: parsed.data.findingProjectionHorizon,
  });
  if (!exactFindingContext.ok) {
    return fail('COMPILED_FINDING_CONTEXT_INVALID', exactFindingContext.error.message, [
      parsed.data.sharedFindingCompilation.id,
      parsed.data.findingProjectionHorizon.id,
    ]);
  }

  const request = normalizeRequest(parsed.data);
  const inputFingerprint = fingerprint('input', request);
  const instrumentTargets = request.findingProjectionHorizon.targets
    .flatMap((entry) =>
      entry.target.kind === 'instrument_item'
        ? [
            {
              ...entry,
              target: entry.target,
            },
          ]
        : [],
    )
    .sort((left, right) => compareStrings(targetKey(left.target), targetKey(right.target)));
  const accumulators = instrumentTargets.map((availability) =>
    evaluateInstrumentTarget(request, availability),
  );
  const evaluations = accumulators.map((entry) => entry.evaluation);
  const responses = accumulators
    .flatMap((entry) => (entry.response === null ? [] : [entry.response]))
    .sort((left, right) => compareStrings(left.id, right.id));
  const diagnostics = accumulators
    .flatMap((entry) => entry.diagnostics)
    .sort((left, right) => compareStrings(left.id, right.id));
  const payload: Omit<InstrumentItemResponseCompilationArtifact, 'id' | 'payloadFingerprint'> = {
    schemaVersion: 1,
    compilerVersion: INSTRUMENT_ITEM_RESPONSE_COMPILER_VERSION,
    requestId: request.id,
    status: evaluations.some((evaluation) => evaluation.status === 'incomplete_coverage')
      ? 'incomplete_coverage'
      : 'complete',
    patientStateId: request.sharedFindingCompilation.patientStateId,
    sharedFindingCompilationRef: {
      id: request.sharedFindingCompilation.id,
      payloadFingerprint: request.sharedFindingCompilation.payloadFingerprint,
    },
    findingProjectionHorizonRef: {
      id: request.findingProjectionHorizon.id,
      fingerprint: fingerprintFindingProjectionHorizon(request.findingProjectionHorizon),
    },
    actionCatalogRef: {
      id: request.actionCatalog.id,
      contentVersion: request.actionCatalog.contentVersion,
      fingerprint: fingerprintActionCatalog(request.actionCatalog),
    },
    actionHorizonRef: {
      id: request.actionHorizon.id,
      fingerprint: fingerprintActionHorizon(request.actionHorizon),
    },
    instrumentDefinitionRefs: request.instrumentDefinitions.map((definition) => ({
      id: definition.id,
      contentVersion: definition.contentVersion,
      fingerprint: fingerprintInstrumentDefinition(definition),
    })),
    evaluations,
    responses,
    diagnostics,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = exactFingerprint('compiler-output', artifactPayload(payload));
  const artifact = InstrumentItemResponseCompilationArtifactSchema.safeParse({
    ...payload,
    id: `instrument-item-responses.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!artifact.success) {
    return fail('INVALID_OUTPUT', issuesText(artifact.error.issues), [
      request.id,
      ...instrumentTargets.flatMap(({ target }) => [target.instrumentDefinitionId, target.itemId]),
    ]);
  }
  return { ok: true, value: artifact.data };
};

export const verifyInstrumentItemResponseCompilationIntegrity = (
  value: unknown,
): InstrumentItemResponseIntegrityResult => {
  const parsed = InstrumentItemResponseCompilationArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  if (parsed.data.compilerVersion !== INSTRUMENT_ITEM_RESPONSE_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${parsed.data.id} uses unsupported instrument item-response compiler ${parsed.data.compilerVersion}.`,
      },
    };
  }
  const replay = compileInstrumentItemResponses(parsed.data.compileRequest);
  if (!replay.ok) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_FAILED',
        message: replay.error.message,
      },
    };
  }
  if (!sameExactValue(replay.value, parsed.data)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: `${parsed.data.id} does not match deterministic replay of its frozen compile request.`,
      },
    };
  }
  return { ok: true, value: parsed.data };
};
