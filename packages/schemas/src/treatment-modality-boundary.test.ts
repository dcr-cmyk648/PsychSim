import { describe, expect, it } from 'vitest';

import {
  PsychotherapyTrialRecordSchema,
  ScorePredicateSchema,
  TreatmentOptionSchema,
  TreatmentSelectionSchema,
} from './index';

const cbtOption = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'intervention.psychotherapy.cbt',
  label: 'Cognitive behavioral therapy (CBT)',
  kind: 'nonmedication',
  category: 'psychotherapy',
  safeReferral: false,
  requiredCapabilities: ['counseling.basic'],
} as const;

describe('psychotherapy modality boundary', () => {
  it('uses one stable treatment option without course or fidelity semantics', () => {
    expect(TreatmentOptionSchema.parse(cbtOption).id).toBe('intervention.psychotherapy.cbt');
    for (const extra of [
      { deliveryScope: 'full_program' },
      { fidelity: 'protocol_concordant' },
      { duration: '12 sessions' },
      { completion: 'completed' },
    ]) {
      expect(TreatmentOptionSchema.safeParse({ ...cbtOption, ...extra }).success).toBe(false);
    }
  });

  it('stores a new therapy recommendation as modality IDs only', () => {
    const selection = {
      startMedicationIds: [],
      stopMedicationIds: [],
      continueMedicationIds: [],
      interventionIds: ['intervention.psychotherapy.cbt'],
      dispositionId: null,
    };
    expect(TreatmentSelectionSchema.parse(selection).interventionIds).toEqual([
      'intervention.psychotherapy.cbt',
    ]);
    expect(
      TreatmentSelectionSchema.safeParse({
        ...selection,
        therapyDelivery: { duration: '12 sessions' },
      }).success,
    ).toBe(false);
  });

  it('scores the recommendation by intervention ID only', () => {
    const predicate = {
      type: 'interventionSelected',
      interventionId: 'intervention.psychotherapy.cbt',
    } as const;
    expect(ScorePredicateSchema.parse(predicate)).toEqual(predicate);
    expect(ScorePredicateSchema.safeParse({ ...predicate, fidelityRequired: true }).success).toBe(
      false,
    );
  });

  it('keeps prior psychotherapy experience in separate historical patient state', () => {
    expect(
      PsychotherapyTrialRecordSchema.parse({
        schemaVersion: 1,
        id: 'psychotherapy-trial.example.cbt',
        interventionId: 'intervention.psychotherapy.cbt',
        status: 'completed',
        engagement: 'adequate',
        response: 'partial',
        source: 'patient_report',
        summary: 'Prior CBT was completed with partial benefit.',
      }),
    ).toMatchObject({
      interventionId: 'intervention.psychotherapy.cbt',
      status: 'completed',
      response: 'partial',
    });
  });
});
