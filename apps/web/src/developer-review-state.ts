import { ClinicalReviewTicketSchema, type ClinicalReviewTicket } from '@psychsim/schemas';

/**
 * Refresh checked-in audit/routing fields while preserving the browser-owned
 * review outcome. This lets exact rule target IDs improve without erasing a
 * clinician's saved prose or resolution history.
 */
export const mergeDeveloperAuditTickets = (
  savedTickets: readonly ClinicalReviewTicket[],
  seededTickets: readonly ClinicalReviewTicket[],
): ClinicalReviewTicket[] => {
  const seededById = new Map(seededTickets.map((ticket) => [ticket.id, ticket]));
  const refreshed = savedTickets.map((ticket) => {
    const seeded = seededById.get(ticket.id);
    if (seeded && (ticket.sourceReviewSnapshot || seeded.sourceReviewSnapshot)) {
      if (
        !ticket.sourceReviewSnapshot ||
        !seeded.sourceReviewSnapshot ||
        ticket.sourceReviewSnapshot.packetHash !== seeded.sourceReviewSnapshot.packetHash ||
        JSON.stringify(ticket.sourceReviewSnapshot) !== JSON.stringify(seeded.sourceReviewSnapshot)
      ) {
        throw new Error(
          `Immutable source-review ticket ${ticket.id} changed under an existing browser record.`,
        );
      }
      return ClinicalReviewTicketSchema.parse(ticket);
    }
    return seeded
      ? ClinicalReviewTicketSchema.parse({
          ...ticket,
          ...seeded,
          attemptId: ticket.attemptId,
          status: ticket.status,
          reviewerNotes: ticket.reviewerNotes,
          reviewerNotesUpdatedAt: ticket.reviewerNotesUpdatedAt,
          resolution: ticket.resolution,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
        })
      : ticket;
  });
  const existingIds = new Set(refreshed.map((ticket) => ticket.id));
  return [...refreshed, ...seededTickets.filter((ticket) => !existingIds.has(ticket.id))];
};
