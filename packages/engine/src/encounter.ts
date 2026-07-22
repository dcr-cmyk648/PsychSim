import {
  EncounterStateSchema,
  TreatmentSelectionSchema,
  type CatalogBundle,
  type ClinicState,
  type EncounterEvent,
  type EncounterState,
  type InformationActionDefinition,
  type TreatmentSelection,
} from '@psychsim/schemas';

import { hashToHex } from './rng';
import { err, ok, type Result } from './result';
import { resolveServiceFulfillment } from './services';
import { getAvailableStartMedicationIds } from './formulary';

export const EMPTY_TREATMENT_SELECTIONS: TreatmentSelection = {
  startMedicationIds: [],
  stopMedicationIds: [],
  continueMedicationIds: [],
  interventionIds: [],
  dispositionId: null,
};

const nextEventId = (stateId: string, eventCount: number): string =>
  `event.${hashToHex(stateId)}.${eventCount + 1}`;

export const startEncounter = (
  caseInstance: EncounterState['caseInstance'],
  clinicState: ClinicState,
  locationId: string,
): EncounterState => {
  const id = `encounter.${hashToHex(`${caseInstance.id}:${locationId}`)}`;
  const started: EncounterEvent = {
    id: `event.${hashToHex(id)}.1`,
    type: 'EncounterStarted',
    caseInstanceId: caseInstance.id,
    locationId,
  };
  return EncounterStateSchema.parse({
    schemaVersion: 1,
    id,
    status: 'in_progress',
    caseInstance,
    clinicState,
    locationId,
    purchases: [],
    knownFactIds: [],
    selections: EMPTY_TREATMENT_SELECTIONS,
    expenseTotal: 0,
    events: [started],
  });
};

export const getAvailableInformationActions = (
  state: EncounterState,
  catalogs: CatalogBundle,
): InformationActionDefinition[] =>
  catalogs.informationActions.filter(
    (definition) =>
      state.caseInstance.informationActions.some(
        (caseAction) => caseAction.actionId === definition.id,
      ) &&
      (definition.repeatable ||
        !state.purchases.some((purchase) => purchase.actionId === definition.id)),
  );

export const getInformationActionQuote = (
  state: EncounterState,
  actionId: string,
  catalogs: CatalogBundle,
) => {
  const caseAction = state.caseInstance.informationActions.find(
    (candidate) => candidate.actionId === actionId,
  );
  const definition = catalogs.informationActions.find((candidate) => candidate.id === actionId);
  if (!caseAction || !definition)
    return err({ code: 'ACTION_NOT_FOUND' as const, message: `Unknown action: ${actionId}` });
  return resolveServiceFulfillment(
    definition.serviceId,
    state.clinicState,
    state.locationId,
    catalogs.services,
    catalogs.locations,
  );
};

export const purchaseInformationAction = (
  state: EncounterState,
  actionId: string,
  catalogs: CatalogBundle,
): Result<EncounterState> => {
  if (state.status !== 'in_progress') {
    return err({ code: 'ENCOUNTER_LOCKED', message: 'This encounter has already been submitted.' });
  }
  const caseAction = state.caseInstance.informationActions.find(
    (candidate) => candidate.actionId === actionId,
  );
  const definition = catalogs.informationActions.find((candidate) => candidate.id === actionId);
  if (!caseAction || !definition)
    return err({ code: 'ACTION_NOT_FOUND', message: `Unknown action: ${actionId}` });
  if (
    !definition.repeatable &&
    state.purchases.some((purchase) => purchase.actionId === actionId)
  ) {
    return err({
      code: 'ACTION_ALREADY_PURCHASED',
      message: `${definition.label} cannot be purchased twice.`,
    });
  }
  const fulfillment = getInformationActionQuote(state, actionId, catalogs);
  if (!fulfillment.ok) return fulfillment;
  const purchase = {
    actionId,
    serviceId: definition.serviceId,
    fulfillmentMethodId: fulfillment.value.method.id,
    fulfillmentLabel: fulfillment.value.method.label,
    operatingCost: fulfillment.value.method.operatingCost,
    externalCostAvoided: fulfillment.value.externalCostAvoided,
    result: caseAction.result,
  };
  const event: EncounterEvent = {
    id: nextEventId(state.id, state.events.length),
    type: 'InformationPurchased',
    purchase,
  };
  return ok(
    EncounterStateSchema.parse({
      ...state,
      purchases: [...state.purchases, purchase],
      knownFactIds: [...new Set([...state.knownFactIds, ...caseAction.result.factsRevealed])],
      expenseTotal: state.expenseTotal + purchase.operatingCost,
      events: [...state.events, event],
    }),
  );
};

const hasDuplicates = (values: readonly string[]): boolean =>
  new Set(values).size !== values.length;

export const updateTreatmentSelections = (
  state: EncounterState,
  selections: TreatmentSelection,
  catalogs: CatalogBundle,
): Result<EncounterState> => {
  if (state.status !== 'in_progress') {
    return err({ code: 'ENCOUNTER_LOCKED', message: 'This encounter has already been submitted.' });
  }
  const parsed = TreatmentSelectionSchema.safeParse(selections);
  if (!parsed.success) {
    return err({ code: 'INVALID_TREATMENT_SELECTION', message: parsed.error.message });
  }
  const available = state.caseInstance.availableTreatments;
  const availableStartMedicationIds = getAvailableStartMedicationIds(
    state.caseInstance,
    state.clinicState,
    state.locationId,
    catalogs,
  );
  const valid =
    selections.startMedicationIds.every((id) => availableStartMedicationIds.includes(id)) &&
    selections.stopMedicationIds.every((id) => available.stopMedicationIds.includes(id)) &&
    selections.continueMedicationIds.every((id) => available.continueMedicationIds.includes(id)) &&
    selections.interventionIds.every((id) => available.interventionIds.includes(id)) &&
    (selections.dispositionId === null ||
      available.dispositionIds.includes(selections.dispositionId)) &&
    !hasDuplicates(selections.startMedicationIds) &&
    !hasDuplicates(selections.stopMedicationIds) &&
    !hasDuplicates(selections.continueMedicationIds) &&
    !hasDuplicates(selections.interventionIds) &&
    [...selections.startMedicationIds, ...selections.stopMedicationIds].every(
      (id) => !selections.continueMedicationIds.includes(id),
    ) &&
    selections.startMedicationIds.every((id) => !selections.stopMedicationIds.includes(id));
  if (!valid) {
    return err({
      code: 'INVALID_TREATMENT_SELECTION',
      message: 'A treatment selection is unavailable or duplicated for this case.',
    });
  }
  const event: EncounterEvent = {
    id: nextEventId(state.id, state.events.length),
    type: 'TreatmentSelectionsChanged',
    selections,
  };
  return ok(EncounterStateSchema.parse({ ...state, selections, events: [...state.events, event] }));
};

export const submitEncounter = (state: EncounterState): Result<EncounterState> => {
  if (state.status !== 'in_progress') {
    return err({ code: 'ENCOUNTER_LOCKED', message: 'This encounter has already been submitted.' });
  }
  const event: EncounterEvent = {
    id: nextEventId(state.id, state.events.length),
    type: 'EncounterSubmitted',
  };
  return ok(
    EncounterStateSchema.parse({
      ...state,
      status: 'submitted',
      events: [...state.events, event],
    }),
  );
};
