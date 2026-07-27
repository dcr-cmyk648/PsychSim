import type { RuleEvaluation } from '@psychsim/schemas';

export interface RuleCombinationOptions {
  /**
   * Applied rules in this set are true hard contraindications. They suppress
   * only explicitly identified positive treatment-base and fit rows for the
   * same treatment.
   */
  hardContraindicationRuleIds?: readonly string[];
  suppressiblePositiveRuleIds?: readonly string[];
}

const specificityOf = (evaluation: RuleEvaluation): number => evaluation.specificityPriority ?? 0;

const resetCombinationState = (evaluation: RuleEvaluation): RuleEvaluation => ({
  ...evaluation,
  points: evaluation.pointsBeforeCombination ?? evaluation.points,
  combinationStatus: 'applied',
  pointsBeforeCombination: null,
  resolvedByRuleId: null,
  combinationExplanation: null,
});

const deactivate = (
  evaluation: RuleEvaluation,
  status: Exclude<NonNullable<RuleEvaluation['combinationStatus']>, 'applied'>,
  resolvedByRuleId: string,
  explanation: string,
): RuleEvaluation => ({
  ...evaluation,
  pointsBeforeCombination: evaluation.points,
  points: 0,
  combinationStatus: status,
  resolvedByRuleId,
  combinationExplanation: explanation,
});

const treatmentIdsOverlap = (left: RuleEvaluation, right: RuleEvaluation): boolean => {
  const rightIds = new Set(right.relatedTreatmentIds);
  return left.relatedTreatmentIds.some((treatmentId) => rightIds.has(treatmentId));
};

const winnerForEffect = (evaluations: readonly RuleEvaluation[]): RuleEvaluation =>
  [...evaluations].sort(
    (left, right) =>
      specificityOf(right) - specificityOf(left) || left.ruleId.localeCompare(right.ruleId),
  )[0]!;

const winnerForIssue = (evaluations: readonly RuleEvaluation[]): RuleEvaluation =>
  [...evaluations].sort(
    (left, right) =>
      left.points - right.points ||
      specificityOf(right) - specificityOf(left) ||
      left.ruleId.localeCompare(right.ruleId),
  )[0]!;

/**
 * Resolves independently authored trace rows without hiding their history.
 *
 * 1. A more-specific rule replaces a general rule only when both explicitly
 *    name the same effect.
 * 2. A true hard contraindication suppresses explicitly identified positive
 *    base/fit rows for the same treatment.
 * 3. Negative rows that name the same underlying issue collapse to the worst
 *    consequence.
 * 4. Distinct effects continue to stack.
 *
 * Replaced, suppressed, and deduplicated rows remain in the trace with zero
 * applied points and an explanation of which rule controlled the result.
 */
export const resolveRuleCombination = (
  input: readonly RuleEvaluation[],
  options: RuleCombinationOptions = {},
): RuleEvaluation[] => {
  const resolved = input.map(resetCombinationState);

  const indicesByEffectId = new Map<string, number[]>();
  resolved.forEach((evaluation, index) => {
    if (evaluation.effectId === null || evaluation.effectId === undefined) return;
    const indices = indicesByEffectId.get(evaluation.effectId) ?? [];
    indices.push(index);
    indicesByEffectId.set(evaluation.effectId, indices);
  });
  for (const [effectId, indices] of indicesByEffectId) {
    if (indices.length < 2) continue;
    const winner = winnerForEffect(indices.map((index) => resolved[index]!));
    for (const index of indices) {
      const evaluation = resolved[index]!;
      if (evaluation.ruleId === winner.ruleId) continue;
      resolved[index] = deactivate(
        evaluation,
        'replaced',
        winner.ruleId,
        `${winner.label} is the more-specific rule for ${effectId}; this general contributor was retained for audit but did not add points.`,
      );
    }
  }

  const hardContraindicationIds = new Set(options.hardContraindicationRuleIds ?? []);
  const suppressiblePositiveIds = new Set(options.suppressiblePositiveRuleIds ?? []);
  const activeContraindications = resolved
    .filter(
      (evaluation) =>
        evaluation.combinationStatus === 'applied' &&
        hardContraindicationIds.has(evaluation.ruleId),
    )
    .sort((left, right) => left.ruleId.localeCompare(right.ruleId));

  resolved.forEach((evaluation, index) => {
    if (
      evaluation.combinationStatus !== 'applied' ||
      evaluation.points <= 0 ||
      !suppressiblePositiveIds.has(evaluation.ruleId)
    ) {
      return;
    }
    const contraindication = activeContraindications.find((candidate) =>
      treatmentIdsOverlap(evaluation, candidate),
    );
    if (!contraindication) return;
    resolved[index] = deactivate(
      evaluation,
      'suppressed',
      contraindication.ruleId,
      `${contraindication.label} is an applied hard contraindication for the same treatment, so this positive base or fit contributor did not add points.`,
    );
  });

  const indicesByIssueId = new Map<string, number[]>();
  resolved.forEach((evaluation, index) => {
    if (
      evaluation.combinationStatus !== 'applied' ||
      evaluation.points >= 0 ||
      evaluation.issueId === null
    ) {
      return;
    }
    const indices = indicesByIssueId.get(evaluation.issueId) ?? [];
    indices.push(index);
    indicesByIssueId.set(evaluation.issueId, indices);
  });
  for (const [issueId, indices] of indicesByIssueId) {
    if (indices.length < 2) continue;
    const winner = winnerForIssue(indices.map((index) => resolved[index]!));
    for (const index of indices) {
      const evaluation = resolved[index]!;
      if (evaluation.ruleId === winner.ruleId) continue;
      resolved[index] = deactivate(
        evaluation,
        'deduplicated',
        winner.ruleId,
        `${winner.label} is the worst applied consequence for ${issueId}; this duplicate consequence was retained for audit but did not stack.`,
      );
    }
  }

  return resolved;
};
