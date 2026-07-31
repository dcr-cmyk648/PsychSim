import {
  SelectedLocationOperationalResourceContextArtifactSchema,
  SelectedLocationOperationalResourceContextRequestSchema,
  type ClinicLocationResourceAssignmentHorizon,
  type ClinicOperationalContext,
  type ClinicState,
  type FacilityDefinition,
  type LocationDefinition,
  type SelectedLocationOperationalFormularyOwner,
  type SelectedLocationOperationalResourceContextArtifact,
  type SelectedLocationOperationalResourceContextRequest,
  type SelectedLocationOperationalResourceDiagnostic,
  type SelectedLocationOperationalResourceFingerprint,
  type SelectedLocationOperationalUpgradeOwner,
  type SelectedLocationOperationalUpgradeReference,
  type SelectedLocationResourceAssignment,
} from '@psychsim/schemas';

export const SELECTED_LOCATION_OPERATIONAL_RESOURCE_COMPILER_VERSION = '3.0.0';

export type SelectedLocationOperationalResourceCompileErrorCode =
  | 'INVALID_REQUEST'
  | 'CONTEXT_MISMATCH'
  | 'INVALID_OUTPUT';

export type SelectedLocationOperationalResourceCompileResult =
  | {
      readonly ok: true;
      readonly value: SelectedLocationOperationalResourceContextArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: SelectedLocationOperationalResourceCompileErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type SelectedLocationOperationalResourceIntegrityResult =
  | {
      readonly ok: true;
      readonly value: SelectedLocationOperationalResourceContextArtifact;
    }
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

export type SelectedLocationOperationalResourceContextResult =
  | {
      readonly ok: true;
      readonly value: SelectedLocationOperationalResourceContextArtifact;
    }
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

const fingerprint = (
  scope: string,
  value: unknown,
): SelectedLocationOperationalResourceFingerprint =>
  `fingerprint.selected-location-operational-resource.${scope}.fnv1a64.${hashToHex64(
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

const normalizeClinicOperationalContext = (
  context: ClinicOperationalContext,
): ClinicOperationalContext => ({
  ...context,
  locationIds: uniqueSorted(context.locationIds),
  departmentIds: uniqueSorted(context.departmentIds),
  ownedUpgradeIds: uniqueSorted(context.ownedUpgradeIds),
  ownedEquipmentIds: uniqueSorted(context.ownedEquipmentIds),
  staffConfigurations: [...context.staffConfigurations]
    .map((configuration) => ({
      ...configuration,
      // Preserve duplicates so invalid caller state cannot normalize into validity.
      automaticInformationActionIds: [...configuration.automaticInformationActionIds].sort(
        compareStrings,
      ),
    }))
    .sort((left, right) =>
      compareStrings(
        `${left.staffUpgradeId}\u0000${left.automaticInformationActionIds.join('\u0000')}`,
        `${right.staffUpgradeId}\u0000${right.automaticInformationActionIds.join('\u0000')}`,
      ),
    ),
  formularyIds: uniqueSorted(context.formularyIds),
});

export const projectClinicOperationalContext = (
  clinicState: ClinicState,
): ClinicOperationalContext =>
  normalizeClinicOperationalContext({
    schemaVersion: clinicState.schemaVersion,
    modelVersion: 'clinic-operational-context.v1',
    clinicStateId: clinicState.id,
    facilityId: clinicState.facilityId,
    facilityTier: clinicState.facilityTier,
    locationIds: clinicState.locationIds,
    departmentIds: clinicState.departmentIds,
    ownedUpgradeIds: clinicState.ownedUpgradeIds,
    ownedEquipmentIds: clinicState.ownedEquipmentIds,
    staffConfigurations: clinicState.staffConfigurations,
    formularyIds: clinicState.formularyIds,
  });

const normalizeFacility = (facility: FacilityDefinition): FacilityDefinition => ({
  ...facility,
  locationIds: uniqueSorted(facility.locationIds),
  allowedDepartmentIds: uniqueSorted(facility.allowedDepartmentIds),
  allowedUpgradeIds: uniqueSorted(facility.allowedUpgradeIds),
});

const normalizeLocation = (location: LocationDefinition): LocationDefinition => ({
  ...location,
  capabilities: uniqueSorted(location.capabilities),
  dispositionIds: uniqueSorted(location.dispositionIds),
});

const normalizeAssignment = (
  assignment: SelectedLocationResourceAssignment,
): SelectedLocationResourceAssignment => ({
  ...assignment,
  assignedUpgradeRefs: sortById(assignment.assignedUpgradeRefs),
  assignedFormularyRefs: sortById(assignment.assignedFormularyRefs),
});

const normalizeAssignmentHorizon = (
  horizon: ClinicLocationResourceAssignmentHorizon,
): ClinicLocationResourceAssignmentHorizon => ({
  ...horizon,
  assignments: [...horizon.assignments]
    .map(normalizeAssignment)
    .sort((left, right) =>
      compareStrings(
        `${left.locationRef.id}\u0000${left.id}`,
        `${right.locationRef.id}\u0000${right.id}`,
      ),
    ),
});

const normalizeUpgradeOwner = (
  owner: SelectedLocationOperationalUpgradeOwner,
): SelectedLocationOperationalUpgradeOwner => ({
  ...owner,
  allowedFacilityTiers: [...owner.allowedFacilityTiers].sort(compareStrings),
  grantsCapabilities: uniqueSorted(owner.grantsCapabilities),
  grantsFormularyIds: uniqueSorted(owner.grantsFormularyIds),
  staffAutomation:
    owner.staffAutomation === null
      ? null
      : {
          ...owner.staffAutomation,
          eligibleInformationActionIds: uniqueSorted(
            owner.staffAutomation.eligibleInformationActionIds,
          ),
        },
});

const normalizeFormularyOwners = (
  owners: readonly SelectedLocationOperationalFormularyOwner[],
): SelectedLocationOperationalFormularyOwner[] =>
  sortById(
    owners.map((owner) => ({
      schemaVersion: owner.schemaVersion,
      contentVersion: owner.contentVersion,
      id: owner.id,
      medicationIds: uniqueSorted(owner.medicationIds),
    })),
  );

export const normalizeSelectedLocationOperationalResourceContextRequest = (
  request: SelectedLocationOperationalResourceContextRequest,
): SelectedLocationOperationalResourceContextRequest =>
  SelectedLocationOperationalResourceContextRequestSchema.parse({
    ...request,
    clinicOperationalContext: normalizeClinicOperationalContext(request.clinicOperationalContext),
    facility: normalizeFacility(request.facility),
    selectedLocation: normalizeLocation(request.selectedLocation),
    assignmentHorizon: normalizeAssignmentHorizon(request.assignmentHorizon),
    upgradeOwners: sortById(request.upgradeOwners.map(normalizeUpgradeOwner)),
    formularyOwners: normalizeFormularyOwners(request.formularyOwners),
  });

const artifactPayload = (
  artifact: Omit<SelectedLocationOperationalResourceContextArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  status: artifact.status,
  clinicStateId: artifact.clinicStateId,
  clinicOperationalContextFingerprint: artifact.clinicOperationalContextFingerprint,
  facilityRef: artifact.facilityRef,
  locationRef: artifact.locationRef,
  assignmentHorizonRef: artifact.assignmentHorizonRef,
  selectedAssignmentRef: artifact.selectedAssignmentRef,
  careSetting: artifact.careSetting,
  baselineCapabilityIds: artifact.baselineCapabilityIds,
  assignedUpgradeRefs: artifact.assignedUpgradeRefs,
  effectiveCapabilityIds: artifact.effectiveCapabilityIds,
  effectiveFormularyRefs: artifact.effectiveFormularyRefs,
  staffContexts: artifact.staffContexts,
  diagnostics: artifact.diagnostics,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

const fail = (
  code: SelectedLocationOperationalResourceCompileErrorCode,
  message: string,
  contentIds: readonly string[],
): SelectedLocationOperationalResourceCompileResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const makeDiagnostic = (
  code: SelectedLocationOperationalResourceDiagnostic['code'],
  itemId: string,
  message: string,
  contentIds: readonly string[],
): SelectedLocationOperationalResourceDiagnostic => ({
  id: stableId('selected-location-operational-resource-diagnostic', {
    code,
    itemId,
    contentIds: uniqueSorted(contentIds),
  }),
  code,
  itemId,
  message,
  contentIds: uniqueSorted(contentIds),
});

export const fingerprintClinicOperationalContext = (
  context: ClinicOperationalContext,
): SelectedLocationOperationalResourceFingerprint =>
  fingerprint('clinic-operational-context', normalizeClinicOperationalContext(context));

export const fingerprintSelectedLocationFacility = (
  facility: FacilityDefinition,
): SelectedLocationOperationalResourceFingerprint =>
  fingerprint('facility', normalizeFacility(facility));

export const fingerprintSelectedLocationDefinition = (
  location: LocationDefinition,
): SelectedLocationOperationalResourceFingerprint =>
  fingerprint('location', normalizeLocation(location));

export const fingerprintSelectedLocationResourceAssignment = (
  assignment: SelectedLocationResourceAssignment,
): SelectedLocationOperationalResourceFingerprint =>
  fingerprint('assignment', normalizeAssignment(assignment));

export const fingerprintClinicLocationResourceAssignmentHorizon = (
  horizon: ClinicLocationResourceAssignmentHorizon,
): SelectedLocationOperationalResourceFingerprint =>
  fingerprint('assignment-horizon', normalizeAssignmentHorizon(horizon));

export const fingerprintSelectedLocationUpgradeOwner = (
  owner: SelectedLocationOperationalUpgradeOwner,
): SelectedLocationOperationalResourceFingerprint =>
  fingerprint('upgrade-owner', normalizeUpgradeOwner(owner));

export const fingerprintSelectedLocationFormularyOwner = (
  owner: SelectedLocationOperationalFormularyOwner,
): SelectedLocationOperationalResourceFingerprint =>
  fingerprint('formulary-owner', normalizeFormularyOwners([owner])[0]);

const upgradeReferenceFor = (
  owner: SelectedLocationOperationalUpgradeOwner,
): SelectedLocationOperationalUpgradeReference => ({
  id: owner.id,
  contentVersion: owner.contentVersion,
  kind: owner.kind,
  fingerprint: fingerprintSelectedLocationUpgradeOwner(owner),
});

const matchesUpgradeReference = (
  owner: SelectedLocationOperationalUpgradeOwner,
  reference: SelectedLocationOperationalUpgradeReference,
): boolean =>
  reference.id === owner.id &&
  reference.contentVersion === owner.contentVersion &&
  reference.kind === owner.kind &&
  reference.fingerprint === fingerprintSelectedLocationUpgradeOwner(owner);

export const compileSelectedLocationOperationalResourceContext = (
  value: unknown,
): SelectedLocationOperationalResourceCompileResult => {
  const parsed = SelectedLocationOperationalResourceContextRequestSchema.safeParse(value);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }
  const request = normalizeSelectedLocationOperationalResourceContextRequest(parsed.data);
  const { clinicOperationalContext, facility, selectedLocation, assignmentHorizon } = request;
  const selectedAssignment = assignmentHorizon.assignments.find(
    (assignment) =>
      assignment.locationRef.id === selectedLocation.id &&
      assignment.locationRef.contentVersion === selectedLocation.contentVersion,
  );

  if (
    clinicOperationalContext.facilityId !== facility.id ||
    clinicOperationalContext.facilityTier !== facility.tier ||
    selectedLocation.facilityTier !== facility.tier ||
    !facility.locationIds.includes(selectedLocation.id) ||
    !clinicOperationalContext.locationIds.includes(selectedLocation.id) ||
    assignmentHorizon.clinicStateId !== clinicOperationalContext.clinicStateId ||
    selectedAssignment === undefined ||
    (selectedLocation.departmentId !== undefined &&
      (!clinicOperationalContext.departmentIds.includes(selectedLocation.departmentId) ||
        !facility.allowedDepartmentIds.includes(selectedLocation.departmentId)))
  ) {
    return fail(
      'CONTEXT_MISMATCH',
      'The resource request must pin one exact clinic, facility, built location, assignment horizon, selected assignment, and optional department context.',
      [
        clinicOperationalContext.clinicStateId,
        facility.id,
        selectedLocation.id,
        assignmentHorizon.id,
        ...(selectedLocation.departmentId ? [selectedLocation.departmentId] : []),
      ],
    );
  }

  const inputFingerprint = fingerprint('input', request);
  const diagnostics: SelectedLocationOperationalResourceDiagnostic[] = [];
  const invalidUpgradeIds = new Set<string>();
  const invalidFormularyIds = new Set<string>();
  const upgradeOwners = new Map(request.upgradeOwners.map((owner) => [owner.id, owner]));
  const formularyOwners = new Map(request.formularyOwners.map((owner) => [owner.id, owner]));
  const ownedUpgradeIds = new Set(clinicOperationalContext.ownedUpgradeIds);
  const ownedEquipmentIds = new Set(clinicOperationalContext.ownedEquipmentIds);
  const ownedFormularyIds = new Set(clinicOperationalContext.formularyIds);

  const horizonLocationIds = assignmentHorizon.assignments
    .map((assignment) => assignment.locationRef.id)
    .sort(compareStrings);
  if (
    horizonLocationIds.join('\u0000') !==
      [...clinicOperationalContext.locationIds].sort(compareStrings).join('\u0000') ||
    clinicOperationalContext.locationIds.some(
      (locationId) => !facility.locationIds.includes(locationId),
    )
  ) {
    diagnostics.push(
      makeDiagnostic(
        'assignment_horizon_incomplete',
        assignmentHorizon.id,
        'The clinic assignment horizon must contain exactly one assignment for every built clinic location.',
        [
          clinicOperationalContext.clinicStateId,
          assignmentHorizon.id,
          ...clinicOperationalContext.locationIds,
          ...horizonLocationIds,
        ],
      ),
    );
  }

  const referencesByUpgradeId = new Map<
    string,
    Array<{
      readonly assignmentId: string;
      readonly locationId: string;
      readonly reference: SelectedLocationOperationalUpgradeReference;
    }>
  >();
  for (const assignment of assignmentHorizon.assignments) {
    for (const reference of assignment.assignedUpgradeRefs) {
      const current = referencesByUpgradeId.get(reference.id) ?? [];
      current.push({
        assignmentId: assignment.id,
        locationId: assignment.locationRef.id,
        reference,
      });
      referencesByUpgradeId.set(reference.id, current);
    }
  }

  for (const [upgradeId, references] of referencesByUpgradeId) {
    const owner = upgradeOwners.get(upgradeId);
    if (!owner) {
      diagnostics.push(
        makeDiagnostic(
          'upgrade_owner_missing',
          upgradeId,
          `${upgradeId} has no exact operational upgrade owner.`,
          [
            assignmentHorizon.id,
            upgradeId,
            ...references.map((reference) => reference.assignmentId),
          ],
        ),
      );
      invalidUpgradeIds.add(upgradeId);
      continue;
    }
    if (references.some((reference) => !matchesUpgradeReference(owner, reference.reference))) {
      diagnostics.push(
        makeDiagnostic(
          'upgrade_owner_mismatch',
          upgradeId,
          `${upgradeId} does not match every versioned and fingerprinted assignment reference.`,
          [
            assignmentHorizon.id,
            upgradeId,
            ...references.map((reference) => reference.assignmentId),
          ],
        ),
      );
      invalidUpgradeIds.add(upgradeId);
    }
    if (
      owner.locationAssignmentMode === 'exclusive_location' &&
      new Set(references.map((reference) => reference.locationId)).size > 1
    ) {
      diagnostics.push(
        makeDiagnostic(
          'upgrade_assignment_conflict',
          upgradeId,
          `${upgradeId} is exclusive to one location but appears in multiple location assignments.`,
          [assignmentHorizon.id, upgradeId, ...references.map((reference) => reference.locationId)],
        ),
      );
      invalidUpgradeIds.add(upgradeId);
    }
    if (!ownedUpgradeIds.has(upgradeId)) {
      diagnostics.push(
        makeDiagnostic(
          'upgrade_not_owned',
          upgradeId,
          `${upgradeId} is assigned to a location but is not owned by this clinic.`,
          [clinicOperationalContext.clinicStateId, assignmentHorizon.id, upgradeId],
        ),
      );
      invalidUpgradeIds.add(upgradeId);
    }
    if (owner.kind === 'equipment' && !ownedEquipmentIds.has(upgradeId)) {
      diagnostics.push(
        makeDiagnostic(
          'equipment_not_owned',
          upgradeId,
          `${upgradeId} is not present in the clinic's equipment-ownership record.`,
          [clinicOperationalContext.clinicStateId, upgradeId],
        ),
      );
      invalidUpgradeIds.add(upgradeId);
    }
    if (!facility.allowedUpgradeIds.includes(upgradeId)) {
      diagnostics.push(
        makeDiagnostic(
          'upgrade_not_permitted_at_facility',
          upgradeId,
          `${upgradeId} is not permitted by exact facility ${facility.id}.`,
          [facility.id, upgradeId],
        ),
      );
      invalidUpgradeIds.add(upgradeId);
    }
    if (!owner.allowedFacilityTiers.includes(facility.tier)) {
      diagnostics.push(
        makeDiagnostic(
          'upgrade_facility_tier_mismatch',
          upgradeId,
          `${upgradeId} is not permitted at facility tier ${facility.tier}.`,
          [facility.id, upgradeId],
        ),
      );
      invalidUpgradeIds.add(upgradeId);
    }
  }

  const formularyReferences = assignmentHorizon.assignments.flatMap((assignment) =>
    assignment.assignedFormularyRefs.map((reference) => ({
      assignmentId: assignment.id,
      reference,
    })),
  );
  for (const { assignmentId, reference } of formularyReferences) {
    const owner = formularyOwners.get(reference.id);
    if (!owner) {
      diagnostics.push(
        makeDiagnostic(
          'formulary_owner_missing',
          reference.id,
          `${reference.id} has no exact operational formulary owner.`,
          [assignmentHorizon.id, assignmentId, reference.id],
        ),
      );
      invalidFormularyIds.add(reference.id);
      continue;
    }
    if (
      owner.contentVersion !== reference.contentVersion ||
      fingerprintSelectedLocationFormularyOwner(owner) !== reference.fingerprint
    ) {
      diagnostics.push(
        makeDiagnostic(
          'formulary_owner_mismatch',
          reference.id,
          `${reference.id} does not match its versioned and fingerprinted assignment reference.`,
          [assignmentHorizon.id, assignmentId, reference.id],
        ),
      );
      invalidFormularyIds.add(reference.id);
    }
    if (!ownedFormularyIds.has(reference.id)) {
      diagnostics.push(
        makeDiagnostic(
          'formulary_not_owned',
          reference.id,
          `${reference.id} is assigned to a location but is not owned by the clinic.`,
          [clinicOperationalContext.clinicStateId, assignmentId, reference.id],
        ),
      );
      invalidFormularyIds.add(reference.id);
    }
  }

  const assignedStaffIds = uniqueSorted(
    assignmentHorizon.assignments.flatMap((assignment) =>
      assignment.assignedUpgradeRefs
        .filter((reference) => reference.kind === 'staff')
        .map((reference) => reference.id),
    ),
  );
  const staffConfigurationsById = new Map<
    string,
    ClinicOperationalContext['staffConfigurations']
  >();
  for (const configuration of clinicOperationalContext.staffConfigurations) {
    const current = staffConfigurationsById.get(configuration.staffUpgradeId) ?? [];
    staffConfigurationsById.set(configuration.staffUpgradeId, [...current, configuration]);
  }
  const validStaffConfigurationById = new Map<string, ClinicState['staffConfigurations'][number]>();
  const staffIdsByAutomaticAction = new Map<string, string[]>();
  for (const staffId of assignedStaffIds) {
    const configurations = staffConfigurationsById.get(staffId) ?? [];
    const owner = upgradeOwners.get(staffId);
    if (configurations.length > 1) {
      diagnostics.push(
        makeDiagnostic(
          'staff_configuration_duplicate',
          staffId,
          `${staffId} has more than one clinic automation configuration.`,
          [clinicOperationalContext.clinicStateId, staffId],
        ),
      );
      invalidUpgradeIds.add(staffId);
      continue;
    }
    const configuration = configurations[0];
    if (!configuration) {
      diagnostics.push(
        makeDiagnostic(
          'staff_configuration_missing',
          staffId,
          `${staffId} is assigned without one clinic-owned automation configuration.`,
          [clinicOperationalContext.clinicStateId, staffId],
        ),
      );
      invalidUpgradeIds.add(staffId);
      continue;
    }
    if (
      owner?.kind !== 'staff' ||
      owner.staffAutomation === null ||
      new Set(configuration.automaticInformationActionIds).size !==
        configuration.automaticInformationActionIds.length ||
      configuration.automaticInformationActionIds.length >
        owner.staffAutomation.maximumAutomaticActions ||
      configuration.automaticInformationActionIds.some(
        (actionId) => !owner.staffAutomation?.eligibleInformationActionIds.includes(actionId),
      )
    ) {
      diagnostics.push(
        makeDiagnostic(
          'staff_configuration_invalid',
          staffId,
          `${staffId} has an automation configuration outside its exact action horizon.`,
          [
            clinicOperationalContext.clinicStateId,
            staffId,
            ...configuration.automaticInformationActionIds,
          ],
        ),
      );
      invalidUpgradeIds.add(staffId);
      continue;
    }
    validStaffConfigurationById.set(staffId, configuration);
    for (const actionId of configuration.automaticInformationActionIds) {
      staffIdsByAutomaticAction.set(actionId, [
        ...(staffIdsByAutomaticAction.get(actionId) ?? []),
        staffId,
      ]);
    }
  }
  for (const [actionId, staffIds] of staffIdsByAutomaticAction) {
    const uniqueStaffIds = uniqueSorted(staffIds);
    if (uniqueStaffIds.length < 2) continue;
    diagnostics.push(
      makeDiagnostic(
        'staff_automatic_action_conflict',
        actionId,
        `${actionId} is assigned to more than one staff workflow.`,
        [clinicOperationalContext.clinicStateId, actionId, ...uniqueStaffIds],
      ),
    );
    uniqueStaffIds.forEach((staffId) => invalidUpgradeIds.add(staffId));
  }

  for (const reference of selectedAssignment.assignedUpgradeRefs) {
    const owner = upgradeOwners.get(reference.id);
    if (!owner || !matchesUpgradeReference(owner, reference)) {
      continue;
    }
    if (
      owner.requiredDepartmentId !== null &&
      (selectedLocation.departmentId !== owner.requiredDepartmentId ||
        !clinicOperationalContext.departmentIds.includes(owner.requiredDepartmentId))
    ) {
      diagnostics.push(
        makeDiagnostic(
          'required_department_missing',
          owner.id,
          `${owner.id} requires department ${owner.requiredDepartmentId} at this exact location.`,
          [selectedLocation.id, owner.id, owner.requiredDepartmentId],
        ),
      );
      invalidUpgradeIds.add(owner.id);
    }
  }

  const validSelectedUpgradeOwners = selectedAssignment.assignedUpgradeRefs
    .flatMap((reference) => {
      const owner = upgradeOwners.get(reference.id);
      return owner &&
        !invalidUpgradeIds.has(reference.id) &&
        matchesUpgradeReference(owner, reference)
        ? [owner]
        : [];
    })
    .sort((left, right) => compareStrings(left.id, right.id));
  const grantedFormularyIds = new Set(
    validSelectedUpgradeOwners.flatMap((owner) => owner.grantsFormularyIds),
  );
  const assignedFormularyIds = new Set(
    selectedAssignment.assignedFormularyRefs.map((reference) => reference.id),
  );
  for (const formularyId of new Set([...grantedFormularyIds, ...assignedFormularyIds])) {
    if (grantedFormularyIds.has(formularyId) !== assignedFormularyIds.has(formularyId)) {
      diagnostics.push(
        makeDiagnostic(
          'formulary_not_granted',
          formularyId,
          `${formularyId} must exactly match the formulary grants of valid upgrades assigned to this location.`,
          [selectedAssignment.id, formularyId],
        ),
      );
      invalidFormularyIds.add(formularyId);
    }
  }

  const baselineFormularyOwner = formularyOwners.get(selectedLocation.formularyId);
  if (!baselineFormularyOwner) {
    diagnostics.push(
      makeDiagnostic(
        'formulary_owner_missing',
        selectedLocation.formularyId,
        `Baseline formulary ${selectedLocation.formularyId} has no exact operational owner.`,
        [selectedLocation.id, selectedLocation.formularyId],
      ),
    );
    invalidFormularyIds.add(selectedLocation.formularyId);
  }

  const effectiveFormularyRefs = sortById(
    [
      ...(baselineFormularyOwner && !invalidFormularyIds.has(baselineFormularyOwner.id)
        ? [
            {
              id: baselineFormularyOwner.id,
              contentVersion: baselineFormularyOwner.contentVersion,
              fingerprint: fingerprintSelectedLocationFormularyOwner(baselineFormularyOwner),
            },
          ]
        : []),
      ...selectedAssignment.assignedFormularyRefs.filter(
        (reference) =>
          grantedFormularyIds.has(reference.id) && !invalidFormularyIds.has(reference.id),
      ),
    ].filter(
      (reference, index, references) =>
        references.findIndex((candidate) => candidate.id === reference.id) === index,
    ),
  );
  const effectiveCapabilityIds = uniqueSorted([
    ...selectedLocation.capabilities,
    ...validSelectedUpgradeOwners.flatMap((owner) => owner.grantsCapabilities),
  ]);
  const staffContexts = validSelectedUpgradeOwners.flatMap((owner) => {
    if (owner.kind !== 'staff') return [];
    const configuration = validStaffConfigurationById.get(owner.id);
    if (!configuration || invalidUpgradeIds.has(owner.id)) return [];
    return [
      {
        staffUpgradeRef: upgradeReferenceFor(owner),
        automaticInformationActionIds: uniqueSorted(configuration.automaticInformationActionIds),
      },
    ];
  });
  const normalizedDiagnostics = sortById(diagnostics);
  const baseArtifact = {
    schemaVersion: 1 as const,
    compilerVersion: SELECTED_LOCATION_OPERATIONAL_RESOURCE_COMPILER_VERSION,
    requestId: request.id,
    status:
      normalizedDiagnostics.length === 0 ? ('complete' as const) : ('incomplete_coverage' as const),
    clinicStateId: clinicOperationalContext.clinicStateId,
    clinicOperationalContextFingerprint:
      fingerprintClinicOperationalContext(clinicOperationalContext),
    facilityRef: {
      id: facility.id,
      contentVersion: facility.contentVersion,
      fingerprint: fingerprintSelectedLocationFacility(facility),
    },
    locationRef: {
      id: selectedLocation.id,
      contentVersion: selectedLocation.contentVersion,
      fingerprint: fingerprintSelectedLocationDefinition(selectedLocation),
    },
    assignmentHorizonRef: {
      id: assignmentHorizon.id,
      contentVersion: assignmentHorizon.contentVersion,
      fingerprint: fingerprintClinicLocationResourceAssignmentHorizon(assignmentHorizon),
    },
    selectedAssignmentRef: {
      id: selectedAssignment.id,
      contentVersion: selectedAssignment.contentVersion,
      fingerprint: fingerprintSelectedLocationResourceAssignment(selectedAssignment),
    },
    careSetting: selectedLocation.careSetting,
    baselineCapabilityIds: uniqueSorted(selectedLocation.capabilities),
    assignedUpgradeRefs: [...selectedAssignment.assignedUpgradeRefs],
    effectiveCapabilityIds,
    effectiveFormularyRefs,
    staffContexts: staffContexts.sort((left, right) =>
      compareStrings(left.staffUpgradeRef.id, right.staffUpgradeRef.id),
    ),
    diagnostics: normalizedDiagnostics,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(baseArtifact));
  const artifact = {
    ...baseArtifact,
    id: `selected-location-operational-resource.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  };
  const output = SelectedLocationOperationalResourceContextArtifactSchema.safeParse(artifact);
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
      request.id,
      selectedLocation.id,
      assignmentHorizon.id,
      selectedAssignment.id,
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifySelectedLocationOperationalResourceContextIntegrity = (
  value: unknown,
): SelectedLocationOperationalResourceIntegrityResult => {
  const parsed = SelectedLocationOperationalResourceContextArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  if (parsed.data.compilerVersion !== SELECTED_LOCATION_OPERATIONAL_RESOURCE_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${parsed.data.id} uses unsupported compiler ${parsed.data.compilerVersion}.`,
      },
    };
  }
  const replay = compileSelectedLocationOperationalResourceContext(parsed.data.compileRequest);
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
        message: `${parsed.data.id} does not match deterministic replay.`,
      },
    };
  }
  return { ok: true, value: parsed.data };
};

export const verifySelectedLocationOperationalResourceContext = (input: {
  readonly artifact: unknown;
  readonly clinicOperationalContext: ClinicOperationalContext;
  readonly facility: FacilityDefinition;
  readonly selectedLocation: LocationDefinition;
  readonly assignmentHorizon: ClinicLocationResourceAssignmentHorizon;
  readonly upgradeOwners: readonly SelectedLocationOperationalUpgradeOwner[];
  readonly formularyOwners: readonly SelectedLocationOperationalFormularyOwner[];
}): SelectedLocationOperationalResourceContextResult => {
  const integrity = verifySelectedLocationOperationalResourceContextIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: integrity.error.message,
      },
    };
  }
  const artifact = integrity.value;
  if (
    artifact.status !== 'complete' ||
    artifact.clinicOperationalContextFingerprint !==
      fingerprintClinicOperationalContext(input.clinicOperationalContext) ||
    artifact.facilityRef.fingerprint !== fingerprintSelectedLocationFacility(input.facility) ||
    artifact.locationRef.fingerprint !==
      fingerprintSelectedLocationDefinition(input.selectedLocation) ||
    artifact.assignmentHorizonRef.fingerprint !==
      fingerprintClinicLocationResourceAssignmentHorizon(input.assignmentHorizon) ||
    !sameExactValue(
      artifact.compileRequest.upgradeOwners,
      sortById(input.upgradeOwners.map(normalizeUpgradeOwner)),
    ) ||
    !sameExactValue(
      artifact.compileRequest.formularyOwners,
      normalizeFormularyOwners(input.formularyOwners),
    )
  ) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message:
          'The selected-location resource artifact is incomplete or belongs to another exact clinic, facility, location, assignment horizon, upgrade-owner horizon, or formulary-owner horizon.',
      },
    };
  }
  return { ok: true, value: artifact };
};
