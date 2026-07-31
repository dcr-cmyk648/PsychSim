import {
  TemplateConditionSelectionArtifactSchema,
  TemplateConditionSelectionRequestSchema,
  type ConditionState,
  type PatientTemplate,
  type PatientTemplateConditionConstraint,
  type ResolvedTemplateConditionBinding,
  type TemplateConditionCandidateEvaluation,
  type TemplateConditionGroupSelection,
  type TemplateConditionSelectionArtifact,
  type TemplateConditionSelectionFingerprint,
  type TemplateConditionSelectionProfile,
  type TemplateConditionSelectionRequest,
} from '@psychsim/schemas';

import { seededUnit } from './rng';

export const TEMPLATE_CONDITION_SELECTOR_VERSION = '1.0.0';

export type TemplateConditionSelectionResult =
  | {
      readonly ok: true;
      readonly value: TemplateConditionSelectionArtifact & {
        readonly status: 'selected';
      };
    }
  | {
      readonly ok: false;
      readonly conflict: {
        readonly code: 'LITERAL_CONDITION_INCOMPATIBILITY';
        readonly disposition: 'retry_or_quarantine';
        readonly artifact: TemplateConditionSelectionArtifact & {
          readonly status: 'literal_condition_incompatibility';
        };
      };
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_REQUEST' | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type TemplateConditionSelectionIntegrityResult =
  | { readonly ok: true; readonly value: TemplateConditionSelectionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_RESOLVER_VERSION'
          | 'DRAW_CONTEXT_MISMATCH'
          | 'PROVENANCE_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

export type TemplateConditionSelectionContextResult =
  | { readonly ok: true; readonly value: TemplateConditionSelectionArtifact }
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

const fingerprint = (scope: string, value: unknown): TemplateConditionSelectionFingerprint =>
  `fingerprint.template-condition-selector.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalizeObjectKeys(value)))}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const normalizeTemplate = (template: PatientTemplate): PatientTemplate => ({
  ...template,
  review: {
    ...template.review,
    sourceUseNoteIds: [...template.review.sourceUseNoteIds].sort(compareStrings),
  },
  compatibleLocationRefs: [...template.compatibleLocationRefs].sort((left, right) =>
    compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
  ),
  requiredConditions: [...template.requiredConditions]
    .map((condition) => ({
      ...condition,
      specifierIds: [...condition.specifierIds].sort(compareStrings),
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
  optionalConditionSelectionGroups: [...template.optionalConditionSelectionGroups]
    .map((group) => ({
      ...group,
      candidates: [...group.candidates]
        .map((condition) => ({
          ...condition,
          specifierIds: [...condition.specifierIds].sort(compareStrings),
        }))
        .sort((left, right) => compareStrings(left.id, right.id)),
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
  presentationRichnessEnvelope: {
    ...template.presentationRichnessEnvelope,
    decisionDriverCategories: [
      ...template.presentationRichnessEnvelope.decisionDriverCategories,
    ].sort(compareStrings),
  },
});

const normalizeProfile = (
  profile: TemplateConditionSelectionProfile,
): TemplateConditionSelectionProfile => ({
  ...profile,
  groupProfiles: [...profile.groupProfiles]
    .map((group) => ({
      ...group,
      countWeights: [...group.countWeights].sort(
        (left, right) => left.selectionCount - right.selectionCount,
      ),
      candidateWeights: [...group.candidateWeights].sort((left, right) =>
        compareStrings(left.templateConditionId, right.templateConditionId),
      ),
    }))
    .sort((left, right) => compareStrings(left.groupId, right.groupId)),
  incompatibilities: [...profile.incompatibilities]
    .map((incompatibility) => ({
      ...incompatibility,
      review: {
        ...incompatibility.review,
        sourceUseNoteIds: [...incompatibility.review.sourceUseNoteIds].sort(compareStrings),
      },
    }))
    .sort((left, right) => compareStrings(left.id, right.id)),
});

export const normalizeTemplateConditionSelectionRequest = (
  request: TemplateConditionSelectionRequest,
): TemplateConditionSelectionRequest => ({
  ...request,
  template: normalizeTemplate(request.template),
  profile: normalizeProfile(request.profile),
});

export const fingerprintTemplateConditionSelectionTemplate = (
  template: PatientTemplate,
): TemplateConditionSelectionFingerprint => fingerprint('template', normalizeTemplate(template));

export const fingerprintTemplateConditionSelectionProfile = (
  profile: TemplateConditionSelectionProfile,
): TemplateConditionSelectionFingerprint => fingerprint('profile', normalizeProfile(profile));

const weightedChoice = <
  Value extends {
    readonly gameSelectionWeight: number;
  },
>(
  values: readonly Value[],
  unit: number,
): Value => {
  const totalWeight = values.reduce((sum, value) => sum + value.gameSelectionWeight, 0);
  let cursor = unit * totalWeight;
  for (const value of values) {
    cursor -= value.gameSelectionWeight;
    if (cursor < 0) return value;
  }
  return values.at(-1)!;
};

interface DrawContextInput {
  readonly templateRef: { readonly id: string; readonly contentVersion: string };
  readonly profileRef: { readonly id: string; readonly contentVersion: string };
  readonly profileFingerprint: TemplateConditionSelectionFingerprint;
  readonly seed: string;
  readonly groupId: string;
  readonly lane: 'count' | 'candidate';
  readonly ordinal: number | null;
}

const drawContext = (
  input: DrawContextInput,
): {
  readonly key: string;
  readonly stableDrawId: string;
} => {
  const payload = {
    templateRef: input.templateRef,
    profileRef: input.profileRef,
    profileFingerprint: input.profileFingerprint,
    groupId: input.groupId,
    lane: input.lane,
    ordinal: input.ordinal,
  };
  const key = JSON.stringify(canonicalizeObjectKeys(payload));
  return {
    key,
    stableDrawId: stableId(
      input.lane === 'count'
        ? 'stable-draw.template-condition.count'
        : 'stable-draw.template-condition.candidate',
      { ...payload, seedFingerprint: hashToHex64(input.seed) },
    ),
  };
};

const materializeCondition = (
  template: PatientTemplate,
  profile: TemplateConditionSelectionProfile,
  constraint: PatientTemplateConditionConstraint,
  optionalStableDrawId: string | null,
): ConditionState => {
  const resolution =
    optionalStableDrawId === null
      ? ({
          origin: 'authored',
          ownerId: template.id,
          ownerContentVersion: template.contentVersion,
        } as const)
      : ({
          origin: 'deterministic_generation',
          generationProfileId: profile.id,
          generationProfileContentVersion: profile.contentVersion,
          resolverVersion: TEMPLATE_CONDITION_SELECTOR_VERSION,
          stableDrawId: optionalStableDrawId,
        } as const);
  return {
    schemaVersion: 1,
    id: stableId('condition-state', {
      templateRef: { id: template.id, contentVersion: template.contentVersion },
      templateConditionId: constraint.id,
      resolution,
    }),
    diagnosisDefinitionId: constraint.diagnosisDefinitionId,
    diagnosisDefinitionContentVersion: constraint.diagnosisDefinitionContentVersion,
    clinicalStateId: constraint.clinicalStateId,
    timeScopeId: constraint.timeScopeId,
    encounterRelevance: constraint.encounterRelevance,
    severityId: constraint.severityId,
    specifierIds: [...constraint.specifierIds],
    origin: optionalStableDrawId === null ? 'authored' : 'generated_optional',
    resolution,
  };
};

const bindingFor = (
  constraint: PatientTemplateConditionConstraint,
  condition: ConditionState,
  groupId: string | null,
): ResolvedTemplateConditionBinding =>
  groupId === null
    ? {
        schemaVersion: 1,
        id: stableId('condition-binding', {
          kind: 'required',
          templateConditionId: constraint.id,
          conditionStateId: condition.id,
        }),
        kind: 'required',
        templateConditionId: constraint.id,
        conditionStateId: condition.id,
      }
    : {
        schemaVersion: 1,
        id: stableId('condition-binding', {
          kind: 'optional_group',
          groupId,
          templateConditionId: constraint.id,
          conditionStateId: condition.id,
        }),
        kind: 'optional_group',
        groupId,
        templateConditionId: constraint.id,
        conditionStateId: condition.id,
      };

const artifactPayload = (
  artifact: Omit<TemplateConditionSelectionArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  resolverVersion: artifact.resolverVersion,
  requestId: artifact.requestId,
  status: artifact.status,
  templateRef: artifact.templateRef,
  templateFingerprint: artifact.templateFingerprint,
  profileRef: artifact.profileRef,
  profileFingerprint: artifact.profileFingerprint,
  seed: artifact.seed,
  requiredTemplateConditionIds: artifact.requiredTemplateConditionIds,
  groupSelections: artifact.groupSelections,
  conditionStates: artifact.conditionStates,
  conditionBindings: artifact.conditionBindings,
  conflicts: artifact.conflicts,
  inputFingerprint: artifact.inputFingerprint,
});

const buildArtifact = (
  request: TemplateConditionSelectionRequest,
): TemplateConditionSelectionArtifact => {
  const template = request.template;
  const profile = request.profile;
  const templateFingerprint = fingerprintTemplateConditionSelectionTemplate(template);
  const profileFingerprint = fingerprintTemplateConditionSelectionProfile(profile);
  const templateRef = { id: template.id, contentVersion: template.contentVersion };
  const profileRef = { id: profile.id, contentVersion: profile.contentVersion };
  const conditionStates: ConditionState[] = [];
  const conditionBindings: ResolvedTemplateConditionBinding[] = [];
  const stateByTemplateConditionId = new Map<string, ConditionState>();

  for (const constraint of template.requiredConditions) {
    const state = materializeCondition(template, profile, constraint, null);
    conditionStates.push(state);
    conditionBindings.push(bindingFor(constraint, state, null));
    stateByTemplateConditionId.set(constraint.id, state);
  }

  const groupProfilesByGroupId = new Map(
    profile.groupProfiles.map((group) => [group.groupId, group]),
  );
  const groupSelections: TemplateConditionGroupSelection[] = [];
  for (const group of template.optionalConditionSelectionGroups) {
    const groupProfile = groupProfilesByGroupId.get(group.id)!;
    const countDraw = drawContext({
      templateRef,
      profileRef,
      profileFingerprint,
      seed: request.seed,
      groupId: group.id,
      lane: 'count',
      ordinal: null,
    });
    const countChoice = weightedChoice(
      groupProfile.countWeights,
      seededUnit(request.seed, countDraw.key),
    );
    const remaining = groupProfile.candidateWeights.map((candidate) => ({
      ...candidate,
    }));
    const selectedById = new Map<
      string,
      { readonly ordinal: number; readonly stableDrawId: string }
    >();
    const selectionDraws: TemplateConditionGroupSelection['selectionDraws'] = [];
    for (let ordinal = 0; ordinal < countChoice.selectionCount; ordinal += 1) {
      const draw = drawContext({
        templateRef,
        profileRef,
        profileFingerprint,
        seed: request.seed,
        groupId: group.id,
        lane: 'candidate',
        ordinal,
      });
      const selected = weightedChoice(remaining, seededUnit(request.seed, draw.key));
      selectedById.set(selected.templateConditionId, {
        ordinal,
        stableDrawId: draw.stableDrawId,
      });
      selectionDraws.push({
        selectionOrdinal: ordinal,
        selectedTemplateConditionId: selected.templateConditionId,
        stableDrawId: draw.stableDrawId,
      });
      remaining.splice(
        remaining.findIndex(
          (candidate) => candidate.templateConditionId === selected.templateConditionId,
        ),
        1,
      );
    }
    const candidateEvaluations: TemplateConditionCandidateEvaluation[] =
      groupProfile.candidateWeights.map((candidate) => {
        const selection = selectedById.get(candidate.templateConditionId);
        return {
          templateConditionId: candidate.templateConditionId,
          gameSelectionWeight: candidate.gameSelectionWeight,
          selected: selection !== undefined,
          selectionOrdinal: selection?.ordinal ?? null,
          stableDrawId: selection?.stableDrawId ?? null,
        };
      });
    groupSelections.push({
      groupId: group.id,
      selectedCount: countChoice.selectionCount,
      selectedCountGameWeight: countChoice.gameSelectionWeight,
      countStableDrawId: countDraw.stableDrawId,
      selectionDraws,
      candidateEvaluations,
    });

    const constraintsById = new Map(
      group.candidates.map((constraint) => [constraint.id, constraint]),
    );
    for (const selection of selectionDraws) {
      const constraint = constraintsById.get(selection.selectedTemplateConditionId)!;
      const state = materializeCondition(template, profile, constraint, selection.stableDrawId);
      conditionStates.push(state);
      conditionBindings.push(bindingFor(constraint, state, group.id));
      stateByTemplateConditionId.set(constraint.id, state);
    }
  }

  const conflicts = profile.incompatibilities.flatMap((incompatibility) => {
    const left = stateByTemplateConditionId.get(incompatibility.leftTemplateConditionId);
    const right = stateByTemplateConditionId.get(incompatibility.rightTemplateConditionId);
    return left && right
      ? [
          {
            incompatibilityId: incompatibility.id,
            leftTemplateConditionId: incompatibility.leftTemplateConditionId,
            rightTemplateConditionId: incompatibility.rightTemplateConditionId,
            leftConditionStateId: left.id,
            rightConditionStateId: right.id,
            reason: incompatibility.reason,
            review: incompatibility.review,
          },
        ]
      : [];
  });
  const inputFingerprint = fingerprint('input', {
    requestId: request.id,
    template,
    profile,
    seed: request.seed,
  });
  const withoutIdentity = {
    schemaVersion: 1 as const,
    resolverVersion: TEMPLATE_CONDITION_SELECTOR_VERSION,
    requestId: request.id,
    status:
      conflicts.length === 0
        ? ('selected' as const)
        : ('literal_condition_incompatibility' as const),
    templateRef,
    templateFingerprint,
    profileRef,
    profileFingerprint,
    seed: request.seed,
    requiredTemplateConditionIds: template.requiredConditions.map((condition) => condition.id),
    groupSelections,
    conditionStates: [...conditionStates].sort((left, right) => compareStrings(left.id, right.id)),
    conditionBindings: [...conditionBindings].sort((left, right) =>
      compareStrings(left.id, right.id),
    ),
    conflicts,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('output', artifactPayload(withoutIdentity));
  return TemplateConditionSelectionArtifactSchema.parse({
    ...withoutIdentity,
    id: `template-condition-selection.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
};

export const selectTemplateConditions = (input: unknown): TemplateConditionSelectionResult => {
  const parsed = TemplateConditionSelectionRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  const request = normalizeTemplateConditionSelectionRequest(parsed.data);
  const expectedTemplateFingerprint = fingerprintTemplateConditionSelectionTemplate(
    request.template,
  );
  if (request.profile.templateFingerprint !== expectedTemplateFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: `${request.profile.id} does not pin the exact payload of ${request.template.id}.`,
      },
    };
  }
  try {
    const artifact = buildArtifact(request);
    return artifact.status === 'selected'
      ? {
          ok: true,
          value: artifact as TemplateConditionSelectionArtifact & {
            readonly status: 'selected';
          },
        }
      : {
          ok: false,
          conflict: {
            code: 'LITERAL_CONDITION_INCOMPATIBILITY',
            disposition: 'retry_or_quarantine',
            artifact: artifact as TemplateConditionSelectionArtifact & {
              readonly status: 'literal_condition_incompatibility';
            },
          },
        };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
};

export const verifyTemplateConditionSelectionIntegrity = (
  value: unknown,
): TemplateConditionSelectionIntegrityResult => {
  const parsed = TemplateConditionSelectionArtifactSchema.safeParse(value);
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
  if (artifact.resolverVersion !== TEMPLATE_CONDITION_SELECTOR_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_RESOLVER_VERSION',
        message: `${artifact.id} uses unsupported condition selector ${artifact.resolverVersion}.`,
      },
    };
  }
  for (const group of artifact.groupSelections) {
    const countDraw = drawContext({
      templateRef: artifact.templateRef,
      profileRef: artifact.profileRef,
      profileFingerprint: artifact.profileFingerprint,
      seed: artifact.seed,
      groupId: group.groupId,
      lane: 'count',
      ordinal: null,
    });
    if (group.countStableDrawId !== countDraw.stableDrawId) {
      return {
        ok: false,
        error: {
          code: 'DRAW_CONTEXT_MISMATCH',
          message: `${group.groupId} count draw does not match the saved seed and template/profile context.`,
        },
      };
    }
    for (const draw of group.selectionDraws) {
      const expected = drawContext({
        templateRef: artifact.templateRef,
        profileRef: artifact.profileRef,
        profileFingerprint: artifact.profileFingerprint,
        seed: artifact.seed,
        groupId: group.groupId,
        lane: 'candidate',
        ordinal: draw.selectionOrdinal,
      });
      if (draw.stableDrawId !== expected.stableDrawId) {
        return {
          ok: false,
          error: {
            code: 'DRAW_CONTEXT_MISMATCH',
            message: `${group.groupId} candidate draw ${draw.selectionOrdinal} does not match the saved seed and template/profile context.`,
          },
        };
      }
    }
  }

  const selectionDrawByConditionId = new Map(
    artifact.groupSelections.flatMap((group) =>
      group.selectionDraws.map(
        (draw) => [draw.selectedTemplateConditionId, draw.stableDrawId] as const,
      ),
    ),
  );
  const statesById = new Map(
    artifact.conditionStates.map((condition) => [condition.id, condition]),
  );
  for (const binding of artifact.conditionBindings) {
    const condition = statesById.get(binding.conditionStateId);
    const provenanceMatches =
      binding.kind === 'required'
        ? condition?.origin === 'authored' &&
          condition.resolution.origin === 'authored' &&
          condition.resolution.ownerId === artifact.templateRef.id &&
          condition.resolution.ownerContentVersion === artifact.templateRef.contentVersion
        : condition?.origin === 'generated_optional' &&
          condition.resolution.origin === 'deterministic_generation' &&
          condition.resolution.generationProfileId === artifact.profileRef.id &&
          condition.resolution.generationProfileContentVersion ===
            artifact.profileRef.contentVersion &&
          condition.resolution.resolverVersion === artifact.resolverVersion &&
          condition.resolution.stableDrawId ===
            selectionDrawByConditionId.get(binding.templateConditionId);
    if (!provenanceMatches) {
      return {
        ok: false,
        error: {
          code: 'PROVENANCE_MISMATCH',
          message: `${binding.id} does not preserve required-versus-generated condition provenance.`,
        },
      };
    }
  }

  const expectedPayloadFingerprint = fingerprint('output', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `template-condition-selection.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen condition-selection payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyTemplateConditionSelectionContext = (input: {
  readonly artifact: unknown;
  readonly request: unknown;
}): TemplateConditionSelectionContextResult => {
  const integrity = verifyTemplateConditionSelectionIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = selectTemplateConditions(input.request);
  if ('error' in expected) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: `${expected.error.code}: ${expected.error.message}`,
      },
    };
  }
  const expectedArtifact = expected.ok ? expected.value : expected.conflict.artifact;
  if (
    JSON.stringify(canonicalizeObjectKeys(integrity.value)) !==
    JSON.stringify(canonicalizeObjectKeys(expectedArtifact))
  ) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: `${integrity.value.id} does not match deterministic selection from its exact template, profile, and seed.`,
      },
    };
  }
  return { ok: true, value: integrity.value };
};
