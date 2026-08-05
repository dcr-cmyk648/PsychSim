import {
  MeasurementCatalogSchema,
  PatientOwnedMeasurementValueProfileSchema,
  PatientSceneSourceDefinitionCatalogSchema,
} from '@psychsim/schemas';
import {
  compilePatientOwnedMeasurement,
  compilePatientSceneSourceInstancesFromCatalog,
  verifyPatientOwnedMeasurementCompilationIntegrity,
} from '@psychsim/engine/authoring';
import { describe, expect, it } from 'vitest';

import measurementCatalogJson from '../../../content/catalogs/measurements/definitions.json';
import sourceDefinitionsJson from '../../../content/catalogs/patient-scene-sources/definitions.json';

const measurementCatalog = MeasurementCatalogSchema.parse(measurementCatalogJson);
const sourceDefinitionCatalog =
  PatientSceneSourceDefinitionCatalogSchema.parse(sourceDefinitionsJson);
const patientStateId = 'resolved-patient-state.checked-in.patient-owned-measurements';
const sourceCompilationResult = compilePatientSceneSourceInstancesFromCatalog({
  schemaVersion: 1,
  id: 'catalog-patient-scene-source-instance-request.checked-in.patient-owned-measurements',
  patientStateId,
  sourceDefinitionCatalog,
});
if (!sourceCompilationResult.ok) {
  throw new Error(sourceCompilationResult.error.message);
}
const sourceInstanceCompilation = sourceCompilationResult.value;

describe('checked-in patient-owned measurement contracts', () => {
  it('admits every current measurement definition through an exact synthetic value and source role', () => {
    expect(measurementCatalog.measurements.map((definition) => definition.id)).toEqual([
      'measurement.vital.heart-rate',
      'measurement.vital.systolic-blood-pressure',
      'measurement.vital.diastolic-blood-pressure',
      'measurement.vital.respiratory-rate',
      'measurement.vital.temperature',
      'measurement.vital.oxygen-saturation',
      'measurement.anthropometric.height',
      'measurement.anthropometric.weight',
      'measurement.anthropometric.bmi',
    ]);

    for (const measurementDefinition of measurementCatalog.measurements) {
      const valueProfile = PatientOwnedMeasurementValueProfileSchema.parse({
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: `patient-owned-measurement-profile.checked-in.${measurementDefinition.id}`,
        measurementDefinitionRef: {
          id: measurementDefinition.id,
          contentVersion: measurementDefinition.contentVersion,
        },
        value: 1,
        displayValue: '1',
        contextValues: [],
        sourceUseNoteIds: [],
        medicalReviewStatus: 'unreviewed',
        review: {
          status: 'unreviewed',
          reviewerId: null,
          reviewedAt: null,
          sourceUseNoteIds: [],
        },
      });
      const request = {
        schemaVersion: 1 as const,
        id: `patient-owned-measurement-request.checked-in.${measurementDefinition.id}`,
        patientStateId,
        measurementDefinition,
        valueProfile,
        sourceDefinitionRef: {
          id: 'patient-scene-source-role.measurement.direct',
          contentVersion: '1.0.0',
        },
        sourceInstanceCompilation,
        timeScopeId: 'time-scope.current',
      };

      const first = compilePatientOwnedMeasurement(request);
      const replay = compilePatientOwnedMeasurement(request);
      expect(first.ok).toBe(true);
      expect(replay).toEqual(first);
      if (!first.ok) throw new Error(first.error.message);

      expect(first.value.resolvedMeasurement).toMatchObject({
        definitionId: measurementDefinition.id,
        definitionContentVersion: measurementDefinition.contentVersion,
        value: 1,
        displayValue: '1',
        unit: {
          display: measurementDefinition.unit.display,
          ucumCode: measurementDefinition.unit.ucumCode,
        },
        contextValues: [],
        source: {
          kind: 'measurement',
        },
        interpretation: {
          kind: 'not_interpreted',
        },
        resolution: {
          origin: 'authored',
          ownerId: valueProfile.id,
          ownerContentVersion: valueProfile.contentVersion,
        },
      });
      expect(verifyPatientOwnedMeasurementCompilationIntegrity(first.value).ok).toBe(true);
      expect(measurementDefinition.medicalReviewStatus).toBe('unreviewed');
      expect(JSON.stringify(first.value)).not.toMatch(/points?|score|clinical correctness/i);
    }
  });
});
