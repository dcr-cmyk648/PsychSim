import {
  CaseReceiptSchema,
  type CaseReceipt,
  type CatalogBundle,
  type ClinicalPointReport,
  type EconomySettlement,
  type EncounterState,
  type PlayerDiagnosisSelection,
  type ReceiptItem,
} from '@psychsim/schemas';

import { extractPredicateReferences } from './predicates';
import type { TreatmentOperatingCostQuote } from './services';

const labelForTreatment = (id: string, catalogs: CatalogBundle): string =>
  catalogs.medications.find((item) => item.id === id)?.label ??
  catalogs.treatments.find((item) => item.id === id)?.label ??
  id;

const labelForDiagnosis = (id: string, catalogs: CatalogBundle): string =>
  catalogs.diagnoses.find((item) => item.id === id)?.label ?? id;

const labelForDiagnosisSelection = (
  selection: PlayerDiagnosisSelection,
  catalogs: CatalogBundle,
): string => {
  const diagnosis = catalogs.diagnoses.find((item) => item.id === selection.diagnosisId);
  if (!diagnosis) return selection.diagnosisId;
  const qualifiers = [
    selection.severityId
      ? (diagnosis.severityAxis?.levels.find((level) => level.id === selection.severityId)?.label ??
        selection.severityId)
      : null,
    ...selection.specifierIds.map(
      (specifierId) =>
        diagnosis.specifiers.find((specifier) => specifier.id === specifierId)?.label ??
        specifierId,
    ),
  ].filter((label): label is string => label !== null);
  return qualifiers.length > 0 ? `${diagnosis.label} — ${qualifiers.join('; ')}` : diagnosis.label;
};

const traceForAction = (actionId: string, pointReport: ClinicalPointReport) =>
  pointReport.ruleTrace.filter((trace) => {
    const assignedActionId =
      trace.points < 0 ? trace.relatedActionIds.at(-1) : trace.relatedActionIds[0];
    return assignedActionId === actionId;
  });

const categoryForComponent = (
  component: ClinicalPointReport['ruleTrace'][number]['component'] | undefined,
): ReceiptItem['scoreCategory'] => {
  if (component === 'diagnosis') return 'diagnosis';
  if (component === 'efficiency') return 'efficiency';
  if (component === 'nonmedication') return 'nonmedication';
  if (component === 'disposition') return 'disposition';
  if (component === 'medication_discontinuation') return 'medication_change';
  if (component === 'safety') return 'interaction_modifier';
  if (component === 'medication_selection') return 'patient_fit_modifier';
  return 'workup';
};

const kindForComponent = (
  component: ClinicalPointReport['ruleTrace'][number]['component'],
): ReceiptItem['kind'] => {
  if (component === 'diagnosis') return 'diagnosis';
  if (component === 'nonmedication') return 'nonmedication';
  if (component === 'disposition') return 'disposition';
  if (component === 'workup' || component === 'efficiency') return 'information';
  return 'treatment';
};

const actionMatchesPath = (
  actionId: string,
  state: EncounterState,
  pathId: string | null,
): boolean => {
  const path = state.caseInstance.treatmentPathways.find((candidate) => candidate.id === pathId);
  if (!path) return false;
  const objectiveIds = new Set([
    ...path.requiredWorkupObjectiveIds,
    ...path.conditionalRequirements.map((requirement) => requirement.objectiveId),
  ]);
  return state.caseInstance.workupObjectives
    .filter((objective) => objectiveIds.has(objective.id))
    .some((objective) =>
      extractPredicateReferences(objective.satisfaction).actionIds.includes(actionId),
    );
};

export const buildCaseReceipt = (
  state: EncounterState,
  pointReport: ClinicalPointReport,
  settlement: EconomySettlement,
  catalogs: CatalogBundle,
  treatmentQuote: TreatmentOperatingCostQuote = { items: [], totalOperatingCost: 0 },
): CaseReceipt => {
  const informationItems: ReceiptItem[] = state.purchases.map((purchase) => {
    const caseAction = state.caseInstance.informationActions.find(
      (candidate) => candidate.actionId === purchase.actionId,
    );
    const definition = catalogs.informationActions.find(
      (candidate) => candidate.id === purchase.actionId,
    );
    const traces = traceForAction(purchase.actionId, pointReport);
    const materialTrace = traces.find((trace) => trace.points !== 0) ?? traces[0];
    return {
      id: `receipt.${purchase.actionId}`,
      itemName: definition?.label ?? purchase.actionId,
      kind: 'information',
      fulfillmentMethod:
        purchase.initiatedBy === 'automatic_intake'
          ? `Automatic intake · ${purchase.fulfillmentLabel}`
          : purchase.fulfillmentLabel,
      operatingCost: purchase.operatingCost,
      pointDelta: traces.reduce((sum, trace) => sum + trace.points, 0),
      scoreCategory: categoryForComponent(materialTrace?.component),
      classification:
        materialTrace?.classification ?? caseAction?.defaultClassification ?? 'defensible',
      explanation:
        materialTrace?.explanation ??
        'Result revealed immediately; the database plan assigns no additional care points.',
      acceptedPathwayMatch: actionMatchesPath(
        purchase.actionId,
        state,
        pointReport.selectedPathwayId,
      ),
      externalCostAvoided: purchase.externalCostAvoided,
      upgradeSavings: purchase.upgradeSavings,
      relatedRuleIds: traces.map((trace) => trace.ruleId),
    };
  });

  const diagnosisItems: ReceiptItem[] = state.diagnosisSelections.map((selection, index) => {
    const traces = pointReport.ruleTrace.filter(
      (trace) =>
        trace.component === 'diagnosis' &&
        trace.relatedDiagnosisIds.includes(selection.diagnosisId) &&
        state.diagnosisSelections.findIndex((candidate) =>
          trace.relatedDiagnosisIds.includes(candidate.diagnosisId),
        ) === index,
    );
    const materialTrace = traces.find((trace) => trace.points !== 0) ?? traces[0];
    return {
      id: `receipt.diagnosis-${index + 1}`,
      itemName: `Diagnosis: ${labelForDiagnosisSelection(selection, catalogs)}`,
      kind: 'diagnosis',
      fulfillmentMethod: 'Player diagnosis selection',
      operatingCost: 0,
      pointDelta: traces.reduce((sum, trace) => sum + trace.points, 0),
      scoreCategory: 'diagnosis',
      classification: materialTrace?.classification ?? 'diagnosis_not_scored',
      explanation:
        materialTrace?.explanation ??
        'The diagnosis selection was preserved, but this case has no separate point rule for it.',
      acceptedPathwayMatch:
        materialTrace?.classification === 'diagnosis_canonical' ||
        materialTrace?.classification === 'diagnosis_reasonable_alternative' ||
        materialTrace?.classification === 'diagnosis_partial',
      externalCostAvoided: 0,
      upgradeSavings: 0,
      relatedRuleIds: traces.map((trace) => trace.ruleId),
    };
  });

  const selectionRows: Array<{ id: string; kind: ReceiptItem['kind']; prefix: string }> = [
    ...state.selections.startMedicationIds.map((id) => ({
      id,
      kind: 'treatment' as const,
      prefix: 'Start',
    })),
    ...state.selections.stopMedicationIds.map((id) => ({
      id,
      kind: 'treatment' as const,
      prefix: 'Stop',
    })),
    ...state.selections.continueMedicationIds.map((id) => ({
      id,
      kind: 'treatment' as const,
      prefix: 'Continue',
    })),
    ...state.selections.interventionIds.map((id) => ({
      id,
      kind: 'nonmedication' as const,
      prefix: 'Add',
    })),
    ...(state.selections.dispositionId
      ? [
          {
            id: state.selections.dispositionId,
            kind: 'disposition' as const,
            prefix: 'Disposition',
          },
        ]
      : []),
  ];
  const gradeTrace = pointReport.ruleTrace.find((trace) => trace.ruleId.startsWith('grade.'));
  const safetyTraces = pointReport.ruleTrace.filter(
    (trace) => trace.component === 'safety' && trace.points !== 0,
  );
  const combinationItems: ReceiptItem[] = [
    ...(gradeTrace
      ? [
          {
            id: 'receipt.treatment-combination',
            itemName: 'Base treatment fit',
            kind: 'treatment' as const,
            fulfillmentMethod: 'Combination evaluation',
            operatingCost: 0,
            pointDelta: gradeTrace.points,
            scoreCategory: 'base_treatment' as const,
            classification: gradeTrace.classification,
            explanation: gradeTrace.explanation,
            acceptedPathwayMatch: pointReport.selectedPathwayId !== null,
            externalCostAvoided: 0,
            upgradeSavings: 0,
            relatedRuleIds: [gradeTrace.ruleId],
          },
        ]
      : []),
    ...(safetyTraces.length
      ? [
          {
            id: 'receipt.combination-safety',
            itemName: 'Interaction and combination safety',
            kind: 'treatment' as const,
            fulfillmentMethod: 'Combination evaluation',
            operatingCost: 0,
            pointDelta: safetyTraces.reduce((sum, trace) => sum + trace.points, 0),
            scoreCategory: 'interaction_modifier' as const,
            classification: safetyTraces[0]?.classification ?? 'safe',
            explanation:
              safetyTraces.find((trace) => trace.points < 0)?.explanation ??
              safetyTraces[0]?.explanation ??
              'The complete medication combination was evaluated for safety.',
            acceptedPathwayMatch: pointReport.selectedPathwayId !== null,
            externalCostAvoided: 0,
            upgradeSavings: 0,
            relatedRuleIds: safetyTraces.map((trace) => trace.ruleId),
          },
        ]
      : []),
  ];
  const treatmentItems: ReceiptItem[] = selectionRows.map((selection, index) => {
    const traces = pointReport.ruleTrace.filter(
      (trace) =>
        !trace.ruleId.startsWith('grade.') &&
        trace.component !== 'safety' &&
        trace.relatedActionIds.length === 0 &&
        trace.relatedTreatmentIds.includes(selection.id) &&
        selectionRows.findIndex((row) => trace.relatedTreatmentIds.includes(row.id)) === index,
    );
    const materialTrace = traces.find((trace) => trace.points !== 0) ?? traces[0];
    const emptyExplanation =
      selection.kind === 'treatment'
        ? 'Included in the base treatment evaluation. No separate patient-specific modifier applies.'
        : 'Recorded in the final treatment combination.';
    const serviceQuote = treatmentQuote.items.find(
      (quote) => quote.treatmentId === selection.id && quote.kind === selection.kind,
    );
    return {
      id: `receipt.selection-${index + 1}`,
      itemName: `${selection.prefix}: ${labelForTreatment(selection.id, catalogs)}`,
      kind: selection.kind,
      fulfillmentMethod: serviceQuote?.fulfillmentLabel ?? 'Player selection',
      operatingCost: serviceQuote?.operatingCost ?? 0,
      pointDelta: traces.reduce((sum, trace) => sum + trace.points, 0),
      scoreCategory:
        selection.kind === 'nonmedication'
          ? 'nonmedication'
          : selection.kind === 'disposition'
            ? 'disposition'
            : materialTrace?.component === 'medication_discontinuation'
              ? 'medication_change'
              : 'patient_fit_modifier',
      classification: materialTrace?.classification ?? 'safe',
      explanation: materialTrace?.explanation ?? emptyExplanation,
      acceptedPathwayMatch: pointReport.selectedPathwayId !== null,
      externalCostAvoided: serviceQuote?.externalCostAvoided ?? 0,
      upgradeSavings: 0,
      relatedRuleIds: traces.map((trace) => trace.ruleId),
    };
  });

  const directlyItemized = [
    ...informationItems,
    ...diagnosisItems,
    ...combinationItems,
    ...treatmentItems,
  ];
  const representedRuleIds = new Set(directlyItemized.flatMap((item) => item.relatedRuleIds));
  const appliedRuleItems: ReceiptItem[] = pointReport.ruleTrace
    .filter((trace) => trace.points !== 0 && !representedRuleIds.has(trace.ruleId))
    .map((trace) => {
      const actionId = trace.relatedActionIds.at(-1);
      const treatmentId = trace.relatedTreatmentIds[0];
      const diagnosisId = trace.relatedDiagnosisIds[0];
      const actionLabel = actionId
        ? catalogs.informationActions.find((action) => action.id === actionId)?.label
        : undefined;
      return {
        id: `receipt.applied-rule.${trace.ruleId}`,
        itemName:
          trace.points < 0 && trace.component === 'workup'
            ? `Missed: ${trace.label}`
            : (actionLabel ??
              (diagnosisId
                ? labelForDiagnosis(diagnosisId, catalogs)
                : treatmentId
                  ? labelForTreatment(treatmentId, catalogs)
                  : trace.label)),
        kind: kindForComponent(trace.component),
        fulfillmentMethod: 'Applied rule',
        operatingCost: 0,
        pointDelta: trace.points,
        scoreCategory: categoryForComponent(trace.component),
        classification: trace.classification,
        explanation: trace.explanation,
        acceptedPathwayMatch:
          actionId !== undefined &&
          actionMatchesPath(actionId, state, pointReport.selectedPathwayId),
        externalCostAvoided: 0,
        upgradeSavings: 0,
        relatedRuleIds: [trace.ruleId],
      };
    });

  const itemizedPointTotal = [...directlyItemized, ...appliedRuleItems].reduce(
    (sum, item) => sum + item.pointDelta,
    0,
  );
  const scoreAdjustment = pointReport.carePointsEarned - itemizedPointTotal;
  const scoreAdjustmentItems: ReceiptItem[] =
    scoreAdjustment === 0
      ? []
      : [
          {
            id: 'receipt.score-cap-or-floor',
            itemName: 'Score cap or floor adjustment',
            kind: 'treatment',
            fulfillmentMethod: 'Final score reconciliation',
            operatingCost: 0,
            pointDelta: scoreAdjustment,
            scoreCategory: 'interaction_modifier',
            classification: scoreAdjustment < 0 ? 'safety_cap' : 'score_floor',
            explanation:
              scoreAdjustment < 0
                ? 'The final safety cap reduced the sum of otherwise applicable point effects.'
                : 'The final score floor prevented the total from falling below its allowed minimum.',
            acceptedPathwayMatch: false,
            externalCostAvoided: 0,
            upgradeSavings: 0,
            relatedRuleIds: [],
          },
        ];

  return CaseReceiptSchema.parse({
    schemaVersion: 1,
    pointReport,
    settlement,
    items: [...directlyItemized, ...appliedRuleItems, ...scoreAdjustmentItems],
  });
};
