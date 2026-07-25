import {
  CaseReceiptSchema,
  type CaseReceipt,
  type CatalogBundle,
  type ClinicalPointReport,
  type EconomySettlement,
  type EncounterState,
  type ReceiptItem,
} from '@psychsim/schemas';

import { extractPredicateReferences } from './predicates';
import type { TreatmentOperatingCostQuote } from './services';

const labelForTreatment = (id: string, catalogs: CatalogBundle): string =>
  catalogs.medications.find((item) => item.id === id)?.label ??
  catalogs.treatments.find((item) => item.id === id)?.label ??
  id;

const traceForAction = (actionId: string, pointReport: ClinicalPointReport) =>
  pointReport.ruleTrace.filter((trace) => {
    const assignedActionId =
      trace.points < 0 ? trace.relatedActionIds.at(-1) : trace.relatedActionIds[0];
    return assignedActionId === actionId;
  });

const categoryForComponent = (
  component: ClinicalPointReport['ruleTrace'][number]['component'] | undefined,
): ReceiptItem['scoreCategory'] => {
  if (component === 'efficiency') return 'efficiency';
  if (component === 'nonmedication') return 'nonmedication';
  if (component === 'disposition') return 'disposition';
  if (component === 'medication_discontinuation') return 'medication_change';
  if (component === 'safety') return 'interaction_modifier';
  return 'workup';
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
    };
  });

  return CaseReceiptSchema.parse({
    schemaVersion: 1,
    pointReport,
    settlement,
    items: [...informationItems, ...combinationItems, ...treatmentItems],
  });
};
