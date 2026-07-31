import {
  AdmittedTemplateLocationBindingArtifactSchema,
  AdmittedTemplateLocationBindingCompileInputSchema,
  type AdmittedTemplateLocationBindingArtifact,
  type AdmittedTemplateLocationBindingCompileInput,
  type AdmittedTemplateLocationBindingFingerprint,
  type AdmittedTemplateLocationBindingRequest,
  type PatientTemplateLocationAdmissionMatrixArtifact,
} from '@psychsim/schemas';

import { verifyEncounterOperationalAdmissionIntegrity } from './encounter-operational-admission-compiler';
import {
  fingerprintPatientTemplateLocationAdmissionLocation,
  fingerprintPatientTemplateLocationAdmissionTemplate,
  verifyPatientTemplateLocationAdmissionMatrixContext,
  verifyPatientTemplateLocationAdmissionMatrixIntegrity,
} from './patient-template-location-admission-compiler';

export const ADMITTED_TEMPLATE_LOCATION_BINDING_COMPILER_VERSION = '2.0.0';

export type AdmittedTemplateLocationBindingCompileErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_MATRIX'
  | 'MATRIX_CONTEXT_MISMATCH'
  | 'ADMISSION_CELL_NOT_FOUND'
  | 'ADMISSION_CELL_NOT_ADMITTED'
  | 'TEMPLATE_NOT_FOUND'
  | 'LOCATION_NOT_FOUND'
  | 'INVALID_OUTPUT';

export type AdmittedTemplateLocationBindingCompileResult =
  | {
      readonly ok: true;
      readonly value: AdmittedTemplateLocationBindingArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: AdmittedTemplateLocationBindingCompileErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type AdmittedTemplateLocationBindingIntegrityResult =
  | {
      readonly ok: true;
      readonly value: AdmittedTemplateLocationBindingArtifact;
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

export type AdmittedTemplateLocationBindingContextResult =
  | {
      readonly ok: true;
      readonly value: AdmittedTemplateLocationBindingArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_ARTIFACT' | 'MATRIX_CONTEXT_MISMATCH' | 'BINDING_MISMATCH';
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

const fingerprint = (scope: string, value: unknown): AdmittedTemplateLocationBindingFingerprint =>
  `fingerprint.admitted-template-location-binding.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const artifactPayload = (
  artifact: Omit<AdmittedTemplateLocationBindingArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  admissionMatrixRef: artifact.admissionMatrixRef,
  admissionEvaluationId: artifact.admissionEvaluationId,
  patientPool: artifact.patientPool,
  careSetting: artifact.careSetting,
  template: artifact.template,
  templateFingerprint: artifact.templateFingerprint,
  location: artifact.location,
  locationFingerprint: artifact.locationFingerprint,
  selectedLocationResourceRef: artifact.selectedLocationResourceRef,
  operationalAdmissionArtifact: artifact.operationalAdmissionArtifact,
  bindingRequest: artifact.bindingRequest,
  inputFingerprint: artifact.inputFingerprint,
});

const compactRequest = (
  input: AdmittedTemplateLocationBindingCompileInput,
  matrix: PatientTemplateLocationAdmissionMatrixArtifact,
): AdmittedTemplateLocationBindingRequest => ({
  schemaVersion: 1,
  id: input.id,
  admissionMatrixRef: {
    id: matrix.id,
    inputFingerprint: matrix.inputFingerprint,
    payloadFingerprint: matrix.payloadFingerprint,
  },
  admissionEvaluationId: input.admissionEvaluationId,
});

export const compileAdmittedTemplateLocationBinding = (
  input: unknown,
): AdmittedTemplateLocationBindingCompileResult => {
  const parsed = AdmittedTemplateLocationBindingCompileInputSchema.safeParse(input);
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
  const cell = matrix.admissionEvaluations.find(
    (evaluation) => evaluation.id === request.admissionEvaluationId,
  );
  if (cell === undefined) {
    return {
      ok: false,
      error: {
        code: 'ADMISSION_CELL_NOT_FOUND',
        message: `Admission cell ${request.admissionEvaluationId} is not present in ${matrix.id}.`,
        contentIds: [matrix.id, request.admissionEvaluationId],
      },
    };
  }
  if (
    cell.status !== 'admitted' ||
    cell.diagnostics.length !== 0 ||
    cell.operationalAdmissionArtifact === null ||
    cell.operationalAdmissionArtifact.status !== 'complete'
  ) {
    return {
      ok: false,
      error: {
        code: 'ADMISSION_CELL_NOT_ADMITTED',
        message:
          'An admitted binding requires one diagnostic-free D-226 cell with a complete D-219 artifact.',
        contentIds: [matrix.id, cell.id, ...cell.diagnostics.map((entry) => entry.id)],
      },
    };
  }
  const template = matrix.compileRequest.templateHorizonArtifact.templates.find(
    (entry) =>
      entry.id === cell.templateRef.id && entry.contentVersion === cell.templateRef.contentVersion,
  );
  if (template === undefined) {
    return {
      ok: false,
      error: {
        code: 'TEMPLATE_NOT_FOUND',
        message: 'The admitted cell does not resolve to one exact template payload in D-226.',
        contentIds: [matrix.id, cell.id, cell.templateRef.id],
      },
    };
  }
  const location = matrix.compileRequest.locations.find(
    (entry) =>
      entry.id === cell.locationRef.id && entry.contentVersion === cell.locationRef.contentVersion,
  );
  if (location === undefined) {
    return {
      ok: false,
      error: {
        code: 'LOCATION_NOT_FOUND',
        message: 'The admitted cell does not resolve to one exact location payload in D-226.',
        contentIds: [matrix.id, cell.id, cell.locationRef.id],
      },
    };
  }
  const bindingRequest = compactRequest(request, matrix);
  const operationalAdmissionArtifact = cell.operationalAdmissionArtifact;
  const selectedResource =
    operationalAdmissionArtifact.compileRequest.selectedLocationResourceArtifact;
  const inputFingerprint = fingerprint('input', bindingRequest);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: ADMITTED_TEMPLATE_LOCATION_BINDING_COMPILER_VERSION,
    requestId: bindingRequest.id,
    admissionMatrixRef: bindingRequest.admissionMatrixRef,
    admissionEvaluationId: cell.id,
    patientPool: cell.patientPool,
    careSetting: cell.templateCareSetting,
    template,
    templateFingerprint: cell.templateFingerprint,
    location,
    locationFingerprint: cell.locationFingerprint,
    selectedLocationResourceRef: {
      id: selectedResource.id,
      payloadFingerprint: selectedResource.payloadFingerprint,
    },
    operationalAdmissionArtifact,
    bindingRequest,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = AdmittedTemplateLocationBindingArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `admitted-template-location-binding.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(output.error.issues),
        contentIds: [matrix.id, cell.id, template.id, location.id],
      },
    };
  }
  return { ok: true, value: output.data };
};

export const verifyAdmittedTemplateLocationBindingIntegrity = (
  value: unknown,
): AdmittedTemplateLocationBindingIntegrityResult => {
  const parsed = AdmittedTemplateLocationBindingArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (artifact.compilerVersion !== ADMITTED_TEMPLATE_LOCATION_BINDING_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported admitted template/location binding compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const operationalIntegrity = verifyEncounterOperationalAdmissionIntegrity(
    artifact.operationalAdmissionArtifact,
  );
  if (!operationalIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_INTEGRITY_INVALID',
        message: `${operationalIntegrity.error.code}: ${operationalIntegrity.error.message}`,
      },
    };
  }
  if (
    artifact.operationalAdmissionArtifact.status !== 'complete' ||
    artifact.patientPool !== artifact.template.patientPool ||
    !sameCanonicalValue(
      artifact.template,
      artifact.operationalAdmissionArtifact.compileRequest.template,
    ) ||
    !sameCanonicalValue(
      artifact.location,
      artifact.operationalAdmissionArtifact.compileRequest.selectedLocationResourceArtifact
        .compileRequest.selectedLocation,
    ) ||
    artifact.templateFingerprint !==
      fingerprintPatientTemplateLocationAdmissionTemplate(artifact.template) ||
    artifact.locationFingerprint !==
      fingerprintPatientTemplateLocationAdmissionLocation(artifact.location)
  ) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message:
          'The admitted binding template, location, fingerprints, or complete operational proof do not agree.',
      },
    };
  }
  const expectedInputFingerprint = fingerprint('input', artifact.bindingRequest);
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its compact binding request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `admitted-template-location-binding.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen admitted-cell payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyAdmittedTemplateLocationBindingContext = (input: {
  readonly artifact: unknown;
  readonly admissionMatrixArtifact: unknown;
  readonly currentAdmissionMatrixRequest: unknown;
}): AdmittedTemplateLocationBindingContextResult => {
  const integrity = verifyAdmittedTemplateLocationBindingIntegrity(input.artifact);
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
  const replay = compileAdmittedTemplateLocationBinding({
    schemaVersion: 1,
    id: integrity.value.requestId,
    admissionMatrixArtifact: matrixContext.value,
    currentAdmissionMatrixRequest: input.currentAdmissionMatrixRequest,
    admissionEvaluationId: integrity.value.admissionEvaluationId,
  });
  if (!replay.ok || !sameCanonicalValue(replay.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'BINDING_MISMATCH',
        message:
          'The admitted binding does not match the exact caller-supplied current D-226 matrix and cell.',
      },
    };
  }
  return { ok: true, value: integrity.value };
};
