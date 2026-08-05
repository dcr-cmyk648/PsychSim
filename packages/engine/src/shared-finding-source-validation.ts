import {
  SharedFindingSourceValidationArtifactSchema,
  SharedFindingSourceValidationRequestSchema,
  type SharedFindingSourceValidationArtifact,
  type SharedFindingSourceValidationFingerprint,
  type SharedFindingSourceValidationRequest,
  type SharedFindingValidatedSourceBinding,
} from '@psychsim/schemas';

import {
  validatePatientStateScopedSource,
  verifyPatientSceneSourceInstanceCompilationIntegrity,
} from './patient-scene-source-instance-compiler';
import {
  compileSharedFindings,
  verifyCompiledSharedFindingIntegrity,
} from './shared-finding-compiler';

export const SHARED_FINDING_SOURCE_VALIDATION_VERSION = '1.0.0';

export type SharedFindingSourceValidationErrorCode =
  | 'INVALID_REQUEST'
  | 'SHARED_FINDING_COMPILATION_INVALID'
  | 'SHARED_FINDING_REPLAY_MISMATCH'
  | 'SOURCE_HORIZON_INVALID'
  | 'PATIENT_STATE_CONTEXT_MISMATCH'
  | 'SOURCE_REFERENCE_INVALID'
  | 'SOURCE_REPORT_CROSS_LINK_INVALID'
  | 'INVALID_OUTPUT';

export type SharedFindingSourceValidationResult =
  | { readonly ok: true; readonly value: SharedFindingSourceValidationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: SharedFindingSourceValidationErrorCode;
        readonly message: string;
      };
    };

export type SharedFindingSourceValidationIntegrityResult =
  | { readonly ok: true; readonly value: SharedFindingSourceValidationArtifact }
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

const fingerprint = (scope: string, value: unknown): SharedFindingSourceValidationFingerprint =>
  `fingerprint.shared-finding-source-validation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const fail = (
  code: SharedFindingSourceValidationErrorCode,
  message: string,
): SharedFindingSourceValidationResult => ({
  ok: false,
  error: { code, message },
});

const artifactPayload = (
  artifact: Omit<SharedFindingSourceValidationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  sharedFindingCompilationRef: artifact.sharedFindingCompilationRef,
  sourceInstanceCompilationRef: artifact.sourceInstanceCompilationRef,
  validatedSourceBindings: artifact.validatedSourceBindings,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const validateSharedFindingSources = (
  input: unknown,
): SharedFindingSourceValidationResult => {
  const parsed = SharedFindingSourceValidationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues));
  }
  const request: SharedFindingSourceValidationRequest = parsed.data;
  const compiled = verifyCompiledSharedFindingIntegrity(request.sharedFindingCompilation);
  if (!compiled.ok) {
    return fail('SHARED_FINDING_COMPILATION_INVALID', compiled.error.message);
  }
  const replay = compileSharedFindings(request.sharedFindingRequest);
  if (!replay.ok || !sameExactValue(replay.value, compiled.value)) {
    return fail(
      'SHARED_FINDING_REPLAY_MISMATCH',
      'The retained D-193 request does not reproduce the exact shared-finding compilation.',
    );
  }
  const sourceHorizon = verifyPatientSceneSourceInstanceCompilationIntegrity(
    request.sourceInstanceCompilation,
  );
  if (!sourceHorizon.ok) {
    return fail('SOURCE_HORIZON_INVALID', sourceHorizon.error.message);
  }
  if (
    request.sharedFindingRequest.patientStateId !== compiled.value.patientStateId ||
    sourceHorizon.value.patientStateId !== compiled.value.patientStateId
  ) {
    return fail(
      'PATIENT_STATE_CONTEXT_MISMATCH',
      'The D-193 request/output and D-291 horizon must name the exact same patient state.',
    );
  }

  const policy = request.sharedFindingRequest.findingSourceReportProjectionPolicy;
  const validatedSourceBindings: SharedFindingValidatedSourceBinding[] = [];
  for (const projection of compiled.value.projections) {
    const selection = projection.resolution.sourceReportSelection;
    if (selection === undefined) continue;
    const sourceValidation = validatePatientStateScopedSource(
      selection.source,
      compiled.value.patientStateId,
      sourceHorizon.value,
    );
    if (!sourceValidation.ok) {
      return fail(
        'SOURCE_REFERENCE_INVALID',
        `${projection.id}: ${sourceValidation.error.code}: ${sourceValidation.error.message}`,
      );
    }
    const slot = policy?.slots.find((candidate) => candidate.id === selection.slotId);
    const allowedProjectionRefs =
      slot === undefined
        ? []
        : [slot.baseProjectionRef, ...slot.modifiers.map((modifier) => modifier.projectionRef)];
    if (
      slot === undefined ||
      slot.source.kind !== selection.source.kind ||
      slot.source.sourceInstanceId !== selection.source.sourceInstanceId ||
      slot.timeScopeId !== selection.timeScopeId ||
      slot.claimOriginId !== selection.claimOriginId ||
      !sameExactValue(slot.dependencyGroupIds, selection.dependencyGroupIds) ||
      !allowedProjectionRefs.some(
        (reference) =>
          reference.id === projection.projectionId &&
          reference.contentVersion === projection.projectionContentVersion,
      )
    ) {
      return fail(
        'SOURCE_REPORT_CROSS_LINK_INVALID',
        `${projection.id} does not retain the exact selected D-258 source-report slot and projection.`,
      );
    }
    const sourceInstance = sourceHorizon.value.sourceInstances.find(
      (candidate) => candidate.id === selection.source.sourceInstanceId,
    )!;
    validatedSourceBindings.push({
      resolvedProjectionId: projection.id,
      projectionId: projection.projectionId,
      projectionContentVersion: projection.projectionContentVersion,
      sourceReportSelection: selection,
      sourceDefinitionId: sourceInstance.definitionRef.id,
      sourceDefinitionContentVersion: sourceInstance.definitionRef.contentVersion,
    });
  }
  validatedSourceBindings.sort((left, right) =>
    compareStrings(left.resolvedProjectionId, right.resolvedProjectionId),
  );

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: SHARED_FINDING_SOURCE_VALIDATION_VERSION,
    requestId: request.id,
    patientStateId: compiled.value.patientStateId,
    sharedFindingCompilationRef: {
      id: compiled.value.id,
      inputFingerprint: compiled.value.inputFingerprint,
      payloadFingerprint: compiled.value.payloadFingerprint,
    },
    sourceInstanceCompilationRef: {
      id: sourceHorizon.value.id,
      payloadFingerprint: sourceHorizon.value.payloadFingerprint,
    },
    validatedSourceBindings,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = SharedFindingSourceValidationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `shared-finding-source-validation.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues));
  }
  return { ok: true, value: output.data };
};

export const verifySharedFindingSourceValidationIntegrity = (
  input: unknown,
): SharedFindingSourceValidationIntegrityResult => {
  const parsed = SharedFindingSourceValidationArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== SHARED_FINDING_SOURCE_VALIDATION_VERSION) {
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
    artifact.id !== `shared-finding-source-validation.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen source-validation payload.`,
      },
    };
  }
  const replay = validateSharedFindingSources(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained D-193 request/output and D-291 source horizon do not reproduce the exact source-validation artifact.',
      },
    };
  }
  return { ok: true, value: artifact };
};
