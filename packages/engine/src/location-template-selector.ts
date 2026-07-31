import {
  LocationTemplateDistributionProfileSchema,
  LocationTemplateSelectionEligibilityOverlaySchema,
  LocationTemplateSelectionArtifactSchema,
  LocationTemplateSelectionCompileInputSchema,
  LocationTemplateSelectionRequestSchema,
  type LocationOwnedPatientSlotCandidate,
  type LocationTemplateDistributionFingerprint,
  type LocationTemplateDistributionProfile,
  type LocationTemplateLocalRepeatContext,
  type LocationTemplateSelectionArtifact,
  type LocationTemplateSelectionCandidateEvaluation,
  type LocationTemplateSelectionCompileInput,
  type LocationTemplateSelectionEligibilityFingerprint,
  type LocationTemplateSelectionEligibilityMember,
  type LocationTemplateSelectionEligibilityOverlay,
  type LocationTemplateSelectionRequest,
  type PatientTemplateLocationAdmissionMatrixArtifact,
} from '@psychsim/schemas';

import {
  compileLocationOwnedPatientSlotSelection,
  enumerateLocationOwnedPatientSlotCandidates,
  verifyLocationOwnedPatientSlotSelectionIntegrity,
} from './location-owned-patient-slot-selection-compiler';
import {
  fingerprintPatientTemplateLocationAdmissionLocation,
  verifyPatientTemplateLocationAdmissionMatrixContext,
  verifyPatientTemplateLocationAdmissionMatrixIntegrity,
} from './patient-template-location-admission-compiler';

export const LOCATION_TEMPLATE_SELECTOR_VERSION = '3.0.0';

export type LocationTemplateSelectionCompileErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_MATRIX'
  | 'MATRIX_CONTEXT_MISMATCH'
  | 'SLOT_LOCATION_NOT_FOUND'
  | 'NO_ADMITTED_CANDIDATES'
  | 'INVALID_ELIGIBILITY_OVERLAY'
  | 'NO_ELIGIBLE_CANDIDATES'
  | 'DISTRIBUTION_PROFILE_LOCATION_MISMATCH'
  | 'DISTRIBUTION_WEIGHT_COVERAGE_MISMATCH'
  | 'LOCAL_REPEAT_CONTEXT_MISMATCH'
  | 'UNSAFE_WEIGHT_ARITHMETIC'
  | 'NESTED_SLOT_SELECTION_FAILED'
  | 'INVALID_OUTPUT';

export type LocationTemplateSelectionCompileResult =
  | { readonly ok: true; readonly value: LocationTemplateSelectionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: LocationTemplateSelectionCompileErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type LocationTemplateSelectionIntegrityResult =
  | { readonly ok: true; readonly value: LocationTemplateSelectionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_SELECTOR_VERSION'
          | 'NESTED_SLOT_SELECTION_INVALID'
          | 'CONTEXT_MISMATCH'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'DRAW_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

export type LocationTemplateSelectionContextResult =
  | { readonly ok: true; readonly value: LocationTemplateSelectionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_ARTIFACT' | 'MATRIX_CONTEXT_MISMATCH' | 'SELECTION_MISMATCH';
        readonly message: string;
      };
    };

const BASIS_POINTS_SCALE = 10_000;
const TWO_TO_64 = 1n << 64n;

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

const sameCanonicalValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const hashToBigInt64 = (value: string): bigint => {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash;
};

const hashToHex64 = (value: string): string => hashToBigInt64(value).toString(16).padStart(16, '0');

const fingerprint = (scope: string, value: unknown): LocationTemplateDistributionFingerprint =>
  `fingerprint.location-template-distribution.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const eligibilityFingerprint = (
  scope: string,
  value: unknown,
): LocationTemplateSelectionEligibilityFingerprint =>
  `fingerprint.location-template-selection-eligibility.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: LocationTemplateSelectionCompileErrorCode,
  message: string,
  contentIds: readonly string[],
): LocationTemplateSelectionCompileResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const versionedKey = (value: { readonly id: string; readonly contentVersion: string }): string =>
  `${value.id}\u0000${value.contentVersion}`;

const eligibilityKey = (value: LocationTemplateSelectionEligibilityMember): string =>
  `${value.templateRef.id}\u0000${value.templateRef.contentVersion}\u0000${value.templateFingerprint}`;

const normalizeEligibilityOverlay = (
  overlay: LocationTemplateSelectionEligibilityOverlay,
): LocationTemplateSelectionEligibilityOverlay => ({
  ...overlay,
  eligibleTemplates: [...overlay.eligibleTemplates]
    .map((entry) => ({
      templateRef: { ...entry.templateRef },
      templateFingerprint: entry.templateFingerprint,
    }))
    .sort((left, right) => compareStrings(eligibilityKey(left), eligibilityKey(right))),
});

const eligibilityOverlayPayload = (
  overlay: Omit<LocationTemplateSelectionEligibilityOverlay, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: overlay.schemaVersion,
  modelVersion: overlay.modelVersion,
  mode: overlay.mode,
  basis: overlay.basis,
  sourceRunHistoryRef: overlay.sourceRunHistoryRef,
  eligibleTemplates: overlay.eligibleTemplates,
});

export const fingerprintLocationTemplateEligibilitySource = (
  value: unknown,
): LocationTemplateSelectionEligibilityFingerprint => eligibilityFingerprint('source', value);

export const createLocationTemplateSelectionEligibilityOverlay = (input: {
  readonly mode: LocationTemplateSelectionEligibilityOverlay['mode'];
  readonly basis: LocationTemplateSelectionEligibilityOverlay['basis'];
  readonly sourceRunHistoryRef: LocationTemplateSelectionEligibilityOverlay['sourceRunHistoryRef'];
  readonly eligibleTemplates: readonly LocationTemplateSelectionEligibilityMember[];
}): LocationTemplateSelectionEligibilityOverlay => {
  const normalized = {
    schemaVersion: 1 as const,
    modelVersion: 'location-template-selection-eligibility.v1' as const,
    mode: input.mode,
    basis: input.basis,
    sourceRunHistoryRef: input.sourceRunHistoryRef,
    eligibleTemplates: [...input.eligibleTemplates].sort((left, right) =>
      compareStrings(eligibilityKey(left), eligibilityKey(right)),
    ),
  };
  const payloadFingerprint = eligibilityFingerprint(
    'overlay',
    eligibilityOverlayPayload(normalized),
  );
  return LocationTemplateSelectionEligibilityOverlaySchema.parse({
    ...normalized,
    id: `location-template-selection-eligibility.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
};

export const verifyLocationTemplateSelectionEligibilityOverlay = (
  value: unknown,
):
  | { readonly ok: true; readonly value: LocationTemplateSelectionEligibilityOverlay }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_SCHEMA' | 'FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    } => {
  const parsed = LocationTemplateSelectionEligibilityOverlaySchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const overlay = normalizeEligibilityOverlay(parsed.data);
  const expectedFingerprint = eligibilityFingerprint('overlay', eligibilityOverlayPayload(overlay));
  if (
    overlay.payloadFingerprint !== expectedFingerprint ||
    overlay.id !== `location-template-selection-eligibility.${expectedFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'FINGERPRINT_MISMATCH',
        message: `${overlay.id} does not match its exact template-eligibility payload.`,
      },
    };
  }
  return { ok: true, value: overlay };
};

const normalizeDistributionProfile = (
  profile: LocationTemplateDistributionProfile,
): LocationTemplateDistributionProfile =>
  LocationTemplateDistributionProfileSchema.parse({
    ...profile,
    locationRef: { ...profile.locationRef },
    templateWeights: [...profile.templateWeights]
      .map((entry) => ({
        ...entry,
        templateRef: { ...entry.templateRef },
      }))
      .sort((left, right) =>
        compareStrings(versionedKey(left.templateRef), versionedKey(right.templateRef)),
      ),
  });

const normalizeRepeatContext = (
  context: LocationTemplateLocalRepeatContext,
): LocationTemplateLocalRepeatContext => ({
  ...context,
  locationRef: { ...context.locationRef },
  activeWaitingAssignments: [...context.activeWaitingAssignments].sort((left, right) =>
    compareStrings(left.slotCoordinateId, right.slotCoordinateId),
  ),
  recentCompletedTemplateIdsNewestFirst: [...context.recentCompletedTemplateIdsNewestFirst],
});

export const fingerprintLocationTemplateDistributionProfile = (
  profile: LocationTemplateDistributionProfile,
): LocationTemplateDistributionFingerprint =>
  fingerprint('profile', normalizeDistributionProfile(profile));

const matrixReference = (
  matrix: PatientTemplateLocationAdmissionMatrixArtifact,
): LocationTemplateSelectionRequest['admissionMatrixRef'] => ({
  id: matrix.id,
  inputFingerprint: matrix.inputFingerprint,
  payloadFingerprint: matrix.payloadFingerprint,
});

const normalizeInput = (
  input: LocationTemplateSelectionCompileInput,
): LocationTemplateSelectionCompileInput => ({
  ...input,
  slotCoordinate: {
    ...input.slotCoordinate,
    locationRef: { ...input.slotCoordinate.locationRef },
  },
  distributionProfile: normalizeDistributionProfile(input.distributionProfile),
  localRepeatContext: normalizeRepeatContext(input.localRepeatContext),
  eligibilityOverlay: normalizeEligibilityOverlay(input.eligibilityOverlay),
});

const compactRequest = (
  input: LocationTemplateSelectionCompileInput,
  matrix: PatientTemplateLocationAdmissionMatrixArtifact,
): LocationTemplateSelectionRequest =>
  LocationTemplateSelectionRequestSchema.parse({
    schemaVersion: 1,
    id: input.id,
    seed: input.seed,
    slotCoordinate: input.slotCoordinate,
    admissionMatrixRef: matrixReference(matrix),
    distributionProfile: input.distributionProfile,
    localRepeatContext: input.localRepeatContext,
    eligibilityOverlay: input.eligibilityOverlay,
  });

const drawContextKey = (
  slotCoordinate: LocationTemplateSelectionRequest['slotCoordinate'],
): string =>
  JSON.stringify(
    canonicalizeObjectKeys({
      selectorVersion: LOCATION_TEMPLATE_SELECTOR_VERSION,
      locationRef: slotCoordinate.locationRef,
      slotCoordinateId: slotCoordinate.id,
    }),
  );

const drawAudit = (
  seed: string,
  slotCoordinate: LocationTemplateSelectionRequest['slotCoordinate'],
): {
  readonly stableDrawId: string;
  readonly stableDrawValueHex: string;
  readonly stableDrawUnit: number;
  readonly drawValue: bigint;
} => {
  const drawValue = hashToBigInt64(`${seed}\u0000${drawContextKey(slotCoordinate)}`);
  const stableDrawValueHex = drawValue.toString(16).padStart(16, '0');
  return {
    stableDrawId: `stable-draw.location-template-selection.${stableDrawValueHex}`,
    stableDrawValueHex,
    stableDrawUnit: Number(drawValue >> 11n) / 0x20_0000_0000_0000,
    drawValue,
  };
};

const candidateSortKey = (candidate: LocationOwnedPatientSlotCandidate): string =>
  `${candidate.templateRef.id}@${candidate.templateRef.contentVersion}\u0000${candidate.admissionEvaluationId}`;

const filterCandidatesByEligibility = (input: {
  readonly candidates: readonly LocationOwnedPatientSlotCandidate[];
  readonly overlay: LocationTemplateSelectionEligibilityOverlay;
}): LocationOwnedPatientSlotCandidate[] => {
  const eligibleKeys = new Set(input.overlay.eligibleTemplates.map(eligibilityKey));
  return input.candidates.filter((candidate) =>
    eligibleKeys.has(
      eligibilityKey({
        templateRef: candidate.templateRef,
        templateFingerprint: candidate.templateFingerprint,
      }),
    ),
  );
};

const candidateEvaluations = (input: {
  readonly candidates: readonly LocationOwnedPatientSlotCandidate[];
  readonly request: LocationTemplateSelectionRequest;
}):
  | {
      readonly ok: true;
      readonly value: {
        readonly evaluations: LocationTemplateSelectionCandidateEvaluation[];
        readonly totalMass: number;
      };
    }
  | {
      readonly ok: false;
      readonly message: string;
      readonly contentIds: readonly string[];
      readonly unsafeArithmetic: boolean;
    } => {
  const weightByTemplateKey = new Map(
    input.request.distributionProfile.templateWeights.map((entry) => [
      versionedKey(entry.templateRef),
      entry,
    ]),
  );
  const missingOrStale = input.candidates.filter((candidate) => {
    const weight = weightByTemplateKey.get(versionedKey(candidate.templateRef));
    return weight === undefined || weight.templateFingerprint !== candidate.templateFingerprint;
  });
  if (missingOrStale.length > 0) {
    return {
      ok: false,
      message:
        'Every current local D-229 candidate requires one exact version- and fingerprint-pinned game-distribution weight.',
      contentIds: missingOrStale.flatMap((candidate) => [
        candidate.admissionEvaluationId,
        candidate.templateRef.id,
      ]),
      unsafeArithmetic: false,
    };
  }

  const profile = input.request.distributionProfile;
  const recentWindow = input.request.localRepeatContext.recentCompletedTemplateIdsNewestFirst.slice(
    0,
    profile.repeatSuppression.recentCompletionWindowSize,
  );
  const provisional = [...input.candidates]
    .sort((left, right) => compareStrings(candidateSortKey(left), candidateSortKey(right)))
    .map((candidate) => {
      const weight = weightByTemplateKey.get(versionedKey(candidate.templateRef))!;
      const activeMatchCount = input.request.localRepeatContext.activeWaitingAssignments.filter(
        (assignment) => assignment.templateId === candidate.templateRef.id,
      ).length;
      const recentMatchCount = recentWindow.filter(
        (templateId) => templateId === candidate.templateRef.id,
      ).length;
      const activeApplied =
        activeMatchCount > 0
          ? profile.repeatSuppression.activeWaitingMultiplierBasisPoints
          : BASIS_POINTS_SCALE;
      const recentApplied =
        recentMatchCount > 0
          ? profile.repeatSuppression.recentCompletionMultiplierBasisPoints
          : BASIS_POINTS_SCALE;
      const effectiveGameSelectionMass = weight.gameSelectionWeight * activeApplied * recentApplied;
      return {
        candidate,
        baseGameSelectionWeight: weight.gameSelectionWeight,
        suppressionFactors: [
          {
            kind: 'active_waiting',
            matched: activeMatchCount > 0,
            matchCount: activeMatchCount,
            configuredMultiplierBasisPoints:
              profile.repeatSuppression.activeWaitingMultiplierBasisPoints,
            appliedMultiplierBasisPoints: activeApplied,
          },
          {
            kind: 'recent_completion',
            matched: recentMatchCount > 0,
            matchCount: recentMatchCount,
            configuredMultiplierBasisPoints:
              profile.repeatSuppression.recentCompletionMultiplierBasisPoints,
            appliedMultiplierBasisPoints: recentApplied,
          },
        ] as LocationTemplateSelectionCandidateEvaluation['suppressionFactors'],
        effectiveGameSelectionMass,
      };
    });
  const totalMass = provisional.reduce(
    (sum, evaluation) => sum + evaluation.effectiveGameSelectionMass,
    0,
  );
  if (
    !Number.isSafeInteger(totalMass) ||
    totalMass <= 0 ||
    provisional.some(
      (evaluation) =>
        !Number.isSafeInteger(evaluation.effectiveGameSelectionMass) ||
        evaluation.effectiveGameSelectionMass <= 0,
    )
  ) {
    return {
      ok: false,
      message:
        'Positive local template selection mass must remain within safe exact-integer arithmetic.',
      contentIds: input.candidates.map((candidate) => candidate.templateRef.id),
      unsafeArithmetic: true,
    };
  }
  return {
    ok: true,
    value: {
      totalMass,
      evaluations: provisional.map((evaluation) => ({
        ...evaluation,
        normalizedDrawProbability: {
          numerator: evaluation.effectiveGameSelectionMass,
          denominator: totalMass,
          decimal: evaluation.effectiveGameSelectionMass / totalMass,
        },
        selected: false,
      })),
    },
  };
};

const selectMassIndex = (drawValue: bigint, totalMass: number): number =>
  Number((drawValue * BigInt(totalMass)) / TWO_TO_64);

const selectEvaluation = (
  evaluations: readonly LocationTemplateSelectionCandidateEvaluation[],
  drawValue: bigint,
  totalMass: number,
): LocationTemplateSelectionCandidateEvaluation => {
  let cursor = selectMassIndex(drawValue, totalMass);
  for (const evaluation of evaluations) {
    if (cursor < evaluation.effectiveGameSelectionMass) return evaluation;
    cursor -= evaluation.effectiveGameSelectionMass;
  }
  return evaluations.at(-1)!;
};

const artifactPayload = (
  artifact: Omit<LocationTemplateSelectionArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  slotCoordinate: artifact.slotCoordinate,
  admissionMatrixRef: artifact.admissionMatrixRef,
  distributionProfileRef: artifact.distributionProfileRef,
  distributionProfileFingerprint: artifact.distributionProfileFingerprint,
  stableDrawId: artifact.stableDrawId,
  stableDrawValueHex: artifact.stableDrawValueHex,
  stableDrawUnit: artifact.stableDrawUnit,
  candidateEvaluations: artifact.candidateEvaluations,
  selectedAdmissionEvaluationId: artifact.selectedAdmissionEvaluationId,
  locationOwnedPatientSlotSelectionArtifact: artifact.locationOwnedPatientSlotSelectionArtifact,
  selectionRequest: artifact.selectionRequest,
  inputFingerprint: artifact.inputFingerprint,
});

/**
 * Chooses exactly one current D-229 candidate for one physical-location-owned
 * slot. It applies positive game-distribution mass and two bounded, local,
 * stable-template-ID repeat suppressors, then creates the selected D-229 proof.
 * It receives one exact upstream lifecycle-eligibility overlay but does not
 * derive mode, run history, lifecycle, progression, capacity, refill,
 * persistence, patient-instance seed, complexity, clinical probability,
 * points, or economy.
 */
export const compileLocationTemplateSelection = (
  input: unknown,
): LocationTemplateSelectionCompileResult => {
  const parsed = LocationTemplateSelectionCompileInputSchema.safeParse(input);
  if (!parsed.success) return fail('INVALID_INPUT', issuesText(parsed.error.issues), []);
  const request = normalizeInput(parsed.data);
  const matrixIntegrity = verifyPatientTemplateLocationAdmissionMatrixIntegrity(
    request.admissionMatrixArtifact,
  );
  if (!matrixIntegrity.ok) {
    return fail(
      'INVALID_MATRIX',
      `${matrixIntegrity.error.code}: ${matrixIntegrity.error.message}`,
      [request.admissionMatrixArtifact.id],
    );
  }
  const matrixContext = verifyPatientTemplateLocationAdmissionMatrixContext({
    artifact: matrixIntegrity.value,
    request: request.currentAdmissionMatrixRequest,
  });
  if (!matrixContext.ok) {
    return fail(
      'MATRIX_CONTEXT_MISMATCH',
      `${matrixContext.error.code}: ${matrixContext.error.message}`,
      [matrixIntegrity.value.id],
    );
  }
  const matrix = matrixContext.value;
  const location = matrix.compileRequest.locations.find(
    (entry) =>
      entry.id === request.slotCoordinate.locationRef.id &&
      entry.contentVersion === request.slotCoordinate.locationRef.contentVersion,
  );
  if (location === undefined) {
    return fail(
      'SLOT_LOCATION_NOT_FOUND',
      'The slot must reference one exact currently built location in the current D-226 matrix.',
      [matrix.id, request.slotCoordinate.id, request.slotCoordinate.locationRef.id],
    );
  }
  const locationFingerprint = fingerprintPatientTemplateLocationAdmissionLocation(location);
  if (
    request.distributionProfile.locationRef.id !== location.id ||
    request.distributionProfile.locationRef.contentVersion !== location.contentVersion ||
    request.distributionProfile.locationFingerprint !== locationFingerprint
  ) {
    return fail(
      'DISTRIBUTION_PROFILE_LOCATION_MISMATCH',
      'The game-distribution profile must pin the exact selected physical location payload.',
      [request.distributionProfile.id, location.id],
    );
  }
  if (
    request.localRepeatContext.locationRef.id !== location.id ||
    request.localRepeatContext.locationRef.contentVersion !== location.contentVersion ||
    request.localRepeatContext.activeWaitingAssignments.some(
      (assignment) => assignment.slotCoordinateId === request.slotCoordinate.id,
    )
  ) {
    return fail(
      'LOCAL_REPEAT_CONTEXT_MISMATCH',
      'Repeat context must be local to this exact location and cannot list the empty slot currently being filled.',
      [request.localRepeatContext.id, request.slotCoordinate.id, location.id],
    );
  }
  const candidates = enumerateLocationOwnedPatientSlotCandidates(
    matrix,
    request.slotCoordinate.locationRef,
  );
  if (candidates.length === 0) {
    return fail(
      'NO_ADMITTED_CANDIDATES',
      'The exact physical location has no current D-229 candidate; this selector never falls back globally.',
      [matrix.id, request.slotCoordinate.id, location.id],
    );
  }
  const eligibility = verifyLocationTemplateSelectionEligibilityOverlay(request.eligibilityOverlay);
  if (!eligibility.ok) {
    return fail(
      'INVALID_ELIGIBILITY_OVERLAY',
      `${eligibility.error.code}: ${eligibility.error.message}`,
      [request.eligibilityOverlay.id],
    );
  }
  const candidateByEligibilityKey = new Map(
    candidates.map((candidate) => [
      eligibilityKey({
        templateRef: candidate.templateRef,
        templateFingerprint: candidate.templateFingerprint,
      }),
      candidate,
    ]),
  );
  const eligibleKeys = eligibility.value.eligibleTemplates.map(eligibilityKey);
  const unknownEligibleKeys = eligibleKeys.filter((key) => !candidateByEligibilityKey.has(key));
  const allCandidateKeys = [...candidateByEligibilityKey.keys()].sort(compareStrings);
  if (
    unknownEligibleKeys.length > 0 ||
    (eligibility.value.basis === 'all_admitted' &&
      JSON.stringify(eligibleKeys) !== JSON.stringify(allCandidateKeys))
  ) {
    return fail(
      'INVALID_ELIGIBILITY_OVERLAY',
      'The eligibility overlay must name exact currently admitted template versions and fingerprints; all-admitted mode must preserve the complete local horizon.',
      [
        eligibility.value.id,
        ...eligibility.value.eligibleTemplates.map((entry) => entry.templateRef.id),
      ],
    );
  }
  const eligibleCandidates = eligibleKeys.flatMap((key) => {
    const candidate = candidateByEligibilityKey.get(key);
    return candidate === undefined ? [] : [candidate];
  });
  if (eligibleCandidates.length === 0) {
    return fail(
      'NO_ELIGIBLE_CANDIDATES',
      'The exact location has no template permitted by the current lifecycle eligibility overlay.',
      [matrix.id, location.id, eligibility.value.id],
    );
  }
  const selectionRequest = compactRequest(request, matrix);
  const evaluated = candidateEvaluations({
    candidates: eligibleCandidates,
    request: selectionRequest,
  });
  if (!evaluated.ok) {
    return fail(
      evaluated.unsafeArithmetic
        ? 'UNSAFE_WEIGHT_ARITHMETIC'
        : 'DISTRIBUTION_WEIGHT_COVERAGE_MISMATCH',
      evaluated.message,
      evaluated.contentIds,
    );
  }
  const draw = drawAudit(selectionRequest.seed, selectionRequest.slotCoordinate);
  const selected = selectEvaluation(
    evaluated.value.evaluations,
    draw.drawValue,
    evaluated.value.totalMass,
  );
  const evaluations = evaluated.value.evaluations.map((evaluation) => ({
    ...evaluation,
    selected:
      evaluation.candidate.admissionEvaluationId === selected.candidate.admissionEvaluationId,
  }));
  const nested = compileLocationOwnedPatientSlotSelection({
    schemaVersion: 1,
    id: `location-slot-request.d230.${hashToHex64(
      JSON.stringify(
        canonicalizeObjectKeys({
          selectorRequestId: selectionRequest.id,
          slotCoordinateId: selectionRequest.slotCoordinate.id,
          selectedAdmissionEvaluationId: selected.candidate.admissionEvaluationId,
        }),
      ),
    )}`,
    slotCoordinate: selectionRequest.slotCoordinate,
    admissionMatrixArtifact: matrix,
    currentAdmissionMatrixRequest: request.currentAdmissionMatrixRequest,
    selectedAdmissionEvaluationId: selected.candidate.admissionEvaluationId,
  });
  if (!nested.ok) {
    return fail(
      'NESTED_SLOT_SELECTION_FAILED',
      `${nested.error.code}: ${nested.error.message}`,
      nested.error.contentIds,
    );
  }
  const inputFingerprint = fingerprint('input', selectionRequest);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: LOCATION_TEMPLATE_SELECTOR_VERSION,
    requestId: selectionRequest.id,
    slotCoordinate: nested.value.slotCoordinate,
    admissionMatrixRef: selectionRequest.admissionMatrixRef,
    distributionProfileRef: {
      id: selectionRequest.distributionProfile.id,
      contentVersion: selectionRequest.distributionProfile.contentVersion,
    },
    distributionProfileFingerprint: fingerprintLocationTemplateDistributionProfile(
      selectionRequest.distributionProfile,
    ),
    stableDrawId: draw.stableDrawId,
    stableDrawValueHex: draw.stableDrawValueHex,
    stableDrawUnit: draw.stableDrawUnit,
    candidateEvaluations: evaluations,
    selectedAdmissionEvaluationId: selected.candidate.admissionEvaluationId,
    locationOwnedPatientSlotSelectionArtifact: nested.value,
    selectionRequest,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = LocationTemplateSelectionArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `location-template-selection.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
      matrix.id,
      selectionRequest.distributionProfile.id,
      selected.candidate.admissionEvaluationId,
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyLocationTemplateSelectionIntegrity = (
  value: unknown,
): LocationTemplateSelectionIntegrityResult => {
  const parsed = LocationTemplateSelectionArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (artifact.compilerVersion !== LOCATION_TEMPLATE_SELECTOR_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_SELECTOR_VERSION',
        message: `Unsupported location-template selector ${artifact.compilerVersion}.`,
      },
    };
  }
  const nested = verifyLocationOwnedPatientSlotSelectionIntegrity(
    artifact.locationOwnedPatientSlotSelectionArtifact,
  );
  if (!nested.ok) {
    return {
      ok: false,
      error: {
        code: 'NESTED_SLOT_SELECTION_INVALID',
        message: `${nested.error.code}: ${nested.error.message}`,
      },
    };
  }
  const expectedProfileFingerprint = fingerprintLocationTemplateDistributionProfile(
    artifact.selectionRequest.distributionProfile,
  );
  const eligibility = verifyLocationTemplateSelectionEligibilityOverlay(
    artifact.selectionRequest.eligibilityOverlay,
  );
  if (
    !eligibility.ok ||
    artifact.distributionProfileRef.id !== artifact.selectionRequest.distributionProfile.id ||
    artifact.distributionProfileRef.contentVersion !==
      artifact.selectionRequest.distributionProfile.contentVersion ||
    artifact.distributionProfileFingerprint !== expectedProfileFingerprint ||
    artifact.slotCoordinate.id !== artifact.selectionRequest.slotCoordinate.id ||
    artifact.slotCoordinate.locationRef.id !==
      artifact.selectionRequest.slotCoordinate.locationRef.id ||
    artifact.slotCoordinate.locationRef.contentVersion !==
      artifact.selectionRequest.slotCoordinate.locationRef.contentVersion ||
    artifact.admissionMatrixRef.id !== artifact.selectionRequest.admissionMatrixRef.id ||
    artifact.admissionMatrixRef.inputFingerprint !==
      artifact.selectionRequest.admissionMatrixRef.inputFingerprint ||
    artifact.admissionMatrixRef.payloadFingerprint !==
      artifact.selectionRequest.admissionMatrixRef.payloadFingerprint ||
    artifact.selectionRequest.distributionProfile.locationRef.id !==
      artifact.slotCoordinate.locationRef.id ||
    artifact.selectionRequest.distributionProfile.locationRef.contentVersion !==
      artifact.slotCoordinate.locationRef.contentVersion ||
    artifact.selectionRequest.distributionProfile.locationFingerprint !==
      artifact.slotCoordinate.locationFingerprint ||
    artifact.selectionRequest.localRepeatContext.locationRef.id !==
      artifact.slotCoordinate.locationRef.id ||
    artifact.selectionRequest.localRepeatContext.locationRef.contentVersion !==
      artifact.slotCoordinate.locationRef.contentVersion ||
    artifact.selectionRequest.localRepeatContext.activeWaitingAssignments.some(
      (assignment) => assignment.slotCoordinateId === artifact.slotCoordinate.id,
    )
  ) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message:
          'The frozen distribution profile, slot coordinate, matrix reference, and nested D-229 context do not agree.',
      },
    };
  }
  const evaluated = candidateEvaluations({
    candidates: filterCandidatesByEligibility({
      candidates: nested.value.mechanicallyAdmittedCandidates,
      overlay: artifact.selectionRequest.eligibilityOverlay,
    }),
    request: artifact.selectionRequest,
  });
  if (!evaluated.ok) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: evaluated.message,
      },
    };
  }
  const draw = drawAudit(artifact.selectionRequest.seed, artifact.selectionRequest.slotCoordinate);
  const selected = selectEvaluation(
    evaluated.value.evaluations,
    draw.drawValue,
    evaluated.value.totalMass,
  );
  const expectedEvaluations = evaluated.value.evaluations.map((evaluation) => ({
    ...evaluation,
    selected:
      evaluation.candidate.admissionEvaluationId === selected.candidate.admissionEvaluationId,
  }));
  if (
    artifact.stableDrawId !== draw.stableDrawId ||
    artifact.stableDrawValueHex !== draw.stableDrawValueHex ||
    artifact.stableDrawUnit !== draw.stableDrawUnit ||
    artifact.selectedAdmissionEvaluationId !== selected.candidate.admissionEvaluationId ||
    nested.value.selectedAdmissionEvaluationId !== selected.candidate.admissionEvaluationId ||
    !sameCanonicalValue(artifact.candidateEvaluations, expectedEvaluations)
  ) {
    return {
      ok: false,
      error: {
        code: 'DRAW_MISMATCH',
        message:
          'The frozen weight, suppression, normalized-mass, stable-draw, or selected-candidate audit does not replay.',
      },
    };
  }
  const expectedInputFingerprint = fingerprint('input', artifact.selectionRequest);
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its compact selector request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `location-template-selection.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen selector payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyLocationTemplateSelectionContext = (input: {
  readonly artifact: unknown;
  readonly admissionMatrixArtifact: unknown;
  readonly currentAdmissionMatrixRequest: unknown;
}): LocationTemplateSelectionContextResult => {
  const integrity = verifyLocationTemplateSelectionIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const matrixContext = verifyPatientTemplateLocationAdmissionMatrixContext({
    artifact: input.admissionMatrixArtifact,
    request: input.currentAdmissionMatrixRequest,
  });
  if (!matrixContext.ok) {
    return {
      ok: false,
      error: {
        code: 'MATRIX_CONTEXT_MISMATCH',
        message: `${matrixContext.error.code}: ${matrixContext.error.message}`,
      },
    };
  }
  const request = integrity.value.selectionRequest;
  const replay = compileLocationTemplateSelection({
    schemaVersion: 1,
    id: request.id,
    seed: request.seed,
    slotCoordinate: request.slotCoordinate,
    admissionMatrixArtifact: matrixContext.value,
    currentAdmissionMatrixRequest: input.currentAdmissionMatrixRequest,
    distributionProfile: request.distributionProfile,
    localRepeatContext: request.localRepeatContext,
    eligibilityOverlay: request.eligibilityOverlay,
  });
  if (!replay.ok || !sameCanonicalValue(replay.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'SELECTION_MISMATCH',
        message:
          'The local template distribution decision does not match the exact current D-226 horizon and frozen D-230 inputs.',
      },
    };
  }
  return { ok: true, value: integrity.value };
};
