import {
  CaseBlueprintSchema,
  ReviewCaseScenarioSchema,
  ReviewDecisionPolicySchema,
  type CaseBlueprint,
  type CaseInformationActionBlueprint,
  type CatalogBundle,
  type ClinicalRuleReview,
  type FindingBlueprint,
  type FindingOutcome,
  type ReviewCaseScenario,
  type ReviewDecisionPolicy,
} from '@psychsim/schemas';

const UNREVIEWED: ClinicalRuleReview = {
  status: 'unreviewed',
  reviewerId: null,
  reviewedAt: null,
  sourceUseNoteIds: [],
};

const tokenFor = (id: string): string =>
  id
    .replace(/^case[._-]/, '')
    .replaceAll('.', '-')
    .slice(0, 60);

const actionToken = (actionId: string): string =>
  actionId.replace(/^info\./, '').replaceAll('.', '-');

const neutralOutcome = (
  outcome: FindingBlueprint['outcome'],
): Exclude<FindingOutcome, 'high' | 'low' | 'positive' | 'present'> => {
  if (outcome === 'positive' || outcome === 'negative') return 'negative';
  if (outcome === 'present' || outcome === 'absent' || outcome === 'variable') return 'absent';
  if (outcome === 'high' || outcome === 'low') return 'normal';
  return outcome;
};

const neutralAction = (
  source: CaseInformationActionBlueprint,
  caseToken: string,
): CaseInformationActionBlueprint => {
  const allowsBackgroundAnxietyVariation = source.actionId === 'info.history.anxiety-symptoms';
  const findings = source.result.findings.map((finding, index) => ({
    id: `finding.${caseToken}.${actionToken(source.actionId)}.${index + 1}`,
    labelVariants: finding.labelVariants,
    outcome: allowsBackgroundAnxietyVariation
      ? ('variable' as const)
      : neutralOutcome(finding.outcome),
  }));
  return {
    actionId: source.actionId,
    defaultClassification:
      source.defaultClassification === 'wasteful' || source.defaultClassification === 'low_value'
        ? source.defaultClassification
        : 'defensible',
    result: {
      kind: 'finding_set',
      findings,
      selection: allowsBackgroundAnxietyVariation
        ? {
            minimumPresent: 0,
            maximumPresent: 1,
            requiredPresentIds: [],
            requiredAbsentIds: [],
          }
        : undefined,
      shuffle: source.result.shuffle,
      factsRevealed: [`fact.${caseToken}.${actionToken(source.actionId)}`],
    },
  };
};

const durationAction = (
  scenario: ReviewCaseScenario,
  caseToken: string,
): CaseInformationActionBlueprint => {
  const findings: FindingBlueprint[] = [
    {
      id: `finding.${caseToken}.timeline.duration`,
      labelVariants: ['Symptom duration', 'Current episode duration', 'Time course'],
      outcome: 'present',
      valueTextVariants: [
        'Symptoms have been present for {{duration}}.',
        'Current symptoms began {{duration}} ago.',
        'The current problem has lasted {{duration}}.',
      ],
      durationProfile: scenario.durationProfile,
    },
    {
      id: `finding.${caseToken}.timeline.impact`,
      labelVariants: [
        'Usual routine disrupted',
        'Daily functioning affected',
        'Difficulty meeting usual responsibilities',
      ],
      outcome: 'present',
    },
  ];
  if (scenario.bothersomeness) {
    const label = scenario.bothersomeness.replaceAll('_', ' ');
    findings.push({
      id: `finding.${caseToken}.timeline.bothersomeness`,
      labelVariants: ['Subjective burden', 'How bothersome the symptoms feel'],
      outcome: scenario.bothersomeness === 'not_at_all' ? 'absent' : 'present',
      valueTextVariants: [`The patient finds the symptoms ${label} bothersome.`],
    });
  }
  return {
    actionId: 'info.history.presenting-problem',
    defaultClassification: 'essential',
    result: {
      kind: 'finding_set',
      findings,
      shuffle: false,
      factsRevealed: [`fact.${caseToken}.timeline`],
    },
  };
};

const medicationStatus = (status: ReviewCaseScenario['medicationRegimen'][number]['status']) =>
  status === 'active'
    ? 'Currently taking'
    : status === 'prescribed_not_taking'
      ? 'Prescribed but not taking'
      : 'Self-discontinued';

const medicationReconciliationAction = (
  scenario: ReviewCaseScenario,
  caseToken: string,
  catalogs: CatalogBundle,
): CaseInformationActionBlueprint => ({
  actionId: 'info.history.medication-reconciliation',
  defaultClassification: scenario.medicationRegimen.length > 0 ? 'high_yield' : 'defensible',
  result: {
    kind: 'finding_set',
    findings:
      scenario.medicationRegimen.length > 0
        ? scenario.medicationRegimen.map((entry) => ({
            id: `finding.${caseToken}.regimen.${entry.id.replaceAll('.', '-')}`,
            labelVariants: [
              catalogs.medications.find((medication) => medication.id === entry.medicationId)
                ?.label ?? entry.medicationId,
            ],
            outcome: 'present' as const,
            valueTextVariants: [medicationStatus(entry.status)],
          }))
        : [
            {
              id: `finding.${caseToken}.regimen.none`,
              labelVariants: ['Current psychiatric medication'],
              outcome: 'absent' as const,
            },
          ],
    shuffle: false,
    factsRevealed: [`fact.${caseToken}.medication-regimen`],
  },
});

const adherenceAction = (
  scenario: ReviewCaseScenario,
  caseToken: string,
  catalogs: CatalogBundle,
): CaseInformationActionBlueprint => ({
  actionId: 'info.history.adherence',
  defaultClassification: scenario.medicationRegimen.length > 0 ? 'high_yield' : 'defensible',
  result: {
    kind: 'finding_set',
    findings:
      scenario.medicationRegimen.length > 0
        ? scenario.medicationRegimen.map((entry) => ({
            id: `finding.${caseToken}.adherence.${entry.id.replaceAll('.', '-')}`,
            labelVariants: [
              catalogs.medications.find((medication) => medication.id === entry.medicationId)
                ?.label ?? entry.medicationId,
            ],
            outcome:
              entry.adherence === 'consistent'
                ? ('positive' as const)
                : entry.adherence === 'unknown'
                  ? ('not_applicable' as const)
                  : ('negative' as const),
            valueTextVariants: [`Adherence: ${entry.adherence.replaceAll('_', ' ')}`],
          }))
        : [
            {
              id: `finding.${caseToken}.adherence.none`,
              labelVariants: ['Current medication adherence'],
              outcome: 'not_applicable' as const,
            },
          ],
    shuffle: false,
    factsRevealed: [`fact.${caseToken}.adherence`],
  },
});

const priorTrialsAction = (
  scenario: ReviewCaseScenario,
  caseToken: string,
  catalogs: CatalogBundle,
): CaseInformationActionBlueprint => ({
  actionId: 'info.history.prior-trials',
  defaultClassification: scenario.priorMedicationTrials.length > 0 ? 'high_yield' : 'defensible',
  result: {
    kind: 'finding_set',
    findings:
      scenario.priorMedicationTrials.length > 0
        ? scenario.priorMedicationTrials.map((trial) => ({
            id: `finding.${caseToken}.trial.${trial.id.replaceAll('.', '-')}`,
            labelVariants: [
              catalogs.medications.find((medication) => medication.id === trial.medicationId)
                ?.label ?? trial.medicationId,
            ],
            outcome: 'present' as const,
            valueTextVariants: [trial.summary],
          }))
        : [
            {
              id: `finding.${caseToken}.trials.none`,
              labelVariants: ['Prior psychiatric medication trials'],
              outcome: 'absent' as const,
            },
          ],
    shuffle: false,
    factsRevealed: [`fact.${caseToken}.prior-trials`],
  },
});

const withEvidence = (
  review: ClinicalRuleReview,
  ruleId: string,
  policy: ReviewDecisionPolicy,
): ClinicalRuleReview => ({
  ...review,
  sourceUseNoteIds: policy.sourceUses
    .filter((sourceUse) => sourceUse.targetRuleIds.includes(ruleId))
    .map((sourceUse) => sourceUse.id),
});

export const buildReviewCaseScenario = (
  rawScenario: unknown,
  rawPolicies: readonly unknown[],
  template: CaseBlueprint,
  catalogs: CatalogBundle,
): CaseBlueprint => {
  const scenario = ReviewCaseScenarioSchema.parse(rawScenario);
  const policies = rawPolicies.map((candidate) => ReviewDecisionPolicySchema.parse(candidate));
  const policy = policies.find((candidate) => candidate.id === scenario.decisionPolicyId);
  if (!policy) {
    throw new Error(
      `${scenario.id} references unknown decision policy ${scenario.decisionPolicyId}.`,
    );
  }
  const caseToken = tokenFor(scenario.id);
  const overrideByActionId = new Map(
    scenario.informationOverrides.map((action) => [action.actionId, action]),
  );
  const generatedActions = template.informationActions.map((action) => {
    if (action.actionId === 'info.history.presenting-problem') {
      return durationAction(scenario, caseToken);
    }
    if (action.actionId === 'info.history.medication-reconciliation') {
      return medicationReconciliationAction(scenario, caseToken, catalogs);
    }
    if (action.actionId === 'info.history.adherence') {
      return adherenceAction(scenario, caseToken, catalogs);
    }
    if (action.actionId === 'info.history.prior-trials') {
      return priorTrialsAction(scenario, caseToken, catalogs);
    }
    return neutralAction(action, caseToken);
  });
  for (const [actionId, override] of overrideByActionId) {
    const index = generatedActions.findIndex((action) => action.actionId === actionId);
    if (index < 0) throw new Error(`${scenario.id} overrides unknown action ${actionId}.`);
    generatedActions[index] = override;
  }

  const sourceUseNotes = policy.sourceUses.map((sourceUse) => ({
    id: sourceUse.id,
    authority: 'formal_publication' as const,
    evidenceSourceIds: sourceUse.evidenceSourceIds,
    sourceDocumentId: null,
    sourceChunkIds: [],
    targetContentIds: sourceUse.targetRuleIds,
    contributionTypes: sourceUse.contributionTypes,
    contribution: sourceUse.contribution,
    generatedBy: 'human' as const,
    medicalReviewStatus: 'unreviewed' as const,
  }));
  const workupObjectives = policy.workupObjectives.map((objective) => ({
    ...objective,
    review: withEvidence(objective.review, objective.id, policy),
  }));
  const treatmentGrades = policy.treatmentGrades.map((grade) => ({
    ...grade,
    review: withEvidence(grade.review, grade.id, policy),
  }));
  const treatmentPathways = policy.treatmentPathways.map((pathway) => ({
    ...pathway,
    review: withEvidence(pathway.review, pathway.id, policy),
    conditionalRequirements: pathway.conditionalRequirements.map((requirement) => ({
      ...requirement,
      review: withEvidence(
        requirement.review,
        `conditional.${pathway.id}.${requirement.objectiveId}`,
        policy,
      ),
    })),
  }));
  const scoreRules = policy.scoreRules.map((rule) => ({
    ...rule,
    review: withEvidence(rule.review, rule.id, policy),
  }));
  const evidenceSourceIds = [
    ...new Set(policy.sourceUses.flatMap((sourceUse) => sourceUse.evidenceSourceIds)),
  ];
  const knownMedicationIds = [
    ...new Set(
      scenario.medicationRegimen
        .filter((entry) => entry.knownAtOpening)
        .map((entry) => entry.medicationId),
    ),
  ];

  return CaseBlueprintSchema.parse({
    schemaVersion: 1,
    contentVersion: scenario.contentVersion,
    id: scenario.id,
    metadata: {
      title: scenario.internalTitle,
      fictional: true,
      synthetic: true,
      medicalReviewStatus: 'unreviewed',
      lifecycle: 'review',
      prototype: true,
      disclaimer:
        'Fictional, synthetic, medically unreviewed reviewer-cohort content; not authoritative treatment guidance.',
      difficultyTier: scenario.difficultyTier,
      patientPool: scenario.patientPool,
      minimumLifetimePoints: 0,
      tags: scenario.tags,
      compatibleLocationIds: scenario.compatibleLocationIds,
      sourceDocumentIds: [],
      evidenceSourceIds,
    },
    patientRecord: {
      schemaVersion: 1,
      id: `patient-record.${caseToken}`,
      categoryIds: scenario.categoryIds,
      diagnoses: scenario.diagnoses,
      clinicalTagIds: scenario.clinicalTagIds,
      observations: [],
      sourceUseNotes,
      treatmentReference: {
        id: `treatment-reference.${caseToken}`,
        primaryAuthoredPathwayId: policy.primaryAuthoredPathwayId,
        additionalAuthoredPathwayIds: [],
        safetyFallbackPathwayIds: policy.safetyFallbackPathwayIds,
        acceptedMedicationTagSets: [],
        alternativeEvaluation: 'engine_with_notice',
        review: { ...UNREVIEWED },
      },
      generationPolicy: {
        unspecifiedNoncriticalFacts: 'reviewed_normal_values',
        incidentalAbnormalities: 'bounded_by_test_catalog',
        minimumPresentationVariants: 100,
      },
      testGenerationContext: {
        ageYearsVariantTarget: 'patient.age',
        sexForReference: 'unspecified',
      },
      medicationRegimen: scenario.medicationRegimen,
      priorMedicationTrials: scenario.priorMedicationTrials,
      diagnosisComposition: null,
      clinicalContextDimensions: [],
    },
    criticalFacts: scenario.criticalFacts,
    opening: {
      titleTemplate: '{{patient.name}}',
      chiefComplaintTemplate: '{{patient.chiefComplaint}}',
      summaryTemplate:
        '{{patient.name}} is a {{patient.age}}-year-old {{patient.occupation}} who presents with “{{patient.chiefComplaint}}.”',
      contextTemplate: scenario.settingText,
      knownMedicationIds,
      knownHistory: scenario.knownHistory,
      basicVitals: template.opening.basicVitals,
    },
    variants: [
      {
        id: `variant.${caseToken}.name`,
        target: 'patient.name',
        clinicallyCritical: false,
        generator: {
          type: 'fictionalName',
          firstNamePoolId: 'variant-pool.fictional-first-names.general-adult',
          lastNamePoolId: 'variant-pool.fictional-last-names.general-adult',
          middleInitialProbability: 0.25,
        },
      },
      {
        id: `variant.${caseToken}.age`,
        target: 'patient.age',
        clinicallyCritical: false,
        generator: {
          type: 'integerRange',
          min: scenario.ageRange.minimum,
          max: scenario.ageRange.maximum,
        },
      },
      {
        id: `variant.${caseToken}.occupation`,
        target: 'patient.occupation',
        clinicallyCritical: false,
        generator: {
          type: 'catalogChoice',
          poolId: 'variant-pool.occupations.general-adult',
        },
      },
      {
        id: `variant.${caseToken}.chief-complaint`,
        target: 'patient.chiefComplaint',
        clinicallyCritical: false,
        generator: { type: 'choice', values: scenario.chiefComplaintChoices },
      },
    ],
    protectedVariantTargets: [
      'criticalFacts',
      'informationActions',
      'workupObjectives',
      'treatmentPathways',
      'scoreRules',
    ],
    informationActions: generatedActions,
    workupObjectives,
    availableTreatments: policy.availableTreatments,
    treatmentGrades,
    treatmentPathways,
    scoreRules,
    scoring: {
      componentPointCaps: {
        workup: null,
        medication_selection: null,
        medication_discontinuation: null,
        safety: null,
        nonmedication: null,
        disposition: null,
        efficiency: null,
      },
      databasePlanWorkupCost: policy.databasePlanWorkupCost,
      databasePlanCarePoints: policy.databasePlanCarePoints,
    },
    economy: {
      baseReimbursement: policy.baseReimbursement,
      complexityBonus: policy.complexityBonus,
      challengeBonus: 0,
      satisfactionMultiplier: 1,
    },
    referenceSolutions: policy.referenceSolutions,
  });
};

export const buildReviewCaseCohort = (
  scenarios: readonly unknown[],
  policies: readonly unknown[],
  template: CaseBlueprint,
  catalogs: CatalogBundle,
): readonly CaseBlueprint[] => {
  const parsedScenarios = ReviewCaseScenarioSchema.array().parse(scenarios);
  const parsedPolicies = ReviewDecisionPolicySchema.array().parse(policies);
  const repeatedScenarioIds = parsedScenarios
    .map((scenario) => scenario.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  const repeatedPolicyIds = parsedPolicies
    .map((policy) => policy.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  if (repeatedScenarioIds.length > 0) {
    throw new Error(
      `Reviewer cohort repeats scenario IDs: ${[...new Set(repeatedScenarioIds)].join(', ')}.`,
    );
  }
  if (repeatedPolicyIds.length > 0) {
    throw new Error(
      `Reviewer cohort repeats policy IDs: ${[...new Set(repeatedPolicyIds)].join(', ')}.`,
    );
  }
  const policyIds = new Set(parsedPolicies.map((policy) => policy.id));
  const referencedPolicyIds = new Set(parsedScenarios.map((scenario) => scenario.decisionPolicyId));
  const unknownPolicyIds = [...referencedPolicyIds].filter((id) => !policyIds.has(id));
  const unusedPolicyIds = [...policyIds].filter((id) => !referencedPolicyIds.has(id));
  if (unknownPolicyIds.length > 0) {
    throw new Error(
      `Reviewer scenarios reference unknown policies: ${unknownPolicyIds.join(', ')}.`,
    );
  }
  if (unusedPolicyIds.length > 0) {
    throw new Error(`Reviewer assignment contains unused policies: ${unusedPolicyIds.join(', ')}.`);
  }
  return parsedScenarios.map((scenario) =>
    buildReviewCaseScenario(scenario, parsedPolicies, template, catalogs),
  );
};
