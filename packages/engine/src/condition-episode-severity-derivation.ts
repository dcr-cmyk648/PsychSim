import {
  ConditionEpisodeSeverityDerivationArtifactSchema,
  ConditionEpisodeSeverityDerivationRequestSchema,
  type ConditionEpisodeSeverityDerivationArtifact,
  type ConditionEpisodeSeverityDerivationFingerprint,
  type ConditionEpisodeSeverityDerivationRequest,
  type ConditionSymptomSeverityLevel,
  type FunctionalImpairmentLevel,
} from '@psychsim/schemas';

import { verifyConditionFunctionalImpairmentResolutionIntegrity } from './condition-functional-impairment-profile-resolver';

export const CONDITION_EPISODE_SEVERITY_DERIVATION_COMPILER_VERSION = '1.0.0';

export type ConditionEpisodeSeverityDerivationResult =
  | { readonly ok: true; readonly value: ConditionEpisodeSeverityDerivationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'INVALID_FUNCTIONAL_IMPAIRMENT_ARTIFACT'
          | 'UNAPPROVED_POLICY'
          | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type ConditionEpisodeSeverityDerivationIntegrityResult =
  | { readonly ok: true; readonly value: ConditionEpisodeSeverityDerivationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'REPLAY_FAILED'
          | 'REPLAY_MISMATCH';
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
): ConditionEpisodeSeverityDerivationFingerprint =>
  `fingerprint.condition-episode-severity-derivation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalizeObjectKeys(value)))}`;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const normalizeRequest = (
  request: ConditionEpisodeSeverityDerivationRequest,
): ConditionEpisodeSeverityDerivationRequest =>
  ConditionEpisodeSeverityDerivationRequestSchema.parse({
    ...request,
    conditionState: {
      ...request.conditionState,
      specifierIds: uniqueSorted(request.conditionState.specifierIds),
    },
    derivationOwner: {
      ...request.derivationOwner,
      derivationPolicy: {
        ...request.derivationOwner.derivationPolicy,
        inputDimensions: [...request.derivationOwner.derivationPolicy.inputDimensions].sort(
          compareStrings,
        ),
        review: {
          ...request.derivationOwner.derivationPolicy.review,
          sourceUseNoteIds: uniqueSorted(
            request.derivationOwner.derivationPolicy.review.sourceUseNoteIds,
          ),
        },
      },
    },
  });

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const fail = (
  code: Extract<ConditionEpisodeSeverityDerivationResult, { ok: false }>['error']['code'],
  message: string,
): ConditionEpisodeSeverityDerivationResult => ({
  ok: false,
  error: { code, message },
});

const symptomLevelRank: Readonly<Record<ConditionSymptomSeverityLevel, number>> = {
  mild: 1,
  moderate: 2,
  severe: 3,
};

const impairmentLevelRank: Readonly<Record<FunctionalImpairmentLevel, number>> = {
  none: 0,
  mild: 1,
  moderate: 2,
  severe: 3,
};

const highestQualitativeLevel = (
  symptomSeverity: ConditionSymptomSeverityLevel,
  functionalImpairment: FunctionalImpairmentLevel,
): ConditionSymptomSeverityLevel =>
  impairmentLevelRank[functionalImpairment] > symptomLevelRank[symptomSeverity]
    ? (functionalImpairment as ConditionSymptomSeverityLevel)
    : symptomSeverity;

export const deriveConditionEpisodeSeverity = (
  rawRequest: ConditionEpisodeSeverityDerivationRequest,
): ConditionEpisodeSeverityDerivationResult => {
  const parsed = ConditionEpisodeSeverityDerivationRequestSchema.safeParse(rawRequest);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues));
  }
  const request = normalizeRequest(parsed.data);
  const policy = request.derivationOwner.derivationPolicy;
  if (policy.review.status !== 'approved' || policy.review.sourceUseNoteIds.length === 0) {
    return fail(
      'UNAPPROVED_POLICY',
      `${policy.id} must have approved review and explicit source-use provenance.`,
    );
  }
  const impairmentIntegrity = verifyConditionFunctionalImpairmentResolutionIntegrity(
    request.functionalImpairmentResolution,
  );
  if (!impairmentIntegrity.ok) {
    return fail('INVALID_FUNCTIONAL_IMPAIRMENT_ARTIFACT', impairmentIntegrity.error.message);
  }

  const symptomSeverity = request.symptomSeverity;
  const functionalImpairment = request.functionalImpairmentResolution.resolvedFunctionalImpairment;
  const qualitativeLevel = highestQualitativeLevel(
    symptomSeverity.level,
    functionalImpairment.level,
  );
  const inputFingerprint = fingerprint('input', request);
  const resolvedEpisodeSeverity = {
    schemaVersion: 1 as const,
    id: stableId('condition-episode-severity', {
      patientStateId: request.patientStateId,
      conditionStateId: request.conditionState.id,
      diagnosisDefinitionId: request.conditionState.diagnosisDefinitionId,
      diagnosisDefinitionContentVersion: request.conditionState.diagnosisDefinitionContentVersion,
      clinicalStateId: request.conditionState.clinicalStateId,
      timeScopeId: request.conditionState.timeScopeId,
      severityAxisId: request.derivationOwner.severityAxisId,
      derivationPolicyId: policy.id,
      symptomSeverityInputId: symptomSeverity.id,
      symptomSeverityPayloadFingerprint: symptomSeverity.resolutionOwner.payloadFingerprint,
      functionalImpairmentArtifactId: request.functionalImpairmentResolution.id,
      functionalImpairmentPayloadFingerprint:
        request.functionalImpairmentResolution.payloadFingerprint,
      qualitativeLevel,
    }),
    patientStateId: request.patientStateId,
    target: {
      kind: 'condition_state' as const,
      conditionStateId: request.conditionState.id,
    },
    diagnosisDefinitionId: request.conditionState.diagnosisDefinitionId,
    diagnosisDefinitionContentVersion: request.conditionState.diagnosisDefinitionContentVersion,
    clinicalStateId: request.conditionState.clinicalStateId,
    timeScopeId: request.conditionState.timeScopeId,
    qualitativeLevel,
    inputLevels: {
      symptomSeverity: symptomSeverity.level,
      conditionAttributedFunctionalImpairment: functionalImpairment.level,
    },
    severityAxisId: request.derivationOwner.severityAxisId,
    derivationPolicyId: policy.id,
    derivationStrategy: policy.strategy,
    symptomSeverityInputId: symptomSeverity.id,
    symptomSeverityPayloadFingerprint: symptomSeverity.resolutionOwner.payloadFingerprint,
    functionalImpairmentArtifactId: request.functionalImpairmentResolution.id,
    functionalImpairmentPayloadFingerprint:
      request.functionalImpairmentResolution.payloadFingerprint,
    compilerVersion: CONDITION_EPISODE_SEVERITY_DERIVATION_COMPILER_VERSION,
    attachmentStatus: 'derived_descriptor_only' as const,
  };
  const payload = {
    schemaVersion: 1 as const,
    compilerVersion: CONDITION_EPISODE_SEVERITY_DERIVATION_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: request.patientStateId,
    conditionStateId: request.conditionState.id,
    diagnosisOwnerRef: {
      diagnosisDefinitionId: request.derivationOwner.diagnosisDefinitionId,
      diagnosisDefinitionContentVersion: request.derivationOwner.diagnosisDefinitionContentVersion,
      severityAxisId: request.derivationOwner.severityAxisId,
      derivationPolicyId: policy.id,
    },
    symptomSeverityInputRef: {
      id: symptomSeverity.id,
      payloadFingerprint: symptomSeverity.resolutionOwner.payloadFingerprint,
    },
    functionalImpairmentArtifactRef: {
      id: request.functionalImpairmentResolution.id,
      payloadFingerprint: request.functionalImpairmentResolution.payloadFingerprint,
    },
    resolvedEpisodeSeverity,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', payload);
  const output = ConditionEpisodeSeverityDerivationArtifactSchema.safeParse({
    ...payload,
    id: `condition-episode-severity-derivation.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues));
  }
  return { ok: true, value: output.data };
};

export const verifyConditionEpisodeSeverityDerivationIntegrity = (
  rawArtifact: ConditionEpisodeSeverityDerivationArtifact,
): ConditionEpisodeSeverityDerivationIntegrityResult => {
  const parsed = ConditionEpisodeSeverityDerivationArtifactSchema.safeParse(rawArtifact);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  if (parsed.data.compilerVersion !== CONDITION_EPISODE_SEVERITY_DERIVATION_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported condition-episode-severity compiler ${parsed.data.compilerVersion}.`,
      },
    };
  }
  const replay = deriveConditionEpisodeSeverity(parsed.data.compileRequest);
  if (!replay.ok) {
    return {
      ok: false,
      error: { code: 'REPLAY_FAILED', message: replay.error.message },
    };
  }
  if (!sameExactValue(replay.value, parsed.data)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: 'Condition-episode-severity artifact does not match deterministic replay.',
      },
    };
  }
  return { ok: true, value: parsed.data };
};
