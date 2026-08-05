import {
  CategoricalObservationResolutionEnvelopeSchema,
  GeneratedCategoricalObservationCompilationArtifactSchema,
  GeneratedCategoricalObservationCompilationRequestSchema,
  ResolvedCategoricalObservationSchema,
  type GeneratedCategoricalObservationCompilationArtifact,
  type GeneratedCategoricalObservationCompilationFingerprint,
  type GeneratedCategoricalObservationCompilationRequest,
  type GeneratedCategoricalObservationValueOption,
  type GeneratedCategoricalObservationValueProfile,
  type NumericStructuredTestGenerationContext,
} from '@psychsim/schemas';

import { verifyCatalogPatientSceneSourceInstanceCompilationIntegrity } from './catalog-patient-scene-source-instance-compiler';
import { seededUnit } from './rng';

export const GENERATED_CATEGORICAL_OBSERVATION_COMPILER_VERSION = '1.0.0';

export type GeneratedCategoricalObservationCompilationResult =
  | {
      readonly ok: true;
      readonly value: GeneratedCategoricalObservationCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'SOURCE_INSTANCE_COMPILATION_INVALID'
          | 'NO_MATCHING_PROFILE'
          | 'SOURCE_INSTANCE_NOT_FOUND'
          | 'OBSERVATION_CONTRACT_MISMATCH'
          | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type GeneratedCategoricalObservationCompilationIntegrityResult =
  | {
      readonly ok: true;
      readonly value: GeneratedCategoricalObservationCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'SOURCE_INSTANCE_COMPILATION_INVALID'
          | 'OBSERVATION_DEFINITION_FINGERPRINT_MISMATCH'
          | 'GENERATION_PROFILE_FINGERPRINT_MISMATCH'
          | 'VALUE_OPTION_FINGERPRINT_MISMATCH'
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
): GeneratedCategoricalObservationCompilationFingerprint =>
  `fingerprint.generated-categorical-observation-compilation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const normalizeProfile = (
  profile: GeneratedCategoricalObservationValueProfile,
): GeneratedCategoricalObservationValueProfile => ({
  ...profile,
  when: {
    ...profile.when,
    anyDiagnosisIds: [...profile.when.anyDiagnosisIds].sort(compareStrings),
    allClinicalTagIds: [...profile.when.allClinicalTagIds].sort(compareStrings),
  },
  valueOptions: [...profile.valueOptions].sort((left, right) => compareStrings(left.id, right.id)),
  sourceUseNoteIds: [...profile.sourceUseNoteIds].sort(compareStrings),
  review: {
    ...profile.review,
    sourceUseNoteIds: [...profile.review.sourceUseNoteIds].sort(compareStrings),
  },
});

const normalizeRequest = (
  request: GeneratedCategoricalObservationCompilationRequest,
): GeneratedCategoricalObservationCompilationRequest => ({
  ...request,
  generationContext: {
    ...request.generationContext,
    diagnosisIds: [...request.generationContext.diagnosisIds].sort(compareStrings),
    clinicalTagIds: [...request.generationContext.clinicalTagIds].sort(compareStrings),
  },
  generationProfiles: request.generationProfiles
    .map(normalizeProfile)
    .sort(
      (left, right) =>
        compareStrings(left.id, right.id) ||
        compareStrings(left.contentVersion, right.contentVersion),
    ),
});

const profileMatches = (
  profile: GeneratedCategoricalObservationValueProfile,
  context: NumericStructuredTestGenerationContext,
): boolean => {
  const { when } = profile;
  return (
    (when.minimumAgeYears === undefined || context.ageYears >= when.minimumAgeYears) &&
    (when.maximumAgeYears === undefined || context.ageYears <= when.maximumAgeYears) &&
    (when.sexForReference === undefined || context.sexForReference === when.sexForReference) &&
    (when.anyDiagnosisIds.length === 0 ||
      when.anyDiagnosisIds.some((id) => context.diagnosisIds.includes(id))) &&
    when.allClinicalTagIds.every((id) => context.clinicalTagIds.includes(id))
  );
};

export const resolveGeneratedCategoricalObservationProfile = (
  profiles: readonly GeneratedCategoricalObservationValueProfile[],
  context: NumericStructuredTestGenerationContext,
): GeneratedCategoricalObservationValueProfile | null =>
  [...profiles]
    .filter((profile) => profileMatches(profile, context))
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        compareStrings(left.id, right.id) ||
        compareStrings(left.contentVersion, right.contentVersion),
    )[0] ?? null;

const stableDrawId = (
  request: GeneratedCategoricalObservationCompilationRequest,
  profile: GeneratedCategoricalObservationValueProfile,
): string =>
  `stable-draw.generated-categorical-observation.value-option.${hashToHex64(
    JSON.stringify(
      canonicalizeObjectKeys({
        patientStateId: request.patientStateId,
        observationDefinitionId: request.observationDefinition.id,
        observationDefinitionContentVersion: request.observationDefinition.contentVersion,
        generationProfileId: profile.id,
        generationProfileContentVersion: profile.contentVersion,
        timeScopeId: request.timeScopeId,
        seed: request.seed,
      }),
    ),
  )}`;

const selectValueOption = (
  profile: GeneratedCategoricalObservationValueProfile,
  unit: number,
): GeneratedCategoricalObservationValueOption => {
  const totalWeight = profile.valueOptions.reduce(
    (sum, candidate) => sum + candidate.relativeWeight,
    0,
  );
  let cursor = unit * totalWeight;
  for (const candidate of profile.valueOptions) {
    cursor -= candidate.relativeWeight;
    if (cursor < 0) return candidate;
  }
  return profile.valueOptions.at(-1)!;
};

const generatedObservationId = (
  request: GeneratedCategoricalObservationCompilationRequest,
  profile: GeneratedCategoricalObservationValueProfile,
): string =>
  `resolved-observation.generated.${hashToHex64(
    JSON.stringify(
      canonicalizeObjectKeys({
        patientStateId: request.patientStateId,
        observationDefinitionId: request.observationDefinition.id,
        observationDefinitionContentVersion: request.observationDefinition.contentVersion,
        generationProfileId: profile.id,
        generationProfileContentVersion: profile.contentVersion,
        timeScopeId: request.timeScopeId,
        seed: request.seed,
      }),
    ),
  )}`;

const artifactPayload = (
  artifact: Omit<GeneratedCategoricalObservationCompilationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  observationDefinitionRef: artifact.observationDefinitionRef,
  selectedProfileRef: artifact.selectedProfileRef,
  selectedValueOptionRef: artifact.selectedValueOptionRef,
  generationDraws: artifact.generationDraws,
  sourceInstanceRef: artifact.sourceInstanceRef,
  resolvedObservation: artifact.resolvedObservation,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const compileGeneratedCategoricalObservation = (
  input: unknown,
): GeneratedCategoricalObservationCompilationResult => {
  const parsed = GeneratedCategoricalObservationCompilationRequestSchema.safeParse(input);
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
  const profile = resolveGeneratedCategoricalObservationProfile(
    request.generationProfiles,
    request.generationContext,
  );
  if (profile === null) {
    return {
      ok: false,
      error: {
        code: 'NO_MATCHING_PROFILE',
        message: `${request.observationDefinition.id} has no categorical-observation generation profile for the supplied patient context.`,
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

  const valueOptionStableDrawId = stableDrawId(request, profile);
  const selectedValueOption = selectValueOption(
    profile,
    seededUnit(request.seed, valueOptionStableDrawId),
  );
  const resolvedObservation = ResolvedCategoricalObservationSchema.safeParse({
    schemaVersion: 1,
    id: generatedObservationId(request, profile),
    definitionId: request.observationDefinition.id,
    definitionContentVersion: request.observationDefinition.contentVersion,
    valueId: selectedValueOption.valueId,
    displayValue: selectedValueOption.displayValue,
    timeScopeId: request.timeScopeId,
    source: {
      kind: 'clinician_observation',
      sourceInstanceId: sourceInstance.id,
    },
    interpretationIds: [],
    resolution: {
      origin: 'deterministic_generation',
      generationProfileId: profile.id,
      generationProfileContentVersion: profile.contentVersion,
      resolverVersion: GENERATED_CATEGORICAL_OBSERVATION_COMPILER_VERSION,
      stableDrawId: valueOptionStableDrawId,
    },
  });
  if (!resolvedObservation.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(resolvedObservation.error.issues),
      },
    };
  }
  const envelope = CategoricalObservationResolutionEnvelopeSchema.safeParse({
    definition: request.observationDefinition,
    resolved: resolvedObservation.data,
  });
  if (!envelope.success) {
    return {
      ok: false,
      error: {
        code: 'OBSERVATION_CONTRACT_MISMATCH',
        message: issuesText(envelope.error.issues),
      },
    };
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: GENERATED_CATEGORICAL_OBSERVATION_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: request.patientStateId,
    observationDefinitionRef: {
      id: request.observationDefinition.id,
      contentVersion: request.observationDefinition.contentVersion,
      fingerprint: fingerprint('observation-definition', request.observationDefinition),
    },
    selectedProfileRef: {
      id: profile.id,
      contentVersion: profile.contentVersion,
      fingerprint: fingerprint('generation-profile', profile),
    },
    selectedValueOptionRef: {
      id: selectedValueOption.id,
      fingerprint: fingerprint('value-option', selectedValueOption),
    },
    generationDraws: {
      valueOptionStableDrawId,
    },
    sourceInstanceRef: {
      id: sourceInstance.id,
      kind: 'clinician_observation' as const,
      definitionRef: sourceInstance.definitionRef,
    },
    resolvedObservation: resolvedObservation.data,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = GeneratedCategoricalObservationCompilationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `generated-categorical-observation-compilation.${payloadFingerprint.slice(-16)}`,
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

export const verifyGeneratedCategoricalObservationCompilationIntegrity = (
  input: unknown,
): GeneratedCategoricalObservationCompilationIntegrityResult => {
  const parsed = GeneratedCategoricalObservationCompilationArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== GENERATED_CATEGORICAL_OBSERVATION_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported generated categorical-observation compiler ${artifact.compilerVersion}.`,
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
  const profile = artifact.compileRequest.generationProfiles.find(
    (candidate) =>
      candidate.id === artifact.selectedProfileRef.id &&
      candidate.contentVersion === artifact.selectedProfileRef.contentVersion,
  )!;
  const valueOption = profile.valueOptions.find(
    (candidate) => candidate.id === artifact.selectedValueOptionRef.id,
  )!;
  if (
    artifact.observationDefinitionRef.fingerprint !==
    fingerprint('observation-definition', artifact.compileRequest.observationDefinition)
  ) {
    return {
      ok: false,
      error: {
        code: 'OBSERVATION_DEFINITION_FINGERPRINT_MISMATCH',
        message: 'Generated categorical-observation definition fingerprint mismatch.',
      },
    };
  }
  if (artifact.selectedProfileRef.fingerprint !== fingerprint('generation-profile', profile)) {
    return {
      ok: false,
      error: {
        code: 'GENERATION_PROFILE_FINGERPRINT_MISMATCH',
        message: 'Generated categorical-observation profile fingerprint mismatch.',
      },
    };
  }
  if (artifact.selectedValueOptionRef.fingerprint !== fingerprint('value-option', valueOption)) {
    return {
      ok: false,
      error: {
        code: 'VALUE_OPTION_FINGERPRINT_MISMATCH',
        message: 'Generated categorical-observation value-option fingerprint mismatch.',
      },
    };
  }
  if (artifact.inputFingerprint !== fingerprint('input', artifact.compileRequest)) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: 'Generated categorical-observation input fingerprint mismatch.',
      },
    };
  }
  if (artifact.payloadFingerprint !== fingerprint('payload', artifactPayload(artifact))) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: 'Generated categorical-observation payload fingerprint mismatch.',
      },
    };
  }
  const replay = compileGeneratedCategoricalObservation(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: replay.ok
          ? 'Generated categorical-observation replay differs from the frozen artifact.'
          : replay.error.message,
      },
    };
  }
  return { ok: true, value: artifact };
};
