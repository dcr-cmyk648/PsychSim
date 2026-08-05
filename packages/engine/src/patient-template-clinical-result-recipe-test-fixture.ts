import {
  PatientTemplateClinicalResultRecipeSchema,
  PatientTemplateSchema,
  type BodyMassIndexMeasurementMaterializationArtifact,
  type PatientClinicalResultCollectionCompilationArtifact,
  type PatientTemplateClinicalResultRecipeCompilationArtifact,
  type PatientTemplateClinicalResultRecipeMember,
  type PatientTemplate,
  type ResolvedPatientStateCompositionArtifact,
} from '@psychsim/schemas';

import {
  compileModePatientTemplateHorizon,
  fingerprintModePatientTemplateHorizonTemplate,
} from './mode-patient-template-horizon-compiler';
import { compilePatientTemplateClinicalResultRecipe } from './patient-template-clinical-result-recipe-compiler';
import { compilePatientTemplateClinicalResultRecipeHorizon } from './patient-template-clinical-result-recipe-horizon-compiler';

interface TestTemplateClinicalResultRecipeInput {
  readonly coordinate: string;
  readonly patientStateCompositionArtifact: ResolvedPatientStateCompositionArtifact;
  readonly resultCollectionCompilation: PatientClinicalResultCollectionCompilationArtifact;
  readonly derivedMeasurementMaterializations?: readonly BodyMassIndexMeasurementMaterializationArtifact[];
  readonly templateOverride?: PatientTemplate;
}

const exactRef = (value: { readonly id: string; readonly contentVersion: string }) => ({
  id: value.id,
  contentVersion: value.contentVersion,
});

export const compileTestPatientTemplateClinicalResultRecipe = (
  input: TestTemplateClinicalResultRecipeInput,
): PatientTemplateClinicalResultRecipeCompilationArtifact => {
  const template =
    input.templateOverride ??
    input.patientStateCompositionArtifact.compositionRequest.optionalFeatureArtifact
      .selectionRequest.template;
  const directEntries: {
    readonly member: PatientTemplateClinicalResultRecipeMember;
    readonly resolvedRecordId: string;
  }[] = [];
  const addMember = (
    member: PatientTemplateClinicalResultRecipeMember,
    resolvedRecordId: string,
  ): void => {
    directEntries.push({ member, resolvedRecordId });
  };

  input.resultCollectionCompilation.compileRequest.numericStructuredTestCompilations.forEach(
    (compilation, index) => {
      addMember(
        {
          schemaVersion: 1,
          id: `patient-template-clinical-result-recipe-member.test.${input.coordinate}.generated-numeric.${index}`,
          kind: 'generated_numeric_test',
          testDefinitionRef: exactRef(compilation.compileRequest.testDefinition),
          sourceDefinitionRef: compilation.compileRequest.sourceDefinitionRef,
          timeScopeId: compilation.compileRequest.timeScopeId,
        },
        compilation.result.id,
      );
    },
  );
  input.resultCollectionCompilation.compileRequest.patientOwnedStructuredTestCompilations.forEach(
    (compilation, index) => {
      addMember(
        {
          schemaVersion: 1,
          id: `patient-template-clinical-result-recipe-member.test.${input.coordinate}.patient-owned-test.${index}`,
          kind: 'patient_owned_test',
          testDefinitionRef: exactRef(compilation.compileRequest.testDefinition),
          resultProfileRef: {
            id: compilation.compileRequest.resultProfile.id,
            contentVersion: compilation.compileRequest.resultProfile.contentVersion,
          },
          sourceDefinitionRef: compilation.compileRequest.sourceDefinitionRef,
          timeScopeId: compilation.compileRequest.timeScopeId,
        },
        compilation.result.id,
      );
    },
  );
  input.resultCollectionCompilation.compileRequest.measurementCompilations.forEach(
    (compilation, index) => {
      const member: PatientTemplateClinicalResultRecipeMember =
        'valueProfile' in compilation.compileRequest
          ? {
              schemaVersion: 1,
              id: `patient-template-clinical-result-recipe-member.test.${input.coordinate}.measurement.${index}`,
              kind: 'measurement',
              measurementDefinitionRef: exactRef(compilation.compileRequest.measurementDefinition),
              valueProfileRef: exactRef(compilation.compileRequest.valueProfile),
              sourceDefinitionRef: compilation.compileRequest.sourceDefinitionRef,
              timeScopeId: compilation.compileRequest.timeScopeId,
            }
          : {
              schemaVersion: 1,
              id: `patient-template-clinical-result-recipe-member.test.${input.coordinate}.generated-measurement.${index}`,
              kind: 'generated_measurement',
              measurementDefinitionRef: exactRef(compilation.compileRequest.measurementDefinition),
              generationProfileRefs: compilation.compileRequest.generationProfiles.map(exactRef),
              sourceDefinitionRef: compilation.compileRequest.sourceDefinitionRef,
              timeScopeId: compilation.compileRequest.timeScopeId,
            };
      addMember(member, compilation.resolvedMeasurement.id);
    },
  );
  input.resultCollectionCompilation.compileRequest.categoricalObservationCompilations.forEach(
    (compilation, index) => {
      addMember(
        'valueProfile' in compilation.compileRequest
          ? {
              schemaVersion: 1,
              id: `patient-template-clinical-result-recipe-member.test.${input.coordinate}.categorical-observation.${index}`,
              kind: 'categorical_observation',
              observationDefinitionRef: exactRef(compilation.compileRequest.observationDefinition),
              valueProfileRef: exactRef(compilation.compileRequest.valueProfile),
              sourceDefinitionRef: compilation.compileRequest.sourceDefinitionRef,
              timeScopeId: compilation.compileRequest.timeScopeId,
            }
          : {
              schemaVersion: 1,
              id: `patient-template-clinical-result-recipe-member.test.${input.coordinate}.generated-categorical-observation.${index}`,
              kind: 'generated_categorical_observation',
              observationDefinitionRef: exactRef(compilation.compileRequest.observationDefinition),
              generationProfileRefs: compilation.compileRequest.generationProfiles.map(exactRef),
              sourceDefinitionRef: compilation.compileRequest.sourceDefinitionRef,
              timeScopeId: compilation.compileRequest.timeScopeId,
            },
        compilation.resolvedObservation.id,
      );
    },
  );

  const memberIdByResolvedRecordId = new Map(
    directEntries.map((entry) => [entry.resolvedRecordId, entry.member.id] as const),
  );
  const materializations = [...(input.derivedMeasurementMaterializations ?? [])];
  const derivedMeasurements = materializations.map((materialization, index) => {
    const derivation = materialization.materializationRequest.derivationCompilation;
    const heightMeasurementMemberId = memberIdByResolvedRecordId.get(
      derivation.compileRequest.heightResolvedMeasurementId,
    );
    const weightMeasurementMemberId = memberIdByResolvedRecordId.get(
      derivation.compileRequest.weightResolvedMeasurementId,
    );
    if (heightMeasurementMemberId === undefined || weightMeasurementMemberId === undefined) {
      throw new Error('A test BMI materialization must reference two direct recipe measurements.');
    }
    return {
      schemaVersion: 1 as const,
      id: `patient-template-clinical-result-derived-measurement.test.${input.coordinate}.${index}`,
      kind: 'body_mass_index' as const,
      derivationDefinitionRef: exactRef(derivation.compileRequest.derivationDefinition),
      heightMeasurementMemberId,
      weightMeasurementMemberId,
      outputMeasurementDefinitionRef: exactRef(
        derivation.compileRequest.outputMeasurementDefinition,
      ),
    };
  });
  const recipe = PatientTemplateClinicalResultRecipeSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `patient-template-clinical-result-recipe.test.${input.coordinate}`,
    templateRef: {
      id: template.id,
      contentVersion: template.contentVersion,
    },
    templateFingerprint: fingerprintModePatientTemplateHorizonTemplate(template),
    directMembers: directEntries.map((entry) => entry.member),
    derivedMeasurements,
    medicalReviewStatus: 'unreviewed',
    review: {
      status: 'unreviewed',
      reviewerId: null,
      reviewedAt: null,
      sourceUseNoteIds: [],
    },
  });
  const approvedAnchor = PatientTemplateSchema.parse({
    ...template,
    id: `patient-template.test.${input.coordinate}.recipe-horizon-anchor`,
    lifecycle: 'approved',
    medicalReviewStatus: 'approved',
    review: {
      status: 'approved',
      reviewerId: 'reviewer.test.recipe-horizon-anchor',
      reviewedAt: '2026-08-03T00:00:00.000Z',
      sourceUseNoteIds: [],
    },
  });
  const templateHorizon = compileModePatientTemplateHorizon({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `mode-patient-template-horizon-request.test.${input.coordinate}.clinical-results`,
    modelVersion: 'mode-patient-template-horizon.v1',
    mode: 'developer',
    approvedTemplates: template.lifecycle === 'approved' ? [template] : [approvedAnchor],
    explicitReviewTemplates: template.lifecycle === 'review' ? [template] : [],
  });
  if (!templateHorizon.ok) throw new Error(templateHorizon.error.message);
  const recipeHorizon = compilePatientTemplateClinicalResultRecipeHorizon({
    schemaVersion: 1,
    id: `patient-template-clinical-result-recipe-horizon-request.test.${input.coordinate}`,
    templateHorizonArtifact: templateHorizon.value,
    recipes: [recipe],
  });
  if (!recipeHorizon.ok) throw new Error(recipeHorizon.error.message);
  const compilation = compilePatientTemplateClinicalResultRecipe({
    schemaVersion: 1,
    id: `patient-template-clinical-result-recipe-compilation-request.test.${input.coordinate}`,
    patientStateId: input.resultCollectionCompilation.patientStateId,
    template,
    recipeHorizonArtifact: recipeHorizon.value,
    resultCollectionCompilation: input.resultCollectionCompilation,
    derivedMeasurementMaterializations: materializations,
  });
  if (!compilation.ok) throw new Error(compilation.error.message);
  return compilation.value;
};
