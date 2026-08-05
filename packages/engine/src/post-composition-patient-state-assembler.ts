import {
  PostCompositionPatientStateAssemblyArtifactSchema,
  PostCompositionPatientStateAssemblyRequestSchema,
  ResolvedPatientStateSchema,
  type PostCompositionPatientStateAssemblyArtifact,
  type PostCompositionPatientStateAssemblyFingerprint,
  type PostCompositionPatientStateAssemblyRequest,
  type ResolvedPatientState,
} from '@psychsim/schemas';

import { verifyConditionClinicalDurationSourceValidationIntegrity } from './condition-clinical-duration-source-validation';
import { verifyConditionFunctionalImpairmentSourceValidationIntegrity } from './condition-functional-impairment-source-validation';
import { verifyPatientClinicalResultAttachmentIntegrity } from './patient-clinical-result-attachment';
import { verifyResolvedPatientStateCompositionIntegrity } from './resolved-patient-state-composer';

export const POST_COMPOSITION_PATIENT_STATE_ASSEMBLER_VERSION = '2.0.0';

export type PostCompositionPatientStateAssemblyErrorCode =
  | 'INVALID_REQUEST'
  | 'PATIENT_STATE_COMPOSITION_INVALID'
  | 'PATIENT_STATE_NOT_COMPOSED'
  | 'BASE_LANE_NOT_EMPTY'
  | 'DURATION_SOURCE_VALIDATION_INVALID'
  | 'FUNCTIONAL_IMPAIRMENT_SOURCE_VALIDATION_INVALID'
  | 'CLINICAL_RESULT_ATTACHMENT_INVALID'
  | 'ATTACHMENT_ROOT_MISMATCH'
  | 'INVALID_OUTPUT';

export type PostCompositionPatientStateAssemblyResult =
  | { readonly ok: true; readonly value: PostCompositionPatientStateAssemblyArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: PostCompositionPatientStateAssemblyErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type PostCompositionPatientStateAssemblyIntegrityResult =
  | { readonly ok: true; readonly value: PostCompositionPatientStateAssemblyArtifact }
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
): PostCompositionPatientStateAssemblyFingerprint =>
  `fingerprint.post-composition-patient-state-assembly.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: PostCompositionPatientStateAssemblyErrorCode,
  message: string,
  contentIds: readonly string[],
): PostCompositionPatientStateAssemblyResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

interface VerifiedAssemblyInputs {
  readonly request: PostCompositionPatientStateAssemblyRequest;
  readonly basePatientState: ResolvedPatientState;
}

const verifyInputs = (
  request: PostCompositionPatientStateAssemblyRequest,
):
  | { readonly ok: true; readonly value: VerifiedAssemblyInputs }
  | { readonly ok: false; readonly result: PostCompositionPatientStateAssemblyResult } => {
  const compositionIntegrity = verifyResolvedPatientStateCompositionIntegrity(
    request.patientStateCompositionArtifact,
  );
  if (!compositionIntegrity.ok) {
    return {
      ok: false,
      result: fail(
        'PATIENT_STATE_COMPOSITION_INVALID',
        `${compositionIntegrity.error.code}: ${compositionIntegrity.error.message}`,
        [request.patientStateCompositionArtifact.id],
      ),
    };
  }
  const composition = compositionIntegrity.value;
  if (
    composition.status !== 'composed' ||
    composition.composedPatientState === null ||
    composition.composedPatientStateFingerprint === null
  ) {
    return {
      ok: false,
      result: fail(
        'PATIENT_STATE_NOT_COMPOSED',
        'Post-composition assembly requires one successful D-208 patient-state composition.',
        [composition.id],
      ),
    };
  }
  const basePatientState = composition.composedPatientState;
  if (
    basePatientState.clinicalDurations.length > 0 ||
    basePatientState.functionalImpairments.length > 0 ||
    basePatientState.measurements.length > 0 ||
    basePatientState.categoricalObservations.length > 0 ||
    basePatientState.structuredTestResults.length > 0
  ) {
    return {
      ok: false,
      result: fail(
        'BASE_LANE_NOT_EMPTY',
        'D-312 requires empty D-208 duration, functional-impairment, and clinical-result lanes so typed post-composition owners cannot be bypassed.',
        [
          composition.id,
          basePatientState.id,
          ...basePatientState.clinicalDurations.map((record) => record.id),
          ...basePatientState.functionalImpairments.map((record) => record.id),
          ...basePatientState.measurements.map((record) => record.id),
          ...basePatientState.categoricalObservations.map((record) => record.id),
          ...basePatientState.structuredTestResults.map((record) => record.id),
        ],
      ),
    };
  }

  let durationValidation = request.conditionClinicalDurationSourceValidationArtifact;
  if (durationValidation !== null) {
    const durationIntegrity =
      verifyConditionClinicalDurationSourceValidationIntegrity(durationValidation);
    if (!durationIntegrity.ok) {
      return {
        ok: false,
        result: fail(
          'DURATION_SOURCE_VALIDATION_INVALID',
          `${durationIntegrity.error.code}: ${durationIntegrity.error.message}`,
          [durationValidation.id],
        ),
      };
    }
    durationValidation = durationIntegrity.value;
    if (
      !sameExactValue(
        durationValidation.compileRequest.durationAttachment.attachmentRequest
          .patientStateCompositionArtifact,
        composition,
      )
    ) {
      return {
        ok: false,
        result: fail(
          'ATTACHMENT_ROOT_MISMATCH',
          `${durationValidation.id} does not retain the exact D-208 assembly root.`,
          [composition.id, durationValidation.id],
        ),
      };
    }
  }

  let impairmentValidation = request.conditionFunctionalImpairmentSourceValidationArtifact;
  if (impairmentValidation !== null) {
    const impairmentIntegrity =
      verifyConditionFunctionalImpairmentSourceValidationIntegrity(impairmentValidation);
    if (!impairmentIntegrity.ok) {
      return {
        ok: false,
        result: fail(
          'FUNCTIONAL_IMPAIRMENT_SOURCE_VALIDATION_INVALID',
          `${impairmentIntegrity.error.code}: ${impairmentIntegrity.error.message}`,
          [impairmentValidation.id],
        ),
      };
    }
    impairmentValidation = impairmentIntegrity.value;
    if (
      !sameExactValue(
        impairmentValidation.compileRequest.functionalImpairmentAttachment.attachmentRequest
          .patientStateCompositionArtifact,
        composition,
      )
    ) {
      return {
        ok: false,
        result: fail(
          'ATTACHMENT_ROOT_MISMATCH',
          `${impairmentValidation.id} does not retain the exact D-208 assembly root.`,
          [composition.id, impairmentValidation.id],
        ),
      };
    }
  }

  let resultAttachment = request.patientClinicalResultAttachmentArtifact;
  if (resultAttachment !== null) {
    const resultIntegrity = verifyPatientClinicalResultAttachmentIntegrity(resultAttachment);
    if (!resultIntegrity.ok) {
      return {
        ok: false,
        result: fail(
          'CLINICAL_RESULT_ATTACHMENT_INVALID',
          `${resultIntegrity.error.code}: ${resultIntegrity.error.message}`,
          [resultAttachment.id],
        ),
      };
    }
    resultAttachment = resultIntegrity.value;
    if (
      !sameExactValue(
        resultAttachment.attachmentRequest.patientStateCompositionArtifact,
        composition,
      )
    ) {
      return {
        ok: false,
        result: fail(
          'ATTACHMENT_ROOT_MISMATCH',
          `${resultAttachment.id} does not retain the exact D-208 assembly root.`,
          [composition.id, resultAttachment.id],
        ),
      };
    }
  }

  return {
    ok: true,
    value: {
      request: {
        ...request,
        patientStateCompositionArtifact: composition,
        conditionClinicalDurationSourceValidationArtifact: durationValidation,
        conditionFunctionalImpairmentSourceValidationArtifact: impairmentValidation,
        patientClinicalResultAttachmentArtifact: resultAttachment,
      },
      basePatientState,
    },
  };
};

const attachedRecordIds = (
  request: PostCompositionPatientStateAssemblyRequest,
): PostCompositionPatientStateAssemblyArtifact['attachedRecordIds'] => {
  const durationAttachment =
    request.conditionClinicalDurationSourceValidationArtifact?.compileRequest.durationAttachment ??
    null;
  const impairmentAttachment =
    request.conditionFunctionalImpairmentSourceValidationArtifact?.compileRequest
      .functionalImpairmentAttachment ?? null;
  const resultAttachment = request.patientClinicalResultAttachmentArtifact;
  return {
    clinicalDurationIds:
      durationAttachment?.composedPatientState.clinicalDurations.map((record) => record.id) ?? [],
    functionalImpairmentIds:
      impairmentAttachment?.attachedFunctionalImpairments.map((record) => record.id) ?? [],
    measurementIds:
      resultAttachment?.composedPatientState.measurements.map((record) => record.id) ?? [],
    categoricalObservationIds:
      resultAttachment?.composedPatientState.categoricalObservations.map((record) => record.id) ??
      [],
    structuredTestResultIds:
      resultAttachment?.composedPatientState.structuredTestResults.map((record) => record.id) ?? [],
  };
};

const buildComposedPatientState = (
  request: PostCompositionPatientStateAssemblyRequest,
  basePatientState: ResolvedPatientState,
): {
  readonly state: ResolvedPatientState;
  readonly fingerprint: PostCompositionPatientStateAssemblyFingerprint;
} => {
  const durationAttachment =
    request.conditionClinicalDurationSourceValidationArtifact?.compileRequest.durationAttachment ??
    null;
  const impairmentAttachment =
    request.conditionFunctionalImpairmentSourceValidationArtifact?.compileRequest
      .functionalImpairmentAttachment ?? null;
  const resultAttachment = request.patientClinicalResultAttachmentArtifact;
  const stateWithoutId: Omit<ResolvedPatientState, 'id'> = {
    ...basePatientState,
    clinicalDurations: durationAttachment?.composedPatientState.clinicalDurations ?? [],
    functionalImpairments: impairmentAttachment?.attachedFunctionalImpairments ?? [],
    measurements: resultAttachment?.composedPatientState.measurements ?? [],
    categoricalObservations: resultAttachment?.composedPatientState.categoricalObservations ?? [],
    structuredTestResults: resultAttachment?.composedPatientState.structuredTestResults ?? [],
  };
  const stateFingerprint = fingerprint('patient-state', {
    basePatientStateRef: {
      id: basePatientState.id,
      fingerprint: request.patientStateCompositionArtifact.composedPatientStateFingerprint,
    },
    durationSourceValidationRef:
      request.conditionClinicalDurationSourceValidationArtifact === null
        ? null
        : {
            id: request.conditionClinicalDurationSourceValidationArtifact.id,
            payloadFingerprint:
              request.conditionClinicalDurationSourceValidationArtifact.payloadFingerprint,
          },
    functionalImpairmentSourceValidationRef:
      request.conditionFunctionalImpairmentSourceValidationArtifact === null
        ? null
        : {
            id: request.conditionFunctionalImpairmentSourceValidationArtifact.id,
            payloadFingerprint:
              request.conditionFunctionalImpairmentSourceValidationArtifact.payloadFingerprint,
          },
    clinicalResultAttachmentRef:
      resultAttachment === null
        ? null
        : {
            id: resultAttachment.id,
            payloadFingerprint: resultAttachment.payloadFingerprint,
          },
    patientStateBody: stateWithoutId,
  });
  return {
    state: ResolvedPatientStateSchema.parse({
      ...stateWithoutId,
      id: `resolved-patient-state.post-composition.${stateFingerprint.slice(-16)}`,
    }),
    fingerprint: stateFingerprint,
  };
};

const artifactPayload = (
  artifact: Omit<PostCompositionPatientStateAssemblyArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateCompositionRef: artifact.patientStateCompositionRef,
  basePatientStateRef: artifact.basePatientStateRef,
  conditionClinicalDurationSourceValidationRef:
    artifact.conditionClinicalDurationSourceValidationRef,
  conditionFunctionalImpairmentSourceValidationRef:
    artifact.conditionFunctionalImpairmentSourceValidationRef,
  patientClinicalResultAttachmentRef: artifact.patientClinicalResultAttachmentRef,
  attachedRecordIds: artifact.attachedRecordIds,
  composedPatientState: artifact.composedPatientState,
  composedPatientStateFingerprint: artifact.composedPatientStateFingerprint,
  assemblyRequest: artifact.assemblyRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const assemblePostCompositionPatientState = (
  input: unknown,
): PostCompositionPatientStateAssemblyResult => {
  const parsed = PostCompositionPatientStateAssemblyRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }
  const verified = verifyInputs(parsed.data);
  if (!verified.ok) return verified.result;
  const { request, basePatientState } = verified.value;

  try {
    const composition = request.patientStateCompositionArtifact;
    const durationValidation = request.conditionClinicalDurationSourceValidationArtifact;
    const impairmentValidation = request.conditionFunctionalImpairmentSourceValidationArtifact;
    const resultAttachment = request.patientClinicalResultAttachmentArtifact;
    const composed = buildComposedPatientState(request, basePatientState);
    const inputFingerprint = fingerprint('input', request);
    const withoutIdentity = {
      schemaVersion: 1 as const,
      compilerVersion: POST_COMPOSITION_PATIENT_STATE_ASSEMBLER_VERSION,
      requestId: request.id,
      patientStateCompositionRef: {
        id: composition.id,
        payloadFingerprint: composition.payloadFingerprint,
        composedPatientStateFingerprint: composition.composedPatientStateFingerprint!,
      },
      basePatientStateRef: {
        id: basePatientState.id,
        fingerprint: composition.composedPatientStateFingerprint!,
      },
      conditionClinicalDurationSourceValidationRef:
        durationValidation === null
          ? null
          : {
              id: durationValidation.id,
              payloadFingerprint: durationValidation.payloadFingerprint,
            },
      conditionFunctionalImpairmentSourceValidationRef:
        impairmentValidation === null
          ? null
          : {
              id: impairmentValidation.id,
              payloadFingerprint: impairmentValidation.payloadFingerprint,
            },
      patientClinicalResultAttachmentRef:
        resultAttachment === null
          ? null
          : {
              id: resultAttachment.id,
              payloadFingerprint: resultAttachment.payloadFingerprint,
            },
      attachedRecordIds: attachedRecordIds(request),
      composedPatientState: composed.state,
      composedPatientStateFingerprint: composed.fingerprint,
      assemblyRequest: request,
      inputFingerprint,
    };
    const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
    const output = PostCompositionPatientStateAssemblyArtifactSchema.safeParse({
      ...withoutIdentity,
      id: `post-composition-patient-state-assembly.${payloadFingerprint.slice(-16)}`,
      payloadFingerprint,
    });
    if (!output.success) {
      return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
        request.id,
        basePatientState.id,
      ]);
    }
    return { ok: true, value: output.data };
  } catch (error) {
    return fail('INVALID_OUTPUT', error instanceof Error ? error.message : String(error), [
      request.id,
      basePatientState.id,
    ]);
  }
};

export const verifyPostCompositionPatientStateAssemblyIntegrity = (
  input: unknown,
): PostCompositionPatientStateAssemblyIntegrityResult => {
  const parsed = PostCompositionPatientStateAssemblyArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== POST_COMPOSITION_PATIENT_STATE_ASSEMBLER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported post-composition patient-state assembler ${artifact.compilerVersion}.`,
      },
    };
  }
  const expectedInputFingerprint = fingerprint('input', artifact.assemblyRequest);
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact assembly request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `post-composition-patient-state-assembly.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen assembly payload.`,
      },
    };
  }
  const replay = assemblePostCompositionPatientState(artifact.assemblyRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained D-208, D-294, D-292, and D-311 inputs do not reproduce the exact post-composition state.',
      },
    };
  }
  return { ok: true, value: artifact };
};
