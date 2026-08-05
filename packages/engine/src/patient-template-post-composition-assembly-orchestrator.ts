import {
  PatientTemplatePostCompositionAssemblyOrchestrationArtifactSchema,
  PatientTemplatePostCompositionAssemblyOrchestrationRequestSchema,
  type PatientTemplatePostCompositionAssemblyOrchestrationArtifact,
  type PatientTemplatePostCompositionAssemblyOrchestrationFingerprint,
} from '@psychsim/schemas';

import {
  assemblePostCompositionPatientState,
  verifyPostCompositionPatientStateAssemblyIntegrity,
} from './post-composition-patient-state-assembler';
import { verifyPatientTemplateClinicalResultAttachmentOrchestrationIntegrity } from './patient-template-clinical-result-attachment-orchestrator';

export const PATIENT_TEMPLATE_POST_COMPOSITION_ASSEMBLY_ORCHESTRATOR_VERSION = '1.0.0';

export type PatientTemplatePostCompositionAssemblyOrchestrationResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplatePostCompositionAssemblyOrchestrationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'CLINICAL_RESULT_ATTACHMENT_ORCHESTRATION_INVALID'
          | 'PATIENT_STATE_NOT_COMPOSED'
          | 'POST_COMPOSITION_ASSEMBLY_FAILED'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type PatientTemplatePostCompositionAssemblyOrchestrationIntegrityResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplatePostCompositionAssemblyOrchestrationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'CLINICAL_RESULT_ATTACHMENT_ORCHESTRATION_INVALID'
          | 'POST_COMPOSITION_ASSEMBLY_INVALID'
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
): PatientTemplatePostCompositionAssemblyOrchestrationFingerprint =>
  `fingerprint.patient-template-post-composition-assembly-orchestration.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: Exclude<
    PatientTemplatePostCompositionAssemblyOrchestrationResult,
    { readonly ok: true }
  >['error']['code'],
  message: string,
  contentIds: readonly string[] = [],
): PatientTemplatePostCompositionAssemblyOrchestrationResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const assemblyRequestId = (orchestrationId: string): string =>
  `post-composition-patient-state-assembly-request.orchestrated.${hashToHex64(orchestrationId)}`;

const artifactPayload = (
  artifact: Omit<
    PatientTemplatePostCompositionAssemblyOrchestrationArtifact,
    'id' | 'payloadFingerprint'
  >,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  basePatientStateId: artifact.basePatientStateId,
  composedPatientStateId: artifact.composedPatientStateId,
  clinicalResultAttachmentOrchestrationRef: artifact.clinicalResultAttachmentOrchestrationRef,
  postCompositionAssemblyRef: artifact.postCompositionAssemblyRef,
  postCompositionAssembly: artifact.postCompositionAssembly,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const orchestratePatientTemplatePostCompositionAssembly = (
  input: unknown,
): PatientTemplatePostCompositionAssemblyOrchestrationResult => {
  const parsed = PatientTemplatePostCompositionAssemblyOrchestrationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues));
  }
  const request = parsed.data;
  const resultOrchestration = verifyPatientTemplateClinicalResultAttachmentOrchestrationIntegrity(
    request.clinicalResultAttachmentOrchestrationArtifact,
  );
  if (!resultOrchestration.ok) {
    return fail(
      'CLINICAL_RESULT_ATTACHMENT_ORCHESTRATION_INVALID',
      `${resultOrchestration.error.code}: ${resultOrchestration.error.message}`,
      [request.clinicalResultAttachmentOrchestrationArtifact.id],
    );
  }
  const orchestration = resultOrchestration.value;
  const materialization = orchestration.compileRequest.materializationArtifact;
  const composition =
    materialization.compileRequest.materializationContextArtifact.compileRequest
      .patientStateCompositionArtifact;
  const basePatientState = composition.composedPatientState;
  if (basePatientState === null || composition.status !== 'composed') {
    return fail(
      'PATIENT_STATE_NOT_COMPOSED',
      'D-328 requires the completed D-208 patient retained by D-327.',
      [composition.id],
    );
  }
  const assembly = assemblePostCompositionPatientState({
    schemaVersion: 1,
    id: assemblyRequestId(orchestration.id),
    patientStateCompositionArtifact: composition,
    conditionClinicalDurationSourceValidationArtifact:
      request.conditionClinicalDurationSourceValidationArtifact,
    conditionFunctionalImpairmentSourceValidationArtifact:
      request.conditionFunctionalImpairmentSourceValidationArtifact,
    patientClinicalResultAttachmentArtifact: orchestration.patientClinicalResultAttachment,
  });
  if (!assembly.ok) {
    return fail(
      'POST_COMPOSITION_ASSEMBLY_FAILED',
      `${assembly.error.code}: ${assembly.error.message}`,
      [orchestration.id, ...assembly.error.contentIds],
    );
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_TEMPLATE_POST_COMPOSITION_ASSEMBLY_ORCHESTRATOR_VERSION,
    requestId: request.id,
    basePatientStateId: basePatientState.id,
    composedPatientStateId: assembly.value.composedPatientState.id,
    clinicalResultAttachmentOrchestrationRef: {
      id: orchestration.id,
      inputFingerprint: orchestration.inputFingerprint,
      payloadFingerprint: orchestration.payloadFingerprint,
    },
    postCompositionAssemblyRef: {
      id: assembly.value.id,
      inputFingerprint: assembly.value.inputFingerprint,
      payloadFingerprint: assembly.value.payloadFingerprint,
      composedPatientStateFingerprint: assembly.value.composedPatientStateFingerprint,
    },
    postCompositionAssembly: assembly.value,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = PatientTemplatePostCompositionAssemblyOrchestrationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `patient-template-post-composition-assembly-orchestration.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
      request.id,
      orchestration.id,
      assembly.value.id,
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyPatientTemplatePostCompositionAssemblyOrchestrationIntegrity = (
  input: unknown,
): PatientTemplatePostCompositionAssemblyOrchestrationIntegrityResult => {
  const parsed = PatientTemplatePostCompositionAssemblyOrchestrationArtifactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (
    artifact.compilerVersion !== PATIENT_TEMPLATE_POST_COMPOSITION_ASSEMBLY_ORCHESTRATOR_VERSION
  ) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported post-composition orchestrator ${artifact.compilerVersion}.`,
      },
    };
  }
  const resultOrchestration = verifyPatientTemplateClinicalResultAttachmentOrchestrationIntegrity(
    artifact.compileRequest.clinicalResultAttachmentOrchestrationArtifact,
  );
  if (!resultOrchestration.ok) {
    return {
      ok: false,
      error: {
        code: 'CLINICAL_RESULT_ATTACHMENT_ORCHESTRATION_INVALID',
        message: `${resultOrchestration.error.code}: ${resultOrchestration.error.message}`,
      },
    };
  }
  const assembly = verifyPostCompositionPatientStateAssemblyIntegrity(
    artifact.postCompositionAssembly,
  );
  if (!assembly.ok) {
    return {
      ok: false,
      error: {
        code: 'POST_COMPOSITION_ASSEMBLY_INVALID',
        message: `${assembly.error.code}: ${assembly.error.message}`,
      },
    };
  }
  if (artifact.inputFingerprint !== fingerprint('input', artifact.compileRequest)) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact D-327/D-294/D-292 request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `patient-template-post-composition-assembly-orchestration.${expectedPayloadFingerprint.slice(
        -16,
      )}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact D-328 payload.`,
      },
    };
  }
  const replay = orchestratePatientTemplatePostCompositionAssembly(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: replay.ok
          ? `${artifact.id} does not replay to its stored post-composition assembly.`
          : `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  return { ok: true, value: artifact };
};
