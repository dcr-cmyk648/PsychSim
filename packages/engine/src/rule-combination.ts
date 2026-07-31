import type {
  CompiledRubricRule,
  DecisionActionTarget,
  GeneratedRulePointEvaluation,
  RuleEvaluation,
} from '@psychsim/schemas';

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

const generatedRuleKey = (rule: CompiledRubricRule): string =>
  [
    rule.ruleRef.kind,
    rule.ruleRef.id,
    rule.ruleRef.contentVersion,
    rule.ruleRef.ownerId,
    rule.ruleRef.ownerContentVersion,
  ].join('\0');

const generatedTraceRuleKey = (evaluation: GeneratedRulePointEvaluation): string | null =>
  evaluation.source.kind === 'compiled_decision_rule'
    ? [
        evaluation.source.ruleRef.kind,
        evaluation.source.ruleRef.id,
        evaluation.source.ruleRef.contentVersion,
        evaluation.source.ruleRef.ownerId,
        evaluation.source.ruleRef.ownerContentVersion,
      ].join('\0')
    : null;

const exactTreatmentTargetKey = (target: DecisionActionTarget): string | null => {
  switch (target.kind) {
    case 'medication_start':
      return `medication_start:${target.medicationIdentityId}`;
    case 'regimen_entry_operation':
      return `regimen_entry_operation:${target.regimenEntryId}:${target.operation}`;
    case 'regimen_medication_operation':
      return `regimen_medication_operation:${target.medicationIdentityId}:${target.operation}`;
    case 'intervention':
      return `intervention:${target.interventionId}`;
    case 'disposition':
      return `disposition:${target.dispositionId}`;
    default:
      return null;
  }
};

const generatedTreatmentTargetsOverlap = (
  left: GeneratedRulePointEvaluation,
  right: GeneratedRulePointEvaluation,
): boolean => {
  const rightKeys = new Set(
    right.relatedSelectedActionTargets.flatMap((target) => {
      const key = exactTreatmentTargetKey(target);
      return key === null ? [] : [key];
    }),
  );
  return left.relatedSelectedActionTargets.some((target) => {
    const key = exactTreatmentTargetKey(target);
    return key !== null && rightKeys.has(key);
  });
};

const isGeneratedCombinationStatus = (
  status: GeneratedRulePointEvaluation['status'],
): status is 'replaced' | 'deduplicated' | 'suppressed' =>
  status === 'replaced' || status === 'deduplicated' || status === 'suppressed';

const resetGeneratedCombinationState = (
  evaluation: GeneratedRulePointEvaluation,
): GeneratedRulePointEvaluation => {
  if (!isGeneratedCombinationStatus(evaluation.status)) {
    return {
      ...evaluation,
      resolvedByTraceId: null,
      combinationExplanation: null,
    };
  }
  return {
    ...evaluation,
    status: 'applied',
    appliedPoints: evaluation.pointsBeforeCombination ?? evaluation.appliedPoints,
    resolvedByTraceId: null,
    combinationExplanation: null,
  };
};

const deactivateGeneratedEvaluation = (
  evaluation: GeneratedRulePointEvaluation,
  status: 'replaced' | 'deduplicated' | 'suppressed',
  resolvedByTraceId: string,
  explanation: string,
): GeneratedRulePointEvaluation => ({
  ...evaluation,
  status,
  pointsBeforeCombination: evaluation.pointsBeforeCombination ?? evaluation.appliedPoints,
  appliedPoints: 0,
  resolvedByTraceId,
  combinationExplanation: explanation,
});

interface GeneratedCombinationEntry {
  readonly index: number;
  readonly evaluation: GeneratedRulePointEvaluation;
  readonly rule: CompiledRubricRule;
}

const generatedEntryStableKey = (entry: GeneratedCombinationEntry): string =>
  `${generatedRuleKey(entry.rule)}\0${entry.evaluation.id}`;

const CONTRAINDICATION_SUPPRESSIBLE_POSITIVE_RULE_KINDS = new Set<CompiledRubricRule['ruleKind']>([
  'primary_route',
  'fit',
  'response',
  'tolerability',
  'prior_trial',
  'regulatory_alignment',
]);

/**
 * Applies D-159's already-approved combination stages to native generated
 * trace rows. The exact compiled-rule metadata supplies specificity, issue,
 * hard-contraindication, and suppressible-positive semantics; point magnitude
 * never invents those classifications.
 */
export const resolveGeneratedRuleCombination = (input: {
  readonly evaluations: readonly GeneratedRulePointEvaluation[];
  readonly rules: readonly CompiledRubricRule[];
}): GeneratedRulePointEvaluation[] => {
  const ruleByKey = new Map(input.rules.map((rule) => [generatedRuleKey(rule), rule]));
  const resolved = input.evaluations.map((evaluation) => {
    const key = generatedTraceRuleKey(evaluation);
    return key !== null && ruleByKey.has(key)
      ? resetGeneratedCombinationState(evaluation)
      : { ...evaluation };
  });
  const activeEntries = (): GeneratedCombinationEntry[] =>
    resolved.flatMap((evaluation, index) => {
      if (evaluation.status !== 'applied') return [];
      const key = generatedTraceRuleKey(evaluation);
      const rule = key === null ? undefined : ruleByKey.get(key);
      return rule === undefined ? [] : [{ index, evaluation, rule }];
    });

  const entriesByEffectId = new Map<string, GeneratedCombinationEntry[]>();
  for (const entry of activeEntries()) {
    if (entry.rule.effectId === null) continue;
    const entries = entriesByEffectId.get(entry.rule.effectId) ?? [];
    entries.push(entry);
    entriesByEffectId.set(entry.rule.effectId, entries);
  }
  for (const [effectId, entries] of entriesByEffectId) {
    if (entries.length < 2) continue;
    const winner = [...entries].sort(
      (left, right) =>
        right.rule.specificityPriority - left.rule.specificityPriority ||
        generatedEntryStableKey(left).localeCompare(generatedEntryStableKey(right)),
    )[0]!;
    for (const entry of entries) {
      if (entry.index === winner.index) continue;
      resolved[entry.index] = deactivateGeneratedEvaluation(
        resolved[entry.index]!,
        'replaced',
        winner.evaluation.id,
        `${winner.rule.label} is the more-specific compiled rule for ${effectId}; this contributor remains visible but does not add points.`,
      );
    }
  }

  const activeContraindications = activeEntries()
    .filter(
      (entry) =>
        entry.rule.ruleKind === 'contraindication' && entry.rule.stance === 'contraindicated',
    )
    .sort((left, right) =>
      generatedEntryStableKey(left).localeCompare(generatedEntryStableKey(right)),
    );
  for (const entry of activeEntries()) {
    if (
      entry.evaluation.appliedPoints <= 0 ||
      !CONTRAINDICATION_SUPPRESSIBLE_POSITIVE_RULE_KINDS.has(entry.rule.ruleKind)
    ) {
      continue;
    }
    const contraindication = activeContraindications.find((candidate) =>
      generatedTreatmentTargetsOverlap(entry.evaluation, candidate.evaluation),
    );
    if (contraindication === undefined) continue;
    resolved[entry.index] = deactivateGeneratedEvaluation(
      resolved[entry.index]!,
      'suppressed',
      contraindication.evaluation.id,
      `${contraindication.rule.label} is an applied hard contraindication for the same exact selected treatment target, so this positive primary-route or fit contributor does not add points.`,
    );
  }

  const entriesByIssueId = new Map<string, GeneratedCombinationEntry[]>();
  for (const entry of activeEntries()) {
    if (entry.evaluation.appliedPoints >= 0 || entry.rule.issueId === null) continue;
    const entries = entriesByIssueId.get(entry.rule.issueId) ?? [];
    entries.push(entry);
    entriesByIssueId.set(entry.rule.issueId, entries);
  }
  for (const [issueId, entries] of entriesByIssueId) {
    if (entries.length < 2) continue;
    const winner = [...entries].sort(
      (left, right) =>
        left.evaluation.appliedPoints - right.evaluation.appliedPoints ||
        right.rule.specificityPriority - left.rule.specificityPriority ||
        generatedEntryStableKey(left).localeCompare(generatedEntryStableKey(right)),
    )[0]!;
    for (const entry of entries) {
      if (entry.index === winner.index) continue;
      resolved[entry.index] = deactivateGeneratedEvaluation(
        resolved[entry.index]!,
        'deduplicated',
        winner.evaluation.id,
        `${winner.rule.label} is the worst applied consequence for ${issueId}; this duplicate consequence remains visible but does not stack.`,
      );
    }
  }

  return resolved;
};
