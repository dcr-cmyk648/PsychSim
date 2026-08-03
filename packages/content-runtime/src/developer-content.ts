import {
  CaseBlueprintSchema,
  ClinicalReviewTicketSchema,
  type CaseBlueprint,
  type ClinicalReviewTicket,
} from '@psychsim/schemas';

import { approvedCaseBlueprints, catalogs, startingClinic } from './content';
import {
  developerLiteratureSynthesisProposals,
  validateLiteratureSynthesisProposals,
} from './literature-synthesis';
import { milestoneTwoClinicalAuditTickets } from './milestone-two-review-tickets';
import { buildDeveloperOpinionReferenceNeeds } from './opinion-audit';
import { buildCaseRuleAudit } from './review-inspector';
import { reviewerCaseBlueprints } from './reviewer-content';
import { developerSourceRequests } from './source-requests';
import {
  developerTicketLiteratureScoutCatalog,
  validateTicketLiteratureScoutCatalog,
} from './ticket-literature-scout';
import { validateCaseBlueprint } from './validation';
export {
  developerLiteratureSynthesisProposals,
  developerSourceRequests,
  developerTicketLiteratureScoutCatalog,
  validateLiteratureSynthesisProposals,
  validateTicketLiteratureScoutCatalog,
};

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
  ...reviewerCaseBlueprints,
];

export interface DeveloperPatientMakerCase {
  readonly blueprintId: string;
  readonly contentVersion: string;
  readonly label: string;
  readonly authoredComplexityBudget: number;
  readonly maximumSelectedModules: number;
  readonly settingLabels: readonly string[];
}

/**
 * Strict finite allowlist for the transitional local Developer Patient Maker.
 * A case enters only after the same complete content validator used by the CLI
 * confirms that it can instantiate, reach its required actions, execute its
 * reference solutions, score, and settle in every declared location.
 */
export const developerPatientMakerCases: readonly DeveloperPatientMakerCase[] =
  developerCaseBlueprints.flatMap((blueprint) => {
    const complexity = blueprint.patientRecord.complexityProfile;
    if (
      !validateCaseBlueprint(blueprint, catalogs, startingClinic).valid ||
      complexity.measurementStatus === 'legacy_unmeasured'
    ) {
      return [];
    }
    return [
      {
        blueprintId: blueprint.id,
        contentVersion: blueprint.contentVersion,
        label: blueprint.metadata.title,
        authoredComplexityBudget: complexity.additionalFeatureBudget,
        maximumSelectedModules: complexity.maximumSelectedModules,
        settingLabels: blueprint.metadata.compatibleLocationIds.map(
          (locationId) =>
            catalogs.locations.find((location) => location.id === locationId)?.label ?? locationId,
        ),
      },
    ];
  });

export const developerCaseRuleAudits = developerCaseBlueprints.map((blueprint) =>
  buildCaseRuleAudit(blueprint, catalogs, startingClinic),
);

export const developerOpinionReferenceNeeds = buildDeveloperOpinionReferenceNeeds(
  developerCaseBlueprints,
  catalogs,
  developerSourceRequests,
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
