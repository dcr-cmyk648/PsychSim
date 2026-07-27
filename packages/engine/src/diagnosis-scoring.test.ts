import { describe, expect, it } from 'vitest';
import {
  CaseDiagnosisRubricSchema,
  type CaseDiagnosisRubric,
  type CatalogBundle,
  type EncounterState,
  type PlayerDiagnosisSelection,
} from '@psychsim/schemas';

import { matchesDiagnosisSelection, scoreDiagnosisSelections } from './diagnosis-scoring';

const review = {
  status: 'unreviewed' as const,
  reviewerId: null,
  reviewedAt: null,
  sourceUseNoteIds: ['source-use.diagnosis-test'],
};

const selection = (
  diagnosisId: string,
  severityId: string | null = null,
  specifierIds: string[] = [],
): PlayerDiagnosisSelection => ({ diagnosisId, severityId, specifierIds });

const baseRubric = (): CaseDiagnosisRubric =>
  CaseDiagnosisRubricSchema.parse({
    groups: [
      {
        id: 'diagnosis-group.primary',
        label: 'Primary diagnosis',
        canonicalSelection: selection('diagnosis.primary'),
        options: [
          {
            id: 'diagnosis-answer.primary-family',
            label: 'Primary diagnosis',
            match: {
              diagnosisId: 'diagnosis.primary',
              qualifierMode: 'family',
            },
            specificityPriority: 10,
            grade: 'canonical',
            points: 100,
            issueId: 'issue.diagnosis-primary',
            explanation: 'The selected family matches the case-owned diagnosis.',
            review,
          },
          {
            id: 'diagnosis-answer.reasonable',
            label: 'Reasonable alternative',
            match: {
              diagnosisId: 'diagnosis.reasonable',
              qualifierMode: 'family',
            },
            specificityPriority: 10,
            grade: 'reasonable_alternative',
            points: 75,
            issueId: 'issue.diagnosis-primary',
            explanation: 'This is a reasonable alternate interpretation.',
            review,
          },
        ],
        omission: {
          id: 'diagnosis-omission.primary',
          label: 'Primary diagnosis omitted',
          points: -30,
          issueId: 'issue.diagnosis-primary',
          explanation: 'The main diagnostic problem was not identified.',
          review,
        },
      },
    ],
    misclassificationRules: [
      {
        id: 'diagnosis-error.primary-specific',
        label: 'Dangerous specific misclassification',
        match: {
          diagnosisId: 'diagnosis.primary',
          qualifierMode: 'contains_qualifiers',
          severityId: 'severity.primary.unsupported',
        },
        specificityPriority: 30,
        severity: 'dangerous',
        points: -90,
        carePointCap: 40,
        issueId: 'issue.diagnosis-primary',
        explanation: 'The unsupported qualifier materially changes immediate management.',
        review,
      },
      {
        id: 'diagnosis-error.wrong',
        label: 'Major wrong diagnosis',
        match: {
          diagnosisId: 'diagnosis.wrong',
          qualifierMode: 'family',
        },
        specificityPriority: 10,
        severity: 'major',
        points: -55,
        carePointCap: null,
        issueId: 'issue.diagnosis-primary',
        explanation: 'The selected diagnosis does not fit the focused presentation.',
        review,
      },
    ],
    additionalSelectionPolicy: {
      id: 'diagnosis-policy.additional-selection',
      label: 'Unsupported additional diagnoses',
      pointsPerSelection: -7,
      maximumDeduction: 12,
      explanation: 'Additional unprogrammed diagnoses reduce parsimony.',
      review,
    },
  });

const catalogs = {
  diagnoses: [
    { id: 'diagnosis.primary', label: 'Primary' },
    { id: 'diagnosis.reasonable', label: 'Reasonable' },
    { id: 'diagnosis.wrong', label: 'Wrong' },
    { id: 'diagnosis.extra-one', label: 'Extra one' },
    { id: 'diagnosis.extra-two', label: 'Extra two' },
    { id: 'diagnosis.comorbid', label: 'Comorbid' },
    { id: 'diagnosis.dangerous-one', label: 'Dangerous one' },
    { id: 'diagnosis.dangerous-two', label: 'Dangerous two' },
  ],
} as CatalogBundle;

const stateFor = (
  rubric: CaseDiagnosisRubric | null,
  diagnosisSelections: PlayerDiagnosisSelection[],
): EncounterState =>
  ({
    caseInstance: { diagnosisRubric: rubric },
    diagnosisSelections,
  }) as EncounterState;

describe('diagnosis selection scoring', () => {
  it('matches family, qualifier-containing, and exact patterns deterministically', () => {
    const selected = selection('diagnosis.primary', 'severity.primary.high', [
      'specifier.primary.a',
      'specifier.primary.b',
    ]);

    expect(
      matchesDiagnosisSelection(selected, {
        diagnosisId: 'diagnosis.primary',
        qualifierMode: 'family',
        severityId: null,
        specifierIds: [],
      }),
    ).toBe(true);
    expect(
      matchesDiagnosisSelection(selected, {
        diagnosisId: 'diagnosis.primary',
        qualifierMode: 'contains_qualifiers',
        severityId: 'severity.primary.high',
        specifierIds: ['specifier.primary.b'],
      }),
    ).toBe(true);
    expect(
      matchesDiagnosisSelection(selected, {
        diagnosisId: 'diagnosis.primary',
        qualifierMode: 'exact',
        severityId: 'severity.primary.high',
        specifierIds: ['specifier.primary.b', 'specifier.primary.a'],
      }),
    ).toBe(true);
    expect(
      matchesDiagnosisSelection(selected, {
        diagnosisId: 'diagnosis.primary',
        qualifierMode: 'exact',
        severityId: 'severity.primary.high',
        specifierIds: ['specifier.primary.a'],
      }),
    ).toBe(false);
  });

  it('lets an explicit specific rule suppress a broad-family answer', () => {
    const result = scoreDiagnosisSelections(
      stateFor(baseRubric(), [selection('diagnosis.primary', 'severity.primary.unsupported')]),
      catalogs,
    );

    expect(result.trace).toHaveLength(1);
    expect(result.trace[0]).toMatchObject({
      ruleId: 'diagnosis-error.primary-specific',
      points: -90,
      classification: 'diagnosis_dangerous_misclassification',
      issueId: 'issue.diagnosis-primary',
    });
    expect(result.safetyErrors).toEqual([
      'The unsupported qualifier materially changes immediate management.',
    ]);
    expect(result.carePointCaps).toEqual([40]);
  });

  it('scores one accepted answer and penalizes additional alternatives in the same group', () => {
    const result = scoreDiagnosisSelections(
      stateFor(baseRubric(), [selection('diagnosis.primary'), selection('diagnosis.reasonable')]),
      catalogs,
    );

    expect(result.trace).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'diagnosis-answer.primary-family',
          points: 100,
          classification: 'diagnosis_canonical',
        }),
        expect.objectContaining({
          ruleId: 'diagnosis-policy.additional-selection',
          points: -7,
          classification: 'diagnosis_additional_selection',
          relatedDiagnosisIds: ['diagnosis.reasonable'],
        }),
      ]),
    );
  });

  it('scores distinct diagnosis groups independently without a shotgun penalty', () => {
    const initial = baseRubric();
    const rubric = CaseDiagnosisRubricSchema.parse({
      ...initial,
      groups: [
        ...initial.groups,
        {
          id: 'diagnosis-group.comorbid',
          label: 'Contributing diagnosis',
          canonicalSelection: selection('diagnosis.comorbid'),
          options: [
            {
              id: 'diagnosis-answer.comorbid',
              label: 'Comorbid diagnosis',
              match: {
                diagnosisId: 'diagnosis.comorbid',
                qualifierMode: 'family',
              },
              specificityPriority: 10,
              grade: 'canonical',
              points: 40,
              issueId: 'issue.diagnosis-comorbid',
              explanation: 'The contributing diagnosis is identified.',
              review,
            },
          ],
          omission: {
            id: 'diagnosis-omission.comorbid',
            label: 'Contributing diagnosis omitted',
            points: -10,
            issueId: 'issue.diagnosis-comorbid',
            explanation: 'The contributing diagnosis was omitted.',
            review,
          },
        },
      ],
    });

    const result = scoreDiagnosisSelections(
      stateFor(rubric, [selection('diagnosis.primary'), selection('diagnosis.comorbid')]),
      catalogs,
    );

    expect(result.trace.map((row) => row.ruleId)).toEqual([
      'diagnosis-answer.primary-family',
      'diagnosis-answer.comorbid',
    ]);
    expect(result.trace.reduce((sum, row) => sum + row.points, 0)).toBe(140);
  });

  it('deduplicates a wrong answer and omission with the same issue ID', () => {
    const result = scoreDiagnosisSelections(
      stateFor(baseRubric(), [selection('diagnosis.wrong')]),
      catalogs,
    );

    expect(result.trace).toHaveLength(1);
    expect(result.trace[0]).toMatchObject({
      ruleId: 'diagnosis-error.wrong',
      points: -55,
      classification: 'diagnosis_major_mismatch',
    });
    expect(result.trace.some((row) => row.ruleId === 'diagnosis-omission.primary')).toBe(false);
  });

  it('keeps a blank diagnosis submission valid and applies only the authored omission', () => {
    const result = scoreDiagnosisSelections(stateFor(baseRubric(), []), catalogs);

    expect(result.trace).toEqual([
      expect.objectContaining({
        ruleId: 'diagnosis-omission.primary',
        points: -30,
        classification: 'diagnosis_omitted',
        relatedDiagnosisIds: [],
      }),
    ]);
    expect(result.safetyErrors).toEqual([]);
    expect(result.carePointCaps).toEqual([]);
  });

  it('caps the aggregate parsimony deduction for unlisted selections', () => {
    const result = scoreDiagnosisSelections(
      stateFor(baseRubric(), [selection('diagnosis.extra-one'), selection('diagnosis.extra-two')]),
      catalogs,
    );

    expect(result.trace).toHaveLength(2);
    expect(result.trace).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'diagnosis-omission.primary',
          points: -30,
        }),
        expect.objectContaining({
          ruleId: 'diagnosis-policy.additional-selection',
          points: -12,
          classification: 'diagnosis_additional_selection',
          relatedDiagnosisIds: ['diagnosis.extra-one', 'diagnosis.extra-two'],
        }),
      ]),
    );
  });

  it('derives safety errors and caps only from the retained worst consequence', () => {
    const initial = baseRubric();
    const rubric = CaseDiagnosisRubricSchema.parse({
      ...initial,
      misclassificationRules: [
        ...initial.misclassificationRules,
        {
          id: 'diagnosis-error.dangerous-one',
          label: 'Discarded dangerous classification',
          match: {
            diagnosisId: 'diagnosis.dangerous-one',
            qualifierMode: 'family',
          },
          specificityPriority: 10,
          severity: 'dangerous',
          points: -80,
          carePointCap: 5,
          issueId: 'issue.diagnosis-primary',
          explanation: 'This discarded row must not leave an invisible cap.',
          review,
        },
        {
          id: 'diagnosis-error.dangerous-two',
          label: 'Retained dangerous classification',
          match: {
            diagnosisId: 'diagnosis.dangerous-two',
            qualifierMode: 'family',
          },
          specificityPriority: 10,
          severity: 'dangerous',
          points: -100,
          carePointCap: null,
          issueId: 'issue.diagnosis-primary',
          explanation: 'This is the retained worst consequence.',
          review,
        },
      ],
    });

    const result = scoreDiagnosisSelections(
      stateFor(rubric, [
        selection('diagnosis.dangerous-one'),
        selection('diagnosis.dangerous-two'),
      ]),
      catalogs,
    );

    expect(result.trace).toHaveLength(1);
    expect(result.trace[0]?.ruleId).toBe('diagnosis-error.dangerous-two');
    expect(result.safetyErrors).toEqual(['This is the retained worst consequence.']);
    expect(result.carePointCaps).toEqual([]);
  });

  it('rejects a canonical answer shadowed by a higher-priority matching rule', () => {
    const initial = baseRubric();
    expect(() =>
      CaseDiagnosisRubricSchema.parse({
        ...initial,
        misclassificationRules: [
          ...initial.misclassificationRules,
          {
            id: 'diagnosis-error.shadow',
            label: 'Shadowing error',
            match: {
              diagnosisId: 'diagnosis.primary',
              qualifierMode: 'family',
            },
            specificityPriority: 20,
            severity: 'major',
            points: -50,
            carePointCap: null,
            issueId: 'issue.diagnosis-primary',
            explanation: 'This would make the canonical answer unreachable.',
            review,
          },
        ],
      }),
    ).toThrow(/canonical answer is unreachable/i);
  });

  it('returns no diagnosis effects for a legacy case without a rubric', () => {
    expect(
      scoreDiagnosisSelections(stateFor(null, [selection('diagnosis.primary')]), catalogs),
    ).toEqual({
      trace: [],
      safetyErrors: [],
      carePointCaps: [],
    });
  });
});
