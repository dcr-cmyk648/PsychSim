import {
  ResolvedPatientStateSourceValidationArtifactSchema,
  ResolvedPatientStateSourceValidationRequestSchema,
  type PatientSceneEvidenceSourceKind,
  type PatientStateScopedSource,
  type ResolvedPatientState,
  type ResolvedPatientStateSourceReferenceLane,
  type ResolvedPatientStateSourceValidationArtifact,
  type ResolvedPatientStateSourceValidationFingerprint,
  type ResolvedPatientStateSourceValidationRequest,
  type ResolvedPatientStateValidatedSourceBinding,
} from '@psychsim/schemas';

import {
  validatePatientStateScopedSource,
  verifyPatientSceneSourceInstanceCompilationIntegrity,
} from './patient-scene-source-instance-compiler';
import { verifyResolvedPatientStateCompositionIntegrity } from './resolved-patient-state-composer';

export const RESOLVED_PATIENT_STATE_SOURCE_VALIDATION_VERSION = '3.0.0';

export type ResolvedPatientStateSourceValidationErrorCode =
  | 'INVALID_REQUEST'
  | 'PATIENT_STATE_COMPOSITION_INVALID'
  | 'PATIENT_STATE_NOT_COMPOSED'
  | 'SOURCE_HORIZON_INVALID'
  | 'PATIENT_STATE_CONTEXT_MISMATCH'
  | 'SOURCE_REFERENCE_INVALID'
  | 'INVALID_OUTPUT';

export type ResolvedPatientStateSourceValidationResult =
  | { readonly ok: true; readonly value: ResolvedPatientStateSourceValidationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: ResolvedPatientStateSourceValidationErrorCode;
        readonly message: string;
      };
    };

export type ResolvedPatientStateSourceValidationIntegrityResult =
  | { readonly ok: true; readonly value: ResolvedPatientStateSourceValidationArtifact }
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
): ResolvedPatientStateSourceValidationFingerprint =>
  `fingerprint.resolved-patient-state-source-validation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const fail = (
  code: ResolvedPatientStateSourceValidationErrorCode,
  message: string,
): ResolvedPatientStateSourceValidationResult => ({
  ok: false,
  error: { code, message },
});

const artifactPayload = (
  artifact: Omit<ResolvedPatientStateSourceValidationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  patientStateCompositionRef: artifact.patientStateCompositionRef,
  sourceInstanceCompilationRef: artifact.sourceInstanceCompilationRef,
  validatedSourceBindings: artifact.validatedSourceBindings,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

interface SourceCandidate {
  readonly lane: ResolvedPatientStateSourceReferenceLane;
  readonly recordId: string;
  readonly sourceInstanceId: string;
  readonly expectedSourceKind: PatientSceneEvidenceSourceKind;
  readonly source: PatientStateScopedSource;
}

const exactCandidate = (
  lane: ResolvedPatientStateSourceReferenceLane,
  recordId: string,
  source: PatientStateScopedSource,
): SourceCandidate => ({
  lane,
  recordId,
  sourceInstanceId: source.sourceInstanceId,
  expectedSourceKind: source.kind,
  source,
});

const collectSourceCandidates = (state: ResolvedPatientState): SourceCandidate[] => [
  ...state.diagnosisRecordEntries.map((record) =>
    exactCandidate('diagnosis_record', record.id, record.source),
  ),
  ...state.currentMedicationReportedBenefits.map((record) =>
    exactCandidate('current_medication_reported_benefit', record.id, record.source),
  ),
  ...state.currentMedicationDosePositions.map((record) =>
    exactCandidate('current_medication_dose_position', record.id, record.source),
  ),
  ...state.medicationChangeTemporalRelationships.map((record) =>
    exactCandidate('medication_change_temporal_relationship', record.id, record.source),
  ),
  ...state.measurements.flatMap((record) =>
    record.source.kind === 'derived_measurement'
      ? []
      : [exactCandidate('measurement', record.id, record.source)],
  ),
  ...state.categoricalObservations.map((record) =>
    exactCandidate('categorical_observation', record.id, record.source),
  ),
  ...state.structuredTestResults.map((record) =>
    exactCandidate('structured_test_result', record.id, record.source),
  ),
  ...state.clinicalDurations.map((record) =>
    exactCandidate('clinical_duration', record.id, record.source),
  ),
  ...state.functionalImpairments.map((record) =>
    exactCandidate('functional_impairment', record.id, record.source),
  ),
  ...state.subjectiveBurdenRecords.map((record) =>
    exactCandidate('subjective_burden', record.id, record.source),
  ),
  ...state.propositionState.evidence.map((record) =>
    exactCandidate('proposition_evidence', record.id, record.source),
  ),
];

export const validateResolvedPatientStateSources = (
  input: unknown,
): ResolvedPatientStateSourceValidationResult => {
  const parsed = ResolvedPatientStateSourceValidationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues));
  }
  const request: ResolvedPatientStateSourceValidationRequest = parsed.data;
  const composition = verifyResolvedPatientStateCompositionIntegrity(
    request.patientStateComposition,
  );
  if (!composition.ok) {
    return fail('PATIENT_STATE_COMPOSITION_INVALID', composition.error.message);
  }
  if (
    composition.value.status !== 'composed' ||
    composition.value.composedPatientState === null ||
    composition.value.composedPatientStateFingerprint === null
  ) {
    return fail(
      'PATIENT_STATE_NOT_COMPOSED',
      `${composition.value.id} has no composed patient state to validate.`,
    );
  }
  const sourceHorizon = verifyPatientSceneSourceInstanceCompilationIntegrity(
    request.sourceInstanceCompilation,
  );
  if (!sourceHorizon.ok) {
    return fail('SOURCE_HORIZON_INVALID', sourceHorizon.error.message);
  }
  const patientState = composition.value.composedPatientState;
  if (sourceHorizon.value.patientStateId !== patientState.id) {
    return fail(
      'PATIENT_STATE_CONTEXT_MISMATCH',
      `${sourceHorizon.value.id} belongs to ${sourceHorizon.value.patientStateId}, not composed patient ${patientState.id}.`,
    );
  }

  const validatedSourceBindings: ResolvedPatientStateValidatedSourceBinding[] = [];
  for (const candidate of collectSourceCandidates(patientState)) {
    const validation = validatePatientStateScopedSource(
      candidate.source,
      patientState.id,
      sourceHorizon.value,
    );
    if (!validation.ok) {
      return fail(
        'SOURCE_REFERENCE_INVALID',
        `${candidate.lane}:${candidate.recordId}: ${validation.error.code}: ${validation.error.message}`,
      );
    }
    const sourceInstance = sourceHorizon.value.sourceInstances.find(
      (instance) => instance.id === candidate.sourceInstanceId,
    );
    if (sourceInstance === undefined || sourceInstance.patientStateId !== patientState.id) {
      return fail(
        'SOURCE_REFERENCE_INVALID',
        `${candidate.lane}:${candidate.recordId}: source ${candidate.sourceInstanceId} is absent from the exact patient horizon.`,
      );
    }
    validatedSourceBindings.push({
      lane: candidate.lane,
      recordId: candidate.recordId,
      sourceInstanceId: candidate.sourceInstanceId,
      sourceKind: sourceInstance.kind,
      sourceDefinitionId: sourceInstance.definitionRef.id,
      sourceDefinitionContentVersion: sourceInstance.definitionRef.contentVersion,
      validationMode: 'source_and_kind',
    });
  }
  validatedSourceBindings.sort((left, right) =>
    compareStrings(`${left.lane}\u0000${left.recordId}`, `${right.lane}\u0000${right.recordId}`),
  );

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: RESOLVED_PATIENT_STATE_SOURCE_VALIDATION_VERSION,
    requestId: request.id,
    patientStateId: patientState.id,
    patientStateCompositionRef: {
      id: composition.value.id,
      payloadFingerprint: composition.value.payloadFingerprint,
      composedPatientStateFingerprint: composition.value.composedPatientStateFingerprint,
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
  const output = ResolvedPatientStateSourceValidationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `resolved-patient-state-source-validation.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues));
  }
  return { ok: true, value: output.data };
};

export const verifyResolvedPatientStateSourceValidationIntegrity = (
  input: unknown,
): ResolvedPatientStateSourceValidationIntegrityResult => {
  const parsed = ResolvedPatientStateSourceValidationArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== RESOLVED_PATIENT_STATE_SOURCE_VALIDATION_VERSION) {
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
      `resolved-patient-state-source-validation.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen source-validation payload.`,
      },
    };
  }
  const replay = validateResolvedPatientStateSources(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained D-208 composed patient state and D-291 source horizon do not reproduce the exact source-validation artifact.',
      },
    };
  }
  return { ok: true, value: artifact };
};
