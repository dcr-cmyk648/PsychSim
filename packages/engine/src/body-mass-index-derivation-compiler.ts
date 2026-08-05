import {
  BodyMassIndexDerivationCompilationArtifactSchema,
  BodyMassIndexDerivationCompilationRequestSchema,
  type BodyMassIndexDerivationCompilationArtifact,
  type BodyMassIndexDerivationCompilationFingerprint,
} from '@psychsim/schemas';

import { verifyPatientClinicalResultCollectionCompilationIntegrity } from './patient-clinical-result-collection-compiler';

export const BODY_MASS_INDEX_DERIVATION_COMPILER_VERSION = '1.0.0';

export type BodyMassIndexDerivationCompilationResult =
  | {
      readonly ok: true;
      readonly value: BodyMassIndexDerivationCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'RESULT_COLLECTION_INVALID'
          | 'INPUT_MEASUREMENT_NOT_FOUND'
          | 'INPUT_MEASUREMENT_MISMATCH'
          | 'INVALID_INPUT_VALUE'
          | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type BodyMassIndexDerivationCompilationIntegrityResult =
  | {
      readonly ok: true;
      readonly value: BodyMassIndexDerivationCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'RESULT_COLLECTION_INVALID'
          | 'DERIVATION_DEFINITION_FINGERPRINT_MISMATCH'
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
): BodyMassIndexDerivationCompilationFingerprint =>
  `fingerprint.body-mass-index-derivation-compilation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const artifactPayload = (
  artifact: Omit<BodyMassIndexDerivationCompilationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  derivationDefinitionRef: artifact.derivationDefinitionRef,
  resultCollectionCompilationRef: artifact.resultCollectionCompilationRef,
  heightInput: artifact.heightInput,
  weightInput: artifact.weightInput,
  derivedValue: artifact.derivedValue,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

const calculateBodyMassIndex = (heightCm: number, weightKg: number): number =>
  weightKg / (heightCm / 100) ** 2;

export const compileBodyMassIndexDerivation = (
  input: unknown,
): BodyMassIndexDerivationCompilationResult => {
  const parsed = BodyMassIndexDerivationCompilationRequestSchema.safeParse(input);
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
  const collection = verifyPatientClinicalResultCollectionCompilationIntegrity(
    request.resultCollectionCompilation,
  );
  if (!collection.ok) {
    return {
      ok: false,
      error: {
        code: 'RESULT_COLLECTION_INVALID',
        message: collection.error.message,
      },
    };
  }
  const heightInput = collection.value.measurements.find(
    (measurement) => measurement.id === request.heightResolvedMeasurementId,
  );
  const weightInput = collection.value.measurements.find(
    (measurement) => measurement.id === request.weightResolvedMeasurementId,
  );
  if (heightInput === undefined || weightInput === undefined) {
    return {
      ok: false,
      error: {
        code: 'INPUT_MEASUREMENT_NOT_FOUND',
        message:
          'The selected height and weight records must both exist in the exact replay-valid result collection.',
      },
    };
  }
  if (
    heightInput.definitionId !== request.heightMeasurementDefinition.id ||
    heightInput.definitionContentVersion !== request.heightMeasurementDefinition.contentVersion ||
    weightInput.definitionId !== request.weightMeasurementDefinition.id ||
    weightInput.definitionContentVersion !== request.weightMeasurementDefinition.contentVersion
  ) {
    return {
      ok: false,
      error: {
        code: 'INPUT_MEASUREMENT_MISMATCH',
        message:
          'The selected height and weight records must use the exact definitions pinned by the BMI derivation.',
      },
    };
  }
  if (heightInput.value <= 0 || weightInput.value <= 0) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT_VALUE',
        message: 'BMI derivation requires positive finite height and weight values.',
      },
    };
  }
  const value = calculateBodyMassIndex(heightInput.value, weightInput.value);
  if (!Number.isFinite(value) || value <= 0) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT_VALUE',
        message: 'The selected height and weight do not produce a positive finite BMI.',
      },
    };
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: BODY_MASS_INDEX_DERIVATION_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: request.patientStateId,
    derivationDefinitionRef: {
      id: request.derivationDefinition.id,
      contentVersion: request.derivationDefinition.contentVersion,
      fingerprint: fingerprint('derivation-definition', request.derivationDefinition),
    },
    resultCollectionCompilationRef: {
      id: collection.value.id,
      payloadFingerprint: collection.value.payloadFingerprint,
    },
    heightInput,
    weightInput,
    derivedValue: {
      schemaVersion: 1 as const,
      definitionId: request.outputMeasurementDefinition.id,
      definitionContentVersion: request.outputMeasurementDefinition.contentVersion,
      value,
      displayValue: value.toFixed(request.outputMeasurementDefinition.unit.displayPrecision),
      unit: {
        display: request.outputMeasurementDefinition.unit.display,
        ucumCode: 'kg/m2' as const,
      },
      contextValues: [],
      interpretation: {
        kind: 'not_interpreted' as const,
      },
    },
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = BodyMassIndexDerivationCompilationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `body-mass-index-derivation-compilation.${payloadFingerprint.slice(-16)}`,
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

export const verifyBodyMassIndexDerivationCompilationIntegrity = (
  input: unknown,
): BodyMassIndexDerivationCompilationIntegrityResult => {
  const parsed = BodyMassIndexDerivationCompilationArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== BODY_MASS_INDEX_DERIVATION_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported BMI derivation compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const collection = verifyPatientClinicalResultCollectionCompilationIntegrity(
    artifact.compileRequest.resultCollectionCompilation,
  );
  if (!collection.ok) {
    return {
      ok: false,
      error: {
        code: 'RESULT_COLLECTION_INVALID',
        message: collection.error.message,
      },
    };
  }
  if (
    artifact.derivationDefinitionRef.fingerprint !==
    fingerprint('derivation-definition', artifact.compileRequest.derivationDefinition)
  ) {
    return {
      ok: false,
      error: {
        code: 'DERIVATION_DEFINITION_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact BMI derivation definition.`,
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
      `body-mass-index-derivation-compilation.${artifact.payloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} payload fingerprint does not match its exact artifact.`,
      },
    };
  }
  const replay = compileBodyMassIndexDerivation(artifact.compileRequest);
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
