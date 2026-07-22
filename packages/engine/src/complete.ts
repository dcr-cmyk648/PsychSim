import {
  EncounterStateSchema,
  type CaseReceipt,
  type CatalogBundle,
  type EncounterState,
} from '@psychsim/schemas';

import { calculateSettlement } from './economy';
import { submitEncounter } from './encounter';
import { buildCaseReceipt } from './receipt';
import { ok, type Result } from './result';
import { hashToHex } from './rng';
import { scoreEncounter } from './scoring';

export interface CompletedEncounterResult {
  state: EncounterState;
  receipt: CaseReceipt;
}

export const completeEncounter = (
  state: EncounterState,
  catalogs: CatalogBundle,
): Result<CompletedEncounterResult> => {
  const submitted = submitEncounter(state);
  if (!submitted.ok) return submitted;
  const scored = scoreEncounter(submitted.value, catalogs);
  if (!scored.ok) return scored;
  const settlement = calculateSettlement(
    scored.value,
    submitted.value.clinicState,
    submitted.value.caseInstance,
  );
  const receipt = buildCaseReceipt(submitted.value, scored.value, settlement, catalogs);
  const suffix = hashToHex(submitted.value.id);
  const events = [
    ...submitted.value.events,
    {
      id: `event.${suffix}.${submitted.value.events.length + 1}`,
      type: 'CarePointsCalculated' as const,
      carePoints: scored.value.carePointsEarned,
    },
    {
      id: `event.${suffix}.${submitted.value.events.length + 2}`,
      type: 'SettlementCalculated' as const,
      payout: settlement.netClinicPointsEarned,
    },
  ];
  const finalState = EncounterStateSchema.parse({ ...submitted.value, events });
  return ok({ state: finalState, receipt });
};

export const requireCompleted = <T>(result: Result<T>): T => {
  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`);
  }
  return result.value;
};
