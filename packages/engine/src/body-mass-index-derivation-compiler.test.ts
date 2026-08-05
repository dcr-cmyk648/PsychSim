import { describe, expect, it } from 'vitest';

import measurementCatalogJson from '../../../content/catalogs/measurements/definitions.json';
import sourceDefinitionsJson from '../../../content/catalogs/patient-scene-sources/definitions.json';
import {
  MeasurementCatalogSchema,
  PatientOwnedMeasurementValueProfileSchema,
  PatientSceneSourceDefinitionCatalogSchema,
  type BodyMassIndexDerivationCompilationRequest,
  type MeasurementDefinition,
} from '@psychsim/schemas';

import {
  compileBodyMassIndexDerivation,
  verifyBodyMassIndexDerivationCompilationIntegrity,
} from './body-mass-index-derivation-compiler';
import {
  materializeBodyMassIndexMeasurement,
  verifyBodyMassIndexMeasurementMaterializationIntegrity,
} from './body-mass-index-measurement-materializer';
import { compilePatientClinicalResultCollection } from './patient-clinical-result-collection-compiler';
import { compilePatientOwnedMeasurement } from './patient-owned-measurement-compiler';
import { compilePatientSceneSourceInstancesFromCatalog } from './catalog-patient-scene-source-instance-compiler';

const measurementCatalog = MeasurementCatalogSchema.parse(measurementCatalogJson);
const sourceDefinitionCatalog =
  PatientSceneSourceDefinitionCatalogSchema.parse(sourceDefinitionsJson);
const heightDefinition = measurementCatalog.measurements.find(
  (definition) => definition.id === 'measurement.anthropometric.height',
)!;
const weightDefinition = measurementCatalog.measurements.find(
  (definition) => definition.id === 'measurement.anthropometric.weight',
)!;
const bmiDefinition = measurementCatalog.measurements.find(
  (definition) => definition.id === 'measurement.anthropometric.bmi',
)!;
const derivationDefinition = measurementCatalog.derivations.find(
  (definition) => definition.id === 'measurement-derivation.bmi.metric-height-weight',
)!;
const patientStateId = 'resolved-patient-state.test.body-mass-index-derivation';

const sourceCompilation = compilePatientSceneSourceInstancesFromCatalog({
  schemaVersion: 1,
  id: 'catalog-patient-scene-source-instance-request.test.body-mass-index',
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

const compileMeasurement = (
  definition: MeasurementDefinition,
  value: number,
  coordinate: string,
) => {
  const valueProfile = PatientOwnedMeasurementValueProfileSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `patient-owned-measurement-profile.test.body-mass-index.${coordinate}`,
    measurementDefinitionRef: {
      id: definition.id,
      contentVersion: definition.contentVersion,
    },
    value,
    displayValue: value.toFixed(definition.unit.displayPrecision),
    contextValues: [],
    sourceUseNoteIds: [],
    medicalReviewStatus: 'unreviewed',
    review: unreviewed,
  });
  const compiled = compilePatientOwnedMeasurement({
    schemaVersion: 1,
    id: `patient-owned-measurement-request.test.body-mass-index.${coordinate}`,
    patientStateId,
    measurementDefinition: definition,
    valueProfile,
    sourceDefinitionRef: {
      id: 'patient-scene-source-role.measurement.direct',
      contentVersion: '1.0.0',
    },
    sourceInstanceCompilation,
    timeScopeId: 'time-scope.current',
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

const heightCompilation = compileMeasurement(heightDefinition, 170, 'height');
const weightCompilation = compileMeasurement(weightDefinition, 82.4, 'weight');
const alternateWeightCompilation = compileMeasurement(weightDefinition, 70, 'alternate-weight');
const zeroHeightCompilation = compileMeasurement(heightDefinition, 0, 'zero-height');

const compileCollection = (
  measurementCompilations = [heightCompilation, weightCompilation, alternateWeightCompilation],
) => {
  const compiled = compilePatientClinicalResultCollection({
    schemaVersion: 1,
    id: `patient-clinical-result-collection-request.test.body-mass-index.${measurementCompilations
      .map((compilation) => compilation.id.slice(-4))
      .join('.')}`,
    patientStateId,
    sourceInstanceCompilation,
    numericStructuredTestCompilations: [],
    patientOwnedStructuredTestCompilations: [],
    measurementCompilations,
    categoricalObservationCompilations: [],
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

const collectionCompilation = compileCollection();

const request = (
  overrides: Partial<BodyMassIndexDerivationCompilationRequest> = {},
): BodyMassIndexDerivationCompilationRequest => ({
  schemaVersion: 1,
  id: 'body-mass-index-derivation-request.test.base',
  patientStateId,
  derivationDefinition,
  heightMeasurementDefinition: heightDefinition,
  weightMeasurementDefinition: weightDefinition,
  outputMeasurementDefinition: bmiDefinition,
  resultCollectionCompilation: collectionCompilation,
  heightResolvedMeasurementId: heightCompilation.resolvedMeasurement.id,
  weightResolvedMeasurementId: weightCompilation.resolvedMeasurement.id,
  ...overrides,
});

const compileOrThrow = (input: BodyMassIndexDerivationCompilationRequest) => {
  const compiled = compileBodyMassIndexDerivation(input);
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

describe('body-mass-index derivation compiler', () => {
  it('derives one exact uninterpreted BMI from explicitly selected replay-valid inputs', () => {
    const artifact = compileOrThrow(request());

    expect(artifact.heightInput).toEqual(heightCompilation.resolvedMeasurement);
    expect(artifact.weightInput).toEqual(weightCompilation.resolvedMeasurement);
    expect(artifact.derivedValue.value).toBeCloseTo(82.4 / 1.7 ** 2, 12);
    expect(artifact.derivedValue).toEqual({
      schemaVersion: 1,
      definitionId: bmiDefinition.id,
      definitionContentVersion: bmiDefinition.contentVersion,
      value: 82.4 / 1.7 ** 2,
      displayValue: '28.5',
      unit: {
        display: 'kg/m²',
        ucumCode: 'kg/m2',
      },
      contextValues: [],
      interpretation: {
        kind: 'not_interpreted',
      },
    });
    expect(artifact.derivedValue).not.toHaveProperty('source');
    expect(artifact.derivedValue).not.toHaveProperty('timeScopeId');
    expect(artifact.derivedValue).not.toHaveProperty('resolution');
    expect(verifyBodyMassIndexDerivationCompilationIntegrity(artifact).ok).toBe(true);
    expect(JSON.stringify(artifact.derivedValue)).not.toMatch(
      /normal|abnormal|body.?habitus|clinical|points?|score/i,
    );
  });

  it('uses the exact selected weight when multiple same-definition records exist', () => {
    const primary = compileOrThrow(request());
    const alternate = compileOrThrow(
      request({
        id: 'body-mass-index-derivation-request.test.alternate-weight',
        weightResolvedMeasurementId: alternateWeightCompilation.resolvedMeasurement.id,
      }),
    );

    expect(primary.derivedValue.displayValue).toBe('28.5');
    expect(alternate.derivedValue.displayValue).toBe('24.2');
    expect(alternate.weightInput.id).toBe(alternateWeightCompilation.resolvedMeasurement.id);
    expect(compileBodyMassIndexDerivation(request())).toEqual({
      ok: true,
      value: primary,
    });
  });

  it('rejects missing, definition-crossed, and nonpositive inputs', () => {
    expect(
      compileBodyMassIndexDerivation(
        request({
          heightResolvedMeasurementId: 'resolved-measurement.test.missing-height',
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'INPUT_MEASUREMENT_NOT_FOUND' },
    });

    expect(
      compileBodyMassIndexDerivation(
        request({
          heightResolvedMeasurementId: weightCompilation.resolvedMeasurement.id,
          weightResolvedMeasurementId: heightCompilation.resolvedMeasurement.id,
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'INPUT_MEASUREMENT_MISMATCH' },
    });

    const zeroHeightCollection = compileCollection([zeroHeightCompilation, weightCompilation]);
    expect(
      compileBodyMassIndexDerivation(
        request({
          id: 'body-mass-index-derivation-request.test.zero-height',
          resultCollectionCompilation: zeroHeightCollection,
          heightResolvedMeasurementId: zeroHeightCompilation.resolvedMeasurement.id,
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_INPUT_VALUE' },
    });
  });

  it('rejects unit drift and detects output or upstream tampering', () => {
    expect(
      compileBodyMassIndexDerivation(
        request({
          outputMeasurementDefinition: {
            ...bmiDefinition,
            unit: {
              ...bmiDefinition.unit,
              ucumCode: '1',
            },
          },
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const artifact = compileOrThrow(request());
    const changedOutput = structuredClone(artifact);
    changedOutput.derivedValue.displayValue = '99.9';
    expect(verifyBodyMassIndexDerivationCompilationIntegrity(changedOutput)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });

    const changedUpstream = structuredClone(artifact);
    const changedMeasurement =
      changedUpstream.compileRequest.resultCollectionCompilation.compileRequest
        .measurementCompilations[0]!;
    if (!('valueProfile' in changedMeasurement.compileRequest)) {
      throw new Error('Expected an authored measurement fixture.');
    }
    changedMeasurement.compileRequest.valueProfile.sourceUseNoteIds = [
      'source-use-note.test.changed',
    ];
    expect(verifyBodyMassIndexDerivationCompilationIntegrity(changedUpstream)).toMatchObject({
      ok: false,
      error: { code: 'RESULT_COLLECTION_INVALID' },
    });
  });
});

describe('body-mass-index measurement materializer', () => {
  it('uses explicit derived provenance and the selected weight record time scope', () => {
    const derivation = compileOrThrow(request());
    const materialized = materializeBodyMassIndexMeasurement({
      schemaVersion: 1,
      id: 'body-mass-index-measurement-materialization-request.test.base',
      derivationCompilation: derivation,
    });
    expect(materialized.ok).toBe(true);
    if (!materialized.ok) throw new Error(materialized.error.message);

    expect(materialized.value.resolvedMeasurement).toMatchObject({
      definitionId: bmiDefinition.id,
      definitionContentVersion: bmiDefinition.contentVersion,
      value: derivation.derivedValue.value,
      displayValue: '28.5',
      timeScopeId: weightCompilation.resolvedMeasurement.timeScopeId,
      source: {
        kind: 'derived_measurement',
        derivationDefinitionId: derivationDefinition.id,
        derivationDefinitionContentVersion: derivationDefinition.contentVersion,
        derivationArtifactId: derivation.id,
        derivationPayloadFingerprint: derivation.payloadFingerprint,
        inputMeasurementIds: [
          heightCompilation.resolvedMeasurement.id,
          weightCompilation.resolvedMeasurement.id,
        ],
      },
      interpretation: {
        kind: 'not_interpreted',
      },
      resolution: {
        origin: 'deterministic_derivation',
        derivationDefinitionId: derivationDefinition.id,
        derivationDefinitionContentVersion: derivationDefinition.contentVersion,
        resolverVersion: '1.0.0',
        inputMeasurementIds: [
          heightCompilation.resolvedMeasurement.id,
          weightCompilation.resolvedMeasurement.id,
        ],
      },
    });
    expect(materialized.value.resolvedMeasurement.source).not.toHaveProperty('sourceInstanceId');
    expect(verifyBodyMassIndexMeasurementMaterializationIntegrity(materialized.value).ok).toBe(
      true,
    );
  });

  it('replays deterministically and rejects provenance or upstream tampering', () => {
    const derivation = compileOrThrow(request());
    const materializationRequest = {
      schemaVersion: 1 as const,
      id: 'body-mass-index-measurement-materialization-request.test.replay',
      derivationCompilation: derivation,
    };
    const first = materializeBodyMassIndexMeasurement(materializationRequest);
    const replay = materializeBodyMassIndexMeasurement(materializationRequest);
    expect(first).toEqual(replay);
    if (!first.ok) throw new Error(first.error.message);

    const changedProvenance = structuredClone(first.value);
    if (changedProvenance.resolvedMeasurement.source.kind !== 'derived_measurement') {
      throw new Error('Expected derived measurement source.');
    }
    changedProvenance.resolvedMeasurement.source.inputMeasurementIds.reverse();
    expect(verifyBodyMassIndexMeasurementMaterializationIntegrity(changedProvenance)).toMatchObject(
      {
        ok: false,
        error: { code: 'INVALID_SCHEMA' },
      },
    );

    const changedDerivation = structuredClone(first.value);
    changedDerivation.materializationRequest.derivationCompilation.derivedValue.displayValue =
      '99.9';
    expect(verifyBodyMassIndexMeasurementMaterializationIntegrity(changedDerivation)).toMatchObject(
      {
        ok: false,
        error: { code: 'INVALID_SCHEMA' },
      },
    );
  });
});
