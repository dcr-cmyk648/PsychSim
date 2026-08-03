import {
  DiagnosisSelectionHorizonSchema,
  GeneratedDiagnosisSelectionDefinitionOwnersInputSchema,
  GeneratedDiagnosisSelectionOwnerSetSnapshotSchema,
  GeneratedDiagnosisSelectionQualifierOwnerSnapshotSchema,
  PlayerDiagnosisSelectionsSchema,
  type CatalogInstanceFingerprint,
  type DiagnosisDefinition,
  type DiagnosisSelectionHorizon,
  type GeneratedDiagnosisSelectionOwnerSetSnapshot,
  type GeneratedDiagnosisSelectionQualifierOwnerSnapshot,
  type GeneratedEncounterAttemptFingerprint,
  type PlayerDiagnosisSelections,
} from '@psychsim/schemas';

export const GENERATED_DIAGNOSIS_SELECTION_OWNER_COMPILER_VERSION = '1.0.0';

export type GeneratedDiagnosisSelectionOwnerCompileResult =
  | { readonly ok: true; readonly value: GeneratedDiagnosisSelectionOwnerSetSnapshot }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_INPUT'
          | 'OWNER_HORIZON_MISMATCH'
          | 'UNAVAILABLE_DIAGNOSIS'
          | 'UNAVAILABLE_SEVERITY_OWNER'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type GeneratedDiagnosisSelectionOwnerIntegrityResult =
  | { readonly ok: true; readonly value: GeneratedDiagnosisSelectionOwnerSetSnapshot }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_SCHEMA' | 'UNSUPPORTED_COMPILER_VERSION' | 'REPLAY_MISMATCH';
        readonly message: string;
      };
    };

export type GeneratedDiagnosisSelectionValidationResult =
  | { readonly ok: true; readonly value: PlayerDiagnosisSelections }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SELECTION'
          | 'INVALID_OWNER_SNAPSHOT'
          | 'DIAGNOSIS_OUTSIDE_HORIZON'
          | 'DIAGNOSIS_QUALIFIER_OUTSIDE_HORIZON';
        readonly message: string;
        readonly contentIds: readonly string[];
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

const fingerprint = (scope: string, value: unknown): GeneratedEncounterAttemptFingerprint =>
  `fingerprint.generated-encounter-attempt.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const compileFail = (
  code: Extract<GeneratedDiagnosisSelectionOwnerCompileResult, { ok: false }>['error']['code'],
  message: string,
  contentIds: readonly string[],
): GeneratedDiagnosisSelectionOwnerCompileResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

const ownerPayload = (
  owner: Omit<GeneratedDiagnosisSelectionQualifierOwnerSnapshot, 'id' | 'payloadFingerprint'>,
): unknown => owner;

const ownerSetPayload = (
  snapshot: Omit<GeneratedDiagnosisSelectionOwnerSetSnapshot, 'id' | 'payloadFingerprint'>,
): unknown => snapshot;

const allowedSeverityIds = (definition: DiagnosisDefinition): string[] => {
  const severityAxis = definition.severityAxis;
  if (severityAxis === null || severityAxis.playerSelectionMode === 'family_only') return [];
  return severityAxis.levels
    .filter(
      (level) =>
        level.generationStatus === 'enabled' &&
        level.review.status === 'approved' &&
        level.review.sourceUseNoteIds.length > 0,
    )
    .map((level) => level.id)
    .sort(compareStrings);
};

const allowedSpecifiers = (definition: DiagnosisDefinition) =>
  definition.specifiers
    .filter(
      (specifier) =>
        specifier.playerSelectable &&
        specifier.review.status === 'approved' &&
        specifier.review.sourceUseNoteIds.length > 0,
    )
    .map((specifier) => ({
      specifierId: specifier.id,
      exclusiveGroupId: specifier.exclusiveGroupId,
    }))
    .sort((left, right) => compareStrings(left.specifierId, right.specifierId));

const compileOwner = (
  option: DiagnosisSelectionHorizon['options'][number],
  definition: DiagnosisDefinition,
): GeneratedDiagnosisSelectionQualifierOwnerSnapshot => {
  const playerSeverityMode = definition.severityAxis?.playerSelectionMode ?? 'family_only';
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: GENERATED_DIAGNOSIS_SELECTION_OWNER_COMPILER_VERSION,
    diagnosisOptionId: option.id,
    diagnosisRef: {
      id: definition.id,
      contentVersion: definition.contentVersion,
    },
    sourceDefinitionFingerprint: fingerprint('diagnosis-definition-owner', definition),
    playerSeverityMode,
    allowedSeverityIds: allowedSeverityIds(definition),
    allowedSpecifiers: allowedSpecifiers(definition),
  };
  const payloadFingerprint = fingerprint(
    'diagnosis-selection-owner',
    ownerPayload(withoutIdentity),
  );
  return GeneratedDiagnosisSelectionQualifierOwnerSnapshotSchema.parse({
    ...withoutIdentity,
    id: `generated-diagnosis-selection-owner.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
};

export const compileGeneratedDiagnosisSelectionOwners = (input: {
  readonly diagnosisSelectionHorizon: unknown;
  readonly diagnosisSelectionHorizonFingerprint: CatalogInstanceFingerprint;
  readonly definitionOwners: unknown;
}): GeneratedDiagnosisSelectionOwnerCompileResult => {
  const horizon = DiagnosisSelectionHorizonSchema.safeParse(input.diagnosisSelectionHorizon);
  const ownerInput = GeneratedDiagnosisSelectionDefinitionOwnersInputSchema.safeParse(
    input.definitionOwners,
  );
  if (!horizon.success || !ownerInput.success) {
    return compileFail(
      'INVALID_INPUT',
      [
        ...(!horizon.success
          ? horizon.error.issues.map(
              (issue) =>
                `diagnosisSelectionHorizon.${issue.path.join('.') || '<root>'}: ${issue.message}`,
            )
          : []),
        ...(!ownerInput.success
          ? ownerInput.error.issues.map(
              (issue) => `definitionOwners.${issue.path.join('.') || '<root>'}: ${issue.message}`,
            )
          : []),
      ].join('; '),
      [],
    );
  }
  const definitionsById = new Map(
    ownerInput.data.definitions.map((definition) => [definition.id, definition]),
  );
  const horizonDiagnosisIds = horizon.data.options.map((option) => option.diagnosisDefinitionId);
  if (
    ownerInput.data.definitions.length !== horizon.data.options.length ||
    ownerInput.data.definitions.some((definition) => !horizonDiagnosisIds.includes(definition.id))
  ) {
    return compileFail(
      'OWNER_HORIZON_MISMATCH',
      'Generated diagnosis-selection owners must cover every and only the exact diagnosis horizon.',
      [...horizonDiagnosisIds, ...ownerInput.data.definitions.map((definition) => definition.id)],
    );
  }

  const owners: GeneratedDiagnosisSelectionQualifierOwnerSnapshot[] = [];
  for (const option of horizon.data.options) {
    const definition = definitionsById.get(option.diagnosisDefinitionId);
    if (
      definition === undefined ||
      definition.contentVersion !== option.diagnosisDefinitionContentVersion
    ) {
      return compileFail(
        'OWNER_HORIZON_MISMATCH',
        `${option.id} does not have its exact diagnosis definition owner.`,
        [option.id, option.diagnosisDefinitionId],
      );
    }
    if (!definition.selectableInGameplay) {
      return compileFail(
        'UNAVAILABLE_DIAGNOSIS',
        `${definition.id} is not selectable in gameplay.`,
        [definition.id, option.id],
      );
    }
    const playerSeverityMode = definition.severityAxis?.playerSelectionMode ?? 'family_only';
    if (
      playerSeverityMode === 'severity_selectable' &&
      allowedSeverityIds(definition).length === 0
    ) {
      return compileFail(
        'UNAVAILABLE_SEVERITY_OWNER',
        `${definition.id} declares player-selectable severity but has no enabled, reviewed severity owner.`,
        [definition.id, definition.severityAxis?.id ?? definition.id],
      );
    }
    owners.push(compileOwner(option, definition));
  }
  owners.sort((left, right) => compareStrings(left.diagnosisRef.id, right.diagnosisRef.id));

  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: GENERATED_DIAGNOSIS_SELECTION_OWNER_COMPILER_VERSION,
    modelVersion: 'generated-diagnosis-selection-owner-set.v1' as const,
    diagnosisSelectionHorizonRef: {
      id: horizon.data.id,
      payloadFingerprint: input.diagnosisSelectionHorizonFingerprint,
    },
    owners,
  };
  const payloadFingerprint = fingerprint(
    'diagnosis-selection-owner-set',
    ownerSetPayload(withoutIdentity),
  );
  const parsed = GeneratedDiagnosisSelectionOwnerSetSnapshotSchema.safeParse({
    ...withoutIdentity,
    id: `generated-diagnosis-selection-owner-set.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  return parsed.success
    ? { ok: true, value: parsed.data }
    : compileFail('INVALID_OUTPUT', issuesText(parsed.error.issues), horizonDiagnosisIds);
};

export const verifyGeneratedDiagnosisSelectionOwnerSetIntegrity = (
  value: unknown,
): GeneratedDiagnosisSelectionOwnerIntegrityResult => {
  const parsed = GeneratedDiagnosisSelectionOwnerSetSnapshotSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const snapshot = parsed.data;
  if (snapshot.compilerVersion !== GENERATED_DIAGNOSIS_SELECTION_OWNER_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported generated diagnosis-selection owner compiler ${snapshot.compilerVersion}.`,
      },
    };
  }
  const validOwners = snapshot.owners.every((owner) => {
    if (owner.compilerVersion !== GENERATED_DIAGNOSIS_SELECTION_OWNER_COMPILER_VERSION)
      return false;
    const withoutIdentity = {
      schemaVersion: owner.schemaVersion,
      compilerVersion: owner.compilerVersion,
      diagnosisOptionId: owner.diagnosisOptionId,
      diagnosisRef: owner.diagnosisRef,
      sourceDefinitionFingerprint: owner.sourceDefinitionFingerprint,
      playerSeverityMode: owner.playerSeverityMode,
      allowedSeverityIds: owner.allowedSeverityIds,
      allowedSpecifiers: owner.allowedSpecifiers,
    };
    const payloadFingerprint = fingerprint(
      'diagnosis-selection-owner',
      ownerPayload(withoutIdentity),
    );
    return (
      owner.payloadFingerprint === payloadFingerprint &&
      owner.id === `generated-diagnosis-selection-owner.${payloadFingerprint.slice(-16)}`
    );
  });
  const withoutIdentity = {
    schemaVersion: snapshot.schemaVersion,
    compilerVersion: snapshot.compilerVersion,
    modelVersion: snapshot.modelVersion,
    diagnosisSelectionHorizonRef: snapshot.diagnosisSelectionHorizonRef,
    owners: snapshot.owners,
  };
  const payloadFingerprint = fingerprint(
    'diagnosis-selection-owner-set',
    ownerSetPayload(withoutIdentity),
  );
  if (
    !validOwners ||
    snapshot.payloadFingerprint !== payloadFingerprint ||
    snapshot.id !== `generated-diagnosis-selection-owner-set.${payloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The generated diagnosis-selection owner set does not match its minimized exact owner payload.',
      },
    };
  }
  return { ok: true, value: snapshot };
};

export const validateGeneratedDiagnosisSelections = (input: {
  readonly selections: unknown;
  readonly ownerSnapshot: unknown;
}): GeneratedDiagnosisSelectionValidationResult => {
  const selections = PlayerDiagnosisSelectionsSchema.safeParse(input.selections);
  if (!selections.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SELECTION',
        message: issuesText(selections.error.issues),
        contentIds: [],
      },
    };
  }
  const ownerIntegrity = verifyGeneratedDiagnosisSelectionOwnerSetIntegrity(input.ownerSnapshot);
  if (!ownerIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OWNER_SNAPSHOT',
        message: ownerIntegrity.error.message,
        contentIds: [],
      },
    };
  }
  const ownersByDiagnosisId = new Map(
    ownerIntegrity.value.owners.map((owner) => [owner.diagnosisRef.id, owner]),
  );
  for (const selection of selections.data) {
    const owner = ownersByDiagnosisId.get(selection.diagnosisId);
    if (owner === undefined) {
      return {
        ok: false,
        error: {
          code: 'DIAGNOSIS_OUTSIDE_HORIZON',
          message: `Diagnosis ${selection.diagnosisId} is outside the frozen diagnosis-selection horizon.`,
          contentIds: [selection.diagnosisId],
        },
      };
    }
    if (
      selection.severityId !== null &&
      (owner.playerSeverityMode === 'family_only' ||
        !owner.allowedSeverityIds.includes(selection.severityId))
    ) {
      return {
        ok: false,
        error: {
          code: 'DIAGNOSIS_QUALIFIER_OUTSIDE_HORIZON',
          message: `Severity ${selection.severityId} is internal or unavailable for ${selection.diagnosisId}.`,
          contentIds: [selection.diagnosisId, selection.severityId],
        },
      };
    }
    const specifiersById = new Map(
      owner.allowedSpecifiers.map((specifier) => [specifier.specifierId, specifier]),
    );
    const unavailableSpecifier = selection.specifierIds.find(
      (specifierId) => !specifiersById.has(specifierId),
    );
    if (unavailableSpecifier !== undefined) {
      return {
        ok: false,
        error: {
          code: 'DIAGNOSIS_QUALIFIER_OUTSIDE_HORIZON',
          message: `Specifier ${unavailableSpecifier} is internal or unavailable for ${selection.diagnosisId}.`,
          contentIds: [selection.diagnosisId, unavailableSpecifier],
        },
      };
    }
    const exclusiveGroups = selection.specifierIds
      .map((specifierId) => specifiersById.get(specifierId)?.exclusiveGroupId ?? null)
      .filter((groupId): groupId is string => groupId !== null);
    if (new Set(exclusiveGroups).size !== exclusiveGroups.length) {
      return {
        ok: false,
        error: {
          code: 'DIAGNOSIS_QUALIFIER_OUTSIDE_HORIZON',
          message: `${selection.diagnosisId} has mutually exclusive selected specifiers.`,
          contentIds: [selection.diagnosisId, ...selection.specifierIds],
        },
      };
    }
  }
  return { ok: true, value: selections.data };
};
