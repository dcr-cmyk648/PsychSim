import {
  PreFindingPatientStateOrchestrationArtifactSchema,
  PreFindingPatientStateOrchestrationRequestSchema,
  type OptionalExposureBudgetBridgeArtifact,
  type OptionalFindingTextureBridgeArtifact,
  type OptionalPriorTreatmentBridgeArtifact,
  type OptionalReactionHistoryBridgeArtifact,
  type PreFindingPatientStateOrchestrationArtifact,
  type PreFindingPatientStateOrchestrationFingerprint,
  type PreFindingPatientStateOrchestrationRequest,
  type ResolvedConditionSource,
} from '@psychsim/schemas';

import { bridgeOptionalComorbiditiesFromBudget } from './optional-comorbidity-budget-bridge';
import {
  bridgeOptionalExposureFromBudget,
  verifyOptionalExposureBudgetBridgeIntegrity,
} from './optional-exposure-budget-bridge';
import {
  selectOptionalFeaturesWithinBudget,
  verifyOptionalFeatureBudgetSelectionIntegrity,
} from './optional-feature-budget-selector';
import {
  bridgeOptionalFindingTextureFromBudget,
  verifyOptionalFindingTextureBridgeIntegrity,
} from './optional-finding-texture-bridge';
import {
  bridgeOptionalPriorTreatmentHistoryFromBudget,
  verifyOptionalPriorTreatmentBridgeIntegrity,
} from './optional-prior-treatment-bridge';
import {
  bridgeOptionalReactionHistoryFromBudget,
  verifyOptionalReactionHistoryBridgeIntegrity,
} from './optional-reaction-history-bridge';
import { verifyResolvedConditionSourceIntegrity } from './resolved-condition-source';
import {
  composeResolvedPatientState,
  verifyResolvedPatientStateCompositionIntegrity,
} from './resolved-patient-state-composer';
import {
  normalizeTemplateConditionSelectionRequest,
  selectTemplateConditions,
} from './template-condition-selector';

export const PRE_FINDING_PATIENT_STATE_ORCHESTRATOR_VERSION = '2.0.0';

export type PreFindingPatientStateOrchestrationErrorCode =
  | 'INVALID_REQUEST'
  | 'OPTIONAL_FEATURE_SELECTION_FAILED'
  | 'CONDITION_SELECTION_FAILED'
  | 'OPTIONAL_COMORBIDITY_BRIDGE_FAILED'
  | 'REACTION_HISTORY_BRIDGE_FAILED'
  | 'PRIOR_TREATMENT_BRIDGE_FAILED'
  | 'EXPOSURE_BRIDGE_FAILED'
  | 'FINDING_TEXTURE_BRIDGE_FAILED'
  | 'PATIENT_STATE_COMPOSITION_FAILED'
  | 'INVALID_OUTPUT';

export interface PreFindingPatientStateOrchestrationError {
  readonly code: PreFindingPatientStateOrchestrationErrorCode;
  readonly message: string;
  readonly contentIds: readonly string[];
}

export type PreFindingPatientStateOrchestrationResult =
  | {
      readonly ok: true;
      readonly value: PreFindingPatientStateOrchestrationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: PreFindingPatientStateOrchestrationError;
    };

export type PreFindingPatientStateOrchestrationIntegrityResult =
  | {
      readonly ok: true;
      readonly value: PreFindingPatientStateOrchestrationArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_RESOLVER_VERSION'
          | 'UPSTREAM_INTEGRITY_MISMATCH'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH'
          | 'REPLAY_MISMATCH';
        readonly message: string;
      };
    };

export type PreFindingPatientStateOrchestrationContextResult =
  | {
      readonly ok: true;
      readonly value: PreFindingPatientStateOrchestrationArtifact;
    }
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

const fingerprint = (
  scope: string,
  value: unknown,
): PreFindingPatientStateOrchestrationFingerprint =>
  `fingerprint.pre-finding-patient-state-orchestration.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameCanonicalValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: PreFindingPatientStateOrchestrationErrorCode,
  message: string,
  contentIds: readonly string[],
): PreFindingPatientStateOrchestrationResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

const artifactPayload = (
  artifact: Omit<PreFindingPatientStateOrchestrationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  resolverVersion: artifact.resolverVersion,
  requestId: artifact.requestId,
  status: artifact.status,
  optionalFeatureArtifact: artifact.optionalFeatureArtifact,
  conditionSource: artifact.conditionSource,
  reactionHistoryBridgeArtifact: artifact.reactionHistoryBridgeArtifact,
  priorTreatmentBridgeArtifact: artifact.priorTreatmentBridgeArtifact,
  exposureBridgeArtifact: artifact.exposureBridgeArtifact,
  findingTextureBridgeArtifact: artifact.findingTextureBridgeArtifact,
  patientStateCompositionArtifact: artifact.patientStateCompositionArtifact,
  orchestrationRequest: artifact.orchestrationRequest,
  inputFingerprint: artifact.inputFingerprint,
});

const normalizedReactionInput = (
  artifact: OptionalReactionHistoryBridgeArtifact | null,
): PreFindingPatientStateOrchestrationRequest['reactionHistoryBridgeInput'] =>
  artifact === null
    ? null
    : {
        schemaVersion: artifact.bridgeRequest.schemaVersion,
        id: artifact.bridgeRequest.id,
        referenceHorizon: artifact.bridgeRequest.referenceHorizon,
        bridgeProfile: artifact.bridgeRequest.bridgeProfile,
      };

const normalizedPriorTreatmentInput = (
  artifact: OptionalPriorTreatmentBridgeArtifact | null,
): PreFindingPatientStateOrchestrationRequest['priorTreatmentBridgeInput'] =>
  artifact === null
    ? null
    : {
        schemaVersion: artifact.bridgeRequest.schemaVersion,
        id: artifact.bridgeRequest.id,
        referenceHorizon: artifact.bridgeRequest.referenceHorizon,
        bridgeProfile: artifact.bridgeRequest.bridgeProfile,
      };

const normalizedExposureInput = (
  artifact: OptionalExposureBudgetBridgeArtifact | null,
): PreFindingPatientStateOrchestrationRequest['exposureBridgeInput'] =>
  artifact === null
    ? null
    : {
        schemaVersion: artifact.bridgeRequest.schemaVersion,
        id: artifact.bridgeRequest.id,
        referenceHorizon: artifact.bridgeRequest.referenceHorizon,
        bridgeProfile: artifact.bridgeRequest.bridgeProfile,
      };

const normalizedFindingTextureInput = (
  artifact: OptionalFindingTextureBridgeArtifact | null,
): PreFindingPatientStateOrchestrationRequest['findingTextureBridgeInput'] =>
  artifact === null
    ? null
    : {
        schemaVersion: artifact.bridgeRequest.schemaVersion,
        id: artifact.bridgeRequest.id,
        referenceHorizon: artifact.bridgeRequest.referenceHorizon,
        findingDefinitions: artifact.bridgeRequest.findingDefinitions,
        bridgeProfile: artifact.bridgeRequest.bridgeProfile,
      };

/**
 * Runs each direct pre-finding child stage exactly once. The exact patient
 * template (including its care setting) flows through the child artifacts,
 * but this orchestrator adds no setting-specific selection, cost, resource,
 * capability, or gameplay behavior. Reaction-history ownership is supplied as
 * an explicit authoring acknowledgement and passed through unchanged.
 */
export const orchestratePreFindingPatientState = (
  input: unknown,
): PreFindingPatientStateOrchestrationResult => {
  const parsed = PreFindingPatientStateOrchestrationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }
  const request = parsed.data;

  const optionalResult = selectOptionalFeaturesWithinBudget(
    request.optionalFeatureSelectionRequest,
  );
  if (!optionalResult.ok) {
    return fail(
      'OPTIONAL_FEATURE_SELECTION_FAILED',
      `${optionalResult.error.code}: ${optionalResult.error.message}`,
      optionalResult.error.contentIds,
    );
  }
  const optionalFeatureArtifact = optionalResult.value;

  let conditionSource: ResolvedConditionSource;
  let normalizedConditionPlan: PreFindingPatientStateOrchestrationRequest['conditionSourcePlan'];
  if (request.conditionSourcePlan.sourceKind === 'optional_comorbidity_bridge') {
    const conditionResult = bridgeOptionalComorbiditiesFromBudget({
      schemaVersion: 1,
      id: `${request.id}.optional-comorbidity-bridge`,
      optionalFeatureArtifact,
      conditionSelectionRequest: request.conditionSourcePlan.conditionSelectionRequest,
      bridgeProfile: request.conditionSourcePlan.bridgeProfile,
    });
    if (!conditionResult.ok && 'error' in conditionResult) {
      return fail(
        'OPTIONAL_COMORBIDITY_BRIDGE_FAILED',
        `${conditionResult.error.code}: ${conditionResult.error.message}`,
        conditionResult.error.contentIds,
      );
    }
    const conditionArtifact = conditionResult.ok
      ? conditionResult.value
      : conditionResult.conflict.artifact;
    conditionSource = {
      schemaVersion: 1,
      sourceKind: 'optional_comorbidity_bridge',
      artifact: conditionArtifact,
    };
    normalizedConditionPlan = {
      sourceKind: 'optional_comorbidity_bridge',
      conditionSelectionRequest: conditionArtifact.bridgeRequest.conditionSelectionRequest,
      bridgeProfile: conditionArtifact.bridgeRequest.bridgeProfile,
    };
  } else {
    const normalizedConditionRequest = normalizeTemplateConditionSelectionRequest(
      request.conditionSourcePlan.conditionSelectionRequest,
    );
    const conditionResult = selectTemplateConditions(normalizedConditionRequest);
    if (!conditionResult.ok && 'error' in conditionResult) {
      return fail(
        'CONDITION_SELECTION_FAILED',
        `${conditionResult.error.code}: ${conditionResult.error.message}`,
        [normalizedConditionRequest.id],
      );
    }
    conditionSource = {
      schemaVersion: 1,
      sourceKind: 'template_condition_selection',
      artifact: conditionResult.ok ? conditionResult.value : conditionResult.conflict.artifact,
    };
    normalizedConditionPlan = {
      sourceKind: 'template_condition_selection',
      conditionSelectionRequest: normalizedConditionRequest,
    };
  }

  let reactionHistoryBridgeArtifact: OptionalReactionHistoryBridgeArtifact | null = null;
  if (request.reactionHistoryBridgeInput !== null) {
    const result = bridgeOptionalReactionHistoryFromBudget({
      ...request.reactionHistoryBridgeInput,
      optionalFeatureArtifact,
    });
    if (!result.ok) {
      return fail(
        'REACTION_HISTORY_BRIDGE_FAILED',
        `${result.error.code}: ${result.error.message}`,
        result.error.contentIds,
      );
    }
    reactionHistoryBridgeArtifact = result.value;
  }

  let priorTreatmentBridgeArtifact: OptionalPriorTreatmentBridgeArtifact | null = null;
  if (request.priorTreatmentBridgeInput !== null) {
    const result = bridgeOptionalPriorTreatmentHistoryFromBudget({
      ...request.priorTreatmentBridgeInput,
      optionalFeatureArtifact,
    });
    if (!result.ok) {
      return fail(
        'PRIOR_TREATMENT_BRIDGE_FAILED',
        `${result.error.code}: ${result.error.message}`,
        result.error.contentIds,
      );
    }
    priorTreatmentBridgeArtifact = result.value;
  }

  let exposureBridgeArtifact: OptionalExposureBudgetBridgeArtifact | null = null;
  if (request.exposureBridgeInput !== null) {
    const result = bridgeOptionalExposureFromBudget({
      ...request.exposureBridgeInput,
      optionalFeatureArtifact,
    });
    if (!result.ok) {
      return fail(
        'EXPOSURE_BRIDGE_FAILED',
        `${result.error.code}: ${result.error.message}`,
        result.error.contentIds,
      );
    }
    exposureBridgeArtifact = result.value;
  }

  let findingTextureBridgeArtifact: OptionalFindingTextureBridgeArtifact | null = null;
  if (request.findingTextureBridgeInput !== null) {
    const result = bridgeOptionalFindingTextureFromBudget({
      ...request.findingTextureBridgeInput,
      optionalFeatureArtifact,
    });
    if (!result.ok) {
      return fail(
        'FINDING_TEXTURE_BRIDGE_FAILED',
        `${result.error.code}: ${result.error.message}`,
        result.error.contentIds,
      );
    }
    findingTextureBridgeArtifact = result.value;
  }

  const compositionResult = composeResolvedPatientState({
    schemaVersion: 1,
    id: `${request.id}.resolved-patient-state-composition`,
    corePatientState: request.corePatientState,
    reactionHistoryOwnership: request.reactionHistoryOwnership,
    optionalFeatureArtifact,
    conditionSource,
    reactionHistoryBridgeArtifact,
    priorTreatmentBridgeArtifact,
    exposureBridgeArtifact,
    findingTextureBridgeArtifact,
  });
  if (!compositionResult.ok) {
    return fail(
      'PATIENT_STATE_COMPOSITION_FAILED',
      `${compositionResult.error.code}: ${compositionResult.error.message}`,
      compositionResult.error.contentIds,
    );
  }
  const patientStateCompositionArtifact = compositionResult.value;

  const orchestrationRequest: PreFindingPatientStateOrchestrationRequest = {
    schemaVersion: request.schemaVersion,
    id: request.id,
    optionalFeatureSelectionRequest: optionalFeatureArtifact.selectionRequest,
    conditionSourcePlan: normalizedConditionPlan,
    corePatientState: patientStateCompositionArtifact.compositionRequest.corePatientState,
    reactionHistoryOwnership:
      patientStateCompositionArtifact.compositionRequest.reactionHistoryOwnership,
    reactionHistoryBridgeInput: normalizedReactionInput(reactionHistoryBridgeArtifact),
    priorTreatmentBridgeInput: normalizedPriorTreatmentInput(priorTreatmentBridgeArtifact),
    exposureBridgeInput: normalizedExposureInput(exposureBridgeArtifact),
    findingTextureBridgeInput: normalizedFindingTextureInput(findingTextureBridgeArtifact),
  };
  const inputFingerprint = fingerprint('input', orchestrationRequest);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    resolverVersion: PRE_FINDING_PATIENT_STATE_ORCHESTRATOR_VERSION,
    requestId: orchestrationRequest.id,
    status: patientStateCompositionArtifact.status,
    optionalFeatureArtifact,
    conditionSource,
    reactionHistoryBridgeArtifact,
    priorTreatmentBridgeArtifact,
    exposureBridgeArtifact,
    findingTextureBridgeArtifact,
    patientStateCompositionArtifact,
    orchestrationRequest,
    inputFingerprint,
  };
  try {
    const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
    return {
      ok: true,
      value: PreFindingPatientStateOrchestrationArtifactSchema.parse({
        ...withoutIdentity,
        id: `pre-finding-patient-state-orchestration.${payloadFingerprint.slice(-16)}`,
        payloadFingerprint,
      }),
    };
  } catch (error) {
    return fail('INVALID_OUTPUT', error instanceof Error ? error.message : String(error), [
      orchestrationRequest.id,
      optionalFeatureArtifact.id,
      conditionSource.artifact.id,
      patientStateCompositionArtifact.id,
    ]);
  }
};

export const verifyPreFindingPatientStateOrchestrationIntegrity = (
  input: unknown,
): PreFindingPatientStateOrchestrationIntegrityResult => {
  const parsed = PreFindingPatientStateOrchestrationArtifactSchema.safeParse(input);
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
  if (artifact.resolverVersion !== PRE_FINDING_PATIENT_STATE_ORCHESTRATOR_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_RESOLVER_VERSION',
        message: `${artifact.id} uses unsupported pre-finding orchestrator ${artifact.resolverVersion}.`,
      },
    };
  }

  const upstreamChecks = [
    verifyOptionalFeatureBudgetSelectionIntegrity(artifact.optionalFeatureArtifact),
    verifyResolvedConditionSourceIntegrity(artifact.conditionSource),
    ...(artifact.reactionHistoryBridgeArtifact === null
      ? []
      : [verifyOptionalReactionHistoryBridgeIntegrity(artifact.reactionHistoryBridgeArtifact)]),
    ...(artifact.priorTreatmentBridgeArtifact === null
      ? []
      : [verifyOptionalPriorTreatmentBridgeIntegrity(artifact.priorTreatmentBridgeArtifact)]),
    ...(artifact.exposureBridgeArtifact === null
      ? []
      : [verifyOptionalExposureBudgetBridgeIntegrity(artifact.exposureBridgeArtifact)]),
    ...(artifact.findingTextureBridgeArtifact === null
      ? []
      : [verifyOptionalFindingTextureBridgeIntegrity(artifact.findingTextureBridgeArtifact)]),
    verifyResolvedPatientStateCompositionIntegrity(artifact.patientStateCompositionArtifact),
  ];
  const failedUpstream = upstreamChecks.find((result) => !result.ok);
  if (failedUpstream && !failedUpstream.ok) {
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_INTEGRITY_MISMATCH',
        message: `${failedUpstream.error.code}: ${failedUpstream.error.message}`,
      },
    };
  }

  const expectedInputFingerprint = fingerprint('input', artifact.orchestrationRequest);
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact normalized orchestration request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('output', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `pre-finding-patient-state-orchestration.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen pre-finding orchestration payload.`,
      },
    };
  }
  const replay = orchestratePreFindingPatientState(artifact.orchestrationRequest);
  if (!replay.ok || !sameCanonicalValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained request does not reproduce the exact D-201 through D-208 pre-finding orchestration.',
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyPreFindingPatientStateOrchestrationContext = (input: {
  readonly artifact: unknown;
  readonly request: unknown;
}): PreFindingPatientStateOrchestrationContextResult => {
  const integrity = verifyPreFindingPatientStateOrchestrationIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = orchestratePreFindingPatientState(input.request);
  if (!expected.ok || !sameCanonicalValue(expected.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: expected.ok
          ? 'The orchestration artifact does not match this exact normalized pre-finding request.'
          : `${expected.error.code}: ${expected.error.message}`,
      },
    };
  }
  return { ok: true, value: integrity.value };
};
