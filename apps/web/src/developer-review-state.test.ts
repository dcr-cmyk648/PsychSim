import { describe, expect, it } from 'vitest';

import { ClinicalReviewTicketSchema } from '@psychsim/schemas';

import { mergeDeveloperAuditTickets } from './developer-review-state';

const baseTicket = ClinicalReviewTicketSchema.parse({
  schemaVersion: 1,
  id: 'ticket.audit.example',
  title: 'Audit example',
  sourceKind: 'engine_audit',
  sourceAuthority: 'developer_observation',
  ticketType: 'scoring',
  priority: 'high',
  status: 'proposed',
  requiresClinicalAcumen: true,
  attemptId: null,
  blueprintId: 'case.first-visit-depression',
  caseContentVersion: '3.0.0',
  receiptItemId: null,
  receiptItemSnapshot: null,
  targetContentIds: ['case.first-visit-depression'],
  dependencyTicketIds: [],
  conflictContentIds: [],
  proposedRouting: 'Review the exact rules.',
  guidance: 'Audit this rule.',
  resurfacingTrigger: null,
  resolution: null,
  createdAt: '2026-07-22T00:00:00.000Z',
  updatedAt: '2026-07-22T00:00:00.000Z',
});

describe('developer review state', () => {
  it('refreshes exact targets while retaining locally authored instructions', () => {
    const saved = ClinicalReviewTicketSchema.parse({
      ...baseTicket,
      status: 'in_review',
      reviewerNotes: 'Keep the current penalty for now.',
      reviewerNotesUpdatedAt: '2026-07-23T10:00:00.000Z',
      updatedAt: '2026-07-23T10:00:00.000Z',
    });
    const seeded = ClinicalReviewTicketSchema.parse({
      ...baseTicket,
      targetContentIds: ['case.first-visit-depression', 'rule.mdd-emergency-escalation'],
      guidance: 'Audit the exact emergency penalty and cap.',
    });

    expect(mergeDeveloperAuditTickets([saved], [seeded])).toEqual([
      expect.objectContaining({
        status: 'in_review',
        guidance: 'Audit the exact emergency penalty and cap.',
        targetContentIds: ['case.first-visit-depression', 'rule.mdd-emergency-escalation'],
        reviewerNotes: 'Keep the current penalty for now.',
        reviewerNotesUpdatedAt: '2026-07-23T10:00:00.000Z',
      }),
    ]);
  });
});
