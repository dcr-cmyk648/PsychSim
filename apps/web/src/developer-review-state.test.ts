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

const sourceReviewTicket = ClinicalReviewTicketSchema.parse({
  ...baseTicket,
  id: 'ticket.source-review.aaaaaaaaaaaaaaaaaaaaaaaa',
  title: 'Review one imported medication summary',
  sourceKind: 'source_claim',
  sourceAuthority: 'source_document',
  ticketType: 'medication_fit',
  attemptId: null,
  blueprintId: null,
  caseContentVersion: null,
  targetContentIds: ['medication.bupropion'],
  proposedRouting: 'Keep every proposed rule unreviewed until the packet is answered.',
  guidance: 'Which candidate takeaways should proceed to evidence review?',
  sourceReviewSnapshot: {
    schemaVersion: 1,
    packetVersion: 1,
    packetHash: 'a'.repeat(64),
    sourceUnitFingerprint: 'b'.repeat(64),
    projectionPolicy: 'original_paraphrase_no_source_text',
    derivedDisplayTitle: 'Review one imported medication summary',
    decisionQuestion: 'Which candidate takeaways should proceed to evidence review?',
    proposedRouting: 'Keep every proposed rule unreviewed until the packet is answered.',
    reviewContext: {
      ticketType: 'medication_fit',
      priority: 'high',
      requiresClinicalAcumen: true,
      dependencyTicketIds: [],
      conflictContentIds: [],
      resurfacingTrigger: null,
    },
    originalSummary: 'A private author note contains several candidate medication judgments.',
    atomicProposals: [
      {
        schemaVersion: 1,
        id: 'source-proposal.bupropion.fit',
        proposalType: 'developer_opinion',
        summary: 'Consider one fit modifier only after evidence and clinical review.',
        publicTargetContentIds: ['medication.bupropion'],
        unresolvedTargetLabels: [],
        uncertainty: ['Point magnitude remains undecided.'],
      },
    ],
    publicTargetContentIds: ['medication.bupropion'],
    unresolvedTargetLabels: [],
    uncertainty: ['The source is not currentness-reviewed.'],
    conflicts: [],
    currentness: {
      status: 'needs_currentness_review',
      evaluatedThrough: null,
      note: 'No currentness review has been completed.',
    },
    rightsState: {
      status: 'source_use_decision',
      sourceUseDecisionId: 'source-use-decision.synthetic',
      portableReviewAllowed: false,
      note: 'Local review only.',
    },
    boundaryState: 'uncertain',
    boundaryQuestion: 'Confirm the imported heading boundary before atomization.',
    medicalReviewStatus: 'unreviewed',
    runtimeEffect: false,
  },
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

  it('preserves the exact linked attempt when checked-in ticket fields refresh', () => {
    const saved = ClinicalReviewTicketSchema.parse({
      ...baseTicket,
      attemptId: 'attempt.case.first-visit-depression.7',
      status: 'in_review',
      reviewerNotes: 'Keep this linked to the patient I reviewed.',
      reviewerNotesUpdatedAt: '2026-07-24T20:00:00.000Z',
    });
    const seeded = ClinicalReviewTicketSchema.parse({
      ...baseTicket,
      guidance: 'Updated checked-in question.',
      targetContentIds: ['case.first-visit-depression', 'rule.mdd-outpatient-disposition'],
    });

    expect(mergeDeveloperAuditTickets([saved], [seeded])).toEqual([
      expect.objectContaining({
        attemptId: 'attempt.case.first-visit-depression.7',
        guidance: 'Updated checked-in question.',
        reviewerNotes: 'Keep this linked to the patient I reviewed.',
      }),
    ]);
  });

  it('preserves an immutable source packet after it enters browser-owned review state', () => {
    const saved = ClinicalReviewTicketSchema.parse({
      ...sourceReviewTicket,
      status: 'in_review',
      reviewerNotes: 'Keep the seizure judgment separate from the efficacy claims.',
      reviewerNotesUpdatedAt: '2026-07-25T20:00:00.000Z',
    });
    const seeded = ClinicalReviewTicketSchema.parse({
      ...sourceReviewTicket,
      updatedAt: '2026-07-25T21:00:00.000Z',
    });

    expect(mergeDeveloperAuditTickets([saved], [seeded])).toEqual([saved]);
  });

  it('rejects a source packet hash change under an existing ticket ID', () => {
    const changed = {
      ...sourceReviewTicket,
      sourceReviewSnapshot: {
        ...sourceReviewTicket.sourceReviewSnapshot!,
        packetHash: 'c'.repeat(64),
      },
    } as typeof sourceReviewTicket;

    expect(() => mergeDeveloperAuditTickets([sourceReviewTicket], [changed])).toThrow(
      'Immutable source-review ticket',
    );
  });

  it('rejects source packet content drift even when a stale hash is retained', () => {
    const changed = {
      ...sourceReviewTicket,
      sourceReviewSnapshot: {
        ...sourceReviewTicket.sourceReviewSnapshot!,
        originalSummary: 'Changed content with the old packet hash.',
      },
    } as typeof sourceReviewTicket;

    expect(() => mergeDeveloperAuditTickets([sourceReviewTicket], [changed])).toThrow(
      'Immutable source-review ticket',
    );
  });
});
