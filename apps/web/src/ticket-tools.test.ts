import { afterEach, describe, expect, it, vi } from 'vitest';

import { catalogs, prototypeCaseBlueprint, startingClinic } from '@psychsim/content-runtime';
import {
  completeEncounter,
  instantiateCase,
  requireCompleted,
  startEncounter,
  updateTreatmentSelections,
} from '@psychsim/engine';
import { ClinicalReviewTicketSchema, CompletedAttemptSchema } from '@psychsim/schemas';

import {
  LOCAL_TICKET_WRITER_ENDPOINT,
  buildClinicalTicketExportBundle,
  writeClinicalTicketBundleToWorkspace,
} from './ticket-tools';

const ticket = ClinicalReviewTicketSchema.parse({
  schemaVersion: 1,
  id: 'ticket.test.1',
  title: 'Review a clinical rule',
  sourceKind: 'source_claim',
  sourceAuthority: 'source_document',
  ticketType: 'clinical_conflict',
  priority: 'high',
  status: 'proposed',
  requiresClinicalAcumen: true,
  attemptId: null,
  blueprintId: 'case.test',
  caseContentVersion: '1.0.0',
  receiptItemId: null,
  receiptItemSnapshot: null,
  targetContentIds: ['rule.test'],
  dependencyTicketIds: [],
  conflictContentIds: [],
  proposedRouting: 'Present the conflict for human resolution.',
  guidance: 'Decide which rule version should remain active.',
  resurfacingTrigger: null,
  resolution: null,
  createdAt: '2026-07-22T12:00:00.000Z',
  updatedAt: '2026-07-22T12:00:00.000Z',
});

const completedAttempt = () => {
  const instance = instantiateCase(prototypeCaseBlueprint, 'ticket-export-test', catalogs);
  let state = startEncounter(instance, startingClinic, startingClinic.activeLocationId);
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
    id: 'attempt.ticket-export-test.1',
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
    completedAt: '2026-07-24T20:00:00.000Z',
  });
};

afterEach(() => vi.unstubAllGlobals());

describe('developer ticket tools', () => {
  it('builds a versioned export without dropping resolved ticket fields', () => {
    const bundle = buildClinicalTicketExportBundle({
      exportedAt: '2026-07-22T12:30:00.000Z',
      engineVersion: '0.2.0',
      profileId: 'profile.local',
      buildKind: 'local_developer',
      assignmentId: null,
      tickets: [ticket],
      attemptReviews: [],
      flags: [],
      completedAttempts: [],
    });
    expect(bundle).toMatchObject({
      exportVersion: 5,
      buildKind: 'local_developer',
      assignmentId: null,
      tickets: [{ ...ticket, reviewerNotes: '', reviewerNotesUpdatedAt: null }],
      attemptReviews: [],
      flags: [],
      completedAttempts: [],
    });
  });

  it('sends the validated bundle to the development-only workspace writer', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          path: 'content/generated/local-review-tickets/tickets.json',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const bundle = buildClinicalTicketExportBundle({
      exportedAt: '2026-07-22T12:30:00.000Z',
      engineVersion: '0.2.0',
      profileId: 'profile.local',
      buildKind: 'local_developer',
      assignmentId: null,
      tickets: [ticket],
      attemptReviews: [],
      flags: [],
      completedAttempts: [],
    });

    await expect(writeClinicalTicketBundleToWorkspace(bundle)).resolves.toBe(
      'content/generated/local-review-tickets/tickets.json',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      LOCAL_TICKET_WRITER_ENDPOINT,
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(bundle) }),
    );
  });

  it('rejects an attempt-linked ticket for a different patient blueprint', () => {
    const attempt = completedAttempt();
    const mismatchedTicket = ClinicalReviewTicketSchema.parse({
      ...ticket,
      attemptId: attempt.id,
      blueprintId: 'case.some-other-patient',
    });

    expect(() =>
      buildClinicalTicketExportBundle({
        exportedAt: '2026-07-24T20:00:00.000Z',
        engineVersion: '0.5.0',
        profileId: 'profile.local',
        buildKind: 'local_developer',
        assignmentId: null,
        tickets: [mismatchedTicket],
        attemptReviews: [],
        flags: [],
        completedAttempts: [attempt],
      }),
    ).toThrow(/must match the attempt patient blueprint/);
  });
});
