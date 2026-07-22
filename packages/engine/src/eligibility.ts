import {
  CaseEligibilitySchema,
  type CaseEligibility,
  type CaseInstance,
  type CatalogBundle,
  type ClinicState,
} from '@psychsim/schemas';

import { evaluatePredicate, extractPredicateReferences } from './predicates';
import { getAvailableStartMedicationIds } from './formulary';
import { resolveServiceFulfillment } from './services';

export const evaluateCaseEligibility = (
  caseDefinition: CaseInstance,
  clinicState: ClinicState,
  locationId: string,
  catalogs: CatalogBundle,
): CaseEligibility => {
  const reasons: string[] = [];
  if (!caseDefinition.metadata.compatibleLocationIds.includes(locationId)) {
    reasons.push('Case is not compatible with this location.');
  }
  if (
    !clinicState.debugUnlocksAllProgression &&
    clinicState.lifetimePointsEarned < caseDefinition.metadata.minimumLifetimePoints
  ) {
    reasons.push('Lifetime Clinic Points are below the case minimum.');
  }
  const accessibleActions = new Set(
    caseDefinition.informationActions
      .filter((caseAction) => {
        const definition = catalogs.informationActions.find(
          (candidate) => candidate.id === caseAction.actionId,
        );
        return (
          definition !== undefined &&
          resolveServiceFulfillment(
            definition.serviceId,
            clinicState,
            locationId,
            catalogs.services,
            catalogs.locations,
          ).ok
        );
      })
      .map((action) => action.actionId),
  );
  const blankSelections = {
    startMedicationIds: [],
    stopMedicationIds: [],
    continueMedicationIds: [],
    interventionIds: [],
    dispositionId: null,
  };
  for (const objective of caseDefinition.workupObjectives.filter(
    (candidate) => candidate.requiredByDefault,
  )) {
    const reachable = evaluatePredicate(objective.satisfaction, {
      purchasedActionIds: accessibleActions,
      knownFactIds: new Set(),
      selections: blankSelections,
      capabilities: new Set(clinicState.capabilities),
      medicationTagsById: new Map(
        catalogs.medications.map((medication) => [medication.id, new Set(medication.tags)]),
      ),
    });
    if (!reachable) reasons.push(`Required workup objective is inaccessible: ${objective.label}`);
  }

  const location = catalogs.locations.find((candidate) => candidate.id === locationId);
  const availableTreatments = caseDefinition.availableTreatments;
  const availableMedicationIds = getAvailableStartMedicationIds(
    caseDefinition,
    clinicState,
    locationId,
    catalogs,
  );
  const availablePathwayIds = caseDefinition.treatmentPathways
    .filter((pathway) => pathway.accepted)
    .filter((pathway) => {
      const refs = extractPredicateReferences(pathway.match);
      const hasTaggedOption = refs.medicationTagIds.every((tagId) =>
        availableMedicationIds.some((id) =>
          catalogs.medications.find((medication) => medication.id === id)?.tags.includes(tagId),
        ),
      );
      return (
        refs.medicationIds.every(
          (id) =>
            !availableTreatments.startMedicationIds.includes(id) ||
            availableMedicationIds.includes(id),
        ) &&
        hasTaggedOption &&
        refs.dispositionIds.every((id) => location?.dispositionIds.includes(id))
      );
    })
    .map((pathway) => pathway.id);
  if (availablePathwayIds.length === 0)
    reasons.push('No acceptable treatment pathway is available.');

  const safeDispositionAvailable = catalogs.treatments.some(
    (treatment) =>
      treatment.kind === 'disposition' &&
      treatment.safeReferral &&
      availableTreatments.dispositionIds.includes(treatment.id) &&
      location?.dispositionIds.includes(treatment.id),
  );
  if (!safeDispositionAvailable)
    reasons.push('No safe referral or transfer disposition is available.');

  return CaseEligibilitySchema.parse({
    eligible: reasons.length === 0,
    reasons,
    availablePathwayIds,
  });
};
