import { describe, expect, it } from 'vitest';

import { developerClinicalAuditTickets, developerSourceRequests } from './developer-content';
import {
  developerTicketLiteratureScoutCatalog,
  validateTicketLiteratureScoutCatalog,
} from './ticket-literature-scout';

describe('Developer ticket literature scout', () => {
  it('covers every unresolved checked-in Developer ticket and no portable Reviewer ticket', () => {
    expect(
      validateTicketLiteratureScoutCatalog(
        developerTicketLiteratureScoutCatalog,
        developerClinicalAuditTickets,
        developerSourceRequests,
      ),
    ).toEqual({ valid: true, issues: [] });

    const activeTicketIds = developerClinicalAuditTickets
      .filter((ticket) => ticket.status !== 'resolved' && ticket.status !== 'rejected')
      .map((ticket) => ticket.id)
      .sort();
    const attachedTicketIds = developerTicketLiteratureScoutCatalog.attachments
      .map((attachment) => attachment.ticketId)
      .sort();
    expect(attachedTicketIds).toEqual(activeTicketIds);
    expect(attachedTicketIds.some((id) => id.startsWith('ticket.reviewer-cohort.'))).toBe(false);
  });

  it('rejects a missing active-ticket attachment', () => {
    const invalid = structuredClone(developerTicketLiteratureScoutCatalog);
    invalid.attachments.pop();
    expect(
      validateTicketLiteratureScoutCatalog(
        invalid,
        developerClinicalAuditTickets,
        developerSourceRequests,
      ).issues,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'MISSING_LITERATURE_SCOUT_TICKET_COVERAGE' }),
      ]),
    );
  });

  it('rejects unknown ticket, profile, and source-request links', () => {
    const invalid = structuredClone(developerTicketLiteratureScoutCatalog);
    invalid.attachments[0]!.ticketId = 'ticket.unknown';
    invalid.attachments[1]!.profileIds = ['literature-profile.unknown'];
    invalid.profiles[0]!.linkedSourceRequestIds = ['source-request.unknown'];

    const codes = validateTicketLiteratureScoutCatalog(
      invalid,
      developerClinicalAuditTickets,
      developerSourceRequests,
    ).issues.map((issue) => issue.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'INVALID_LITERATURE_SCOUT_TICKET',
        'INVALID_LITERATURE_SCOUT_ATTACHMENT_PROFILE',
        'INVALID_LITERATURE_SCOUT_SOURCE_REQUEST',
        'MISSING_LITERATURE_SCOUT_TICKET_COVERAGE',
      ]),
    );
  });
});
