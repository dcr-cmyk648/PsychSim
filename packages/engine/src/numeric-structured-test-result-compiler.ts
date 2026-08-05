import {
  NumericStructuredTestResultCompilationArtifactSchema,
  NumericStructuredTestResultCompilationRequestSchema,
  StructuredTestResultEnvelopeSchema,
  StructuredTestResultSchema,
  type NumericStructuredTestResultCompilationArtifact,
  type NumericStructuredTestResultCompilationFingerprint,
  type NumericStructuredTestResultCompilationRequest,
  type NumericTestGenerationProfile,
  type ReferenceIntervalSetDefinition,
} from '@psychsim/schemas';

import { verifyCatalogPatientSceneSourceInstanceCompilationIntegrity } from './catalog-patient-scene-source-instance-compiler';
import { generateNoncriticalNumericTest, resolveNumericTestProfile } from './labs';

export const NUMERIC_STRUCTURED_TEST_RESULT_COMPILER_VERSION = '1.0.0';

export type NumericStructuredTestResultCompilationResult =
  | {
      readonly ok: true;
      readonly value: NumericStructuredTestResultCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'SOURCE_INSTANCE_COMPILATION_INVALID'
          | 'SOURCE_INSTANCE_NOT_FOUND'
          | 'NO_MATCHING_PROFILE'
          | 'REFERENCE_INTERVAL_NOT_FOUND'
          | 'GENERATION_FAILED'
          | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type NumericStructuredTestResultCompilationIntegrityResult =
  | {
      readonly ok: true;
      readonly value: NumericStructuredTestResultCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'SOURCE_INSTANCE_COMPILATION_INVALID'
          | 'TEST_DEFINITION_FINGERPRINT_MISMATCH'
          | 'PROFILE_FINGERPRINT_MISMATCH'
          | 'REFERENCE_INTERVAL_FINGERPRINT_MISMATCH'
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
): NumericStructuredTestResultCompilationFingerprint =>
  `fingerprint.numeric-structured-test-result-compilation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const normalizeRequest = (
  request: NumericStructuredTestResultCompilationRequest,
): NumericStructuredTestResultCompilationRequest =>
  NumericStructuredTestResultCompilationRequestSchema.parse({
    ...request,
    generationContext: {
      ...request.generationContext,
      diagnosisIds: [...request.generationContext.diagnosisIds].sort(compareStrings),
      clinicalTagIds: [...request.generationContext.clinicalTagIds].sort(compareStrings),
    },
    referenceIntervalSets: [...request.referenceIntervalSets].sort((left, right) =>
      compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
    ),
  });

const artifactPayload = (
  artifact: Omit<NumericStructuredTestResultCompilationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  testDefinitionRef: artifact.testDefinitionRef,
  selectedProfileRef: artifact.selectedProfileRef,
  referenceIntervalSetRef: artifact.referenceIntervalSetRef,
  sourceInstanceRef: artifact.sourceInstanceRef,
  result: artifact.result,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

const findReferenceIntervalSet = (
  request: NumericStructuredTestResultCompilationRequest,
  profile: NumericTestGenerationProfile,
): ReferenceIntervalSetDefinition | undefined =>
  request.referenceIntervalSets.find(
    (definition) => definition.id === profile.referenceIntervalSetId,
  );

const generatedResultId = (
  request: NumericStructuredTestResultCompilationRequest,
  profile: NumericTestGenerationProfile,
): string =>
  `structured-test-result.generated.${hashToHex64(
    JSON.stringify(
      canonicalizeObjectKeys({
        patientStateId: request.patientStateId,
        testDefinitionId: request.testDefinition.id,
        testDefinitionContentVersion: request.testDefinition.contentVersion,
        profileId: profile.id,
        seed: request.seed,
      }),
    ),
  )}`;

const stableDrawId = (
  request: NumericStructuredTestResultCompilationRequest,
  profile: NumericTestGenerationProfile,
): string =>
  `stable-draw.numeric-structured-test.${hashToHex64(
    JSON.stringify(
      canonicalizeObjectKeys({
        patientStateId: request.patientStateId,
        testDefinitionId: request.testDefinition.id,
        profileId: profile.id,
        seed: request.seed,
      }),
    ),
  )}`;

export const compileNumericStructuredTestResult = (
  input: unknown,
): NumericStructuredTestResultCompilationResult => {
  const parsed = NumericStructuredTestResultCompilationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  const request = normalizeRequest(parsed.data);
  const sourceCompilation = verifyCatalogPatientSceneSourceInstanceCompilationIntegrity(
    request.sourceInstanceCompilation,
  );
  if (!sourceCompilation.ok) {
    return {
      ok: false,
      error: {
        code: 'SOURCE_INSTANCE_COMPILATION_INVALID',
        message: sourceCompilation.error.message,
      },
    };
  }
  const profile = resolveNumericTestProfile(request.testDefinition, request.generationContext);
  if (profile === null) {
    return {
      ok: false,
      error: {
        code: 'NO_MATCHING_PROFILE',
        message: `${request.testDefinition.id} has no numeric generation profile for the supplied patient context.`,
      },
    };
  }
  const referenceIntervalSet = findReferenceIntervalSet(request, profile);
  if (referenceIntervalSet === undefined) {
    return {
      ok: false,
      error: {
        code: 'REFERENCE_INTERVAL_NOT_FOUND',
        message: `${profile.id} references missing ${profile.referenceIntervalSetId}.`,
      },
    };
  }
  const sourceInstance = sourceCompilation.value.sourceInstanceCompilation.sourceInstances.find(
    (instance) =>
      instance.definitionRef.id === request.sourceDefinitionRef.id &&
      instance.definitionRef.contentVersion === request.sourceDefinitionRef.contentVersion,
  );
  if (sourceInstance === undefined) {
    return {
      ok: false,
      error: {
        code: 'SOURCE_INSTANCE_NOT_FOUND',
        message: `${request.sourceDefinitionRef.id}@${request.sourceDefinitionRef.contentVersion} is not present in the exact patient source horizon.`,
      },
    };
  }
  const generated = generateNoncriticalNumericTest(
    request.testDefinition,
    request.generationContext,
    request.seed,
    [],
  );
  if (
    generated === null ||
    generated.profileId !== profile.id ||
    generated.observations.length !== profile.components.length
  ) {
    return {
      ok: false,
      error: {
        code: 'GENERATION_FAILED',
        message: `${request.testDefinition.id} did not produce its exact selected numeric profile.`,
      },
    };
  }
  const sourceUseNoteIds = [
    ...new Set([
      ...request.testDefinition.sourceUseNoteIds,
      ...referenceIntervalSet.sourceUseNoteIds,
    ]),
  ].sort(compareStrings);
  const result = StructuredTestResultSchema.safeParse({
    schemaVersion: 1,
    id: generatedResultId(request, profile),
    testDefinitionId: request.testDefinition.id,
    testDefinitionContentVersion: request.testDefinition.contentVersion,
    source: {
      kind: sourceInstance.kind,
      sourceInstanceId: sourceInstance.id,
    },
    timeScopeId: request.timeScopeId,
    resolution: {
      origin: 'deterministic_generation',
      generationProfileId: profile.id,
      generationProfileContentVersion: request.testDefinition.contentVersion,
      resolverVersion: NUMERIC_STRUCTURED_TEST_RESULT_COMPILER_VERSION,
      stableDrawId: stableDrawId(request, profile),
    },
    kind: 'numeric_panel',
    components: profile.components.map((component, index) => {
      const observation = generated.observations[index]!;
      return {
        componentDefinitionId: component.id,
        value: observation.value,
        displayValue: observation.displayValue,
        unit: component.unit,
        ucumCode: component.ucumCode,
        referenceInterval: {
          low: component.referenceRange.minimum,
          high: component.referenceRange.maximum,
          unit: component.unit,
          ucumCode: component.ucumCode,
          display: observation.referenceInterval?.display,
          populationDefinitionId: referenceIntervalSet.id,
          sourceUseNoteIds,
        },
        interpretation: observation.flag,
      };
    }),
  });
  if (!result.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(result.error.issues),
      },
    };
  }
  const envelope = StructuredTestResultEnvelopeSchema.safeParse({
    definition: request.testDefinition,
    result: result.data,
  });
  if (!envelope.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(envelope.error.issues),
      },
    };
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: NUMERIC_STRUCTURED_TEST_RESULT_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: request.patientStateId,
    testDefinitionRef: {
      id: request.testDefinition.id,
      contentVersion: request.testDefinition.contentVersion,
      fingerprint: fingerprint('test-definition', request.testDefinition),
    },
    selectedProfileRef: {
      id: profile.id,
      ownerContentVersion: request.testDefinition.contentVersion,
      fingerprint: fingerprint('generation-profile', profile),
    },
    referenceIntervalSetRef: {
      id: referenceIntervalSet.id,
      contentVersion: referenceIntervalSet.contentVersion,
      fingerprint: fingerprint('reference-interval-set', referenceIntervalSet),
    },
    sourceInstanceRef: {
      id: sourceInstance.id,
      kind: sourceInstance.kind,
      definitionRef: sourceInstance.definitionRef,
    },
    result: result.data,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = NumericStructuredTestResultCompilationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `numeric-structured-test-result-compilation.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(output.error.issues),
      },
    };
  }
  return { ok: true, value: output.data };
};

export const verifyNumericStructuredTestResultCompilationIntegrity = (
  input: unknown,
): NumericStructuredTestResultCompilationIntegrityResult => {
  const parsed = NumericStructuredTestResultCompilationArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== NUMERIC_STRUCTURED_TEST_RESULT_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported numeric-test compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const sourceCompilation = verifyCatalogPatientSceneSourceInstanceCompilationIntegrity(
    artifact.compileRequest.sourceInstanceCompilation,
  );
  if (!sourceCompilation.ok) {
    return {
      ok: false,
      error: {
        code: 'SOURCE_INSTANCE_COMPILATION_INVALID',
        message: sourceCompilation.error.message,
      },
    };
  }
  if (
    artifact.testDefinitionRef.fingerprint !==
    fingerprint('test-definition', artifact.compileRequest.testDefinition)
  ) {
    return {
      ok: false,
      error: {
        code: 'TEST_DEFINITION_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact test definition.`,
      },
    };
  }
  const profile =
    artifact.compileRequest.testDefinition.generator.type === 'numeric_panel'
      ? artifact.compileRequest.testDefinition.generator.profiles.find(
          (candidate) => candidate.id === artifact.selectedProfileRef.id,
        )
      : undefined;
  if (
    profile === undefined ||
    artifact.selectedProfileRef.fingerprint !== fingerprint('generation-profile', profile)
  ) {
    return {
      ok: false,
      error: {
        code: 'PROFILE_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact selected generation profile.`,
      },
    };
  }
  const referenceIntervalSet = artifact.compileRequest.referenceIntervalSets.find(
    (candidate) =>
      candidate.id === artifact.referenceIntervalSetRef.id &&
      candidate.contentVersion === artifact.referenceIntervalSetRef.contentVersion,
  );
  if (
    referenceIntervalSet === undefined ||
    artifact.referenceIntervalSetRef.fingerprint !==
      fingerprint('reference-interval-set', referenceIntervalSet)
  ) {
    return {
      ok: false,
      error: {
        code: 'REFERENCE_INTERVAL_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact reference-interval owner.`,
      },
    };
  }
  const normalizedRequest = normalizeRequest(artifact.compileRequest);
  const expectedInputFingerprint = fingerprint('input', normalizedRequest);
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact normalized request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `numeric-structured-test-result-compilation.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen numeric-test payload.`,
      },
    };
  }
  const replay = compileNumericStructuredTestResult(normalizedRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: 'The retained numeric-test request does not reproduce the exact artifact.',
      },
    };
  }
  return { ok: true, value: artifact };
};
