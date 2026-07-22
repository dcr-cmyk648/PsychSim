import type { CaseInstance, CatalogBundle, ClinicState } from '@psychsim/schemas';

export const getEffectiveFormularyIds = (
  clinic: ClinicState,
  locationId: string,
  catalogs: CatalogBundle,
): string[] => {
  const location = catalogs.locations.find((candidate) => candidate.id === locationId);
  return [...new Set([...clinic.formularyIds, ...(location ? [location.formularyId] : [])])];
};

export const getEffectiveMedicationIds = (
  clinic: ClinicState,
  locationId: string,
  catalogs: CatalogBundle,
): string[] => {
  const formularyIds = new Set(getEffectiveFormularyIds(clinic, locationId, catalogs));
  return [
    ...new Set(
      catalogs.formularies
        .filter((formulary) => formularyIds.has(formulary.id))
        .flatMap((formulary) => formulary.medicationIds),
    ),
  ];
};

export const getAvailableStartMedicationIds = (
  caseInstance: CaseInstance,
  clinic: ClinicState,
  locationId: string,
  catalogs: CatalogBundle,
): string[] => {
  const effectiveMedicationIds = new Set(getEffectiveMedicationIds(clinic, locationId, catalogs));
  return caseInstance.availableTreatments.startMedicationIds.filter((id) =>
    effectiveMedicationIds.has(id),
  );
};
