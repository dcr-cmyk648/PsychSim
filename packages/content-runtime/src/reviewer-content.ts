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

import { catalogs, prototypeCaseBlueprint } from './content';
import { buildReviewCaseCohort } from './review-cohort';
import { buildReviewerDecisionPolicies } from './reviewer-policies';
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
