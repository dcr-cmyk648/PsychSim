import { describe, expect, it } from 'vitest';

import {
  GeneratedMeasurementValueProfileSchema,
  MeasurementDefinitionSchema,
  PatientSceneSourceDefinitionCatalogSchema,
  type CatalogPatientSceneSourceInstanceCompilationArtifact,
  type GeneratedMeasurementCompilationRequest,
  type GeneratedMeasurementValueProfile,
} from '@psychsim/schemas';

import { compilePatientSceneSourceInstancesFromCatalog } from './catalog-patient-scene-source-instance-compiler';
import {
  compileGeneratedMeasurement,
  verifyGeneratedMeasurementCompilationIntegrity,
} from './generated-measurement-compiler';

const patientStateId = 'resolved-patient-state.test.generated-measurement';

const sourceDefinitionCatalog = PatientSceneSourceDefinitionCatalogSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'registry.catalog.patient-scene-source-definitions.test.generated-measurement',
  definitions: [
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'patient-scene-source-role.test.generated-measurement',
      kind: 'measurement',
    },
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'patient-scene-source-role.test.generated-observation',
      kind: 'clinician_observation',
    },
  ],
});

const compileSourceHorizon = (
  targetPatientStateId = patientStateId,
): CatalogPatientSceneSourceInstanceCompilationArtifact => {
  const compiled = compilePatientSceneSourceInstancesFromCatalog({
    schemaVersion: 1,
    id: `catalog-patient-scene-source-instance-request.test.generated-measurement.${targetPatientStateId
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
  id: 'measurement.test.generated-weight',
  label: 'Synthetic generated weight',
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

const profile = (
  id: string,
  priority: number,
  overrides: Partial<GeneratedMeasurementValueProfile> = {},
): GeneratedMeasurementValueProfile =>
  GeneratedMeasurementValueProfileSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id,
    measurementDefinitionRef: {
      id: weightDefinition.id,
      contentVersion: weightDefinition.contentVersion,
    },
    priority,
    when: {
      anyDiagnosisIds: [],
      allClinicalTagIds: [],
    },
    valueBands: [
      {
        id: `${id}.band.lower`,
        minimum: 55,
        maximum: 70,
        relativeWeight: 3,
      },
      {
        id: `${id}.band.upper`,
        minimum: 80,
        maximum: 100,
        relativeWeight: 1,
      },
    ],
    contextValues: [],
    sourceUseNoteIds: [],
    medicalReviewStatus: 'unreviewed',
    review: unreviewed,
    ...overrides,
  });

const generalProfile = profile('measurement-generation-profile.test.weight.general', 0);
const mddProfile = profile('measurement-generation-profile.test.weight.mdd', 10, {
  when: {
    anyDiagnosisIds: ['diagnosis.mdd'],
    allClinicalTagIds: [],
  },
});

const request = (
  seed = 'seed.test.generated-measurement',
  overrides: Partial<GeneratedMeasurementCompilationRequest> = {},
): GeneratedMeasurementCompilationRequest => ({
  schemaVersion: 1,
  id: 'generated-measurement-request.test.weight',
  patientStateId,
  seed,
  measurementDefinition: weightDefinition,
  generationContext: {
    ageYears: 42,
    sexForReference: 'female',
    diagnosisIds: ['diagnosis.mdd'],
    clinicalTagIds: ['clinical-tag.test.context'],
  },
  generationProfiles: [generalProfile, mddProfile],
  sourceDefinitionRef: {
    id: 'patient-scene-source-role.test.generated-measurement',
    contentVersion: '1.0.0',
  },
  sourceInstanceCompilation: compileSourceHorizon(),
  timeScopeId: 'time-scope.current',
  ...overrides,
});

const compileOrThrow = (input: GeneratedMeasurementCompilationRequest) => {
  const compiled = compileGeneratedMeasurement(input);
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

describe('generated measurement compiler', () => {
  it('freezes one exact context-selected, weighted, uninterpreted measurement with replay', () => {
    const artifact = compileOrThrow(request());

    expect(artifact.selectedProfileRef.id).toBe(mddProfile.id);
    expect(mddProfile.valueBands.map((band) => band.id)).toContain(
      artifact.selectedValueBandRef.id,
    );
    expect(artifact.resolvedMeasurement).toMatchObject({
      definitionId: weightDefinition.id,
      unit: {
        display: 'kg',
        ucumCode: 'kg',
      },
      source: {
        kind: 'measurement',
      },
      interpretation: {
        kind: 'not_interpreted',
      },
      resolution: {
        origin: 'deterministic_generation',
        generationProfileId: mddProfile.id,
        generationProfileContentVersion: mddProfile.contentVersion,
      },
    });
    expect(verifyGeneratedMeasurementCompilationIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(compileGeneratedMeasurement(request())).toEqual({ ok: true, value: artifact });
    expect(JSON.stringify(artifact)).not.toMatch(
      /referenceRange|bodyHabitus|diagnosisInference|points?|score/i,
    );
  });

  it('varies only within reviewed support bands across seeds', () => {
    const artifacts = Array.from({ length: 40 }, (_, index) =>
      compileOrThrow(request(`seed.test.generated-measurement.${index}`)),
    );
    const values = new Set(artifacts.map((artifact) => artifact.resolvedMeasurement.value));
    const selectedBandIds = new Set(artifacts.map((artifact) => artifact.selectedValueBandRef.id));

    expect(values.size).toBeGreaterThan(20);
    expect(selectedBandIds.size).toBe(2);
    for (const artifact of artifacts) {
      const selectedBand = mddProfile.valueBands.find(
        (band) => band.id === artifact.selectedValueBandRef.id,
      )!;
      expect(artifact.resolvedMeasurement.value).toBeGreaterThanOrEqual(selectedBand.minimum);
      expect(artifact.resolvedMeasurement.value).toBeLessThanOrEqual(selectedBand.maximum);
      expect(verifyGeneratedMeasurementCompilationIntegrity(artifact).ok).toBe(true);
    }
  });

  it('is insensitive to input profile, band, diagnosis, and tag ordering', () => {
    const baseline = compileOrThrow(request());
    const reorderedMdd = {
      ...mddProfile,
      valueBands: [...mddProfile.valueBands].reverse(),
    };
    const reordered = compileOrThrow(
      request('seed.test.generated-measurement', {
        generationContext: {
          ageYears: 42,
          sexForReference: 'female',
          diagnosisIds: ['diagnosis.zzz', 'diagnosis.mdd'],
          clinicalTagIds: ['clinical-tag.zzz', 'clinical-tag.test.context'],
        },
        generationProfiles: [reorderedMdd, generalProfile].reverse(),
      }),
    );
    const matchingBaseline = compileOrThrow(
      request('seed.test.generated-measurement', {
        generationContext: {
          ageYears: 42,
          sexForReference: 'female',
          diagnosisIds: ['diagnosis.mdd', 'diagnosis.zzz'],
          clinicalTagIds: ['clinical-tag.test.context', 'clinical-tag.zzz'],
        },
      }),
    );

    expect(reordered).toEqual(matchingBaseline);
    expect(baseline.selectedProfileRef.id).toBe(reordered.selectedProfileRef.id);
    expect(baseline.resolvedMeasurement.value).toBe(reordered.resolvedMeasurement.value);
  });

  it('reports missing profile coverage without inventing a fallback', () => {
    const olderAdultOnly = profile('measurement-generation-profile.test.weight.older-adult', 0, {
      when: {
        minimumAgeYears: 65,
        anyDiagnosisIds: [],
        allClinicalTagIds: [],
      },
    });
    expect(
      compileGeneratedMeasurement(
        request('seed.test.generated-measurement.no-profile', {
          generationProfiles: [olderAdultOnly],
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'NO_MATCHING_PROFILE' } });
  });

  it('rejects crossed definitions, undeclared contexts, source kinds, and patients', () => {
    const crossedProfile = structuredClone(generalProfile);
    crossedProfile.measurementDefinitionRef.id = 'measurement.test.other';
    expect(
      compileGeneratedMeasurement(request(undefined, { generationProfiles: [crossedProfile] })),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });

    const contextualProfile = structuredClone(generalProfile);
    contextualProfile.contextValues = [
      {
        dimensionId: 'measurement-context.body-position',
        valueId: 'measurement-context-value.standing',
      },
    ];
    expect(
      compileGeneratedMeasurement(request(undefined, { generationProfiles: [contextualProfile] })),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });

    expect(
      compileGeneratedMeasurement(
        request(undefined, {
          sourceDefinitionRef: {
            id: 'patient-scene-source-role.test.generated-observation',
            contentVersion: '1.0.0',
          },
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });

    expect(
      compileGeneratedMeasurement(
        request(undefined, {
          sourceInstanceCompilation: compileSourceHorizon(
            'resolved-patient-state.test.generated-measurement.other',
          ),
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
  });

  it('detects exact definition, profile, band, result, and source tampering', () => {
    const artifact = compileOrThrow(request());

    const changedDefinition = structuredClone(artifact);
    changedDefinition.compileRequest.measurementDefinition.label = 'Changed';
    expect(verifyGeneratedMeasurementCompilationIntegrity(changedDefinition)).toMatchObject({
      ok: false,
      error: { code: 'MEASUREMENT_DEFINITION_FINGERPRINT_MISMATCH' },
    });

    const changedProfile = structuredClone(artifact);
    changedProfile.compileRequest.generationProfiles.find(
      (candidate) => candidate.id === artifact.selectedProfileRef.id,
    )!.priority += 1;
    expect(verifyGeneratedMeasurementCompilationIntegrity(changedProfile)).toMatchObject({
      ok: false,
      error: { code: 'GENERATION_PROFILE_FINGERPRINT_MISMATCH' },
    });

    const changedBand = structuredClone(artifact);
    changedBand.selectedValueBandRef.fingerprint =
      'fingerprint.generated-measurement-compilation.value-band.fnv1a64.0000000000000000';
    expect(verifyGeneratedMeasurementCompilationIntegrity(changedBand)).toMatchObject({
      ok: false,
      error: { code: 'VALUE_BAND_FINGERPRINT_MISMATCH' },
    });

    const changedResult = structuredClone(artifact);
    changedResult.resolvedMeasurement.value += 1;
    expect(verifyGeneratedMeasurementCompilationIntegrity(changedResult)).toMatchObject({
      ok: false,
      error: { code: 'PAYLOAD_FINGERPRINT_MISMATCH' },
    });

    const changedSource = structuredClone(artifact);
    changedSource.compileRequest.sourceInstanceCompilation.compileRequest.sourceDefinitionCatalog.contentVersion =
      '2.0.0';
    expect(verifyGeneratedMeasurementCompilationIntegrity(changedSource)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });
});
