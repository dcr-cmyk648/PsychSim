import {
  InstrumentAdministrationSourceValidationArtifactSchema,
  InstrumentAdministrationSourceValidationRequestSchema,
  type InstrumentAdministrationSourceValidationArtifact,
  type InstrumentAdministrationSourceValidationFingerprint,
  type InstrumentAdministrationSourceValidationRequest,
} from '@psychsim/schemas';

import { verifyInstrumentAdministrationCompilationIntegrity } from './instrument-administration-compiler';
import { projectInstrumentAdministration } from './instrument-administration-projection';
import {
  validatePatientStateScopedSource,
  verifyPatientSceneSourceInstanceCompilationIntegrity,
} from './patient-scene-source-instance-compiler';

export const INSTRUMENT_ADMINISTRATION_SOURCE_VALIDATION_VERSION = '1.0.0';

export type InstrumentAdministrationSourceValidationErrorCode =
  | 'INVALID_REQUEST'
  | 'ADMINISTRATION_COMPILATION_INVALID'
  | 'SOURCE_HORIZON_INVALID'
  | 'PATIENT_STATE_CONTEXT_MISMATCH'
  | 'SOURCE_REFERENCE_INVALID'
  | 'PROJECTION_INVALID'
  | 'INVALID_OUTPUT';

export type InstrumentAdministrationSourceValidationResult =
  | { readonly ok: true; readonly value: InstrumentAdministrationSourceValidationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: InstrumentAdministrationSourceValidationErrorCode;
        readonly message: string;
      };
    };

export type InstrumentAdministrationSourceValidationIntegrityResult =
  | { readonly ok: true; readonly value: InstrumentAdministrationSourceValidationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH'
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
): InstrumentAdministrationSourceValidationFingerprint =>
  `fingerprint.instrument-administration-source-validation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const fail = (
  code: InstrumentAdministrationSourceValidationErrorCode,
  message: string,
): InstrumentAdministrationSourceValidationResult => ({
  ok: false,
  error: { code, message },
});

const artifactPayload = (
  artifact: Omit<InstrumentAdministrationSourceValidationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  administrationCompilationRef: artifact.administrationCompilationRef,
  sourceInstanceCompilationRef: artifact.sourceInstanceCompilationRef,
  validatedSourceBinding: artifact.validatedSourceBinding,
  projection: artifact.projection,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const validateInstrumentAdministrationSource = (
  input: unknown,
): InstrumentAdministrationSourceValidationResult => {
  const parsed = InstrumentAdministrationSourceValidationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues));
  }
  const request: InstrumentAdministrationSourceValidationRequest = parsed.data;
  const administration = verifyInstrumentAdministrationCompilationIntegrity(
    request.administrationCompilation,
  );
  if (!administration.ok) {
    return fail('ADMINISTRATION_COMPILATION_INVALID', administration.error.message);
  }
  const sourceHorizon = verifyPatientSceneSourceInstanceCompilationIntegrity(
    request.sourceInstanceCompilation,
  );
  if (!sourceHorizon.ok) {
    return fail('SOURCE_HORIZON_INVALID', sourceHorizon.error.message);
  }
  const patientStateId = administration.value.patientStateId;
  if (sourceHorizon.value.patientStateId !== patientStateId) {
    return fail(
      'PATIENT_STATE_CONTEXT_MISMATCH',
      `${sourceHorizon.value.id} belongs to ${sourceHorizon.value.patientStateId}, not administration patient ${patientStateId}.`,
    );
  }
  const sourceValidation = validatePatientStateScopedSource(
    {
      kind: administration.value.administration.respondentSourceKind,
      sourceInstanceId: administration.value.administration.sourceInstanceId,
    },
    patientStateId,
    sourceHorizon.value,
  );
  if (!sourceValidation.ok) {
    return fail(
      'SOURCE_REFERENCE_INVALID',
      `${sourceValidation.error.code}: ${sourceValidation.error.message}`,
    );
  }
  const projection = projectInstrumentAdministration(administration.value);
  if (!projection.ok) {
    return fail('PROJECTION_INVALID', projection.error.message);
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: INSTRUMENT_ADMINISTRATION_SOURCE_VALIDATION_VERSION,
    requestId: request.id,
    patientStateId,
    administrationCompilationRef: {
      id: administration.value.id,
      payloadFingerprint: administration.value.payloadFingerprint,
    },
    sourceInstanceCompilationRef: {
      id: sourceHorizon.value.id,
      payloadFingerprint: sourceHorizon.value.payloadFingerprint,
    },
    validatedSourceBinding: {
      sourceInstanceId: administration.value.administration.sourceInstanceId,
      sourceKind: administration.value.administration.respondentSourceKind,
    },
    projection: projection.value,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = InstrumentAdministrationSourceValidationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `instrument-administration-source-validation.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues));
  }
  return { ok: true, value: output.data };
};

export const verifyInstrumentAdministrationSourceValidationIntegrity = (
  input: unknown,
): InstrumentAdministrationSourceValidationIntegrityResult => {
  const parsed = InstrumentAdministrationSourceValidationArtifactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  const artifact = parsed.data;
  if (artifact.compilerVersion !== INSTRUMENT_ADMINISTRATION_SOURCE_VALIDATION_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported source validation ${artifact.compilerVersion}.`,
      },
    };
  }
  const expectedInputFingerprint = fingerprint('input', artifact.compileRequest);
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact source-validation request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `instrument-administration-source-validation.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen source-validation payload.`,
      },
    };
  }
  const replay = validateInstrumentAdministrationSource(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained D-283 administration and D-291 source horizon do not reproduce the exact source-validation artifact.',
      },
    };
  }
  return { ok: true, value: artifact };
};
