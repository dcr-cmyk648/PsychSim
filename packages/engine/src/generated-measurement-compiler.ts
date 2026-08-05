import {
  GeneratedMeasurementCompilationArtifactSchema,
  GeneratedMeasurementCompilationRequestSchema,
  MeasurementResolutionEnvelopeSchema,
  ResolvedMeasurementSchema,
  type GeneratedMeasurementCompilationArtifact,
  type GeneratedMeasurementCompilationFingerprint,
  type GeneratedMeasurementCompilationRequest,
  type GeneratedMeasurementValueBand,
  type GeneratedMeasurementValueProfile,
  type NumericStructuredTestGenerationContext,
} from '@psychsim/schemas';

import { verifyCatalogPatientSceneSourceInstanceCompilationIntegrity } from './catalog-patient-scene-source-instance-compiler';
import { seededUnit } from './rng';

export const GENERATED_MEASUREMENT_COMPILER_VERSION = '1.0.0';

export type GeneratedMeasurementCompilationResult =
  | {
      readonly ok: true;
      readonly value: GeneratedMeasurementCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'SOURCE_INSTANCE_COMPILATION_INVALID'
          | 'NO_MATCHING_PROFILE'
          | 'SOURCE_INSTANCE_NOT_FOUND'
          | 'MEASUREMENT_CONTRACT_MISMATCH'
          | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type GeneratedMeasurementCompilationIntegrityResult =
  | {
      readonly ok: true;
      readonly value: GeneratedMeasurementCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'SOURCE_INSTANCE_COMPILATION_INVALID'
          | 'MEASUREMENT_DEFINITION_FINGERPRINT_MISMATCH'
          | 'GENERATION_PROFILE_FINGERPRINT_MISMATCH'
          | 'VALUE_BAND_FINGERPRINT_MISMATCH'
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

const fingerprint = (scope: string, value: unknown): GeneratedMeasurementCompilationFingerprint =>
  `fingerprint.generated-measurement-compilation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const normalizeProfile = (
  profile: GeneratedMeasurementValueProfile,
): GeneratedMeasurementValueProfile => ({
  ...profile,
  when: {
    ...profile.when,
    anyDiagnosisIds: [...profile.when.anyDiagnosisIds].sort(compareStrings),
    allClinicalTagIds: [...profile.when.allClinicalTagIds].sort(compareStrings),
  },
  valueBands: [...profile.valueBands].sort((left, right) => compareStrings(left.id, right.id)),
  contextValues: [...profile.contextValues].sort(
    (left, right) =>
      compareStrings(left.dimensionId, right.dimensionId) ||
      compareStrings(left.valueId, right.valueId),
  ),
  sourceUseNoteIds: [...profile.sourceUseNoteIds].sort(compareStrings),
  review: {
    ...profile.review,
    sourceUseNoteIds: [...profile.review.sourceUseNoteIds].sort(compareStrings),
  },
});

const normalizeRequest = (
  request: GeneratedMeasurementCompilationRequest,
): GeneratedMeasurementCompilationRequest => ({
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
  profile: GeneratedMeasurementValueProfile,
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

export const resolveGeneratedMeasurementProfile = (
  profiles: readonly GeneratedMeasurementValueProfile[],
  context: NumericStructuredTestGenerationContext,
): GeneratedMeasurementValueProfile | null =>
  [...profiles]
    .filter((profile) => profileMatches(profile, context))
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        compareStrings(left.id, right.id) ||
        compareStrings(left.contentVersion, right.contentVersion),
    )[0] ?? null;

const stableDrawId = (
  purpose: 'value-band' | 'value',
  request: GeneratedMeasurementCompilationRequest,
  profile: GeneratedMeasurementValueProfile,
): string =>
  `stable-draw.generated-measurement.${purpose}.${hashToHex64(
    JSON.stringify(
      canonicalizeObjectKeys({
        patientStateId: request.patientStateId,
        measurementDefinitionId: request.measurementDefinition.id,
        measurementDefinitionContentVersion: request.measurementDefinition.contentVersion,
        generationProfileId: profile.id,
        generationProfileContentVersion: profile.contentVersion,
        timeScopeId: request.timeScopeId,
        seed: request.seed,
      }),
    ),
  )}`;

const selectValueBand = (
  profile: GeneratedMeasurementValueProfile,
  unit: number,
): GeneratedMeasurementValueBand => {
  const totalWeight = profile.valueBands.reduce(
    (sum, candidate) => sum + candidate.relativeWeight,
    0,
  );
  let cursor = unit * totalWeight;
  for (const candidate of profile.valueBands) {
    cursor -= candidate.relativeWeight;
    if (cursor < 0) return candidate;
  }
  return profile.valueBands.at(-1)!;
};

const roundTo = (value: number, decimals: number): number => {
  const scale = 10 ** decimals;
  const rounded = Math.round(value * scale) / scale;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const generatedMeasurementId = (
  request: GeneratedMeasurementCompilationRequest,
  profile: GeneratedMeasurementValueProfile,
): string =>
  `resolved-measurement.generated.${hashToHex64(
    JSON.stringify(
      canonicalizeObjectKeys({
        patientStateId: request.patientStateId,
        measurementDefinitionId: request.measurementDefinition.id,
        measurementDefinitionContentVersion: request.measurementDefinition.contentVersion,
        generationProfileId: profile.id,
        generationProfileContentVersion: profile.contentVersion,
        timeScopeId: request.timeScopeId,
        seed: request.seed,
      }),
    ),
  )}`;

const artifactPayload = (
  artifact: Omit<GeneratedMeasurementCompilationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  measurementDefinitionRef: artifact.measurementDefinitionRef,
  selectedProfileRef: artifact.selectedProfileRef,
  selectedValueBandRef: artifact.selectedValueBandRef,
  generationDraws: artifact.generationDraws,
  sourceInstanceRef: artifact.sourceInstanceRef,
  resolvedMeasurement: artifact.resolvedMeasurement,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const compileGeneratedMeasurement = (
  input: unknown,
): GeneratedMeasurementCompilationResult => {
  const parsed = GeneratedMeasurementCompilationRequestSchema.safeParse(input);
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
  const profile = resolveGeneratedMeasurementProfile(
    request.generationProfiles,
    request.generationContext,
  );
  if (profile === null) {
    return {
      ok: false,
      error: {
        code: 'NO_MATCHING_PROFILE',
        message: `${request.measurementDefinition.id} has no measurement-generation profile for the supplied patient context.`,
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

  const valueBandStableDrawId = stableDrawId('value-band', request, profile);
  const valueStableDrawId = stableDrawId('value', request, profile);
  const selectedValueBand = selectValueBand(
    profile,
    seededUnit(request.seed, valueBandStableDrawId),
  );
  const rawValue =
    selectedValueBand.minimum +
    seededUnit(request.seed, valueStableDrawId) *
      (selectedValueBand.maximum - selectedValueBand.minimum);
  const value = roundTo(rawValue, request.measurementDefinition.unit.displayPrecision);
  const displayValue = value.toFixed(request.measurementDefinition.unit.displayPrecision);

  const resolvedMeasurement = ResolvedMeasurementSchema.safeParse({
    schemaVersion: 1,
    id: generatedMeasurementId(request, profile),
    definitionId: request.measurementDefinition.id,
    definitionContentVersion: request.measurementDefinition.contentVersion,
    value,
    displayValue,
    unit: {
      display: request.measurementDefinition.unit.display,
      ucumCode: request.measurementDefinition.unit.ucumCode,
    },
    contextValues: profile.contextValues,
    timeScopeId: request.timeScopeId,
    source: {
      kind: 'measurement',
      sourceInstanceId: sourceInstance.id,
    },
    interpretation: {
      kind: 'not_interpreted',
    },
    resolution: {
      origin: 'deterministic_generation',
      generationProfileId: profile.id,
      generationProfileContentVersion: profile.contentVersion,
      resolverVersion: GENERATED_MEASUREMENT_COMPILER_VERSION,
      stableDrawId: valueStableDrawId,
    },
  });
  if (!resolvedMeasurement.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(resolvedMeasurement.error.issues),
      },
    };
  }
  const envelope = MeasurementResolutionEnvelopeSchema.safeParse({
    definition: request.measurementDefinition,
    resolved: resolvedMeasurement.data,
  });
  if (!envelope.success) {
    return {
      ok: false,
      error: {
        code: 'MEASUREMENT_CONTRACT_MISMATCH',
        message: issuesText(envelope.error.issues),
      },
    };
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: GENERATED_MEASUREMENT_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: request.patientStateId,
    measurementDefinitionRef: {
      id: request.measurementDefinition.id,
      contentVersion: request.measurementDefinition.contentVersion,
      fingerprint: fingerprint('measurement-definition', request.measurementDefinition),
    },
    selectedProfileRef: {
      id: profile.id,
      contentVersion: profile.contentVersion,
      fingerprint: fingerprint('generation-profile', profile),
    },
    selectedValueBandRef: {
      id: selectedValueBand.id,
      fingerprint: fingerprint('value-band', selectedValueBand),
    },
    generationDraws: {
      valueBandStableDrawId,
      valueStableDrawId,
    },
    sourceInstanceRef: {
      id: sourceInstance.id,
      kind: 'measurement' as const,
      definitionRef: sourceInstance.definitionRef,
    },
    resolvedMeasurement: resolvedMeasurement.data,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = GeneratedMeasurementCompilationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `generated-measurement-compilation.${payloadFingerprint.slice(-16)}`,
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

export const verifyGeneratedMeasurementCompilationIntegrity = (
  input: unknown,
): GeneratedMeasurementCompilationIntegrityResult => {
  const parsed = GeneratedMeasurementCompilationArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== GENERATED_MEASUREMENT_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported generated-measurement compiler ${artifact.compilerVersion}.`,
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
  const valueBand = profile.valueBands.find(
    (candidate) => candidate.id === artifact.selectedValueBandRef.id,
  )!;
  if (
    artifact.measurementDefinitionRef.fingerprint !==
    fingerprint('measurement-definition', artifact.compileRequest.measurementDefinition)
  ) {
    return {
      ok: false,
      error: {
        code: 'MEASUREMENT_DEFINITION_FINGERPRINT_MISMATCH',
        message: 'Generated measurement definition fingerprint mismatch.',
      },
    };
  }
  if (artifact.selectedProfileRef.fingerprint !== fingerprint('generation-profile', profile)) {
    return {
      ok: false,
      error: {
        code: 'GENERATION_PROFILE_FINGERPRINT_MISMATCH',
        message: 'Generated measurement profile fingerprint mismatch.',
      },
    };
  }
  if (artifact.selectedValueBandRef.fingerprint !== fingerprint('value-band', valueBand)) {
    return {
      ok: false,
      error: {
        code: 'VALUE_BAND_FINGERPRINT_MISMATCH',
        message: 'Generated measurement value-band fingerprint mismatch.',
      },
    };
  }
  if (artifact.inputFingerprint !== fingerprint('input', artifact.compileRequest)) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: 'Generated measurement input fingerprint mismatch.',
      },
    };
  }
  if (artifact.payloadFingerprint !== fingerprint('payload', artifactPayload(artifact))) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: 'Generated measurement payload fingerprint mismatch.',
      },
    };
  }
  const replay = compileGeneratedMeasurement(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: replay.ok
          ? 'Generated measurement replay differs from the frozen artifact.'
          : replay.error.message,
      },
    };
  }
  return { ok: true, value: artifact };
};
