import { describe, expect, it } from 'vitest';

import {
  DiagnosisDefinitionSchema,
  type DiagnosisDefinition,
  type DiagnosisRecommendationRule,
} from '@psychsim/schemas';
import {
  catalogs,
  prototypeCaseBlueprint,
  startingClinic,
} from '../../content-runtime/src/content';
import { instantiateCase } from './case';
import { requireCompleted } from './complete';
import { startEncounter, submitEncounter, updateTreatmentSelections } from './encounter';
import { scoreEncounter } from './scoring';
import { composeDiagnosisGuidance } from './diagnosis';

const review = {
  status: 'unreviewed' as const,
  reviewerId: null,
  reviewedAt: null,
  sourceUseNoteIds: [],
};

const rule = (
  id: string,
  stance: DiagnosisRecommendationRule['stance'],
  targetId: string,
  overrides: Partial<DiagnosisRecommendationRule> = {},
): DiagnosisRecommendationRule => ({
  id,
  label: id,
  domain: 'medication_selection',
  target: { kind: 'medication_tag', id: targetId },
  stance,
  concernLevel: 'moderate',
  certaintyLevel: 'tentative',
  patientWhen: null,
  selectionWhen: null,
  rationale: 'Synthetic mechanics fixture.',
  review,
  ...overrides,
});

const definition = (
  id: string,
  overrides: Partial<DiagnosisDefinition> = {},
): DiagnosisDefinition =>
  DiagnosisDefinitionSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id,
    label: id,
    description: 'Synthetic diagnosis-composition mechanics fixture.',
    medicalReviewStatus: 'unreviewed',
    baseClinicalTagIds: [],
    baseRules: [],
    severityAxis: null,
    specifiers: [],
    comorbidityRelationships: [],
    complexityContributions: [],
    sourceUseNotes: [],
    ...overrides,
  });

describe('diagnosis guidance composition', () => {
  it('scopes the reviewed initial-MDD route to the focused decision tag', () => {
    const mdd = catalogs.diagnoses.find(
      (diagnosis) => diagnosis.id === 'diagnosis.major-depressive-disorder',
    )!;
    const patientDiagnosis = {
      diagnosisId: mdd.id,
      role: 'primary' as const,
      severityId: null,
      specifierIds: [],
    };
    const withoutFocusedDecision = composeDiagnosisGuidance([mdd], {
      diagnoses: [patientDiagnosis],
      clinicalTagIds: [],
    });
    const withFocusedDecision = composeDiagnosisGuidance([mdd], {
      diagnoses: [patientDiagnosis],
      clinicalTagIds: ['decision.mdd-initial-treatment'],
    });

    expect(withoutFocusedDecision.activeRules).toHaveLength(0);
    expect(withFocusedDecision.activeRules).toHaveLength(7);
    expect(withFocusedDecision.activeRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: expect.objectContaining({
            id: 'rule.diagnosis-mdd.initial-first-line-antidepressant',
            stance: 'acceptable',
          }),
        }),
        expect.objectContaining({
          rule: expect.objectContaining({
            id: 'rule.diagnosis-mdd.antidepressant-mania-history',
            selectionWhen: {
              type: 'treatmentStartedWithTag',
              medicationTagId: 'antidepressant',
              minimumCount: 1,
              maximumCount: 20,
            },
          }),
        }),
        expect.objectContaining({
          rule: expect.objectContaining({
            id: 'rule.diagnosis-mdd.any-medication-reaction-history',
            selectionWhen: { type: 'anyMedicationStarted' },
          }),
        }),
      ]),
    );
  });

  it('keeps the approved MDD higher-of policy generation-only and preserves both inputs', () => {
    const mdd = catalogs.diagnoses.find(
      (diagnosis) => diagnosis.id === 'diagnosis.major-depressive-disorder',
    )!;

    expect(mdd.severityAxis).toMatchObject({
      playerSelectionMode: 'family_only',
      derivationPolicy: {
        id: 'severity-policy.mdd.current-episode-higher-of',
        strategy: 'highest_qualitative_level',
        inputDimensions: ['symptom_severity', 'condition_attributed_functional_impairment'],
        review: { status: 'approved' },
      },
    });
    expect(mdd.severityAxis?.levels.every((level) => level.generationStatus !== 'enabled')).toBe(
      true,
    );
    expect(mdd.specifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'specifier.mdd.psychotic-features',
          playerSelectable: true,
        }),
      ]),
    );

    const invalid = structuredClone(mdd);
    invalid.severityAxis!.derivationPolicy!.inputDimensions = [
      'symptom_severity',
      'symptom_severity',
    ];
    expect(DiagnosisDefinitionSchema.safeParse(invalid).success).toBe(false);
  });

  it('layers shared, severity, and specifier guidance without assigning points', () => {
    const diagnosis = definition('diagnosis.fixture-mood', {
      baseClinicalTagIds: ['diagnosis-tag.fixture-mood'],
      baseRules: [rule('rule.fixture.base', 'acceptable', 'antidepressant')],
      severityAxis: {
        id: 'severity-axis.fixture-mood',
        label: 'Fixture severity',
        playerSelectionMode: 'severity_selectable',
        derivationPolicy: null,
        levels: [
          {
            id: 'severity.fixture-mood.mild',
            label: 'Mild',
            rank: 1,
            generationStatus: 'enabled',
            constraints: {
              criteriaSetId: 'criteria.fixture-mood',
              minimumPositiveCriteria: 2,
              maximumPositiveCriteria: 3,
              requiredCriterionIds: [],
              forbiddenCriterionIds: [],
              minimumFunctionalImpairment: 'mild',
            },
            addedClinicalTagIds: [],
            rules: [],
            complexityContributions: [],
            review,
          },
          {
            id: 'severity.fixture-mood.moderate',
            label: 'Moderate',
            rank: 2,
            generationStatus: 'enabled',
            constraints: {
              criteriaSetId: 'criteria.fixture-mood',
              minimumPositiveCriteria: 4,
              maximumPositiveCriteria: 6,
              requiredCriterionIds: [],
              forbiddenCriterionIds: [],
              minimumFunctionalImpairment: 'moderate',
            },
            addedClinicalTagIds: ['severity-tag.fixture-moderate'],
            rules: [rule('rule.fixture.moderate', 'preferred', 'antidepressant')],
            complexityContributions: [
              {
                id: 'complexity.fixture.moderate-workup',
                label: 'Moderate workup',
                dimension: 'workup',
                weight: 2,
                review,
              },
            ],
            review,
          },
        ],
      },
      specifiers: [
        {
          id: 'specifier.fixture.anxious',
          label: 'Anxious features',
          playerSelectable: true,
          exclusiveGroupId: null,
          addedClinicalTagIds: ['specifier-tag.fixture-anxious'],
          rules: [rule('rule.fixture.anxious', 'preferred', 'antidepressant')],
          complexityContributions: [
            {
              id: 'complexity.fixture.anxious-information',
              label: 'Additional history',
              dimension: 'information',
              weight: 1,
              review,
            },
          ],
          review,
        },
      ],
      complexityContributions: [
        {
          id: 'complexity.fixture.base-diagnostic',
          label: 'Base diagnostic complexity',
          dimension: 'diagnostic',
          weight: 1,
          review,
        },
      ],
    });

    const report = composeDiagnosisGuidance([diagnosis], {
      diagnoses: [
        {
          diagnosisId: diagnosis.id,
          role: 'primary',
          severityId: 'severity.fixture-mood.moderate',
          specifierIds: ['specifier.fixture.anxious'],
        },
      ],
      clinicalTagIds: [],
    });

    expect(report.valid).toBe(true);
    expect(report.activeRules.map(({ rule: activeRule }) => activeRule.id)).toEqual([
      'rule.fixture.base',
      'rule.fixture.moderate',
      'rule.fixture.anxious',
    ]);
    expect(report.resolvedClinicalTagIds).toEqual([
      'diagnosis-tag.fixture-mood',
      'severity-tag.fixture-moderate',
      'specifier-tag.fixture-anxious',
    ]);
    expect(report.complexityByDimension).toEqual({
      diagnostic: 1,
      pharmacologic: 0,
      workup: 2,
      safety_disposition: 0,
      information: 1,
    });
    expect(JSON.stringify(report)).not.toContain('point');
  });

  it('quarantines incompatible guidance instead of selecting a winner', () => {
    const first = definition('diagnosis.fixture-first', {
      baseRules: [rule('rule.fixture-first.antipsychotic', 'preferred', 'antipsychotic')],
    });
    const second = definition('diagnosis.fixture-second', {
      baseRules: [rule('rule.fixture-second.antipsychotic', 'contraindicated', 'antipsychotic')],
    });
    const report = composeDiagnosisGuidance([first, second], {
      diagnoses: [
        {
          diagnosisId: first.id,
          role: 'primary',
          severityId: null,
          specifierIds: [],
        },
        {
          diagnosisId: second.id,
          role: 'contributing',
          severityId: null,
          specifierIds: [],
        },
      ],
      clinicalTagIds: [],
    });

    expect(report.valid).toBe(false);
    expect(report.conflicts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'RULE_STANCE_CONFLICT',
          diagnosisIds: [first.id, second.id],
          targetId: 'antipsychotic',
        }),
      ]),
    );
  });

  it('activates patient-fit workup guidance from structured context', () => {
    const metabolicsRule = rule(
      'rule.fixture.metabolics-before-antipsychotic',
      'required',
      'info.labs.a1c',
      {
        domain: 'monitoring',
        target: { kind: 'information_action', id: 'info.labs.a1c' },
        patientWhen: {
          type: 'clinicalTagPresent',
          clinicalTagId: 'medical.high-bmi',
        },
        selectionWhen: {
          type: 'treatmentStartedWithTag',
          medicationTagId: 'antipsychotic',
          minimumCount: 1,
          maximumCount: 12,
        },
      },
    );
    const diagnosis = definition('diagnosis.fixture-monitoring', {
      baseRules: [metabolicsRule],
    });
    const input = {
      diagnoses: [
        {
          diagnosisId: diagnosis.id,
          role: 'primary' as const,
          severityId: null,
          specifierIds: [],
        },
      ],
    };

    expect(
      composeDiagnosisGuidance([diagnosis], {
        ...input,
        clinicalTagIds: [],
      }).activeRules,
    ).toHaveLength(0);
    expect(
      composeDiagnosisGuidance([diagnosis], {
        ...input,
        clinicalTagIds: ['medical.high-bmi'],
      }).activeRules[0]?.rule,
    ).toMatchObject({
      id: metabolicsRule.id,
      stance: 'required',
      selectionWhen: {
        type: 'treatmentStartedWithTag',
        medicationTagId: 'antipsychotic',
      },
    });
  });

  it('blocks severity branches whose generation constraints still need a source', () => {
    const diagnosis = definition('diagnosis.fixture-pending-severity', {
      severityAxis: {
        id: 'severity-axis.fixture-pending',
        label: 'Pending severity',
        playerSelectionMode: 'severity_selectable',
        derivationPolicy: null,
        levels: [
          {
            id: 'severity.fixture-pending.mild',
            label: 'Mild',
            rank: 1,
            generationStatus: 'disabled_pending_source',
            constraints: {
              criteriaSetId: null,
              minimumPositiveCriteria: null,
              maximumPositiveCriteria: null,
              requiredCriterionIds: [],
              forbiddenCriterionIds: [],
              minimumFunctionalImpairment: null,
            },
            addedClinicalTagIds: [],
            rules: [],
            complexityContributions: [],
            review,
          },
          {
            id: 'severity.fixture-pending.severe',
            label: 'Severe',
            rank: 2,
            generationStatus: 'disabled_pending_source',
            constraints: {
              criteriaSetId: null,
              minimumPositiveCriteria: null,
              maximumPositiveCriteria: null,
              requiredCriterionIds: [],
              forbiddenCriterionIds: [],
              minimumFunctionalImpairment: null,
            },
            addedClinicalTagIds: [],
            rules: [],
            complexityContributions: [],
            review,
          },
        ],
      },
    });
    const report = composeDiagnosisGuidance([diagnosis], {
      diagnoses: [
        {
          diagnosisId: diagnosis.id,
          role: 'primary',
          severityId: 'severity.fixture-pending.mild',
          specifierIds: [],
        },
      ],
      clinicalTagIds: [],
    });
    expect(report.conflicts).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'SEVERITY_PENDING_SOURCE' })]),
    );
  });
});

describe('reviewed patient-context variation', () => {
  it('resolves once, keeps findings aligned, and contributes to medication fit', () => {
    const blueprint = structuredClone(prototypeCaseBlueprint);
    blueprint.patientRecord.clinicalTagIds = blueprint.patientRecord.clinicalTagIds.filter(
      (id) => id !== 'symptom.insomnia',
    );
    blueprint.patientRecord.clinicalContextDimensions = [
      {
        id: 'clinical-context.fixture.sleep',
        label: 'Sleep pattern fixture',
        options: [
          {
            id: 'clinical-context-option.fixture.insomnia',
            label: 'Insomnia present',
            gameSelectionWeight: 1,
            addedClinicalTagIds: ['symptom.insomnia'],
            findingBindings: [
              {
                actionId: 'info.history.depressive-symptoms',
                findingId: 'finding.depressive.sleep',
                outcome: 'present',
              },
            ],
            review,
          },
          {
            id: 'clinical-context-option.fixture.no-insomnia',
            label: 'Insomnia absent',
            gameSelectionWeight: 1,
            addedClinicalTagIds: [],
            findingBindings: [
              {
                actionId: 'info.history.depressive-symptoms',
                findingId: 'finding.depressive.sleep',
                outcome: 'absent',
              },
            ],
            review,
          },
        ],
        review,
      },
    ];

    const instances = Array.from({ length: 80 }, (_, index) =>
      instantiateCase(blueprint, `clinical-context-${index}`, catalogs),
    );
    const withInsomnia = instances.find((instance) =>
      instance.patientRecord.clinicalTagIds.includes('symptom.insomnia'),
    );
    const withoutInsomnia = instances.find(
      (instance) => !instance.patientRecord.clinicalTagIds.includes('symptom.insomnia'),
    );
    expect(withInsomnia).toBeDefined();
    expect(withoutInsomnia).toBeDefined();

    const sleepOutcome = (instance: (typeof instances)[number]) =>
      instance.informationActions
        .find((action) => action.actionId === 'info.history.depressive-symptoms')!
        .result.findings.find((finding) => finding.id === 'finding.depressive.sleep')!.outcome;
    expect(sleepOutcome(withInsomnia!)).toBe('present');
    expect(sleepOutcome(withoutInsomnia!)).toBe('absent');
    expect(
      instantiateCase(blueprint, withInsomnia!.seed, catalogs).resolvedClinicalContext,
    ).toEqual(withInsomnia!.resolvedClinicalContext);

    const scoreMirtazapine = (instance: (typeof instances)[number]) => {
      const clinic = {
        ...startingClinic,
        formularyIds: [...startingClinic.formularyIds, 'formulary.expanded-outpatient'],
      };
      let state = startEncounter(instance, clinic, clinic.activeLocationId);
      state = requireCompleted(
        updateTreatmentSelections(
          state,
          {
            startMedicationIds: ['medication.mirtazapine'],
            stopMedicationIds: [],
            continueMedicationIds: [],
            interventionIds: [],
            dispositionId: 'disposition.outpatient-followup',
          },
          catalogs,
        ),
      );
      state = requireCompleted(submitEncounter(state));
      return requireCompleted(scoreEncounter(state, catalogs));
    };
    expect(
      scoreMirtazapine(withInsomnia!).ruleTrace.some(
        (entry) => entry.ruleId === 'modifier.mirtazapine.insomnia-fit-active',
      ),
    ).toBe(true);
    expect(
      scoreMirtazapine(withoutInsomnia!).ruleTrace.some(
        (entry) => entry.ruleId === 'modifier.mirtazapine.insomnia-fit-active',
      ),
    ).toBe(false);
  });
});
