import {
  CategoricalObservationDefinitionSchema,
  MeasurementCatalogSchema,
  PatientOwnedCategoricalObservationValueProfileSchema,
  PatientOwnedMeasurementValueProfileSchema,
  PatientOwnedStructuredTestResultProfileSchema,
  PatientSceneSourceDefinitionCatalogSchema,
  ReferenceIntervalSetDefinitionSchema,
  TestDefinitionSchema,
} from '@psychsim/schemas';
import {
  compileNumericStructuredTestResult,
  compilePatientClinicalResultCollection,
  compilePatientOwnedCategoricalObservation,
  compilePatientOwnedMeasurement,
  compilePatientOwnedStructuredTestResult,
  compilePatientSceneSourceInstancesFromCatalog,
  verifyPatientClinicalResultCollectionCompilationIntegrity,
} from '@psychsim/engine/authoring';
import { describe, expect, it } from 'vitest';

import measurementCatalogJson from '../../../content/catalogs/measurements/definitions.json';
import pregnancyTestJson from '../../../content/catalogs/tests/definitions/pregnancy.test.json';
import tshTestJson from '../../../content/catalogs/tests/definitions/tsh.test.json';
import referenceIntervalSetsJson from '../../../content/catalogs/tests/reference-interval-sets.json';
import sourceDefinitionsJson from '../../../content/catalogs/patient-scene-sources/definitions.json';

const measurementCatalog = MeasurementCatalogSchema.parse(measurementCatalogJson);
const tshDefinition = TestDefinitionSchema.parse(tshTestJson);
const pregnancyDefinition = TestDefinitionSchema.parse(pregnancyTestJson);
const referenceIntervalSets =
  ReferenceIntervalSetDefinitionSchema.array().parse(referenceIntervalSetsJson);
const sourceDefinitionCatalog =
  PatientSceneSourceDefinitionCatalogSchema.parse(sourceDefinitionsJson);
const weightDefinition = measurementCatalog.measurements.find(
  (definition) => definition.id === 'measurement.anthropometric.weight',
)!;
const observationDefinition = CategoricalObservationDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'observation.synthetic.result-collection.appearance',
  label: 'Synthetic appearance',
  domain: 'mental_status_exam',
  allowedValueIds: ['observation-value.synthetic.result-collection.appearance'],
  availableThroughActionIds: ['info.physical.mental-status'],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const patientStateId = 'resolved-patient-state.checked-in.clinical-result-collection';
const sourceCompilation = compilePatientSceneSourceInstancesFromCatalog({
  schemaVersion: 1,
  id: 'catalog-patient-scene-source-instance-request.checked-in.result-collection',
  patientStateId,
  sourceDefinitionCatalog,
});
if (!sourceCompilation.ok) throw new Error(sourceCompilation.error.message);
const sourceInstanceCompilation = sourceCompilation.value;

const unreviewed = {
  status: 'unreviewed' as const,
  reviewerId: null,
  reviewedAt: null,
  sourceUseNoteIds: [],
};

const numericCompilation = compileNumericStructuredTestResult({
  schemaVersion: 1,
  id: 'numeric-structured-test-result-request.checked-in.collection-tsh',
  patientStateId,
  seed: 'seed.checked-in.collection-tsh',
  testDefinition: tshDefinition,
  generationContext: {
    ageYears: 42,
    sexForReference: 'female',
    diagnosisIds: [],
    clinicalTagIds: [],
  },
  referenceIntervalSets,
  sourceDefinitionRef: {
    id: 'patient-scene-source-role.laboratory.result',
    contentVersion: '1.0.0',
  },
  sourceInstanceCompilation,
  timeScopeId: 'time-scope.current',
});
if (!numericCompilation.ok) throw new Error(numericCompilation.error.message);

const pregnancyProfile = PatientOwnedStructuredTestResultProfileSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-owned-test-result-profile.checked-in.collection-pregnancy',
  testDefinitionRef: {
    id: pregnancyDefinition.id,
    contentVersion: pregnancyDefinition.contentVersion,
  },
  payload: {
    kind: 'binary',
    outcome: 'negative',
    displayValue: 'Synthetic contract fixture',
    interpretationIds: [],
  },
  sourceUseNoteIds: [],
  medicalReviewStatus: 'unreviewed',
  review: unreviewed,
});
const patientOwnedTestCompilation = compilePatientOwnedStructuredTestResult({
  schemaVersion: 1,
  id: 'patient-owned-test-result-request.checked-in.collection-pregnancy',
  patientStateId,
  testDefinition: pregnancyDefinition,
  resultProfile: pregnancyProfile,
  sourceDefinitionRef: {
    id: 'patient-scene-source-role.laboratory.result',
    contentVersion: '1.0.0',
  },
  sourceInstanceCompilation,
  timeScopeId: 'time-scope.current',
});
if (!patientOwnedTestCompilation.ok) {
  throw new Error(patientOwnedTestCompilation.error.message);
}

const weightProfile = PatientOwnedMeasurementValueProfileSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-owned-measurement-profile.checked-in.collection-weight',
  measurementDefinitionRef: {
    id: weightDefinition.id,
    contentVersion: weightDefinition.contentVersion,
  },
  value: 82.4,
  displayValue: '82.4',
  contextValues: [],
  sourceUseNoteIds: [],
  medicalReviewStatus: 'unreviewed',
  review: unreviewed,
});
const measurementCompilation = compilePatientOwnedMeasurement({
  schemaVersion: 1,
  id: 'patient-owned-measurement-request.checked-in.collection-weight',
  patientStateId,
  measurementDefinition: weightDefinition,
  valueProfile: weightProfile,
  sourceDefinitionRef: {
    id: 'patient-scene-source-role.measurement.direct',
    contentVersion: '1.0.0',
  },
  sourceInstanceCompilation,
  timeScopeId: 'time-scope.current',
});
if (!measurementCompilation.ok) throw new Error(measurementCompilation.error.message);

const observationProfile = PatientOwnedCategoricalObservationValueProfileSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-owned-observation-profile.synthetic.collection-appearance',
  observationDefinitionRef: {
    id: observationDefinition.id,
    contentVersion: observationDefinition.contentVersion,
  },
  valueId: observationDefinition.allowedValueIds[0],
  displayValue: 'Synthetic contract fixture',
  sourceUseNoteIds: [],
  medicalReviewStatus: 'unreviewed',
  review: unreviewed,
});
const observationCompilation = compilePatientOwnedCategoricalObservation({
  schemaVersion: 1,
  id: 'patient-owned-observation-request.synthetic.collection-appearance',
  patientStateId,
  observationDefinition,
  valueProfile: observationProfile,
  sourceDefinitionRef: {
    id: 'patient-scene-source-role.clinician.direct-observation',
    contentVersion: '1.0.0',
  },
  sourceInstanceCompilation,
  timeScopeId: 'time-scope.current',
});
if (!observationCompilation.ok) throw new Error(observationCompilation.error.message);

describe('checked-in patient clinical-result collection boundary', () => {
  it('collects real catalog contracts plus one synthetic observation without promoting content', () => {
    expect(measurementCatalog.categoricalObservations).toEqual([
      expect.objectContaining({
        id: 'observation.physical.body-habitus',
        domain: 'physical_exam',
        availableThroughActionIds: ['info.physical.weight-bmi'],
        lifecycle: 'review',
        medicalReviewStatus: 'unreviewed',
      }),
    ]);

    const request = {
      schemaVersion: 1 as const,
      id: 'patient-clinical-result-collection-request.checked-in.boundary',
      patientStateId,
      sourceInstanceCompilation,
      numericStructuredTestCompilations: [numericCompilation.value],
      patientOwnedStructuredTestCompilations: [patientOwnedTestCompilation.value],
      measurementCompilations: [measurementCompilation.value],
      categoricalObservationCompilations: [observationCompilation.value],
    };
    const first = compilePatientClinicalResultCollection(request);
    const replay = compilePatientClinicalResultCollection(request);
    expect(first.ok).toBe(true);
    expect(replay).toEqual(first);
    if (!first.ok) throw new Error(first.error.message);

    expect(first.value.members).toHaveLength(4);
    expect(
      first.value.structuredTestResults.map((result) => result.testDefinitionId).sort(),
    ).toEqual(['test.lab.pregnancy', 'test.lab.tsh']);
    expect(first.value.measurements[0]?.definitionId).toBe('measurement.anthropometric.weight');
    expect(first.value.categoricalObservations[0]?.definitionId).toBe(
      'observation.synthetic.result-collection.appearance',
    );
    expect(first.value.categoricalObservations[0]?.interpretationIds).toEqual([]);
    expect(verifyPatientClinicalResultCollectionCompilationIntegrity(first.value).ok).toBe(true);
    expect(JSON.stringify(first.value)).not.toMatch(
      /resolvedPatientState|patientInstance|points?|score|clinical correctness/i,
    );
  });
});
