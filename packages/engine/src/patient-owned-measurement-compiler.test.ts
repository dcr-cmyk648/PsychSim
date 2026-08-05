import { describe, expect, it } from 'vitest';

import {
  MeasurementDefinitionSchema,
  PatientOwnedMeasurementValueProfileSchema,
  PatientSceneSourceDefinitionCatalogSchema,
  type CatalogPatientSceneSourceInstanceCompilationArtifact,
  type MeasurementDefinition,
  type PatientOwnedMeasurementCompilationRequest,
} from '@psychsim/schemas';

import { compilePatientSceneSourceInstancesFromCatalog } from './catalog-patient-scene-source-instance-compiler';
import {
  compilePatientOwnedMeasurement,
  verifyPatientOwnedMeasurementCompilationIntegrity,
} from './patient-owned-measurement-compiler';

const patientStateId = 'resolved-patient-state.test.patient-owned-measurement';

const sourceDefinitionCatalog = PatientSceneSourceDefinitionCatalogSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'registry.catalog.patient-scene-source-definitions.test.measurement',
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
    id: `catalog-patient-scene-source-instance-request.test.measurement.${targetPatientStateId
      .split('.')
      .at(-1)}`,
    patientStateId: targetPatientStateId,
    sourceDefinitionCatalog,
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

const unreviewed = {
  status: 'unreviewed' as const,
  reviewerId: null,
  reviewedAt: null,
  sourceUseNoteIds: [],
};

const weightDefinition = MeasurementDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'measurement.test.weight',
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
});

const heartRateDefinition = MeasurementDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'measurement.test.heart-rate',
  label: 'Synthetic heart rate',
  domain: 'vital_sign',
  unit: {
    display: 'beats/min',
    ucumCode: '/min',
    displayPrecision: 0,
  },
  availableThroughActionIds: ['info.physical.orthostatic-vitals'],
  allowedContextDimensionIds: ['measurement-context.body-position'],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const request = (
  definition: MeasurementDefinition = weightDefinition,
  overrides: Partial<PatientOwnedMeasurementCompilationRequest> = {},
): PatientOwnedMeasurementCompilationRequest => {
  const isHeartRate = definition.id === heartRateDefinition.id;
  const valueProfile = PatientOwnedMeasurementValueProfileSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `patient-owned-measurement-profile.test.${isHeartRate ? 'heart-rate' : 'weight'}`,
    measurementDefinitionRef: {
      id: definition.id,
      contentVersion: definition.contentVersion,
    },
    value: isHeartRate ? 96 : 82.4,
    displayValue: isHeartRate ? '96' : '82.4',
    contextValues: isHeartRate
      ? [
          {
            dimensionId: 'measurement-context.body-position',
            valueId: 'measurement-context-value.standing',
          },
        ]
      : [],
    sourceUseNoteIds: [],
    medicalReviewStatus: 'unreviewed',
    review: unreviewed,
  });
  return {
    schemaVersion: 1,
    id: `patient-owned-measurement-request.test.${isHeartRate ? 'heart-rate' : 'weight'}`,
    patientStateId,
    measurementDefinition: definition,
    valueProfile,
    sourceDefinitionRef: {
      id: 'patient-scene-source-role.test.measurement',
      contentVersion: '1.0.0',
    },
    sourceInstanceCompilation: compileSourceHorizon(),
    timeScopeId: 'time-scope.current',
    ...overrides,
  };
};

const compileOrThrow = (input: PatientOwnedMeasurementCompilationRequest) => {
  const compiled = compilePatientOwnedMeasurement(input);
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

describe('patient-owned measurement compiler', () => {
  it('freezes one exact neutral weight value with source, unit, owner, and replay', () => {
    const artifact = compileOrThrow(request());

    expect(artifact.resolvedMeasurement).toMatchObject({
      definitionId: weightDefinition.id,
      value: 82.4,
      displayValue: '82.4',
      unit: {
        display: 'kg',
        ucumCode: 'kg',
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
        ownerId: 'patient-owned-measurement-profile.test.weight',
        ownerContentVersion: '1.0.0',
      },
    });
    expect(verifyPatientOwnedMeasurementCompilationIntegrity(artifact).ok).toBe(true);
    expect(compilePatientOwnedMeasurement(request())).toEqual({ ok: true, value: artifact });
    expect(JSON.stringify(artifact)).not.toMatch(/points?|score|clinical correctness/i);
  });

  it('preserves an allowed orthostatic context without interpreting it', () => {
    const artifact = compileOrThrow(request(heartRateDefinition));

    expect(artifact.resolvedMeasurement).toMatchObject({
      definitionId: heartRateDefinition.id,
      value: 96,
      contextValues: [
        {
          dimensionId: 'measurement-context.body-position',
          valueId: 'measurement-context-value.standing',
        },
      ],
      interpretation: {
        kind: 'not_interpreted',
      },
    });
    expect(verifyPatientOwnedMeasurementCompilationIntegrity(artifact).ok).toBe(true);
  });

  it('rejects crossed definitions, undeclared contexts, wrong source kinds, and other patients', () => {
    const crossedProfile = structuredClone(request().valueProfile);
    crossedProfile.measurementDefinitionRef.id = heartRateDefinition.id;
    expect(
      compilePatientOwnedMeasurement(request(weightDefinition, { valueProfile: crossedProfile })),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });

    const undeclaredContext = structuredClone(request().valueProfile);
    undeclaredContext.contextValues = [
      {
        dimensionId: 'measurement-context.body-position',
        valueId: 'measurement-context-value.standing',
      },
    ];
    expect(
      compilePatientOwnedMeasurement(
        request(weightDefinition, { valueProfile: undeclaredContext }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'MEASUREMENT_CONTRACT_MISMATCH' } });

    expect(
      compilePatientOwnedMeasurement(
        request(weightDefinition, {
          sourceDefinitionRef: {
            id: 'patient-scene-source-role.test.clinician-observation',
            contentVersion: '1.0.0',
          },
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });

    expect(
      compilePatientOwnedMeasurement(
        request(weightDefinition, {
          sourceInstanceCompilation: compileSourceHorizon(
            'resolved-patient-state.test.patient-owned-measurement.other',
          ),
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
  });

  it('detects exact measurement, value-profile, and upstream-source tampering', () => {
    const artifact = compileOrThrow(request());

    const changedMeasurement = structuredClone(artifact);
    changedMeasurement.resolvedMeasurement.value = 83.1;
    expect(verifyPatientOwnedMeasurementCompilationIntegrity(changedMeasurement)).toMatchObject({
      ok: false,
      error: { code: 'PAYLOAD_FINGERPRINT_MISMATCH' },
    });

    const changedProfile = structuredClone(artifact);
    changedProfile.compileRequest.valueProfile.sourceUseNoteIds = ['source-use-note.test.changed'];
    expect(verifyPatientOwnedMeasurementCompilationIntegrity(changedProfile)).toMatchObject({
      ok: false,
      error: { code: 'VALUE_PROFILE_FINGERPRINT_MISMATCH' },
    });

    const changedSourceCatalog = structuredClone(artifact);
    changedSourceCatalog.compileRequest.sourceInstanceCompilation.compileRequest.sourceDefinitionCatalog.contentVersion =
      '2.0.0';
    expect(verifyPatientOwnedMeasurementCompilationIntegrity(changedSourceCatalog)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });
});
