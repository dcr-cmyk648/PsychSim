import {
  PatientSceneSourceInstanceCompilationArtifactSchema,
  PatientSceneSourceInstanceCompilationRequestSchema,
  PatientStateScopedSourceSchema,
  type PatientSceneSourceInstanceCompilationArtifact,
  type PatientSceneSourceInstanceCompilationFingerprint,
  type PatientSceneSourceInstanceCompilationRequest,
  type PatientStateScopedSource,
} from '@psychsim/schemas';

export const PATIENT_SCENE_SOURCE_INSTANCE_COMPILER_VERSION = '2.0.0';

export type PatientSceneSourceInstanceCompilationResult =
  | { readonly ok: true; readonly value: PatientSceneSourceInstanceCompilationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_REQUEST' | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type PatientSceneSourceInstanceCompilationIntegrityResult =
  | { readonly ok: true; readonly value: PatientSceneSourceInstanceCompilationArtifact }
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

export type PatientSceneSourceInstanceValidationResult =
  | { readonly ok: true; readonly value: PatientStateScopedSource }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'SOURCE_HORIZON_INVALID'
          | 'PATIENT_STATE_MISMATCH'
          | 'SOURCE_INSTANCE_NOT_FOUND'
          | 'SOURCE_KIND_MISMATCH'
          | 'INVALID_SOURCE';
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
): PatientSceneSourceInstanceCompilationFingerprint =>
  `fingerprint.patient-scene-source-instance-compilation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const normalizeRequest = (
  request: PatientSceneSourceInstanceCompilationRequest,
): PatientSceneSourceInstanceCompilationRequest =>
  PatientSceneSourceInstanceCompilationRequestSchema.parse({
    ...request,
    definitions: [...request.definitions].sort((left, right) =>
      compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
    ),
  });

export const derivePatientSceneSourceInstanceId = (
  definition: PatientSceneSourceInstanceCompilationRequest['definitions'][number],
): string =>
  `patient-scene-source-instance.${hashToHex64(
    JSON.stringify(
      canonicalizeObjectKeys({
        definitionRef: {
          id: definition.id,
          contentVersion: definition.contentVersion,
        },
        kind: definition.kind,
      }),
    ),
  )}`;

const artifactPayload = (
  artifact: Omit<PatientSceneSourceInstanceCompilationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  sourceInstances: artifact.sourceInstances,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const compilePatientSceneSourceInstances = (
  input: unknown,
): PatientSceneSourceInstanceCompilationResult => {
  const parsed = PatientSceneSourceInstanceCompilationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  const request = normalizeRequest(parsed.data);
  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_SCENE_SOURCE_INSTANCE_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: request.patientStateId,
    sourceInstances: request.definitions.map((definition) => ({
      schemaVersion: 1 as const,
      id: derivePatientSceneSourceInstanceId(definition),
      patientStateId: request.patientStateId,
      definitionRef: {
        id: definition.id,
        contentVersion: definition.contentVersion,
      },
      kind: definition.kind,
    })),
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = PatientSceneSourceInstanceCompilationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `patient-scene-source-instance-compilation.${payloadFingerprint.slice(-16)}`,
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

export const verifyPatientSceneSourceInstanceCompilationIntegrity = (
  input: unknown,
): PatientSceneSourceInstanceCompilationIntegrityResult => {
  const parsed = PatientSceneSourceInstanceCompilationArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== PATIENT_SCENE_SOURCE_INSTANCE_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported source-instance compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const normalizedRequest = normalizeRequest(artifact.compileRequest);
  const expectedInputFingerprint = fingerprint('input', normalizedRequest);
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact normalized request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `patient-scene-source-instance-compilation.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen source-instance payload.`,
      },
    };
  }
  const replay = compilePatientSceneSourceInstances(normalizedRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: 'The retained source-instance request does not reproduce the exact artifact.',
      },
    };
  }
  return { ok: true, value: artifact };
};

export const validatePatientStateScopedSource = (
  sourceInput: unknown,
  patientStateId: string,
  horizonInput: unknown,
): PatientSceneSourceInstanceValidationResult => {
  const source = PatientStateScopedSourceSchema.safeParse(sourceInput);
  if (!source.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SOURCE',
        message: issuesText(source.error.issues),
      },
    };
  }
  const horizon = verifyPatientSceneSourceInstanceCompilationIntegrity(horizonInput);
  if (!horizon.ok) {
    return {
      ok: false,
      error: {
        code: 'SOURCE_HORIZON_INVALID',
        message: horizon.error.message,
      },
    };
  }
  if (horizon.value.patientStateId !== patientStateId) {
    return {
      ok: false,
      error: {
        code: 'PATIENT_STATE_MISMATCH',
        message: `Source horizon ${horizon.value.id} belongs to ${horizon.value.patientStateId}, not ${patientStateId}.`,
      },
    };
  }
  const instance = horizon.value.sourceInstances.find(
    (candidate) => candidate.id === source.data.sourceInstanceId,
  );
  if (instance === undefined) {
    return {
      ok: false,
      error: {
        code: 'SOURCE_INSTANCE_NOT_FOUND',
        message: `${source.data.sourceInstanceId} is not present in source horizon ${horizon.value.id}.`,
      },
    };
  }
  if (instance.kind !== source.data.kind) {
    return {
      ok: false,
      error: {
        code: 'SOURCE_KIND_MISMATCH',
        message: `${source.data.sourceInstanceId} is ${instance.kind}, not ${source.data.kind}.`,
      },
    };
  }
  return { ok: true, value: source.data };
};
