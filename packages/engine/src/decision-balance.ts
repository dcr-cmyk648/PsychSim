import {
  CompiledRubricSchema,
  DecisionBalanceCatalogSnapshotSchema,
  DecisionBalanceCatalogSchema,
  DecisionRuleCandidateDefinitionSchema,
  GeneratedEncounterDecisionSelectionSchema,
  GeneratedEncounterPointReportInputSchema,
  MedicationRegimenEntryV2Schema,
  MedicationRegimenKnowledgeCatalogSchema,
  type CompiledRubric,
  type CompiledRubricRule,
  type DecisionActionTarget,
  type DecisionBalanceCatalog,
  type DecisionBalanceCatalogSnapshot,
  type DecisionBalanceDefinition,
  type DecisionBalanceSnapshotDefinition,
  type DecisionBalanceSnapshotFingerprint,
  type DecisionInformationRequirementBalanceDefinition,
  type DecisionInformationRequirementBalanceSnapshot,
  type DecisionTriggeredInformationPrerequisiteBalanceDefinition,
  type DecisionTriggeredInformationPrerequisiteBalanceSnapshot,
  type DecisionRuleCandidateDefinition,
  type DecisionRuleReference,
  type GeneratedEncounterDecisionSelection,
  type GeneratedEncounterPointReportInput,
  type GeneratedRulePointEvaluation,
  type GeneratedTriggeredInformationPrerequisiteEvaluation,
  type MedicationRegimenEntryV2,
  type MedicationRegimenKnowledgeCatalog,
} from '@psychsim/schemas';

import {
  evaluateSelectedDecisionActionPredicate,
  evaluateTriggeredInformationPrerequisite,
  selectedDecisionActionTargetMatches,
} from './decision-selection';
import { evaluateMedicationRegimenTransition } from './medication-regimen-route-adapter';
import { resolveGeneratedRuleCombination } from './rule-combination';

export const NATIVE_DECISION_BALANCE_COMPILER_VERSION = '6.0.0';
export const NATIVE_DECISION_BALANCE_PRODUCER_ID = 'engine.native-decision-balance';
export const DECISION_BALANCE_SNAPSHOT_COMPILER_VERSION = '2.0.0';

export type DecisionBalanceCompileErrorCode =
  | 'INVALID_INPUT'
  | 'BALANCE_TARGET_AMBIGUOUS'
  | 'BALANCE_TARGET_STALE'
  | 'BALANCE_REFERENCE_MISSING'
  | 'BALANCE_RULE_MISMATCH'
  | 'BALANCE_SHAPE_MISMATCH'
  | 'BALANCE_SNAPSHOT_INVALID'
  | 'UNREVIEWED_RULE'
  | 'UNSUPPORTED_BALANCED_RULE'
  | 'ROUTE_MISSING'
  | 'ROUTE_EVALUATION_FAILED'
  | 'INVALID_OUTPUT';

export interface DecisionBalanceCompileError {
  readonly code: DecisionBalanceCompileErrorCode;
  readonly message: string;
  readonly contentIds: readonly string[];
}

export type DecisionBalanceAttachmentResult =
  | { readonly ok: true; readonly value: DecisionRuleCandidateDefinition }
  | { readonly ok: false; readonly error: DecisionBalanceCompileError };

export type NativeDecisionPointReportCompileResult =
  | {
      readonly ok: true;
      readonly value: {
        readonly report: GeneratedEncounterPointReportInput;
        readonly playerRuleMatches: readonly NativeDecisionRuleMatchAudit[];
        readonly databasePlanRuleMatches: readonly NativeDecisionRuleMatchAudit[];
      };
    }
  | { readonly ok: false; readonly error: DecisionBalanceCompileError };

export type DecisionBalanceCatalogSnapshotCompileResult =
  | { readonly ok: true; readonly value: DecisionBalanceCatalogSnapshot }
  | { readonly ok: false; readonly error: DecisionBalanceCompileError };

export type DecisionBalanceCatalogSnapshotIntegrityResult =
  | { readonly ok: true; readonly value: DecisionBalanceCatalogSnapshot }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_SCHEMA' | 'UNSUPPORTED_VERSION' | 'PAYLOAD_MISMATCH';
        readonly message: string;
      };
    };

export interface AttachDecisionBalanceInput {
  readonly candidate: DecisionRuleCandidateDefinition;
  readonly balanceCatalog: DecisionBalanceCatalog;
}

export interface NativeDecisionPointReportCompileInput {
  readonly compiledRubric: CompiledRubric;
  readonly currentRegimen: readonly MedicationRegimenEntryV2[];
  readonly playerDecision: GeneratedEncounterDecisionSelection;
  readonly databasePlanDecision: GeneratedEncounterDecisionSelection;
  readonly balanceCatalog: DecisionBalanceCatalog;
  readonly medicationRegimenKnowledgeCatalog: MedicationRegimenKnowledgeCatalog;
}

export interface NativeDecisionRuleMatchAudit {
  readonly ruleRef: DecisionRuleReference;
  readonly balanceRef: { readonly id: string; readonly contentVersion: string } | null;
  readonly matched: boolean;
  readonly appliedPoints: number;
  readonly triggeredInformationPrerequisiteEvaluation: GeneratedTriggeredInformationPrerequisiteEvaluation | null;
}

const compareStrings = (left: string, right: string): number =>
  left === right ? 0 : left < right ? -1 : 1;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const canonicalizeObjectKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeObjectKeys);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([key, child]) => [key, canonicalizeObjectKeys(child)]),
    );
  }
  return value;
};

const hashToHex64 = (value: string): string => {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, '0');
};

const snapshotFingerprint = (scope: string, value: unknown): DecisionBalanceSnapshotFingerprint =>
  `fingerprint.decision-balance-snapshot.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const snapshotStableId = (fingerprint: DecisionBalanceSnapshotFingerprint): string =>
  `decision-balance-catalog-snapshot.${fingerprint.slice(-16)}`;

const fail = (
  code: DecisionBalanceCompileErrorCode,
  message: string,
  contentIds: readonly string[] = [],
): { readonly ok: false; readonly error: DecisionBalanceCompileError } => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const exactRuleKey = (ruleRef: DecisionRuleReference): string =>
  [
    ruleRef.kind,
    ruleRef.id,
    ruleRef.contentVersion,
    ruleRef.ownerId,
    ruleRef.ownerContentVersion,
  ].join('\0');

const ruleIdentityKey = (ruleRef: DecisionRuleReference): string =>
  [ruleRef.kind, ruleRef.id].join('\0');

const sameRuleRef = (left: DecisionRuleReference, right: DecisionRuleReference): boolean =>
  exactRuleKey(left) === exactRuleKey(right);

const isTriggeredInformationPrerequisiteBalance = (
  balance: DecisionBalanceDefinition | DecisionBalanceSnapshotDefinition,
): balance is
  | DecisionTriggeredInformationPrerequisiteBalanceDefinition
  | DecisionTriggeredInformationPrerequisiteBalanceSnapshot =>
  'balanceKind' in balance && balance.balanceKind === 'triggered_information_prerequisite';

const isInformationRequirementBalance = (
  balance: DecisionBalanceDefinition | DecisionBalanceSnapshotDefinition,
): balance is
  | DecisionInformationRequirementBalanceDefinition
  | DecisionInformationRequirementBalanceSnapshot =>
  'balanceKind' in balance && balance.balanceKind === 'information_requirement';

const ruleUsesTriggeredInformationPrerequisite = (
  rule: Pick<
    DecisionRuleCandidateDefinition | CompiledRubricRule,
    'ruleKind' | 'ruleRef' | 'triggeredInformationPrerequisite'
  >,
): boolean =>
  rule.ruleKind === 'prerequisite' &&
  rule.ruleRef.kind === 'diagnosis_rule' &&
  rule.triggeredInformationPrerequisite !== null;

const ruleUsesDirectInformationAction = (
  rule: Pick<
    DecisionRuleCandidateDefinition | CompiledRubricRule,
    'ruleKind' | 'ruleRef' | 'triggeredInformationPrerequisite' | 'actionWhen'
  >,
): boolean =>
  rule.ruleKind === 'prerequisite' &&
  rule.ruleRef.kind === 'diagnosis_rule' &&
  rule.triggeredInformationPrerequisite === null &&
  rule.actionWhen !== null &&
  rule.actionWhen.targets.every((target) => target.kind === 'information_action');

const ruleUsesInformationRequirement = (
  rule: Pick<
    DecisionRuleCandidateDefinition | CompiledRubricRule,
    'ruleKind' | 'ruleRef' | 'triggeredInformationPrerequisite' | 'stance' | 'actionWhen'
  >,
): boolean => ruleUsesDirectInformationAction(rule) && rule.stance === 'required';

const balanceShapeMatchesRule = (
  balance: DecisionBalanceDefinition | DecisionBalanceSnapshotDefinition,
  rule: Pick<
    DecisionRuleCandidateDefinition | CompiledRubricRule,
    'ruleKind' | 'ruleRef' | 'triggeredInformationPrerequisite' | 'stance' | 'actionWhen'
  >,
): boolean => {
  if (isTriggeredInformationPrerequisiteBalance(balance)) {
    return ruleUsesTriggeredInformationPrerequisite(rule);
  }
  if (isInformationRequirementBalance(balance)) {
    return ruleUsesInformationRequirement(rule);
  }
  return !ruleUsesTriggeredInformationPrerequisite(rule) && !ruleUsesInformationRequirement(rule);
};

const matchingBalances = (
  catalog: DecisionBalanceCatalog,
  ruleRef: DecisionRuleReference,
): readonly DecisionBalanceDefinition[] =>
  catalog.balances.filter(
    (balance) => ruleIdentityKey(balance.ruleRef) === ruleIdentityKey(ruleRef),
  );

/**
 * Decorates one normalized, point-free decision candidate from a separate
 * exact rule-to-balance catalog. Missing balance is a valid, explicit
 * unbalanced state; a stale or ambiguous near-match fails closed.
 */
export const attachDecisionBalance = (
  input: AttachDecisionBalanceInput,
): DecisionBalanceAttachmentResult => {
  const parsedCandidate = DecisionRuleCandidateDefinitionSchema.safeParse(input.candidate);
  const parsedCatalog = DecisionBalanceCatalogSchema.safeParse(input.balanceCatalog);
  if (!parsedCandidate.success || !parsedCatalog.success) {
    return fail(
      'INVALID_INPUT',
      [
        ...(!parsedCandidate.success
          ? parsedCandidate.error.issues.map(
              (issue) => `candidate.${issue.path.join('.') || '<root>'}: ${issue.message}`,
            )
          : []),
        ...(!parsedCatalog.success
          ? parsedCatalog.error.issues.map(
              (issue) => `catalog.${issue.path.join('.') || '<root>'}: ${issue.message}`,
            )
          : []),
      ].join('; '),
    );
  }
  const candidate = parsedCandidate.data;
  const candidates = matchingBalances(parsedCatalog.data, candidate.ruleRef);
  if (candidates.length === 0) {
    if (candidate.balanceRef !== null) {
      return fail(
        'BALANCE_REFERENCE_MISSING',
        `${candidate.ruleRef.id} names missing balance owner ${candidate.balanceRef.id}@${candidate.balanceRef.contentVersion}.`,
        [candidate.ruleRef.id, candidate.balanceRef.id],
      );
    }
    return { ok: true, value: candidate };
  }
  const exact = candidates.filter((balance) => sameRuleRef(balance.ruleRef, candidate.ruleRef));
  if (exact.length !== 1) {
    return fail(
      exact.length > 1 ? 'BALANCE_TARGET_AMBIGUOUS' : 'BALANCE_TARGET_STALE',
      exact.length > 1
        ? `${candidate.ruleRef.id} has more than one exact balance owner.`
        : `${candidate.ruleRef.id} has a balance owner, but its rule or owner version is stale.`,
      [candidate.ruleRef.id, ...candidates.map((balance) => balance.id)],
    );
  }
  const balance = exact[0]!;
  if (!balanceShapeMatchesRule(balance, candidate)) {
    return fail(
      'BALANCE_SHAPE_MISMATCH',
      `${balance.id} does not use the balance shape required by ${candidate.ruleRef.id}.`,
      [candidate.ruleRef.id, balance.id],
    );
  }
  if (candidate.review.status !== 'approved') {
    return fail(
      'UNREVIEWED_RULE',
      `${candidate.ruleRef.id} cannot receive a provisional balance before qualitative review.`,
      [candidate.ruleRef.id, balance.id],
    );
  }
  if (
    candidate.balanceRef !== null &&
    (candidate.balanceRef.id !== balance.id ||
      candidate.balanceRef.contentVersion !== balance.contentVersion)
  ) {
    return fail(
      'BALANCE_TARGET_AMBIGUOUS',
      `${candidate.ruleRef.id} already names a different balance owner.`,
      [candidate.ruleRef.id, candidate.balanceRef.id, balance.id],
    );
  }
  const output = DecisionRuleCandidateDefinitionSchema.safeParse({
    ...candidate,
    balanceRef: {
      id: balance.id,
      contentVersion: balance.contentVersion,
    },
  });
  return output.success
    ? { ok: true, value: output.data }
    : fail(
        'INVALID_OUTPUT',
        output.error.issues
          .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
          .join('; '),
        [candidate.ruleRef.id, balance.id],
      );
};

const unbalancedComponent = (
  rule: CompiledRubricRule,
): GeneratedRulePointEvaluation['component'] => {
  if (rule.ruleKind === 'disposition') return 'disposition';
  if (ruleUsesDirectInformationAction(rule)) return 'workup';
  if (
    [
      'reaction',
      'withdrawal',
      'duplication',
      'interaction',
      'contraindication',
      'prerequisite',
    ].includes(rule.ruleKind)
  ) {
    return 'safety';
  }
  return rule.ruleKind === 'discontinuation'
    ? 'medication_discontinuation'
    : 'medication_selection';
};

const selectedPrerequisiteTargets = (
  rule: CompiledRubricRule,
  decision: GeneratedEncounterDecisionSelection,
  currentRegimen: readonly MedicationRegimenEntryV2[],
): DecisionActionTarget[] => {
  const prerequisite = rule.triggeredInformationPrerequisite;
  if (prerequisite === null) return [];
  return [
    ...new Map(
      [...prerequisite.triggerWhen.targets, ...prerequisite.fulfillmentWhen.targets]
        .filter((target) => selectedDecisionActionTargetMatches(target, decision, currentRegimen))
        .map((target) => [JSON.stringify(target), target] as const),
    ).values(),
  ];
};

const uniqueDecisionTargets = (
  targets: readonly DecisionActionTarget[],
): DecisionActionTarget[] => [
  ...new Map(targets.map((target) => [JSON.stringify(target), target] as const)).values(),
];

const selectedConcreteRuleTargets = (
  rule: CompiledRubricRule,
  decision: GeneratedEncounterDecisionSelection,
  currentRegimen: readonly MedicationRegimenEntryV2[],
): DecisionActionTarget[] => {
  const selectedStarts = new Set(
    decision.treatmentSelection.medicationTransition.startMedicationIds,
  );
  const selectedAdjustments = decision.treatmentSelection.medicationTransition.adjustments;
  const regimenById = new Map(currentRegimen.map((entry) => [entry.id, entry] as const));
  const concrete = rule.matchedActionTargets.flatMap((target): DecisionActionTarget[] => {
    switch (target.kind) {
      case 'any_medication_start':
        return decision.treatmentSelection.medicationTransition.startMedicationIds.map(
          (medicationIdentityId) => ({
            kind: 'medication_start',
            medicationIdentityId,
          }),
        );
      case 'medication_start':
        return selectedStarts.has(target.medicationIdentityId) ? [target] : [];
      case 'any_regimen_operation':
        return selectedAdjustments
          .filter((adjustment) => adjustment.operation === target.operation)
          .map((adjustment) => ({
            kind: 'regimen_entry_operation',
            regimenEntryId: adjustment.regimenEntryId,
            operation: adjustment.operation,
          }));
      case 'regimen_entry_operation':
        return selectedAdjustments.some(
          (adjustment) =>
            adjustment.regimenEntryId === target.regimenEntryId &&
            adjustment.operation === target.operation,
        )
          ? [target]
          : [];
      case 'regimen_medication_operation':
        return selectedAdjustments.flatMap((adjustment) => {
          const regimenEntry = regimenById.get(adjustment.regimenEntryId);
          return regimenEntry?.medicationIdentityId === target.medicationIdentityId &&
            adjustment.operation === target.operation
            ? [
                {
                  kind: 'regimen_entry_operation' as const,
                  regimenEntryId: adjustment.regimenEntryId,
                  operation: adjustment.operation,
                },
              ]
            : [];
        });
      default:
        return selectedDecisionActionTargetMatches(target, decision, currentRegimen)
          ? [target]
          : [];
    }
  });
  return uniqueDecisionTargets(concrete);
};

/**
 * Reconstructs the complete selected target set retained on a native rule
 * trace. D-235 uses the same derivation during replay so removing or crossing
 * a target cannot change D-159 combination behavior.
 */
export const deriveNativeSelectedRuleTargets = (
  rule: CompiledRubricRule,
  decision: GeneratedEncounterDecisionSelection,
  currentRegimen: readonly MedicationRegimenEntryV2[],
): DecisionActionTarget[] =>
  rule.triggeredInformationPrerequisite === null
    ? selectedConcreteRuleTargets(rule, decision, currentRegimen)
    : selectedPrerequisiteTargets(rule, decision, currentRegimen);

const prerequisiteEvaluationSnapshot = (
  evaluation: ReturnType<typeof evaluateTriggeredInformationPrerequisite>,
): GeneratedTriggeredInformationPrerequisiteEvaluation => ({
  status: evaluation.status,
  triggerSelected: evaluation.triggerSelected,
  fulfillmentSelected: evaluation.fulfillmentSelected,
});

const resolveBalance = (
  rule: CompiledRubricRule,
  catalog: DecisionBalanceCatalog,
):
  | { readonly ok: true; readonly balance: DecisionBalanceDefinition | null }
  | { readonly ok: false; readonly error: DecisionBalanceCompileError } => {
  if (rule.balanceRef === null) return { ok: true, balance: null };
  const byReference = catalog.balances.filter(
    (balance) =>
      balance.id === rule.balanceRef?.id &&
      balance.contentVersion === rule.balanceRef.contentVersion,
  );
  if (byReference.length !== 1) {
    return fail(
      'BALANCE_REFERENCE_MISSING',
      `${rule.ruleRef.id} references a missing or ambiguous balance ${rule.balanceRef.id}@${rule.balanceRef.contentVersion}.`,
      [rule.ruleRef.id, rule.balanceRef.id],
    );
  }
  const balance = byReference[0]!;
  if (!sameRuleRef(balance.ruleRef, rule.ruleRef)) {
    return fail(
      'BALANCE_RULE_MISMATCH',
      `${balance.id} targets a different exact decision rule than ${rule.ruleRef.id}.`,
      [rule.ruleRef.id, balance.id, balance.ruleRef.id],
    );
  }
  if (!balanceShapeMatchesRule(balance, rule)) {
    return fail(
      'BALANCE_SHAPE_MISMATCH',
      `${balance.id} does not use the balance shape required by ${rule.ruleRef.id}.`,
      [rule.ruleRef.id, balance.id],
    );
  }
  return { ok: true, balance };
};

const normalizeSourceBalanceCatalog = (catalog: DecisionBalanceCatalog): unknown => ({
  ...catalog,
  balances: [...catalog.balances]
    .map((balance) => ({
      ...balance,
      developerOpinionIds: [...balance.developerOpinionIds].sort(compareStrings),
    }))
    .sort((left, right) => compareStrings(exactRuleKey(left.ruleRef), exactRuleKey(right.ruleRef))),
});

const toBalanceSnapshotDefinition = (
  balance: DecisionBalanceDefinition,
): DecisionBalanceSnapshotDefinition => {
  if (isTriggeredInformationPrerequisiteBalance(balance)) {
    return {
      schemaVersion: balance.schemaVersion,
      contentVersion: balance.contentVersion,
      id: balance.id,
      balanceKind: balance.balanceKind,
      ruleRef: balance.ruleRef,
      component: balance.component,
      outcomes: balance.outcomes,
    };
  }
  if (isInformationRequirementBalance(balance)) {
    return {
      schemaVersion: balance.schemaVersion,
      contentVersion: balance.contentVersion,
      id: balance.id,
      balanceKind: balance.balanceKind,
      ruleRef: balance.ruleRef,
      component: balance.component,
      outcomes: balance.outcomes,
    };
  }
  return {
    schemaVersion: balance.schemaVersion,
    contentVersion: balance.contentVersion,
    id: balance.id,
    balanceKind: 'matched_rule',
    ruleRef: balance.ruleRef,
    impactBand: balance.impactBand,
    component: balance.component,
    pointsWhenMatched: balance.pointsWhenMatched,
    unmatchedBehavior: balance.unmatchedBehavior,
    matchedExplanation: balance.matchedExplanation,
    unmatchedExplanation: balance.unmatchedExplanation,
  };
};

const balanceSnapshotPayload = (
  snapshot: Omit<DecisionBalanceCatalogSnapshot, 'id' | 'payloadFingerprint'>,
): unknown => snapshot;

export const verifyDecisionBalanceCatalogSnapshotIntegrity = (
  value: unknown,
  compiledRubric: unknown,
): DecisionBalanceCatalogSnapshotIntegrityResult => {
  const parsedSnapshot = DecisionBalanceCatalogSnapshotSchema.safeParse(value);
  const parsedRubric = CompiledRubricSchema.safeParse(compiledRubric);
  if (!parsedSnapshot.success || !parsedRubric.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: [
          ...(!parsedSnapshot.success
            ? parsedSnapshot.error.issues.map(
                (issue) => `snapshot.${issue.path.join('.') || '<root>'}: ${issue.message}`,
              )
            : []),
          ...(!parsedRubric.success
            ? parsedRubric.error.issues.map(
                (issue) => `rubric.${issue.path.join('.') || '<root>'}: ${issue.message}`,
              )
            : []),
        ].join('; '),
      },
    };
  }
  const snapshot = parsedSnapshot.data;
  const rubric = parsedRubric.data;
  if (snapshot.compilerVersion !== DECISION_BALANCE_SNAPSHOT_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_VERSION',
        message: `${snapshot.id} uses unsupported balance-snapshot compiler ${snapshot.compilerVersion}.`,
      },
    };
  }
  const expectedRules = rubric.includedRules
    .filter((rule) => rule.balanceRef !== null)
    .sort((left, right) => compareStrings(exactRuleKey(left.ruleRef), exactRuleKey(right.ruleRef)));
  const actualBalances = [...snapshot.balances].sort((left, right) =>
    compareStrings(exactRuleKey(left.ruleRef), exactRuleKey(right.ruleRef)),
  );
  if (
    expectedRules.length !== actualBalances.length ||
    expectedRules.some((rule, index) => {
      const balance = actualBalances[index];
      return (
        balance === undefined ||
        rule.balanceRef?.id !== balance.id ||
        rule.balanceRef.contentVersion !== balance.contentVersion ||
        !sameRuleRef(rule.ruleRef, balance.ruleRef) ||
        !balanceShapeMatchesRule(balance, rule)
      );
    })
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_MISMATCH',
        message:
          'The balance snapshot does not retain exactly one compatible balance for every balanced compiled rule.',
      },
    };
  }
  const withoutIdentity = {
    schemaVersion: snapshot.schemaVersion,
    compilerVersion: snapshot.compilerVersion,
    modelVersion: snapshot.modelVersion,
    sourceCatalogRef: snapshot.sourceCatalogRef,
    sourceCatalogFingerprint: snapshot.sourceCatalogFingerprint,
    balances: snapshot.balances,
  };
  const expectedPayloadFingerprint = snapshotFingerprint(
    'payload',
    balanceSnapshotPayload(withoutIdentity),
  );
  if (
    snapshot.payloadFingerprint !== expectedPayloadFingerprint ||
    snapshot.id !== snapshotStableId(expectedPayloadFingerprint)
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_MISMATCH',
        message: `${snapshot.id} does not match its exact minimized balance payload.`,
      },
    };
  }
  return { ok: true, value: snapshot };
};

export const compileDecisionBalanceCatalogSnapshot = (input: {
  readonly compiledRubric: unknown;
  readonly balanceCatalog: unknown;
}): DecisionBalanceCatalogSnapshotCompileResult => {
  const parsedRubric = CompiledRubricSchema.safeParse(input.compiledRubric);
  const parsedCatalog = DecisionBalanceCatalogSchema.safeParse(input.balanceCatalog);
  if (!parsedRubric.success || !parsedCatalog.success) {
    return fail(
      'INVALID_INPUT',
      [
        ...(!parsedRubric.success
          ? parsedRubric.error.issues.map(
              (issue) => `rubric.${issue.path.join('.') || '<root>'}: ${issue.message}`,
            )
          : []),
        ...(!parsedCatalog.success
          ? parsedCatalog.error.issues.map(
              (issue) => `balanceCatalog.${issue.path.join('.') || '<root>'}: ${issue.message}`,
            )
          : []),
      ].join('; '),
    );
  }
  const balances: DecisionBalanceSnapshotDefinition[] = [];
  for (const rule of parsedRubric.data.includedRules) {
    const resolved = resolveBalance(rule, parsedCatalog.data);
    if (!resolved.ok) return resolved;
    if (resolved.balance !== null) balances.push(toBalanceSnapshotDefinition(resolved.balance));
  }
  balances.sort((left, right) =>
    compareStrings(exactRuleKey(left.ruleRef), exactRuleKey(right.ruleRef)),
  );
  const sourceCatalogFingerprint = snapshotFingerprint(
    'source-catalog',
    normalizeSourceBalanceCatalog(parsedCatalog.data),
  );
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: DECISION_BALANCE_SNAPSHOT_COMPILER_VERSION,
    modelVersion: 'decision-balance-catalog-snapshot.v2' as const,
    sourceCatalogRef: {
      id: parsedCatalog.data.id,
      contentVersion: parsedCatalog.data.contentVersion,
    },
    sourceCatalogFingerprint,
    balances,
  };
  const payloadFingerprint = snapshotFingerprint(
    'payload',
    balanceSnapshotPayload(withoutIdentity),
  );
  const output = DecisionBalanceCatalogSnapshotSchema.safeParse({
    ...withoutIdentity,
    id: snapshotStableId(payloadFingerprint),
    payloadFingerprint,
  });
  if (!output.success) {
    return fail(
      'INVALID_OUTPUT',
      output.error.issues
        .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
        .join('; '),
    );
  }
  const verified = verifyDecisionBalanceCatalogSnapshotIntegrity(output.data, parsedRubric.data);
  return verified.ok
    ? { ok: true, value: output.data }
    : fail('BALANCE_SNAPSHOT_INVALID', verified.error.message, [
        parsedCatalog.data.id,
        parsedRubric.data.id,
      ]);
};

const resolveSnapshotBalance = (
  rule: CompiledRubricRule,
  snapshot: DecisionBalanceCatalogSnapshot,
):
  | { readonly ok: true; readonly balance: DecisionBalanceSnapshotDefinition | null }
  | { readonly ok: false; readonly error: DecisionBalanceCompileError } => {
  if (rule.balanceRef === null) return { ok: true, balance: null };
  const byReference = snapshot.balances.filter(
    (balance) =>
      balance.id === rule.balanceRef?.id &&
      balance.contentVersion === rule.balanceRef.contentVersion,
  );
  if (byReference.length !== 1) {
    return fail(
      'BALANCE_REFERENCE_MISSING',
      `${rule.ruleRef.id} references a missing or ambiguous frozen balance ${rule.balanceRef.id}@${rule.balanceRef.contentVersion}.`,
      [rule.ruleRef.id, rule.balanceRef.id, snapshot.id],
    );
  }
  const balance = byReference[0]!;
  if (!sameRuleRef(balance.ruleRef, rule.ruleRef)) {
    return fail(
      'BALANCE_RULE_MISMATCH',
      `${balance.id} targets a different exact decision rule than ${rule.ruleRef.id}.`,
      [rule.ruleRef.id, balance.id, balance.ruleRef.id],
    );
  }
  if (!balanceShapeMatchesRule(balance, rule)) {
    return fail(
      'BALANCE_SHAPE_MISMATCH',
      `${balance.id} does not use the frozen balance shape required by ${rule.ruleRef.id}.`,
      [rule.ruleRef.id, balance.id],
    );
  }
  return { ok: true, balance };
};

const evaluateRule = (
  rule: CompiledRubricRule,
  balance: DecisionBalanceSnapshotDefinition | null,
  decision: GeneratedEncounterDecisionSelection,
  currentRegimen: readonly MedicationRegimenEntryV2[],
  regimenCatalog: MedicationRegimenKnowledgeCatalog,
):
  | {
      readonly ok: true;
      readonly trace: GeneratedRulePointEvaluation;
      readonly audit: NativeDecisionRuleMatchAudit;
    }
  | { readonly ok: false; readonly error: DecisionBalanceCompileError } => {
  const prerequisiteEvaluation =
    rule.triggeredInformationPrerequisite === null
      ? null
      : prerequisiteEvaluationSnapshot(
          evaluateTriggeredInformationPrerequisite({
            prerequisite: rule.triggeredInformationPrerequisite,
            selection: decision,
            currentRegimen,
          }),
        );
  const selectedTargets = deriveNativeSelectedRuleTargets(rule, decision, currentRegimen);
  if (balance === null) {
    const qualitativeMatched = ruleUsesInformationRequirement(rule)
      ? true
      : (prerequisiteEvaluation?.triggerSelected ??
        (rule.ruleRef.kind === 'medication_regimen_route' || rule.actionWhen === null
          ? false
          : evaluateSelectedDecisionActionPredicate({
              predicate: rule.actionWhen,
              selection: decision,
              currentRegimen,
            })));
    return {
      ok: true,
      trace: {
        id: `generated-point-trace.${rule.ruleRef.id}`,
        source: { kind: 'compiled_decision_rule', ruleRef: rule.ruleRef },
        balanceRef: null,
        label: rule.label,
        component: unbalancedComponent(rule),
        matched: qualitativeMatched,
        status: 'unbalanced',
        pointsBeforeCombination: null,
        appliedPoints: 0,
        resolvedByTraceId: null,
        combinationExplanation: null,
        triggeredInformationPrerequisiteEvaluation: prerequisiteEvaluation,
        relatedSelectedActionTargets: selectedTargets,
        relatedDiagnosisIds: [],
        explanation:
          'The reviewed qualitative rule is retained, but no native balance owner exists yet.',
      },
      audit: {
        ruleRef: rule.ruleRef,
        balanceRef: null,
        matched: qualitativeMatched,
        appliedPoints: 0,
        triggeredInformationPrerequisiteEvaluation: prerequisiteEvaluation,
      },
    };
  }
  if (isTriggeredInformationPrerequisiteBalance(balance)) {
    if (prerequisiteEvaluation === null || rule.triggeredInformationPrerequisite === null) {
      return fail(
        'BALANCE_SHAPE_MISMATCH',
        `${balance.id} requires a compiled triggered-information prerequisite.`,
        [rule.ruleRef.id, balance.id],
      );
    }
    const outcome =
      prerequisiteEvaluation.status === 'not_triggered'
        ? balance.outcomes.notTriggered
        : prerequisiteEvaluation.status === 'fulfilled'
          ? balance.outcomes.fulfilled
          : balance.outcomes.omitted;
    const balanceRef = { id: balance.id, contentVersion: balance.contentVersion };
    const matched = prerequisiteEvaluation.triggerSelected;
    return {
      ok: true,
      trace: {
        id: `generated-point-trace.${rule.ruleRef.id}`,
        source: { kind: 'compiled_decision_rule', ruleRef: rule.ruleRef },
        balanceRef,
        label: rule.label,
        component: balance.component,
        matched,
        status: matched ? 'applied' : 'not_triggered',
        pointsBeforeCombination: outcome.points,
        appliedPoints: outcome.points,
        resolvedByTraceId: null,
        combinationExplanation: null,
        triggeredInformationPrerequisiteEvaluation: prerequisiteEvaluation,
        relatedSelectedActionTargets: selectedTargets,
        relatedDiagnosisIds: [],
        explanation: outcome.explanation,
      },
      audit: {
        ruleRef: rule.ruleRef,
        balanceRef,
        matched,
        appliedPoints: outcome.points,
        triggeredInformationPrerequisiteEvaluation: prerequisiteEvaluation,
      },
    };
  }
  if (isInformationRequirementBalance(balance)) {
    if (!ruleUsesInformationRequirement(rule) || rule.actionWhen === null) {
      return fail(
        'BALANCE_SHAPE_MISMATCH',
        `${balance.id} requires a compiled direct information requirement.`,
        [rule.ruleRef.id, balance.id],
      );
    }
    const fulfilled = evaluateSelectedDecisionActionPredicate({
      predicate: rule.actionWhen,
      selection: decision,
      currentRegimen,
    });
    const outcome = fulfilled ? balance.outcomes.fulfilled : balance.outcomes.omitted;
    const balanceRef = { id: balance.id, contentVersion: balance.contentVersion };
    return {
      ok: true,
      trace: {
        id: `generated-point-trace.${rule.ruleRef.id}`,
        source: { kind: 'compiled_decision_rule', ruleRef: rule.ruleRef },
        balanceRef,
        label: rule.label,
        component: balance.component,
        matched: true,
        status: 'applied',
        pointsBeforeCombination: outcome.points,
        appliedPoints: outcome.points,
        resolvedByTraceId: null,
        combinationExplanation: null,
        triggeredInformationPrerequisiteEvaluation: null,
        relatedSelectedActionTargets: selectedTargets,
        relatedDiagnosisIds: [],
        explanation: outcome.explanation,
      },
      audit: {
        ruleRef: rule.ruleRef,
        balanceRef,
        matched: true,
        appliedPoints: outcome.points,
        triggeredInformationPrerequisiteEvaluation: null,
      },
    };
  }
  if (rule.ruleRef.kind !== 'medication_regimen_route') {
    if (rule.actionWhen === null) {
      return fail(
        'UNSUPPORTED_BALANCED_RULE',
        `${rule.ruleRef.id} has a native balance but no exact selection predicate.`,
        [rule.ruleRef.id, balance.id],
      );
    }
    const matched = evaluateSelectedDecisionActionPredicate({
      predicate: rule.actionWhen,
      selection: decision,
      currentRegimen,
    });
    const appliedPoints = matched ? balance.pointsWhenMatched : 0;
    const balanceRef = { id: balance.id, contentVersion: balance.contentVersion };
    return {
      ok: true,
      trace: {
        id: `generated-point-trace.${rule.ruleRef.id}`,
        source: { kind: 'compiled_decision_rule', ruleRef: rule.ruleRef },
        balanceRef,
        label: rule.label,
        component: balance.component,
        matched,
        status: matched ? 'applied' : 'not_triggered',
        pointsBeforeCombination: matched ? balance.pointsWhenMatched : 0,
        appliedPoints,
        resolvedByTraceId: null,
        combinationExplanation: null,
        triggeredInformationPrerequisiteEvaluation: null,
        relatedSelectedActionTargets: selectedTargets,
        relatedDiagnosisIds: [],
        explanation: matched ? balance.matchedExplanation : balance.unmatchedExplanation,
      },
      audit: {
        ruleRef: rule.ruleRef,
        balanceRef,
        matched,
        appliedPoints,
        triggeredInformationPrerequisiteEvaluation: null,
      },
    };
  }
  const route = regimenCatalog.focusedRoutes.find(
    (candidate) =>
      candidate.id === rule.ruleRef.id &&
      candidate.contentVersion === rule.ruleRef.contentVersion &&
      candidate.owner.id === rule.ruleRef.ownerId &&
      candidate.owner.contentVersion === rule.ruleRef.ownerContentVersion,
  );
  if (!route) {
    return fail(
      'ROUTE_MISSING',
      `${rule.ruleRef.id} cannot resolve its exact medication-regimen route owner.`,
      [rule.ruleRef.id, balance.id],
    );
  }
  const evaluated = evaluateMedicationRegimenTransition({
    route,
    currentRegimen,
    selection: decision.treatmentSelection.medicationTransition,
    medicationClasses: regimenCatalog.medicationClasses,
    classMemberships: regimenCatalog.classMemberships,
  });
  if (!evaluated.ok) {
    return fail('ROUTE_EVALUATION_FAILED', `${evaluated.error.code}: ${evaluated.error.message}`, [
      rule.ruleRef.id,
      balance.id,
      ...evaluated.error.contentIds,
    ]);
  }
  const matched = evaluated.value.matched;
  const appliedPoints = matched ? balance.pointsWhenMatched : 0;
  const balanceRef = { id: balance.id, contentVersion: balance.contentVersion };
  return {
    ok: true,
    trace: {
      id: `generated-point-trace.${rule.ruleRef.id}`,
      source: { kind: 'compiled_decision_rule', ruleRef: rule.ruleRef },
      balanceRef,
      label: rule.label,
      component: balance.component,
      matched,
      status: matched ? 'applied' : 'not_triggered',
      pointsBeforeCombination: matched ? balance.pointsWhenMatched : 0,
      appliedPoints,
      resolvedByTraceId: null,
      combinationExplanation: null,
      triggeredInformationPrerequisiteEvaluation: null,
      relatedSelectedActionTargets: selectedTargets,
      relatedDiagnosisIds: [],
      explanation: matched ? balance.matchedExplanation : balance.unmatchedExplanation,
    },
    audit: {
      ruleRef: rule.ruleRef,
      balanceRef,
      matched,
      appliedPoints,
      triggeredInformationPrerequisiteEvaluation: null,
    },
  };
};

const evaluateRubric = (
  rubric: CompiledRubric,
  decision: GeneratedEncounterDecisionSelection,
  currentRegimen: readonly MedicationRegimenEntryV2[],
  balanceSnapshot: DecisionBalanceCatalogSnapshot,
  regimenCatalog: MedicationRegimenKnowledgeCatalog,
):
  | {
      readonly ok: true;
      readonly trace: readonly GeneratedRulePointEvaluation[];
      readonly audit: readonly NativeDecisionRuleMatchAudit[];
    }
  | { readonly ok: false; readonly error: DecisionBalanceCompileError } => {
  const trace: GeneratedRulePointEvaluation[] = [];
  for (const rule of rubric.includedRules) {
    const resolved = resolveSnapshotBalance(rule, balanceSnapshot);
    if (!resolved.ok) return resolved;
    const evaluated = evaluateRule(
      rule,
      resolved.balance,
      decision,
      currentRegimen,
      regimenCatalog,
    );
    if (!evaluated.ok) return evaluated;
    trace.push(evaluated.trace);
  }
  const combinedTrace = resolveGeneratedRuleCombination({
    evaluations: trace,
    rules: rubric.includedRules,
  });
  const audit: NativeDecisionRuleMatchAudit[] = combinedTrace.flatMap((evaluation) =>
    evaluation.source.kind === 'compiled_decision_rule'
      ? [
          {
            ruleRef: evaluation.source.ruleRef,
            balanceRef: evaluation.balanceRef,
            matched: evaluation.matched,
            appliedPoints: evaluation.appliedPoints,
            triggeredInformationPrerequisiteEvaluation:
              evaluation.triggeredInformationPrerequisiteEvaluation,
          },
        ]
      : [],
  );
  return { ok: true, trace: combinedTrace, audit };
};

/**
 * Produces D-235's point-report input from frozen qualitative rules, exact
 * regimen predicates, selected information actions, and a separate
 * provisional balance catalog. The caller cannot supply trace rows or point
 * values. This native slice evaluates primary, prerequisite, and exact
 * secondary predicates, then applies D-159 combination semantics to both the
 * player and database-plan traces.
 */
export const compileNativeDecisionPointReport = (
  input: NativeDecisionPointReportCompileInput,
): NativeDecisionPointReportCompileResult => {
  const rubric = CompiledRubricSchema.safeParse(input.compiledRubric);
  const balanceCatalog = DecisionBalanceCatalogSchema.safeParse(input.balanceCatalog);
  const regimenCatalog = MedicationRegimenKnowledgeCatalogSchema.safeParse(
    input.medicationRegimenKnowledgeCatalog,
  );
  const currentRegimen = MedicationRegimenEntryV2Schema.array().safeParse(input.currentRegimen);
  const playerDecision = GeneratedEncounterDecisionSelectionSchema.safeParse(input.playerDecision);
  const databasePlanDecision = GeneratedEncounterDecisionSelectionSchema.safeParse(
    input.databasePlanDecision,
  );
  if (
    !rubric.success ||
    !balanceCatalog.success ||
    !regimenCatalog.success ||
    !currentRegimen.success ||
    !playerDecision.success ||
    !databasePlanDecision.success
  ) {
    return fail(
      'INVALID_INPUT',
      [
        ...(!rubric.success
          ? rubric.error.issues.map(
              (issue) => `rubric.${issue.path.join('.') || '<root>'}: ${issue.message}`,
            )
          : []),
        ...(!balanceCatalog.success
          ? balanceCatalog.error.issues.map(
              (issue) => `balanceCatalog.${issue.path.join('.') || '<root>'}: ${issue.message}`,
            )
          : []),
        ...(!regimenCatalog.success
          ? regimenCatalog.error.issues.map(
              (issue) => `regimenCatalog.${issue.path.join('.') || '<root>'}: ${issue.message}`,
            )
          : []),
        ...(!currentRegimen.success
          ? currentRegimen.error.issues.map(
              (issue) => `currentRegimen.${issue.path.join('.') || '<root>'}: ${issue.message}`,
            )
          : []),
        ...(!playerDecision.success
          ? playerDecision.error.issues.map(
              (issue) => `playerDecision.${issue.path.join('.') || '<root>'}: ${issue.message}`,
            )
          : []),
        ...(!databasePlanDecision.success
          ? databasePlanDecision.error.issues.map(
              (issue) =>
                `databasePlanDecision.${issue.path.join('.') || '<root>'}: ${issue.message}`,
            )
          : []),
      ].join('; '),
    );
  }
  const balanceSnapshot = compileDecisionBalanceCatalogSnapshot({
    compiledRubric: rubric.data,
    balanceCatalog: balanceCatalog.data,
  });
  if (!balanceSnapshot.ok) return balanceSnapshot;
  const player = evaluateRubric(
    rubric.data,
    playerDecision.data,
    currentRegimen.data,
    balanceSnapshot.value,
    regimenCatalog.data,
  );
  if (!player.ok) return player;
  const databasePlan = evaluateRubric(
    rubric.data,
    databasePlanDecision.data,
    currentRegimen.data,
    balanceSnapshot.value,
    regimenCatalog.data,
  );
  if (!databasePlan.ok) return databasePlan;
  const report = GeneratedEncounterPointReportInputSchema.safeParse({
    producerRef: {
      id: NATIVE_DECISION_BALANCE_PRODUCER_ID,
      contentVersion: NATIVE_DECISION_BALANCE_COMPILER_VERSION,
    },
    balanceCatalogSnapshot: balanceSnapshot.value,
    ruleTrace: player.trace,
    databasePlanRuleTrace: databasePlan.trace,
    playerDecision: playerDecision.data,
    databasePlanDecision: databasePlanDecision.data,
    databasePlanPoints: databasePlan.audit.reduce(
      (total, evaluation) => total + evaluation.appliedPoints,
      0,
    ),
    carePointCap: null,
    safetyConsequenceIds: [],
  });
  return report.success
    ? {
        ok: true,
        value: {
          report: report.data,
          playerRuleMatches: player.audit,
          databasePlanRuleMatches: databasePlan.audit,
        },
      }
    : fail(
        'INVALID_OUTPUT',
        report.error.issues
          .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
          .join('; '),
      );
};
