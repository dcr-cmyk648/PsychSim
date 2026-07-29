import {
  CompiledRubricSchema,
  DecisionPatientFactKeySchema,
  DecisionPatientPredicateSchema,
  DecisionPolicyCatalogSchema,
  DecisionPolicyDefinitionSchema,
  DecisionRuleCandidateDefinitionSchema,
  type DecisionActionHorizon,
  type ClinicalRuleReview,
  type DecisionPatientFactKey,
  type DecisionPolicyDefinition,
  type DecisionRuleCandidateDefinition,
  type DecisionRuleReference,
  type PrimaryDecisionRouteReference,
  type ResolvedPatientState,
  type SupportingDecisionRuleReference,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  buildDecisionRuleIndex,
  collectDecisionPatientFacts,
  compileDecisionPolicy,
  verifyCompiledRubricIntegrity,
} from './decision-policy';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-28T12:00:00.000Z',
  sourceUseNoteIds: [],
};

const authoredResolution = {
  origin: 'authored',
  ownerId: 'patient-template.test',
  ownerContentVersion: '1.0.0',
} as const;

const makePatientState = (): ResolvedPatientState => ({
  schemaVersion: 1,
  id: 'resolved-patient-state.test.decision-policy',
  demographics: {
    recordVersion: 2,
    ageYears: 45,
    reviewedAgeBandId: 'age-band.middle-adult',
    sexForReference: 'female',
  },
  conditionStates: [
    {
      schemaVersion: 1,
      id: 'condition-state.test.mdd',
      diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current-episode',
      timeScopeId: 'time-scope.current',
      encounterRelevance: 'focus',
      severityId: 'diagnosis-severity.mdd.moderate',
      specifierIds: [],
      origin: 'authored',
      resolution: authoredResolution,
    },
    {
      schemaVersion: 1,
      id: 'condition-state.test.gad',
      diagnosisDefinitionId: 'diagnosis.generalized-anxiety-disorder',
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      encounterRelevance: 'background',
      severityId: null,
      specifierIds: [],
      origin: 'generated_optional',
      resolution: authoredResolution,
    },
  ],
  diagnosisRecordEntries: [
    {
      schemaVersion: 1,
      id: 'diagnosis-record.test.bipolar-question',
      mappedDiagnosisDefinitionId: 'diagnosis.bipolar-spectrum-disorder',
      mappedDiagnosisDefinitionContentVersion: '1.0.0',
      recordedLabel: 'Question of bipolar disorder',
      assertion: 'questioned',
      source: {
        kind: 'record_review',
        sourceInstanceId: 'source-instance.test.problem-list',
      },
      timeScopeId: 'time-scope.historical',
      resolution: authoredResolution,
    },
  ],
  medicationRegimenEntries: [],
  exposureInventory: {
    schemaVersion: 1,
    id: 'resolved-exposure-inventory.test',
    useEntries: [],
  },
  treatmentHistory: {
    medicationTrials: [],
    psychotherapyTrials: [],
    currentProviders: [],
    priorLevelsOfCare: [],
  },
  medicationTolerabilityFindings: [],
  reactionHistory: {
    status: 'entries_present',
    medicationAssessmentStatus: 'entries_present',
    records: [
      {
        schemaVersion: 1,
        id: 'reaction-record.test.bupropion',
        trigger: { kind: 'medication', medicationId: 'medication.bupropion' },
        recordedAs: 'adverse_reaction',
        manifestationIds: ['reaction-manifestation.test.activation'],
        reportedSeverity: 'moderate',
        interpretedAs: null,
        source: 'patient_report',
        status: 'historical',
      },
    ],
  },
  canonicalFindings: [
    {
      schemaVersion: 1,
      id: 'resolved-finding.test.low-energy',
      definitionId: 'finding.history.current-self-reported-fatigue-low-energy',
      definitionContentVersion: '1.0.0',
      value: { kind: 'outcome', value: 'present' },
      resolution: {
        resolverVersion: '1.0.0',
        origin: 'authored',
        uncertainty: 'none',
        appliedContributionIds: ['finding-contribution.test.low-energy'],
      },
      contributions: [
        {
          schemaVersion: 1,
          id: 'finding-contribution.test.low-energy',
          ownerKind: 'patient_state',
          ownerId: 'resolved-patient-state.test.decision-policy',
          ownerContentVersion: null,
          role: 'authored_value',
          provenanceIds: [],
        },
      ],
    },
  ],
  measurements: [],
  categoricalObservations: [],
  structuredTestResults: [],
  clinicalContexts: [],
  clinicalDurations: [],
  subjectiveBurdenRecords: [],
  propositionState: {
    schemaVersion: 1,
    id: 'resolved-proposition-state.test',
    propositions: [],
    evidence: [],
    dependencyGroups: [],
    beliefAppraisals: [],
  },
  clinicalTagIds: ['clinical-tag.must-not-drive-decision-policy'],
  reportedSafetyPlanningAbility: 'unassessed',
});

const mddFact: DecisionPatientFactKey = {
  recordKind: 'condition',
  identityId: 'diagnosis.major-depressive-disorder',
  identityContentVersion: '1.0.0',
  attributeId: 'condition.presence',
  valueId: 'state.present',
};

const bipolarInternalFact: DecisionPatientFactKey = {
  recordKind: 'condition',
  identityId: 'diagnosis.bipolar-spectrum-disorder',
  identityContentVersion: '1.0.0',
  attributeId: 'condition.presence',
  valueId: 'state.present',
};

const lowEnergyFact: DecisionPatientFactKey = {
  recordKind: 'canonical_finding',
  identityId: 'finding.history.current-self-reported-fatigue-low-energy',
  identityContentVersion: '1.0.0',
  attributeId: 'finding.outcome',
  valueId: 'finding-outcome.present',
};

const lowEnergyAbsentFact: DecisionPatientFactKey = {
  ...lowEnergyFact,
  valueId: 'finding-outcome.absent',
};

const bupropionReactionFact: DecisionPatientFactKey = {
  recordKind: 'reaction',
  identityId: 'medication.bupropion',
  identityContentVersion: null,
  attributeId: 'reaction.presence',
  valueId: 'state.present',
};

const sertralineAdequateTrialFact: DecisionPatientFactKey = {
  recordKind: 'medication_trial',
  identityId: 'medication.sertraline',
  identityContentVersion: null,
  attributeId: 'medication-trial.adequacy',
  valueId: 'trial-adequacy.adequate',
};

const sertralineNoResponseFact: DecisionPatientFactKey = {
  recordKind: 'medication_trial',
  identityId: 'medication.sertraline',
  identityContentVersion: null,
  attributeId: 'medication-trial.response',
  valueId: 'trial-response.none',
};

const ruleReference = (
  id: string,
  kind: DecisionRuleReference['kind'] = 'medication_regimen_contributor',
): DecisionRuleReference => ({
  kind,
  id,
  contentVersion: '1.0.0',
  ownerId: id.startsWith('route.')
    ? 'diagnosis.major-depressive-disorder'
    : 'owner.test.decision-policy',
  ownerContentVersion: '1.0.0',
});

const primaryReference: PrimaryDecisionRouteReference = {
  ...ruleReference('route.test.mdd.focused-treatment', 'medication_regimen_route'),
  kind: 'medication_regimen_route',
};

const makeCandidate = (
  id: string,
  overrides: Partial<DecisionRuleCandidateDefinition> = {},
): DecisionRuleCandidateDefinition => ({
  schemaVersion: 1,
  ruleRef: ruleReference(id),
  label: id,
  ruleKind: 'fit',
  discoveryLane: 'full_state_modifier',
  patientWhen: { type: 'fact', fact: lowEnergyFact },
  actionWhen: {
    match: 'any',
    targets: [{ kind: 'medication_start', medicationIdentityId: 'medication.bupropion' }],
  },
  stance: 'preferred',
  concernLevel: 'minor',
  certaintyLevel: 'moderate',
  effectId: `effect.${id}`,
  issueId: null,
  specificityPriority: 10,
  rationale: 'Synthetic point-free test relationship.',
  balanceRef: null,
  developerOpinionIds: ['developer-opinion.test'],
  review: approvedReview,
  ...overrides,
});

const primaryCandidate = (): DecisionRuleCandidateDefinition =>
  makeCandidate(primaryReference.id, {
    ruleRef: primaryReference,
    ruleKind: 'primary_route',
    discoveryLane: 'primary_policy_only',
    patientWhen: { type: 'fact', fact: mddFact },
    actionWhen: {
      match: 'any',
      targets: [
        { kind: 'medication_start', medicationIdentityId: 'medication.bupropion' },
        { kind: 'medication_start', medicationIdentityId: 'medication.sertraline' },
      ],
    },
    stance: 'acceptable',
    concernLevel: 'major',
    effectId: 'effect.test.primary-mdd-route',
    specificityPriority: 100,
  });

const backgroundRoute = (): DecisionRuleCandidateDefinition =>
  makeCandidate('route.test.gad.primary', {
    ruleRef: ruleReference('route.test.gad.primary', 'medication_regimen_route'),
    ruleKind: 'primary_route',
    discoveryLane: 'primary_policy_only',
    patientWhen: {
      type: 'fact',
      fact: {
        ...mddFact,
        identityId: 'diagnosis.generalized-anxiety-disorder',
      },
    },
    actionWhen: {
      match: 'any',
      targets: [{ kind: 'intervention', interventionId: 'intervention.psychotherapy.cbt' }],
    },
    effectId: 'effect.test.background-gad-route',
  });

const makePolicy = (
  overrides: Partial<DecisionPolicyDefinition> = {},
): DecisionPolicyDefinition => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'decision-policy.test.mdd-focused',
  label: 'Synthetic focused decision policy',
  focusedDecisionId: 'decision.test.immediate-treatment',
  primaryRouteRef: primaryReference,
  explicitSupportingRuleRefs: [],
  developerOpinionIds: ['developer-opinion.test'],
  review: approvedReview,
  ...overrides,
});

const makeHorizon = (overrides: Partial<DecisionActionHorizon> = {}): DecisionActionHorizon => ({
  schemaVersion: 1,
  id: 'decision-action-horizon.test',
  informationActionIds: ['info.history.medication-reconciliation'],
  startMedicationIds: ['medication.bupropion', 'medication.sertraline'],
  regimenEntryOperations: [],
  interventionIds: ['intervention.psychotherapy.cbt'],
  dispositionIds: ['disposition.outpatient'],
  ...overrides,
});

const makeRules = (): DecisionRuleCandidateDefinition[] => [
  primaryCandidate(),
  backgroundRoute(),
  makeCandidate('rule.test.low-energy-bupropion-fit'),
  makeCandidate('rule.test.bupropion-reaction-safety', {
    ruleKind: 'reaction',
    discoveryLane: 'automatic_guardrail',
    patientWhen: { type: 'fact', fact: bupropionReactionFact },
    stance: 'discouraged',
    concernLevel: 'major',
    effectId: null,
    issueId: 'issue.test.bupropion-reaction',
  }),
  makeCandidate('rule.test.medication-reconciliation-prerequisite', {
    ruleKind: 'prerequisite',
    discoveryLane: 'automatic_guardrail',
    patientWhen: null,
    actionWhen: {
      match: 'any',
      targets: [{ kind: 'any_medication_start' }],
    },
    stance: 'required',
    concernLevel: 'major',
    effectId: null,
    issueId: 'issue.test.medication-reconciliation',
  }),
  makeCandidate('rule.test.chart-does-not-equal-condition', {
    patientWhen: { type: 'fact', fact: bipolarInternalFact },
    actionWhen: {
      match: 'any',
      targets: [{ kind: 'medication_start', medicationIdentityId: 'medication.sertraline' }],
    },
    effectId: 'effect.test.internal-bipolar-only',
  }),
];

describe('point-free decision-policy compiler', () => {
  it('keeps policy, candidate, and compiled artifacts point-free and singularly routed', () => {
    const policy = makePolicy();
    expect(DecisionPolicyDefinitionSchema.safeParse(policy).success).toBe(true);
    expect(DecisionPolicyDefinitionSchema.safeParse({ ...policy, points: 200 }).success).toBe(
      false,
    );
    expect(
      DecisionPolicyDefinitionSchema.safeParse({
        ...policy,
        primaryRouteRef: undefined,
        primaryRouteRefs: [primaryReference, primaryReference],
      }).success,
    ).toBe(false);

    const candidate = makeCandidate('rule.test.point-free');
    expect(DecisionRuleCandidateDefinitionSchema.safeParse(candidate).success).toBe(true);
    expect(
      DecisionRuleCandidateDefinitionSchema.safeParse({
        ...candidate,
        patientWhen: { type: 'not', predicate: { type: 'fact', fact: lowEnergyFact } },
      }).success,
    ).toBe(false);
    expect(
      DecisionRuleCandidateDefinitionSchema.safeParse({
        ...candidate,
        ruleKind: 'primary_route',
      }).success,
    ).toBe(false);
    expect(
      DecisionRuleCandidateDefinitionSchema.safeParse({
        ...candidate,
        discoveryLane: 'automatic_guardrail',
      }).success,
    ).toBe(false);
    expect(
      DecisionPolicyDefinitionSchema.safeParse({
        ...policy,
        explicitSupportingRuleRefs: [primaryReference],
      }).success,
    ).toBe(false);
    expect(
      DecisionPolicyDefinitionSchema.safeParse({
        ...policy,
        primaryRouteRef: { ...primaryReference, kind: 'diagnosis_route' },
      }).success,
    ).toBe(false);
    expect(
      DecisionPolicyDefinitionSchema.safeParse({
        ...policy,
        explicitSupportingRuleRefs: [
          { ...ruleReference('rule.test.future-intervention'), kind: 'intervention_rule' },
        ],
      }).success,
    ).toBe(false);
    expect(
      DecisionPolicyCatalogSchema.safeParse({
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'registry.catalog.test-decision-policies',
        policies: [policy],
        sourceUseNotes: [
          {
            id: 'source-use.test.unknown-policy-target',
            authority: 'formal_publication',
            evidenceSourceIds: ['evidence.test'],
            sourceDocumentId: null,
            sourceChunkIds: [],
            targetContentIds: ['decision-policy.test.missing'],
            contributionTypes: ['treatment'],
            contribution: 'Synthetic source-use note for strict schema validation.',
            generatedBy: 'human',
            medicalReviewStatus: 'unreviewed',
          },
        ],
      }).success,
    ).toBe(false);
    const sourcedPolicy = {
      ...policy,
      developerOpinionIds: [],
      review: {
        ...approvedReview,
        sourceUseNoteIds: ['source-use.test.policy'],
      },
    };
    const policySourceUse = {
      id: 'source-use.test.policy',
      authority: 'formal_publication' as const,
      evidenceSourceIds: ['evidence.test'],
      sourceDocumentId: null,
      sourceChunkIds: [],
      targetContentIds: [policy.id],
      contributionTypes: ['treatment' as const],
      contribution: 'Synthetic source-use note for strict review-state validation.',
      generatedBy: 'human' as const,
      medicalReviewStatus: 'unreviewed' as const,
    };
    expect(
      DecisionPolicyCatalogSchema.safeParse({
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'registry.catalog.test-decision-policies',
        policies: [sourcedPolicy],
        sourceUseNotes: [policySourceUse],
      }).success,
    ).toBe(false);
    expect(
      DecisionPolicyCatalogSchema.safeParse({
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'registry.catalog.test-decision-policies',
        policies: [sourcedPolicy],
        sourceUseNotes: [{ ...policySourceUse, medicalReviewStatus: 'approved' }],
      }).success,
    ).toBe(true);
    for (const forbidden of [
      { points: 10 },
      { grade: 'optimal' },
      { par: 100 },
      { scoreCap: 50 },
      { payout: 400 },
    ]) {
      expect(
        DecisionRuleCandidateDefinitionSchema.safeParse({ ...candidate, ...forbidden }).success,
      ).toBe(false);
    }

    const compiled = compileDecisionPolicy({
      policy,
      patientState: makePatientState(),
      actionHorizon: makeHorizon(),
      rules: makeRules(),
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(CompiledRubricSchema.safeParse({ ...compiled.value, points: 200 }).success).toBe(false);
  });

  it('discovers hidden full-state fit and guardrails without policy links', () => {
    const compiled = compileDecisionPolicy({
      policy: makePolicy(),
      patientState: makePatientState(),
      actionHorizon: makeHorizon(),
      rules: makeRules(),
      discoveryStrategy: 'scan',
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;

    const rules = new Map(compiled.value.includedRules.map((rule) => [rule.ruleRef.id, rule]));
    expect([...rules.keys()]).toEqual([
      primaryReference.id,
      'rule.test.bupropion-reaction-safety',
      'rule.test.low-energy-bupropion-fit',
      'rule.test.medication-reconciliation-prerequisite',
    ]);
    expect(rules.get('rule.test.low-energy-bupropion-fit')).toMatchObject({
      inclusionReason: 'discovered_full_state_modifier',
      patientWhen: { type: 'fact', fact: lowEnergyFact },
      matchedPatientFactBindings: [
        {
          fact: lowEnergyFact,
          recordIds: ['resolved-finding.test.low-energy'],
        },
      ],
      matchedActionTargets: [
        { kind: 'medication_start', medicationIdentityId: 'medication.bupropion' },
      ],
    });
    expect(rules.has('route.test.gad.primary')).toBe(false);
    expect(rules.has('rule.test.chart-does-not-equal-condition')).toBe(false);
  });

  it('preserves an explicit supporting-rule inclusion reason during automatic discovery', () => {
    const fitRule = makeRules().find(
      (candidate) => candidate.ruleRef.id === 'rule.test.low-energy-bupropion-fit',
    );
    expect(fitRule).toBeDefined();
    if (!fitRule) return;
    const compiled = compileDecisionPolicy({
      policy: makePolicy({
        explicitSupportingRuleRefs: [fitRule.ruleRef as SupportingDecisionRuleReference],
      }),
      patientState: makePatientState(),
      actionHorizon: makeHorizon(),
      rules: makeRules(),
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(
      compiled.value.includedRules.find((rule) => rule.ruleRef.id === fitRule.ruleRef.id)
        ?.inclusionReason,
    ).toBe('explicit_support');
  });

  it('treats a reverse index as an optimization with scan-identical output', () => {
    const rules = makeRules();
    const input = {
      policy: makePolicy(),
      patientState: makePatientState(),
      actionHorizon: makeHorizon(),
      rules,
    };
    const scan = compileDecisionPolicy({ ...input, discoveryStrategy: 'scan' });
    const indexed = compileDecisionPolicy({
      ...input,
      discoveryStrategy: 'index',
      ruleIndex: buildDecisionRuleIndex([...rules].reverse()),
    });
    expect(scan).toEqual(indexed);
  });

  it('rejects a forged or mutated reverse index even when it claims the expected fingerprint', () => {
    const rules = makeRules();
    const expected = buildDecisionRuleIndex(rules);
    const forged = {
      ...expected,
      ruleKeysByActionTarget: new Map<string, readonly string[]>(),
    };
    const compiled = compileDecisionPolicy({
      policy: makePolicy(),
      patientState: makePatientState(),
      actionHorizon: makeHorizon(),
      rules,
      discoveryStrategy: 'index',
      ruleIndex: forged,
    });
    expect(compiled).toMatchObject({
      ok: false,
      error: { code: 'RULE_INDEX_STALE' },
    });
  });

  it('freezes patient and action activation logic rather than flattening any/all semantics', () => {
    const anyRule = makeCandidate('rule.test.action-any', {
      patientWhen: {
        type: 'any',
        predicates: [
          { type: 'fact', fact: lowEnergyFact },
          { type: 'fact', fact: lowEnergyAbsentFact },
        ],
      },
      actionWhen: {
        match: 'any',
        targets: [
          { kind: 'medication_start', medicationIdentityId: 'medication.bupropion' },
          { kind: 'medication_start', medicationIdentityId: 'medication.sertraline' },
        ],
      },
    });
    const combinationRule = makeCandidate('rule.test.action-all', {
      actionWhen: {
        match: 'all',
        targets: [
          { kind: 'medication_start', medicationIdentityId: 'medication.bupropion' },
          { kind: 'medication_start', medicationIdentityId: 'medication.sertraline' },
        ],
      },
    });
    const compiled = compileDecisionPolicy({
      policy: makePolicy(),
      patientState: makePatientState(),
      actionHorizon: makeHorizon(),
      rules: [...makeRules(), anyRule, combinationRule],
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    const byId = new Map(compiled.value.includedRules.map((rule) => [rule.ruleRef.id, rule]));
    const frozenPatientPredicate = byId.get(anyRule.ruleRef.id)?.patientWhen;
    expect(frozenPatientPredicate?.type).toBe('any');
    if (frozenPatientPredicate?.type === 'any' && anyRule.patientWhen?.type === 'any') {
      expect(
        new Set(frozenPatientPredicate.predicates.map((predicate) => JSON.stringify(predicate))),
      ).toEqual(
        new Set(anyRule.patientWhen.predicates.map((predicate) => JSON.stringify(predicate))),
      );
    }
    expect(byId.get(anyRule.ruleRef.id)?.actionWhen).toMatchObject({ match: 'any' });
    expect(byId.get(combinationRule.ruleRef.id)?.actionWhen).toMatchObject({ match: 'all' });
    expect(byId.get(anyRule.ruleRef.id)?.actionWhen).not.toEqual(
      byId.get(combinationRule.ruleRef.id)?.actionWhen,
    );
  });

  it('requires explicit same-record binding for correlated repeated trial facts', () => {
    const correlatedRule = makeCandidate('rule.test.same-trial-adequate-nonresponse', {
      patientWhen: {
        type: 'same_record_all',
        facts: [sertralineAdequateTrialFact, sertralineNoResponseFact],
      },
    });
    const trial = (
      id: string,
      adequacy: 'adequate' | 'inadequate',
      response: 'remission' | 'none',
    ): ResolvedPatientState['treatmentHistory']['medicationTrials'][number] => ({
      schemaVersion: 1,
      id,
      medicationId: 'medication.sertraline',
      adequacy,
      adherence: 'consistent',
      response,
      tolerability: 'tolerated',
      source: 'patient_report',
      summary: 'Synthetic prior medication trial.',
    });
    const withTrials = (
      medicationTrials: ResolvedPatientState['treatmentHistory']['medicationTrials'],
    ): ResolvedPatientState => {
      const state = makePatientState();
      return {
        ...state,
        treatmentHistory: {
          ...state.treatmentHistory,
          medicationTrials,
        },
      };
    };
    const compile = (patientState: ResolvedPatientState) =>
      compileDecisionPolicy({
        policy: makePolicy(),
        patientState,
        actionHorizon: makeHorizon(),
        rules: [...makeRules(), correlatedRule],
      });

    const splitRecords = compile(
      withTrials([
        trial('medication-trial.test.sertraline-a', 'adequate', 'remission'),
        trial('medication-trial.test.sertraline-b', 'inadequate', 'none'),
      ]),
    );
    const oneRecord = compile(
      withTrials([trial('medication-trial.test.sertraline-c', 'adequate', 'none')]),
    );
    expect(splitRecords.ok).toBe(true);
    expect(oneRecord.ok).toBe(true);
    if (!splitRecords.ok || !oneRecord.ok) return;
    expect(
      splitRecords.value.includedRules.some(
        (rule) => rule.ruleRef.id === correlatedRule.ruleRef.id,
      ),
    ).toBe(false);
    const included = oneRecord.value.includedRules.find(
      (rule) => rule.ruleRef.id === correlatedRule.ruleRef.id,
    );
    expect(included?.matchedPatientFactBindings).toEqual([
      {
        fact: sertralineAdequateTrialFact,
        recordIds: ['medication-trial.test.sertraline-c'],
      },
      {
        fact: sertralineNoResponseFact,
        recordIds: ['medication-trial.test.sertraline-c'],
      },
    ]);
  });

  it('rejects duplicate or cross-kind same-record predicates and never joins separate contexts', () => {
    expect(
      DecisionPatientPredicateSchema.safeParse({
        type: 'same_record_all',
        facts: [sertralineAdequateTrialFact, sertralineAdequateTrialFact],
      }).success,
    ).toBe(false);
    expect(
      DecisionPatientPredicateSchema.safeParse({
        type: 'same_record_all',
        facts: [
          mddFact,
          {
            recordKind: 'reaction_history',
            identityId: 'patient.reaction-history',
            identityContentVersion: null,
            attributeId: 'reaction-history.status',
            valueId: 'reaction-history-status.entries_present',
          },
        ],
      }).success,
    ).toBe(false);

    const contextOneFact: DecisionPatientFactKey = {
      recordKind: 'clinical_context',
      identityId: 'context-dimension.test.one',
      identityContentVersion: null,
      attributeId: 'clinical-context.option',
      valueId: 'context-option.test.one',
    };
    const contextTwoFact: DecisionPatientFactKey = {
      recordKind: 'clinical_context',
      identityId: 'context-dimension.test.two',
      identityContentVersion: null,
      attributeId: 'clinical-context.option',
      valueId: 'context-option.test.two',
    };
    const patientState: ResolvedPatientState = {
      ...makePatientState(),
      clinicalContexts: [
        {
          dimensionId: contextOneFact.identityId,
          optionId: contextOneFact.valueId,
          addedClinicalTagIds: [],
          findingBindings: [],
        },
        {
          dimensionId: contextTwoFact.identityId,
          optionId: contextTwoFact.valueId,
          addedClinicalTagIds: [],
          findingBindings: [],
        },
      ],
    };
    const crossContextRule = makeCandidate('rule.test.cross-context-false-join', {
      patientWhen: {
        type: 'same_record_all',
        facts: [contextOneFact, contextTwoFact],
      },
    });
    const compiled = compileDecisionPolicy({
      policy: makePolicy(),
      patientState,
      actionHorizon: makeHorizon(),
      rules: [...makeRules(), crossContextRule],
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(
      compiled.value.includedRules.some((rule) => rule.ruleRef.id === crossContextRule.ruleRef.id),
    ).toBe(false);
  });

  it('requires tolerability-linked regimen operations to bind the exact duplicate entry', () => {
    const tolerabilityDomainFact: DecisionPatientFactKey = {
      recordKind: 'medication_tolerability',
      identityId: 'medication.bupropion',
      identityContentVersion: null,
      attributeId: 'medication-tolerability.domain',
      valueId: 'tolerability-domain.activation',
    };
    const subjectEntryFact: DecisionPatientFactKey = {
      recordKind: 'medication_tolerability',
      identityId: 'medication.bupropion',
      identityContentVersion: null,
      attributeId: 'medication-tolerability.subject-regimen-entry',
      valueId: 'regimen-entry.test.bupropion-a',
    };
    const exactRule = makeCandidate('rule.test.exact-tolerability-subject', {
      patientWhen: {
        type: 'same_record_all',
        facts: [tolerabilityDomainFact, subjectEntryFact],
      },
      actionWhen: {
        match: 'any',
        targets: [
          {
            kind: 'regimen_entry_operation',
            regimenEntryId: subjectEntryFact.valueId,
            operation: 'stop',
          },
        ],
      },
    });
    expect(DecisionRuleCandidateDefinitionSchema.safeParse(exactRule).success).toBe(true);
    expect(
      DecisionRuleCandidateDefinitionSchema.safeParse({
        ...exactRule,
        actionWhen: {
          match: 'any',
          targets: [
            {
              kind: 'regimen_medication_operation',
              medicationIdentityId: 'medication.bupropion',
              operation: 'stop',
            },
          ],
        },
      }).success,
    ).toBe(false);
    expect(
      DecisionRuleCandidateDefinitionSchema.safeParse({
        ...exactRule,
        actionWhen: {
          match: 'any',
          targets: [
            {
              kind: 'regimen_entry_operation',
              regimenEntryId: 'regimen-entry.test.bupropion-b',
              operation: 'stop',
            },
          ],
        },
      }).success,
    ).toBe(false);

    const duplicateRegimenEntry = (id: string) => ({
      recordVersion: 2 as const,
      id,
      medicationIdentityId: 'medication.bupropion',
      clinicalRole: 'psychiatric' as const,
      status: 'active' as const,
      adherence: 'consistent' as const,
      prescribedForDiagnosisId: 'diagnosis.major-depressive-disorder',
      source: 'prescriber_record' as const,
      knownAtOpening: true,
      impactClassification: 'fit_relevant' as const,
    });
    const patientState: ResolvedPatientState = {
      ...makePatientState(),
      medicationRegimenEntries: [
        duplicateRegimenEntry(subjectEntryFact.valueId),
        duplicateRegimenEntry('regimen-entry.test.bupropion-b'),
      ],
      medicationTolerabilityFindings: [
        {
          recordVersion: 2,
          id: 'tolerability-finding.test.bupropion-a-activation',
          subject: {
            kind: 'current_regimen_entry',
            regimenEntryId: subjectEntryFact.valueId,
          },
          domain: 'activation',
          findingStatus: 'present',
          manifestationIds: ['reaction-manifestation.test.activation'],
          source: 'patient_report',
          sourceRateProfileId: null,
        },
      ],
    };
    const compiled = compileDecisionPolicy({
      policy: makePolicy(),
      patientState,
      actionHorizon: makeHorizon({
        regimenEntryOperations: patientState.medicationRegimenEntries.map((entry) => ({
          regimenEntryId: entry.id,
          medicationIdentityId: entry.medicationIdentityId,
          operations: ['stop'],
        })),
      }),
      rules: [...makeRules(), exactRule],
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    const included = compiled.value.includedRules.find(
      (rule) => rule.ruleRef.id === exactRule.ruleRef.id,
    );
    expect(included?.matchedActionTargets).toEqual([
      {
        kind: 'regimen_entry_operation',
        regimenEntryId: subjectEntryFact.valueId,
        operation: 'stop',
      },
    ]);
    expect(
      included?.matchedPatientFactBindings.every((binding) =>
        binding.recordIds.includes('tolerability-finding.test.bupropion-a-activation'),
      ),
    ).toBe(true);
  });

  it('rejects multiple active versions of one logical rule independent of input order', () => {
    const original = makeCandidate('rule.test.ambiguous-version');
    const newer = {
      ...original,
      ruleRef: {
        ...original.ruleRef,
        contentVersion: '2.0.0',
      },
    };
    const compile = (rules: DecisionRuleCandidateDefinition[]) =>
      compileDecisionPolicy({
        policy: makePolicy(),
        patientState: makePatientState(),
        actionHorizon: makeHorizon(),
        rules,
      });
    const forward = compile([...makeRules(), original, newer]);
    const reverse = compile([...makeRules(), newer, original]);
    expect(forward).toMatchObject({
      ok: false,
      error: { code: 'AMBIGUOUS_RULE_REFERENCE' },
    });
    expect(reverse).toEqual(forward);
  });

  it('is independent of patient-record, rule, and action order', () => {
    const state = makePatientState();
    const altered = {
      ...state,
      conditionStates: [...state.conditionStates].reverse(),
    };
    const baseline = compileDecisionPolicy({
      policy: makePolicy(),
      patientState: state,
      actionHorizon: makeHorizon(),
      rules: makeRules(),
    });
    const reordered = compileDecisionPolicy({
      policy: makePolicy(),
      patientState: altered,
      actionHorizon: makeHorizon({
        startMedicationIds: ['medication.sertraline', 'medication.bupropion'],
      }),
      rules: [...makeRules()].reverse(),
    });
    expect(baseline).toEqual(reordered);
  });

  it('normalizes unordered rule fields before assigning one full-width durable fingerprint', () => {
    const ordered = makeCandidate('rule.test.normalized-unordered-fields', {
      patientWhen: {
        type: 'any',
        predicates: [
          { type: 'fact', fact: mddFact },
          { type: 'fact', fact: lowEnergyFact },
        ],
      },
      actionWhen: {
        match: 'all',
        targets: [
          { kind: 'medication_start', medicationIdentityId: 'medication.bupropion' },
          { kind: 'medication_start', medicationIdentityId: 'medication.sertraline' },
        ],
      },
      review: {
        ...approvedReview,
        sourceUseNoteIds: ['source-use.test.beta', 'source-use.test.alpha'],
      },
    });
    const reversed = {
      ...ordered,
      patientWhen: {
        type: 'any' as const,
        predicates: [
          ...(
            ordered.patientWhen as Extract<
              NonNullable<DecisionRuleCandidateDefinition['patientWhen']>,
              { type: 'any' }
            >
          ).predicates,
        ].reverse(),
      },
      actionWhen: {
        match: 'all' as const,
        targets: [...ordered.actionWhen!.targets].reverse(),
      },
      review: {
        ...ordered.review,
        sourceUseNoteIds: [...ordered.review.sourceUseNoteIds].reverse(),
      },
    };
    const compile = (candidate: DecisionRuleCandidateDefinition) =>
      compileDecisionPolicy({
        policy: makePolicy(),
        patientState: makePatientState(),
        actionHorizon: makeHorizon(),
        rules: [...makeRules(), candidate],
      });
    const first = compile(ordered);
    const second = compile(reversed);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.value).toEqual(second.value);
    expect(first.value.id).toMatch(/^compiled-rubric\.[a-f0-9]{16}$/);
    expect(first.value.id.endsWith(first.value.compilerFingerprint.slice(-16))).toBe(true);
  });

  it('never lets labels or free tags create or remove a rule match', () => {
    const state = makePatientState();
    const altered = {
      ...state,
      diagnosisRecordEntries: state.diagnosisRecordEntries.map((entry) => ({
        ...entry,
        recordedLabel: 'Completely different surface wording',
      })),
      clinicalTagIds: ['clinical-tag.unrelated-label-derived-value'],
    };
    const baseline = compileDecisionPolicy({
      policy: makePolicy(),
      patientState: state,
      actionHorizon: makeHorizon(),
      rules: makeRules(),
    });
    const changedSurface = compileDecisionPolicy({
      policy: makePolicy(),
      patientState: altered,
      actionHorizon: makeHorizon(),
      rules: makeRules(),
    });
    expect(baseline.ok).toBe(true);
    expect(changedSurface.ok).toBe(true);
    if (!baseline.ok || !changedSurface.ok) return;
    expect(baseline.value.includedRules.map((rule) => rule.ruleRef.id)).toEqual(
      changedSurface.value.includedRules.map((rule) => rule.ruleRef.id),
    );
  });

  it('does not discover a treatment-specific rule when that treatment is unavailable', () => {
    const compiled = compileDecisionPolicy({
      policy: makePolicy(),
      patientState: makePatientState(),
      actionHorizon: makeHorizon({ startMedicationIds: ['medication.sertraline'] }),
      rules: makeRules(),
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    const ids = compiled.value.includedRules.map((rule) => rule.ruleRef.id);
    expect(ids).not.toContain('rule.test.low-energy-bupropion-fit');
    expect(ids).not.toContain('rule.test.bupropion-reaction-safety');
    expect(ids).toContain('rule.test.medication-reconciliation-prerequisite');
  });

  it('emits nonblocking support diagnostics without inventing a rule or penalty', () => {
    const missing = ruleReference('rule.test.missing-support') as SupportingDecisionRuleReference;
    const compiled = compileDecisionPolicy({
      policy: makePolicy({ explicitSupportingRuleRefs: [missing] }),
      patientState: makePatientState(),
      actionHorizon: makeHorizon(),
      rules: makeRules(),
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(compiled.value.coverageDiagnostics).toEqual([
      expect.objectContaining({
        code: 'missing_supporting_rule',
        impact: 'nonblocking',
        affectedContentIds: [makePolicy().id, missing.id],
      }),
    ]);
    expect(compiled.value.coverageDiagnostics[0]).not.toHaveProperty('points');
    expect(compiled.value.coverageDiagnostics[0]).not.toHaveProperty('score');
  });

  it('diagnoses a matching unreviewed discovered rule without compiling it', () => {
    const unreviewedRule = makeCandidate('rule.test.unreviewed-low-energy-fit', {
      review: {
        status: 'unreviewed',
        reviewerId: null,
        reviewedAt: null,
        sourceUseNoteIds: [],
      },
    });
    const compiled = compileDecisionPolicy({
      policy: makePolicy(),
      patientState: makePatientState(),
      actionHorizon: makeHorizon(),
      rules: [...makeRules(), unreviewedRule],
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(
      compiled.value.includedRules.some((rule) => rule.ruleRef.id === unreviewedRule.ruleRef.id),
    ).toBe(false);
    expect(compiled.value.coverageDiagnostics).toContainEqual(
      expect.objectContaining({
        code: 'unreviewed_supporting_rule',
        affectedContentIds: [makePolicy().id, unreviewedRule.ruleRef.id],
      }),
    );
  });

  it('matches explicit negative findings without treating missing or unresolved as false', () => {
    const absentRule = makeCandidate('rule.test.explicit-absence', {
      patientWhen: { type: 'fact', fact: lowEnergyAbsentFact },
    });
    const withFindingValue = (
      value: ResolvedPatientState['canonicalFindings'][number]['value'],
    ): ResolvedPatientState => {
      const state = makePatientState();
      return {
        ...state,
        canonicalFindings: state.canonicalFindings.map((finding) => ({
          ...finding,
          value,
        })),
      };
    };
    const compile = (patientState: ResolvedPatientState) =>
      compileDecisionPolicy({
        policy: makePolicy(),
        patientState,
        actionHorizon: makeHorizon(),
        rules: [...makeRules(), absentRule],
      });

    const explicitAbsent = compile(withFindingValue({ kind: 'outcome', value: 'absent' }));
    const unresolved = compile(withFindingValue({ kind: 'unresolved', state: 'unassessed' }));
    const missing = compile({ ...makePatientState(), canonicalFindings: [] });
    for (const result of [explicitAbsent, unresolved, missing]) {
      expect(result.ok).toBe(true);
    }
    if (!explicitAbsent.ok || !unresolved.ok || !missing.ok) return;
    expect(
      explicitAbsent.value.includedRules.some((rule) => rule.ruleRef.id === absentRule.ruleRef.id),
    ).toBe(true);
    expect(
      unresolved.value.includedRules.some((rule) => rule.ruleRef.id === absentRule.ruleRef.id),
    ).toBe(false);
    expect(
      missing.value.includedRules.some((rule) => rule.ruleRef.id === absentRule.ruleRef.id),
    ).toBe(false);
  });

  it('keeps unassessed and documented-none reaction histories distinct without entries', () => {
    const withReactionStatus = (
      status: 'unassessed' | 'documented_none',
    ): ResolvedPatientState => ({
      ...makePatientState(),
      reactionHistory: {
        status,
        medicationAssessmentStatus: status,
        records: [],
      },
    });
    const reactionStatusValue = (state: ResolvedPatientState) =>
      collectDecisionPatientFacts(state).find(
        ({ key }) =>
          key.recordKind === 'reaction_history' && key.attributeId === 'reaction-history.status',
      )?.key.valueId;

    expect(reactionStatusValue(withReactionStatus('unassessed'))).toBe(
      'reaction-history-status.unassessed',
    );
    expect(reactionStatusValue(withReactionStatus('documented_none'))).toBe(
      'reaction-history-status.documented_none',
    );
  });

  it('keys duration and burden facts by reusable target identity, not patient record IDs', () => {
    const withScopedRecords = (suffix: string): ResolvedPatientState => {
      const state = makePatientState();
      const findingId = `resolved-finding.test.low-energy-${suffix}`;
      return {
        ...state,
        id: `resolved-patient-state.test.${suffix}`,
        canonicalFindings: state.canonicalFindings.map((finding) => ({
          ...finding,
          id: findingId,
        })),
        clinicalDurations: [
          {
            schemaVersion: 1,
            id: `clinical-duration.test.${suffix}`,
            target: { kind: 'canonical_finding', canonicalFindingId: findingId },
            value: 4,
            unit: 'month',
            durationProfileId: 'duration-profile.test.low-energy',
            durationOptionId: 'duration-option.test.four-months',
            relatedDiagnosisId: 'diagnosis.major-depressive-disorder',
            interpretation: 'supports_authored_state',
            criterionId: null,
            source: {
              kind: 'patient_report',
              sourceInstanceId: `source-instance.test.patient-${suffix}`,
            },
            timeScopeId: 'time-scope.current',
            resolution: authoredResolution,
          },
        ],
        subjectiveBurdenRecords: [
          {
            schemaVersion: 1,
            id: `subjective-burden.test.${suffix}`,
            target: { kind: 'canonical_finding', canonicalFindingId: findingId },
            ordinalScaleId: 'ordinal-scale.test.bothersomeness',
            ordinalScaleContentVersion: '1.0.0',
            ordinalValueId: 'ordinal-value.test.very',
            source: {
              kind: 'patient_report',
              sourceInstanceId: `source-instance.test.patient-${suffix}`,
            },
            timeScopeId: 'time-scope.current',
            resolution: authoredResolution,
          },
        ],
      };
    };
    const scopedFacts = (state: ResolvedPatientState) =>
      collectDecisionPatientFacts(state)
        .filter(({ key }) => ['clinical_duration', 'subjective_burden'].includes(key.recordKind))
        .map(({ key }) => key);

    expect(scopedFacts(withScopedRecords('one'))).toEqual(scopedFacts(withScopedRecords('two')));
    const firstFacts = scopedFacts(withScopedRecords('one'));
    expect(
      firstFacts
        .filter((fact) => fact.attributeId !== 'subjective-burden.scale-presence')
        .every(
          (fact) =>
            fact.identityId === lowEnergyFact.identityId &&
            fact.identityContentVersion === lowEnergyFact.identityContentVersion,
        ),
    ).toBe(true);
    expect(firstFacts).toContainEqual(
      expect.objectContaining({
        recordKind: 'subjective_burden',
        identityId: 'ordinal-scale.test.bothersomeness',
        identityContentVersion: '1.0.0',
        attributeId: 'subjective-burden.scale-presence',
      }),
    );
  });

  it('keeps duration and burden source, time, and scale pins decision-addressable', () => {
    const makeScopedState = (
      sourceKind: 'patient_report' | 'collateral_report',
      timeScopeId: string,
    ): ResolvedPatientState => {
      const state = makePatientState();
      const findingId = state.canonicalFindings[0]!.id;
      return {
        ...state,
        clinicalDurations: [
          {
            schemaVersion: 1,
            id: 'clinical-duration.test.low-energy',
            target: { kind: 'canonical_finding', canonicalFindingId: findingId },
            value: 4,
            unit: 'month',
            durationProfileId: 'duration-profile.test.low-energy',
            durationOptionId: 'duration-option.test.four-months',
            relatedDiagnosisId: 'diagnosis.major-depressive-disorder',
            interpretation: 'supports_authored_state',
            criterionId: null,
            source: {
              kind: sourceKind,
              sourceInstanceId: `source-instance.test.${sourceKind}`,
            },
            timeScopeId,
            resolution: authoredResolution,
          },
        ],
        subjectiveBurdenRecords: [
          {
            schemaVersion: 1,
            id: 'subjective-burden.test.low-energy',
            target: { kind: 'canonical_finding', canonicalFindingId: findingId },
            ordinalScaleId: 'ordinal-scale.test.bothersomeness',
            ordinalScaleContentVersion: '2.0.0',
            ordinalValueId: 'ordinal-value.test.very',
            source: {
              kind: sourceKind,
              sourceInstanceId: `source-instance.test.${sourceKind}`,
            },
            timeScopeId,
            resolution: authoredResolution,
          },
        ],
      };
    };
    const durationRule = makeCandidate('rule.test.current-patient-duration', {
      patientWhen: {
        type: 'same_record_all',
        facts: [
          {
            recordKind: 'clinical_duration',
            identityId: lowEnergyFact.identityId,
            identityContentVersion: lowEnergyFact.identityContentVersion,
            attributeId: 'clinical-duration.option',
            valueId: 'duration-option.test.four-months',
          },
          {
            recordKind: 'clinical_duration',
            identityId: lowEnergyFact.identityId,
            identityContentVersion: lowEnergyFact.identityContentVersion,
            attributeId: 'clinical-duration.source-kind',
            valueId: 'evidence-source-kind.patient_report',
          },
          {
            recordKind: 'clinical_duration',
            identityId: lowEnergyFact.identityId,
            identityContentVersion: lowEnergyFact.identityContentVersion,
            attributeId: 'clinical-duration.time-scope',
            valueId: 'time-scope.current',
          },
        ],
      },
    });
    const burdenRule = makeCandidate('rule.test.current-patient-burden', {
      patientWhen: {
        type: 'same_record_all',
        facts: [
          {
            recordKind: 'subjective_burden',
            identityId: lowEnergyFact.identityId,
            identityContentVersion: lowEnergyFact.identityContentVersion,
            attributeId: 'subjective-burden.ordinal-value',
            valueId: 'ordinal-value.test.very',
          },
          {
            recordKind: 'subjective_burden',
            identityId: lowEnergyFact.identityId,
            identityContentVersion: lowEnergyFact.identityContentVersion,
            attributeId: 'subjective-burden.source-kind',
            valueId: 'evidence-source-kind.patient_report',
          },
          {
            recordKind: 'subjective_burden',
            identityId: lowEnergyFact.identityId,
            identityContentVersion: lowEnergyFact.identityContentVersion,
            attributeId: 'subjective-burden.time-scope',
            valueId: 'time-scope.current',
          },
          {
            recordKind: 'subjective_burden',
            identityId: 'ordinal-scale.test.bothersomeness',
            identityContentVersion: '2.0.0',
            attributeId: 'subjective-burden.scale-presence',
            valueId: 'state.present',
          },
        ],
      },
    });
    const compile = (patientState: ResolvedPatientState) =>
      compileDecisionPolicy({
        policy: makePolicy(),
        patientState,
        actionHorizon: makeHorizon(),
        rules: [...makeRules(), durationRule, burdenRule],
      });
    const matching = compile(makeScopedState('patient_report', 'time-scope.current'));
    const mismatching = compile(makeScopedState('collateral_report', 'time-scope.historical'));
    expect(matching.ok).toBe(true);
    expect(mismatching.ok).toBe(true);
    if (!matching.ok || !mismatching.ok) return;
    expect(
      matching.value.includedRules.filter((rule) =>
        [durationRule.ruleRef.id, burdenRule.ruleRef.id].includes(rule.ruleRef.id),
      ),
    ).toHaveLength(2);
    expect(
      mismatching.value.includedRules.some((rule) =>
        [durationRule.ruleRef.id, burdenRule.ruleRef.id].includes(rule.ruleRef.id),
      ),
    ).toBe(false);
  });

  it('fails structurally for a stale primary route and an invalid regimen horizon', () => {
    const stale = compileDecisionPolicy({
      policy: makePolicy({
        primaryRouteRef: { ...primaryReference, contentVersion: '2.0.0' },
      }),
      patientState: makePatientState(),
      actionHorizon: makeHorizon(),
      rules: makeRules(),
    });
    expect(stale).toMatchObject({ ok: false, error: { code: 'PRIMARY_ROUTE_STALE' } });

    const invalidHorizon = compileDecisionPolicy({
      policy: makePolicy(),
      patientState: makePatientState(),
      actionHorizon: makeHorizon({
        regimenEntryOperations: [
          {
            regimenEntryId: 'regimen-entry.test.missing',
            medicationIdentityId: 'medication.lithium',
            operations: ['continue'],
          },
        ],
      }),
      rules: makeRules(),
    });
    expect(invalidHorizon).toMatchObject({
      ok: false,
      error: { code: 'ACTION_HORIZON_INVALID' },
    });
  });

  it('validates frozen rubric approval, primary ownership, and payload integrity', () => {
    const compiled = compileDecisionPolicy({
      policy: makePolicy(),
      patientState: makePatientState(),
      actionHorizon: makeHorizon(),
      rules: makeRules(),
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(verifyCompiledRubricIntegrity(compiled.value)).toEqual({
      ok: true,
      value: compiled.value,
    });

    const unreviewed = {
      ...compiled.value,
      includedRules: compiled.value.includedRules.map((rule, index) =>
        index === 0
          ? {
              ...rule,
              review: {
                status: 'unreviewed',
                reviewerId: null,
                reviewedAt: null,
                sourceUseNoteIds: [],
              },
            }
          : rule,
      ),
    };
    expect(CompiledRubricSchema.safeParse(unreviewed).success).toBe(false);

    const wrongOwner = {
      ...compiled.value,
      includedRules: compiled.value.includedRules.map((rule, index) =>
        index === 0
          ? {
              ...rule,
              ruleRef: { ...rule.ruleRef, ownerId: 'diagnosis.test.wrong-owner' },
            }
          : rule,
      ),
    };
    expect(CompiledRubricSchema.safeParse(wrongOwner).success).toBe(false);

    const tampered = {
      ...compiled.value,
      includedRules: compiled.value.includedRules.map((rule, index) =>
        index === 1 ? { ...rule, rationale: 'Tampered after compilation.' } : rule,
      ),
    };
    expect(verifyCompiledRubricIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'FINGERPRINT_MISMATCH' },
    });
    expect(
      verifyCompiledRubricIntegrity({
        ...compiled.value,
        patientStateId: 'resolved-patient-state.test.tampered',
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'FINGERPRINT_MISMATCH' },
    });
    expect(
      verifyCompiledRubricIntegrity({
        ...compiled.value,
        actionHorizonId: 'decision-action-horizon.test.tampered',
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'FINGERPRINT_MISMATCH' },
    });
  });

  it('exposes exact typed patient facts while ignoring free clinical tags', () => {
    const facts = collectDecisionPatientFacts(makePatientState());
    facts.forEach(({ key }) => {
      expect(DecisionPatientFactKeySchema.safeParse(key).success).toBe(true);
    });
    expect(
      DecisionPatientFactKeySchema.safeParse({
        ...lowEnergyFact,
        attributeId: 'condition.severity',
      }).success,
    ).toBe(false);
    expect(facts.some((entry) => entry.key.identityId === lowEnergyFact.identityId)).toBe(true);
    expect(
      facts.some((entry) =>
        JSON.stringify(entry).includes('clinical-tag.must-not-drive-decision-policy'),
      ),
    ).toBe(false);
    expect(
      facts.some(
        (entry) =>
          entry.key.recordKind === 'chart_diagnosis' &&
          entry.key.identityId === 'diagnosis.bipolar-spectrum-disorder',
      ),
    ).toBe(true);
    expect(
      facts.some(
        (entry) =>
          entry.key.recordKind === 'condition' &&
          entry.key.identityId === 'diagnosis.bipolar-spectrum-disorder',
      ),
    ).toBe(false);
  });
});
