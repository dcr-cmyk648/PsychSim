import { describe, expect, it } from 'vitest';
import type { RuleEvaluation } from '@psychsim/schemas';

import { resolveRuleCombination } from './rule-combination';

const evaluation = (
  overrides: Partial<RuleEvaluation> & Pick<RuleEvaluation, 'ruleId' | 'points'>,
): RuleEvaluation => ({
  ruleId: overrides.ruleId,
  label: overrides.label ?? overrides.ruleId,
  component: overrides.component ?? 'medication_selection',
  matched: overrides.matched ?? true,
  points: overrides.points,
  classification: overrides.classification ?? 'strong_alternative',
  explanation: overrides.explanation ?? 'Test-only rule-combination fixture.',
  reviewStatus: overrides.reviewStatus ?? 'unreviewed',
  evidenceAttributions: overrides.evidenceAttributions ?? [],
  issueId: overrides.issueId ?? null,
  effectId: overrides.effectId ?? null,
  specificityPriority: overrides.specificityPriority ?? 0,
  relatedActionIds: overrides.relatedActionIds ?? [],
  relatedDiagnosisIds: overrides.relatedDiagnosisIds ?? [],
  relatedTreatmentIds: overrides.relatedTreatmentIds ?? [],
});

describe('rule combination', () => {
  it('lets a more-specific rule replace only the same effect and keeps the replaced row auditable', () => {
    const result = resolveRuleCombination([
      evaluation({
        ruleId: 'rule.general',
        points: 20,
        effectId: 'effect.medication-fit.sleep',
        specificityPriority: 10,
      }),
      evaluation({
        ruleId: 'rule.specific',
        points: 35,
        effectId: 'effect.medication-fit.sleep',
        specificityPriority: 30,
      }),
      evaluation({
        ruleId: 'rule.distinct',
        points: 15,
        effectId: 'effect.medication-fit.energy',
        specificityPriority: 10,
      }),
    ]);

    expect(result).toEqual([
      expect.objectContaining({
        ruleId: 'rule.general',
        points: 0,
        pointsBeforeCombination: 20,
        combinationStatus: 'replaced',
        resolvedByRuleId: 'rule.specific',
      }),
      expect.objectContaining({
        ruleId: 'rule.specific',
        points: 35,
        combinationStatus: 'applied',
      }),
      expect.objectContaining({
        ruleId: 'rule.distinct',
        points: 15,
        combinationStatus: 'applied',
      }),
    ]);
    expect(result.reduce((sum, row) => sum + row.points, 0)).toBe(50);
  });

  it('collapses duplicate harms to the worst row while allowing distinct fit effects to stack', () => {
    const result = resolveRuleCombination([
      evaluation({
        ruleId: 'rule.issue-moderate',
        points: -30,
        issueId: 'issue.duplicate-therapy',
        classification: 'weak',
      }),
      evaluation({
        ruleId: 'rule.issue-major',
        points: -90,
        issueId: 'issue.duplicate-therapy',
        classification: 'harmful',
      }),
      evaluation({
        ruleId: 'rule.fit-one',
        points: 20,
        effectId: 'effect.fit.one',
      }),
      evaluation({
        ruleId: 'rule.fit-two',
        points: 25,
        effectId: 'effect.fit.two',
      }),
    ]);

    expect(result.find((row) => row.ruleId === 'rule.issue-moderate')).toMatchObject({
      points: 0,
      pointsBeforeCombination: -30,
      combinationStatus: 'deduplicated',
      resolvedByRuleId: 'rule.issue-major',
    });
    expect(result.find((row) => row.ruleId === 'rule.issue-major')).toMatchObject({
      points: -90,
      combinationStatus: 'applied',
    });
    expect(result.reduce((sum, row) => sum + row.points, 0)).toBe(-45);
  });

  it('suppresses same-treatment base and fit rewards for a hard contraindication only', () => {
    const rows = [
      evaluation({
        ruleId: 'rule.primary',
        points: 200,
        relatedTreatmentIds: ['medication.example'],
      }),
      evaluation({
        ruleId: 'rule.fit',
        points: 35,
        relatedTreatmentIds: ['medication.example'],
      }),
      evaluation({
        ruleId: 'rule.unrelated',
        points: 25,
        relatedTreatmentIds: ['medication.other'],
      }),
      evaluation({
        ruleId: 'rule.contraindication',
        points: -100,
        classification: 'harmful',
        relatedTreatmentIds: ['medication.example'],
      }),
    ];
    const result = resolveRuleCombination(rows, {
      hardContraindicationRuleIds: ['rule.contraindication'],
      suppressiblePositiveRuleIds: ['rule.primary', 'rule.fit', 'rule.unrelated'],
    });

    expect(result.find((row) => row.ruleId === 'rule.primary')).toMatchObject({
      points: 0,
      pointsBeforeCombination: 200,
      combinationStatus: 'suppressed',
      resolvedByRuleId: 'rule.contraindication',
    });
    expect(result.find((row) => row.ruleId === 'rule.fit')).toMatchObject({
      points: 0,
      pointsBeforeCombination: 35,
      combinationStatus: 'suppressed',
    });
    expect(result.find((row) => row.ruleId === 'rule.unrelated')).toMatchObject({
      points: 25,
      combinationStatus: 'applied',
    });
  });

  it('does not suppress legitimate benefits for a serious but nonabsolute risk penalty', () => {
    const result = resolveRuleCombination(
      [
        evaluation({
          ruleId: 'rule.primary',
          points: 200,
          relatedTreatmentIds: ['medication.example'],
        }),
        evaluation({
          ruleId: 'rule.fit',
          points: 35,
          relatedTreatmentIds: ['medication.example'],
        }),
        evaluation({
          ruleId: 'rule.high-risk-penalty',
          points: -90,
          classification: 'harmful',
          relatedTreatmentIds: ['medication.example'],
        }),
      ],
      {
        hardContraindicationRuleIds: [],
        suppressiblePositiveRuleIds: ['rule.primary', 'rule.fit'],
      },
    );

    expect(
      result.map(({ ruleId, points, combinationStatus }) => ({
        ruleId,
        points,
        combinationStatus,
      })),
    ).toEqual([
      { ruleId: 'rule.primary', points: 200, combinationStatus: 'applied' },
      { ruleId: 'rule.fit', points: 35, combinationStatus: 'applied' },
      { ruleId: 'rule.high-risk-penalty', points: -90, combinationStatus: 'applied' },
    ]);
  });

  it('uses explicit specificity and a stable ID tie-break instead of input order', () => {
    const firstOrder = [
      evaluation({
        ruleId: 'rule.beta',
        points: 10,
        effectId: 'effect.tie',
        specificityPriority: 20,
      }),
      evaluation({
        ruleId: 'rule.alpha',
        points: 15,
        effectId: 'effect.tie',
        specificityPriority: 20,
      }),
    ];
    const reversed = [...firstOrder].reverse();

    const winner = (rows: readonly RuleEvaluation[]) =>
      resolveRuleCombination(rows).find((row) => row.combinationStatus === 'applied')?.ruleId;

    expect(winner(firstOrder)).toBe('rule.alpha');
    expect(winner(reversed)).toBe('rule.alpha');
  });
});
