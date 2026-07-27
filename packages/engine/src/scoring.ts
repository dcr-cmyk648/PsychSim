import {
  ClinicalPointReportSchema,
  type CatalogBundle,
  type ClinicalPointReport,
  type ClinicalRuleReview,
  type EvidenceContribution,
  type EncounterState,
  type RuleEvaluation,
  type ScoreComponent,
  type TreatmentGradeDefinition,
  type TreatmentPathway,
} from '@psychsim/schemas';

import { evaluatePredicate, extractPredicateReferences, type PredicateContext } from './predicates';
import { scoreDiagnosisSelections } from './diagnosis-scoring';
import { err, ok, type Result } from './result';
import { resolveRuleCombination } from './rule-combination';

const COMPONENTS: readonly ScoreComponent[] = [
  'diagnosis',
  'workup',
  'medication_selection',
  'medication_discontinuation',
  'safety',
  'nonmedication',
  'disposition',
  'efficiency',
];

const orderedPurchasedActions = (actionIds: readonly string[], state: EncounterState): string[] =>
  state.purchases
    .map((purchase) => purchase.actionId)
    .filter((actionId) => actionIds.includes(actionId));

const relatedTreatments = (
  predicate: Parameters<typeof extractPredicateReferences>[0],
  state: EncounterState,
  catalogs: CatalogBundle,
): string[] => {
  const refs = extractPredicateReferences(predicate);
  const taggedMedicationIds = state.selections.startMedicationIds.filter((medicationId) => {
    const medication = catalogs.medications.find((candidate) => candidate.id === medicationId);
    return medication?.tags.some((tagId) => refs.medicationTagIds.includes(tagId));
  });
  return [
    ...new Set([
      ...refs.medicationIds,
      ...(refs.anyMedicationStarted ? state.selections.startMedicationIds : []),
      ...taggedMedicationIds,
      ...refs.interventionIds,
      ...refs.dispositionIds,
    ]),
  ];
};

const makeContext = (state: EncounterState, catalogs: CatalogBundle): PredicateContext => ({
  purchasedActionIds: new Set(state.purchases.map((purchase) => purchase.actionId)),
  knownFactIds: new Set(state.knownFactIds),
  selections: state.selections,
  capabilities: new Set(state.clinicState.capabilities),
  medicationTagsById: new Map(
    catalogs.medications.map((medication) => [medication.id, new Set(medication.tags)]),
  ),
});

const chooseTreatmentGrade = (
  state: EncounterState,
  context: PredicateContext,
): TreatmentGradeDefinition | undefined =>
  [...state.caseInstance.treatmentGrades]
    .sort((left, right) => right.priority - left.priority)
    .find((grade) => evaluatePredicate(grade.predicate, context));

const choosePathway = (
  state: EncounterState,
  context: PredicateContext,
): TreatmentPathway | undefined =>
  [...state.caseInstance.treatmentPathways]
    .filter((pathway) => pathway.accepted)
    .sort((left, right) => right.priority - left.priority)
    .find((pathway) => evaluatePredicate(pathway.match, context));

const traceClassificationForGrade = (
  grade: TreatmentGradeDefinition['grade'] | undefined,
): RuleEvaluation['classification'] => {
  if (grade === 'optimal') return 'optimal_treatment';
  return grade ?? 'ineffective';
};

const evidenceAttributionsFor = (
  review: ClinicalRuleReview | undefined,
  sourceUseNotes: readonly EvidenceContribution[],
  catalogs: CatalogBundle,
  additionalSourceUseNoteIds: readonly string[] = [],
): RuleEvaluation['evidenceAttributions'] => {
  const sourceUseNoteIds = [
    ...new Set([...(review?.sourceUseNoteIds ?? []), ...additionalSourceUseNoteIds]),
  ];
  if (sourceUseNoteIds.length === 0) {
    return [
      {
        sourceUseNoteId: null,
        authority: 'expert_opinion',
        evidenceSourceId: null,
        citation: null,
        url: null,
        contribution: 'Expert opinion: no formal publication is linked to this prototype rule.',
      },
    ];
  }
  const attributions: RuleEvaluation['evidenceAttributions'] = [];
  for (const sourceUseNoteId of sourceUseNoteIds) {
    const note = sourceUseNotes.find((candidate) => candidate.id === sourceUseNoteId);
    if (!note) {
      attributions.push({
        sourceUseNoteId,
        authority: 'expert_opinion',
        evidenceSourceId: null,
        citation: null,
        url: null,
        contribution: 'Expert opinion: the referenced contribution record is unavailable.',
      });
      continue;
    }
    if (note.authority === 'expert_opinion') {
      const contribution = /^Developer opinion\b/.test(note.contribution)
        ? note.contribution
        : `Expert opinion: ${note.contribution}`;
      attributions.push({
        sourceUseNoteId,
        authority: 'expert_opinion',
        evidenceSourceId: null,
        citation: null,
        url: null,
        contribution,
      });
      continue;
    }
    for (const evidenceSourceId of note.evidenceSourceIds) {
      const source = catalogs.evidenceSources.find(
        (candidate) => candidate.id === evidenceSourceId,
      );
      attributions.push({
        sourceUseNoteId,
        authority: 'formal_publication',
        evidenceSourceId,
        citation: source?.citation ?? `Unresolved formal evidence: ${evidenceSourceId}`,
        url: source?.url ?? null,
        contribution: note.contribution,
      });
    }
  }
  return attributions;
};

const medicationFitTrace = (
  state: EncounterState,
  catalogs: CatalogBundle,
): {
  trace: RuleEvaluation[];
  hardContraindicationRuleIds: string[];
  suppressiblePositiveRuleIds: string[];
} => {
  const patientTags = new Set(state.caseInstance.patientRecord.clinicalTagIds);
  const trace: RuleEvaluation[] = [];
  const hardContraindicationRuleIds: string[] = [];
  const suppressiblePositiveRuleIds: string[] = [];
  for (const medicationId of state.selections.startMedicationIds) {
    const medication = catalogs.medications.find((candidate) => candidate.id === medicationId);
    if (!medication) continue;
    for (const modifier of medication.fitModifiers.filter((candidate) =>
      candidate.patientTagIds.every((tagId) => patientTags.has(tagId)),
    )) {
      const effectLabel =
        modifier.effect === 'contraindication'
          ? 'contraindication'
          : modifier.effect === 'penalty'
            ? 'fit penalty'
            : 'fit bonus';
      trace.push({
        ruleId: modifier.id,
        label: `${medication.label}: ${effectLabel}`,
        component: 'medication_selection',
        matched: true,
        points: modifier.pointDelta,
        classification:
          modifier.effect === 'contraindication'
            ? 'harmful'
            : modifier.effect === 'penalty'
              ? 'weak'
              : 'strong_alternative',
        explanation: `${modifier.explanation} Catalog fit modifier; prototype medical review status: ${modifier.medicalReviewStatus}.`,
        reviewStatus: modifier.review.status,
        evidenceAttributions: evidenceAttributionsFor(
          modifier.review,
          medication.sourceUseNotes,
          catalogs,
          modifier.sourceUseNoteIds,
        ),
        issueId: modifier.issueId,
        effectId: modifier.effectId,
        specificityPriority: modifier.specificityPriority,
        relatedActionIds: [],
        relatedDiagnosisIds: [],
        relatedTreatmentIds: [medicationId],
      });
      if (modifier.effect === 'contraindication') {
        hardContraindicationRuleIds.push(modifier.id);
      } else if (modifier.effect === 'bonus') {
        suppressiblePositiveRuleIds.push(modifier.id);
      }
    }
  }
  return {
    trace,
    hardContraindicationRuleIds,
    suppressiblePositiveRuleIds,
  };
};

interface PendingRuleConsequence {
  ruleId: string;
  safetyError?: string;
  carePointCap?: number;
}

const medicationReactionTrace = (
  state: EncounterState,
  catalogs: CatalogBundle,
): {
  trace: RuleEvaluation[];
  consequences: PendingRuleConsequence[];
} => {
  const trace: RuleEvaluation[] = [];
  const consequences: PendingRuleConsequence[] = [];
  for (const medicationId of state.selections.startMedicationIds) {
    const matchingCandidates = state.caseInstance.patientRecord.reactionHistory.records
      .filter(
        (record) =>
          record.trigger.kind === 'medication' && record.trigger.medicationId === medicationId,
      )
      .flatMap((record) =>
        catalogs.reactionConcepts.medicationSelectionPolicies
          .filter(
            (policy) =>
              policy.recordedAs.includes(record.recordedAs) &&
              policy.reportedSeverities.includes(record.reportedSeverity),
          )
          .map((policy) => ({ policy, record })),
      )
      .sort(
        (left, right) =>
          left.policy.pointDelta - right.policy.pointDelta ||
          left.policy.id.localeCompare(right.policy.id),
      );
    const selected = matchingCandidates[0];
    if (!selected) continue;

    const medicationLabel =
      catalogs.medications.find((medication) => medication.id === medicationId)?.label ??
      medicationId;
    const ruleId = `${selected.policy.id}.${medicationId}`;
    const safetyMessage = `A prior ${selected.record.reportedSeverity} reported reaction to ${medicationLabel} was present in the resolved patient record.`;
    trace.push({
      ruleId,
      label: `${medicationLabel}: prior reported reaction`,
      component: 'safety',
      matched: true,
      points: selected.policy.pointDelta,
      classification: selected.policy.classification,
      explanation: `${selected.policy.explanation} The reaction existed in the resolved patient record before the encounter and affects treatment scoring whether or not the player revealed it.`,
      reviewStatus: selected.policy.review.status,
      concernLevel: selected.policy.concernLevel,
      certaintyLevel: selected.policy.certaintyLevel,
      evidenceAttributions: [
        {
          sourceUseNoteId: null,
          authority: 'expert_opinion',
          evidenceSourceId: null,
          citation: null,
          url: null,
          contribution: `Developer opinion: ${selected.policy.explanation} The exact point value is provisional game balance.`,
        },
      ],
      issueId: `issue.prior-reaction.${medicationId}`,
      relatedActionIds: [],
      relatedDiagnosisIds: [],
      relatedTreatmentIds: [medicationId],
    });
    consequences.push({
      ruleId,
      safetyError: selected.policy.safetyCritical ? safetyMessage : undefined,
      carePointCap: selected.policy.carePointCap ?? undefined,
    });
  }
  return { trace, consequences };
};

export const scoreEncounter = (
  state: EncounterState,
  catalogs: CatalogBundle,
): Result<ClinicalPointReport> => {
  if (state.status !== 'submitted') {
    return err({
      code: 'ENCOUNTER_NOT_SUBMITTED',
      message: 'Lock in treatment before settling the encounter.',
    });
  }
  const context = makeContext(state, catalogs);
  const trace: RuleEvaluation[] = [];
  const diagnosisScore = scoreDiagnosisSelections(state, catalogs);
  const safetyErrors: string[] = [...diagnosisScore.safetyErrors];
  const carePointCaps: number[] = [...diagnosisScore.carePointCaps];
  const pendingConsequences: PendingRuleConsequence[] = [];
  const suppressiblePositiveRuleIds = new Set<string>();
  const hardContraindicationRuleIds = new Set<string>();

  trace.push(
    ...diagnosisScore.trace.map(({ review, sourceUseNoteIds, ...draft }) => ({
      ...draft,
      reviewStatus: review.status,
      evidenceAttributions: evidenceAttributionsFor(
        review,
        state.caseInstance.patientRecord.sourceUseNotes,
        catalogs,
        sourceUseNoteIds,
      ),
    })),
  );

  const treatmentOnlyObjectiveIds = new Set([
    ...state.caseInstance.treatmentWorkupRequirements.map((requirement) => requirement.objectiveId),
    ...state.caseInstance.treatmentPathways.flatMap((pathway) =>
      pathway.conditionalRequirements.map((requirement) => requirement.objectiveId),
    ),
  ]);

  for (const objective of state.caseInstance.workupObjectives) {
    if (
      treatmentOnlyObjectiveIds.has(objective.id) &&
      !objective.requiredByDefault &&
      objective.points === 0 &&
      objective.omissionPenalty === 0
    ) {
      continue;
    }
    const matched = evaluatePredicate(objective.satisfaction, context);
    const refs = extractPredicateReferences(objective.satisfaction);
    trace.push({
      ruleId: objective.id,
      label: objective.label,
      component: 'workup',
      matched,
      points: matched
        ? objective.points
        : objective.requiredByDefault
          ? objective.omissionPenalty
          : 0,
      classification: matched
        ? objective.importance === 'essential'
          ? 'essential_obtained'
          : objective.importance === 'high_yield'
            ? 'high_yield_obtained'
            : 'defensible_not_necessary'
        : objective.requiredByDefault
          ? 'critical_omission'
          : 'defensible_not_necessary',
      explanation: matched ? objective.explanationObtained : objective.explanationOmitted,
      reviewStatus: objective.review.status,
      evidenceAttributions: evidenceAttributionsFor(
        objective.review,
        state.caseInstance.patientRecord.sourceUseNotes,
        catalogs,
      ),
      issueId: objective.issueId,
      effectId: objective.effectId,
      specificityPriority: objective.specificityPriority,
      relatedActionIds: orderedPurchasedActions(refs.actionIds, state),
      relatedDiagnosisIds: [],
      relatedTreatmentIds: [],
    });
  }

  for (const requirement of state.caseInstance.treatmentWorkupRequirements) {
    if (!evaluatePredicate(requirement.appliesWhen, context)) continue;
    const objective = state.caseInstance.workupObjectives.find(
      (candidate) => candidate.id === requirement.objectiveId,
    );
    if (!objective) continue;
    const matched = evaluatePredicate(objective.satisfaction, context);
    const refs = extractPredicateReferences(objective.satisfaction);
    trace.push({
      ruleId: requirement.id,
      label: objective.label,
      component: 'workup',
      matched,
      points: matched ? requirement.pointsIfMet : requirement.pointsIfMissing,
      classification: matched ? 'appropriate_for_selected_treatment' : 'critical_omission',
      explanation: matched ? requirement.explanationMet : requirement.explanationMissing,
      reviewStatus: requirement.review.status,
      concernLevel: requirement.concernLevel,
      certaintyLevel: requirement.certaintyLevel,
      evidenceAttributions: evidenceAttributionsFor(
        requirement.review,
        state.caseInstance.patientRecord.sourceUseNotes,
        catalogs,
      ),
      issueId: requirement.issueId,
      effectId: requirement.effectId,
      specificityPriority: requirement.specificityPriority,
      relatedActionIds: orderedPurchasedActions(refs.actionIds, state),
      relatedDiagnosisIds: [],
      relatedTreatmentIds: relatedTreatments(requirement.appliesWhen, state, catalogs),
    });
    if (!matched && requirement.safetyCritical) {
      pendingConsequences.push({
        ruleId: requirement.id,
        safetyError: requirement.explanationMissing,
      });
    }
  }

  const treatmentGrade = chooseTreatmentGrade(state, context);
  const treatmentGradeRuleId = treatmentGrade?.id ?? 'grade.ineffective-fallback';
  trace.push({
    ruleId: treatmentGradeRuleId,
    label: treatmentGrade?.label ?? 'No effective medication plan',
    component: 'medication_selection',
    matched: Boolean(treatmentGrade),
    points: treatmentGrade?.baseCarePoints ?? 0,
    classification: traceClassificationForGrade(treatmentGrade?.grade),
    explanation:
      treatmentGrade?.explanation ??
      'The final medication combination did not match a programmed treatment rule.',
    reviewStatus: treatmentGrade?.review.status ?? 'unreviewed',
    evidenceAttributions: evidenceAttributionsFor(
      treatmentGrade?.review,
      state.caseInstance.patientRecord.sourceUseNotes,
      catalogs,
    ),
    issueId: treatmentGrade?.issueId ?? null,
    effectId: treatmentGrade?.effectId ?? null,
    specificityPriority: treatmentGrade?.specificityPriority ?? 0,
    relatedActionIds: [],
    relatedDiagnosisIds: [],
    relatedTreatmentIds: treatmentGrade
      ? relatedTreatments(treatmentGrade.predicate, state, catalogs)
      : [],
  });
  if ((treatmentGrade?.baseCarePoints ?? 0) > 0) {
    suppressiblePositiveRuleIds.add(treatmentGradeRuleId);
  }

  const medicationFit = medicationFitTrace(state, catalogs);
  trace.push(...medicationFit.trace);
  medicationFit.hardContraindicationRuleIds.forEach((ruleId) =>
    hardContraindicationRuleIds.add(ruleId),
  );
  medicationFit.suppressiblePositiveRuleIds.forEach((ruleId) =>
    suppressiblePositiveRuleIds.add(ruleId),
  );
  const reactionResult = medicationReactionTrace(state, catalogs);
  trace.push(...reactionResult.trace);
  pendingConsequences.push(...reactionResult.consequences);

  const pathway = choosePathway(state, context);
  if (pathway) {
    for (const requirement of pathway.conditionalRequirements) {
      const objective = state.caseInstance.workupObjectives.find(
        (candidate) => candidate.id === requirement.objectiveId,
      );
      if (!objective) continue;
      const matched = evaluatePredicate(objective.satisfaction, context);
      const refs = extractPredicateReferences(objective.satisfaction);
      trace.push({
        ruleId: `conditional.${pathway.id}.${objective.id}`,
        label: objective.label,
        component: 'medication_selection',
        matched,
        points: matched ? requirement.pointsIfMet : requirement.pointsIfMissing,
        classification: matched ? 'appropriate_for_selected_treatment' : 'critical_omission',
        explanation: matched ? requirement.explanationMet : requirement.explanationMissing,
        reviewStatus: requirement.review.status,
        evidenceAttributions: evidenceAttributionsFor(
          requirement.review,
          state.caseInstance.patientRecord.sourceUseNotes,
          catalogs,
        ),
        issueId: requirement.issueId,
        effectId: requirement.effectId,
        specificityPriority: requirement.specificityPriority,
        relatedActionIds: orderedPurchasedActions(refs.actionIds, state),
        relatedDiagnosisIds: [],
        relatedTreatmentIds: relatedTreatments(pathway.match, state, catalogs),
      });
      if (!matched && requirement.safetyCritical) {
        pendingConsequences.push({
          ruleId: `conditional.${pathway.id}.${objective.id}`,
          safetyError: requirement.explanationMissing,
        });
      }
    }
  }

  for (const rule of state.caseInstance.scoreRules) {
    const matched = evaluatePredicate(rule.predicate, context);
    const refs = extractPredicateReferences(rule.predicate);
    const points = matched ? rule.pointsIfTrue : rule.pointsIfFalse;
    const ruleEvaluation: RuleEvaluation = {
      ruleId: rule.id,
      label: rule.label,
      component: rule.component,
      matched,
      points,
      classification: matched ? rule.classificationIfTrue : rule.classificationIfFalse,
      explanation: matched ? rule.explanationIfTrue : rule.explanationIfFalse,
      reviewStatus: rule.review.status,
      evidenceAttributions: evidenceAttributionsFor(
        rule.review,
        state.caseInstance.patientRecord.sourceUseNotes,
        catalogs,
      ),
      issueId: rule.issueId,
      effectId: rule.effectId,
      specificityPriority: rule.specificityPriority,
      relatedActionIds: orderedPurchasedActions(refs.actionIds, state),
      relatedDiagnosisIds: [],
      relatedTreatmentIds: relatedTreatments(rule.predicate, state, catalogs),
    };
    trace.push(ruleEvaluation);
    if (
      ruleEvaluation.component === 'medication_selection' &&
      ruleEvaluation.points > 0 &&
      ruleEvaluation.relatedTreatmentIds.length > 0
    ) {
      suppressiblePositiveRuleIds.add(rule.id);
    }
    const safetyError = matched ? rule.safetyErrorIfTrue : rule.safetyErrorIfFalse;
    const cap = matched ? rule.carePointCapIfTrue : rule.carePointCapIfFalse;
    if (safetyError || cap !== undefined) {
      pendingConsequences.push({
        ruleId: rule.id,
        safetyError,
        carePointCap: cap,
      });
    }
  }

  const resolvedTrace = resolveRuleCombination(trace, {
    hardContraindicationRuleIds: [...hardContraindicationRuleIds],
    suppressiblePositiveRuleIds: [...suppressiblePositiveRuleIds],
  });
  const appliedRuleIds = new Set(
    resolvedTrace
      .filter((evaluation) => evaluation.combinationStatus === 'applied')
      .map((evaluation) => evaluation.ruleId),
  );
  for (const consequence of pendingConsequences) {
    if (!appliedRuleIds.has(consequence.ruleId)) continue;
    if (consequence.safetyError) safetyErrors.push(consequence.safetyError);
    if (consequence.carePointCap !== undefined) carePointCaps.push(consequence.carePointCap);
  }

  const componentPoints = Object.fromEntries(
    COMPONENTS.map((component) => {
      const raw = resolvedTrace
        .filter((evaluation) => evaluation.component === component)
        .reduce((sum, evaluation) => sum + evaluation.points, 0);
      const cap = state.caseInstance.scoring.componentPointCaps[component];
      return [component, cap === null || cap === undefined ? raw : Math.min(raw, cap)];
    }),
  ) as Record<ScoreComponent, number>;
  const uncappedPoints = COMPONENTS.reduce((sum, component) => sum + componentPoints[component], 0);
  const carePointCapApplied = carePointCaps.length ? Math.min(...carePointCaps) : null;
  const carePointsEarned =
    carePointCapApplied === null ? uncappedPoints : Math.min(uncappedPoints, carePointCapApplied);
  const treatmentReference = state.caseInstance.patientRecord.treatmentReference;
  const authoredPathwayIds = treatmentReference.primaryAuthoredPathwayId
    ? [
        treatmentReference.primaryAuthoredPathwayId,
        ...treatmentReference.additionalAuthoredPathwayIds,
        ...treatmentReference.safetyFallbackPathwayIds,
      ]
    : (treatmentReference.authoredPathwayIds ?? []);
  const exactAuthoredPathway = Boolean(
    pathway && treatmentGrade && authoredPathwayIds.includes(pathway.id),
  );
  const treatmentEvaluationSource = exactAuthoredPathway
    ? 'authored_pathway'
    : treatmentGrade
      ? 'engine_inferred'
      : 'unmatched';
  const treatmentEvaluationNotice = exactAuthoredPathway
    ? 'This combination matches a patient-authored database pathway. Catalog fit modifiers are itemized separately.'
    : treatmentGrade
      ? 'This combination does not exactly match a patient-authored pathway; deterministic catalog rules estimated its points.'
      : 'This combination matches neither a patient-authored pathway nor a programmed alternative. If it is clinically reasonable, queue it as a missing alternative.';

  return ok(
    ClinicalPointReportSchema.parse({
      schemaVersion: 1,
      carePointsEarned,
      databasePlanCarePoints: state.caseInstance.scoring.databasePlanCarePoints,
      differenceFromDatabasePlan:
        carePointsEarned - state.caseInstance.scoring.databasePlanCarePoints,
      treatmentGrade: treatmentGrade?.grade ?? 'ineffective',
      treatmentEvaluationSource,
      treatmentEvaluationNotice,
      selectedPathwayId: pathway?.id ?? null,
      selectedPathwayLabel: pathway?.label ?? null,
      diagnosisEvaluationSource: state.caseInstance.diagnosisRubric ? 'case_rubric' : 'not_scored',
      diagnosisEvaluationNotice: state.caseInstance.diagnosisRubric
        ? 'The submitted diagnosis set was evaluated against this frozen case rubric. Diagnostic scoring remains separate from hidden patient truth and treatment-fit scoring.'
        : 'This case has no authored diagnostic-answer point rubric. Submitted diagnoses are preserved and compared with case-authored diagnosis state without changing care points.',
      componentPoints,
      ruleTrace: resolvedTrace,
      safetyErrors: [...new Set(safetyErrors)],
      carePointCapApplied,
      databasePlanWorkupCost: state.caseInstance.scoring.databasePlanWorkupCost,
      selectedPathWorkupCost:
        pathway?.workupCostPar ?? state.caseInstance.scoring.databasePlanWorkupCost,
      actualWorkupExpense: state.expenseTotal,
    }),
  );
};
