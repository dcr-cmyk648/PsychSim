import {
  CategoricalObservationResolutionEnvelopeSchema,
  PatientOwnedCategoricalObservationCompilationArtifactSchema,
  PatientOwnedCategoricalObservationCompilationRequestSchema,
  ResolvedCategoricalObservationSchema,
  type PatientOwnedCategoricalObservationCompilationArtifact,
  type PatientOwnedCategoricalObservationCompilationFingerprint,
  type PatientOwnedCategoricalObservationCompilationRequest,
} from '@psychsim/schemas';

import { verifyCatalogPatientSceneSourceInstanceCompilationIntegrity } from './catalog-patient-scene-source-instance-compiler';

export const PATIENT_OWNED_CATEGORICAL_OBSERVATION_COMPILER_VERSION = '1.0.0';

export type PatientOwnedCategoricalObservationCompilationResult =
  | {
      readonly ok: true;
      readonly value: PatientOwnedCategoricalObservationCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'SOURCE_INSTANCE_COMPILATION_INVALID'
          | 'SOURCE_INSTANCE_NOT_FOUND'
          | 'OBSERVATION_CONTRACT_MISMATCH'
          | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type PatientOwnedCategoricalObservationCompilationIntegrityResult =
  | {
      readonly ok: true;
      readonly value: PatientOwnedCategoricalObservationCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'SOURCE_INSTANCE_COMPILATION_INVALID'
          | 'OBSERVATION_DEFINITION_FINGERPRINT_MISMATCH'
          | 'VALUE_PROFILE_FINGERPRINT_MISMATCH'
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
): PatientOwnedCategoricalObservationCompilationFingerprint =>
  `fingerprint.patient-owned-categorical-observation-compilation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const observationId = (request: PatientOwnedCategoricalObservationCompilationRequest): string =>
  `resolved-observation.patient-owned.${hashToHex64(
    JSON.stringify(
      canonicalizeObjectKeys({
        patientStateId: request.patientStateId,
        observationDefinitionId: request.observationDefinition.id,
        observationDefinitionContentVersion: request.observationDefinition.contentVersion,
        valueProfileId: request.valueProfile.id,
        valueProfileContentVersion: request.valueProfile.contentVersion,
        timeScopeId: request.timeScopeId,
      }),
    ),
  )}`;

const artifactPayload = (
  artifact: Omit<
    PatientOwnedCategoricalObservationCompilationArtifact,
    'id' | 'payloadFingerprint'
  >,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  observationDefinitionRef: artifact.observationDefinitionRef,
  valueProfileRef: artifact.valueProfileRef,
  sourceInstanceRef: artifact.sourceInstanceRef,
  resolvedObservation: artifact.resolvedObservation,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const compilePatientOwnedCategoricalObservation = (
  input: unknown,
): PatientOwnedCategoricalObservationCompilationResult => {
  const parsed = PatientOwnedCategoricalObservationCompilationRequestSchema.safeParse(input);
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

  const resolvedObservation = ResolvedCategoricalObservationSchema.safeParse({
    schemaVersion: 1,
    id: observationId(request),
    definitionId: request.observationDefinition.id,
    definitionContentVersion: request.observationDefinition.contentVersion,
    valueId: request.valueProfile.valueId,
    displayValue: request.valueProfile.displayValue,
    timeScopeId: request.timeScopeId,
    source: {
      kind: sourceInstance.kind,
      sourceInstanceId: sourceInstance.id,
    },
    interpretationIds: [],
    resolution: {
      origin: 'authored',
      ownerId: request.valueProfile.id,
      ownerContentVersion: request.valueProfile.contentVersion,
    },
  });
  if (!resolvedObservation.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(resolvedObservation.error.issues),
      },
    };
  }
  const envelope = CategoricalObservationResolutionEnvelopeSchema.safeParse({
    definition: request.observationDefinition,
    resolved: resolvedObservation.data,
  });
  if (!envelope.success) {
    return {
      ok: false,
      error: {
        code: 'OBSERVATION_CONTRACT_MISMATCH',
        message: issuesText(envelope.error.issues),
      },
    };
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_OWNED_CATEGORICAL_OBSERVATION_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: request.patientStateId,
    observationDefinitionRef: {
      id: request.observationDefinition.id,
      contentVersion: request.observationDefinition.contentVersion,
      fingerprint: fingerprint('observation-definition', request.observationDefinition),
    },
    valueProfileRef: {
      id: request.valueProfile.id,
      contentVersion: request.valueProfile.contentVersion,
      fingerprint: fingerprint('value-profile', request.valueProfile),
    },
    sourceInstanceRef: {
      id: sourceInstance.id,
      kind: 'clinician_observation' as const,
      definitionRef: sourceInstance.definitionRef,
    },
    resolvedObservation: resolvedObservation.data,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = PatientOwnedCategoricalObservationCompilationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `patient-owned-categorical-observation-compilation.${payloadFingerprint.slice(-16)}`,
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

export const verifyPatientOwnedCategoricalObservationCompilationIntegrity = (
  input: unknown,
): PatientOwnedCategoricalObservationCompilationIntegrityResult => {
  const parsed = PatientOwnedCategoricalObservationCompilationArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== PATIENT_OWNED_CATEGORICAL_OBSERVATION_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported patient-owned categorical-observation compiler ${artifact.compilerVersion}.`,
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
    artifact.observationDefinitionRef.fingerprint !==
    fingerprint('observation-definition', artifact.compileRequest.observationDefinition)
  ) {
    return {
      ok: false,
      error: {
        code: 'OBSERVATION_DEFINITION_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact categorical-observation definition.`,
      },
    };
  }
  if (
    artifact.valueProfileRef.fingerprint !==
    fingerprint('value-profile', artifact.compileRequest.valueProfile)
  ) {
    return {
      ok: false,
      error: {
        code: 'VALUE_PROFILE_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact authored value profile.`,
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
      `patient-owned-categorical-observation-compilation.${artifact.payloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} payload fingerprint does not match its exact artifact.`,
      },
    };
  }
  const replay = compilePatientOwnedCategoricalObservation(artifact.compileRequest);
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
