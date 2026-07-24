import {
  DeveloperAttemptReviewSchema,
  type CatalogBundle,
  type CompletedAttempt,
  type DeveloperAttemptReview,
  type DeveloperAttemptReviewOption,
} from '@psychsim/schemas';
import { resolveServiceFulfillment } from '@psychsim/engine';

interface BuildDeveloperAttemptReviewInput {
  attempt: CompletedAttempt;
  catalogs: CatalogBundle;
  engineVersion: string;
  reviewerNote: string;
  timestamp: string;
  existingReview?: DeveloperAttemptReview;
}

const requiredCatalogEntry = <T extends { id: string }>(
  entries: readonly T[],
  id: string,
  kind: string,
): T => {
  const entry = entries.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Cannot snapshot missing ${kind} catalog entry: ${id}`);
  return entry;
};

const treatmentOption = (
  kind: Exclude<DeveloperAttemptReviewOption['kind'], 'information'>,
  optionId: string,
  label: string,
  category: string | null,
  selectedIds: ReadonlySet<string>,
): DeveloperAttemptReviewOption => ({
  kind,
  optionId,
  label,
  category,
  description: null,
  serviceId: null,
  fulfillmentMethodId: null,
  fulfillmentLabel: null,
  pointCost: null,
  selected: selectedIds.has(optionId),
});

export const buildDeveloperAttemptReview = ({
  attempt,
  catalogs,
  engineVersion,
  reviewerNote,
  timestamp,
  existingReview,
}: BuildDeveloperAttemptReviewInput): DeveloperAttemptReview => {
  if (existingReview) {
    if (existingReview.attemptId !== attempt.id) {
      throw new Error('An existing Developer review cannot be attached to a different attempt.');
    }
    return DeveloperAttemptReviewSchema.parse({
      ...existingReview,
      reviewerNote: reviewerNote.trim(),
      updatedAt: timestamp,
    });
  }

  const encounterStarted = attempt.events.find((event) => event.type === 'EncounterStarted');
  if (!encounterStarted || encounterStarted.type !== 'EncounterStarted') {
    throw new Error('A Developer attempt review requires the encounter location event.');
  }

  const selected = attempt.submittedTreatment;
  const startedMedicationIds = new Set(selected.startMedicationIds);
  const stoppedMedicationIds = new Set(selected.stopMedicationIds);
  const continuedMedicationIds = new Set(selected.continueMedicationIds);
  const interventionIds = new Set(selected.interventionIds);
  const dispositionIds = new Set(selected.dispositionId ? [selected.dispositionId] : []);
  const purchasedActionIds = new Set(attempt.purchases.map((purchase) => purchase.actionId));
  const options: DeveloperAttemptReviewOption[] = [];

  for (const action of attempt.caseInstance.informationActions) {
    const definition = requiredCatalogEntry(
      catalogs.informationActions,
      action.actionId,
      'information action',
    );
    const fulfillment = resolveServiceFulfillment(
      definition.serviceId,
      attempt.clinicStateAtStart,
      encounterStarted.locationId,
      catalogs.services,
      catalogs.locations,
      { informationActionId: action.actionId },
    );
    if (!fulfillment.ok) {
      throw new Error(
        `Cannot snapshot fulfillment for ${definition.label}: ${fulfillment.error.message}`,
      );
    }
    options.push({
      kind: 'information',
      optionId: action.actionId,
      label: definition.label,
      category: definition.category,
      description: definition.description,
      serviceId: definition.serviceId,
      fulfillmentMethodId: fulfillment.value.method.id,
      fulfillmentLabel: fulfillment.value.method.label,
      pointCost: fulfillment.value.method.operatingCost,
      selected: purchasedActionIds.has(action.actionId),
    });
  }

  const available = attempt.caseInstance.availableTreatments;
  for (const medicationId of available.startMedicationIds) {
    const medication = requiredCatalogEntry(catalogs.medications, medicationId, 'medication');
    options.push(
      treatmentOption(
        'start_medication',
        medicationId,
        medication.label,
        medication.classes.join(' / '),
        startedMedicationIds,
      ),
    );
  }
  for (const medicationId of available.stopMedicationIds) {
    const medication = requiredCatalogEntry(catalogs.medications, medicationId, 'medication');
    options.push(
      treatmentOption(
        'stop_medication',
        medicationId,
        medication.label,
        medication.classes.join(' / '),
        stoppedMedicationIds,
      ),
    );
  }
  for (const medicationId of available.continueMedicationIds) {
    const medication = requiredCatalogEntry(catalogs.medications, medicationId, 'medication');
    options.push(
      treatmentOption(
        'continue_medication',
        medicationId,
        medication.label,
        medication.classes.join(' / '),
        continuedMedicationIds,
      ),
    );
  }
  for (const interventionId of available.interventionIds) {
    const intervention = requiredCatalogEntry(
      catalogs.treatments,
      interventionId,
      'nonmedication treatment',
    );
    options.push(
      treatmentOption(
        'nonmedication',
        interventionId,
        intervention.label,
        intervention.category,
        interventionIds,
      ),
    );
  }
  for (const dispositionId of available.dispositionIds) {
    const disposition = requiredCatalogEntry(catalogs.treatments, dispositionId, 'disposition');
    options.push(
      treatmentOption(
        'disposition',
        dispositionId,
        disposition.label,
        disposition.category,
        dispositionIds,
      ),
    );
  }

  return DeveloperAttemptReviewSchema.parse({
    schemaVersion: 1,
    id: `review.${attempt.id}`,
    attemptId: attempt.id,
    caseId: attempt.caseId,
    blueprintId: attempt.blueprintId,
    caseContentVersion: attempt.caseContentVersion,
    seed: attempt.seed,
    engineVersion,
    encounterMode: 'developer',
    reviewerNote: reviewerNote.trim(),
    availableOptions: options,
    attemptSnapshot: attempt,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
};
