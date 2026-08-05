import {
  PatientTemplateClinicalResultResourceCoverageArtifactSchema,
  PatientTemplateClinicalResultResourceCoverageRequestSchema,
  type PatientClinicalResultResourceKind,
  type PatientClinicalResultResourceRequirement,
  type PatientClinicalResultResourceSet,
  type PatientTemplateClinicalResultRecipe,
  type PatientTemplateClinicalResultRecipeResourceMemberCoverage,
  type PatientTemplateClinicalResultResourceCoverageArtifact,
  type PatientTemplateClinicalResultResourceCoverageFingerprint,
  type PatientTemplateClinicalResultResourceCoverageRequest,
} from '@psychsim/schemas';

import { verifyPatientTemplateClinicalResultRecipeHorizonIntegrity } from './patient-template-clinical-result-recipe-horizon-compiler';

export const PATIENT_TEMPLATE_CLINICAL_RESULT_RESOURCE_COVERAGE_COMPILER_VERSION = '3.0.0';

export type PatientTemplateClinicalResultResourceCoverageCompilationResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateClinicalResultResourceCoverageArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_REQUEST' | 'RECIPE_HORIZON_INVALID' | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type PatientTemplateClinicalResultResourceCoverageIntegrityResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateClinicalResultResourceCoverageArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'RECIPE_HORIZON_INVALID'
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
): PatientTemplateClinicalResultResourceCoverageFingerprint =>
  `fingerprint.patient-template-clinical-result-resource-coverage.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const sortById = <Entry extends { readonly id: string }>(entries: readonly Entry[]): Entry[] =>
  [...entries].sort((left, right) => compareStrings(left.id, right.id));

const normalizeResourceSet = (
  resourceSet: PatientClinicalResultResourceSet,
): PatientClinicalResultResourceSet => ({
  ...resourceSet,
  testDefinitions: sortById(resourceSet.testDefinitions),
  referenceIntervalSets: sortById(resourceSet.referenceIntervalSets),
  patientOwnedTestResultProfiles: sortById(resourceSet.patientOwnedTestResultProfiles),
  measurementDefinitions: sortById(resourceSet.measurementDefinitions),
  patientOwnedMeasurementValueProfiles: sortById(resourceSet.patientOwnedMeasurementValueProfiles),
  generatedMeasurementValueProfiles: sortById(resourceSet.generatedMeasurementValueProfiles),
  categoricalObservationDefinitions: sortById(resourceSet.categoricalObservationDefinitions),
  patientOwnedCategoricalObservationValueProfiles: sortById(
    resourceSet.patientOwnedCategoricalObservationValueProfiles,
  ),
  generatedCategoricalObservationValueProfiles: sortById(
    resourceSet.generatedCategoricalObservationValueProfiles,
  ),
  bodyMassIndexDerivationDefinitions: sortById(resourceSet.bodyMassIndexDerivationDefinitions),
  sourceDefinitionCatalog: {
    ...resourceSet.sourceDefinitionCatalog,
    definitions: sortById(resourceSet.sourceDefinitionCatalog.definitions),
  },
});

const normalizeRequest = (
  request: PatientTemplateClinicalResultResourceCoverageRequest,
): PatientTemplateClinicalResultResourceCoverageRequest =>
  PatientTemplateClinicalResultResourceCoverageRequestSchema.parse({
    ...request,
    resourceSet: normalizeResourceSet(request.resourceSet),
  });

type ExactResource = { readonly id: string; readonly contentVersion: string };

const requirement = (
  kind: PatientClinicalResultResourceKind,
  requestedId: string,
  requestedContentVersion: string | null,
  entries: readonly ExactResource[],
): PatientClinicalResultResourceRequirement => {
  const resolved = entries.find(
    (entry) =>
      entry.id === requestedId &&
      (requestedContentVersion === null || entry.contentVersion === requestedContentVersion),
  );
  return {
    kind,
    requestedId,
    requestedContentVersion,
    status: resolved === undefined ? 'missing' : 'resolved',
    resolvedContentVersion: resolved?.contentVersion ?? null,
  };
};

const requirementSortKey = (value: PatientClinicalResultResourceRequirement): string =>
  `${value.kind}\u0000${value.requestedId}\u0000${value.requestedContentVersion ?? ''}`;

const coverageForRecipeMember = (
  member:
    | PatientTemplateClinicalResultRecipe['directMembers'][number]
    | PatientTemplateClinicalResultRecipe['derivedMeasurements'][number],
  resources: PatientClinicalResultResourceSet,
): PatientTemplateClinicalResultRecipeResourceMemberCoverage => {
  const sourceDefinitions = resources.sourceDefinitionCatalog.definitions;
  let requirements: PatientClinicalResultResourceRequirement[];
  switch (member.kind) {
    case 'generated_numeric_test': {
      const testDefinition = resources.testDefinitions.find(
        (definition) =>
          definition.id === member.testDefinitionRef.id &&
          definition.contentVersion === member.testDefinitionRef.contentVersion,
      );
      const intervalIds =
        testDefinition?.generator.type === 'numeric_panel'
          ? [
              ...new Set(
                testDefinition.generator.profiles.map((profile) => profile.referenceIntervalSetId),
              ),
            ]
          : [];
      requirements = [
        requirement(
          'test_definition',
          member.testDefinitionRef.id,
          member.testDefinitionRef.contentVersion,
          resources.testDefinitions,
        ),
        requirement(
          'patient_scene_source_definition',
          member.sourceDefinitionRef.id,
          member.sourceDefinitionRef.contentVersion,
          sourceDefinitions,
        ),
        ...intervalIds.map((id) =>
          requirement('reference_interval_set', id, null, resources.referenceIntervalSets),
        ),
      ];
      break;
    }
    case 'patient_owned_test':
      requirements = [
        requirement(
          'test_definition',
          member.testDefinitionRef.id,
          member.testDefinitionRef.contentVersion,
          resources.testDefinitions,
        ),
        requirement(
          'patient_owned_test_result_profile',
          member.resultProfileRef.id,
          member.resultProfileRef.contentVersion,
          resources.patientOwnedTestResultProfiles,
        ),
        requirement(
          'patient_scene_source_definition',
          member.sourceDefinitionRef.id,
          member.sourceDefinitionRef.contentVersion,
          sourceDefinitions,
        ),
      ];
      break;
    case 'measurement':
      requirements = [
        requirement(
          'measurement_definition',
          member.measurementDefinitionRef.id,
          member.measurementDefinitionRef.contentVersion,
          resources.measurementDefinitions,
        ),
        requirement(
          'patient_owned_measurement_value_profile',
          member.valueProfileRef.id,
          member.valueProfileRef.contentVersion,
          resources.patientOwnedMeasurementValueProfiles,
        ),
        requirement(
          'patient_scene_source_definition',
          member.sourceDefinitionRef.id,
          member.sourceDefinitionRef.contentVersion,
          sourceDefinitions,
        ),
      ];
      break;
    case 'generated_measurement':
      requirements = [
        requirement(
          'measurement_definition',
          member.measurementDefinitionRef.id,
          member.measurementDefinitionRef.contentVersion,
          resources.measurementDefinitions,
        ),
        ...member.generationProfileRefs.map((reference) =>
          requirement(
            'generated_measurement_value_profile',
            reference.id,
            reference.contentVersion,
            resources.generatedMeasurementValueProfiles,
          ),
        ),
        requirement(
          'patient_scene_source_definition',
          member.sourceDefinitionRef.id,
          member.sourceDefinitionRef.contentVersion,
          sourceDefinitions,
        ),
      ];
      break;
    case 'categorical_observation':
      requirements = [
        requirement(
          'categorical_observation_definition',
          member.observationDefinitionRef.id,
          member.observationDefinitionRef.contentVersion,
          resources.categoricalObservationDefinitions,
        ),
        requirement(
          'patient_owned_categorical_observation_value_profile',
          member.valueProfileRef.id,
          member.valueProfileRef.contentVersion,
          resources.patientOwnedCategoricalObservationValueProfiles,
        ),
        requirement(
          'patient_scene_source_definition',
          member.sourceDefinitionRef.id,
          member.sourceDefinitionRef.contentVersion,
          sourceDefinitions,
        ),
      ];
      break;
    case 'generated_categorical_observation':
      requirements = [
        requirement(
          'categorical_observation_definition',
          member.observationDefinitionRef.id,
          member.observationDefinitionRef.contentVersion,
          resources.categoricalObservationDefinitions,
        ),
        ...member.generationProfileRefs.map((reference) =>
          requirement(
            'generated_categorical_observation_value_profile',
            reference.id,
            reference.contentVersion,
            resources.generatedCategoricalObservationValueProfiles,
          ),
        ),
        requirement(
          'patient_scene_source_definition',
          member.sourceDefinitionRef.id,
          member.sourceDefinitionRef.contentVersion,
          sourceDefinitions,
        ),
      ];
      break;
    case 'body_mass_index':
      requirements = [
        requirement(
          'body_mass_index_derivation_definition',
          member.derivationDefinitionRef.id,
          member.derivationDefinitionRef.contentVersion,
          resources.bodyMassIndexDerivationDefinitions,
        ),
        requirement(
          'measurement_definition',
          member.outputMeasurementDefinitionRef.id,
          member.outputMeasurementDefinitionRef.contentVersion,
          resources.measurementDefinitions,
        ),
      ];
      break;
  }
  requirements.sort((left, right) =>
    compareStrings(requirementSortKey(left), requirementSortKey(right)),
  );
  return {
    recipeMemberId: member.id,
    recipeMemberKind: member.kind,
    coverageStatus: requirements.some((entry) => entry.status === 'missing')
      ? 'missing_resources'
      : 'complete',
    requirements,
  };
};

const artifactPayload = (
  artifact: Omit<
    PatientTemplateClinicalResultResourceCoverageArtifact,
    'id' | 'payloadFingerprint'
  >,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  coverageStatus: artifact.coverageStatus,
  recipeHorizonRef: artifact.recipeHorizonRef,
  resourceSetRef: artifact.resourceSetRef,
  templateCoverage: artifact.templateCoverage,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const compilePatientTemplateClinicalResultResourceCoverage = (
  input: unknown,
): PatientTemplateClinicalResultResourceCoverageCompilationResult => {
  const parsed = PatientTemplateClinicalResultResourceCoverageRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: issuesText(parsed.error.issues),
        contentIds: [],
      },
    };
  }
  const request = normalizeRequest(parsed.data);
  const horizonIntegrity = verifyPatientTemplateClinicalResultRecipeHorizonIntegrity(
    request.recipeHorizonArtifact,
  );
  if (!horizonIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'RECIPE_HORIZON_INVALID',
        message: `${horizonIntegrity.error.code}: ${horizonIntegrity.error.message}`,
        contentIds: [request.recipeHorizonArtifact.id],
      },
    };
  }
  const horizon = horizonIntegrity.value;
  const templateCoverage = horizon.members.map((member) => {
    if (member.recipeRef === null) {
      return {
        templateRef: member.templateRef,
        templateFingerprint: member.templateFingerprint,
        recipeRef: null,
        coverageStatus: 'recipe_missing' as const,
        memberCoverage: [],
      };
    }
    const recipe = horizon.recipes.find(
      (candidate) =>
        candidate.id === member.recipeRef?.id &&
        candidate.contentVersion === member.recipeRef.contentVersion,
    );
    if (recipe === undefined) {
      return {
        templateRef: member.templateRef,
        templateFingerprint: member.templateFingerprint,
        recipeRef: null,
        coverageStatus: 'recipe_missing' as const,
        memberCoverage: [],
      };
    }
    const memberCoverage = [...recipe.directMembers, ...recipe.derivedMeasurements]
      .map((recipeMember) => coverageForRecipeMember(recipeMember, request.resourceSet))
      .sort((left, right) => compareStrings(left.recipeMemberId, right.recipeMemberId));
    return {
      templateRef: member.templateRef,
      templateFingerprint: member.templateFingerprint,
      recipeRef: {
        id: recipe.id,
        contentVersion: recipe.contentVersion,
      },
      coverageStatus: memberCoverage.some(
        (coverage) => coverage.coverageStatus === 'missing_resources',
      )
        ? ('missing_resources' as const)
        : ('complete' as const),
      memberCoverage,
    };
  });
  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_TEMPLATE_CLINICAL_RESULT_RESOURCE_COVERAGE_COMPILER_VERSION,
    requestId: request.id,
    coverageStatus: templateCoverage.some((coverage) => coverage.coverageStatus !== 'complete')
      ? ('incomplete' as const)
      : ('complete' as const),
    recipeHorizonRef: {
      id: horizon.id,
      inputFingerprint: horizon.inputFingerprint,
      payloadFingerprint: horizon.payloadFingerprint,
    },
    resourceSetRef: {
      id: request.resourceSet.id,
      contentVersion: request.resourceSet.contentVersion,
    },
    templateCoverage,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = PatientTemplateClinicalResultResourceCoverageArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `patient-template-clinical-result-resource-coverage.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(output.error.issues),
        contentIds: [request.id, horizon.id, request.resourceSet.id],
      },
    };
  }
  return { ok: true, value: output.data };
};

export const verifyPatientTemplateClinicalResultResourceCoverageIntegrity = (
  input: unknown,
): PatientTemplateClinicalResultResourceCoverageIntegrityResult => {
  const parsed = PatientTemplateClinicalResultResourceCoverageArtifactSchema.safeParse(input);
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
  if (
    artifact.compilerVersion !== PATIENT_TEMPLATE_CLINICAL_RESULT_RESOURCE_COVERAGE_COMPILER_VERSION
  ) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported resource-coverage compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const horizonIntegrity = verifyPatientTemplateClinicalResultRecipeHorizonIntegrity(
    artifact.compileRequest.recipeHorizonArtifact,
  );
  if (!horizonIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'RECIPE_HORIZON_INVALID',
        message: `${horizonIntegrity.error.code}: ${horizonIntegrity.error.message}`,
      },
    };
  }
  if (artifact.inputFingerprint !== fingerprint('input', artifact.compileRequest)) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact normalized coverage request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `patient-template-clinical-result-resource-coverage.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its exact resource-coverage payload.`,
      },
    };
  }
  const replay = compilePatientTemplateClinicalResultResourceCoverage(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: replay.ok
          ? `${artifact.id} does not equal deterministic replay.`
          : replay.error.message,
      },
    };
  }
  return { ok: true, value: artifact };
};
