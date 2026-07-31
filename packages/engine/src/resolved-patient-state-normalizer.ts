import { ResolvedPatientStateSchema, type ResolvedPatientState } from '@psychsim/schemas';

const compareStrings = (left: string, right: string): number =>
  left === right ? 0 : left < right ? -1 : 1;

const sortById = <Value extends { readonly id: string }>(values: readonly Value[]): Value[] =>
  [...values].sort((left, right) => compareStrings(left.id, right.id));

/**
 * Canonical ordering for one already-resolved patient snapshot.
 *
 * This helper changes no clinical values and belongs to no reveal owner. It
 * exists so independent authoring compilers can fingerprint the same patient
 * state without depending on D-212/D-215 source-report semantics.
 */
export const normalizeResolvedPatientState = (state: ResolvedPatientState): ResolvedPatientState =>
  ResolvedPatientStateSchema.parse({
    ...state,
    conditionStates: sortById(
      state.conditionStates.map((condition) => ({
        ...condition,
        specifierIds: [...condition.specifierIds].sort(compareStrings),
      })),
    ),
    diagnosisRecordEntries: sortById(state.diagnosisRecordEntries),
    medicationRegimenEntries: sortById(state.medicationRegimenEntries),
    exposureInventory: {
      ...state.exposureInventory,
      useEntries: sortById(state.exposureInventory.useEntries),
    },
    treatmentHistory: {
      medicationTrials: sortById(state.treatmentHistory.medicationTrials),
      psychotherapyTrials: sortById(state.treatmentHistory.psychotherapyTrials),
      currentProviders: sortById(state.treatmentHistory.currentProviders),
      priorLevelsOfCare: sortById(state.treatmentHistory.priorLevelsOfCare),
    },
    medicationTolerabilityFindings: sortById(state.medicationTolerabilityFindings),
    reactionHistory: {
      ...state.reactionHistory,
      records: sortById(
        state.reactionHistory.records.map((record) => ({
          ...record,
          manifestationIds: [...record.manifestationIds].sort(compareStrings),
        })),
      ),
    },
    canonicalFindings: sortById(state.canonicalFindings),
    measurements: sortById(state.measurements),
    categoricalObservations: sortById(state.categoricalObservations),
    structuredTestResults: sortById(state.structuredTestResults),
    clinicalContexts: [...state.clinicalContexts]
      .map((clinicalContext) => ({
        ...clinicalContext,
        addedClinicalTagIds: [...clinicalContext.addedClinicalTagIds].sort(compareStrings),
        findingBindings: [...clinicalContext.findingBindings].sort((left, right) =>
          compareStrings(
            `${left.actionId}\u0000${left.findingId}`,
            `${right.actionId}\u0000${right.findingId}`,
          ),
        ),
      }))
      .sort((left, right) => compareStrings(left.dimensionId, right.dimensionId)),
    clinicalDurations: sortById(state.clinicalDurations),
    subjectiveBurdenRecords: sortById(state.subjectiveBurdenRecords),
    propositionState: {
      ...state.propositionState,
      propositions: sortById(state.propositionState.propositions),
      evidence: sortById(
        state.propositionState.evidence.map((evidence) => ({
          ...evidence,
          dependencyGroupIds: [...evidence.dependencyGroupIds].sort(compareStrings),
        })),
      ),
      dependencyGroups: sortById(
        state.propositionState.dependencyGroups.map((group) => ({
          ...group,
          evidenceIds: [...group.evidenceIds].sort(compareStrings),
        })),
      ),
      beliefAppraisals: sortById(state.propositionState.beliefAppraisals),
    },
    clinicalTagIds: [...state.clinicalTagIds].sort(compareStrings),
  });
