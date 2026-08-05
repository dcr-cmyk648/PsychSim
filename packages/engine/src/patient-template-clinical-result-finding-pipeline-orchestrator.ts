import {
  PatientTemplateClinicalResultFindingPipelineOrchestrationArtifactSchema,
  PatientTemplateClinicalResultFindingPipelineOrchestrationRequestSchema,
  type PatientTemplateClinicalResultFindingPipelineOrchestrationArtifact,
  type PatientTemplateClinicalResultFindingPipelineOrchestrationFingerprint,
} from '@psychsim/schemas';

import {
  composeFindingPipelineAudit,
  verifyFindingPipelineAuditIntegrity,
} from './finding-pipeline-audit-composer';
import {
  compilePatientTemplateClinicalResultMaterialization,
  verifyPatientTemplateClinicalResultMaterializationIntegrity,
} from './patient-template-clinical-result-materialization-compiler';
import {
  compilePatientTemplateClinicalResultMaterializationContext,
  verifyPatientTemplateClinicalResultMaterializationContextIntegrity,
} from './patient-template-clinical-result-materialization-context-compiler';
import {
  orchestratePatientTemplateClinicalResultAttachment,
  verifyPatientTemplateClinicalResultAttachmentOrchestrationIntegrity,
} from './patient-template-clinical-result-attachment-orchestrator';
import {
  orchestratePatientTemplatePostCompositionAssembly,
  verifyPatientTemplatePostCompositionAssemblyOrchestrationIntegrity,
} from './patient-template-post-composition-assembly-orchestrator';

export const PATIENT_TEMPLATE_CLINICAL_RESULT_FINDING_PIPELINE_ORCHESTRATOR_VERSION = '1.0.0';

export type PatientTemplateClinicalResultFindingPipelineOrchestrationResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateClinicalResultFindingPipelineOrchestrationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'MATERIALIZATION_CONTEXT_FAILED'
          | 'MATERIALIZATION_FAILED'
          | 'ATTACHMENT_ORCHESTRATION_FAILED'
          | 'POST_COMPOSITION_ORCHESTRATION_FAILED'
          | 'FINDING_PIPELINE_FAILED'
          | 'FINDING_PIPELINE_NOT_COMPILED'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type PatientTemplateClinicalResultFindingPipelineOrchestrationIntegrityResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateClinicalResultFindingPipelineOrchestrationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'UPSTREAM_INTEGRITY_INVALID'
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
): PatientTemplateClinicalResultFindingPipelineOrchestrationFingerprint =>
  `fingerprint.patient-template-clinical-result-finding-pipeline-orchestration.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: Exclude<
    PatientTemplateClinicalResultFindingPipelineOrchestrationResult,
    { readonly ok: true }
  >['error']['code'],
  message: string,
  contentIds: readonly string[] = [],
): PatientTemplateClinicalResultFindingPipelineOrchestrationResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const requestId = (scope: string, orchestrationRequestId: string): string =>
  `${scope}.${hashToHex64(orchestrationRequestId)}`;

const artifactPayload = (
  artifact: Omit<
    PatientTemplateClinicalResultFindingPipelineOrchestrationArtifact,
    'id' | 'payloadFingerprint'
  >,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  resultPostCompositionOrchestrationRef: artifact.resultPostCompositionOrchestrationRef,
  findingPipelineAuditRef: artifact.findingPipelineAuditRef,
  resultPostCompositionOrchestrationArtifact: artifact.resultPostCompositionOrchestrationArtifact,
  findingPipelineAuditArtifact: artifact.findingPipelineAuditArtifact,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const orchestratePatientTemplateClinicalResultFindingPipeline = (
  input: unknown,
): PatientTemplateClinicalResultFindingPipelineOrchestrationResult => {
  const parsed =
    PatientTemplateClinicalResultFindingPipelineOrchestrationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues));
  }
  const request = parsed.data;
  const baseRequest = request.baseFindingPipelineAuditRequest;
  const patientStateComposition =
    baseRequest.preFindingPatientStateOrchestrationArtifact.patientStateCompositionArtifact;
  const materializationContext = compilePatientTemplateClinicalResultMaterializationContext({
    schemaVersion: 1,
    id: requestId(
      'patient-template-clinical-result-materialization-context-request.d330',
      request.id,
    ),
    patientSlotFillSeedAuthorityArtifact: baseRequest.patientSlotFillSeedAuthorityArtifact,
    patientStateCompositionArtifact: patientStateComposition,
    resourceCoverageArtifact: request.resourceCoverageArtifact,
  });
  if (!materializationContext.ok) {
    return fail(
      'MATERIALIZATION_CONTEXT_FAILED',
      `${materializationContext.error.code}: ${materializationContext.error.message}`,
      materializationContext.error.contentIds,
    );
  }
  const materialization = compilePatientTemplateClinicalResultMaterialization({
    schemaVersion: 1,
    id: requestId('patient-template-clinical-result-materialization-request.d330', request.id),
    materializationContextArtifact: materializationContext.value,
  });
  if (!materialization.ok) {
    return fail(
      'MATERIALIZATION_FAILED',
      `${materialization.error.code}: ${materialization.error.message}`,
      materialization.error.contentIds,
    );
  }
  const attachment = orchestratePatientTemplateClinicalResultAttachment({
    schemaVersion: 1,
    id: requestId(
      'patient-template-clinical-result-attachment-orchestration-request.d330',
      request.id,
    ),
    materializationArtifact: materialization.value,
  });
  if (!attachment.ok) {
    return fail(
      'ATTACHMENT_ORCHESTRATION_FAILED',
      `${attachment.error.code}: ${attachment.error.message}`,
      attachment.error.contentIds,
    );
  }
  const resultFreeAssembly = baseRequest.postCompositionPatientStateAssemblyArtifact;
  const postComposition = orchestratePatientTemplatePostCompositionAssembly({
    schemaVersion: 1,
    id: requestId(
      'patient-template-post-composition-assembly-orchestration-request.d330',
      request.id,
    ),
    clinicalResultAttachmentOrchestrationArtifact: attachment.value,
    conditionClinicalDurationSourceValidationArtifact:
      resultFreeAssembly?.assemblyRequest.conditionClinicalDurationSourceValidationArtifact ?? null,
    conditionFunctionalImpairmentSourceValidationArtifact:
      resultFreeAssembly?.assemblyRequest.conditionFunctionalImpairmentSourceValidationArtifact ??
      null,
  });
  if (!postComposition.ok) {
    return fail(
      'POST_COMPOSITION_ORCHESTRATION_FAILED',
      `${postComposition.error.code}: ${postComposition.error.message}`,
      postComposition.error.contentIds,
    );
  }
  const finalRequest = {
    ...baseRequest,
    id: requestId('finding-pipeline-audit-request.result-enabled.d330', request.id),
    patientTemplatePostCompositionAssemblyOrchestrationArtifact: postComposition.value,
    postCompositionPatientStateAssemblyArtifact: null,
  };
  const finalCompilation = composeFindingPipelineAudit(finalRequest);
  if (!finalCompilation.ok) {
    return fail(
      'FINDING_PIPELINE_FAILED',
      `${finalCompilation.error.code}: ${finalCompilation.error.message}`,
      finalCompilation.error.contentIds,
    );
  }
  const finalAudit = finalCompilation.value;
  const patientState = finalAudit.catalogSnapshot?.patientInstance.patientState ?? null;
  if (finalAudit.status !== 'compiled' || patientState === null) {
    return fail(
      'FINDING_PIPELINE_NOT_COMPILED',
      'The result-enabled D-200 replay did not produce one compiled patient snapshot.',
      [finalAudit.id],
    );
  }

  const inputFingerprint = fingerprint('input', {
    requestId: request.id,
    baseFindingPipelineAuditRequest: baseRequest,
    resourceCoverageRef: {
      id: request.resourceCoverageArtifact.id,
      inputFingerprint: request.resourceCoverageArtifact.inputFingerprint,
      payloadFingerprint: request.resourceCoverageArtifact.payloadFingerprint,
    },
  });
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_TEMPLATE_CLINICAL_RESULT_FINDING_PIPELINE_ORCHESTRATOR_VERSION,
    requestId: request.id,
    patientStateId: patientState.id,
    resultPostCompositionOrchestrationRef: {
      id: postComposition.value.id,
      inputFingerprint: postComposition.value.inputFingerprint,
      payloadFingerprint: postComposition.value.payloadFingerprint,
    },
    findingPipelineAuditRef: {
      id: finalAudit.id,
      inputFingerprint: finalAudit.inputFingerprint,
      payloadFingerprint: finalAudit.payloadFingerprint,
    },
    resultPostCompositionOrchestrationArtifact: postComposition.value,
    findingPipelineAuditArtifact: finalAudit,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
  try {
    return {
      ok: true,
      value: PatientTemplateClinicalResultFindingPipelineOrchestrationArtifactSchema.parse({
        ...withoutIdentity,
        id: `patient-template-clinical-result-finding-pipeline-orchestration.${payloadFingerprint.slice(
          -16,
        )}`,
        payloadFingerprint,
      }),
    };
  } catch (error) {
    return fail('INVALID_OUTPUT', error instanceof Error ? error.message : String(error));
  }
};

export const verifyPatientTemplateClinicalResultFindingPipelineOrchestrationIntegrity = (
  value: unknown,
): PatientTemplateClinicalResultFindingPipelineOrchestrationIntegrityResult => {
  const parsed =
    PatientTemplateClinicalResultFindingPipelineOrchestrationArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (
    artifact.compilerVersion !==
    PATIENT_TEMPLATE_CLINICAL_RESULT_FINDING_PIPELINE_ORCHESTRATOR_VERSION
  ) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported D-330 compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const materializationContext =
    artifact.resultPostCompositionOrchestrationArtifact.compileRequest
      .clinicalResultAttachmentOrchestrationArtifact.compileRequest.materializationArtifact
      .compileRequest.materializationContextArtifact;
  const contextIntegrity =
    verifyPatientTemplateClinicalResultMaterializationContextIntegrity(materializationContext);
  const materialization =
    artifact.resultPostCompositionOrchestrationArtifact.compileRequest
      .clinicalResultAttachmentOrchestrationArtifact.compileRequest.materializationArtifact;
  const materializationIntegrity =
    verifyPatientTemplateClinicalResultMaterializationIntegrity(materialization);
  const attachment =
    artifact.resultPostCompositionOrchestrationArtifact.compileRequest
      .clinicalResultAttachmentOrchestrationArtifact;
  const attachmentIntegrity =
    verifyPatientTemplateClinicalResultAttachmentOrchestrationIntegrity(attachment);
  const postComposition = verifyPatientTemplatePostCompositionAssemblyOrchestrationIntegrity(
    artifact.resultPostCompositionOrchestrationArtifact,
  );
  const finalAudit = verifyFindingPipelineAuditIntegrity(artifact.findingPipelineAuditArtifact);
  const invalid = [
    contextIntegrity,
    materializationIntegrity,
    attachmentIntegrity,
    postComposition,
    finalAudit,
  ].find((result) => !result.ok);
  if (invalid !== undefined && !invalid.ok) {
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_INTEGRITY_INVALID',
        message: invalid.error.message,
      },
    };
  }
  const expectedInputFingerprint = fingerprint('input', {
    requestId: artifact.compileRequest.id,
    baseFindingPipelineAuditRequest: artifact.compileRequest.baseFindingPipelineAuditRequest,
    resourceCoverageRef: {
      id: artifact.compileRequest.resourceCoverageArtifact.id,
      inputFingerprint: artifact.compileRequest.resourceCoverageArtifact.inputFingerprint,
      payloadFingerprint: artifact.compileRequest.resourceCoverageArtifact.payloadFingerprint,
    },
  });
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not bind its exact result-free D-200 request scaffold and D-324 coverage.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('output', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `patient-template-clinical-result-finding-pipeline-orchestration.${expectedPayloadFingerprint.slice(
        -16,
      )}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen D-330 payload.`,
      },
    };
  }
  const replay = orchestratePatientTemplateClinicalResultFindingPipeline(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: replay.ok
          ? `${artifact.id} does not match deterministic D-330 replay.`
          : `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  return { ok: true, value: artifact };
};
