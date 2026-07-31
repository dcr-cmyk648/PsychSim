import {
  ResolvedPatientStateCompositionArtifactSchema,
  ResolvedPatientStateCompositionRequestSchema,
  ResolvedPatientStateSchema,
  type OptionalExposureBudgetBridgeArtifact,
  type OptionalPriorTreatmentBridgeArtifact,
  type OptionalReactionHistoryBridgeArtifact,
  type PatientOptionalFeatureModuleKind,
  type PatientStateCompositionBlocker,
  type PatientStateCompositionCoverageDiagnostic,
  type PatientStateOptionalModuleMaterializationAudit,
  type ResolvedConditionSource,
  type ResolvedPatientState,
  type ResolvedPatientStateCompositionArtifact,
  type ResolvedPatientStateCompositionFingerprint,
  type ResolvedPatientStateCompositionRequest,
} from '@psychsim/schemas';

import { verifyOptionalExposureBudgetBridgeIntegrity } from './optional-exposure-budget-bridge';
import { verifyOptionalFeatureBudgetSelectionIntegrity } from './optional-feature-budget-selector';
import { verifyOptionalPriorTreatmentBridgeIntegrity } from './optional-prior-treatment-bridge';
import { verifyOptionalReactionHistoryBridgeIntegrity } from './optional-reaction-history-bridge';
import { verifyResolvedConditionSourceIntegrity } from './resolved-condition-source';

export const RESOLVED_PATIENT_STATE_COMPOSER_VERSION = '1.0.0';

export type ResolvedPatientStateCompositionErrorCode =
  | 'INVALID_REQUEST'
  | 'OPTIONAL_FEATURE_ARTIFACT_INVALID'
  | 'CONDITION_SOURCE_INVALID'
  | 'CONDITION_SOURCE_CONTEXT_MISMATCH'
  | 'REACTION_HISTORY_BRIDGE_INVALID'
  | 'PRIOR_TREATMENT_BRIDGE_INVALID'
  | 'EXPOSURE_BRIDGE_INVALID'
  | 'OPTIONAL_FEATURE_CONTEXT_MISMATCH'
  | 'CORE_CONDITION_STATE_MISMATCH'
  | 'INVALID_OUTPUT';

export interface ResolvedPatientStateCompositionError {
  readonly code: ResolvedPatientStateCompositionErrorCode;
  readonly message: string;
  readonly contentIds: readonly string[];
}

export type ResolvedPatientStateCompositionResult =
  | { readonly ok: true; readonly value: ResolvedPatientStateCompositionArtifact }
  | { readonly ok: false; readonly error: ResolvedPatientStateCompositionError };

export type ResolvedPatientStateCompositionIntegrityResult =
  | { readonly ok: true; readonly value: ResolvedPatientStateCompositionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_RESOLVER_VERSION'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH'
          | 'REPLAY_MISMATCH';
        readonly message: string;
      };
    };

export type ResolvedPatientStateCompositionContextResult =
  | { readonly ok: true; readonly value: ResolvedPatientStateCompositionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_ARTIFACT' | 'CONTEXT_MISMATCH';
        readonly message: string;
      };
    };

const compareStrings = (left: string, right: string): number =>
  left === right ? 0 : left < right ? -1 : 1;

const canonicalizeObjectKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeObjectKeys);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([key, child]) => [key, canonicalizeObjectKeys(child)]),
    );
  }
  return value;
};

const hashToHex64 = (value: string): string => {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, '0');
};

const fingerprint = (scope: string, value: unknown): ResolvedPatientStateCompositionFingerprint =>
  `fingerprint.resolved-patient-state-composition.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameCanonicalValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const sortById = <Value extends { readonly id: string }>(values: readonly Value[]): Value[] =>
  [...values].sort((left, right) => compareStrings(left.id, right.id));

const normalizeConditionStates = (
  states: readonly ResolvedPatientState['conditionStates'][number][],
): ResolvedPatientState['conditionStates'] =>
  sortById(states).map((condition) => ({
    ...condition,
    specifierIds: [...condition.specifierIds].sort(compareStrings),
  }));

const normalizePatientState = (state: ResolvedPatientState): ResolvedPatientState =>
  ResolvedPatientStateSchema.parse({
    ...state,
    conditionStates: normalizeConditionStates(state.conditionStates),
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
      records: sortById(state.reactionHistory.records),
    },
    canonicalFindings: sortById(state.canonicalFindings),
    measurements: sortById(state.measurements),
    categoricalObservations: sortById(state.categoricalObservations),
    structuredTestResults: sortById(state.structuredTestResults),
    clinicalContexts: [...state.clinicalContexts].sort((left, right) =>
      compareStrings(left.dimensionId, right.dimensionId),
    ),
    clinicalDurations: sortById(state.clinicalDurations),
    subjectiveBurdenRecords: sortById(state.subjectiveBurdenRecords),
    propositionState: {
      ...state.propositionState,
      propositions: sortById(state.propositionState.propositions),
      evidence: sortById(state.propositionState.evidence),
      dependencyGroups: sortById(state.propositionState.dependencyGroups),
      beliefAppraisals: sortById(state.propositionState.beliefAppraisals),
    },
    clinicalTagIds: [...state.clinicalTagIds].sort(compareStrings),
  });

const normalizeRequest = (
  request: ResolvedPatientStateCompositionRequest,
): ResolvedPatientStateCompositionRequest => ({
  ...request,
  corePatientState: normalizePatientState(request.corePatientState),
});

export const fingerprintResolvedPatientStateCompositionCore = (
  state: ResolvedPatientState,
): ResolvedPatientStateCompositionFingerprint =>
  fingerprint('core-state', normalizePatientState(state));

const artifactPayload = (
  artifact: Omit<ResolvedPatientStateCompositionArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  resolverVersion: artifact.resolverVersion,
  requestId: artifact.requestId,
  status: artifact.status,
  templateRef: artifact.templateRef,
  templateFingerprint: artifact.templateFingerprint,
  corePatientStateRef: artifact.corePatientStateRef,
  optionalFeatureArtifactRef: artifact.optionalFeatureArtifactRef,
  conditionSourceRef: artifact.conditionSourceRef,
  reactionHistoryBridgeRef: artifact.reactionHistoryBridgeRef,
  priorTreatmentBridgeRef: artifact.priorTreatmentBridgeRef,
  exposureBridgeRef: artifact.exposureBridgeRef,
  reactionHistoryOwnership: artifact.reactionHistoryOwnership,
  selectedModuleAudits: artifact.selectedModuleAudits,
  coverageDiagnostics: artifact.coverageDiagnostics,
  conditionBindings: artifact.conditionBindings,
  blockers: artifact.blockers,
  composedPatientState: artifact.composedPatientState,
  composedPatientStateFingerprint: artifact.composedPatientStateFingerprint,
  compositionRequest: artifact.compositionRequest,
  inputFingerprint: artifact.inputFingerprint,
});

const fail = (
  code: ResolvedPatientStateCompositionErrorCode,
  message: string,
  contentIds: readonly string[],
): ResolvedPatientStateCompositionResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

interface VerifiedCompositionInputs {
  readonly request: ResolvedPatientStateCompositionRequest;
  readonly conditionSource: ReturnType<typeof verifyResolvedConditionSourceIntegrity> & {
    readonly ok: true;
  };
  readonly reactionBridge: OptionalReactionHistoryBridgeArtifact | null;
  readonly priorTreatmentBridge: OptionalPriorTreatmentBridgeArtifact | null;
  readonly exposureBridge: OptionalExposureBudgetBridgeArtifact | null;
}

const sameTemplateContext = (
  source: ResolvedConditionSource,
  request: ResolvedPatientStateCompositionRequest,
): boolean => {
  const sourceArtifact = source.artifact;
  const optionalArtifact = request.optionalFeatureArtifact;
  return (
    sourceArtifact.templateRef.id === optionalArtifact.templateRef.id &&
    sourceArtifact.templateRef.contentVersion === optionalArtifact.templateRef.contentVersion &&
    sourceArtifact.templateFingerprint === optionalArtifact.templateFingerprint
  );
};

const verifyOptionalArtifactContext = (
  embedded: unknown,
  expected: ResolvedPatientStateCompositionRequest['optionalFeatureArtifact'],
): boolean => sameCanonicalValue(embedded, expected);

const verifyInputs = (
  request: ResolvedPatientStateCompositionRequest,
):
  | { readonly ok: true; readonly value: VerifiedCompositionInputs }
  | {
      readonly ok: false;
      readonly result: ResolvedPatientStateCompositionResult;
    } => {
  const optionalIntegrity = verifyOptionalFeatureBudgetSelectionIntegrity(
    request.optionalFeatureArtifact,
  );
  if (!optionalIntegrity.ok) {
    return {
      ok: false,
      result: fail(
        'OPTIONAL_FEATURE_ARTIFACT_INVALID',
        `${optionalIntegrity.error.code}: ${optionalIntegrity.error.message}`,
        [request.optionalFeatureArtifact.id],
      ),
    };
  }

  const conditionIntegrity = verifyResolvedConditionSourceIntegrity(request.conditionSource);
  if (!conditionIntegrity.ok) {
    return {
      ok: false,
      result: fail(
        'CONDITION_SOURCE_INVALID',
        `${conditionIntegrity.error.code}: ${conditionIntegrity.error.message}`,
        [request.conditionSource.artifact.id],
      ),
    };
  }
  if (!sameTemplateContext(conditionIntegrity.value.source, request)) {
    return {
      ok: false,
      result: fail(
        'CONDITION_SOURCE_CONTEXT_MISMATCH',
        'The condition source does not pin the exact D-201 patient template and fingerprint.',
        [conditionIntegrity.value.source.artifact.id, request.optionalFeatureArtifact.id],
      ),
    };
  }

  const hasComorbidityCandidates =
    request.optionalFeatureArtifact.selectionRequest.moduleDefinitions.some(
      (definition) => definition.moduleKind === 'comorbidity',
    );
  if (hasComorbidityCandidates) {
    if (
      conditionIntegrity.value.source.sourceKind !== 'optional_comorbidity_bridge' ||
      !verifyOptionalArtifactContext(
        conditionIntegrity.value.source.artifact.bridgeRequest.optionalFeatureArtifact,
        request.optionalFeatureArtifact,
      )
    ) {
      return {
        ok: false,
        result: fail(
          'CONDITION_SOURCE_CONTEXT_MISMATCH',
          'Comorbidity candidates require a genuine D-202 source carrying this complete D-201 artifact.',
          [conditionIntegrity.value.source.artifact.id, request.optionalFeatureArtifact.id],
        ),
      };
    }
  } else if (
    conditionIntegrity.value.source.sourceKind !== 'template_condition_selection' ||
    conditionIntegrity.value.source.artifact.groupSelections.length > 0
  ) {
    return {
      ok: false,
      result: fail(
        'CONDITION_SOURCE_CONTEXT_MISMATCH',
        'Without D-201 comorbidity candidates, the D-196 source must contain required conditions only and no independent optional-selection groups.',
        [conditionIntegrity.value.source.artifact.id, request.optionalFeatureArtifact.id],
      ),
    };
  }

  const requiredConditionStateIds = new Set(
    conditionIntegrity.value.conditionBindings
      .filter((binding) => binding.kind === 'required')
      .map((binding) => binding.conditionStateId),
  );
  const requiredConditionStates = conditionIntegrity.value.conditionStates.filter((state) =>
    requiredConditionStateIds.has(state.id),
  );
  if (
    !sameCanonicalValue(
      normalizeConditionStates(requiredConditionStates),
      normalizeConditionStates(request.corePatientState.conditionStates),
    )
  ) {
    return {
      ok: false,
      result: fail(
        'CORE_CONDITION_STATE_MISMATCH',
        'Core condition state must equal the exact required-condition subset of the verified source before optional composition.',
        [request.corePatientState.id, conditionIntegrity.value.source.artifact.id],
      ),
    };
  }

  let reactionBridge: OptionalReactionHistoryBridgeArtifact | null = null;
  if (request.reactionHistoryBridgeArtifact !== null) {
    const integrity = verifyOptionalReactionHistoryBridgeIntegrity(
      request.reactionHistoryBridgeArtifact,
    );
    if (!integrity.ok) {
      return {
        ok: false,
        result: fail(
          'REACTION_HISTORY_BRIDGE_INVALID',
          `${integrity.error.code}: ${integrity.error.message}`,
          [request.reactionHistoryBridgeArtifact.id],
        ),
      };
    }
    if (
      !verifyOptionalArtifactContext(
        integrity.value.bridgeRequest.optionalFeatureArtifact,
        request.optionalFeatureArtifact,
      )
    ) {
      return {
        ok: false,
        result: fail(
          'OPTIONAL_FEATURE_CONTEXT_MISMATCH',
          'The reaction-history bridge does not retain this exact D-201 artifact.',
          [integrity.value.id, request.optionalFeatureArtifact.id],
        ),
      };
    }
    reactionBridge = integrity.value;
  }

  let priorTreatmentBridge: OptionalPriorTreatmentBridgeArtifact | null = null;
  if (request.priorTreatmentBridgeArtifact !== null) {
    const integrity = verifyOptionalPriorTreatmentBridgeIntegrity(
      request.priorTreatmentBridgeArtifact,
    );
    if (!integrity.ok) {
      return {
        ok: false,
        result: fail(
          'PRIOR_TREATMENT_BRIDGE_INVALID',
          `${integrity.error.code}: ${integrity.error.message}`,
          [request.priorTreatmentBridgeArtifact.id],
        ),
      };
    }
    if (
      !verifyOptionalArtifactContext(
        integrity.value.bridgeRequest.optionalFeatureArtifact,
        request.optionalFeatureArtifact,
      )
    ) {
      return {
        ok: false,
        result: fail(
          'OPTIONAL_FEATURE_CONTEXT_MISMATCH',
          'The prior-treatment bridge does not retain this exact D-201 artifact.',
          [integrity.value.id, request.optionalFeatureArtifact.id],
        ),
      };
    }
    priorTreatmentBridge = integrity.value;
  }

  let exposureBridge: OptionalExposureBudgetBridgeArtifact | null = null;
  if (request.exposureBridgeArtifact !== null) {
    const integrity = verifyOptionalExposureBudgetBridgeIntegrity(request.exposureBridgeArtifact);
    if (!integrity.ok) {
      return {
        ok: false,
        result: fail(
          'EXPOSURE_BRIDGE_INVALID',
          `${integrity.error.code}: ${integrity.error.message}`,
          [request.exposureBridgeArtifact.id],
        ),
      };
    }
    if (
      !verifyOptionalArtifactContext(
        integrity.value.bridgeRequest.optionalFeatureArtifact,
        request.optionalFeatureArtifact,
      )
    ) {
      return {
        ok: false,
        result: fail(
          'OPTIONAL_FEATURE_CONTEXT_MISMATCH',
          'The exposure bridge does not retain this exact D-201 artifact.',
          [integrity.value.id, request.optionalFeatureArtifact.id],
        ),
      };
    }
    exposureBridge = integrity.value;
  }

  return {
    ok: true,
    value: {
      request,
      conditionSource: conditionIntegrity,
      reactionBridge,
      priorTreatmentBridge,
      exposureBridge,
    },
  };
};

const materializedIdsForModule = (
  inputs: VerifiedCompositionInputs,
  moduleDefinitionId: string,
  moduleKind: PatientOptionalFeatureModuleKind,
): string[] => {
  if (moduleKind === 'comorbidity') {
    if (inputs.conditionSource.value.source.sourceKind !== 'optional_comorbidity_bridge') return [];
    const evaluation = inputs.conditionSource.value.source.artifact.groupAudits
      .flatMap((group) => group.candidateEvaluations)
      .find((candidate) => candidate.moduleRef.id === moduleDefinitionId);
    if (!evaluation) return [];
    const binding = inputs.conditionSource.value.conditionBindings.find(
      (candidate) =>
        candidate.kind === 'optional_group' &&
        candidate.templateConditionId === evaluation.templateConditionId,
    );
    return binding ? [binding.conditionStateId] : [];
  }
  if (moduleKind === 'allergy_reaction') {
    const evaluation = inputs.reactionBridge?.candidateEvaluations.find(
      (candidate) => candidate.moduleRef.id === moduleDefinitionId,
    );
    return evaluation ? [...evaluation.reactionRecordIds].sort(compareStrings) : [];
  }
  if (moduleKind === 'prior_treatment') {
    const evaluation = inputs.priorTreatmentBridge?.candidateEvaluations.find(
      (candidate) => candidate.moduleRef.id === moduleDefinitionId,
    );
    return evaluation
      ? [
          ...evaluation.medicationTrialIds,
          ...evaluation.psychotherapyTrialIds,
          ...evaluation.currentProviderIds,
          ...evaluation.priorLevelOfCareIds,
        ].sort(compareStrings)
      : [];
  }
  if (moduleKind === 'substance_use') {
    const evaluation = inputs.exposureBridge?.candidateEvaluations.find(
      (candidate) => candidate.moduleRef.id === moduleDefinitionId,
    );
    return evaluation ? [...evaluation.useEntryIds].sort(compareStrings) : [];
  }
  return [];
};

const ownerKindForModule = (
  moduleKind: PatientOptionalFeatureModuleKind,
): PatientStateOptionalModuleMaterializationAudit['ownerKind'] => {
  if (moduleKind === 'comorbidity') return 'condition_source';
  if (moduleKind === 'allergy_reaction') return 'reaction_history_bridge';
  if (moduleKind === 'prior_treatment') return 'prior_treatment_bridge';
  if (moduleKind === 'substance_use') return 'exposure_bridge';
  return 'unowned_other';
};

const buildSelectedModuleAudits = (
  inputs: VerifiedCompositionInputs,
): PatientStateOptionalModuleMaterializationAudit[] => {
  const optionalArtifact = inputs.request.optionalFeatureArtifact;
  const kindByDefinitionId = new Map(
    optionalArtifact.selectionRequest.moduleDefinitions.map((definition) => [
      definition.id,
      definition.moduleKind,
    ]),
  );
  return optionalArtifact.candidateEvaluations
    .filter((evaluation) => evaluation.disposition === 'selected')
    .sort((left, right) => (left.selectionOrdinal ?? 0) - (right.selectionOrdinal ?? 0))
    .map((evaluation) => {
      const moduleKind = kindByDefinitionId.get(evaluation.moduleRef.id);
      const draw = optionalArtifact.selectionDraws.find(
        (candidate) => candidate.selectionOrdinal === evaluation.selectionOrdinal,
      );
      if (
        moduleKind === undefined ||
        evaluation.selectionOrdinal === null ||
        evaluation.stableDrawId === null ||
        draw === undefined
      ) {
        throw new Error(`Incomplete D-201 selection trace for ${evaluation.moduleRef.id}.`);
      }
      return {
        schemaVersion: 1,
        moduleDefinitionId: evaluation.moduleRef.id,
        moduleKind,
        bindingId: evaluation.bindingId,
        selectedModuleId: evaluation.moduleSnapshot.id,
        selectionOrdinal: evaluation.selectionOrdinal,
        stableDrawId: evaluation.stableDrawId,
        cost: evaluation.moduleSnapshot.cost,
        remainingBudgetBefore: draw.remainingBudgetBefore,
        remainingBudgetAfter: draw.remainingBudgetAfter,
        ownerKind: ownerKindForModule(moduleKind),
        materializationStatus: moduleKind === 'other' ? 'unsupported' : 'materialized',
        materializedRecordIds: materializedIdsForModule(
          inputs,
          evaluation.moduleRef.id,
          moduleKind,
        ),
      };
    });
};

const buildCoverageDiagnostics = (
  request: ResolvedPatientStateCompositionRequest,
): PatientStateCompositionCoverageDiagnostic[] => {
  const selectedIds = new Set(
    request.optionalFeatureArtifact.candidateEvaluations
      .filter((evaluation) => evaluation.disposition === 'selected')
      .map((evaluation) => evaluation.moduleRef.id),
  );
  return request.optionalFeatureArtifact.selectionRequest.moduleDefinitions
    .filter((definition) => definition.moduleKind === 'other')
    .sort((left, right) => compareStrings(left.id, right.id))
    .map((definition) => {
      const selected = selectedIds.has(definition.id);
      return {
        schemaVersion: 1,
        code: selected ? 'unsupported_selected_other' : 'unsupported_other_candidate',
        moduleDefinitionId: definition.id,
        selected,
        blocking: selected,
      };
    });
};

const buildBlockers = (
  inputs: VerifiedCompositionInputs,
  diagnostics: readonly PatientStateCompositionCoverageDiagnostic[],
): PatientStateCompositionBlocker[] => {
  const blockers: PatientStateCompositionBlocker[] = [];
  if (inputs.conditionSource.value.conflicts.length > 0) {
    blockers.push({
      kind: 'literal_condition_incompatibility',
      conflictIds: inputs.conditionSource.value.conflicts
        .map((conflict) => conflict.incompatibilityId)
        .sort(compareStrings),
    });
  }
  const selectedByDefinitionId = new Map(
    inputs.request.optionalFeatureArtifact.candidateEvaluations
      .filter((evaluation) => evaluation.disposition === 'selected')
      .map((evaluation) => [evaluation.moduleRef.id, evaluation]),
  );
  diagnostics
    .filter((diagnostic) => diagnostic.blocking)
    .forEach((diagnostic) => {
      const selected = selectedByDefinitionId.get(diagnostic.moduleDefinitionId);
      if (!selected) return;
      blockers.push({
        kind: 'unsupported_selected_module',
        moduleDefinitionId: diagnostic.moduleDefinitionId,
        bindingId: selected.bindingId,
        selectedModuleId: selected.moduleSnapshot.id,
      });
    });
  return blockers;
};

const buildComposedPatientState = (
  inputs: VerifiedCompositionInputs,
): {
  readonly state: ResolvedPatientState;
  readonly stateFingerprint: ResolvedPatientStateCompositionFingerprint;
} => {
  const core = inputs.request.corePatientState;
  const priorContribution =
    inputs.priorTreatmentBridge?.materializedTreatmentHistoryContribution ?? null;
  const exposureContribution = inputs.exposureBridge?.materializedExposureContribution ?? null;
  const reactionHistory =
    inputs.reactionBridge?.materializedReactionHistory ?? core.reactionHistory;
  const exposureUseEntries = sortById([
    ...core.exposureInventory.useEntries,
    ...(exposureContribution?.useEntries ?? []),
  ]);
  const exposureInventory =
    exposureContribution === null
      ? core.exposureInventory
      : {
          schemaVersion: 1 as const,
          id: `resolved-exposure-inventory.composed.${fingerprint('exposure-inventory', {
            coreInventory: core.exposureInventory,
            optionalFeatureArtifactRef: {
              id: inputs.request.optionalFeatureArtifact.id,
              payloadFingerprint: inputs.request.optionalFeatureArtifact.payloadFingerprint,
            },
            exposureBridgeRef: {
              id: inputs.exposureBridge?.id,
              payloadFingerprint: inputs.exposureBridge?.payloadFingerprint,
            },
            useEntries: exposureUseEntries,
          }).slice(-16)}`,
          useEntries: exposureUseEntries,
        };
  const stateWithoutId: Omit<ResolvedPatientState, 'id'> = {
    ...core,
    conditionStates: normalizeConditionStates(inputs.conditionSource.value.conditionStates),
    exposureInventory,
    treatmentHistory: {
      medicationTrials: sortById([
        ...core.treatmentHistory.medicationTrials,
        ...(priorContribution?.medicationTrials ?? []),
      ]),
      psychotherapyTrials: sortById([
        ...core.treatmentHistory.psychotherapyTrials,
        ...(priorContribution?.psychotherapyTrials ?? []),
      ]),
      currentProviders: sortById([
        ...core.treatmentHistory.currentProviders,
        ...(priorContribution?.currentProviders ?? []),
      ]),
      priorLevelsOfCare: sortById([
        ...core.treatmentHistory.priorLevelsOfCare,
        ...(priorContribution?.priorLevelsOfCare ?? []),
      ]),
    },
    reactionHistory: {
      ...reactionHistory,
      records: sortById(reactionHistory.records),
    },
    canonicalFindings: [],
  };
  const stateFingerprint = fingerprint('state', {
    state: stateWithoutId,
    optionalFeatureArtifactRef: {
      id: inputs.request.optionalFeatureArtifact.id,
      payloadFingerprint: inputs.request.optionalFeatureArtifact.payloadFingerprint,
    },
    conditionSourceRef: inputs.conditionSource.value.sourceRef,
    reactionHistoryBridgeRef:
      inputs.reactionBridge === null
        ? null
        : {
            id: inputs.reactionBridge.id,
            payloadFingerprint: inputs.reactionBridge.payloadFingerprint,
          },
    priorTreatmentBridgeRef:
      inputs.priorTreatmentBridge === null
        ? null
        : {
            id: inputs.priorTreatmentBridge.id,
            payloadFingerprint: inputs.priorTreatmentBridge.payloadFingerprint,
          },
    exposureBridgeRef:
      inputs.exposureBridge === null
        ? null
        : {
            id: inputs.exposureBridge.id,
            payloadFingerprint: inputs.exposureBridge.payloadFingerprint,
          },
    reactionHistoryOwnership: inputs.request.reactionHistoryOwnership,
  });
  const state = normalizePatientState({
    ...stateWithoutId,
    id: `resolved-patient-state.composed.${stateFingerprint.slice(-16)}`,
  });
  return { state, stateFingerprint };
};

const buildArtifact = (
  inputs: VerifiedCompositionInputs,
): ResolvedPatientStateCompositionArtifact => {
  const request = inputs.request;
  const selectedModuleAudits = buildSelectedModuleAudits(inputs);
  const coverageDiagnostics = buildCoverageDiagnostics(request);
  const blockers = buildBlockers(inputs, coverageDiagnostics);
  const composed = blockers.length === 0 ? buildComposedPatientState(inputs) : null;
  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    resolverVersion: RESOLVED_PATIENT_STATE_COMPOSER_VERSION,
    requestId: request.id,
    status: composed === null ? ('not_composed' as const) : ('composed' as const),
    templateRef: request.optionalFeatureArtifact.templateRef,
    templateFingerprint: request.optionalFeatureArtifact.templateFingerprint,
    corePatientStateRef: {
      id: request.corePatientState.id,
      fingerprint: fingerprintResolvedPatientStateCompositionCore(request.corePatientState),
    },
    optionalFeatureArtifactRef: {
      id: request.optionalFeatureArtifact.id,
      inputFingerprint: request.optionalFeatureArtifact.inputFingerprint,
      payloadFingerprint: request.optionalFeatureArtifact.payloadFingerprint,
    },
    conditionSourceRef: inputs.conditionSource.value.sourceRef,
    reactionHistoryBridgeRef:
      inputs.reactionBridge === null
        ? null
        : {
            id: inputs.reactionBridge.id,
            payloadFingerprint: inputs.reactionBridge.payloadFingerprint,
          },
    priorTreatmentBridgeRef:
      inputs.priorTreatmentBridge === null
        ? null
        : {
            id: inputs.priorTreatmentBridge.id,
            payloadFingerprint: inputs.priorTreatmentBridge.payloadFingerprint,
          },
    exposureBridgeRef:
      inputs.exposureBridge === null
        ? null
        : {
            id: inputs.exposureBridge.id,
            payloadFingerprint: inputs.exposureBridge.payloadFingerprint,
          },
    reactionHistoryOwnership: request.reactionHistoryOwnership,
    selectedModuleAudits,
    coverageDiagnostics,
    conditionBindings: [...inputs.conditionSource.value.conditionBindings].sort((left, right) =>
      compareStrings(left.id, right.id),
    ),
    blockers,
    composedPatientState: composed?.state ?? null,
    composedPatientStateFingerprint: composed?.stateFingerprint ?? null,
    compositionRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
  return ResolvedPatientStateCompositionArtifactSchema.parse({
    ...withoutIdentity,
    id: `resolved-patient-state-composition.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
};

export const composeResolvedPatientState = (
  input: unknown,
): ResolvedPatientStateCompositionResult => {
  const parsed = ResolvedPatientStateCompositionRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }
  const request = normalizeRequest(parsed.data);
  const verified = verifyInputs(request);
  if (!verified.ok) return verified.result;
  try {
    return { ok: true, value: buildArtifact(verified.value) };
  } catch (error) {
    return fail('INVALID_OUTPUT', error instanceof Error ? error.message : String(error), [
      request.id,
      request.corePatientState.id,
    ]);
  }
};

export const verifyResolvedPatientStateCompositionIntegrity = (
  input: unknown,
): ResolvedPatientStateCompositionIntegrityResult => {
  const parsed = ResolvedPatientStateCompositionArtifactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  const artifact = parsed.data;
  if (artifact.resolverVersion !== RESOLVED_PATIENT_STATE_COMPOSER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_RESOLVER_VERSION',
        message: `${artifact.id} uses unsupported patient-state composer ${artifact.resolverVersion}.`,
      },
    };
  }
  const normalizedRequest = normalizeRequest(artifact.compositionRequest);
  const expectedInputFingerprint = fingerprint('input', normalizedRequest);
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact normalized core-plus-optional request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('output', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `resolved-patient-state-composition.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen patient-state composition payload.`,
      },
    };
  }
  const replay = composeResolvedPatientState(normalizedRequest);
  if (!replay.ok || !sameCanonicalValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained request does not reproduce the exact core-plus-optional patient-state composition.',
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyResolvedPatientStateCompositionContext = (input: {
  readonly artifact: unknown;
  readonly request: unknown;
}): ResolvedPatientStateCompositionContextResult => {
  const integrity = verifyResolvedPatientStateCompositionIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = composeResolvedPatientState(input.request);
  if (!expected.ok || !sameCanonicalValue(expected.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message:
          'The resolved patient-state composition does not match this exact core and optional-feature request.',
      },
    };
  }
  return { ok: true, value: integrity.value };
};
