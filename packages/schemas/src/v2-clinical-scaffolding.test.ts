import { describe, expect, it } from 'vitest';

import {
  FindingBlueprintSchema,
  MedicationRegimenAdjustmentSelectionSchema,
  MedicationTolerabilityFindingV2Schema,
  MedicationTrialRecordSchema,
  PatientBackgroundExposureResolutionV2Schema,
  ReactionConceptCatalogSchema,
  ResolvedFindingSchema,
  TreatmentWorkupRequirementSchema,
} from './index';

const supplementUseEntry = (id: string, supplementIdentityId: string) => ({
  recordVersion: 2,
  id,
  supplementIdentityId,
  status: 'current',
  reportedPreparation: null,
  frequencyLabel: null,
  source: 'patient_report',
  knownAtOpening: false,
  impactClassification: 'neutral_background',
});

describe('V2 clinical schema scaffolding', () => {
  it('requires value-only authored findings to have a suitable outcome and visible value', () => {
    const valid = {
      id: 'finding.test.score',
      labelVariants: ['Scale score'],
      outcome: 'present',
      outcomeDisplay: 'value_only',
      valueTextVariants: ['4'],
    };

    expect(FindingBlueprintSchema.safeParse(valid).success).toBe(true);
    expect(FindingBlueprintSchema.safeParse({ ...valid, outcome: 'absent' }).success).toBe(false);
    expect(
      FindingBlueprintSchema.safeParse({
        id: valid.id,
        labelVariants: valid.labelVariants,
        outcome: valid.outcome,
        outcomeDisplay: valid.outcomeDisplay,
      }).success,
    ).toBe(false);
  });

  it('preserves the value-only invariant in resolved persisted findings', () => {
    const valid = {
      id: 'finding.test.resolved-score',
      label: 'Scale score',
      outcome: 'present',
      outcomeDisplay: 'value_only',
      valueText: '4',
      origin: 'authored',
    };

    expect(ResolvedFindingSchema.safeParse(valid).success).toBe(true);
    expect(ResolvedFindingSchema.safeParse({ ...valid, outcome: 'negative' }).success).toBe(false);
    expect(
      ResolvedFindingSchema.safeParse({
        id: valid.id,
        label: valid.label,
        outcome: valid.outcome,
        outcomeDisplay: valid.outcomeDisplay,
        origin: valid.origin,
      }).success,
    ).toBe(false);
  });

  it('accepts objective duration and maximum-dose data for a medication trial', () => {
    const trial = MedicationTrialRecordSchema.parse({
      schemaVersion: 1,
      id: 'trial.test.sertraline',
      medicationId: 'medication.sertraline',
      exposure: {
        duration: { value: 8, unit: 'week' },
        maximumDose: { amount: 150, unit: 'mg', frequency: 'daily' },
      },
      adequacy: 'unclear',
      adherence: 'consistent',
      response: 'partial',
      tolerability: 'tolerated',
      source: 'patient_report',
      summary: 'Structured exposure test fixture.',
    });

    expect(trial.exposure).toEqual({
      duration: { value: 8, unit: 'week' },
      maximumDose: { amount: 150, unit: 'mg', frequency: 'daily' },
    });
  });

  it('requires the enthusiast pattern to resolve at least two distinct supplements', () => {
    const base = {
      recordVersion: 2,
      generationProfileId: 'generation-profile.test.background',
      reviewedAgeBandId: 'age-band.test.adult',
      supplementPattern: 'enthusiast',
      medicationRegimenEntries: [],
      supplementUseEntries: [
        supplementUseEntry('supplement-use.test.magnesium-1', 'supplement.magnesium'),
      ],
    };

    expect(PatientBackgroundExposureResolutionV2Schema.safeParse(base).success).toBe(false);
    expect(
      PatientBackgroundExposureResolutionV2Schema.safeParse({
        ...base,
        supplementUseEntries: [
          ...base.supplementUseEntries,
          supplementUseEntry('supplement-use.test.magnesium-2', 'supplement.magnesium'),
        ],
      }).success,
    ).toBe(false);

    const parsed = PatientBackgroundExposureResolutionV2Schema.parse({
      ...base,
      supplementUseEntries: [
        ...base.supplementUseEntries,
        supplementUseEntry('supplement-use.test.saffron', 'supplement.saffron-extract'),
      ],
    });

    expect(parsed.supplementUseEntries).toHaveLength(2);
  });

  it('targets each categorical adjustment to a regimen-entry instance', () => {
    for (const operation of ['continue', 'increase', 'reduce_or_limit', 'taper', 'stop'] as const) {
      expect(
        MedicationRegimenAdjustmentSelectionSchema.parse({
          selectionVersion: 2,
          regimenEntryId: 'regimen.test.sertraline-primary',
          operation,
        }),
      ).toMatchObject({
        regimenEntryId: 'regimen.test.sertraline-primary',
        operation,
      });
    }

    expect(
      MedicationRegimenAdjustmentSelectionSchema.safeParse({
        selectionVersion: 2,
        medicationId: 'medication.sertraline',
        operation: 'stop',
      }).success,
    ).toBe(false);
  });

  it('keeps sexual tolerability tied to an exposure and distinguishes unknown from absent', () => {
    const unknownCurrent = MedicationTolerabilityFindingV2Schema.parse({
      recordVersion: 2,
      id: 'tolerability.test.current-sexual',
      subject: {
        kind: 'current_regimen_entry',
        regimenEntryId: 'regimen.test.sertraline-primary',
      },
      domain: 'sexual_function',
      findingStatus: 'unknown',
      manifestationIds: [],
      source: 'patient_report',
      sourceRateProfileId: null,
    });

    const absentPriorTrial = MedicationTolerabilityFindingV2Schema.parse({
      ...unknownCurrent,
      id: 'tolerability.test.prior-sexual',
      subject: {
        kind: 'prior_trial',
        medicationTrialId: 'trial.test.sertraline',
      },
      findingStatus: 'absent',
    });

    expect(unknownCurrent.subject.kind).toBe('current_regimen_entry');
    expect(absentPriorTrial.subject.kind).toBe('prior_trial');
    expect(unknownCurrent.findingStatus).toBe('unknown');
    expect(absentPriorTrial.findingStatus).toBe('absent');
    expect(
      MedicationTolerabilityFindingV2Schema.safeParse({
        ...unknownCurrent,
        subject: undefined,
      }).success,
    ).toBe(false);
    expect(
      MedicationTolerabilityFindingV2Schema.safeParse({
        ...unknownCurrent,
        manifestationIds: ['manifestation.sexual.delayed-orgasm'],
      }).success,
    ).toBe(false);
  });

  it('keeps treatment-triggered workup concern and certainty separate from point balance', () => {
    const requirement = TreatmentWorkupRequirementSchema.parse({
      id: 'treatment-requirement.test.mania-history',
      sourceRuleIds: ['rule.diagnosis-test.mania-history'],
      objectiveId: 'objective.test.mania-history',
      appliesWhen: {
        type: 'treatmentStartedWithTag',
        medicationTagId: 'antidepressant',
        minimumCount: 1,
        maximumCount: 20,
      },
      pointsIfMet: 45,
      pointsIfMissing: -70,
      safetyCritical: true,
      concernLevel: 'major',
      certaintyLevel: 'strong',
      explanationMet: 'History obtained.',
      explanationMissing: 'History omitted.',
      review: {
        status: 'unreviewed',
        reviewerId: null,
        reviewedAt: null,
        sourceUseNoteIds: [],
      },
    });

    expect(requirement).toMatchObject({
      concernLevel: 'major',
      certaintyLevel: 'strong',
      pointsIfMet: 45,
      pointsIfMissing: -70,
    });
  });

  it('rejects overlapping generic medication-reaction policy coverage', () => {
    const policy = {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'reaction-policy.test.mild',
      recordedAs: ['allergy'] as const,
      reportedSeverities: ['mild'] as const,
      pointDelta: -60,
      classification: 'weak' as const,
      safetyCritical: false,
      carePointCap: null,
      concernLevel: 'moderate' as const,
      certaintyLevel: 'tentative' as const,
      explanation: 'Synthetic reaction policy.',
      developerOpinionId: 'developer-opinion.test.reaction',
      review: {
        status: 'unreviewed' as const,
        reviewerId: null,
        reviewedAt: null,
        sourceUseNoteIds: [],
      },
    };
    const catalog = {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      nonMedicationTriggers: [],
      manifestations: [],
      medicationSelectionPolicies: [
        policy,
        {
          ...policy,
          id: 'reaction-policy.test.overlap',
          pointDelta: -80,
        },
      ],
    };

    expect(ReactionConceptCatalogSchema.safeParse(catalog).success).toBe(false);
  });
});
