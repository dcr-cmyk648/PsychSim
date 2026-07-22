import {
  ClinicalPointReportSchema,
  type CatalogBundle,
  type ClinicalPointReport,
  type EncounterState,
  type RuleEvaluation,
  type ScoreComponent,
  type TreatmentGradeDefinition,
  type TreatmentPathway,
} from '@psychsim/schemas';

import { evaluatePredicate, extractPredicateReferences, type PredicateContext } from './predicates';
import { err, ok, type Result } from './result';

const COMPONENTS: readonly ScoreComponent[] = [
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

const medicationFitTrace = (state: EncounterState, catalogs: CatalogBundle): RuleEvaluation[] => {
  const patientTags = new Set(state.caseInstance.patientRecord.clinicalTagIds);
  return state.selections.startMedicationIds.flatMap((medicationId) => {
    const medication = catalogs.medications.find((candidate) => candidate.id === medicationId);
    if (!medication) return [];
    return medication.fitModifiers
      .filter((modifier) => modifier.patientTagIds.every((tagId) => patientTags.has(tagId)))
      .map((modifier) => ({
        ruleId: modifier.id,
        label: `${medication.label}: patient fit`,
        component: 'medication_selection' as const,
        matched: true,
        points: modifier.pointDelta,
        classification:
          modifier.effect === 'contraindication'
            ? ('harmful' as const)
            : modifier.effect === 'penalty'
              ? ('weak' as const)
              : ('strong_alternative' as const),
        explanation: `${modifier.explanation} Catalog fit modifier; prototype medical review status: ${modifier.medicalReviewStatus}.`,
        reviewStatus: modifier.review.status,
        relatedActionIds: [],
        relatedTreatmentIds: [medicationId],
      }));
  });
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
  const safetyErrors: string[] = [];
  const carePointCaps: number[] = [];

  for (const objective of state.caseInstance.workupObjectives) {
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
      relatedActionIds: orderedPurchasedActions(refs.actionIds, state),
      relatedTreatmentIds: [],
    });
  }

  const treatmentGrade = chooseTreatmentGrade(state, context);
  trace.push({
    ruleId: treatmentGrade?.id ?? 'grade.ineffective-fallback',
    label: treatmentGrade?.label ?? 'No effective medication plan',
    component: 'medication_selection',
    matched: Boolean(treatmentGrade),
    points: treatmentGrade?.baseCarePoints ?? 0,
    classification: traceClassificationForGrade(treatmentGrade?.grade),
    explanation:
      treatmentGrade?.explanation ??
      'The final medication combination did not match a programmed treatment rule.',
    reviewStatus: treatmentGrade?.review.status ?? 'unreviewed',
    relatedActionIds: [],
    relatedTreatmentIds: treatmentGrade
      ? relatedTreatments(treatmentGrade.predicate, state, catalogs)
      : [],
  });

  trace.push(...medicationFitTrace(state, catalogs));

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
        classification: matched
          ? 'appropriate_for_selected_treatment'
          : requirement.safetyCritical
            ? 'critical_omission'
            : 'low_value',
        explanation: matched ? requirement.explanationMet : requirement.explanationMissing,
        reviewStatus: requirement.review.status,
        relatedActionIds: orderedPurchasedActions(refs.actionIds, state),
        relatedTreatmentIds: relatedTreatments(pathway.match, state, catalogs),
      });
      if (!matched && requirement.safetyCritical) safetyErrors.push(requirement.explanationMissing);
    }
  }

  for (const rule of state.caseInstance.scoreRules) {
    const matched = evaluatePredicate(rule.predicate, context);
    const refs = extractPredicateReferences(rule.predicate);
    trace.push({
      ruleId: rule.id,
      label: rule.label,
      component: rule.component,
      matched,
      points: matched ? rule.pointsIfTrue : rule.pointsIfFalse,
      classification: matched ? rule.classificationIfTrue : rule.classificationIfFalse,
      explanation: matched ? rule.explanationIfTrue : rule.explanationIfFalse,
      reviewStatus: rule.review.status,
      relatedActionIds: orderedPurchasedActions(refs.actionIds, state),
      relatedTreatmentIds: relatedTreatments(rule.predicate, state, catalogs),
    });
    const safetyError = matched ? rule.safetyErrorIfTrue : rule.safetyErrorIfFalse;
    if (safetyError) safetyErrors.push(safetyError);
    const cap = matched ? rule.carePointCapIfTrue : rule.carePointCapIfFalse;
    if (cap !== undefined) carePointCaps.push(cap);
  }

  const componentPoints = Object.fromEntries(
    COMPONENTS.map((component) => {
      const raw = trace
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
      componentPoints,
      ruleTrace: trace,
      safetyErrors: [...new Set(safetyErrors)],
      carePointCapApplied,
      databasePlanWorkupCost: state.caseInstance.scoring.databasePlanWorkupCost,
      selectedPathWorkupCost:
        pathway?.workupCostPar ?? state.caseInstance.scoring.databasePlanWorkupCost,
      actualWorkupExpense: state.expenseTotal,
    }),
  );
};
