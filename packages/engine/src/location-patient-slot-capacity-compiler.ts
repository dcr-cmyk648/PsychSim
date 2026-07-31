import {
  CapacityBoundLocationTemplateSelectionCertificateArtifactSchema,
  CapacityBoundLocationTemplateSelectionCertificateCompileInputSchema,
  LocationPatientSlotCapacityArtifactSchema,
  LocationPatientSlotCapacityCompileRequestSchema,
  LocationPatientSlotCapacityOwnershipContextSchema,
  type CapacityBoundLocationTemplateSelectionCertificateArtifact,
  type CapacityBoundLocationTemplateSelectionCertificateCompileInput,
  type CapacityBoundLocationTemplateSelectionCertificateRequest,
  type LocationPatientSlotCapacityArtifact,
  type LocationPatientSlotCapacityAuthorization,
  type LocationPatientSlotCapacityCompileRequest,
  type LocationPatientSlotCapacityCoordinate,
  type LocationPatientSlotCapacityFingerprint,
  type LocationPatientSlotCapacityOwnershipContext,
  type LocationPatientSlotCapacityProfile,
  type LocationTemplateSelectionArtifact,
} from '@psychsim/schemas';

import { fingerprintPatientTemplateLocationAdmissionLocation } from './patient-template-location-admission-compiler';
import { verifyLocationTemplateSelectionIntegrity } from './location-template-selector';

export const LOCATION_PATIENT_SLOT_CAPACITY_COMPILER_VERSION = '1.0.0';
export const CAPACITY_BOUND_LOCATION_TEMPLATE_SELECTION_CERTIFICATE_COMPILER_VERSION = '1.0.0';

export type LocationPatientSlotCapacityCompileResult =
  | { readonly ok: true; readonly value: LocationPatientSlotCapacityArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_REQUEST' | 'LOCATION_CONTEXT_MISMATCH' | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type LocationPatientSlotCapacityIntegrityResult =
  | { readonly ok: true; readonly value: LocationPatientSlotCapacityArtifact }
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

export type LocationPatientSlotCapacityContextResult =
  | { readonly ok: true; readonly value: LocationPatientSlotCapacityArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_ARTIFACT' | 'CONTEXT_MISMATCH';
        readonly message: string;
      };
    };

export type CapacityBoundLocationTemplateSelectionCertificateCompileResult =
  | {
      readonly ok: true;
      readonly value: CapacityBoundLocationTemplateSelectionCertificateArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_INPUT'
          | 'INVALID_TEMPLATE_SELECTION'
          | 'INVALID_CAPACITY'
          | 'LOCATION_CONTEXT_MISMATCH'
          | 'SLOT_NOT_AUTHORIZED'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type CapacityBoundLocationTemplateSelectionCertificateIntegrityResult =
  | {
      readonly ok: true;
      readonly value: CapacityBoundLocationTemplateSelectionCertificateArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

export type CapacityBoundLocationTemplateSelectionCertificateContextResult =
  | {
      readonly ok: true;
      readonly value: CapacityBoundLocationTemplateSelectionCertificateArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_CERTIFICATE'
          | 'INVALID_TEMPLATE_SELECTION'
          | 'INVALID_CAPACITY'
          | 'CONTEXT_MISMATCH';
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

const fingerprint = (scope: string, value: unknown): LocationPatientSlotCapacityFingerprint =>
  `fingerprint.location-patient-slot-capacity.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const normalizeRef = <Reference extends { readonly id: string }>(
  references: readonly Reference[],
): Reference[] => [...references].sort((left, right) => compareStrings(left.id, right.id));

const normalizeProfile = (
  profile: LocationPatientSlotCapacityProfile,
): LocationPatientSlotCapacityProfile => ({
  ...profile,
  upgradeContributions: [...profile.upgradeContributions].sort((left, right) =>
    compareStrings(left.id, right.id),
  ),
});

export const normalizeLocationPatientSlotCapacityRequest = (
  request: LocationPatientSlotCapacityCompileRequest,
): LocationPatientSlotCapacityCompileRequest =>
  LocationPatientSlotCapacityCompileRequestSchema.parse({
    ...request,
    location: {
      ...request.location,
      capabilities: [...request.location.capabilities].sort(compareStrings),
      dispositionIds: [...request.location.dispositionIds].sort(compareStrings),
    },
    capacityProfile: normalizeProfile(request.capacityProfile),
    ownershipContext: {
      ...request.ownershipContext,
      ownedCapacityUpgradeRefs: normalizeRef(request.ownershipContext.ownedCapacityUpgradeRefs),
    },
    assignedCapacityUpgradeRefs: normalizeRef(request.assignedCapacityUpgradeRefs),
  });

export const projectLocationPatientSlotCapacityOwnershipContext = (input: {
  readonly schemaVersion: number;
  readonly clinicStateId: string;
  readonly ownedCapacityUpgradeRefs: readonly {
    readonly id: string;
    readonly contentVersion: string;
  }[];
  readonly capacityProfile: LocationPatientSlotCapacityProfile;
}): LocationPatientSlotCapacityOwnershipContext => {
  const contributionIds = new Set(
    input.capacityProfile.upgradeContributions.map((contribution) => contribution.upgradeRef.id),
  );
  return LocationPatientSlotCapacityOwnershipContextSchema.parse({
    schemaVersion: input.schemaVersion,
    modelVersion: 'location-patient-slot-capacity-ownership.v1',
    clinicStateId: input.clinicStateId,
    ownedCapacityUpgradeRefs: normalizeRef(
      input.ownedCapacityUpgradeRefs.filter((reference) => contributionIds.has(reference.id)),
    ),
  });
};

export const fingerprintLocationPatientSlotCapacityProfile = (
  profile: LocationPatientSlotCapacityProfile,
): LocationPatientSlotCapacityFingerprint => fingerprint('profile', normalizeProfile(profile));

const coordinateId = (
  locationRef: LocationPatientSlotCapacityCompileRequest['capacityProfile']['locationRef'],
  authorization: LocationPatientSlotCapacityAuthorization,
): string =>
  `location-patient-slot-coordinate.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys({ locationRef, authorization })),
  )}`;

const coordinate = (
  request: LocationPatientSlotCapacityCompileRequest,
  authorization: LocationPatientSlotCapacityAuthorization,
): LocationPatientSlotCapacityCoordinate => ({
  slotCoordinate: {
    schemaVersion: 1,
    id: coordinateId(request.capacityProfile.locationRef, authorization),
    locationRef: request.capacityProfile.locationRef,
    locationFingerprint: request.capacityProfile.locationFingerprint,
    careSetting: request.location.careSetting,
  },
  authorization,
});

const capacityArtifactPayload = (
  artifact: Omit<LocationPatientSlotCapacityArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  locationRef: artifact.locationRef,
  locationFingerprint: artifact.locationFingerprint,
  capacityProfileRef: artifact.capacityProfileRef,
  capacityProfileFingerprint: artifact.capacityProfileFingerprint,
  baseSlotCount: artifact.baseSlotCount,
  upgradeEvaluations: artifact.upgradeEvaluations,
  totalSlotCount: artifact.totalSlotCount,
  slotCoordinates: artifact.slotCoordinates,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const compileLocationPatientSlotCapacity = (
  input: unknown,
): LocationPatientSlotCapacityCompileResult => {
  const parsed = LocationPatientSlotCapacityCompileRequestSchema.safeParse(input);
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
  const request = normalizeLocationPatientSlotCapacityRequest(parsed.data);
  const expectedLocationFingerprint = fingerprintPatientTemplateLocationAdmissionLocation(
    request.location,
  );
  if (request.capacityProfile.locationFingerprint !== expectedLocationFingerprint) {
    return {
      ok: false,
      error: {
        code: 'LOCATION_CONTEXT_MISMATCH',
        message: 'The capacity profile does not match the exact current location payload it names.',
        contentIds: [request.capacityProfile.id, request.location.id],
      },
    };
  }

  const ownedIds = new Set(
    request.ownershipContext.ownedCapacityUpgradeRefs.map((reference) => reference.id),
  );
  const assignedIds = new Set(request.assignedCapacityUpgradeRefs.map((reference) => reference.id));
  const upgradeEvaluations = request.capacityProfile.upgradeContributions.map((contribution) => {
    const owned = ownedIds.has(contribution.upgradeRef.id);
    const assignedToLocation = assignedIds.has(contribution.upgradeRef.id);
    const applied = owned && assignedToLocation;
    return {
      contribution,
      owned,
      assignedToLocation,
      applied,
      appliedSlotCount: applied ? contribution.additionalSlotCount : 0,
    };
  });

  const slotCoordinates: LocationPatientSlotCapacityCoordinate[] = [];
  for (
    let baseSlotOrdinal = 1;
    baseSlotOrdinal <= request.capacityProfile.baseSlotCount;
    baseSlotOrdinal += 1
  ) {
    slotCoordinates.push(coordinate(request, { kind: 'base', baseSlotOrdinal }));
  }
  for (const evaluation of upgradeEvaluations) {
    if (!evaluation.applied) continue;
    for (
      let contributionSlotOrdinal = 1;
      contributionSlotOrdinal <= evaluation.contribution.additionalSlotCount;
      contributionSlotOrdinal += 1
    ) {
      slotCoordinates.push(
        coordinate(request, {
          kind: 'capacity_upgrade',
          contributionId: evaluation.contribution.id,
          upgradeRef: evaluation.contribution.upgradeRef,
          contributionSlotOrdinal,
        }),
      );
    }
  }
  slotCoordinates.sort((left, right) =>
    compareStrings(left.slotCoordinate.id, right.slotCoordinate.id),
  );

  const capacityProfileFingerprint = fingerprintLocationPatientSlotCapacityProfile(
    request.capacityProfile,
  );
  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: LOCATION_PATIENT_SLOT_CAPACITY_COMPILER_VERSION,
    requestId: request.id,
    locationRef: request.capacityProfile.locationRef,
    locationFingerprint: request.capacityProfile.locationFingerprint,
    capacityProfileRef: {
      id: request.capacityProfile.id,
      contentVersion: request.capacityProfile.contentVersion,
    },
    capacityProfileFingerprint,
    baseSlotCount: request.capacityProfile.baseSlotCount,
    upgradeEvaluations,
    totalSlotCount: slotCoordinates.length,
    slotCoordinates,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', capacityArtifactPayload(withoutIdentity));
  const output = LocationPatientSlotCapacityArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `location-patient-slot-capacity.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(output.error.issues),
        contentIds: [request.location.id, request.capacityProfile.id],
      },
    };
  }
  return { ok: true, value: output.data };
};

export const verifyLocationPatientSlotCapacityIntegrity = (
  value: unknown,
): LocationPatientSlotCapacityIntegrityResult => {
  const parsed = LocationPatientSlotCapacityArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (artifact.compilerVersion !== LOCATION_PATIENT_SLOT_CAPACITY_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported location capacity compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const replay = compileLocationPatientSlotCapacity(artifact.compileRequest);
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
        message: `${artifact.id} does not match deterministic capacity replay.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', capacityArtifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `location-patient-slot-capacity.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its capacity payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyLocationPatientSlotCapacityContext = (input: {
  readonly artifact: unknown;
  readonly currentRequest: unknown;
}): LocationPatientSlotCapacityContextResult => {
  const integrity = verifyLocationPatientSlotCapacityIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const current = compileLocationPatientSlotCapacity(input.currentRequest);
  if (!current.ok || !sameCanonicalValue(current.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message:
          'The capacity artifact does not match the exact current location profile, ownership, and assignment context.',
      },
    };
  }
  return { ok: true, value: integrity.value };
};

const selectionReference = (
  selection: LocationTemplateSelectionArtifact,
): CapacityBoundLocationTemplateSelectionCertificateRequest['locationTemplateSelectionRef'] => ({
  id: selection.id,
  inputFingerprint: selection.inputFingerprint,
  payloadFingerprint: selection.payloadFingerprint,
});

const certificateArtifactPayload = (
  artifact: Omit<
    CapacityBoundLocationTemplateSelectionCertificateArtifact,
    'id' | 'payloadFingerprint'
  >,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  locationTemplateSelectionRef: artifact.locationTemplateSelectionRef,
  capacityProfileRef: artifact.capacityProfileRef,
  capacityProfileFingerprint: artifact.capacityProfileFingerprint,
  slotCoordinate: artifact.slotCoordinate,
  authorization: artifact.authorization,
  certificateRequest: artifact.certificateRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const compileCapacityBoundLocationTemplateSelectionCertificate = (
  input: unknown,
): CapacityBoundLocationTemplateSelectionCertificateCompileResult => {
  const parsed =
    CapacityBoundLocationTemplateSelectionCertificateCompileInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: issuesText(parsed.error.issues),
        contentIds: [],
      },
    };
  }
  const request: CapacityBoundLocationTemplateSelectionCertificateCompileInput = parsed.data;
  const selection = verifyLocationTemplateSelectionIntegrity(
    request.locationTemplateSelectionArtifact,
  );
  if (!selection.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_TEMPLATE_SELECTION',
        message: `${selection.error.code}: ${selection.error.message}`,
        contentIds: [request.locationTemplateSelectionArtifact.id],
      },
    };
  }
  const capacity = verifyLocationPatientSlotCapacityContext({
    artifact: request.capacityArtifact,
    currentRequest: request.currentCapacityRequest,
  });
  if (!capacity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CAPACITY',
        message: `${capacity.error.code}: ${capacity.error.message}`,
        contentIds: [request.capacityArtifact.id],
      },
    };
  }
  const selectedCoordinate = selection.value.slotCoordinate;
  if (
    capacity.value.locationRef.id !== selectedCoordinate.locationRef.id ||
    capacity.value.locationRef.contentVersion !== selectedCoordinate.locationRef.contentVersion
  ) {
    return {
      ok: false,
      error: {
        code: 'LOCATION_CONTEXT_MISMATCH',
        message:
          'The D-230 selection and capacity artifact must name the same exact physical location.',
        contentIds: [selection.value.id, capacity.value.id, selectedCoordinate.locationRef.id],
      },
    };
  }
  const authorized = capacity.value.slotCoordinates.find(
    (entry) => entry.slotCoordinate.id === selectedCoordinate.id,
  );
  if (authorized === undefined) {
    return {
      ok: false,
      error: {
        code: 'SLOT_NOT_AUTHORIZED',
        message:
          'The caller-authored D-230 coordinate is not one of the exact currently authorized capacity coordinates.',
        contentIds: [selection.value.id, capacity.value.id, selectedCoordinate.id],
      },
    };
  }
  const certificateRequest: CapacityBoundLocationTemplateSelectionCertificateRequest = {
    schemaVersion: 1,
    id: request.id,
    locationTemplateSelectionRef: selectionReference(selection.value),
    capacityProfileRef: capacity.value.capacityProfileRef,
    capacityProfileFingerprint: capacity.value.capacityProfileFingerprint,
    slotCoordinateId: selectedCoordinate.id,
  };
  const inputFingerprint = fingerprint('certificate-input', certificateRequest);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: CAPACITY_BOUND_LOCATION_TEMPLATE_SELECTION_CERTIFICATE_COMPILER_VERSION,
    requestId: certificateRequest.id,
    locationTemplateSelectionRef: certificateRequest.locationTemplateSelectionRef,
    capacityProfileRef: certificateRequest.capacityProfileRef,
    capacityProfileFingerprint: certificateRequest.capacityProfileFingerprint,
    slotCoordinate: authorized.slotCoordinate,
    authorization: authorized.authorization,
    certificateRequest,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint(
    'certificate-payload',
    certificateArtifactPayload(withoutIdentity),
  );
  const output = CapacityBoundLocationTemplateSelectionCertificateArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `capacity-bound-location-template-selection.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(output.error.issues),
        contentIds: [selection.value.id, capacity.value.id, selectedCoordinate.id],
      },
    };
  }
  return { ok: true, value: output.data };
};

export const verifyCapacityBoundLocationTemplateSelectionCertificateIntegrity = (
  value: unknown,
): CapacityBoundLocationTemplateSelectionCertificateIntegrityResult => {
  const parsed = CapacityBoundLocationTemplateSelectionCertificateArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (
    artifact.compilerVersion !==
    CAPACITY_BOUND_LOCATION_TEMPLATE_SELECTION_CERTIFICATE_COMPILER_VERSION
  ) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported capacity certificate compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const expectedInputFingerprint = fingerprint('certificate-input', artifact.certificateRequest);
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its compact certificate request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint(
    'certificate-payload',
    certificateArtifactPayload(artifact),
  );
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `capacity-bound-location-template-selection.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its capacity certificate payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyCapacityBoundLocationTemplateSelectionCertificateContext = (input: {
  readonly certificate: unknown;
  readonly locationTemplateSelectionArtifact: unknown;
  readonly capacityArtifact: unknown;
  readonly currentCapacityRequest: unknown;
}): CapacityBoundLocationTemplateSelectionCertificateContextResult => {
  const integrity = verifyCapacityBoundLocationTemplateSelectionCertificateIntegrity(
    input.certificate,
  );
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CERTIFICATE',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const selection = verifyLocationTemplateSelectionIntegrity(
    input.locationTemplateSelectionArtifact,
  );
  if (!selection.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_TEMPLATE_SELECTION',
        message: `${selection.error.code}: ${selection.error.message}`,
      },
    };
  }
  const capacity = verifyLocationPatientSlotCapacityContext({
    artifact: input.capacityArtifact,
    currentRequest: input.currentCapacityRequest,
  });
  if (!capacity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CAPACITY',
        message: `${capacity.error.code}: ${capacity.error.message}`,
      },
    };
  }
  const replay = compileCapacityBoundLocationTemplateSelectionCertificate({
    schemaVersion: 1,
    id: integrity.value.requestId,
    locationTemplateSelectionArtifact: selection.value,
    capacityArtifact: capacity.value,
    currentCapacityRequest: input.currentCapacityRequest,
  });
  if (!replay.ok || !sameCanonicalValue(replay.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message:
          'The certificate does not match the exact D-230 selection and currently authorized capacity coordinate.',
      },
    };
  }
  return { ok: true, value: integrity.value };
};
