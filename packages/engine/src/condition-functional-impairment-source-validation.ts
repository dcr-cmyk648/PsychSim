import {
  ConditionFunctionalImpairmentSourceValidationArtifactSchema,
  ConditionFunctionalImpairmentSourceValidationRequestSchema,
  type ConditionFunctionalImpairmentSourceValidationArtifact,
  type ConditionFunctionalImpairmentSourceValidationFingerprint,
  type ConditionFunctionalImpairmentSourceValidationRequest,
} from '@psychsim/schemas';

import { verifyConditionFunctionalImpairmentAttachmentIntegrity } from './condition-functional-impairment-attachment';
import { projectConditionFunctionalImpairmentAttachment } from './condition-functional-impairment-projection';
import {
  validatePatientStateScopedSource,
  verifyPatientSceneSourceInstanceCompilationIntegrity,
} from './patient-scene-source-instance-compiler';

export const CONDITION_FUNCTIONAL_IMPAIRMENT_SOURCE_VALIDATION_VERSION = '1.0.0';

export type ConditionFunctionalImpairmentSourceValidationErrorCode =
  | 'INVALID_REQUEST'
  | 'FUNCTIONAL_IMPAIRMENT_ATTACHMENT_INVALID'
  | 'SOURCE_HORIZON_INVALID'
  | 'PATIENT_STATE_CONTEXT_MISMATCH'
  | 'SOURCE_REFERENCE_INVALID'
  | 'PROJECTION_INVALID'
  | 'INVALID_OUTPUT';

export type ConditionFunctionalImpairmentSourceValidationResult =
  | { readonly ok: true; readonly value: ConditionFunctionalImpairmentSourceValidationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: ConditionFunctionalImpairmentSourceValidationErrorCode;
        readonly message: string;
      };
    };

export type ConditionFunctionalImpairmentSourceValidationIntegrityResult =
  | { readonly ok: true; readonly value: ConditionFunctionalImpairmentSourceValidationArtifact }
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
): ConditionFunctionalImpairmentSourceValidationFingerprint =>
  `fingerprint.condition-functional-impairment-source-validation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const fail = (
  code: ConditionFunctionalImpairmentSourceValidationErrorCode,
  message: string,
): ConditionFunctionalImpairmentSourceValidationResult => ({
  ok: false,
  error: { code, message },
});

const artifactPayload = (
  artifact: Omit<
    ConditionFunctionalImpairmentSourceValidationArtifact,
    'id' | 'payloadFingerprint'
  >,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  functionalImpairmentAttachmentRef: artifact.functionalImpairmentAttachmentRef,
  sourceInstanceCompilationRef: artifact.sourceInstanceCompilationRef,
  validatedSourceBindings: artifact.validatedSourceBindings,
  projection: artifact.projection,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const validateConditionFunctionalImpairmentSources = (
  input: unknown,
): ConditionFunctionalImpairmentSourceValidationResult => {
  const parsed = ConditionFunctionalImpairmentSourceValidationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues));
  }
  const request: ConditionFunctionalImpairmentSourceValidationRequest = parsed.data;
  const attachment = verifyConditionFunctionalImpairmentAttachmentIntegrity(
    request.functionalImpairmentAttachment,
  );
  if (!attachment.ok) {
    return fail('FUNCTIONAL_IMPAIRMENT_ATTACHMENT_INVALID', attachment.error.message);
  }
  const sourceHorizon = verifyPatientSceneSourceInstanceCompilationIntegrity(
    request.sourceInstanceCompilation,
  );
  if (!sourceHorizon.ok) {
    return fail('SOURCE_HORIZON_INVALID', sourceHorizon.error.message);
  }
  const patientStateId = attachment.value.basePatientStateRef.id;
  if (sourceHorizon.value.patientStateId !== patientStateId) {
    return fail(
      'PATIENT_STATE_CONTEXT_MISMATCH',
      `${sourceHorizon.value.id} belongs to ${sourceHorizon.value.patientStateId}, not impairment patient ${patientStateId}.`,
    );
  }
  for (const impairment of attachment.value.attachedFunctionalImpairments) {
    const sourceValidation = validatePatientStateScopedSource(
      impairment.source,
      patientStateId,
      sourceHorizon.value,
    );
    if (!sourceValidation.ok) {
      return fail(
        'SOURCE_REFERENCE_INVALID',
        `${impairment.id}: ${sourceValidation.error.code}: ${sourceValidation.error.message}`,
      );
    }
  }
  const projection = projectConditionFunctionalImpairmentAttachment(attachment.value);
  if (!projection.ok) {
    return fail('PROJECTION_INVALID', projection.error.message);
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: CONDITION_FUNCTIONAL_IMPAIRMENT_SOURCE_VALIDATION_VERSION,
    requestId: request.id,
    patientStateId,
    functionalImpairmentAttachmentRef: {
      id: attachment.value.id,
      payloadFingerprint: attachment.value.payloadFingerprint,
    },
    sourceInstanceCompilationRef: {
      id: sourceHorizon.value.id,
      payloadFingerprint: sourceHorizon.value.payloadFingerprint,
    },
    validatedSourceBindings: attachment.value.attachedFunctionalImpairments
      .map((impairment) => ({
        resolvedFunctionalImpairmentId: impairment.id,
        sourceInstanceId: impairment.source.sourceInstanceId,
        sourceKind: impairment.source.kind,
      }))
      .sort((left, right) =>
        compareStrings(left.resolvedFunctionalImpairmentId, right.resolvedFunctionalImpairmentId),
      ),
    projection: projection.value,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = ConditionFunctionalImpairmentSourceValidationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `condition-functional-impairment-source-validation.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues));
  }
  return { ok: true, value: output.data };
};

export const verifyConditionFunctionalImpairmentSourceValidationIntegrity = (
  input: unknown,
): ConditionFunctionalImpairmentSourceValidationIntegrityResult => {
  const parsed = ConditionFunctionalImpairmentSourceValidationArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== CONDITION_FUNCTIONAL_IMPAIRMENT_SOURCE_VALIDATION_VERSION) {
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
      `condition-functional-impairment-source-validation.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen source-validation payload.`,
      },
    };
  }
  const replay = validateConditionFunctionalImpairmentSources(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained D-289 attachment and D-291 source horizon do not reproduce the exact source-validation artifact.',
      },
    };
  }
  return { ok: true, value: artifact };
};
