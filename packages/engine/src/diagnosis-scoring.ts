import type {
  CatalogBundle,
  ClinicalRuleReview,
  DiagnosisAnswerOption,
  DiagnosisMisclassificationRule,
  DiagnosisSelectionMatch,
  EncounterState,
  PlayerDiagnosisSelection,
  RuleEvaluation,
} from '@psychsim/schemas';

type DiagnosisTraceClassification = Extract<
  RuleEvaluation['classification'],
  | 'diagnosis_canonical'
  | 'diagnosis_reasonable_alternative'
  | 'diagnosis_partial'
  | 'diagnosis_omitted'
  | 'diagnosis_minor_mismatch'
  | 'diagnosis_major_mismatch'
  | 'diagnosis_dangerous_misclassification'
  | 'diagnosis_additional_selection'
>;

/**
 * Scoring owns provenance resolution, so this pure diagnosis pass returns the
 * rule review and source-use IDs alongside an otherwise complete trace row.
 */
export interface DiagnosisTraceDraft {
  ruleId: string;
  label: string;
  component: 'diagnosis';
  matched: true;
  points: number;
  classification: DiagnosisTraceClassification;
  explanation: string;
  review: ClinicalRuleReview;
  sourceUseNoteIds: string[];
  issueId: string;
  relatedActionIds: string[];
  relatedDiagnosisIds: string[];
  relatedTreatmentIds: string[];
}

export interface DiagnosisSelectionScore {
  trace: DiagnosisTraceDraft[];
  safetyErrors: string[];
  carePointCaps: number[];
}

interface AnswerCandidate {
  kind: 'answer';
  groupId: string;
  option: DiagnosisAnswerOption;
  selection: PlayerDiagnosisSelection;
}

interface MisclassificationCandidate {
  kind: 'misclassification';
  rule: DiagnosisMisclassificationRule;
  selection: PlayerDiagnosisSelection;
}

type SelectionCandidate = AnswerCandidate | MisclassificationCandidate;

const sameStringSet = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value) => right.includes(value));

export const matchesDiagnosisSelection = (
  selection: PlayerDiagnosisSelection,
  match: DiagnosisSelectionMatch,
): boolean => {
  if (selection.diagnosisId !== match.diagnosisId) return false;
  if (match.qualifierMode === 'family') return true;

  if (match.qualifierMode === 'exact') {
    return (
      selection.severityId === match.severityId &&
      sameStringSet(selection.specifierIds, match.specifierIds)
    );
  }

  return (
    (match.severityId === null || selection.severityId === match.severityId) &&
    match.specifierIds.every((specifierId) => selection.specifierIds.includes(specifierId))
  );
};

const answerClassification = (
  grade: DiagnosisAnswerOption['grade'],
): DiagnosisTraceClassification => {
  if (grade === 'canonical') return 'diagnosis_canonical';
  if (grade === 'reasonable_alternative') return 'diagnosis_reasonable_alternative';
  return 'diagnosis_partial';
};

const misclassificationClassification = (
  severity: DiagnosisMisclassificationRule['severity'],
): DiagnosisTraceClassification => {
  if (severity === 'dangerous') return 'diagnosis_dangerous_misclassification';
  if (severity === 'major') return 'diagnosis_major_mismatch';
  return 'diagnosis_minor_mismatch';
};

const baseTrace = (
  rule: {
    id: string;
    label: string;
    explanation: string;
    issueId: string;
    review: ClinicalRuleReview;
  },
  points: number,
  classification: DiagnosisTraceClassification,
  relatedDiagnosisIds: readonly string[],
): DiagnosisTraceDraft => ({
  ruleId: rule.id,
  label: rule.label,
  component: 'diagnosis',
  matched: true,
  points,
  classification,
  explanation: rule.explanation,
  review: rule.review,
  sourceUseNoteIds: [...rule.review.sourceUseNoteIds],
  issueId: rule.issueId,
  relatedActionIds: [],
  relatedDiagnosisIds: [...relatedDiagnosisIds],
  relatedTreatmentIds: [],
});

const candidatePriority = (candidate: SelectionCandidate): number =>
  candidate.kind === 'answer'
    ? candidate.option.specificityPriority
    : candidate.rule.specificityPriority;

const candidateId = (candidate: SelectionCandidate): string =>
  candidate.kind === 'answer' ? candidate.option.id : candidate.rule.id;

const chooseMostSpecific = (
  candidates: readonly SelectionCandidate[],
): SelectionCandidate | undefined =>
  [...candidates].sort(
    (left, right) =>
      candidatePriority(right) - candidatePriority(left) ||
      candidateId(left).localeCompare(candidateId(right)),
  )[0];

const consequenceRank = (classification: DiagnosisTraceClassification): number => {
  if (classification === 'diagnosis_dangerous_misclassification') return 4;
  if (classification === 'diagnosis_major_mismatch') return 3;
  if (classification === 'diagnosis_omitted') return 2;
  if (classification === 'diagnosis_minor_mismatch') return 1;
  return 0;
};

/**
 * Error and omission rows may describe the same underlying mistake. Retain
 * only the most negative signed result; classification and stable ID break an
 * exact points tie deterministically.
 */
const dedupeWorstConsequences = (rows: readonly DiagnosisTraceDraft[]): DiagnosisTraceDraft[] => {
  const winnerByIssueId = new Map<string, DiagnosisTraceDraft>();
  for (const row of rows) {
    const existing = winnerByIssueId.get(row.issueId);
    if (
      !existing ||
      consequenceRank(row.classification) > consequenceRank(existing.classification) ||
      (consequenceRank(row.classification) === consequenceRank(existing.classification) &&
        row.points < existing.points) ||
      (consequenceRank(row.classification) === consequenceRank(existing.classification) &&
        row.points === existing.points &&
        row.ruleId.localeCompare(existing.ruleId) < 0)
    ) {
      winnerByIssueId.set(row.issueId, row);
    }
  }
  return rows.filter((row) => winnerByIssueId.get(row.issueId) === row);
};

/**
 * Grades the player's structured diagnosis answer against the frozen,
 * case-owned rubric. It never reads or changes patient diagnosis truth and it
 * never contributes to workup or treatment evaluation.
 */
export const scoreDiagnosisSelections = (
  state: EncounterState,
  catalogs: CatalogBundle,
): DiagnosisSelectionScore => {
  const rubric = state.caseInstance.diagnosisRubric;
  if (!rubric) {
    return { trace: [], safetyErrors: [], carePointCaps: [] };
  }

  const answerCandidatesByGroup = new Map<string, AnswerCandidate[]>();
  const misclassificationCandidates: MisclassificationCandidate[] = [];
  const additionalSelections: PlayerDiagnosisSelection[] = [];

  for (const selection of state.diagnosisSelections) {
    const candidates: SelectionCandidate[] = [
      ...rubric.groups.flatMap((group) =>
        group.options
          .filter((option) => matchesDiagnosisSelection(selection, option.match))
          .map<AnswerCandidate>((option) => ({
            kind: 'answer',
            groupId: group.id,
            option,
            selection,
          })),
      ),
      ...rubric.misclassificationRules
        .filter((rule) => matchesDiagnosisSelection(selection, rule.match))
        .map<MisclassificationCandidate>((rule) => ({
          kind: 'misclassification',
          rule,
          selection,
        })),
    ];
    const winner = chooseMostSpecific(candidates);
    if (!winner) {
      additionalSelections.push(selection);
    } else if (winner.kind === 'misclassification') {
      misclassificationCandidates.push(winner);
    } else {
      const groupCandidates = answerCandidatesByGroup.get(winner.groupId) ?? [];
      groupCandidates.push(winner);
      answerCandidatesByGroup.set(winner.groupId, groupCandidates);
    }
  }

  const positiveTrace: DiagnosisTraceDraft[] = [];
  const consequenceTrace: DiagnosisTraceDraft[] = [];

  for (const group of rubric.groups) {
    const groupCandidates = answerCandidatesByGroup.get(group.id) ?? [];
    const winner = [...groupCandidates].sort(
      (left, right) =>
        right.option.points - left.option.points ||
        right.option.specificityPriority - left.option.specificityPriority ||
        left.option.id.localeCompare(right.option.id),
    )[0];
    if (winner) {
      positiveTrace.push(
        baseTrace(winner.option, winner.option.points, answerClassification(winner.option.grade), [
          winner.selection.diagnosisId,
        ]),
      );
      for (const additional of groupCandidates.filter(
        (candidate) => candidate.selection.diagnosisId !== winner.selection.diagnosisId,
      )) {
        additionalSelections.push(additional.selection);
      }
    } else {
      consequenceTrace.push(
        baseTrace(group.omission, group.omission.points, 'diagnosis_omitted', []),
      );
    }
  }

  for (const candidate of misclassificationCandidates) {
    consequenceTrace.push(
      baseTrace(
        candidate.rule,
        candidate.rule.points,
        misclassificationClassification(candidate.rule.severity),
        [candidate.selection.diagnosisId],
      ),
    );
  }

  if (additionalSelections.length > 0) {
    const policy = rubric.additionalSelectionPolicy;
    const uncappedPoints = policy.pointsPerSelection * additionalSelections.length;
    const points = Math.max(-policy.maximumDeduction, uncappedPoints);
    const labels = additionalSelections.map((selection) => {
      const diagnosis = catalogs.diagnoses.find(
        (candidate) => candidate.id === selection.diagnosisId,
      );
      return diagnosis?.label ?? selection.diagnosisId;
    });
    consequenceTrace.push({
      ruleId: policy.id,
      label: policy.label,
      component: 'diagnosis',
      matched: true,
      points,
      classification: 'diagnosis_additional_selection',
      explanation: `${policy.explanation} Additional selections: ${labels.join(', ')}.`,
      review: policy.review,
      sourceUseNoteIds: [...policy.review.sourceUseNoteIds],
      issueId: policy.id,
      relatedActionIds: [],
      relatedDiagnosisIds: additionalSelections.map((selection) => selection.diagnosisId),
      relatedTreatmentIds: [],
    });
  }

  const retainedConsequences = dedupeWorstConsequences(consequenceTrace);
  const misclassificationByRuleId = new Map(
    rubric.misclassificationRules.map((rule) => [rule.id, rule]),
  );
  const retainedMisclassifications = retainedConsequences.flatMap((row) => {
    const rule = misclassificationByRuleId.get(row.ruleId);
    return rule ? [rule] : [];
  });

  return {
    trace: [...positiveTrace, ...retainedConsequences],
    safetyErrors: [
      ...new Set(
        retainedMisclassifications
          .filter((rule) => rule.severity === 'dangerous')
          .map((rule) => rule.explanation),
      ),
    ],
    carePointCaps: [
      ...new Set(
        retainedMisclassifications.flatMap((rule) =>
          rule.carePointCap === null ? [] : [rule.carePointCap],
        ),
      ),
    ],
  };
};
