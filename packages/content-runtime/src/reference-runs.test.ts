import { describe, expect, it } from 'vitest';

import { medicationCheckPalpitationsBlueprint, prototypeCaseBlueprint } from './content';
import {
  runAllReferenceSolutions,
  runEcgOwnershipComparison,
  runReferenceSolution,
  runReferenceSolutionsForCase,
} from './reference-runs';

describe('reference policies', () => {
  it('allows equally valid broad first-line routes while preserving shotgun and unsafe ordering', () => {
    const [database, alternative, shotgun, unsafe] = runAllReferenceSolutions();
    expect(database!.receipt.pointReport.carePointsEarned).toBe(
      alternative!.receipt.pointReport.carePointsEarned,
    );
    expect(alternative!.receipt.pointReport.carePointsEarned).toBeGreaterThan(
      shotgun!.receipt.pointReport.carePointsEarned,
    );
    expect(shotgun!.receipt.pointReport.carePointsEarned).toBeGreaterThan(
      unsafe!.receipt.pointReport.carePointsEarned,
    );
  });

  it('makes efficient play outperform shotgun testing financially', () => {
    const [database, , shotgun] = runAllReferenceSolutions();
    expect(database!.receipt.settlement.netClinicPointsEarned).toBeGreaterThan(
      shotgun!.receipt.settlement.netClinicPointsEarned,
    );
    expect(shotgun!.receipt.pointReport.actualWorkupExpense).toBeGreaterThan(7000);
  });

  it('makes unsafe treatment substantially worse and unprofitable', () => {
    const [database, , , unsafe] = runAllReferenceSolutions();
    expect(
      database!.receipt.pointReport.carePointsEarned - unsafe!.receipt.pointReport.carePointsEarned,
    ).toBeGreaterThan(1000);
    expect(unsafe!.receipt.settlement.netClinicPointsEarned).toBe(0);
  });

  it('separates a base treatment award from patient-specific fit modifiers', () => {
    const [database] = runAllReferenceSolutions();
    const base = database!.receipt.items.find((item) => item.scoreCategory === 'base_treatment');
    const medication = database!.receipt.items.find(
      (item) => item.itemName === 'Start: Sertraline',
    );
    expect(base).toMatchObject({ itemName: 'Base treatment fit', pointDelta: 100 });
    expect(medication).toMatchObject({
      scoreCategory: 'patient_fit_modifier',
      pointDelta: 0,
    });
    expect(database!.receipt.items.reduce((sum, item) => sum + item.pointDelta, 0)).toBe(
      database!.receipt.pointReport.carePointsEarned,
    );
  });

  it('keeps medication-specific scoring inside one broad authored outpatient pathway', () => {
    const [database, alternative] = runAllReferenceSolutions();
    expect(database!.receipt.pointReport).toMatchObject({
      selectedPathwayId: 'path.mdd-single-antidepressant-outpatient',
      treatmentEvaluationSource: 'authored_pathway',
    });
    expect(alternative!.receipt.pointReport).toMatchObject({
      selectedPathwayId: 'path.mdd-single-antidepressant-outpatient',
      treatmentEvaluationSource: 'authored_pathway',
    });
  });

  it('substantially penalizes unnecessary emergency escalation', () => {
    const reference = prototypeCaseBlueprint.referenceSolutions.find(
      (solution) => solution.kind === 'database_plan',
    )!;
    const database = runReferenceSolution(reference);
    const escalated = runReferenceSolution({
      ...reference,
      selections: {
        ...reference.selections,
        dispositionId: 'disposition.emergency-transfer',
      },
    });
    expect(escalated.receipt.pointReport.carePointCapApplied).toBe(200);
    expect(escalated.receipt.pointReport.differenceFromDatabasePlan).toBeLessThan(-500);
    expect(escalated.receipt.settlement.netClinicPointsEarned).toBeLessThan(
      database.receipt.settlement.netClinicPointsEarned / 2,
    );
    expect(
      escalated.receipt.items.find(
        (item) => item.itemName === 'Disposition: Transfer to emergency care',
      ),
    ).toMatchObject({ pointDelta: -450, scoreCategory: 'disposition' });
  });

  it('orders every ECG-relevant patient policy and keeps unsafe play unprofitable', () => {
    const [database, alternative, shotgun, unsafe] = runReferenceSolutionsForCase(
      medicationCheckPalpitationsBlueprint,
    );
    expect(database!.receipt.pointReport.carePointsEarned).toBeGreaterThan(
      alternative!.receipt.pointReport.carePointsEarned,
    );
    expect(alternative!.receipt.pointReport.carePointsEarned).toBeGreaterThan(
      shotgun!.receipt.pointReport.carePointsEarned,
    );
    expect(shotgun!.receipt.pointReport.carePointsEarned).toBeGreaterThan(
      unsafe!.receipt.pointReport.carePointsEarned,
    );
    expect(unsafe!.receipt.settlement.netClinicPointsEarned).toBe(0);
  });

  it('changes ECG economics without changing clinical correctness', () => {
    const comparison = runEcgOwnershipComparison();
    expect(comparison.outside.receipt.pointReport.carePointsEarned).toBe(1140);
    expect(comparison.inHouse.receipt.pointReport.carePointsEarned).toBe(1140);
    expect(comparison.outside.receipt.pointReport.ruleTrace).toEqual(
      comparison.inHouse.receipt.pointReport.ruleTrace,
    );
    expect(comparison.outside.receipt.pointReport.actualWorkupExpense).toBe(630);
    expect(comparison.inHouse.receipt.pointReport.actualWorkupExpense).toBe(200);
    expect(
      comparison.inHouse.receipt.settlement.netClinicPointsEarned -
        comparison.outside.receipt.settlement.netClinicPointsEarned,
    ).toBe(430);
    expect(
      comparison.inHouse.receipt.items.find((item) => item.itemName === '12-lead ECG'),
    ).toMatchObject({
      fulfillmentMethod: 'In-house ECG machine',
      operatingCost: 70,
      externalCostAvoided: 430,
    });
  });
});
