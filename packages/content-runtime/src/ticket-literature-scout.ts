import {
  TicketLiteratureScoutCatalogSchema,
  type ClinicalReviewTicket,
  type SourceRequest,
  type TicketLiteratureScoutCatalog,
} from '@psychsim/schemas';

import catalogJson from '../../../content/cases/review/ticket-literature-scout.catalog.json';

export interface TicketLiteratureScoutValidationIssue {
  severity: 'error';
  code: string;
  message: string;
}

export interface TicketLiteratureScoutValidationReport {
  valid: boolean;
  issues: TicketLiteratureScoutValidationIssue[];
}

export const developerTicketLiteratureScoutCatalog: TicketLiteratureScoutCatalog =
  TicketLiteratureScoutCatalogSchema.parse(catalogJson);

const duplicateIds = (ids: readonly string[]): string[] => [
  ...new Set(ids.filter((id, index) => ids.indexOf(id) !== index)),
];

export const validateTicketLiteratureScoutCatalog = (
  catalog: TicketLiteratureScoutCatalog,
  tickets: readonly ClinicalReviewTicket[],
  sourceRequests: readonly SourceRequest[],
): TicketLiteratureScoutValidationReport => {
  const issues: TicketLiteratureScoutValidationIssue[] = [];
  const add = (code: string, message: string): void => {
    issues.push({ severity: 'error', code, message });
  };

  const activeTickets = tickets.filter(
    (ticket) => ticket.status !== 'resolved' && ticket.status !== 'rejected',
  );
  const ticketIds = tickets.map((ticket) => ticket.id);
  for (const id of duplicateIds(ticketIds)) add('DUPLICATE_CLINICAL_TICKET_ID', id);

  const ticketsById = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  const requestsById = new Map(sourceRequests.map((request) => [request.id, request]));
  const referencesById = new Map(catalog.references.map((reference) => [reference.id, reference]));
  const profilesById = new Map(catalog.profiles.map((profile) => [profile.id, profile]));

  for (const id of duplicateIds(catalog.references.map((reference) => reference.id))) {
    add('DUPLICATE_LITERATURE_SCOUT_REFERENCE_ID', id);
  }
  for (const id of duplicateIds(catalog.profiles.map((profile) => profile.id))) {
    add('DUPLICATE_LITERATURE_SCOUT_PROFILE_ID', id);
  }
  for (const id of duplicateIds(catalog.attachments.map((attachment) => attachment.ticketId))) {
    add('DUPLICATE_LITERATURE_SCOUT_TICKET_ATTACHMENT', id);
  }

  for (const profile of catalog.profiles) {
    for (const id of duplicateIds(profile.linkedSourceRequestIds)) {
      add('DUPLICATE_LITERATURE_SCOUT_SOURCE_REQUEST', `${profile.id}: ${id}`);
    }
    for (const requestId of profile.linkedSourceRequestIds) {
      if (!requestsById.has(requestId)) {
        add('INVALID_LITERATURE_SCOUT_SOURCE_REQUEST', `${profile.id}: ${requestId}`);
      }
    }
    if (profile.selectedReferenceId && !referencesById.has(profile.selectedReferenceId)) {
      add('INVALID_LITERATURE_SCOUT_REFERENCE', `${profile.id}: ${profile.selectedReferenceId}`);
    }
    if (
      profile.searchRun &&
      profile.searchRun.screenedResultCount > profile.searchRun.resultCount
    ) {
      add(
        'INVALID_LITERATURE_SCOUT_SCREEN_COUNT',
        `${profile.id}: screened ${profile.searchRun.screenedResultCount} of ${profile.searchRun.resultCount}`,
      );
    }
    if (
      profile.searchRun?.selectedRank &&
      profile.searchRun.selectedRank > profile.searchRun.screenedResultCount
    ) {
      add(
        'INVALID_LITERATURE_SCOUT_SELECTED_RANK',
        `${profile.id}: selected rank ${profile.searchRun.selectedRank} exceeds screened results`,
      );
    }
    if (profile.selectedReferenceId) {
      const reference = referencesById.get(profile.selectedReferenceId);
      const plan = profile.searchPlan;
      if (
        reference &&
        plan &&
        (reference.publicationDate < plan.windowStart || reference.publicationDate > plan.windowEnd)
      ) {
        add(
          'LITERATURE_SCOUT_REFERENCE_OUTSIDE_WINDOW',
          `${profile.id}: ${reference.pmid} (${reference.publicationDate})`,
        );
      }
    }
  }

  for (const attachment of catalog.attachments) {
    if (!ticketsById.has(attachment.ticketId)) {
      add('INVALID_LITERATURE_SCOUT_TICKET', attachment.ticketId);
    }
    for (const id of duplicateIds(attachment.profileIds)) {
      add('DUPLICATE_LITERATURE_SCOUT_ATTACHMENT_PROFILE', `${attachment.ticketId}: ${id}`);
    }
    for (const profileId of attachment.profileIds) {
      if (!profilesById.has(profileId)) {
        add('INVALID_LITERATURE_SCOUT_ATTACHMENT_PROFILE', `${attachment.ticketId}: ${profileId}`);
      }
    }
  }

  const attachedTicketIds = new Set(catalog.attachments.map((attachment) => attachment.ticketId));
  for (const ticket of activeTickets) {
    if (!attachedTicketIds.has(ticket.id)) {
      add('MISSING_LITERATURE_SCOUT_TICKET_COVERAGE', ticket.id);
    }
  }

  const usedProfileIds = new Set(
    catalog.attachments.flatMap((attachment) => attachment.profileIds),
  );
  for (const profile of catalog.profiles) {
    if (!usedProfileIds.has(profile.id)) {
      add('UNUSED_LITERATURE_SCOUT_PROFILE', profile.id);
    }
  }

  const usedReferenceIds = new Set(
    catalog.profiles.flatMap((profile) =>
      profile.selectedReferenceId ? [profile.selectedReferenceId] : [],
    ),
  );
  for (const reference of catalog.references) {
    if (!usedReferenceIds.has(reference.id)) {
      add('UNUSED_LITERATURE_SCOUT_REFERENCE', reference.id);
    }
  }

  return { valid: issues.length === 0, issues };
};
