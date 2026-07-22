import type { CatalogBundle, ClinicState, ProgressionMode } from '@psychsim/schemas';

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
  const highestLocations = catalogs.locations.filter(
    (location) => location.facilityTier === 'behavioral_health_system',
  );
  if (!highestFacility || highestLocations.length === 0) {
    throw new Error('Endgame mode requires a behavioral-health-system facility and location.');
  }

  const capabilities = new Set([
    ...clinic.capabilities,
    ...highestLocations.flatMap((location) => location.capabilities),
    ...catalogs.services.flatMap((service) =>
      service.fulfillmentMethods.flatMap((method) => method.requiredCapabilities),
    ),
    ...catalogs.treatments.flatMap((treatment) => treatment.requiredCapabilities),
  ]);

  return {
    ...clinic,
    label: highestFacility.label,
    facilityId: highestFacility.id,
    facilityTier: highestFacility.tier,
    locationIds: highestLocations.map((location) => location.id),
    activeLocationId: highestLocations[0]!.id,
    capabilities: [...capabilities],
    ownedEquipmentIds: [...capabilities].filter((capability) =>
      capability.startsWith('equipment.'),
    ),
    formularyIds: catalogs.formularies.map((formulary) => formulary.id),
    debugUnlocksAllProgression: true,
  };
};
