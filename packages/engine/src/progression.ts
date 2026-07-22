import {
  ClinicStateSchema,
  type CatalogBundle,
  type ClinicState,
  type ProgressionMode,
} from '@psychsim/schemas';

import { err, ok, type Result } from './result';
import { calculateSatisfactionState } from './satisfaction';

const addUnique = (current: readonly string[], additions: readonly string[]): string[] => [
  ...new Set([...current, ...additions]),
];

export const resolveClinicForFacility = (
  clinic: ClinicState,
  facilityId: string,
  catalogs: CatalogBundle,
): Result<ClinicState> => {
  const facility = catalogs.facilities.find((candidate) => candidate.id === facilityId);
  if (!facility) {
    return err({ code: 'FACILITY_NOT_FOUND', message: `Unknown facility: ${facilityId}` });
  }
  const locations = facility.locationIds.flatMap((locationId) => {
    const location = catalogs.locations.find((candidate) => candidate.id === locationId);
    return location ? [location] : [];
  });
  if (
    locations.length !== facility.locationIds.length ||
    !locations.some((location) => location.id === facility.defaultLocationId)
  ) {
    return err({
      code: 'FACILITY_LOCATION_INVALID',
      message: `${facility.label} has an invalid location catalog.`,
    });
  }
  return ok(
    ClinicStateSchema.parse({
      ...clinic,
      label: facility.label,
      facilityId: facility.id,
      facilityTier: facility.tier,
      locationIds: facility.locationIds,
      activeLocationId: facility.defaultLocationId,
      capabilities: addUnique(
        clinic.capabilities,
        locations.flatMap((location) => location.capabilities),
      ),
      formularyIds: addUnique(
        clinic.formularyIds,
        locations.map((location) => location.formularyId),
      ),
    }),
  );
};

export const getPatientSlotCount = (
  clinic: ClinicState,
  mode: ProgressionMode,
  catalogs: CatalogBundle,
): number => {
  const facility =
    mode !== 'standard'
      ? catalogs.facilities.find((candidate) => candidate.tier === 'behavioral_health_system')
      : catalogs.facilities.find((candidate) => candidate.id === clinic.facilityId);
  if (!facility) throw new Error(`No facility definition for ${clinic.facilityId}.`);
  return facility.patientSlotCount;
};

export const resolveClinicForProgressionMode = (
  clinic: ClinicState,
  mode: ProgressionMode,
  catalogs: CatalogBundle,
): ClinicState => {
  if (mode === 'standard') return clinic;

  const highestFacility = catalogs.facilities.find(
    (facility) => facility.tier === 'behavioral_health_system',
  );
  if (!highestFacility) {
    throw new Error('Endgame mode requires a behavioral-health-system facility and location.');
  }

  const resolved = resolveClinicForFacility(clinic, highestFacility.id, catalogs);
  if (!resolved.ok) throw new Error(resolved.error.message);
  const highestLocations = catalogs.locations.filter((location) =>
    highestFacility.locationIds.includes(location.id),
  );

  const capabilities = new Set([
    ...clinic.capabilities,
    ...highestLocations.flatMap((location) => location.capabilities),
    ...catalogs.services.flatMap((service) =>
      service.fulfillmentMethods.flatMap((method) => method.requiredCapabilities),
    ),
    ...catalogs.treatments.flatMap((treatment) => treatment.requiredCapabilities),
  ]);

  const allOwnedUpgradeIds = [
    ...new Set([
      ...clinic.ownedUpgradeIds,
      ...catalogs.upgrades.map((upgrade) => upgrade.id),
      ...catalogs.decor.items.map((item) => item.id),
    ]),
  ];
  const endgameSatisfaction = calculateSatisfactionState(
    catalogs.decor.items.reduce((total, item) => total + item.satisfactionPoints, 0),
    catalogs.decor.satisfaction,
  );

  return ClinicStateSchema.parse({
    ...resolved.value,
    capabilities: [...capabilities],
    ownedUpgradeIds: allOwnedUpgradeIds,
    ownedEquipmentIds: [...capabilities].filter((capability) =>
      capability.startsWith('equipment.'),
    ),
    formularyIds: catalogs.formularies.map((formulary) => formulary.id),
    debugUnlocksAllProgression: true,
    satisfaction: endgameSatisfaction.rawPoints,
    satisfactionMultiplier: endgameSatisfaction.multiplier,
  });
};
