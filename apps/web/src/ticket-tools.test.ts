import { afterEach, describe, expect, it, vi } from 'vitest';

import { ClinicalReviewTicketSchema } from '@psychsim/schemas';

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

afterEach(() => vi.unstubAllGlobals());

describe('developer ticket tools', () => {
  it('builds a versioned export without dropping resolved ticket fields', () => {
    const bundle = buildClinicalTicketExportBundle({
      exportedAt: '2026-07-22T12:30:00.000Z',
      engineVersion: '0.2.0',
      profileId: 'profile.local',
      tickets: [ticket],
    });
    expect(bundle).toMatchObject({
      exportVersion: 2,
      tickets: [{ ...ticket, reviewerNotes: '', reviewerNotesUpdatedAt: null }],
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
      tickets: [ticket],
    });

    await expect(writeClinicalTicketBundleToWorkspace(bundle)).resolves.toBe(
      'content/generated/local-review-tickets/tickets.json',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      LOCAL_TICKET_WRITER_ENDPOINT,
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(bundle) }),
    );
  });
});
