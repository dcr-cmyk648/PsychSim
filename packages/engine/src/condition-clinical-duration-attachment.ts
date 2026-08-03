import {
  ConditionClinicalDurationAttachmentArtifactSchema,
  ConditionClinicalDurationAttachmentRequestSchema,
  ResolvedPatientStateSchema,
  type ConditionClinicalDurationAttachmentArtifact,
  type ConditionClinicalDurationAttachmentFingerprint,
  type ConditionClinicalDurationAttachmentRequest,
  type ConditionClinicalDurationResolutionArtifact,
  type ConditionState,
  type ResolvedPatientState,
} from '@psychsim/schemas';

import { verifyConditionClinicalDurationResolutionIntegrity } from './clinical-duration-profile-resolver';
import { verifyResolvedPatientStateCompositionIntegrity } from './resolved-patient-state-composer';

export const CONDITION_CLINICAL_DURATION_ATTACHMENT_VERSION = '1.0.0';

export type ConditionClinicalDurationAttachmentErrorCode =
  | 'INVALID_REQUEST'
  | 'PATIENT_STATE_COMPOSITION_INVALID'
  | 'PATIENT_STATE_NOT_COMPOSED'
  | 'DURATION_RESOLUTION_INVALID'
  | 'PATIENT_STATE_CONTEXT_MISMATCH'
  | 'CONDITION_CONTEXT_MISMATCH'
  | 'DURATION_ASSIGNMENT_COLLISION'
  | 'INVALID_OUTPUT';

export type ConditionClinicalDurationAttachmentResult =
  | { readonly ok: true; readonly value: ConditionClinicalDurationAttachmentArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: ConditionClinicalDurationAttachmentErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type ConditionClinicalDurationAttachmentIntegrityResult =
  | { readonly ok: true; readonly value: ConditionClinicalDurationAttachmentArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_RESOLVER_VERSION'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'PATIENT_STATE_FINGERPRINT_MISMATCH'
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
): ConditionClinicalDurationAttachmentFingerprint =>
  `fingerprint.condition-clinical-duration-attachment.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const durationAssignmentKey = (
  artifact: Pick<ConditionClinicalDurationResolutionArtifact, 'conditionStateId' | 'profileRef'>,
): string => `${artifact.conditionStateId}\u0000${artifact.profileRef.id}`;

const resolvedDurationAssignmentKey = (
  duration: ResolvedPatientState['clinicalDurations'][number],
): string | null =>
  duration.target.kind === 'condition_state'
    ? `${duration.target.conditionStateId}\u0000${duration.durationProfileId}`
    : null;

const compareDurationArtifacts = (
  left: ConditionClinicalDurationResolutionArtifact,
  right: ConditionClinicalDurationResolutionArtifact,
): number =>
  compareStrings(durationAssignmentKey(left), durationAssignmentKey(right)) ||
  compareStrings(left.id, right.id);

const normalizeRequest = (
  request: ConditionClinicalDurationAttachmentRequest,
): ConditionClinicalDurationAttachmentRequest =>
  ConditionClinicalDurationAttachmentRequestSchema.parse({
    ...request,
    durationResolutionArtifacts: [...request.durationResolutionArtifacts].sort(
      compareDurationArtifacts,
    ),
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
  code: ConditionClinicalDurationAttachmentErrorCode,
  message: string,
  contentIds: readonly string[],
): ConditionClinicalDurationAttachmentResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

interface VerifiedAttachmentInputs {
  readonly request: ConditionClinicalDurationAttachmentRequest;
  readonly basePatientState: ResolvedPatientState;
}

const verifyInputs = (
  request: ConditionClinicalDurationAttachmentRequest,
):
  | { readonly ok: true; readonly value: VerifiedAttachmentInputs }
  | { readonly ok: false; readonly result: ConditionClinicalDurationAttachmentResult } => {
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
        'Condition durations require a completed D-208 patient-state composition.',
        [composition.id],
      ),
    };
  }
  const basePatientState = composition.composedPatientState;
  const conditionById = new Map(
    basePatientState.conditionStates.map((condition) => [condition.id, condition]),
  );
  const existingAssignments = new Set(
    basePatientState.clinicalDurations
      .map(resolvedDurationAssignmentKey)
      .filter((key): key is string => key !== null),
  );
  const requestedAssignments = new Set<string>();
  const requestedDurationIds = new Set<string>();

  for (const resolution of request.durationResolutionArtifacts) {
    const durationIntegrity = verifyConditionClinicalDurationResolutionIntegrity(resolution);
    if (!durationIntegrity.ok) {
      return {
        ok: false,
        result: fail(
          'DURATION_RESOLUTION_INVALID',
          `${durationIntegrity.error.code}: ${durationIntegrity.error.message}`,
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
    const assignment = durationAssignmentKey(resolution);
    if (
      requestedAssignments.has(assignment) ||
      existingAssignments.has(assignment) ||
      requestedDurationIds.has(resolution.resolvedDuration.id)
    ) {
      return {
        ok: false,
        result: fail(
          'DURATION_ASSIGNMENT_COLLISION',
          `${resolution.id} duplicates an exact condition/profile assignment or duration record.`,
          [resolution.id, resolution.resolvedDuration.id, resolution.conditionStateId],
        ),
      };
    }
    requestedAssignments.add(assignment);
    requestedDurationIds.add(resolution.resolvedDuration.id);
  }

  return {
    ok: true,
    value: {
      request,
      basePatientState,
    },
  };
};

const patientStateFingerprintPayload = (
  basePatientState: ResolvedPatientState,
  durationArtifacts: readonly ConditionClinicalDurationResolutionArtifact[],
): unknown => ({
  basePatientStateRef: {
    id: basePatientState.id,
    clinicalDurationIds: basePatientState.clinicalDurations
      .map((duration) => duration.id)
      .sort(compareStrings),
  },
  durationResolutionRefs: durationArtifacts.map((artifact) => ({
    id: artifact.id,
    payloadFingerprint: artifact.payloadFingerprint,
    resolvedDurationId: artifact.resolvedDuration.id,
  })),
  patientStateBody: {
    ...basePatientState,
    clinicalDurations: [
      ...basePatientState.clinicalDurations,
      ...durationArtifacts.map((artifact) => artifact.resolvedDuration),
    ].sort((left, right) => compareStrings(left.id, right.id)),
  },
});

const buildComposedPatientState = (
  basePatientState: ResolvedPatientState,
  durationArtifacts: readonly ConditionClinicalDurationResolutionArtifact[],
): {
  readonly state: ResolvedPatientState;
  readonly fingerprint: ConditionClinicalDurationAttachmentFingerprint;
} => {
  const stateFingerprint = fingerprint(
    'patient-state',
    patientStateFingerprintPayload(basePatientState, durationArtifacts),
  );
  if (durationArtifacts.length === 0) {
    return {
      state: basePatientState,
      fingerprint: stateFingerprint,
    };
  }
  return {
    state: ResolvedPatientStateSchema.parse({
      ...basePatientState,
      id: `resolved-patient-state.condition-durations.${stateFingerprint.slice(-16)}`,
      clinicalDurations: [
        ...basePatientState.clinicalDurations,
        ...durationArtifacts.map((artifact) => artifact.resolvedDuration),
      ].sort((left, right) => compareStrings(left.id, right.id)),
    }),
    fingerprint: stateFingerprint,
  };
};

const durationResolutionRef = (
  resolution: ConditionClinicalDurationResolutionArtifact,
): ConditionClinicalDurationAttachmentArtifact['durationResolutionRefs'][number] => ({
  id: resolution.id,
  payloadFingerprint: resolution.payloadFingerprint,
  patientStateId: resolution.patientStateId,
  conditionStateId: resolution.conditionStateId,
  profileRef: resolution.profileRef,
  resolvedDurationId: resolution.resolvedDuration.id,
});

const artifactPayload = (
  artifact: Omit<ConditionClinicalDurationAttachmentArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  resolverVersion: artifact.resolverVersion,
  requestId: artifact.requestId,
  patientStateCompositionRef: artifact.patientStateCompositionRef,
  basePatientStateRef: artifact.basePatientStateRef,
  durationResolutionRefs: artifact.durationResolutionRefs,
  attachedDurationIds: artifact.attachedDurationIds,
  composedPatientState: artifact.composedPatientState,
  composedPatientStateFingerprint: artifact.composedPatientStateFingerprint,
  attachmentRequest: artifact.attachmentRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const attachConditionClinicalDurations = (
  input: unknown,
): ConditionClinicalDurationAttachmentResult => {
  const parsed = ConditionClinicalDurationAttachmentRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }
  const request = normalizeRequest(parsed.data);
  const verified = verifyInputs(request);
  if (!verified.ok) return verified.result;

  try {
    const composition = request.patientStateCompositionArtifact;
    const basePatientState = verified.value.basePatientState;
    const attached = buildComposedPatientState(
      basePatientState,
      request.durationResolutionArtifacts,
    );
    const inputFingerprint = fingerprint('input', request);
    const withoutIdentity = {
      schemaVersion: 1 as const,
      resolverVersion: CONDITION_CLINICAL_DURATION_ATTACHMENT_VERSION,
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
      durationResolutionRefs: request.durationResolutionArtifacts.map(durationResolutionRef),
      attachedDurationIds: request.durationResolutionArtifacts.map(
        (resolution) => resolution.resolvedDuration.id,
      ),
      composedPatientState: attached.state,
      composedPatientStateFingerprint: attached.fingerprint,
      attachmentRequest: request,
      inputFingerprint,
    };
    const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
    const output = ConditionClinicalDurationAttachmentArtifactSchema.safeParse({
      ...withoutIdentity,
      id: `condition-clinical-duration-attachment.${payloadFingerprint.slice(-16)}`,
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

export const verifyConditionClinicalDurationAttachmentIntegrity = (
  input: unknown,
): ConditionClinicalDurationAttachmentIntegrityResult => {
  const parsed = ConditionClinicalDurationAttachmentArtifactSchema.safeParse(input);
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
  if (artifact.resolverVersion !== CONDITION_CLINICAL_DURATION_ATTACHMENT_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_RESOLVER_VERSION',
        message: `${artifact.id} uses unsupported condition-duration attachment ${artifact.resolverVersion}.`,
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
  const basePatientState =
    artifact.attachmentRequest.patientStateCompositionArtifact.composedPatientState;
  if (basePatientState === null) {
    return {
      ok: false,
      error: {
        code: 'PATIENT_STATE_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain a composed base patient state.`,
      },
    };
  }
  const expectedStateFingerprint = fingerprint(
    'patient-state',
    patientStateFingerprintPayload(
      basePatientState,
      artifact.attachmentRequest.durationResolutionArtifacts,
    ),
  );
  if (artifact.composedPatientStateFingerprint !== expectedStateFingerprint) {
    return {
      ok: false,
      error: {
        code: 'PATIENT_STATE_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its exact attached patient-state payload.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `condition-clinical-duration-attachment.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen attachment payload.`,
      },
    };
  }
  const replay = attachConditionClinicalDurations(normalizedRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained D-208 composition and D-263 resolutions do not reproduce the exact attached patient state.',
      },
    };
  }
  return { ok: true, value: artifact };
};
