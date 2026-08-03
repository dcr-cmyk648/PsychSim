import {
  EncounterStateSchema,
  PlayerDiagnosisSelectionsSchema,
  TreatmentSelectionSchema,
  type CatalogBundle,
  type ClinicState,
  type EncounterEvent,
  type EncounterState,
  type InformationActionDefinition,
  type InformationPurchase,
  type PlayerDiagnosisSelection,
  type TreatmentSelection,
} from '@psychsim/schemas';

import { hashToHex } from './rng';
import { err, ok, type Result } from './result';
import { quoteTreatmentService, resolveServiceFulfillment } from './services';
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
    diagnosisSelections: [],
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
    { informationActionId: actionId },
  );
};

interface InformationPurchaseOptions {
  initiatedBy?: InformationPurchase['initiatedBy'];
  initiatingStaffUpgradeId?: string | null;
}

export const purchaseInformationAction = (
  state: EncounterState,
  actionId: string,
  catalogs: CatalogBundle,
  options: InformationPurchaseOptions = {},
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
  const initiatedBy = options.initiatedBy ?? 'player';
  const initiatingStaffUpgradeId = options.initiatingStaffUpgradeId ?? null;
  if (
    initiatedBy === 'automatic_intake' &&
    fulfillment.value.method.requiredStaffUpgradeId !== initiatingStaffUpgradeId
  ) {
    return err({
      code: 'STAFF_AUTOMATION_INVALID',
      message: `${definition.label} is not configured for that staff workflow.`,
    });
  }
  const ordinaryFulfillment = fulfillment.value.method.requiredStaffUpgradeId
    ? resolveServiceFulfillment(
        definition.serviceId,
        state.clinicState,
        state.locationId,
        catalogs.services,
        catalogs.locations,
      )
    : null;
  const purchase: InformationPurchase = {
    actionId,
    serviceId: definition.serviceId,
    fulfillmentMethodId: fulfillment.value.method.id,
    fulfillmentLabel: fulfillment.value.method.label,
    operatingCost: fulfillment.value.method.operatingCost,
    externalCostAvoided: fulfillment.value.externalCostAvoided,
    upgradeSavings:
      ordinaryFulfillment?.ok === true
        ? Math.max(
            0,
            ordinaryFulfillment.value.method.operatingCost - fulfillment.value.method.operatingCost,
          )
        : 0,
    initiatedBy,
    initiatingStaffUpgradeId,
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

/**
 * Starts a live encounter and immediately records every configured routine
 * intake action. The primitive startEncounter remains empty for historical
 * replay; automatic purchases are ordinary persisted encounter events.
 */
export const startEncounterWithAutomaticIntake = (
  caseInstance: EncounterState['caseInstance'],
  clinicState: ClinicState,
  locationId: string,
  catalogs: CatalogBundle,
): Result<EncounterState> => {
  let state = startEncounter(caseInstance, clinicState, locationId);
  for (const configuration of clinicState.staffConfigurations) {
    const upgrade = catalogs.upgrades.find(
      (candidate) => candidate.id === configuration.staffUpgradeId,
    );
    if (
      !upgrade ||
      upgrade.kind !== 'staff' ||
      !upgrade.staffAutomation ||
      !clinicState.ownedUpgradeIds.includes(upgrade.id)
    ) {
      return err({
        code: 'STAFF_AUTOMATION_INVALID',
        message: `Clinic staff configuration ${configuration.staffUpgradeId} is not available.`,
      });
    }
    const configuredIds = new Set(configuration.automaticInformationActionIds);
    const orderedIds = upgrade.staffAutomation.eligibleInformationActionIds.filter((id) =>
      configuredIds.has(id),
    );
    for (const actionId of orderedIds) {
      if (
        !caseInstance.informationActions.some((action) => action.actionId === actionId) ||
        state.purchases.some((purchase) => purchase.actionId === actionId)
      ) {
        continue;
      }
      const purchased = purchaseInformationAction(state, actionId, catalogs, {
        initiatedBy: 'automatic_intake',
        initiatingStaffUpgradeId: upgrade.id,
      });
      if (!purchased.ok) return purchased;
      state = purchased.value;
    }
  }
  return ok(state);
};

const hasDuplicates = (values: readonly string[]): boolean =>
  new Set(values).size !== values.length;

export const updateDiagnosisSelections = (
  state: EncounterState,
  selections: readonly PlayerDiagnosisSelection[],
  catalogs: CatalogBundle,
): Result<EncounterState> => {
  if (state.status !== 'in_progress') {
    return err({ code: 'ENCOUNTER_LOCKED', message: 'This encounter has already been submitted.' });
  }
  const parsed = PlayerDiagnosisSelectionsSchema.safeParse(selections);
  if (!parsed.success) {
    return err({ code: 'INVALID_DIAGNOSIS_SELECTION', message: parsed.error.message });
  }
  for (const selection of parsed.data) {
    const definition = catalogs.diagnoses.find(
      (diagnosis) => diagnosis.id === selection.diagnosisId && diagnosis.selectableInGameplay,
    );
    if (!definition) {
      return err({
        code: 'INVALID_DIAGNOSIS_SELECTION',
        message: `Diagnosis ${selection.diagnosisId} is not available in the gameplay catalog.`,
      });
    }
    if (
      selection.severityId !== null &&
      !definition.severityAxis?.levels.some((level) => level.id === selection.severityId)
    ) {
      return err({
        code: 'INVALID_DIAGNOSIS_SELECTION',
        message: `Severity ${selection.severityId} does not belong to ${definition.label}.`,
      });
    }
    if (
      selection.severityId !== null &&
      definition.severityAxis?.playerSelectionMode === 'family_only'
    ) {
      return err({
        code: 'INVALID_DIAGNOSIS_SELECTION',
        message: `${definition.label} severity is internal generation state, not a player-facing diagnosis qualifier.`,
      });
    }
    const selectedSpecifiers = definition.specifiers.filter((specifier) =>
      selection.specifierIds.includes(specifier.id),
    );
    if (selectedSpecifiers.length !== selection.specifierIds.length) {
      return err({
        code: 'INVALID_DIAGNOSIS_SELECTION',
        message: `A selected specifier does not belong to ${definition.label}.`,
      });
    }
    if (selectedSpecifiers.some((specifier) => !specifier.playerSelectable)) {
      return err({
        code: 'INVALID_DIAGNOSIS_SELECTION',
        message: `A selected ${definition.label} specifier is internal generation state.`,
      });
    }
    const exclusiveGroups = selectedSpecifiers
      .map((specifier) => specifier.exclusiveGroupId)
      .filter((groupId): groupId is string => groupId !== null);
    if (new Set(exclusiveGroups).size !== exclusiveGroups.length) {
      return err({
        code: 'INVALID_DIAGNOSIS_SELECTION',
        message: `${definition.label} has mutually exclusive selected specifiers.`,
      });
    }
  }
  const event: EncounterEvent = {
    id: nextEventId(state.id, state.events.length),
    type: 'DiagnosisSelectionsChanged',
    selections: parsed.data,
  };
  return ok(
    EncounterStateSchema.parse({
      ...state,
      diagnosisSelections: parsed.data,
      events: [...state.events, event],
    }),
  );
};

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
  for (const treatmentId of [
    ...selections.interventionIds,
    ...(selections.dispositionId ? [selections.dispositionId] : []),
  ]) {
    const quote = quoteTreatmentService(treatmentId, state, catalogs);
    if (!quote.ok) return quote;
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
