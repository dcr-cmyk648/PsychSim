import type { CaseBlueprint, CaseReceipt, ClinicState, ReferenceSolution } from '@psychsim/schemas';
import {
  completeEncounter,
  instantiateCase,
  purchaseInformationAction,
  requireCompleted,
  purchaseUpgrade,
  startEncounterWithAutomaticIntake,
  updateTreatmentSelections,
} from '@psychsim/engine';

import {
  approvedCaseBlueprints,
  catalogs,
  medicationCheckPalpitationsBlueprint,
  prototypeCaseBlueprint,
  startingClinic,
} from './content';

export interface ReferenceRunResult {
  id: string;
  label: string;
  kind: ReferenceSolution['kind'];
  receipt: CaseReceipt;
}

export const runReferenceSolution = (
  solution: ReferenceSolution,
  seed = 'reference-run-v1',
  blueprint: CaseBlueprint = prototypeCaseBlueprint,
  clinic: ClinicState = startingClinic,
): ReferenceRunResult => {
  const instance = instantiateCase(blueprint, seed, catalogs);
  let state = requireCompleted(
    startEncounterWithAutomaticIntake(instance, clinic, clinic.activeLocationId, catalogs),
  );
  for (const actionId of solution.actionIds) {
    if (state.purchases.some((purchase) => purchase.actionId === actionId)) continue;
    state = requireCompleted(purchaseInformationAction(state, actionId, catalogs));
  }
  state = requireCompleted(updateTreatmentSelections(state, solution.selections, catalogs));
  const completed = requireCompleted(completeEncounter(state, catalogs));
  return {
    id: solution.id,
    label: solution.label,
    kind: solution.kind,
    receipt: completed.receipt,
  };
};

export const runAllReferenceSolutions = (): ReferenceRunResult[] =>
  prototypeCaseBlueprint.referenceSolutions.map((solution) => runReferenceSolution(solution));

export const runReferenceSolutionsForCase = (
  blueprint: CaseBlueprint,
  clinic: ClinicState = startingClinic,
): ReferenceRunResult[] =>
  blueprint.referenceSolutions.map((solution) =>
    runReferenceSolution(solution, 'reference-run-v1', blueprint, clinic),
  );

export const runAllApprovedReferenceSolutions = (): ReadonlyArray<{
  blueprintId: string;
  runs: ReferenceRunResult[];
}> =>
  approvedCaseBlueprints.map((blueprint) => ({
    blueprintId: blueprint.id,
    runs: runReferenceSolutionsForCase(blueprint),
  }));

export const runEcgOwnershipComparison = () => {
  const solution = medicationCheckPalpitationsBlueprint.referenceSolutions.find(
    (candidate) => candidate.kind === 'database_plan',
  );
  if (!solution) throw new Error('ECG comparison requires a database-plan reference solution.');
  const fundedClinic = { ...startingClinic, clinicPoints: 2_000 };
  const ownedClinic = requireCompleted(
    purchaseUpgrade(fundedClinic, 'upgrade.equipment.ecg', catalogs),
  );
  return {
    outside: runReferenceSolution(
      solution,
      'ecg-ownership-comparison',
      medicationCheckPalpitationsBlueprint,
      fundedClinic,
    ),
    inHouse: runReferenceSolution(
      solution,
      'ecg-ownership-comparison',
      medicationCheckPalpitationsBlueprint,
      ownedClinic,
    ),
  };
};
