import {
  LocationOwnedPatientSlotSelectionArtifactSchema,
  LocationOwnedPatientSlotSelectionCompileInputSchema,
  type LocationOwnedPatientSlotCandidate,
  type LocationOwnedPatientSlotSelectionArtifact,
  type LocationOwnedPatientSlotSelectionCompileInput,
  type LocationOwnedPatientSlotSelectionFingerprint,
  type LocationOwnedPatientSlotSelectionRequest,
  type PatientTemplateLocationAdmissionMatrixArtifact,
} from '@psychsim/schemas';

import {
  compileAdmittedTemplateLocationBinding,
  verifyAdmittedTemplateLocationBindingIntegrity,
} from './admitted-template-location-binding-compiler';
import {
  fingerprintPatientTemplateLocationAdmissionLocation,
  verifyPatientTemplateLocationAdmissionMatrixContext,
  verifyPatientTemplateLocationAdmissionMatrixIntegrity,
} from './patient-template-location-admission-compiler';

export const LOCATION_OWNED_PATIENT_SLOT_SELECTION_COMPILER_VERSION = '2.0.0';

export type LocationOwnedPatientSlotSelectionCompileErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_MATRIX'
  | 'MATRIX_CONTEXT_MISMATCH'
  | 'SLOT_LOCATION_NOT_FOUND'
  | 'NO_ADMITTED_CANDIDATES'
  | 'SELECTED_ADMISSION_NOT_ELIGIBLE_FOR_LOCATION'
  | 'BINDING_COMPILE_FAILED'
  | 'INVALID_OUTPUT';

export type LocationOwnedPatientSlotSelectionCompileResult =
  | {
      readonly ok: true;
      readonly value: LocationOwnedPatientSlotSelectionArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: LocationOwnedPatientSlotSelectionCompileErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type LocationOwnedPatientSlotSelectionIntegrityResult =
  | {
      readonly ok: true;
      readonly value: LocationOwnedPatientSlotSelectionArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'UPSTREAM_INTEGRITY_INVALID'
          | 'CONTEXT_MISMATCH'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

export type LocationOwnedPatientSlotSelectionContextResult =
  | {
      readonly ok: true;
      readonly value: LocationOwnedPatientSlotSelectionArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_ARTIFACT' | 'MATRIX_CONTEXT_MISMATCH' | 'SELECTION_MISMATCH';
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

const sameCanonicalValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const hashToHex64 = (value: string): string => {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, '0');
};

const fingerprint = (scope: string, value: unknown): LocationOwnedPatientSlotSelectionFingerprint =>
  `fingerprint.location-owned-patient-slot-selection.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const matrixReference = (
  matrix: PatientTemplateLocationAdmissionMatrixArtifact,
): LocationOwnedPatientSlotSelectionRequest['admissionMatrixRef'] => ({
  id: matrix.id,
  inputFingerprint: matrix.inputFingerprint,
  payloadFingerprint: matrix.payloadFingerprint,
});

const compactRequest = (
  input: LocationOwnedPatientSlotSelectionCompileInput,
  matrix: PatientTemplateLocationAdmissionMatrixArtifact,
): LocationOwnedPatientSlotSelectionRequest => ({
  schemaVersion: 1,
  id: input.id,
  slotCoordinate: input.slotCoordinate,
  admissionMatrixRef: matrixReference(matrix),
  selectedAdmissionEvaluationId: input.selectedAdmissionEvaluationId,
});

const candidateSortKey = (candidate: LocationOwnedPatientSlotCandidate): string =>
  `${candidate.templateRef.id}@${candidate.templateRef.contentVersion}\u0000${candidate.admissionEvaluationId}`;

export const enumerateLocationOwnedPatientSlotCandidates = (
  matrix: PatientTemplateLocationAdmissionMatrixArtifact,
  locationRef: LocationOwnedPatientSlotSelectionCompileInput['slotCoordinate']['locationRef'],
): LocationOwnedPatientSlotCandidate[] =>
  matrix.admissionEvaluations
    .filter(
      (evaluation) =>
        evaluation.locationRef.id === locationRef.id &&
        evaluation.locationRef.contentVersion === locationRef.contentVersion &&
        evaluation.status === 'admitted' &&
        evaluation.diagnostics.length === 0 &&
        evaluation.operationalAdmissionArtifact?.status === 'complete',
    )
    .map((evaluation) => ({
      schemaVersion: 1 as const,
      admissionEvaluationId: evaluation.id,
      templateRef: evaluation.templateRef,
      templateFingerprint: evaluation.templateFingerprint,
      patientPool: evaluation.patientPool,
      careSetting: evaluation.templateCareSetting,
    }))
    .sort((left, right) => compareStrings(candidateSortKey(left), candidateSortKey(right)));

const artifactPayload = (
  artifact: Omit<LocationOwnedPatientSlotSelectionArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  slotCoordinate: artifact.slotCoordinate,
  admissionMatrixRef: artifact.admissionMatrixRef,
  mechanicallyAdmittedCandidates: artifact.mechanicallyAdmittedCandidates,
  selectedAdmissionEvaluationId: artifact.selectedAdmissionEvaluationId,
  admittedTemplateLocationBindingArtifact: artifact.admittedTemplateLocationBindingArtifact,
  selectionRequest: artifact.selectionRequest,
  inputFingerprint: artifact.inputFingerprint,
});

/**
 * Certifies one caller-selected admitted template for one exact physical
 * location-owned slot. D-229 enumerates every mechanically admitted D-226 cell
 * at that location, but deliberately does not choose among them.
 */
export const compileLocationOwnedPatientSlotSelection = (
  input: unknown,
): LocationOwnedPatientSlotSelectionCompileResult => {
  const parsed = LocationOwnedPatientSlotSelectionCompileInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: issuesText(parsed.error.issues),
        contentIds: [],
      },
    };
  }
  const request = parsed.data;
  const matrixIntegrity = verifyPatientTemplateLocationAdmissionMatrixIntegrity(
    request.admissionMatrixArtifact,
  );
  if (!matrixIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_MATRIX',
        message: `${matrixIntegrity.error.code}: ${matrixIntegrity.error.message}`,
        contentIds: [request.admissionMatrixArtifact.id],
      },
    };
  }
  const matrixContext = verifyPatientTemplateLocationAdmissionMatrixContext({
    artifact: matrixIntegrity.value,
    request: request.currentAdmissionMatrixRequest,
  });
  if (!matrixContext.ok) {
    return {
      ok: false,
      error: {
        code: 'MATRIX_CONTEXT_MISMATCH',
        message: `${matrixContext.error.code}: ${matrixContext.error.message}`,
        contentIds: [matrixIntegrity.value.id],
      },
    };
  }
  const matrix = matrixContext.value;
  const location = matrix.compileRequest.locations.find(
    (entry) =>
      entry.id === request.slotCoordinate.locationRef.id &&
      entry.contentVersion === request.slotCoordinate.locationRef.contentVersion,
  );
  if (location === undefined) {
    return {
      ok: false,
      error: {
        code: 'SLOT_LOCATION_NOT_FOUND',
        message:
          'A location-owned slot must reference one exact currently built location in the current D-226 matrix.',
        contentIds: [matrix.id, request.slotCoordinate.id, request.slotCoordinate.locationRef.id],
      },
    };
  }
  const mechanicallyAdmittedCandidates = enumerateLocationOwnedPatientSlotCandidates(
    matrix,
    request.slotCoordinate.locationRef,
  );
  if (mechanicallyAdmittedCandidates.length === 0) {
    return {
      ok: false,
      error: {
        code: 'NO_ADMITTED_CANDIDATES',
        message:
          'The exact physical location has no mechanically admitted template in the current D-226 horizon; D-229 does not fall back to another location or a global queue.',
        contentIds: [matrix.id, request.slotCoordinate.id, location.id],
      },
    };
  }
  const selected = mechanicallyAdmittedCandidates.find(
    (candidate) => candidate.admissionEvaluationId === request.selectedAdmissionEvaluationId,
  );
  if (selected === undefined) {
    return {
      ok: false,
      error: {
        code: 'SELECTED_ADMISSION_NOT_ELIGIBLE_FOR_LOCATION',
        message:
          'The caller-selected D-226 cell is not an admitted candidate for this exact physical location.',
        contentIds: [matrix.id, request.slotCoordinate.id, request.selectedAdmissionEvaluationId],
      },
    };
  }
  const binding = compileAdmittedTemplateLocationBinding({
    schemaVersion: 1,
    id: `admitted-binding-request.d229.${hashToHex64(
      JSON.stringify(
        canonicalizeObjectKeys({
          requestId: request.id,
          admissionMatrixId: matrix.id,
          selectedAdmissionEvaluationId: selected.admissionEvaluationId,
        }),
      ),
    )}`,
    admissionMatrixArtifact: matrix,
    currentAdmissionMatrixRequest: request.currentAdmissionMatrixRequest,
    admissionEvaluationId: selected.admissionEvaluationId,
  });
  if (!binding.ok) {
    return {
      ok: false,
      error: {
        code: 'BINDING_COMPILE_FAILED',
        message: `${binding.error.code}: ${binding.error.message}`,
        contentIds: binding.error.contentIds,
      },
    };
  }
  const selectionRequest = compactRequest(request, matrix);
  const inputFingerprint = fingerprint('input', selectionRequest);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: LOCATION_OWNED_PATIENT_SLOT_SELECTION_COMPILER_VERSION,
    requestId: selectionRequest.id,
    slotCoordinate: {
      schemaVersion: 1 as const,
      id: request.slotCoordinate.id,
      locationRef: request.slotCoordinate.locationRef,
      locationFingerprint: fingerprintPatientTemplateLocationAdmissionLocation(location),
      careSetting: location.careSetting,
    },
    admissionMatrixRef: selectionRequest.admissionMatrixRef,
    mechanicallyAdmittedCandidates,
    selectedAdmissionEvaluationId: selected.admissionEvaluationId,
    admittedTemplateLocationBindingArtifact: binding.value,
    selectionRequest,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = LocationOwnedPatientSlotSelectionArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `location-owned-patient-slot-selection.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(output.error.issues),
        contentIds: [matrix.id, request.slotCoordinate.id, selected.admissionEvaluationId],
      },
    };
  }
  return { ok: true, value: output.data };
};

export const verifyLocationOwnedPatientSlotSelectionIntegrity = (
  value: unknown,
): LocationOwnedPatientSlotSelectionIntegrityResult => {
  const parsed = LocationOwnedPatientSlotSelectionArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (artifact.compilerVersion !== LOCATION_OWNED_PATIENT_SLOT_SELECTION_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported location-owned patient-slot compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const binding = verifyAdmittedTemplateLocationBindingIntegrity(
    artifact.admittedTemplateLocationBindingArtifact,
  );
  if (!binding.ok) {
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_INTEGRITY_INVALID',
        message: `${binding.error.code}: ${binding.error.message}`,
      },
    };
  }
  const selected = artifact.mechanicallyAdmittedCandidates.find(
    (candidate) => candidate.admissionEvaluationId === artifact.selectedAdmissionEvaluationId,
  );
  if (
    selected === undefined ||
    binding.value.admissionEvaluationId !== selected.admissionEvaluationId ||
    binding.value.template.id !== selected.templateRef.id ||
    binding.value.template.contentVersion !== selected.templateRef.contentVersion ||
    binding.value.templateFingerprint !== selected.templateFingerprint ||
    binding.value.location.id !== artifact.slotCoordinate.locationRef.id ||
    binding.value.location.contentVersion !== artifact.slotCoordinate.locationRef.contentVersion ||
    binding.value.locationFingerprint !== artifact.slotCoordinate.locationFingerprint ||
    binding.value.careSetting !== artifact.slotCoordinate.careSetting
  ) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message:
          'The selected local candidate, resolved slot coordinate, and nested D-228 binding do not agree.',
      },
    };
  }
  const expectedInputFingerprint = fingerprint('input', artifact.selectionRequest);
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its compact location-slot request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `location-owned-patient-slot-selection.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen location-slot payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyLocationOwnedPatientSlotSelectionContext = (input: {
  readonly artifact: unknown;
  readonly admissionMatrixArtifact: unknown;
  readonly currentAdmissionMatrixRequest: unknown;
}): LocationOwnedPatientSlotSelectionContextResult => {
  const integrity = verifyLocationOwnedPatientSlotSelectionIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const matrixContext = verifyPatientTemplateLocationAdmissionMatrixContext({
    artifact: input.admissionMatrixArtifact,
    request: input.currentAdmissionMatrixRequest,
  });
  if (!matrixContext.ok) {
    return {
      ok: false,
      error: {
        code: 'MATRIX_CONTEXT_MISMATCH',
        message: `${matrixContext.error.code}: ${matrixContext.error.message}`,
      },
    };
  }
  const replay = compileLocationOwnedPatientSlotSelection({
    schemaVersion: 1,
    id: integrity.value.requestId,
    slotCoordinate: integrity.value.selectionRequest.slotCoordinate,
    admissionMatrixArtifact: matrixContext.value,
    currentAdmissionMatrixRequest: input.currentAdmissionMatrixRequest,
    selectedAdmissionEvaluationId: integrity.value.selectedAdmissionEvaluationId,
  });
  if (!replay.ok || !sameCanonicalValue(replay.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'SELECTION_MISMATCH',
        message:
          'The location-owned patient-slot selection does not match the exact current D-226 matrix, local admitted horizon, and caller-selected cell.',
      },
    };
  }
  return { ok: true, value: integrity.value };
};
