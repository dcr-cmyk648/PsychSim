import { describe, expect, it } from 'vitest';

import {
  FocusedMedicationRegimenRouteSchema,
  MedicationClassMembershipSchema,
  MedicationRegimenContributorKindSchema,
  MedicationRegimenContributorSchema,
  MedicationRegimenKnowledgeCatalogSchema,
  MedicationRegimenTransitionSelectionSchema,
  MedicationRegimenTransitionValidationEnvelopeSchema,
} from './index';

const unreviewed = {
  status: 'unreviewed' as const,
  reviewerId: null,
  reviewedAt: null,
  sourceUseNoteIds: [],
};

const medicationTarget = (medicationIdentityId: string) => ({
  kind: 'medication' as const,
  medicationIdentityId,
  medicationIdentityContentVersion: '0.1.0',
});

const classTarget = (medicationClassId: string) => ({
  kind: 'class' as const,
  medicationClassId,
  medicationClassContentVersion: '0.1.0',
});

const regimenEntry = (id: string, medicationIdentityId: string) => ({
  recordVersion: 2 as const,
  id,
  medicationIdentityId,
  clinicalRole: 'psychiatric' as const,
  status: 'active' as const,
  adherence: 'consistent' as const,
  prescribedForDiagnosisId: 'diagnosis.test',
  source: 'prescriber_record' as const,
  knownAtOpening: false,
  impactClassification: 'fit_relevant' as const,
});

const routeBase = {
  schemaVersion: 1 as const,
  contentVersion: '0.1.0',
  label: 'Test route',
  owner: {
    kind: 'decision_policy' as const,
    id: 'decision-policy.test',
    contentVersion: '0.1.0',
  },
  qualitativeDiagnosisRuleRef: null,
  patientWhen: null,
  rationale: 'A point-free fixture for the route-owned transition boundary.',
  developerOpinionIds: [],
  review: unreviewed,
};

describe('normalized medication-regimen authoring boundary', () => {
  it('accepts only concrete starts and one categorical action per regimen entry', () => {
    const parsed = MedicationRegimenTransitionSelectionSchema.parse({
      selectionVersion: 2,
      startMedicationIds: ['medication.lurasidone'],
      adjustments: [
        {
          selectionVersion: 2,
          regimenEntryId: 'regimen.lithium',
          operation: 'continue',
        },
        {
          selectionVersion: 2,
          regimenEntryId: 'regimen.olanzapine',
          operation: 'stop',
        },
      ],
    });

    expect(parsed).toMatchObject({
      startMedicationIds: ['medication.lurasidone'],
      adjustments: [
        { regimenEntryId: 'regimen.lithium', operation: 'continue' },
        { regimenEntryId: 'regimen.olanzapine', operation: 'stop' },
      ],
    });

    expect(
      MedicationRegimenTransitionSelectionSchema.safeParse({
        ...parsed,
        startMedicationIds: ['medication.lurasidone', 'medication.lurasidone'],
      }).success,
    ).toBe(false);
    expect(
      MedicationRegimenTransitionSelectionSchema.safeParse({
        ...parsed,
        adjustments: [
          ...parsed.adjustments,
          {
            selectionVersion: 2,
            regimenEntryId: 'regimen.olanzapine',
            operation: 'taper',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects player-entered meaning, dose, schedule, timing, points, and predicted outcome', () => {
    const base = {
      selectionVersion: 2,
      startMedicationIds: ['medication.sertraline'],
      adjustments: [],
    };
    for (const forbidden of [
      { routeMeaning: 'initial_treatment' },
      { intent: 'switch' },
      { dose: '10 mg' },
      { schedule: 'daily' },
      { timing: 'after one week' },
      { points: 40 },
      { predictedOutcome: 'remission' },
    ]) {
      expect(
        MedicationRegimenTransitionSelectionSchema.safeParse({ ...base, ...forbidden }).success,
      ).toBe(false);
    }
  });

  it('validates every entry-targeted action against the frozen regimen', () => {
    const valid = MedicationRegimenTransitionValidationEnvelopeSchema.safeParse({
      regimenEntries: [
        regimenEntry('regimen.lithium', 'medication.lithium'),
        regimenEntry('regimen.olanzapine', 'medication.olanzapine'),
      ],
      selection: {
        selectionVersion: 2,
        startMedicationIds: ['medication.lurasidone'],
        adjustments: [
          {
            selectionVersion: 2,
            regimenEntryId: 'regimen.olanzapine',
            operation: 'reduce_or_limit',
          },
        ],
      },
    });
    expect(valid.success).toBe(true);

    expect(
      MedicationRegimenTransitionValidationEnvelopeSchema.safeParse({
        regimenEntries: [regimenEntry('regimen.lithium', 'medication.lithium')],
        selection: {
          selectionVersion: 2,
          startMedicationIds: [],
          adjustments: [
            {
              selectionVersion: 2,
              regimenEntryId: 'regimen.unknown',
              operation: 'stop',
            },
          ],
        },
      }).success,
    ).toBe(false);
  });

  it('represents initial, replacement, and complex augmentation shapes on reviewed routes', () => {
    const initial = FocusedMedicationRegimenRouteSchema.parse({
      ...routeBase,
      id: 'regimen-route.test.initial',
      routeMeaning: 'initial_treatment',
      transitionMatch: {
        type: 'all',
        predicates: [
          {
            type: 'startCount',
            target: classTarget('medication-class.first-line'),
            minimumCount: 1,
            maximumCount: 1,
          },
          {
            type: 'startCount',
            target: { kind: 'any_medication' },
            minimumCount: 1,
            maximumCount: 1,
          },
        ],
      },
    });
    expect(initial.routeMeaning).toBe('initial_treatment');

    const replacement = FocusedMedicationRegimenRouteSchema.parse({
      ...routeBase,
      id: 'regimen-route.test.replacement',
      routeMeaning: 'replacement',
      transitionMatch: {
        type: 'all',
        predicates: [
          {
            type: 'adjustmentCount',
            target: medicationTarget('medication.olanzapine'),
            operations: ['reduce_or_limit', 'taper', 'stop'],
            minimumCount: 1,
            maximumCount: 1,
          },
          {
            type: 'startCount',
            target: medicationTarget('medication.lurasidone'),
            minimumCount: 1,
            maximumCount: 1,
          },
        ],
      },
    });
    expect(replacement.transitionMatch.type).toBe('all');
    expect('crossTaperSafe' in replacement).toBe(false);

    const complex = FocusedMedicationRegimenRouteSchema.parse({
      ...routeBase,
      id: 'regimen-route.test.complex-augmentation',
      routeMeaning: 'augmentation',
      transitionMatch: {
        type: 'all',
        predicates: [
          {
            type: 'adjustmentCount',
            target: medicationTarget('medication.lithium'),
            operations: ['continue'],
            minimumCount: 1,
            maximumCount: 1,
          },
          {
            type: 'adjustmentCount',
            target: medicationTarget('medication.olanzapine'),
            operations: ['reduce_or_limit', 'taper', 'stop'],
            minimumCount: 1,
            maximumCount: 1,
          },
          {
            type: 'startCount',
            target: classTarget('medication-class.eligible-adjunct'),
            minimumCount: 1,
            maximumCount: 1,
          },
        ],
      },
    });
    expect(complex.routeMeaning).toBe('augmentation');
  });

  it('keeps medication classes explicit instead of parsing compatibility labels or tags', () => {
    const membership = MedicationClassMembershipSchema.parse({
      schemaVersion: 1,
      contentVersion: '0.1.0',
      id: 'medication-class-membership.test.sertraline-first-line',
      medicationIdentityId: 'medication.sertraline',
      medicationIdentityContentVersion: '0.1.0',
      medicationClassId: 'medication-class.first-line',
      medicationClassContentVersion: '0.1.0',
      developerOpinionIds: [],
      review: unreviewed,
    });
    expect(membership.medicationClassId).toBe('medication-class.first-line');
    expect(
      MedicationClassMembershipSchema.safeParse({
        ...membership,
        medicationClassId: undefined,
        classLabel: 'SSRI',
      }).success,
    ).toBe(false);
  });

  it('keeps every qualitative contributor separate and point-free', () => {
    const kinds = MedicationRegimenContributorKindSchema.options;
    expect(kinds).toEqual([
      'benefit',
      'prior_response',
      'nonresponse',
      'tolerability',
      'prior_trial',
      'goodness_of_fit',
      'duplication',
      'interaction',
      'withdrawal_risk',
      'contraindication',
      'prerequisite',
    ]);

    const contributor = {
      schemaVersion: 1,
      contentVersion: '0.1.0',
      id: 'regimen-contributor.test.fit',
      label: 'Example fit contributor',
      kind: 'goodness_of_fit',
      owner: {
        kind: 'medication',
        id: 'medication.bupropion',
        contentVersion: '0.1.0',
      },
      patientWhen: {
        type: 'fact',
        fact: {
          recordKind: 'canonical_finding',
          identityId: 'finding.history.current-self-reported-fatigue-low-energy',
          identityContentVersion: '1.0.0',
          attributeId: 'finding.outcome',
          valueId: 'finding-outcome.present',
        },
      },
      transitionWhen: {
        type: 'startCount',
        target: medicationTarget('medication.bupropion'),
        minimumCount: 1,
        maximumCount: 1,
      },
      stance: 'preferred',
      concernLevel: 'moderate',
      certaintyLevel: 'tentative',
      effectId: 'effect.test.bupropion-fatigue-fit',
      issueId: null,
      specificityPriority: 10,
      rationale: 'Test-only qualitative relationship.',
      developerOpinionIds: [],
      review: unreviewed,
    } as const;

    expect(MedicationRegimenContributorSchema.safeParse(contributor).success).toBe(true);
    for (const forbidden of [
      { points: 10 },
      { grade: 'optimal' },
      { scoreCap: 50 },
      { classLabel: 'activating antidepressant' },
    ]) {
      expect(
        MedicationRegimenContributorSchema.safeParse({ ...contributor, ...forbidden }).success,
      ).toBe(false);
    }
  });

  it('validates catalog membership and refuses unsupported approval', () => {
    const medicationClass = {
      schemaVersion: 1,
      contentVersion: '0.1.0',
      id: 'medication-class.test',
      label: 'Test class',
      aliases: [],
      developerOpinionIds: [],
      review: unreviewed,
    };
    const membership = {
      schemaVersion: 1,
      contentVersion: '0.1.0',
      id: 'medication-class-membership.test',
      medicationIdentityId: 'medication.sertraline',
      medicationIdentityContentVersion: '0.1.0',
      medicationClassId: medicationClass.id,
      medicationClassContentVersion: medicationClass.contentVersion,
      developerOpinionIds: [],
      review: unreviewed,
    };
    const catalog = {
      schemaVersion: 1,
      contentVersion: '0.1.0',
      id: 'registry.catalog.medication-regimen-knowledge',
      medicationClasses: [medicationClass],
      classMemberships: [membership],
      focusedRoutes: [],
      contributors: [],
      sourceUseNotes: [],
    };
    expect(MedicationRegimenKnowledgeCatalogSchema.safeParse(catalog).success).toBe(true);
    expect(
      MedicationRegimenKnowledgeCatalogSchema.safeParse({
        ...catalog,
        classMemberships: [
          membership,
          {
            ...membership,
            id: 'medication-class-membership.test.duplicate',
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      MedicationRegimenKnowledgeCatalogSchema.safeParse({
        ...catalog,
        classMemberships: [
          {
            ...membership,
            medicationClassId: 'medication-class.unknown',
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      MedicationRegimenKnowledgeCatalogSchema.safeParse({
        ...catalog,
        medicationClasses: [
          {
            ...medicationClass,
            review: {
              status: 'approved',
              reviewerId: 'reviewer.test',
              reviewedAt: '2026-07-29T00:00:00.000Z',
              sourceUseNoteIds: [],
            },
          },
        ],
      }).success,
    ).toBe(false);

    const approvedClass = {
      ...medicationClass,
      developerOpinionIds: [],
      review: {
        status: 'approved' as const,
        reviewerId: 'reviewer.test',
        reviewedAt: '2026-07-29T00:00:00.000Z',
        sourceUseNoteIds: ['source-use.test.medication-class'],
      },
    };
    const sourceUseNote = {
      id: 'source-use.test.medication-class',
      authority: 'formal_publication' as const,
      evidenceSourceIds: ['evidence.test'],
      sourceDocumentId: null,
      sourceChunkIds: [],
      targetContentIds: [medicationClass.id],
      contributionTypes: ['classification_mapping' as const],
      contribution: 'Synthetic source-use note for strict review-state validation.',
      generatedBy: 'human' as const,
      medicalReviewStatus: 'unreviewed' as const,
    };
    const sourcedCatalog = {
      ...catalog,
      medicationClasses: [approvedClass],
      sourceUseNotes: [sourceUseNote],
    };
    expect(MedicationRegimenKnowledgeCatalogSchema.safeParse(sourcedCatalog).success).toBe(false);
    expect(
      MedicationRegimenKnowledgeCatalogSchema.safeParse({
        ...sourcedCatalog,
        sourceUseNotes: [{ ...sourceUseNote, medicalReviewStatus: 'approved' }],
      }).success,
    ).toBe(true);
  });
});
