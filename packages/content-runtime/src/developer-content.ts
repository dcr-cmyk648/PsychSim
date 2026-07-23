import {
  CaseBlueprintSchema,
  ClinicalReviewTicketSchema,
  type CaseBlueprint,
  type ClinicalReviewTicket,
} from '@psychsim/schemas';

import { approvedCaseBlueprints, catalogs, startingClinic } from './content';
import { milestoneTwoClinicalAuditTickets } from './milestone-two-review-tickets';
import { buildCaseRuleAudit } from './review-inspector';
export { developerSourceRequests } from './source-requests';

const reviewCaseModules = import.meta.glob('../../../content/cases/review/*.case.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;
const reviewCaseBlueprints = Object.entries(reviewCaseModules)
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([, value]) => CaseBlueprintSchema.parse(value));

/**
 * Developer-only content pool. The web app imports this module dynamically only
 * in a Vite development build, so review content cannot enter production output.
 */
export const developerCaseBlueprints: readonly CaseBlueprint[] = [
  ...approvedCaseBlueprints,
  ...reviewCaseBlueprints,
];

export const developerCaseRuleAudits = developerCaseBlueprints.map((blueprint) =>
  buildCaseRuleAudit(blueprint, catalogs, startingClinic),
);

const generatedTicketModules = import.meta.glob('../../../content/cases/review/*.tickets.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;
const generatedClinicalAuditTickets = Object.entries(generatedTicketModules)
  .sort(([left], [right]) => left.localeCompare(right))
  .flatMap(([, value]) => ClinicalReviewTicketSchema.array().parse(value));

export const developerClinicalAuditTickets: readonly ClinicalReviewTicket[] = [
  ...milestoneTwoClinicalAuditTickets,
  ...generatedClinicalAuditTickets,
];
