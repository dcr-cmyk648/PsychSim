import { describe, expect, it } from 'vitest';
import { instantiateCase, resolveClinicForProgressionMode } from '@psychsim/engine';

import { catalogs, startingClinic } from './content';
import { runReferenceSolutionsForCase } from './reference-runs';
import { reviewerCaseBlueprints, reviewerDecisionPolicies } from './reviewer-content';
import { validateCaseBlueprint } from './validation';

describe('portable reviewer cohort', () => {
  const reviewerClinic = resolveClinicForProgressionMode(startingClinic, 'endgame', catalogs);

  it('compiles ten separate medically unreviewed patient scenarios', () => {
    expect(reviewerCaseBlueprints.map((blueprint) => blueprint.id)).toEqual([
      'case.review-cohort.mdd-initial',
      'case.review-cohort.mdd-adherence',
      'case.review-cohort.mdd-adequate-nonresponse',
      'case.review-cohort.mdd-prior-good-response',
      'case.review-cohort.mdd-prior-intolerance',
      'case.review-cohort.gad-initial',
      'case.review-cohort.bipolar-depression',
      'case.review-cohort.acute-mania',
      'case.review-cohort.schizophrenia-relapse',
      'case.review-cohort.ptsd-initial',
    ]);
    expect(reviewerDecisionPolicies.map((policy) => policy.id)).toHaveLength(8);
    for (const blueprint of reviewerCaseBlueprints) {
      expect(blueprint.metadata).toMatchObject({
        fictional: true,
        synthetic: true,
        medicalReviewStatus: 'unreviewed',
        lifecycle: 'review',
      });
      expect(blueprint.patientRecord.sourceUseNotes.length).toBeGreaterThan(0);
      expect(validateCaseBlueprint(blueprint, catalogs, reviewerClinic)).toEqual({
        valid: true,
        issues: [],
      });
    }
  });

  it('keeps patient critical facts and executable policy invariant across many seeds', () => {
    for (const blueprint of reviewerCaseBlueprints) {
      const baseline = instantiateCase(blueprint, 'reviewer-invariant-0', catalogs);
      for (let index = 1; index <= 40; index += 1) {
        const instance = instantiateCase(blueprint, `reviewer-invariant-${index}`, catalogs);
        expect(instance.criticalFacts).toEqual(baseline.criticalFacts);
        expect(instance.workupObjectives).toEqual(baseline.workupObjectives);
        expect(instance.treatmentGrades).toEqual(baseline.treatmentGrades);
        expect(instance.treatmentPathways).toEqual(baseline.treatmentPathways);
        expect(instance.scoreRules).toEqual(baseline.scoreRules);
      }
    }
  });

  it('keeps all shared investigation options and an immediate result in every patient', () => {
    const catalogActionIds = catalogs.informationActions.map((action) => action.id).sort();
    for (const blueprint of reviewerCaseBlueprints) {
      expect(blueprint.informationActions.map((action) => action.actionId).sort()).toEqual(
        catalogActionIds,
      );
      expect(
        blueprint.informationActions.every((action) => action.result.findings.length > 0),
      ).toBe(true);
    }
  });

  it('orders each finite reference set and gives unsafe play no meaningful payout', () => {
    for (const blueprint of reviewerCaseBlueprints) {
      const runs = runReferenceSolutionsForCase(blueprint, reviewerClinic);
      const byKind = new Map(runs.map((run) => [run.kind, run.receipt]));
      const database = byKind.get('database_plan')!;
      const alternative = byKind.get('strong_alternative')!;
      const shotgun = byKind.get('shotgun')!;
      const unsafe = byKind.get('unsafe')!;
      expect(database.pointReport.carePointsEarned).toBe(blueprint.scoring.databasePlanCarePoints);
      expect(database.pointReport.carePointsEarned).toBeGreaterThan(
        alternative.pointReport.carePointsEarned,
      );
      expect(alternative.pointReport.carePointsEarned).toBeGreaterThan(
        shotgun.pointReport.carePointsEarned,
      );
      expect(shotgun.pointReport.carePointsEarned).toBeGreaterThan(
        unsafe.pointReport.carePointsEarned,
      );
      expect(database.settlement.netClinicPointsEarned).toBeGreaterThan(
        shotgun.settlement.netClinicPointsEarned,
      );
      expect(unsafe.settlement.netClinicPointsEarned).toBeLessThanOrEqual(20);
    }
  });
});
