import { describe, expect, it } from 'vitest';

import measurementCatalogJson from '../../../content/catalogs/measurements/definitions.json';
import {
  CategoricalObservationResolutionEnvelopeSchema,
  MeasurementCatalogSchema,
  MeasurementDefinitionSchema,
  MeasurementResolutionEnvelopeSchema,
  ResolvedMeasurementSchema,
} from './index';

const catalog = MeasurementCatalogSchema.parse(measurementCatalogJson);
const weightDefinition = catalog.measurements.find(
  (definition) => definition.id === 'measurement.anthropometric.weight',
)!;
const heartRateDefinition = catalog.measurements.find(
  (definition) => definition.id === 'measurement.vital.heart-rate',
)!;

const authoredResolution = {
  origin: 'authored',
  ownerId: 'patient-template.test',
  ownerContentVersion: '1.0.0',
} as const;

describe('measurement and categorical-observation foundation', () => {
  it('parses a real identity-only measurement catalog without clinical ranges', () => {
    expect(catalog.id).toBe('registry.catalog.measurements');
    expect(catalog.measurements).toHaveLength(9);
    expect(catalog.categoricalObservations).toEqual([]);
    expect(measurementCatalogJson).not.toHaveProperty('referenceRanges');
  });

  it('keeps a neutral weight value separate from interpretation and body habitus', () => {
    const parsed = MeasurementResolutionEnvelopeSchema.parse({
      definition: weightDefinition,
      resolved: {
        schemaVersion: 1,
        id: 'resolved-measurement.test.weight',
        definitionId: weightDefinition.id,
        definitionContentVersion: weightDefinition.contentVersion,
        value: 82.4,
        displayValue: '82.4',
        unit: {
          display: weightDefinition.unit.display,
          ucumCode: weightDefinition.unit.ucumCode,
        },
        contextValues: [],
        timeScopeId: 'time-scope.current',
        sourceInstanceId: 'source-instance.test.scale',
        interpretation: { kind: 'not_interpreted' },
        resolution: authoredResolution,
      },
    });
    expect(parsed.resolved.interpretation).toEqual({ kind: 'not_interpreted' });
    expect(parsed.resolved).not.toHaveProperty('bodyHabitus');
    expect(parsed.resolved).not.toHaveProperty('abnormal');
  });

  it('represents orthostatic measurements as separate context-bound values', () => {
    const standing = {
      schemaVersion: 1,
      id: 'resolved-measurement.test.heart-rate-standing',
      definitionId: heartRateDefinition.id,
      definitionContentVersion: heartRateDefinition.contentVersion,
      value: 96,
      displayValue: '96',
      unit: {
        display: heartRateDefinition.unit.display,
        ucumCode: heartRateDefinition.unit.ucumCode,
      },
      contextValues: [
        {
          dimensionId: 'measurement-context.body-position',
          valueId: 'measurement-context-value.standing',
        },
      ],
      timeScopeId: 'time-scope.current',
      sourceInstanceId: 'source-instance.test.vital-device',
      interpretation: { kind: 'not_interpreted' },
      resolution: authoredResolution,
    } as const;
    const supine = {
      ...standing,
      id: 'resolved-measurement.test.heart-rate-supine',
      contextValues: [
        {
          dimensionId: 'measurement-context.body-position',
          valueId: 'measurement-context-value.supine',
        },
      ],
    } as const;
    expect(
      MeasurementResolutionEnvelopeSchema.safeParse({
        definition: heartRateDefinition,
        resolved: standing,
      }).success,
    ).toBe(true);
    expect(
      MeasurementResolutionEnvelopeSchema.safeParse({
        definition: heartRateDefinition,
        resolved: supine,
      }).success,
    ).toBe(true);
  });

  it('rejects unit drift and undeclared measurement context dimensions', () => {
    const base = {
      schemaVersion: 1,
      id: 'resolved-measurement.test.weight',
      definitionId: weightDefinition.id,
      definitionContentVersion: weightDefinition.contentVersion,
      value: 82.4,
      displayValue: '82.4',
      unit: { display: 'lb', ucumCode: '[lb_av]' },
      contextValues: [],
      timeScopeId: 'time-scope.current',
      sourceInstanceId: 'source-instance.test.scale',
      interpretation: { kind: 'not_interpreted' },
      resolution: authoredResolution,
    } as const;
    expect(
      MeasurementResolutionEnvelopeSchema.safeParse({
        definition: weightDefinition,
        resolved: base,
      }).success,
    ).toBe(false);
    expect(
      MeasurementResolutionEnvelopeSchema.safeParse({
        definition: weightDefinition,
        resolved: {
          ...base,
          unit: {
            display: weightDefinition.unit.display,
            ucumCode: weightDefinition.unit.ucumCode,
          },
          contextValues: [
            {
              dimensionId: 'measurement-context.body-position',
              valueId: 'measurement-context-value.standing',
            },
          ],
        },
      }).success,
    ).toBe(false);
  });

  it('supports separately defined MSE or physical categorical observations', () => {
    expect(
      CategoricalObservationResolutionEnvelopeSchema.safeParse({
        definition: {
          schemaVersion: 1,
          contentVersion: '1.0.0',
          id: 'observation.mse.test.appearance',
          label: 'General appearance',
          domain: 'mental_status_exam',
          allowedValueIds: ['observation-value.test.unremarkable'],
          availableThroughActionIds: ['info.physical.mental-status'],
          lifecycle: 'review',
          medicalReviewStatus: 'unreviewed',
        },
        resolved: {
          schemaVersion: 1,
          id: 'resolved-observation.test.appearance',
          definitionId: 'observation.mse.test.appearance',
          definitionContentVersion: '1.0.0',
          valueId: 'observation-value.test.unremarkable',
          displayValue: 'Unremarkable',
          timeScopeId: 'time-scope.current',
          sourceInstanceId: 'source-instance.test.examiner',
          interpretationIds: [],
          resolution: authoredResolution,
        },
      }).success,
    ).toBe(true);
  });

  it('rejects clinical ranges, points, UI color, and inferred diagnosis fields', () => {
    expect(
      MeasurementDefinitionSchema.safeParse({
        ...weightDefinition,
        referenceRange: { low: 18.5, high: 24.9 },
      }).success,
    ).toBe(false);
    expect(
      ResolvedMeasurementSchema.safeParse({
        schemaVersion: 1,
        id: 'resolved-measurement.test.weight',
        definitionId: weightDefinition.id,
        definitionContentVersion: weightDefinition.contentVersion,
        value: 82.4,
        displayValue: '82.4',
        unit: {
          display: weightDefinition.unit.display,
          ucumCode: weightDefinition.unit.ucumCode,
        },
        contextValues: [],
        timeScopeId: 'time-scope.current',
        sourceInstanceId: 'source-instance.test.scale',
        interpretation: { kind: 'not_interpreted' },
        resolution: authoredResolution,
        points: 10,
      }).success,
    ).toBe(false);
    expect(
      ResolvedMeasurementSchema.safeParse({
        schemaVersion: 1,
        id: 'resolved-measurement.test.weight',
        definitionId: weightDefinition.id,
        definitionContentVersion: weightDefinition.contentVersion,
        value: 82.4,
        displayValue: '82.4',
        unit: {
          display: weightDefinition.unit.display,
          ucumCode: weightDefinition.unit.ucumCode,
        },
        contextValues: [],
        timeScopeId: 'time-scope.current',
        sourceInstanceId: 'source-instance.test.scale',
        interpretation: { kind: 'not_interpreted' },
        resolution: authoredResolution,
        color: 'red',
        diagnosisId: 'diagnosis.obesity',
      }).success,
    ).toBe(false);
  });
});
