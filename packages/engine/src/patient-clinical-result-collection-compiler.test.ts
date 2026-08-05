import { describe, expect, it } from 'vitest';

import {
  BodyMassIndexDerivationDefinitionSchema,
  CategoricalObservationDefinitionSchema,
  GeneratedCategoricalObservationValueProfileSchema,
  GeneratedMeasurementValueProfileSchema,
  MeasurementDefinitionSchema,
  PatientClinicalResultResourceSetSchema,
  PatientOwnedCategoricalObservationValueProfileSchema,
  PatientOwnedMeasurementValueProfileSchema,
  PatientOwnedStructuredTestResultProfileSchema,
  PatientSceneSourceDefinitionCatalogSchema,
  PatientTemplateClinicalResultRecipeHorizonArtifactSchema,
  PatientTemplateClinicalResultResourceCoverageArtifactSchema,
  PatientTemplateClinicalResultRecipeSchema,
  PatientTemplateSchema,
  ReferenceIntervalSetDefinitionSchema,
  TestDefinitionSchema,
  type CatalogPatientSceneSourceInstanceCompilationArtifact,
  type PatientClinicalResultCollectionCompilationRequest,
  type PatientTemplateClinicalResultRecipe,
  type PatientTemplateClinicalResultRecipeCompilationRequest,
  type PatientTemplateClinicalResultRecipeHorizonArtifact,
} from '@psychsim/schemas';

import { compileBodyMassIndexDerivation } from './body-mass-index-derivation-compiler';
import { materializeBodyMassIndexMeasurement } from './body-mass-index-measurement-materializer';
import { compilePatientSceneSourceInstancesFromCatalog } from './catalog-patient-scene-source-instance-compiler';
import { compileGeneratedCategoricalObservation } from './generated-categorical-observation-compiler';
import { compileGeneratedMeasurement } from './generated-measurement-compiler';
import {
  compileModePatientTemplateHorizon,
  fingerprintModePatientTemplateHorizonTemplate,
} from './mode-patient-template-horizon-compiler';
import { compileNumericStructuredTestResult } from './numeric-structured-test-result-compiler';
import {
  compilePatientClinicalResultCollection,
  verifyPatientClinicalResultCollectionCompilationIntegrity,
} from './patient-clinical-result-collection-compiler';
import { compilePatientOwnedCategoricalObservation } from './patient-owned-categorical-observation-compiler';
import { compilePatientOwnedMeasurement } from './patient-owned-measurement-compiler';
import { compilePatientOwnedStructuredTestResult } from './patient-owned-structured-test-result-compiler';
import {
  compilePatientTemplateClinicalResultRecipe,
  verifyPatientTemplateClinicalResultRecipeCompilationIntegrity,
} from './patient-template-clinical-result-recipe-compiler';
import {
  compilePatientTemplateClinicalResultRecipeHorizon,
  resolvePatientTemplateClinicalResultRecipeFromHorizon,
  verifyPatientTemplateClinicalResultRecipeHorizonIntegrity,
} from './patient-template-clinical-result-recipe-horizon-compiler';
import {
  compilePatientTemplateClinicalResultResourceCoverage,
  verifyPatientTemplateClinicalResultResourceCoverageIntegrity,
} from './patient-template-clinical-result-resource-coverage-compiler';

const patientStateId = 'resolved-patient-state.test.clinical-result-collection';

const sourceDefinitionCatalog = PatientSceneSourceDefinitionCatalogSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'registry.catalog.patient-scene-source-definitions.test.result-collection',
  definitions: [
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'patient-scene-source-role.test.clinician-observation',
      kind: 'clinician_observation',
    },
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'patient-scene-source-role.test.laboratory-result',
      kind: 'laboratory_result',
    },
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'patient-scene-source-role.test.measurement',
      kind: 'measurement',
    },
  ],
});

const compileSourceHorizon = (
  targetPatientStateId = patientStateId,
): CatalogPatientSceneSourceInstanceCompilationArtifact => {
  const compiled = compilePatientSceneSourceInstancesFromCatalog({
    schemaVersion: 1,
    id: `catalog-patient-scene-source-instance-request.test.result-collection.${targetPatientStateId
      .split('.')
      .at(-1)}`,
    patientStateId: targetPatientStateId,
    sourceDefinitionCatalog,
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

const sourceInstanceCompilation = compileSourceHorizon();

const unreviewed = {
  status: 'unreviewed' as const,
  reviewerId: null,
  reviewedAt: null,
  sourceUseNoteIds: [],
};

const referenceIntervalSet = ReferenceIntervalSetDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'reference-interval.test.result-collection',
  label: 'Synthetic result-collection interval',
  jurisdiction: 'Test jurisdiction',
  reportingConvention: 'Synthetic test convention',
  unitConvention: 'UCUM',
  referenceIntervalPolicy: 'Synthetic test-only interval owner',
  numericRangeAuthority: 'prototype_unreviewed',
  medicalReviewStatus: 'unreviewed',
  sourceUrls: ['https://example.com/reference-interval'],
  sourceUseNoteIds: [],
});

const numericTestDefinition = TestDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'test.lab.result-collection.numeric',
  actionId: 'info.labs.result-collection-numeric',
  label: 'Synthetic numeric result',
  category: 'laboratory',
  contextInputs: [],
  medicalReviewStatus: 'unreviewed',
  sourceUseNoteIds: [],
  resultContract: {
    kind: 'numeric_panel',
    componentPolicy: 'fixed',
    componentDefinitionIds: ['lab-component.test.result-collection'],
  },
  generator: {
    type: 'numeric_panel',
    profiles: [
      {
        id: 'test-profile.result-collection.numeric',
        priority: 0,
        when: {
          anyDiagnosisIds: [],
          allClinicalTagIds: [],
        },
        referenceIntervalSetId: referenceIntervalSet.id,
        referenceIntervalLabel: referenceIntervalSet.label,
        incidentalAbnormalProbability: 0,
        components: [
          {
            id: 'lab-component.test.result-collection',
            label: 'Synthetic component',
            unit: 'mg/L',
            ucumCode: 'mg/L',
            decimals: 1,
            referenceRange: { minimum: 1, maximum: 2 },
            normalGenerationRange: { minimum: 1.2, maximum: 1.8 },
            mildAbnormalRanges: [],
          },
        ],
      },
    ],
  },
});

const patientOwnedTestDefinition = TestDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'test.lab.result-collection.patient-owned',
  actionId: 'info.labs.result-collection-patient-owned',
  label: 'Synthetic patient-owned result',
  category: 'laboratory',
  contextInputs: [],
  medicalReviewStatus: 'unreviewed',
  sourceUseNoteIds: [],
  resultContract: {
    kind: 'binary',
    allowedOutcomes: ['positive', 'negative'],
  },
  generator: {
    type: 'patient_owned',
    reason: 'Synthetic result-collection test fixture.',
  },
});

const measurementDefinitions = [
  MeasurementDefinitionSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'measurement.test.result-collection.height',
    label: 'Synthetic height',
    domain: 'anthropometric',
    unit: {
      display: 'cm',
      ucumCode: 'cm',
      displayPrecision: 1,
    },
    availableThroughActionIds: ['info.physical.weight-bmi'],
    allowedContextDimensionIds: [],
    lifecycle: 'review',
    medicalReviewStatus: 'unreviewed',
  }),
  MeasurementDefinitionSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'measurement.test.result-collection.weight',
    label: 'Synthetic weight',
    domain: 'anthropometric',
    unit: {
      display: 'kg',
      ucumCode: 'kg',
      displayPrecision: 1,
    },
    availableThroughActionIds: ['info.physical.weight-bmi'],
    allowedContextDimensionIds: [],
    lifecycle: 'review',
    medicalReviewStatus: 'unreviewed',
  }),
  MeasurementDefinitionSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'measurement.test.result-collection.bmi',
    label: 'Synthetic BMI',
    domain: 'anthropometric',
    unit: {
      display: 'kg/m²',
      ucumCode: 'kg/m2',
      displayPrecision: 1,
    },
    availableThroughActionIds: ['info.physical.weight-bmi'],
    allowedContextDimensionIds: [],
    lifecycle: 'review',
    medicalReviewStatus: 'unreviewed',
  }),
];

const bmiDerivationDefinition = BodyMassIndexDerivationDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'measurement-derivation.test.result-collection.bmi',
  kind: 'body_mass_index_from_metric_height_weight',
  heightMeasurementDefinitionRef: {
    id: measurementDefinitions[0]!.id,
    contentVersion: measurementDefinitions[0]!.contentVersion,
  },
  weightMeasurementDefinitionRef: {
    id: measurementDefinitions[1]!.id,
    contentVersion: measurementDefinitions[1]!.contentVersion,
  },
  outputMeasurementDefinitionRef: {
    id: measurementDefinitions[2]!.id,
    contentVersion: measurementDefinitions[2]!.contentVersion,
  },
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const observationDefinition = CategoricalObservationDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'observation.test.result-collection.appearance',
  label: 'Synthetic appearance',
  domain: 'mental_status_exam',
  allowedValueIds: [
    'observation-value.test.result-collection.appearance.a',
    'observation-value.test.result-collection.appearance.b',
  ],
  availableThroughActionIds: ['info.physical.mental-status'],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const compileNumeric = (requestId = 'numeric-result-request.test.collection') => {
  const compiled = compileNumericStructuredTestResult({
    schemaVersion: 1,
    id: requestId,
    patientStateId,
    seed: 'seed.test.result-collection',
    testDefinition: numericTestDefinition,
    generationContext: {
      ageYears: 42,
      sexForReference: 'female',
      diagnosisIds: [],
      clinicalTagIds: [],
    },
    referenceIntervalSets: [referenceIntervalSet],
    sourceDefinitionRef: {
      id: 'patient-scene-source-role.test.laboratory-result',
      contentVersion: '1.0.0',
    },
    sourceInstanceCompilation,
    timeScopeId: 'time-scope.current',
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

const compilePatientOwnedTest = () => {
  const resultProfile = PatientOwnedStructuredTestResultProfileSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-owned-test-result-profile.test.collection',
    testDefinitionRef: {
      id: patientOwnedTestDefinition.id,
      contentVersion: patientOwnedTestDefinition.contentVersion,
    },
    payload: {
      kind: 'binary',
      outcome: 'negative',
      displayValue: 'Synthetic negative',
      interpretationIds: [],
    },
    sourceUseNoteIds: [],
    medicalReviewStatus: 'unreviewed',
    review: unreviewed,
  });
  const compiled = compilePatientOwnedStructuredTestResult({
    schemaVersion: 1,
    id: 'patient-owned-test-result-request.test.collection',
    patientStateId,
    testDefinition: patientOwnedTestDefinition,
    resultProfile,
    sourceDefinitionRef: {
      id: 'patient-scene-source-role.test.laboratory-result',
      contentVersion: '1.0.0',
    },
    sourceInstanceCompilation,
    timeScopeId: 'time-scope.current',
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

const compileMeasurement = (definition: (typeof measurementDefinitions)[number], value: number) => {
  const valueProfile = PatientOwnedMeasurementValueProfileSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `patient-owned-measurement-profile.test.collection.${definition.id}`,
    measurementDefinitionRef: {
      id: definition.id,
      contentVersion: definition.contentVersion,
    },
    value,
    displayValue: String(value),
    contextValues: [],
    sourceUseNoteIds: [],
    medicalReviewStatus: 'unreviewed',
    review: unreviewed,
  });
  const compiled = compilePatientOwnedMeasurement({
    schemaVersion: 1,
    id: `patient-owned-measurement-request.test.collection.${definition.id}`,
    patientStateId,
    measurementDefinition: definition,
    valueProfile,
    sourceDefinitionRef: {
      id: 'patient-scene-source-role.test.measurement',
      contentVersion: '1.0.0',
    },
    sourceInstanceCompilation,
    timeScopeId: 'time-scope.current',
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

const compileGeneratedWeight = () => {
  const generationProfile = GeneratedMeasurementValueProfileSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'measurement-generation-profile.test.collection.weight',
    measurementDefinitionRef: {
      id: measurementDefinitions[1]!.id,
      contentVersion: measurementDefinitions[1]!.contentVersion,
    },
    priority: 0,
    when: {
      anyDiagnosisIds: [],
      allClinicalTagIds: [],
    },
    valueBands: [
      {
        id: 'measurement-generation-band.test.collection.weight',
        minimum: 65,
        maximum: 95,
        relativeWeight: 1,
      },
    ],
    contextValues: [],
    sourceUseNoteIds: [],
    medicalReviewStatus: 'unreviewed',
    review: unreviewed,
  });
  const compiled = compileGeneratedMeasurement({
    schemaVersion: 1,
    id: 'generated-measurement-request.test.collection.weight',
    patientStateId,
    seed: 'seed.test.result-collection.generated-weight',
    measurementDefinition: measurementDefinitions[1]!,
    generationContext: {
      ageYears: 42,
      sexForReference: 'female',
      diagnosisIds: [],
      clinicalTagIds: [],
    },
    generationProfiles: [generationProfile],
    sourceDefinitionRef: {
      id: 'patient-scene-source-role.test.measurement',
      contentVersion: '1.0.0',
    },
    sourceInstanceCompilation,
    timeScopeId: 'time-scope.current',
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

const compileObservation = () => {
  const valueProfile = PatientOwnedCategoricalObservationValueProfileSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-owned-observation-profile.test.collection',
    observationDefinitionRef: {
      id: observationDefinition.id,
      contentVersion: observationDefinition.contentVersion,
    },
    valueId: observationDefinition.allowedValueIds[0],
    displayValue: 'Synthetic appearance value',
    sourceUseNoteIds: [],
    medicalReviewStatus: 'unreviewed',
    review: unreviewed,
  });
  const compiled = compilePatientOwnedCategoricalObservation({
    schemaVersion: 1,
    id: 'patient-owned-observation-request.test.collection',
    patientStateId,
    observationDefinition,
    valueProfile,
    sourceDefinitionRef: {
      id: 'patient-scene-source-role.test.clinician-observation',
      contentVersion: '1.0.0',
    },
    sourceInstanceCompilation,
    timeScopeId: 'time-scope.current',
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

const compileGeneratedObservation = () => {
  const generationProfiles = [
    {
      id: 'observation-generation-profile.test.collection.appearance.general',
      priority: 0,
      when: {
        anyDiagnosisIds: [],
        allClinicalTagIds: [],
      },
    },
    {
      id: 'observation-generation-profile.test.collection.appearance.adult',
      priority: 10,
      when: {
        minimumAgeYears: 18,
        maximumAgeYears: 64,
        anyDiagnosisIds: [],
        allClinicalTagIds: [],
      },
    },
  ].map(({ id, priority, when }) =>
    GeneratedCategoricalObservationValueProfileSchema.parse({
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id,
      observationDefinitionRef: {
        id: observationDefinition.id,
        contentVersion: observationDefinition.contentVersion,
      },
      priority,
      when,
      valueOptions: observationDefinition.allowedValueIds.map((valueId, index) => ({
        id: `${id}.option.${index + 1}`,
        valueId,
        displayValue: `Synthetic generated appearance ${index + 1}`,
        relativeWeight: 1,
      })),
      sourceUseNoteIds: [],
      medicalReviewStatus: 'unreviewed',
      review: unreviewed,
    }),
  );
  const compiled = compileGeneratedCategoricalObservation({
    schemaVersion: 1,
    id: 'generated-categorical-observation-request.test.collection.appearance',
    patientStateId,
    seed: 'seed.test.result-collection.generated-observation',
    observationDefinition,
    generationContext: {
      ageYears: 42,
      sexForReference: 'female',
      diagnosisIds: [],
      clinicalTagIds: [],
    },
    generationProfiles,
    sourceDefinitionRef: {
      id: 'patient-scene-source-role.test.clinician-observation',
      contentVersion: '1.0.0',
    },
    sourceInstanceCompilation,
    timeScopeId: 'time-scope.current',
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

const numericCompilation = compileNumeric();
const patientOwnedTestCompilation = compilePatientOwnedTest();
const heightCompilation = compileMeasurement(measurementDefinitions[0]!, 170);
const weightCompilation = compileMeasurement(measurementDefinitions[1]!, 82.4);
const generatedWeightCompilation = compileGeneratedWeight();
const observationCompilation = compileObservation();
const generatedObservationCompilation = compileGeneratedObservation();

const request = (
  overrides: Partial<PatientClinicalResultCollectionCompilationRequest> = {},
): PatientClinicalResultCollectionCompilationRequest => ({
  schemaVersion: 1,
  id: 'patient-clinical-result-collection-request.test.base',
  patientStateId,
  sourceInstanceCompilation,
  numericStructuredTestCompilations: [numericCompilation],
  patientOwnedStructuredTestCompilations: [patientOwnedTestCompilation],
  measurementCompilations: [weightCompilation, heightCompilation],
  categoricalObservationCompilations: [observationCompilation],
  ...overrides,
});

const compileOrThrow = (input: PatientClinicalResultCollectionCompilationRequest) => {
  const compiled = compilePatientClinicalResultCollection(input);
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

describe('patient clinical-result collection compiler', () => {
  it('collects all four exact result owners canonically without attaching or interpreting them', () => {
    const artifact = compileOrThrow(request());

    expect(artifact.members).toHaveLength(5);
    expect(artifact.measurements.map((measurement) => measurement.definitionId).sort()).toEqual([
      'measurement.test.result-collection.height',
      'measurement.test.result-collection.weight',
    ]);
    expect(artifact.measurements.map((measurement) => measurement.id)).toEqual(
      artifact.measurements.map((measurement) => measurement.id).sort(),
    );
    expect(artifact.categoricalObservations).toHaveLength(1);
    expect(artifact.categoricalObservations[0]?.interpretationIds).toEqual([]);
    expect(artifact.structuredTestResults).toHaveLength(2);
    expect(artifact.members.map((member) => member.kind).sort()).toEqual([
      'categorical_observation',
      'generated_numeric_test',
      'measurement',
      'measurement',
      'patient_owned_test',
    ]);
    expect(verifyPatientClinicalResultCollectionCompilationIntegrity(artifact).ok).toBe(true);
    expect(JSON.stringify(artifact)).not.toMatch(
      /resolvedPatientState|patientInstance|points?|score|clinical correctness/i,
    );
  });

  it('normalizes input order and replays deterministically', () => {
    const reversed = compileOrThrow(request());
    const ordered = compileOrThrow(
      request({
        measurementCompilations: [heightCompilation, weightCompilation],
      }),
    );

    expect(reversed).toEqual(ordered);
    expect(compilePatientClinicalResultCollection(request())).toEqual({
      ok: true,
      value: reversed,
    });
  });

  it('retains D-335 generated measurements without relabeling them as authored values', () => {
    const artifact = compileOrThrow(
      request({
        measurementCompilations: [generatedWeightCompilation, heightCompilation],
      }),
    );
    const generatedMember = artifact.members.find(
      (member) => member.kind === 'generated_measurement',
    );

    expect(generatedMember).toMatchObject({
      kind: 'generated_measurement',
      compilationRef: {
        id: generatedWeightCompilation.id,
        payloadFingerprint: generatedWeightCompilation.payloadFingerprint,
      },
      resolvedRecordId: generatedWeightCompilation.resolvedMeasurement.id,
    });
    expect(
      artifact.measurements.find(
        (measurement) => measurement.id === generatedWeightCompilation.resolvedMeasurement.id,
      )?.resolution,
    ).toMatchObject({
      origin: 'deterministic_generation',
      generationProfileId: 'measurement-generation-profile.test.collection.weight',
    });
    expect(
      artifact.members.some(
        (member) =>
          member.kind === 'measurement' &&
          member.resolvedRecordId === generatedWeightCompilation.resolvedMeasurement.id,
      ),
    ).toBe(false);
    expect(verifyPatientClinicalResultCollectionCompilationIntegrity(artifact).ok).toBe(true);
  });

  it('retains D-356 generated observations without relabeling them as authored values', () => {
    const artifact = compileOrThrow(
      request({
        categoricalObservationCompilations: [generatedObservationCompilation],
      }),
    );
    const generatedMember = artifact.members.find(
      (member) => member.kind === 'generated_categorical_observation',
    );

    expect(generatedMember).toMatchObject({
      kind: 'generated_categorical_observation',
      compilationRef: {
        id: generatedObservationCompilation.id,
        payloadFingerprint: generatedObservationCompilation.payloadFingerprint,
      },
      resolvedRecordId: generatedObservationCompilation.resolvedObservation.id,
    });
    expect(
      artifact.categoricalObservations.find(
        (observation) => observation.id === generatedObservationCompilation.resolvedObservation.id,
      )?.resolution,
    ).toMatchObject({
      origin: 'deterministic_generation',
      generationProfileId: 'observation-generation-profile.test.collection.appearance.adult',
    });
    expect(
      artifact.members.some(
        (member) =>
          member.kind === 'categorical_observation' &&
          member.resolvedRecordId === generatedObservationCompilation.resolvedObservation.id,
      ),
    ).toBe(false);
    expect(verifyPatientClinicalResultCollectionCompilationIntegrity(artifact).ok).toBe(true);
  });

  it('rejects repeated artifacts, duplicate resolved records, and crossed patients', () => {
    expect(
      compilePatientClinicalResultCollection(
        request({
          measurementCompilations: [heightCompilation, heightCompilation],
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });

    const duplicateNumericResult = compileNumeric(
      'numeric-result-request.test.collection.duplicate',
    );
    expect(duplicateNumericResult.id).not.toBe(numericCompilation.id);
    expect(duplicateNumericResult.result.id).toBe(numericCompilation.result.id);
    expect(
      compilePatientClinicalResultCollection(
        request({
          numericStructuredTestCompilations: [numericCompilation, duplicateNumericResult],
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'DUPLICATE_RESOLVED_RECORD' },
    });

    expect(
      compilePatientClinicalResultCollection(
        request({
          patientStateId: 'resolved-patient-state.test.collection.other',
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
  });

  it('detects output and upstream replay tampering', () => {
    const artifact = compileOrThrow(request());

    const changedOutput = structuredClone(artifact);
    changedOutput.measurements[0]!.displayValue = 'Changed';
    expect(verifyPatientClinicalResultCollectionCompilationIntegrity(changedOutput)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });

    const changedUpstream = structuredClone(artifact);
    const changedMeasurement = changedUpstream.compileRequest.measurementCompilations[0]!;
    if (!('valueProfile' in changedMeasurement.compileRequest)) {
      throw new Error('Expected an authored measurement fixture.');
    }
    changedMeasurement.compileRequest.valueProfile.sourceUseNoteIds = [
      'source-use-note.test.changed',
    ];
    expect(
      verifyPatientClinicalResultCollectionCompilationIntegrity(changedUpstream),
    ).toMatchObject({
      ok: false,
      error: { code: 'UPSTREAM_COMPILATION_INVALID' },
    });
  });
});

const template = PatientTemplateSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-template.test.clinical-result-recipe',
  compilationMode: 'attachment_only.v6',
  internalLabel: 'Synthetic clinical-result recipe template',
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
  review: unreviewed,
  patientPool: 'starter',
  careSetting: 'outpatient_psychiatry',
  focusedDecisionId: 'decision.test.clinical-result-recipe',
  primaryPolicyRef: {
    id: 'decision-policy.test.clinical-result-recipe',
    contentVersion: '1.0.0',
  },
  decisionActionHorizonId: 'decision-action-horizon.test.clinical-result-recipe',
  decisionActionHorizonFingerprint:
    'fingerprint.catalog-instance.action-horizon.fnv1a64.0000000000000001',
  diagnosisSelectionHorizonId: 'diagnosis-selection-horizon.test.clinical-result-recipe',
  diagnosisSelectionHorizonFingerprint:
    'fingerprint.catalog-instance.diagnosis-horizon.fnv1a64.0000000000000002',
  findingProjectionHorizonId: 'finding-projection-horizon.test.clinical-result-recipe',
  findingProjectionHorizonFingerprint:
    'fingerprint.finding.projection-horizon.fnv1a64.0000000000000003',
  universalActionResultAssemblyRecipeRef: {
    id: 'universal-action-result-assembly.test.clinical-result-recipe',
    contentVersion: '1.0.0',
  },
  universalActionResultAssemblyRecipeFingerprint:
    'fingerprint.universal-action-result.assembly-recipe.fnv1a64.0000000000000004',
  compatibleLocationRefs: [
    {
      id: 'location.test.outpatient-clinical-result-recipe',
      contentVersion: '1.0.0',
    },
  ],
  requiredConditions: [
    {
      schemaVersion: 1,
      id: 'template-condition.test.clinical-result-recipe',
      diagnosisDefinitionId: 'diagnosis.test.clinical-result-recipe',
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      encounterRelevance: 'focus',
      severityId: null,
      specifierIds: [],
    },
  ],
  optionalConditionSelectionGroups: [],
  complexityProfile: {
    modelVersion: 'additional-feature-budget.v1',
    measurementStatus: 'budget_only',
    additionalFeatureBudget: 3,
    maximumSelectedModules: 3,
    selectedModules: [],
    targetEnvelope: null,
  },
  presentationRichnessEnvelope: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'presentation-richness.test.clinical-result-recipe',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['diagnostic_attribution'],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const approvedTemplate = PatientTemplateSchema.parse({
  ...template,
  id: 'patient-template.test.clinical-result-recipe.approved',
  internalLabel: 'Synthetic approved recipe-horizon template',
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
  review: {
    status: 'approved',
    reviewerId: 'reviewer.test.recipe-horizon',
    reviewedAt: '2026-08-03T00:00:00.000Z',
    sourceUseNoteIds: [],
  },
});

const collectedResults = compileOrThrow(request());
const generatedCollectedResults = compileOrThrow(
  request({
    measurementCompilations: [generatedWeightCompilation, heightCompilation],
  }),
);
const generatedObservationCollectedResults = compileOrThrow(
  request({
    categoricalObservationCompilations: [generatedObservationCompilation],
  }),
);

const directRecipeMembers: PatientTemplateClinicalResultRecipe['directMembers'] = [
  {
    schemaVersion: 1,
    id: 'clinical-result-recipe-member.test.generated-numeric',
    kind: 'generated_numeric_test',
    testDefinitionRef: {
      id: numericTestDefinition.id,
      contentVersion: numericTestDefinition.contentVersion,
    },
    sourceDefinitionRef: numericCompilation.compileRequest.sourceDefinitionRef,
    timeScopeId: numericCompilation.compileRequest.timeScopeId,
  },
  {
    schemaVersion: 1,
    id: 'clinical-result-recipe-member.test.patient-owned-test',
    kind: 'patient_owned_test',
    testDefinitionRef: {
      id: patientOwnedTestDefinition.id,
      contentVersion: patientOwnedTestDefinition.contentVersion,
    },
    resultProfileRef: {
      id: patientOwnedTestCompilation.compileRequest.resultProfile.id,
      contentVersion: patientOwnedTestCompilation.compileRequest.resultProfile.contentVersion,
    },
    sourceDefinitionRef: patientOwnedTestCompilation.compileRequest.sourceDefinitionRef,
    timeScopeId: patientOwnedTestCompilation.compileRequest.timeScopeId,
  },
  {
    schemaVersion: 1,
    id: 'clinical-result-recipe-member.test.height',
    kind: 'measurement',
    measurementDefinitionRef: {
      id: measurementDefinitions[0]!.id,
      contentVersion: measurementDefinitions[0]!.contentVersion,
    },
    valueProfileRef: {
      id: heightCompilation.compileRequest.valueProfile.id,
      contentVersion: heightCompilation.compileRequest.valueProfile.contentVersion,
    },
    sourceDefinitionRef: heightCompilation.compileRequest.sourceDefinitionRef,
    timeScopeId: heightCompilation.compileRequest.timeScopeId,
  },
  {
    schemaVersion: 1,
    id: 'clinical-result-recipe-member.test.weight',
    kind: 'measurement',
    measurementDefinitionRef: {
      id: measurementDefinitions[1]!.id,
      contentVersion: measurementDefinitions[1]!.contentVersion,
    },
    valueProfileRef: {
      id: weightCompilation.compileRequest.valueProfile.id,
      contentVersion: weightCompilation.compileRequest.valueProfile.contentVersion,
    },
    sourceDefinitionRef: weightCompilation.compileRequest.sourceDefinitionRef,
    timeScopeId: weightCompilation.compileRequest.timeScopeId,
  },
  {
    schemaVersion: 1,
    id: 'clinical-result-recipe-member.test.observation',
    kind: 'categorical_observation',
    observationDefinitionRef: {
      id: observationDefinition.id,
      contentVersion: observationDefinition.contentVersion,
    },
    valueProfileRef: {
      id: observationCompilation.compileRequest.valueProfile.id,
      contentVersion: observationCompilation.compileRequest.valueProfile.contentVersion,
    },
    sourceDefinitionRef: observationCompilation.compileRequest.sourceDefinitionRef,
    timeScopeId: observationCompilation.compileRequest.timeScopeId,
  },
];

const generatedDirectRecipeMembers: PatientTemplateClinicalResultRecipe['directMembers'] =
  directRecipeMembers.map((member) =>
    member.id === 'clinical-result-recipe-member.test.weight'
      ? {
          schemaVersion: 1,
          id: member.id,
          kind: 'generated_measurement',
          measurementDefinitionRef: {
            id: generatedWeightCompilation.compileRequest.measurementDefinition.id,
            contentVersion:
              generatedWeightCompilation.compileRequest.measurementDefinition.contentVersion,
          },
          generationProfileRefs: generatedWeightCompilation.compileRequest.generationProfiles.map(
            (profile) => ({
              id: profile.id,
              contentVersion: profile.contentVersion,
            }),
          ),
          sourceDefinitionRef: generatedWeightCompilation.compileRequest.sourceDefinitionRef,
          timeScopeId: generatedWeightCompilation.compileRequest.timeScopeId,
        }
      : member,
  );

const generatedObservationDirectRecipeMembers: PatientTemplateClinicalResultRecipe['directMembers'] =
  directRecipeMembers.map((member) =>
    member.id === 'clinical-result-recipe-member.test.observation'
      ? {
          schemaVersion: 1,
          id: member.id,
          kind: 'generated_categorical_observation',
          observationDefinitionRef: {
            id: generatedObservationCompilation.compileRequest.observationDefinition.id,
            contentVersion:
              generatedObservationCompilation.compileRequest.observationDefinition.contentVersion,
          },
          generationProfileRefs:
            generatedObservationCompilation.compileRequest.generationProfiles.map((profile) => ({
              id: profile.id,
              contentVersion: profile.contentVersion,
            })),
          sourceDefinitionRef: generatedObservationCompilation.compileRequest.sourceDefinitionRef,
          timeScopeId: generatedObservationCompilation.compileRequest.timeScopeId,
        }
      : member,
  );

const clinicalResultRecipe = (
  overrides: Partial<PatientTemplateClinicalResultRecipe> = {},
): PatientTemplateClinicalResultRecipe =>
  PatientTemplateClinicalResultRecipeSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-template-clinical-result-recipe.test.base',
    templateRef: {
      id: template.id,
      contentVersion: template.contentVersion,
    },
    templateFingerprint: fingerprintModePatientTemplateHorizonTemplate(template),
    directMembers: directRecipeMembers,
    derivedMeasurements: [],
    medicalReviewStatus: 'unreviewed',
    review: unreviewed,
    ...overrides,
  });

const compileRecipeHorizonFor = (
  targetTemplate: typeof template,
  recipe: PatientTemplateClinicalResultRecipe,
): PatientTemplateClinicalResultRecipeHorizonArtifact => {
  const templateHorizon = compileModePatientTemplateHorizon({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'mode-patient-template-horizon-request.test.clinical-result-recipe-compilation',
    modelVersion: 'mode-patient-template-horizon.v1',
    mode: 'developer',
    approvedTemplates:
      targetTemplate.lifecycle === 'approved' ? [targetTemplate] : [approvedTemplate],
    explicitReviewTemplates: targetTemplate.lifecycle === 'review' ? [targetTemplate] : [],
  });
  if (!templateHorizon.ok) throw new Error(templateHorizon.error.message);
  const recipeHorizon = compilePatientTemplateClinicalResultRecipeHorizon({
    schemaVersion: 1,
    id: 'patient-template-clinical-result-recipe-horizon-request.test.compilation',
    templateHorizonArtifact: templateHorizon.value,
    recipes: [recipe],
  });
  if (!recipeHorizon.ok) throw new Error(recipeHorizon.error.message);
  return recipeHorizon.value;
};

type RecipeRequestOverrides = Partial<
  Omit<PatientTemplateClinicalResultRecipeCompilationRequest, 'recipeHorizonArtifact'>
> & {
  readonly recipe?: PatientTemplateClinicalResultRecipe;
  readonly recipeHorizonArtifact?: PatientTemplateClinicalResultRecipeHorizonArtifact;
};

const recipeRequest = (
  overrides: RecipeRequestOverrides = {},
): PatientTemplateClinicalResultRecipeCompilationRequest => {
  const { recipe = clinicalResultRecipe(), recipeHorizonArtifact, ...requestOverrides } = overrides;
  const targetTemplate = requestOverrides.template ?? template;
  return {
    schemaVersion: 1,
    id: 'patient-template-clinical-result-recipe-request.test.base',
    patientStateId,
    template: targetTemplate,
    recipeHorizonArtifact: recipeHorizonArtifact ?? compileRecipeHorizonFor(targetTemplate, recipe),
    resultCollectionCompilation: collectedResults,
    derivedMeasurementMaterializations: [],
    ...requestOverrides,
  };
};

const compileRecipeOrThrow = (input: PatientTemplateClinicalResultRecipeCompilationRequest) => {
  const compiled = compilePatientTemplateClinicalResultRecipe(input);
  if (!compiled.ok) throw new Error(`${compiled.error.code}: ${compiled.error.message}`);
  return compiled.value;
};

const bmiDerivation = compileBodyMassIndexDerivation({
  schemaVersion: 1,
  id: 'body-mass-index-derivation-request.test.result-recipe',
  patientStateId,
  derivationDefinition: bmiDerivationDefinition,
  heightMeasurementDefinition: measurementDefinitions[0]!,
  weightMeasurementDefinition: measurementDefinitions[1]!,
  outputMeasurementDefinition: measurementDefinitions[2]!,
  resultCollectionCompilation: collectedResults,
  heightResolvedMeasurementId: heightCompilation.resolvedMeasurement.id,
  weightResolvedMeasurementId: weightCompilation.resolvedMeasurement.id,
});
if (!bmiDerivation.ok) throw new Error(bmiDerivation.error.message);

const bmiMaterialization = materializeBodyMassIndexMeasurement({
  schemaVersion: 1,
  id: 'body-mass-index-materialization-request.test.result-recipe',
  derivationCompilation: bmiDerivation.value,
});
if (!bmiMaterialization.ok) throw new Error(bmiMaterialization.error.message);

const bmiRecipe = {
  schemaVersion: 1 as const,
  id: 'clinical-result-recipe-member.test.bmi',
  kind: 'body_mass_index' as const,
  derivationDefinitionRef: {
    id: bmiDerivationDefinition.id,
    contentVersion: bmiDerivationDefinition.contentVersion,
  },
  heightMeasurementMemberId: 'clinical-result-recipe-member.test.height',
  weightMeasurementMemberId: 'clinical-result-recipe-member.test.weight',
  outputMeasurementDefinitionRef: {
    id: measurementDefinitions[2]!.id,
    contentVersion: measurementDefinitions[2]!.contentVersion,
  },
};

describe('D-320 patient-template clinical-result recipe compiler', () => {
  it('binds all four direct result kinds to one exact template-owned recipe and replays', () => {
    const artifact = compileRecipeOrThrow(recipeRequest());

    expect(artifact.templateRef).toEqual({
      id: template.id,
      contentVersion: template.contentVersion,
      fingerprint: fingerprintModePatientTemplateHorizonTemplate(template),
    });
    expect(artifact.recipeHorizonRef).toEqual({
      id: artifact.compileRequest.recipeHorizonArtifact.id,
      inputFingerprint: artifact.compileRequest.recipeHorizonArtifact.inputFingerprint,
      payloadFingerprint: artifact.compileRequest.recipeHorizonArtifact.payloadFingerprint,
    });
    expect(artifact.directMemberBindings.map((binding) => binding.kind).sort()).toEqual([
      'categorical_observation',
      'generated_numeric_test',
      'measurement',
      'measurement',
      'patient_owned_test',
    ]);
    expect(artifact.directMemberBindings.map((binding) => binding.recipeMemberId)).toEqual(
      artifact.directMemberBindings.map((binding) => binding.recipeMemberId).sort(),
    );
    expect(artifact.derivedMeasurementBindings).toEqual([]);
    expect(verifyPatientTemplateClinicalResultRecipeCompilationIntegrity(artifact).ok).toBe(true);
    expect(compilePatientTemplateClinicalResultRecipe(recipeRequest())).toEqual({
      ok: true,
      value: artifact,
    });
    expect(JSON.stringify(artifact.compileRequest.recipeHorizonArtifact.recipes)).not.toMatch(
      /formulary|probability|points?|score|runtime/i,
    );
  });

  it('requires exact D-322 recipe discovery and rejects the legacy raw-recipe request', () => {
    const templateHorizon = compileModePatientTemplateHorizon({
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'mode-patient-template-horizon-request.test.missing-clinical-result-recipe',
      modelVersion: 'mode-patient-template-horizon.v1',
      mode: 'developer',
      approvedTemplates: [approvedTemplate],
      explicitReviewTemplates: [template],
    });
    if (!templateHorizon.ok) throw new Error(templateHorizon.error.message);
    const missingRecipeHorizon = compilePatientTemplateClinicalResultRecipeHorizon({
      schemaVersion: 1,
      id: 'patient-template-clinical-result-recipe-horizon-request.test.missing',
      templateHorizonArtifact: templateHorizon.value,
      recipes: [],
    });
    if (!missingRecipeHorizon.ok) throw new Error(missingRecipeHorizon.error.message);

    expect(
      compilePatientTemplateClinicalResultRecipe(
        recipeRequest({ recipeHorizonArtifact: missingRecipeHorizon.value }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'RECIPE_NOT_AVAILABLE' },
    });

    const legacyRequest = {
      ...recipeRequest(),
      recipe: clinicalResultRecipe(),
    } as Record<string, unknown>;
    delete legacyRequest.recipeHorizonArtifact;
    expect(compilePatientTemplateClinicalResultRecipe(legacyRequest)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('binds a generated measurement only through its exact full D-335 profile horizon', () => {
    const generatedRecipe = clinicalResultRecipe({
      directMembers: generatedDirectRecipeMembers,
    });
    const artifact = compileRecipeOrThrow(
      recipeRequest({
        recipe: generatedRecipe,
        resultCollectionCompilation: generatedCollectedResults,
      }),
    );
    const generatedBinding = artifact.directMemberBindings.find(
      (binding) => binding.kind === 'generated_measurement',
    );

    expect(generatedBinding).toMatchObject({
      recipeMemberId: 'clinical-result-recipe-member.test.weight',
      kind: 'generated_measurement',
      compilationRef: {
        id: generatedWeightCompilation.id,
        payloadFingerprint: generatedWeightCompilation.payloadFingerprint,
      },
      resolvedRecordId: generatedWeightCompilation.resolvedMeasurement.id,
    });
    expect(verifyPatientTemplateClinicalResultRecipeCompilationIntegrity(artifact).ok).toBe(true);

    const crossedMembers = structuredClone(generatedDirectRecipeMembers);
    const generatedWeight = crossedMembers.find(
      (member) => member.kind === 'generated_measurement',
    );
    if (generatedWeight?.kind !== 'generated_measurement') {
      throw new Error('Missing generated weight recipe member.');
    }
    generatedWeight.generationProfileRefs.push({
      id: 'measurement-generation-profile.test.collection.unowned',
      contentVersion: '1.0.0',
    });
    expect(
      compilePatientTemplateClinicalResultRecipe(
        recipeRequest({
          recipe: clinicalResultRecipe({ directMembers: crossedMembers }),
          resultCollectionCompilation: generatedCollectedResults,
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'DIRECT_MEMBER_MISMATCH' },
    });

    expect(
      compilePatientTemplateClinicalResultRecipe(
        recipeRequest({
          resultCollectionCompilation: generatedCollectedResults,
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'DIRECT_MEMBER_MISMATCH' },
    });
  });

  it('binds a generated observation only through its exact full D-356 profile horizon', () => {
    const generatedRecipe = clinicalResultRecipe({
      directMembers: generatedObservationDirectRecipeMembers,
    });
    const artifact = compileRecipeOrThrow(
      recipeRequest({
        recipe: generatedRecipe,
        resultCollectionCompilation: generatedObservationCollectedResults,
      }),
    );
    const generatedBinding = artifact.directMemberBindings.find(
      (binding) => binding.kind === 'generated_categorical_observation',
    );

    expect(generatedBinding).toMatchObject({
      recipeMemberId: 'clinical-result-recipe-member.test.observation',
      kind: 'generated_categorical_observation',
      compilationRef: {
        id: generatedObservationCompilation.id,
        payloadFingerprint: generatedObservationCompilation.payloadFingerprint,
      },
      resolvedRecordId: generatedObservationCompilation.resolvedObservation.id,
    });
    expect(verifyPatientTemplateClinicalResultRecipeCompilationIntegrity(artifact).ok).toBe(true);

    const selectedProfileOnlyMembers = structuredClone(generatedObservationDirectRecipeMembers);
    const generatedObservation = selectedProfileOnlyMembers.find(
      (member) => member.kind === 'generated_categorical_observation',
    );
    if (generatedObservation?.kind !== 'generated_categorical_observation') {
      throw new Error('Missing generated observation recipe member.');
    }
    generatedObservation.generationProfileRefs = generatedObservation.generationProfileRefs.filter(
      (profileRef) => profileRef.id === generatedObservationCompilation.selectedProfileRef.id,
    );
    expect(generatedObservation.generationProfileRefs).toHaveLength(1);
    expect(
      compilePatientTemplateClinicalResultRecipe(
        recipeRequest({
          recipe: clinicalResultRecipe({ directMembers: selectedProfileOnlyMembers }),
          resultCollectionCompilation: generatedObservationCollectedResults,
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'DIRECT_MEMBER_MISMATCH' },
    });

    expect(
      compilePatientTemplateClinicalResultRecipe(
        recipeRequest({
          resultCollectionCompilation: generatedObservationCollectedResults,
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'DIRECT_MEMBER_MISMATCH' },
    });
  });

  it('normalizes recipe order while retaining exact one-to-one direct collection coverage', () => {
    const reversedRecipe = clinicalResultRecipe({
      directMembers: [...directRecipeMembers].reverse(),
    });
    expect(
      compileRecipeOrThrow(
        recipeRequest({
          recipe: reversedRecipe,
        }),
      ),
    ).toEqual(compileRecipeOrThrow(recipeRequest()));

    const missingMemberRecipe = clinicalResultRecipe({
      directMembers: directRecipeMembers.slice(0, -1),
    });
    expect(
      compilePatientTemplateClinicalResultRecipe(
        recipeRequest({
          recipe: missingMemberRecipe,
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'DIRECT_COLLECTION_COVERAGE_MISMATCH' },
    });
  });

  it('rejects a stale template payload and an unmatched exact profile reference', () => {
    const changedTemplate = structuredClone(template);
    changedTemplate.internalLabel = 'Changed exact template';
    const originalRecipeHorizon = recipeRequest().recipeHorizonArtifact;
    expect(
      compilePatientTemplateClinicalResultRecipe(
        recipeRequest({
          template: changedTemplate,
          recipeHorizonArtifact: originalRecipeHorizon,
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'TEMPLATE_FINGERPRINT_MISMATCH' },
    });

    const changedMembers = structuredClone(directRecipeMembers);
    const height = changedMembers.find((member) => member.id.endsWith('.height'));
    if (height?.kind !== 'measurement') throw new Error('Missing height recipe member.');
    height.valueProfileRef.id = 'patient-owned-measurement-profile.test.unmatched';
    expect(
      compilePatientTemplateClinicalResultRecipe(
        recipeRequest({
          recipe: clinicalResultRecipe({ directMembers: changedMembers }),
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'DIRECT_MEMBER_MISMATCH' },
    });
  });

  it('binds BMI only to its exact height/weight members and exact D-310 collection', () => {
    const recipe = clinicalResultRecipe({
      derivedMeasurements: [bmiRecipe],
    });
    const artifact = compileRecipeOrThrow(
      recipeRequest({
        recipe,
        derivedMeasurementMaterializations: [bmiMaterialization.value],
      }),
    );

    expect(artifact.derivedMeasurementBindings).toEqual([
      {
        schemaVersion: 1,
        recipeMemberId: bmiRecipe.id,
        materializationRef: {
          id: bmiMaterialization.value.id,
          payloadFingerprint: bmiMaterialization.value.payloadFingerprint,
        },
        resolvedMeasurementId: bmiMaterialization.value.resolvedMeasurement.id,
        inputRecipeMemberIds: [
          bmiRecipe.heightMeasurementMemberId,
          bmiRecipe.weightMeasurementMemberId,
        ],
        inputResolvedMeasurementIds: [
          heightCompilation.resolvedMeasurement.id,
          weightCompilation.resolvedMeasurement.id,
        ],
      },
    ]);
    expect(verifyPatientTemplateClinicalResultRecipeCompilationIntegrity(artifact).ok).toBe(true);

    expect(
      compilePatientTemplateClinicalResultRecipe(
        recipeRequest({
          recipe: clinicalResultRecipe({
            derivedMeasurements: [
              {
                ...bmiRecipe,
                heightMeasurementMemberId: bmiRecipe.weightMeasurementMemberId,
                weightMeasurementMemberId: bmiRecipe.heightMeasurementMemberId,
              },
            ],
          }),
          derivedMeasurementMaterializations: [bmiMaterialization.value],
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'DERIVED_MEMBER_MISMATCH' },
    });
  });

  it('rejects unowned derived materializations and detects binding tampering', () => {
    expect(
      compilePatientTemplateClinicalResultRecipe(
        recipeRequest({
          derivedMeasurementMaterializations: [bmiMaterialization.value],
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'DERIVED_COLLECTION_COVERAGE_MISMATCH' },
    });

    const artifact = compileRecipeOrThrow(recipeRequest());
    const changedBinding = structuredClone(artifact);
    changedBinding.directMemberBindings[0]!.resolvedRecordId = 'resolved-record.test.tampered';
    expect(
      verifyPatientTemplateClinicalResultRecipeCompilationIntegrity(changedBinding),
    ).toMatchObject({
      ok: false,
      error: { code: 'PAYLOAD_FINGERPRINT_MISMATCH' },
    });
  });
});

const recipeTemplateHorizon = (() => {
  const compiled = compileModePatientTemplateHorizon({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'mode-patient-template-horizon-request.test.clinical-result-recipes',
    modelVersion: 'mode-patient-template-horizon.v1',
    mode: 'developer',
    approvedTemplates: [approvedTemplate],
    explicitReviewTemplates: [template],
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
})();

const recipeForTemplate = (
  targetTemplate: typeof template,
  id: string,
  directMembers: PatientTemplateClinicalResultRecipe['directMembers'] = directRecipeMembers,
): PatientTemplateClinicalResultRecipe =>
  clinicalResultRecipe({
    id,
    templateRef: {
      id: targetTemplate.id,
      contentVersion: targetTemplate.contentVersion,
    },
    templateFingerprint: fingerprintModePatientTemplateHorizonTemplate(targetTemplate),
    directMembers,
  });

const compileRecipeHorizonOrThrow = (recipes: PatientTemplateClinicalResultRecipe[]) => {
  const compiled = compilePatientTemplateClinicalResultRecipeHorizon({
    schemaVersion: 1,
    id: 'patient-template-clinical-result-recipe-horizon-request.test.base',
    templateHorizonArtifact: recipeTemplateHorizon,
    recipes,
  });
  if (!compiled.ok) throw new Error(`${compiled.error.code}: ${compiled.error.message}`);
  return compiled.value;
};

describe('D-322 exact-template clinical-result recipe horizon', () => {
  it('retains one member per mode template and reports missing recipe coverage without inventing one', () => {
    const approvedRecipe = recipeForTemplate(
      approvedTemplate,
      'patient-template-clinical-result-recipe.test.approved',
    );
    const artifact = compileRecipeHorizonOrThrow([approvedRecipe]);

    expect(PatientTemplateClinicalResultRecipeHorizonArtifactSchema.parse(artifact)).toEqual(
      artifact,
    );
    expect(artifact.coverageStatus).toBe('incomplete');
    expect(artifact.members).toHaveLength(2);
    expect(artifact.members.filter((member) => member.coverageStatus === 'bound')).toHaveLength(1);
    const missingMember = artifact.members.find(
      (member) => member.coverageStatus === 'missing_recipe',
    );
    expect(missingMember?.templateRef.id).toBe(template.id);
    expect(
      resolvePatientTemplateClinicalResultRecipeFromHorizon({
        artifact,
        templateRef: {
          id: template.id,
          contentVersion: template.contentVersion,
        },
        templateFingerprint: fingerprintModePatientTemplateHorizonTemplate(template),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'RECIPE_MISSING' },
    });
    expect(verifyPatientTemplateClinicalResultRecipeHorizonIntegrity(artifact).ok).toBe(true);
  });

  it('binds complete coverage deterministically and resolves an exact recipe payload', () => {
    const approvedRecipe = recipeForTemplate(
      approvedTemplate,
      'patient-template-clinical-result-recipe.test.approved',
    );
    const reviewRecipe = recipeForTemplate(
      template,
      'patient-template-clinical-result-recipe.test.review',
    );
    const artifact = compileRecipeHorizonOrThrow([reviewRecipe, approvedRecipe]);
    const reordered = compileRecipeHorizonOrThrow([approvedRecipe, reviewRecipe]);

    expect(reordered).toEqual(artifact);
    expect(artifact.coverageStatus).toBe('complete');
    const resolution = resolvePatientTemplateClinicalResultRecipeFromHorizon({
      artifact,
      templateRef: {
        id: template.id,
        contentVersion: template.contentVersion,
      },
      templateFingerprint: fingerprintModePatientTemplateHorizonTemplate(template),
    });
    expect(resolution).toEqual({
      ok: true,
      value: {
        member: artifact.members.find((member) => member.templateRef.id === template.id),
        recipe: artifact.recipes.find((recipe) => recipe.id === reviewRecipe.id),
      },
    });
    expect(JSON.stringify(artifact)).not.toMatch(/points?|score|probability|formulary/i);
  });

  it('rejects an orphan recipe and two recipes that claim the same exact template', () => {
    const orphanTemplate = {
      ...template,
      id: 'patient-template.test.clinical-result-recipe.orphan',
    };
    expect(
      compilePatientTemplateClinicalResultRecipeHorizon({
        schemaVersion: 1,
        id: 'patient-template-clinical-result-recipe-horizon-request.test.orphan',
        templateHorizonArtifact: recipeTemplateHorizon,
        recipes: [
          recipeForTemplate(orphanTemplate, 'patient-template-clinical-result-recipe.test.orphan'),
        ],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'RECIPE_TEMPLATE_MISMATCH' },
    });

    expect(
      compilePatientTemplateClinicalResultRecipeHorizon({
        schemaVersion: 1,
        id: 'patient-template-clinical-result-recipe-horizon-request.test.duplicate',
        templateHorizonArtifact: recipeTemplateHorizon,
        recipes: [
          recipeForTemplate(template, 'patient-template-clinical-result-recipe.test.duplicate-a'),
          recipeForTemplate(template, 'patient-template-clinical-result-recipe.test.duplicate-b'),
        ],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'DUPLICATE_TEMPLATE_RECIPE' },
    });
  });

  it('detects horizon tampering and does not resolve a template outside the exact horizon', () => {
    const artifact = compileRecipeHorizonOrThrow([]);
    const tampered = structuredClone(artifact);
    tampered.members[0]!.templateFingerprint =
      'fingerprint.mode-patient-template-horizon.template.fnv1a64.0000000000000000';
    expect(verifyPatientTemplateClinicalResultRecipeHorizonIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'PAYLOAD_FINGERPRINT_MISMATCH' },
    });
    expect(
      resolvePatientTemplateClinicalResultRecipeFromHorizon({
        artifact,
        templateRef: {
          id: 'patient-template.test.not-in-horizon',
          contentVersion: '1.0.0',
        },
        templateFingerprint:
          'fingerprint.mode-patient-template-horizon.template.fnv1a64.0000000000000000',
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'TEMPLATE_NOT_FOUND' },
    });
  });
});

const clinicalResultResourceSet = (
  overrides: Partial<ReturnType<typeof PatientClinicalResultResourceSetSchema.parse>> = {},
) =>
  PatientClinicalResultResourceSetSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-clinical-result-resource-set.test.complete',
    testDefinitions: [numericTestDefinition, patientOwnedTestDefinition],
    referenceIntervalSets: [referenceIntervalSet],
    patientOwnedTestResultProfiles: [patientOwnedTestCompilation.compileRequest.resultProfile],
    measurementDefinitions,
    patientOwnedMeasurementValueProfiles: [
      heightCompilation.compileRequest.valueProfile,
      weightCompilation.compileRequest.valueProfile,
    ],
    generatedMeasurementValueProfiles: [],
    categoricalObservationDefinitions: [observationDefinition],
    patientOwnedCategoricalObservationValueProfiles: [
      observationCompilation.compileRequest.valueProfile,
    ],
    generatedCategoricalObservationValueProfiles: [],
    bodyMassIndexDerivationDefinitions: [bmiDerivationDefinition],
    sourceDefinitionCatalog,
    ...overrides,
  });

const completeRecipeHorizon = compileRecipeHorizonOrThrow([
  recipeForTemplate(
    approvedTemplate,
    'patient-template-clinical-result-recipe.test.resource-coverage.approved',
  ),
  recipeForTemplate(
    template,
    'patient-template-clinical-result-recipe.test.resource-coverage.review',
  ),
]);

const compileResourceCoverageOrThrow = (
  recipeHorizonArtifact = completeRecipeHorizon,
  resourceSet = clinicalResultResourceSet(),
) => {
  const compiled = compilePatientTemplateClinicalResultResourceCoverage({
    schemaVersion: 1,
    id: 'patient-template-clinical-result-resource-coverage-request.test.base',
    recipeHorizonArtifact,
    resourceSet,
  });
  if (!compiled.ok) throw new Error(`${compiled.error.code}: ${compiled.error.message}`);
  return compiled.value;
};

describe('D-324 clinical-result recipe resource coverage', () => {
  it('audits every exact bound recipe member against one finite resource set and replays', () => {
    const artifact = compileResourceCoverageOrThrow();

    expect(PatientTemplateClinicalResultResourceCoverageArtifactSchema.parse(artifact)).toEqual(
      artifact,
    );
    expect(artifact.coverageStatus).toBe('complete');
    expect(artifact.templateCoverage).toHaveLength(2);
    expect(
      artifact.templateCoverage.every(
        (coverage) =>
          coverage.coverageStatus === 'complete' &&
          coverage.memberCoverage.length === directRecipeMembers.length,
      ),
    ).toBe(true);
    const numericCoverage = artifact.templateCoverage[0]!.memberCoverage.find(
      (coverage) => coverage.recipeMemberKind === 'generated_numeric_test',
    );
    expect(numericCoverage?.requirements).toContainEqual({
      kind: 'reference_interval_set',
      requestedId: referenceIntervalSet.id,
      requestedContentVersion: null,
      status: 'resolved',
      resolvedContentVersion: referenceIntervalSet.contentVersion,
    });
    expect(verifyPatientTemplateClinicalResultResourceCoverageIntegrity(artifact).ok).toBe(true);
    expect(artifact).not.toHaveProperty('pointRules');
    expect(artifact).not.toHaveProperty('score');
    expect(artifact).not.toHaveProperty('runtimeAttachment');
    expect(artifact).not.toHaveProperty('formulary');
    expect(artifact.templateCoverage[0]).not.toHaveProperty('pointRules');
    expect(artifact.templateCoverage[0]).not.toHaveProperty('score');
  });

  it('requires every exact generated-observation profile in the recipe-owned horizon', () => {
    const generatedRecipeHorizon = compileRecipeHorizonOrThrow([
      recipeForTemplate(
        approvedTemplate,
        'patient-template-clinical-result-recipe.test.generated-observation-coverage.approved',
        generatedObservationDirectRecipeMembers,
      ),
      recipeForTemplate(
        template,
        'patient-template-clinical-result-recipe.test.generated-observation-coverage.review',
        generatedObservationDirectRecipeMembers,
      ),
    ]);
    const generationProfiles = generatedObservationCompilation.compileRequest.generationProfiles;
    const complete = compileResourceCoverageOrThrow(
      generatedRecipeHorizon,
      clinicalResultResourceSet({
        generatedCategoricalObservationValueProfiles: generationProfiles,
      }),
    );

    expect(complete.coverageStatus).toBe('complete');
    expect(
      complete.templateCoverage.every(
        (coverage) =>
          coverage.memberCoverage
            .find((member) => member.recipeMemberKind === 'generated_categorical_observation')
            ?.requirements.filter(
              (requirement) =>
                requirement.kind === 'generated_categorical_observation_value_profile',
            ).length === generationProfiles.length,
      ),
    ).toBe(true);

    const incomplete = compileResourceCoverageOrThrow(
      generatedRecipeHorizon,
      clinicalResultResourceSet({
        generatedCategoricalObservationValueProfiles: generationProfiles.slice(0, 1),
      }),
    );
    expect(incomplete.coverageStatus).toBe('incomplete');
    expect(
      incomplete.templateCoverage.flatMap((coverage) =>
        coverage.memberCoverage
          .filter((member) => member.recipeMemberKind === 'generated_categorical_observation')
          .flatMap((member) =>
            member.requirements.filter(
              (requirement) =>
                requirement.kind === 'generated_categorical_observation_value_profile' &&
                requirement.status === 'missing',
            ),
          ),
      ),
    ).toEqual([
      {
        kind: 'generated_categorical_observation_value_profile',
        requestedId: generationProfiles[1]!.id,
        requestedContentVersion: generationProfiles[1]!.contentVersion,
        status: 'missing',
        resolvedContentVersion: null,
      },
      {
        kind: 'generated_categorical_observation_value_profile',
        requestedId: generationProfiles[1]!.id,
        requestedContentVersion: generationProfiles[1]!.contentVersion,
        status: 'missing',
        resolvedContentVersion: null,
      },
    ]);
  });

  it('reports missing resources and missing recipes without deleting their templates', () => {
    const missingObservationProfile = compileResourceCoverageOrThrow(
      completeRecipeHorizon,
      clinicalResultResourceSet({
        patientOwnedCategoricalObservationValueProfiles: [],
        generatedCategoricalObservationValueProfiles: [],
      }),
    );
    expect(missingObservationProfile.coverageStatus).toBe('incomplete');
    expect(
      missingObservationProfile.templateCoverage.every(
        (coverage) => coverage.coverageStatus === 'missing_resources',
      ),
    ).toBe(true);
    expect(
      missingObservationProfile.templateCoverage[0]?.memberCoverage
        .find((coverage) => coverage.recipeMemberKind === 'categorical_observation')
        ?.requirements.find(
          (requirement) =>
            requirement.kind === 'patient_owned_categorical_observation_value_profile',
        ),
    ).toMatchObject({
      status: 'missing',
      resolvedContentVersion: null,
    });

    const missingRecipe = compileResourceCoverageOrThrow(
      compileRecipeHorizonOrThrow([
        recipeForTemplate(
          approvedTemplate,
          'patient-template-clinical-result-recipe.test.resource-coverage.only-approved',
        ),
      ]),
    );
    expect(missingRecipe.templateCoverage).toContainEqual(
      expect.objectContaining({
        templateRef: {
          id: template.id,
          contentVersion: template.contentVersion,
        },
        recipeRef: null,
        coverageStatus: 'recipe_missing',
        memberCoverage: [],
      }),
    );
  });

  it('normalizes resource order and rejects duplicate stable resource bins', () => {
    const reordered = clinicalResultResourceSet({
      testDefinitions: [patientOwnedTestDefinition, numericTestDefinition],
      measurementDefinitions: [...measurementDefinitions].reverse(),
    });
    expect(compileResourceCoverageOrThrow(completeRecipeHorizon, reordered)).toEqual(
      compileResourceCoverageOrThrow(),
    );

    expect(
      compilePatientTemplateClinicalResultResourceCoverage({
        schemaVersion: 1,
        id: 'patient-template-clinical-result-resource-coverage-request.test.duplicate',
        recipeHorizonArtifact: completeRecipeHorizon,
        resourceSet: {
          ...clinicalResultResourceSet(),
          testDefinitions: [numericTestDefinition, numericTestDefinition],
        },
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('detects retained coverage tampering', () => {
    const artifact = compileResourceCoverageOrThrow();
    const tampered = structuredClone(artifact);
    tampered.inputFingerprint =
      'fingerprint.patient-template-clinical-result-resource-coverage.input.fnv1a64.0000000000000000';
    expect(verifyPatientTemplateClinicalResultResourceCoverageIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'INPUT_FINGERPRINT_MISMATCH' },
    });
  });
});
