import {
  PatientClinicalResultCollectionCompilationArtifactSchema,
  PatientClinicalResultCollectionCompilationRequestSchema,
  type PatientClinicalResultCollectionCompilationArtifact,
  type PatientClinicalResultCollectionCompilationFingerprint,
  type PatientClinicalResultCollectionCompilationRequest,
  type PatientClinicalResultCollectionMember,
} from '@psychsim/schemas';

import { verifyCatalogPatientSceneSourceInstanceCompilationIntegrity } from './catalog-patient-scene-source-instance-compiler';
import { verifyGeneratedCategoricalObservationCompilationIntegrity } from './generated-categorical-observation-compiler';
import { verifyGeneratedMeasurementCompilationIntegrity } from './generated-measurement-compiler';
import { verifyNumericStructuredTestResultCompilationIntegrity } from './numeric-structured-test-result-compiler';
import { verifyPatientOwnedCategoricalObservationCompilationIntegrity } from './patient-owned-categorical-observation-compiler';
import { verifyPatientOwnedMeasurementCompilationIntegrity } from './patient-owned-measurement-compiler';
import { verifyPatientOwnedStructuredTestResultCompilationIntegrity } from './patient-owned-structured-test-result-compiler';

export const PATIENT_CLINICAL_RESULT_COLLECTION_COMPILER_VERSION = '3.0.0';

export type PatientClinicalResultCollectionCompilationResult =
  | {
      readonly ok: true;
      readonly value: PatientClinicalResultCollectionCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'SOURCE_INSTANCE_COMPILATION_INVALID'
          | 'UPSTREAM_COMPILATION_INVALID'
          | 'SOURCE_HORIZON_MISMATCH'
          | 'DUPLICATE_RESOLVED_RECORD'
          | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type PatientClinicalResultCollectionCompilationIntegrityResult =
  | {
      readonly ok: true;
      readonly value: PatientClinicalResultCollectionCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'SOURCE_INSTANCE_COMPILATION_INVALID'
          | 'UPSTREAM_COMPILATION_INVALID'
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
): PatientClinicalResultCollectionCompilationFingerprint =>
  `fingerprint.patient-clinical-result-collection-compilation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const sortById = <Value extends { readonly id: string }>(values: readonly Value[]): Value[] =>
  [...values].sort((left, right) => compareStrings(left.id, right.id));

const memberKey = (member: PatientClinicalResultCollectionMember): string =>
  `${member.resolvedRecordId}\u0000${member.kind}`;

const normalizeRequest = (
  request: PatientClinicalResultCollectionCompilationRequest,
): PatientClinicalResultCollectionCompilationRequest =>
  PatientClinicalResultCollectionCompilationRequestSchema.parse({
    ...request,
    numericStructuredTestCompilations: sortById(request.numericStructuredTestCompilations),
    patientOwnedStructuredTestCompilations: sortById(
      request.patientOwnedStructuredTestCompilations,
    ),
    measurementCompilations: sortById(request.measurementCompilations),
    categoricalObservationCompilations: sortById(request.categoricalObservationCompilations),
  });

const artifactPayload = (
  artifact: Omit<PatientClinicalResultCollectionCompilationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  sourceInstanceCompilationRef: artifact.sourceInstanceCompilationRef,
  members: artifact.members,
  measurements: artifact.measurements,
  categoricalObservations: artifact.categoricalObservations,
  structuredTestResults: artifact.structuredTestResults,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

const verifyUpstreamArtifacts = (
  request: PatientClinicalResultCollectionCompilationRequest,
):
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly code: 'UPSTREAM_COMPILATION_INVALID' | 'SOURCE_HORIZON_MISMATCH';
      readonly message: string;
    } => {
  const verifications = [
    ...request.numericStructuredTestCompilations.map((artifact) => ({
      id: artifact.id,
      source: artifact.compileRequest.sourceInstanceCompilation,
      result: verifyNumericStructuredTestResultCompilationIntegrity(artifact),
    })),
    ...request.patientOwnedStructuredTestCompilations.map((artifact) => ({
      id: artifact.id,
      source: artifact.compileRequest.sourceInstanceCompilation,
      result: verifyPatientOwnedStructuredTestResultCompilationIntegrity(artifact),
    })),
    ...request.measurementCompilations.map((artifact) => ({
      id: artifact.id,
      source: artifact.compileRequest.sourceInstanceCompilation,
      result:
        'generationProfiles' in artifact.compileRequest
          ? verifyGeneratedMeasurementCompilationIntegrity(artifact)
          : verifyPatientOwnedMeasurementCompilationIntegrity(artifact),
    })),
    ...request.categoricalObservationCompilations.map((artifact) => ({
      id: artifact.id,
      source: artifact.compileRequest.sourceInstanceCompilation,
      result:
        'generationProfiles' in artifact.compileRequest
          ? verifyGeneratedCategoricalObservationCompilationIntegrity(artifact)
          : verifyPatientOwnedCategoricalObservationCompilationIntegrity(artifact),
    })),
  ];
  const invalid = verifications.find((verification) => !verification.result.ok);
  if (invalid !== undefined) {
    return {
      ok: false,
      code: 'UPSTREAM_COMPILATION_INVALID',
      message: `${invalid.id} failed exact upstream replay: ${
        invalid.result.ok ? 'unknown failure' : invalid.result.error.message
      }`,
    };
  }
  const crossedSource = verifications.find(
    (verification) => !sameExactValue(verification.source, request.sourceInstanceCompilation),
  );
  if (crossedSource !== undefined) {
    return {
      ok: false,
      code: 'SOURCE_HORIZON_MISMATCH',
      message: `${crossedSource.id} does not retain the collection's exact catalog-backed source horizon.`,
    };
  }
  return { ok: true };
};

const collectionMembers = (
  request: PatientClinicalResultCollectionCompilationRequest,
): PatientClinicalResultCollectionMember[] =>
  [
    ...request.numericStructuredTestCompilations.map((compilation) => ({
      schemaVersion: 1 as const,
      kind: 'generated_numeric_test' as const,
      compilationRef: {
        id: compilation.id,
        payloadFingerprint: compilation.payloadFingerprint,
      },
      resolvedRecordId: compilation.result.id,
      sourceInstanceId: compilation.result.source.sourceInstanceId,
    })),
    ...request.patientOwnedStructuredTestCompilations.map((compilation) => ({
      schemaVersion: 1 as const,
      kind: 'patient_owned_test' as const,
      compilationRef: {
        id: compilation.id,
        payloadFingerprint: compilation.payloadFingerprint,
      },
      resolvedRecordId: compilation.result.id,
      sourceInstanceId: compilation.result.source.sourceInstanceId,
    })),
    ...request.measurementCompilations.map((compilation) => {
      const generated = 'generationProfiles' in compilation.compileRequest;
      return {
        schemaVersion: 1 as const,
        kind: generated ? ('generated_measurement' as const) : ('measurement' as const),
        compilationRef: {
          id: compilation.id,
          payloadFingerprint: compilation.payloadFingerprint,
        },
        resolvedRecordId: compilation.resolvedMeasurement.id,
        sourceInstanceId:
          compilation.resolvedMeasurement.source.kind === 'derived_measurement'
            ? compilation.resolvedMeasurement.source.derivationArtifactId
            : compilation.resolvedMeasurement.source.sourceInstanceId,
      };
    }),
    ...request.categoricalObservationCompilations.map((compilation) => {
      const generated = 'generationProfiles' in compilation.compileRequest;
      return {
        schemaVersion: 1 as const,
        kind: generated
          ? ('generated_categorical_observation' as const)
          : ('categorical_observation' as const),
        compilationRef: {
          id: compilation.id,
          payloadFingerprint: compilation.payloadFingerprint,
        },
        resolvedRecordId: compilation.resolvedObservation.id,
        sourceInstanceId: compilation.resolvedObservation.source.sourceInstanceId,
      };
    }),
  ].sort((left, right) => compareStrings(memberKey(left), memberKey(right)));

export const compilePatientClinicalResultCollection = (
  input: unknown,
): PatientClinicalResultCollectionCompilationResult => {
  const parsed = PatientClinicalResultCollectionCompilationRequestSchema.safeParse(input);
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
  const upstream = verifyUpstreamArtifacts(request);
  if (!upstream.ok) {
    return {
      ok: false,
      error: {
        code: upstream.code,
        message: upstream.message,
      },
    };
  }

  const members = collectionMembers(request);
  const resolvedRecordIds = members.map((member) => member.resolvedRecordId);
  if (new Set(resolvedRecordIds).size !== resolvedRecordIds.length) {
    return {
      ok: false,
      error: {
        code: 'DUPLICATE_RESOLVED_RECORD',
        message:
          'A patient clinical-result collection cannot contain the same resolved record more than once.',
      },
    };
  }
  const measurements = sortById(
    request.measurementCompilations.map((compilation) => compilation.resolvedMeasurement),
  );
  const categoricalObservations = sortById(
    request.categoricalObservationCompilations.map(
      (compilation) => compilation.resolvedObservation,
    ),
  );
  const structuredTestResults = sortById([
    ...request.numericStructuredTestCompilations.map((compilation) => compilation.result),
    ...request.patientOwnedStructuredTestCompilations.map((compilation) => compilation.result),
  ]);

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_CLINICAL_RESULT_COLLECTION_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: request.patientStateId,
    sourceInstanceCompilationRef: {
      id: request.sourceInstanceCompilation.id,
      sourceDefinitionCatalogFingerprint:
        request.sourceInstanceCompilation.sourceDefinitionCatalogRef.fingerprint,
      payloadFingerprint: request.sourceInstanceCompilation.payloadFingerprint,
    },
    members,
    measurements,
    categoricalObservations,
    structuredTestResults,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = PatientClinicalResultCollectionCompilationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `patient-clinical-result-collection-compilation.${payloadFingerprint.slice(-16)}`,
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

export const verifyPatientClinicalResultCollectionCompilationIntegrity = (
  input: unknown,
): PatientClinicalResultCollectionCompilationIntegrityResult => {
  const parsed = PatientClinicalResultCollectionCompilationArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== PATIENT_CLINICAL_RESULT_COLLECTION_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported patient clinical-result collection compiler ${artifact.compilerVersion}.`,
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
  const upstream = verifyUpstreamArtifacts(artifact.compileRequest);
  if (!upstream.ok) {
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_COMPILATION_INVALID',
        message: upstream.message,
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
      `patient-clinical-result-collection-compilation.${artifact.payloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} payload fingerprint does not match its exact artifact.`,
      },
    };
  }
  const replay = compilePatientClinicalResultCollection(artifact.compileRequest);
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
