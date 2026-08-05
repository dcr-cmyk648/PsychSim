import {
  PatientTemplateClinicalResultRecipeCompilationArtifactSchema,
  PatientTemplateClinicalResultRecipeCompilationRequestSchema,
  type BodyMassIndexMeasurementMaterializationArtifact,
  type PatientClinicalResultCollectionCompilationArtifact,
  type PatientTemplateClinicalResultRecipe,
  type PatientTemplateClinicalResultRecipeCompilationArtifact,
  type PatientTemplateClinicalResultRecipeCompilationFingerprint,
  type PatientTemplateClinicalResultRecipeCompilationRequest,
  type PatientTemplateClinicalResultRecipeMember,
  type PatientTemplateClinicalResultRecipeMemberBinding,
} from '@psychsim/schemas';

import { verifyBodyMassIndexMeasurementMaterializationIntegrity } from './body-mass-index-measurement-materializer';
import { fingerprintModePatientTemplateHorizonTemplate } from './mode-patient-template-horizon-compiler';
import { verifyPatientClinicalResultCollectionCompilationIntegrity } from './patient-clinical-result-collection-compiler';
import {
  fingerprintPatientTemplateClinicalResultRecipe,
  normalizePatientTemplateClinicalResultRecipe,
} from './patient-template-clinical-result-recipe-fingerprint';
import {
  resolvePatientTemplateClinicalResultRecipeFromHorizon,
  verifyPatientTemplateClinicalResultRecipeHorizonIntegrity,
} from './patient-template-clinical-result-recipe-horizon-compiler';

export { fingerprintPatientTemplateClinicalResultRecipe };

export const PATIENT_TEMPLATE_CLINICAL_RESULT_RECIPE_COMPILER_VERSION = '4.0.0';

export type PatientTemplateClinicalResultRecipeCompilationResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateClinicalResultRecipeCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'RECIPE_HORIZON_INVALID'
          | 'RECIPE_NOT_AVAILABLE'
          | 'TEMPLATE_FINGERPRINT_MISMATCH'
          | 'RESULT_COLLECTION_INVALID'
          | 'PATIENT_MISMATCH'
          | 'DIRECT_MEMBER_MISMATCH'
          | 'DIRECT_COLLECTION_COVERAGE_MISMATCH'
          | 'DERIVED_MATERIALIZATION_INVALID'
          | 'DERIVED_MEMBER_MISMATCH'
          | 'DERIVED_COLLECTION_COVERAGE_MISMATCH'
          | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type PatientTemplateClinicalResultRecipeCompilationIntegrityResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateClinicalResultRecipeCompilationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'RECIPE_HORIZON_INVALID'
          | 'RECIPE_NOT_AVAILABLE'
          | 'TEMPLATE_FINGERPRINT_MISMATCH'
          | 'RECIPE_FINGERPRINT_MISMATCH'
          | 'RESULT_COLLECTION_INVALID'
          | 'DERIVED_MATERIALIZATION_INVALID'
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
): PatientTemplateClinicalResultRecipeCompilationFingerprint =>
  `fingerprint.patient-template-clinical-result-recipe-compilation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const sameRef = (
  left: { readonly id: string; readonly contentVersion: string },
  right: { readonly id: string; readonly contentVersion: string },
): boolean => left.id === right.id && left.contentVersion === right.contentVersion;

const normalizedRefKeys = (
  values: readonly { readonly id: string; readonly contentVersion: string }[],
): string[] =>
  values.map((value) => `${value.id}\u0000${value.contentVersion}`).sort(compareStrings);

const normalizeRequest = (
  request: PatientTemplateClinicalResultRecipeCompilationRequest,
): PatientTemplateClinicalResultRecipeCompilationRequest =>
  PatientTemplateClinicalResultRecipeCompilationRequestSchema.parse({
    ...request,
    derivedMeasurementMaterializations: [...request.derivedMeasurementMaterializations].sort(
      (left, right) => compareStrings(left.id, right.id),
    ),
  });

const artifactPayload = (
  artifact: Omit<
    PatientTemplateClinicalResultRecipeCompilationArtifact,
    'id' | 'payloadFingerprint'
  >,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  templateRef: artifact.templateRef,
  recipeRef: artifact.recipeRef,
  recipeHorizonRef: artifact.recipeHorizonRef,
  resultCollectionRef: artifact.resultCollectionRef,
  directMemberBindings: artifact.directMemberBindings,
  derivedMeasurementBindings: artifact.derivedMeasurementBindings,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

const directBindingCandidates = (
  member: PatientTemplateClinicalResultRecipeMember,
  collection: PatientClinicalResultCollectionCompilationArtifact,
): PatientTemplateClinicalResultRecipeMemberBinding[] => {
  switch (member.kind) {
    case 'generated_numeric_test':
      return collection.compileRequest.numericStructuredTestCompilations
        .filter(
          (compilation) =>
            sameRef(compilation.compileRequest.testDefinition, member.testDefinitionRef) &&
            sameRef(compilation.compileRequest.sourceDefinitionRef, member.sourceDefinitionRef) &&
            compilation.compileRequest.timeScopeId === member.timeScopeId,
        )
        .map((compilation) => ({
          schemaVersion: 1,
          recipeMemberId: member.id,
          kind: member.kind,
          compilationRef: {
            id: compilation.id,
            payloadFingerprint: compilation.payloadFingerprint,
          },
          resolvedRecordId: compilation.result.id,
          sourceInstanceId: compilation.result.source.sourceInstanceId,
        }));
    case 'patient_owned_test':
      return collection.compileRequest.patientOwnedStructuredTestCompilations
        .filter(
          (compilation) =>
            sameRef(compilation.compileRequest.testDefinition, member.testDefinitionRef) &&
            sameRef(compilation.compileRequest.resultProfile, member.resultProfileRef) &&
            sameRef(compilation.compileRequest.sourceDefinitionRef, member.sourceDefinitionRef) &&
            compilation.compileRequest.timeScopeId === member.timeScopeId,
        )
        .map((compilation) => ({
          schemaVersion: 1,
          recipeMemberId: member.id,
          kind: member.kind,
          compilationRef: {
            id: compilation.id,
            payloadFingerprint: compilation.payloadFingerprint,
          },
          resolvedRecordId: compilation.result.id,
          sourceInstanceId: compilation.result.source.sourceInstanceId,
        }));
    case 'measurement':
      return collection.compileRequest.measurementCompilations
        .filter((compilation) => {
          if (!('valueProfile' in compilation.compileRequest)) return false;
          return (
            sameRef(
              compilation.compileRequest.measurementDefinition,
              member.measurementDefinitionRef,
            ) &&
            sameRef(compilation.compileRequest.valueProfile, member.valueProfileRef) &&
            sameRef(compilation.compileRequest.sourceDefinitionRef, member.sourceDefinitionRef) &&
            compilation.compileRequest.timeScopeId === member.timeScopeId &&
            compilation.resolvedMeasurement.source.kind !== 'derived_measurement'
          );
        })
        .flatMap((compilation): PatientTemplateClinicalResultRecipeMemberBinding[] => {
          const source = compilation.resolvedMeasurement.source;
          if (source.kind === 'derived_measurement') return [];
          return [
            {
              schemaVersion: 1,
              recipeMemberId: member.id,
              kind: member.kind,
              compilationRef: {
                id: compilation.id,
                payloadFingerprint: compilation.payloadFingerprint,
              },
              resolvedRecordId: compilation.resolvedMeasurement.id,
              sourceInstanceId: source.sourceInstanceId,
            },
          ];
        });
    case 'generated_measurement':
      return collection.compileRequest.measurementCompilations
        .filter((compilation) => {
          if (!('generationProfiles' in compilation.compileRequest)) return false;
          return (
            sameRef(
              compilation.compileRequest.measurementDefinition,
              member.measurementDefinitionRef,
            ) &&
            sameExactValue(
              normalizedRefKeys(compilation.compileRequest.generationProfiles),
              normalizedRefKeys(member.generationProfileRefs),
            ) &&
            sameRef(compilation.compileRequest.sourceDefinitionRef, member.sourceDefinitionRef) &&
            compilation.compileRequest.timeScopeId === member.timeScopeId &&
            compilation.resolvedMeasurement.source.kind !== 'derived_measurement'
          );
        })
        .flatMap((compilation): PatientTemplateClinicalResultRecipeMemberBinding[] => {
          const source = compilation.resolvedMeasurement.source;
          if (source.kind === 'derived_measurement') return [];
          return [
            {
              schemaVersion: 1,
              recipeMemberId: member.id,
              kind: member.kind,
              compilationRef: {
                id: compilation.id,
                payloadFingerprint: compilation.payloadFingerprint,
              },
              resolvedRecordId: compilation.resolvedMeasurement.id,
              sourceInstanceId: source.sourceInstanceId,
            },
          ];
        });
    case 'categorical_observation':
      return collection.compileRequest.categoricalObservationCompilations
        .filter(
          (compilation) =>
            'valueProfile' in compilation.compileRequest &&
            sameRef(
              compilation.compileRequest.observationDefinition,
              member.observationDefinitionRef,
            ) &&
            sameRef(compilation.compileRequest.valueProfile, member.valueProfileRef) &&
            sameRef(compilation.compileRequest.sourceDefinitionRef, member.sourceDefinitionRef) &&
            compilation.compileRequest.timeScopeId === member.timeScopeId,
        )
        .map((compilation) => ({
          schemaVersion: 1,
          recipeMemberId: member.id,
          kind: member.kind,
          compilationRef: {
            id: compilation.id,
            payloadFingerprint: compilation.payloadFingerprint,
          },
          resolvedRecordId: compilation.resolvedObservation.id,
          sourceInstanceId: compilation.resolvedObservation.source.sourceInstanceId,
        }));
    case 'generated_categorical_observation':
      return collection.compileRequest.categoricalObservationCompilations
        .filter(
          (compilation) =>
            'generationProfiles' in compilation.compileRequest &&
            sameRef(
              compilation.compileRequest.observationDefinition,
              member.observationDefinitionRef,
            ) &&
            sameExactValue(
              normalizedRefKeys(compilation.compileRequest.generationProfiles),
              normalizedRefKeys(member.generationProfileRefs),
            ) &&
            sameRef(compilation.compileRequest.sourceDefinitionRef, member.sourceDefinitionRef) &&
            compilation.compileRequest.timeScopeId === member.timeScopeId,
        )
        .map((compilation) => ({
          schemaVersion: 1,
          recipeMemberId: member.id,
          kind: member.kind,
          compilationRef: {
            id: compilation.id,
            payloadFingerprint: compilation.payloadFingerprint,
          },
          resolvedRecordId: compilation.resolvedObservation.id,
          sourceInstanceId: compilation.resolvedObservation.source.sourceInstanceId,
        }));
  }
};

const allCollectionCompilationIds = (
  collection: PatientClinicalResultCollectionCompilationArtifact,
): string[] =>
  [
    ...collection.compileRequest.numericStructuredTestCompilations,
    ...collection.compileRequest.patientOwnedStructuredTestCompilations,
    ...collection.compileRequest.measurementCompilations,
    ...collection.compileRequest.categoricalObservationCompilations,
  ]
    .map((compilation) => compilation.id)
    .sort(compareStrings);

const matchesDerivedRecipe = (input: {
  readonly recipe: PatientTemplateClinicalResultRecipe['derivedMeasurements'][number];
  readonly materialization: BodyMassIndexMeasurementMaterializationArtifact;
  readonly collection: PatientClinicalResultCollectionCompilationArtifact;
  readonly directMembers: ReadonlyMap<string, PatientTemplateClinicalResultRecipeMember>;
  readonly directBindings: ReadonlyMap<string, PatientTemplateClinicalResultRecipeMemberBinding>;
}): boolean => {
  const heightMember = input.directMembers.get(input.recipe.heightMeasurementMemberId);
  const weightMember = input.directMembers.get(input.recipe.weightMeasurementMemberId);
  const heightBinding = input.directBindings.get(input.recipe.heightMeasurementMemberId);
  const weightBinding = input.directBindings.get(input.recipe.weightMeasurementMemberId);
  if (
    (heightMember?.kind !== 'measurement' && heightMember?.kind !== 'generated_measurement') ||
    (weightMember?.kind !== 'measurement' && weightMember?.kind !== 'generated_measurement') ||
    (heightBinding?.kind !== 'measurement' && heightBinding?.kind !== 'generated_measurement') ||
    (weightBinding?.kind !== 'measurement' && weightBinding?.kind !== 'generated_measurement')
  ) {
    return false;
  }
  const derivation = input.materialization.materializationRequest.derivationCompilation;
  const request = derivation.compileRequest;
  return (
    sameExactValue(request.resultCollectionCompilation, input.collection) &&
    sameRef(request.derivationDefinition, input.recipe.derivationDefinitionRef) &&
    sameRef(request.heightMeasurementDefinition, heightMember.measurementDefinitionRef) &&
    sameRef(request.weightMeasurementDefinition, weightMember.measurementDefinitionRef) &&
    sameRef(request.outputMeasurementDefinition, input.recipe.outputMeasurementDefinitionRef) &&
    request.heightResolvedMeasurementId === heightBinding.resolvedRecordId &&
    request.weightResolvedMeasurementId === weightBinding.resolvedRecordId
  );
};

export const compilePatientTemplateClinicalResultRecipe = (
  input: unknown,
): PatientTemplateClinicalResultRecipeCompilationResult => {
  const parsed = PatientTemplateClinicalResultRecipeCompilationRequestSchema.safeParse(input);
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
  const horizonIntegrity = verifyPatientTemplateClinicalResultRecipeHorizonIntegrity(
    request.recipeHorizonArtifact,
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
  const templateFingerprint = fingerprintModePatientTemplateHorizonTemplate(request.template);
  const recipeResolution = resolvePatientTemplateClinicalResultRecipeFromHorizon({
    artifact: horizonIntegrity.value,
    templateRef: {
      id: request.template.id,
      contentVersion: request.template.contentVersion,
    },
    templateFingerprint,
  });
  if (!recipeResolution.ok) {
    const sameRefMember = horizonIntegrity.value.members.find(
      (member) =>
        member.templateRef.id === request.template.id &&
        member.templateRef.contentVersion === request.template.contentVersion,
    );
    return {
      ok: false,
      error: {
        code:
          recipeResolution.error.code === 'TEMPLATE_NOT_FOUND' && sameRefMember !== undefined
            ? 'TEMPLATE_FINGERPRINT_MISMATCH'
            : 'RECIPE_NOT_AVAILABLE',
        message: recipeResolution.error.message,
      },
    };
  }
  const recipe = normalizePatientTemplateClinicalResultRecipe(recipeResolution.value.recipe);
  const collection = verifyPatientClinicalResultCollectionCompilationIntegrity(
    request.resultCollectionCompilation,
  );
  if (!collection.ok) {
    return {
      ok: false,
      error: {
        code: 'RESULT_COLLECTION_INVALID',
        message: collection.error.message,
      },
    };
  }
  if (collection.value.patientStateId !== request.patientStateId) {
    return {
      ok: false,
      error: {
        code: 'PATIENT_MISMATCH',
        message:
          'The template clinical-result recipe and result collection name different patients.',
      },
    };
  }

  const directMemberBindings: PatientTemplateClinicalResultRecipeMemberBinding[] = [];
  for (const member of recipe.directMembers) {
    const matches = directBindingCandidates(member, collection.value);
    if (matches.length !== 1) {
      return {
        ok: false,
        error: {
          code: 'DIRECT_MEMBER_MISMATCH',
          message: `${member.id} matched ${matches.length} exact D-306-through-D-309 compilations; exactly one is required.`,
        },
      };
    }
    directMemberBindings.push(matches[0]!);
  }
  directMemberBindings.sort((left, right) =>
    compareStrings(left.recipeMemberId, right.recipeMemberId),
  );
  const boundCompilationIds = directMemberBindings
    .map((binding) => binding.compilationRef.id)
    .sort(compareStrings);
  const collectionCompilationIds = allCollectionCompilationIds(collection.value);
  if (
    new Set(boundCompilationIds).size !== boundCompilationIds.length ||
    !sameExactValue(boundCompilationIds, collectionCompilationIds)
  ) {
    return {
      ok: false,
      error: {
        code: 'DIRECT_COLLECTION_COVERAGE_MISMATCH',
        message:
          'The template clinical-result recipe must own every direct collection compilation exactly once and may not name an extra result.',
      },
    };
  }

  for (const materialization of request.derivedMeasurementMaterializations) {
    const integrity = verifyBodyMassIndexMeasurementMaterializationIntegrity(materialization);
    if (!integrity.ok) {
      return {
        ok: false,
        error: {
          code: 'DERIVED_MATERIALIZATION_INVALID',
          message: integrity.error.message,
        },
      };
    }
    if (
      materialization.patientStateId !== request.patientStateId ||
      !sameExactValue(
        materialization.materializationRequest.derivationCompilation.compileRequest
          .resultCollectionCompilation,
        collection.value,
      )
    ) {
      return {
        ok: false,
        error: {
          code: 'DERIVED_MATERIALIZATION_INVALID',
          message: `${materialization.id} does not derive from the exact same-patient result collection.`,
        },
      };
    }
  }

  const directMembersById = new Map(
    recipe.directMembers.map((member) => [member.id, member] as const),
  );
  const directBindingsById = new Map(
    directMemberBindings.map((binding) => [binding.recipeMemberId, binding] as const),
  );
  const derivedMeasurementBindings: PatientTemplateClinicalResultRecipeCompilationArtifact['derivedMeasurementBindings'] =
    [];
  for (const derived of recipe.derivedMeasurements) {
    const matches = request.derivedMeasurementMaterializations.filter((materialization) =>
      matchesDerivedRecipe({
        recipe: derived,
        materialization,
        collection: collection.value,
        directMembers: directMembersById,
        directBindings: directBindingsById,
      }),
    );
    if (matches.length !== 1) {
      return {
        ok: false,
        error: {
          code: 'DERIVED_MEMBER_MISMATCH',
          message: `${derived.id} matched ${matches.length} exact derived-measurement materializations; exactly one is required.`,
        },
      };
    }
    const heightBinding = directBindingsById.get(derived.heightMeasurementMemberId)!;
    const weightBinding = directBindingsById.get(derived.weightMeasurementMemberId)!;
    const materialization = matches[0]!;
    derivedMeasurementBindings.push({
      schemaVersion: 1,
      recipeMemberId: derived.id,
      materializationRef: {
        id: materialization.id,
        payloadFingerprint: materialization.payloadFingerprint,
      },
      resolvedMeasurementId: materialization.resolvedMeasurement.id,
      inputRecipeMemberIds: [derived.heightMeasurementMemberId, derived.weightMeasurementMemberId],
      inputResolvedMeasurementIds: [heightBinding.resolvedRecordId, weightBinding.resolvedRecordId],
    });
  }
  derivedMeasurementBindings.sort((left, right) =>
    compareStrings(left.recipeMemberId, right.recipeMemberId),
  );
  const boundMaterializationIds = derivedMeasurementBindings
    .map((binding) => binding.materializationRef.id)
    .sort(compareStrings);
  const suppliedMaterializationIds = request.derivedMeasurementMaterializations
    .map((materialization) => materialization.id)
    .sort(compareStrings);
  if (
    new Set(boundMaterializationIds).size !== boundMaterializationIds.length ||
    !sameExactValue(boundMaterializationIds, suppliedMaterializationIds)
  ) {
    return {
      ok: false,
      error: {
        code: 'DERIVED_COLLECTION_COVERAGE_MISMATCH',
        message:
          'The template clinical-result recipe must own every supplied derived materialization exactly once and may not name an extra result.',
      },
    };
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_TEMPLATE_CLINICAL_RESULT_RECIPE_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: request.patientStateId,
    templateRef: {
      id: request.template.id,
      contentVersion: request.template.contentVersion,
      fingerprint: templateFingerprint,
    },
    recipeRef: {
      id: recipe.id,
      contentVersion: recipe.contentVersion,
      fingerprint: fingerprintPatientTemplateClinicalResultRecipe(recipe),
    },
    recipeHorizonRef: {
      id: horizonIntegrity.value.id,
      inputFingerprint: horizonIntegrity.value.inputFingerprint,
      payloadFingerprint: horizonIntegrity.value.payloadFingerprint,
    },
    resultCollectionRef: {
      id: collection.value.id,
      payloadFingerprint: collection.value.payloadFingerprint,
    },
    directMemberBindings,
    derivedMeasurementBindings,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = PatientTemplateClinicalResultRecipeCompilationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `patient-template-clinical-result-recipe-compilation.${payloadFingerprint.slice(-16)}`,
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

export const verifyPatientTemplateClinicalResultRecipeCompilationIntegrity = (
  input: unknown,
): PatientTemplateClinicalResultRecipeCompilationIntegrityResult => {
  const parsed = PatientTemplateClinicalResultRecipeCompilationArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== PATIENT_TEMPLATE_CLINICAL_RESULT_RECIPE_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported template clinical-result recipe compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const expectedTemplateFingerprint = fingerprintModePatientTemplateHorizonTemplate(
    artifact.compileRequest.template,
  );
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
  if (
    artifact.recipeHorizonRef.id !== horizonIntegrity.value.id ||
    artifact.recipeHorizonRef.inputFingerprint !== horizonIntegrity.value.inputFingerprint ||
    artifact.recipeHorizonRef.payloadFingerprint !== horizonIntegrity.value.payloadFingerprint
  ) {
    return {
      ok: false,
      error: {
        code: 'RECIPE_HORIZON_INVALID',
        message: `${artifact.id} does not retain its exact replay-valid recipe horizon.`,
      },
    };
  }
  const recipeResolution = resolvePatientTemplateClinicalResultRecipeFromHorizon({
    artifact: horizonIntegrity.value,
    templateRef: {
      id: artifact.compileRequest.template.id,
      contentVersion: artifact.compileRequest.template.contentVersion,
    },
    templateFingerprint: expectedTemplateFingerprint,
  });
  if (!recipeResolution.ok) {
    return {
      ok: false,
      error: {
        code: 'RECIPE_NOT_AVAILABLE',
        message: recipeResolution.error.message,
      },
    };
  }
  const recipe = recipeResolution.value.recipe;
  if (
    artifact.templateRef.fingerprint !== expectedTemplateFingerprint ||
    recipe.templateFingerprint !== expectedTemplateFingerprint
  ) {
    return {
      ok: false,
      error: {
        code: 'TEMPLATE_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain the exact patient-template payload fingerprint.`,
      },
    };
  }
  if (artifact.recipeRef.fingerprint !== fingerprintPatientTemplateClinicalResultRecipe(recipe)) {
    return {
      ok: false,
      error: {
        code: 'RECIPE_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain the exact normalized recipe fingerprint.`,
      },
    };
  }
  const collection = verifyPatientClinicalResultCollectionCompilationIntegrity(
    artifact.compileRequest.resultCollectionCompilation,
  );
  if (!collection.ok) {
    return {
      ok: false,
      error: {
        code: 'RESULT_COLLECTION_INVALID',
        message: collection.error.message,
      },
    };
  }
  const invalidMaterialization = artifact.compileRequest.derivedMeasurementMaterializations.find(
    (materialization) =>
      !verifyBodyMassIndexMeasurementMaterializationIntegrity(materialization).ok,
  );
  if (invalidMaterialization !== undefined) {
    return {
      ok: false,
      error: {
        code: 'DERIVED_MATERIALIZATION_INVALID',
        message: `${invalidMaterialization.id} failed exact derived-measurement replay.`,
      },
    };
  }
  if (artifact.inputFingerprint !== fingerprint('input', artifact.compileRequest)) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} input fingerprint does not match its complete request.`,
      },
    };
  }
  if (
    artifact.payloadFingerprint !== fingerprint('payload', artifactPayload(artifact)) ||
    artifact.id !==
      `patient-template-clinical-result-recipe-compilation.${artifact.payloadFingerprint.slice(
        -16,
      )}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} payload fingerprint does not match its exact artifact.`,
      },
    };
  }
  const replay = compilePatientTemplateClinicalResultRecipe(artifact.compileRequest);
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
