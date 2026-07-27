import type { ScorePredicate, TreatmentSelection } from '@psychsim/schemas';

export interface PredicateContext {
  readonly purchasedActionIds: ReadonlySet<string>;
  readonly knownFactIds: ReadonlySet<string>;
  readonly selections: TreatmentSelection;
  readonly capabilities: ReadonlySet<string>;
  readonly medicationTagsById: ReadonlyMap<string, ReadonlySet<string>>;
}

export const evaluatePredicate = (
  predicate: ScorePredicate,
  context: PredicateContext,
): boolean => {
  switch (predicate.type) {
    case 'actionPurchased':
      return context.purchasedActionIds.has(predicate.actionId);
    case 'factKnown':
      return context.knownFactIds.has(predicate.factId);
    case 'anyMedicationStarted':
      return context.selections.startMedicationIds.length > 0;
    case 'treatmentStarted':
      return context.selections.startMedicationIds.includes(predicate.medicationId);
    case 'treatmentStartedWithTag': {
      const count = context.selections.startMedicationIds.filter((medicationId) =>
        context.medicationTagsById.get(medicationId)?.has(predicate.medicationTagId),
      ).length;
      return count >= predicate.minimumCount && count <= predicate.maximumCount;
    }
    case 'treatmentStopped':
      return context.selections.stopMedicationIds.includes(predicate.medicationId);
    case 'treatmentContinued':
      return context.selections.continueMedicationIds.includes(predicate.medicationId);
    case 'interventionSelected':
      return context.selections.interventionIds.includes(predicate.interventionId);
    case 'dispositionSelected':
      return context.selections.dispositionId === predicate.dispositionId;
    case 'serviceCapabilityAvailable':
      return context.capabilities.has(predicate.capabilityId);
    case 'any':
      return predicate.predicates.some((child) => evaluatePredicate(child, context));
    case 'all':
      return predicate.predicates.every((child) => evaluatePredicate(child, context));
    case 'not':
      return !evaluatePredicate(predicate.predicate, context);
  }
};

export interface PredicateReferences {
  actionIds: string[];
  factIds: string[];
  medicationIds: string[];
  medicationTagIds: string[];
  anyMedicationStarted: boolean;
  interventionIds: string[];
  dispositionIds: string[];
  capabilityIds: string[];
}

export const extractPredicateReferences = (predicate: ScorePredicate): PredicateReferences => {
  const references: PredicateReferences = {
    actionIds: [],
    factIds: [],
    medicationIds: [],
    medicationTagIds: [],
    anyMedicationStarted: false,
    interventionIds: [],
    dispositionIds: [],
    capabilityIds: [],
  };

  const visit = (node: ScorePredicate): void => {
    switch (node.type) {
      case 'actionPurchased':
        references.actionIds.push(node.actionId);
        return;
      case 'factKnown':
        references.factIds.push(node.factId);
        return;
      case 'anyMedicationStarted':
        references.anyMedicationStarted = true;
        return;
      case 'treatmentStarted':
      case 'treatmentStopped':
      case 'treatmentContinued':
        references.medicationIds.push(node.medicationId);
        return;
      case 'treatmentStartedWithTag':
        references.medicationTagIds.push(node.medicationTagId);
        return;
      case 'interventionSelected':
        references.interventionIds.push(node.interventionId);
        return;
      case 'dispositionSelected':
        references.dispositionIds.push(node.dispositionId);
        return;
      case 'serviceCapabilityAvailable':
        references.capabilityIds.push(node.capabilityId);
        return;
      case 'any':
      case 'all':
        node.predicates.forEach(visit);
        return;
      case 'not':
        visit(node.predicate);
        return;
    }
  };
  visit(predicate);
  return references;
};
