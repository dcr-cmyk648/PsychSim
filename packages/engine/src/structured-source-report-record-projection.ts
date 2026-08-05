import {
  StructuredSourceReportRecordProjectionArtifactSchema,
  StructuredSourceReportRecordProjectionRequestSchema,
  type StructuredSourceReportRecordProjectionArtifact,
  type StructuredSourceReportRecordProjectionFingerprint,
  type StructuredSourceReportRecordProjectionRequest,
} from '@psychsim/schemas';

import {
  projectStructuredPatientStateRecords,
  verifyStructuredPatientStateRecordProjection,
} from './structured-patient-state-record-projection';
import { verifyStructuredSourceReportSourceValidationIntegrity } from './structured-source-report-source-validation';

export const STRUCTURED_SOURCE_REPORT_RECORD_PROJECTION_VERSION = '1.0.0';

export type StructuredSourceReportRecordProjectionResult =
  | { readonly ok: true; readonly value: StructuredSourceReportRecordProjectionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'SOURCE_VALIDATION_INVALID'
          | 'RECORD_PROJECTION_FAILED'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type StructuredSourceReportRecordProjectionIntegrityResult =
  | { readonly ok: true; readonly value: StructuredSourceReportRecordProjectionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH'
          | 'UPSTREAM_PROJECTION_INVALID'
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
): StructuredSourceReportRecordProjectionFingerprint =>
  `fingerprint.structured-source-report-record-projection.${scope}.fnv1a64.${hashToHex64(
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
    StructuredSourceReportRecordProjectionResult,
    { readonly ok: false }
  >['error']['code'],
  message: string,
  contentIds: readonly string[],
): StructuredSourceReportRecordProjectionResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

const normalizeRequest = (
  request: StructuredSourceReportRecordProjectionRequest,
): StructuredSourceReportRecordProjectionRequest =>
  StructuredSourceReportRecordProjectionRequestSchema.parse({
    ...request,
  });

const artifactPayload = (
  artifact: Omit<StructuredSourceReportRecordProjectionArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  sourceValidationRef: artifact.sourceValidationRef,
  projections: artifact.projections,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

/**
 * Derives all minimized D-349 views only after the complete D-299 source
 * validation has replayed. It performs no report selection, result attachment,
 * reveal, persistence, runtime, clinical interpretation, or scoring.
 */
export const projectValidatedStructuredSourceReportRecords = (
  input: unknown,
): StructuredSourceReportRecordProjectionResult => {
  const parsed = StructuredSourceReportRecordProjectionRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }
  const sourceValidation = verifyStructuredSourceReportSourceValidationIntegrity(
    parsed.data.sourceValidation,
  );
  if (!sourceValidation.ok) {
    return fail('SOURCE_VALIDATION_INVALID', sourceValidation.error.message, [
      parsed.data.sourceValidation.id,
    ]);
  }
  const validated = sourceValidation.value;
  const patientState = validated.compileRequest.structuredSourceReport.compileRequest.patientState;
  const projections: StructuredSourceReportRecordProjectionArtifact['projections'] = [];

  for (const recipe of validated.projectionRecipes) {
    const envelope = {
      definition: recipe.definition,
      patientState,
      resolved: recipe.resolved,
    };
    const projection = projectStructuredPatientStateRecords(envelope);
    if (!projection.ok) {
      return fail(
        'RECORD_PROJECTION_FAILED',
        `${recipe.resolved.id}: ${projection.error.code}: ${projection.error.message}`,
        [
          validated.id,
          patientState.id,
          recipe.definition.id,
          recipe.resolved.id,
          ...projection.error.contentIds,
        ],
      );
    }
    projections.push(projection.value);
  }
  projections.sort((left, right) =>
    compareStrings(left.resolvedStructuredRevealId, right.resolvedStructuredRevealId),
  );

  const request = normalizeRequest({
    ...parsed.data,
    sourceValidation: validated,
  });
  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity: Omit<
    StructuredSourceReportRecordProjectionArtifact,
    'id' | 'payloadFingerprint'
  > = {
    schemaVersion: 1,
    compilerVersion: STRUCTURED_SOURCE_REPORT_RECORD_PROJECTION_VERSION,
    requestId: request.id,
    patientStateId: validated.patientStateId,
    sourceValidationRef: {
      id: validated.id,
      payloadFingerprint: validated.payloadFingerprint,
    },
    projections,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = StructuredSourceReportRecordProjectionArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `structured-source-report-record-projection.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
      request.id,
      validated.id,
      patientState.id,
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyStructuredSourceReportRecordProjectionIntegrity = (
  input: unknown,
): StructuredSourceReportRecordProjectionIntegrityResult => {
  const parsed = StructuredSourceReportRecordProjectionArtifactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (artifact.compilerVersion !== STRUCTURED_SOURCE_REPORT_RECORD_PROJECTION_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported record projection ${artifact.compilerVersion}.`,
      },
    };
  }
  if (artifact.inputFingerprint !== fingerprint('input', artifact.compileRequest)) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact D-299 projection request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `structured-source-report-record-projection.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen record-projection payload.`,
      },
    };
  }

  const patientState =
    artifact.compileRequest.sourceValidation.compileRequest.structuredSourceReport.compileRequest
      .patientState;
  const recipeById = new Map(
    artifact.compileRequest.sourceValidation.projectionRecipes.map((recipe) => [
      recipe.resolved.id,
      recipe,
    ]),
  );
  for (const projection of artifact.projections) {
    const recipe = recipeById.get(projection.resolvedStructuredRevealId);
    if (
      recipe === undefined ||
      !verifyStructuredPatientStateRecordProjection(
        {
          definition: recipe.definition,
          patientState,
          resolved: recipe.resolved,
        },
        projection,
      ).ok
    ) {
      return {
        ok: false,
        error: {
          code: 'UPSTREAM_PROJECTION_INVALID',
          message: `${projection.id} is not the exact D-349 projection of its retained D-299 recipe.`,
        },
      };
    }
  }

  const replay = projectValidatedStructuredSourceReportRecords(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained D-299 source validation does not reproduce the exact D-350 record-projection collection.',
      },
    };
  }
  return { ok: true, value: artifact };
};
