import {
  getStructuredPatientStateRevealLaneRecordIds,
  StructuredPatientStateRevealProjectionEnvelopeSchema,
  StructuredSourceReportArtifactSchema,
  StructuredSourceReportCompileRequestSchema,
  type ClinicalRuleReview,
  type ResolvedPatientState,
  type StructuredPatientStateRevealDefinition,
  type StructuredPatientStateRevealLaneStatement,
  type StructuredPatientStateRevealProjectionRecipe,
  type StructuredPatientStateRevealSingletonField,
  type StructuredPatientStateRevealSingletonStatement,
  type StructuredSourceReportArtifact,
  type StructuredSourceReportCompileRequest,
  type StructuredSourceReportFingerprint,
  type StructuredSourceReportProfile,
  type StructuredSourceReportSingletonBehavior,
} from '@psychsim/schemas';

import { normalizeResolvedPatientState } from './resolved-patient-state-normalizer';

export const STRUCTURED_SOURCE_REPORT_COMPILER_VERSION = '1.0.0';

export type StructuredSourceReportCompileResult =
  | { readonly ok: true; readonly value: StructuredSourceReportArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'STALE_DEFINITION_FINGERPRINT'
          | 'PROFILE_DEFINITION_MISMATCH'
          | 'SOURCE_KIND_NOT_ALLOWED'
          | 'BEHAVIOR_COVERAGE_MISMATCH'
          | 'INVALID_D212_PROJECTION'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type StructuredSourceReportIntegrityResult =
  | { readonly ok: true; readonly value: StructuredSourceReportArtifact }
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

const fingerprint = (scope: string, value: unknown): StructuredSourceReportFingerprint =>
  `fingerprint.structured-source-report.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalizeObjectKeys(value)))}`;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

export const normalizeStructuredSourceReportPatientState = normalizeResolvedPatientState;

const normalizeReview = (review: ClinicalRuleReview): ClinicalRuleReview => ({
  ...review,
  sourceUseNoteIds: uniqueSorted(review.sourceUseNoteIds),
});

export const normalizeStructuredSourceReportDefinition = (
  definition: StructuredPatientStateRevealDefinition,
): StructuredPatientStateRevealDefinition => ({
  ...definition,
  allowedSourceKinds: [...definition.allowedSourceKinds].sort(compareStrings),
  lanes: [...definition.lanes].sort(compareStrings),
  singletonFields: [...definition.singletonFields].sort(compareStrings),
  review: normalizeReview(definition.review),
});

export const normalizeStructuredSourceReportProfile = (
  profile: StructuredSourceReportProfile,
): StructuredSourceReportProfile => ({
  ...profile,
  source: { ...profile.source },
  dependencyGroupIds: uniqueSorted(profile.dependencyGroupIds),
  laneBehaviors: [...profile.laneBehaviors].sort((left, right) =>
    compareStrings(left.lane, right.lane),
  ),
  singletonBehaviors: [...profile.singletonBehaviors].sort((left, right) =>
    compareStrings(left.field, right.field),
  ),
  developerOpinionIds: uniqueSorted(profile.developerOpinionIds),
  review: normalizeReview(profile.review),
});

const normalizeRequest = (
  request: StructuredSourceReportCompileRequest,
): StructuredSourceReportCompileRequest => ({
  ...request,
  patientState: normalizeStructuredSourceReportPatientState(request.patientState),
  definitions: [...request.definitions]
    .map(normalizeStructuredSourceReportDefinition)
    .sort((left, right) =>
      compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
    ),
  profiles: [...request.profiles]
    .map(normalizeStructuredSourceReportProfile)
    .sort((left, right) =>
      compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
    ),
});

export const fingerprintStructuredSourceReportDefinition = (
  definition: StructuredPatientStateRevealDefinition,
): StructuredSourceReportFingerprint =>
  fingerprint('definition', normalizeStructuredSourceReportDefinition(definition));

export const fingerprintStructuredSourceReportProfile = (
  profile: StructuredSourceReportProfile,
): StructuredSourceReportFingerprint =>
  fingerprint('profile', normalizeStructuredSourceReportProfile(profile));

export const fingerprintStructuredSourceReportPatientState = (
  patientState: ResolvedPatientState,
): StructuredSourceReportFingerprint =>
  fingerprint('patient-state', normalizeStructuredSourceReportPatientState(patientState));

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const fail = (
  code: Extract<StructuredSourceReportCompileResult, { ok: false }>['error']['code'],
  message: string,
  contentIds: readonly string[],
): StructuredSourceReportCompileResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const buildLaneStatement = (
  patientState: ResolvedPatientState,
  behavior: StructuredSourceReportProfile['laneBehaviors'][number],
): StructuredPatientStateRevealLaneStatement => {
  const truthRecordIds = getStructuredPatientStateRevealLaneRecordIds(
    patientState,
    behavior.lane,
  ).sort(compareStrings);
  switch (behavior.behavior) {
    case 'report_all': {
      const reactionUnassessed =
        behavior.lane === 'reaction_records' &&
        patientState.reactionHistory.status === 'unassessed';
      return {
        lane: behavior.lane,
        presentationStatus: reactionUnassessed
          ? 'unassessed'
          : truthRecordIds.length > 0
            ? 'items_present'
            : 'none_reported',
        includedTruthRecordIds: reactionUnassessed ? [] : truthRecordIds,
        omittedTruthRecordIds: [],
        relationshipToTruth: reactionUnassessed ? 'indeterminate' : 'aligned',
      };
    }
    case 'none_reported':
      return {
        lane: behavior.lane,
        presentationStatus: 'none_reported',
        includedTruthRecordIds: [],
        omittedTruthRecordIds: truthRecordIds,
        relationshipToTruth: truthRecordIds.length > 0 ? 'misaligned' : 'aligned',
      };
    case 'unassessed':
    case 'unable_to_assess':
      return {
        lane: behavior.lane,
        presentationStatus: behavior.behavior,
        includedTruthRecordIds: [],
        omittedTruthRecordIds: truthRecordIds,
        relationshipToTruth: 'indeterminate',
      };
  }
};

const singletonRelationship = (
  field: StructuredPatientStateRevealSingletonField,
  truthValue: string,
  presentedValue: string,
): 'aligned' | 'misaligned' | 'indeterminate' => {
  if (field === 'reported_safety_planning_ability') {
    if (
      ['unassessed', 'uncertain'].includes(truthValue) ||
      ['unassessed', 'uncertain'].includes(presentedValue)
    ) {
      return 'indeterminate';
    }
    return truthValue === presentedValue ? 'aligned' : 'misaligned';
  }
  if (truthValue === 'unassessed' || presentedValue === 'unassessed') {
    return 'indeterminate';
  }
  return truthValue === presentedValue ? 'aligned' : 'misaligned';
};

const buildSingletonStatement = (
  patientState: ResolvedPatientState,
  behavior: StructuredSourceReportSingletonBehavior,
): StructuredPatientStateRevealSingletonStatement => {
  switch (behavior.field) {
    case 'reaction_history_status': {
      const truthValue = patientState.reactionHistory.status;
      const presentedValue =
        behavior.presentation.kind === 'mirror_truth' ? truthValue : behavior.presentation.value;
      return {
        field: behavior.field,
        truthValue,
        presentedValue,
        relationshipToTruth: singletonRelationship(behavior.field, truthValue, presentedValue),
      };
    }
    case 'medication_reaction_assessment_status': {
      const truthValue = patientState.reactionHistory.medicationAssessmentStatus;
      const presentedValue =
        behavior.presentation.kind === 'mirror_truth' ? truthValue : behavior.presentation.value;
      return {
        field: behavior.field,
        truthValue,
        presentedValue,
        relationshipToTruth: singletonRelationship(behavior.field, truthValue, presentedValue),
      };
    }
    case 'reported_safety_planning_ability': {
      const truthValue = patientState.reportedSafetyPlanningAbility;
      const presentedValue =
        behavior.presentation.kind === 'mirror_truth' ? truthValue : behavior.presentation.value;
      return {
        field: behavior.field,
        truthValue,
        presentedValue,
        relationshipToTruth: singletonRelationship(behavior.field, truthValue, presentedValue),
      };
    }
  }
};

const artifactPayload = (
  artifact: Omit<StructuredSourceReportArtifact, 'id' | 'payloadFingerprint'>,
): unknown => artifact;

/**
 * Resolves exact whole-lane source behavior after patient truth is frozen.
 * This compiler never selects behavior probabilities, reads or writes D-201
 * accounting, purchases an action, reveals a result, or assigns points.
 */
export const compileStructuredSourceReports = (
  input: unknown,
): StructuredSourceReportCompileResult => {
  const parsed = StructuredSourceReportCompileRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }
  const request = normalizeRequest(parsed.data);
  const definitionsByVersion = new Map(
    request.definitions.map((definition) => [
      `${definition.id}\u0000${definition.contentVersion}`,
      definition,
    ]),
  );
  const projectionRecipes: StructuredPatientStateRevealProjectionRecipe[] = [];
  const profileReferences: StructuredSourceReportArtifact['profileReferences'] = [];
  const patientStateFingerprint = fingerprintStructuredSourceReportPatientState(
    request.patientState,
  );

  for (const profile of request.profiles) {
    const definition = definitionsByVersion.get(
      `${profile.definitionRef.id}\u0000${profile.definitionRef.contentVersion}`,
    );
    if (!definition) {
      return fail(
        'PROFILE_DEFINITION_MISMATCH',
        `${profile.id} does not reference an included exact D-212 definition.`,
        [profile.id, profile.definitionRef.id],
      );
    }
    const definitionFingerprint = fingerprintStructuredSourceReportDefinition(definition);
    if (profile.definitionFingerprint !== definitionFingerprint) {
      return fail(
        'STALE_DEFINITION_FINGERPRINT',
        `${profile.id} does not pin the current payload for ${definition.id}.`,
        [profile.id, definition.id],
      );
    }
    if (!definition.allowedSourceKinds.includes(profile.source.kind)) {
      return fail(
        'SOURCE_KIND_NOT_ALLOWED',
        `${profile.source.kind} is not allowed by ${definition.id}.`,
        [profile.id, definition.id, profile.source.sourceInstanceId],
      );
    }
    const expectedLanes = [...definition.lanes].sort(compareStrings);
    const actualLanes = profile.laneBehaviors.map((behavior) => behavior.lane).sort(compareStrings);
    const expectedFields = [...definition.singletonFields].sort(compareStrings);
    const actualFields = profile.singletonBehaviors
      .map((behavior) => behavior.field)
      .sort(compareStrings);
    if (
      expectedLanes.join('\u0000') !== actualLanes.join('\u0000') ||
      expectedFields.join('\u0000') !== actualFields.join('\u0000')
    ) {
      return fail(
        'BEHAVIOR_COVERAGE_MISMATCH',
        `${profile.id} must resolve every lane and singleton field declared by ${definition.id} exactly once.`,
        [profile.id, definition.id, ...expectedLanes, ...expectedFields],
      );
    }

    const profileFingerprint = fingerprintStructuredSourceReportProfile(profile);
    const resolvedProjectionId = stableId('structured-reveal.generated', {
      patientStateId: request.patientState.id,
      patientStateFingerprint,
      definitionId: definition.id,
      definitionContentVersion: definition.contentVersion,
      profileId: profile.id,
      profileContentVersion: profile.contentVersion,
      profileFingerprint,
    });
    const stableResolutionId = stableId('stable-resolution.structured-source-report', {
      patientStateId: request.patientState.id,
      patientStateFingerprint,
      profileId: profile.id,
      profileContentVersion: profile.contentVersion,
      profileFingerprint,
    });
    const resolved = {
      schemaVersion: 1,
      id: resolvedProjectionId,
      definitionId: definition.id,
      definitionContentVersion: definition.contentVersion,
      informationActionId: definition.informationActionId,
      informationActionPayloadFingerprint: definition.informationActionPayloadFingerprint,
      patientStateId: request.patientState.id,
      source: { ...profile.source },
      timeScopeId: profile.timeScopeId,
      claimOriginId: profile.claimOriginId,
      dependencyGroupIds: [...profile.dependencyGroupIds],
      laneStatements: profile.laneBehaviors.map((behavior) =>
        buildLaneStatement(request.patientState, behavior),
      ),
      singletonStatements: profile.singletonBehaviors.map((behavior) =>
        buildSingletonStatement(request.patientState, behavior),
      ),
      resolution: {
        origin: 'deterministic_generation' as const,
        generationProfileId: profile.id,
        generationProfileContentVersion: profile.contentVersion,
        resolverVersion: STRUCTURED_SOURCE_REPORT_COMPILER_VERSION,
        stableDrawId: stableResolutionId,
      },
    };
    const envelope = StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse({
      definition,
      patientState: request.patientState,
      resolved,
    });
    if (!envelope.success) {
      return fail('INVALID_D212_PROJECTION', issuesText(envelope.error.issues), [
        profile.id,
        definition.id,
        request.patientState.id,
      ]);
    }
    projectionRecipes.push({
      definition: envelope.data.definition,
      resolved: envelope.data.resolved,
    });
    profileReferences.push({
      profileRef: { id: profile.id, contentVersion: profile.contentVersion },
      profileFingerprint,
      definitionRef: { id: definition.id, contentVersion: definition.contentVersion },
      definitionFingerprint,
      resolvedProjectionId,
    });
  }

  projectionRecipes.sort((left, right) => compareStrings(left.resolved.id, right.resolved.id));
  profileReferences.sort((left, right) => compareStrings(left.profileRef.id, right.profileRef.id));
  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity: Omit<StructuredSourceReportArtifact, 'id' | 'payloadFingerprint'> = {
    schemaVersion: 1,
    compilerVersion: STRUCTURED_SOURCE_REPORT_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: request.patientState.id,
    patientStateFingerprint,
    profileReferences,
    projectionRecipes,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
  const output = StructuredSourceReportArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `structured-source-reports.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [request.id]);
  }
  return { ok: true, value: output.data };
};

export const verifyStructuredSourceReportArtifactIntegrity = (
  value: unknown,
): StructuredSourceReportIntegrityResult => {
  const parsed = StructuredSourceReportArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  if (parsed.data.compilerVersion !== STRUCTURED_SOURCE_REPORT_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${parsed.data.id} uses unsupported compiler ${parsed.data.compilerVersion}.`,
      },
    };
  }
  const replay = compileStructuredSourceReports(parsed.data.compileRequest);
  if (!replay.ok) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_FAILED',
        message: `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  if (!sameExactValue(parsed.data, replay.value)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: `${parsed.data.id} does not match deterministic D-215 replay.`,
      },
    };
  }
  return { ok: true, value: parsed.data };
};
