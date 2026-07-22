import { describe, expect, it } from 'vitest';
import type { CaseBlueprint, ClinicState, TreatmentSelection } from '@psychsim/schemas';

import {
  approvedCaseBlueprints,
  catalogs,
  medicationCheckPalpitationsBlueprint,
  prototypeCaseBlueprint,
  runReferenceSolution,
  startingClinic,
} from '../../content-runtime/src/index';
import { advancedPrototypeCaseBlueprint } from '../../content-runtime/src/test-content';
import { instantiateCase } from './case';
import { completeEncounter, requireCompleted } from './complete';
import { calculateSettlement } from './economy';
import {
  purchaseInformationAction,
  startEncounter,
  submitEncounter,
  updateTreatmentSelections,
} from './encounter';
import { buildCaseReceipt } from './receipt';
import { replayEncounter } from './replay';
import { getPatientSlotCount, resolveClinicForProgressionMode } from './progression';
import {
  consumePatientSlot,
  emptyPatientQueueState,
  ensurePatientQueues,
  refreshPatientQueue,
  rerollDeveloperSlot,
} from './queue';
import { scoreEncounter } from './scoring';
import { resolveServiceFulfillment } from './services';
import { getAvailableStartMedicationIds } from './formulary';
import { getUpgradeOffer, purchaseUpgrade } from './upgrades';

const databasePlan = prototypeCaseBlueprint.referenceSolutions.find(
  (solution) => solution.kind === 'database_plan',
)!;

const play = (
  blueprint: CaseBlueprint,
  actionIds: readonly string[],
  selections: TreatmentSelection,
  clinic: ClinicState = startingClinic,
  seed = 'unit-engine',
) => {
  const instance = instantiateCase(blueprint, seed, catalogs);
  let state = startEncounter(instance, clinic, clinic.activeLocationId);
  for (const actionId of actionIds) {
    state = requireCompleted(purchaseInformationAction(state, actionId, catalogs));
  }
  state = requireCompleted(updateTreatmentSelections(state, selections, catalogs));
  return requireCompleted(completeEncounter(state, catalogs));
};

const playStarter = (
  actionIds: readonly string[],
  selections: TreatmentSelection = databasePlan.selections,
  clinic: ClinicState = startingClinic,
) => play(prototypeCaseBlueprint, actionIds, selections, clinic);

describe('encounter engine', () => {
  it('reveals structured findings immediately and adds the resolved operating cost', () => {
    const state = startEncounter(
      instantiateCase(prototypeCaseBlueprint, 'immediate-result', catalogs),
      startingClinic,
      startingClinic.activeLocationId,
    );
    const purchased = requireCompleted(
      purchaseInformationAction(state, 'info.history.depressive-symptoms', catalogs),
    );
    expect(purchased.purchases).toHaveLength(1);
    expect(purchased.purchases[0]!.result.findings.length).toBeGreaterThanOrEqual(5);
    expect(
      purchased.purchases[0]!.result.findings.every((finding) => finding.label.length < 81),
    ).toBe(true);
    expect(purchased.expenseTotal).toBe(20);
    expect(purchased.knownFactIds).toContain('fact.mdd-syndrome');
  });

  it('enforces nonrepeatable actions', () => {
    const state = startEncounter(
      instantiateCase(prototypeCaseBlueprint, 'nonrepeatable', catalogs),
      startingClinic,
      startingClinic.activeLocationId,
    );
    const first = requireCompleted(
      purchaseInformationAction(state, 'info.history.presenting-problem', catalogs),
    );
    const second = purchaseInformationAction(first, 'info.history.presenting-problem', catalogs);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error.code).toBe('ACTION_ALREADY_PURCHASED');
  });

  it('selects the cheapest available equivalent service method', () => {
    const clinicWithEcg: ClinicState = {
      ...startingClinic,
      capabilities: [...startingClinic.capabilities, 'partner.ecg', 'equipment.ecg'],
      ownedEquipmentIds: ['equipment.ecg'],
    };
    const result = resolveServiceFulfillment(
      'service.diagnostic.ecg',
      clinicWithEcg,
      clinicWithEcg.activeLocationId,
      catalogs.services,
      catalogs.locations,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.method.id).toBe('fulfillment.in-house.ecg');
      expect(result.value.method.operatingCost).toBe(70);
      expect(result.value.externalCostAvoided).toBe(430);
    }
  });

  it('keeps history and physical work in house while every lab and diagnostic study is a sendout', () => {
    for (const action of catalogs.informationActions) {
      const result = resolveServiceFulfillment(
        action.serviceId,
        startingClinic,
        startingClinic.activeLocationId,
        catalogs.services,
        catalogs.locations,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      if (
        (action.category === 'history' && action.resultSource !== 'record_review') ||
        action.category === 'physical'
      ) {
        expect(result.value.method.kind).toBe('in_house');
      } else {
        expect(result.value.method.kind).not.toBe('in_house');
      }
    }
  });

  it('awards full points for an appropriate negative mania screen', () => {
    const run = playStarter(databasePlan.actionIds);
    const conditional = run.receipt.pointReport.ruleTrace.find((trace) =>
      trace.ruleId.startsWith('conditional.path.mdd-single-antidepressant'),
    );
    expect(conditional).toMatchObject({
      points: 45,
      matched: true,
      classification: 'appropriate_for_selected_treatment',
    });
    const mania = run.state.purchases.find(
      (purchase) => purchase.actionId === 'info.history.mania',
    );
    expect(mania?.result.findings.every((finding) => finding.outcome === 'absent')).toBe(true);
  });

  it('snapshots formal contributions and labels uncited rules as expert opinion', () => {
    const ecgPlan = medicationCheckPalpitationsBlueprint.referenceSolutions.find(
      (solution) => solution.kind === 'database_plan',
    )!;
    const ecgRun = play(
      medicationCheckPalpitationsBlueprint,
      ecgPlan.actionIds,
      ecgPlan.selections,
    );
    const cardiacMonitoring = ecgRun.receipt.pointReport.ruleTrace.find(
      (trace) => trace.ruleId === 'objective.ecg-mdd-cardiac-monitoring',
    );
    expect(cardiacMonitoring?.evidenceAttributions).toEqual([
      expect.objectContaining({
        authority: 'formal_publication',
        evidenceSourceId: 'evidence.fda.citalopram-capsules-label.2023',
        citation: expect.stringContaining('U.S. Food and Drug Administration'),
        contribution: expect.stringContaining('did not determine the prototype point magnitude'),
      }),
    ]);

    const starterRun = playStarter(databasePlan.actionIds);
    const uncitedRule = starterRun.receipt.pointReport.ruleTrace.find(
      (trace) => trace.ruleId === 'objective.mdd-safety',
    );
    expect(uncitedRule?.evidenceAttributions).toEqual([
      expect.objectContaining({
        authority: 'expert_opinion',
        evidenceSourceId: null,
        contribution: expect.stringMatching(/^Expert opinion:/),
      }),
    ]);
  });

  it('marks a required workup omission as critical and loses care points', () => {
    const complete = playStarter(databasePlan.actionIds);
    const omitted = playStarter(
      databasePlan.actionIds.filter((id) => id !== 'info.history.suicide-safety'),
    );
    expect(
      omitted.receipt.pointReport.ruleTrace.find(
        (trace) => trace.ruleId === 'objective.mdd-safety',
      ),
    ).toMatchObject({ points: -80, matched: false, classification: 'critical_omission' });
    expect(omitted.receipt.pointReport.carePointsEarned).toBeLessThan(
      complete.receipt.pointReport.carePointsEarned,
    );
  });

  it('makes unnecessary MRI spending costly without clinical benefit', () => {
    const efficient = playStarter(databasePlan.actionIds);
    const imaged = playStarter([...databasePlan.actionIds, 'info.imaging.brain-mri']);
    expect(
      imaged.receipt.pointReport.actualWorkupExpense -
        efficient.receipt.pointReport.actualWorkupExpense,
    ).toBe(1800);
    expect(imaged.receipt.pointReport.carePointsEarned).toBeLessThanOrEqual(
      efficient.receipt.pointReport.carePointsEarned,
    );
    expect(imaged.receipt.settlement.netClinicPointsEarned).toBeLessThan(
      efficient.receipt.settlement.netClinicPointsEarned,
    );
  });

  it('grades database-plan and strong-alternative treatments with substantial points', () => {
    const database = runReferenceSolution(databasePlan);
    const alternative = runReferenceSolution(
      prototypeCaseBlueprint.referenceSolutions.find(
        (solution) => solution.kind === 'strong_alternative',
      )!,
    );
    expect(database.receipt.pointReport).toMatchObject({
      carePointsEarned: 450,
      databasePlanCarePoints: 450,
      treatmentGrade: 'optimal',
    });
    expect(alternative.receipt.pointReport.treatmentGrade).toBe('strong_alternative');
    expect(alternative.receipt.pointReport.carePointsEarned).toBeGreaterThanOrEqual(400);
  });

  it('grades stopping a contributing medication correctly', () => {
    const solution = advancedPrototypeCaseBlueprint.referenceSolutions.find(
      (candidate) => candidate.kind === 'database_plan',
    )!;
    const run = play(
      advancedPrototypeCaseBlueprint,
      solution.actionIds,
      solution.selections,
      startingClinic,
      'advanced-stop',
    );
    expect(
      run.receipt.pointReport.ruleTrace.find(
        (trace) => trace.ruleId === 'rule.stop-contributing-aripiprazole',
      ),
    ).toMatchObject({ points: 75, matched: true });
  });

  it('applies a major penalty and cap to a harmful combination', () => {
    const unsafe = runReferenceSolution(
      prototypeCaseBlueprint.referenceSolutions.find((solution) => solution.kind === 'unsafe')!,
    );
    expect(unsafe.receipt.pointReport.treatmentGrade).toBe('harmful');
    expect(unsafe.receipt.pointReport.safetyErrors.length).toBeGreaterThan(0);
    expect(unsafe.receipt.pointReport.carePointsEarned).toBeLessThan(0);
    expect(unsafe.receipt.settlement.netClinicPointsEarned).toBe(0);
  });

  it('applies a treatment-specific requirement only to the relevant treatment', () => {
    const endgameClinic = resolveClinicForProgressionMode(startingClinic, 'endgame', catalogs);
    const strong = advancedPrototypeCaseBlueprint.referenceSolutions.find(
      (solution) => solution.kind === 'strong_alternative',
    )!;
    const withoutOrthostatics = play(
      advancedPrototypeCaseBlueprint,
      strong.actionIds.filter((id) => id !== 'info.physical.orthostatic-vitals'),
      strong.selections,
      endgameClinic,
    );
    expect(
      withoutOrthostatics.receipt.pointReport.ruleTrace.find((trace) =>
        trace.ruleId.startsWith('conditional.path.strong-symptomatic'),
      ),
    ).toMatchObject({ points: -48, classification: 'low_value' });

    const database = advancedPrototypeCaseBlueprint.referenceSolutions.find(
      (solution) => solution.kind === 'database_plan',
    )!;
    const databaseRun = play(
      advancedPrototypeCaseBlueprint,
      database.actionIds,
      database.selections,
      endgameClinic,
    );
    expect(
      databaseRun.receipt.pointReport.ruleTrace.some((trace) =>
        trace.ruleId.startsWith('conditional.path.strong-symptomatic'),
      ),
    ).toBe(false);
  });

  it('reports database-plan and selected-path workup costs separately', () => {
    const endgameClinic = resolveClinicForProgressionMode(startingClinic, 'endgame', catalogs);
    const strong = runReferenceSolution(
      advancedPrototypeCaseBlueprint.referenceSolutions.find(
        (solution) => solution.kind === 'strong_alternative',
      )!,
      'advanced-par',
      advancedPrototypeCaseBlueprint,
      endgameClinic,
    );
    expect(strong.receipt.pointReport.databasePlanWorkupCost).toBe(110);
    expect(strong.receipt.pointReport.selectedPathWorkupCost).toBe(120);
  });

  it('floors encounter payout at zero without reducing persistent points', () => {
    const shotgun = runReferenceSolution(
      prototypeCaseBlueprint.referenceSolutions.find((solution) => solution.kind === 'shotgun')!,
    );
    expect(shotgun.receipt.settlement.calculatedPayout).toBeLessThan(0);
    expect(shotgun.receipt.settlement.netClinicPointsEarned).toBe(0);
    expect(shotgun.receipt.settlement.persistentPointsAfter).toBe(
      shotgun.receipt.settlement.persistentPointsBefore,
    );
  });

  it('uses earned points themselves for lifetime progression', () => {
    const run = playStarter(databasePlan.actionIds);
    expect(run.receipt.settlement.lifetimePointsAfter).toBe(
      run.receipt.settlement.lifetimePointsBefore + run.receipt.settlement.netClinicPointsEarned,
    );
    expect('reputationXPEarned' in run.receipt.settlement).toBe(false);
  });

  it('keeps clinical correctness independent of external or in-house fulfillment', () => {
    const clinicWithEcg: ClinicState = {
      ...startingClinic,
      capabilities: [...startingClinic.capabilities, 'equipment.ecg'],
      ownedEquipmentIds: ['equipment.ecg'],
    };
    const actions = [...databasePlan.actionIds, 'info.imaging.ecg'];
    const outside = playStarter(actions, databasePlan.selections, startingClinic);
    const inHouse = playStarter(actions, databasePlan.selections, clinicWithEcg);
    expect(outside.receipt.pointReport.carePointsEarned).toBe(
      inHouse.receipt.pointReport.carePointsEarned,
    );
    expect(outside.receipt.pointReport.ruleTrace).toEqual(inHouse.receipt.pointReport.ruleTrace);
    expect(outside.receipt.pointReport.actualWorkupExpense).toBeGreaterThan(
      inHouse.receipt.pointReport.actualWorkupExpense,
    );
  });

  it('replays identical event history to an identical point report and receipt', () => {
    const original = playStarter(databasePlan.actionIds);
    const replayed = requireCompleted(
      replayEncounter(
        original.state.caseInstance,
        original.state.clinicState,
        original.state.events,
        catalogs,
      ),
    );
    const replayedPoints = requireCompleted(scoreEncounter(replayed, catalogs));
    const replayedSettlement = calculateSettlement(
      replayedPoints,
      replayed.clinicState,
      replayed.caseInstance,
    );
    expect(buildCaseReceipt(replayed, replayedPoints, replayedSettlement, catalogs)).toEqual(
      original.receipt,
    );
  });

  it('refuses to score before submission', () => {
    const state = startEncounter(
      instantiateCase(prototypeCaseBlueprint, 'not-submitted', catalogs),
      startingClinic,
      startingClinic.activeLocationId,
    );
    expect(scoreEncounter(state, catalogs).ok).toBe(false);
    expect(submitEncounter(state).ok).toBe(true);
  });

  it('applies meaningful medication-fit bonuses and penalties from medication-owned files', () => {
    const mirtazapineSelections = {
      ...databasePlan.selections,
      startMedicationIds: ['medication.mirtazapine'],
    };
    const expandedClinic = requireCompleted(
      purchaseUpgrade(
        { ...startingClinic, clinicPoints: 2_000 },
        'upgrade.formulary.expanded-outpatient',
        catalogs,
      ),
    );
    const insomnia = playStarter(databasePlan.actionIds, mirtazapineSelections, expandedClinic);
    const highBmiBlueprint = structuredClone(prototypeCaseBlueprint);
    highBmiBlueprint.patientRecord.clinicalTagIds = highBmiBlueprint.patientRecord.clinicalTagIds
      .filter((tag) => tag !== 'symptom.insomnia')
      .concat('medical.high-bmi');
    const highBmi = play(
      highBmiBlueprint,
      databasePlan.actionIds,
      mirtazapineSelections,
      expandedClinic,
      'high-bmi',
    );
    expect(
      insomnia.receipt.pointReport.ruleTrace.find(
        (trace) => trace.ruleId === 'modifier.mirtazapine.insomnia-fit-active',
      )?.points,
    ).toBe(35);
    expect(
      highBmi.receipt.pointReport.ruleTrace.find(
        (trace) => trace.ruleId === 'modifier.mirtazapine.high-bmi-fit-active',
      )?.points,
    ).toBe(-50);
    expect(insomnia.receipt.pointReport.carePointsEarned).toBeGreaterThan(
      highBmi.receipt.pointReport.carePointsEarned,
    );
  });
});

describe('clinic upgrades and formularies', () => {
  it('quotes ECG ownership from the current and projected fulfillment methods', () => {
    const offer = requireCompleted(
      getUpgradeOffer(startingClinic, 'upgrade.equipment.ecg', catalogs),
    );
    expect(offer.canPurchase).toBe(false);
    expect(offer.blockers.map((blocker) => blocker.code)).toContain('insufficient_points');
    expect(offer.serviceEconomics[0]).toMatchObject({
      currentMethodId: 'fulfillment.outside.ecg',
      currentPerUseCost: 500,
      projectedMethodId: 'fulfillment.in-house.ecg',
      projectedPerUseCost: 70,
      estimatedSavingsPerUse: 430,
    });
    expect(offer.approximateBreakEvenUses).toBe(3);
  });

  it('purchases equipment atomically without debt or loss of lifetime progression', () => {
    const funded = { ...startingClinic, clinicPoints: 1_300, lifetimePointsEarned: 1_050 };
    const snapshot = structuredClone(funded);
    const purchased = requireCompleted(purchaseUpgrade(funded, 'upgrade.equipment.ecg', catalogs));
    expect(funded).toEqual(snapshot);
    expect(purchased.clinicPoints).toBe(100);
    expect(purchased.lifetimePointsEarned).toBe(1_050);
    expect(purchased.ownedUpgradeIds).toContain('upgrade.equipment.ecg');
    expect(purchased.ownedEquipmentIds).toContain('upgrade.equipment.ecg');
    expect(purchased.capabilities).toContain('equipment.ecg');
    expect(
      requireCompleted(
        resolveServiceFulfillment(
          'service.diagnostic.ecg',
          purchased,
          purchased.activeLocationId,
          catalogs.services,
          catalogs.locations,
        ),
      ).method.id,
    ).toBe('fulfillment.in-house.ecg');
    expect(purchaseUpgrade(purchased, 'upgrade.equipment.ecg', catalogs)).toMatchObject({
      ok: false,
      error: { code: 'UPGRADE_ALREADY_OWNED' },
    });
    expect(purchaseUpgrade(startingClinic, 'upgrade.equipment.ecg', catalogs)).toMatchObject({
      ok: false,
      error: { code: 'INSUFFICIENT_POINTS' },
    });
  });

  it('adds only the purchased formulary options to medication starts', () => {
    const instance = instantiateCase(prototypeCaseBlueprint, 'formulary-upgrade', catalogs);
    expect(
      getAvailableStartMedicationIds(
        instance,
        startingClinic,
        startingClinic.activeLocationId,
        catalogs,
      ),
    ).toEqual(['medication.sertraline', 'medication.escitalopram', 'medication.fluoxetine']);
    const expanded = requireCompleted(
      purchaseUpgrade(
        { ...startingClinic, clinicPoints: 1_000 },
        'upgrade.formulary.expanded-outpatient',
        catalogs,
      ),
    );
    expect(
      getAvailableStartMedicationIds(instance, expanded, expanded.activeLocationId, catalogs),
    ).toEqual([
      'medication.sertraline',
      'medication.escitalopram',
      'medication.fluoxetine',
      'medication.bupropion',
      'medication.mirtazapine',
      'medication.buspirone',
    ]);
  });
});

describe('progression and patient queues', () => {
  const endgameClinic = resolveClinicForProgressionMode(startingClinic, 'endgame', catalogs);
  const pools = {
    approved: approvedCaseBlueprints,
    developer: [...approvedCaseBlueprints, advancedPrototypeCaseBlueprint],
  };

  it('derives reversible endgame and developer clinics without mutating standard progression', () => {
    const snapshot = structuredClone(startingClinic);
    const endgame = resolveClinicForProgressionMode(startingClinic, 'endgame', catalogs);
    const developer = resolveClinicForProgressionMode(startingClinic, 'developer', catalogs);
    expect(startingClinic).toEqual(snapshot);
    expect(endgame.facilityTier).toBe('behavioral_health_system');
    expect(developer).toEqual(endgame);
    expect(getPatientSlotCount(startingClinic, 'standard', catalogs)).toBe(1);
    expect(getPatientSlotCount(endgame, 'endgame', catalogs)).toBe(6);
  });

  it('keeps normal patients stuck in their slot and changes the complaint after completion', () => {
    const initial = ensurePatientQueues(
      emptyPatientQueueState(),
      startingClinic,
      endgameClinic,
      pools,
      catalogs,
    );
    const unchanged = ensurePatientQueues(initial, startingClinic, endgameClinic, pools, catalogs);
    expect(unchanged.standardSlots).toEqual(initial.standardSlots);
    const slot = initial.standardSlots[0]!;
    const consumed = consumePatientSlot(
      initial,
      slot.id,
      'standard',
      startingClinic,
      endgameClinic,
      pools,
      catalogs,
    );
    expect(consumed.standardSlots[0]!.caseInstance.opening.chiefComplaint).not.toBe(
      slot.caseInstance.opening.chiefComplaint,
    );
  });

  it('refreshes endgame slots and rerolls developer patient characteristics', () => {
    const initial = ensurePatientQueues(
      emptyPatientQueueState(),
      startingClinic,
      endgameClinic,
      pools,
      catalogs,
    );
    const refreshed = refreshPatientQueue(
      initial,
      'endgame',
      startingClinic,
      endgameClinic,
      pools,
      catalogs,
    );
    expect(refreshed.endgameSlots.map((slot) => slot.caseInstance.id)).not.toEqual(
      initial.endgameSlots.map((slot) => slot.caseInstance.id),
    );
    const developerSlot = initial.developerSlots[0]!;
    const rerolled = rerollDeveloperSlot(
      initial,
      developerSlot.id,
      endgameClinic,
      pools.developer,
      catalogs,
    );
    expect(
      rerolled.developerSlots.find((slot) => slot.id === developerSlot.id)!.caseInstance.id,
    ).not.toBe(developerSlot.caseInstance.id);
  });

  it('shows each developer patient definition only until it has been run', () => {
    const initial = ensurePatientQueues(
      emptyPatientQueueState(),
      startingClinic,
      endgameClinic,
      pools,
      catalogs,
    );
    const slot = initial.developerSlots[0]!;
    const consumed = consumePatientSlot(
      initial,
      slot.id,
      'developer',
      startingClinic,
      endgameClinic,
      pools,
      catalogs,
    );
    expect(consumed.developerRunBlueprintIds).toContain(slot.caseInstance.blueprintId);
    expect(
      consumed.developerSlots.some(
        (candidate) => candidate.caseInstance.blueprintId === slot.caseInstance.blueprintId,
      ),
    ).toBe(false);
  });
});
