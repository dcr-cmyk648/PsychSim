import {
  FrozenInstrumentItemResponseSchema,
  InstrumentAdministrationAttachmentArtifactSchema,
  InstrumentAdministrationAttachmentCompileRequestSchema,
  type FrozenInstrumentItemResponse,
  type InstrumentAdministrationAttachmentArtifact,
  type InstrumentAdministrationAttachmentCompileRequest,
  type InstrumentAdministrationAttachmentContext,
  type InstrumentAdministrationAttachmentFingerprint,
  type InstrumentAdministrationCompilationArtifact,
  type InstrumentAdministrationSourceValidationArtifact,
} from '@psychsim/schemas';

import { verifyInstrumentAdministrationSourceValidationIntegrity } from './instrument-administration-source-validation';

export const INSTRUMENT_ADMINISTRATION_ATTACHMENT_COMPILER_VERSION = '2.0.0';

export type InstrumentAdministrationAttachmentErrorCode =
  | 'INVALID_REQUEST'
  | 'ADMINISTRATION_SOURCE_VALIDATION_INVALID'
  | 'PATIENT_CONTEXT_MISMATCH'
  | 'ACTION_CONTEXT_MISMATCH'
  | 'ITEM_RESPONSE_CONTEXT_MISMATCH'
  | 'INVALID_OUTPUT';

export type InstrumentAdministrationAttachmentResult =
  | { readonly ok: true; readonly value: InstrumentAdministrationAttachmentArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: InstrumentAdministrationAttachmentErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type InstrumentAdministrationAttachmentIntegrityResult =
  | { readonly ok: true; readonly value: InstrumentAdministrationAttachmentArtifact }
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

const fingerprint = (
  scope: string,
  value: unknown,
): InstrumentAdministrationAttachmentFingerprint =>
  `fingerprint.instrument-administration-attachment.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const normalizeContext = (
  context: InstrumentAdministrationAttachmentContext,
): InstrumentAdministrationAttachmentContext => ({
  ...context,
  informationActionIds: uniqueSorted(context.informationActionIds),
  instrumentItemResponses: [...context.instrumentItemResponses].sort((left, right) =>
    compareStrings(left.id, right.id),
  ),
});

const normalizeRequest = (
  request: InstrumentAdministrationAttachmentCompileRequest,
  administrationSourceValidation: InstrumentAdministrationSourceValidationArtifact,
): InstrumentAdministrationAttachmentCompileRequest => ({
  ...request,
  attachmentContext: normalizeContext(request.attachmentContext),
  administrationSourceValidation,
});

export const fingerprintInstrumentAdministrationAttachmentContext = (
  context: InstrumentAdministrationAttachmentContext,
): InstrumentAdministrationAttachmentFingerprint =>
  fingerprint('context', normalizeContext(context));

const fail = (
  code: InstrumentAdministrationAttachmentErrorCode,
  message: string,
  contentIds: readonly string[],
): InstrumentAdministrationAttachmentResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

const projectIncludedResponse = (
  compilation: InstrumentAdministrationCompilationArtifact,
  responseId: string,
): FrozenInstrumentItemResponse | null => {
  const response = compilation.compileRequest.instrumentItemResponseCompilation.responses.find(
    (candidate) => candidate.id === responseId,
  );
  const evaluation = compilation.compileRequest.instrumentItemResponseCompilation.evaluations.find(
    (candidate) => candidate.status === 'complete' && candidate.responseId === responseId,
  );
  if (!response || !evaluation || evaluation.status !== 'complete') return null;
  const projected = FrozenInstrumentItemResponseSchema.safeParse({
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
  return projected.success ? projected.data : null;
};

const artifactPayload = (
  artifact: Omit<InstrumentAdministrationAttachmentArtifact, 'id' | 'payloadFingerprint'>,
): unknown => artifact;

export const compileInstrumentAdministrationAttachment = (
  input: unknown,
): InstrumentAdministrationAttachmentResult => {
  const parsed = InstrumentAdministrationAttachmentCompileRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }

  const verifiedSourceValidation = verifyInstrumentAdministrationSourceValidationIntegrity(
    parsed.data.administrationSourceValidation,
  );
  if (!verifiedSourceValidation.ok) {
    return fail(
      'ADMINISTRATION_SOURCE_VALIDATION_INVALID',
      verifiedSourceValidation.error.message,
      [parsed.data.administrationSourceValidation.id],
    );
  }

  const request = normalizeRequest(parsed.data, verifiedSourceValidation.value);
  const context = request.attachmentContext;
  const sourceValidation = verifiedSourceValidation.value;
  const administrationCompilation = sourceValidation.compileRequest.administrationCompilation;
  const administration = administrationCompilation.administration;
  if (context.patientStateId !== sourceValidation.patientStateId) {
    return fail(
      'PATIENT_CONTEXT_MISMATCH',
      `${administration.id} does not target the exact frozen patient context.`,
      [context.id, context.patientStateId, sourceValidation.patientStateId],
    );
  }
  if (!context.informationActionIds.includes(administration.informationActionId)) {
    return fail(
      'ACTION_CONTEXT_MISMATCH',
      `${administration.informationActionId} is outside the frozen attachment action horizon.`,
      [context.id, administration.id, administration.informationActionId],
    );
  }

  const contextResponses = new Map(
    context.instrumentItemResponses.map((response) => [response.id, response] as const),
  );
  for (const responseId of administration.includedItemResponseIds) {
    const expected = projectIncludedResponse(administrationCompilation, responseId);
    const attached = contextResponses.get(responseId);
    if (!expected || !attached || !sameExactValue(expected, attached)) {
      return fail(
        'ITEM_RESPONSE_CONTEXT_MISMATCH',
        `${responseId} is not the exact frozen D-214-compatible item response in the attachment context.`,
        [context.id, administration.id, responseId],
      );
    }
  }

  const inputFingerprint = fingerprint('input', request);
  const payload: Omit<InstrumentAdministrationAttachmentArtifact, 'id' | 'payloadFingerprint'> = {
    schemaVersion: 1,
    compilerVersion: INSTRUMENT_ADMINISTRATION_ATTACHMENT_COMPILER_VERSION,
    requestId: request.id,
    status: 'complete',
    patientStateId: context.patientStateId,
    informationActionId: administration.informationActionId,
    attachmentContextRef: {
      id: context.id,
      fingerprint: fingerprintInstrumentAdministrationAttachmentContext(context),
    },
    administrationSourceValidationRef: {
      id: sourceValidation.id,
      payloadFingerprint: sourceValidation.payloadFingerprint,
    },
    administration: sourceValidation.projection,
    includedInstrumentItemResponseIds: [...administration.includedItemResponseIds],
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('compiler-output', artifactPayload(payload));
  const artifact = InstrumentAdministrationAttachmentArtifactSchema.safeParse({
    ...payload,
    id: `instrument-administration-attachment.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!artifact.success) {
    return fail('INVALID_OUTPUT', issuesText(artifact.error.issues), [
      request.id,
      context.id,
      administration.id,
    ]);
  }
  return { ok: true, value: artifact.data };
};

export const verifyInstrumentAdministrationAttachmentIntegrity = (
  value: unknown,
): InstrumentAdministrationAttachmentIntegrityResult => {
  const parsed = InstrumentAdministrationAttachmentArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  if (parsed.data.compilerVersion !== INSTRUMENT_ADMINISTRATION_ATTACHMENT_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${parsed.data.id} uses unsupported instrument-administration attachment compiler ${parsed.data.compilerVersion}.`,
      },
    };
  }
  const replay = compileInstrumentAdministrationAttachment(parsed.data.compileRequest);
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
        message: `${parsed.data.id} does not match deterministic replay of its frozen attachment request.`,
      },
    };
  }
  return { ok: true, value: parsed.data };
};
