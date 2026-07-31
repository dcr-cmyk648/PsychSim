import {
  DecisionRuleCandidateDefinitionSchema,
  MedicationRegimenTransitionSelectionSchema,
  type DecisionActionTarget,
  type DecisionRuleCandidateDefinition,
  type DiagnosisDefinition,
  type FocusedMedicationRegimenRoute,
  type MedicationClassDefinition,
  type MedicationClassMembership,
  type MedicationRegimenEntryV2,
  type MedicationRegimenTarget,
  type MedicationRegimenTransitionPredicate,
  type MedicationRegimenTransitionSelection,
} from '@psychsim/schemas';

export const MEDICATION_REGIMEN_ROUTE_ADAPTER_VERSION = '1.0.0';

export type MedicationRegimenRouteAdapterErrorCode =
  | 'DIAGNOSIS_OWNER_MISMATCH'
  | 'QUALITATIVE_RULE_MISSING'
  | 'QUALITATIVE_RULE_MISMATCH'
  | 'UNSUPPORTED_QUALITATIVE_RULE'
  | 'MEDICATION_CLASS_MISSING'
  | 'MEDICATION_CLASS_STALE'
  | 'MEDICATION_CLASS_UNREVIEWED'
  | 'MEDICATION_CLASS_MEMBERSHIP_MISSING'
  | 'MEDICATION_CLASS_MEMBERSHIP_UNREVIEWED'
  | 'UNSUPPORTED_NEGATED_ACTION_ANCHOR'
  | 'ACTION_ANCHOR_EMPTY'
  | 'CANDIDATE_INVALID';

export interface MedicationRegimenRouteAdapterError {
  readonly code: MedicationRegimenRouteAdapterErrorCode;
  readonly message: string;
  readonly contentIds: readonly string[];
}

export type MedicationRegimenRouteAdapterResult =
  | { readonly ok: true; readonly value: DecisionRuleCandidateDefinition }
  | { readonly ok: false; readonly error: MedicationRegimenRouteAdapterError };

export interface AdaptFocusedMedicationRegimenRouteInput {
  readonly route: FocusedMedicationRegimenRoute;
  readonly diagnosis: DiagnosisDefinition;
  readonly medicationClasses: readonly MedicationClassDefinition[];
  readonly classMemberships: readonly MedicationClassMembership[];
}

const compareStrings = (left: string, right: string): number =>
  left === right ? 0 : left < right ? -1 : 1;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const actionTargetKey = (target: DecisionActionTarget): string => JSON.stringify(target);

const uniqueActionTargets = (targets: readonly DecisionActionTarget[]): DecisionActionTarget[] => [
  ...new Map(
    targets
      .map((target) => [actionTargetKey(target), target] as const)
      .sort(([left], [right]) => compareStrings(left, right)),
  ).values(),
];

const fail = (
  code: MedicationRegimenRouteAdapterErrorCode,
  message: string,
  contentIds: readonly string[],
): MedicationRegimenRouteAdapterResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const diagnosisRules = (diagnosis: DiagnosisDefinition) => [
  ...diagnosis.baseRules,
  ...(diagnosis.severityAxis?.levels.flatMap((level) => level.rules) ?? []),
  ...diagnosis.specifiers.flatMap((specifier) => specifier.rules),
];

interface RouteTargetContext {
  readonly route: FocusedMedicationRegimenRoute;
  readonly medicationClassesById: ReadonlyMap<string, MedicationClassDefinition>;
  readonly membershipsByClassId: ReadonlyMap<string, readonly MedicationClassMembership[]>;
}

type ActionAnchorResult =
  | { readonly ok: true; readonly targets: readonly DecisionActionTarget[] }
  | { readonly ok: false; readonly error: MedicationRegimenRouteAdapterError };

type TargetMedicationIdsResult =
  | { readonly ok: true; readonly medicationIds: readonly string[] }
  | { readonly ok: false; readonly error: MedicationRegimenRouteAdapterError };

const targetMedicationIds = (
  target: MedicationRegimenTarget,
  context: RouteTargetContext,
): TargetMedicationIdsResult => {
  if (target.kind === 'any_medication') {
    return { ok: true, medicationIds: [] };
  }
  if (target.kind === 'medication') {
    return { ok: true, medicationIds: [target.medicationIdentityId] };
  }

  const definition = context.medicationClassesById.get(target.medicationClassId);
  if (!definition) {
    return {
      ok: false,
      error: {
        code: 'MEDICATION_CLASS_MISSING',
        message: `${context.route.id} references missing medication class ${target.medicationClassId}.`,
        contentIds: uniqueSorted([context.route.id, target.medicationClassId]),
      },
    };
  }
  if (definition.contentVersion !== target.medicationClassContentVersion) {
    return {
      ok: false,
      error: {
        code: 'MEDICATION_CLASS_STALE',
        message: `${context.route.id} pins ${target.medicationClassId}@${target.medicationClassContentVersion}; current content is ${definition.contentVersion}.`,
        contentIds: uniqueSorted([context.route.id, target.medicationClassId]),
      },
    };
  }
  if (definition.review.status !== 'approved') {
    return {
      ok: false,
      error: {
        code: 'MEDICATION_CLASS_UNREVIEWED',
        message: `${context.route.id} cannot compile an approved route through ${definition.review.status} class ${definition.id}.`,
        contentIds: uniqueSorted([context.route.id, definition.id]),
      },
    };
  }

  const memberships = context.membershipsByClassId.get(definition.id) ?? [];
  if (memberships.length === 0) {
    return {
      ok: false,
      error: {
        code: 'MEDICATION_CLASS_MEMBERSHIP_MISSING',
        message: `${definition.id} has no explicit medication memberships.`,
        contentIds: uniqueSorted([context.route.id, definition.id]),
      },
    };
  }
  const unreviewed = memberships.filter((membership) => membership.review.status !== 'approved');
  if (unreviewed.length > 0) {
    return {
      ok: false,
      error: {
        code: 'MEDICATION_CLASS_MEMBERSHIP_UNREVIEWED',
        message: `${context.route.id} cannot compile through unreviewed class memberships.`,
        contentIds: uniqueSorted([
          context.route.id,
          ...unreviewed.map((membership) => membership.id),
        ]),
      },
    };
  }
  return {
    ok: true,
    medicationIds: uniqueSorted(memberships.map((membership) => membership.medicationIdentityId)),
  };
};

const isSameActionTarget = (left: DecisionActionTarget, right: DecisionActionTarget): boolean =>
  actionTargetKey(left) === actionTargetKey(right);

const intersectActionTarget = (
  left: DecisionActionTarget,
  right: DecisionActionTarget,
): DecisionActionTarget | null => {
  if (isSameActionTarget(left, right)) return left;
  if (left.kind === 'any_medication_start' && right.kind === 'medication_start') return right;
  if (right.kind === 'any_medication_start' && left.kind === 'medication_start') return left;
  if (
    left.kind === 'any_regimen_operation' &&
    right.kind === 'regimen_medication_operation' &&
    left.operation === right.operation
  ) {
    return right;
  }
  if (
    right.kind === 'any_regimen_operation' &&
    left.kind === 'regimen_medication_operation' &&
    right.operation === left.operation
  ) {
    return left;
  }
  return null;
};

const intersectActionTargets = (
  left: readonly DecisionActionTarget[],
  right: readonly DecisionActionTarget[],
): DecisionActionTarget[] =>
  uniqueActionTargets(
    left.flatMap((leftTarget) =>
      right.flatMap((rightTarget) => {
        const intersection = intersectActionTarget(leftTarget, rightTarget);
        return intersection ? [intersection] : [];
      }),
    ),
  );

const simplifyActionTargetUnion = (
  targets: readonly DecisionActionTarget[],
): DecisionActionTarget[] => {
  const unique = uniqueActionTargets(targets);
  const hasAnyMedicationStart = unique.some((target) => target.kind === 'any_medication_start');
  const anyRegimenOperations = new Set(
    unique.flatMap((target) => (target.kind === 'any_regimen_operation' ? [target.operation] : [])),
  );
  return unique.filter(
    (target) =>
      !(hasAnyMedicationStart && target.kind === 'medication_start') &&
      !(
        target.kind === 'regimen_medication_operation' && anyRegimenOperations.has(target.operation)
      ),
  );
};

const actionTargetsForPredicate = (
  predicate: MedicationRegimenTransitionPredicate,
  context: RouteTargetContext,
): ActionAnchorResult => {
  if (predicate.type === 'not') {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_NEGATED_ACTION_ANCHOR',
        message: `${context.route.id} uses a negated transition predicate that cannot be reduced to a positive action-horizon anchor without changing its meaning.`,
        contentIds: [context.route.id],
      },
    };
  }
  if (predicate.type === 'any' || predicate.type === 'all') {
    const childTargets: DecisionActionTarget[][] = [];
    for (const child of predicate.predicates) {
      const childResult = actionTargetsForPredicate(child, context);
      if (!childResult.ok) return childResult;
      childTargets.push([...childResult.targets]);
    }
    if (predicate.type === 'any') {
      return {
        ok: true,
        targets: simplifyActionTargetUnion(childTargets.flat()),
      };
    }
    const actionable = childTargets.filter((targets) => targets.length > 0);
    if (actionable.length === 0) return { ok: true, targets: [] };
    const [first, ...rest] = actionable;
    return {
      ok: true,
      targets: rest.reduce(intersectActionTargets, first!),
    };
  }
  if (predicate.type === 'currentRegimenCount') {
    return { ok: true, targets: [] };
  }

  const medicationIdsResult = targetMedicationIds(predicate.target, context);
  if (!medicationIdsResult.ok) return medicationIdsResult;
  if (predicate.type === 'startCount') {
    const targets: DecisionActionTarget[] =
      predicate.target.kind === 'any_medication'
        ? [{ kind: 'any_medication_start' }]
        : medicationIdsResult.medicationIds.map((medicationIdentityId) => ({
            kind: 'medication_start',
            medicationIdentityId,
          }));
    return { ok: true, targets };
  }

  const operations = [...predicate.operations].sort(compareStrings);
  const targets: DecisionActionTarget[] =
    predicate.target.kind === 'any_medication'
      ? operations.map((operation) => ({ kind: 'any_regimen_operation', operation }))
      : medicationIdsResult.medicationIds.flatMap((medicationIdentityId) =>
          operations.map((operation) => ({
            kind: 'regimen_medication_operation' as const,
            medicationIdentityId,
            operation,
          })),
        );
  return { ok: true, targets };
};

/**
 * Adapts a canonical regimen route into D-191's coarse action-horizon discovery
 * candidate. The complete transition predicate remains owned by the route and
 * must be evaluated separately; this adapter never converts counts into a
 * score rule or treats a compatibility medication tag as class membership.
 */
export const adaptFocusedMedicationRegimenRoute = (
  input: AdaptFocusedMedicationRegimenRouteInput,
): MedicationRegimenRouteAdapterResult => {
  const { route, diagnosis } = input;
  if (
    route.owner.kind !== 'diagnosis_route' ||
    route.owner.id !== diagnosis.id ||
    route.owner.contentVersion !== diagnosis.contentVersion
  ) {
    return fail(
      'DIAGNOSIS_OWNER_MISMATCH',
      `${route.id} is not owned by ${diagnosis.id}@${diagnosis.contentVersion}.`,
      [route.id, route.owner.id, diagnosis.id],
    );
  }

  const qualitativeRef = route.qualitativeDiagnosisRuleRef;
  if (!qualitativeRef) {
    return fail(
      'QUALITATIVE_RULE_MISSING',
      `${route.id} has no explicit qualitative diagnosis-rule reference.`,
      [route.id, diagnosis.id],
    );
  }
  if (
    qualitativeRef.ownerId !== diagnosis.id ||
    qualitativeRef.ownerContentVersion !== diagnosis.contentVersion ||
    qualitativeRef.contentVersion !== diagnosis.contentVersion
  ) {
    return fail(
      'QUALITATIVE_RULE_MISMATCH',
      `${route.id} pins a qualitative rule outside ${diagnosis.id}@${diagnosis.contentVersion}.`,
      [route.id, qualitativeRef.id, diagnosis.id],
    );
  }
  const qualitativeRule = diagnosisRules(diagnosis).find(
    (candidate) => candidate.id === qualitativeRef.id,
  );
  if (!qualitativeRule) {
    return fail(
      'QUALITATIVE_RULE_MISMATCH',
      `${route.id} references missing diagnosis rule ${qualitativeRef.id}.`,
      [route.id, qualitativeRef.id, diagnosis.id],
    );
  }
  if (
    qualitativeRule.domain !== 'medication_selection' ||
    qualitativeRule.review.status !== 'approved'
  ) {
    return fail(
      'UNSUPPORTED_QUALITATIVE_RULE',
      `${qualitativeRule.id} is not an approved medication-selection rule.`,
      [route.id, qualitativeRule.id],
    );
  }

  const medicationClassesById = new Map(
    input.medicationClasses.map((definition) => [definition.id, definition] as const),
  );
  const membershipsByClassId = new Map<string, MedicationClassMembership[]>();
  for (const membership of input.classMemberships) {
    const prior = membershipsByClassId.get(membership.medicationClassId) ?? [];
    prior.push(membership);
    membershipsByClassId.set(membership.medicationClassId, prior);
  }
  const actionAnchor = actionTargetsForPredicate(route.transitionMatch, {
    route,
    medicationClassesById,
    membershipsByClassId,
  });
  if (!actionAnchor.ok) return { ok: false, error: actionAnchor.error };
  const targets = uniqueActionTargets(actionAnchor.targets);
  if (targets.length === 0) {
    return fail(
      'ACTION_ANCHOR_EMPTY',
      `${route.id} has no positive medication action that can anchor decision-policy discovery.`,
      [route.id],
    );
  }

  const parsed = DecisionRuleCandidateDefinitionSchema.safeParse({
    schemaVersion: 1,
    ruleRef: {
      kind: 'medication_regimen_route',
      id: route.id,
      contentVersion: route.contentVersion,
      ownerId: route.owner.id,
      ownerContentVersion: route.owner.contentVersion,
    },
    label: route.label,
    ruleKind: 'primary_route',
    discoveryLane: 'primary_policy_only',
    patientWhen: route.patientWhen,
    actionWhen: { match: 'any', targets },
    triggeredInformationPrerequisite: null,
    stance: qualitativeRule.stance,
    concernLevel: qualitativeRule.concernLevel,
    certaintyLevel: qualitativeRule.certaintyLevel,
    effectId: null,
    issueId: null,
    specificityPriority: 0,
    rationale: route.rationale,
    balanceRef: null,
    developerOpinionIds: route.developerOpinionIds,
    review: route.review,
  });
  if (!parsed.success) {
    return fail(
      'CANDIDATE_INVALID',
      parsed.error.issues
        .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
        .join('; '),
      [route.id, qualitativeRule.id],
    );
  }
  return { ok: true, value: parsed.data };
};

export interface MedicationRegimenTransitionLeafEvaluation {
  readonly path: readonly number[];
  readonly type: 'currentRegimenCount' | 'startCount' | 'adjustmentCount';
  readonly count: number;
  readonly minimumCount: number;
  readonly maximumCount: number;
  readonly matched: boolean;
}

export interface MedicationRegimenTransitionEvaluation {
  readonly matched: boolean;
  readonly leafEvaluations: readonly MedicationRegimenTransitionLeafEvaluation[];
}

export type MedicationRegimenTransitionEvaluationResult =
  | { readonly ok: true; readonly value: MedicationRegimenTransitionEvaluation }
  | { readonly ok: false; readonly error: MedicationRegimenRouteAdapterError };

export interface EvaluateMedicationRegimenTransitionInput {
  readonly route: FocusedMedicationRegimenRoute;
  readonly currentRegimen: readonly MedicationRegimenEntryV2[];
  readonly selection: MedicationRegimenTransitionSelection;
  readonly medicationClasses: readonly MedicationClassDefinition[];
  readonly classMemberships: readonly MedicationClassMembership[];
}

const evaluationFail = (
  code: MedicationRegimenRouteAdapterErrorCode,
  message: string,
  contentIds: readonly string[],
): MedicationRegimenTransitionEvaluationResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const medicationTargetMatches = (
  target: MedicationRegimenTarget,
  medicationIdentityId: string,
  context: RouteTargetContext,
):
  | { readonly ok: true; readonly matched: boolean }
  | { readonly ok: false; readonly error: MedicationRegimenRouteAdapterError } => {
  if (target.kind === 'any_medication') return { ok: true, matched: true };
  const targetIds = targetMedicationIds(target, context);
  if (!targetIds.ok) return targetIds;
  return { ok: true, matched: targetIds.medicationIds.includes(medicationIdentityId) };
};

interface PredicateEvaluation {
  readonly matched: boolean;
  readonly leafEvaluations: readonly MedicationRegimenTransitionLeafEvaluation[];
}

const evaluatePredicate = (
  predicate: MedicationRegimenTransitionPredicate,
  path: readonly number[],
  currentRegimen: readonly MedicationRegimenEntryV2[],
  selection: MedicationRegimenTransitionSelection,
  context: RouteTargetContext,
):
  | { readonly ok: true; readonly value: PredicateEvaluation }
  | { readonly ok: false; readonly error: MedicationRegimenRouteAdapterError } => {
  if (predicate.type === 'any' || predicate.type === 'all') {
    const children: PredicateEvaluation[] = [];
    for (const [index, child] of predicate.predicates.entries()) {
      const childResult = evaluatePredicate(
        child,
        [...path, index],
        currentRegimen,
        selection,
        context,
      );
      if (!childResult.ok) return childResult;
      children.push(childResult.value);
    }
    return {
      ok: true,
      value: {
        matched:
          predicate.type === 'all'
            ? children.every((child) => child.matched)
            : children.some((child) => child.matched),
        leafEvaluations: children.flatMap((child) => child.leafEvaluations),
      },
    };
  }
  if (predicate.type === 'not') {
    const child = evaluatePredicate(
      predicate.predicate,
      [...path, 0],
      currentRegimen,
      selection,
      context,
    );
    if (!child.ok) return child;
    return {
      ok: true,
      value: {
        matched: !child.value.matched,
        leafEvaluations: child.value.leafEvaluations,
      },
    };
  }

  const regimenById = new Map(currentRegimen.map((entry) => [entry.id, entry] as const));
  let count = 0;
  if (predicate.type === 'currentRegimenCount') {
    for (const entry of currentRegimen) {
      if (!predicate.statuses.includes(entry.status)) continue;
      const targetMatch = medicationTargetMatches(
        predicate.target,
        entry.medicationIdentityId,
        context,
      );
      if (!targetMatch.ok) return targetMatch;
      if (targetMatch.matched) count += 1;
    }
  } else if (predicate.type === 'startCount') {
    for (const medicationIdentityId of selection.startMedicationIds) {
      const targetMatch = medicationTargetMatches(predicate.target, medicationIdentityId, context);
      if (!targetMatch.ok) return targetMatch;
      if (targetMatch.matched) count += 1;
    }
  } else {
    for (const adjustment of selection.adjustments) {
      if (!predicate.operations.includes(adjustment.operation)) continue;
      const entry = regimenById.get(adjustment.regimenEntryId);
      if (!entry) {
        return {
          ok: false,
          error: {
            code: 'CANDIDATE_INVALID',
            message: `${adjustment.regimenEntryId} is not present in the frozen current regimen.`,
            contentIds: uniqueSorted([context.route.id, adjustment.regimenEntryId]),
          },
        };
      }
      const targetMatch = medicationTargetMatches(
        predicate.target,
        entry.medicationIdentityId,
        context,
      );
      if (!targetMatch.ok) return targetMatch;
      if (targetMatch.matched) count += 1;
    }
  }

  const matched = count >= predicate.minimumCount && count <= predicate.maximumCount;
  return {
    ok: true,
    value: {
      matched,
      leafEvaluations: [
        {
          path,
          type: predicate.type,
          count,
          minimumCount: predicate.minimumCount,
          maximumCount: predicate.maximumCount,
          matched,
        },
      ],
    },
  };
};

/**
 * Evaluates the route's complete count-aware V2 transition independently from
 * the coarse D-191 discovery anchor. It derives no points or clinical winner.
 */
export const evaluateMedicationRegimenTransition = (
  input: EvaluateMedicationRegimenTransitionInput,
): MedicationRegimenTransitionEvaluationResult => {
  const parsedSelection = MedicationRegimenTransitionSelectionSchema.safeParse(input.selection);
  if (!parsedSelection.success) {
    return evaluationFail(
      'CANDIDATE_INVALID',
      parsedSelection.error.issues
        .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
        .join('; '),
      [input.route.id],
    );
  }
  const medicationClassesById = new Map(
    input.medicationClasses.map((definition) => [definition.id, definition] as const),
  );
  const membershipsByClassId = new Map<string, MedicationClassMembership[]>();
  for (const membership of input.classMemberships) {
    const prior = membershipsByClassId.get(membership.medicationClassId) ?? [];
    prior.push(membership);
    membershipsByClassId.set(membership.medicationClassId, prior);
  }
  const evaluated = evaluatePredicate(
    input.route.transitionMatch,
    [],
    input.currentRegimen,
    parsedSelection.data,
    { route: input.route, medicationClassesById, membershipsByClassId },
  );
  return evaluated.ok
    ? {
        ok: true,
        value: {
          matched: evaluated.value.matched,
          leafEvaluations: evaluated.value.leafEvaluations,
        },
      }
    : evaluated;
};
