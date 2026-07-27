import { describe, expect, it } from 'vitest';

import {
  catalogs,
  medicationCheckPalpitationsBlueprint,
  prototypeCaseBlueprint,
  startingClinic,
} from './content';
import { buildCaseRuleAudit, focusCaseRuleAudit } from './review-inspector';

describe('case rule inspector', () => {
  it('exposes exact investigation rewards, omissions, fulfillment cost, and provenance', () => {
    const audit = buildCaseRuleAudit(
      medicationCheckPalpitationsBlueprint,
      catalogs,
      startingClinic,
    );
    const ecg = audit.investigations.find(
      (rule) => rule.id === 'objective.ecg-mdd-cardiac-monitoring',
    );

    expect(ecg).toMatchObject({
      pointsIfObtained: 560,
      pointsIfOmitted: -350,
      fulfillment: [
        {
          methodKind: 'outside_referral',
          operatingCost: 500,
        },
      ],
      review: {
        status: 'unreviewed',
        sourceUseNoteIds: ['source-use.ecg-mdd.citalopram-monitoring'],
      },
    });
  });

  it('shows exact disposition penalties and focuses a ticket without running the patient', () => {
    const audit = buildCaseRuleAudit(prototypeCaseBlueprint, catalogs, startingClinic);
    const focused = focusCaseRuleAudit(audit, [
      'case.first-visit-depression',
      'rule.mdd-emergency-escalation',
    ]);

    expect(focused.mode).toBe('targeted');
    expect(focused.scoreRules).toEqual([
      expect.objectContaining({
        id: 'rule.mdd-emergency-escalation',
        pointsIfTrue: -500,
        pointsIfFalse: 0,
        carePointCapIfTrue: 75,
      }),
    ]);
    expect(focused.criticalRules).toEqual([
      expect.objectContaining({ id: 'rule.mdd-emergency-escalation' }),
    ]);
  });

  it('lists treatment base values, active fit modifiers, and all menu choices without mutation', () => {
    const before = JSON.stringify(prototypeCaseBlueprint);
    const audit = buildCaseRuleAudit(prototypeCaseBlueprint, catalogs, startingClinic);

    expect(
      audit.treatmentGrades.find(
        (rule) => rule.id === 'grade.mdd-initial-first-line-antidepressant',
      ),
    ).toMatchObject({
      baseCarePoints: 200,
      grade: 'optimal',
    });
    expect(audit.medicationFitModifiers.map((modifier) => modifier.pointDelta)).toEqual(
      expect.arrayContaining([35, -50]),
    );
    expect(audit.treatmentWorkupRequirements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'treatment-requirement.mdd-antidepressant-mania-history',
          pointsIfMet: 45,
          pointsIfMissing: -70,
          concernLevel: 'major',
          certaintyLevel: 'strong',
          sourceRuleIds: ['rule.diagnosis-mdd.antidepressant-mania-history'],
        }),
        expect.objectContaining({
          id: 'treatment-requirement.mdd-any-medication-reaction-history',
          pointsIfMet: 30,
          pointsIfMissing: -40,
        }),
      ]),
    );
    expect(audit.availableTreatments.interventions).toEqual(
      expect.arrayContaining([
        'Cognitive behavioral therapy (CBT)',
        'Interpersonal psychotherapy (IPT)',
      ]),
    );
    expect(JSON.stringify(prototypeCaseBlueprint)).toBe(before);
  });
});
