import { describe, expect, it } from 'vitest';
import {
  GeneratedRulePointEvaluationSchema,
  type CompiledRubricRule,
  type GeneratedRulePointEvaluation,
  type RuleEvaluation,
} from '@psychsim/schemas';

import { resolveGeneratedRuleCombination, resolveRuleCombination } from './rule-combination';

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

const generatedRule = (
  id: string,
  overrides: Partial<CompiledRubricRule> = {},
): CompiledRubricRule => ({
  ruleRef: {
    kind: 'medication_regimen_contributor',
    id,
    contentVersion: '1.0.0',
    ownerId: 'diagnosis.test-generated-combination',
    ownerContentVersion: '1.0.0',
  },
  label: overrides.label ?? id,
  inclusionReason: overrides.inclusionReason ?? 'discovered_full_state_modifier',
  patientWhen: overrides.patientWhen ?? null,
  actionWhen: overrides.actionWhen ?? null,
  triggeredInformationPrerequisite: overrides.triggeredInformationPrerequisite ?? null,
  matchedPatientFactBindings: overrides.matchedPatientFactBindings ?? [],
  matchedActionTargets: overrides.matchedActionTargets ?? [],
  ruleKind: overrides.ruleKind ?? 'fit',
  stance: overrides.stance ?? 'acceptable',
  concernLevel: overrides.concernLevel ?? 'moderate',
  certaintyLevel: overrides.certaintyLevel ?? 'moderate',
  effectId: overrides.effectId ?? null,
  issueId: overrides.issueId ?? null,
  specificityPriority: overrides.specificityPriority ?? 0,
  rationale: overrides.rationale ?? 'Synthetic generated-combination rule.',
  review: overrides.review ?? {
    status: 'approved',
    reviewerId: 'reviewer.test',
    reviewedAt: '2026-07-30T12:00:00.000Z',
    sourceUseNoteIds: ['source-use.test.generated-combination'],
  },
  developerOpinionIds: overrides.developerOpinionIds ?? [],
  balanceRef: overrides.balanceRef ?? {
    id: `balance.${id}`,
    contentVersion: '1.0.0',
  },
});

const generatedEvaluation = (
  rule: CompiledRubricRule,
  points: number,
  medicationIdentityId = 'medication.example',
): GeneratedRulePointEvaluation =>
  GeneratedRulePointEvaluationSchema.parse({
    id: `generated-point-trace.${rule.ruleRef.id}`,
    source: {
      kind: 'compiled_decision_rule',
      ruleRef: rule.ruleRef,
    },
    balanceRef: rule.balanceRef,
    label: rule.label,
    component: 'medication_selection',
    matched: true,
    status: 'applied',
    pointsBeforeCombination: points,
    appliedPoints: points,
    resolvedByTraceId: null,
    combinationExplanation: null,
    triggeredInformationPrerequisiteEvaluation: null,
    relatedSelectedActionTargets: [
      {
        kind: 'medication_start',
        medicationIdentityId,
      },
    ],
    relatedDiagnosisIds: [],
    explanation: 'Synthetic generated-combination balance result.',
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

describe('native generated rule combination', () => {
  it('applies specificity, worst-only harm, and exact-target contraindication suppression in order', () => {
    const generalFit = generatedRule('rule.generated.general-fit', {
      effectId: 'effect.generated.sleep-fit',
      specificityPriority: 10,
    });
    const specificFit = generatedRule('rule.generated.specific-fit', {
      effectId: 'effect.generated.sleep-fit',
      specificityPriority: 30,
    });
    const unrelatedFit = generatedRule('rule.generated.unrelated-fit', {
      effectId: 'effect.generated.energy-fit',
      specificityPriority: 10,
    });
    const moderateHarm = generatedRule('rule.generated.moderate-harm', {
      ruleKind: 'interaction',
      stance: 'avoid',
      effectId: null,
      issueId: 'issue.generated.duplicate-harm',
      specificityPriority: 10,
    });
    const majorHarm = generatedRule('rule.generated.major-harm', {
      ruleKind: 'interaction',
      stance: 'avoid',
      effectId: null,
      issueId: 'issue.generated.duplicate-harm',
      specificityPriority: 20,
    });
    const contraindication = generatedRule('rule.generated.contraindication', {
      ruleKind: 'contraindication',
      stance: 'contraindicated',
      inclusionReason: 'automatic_safety',
      effectId: null,
      issueId: 'issue.generated.contraindication',
      specificityPriority: 100,
    });
    const regulatoryAlignment = generatedRule('rule.generated.regulatory-alignment', {
      ruleKind: 'regulatory_alignment',
      effectId: 'effect.generated.regulatory-alignment',
      specificityPriority: 10,
    });
    const otherMedicationFit = generatedRule('rule.generated.other-medication-fit', {
      effectId: 'effect.generated.other-medication-fit',
      specificityPriority: 10,
    });
    const rules = [
      generalFit,
      specificFit,
      unrelatedFit,
      moderateHarm,
      majorHarm,
      contraindication,
      regulatoryAlignment,
      otherMedicationFit,
    ];
    const evaluations = [
      generatedEvaluation(generalFit, 20),
      generatedEvaluation(specificFit, 35),
      generatedEvaluation(unrelatedFit, 15),
      generatedEvaluation(moderateHarm, -30),
      generatedEvaluation(majorHarm, -90),
      generatedEvaluation(contraindication, -150),
      generatedEvaluation(regulatoryAlignment, 10),
      generatedEvaluation(otherMedicationFit, 25, 'medication.other'),
    ];

    const result = resolveGeneratedRuleCombination({ evaluations, rules });

    expect(
      result.find(
        (row) =>
          row.source.kind === 'compiled_decision_rule' &&
          row.source.ruleRef.id === generalFit.ruleRef.id,
      ),
    ).toMatchObject({
      status: 'replaced',
      pointsBeforeCombination: 20,
      appliedPoints: 0,
      resolvedByTraceId: `generated-point-trace.${specificFit.ruleRef.id}`,
      combinationExplanation: expect.stringContaining('more-specific'),
    });
    expect(
      result.find(
        (row) =>
          row.source.kind === 'compiled_decision_rule' &&
          row.source.ruleRef.id === moderateHarm.ruleRef.id,
      ),
    ).toMatchObject({
      status: 'deduplicated',
      pointsBeforeCombination: -30,
      appliedPoints: 0,
      resolvedByTraceId: `generated-point-trace.${majorHarm.ruleRef.id}`,
      combinationExplanation: expect.stringContaining('worst applied consequence'),
    });
    for (const rule of [specificFit, unrelatedFit, regulatoryAlignment]) {
      expect(
        result.find(
          (row) =>
            row.source.kind === 'compiled_decision_rule' &&
            row.source.ruleRef.id === rule.ruleRef.id,
        ),
      ).toMatchObject({
        status: 'suppressed',
        appliedPoints: 0,
        resolvedByTraceId: `generated-point-trace.${contraindication.ruleRef.id}`,
      });
    }
    expect(
      result.find(
        (row) =>
          row.source.kind === 'compiled_decision_rule' &&
          row.source.ruleRef.id === otherMedicationFit.ruleRef.id,
      ),
    ).toMatchObject({ status: 'applied', appliedPoints: 25 });
    expect(result.reduce((total, row) => total + row.appliedPoints, 0)).toBe(-215);
    for (const row of result) {
      expect(GeneratedRulePointEvaluationSchema.parse(row)).toEqual(row);
    }
  });

  it('is order-independent and deterministically repairs controller, status, or point tampering', () => {
    const alpha = generatedRule('rule.generated.alpha', {
      effectId: 'effect.generated.tie',
      specificityPriority: 20,
    });
    const beta = generatedRule('rule.generated.beta', {
      effectId: 'effect.generated.tie',
      specificityPriority: 20,
    });
    const evaluations = [generatedEvaluation(beta, 10), generatedEvaluation(alpha, 15)];
    const expected = resolveGeneratedRuleCombination({
      evaluations,
      rules: [beta, alpha],
    });
    expect(
      resolveGeneratedRuleCombination({
        evaluations: [...evaluations].reverse(),
        rules: [alpha, beta],
      }).sort((left, right) => left.id.localeCompare(right.id)),
    ).toEqual([...expected].sort((left, right) => left.id.localeCompare(right.id)));
    expect(
      expected.find(
        (row) =>
          row.source.kind === 'compiled_decision_rule' && row.source.ruleRef.id === beta.ruleRef.id,
      ),
    ).toMatchObject({
      status: 'replaced',
      appliedPoints: 0,
      resolvedByTraceId: `generated-point-trace.${alpha.ruleRef.id}`,
    });

    const tampered = structuredClone(expected);
    const replaced = tampered.find((row) => row.status === 'replaced');
    if (replaced === undefined) throw new Error('Expected one replaced generated row.');
    replaced.status = 'deduplicated';
    replaced.appliedPoints = -1;
    replaced.resolvedByTraceId = 'generated-point-trace.rule.generated.beta';
    expect(
      resolveGeneratedRuleCombination({
        evaluations: tampered,
        rules: [alpha, beta],
      }),
    ).toEqual(expected);
  });

  it('preserves a deterministic controller chain when a suppressing contraindication is later deduplicated', () => {
    const fit = generatedRule('rule.generated.controller-chain-fit', {
      effectId: 'effect.generated.controller-chain-fit',
    });
    const stableFirstContraindication = generatedRule(
      'rule.generated.controller-chain-contraindication-alpha',
      {
        ruleKind: 'contraindication',
        stance: 'contraindicated',
        effectId: null,
        issueId: 'issue.generated.controller-chain-contraindication',
        specificityPriority: 10,
      },
    );
    const worstContraindication = generatedRule(
      'rule.generated.controller-chain-contraindication-zeta',
      {
        ruleKind: 'contraindication',
        stance: 'contraindicated',
        effectId: null,
        issueId: 'issue.generated.controller-chain-contraindication',
        specificityPriority: 20,
      },
    );
    const result = resolveGeneratedRuleCombination({
      evaluations: [
        generatedEvaluation(fit, 35),
        generatedEvaluation(stableFirstContraindication, -100),
        generatedEvaluation(worstContraindication, -150),
      ],
      rules: [fit, stableFirstContraindication, worstContraindication],
    });
    expect(
      result.find(
        (row) =>
          row.source.kind === 'compiled_decision_rule' && row.source.ruleRef.id === fit.ruleRef.id,
      ),
    ).toMatchObject({
      status: 'suppressed',
      resolvedByTraceId: `generated-point-trace.${stableFirstContraindication.ruleRef.id}`,
    });
    expect(
      result.find(
        (row) =>
          row.source.kind === 'compiled_decision_rule' &&
          row.source.ruleRef.id === stableFirstContraindication.ruleRef.id,
      ),
    ).toMatchObject({
      status: 'deduplicated',
      resolvedByTraceId: `generated-point-trace.${worstContraindication.ruleRef.id}`,
    });
    expect(
      result.find(
        (row) =>
          row.source.kind === 'compiled_decision_rule' &&
          row.source.ruleRef.id === worstContraindication.ruleRef.id,
      ),
    ).toMatchObject({ status: 'applied', appliedPoints: -150 });
    expect(result.reduce((total, row) => total + row.appliedPoints, 0)).toBe(-150);
    result.forEach((row) => expect(GeneratedRulePointEvaluationSchema.parse(row)).toEqual(row));
  });

  it('does not suppress benefits for a serious nonabsolute risk or a broad nonexact target', () => {
    const fit = generatedRule('rule.generated.risk-visible-fit', {
      effectId: 'effect.generated.risk-visible-fit',
    });
    const seriousRisk = generatedRule('rule.generated.serious-risk', {
      ruleKind: 'interaction',
      stance: 'avoid',
      effectId: null,
      issueId: 'issue.generated.serious-risk',
    });
    const broadContraindication = generatedRule('rule.generated.broad-contraindication', {
      ruleKind: 'contraindication',
      stance: 'contraindicated',
      effectId: null,
      issueId: 'issue.generated.broad-contraindication',
    });
    const broadEvaluation = {
      ...generatedEvaluation(broadContraindication, -150),
      relatedSelectedActionTargets: [{ kind: 'any_medication_start' as const }],
    };
    const result = resolveGeneratedRuleCombination({
      evaluations: [
        generatedEvaluation(fit, 35),
        generatedEvaluation(seriousRisk, -90),
        broadEvaluation,
      ],
      rules: [fit, seriousRisk, broadContraindication],
    });

    expect(
      result.find(
        (row) =>
          row.source.kind === 'compiled_decision_rule' && row.source.ruleRef.id === fit.ruleRef.id,
      ),
    ).toMatchObject({ status: 'applied', appliedPoints: 35 });
  });

  it('rejects schema-valid-looking combination rows without a complete controller explanation pair', () => {
    const rule = generatedRule('rule.generated.schema-controller-pair');
    const applied = generatedEvaluation(rule, 20);

    expect(
      GeneratedRulePointEvaluationSchema.safeParse({
        ...applied,
        status: 'suppressed',
        appliedPoints: 0,
        resolvedByTraceId: 'generated-point-trace.rule.generated.controller',
        combinationExplanation: null,
      }).success,
    ).toBe(false);
    expect(
      GeneratedRulePointEvaluationSchema.safeParse({
        ...applied,
        resolvedByTraceId: 'generated-point-trace.rule.generated.controller',
        combinationExplanation: 'A controller cannot be attached to an applied row.',
      }).success,
    ).toBe(false);
  });
});
