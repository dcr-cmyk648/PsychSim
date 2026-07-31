import {
  LocationPatientSlotOccupancySnapshotArtifactSchema,
  LocationPatientSlotOccupancySnapshotCompileInputSchema,
  PatientSlotFillSeedAuthorityArtifactSchema,
  PatientSlotFillSeedAuthorityCompileInputSchema,
  type LocationPatientSlotOccupancyEntry,
  type LocationPatientSlotOccupancySnapshotArtifact,
  type LocationPatientSlotOccupancySnapshotCompileInput,
  type PatientSlotFillFingerprint,
  type PatientSlotFillSeedAuthorityArtifact,
  type PatientSlotFillSeedCoordinates,
  type PatientSlotGenerationRoot,
  type PatientSlotGenerationRootReference,
} from '@psychsim/schemas';

import { verifyCatalogCompiledInstanceIntegrity } from './catalog-instance-compiler';
import {
  compileLocationTemplateSelection,
  verifyLocationTemplateSelectionIntegrity,
} from './location-template-selector';
import {
  compileCapacityBoundLocationTemplateSelectionCertificate,
  verifyCapacityBoundLocationTemplateSelectionCertificateIntegrity,
  verifyLocationPatientSlotCapacityContext,
} from './location-patient-slot-capacity-compiler';
import {
  fingerprintPatientTemplateLocationAdmissionLocation,
  verifyPatientTemplateLocationAdmissionMatrixContext,
} from './patient-template-location-admission-compiler';

export const LOCATION_PATIENT_SLOT_OCCUPANCY_SNAPSHOT_COMPILER_VERSION = '1.0.0';
export const PATIENT_SLOT_FILL_SEED_AUTHORITY_COMPILER_VERSION = '2.0.0';

export type LocationPatientSlotOccupancySnapshotCompileResult =
  | { readonly ok: true; readonly value: LocationPatientSlotOccupancySnapshotArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_INPUT'
          | 'INVALID_CAPACITY'
          | 'COORDINATE_COVERAGE_MISMATCH'
          | 'INVALID_WAITING_SLOT'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type LocationPatientSlotOccupancySnapshotIntegrityResult =
  | { readonly ok: true; readonly value: LocationPatientSlotOccupancySnapshotArtifact }
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

export type LocationPatientSlotOccupancySnapshotContextResult =
  | { readonly ok: true; readonly value: LocationPatientSlotOccupancySnapshotArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_ARTIFACT' | 'CONTEXT_MISMATCH';
        readonly message: string;
      };
    };

export type PatientSlotFillSeedAuthorityCompileResult =
  | { readonly ok: true; readonly value: PatientSlotFillSeedAuthorityArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_INPUT'
          | 'INVALID_OCCUPANCY'
          | 'INVALID_MATRIX'
          | 'MODE_CONTEXT_MISMATCH'
          | 'LOCATION_CONTEXT_MISMATCH'
          | 'TARGET_SLOT_NOT_EMPTY'
          | 'TARGET_SLOT_NOT_NEXT_EMPTY'
          | 'TEMPLATE_SELECTION_FAILED'
          | 'CAPACITY_CERTIFICATE_FAILED'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type PatientSlotFillSeedAuthorityIntegrityResult =
  | { readonly ok: true; readonly value: PatientSlotFillSeedAuthorityArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'UPSTREAM_INTEGRITY_INVALID'
          | 'SEED_CONTEXT_MISMATCH'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

export type PatientSlotFillSeedAuthorityContextResult =
  | { readonly ok: true; readonly value: PatientSlotFillSeedAuthorityArtifact }
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

const fingerprint = (scope: string, value: unknown): PatientSlotFillFingerprint =>
  `fingerprint.patient-slot-fill.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const failOccupancy = (
  code: Exclude<
    LocationPatientSlotOccupancySnapshotCompileResult,
    { readonly ok: true }
  >['error']['code'],
  message: string,
  contentIds: readonly string[] = [],
): LocationPatientSlotOccupancySnapshotCompileResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const failSeedAuthority = (
  code: Exclude<PatientSlotFillSeedAuthorityCompileResult, { readonly ok: true }>['error']['code'],
  message: string,
  contentIds: readonly string[] = [],
): PatientSlotFillSeedAuthorityCompileResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

export const getFirstEmptyLocationPatientSlotCoordinateId = (
  artifact: LocationPatientSlotOccupancySnapshotArtifact,
): string | null =>
  artifact.entries.find((entry) => entry.status === 'empty')?.capacityCoordinate.slotCoordinate
    .id ?? null;

export const fingerprintPatientSlotGenerationRoot = (
  root: PatientSlotGenerationRoot,
): PatientSlotFillFingerprint =>
  fingerprint('generation-root', {
    modelVersion: root.modelVersion,
    id: root.id,
    mode: root.mode,
    seed: root.seed,
  });

const generationRootReference = (
  root: PatientSlotGenerationRoot,
): PatientSlotGenerationRootReference => ({
  id: root.id,
  mode: root.mode,
  seedFingerprint: fingerprintPatientSlotGenerationRoot(root),
});

const capacityReference = (
  input: LocationPatientSlotOccupancySnapshotCompileInput,
): LocationPatientSlotOccupancySnapshotArtifact['capacityArtifactRef'] => ({
  locationRef: input.capacityArtifact.locationRef,
  artifactId: input.capacityArtifact.id,
  inputFingerprint: input.capacityArtifact.inputFingerprint,
  payloadFingerprint: input.capacityArtifact.payloadFingerprint,
});

const occupancyInputPayload = (input: {
  readonly requestId: string;
  readonly mode: LocationPatientSlotOccupancySnapshotArtifact['mode'];
  readonly capacityArtifactRef: LocationPatientSlotOccupancySnapshotArtifact['capacityArtifactRef'];
  readonly entries: readonly LocationPatientSlotOccupancyEntry[];
}): unknown => ({
  requestId: input.requestId,
  mode: input.mode,
  capacityArtifactRef: input.capacityArtifactRef,
  entries: input.entries,
});

const occupancyArtifactPayload = (
  artifact: Omit<LocationPatientSlotOccupancySnapshotArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  mode: artifact.mode,
  locationRef: artifact.locationRef,
  locationFingerprint: artifact.locationFingerprint,
  careSetting: artifact.careSetting,
  capacityArtifactRef: artifact.capacityArtifactRef,
  entries: artifact.entries,
  inputFingerprint: artifact.inputFingerprint,
});

const projectOccupiedEntry = (
  input: LocationPatientSlotOccupancySnapshotCompileInput['entries'][number],
  capacityCoordinate: LocationPatientSlotOccupancyEntry['capacityCoordinate'],
  mode: LocationPatientSlotOccupancySnapshotArtifact['mode'],
):
  | { readonly ok: true; readonly value: LocationPatientSlotOccupancyEntry }
  | { readonly ok: false; readonly message: string; readonly contentIds: readonly string[] } => {
  if (input.frozenWaitingSlot === null) {
    return {
      ok: true,
      value: {
        schemaVersion: 1,
        capacityCoordinate,
        nextFillOrdinal: input.nextFillOrdinal,
        status: 'empty',
        occupiedAssignment: null,
      },
    };
  }
  const audit = input.frozenWaitingSlot.findingPipelineAuditArtifact;
  if (audit.status !== 'compiled' || audit.catalogSnapshot === null) {
    return {
      ok: false,
      message: 'An occupied coordinate requires one complete frozen D-200 patient snapshot.',
      contentIds: [input.frozenWaitingSlot.id, audit.id],
    };
  }
  const seedAuthority = verifyPatientSlotFillSeedAuthorityIntegrity(
    audit.patientSlotFillSeedAuthorityArtifact,
  );
  const snapshot = verifyCatalogCompiledInstanceIntegrity(audit.catalogSnapshot);
  if (!seedAuthority.ok) {
    return {
      ok: false,
      message: `${seedAuthority.error.code}: ${seedAuthority.error.message}`,
      contentIds: [input.frozenWaitingSlot.id, audit.id],
    };
  }
  if (!snapshot.ok) {
    return {
      ok: false,
      message: snapshot.error.message,
      contentIds: [input.frozenWaitingSlot.id, audit.id],
    };
  }
  const historicalCoordinate =
    seedAuthority.value.capacityBoundSlotCertificateArtifact.slotCoordinate;
  if (
    seedAuthority.value.coordinates.mode !== mode ||
    !sameCanonicalValue(historicalCoordinate, capacityCoordinate.slotCoordinate)
  ) {
    return {
      ok: false,
      message:
        'An initial occupied assignment must remain on the exact mode and physical coordinate that authorized its frozen patient; facility moves require a separate committed placement proof.',
      contentIds: [
        input.frozenWaitingSlot.id,
        historicalCoordinate.id,
        capacityCoordinate.slotCoordinate.id,
      ],
    };
  }
  if (input.nextFillOrdinal !== seedAuthority.value.coordinates.fillOrdinal + 1) {
    return {
      ok: false,
      message:
        'An occupied coordinate must retain exactly the next ordinal after the fill that produced its immutable patient.',
      contentIds: [input.frozenWaitingSlot.id, capacityCoordinate.slotCoordinate.id],
    };
  }
  return {
    ok: true,
    value: {
      schemaVersion: 1,
      capacityCoordinate,
      nextFillOrdinal: input.nextFillOrdinal,
      status: 'occupied',
      occupiedAssignment: {
        waitingSlotId: input.frozenWaitingSlot.id,
        fillOrdinal: seedAuthority.value.coordinates.fillOrdinal,
        findingPipelineAuditRef: {
          id: audit.id,
          payloadFingerprint: audit.payloadFingerprint,
        },
        patientInstanceRef: {
          id: snapshot.value.patientInstance.id,
          payloadFingerprint: snapshot.value.patientInstance.payloadFingerprint,
        },
        templateRef: seedAuthority.value.selectedTemplateRef,
        templateFingerprint: seedAuthority.value.selectedTemplateFingerprint,
        patientSlotFillSeedAuthorityRef: {
          id: seedAuthority.value.id,
          inputFingerprint: seedAuthority.value.inputFingerprint,
          payloadFingerprint: seedAuthority.value.payloadFingerprint,
        },
      },
    },
  };
};

export const compileLocationPatientSlotOccupancySnapshot = (
  value: unknown,
): LocationPatientSlotOccupancySnapshotCompileResult => {
  const parsed = LocationPatientSlotOccupancySnapshotCompileInputSchema.safeParse(value);
  if (!parsed.success) return failOccupancy('INVALID_INPUT', issuesText(parsed.error.issues));
  const input = parsed.data;
  const capacity = verifyLocationPatientSlotCapacityContext({
    artifact: input.capacityArtifact,
    currentRequest: input.currentCapacityRequest,
  });
  if (!capacity.ok) {
    return failOccupancy('INVALID_CAPACITY', `${capacity.error.code}: ${capacity.error.message}`, [
      input.capacityArtifact.id,
    ]);
  }
  const inputIds = [...input.entries.map((entry) => entry.slotCoordinateId)].sort(compareStrings);
  const capacityIds = [
    ...capacity.value.slotCoordinates.map((entry) => entry.slotCoordinate.id),
  ].sort(compareStrings);
  if (inputIds.join('\u0000') !== capacityIds.join('\u0000')) {
    return failOccupancy(
      'COORDINATE_COVERAGE_MISMATCH',
      'The occupancy input must cover every and only currently authorized D-232 coordinate.',
      [capacity.value.id, ...inputIds, ...capacityIds],
    );
  }
  const inputByCoordinateId = new Map(
    input.entries.map((entry) => [entry.slotCoordinateId, entry]),
  );
  const entries: LocationPatientSlotOccupancyEntry[] = [];
  for (const capacityCoordinate of capacity.value.slotCoordinates) {
    const source = inputByCoordinateId.get(capacityCoordinate.slotCoordinate.id);
    if (source === undefined) {
      return failOccupancy(
        'COORDINATE_COVERAGE_MISMATCH',
        'A current authorized coordinate is missing from the occupancy input.',
        [capacityCoordinate.slotCoordinate.id],
      );
    }
    const projected = projectOccupiedEntry(source, capacityCoordinate, input.mode);
    if (!projected.ok) {
      return failOccupancy('INVALID_WAITING_SLOT', projected.message, projected.contentIds);
    }
    entries.push(projected.value);
  }
  entries.sort((left, right) =>
    compareStrings(
      left.capacityCoordinate.slotCoordinate.id,
      right.capacityCoordinate.slotCoordinate.id,
    ),
  );
  const compactCapacity = capacityReference(input);
  const inputFingerprint = fingerprint(
    'occupancy-input',
    occupancyInputPayload({
      requestId: input.id,
      mode: input.mode,
      capacityArtifactRef: compactCapacity,
      entries,
    }),
  );
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: LOCATION_PATIENT_SLOT_OCCUPANCY_SNAPSHOT_COMPILER_VERSION,
    requestId: input.id,
    mode: input.mode,
    locationRef: capacity.value.locationRef,
    locationFingerprint: capacity.value.locationFingerprint,
    careSetting: capacity.value.compileRequest.location.careSetting,
    capacityArtifactRef: compactCapacity,
    entries,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint(
    'occupancy-payload',
    occupancyArtifactPayload(withoutIdentity),
  );
  const output = LocationPatientSlotOccupancySnapshotArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `location-patient-slot-occupancy.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return failOccupancy('INVALID_OUTPUT', issuesText(output.error.issues), [
      capacity.value.id,
      ...entries.map((entry) => entry.capacityCoordinate.slotCoordinate.id),
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyLocationPatientSlotOccupancySnapshotIntegrity = (
  value: unknown,
): LocationPatientSlotOccupancySnapshotIntegrityResult => {
  const parsed = LocationPatientSlotOccupancySnapshotArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (artifact.compilerVersion !== LOCATION_PATIENT_SLOT_OCCUPANCY_SNAPSHOT_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported location occupancy compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const expectedInputFingerprint = fingerprint(
    'occupancy-input',
    occupancyInputPayload({
      requestId: artifact.requestId,
      mode: artifact.mode,
      capacityArtifactRef: artifact.capacityArtifactRef,
      entries: artifact.entries,
    }),
  );
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its compact occupancy input.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint(
    'occupancy-payload',
    occupancyArtifactPayload(artifact),
  );
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `location-patient-slot-occupancy.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its compact occupancy payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyLocationPatientSlotOccupancySnapshotContext = (input: {
  readonly artifact: unknown;
  readonly currentInput: unknown;
}): LocationPatientSlotOccupancySnapshotContextResult => {
  const integrity = verifyLocationPatientSlotOccupancySnapshotIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const replay = compileLocationPatientSlotOccupancySnapshot(input.currentInput);
  if (!replay.ok || !sameCanonicalValue(replay.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: replay.ok
          ? 'The occupancy artifact does not match the exact current capacity and frozen waiting slots.'
          : `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  return { ok: true, value: integrity.value };
};

const seedCoordinatePayload = (coordinates: PatientSlotFillSeedCoordinates): unknown => ({
  modelVersion: coordinates.modelVersion,
  generationRootRef: coordinates.generationRootRef,
  mode: coordinates.mode,
  locationRef: coordinates.locationRef,
  locationFingerprint: coordinates.locationFingerprint,
  slotCoordinateId: coordinates.slotCoordinateId,
  fillOrdinal: coordinates.fillOrdinal,
});

const templateSelectionSeed = (coordinates: PatientSlotFillSeedCoordinates): string =>
  `seed.patient-slot-template-selection.d233.${hashToHex64(
    JSON.stringify(
      canonicalizeObjectKeys({
        domain: 'patient-slot-template-selection.d233',
        coordinates: seedCoordinatePayload(coordinates),
      }),
    ),
  )}`;

const patientGenerationSeed = (
  coordinates: PatientSlotFillSeedCoordinates,
  selectedTemplateRef: PatientSlotFillSeedAuthorityArtifact['selectedTemplateRef'],
  selectedTemplateFingerprint: PatientSlotFillSeedAuthorityArtifact['selectedTemplateFingerprint'],
): string =>
  `seed.patient-generation.d233.${hashToHex64(
    JSON.stringify(
      canonicalizeObjectKeys({
        domain: 'patient-generation.d233',
        coordinates: seedCoordinatePayload(coordinates),
        selectedTemplateRef,
        selectedTemplateFingerprint,
      }),
    ),
  )}`;

const seedAuthorityInputPayload = (
  artifact: Pick<
    PatientSlotFillSeedAuthorityArtifact,
    | 'requestId'
    | 'coordinates'
    | 'occupancySnapshotArtifact'
    | 'localRepeatContext'
    | 'locationTemplateSelectionArtifact'
    | 'capacityBoundSlotCertificateArtifact'
  >,
): unknown => ({
  requestId: artifact.requestId,
  coordinates: artifact.coordinates,
  occupancySnapshotRef: {
    id: artifact.occupancySnapshotArtifact.id,
    inputFingerprint: artifact.occupancySnapshotArtifact.inputFingerprint,
    payloadFingerprint: artifact.occupancySnapshotArtifact.payloadFingerprint,
  },
  localRepeatContext: artifact.localRepeatContext,
  locationTemplateSelectionRef: {
    id: artifact.locationTemplateSelectionArtifact.id,
    inputFingerprint: artifact.locationTemplateSelectionArtifact.inputFingerprint,
    payloadFingerprint: artifact.locationTemplateSelectionArtifact.payloadFingerprint,
  },
  capacityCertificateRef: {
    id: artifact.capacityBoundSlotCertificateArtifact.id,
    inputFingerprint: artifact.capacityBoundSlotCertificateArtifact.inputFingerprint,
    payloadFingerprint: artifact.capacityBoundSlotCertificateArtifact.payloadFingerprint,
  },
});

const seedAuthorityArtifactPayload = (
  artifact: Omit<PatientSlotFillSeedAuthorityArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  coordinates: artifact.coordinates,
  templateSelectionSeed: artifact.templateSelectionSeed,
  patientGenerationSeed: artifact.patientGenerationSeed,
  selectedTemplateRef: artifact.selectedTemplateRef,
  selectedTemplateFingerprint: artifact.selectedTemplateFingerprint,
  occupancySnapshotArtifact: artifact.occupancySnapshotArtifact,
  localRepeatContext: artifact.localRepeatContext,
  locationTemplateSelectionArtifact: artifact.locationTemplateSelectionArtifact,
  capacityBoundSlotCertificateArtifact: artifact.capacityBoundSlotCertificateArtifact,
  inputFingerprint: artifact.inputFingerprint,
});

export const compilePatientSlotFillSeedAuthority = (
  value: unknown,
): PatientSlotFillSeedAuthorityCompileResult => {
  const parsed = PatientSlotFillSeedAuthorityCompileInputSchema.safeParse(value);
  if (!parsed.success) return failSeedAuthority('INVALID_INPUT', issuesText(parsed.error.issues));
  const input = parsed.data;
  const occupancy = verifyLocationPatientSlotOccupancySnapshotContext({
    artifact: input.occupancySnapshotArtifact,
    currentInput: input.currentOccupancyInput,
  });
  if (!occupancy.ok) {
    return failSeedAuthority(
      'INVALID_OCCUPANCY',
      `${occupancy.error.code}: ${occupancy.error.message}`,
      [input.occupancySnapshotArtifact.id],
    );
  }
  const matrix = verifyPatientTemplateLocationAdmissionMatrixContext({
    artifact: input.admissionMatrixArtifact,
    request: input.currentAdmissionMatrixRequest,
  });
  if (!matrix.ok) {
    return failSeedAuthority('INVALID_MATRIX', `${matrix.error.code}: ${matrix.error.message}`, [
      input.admissionMatrixArtifact.id,
    ]);
  }
  if (
    input.generationRoot.mode !== occupancy.value.mode ||
    input.generationRoot.mode !== matrix.value.compileRequest.templateHorizonArtifact.mode ||
    input.recentCompletionContext.mode !== occupancy.value.mode ||
    input.templateEligibilityOverlay.mode !== occupancy.value.mode
  ) {
    return failSeedAuthority(
      'MODE_CONTEXT_MISMATCH',
      'Generation root, exact occupancy, D-231/D-226 template horizon, completion history, and exact template-eligibility overlay must share one progression mode.',
      [input.generationRoot.id, occupancy.value.id, matrix.value.id],
    );
  }
  const target = occupancy.value.entries.find(
    (entry) => entry.capacityCoordinate.slotCoordinate.id === input.targetSlotCoordinateId,
  );
  if (target === undefined || target.status !== 'empty') {
    return failSeedAuthority(
      'TARGET_SLOT_NOT_EMPTY',
      'D-233 may create seed authority only for one exact currently empty authorized coordinate.',
      [occupancy.value.id, input.targetSlotCoordinateId],
    );
  }
  const nextEmptyCoordinateId = getFirstEmptyLocationPatientSlotCoordinateId(occupancy.value);
  if (nextEmptyCoordinateId !== input.targetSlotCoordinateId) {
    return failSeedAuthority(
      'TARGET_SLOT_NOT_NEXT_EMPTY',
      'D-233 fills exactly the first empty coordinate in the canonical location-owned slot order.',
      [
        occupancy.value.id,
        input.targetSlotCoordinateId,
        nextEmptyCoordinateId ?? occupancy.value.id,
      ],
    );
  }
  const location = matrix.value.compileRequest.locations.find(
    (entry) =>
      entry.id === occupancy.value.locationRef.id &&
      entry.contentVersion === occupancy.value.locationRef.contentVersion,
  );
  if (
    location === undefined ||
    fingerprintPatientTemplateLocationAdmissionLocation(location) !==
      occupancy.value.locationFingerprint ||
    input.distributionProfile.locationRef.id !== occupancy.value.locationRef.id ||
    input.distributionProfile.locationRef.contentVersion !==
      occupancy.value.locationRef.contentVersion ||
    input.distributionProfile.locationFingerprint !== occupancy.value.locationFingerprint ||
    input.recentCompletionContext.locationRef.id !== occupancy.value.locationRef.id ||
    input.recentCompletionContext.locationRef.contentVersion !==
      occupancy.value.locationRef.contentVersion
  ) {
    return failSeedAuthority(
      'LOCATION_CONTEXT_MISMATCH',
      'Occupancy, current admission matrix, distribution profile, and completion history must name one exact physical location.',
      [
        occupancy.value.id,
        matrix.value.id,
        input.distributionProfile.id,
        input.recentCompletionContext.id,
      ],
    );
  }
  const coordinates: PatientSlotFillSeedCoordinates = {
    schemaVersion: 1,
    modelVersion: 'patient-slot-fill-seed.v1',
    generationRootRef: generationRootReference(input.generationRoot),
    occupancySnapshotRef: {
      id: occupancy.value.id,
      inputFingerprint: occupancy.value.inputFingerprint,
      payloadFingerprint: occupancy.value.payloadFingerprint,
    },
    mode: occupancy.value.mode,
    locationRef: occupancy.value.locationRef,
    locationFingerprint: occupancy.value.locationFingerprint,
    slotCoordinateId: target.capacityCoordinate.slotCoordinate.id,
    fillOrdinal: target.nextFillOrdinal,
  };
  const derivedTemplateSelectionSeed = templateSelectionSeed(coordinates);
  const activeWaitingAssignments = occupancy.value.entries.flatMap((entry) =>
    entry.status === 'occupied'
      ? [
          {
            slotCoordinateId: entry.capacityCoordinate.slotCoordinate.id,
            templateId: entry.occupiedAssignment.templateRef.id,
          },
        ]
      : [],
  );
  const localRepeatContext = {
    schemaVersion: 1 as const,
    id: `location-template-repeat-context.d233.${hashToHex64(
      JSON.stringify(
        canonicalizeObjectKeys({
          occupancySnapshotId: occupancy.value.id,
          targetSlotCoordinateId: input.targetSlotCoordinateId,
          activeWaitingAssignments,
          recentCompletionContext: input.recentCompletionContext,
        }),
      ),
    )}`,
    locationRef: occupancy.value.locationRef,
    activeWaitingAssignments,
    recentCompletedTemplateIdsNewestFirst: [
      ...input.recentCompletionContext.recentCompletedTemplateIdsNewestFirst,
    ],
  };
  const selection = compileLocationTemplateSelection({
    schemaVersion: 1,
    id: `location-template-selection-request.d233.${hashToHex64(
      JSON.stringify(
        canonicalizeObjectKeys({
          coordinates,
          localRepeatContext,
          eligibilityOverlayId: input.templateEligibilityOverlay.id,
        }),
      ),
    )}`,
    seed: derivedTemplateSelectionSeed,
    slotCoordinate: {
      schemaVersion: target.capacityCoordinate.slotCoordinate.schemaVersion,
      id: target.capacityCoordinate.slotCoordinate.id,
      locationRef: target.capacityCoordinate.slotCoordinate.locationRef,
    },
    admissionMatrixArtifact: matrix.value,
    currentAdmissionMatrixRequest: input.currentAdmissionMatrixRequest,
    distributionProfile: input.distributionProfile,
    localRepeatContext,
    eligibilityOverlay: input.templateEligibilityOverlay,
  });
  if (!selection.ok) {
    return failSeedAuthority(
      'TEMPLATE_SELECTION_FAILED',
      `${selection.error.code}: ${selection.error.message}`,
      selection.error.contentIds,
    );
  }
  if (
    !sameCanonicalValue(selection.value.slotCoordinate, target.capacityCoordinate.slotCoordinate)
  ) {
    return failSeedAuthority(
      'LOCATION_CONTEXT_MISMATCH',
      'D-230 must retain the complete exact physical coordinate selected from the current occupancy snapshot.',
      [
        selection.value.id,
        selection.value.slotCoordinate.id,
        target.capacityCoordinate.slotCoordinate.id,
      ],
    );
  }
  const certificate = compileCapacityBoundLocationTemplateSelectionCertificate({
    schemaVersion: 1,
    id: `capacity-bound-location-template-selection-request.d233.${hashToHex64(
      JSON.stringify(
        canonicalizeObjectKeys({
          selectionId: selection.value.id,
          occupancySnapshotId: occupancy.value.id,
        }),
      ),
    )}`,
    locationTemplateSelectionArtifact: selection.value,
    capacityArtifact: input.currentOccupancyInput.capacityArtifact,
    currentCapacityRequest: input.currentOccupancyInput.currentCapacityRequest,
  });
  if (!certificate.ok) {
    return failSeedAuthority(
      'CAPACITY_CERTIFICATE_FAILED',
      `${certificate.error.code}: ${certificate.error.message}`,
      certificate.error.contentIds,
    );
  }
  if (
    !sameCanonicalValue(certificate.value.slotCoordinate, target.capacityCoordinate.slotCoordinate)
  ) {
    return failSeedAuthority(
      'CAPACITY_CERTIFICATE_FAILED',
      'D-232 must certify the complete exact physical coordinate selected from the current occupancy snapshot.',
      [
        certificate.value.id,
        certificate.value.slotCoordinate.id,
        target.capacityCoordinate.slotCoordinate.id,
      ],
    );
  }
  const binding =
    selection.value.locationOwnedPatientSlotSelectionArtifact
      .admittedTemplateLocationBindingArtifact;
  const derivedPatientGenerationSeed = patientGenerationSeed(
    coordinates,
    {
      id: binding.template.id,
      contentVersion: binding.template.contentVersion,
    },
    binding.templateFingerprint,
  );
  const partial = {
    requestId: input.id,
    coordinates,
    occupancySnapshotArtifact: occupancy.value,
    localRepeatContext,
    locationTemplateSelectionArtifact: selection.value,
    capacityBoundSlotCertificateArtifact: certificate.value,
  };
  const inputFingerprint = fingerprint('seed-authority-input', seedAuthorityInputPayload(partial));
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_SLOT_FILL_SEED_AUTHORITY_COMPILER_VERSION,
    requestId: input.id,
    coordinates,
    templateSelectionSeed: derivedTemplateSelectionSeed,
    patientGenerationSeed: derivedPatientGenerationSeed,
    selectedTemplateRef: {
      id: binding.template.id,
      contentVersion: binding.template.contentVersion,
    },
    selectedTemplateFingerprint: binding.templateFingerprint,
    occupancySnapshotArtifact: occupancy.value,
    localRepeatContext,
    locationTemplateSelectionArtifact: selection.value,
    capacityBoundSlotCertificateArtifact: certificate.value,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint(
    'seed-authority-payload',
    seedAuthorityArtifactPayload(withoutIdentity),
  );
  const output = PatientSlotFillSeedAuthorityArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `patient-slot-fill-seed-authority.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return failSeedAuthority('INVALID_OUTPUT', issuesText(output.error.issues), [
      occupancy.value.id,
      selection.value.id,
      certificate.value.id,
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyPatientSlotFillSeedAuthorityIntegrity = (
  value: unknown,
): PatientSlotFillSeedAuthorityIntegrityResult => {
  const parsed = PatientSlotFillSeedAuthorityArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (artifact.compilerVersion !== PATIENT_SLOT_FILL_SEED_AUTHORITY_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported patient-slot seed-authority compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const occupancy = verifyLocationPatientSlotOccupancySnapshotIntegrity(
    artifact.occupancySnapshotArtifact,
  );
  const selection = verifyLocationTemplateSelectionIntegrity(
    artifact.locationTemplateSelectionArtifact,
  );
  const certificate = verifyCapacityBoundLocationTemplateSelectionCertificateIntegrity(
    artifact.capacityBoundSlotCertificateArtifact,
  );
  if (!occupancy.ok) {
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_INTEGRITY_INVALID',
        message: occupancy.error.message,
      },
    };
  }
  if (!selection.ok) {
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_INTEGRITY_INVALID',
        message: selection.error.message,
      },
    };
  }
  if (!certificate.ok) {
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_INTEGRITY_INVALID',
        message: certificate.error.message,
      },
    };
  }
  const expectedTemplateSelectionSeed = templateSelectionSeed(artifact.coordinates);
  const expectedPatientGenerationSeed = patientGenerationSeed(
    artifact.coordinates,
    artifact.selectedTemplateRef,
    artifact.selectedTemplateFingerprint,
  );
  if (
    artifact.templateSelectionSeed !== expectedTemplateSelectionSeed ||
    artifact.patientGenerationSeed !== expectedPatientGenerationSeed
  ) {
    return {
      ok: false,
      error: {
        code: 'SEED_CONTEXT_MISMATCH',
        message:
          'The retained template-selection and patient-generation seeds do not match their exact domain-separated D-233 coordinates.',
      },
    };
  }
  const expectedInputFingerprint = fingerprint(
    'seed-authority-input',
    seedAuthorityInputPayload(artifact),
  );
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its compact seed-authority input.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint(
    'seed-authority-payload',
    seedAuthorityArtifactPayload(artifact),
  );
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `patient-slot-fill-seed-authority.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen seed-authority payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyPatientSlotFillSeedAuthorityContext = (input: {
  readonly artifact: unknown;
  readonly currentInput: unknown;
}): PatientSlotFillSeedAuthorityContextResult => {
  const integrity = verifyPatientSlotFillSeedAuthorityIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const replay = compilePatientSlotFillSeedAuthority(input.currentInput);
  if (!replay.ok || !sameCanonicalValue(replay.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: replay.ok
          ? 'The seed authority does not match the exact current generation root, occupancy, admission, capacity, distribution, and repeat context.'
          : `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  return { ok: true, value: integrity.value };
};
