import {
  StructuredSourceReportSourceValidationArtifactSchema,
  StructuredSourceReportSourceValidationRequestSchema,
  type StructuredSourceReportArtifact,
  type StructuredSourceReportSourceValidationArtifact,
  type StructuredSourceReportSourceValidationFingerprint,
  type StructuredSourceReportSourceValidationRequest,
  type StructuredSourceReportValidatedSourceBinding,
} from '@psychsim/schemas';

import {
  validatePatientStateScopedSource,
  verifyPatientSceneSourceInstanceCompilationIntegrity,
} from './patient-scene-source-instance-compiler';
import { verifyStructuredSourceReportArtifactIntegrity } from './structured-source-report-compiler';

export const STRUCTURED_SOURCE_REPORT_SOURCE_VALIDATION_VERSION = '1.0.0';

export type StructuredSourceReportSourceValidationErrorCode =
  | 'INVALID_REQUEST'
  | 'STRUCTURED_SOURCE_REPORT_INVALID'
  | 'SOURCE_HORIZON_INVALID'
  | 'PATIENT_STATE_CONTEXT_MISMATCH'
  | 'REPORT_CROSS_LINK_INVALID'
  | 'SOURCE_REFERENCE_INVALID'
  | 'INVALID_OUTPUT';

export type StructuredSourceReportSourceValidationResult =
  | { readonly ok: true; readonly value: StructuredSourceReportSourceValidationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: StructuredSourceReportSourceValidationErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type StructuredSourceReportSourceValidationIntegrityResult =
  | { readonly ok: true; readonly value: StructuredSourceReportSourceValidationArtifact }
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
): StructuredSourceReportSourceValidationFingerprint =>
  `fingerprint.structured-source-report-source-validation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: StructuredSourceReportSourceValidationErrorCode,
  message: string,
  contentIds: readonly string[],
): StructuredSourceReportSourceValidationResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const bindingKey = (
  binding: Pick<
    StructuredSourceReportValidatedSourceBinding,
    'profileId' | 'profileContentVersion'
  >,
): string => `${binding.profileId}\u0000${binding.profileContentVersion}`;

type UnvalidatedSourceBinding = Omit<
  StructuredSourceReportValidatedSourceBinding,
  'sourceDefinitionId' | 'sourceDefinitionContentVersion'
>;

const deriveBindings = (
  report: StructuredSourceReportArtifact,
): UnvalidatedSourceBinding[] | null => {
  const profileByKey = new Map(
    report.compileRequest.profiles.map((profile) => [
      `${profile.id}\u0000${profile.contentVersion}`,
      profile,
    ]),
  );
  const recipeById = new Map(
    report.projectionRecipes.map((recipe) => [recipe.resolved.id, recipe]),
  );
  const bindings: UnvalidatedSourceBinding[] = [];

  for (const reference of report.profileReferences) {
    const profile = profileByKey.get(
      `${reference.profileRef.id}\u0000${reference.profileRef.contentVersion}`,
    );
    const recipe = recipeById.get(reference.resolvedProjectionId);
    if (
      !profile ||
      !recipe ||
      recipe.resolved.definitionId !== reference.definitionRef.id ||
      recipe.resolved.definitionContentVersion !== reference.definitionRef.contentVersion ||
      recipe.resolved.source.kind !== profile.source.kind ||
      recipe.resolved.source.sourceInstanceId !== profile.source.sourceInstanceId
    ) {
      return null;
    }
    bindings.push({
      profileId: reference.profileRef.id,
      profileContentVersion: reference.profileRef.contentVersion,
      definitionId: reference.definitionRef.id,
      definitionContentVersion: reference.definitionRef.contentVersion,
      resolvedProjectionId: reference.resolvedProjectionId,
      sourceInstanceId: profile.source.sourceInstanceId,
      sourceKind: profile.source.kind,
    });
  }

  return bindings.sort((left, right) => compareStrings(bindingKey(left), bindingKey(right)));
};

const artifactPayload = (
  artifact: Omit<StructuredSourceReportSourceValidationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  structuredSourceReportRef: artifact.structuredSourceReportRef,
  sourceInstanceCompilationRef: artifact.sourceInstanceCompilationRef,
  validatedSourceBindings: artifact.validatedSourceBindings,
  projectionRecipes: artifact.projectionRecipes,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const validateStructuredSourceReportSources = (
  input: unknown,
): StructuredSourceReportSourceValidationResult => {
  const parsed = StructuredSourceReportSourceValidationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }

  const report = verifyStructuredSourceReportArtifactIntegrity(parsed.data.structuredSourceReport);
  if (!report.ok) {
    return fail('STRUCTURED_SOURCE_REPORT_INVALID', report.error.message, [
      parsed.data.structuredSourceReport.id,
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
  if (report.value.patientStateId !== sourceHorizon.value.patientStateId) {
    return fail(
      'PATIENT_STATE_CONTEXT_MISMATCH',
      `${report.value.id} belongs to ${report.value.patientStateId}, not source horizon patient ${sourceHorizon.value.patientStateId}.`,
      [report.value.id, sourceHorizon.value.id],
    );
  }

  const unvalidatedSourceBindings = deriveBindings(report.value);
  if (unvalidatedSourceBindings === null) {
    return fail(
      'REPORT_CROSS_LINK_INVALID',
      `${report.value.id} does not retain a complete profile/projection/source binding.`,
      [report.value.id],
    );
  }
  const uniqueSources = new Map(
    unvalidatedSourceBindings.map((binding) => [
      `${binding.sourceKind}\u0000${binding.sourceInstanceId}`,
      { kind: binding.sourceKind, sourceInstanceId: binding.sourceInstanceId },
    ]),
  );
  for (const source of uniqueSources.values()) {
    const validation = validatePatientStateScopedSource(
      source,
      report.value.patientStateId,
      sourceHorizon.value,
    );
    if (!validation.ok) {
      return fail(
        'SOURCE_REFERENCE_INVALID',
        `${source.sourceInstanceId}: ${validation.error.code}: ${validation.error.message}`,
        [
          report.value.id,
          sourceHorizon.value.id,
          source.sourceInstanceId,
          ...unvalidatedSourceBindings
            .filter(
              (binding) =>
                binding.sourceInstanceId === source.sourceInstanceId &&
                binding.sourceKind === source.kind,
            )
            .flatMap((binding) => [
              binding.profileId,
              binding.definitionId,
              binding.resolvedProjectionId,
            ]),
        ],
      );
    }
  }
  const validatedSourceBindings: StructuredSourceReportValidatedSourceBinding[] =
    unvalidatedSourceBindings.map((binding) => {
      const sourceInstance = sourceHorizon.value.sourceInstances.find(
        (candidate) => candidate.id === binding.sourceInstanceId,
      );
      if (sourceInstance === undefined) {
        throw new Error('A source validated against D-291 must retain its source definition.');
      }
      return {
        ...binding,
        sourceDefinitionId: sourceInstance.definitionRef.id,
        sourceDefinitionContentVersion: sourceInstance.definitionRef.contentVersion,
      };
    });

  const request: StructuredSourceReportSourceValidationRequest = {
    ...parsed.data,
    structuredSourceReport: report.value,
    sourceInstanceCompilation: sourceHorizon.value,
  };
  const inputFingerprint = fingerprint('input', request);
  const payload: Omit<StructuredSourceReportSourceValidationArtifact, 'id' | 'payloadFingerprint'> =
    {
      schemaVersion: 1,
      compilerVersion: STRUCTURED_SOURCE_REPORT_SOURCE_VALIDATION_VERSION,
      requestId: request.id,
      patientStateId: report.value.patientStateId,
      structuredSourceReportRef: {
        id: report.value.id,
        payloadFingerprint: report.value.payloadFingerprint,
      },
      sourceInstanceCompilationRef: {
        id: sourceHorizon.value.id,
        payloadFingerprint: sourceHorizon.value.payloadFingerprint,
      },
      validatedSourceBindings,
      projectionRecipes: report.value.projectionRecipes,
      compileRequest: request,
      inputFingerprint,
    };
  const payloadFingerprint = fingerprint('payload', artifactPayload(payload));
  const output = StructuredSourceReportSourceValidationArtifactSchema.safeParse({
    ...payload,
    id: `structured-source-report-source-validation.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
      request.id,
      report.value.id,
      sourceHorizon.value.id,
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyStructuredSourceReportSourceValidationIntegrity = (
  input: unknown,
): StructuredSourceReportSourceValidationIntegrityResult => {
  const parsed = StructuredSourceReportSourceValidationArtifactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (artifact.compilerVersion !== STRUCTURED_SOURCE_REPORT_SOURCE_VALIDATION_VERSION) {
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
      `structured-source-report-source-validation.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen source-validation payload.`,
      },
    };
  }
  const replay = validateStructuredSourceReportSources(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained D-215 report and D-291 source horizon do not reproduce the exact source-validation artifact.',
      },
    };
  }
  return { ok: true, value: artifact };
};
