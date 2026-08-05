import {
  MeasurementResolutionEnvelopeSchema,
  PatientOwnedMeasurementCompilationArtifactSchema,
  PatientOwnedMeasurementCompilationRequestSchema,
  ResolvedMeasurementSchema,
  type PatientOwnedMeasurementCompilationArtifact,
  type PatientOwnedMeasurementCompilationFingerprint,
  type PatientOwnedMeasurementCompilationRequest,
} from '@psychsim/schemas';

import { verifyCatalogPatientSceneSourceInstanceCompilationIntegrity } from './catalog-patient-scene-source-instance-compiler';

export const PATIENT_OWNED_MEASUREMENT_COMPILER_VERSION = '1.0.0';

export type PatientOwnedMeasurementCompilationResult =
  | {
      readonly ok: true;
      readonly value: PatientOwnedMeasurementCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'SOURCE_INSTANCE_COMPILATION_INVALID'
          | 'SOURCE_INSTANCE_NOT_FOUND'
          | 'MEASUREMENT_CONTRACT_MISMATCH'
          | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type PatientOwnedMeasurementCompilationIntegrityResult =
  | {
      readonly ok: true;
      readonly value: PatientOwnedMeasurementCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'SOURCE_INSTANCE_COMPILATION_INVALID'
          | 'MEASUREMENT_DEFINITION_FINGERPRINT_MISMATCH'
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
): PatientOwnedMeasurementCompilationFingerprint =>
  `fingerprint.patient-owned-measurement-compilation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const measurementId = (request: PatientOwnedMeasurementCompilationRequest): string =>
  `resolved-measurement.patient-owned.${hashToHex64(
    JSON.stringify(
      canonicalizeObjectKeys({
        patientStateId: request.patientStateId,
        measurementDefinitionId: request.measurementDefinition.id,
        measurementDefinitionContentVersion: request.measurementDefinition.contentVersion,
        valueProfileId: request.valueProfile.id,
        valueProfileContentVersion: request.valueProfile.contentVersion,
        timeScopeId: request.timeScopeId,
      }),
    ),
  )}`;

const artifactPayload = (
  artifact: Omit<PatientOwnedMeasurementCompilationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  measurementDefinitionRef: artifact.measurementDefinitionRef,
  valueProfileRef: artifact.valueProfileRef,
  sourceInstanceRef: artifact.sourceInstanceRef,
  resolvedMeasurement: artifact.resolvedMeasurement,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const compilePatientOwnedMeasurement = (
  input: unknown,
): PatientOwnedMeasurementCompilationResult => {
  const parsed = PatientOwnedMeasurementCompilationRequestSchema.safeParse(input);
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

  const resolvedMeasurement = ResolvedMeasurementSchema.safeParse({
    schemaVersion: 1,
    id: measurementId(request),
    definitionId: request.measurementDefinition.id,
    definitionContentVersion: request.measurementDefinition.contentVersion,
    value: request.valueProfile.value,
    displayValue: request.valueProfile.displayValue,
    unit: {
      display: request.measurementDefinition.unit.display,
      ucumCode: request.measurementDefinition.unit.ucumCode,
    },
    contextValues: request.valueProfile.contextValues,
    timeScopeId: request.timeScopeId,
    source: {
      kind: sourceInstance.kind,
      sourceInstanceId: sourceInstance.id,
    },
    interpretation: {
      kind: 'not_interpreted',
    },
    resolution: {
      origin: 'authored',
      ownerId: request.valueProfile.id,
      ownerContentVersion: request.valueProfile.contentVersion,
    },
  });
  if (!resolvedMeasurement.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(resolvedMeasurement.error.issues),
      },
    };
  }
  const envelope = MeasurementResolutionEnvelopeSchema.safeParse({
    definition: request.measurementDefinition,
    resolved: resolvedMeasurement.data,
  });
  if (!envelope.success) {
    return {
      ok: false,
      error: {
        code: 'MEASUREMENT_CONTRACT_MISMATCH',
        message: issuesText(envelope.error.issues),
      },
    };
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_OWNED_MEASUREMENT_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: request.patientStateId,
    measurementDefinitionRef: {
      id: request.measurementDefinition.id,
      contentVersion: request.measurementDefinition.contentVersion,
      fingerprint: fingerprint('measurement-definition', request.measurementDefinition),
    },
    valueProfileRef: {
      id: request.valueProfile.id,
      contentVersion: request.valueProfile.contentVersion,
      fingerprint: fingerprint('value-profile', request.valueProfile),
    },
    sourceInstanceRef: {
      id: sourceInstance.id,
      kind: 'measurement' as const,
      definitionRef: sourceInstance.definitionRef,
    },
    resolvedMeasurement: resolvedMeasurement.data,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = PatientOwnedMeasurementCompilationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `patient-owned-measurement-compilation.${payloadFingerprint.slice(-16)}`,
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

export const verifyPatientOwnedMeasurementCompilationIntegrity = (
  input: unknown,
): PatientOwnedMeasurementCompilationIntegrityResult => {
  const parsed = PatientOwnedMeasurementCompilationArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== PATIENT_OWNED_MEASUREMENT_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported patient-owned measurement compiler ${artifact.compilerVersion}.`,
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
    artifact.measurementDefinitionRef.fingerprint !==
    fingerprint('measurement-definition', artifact.compileRequest.measurementDefinition)
  ) {
    return {
      ok: false,
      error: {
        code: 'MEASUREMENT_DEFINITION_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact measurement definition.`,
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
      `patient-owned-measurement-compilation.${artifact.payloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} payload fingerprint does not match its exact artifact.`,
      },
    };
  }
  const replay = compilePatientOwnedMeasurement(artifact.compileRequest);
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
