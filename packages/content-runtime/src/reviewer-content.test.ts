import { describe, expect, it } from 'vitest';
import { instantiateCase, resolveClinicForProgressionMode } from '@psychsim/engine';

import { catalogs, startingClinic } from './content';
import { runReferenceSolutionsForCase } from './reference-runs';
import { REVIEWER_ASSIGNMENT_ID } from './reviewer-assignment';
import { reviewerCaseBlueprints, reviewerDecisionPolicies } from './reviewer-content';
import { validateCaseBlueprint } from './validation';

describe('portable reviewer cohort', () => {
  const reviewerClinic = resolveClinicForProgressionMode(startingClinic, 'endgame', catalogs);

  it('compiles ten separate medically unreviewed patient scenarios', () => {
    expect(REVIEWER_ASSIGNMENT_ID).toBe('reviewer-assignment.common-psychiatry.2026-07b');
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
    expect(reviewerCaseBlueprints.every((blueprint) => blueprint.contentVersion === '1.1.0')).toBe(
      true,
    );
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
  }, 15_000);

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

  it('resolves diagnosis-scoped symptom duration as a deterministic structured measurement', () => {
    for (const blueprint of reviewerCaseBlueprints) {
      const resolvedOptions = new Set<string>();
      for (let index = 0; index < 30; index += 1) {
        const seed = `reviewer-duration-${index}`;
        const first = instantiateCase(blueprint, seed, catalogs);
        const repeated = instantiateCase(blueprint, seed, catalogs);
        const duration = first.informationActions
          .find((action) => action.actionId === 'info.history.presenting-problem')
          ?.result.findings.find((finding) => finding.durationMeasurement)?.durationMeasurement;
        const repeatedDuration = repeated.informationActions
          .find((action) => action.actionId === 'info.history.presenting-problem')
          ?.result.findings.find((finding) => finding.durationMeasurement)?.durationMeasurement;
        expect(duration).toEqual(repeatedDuration);
        expect(duration?.interpretation).toBe('supports_authored_state');
        expect(
          first.patientRecord.diagnoses.some(
            (diagnosis) => diagnosis.id === duration?.relatedDiagnosisId,
          ),
        ).toBe(true);
        if (duration) resolvedOptions.add(duration.optionId);
      }
      expect(resolvedOptions.size).toBeGreaterThan(1);
    }
  }, 15_000);

  it('allows bounded background anxiety variation without generating a full syndrome', () => {
    const blueprint = reviewerCaseBlueprints.find(
      (candidate) => candidate.id === 'case.review-cohort.mdd-initial',
    )!;
    const positiveCounts = new Set<number>();
    for (let index = 0; index < 80; index += 1) {
      const instance = instantiateCase(blueprint, `background-anxiety-${index}`, catalogs);
      const anxiety = instance.informationActions.find(
        (action) => action.actionId === 'info.history.anxiety-symptoms',
      )!;
      const presentCount = anxiety.result.findings.filter(
        (finding) => finding.outcome === 'present',
      ).length;
      expect(presentCount).toBeLessThanOrEqual(1);
      positiveCounts.add(presentCount);
    }
    expect(positiveCounts).toEqual(new Set([0, 1]));
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
      for (const receipt of byKind.values()) {
        expect(
          receipt.pointReport.ruleTrace.every((trace) => trace.evidenceAttributions.length > 0),
        ).toBe(true);
      }
    }
  });
});
