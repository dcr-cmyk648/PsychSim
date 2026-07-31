import {
  GeneratedCompletedEncounterAttemptCompileInputSchema,
  GeneratedCompletedEncounterAttemptPersistenceRecordSchema,
  GeneratedCompletedEncounterAttemptSchema,
  GeneratedEncounterPointReportSchema,
  GeneratedEncounterReplaySnapshotSchema,
  GeneratedEncounterSettlementSchema,
  type GeneratedCompletedEncounterAttempt,
  type GeneratedCompletedEncounterAttemptCompileInput,
  type GeneratedCompletedEncounterAttemptPersistenceRecord,
  type DecisionBalanceCatalogSnapshot,
  type GeneratedEncounterDecisionSelection,
  type GeneratedEncounterActionEventInput,
  type GeneratedEncounterAttemptFingerprint,
  type GeneratedEncounterEvent,
  type GeneratedEncounterPointReport,
  type GeneratedEncounterPointReportInput,
  type GeneratedEncounterReplaySnapshot,
  type GeneratedEncounterSettlement,
  type GeneratedEncounterSettlementInput,
  type GeneratedEncounterTreatmentSelection,
  type GeneratedInformationPurchaseSnapshot,
  type GeneratedRulePointEvaluation,
  type PlayerDiagnosisSelections,
  type ScoreComponent,
  type FrozenGeneratedWaitingSlot,
} from '@psychsim/schemas';

import {
  NATIVE_DECISION_BALANCE_COMPILER_VERSION,
  compileNativeDecisionPointReport,
  deriveNativeSelectedRuleTargets,
  verifyDecisionBalanceCatalogSnapshotIntegrity,
} from './decision-balance';
import {
  deriveGeneratedEncounterDecisionSelection,
  evaluateTriggeredInformationPrerequisite,
  selectedDecisionActionTargetMatches,
  validateGeneratedEncounterDecisionSelectionAgainstSnapshot,
} from './decision-selection';
import { verifyFindingPipelineAuditIntegrity } from './finding-pipeline-audit-composer';
import {
  NATIVE_GENERATED_SERVICE_QUOTE_COMPILER_VERSION,
  compileGeneratedInformationServicePricing,
  quoteGeneratedInformationPurchase,
  verifyGeneratedServicePricingReplaySnapshot,
} from './generated-service-quote';
import { resolveGeneratedRuleCombination } from './rule-combination';

export const GENERATED_COMPLETED_ATTEMPT_COMPILER_VERSION = '7.0.0';

type CompileErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_WAITING_SLOT'
  | 'CONTEXT_MISMATCH'
  | 'INVALID_SERVICE_PRICING'
  | 'INVALID_ACTION_EVENT'
  | 'INVALID_SELECTION'
  | 'INVALID_POINT_REPORT'
  | 'INVALID_SETTLEMENT'
  | 'INVALID_OUTPUT';

type IntegrityErrorCode =
  | 'INVALID_SCHEMA'
  | 'UNSUPPORTED_COMPILER_VERSION'
  | 'REPLAY_MISMATCH'
  | 'PAYLOAD_FINGERPRINT_MISMATCH';

export type GeneratedCompletedAttemptCompileResult =
  | { readonly ok: true; readonly value: GeneratedCompletedEncounterAttempt }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: CompileErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type GeneratedCompletedAttemptIntegrityResult =
  | { readonly ok: true; readonly value: GeneratedCompletedEncounterAttempt }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: IntegrityErrorCode;
        readonly message: string;
      };
    };

export type GeneratedCompletedAttemptContextResult =
  | { readonly ok: true; readonly value: GeneratedCompletedEncounterAttempt }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_ATTEMPT' | 'INVALID_WAITING_SLOT' | 'CONTEXT_MISMATCH';
        readonly message: string;
      };
    };

export type GeneratedCompletedAttemptPersistenceRecordIntegrityResult =
  | { readonly ok: true; readonly value: GeneratedCompletedEncounterAttemptPersistenceRecord }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_SCHEMA' | 'INVALID_ATTEMPT' | 'RECORD_FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

const SCORE_COMPONENTS: readonly ScoreComponent[] = [
  'diagnosis',
  'workup',
  'medication_selection',
  'medication_discontinuation',
  'safety',
  'nonmedication',
  'disposition',
  'efficiency',
];

const compareStrings = (left: string, right: string): number =>
  left === right ? 0 : left < right ? -1 : 1;

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

const sameCanonicalValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const isJsonSafeValue = (value: unknown, ancestors = new Set<object>()): boolean => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value) && !Object.is(value, -0);
  if (typeof value !== 'object' || ancestors.has(value)) return false;
  ancestors.add(value);
  if (Array.isArray(value)) {
    const expectedPropertyNames = [
      ...Array.from({ length: value.length }, (_, index) => String(index)),
      'length',
    ];
    const actualPropertyNames = Object.getOwnPropertyNames(value);
    const safe =
      Object.getOwnPropertySymbols(value).length === 0 &&
      sameCanonicalValue(actualPropertyNames, expectedPropertyNames) &&
      value.every((child) => isJsonSafeValue(child, ancestors));
    ancestors.delete(value);
    return safe;
  }
  const prototype = Object.getPrototypeOf(value);
  if (
    (prototype !== Object.prototype && prototype !== null) ||
    Object.getOwnPropertySymbols(value).length > 0
  ) {
    ancestors.delete(value);
    return false;
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const safe = Object.values(descriptors).every(
    (descriptor) =>
      'value' in descriptor &&
      descriptor.enumerable === true &&
      isJsonSafeValue(descriptor.value, ancestors),
  );
  ancestors.delete(value);
  return safe;
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

const fingerprint = (scope: string, value: unknown): GeneratedEncounterAttemptFingerprint =>
  `fingerprint.generated-encounter-attempt.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: GeneratedEncounterAttemptFingerprint): string =>
  `${prefix}.${value.slice(-16)}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const fail = (
  code: CompileErrorCode,
  message: string,
  contentIds: readonly string[] = [],
): GeneratedCompletedAttemptCompileResult => ({
  ok: false,
  error: { code, message, contentIds: [...new Set(contentIds)].sort(compareStrings) },
});

const defaultTreatmentSelection = (): GeneratedEncounterTreatmentSelection => ({
  schemaVersion: 1,
  selectionVersion: 2,
  medicationTransition: {
    selectionVersion: 2,
    startMedicationIds: [],
    adjustments: [],
  },
  interventionIds: [],
  dispositionId: null,
});

const replaySnapshotPayload = (
  snapshot: Omit<GeneratedEncounterReplaySnapshot, 'id' | 'payloadFingerprint'>,
): unknown => snapshot;

const pointReportPayload = (
  report: Omit<GeneratedEncounterPointReport, 'id' | 'payloadFingerprint'>,
): unknown => report;

const settlementPayload = (
  settlement: Omit<GeneratedEncounterSettlement, 'id' | 'payloadFingerprint'>,
): unknown => settlement;

const replayIdentityPayload = (
  attempt: Omit<GeneratedCompletedEncounterAttempt, 'replayFingerprint' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: attempt.schemaVersion,
  compilerVersion: attempt.compilerVersion,
  id: attempt.id,
  modelVersion: attempt.modelVersion,
  mode: attempt.mode,
  engineVersions: attempt.engineVersions,
  replaySnapshot: attempt.replaySnapshot,
  events: attempt.events,
  purchases: attempt.purchases,
  submittedDiagnoses: attempt.submittedDiagnoses,
  diagnosisQualifierValidation: attempt.diagnosisQualifierValidation,
  submittedTreatment: attempt.submittedTreatment,
  pointReport: attempt.pointReport,
  settlement: attempt.settlement,
  terminalCompletionEventId: attempt.terminalCompletionEventId,
});

const attemptPayload = (
  attempt: Omit<GeneratedCompletedEncounterAttempt, 'payloadFingerprint'>,
): unknown => attempt;

const persistenceRecordPayload = (
  record: Omit<GeneratedCompletedEncounterAttemptPersistenceRecord, 'id' | 'recordFingerprint'>,
): unknown => record;

const exactRuleKey = (ruleRef: {
  readonly kind: string;
  readonly id: string;
  readonly contentVersion: string;
  readonly ownerId: string;
  readonly ownerContentVersion: string;
}): string =>
  [
    ruleRef.kind,
    ruleRef.id,
    ruleRef.contentVersion,
    ruleRef.ownerId,
    ruleRef.ownerContentVersion,
  ].join('\u0000');

const validateDecisionParts = (
  diagnoses: PlayerDiagnosisSelections,
  treatment: GeneratedEncounterTreatmentSelection,
  snapshot: GeneratedEncounterReplaySnapshot,
): string | null => {
  const decision = deriveGeneratedEncounterDecisionSelection({
    purchases: [],
    diagnosisSelections: diagnoses,
    treatmentSelection: treatment,
  });
  if (!decision.ok) return decision.error.message;
  const validation = validateGeneratedEncounterDecisionSelectionAgainstSnapshot(
    decision.value,
    snapshot,
  );
  return validation.ok ? null : validation.error.message;
};

const validateDiagnosisSelections = (
  selections: PlayerDiagnosisSelections,
  snapshot: GeneratedEncounterReplaySnapshot,
): string | null => validateDecisionParts(selections, defaultTreatmentSelection(), snapshot);

const validateTreatmentSelection = (
  selection: GeneratedEncounterTreatmentSelection,
  snapshot: GeneratedEncounterReplaySnapshot,
): string | null => validateDecisionParts([], selection, snapshot);

const validatePointTrace = (input: {
  readonly trace: readonly GeneratedRulePointEvaluation[];
  readonly snapshot: GeneratedEncounterReplaySnapshot;
  readonly balanceSnapshot: DecisionBalanceCatalogSnapshot;
  readonly playerDecision: GeneratedEncounterDecisionSelection;
}): string | null => {
  const includedRules = input.snapshot.encounterInstance.compiledRubric.includedRules;
  const includedByKey = new Map(includedRules.map((rule) => [exactRuleKey(rule.ruleRef), rule]));
  const balancesByRuleKey = new Map(
    input.balanceSnapshot.balances.map((balance) => [exactRuleKey(balance.ruleRef), balance]),
  );
  const compiledRows = input.trace.filter((row) => row.source.kind === 'compiled_decision_rule');
  if (compiledRows.length !== input.trace.length) {
    return 'A native generated point trace may contain only exact compiled-rubric rules.';
  }
  const rowKeys = compiledRows.map((row) =>
    row.source.kind === 'compiled_decision_rule' ? exactRuleKey(row.source.ruleRef) : '',
  );
  if (
    new Set(rowKeys).size !== rowKeys.length ||
    rowKeys.length !== includedRules.length ||
    rowKeys.some((key) => !includedByKey.has(key))
  ) {
    return 'The generated point trace must evaluate every exact compiled-rubric rule once.';
  }
  for (const row of compiledRows) {
    if (row.source.kind !== 'compiled_decision_rule') continue;
    const compiled = includedByKey.get(exactRuleKey(row.source.ruleRef));
    if (
      compiled === undefined ||
      row.label !== compiled.label ||
      !sameCanonicalValue(row.balanceRef, compiled.balanceRef) ||
      (compiled.balanceRef === null) !== (row.status === 'unbalanced')
    ) {
      return `Trace row ${row.id} does not preserve its exact compiled rule and balance reference.`;
    }
    const balance = balancesByRuleKey.get(exactRuleKey(row.source.ruleRef)) ?? null;
    if (
      (compiled.balanceRef === null) !== (balance === null) ||
      (balance !== null &&
        (compiled.balanceRef?.id !== balance.id ||
          compiled.balanceRef.contentVersion !== balance.contentVersion))
    ) {
      return `Trace row ${row.id} does not preserve its exact frozen balance owner.`;
    }
    const expectedPrerequisiteEvaluation =
      compiled.triggeredInformationPrerequisite === null
        ? null
        : (() => {
            const evaluation = evaluateTriggeredInformationPrerequisite({
              prerequisite: compiled.triggeredInformationPrerequisite,
              selection: input.playerDecision,
              currentRegimen: input.snapshot.patientInstance.patientState.medicationRegimenEntries,
            });
            return {
              status: evaluation.status,
              triggerSelected: evaluation.triggerSelected,
              fulfillmentSelected: evaluation.fulfillmentSelected,
            };
          })();
    if (
      !sameCanonicalValue(
        row.triggeredInformationPrerequisiteEvaluation,
        expectedPrerequisiteEvaluation,
      ) ||
      (expectedPrerequisiteEvaluation !== null &&
        row.matched !== expectedPrerequisiteEvaluation.triggerSelected)
    ) {
      return `Trace row ${row.id} does not preserve its exact triggered-information evaluation.`;
    }
    if (balance !== null) {
      const expectedOutcome =
        balance.balanceKind === 'triggered_information_prerequisite'
          ? expectedPrerequisiteEvaluation?.status === 'fulfilled'
            ? balance.outcomes.fulfilled
            : expectedPrerequisiteEvaluation?.status === 'omitted'
              ? balance.outcomes.omitted
              : balance.outcomes.notTriggered
          : row.matched
            ? {
                points: balance.pointsWhenMatched,
                explanation: balance.matchedExplanation,
              }
            : {
                points: 0,
                explanation: balance.unmatchedExplanation,
              };
      if (
        row.component !== balance.component ||
        row.pointsBeforeCombination !== expectedOutcome.points ||
        row.explanation !== expectedOutcome.explanation
      ) {
        return `Trace row ${row.id} does not preserve its frozen balance magnitude and explanation.`;
      }
    }
    const expectedTargets = deriveNativeSelectedRuleTargets(
      compiled,
      input.playerDecision,
      input.snapshot.patientInstance.patientState.medicationRegimenEntries,
    );
    if (!sameCanonicalValue(row.relatedSelectedActionTargets, expectedTargets)) {
      return `Trace row ${row.id} does not preserve its complete exact selected targets.`;
    }
  }
  const byId = new Map(input.trace.map((row) => [row.id, row]));
  for (const row of input.trace) {
    if (row.status === 'applied' && row.pointsBeforeCombination !== row.appliedPoints) {
      return `Applied trace row ${row.id} must preserve the exact applied balance value.`;
    }
    if (
      row.status === 'not_triggered' &&
      (row.pointsBeforeCombination !== 0 || row.appliedPoints !== 0)
    ) {
      return `Non-triggered trace row ${row.id} must contribute zero points.`;
    }
    if (
      row.resolvedByTraceId !== null &&
      (!['applied', 'deduplicated', 'suppressed'].includes(
        byId.get(row.resolvedByTraceId)?.status ?? '',
      ) ||
        row.resolvedByTraceId === row.id)
    ) {
      return `Trace row ${row.id} names an invalid controlling trace row.`;
    }
    if (
      row.relatedSelectedActionTargets.some(
        (target) =>
          !selectedDecisionActionTargetMatches(
            target,
            input.playerDecision,
            input.snapshot.patientInstance.patientState.medicationRegimenEntries,
          ),
      )
    ) {
      return `Trace row ${row.id} references an action the player did not select.`;
    }
    if (
      row.relatedDiagnosisIds.some(
        (diagnosisId) =>
          !input.playerDecision.diagnosisSelections.some(
            (selection) => selection.diagnosisId === diagnosisId,
          ),
      )
    ) {
      return `Trace row ${row.id} references a diagnosis the player did not submit.`;
    }
  }
  const recombinedTrace = resolveGeneratedRuleCombination({
    evaluations: input.trace,
    rules: includedRules,
  });
  if (!sameCanonicalValue(input.trace, recombinedTrace)) {
    return 'The generated point trace does not preserve deterministic D-159 rule combination.';
  }
  return null;
};

const buildPointReport = (input: {
  readonly report: GeneratedEncounterPointReportInput;
  readonly scoringEngineVersion: string;
  readonly snapshot: GeneratedEncounterReplaySnapshot;
  readonly playerDecision: GeneratedEncounterDecisionSelection;
}):
  | { readonly ok: true; readonly value: GeneratedEncounterPointReport }
  | {
      readonly ok: false;
      readonly message: string;
    } => {
  if (input.report.producerRef.contentVersion !== input.scoringEngineVersion) {
    return {
      ok: false,
      message: 'The point-report producer version must equal the retained scoring-engine version.',
    };
  }
  const balanceSnapshotIntegrity = verifyDecisionBalanceCatalogSnapshotIntegrity(
    input.report.balanceCatalogSnapshot,
    input.snapshot.encounterInstance.compiledRubric,
  );
  if (!balanceSnapshotIntegrity.ok) {
    return {
      ok: false,
      message: `The point report has an invalid balance snapshot: ${balanceSnapshotIntegrity.error.message}`,
    };
  }
  const playerDecisionValidation = validateGeneratedEncounterDecisionSelectionAgainstSnapshot(
    input.playerDecision,
    input.snapshot,
  );
  if (!playerDecisionValidation.ok) {
    return {
      ok: false,
      message: `The player decision is outside the frozen encounter horizon: ${playerDecisionValidation.error.message}`,
    };
  }
  if (!sameCanonicalValue(input.report.playerDecision, playerDecisionValidation.value)) {
    return {
      ok: false,
      message: 'The native point report does not retain the exact derived player decision.',
    };
  }
  const databasePlanValidation = validateGeneratedEncounterDecisionSelectionAgainstSnapshot(
    input.report.databasePlanDecision,
    input.snapshot,
  );
  if (!databasePlanValidation.ok) {
    return {
      ok: false,
      message: `The database-plan decision is outside the frozen encounter horizon: ${databasePlanValidation.error.message}`,
    };
  }
  const traceError = validatePointTrace({
    trace: input.report.ruleTrace,
    snapshot: input.snapshot,
    balanceSnapshot: balanceSnapshotIntegrity.value,
    playerDecision: playerDecisionValidation.value,
  });
  if (traceError !== null) return { ok: false, message: traceError };
  const databasePlanTraceError = validatePointTrace({
    trace: input.report.databasePlanRuleTrace,
    snapshot: input.snapshot,
    balanceSnapshot: balanceSnapshotIntegrity.value,
    playerDecision: databasePlanValidation.value,
  });
  if (databasePlanTraceError !== null) {
    return {
      ok: false,
      message: `Database-plan trace: ${databasePlanTraceError}`,
    };
  }
  const databasePlanPoints = input.report.databasePlanRuleTrace.reduce(
    (total, row) => total + row.appliedPoints,
    0,
  );
  if (input.report.databasePlanPoints !== databasePlanPoints) {
    return {
      ok: false,
      message: 'The database-plan point total does not equal its exact frozen rule trace.',
    };
  }
  const componentPoints = SCORE_COMPONENTS.map((component) => ({
    component,
    points: input.report.ruleTrace
      .filter((row) => row.component === component)
      .reduce((total, row) => total + row.appliedPoints, 0),
  }));
  const uncappedCarePoints = componentPoints.reduce(
    (total, component) => total + component.points,
    0,
  );
  const carePointsEarned =
    input.report.carePointCap === null
      ? uncappedCarePoints
      : Math.min(uncappedCarePoints, input.report.carePointCap);
  const withoutIdentity = {
    ...input.report,
    schemaVersion: 1 as const,
    modelVersion: 'generated-encounter-point-report.v6' as const,
    pointDerivation: 'provisional_balance_snapshot' as const,
    compiledRubricRef: {
      id: input.snapshot.encounterInstance.compiledRubric.id,
      compilerVersion: input.snapshot.encounterInstance.compiledRubric.compilerVersion,
      compilerFingerprint: input.snapshot.encounterInstance.compiledRubric.compilerFingerprint,
    },
    componentPoints,
    uncappedCarePoints,
    carePointsEarned,
    differenceFromDatabasePlan: carePointsEarned - databasePlanPoints,
  };
  const payloadFingerprint = fingerprint('point-report', pointReportPayload(withoutIdentity));
  const parsed = GeneratedEncounterPointReportSchema.safeParse({
    ...withoutIdentity,
    id: stableId('generated-encounter-point-report', payloadFingerprint),
    payloadFingerprint,
  });
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, message: issuesText(parsed.error.issues) };
};

const buildSettlement = (input: {
  readonly settlement: GeneratedEncounterSettlementInput;
  readonly settlementEngineVersion: string;
  readonly mode: GeneratedCompletedEncounterAttempt['mode'];
  readonly pointReport: GeneratedEncounterPointReport;
  readonly purchases: readonly GeneratedInformationPurchaseSnapshot[];
  readonly snapshot: GeneratedEncounterReplaySnapshot;
}):
  | { readonly ok: true; readonly value: GeneratedEncounterSettlement }
  | {
      readonly ok: false;
      readonly message: string;
    } => {
  if (input.settlement.producerRef.contentVersion !== input.settlementEngineVersion) {
    return {
      ok: false,
      message: 'The settlement producer version must equal the retained settlement-engine version.',
    };
  }
  for (const charge of input.settlement.treatmentCharges) {
    if (
      !selectedDecisionActionTargetMatches(
        charge.actionTarget,
        input.pointReport.playerDecision,
        input.snapshot.patientInstance.patientState.medicationRegimenEntries,
      )
    ) {
      return {
        ok: false,
        message: `Treatment charge ${charge.id} does not target a selected action.`,
      };
    }
  }
  const positiveCarePoints = Math.max(0, input.pointReport.carePointsEarned);
  const carePointPenalty = Math.min(0, input.pointReport.carePointsEarned);
  const grossPayout = Math.round(
    Math.max(
      0,
      (input.settlement.baseReimbursement + positiveCarePoints + input.settlement.challengeBonus) *
        input.settlement.satisfactionMultiplier +
        carePointPenalty,
    ),
  );
  const informationExpenses = input.purchases.reduce(
    (total, purchase) => total + purchase.operatingCost,
    0,
  );
  const treatmentExpenses = input.settlement.treatmentCharges.reduce(
    (total, charge) => total + charge.operatingCost,
    0,
  );
  const operatingExpenses = informationExpenses + treatmentExpenses;
  const calculatedPayout = grossPayout - operatingExpenses;
  const projectedNetPointsEarned = Math.max(0, calculatedPayout);
  const practiceMode = input.mode !== 'standard';
  const bankedPointsEarned = practiceMode ? 0 : projectedNetPointsEarned;
  const withoutIdentity = {
    ...input.settlement,
    schemaVersion: 1 as const,
    modelVersion: 'generated-encounter-settlement.v2' as const,
    settlementDerivation:
      'arithmetic_verified_information_pricing_native_treatment_pricing_unverified' as const,
    pointReportRef: {
      id: input.pointReport.id,
      payloadFingerprint: input.pointReport.payloadFingerprint,
    },
    carePoints: input.pointReport.carePointsEarned,
    grossPayout,
    informationExpenses,
    treatmentExpenses,
    operatingExpenses,
    calculatedPayout,
    projectedNetPointsEarned,
    bankedPointsEarned,
    practiceMode,
    persistentPointsAfter: input.settlement.persistentPointsBefore + bankedPointsEarned,
    lifetimePointsAfter: input.settlement.lifetimePointsBefore + bankedPointsEarned,
  };
  const payloadFingerprint = fingerprint('settlement', settlementPayload(withoutIdentity));
  const parsed = GeneratedEncounterSettlementSchema.safeParse({
    ...withoutIdentity,
    id: stableId('generated-encounter-settlement', payloadFingerprint),
    payloadFingerprint,
  });
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, message: issuesText(parsed.error.issues) };
};

const buildReplaySnapshot = (
  frozenWaitingSlot: FrozenGeneratedWaitingSlot,
  servicePricing: GeneratedCompletedEncounterAttemptCompileInput['servicePricing'],
):
  | { readonly ok: true; readonly value: GeneratedEncounterReplaySnapshot }
  | {
      readonly ok: false;
      readonly message: string;
      readonly contentIds: readonly string[];
    } => {
  const auditIntegrity = verifyFindingPipelineAuditIntegrity(
    frozenWaitingSlot.findingPipelineAuditArtifact,
  );
  if (!auditIntegrity.ok) {
    return {
      ok: false,
      message: auditIntegrity.error.message,
      contentIds: [frozenWaitingSlot.id],
    };
  }
  const audit = auditIntegrity.value;
  if (audit.status !== 'compiled' || audit.catalogSnapshot === null) {
    return {
      ok: false,
      message: 'A generated completed attempt requires one completely compiled waiting patient.',
      contentIds: [frozenWaitingSlot.id],
    };
  }
  const catalog = audit.catalogSnapshot;
  const authority = audit.patientSlotFillSeedAuthorityArtifact;
  const actionDefinitions = new Map(
    catalog.universalActionResultAssemblyRecipe.actionCatalog.actions.map((action) => [
      action.id,
      action,
    ]),
  );
  const operationalActions = new Map(
    catalog.operationalAdmissionArtifact.informationActionEvaluations.map((evaluation) => [
      evaluation.informationActionId,
      evaluation,
    ]),
  );
  const pricing = compileGeneratedInformationServicePricing({
    servicePricing,
    operationalAdmission: catalog.operationalAdmissionArtifact,
    informationActionIds: catalog.encounterInstance.decisionActionHorizon.informationActionIds,
  });
  if (!pricing.ok) {
    return {
      ok: false,
      message: `${pricing.error.code}: ${pricing.error.message}`,
      contentIds: pricing.error.contentIds,
    };
  }
  const pricingActions = new Map(
    pricing.value.informationActionPricingHorizon.map((entry) => [
      entry.informationActionId,
      entry,
    ]),
  );
  const informationActionRuntimeHorizon = [];
  for (const informationActionId of catalog.encounterInstance.decisionActionHorizon
    .informationActionIds) {
    const definition = actionDefinitions.get(informationActionId);
    const operational = operationalActions.get(informationActionId);
    const actionPricing = pricingActions.get(informationActionId);
    if (
      definition === undefined ||
      operational?.availability !== 'available_at_selected_location' ||
      operational.serviceOwner === null ||
      actionPricing === undefined
    ) {
      return {
        ok: false,
        message: `Information action ${informationActionId} lacks a complete replayable fulfillment horizon.`,
        contentIds: [informationActionId, catalog.encounterInstance.id],
      };
    }
    informationActionRuntimeHorizon.push({
      informationActionId,
      repeatable: definition.repeatable,
      serviceRef: actionPricing.serviceRef,
      servicePricingOwnerFingerprint: actionPricing.servicePricingOwnerFingerprint,
      availableFulfillmentMethodIds: [...actionPricing.availableFulfillmentMethodIds],
    });
  }
  const withoutIdentity = {
    schemaVersion: 1 as const,
    modelVersion: 'generated-encounter-replay-snapshot.v2' as const,
    sourceFindingPipelineAuditRef: {
      id: audit.id,
      payloadFingerprint: audit.payloadFingerprint,
    },
    sourceCatalogSnapshotRef: {
      id: catalog.id,
      inputFingerprint: catalog.inputFingerprint,
      payloadFingerprint: catalog.payloadFingerprint,
    },
    waitingSlotRef: {
      id: frozenWaitingSlot.id,
      mode: authority.coordinates.mode,
      slotCoordinateId: authority.coordinates.slotCoordinateId,
      fillOrdinal: authority.coordinates.fillOrdinal,
      locationRef: authority.coordinates.locationRef,
      locationFingerprint: authority.coordinates.locationFingerprint,
    },
    patientInstance: catalog.patientInstance,
    encounterInstance: catalog.encounterInstance,
    servicePricingOwners: [...pricing.value.servicePricingOwners],
    informationActionRuntimeHorizon,
  };
  const payloadFingerprint = fingerprint('replay-snapshot', replaySnapshotPayload(withoutIdentity));
  const parsed = GeneratedEncounterReplaySnapshotSchema.safeParse({
    ...withoutIdentity,
    id: stableId('generated-encounter-replay-snapshot', payloadFingerprint),
    payloadFingerprint,
  });
  return parsed.success
    ? { ok: true, value: parsed.data }
    : {
        ok: false,
        message: issuesText(parsed.error.issues),
        contentIds: [frozenWaitingSlot.id],
      };
};

const convertActionEvents = (input: {
  readonly actionEvents: readonly GeneratedEncounterActionEventInput[];
  readonly snapshot: GeneratedEncounterReplaySnapshot;
}):
  | {
      readonly ok: true;
      readonly events: readonly GeneratedEncounterEvent[];
      readonly purchases: readonly GeneratedInformationPurchaseSnapshot[];
      readonly diagnoses: PlayerDiagnosisSelections;
      readonly treatment: GeneratedEncounterTreatmentSelection;
    }
  | {
      readonly ok: false;
      readonly message: string;
      readonly contentIds: readonly string[];
    } => {
  const eventIds = input.actionEvents.map((event) => event.id);
  if (new Set(eventIds).size !== eventIds.length) {
    return {
      ok: false,
      message: 'Generated action-event IDs must be unique.',
      contentIds: eventIds,
    };
  }
  const runtimeActions = new Map(
    input.snapshot.informationActionRuntimeHorizon.map((entry) => [
      entry.informationActionId,
      entry,
    ]),
  );
  const resultBindings = new Map(
    input.snapshot.encounterInstance.resultBindings.map((binding) => [
      binding.informationActionId,
      binding,
    ]),
  );
  const purchases: GeneratedInformationPurchaseSnapshot[] = [];
  const purchaseIds = new Set<string>();
  const purchaseCounts = new Map<string, number>();
  let diagnoses: PlayerDiagnosisSelections = [];
  let treatment = defaultTreatmentSelection();
  const events: GeneratedEncounterEvent[] = [];
  for (const actionEvent of input.actionEvents) {
    if (actionEvent.type === 'InformationPurchased') {
      const runtime = runtimeActions.get(actionEvent.purchase.informationActionId);
      const binding = resultBindings.get(actionEvent.purchase.informationActionId);
      if (
        runtime === undefined ||
        binding === undefined ||
        purchaseIds.has(actionEvent.purchase.id) ||
        (!runtime.repeatable &&
          (purchaseCounts.get(actionEvent.purchase.informationActionId) ?? 0) > 0)
      ) {
        return {
          ok: false,
          message: `Information purchase ${actionEvent.purchase.id} is duplicated or outside the exact action, result, or fulfillment horizon.`,
          contentIds: [actionEvent.purchase.id, actionEvent.purchase.informationActionId],
        };
      }
      purchaseIds.add(actionEvent.purchase.id);
      purchaseCounts.set(
        actionEvent.purchase.informationActionId,
        (purchaseCounts.get(actionEvent.purchase.informationActionId) ?? 0) + 1,
      );
      const quoted = quoteGeneratedInformationPurchase({
        purchase: actionEvent.purchase,
        resultBindingId: binding.id,
        replaySnapshot: input.snapshot,
      });
      if (!quoted.ok) {
        return {
          ok: false,
          message: `${quoted.error.code}: ${quoted.error.message}`,
          contentIds: quoted.error.contentIds,
        };
      }
      const purchase: GeneratedInformationPurchaseSnapshot = quoted.value;
      purchases.push(purchase);
      events.push({
        id: actionEvent.id,
        ordinal: events.length + 1,
        type: 'InformationPurchased',
        purchase,
      });
      continue;
    }
    if (actionEvent.type === 'DiagnosisSelectionsChanged') {
      const diagnosisError = validateDiagnosisSelections(actionEvent.selections, input.snapshot);
      if (diagnosisError !== null) {
        return {
          ok: false,
          message: diagnosisError,
          contentIds: actionEvent.selections.map((selection) => selection.diagnosisId),
        };
      }
      diagnoses = actionEvent.selections;
      events.push({
        id: actionEvent.id,
        ordinal: events.length + 1,
        type: actionEvent.type,
        selections: diagnoses,
      });
      continue;
    }
    const treatmentError = validateTreatmentSelection(actionEvent.selections, input.snapshot);
    if (treatmentError !== null) {
      return {
        ok: false,
        message: treatmentError,
        contentIds: [actionEvent.id],
      };
    }
    treatment = actionEvent.selections;
    events.push({
      id: actionEvent.id,
      ordinal: events.length + 1,
      type: actionEvent.type,
      selections: treatment,
    });
  }
  return { ok: true, events, purchases, diagnoses, treatment };
};

const derivedEventId = (attemptId: string, kind: string): string =>
  stableId(`generated-encounter-event.${kind}`, fingerprint('event-id', { attemptId, kind }));

export const compileGeneratedCompletedEncounterAttempt = (
  value: unknown,
): GeneratedCompletedAttemptCompileResult => {
  if (!isJsonSafeValue(value)) {
    return fail(
      'INVALID_INPUT',
      'A generated attempt compile request must be losslessly JSON-safe and finite.',
    );
  }
  const parsed = GeneratedCompletedEncounterAttemptCompileInputSchema.safeParse(value);
  if (!parsed.success) {
    return fail('INVALID_INPUT', issuesText(parsed.error.issues));
  }
  const input: GeneratedCompletedEncounterAttemptCompileInput = parsed.data;
  if (
    input.engineVersions.servicePricingEngineVersion !==
    NATIVE_GENERATED_SERVICE_QUOTE_COMPILER_VERSION
  ) {
    return fail(
      'INVALID_SERVICE_PRICING',
      `Generated service-pricing engine ${input.engineVersions.servicePricingEngineVersion} does not match native quote compiler ${NATIVE_GENERATED_SERVICE_QUOTE_COMPILER_VERSION}.`,
    );
  }
  const snapshotResult = buildReplaySnapshot(input.frozenWaitingSlot, input.servicePricing);
  if (!snapshotResult.ok) {
    return fail(
      snapshotResult.message.includes('SERVICE_') || snapshotResult.message.includes('METHOD_')
        ? 'INVALID_SERVICE_PRICING'
        : 'INVALID_WAITING_SLOT',
      snapshotResult.message,
      snapshotResult.contentIds,
    );
  }
  const snapshot = snapshotResult.value;
  if (input.mode !== snapshot.waitingSlotRef.mode) {
    return fail(
      'CONTEXT_MISMATCH',
      'The attempt mode must equal the exact mode that generated the occupied waiting slot.',
      [input.attemptId, snapshot.waitingSlotRef.id],
    );
  }
  const converted = convertActionEvents({
    actionEvents: input.actionEvents,
    snapshot,
  });
  if (!converted.ok) {
    return fail('INVALID_ACTION_EVENT', converted.message, converted.contentIds);
  }
  if (input.engineVersions.scoringEngineVersion !== NATIVE_DECISION_BALANCE_COMPILER_VERSION) {
    return fail(
      'INVALID_POINT_REPORT',
      `Generated scoring engine ${input.engineVersions.scoringEngineVersion} does not match native decision-balance compiler ${NATIVE_DECISION_BALANCE_COMPILER_VERSION}.`,
    );
  }
  const playerDecision = deriveGeneratedEncounterDecisionSelection({
    purchases: converted.purchases,
    diagnosisSelections: converted.diagnoses,
    treatmentSelection: converted.treatment,
  });
  if (!playerDecision.ok) {
    return fail(
      'INVALID_POINT_REPORT',
      playerDecision.error.message,
      playerDecision.error.contentIds,
    );
  }
  const playerDecisionValidation = validateGeneratedEncounterDecisionSelectionAgainstSnapshot(
    playerDecision.value,
    snapshot,
  );
  if (!playerDecisionValidation.ok) {
    return fail(
      'INVALID_POINT_REPORT',
      playerDecisionValidation.error.message,
      playerDecisionValidation.error.contentIds,
    );
  }
  const databasePlanValidation = validateGeneratedEncounterDecisionSelectionAgainstSnapshot(
    input.pointDerivation.databasePlanDecision,
    snapshot,
  );
  if (!databasePlanValidation.ok) {
    return fail(
      'INVALID_POINT_REPORT',
      databasePlanValidation.error.message,
      databasePlanValidation.error.contentIds,
    );
  }
  const nativePointReport = compileNativeDecisionPointReport({
    compiledRubric: snapshot.encounterInstance.compiledRubric,
    currentRegimen: snapshot.patientInstance.patientState.medicationRegimenEntries,
    playerDecision: playerDecisionValidation.value,
    databasePlanDecision: databasePlanValidation.value,
    balanceCatalog: input.pointDerivation.balanceCatalog,
    medicationRegimenKnowledgeCatalog: input.pointDerivation.medicationRegimenKnowledgeCatalog,
  });
  if (!nativePointReport.ok) {
    return fail(
      'INVALID_POINT_REPORT',
      `${nativePointReport.error.code}: ${nativePointReport.error.message}`,
      nativePointReport.error.contentIds,
    );
  }
  const pointReportResult = buildPointReport({
    report: nativePointReport.value.report,
    scoringEngineVersion: input.engineVersions.scoringEngineVersion,
    snapshot,
    playerDecision: playerDecisionValidation.value,
  });
  if (!pointReportResult.ok) {
    return fail('INVALID_POINT_REPORT', pointReportResult.message);
  }
  const settlementResult = buildSettlement({
    settlement: input.settlement,
    settlementEngineVersion: input.engineVersions.settlementEngineVersion,
    mode: input.mode,
    pointReport: pointReportResult.value,
    purchases: [...converted.purchases],
    snapshot,
  });
  if (!settlementResult.ok) {
    return fail('INVALID_SETTLEMENT', settlementResult.message);
  }
  const lifecycleEventIds = {
    started: derivedEventId(input.attemptId, 'started'),
    submitted: derivedEventId(input.attemptId, 'submitted'),
    pointReport: derivedEventId(input.attemptId, 'point-report'),
    settlement: derivedEventId(input.attemptId, 'settlement'),
    completed: derivedEventId(input.attemptId, 'completed'),
  };
  const inputEventIds = new Set(input.actionEvents.map((event) => event.id));
  if (Object.values(lifecycleEventIds).some((eventId) => inputEventIds.has(eventId))) {
    return fail(
      'INVALID_ACTION_EVENT',
      'A caller-supplied action event collides with a deterministic lifecycle event ID.',
      [...inputEventIds],
    );
  }
  const events: GeneratedEncounterEvent[] = [
    {
      id: lifecycleEventIds.started,
      ordinal: 0,
      type: 'EncounterStarted',
      patientInstanceId: snapshot.patientInstance.id,
      encounterInstanceId: snapshot.encounterInstance.id,
    },
    ...converted.events,
  ];
  events.push(
    {
      id: lifecycleEventIds.submitted,
      ordinal: events.length,
      type: 'EncounterSubmitted',
      submittedDiagnoses: converted.diagnoses,
      submittedTreatment: converted.treatment,
    },
    {
      id: lifecycleEventIds.pointReport,
      ordinal: events.length + 1,
      type: 'PointReportCalculated',
      pointReportRef: {
        id: pointReportResult.value.id,
        payloadFingerprint: pointReportResult.value.payloadFingerprint,
      },
    },
    {
      id: lifecycleEventIds.settlement,
      ordinal: events.length + 2,
      type: 'SettlementCalculated',
      settlementRef: {
        id: settlementResult.value.id,
        payloadFingerprint: settlementResult.value.payloadFingerprint,
      },
    },
    {
      id: lifecycleEventIds.completed,
      ordinal: events.length + 3,
      type: 'EncounterCompleted',
      attemptId: input.attemptId,
    },
  );
  const withoutFingerprints = {
    schemaVersion: 1 as const,
    compilerVersion: GENERATED_COMPLETED_ATTEMPT_COMPILER_VERSION,
    id: input.attemptId,
    modelVersion: 'generated-completed-encounter-attempt.v2' as const,
    mode: input.mode,
    engineVersions: input.engineVersions,
    replaySnapshot: snapshot,
    events,
    purchases: [...converted.purchases],
    submittedDiagnoses: converted.diagnoses,
    diagnosisQualifierValidation: 'family_identity_only' as const,
    submittedTreatment: converted.treatment,
    pointReport: pointReportResult.value,
    settlement: settlementResult.value,
    terminalCompletionEventId: lifecycleEventIds.completed,
  };
  const replayFingerprint = fingerprint('replay', replayIdentityPayload(withoutFingerprints));
  const withoutPayloadFingerprint = {
    ...withoutFingerprints,
    replayFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', attemptPayload(withoutPayloadFingerprint));
  const output = GeneratedCompletedEncounterAttemptSchema.safeParse({
    ...withoutPayloadFingerprint,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues));
  }
  const verified = verifyGeneratedCompletedEncounterAttemptIntegrity(output.data);
  return verified.ok
    ? { ok: true, value: output.data }
    : fail('INVALID_OUTPUT', verified.error.message);
};

const verifyReplaySnapshot = (snapshot: GeneratedEncounterReplaySnapshot): string | null => {
  const pricingIntegrity = verifyGeneratedServicePricingReplaySnapshot(snapshot);
  if (!pricingIntegrity.ok) return pricingIntegrity.message;
  const withoutIdentity = {
    schemaVersion: snapshot.schemaVersion,
    modelVersion: snapshot.modelVersion,
    sourceFindingPipelineAuditRef: snapshot.sourceFindingPipelineAuditRef,
    sourceCatalogSnapshotRef: snapshot.sourceCatalogSnapshotRef,
    waitingSlotRef: snapshot.waitingSlotRef,
    patientInstance: snapshot.patientInstance,
    encounterInstance: snapshot.encounterInstance,
    servicePricingOwners: snapshot.servicePricingOwners,
    informationActionRuntimeHorizon: snapshot.informationActionRuntimeHorizon,
  };
  const expectedFingerprint = fingerprint(
    'replay-snapshot',
    replaySnapshotPayload(withoutIdentity),
  );
  const expectedId = stableId('generated-encounter-replay-snapshot', expectedFingerprint);
  return snapshot.payloadFingerprint === expectedFingerprint && snapshot.id === expectedId
    ? null
    : 'The compact replay snapshot does not match its exact patient/encounter payload.';
};

const verifyPointReport = (
  report: GeneratedEncounterPointReport,
  input: {
    readonly snapshot: GeneratedEncounterReplaySnapshot;
    readonly purchases: readonly GeneratedInformationPurchaseSnapshot[];
    readonly diagnoses: PlayerDiagnosisSelections;
    readonly treatment: GeneratedEncounterTreatmentSelection;
    readonly scoringEngineVersion: string;
  },
): string | null => {
  const playerDecision = deriveGeneratedEncounterDecisionSelection({
    purchases: input.purchases,
    diagnosisSelections: input.diagnoses,
    treatmentSelection: input.treatment,
  });
  if (!playerDecision.ok) return playerDecision.error.message;
  const rebuilt = buildPointReport({
    report: {
      producerRef: report.producerRef,
      balanceCatalogSnapshot: report.balanceCatalogSnapshot,
      ruleTrace: report.ruleTrace,
      databasePlanRuleTrace: report.databasePlanRuleTrace,
      playerDecision: report.playerDecision,
      databasePlanDecision: report.databasePlanDecision,
      databasePlanPoints: report.databasePlanPoints,
      carePointCap: report.carePointCap,
      safetyConsequenceIds: report.safetyConsequenceIds,
    },
    scoringEngineVersion: input.scoringEngineVersion,
    snapshot: input.snapshot,
    playerDecision: playerDecision.value,
  });
  return rebuilt.ok && sameCanonicalValue(rebuilt.value, report)
    ? null
    : rebuilt.ok
      ? 'The generated point report does not equal its deterministic replay.'
      : rebuilt.message;
};

const verifySettlement = (
  settlement: GeneratedEncounterSettlement,
  input: {
    readonly snapshot: GeneratedEncounterReplaySnapshot;
    readonly purchases: readonly GeneratedInformationPurchaseSnapshot[];
    readonly pointReport: GeneratedEncounterPointReport;
    readonly mode: GeneratedCompletedEncounterAttempt['mode'];
    readonly settlementEngineVersion: string;
  },
): string | null => {
  const rebuilt = buildSettlement({
    settlement: {
      producerRef: settlement.producerRef,
      baseReimbursement: settlement.baseReimbursement,
      challengeBonus: settlement.challengeBonus,
      satisfactionMultiplier: settlement.satisfactionMultiplier,
      treatmentCharges: settlement.treatmentCharges,
      persistentPointsBefore: settlement.persistentPointsBefore,
      lifetimePointsBefore: settlement.lifetimePointsBefore,
    },
    settlementEngineVersion: input.settlementEngineVersion,
    mode: input.mode,
    pointReport: input.pointReport,
    purchases: input.purchases,
    snapshot: input.snapshot,
  });
  return rebuilt.ok && sameCanonicalValue(rebuilt.value, settlement)
    ? null
    : rebuilt.ok
      ? 'The generated settlement does not equal its deterministic arithmetic replay.'
      : rebuilt.message;
};

const replayEvents = (
  attempt: GeneratedCompletedEncounterAttempt,
):
  | {
      readonly ok: true;
      readonly purchases: readonly GeneratedInformationPurchaseSnapshot[];
      readonly diagnoses: PlayerDiagnosisSelections;
      readonly treatment: GeneratedEncounterTreatmentSelection;
    }
  | {
      readonly ok: false;
      readonly message: string;
    } => {
  const events = attempt.events;
  const started = events[0];
  const submittedIndex = events.findIndex((event) => event.type === 'EncounterSubmitted');
  const submittedEvents = events.filter((event) => event.type === 'EncounterSubmitted');
  if (
    started?.type !== 'EncounterStarted' ||
    started.patientInstanceId !== attempt.replaySnapshot.patientInstance.id ||
    started.encounterInstanceId !== attempt.replaySnapshot.encounterInstance.id ||
    submittedEvents.length !== 1 ||
    submittedIndex < 1 ||
    events[submittedIndex + 1]?.type !== 'PointReportCalculated' ||
    events[submittedIndex + 2]?.type !== 'SettlementCalculated' ||
    events[submittedIndex + 3]?.type !== 'EncounterCompleted' ||
    submittedIndex + 3 !== events.length - 1
  ) {
    return {
      ok: false,
      message:
        'Generated events must start once, submit once, calculate points, settle, and complete in that exact terminal order.',
    };
  }
  const purchases: GeneratedInformationPurchaseSnapshot[] = [];
  let diagnoses: PlayerDiagnosisSelections = [];
  let treatment = defaultTreatmentSelection();
  for (const event of events.slice(1, submittedIndex)) {
    if (event.type === 'InformationPurchased') {
      const quoted = quoteGeneratedInformationPurchase({
        purchase: {
          id: event.purchase.id,
          informationActionId: event.purchase.informationActionId,
        },
        resultBindingId: event.purchase.resultBindingId,
        replaySnapshot: attempt.replaySnapshot,
      });
      if (!quoted.ok || !sameCanonicalValue(quoted.value, event.purchase)) {
        return {
          ok: false,
          message: quoted.ok
            ? `Information purchase ${event.purchase.id} does not equal its frozen native service quote.`
            : quoted.error.message,
        };
      }
      purchases.push(event.purchase);
    } else if (event.type === 'DiagnosisSelectionsChanged') diagnoses = event.selections;
    else if (event.type === 'TreatmentSelectionsChanged') treatment = event.selections;
    else {
      return { ok: false, message: `Unexpected pre-submit event ${event.type}.` };
    }
  }
  const submitted = events[submittedIndex];
  const pointEvent = events[submittedIndex + 1];
  const settlementEvent = events[submittedIndex + 2];
  const completedEvent = events[submittedIndex + 3];
  if (
    submitted?.type !== 'EncounterSubmitted' ||
    !sameCanonicalValue(submitted.submittedDiagnoses, diagnoses) ||
    !sameCanonicalValue(submitted.submittedTreatment, treatment) ||
    !sameCanonicalValue(attempt.submittedDiagnoses, diagnoses) ||
    !sameCanonicalValue(attempt.submittedTreatment, treatment) ||
    !sameCanonicalValue(attempt.purchases, purchases) ||
    pointEvent?.type !== 'PointReportCalculated' ||
    pointEvent.pointReportRef.id !== attempt.pointReport.id ||
    pointEvent.pointReportRef.payloadFingerprint !== attempt.pointReport.payloadFingerprint ||
    settlementEvent?.type !== 'SettlementCalculated' ||
    settlementEvent.settlementRef.id !== attempt.settlement.id ||
    settlementEvent.settlementRef.payloadFingerprint !== attempt.settlement.payloadFingerprint ||
    completedEvent?.type !== 'EncounterCompleted' ||
    completedEvent.id !== attempt.terminalCompletionEventId ||
    completedEvent.attemptId !== attempt.id
  ) {
    return {
      ok: false,
      message:
        'The generated event replay does not reproduce its submitted selections, purchases, point report, settlement, and terminal completion.',
    };
  }
  return { ok: true, purchases, diagnoses, treatment };
};

export const verifyGeneratedCompletedEncounterAttemptIntegrity = (
  value: unknown,
): GeneratedCompletedAttemptIntegrityResult => {
  if (!isJsonSafeValue(value)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: 'A generated completed attempt must be losslessly JSON-safe and finite.',
      },
    };
  }
  const parsed = GeneratedCompletedEncounterAttemptSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const attempt = parsed.data;
  if (attempt.compilerVersion !== GENERATED_COMPLETED_ATTEMPT_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${attempt.id} uses unsupported generated-attempt compiler ${attempt.compilerVersion}.`,
      },
    };
  }
  if (
    attempt.engineVersions.servicePricingEngineVersion !==
    NATIVE_GENERATED_SERVICE_QUOTE_COMPILER_VERSION
  ) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${attempt.id} uses unsupported service-pricing compiler ${attempt.engineVersions.servicePricingEngineVersion}.`,
      },
    };
  }
  const snapshotError = verifyReplaySnapshot(attempt.replaySnapshot);
  const diagnosisError = validateDiagnosisSelections(
    attempt.submittedDiagnoses,
    attempt.replaySnapshot,
  );
  const treatmentError = validateTreatmentSelection(
    attempt.submittedTreatment,
    attempt.replaySnapshot,
  );
  const eventReplay = replayEvents(attempt);
  if (
    snapshotError !== null ||
    diagnosisError !== null ||
    treatmentError !== null ||
    !eventReplay.ok
  ) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          snapshotError ??
          diagnosisError ??
          treatmentError ??
          (eventReplay.ok ? 'Unknown replay mismatch.' : eventReplay.message),
      },
    };
  }
  const pointError = verifyPointReport(attempt.pointReport, {
    snapshot: attempt.replaySnapshot,
    purchases: eventReplay.purchases,
    diagnoses: eventReplay.diagnoses,
    treatment: eventReplay.treatment,
    scoringEngineVersion: attempt.engineVersions.scoringEngineVersion,
  });
  const settlementError =
    pointError === null
      ? verifySettlement(attempt.settlement, {
          snapshot: attempt.replaySnapshot,
          purchases: eventReplay.purchases,
          pointReport: attempt.pointReport,
          mode: attempt.mode,
          settlementEngineVersion: attempt.engineVersions.settlementEngineVersion,
        })
      : null;
  if (pointError !== null || settlementError !== null) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: pointError ?? settlementError ?? 'Unknown score replay mismatch.',
      },
    };
  }
  const withoutFingerprints = {
    schemaVersion: attempt.schemaVersion,
    compilerVersion: attempt.compilerVersion,
    id: attempt.id,
    modelVersion: attempt.modelVersion,
    mode: attempt.mode,
    engineVersions: attempt.engineVersions,
    replaySnapshot: attempt.replaySnapshot,
    events: attempt.events,
    purchases: attempt.purchases,
    submittedDiagnoses: attempt.submittedDiagnoses,
    diagnosisQualifierValidation: attempt.diagnosisQualifierValidation,
    submittedTreatment: attempt.submittedTreatment,
    pointReport: attempt.pointReport,
    settlement: attempt.settlement,
    terminalCompletionEventId: attempt.terminalCompletionEventId,
  };
  const expectedReplayFingerprint = fingerprint(
    'replay',
    replayIdentityPayload(withoutFingerprints),
  );
  const expectedPayloadFingerprint = fingerprint(
    'payload',
    attemptPayload({
      ...withoutFingerprints,
      replayFingerprint: expectedReplayFingerprint,
    }),
  );
  if (
    attempt.replayFingerprint !== expectedReplayFingerprint ||
    attempt.payloadFingerprint !== expectedPayloadFingerprint
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${attempt.id} does not match its exact generated replay payload.`,
      },
    };
  }
  return { ok: true, value: attempt };
};

export const verifyGeneratedCompletedEncounterAttemptContext = (input: {
  readonly attempt: unknown;
  readonly frozenWaitingSlot: unknown;
}): GeneratedCompletedAttemptContextResult => {
  const attemptIntegrity = verifyGeneratedCompletedEncounterAttemptIntegrity(input.attempt);
  if (!attemptIntegrity.ok) {
    return {
      ok: false,
      error: { code: 'INVALID_ATTEMPT', message: attemptIntegrity.error.message },
    };
  }
  const waitingSlotResult = buildReplaySnapshot(
    input.frozenWaitingSlot as FrozenGeneratedWaitingSlot,
    {
      services: attemptIntegrity.value.replaySnapshot.servicePricingOwners.map(
        (owner) => owner.service,
      ),
    },
  );
  if (!waitingSlotResult.ok) {
    return {
      ok: false,
      error: { code: 'INVALID_WAITING_SLOT', message: waitingSlotResult.message },
    };
  }
  if (!sameCanonicalValue(attemptIntegrity.value.replaySnapshot, waitingSlotResult.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message:
          'The generated completed attempt does not preserve the exact patient and encounter compiled for this waiting slot.',
      },
    };
  }
  return { ok: true, value: attemptIntegrity.value };
};

export const createGeneratedCompletedEncounterAttemptPersistenceRecord = (input: {
  readonly attempt: unknown;
  readonly completedAt: string;
}): GeneratedCompletedEncounterAttemptPersistenceRecord => {
  const attempt = verifyGeneratedCompletedEncounterAttemptIntegrity(input.attempt);
  if (!attempt.ok) throw new Error(attempt.error.message);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    modelVersion: 'generated-completed-attempt-persistence-record.v1' as const,
    attempt: attempt.value,
    completedAt: input.completedAt,
  };
  const recordFingerprint = fingerprint(
    'persistence-record',
    persistenceRecordPayload(withoutIdentity),
  );
  return GeneratedCompletedEncounterAttemptPersistenceRecordSchema.parse({
    ...withoutIdentity,
    id: stableId('generated-completed-attempt-record', recordFingerprint),
    recordFingerprint,
  });
};

export const verifyGeneratedCompletedEncounterAttemptPersistenceRecord = (
  value: unknown,
): GeneratedCompletedAttemptPersistenceRecordIntegrityResult => {
  const parsed = GeneratedCompletedEncounterAttemptPersistenceRecordSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const attempt = verifyGeneratedCompletedEncounterAttemptIntegrity(parsed.data.attempt);
  if (!attempt.ok) {
    return {
      ok: false,
      error: { code: 'INVALID_ATTEMPT', message: attempt.error.message },
    };
  }
  const expectedFingerprint = fingerprint(
    'persistence-record',
    persistenceRecordPayload({
      schemaVersion: parsed.data.schemaVersion,
      modelVersion: parsed.data.modelVersion,
      attempt: parsed.data.attempt,
      completedAt: parsed.data.completedAt,
    }),
  );
  const expectedId = stableId('generated-completed-attempt-record', expectedFingerprint);
  if (parsed.data.recordFingerprint !== expectedFingerprint || parsed.data.id !== expectedId) {
    return {
      ok: false,
      error: {
        code: 'RECORD_FINGERPRINT_MISMATCH',
        message: `${parsed.data.id} does not match its persisted generated-attempt record.`,
      },
    };
  }
  return { ok: true, value: parsed.data };
};
