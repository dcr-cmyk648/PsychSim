import {
  ReviewDecisionPolicySchema,
  type CatalogBundle,
  type ReviewDecisionPolicy,
  type ReviewCaseSourceUse,
  type ScorePredicate,
  type TreatmentGrade,
  type TreatmentSelection,
} from '@psychsim/schemas';

interface WorkupSeed {
  id: string;
  label: string;
  actionId: string;
  importance: 'essential' | 'high_yield' | 'optional';
  points: number;
  omissionPenalty: number;
}

interface TreatmentGradeSeed {
  id: string;
  label: string;
  grade: TreatmentGrade;
  priority: number;
  predicate: ScorePredicate;
  points: number;
  explanation: string;
}

interface ExtraRuleSeed {
  id: string;
  label: string;
  component:
    | 'workup'
    | 'medication_selection'
    | 'medication_discontinuation'
    | 'safety'
    | 'nonmedication'
    | 'disposition'
    | 'efficiency';
  predicate: ScorePredicate;
  pointsIfTrue: number;
  pointsIfFalse: number;
  classificationIfTrue:
    | 'essential_obtained'
    | 'high_yield_obtained'
    | 'appropriate_for_selected_treatment'
    | 'defensible_not_necessary'
    | 'low_value'
    | 'critical_omission'
    | 'optimal_treatment'
    | 'strong_alternative'
    | 'acceptable'
    | 'weak'
    | 'ineffective'
    | 'harmful'
    | 'safe'
    | 'dangerous_combination'
    | 'contributing_medication_stopped'
    | 'contributing_medication_not_stopped'
    | 'disposition'
    | 'nonmedication';
  classificationIfFalse: ExtraRuleSeed['classificationIfTrue'];
  explanationIfTrue: string;
  explanationIfFalse: string;
  safetyErrorIfTrue?: string;
  safetyErrorIfFalse?: string;
  carePointCapIfTrue?: number;
  carePointCapIfFalse?: number;
}

interface PolicySeed {
  id: string;
  contentVersion?: string;
  label: string;
  evidenceSourceId: string;
  evidenceContribution: string;
  workup: readonly WorkupSeed[];
  available: {
    startMedicationIds: readonly string[];
    stopMedicationIds?: readonly string[];
    continueMedicationIds?: readonly string[];
    interventionIds: readonly string[];
    dispositionIds?: readonly string[];
  };
  grades: readonly TreatmentGradeSeed[];
  primaryMatch: ScorePredicate;
  alternativeMatch: ScorePredicate;
  databasePlan: TreatmentSelection;
  strongAlternative: TreatmentSelection;
  unsafe: TreatmentSelection;
  expectedDispositionId: string;
  fallbackDispositionId: string;
  conditionalObjectiveId?: string;
  extraRules?: readonly ExtraRuleSeed[];
  databasePlanWorkupCost: number;
  databasePlanCarePoints: number;
  baseReimbursement: number;
  complexityBonus: number;
  additionalSourceUses?: readonly ReviewCaseSourceUse[];
}

const actionPurchased = (actionId: string): ScorePredicate => ({
  type: 'actionPurchased',
  actionId,
});
const started = (medicationId: string): ScorePredicate => ({
  type: 'treatmentStarted',
  medicationId,
});
const startedWithTag = (
  medicationTagId: string,
  minimumCount: number,
  maximumCount: number,
): ScorePredicate => ({
  type: 'treatmentStartedWithTag',
  medicationTagId,
  minimumCount,
  maximumCount,
});
const intervention = (interventionId: string): ScorePredicate => ({
  type: 'interventionSelected',
  interventionId,
});
const disposition = (dispositionId: string): ScorePredicate => ({
  type: 'dispositionSelected',
  dispositionId,
});
const any = (...predicates: ScorePredicate[]): ScorePredicate => ({ type: 'any', predicates });
const all = (...predicates: ScorePredicate[]): ScorePredicate => ({ type: 'all', predicates });

const selection = (
  values: Partial<TreatmentSelection> & Pick<TreatmentSelection, 'dispositionId'>,
): TreatmentSelection => ({
  startMedicationIds: [],
  stopMedicationIds: [],
  continueMedicationIds: [],
  interventionIds: [],
  ...values,
});

const MDD_MEDICATIONS = [
  'medication.sertraline',
  'medication.escitalopram',
  'medication.fluoxetine',
  'medication.bupropion',
  'medication.mirtazapine',
] as const;
const OUTPATIENT_DISPOSITIONS = [
  'disposition.outpatient-followup',
  'disposition.urgent-medical-evaluation',
  'disposition.emergency-transfer',
] as const;

const commonOutpatientWorkup = (prefix: string, syndromeActionId: string): WorkupSeed[] => [
  {
    id: `objective.${prefix}.timeline`,
    label: 'Establish the presenting timeline and functional effect',
    actionId: 'info.history.presenting-problem',
    importance: 'essential',
    points: 45,
    omissionPenalty: -55,
  },
  {
    id: `objective.${prefix}.syndrome`,
    label: 'Characterize the symptom pattern relevant to this decision',
    actionId: syndromeActionId,
    importance: 'essential',
    points: 60,
    omissionPenalty: -75,
  },
  {
    id: `objective.${prefix}.safety`,
    label: 'Assess suicide and self-harm risk',
    actionId: 'info.history.suicide-safety',
    importance: 'essential',
    points: 65,
    omissionPenalty: -100,
  },
];

const buildPolicy = (seed: PolicySeed, allActionIds: readonly string[]): ReviewDecisionPolicy => {
  const workupObjectives = seed.workup.map((objective) => ({
    id: objective.id,
    label: objective.label,
    importance: objective.importance,
    requiredByDefault: true,
    satisfaction: actionPurchased(objective.actionId),
    points: objective.points,
    omissionPenalty: objective.omissionPenalty,
    explanationObtained: `${objective.label}: obtained.`,
    explanationOmitted: `${objective.label}: omitted.`,
  }));
  const primaryPathId = `path.${seed.id.replace(/^policy\./, '')}.primary`;
  const alternativePathId = `path.${seed.id.replace(/^policy\./, '')}.alternative`;
  const safetyPathId = `path.${seed.id.replace(/^policy\./, '')}.safety-fallback`;
  const expectedDispositionRuleId = `rule.${seed.id.replace(/^policy\./, '')}.disposition`;
  const fallbackDispositionRuleId = `rule.${seed.id.replace(/^policy\./, '')}.fallback-disposition`;
  const efficiencyRuleId = `rule.${seed.id.replace(/^policy\./, '')}.efficiency`;
  const sourceUseId = `source-use.${seed.id.replace(/^policy\./, '')}`;
  const harmfulSafetyRules = seed.grades
    .filter((grade) => grade.grade === 'harmful')
    .map((grade) => ({
      id: `rule.${grade.id.replace(/^grade\./, '')}.safety-cap`,
      label: `${grade.label}: safety consequence`,
      component: 'safety' as const,
      predicate: grade.predicate,
      pointsIfTrue: -500,
      pointsIfFalse: 0,
      classificationIfTrue: 'harmful' as const,
      classificationIfFalse: 'safe' as const,
      explanationIfTrue:
        'This harmful comparison route receives an overriding safety penalty and cannot collect fit bonuses.',
      explanationIfFalse: 'The harmful comparison route was avoided.',
      safetyErrorIfTrue: `${grade.label} triggered a safety-critical treatment mismatch.`,
      carePointCapIfTrue: 0,
    }));
  const targetRuleIds = [
    ...workupObjectives.map((objective) => objective.id),
    ...seed.grades.map((grade) => grade.id),
    primaryPathId,
    alternativePathId,
    safetyPathId,
    expectedDispositionRuleId,
    fallbackDispositionRuleId,
    efficiencyRuleId,
    ...harmfulSafetyRules.map((rule) => rule.id),
    ...(seed.extraRules ?? []).map((rule) => rule.id),
  ];
  const additionalSourceUses = seed.additionalSourceUses ?? [];
  const expertAttributedRuleIds = new Set(
    additionalSourceUses
      .filter((sourceUse) => sourceUse.authority === 'expert_opinion')
      .flatMap((sourceUse) => sourceUse.targetRuleIds),
  );
  const formalSourceTargetRuleIds = targetRuleIds.filter(
    (ruleId) => !expertAttributedRuleIds.has(ruleId),
  );
  const databaseActionIds = seed.workup.map((objective) => objective.actionId);
  const unsafeActionIds = databaseActionIds.slice(0, Math.min(2, databaseActionIds.length));

  return ReviewDecisionPolicySchema.parse({
    schemaVersion: 1,
    contentVersion: seed.contentVersion ?? '1.0.0',
    id: seed.id,
    label: seed.label,
    workupObjectives,
    availableTreatments: {
      startMedicationIds: [...seed.available.startMedicationIds],
      stopMedicationIds: [...(seed.available.stopMedicationIds ?? [])],
      continueMedicationIds: [...(seed.available.continueMedicationIds ?? [])],
      interventionIds: [
        ...new Set([
          ...seed.available.interventionIds,
          'intervention.substance-use.brief-counseling',
          'intervention.substance-use.motivational-interviewing',
        ]),
      ],
      dispositionIds: [...(seed.available.dispositionIds ?? OUTPATIENT_DISPOSITIONS)],
    },
    treatmentGrades: seed.grades.map((grade) => ({
      id: grade.id,
      label: grade.label,
      grade: grade.grade,
      priority: grade.priority,
      predicate: grade.predicate,
      baseCarePoints: grade.points,
      explanation: grade.explanation,
    })),
    treatmentPathways: [
      {
        id: primaryPathId,
        label: 'Database-authored best-next-step route',
        grade: 'optimal',
        accepted: true,
        priority: 200,
        match: all(seed.primaryMatch, disposition(seed.expectedDispositionId)),
        requiredWorkupObjectiveIds: workupObjectives.map((objective) => objective.id),
        conditionalRequirements: seed.conditionalObjectiveId
          ? [
              {
                objectiveId: seed.conditionalObjectiveId,
                pointsIfMet: 40,
                pointsIfMissing: -90,
                safetyCritical: true,
                explanationMet: 'The treatment-specific history requirement was assessed.',
                explanationMissing:
                  'A treatment-specific safety history requirement was not assessed.',
              },
            ]
          : [],
        workupCostPar: seed.databasePlanWorkupCost,
        explanation:
          'This medically unreviewed route is the finite database plan for comparison, not an exhaustive treatment optimizer.',
      },
      {
        id: alternativePathId,
        label: 'Strong database alternative',
        grade: 'strong_alternative',
        accepted: true,
        priority: 180,
        match: all(seed.alternativeMatch, disposition(seed.expectedDispositionId)),
        requiredWorkupObjectiveIds: workupObjectives.map((objective) => objective.id),
        conditionalRequirements: [],
        workupCostPar: seed.databasePlanWorkupCost,
        explanation: 'This route preserves a substantial alternative for reviewer comparison.',
      },
      {
        id: safetyPathId,
        label: 'Safe higher-level evaluation fallback',
        grade: 'acceptable',
        accepted: true,
        priority: 100,
        match: disposition(seed.fallbackDispositionId),
        requiredWorkupObjectiveIds: workupObjectives
          .filter((objective) => objective.id.endsWith('.safety'))
          .map((objective) => objective.id),
        conditionalRequirements: [],
        workupCostPar: Math.min(seed.databasePlanWorkupCost, 30),
        explanation: 'This route preserves access to a safe higher-level evaluation.',
      },
    ],
    scoreRules: [
      {
        id: expectedDispositionRuleId,
        label: 'Proportionate disposition',
        component: 'disposition',
        predicate: disposition(seed.expectedDispositionId),
        pointsIfTrue: 100,
        pointsIfFalse: 0,
        classificationIfTrue: 'disposition',
        classificationIfFalse: 'weak',
        explanationIfTrue: 'The selected disposition matches the database-authored case state.',
        explanationIfFalse: 'The selected disposition does not match the database-authored route.',
      },
      {
        id: fallbackDispositionRuleId,
        label: 'Alternative disposition mismatch',
        component: 'disposition',
        predicate: disposition(seed.fallbackDispositionId),
        pointsIfTrue: seed.expectedDispositionId === 'disposition.outpatient-followup' ? -220 : -90,
        pointsIfFalse: 0,
        classificationIfTrue: 'weak',
        classificationIfFalse: 'disposition',
        explanationIfTrue:
          seed.expectedDispositionId === 'disposition.outpatient-followup'
            ? 'Higher-level escalation is safe but substantially disproportionate to this stable outpatient snapshot.'
            : 'This lower-intensity fallback receives less credit than the database-authored disposition.',
        explanationIfFalse: 'The fallback disposition was not selected.',
      },
      {
        id: efficiencyRuleId,
        label: 'Avoid unsupported advanced testing',
        component: 'efficiency',
        predicate: any(
          actionPurchased('info.labs.pharmacogenomics'),
          actionPurchased('info.imaging.head-ct'),
          actionPurchased('info.imaging.brain-mri'),
          actionPurchased('info.imaging.eeg'),
        ),
        pointsIfTrue: -220,
        pointsIfFalse: 0,
        classificationIfTrue: 'low_value',
        classificationIfFalse: 'safe',
        explanationIfTrue:
          'Advanced testing added cost without a case-authored clue or treatment requirement.',
        explanationIfFalse: 'The workup avoided unsupported advanced testing.',
      },
      ...harmfulSafetyRules,
      ...(seed.extraRules ?? []),
    ],
    databasePlanWorkupCost: seed.databasePlanWorkupCost,
    databasePlanCarePoints: seed.databasePlanCarePoints,
    baseReimbursement: seed.baseReimbursement,
    complexityBonus: seed.complexityBonus,
    referenceSolutions: [
      {
        id: `reference.${seed.id.replace(/^policy\./, '')}.database`,
        label: 'Database plan',
        kind: 'database_plan',
        actionIds: databaseActionIds,
        selections: seed.databasePlan,
        explanation:
          'Runs the finite authored comparison route for this medically unreviewed reviewer patient.',
      },
      {
        id: `reference.${seed.id.replace(/^policy\./, '')}.alternative`,
        label: 'Strong alternative',
        kind: 'strong_alternative',
        actionIds: databaseActionIds,
        selections: seed.strongAlternative,
        explanation: 'Runs a plausible alternative for reviewer comparison.',
      },
      {
        id: `reference.${seed.id.replace(/^policy\./, '')}.shotgun`,
        label: 'Shotgun testing',
        kind: 'shotgun',
        actionIds: [...allActionIds],
        selections: seed.databasePlan,
        explanation: 'Buys every shared information option before choosing the database plan.',
      },
      {
        id: `reference.${seed.id.replace(/^policy\./, '')}.unsafe`,
        label: 'Unsafe treatment',
        kind: 'unsafe',
        actionIds: unsafeActionIds,
        selections: seed.unsafe,
        explanation: 'Exercises a deliberately unsafe or badly mismatched route.',
      },
    ],
    primaryAuthoredPathwayId: primaryPathId,
    safetyFallbackPathwayIds: [safetyPathId],
    sourceUses: [
      {
        id: sourceUseId,
        authority: 'formal_publication',
        evidenceSourceIds: [seed.evidenceSourceId],
        contributionTypes: ['workup', 'treatment', 'safety'],
        contribution: seed.evidenceContribution,
        targetRuleIds: formalSourceTargetRuleIds,
      },
      ...additionalSourceUses,
    ],
  });
};

export const buildReviewerDecisionPolicies = (
  catalogs: CatalogBundle,
): readonly ReviewDecisionPolicy[] => {
  const allActionIds = catalogs.informationActions.map((action) => action.id);
  const mddWorkup = [
    ...commonOutpatientWorkup('review-mdd', 'info.history.depressive-symptoms'),
    {
      id: 'objective.review-mdd.mania',
      label: 'Ask about prior mania or hypomania before an antidepressant',
      actionId: 'info.history.mania',
      importance: 'essential' as const,
      points: 0,
      omissionPenalty: 0,
    },
  ];
  const mddGrades: TreatmentGradeSeed[] = [
    {
      id: 'grade.review-mdd.multiple-antidepressant-starts',
      label: 'Multiple antidepressants started together',
      grade: 'harmful',
      priority: 300,
      predicate: startedWithTag('antidepressant', 2, MDD_MEDICATIONS.length),
      points: -500,
      explanation:
        'For this initial outpatient snapshot, simultaneously starting two or more antidepressants is scored as a harmful, nonparsimonious shotgun regimen. This case rule does not generalize to cross-titration or established combination treatment.',
    },
    {
      id: 'grade.review-mdd.initial-first-line-antidepressant',
      label: 'One reviewed first-line antidepressant',
      grade: 'optimal',
      priority: 200,
      predicate: startedWithTag('mdd-initial-first-line', 1, 1),
      points: 200,
      explanation:
        'One reviewed first-line antidepressant satisfies the dominant initial-medication route; medication-specific fit remains a separate layer.',
    },
  ];

  const policies: PolicySeed[] = [
    {
      id: 'policy.review.mdd.initial',
      contentVersion: '1.2.0',
      label: 'Initial outpatient depressive presentation',
      evidenceSourceId: 'evidence.canmat.mdd-adults.2023-update',
      evidenceContribution:
        'CANMAT adult MDD assessment and initial-treatment context supports the reviewed broad antidepressant route; exact game-point magnitude remains provisional balance.',
      workup: mddWorkup,
      available: {
        startMedicationIds: MDD_MEDICATIONS,
        interventionIds: [
          'intervention.psychotherapy.cbt',
          'intervention.psychotherapy.ipt',
          'intervention.behavioral-activation',
        ],
      },
      grades: mddGrades,
      primaryMatch: startedWithTag('mdd-initial-first-line', 1, 1),
      alternativeMatch: started('medication.escitalopram'),
      databasePlan: selection({
        startMedicationIds: ['medication.sertraline'],
        interventionIds: ['intervention.psychotherapy.cbt'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      strongAlternative: selection({
        startMedicationIds: ['medication.escitalopram'],
        interventionIds: ['intervention.psychotherapy.ipt'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      unsafe: selection({
        startMedicationIds: ['medication.sertraline', 'medication.fluoxetine'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      expectedDispositionId: 'disposition.outpatient-followup',
      fallbackDispositionId: 'disposition.emergency-transfer',
      conditionalObjectiveId: 'objective.review-mdd.mania',
      databasePlanWorkupCost: 80,
      databasePlanCarePoints: 510,
      baseReimbursement: 720,
      complexityBonus: 60,
      additionalSourceUses: [
        {
          id: 'source-use.review-mdd.multiple-antidepressant-starts.developer-opinion',
          authority: 'expert_opinion',
          evidenceSourceIds: [],
          contributionTypes: ['treatment', 'safety', 'scoring'],
          contribution:
            'Developer opinion: starting multiple antidepressants for one focal indication at a routine initial outpatient visit is materially less parsimonious than selecting one. This provisional game rule does not establish a universal combination-treatment or cross-titration rule.',
          targetRuleIds: [
            'grade.review-mdd.multiple-antidepressant-starts',
            'rule.review-mdd.multiple-antidepressant-starts.safety-cap',
          ],
        },
      ],
    },
    {
      id: 'policy.review.mdd.adherence',
      label: 'Depressive symptoms with inconsistent current treatment',
      evidenceSourceId: 'evidence.canmat.mdd-adults.2023-update',
      evidenceContribution:
        'Prior-treatment assessment context seeded this unreviewed adherence snapshot; no rule is represented as reviewed CANMAT guidance.',
      workup: [
        ...mddWorkup,
        {
          id: 'objective.review-mdd.medication-reconciliation',
          label: 'Reconcile the current medication',
          actionId: 'info.history.medication-reconciliation',
          importance: 'essential',
          points: 55,
          omissionPenalty: -70,
        },
        {
          id: 'objective.review-mdd.adherence',
          label: 'Assess adherence before labeling treatment failure',
          actionId: 'info.history.adherence',
          importance: 'essential',
          points: 70,
          omissionPenalty: -100,
        },
      ],
      available: {
        startMedicationIds: MDD_MEDICATIONS,
        continueMedicationIds: ['medication.sertraline'],
        interventionIds: ['intervention.psychotherapy.cbt', 'intervention.behavioral-activation'],
      },
      grades: [
        {
          id: 'grade.review-mdd-adherence.duplicate',
          label: 'Duplicate SSRI treatment',
          grade: 'harmful',
          priority: 300,
          predicate: all(started('medication.sertraline'), started('medication.fluoxetine')),
          points: -500,
          explanation: 'The unsafe route adds duplicate same-class treatment.',
        },
        {
          id: 'grade.review-mdd-adherence.continue',
          label: 'Continue the existing single treatment after clarifying adherence',
          grade: 'optimal',
          priority: 200,
          predicate: { type: 'treatmentContinued', medicationId: 'medication.sertraline' },
          points: 170,
          explanation:
            'The database plan avoids declaring resistance before the current treatment was taken consistently.',
        },
        {
          id: 'grade.review-mdd-adherence.switch',
          label: 'Immediate medication switch',
          grade: 'weak',
          priority: 150,
          predicate: any(started('medication.bupropion'), started('medication.mirtazapine')),
          points: 20,
          explanation:
            'A switch before clarifying dose, duration, and actual exposure is the lower-valued provisional route.',
        },
      ],
      primaryMatch: { type: 'treatmentContinued', medicationId: 'medication.sertraline' },
      alternativeMatch: started('medication.bupropion'),
      databasePlan: selection({
        continueMedicationIds: ['medication.sertraline'],
        interventionIds: ['intervention.behavioral-activation'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      strongAlternative: selection({
        startMedicationIds: ['medication.bupropion'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      unsafe: selection({
        startMedicationIds: ['medication.sertraline', 'medication.fluoxetine'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      expectedDispositionId: 'disposition.outpatient-followup',
      fallbackDispositionId: 'disposition.emergency-transfer',
      conditionalObjectiveId: 'objective.review-mdd.mania',
      databasePlanWorkupCost: 100,
      databasePlanCarePoints: 605,
      baseReimbursement: 780,
      complexityBonus: 100,
    },
    {
      id: 'policy.review.mdd.nonresponse',
      label: 'Depressive symptoms after a prior medication trial',
      evidenceSourceId: 'evidence.canmat.mdd-adults.2023-update',
      evidenceContribution:
        'Prior-trial and treatment-selection context seeded this unreviewed next-step snapshot; its treatment ranking remains for reviewer critique.',
      workup: [
        ...mddWorkup,
        {
          id: 'objective.review-mdd.prior-trials',
          label: 'Establish duration, maximum dose, adherence, response, and tolerability',
          actionId: 'info.history.prior-trials',
          importance: 'essential',
          points: 75,
          omissionPenalty: -100,
        },
      ],
      available: {
        startMedicationIds: MDD_MEDICATIONS,
        stopMedicationIds: ['medication.sertraline'],
        continueMedicationIds: ['medication.sertraline'],
        interventionIds: ['intervention.psychotherapy.cbt', 'intervention.behavioral-activation'],
      },
      grades: [
        {
          id: 'grade.review-mdd-nonresponse.switch',
          label: 'Stop the ineffective trial and select one new antidepressant',
          grade: 'optimal',
          priority: 220,
          predicate: all(
            { type: 'treatmentStopped', medicationId: 'medication.sertraline' },
            started('medication.bupropion'),
          ),
          points: 180,
          explanation:
            'This finite database route records one medication switch after a documented nonresponse.',
        },
        {
          id: 'grade.review-mdd-nonresponse.alternative',
          label: 'Alternative single medication switch',
          grade: 'strong_alternative',
          priority: 180,
          predicate: all(
            { type: 'treatmentStopped', medicationId: 'medication.sertraline' },
            started('medication.mirtazapine'),
          ),
          points: 160,
          explanation: 'A different single switch remains a substantial alternative.',
        },
        {
          id: 'grade.review-mdd-nonresponse.duplicate',
          label: 'Continue ineffective treatment and add duplicate therapy',
          grade: 'harmful',
          priority: 300,
          predicate: all(started('medication.fluoxetine'), {
            type: 'treatmentContinued',
            medicationId: 'medication.sertraline',
          }),
          points: -500,
          explanation: 'The unsafe reference route continues and duplicates the regimen.',
        },
      ],
      primaryMatch: all(
        { type: 'treatmentStopped', medicationId: 'medication.sertraline' },
        started('medication.bupropion'),
      ),
      alternativeMatch: all(
        { type: 'treatmentStopped', medicationId: 'medication.sertraline' },
        started('medication.mirtazapine'),
      ),
      databasePlan: selection({
        startMedicationIds: ['medication.bupropion'],
        stopMedicationIds: ['medication.sertraline'],
        interventionIds: ['intervention.psychotherapy.cbt'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      strongAlternative: selection({
        startMedicationIds: ['medication.mirtazapine'],
        stopMedicationIds: ['medication.sertraline'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      unsafe: selection({
        startMedicationIds: ['medication.fluoxetine'],
        continueMedicationIds: ['medication.sertraline'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      expectedDispositionId: 'disposition.outpatient-followup',
      fallbackDispositionId: 'disposition.emergency-transfer',
      conditionalObjectiveId: 'objective.review-mdd.mania',
      databasePlanWorkupCost: 100,
      databasePlanCarePoints: 565,
      baseReimbursement: 800,
      complexityBonus: 120,
    },
    {
      id: 'policy.review.gad.initial',
      label: 'Initial generalized-anxiety presentation',
      evidenceSourceId: 'evidence.who.mhgap-mns.2023',
      evidenceContribution:
        'Broad anxiety assessment and intervention context seeded this unreviewed reviewer route; exact selection and point weights require review.',
      workup: [
        ...commonOutpatientWorkup('review-gad', 'info.history.anxiety-symptoms'),
        {
          id: 'objective.review-gad.substances',
          label: 'Assess substance and withdrawal contributors',
          actionId: 'info.history.substance-use',
          importance: 'high_yield',
          points: 45,
          omissionPenalty: -35,
        },
      ],
      available: {
        startMedicationIds: [
          'medication.sertraline',
          'medication.escitalopram',
          'medication.buspirone',
          'medication.haloperidol',
        ],
        interventionIds: ['intervention.psychotherapy.cbt', 'intervention.sleep-routine'],
      },
      grades: [
        {
          id: 'grade.review-gad.cbt',
          label: 'CBT as a single first intervention',
          grade: 'optimal',
          priority: 210,
          predicate: intervention('intervention.psychotherapy.cbt'),
          points: 160,
          explanation: 'CBT is the finite database-plan intervention for this reviewer snapshot.',
        },
        {
          id: 'grade.review-gad.ssri',
          label: 'Single SSRI',
          grade: 'strong_alternative',
          priority: 180,
          predicate: any(started('medication.sertraline'), started('medication.escitalopram')),
          points: 150,
          explanation: 'A single SSRI remains a substantial provisional alternative.',
        },
        {
          id: 'grade.review-gad.antipsychotic',
          label: 'Antipsychotic for uncomplicated anxiety',
          grade: 'harmful',
          priority: 300,
          predicate: started('medication.haloperidol'),
          points: -450,
          explanation: 'This is a deliberately badly mismatched unsafe route.',
        },
      ],
      primaryMatch: intervention('intervention.psychotherapy.cbt'),
      alternativeMatch: started('medication.sertraline'),
      databasePlan: selection({
        interventionIds: ['intervention.psychotherapy.cbt'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      strongAlternative: selection({
        startMedicationIds: ['medication.sertraline'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      unsafe: selection({
        startMedicationIds: ['medication.haloperidol'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      expectedDispositionId: 'disposition.outpatient-followup',
      fallbackDispositionId: 'disposition.emergency-transfer',
      databasePlanWorkupCost: 95,
      databasePlanCarePoints: 475,
      baseReimbursement: 730,
      complexityBonus: 70,
    },
    {
      id: 'policy.review.bipolar-depression',
      label: 'Bipolar depressive presentation',
      evidenceSourceId: 'evidence.who.mhgap-mns.2023',
      evidenceContribution:
        'WHO bipolar-depression treatment context seeded this medically unreviewed comparison; specialist ranking and points remain review targets.',
      workup: [
        ...commonOutpatientWorkup('review-bipolar-depression', 'info.history.depressive-symptoms'),
        {
          id: 'objective.review-bipolar-depression.mania',
          label: 'Characterize prior mania and current mixed features',
          actionId: 'info.history.mania',
          importance: 'essential',
          points: 80,
          omissionPenalty: -120,
        },
        {
          id: 'objective.review-bipolar-depression.prior-trials',
          label: 'Review prior treatment response',
          actionId: 'info.history.prior-trials',
          importance: 'high_yield',
          points: 45,
          omissionPenalty: -35,
        },
      ],
      available: {
        startMedicationIds: [
          'medication.quetiapine',
          'medication.lithium',
          'medication.olanzapine',
          'medication.fluoxetine',
          'medication.sertraline',
        ],
        interventionIds: ['intervention.psychotherapy.cbt', 'intervention.sleep-routine'],
      },
      grades: [
        {
          id: 'grade.review-bipolar-depression.quetiapine',
          label: 'Quetiapine',
          grade: 'optimal',
          priority: 210,
          predicate: started('medication.quetiapine'),
          points: 180,
          explanation: 'Quetiapine is the finite database comparison for this unreviewed snapshot.',
        },
        {
          id: 'grade.review-bipolar-depression.lithium',
          label: 'Lithium',
          grade: 'strong_alternative',
          priority: 180,
          predicate: started('medication.lithium'),
          points: 160,
          explanation: 'Lithium is retained as a substantial provisional alternative.',
        },
        {
          id: 'grade.review-bipolar-depression.ssri-alone',
          label: 'SSRI monotherapy',
          grade: 'harmful',
          priority: 300,
          predicate: any(started('medication.fluoxetine'), started('medication.sertraline')),
          points: -550,
          explanation: 'Unqualified antidepressant monotherapy is the unsafe comparison route.',
        },
      ],
      primaryMatch: started('medication.quetiapine'),
      alternativeMatch: started('medication.lithium'),
      databasePlan: selection({
        startMedicationIds: ['medication.quetiapine'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      strongAlternative: selection({
        startMedicationIds: ['medication.lithium'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      unsafe: selection({
        startMedicationIds: ['medication.fluoxetine'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      expectedDispositionId: 'disposition.outpatient-followup',
      fallbackDispositionId: 'disposition.emergency-transfer',
      databasePlanWorkupCost: 125,
      databasePlanCarePoints: 575,
      baseReimbursement: 850,
      complexityBonus: 150,
    },
    {
      id: 'policy.review.mania.acute',
      label: 'Acute manic presentation',
      evidenceSourceId: 'evidence.who.mhgap-mns.2023',
      evidenceContribution:
        'WHO mania assessment and management context seeded this medically unreviewed escalation-centered comparison.',
      workup: [
        {
          id: 'objective.review-mania.timeline',
          label: 'Establish the acute timeline and functional change',
          actionId: 'info.history.presenting-problem',
          importance: 'essential',
          points: 50,
          omissionPenalty: -80,
        },
        {
          id: 'objective.review-mania.syndrome',
          label: 'Characterize manic and mixed symptoms',
          actionId: 'info.history.mania',
          importance: 'essential',
          points: 80,
          omissionPenalty: -120,
        },
        {
          id: 'objective.review-mania.safety',
          label: 'Assess immediate safety',
          actionId: 'info.history.suicide-safety',
          importance: 'essential',
          points: 70,
          omissionPenalty: -120,
        },
        {
          id: 'objective.review-mania.mse',
          label: 'Perform a mental status examination',
          actionId: 'info.physical.mental-status',
          importance: 'essential',
          points: 65,
          omissionPenalty: -90,
        },
      ],
      available: {
        startMedicationIds: [
          'medication.olanzapine',
          'medication.quetiapine',
          'medication.haloperidol',
          'medication.sertraline',
        ],
        interventionIds: ['intervention.medication-safety-counseling'],
      },
      grades: [
        {
          id: 'grade.review-mania.olanzapine',
          label: 'Antipsychotic treatment with emergency transfer',
          grade: 'optimal',
          priority: 210,
          predicate: started('medication.olanzapine'),
          points: 170,
          explanation: 'Olanzapine is the finite medication comparison in this unreviewed route.',
        },
        {
          id: 'grade.review-mania.quetiapine',
          label: 'Alternative antipsychotic',
          grade: 'strong_alternative',
          priority: 180,
          predicate: started('medication.quetiapine'),
          points: 155,
          explanation: 'Quetiapine is retained as a substantial alternative for review.',
        },
        {
          id: 'grade.review-mania.antidepressant',
          label: 'Antidepressant monotherapy',
          grade: 'harmful',
          priority: 300,
          predicate: started('medication.sertraline'),
          points: -650,
          explanation: 'Antidepressant monotherapy is the unsafe comparison route.',
        },
      ],
      primaryMatch: started('medication.olanzapine'),
      alternativeMatch: started('medication.quetiapine'),
      databasePlan: selection({
        startMedicationIds: ['medication.olanzapine'],
        dispositionId: 'disposition.emergency-transfer',
      }),
      strongAlternative: selection({
        startMedicationIds: ['medication.quetiapine'],
        dispositionId: 'disposition.emergency-transfer',
      }),
      unsafe: selection({
        startMedicationIds: ['medication.sertraline'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      expectedDispositionId: 'disposition.emergency-transfer',
      fallbackDispositionId: 'disposition.urgent-medical-evaluation',
      databasePlanWorkupCost: 165,
      databasePlanCarePoints: 535,
      baseReimbursement: 900,
      complexityBonus: 180,
      extraRules: [
        {
          id: 'rule.review-mania.outpatient',
          label: 'Unsafe outpatient disposition',
          component: 'disposition',
          predicate: disposition('disposition.outpatient-followup'),
          pointsIfTrue: -700,
          pointsIfFalse: 0,
          classificationIfTrue: 'harmful',
          classificationIfFalse: 'disposition',
          explanationIfTrue:
            'Routine outpatient follow-up does not match the acute safety and functional facts in this snapshot.',
          explanationIfFalse: 'Routine outpatient follow-up was not selected.',
          safetyErrorIfTrue: 'Acute mania was assigned routine outpatient follow-up.',
          carePointCapIfTrue: 0,
        },
      ],
    },
    {
      id: 'policy.review.schizophrenia.relapse',
      label: 'Psychotic relapse with impaired self-care',
      evidenceSourceId: 'evidence.who.mhgap-mns.2023',
      evidenceContribution:
        'WHO psychosis management context seeded this medically unreviewed immediate-action and disposition comparison.',
      workup: [
        {
          id: 'objective.review-psychosis.timeline',
          label: 'Establish the acute timeline',
          actionId: 'info.history.presenting-problem',
          importance: 'essential',
          points: 45,
          omissionPenalty: -70,
        },
        {
          id: 'objective.review-psychosis.syndrome',
          label: 'Characterize psychotic symptoms',
          actionId: 'info.history.psychosis',
          importance: 'essential',
          points: 80,
          omissionPenalty: -120,
        },
        {
          id: 'objective.review-psychosis.medications',
          label: 'Reconcile medication and adherence',
          actionId: 'info.history.medication-reconciliation',
          importance: 'essential',
          points: 60,
          omissionPenalty: -90,
        },
        {
          id: 'objective.review-psychosis.safety',
          label: 'Assess suicide, violence, and ability to meet basic needs',
          actionId: 'info.history.violence-risk',
          importance: 'essential',
          points: 70,
          omissionPenalty: -120,
        },
        {
          id: 'objective.review-psychosis.mse',
          label: 'Perform a mental status examination',
          actionId: 'info.physical.mental-status',
          importance: 'essential',
          points: 65,
          omissionPenalty: -90,
        },
      ],
      available: {
        startMedicationIds: [
          'medication.olanzapine',
          'medication.aripiprazole',
          'medication.haloperidol',
          'medication.sertraline',
        ],
        interventionIds: ['intervention.medication-safety-counseling'],
      },
      grades: [
        {
          id: 'grade.review-psychosis.olanzapine',
          label: 'Antipsychotic treatment',
          grade: 'optimal',
          priority: 210,
          predicate: started('medication.olanzapine'),
          points: 180,
          explanation: 'Olanzapine is the finite unreviewed database comparison.',
        },
        {
          id: 'grade.review-psychosis.haloperidol',
          label: 'Alternative antipsychotic',
          grade: 'strong_alternative',
          priority: 180,
          predicate: started('medication.haloperidol'),
          points: 160,
          explanation: 'Haloperidol remains a substantial alternative for reviewer critique.',
        },
        {
          id: 'grade.review-psychosis.antidepressant',
          label: 'Antidepressant monotherapy',
          grade: 'harmful',
          priority: 300,
          predicate: started('medication.sertraline'),
          points: -600,
          explanation: 'Antidepressant monotherapy is the unsafe comparison route.',
        },
      ],
      primaryMatch: started('medication.olanzapine'),
      alternativeMatch: started('medication.haloperidol'),
      databasePlan: selection({
        startMedicationIds: ['medication.olanzapine'],
        dispositionId: 'disposition.emergency-transfer',
      }),
      strongAlternative: selection({
        startMedicationIds: ['medication.haloperidol'],
        dispositionId: 'disposition.emergency-transfer',
      }),
      unsafe: selection({
        startMedicationIds: ['medication.sertraline'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      expectedDispositionId: 'disposition.emergency-transfer',
      fallbackDispositionId: 'disposition.urgent-medical-evaluation',
      databasePlanWorkupCost: 185,
      databasePlanCarePoints: 600,
      baseReimbursement: 940,
      complexityBonus: 190,
      extraRules: [
        {
          id: 'rule.review-psychosis.outpatient',
          label: 'Unsafe outpatient disposition',
          component: 'disposition',
          predicate: disposition('disposition.outpatient-followup'),
          pointsIfTrue: -700,
          pointsIfFalse: 0,
          classificationIfTrue: 'harmful',
          classificationIfFalse: 'disposition',
          explanationIfTrue:
            'Routine outpatient follow-up does not match the impaired self-care facts in this snapshot.',
          explanationIfFalse: 'Routine outpatient follow-up was not selected.',
          safetyErrorIfTrue: 'Acute psychotic relapse was assigned routine outpatient follow-up.',
          carePointCapIfTrue: 0,
        },
      ],
    },
    {
      id: 'policy.review.ptsd.initial',
      label: 'Initial posttraumatic-stress presentation',
      evidenceSourceId: 'evidence.who.mhgap-mns.2023',
      evidenceContribution:
        'WHO stress-related intervention context seeded this medically unreviewed psychotherapy comparison.',
      workup: [
        ...commonOutpatientWorkup('review-ptsd', 'info.history.trauma'),
        {
          id: 'objective.review-ptsd.substances',
          label: 'Assess substance-related coping and withdrawal',
          actionId: 'info.history.substance-use',
          importance: 'high_yield',
          points: 40,
          omissionPenalty: -30,
        },
      ],
      available: {
        startMedicationIds: [
          'medication.sertraline',
          'medication.fluoxetine',
          'medication.haloperidol',
        ],
        interventionIds: [
          'intervention.psychotherapy.trauma-focused-cbt',
          'intervention.psychotherapy.emdr',
          'intervention.grounding-strategies',
        ],
      },
      grades: [
        {
          id: 'grade.review-ptsd.trauma-focused-cbt',
          label: 'Trauma-focused CBT',
          grade: 'optimal',
          priority: 210,
          predicate: intervention('intervention.psychotherapy.trauma-focused-cbt'),
          points: 175,
          explanation:
            'Trauma-focused CBT is the finite database comparison for this unreviewed snapshot.',
        },
        {
          id: 'grade.review-ptsd.emdr',
          label: 'EMDR',
          grade: 'strong_alternative',
          priority: 190,
          predicate: intervention('intervention.psychotherapy.emdr'),
          points: 165,
          explanation: 'EMDR remains a substantial provisional alternative.',
        },
        {
          id: 'grade.review-ptsd.haloperidol',
          label: 'Antipsychotic monotherapy',
          grade: 'harmful',
          priority: 300,
          predicate: started('medication.haloperidol'),
          points: -450,
          explanation: 'This is a deliberately badly mismatched unsafe route.',
        },
      ],
      primaryMatch: intervention('intervention.psychotherapy.trauma-focused-cbt'),
      alternativeMatch: intervention('intervention.psychotherapy.emdr'),
      databasePlan: selection({
        interventionIds: ['intervention.psychotherapy.trauma-focused-cbt'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      strongAlternative: selection({
        interventionIds: ['intervention.psychotherapy.emdr'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      unsafe: selection({
        startMedicationIds: ['medication.haloperidol'],
        dispositionId: 'disposition.outpatient-followup',
      }),
      expectedDispositionId: 'disposition.outpatient-followup',
      fallbackDispositionId: 'disposition.emergency-transfer',
      databasePlanWorkupCost: 95,
      databasePlanCarePoints: 485,
      baseReimbursement: 760,
      complexityBonus: 90,
    },
  ];

  return policies.map((policy) => buildPolicy(policy, allActionIds));
};
