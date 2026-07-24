import { describe, expect, it } from 'vitest';

import { catalogs, prototypeCaseBlueprint, startingClinic } from '@psychsim/content-runtime';
import {
  completeEncounter,
  instantiateCase,
  purchaseInformationAction,
  requireCompleted,
  startEncounter,
  updateTreatmentSelections,
} from '@psychsim/engine';
import { CompletedAttemptSchema } from '@psychsim/schemas';

import { buildDeveloperAttemptReview } from './attempt-review';

const completedAttempt = () => {
  const instance = instantiateCase(prototypeCaseBlueprint, 'developer-review-test', catalogs);
  let state = startEncounter(instance, startingClinic, startingClinic.activeLocationId);
  state = requireCompleted(
    purchaseInformationAction(state, 'info.history.suicide-safety', catalogs),
  );
  state = requireCompleted(
    updateTreatmentSelections(
      state,
      {
        startMedicationIds: ['medication.sertraline'],
        stopMedicationIds: [],
        continueMedicationIds: [],
        interventionIds: ['intervention.psychotherapy.cbt'],
        dispositionId: 'disposition.outpatient-followup',
      },
      catalogs,
    ),
  );
  const completed = requireCompleted(completeEncounter(state, catalogs));
  return CompletedAttemptSchema.parse({
    schemaVersion: 1,
    id: 'attempt.developer-review-test.1',
    caseId: instance.blueprintId,
    blueprintId: instance.blueprintId,
    caseContentVersion: instance.contentVersion,
    seed: instance.seed,
    caseInstance: instance,
    clinicStateAtStart: startingClinic,
    events: completed.state.events,
    purchases: completed.state.purchases,
    submittedTreatment: completed.state.selections,
    receipt: completed.receipt,
    completedAt: '2026-07-23T20:00:00.000Z',
  });
};

describe('Developer attempt review snapshots', () => {
  it('freezes every offered option and the exact completed playthrough beside the note', () => {
    const attempt = completedAttempt();
    const review = buildDeveloperAttemptReview({
      attempt,
      catalogs,
      engineVersion: 'test-engine',
      reviewerNote: 'I missed an assessment and expected a larger penalty.',
      timestamp: '2026-07-23T20:05:00.000Z',
    });

    const expectedOptionCount =
      attempt.caseInstance.informationActions.length +
      attempt.caseInstance.availableTreatments.startMedicationIds.length +
      attempt.caseInstance.availableTreatments.stopMedicationIds.length +
      attempt.caseInstance.availableTreatments.continueMedicationIds.length +
      attempt.caseInstance.availableTreatments.interventionIds.length +
      attempt.caseInstance.availableTreatments.dispositionIds.length;
    expect(review.availableOptions).toHaveLength(expectedOptionCount);
    expect(review.availableOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'information',
          optionId: 'info.history.suicide-safety',
          label: 'Suicide and self-harm assessment',
          selected: true,
          pointCost: 15,
          fulfillmentLabel: 'Office interview',
        }),
        expect.objectContaining({
          kind: 'information',
          optionId: 'info.imaging.brain-mri',
          selected: false,
          pointCost: 1_800,
        }),
        expect.objectContaining({
          kind: 'start_medication',
          optionId: 'medication.sertraline',
          selected: true,
        }),
        expect.objectContaining({
          kind: 'nonmedication',
          optionId: 'intervention.psychotherapy.cbt',
          selected: true,
        }),
        expect.objectContaining({
          kind: 'disposition',
          optionId: 'disposition.outpatient-followup',
          selected: true,
        }),
      ]),
    );
    expect(review.attemptSnapshot).toEqual(attempt);
    expect(review.attemptSnapshot.purchases).toEqual(attempt.purchases);
    expect(review.attemptSnapshot.submittedTreatment).toEqual(attempt.submittedTreatment);
    expect(review.attemptSnapshot.receipt).toEqual(attempt.receipt);
  });

  it('updates prose without replacing the immutable attempt identity or creation time', () => {
    const attempt = completedAttempt();
    const first = buildDeveloperAttemptReview({
      attempt,
      catalogs,
      engineVersion: 'test-engine',
      reviewerNote: 'First review.',
      timestamp: '2026-07-23T20:05:00.000Z',
    });
    const revised = buildDeveloperAttemptReview({
      attempt,
      catalogs,
      engineVersion: 'newer-engine-that-must-not-rewrite-history',
      reviewerNote: 'Revised review and ranking.',
      timestamp: '2026-07-23T20:10:00.000Z',
      existingReview: first,
    });

    expect(revised.id).toBe(first.id);
    expect(revised.createdAt).toBe(first.createdAt);
    expect(revised.updatedAt).toBe('2026-07-23T20:10:00.000Z');
    expect(revised.reviewerNote).toBe('Revised review and ranking.');
    expect(revised.engineVersion).toBe('test-engine');
    expect(revised.availableOptions).toEqual(first.availableOptions);
    expect(revised.attemptSnapshot).toEqual(first.attemptSnapshot);
  });
});
