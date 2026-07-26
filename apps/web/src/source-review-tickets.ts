import { SourceReviewTicketFeedSchema, type ClinicalReviewTicket } from '@psychsim/schemas';

export const SOURCE_REVIEW_TICKETS_ENDPOINT = '/__psychsim/source-review-tickets';

export const loadSourceReviewTickets = async (): Promise<ClinicalReviewTicket[]> => {
  const response = await fetch(SOURCE_REVIEW_TICKETS_ENDPOINT, {
    method: 'GET',
    cache: 'no-store',
  });
  if (response.status === 404) return [];
  if (!response.ok) {
    throw new Error(`Source-review ticket feed failed with status ${response.status}.`);
  }
  return SourceReviewTicketFeedSchema.parse(await response.json()).tickets;
};
