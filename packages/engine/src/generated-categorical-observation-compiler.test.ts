import { describe, expect, it } from 'vitest';

import {
  CategoricalObservationDefinitionSchema,
  GeneratedCategoricalObservationValueProfileSchema,
  PatientSceneSourceDefinitionCatalogSchema,
  type CatalogPatientSceneSourceInstanceCompilationArtifact,
  type GeneratedCategoricalObservationCompilationRequest,
  type GeneratedCategoricalObservationValueProfile,
} from '@psychsim/schemas';

import { compilePatientSceneSourceInstancesFromCatalog } from './catalog-patient-scene-source-instance-compiler';
import {
  compileGeneratedCategoricalObservation,
  verifyGeneratedCategoricalObservationCompilationIntegrity,
} from './generated-categorical-observation-compiler';

const patientStateId = 'resolved-patient-state.test.generated-categorical-observation';

const sourceDefinitionCatalog = PatientSceneSourceDefinitionCatalogSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'registry.catalog.patient-scene-source-definitions.test.generated-categorical-observation',
  definitions: [
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'patient-scene-source-role.test.generated-categorical-measurement',
      kind: 'measurement',
    },
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'patient-scene-source-role.test.generated-categorical-observation',
      kind: 'clinician_observation',
    },
  ],
});

const compileSourceHorizon = (
  targetPatientStateId = patientStateId,
): CatalogPatientSceneSourceInstanceCompilationArtifact => {
  const compiled = compilePatientSceneSourceInstancesFromCatalog({
    schemaVersion: 1,
    id: `catalog-patient-scene-source-instance-request.test.generated-categorical-observation.${targetPatientStateId
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

const observationDefinition = CategoricalObservationDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'observation.test.generated-appearance',
  label: 'Synthetic generated appearance',
  domain: 'physical_exam',
  allowedValueIds: [
    'observation-value.test.generated-appearance.a',
    'observation-value.test.generated-appearance.b',
    'observation-value.test.generated-appearance.c',
  ],
  availableThroughActionIds: ['info.physical.general-examination'],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const profile = (
  id: string,
  priority: number,
  overrides: Partial<GeneratedCategoricalObservationValueProfile> = {},
): GeneratedCategoricalObservationValueProfile =>
  GeneratedCategoricalObservationValueProfileSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id,
    observationDefinitionRef: {
      id: observationDefinition.id,
      contentVersion: observationDefinition.contentVersion,
    },
    priority,
    when: {
      anyDiagnosisIds: [],
      allClinicalTagIds: [],
    },
    valueOptions: observationDefinition.allowedValueIds.map((valueId, index) => ({
      id: `${id}.option.${index + 1}`,
      valueId,
      displayValue: `Synthetic value ${index + 1}`,
      relativeWeight: index + 1,
    })),
    sourceUseNoteIds: [],
    medicalReviewStatus: 'unreviewed',
    review: unreviewed,
    ...overrides,
  });

const generalProfile = profile('observation-generation-profile.test.appearance.general', 0);
const mddProfile = profile('observation-generation-profile.test.appearance.mdd', 10, {
  when: {
    anyDiagnosisIds: ['diagnosis.mdd'],
    allClinicalTagIds: [],
  },
});

const request = (
  seed = 'seed.test.generated-categorical-observation',
  overrides: Partial<GeneratedCategoricalObservationCompilationRequest> = {},
): GeneratedCategoricalObservationCompilationRequest => ({
  schemaVersion: 1,
  id: 'generated-categorical-observation-request.test.appearance',
  patientStateId,
  seed,
  observationDefinition,
  generationContext: {
    ageYears: 42,
    sexForReference: 'female',
    diagnosisIds: ['diagnosis.mdd'],
    clinicalTagIds: ['clinical-tag.test.context'],
  },
  generationProfiles: [generalProfile, mddProfile],
  sourceDefinitionRef: {
    id: 'patient-scene-source-role.test.generated-categorical-observation',
    contentVersion: '1.0.0',
  },
  sourceInstanceCompilation: compileSourceHorizon(),
  timeScopeId: 'time-scope.current',
  ...overrides,
});

const compileOrThrow = (input: GeneratedCategoricalObservationCompilationRequest) => {
  const compiled = compileGeneratedCategoricalObservation(input);
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

describe('generated categorical-observation compiler', () => {
  it('freezes one exact context-selected, weighted, uninterpreted observation with replay', () => {
    const artifact = compileOrThrow(request());
    const selectedOption = mddProfile.valueOptions.find(
      (option) => option.id === artifact.selectedValueOptionRef.id,
    )!;

    expect(artifact.selectedProfileRef.id).toBe(mddProfile.id);
    expect(artifact.resolvedObservation).toMatchObject({
      definitionId: observationDefinition.id,
      valueId: selectedOption.valueId,
      displayValue: selectedOption.displayValue,
      source: {
        kind: 'clinician_observation',
      },
      interpretationIds: [],
      resolution: {
        origin: 'deterministic_generation',
        generationProfileId: mddProfile.id,
        generationProfileContentVersion: mddProfile.contentVersion,
        stableDrawId: artifact.generationDraws.valueOptionStableDrawId,
      },
    });
    expect(verifyGeneratedCategoricalObservationCompilationIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(compileGeneratedCategoricalObservation(request())).toEqual({
      ok: true,
      value: artifact,
    });
    expect(JSON.stringify(artifact)).not.toMatch(
      /referenceRange|measurementInference|diagnosisInference|points?|score/i,
    );
  });

  it('selects only allowed profile values across deterministic seeds', () => {
    const artifacts = Array.from({ length: 60 }, (_, index) =>
      compileOrThrow(request(`seed.test.generated-categorical-observation.${index}`)),
    );
    const selectedValueIds = new Set(
      artifacts.map((artifact) => artifact.resolvedObservation.valueId),
    );

    expect(selectedValueIds.size).toBe(3);
    for (const artifact of artifacts) {
      expect(observationDefinition.allowedValueIds).toContain(artifact.resolvedObservation.valueId);
      expect(artifact.resolvedObservation.interpretationIds).toEqual([]);
      expect(verifyGeneratedCategoricalObservationCompilationIntegrity(artifact).ok).toBe(true);
    }
  });

  it('is insensitive to profile, option, diagnosis, and tag ordering', () => {
    const reorderedMdd = {
      ...mddProfile,
      valueOptions: [...mddProfile.valueOptions].reverse(),
    };
    const first = compileOrThrow(
      request(undefined, {
        generationContext: {
          ageYears: 42,
          sexForReference: 'female',
          diagnosisIds: ['diagnosis.zzz', 'diagnosis.mdd'],
          clinicalTagIds: ['clinical-tag.zzz', 'clinical-tag.test.context'],
        },
        generationProfiles: [reorderedMdd, generalProfile].reverse(),
      }),
    );
    const second = compileOrThrow(
      request(undefined, {
        generationContext: {
          ageYears: 42,
          sexForReference: 'female',
          diagnosisIds: ['diagnosis.mdd', 'diagnosis.zzz'],
          clinicalTagIds: ['clinical-tag.test.context', 'clinical-tag.zzz'],
        },
      }),
    );

    expect(first).toEqual(second);
  });

  it('reports missing profile coverage without inventing a fallback', () => {
    const olderAdultOnly = profile(
      'observation-generation-profile.test.appearance.older-adult',
      0,
      {
        when: {
          minimumAgeYears: 65,
          anyDiagnosisIds: [],
          allClinicalTagIds: [],
        },
      },
    );
    expect(
      compileGeneratedCategoricalObservation(
        request('seed.test.generated-categorical-observation.no-profile', {
          generationProfiles: [olderAdultOnly],
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'NO_MATCHING_PROFILE' } });
  });

  it('rejects crossed definitions, disallowed values, source kinds, and patients', () => {
    const crossedProfile = structuredClone(generalProfile);
    crossedProfile.observationDefinitionRef.id = 'observation.test.other';
    expect(
      compileGeneratedCategoricalObservation(
        request(undefined, { generationProfiles: [crossedProfile] }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });

    const disallowedValueProfile = structuredClone(generalProfile);
    disallowedValueProfile.valueOptions[0]!.valueId = 'observation-value.test.not-allowed';
    expect(
      compileGeneratedCategoricalObservation(
        request(undefined, { generationProfiles: [disallowedValueProfile] }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });

    expect(
      compileGeneratedCategoricalObservation(
        request(undefined, {
          sourceDefinitionRef: {
            id: 'patient-scene-source-role.test.generated-categorical-measurement',
            contentVersion: '1.0.0',
          },
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });

    expect(
      compileGeneratedCategoricalObservation(
        request(undefined, {
          sourceInstanceCompilation: compileSourceHorizon(
            'resolved-patient-state.test.generated-categorical-observation.other',
          ),
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
  });

  it('detects exact definition, profile, option, result, and source tampering', () => {
    const artifact = compileOrThrow(request());

    const changedDefinition = structuredClone(artifact);
    changedDefinition.compileRequest.observationDefinition.label = 'Changed';
    expect(
      verifyGeneratedCategoricalObservationCompilationIntegrity(changedDefinition),
    ).toMatchObject({
      ok: false,
      error: { code: 'OBSERVATION_DEFINITION_FINGERPRINT_MISMATCH' },
    });

    const changedProfile = structuredClone(artifact);
    changedProfile.compileRequest.generationProfiles.find(
      (candidate) => candidate.id === artifact.selectedProfileRef.id,
    )!.priority += 1;
    expect(verifyGeneratedCategoricalObservationCompilationIntegrity(changedProfile)).toMatchObject(
      {
        ok: false,
        error: { code: 'GENERATION_PROFILE_FINGERPRINT_MISMATCH' },
      },
    );

    const changedOption = structuredClone(artifact);
    changedOption.selectedValueOptionRef.fingerprint =
      'fingerprint.generated-categorical-observation-compilation.value-option.fnv1a64.0000000000000000';
    expect(verifyGeneratedCategoricalObservationCompilationIntegrity(changedOption)).toMatchObject({
      ok: false,
      error: { code: 'VALUE_OPTION_FINGERPRINT_MISMATCH' },
    });

    const changedResult = structuredClone(artifact);
    changedResult.resolvedObservation.displayValue = 'Changed';
    expect(verifyGeneratedCategoricalObservationCompilationIntegrity(changedResult)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });

    const changedSource = structuredClone(artifact);
    changedSource.compileRequest.sourceInstanceCompilation.compileRequest.sourceDefinitionCatalog.contentVersion =
      '2.0.0';
    expect(verifyGeneratedCategoricalObservationCompilationIntegrity(changedSource)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });
});
