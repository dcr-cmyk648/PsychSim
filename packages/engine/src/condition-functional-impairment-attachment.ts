import {
  ConditionFunctionalImpairmentAttachmentArtifactSchema,
  ConditionFunctionalImpairmentAttachmentRequestSchema,
  type ConditionFunctionalImpairmentAttachmentArtifact,
  type ConditionFunctionalImpairmentAttachmentFingerprint,
  type ConditionFunctionalImpairmentAttachmentRequest,
  type ConditionFunctionalImpairmentResolutionArtifact,
  type ConditionState,
  type ResolvedPatientState,
} from '@psychsim/schemas';

import { verifyConditionFunctionalImpairmentResolutionIntegrity } from './condition-functional-impairment-profile-resolver';
import { verifyResolvedPatientStateCompositionIntegrity } from './resolved-patient-state-composer';

export const CONDITION_FUNCTIONAL_IMPAIRMENT_ATTACHMENT_VERSION = '1.0.0';

export type ConditionFunctionalImpairmentAttachmentErrorCode =
  | 'INVALID_REQUEST'
  | 'PATIENT_STATE_COMPOSITION_INVALID'
  | 'PATIENT_STATE_NOT_COMPOSED'
  | 'FUNCTIONAL_IMPAIRMENT_RESOLUTION_INVALID'
  | 'PATIENT_STATE_CONTEXT_MISMATCH'
  | 'CONDITION_CONTEXT_MISMATCH'
  | 'INVALID_OUTPUT';

export type ConditionFunctionalImpairmentAttachmentResult =
  | { readonly ok: true; readonly value: ConditionFunctionalImpairmentAttachmentArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: ConditionFunctionalImpairmentAttachmentErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type ConditionFunctionalImpairmentAttachmentIntegrityResult =
  | { readonly ok: true; readonly value: ConditionFunctionalImpairmentAttachmentArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_RESOLVER_VERSION'
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
): ConditionFunctionalImpairmentAttachmentFingerprint =>
  `fingerprint.condition-functional-impairment-attachment.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const assignmentKey = (
  artifact: Pick<
    ConditionFunctionalImpairmentResolutionArtifact,
    'conditionStateId' | 'profileRef'
  >,
): string => `${artifact.conditionStateId}\u0000${artifact.profileRef.id}`;

const compareResolutionArtifacts = (
  left: ConditionFunctionalImpairmentResolutionArtifact,
  right: ConditionFunctionalImpairmentResolutionArtifact,
): number =>
  compareStrings(assignmentKey(left), assignmentKey(right)) || compareStrings(left.id, right.id);

const normalizeRequest = (
  request: ConditionFunctionalImpairmentAttachmentRequest,
): ConditionFunctionalImpairmentAttachmentRequest =>
  ConditionFunctionalImpairmentAttachmentRequestSchema.parse({
    ...request,
    functionalImpairmentResolutionArtifacts: [
      ...request.functionalImpairmentResolutionArtifacts,
    ].sort(compareResolutionArtifacts),
  });

const sameConditionState = (left: ConditionState, right: ConditionState): boolean =>
  sameExactValue(
    {
      ...left,
      specifierIds: [...left.specifierIds].sort(compareStrings),
    },
    {
      ...right,
      specifierIds: [...right.specifierIds].sort(compareStrings),
    },
  );

const fail = (
  code: ConditionFunctionalImpairmentAttachmentErrorCode,
  message: string,
  contentIds: readonly string[],
): ConditionFunctionalImpairmentAttachmentResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

interface VerifiedAttachmentInputs {
  readonly request: ConditionFunctionalImpairmentAttachmentRequest;
  readonly basePatientState: ResolvedPatientState;
}

const verifyInputs = (
  request: ConditionFunctionalImpairmentAttachmentRequest,
):
  | { readonly ok: true; readonly value: VerifiedAttachmentInputs }
  | { readonly ok: false; readonly result: ConditionFunctionalImpairmentAttachmentResult } => {
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
        'Condition-functional-impairment records require a completed D-208 patient-state composition.',
        [composition.id],
      ),
    };
  }

  const basePatientState = composition.composedPatientState;
  const conditionById = new Map(
    basePatientState.conditionStates.map((condition) => [condition.id, condition]),
  );
  for (const resolution of request.functionalImpairmentResolutionArtifacts) {
    const resolutionIntegrity = verifyConditionFunctionalImpairmentResolutionIntegrity(resolution);
    if (!resolutionIntegrity.ok) {
      return {
        ok: false,
        result: fail(
          'FUNCTIONAL_IMPAIRMENT_RESOLUTION_INVALID',
          `${resolutionIntegrity.error.code}: ${resolutionIntegrity.error.message}`,
          [resolution.id],
        ),
      };
    }
    if (resolution.patientStateId !== basePatientState.id) {
      return {
        ok: false,
        result: fail(
          'PATIENT_STATE_CONTEXT_MISMATCH',
          `${resolution.id} targets ${resolution.patientStateId}, not composed patient state ${basePatientState.id}.`,
          [composition.id, resolution.id, resolution.patientStateId, basePatientState.id],
        ),
      };
    }
    const condition = conditionById.get(resolution.conditionStateId);
    if (
      condition === undefined ||
      !sameConditionState(condition, resolution.compileRequest.conditionState)
    ) {
      return {
        ok: false,
        result: fail(
          'CONDITION_CONTEXT_MISMATCH',
          `${resolution.id} does not target one exact unchanged condition in ${basePatientState.id}.`,
          [resolution.id, resolution.conditionStateId, basePatientState.id],
        ),
      };
    }
  }

  return {
    ok: true,
    value: {
      request,
      basePatientState,
    },
  };
};

const resolutionRef = (
  resolution: ConditionFunctionalImpairmentResolutionArtifact,
): ConditionFunctionalImpairmentAttachmentArtifact['functionalImpairmentResolutionRefs'][number] => ({
  id: resolution.id,
  payloadFingerprint: resolution.payloadFingerprint,
  patientStateId: resolution.patientStateId,
  conditionStateId: resolution.conditionStateId,
  profileRef: resolution.profileRef,
  resolvedFunctionalImpairmentId: resolution.resolvedFunctionalImpairment.id,
});

const artifactPayload = (
  artifact: Omit<ConditionFunctionalImpairmentAttachmentArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  resolverVersion: artifact.resolverVersion,
  requestId: artifact.requestId,
  patientStateCompositionRef: artifact.patientStateCompositionRef,
  basePatientStateRef: artifact.basePatientStateRef,
  functionalImpairmentResolutionRefs: artifact.functionalImpairmentResolutionRefs,
  attachedFunctionalImpairments: artifact.attachedFunctionalImpairments,
  attachmentRequest: artifact.attachmentRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const attachConditionFunctionalImpairments = (
  input: unknown,
): ConditionFunctionalImpairmentAttachmentResult => {
  const parsed = ConditionFunctionalImpairmentAttachmentRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }
  const request = normalizeRequest(parsed.data);
  const verified = verifyInputs(request);
  if (!verified.ok) return verified.result;

  try {
    const composition = request.patientStateCompositionArtifact;
    const basePatientState = verified.value.basePatientState;
    const inputFingerprint = fingerprint('input', request);
    const withoutIdentity = {
      schemaVersion: 1 as const,
      resolverVersion: CONDITION_FUNCTIONAL_IMPAIRMENT_ATTACHMENT_VERSION,
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
      functionalImpairmentResolutionRefs:
        request.functionalImpairmentResolutionArtifacts.map(resolutionRef),
      attachedFunctionalImpairments: request.functionalImpairmentResolutionArtifacts.map(
        (resolution) => resolution.resolvedFunctionalImpairment,
      ),
      attachmentRequest: request,
      inputFingerprint,
    };
    const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
    const output = ConditionFunctionalImpairmentAttachmentArtifactSchema.safeParse({
      ...withoutIdentity,
      id: `condition-functional-impairment-attachment.${payloadFingerprint.slice(-16)}`,
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
      verified.value.basePatientState.id,
    ]);
  }
};

export const verifyConditionFunctionalImpairmentAttachmentIntegrity = (
  input: unknown,
): ConditionFunctionalImpairmentAttachmentIntegrityResult => {
  const parsed = ConditionFunctionalImpairmentAttachmentArtifactSchema.safeParse(input);
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
  if (artifact.resolverVersion !== CONDITION_FUNCTIONAL_IMPAIRMENT_ATTACHMENT_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_RESOLVER_VERSION',
        message: `${artifact.id} uses unsupported condition-functional-impairment attachment ${artifact.resolverVersion}.`,
      },
    };
  }
  const normalizedRequest = normalizeRequest(artifact.attachmentRequest);
  const expectedInputFingerprint = fingerprint('input', normalizedRequest);
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact normalized attachment request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `condition-functional-impairment-attachment.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen attachment payload.`,
      },
    };
  }
  const replay = attachConditionFunctionalImpairments(normalizedRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained D-208 composition and D-267 resolutions do not reproduce the exact attachment.',
      },
    };
  }
  return { ok: true, value: artifact };
};
