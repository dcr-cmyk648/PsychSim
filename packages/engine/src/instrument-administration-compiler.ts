import {
  InstrumentAdministrationCompilationArtifactSchema,
  InstrumentAdministrationCompileRequestSchema,
  InstrumentAdministrationResolutionEnvelopeSchema,
  type InstrumentAdministrationCompilationArtifact,
  type InstrumentAdministrationCompileRequest,
  type InstrumentAdministrationCompilerFingerprint,
  type InstrumentAdministrationDefinition,
  type InstrumentItemResponseCompilationArtifact,
} from '@psychsim/schemas';

import { verifyInstrumentItemResponseCompilationIntegrity } from './instrument-item-response-compiler';

export const INSTRUMENT_ADMINISTRATION_COMPILER_VERSION = '1.0.0';

export type InstrumentAdministrationCompileErrorCode =
  | 'INVALID_REQUEST'
  | 'ITEM_RESPONSE_COMPILATION_INVALID'
  | 'ADMINISTRATION_DEFINITION_NOT_APPROVED'
  | 'INSTRUMENT_DEFINITION_NOT_FOUND'
  | 'ITEM_RESPONSE_COVERAGE_INVALID'
  | 'INVALID_OUTPUT';

export type InstrumentAdministrationCompileResult =
  | { readonly ok: true; readonly value: InstrumentAdministrationCompilationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: InstrumentAdministrationCompileErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type InstrumentAdministrationIntegrityResult =
  | { readonly ok: true; readonly value: InstrumentAdministrationCompilationArtifact }
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

const fingerprint = (scope: string, value: unknown): InstrumentAdministrationCompilerFingerprint =>
  `fingerprint.instrument-administration.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalize(value)),
  )}`;

const exactFingerprint = (
  scope: string,
  value: unknown,
): InstrumentAdministrationCompilerFingerprint =>
  `fingerprint.instrument-administration.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalize(value)))}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const normalizeDefinition = (
  definition: InstrumentAdministrationDefinition,
): InstrumentAdministrationDefinition => ({
  ...definition,
  itemIds: uniqueSorted(definition.itemIds),
});

const normalizeRequest = (
  request: InstrumentAdministrationCompileRequest,
  verifiedItemResponses: InstrumentItemResponseCompilationArtifact,
): InstrumentAdministrationCompileRequest => ({
  ...request,
  instrumentItemResponseCompilation: verifiedItemResponses,
  administrationDefinition: normalizeDefinition(request.administrationDefinition),
  includedItemResponseIds: uniqueSorted(request.includedItemResponseIds),
  missingItemIds: uniqueSorted(request.missingItemIds),
});

export const fingerprintInstrumentAdministrationDefinition = (
  definition: InstrumentAdministrationDefinition,
): InstrumentAdministrationCompilerFingerprint =>
  fingerprint('definition', normalizeDefinition(definition));

const fail = (
  code: InstrumentAdministrationCompileErrorCode,
  message: string,
  contentIds: readonly string[],
): InstrumentAdministrationCompileResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

const artifactPayload = (
  artifact: Omit<InstrumentAdministrationCompilationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => artifact;

export const compileInstrumentAdministration = (
  input: unknown,
): InstrumentAdministrationCompileResult => {
  const parsed = InstrumentAdministrationCompileRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }

  const verifiedItemResponses = verifyInstrumentItemResponseCompilationIntegrity(
    parsed.data.instrumentItemResponseCompilation,
  );
  if (!verifiedItemResponses.ok) {
    return fail('ITEM_RESPONSE_COMPILATION_INVALID', verifiedItemResponses.error.message, [
      parsed.data.instrumentItemResponseCompilation.id,
    ]);
  }

  const request = normalizeRequest(parsed.data, verifiedItemResponses.value);
  const definition = request.administrationDefinition;
  if (definition.lifecycle !== 'approved' || definition.medicalReviewStatus !== 'approved') {
    return fail(
      'ADMINISTRATION_DEFINITION_NOT_APPROVED',
      `${definition.id}@${definition.contentVersion} is not an approved administration definition.`,
      [definition.id],
    );
  }

  const instrumentDefinition =
    verifiedItemResponses.value.compileRequest.instrumentDefinitions.find(
      (candidate) =>
        candidate.id === definition.instrumentDefinitionId &&
        candidate.contentVersion === definition.instrumentContentVersion,
    );
  if (!instrumentDefinition) {
    return fail(
      'INSTRUMENT_DEFINITION_NOT_FOUND',
      `${definition.id} does not reference an exact instrument definition in the D-220 artifact.`,
      [definition.id, definition.instrumentDefinitionId],
    );
  }

  const responsesById = new Map(
    verifiedItemResponses.value.responses.map((response) => [response.id, response] as const),
  );
  const selectedResponses = request.includedItemResponseIds.flatMap((responseId) => {
    const response = responsesById.get(responseId);
    return response ? [response] : [];
  });
  const selectedItemIds = new Set(selectedResponses.map((response) => response.itemId));
  const missingItemIds = new Set(request.missingItemIds);
  const diagnosticsById = new Map(
    verifiedItemResponses.value.diagnostics.map((diagnostic) => [diagnostic.id, diagnostic]),
  );
  const evaluationsByItemId = new Map(
    verifiedItemResponses.value.evaluations
      .filter(
        (evaluation) =>
          evaluation.target.instrumentDefinitionId === instrumentDefinition.id &&
          evaluation.target.instrumentContentVersion === instrumentDefinition.contentVersion,
      )
      .map((evaluation) => [evaluation.target.itemId, evaluation] as const),
  );

  const coverageErrors: string[] = [];
  if (selectedResponses.length !== request.includedItemResponseIds.length) {
    coverageErrors.push('Every included response ID must exist in the verified D-220 artifact.');
  }
  for (const itemId of definition.itemIds) {
    const evaluation = evaluationsByItemId.get(itemId);
    if (selectedItemIds.has(itemId)) {
      const selectedResponse = selectedResponses.find((response) => response.itemId === itemId);
      if (
        !evaluation ||
        evaluation.status !== 'complete' ||
        !selectedResponse ||
        evaluation.responseId !== selectedResponse.id
      ) {
        coverageErrors.push(
          `${itemId} is listed as included without its exact complete D-220 evaluation.`,
        );
      }
      continue;
    }
    if (!missingItemIds.has(itemId)) {
      coverageErrors.push(`${itemId} is neither included nor explicitly missing.`);
      continue;
    }
    if (!evaluation || evaluation.status !== 'incomplete_coverage') {
      coverageErrors.push(`${itemId} is listed as missing without an incomplete D-220 evaluation.`);
      continue;
    }
    const diagnosticCodes = evaluation.diagnosticIds.flatMap((diagnosticId) => {
      const diagnostic = diagnosticsById.get(diagnosticId);
      return diagnostic ? [diagnostic.code] : [];
    });
    if (
      diagnosticCodes.length !== evaluation.diagnosticIds.length ||
      diagnosticCodes.length === 0 ||
      diagnosticCodes.some((code) => code !== 'response_not_resolved')
    ) {
      coverageErrors.push(
        `${itemId} has a structural D-220 coverage failure rather than an explicitly missing response.`,
      );
    }
  }

  const administration = {
    schemaVersion: 1 as const,
    id: stableId('instrument-administration', {
      patientStateId: verifiedItemResponses.value.patientStateId,
      definitionId: definition.id,
      definitionContentVersion: definition.contentVersion,
      sourceInstanceId: request.sourceInstanceId,
      includedItemResponseIds: request.includedItemResponseIds,
      missingItemIds: request.missingItemIds,
      rawTotal: request.rawTotal,
    }),
    definitionId: definition.id,
    definitionContentVersion: definition.contentVersion,
    instrumentDefinitionId: instrumentDefinition.id,
    instrumentContentVersion: instrumentDefinition.contentVersion,
    patientStateId: verifiedItemResponses.value.patientStateId,
    informationActionId: definition.informationActionId,
    respondentSourceKind: definition.respondentSourceKind,
    sourceInstanceId: request.sourceInstanceId,
    timeScopeId: definition.timeScopeId,
    rightsBoundaryId: definition.rightsBoundaryId,
    completionStatus:
      request.missingItemIds.length === 0 ? ('complete' as const) : ('partial' as const),
    includedItemResponseIds: request.includedItemResponseIds,
    missingItemIds: request.missingItemIds,
    rawTotal: request.rawTotal,
  };
  const envelope = InstrumentAdministrationResolutionEnvelopeSchema.safeParse({
    instrumentDefinition,
    administrationDefinition: definition,
    itemResponses: selectedResponses,
    administration,
  });
  if (!envelope.success || coverageErrors.length > 0) {
    const envelopeErrors = envelope.success ? [] : [issuesText(envelope.error.issues)];
    return fail(
      'ITEM_RESPONSE_COVERAGE_INVALID',
      [...coverageErrors, ...envelopeErrors].join(' '),
      [
        definition.id,
        instrumentDefinition.id,
        ...request.includedItemResponseIds,
        ...request.missingItemIds,
      ],
    );
  }

  const inputFingerprint = fingerprint('input', request);
  const payload: Omit<InstrumentAdministrationCompilationArtifact, 'id' | 'payloadFingerprint'> = {
    schemaVersion: 1,
    compilerVersion: INSTRUMENT_ADMINISTRATION_COMPILER_VERSION,
    requestId: request.id,
    status: 'complete',
    patientStateId: verifiedItemResponses.value.patientStateId,
    instrumentItemResponseCompilationRef: {
      id: verifiedItemResponses.value.id,
      payloadFingerprint: verifiedItemResponses.value.payloadFingerprint,
    },
    administrationDefinitionRef: {
      id: definition.id,
      contentVersion: definition.contentVersion,
      fingerprint: fingerprintInstrumentAdministrationDefinition(definition),
    },
    administration: envelope.data.administration,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = exactFingerprint('compiler-output', artifactPayload(payload));
  const artifact = InstrumentAdministrationCompilationArtifactSchema.safeParse({
    ...payload,
    id: `instrument-administration.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!artifact.success) {
    return fail('INVALID_OUTPUT', issuesText(artifact.error.issues), [
      request.id,
      definition.id,
      instrumentDefinition.id,
    ]);
  }
  return { ok: true, value: artifact.data };
};

export const verifyInstrumentAdministrationCompilationIntegrity = (
  value: unknown,
): InstrumentAdministrationIntegrityResult => {
  const parsed = InstrumentAdministrationCompilationArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  if (parsed.data.compilerVersion !== INSTRUMENT_ADMINISTRATION_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${parsed.data.id} uses unsupported instrument administration compiler ${parsed.data.compilerVersion}.`,
      },
    };
  }
  const replay = compileInstrumentAdministration(parsed.data.compileRequest);
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
