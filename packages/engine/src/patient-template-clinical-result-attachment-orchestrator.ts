import {
  PatientTemplateClinicalResultAttachmentOrchestrationArtifactSchema,
  PatientTemplateClinicalResultAttachmentOrchestrationRequestSchema,
  type PatientTemplateClinicalResultAttachmentOrchestrationArtifact,
  type PatientTemplateClinicalResultAttachmentOrchestrationFingerprint,
} from '@psychsim/schemas';

import {
  attachPatientClinicalResults,
  verifyPatientClinicalResultAttachmentIntegrity,
} from './patient-clinical-result-attachment';
import { verifyPatientTemplateClinicalResultMaterializationIntegrity } from './patient-template-clinical-result-materialization-compiler';

export const PATIENT_TEMPLATE_CLINICAL_RESULT_ATTACHMENT_ORCHESTRATOR_VERSION = '1.0.0';

export type PatientTemplateClinicalResultAttachmentOrchestrationResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateClinicalResultAttachmentOrchestrationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'MATERIALIZATION_INVALID'
          | 'PATIENT_STATE_NOT_COMPOSED'
          | 'ATTACHMENT_FAILED'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type PatientTemplateClinicalResultAttachmentOrchestrationIntegrityResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateClinicalResultAttachmentOrchestrationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'MATERIALIZATION_INVALID'
          | 'ATTACHMENT_INVALID'
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

const sameExactValue = (left: unknown, right: unknown): boolean =>
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

const fingerprint = (
  scope: string,
  value: unknown,
): PatientTemplateClinicalResultAttachmentOrchestrationFingerprint =>
  `fingerprint.patient-template-clinical-result-attachment-orchestration.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: Exclude<
    PatientTemplateClinicalResultAttachmentOrchestrationResult,
    { readonly ok: true }
  >['error']['code'],
  message: string,
  contentIds: readonly string[] = [],
): PatientTemplateClinicalResultAttachmentOrchestrationResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const attachmentRequestId = (materializationId: string): string =>
  `patient-clinical-result-attachment-request.orchestrated.${hashToHex64(materializationId)}`;

const artifactPayload = (
  artifact: Omit<
    PatientTemplateClinicalResultAttachmentOrchestrationArtifact,
    'id' | 'payloadFingerprint'
  >,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  basePatientStateId: artifact.basePatientStateId,
  attachedPatientStateId: artifact.attachedPatientStateId,
  materializationRef: artifact.materializationRef,
  patientClinicalResultAttachmentRef: artifact.patientClinicalResultAttachmentRef,
  patientClinicalResultAttachment: artifact.patientClinicalResultAttachment,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const orchestratePatientTemplateClinicalResultAttachment = (
  input: unknown,
): PatientTemplateClinicalResultAttachmentOrchestrationResult => {
  const parsed = PatientTemplateClinicalResultAttachmentOrchestrationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues));
  }
  const request = parsed.data;
  const materializationIntegrity = verifyPatientTemplateClinicalResultMaterializationIntegrity(
    request.materializationArtifact,
  );
  if (!materializationIntegrity.ok) {
    return fail(
      'MATERIALIZATION_INVALID',
      `${materializationIntegrity.error.code}: ${materializationIntegrity.error.message}`,
      [request.materializationArtifact.id],
    );
  }
  const materialization = materializationIntegrity.value;
  const composition =
    materialization.compileRequest.materializationContextArtifact.compileRequest
      .patientStateCompositionArtifact;
  const basePatientState = composition.composedPatientState;
  if (basePatientState === null || composition.status !== 'composed') {
    return fail(
      'PATIENT_STATE_NOT_COMPOSED',
      'D-327 requires the completed D-208 patient retained by D-326.',
      [composition.id],
    );
  }
  const attachment = attachPatientClinicalResults({
    schemaVersion: 1,
    id: attachmentRequestId(materialization.id),
    patientStateCompositionArtifact: composition,
    templateClinicalResultRecipeCompilation:
      materialization.templateClinicalResultRecipeCompilation,
  });
  if (!attachment.ok) {
    return fail('ATTACHMENT_FAILED', `${attachment.error.code}: ${attachment.error.message}`, [
      materialization.id,
      ...attachment.error.contentIds,
    ]);
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_TEMPLATE_CLINICAL_RESULT_ATTACHMENT_ORCHESTRATOR_VERSION,
    requestId: request.id,
    basePatientStateId: basePatientState.id,
    attachedPatientStateId: attachment.value.composedPatientState.id,
    materializationRef: {
      id: materialization.id,
      inputFingerprint: materialization.inputFingerprint,
      payloadFingerprint: materialization.payloadFingerprint,
    },
    patientClinicalResultAttachmentRef: {
      id: attachment.value.id,
      inputFingerprint: attachment.value.inputFingerprint,
      payloadFingerprint: attachment.value.payloadFingerprint,
      composedPatientStateFingerprint: attachment.value.composedPatientStateFingerprint,
    },
    patientClinicalResultAttachment: attachment.value,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = PatientTemplateClinicalResultAttachmentOrchestrationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `patient-template-clinical-result-attachment-orchestration.${payloadFingerprint.slice(
      -16,
    )}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
      request.id,
      materialization.id,
      attachment.value.id,
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyPatientTemplateClinicalResultAttachmentOrchestrationIntegrity = (
  input: unknown,
): PatientTemplateClinicalResultAttachmentOrchestrationIntegrityResult => {
  const parsed =
    PatientTemplateClinicalResultAttachmentOrchestrationArtifactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (
    artifact.compilerVersion !== PATIENT_TEMPLATE_CLINICAL_RESULT_ATTACHMENT_ORCHESTRATOR_VERSION
  ) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported result-attachment orchestrator ${artifact.compilerVersion}.`,
      },
    };
  }
  const materialization = verifyPatientTemplateClinicalResultMaterializationIntegrity(
    artifact.compileRequest.materializationArtifact,
  );
  if (!materialization.ok) {
    return {
      ok: false,
      error: {
        code: 'MATERIALIZATION_INVALID',
        message: `${materialization.error.code}: ${materialization.error.message}`,
      },
    };
  }
  const attachment = verifyPatientClinicalResultAttachmentIntegrity(
    artifact.patientClinicalResultAttachment,
  );
  if (!attachment.ok) {
    return {
      ok: false,
      error: {
        code: 'ATTACHMENT_INVALID',
        message: `${attachment.error.code}: ${attachment.error.message}`,
      },
    };
  }
  if (artifact.inputFingerprint !== fingerprint('input', artifact.compileRequest)) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact D-326 request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `patient-template-clinical-result-attachment-orchestration.${expectedPayloadFingerprint.slice(
        -16,
      )}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact D-327 payload.`,
      },
    };
  }
  const replay = orchestratePatientTemplateClinicalResultAttachment(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: replay.ok
          ? `${artifact.id} does not replay to its stored result attachment.`
          : `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  return { ok: true, value: artifact };
};
