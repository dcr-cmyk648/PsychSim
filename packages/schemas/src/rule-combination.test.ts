import { describe, expect, it } from 'vitest';

import { MedicationDefinitionSchema, RuleEvaluationSchema, ScoreRuleSchema } from './index';

describe('rule-combination schemas', () => {
  it('parses a historical trace row that predates combination metadata', () => {
    const parsed = RuleEvaluationSchema.parse({
      ruleId: 'rule.historical',
      label: 'Historical trace row',
      component: 'workup',
      matched: true,
      points: 10,
      classification: 'high_yield_obtained',
      explanation: 'Stored before rule-combination resolution was introduced.',
      relatedActionIds: [],
      relatedTreatmentIds: [],
    });

    expect(parsed).toMatchObject({
      ruleId: 'rule.historical',
      issueId: null,
      points: 10,
    });
    expect(parsed.combinationStatus).toBeUndefined();
    expect(parsed.pointsBeforeCombination).toBeUndefined();
  });

  it('defaults authoring rules to independent effects with no shared issue', () => {
    const scoreRule = ScoreRuleSchema.parse({
      id: 'rule.new-defaults',
      label: 'Default combination metadata',
      component: 'safety',
      predicate: { type: 'treatmentStarted', medicationId: 'medication.example' },
      pointsIfTrue: -20,
      pointsIfFalse: 0,
      classificationIfTrue: 'harmful',
      classificationIfFalse: 'safe',
      explanationIfTrue: 'The rule matched.',
      explanationIfFalse: 'The rule did not match.',
    });
    const medication = MedicationDefinitionSchema.parse({
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'medication.example',
      label: 'Example',
      classes: ['test'],
      tags: [],
      fitModifiers: [
        {
          id: 'modifier.example',
          patientTagIds: ['patient-tag.example'],
          effect: 'bonus',
          pointDelta: 10,
          explanation: 'Test-only modifier.',
          sourceUseNoteIds: [],
          medicalReviewStatus: 'unreviewed',
        },
      ],
      authorOverrides: [],
    });

    expect(scoreRule).toMatchObject({
      effectId: null,
      issueId: null,
      specificityPriority: 0,
    });
    expect(medication.fitModifiers[0]).toMatchObject({
      effectId: null,
      issueId: null,
      specificityPriority: 0,
    });
  });
});
