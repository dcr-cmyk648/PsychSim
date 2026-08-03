import { describe, expect, it } from 'vitest';
import type {
  CaseBlueprint,
  CatalogBundle,
  ClinicState,
  PlayerDiagnosisSelection,
  TreatmentSelection,
} from '@psychsim/schemas';

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
  startEncounterWithAutomaticIntake,
  submitEncounter,
  updateDiagnosisSelections,
  updateTreatmentSelections,
} from './encounter';
import { buildCaseReceipt } from './receipt';
import { replayEncounter } from './replay';
import { getPatientSlotCount, resolveClinicForProgressionMode } from './progression';
import {
  consumePatientSlot,
  emptyPatientQueueState,
  ensurePatientQueues,
  generateDeveloperPatientSlot,
  refreshPatientQueue,
  rerollDeveloperSlot,
} from './queue';
import { scoreEncounter } from './scoring';
import { resolveServiceFulfillment } from './services';
import { calculateSatisfactionState } from './satisfaction';
import { getAvailableStartMedicationIds } from './formulary';
import { configureStaffAutomation, getUpgradeOffer, purchaseUpgrade } from './upgrades';

const databasePlan = prototypeCaseBlueprint.referenceSolutions.find(
  (solution) => solution.kind === 'database_plan',
)!;

const play = (
  blueprint: CaseBlueprint,
  actionIds: readonly string[],
  selections: TreatmentSelection,
  clinic: ClinicState = startingClinic,
  seed = 'unit-engine',
  catalogBundle: CatalogBundle = catalogs,
  diagnosisSelections: readonly PlayerDiagnosisSelection[] = [],
) => {
  const instance = instantiateCase(blueprint, seed, catalogBundle);
  let state = startEncounter(instance, clinic, clinic.activeLocationId);
  for (const actionId of actionIds) {
    state = requireCompleted(purchaseInformationAction(state, actionId, catalogBundle));
  }
  state = requireCompleted(updateDiagnosisSelections(state, diagnosisSelections, catalogBundle));
  state = requireCompleted(updateTreatmentSelections(state, selections, catalogBundle));
  return requireCompleted(completeEncounter(state, catalogBundle));
};

const playStarter = (
  actionIds: readonly string[],
  selections: TreatmentSelection = databasePlan.selections,
  clinic: ClinicState = startingClinic,
  diagnosisSelections: readonly PlayerDiagnosisSelection[] = databasePlan.diagnosisSelections,
) =>
  play(
    prototypeCaseBlueprint,
    actionIds,
    selections,
    clinic,
    'unit-engine',
    catalogs,
    diagnosisSelections,
  );

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

  it('charges a selected treatment service exactly once and itemizes it separately', () => {
    const selections = {
      ...databasePlan.selections,
      interventionIds: [
        ...databasePlan.selections.interventionIds,
        'intervention.substance-use.brief-counseling',
      ],
    };
    const completed = playStarter(databasePlan.actionIds, selections);
    expect(completed.receipt.settlement).toMatchObject({
      informationExpenses: 145,
      treatmentExpenses: 25,
      operatingExpenses: 170,
    });
    expect(
      completed.receipt.items.find(
        (item) => item.itemName === 'Add: Brief substance-use counseling',
      ),
    ).toMatchObject({
      operatingCost: 25,
      fulfillmentMethod: 'In-office counseling',
    });
  });

  it('selects the cheapest treatment fulfillment and rejects unavailable treatment services', () => {
    const cheaperCatalogs = structuredClone(catalogs);
    cheaperCatalogs.services
      .find((service) => service.id === 'service.intervention.substance-use-counseling')!
      .fulfillmentMethods.push({
        id: 'fulfillment.partner.substance-use-counseling',
        label: 'Partner counseling',
        kind: 'contracted_partner',
        operatingCost: 10,
        requiredCapabilities: [],
        qualityModifier: 1,
      });
    const selections = {
      ...databasePlan.selections,
      interventionIds: ['intervention.substance-use.brief-counseling'],
    };
    const cheaperInstance = instantiateCase(
      prototypeCaseBlueprint,
      'treatment-fulfillment',
      cheaperCatalogs,
    );
    const cheaperState = startEncounter(
      cheaperInstance,
      startingClinic,
      startingClinic.activeLocationId,
    );
    const selected = requireCompleted(
      updateTreatmentSelections(cheaperState, selections, cheaperCatalogs),
    );
    const completed = requireCompleted(completeEncounter(selected, cheaperCatalogs));
    expect(completed.receipt.settlement.treatmentExpenses).toBe(10);

    const withoutCounseling = {
      ...startingClinic,
      capabilities: startingClinic.capabilities.filter(
        (capability) => capability !== 'counseling.basic',
      ),
    };
    const withoutCounselingCatalogs = structuredClone(catalogs);
    const activeLocation = withoutCounselingCatalogs.locations.find(
      (location) => location.id === withoutCounseling.activeLocationId,
    )!;
    activeLocation.capabilities = activeLocation.capabilities.filter(
      (capability) => capability !== 'counseling.basic',
    );
    const originalInstance = instantiateCase(
      prototypeCaseBlueprint,
      'treatment-unavailable',
      withoutCounselingCatalogs,
    );
    const unavailable = updateTreatmentSelections(
      startEncounter(originalInstance, withoutCounseling, withoutCounseling.activeLocationId),
      selections,
      withoutCounselingCatalogs,
    );
    expect(unavailable.ok).toBe(false);
    if (!unavailable.ok) expect(unavailable.error.code).toBe('SERVICE_UNAVAILABLE');
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
    const conditional = run.receipt.pointReport.ruleTrace.find(
      (trace) => trace.ruleId === 'treatment-requirement.mdd-antidepressant-mania-history',
    );
    expect(conditional).toMatchObject({
      points: 45,
      matched: true,
      classification: 'appropriate_for_selected_treatment',
      concernLevel: 'major',
      certaintyLevel: 'strong',
    });
    const mania = run.state.purchases.find(
      (purchase) => purchase.actionId === 'info.history.mania',
    );
    expect(mania?.result.findings.every((finding) => finding.outcome === 'absent')).toBe(true);
  });

  it('activates workup prerequisites from the submitted medication plan', () => {
    const coreActions = databasePlan.actionIds.filter(
      (id) =>
        ![
          'info.history.mania',
          'info.history.medication-reconciliation',
          'info.history.allergies-adverse-reactions',
        ].includes(id),
    );
    const antidepressant = playStarter(coreActions);
    expect(
      antidepressant.receipt.pointReport.ruleTrace
        .filter((trace) => trace.ruleId.startsWith('treatment-requirement.mdd-'))
        .map((trace) => [trace.ruleId, trace.points, trace.classification]),
    ).toEqual([
      ['treatment-requirement.mdd-antidepressant-mania-history', -70, 'critical_omission'],
      ['treatment-requirement.mdd-any-medication-reconciliation', -25, 'critical_omission'],
      ['treatment-requirement.mdd-any-medication-reaction-history', -40, 'critical_omission'],
    ]);

    const noMedication = playStarter(coreActions, {
      startMedicationIds: [],
      stopMedicationIds: [],
      continueMedicationIds: [],
      interventionIds: ['intervention.psychotherapy.cbt'],
      dispositionId: 'disposition.outpatient-followup',
    });
    expect(
      noMedication.receipt.pointReport.ruleTrace.some((trace) =>
        trace.ruleId.startsWith('treatment-requirement.mdd-'),
      ),
    ).toBe(false);

    const nonAntidepressant = playStarter(
      coreActions,
      {
        startMedicationIds: ['medication.haloperidol'],
        stopMedicationIds: [],
        continueMedicationIds: [],
        interventionIds: [],
        dispositionId: 'disposition.outpatient-followup',
      },
      resolveClinicForProgressionMode(startingClinic, 'endgame', catalogs),
    );
    expect(
      nonAntidepressant.receipt.pointReport.ruleTrace.some(
        (trace) => trace.ruleId === 'treatment-requirement.mdd-antidepressant-mania-history',
      ),
    ).toBe(false);
    expect(
      nonAntidepressant.receipt.pointReport.ruleTrace
        .filter((trace) => trace.ruleId.startsWith('treatment-requirement.mdd-'))
        .map((trace) => trace.ruleId),
    ).toEqual([
      'treatment-requirement.mdd-any-medication-reconciliation',
      'treatment-requirement.mdd-any-medication-reaction-history',
    ]);
  });

  it('scores a resolved prior medication reaction even when the history was not revealed', () => {
    const reactionBlueprint = structuredClone(prototypeCaseBlueprint);
    reactionBlueprint.patientRecord.reactionHistory.medicationAssessmentStatus = 'entries_present';
    reactionBlueprint.patientRecord.reactionHistory.records.push({
      schemaVersion: 1,
      id: 'reaction.outpatient-intake-001.sertraline',
      trigger: {
        kind: 'medication',
        medicationId: 'medication.sertraline',
      },
      recordedAs: 'allergy',
      manifestationIds: ['reaction-manifestation.hives'],
      reportedSeverity: 'severe',
      interpretedAs: null,
      source: 'patient_report',
      status: 'active',
    });
    const withoutReactionHistory = play(
      reactionBlueprint,
      databasePlan.actionIds.filter((id) => id !== 'info.history.allergies-adverse-reactions'),
      databasePlan.selections,
      startingClinic,
      'hidden-prior-reaction',
      catalogs,
      databasePlan.diagnosisSelections,
    );
    const reactionTrace = withoutReactionHistory.receipt.pointReport.ruleTrace.find(
      (trace) => trace.ruleId === 'reaction-policy.same-medication.severe.medication.sertraline',
    );
    expect(withoutReactionHistory.state.knownFactIds).not.toContain('fact.mdd-reaction-history');
    expect(reactionTrace).toMatchObject({
      points: -500,
      classification: 'harmful',
      concernLevel: 'critical',
      certaintyLevel: 'tentative',
      relatedTreatmentIds: ['medication.sertraline'],
    });
    expect(withoutReactionHistory.receipt.pointReport.carePointCapApplied).toBe(200);
    expect(withoutReactionHistory.receipt.pointReport.safetyErrors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('prior severe reported reaction to Sertraline'),
      ]),
    );
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

  it('applies the initial-outpatient multi-antidepressant rule beyond one hard-coded SSRI pair', () => {
    const endgameClinic = resolveClinicForProgressionMode(startingClinic, 'endgame', catalogs);
    const run = playStarter(
      databasePlan.actionIds,
      {
        startMedicationIds: ['medication.bupropion', 'medication.mirtazapine'],
        stopMedicationIds: [],
        continueMedicationIds: [],
        interventionIds: [],
        dispositionId: 'disposition.outpatient-followup',
      },
      endgameClinic,
    );

    expect(run.receipt.pointReport.treatmentGrade).toBe('harmful');
    expect(
      run.receipt.pointReport.ruleTrace.find(
        (trace) => trace.ruleId === 'grade.mdd-harmful-antidepressant-combination',
      ),
    ).toMatchObject({
      matched: true,
      evidenceAttributions: [
        expect.objectContaining({
          authority: 'expert_opinion',
          evidenceSourceId: null,
          contribution: expect.stringMatching(/^Developer opinion:/),
        }),
      ],
    });
    expect(
      run.receipt.pointReport.ruleTrace.find(
        (trace) => trace.ruleId === 'rule.mdd-combination-safety',
      ),
    ).toMatchObject({ matched: true, points: -1100 });
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
    expect(
      omitted.receipt.items.find((item) => item.relatedRuleIds.includes('objective.mdd-safety')),
    ).toMatchObject({
      itemName: 'Missed: Assess suicide risk and outpatient suitability',
      pointDelta: -80,
      operatingCost: 0,
    });
    expect(omitted.receipt.items.reduce((sum, item) => sum + item.pointDelta, 0)).toBe(
      omitted.receipt.pointReport.carePointsEarned,
    );
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
      carePointsEarned: 745,
      databasePlanCarePoints: 745,
      treatmentGrade: 'optimal',
      componentPoints: expect.objectContaining({ diagnosis: 100 }),
    });
    expect(alternative.receipt.pointReport.treatmentGrade).toBe('optimal');
    expect(alternative.receipt.pointReport.carePointsEarned).toBe(745);
  });

  it('keeps diagnostic answers separate while applying the worst consequence for one mistake', () => {
    const canonical = playStarter(databasePlan.actionIds);
    const bipolarMisclassification = playStarter(
      databasePlan.actionIds,
      databasePlan.selections,
      startingClinic,
      [
        {
          diagnosisId: 'diagnosis.bipolar-spectrum-disorder',
          severityId: null,
          specifierIds: [],
        },
      ],
    );
    const canonicalNonDiagnosis = {
      ...canonical.receipt.pointReport.componentPoints,
      diagnosis: 0,
    };
    const wrongNonDiagnosis = {
      ...bipolarMisclassification.receipt.pointReport.componentPoints,
      diagnosis: 0,
    };

    expect(wrongNonDiagnosis).toEqual(canonicalNonDiagnosis);
    expect(bipolarMisclassification.receipt.pointReport.componentPoints.diagnosis).toBe(-120);
    expect(bipolarMisclassification.receipt.pointReport.carePointCapApplied).toBe(250);
    expect(
      bipolarMisclassification.receipt.pointReport.ruleTrace.filter(
        (row) => row.issueId === 'diagnostic-issue.mdd-initial.primary',
      ),
    ).toEqual([
      expect.objectContaining({
        ruleId: 'diagnosis-error.mdd-initial.bipolar',
        classification: 'diagnosis_dangerous_misclassification',
        points: -120,
      }),
    ]);
    expect(bipolarMisclassification.receipt.pointReport.safetyErrors).toHaveLength(1);
  });

  it('keeps MDD severity internal while allowing its reviewed named psychotic-features variant', () => {
    const state = startEncounter(
      instantiateCase(prototypeCaseBlueprint, 'mdd-diagnosis-qualifier-boundary', catalogs),
      startingClinic,
      startingClinic.activeLocationId,
    );

    expect(
      updateDiagnosisSelections(
        state,
        [
          {
            diagnosisId: 'diagnosis.major-depressive-disorder',
            severityId: 'severity.mdd.moderate',
            specifierIds: [],
          },
        ],
        catalogs,
      ),
    ).toMatchObject({
      ok: false,
      error: {
        code: 'INVALID_DIAGNOSIS_SELECTION',
        message: expect.stringContaining('internal generation state'),
      },
    });

    const namedVariant = updateDiagnosisSelections(
      state,
      [
        {
          diagnosisId: 'diagnosis.major-depressive-disorder',
          severityId: null,
          specifierIds: ['specifier.mdd.psychotic-features'],
        },
      ],
      catalogs,
    );
    expect(namedVariant).toMatchObject({
      ok: true,
      value: {
        diagnosisSelections: [
          {
            diagnosisId: 'diagnosis.major-depressive-disorder',
            severityId: null,
            specifierIds: ['specifier.mdd.psychotic-features'],
          },
        ],
      },
    });
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
    ).toMatchObject({ points: -48, classification: 'critical_omission' });

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
    expect(replayed.diagnosisSelections).toEqual(databasePlan.diagnosisSelections);
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
    const hiddenInsomnia = playStarter(
      databasePlan.actionIds,
      mirtazapineSelections,
      expandedClinic,
    );
    const revealedInsomnia = playStarter(
      [...databasePlan.actionIds, 'info.history.sleep'],
      mirtazapineSelections,
      expandedClinic,
    );
    const highBmiBlueprint = structuredClone(prototypeCaseBlueprint);
    highBmiBlueprint.patientRecord.clinicalTagIds = highBmiBlueprint.patientRecord.clinicalTagIds
      .filter((tag) => tag !== 'symptom.insomnia')
      .concat('medical.high-bmi');
    const highBmiResult = highBmiBlueprint.informationActions.find(
      (action) => action.actionId === 'info.physical.weight-bmi',
    )!.result;
    const highBmiFinding = highBmiResult.findings.find(
      (finding) => finding.id === 'finding.weight-bmi.bmi',
    )!;
    highBmiFinding.outcome = 'high';
    highBmiFinding.valueTextVariants = ['33.1 kg/m²'];
    highBmiResult.factsRevealed = ['fact.mdd-weight-bmi-high'];
    const highBmi = play(
      highBmiBlueprint,
      databasePlan.actionIds,
      mirtazapineSelections,
      expandedClinic,
      'high-bmi',
    );
    const hiddenInsomniaTrace = hiddenInsomnia.receipt.pointReport.ruleTrace.find(
      (trace) => trace.ruleId === 'modifier.mirtazapine.insomnia-fit-active',
    );
    const revealedInsomniaTrace = revealedInsomnia.receipt.pointReport.ruleTrace.find(
      (trace) => trace.ruleId === 'modifier.mirtazapine.insomnia-fit-active',
    );
    const hiddenHighBmiTrace = highBmi.receipt.pointReport.ruleTrace.find(
      (trace) => trace.ruleId === 'modifier.mirtazapine.high-bmi-fit-active',
    );
    expect(hiddenInsomnia.state.knownFactIds).not.toContain('fact.mdd-insomnia');
    expect(revealedInsomnia.state.knownFactIds).toContain('fact.mdd-insomnia');
    expect(hiddenInsomniaTrace).toEqual(revealedInsomniaTrace);
    expect(hiddenInsomniaTrace).toMatchObject({
      label: 'Mirtazapine: fit bonus',
      points: 35,
      evidenceAttributions: [
        expect.objectContaining({
          authority: 'expert_opinion',
        }),
      ],
    });
    expect(highBmi.state.knownFactIds).not.toContain('fact.mdd-weight-bmi-normal');
    expect(highBmi.state.purchases.map((purchase) => purchase.actionId)).not.toContain(
      'info.physical.weight-bmi',
    );
    expect(hiddenHighBmiTrace).toMatchObject({
      label: 'Mirtazapine: fit penalty',
      points: -50,
    });
    const mixedFitBlueprint = structuredClone(highBmiBlueprint);
    mixedFitBlueprint.patientRecord.clinicalTagIds.push('symptom.insomnia');
    const mixedFit = play(
      mixedFitBlueprint,
      databasePlan.actionIds,
      mirtazapineSelections,
      expandedClinic,
      'mixed-fit',
    );
    expect(
      mixedFit.receipt.pointReport.ruleTrace
        .filter((trace) =>
          [
            'modifier.mirtazapine.insomnia-fit-active',
            'modifier.mirtazapine.high-bmi-fit-active',
          ].includes(trace.ruleId),
        )
        .map((trace) => ({
          ruleId: trace.ruleId,
          label: trace.label,
          points: trace.points,
          provenance: trace.evidenceAttributions[0]?.authority,
        })),
    ).toEqual([
      {
        ruleId: 'modifier.mirtazapine.insomnia-fit-active',
        label: 'Mirtazapine: fit bonus',
        points: 35,
        provenance: 'expert_opinion',
      },
      {
        ruleId: 'modifier.mirtazapine.high-bmi-fit-active',
        label: 'Mirtazapine: fit penalty',
        points: -50,
        provenance: 'expert_opinion',
      },
    ]);
    expect(hiddenInsomnia.receipt.pointReport.carePointsEarned).toBeGreaterThan(
      highBmi.receipt.pointReport.carePointsEarned,
    );
    expect(revealedInsomnia.receipt.pointReport.actualWorkupExpense).toBeGreaterThan(
      hiddenInsomnia.receipt.pointReport.actualWorkupExpense,
    );
  });

  it('preserves modifier-owned formal provenance in the post-submit fit trace', () => {
    const sourcedCatalogs = structuredClone(catalogs);
    const mirtazapine = sourcedCatalogs.medications.find(
      (medication) => medication.id === 'medication.mirtazapine',
    )!;
    const modifier = mirtazapine.fitModifiers.find(
      (candidate) => candidate.id === 'modifier.mirtazapine.insomnia-fit-active',
    )!;
    const sourceUseNoteId = 'source-use.test.mirtazapine-fit-provenance';
    mirtazapine.sourceUseNotes.push({
      id: sourceUseNoteId,
      authority: 'formal_publication',
      evidenceSourceIds: ['evidence.canmat.mdd-adults.2023-update'],
      sourceDocumentId: null,
      sourceChunkIds: [],
      targetContentIds: [modifier.id],
      contributionTypes: ['medication_fit'],
      contribution:
        'Test-only provenance fixture for modifier plumbing; this is not a clinical claim.',
      generatedBy: 'human',
      medicalReviewStatus: 'unreviewed',
    });
    modifier.sourceUseNoteIds = [sourceUseNoteId];
    expect(modifier.review.sourceUseNoteIds).toEqual([]);

    const expandedClinic = requireCompleted(
      purchaseUpgrade(
        { ...startingClinic, clinicPoints: 2_000 },
        'upgrade.formulary.expanded-outpatient',
        sourcedCatalogs,
      ),
    );
    const run = play(
      prototypeCaseBlueprint,
      databasePlan.actionIds,
      {
        ...databasePlan.selections,
        startMedicationIds: ['medication.mirtazapine'],
      },
      expandedClinic,
      'sourced-fit',
      sourcedCatalogs,
    );
    expect(
      run.receipt.pointReport.ruleTrace.find(
        (trace) => trace.ruleId === 'modifier.mirtazapine.insomnia-fit-active',
      ),
    ).toMatchObject({
      points: 35,
      evidenceAttributions: [
        {
          sourceUseNoteId,
          authority: 'formal_publication',
          evidenceSourceId: 'evidence.canmat.mdd-adults.2023-update',
          citation: expect.stringContaining('CANMAT'),
          url: expect.stringMatching(/^https:/),
          contribution:
            'Test-only provenance fixture for modifier plumbing; this is not a clinical claim.',
        },
      ],
    });
  });

  it('suppresses the primary route and fit bonus when a matching modifier is a hard contraindication', () => {
    const contraindicatedCatalogs = structuredClone(catalogs);
    const mirtazapine = contraindicatedCatalogs.medications.find(
      (medication) => medication.id === 'medication.mirtazapine',
    )!;
    mirtazapine.fitModifiers.push({
      id: 'modifier.test.mirtazapine.hard-contraindication',
      effectId: 'effect.test.mirtazapine.suitability',
      issueId: 'issue.test.mirtazapine.suitability',
      specificityPriority: 100,
      patientTagIds: ['symptom.insomnia'],
      effect: 'contraindication',
      pointDelta: -100,
      explanation:
        'Test-only hard-contraindication fixture; this is not a clinical recommendation.',
      sourceUseNoteIds: [],
      medicalReviewStatus: 'unreviewed',
      review: {
        status: 'unreviewed',
        reviewerId: null,
        reviewedAt: null,
        sourceUseNoteIds: [],
      },
    });
    const expandedClinic = requireCompleted(
      purchaseUpgrade(
        { ...startingClinic, clinicPoints: 2_000 },
        'upgrade.formulary.expanded-outpatient',
        contraindicatedCatalogs,
      ),
    );
    const selections = {
      ...databasePlan.selections,
      startMedicationIds: ['medication.mirtazapine'],
    };
    const baseline = play(
      prototypeCaseBlueprint,
      databasePlan.actionIds,
      selections,
      expandedClinic,
      'combination-contraindication',
      catalogs,
    );
    const contraindicated = play(
      prototypeCaseBlueprint,
      databasePlan.actionIds,
      selections,
      expandedClinic,
      'combination-contraindication',
      contraindicatedCatalogs,
    );

    expect(
      contraindicated.receipt.pointReport.ruleTrace.find(
        (trace) => trace.ruleId === 'grade.mdd-initial-first-line-antidepressant',
      ),
    ).toMatchObject({
      points: 0,
      pointsBeforeCombination: 200,
      combinationStatus: 'suppressed',
      resolvedByRuleId: 'modifier.test.mirtazapine.hard-contraindication',
    });
    expect(
      contraindicated.receipt.pointReport.ruleTrace.find(
        (trace) => trace.ruleId === 'modifier.mirtazapine.insomnia-fit-active',
      ),
    ).toMatchObject({
      points: 0,
      pointsBeforeCombination: 35,
      combinationStatus: 'suppressed',
      resolvedByRuleId: 'modifier.test.mirtazapine.hard-contraindication',
    });
    expect(
      contraindicated.receipt.pointReport.ruleTrace.find(
        (trace) => trace.ruleId === 'modifier.test.mirtazapine.hard-contraindication',
      ),
    ).toMatchObject({
      points: -100,
      combinationStatus: 'applied',
    });
    expect(contraindicated.receipt.pointReport.carePointsEarned).toBe(
      baseline.receipt.pointReport.carePointsEarned - 335,
    );
  });

  it('applies safety errors and caps only from the retained worst consequence for one issue', () => {
    const duplicateSafetyBlueprint = structuredClone(prototypeCaseBlueprint);
    const matchingDisposition = databasePlan.selections.dispositionId!;
    const review = {
      status: 'unreviewed' as const,
      reviewerId: null,
      reviewedAt: null,
      sourceUseNoteIds: [],
    };
    duplicateSafetyBlueprint.scoreRules.push(
      {
        id: 'rule.test.safety-general',
        effectId: null,
        issueId: 'issue.test.same-safety-error',
        specificityPriority: 10,
        label: 'General duplicate safety consequence',
        component: 'safety',
        predicate: { type: 'dispositionSelected', dispositionId: matchingDisposition },
        pointsIfTrue: -40,
        pointsIfFalse: 0,
        classificationIfTrue: 'harmful',
        classificationIfFalse: 'safe',
        explanationIfTrue: 'Test-only general safety consequence.',
        explanationIfFalse: 'Test-only general safety condition did not match.',
        safetyErrorIfTrue: 'General duplicate safety error.',
        carePointCapIfTrue: 400,
        review,
      },
      {
        id: 'rule.test.safety-specific',
        effectId: null,
        issueId: 'issue.test.same-safety-error',
        specificityPriority: 30,
        label: 'Specific duplicate safety consequence',
        component: 'safety',
        predicate: { type: 'dispositionSelected', dispositionId: matchingDisposition },
        pointsIfTrue: -120,
        pointsIfFalse: 0,
        classificationIfTrue: 'harmful',
        classificationIfFalse: 'safe',
        explanationIfTrue: 'Test-only specific safety consequence.',
        explanationIfFalse: 'Test-only specific safety condition did not match.',
        safetyErrorIfTrue: 'Specific retained safety error.',
        carePointCapIfTrue: 60,
        review,
      },
    );

    const run = play(
      duplicateSafetyBlueprint,
      databasePlan.actionIds,
      databasePlan.selections,
      startingClinic,
      'duplicate-safety-consequence',
      catalogs,
      databasePlan.diagnosisSelections,
    );

    expect(
      run.receipt.pointReport.ruleTrace.find(
        (trace) => trace.ruleId === 'rule.test.safety-general',
      ),
    ).toMatchObject({
      points: 0,
      pointsBeforeCombination: -40,
      combinationStatus: 'deduplicated',
      resolvedByRuleId: 'rule.test.safety-specific',
    });
    expect(
      run.receipt.pointReport.ruleTrace.find(
        (trace) => trace.ruleId === 'rule.test.safety-specific',
      ),
    ).toMatchObject({
      points: -120,
      combinationStatus: 'applied',
    });
    expect(run.receipt.pointReport.safetyErrors).toContain('Specific retained safety error.');
    expect(run.receipt.pointReport.safetyErrors).not.toContain('General duplicate safety error.');
    expect(run.receipt.pointReport.carePointCapApplied).toBe(60);
    expect(run.receipt.pointReport.carePointsEarned).toBe(60);
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

  it('delegates only selected routine intake actions at a discounted nonzero cost', () => {
    const funded = { ...startingClinic, clinicPoints: 2_000, lifetimePointsEarned: 1_000 };
    const hired = requireCompleted(
      purchaseUpgrade(funded, 'upgrade.staff.intake-assistant', catalogs),
    );
    expect(hired.staffConfigurations).toEqual([
      {
        staffUpgradeId: 'upgrade.staff.intake-assistant',
        automaticInformationActionIds: [],
      },
    ]);
    const configured = requireCompleted(
      configureStaffAutomation(
        hired,
        'upgrade.staff.intake-assistant',
        ['info.history.medication-reconciliation', 'info.history.depressive-symptoms'],
        catalogs,
      ),
    );
    expect(
      requireCompleted(
        resolveServiceFulfillment(
          'service.history.standard',
          configured,
          configured.activeLocationId,
          catalogs.services,
          catalogs.locations,
        ),
      ).method.id,
    ).toBe('fulfillment.office.standard-history');
    expect(
      requireCompleted(
        resolveServiceFulfillment(
          'service.history.standard',
          configured,
          configured.activeLocationId,
          catalogs.services,
          catalogs.locations,
          { informationActionId: 'info.history.depressive-symptoms' },
        ),
      ).method.id,
    ).toBe('fulfillment.staff.standard-checklist');
    expect(
      requireCompleted(
        resolveServiceFulfillment(
          'service.history.standard',
          configured,
          configured.activeLocationId,
          catalogs.services,
          catalogs.locations,
          { informationActionId: 'info.history.sleep' },
        ),
      ).method.id,
    ).toBe('fulfillment.office.standard-history');

    const instance = instantiateCase(prototypeCaseBlueprint, 'staff-intake', catalogs);
    const automatic = requireCompleted(
      startEncounterWithAutomaticIntake(
        instance,
        configured,
        configured.activeLocationId,
        catalogs,
      ),
    );
    expect(automatic.purchases.map((purchase) => purchase.actionId)).toEqual([
      'info.history.medication-reconciliation',
      'info.history.depressive-symptoms',
    ]);
    expect(automatic.purchases.map((purchase) => purchase.initiatedBy)).toEqual([
      'automatic_intake',
      'automatic_intake',
    ]);
    expect(automatic.purchases.map((purchase) => purchase.operatingCost)).toEqual([18, 12]);
    expect(automatic.purchases.map((purchase) => purchase.upgradeSavings)).toEqual([12, 8]);
    expect(automatic.expenseTotal).toBe(30);

    const manualClinic = { ...configured, staffConfigurations: [] };
    let manual = startEncounter(instance, manualClinic, manualClinic.activeLocationId);
    manual = requireCompleted(
      purchaseInformationAction(manual, 'info.history.medication-reconciliation', catalogs),
    );
    manual = requireCompleted(
      purchaseInformationAction(manual, 'info.history.depressive-symptoms', catalogs),
    );
    const automaticComplete = requireCompleted(
      completeEncounter(
        requireCompleted(updateTreatmentSelections(automatic, databasePlan.selections, catalogs)),
        catalogs,
      ),
    );
    const manualComplete = requireCompleted(
      completeEncounter(
        requireCompleted(updateTreatmentSelections(manual, databasePlan.selections, catalogs)),
        catalogs,
      ),
    );
    expect(automaticComplete.receipt.pointReport.carePointsEarned).toBe(
      manualComplete.receipt.pointReport.carePointsEarned,
    );
    expect(automaticComplete.receipt.pointReport.ruleTrace).toEqual(
      manualComplete.receipt.pointReport.ruleTrace,
    );
    expect(automaticComplete.receipt.pointReport.treatmentGrade).toBe(
      manualComplete.receipt.pointReport.treatmentGrade,
    );
    expect(automaticComplete.receipt.settlement.operatingExpenses).toBe(30);
    expect(manualComplete.receipt.settlement.operatingExpenses).toBe(50);
    expect(
      automaticComplete.receipt.items
        .filter(
          (item) =>
            item.kind === 'information' && item.fulfillmentMethod.startsWith('Automatic intake'),
        )
        .map((item) => item.upgradeSavings),
    ).toEqual([12, 8]);

    const replayed = requireCompleted(
      replayEncounter(instance, configured, automaticComplete.state.events, catalogs),
    );
    expect(replayed.purchases).toEqual(automaticComplete.state.purchases);
  });

  it('rejects over-broad or unavailable staff automation choices', () => {
    const hired = requireCompleted(
      purchaseUpgrade(
        { ...startingClinic, clinicPoints: 2_000, lifetimePointsEarned: 1_000 },
        'upgrade.staff.intake-assistant',
        catalogs,
      ),
    );
    expect(
      configureStaffAutomation(
        hired,
        'upgrade.staff.intake-assistant',
        [
          'info.history.medication-reconciliation',
          'info.history.adherence',
          'info.history.depressive-symptoms',
          'info.history.anxiety-symptoms',
        ],
        catalogs,
      ),
    ).toMatchObject({ ok: false, error: { code: 'STAFF_CONFIGURATION_INVALID' } });
    expect(
      configureStaffAutomation(
        startingClinic,
        'upgrade.staff.intake-assistant',
        ['info.history.adherence'],
        catalogs,
      ),
    ).toMatchObject({ ok: false, error: { code: 'STAFF_NOT_OWNED' } });
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

  it('uses lifetime points as facility eligibility and still requires a separate purchase', () => {
    const belowThreshold = {
      ...startingClinic,
      clinicPoints: 10_000,
      lifetimePointsEarned: 2_499,
    };
    expect(
      getUpgradeOffer(belowThreshold, 'upgrade.facility.outpatient-clinic', catalogs),
    ).toMatchObject({
      ok: true,
      value: {
        canPurchase: false,
        blockers: expect.arrayContaining([expect.objectContaining({ code: 'lifetime_points' })]),
      },
    });

    const eligible = { ...belowThreshold, lifetimePointsEarned: 2_500 };
    const moved = requireCompleted(
      purchaseUpgrade(eligible, 'upgrade.facility.outpatient-clinic', catalogs),
    );
    expect(moved).toMatchObject({
      facilityId: 'facility.outpatient-clinic',
      facilityTier: 'outpatient_clinic',
      activeLocationId: 'location.outpatient-clinic.outpatient',
      clinicPoints: 8_200,
      lifetimePointsEarned: 2_500,
    });
    expect(getPatientSlotCount(moved, 'standard', catalogs)).toBe(2);
  });

  it('preserves earlier equipment when the clinic moves to a higher tier', () => {
    const funded = { ...startingClinic, clinicPoints: 10_000, lifetimePointsEarned: 2_500 };
    const equipped = requireCompleted(purchaseUpgrade(funded, 'upgrade.equipment.ecg', catalogs));
    const moved = requireCompleted(
      purchaseUpgrade(equipped, 'upgrade.facility.outpatient-clinic', catalogs),
    );
    expect(moved.ownedUpgradeIds).toEqual(
      expect.arrayContaining(['upgrade.equipment.ecg', 'upgrade.facility.outpatient-clinic']),
    );
    expect(moved.capabilities).toContain('equipment.ecg');
    expect(
      requireCompleted(
        resolveServiceFulfillment(
          'service.diagnostic.ecg',
          moved,
          moved.activeLocationId,
          catalogs.services,
          catalogs.locations,
        ),
      ).method.id,
    ).toBe('fulfillment.in-house.ecg');
  });

  it('applies diminishing decor returns under the configured cap', () => {
    const funded = { ...startingClinic, clinicPoints: 10_000, lifetimePointsEarned: 2_500 };
    const withPlant = requireCompleted(purchaseUpgrade(funded, 'decor.plant.pothos', catalogs));
    expect(withPlant.satisfaction).toBe(6);
    expect(withPlant.satisfactionMultiplier).toBe(1.035);

    const moved = requireCompleted(
      purchaseUpgrade(withPlant, 'upgrade.facility.outpatient-clinic', catalogs),
    );
    const withArt = requireCompleted(purchaseUpgrade(moved, 'decor.art.abstract-print', catalogs));
    expect(withArt.satisfaction).toBe(16);
    expect(withArt.satisfactionMultiplier).toBe(1.067);
    expect(withArt.satisfactionMultiplier - withPlant.satisfactionMultiplier).toBeLessThan(
      withPlant.satisfactionMultiplier - 1,
    );
    expect(
      calculateSatisfactionState(1_000_000, catalogs.decor.satisfaction).multiplier,
    ).toBeLessThanOrEqual(catalogs.decor.satisfaction.multiplierCap);
  });

  it('lets ambience increase positive settlement without changing care or rescuing unsafe play', () => {
    const decorated = requireCompleted(
      purchaseUpgrade({ ...startingClinic, clinicPoints: 1_000 }, 'decor.plant.pothos', catalogs),
    );
    const baseline = playStarter(databasePlan.actionIds);
    const ambience = playStarter(databasePlan.actionIds, databasePlan.selections, decorated);
    expect(ambience.receipt.pointReport).toEqual(baseline.receipt.pointReport);
    expect(ambience.receipt.settlement.grossPayout).toBeGreaterThan(
      baseline.receipt.settlement.grossPayout,
    );

    const unsafeSolution = prototypeCaseBlueprint.referenceSolutions.find(
      (solution) => solution.kind === 'unsafe',
    )!;
    const unsafe = playStarter(unsafeSolution.actionIds, unsafeSolution.selections, decorated);
    expect(unsafe.receipt.settlement.netClinicPointsEarned).toBe(0);
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

  it('refreshes only a legacy queued safety-planning snapshot from the same blueprint and seed', () => {
    const initial = ensurePatientQueues(
      emptyPatientQueueState(),
      startingClinic,
      endgameClinic,
      pools,
      catalogs,
    );
    const legacy = structuredClone(initial);
    const legacySlot = legacy.standardSlots[0]!;
    legacySlot.caseInstance.patientRecord.reportedSafetyPlanningAbility = 'unassessed';
    legacySlot.caseInstance.contentVersion = '4.1.0';
    const legacyAction = legacySlot.caseInstance.informationActions.find(
      (action) => action.actionId === 'info.history.existing-safety-plan',
    )!;
    legacyAction.result.findings = [
      {
        id: 'finding.legacy.existing-plan',
        label: 'Existing written safety plan',
        outcome: 'absent',
        origin: 'authored',
      },
    ];
    legacyAction.result.factsRevealed = ['fact.legacy-existing-safety-plan'];

    const refreshed = ensurePatientQueues(legacy, startingClinic, endgameClinic, pools, catalogs);
    const refreshedSlot = refreshed.standardSlots[0]!;
    expect(refreshedSlot.id).toBe(legacySlot.id);
    expect(refreshedSlot.caseInstance.seed).toBe(legacySlot.caseInstance.seed);
    expect(refreshedSlot.caseInstance.opening).toEqual(legacySlot.caseInstance.opening);
    expect(refreshedSlot.caseInstance.contentVersion).toBe(prototypeCaseBlueprint.contentVersion);
    expect(refreshedSlot.caseInstance.patientRecord.reportedSafetyPlanningAbility).toBe(
      'reports_able',
    );
    expect(
      refreshedSlot.caseInstance.informationActions
        .find((action) => action.actionId === 'info.history.existing-safety-plan')
        ?.result.findings.map((finding) => finding.label),
    ).toEqual(['Feels able to participate in safety planning']);
  });

  it('keeps the waiting patient while relocating the slot after a facility move', () => {
    const initial = ensurePatientQueues(
      emptyPatientQueueState(),
      startingClinic,
      endgameClinic,
      pools,
      catalogs,
    );
    const moved = requireCompleted(
      purchaseUpgrade(
        { ...startingClinic, clinicPoints: 5_000, lifetimePointsEarned: 2_500 },
        'upgrade.facility.outpatient-clinic',
        catalogs,
      ),
    );
    const afterMove = ensurePatientQueues(initial, moved, endgameClinic, pools, catalogs);
    expect(afterMove.standardSlots).toHaveLength(2);
    expect(afterMove.standardSlots[0]!.caseInstance.id).toBe(
      initial.standardSlots[0]!.caseInstance.id,
    );
    expect(afterMove.standardSlots[0]!.locationId).toBe('location.outpatient-clinic.outpatient');
  });

  it('classifies approved patients into explicit internal progression pools', () => {
    expect(approvedCaseBlueprints.map((blueprint) => blueprint.metadata.patientPool)).toEqual([
      'starter',
      'transitional',
    ]);
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

  it('generates one persisted Developer patient only from an exact authored complexity budget', () => {
    const initial = ensurePatientQueues(
      emptyPatientQueueState(),
      startingClinic,
      endgameClinic,
      pools,
      catalogs,
    );
    const selected = advancedPrototypeCaseBlueprint;
    const budget = selected.patientRecord.complexityProfile.additionalFeatureBudget;
    const first = generateDeveloperPatientSlot(
      initial,
      selected.id,
      budget,
      endgameClinic,
      pools.developer,
      catalogs,
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.slot).toMatchObject({
      id: 'slot.developer.patient-maker',
      mode: 'developer',
      caseInstance: {
        blueprintId: selected.id,
        patientRecord: {
          complexityProfile: {
            additionalFeatureBudget: budget,
          },
        },
      },
    });
    expect(first.value.patientQueues.developerSlots[0]).toEqual(first.value.slot);

    const rerun = generateDeveloperPatientSlot(
      first.value.patientQueues,
      selected.id,
      budget,
      endgameClinic,
      pools.developer,
      catalogs,
    );
    expect(rerun.ok).toBe(true);
    if (!rerun.ok) return;
    expect(rerun.value.slot.caseInstance.id).not.toBe(first.value.slot.caseInstance.id);
    expect(
      rerun.value.patientQueues.developerSlots.filter(
        (slot) => slot.caseInstance.blueprintId === selected.id,
      ),
    ).toHaveLength(1);

    expect(
      generateDeveloperPatientSlot(
        initial,
        selected.id,
        budget + 1,
        endgameClinic,
        pools.developer,
        catalogs,
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'COMPLEXITY_BUDGET_MISMATCH' },
    });
    expect(
      generateDeveloperPatientSlot(
        initial,
        'case.not-real',
        0,
        endgameClinic,
        pools.developer,
        catalogs,
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'UNKNOWN_CASE' },
    });
  });
});
