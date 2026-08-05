import {
  PatientTemplateClinicalResultMaterializationArtifactSchema,
  PatientTemplateClinicalResultMaterializationRequestSchema,
  type BodyMassIndexMeasurementMaterializationArtifact,
  type GeneratedCategoricalObservationCompilationArtifact,
  type GeneratedMeasurementCompilationArtifact,
  type NumericStructuredTestResultCompilationArtifact,
  type PatientClinicalResultResourceSet,
  type PatientOwnedCategoricalObservationCompilationArtifact,
  type PatientOwnedMeasurementCompilationArtifact,
  type PatientOwnedStructuredTestResultCompilationArtifact,
  type PatientTemplate,
  type PatientTemplateClinicalResultMaterializationArtifact,
  type PatientTemplateClinicalResultMaterializationFingerprint,
  type PatientTemplateClinicalResultMaterializationRequest,
  type PatientTemplateClinicalResultRecipe,
  type PatientTemplateClinicalResultRecipeMember,
} from '@psychsim/schemas';

import { compileBodyMassIndexDerivation } from './body-mass-index-derivation-compiler';
import { materializeBodyMassIndexMeasurement } from './body-mass-index-measurement-materializer';
import { compileGeneratedCategoricalObservation } from './generated-categorical-observation-compiler';
import { compileGeneratedMeasurement } from './generated-measurement-compiler';
import { compileNumericStructuredTestResult } from './numeric-structured-test-result-compiler';
import { compilePatientClinicalResultCollection } from './patient-clinical-result-collection-compiler';
import { compilePatientOwnedCategoricalObservation } from './patient-owned-categorical-observation-compiler';
import { compilePatientOwnedMeasurement } from './patient-owned-measurement-compiler';
import { compilePatientOwnedStructuredTestResult } from './patient-owned-structured-test-result-compiler';
import {
  compilePatientTemplateClinicalResultRecipe,
  verifyPatientTemplateClinicalResultRecipeCompilationIntegrity,
} from './patient-template-clinical-result-recipe-compiler';
import { resolvePatientTemplateClinicalResultRecipeFromHorizon } from './patient-template-clinical-result-recipe-horizon-compiler';
import { verifyPatientTemplateClinicalResultMaterializationContextIntegrity } from './patient-template-clinical-result-materialization-context-compiler';

export const PATIENT_TEMPLATE_CLINICAL_RESULT_MATERIALIZATION_COMPILER_VERSION = '3.0.0';

export type PatientTemplateClinicalResultMaterializationCompilationResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateClinicalResultMaterializationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'MATERIALIZATION_CONTEXT_INVALID'
          | 'RECIPE_NOT_AVAILABLE'
          | 'RESOURCE_NOT_FOUND'
          | 'DIRECT_RESULT_COMPILATION_FAILED'
          | 'RESULT_COLLECTION_COMPILATION_FAILED'
          | 'DERIVATION_COMPILATION_FAILED'
          | 'DERIVED_MATERIALIZATION_FAILED'
          | 'RECIPE_COMPILATION_FAILED'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type PatientTemplateClinicalResultMaterializationIntegrityResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateClinicalResultMaterializationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'MATERIALIZATION_CONTEXT_INVALID'
          | 'RECIPE_COMPILATION_INVALID'
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
): PatientTemplateClinicalResultMaterializationFingerprint =>
  `fingerprint.patient-template-clinical-result-materialization.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: Exclude<
    PatientTemplateClinicalResultMaterializationCompilationResult,
    { readonly ok: true }
  >['error']['code'],
  message: string,
  contentIds: readonly string[] = [],
): PatientTemplateClinicalResultMaterializationCompilationResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

type ExactResource = { readonly id: string; readonly contentVersion: string };

const exactResource = <Entry extends ExactResource>(
  entries: readonly Entry[],
  reference: ExactResource,
): Entry | undefined =>
  entries.find(
    (entry) => entry.id === reference.id && entry.contentVersion === reference.contentVersion,
  );

const selectedTemplate = (
  request: PatientTemplateClinicalResultMaterializationRequest,
): PatientTemplate =>
  request.materializationContextArtifact.compileRequest.patientSlotFillSeedAuthorityArtifact
    .locationTemplateSelectionArtifact.locationOwnedPatientSlotSelectionArtifact
    .admittedTemplateLocationBindingArtifact.template;

const requestId = (kind: string, contextId: string, memberId: string): string =>
  `${kind}-request.materialization.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys({ contextId, memberId })),
  )}`;

const artifactPayload = (
  artifact: Omit<PatientTemplateClinicalResultMaterializationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  materializationContextRef: artifact.materializationContextRef,
  templateClinicalResultRecipeCompilationRef: artifact.templateClinicalResultRecipeCompilationRef,
  templateClinicalResultRecipeCompilation: artifact.templateClinicalResultRecipeCompilation,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

type DirectCompilationSet = {
  readonly numericStructuredTestCompilations: NumericStructuredTestResultCompilationArtifact[];
  readonly patientOwnedStructuredTestCompilations: PatientOwnedStructuredTestResultCompilationArtifact[];
  readonly measurementCompilations: (
    | PatientOwnedMeasurementCompilationArtifact
    | GeneratedMeasurementCompilationArtifact
  )[];
  readonly categoricalObservationCompilations: (
    | PatientOwnedCategoricalObservationCompilationArtifact
    | GeneratedCategoricalObservationCompilationArtifact
  )[];
  readonly measurementCompilationsByRecipeMemberId: ReadonlyMap<
    string,
    PatientOwnedMeasurementCompilationArtifact | GeneratedMeasurementCompilationArtifact
  >;
};

const compileDirectMembers = (input: {
  readonly context: PatientTemplateClinicalResultMaterializationRequest['materializationContextArtifact'];
  readonly recipe: PatientTemplateClinicalResultRecipe;
  readonly resources: PatientClinicalResultResourceSet;
}):
  | { readonly ok: true; readonly value: DirectCompilationSet }
  | {
      readonly ok: false;
      readonly code: 'RESOURCE_NOT_FOUND' | 'DIRECT_RESULT_COMPILATION_FAILED';
      readonly message: string;
      readonly contentIds: readonly string[];
    } => {
  const { context, recipe, resources } = input;
  const numericStructuredTestCompilations: NumericStructuredTestResultCompilationArtifact[] = [];
  const patientOwnedStructuredTestCompilations: PatientOwnedStructuredTestResultCompilationArtifact[] =
    [];
  const measurementCompilations: (
    | PatientOwnedMeasurementCompilationArtifact
    | GeneratedMeasurementCompilationArtifact
  )[] = [];
  const categoricalObservationCompilations: (
    | PatientOwnedCategoricalObservationCompilationArtifact
    | GeneratedCategoricalObservationCompilationArtifact
  )[] = [];
  const measurementCompilationsByRecipeMemberId = new Map<
    string,
    PatientOwnedMeasurementCompilationArtifact | GeneratedMeasurementCompilationArtifact
  >();

  for (const member of recipe.directMembers) {
    switch (member.kind) {
      case 'generated_numeric_test': {
        const testDefinition = exactResource(resources.testDefinitions, member.testDefinitionRef);
        if (testDefinition === undefined) {
          return {
            ok: false,
            code: 'RESOURCE_NOT_FOUND',
            message: `${member.id} is missing exact test ${member.testDefinitionRef.id}@${member.testDefinitionRef.contentVersion}.`,
            contentIds: [member.id, member.testDefinitionRef.id],
          };
        }
        const referenceIntervalIds =
          testDefinition.generator.type === 'numeric_panel'
            ? uniqueSorted(
                testDefinition.generator.profiles.map((profile) => profile.referenceIntervalSetId),
              )
            : [];
        const referenceIntervalSets = referenceIntervalIds.flatMap((id) => {
          const definition = resources.referenceIntervalSets.find((entry) => entry.id === id);
          return definition === undefined ? [] : [definition];
        });
        if (referenceIntervalSets.length !== referenceIntervalIds.length) {
          return {
            ok: false,
            code: 'RESOURCE_NOT_FOUND',
            message: `${member.id} is missing one or more referenced interval sets.`,
            contentIds: [member.id, ...referenceIntervalIds],
          };
        }
        const compiled = compileNumericStructuredTestResult({
          schemaVersion: 1,
          id: requestId('numeric-structured-test-result', context.id, member.id),
          patientStateId: context.patientStateId,
          seed: context.patientGenerationSeed,
          testDefinition,
          generationContext: context.generationContext,
          referenceIntervalSets,
          sourceDefinitionRef: member.sourceDefinitionRef,
          sourceInstanceCompilation: context.sourceInstanceCompilation,
          timeScopeId: member.timeScopeId,
        });
        if (!compiled.ok) {
          return {
            ok: false,
            code: 'DIRECT_RESULT_COMPILATION_FAILED',
            message: `${member.id}: ${compiled.error.code}: ${compiled.error.message}`,
            contentIds: [member.id, testDefinition.id],
          };
        }
        numericStructuredTestCompilations.push(compiled.value);
        break;
      }
      case 'patient_owned_test': {
        const testDefinition = exactResource(resources.testDefinitions, member.testDefinitionRef);
        const resultProfile = exactResource(
          resources.patientOwnedTestResultProfiles,
          member.resultProfileRef,
        );
        if (testDefinition === undefined || resultProfile === undefined) {
          return {
            ok: false,
            code: 'RESOURCE_NOT_FOUND',
            message: `${member.id} is missing its exact patient-owned test definition or result profile.`,
            contentIds: [member.id, member.testDefinitionRef.id, member.resultProfileRef.id],
          };
        }
        const compiled = compilePatientOwnedStructuredTestResult({
          schemaVersion: 1,
          id: requestId('patient-owned-structured-test-result', context.id, member.id),
          patientStateId: context.patientStateId,
          testDefinition,
          resultProfile,
          sourceDefinitionRef: member.sourceDefinitionRef,
          sourceInstanceCompilation: context.sourceInstanceCompilation,
          timeScopeId: member.timeScopeId,
        });
        if (!compiled.ok) {
          return {
            ok: false,
            code: 'DIRECT_RESULT_COMPILATION_FAILED',
            message: `${member.id}: ${compiled.error.code}: ${compiled.error.message}`,
            contentIds: [member.id, testDefinition.id, resultProfile.id],
          };
        }
        patientOwnedStructuredTestCompilations.push(compiled.value);
        break;
      }
      case 'measurement': {
        const measurementDefinition = exactResource(
          resources.measurementDefinitions,
          member.measurementDefinitionRef,
        );
        const valueProfile = exactResource(
          resources.patientOwnedMeasurementValueProfiles,
          member.valueProfileRef,
        );
        if (measurementDefinition === undefined || valueProfile === undefined) {
          return {
            ok: false,
            code: 'RESOURCE_NOT_FOUND',
            message: `${member.id} is missing its exact measurement definition or value profile.`,
            contentIds: [member.id, member.measurementDefinitionRef.id, member.valueProfileRef.id],
          };
        }
        const compiled = compilePatientOwnedMeasurement({
          schemaVersion: 1,
          id: requestId('patient-owned-measurement', context.id, member.id),
          patientStateId: context.patientStateId,
          measurementDefinition,
          valueProfile,
          sourceDefinitionRef: member.sourceDefinitionRef,
          sourceInstanceCompilation: context.sourceInstanceCompilation,
          timeScopeId: member.timeScopeId,
        });
        if (!compiled.ok) {
          return {
            ok: false,
            code: 'DIRECT_RESULT_COMPILATION_FAILED',
            message: `${member.id}: ${compiled.error.code}: ${compiled.error.message}`,
            contentIds: [member.id, measurementDefinition.id, valueProfile.id],
          };
        }
        measurementCompilations.push(compiled.value);
        measurementCompilationsByRecipeMemberId.set(member.id, compiled.value);
        break;
      }
      case 'generated_measurement': {
        const measurementDefinition = exactResource(
          resources.measurementDefinitions,
          member.measurementDefinitionRef,
        );
        const generationProfiles = member.generationProfileRefs.flatMap((reference) => {
          const profile = exactResource(resources.generatedMeasurementValueProfiles, reference);
          return profile === undefined ? [] : [profile];
        });
        if (
          measurementDefinition === undefined ||
          generationProfiles.length !== member.generationProfileRefs.length
        ) {
          return {
            ok: false,
            code: 'RESOURCE_NOT_FOUND',
            message: `${member.id} is missing its exact measurement definition or generation-profile horizon.`,
            contentIds: [
              member.id,
              member.measurementDefinitionRef.id,
              ...member.generationProfileRefs.map((reference) => reference.id),
            ],
          };
        }
        const compiled = compileGeneratedMeasurement({
          schemaVersion: 1,
          id: requestId('generated-measurement', context.id, member.id),
          patientStateId: context.patientStateId,
          seed: context.patientGenerationSeed,
          measurementDefinition,
          generationContext: context.generationContext,
          generationProfiles,
          sourceDefinitionRef: member.sourceDefinitionRef,
          sourceInstanceCompilation: context.sourceInstanceCompilation,
          timeScopeId: member.timeScopeId,
        });
        if (!compiled.ok) {
          return {
            ok: false,
            code: 'DIRECT_RESULT_COMPILATION_FAILED',
            message: `${member.id}: ${compiled.error.code}: ${compiled.error.message}`,
            contentIds: [
              member.id,
              measurementDefinition.id,
              ...generationProfiles.map((profile) => profile.id),
            ],
          };
        }
        measurementCompilations.push(compiled.value);
        measurementCompilationsByRecipeMemberId.set(member.id, compiled.value);
        break;
      }
      case 'categorical_observation': {
        const observationDefinition = exactResource(
          resources.categoricalObservationDefinitions,
          member.observationDefinitionRef,
        );
        const valueProfile = exactResource(
          resources.patientOwnedCategoricalObservationValueProfiles,
          member.valueProfileRef,
        );
        if (observationDefinition === undefined || valueProfile === undefined) {
          return {
            ok: false,
            code: 'RESOURCE_NOT_FOUND',
            message: `${member.id} is missing its exact categorical-observation definition or value profile.`,
            contentIds: [member.id, member.observationDefinitionRef.id, member.valueProfileRef.id],
          };
        }
        const compiled = compilePatientOwnedCategoricalObservation({
          schemaVersion: 1,
          id: requestId('patient-owned-categorical-observation', context.id, member.id),
          patientStateId: context.patientStateId,
          observationDefinition,
          valueProfile,
          sourceDefinitionRef: member.sourceDefinitionRef,
          sourceInstanceCompilation: context.sourceInstanceCompilation,
          timeScopeId: member.timeScopeId,
        });
        if (!compiled.ok) {
          return {
            ok: false,
            code: 'DIRECT_RESULT_COMPILATION_FAILED',
            message: `${member.id}: ${compiled.error.code}: ${compiled.error.message}`,
            contentIds: [member.id, observationDefinition.id, valueProfile.id],
          };
        }
        categoricalObservationCompilations.push(compiled.value);
        break;
      }
      case 'generated_categorical_observation': {
        const observationDefinition = exactResource(
          resources.categoricalObservationDefinitions,
          member.observationDefinitionRef,
        );
        const generationProfiles = member.generationProfileRefs.flatMap((reference) => {
          const profile = exactResource(
            resources.generatedCategoricalObservationValueProfiles,
            reference,
          );
          return profile === undefined ? [] : [profile];
        });
        if (
          observationDefinition === undefined ||
          generationProfiles.length !== member.generationProfileRefs.length
        ) {
          return {
            ok: false,
            code: 'RESOURCE_NOT_FOUND',
            message: `${member.id} is missing its exact categorical-observation definition or generation-profile horizon.`,
            contentIds: [
              member.id,
              member.observationDefinitionRef.id,
              ...member.generationProfileRefs.map((reference) => reference.id),
            ],
          };
        }
        const compiled = compileGeneratedCategoricalObservation({
          schemaVersion: 1,
          id: requestId('generated-categorical-observation', context.id, member.id),
          patientStateId: context.patientStateId,
          seed: context.patientGenerationSeed,
          observationDefinition,
          generationContext: context.generationContext,
          generationProfiles,
          sourceDefinitionRef: member.sourceDefinitionRef,
          sourceInstanceCompilation: context.sourceInstanceCompilation,
          timeScopeId: member.timeScopeId,
        });
        if (!compiled.ok) {
          return {
            ok: false,
            code: 'DIRECT_RESULT_COMPILATION_FAILED',
            message: `${member.id}: ${compiled.error.code}: ${compiled.error.message}`,
            contentIds: [
              member.id,
              observationDefinition.id,
              ...generationProfiles.map((profile) => profile.id),
            ],
          };
        }
        categoricalObservationCompilations.push(compiled.value);
        break;
      }
    }
  }

  return {
    ok: true,
    value: {
      numericStructuredTestCompilations,
      patientOwnedStructuredTestCompilations,
      measurementCompilations,
      categoricalObservationCompilations,
      measurementCompilationsByRecipeMemberId,
    },
  };
};

const exactMeasurementMember = (
  recipe: PatientTemplateClinicalResultRecipe,
  memberId: string,
):
  | Extract<
      PatientTemplateClinicalResultRecipeMember,
      { readonly kind: 'measurement' | 'generated_measurement' }
    >
  | undefined => {
  const member = recipe.directMembers.find((candidate) => candidate.id === memberId);
  return member?.kind === 'measurement' || member?.kind === 'generated_measurement'
    ? member
    : undefined;
};

export const compilePatientTemplateClinicalResultMaterialization = (
  input: unknown,
): PatientTemplateClinicalResultMaterializationCompilationResult => {
  const parsed = PatientTemplateClinicalResultMaterializationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues));
  }
  const request = parsed.data;
  const contextIntegrity = verifyPatientTemplateClinicalResultMaterializationContextIntegrity(
    request.materializationContextArtifact,
  );
  if (!contextIntegrity.ok) {
    return fail(
      'MATERIALIZATION_CONTEXT_INVALID',
      `${contextIntegrity.error.code}: ${contextIntegrity.error.message}`,
      [request.materializationContextArtifact.id],
    );
  }
  const context = contextIntegrity.value;
  const coverage = context.compileRequest.resourceCoverageArtifact;
  const recipeHorizon = coverage.compileRequest.recipeHorizonArtifact;
  const recipeResolution = resolvePatientTemplateClinicalResultRecipeFromHorizon({
    artifact: recipeHorizon,
    templateRef: context.templateRef,
    templateFingerprint: context.templateFingerprint,
  });
  if (!recipeResolution.ok) {
    return fail(
      'RECIPE_NOT_AVAILABLE',
      `${recipeResolution.error.code}: ${recipeResolution.error.message}`,
      [context.templateRef.id, context.recipeRef.id],
    );
  }
  const recipe = recipeResolution.value.recipe;
  if (
    recipe.id !== context.recipeRef.id ||
    recipe.contentVersion !== context.recipeRef.contentVersion
  ) {
    return fail(
      'RECIPE_NOT_AVAILABLE',
      'The D-325 context and D-322 horizon resolve different exact recipes.',
      [context.recipeRef.id, recipe.id],
    );
  }
  const resources = coverage.compileRequest.resourceSet;
  const direct = compileDirectMembers({ context, recipe, resources });
  if (!direct.ok) {
    return fail(direct.code, direct.message, direct.contentIds);
  }

  const collection = compilePatientClinicalResultCollection({
    schemaVersion: 1,
    id: requestId('patient-clinical-result-collection', context.id, recipe.id),
    patientStateId: context.patientStateId,
    sourceInstanceCompilation: context.sourceInstanceCompilation,
    numericStructuredTestCompilations: direct.value.numericStructuredTestCompilations,
    patientOwnedStructuredTestCompilations: direct.value.patientOwnedStructuredTestCompilations,
    measurementCompilations: direct.value.measurementCompilations,
    categoricalObservationCompilations: direct.value.categoricalObservationCompilations,
  });
  if (!collection.ok) {
    return fail(
      'RESULT_COLLECTION_COMPILATION_FAILED',
      `${collection.error.code}: ${collection.error.message}`,
      [context.patientStateId, recipe.id],
    );
  }

  const derivedMeasurementMaterializations: BodyMassIndexMeasurementMaterializationArtifact[] = [];
  for (const derived of recipe.derivedMeasurements) {
    const heightMember = exactMeasurementMember(recipe, derived.heightMeasurementMemberId);
    const weightMember = exactMeasurementMember(recipe, derived.weightMeasurementMemberId);
    const heightCompilation = direct.value.measurementCompilationsByRecipeMemberId.get(
      derived.heightMeasurementMemberId,
    );
    const weightCompilation = direct.value.measurementCompilationsByRecipeMemberId.get(
      derived.weightMeasurementMemberId,
    );
    const derivationDefinition = exactResource(
      resources.bodyMassIndexDerivationDefinitions,
      derived.derivationDefinitionRef,
    );
    const outputMeasurementDefinition = exactResource(
      resources.measurementDefinitions,
      derived.outputMeasurementDefinitionRef,
    );
    const heightMeasurementDefinition =
      heightMember === undefined
        ? undefined
        : exactResource(resources.measurementDefinitions, heightMember.measurementDefinitionRef);
    const weightMeasurementDefinition =
      weightMember === undefined
        ? undefined
        : exactResource(resources.measurementDefinitions, weightMember.measurementDefinitionRef);
    if (
      heightMember === undefined ||
      weightMember === undefined ||
      heightCompilation === undefined ||
      weightCompilation === undefined ||
      derivationDefinition === undefined ||
      outputMeasurementDefinition === undefined ||
      heightMeasurementDefinition === undefined ||
      weightMeasurementDefinition === undefined
    ) {
      return fail(
        'RESOURCE_NOT_FOUND',
        `${derived.id} is missing one exact BMI input, derivation, or output resource.`,
        [
          derived.id,
          derived.derivationDefinitionRef.id,
          derived.outputMeasurementDefinitionRef.id,
          derived.heightMeasurementMemberId,
          derived.weightMeasurementMemberId,
        ],
      );
    }
    const derivation = compileBodyMassIndexDerivation({
      schemaVersion: 1,
      id: requestId('body-mass-index-derivation', context.id, derived.id),
      patientStateId: context.patientStateId,
      derivationDefinition,
      heightMeasurementDefinition,
      weightMeasurementDefinition,
      outputMeasurementDefinition,
      resultCollectionCompilation: collection.value,
      heightResolvedMeasurementId: heightCompilation.resolvedMeasurement.id,
      weightResolvedMeasurementId: weightCompilation.resolvedMeasurement.id,
    });
    if (!derivation.ok) {
      return fail(
        'DERIVATION_COMPILATION_FAILED',
        `${derived.id}: ${derivation.error.code}: ${derivation.error.message}`,
        [derived.id, derivationDefinition.id],
      );
    }
    const materialization = materializeBodyMassIndexMeasurement({
      schemaVersion: 1,
      id: requestId('body-mass-index-measurement-materialization', context.id, derived.id),
      derivationCompilation: derivation.value,
    });
    if (!materialization.ok) {
      return fail(
        'DERIVED_MATERIALIZATION_FAILED',
        `${derived.id}: ${materialization.error.code}: ${materialization.error.message}`,
        [derived.id, derivation.value.id],
      );
    }
    derivedMeasurementMaterializations.push(materialization.value);
  }

  const template = selectedTemplate(request);
  const recipeCompilation = compilePatientTemplateClinicalResultRecipe({
    schemaVersion: 1,
    id: requestId('patient-template-clinical-result-recipe-compilation', context.id, recipe.id),
    patientStateId: context.patientStateId,
    template,
    recipeHorizonArtifact: recipeHorizon,
    resultCollectionCompilation: collection.value,
    derivedMeasurementMaterializations,
  });
  if (!recipeCompilation.ok) {
    return fail(
      'RECIPE_COMPILATION_FAILED',
      `${recipeCompilation.error.code}: ${recipeCompilation.error.message}`,
      [context.templateRef.id, recipe.id],
    );
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_TEMPLATE_CLINICAL_RESULT_MATERIALIZATION_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: context.patientStateId,
    materializationContextRef: {
      id: context.id,
      inputFingerprint: context.inputFingerprint,
      payloadFingerprint: context.payloadFingerprint,
    },
    templateClinicalResultRecipeCompilationRef: {
      id: recipeCompilation.value.id,
      inputFingerprint: recipeCompilation.value.inputFingerprint,
      payloadFingerprint: recipeCompilation.value.payloadFingerprint,
    },
    templateClinicalResultRecipeCompilation: recipeCompilation.value,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = PatientTemplateClinicalResultMaterializationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `patient-template-clinical-result-materialization.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
      request.id,
      context.patientStateId,
      recipe.id,
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyPatientTemplateClinicalResultMaterializationIntegrity = (
  input: unknown,
): PatientTemplateClinicalResultMaterializationIntegrityResult => {
  const parsed = PatientTemplateClinicalResultMaterializationArtifactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (
    artifact.compilerVersion !== PATIENT_TEMPLATE_CLINICAL_RESULT_MATERIALIZATION_COMPILER_VERSION
  ) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported result-materialization compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const context = verifyPatientTemplateClinicalResultMaterializationContextIntegrity(
    artifact.compileRequest.materializationContextArtifact,
  );
  if (!context.ok) {
    return {
      ok: false,
      error: {
        code: 'MATERIALIZATION_CONTEXT_INVALID',
        message: `${context.error.code}: ${context.error.message}`,
      },
    };
  }
  const recipe = verifyPatientTemplateClinicalResultRecipeCompilationIntegrity(
    artifact.templateClinicalResultRecipeCompilation,
  );
  if (!recipe.ok) {
    return {
      ok: false,
      error: {
        code: 'RECIPE_COMPILATION_INVALID',
        message: `${recipe.error.code}: ${recipe.error.message}`,
      },
    };
  }
  if (artifact.inputFingerprint !== fingerprint('input', artifact.compileRequest)) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact D-325 request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `patient-template-clinical-result-materialization.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact D-326 payload.`,
      },
    };
  }
  const replay = compilePatientTemplateClinicalResultMaterialization(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: replay.ok
          ? `${artifact.id} does not replay to its stored result-materialization payload.`
          : `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  return { ok: true, value: artifact };
};
