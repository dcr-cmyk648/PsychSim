import { describe, expect, it } from 'vitest';

import {
  CategoricalObservationDefinitionSchema,
  PatientOwnedCategoricalObservationValueProfileSchema,
  PatientSceneSourceDefinitionCatalogSchema,
  type CatalogPatientSceneSourceInstanceCompilationArtifact,
  type CategoricalObservationDefinition,
  type PatientOwnedCategoricalObservationCompilationRequest,
} from '@psychsim/schemas';

import { compilePatientSceneSourceInstancesFromCatalog } from './catalog-patient-scene-source-instance-compiler';
import {
  compilePatientOwnedCategoricalObservation,
  verifyPatientOwnedCategoricalObservationCompilationIntegrity,
} from './patient-owned-categorical-observation-compiler';

const patientStateId = 'resolved-patient-state.test.patient-owned-observation';

const sourceDefinitionCatalog = PatientSceneSourceDefinitionCatalogSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'registry.catalog.patient-scene-source-definitions.test.observation',
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
    id: `catalog-patient-scene-source-instance-request.test.observation.${targetPatientStateId
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

const appearanceDefinition = CategoricalObservationDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'observation.test.appearance',
  label: 'Synthetic appearance',
  domain: 'mental_status_exam',
  allowedValueIds: ['observation-value.test.appearance.a', 'observation-value.test.appearance.b'],
  availableThroughActionIds: ['info.physical.mental-status'],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const gaitDefinition = CategoricalObservationDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'observation.test.gait',
  label: 'Synthetic gait',
  domain: 'physical_exam',
  allowedValueIds: ['observation-value.test.gait.a', 'observation-value.test.gait.b'],
  availableThroughActionIds: ['info.physical.general-examination'],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const request = (
  definition: CategoricalObservationDefinition = appearanceDefinition,
  overrides: Partial<PatientOwnedCategoricalObservationCompilationRequest> = {},
): PatientOwnedCategoricalObservationCompilationRequest => {
  const isGait = definition.id === gaitDefinition.id;
  const valueProfile = PatientOwnedCategoricalObservationValueProfileSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `patient-owned-observation-profile.test.${isGait ? 'gait' : 'appearance'}`,
    observationDefinitionRef: {
      id: definition.id,
      contentVersion: definition.contentVersion,
    },
    valueId: isGait ? 'observation-value.test.gait.a' : 'observation-value.test.appearance.a',
    displayValue: isGait ? 'Synthetic gait value A' : 'Synthetic appearance value A',
    sourceUseNoteIds: [],
    medicalReviewStatus: 'unreviewed',
    review: unreviewed,
  });
  return {
    schemaVersion: 1,
    id: `patient-owned-observation-request.test.${isGait ? 'gait' : 'appearance'}`,
    patientStateId,
    observationDefinition: definition,
    valueProfile,
    sourceDefinitionRef: {
      id: 'patient-scene-source-role.test.clinician-observation',
      contentVersion: '1.0.0',
    },
    sourceInstanceCompilation: compileSourceHorizon(),
    timeScopeId: 'time-scope.current',
    ...overrides,
  };
};

const compileOrThrow = (input: PatientOwnedCategoricalObservationCompilationRequest) => {
  const compiled = compilePatientOwnedCategoricalObservation(input);
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

describe('patient-owned categorical-observation compiler', () => {
  it.each([
    ['mental-status', appearanceDefinition],
    ['physical-exam', gaitDefinition],
  ] as const)(
    'freezes one exact neutral %s value with source, owner, and replay',
    (_, definition) => {
      const artifact = compileOrThrow(request(definition));

      expect(artifact.resolvedObservation).toMatchObject({
        definitionId: definition.id,
        valueId: request(definition).valueProfile.valueId,
        displayValue: request(definition).valueProfile.displayValue,
        source: {
          kind: 'clinician_observation',
        },
        interpretationIds: [],
        resolution: {
          origin: 'authored',
          ownerId: request(definition).valueProfile.id,
          ownerContentVersion: '1.0.0',
        },
      });
      expect(verifyPatientOwnedCategoricalObservationCompilationIntegrity(artifact).ok).toBe(true);
      expect(compilePatientOwnedCategoricalObservation(request(definition))).toEqual({
        ok: true,
        value: artifact,
      });
      expect(JSON.stringify(artifact)).not.toMatch(/points?|score|clinical correctness/i);
    },
  );

  it('rejects crossed definitions, disallowed values, wrong source kinds, and other patients', () => {
    const crossedProfile = structuredClone(request().valueProfile);
    crossedProfile.observationDefinitionRef.id = gaitDefinition.id;
    expect(
      compilePatientOwnedCategoricalObservation(
        request(appearanceDefinition, { valueProfile: crossedProfile }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });

    const disallowedValue = structuredClone(request().valueProfile);
    disallowedValue.valueId = 'observation-value.test.not-allowed';
    expect(
      compilePatientOwnedCategoricalObservation(
        request(appearanceDefinition, { valueProfile: disallowedValue }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'OBSERVATION_CONTRACT_MISMATCH' } });

    expect(
      compilePatientOwnedCategoricalObservation(
        request(appearanceDefinition, {
          sourceDefinitionRef: {
            id: 'patient-scene-source-role.test.measurement',
            contentVersion: '1.0.0',
          },
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });

    expect(
      compilePatientOwnedCategoricalObservation(
        request(appearanceDefinition, {
          sourceInstanceCompilation: compileSourceHorizon(
            'resolved-patient-state.test.patient-owned-observation.other',
          ),
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
  });

  it('detects exact observation, profile, and upstream-source tampering', () => {
    const artifact = compileOrThrow(request());

    const changedObservation = structuredClone(artifact);
    changedObservation.resolvedObservation.displayValue = 'Changed';
    expect(
      verifyPatientOwnedCategoricalObservationCompilationIntegrity(changedObservation),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });

    const changedProfile = structuredClone(artifact);
    changedProfile.compileRequest.valueProfile.sourceUseNoteIds = ['source-use-note.test.changed'];
    expect(
      verifyPatientOwnedCategoricalObservationCompilationIntegrity(changedProfile),
    ).toMatchObject({
      ok: false,
      error: { code: 'VALUE_PROFILE_FINGERPRINT_MISMATCH' },
    });

    const changedSourceCatalog = structuredClone(artifact);
    changedSourceCatalog.compileRequest.sourceInstanceCompilation.compileRequest.sourceDefinitionCatalog.contentVersion =
      '2.0.0';
    expect(
      verifyPatientOwnedCategoricalObservationCompilationIntegrity(changedSourceCatalog),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });
});
