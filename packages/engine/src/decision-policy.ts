import {
  CompiledRubricSchema,
  type CompiledRubric,
  type CompiledRubricRule,
  type DecisionActionHorizon,
  type DecisionActionPredicate,
  type DecisionActionTarget,
  type DecisionCompilerFingerprint,
  type DecisionCoverageDiagnostic,
  type DecisionMatchedPatientFactBinding,
  type DecisionPatientFactKey,
  type DecisionPatientPredicate,
  type DecisionPolicyDefinition,
  type DecisionRuleCandidateDefinition,
  type DecisionRuleReference,
  type ResolvedPatientState,
} from '@psychsim/schemas';

export const DECISION_POLICY_COMPILER_VERSION = '1.0.0';

export type DecisionPolicyCompileErrorCode =
  | 'POLICY_NOT_APPROVED'
  | 'DUPLICATE_RULE_REFERENCE'
  | 'AMBIGUOUS_RULE_REFERENCE'
  | 'PRIMARY_ROUTE_MISSING'
  | 'PRIMARY_ROUTE_STALE'
  | 'PRIMARY_ROUTE_NOT_APPROVED'
  | 'PRIMARY_ROUTE_INVALID'
  | 'ACTION_HORIZON_INVALID'
  | 'RULE_INDEX_STALE'
  | 'COMPILED_RUBRIC_INVALID';

export interface DecisionPolicyCompileError {
  readonly code: DecisionPolicyCompileErrorCode;
  readonly message: string;
  readonly contentIds: readonly string[];
}

export type DecisionPolicyCompileResult =
  | { readonly ok: true; readonly value: CompiledRubric }
  | { readonly ok: false; readonly error: DecisionPolicyCompileError };

export interface DecisionRuleIndex {
  readonly compilerVersion: typeof DECISION_POLICY_COMPILER_VERSION;
  readonly fingerprint: DecisionCompilerFingerprint;
  readonly ruleKeysByActionTarget: ReadonlyMap<string, readonly string[]>;
}

export interface CompileDecisionPolicyInput {
  readonly policy: DecisionPolicyDefinition;
  readonly patientState: ResolvedPatientState;
  readonly actionHorizon: DecisionActionHorizon;
  readonly rules: readonly DecisionRuleCandidateDefinition[];
  readonly discoveryStrategy?: 'scan' | 'index';
  readonly ruleIndex?: DecisionRuleIndex;
}

export type CompiledRubricIntegrityResult =
  | { readonly ok: true; readonly value: CompiledRubric }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_SCHEMA' | 'FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

interface IndexedPatientFact {
  readonly key: DecisionPatientFactKey;
  readonly recordIds: readonly string[];
}

interface PredicateMatch {
  readonly matched: boolean;
  readonly bindings: readonly DecisionMatchedPatientFactBinding[];
}

interface ActionMatch {
  readonly matched: boolean;
  readonly targets: readonly DecisionActionTarget[];
}

interface CandidateMatch {
  readonly candidate: DecisionRuleCandidateDefinition;
  readonly patient: PredicateMatch;
  readonly action: ActionMatch;
}

const compareStrings = (left: string, right: string): number =>
  left === right ? 0 : left < right ? -1 : 1;

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value
      .map(canonicalize)
      .sort((left, right) => compareStrings(JSON.stringify(left), JSON.stringify(right)));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
};

const canonicalizeObjectKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(canonicalizeObjectKeys);
  }
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

const fingerprint = (scope: string, value: unknown): DecisionCompilerFingerprint =>
  `fingerprint.decision.${scope}.fnv1a64.${hashToHex64(JSON.stringify(canonicalize(value)))}`;

const referenceKey = (reference: DecisionRuleReference): string =>
  `${reference.kind}:${reference.id}@${reference.contentVersion}:${reference.ownerId}@${reference.ownerContentVersion}`;

const factKey = (fact: DecisionPatientFactKey): string =>
  [
    fact.recordKind,
    fact.identityId,
    fact.identityContentVersion ?? '',
    fact.attributeId,
    fact.valueId,
  ].join('\0');
const actionTargetKey = (target: DecisionActionTarget): string =>
  JSON.stringify(canonicalize(target));

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const cloneFact = (fact: DecisionPatientFactKey): DecisionPatientFactKey => ({ ...fact });

const cloneActionTarget = (target: DecisionActionTarget): DecisionActionTarget => ({ ...target });

const uniqueActionTargets = (targets: readonly DecisionActionTarget[]): DecisionActionTarget[] => [
  ...new Map(
    targets
      .map((target) => [actionTargetKey(target), cloneActionTarget(target)] as const)
      .sort(([left], [right]) => compareStrings(left, right)),
  ).values(),
];

const uniqueFactBindings = (
  bindings: readonly DecisionMatchedPatientFactBinding[],
): DecisionMatchedPatientFactBinding[] => {
  const byFact = new Map<string, { fact: DecisionPatientFactKey; recordIds: Set<string> }>();
  for (const binding of bindings) {
    const key = factKey(binding.fact);
    const current = byFact.get(key) ?? {
      fact: binding.fact,
      recordIds: new Set<string>(),
    };
    binding.recordIds.forEach((recordId) => current.recordIds.add(recordId));
    byFact.set(key, current);
  }
  return [...byFact.entries()]
    .sort(([left], [right]) => compareStrings(left, right))
    .map(([, binding]) => ({
      fact: cloneFact(binding.fact),
      recordIds: [...binding.recordIds].sort(compareStrings),
    }));
};

const normalizePatientPredicate = (
  predicate: DecisionPatientPredicate | null,
): DecisionPatientPredicate | null => {
  if (predicate === null) return null;
  switch (predicate.type) {
    case 'fact':
      return { type: 'fact', fact: cloneFact(predicate.fact) };
    case 'same_record_all':
      return {
        type: 'same_record_all',
        facts: [...predicate.facts]
          .map(cloneFact)
          .sort((left, right) => compareStrings(factKey(left), factKey(right))),
      };
    case 'all':
    case 'any': {
      const predicates = predicate.predicates
        .map((child) => normalizePatientPredicate(child)!)
        .sort((left, right) =>
          compareStrings(JSON.stringify(canonicalize(left)), JSON.stringify(canonicalize(right))),
        );
      return { type: predicate.type, predicates };
    }
  }
};

const normalizeActionPredicate = (
  predicate: DecisionActionPredicate | null,
): DecisionActionPredicate | null =>
  predicate === null
    ? null
    : {
        match: predicate.match,
        targets: uniqueActionTargets(predicate.targets),
      };

const stateBindingId = (
  domain: 'demographics' | 'reaction-history' | 'clinical-context' | 'safety-planning',
  stateId: string,
  discriminator = '',
): string => `decision-binding.${domain}.${hashToHex64([stateId, discriminator].join('\0'))}`;

const enumValueId = (namespace: string, value: string | boolean): string =>
  `${namespace}.${String(value)}`;

/**
 * Projects a complete frozen patient snapshot into exact, typed relationship
 * keys. Display labels, summaries, free clinical tags, and numeric prose are
 * intentionally ignored. Numeric state becomes rule-addressable only through
 * a reviewed interpretation ID.
 */
export const collectDecisionPatientFacts = (
  state: ResolvedPatientState,
): readonly IndexedPatientFact[] => {
  const facts = new Map<string, { key: DecisionPatientFactKey; recordIds: Set<string> }>();
  const add = (
    recordKind: DecisionPatientFactKey['recordKind'],
    recordId: string,
    identityId: string,
    identityContentVersion: string | null,
    attributeId: string,
    valueId: string,
  ): void => {
    const key: DecisionPatientFactKey = {
      recordKind,
      identityId,
      identityContentVersion,
      attributeId,
      valueId,
    };
    const serialized = factKey(key);
    const prior = facts.get(serialized) ?? { key, recordIds: new Set<string>() };
    prior.recordIds.add(recordId);
    facts.set(serialized, prior);
  };

  add(
    'demographics',
    stateBindingId('demographics', state.id),
    'patient.demographics',
    null,
    'demographics.reviewed-age-band',
    state.demographics.reviewedAgeBandId,
  );
  add(
    'demographics',
    stateBindingId('demographics', state.id),
    'patient.demographics',
    null,
    'demographics.sex-for-reference',
    enumValueId('sex-for-reference', state.demographics.sexForReference),
  );

  for (const condition of state.conditionStates) {
    const common = [
      'condition',
      condition.id,
      condition.diagnosisDefinitionId,
      condition.diagnosisDefinitionContentVersion,
    ] as const;
    add(...common, 'condition.presence', 'state.present');
    add(...common, 'condition.clinical-state', condition.clinicalStateId);
    add(...common, 'condition.time-scope', condition.timeScopeId);
    add(
      ...common,
      'condition.encounter-relevance',
      enumValueId('condition-relevance', condition.encounterRelevance),
    );
    add(...common, 'condition.origin', enumValueId('condition-origin', condition.origin));
    if (condition.severityId !== null) {
      add(...common, 'condition.severity', condition.severityId);
    }
    for (const specifierId of condition.specifierIds) {
      add(...common, 'condition.specifier', specifierId);
    }
  }

  for (const chartEntry of state.diagnosisRecordEntries) {
    if (
      chartEntry.mappedDiagnosisDefinitionId === null ||
      chartEntry.mappedDiagnosisDefinitionContentVersion === null
    ) {
      continue;
    }
    const common = [
      'chart_diagnosis',
      chartEntry.id,
      chartEntry.mappedDiagnosisDefinitionId,
      chartEntry.mappedDiagnosisDefinitionContentVersion,
    ] as const;
    add(...common, 'chart-diagnosis.presence', 'state.present');
    add(
      ...common,
      'chart-diagnosis.assertion',
      enumValueId('chart-diagnosis-assertion', chartEntry.assertion),
    );
    add(
      ...common,
      'chart-diagnosis.source-kind',
      enumValueId('evidence-source-kind', chartEntry.source.kind),
    );
    add(...common, 'chart-diagnosis.time-scope', chartEntry.timeScopeId);
  }

  for (const regimenEntry of state.medicationRegimenEntries) {
    const common = [
      'medication_regimen',
      regimenEntry.id,
      regimenEntry.medicationIdentityId,
      null,
    ] as const;
    add(...common, 'medication-regimen.presence', 'state.present');
    add(
      ...common,
      'medication-regimen.clinical-role',
      enumValueId('medication-clinical-role', regimenEntry.clinicalRole),
    );
    add(
      ...common,
      'medication-regimen.status',
      enumValueId('medication-status', regimenEntry.status),
    );
    add(
      ...common,
      'medication-regimen.adherence',
      enumValueId('medication-adherence', regimenEntry.adherence),
    );
    add(
      ...common,
      'medication-regimen.known-at-opening',
      enumValueId('boolean', regimenEntry.knownAtOpening),
    );
    add(
      ...common,
      'medication-regimen.impact-classification',
      enumValueId('impact-classification', regimenEntry.impactClassification),
    );
    add(...common, 'medication-regimen.source', enumValueId('history-source', regimenEntry.source));
    if (regimenEntry.prescribedForDiagnosisId !== null) {
      add(
        ...common,
        'medication-regimen.prescribed-for-diagnosis',
        regimenEntry.prescribedForDiagnosisId,
      );
    }
  }

  for (const exposure of state.exposureInventory.useEntries) {
    const common = [
      'exposure',
      exposure.id,
      exposure.agent.identityId,
      exposure.agent.identityContentVersion,
    ] as const;
    add(...common, 'exposure.use', 'state.present');
    add(...common, 'exposure.agent-kind', enumValueId('exposure-agent-kind', exposure.agent.kind));
    add(
      ...common,
      'exposure.recency-kind',
      enumValueId('exposure-recency-kind', exposure.mostRecentUse.kind),
    );
    if (exposure.mostRecentUse.kind === 'elapsed') {
      add(
        ...common,
        'exposure.recency-unit',
        enumValueId('exposure-recency-unit', exposure.mostRecentUse.unit),
      );
    }
    add(
      ...common,
      'exposure.prescription-relationship',
      enumValueId('prescription-relationship', exposure.prescriptionRelationship),
    );
    add(...common, 'exposure.misuse-truth', enumValueId('boolean', exposure.misuseTruth));
  }

  for (const trial of state.treatmentHistory.medicationTrials) {
    const common = ['medication_trial', trial.id, trial.medicationId, null] as const;
    add(...common, 'medication-trial.presence', 'state.present');
    add(...common, 'medication-trial.adequacy', enumValueId('trial-adequacy', trial.adequacy));
    add(...common, 'medication-trial.adherence', enumValueId('trial-adherence', trial.adherence));
    add(...common, 'medication-trial.response', enumValueId('trial-response', trial.response));
    add(
      ...common,
      'medication-trial.tolerability',
      enumValueId('trial-tolerability', trial.tolerability),
    );
    add(...common, 'medication-trial.source', enumValueId('history-source', trial.source));
    if (trial.exposure?.duration !== null && trial.exposure?.duration !== undefined) {
      add(
        ...common,
        'medication-trial.duration-unit',
        enumValueId('duration-unit', trial.exposure.duration.unit),
      );
    }
  }

  for (const trial of state.treatmentHistory.psychotherapyTrials) {
    const common = ['psychotherapy_trial', trial.id, trial.interventionId, null] as const;
    add(...common, 'psychotherapy-trial.presence', 'state.present');
    add(...common, 'psychotherapy-trial.status', enumValueId('therapy-status', trial.status));
    add(
      ...common,
      'psychotherapy-trial.engagement',
      enumValueId('therapy-engagement', trial.engagement),
    );
    add(...common, 'psychotherapy-trial.response', enumValueId('therapy-response', trial.response));
    add(...common, 'psychotherapy-trial.source', enumValueId('history-source', trial.source));
  }

  for (const provider of state.treatmentHistory.currentProviders) {
    const identityId = `provider-type.${provider.providerType}`;
    const common = ['current_provider', provider.id, identityId, null] as const;
    add(...common, 'current-provider.presence', 'state.present');
    add(...common, 'current-provider.active', enumValueId('boolean', provider.active));
    add(...common, 'current-provider.source', enumValueId('history-source', provider.source));
  }

  for (const level of state.treatmentHistory.priorLevelsOfCare) {
    const identityId = `level-of-care.${level.level}`;
    const common = ['prior_level_of_care', level.id, identityId, null] as const;
    add(...common, 'prior-level-of-care.presence', 'state.present');
    add(...common, 'prior-level-of-care.source', enumValueId('history-source', level.source));
  }

  const regimenById = new Map(
    state.medicationRegimenEntries.map((entry) => [entry.id, entry] as const),
  );
  const medicationTrialById = new Map(
    state.treatmentHistory.medicationTrials.map((trial) => [trial.id, trial] as const),
  );
  for (const tolerability of state.medicationTolerabilityFindings) {
    const medicationIdentityId =
      tolerability.subject.kind === 'current_regimen_entry'
        ? regimenById.get(tolerability.subject.regimenEntryId)?.medicationIdentityId
        : medicationTrialById.get(tolerability.subject.medicationTrialId)?.medicationId;
    if (!medicationIdentityId) continue;
    const common = [
      'medication_tolerability',
      tolerability.id,
      medicationIdentityId,
      null,
    ] as const;
    add(
      ...common,
      'medication-tolerability.domain',
      enumValueId('tolerability-domain', tolerability.domain),
    );
    add(
      ...common,
      'medication-tolerability.status',
      enumValueId('finding-status', tolerability.findingStatus),
    );
    add(
      ...common,
      'medication-tolerability.subject-kind',
      enumValueId('tolerability-subject-kind', tolerability.subject.kind),
    );
    if (tolerability.subject.kind === 'current_regimen_entry') {
      add(
        ...common,
        'medication-tolerability.subject-regimen-entry',
        tolerability.subject.regimenEntryId,
      );
    } else {
      add(
        ...common,
        'medication-tolerability.subject-medication-trial',
        tolerability.subject.medicationTrialId,
      );
    }
    add(
      ...common,
      'medication-tolerability.source',
      enumValueId('history-source', tolerability.source),
    );
    if (tolerability.sourceRateProfileId !== null) {
      add(
        ...common,
        'medication-tolerability.source-rate-profile',
        tolerability.sourceRateProfileId,
      );
    }
    for (const manifestationId of tolerability.manifestationIds) {
      add(...common, 'medication-tolerability.manifestation', manifestationId);
    }
  }

  add(
    'reaction_history',
    stateBindingId('reaction-history', state.id),
    'patient.reaction-history',
    null,
    'reaction-history.status',
    enumValueId('reaction-history-status', state.reactionHistory.status),
  );
  add(
    'reaction_history',
    stateBindingId('reaction-history', state.id),
    'patient.reaction-history',
    null,
    'reaction-history.medication-assessment-status',
    enumValueId(
      'reaction-medication-assessment-status',
      state.reactionHistory.medicationAssessmentStatus,
    ),
  );
  for (const reaction of state.reactionHistory.records) {
    const common = [
      'reaction',
      reaction.id,
      reaction.trigger.kind === 'medication'
        ? reaction.trigger.medicationId
        : reaction.trigger.triggerId,
      null,
    ] as const;
    add(...common, 'reaction.presence', 'state.present');
    add(
      ...common,
      'reaction.trigger-kind',
      enumValueId('reaction-trigger-kind', reaction.trigger.kind),
    );
    add(
      ...common,
      'reaction.recorded-as',
      enumValueId('reaction-recorded-as', reaction.recordedAs),
    );
    add(
      ...common,
      'reaction.reported-severity',
      enumValueId('reaction-severity', reaction.reportedSeverity),
    );
    add(...common, 'reaction.source', enumValueId('history-source', reaction.source));
    add(...common, 'reaction.status', enumValueId('reaction-status', reaction.status));
    for (const manifestationId of reaction.manifestationIds) {
      add(...common, 'reaction.manifestation', manifestationId);
    }
  }

  for (const finding of state.canonicalFindings) {
    const common = [
      'canonical_finding',
      finding.id,
      finding.definitionId,
      finding.definitionContentVersion,
    ] as const;
    add(
      ...common,
      'finding.outcome',
      finding.value.kind === 'outcome'
        ? enumValueId('finding-outcome', finding.value.value)
        : enumValueId('finding-resolution-state', finding.value.state),
    );
    add(
      ...common,
      'finding.uncertainty',
      enumValueId('finding-uncertainty', finding.resolution.uncertainty),
    );
    add(
      ...common,
      'finding.resolution-origin',
      enumValueId('finding-resolution-origin', finding.resolution.origin),
    );
  }

  for (const measurement of state.measurements) {
    const common = [
      'measurement',
      measurement.id,
      measurement.definitionId,
      measurement.definitionContentVersion,
    ] as const;
    add(...common, 'measurement.presence', 'state.present');
    add(...common, 'measurement.time-scope', measurement.timeScopeId);
    if (measurement.interpretation.kind === 'interpreted') {
      add(...common, 'measurement.interpretation', measurement.interpretation.interpretationId);
    }
    for (const contextValue of measurement.contextValues) {
      add(...common, `measurement-context.${contextValue.dimensionId}`, contextValue.valueId);
    }
  }

  for (const observation of state.categoricalObservations) {
    const common = [
      'categorical_observation',
      observation.id,
      observation.definitionId,
      observation.definitionContentVersion,
    ] as const;
    add(...common, 'categorical-observation.value', observation.valueId);
    add(...common, 'categorical-observation.time-scope', observation.timeScopeId);
    for (const interpretationId of observation.interpretationIds) {
      add(...common, 'categorical-observation.interpretation', interpretationId);
    }
  }

  for (const result of state.structuredTestResults) {
    const common = [
      'structured_test_result',
      result.id,
      result.testDefinitionId,
      result.testDefinitionContentVersion,
    ] as const;
    add(...common, 'test-result.kind', enumValueId('test-result-kind', result.kind));
    add(...common, 'test-result.time-scope', result.timeScopeId);
    if (result.kind === 'binary') {
      add(...common, 'test-result.outcome', enumValueId('test-outcome', result.outcome));
      for (const interpretationId of result.interpretationIds) {
        add(...common, 'test-result.interpretation', interpretationId);
      }
    } else if (result.kind === 'numeric_panel') {
      for (const component of result.components) {
        add(
          'structured_test_result',
          result.id,
          component.componentDefinitionId,
          null,
          'test-component.interpretation',
          enumValueId('test-interpretation', component.interpretation),
        );
      }
    } else if (result.kind === 'categorical_panel') {
      for (const component of result.components) {
        add(
          'structured_test_result',
          result.id,
          component.componentDefinitionId,
          null,
          'test-component.value',
          component.valueId,
        );
        for (const interpretationId of component.interpretationIds) {
          add(
            'structured_test_result',
            result.id,
            component.componentDefinitionId,
            null,
            'test-component.interpretation',
            interpretationId,
          );
        }
      }
    } else {
      for (const finding of result.findings) {
        add(
          'structured_test_result',
          result.id,
          finding.findingId,
          null,
          'test-finding.outcome',
          enumValueId('test-outcome', finding.outcome),
        );
      }
      if (result.overallInterpretationId !== null) {
        add(...common, 'test-result.interpretation', result.overallInterpretationId);
      }
    }
  }

  for (const clinicalContext of state.clinicalContexts) {
    add(
      'clinical_context',
      stateBindingId('clinical-context', state.id, clinicalContext.dimensionId),
      clinicalContext.dimensionId,
      null,
      'clinical-context.option',
      clinicalContext.optionId,
    );
  }

  const conditionById = new Map(
    state.conditionStates.map((condition) => [condition.id, condition] as const),
  );
  const findingById = new Map(
    state.canonicalFindings.map((finding) => [finding.id, finding] as const),
  );
  const propositionById = new Map(
    state.propositionState.propositions.map(
      (proposition) => [proposition.id, proposition] as const,
    ),
  );
  const patientTargetIdentity = (
    target: ResolvedPatientState['clinicalDurations'][number]['target'],
  ): { readonly id: string; readonly contentVersion: string } => {
    switch (target.kind) {
      case 'condition_state': {
        const condition = conditionById.get(target.conditionStateId);
        if (!condition) {
          throw new Error(`Unknown condition-state target ${target.conditionStateId}.`);
        }
        return {
          id: condition.diagnosisDefinitionId,
          contentVersion: condition.diagnosisDefinitionContentVersion,
        };
      }
      case 'canonical_finding': {
        const finding = findingById.get(target.canonicalFindingId);
        if (!finding) {
          throw new Error(`Unknown canonical-finding target ${target.canonicalFindingId}.`);
        }
        return {
          id: finding.definitionId,
          contentVersion: finding.definitionContentVersion,
        };
      }
      case 'latent_proposition': {
        const proposition = propositionById.get(target.propositionId);
        if (!proposition) {
          throw new Error(`Unknown latent-proposition target ${target.propositionId}.`);
        }
        return {
          id: proposition.definitionId,
          contentVersion: proposition.definitionContentVersion,
        };
      }
    }
  };
  for (const duration of state.clinicalDurations) {
    const targetIdentity = patientTargetIdentity(duration.target);
    const common = [
      'clinical_duration',
      duration.id,
      targetIdentity.id,
      targetIdentity.contentVersion,
    ] as const;
    add(
      ...common,
      'clinical-duration.interpretation',
      enumValueId('duration-interpretation', duration.interpretation),
    );
    add(...common, 'clinical-duration.unit', enumValueId('duration-unit', duration.unit));
    add(...common, 'clinical-duration.option', duration.durationOptionId);
    add(
      ...common,
      'clinical-duration.source-kind',
      enumValueId('evidence-source-kind', duration.source.kind),
    );
    add(...common, 'clinical-duration.time-scope', duration.timeScopeId);
    if (duration.relatedDiagnosisId !== null) {
      add(...common, 'clinical-duration.related-diagnosis', duration.relatedDiagnosisId);
    }
  }

  for (const burden of state.subjectiveBurdenRecords) {
    const targetIdentity = patientTargetIdentity(burden.target);
    const common = [
      'subjective_burden',
      burden.id,
      targetIdentity.id,
      targetIdentity.contentVersion,
    ] as const;
    add(...common, 'subjective-burden.ordinal-value', burden.ordinalValueId);
    add(...common, 'subjective-burden.time-scope', burden.timeScopeId);
    add(
      ...common,
      'subjective-burden.source-kind',
      enumValueId('evidence-source-kind', burden.source.kind),
    );
    add(
      'subjective_burden',
      burden.id,
      burden.ordinalScaleId,
      burden.ordinalScaleContentVersion,
      'subjective-burden.scale-presence',
      'state.present',
    );
  }

  for (const proposition of state.propositionState.propositions) {
    add(
      'proposition',
      proposition.id,
      proposition.definitionId,
      proposition.definitionContentVersion,
      'proposition.truth',
      enumValueId('boolean', proposition.truth),
    );
  }
  for (const evidence of state.propositionState.evidence) {
    const proposition = propositionById.get(evidence.propositionId);
    if (!proposition) continue;
    const common = [
      'proposition_evidence',
      evidence.id,
      proposition.definitionId,
      proposition.definitionContentVersion,
    ] as const;
    add(
      ...common,
      'proposition-evidence.assertion',
      enumValueId('evidence-assertion', evidence.assertion),
    );
    add(
      ...common,
      'proposition-evidence.truth-relationship',
      enumValueId('truth-relationship', evidence.relationshipToTruth),
    );
    add(
      ...common,
      'proposition-evidence.source-kind',
      enumValueId('evidence-source-kind', evidence.source.kind),
    );
  }
  for (const appraisal of state.propositionState.beliefAppraisals) {
    const proposition = propositionById.get(appraisal.propositionId);
    if (!proposition) continue;
    const common = [
      'belief_appraisal',
      appraisal.id,
      proposition.definitionId,
      proposition.definitionContentVersion,
    ] as const;
    add(
      ...common,
      'belief-appraisal.position',
      enumValueId('belief-position', appraisal.beliefPosition),
    );
    for (const value of appraisal.dimensionValues) {
      add(...common, `belief-appraisal-dimension.${value.dimensionId}`, value.valueId);
    }
    for (const interpretation of appraisal.clinicalInterpretations) {
      add(...common, 'belief-appraisal.interpretation', interpretation.interpretationId);
    }
  }

  add(
    'safety_planning',
    stateBindingId('safety-planning', state.id),
    'patient.reported-safety-planning-ability',
    null,
    'safety-planning.reported-ability',
    enumValueId('safety-planning-ability', state.reportedSafetyPlanningAbility),
  );

  return [...facts.values()]
    .map(({ key, recordIds }) => ({ key, recordIds: [...recordIds].sort() }))
    .sort((left, right) => compareStrings(factKey(left.key), factKey(right.key)));
};

export const collectDecisionActionTargets = (
  horizon: DecisionActionHorizon,
): readonly DecisionActionTarget[] => {
  const targets: DecisionActionTarget[] = [];
  for (const informationActionId of horizon.informationActionIds) {
    targets.push({ kind: 'information_action', informationActionId });
  }
  if (horizon.startMedicationIds.length > 0) {
    targets.push({ kind: 'any_medication_start' });
  }
  for (const medicationIdentityId of horizon.startMedicationIds) {
    targets.push({ kind: 'medication_start', medicationIdentityId });
  }
  for (const entry of horizon.regimenEntryOperations) {
    for (const operation of entry.operations) {
      targets.push({ kind: 'any_regimen_operation', operation });
      targets.push({
        kind: 'regimen_entry_operation',
        regimenEntryId: entry.regimenEntryId,
        operation,
      });
      targets.push({
        kind: 'regimen_medication_operation',
        medicationIdentityId: entry.medicationIdentityId,
        operation,
      });
    }
  }
  for (const interventionId of horizon.interventionIds) {
    targets.push({ kind: 'intervention', interventionId });
  }
  for (const dispositionId of horizon.dispositionIds) {
    targets.push({ kind: 'disposition', dispositionId });
  }
  return uniqueActionTargets(targets);
};

const evaluatePatientPredicate = (
  predicate: DecisionPatientPredicate | null,
  factsByKey: ReadonlyMap<string, IndexedPatientFact>,
): PredicateMatch => {
  if (predicate === null) return { matched: true, bindings: [] };
  switch (predicate.type) {
    case 'fact': {
      const match = factsByKey.get(factKey(predicate.fact));
      return match
        ? {
            matched: true,
            bindings: [{ fact: match.key, recordIds: [...match.recordIds] }],
          }
        : { matched: false, bindings: [] };
    }
    case 'same_record_all': {
      const matches = predicate.facts.map((fact) => factsByKey.get(factKey(fact)));
      if (matches.some((match) => match === undefined)) {
        return { matched: false, bindings: [] };
      }
      const present = matches.filter((match): match is IndexedPatientFact => match !== undefined);
      const commonRecordIds = present
        .slice(1)
        .reduce(
          (common, match) => common.filter((recordId) => match.recordIds.includes(recordId)),
          [...present[0]!.recordIds],
        )
        .sort(compareStrings);
      if (commonRecordIds.length === 0) {
        return { matched: false, bindings: [] };
      }
      return {
        matched: true,
        bindings: uniqueFactBindings(
          present.map((match) => ({
            fact: match.key,
            recordIds: commonRecordIds,
          })),
        ),
      };
    }
    case 'all': {
      const children = predicate.predicates.map((child) =>
        evaluatePatientPredicate(child, factsByKey),
      );
      if (children.some((child) => !child.matched)) {
        return { matched: false, bindings: [] };
      }
      return {
        matched: true,
        bindings: uniqueFactBindings(children.flatMap((child) => child.bindings)),
      };
    }
    case 'any': {
      const children = predicate.predicates
        .map((child) => evaluatePatientPredicate(child, factsByKey))
        .filter((child) => child.matched);
      if (children.length === 0) return { matched: false, bindings: [] };
      return {
        matched: true,
        bindings: uniqueFactBindings(children.flatMap((child) => child.bindings)),
      };
    }
  }
};

const evaluateActionPredicate = (
  predicate: DecisionActionPredicate | null,
  availableTargetsByKey: ReadonlyMap<string, DecisionActionTarget>,
): ActionMatch => {
  if (predicate === null) return { matched: true, targets: [] };
  const matching = predicate.targets.filter((target) =>
    availableTargetsByKey.has(actionTargetKey(target)),
  );
  const matched =
    predicate.match === 'all' ? matching.length === predicate.targets.length : matching.length > 0;
  return {
    matched,
    targets: matched ? uniqueActionTargets(matching) : [],
  };
};

const copyRuleIndexEntries = (
  entries: ReadonlyMap<string, readonly string[]>,
): ReadonlyMap<string, readonly string[]> =>
  new Map(
    [...entries.entries()]
      .map(([key, values]) => [key, uniqueSorted(values)] as const)
      .sort(([left], [right]) => compareStrings(left, right)),
  );

const ruleIndexFingerprint = (
  entries: ReadonlyMap<string, readonly string[]>,
): DecisionCompilerFingerprint =>
  fingerprint('rule-index', [...copyRuleIndexEntries(entries).entries()]);

export const buildDecisionRuleIndex = (
  rules: readonly DecisionRuleCandidateDefinition[],
): DecisionRuleIndex => {
  const mutable = new Map<string, Set<string>>();
  for (const candidate of rules) {
    if (candidate.discoveryLane === 'primary_policy_only' || candidate.actionWhen === null) {
      continue;
    }
    const candidateKey = referenceKey(candidate.ruleRef);
    for (const target of candidate.actionWhen.targets) {
      const key = actionTargetKey(target);
      const values = mutable.get(key) ?? new Set<string>();
      values.add(candidateKey);
      mutable.set(key, values);
    }
  }
  const ruleKeysByActionTarget = copyRuleIndexEntries(
    new Map(
      [...mutable.entries()]
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([key, values]) => [key, [...values].sort()] as const),
    ),
  );
  return {
    compilerVersion: DECISION_POLICY_COMPILER_VERSION,
    fingerprint: ruleIndexFingerprint(ruleKeysByActionTarget),
    ruleKeysByActionTarget,
  };
};

const makeDiagnostic = (
  code: DecisionCoverageDiagnostic['code'],
  affectedContentIds: readonly string[],
  expectedContentVersion: string | null,
  actualContentVersion: string | null,
  explanation: string,
): DecisionCoverageDiagnostic => {
  const sortedContentIds = uniqueSorted(affectedContentIds);
  return {
    id: `coverage-diagnostic.${code}.${hashToHex64(
      [code, ...sortedContentIds, expectedContentVersion, actualContentVersion].join(':'),
    )}`,
    code,
    impact: 'nonblocking',
    affectedContentIds: sortedContentIds,
    expectedContentVersion,
    actualContentVersion,
    ticketTargetId: 'ticket.engine.decision-policy.catalog-compiler',
    explanation,
  };
};

const inclusionReason = (
  candidate: DecisionRuleCandidateDefinition,
): CompiledRubricRule['inclusionReason'] => {
  if (candidate.discoveryLane === 'full_state_modifier') {
    return 'discovered_full_state_modifier';
  }
  switch (candidate.ruleKind) {
    case 'interaction':
      return 'automatic_interaction';
    case 'prerequisite':
      return 'automatic_prerequisite';
    case 'parsimony':
    case 'duplication':
      return 'automatic_parsimony';
    case 'disposition':
      return 'automatic_disposition';
    default:
      return 'automatic_safety';
  }
};

const toCompiledRule = (
  match: CandidateMatch,
  reason: CompiledRubricRule['inclusionReason'],
): CompiledRubricRule => ({
  ruleRef: { ...match.candidate.ruleRef },
  label: match.candidate.label,
  inclusionReason: reason,
  patientWhen: normalizePatientPredicate(match.candidate.patientWhen),
  actionWhen: normalizeActionPredicate(match.candidate.actionWhen),
  matchedPatientFactBindings: uniqueFactBindings(match.patient.bindings),
  matchedActionTargets: uniqueActionTargets(match.action.targets),
  ruleKind: match.candidate.ruleKind,
  stance: match.candidate.stance,
  concernLevel: match.candidate.concernLevel,
  certaintyLevel: match.candidate.certaintyLevel,
  effectId: match.candidate.effectId,
  issueId: match.candidate.issueId,
  specificityPriority: match.candidate.specificityPriority,
  rationale: match.candidate.rationale,
  review: {
    ...match.candidate.review,
    sourceUseNoteIds: uniqueSorted(match.candidate.review.sourceUseNoteIds),
  },
  developerOpinionIds: uniqueSorted(match.candidate.developerOpinionIds),
  balanceRef: match.candidate.balanceRef ? { ...match.candidate.balanceRef } : null,
});

const compilerFingerprintPayload = (rubric: {
  readonly schemaVersion: CompiledRubric['schemaVersion'];
  readonly compilerVersion: string;
  readonly policyRef: CompiledRubric['policyRef'];
  readonly primaryRouteRef: CompiledRubric['primaryRouteRef'];
  readonly patientStateId: CompiledRubric['patientStateId'];
  readonly patientStateFingerprint: CompiledRubric['patientStateFingerprint'];
  readonly actionHorizonId: CompiledRubric['actionHorizonId'];
  readonly actionHorizonFingerprint: CompiledRubric['actionHorizonFingerprint'];
  readonly sourceCatalogFingerprint: CompiledRubric['sourceCatalogFingerprint'];
  readonly ruleIndexFingerprint: CompiledRubric['ruleIndexFingerprint'];
  readonly includedRules: CompiledRubric['includedRules'];
  readonly coverageDiagnostics: CompiledRubric['coverageDiagnostics'];
}): unknown => ({
  schemaVersion: rubric.schemaVersion,
  compilerVersion: rubric.compilerVersion,
  policy: rubric.policyRef,
  primaryRouteRef: rubric.primaryRouteRef,
  patientStateId: rubric.patientStateId,
  patientStateFingerprint: rubric.patientStateFingerprint,
  actionHorizonId: rubric.actionHorizonId,
  actionHorizonFingerprint: rubric.actionHorizonFingerprint,
  sourceCatalogFingerprint: rubric.sourceCatalogFingerprint,
  ruleIndexFingerprint: rubric.ruleIndexFingerprint,
  includedRules: rubric.includedRules,
  coverageDiagnostics: rubric.coverageDiagnostics,
});

const exactFingerprint = (scope: string, value: unknown): DecisionCompilerFingerprint =>
  `fingerprint.decision.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

export const verifyCompiledRubricIntegrity = (value: unknown): CompiledRubricIntegrityResult => {
  const parsed = CompiledRubricSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: parsed.error.issues
          .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
          .join('; '),
      },
    };
  }
  const expectedFingerprint = exactFingerprint(
    'compiler-output',
    compilerFingerprintPayload(parsed.data),
  );
  if (parsed.data.compilerFingerprint !== expectedFingerprint) {
    return {
      ok: false,
      error: {
        code: 'FINGERPRINT_MISMATCH',
        message: `${parsed.data.id} does not match its frozen compiler payload.`,
      },
    };
  }
  return { ok: true, value: parsed.data };
};

const fail = (
  code: DecisionPolicyCompileErrorCode,
  message: string,
  contentIds: readonly string[],
): DecisionPolicyCompileResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

export const compileDecisionPolicy = (
  input: CompileDecisionPolicyInput,
): DecisionPolicyCompileResult => {
  if (input.policy.review.status !== 'approved') {
    return fail('POLICY_NOT_APPROVED', `${input.policy.id} is not approved for compilation.`, [
      input.policy.id,
    ]);
  }

  const candidatesByKey = new Map<string, DecisionRuleCandidateDefinition>();
  const candidatesByLogicalKey = new Map<string, DecisionRuleCandidateDefinition>();
  for (const candidate of input.rules) {
    const key = referenceKey(candidate.ruleRef);
    if (candidatesByKey.has(key)) {
      return fail('DUPLICATE_RULE_REFERENCE', `More than one candidate claims ${key}.`, [
        candidate.ruleRef.id,
      ]);
    }
    const logicalKey = candidate.ruleRef.id;
    const priorVersion = candidatesByLogicalKey.get(logicalKey);
    if (priorVersion) {
      return fail(
        'AMBIGUOUS_RULE_REFERENCE',
        `More than one active candidate kind, version, or owner claims ${logicalKey}.`,
        [candidate.ruleRef.id, priorVersion.ruleRef.ownerId, candidate.ruleRef.ownerId],
      );
    }
    candidatesByKey.set(key, candidate);
    candidatesByLogicalKey.set(logicalKey, candidate);
  }

  const primaryKey = referenceKey(input.policy.primaryRouteRef);
  const primary = candidatesByKey.get(primaryKey);
  if (!primary) {
    const sameId = candidatesByLogicalKey.get(input.policy.primaryRouteRef.id);
    if (sameId) {
      return fail(
        'PRIMARY_ROUTE_STALE',
        `${input.policy.id} pins ${input.policy.primaryRouteRef.id}@${input.policy.primaryRouteRef.contentVersion}; the supplied candidate is ${sameId.ruleRef.contentVersion}.`,
        [input.policy.id, input.policy.primaryRouteRef.id],
      );
    }
    return fail(
      'PRIMARY_ROUTE_MISSING',
      `${input.policy.id} references missing primary route ${input.policy.primaryRouteRef.id}.`,
      [input.policy.id, input.policy.primaryRouteRef.id],
    );
  }
  if (primary.discoveryLane !== 'primary_policy_only' || primary.ruleKind !== 'primary_route') {
    return fail(
      'PRIMARY_ROUTE_INVALID',
      `${primary.ruleRef.id} is not a primary-policy-only route.`,
      [input.policy.id, primary.ruleRef.id],
    );
  }
  if (primary.review.status !== 'approved') {
    return fail(
      'PRIMARY_ROUTE_NOT_APPROVED',
      `${primary.ruleRef.id} is not approved for compilation.`,
      [input.policy.id, primary.ruleRef.id],
    );
  }

  const regimenById = new Map(
    input.patientState.medicationRegimenEntries.map((entry) => [entry.id, entry] as const),
  );
  for (const horizonEntry of input.actionHorizon.regimenEntryOperations) {
    const patientEntry = regimenById.get(horizonEntry.regimenEntryId);
    if (!patientEntry || patientEntry.medicationIdentityId !== horizonEntry.medicationIdentityId) {
      return fail(
        'ACTION_HORIZON_INVALID',
        `${input.actionHorizon.id} contains a regimen operation for a missing or mismatched patient entry ${horizonEntry.regimenEntryId}.`,
        [input.actionHorizon.id, horizonEntry.regimenEntryId],
      );
    }
  }

  const patientFacts = collectDecisionPatientFacts(input.patientState);
  const factsByKey = new Map(patientFacts.map((fact) => [factKey(fact.key), fact] as const));
  const actionTargets = collectDecisionActionTargets(input.actionHorizon);
  const actionTargetsByKey = new Map(
    actionTargets.map((target) => [actionTargetKey(target), target] as const),
  );
  const matchCandidate = (candidate: DecisionRuleCandidateDefinition): CandidateMatch | null => {
    const patient = evaluatePatientPredicate(candidate.patientWhen, factsByKey);
    const action = evaluateActionPredicate(candidate.actionWhen, actionTargetsByKey);
    return patient.matched && action.matched ? { candidate, patient, action } : null;
  };

  const diagnostics: DecisionCoverageDiagnostic[] = [];
  const includedByKey = new Map<string, CompiledRubricRule>();
  const explicitReferenceKeys = new Set(
    input.policy.explicitSupportingRuleRefs.map((reference) => referenceKey(reference)),
  );
  const primaryMatch: CandidateMatch = {
    candidate: primary,
    patient: evaluatePatientPredicate(primary.patientWhen, factsByKey),
    action: evaluateActionPredicate(primary.actionWhen, actionTargetsByKey),
  };
  includedByKey.set(primaryKey, toCompiledRule(primaryMatch, 'primary_route'));
  if (!primaryMatch.action.matched || !primaryMatch.patient.matched) {
    diagnostics.push(
      makeDiagnostic(
        'primary_route_outside_action_horizon',
        [input.policy.id, primary.ruleRef.id, input.actionHorizon.id],
        primary.ruleRef.contentVersion,
        primary.ruleRef.contentVersion,
        'The pinned primary route remains frozen for audit, but its declared patient/action predicate is not satisfiable in this focused horizon. This does not invent a penalty or invalidate the patient.',
      ),
    );
  }

  for (const reference of input.policy.explicitSupportingRuleRefs) {
    const key = referenceKey(reference);
    const candidate = candidatesByKey.get(key);
    if (!candidate) {
      const sameId = candidatesByLogicalKey.get(reference.id);
      diagnostics.push(
        makeDiagnostic(
          sameId ? 'stale_supporting_rule' : 'missing_supporting_rule',
          [input.policy.id, reference.id],
          reference.contentVersion,
          sameId?.ruleRef.contentVersion ?? null,
          sameId
            ? `The policy pins ${reference.id}@${reference.contentVersion}, but ${sameId.ruleRef.contentVersion} was supplied. No rule or penalty was inferred.`
            : `The policy references missing supporting rule ${reference.id}. No rule or penalty was inferred.`,
        ),
      );
      continue;
    }
    if (candidate.review.status !== 'approved') {
      diagnostics.push(
        makeDiagnostic(
          'unreviewed_supporting_rule',
          [input.policy.id, candidate.ruleRef.id],
          candidate.ruleRef.contentVersion,
          candidate.ruleRef.contentVersion,
          `${candidate.ruleRef.id} is not approved, so it remains outside the compiled rubric.`,
        ),
      );
      continue;
    }
    const match = matchCandidate(candidate);
    if (match) includedByKey.set(key, toCompiledRule(match, 'explicit_support'));
  }

  const expectedIndex = buildDecisionRuleIndex(input.rules);
  const suppliedIndexEntries = input.ruleIndex
    ? copyRuleIndexEntries(input.ruleIndex.ruleKeysByActionTarget)
    : null;
  const suppliedIndexFingerprint = suppliedIndexEntries
    ? ruleIndexFingerprint(suppliedIndexEntries)
    : null;
  const index: DecisionRuleIndex = suppliedIndexEntries
    ? {
        compilerVersion: input.ruleIndex!.compilerVersion,
        fingerprint: suppliedIndexFingerprint!,
        ruleKeysByActionTarget: suppliedIndexEntries,
      }
    : expectedIndex;
  if (
    input.discoveryStrategy === 'index' &&
    ((input.ruleIndex !== undefined && input.ruleIndex.fingerprint !== suppliedIndexFingerprint) ||
      index.compilerVersion !== DECISION_POLICY_COMPILER_VERSION ||
      index.fingerprint !== expectedIndex.fingerprint)
  ) {
    return fail(
      'RULE_INDEX_STALE',
      'The supplied decision-rule index does not match the current candidate catalog.',
      [input.policy.id],
    );
  }

  const discoveryKeys =
    input.discoveryStrategy === 'index'
      ? uniqueSorted(
          actionTargets.flatMap(
            (target) => index.ruleKeysByActionTarget.get(actionTargetKey(target)) ?? [],
          ),
        )
      : [...candidatesByKey.keys()].sort();

  for (const key of discoveryKeys) {
    const candidate = candidatesByKey.get(key);
    if (!candidate || candidate.discoveryLane === 'primary_policy_only') {
      continue;
    }
    const match = matchCandidate(candidate);
    if (!match) continue;
    if (candidate.review.status !== 'approved') {
      if (!explicitReferenceKeys.has(key)) {
        diagnostics.push(
          makeDiagnostic(
            'unreviewed_supporting_rule',
            [input.policy.id, candidate.ruleRef.id],
            candidate.ruleRef.contentVersion,
            candidate.ruleRef.contentVersion,
            `${candidate.ruleRef.id} matches the frozen patient and action horizon but is not approved, so it remains outside the compiled rubric.`,
          ),
        );
      }
      continue;
    }
    if (includedByKey.has(key)) continue;
    includedByKey.set(key, toCompiledRule(match, inclusionReason(candidate)));
  }

  const includedRules = [...includedByKey.entries()]
    .sort(([leftKey, left], [rightKey, right]) => {
      const leftPrimary = left.inclusionReason === 'primary_route' ? 0 : 1;
      const rightPrimary = right.inclusionReason === 'primary_route' ? 0 : 1;
      return leftPrimary - rightPrimary || compareStrings(leftKey, rightKey);
    })
    .map(([, rule]) => rule);
  const sortedDiagnostics = [
    ...new Map(
      diagnostics
        .sort((left, right) => compareStrings(left.id, right.id))
        .map((diagnostic) => [diagnostic.id, diagnostic] as const),
    ).values(),
  ];

  const patientStateFingerprint = fingerprint('patient-state', input.patientState);
  const actionHorizonFingerprint = fingerprint('action-horizon', input.actionHorizon);
  const sourceCatalogFingerprint = fingerprint('source-catalog', {
    policy: input.policy,
    rules: input.rules,
  });
  const policyRef = { id: input.policy.id, contentVersion: input.policy.contentVersion };
  const compilerFingerprint = exactFingerprint('compiler-output', {
    schemaVersion: 1,
    compilerVersion: DECISION_POLICY_COMPILER_VERSION,
    policy: policyRef,
    primaryRouteRef: input.policy.primaryRouteRef,
    patientStateId: input.patientState.id,
    patientStateFingerprint,
    actionHorizonId: input.actionHorizon.id,
    actionHorizonFingerprint,
    sourceCatalogFingerprint,
    ruleIndexFingerprint: expectedIndex.fingerprint,
    includedRules,
    coverageDiagnostics: sortedDiagnostics,
  });

  const verified = verifyCompiledRubricIntegrity({
    schemaVersion: 1,
    compilerVersion: DECISION_POLICY_COMPILER_VERSION,
    id: `compiled-rubric.${compilerFingerprint.slice(-16)}`,
    policyRef,
    primaryRouteRef: { ...input.policy.primaryRouteRef },
    patientStateId: input.patientState.id,
    patientStateFingerprint,
    actionHorizonId: input.actionHorizon.id,
    actionHorizonFingerprint,
    sourceCatalogFingerprint,
    ruleIndexFingerprint: expectedIndex.fingerprint,
    compilerFingerprint,
    includedRules,
    coverageDiagnostics: sortedDiagnostics,
  });
  if (!verified.ok) {
    return fail(
      'COMPILED_RUBRIC_INVALID',
      `The compiler produced an invalid frozen rubric: ${verified.error.message}`,
      [input.policy.id],
    );
  }
  return {
    ok: true,
    value: verified.value,
  };
};
