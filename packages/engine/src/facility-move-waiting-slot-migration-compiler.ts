import {
  FacilityLocationSuccessorProfileSchema,
  FacilityMoveWaitingSlotMigrationArtifactSchema,
  FacilityMoveWaitingSlotMigrationCompileInputSchema,
  type AdmittedTemplateLocationBindingMatrixReference,
  type FacilityDefinition,
  type FacilityLocationSuccessorFingerprint,
  type FacilityLocationSuccessorProfile,
  type FacilityMoveProposedWaitingSlotMigration,
  type FacilityMoveWaitingSlotMigrationArtifact,
  type FacilityMoveWaitingSlotMigrationCompactRequest,
  type FacilityMoveWaitingSlotMigrationCompileInput,
  type FacilityMoveWaitingSlotMigrationDiagnostic,
  type FacilityMoveWaitingSlotMigrationDiagnosticCode,
  type FacilityMoveWaitingSlotMigrationEvaluation,
  type FrozenGeneratedWaitingSlot,
  type LocationDefinition,
  type LocationPatientSlotCapacityArtifact,
  type PatientTemplateLocationAdmissionMatrixArtifact,
} from '@psychsim/schemas';

import {
  compileAdmittedTemplateLocationBinding,
  verifyAdmittedTemplateLocationBindingIntegrity,
} from './admitted-template-location-binding-compiler';
import { verifyFindingPipelineAuditIntegrity } from './finding-pipeline-audit-composer';
import { verifyLocationPatientSlotCapacityContext } from './location-patient-slot-capacity-compiler';
import {
  fingerprintPatientTemplateLocationAdmissionLocation,
  verifyPatientTemplateLocationAdmissionMatrixContext,
} from './patient-template-location-admission-compiler';

export const FACILITY_MOVE_WAITING_SLOT_MIGRATION_COMPILER_VERSION = '3.0.0';

export type FacilityMoveWaitingSlotMigrationCompileResult =
  | { readonly ok: true; readonly value: FacilityMoveWaitingSlotMigrationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_INPUT'
          | 'SUCCESSOR_PROFILE_CONTEXT_MISMATCH'
          | 'TARGET_MATRIX_INVALID'
          | 'TARGET_CAPACITY_INVALID'
          | 'INVALID_WAITING_SLOT'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type FacilityMoveWaitingSlotMigrationIntegrityResult =
  | { readonly ok: true; readonly value: FacilityMoveWaitingSlotMigrationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'UPSTREAM_INTEGRITY_INVALID'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

export type FacilityMoveWaitingSlotMigrationContextResult =
  | { readonly ok: true; readonly value: FacilityMoveWaitingSlotMigrationArtifact }
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

const fingerprint = (scope: string, value: unknown): FacilityLocationSuccessorFingerprint =>
  `fingerprint.location-patient-slot-capacity.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const facilitySuccessionProjection = (facility: FacilityDefinition): unknown => ({
  schemaVersion: facility.schemaVersion,
  contentVersion: facility.contentVersion,
  id: facility.id,
  tier: facility.tier,
  locationIds: uniqueSorted(facility.locationIds),
  defaultLocationId: facility.defaultLocationId,
});

export const fingerprintFacilityLocationSuccessorFacility = (
  facility: FacilityDefinition,
): FacilityLocationSuccessorFingerprint =>
  fingerprint('facility', facilitySuccessionProjection(facility));

const normalizeSuccessorProfile = (
  profile: FacilityLocationSuccessorProfile,
): FacilityLocationSuccessorProfile => ({
  ...profile,
  mappings: [...profile.mappings].sort((left, right) =>
    compareStrings(left.sourceLocationRef.id, right.sourceLocationRef.id),
  ),
});

export const fingerprintFacilityLocationSuccessorProfile = (
  profile: FacilityLocationSuccessorProfile,
): FacilityLocationSuccessorFingerprint =>
  fingerprint('successor-profile', normalizeSuccessorProfile(profile));

const normalizeLocation = (location: LocationDefinition): LocationDefinition => ({
  ...location,
  capabilities: uniqueSorted(location.capabilities),
  dispositionIds: uniqueSorted(location.dispositionIds),
});

const normalizeInput = (
  input: FacilityMoveWaitingSlotMigrationCompileInput,
): FacilityMoveWaitingSlotMigrationCompileInput =>
  FacilityMoveWaitingSlotMigrationCompileInputSchema.parse({
    ...input,
    successorProfile: normalizeSuccessorProfile(input.successorProfile),
    sourceFacility: {
      ...input.sourceFacility,
      locationIds: uniqueSorted(input.sourceFacility.locationIds),
      allowedDepartmentIds: uniqueSorted(input.sourceFacility.allowedDepartmentIds),
      allowedUpgradeIds: uniqueSorted(input.sourceFacility.allowedUpgradeIds),
    },
    targetFacility: {
      ...input.targetFacility,
      locationIds: uniqueSorted(input.targetFacility.locationIds),
      allowedDepartmentIds: uniqueSorted(input.targetFacility.allowedDepartmentIds),
      allowedUpgradeIds: uniqueSorted(input.targetFacility.allowedUpgradeIds),
    },
    sourceLocations: [...input.sourceLocations]
      .map(normalizeLocation)
      .sort((left, right) => compareStrings(left.id, right.id)),
    targetLocations: [...input.targetLocations]
      .map(normalizeLocation)
      .sort((left, right) => compareStrings(left.id, right.id)),
    targetCapacityContexts: [...input.targetCapacityContexts].sort((left, right) =>
      compareStrings(left.capacityArtifact.locationRef.id, right.capacityArtifact.locationRef.id),
    ),
    frozenWaitingSlots: [...input.frozenWaitingSlots].sort((left, right) =>
      compareStrings(left.id, right.id),
    ),
  });

const matrixReference = (
  matrix: PatientTemplateLocationAdmissionMatrixArtifact,
): AdmittedTemplateLocationBindingMatrixReference => ({
  id: matrix.id,
  inputFingerprint: matrix.inputFingerprint,
  payloadFingerprint: matrix.payloadFingerprint,
});

const compactRequest = (
  input: FacilityMoveWaitingSlotMigrationCompileInput,
  targetMatrix: PatientTemplateLocationAdmissionMatrixArtifact,
  capacities: readonly LocationPatientSlotCapacityArtifact[],
): FacilityMoveWaitingSlotMigrationCompactRequest => ({
  schemaVersion: 1,
  id: input.id,
  successorProfile: input.successorProfile,
  targetAdmissionMatrixRef: matrixReference(targetMatrix),
  targetCapacityRefs: capacities
    .map((capacity) => ({
      locationRef: capacity.locationRef,
      artifactId: capacity.id,
      inputFingerprint: capacity.inputFingerprint,
      payloadFingerprint: capacity.payloadFingerprint,
    }))
    .sort((left, right) => compareStrings(left.locationRef.id, right.locationRef.id)),
  frozenWaitingSlots: input.frozenWaitingSlots,
});

const diagnostic = (input: {
  readonly code: FacilityMoveWaitingSlotMigrationDiagnosticCode;
  readonly waitingSlotId: string;
  readonly sourceLocationId: string;
  readonly successorLocationId: string | null;
  readonly message: string;
  readonly contentIds: readonly string[];
}): FacilityMoveWaitingSlotMigrationDiagnostic => ({
  schemaVersion: 1,
  id: `facility-move-waiting-slot-diagnostic.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(input)),
  )}`,
  code: input.code,
  waitingSlotId: input.waitingSlotId,
  sourceLocationId: input.sourceLocationId,
  successorLocationId: input.successorLocationId,
  message: input.message,
  contentIds: uniqueSorted(input.contentIds),
});

const artifactPayload = (
  artifact: Omit<FacilityMoveWaitingSlotMigrationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  status: artifact.status,
  successorProfileRef: artifact.successorProfileRef,
  successorProfileFingerprint: artifact.successorProfileFingerprint,
  slotEvaluations: artifact.slotEvaluations,
  diagnostics: artifact.diagnostics,
  committedMigrations: artifact.committedMigrations,
  migrationRequest: artifact.migrationRequest,
  inputFingerprint: artifact.inputFingerprint,
});

const fail = (
  code: Exclude<
    FacilityMoveWaitingSlotMigrationCompileResult,
    { readonly ok: true }
  >['error']['code'],
  message: string,
  contentIds: readonly string[] = [],
): FacilityMoveWaitingSlotMigrationCompileResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const exactLocationById = (
  locations: readonly LocationDefinition[],
): Map<string, LocationDefinition> => new Map(locations.map((location) => [location.id, location]));

const selectedTemplate = (slot: FrozenGeneratedWaitingSlot) => {
  const audit = slot.findingPipelineAuditArtifact;
  return audit.patientSlotFillSeedAuthorityArtifact.locationTemplateSelectionArtifact
    .locationOwnedPatientSlotSelectionArtifact.admittedTemplateLocationBindingArtifact;
};

const historicalFacility = (slot: FrozenGeneratedWaitingSlot): FacilityDefinition =>
  selectedTemplate(slot).operationalAdmissionArtifact.compileRequest
    .selectedLocationResourceArtifact.compileRequest.facility;

/**
 * Evaluates a complete facility transition without mutating a queue. Historical
 * D-233/D-230/D-232 generation and seed proof remains attached to each frozen patient. The
 * compiler only assigns a currently authorized successor coordinate and a new
 * D-228 binding for the exact already-selected template.
 */
export const compileFacilityMoveWaitingSlotMigration = (
  input: unknown,
): FacilityMoveWaitingSlotMigrationCompileResult => {
  const parsed = FacilityMoveWaitingSlotMigrationCompileInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_INPUT', issuesText(parsed.error.issues));
  }
  const request = normalizeInput(parsed.data);
  const profile = FacilityLocationSuccessorProfileSchema.parse(request.successorProfile);
  if (
    profile.sourceFacilityRef.id !== request.sourceFacility.id ||
    profile.sourceFacilityRef.contentVersion !== request.sourceFacility.contentVersion ||
    profile.targetFacilityRef.id !== request.targetFacility.id ||
    profile.targetFacilityRef.contentVersion !== request.targetFacility.contentVersion ||
    profile.sourceFacilityFingerprint !==
      fingerprintFacilityLocationSuccessorFacility(request.sourceFacility) ||
    profile.targetFacilityFingerprint !==
      fingerprintFacilityLocationSuccessorFacility(request.targetFacility)
  ) {
    return fail(
      'SUCCESSOR_PROFILE_CONTEXT_MISMATCH',
      'The facility succession profile does not pin the exact supplied source and target facility projections.',
      [profile.id, request.sourceFacility.id, request.targetFacility.id],
    );
  }

  const sourceLocations = exactLocationById(request.sourceLocations);
  const targetLocations = exactLocationById(request.targetLocations);
  if (
    uniqueSorted(request.sourceFacility.locationIds).join('\u0000') !==
      uniqueSorted([...sourceLocations.keys()]).join('\u0000') ||
    uniqueSorted(request.targetFacility.locationIds).join('\u0000') !==
      uniqueSorted([...targetLocations.keys()]).join('\u0000')
  ) {
    return fail(
      'SUCCESSOR_PROFILE_CONTEXT_MISMATCH',
      'Facility transition input requires every and only location definition declared by each exact facility.',
      [request.sourceFacility.id, request.targetFacility.id],
    );
  }
  for (const mapping of profile.mappings) {
    const source = sourceLocations.get(mapping.sourceLocationRef.id);
    const target = targetLocations.get(mapping.successorLocationRef.id);
    if (
      source === undefined ||
      source.contentVersion !== mapping.sourceLocationRef.contentVersion ||
      mapping.sourceLocationFingerprint !==
        fingerprintPatientTemplateLocationAdmissionLocation(source) ||
      (target !== undefined &&
        (target.contentVersion !== mapping.successorLocationRef.contentVersion ||
          mapping.successorLocationFingerprint !==
            fingerprintPatientTemplateLocationAdmissionLocation(target) ||
          source.careSetting !== target.careSetting))
    ) {
      return fail(
        'SUCCESSOR_PROFILE_CONTEXT_MISMATCH',
        'Each declared successor mapping must pin exact source/target locations with the same care setting.',
        [profile.id, mapping.id],
      );
    }
  }

  const targetMatrixContext = verifyPatientTemplateLocationAdmissionMatrixContext({
    artifact: request.targetAdmissionMatrixArtifact,
    request: request.currentTargetAdmissionMatrixRequest,
  });
  if (!targetMatrixContext.ok) {
    return fail(
      'TARGET_MATRIX_INVALID',
      `${targetMatrixContext.error.code}: ${targetMatrixContext.error.message}`,
      [request.targetAdmissionMatrixArtifact.id],
    );
  }
  const targetMatrix = targetMatrixContext.value;
  if (
    targetMatrix.compileRequest.facility.id !== request.targetFacility.id ||
    targetMatrix.compileRequest.facility.contentVersion !== request.targetFacility.contentVersion ||
    !sameCanonicalValue(targetMatrix.compileRequest.facility, request.targetFacility) ||
    !sameCanonicalValue(targetMatrix.compileRequest.locations, request.targetLocations)
  ) {
    return fail(
      'TARGET_MATRIX_INVALID',
      'The current D-226 matrix must describe the exact target facility and target-location horizon.',
      [targetMatrix.id, request.targetFacility.id],
    );
  }

  const targetCapacities: LocationPatientSlotCapacityArtifact[] = [];
  for (const context of request.targetCapacityContexts) {
    const capacity = verifyLocationPatientSlotCapacityContext({
      artifact: context.capacityArtifact,
      currentRequest: context.currentCapacityRequest,
    });
    if (!capacity.ok) {
      return fail('TARGET_CAPACITY_INVALID', `${capacity.error.code}: ${capacity.error.message}`, [
        context.capacityArtifact.id,
      ]);
    }
    targetCapacities.push(capacity.value);
  }
  if (
    uniqueSorted(targetCapacities.map((capacity) => capacity.locationRef.id)).join('\u0000') !==
    uniqueSorted([...targetLocations.keys()]).join('\u0000')
  ) {
    return fail(
      'TARGET_CAPACITY_INVALID',
      'The move requires one current capacity artifact for every and only target location.',
      [request.targetFacility.id, ...targetCapacities.map((capacity) => capacity.id)],
    );
  }
  const appliedCapacityUpgradeIds = targetCapacities.flatMap((capacity) =>
    capacity.upgradeEvaluations.flatMap((evaluation) =>
      evaluation.applied ? [evaluation.contribution.upgradeRef.id] : [],
    ),
  );
  if (new Set(appliedCapacityUpgradeIds).size !== appliedCapacityUpgradeIds.length) {
    return fail(
      'TARGET_CAPACITY_INVALID',
      'One capacity-upgrade identity cannot contribute to more than one target location.',
      appliedCapacityUpgradeIds,
    );
  }

  const waitingSlots: FrozenGeneratedWaitingSlot[] = [];
  for (const slot of request.frozenWaitingSlots) {
    const audit = verifyFindingPipelineAuditIntegrity(slot.findingPipelineAuditArtifact);
    if (!audit.ok || audit.value.status !== 'compiled' || audit.value.catalogSnapshot === null) {
      return fail(
        'INVALID_WAITING_SLOT',
        audit.ok
          ? 'A waiting slot must retain one compiled D-200 patient snapshot.'
          : `${audit.error.code}: ${audit.error.message}`,
        [slot.id, slot.findingPipelineAuditArtifact.id],
      );
    }
    const binding =
      audit.value.patientSlotFillSeedAuthorityArtifact.locationTemplateSelectionArtifact
        .locationOwnedPatientSlotSelectionArtifact.admittedTemplateLocationBindingArtifact;
    const source = sourceLocations.get(binding.location.id);
    if (
      source === undefined ||
      source.contentVersion !== binding.location.contentVersion ||
      fingerprintPatientTemplateLocationAdmissionLocation(source) !== binding.locationFingerprint ||
      !sameCanonicalValue(historicalFacility(slot), request.sourceFacility)
    ) {
      return fail(
        'INVALID_WAITING_SLOT',
        'A frozen waiting slot must originate from the exact supplied source facility and one of its exact locations.',
        [slot.id, binding.location.id, historicalFacility(slot).id, request.sourceFacility.id],
      );
    }
    waitingSlots.push({
      schemaVersion: slot.schemaVersion,
      id: slot.id,
      findingPipelineAuditArtifact: audit.value,
    });
  }

  const mappingBySourceId = new Map(
    profile.mappings.map((mapping) => [mapping.sourceLocationRef.id, mapping]),
  );
  const capacityByLocationId = new Map(
    targetCapacities.map((capacity) => [capacity.locationRef.id, capacity]),
  );
  const availableCoordinateIdsByLocation = new Map(
    targetCapacities.map((capacity) => [
      capacity.locationRef.id,
      capacity.slotCoordinates
        .map((coordinate) => coordinate.slotCoordinate.id)
        .sort(compareStrings),
    ]),
  );
  const coordinateById = new Map(
    targetCapacities.flatMap((capacity) =>
      capacity.slotCoordinates.map(
        (coordinate) =>
          [
            coordinate.slotCoordinate.id,
            {
              coordinate,
              capacity,
            },
          ] as const,
      ),
    ),
  );
  const usedCoordinateIds = new Set<string>();

  const allocationBySlotId = new Map<string, string>();
  for (const slot of waitingSlots) {
    const audit = slot.findingPipelineAuditArtifact;
    const sourceCoordinate =
      audit.patientSlotFillSeedAuthorityArtifact.capacityBoundSlotCertificateArtifact
        .slotCoordinate;
    const mapping = mappingBySourceId.get(sourceCoordinate.locationRef.id);
    if (mapping === undefined) continue;
    const targetCoordinateIds =
      availableCoordinateIdsByLocation.get(mapping.successorLocationRef.id) ?? [];
    if (
      sourceCoordinate.locationRef.id === mapping.successorLocationRef.id &&
      sourceCoordinate.locationRef.contentVersion === mapping.successorLocationRef.contentVersion &&
      targetCoordinateIds.includes(sourceCoordinate.id) &&
      !usedCoordinateIds.has(sourceCoordinate.id)
    ) {
      allocationBySlotId.set(slot.id, sourceCoordinate.id);
      usedCoordinateIds.add(sourceCoordinate.id);
    }
  }
  for (const slot of waitingSlots) {
    if (allocationBySlotId.has(slot.id)) continue;
    const sourceCoordinate =
      slot.findingPipelineAuditArtifact.patientSlotFillSeedAuthorityArtifact
        .capacityBoundSlotCertificateArtifact.slotCoordinate;
    const mapping = mappingBySourceId.get(sourceCoordinate.locationRef.id);
    if (mapping === undefined) continue;
    const targetCoordinateId = (
      availableCoordinateIdsByLocation.get(mapping.successorLocationRef.id) ?? []
    ).find((coordinateId) => !usedCoordinateIds.has(coordinateId));
    if (targetCoordinateId !== undefined) {
      allocationBySlotId.set(slot.id, targetCoordinateId);
      usedCoordinateIds.add(targetCoordinateId);
    }
  }

  const evaluations: FacilityMoveWaitingSlotMigrationEvaluation[] = [];
  for (const slot of waitingSlots) {
    const audit = slot.findingPipelineAuditArtifact;
    const sourceCoordinate =
      audit.patientSlotFillSeedAuthorityArtifact.capacityBoundSlotCertificateArtifact
        .slotCoordinate;
    const binding = selectedTemplate(slot);
    const mapping = mappingBySourceId.get(sourceCoordinate.locationRef.id);
    const diagnostics: FacilityMoveWaitingSlotMigrationDiagnostic[] = [];
    let proposedMigration: FacilityMoveProposedWaitingSlotMigration | null = null;
    if (mapping === undefined) {
      diagnostics.push(
        diagnostic({
          code: 'successor_mapping_missing',
          waitingSlotId: slot.id,
          sourceLocationId: sourceCoordinate.locationRef.id,
          successorLocationId: null,
          message:
            'The occupied source location has no explicit successor; the complete facility move is blocked.',
          contentIds: [slot.id, sourceCoordinate.locationRef.id, profile.id],
        }),
      );
    } else {
      const targetLocation = targetLocations.get(mapping.successorLocationRef.id);
      const targetCapacity = capacityByLocationId.get(mapping.successorLocationRef.id);
      if (targetLocation === undefined || targetCapacity === undefined) {
        diagnostics.push(
          diagnostic({
            code: 'successor_location_not_built',
            waitingSlotId: slot.id,
            sourceLocationId: sourceCoordinate.locationRef.id,
            successorLocationId: mapping.successorLocationRef.id,
            message:
              'The declared successor is not a currently built target location with a current capacity artifact.',
            contentIds: [slot.id, mapping.id, mapping.successorLocationRef.id],
          }),
        );
      } else {
        const targetCoordinateId = allocationBySlotId.get(slot.id);
        const targetCoordinateEntry =
          targetCoordinateId === undefined ? undefined : coordinateById.get(targetCoordinateId);
        if (targetCoordinateEntry === undefined) {
          diagnostics.push(
            diagnostic({
              code: 'target_capacity_exhausted',
              waitingSlotId: slot.id,
              sourceLocationId: sourceCoordinate.locationRef.id,
              successorLocationId: targetLocation.id,
              message: `Successor ${targetLocation.id} has ${targetCapacity.totalSlotCount} available patient slots, which is insufficient for every mapped frozen patient.`,
              contentIds: [slot.id, targetLocation.id, targetCapacity.id],
            }),
          );
        }
        const targetAdmission = targetMatrix.admissionEvaluations.find(
          (evaluation) =>
            evaluation.templateRef.id === binding.template.id &&
            evaluation.templateRef.contentVersion === binding.template.contentVersion &&
            evaluation.templateFingerprint === binding.templateFingerprint &&
            evaluation.locationRef.id === targetLocation.id &&
            evaluation.locationRef.contentVersion === targetLocation.contentVersion &&
            evaluation.status === 'admitted' &&
            evaluation.diagnostics.length === 0 &&
            evaluation.operationalAdmissionArtifact?.status === 'complete',
        );
        if (targetAdmission === undefined) {
          diagnostics.push(
            diagnostic({
              code: 'template_not_admitted_at_successor',
              waitingSlotId: slot.id,
              sourceLocationId: sourceCoordinate.locationRef.id,
              successorLocationId: targetLocation.id,
              message:
                'The exact frozen template version/fingerprint is not currently admitted at its declared successor.',
              contentIds: [slot.id, binding.template.id, targetLocation.id, targetMatrix.id],
            }),
          );
        }
        if (targetCoordinateEntry !== undefined && targetAdmission !== undefined) {
          const targetBinding = compileAdmittedTemplateLocationBinding({
            schemaVersion: 1,
            id: `admitted-binding-request.d232.${hashToHex64(
              JSON.stringify(
                canonicalizeObjectKeys({
                  migrationRequestId: request.id,
                  waitingSlotId: slot.id,
                  targetAdmissionEvaluationId: targetAdmission.id,
                }),
              ),
            )}`,
            admissionMatrixArtifact: targetMatrix,
            currentAdmissionMatrixRequest: request.currentTargetAdmissionMatrixRequest,
            admissionEvaluationId: targetAdmission.id,
          });
          if (!targetBinding.ok) {
            return fail(
              'TARGET_MATRIX_INVALID',
              `${targetBinding.error.code}: ${targetBinding.error.message}`,
              targetBinding.error.contentIds,
            );
          }
          const patientInstance = audit.catalogSnapshot?.patientInstance;
          if (patientInstance === undefined) {
            return fail(
              'INVALID_WAITING_SLOT',
              'A compiled waiting slot unexpectedly lacks its frozen patient instance.',
              [slot.id, audit.id],
            );
          }
          proposedMigration = {
            schemaVersion: 1,
            id: slot.id,
            sourceSlotCoordinate: sourceCoordinate,
            targetSlotCoordinate: targetCoordinateEntry.coordinate.slotCoordinate,
            patientInstance,
            historicalFindingPipelineAuditRef: {
              id: audit.id,
              payloadFingerprint: audit.payloadFingerprint,
            },
            historicalPatientSlotFillSeedAuthorityArtifact:
              audit.patientSlotFillSeedAuthorityArtifact,
            targetCapacityArtifactRef: {
              locationRef: targetCoordinateEntry.capacity.locationRef,
              artifactId: targetCoordinateEntry.capacity.id,
              inputFingerprint: targetCoordinateEntry.capacity.inputFingerprint,
              payloadFingerprint: targetCoordinateEntry.capacity.payloadFingerprint,
            },
            targetCapacityAuthorization: targetCoordinateEntry.coordinate.authorization,
            targetAdmittedTemplateLocationBindingArtifact: targetBinding.value,
          };
        }
      }
    }
    evaluations.push({
      schemaVersion: 1,
      waitingSlotId: slot.id,
      sourceLocationRef: sourceCoordinate.locationRef,
      successorLocationRef: mapping?.successorLocationRef ?? null,
      status: diagnostics.length === 0 && proposedMigration !== null ? 'ready' : 'blocked',
      diagnostics,
      proposedMigration,
    });
  }
  const diagnostics = evaluations.flatMap((evaluation) => evaluation.diagnostics);
  const allReady = evaluations.every((evaluation) => evaluation.status === 'ready');
  const migrationRequest = compactRequest(request, targetMatrix, targetCapacities);
  const inputFingerprint = fingerprint('migration-input', migrationRequest);
  const committedMigrations = allReady
    ? evaluations.flatMap((evaluation) =>
        evaluation.proposedMigration === null ? [] : [evaluation.proposedMigration],
      )
    : [];
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: FACILITY_MOVE_WAITING_SLOT_MIGRATION_COMPILER_VERSION,
    requestId: migrationRequest.id,
    status: allReady ? ('ready_to_commit' as const) : ('blocked' as const),
    successorProfileRef: {
      id: profile.id,
      contentVersion: profile.contentVersion,
    },
    successorProfileFingerprint: fingerprintFacilityLocationSuccessorProfile(profile),
    slotEvaluations: evaluations,
    diagnostics,
    committedMigrations,
    migrationRequest,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('migration-payload', artifactPayload(withoutIdentity));
  const output = FacilityMoveWaitingSlotMigrationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `facility-move-waiting-slot-migration.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
      profile.id,
      targetMatrix.id,
      ...waitingSlots.map((slot) => slot.id),
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyFacilityMoveWaitingSlotMigrationIntegrity = (
  value: unknown,
): FacilityMoveWaitingSlotMigrationIntegrityResult => {
  const parsed = FacilityMoveWaitingSlotMigrationArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (artifact.compilerVersion !== FACILITY_MOVE_WAITING_SLOT_MIGRATION_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported facility-move migration compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  for (const slot of artifact.migrationRequest.frozenWaitingSlots) {
    const audit = verifyFindingPipelineAuditIntegrity(slot.findingPipelineAuditArtifact);
    if (!audit.ok) {
      return {
        ok: false,
        error: {
          code: 'UPSTREAM_INTEGRITY_INVALID',
          message: `${audit.error.code}: ${audit.error.message}`,
        },
      };
    }
  }
  for (const proposal of artifact.slotEvaluations.flatMap((evaluation) =>
    evaluation.proposedMigration === null ? [] : [evaluation.proposedMigration],
  )) {
    const binding = verifyAdmittedTemplateLocationBindingIntegrity(
      proposal.targetAdmittedTemplateLocationBindingArtifact,
    );
    if (!binding.ok) {
      return {
        ok: false,
        error: {
          code: 'UPSTREAM_INTEGRITY_INVALID',
          message: `${binding.error.code}: ${binding.error.message}`,
        },
      };
    }
  }
  const expectedInputFingerprint = fingerprint('migration-input', artifact.migrationRequest);
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its compact facility-move request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('migration-payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `facility-move-waiting-slot-migration.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its atomic migration payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyFacilityMoveWaitingSlotMigrationContext = (input: {
  readonly artifact: unknown;
  readonly currentInput: unknown;
}): FacilityMoveWaitingSlotMigrationContextResult => {
  const integrity = verifyFacilityMoveWaitingSlotMigrationIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const replay = compileFacilityMoveWaitingSlotMigration(input.currentInput);
  if (!replay.ok || !sameCanonicalValue(replay.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message:
          'The facility-move artifact does not match the exact current successor profile, target admission/capacity contexts, and frozen waiting patients.',
      },
    };
  }
  return { ok: true, value: integrity.value };
};
