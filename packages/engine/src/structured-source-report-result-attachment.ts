import {
  StructuredSourceReportResultAttachmentArtifactSchema,
  StructuredSourceReportResultAttachmentRequestSchema,
  type StructuredSourceReportResultAttachmentArtifact,
  type StructuredSourceReportResultAttachmentFingerprint,
  type StructuredSourceReportResultAttachmentRequest,
} from '@psychsim/schemas';

import { verifyStructuredSourceReportRecordProjectionIntegrity } from './structured-source-report-record-projection';
import { translateUniversalActionResultArtifact } from './universal-action-result-attachment';
import { verifyUniversalActionResultArtifactIntegrity } from './universal-action-result-compiler';

export const STRUCTURED_SOURCE_REPORT_RESULT_ATTACHMENT_VERSION = '1.0.0';

export type StructuredSourceReportResultAttachmentResult =
  | { readonly ok: true; readonly value: StructuredSourceReportResultAttachmentArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'RECORD_PROJECTION_INVALID'
          | 'UNIVERSAL_RESULT_INVALID'
          | 'RESULT_ATTACHMENT_FAILED'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type StructuredSourceReportResultAttachmentIntegrityResult =
  | { readonly ok: true; readonly value: StructuredSourceReportResultAttachmentArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH'
          | 'UPSTREAM_ARTIFACT_INVALID'
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
): StructuredSourceReportResultAttachmentFingerprint =>
  `fingerprint.structured-source-report-result-attachment.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: Extract<
    StructuredSourceReportResultAttachmentResult,
    { readonly ok: false }
  >['error']['code'],
  message: string,
  contentIds: readonly string[],
): StructuredSourceReportResultAttachmentResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

const normalizeRequest = (
  request: StructuredSourceReportResultAttachmentRequest,
): StructuredSourceReportResultAttachmentRequest =>
  StructuredSourceReportResultAttachmentRequestSchema.parse({
    ...request,
  });

const artifactPayload = (
  artifact: Omit<StructuredSourceReportResultAttachmentArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  sourceValidatedRecordProjectionRef: artifact.sourceValidatedRecordProjectionRef,
  universalActionResultRef: artifact.universalActionResultRef,
  resultBindingRequests: artifact.resultBindingRequests,
  structuredStateReveals: artifact.structuredStateReveals,
  structuredStateRecordProjections: artifact.structuredStateRecordProjections,
  instrumentItemResponses: artifact.instrumentItemResponses,
  targetScopedPatientValueReveals: artifact.targetScopedPatientValueReveals,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

/**
 * Joins D-350's source-validated minimized fields to the exact D-214
 * translation of one replay-valid D-213 result artifact. It performs no
 * PatientInstance mutation, reveal, persistence, runtime, wording, clinical
 * interpretation, or scoring.
 */
export const attachValidatedStructuredSourceReportResults = (
  input: unknown,
): StructuredSourceReportResultAttachmentResult => {
  const parsed = StructuredSourceReportResultAttachmentRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }
  const recordProjection = verifyStructuredSourceReportRecordProjectionIntegrity(
    parsed.data.sourceValidatedRecordProjection,
  );
  if (!recordProjection.ok) {
    return fail('RECORD_PROJECTION_INVALID', recordProjection.error.message, [
      parsed.data.sourceValidatedRecordProjection.id,
    ]);
  }
  const universalResults = verifyUniversalActionResultArtifactIntegrity(
    parsed.data.universalActionResults,
  );
  if (!universalResults.ok) {
    return fail('UNIVERSAL_RESULT_INVALID', universalResults.error.message, [
      parsed.data.universalActionResults.id,
    ]);
  }
  const translated = translateUniversalActionResultArtifact(universalResults.value);
  if (!translated.ok) {
    return fail(
      'RESULT_ATTACHMENT_FAILED',
      `${translated.error.code}: ${translated.error.message}`,
      [recordProjection.value.id, universalResults.value.id, ...translated.error.contentIds],
    );
  }

  const request = normalizeRequest({
    ...parsed.data,
    sourceValidatedRecordProjection: recordProjection.value,
    universalActionResults: universalResults.value,
  });
  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity: Omit<
    StructuredSourceReportResultAttachmentArtifact,
    'id' | 'payloadFingerprint'
  > = {
    schemaVersion: 1,
    compilerVersion: STRUCTURED_SOURCE_REPORT_RESULT_ATTACHMENT_VERSION,
    requestId: request.id,
    patientStateId: recordProjection.value.patientStateId,
    sourceValidatedRecordProjectionRef: {
      id: recordProjection.value.id,
      payloadFingerprint: recordProjection.value.payloadFingerprint,
    },
    universalActionResultRef: {
      id: universalResults.value.id,
      payloadFingerprint: universalResults.value.payloadFingerprint,
    },
    resultBindingRequests: translated.value.resultBindingRequests,
    structuredStateReveals: translated.value.structuredStateReveals,
    structuredStateRecordProjections: recordProjection.value.projections,
    instrumentItemResponses: translated.value.instrumentItemResponses,
    targetScopedPatientValueReveals: translated.value.targetScopedPatientValueReveals,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = StructuredSourceReportResultAttachmentArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `structured-source-report-result-attachment.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
      request.id,
      recordProjection.value.id,
      universalResults.value.id,
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyStructuredSourceReportResultAttachmentIntegrity = (
  input: unknown,
): StructuredSourceReportResultAttachmentIntegrityResult => {
  const parsed = StructuredSourceReportResultAttachmentArtifactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (artifact.compilerVersion !== STRUCTURED_SOURCE_REPORT_RESULT_ATTACHMENT_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported result attachment ${artifact.compilerVersion}.`,
      },
    };
  }
  if (artifact.inputFingerprint !== fingerprint('input', artifact.compileRequest)) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact D-350/D-213 attachment request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `structured-source-report-result-attachment.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen result-attachment payload.`,
      },
    };
  }
  const recordProjection = verifyStructuredSourceReportRecordProjectionIntegrity(
    artifact.compileRequest.sourceValidatedRecordProjection,
  );
  const universalResults = verifyUniversalActionResultArtifactIntegrity(
    artifact.compileRequest.universalActionResults,
  );
  if (!recordProjection.ok || !universalResults.ok) {
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_ARTIFACT_INVALID',
        message:
          'The retained source-validated record projection or universal result artifact no longer replays.',
      },
    };
  }
  const replay = attachValidatedStructuredSourceReportResults(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained D-350 and D-213 artifacts do not reproduce the exact D-351 attachment.',
      },
    };
  }
  return { ok: true, value: artifact };
};
