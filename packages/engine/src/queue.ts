import {
  PatientQueueSlotSchema,
  PatientQueueStateSchema,
  type CaseBlueprint,
  type CatalogBundle,
  type ClinicState,
  type PatientQueueSlot,
  type PatientQueueState,
  type ProgressionMode,
} from '@psychsim/schemas';

import { instantiateCase } from './case';
import { evaluateCaseEligibility } from './eligibility';
import { getPatientSlotCount } from './progression';

export const emptyPatientQueueState = (): PatientQueueState =>
  PatientQueueStateSchema.parse({
    schemaVersion: 1,
    generation: 0,
    standardSlots: [],
    endgameSlots: [],
    developerSlots: [],
    developerRunBlueprintIds: [],
    recentChiefComplaints: [],
  });

const queueKeyFor = (mode: ProgressionMode): 'standardSlots' | 'endgameSlots' | 'developerSlots' =>
  mode === 'standard' ? 'standardSlots' : mode === 'endgame' ? 'endgameSlots' : 'developerSlots';

const normalizeComplaint = (complaint: string): string => complaint.trim().toLocaleLowerCase();

const eligibleLocationId = (
  blueprint: CaseBlueprint,
  clinic: ClinicState,
  catalogs: CatalogBundle,
  seed: string,
): { caseInstance: ReturnType<typeof instantiateCase>; locationId: string } | null => {
  const caseInstance = instantiateCase(blueprint, seed, catalogs);
  const locationId = clinic.locationIds.find(
    (candidate) =>
      caseInstance.metadata.compatibleLocationIds.includes(candidate) &&
      evaluateCaseEligibility(caseInstance, clinic, candidate, catalogs).eligible,
  );
  return locationId ? { caseInstance, locationId } : null;
};

const makeSlot = (
  mode: ProgressionMode,
  blueprint: CaseBlueprint,
  clinic: ClinicState,
  catalogs: CatalogBundle,
  generation: number,
  slotOrdinal: number,
  complaintsInUse: Set<string>,
): PatientQueueSlot | null => {
  for (let variation = 0; variation < 64; variation += 1) {
    const seed = `queue.${mode}.${generation}.${slotOrdinal}.${blueprint.id}.${variation}`;
    const eligible = eligibleLocationId(blueprint, clinic, catalogs, seed);
    if (!eligible) return null;
    const complaintKey = normalizeComplaint(eligible.caseInstance.opening.chiefComplaint);
    if (complaintsInUse.has(complaintKey) && variation < 63) continue;
    complaintsInUse.add(complaintKey);
    return PatientQueueSlotSchema.parse({
      schemaVersion: 1,
      id: `slot.${mode}.${slotOrdinal}`,
      mode,
      locationId: eligible.locationId,
      caseInstance: eligible.caseInstance,
    });
  }
  return null;
};

const fillMode = (
  mode: ProgressionMode,
  existing: readonly PatientQueueSlot[],
  state: PatientQueueState,
  clinic: ClinicState,
  blueprints: readonly CaseBlueprint[],
  catalogs: CatalogBundle,
): PatientQueueSlot[] => {
  const run = new Set(state.developerRunBlueprintIds);
  const pool =
    mode === 'developer'
      ? blueprints.filter((blueprint) => !run.has(blueprint.id))
      : [...blueprints];
  if (pool.length === 0) return [];
  const desiredCount =
    mode === 'developer' ? pool.length : getPatientSlotCount(clinic, mode, catalogs);
  const slots = mode === 'developer' ? [] : [...existing].slice(0, desiredCount);
  const complaintsInUse = new Set(
    [
      ...state.recentChiefComplaints,
      ...slots.map((slot) => slot.caseInstance.opening.chiefComplaint),
    ].map(normalizeComplaint),
  );
  const existingDeveloperBlueprints = new Set(
    existing.map((slot) => slot.caseInstance.blueprintId),
  );
  if (mode === 'developer') {
    slots.push(
      ...existing.filter(
        (slot) =>
          !run.has(slot.caseInstance.blueprintId) &&
          pool.some((b) => b.id === slot.caseInstance.blueprintId),
      ),
    );
    for (const slot of slots)
      complaintsInUse.add(normalizeComplaint(slot.caseInstance.opening.chiefComplaint));
  }

  let attempt = 0;
  while (slots.length < desiredCount && attempt < desiredCount * Math.max(4, pool.length * 2)) {
    const blueprint = pool[(state.generation + slots.length + attempt) % pool.length]!;
    attempt += 1;
    if (mode === 'developer' && existingDeveloperBlueprints.has(blueprint.id)) continue;
    const slot = makeSlot(
      mode,
      blueprint,
      clinic,
      catalogs,
      state.generation,
      slots.length + 1,
      complaintsInUse,
    );
    if (!slot) continue;
    slots.push(slot);
    existingDeveloperBlueprints.add(blueprint.id);
  }
  return slots;
};

export interface QueueBlueprintPools {
  approved: readonly CaseBlueprint[];
  developer: readonly CaseBlueprint[];
}

export const ensurePatientQueues = (
  state: PatientQueueState,
  standardClinic: ClinicState,
  endgameClinic: ClinicState,
  pools: QueueBlueprintPools,
  catalogs: CatalogBundle,
): PatientQueueState =>
  PatientQueueStateSchema.parse({
    ...state,
    standardSlots: fillMode(
      'standard',
      state.standardSlots,
      state,
      standardClinic,
      pools.approved,
      catalogs,
    ),
    endgameSlots: fillMode(
      'endgame',
      state.endgameSlots,
      state,
      endgameClinic,
      pools.approved,
      catalogs,
    ),
    developerSlots: fillMode(
      'developer',
      state.developerSlots,
      state,
      endgameClinic,
      pools.developer,
      catalogs,
    ),
  });

export const refreshPatientQueue = (
  state: PatientQueueState,
  mode: 'endgame' | 'developer',
  standardClinic: ClinicState,
  endgameClinic: ClinicState,
  pools: QueueBlueprintPools,
  catalogs: CatalogBundle,
): PatientQueueState => {
  const key = queueKeyFor(mode);
  const retiredComplaints = state[key].map((slot) => slot.caseInstance.opening.chiefComplaint);
  return ensurePatientQueues(
    PatientQueueStateSchema.parse({
      ...state,
      generation: state.generation + 1,
      [key]: [],
      recentChiefComplaints: [...state.recentChiefComplaints, ...retiredComplaints].slice(-24),
    }),
    standardClinic,
    endgameClinic,
    pools,
    catalogs,
  );
};

export const consumePatientSlot = (
  state: PatientQueueState,
  slotId: string,
  mode: ProgressionMode,
  standardClinic: ClinicState,
  endgameClinic: ClinicState,
  pools: QueueBlueprintPools,
  catalogs: CatalogBundle,
): PatientQueueState => {
  const key = queueKeyFor(mode);
  const selected = state[key].find((slot) => slot.id === slotId);
  if (!selected) return state;
  const runBlueprintIds =
    mode === 'developer'
      ? [...new Set([...state.developerRunBlueprintIds, selected.caseInstance.blueprintId])]
      : state.developerRunBlueprintIds;
  return ensurePatientQueues(
    PatientQueueStateSchema.parse({
      ...state,
      generation: state.generation + 1,
      [key]: state[key].filter((slot) => slot.id !== slotId),
      developerRunBlueprintIds: runBlueprintIds,
      recentChiefComplaints: [
        ...state.recentChiefComplaints,
        selected.caseInstance.opening.chiefComplaint,
      ].slice(-24),
    }),
    standardClinic,
    endgameClinic,
    pools,
    catalogs,
  );
};

export const rerollDeveloperSlot = (
  state: PatientQueueState,
  slotId: string,
  endgameClinic: ClinicState,
  developerBlueprints: readonly CaseBlueprint[],
  catalogs: CatalogBundle,
): PatientQueueState => {
  const selected = state.developerSlots.find((slot) => slot.id === slotId);
  const blueprint = developerBlueprints.find(
    (candidate) => candidate.id === selected?.caseInstance.blueprintId,
  );
  if (!selected || !blueprint) return state;
  const nextGeneration = state.generation + 1;
  const complaintsInUse = new Set(
    state.developerSlots
      .filter((slot) => slot.id !== slotId)
      .flatMap((slot) => [normalizeComplaint(slot.caseInstance.opening.chiefComplaint)]),
  );
  for (const complaint of state.recentChiefComplaints) {
    complaintsInUse.add(normalizeComplaint(complaint));
  }
  const replacement = makeSlot(
    'developer',
    blueprint,
    endgameClinic,
    catalogs,
    nextGeneration,
    Number.parseInt(slotId.split('.').at(-1) ?? '1', 10),
    complaintsInUse,
  );
  if (!replacement) return state;
  return PatientQueueStateSchema.parse({
    ...state,
    generation: nextGeneration,
    recentChiefComplaints: [
      ...state.recentChiefComplaints,
      selected.caseInstance.opening.chiefComplaint,
    ].slice(-24),
    developerSlots: state.developerSlots.map((slot) =>
      slot.id === slotId ? { ...replacement, id: slot.id } : slot,
    ),
  });
};

export const resetDeveloperRunHistory = (state: PatientQueueState): PatientQueueState =>
  PatientQueueStateSchema.parse({
    ...state,
    generation: state.generation + 1,
    developerSlots: [],
    developerRunBlueprintIds: [],
  });
