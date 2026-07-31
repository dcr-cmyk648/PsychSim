import {
  TargetScopedPatientValueProjectionArtifactSchema,
  TargetScopedPatientValueProjectionCompileRequestSchema,
  type ClinicalRuleReview,
  type FrozenTargetScopedPatientValue,
  type FrozenTargetScopedPatientValueReveal,
  type InformationActionDefinition,
  type PatientStateTargetReference,
  type ResolvedPatientState,
  type ResolvedTargetScopedPatientValueProjection,
  type TargetScopedPatientValue,
  type TargetScopedPatientValueProjectionArtifact,
  type TargetScopedPatientValueProjectionCompileRequest,
  type TargetScopedPatientValueProjectionDefinition,
  type TargetScopedPatientValueProjectionFingerprint,
  type TargetScopedPatientValueTargetSelector,
} from '@psychsim/schemas';

import { normalizeResolvedPatientState } from './resolved-patient-state-normalizer';
import { fingerprintInformationActionPayload } from './information-action-fingerprint';

export const TARGET_SCOPED_PATIENT_VALUE_PROJECTION_COMPILER_VERSION = '1.0.0';

export type TargetScopedPatientValueProjectionCompileResult =
  | { readonly ok: true; readonly value: TargetScopedPatientValueProjectionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'UNAPPROVED_DEFINITION'
          | 'ACTION_PAYLOAD_FINGERPRINT_MISMATCH'
          | 'OVERLAPPING_RECORD_PROJECTION'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type TargetScopedPatientValueProjectionIntegrityResult =
  | { readonly ok: true; readonly value: TargetScopedPatientValueProjectionArtifact }
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
): TargetScopedPatientValueProjectionFingerprint =>
  `fingerprint.target-scoped-patient-value.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalizeObjectKeys(value)))}`;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const sortById = <Value extends { readonly id: string }>(values: readonly Value[]): Value[] =>
  [...values].sort((left, right) => compareStrings(left.id, right.id));

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const normalizeReview = (review: ClinicalRuleReview): ClinicalRuleReview => ({
  ...review,
  sourceUseNoteIds: uniqueSorted(review.sourceUseNoteIds),
});

const targetSelectorKey = (selector: TargetScopedPatientValueTargetSelector): string =>
  JSON.stringify(canonicalizeObjectKeys(selector));

export const normalizeTargetScopedPatientValueProjectionDefinition = (
  definition: TargetScopedPatientValueProjectionDefinition,
): TargetScopedPatientValueProjectionDefinition => ({
  ...definition,
  targetSelector: { ...definition.targetSelector },
  review: normalizeReview(definition.review),
});

const normalizeInformationAction = (
  action: InformationActionDefinition,
): InformationActionDefinition => ({
  ...action,
  searchAliases: uniqueSorted(action.searchAliases),
});

const normalizeRequest = (
  request: TargetScopedPatientValueProjectionCompileRequest,
): TargetScopedPatientValueProjectionCompileRequest =>
  TargetScopedPatientValueProjectionCompileRequestSchema.parse({
    ...request,
    patientState: normalizeResolvedPatientState(request.patientState),
    informationActions: sortById(request.informationActions.map(normalizeInformationAction)),
    definitions: [...request.definitions]
      .map(normalizeTargetScopedPatientValueProjectionDefinition)
      .sort((left, right) =>
        compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
      ),
  });

export const fingerprintTargetScopedPatientValueProjectionDefinition = (
  definition: TargetScopedPatientValueProjectionDefinition,
): TargetScopedPatientValueProjectionFingerprint =>
  fingerprint('definition', normalizeTargetScopedPatientValueProjectionDefinition(definition));

const fail = (
  code: Extract<TargetScopedPatientValueProjectionCompileResult, { ok: false }>['error']['code'],
  message: string,
  contentIds: readonly string[],
): TargetScopedPatientValueProjectionCompileResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const resolveTargetSelector = (
  patientState: ResolvedPatientState,
  target: PatientStateTargetReference,
): TargetScopedPatientValueTargetSelector => {
  switch (target.kind) {
    case 'condition_state': {
      const condition = patientState.conditionStates.find(
        (candidate) => candidate.id === target.conditionStateId,
      );
      if (!condition) {
        throw new Error(`Unknown condition-state target ${target.conditionStateId}.`);
      }
      return {
        kind: 'condition_definition',
        diagnosisDefinitionId: condition.diagnosisDefinitionId,
        diagnosisDefinitionContentVersion: condition.diagnosisDefinitionContentVersion,
      };
    }
    case 'canonical_finding': {
      const finding = patientState.canonicalFindings.find(
        (candidate) => candidate.id === target.canonicalFindingId,
      );
      if (!finding) {
        throw new Error(`Unknown canonical-finding target ${target.canonicalFindingId}.`);
      }
      return {
        kind: 'finding_definition',
        findingDefinitionId: finding.definitionId,
        findingDefinitionContentVersion: finding.definitionContentVersion,
      };
    }
    case 'latent_proposition': {
      const proposition = patientState.propositionState.propositions.find(
        (candidate) => candidate.id === target.propositionId,
      );
      if (!proposition) {
        throw new Error(`Unknown proposition target ${target.propositionId}.`);
      }
      return {
        kind: 'proposition_definition',
        propositionDefinitionId: proposition.definitionId,
        propositionDefinitionContentVersion: proposition.definitionContentVersion,
      };
    }
  }
};

type SourceRecord =
  | ResolvedPatientState['clinicalDurations'][number]
  | ResolvedPatientState['subjectiveBurdenRecords'][number];

const recordKind = (record: SourceRecord): TargetScopedPatientValue['kind'] =>
  'value' in record ? 'clinical_duration' : 'subjective_burden';

const recordMatchesDefinition = (
  patientState: ResolvedPatientState,
  record: SourceRecord,
  definition: TargetScopedPatientValueProjectionDefinition,
): boolean =>
  definition.valueKind === recordKind(record) &&
  definition.sourceKind === record.source.kind &&
  definition.timeScopeId === record.timeScopeId &&
  targetSelectorKey(definition.targetSelector) ===
    targetSelectorKey(resolveTargetSelector(patientState, record.target)) &&
  (definition.valueKind === 'clinical_duration'
    ? 'durationProfileId' in record && record.durationProfileId === definition.durationProfileId
    : !('durationProfileId' in record) &&
      record.ordinalScaleId === definition.ordinalScaleId &&
      record.ordinalScaleContentVersion === definition.ordinalScaleContentVersion);

const targetInstanceIds = (
  patientState: ResolvedPatientState,
  selector: TargetScopedPatientValueTargetSelector,
): string[] => {
  switch (selector.kind) {
    case 'condition_definition':
      return patientState.conditionStates
        .filter(
          (condition) =>
            condition.diagnosisDefinitionId === selector.diagnosisDefinitionId &&
            condition.diagnosisDefinitionContentVersion ===
              selector.diagnosisDefinitionContentVersion,
        )
        .map((condition) => condition.id)
        .sort(compareStrings);
    case 'finding_definition':
      return patientState.canonicalFindings
        .filter(
          (finding) =>
            finding.definitionId === selector.findingDefinitionId &&
            finding.definitionContentVersion === selector.findingDefinitionContentVersion,
        )
        .map((finding) => finding.id)
        .sort(compareStrings);
    case 'proposition_definition':
      return patientState.propositionState.propositions
        .filter(
          (proposition) =>
            proposition.definitionId === selector.propositionDefinitionId &&
            proposition.definitionContentVersion === selector.propositionDefinitionContentVersion,
        )
        .map((proposition) => proposition.id)
        .sort(compareStrings);
  }
};

const authoringValue = (record: SourceRecord): TargetScopedPatientValue =>
  'value' in record
    ? {
        kind: 'clinical_duration',
        recordId: record.id,
        target: record.target,
        source: record.source,
        timeScopeId: record.timeScopeId,
        value: record.value,
        unit: record.unit,
        durationProfileId: record.durationProfileId,
        durationOptionId: record.durationOptionId,
      }
    : {
        kind: 'subjective_burden',
        recordId: record.id,
        target: record.target,
        source: record.source,
        timeScopeId: record.timeScopeId,
        ordinalScaleId: record.ordinalScaleId,
        ordinalScaleContentVersion: record.ordinalScaleContentVersion,
        ordinalValueId: record.ordinalValueId,
      };

const frozenValue = (
  definition: TargetScopedPatientValueProjectionDefinition,
  record: SourceRecord,
): FrozenTargetScopedPatientValue => {
  const id = stableId('target-scoped-patient-value', {
    definitionId: definition.id,
    definitionContentVersion: definition.contentVersion,
    recordId: record.id,
  });
  return 'value' in record
    ? {
        id,
        kind: 'clinical_duration',
        sourceKind: record.source.kind,
        sourceInstanceId: record.source.sourceInstanceId,
        timeScopeId: record.timeScopeId,
        value: record.value,
        unit: record.unit,
      }
    : {
        id,
        kind: 'subjective_burden',
        sourceKind: record.source.kind,
        sourceInstanceId: record.source.sourceInstanceId,
        timeScopeId: record.timeScopeId,
        ordinalScaleId: record.ordinalScaleId,
        ordinalScaleContentVersion: record.ordinalScaleContentVersion,
        ordinalValueId: record.ordinalValueId,
      };
};

const projectionPayload = (
  projection: Omit<ResolvedTargetScopedPatientValueProjection, 'id' | 'payloadFingerprint'>,
): unknown => projection;

const frozenRevealPayload = (
  reveal: Omit<FrozenTargetScopedPatientValueReveal, 'id' | 'payloadFingerprint'>,
): unknown => reveal;

const artifactPayload = (
  artifact: Omit<TargetScopedPatientValueProjectionArtifact, 'id' | 'payloadFingerprint'>,
): unknown => artifact;

/**
 * Projects already-frozen duration and subjective-burden records through
 * exact action, target-definition, source-kind, and time-scope horizons.
 * It does not create truth, wording, clinical interpretation, points,
 * probability, or optional-feature complexity.
 */
export const compileTargetScopedPatientValueProjections = (
  input: unknown,
): TargetScopedPatientValueProjectionCompileResult => {
  const parsed = TargetScopedPatientValueProjectionCompileRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }
  const request = normalizeRequest(parsed.data);
  const actionById = new Map(request.informationActions.map((action) => [action.id, action]));
  const allRecords: SourceRecord[] = [
    ...request.patientState.clinicalDurations,
    ...request.patientState.subjectiveBurdenRecords,
  ];
  const definitionReferences: TargetScopedPatientValueProjectionArtifact['definitionReferences'] =
    [];
  const evaluations: TargetScopedPatientValueProjectionArtifact['evaluations'] = [];
  const projections: ResolvedTargetScopedPatientValueProjection[] = [];
  const frozenReveals: FrozenTargetScopedPatientValueReveal[] = [];
  const matchedDefinitionIdsByActionRecord = new Map<string, string[]>();

  for (const definition of request.definitions) {
    if (definition.lifecycle !== 'approved' || definition.review.status !== 'approved') {
      return fail(
        'UNAPPROVED_DEFINITION',
        `${definition.id} must have approved lifecycle and clinical review before it can project a patient value.`,
        [definition.id],
      );
    }
    const action = actionById.get(definition.informationActionId);
    const expectedActionFingerprint =
      action === undefined ? null : fingerprintInformationActionPayload(action);
    if (
      action === undefined ||
      definition.informationActionPayloadFingerprint !== expectedActionFingerprint
    ) {
      return fail(
        'ACTION_PAYLOAD_FINGERPRINT_MISMATCH',
        `${definition.id} does not pin the exact current payload for ${definition.informationActionId}.`,
        [definition.id, definition.informationActionId],
      );
    }
    const definitionFingerprint =
      fingerprintTargetScopedPatientValueProjectionDefinition(definition);
    definitionReferences.push({
      id: definition.id,
      contentVersion: definition.contentVersion,
      fingerprint: definitionFingerprint,
    });
    const resolvedTargetInstanceIds = targetInstanceIds(
      request.patientState,
      definition.targetSelector,
    );
    if (resolvedTargetInstanceIds.length !== 1) {
      evaluations.push({
        definitionId: definition.id,
        definitionContentVersion: definition.contentVersion,
        definitionFingerprint,
        informationActionId: definition.informationActionId,
        targetInstanceIds: resolvedTargetInstanceIds,
        matchedRecordIds: [],
        valueBindings: [],
        status: resolvedTargetInstanceIds.length === 0 ? 'not_applicable' : 'ambiguous_target',
        resolvedProjectionId: null,
        frozenRevealId: null,
      });
      continue;
    }
    const matchedRecords = allRecords
      .filter((record) => recordMatchesDefinition(request.patientState, record, definition))
      .sort((left, right) => compareStrings(left.id, right.id));
    for (const record of matchedRecords) {
      const actionRecordKey = `${definition.informationActionId}\u0000${record.id}`;
      const definitionIds = matchedDefinitionIdsByActionRecord.get(actionRecordKey) ?? [];
      definitionIds.push(definition.id);
      matchedDefinitionIdsByActionRecord.set(actionRecordKey, definitionIds);
    }

    if (matchedRecords.length === 0) {
      evaluations.push({
        definitionId: definition.id,
        definitionContentVersion: definition.contentVersion,
        definitionFingerprint,
        informationActionId: definition.informationActionId,
        targetInstanceIds: resolvedTargetInstanceIds,
        matchedRecordIds: [],
        valueBindings: [],
        status: 'missing_required_value',
        resolvedProjectionId: null,
        frozenRevealId: null,
      });
      continue;
    }

    const withoutProjectionIdentity: Omit<
      ResolvedTargetScopedPatientValueProjection,
      'id' | 'payloadFingerprint'
    > = {
      schemaVersion: 1,
      definitionId: definition.id,
      definitionContentVersion: definition.contentVersion,
      definitionFingerprint,
      informationActionId: definition.informationActionId,
      informationActionPayloadFingerprint: definition.informationActionPayloadFingerprint,
      patientStateId: request.patientState.id,
      values: matchedRecords.map(authoringValue),
    };
    const projectionFingerprint = fingerprint(
      'projection',
      projectionPayload(withoutProjectionIdentity),
    );
    const projection: ResolvedTargetScopedPatientValueProjection = {
      ...withoutProjectionIdentity,
      id: `target-scoped-patient-values.${projectionFingerprint.slice(-16)}`,
      payloadFingerprint: projectionFingerprint,
    };

    const withoutFrozenIdentity: Omit<
      FrozenTargetScopedPatientValueReveal,
      'id' | 'payloadFingerprint'
    > = {
      schemaVersion: 1,
      definitionId: definition.id,
      definitionContentVersion: definition.contentVersion,
      definitionFingerprint,
      informationActionId: definition.informationActionId,
      informationActionPayloadFingerprint: definition.informationActionPayloadFingerprint,
      patientStateId: request.patientState.id,
      values: matchedRecords.map((record) => frozenValue(definition, record)),
    };
    const frozenFingerprint = fingerprint(
      'frozen-reveal',
      frozenRevealPayload(withoutFrozenIdentity),
    );
    const frozenReveal: FrozenTargetScopedPatientValueReveal = {
      ...withoutFrozenIdentity,
      id: `frozen-target-scoped-patient-values.${frozenFingerprint.slice(-16)}`,
      payloadFingerprint: frozenFingerprint,
    };
    projections.push(projection);
    frozenReveals.push(frozenReveal);
    evaluations.push({
      definitionId: definition.id,
      definitionContentVersion: definition.contentVersion,
      definitionFingerprint,
      informationActionId: definition.informationActionId,
      targetInstanceIds: resolvedTargetInstanceIds,
      matchedRecordIds: matchedRecords.map((record) => record.id),
      valueBindings: matchedRecords.map((record, index) => ({
        recordId: record.id,
        frozenValueId: frozenReveal.values[index]!.id,
      })),
      status: 'complete',
      resolvedProjectionId: projection.id,
      frozenRevealId: frozenReveal.id,
    });
  }

  const overlappingRecords = [...matchedDefinitionIdsByActionRecord.entries()].filter(
    ([, definitionIds]) => definitionIds.length > 1,
  );
  if (overlappingRecords.length > 0) {
    return fail(
      'OVERLAPPING_RECORD_PROJECTION',
      'Each action may receive one frozen target-scoped patient record through at most one projection definition.',
      overlappingRecords.flatMap(([actionRecordKey, definitionIds]) => [
        ...actionRecordKey.split('\u0000'),
        ...definitionIds,
      ]),
    );
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity: Omit<
    TargetScopedPatientValueProjectionArtifact,
    'id' | 'payloadFingerprint'
  > = {
    schemaVersion: 1,
    compilerVersion: TARGET_SCOPED_PATIENT_VALUE_PROJECTION_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: request.patientState.id,
    definitionReferences: [...definitionReferences].sort((left, right) =>
      compareStrings(left.id, right.id),
    ),
    evaluations: [...evaluations].sort((left, right) =>
      compareStrings(left.definitionId, right.definitionId),
    ),
    projections: [...projections].sort((left, right) => compareStrings(left.id, right.id)),
    frozenReveals: [...frozenReveals].sort((left, right) => compareStrings(left.id, right.id)),
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
  const output = TargetScopedPatientValueProjectionArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `target-scoped-patient-value-projections.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
      request.id,
      request.patientState.id,
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyTargetScopedPatientValueProjectionArtifactIntegrity = (
  value: unknown,
): TargetScopedPatientValueProjectionIntegrityResult => {
  const parsed = TargetScopedPatientValueProjectionArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  if (parsed.data.compilerVersion !== TARGET_SCOPED_PATIENT_VALUE_PROJECTION_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${parsed.data.id} uses unsupported compiler ${parsed.data.compilerVersion}.`,
      },
    };
  }
  const replay = compileTargetScopedPatientValueProjections(parsed.data.compileRequest);
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
        message: `${parsed.data.id} does not match deterministic D-240 replay.`,
      },
    };
  }
  return { ok: true, value: parsed.data };
};
