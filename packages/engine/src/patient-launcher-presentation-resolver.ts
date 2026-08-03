import {
  PatientLauncherPresentationResolutionArtifactSchema,
  PatientLauncherPresentationResolutionRequestSchema,
  type PatientChiefComplaintBank,
  type PatientLauncherPresentationFingerprint,
  type PatientLauncherPresentationProfile,
  type PatientLauncherPresentationResolutionArtifact,
  type PatientLauncherPresentationResolutionRequest,
  type VariantPoolDefinition,
} from '@psychsim/schemas';

import { seededUnit } from './rng';

export const PATIENT_LAUNCHER_PRESENTATION_RESOLVER_VERSION = '1.0.0';

export type PatientLauncherPresentationResolutionResult =
  | { readonly ok: true; readonly value: PatientLauncherPresentationResolutionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_REQUEST' | 'UNAPPROVED_PROFILE' | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type PatientLauncherPresentationResolutionIntegrityResult =
  | { readonly ok: true; readonly value: PatientLauncherPresentationResolutionArtifact }
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

const fingerprint = (scope: string, value: unknown): PatientLauncherPresentationFingerprint =>
  `fingerprint.patient-launcher-presentation.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalizeObjectKeys(value)))}`;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const normalizePool = (pool: VariantPoolDefinition): VariantPoolDefinition => ({
  ...pool,
  values: [...pool.values].sort((left, right) => compareStrings(String(left), String(right))),
});

const normalizeBank = (bank: PatientChiefComplaintBank): PatientChiefComplaintBank => ({
  ...bank,
  variants: [...bank.variants].sort((left, right) => compareStrings(left.id, right.id)),
});

const normalizeProfile = (
  profile: PatientLauncherPresentationProfile,
): PatientLauncherPresentationProfile => ({
  ...profile,
  complaintBankBindings: [...profile.complaintBankBindings].sort((left, right) =>
    compareStrings(left.id, right.id),
  ),
  developerOpinionIds: uniqueSorted(profile.developerOpinionIds),
  review: {
    ...profile.review,
    sourceUseNoteIds: uniqueSorted(profile.review.sourceUseNoteIds),
  },
});

const normalizeRequest = (
  request: PatientLauncherPresentationResolutionRequest,
): PatientLauncherPresentationResolutionRequest =>
  PatientLauncherPresentationResolutionRequestSchema.parse({
    ...request,
    profile: normalizeProfile(request.profile),
    firstNamePool: normalizePool(request.firstNamePool),
    lastNamePool: normalizePool(request.lastNamePool),
    complaintBanks: [...request.complaintBanks]
      .map(normalizeBank)
      .sort((left, right) => compareStrings(left.id, right.id)),
  });

export const fingerprintPatientLauncherPresentationProfile = (
  profile: PatientLauncherPresentationProfile,
): PatientLauncherPresentationFingerprint => fingerprint('profile', normalizeProfile(profile));

export const fingerprintPatientLauncherVariantPool = (
  pool: VariantPoolDefinition,
): PatientLauncherPresentationFingerprint => fingerprint('variant-pool', normalizePool(pool));

export const fingerprintPatientChiefComplaintBank = (
  bank: PatientChiefComplaintBank,
): PatientLauncherPresentationFingerprint => fingerprint('complaint-bank', normalizeBank(bank));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const fail = (
  code: Extract<PatientLauncherPresentationResolutionResult, { ok: false }>['error']['code'],
  message: string,
): PatientLauncherPresentationResolutionResult => ({
  ok: false,
  error: { code, message },
});

const pickUniformIndex = (seed: string, key: string, length: number): number =>
  Math.min(length - 1, Math.floor(seededUnit(seed, key) * length));

const pickWeightedIndex = (seed: string, key: string, weights: readonly number[]): number => {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = seededUnit(seed, key) * total;
  for (const [index, weight] of weights.entries()) {
    cursor -= weight;
    if (cursor < 0) return index;
  }
  return weights.length - 1;
};

export const resolvePatientLauncherPresentation = (
  rawRequest: PatientLauncherPresentationResolutionRequest,
): PatientLauncherPresentationResolutionResult => {
  const parsed = PatientLauncherPresentationResolutionRequestSchema.safeParse(rawRequest);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues));
  }
  const request = normalizeRequest(parsed.data);
  if (
    request.profile.review.status !== 'approved' ||
    (request.profile.review.sourceUseNoteIds.length === 0 &&
      request.profile.developerOpinionIds.length === 0)
  ) {
    return fail(
      'UNAPPROVED_PROFILE',
      `${request.profile.id}@${request.profile.contentVersion} lacks approved reviewed provenance.`,
    );
  }

  const profileFingerprint = fingerprintPatientLauncherPresentationProfile(request.profile);
  const firstNamePoolFingerprint = fingerprintPatientLauncherVariantPool(request.firstNamePool);
  const lastNamePoolFingerprint = fingerprintPatientLauncherVariantPool(request.lastNamePool);
  const complaintBankById = new Map(request.complaintBanks.map((bank) => [bank.id, bank]));
  const complaintBankFingerprintById = new Map(
    request.complaintBanks.map((bank) => [bank.id, fingerprintPatientChiefComplaintBank(bank)]),
  );

  const firstNameKey = JSON.stringify({
    patientStateId: request.patientStateId,
    profileRef: {
      id: request.profile.id,
      contentVersion: request.profile.contentVersion,
    },
    poolRef: request.profile.firstNamePoolRef,
    poolFingerprint: firstNamePoolFingerprint,
    role: 'first_name',
  });
  const lastNameKey = JSON.stringify({
    patientStateId: request.patientStateId,
    profileRef: {
      id: request.profile.id,
      contentVersion: request.profile.contentVersion,
    },
    poolRef: request.profile.lastNamePoolRef,
    poolFingerprint: lastNamePoolFingerprint,
    role: 'last_name',
  });
  const middlePresenceKey = JSON.stringify({
    patientStateId: request.patientStateId,
    profileRef: {
      id: request.profile.id,
      contentVersion: request.profile.contentVersion,
    },
    probability: request.profile.middleInitialProbability,
    role: 'middle_initial_presence',
  });
  const middleLetterKey = JSON.stringify({
    patientStateId: request.patientStateId,
    profileRef: {
      id: request.profile.id,
      contentVersion: request.profile.contentVersion,
    },
    role: 'middle_initial_letter',
  });

  const firstNameValues = request.firstNamePool.values as string[];
  const lastNameValues = request.lastNamePool.values as string[];
  const firstName =
    firstNameValues[pickUniformIndex(request.seed, firstNameKey, firstNameValues.length)]!;
  const lastName =
    lastNameValues[pickUniformIndex(request.seed, lastNameKey, lastNameValues.length)]!;
  const includesMiddleInitial =
    seededUnit(request.seed, middlePresenceKey) <
    request.profile.middleInitialProbability.numerator /
      request.profile.middleInitialProbability.denominator;
  const middleInitial = includesMiddleInitial
    ? String.fromCharCode(65 + pickUniformIndex(request.seed, middleLetterKey, 26))
    : null;

  const highestSpecificity = Math.max(
    ...request.profile.complaintBankBindings.map((binding) => binding.specificityPriority),
  );
  const eligibleBindings = request.profile.complaintBankBindings.filter(
    (binding) => binding.specificityPriority === highestSpecificity,
  );
  const complaintBankKey = JSON.stringify({
    patientStateId: request.patientStateId,
    profileRef: {
      id: request.profile.id,
      contentVersion: request.profile.contentVersion,
    },
    eligibleBindings: eligibleBindings.map((binding) => ({
      binding,
      bankFingerprint: complaintBankFingerprintById.get(binding.bankRef.id),
    })),
    role: 'chief_complaint_bank',
  });
  const selectedBinding =
    eligibleBindings[
      pickWeightedIndex(
        request.seed,
        complaintBankKey,
        eligibleBindings.map((binding) => binding.gameSelectionWeight),
      )
    ]!;
  const selectedBank = complaintBankById.get(selectedBinding.bankRef.id)!;
  const selectedBankFingerprint = complaintBankFingerprintById.get(selectedBank.id)!;
  const complaintVariantKey = JSON.stringify({
    patientStateId: request.patientStateId,
    profileRef: {
      id: request.profile.id,
      contentVersion: request.profile.contentVersion,
    },
    bindingId: selectedBinding.id,
    bankRef: selectedBinding.bankRef,
    bankFingerprint: selectedBankFingerprint,
    role: 'chief_complaint_variant',
  });
  const selectedVariant =
    selectedBank.variants[
      pickUniformIndex(request.seed, complaintVariantKey, selectedBank.variants.length)
    ]!;

  const complaintBankEvaluations = request.profile.complaintBankBindings.map((binding) => ({
    binding,
    bankFingerprint: complaintBankFingerprintById.get(binding.bankRef.id)!,
    disposition:
      binding.specificityPriority === highestSpecificity
        ? ('eligible_highest_specificity' as const)
        : ('shadowed_lower_specificity' as const),
    selected: binding.id === selectedBinding.id,
  }));
  const displayName = `${firstName}${middleInitial === null ? '' : ` ${middleInitial}.`} ${lastName}`;
  const resolvedPresentation = {
    schemaVersion: 1 as const,
    id: stableId('resolved-patient-launcher-presentation', {
      patientStateId: request.patientStateId,
      firstName,
      middleInitial,
      lastName,
      bankRef: selectedBinding.bankRef,
      variantId: selectedVariant.id,
    }),
    patientStateId: request.patientStateId,
    fictionalName: {
      firstName,
      middleInitial,
      lastName,
      displayName,
    },
    chiefComplaint: {
      bankRef: selectedBinding.bankRef,
      variantId: selectedVariant.id,
      text: selectedVariant.text,
    },
    resolverVersion: PATIENT_LAUNCHER_PRESENTATION_RESOLVER_VERSION,
  };
  const firstNameStableDrawId = stableId('stable-draw.patient-launcher.first-name', {
    seedFingerprint: hashToHex64(request.seed),
    key: firstNameKey,
  });
  const lastNameStableDrawId = stableId('stable-draw.patient-launcher.last-name', {
    seedFingerprint: hashToHex64(request.seed),
    key: lastNameKey,
  });
  const middleInitialPresenceStableDrawId = stableId(
    'stable-draw.patient-launcher.middle-initial-presence',
    {
      seedFingerprint: hashToHex64(request.seed),
      key: middlePresenceKey,
    },
  );
  const middleInitialLetterStableDrawId = stableId(
    'stable-draw.patient-launcher.middle-initial-letter',
    {
      seedFingerprint: hashToHex64(request.seed),
      key: middleLetterKey,
    },
  );
  const complaintBankStableDrawId = stableId('stable-draw.patient-launcher.complaint-bank', {
    seedFingerprint: hashToHex64(request.seed),
    key: complaintBankKey,
  });
  const complaintVariantStableDrawId = stableId('stable-draw.patient-launcher.complaint-variant', {
    seedFingerprint: hashToHex64(request.seed),
    key: complaintVariantKey,
  });
  const normalizedWithoutFingerprints = {
    schemaVersion: 1 as const,
    resolverVersion: PATIENT_LAUNCHER_PRESENTATION_RESOLVER_VERSION,
    requestId: request.id,
    patientStateId: request.patientStateId,
    profileRef: {
      id: request.profile.id,
      contentVersion: request.profile.contentVersion,
    },
    profileFingerprint,
    firstNamePoolRef: {
      id: request.firstNamePool.id,
      contentVersion: request.firstNamePool.contentVersion,
    },
    firstNamePoolFingerprint,
    lastNamePoolRef: {
      id: request.lastNamePool.id,
      contentVersion: request.lastNamePool.contentVersion,
    },
    lastNamePoolFingerprint,
    complaintBankEvaluations,
    firstNameStableDrawId,
    lastNameStableDrawId,
    middleInitialPresenceStableDrawId,
    middleInitialLetterStableDrawId,
    complaintBankStableDrawId,
    complaintVariantStableDrawId,
    resolvedPresentation,
    resolutionRequest: request,
  };
  const inputFingerprint = fingerprint('input', request);
  const payloadFingerprint = fingerprint('payload', {
    ...normalizedWithoutFingerprints,
    inputFingerprint,
  });
  const artifact = PatientLauncherPresentationResolutionArtifactSchema.safeParse({
    ...normalizedWithoutFingerprints,
    id: `patient-launcher-presentation-resolution.${payloadFingerprint.slice(-16)}`,
    inputFingerprint,
    payloadFingerprint,
  });
  if (!artifact.success) {
    return fail('INVALID_OUTPUT', issuesText(artifact.error.issues));
  }
  return { ok: true, value: artifact.data };
};

export const verifyPatientLauncherPresentationResolutionIntegrity = (
  rawArtifact: PatientLauncherPresentationResolutionArtifact,
): PatientLauncherPresentationResolutionIntegrityResult => {
  const parsed = PatientLauncherPresentationResolutionArtifactSchema.safeParse(rawArtifact);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  if (parsed.data.resolverVersion !== PATIENT_LAUNCHER_PRESENTATION_RESOLVER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_RESOLVER_VERSION',
        message: `Unsupported launcher-presentation resolver ${parsed.data.resolverVersion}.`,
      },
    };
  }
  const replay = resolvePatientLauncherPresentation(parsed.data.resolutionRequest);
  if (!replay.ok) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_FAILED',
        message: `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  if (!sameExactValue(replay.value, parsed.data)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'Launcher-presentation artifact does not match deterministic replay of its exact request.',
      },
    };
  }
  return { ok: true, value: parsed.data };
};
