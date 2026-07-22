import {
  CaseEligibilitySchema,
  type CaseEligibility,
  type CaseInstance,
  type CatalogBundle,
  type ClinicState,
  type ScorePredicate,
} from '@psychsim/schemas';

import { evaluatePredicate } from './predicates';
import { getAvailableStartMedicationIds } from './formulary';
import { resolveServiceFulfillment } from './services';

interface PredicateAvailability {
  actionIds: ReadonlySet<string>;
  factIds: ReadonlySet<string>;
  startMedicationIds: ReadonlySet<string>;
  stopMedicationIds: ReadonlySet<string>;
  continueMedicationIds: ReadonlySet<string>;
  interventionIds: ReadonlySet<string>;
  dispositionIds: ReadonlySet<string>;
  capabilityIds: ReadonlySet<string>;
  medicationTagsById: ReadonlyMap<string, ReadonlySet<string>>;
}

interface PredicatePossibility {
  canBeTrue: boolean;
  canBeFalse: boolean;
}

const predicatePossibility = (
  predicate: ScorePredicate,
  availability: PredicateAvailability,
): PredicatePossibility => {
  switch (predicate.type) {
    case 'actionPurchased':
      return { canBeTrue: availability.actionIds.has(predicate.actionId), canBeFalse: true };
    case 'factKnown':
      return { canBeTrue: availability.factIds.has(predicate.factId), canBeFalse: true };
    case 'treatmentStarted':
      return {
        canBeTrue: availability.startMedicationIds.has(predicate.medicationId),
        canBeFalse: true,
      };
    case 'treatmentStopped':
      return {
        canBeTrue: availability.stopMedicationIds.has(predicate.medicationId),
        canBeFalse: true,
      };
    case 'treatmentContinued':
      return {
        canBeTrue: availability.continueMedicationIds.has(predicate.medicationId),
        canBeFalse: true,
      };
    case 'treatmentStartedWithTag': {
      const availableCount = [...availability.startMedicationIds].filter((medicationId) =>
        availability.medicationTagsById.get(medicationId)?.has(predicate.medicationTagId),
      ).length;
      return {
        canBeTrue: predicate.minimumCount <= availableCount && predicate.maximumCount >= 0,
        canBeFalse: predicate.minimumCount > 0 || predicate.maximumCount < availableCount,
      };
    }
    case 'interventionSelected':
      return {
        canBeTrue: availability.interventionIds.has(predicate.interventionId),
        canBeFalse: true,
      };
    case 'dispositionSelected':
      return {
        canBeTrue: availability.dispositionIds.has(predicate.dispositionId),
        canBeFalse: true,
      };
    case 'serviceCapabilityAvailable': {
      const available = availability.capabilityIds.has(predicate.capabilityId);
      return { canBeTrue: available, canBeFalse: !available };
    }
    case 'any': {
      const children = predicate.predicates.map((child) =>
        predicatePossibility(child, availability),
      );
      return {
        canBeTrue: children.some((child) => child.canBeTrue),
        canBeFalse: children.every((child) => child.canBeFalse),
      };
    }
    case 'all': {
      const children = predicate.predicates.map((child) =>
        predicatePossibility(child, availability),
      );
      return {
        canBeTrue: children.every((child) => child.canBeTrue),
        canBeFalse: children.some((child) => child.canBeFalse),
      };
    }
    case 'not': {
      const child = predicatePossibility(predicate.predicate, availability);
      return { canBeTrue: child.canBeFalse, canBeFalse: child.canBeTrue };
    }
  }
};

export const evaluateCaseEligibility = (
  caseDefinition: CaseInstance,
  clinicState: ClinicState,
  locationId: string,
  catalogs: CatalogBundle,
): CaseEligibility => {
  const reasons: string[] = [];
  const location = catalogs.locations.find((candidate) => candidate.id === locationId);
  const effectiveCapabilities = new Set([
    ...clinicState.capabilities,
    ...(location?.capabilities ?? []),
  ]);
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
  const accessibleFacts = new Set(
    caseDefinition.informationActions
      .filter((action) => accessibleActions.has(action.actionId))
      .flatMap((action) => action.result.factsRevealed),
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
      knownFactIds: accessibleFacts,
      selections: blankSelections,
      capabilities: effectiveCapabilities,
      medicationTagsById: new Map(
        catalogs.medications.map((medication) => [medication.id, new Set(medication.tags)]),
      ),
    });
    if (!reachable) reasons.push(`Required workup objective is inaccessible: ${objective.label}`);
  }

  const availableTreatments = caseDefinition.availableTreatments;
  const availableMedicationIds = getAvailableStartMedicationIds(
    caseDefinition,
    clinicState,
    locationId,
    catalogs,
  );
  const availableInterventionIds = new Set(
    catalogs.treatments
      .filter(
        (treatment) =>
          treatment.kind === 'nonmedication' &&
          availableTreatments.interventionIds.includes(treatment.id) &&
          treatment.requiredCapabilities.every((capability) =>
            effectiveCapabilities.has(capability),
          ),
      )
      .map((treatment) => treatment.id),
  );
  const availableDispositionIds = new Set(
    catalogs.treatments
      .filter(
        (treatment) =>
          treatment.kind === 'disposition' &&
          availableTreatments.dispositionIds.includes(treatment.id) &&
          location?.dispositionIds.includes(treatment.id) &&
          treatment.requiredCapabilities.every((capability) =>
            effectiveCapabilities.has(capability),
          ),
      )
      .map((treatment) => treatment.id),
  );
  const objectiveById = new Map(
    caseDefinition.workupObjectives.map((objective) => [objective.id, objective]),
  );
  const workupContext = {
    purchasedActionIds: accessibleActions,
    knownFactIds: accessibleFacts,
    selections: blankSelections,
    capabilities: effectiveCapabilities,
    medicationTagsById: new Map(
      catalogs.medications.map((medication) => [medication.id, new Set(medication.tags)]),
    ),
  };
  const medicationTagsById = new Map(
    catalogs.medications.map((medication) => [medication.id, new Set(medication.tags)]),
  );
  const predicateAvailability: PredicateAvailability = {
    actionIds: accessibleActions,
    factIds: accessibleFacts,
    startMedicationIds: new Set(availableMedicationIds),
    stopMedicationIds: new Set(availableTreatments.stopMedicationIds),
    continueMedicationIds: new Set(availableTreatments.continueMedicationIds),
    interventionIds: availableInterventionIds,
    dispositionIds: availableDispositionIds,
    capabilityIds: effectiveCapabilities,
    medicationTagsById,
  };
  const availablePathwayIds = caseDefinition.treatmentPathways
    .filter((pathway) => pathway.accepted)
    .filter((pathway) => {
      const requiredObjectiveIds = new Set([
        ...pathway.requiredWorkupObjectiveIds,
        ...pathway.conditionalRequirements.map((requirement) => requirement.objectiveId),
      ]);
      const hasCompleteWorkup = [...requiredObjectiveIds].every((objectiveId) => {
        const objective = objectiveById.get(objectiveId);
        return objective ? evaluatePredicate(objective.satisfaction, workupContext) : false;
      });
      return (
        hasCompleteWorkup && predicatePossibility(pathway.match, predicateAvailability).canBeTrue
      );
    })
    .map((pathway) => pathway.id);
  if (availablePathwayIds.length === 0)
    reasons.push('No acceptable treatment pathway is available.');

  const availableMedicationIdSet = new Set(availableMedicationIds);
  const completableReferenceSolution = caseDefinition.referenceSolutions
    .filter(
      (solution) => solution.kind === 'database_plan' || solution.kind === 'strong_alternative',
    )
    .some((solution) => {
      if (
        solution.actionIds.some((actionId) => !accessibleActions.has(actionId)) ||
        solution.selections.startMedicationIds.some(
          (medicationId) => !availableMedicationIdSet.has(medicationId),
        ) ||
        solution.selections.stopMedicationIds.some(
          (medicationId) => !availableTreatments.stopMedicationIds.includes(medicationId),
        ) ||
        solution.selections.continueMedicationIds.some(
          (medicationId) => !availableTreatments.continueMedicationIds.includes(medicationId),
        ) ||
        solution.selections.interventionIds.some(
          (interventionId) => !availableInterventionIds.has(interventionId),
        ) ||
        (solution.selections.dispositionId !== null &&
          !availableDispositionIds.has(solution.selections.dispositionId))
      ) {
        return false;
      }
      const purchasedActionIds = new Set(solution.actionIds);
      const knownFactIds = new Set(
        caseDefinition.informationActions
          .filter((action) => purchasedActionIds.has(action.actionId))
          .flatMap((action) => action.result.factsRevealed),
      );
      const context = {
        purchasedActionIds,
        knownFactIds,
        selections: solution.selections,
        capabilities: effectiveCapabilities,
        medicationTagsById,
      };
      return caseDefinition.treatmentPathways
        .filter((pathway) => pathway.accepted)
        .some((pathway) => {
          if (!evaluatePredicate(pathway.match, context)) return false;
          const requiredObjectiveIds = new Set([
            ...pathway.requiredWorkupObjectiveIds,
            ...pathway.conditionalRequirements.map((requirement) => requirement.objectiveId),
          ]);
          return [...requiredObjectiveIds].every((objectiveId) => {
            const objective = objectiveById.get(objectiveId);
            return objective ? evaluatePredicate(objective.satisfaction, context) : false;
          });
        });
    });
  if (!completableReferenceSolution) {
    reasons.push('No database-plan or strong-alternative reference solution is completable.');
  }

  const safeDispositionAvailable = catalogs.treatments.some(
    (treatment) =>
      treatment.kind === 'disposition' &&
      treatment.safeReferral &&
      availableDispositionIds.has(treatment.id),
  );
  if (!safeDispositionAvailable)
    reasons.push('No safe referral or transfer disposition is available.');

  return CaseEligibilitySchema.parse({
    eligible: reasons.length === 0,
    reasons,
    availablePathwayIds,
  });
};
