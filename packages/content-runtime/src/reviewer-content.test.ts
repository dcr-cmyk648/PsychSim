import { describe, expect, it } from 'vitest';
import { instantiateCase, resolveClinicForProgressionMode } from '@psychsim/engine';

import { catalogs, startingClinic } from './content';
import { runReferenceSolution, runReferenceSolutionsForCase } from './reference-runs';
import { REVIEWER_ASSIGNMENT_ID } from './reviewer-assignment';
import {
  reviewerCaseBlueprints,
  reviewerClinicalAuditTickets,
  reviewerDecisionPolicies,
} from './reviewer-content';
import { validateCaseBlueprint } from './validation';

describe('portable reviewer cohort', () => {
  const reviewerClinic = resolveClinicForProgressionMode(startingClinic, 'endgame', catalogs);

  it('compiles ten separate medically unreviewed patient scenarios', () => {
    expect(REVIEWER_ASSIGNMENT_ID).toBe('reviewer-assignment.common-psychiatry.2026-07g');
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
    expect(
      Object.fromEntries(
        reviewerCaseBlueprints.map((blueprint) => [blueprint.id, blueprint.contentVersion]),
      ),
    ).toEqual({
      'case.review-cohort.mdd-initial': '1.6.0',
      'case.review-cohort.mdd-adherence': '1.4.0',
      'case.review-cohort.mdd-adequate-nonresponse': '1.5.0',
      'case.review-cohort.mdd-prior-good-response': '1.6.0',
      'case.review-cohort.mdd-prior-intolerance': '1.6.0',
      'case.review-cohort.gad-initial': '1.4.0',
      'case.review-cohort.bipolar-depression': '1.5.0',
      'case.review-cohort.acute-mania': '1.4.0',
      'case.review-cohort.schizophrenia-relapse': '1.4.0',
      'case.review-cohort.ptsd-initial': '1.4.0',
    });
    expect(reviewerDecisionPolicies.map((policy) => policy.id)).toHaveLength(8);
    expect(
      reviewerDecisionPolicies.find((policy) => policy.id === 'policy.review.mdd.initial'),
    ).toMatchObject({ contentVersion: '1.2.0' });
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

  it('ships one exact preassigned ticket for each portable Reviewer patient', () => {
    expect(reviewerClinicalAuditTickets).toHaveLength(reviewerCaseBlueprints.length);
    expect(reviewerClinicalAuditTickets.map((ticket) => ticket.blueprintId).sort()).toEqual(
      reviewerCaseBlueprints.map((blueprint) => blueprint.id).sort(),
    );
    expect(
      reviewerClinicalAuditTickets.every(
        (ticket) =>
          ticket.attemptId === null &&
          ticket.status === 'proposed' &&
          ticket.reviewerNotes === '' &&
          ticket.requiresClinicalAcumen,
      ),
    ).toBe(true);
  });

  it('shows concrete prior-trial exposure without revealing an adequacy conclusion', () => {
    const blueprint = reviewerCaseBlueprints.find(
      (candidate) => candidate.id === 'case.review-cohort.mdd-adequate-nonresponse',
    );
    if (!blueprint) throw new Error('Expected the MDD nonresponse reviewer patient.');
    const instance = instantiateCase(blueprint, 'objective-prior-trial', catalogs);
    const result = instance.informationActions.find(
      (action) => action.actionId === 'info.history.prior-trials',
    )?.result;
    const trialValue = result?.findings[0]?.valueText ?? '';

    expect(trialValue).toContain('10 weeks');
    expect(trialValue).toContain('max 200 mg daily');
    expect(trialValue).toContain('response: none');
    expect(trialValue.toLocaleLowerCase('en-US')).not.toContain('adequate');
  });

  it('scores every multi-antidepressant start in the initial outpatient MDD snapshot', () => {
    const blueprint = reviewerCaseBlueprints.find(
      (candidate) => candidate.id === 'case.review-cohort.mdd-initial',
    )!;
    const databasePlan = blueprint.referenceSolutions.find(
      (solution) => solution.kind === 'database_plan',
    )!;
    const antidepressants = blueprint.availableTreatments.startMedicationIds.filter(
      (medicationId) =>
        catalogs.medications
          .find((medication) => medication.id === medicationId)
          ?.tags.includes('antidepressant'),
    );
    expect(antidepressants).toEqual([
      'medication.sertraline',
      'medication.escitalopram',
      'medication.fluoxetine',
      'medication.bupropion',
      'medication.mirtazapine',
    ]);
    expect(
      blueprint.treatmentGrades.find(
        (grade) => grade.id === 'grade.review-mdd.multiple-antidepressant-starts',
      )?.predicate,
    ).toMatchObject({
      type: 'treatmentStartedWithTag',
      minimumCount: 2,
      maximumCount: antidepressants.length,
    });

    for (let left = 0; left < antidepressants.length; left += 1) {
      for (let right = left + 1; right < antidepressants.length; right += 1) {
        const first = antidepressants[left]!;
        const second = antidepressants[right]!;
        const receipt = runReferenceSolution(
          {
            id: `reference.test.review-mdd.multiple.${left}-${right}`,
            label: 'Multiple antidepressant start test',
            kind: 'unsafe',
            actionIds: databasePlan.actionIds,
            diagnosisSelections: [],
            selections: {
              startMedicationIds: [first, second],
              stopMedicationIds: [],
              continueMedicationIds: [],
              interventionIds: [],
              dispositionId: 'disposition.outpatient-followup',
            },
            explanation: 'Exercises the bounded initial-outpatient duplicate-start rule.',
          },
          `review-mdd-multiple-${left}-${right}`,
          blueprint,
          reviewerClinic,
        ).receipt;

        expect(receipt.pointReport).toMatchObject({
          treatmentGrade: 'harmful',
          carePointCapApplied: 0,
        });
        expect(
          receipt.pointReport.ruleTrace.find(
            (trace) => trace.ruleId === 'grade.review-mdd.multiple-antidepressant-starts',
          ),
        ).toMatchObject({
          matched: true,
          points: -500,
          evidenceAttributions: [
            {
              sourceUseNoteId:
                'source-use.review-mdd.multiple-antidepressant-starts.developer-opinion',
              authority: 'expert_opinion',
              evidenceSourceId: null,
              citation: null,
              url: null,
              contribution: expect.stringMatching(/^Developer opinion:/),
            },
          ],
        });
        expect(
          receipt.pointReport.ruleTrace.find(
            (trace) => trace.ruleId === 'rule.review-mdd.multiple-antidepressant-starts.safety-cap',
          ),
        ).toMatchObject({
          matched: true,
          points: -500,
          evidenceAttributions: [
            {
              sourceUseNoteId:
                'source-use.review-mdd.multiple-antidepressant-starts.developer-opinion',
              authority: 'expert_opinion',
              evidenceSourceId: null,
              citation: null,
              url: null,
              contribution: expect.stringMatching(/^Developer opinion:/),
            },
          ],
        });
        expect(receipt.pointReport.safetyErrors).toEqual([
          expect.stringContaining('Multiple antidepressants started together'),
        ]);
      }
    }

    const singleMedicationCarePoints = new Set<number>();
    for (const [index, medicationId] of antidepressants.entries()) {
      const receipt = runReferenceSolution(
        {
          id: `reference.test.review-mdd.single.${index}`,
          label: 'Single antidepressant start test',
          kind: 'strong_alternative',
          actionIds: databasePlan.actionIds,
          diagnosisSelections: [],
          selections: {
            startMedicationIds: [medicationId],
            stopMedicationIds: [],
            continueMedicationIds: [],
            interventionIds:
              medicationId === 'medication.sertraline' ? ['intervention.psychotherapy.cbt'] : [],
            dispositionId: 'disposition.outpatient-followup',
          },
          explanation:
            'Confirms one medication, including medication plus therapy, is not duplicate treatment.',
        },
        `review-mdd-single-${index}`,
        blueprint,
        reviewerClinic,
      ).receipt;

      expect(receipt.pointReport.treatmentGrade).toBe('optimal');
      singleMedicationCarePoints.add(receipt.pointReport.carePointsEarned);
      expect(
        receipt.pointReport.ruleTrace.find(
          (trace) => trace.ruleId === 'grade.review-mdd.initial-first-line-antidepressant',
        ),
      ).toMatchObject({
        matched: true,
        points: 200,
        evidenceAttributions: [
          expect.objectContaining({
            authority: 'formal_publication',
            evidenceSourceId: 'evidence.canmat.mdd-adults.2023-update',
          }),
        ],
      });
      expect(
        receipt.pointReport.ruleTrace.find(
          (trace) => trace.ruleId === 'rule.review-mdd.multiple-antidepressant-starts.safety-cap',
        ),
      ).toMatchObject({ matched: false });
    }
    expect(singleMedicationCarePoints).toEqual(new Set([510]));

    const allAntidepressantsReceipt = runReferenceSolution(
      {
        id: 'reference.test.review-mdd.all-antidepressants',
        label: 'All antidepressant starts test',
        kind: 'unsafe',
        actionIds: databasePlan.actionIds,
        diagnosisSelections: [],
        selections: {
          startMedicationIds: antidepressants,
          stopMedicationIds: [],
          continueMedicationIds: [],
          interventionIds: [],
          dispositionId: 'disposition.outpatient-followup',
        },
        explanation: 'Guards the upper count bound as the treatment catalog changes.',
      },
      'review-mdd-all-antidepressants',
      blueprint,
      reviewerClinic,
    ).receipt;
    expect(allAntidepressantsReceipt.pointReport).toMatchObject({
      treatmentGrade: 'harmful',
      carePointCapApplied: 0,
    });

    const formalTrace = runReferenceSolution(
      databasePlan,
      'review-mdd-formal-provenance',
      blueprint,
      reviewerClinic,
    ).receipt.pointReport.ruleTrace.find(
      (trace) => trace.ruleId === 'objective.review-mdd.timeline',
    );
    expect(formalTrace?.evidenceAttributions).toEqual([
      expect.objectContaining({
        authority: 'formal_publication',
        evidenceSourceId: 'evidence.canmat.mdd-adults.2023-update',
      }),
    ]);
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
      expect(blueprint.patientRecord.reactionHistory.status).not.toBe('unassessed');
      expect(blueprint.patientRecord.reportedSafetyPlanningAbility).not.toBe('unassessed');
      expect(blueprint.informationActions.map((action) => action.actionId)).toEqual(
        expect.arrayContaining([
          'info.history.allergies-adverse-reactions',
          'info.history.existing-safety-plan',
        ]),
      );
    }
  });

  it('keeps the reported safety-planning response separate from disposition judgment', () => {
    for (const blueprint of reviewerCaseBlueprints) {
      const instance = instantiateCase(blueprint, 'reviewer-safety-planning', catalogs);
      const action = instance.informationActions.find(
        (candidate) => candidate.actionId === 'info.history.existing-safety-plan',
      )!;
      const finding = action.result.findings.find(
        (candidate) => candidate.label === 'Feels able to participate in safety planning',
      )!;
      const authoredState = blueprint.patientRecord.reportedSafetyPlanningAbility;
      expect(finding.outcome).toBe(
        authoredState === 'reports_able'
          ? 'present'
          : authoredState === 'reports_unable'
            ? 'absent'
            : 'not_applicable',
      );
      expect(action.result.factsRevealed.some((factId) => factId.includes('outpatient'))).toBe(
        false,
      );
      expect(action.result.factsRevealed).toEqual([
        `fact.safety-planning-ability.${
          authoredState === 'reports_able'
            ? 'reports-able'
            : authoredState === 'reports_unable'
              ? 'reports-unable'
              : 'uncertain'
        }`,
      ]);
    }
    expect(
      reviewerCaseBlueprints
        .filter((blueprint) =>
          ['case.review-cohort.acute-mania', 'case.review-cohort.schizophrenia-relapse'].includes(
            blueprint.id,
          ),
        )
        .every(
          (blueprint) => blueprint.patientRecord.reportedSafetyPlanningAbility === 'uncertain',
        ),
    ).toBe(true);
  });

  it('preserves reviewed BMI measurements and body-habitus detail in compiled patients', () => {
    for (const blueprint of reviewerCaseBlueprints) {
      const instance = instantiateCase(blueprint, 'reviewer-physical-detail', catalogs);
      const weight = instance.informationActions.find(
        (action) => action.actionId === 'info.physical.weight-bmi',
      )!;
      expect(
        weight.result.findings.find((finding) => finding.label === 'Body mass index'),
      ).toMatchObject({
        outcome: 'normal',
        valueText: expect.stringContaining('kg/m²'),
      });
      const general = instance.informationActions.find(
        (action) => action.actionId === 'info.physical.general',
      )!;
      expect(
        general.result.findings.find((finding) => finding.label === 'Body habitus')?.valueText,
      ).toBeTruthy();
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
      expect(database.pointReport.carePointsEarned).toBeGreaterThanOrEqual(
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
  }, 15_000);
});
