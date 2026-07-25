import acuteManiaScenarioJson from '../../../content/cases/blueprints/reviewer-cohort/acute-mania.scenario.json';
import bipolarDepressionScenarioJson from '../../../content/cases/blueprints/reviewer-cohort/bipolar-depression.scenario.json';
import gadInitialScenarioJson from '../../../content/cases/blueprints/reviewer-cohort/gad-initial.scenario.json';
import mddAdherenceScenarioJson from '../../../content/cases/blueprints/reviewer-cohort/mdd-adherence.scenario.json';
import mddAdequateNonresponseScenarioJson from '../../../content/cases/blueprints/reviewer-cohort/mdd-adequate-nonresponse.scenario.json';
import mddInitialScenarioJson from '../../../content/cases/blueprints/reviewer-cohort/mdd-initial.scenario.json';
import mddPriorGoodResponseScenarioJson from '../../../content/cases/blueprints/reviewer-cohort/mdd-prior-good-response.scenario.json';
import mddPriorIntoleranceScenarioJson from '../../../content/cases/blueprints/reviewer-cohort/mdd-prior-intolerance.scenario.json';
import ptsdInitialScenarioJson from '../../../content/cases/blueprints/reviewer-cohort/ptsd-initial.scenario.json';
import schizophreniaRelapseScenarioJson from '../../../content/cases/blueprints/reviewer-cohort/schizophrenia-relapse.scenario.json';
import reviewerAssignmentTicketsJson from '../../../content/cases/blueprints/reviewer-cohort/reviewer-assignment.tickets.json';

import { ClinicalReviewTicketSchema } from '@psychsim/schemas';
import { resolveClinicForProgressionMode } from '@psychsim/engine';

import {
  approvedCaseBlueprints,
  catalogs,
  prototypeCaseBlueprint,
  startingClinic,
} from './content';
import { buildReviewCaseCohort } from './review-cohort';
import { buildReviewerDecisionPolicies } from './reviewer-policies';
import { buildCaseRuleAudit } from './review-inspector';
import { REVIEWER_ASSIGNMENT_ID, REVIEWER_ASSIGNMENT_LABEL } from './reviewer-assignment';

export { REVIEWER_ASSIGNMENT_ID, REVIEWER_ASSIGNMENT_LABEL };

export const reviewerDecisionPolicies = buildReviewerDecisionPolicies(catalogs);

const reviewerScenarioJson = [
  mddInitialScenarioJson,
  mddAdherenceScenarioJson,
  mddAdequateNonresponseScenarioJson,
  mddPriorGoodResponseScenarioJson,
  mddPriorIntoleranceScenarioJson,
  gadInitialScenarioJson,
  bipolarDepressionScenarioJson,
  acuteManiaScenarioJson,
  schizophreniaRelapseScenarioJson,
  ptsdInitialScenarioJson,
] as const;

/**
 * Explicit, finite assignment used by the static Reviewer build. It is not a
 * general production-review glob and cannot pull arbitrary draft content into
 * GitHub Pages.
 */
export const reviewerCaseBlueprints = buildReviewCaseCohort(
  reviewerScenarioJson,
  reviewerDecisionPolicies,
  prototypeCaseBlueprint,
  catalogs,
);

/**
 * Exact, finite review-question assignment. Unlike the local Developer queue,
 * this file is deliberately imported by stable path and may contain questions
 * only for the ten portable Reviewer patients.
 */
export const reviewerClinicalAuditTickets = ClinicalReviewTicketSchema.array().parse(
  reviewerAssignmentTicketsJson,
);

const reviewerBlueprintIds = new Set(reviewerCaseBlueprints.map((blueprint) => blueprint.id));
const reviewerBlueprintById = new Map(
  reviewerCaseBlueprints.map((blueprint) => [blueprint.id, blueprint] as const),
);
const reviewerTicketIds = new Set<string>();
const assignedBlueprintIds = new Set<string>();
for (const ticket of reviewerClinicalAuditTickets) {
  if (!ticket.blueprintId || !reviewerBlueprintIds.has(ticket.blueprintId)) {
    throw new Error(`${ticket.id} is outside the finite portable Reviewer patient assignment.`);
  }
  if (reviewerTicketIds.has(ticket.id)) {
    throw new Error(`Duplicate portable Reviewer ticket ID: ${ticket.id}.`);
  }
  reviewerTicketIds.add(ticket.id);
  if (assignedBlueprintIds.has(ticket.blueprintId)) {
    throw new Error(
      `Portable Reviewer has more than one assigned ticket for ${ticket.blueprintId}.`,
    );
  }
  assignedBlueprintIds.add(ticket.blueprintId);
  const blueprint = reviewerBlueprintById.get(ticket.blueprintId)!;
  if (
    ticket.caseContentVersion !== blueprint.contentVersion ||
    ticket.sourceKind !== 'engine_audit' ||
    ticket.sourceAuthority !== 'developer_observation' ||
    ticket.attemptId !== null ||
    ticket.targetContentIds.length !== 1 ||
    ticket.targetContentIds[0] !== ticket.blueprintId
  ) {
    throw new Error(`${ticket.id} has invalid finite Reviewer assignment metadata.`);
  }
}
if (
  reviewerClinicalAuditTickets.length !== reviewerCaseBlueprints.length ||
  assignedBlueprintIds.size !== reviewerBlueprintIds.size
) {
  throw new Error('Portable Reviewer must assign exactly one ticket to every allowlisted patient.');
}

const reviewerClinic = resolveClinicForProgressionMode(startingClinic, 'endgame', catalogs);
export const reviewerCaseRuleAudits = [...approvedCaseBlueprints, ...reviewerCaseBlueprints].map(
  (blueprint) => buildCaseRuleAudit(blueprint, catalogs, reviewerClinic),
);
