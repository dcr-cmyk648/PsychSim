import {
  GeneratedEncounterDecisionSelectionSchema,
  type DecisionActionHorizon,
  type DiagnosisSelectionHorizon,
  type GeneratedEncounterDecisionSelection,
  type MedicationRegimenEntryV2,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  collectSelectedDecisionActionTargets,
  deriveGeneratedEncounterDecisionSelection,
  evaluateSelectedDecisionActionPredicate,
  evaluateTriggeredInformationPrerequisite,
  selectedDecisionActionTargetMatches,
  validateGeneratedEncounterDecisionSelectionAgainstHorizon,
} from './decision-selection';

const regimenEntry = (id: string, medicationIdentityId: string): MedicationRegimenEntryV2 => ({
  recordVersion: 2,
  id,
  medicationIdentityId,
  clinicalRole: 'psychiatric',
  status: 'active',
  adherence: 'consistent',
  prescribedForDiagnosisId: 'diagnosis.test',
  source: 'prescriber_record',
  knownAtOpening: false,
  impactClassification: 'fit_relevant',
});

const currentRegimen = [
  regimenEntry('regimen.test.first', 'medication.test.duplicate'),
  regimenEntry('regimen.test.second', 'medication.test.duplicate'),
];

const decisionActionHorizon: DecisionActionHorizon = {
  schemaVersion: 1,
  id: 'decision-action-horizon.test.decision-selection',
  informationActionIds: ['info.history.test.mania', 'info.history.test.reactions'],
  startMedicationIds: ['medication.test.start'],
  regimenEntryOperations: currentRegimen.map((entry) => ({
    regimenEntryId: entry.id,
    medicationIdentityId: entry.medicationIdentityId,
    operations: ['continue', 'stop'],
  })),
  interventionIds: ['intervention.test.cbt'],
  dispositionIds: ['disposition.test.outpatient'],
};

const diagnosisSelectionHorizon: DiagnosisSelectionHorizon = {
  schemaVersion: 1,
  id: 'diagnosis-selection-horizon.test.decision-selection',
  allowEmptySelection: true,
  options: [
    {
      id: 'diagnosis-option.test.mdd',
      diagnosisDefinitionId: 'diagnosis.test.mdd',
      diagnosisDefinitionContentVersion: '1.0.0',
    },
  ],
};

const emptyTreatment = {
  schemaVersion: 1 as const,
  selectionVersion: 2 as const,
  medicationTransition: {
    selectionVersion: 2 as const,
    startMedicationIds: [] as string[],
    adjustments: [] as Array<{
      selectionVersion: 2;
      regimenEntryId: string;
      operation: 'continue' | 'increase' | 'reduce_or_limit' | 'taper' | 'stop';
    }>,
  },
  interventionIds: [] as string[],
  dispositionId: null as string | null,
};

const decision = (
  overrides: Partial<GeneratedEncounterDecisionSelection> = {},
): GeneratedEncounterDecisionSelection =>
  GeneratedEncounterDecisionSelectionSchema.parse({
    schemaVersion: 1,
    selectionVersion: 1,
    informationActionIds: [],
    diagnosisSelections: [],
    treatmentSelection: emptyTreatment,
    ...overrides,
  });

const validate = (selection: unknown) =>
  validateGeneratedEncounterDecisionSelectionAgainstHorizon(selection, {
    decisionActionHorizon,
    diagnosisSelectionHorizon,
    currentRegimen,
  });

describe('generated encounter decision selection', () => {
  it('derives one deterministic presence entry from replayed purchases without accepting duplicates', () => {
    const derived = deriveGeneratedEncounterDecisionSelection({
      purchases: [
        { informationActionId: 'info.history.test.reactions' },
        { informationActionId: 'info.history.test.mania' },
        { informationActionId: 'info.history.test.reactions' },
      ],
      diagnosisSelections: [],
      treatmentSelection: emptyTreatment,
    });

    expect(derived).toMatchObject({
      ok: true,
      value: {
        informationActionIds: ['info.history.test.reactions', 'info.history.test.mania'],
      },
    });
    expect(
      GeneratedEncounterDecisionSelectionSchema.safeParse({
        ...decision(),
        informationActionIds: ['info.history.test.mania', 'info.history.test.mania'],
      }).success,
    ).toBe(false);
  });

  it('accepts an empty answer and rejects each exact out-of-horizon selection class', () => {
    expect(validate(decision()).ok).toBe(true);
    expect(
      validate(decision({ informationActionIds: ['info.history.test.unavailable'] })),
    ).toMatchObject({
      ok: false,
      error: { code: 'INFORMATION_ACTION_OUTSIDE_HORIZON' },
    });
    expect(
      validate(
        decision({
          diagnosisSelections: [
            {
              diagnosisId: 'diagnosis.test.unavailable',
              severityId: null,
              specifierIds: [],
            },
          ],
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'DIAGNOSIS_OUTSIDE_HORIZON' },
    });
    expect(
      validate(
        decision({
          treatmentSelection: {
            ...emptyTreatment,
            medicationTransition: {
              ...emptyTreatment.medicationTransition,
              startMedicationIds: ['medication.test.unavailable'],
            },
          },
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'TREATMENT_OUTSIDE_HORIZON' },
    });
  });

  it('distinguishes a selected investigation from one that is merely available', () => {
    const selected = decision({
      informationActionIds: ['info.history.test.mania'],
    });
    expect(
      evaluateSelectedDecisionActionPredicate({
        predicate: {
          match: 'all',
          targets: [
            {
              kind: 'information_action',
              informationActionId: 'info.history.test.mania',
            },
          ],
        },
        selection: selected,
        currentRegimen,
      }),
    ).toBe(true);
    expect(
      evaluateSelectedDecisionActionPredicate({
        predicate: {
          match: 'any',
          targets: [
            {
              kind: 'information_action',
              informationActionId: 'info.history.test.reactions',
            },
          ],
        },
        selection: selected,
        currentRegimen,
      }),
    ).toBe(false);
  });

  it('evaluates trigger and information fulfillment as three distinct point-free outcomes', () => {
    const prerequisite = {
      schemaVersion: 1 as const,
      policyScope: {
        policyRef: {
          id: 'decision-policy.test.decision-selection',
          contentVersion: '1.0.0',
        },
        focusedDecisionId: 'decision.test.decision-selection',
      },
      triggerWhen: {
        match: 'any' as const,
        targets: [{ kind: 'any_medication_start' as const }],
      },
      fulfillmentWhen: {
        match: 'any' as const,
        targets: [
          {
            kind: 'information_action' as const,
            informationActionId: 'info.history.test.reactions',
          },
        ],
      },
    };
    const evaluate = (selection: GeneratedEncounterDecisionSelection) =>
      evaluateTriggeredInformationPrerequisite({
        prerequisite,
        selection,
        currentRegimen,
      });

    expect(evaluate(decision())).toMatchObject({
      status: 'not_triggered',
      triggerSelected: false,
      fulfillmentSelected: false,
    });
    expect(
      evaluate(
        decision({
          informationActionIds: ['info.history.test.reactions'],
        }),
      ),
    ).toMatchObject({
      status: 'not_triggered',
      triggerSelected: false,
      fulfillmentSelected: true,
    });
    expect(
      evaluate(
        decision({
          treatmentSelection: {
            ...emptyTreatment,
            medicationTransition: {
              ...emptyTreatment.medicationTransition,
              startMedicationIds: ['medication.test.start'],
            },
          },
        }),
      ),
    ).toMatchObject({
      status: 'omitted',
      triggerSelected: true,
      fulfillmentSelected: false,
    });
    expect(
      evaluate(
        decision({
          informationActionIds: ['info.history.test.reactions'],
          treatmentSelection: {
            ...emptyTreatment,
            medicationTransition: {
              ...emptyTreatment.medicationTransition,
              startMedicationIds: ['medication.test.start'],
            },
          },
        }),
      ),
    ).toMatchObject({
      status: 'fulfilled',
      triggerSelected: true,
      fulfillmentSelected: true,
    });
  });

  it('keeps duplicate medications independently targetable while supporting identity-level predicates', () => {
    const selected = decision({
      treatmentSelection: {
        ...emptyTreatment,
        medicationTransition: {
          ...emptyTreatment.medicationTransition,
          adjustments: [
            {
              selectionVersion: 2,
              regimenEntryId: 'regimen.test.second',
              operation: 'stop',
            },
          ],
        },
      },
    });

    expect(
      selectedDecisionActionTargetMatches(
        {
          kind: 'regimen_entry_operation',
          regimenEntryId: 'regimen.test.first',
          operation: 'stop',
        },
        selected,
        currentRegimen,
      ),
    ).toBe(false);
    expect(
      selectedDecisionActionTargetMatches(
        {
          kind: 'regimen_entry_operation',
          regimenEntryId: 'regimen.test.second',
          operation: 'stop',
        },
        selected,
        currentRegimen,
      ),
    ).toBe(true);
    expect(
      selectedDecisionActionTargetMatches(
        {
          kind: 'regimen_medication_operation',
          medicationIdentityId: 'medication.test.duplicate',
          operation: 'stop',
        },
        selected,
        currentRegimen,
      ),
    ).toBe(true);
    expect(collectSelectedDecisionActionTargets(selected, currentRegimen)).toEqual(
      expect.arrayContaining([
        {
          kind: 'regimen_entry_operation',
          regimenEntryId: 'regimen.test.second',
          operation: 'stop',
        },
        {
          kind: 'regimen_medication_operation',
          medicationIdentityId: 'medication.test.duplicate',
          operation: 'stop',
        },
      ]),
    );
  });
});
