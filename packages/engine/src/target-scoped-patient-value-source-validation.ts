import {
  TargetScopedPatientValueSourceValidationArtifactSchema,
  TargetScopedPatientValueSourceValidationRequestSchema,
  type TargetScopedPatientValueProjectionArtifact,
  type TargetScopedPatientValueSourceBinding,
  type TargetScopedPatientValueSourceValidationArtifact,
  type TargetScopedPatientValueSourceValidationFingerprint,
  type TargetScopedPatientValueSourceValidationRequest,
} from '@psychsim/schemas';

import {
  validatePatientStateScopedSource,
  verifyPatientSceneSourceInstanceCompilationIntegrity,
} from './patient-scene-source-instance-compiler';
import { verifyTargetScopedPatientValueProjectionArtifactIntegrity } from './target-scoped-patient-value-projection';

export const TARGET_SCOPED_PATIENT_VALUE_SOURCE_VALIDATION_VERSION = '2.0.0';

export type TargetScopedPatientValueSourceValidationErrorCode =
  | 'INVALID_REQUEST'
  | 'TARGET_SCOPED_PROJECTION_INVALID'
  | 'SOURCE_HORIZON_INVALID'
  | 'PATIENT_STATE_CONTEXT_MISMATCH'
  | 'PROJECTION_CROSS_LINK_INVALID'
  | 'SOURCE_REFERENCE_INVALID'
  | 'INVALID_OUTPUT';

export type TargetScopedPatientValueSourceValidationResult =
  | { readonly ok: true; readonly value: TargetScopedPatientValueSourceValidationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: TargetScopedPatientValueSourceValidationErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type TargetScopedPatientValueSourceValidationIntegrityResult =
  | { readonly ok: true; readonly value: TargetScopedPatientValueSourceValidationArtifact }
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
): TargetScopedPatientValueSourceValidationFingerprint =>
  `fingerprint.target-scoped-patient-value-source-validation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: TargetScopedPatientValueSourceValidationErrorCode,
  message: string,
  contentIds: readonly string[],
): TargetScopedPatientValueSourceValidationResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

const bindingKey = (binding: TargetScopedPatientValueSourceBinding): string =>
  `${binding.informationActionId}\u0000${binding.recordId}\u0000${binding.frozenValueId}`;

const deriveBindings = (
  artifact: TargetScopedPatientValueProjectionArtifact,
): TargetScopedPatientValueSourceBinding[] | null => {
  const projectionById = new Map(
    artifact.projections.map((projection) => [projection.id, projection]),
  );
  const revealById = new Map(artifact.frozenReveals.map((reveal) => [reveal.id, reveal]));
  const bindings: TargetScopedPatientValueSourceBinding[] = [];

  for (const evaluation of artifact.evaluations) {
    if (evaluation.status !== 'complete') continue;
    if (evaluation.resolvedProjectionId === null || evaluation.frozenRevealId === null) {
      return null;
    }
    const projection = projectionById.get(evaluation.resolvedProjectionId);
    const reveal = revealById.get(evaluation.frozenRevealId);
    if (!projection || !reveal) return null;

    for (const valueBinding of evaluation.valueBindings) {
      const sourceValue = projection.values.find(
        (value) => value.recordId === valueBinding.recordId,
      );
      const frozenValue = reveal.values.find((value) => value.id === valueBinding.frozenValueId);
      if (
        !sourceValue ||
        !frozenValue ||
        sourceValue.kind !== frozenValue.kind ||
        sourceValue.source.kind !== frozenValue.sourceKind ||
        (sourceValue.kind !== 'condition_functional_impairment' &&
          ('sourceInstanceId' in frozenValue
            ? sourceValue.source.sourceInstanceId !== frozenValue.sourceInstanceId
            : true))
      ) {
        return null;
      }
      bindings.push({
        informationActionId: evaluation.informationActionId,
        recordId: valueBinding.recordId,
        frozenValueId: valueBinding.frozenValueId,
        sourceInstanceId: sourceValue.source.sourceInstanceId,
        sourceKind: sourceValue.source.kind,
      });
    }
  }

  return bindings.sort((left, right) => compareStrings(bindingKey(left), bindingKey(right)));
};

const artifactPayload = (
  artifact: Omit<TargetScopedPatientValueSourceValidationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  targetScopedPatientValueProjectionRef: artifact.targetScopedPatientValueProjectionRef,
  sourceInstanceCompilationRef: artifact.sourceInstanceCompilationRef,
  validatedSourceBindings: artifact.validatedSourceBindings,
  frozenReveals: artifact.frozenReveals,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const validateTargetScopedPatientValueSources = (
  input: unknown,
): TargetScopedPatientValueSourceValidationResult => {
  const parsed = TargetScopedPatientValueSourceValidationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }

  const projection = verifyTargetScopedPatientValueProjectionArtifactIntegrity(
    parsed.data.targetScopedPatientValueProjection,
  );
  if (!projection.ok) {
    return fail('TARGET_SCOPED_PROJECTION_INVALID', projection.error.message, [
      parsed.data.targetScopedPatientValueProjection.id,
    ]);
  }
  const sourceHorizon = verifyPatientSceneSourceInstanceCompilationIntegrity(
    parsed.data.sourceInstanceCompilation,
  );
  if (!sourceHorizon.ok) {
    return fail('SOURCE_HORIZON_INVALID', sourceHorizon.error.message, [
      parsed.data.sourceInstanceCompilation.id,
    ]);
  }
  if (projection.value.patientStateId !== sourceHorizon.value.patientStateId) {
    return fail(
      'PATIENT_STATE_CONTEXT_MISMATCH',
      `${projection.value.id} belongs to ${projection.value.patientStateId}, not source horizon patient ${sourceHorizon.value.patientStateId}.`,
      [projection.value.id, sourceHorizon.value.id],
    );
  }

  const validatedSourceBindings = deriveBindings(projection.value);
  if (validatedSourceBindings === null) {
    return fail(
      'PROJECTION_CROSS_LINK_INVALID',
      `${projection.value.id} does not retain a complete action/record/frozen-value source binding.`,
      [projection.value.id],
    );
  }
  const uniqueSources = new Map(
    validatedSourceBindings.map((binding) => [
      `${binding.sourceKind}\u0000${binding.sourceInstanceId}`,
      {
        kind: binding.sourceKind,
        sourceInstanceId: binding.sourceInstanceId,
      },
    ]),
  );
  for (const source of uniqueSources.values()) {
    const validation = validatePatientStateScopedSource(
      source,
      projection.value.patientStateId,
      sourceHorizon.value,
    );
    if (!validation.ok) {
      return fail(
        'SOURCE_REFERENCE_INVALID',
        `${source.sourceInstanceId}: ${validation.error.code}: ${validation.error.message}`,
        [
          projection.value.id,
          sourceHorizon.value.id,
          source.sourceInstanceId,
          ...validatedSourceBindings
            .filter(
              (binding) =>
                binding.sourceInstanceId === source.sourceInstanceId &&
                binding.sourceKind === source.kind,
            )
            .flatMap((binding) => [binding.recordId, binding.frozenValueId]),
        ],
      );
    }
  }

  const request: TargetScopedPatientValueSourceValidationRequest = {
    ...parsed.data,
    targetScopedPatientValueProjection: projection.value,
    sourceInstanceCompilation: sourceHorizon.value,
  };
  const inputFingerprint = fingerprint('input', request);
  const payload: Omit<
    TargetScopedPatientValueSourceValidationArtifact,
    'id' | 'payloadFingerprint'
  > = {
    schemaVersion: 1,
    compilerVersion: TARGET_SCOPED_PATIENT_VALUE_SOURCE_VALIDATION_VERSION,
    requestId: request.id,
    patientStateId: projection.value.patientStateId,
    targetScopedPatientValueProjectionRef: {
      id: projection.value.id,
      payloadFingerprint: projection.value.payloadFingerprint,
    },
    sourceInstanceCompilationRef: {
      id: sourceHorizon.value.id,
      payloadFingerprint: sourceHorizon.value.payloadFingerprint,
    },
    validatedSourceBindings,
    frozenReveals: projection.value.frozenReveals,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(payload));
  const output = TargetScopedPatientValueSourceValidationArtifactSchema.safeParse({
    ...payload,
    id: `target-scoped-patient-value-source-validation.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
      request.id,
      projection.value.id,
      sourceHorizon.value.id,
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyTargetScopedPatientValueSourceValidationIntegrity = (
  input: unknown,
): TargetScopedPatientValueSourceValidationIntegrityResult => {
  const parsed = TargetScopedPatientValueSourceValidationArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== TARGET_SCOPED_PATIENT_VALUE_SOURCE_VALIDATION_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported target-scoped source validation ${artifact.compilerVersion}.`,
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
      `target-scoped-patient-value-source-validation.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen source-validation payload.`,
      },
    };
  }
  const replay = validateTargetScopedPatientValueSources(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained D-240 projection and D-291 source horizon do not reproduce the exact target-scoped source-validation artifact.',
      },
    };
  }
  return { ok: true, value: artifact };
};
