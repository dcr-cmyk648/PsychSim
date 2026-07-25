import { describe, expect, it } from 'vitest';

import {
  catalogs,
  medicationCheckPalpitationsBlueprint,
  startingClinic,
} from '@psychsim/content-runtime';
import {
  completeEncounter,
  instantiateCase,
  purchaseInformationAction,
  requireCompleted,
  startEncounter,
  updateTreatmentSelections,
} from '@psychsim/engine';
import { CompletedAttemptSchema } from '@psychsim/schemas';

import { buildReferenceSolutionAudit } from './reference-audit';

const reviewedAttempt = () => {
  const instance = instantiateCase(
    medicationCheckPalpitationsBlueprint,
    'reference-audit-patient',
    catalogs,
  );
  let state = startEncounter(instance, startingClinic, startingClinic.activeLocationId);
  state = requireCompleted(
    purchaseInformationAction(state, 'info.history.presenting-problem', catalogs),
  );
  state = requireCompleted(
    updateTreatmentSelections(
      state,
      {
        startMedicationIds: [],
        stopMedicationIds: [],
        continueMedicationIds: [],
        interventionIds: [],
        dispositionId: 'disposition.outpatient-followup',
      },
      catalogs,
    ),
  );
  const completed = requireCompleted(completeEncounter(state, catalogs));
  return CompletedAttemptSchema.parse({
    schemaVersion: 1,
    id: 'attempt.reference-audit-patient.1',
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
    completedAt: '2026-07-24T02:00:00.000Z',
  });
};

describe('reference-solution audit', () => {
  it('replays every declared policy against the exact patient and exposes the best tested payout', () => {
    const attempt = reviewedAttempt();
    const audit = buildReferenceSolutionAudit(attempt, catalogs);

    expect(audit.error).toBeNull();
    expect(audit.currentEngineVersion).toBe('0.5.0');
    expect(audit.playerPlan).toMatchObject({
      carePoints: attempt.receipt.pointReport.carePointsEarned,
      workupExpense: attempt.receipt.pointReport.actualWorkupExpense,
      netPayout: attempt.receipt.settlement.netClinicPointsEarned,
      selections: {
        disposition: {
          id: 'disposition.outpatient-followup',
          label: 'Close outpatient follow-up',
        },
      },
    });
    expect(audit.playerPlan.informationActions).toEqual([
      expect.objectContaining({
        id: 'info.history.presenting-problem',
        label: 'Presenting problem and timeline',
        operatingCost: 20,
      }),
    ]);
    expect(audit.runs).toHaveLength(4);
    expect(audit.runs.every((run) => run.status === 'completed')).toBe(true);
    expect(audit.bestRun).toMatchObject({
      id: 'reference.ecg-mdd-efficient-optimal',
      label: 'Database plan',
      status: 'completed',
      carePoints: 1140,
      workupExpense: 630,
      netPayout: 1310,
    });
    expect(audit.databaseRun?.id).toBe('reference.ecg-mdd-efficient-optimal');
    expect(audit.bestRun?.informationActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'info.imaging.ecg',
          label: '12-lead ECG',
          operatingCost: 500,
          fulfillmentLabel: 'Outside medical clinic',
        }),
      ]),
    );
    expect(audit.bestRun?.selections).toMatchObject({
      continueMedications: [{ id: 'medication.citalopram', label: 'Citalopram' }],
      interventions: [
        { id: 'intervention.psychotherapy.cbt', label: 'Cognitive behavioral therapy (CBT)' },
        {
          id: 'intervention.behavioral-activation',
          label: 'Collaborative behavioral activation plan',
        },
      ],
      disposition: {
        id: 'disposition.outpatient-followup',
        label: 'Close outpatient follow-up',
      },
    });
  });

  it('selects by payout deterministically without claiming an exhaustive global optimum', () => {
    const attempt = reviewedAttempt();
    const first = buildReferenceSolutionAudit(attempt, catalogs);
    const second = buildReferenceSolutionAudit(attempt, catalogs);

    expect(second).toEqual(first);
    const completedPayouts = first.runs
      .filter((run) => run.status === 'completed')
      .map((run) => run.netPayout);
    expect(first.bestRun?.netPayout).toBe(Math.max(...completedPayouts));
  }, 15_000);
});
