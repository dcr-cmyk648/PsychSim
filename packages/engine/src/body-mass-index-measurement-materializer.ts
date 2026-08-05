import {
  BodyMassIndexMeasurementMaterializationArtifactSchema,
  BodyMassIndexMeasurementMaterializationRequestSchema,
  MeasurementResolutionEnvelopeSchema,
  ResolvedMeasurementSchema,
  type BodyMassIndexMeasurementMaterializationArtifact,
  type BodyMassIndexMeasurementMaterializationFingerprint,
} from '@psychsim/schemas';

import { verifyBodyMassIndexDerivationCompilationIntegrity } from './body-mass-index-derivation-compiler';

export const BODY_MASS_INDEX_MEASUREMENT_MATERIALIZER_VERSION = '1.0.0';

export type BodyMassIndexMeasurementMaterializationResult =
  | {
      readonly ok: true;
      readonly value: BodyMassIndexMeasurementMaterializationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'DERIVATION_COMPILATION_INVALID'
          | 'MEASUREMENT_CONTRACT_MISMATCH'
          | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type BodyMassIndexMeasurementMaterializationIntegrityResult =
  | {
      readonly ok: true;
      readonly value: BodyMassIndexMeasurementMaterializationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'DERIVATION_COMPILATION_INVALID'
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
): BodyMassIndexMeasurementMaterializationFingerprint =>
  `fingerprint.body-mass-index-measurement-materialization.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const resolvedMeasurementId = (
  derivationId: string,
  derivationPayloadFingerprint: string,
): string =>
  `resolved-measurement.derived.${hashToHex64(
    JSON.stringify(
      canonicalizeObjectKeys({
        derivationId,
        derivationPayloadFingerprint,
      }),
    ),
  )}`;

const artifactPayload = (
  artifact: Omit<BodyMassIndexMeasurementMaterializationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  derivationCompilationRef: artifact.derivationCompilationRef,
  resolvedMeasurement: artifact.resolvedMeasurement,
  materializationRequest: artifact.materializationRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const materializeBodyMassIndexMeasurement = (
  input: unknown,
): BodyMassIndexMeasurementMaterializationResult => {
  const parsed = BodyMassIndexMeasurementMaterializationRequestSchema.safeParse(input);
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
  const derivation = verifyBodyMassIndexDerivationCompilationIntegrity(
    request.derivationCompilation,
  );
  if (!derivation.ok) {
    return {
      ok: false,
      error: {
        code: 'DERIVATION_COMPILATION_INVALID',
        message: derivation.error.message,
      },
    };
  }
  const value = derivation.value;
  const inputMeasurementIds = [value.heightInput.id, value.weightInput.id];
  const resolvedMeasurement = ResolvedMeasurementSchema.safeParse({
    schemaVersion: 1,
    id: resolvedMeasurementId(value.id, value.payloadFingerprint),
    definitionId: value.derivedValue.definitionId,
    definitionContentVersion: value.derivedValue.definitionContentVersion,
    value: value.derivedValue.value,
    displayValue: value.derivedValue.displayValue,
    unit: value.derivedValue.unit,
    contextValues: value.derivedValue.contextValues,
    timeScopeId: value.weightInput.timeScopeId,
    source: {
      kind: 'derived_measurement',
      derivationDefinitionId: value.derivationDefinitionRef.id,
      derivationDefinitionContentVersion: value.derivationDefinitionRef.contentVersion,
      derivationArtifactId: value.id,
      derivationPayloadFingerprint: value.payloadFingerprint,
      inputMeasurementIds,
    },
    interpretation: value.derivedValue.interpretation,
    resolution: {
      origin: 'deterministic_derivation',
      derivationDefinitionId: value.derivationDefinitionRef.id,
      derivationDefinitionContentVersion: value.derivationDefinitionRef.contentVersion,
      resolverVersion: BODY_MASS_INDEX_MEASUREMENT_MATERIALIZER_VERSION,
      inputMeasurementIds,
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
    definition: value.compileRequest.outputMeasurementDefinition,
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
    compilerVersion: BODY_MASS_INDEX_MEASUREMENT_MATERIALIZER_VERSION,
    requestId: request.id,
    patientStateId: value.patientStateId,
    derivationCompilationRef: {
      id: value.id,
      payloadFingerprint: value.payloadFingerprint,
    },
    resolvedMeasurement: resolvedMeasurement.data,
    materializationRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = BodyMassIndexMeasurementMaterializationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `body-mass-index-measurement-materialization.${payloadFingerprint.slice(-16)}`,
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

export const verifyBodyMassIndexMeasurementMaterializationIntegrity = (
  input: unknown,
): BodyMassIndexMeasurementMaterializationIntegrityResult => {
  const parsed = BodyMassIndexMeasurementMaterializationArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== BODY_MASS_INDEX_MEASUREMENT_MATERIALIZER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported BMI measurement materializer ${artifact.compilerVersion}.`,
      },
    };
  }
  const derivation = verifyBodyMassIndexDerivationCompilationIntegrity(
    artifact.materializationRequest.derivationCompilation,
  );
  if (!derivation.ok) {
    return {
      ok: false,
      error: {
        code: 'DERIVATION_COMPILATION_INVALID',
        message: derivation.error.message,
      },
    };
  }
  if (artifact.inputFingerprint !== fingerprint('input', artifact.materializationRequest)) {
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
      `body-mass-index-measurement-materialization.${artifact.payloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} payload fingerprint does not match its exact artifact.`,
      },
    };
  }
  const replay = materializeBodyMassIndexMeasurement(artifact.materializationRequest);
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
