import {
  CatalogCompiledInstanceSnapshotSchema,
  CatalogInstanceCompileRequestSchema,
  EncounterInstanceSchema,
  InstrumentItemResponseCompileRequestSchema,
  PatientInstanceSchema,
  PatientTemplateSchema,
  ResolvedPatientStateSchema,
  StructuredPatientStateRevealProjectionEnvelopeSchema,
  UniversalActionResultCompileRequestSchema,
  type CatalogCompiledInstanceSnapshot,
  type CatalogInstanceCompileRequest,
  type CatalogInstanceFingerprint,
  type DecisionActionHorizon,
  type DiagnosisSelectionHorizon,
  type EncounterInstance,
  type EncounterOperationalAdmissionArtifact,
  type EncounterResultBinding,
  type EncounterResultBindingRequest,
  type EncounterResultSourceReference,
  type FindingCompilerFingerprint,
  type FindingProjectionHorizon,
  type FrozenInstrumentItemResponse,
  type FrozenTargetScopedPatientValueReveal,
  type InstrumentItemResponseCompilationArtifact,
  type FrozenStructuredPatientStateReveal,
  type LocationDefinition,
  type PatientInstance,
  type PatientTemplate,
  type ResolvedPatientState,
  type StructuredSourceReportArtifact,
  type StructuredSourceReportSelectionArtifact,
  type StructuredPatientStateRevealProjectionRecipe,
  type StructuredPatientStateRevealProjectionEnvelope,
  type TargetScopedPatientValueProjectionArtifact,
  type UniversalActionResultArtifact,
  type UniversalActionResultAssemblyRecipe,
} from '@psychsim/schemas';

import {
  compileDecisionPolicy,
  verifyCompiledRubricContext,
  verifyCompiledRubricIntegrity,
} from './decision-policy';
import {
  verifyEncounterOperationalAdmissionContext,
  verifyEncounterOperationalAdmissionIntegrity,
} from './encounter-operational-admission-compiler';
import {
  normalizeSelectedLocationOperationalResourceContextRequest,
  verifySelectedLocationOperationalResourceContext,
} from './selected-location-operational-resource-compiler';
import {
  evaluatePresentationRichness,
  verifyPresentationRichnessContext,
} from './presentation-richness';
import {
  compileSharedFindings,
  fingerprintFindingProjectionHorizon,
  verifyCompiledSharedFindingContext,
  verifyCompiledSharedFindingIntegrity,
  verifyCompiledSharedFindingSeedContext,
} from './shared-finding-compiler';
import {
  compileInstrumentItemResponses,
  deriveInstrumentInformationActionHorizon,
  verifyInstrumentItemResponseCompilationIntegrity,
} from './instrument-item-response-compiler';
import {
  fingerprintStructuredSourceReportSelectionAssembly,
  fingerprintStructuredSourceReportSelectionTemplate,
  getSelectedStructuredSourceReportProfiles,
  verifyStructuredSourceReportBehaviorSelectionIntegrity,
} from './structured-source-report-behavior-selector';
import {
  compileStructuredSourceReports,
  normalizeStructuredSourceReportDefinition,
  normalizeStructuredSourceReportProfile,
  verifyStructuredSourceReportArtifactIntegrity,
} from './structured-source-report-compiler';
import { normalizeResolvedPatientState } from './resolved-patient-state-normalizer';
import {
  compileTargetScopedPatientValueProjections,
  verifyTargetScopedPatientValueProjectionArtifactIntegrity,
} from './target-scoped-patient-value-projection';
import { translateUniversalActionResultArtifact } from './universal-action-result-attachment';
import {
  compileUniversalActionResults,
  fingerprintUniversalActionResultAssemblyRecipe,
  normalizeUniversalActionResultAssemblyRecipe,
  verifyUniversalActionResultArtifactIntegrity,
} from './universal-action-result-compiler';

export const CATALOG_INSTANCE_COMPILER_VERSION = '9.0.0';

export type CatalogInstanceCompileErrorCode =
  | 'INVALID_REQUEST'
  | 'BASE_FINDINGS_NOT_EMPTY'
  | 'PATIENT_STATE_ID_MISMATCH'
  | 'PROPOSITION_STATE_MISMATCH'
  | 'TEMPLATE_LOCATION_MISMATCH'
  | 'TEMPLATE_CARE_SETTING_MISMATCH'
  | 'TEMPLATE_POLICY_MISMATCH'
  | 'TEMPLATE_DECISION_MISMATCH'
  | 'TEMPLATE_HORIZON_MISMATCH'
  | 'TEMPLATE_RESULT_ASSEMBLY_MISMATCH'
  | 'OPERATIONAL_ADMISSION_MISMATCH'
  | 'LOCATION_DISPOSITION_MISMATCH'
  | 'SHARED_FINDING_COMPILATION_FAILED'
  | 'INSTRUMENT_ITEM_RESPONSE_COMPILATION_FAILED'
  | 'INCOMPLETE_INSTRUMENT_ITEM_RESPONSE_COVERAGE'
  | 'UNRESOLVED_FINDING_SCOPED_RECORD'
  | 'FINAL_PATIENT_STATE_INVALID'
  | 'TARGET_SCOPED_PATIENT_VALUE_COMPILATION_FAILED'
  | 'STRUCTURED_SOURCE_REPORT_SELECTION_MISMATCH'
  | 'STRUCTURED_SOURCE_REPORT_COMPILATION_FAILED'
  | 'STRUCTURED_REVEAL_STATE_MISMATCH'
  | 'UNIVERSAL_ACTION_RESULT_COMPILATION_FAILED'
  | 'INCOMPLETE_ACTION_RESULT_COVERAGE'
  | 'UNIVERSAL_ACTION_RESULT_TRANSLATION_FAILED'
  | 'DECISION_POLICY_COMPILATION_FAILED'
  | 'RUBRIC_CONTEXT_MISMATCH'
  | 'PRESENTATION_RICHNESS_EVALUATION_FAILED'
  | 'UNRESOLVED_RESULT_SOURCE'
  | 'COMPILED_SNAPSHOT_INVALID';

export interface CatalogInstanceCompileError {
  readonly code: CatalogInstanceCompileErrorCode;
  readonly message: string;
  readonly contentIds: readonly string[];
  readonly inputFingerprint: CatalogInstanceFingerprint | null;
}

export type CatalogInstanceCompileResult =
  | { readonly ok: true; readonly value: CatalogCompiledInstanceSnapshot }
  | { readonly ok: false; readonly error: CatalogInstanceCompileError };

export type CatalogInstanceIntegrityResult =
  | { readonly ok: true; readonly value: CatalogCompiledInstanceSnapshot }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'SHARED_FINDING_INTEGRITY_INVALID'
          | 'INSTRUMENT_ITEM_RESPONSE_INTEGRITY_INVALID'
          | 'INSTRUMENT_ITEM_RESPONSE_CONTEXT_MISMATCH'
          | 'PROJECTION_HORIZON_CONTEXT_MISMATCH'
          | 'PROJECTION_SEED_CONTEXT_MISMATCH'
          | 'TEMPLATE_RECIPE_FINGERPRINT_MISMATCH'
          | 'OPERATIONAL_ADMISSION_INTEGRITY_INVALID'
          | 'OPERATIONAL_ADMISSION_CONTEXT_MISMATCH'
          | 'STRUCTURED_SOURCE_REPORT_SELECTION_INTEGRITY_INVALID'
          | 'STRUCTURED_SOURCE_REPORT_SELECTION_CONTEXT_MISMATCH'
          | 'STRUCTURED_SOURCE_REPORT_INTEGRITY_INVALID'
          | 'STRUCTURED_SOURCE_REPORT_CONTEXT_MISMATCH'
          | 'TARGET_SCOPED_PATIENT_VALUE_INTEGRITY_INVALID'
          | 'TARGET_SCOPED_PATIENT_VALUE_CONTEXT_MISMATCH'
          | 'UNIVERSAL_ACTION_RESULT_INTEGRITY_INVALID'
          | 'UNIVERSAL_ACTION_RESULT_CONTEXT_MISMATCH'
          | 'RESULT_BINDING_CONTEXT_MISMATCH'
          | 'RUBRIC_INTEGRITY_INVALID'
          | 'RUBRIC_CONTEXT_MISMATCH'
          | 'PRESENTATION_RICHNESS_INTEGRITY_INVALID'
          | 'PRESENTATION_RICHNESS_CONTEXT_MISMATCH'
          | 'LOCATION_FINGERPRINT_MISMATCH'
          | 'PATIENT_INPUT_FINGERPRINT_MISMATCH'
          | 'PATIENT_PAYLOAD_FINGERPRINT_MISMATCH'
          | 'ENCOUNTER_INPUT_FINGERPRINT_MISMATCH'
          | 'ENCOUNTER_PAYLOAD_FINGERPRINT_MISMATCH'
          | 'SNAPSHOT_PAYLOAD_FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

const compareStrings = (left: string, right: string): number =>
  left === right ? 0 : left < right ? -1 : 1;

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value
      .map(canonicalize)
      .sort((left, right) => compareStrings(JSON.stringify(left), JSON.stringify(right)));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
};

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

const fingerprint = (scope: string, value: unknown): CatalogInstanceFingerprint =>
  `fingerprint.catalog-instance.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const exactFingerprint = (scope: string, value: unknown): CatalogInstanceFingerprint =>
  `fingerprint.catalog-instance.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, fingerprintValue: CatalogInstanceFingerprint): string =>
  `${prefix}.${fingerprintValue.slice(-16)}`;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const sameCanonicalValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const sortById = <Value extends { readonly id: string }>(values: readonly Value[]): Value[] =>
  [...values].sort((left, right) => compareStrings(left.id, right.id));

const normalizeTemplate = (template: PatientTemplate): PatientTemplate =>
  PatientTemplateSchema.parse({
    ...template,
    review: {
      ...template.review,
      sourceUseNoteIds: [...template.review.sourceUseNoteIds].sort(compareStrings),
    },
    compatibleLocationRefs: [...template.compatibleLocationRefs].sort((left, right) =>
      compareStrings(left.id, right.id),
    ),
    requiredConditions: sortById(
      template.requiredConditions.map((condition) => ({
        ...condition,
        specifierIds: [...condition.specifierIds].sort(compareStrings),
      })),
    ),
    optionalConditionSelectionGroups: sortById(
      template.optionalConditionSelectionGroups.map((group) => ({
        ...group,
        candidates: sortById(
          group.candidates.map((condition) => ({
            ...condition,
            specifierIds: [...condition.specifierIds].sort(compareStrings),
          })),
        ),
      })),
    ),
    presentationRichnessEnvelope: {
      ...template.presentationRichnessEnvelope,
      decisionDriverCategories: [
        ...template.presentationRichnessEnvelope.decisionDriverCategories,
      ].sort(compareStrings),
    },
  });

const normalizePatientState = (state: ResolvedPatientState): ResolvedPatientState =>
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

const normalizeLocation = (location: LocationDefinition): LocationDefinition => ({
  ...location,
  capabilities: [...location.capabilities].sort((left, right) =>
    compareStrings(JSON.stringify(left), JSON.stringify(right)),
  ),
  dispositionIds: [...location.dispositionIds].sort(compareStrings),
});

const normalizeProjectionHorizon = (
  horizon: FindingProjectionHorizon,
): FindingProjectionHorizon => ({
  ...horizon,
  targets: [...horizon.targets].sort((left, right) =>
    compareStrings(JSON.stringify(left.target), JSON.stringify(right.target)),
  ),
});

const normalizeDecisionActionHorizon = (horizon: DecisionActionHorizon): DecisionActionHorizon => ({
  ...horizon,
  informationActionIds: [...horizon.informationActionIds].sort(compareStrings),
  startMedicationIds: [...horizon.startMedicationIds].sort(compareStrings),
  regimenEntryOperations: [...horizon.regimenEntryOperations]
    .map((entry) => ({
      ...entry,
      operations: [...entry.operations].sort(compareStrings),
    }))
    .sort((left, right) => compareStrings(left.regimenEntryId, right.regimenEntryId)),
  interventionIds: [...horizon.interventionIds].sort(compareStrings),
  dispositionIds: [...horizon.dispositionIds].sort(compareStrings),
});

export const fingerprintDecisionActionHorizon = (
  horizon: DecisionActionHorizon,
): CatalogInstanceFingerprint =>
  exactFingerprint('decision-action-horizon', normalizeDecisionActionHorizon(horizon));

const normalizeStructuredRevealEnvelope = (
  envelope: StructuredPatientStateRevealProjectionEnvelope,
): StructuredPatientStateRevealProjectionEnvelope =>
  StructuredPatientStateRevealProjectionEnvelopeSchema.parse({
    ...envelope,
    definition: {
      ...envelope.definition,
      allowedSourceKinds: [...envelope.definition.allowedSourceKinds].sort(compareStrings),
      lanes: [...envelope.definition.lanes].sort(compareStrings),
      singletonFields: [...envelope.definition.singletonFields].sort(compareStrings),
      review: {
        ...envelope.definition.review,
        sourceUseNoteIds: [...envelope.definition.review.sourceUseNoteIds].sort(compareStrings),
      },
    },
    resolved: {
      ...envelope.resolved,
      dependencyGroupIds: [...envelope.resolved.dependencyGroupIds].sort(compareStrings),
      laneStatements: [...envelope.resolved.laneStatements]
        .map((statement) => ({
          ...statement,
          includedTruthRecordIds: [...statement.includedTruthRecordIds].sort(compareStrings),
          omittedTruthRecordIds: [...statement.omittedTruthRecordIds].sort(compareStrings),
        }))
        .sort((left, right) => compareStrings(left.lane, right.lane)),
      singletonStatements: [...envelope.resolved.singletonStatements].sort((left, right) =>
        compareStrings(left.field, right.field),
      ),
    },
  });

export interface CatalogInstanceRecipeFingerprintInput {
  readonly decisionActionHorizon: DecisionActionHorizon;
  readonly diagnosisSelectionHorizon: DiagnosisSelectionHorizon;
  readonly findingProjectionHorizon: FindingProjectionHorizon;
  readonly universalActionResultAssemblyRecipe: UniversalActionResultAssemblyRecipe;
}

export interface CatalogInstanceRecipeFingerprints {
  readonly decisionActionHorizonFingerprint: CatalogInstanceFingerprint;
  readonly diagnosisSelectionHorizonFingerprint: CatalogInstanceFingerprint;
  readonly findingProjectionHorizonFingerprint: FindingCompilerFingerprint;
  readonly universalActionResultAssemblyRecipeFingerprint: ReturnType<
    typeof fingerprintUniversalActionResultAssemblyRecipe
  >;
}

/**
 * Fingerprints the exact structural recipe a template admits. Set-like action
 * and binding record collections are normalized explicitly; authored diagnosis
 * option, projection response, and result-source order remains significant.
 */
export const fingerprintCatalogInstanceRecipe = (
  input: CatalogInstanceRecipeFingerprintInput,
): CatalogInstanceRecipeFingerprints => {
  const decisionActionHorizon = normalizeDecisionActionHorizon(input.decisionActionHorizon);
  const findingProjectionHorizon = normalizeProjectionHorizon(input.findingProjectionHorizon);
  return {
    decisionActionHorizonFingerprint: fingerprintDecisionActionHorizon(decisionActionHorizon),
    diagnosisSelectionHorizonFingerprint: exactFingerprint(
      'diagnosis-selection-horizon',
      input.diagnosisSelectionHorizon,
    ),
    findingProjectionHorizonFingerprint:
      fingerprintFindingProjectionHorizon(findingProjectionHorizon),
    universalActionResultAssemblyRecipeFingerprint: fingerprintUniversalActionResultAssemblyRecipe(
      input.universalActionResultAssemblyRecipe,
    ),
  };
};

const fingerprintDerivedResultBindings = (
  bindings: readonly EncounterResultBindingRequest[],
): CatalogInstanceFingerprint =>
  exactFingerprint('derived-result-binding-recipe', sortById(bindings));

const fail = (
  code: CatalogInstanceCompileErrorCode,
  message: string,
  contentIds: readonly string[],
  inputFingerprint: CatalogInstanceFingerprint | null,
): CatalogInstanceCompileResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
    inputFingerprint,
  },
});

const patientInputPayload = (
  template: PatientTemplate,
  instance: Pick<
    PatientInstance,
    | 'templateRef'
    | 'seed'
    | 'conditionBindings'
    | 'patientState'
    | 'sharedFindingCompilation'
    | 'structuredStateReveals'
    | 'instrumentItemResponses'
    | 'targetScopedPatientValueReveals'
  >,
): unknown => {
  const findingById = new Map(
    instance.sharedFindingCompilation.findings.map((finding) => [finding.id, finding]),
  );
  return {
    template,
    templateRef: instance.templateRef,
    seed: instance.seed,
    conditionBindings: instance.conditionBindings,
    basePatientState: {
      ...instance.patientState,
      canonicalFindings: [],
      clinicalDurations: instance.patientState.clinicalDurations.filter(
        (duration) => duration.target.kind !== 'canonical_finding',
      ),
      subjectiveBurdenRecords: instance.patientState.subjectiveBurdenRecords.filter(
        (burden) => burden.target.kind !== 'canonical_finding',
      ),
    },
    deferredFindingScopedDurations: instance.patientState.clinicalDurations
      .filter((duration) => duration.target.kind === 'canonical_finding')
      .map((duration) => {
        const finding =
          duration.target.kind === 'canonical_finding'
            ? findingById.get(duration.target.canonicalFindingId)
            : undefined;
        return {
          ...duration,
          target: {
            kind: 'canonical_finding_definition',
            findingDefinitionId: finding?.definitionId,
            findingDefinitionContentVersion: finding?.definitionContentVersion,
          },
        };
      }),
    deferredFindingScopedSubjectiveBurdenRecords: instance.patientState.subjectiveBurdenRecords
      .filter((burden) => burden.target.kind === 'canonical_finding')
      .map((burden) => {
        const finding =
          burden.target.kind === 'canonical_finding'
            ? findingById.get(burden.target.canonicalFindingId)
            : undefined;
        return {
          ...burden,
          target: {
            kind: 'canonical_finding_definition',
            findingDefinitionId: finding?.definitionId,
            findingDefinitionContentVersion: finding?.definitionContentVersion,
          },
        };
      }),
    structuredStateReveals: instance.structuredStateReveals,
    instrumentItemResponses: instance.instrumentItemResponses,
    targetScopedPatientValueReveals: instance.targetScopedPatientValueReveals,
    sharedFindingInputFingerprint: instance.sharedFindingCompilation.inputFingerprint,
  };
};

const patientPayload = (instance: Omit<PatientInstance, 'id' | 'payloadFingerprint'>): unknown => ({
  schemaVersion: instance.schemaVersion,
  compilerVersion: instance.compilerVersion,
  templateRef: instance.templateRef,
  seed: instance.seed,
  conditionBindings: instance.conditionBindings,
  patientState: instance.patientState,
  sharedFindingCompilation: instance.sharedFindingCompilation,
  structuredStateReveals: instance.structuredStateReveals,
  instrumentItemResponses: instance.instrumentItemResponses,
  targetScopedPatientValueReveals: instance.targetScopedPatientValueReveals,
  inputFingerprint: instance.inputFingerprint,
});

const encounterInputPayload = (
  patientInstance: PatientInstance,
  location: LocationDefinition,
  encounter: Pick<
    EncounterInstance,
    | 'templateRef'
    | 'patientInstanceId'
    | 'locationRef'
    | 'locationFingerprint'
    | 'careSetting'
    | 'operationalAdmissionArtifactId'
    | 'operationalAdmissionFingerprint'
    | 'focusedDecisionId'
    | 'decisionActionHorizon'
    | 'decisionActionHorizonFingerprint'
    | 'diagnosisSelectionHorizon'
    | 'diagnosisSelectionHorizonFingerprint'
    | 'findingProjectionHorizon'
    | 'findingProjectionHorizonFingerprint'
    | 'sharedFindingCompilationId'
    | 'compiledRubric'
    | 'resultBindingRequests'
    | 'resultBindingRecipeFingerprint'
    | 'resultBindings'
  >,
): unknown => ({
  templateRef: encounter.templateRef,
  patientInstanceId: encounter.patientInstanceId,
  patientPayloadFingerprint: patientInstance.payloadFingerprint,
  location,
  locationRef: encounter.locationRef,
  locationFingerprint: encounter.locationFingerprint,
  careSetting: encounter.careSetting,
  operationalAdmissionArtifactId: encounter.operationalAdmissionArtifactId,
  operationalAdmissionFingerprint: encounter.operationalAdmissionFingerprint,
  focusedDecisionId: encounter.focusedDecisionId,
  decisionActionHorizon: encounter.decisionActionHorizon,
  decisionActionHorizonFingerprint: encounter.decisionActionHorizonFingerprint,
  diagnosisSelectionHorizon: encounter.diagnosisSelectionHorizon,
  diagnosisSelectionHorizonFingerprint: encounter.diagnosisSelectionHorizonFingerprint,
  findingProjectionHorizon: encounter.findingProjectionHorizon,
  findingProjectionHorizonFingerprint: encounter.findingProjectionHorizonFingerprint,
  sharedFindingCompilationId: encounter.sharedFindingCompilationId,
  rubricCompilerFingerprint: encounter.compiledRubric.compilerFingerprint,
  resultBindingRequests: encounter.resultBindingRequests,
  resultBindingRecipeFingerprint: encounter.resultBindingRecipeFingerprint,
  resultBindings: encounter.resultBindings,
});

const encounterPayload = (
  instance: Omit<EncounterInstance, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: instance.schemaVersion,
  compilerVersion: instance.compilerVersion,
  templateRef: instance.templateRef,
  patientInstanceId: instance.patientInstanceId,
  locationRef: instance.locationRef,
  locationFingerprint: instance.locationFingerprint,
  careSetting: instance.careSetting,
  operationalAdmissionArtifactId: instance.operationalAdmissionArtifactId,
  operationalAdmissionFingerprint: instance.operationalAdmissionFingerprint,
  focusedDecisionId: instance.focusedDecisionId,
  decisionActionHorizon: instance.decisionActionHorizon,
  decisionActionHorizonFingerprint: instance.decisionActionHorizonFingerprint,
  diagnosisSelectionHorizon: instance.diagnosisSelectionHorizon,
  diagnosisSelectionHorizonFingerprint: instance.diagnosisSelectionHorizonFingerprint,
  findingProjectionHorizon: instance.findingProjectionHorizon,
  findingProjectionHorizonFingerprint: instance.findingProjectionHorizonFingerprint,
  sharedFindingCompilationId: instance.sharedFindingCompilationId,
  compiledRubric: instance.compiledRubric,
  resultBindingRequests: instance.resultBindingRequests,
  resultBindingRecipeFingerprint: instance.resultBindingRecipeFingerprint,
  resultBindings: instance.resultBindings,
  inputFingerprint: instance.inputFingerprint,
});

const snapshotPayload = (
  snapshot: Omit<CatalogCompiledInstanceSnapshot, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: snapshot.schemaVersion,
  compilerVersion: snapshot.compilerVersion,
  requestId: snapshot.requestId,
  template: snapshot.template,
  location: snapshot.location,
  operationalAdmissionArtifact: snapshot.operationalAdmissionArtifact,
  patientInstance: snapshot.patientInstance,
  encounterInstance: snapshot.encounterInstance,
  universalActionResultAssemblyRecipe: snapshot.universalActionResultAssemblyRecipe,
  structuredSourceReportSelectionArtifact: snapshot.structuredSourceReportSelectionArtifact,
  structuredSourceReportArtifact: snapshot.structuredSourceReportArtifact,
  universalActionResultArtifact: snapshot.universalActionResultArtifact,
  instrumentItemResponseCompilation: snapshot.instrumentItemResponseCompilation,
  presentationRichnessEvaluation: snapshot.presentationRichnessEvaluation,
  inputFingerprint: snapshot.inputFingerprint,
});

const normalizeCurrentSelectedLocationResourceContext = (
  request: CatalogInstanceCompileRequest,
): CatalogInstanceCompileRequest['currentSelectedLocationResourceContext'] => {
  const normalized = normalizeSelectedLocationOperationalResourceContextRequest({
    schemaVersion: 1,
    id: request.operationalAdmissionArtifact.compileRequest.selectedLocationResourceArtifact
      .compileRequest.id,
    selectedLocation: request.location,
    ...request.currentSelectedLocationResourceContext,
  });
  const { schemaVersion, id, selectedLocation, ...resourceContext } = normalized;
  void schemaVersion;
  void id;
  void selectedLocation;
  return resourceContext;
};

const normalizeRequest = (request: CatalogInstanceCompileRequest): CatalogInstanceCompileRequest =>
  CatalogInstanceCompileRequestSchema.parse({
    ...request,
    template: normalizeTemplate(request.template),
    location: normalizeLocation(request.location),
    currentSelectedLocationResourceContext:
      normalizeCurrentSelectedLocationResourceContext(request),
    operationalAdmissionArtifact: request.operationalAdmissionArtifact,
    basePatientState: normalizePatientState(request.basePatientState),
    conditionBindings: sortById(request.conditionBindings),
    deferredFindingScopedDurations: sortById(request.deferredFindingScopedDurations),
    deferredFindingScopedSubjectiveBurdenRecords: sortById(
      request.deferredFindingScopedSubjectiveBurdenRecords,
    ),
    sharedFindingRequest: {
      ...request.sharedFindingRequest,
      projectionHorizon: normalizeProjectionHorizon(request.sharedFindingRequest.projectionHorizon),
    },
    decisionActionHorizon: normalizeDecisionActionHorizon(request.decisionActionHorizon),
    universalActionResultAssemblyRecipe: normalizeUniversalActionResultAssemblyRecipe(
      request.universalActionResultAssemblyRecipe,
    ),
    structuredSourceReportSelectionArtifact: request.structuredSourceReportSelectionArtifact,
  });

const freezeResultBindings = (
  bindings: readonly EncounterResultBindingRequest[],
  projections: PatientInstance['sharedFindingCompilation']['projections'],
  structuredStateReveals: readonly FrozenStructuredPatientStateReveal[],
  instrumentItemResponses: readonly FrozenInstrumentItemResponse[],
  targetScopedPatientValueReveals: readonly FrozenTargetScopedPatientValueReveal[],
):
  | { readonly ok: true; readonly value: EncounterResultBinding[] }
  | {
      readonly ok: false;
      readonly sourceId: string;
      readonly bindingId: string;
    } => {
  const projectionsByVersion = new Map(
    projections.map(
      (projection) =>
        [`${projection.projectionId}@${projection.projectionContentVersion}`, projection] as const,
    ),
  );
  const structuredRevealsById = new Map(
    structuredStateReveals.map((projection) => [projection.id, projection]),
  );
  const instrumentResponsesById = new Map(
    instrumentItemResponses.map((response) => [response.id, response]),
  );
  const targetScopedRevealsById = new Map(
    targetScopedPatientValueReveals.map((reveal) => [reveal.id, reveal]),
  );
  const frozen: EncounterResultBinding[] = [];
  for (const binding of bindings) {
    const sources: EncounterResultSourceReference[] = [];
    for (const source of binding.sources) {
      if (source.kind === 'finding_projection') {
        const projection = projectionsByVersion.get(
          `${source.projectionId}@${source.projectionContentVersion}`,
        );
        if (
          !projection ||
          projection.target.kind !== 'information_action' ||
          projection.target.actionId !== binding.informationActionId
        ) {
          return {
            ok: false,
            sourceId: source.projectionId,
            bindingId: binding.id,
          };
        }
        sources.push({
          kind: 'finding_projection',
          resolvedProjectionId: projection.id,
        });
      } else if (source.kind === 'structured_state_reveal') {
        const projection = structuredRevealsById.get(source.resolvedProjectionId);
        if (
          !projection ||
          projection.definitionId !== source.definitionId ||
          projection.definitionContentVersion !== source.definitionContentVersion ||
          projection.informationActionId !== binding.informationActionId
        ) {
          return {
            ok: false,
            sourceId: source.resolvedProjectionId,
            bindingId: binding.id,
          };
        }
        sources.push({
          kind: 'structured_state_reveal',
          resolvedProjectionId: projection.id,
        });
      } else if (source.kind === 'instrument_item_response') {
        const response = instrumentResponsesById.get(source.responseId);
        if (
          !response ||
          response.informationActionId !== binding.informationActionId ||
          response.instrumentDefinitionId !== source.instrumentDefinitionId ||
          response.instrumentContentVersion !== source.instrumentContentVersion ||
          response.itemId !== source.itemId
        ) {
          return {
            ok: false,
            sourceId: source.responseId,
            bindingId: binding.id,
          };
        }
        sources.push({
          kind: 'instrument_item_response',
          responseId: response.id,
        });
      } else if (source.kind === 'target_scoped_patient_value_reveal') {
        const reveal = targetScopedRevealsById.get(source.frozenRevealId);
        if (
          !reveal ||
          reveal.definitionId !== source.definitionId ||
          reveal.definitionContentVersion !== source.definitionContentVersion ||
          reveal.definitionFingerprint !== source.definitionFingerprint ||
          reveal.informationActionId !== binding.informationActionId
        ) {
          return {
            ok: false,
            sourceId: source.frozenRevealId,
            bindingId: binding.id,
          };
        }
        sources.push({
          kind: 'target_scoped_patient_value_reveal',
          frozenRevealId: reveal.id,
        });
      } else {
        sources.push({ ...source });
      }
    }
    frozen.push({
      schemaVersion: binding.schemaVersion,
      id: binding.id,
      informationActionId: binding.informationActionId,
      sources,
    });
  }
  return {
    ok: true,
    value: frozen,
  };
};

const freezeDeferredFindingScopedRecords = (
  request: CatalogInstanceCompileRequest,
  findings: PatientInstance['sharedFindingCompilation']['findings'],
):
  | {
      readonly ok: true;
      readonly durations: ResolvedPatientState['clinicalDurations'];
      readonly burdens: ResolvedPatientState['subjectiveBurdenRecords'];
    }
  | {
      readonly ok: false;
      readonly recordId: string;
      readonly findingDefinitionId: string;
    } => {
  const findingsByVersion = new Map(
    findings.map(
      (finding) =>
        [`${finding.definitionId}@${finding.definitionContentVersion}`, finding] as const,
    ),
  );
  const resolveTarget = (target: {
    readonly findingDefinitionId: string;
    readonly findingDefinitionContentVersion: string;
  }) =>
    findingsByVersion.get(
      `${target.findingDefinitionId}@${target.findingDefinitionContentVersion}`,
    );

  const durations: ResolvedPatientState['clinicalDurations'] = [];
  for (const duration of request.deferredFindingScopedDurations) {
    const finding = resolveTarget(duration.target);
    if (!finding) {
      return {
        ok: false,
        recordId: duration.id,
        findingDefinitionId: duration.target.findingDefinitionId,
      };
    }
    durations.push({
      ...duration,
      target: {
        kind: 'canonical_finding',
        canonicalFindingId: finding.id,
      },
    });
  }
  const burdens: ResolvedPatientState['subjectiveBurdenRecords'] = [];
  for (const burden of request.deferredFindingScopedSubjectiveBurdenRecords) {
    const finding = resolveTarget(burden.target);
    if (!finding) {
      return {
        ok: false,
        recordId: burden.id,
        findingDefinitionId: burden.target.findingDefinitionId,
      };
    }
    burdens.push({
      ...burden,
      target: {
        kind: 'canonical_finding',
        canonicalFindingId: finding.id,
      },
    });
  }
  return { ok: true, durations, burdens };
};

const compileTargetScopedPatientValueAttachment = (input: {
  readonly patientState: ResolvedPatientState;
  readonly assemblyRecipe: UniversalActionResultAssemblyRecipe;
  readonly assemblyRecipeFingerprint: ReturnType<
    typeof fingerprintUniversalActionResultAssemblyRecipe
  >;
}):
  | {
      readonly ok: true;
      readonly artifact: TargetScopedPatientValueProjectionArtifact | null;
    }
  | {
      readonly ok: false;
      readonly message: string;
      readonly contentIds: readonly string[];
    } => {
  const definitions = input.assemblyRecipe.targetScopedPatientValueProjectionDefinitions;
  if (definitions.length === 0) return { ok: true, artifact: null };
  const referencedActionIds = new Set(
    definitions.map((definition) => definition.informationActionId),
  );
  const informationActions = input.assemblyRecipe.actionCatalog.actions.filter((action) =>
    referencedActionIds.has(action.id),
  );
  const requestPayload = {
    patientStateId: input.patientState.id,
    informationActionIds: informationActions.map((action) => action.id),
    definitionRefs: definitions.map((definition) => ({
      id: definition.id,
      contentVersion: definition.contentVersion,
    })),
    assemblyRecipeId: input.assemblyRecipe.id,
    assemblyRecipeFingerprint: input.assemblyRecipeFingerprint,
  };
  const compilation = compileTargetScopedPatientValueProjections({
    schemaVersion: 1,
    id: stableId(
      'target-scoped-patient-value-projection-request',
      exactFingerprint('target-scoped-patient-value-projection-request', requestPayload),
    ),
    patientState: input.patientState,
    informationActions,
    definitions,
  });
  return compilation.ok
    ? { ok: true, artifact: compilation.value }
    : {
        ok: false,
        message: `${compilation.error.code}: ${compilation.error.message}`,
        contentIds: compilation.error.contentIds,
      };
};

const buildStructuredRevealEnvelopes = (input: {
  readonly assemblyRecipe: UniversalActionResultAssemblyRecipe;
  readonly projectionRecipes: readonly StructuredPatientStateRevealProjectionRecipe[];
  readonly patientState: ResolvedPatientState;
}):
  | {
      readonly ok: true;
      readonly value: StructuredPatientStateRevealProjectionEnvelope[];
    }
  | {
      readonly ok: false;
      readonly message: string;
      readonly contentIds: readonly string[];
    } => {
  const definitionsByVersion = new Map(
    input.assemblyRecipe.structuredRevealDefinitions.map((definition) => [
      `${definition.id}\u0000${definition.contentVersion}`,
      definition,
    ]),
  );
  const envelopes: StructuredPatientStateRevealProjectionEnvelope[] = [];
  for (const projectionRecipe of input.projectionRecipes) {
    const definition = definitionsByVersion.get(
      `${projectionRecipe.definition.id}\u0000${projectionRecipe.definition.contentVersion}`,
    );
    if (!definition || !sameExactValue(definition, projectionRecipe.definition)) {
      return {
        ok: false,
        message:
          'A detached structured reveal source must use one exact definition from the template-pinned assembly recipe.',
        contentIds: [
          projectionRecipe.resolved.id,
          projectionRecipe.definition.id,
          input.assemblyRecipe.id,
        ],
      };
    }
    const parsed = StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse({
      definition,
      patientState: input.patientState,
      resolved: projectionRecipe.resolved,
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: issuesText(parsed.error.issues),
        contentIds: [
          projectionRecipe.resolved.id,
          projectionRecipe.definition.id,
          input.patientState.id,
        ],
      };
    }
    envelopes.push(normalizeStructuredRevealEnvelope(parsed.data));
  }
  return {
    ok: true,
    value: envelopes.sort((left, right) => compareStrings(left.resolved.id, right.resolved.id)),
  };
};

const verifyStructuredSourceReportSelectionContext = (input: {
  readonly template: PatientTemplate;
  readonly assemblyRecipe: UniversalActionResultAssemblyRecipe;
  readonly selectionArtifact: StructuredSourceReportSelectionArtifact;
  readonly seed: string;
}):
  | {
      readonly ok: true;
      readonly value: StructuredSourceReportSelectionArtifact;
    }
  | {
      readonly ok: false;
      readonly message: string;
      readonly contentIds: readonly string[];
    } => {
  const selectionIntegrity = verifyStructuredSourceReportBehaviorSelectionIntegrity(
    input.selectionArtifact,
  );
  if (!selectionIntegrity.ok) {
    return {
      ok: false,
      message: `${selectionIntegrity.error.code}: ${selectionIntegrity.error.message}`,
      contentIds: [input.selectionArtifact.id],
    };
  }
  const selection = selectionIntegrity.value;
  const expectedTemplateFingerprint = fingerprintStructuredSourceReportSelectionTemplate(
    input.template,
  );
  const expectedAssemblyFingerprint = fingerprintStructuredSourceReportSelectionAssembly(
    input.assemblyRecipe,
  );
  if (
    selection.seed !== input.seed ||
    selection.careSetting !== input.template.careSetting ||
    selection.templateRef.id !== input.template.id ||
    selection.templateRef.contentVersion !== input.template.contentVersion ||
    selection.templateRef.fingerprint !== expectedTemplateFingerprint ||
    selection.assemblyRecipeRef.id !== input.assemblyRecipe.id ||
    selection.assemblyRecipeRef.contentVersion !== input.assemblyRecipe.contentVersion ||
    selection.assemblyRecipeRef.fingerprint !== expectedAssemblyFingerprint
  ) {
    return {
      ok: false,
      message:
        'The source-report behavior selection must pin the exact patient seed, template, static assembly, and care setting being compiled.',
      contentIds: [selection.id, input.template.id, input.assemblyRecipe.id],
    };
  }
  return { ok: true, value: selection };
};

const compileStructuredSourceReportAttachment = (input: {
  readonly template: PatientTemplate;
  readonly assemblyRecipe: UniversalActionResultAssemblyRecipe;
  readonly selectionArtifact: StructuredSourceReportSelectionArtifact;
  readonly patientState: ResolvedPatientState;
  readonly seed: string;
}):
  | {
      readonly ok: true;
      readonly selectionArtifact: StructuredSourceReportSelectionArtifact;
      readonly reportArtifact: StructuredSourceReportArtifact;
      readonly envelopes: StructuredPatientStateRevealProjectionEnvelope[];
    }
  | {
      readonly ok: false;
      readonly stage: 'selection' | 'report' | 'envelope';
      readonly message: string;
      readonly contentIds: readonly string[];
    } => {
  const selectionContext = verifyStructuredSourceReportSelectionContext(input);
  if (!selectionContext.ok) {
    return {
      ok: false,
      stage: 'selection',
      message: selectionContext.message,
      contentIds: selectionContext.contentIds,
    };
  }
  const selection = selectionContext.value;
  const selectedProfiles = getSelectedStructuredSourceReportProfiles(selection);
  if (!selectedProfiles.ok) {
    return {
      ok: false,
      stage: 'selection',
      message: `${selectedProfiles.error.code}: ${selectedProfiles.error.message}`,
      contentIds: [selection.id],
    };
  }
  const definitions = [...input.assemblyRecipe.structuredRevealDefinitions]
    .map(normalizeStructuredSourceReportDefinition)
    .sort((left, right) =>
      compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
    );
  const profiles = [...selectedProfiles.value]
    .map(normalizeStructuredSourceReportProfile)
    .sort((left, right) =>
      compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
    );
  const patientState = normalizeResolvedPatientState(input.patientState);
  const requestPayload = {
    selectionArtifactId: selection.id,
    selectionPayloadFingerprint: selection.payloadFingerprint,
    patientState,
    definitions,
    profiles,
  };
  const reportCompilation = compileStructuredSourceReports({
    schemaVersion: 1,
    id: stableId(
      'structured-source-report-request',
      exactFingerprint('structured-source-report-request', requestPayload),
    ),
    patientState,
    definitions,
    profiles,
  });
  if (!reportCompilation.ok) {
    return {
      ok: false,
      stage: 'report',
      message: `${reportCompilation.error.code}: ${reportCompilation.error.message}`,
      contentIds: reportCompilation.error.contentIds,
    };
  }
  const envelopes = buildStructuredRevealEnvelopes({
    assemblyRecipe: input.assemblyRecipe,
    projectionRecipes: reportCompilation.value.projectionRecipes,
    patientState,
  });
  if (!envelopes.ok) {
    return {
      ok: false,
      stage: 'envelope',
      message: envelopes.message,
      contentIds: envelopes.contentIds,
    };
  }
  return {
    ok: true,
    selectionArtifact: selection,
    reportArtifact: reportCompilation.value,
    envelopes: envelopes.value,
  };
};

export const verifyCatalogCompiledInstanceIntegrity = (
  value: unknown,
): CatalogInstanceIntegrityResult => {
  const parsed = CatalogCompiledInstanceSnapshotSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  const snapshot = parsed.data;
  if (snapshot.compilerVersion !== CATALOG_INSTANCE_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${snapshot.id} uses unsupported catalog-instance compiler ${snapshot.compilerVersion}.`,
      },
    };
  }

  const operationalAdmissionIntegrity = verifyEncounterOperationalAdmissionIntegrity(
    snapshot.operationalAdmissionArtifact,
  );
  if (!operationalAdmissionIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'OPERATIONAL_ADMISSION_INTEGRITY_INVALID',
        message: operationalAdmissionIntegrity.error.message,
      },
    };
  }
  const operationalAdmissionContext = verifyEncounterOperationalAdmissionContext({
    artifact: operationalAdmissionIntegrity.value,
    template: snapshot.template,
    location: snapshot.location,
    selectedLocationResourceArtifact:
      snapshot.operationalAdmissionArtifact.compileRequest.selectedLocationResourceArtifact,
    actionHorizon: snapshot.encounterInstance.decisionActionHorizon,
    actionCatalog: snapshot.universalActionResultAssemblyRecipe.actionCatalog,
  });
  if (
    !operationalAdmissionContext.ok ||
    snapshot.encounterInstance.operationalAdmissionArtifactId !==
      operationalAdmissionIntegrity.value.id ||
    snapshot.encounterInstance.operationalAdmissionFingerprint !==
      operationalAdmissionIntegrity.value.payloadFingerprint
  ) {
    return {
      ok: false,
      error: {
        code: 'OPERATIONAL_ADMISSION_CONTEXT_MISMATCH',
        message: operationalAdmissionContext.ok
          ? 'The encounter does not pin its exact verified operational-admission artifact.'
          : operationalAdmissionContext.error.message,
      },
    };
  }

  const findingIntegrity = verifyCompiledSharedFindingIntegrity(
    snapshot.patientInstance.sharedFindingCompilation,
  );
  if (!findingIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'SHARED_FINDING_INTEGRITY_INVALID',
        message: findingIntegrity.error.message,
      },
    };
  }
  const findingSeedContext = verifyCompiledSharedFindingSeedContext({
    compiled: findingIntegrity.value,
    seed: snapshot.patientInstance.seed,
  });
  if (!findingSeedContext.ok) {
    return {
      ok: false,
      error: {
        code: 'PROJECTION_SEED_CONTEXT_MISMATCH',
        message: findingSeedContext.error.message,
      },
    };
  }
  const findingContext = verifyCompiledSharedFindingContext({
    compiled: findingIntegrity.value,
    projectionHorizon: snapshot.encounterInstance.findingProjectionHorizon,
  });
  if (!findingContext.ok) {
    return {
      ok: false,
      error: {
        code: 'PROJECTION_HORIZON_CONTEXT_MISMATCH',
        message: findingContext.error.message,
      },
    };
  }
  const recipeFingerprints = fingerprintCatalogInstanceRecipe({
    decisionActionHorizon: snapshot.encounterInstance.decisionActionHorizon,
    diagnosisSelectionHorizon: snapshot.encounterInstance.diagnosisSelectionHorizon,
    findingProjectionHorizon: snapshot.encounterInstance.findingProjectionHorizon,
    universalActionResultAssemblyRecipe: snapshot.universalActionResultAssemblyRecipe,
  });
  const derivedResultBindingFingerprint = fingerprintDerivedResultBindings(
    snapshot.encounterInstance.resultBindingRequests,
  );
  if (
    snapshot.template.decisionActionHorizonFingerprint !==
      recipeFingerprints.decisionActionHorizonFingerprint ||
    snapshot.encounterInstance.decisionActionHorizonFingerprint !==
      recipeFingerprints.decisionActionHorizonFingerprint ||
    snapshot.template.diagnosisSelectionHorizonFingerprint !==
      recipeFingerprints.diagnosisSelectionHorizonFingerprint ||
    snapshot.encounterInstance.diagnosisSelectionHorizonFingerprint !==
      recipeFingerprints.diagnosisSelectionHorizonFingerprint ||
    snapshot.template.findingProjectionHorizonFingerprint !==
      recipeFingerprints.findingProjectionHorizonFingerprint ||
    snapshot.encounterInstance.findingProjectionHorizonFingerprint !==
      recipeFingerprints.findingProjectionHorizonFingerprint ||
    snapshot.template.universalActionResultAssemblyRecipeRef.id !==
      snapshot.universalActionResultAssemblyRecipe.id ||
    snapshot.template.universalActionResultAssemblyRecipeRef.contentVersion !==
      snapshot.universalActionResultAssemblyRecipe.contentVersion ||
    snapshot.template.universalActionResultAssemblyRecipeFingerprint !==
      recipeFingerprints.universalActionResultAssemblyRecipeFingerprint ||
    snapshot.encounterInstance.resultBindingRecipeFingerprint !== derivedResultBindingFingerprint
  ) {
    return {
      ok: false,
      error: {
        code: 'TEMPLATE_RECIPE_FINGERPRINT_MISMATCH',
        message: `${snapshot.template.id} does not pin the exact action, diagnosis, projection, and universal action-result assembly attached to ${snapshot.encounterInstance.id}.`,
      },
    };
  }

  const expectedTargetScopedPatientValues = compileTargetScopedPatientValueAttachment({
    patientState: snapshot.patientInstance.patientState,
    assemblyRecipe: snapshot.universalActionResultAssemblyRecipe,
    assemblyRecipeFingerprint: recipeFingerprints.universalActionResultAssemblyRecipeFingerprint,
  });
  if (!expectedTargetScopedPatientValues.ok) {
    return {
      ok: false,
      error: {
        code: 'TARGET_SCOPED_PATIENT_VALUE_CONTEXT_MISMATCH',
        message: expectedTargetScopedPatientValues.message,
      },
    };
  }
  const nestedTargetScopedPatientValues =
    snapshot.universalActionResultArtifact.compileRequest
      .targetScopedPatientValueProjectionArtifact;
  if (
    !sameExactValue(expectedTargetScopedPatientValues.artifact, nestedTargetScopedPatientValues)
  ) {
    return {
      ok: false,
      error: {
        code: 'TARGET_SCOPED_PATIENT_VALUE_CONTEXT_MISMATCH',
        message:
          'The D-213 request does not retain the exact D-240 replay for the final patient state and template-pinned target-scoped definition horizon.',
      },
    };
  }
  if (nestedTargetScopedPatientValues !== null) {
    const targetScopedIntegrity = verifyTargetScopedPatientValueProjectionArtifactIntegrity(
      nestedTargetScopedPatientValues,
    );
    if (!targetScopedIntegrity.ok) {
      return {
        ok: false,
        error: {
          code: 'TARGET_SCOPED_PATIENT_VALUE_INTEGRITY_INVALID',
          message: targetScopedIntegrity.error.message,
        },
      };
    }
  }

  const hasStructuredRevealDefinitions =
    snapshot.universalActionResultAssemblyRecipe.structuredRevealDefinitions.length > 0;
  let expectedStructuredRevealEnvelopes: StructuredPatientStateRevealProjectionEnvelope[] = [];
  if (!hasStructuredRevealDefinitions) {
    if (
      snapshot.structuredSourceReportSelectionArtifact !== null ||
      snapshot.structuredSourceReportArtifact !== null
    ) {
      return {
        ok: false,
        error: {
          code: 'STRUCTURED_SOURCE_REPORT_SELECTION_CONTEXT_MISMATCH',
          message:
            'An empty structured reveal definition horizon must retain null source-report selection and compilation artifacts.',
        },
      };
    }
  } else {
    if (
      snapshot.structuredSourceReportSelectionArtifact === null ||
      snapshot.structuredSourceReportArtifact === null
    ) {
      return {
        ok: false,
        error: {
          code: 'STRUCTURED_SOURCE_REPORT_SELECTION_CONTEXT_MISMATCH',
          message:
            'A nonempty structured reveal definition horizon requires both source-report artifacts.',
        },
      };
    }
    const selectionIntegrity = verifyStructuredSourceReportBehaviorSelectionIntegrity(
      snapshot.structuredSourceReportSelectionArtifact,
    );
    if (!selectionIntegrity.ok) {
      return {
        ok: false,
        error: {
          code: 'STRUCTURED_SOURCE_REPORT_SELECTION_INTEGRITY_INVALID',
          message: selectionIntegrity.error.message,
        },
      };
    }
    const reportIntegrity = verifyStructuredSourceReportArtifactIntegrity(
      snapshot.structuredSourceReportArtifact,
    );
    if (!reportIntegrity.ok) {
      return {
        ok: false,
        error: {
          code: 'STRUCTURED_SOURCE_REPORT_INTEGRITY_INVALID',
          message: reportIntegrity.error.message,
        },
      };
    }
    const replayedAttachment = compileStructuredSourceReportAttachment({
      template: snapshot.template,
      assemblyRecipe: snapshot.universalActionResultAssemblyRecipe,
      selectionArtifact: selectionIntegrity.value,
      patientState: snapshot.patientInstance.patientState,
      seed: snapshot.patientInstance.seed,
    });
    if (!replayedAttachment.ok) {
      return {
        ok: false,
        error: {
          code:
            replayedAttachment.stage === 'selection'
              ? 'STRUCTURED_SOURCE_REPORT_SELECTION_CONTEXT_MISMATCH'
              : 'STRUCTURED_SOURCE_REPORT_CONTEXT_MISMATCH',
          message: replayedAttachment.message,
        },
      };
    }
    if (
      !sameExactValue(
        replayedAttachment.selectionArtifact,
        snapshot.structuredSourceReportSelectionArtifact,
      ) ||
      !sameExactValue(replayedAttachment.reportArtifact, reportIntegrity.value) ||
      !sameExactValue(
        reportIntegrity.value.compileRequest.patientState,
        snapshot.patientInstance.patientState,
      ) ||
      !sameExactValue(
        reportIntegrity.value.compileRequest.definitions,
        snapshot.universalActionResultAssemblyRecipe.structuredRevealDefinitions,
      )
    ) {
      return {
        ok: false,
        error: {
          code: 'STRUCTURED_SOURCE_REPORT_CONTEXT_MISMATCH',
          message:
            'The source-report artifacts do not replay from the exact selected profiles, final patient state, and template-pinned definitions.',
        },
      };
    }
    expectedStructuredRevealEnvelopes = replayedAttachment.envelopes;
  }

  const instrumentResponseIntegrity = verifyInstrumentItemResponseCompilationIntegrity(
    snapshot.instrumentItemResponseCompilation,
  );
  if (!instrumentResponseIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INSTRUMENT_ITEM_RESPONSE_INTEGRITY_INVALID',
        message: instrumentResponseIntegrity.error.message,
      },
    };
  }
  const instrumentResponseArtifact = instrumentResponseIntegrity.value;
  const expectedInstrumentActionHorizon = deriveInstrumentInformationActionHorizon(
    snapshot.encounterInstance.decisionActionHorizon,
  );
  if (
    instrumentResponseArtifact.status !== 'complete' ||
    instrumentResponseArtifact.patientStateId !== snapshot.patientInstance.patientState.id ||
    !sameExactValue(
      instrumentResponseArtifact.compileRequest.sharedFindingCompilation,
      snapshot.patientInstance.sharedFindingCompilation,
    ) ||
    !sameExactValue(
      instrumentResponseArtifact.compileRequest.findingProjectionHorizon,
      snapshot.encounterInstance.findingProjectionHorizon,
    ) ||
    !sameExactValue(
      instrumentResponseArtifact.compileRequest.actionCatalog,
      snapshot.universalActionResultAssemblyRecipe.actionCatalog,
    ) ||
    !sameExactValue(
      instrumentResponseArtifact.compileRequest.actionHorizon,
      expectedInstrumentActionHorizon,
    ) ||
    !sameExactValue(
      instrumentResponseArtifact.compileRequest.instrumentDefinitions,
      snapshot.universalActionResultAssemblyRecipe.instrumentDefinitions,
    )
  ) {
    return {
      ok: false,
      error: {
        code: 'INSTRUMENT_ITEM_RESPONSE_CONTEXT_MISMATCH',
        message:
          'The D-220 artifact does not retain the exact patient, D-193 output, projection horizon, information-action context, and template-pinned instrument definitions.',
      },
    };
  }

  const actionResultIntegrity = verifyUniversalActionResultArtifactIntegrity(
    snapshot.universalActionResultArtifact,
  );
  if (!actionResultIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'UNIVERSAL_ACTION_RESULT_INTEGRITY_INVALID',
        message: actionResultIntegrity.error.message,
      },
    };
  }
  const actionResult = actionResultIntegrity.value;
  const actionResultRequest = actionResult.compileRequest;
  if (
    actionResult.status !== 'complete' ||
    !sameExactValue(actionResultRequest.patientState, snapshot.patientInstance.patientState) ||
    !sameExactValue(
      actionResultRequest.actionCatalog,
      snapshot.universalActionResultAssemblyRecipe.actionCatalog,
    ) ||
    !sameExactValue(
      actionResultRequest.actionHorizon,
      snapshot.encounterInstance.decisionActionHorizon,
    ) ||
    !sameExactValue(
      actionResultRequest.sharedFindingCompilation,
      snapshot.patientInstance.sharedFindingCompilation,
    ) ||
    !sameExactValue(
      actionResultRequest.findingProjectionHorizon,
      snapshot.encounterInstance.findingProjectionHorizon,
    ) ||
    !sameExactValue(
      actionResultRequest.instrumentItemResponseCompilation,
      instrumentResponseArtifact,
    ) ||
    !sameExactValue(
      actionResultRequest.targetScopedPatientValueProjectionArtifact,
      expectedTargetScopedPatientValues.artifact,
    ) ||
    !sameExactValue(
      actionResultRequest.measurementDefinitions,
      snapshot.universalActionResultAssemblyRecipe.measurementDefinitions,
    ) ||
    !sameExactValue(
      actionResultRequest.categoricalObservationDefinitions,
      snapshot.universalActionResultAssemblyRecipe.categoricalObservationDefinitions,
    ) ||
    !sameExactValue(
      actionResultRequest.testDefinitions,
      snapshot.universalActionResultAssemblyRecipe.testDefinitions,
    ) ||
    !sameExactValue(
      actionResultRequest.recipes,
      snapshot.universalActionResultAssemblyRecipe.recipes,
    ) ||
    !sameExactValue(
      expectedStructuredRevealEnvelopes,
      actionResultRequest.structuredRevealEnvelopes,
    )
  ) {
    return {
      ok: false,
      error: {
        code: 'UNIVERSAL_ACTION_RESULT_CONTEXT_MISMATCH',
        message: `${actionResult.id} does not retain the exact final patient state, D-193 output, D-212 views, D-240 target-scoped values, horizons, and template-pinned static assembly.`,
      },
    };
  }
  const translated = translateUniversalActionResultArtifact(
    actionResult,
    snapshot.encounterInstance.decisionActionHorizon.informationActionIds,
  );
  if (
    !translated.ok ||
    !sameExactValue(
      translated.value.resultBindingRequests,
      snapshot.encounterInstance.resultBindingRequests,
    ) ||
    !sameExactValue(
      translated.value.structuredStateReveals,
      snapshot.patientInstance.structuredStateReveals,
    ) ||
    !sameExactValue(
      translated.value.instrumentItemResponses,
      snapshot.patientInstance.instrumentItemResponses,
    ) ||
    !sameExactValue(
      translated.value.targetScopedPatientValueReveals,
      snapshot.patientInstance.targetScopedPatientValueReveals,
    )
  ) {
    return {
      ok: false,
      error: {
        code: 'UNIVERSAL_ACTION_RESULT_CONTEXT_MISMATCH',
        message: translated.ok
          ? `${actionResult.id} does not derive the exact frozen request and safe structured-source views.`
          : translated.error.message,
      },
    };
  }
  const reboundResults = freezeResultBindings(
    snapshot.encounterInstance.resultBindingRequests,
    snapshot.patientInstance.sharedFindingCompilation.projections,
    snapshot.patientInstance.structuredStateReveals,
    snapshot.patientInstance.instrumentItemResponses,
    snapshot.patientInstance.targetScopedPatientValueReveals,
  );
  if (
    !reboundResults.ok ||
    JSON.stringify(canonicalizeObjectKeys(reboundResults.value)) !==
      JSON.stringify(canonicalizeObjectKeys(snapshot.encounterInstance.resultBindings))
  ) {
    return {
      ok: false,
      error: {
        code: 'RESULT_BINDING_CONTEXT_MISMATCH',
        message: `${snapshot.encounterInstance.id} does not retain the exact selector-to-frozen-result resolution for its patient projections.`,
      },
    };
  }

  const rubricIntegrity = verifyCompiledRubricIntegrity(snapshot.encounterInstance.compiledRubric);
  if (!rubricIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'RUBRIC_INTEGRITY_INVALID',
        message: rubricIntegrity.error.message,
      },
    };
  }
  const rubricContext = verifyCompiledRubricContext({
    rubric: rubricIntegrity.value,
    patientState: snapshot.patientInstance.patientState,
    actionHorizon: snapshot.encounterInstance.decisionActionHorizon,
  });
  if (!rubricContext.ok) {
    return {
      ok: false,
      error: {
        code: 'RUBRIC_CONTEXT_MISMATCH',
        message: rubricContext.error.message,
      },
    };
  }
  const richnessContext = verifyPresentationRichnessContext({
    evaluation: snapshot.presentationRichnessEvaluation,
    templateRef: {
      id: snapshot.template.id,
      contentVersion: snapshot.template.contentVersion,
    },
    envelope: snapshot.template.presentationRichnessEnvelope,
    patientState: snapshot.patientInstance.patientState,
  });
  if (!richnessContext.ok) {
    return {
      ok: false,
      error: {
        code:
          richnessContext.error.code === 'INVALID_EVALUATION'
            ? 'PRESENTATION_RICHNESS_INTEGRITY_INVALID'
            : 'PRESENTATION_RICHNESS_CONTEXT_MISMATCH',
        message: richnessContext.error.message,
      },
    };
  }
  const expectedLocationFingerprint = exactFingerprint('location', snapshot.location);
  if (snapshot.encounterInstance.locationFingerprint !== expectedLocationFingerprint) {
    return {
      ok: false,
      error: {
        code: 'LOCATION_FINGERPRINT_MISMATCH',
        message: `${snapshot.location.id} does not match the exact location payload frozen into ${snapshot.encounterInstance.id}.`,
      },
    };
  }

  const expectedPatientInputFingerprint = fingerprint(
    'patient-input',
    patientInputPayload(snapshot.template, snapshot.patientInstance),
  );
  if (snapshot.patientInstance.inputFingerprint !== expectedPatientInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'PATIENT_INPUT_FINGERPRINT_MISMATCH',
        message: `${snapshot.patientInstance.id} does not retain its exact template, seed, base-state, binding, and finding-input attachment.`,
      },
    };
  }
  const expectedPatientPayloadFingerprint = exactFingerprint(
    'patient-output',
    patientPayload(snapshot.patientInstance),
  );
  if (
    snapshot.patientInstance.payloadFingerprint !== expectedPatientPayloadFingerprint ||
    snapshot.patientInstance.id !== stableId('patient-instance', expectedPatientPayloadFingerprint)
  ) {
    return {
      ok: false,
      error: {
        code: 'PATIENT_PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${snapshot.patientInstance.id} does not match its frozen patient payload.`,
      },
    };
  }

  const expectedEncounterInputFingerprint = fingerprint(
    'encounter-input',
    encounterInputPayload(snapshot.patientInstance, snapshot.location, snapshot.encounterInstance),
  );
  if (snapshot.encounterInstance.inputFingerprint !== expectedEncounterInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'ENCOUNTER_INPUT_FINGERPRINT_MISMATCH',
        message: `${snapshot.encounterInstance.id} does not retain its exact patient, location, horizon, rubric, and result attachment.`,
      },
    };
  }
  const expectedEncounterPayloadFingerprint = exactFingerprint(
    'encounter-output',
    encounterPayload(snapshot.encounterInstance),
  );
  if (
    snapshot.encounterInstance.payloadFingerprint !== expectedEncounterPayloadFingerprint ||
    snapshot.encounterInstance.id !==
      stableId('encounter-instance', expectedEncounterPayloadFingerprint)
  ) {
    return {
      ok: false,
      error: {
        code: 'ENCOUNTER_PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${snapshot.encounterInstance.id} does not match its frozen encounter payload.`,
      },
    };
  }

  const expectedSnapshotPayloadFingerprint = exactFingerprint(
    'snapshot-output',
    snapshotPayload(snapshot),
  );
  if (
    snapshot.payloadFingerprint !== expectedSnapshotPayloadFingerprint ||
    snapshot.id !== stableId('catalog-instance-snapshot', expectedSnapshotPayloadFingerprint)
  ) {
    return {
      ok: false,
      error: {
        code: 'SNAPSHOT_PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${snapshot.id} does not match its atomic catalog-instance snapshot.`,
      },
    };
  }

  return { ok: true, value: snapshot };
};

/**
 * Attaches already-resolved, synthetic authoring inputs into exact frozen
 * patient and encounter snapshots. It deliberately performs no clinical
 * probability draw, optional-module selection, presentation generation,
 * scoring, persistence, or compatibility-case migration.
 */
export const compileCatalogInstances = (input: unknown): CatalogInstanceCompileResult => {
  const parsed = CatalogInstanceCompileRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), [], null);
  }
  const request = normalizeRequest(parsed.data);
  const requestFingerprint = fingerprint('request', request);
  const template = PatientTemplateSchema.parse(request.template);

  const operationalAdmissionIntegrity = verifyEncounterOperationalAdmissionIntegrity(
    request.operationalAdmissionArtifact,
  );
  if (!operationalAdmissionIntegrity.ok) {
    return fail(
      'OPERATIONAL_ADMISSION_MISMATCH',
      `${operationalAdmissionIntegrity.error.code}: ${operationalAdmissionIntegrity.error.message}`,
      [template.id, request.location.id, request.operationalAdmissionArtifact.id],
      requestFingerprint,
    );
  }
  const currentSelectedLocationResourceContext = verifySelectedLocationOperationalResourceContext({
    artifact: operationalAdmissionIntegrity.value.compileRequest.selectedLocationResourceArtifact,
    clinicOperationalContext:
      request.currentSelectedLocationResourceContext.clinicOperationalContext,
    facility: request.currentSelectedLocationResourceContext.facility,
    selectedLocation: request.location,
    assignmentHorizon: request.currentSelectedLocationResourceContext.assignmentHorizon,
    upgradeOwners: request.currentSelectedLocationResourceContext.upgradeOwners,
    formularyOwners: request.currentSelectedLocationResourceContext.formularyOwners,
  });
  if (!currentSelectedLocationResourceContext.ok) {
    return fail(
      'OPERATIONAL_ADMISSION_MISMATCH',
      `${currentSelectedLocationResourceContext.error.code}: ${currentSelectedLocationResourceContext.error.message}`,
      [
        template.id,
        request.location.id,
        request.operationalAdmissionArtifact.id,
        request.currentSelectedLocationResourceContext.clinicOperationalContext.clinicStateId,
      ],
      requestFingerprint,
    );
  }
  const operationalAdmissionContext = verifyEncounterOperationalAdmissionContext({
    artifact: operationalAdmissionIntegrity.value,
    template,
    location: request.location,
    selectedLocationResourceArtifact: currentSelectedLocationResourceContext.value,
    actionHorizon: request.decisionActionHorizon,
    actionCatalog: request.universalActionResultAssemblyRecipe.actionCatalog,
  });
  if (!operationalAdmissionContext.ok) {
    return fail(
      'OPERATIONAL_ADMISSION_MISMATCH',
      `${operationalAdmissionContext.error.code}: ${operationalAdmissionContext.error.message}`,
      operationalAdmissionContext.error.contentIds,
      requestFingerprint,
    );
  }
  const operationalAdmissionArtifact: EncounterOperationalAdmissionArtifact =
    operationalAdmissionContext.value;

  if (request.basePatientState.canonicalFindings.length > 0) {
    return fail(
      'BASE_FINDINGS_NOT_EMPTY',
      'The attachment-only compiler requires canonical findings to be supplied exclusively by the shared-finding compiler.',
      [
        request.basePatientState.id,
        ...request.basePatientState.canonicalFindings.map((finding) => finding.id),
      ],
      requestFingerprint,
    );
  }
  if (request.sharedFindingRequest.patientStateId !== request.basePatientState.id) {
    return fail(
      'PATIENT_STATE_ID_MISMATCH',
      'The shared-finding request must target the supplied base patient state.',
      [request.sharedFindingRequest.patientStateId, request.basePatientState.id],
      requestFingerprint,
    );
  }
  if (
    !sameCanonicalValue(
      request.sharedFindingRequest.propositionState,
      request.basePatientState.propositionState,
    )
  ) {
    return fail(
      'PROPOSITION_STATE_MISMATCH',
      'The shared-finding request must preserve the exact frozen proposition/evidence state.',
      [
        request.sharedFindingRequest.propositionState.id,
        request.basePatientState.propositionState.id,
      ],
      requestFingerprint,
    );
  }
  if (
    !template.compatibleLocationRefs.some(
      (reference) =>
        reference.id === request.location.id &&
        reference.contentVersion === request.location.contentVersion,
    )
  ) {
    return fail(
      'TEMPLATE_LOCATION_MISMATCH',
      'The supplied location is not an exact version admitted by the patient template.',
      [template.id, request.location.id],
      requestFingerprint,
    );
  }
  if (template.careSetting !== request.location.careSetting) {
    return fail(
      'TEMPLATE_CARE_SETTING_MISMATCH',
      'The patient template and exact physical location must share one encounter care setting.',
      [template.id, request.location.id],
      requestFingerprint,
    );
  }
  if (
    template.primaryPolicyRef.id !== request.decisionPolicy.id ||
    template.primaryPolicyRef.contentVersion !== request.decisionPolicy.contentVersion
  ) {
    return fail(
      'TEMPLATE_POLICY_MISMATCH',
      'The supplied decision policy does not match the exact policy version pinned by the template.',
      [template.id, template.primaryPolicyRef.id, request.decisionPolicy.id],
      requestFingerprint,
    );
  }
  if (template.focusedDecisionId !== request.decisionPolicy.focusedDecisionId) {
    return fail(
      'TEMPLATE_DECISION_MISMATCH',
      'The decision policy does not preserve the focused decision pinned by the template.',
      [template.id, template.focusedDecisionId, request.decisionPolicy.id],
      requestFingerprint,
    );
  }
  if (
    template.decisionActionHorizonId !== request.decisionActionHorizon.id ||
    template.diagnosisSelectionHorizonId !== request.diagnosisSelectionHorizon.id ||
    template.findingProjectionHorizonId !== request.sharedFindingRequest.projectionHorizon.id
  ) {
    return fail(
      'TEMPLATE_HORIZON_MISMATCH',
      'The supplied action, diagnosis, and finding-projection horizons must match the exact recipe IDs pinned by the template.',
      [
        template.id,
        request.decisionActionHorizon.id,
        request.diagnosisSelectionHorizon.id,
        request.sharedFindingRequest.projectionHorizon.id,
      ],
      requestFingerprint,
    );
  }
  const recipeFingerprints = fingerprintCatalogInstanceRecipe({
    decisionActionHorizon: request.decisionActionHorizon,
    diagnosisSelectionHorizon: request.diagnosisSelectionHorizon,
    findingProjectionHorizon: request.sharedFindingRequest.projectionHorizon,
    universalActionResultAssemblyRecipe: request.universalActionResultAssemblyRecipe,
  });
  if (
    template.decisionActionHorizonFingerprint !==
      recipeFingerprints.decisionActionHorizonFingerprint ||
    template.diagnosisSelectionHorizonFingerprint !==
      recipeFingerprints.diagnosisSelectionHorizonFingerprint ||
    template.findingProjectionHorizonFingerprint !==
      recipeFingerprints.findingProjectionHorizonFingerprint
  ) {
    return fail(
      'TEMPLATE_HORIZON_MISMATCH',
      'The supplied action, diagnosis, and finding-projection horizons must match the exact payload fingerprints pinned by the template.',
      [
        template.id,
        request.decisionActionHorizon.id,
        request.diagnosisSelectionHorizon.id,
        request.sharedFindingRequest.projectionHorizon.id,
      ],
      requestFingerprint,
    );
  }
  if (
    template.universalActionResultAssemblyRecipeRef.id !==
      request.universalActionResultAssemblyRecipe.id ||
    template.universalActionResultAssemblyRecipeRef.contentVersion !==
      request.universalActionResultAssemblyRecipe.contentVersion ||
    template.universalActionResultAssemblyRecipeFingerprint !==
      recipeFingerprints.universalActionResultAssemblyRecipeFingerprint
  ) {
    return fail(
      'TEMPLATE_RESULT_ASSEMBLY_MISMATCH',
      'The supplied static universal action-result assembly must exactly match the recipe version and payload pinned by the template.',
      [template.id, request.universalActionResultAssemblyRecipe.id],
      requestFingerprint,
    );
  }
  const locationDispositionIds = new Set(request.location.dispositionIds);
  const unavailableDispositionIds = request.decisionActionHorizon.dispositionIds.filter(
    (dispositionId) => !locationDispositionIds.has(dispositionId),
  );
  if (unavailableDispositionIds.length > 0) {
    return fail(
      'LOCATION_DISPOSITION_MISMATCH',
      'The decision-action horizon exposes a disposition not supplied by the exact location version.',
      [request.location.id, ...unavailableDispositionIds],
      requestFingerprint,
    );
  }

  let verifiedStructuredSourceReportSelection: StructuredSourceReportSelectionArtifact | null =
    null;
  if (request.universalActionResultAssemblyRecipe.structuredRevealDefinitions.length > 0) {
    if (request.structuredSourceReportSelectionArtifact === null) {
      return fail(
        'STRUCTURED_SOURCE_REPORT_SELECTION_MISMATCH',
        'A nonempty structured reveal definition horizon requires one deterministic source-report behavior-selection artifact.',
        [template.id, request.universalActionResultAssemblyRecipe.id],
        requestFingerprint,
      );
    }
    const selectionContext = verifyStructuredSourceReportSelectionContext({
      template,
      assemblyRecipe: request.universalActionResultAssemblyRecipe,
      selectionArtifact: request.structuredSourceReportSelectionArtifact,
      seed: request.sharedFindingRequest.seed,
    });
    if (!selectionContext.ok) {
      return fail(
        'STRUCTURED_SOURCE_REPORT_SELECTION_MISMATCH',
        selectionContext.message,
        selectionContext.contentIds,
        requestFingerprint,
      );
    }
    verifiedStructuredSourceReportSelection = selectionContext.value;
  }

  const findingResult = compileSharedFindings(request.sharedFindingRequest);
  if (!findingResult.ok) {
    return fail(
      'SHARED_FINDING_COMPILATION_FAILED',
      `${findingResult.error.code}: ${findingResult.error.message}`,
      findingResult.error.contentIds,
      requestFingerprint,
    );
  }
  const deferredRecords = freezeDeferredFindingScopedRecords(request, findingResult.value.findings);
  if (!deferredRecords.ok) {
    return fail(
      'UNRESOLVED_FINDING_SCOPED_RECORD',
      `${deferredRecords.recordId} targets a finding-definition version that did not resolve in the shared-finding compilation.`,
      [deferredRecords.recordId, deferredRecords.findingDefinitionId],
      requestFingerprint,
    );
  }
  const finalPatientStateResult = ResolvedPatientStateSchema.safeParse({
    ...request.basePatientState,
    canonicalFindings: findingResult.value.findings,
    clinicalDurations: sortById([
      ...request.basePatientState.clinicalDurations,
      ...deferredRecords.durations,
    ]),
    subjectiveBurdenRecords: sortById([
      ...request.basePatientState.subjectiveBurdenRecords,
      ...deferredRecords.burdens,
    ]),
  });
  if (!finalPatientStateResult.success) {
    return fail(
      'FINAL_PATIENT_STATE_INVALID',
      issuesText(finalPatientStateResult.error.issues),
      [request.basePatientState.id, findingResult.value.id],
      requestFingerprint,
    );
  }
  const finalPatientState: ResolvedPatientState = normalizeResolvedPatientState(
    finalPatientStateResult.data,
  );

  const targetScopedCompilation = compileTargetScopedPatientValueAttachment({
    patientState: finalPatientState,
    assemblyRecipe: request.universalActionResultAssemblyRecipe,
    assemblyRecipeFingerprint: recipeFingerprints.universalActionResultAssemblyRecipeFingerprint,
  });
  if (!targetScopedCompilation.ok) {
    return fail(
      'TARGET_SCOPED_PATIENT_VALUE_COMPILATION_FAILED',
      targetScopedCompilation.message,
      targetScopedCompilation.contentIds,
      requestFingerprint,
    );
  }
  const targetScopedPatientValueProjectionArtifact = targetScopedCompilation.artifact;

  const instrumentActionHorizon = deriveInstrumentInformationActionHorizon(
    request.decisionActionHorizon,
  );
  const instrumentResponseRequestPayload = {
    patientStateId: finalPatientState.id,
    sharedFindingCompilationId: findingResult.value.id,
    findingProjectionHorizonId: request.sharedFindingRequest.projectionHorizon.id,
    actionCatalogId: request.universalActionResultAssemblyRecipe.actionCatalog.id,
    instrumentActionHorizon,
    instrumentDefinitionRefs: request.universalActionResultAssemblyRecipe.instrumentDefinitions.map(
      (definition) => ({
        id: definition.id,
        contentVersion: definition.contentVersion,
      }),
    ),
    assemblyRecipeId: request.universalActionResultAssemblyRecipe.id,
    assemblyRecipeFingerprint: recipeFingerprints.universalActionResultAssemblyRecipeFingerprint,
  };
  const instrumentResponseCompileRequest = InstrumentItemResponseCompileRequestSchema.safeParse({
    schemaVersion: 1,
    id: stableId(
      'instrument-item-response-request',
      exactFingerprint('instrument-item-response-request', instrumentResponseRequestPayload),
    ),
    sharedFindingCompilation: findingResult.value,
    findingProjectionHorizon: request.sharedFindingRequest.projectionHorizon,
    actionCatalog: request.universalActionResultAssemblyRecipe.actionCatalog,
    actionHorizon: instrumentActionHorizon,
    instrumentDefinitions: request.universalActionResultAssemblyRecipe.instrumentDefinitions,
  });
  if (!instrumentResponseCompileRequest.success) {
    return fail(
      'INSTRUMENT_ITEM_RESPONSE_COMPILATION_FAILED',
      issuesText(instrumentResponseCompileRequest.error.issues),
      [template.id, finalPatientState.id, request.universalActionResultAssemblyRecipe.id],
      requestFingerprint,
    );
  }
  const instrumentResponseCompilationResult = compileInstrumentItemResponses(
    instrumentResponseCompileRequest.data,
  );
  if (!instrumentResponseCompilationResult.ok) {
    return fail(
      'INSTRUMENT_ITEM_RESPONSE_COMPILATION_FAILED',
      `${instrumentResponseCompilationResult.error.code}: ${instrumentResponseCompilationResult.error.message}`,
      instrumentResponseCompilationResult.error.contentIds,
      requestFingerprint,
    );
  }
  const instrumentItemResponseCompilation: InstrumentItemResponseCompilationArtifact =
    instrumentResponseCompilationResult.value;
  if (instrumentItemResponseCompilation.status !== 'complete') {
    return fail(
      'INCOMPLETE_INSTRUMENT_ITEM_RESPONSE_COVERAGE',
      instrumentItemResponseCompilation.diagnostics
        .map((diagnostic) => diagnostic.message)
        .join('; '),
      instrumentItemResponseCompilation.diagnostics.flatMap((diagnostic) => [
        diagnostic.id,
        ...diagnostic.contentIds,
      ]),
      requestFingerprint,
    );
  }

  let structuredSourceReportSelectionArtifact: StructuredSourceReportSelectionArtifact | null =
    null;
  let structuredSourceReportArtifact: StructuredSourceReportArtifact | null = null;
  let structuredRevealEnvelopes: StructuredPatientStateRevealProjectionEnvelope[] = [];
  if (request.universalActionResultAssemblyRecipe.structuredRevealDefinitions.length > 0) {
    if (verifiedStructuredSourceReportSelection === null) {
      return fail(
        'STRUCTURED_SOURCE_REPORT_SELECTION_MISMATCH',
        'A nonempty structured reveal definition horizon requires one deterministic source-report behavior-selection artifact.',
        [template.id, request.universalActionResultAssemblyRecipe.id],
        requestFingerprint,
      );
    }
    const structuredReportAttachment = compileStructuredSourceReportAttachment({
      template,
      assemblyRecipe: request.universalActionResultAssemblyRecipe,
      selectionArtifact: verifiedStructuredSourceReportSelection,
      patientState: finalPatientState,
      seed: request.sharedFindingRequest.seed,
    });
    if (!structuredReportAttachment.ok) {
      return fail(
        structuredReportAttachment.stage === 'selection'
          ? 'STRUCTURED_SOURCE_REPORT_SELECTION_MISMATCH'
          : structuredReportAttachment.stage === 'report'
            ? 'STRUCTURED_SOURCE_REPORT_COMPILATION_FAILED'
            : 'STRUCTURED_REVEAL_STATE_MISMATCH',
        structuredReportAttachment.message,
        structuredReportAttachment.contentIds,
        requestFingerprint,
      );
    }
    structuredSourceReportSelectionArtifact = structuredReportAttachment.selectionArtifact;
    structuredSourceReportArtifact = structuredReportAttachment.reportArtifact;
    structuredRevealEnvelopes = structuredReportAttachment.envelopes;
  }
  const actionResultRequestPayload = {
    patientStateId: finalPatientState.id,
    actionCatalogId: request.universalActionResultAssemblyRecipe.actionCatalog.id,
    actionHorizonId: request.decisionActionHorizon.id,
    sharedFindingCompilationId: findingResult.value.id,
    findingProjectionHorizonId: request.sharedFindingRequest.projectionHorizon.id,
    instrumentItemResponseCompilationId: instrumentItemResponseCompilation.id,
    targetScopedPatientValueProjectionArtifactId:
      targetScopedPatientValueProjectionArtifact?.id ?? null,
    structuredRevealProjectionIds: structuredRevealEnvelopes.map(
      (envelope) => envelope.resolved.id,
    ),
    assemblyRecipeId: request.universalActionResultAssemblyRecipe.id,
    assemblyRecipeFingerprint: recipeFingerprints.universalActionResultAssemblyRecipeFingerprint,
  };
  const actionResultCompileRequestResult = UniversalActionResultCompileRequestSchema.safeParse({
    schemaVersion: 1,
    id: stableId(
      'universal-action-result-request',
      exactFingerprint('universal-action-result-request', actionResultRequestPayload),
    ),
    patientState: finalPatientState,
    actionCatalog: request.universalActionResultAssemblyRecipe.actionCatalog,
    actionHorizon: request.decisionActionHorizon,
    sharedFindingCompilation: findingResult.value,
    findingProjectionHorizon: request.sharedFindingRequest.projectionHorizon,
    instrumentItemResponseCompilation,
    targetScopedPatientValueProjectionArtifact,
    structuredRevealEnvelopes,
    measurementDefinitions: request.universalActionResultAssemblyRecipe.measurementDefinitions,
    categoricalObservationDefinitions:
      request.universalActionResultAssemblyRecipe.categoricalObservationDefinitions,
    testDefinitions: request.universalActionResultAssemblyRecipe.testDefinitions,
    recipes: request.universalActionResultAssemblyRecipe.recipes,
  });
  if (!actionResultCompileRequestResult.success) {
    return fail(
      'UNIVERSAL_ACTION_RESULT_COMPILATION_FAILED',
      issuesText(actionResultCompileRequestResult.error.issues),
      [template.id, finalPatientState.id, request.universalActionResultAssemblyRecipe.id],
      requestFingerprint,
    );
  }
  const actionResultCompilation = compileUniversalActionResults(
    actionResultCompileRequestResult.data,
  );
  if (!actionResultCompilation.ok) {
    return fail(
      'UNIVERSAL_ACTION_RESULT_COMPILATION_FAILED',
      `${actionResultCompilation.error.code}: ${actionResultCompilation.error.message}`,
      actionResultCompilation.error.contentIds,
      requestFingerprint,
    );
  }
  const universalActionResultArtifact: UniversalActionResultArtifact =
    actionResultCompilation.value;
  if (universalActionResultArtifact.status !== 'complete') {
    return fail(
      'INCOMPLETE_ACTION_RESULT_COVERAGE',
      universalActionResultArtifact.diagnostics.map((diagnostic) => diagnostic.message).join('; '),
      universalActionResultArtifact.diagnostics.flatMap((diagnostic) => [
        diagnostic.id,
        ...diagnostic.contentIds,
      ]),
      requestFingerprint,
    );
  }
  const translatedActionResults = translateUniversalActionResultArtifact(
    universalActionResultArtifact,
    request.decisionActionHorizon.informationActionIds,
  );
  if (!translatedActionResults.ok) {
    return fail(
      'UNIVERSAL_ACTION_RESULT_TRANSLATION_FAILED',
      translatedActionResults.error.message,
      translatedActionResults.error.contentIds,
      requestFingerprint,
    );
  }
  const resultBindingRequests = translatedActionResults.value.resultBindingRequests;
  const structuredStateReveals = translatedActionResults.value.structuredStateReveals;
  const instrumentItemResponses = translatedActionResults.value.instrumentItemResponses;
  const targetScopedPatientValueReveals =
    translatedActionResults.value.targetScopedPatientValueReveals;
  const resultBindingRecipeFingerprint = fingerprintDerivedResultBindings(resultBindingRequests);

  const rubricResult = compileDecisionPolicy({
    policy: request.decisionPolicy,
    patientState: finalPatientState,
    actionHorizon: request.decisionActionHorizon,
    rules: request.decisionRules,
  });
  if (!rubricResult.ok) {
    return fail(
      'DECISION_POLICY_COMPILATION_FAILED',
      `${rubricResult.error.code}: ${rubricResult.error.message}`,
      rubricResult.error.contentIds,
      requestFingerprint,
    );
  }
  const rubricContext = verifyCompiledRubricContext({
    rubric: rubricResult.value,
    patientState: finalPatientState,
    actionHorizon: request.decisionActionHorizon,
  });
  if (!rubricContext.ok) {
    return fail(
      'RUBRIC_CONTEXT_MISMATCH',
      rubricContext.error.message,
      rubricContext.error.contentIds,
      requestFingerprint,
    );
  }
  const templateRef = {
    id: template.id,
    contentVersion: template.contentVersion,
  };
  const richnessResult = evaluatePresentationRichness({
    templateRef,
    envelope: template.presentationRichnessEnvelope,
    patientState: finalPatientState,
  });
  if (!richnessResult.ok) {
    return fail(
      'PRESENTATION_RICHNESS_EVALUATION_FAILED',
      `${richnessResult.error.code}: ${richnessResult.error.message}`,
      [template.id, template.presentationRichnessEnvelope.id, finalPatientState.id],
      requestFingerprint,
    );
  }

  const patientDraft = {
    schemaVersion: 1 as const,
    compilerVersion: CATALOG_INSTANCE_COMPILER_VERSION,
    templateRef,
    seed: request.sharedFindingRequest.seed,
    conditionBindings: request.conditionBindings,
    patientState: finalPatientState,
    sharedFindingCompilation: findingResult.value,
    structuredStateReveals,
    instrumentItemResponses,
    targetScopedPatientValueReveals,
  };
  const patientInputFingerprint = fingerprint(
    'patient-input',
    patientInputPayload(template, patientDraft),
  );
  const patientWithoutIdentity = {
    ...patientDraft,
    inputFingerprint: patientInputFingerprint,
  };
  const patientPayloadFingerprint = exactFingerprint(
    'patient-output',
    patientPayload(patientWithoutIdentity),
  );
  const patientResult = PatientInstanceSchema.safeParse({
    ...patientWithoutIdentity,
    id: stableId('patient-instance', patientPayloadFingerprint),
    payloadFingerprint: patientPayloadFingerprint,
  });
  if (!patientResult.success) {
    return fail(
      'COMPILED_SNAPSHOT_INVALID',
      issuesText(patientResult.error.issues),
      [template.id, finalPatientState.id],
      requestFingerprint,
    );
  }
  const patientInstance = patientResult.data;

  const frozenBindings = freezeResultBindings(
    resultBindingRequests,
    patientInstance.sharedFindingCompilation.projections,
    patientInstance.structuredStateReveals,
    patientInstance.instrumentItemResponses,
    patientInstance.targetScopedPatientValueReveals,
  );
  if (!frozenBindings.ok) {
    return fail(
      'UNRESOLVED_RESULT_SOURCE',
      `${frozenBindings.bindingId} selects a finding projection that did not compile for the same information action.`,
      [frozenBindings.bindingId, frozenBindings.sourceId],
      requestFingerprint,
    );
  }

  const encounterDraft = {
    schemaVersion: 1 as const,
    compilerVersion: CATALOG_INSTANCE_COMPILER_VERSION,
    templateRef,
    patientInstanceId: patientInstance.id,
    locationRef: {
      id: request.location.id,
      contentVersion: request.location.contentVersion,
    },
    locationFingerprint: exactFingerprint('location', request.location),
    careSetting: template.careSetting,
    operationalAdmissionArtifactId: operationalAdmissionArtifact.id,
    operationalAdmissionFingerprint: operationalAdmissionArtifact.payloadFingerprint,
    focusedDecisionId: template.focusedDecisionId,
    decisionActionHorizon: request.decisionActionHorizon,
    decisionActionHorizonFingerprint: recipeFingerprints.decisionActionHorizonFingerprint,
    diagnosisSelectionHorizon: request.diagnosisSelectionHorizon,
    diagnosisSelectionHorizonFingerprint: recipeFingerprints.diagnosisSelectionHorizonFingerprint,
    findingProjectionHorizon: request.sharedFindingRequest.projectionHorizon,
    findingProjectionHorizonFingerprint: findingResult.value.projectionHorizonFingerprint,
    sharedFindingCompilationId: findingResult.value.id,
    compiledRubric: rubricResult.value,
    resultBindingRequests,
    resultBindingRecipeFingerprint,
    resultBindings: frozenBindings.value,
  };
  const encounterInputFingerprint = fingerprint(
    'encounter-input',
    encounterInputPayload(patientInstance, request.location, encounterDraft),
  );
  const encounterWithoutIdentity = {
    ...encounterDraft,
    inputFingerprint: encounterInputFingerprint,
  };
  const encounterPayloadFingerprint = exactFingerprint(
    'encounter-output',
    encounterPayload(encounterWithoutIdentity),
  );
  const encounterResult = EncounterInstanceSchema.safeParse({
    ...encounterWithoutIdentity,
    id: stableId('encounter-instance', encounterPayloadFingerprint),
    payloadFingerprint: encounterPayloadFingerprint,
  });
  if (!encounterResult.success) {
    return fail(
      'COMPILED_SNAPSHOT_INVALID',
      issuesText(encounterResult.error.issues),
      [template.id, patientInstance.id],
      requestFingerprint,
    );
  }

  const snapshotWithoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: CATALOG_INSTANCE_COMPILER_VERSION,
    requestId: request.id,
    template,
    location: request.location,
    operationalAdmissionArtifact,
    patientInstance,
    encounterInstance: encounterResult.data,
    universalActionResultAssemblyRecipe: request.universalActionResultAssemblyRecipe,
    structuredSourceReportSelectionArtifact,
    structuredSourceReportArtifact,
    universalActionResultArtifact,
    instrumentItemResponseCompilation,
    presentationRichnessEvaluation: richnessResult.value,
    inputFingerprint: requestFingerprint,
  };
  const snapshotPayloadFingerprint = exactFingerprint(
    'snapshot-output',
    snapshotPayload(snapshotWithoutIdentity),
  );
  const snapshot = {
    ...snapshotWithoutIdentity,
    id: stableId('catalog-instance-snapshot', snapshotPayloadFingerprint),
    payloadFingerprint: snapshotPayloadFingerprint,
  };
  const verified = verifyCatalogCompiledInstanceIntegrity(snapshot);
  if (!verified.ok) {
    return fail(
      'COMPILED_SNAPSHOT_INVALID',
      `${verified.error.code}: ${verified.error.message}`,
      [template.id, patientInstance.id, encounterResult.data.id],
      requestFingerprint,
    );
  }
  return { ok: true, value: verified.value };
};
