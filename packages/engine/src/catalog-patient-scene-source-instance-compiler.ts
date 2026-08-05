import {
  CatalogPatientSceneSourceInstanceCompilationArtifactSchema,
  CatalogPatientSceneSourceInstanceCompilationRequestSchema,
  type CatalogPatientSceneSourceInstanceCompilationArtifact,
  type CatalogPatientSceneSourceInstanceCompilationFingerprint,
  type CatalogPatientSceneSourceInstanceCompilationRequest,
} from '@psychsim/schemas';

import {
  compilePatientSceneSourceInstances,
  verifyPatientSceneSourceInstanceCompilationIntegrity,
} from './patient-scene-source-instance-compiler';

export const CATALOG_PATIENT_SCENE_SOURCE_INSTANCE_COMPILER_VERSION = '1.0.0';

export type CatalogPatientSceneSourceInstanceCompilationResult =
  | {
      readonly ok: true;
      readonly value: CatalogPatientSceneSourceInstanceCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_REQUEST' | 'SOURCE_INSTANCE_COMPILATION_FAILED' | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type CatalogPatientSceneSourceInstanceCompilationIntegrityResult =
  | {
      readonly ok: true;
      readonly value: CatalogPatientSceneSourceInstanceCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'CATALOG_FINGERPRINT_MISMATCH'
          | 'SOURCE_INSTANCE_COMPILATION_INVALID'
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
): CatalogPatientSceneSourceInstanceCompilationFingerprint =>
  `fingerprint.catalog-patient-scene-source-instance-compilation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const artifactPayload = (
  artifact: Omit<CatalogPatientSceneSourceInstanceCompilationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  sourceDefinitionCatalogRef: artifact.sourceDefinitionCatalogRef,
  sourceInstanceCompilationRef: artifact.sourceInstanceCompilationRef,
  sourceInstanceCompilation: artifact.sourceInstanceCompilation,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

const nestedRequestId = (request: CatalogPatientSceneSourceInstanceCompilationRequest): string =>
  `patient-scene-source-instance-request.catalog.${hashToHex64(
    JSON.stringify(
      canonicalizeObjectKeys({
        patientStateId: request.patientStateId,
        catalogId: request.sourceDefinitionCatalog.id,
        catalogContentVersion: request.sourceDefinitionCatalog.contentVersion,
      }),
    ),
  )}`;

export const compilePatientSceneSourceInstancesFromCatalog = (
  input: unknown,
): CatalogPatientSceneSourceInstanceCompilationResult => {
  const parsed = CatalogPatientSceneSourceInstanceCompilationRequestSchema.safeParse(input);
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
  const sourceInstanceCompilation = compilePatientSceneSourceInstances({
    schemaVersion: 1,
    id: nestedRequestId(request),
    patientStateId: request.patientStateId,
    definitions: request.sourceDefinitionCatalog.definitions,
  });
  if (!sourceInstanceCompilation.ok) {
    return {
      ok: false,
      error: {
        code: 'SOURCE_INSTANCE_COMPILATION_FAILED',
        message: sourceInstanceCompilation.error.message,
      },
    };
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: CATALOG_PATIENT_SCENE_SOURCE_INSTANCE_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: request.patientStateId,
    sourceDefinitionCatalogRef: {
      id: request.sourceDefinitionCatalog.id,
      contentVersion: request.sourceDefinitionCatalog.contentVersion,
      fingerprint: fingerprint('source-catalog', request.sourceDefinitionCatalog),
    },
    sourceInstanceCompilationRef: {
      id: sourceInstanceCompilation.value.id,
      payloadFingerprint: sourceInstanceCompilation.value.payloadFingerprint,
    },
    sourceInstanceCompilation: sourceInstanceCompilation.value,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = CatalogPatientSceneSourceInstanceCompilationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `catalog-patient-scene-source-instance-compilation.${payloadFingerprint.slice(-16)}`,
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

export const verifyCatalogPatientSceneSourceInstanceCompilationIntegrity = (
  input: unknown,
): CatalogPatientSceneSourceInstanceCompilationIntegrityResult => {
  const parsed = CatalogPatientSceneSourceInstanceCompilationArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== CATALOG_PATIENT_SCENE_SOURCE_INSTANCE_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported catalog source compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const expectedCatalogFingerprint = fingerprint(
    'source-catalog',
    artifact.compileRequest.sourceDefinitionCatalog,
  );
  if (artifact.sourceDefinitionCatalogRef.fingerprint !== expectedCatalogFingerprint) {
    return {
      ok: false,
      error: {
        code: 'CATALOG_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact source-definition catalog.`,
      },
    };
  }
  const sourceCompilation = verifyPatientSceneSourceInstanceCompilationIntegrity(
    artifact.sourceInstanceCompilation,
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
  const expectedInputFingerprint = fingerprint('input', artifact.compileRequest);
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact catalog compilation request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `catalog-patient-scene-source-instance-compilation.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen catalog source-instance payload.`,
      },
    };
  }
  const replay = compilePatientSceneSourceInstancesFromCatalog(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: 'The retained catalog request does not reproduce the exact source horizon.',
      },
    };
  }
  return { ok: true, value: artifact };
};
