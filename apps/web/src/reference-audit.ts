import type {
  CatalogBundle,
  CompletedAttempt,
  PlayerDiagnosisSelection,
  ReferenceSolution,
  TreatmentSelection,
} from '@psychsim/schemas';
import {
  ENGINE_VERSION,
  completeEncounter,
  purchaseInformationAction,
  startEncounterWithAutomaticIntake,
  updateDiagnosisSelections,
  updateTreatmentSelections,
} from '@psychsim/engine';

export interface AuditedReferenceInformationAction {
  id: string;
  label: string;
  operatingCost: number;
  fulfillmentLabel: string;
}

export interface AuditedReferenceTreatmentSelections {
  diagnoses: ReadonlyArray<{ id: string; label: string }>;
  startMedications: ReadonlyArray<{ id: string; label: string }>;
  stopMedications: ReadonlyArray<{ id: string; label: string }>;
  continueMedications: ReadonlyArray<{ id: string; label: string }>;
  interventions: ReadonlyArray<{ id: string; label: string }>;
  disposition: { id: string; label: string } | null;
}

interface AuditedReferenceRunBase {
  id: string;
  label: string;
  kind: ReferenceSolution['kind'];
  explanation: string;
}

export interface CompletedAuditedReferenceRun extends AuditedReferenceRunBase {
  status: 'completed';
  informationActions: readonly AuditedReferenceInformationAction[];
  selections: AuditedReferenceTreatmentSelections;
  carePoints: number;
  differenceFromDatabasePlan: number;
  workupExpense: number;
  treatmentExpense: number;
  operatingExpense: number;
  netPayout: number;
  treatmentGrade: string;
}

export interface InvalidAuditedReferenceRun extends AuditedReferenceRunBase {
  status: 'invalid';
  error: string;
}

export type AuditedReferenceRun = CompletedAuditedReferenceRun | InvalidAuditedReferenceRun;

export interface AuditedPlayerPlan {
  informationActions: readonly AuditedReferenceInformationAction[];
  selections: AuditedReferenceTreatmentSelections;
  carePoints: number;
  differenceFromDatabasePlan: number;
  workupExpense: number;
  treatmentExpense: number;
  operatingExpense: number;
  netPayout: number;
  treatmentGrade: string;
}

export interface ReferenceSolutionAudit {
  currentEngineVersion: string;
  playerPlan: AuditedPlayerPlan;
  runs: readonly AuditedReferenceRun[];
  databaseRun: CompletedAuditedReferenceRun | null;
  bestRun: CompletedAuditedReferenceRun | null;
  error: string | null;
}

const catalogLabel = (entries: ReadonlyArray<{ id: string; label: string }>, id: string): string =>
  entries.find((entry) => entry.id === id)?.label ?? id;

const treatmentSelections = (
  selections: TreatmentSelection,
  diagnosisSelections: readonly PlayerDiagnosisSelection[],
  catalogs: CatalogBundle,
): AuditedReferenceTreatmentSelections => {
  const medication = (id: string) => ({
    id,
    label: catalogLabel(catalogs.medications, id),
  });
  const intervention = (id: string) => ({
    id,
    label: catalogLabel(catalogs.treatments, id),
  });
  return {
    diagnoses: diagnosisSelections.map((selection) => ({
      id: selection.diagnosisId,
      label: catalogLabel(catalogs.diagnoses, selection.diagnosisId),
    })),
    startMedications: selections.startMedicationIds.map(medication),
    stopMedications: selections.stopMedicationIds.map(medication),
    continueMedications: selections.continueMedicationIds.map(medication),
    interventions: selections.interventionIds.map(intervention),
    disposition: selections.dispositionId ? intervention(selections.dispositionId) : null,
  };
};

const auditReferenceRun = (
  attempt: CompletedAttempt,
  solution: ReferenceSolution,
  locationId: string,
  catalogs: CatalogBundle,
): AuditedReferenceRun => {
  try {
    const started = startEncounterWithAutomaticIntake(
      attempt.caseInstance,
      attempt.clinicStateAtStart,
      locationId,
      catalogs,
    );
    if (!started.ok) throw new Error(`${started.error.code}: ${started.error.message}`);
    let state = started.value;
    for (const actionId of solution.actionIds) {
      if (state.purchases.some((purchase) => purchase.actionId === actionId)) continue;
      const purchase = purchaseInformationAction(state, actionId, catalogs);
      if (!purchase.ok) throw new Error(`${purchase.error.code}: ${purchase.error.message}`);
      state = purchase.value;
    }
    const diagnoses = updateDiagnosisSelections(state, solution.diagnosisSelections, catalogs);
    if (!diagnoses.ok) throw new Error(`${diagnoses.error.code}: ${diagnoses.error.message}`);
    state = diagnoses.value;
    const selection = updateTreatmentSelections(state, solution.selections, catalogs);
    if (!selection.ok) throw new Error(`${selection.error.code}: ${selection.error.message}`);
    const completed = completeEncounter(selection.value, catalogs);
    if (!completed.ok) throw new Error(`${completed.error.code}: ${completed.error.message}`);

    return {
      id: solution.id,
      label: solution.label,
      kind: solution.kind,
      explanation: solution.explanation,
      status: 'completed',
      informationActions: completed.value.state.purchases.map((purchase) => ({
        id: purchase.actionId,
        label: catalogLabel(catalogs.informationActions, purchase.actionId),
        operatingCost: purchase.operatingCost,
        fulfillmentLabel: purchase.fulfillmentLabel,
      })),
      selections: treatmentSelections(solution.selections, solution.diagnosisSelections, catalogs),
      carePoints: completed.value.receipt.pointReport.carePointsEarned,
      differenceFromDatabasePlan: completed.value.receipt.pointReport.differenceFromDatabasePlan,
      workupExpense: completed.value.receipt.pointReport.actualWorkupExpense,
      treatmentExpense: completed.value.receipt.settlement.treatmentExpenses,
      operatingExpense: completed.value.receipt.settlement.operatingExpenses,
      netPayout: completed.value.receipt.settlement.netClinicPointsEarned,
      treatmentGrade: completed.value.receipt.pointReport.treatmentGrade,
    };
  } catch (caught) {
    return {
      id: solution.id,
      label: solution.label,
      kind: solution.kind,
      explanation: solution.explanation,
      status: 'invalid',
      error: caught instanceof Error ? caught.message : 'Unknown reference replay error.',
    };
  }
};

const auditPlayerPlan = (
  attempt: CompletedAttempt,
  catalogs: CatalogBundle,
): AuditedPlayerPlan => ({
  informationActions: attempt.purchases.map((purchase) => ({
    id: purchase.actionId,
    label: catalogLabel(catalogs.informationActions, purchase.actionId),
    operatingCost: purchase.operatingCost,
    fulfillmentLabel: purchase.fulfillmentLabel,
  })),
  selections: treatmentSelections(attempt.submittedTreatment, attempt.submittedDiagnoses, catalogs),
  carePoints: attempt.receipt.pointReport.carePointsEarned,
  differenceFromDatabasePlan: attempt.receipt.pointReport.differenceFromDatabasePlan,
  workupExpense: attempt.receipt.pointReport.actualWorkupExpense,
  treatmentExpense: attempt.receipt.settlement.treatmentExpenses,
  operatingExpense: attempt.receipt.settlement.operatingExpenses,
  netPayout: attempt.receipt.settlement.netClinicPointsEarned,
  treatmentGrade: attempt.receipt.pointReport.treatmentGrade,
});

export const buildReferenceSolutionAudit = (
  attempt: CompletedAttempt,
  catalogs: CatalogBundle,
): ReferenceSolutionAudit => {
  const playerPlan = auditPlayerPlan(attempt, catalogs);
  const started = attempt.events.find((event) => event.type === 'EncounterStarted');
  if (!started || started.type !== 'EncounterStarted') {
    return {
      currentEngineVersion: ENGINE_VERSION,
      playerPlan,
      runs: [],
      databaseRun: null,
      bestRun: null,
      error: 'The completed attempt does not contain its encounter location.',
    };
  }
  const runs = attempt.caseInstance.referenceSolutions.map((solution) =>
    auditReferenceRun(attempt, solution, started.locationId, catalogs),
  );
  const completedRuns = runs.filter(
    (run): run is CompletedAuditedReferenceRun => run.status === 'completed',
  );
  const bestRun =
    [...completedRuns].sort(
      (left, right) =>
        right.netPayout - left.netPayout ||
        right.carePoints - left.carePoints ||
        left.workupExpense - right.workupExpense ||
        left.id.localeCompare(right.id),
    )[0] ?? null;
  const databaseRun = completedRuns.find((run) => run.kind === 'database_plan') ?? bestRun;
  return {
    currentEngineVersion: ENGINE_VERSION,
    playerPlan,
    runs,
    databaseRun,
    bestRun,
    error: bestRun ? null : 'No declared reference playthrough completed successfully.',
  };
};
