import {
  ModePatientTemplateHorizonArtifactSchema,
  ModePatientTemplateHorizonRequestSchema,
  type ModePatientTemplateHorizonArtifact,
  type ModePatientTemplateHorizonFingerprint,
  type ModePatientTemplateHorizonMember,
  type ModePatientTemplateHorizonRequest,
  type PatientTemplate,
} from '@psychsim/schemas';

export const MODE_PATIENT_TEMPLATE_HORIZON_COMPILER_VERSION = '1.0.0';

export type ModePatientTemplateHorizonCompileResult =
  | { readonly ok: true; readonly value: ModePatientTemplateHorizonArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_REQUEST' | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type ModePatientTemplateHorizonIntegrityResult =
  | { readonly ok: true; readonly value: ModePatientTemplateHorizonArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'REPLAY_FAILED'
          | 'REPLAY_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

export type ModePatientTemplateHorizonContextResult =
  | { readonly ok: true; readonly value: ModePatientTemplateHorizonArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_ARTIFACT' | 'CONTEXT_MISMATCH';
        readonly message: string;
      };
    };

const compareStrings = (left: string, right: string): number =>
  left === right ? 0 : left < right ? -1 : 1;

const sortById = <Entry extends { readonly id: string }>(entries: readonly Entry[]): Entry[] =>
  [...entries].sort((left, right) => compareStrings(left.id, right.id));

const uniqueSorted = <Value extends string>(values: readonly Value[]): Value[] =>
  [...new Set(values)].sort(compareStrings);

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

const sameCanonicalValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const hashToHex64 = (value: string): string => {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, '0');
};

const fingerprint = (scope: string, value: unknown): ModePatientTemplateHorizonFingerprint =>
  `fingerprint.mode-patient-template-horizon.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const normalizeTemplate = (template: PatientTemplate): PatientTemplate => ({
  ...template,
  review: {
    ...template.review,
    sourceUseNoteIds: uniqueSorted(template.review.sourceUseNoteIds),
  },
  compatibleLocationRefs: sortById(template.compatibleLocationRefs),
  requiredConditions: sortById(
    template.requiredConditions.map((condition) => ({
      ...condition,
      specifierIds: uniqueSorted(condition.specifierIds),
    })),
  ),
  optionalConditionSelectionGroups: sortById(
    template.optionalConditionSelectionGroups.map((group) => ({
      ...group,
      candidates: sortById(
        group.candidates.map((condition) => ({
          ...condition,
          specifierIds: uniqueSorted(condition.specifierIds),
        })),
      ),
    })),
  ),
  presentationRichnessEnvelope: {
    ...template.presentationRichnessEnvelope,
    decisionDriverCategories: uniqueSorted(
      template.presentationRichnessEnvelope.decisionDriverCategories,
    ),
  },
});

const normalizeRequest = (
  request: ModePatientTemplateHorizonRequest,
): ModePatientTemplateHorizonRequest => ({
  ...request,
  approvedTemplates: sortById(request.approvedTemplates.map(normalizeTemplate)),
  explicitReviewTemplates: sortById(request.explicitReviewTemplates.map(normalizeTemplate)),
});

export const fingerprintModePatientTemplateHorizonTemplate = (
  template: PatientTemplate,
): ModePatientTemplateHorizonFingerprint => fingerprint('template', normalizeTemplate(template));

const memberFor = (
  template: PatientTemplate,
  inclusionBasis: ModePatientTemplateHorizonMember['inclusionBasis'],
): ModePatientTemplateHorizonMember => {
  const templateFingerprint = fingerprintModePatientTemplateHorizonTemplate(template);
  return {
    schemaVersion: 1,
    id: `mode-patient-template-horizon-member.${hashToHex64(
      `${template.id}\u0000${template.contentVersion}\u0000${templateFingerprint}\u0000${inclusionBasis}`,
    )}`,
    templateRef: {
      id: template.id,
      contentVersion: template.contentVersion,
    },
    templateFingerprint,
    lifecycle: template.lifecycle as 'approved' | 'review',
    medicalReviewStatus: template.medicalReviewStatus,
    careSetting: template.careSetting,
    patientPool: template.patientPool,
    inclusionBasis,
  };
};

const artifactPayload = (
  artifact: Omit<ModePatientTemplateHorizonArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  mode: artifact.mode,
  sourceBoundary: artifact.sourceBoundary,
  members: artifact.members,
  templates: artifact.templates,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

/**
 * Materializes the exact template-lifecycle horizon for one progression mode.
 *
 * Standard and Endgame accept only the approved lane. Local Developer mode
 * additionally accepts the explicitly supplied review lane. The compiler does
 * not inspect care setting, location, pool, medical review, queue history,
 * weights, resources, complexity, points, or any debug-unlock flag.
 */
export const compileModePatientTemplateHorizon = (
  input: unknown,
): ModePatientTemplateHorizonCompileResult => {
  const parsed = ModePatientTemplateHorizonRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: issuesText(parsed.error.issues),
        contentIds: [],
      },
    };
  }
  const request = normalizeRequest(parsed.data);
  const approvedMembers = request.approvedTemplates.map((template) =>
    memberFor(template, 'approved_runtime'),
  );
  const reviewMembers =
    request.mode === 'developer'
      ? request.explicitReviewTemplates.map((template) => memberFor(template, 'developer_review'))
      : [];
  const members = [...approvedMembers, ...reviewMembers].sort((left, right) =>
    compareStrings(
      `${left.templateRef.id}@${left.templateRef.contentVersion}`,
      `${right.templateRef.id}@${right.templateRef.contentVersion}`,
    ),
  );
  const templates = [
    ...request.approvedTemplates,
    ...(request.mode === 'developer' ? request.explicitReviewTemplates : []),
  ].sort((left, right) =>
    compareStrings(`${left.id}@${left.contentVersion}`, `${right.id}@${right.contentVersion}`),
  );
  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: MODE_PATIENT_TEMPLATE_HORIZON_COMPILER_VERSION,
    requestId: request.id,
    mode: request.mode,
    sourceBoundary:
      request.mode === 'developer' ? ('local_developer' as const) : ('approved_runtime' as const),
    members,
    templates,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = ModePatientTemplateHorizonArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `mode-patient-template-horizon.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(output.error.issues),
        contentIds: [request.id, ...templates.map((template) => template.id)],
      },
    };
  }
  return { ok: true, value: output.data };
};

export const verifyModePatientTemplateHorizonIntegrity = (
  value: unknown,
): ModePatientTemplateHorizonIntegrityResult => {
  const parsed = ModePatientTemplateHorizonArtifactSchema.safeParse(value);
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
  if (artifact.compilerVersion !== MODE_PATIENT_TEMPLATE_HORIZON_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported mode patient-template horizon compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const replay = compileModePatientTemplateHorizon(artifact.compileRequest);
  if (!replay.ok) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_FAILED',
        message: `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  if (!sameCanonicalValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained mode patient-template horizon does not match deterministic replay from its exact request.',
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `mode-patient-template-horizon.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen mode template-horizon payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyModePatientTemplateHorizonContext = (input: {
  readonly artifact: unknown;
  readonly request: unknown;
}): ModePatientTemplateHorizonContextResult => {
  const integrity = verifyModePatientTemplateHorizonIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = compileModePatientTemplateHorizon(input.request);
  if (!expected.ok) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: `${expected.error.code}: ${expected.error.message}`,
      },
    };
  }
  if (!sameCanonicalValue(integrity.value, expected.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message:
          'The mode patient-template horizon does not match the exact current mode and explicit lifecycle lanes.',
      },
    };
  }
  return { ok: true, value: integrity.value };
};
