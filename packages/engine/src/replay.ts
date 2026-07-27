import type { CatalogBundle, ClinicState, EncounterEvent, EncounterState } from '@psychsim/schemas';

import {
  purchaseInformationAction,
  startEncounter,
  submitEncounter,
  updateDiagnosisSelections,
  updateTreatmentSelections,
} from './encounter';
import { err, ok, type Result } from './result';

export const replayEncounter = (
  caseInstance: EncounterState['caseInstance'],
  clinicState: ClinicState,
  events: readonly EncounterEvent[],
  catalogs: CatalogBundle,
): Result<EncounterState> => {
  const start = events.find((event) => event.type === 'EncounterStarted');
  if (!start || start.type !== 'EncounterStarted') {
    return err({ code: 'REPLAY_FAILED', message: 'Encounter history has no start event.' });
  }
  let state = startEncounter(caseInstance, clinicState, start.locationId);
  for (const event of events.slice(1)) {
    if (event.type === 'InformationPurchased') {
      const next = purchaseInformationAction(state, event.purchase.actionId, catalogs, {
        initiatedBy: event.purchase.initiatedBy,
        initiatingStaffUpgradeId: event.purchase.initiatingStaffUpgradeId,
      });
      if (!next.ok) return err({ code: 'REPLAY_FAILED', message: next.error.message });
      state = next.value;
    } else if (event.type === 'TreatmentSelectionsChanged') {
      const next = updateTreatmentSelections(state, event.selections, catalogs);
      if (!next.ok) return err({ code: 'REPLAY_FAILED', message: next.error.message });
      state = next.value;
    } else if (event.type === 'DiagnosisSelectionsChanged') {
      const next = updateDiagnosisSelections(state, event.selections, catalogs);
      if (!next.ok) return err({ code: 'REPLAY_FAILED', message: next.error.message });
      state = next.value;
    } else if (event.type === 'EncounterSubmitted' && state.status === 'in_progress') {
      const next = submitEncounter(state);
      if (!next.ok) return err({ code: 'REPLAY_FAILED', message: next.error.message });
      state = next.value;
    }
  }
  return ok(state);
};
