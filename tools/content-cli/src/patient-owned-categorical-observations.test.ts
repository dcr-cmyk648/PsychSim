import {
  CategoricalObservationDefinitionSchema,
  MeasurementCatalogSchema,
  PatientOwnedCategoricalObservationValueProfileSchema,
  PatientSceneSourceDefinitionCatalogSchema,
} from '@psychsim/schemas';
import {
  compilePatientOwnedCategoricalObservation,
  compilePatientSceneSourceInstancesFromCatalog,
  verifyPatientOwnedCategoricalObservationCompilationIntegrity,
} from '@psychsim/engine/authoring';
import { describe, expect, it } from 'vitest';

import measurementCatalogJson from '../../../content/catalogs/measurements/definitions.json';
import sourceDefinitionsJson from '../../../content/catalogs/patient-scene-sources/definitions.json';

const measurementCatalog = MeasurementCatalogSchema.parse(measurementCatalogJson);
const sourceDefinitionCatalog =
  PatientSceneSourceDefinitionCatalogSchema.parse(sourceDefinitionsJson);
const patientStateId = 'resolved-patient-state.checked-in.patient-owned-observations';
const sourceCompilationResult = compilePatientSceneSourceInstancesFromCatalog({
  schemaVersion: 1,
  id: 'catalog-patient-scene-source-instance-request.checked-in.patient-owned-observations',
  patientStateId,
  sourceDefinitionCatalog,
});
if (!sourceCompilationResult.ok) {
  throw new Error(sourceCompilationResult.error.message);
}
const sourceInstanceCompilation = sourceCompilationResult.value;
const bodyHabitusDefinition = measurementCatalog.categoricalObservations.find(
  (definition) => definition.id === 'observation.physical.body-habitus',
)!;

const syntheticDefinitions = [
  CategoricalObservationDefinitionSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'observation.synthetic.mental-status',
    label: 'Synthetic mental-status observation',
    domain: 'mental_status_exam',
    allowedValueIds: [
      'observation-value.synthetic.mental-status.a',
      'observation-value.synthetic.mental-status.b',
    ],
    availableThroughActionIds: ['info.physical.mental-status'],
    lifecycle: 'review',
    medicalReviewStatus: 'unreviewed',
  }),
  CategoricalObservationDefinitionSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'observation.synthetic.physical-exam',
    label: 'Synthetic physical-exam observation',
    domain: 'physical_exam',
    allowedValueIds: [
      'observation-value.synthetic.physical-exam.a',
      'observation-value.synthetic.physical-exam.b',
    ],
    availableThroughActionIds: ['info.physical.general-examination'],
    lifecycle: 'review',
    medicalReviewStatus: 'unreviewed',
  }),
];

describe('checked-in categorical-observation compiler boundary', () => {
  it('pins body habitus as one neutral physical observation available through weight/BMI', () => {
    expect(measurementCatalog.categoricalObservations).toEqual([bodyHabitusDefinition]);
    expect(bodyHabitusDefinition).toMatchObject({
      contentVersion: '1.0.0',
      domain: 'physical_exam',
      availableThroughActionIds: ['info.physical.weight-bmi'],
      allowedValueIds: [
        'observation-value.body-habitus.lower-adiposity',
        'observation-value.body-habitus.no-marked-adiposity-or-muscularity',
        'observation-value.body-habitus.increased-adiposity',
        'observation-value.body-habitus.increased-muscularity',
        'observation-value.body-habitus.mixed-increased-adiposity-and-muscularity',
      ],
      medicalReviewStatus: 'unreviewed',
    });

    for (const valueId of bodyHabitusDefinition.allowedValueIds) {
      const valueProfile = PatientOwnedCategoricalObservationValueProfileSchema.parse({
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: `patient-owned-observation-profile.checked-in.${valueId}`,
        observationDefinitionRef: {
          id: bodyHabitusDefinition.id,
          contentVersion: bodyHabitusDefinition.contentVersion,
        },
        valueId,
        displayValue: valueId,
        sourceUseNoteIds: [],
        medicalReviewStatus: 'unreviewed',
        review: {
          status: 'unreviewed',
          reviewerId: null,
          reviewedAt: null,
          sourceUseNoteIds: [],
        },
      });
      const result = compilePatientOwnedCategoricalObservation({
        schemaVersion: 1,
        id: `patient-owned-observation-request.checked-in.${valueId}`,
        patientStateId,
        observationDefinition: bodyHabitusDefinition,
        valueProfile,
        sourceDefinitionRef: {
          id: 'patient-scene-source-role.clinician.direct-observation',
          contentVersion: '1.0.0',
        },
        sourceInstanceCompilation,
        timeScopeId: 'time-scope.current',
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.error.message);
      expect(result.value.resolvedObservation).toMatchObject({
        definitionId: bodyHabitusDefinition.id,
        definitionContentVersion: bodyHabitusDefinition.contentVersion,
        valueId,
        displayValue: valueId,
        source: {
          kind: 'clinician_observation',
        },
        interpretationIds: [],
      });
      expect(verifyPatientOwnedCategoricalObservationCompilationIntegrity(result.value).ok).toBe(
        true,
      );
      expect(JSON.stringify(result.value)).not.toMatch(/points?|score|clinical correctness/i);
    }
  });

  it('continues to prove both neutral observation domains synthetically', () => {
    for (const observationDefinition of syntheticDefinitions) {
      const valueProfile = PatientOwnedCategoricalObservationValueProfileSchema.parse({
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: `patient-owned-observation-profile.synthetic.${observationDefinition.id}`,
        observationDefinitionRef: {
          id: observationDefinition.id,
          contentVersion: observationDefinition.contentVersion,
        },
        valueId: observationDefinition.allowedValueIds[0],
        displayValue: 'Synthetic contract value',
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
        id: `patient-owned-observation-request.synthetic.${observationDefinition.id}`,
        patientStateId,
        observationDefinition,
        valueProfile,
        sourceDefinitionRef: {
          id: 'patient-scene-source-role.clinician.direct-observation',
          contentVersion: '1.0.0',
        },
        sourceInstanceCompilation,
        timeScopeId: 'time-scope.current',
      };

      const first = compilePatientOwnedCategoricalObservation(request);
      const replay = compilePatientOwnedCategoricalObservation(request);
      expect(first.ok).toBe(true);
      expect(replay).toEqual(first);
      if (!first.ok) throw new Error(first.error.message);

      expect(first.value.resolvedObservation).toMatchObject({
        definitionId: observationDefinition.id,
        definitionContentVersion: observationDefinition.contentVersion,
        valueId: observationDefinition.allowedValueIds[0],
        displayValue: 'Synthetic contract value',
        source: {
          kind: 'clinician_observation',
        },
        interpretationIds: [],
        resolution: {
          origin: 'authored',
          ownerId: valueProfile.id,
          ownerContentVersion: valueProfile.contentVersion,
        },
      });
      expect(verifyPatientOwnedCategoricalObservationCompilationIntegrity(first.value).ok).toBe(
        true,
      );
      expect(JSON.stringify(first.value)).not.toMatch(/points?|score|clinical correctness/i);
    }
  });
});
