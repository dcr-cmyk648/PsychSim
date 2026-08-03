import {
  ConditionFunctionalImpairmentResolutionArtifactSchema,
  ConditionFunctionalImpairmentResolutionRequestSchema,
  type ConditionFunctionalImpairmentProfile,
  type ConditionFunctionalImpairmentResolutionArtifact,
  type ConditionFunctionalImpairmentResolutionFingerprint,
  type ConditionFunctionalImpairmentResolutionRequest,
} from '@psychsim/schemas';

import { seededUnit } from './rng';

export const CONDITION_FUNCTIONAL_IMPAIRMENT_RESOLVER_VERSION = '1.0.0';

export type ConditionFunctionalImpairmentResolutionResult =
  | { readonly ok: true; readonly value: ConditionFunctionalImpairmentResolutionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_REQUEST' | 'UNAPPROVED_PROFILE' | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type ConditionFunctionalImpairmentResolutionIntegrityResult =
  | { readonly ok: true; readonly value: ConditionFunctionalImpairmentResolutionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_RESOLVER_VERSION'
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
): ConditionFunctionalImpairmentResolutionFingerprint =>
  `fingerprint.condition-functional-impairment-resolution.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalizeObjectKeys(value)))}`;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const normalizeProfile = (
  profile: ConditionFunctionalImpairmentProfile,
): ConditionFunctionalImpairmentProfile => ({
  ...profile,
  options: [...profile.options].sort((left, right) => compareStrings(left.id, right.id)),
  ...(profile.developerOpinionIds === undefined
    ? {}
    : { developerOpinionIds: uniqueSorted(profile.developerOpinionIds) }),
  review: {
    ...profile.review,
    sourceUseNoteIds: uniqueSorted(profile.review.sourceUseNoteIds),
  },
});

const normalizeRequest = (
  request: ConditionFunctionalImpairmentResolutionRequest,
): ConditionFunctionalImpairmentResolutionRequest =>
  ConditionFunctionalImpairmentResolutionRequestSchema.parse({
    ...request,
    conditionState: {
      ...request.conditionState,
      specifierIds: uniqueSorted(request.conditionState.specifierIds),
    },
    profile: normalizeProfile(request.profile),
    source: { ...request.source },
  });

export const fingerprintConditionFunctionalImpairmentProfile = (
  profile: ConditionFunctionalImpairmentProfile,
): ConditionFunctionalImpairmentResolutionFingerprint =>
  fingerprint('profile', normalizeProfile(profile));

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const fail = (
  code: Extract<ConditionFunctionalImpairmentResolutionResult, { ok: false }>['error']['code'],
  message: string,
): ConditionFunctionalImpairmentResolutionResult => ({
  ok: false,
  error: { code, message },
});

const drawContext = (
  request: ConditionFunctionalImpairmentResolutionRequest,
  profileFingerprint: ConditionFunctionalImpairmentResolutionFingerprint,
): {
  readonly key: string;
  readonly stableDrawId: string;
} => {
  const payload = {
    patientStateId: request.patientStateId,
    conditionStateId: request.conditionState.id,
    diagnosisDefinitionId: request.conditionState.diagnosisDefinitionId,
    diagnosisDefinitionContentVersion: request.conditionState.diagnosisDefinitionContentVersion,
    clinicalStateId: request.conditionState.clinicalStateId,
    timeScopeId: request.timeScopeId,
    source: request.source,
    profileRef: {
      id: request.profile.id,
      contentVersion: request.profile.contentVersion,
    },
    profileFingerprint,
  };
  const key = JSON.stringify(canonicalizeObjectKeys(payload));
  return {
    key,
    stableDrawId: stableId('stable-draw.condition-functional-impairment.option', {
      ...payload,
      seedFingerprint: hashToHex64(request.seed),
    }),
  };
};

export const resolveConditionFunctionalImpairment = (
  rawRequest: ConditionFunctionalImpairmentResolutionRequest,
): ConditionFunctionalImpairmentResolutionResult => {
  const parsed = ConditionFunctionalImpairmentResolutionRequestSchema.safeParse(rawRequest);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues));
  }
  const request = normalizeRequest(parsed.data);
  if (
    request.profile.review.status !== 'approved' ||
    (request.profile.review.sourceUseNoteIds.length === 0 &&
      (request.profile.developerOpinionIds?.length ?? 0) === 0)
  ) {
    return fail(
      'UNAPPROVED_PROFILE',
      `${request.profile.id}@${request.profile.contentVersion} lacks approved reviewed provenance.`,
    );
  }

  const profileFingerprint = fingerprintConditionFunctionalImpairmentProfile(request.profile);
  const draw = drawContext(request, profileFingerprint);
  const selectedIndex = Math.min(
    request.profile.options.length - 1,
    Math.floor(seededUnit(request.seed, draw.key) * request.profile.options.length),
  );
  const selectedOption = request.profile.options[selectedIndex]!;
  const resolvedFunctionalImpairment = {
    schemaVersion: 1 as const,
    id: stableId('condition-functional-impairment', {
      patientStateId: request.patientStateId,
      conditionStateId: request.conditionState.id,
      profileFingerprint,
      stableDrawId: draw.stableDrawId,
      optionId: selectedOption.id,
    }),
    target: {
      kind: 'condition_state' as const,
      conditionStateId: request.conditionState.id,
    },
    attribution: 'condition_attributed' as const,
    level: selectedOption.level,
    functionalImpairmentProfileId: request.profile.id,
    functionalImpairmentProfileContentVersion: request.profile.contentVersion,
    functionalImpairmentOptionId: selectedOption.id,
    relatedDiagnosisId: request.profile.relatedDiagnosisId,
    source: { ...request.source },
    timeScopeId: request.timeScopeId,
    resolution: {
      origin: 'deterministic_generation' as const,
      generationProfileId: request.profile.id,
      generationProfileContentVersion: request.profile.contentVersion,
      resolverVersion: CONDITION_FUNCTIONAL_IMPAIRMENT_RESOLVER_VERSION,
      stableDrawId: draw.stableDrawId,
    },
  };
  const optionEvaluations = request.profile.options.map((option) => ({
    optionId: option.id,
    level: option.level,
    selected: option.id === selectedOption.id,
  }));
  const inputFingerprint = fingerprint('input', request);
  const payload = {
    schemaVersion: 1 as const,
    resolverVersion: CONDITION_FUNCTIONAL_IMPAIRMENT_RESOLVER_VERSION,
    requestId: request.id,
    patientStateId: request.patientStateId,
    conditionStateId: request.conditionState.id,
    profileRef: {
      id: request.profile.id,
      contentVersion: request.profile.contentVersion,
    },
    profileFingerprint,
    source: { ...request.source },
    timeScopeId: request.timeScopeId,
    stableDrawId: draw.stableDrawId,
    optionEvaluations,
    resolvedFunctionalImpairment,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', payload);
  const output = ConditionFunctionalImpairmentResolutionArtifactSchema.safeParse({
    ...payload,
    id: `condition-functional-impairment-resolution.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues));
  }
  return { ok: true, value: output.data };
};

export const verifyConditionFunctionalImpairmentResolutionIntegrity = (
  rawArtifact: ConditionFunctionalImpairmentResolutionArtifact,
): ConditionFunctionalImpairmentResolutionIntegrityResult => {
  const parsed = ConditionFunctionalImpairmentResolutionArtifactSchema.safeParse(rawArtifact);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  if (parsed.data.resolverVersion !== CONDITION_FUNCTIONAL_IMPAIRMENT_RESOLVER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_RESOLVER_VERSION',
        message: `Unsupported condition-functional-impairment resolver ${parsed.data.resolverVersion}.`,
      },
    };
  }
  const replay = resolveConditionFunctionalImpairment(parsed.data.compileRequest);
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
        message: 'Condition-functional-impairment artifact does not match deterministic replay.',
      },
    };
  }
  return { ok: true, value: parsed.data };
};
