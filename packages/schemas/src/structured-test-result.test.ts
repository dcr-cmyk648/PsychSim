import { describe, expect, it } from 'vitest';

import {
  StructuredTestResultEnvelopeSchema,
  StructuredTestResultSchema,
  TestDefinitionSchema,
} from './index';

const numericDefinition = {
  schemaVersion: 1,
  contentVersion: '1.1.0',
  id: 'test.lab.test-panel',
  actionId: 'info.labs.test-panel',
  label: 'Test panel',
  category: 'laboratory',
  contextInputs: ['age_years'],
  medicalReviewStatus: 'unreviewed',
  sourceUseNoteIds: [],
  resultContract: {
    kind: 'numeric_panel',
    componentPolicy: 'fixed',
    componentDefinitionIds: ['lab-component.test.sodium'],
  },
  generator: {
    type: 'numeric_panel',
    profiles: [
      {
        id: 'test-profile.test-panel.general',
        priority: 0,
        when: {
          anyDiagnosisIds: [],
          allClinicalTagIds: [],
        },
        referenceIntervalSetId: 'reference-interval.test',
        referenceIntervalLabel: 'Test interval',
        incidentalAbnormalProbability: 0,
        components: [
          {
            id: 'lab-component.test.sodium',
            label: 'Sodium',
            unit: 'mmol/L',
            ucumCode: 'mmol/L',
            decimals: 0,
            referenceRange: { minimum: 135, maximum: 145 },
            normalGenerationRange: { minimum: 136, maximum: 144 },
            mildAbnormalRanges: [],
            review: {
              status: 'unreviewed',
              reviewerId: null,
              reviewedAt: null,
              sourceUseNoteIds: [],
            },
          },
        ],
        review: {
          status: 'unreviewed',
          reviewerId: null,
          reviewedAt: null,
          sourceUseNoteIds: [],
        },
      },
    ],
  },
} as const;

const resolution = {
  origin: 'authored',
  ownerId: 'patient-template.test',
  ownerContentVersion: '1.0.0',
} as const;

const numericResult = {
  schemaVersion: 1,
  id: 'structured-test-result.test.panel',
  testDefinitionId: numericDefinition.id,
  testDefinitionContentVersion: numericDefinition.contentVersion,
  sourceInstanceId: 'source-instance.test.laboratory',
  timeScopeId: 'time-scope.current',
  resolution,
  kind: 'numeric_panel',
  components: [
    {
      componentDefinitionId: 'lab-component.test.sodium',
      value: 140,
      displayValue: '140',
      unit: 'mmol/L',
      ucumCode: 'mmol/L',
      referenceInterval: {
        low: 135,
        high: 145,
        unit: 'mmol/L',
        ucumCode: 'mmol/L',
        display: '135–145 mmol/L',
        populationDefinitionId: 'reference-population.test.adult',
        sourceUseNoteIds: ['source-use-note.test.interval'],
      },
      interpretation: 'normal',
    },
  ],
} as const;

describe('structured test-result foundation', () => {
  it('round-trips a numeric panel with value, unit, reference interval, and interpretation', () => {
    const parsed = StructuredTestResultEnvelopeSchema.parse({
      definition: numericDefinition,
      result: numericResult,
    });
    expect(StructuredTestResultEnvelopeSchema.parse(JSON.parse(JSON.stringify(parsed)))).toEqual(
      parsed,
    );
    expect(parsed.result.kind).toBe('numeric_panel');
  });

  it('requires generated numeric components to match the result contract', () => {
    expect(
      TestDefinitionSchema.safeParse({
        ...numericDefinition,
        resultContract: {
          ...numericDefinition.resultContract,
          componentDefinitionIds: ['lab-component.test.other'],
        },
      }).success,
    ).toBe(false);
    expect(
      StructuredTestResultEnvelopeSchema.safeParse({
        definition: numericDefinition,
        result: {
          ...numericResult,
          components: [
            {
              ...numericResult.components[0],
              componentDefinitionId: 'lab-component.test.other',
            },
          ],
        },
      }).success,
    ).toBe(false);
  });

  it('supports patient-defined categorical panels without inventing components in the definition', () => {
    const definition = {
      ...numericDefinition,
      id: 'test.lab.test-toxicology',
      contentVersion: '1.1.0',
      generator: {
        type: 'patient_owned',
        reason: 'The patient owns decision-relevant categorical results.',
      },
      resultContract: {
        kind: 'categorical_panel',
        componentPolicy: 'patient_defined',
        componentDefinitionIds: [],
      },
    } as const;
    expect(
      StructuredTestResultEnvelopeSchema.safeParse({
        definition,
        result: {
          schemaVersion: 1,
          id: 'structured-test-result.test.toxicology',
          testDefinitionId: definition.id,
          testDefinitionContentVersion: definition.contentVersion,
          sourceInstanceId: 'source-instance.test.laboratory',
          timeScopeId: 'time-scope.current',
          resolution,
          kind: 'categorical_panel',
          components: [
            {
              componentDefinitionId: 'test-component.test.substance',
              valueId: 'test-value.test.negative',
              displayValue: 'Negative',
              interpretationIds: [],
            },
          ],
        },
      }).success,
    ).toBe(true);
  });

  it('supports structured imaging or electrical findings without narrative result prose', () => {
    const definition = {
      ...numericDefinition,
      id: 'test.diagnostic.test-imaging',
      contentVersion: '1.1.0',
      category: 'diagnostic_study',
      generator: {
        type: 'patient_owned',
        reason: 'The patient owns decision-relevant imaging findings.',
      },
      resultContract: {
        kind: 'structured_findings',
        resultDomain: 'imaging',
        findingPolicy: 'patient_defined',
      },
    } as const;
    expect(
      StructuredTestResultEnvelopeSchema.safeParse({
        definition,
        result: {
          schemaVersion: 1,
          id: 'structured-test-result.test.imaging',
          testDefinitionId: definition.id,
          testDefinitionContentVersion: definition.contentVersion,
          sourceInstanceId: 'source-instance.test.imaging-service',
          timeScopeId: 'time-scope.current',
          resolution,
          kind: 'structured_findings',
          resultDomain: 'imaging',
          findings: [
            {
              findingId: 'test-finding.test.no-acute-abnormality',
              outcome: 'absent',
              displayValue: 'No acute abnormality',
            },
          ],
          overallInterpretationId: null,
        },
      }).success,
    ).toBe(true);
  });

  it('supports a binary result while enforcing definition outcomes', () => {
    const definition = {
      ...numericDefinition,
      id: 'test.lab.test-binary',
      contentVersion: '1.1.0',
      generator: {
        type: 'patient_owned',
        reason: 'The patient owns a decision-relevant binary result.',
      },
      resultContract: {
        kind: 'binary',
        allowedOutcomes: ['positive', 'negative'],
      },
    } as const;
    expect(
      StructuredTestResultEnvelopeSchema.safeParse({
        definition,
        result: {
          schemaVersion: 1,
          id: 'structured-test-result.test.binary',
          testDefinitionId: definition.id,
          testDefinitionContentVersion: definition.contentVersion,
          sourceInstanceId: 'source-instance.test.laboratory',
          timeScopeId: 'time-scope.current',
          resolution,
          kind: 'binary',
          outcome: 'negative',
          displayValue: 'Negative',
          interpretationIds: [],
        },
      }).success,
    ).toBe(true);
    expect(
      StructuredTestResultEnvelopeSchema.safeParse({
        definition,
        result: {
          schemaVersion: 1,
          id: 'structured-test-result.test.binary',
          testDefinitionId: definition.id,
          testDefinitionContentVersion: definition.contentVersion,
          sourceInstanceId: 'source-instance.test.laboratory',
          timeScopeId: 'time-scope.current',
          resolution,
          kind: 'binary',
          outcome: 'indeterminate',
          displayValue: 'Indeterminate',
          interpretationIds: [],
        },
      }).success,
    ).toBe(false);
  });

  it('rejects prose-only results, sensitivity, probabilities, scoring, and reveal state', () => {
    expect(
      StructuredTestResultSchema.safeParse({
        ...numericResult,
        narrative: 'Everything is normal.',
      }).success,
    ).toBe(false);
    expect(
      TestDefinitionSchema.safeParse({
        ...numericDefinition,
        sensitivity: 0.9,
        specificity: 0.8,
      }).success,
    ).toBe(false);
    expect(
      StructuredTestResultSchema.safeParse({
        ...numericResult,
        points: 10,
        revealed: true,
      }).success,
    ).toBe(false);
  });
});
