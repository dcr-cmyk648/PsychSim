import {
  DecisionActionHorizonSchema,
  DecisionActionPredicateSchema,
  DecisionTriggeredInformationPrerequisiteSchema,
  DiagnosisSelectionHorizonSchema,
  GeneratedEncounterDecisionSelectionSchema,
  GeneratedEncounterReplaySnapshotSchema,
  MedicationRegimenEntryV2Schema,
  type DecisionActionPredicate,
  type DecisionActionTarget,
  type DecisionActionHorizon,
  type DecisionTriggeredInformationPrerequisite,
  type DiagnosisSelectionHorizon,
  type GeneratedEncounterDecisionSelection,
  type GeneratedEncounterTreatmentSelection,
  type MedicationRegimenEntryV2,
  type PlayerDiagnosisSelections,
} from '@psychsim/schemas';

export type GeneratedDecisionSelectionErrorCode =
  | 'INVALID_SELECTION'
  | 'INVALID_SNAPSHOT'
  | 'INFORMATION_ACTION_OUTSIDE_HORIZON'
  | 'DIAGNOSIS_OUTSIDE_HORIZON'
  | 'TREATMENT_OUTSIDE_HORIZON';

export type GeneratedDecisionSelectionResult =
  | { readonly ok: true; readonly value: GeneratedEncounterDecisionSelection }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: GeneratedDecisionSelectionErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export interface GeneratedDecisionSelectionHorizonContext {
  readonly decisionActionHorizon: DecisionActionHorizon;
  readonly diagnosisSelectionHorizon: DiagnosisSelectionHorizon;
  readonly currentRegimen: readonly MedicationRegimenEntryV2[];
}

const compareStrings = (left: string, right: string): number =>
  left === right ? 0 : left < right ? -1 : 1;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueInOrder = (values: readonly string[]): string[] => {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

const fail = (
  code: GeneratedDecisionSelectionErrorCode,
  message: string,
  contentIds: readonly string[] = [],
): GeneratedDecisionSelectionResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: [...new Set(contentIds)].sort(compareStrings),
  },
});

export const deriveGeneratedEncounterDecisionSelection = (input: {
  readonly purchases: readonly { readonly informationActionId: string }[];
  readonly diagnosisSelections: PlayerDiagnosisSelections;
  readonly treatmentSelection: GeneratedEncounterTreatmentSelection;
}): GeneratedDecisionSelectionResult => {
  const parsed = GeneratedEncounterDecisionSelectionSchema.safeParse({
    schemaVersion: 1,
    selectionVersion: 1,
    informationActionIds: uniqueInOrder(
      input.purchases.map((purchase) => purchase.informationActionId),
    ),
    diagnosisSelections: input.diagnosisSelections,
    treatmentSelection: input.treatmentSelection,
  });
  return parsed.success
    ? { ok: true, value: parsed.data }
    : fail('INVALID_SELECTION', issuesText(parsed.error.issues));
};

const treatmentSelectionError = (
  selection: GeneratedEncounterTreatmentSelection,
  context: GeneratedDecisionSelectionHorizonContext,
): { readonly message: string; readonly contentIds: readonly string[] } | null => {
  const horizon = context.decisionActionHorizon;
  const availableStarts = new Set(horizon.startMedicationIds);
  const unavailableStart = selection.medicationTransition.startMedicationIds.find(
    (medicationId) => !availableStarts.has(medicationId),
  );
  if (unavailableStart) {
    return {
      message: `Medication start ${unavailableStart} is outside the frozen action horizon.`,
      contentIds: [unavailableStart],
    };
  }
  const patientRegimen = new Map(context.currentRegimen.map((entry) => [entry.id, entry]));
  const regimenHorizon = new Map(
    horizon.regimenEntryOperations.map((entry) => [entry.regimenEntryId, entry]),
  );
  for (const adjustment of selection.medicationTransition.adjustments) {
    const patientEntry = patientRegimen.get(adjustment.regimenEntryId);
    const available = regimenHorizon.get(adjustment.regimenEntryId);
    if (
      patientEntry === undefined ||
      available === undefined ||
      patientEntry.medicationIdentityId !== available.medicationIdentityId ||
      !available.operations.includes(adjustment.operation)
    ) {
      return {
        message: `Regimen operation ${adjustment.regimenEntryId}:${adjustment.operation} is not available for this exact patient entry.`,
        contentIds: [adjustment.regimenEntryId],
      };
    }
  }
  const unavailableIntervention = selection.interventionIds.find(
    (interventionId) => !horizon.interventionIds.includes(interventionId),
  );
  if (unavailableIntervention) {
    return {
      message: `Intervention ${unavailableIntervention} is outside the frozen action horizon.`,
      contentIds: [unavailableIntervention],
    };
  }
  if (
    selection.dispositionId !== null &&
    !horizon.dispositionIds.includes(selection.dispositionId)
  ) {
    return {
      message: `Disposition ${selection.dispositionId} is outside the frozen action horizon.`,
      contentIds: [selection.dispositionId],
    };
  }
  return null;
};

export const validateGeneratedEncounterDecisionSelectionAgainstHorizon = (
  selectionInput: unknown,
  contextInput: GeneratedDecisionSelectionHorizonContext,
): GeneratedDecisionSelectionResult => {
  const selection = GeneratedEncounterDecisionSelectionSchema.safeParse(selectionInput);
  if (!selection.success) {
    return fail('INVALID_SELECTION', issuesText(selection.error.issues));
  }
  const decisionActionHorizon = DecisionActionHorizonSchema.safeParse(
    contextInput.decisionActionHorizon,
  );
  const diagnosisSelectionHorizon = DiagnosisSelectionHorizonSchema.safeParse(
    contextInput.diagnosisSelectionHorizon,
  );
  const currentRegimen = MedicationRegimenEntryV2Schema.array().safeParse(
    contextInput.currentRegimen,
  );
  if (
    !decisionActionHorizon.success ||
    !diagnosisSelectionHorizon.success ||
    !currentRegimen.success
  ) {
    return fail(
      'INVALID_SNAPSHOT',
      [
        ...(!decisionActionHorizon.success
          ? decisionActionHorizon.error.issues.map(
              (issue) =>
                `decisionActionHorizon.${issue.path.join('.') || '<root>'}: ${issue.message}`,
            )
          : []),
        ...(!diagnosisSelectionHorizon.success
          ? diagnosisSelectionHorizon.error.issues.map(
              (issue) =>
                `diagnosisSelectionHorizon.${issue.path.join('.') || '<root>'}: ${issue.message}`,
            )
          : []),
        ...(!currentRegimen.success
          ? currentRegimen.error.issues.map(
              (issue) => `currentRegimen.${issue.path.join('.') || '<root>'}: ${issue.message}`,
            )
          : []),
      ].join('; '),
    );
  }
  const context: GeneratedDecisionSelectionHorizonContext = {
    decisionActionHorizon: decisionActionHorizon.data,
    diagnosisSelectionHorizon: diagnosisSelectionHorizon.data,
    currentRegimen: currentRegimen.data,
  };
  const informationHorizon = new Set(context.decisionActionHorizon.informationActionIds);
  const unavailableInformationAction = selection.data.informationActionIds.find(
    (actionId) => !informationHorizon.has(actionId),
  );
  if (unavailableInformationAction) {
    return fail(
      'INFORMATION_ACTION_OUTSIDE_HORIZON',
      `Information action ${unavailableInformationAction} is outside the frozen action horizon.`,
      [unavailableInformationAction],
    );
  }
  const diagnosisHorizon = new Set(
    context.diagnosisSelectionHorizon.options.map((option) => option.diagnosisDefinitionId),
  );
  const unavailableDiagnosis = selection.data.diagnosisSelections.find(
    (diagnosis) => !diagnosisHorizon.has(diagnosis.diagnosisId),
  );
  if (unavailableDiagnosis) {
    return fail(
      'DIAGNOSIS_OUTSIDE_HORIZON',
      `Diagnosis ${unavailableDiagnosis.diagnosisId} is outside the frozen diagnosis-selection horizon.`,
      [unavailableDiagnosis.diagnosisId],
    );
  }
  const treatmentError = treatmentSelectionError(selection.data.treatmentSelection, context);
  return treatmentError === null
    ? { ok: true, value: selection.data }
    : fail('TREATMENT_OUTSIDE_HORIZON', treatmentError.message, treatmentError.contentIds);
};

export const validateGeneratedEncounterDecisionSelectionAgainstSnapshot = (
  selectionInput: unknown,
  snapshotInput: unknown,
): GeneratedDecisionSelectionResult => {
  const snapshot = GeneratedEncounterReplaySnapshotSchema.safeParse(snapshotInput);
  if (!snapshot.success) {
    return fail('INVALID_SNAPSHOT', issuesText(snapshot.error.issues));
  }
  return validateGeneratedEncounterDecisionSelectionAgainstHorizon(selectionInput, {
    decisionActionHorizon: snapshot.data.encounterInstance.decisionActionHorizon,
    diagnosisSelectionHorizon: snapshot.data.encounterInstance.diagnosisSelectionHorizon,
    currentRegimen: snapshot.data.patientInstance.patientState.medicationRegimenEntries,
  });
};

export const selectedDecisionActionTargetMatches = (
  target: DecisionActionTarget,
  selection: GeneratedEncounterDecisionSelection,
  currentRegimen: readonly MedicationRegimenEntryV2[],
): boolean => {
  const treatment = selection.treatmentSelection;
  const transition = treatment.medicationTransition;
  if (target.kind === 'information_action') {
    return selection.informationActionIds.includes(target.informationActionId);
  }
  if (target.kind === 'any_medication_start') {
    return transition.startMedicationIds.length > 0;
  }
  if (target.kind === 'medication_start') {
    return transition.startMedicationIds.includes(target.medicationIdentityId);
  }
  if (target.kind === 'any_regimen_operation') {
    return transition.adjustments.some((entry) => entry.operation === target.operation);
  }
  if (target.kind === 'regimen_entry_operation') {
    return transition.adjustments.some(
      (entry) =>
        entry.regimenEntryId === target.regimenEntryId && entry.operation === target.operation,
    );
  }
  if (target.kind === 'regimen_medication_operation') {
    const matchingEntryIds = new Set(
      currentRegimen
        .filter((entry) => entry.medicationIdentityId === target.medicationIdentityId)
        .map((entry) => entry.id),
    );
    return transition.adjustments.some(
      (entry) => matchingEntryIds.has(entry.regimenEntryId) && entry.operation === target.operation,
    );
  }
  if (target.kind === 'intervention') {
    return treatment.interventionIds.includes(target.interventionId);
  }
  return treatment.dispositionId === target.dispositionId;
};

export const evaluateSelectedDecisionActionPredicate = (input: {
  readonly predicate: DecisionActionPredicate;
  readonly selection: GeneratedEncounterDecisionSelection;
  readonly currentRegimen: readonly MedicationRegimenEntryV2[];
}): boolean => {
  const predicate = DecisionActionPredicateSchema.parse(input.predicate);
  const selection = GeneratedEncounterDecisionSelectionSchema.parse(input.selection);
  const matches = predicate.targets.map((target) =>
    selectedDecisionActionTargetMatches(target, selection, input.currentRegimen),
  );
  return predicate.match === 'all' ? matches.every(Boolean) : matches.some(Boolean);
};

export interface TriggeredInformationPrerequisiteEvaluation {
  readonly prerequisite: DecisionTriggeredInformationPrerequisite;
  readonly status: 'not_triggered' | 'fulfilled' | 'omitted';
  readonly triggerSelected: boolean;
  readonly fulfillmentSelected: boolean;
}

export const evaluateTriggeredInformationPrerequisite = (input: {
  readonly prerequisite: DecisionTriggeredInformationPrerequisite;
  readonly selection: GeneratedEncounterDecisionSelection;
  readonly currentRegimen: readonly MedicationRegimenEntryV2[];
}): TriggeredInformationPrerequisiteEvaluation => {
  const prerequisite = DecisionTriggeredInformationPrerequisiteSchema.parse(input.prerequisite);
  const triggerSelected = evaluateSelectedDecisionActionPredicate({
    predicate: prerequisite.triggerWhen,
    selection: input.selection,
    currentRegimen: input.currentRegimen,
  });
  const fulfillmentSelected = evaluateSelectedDecisionActionPredicate({
    predicate: prerequisite.fulfillmentWhen,
    selection: input.selection,
    currentRegimen: input.currentRegimen,
  });
  return {
    prerequisite,
    status: !triggerSelected ? 'not_triggered' : fulfillmentSelected ? 'fulfilled' : 'omitted',
    triggerSelected,
    fulfillmentSelected,
  };
};

export const collectSelectedDecisionActionTargets = (
  selectionInput: GeneratedEncounterDecisionSelection,
  currentRegimen: readonly MedicationRegimenEntryV2[],
): DecisionActionTarget[] => {
  const selection = GeneratedEncounterDecisionSelectionSchema.parse(selectionInput);
  const regimenById = new Map(currentRegimen.map((entry) => [entry.id, entry]));
  const targets: DecisionActionTarget[] = [
    ...selection.informationActionIds.map(
      (informationActionId): DecisionActionTarget => ({
        kind: 'information_action',
        informationActionId,
      }),
    ),
    ...selection.treatmentSelection.medicationTransition.startMedicationIds.map(
      (medicationIdentityId): DecisionActionTarget => ({
        kind: 'medication_start',
        medicationIdentityId,
      }),
    ),
    ...selection.treatmentSelection.medicationTransition.adjustments.flatMap(
      (adjustment): DecisionActionTarget[] => {
        const entry = regimenById.get(adjustment.regimenEntryId);
        return [
          {
            kind: 'regimen_entry_operation',
            regimenEntryId: adjustment.regimenEntryId,
            operation: adjustment.operation,
          },
          ...(entry
            ? [
                {
                  kind: 'regimen_medication_operation' as const,
                  medicationIdentityId: entry.medicationIdentityId,
                  operation: adjustment.operation,
                },
              ]
            : []),
        ];
      },
    ),
    ...selection.treatmentSelection.interventionIds.map(
      (interventionId): DecisionActionTarget => ({ kind: 'intervention', interventionId }),
    ),
    ...(selection.treatmentSelection.dispositionId === null
      ? []
      : [
          {
            kind: 'disposition' as const,
            dispositionId: selection.treatmentSelection.dispositionId,
          },
        ]),
  ];
  const seen = new Set<string>();
  return targets.filter((target) => {
    const key = JSON.stringify(target);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
