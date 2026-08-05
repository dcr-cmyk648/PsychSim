import {
  PatientOwnedStructuredTestResultCompilationArtifactSchema,
  PatientOwnedStructuredTestResultCompilationRequestSchema,
  StructuredTestResultEnvelopeSchema,
  StructuredTestResultSchema,
  type PatientOwnedStructuredTestResultCompilationArtifact,
  type PatientOwnedStructuredTestResultCompilationFingerprint,
  type PatientOwnedStructuredTestResultCompilationRequest,
} from '@psychsim/schemas';

import { verifyCatalogPatientSceneSourceInstanceCompilationIntegrity } from './catalog-patient-scene-source-instance-compiler';

export const PATIENT_OWNED_STRUCTURED_TEST_RESULT_COMPILER_VERSION = '1.0.0';

export type PatientOwnedStructuredTestResultCompilationResult =
  | {
      readonly ok: true;
      readonly value: PatientOwnedStructuredTestResultCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'SOURCE_INSTANCE_COMPILATION_INVALID'
          | 'SOURCE_INSTANCE_NOT_FOUND'
          | 'RESULT_CONTRACT_MISMATCH'
          | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type PatientOwnedStructuredTestResultCompilationIntegrityResult =
  | {
      readonly ok: true;
      readonly value: PatientOwnedStructuredTestResultCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'SOURCE_INSTANCE_COMPILATION_INVALID'
          | 'TEST_DEFINITION_FINGERPRINT_MISMATCH'
          | 'RESULT_PROFILE_FINGERPRINT_MISMATCH'
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
): PatientOwnedStructuredTestResultCompilationFingerprint =>
  `fingerprint.patient-owned-structured-test-result-compilation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const resultId = (request: PatientOwnedStructuredTestResultCompilationRequest): string =>
  `structured-test-result.patient-owned.${hashToHex64(
    JSON.stringify(
      canonicalizeObjectKeys({
        patientStateId: request.patientStateId,
        testDefinitionId: request.testDefinition.id,
        testDefinitionContentVersion: request.testDefinition.contentVersion,
        resultProfileId: request.resultProfile.id,
        resultProfileContentVersion: request.resultProfile.contentVersion,
        timeScopeId: request.timeScopeId,
      }),
    ),
  )}`;

const artifactPayload = (
  artifact: Omit<PatientOwnedStructuredTestResultCompilationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  testDefinitionRef: artifact.testDefinitionRef,
  resultProfileRef: artifact.resultProfileRef,
  sourceInstanceRef: artifact.sourceInstanceRef,
  result: artifact.result,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const compilePatientOwnedStructuredTestResult = (
  input: unknown,
): PatientOwnedStructuredTestResultCompilationResult => {
  const parsed = PatientOwnedStructuredTestResultCompilationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  const request = parsed.data;
  const sourceCompilation = verifyCatalogPatientSceneSourceInstanceCompilationIntegrity(
    request.sourceInstanceCompilation,
  );
  if (!sourceCompilation.ok) {
    return {
      ok: false,
      error: {
        code: 'SOURCE_INSTANCE_COMPILATION_INVALID',
        message: sourceCompilation.error.message,
      },
    };
  }
  const sourceInstance = sourceCompilation.value.sourceInstanceCompilation.sourceInstances.find(
    (instance) =>
      instance.definitionRef.id === request.sourceDefinitionRef.id &&
      instance.definitionRef.contentVersion === request.sourceDefinitionRef.contentVersion,
  );
  if (sourceInstance === undefined) {
    return {
      ok: false,
      error: {
        code: 'SOURCE_INSTANCE_NOT_FOUND',
        message: `${request.sourceDefinitionRef.id}@${request.sourceDefinitionRef.contentVersion} is not present in the exact patient source horizon.`,
      },
    };
  }
  const result = StructuredTestResultSchema.safeParse({
    schemaVersion: 1,
    id: resultId(request),
    testDefinitionId: request.testDefinition.id,
    testDefinitionContentVersion: request.testDefinition.contentVersion,
    source: {
      kind: sourceInstance.kind,
      sourceInstanceId: sourceInstance.id,
    },
    timeScopeId: request.timeScopeId,
    resolution: {
      origin: 'authored',
      ownerId: request.resultProfile.id,
      ownerContentVersion: request.resultProfile.contentVersion,
    },
    ...request.resultProfile.payload,
  });
  if (!result.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(result.error.issues),
      },
    };
  }
  const envelope = StructuredTestResultEnvelopeSchema.safeParse({
    definition: request.testDefinition,
    result: result.data,
  });
  if (!envelope.success) {
    return {
      ok: false,
      error: {
        code: 'RESULT_CONTRACT_MISMATCH',
        message: issuesText(envelope.error.issues),
      },
    };
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_OWNED_STRUCTURED_TEST_RESULT_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: request.patientStateId,
    testDefinitionRef: {
      id: request.testDefinition.id,
      contentVersion: request.testDefinition.contentVersion,
      fingerprint: fingerprint('test-definition', request.testDefinition),
    },
    resultProfileRef: {
      id: request.resultProfile.id,
      contentVersion: request.resultProfile.contentVersion,
      fingerprint: fingerprint('result-profile', request.resultProfile),
    },
    sourceInstanceRef: {
      id: sourceInstance.id,
      kind: sourceInstance.kind,
      definitionRef: sourceInstance.definitionRef,
    },
    result: result.data,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = PatientOwnedStructuredTestResultCompilationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `patient-owned-structured-test-result-compilation.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(output.error.issues),
      },
    };
  }
  return { ok: true, value: output.data };
};

export const verifyPatientOwnedStructuredTestResultCompilationIntegrity = (
  input: unknown,
): PatientOwnedStructuredTestResultCompilationIntegrityResult => {
  const parsed = PatientOwnedStructuredTestResultCompilationArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== PATIENT_OWNED_STRUCTURED_TEST_RESULT_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported patient-owned test-result compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const sourceCompilation = verifyCatalogPatientSceneSourceInstanceCompilationIntegrity(
    artifact.compileRequest.sourceInstanceCompilation,
  );
  if (!sourceCompilation.ok) {
    return {
      ok: false,
      error: {
        code: 'SOURCE_INSTANCE_COMPILATION_INVALID',
        message: sourceCompilation.error.message,
      },
    };
  }
  if (
    artifact.testDefinitionRef.fingerprint !==
    fingerprint('test-definition', artifact.compileRequest.testDefinition)
  ) {
    return {
      ok: false,
      error: {
        code: 'TEST_DEFINITION_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact test definition.`,
      },
    };
  }
  if (
    artifact.resultProfileRef.fingerprint !==
    fingerprint('result-profile', artifact.compileRequest.resultProfile)
  ) {
    return {
      ok: false,
      error: {
        code: 'RESULT_PROFILE_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact authored result profile.`,
      },
    };
  }
  if (artifact.inputFingerprint !== fingerprint('input', artifact.compileRequest)) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} input fingerprint does not match its complete request.`,
      },
    };
  }
  if (
    artifact.payloadFingerprint !== fingerprint('payload', artifactPayload(artifact)) ||
    artifact.id !==
      `patient-owned-structured-test-result-compilation.${artifact.payloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} payload fingerprint does not match its exact artifact.`,
      },
    };
  }
  const replay = compilePatientOwnedStructuredTestResult(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: replay.ok
          ? `${artifact.id} does not equal deterministic replay.`
          : replay.error.message,
      },
    };
  }
  return { ok: true, value: artifact };
};
