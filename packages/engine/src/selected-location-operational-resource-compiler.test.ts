import {
  type ClinicState,
  type EncounterCareSetting,
  type SelectedLocationOperationalFormularyOwner,
  type SelectedLocationOperationalResourceContextArtifact,
  type SelectedLocationOperationalResourceContextRequest,
  type SelectedLocationOperationalUpgradeOwner,
  type SelectedLocationResourceAssignment,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  compileSelectedLocationOperationalResourceContext,
  fingerprintClinicOperationalContext,
  fingerprintSelectedLocationFormularyOwner,
  fingerprintSelectedLocationUpgradeOwner,
  projectClinicOperationalContext,
  verifySelectedLocationOperationalResourceContext,
  verifySelectedLocationOperationalResourceContextIntegrity,
} from './selected-location-operational-resource-compiler';

const careSettings: EncounterCareSetting[] = [
  'outpatient_psychiatry',
  'emergency_department',
  'inpatient_psychiatry',
  'consultation_liaison',
];

const makeUpgradeOwner = (
  id: string,
  kind: SelectedLocationOperationalUpgradeOwner['kind'],
  options: {
    readonly locationAssignmentMode?: SelectedLocationOperationalUpgradeOwner['locationAssignmentMode'];
    readonly requiredDepartmentId?: string | null;
    readonly grantsCapabilities?: string[];
    readonly grantsFormularyIds?: string[];
    readonly eligibleInformationActionIds?: string[];
  } = {},
): SelectedLocationOperationalUpgradeOwner => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id,
  kind,
  locationAssignmentMode: options.locationAssignmentMode ?? 'exclusive_location',
  allowedFacilityTiers: ['behavioral_health_system'],
  requiredDepartmentId: options.requiredDepartmentId ?? null,
  grantsCapabilities: options.grantsCapabilities ?? [],
  grantsFormularyIds: options.grantsFormularyIds ?? [],
  staffAutomation:
    kind === 'staff'
      ? {
          eligibleInformationActionIds: options.eligibleInformationActionIds ?? [
            'info.history.test.medication-reconciliation',
            'info.physical.test.vital-signs',
          ],
          maximumAutomaticActions: 2,
        }
      : null,
});

const upgradeRef = (owner: SelectedLocationOperationalUpgradeOwner) => ({
  id: owner.id,
  contentVersion: owner.contentVersion,
  kind: owner.kind,
  fingerprint: fingerprintSelectedLocationUpgradeOwner(owner),
});

const formularyRef = (owner: SelectedLocationOperationalFormularyOwner) => ({
  id: owner.id,
  contentVersion: owner.contentVersion,
  fingerprint: fingerprintSelectedLocationFormularyOwner(owner),
});

const selectedAssignment = (
  request: SelectedLocationOperationalResourceContextRequest,
): SelectedLocationResourceAssignment => {
  const assignment = request.assignmentHorizon.assignments.find(
    (candidate) =>
      candidate.locationRef.id === request.selectedLocation.id &&
      candidate.locationRef.contentVersion === request.selectedLocation.contentVersion,
  );
  if (!assignment) throw new Error('Synthetic selected assignment is missing.');
  return assignment;
};

const refreshUpgradeRefs = (
  request: SelectedLocationOperationalResourceContextRequest,
  ownerId: string,
): void => {
  const owner = request.upgradeOwners.find((candidate) => candidate.id === ownerId);
  if (!owner) throw new Error(`Missing synthetic upgrade owner ${ownerId}.`);
  for (const assignment of request.assignmentHorizon.assignments) {
    assignment.assignedUpgradeRefs = assignment.assignedUpgradeRefs.map((reference) =>
      reference.id === ownerId ? upgradeRef(owner) : reference,
    );
  }
};

const addBuiltLocationAssignment = (
  request: SelectedLocationOperationalResourceContextRequest,
  locationId: string,
  assignedUpgradeOwnerIds: readonly string[] = [],
): SelectedLocationResourceAssignment => {
  request.clinicOperationalContext.locationIds.push(locationId);
  request.facility.locationIds.push(locationId);
  const assignment: SelectedLocationResourceAssignment = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `selected-location-resource-assignment.test.${locationId}`,
    modelVersion: 'selected-location-operational-resource-assignment.v1',
    locationRef: { id: locationId, contentVersion: '1.0.0' },
    assignedUpgradeRefs: assignedUpgradeOwnerIds.map((ownerId) => {
      const owner = request.upgradeOwners.find((candidate) => candidate.id === ownerId);
      if (!owner) throw new Error(`Missing synthetic owner ${ownerId}.`);
      return upgradeRef(owner);
    }),
    assignedFormularyRefs: [],
  };
  request.assignmentHorizon.assignments.push(assignment);
  return assignment;
};

const makeRequest = (
  careSetting: EncounterCareSetting = 'outpatient_psychiatry',
): SelectedLocationOperationalResourceContextRequest => {
  const locationId = `location.test.resource.${careSetting}`;
  const departmentId = `department.test.resource.${careSetting}`;
  const facilityId = 'facility.test.resource';
  const equipmentId = 'upgrade.test.resource.equipment';
  const staffId = 'upgrade.test.resource.staff';
  const formularyUpgradeId = 'upgrade.test.resource.formulary';
  const baselineFormularyId = `formulary.test.resource.baseline.${careSetting}`;
  const expandedFormularyId = 'formulary.test.resource.expanded';
  const globalOnlyFormularyId = 'formulary.test.resource.global-only';
  const upgradeOwners = [
    makeUpgradeOwner(equipmentId, 'equipment', {
      requiredDepartmentId: departmentId,
      grantsCapabilities: ['capability.equipment.assigned'],
    }),
    makeUpgradeOwner(staffId, 'staff', {
      requiredDepartmentId: departmentId,
      grantsCapabilities: ['capability.staff.assigned'],
    }),
    makeUpgradeOwner(formularyUpgradeId, 'formulary', {
      locationAssignmentMode: 'shared_locations',
      grantsCapabilities: ['capability.formulary.assigned'],
      grantsFormularyIds: [expandedFormularyId],
    }),
  ];
  const formularyOwners = [
    {
      schemaVersion: 1 as const,
      id: globalOnlyFormularyId,
      contentVersion: '1.0.0',
      medicationIds: ['medication.test.global-only'],
    },
    {
      schemaVersion: 1 as const,
      id: expandedFormularyId,
      contentVersion: '1.0.0',
      medicationIds: ['medication.test.expanded-a', 'medication.test.expanded-b'],
    },
    {
      schemaVersion: 1 as const,
      id: baselineFormularyId,
      contentVersion: '1.0.0',
      medicationIds: ['medication.test.baseline-a', 'medication.test.baseline-b'],
    },
  ];

  return {
    schemaVersion: 1,
    id: `selected-location-resource-request.test.${careSetting}`,
    clinicOperationalContext: {
      schemaVersion: 1,
      modelVersion: 'clinic-operational-context.v1',
      clinicStateId: 'clinic.test.resource',
      facilityId,
      facilityTier: 'behavioral_health_system',
      locationIds: [locationId],
      departmentIds: [departmentId],
      ownedUpgradeIds: [
        staffId,
        equipmentId,
        formularyUpgradeId,
        'upgrade.test.resource.global-only',
      ],
      ownedEquipmentIds: [equipmentId],
      staffConfigurations: [
        {
          staffUpgradeId: staffId,
          automaticInformationActionIds: [
            'info.physical.test.vital-signs',
            'info.history.test.medication-reconciliation',
          ],
        },
      ],
      formularyIds: [expandedFormularyId, globalOnlyFormularyId, baselineFormularyId],
    },
    facility: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: facilityId,
      label: 'Synthetic behavioral-health system',
      tier: 'behavioral_health_system',
      minimumLifetimePoints: 0,
      patientSlotCount: 4,
      locationIds: [locationId],
      defaultLocationId: locationId,
      allowedDepartmentIds: [departmentId],
      allowedUpgradeIds: [formularyUpgradeId, staffId, equipmentId],
    },
    selectedLocation: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: locationId,
      label: `Synthetic ${careSetting}`,
      facilityTier: 'behavioral_health_system',
      careSetting,
      departmentId,
      capabilities: [`capability.baseline.${careSetting}`, 'capability.baseline.shared'],
      formularyId: baselineFormularyId,
      dispositionIds: [`disposition.test.${careSetting}`],
    },
    assignmentHorizon: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'clinic-location-resource-assignment-horizon.test',
      modelVersion: 'clinic-location-resource-assignment-horizon.v1',
      clinicStateId: 'clinic.test.resource',
      assignments: [
        {
          schemaVersion: 1,
          contentVersion: '1.0.0',
          id: `selected-location-resource-assignment.test.${careSetting}`,
          modelVersion: 'selected-location-operational-resource-assignment.v1',
          locationRef: { id: locationId, contentVersion: '1.0.0' },
          assignedUpgradeRefs: upgradeOwners.map(upgradeRef),
          assignedFormularyRefs: [
            formularyRef(formularyOwners.find((owner) => owner.id === expandedFormularyId)!),
          ],
        },
      ],
    },
    upgradeOwners,
    formularyOwners,
  };
};

const expectSuccess = (request: unknown): SelectedLocationOperationalResourceContextArtifact => {
  const result = compileSelectedLocationOperationalResourceContext(request);
  expect(result).toMatchObject({ ok: true });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const diagnosticCodes = (artifact: SelectedLocationOperationalResourceContextArtifact): string[] =>
  artifact.diagnostics.map((diagnostic) => diagnostic.code);

const makeRawClinicState = (): ClinicState => {
  const context = makeRequest().clinicOperationalContext;
  return {
    schemaVersion: 1,
    id: context.clinicStateId,
    label: 'Synthetic clinic presentation',
    facilityId: context.facilityId,
    facilityTier: context.facilityTier,
    locationIds: [...context.locationIds],
    activeLocationId: context.locationIds[0]!,
    departmentIds: [...context.departmentIds],
    capabilities: ['capability.global-only'],
    ownedUpgradeIds: [...context.ownedUpgradeIds],
    ownedEquipmentIds: [...context.ownedEquipmentIds],
    staffConfigurations: structuredClone(context.staffConfigurations),
    formularyIds: [...context.formularyIds],
    clinicPoints: 12_000,
    lifetimePointsEarned: 30_000,
    debugUnlocksAllProgression: true,
    satisfaction: 7,
    satisfactionMultiplier: 1.1,
  };
};

describe('selected-location operational resource compiler', () => {
  it('projects only operational clinic state and ignores volatile save fields', () => {
    const raw = makeRawClinicState();
    const projected = projectClinicOperationalContext(raw);
    const changedOnlyOutsideAdmission = structuredClone(raw);
    changedOnlyOutsideAdmission.label = 'Changed display label';
    changedOnlyOutsideAdmission.activeLocationId = 'location.test.other-active';
    changedOnlyOutsideAdmission.capabilities = ['capability.changed-global-union'];
    changedOnlyOutsideAdmission.clinicPoints += 500;
    changedOnlyOutsideAdmission.lifetimePointsEarned += 1_000;
    changedOnlyOutsideAdmission.debugUnlocksAllProgression = false;
    changedOnlyOutsideAdmission.satisfaction = 99;
    changedOnlyOutsideAdmission.satisfactionMultiplier = 1.5;
    expect(projectClinicOperationalContext(changedOnlyOutsideAdmission)).toEqual(projected);

    const request = makeRequest();
    request.clinicOperationalContext = projected;
    const first = expectSuccess(request);
    const changedRequest = structuredClone(request);
    changedRequest.clinicOperationalContext = projectClinicOperationalContext(
      changedOnlyOutsideAdmission,
    );
    expect(expectSuccess(changedRequest)).toEqual(first);

    const operationalMutations: Array<(clinic: ClinicState) => void> = [
      (clinic) => {
        clinic.facilityId = 'facility.test.changed';
      },
      (clinic) => {
        clinic.facilityTier = 'integrated_medical_center';
      },
      (clinic) => {
        clinic.locationIds.push('location.test.changed');
      },
      (clinic) => {
        clinic.departmentIds.push('department.test.changed');
      },
      (clinic) => {
        clinic.ownedUpgradeIds.push('upgrade.test.changed');
      },
      (clinic) => {
        clinic.ownedEquipmentIds.push('equipment.test.changed');
      },
      (clinic) => {
        clinic.staffConfigurations.push({
          staffUpgradeId: 'upgrade.test.changed-staff',
          automaticInformationActionIds: [],
        });
      },
      (clinic) => {
        clinic.formularyIds.push('formulary.test.changed');
      },
    ];
    for (const mutate of operationalMutations) {
      const changed = structuredClone(raw);
      mutate(changed);
      expect(
        fingerprintClinicOperationalContext(projectClinicOperationalContext(changed)),
      ).not.toBe(fingerprintClinicOperationalContext(projected));
    }
  });

  it('strictly rejects excluded ClinicState fields at the operational projection boundary', () => {
    const request = makeRequest() as unknown as Record<string, unknown>;
    request.clinicOperationalContext = {
      ...(request.clinicOperationalContext as object),
      clinicPoints: 100,
    };
    expect(compileSelectedLocationOperationalResourceContext(request)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('compiles exact baseline, equipment, staff, and formulary resources', () => {
    const request = makeRequest();
    const artifact = expectSuccess(request);

    expect(artifact).toMatchObject({
      status: 'complete',
      careSetting: 'outpatient_psychiatry',
      clinicStateId: request.clinicOperationalContext.clinicStateId,
      baselineCapabilityIds: [
        'capability.baseline.outpatient_psychiatry',
        'capability.baseline.shared',
      ],
      effectiveCapabilityIds: [
        'capability.baseline.outpatient_psychiatry',
        'capability.baseline.shared',
        'capability.equipment.assigned',
        'capability.formulary.assigned',
        'capability.staff.assigned',
      ],
      diagnostics: [],
    });
    expect(artifact.assignedUpgradeRefs.map((reference) => reference.id)).toEqual([
      'upgrade.test.resource.equipment',
      'upgrade.test.resource.formulary',
      'upgrade.test.resource.staff',
    ]);
    expect(artifact.effectiveFormularyRefs.map((owner) => owner.id)).toEqual([
      'formulary.test.resource.baseline.outpatient_psychiatry',
      'formulary.test.resource.expanded',
    ]);
    expect(artifact.staffContexts).toEqual([
      {
        staffUpgradeRef: expect.objectContaining({
          id: 'upgrade.test.resource.staff',
          kind: 'staff',
        }),
        automaticInformationActionIds: [
          'info.history.test.medication-reconciliation',
          'info.physical.test.vital-signs',
        ],
      },
    ]);
  });

  it.each(careSettings)('uses the same explicit resource projection for %s', (careSetting) => {
    const request = makeRequest(careSetting);
    const artifact = expectSuccess(request);

    expect(artifact.status).toBe('complete');
    expect(artifact.careSetting).toBe(careSetting);
    expect(artifact.locationRef.id).toBe(request.selectedLocation.id);
    expect(artifact.baselineCapabilityIds).toContain(`capability.baseline.${careSetting}`);
    expect(artifact.effectiveCapabilityIds).toContain('capability.equipment.assigned');
  });

  it('does not leak clinic-global resources or unassigned upgrades', () => {
    const request = makeRequest();
    const artifact = expectSuccess(request);

    expect(artifact.effectiveCapabilityIds).not.toContain('capability.global-only');
    expect(artifact.effectiveFormularyRefs.map((owner) => owner.id)).not.toContain(
      'formulary.test.resource.global-only',
    );
    expect(artifact.assignedUpgradeRefs.map((owner) => owner.id)).not.toContain(
      'upgrade.test.resource.global-only',
    );

    const baselineOnly = structuredClone(request);
    selectedAssignment(baselineOnly).assignedUpgradeRefs = [];
    selectedAssignment(baselineOnly).assignedFormularyRefs = [];
    baselineOnly.upgradeOwners = [];
    baselineOnly.clinicOperationalContext.staffConfigurations = [];
    const baselineArtifact = expectSuccess(baselineOnly);
    expect(baselineArtifact.status).toBe('complete');
    expect(baselineArtifact.effectiveCapabilityIds).toEqual(baselineArtifact.baselineCapabilityIds);
    expect(baselineArtifact.effectiveFormularyRefs.map((owner) => owner.id)).toEqual([
      request.selectedLocation.formularyId,
    ]);
    expect(baselineArtifact.staffContexts).toEqual([]);
  });

  it('uses the explicitly selected location when another built location exists', () => {
    const request = makeRequest('consultation_liaison');
    const otherLocationId = 'location.test.resource.active-outpatient';
    addBuiltLocationAssignment(request, otherLocationId);
    request.facility.defaultLocationId = otherLocationId;

    const artifact = expectSuccess(request);
    expect(artifact.status).toBe('complete');
    expect(artifact.locationRef.id).toBe('location.test.resource.consultation_liaison');
    expect(artifact.careSetting).toBe('consultation_liaison');
  });

  it.each([
    {
      label: 'clinic facility identity',
      mutate: (request: SelectedLocationOperationalResourceContextRequest) => {
        request.clinicOperationalContext.facilityId = 'facility.test.crossed';
      },
    },
    {
      label: 'facility location membership',
      mutate: (request: SelectedLocationOperationalResourceContextRequest) => {
        request.facility.locationIds = ['location.test.crossed'];
        request.facility.defaultLocationId = 'location.test.crossed';
      },
    },
    {
      label: 'clinic location membership',
      mutate: (request: SelectedLocationOperationalResourceContextRequest) => {
        request.clinicOperationalContext.locationIds = ['location.test.crossed'];
      },
    },
    {
      label: 'assignment horizon clinic identity',
      mutate: (request: SelectedLocationOperationalResourceContextRequest) => {
        request.assignmentHorizon.clinicStateId = 'clinic.test.crossed';
      },
    },
    {
      label: 'selected assignment location version',
      mutate: (request: SelectedLocationOperationalResourceContextRequest) => {
        selectedAssignment(request).locationRef.contentVersion = '2.0.0';
      },
    },
  ])('rejects crossed $label context', ({ mutate }) => {
    const request = makeRequest();
    mutate(request);
    expect(compileSelectedLocationOperationalResourceContext(request)).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });

  it('requires the clinic-wide assignment horizon to cover every built location', () => {
    const request = makeRequest();
    request.clinicOperationalContext.locationIds.push('location.test.unassigned');
    request.facility.locationIds.push('location.test.unassigned');

    const artifact = expectSuccess(request);
    expect(artifact.status).toBe('incomplete_coverage');
    expect(diagnosticCodes(artifact)).toContain('assignment_horizon_incomplete');
  });

  it('blocks an exclusive resource assigned to two locations', () => {
    const request = makeRequest();
    addBuiltLocationAssignment(request, 'location.test.resource.second', [
      'upgrade.test.resource.equipment',
    ]);

    const artifact = expectSuccess(request);
    expect(diagnosticCodes(artifact)).toContain('upgrade_assignment_conflict');
    expect(artifact.effectiveCapabilityIds).not.toContain('capability.equipment.assigned');
  });

  it('allows an explicitly shared resource at two locations', () => {
    const request = makeRequest();
    const equipment = request.upgradeOwners.find(
      (owner) => owner.id === 'upgrade.test.resource.equipment',
    )!;
    equipment.locationAssignmentMode = 'shared_locations';
    equipment.requiredDepartmentId = null;
    refreshUpgradeRefs(request, equipment.id);
    addBuiltLocationAssignment(request, 'location.test.resource.second', [equipment.id]);

    const artifact = expectSuccess(request);
    expect(artifact.status).toBe('complete');
    expect(artifact.effectiveCapabilityIds).toContain('capability.equipment.assigned');
  });

  it('rejects missing, stale, fabricated, and unowned upgrade owners without grants', () => {
    const missing = makeRequest();
    missing.upgradeOwners = missing.upgradeOwners.filter(
      (owner) => owner.id !== 'upgrade.test.resource.equipment',
    );
    const missingArtifact = expectSuccess(missing);
    expect(diagnosticCodes(missingArtifact)).toContain('upgrade_owner_missing');
    expect(missingArtifact.effectiveCapabilityIds).not.toContain('capability.equipment.assigned');

    const stale = makeRequest();
    const staleEquipment = stale.upgradeOwners.find(
      (owner) => owner.id === 'upgrade.test.resource.equipment',
    )!;
    staleEquipment.contentVersion = '2.0.0';
    staleEquipment.grantsCapabilities = ['capability.fabricated'];
    const staleArtifact = expectSuccess(stale);
    expect(diagnosticCodes(staleArtifact)).toContain('upgrade_owner_mismatch');
    expect(staleArtifact.effectiveCapabilityIds).not.toContain('capability.fabricated');

    const unowned = makeRequest();
    unowned.clinicOperationalContext.ownedUpgradeIds =
      unowned.clinicOperationalContext.ownedUpgradeIds.filter(
        (id) => id !== 'upgrade.test.resource.equipment',
      );
    unowned.clinicOperationalContext.ownedEquipmentIds = [];
    const unownedArtifact = expectSuccess(unowned);
    expect(diagnosticCodes(unownedArtifact)).toEqual(
      expect.arrayContaining(['upgrade_not_owned', 'equipment_not_owned']),
    );
    expect(unownedArtifact.effectiveCapabilityIds).not.toContain('capability.equipment.assigned');
  });

  it('diagnoses facility, tier, and selected-department mismatches', () => {
    const request = makeRequest();
    const equipment = request.upgradeOwners.find(
      (owner) => owner.id === 'upgrade.test.resource.equipment',
    )!;
    equipment.requiredDepartmentId = 'department.test.resource.other';
    equipment.allowedFacilityTiers = ['solo_office'];
    refreshUpgradeRefs(request, equipment.id);
    request.facility.allowedUpgradeIds = request.facility.allowedUpgradeIds.filter(
      (id) => id !== equipment.id,
    );

    const artifact = expectSuccess(request);
    expect(diagnosticCodes(artifact)).toEqual(
      expect.arrayContaining([
        'required_department_missing',
        'upgrade_facility_tier_mismatch',
        'upgrade_not_permitted_at_facility',
      ]),
    );
    expect(artifact.effectiveCapabilityIds).not.toContain('capability.equipment.assigned');
  });

  it('rejects missing, duplicate, and invalid staff configurations', () => {
    const missing = makeRequest();
    missing.clinicOperationalContext.staffConfigurations = [];
    const missingArtifact = expectSuccess(missing);
    expect(diagnosticCodes(missingArtifact)).toContain('staff_configuration_missing');
    expect(missingArtifact.staffContexts).toEqual([]);

    const duplicate = makeRequest();
    duplicate.clinicOperationalContext.staffConfigurations.push(
      structuredClone(duplicate.clinicOperationalContext.staffConfigurations[0]!),
    );
    const duplicateArtifact = expectSuccess(duplicate);
    expect(diagnosticCodes(duplicateArtifact)).toContain('staff_configuration_duplicate');
    expect(duplicateArtifact.staffContexts).toEqual([]);

    const invalid = makeRequest();
    invalid.clinicOperationalContext.staffConfigurations[0]!.automaticInformationActionIds = [
      'info.history.test.outside-horizon',
    ];
    const invalidArtifact = expectSuccess(invalid);
    expect(diagnosticCodes(invalidArtifact)).toContain('staff_configuration_invalid');
    expect(invalidArtifact.staffContexts).toEqual([]);
  });

  it('rejects overlapping automatic actions across staff workflows', () => {
    const request = makeRequest();
    const secondStaff = makeUpgradeOwner('upgrade.test.resource.staff.second', 'staff', {
      grantsCapabilities: ['capability.staff.second'],
      eligibleInformationActionIds: [
        'info.history.test.medication-reconciliation',
        'info.history.test.adherence',
      ],
    });
    request.upgradeOwners.push(secondStaff);
    selectedAssignment(request).assignedUpgradeRefs.push(upgradeRef(secondStaff));
    request.clinicOperationalContext.ownedUpgradeIds.push(secondStaff.id);
    request.facility.allowedUpgradeIds.push(secondStaff.id);
    request.clinicOperationalContext.staffConfigurations.push({
      staffUpgradeId: secondStaff.id,
      automaticInformationActionIds: ['info.history.test.medication-reconciliation'],
    });

    const artifact = expectSuccess(request);
    expect(diagnosticCodes(artifact)).toContain('staff_automatic_action_conflict');
    expect(artifact.staffContexts).toEqual([]);
    expect(artifact.effectiveCapabilityIds).not.toContain('capability.staff.assigned');
    expect(artifact.effectiveCapabilityIds).not.toContain('capability.staff.second');
  });

  it('itemizes missing, stale, unowned, and grant-mismatched formularies', () => {
    const missingBaseline = makeRequest();
    missingBaseline.formularyOwners = missingBaseline.formularyOwners.filter(
      (owner) => owner.id !== missingBaseline.selectedLocation.formularyId,
    );
    const missingArtifact = expectSuccess(missingBaseline);
    expect(diagnosticCodes(missingArtifact)).toContain('formulary_owner_missing');

    const stale = makeRequest();
    const expandedOwner = stale.formularyOwners.find(
      (owner) => owner.id === 'formulary.test.resource.expanded',
    )!;
    expandedOwner.contentVersion = '2.0.0';
    const staleArtifact = expectSuccess(stale);
    expect(diagnosticCodes(staleArtifact)).toContain('formulary_owner_mismatch');
    expect(staleArtifact.effectiveFormularyRefs.map((owner) => owner.id)).not.toContain(
      'formulary.test.resource.expanded',
    );

    const unowned = makeRequest();
    unowned.clinicOperationalContext.formularyIds =
      unowned.clinicOperationalContext.formularyIds.filter(
        (id) => id !== 'formulary.test.resource.expanded',
      );
    const unownedArtifact = expectSuccess(unowned);
    expect(diagnosticCodes(unownedArtifact)).toContain('formulary_not_owned');

    const mismatchedGrant = makeRequest();
    const globalFormulary = mismatchedGrant.formularyOwners.find(
      (owner) => owner.id === 'formulary.test.resource.global-only',
    )!;
    selectedAssignment(mismatchedGrant).assignedFormularyRefs = [formularyRef(globalFormulary)];
    const mismatchArtifact = expectSuccess(mismatchedGrant);
    expect(diagnosticCodes(mismatchArtifact)).toContain('formulary_not_granted');
  });

  it('is deterministic, order-invariant, and does not mutate input', () => {
    const request = makeRequest();
    const original = structuredClone(request);
    const first = expectSuccess(request);
    expect(request).toEqual(original);

    const reordered = structuredClone(request);
    reordered.clinicOperationalContext.ownedUpgradeIds.reverse();
    reordered.clinicOperationalContext.formularyIds.reverse();
    reordered.clinicOperationalContext.staffConfigurations[0]!.automaticInformationActionIds.reverse();
    reordered.facility.allowedUpgradeIds.reverse();
    reordered.selectedLocation.capabilities.reverse();
    selectedAssignment(reordered).assignedUpgradeRefs.reverse();
    reordered.upgradeOwners.reverse();
    reordered.formularyOwners.reverse();

    expect(expectSuccess(reordered)).toEqual(first);
    expect(reordered).not.toEqual(request);

    const formulary = request.formularyOwners[0]!;
    const reorderedMembership = {
      ...formulary,
      medicationIds: [...formulary.medicationIds].reverse(),
    };
    const presentationOnlyChange = {
      ...formulary,
      label: 'A label outside the neutral operational owner projection',
    };
    const changedMembership = {
      ...formulary,
      medicationIds: [...formulary.medicationIds, 'medication.test.new-member'],
    };
    expect(fingerprintSelectedLocationFormularyOwner(reorderedMembership)).toBe(
      fingerprintSelectedLocationFormularyOwner(formulary),
    );
    expect(fingerprintSelectedLocationFormularyOwner(presentationOnlyChange)).toBe(
      fingerprintSelectedLocationFormularyOwner(formulary),
    );
    expect(fingerprintSelectedLocationFormularyOwner(changedMembership)).not.toBe(
      fingerprintSelectedLocationFormularyOwner(formulary),
    );
  });

  it('replays exact artifacts and verifies every current owner horizon', () => {
    const request = makeRequest();
    const artifact = expectSuccess(request);

    expect(verifySelectedLocationOperationalResourceContextIntegrity(artifact)).toMatchObject({
      ok: true,
    });
    expect(
      verifySelectedLocationOperationalResourceContext({
        artifact,
        clinicOperationalContext: request.clinicOperationalContext,
        facility: request.facility,
        selectedLocation: request.selectedLocation,
        assignmentHorizon: request.assignmentHorizon,
        upgradeOwners: request.upgradeOwners,
        formularyOwners: request.formularyOwners,
      }),
    ).toMatchObject({ ok: true });

    const tampered = structuredClone(artifact);
    tampered.effectiveCapabilityIds.push('capability.tampered');
    expect(verifySelectedLocationOperationalResourceContextIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const obsolete = structuredClone(artifact);
    obsolete.compilerVersion = '1.0.0';
    expect(verifySelectedLocationOperationalResourceContextIntegrity(obsolete)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_COMPILER_VERSION' },
    });

    const crossedOwners = structuredClone(request.upgradeOwners);
    crossedOwners[0]!.grantsCapabilities = ['capability.crossed-owner'];
    expect(
      verifySelectedLocationOperationalResourceContext({
        artifact,
        clinicOperationalContext: request.clinicOperationalContext,
        facility: request.facility,
        selectedLocation: request.selectedLocation,
        assignmentHorizon: request.assignmentHorizon,
        upgradeOwners: crossedOwners,
        formularyOwners: request.formularyOwners,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });

    const crossedFormularies = structuredClone(request.formularyOwners);
    crossedFormularies[0]!.medicationIds.push('medication.test.same-version-added');
    expect(
      verifySelectedLocationOperationalResourceContext({
        artifact,
        clinicOperationalContext: request.clinicOperationalContext,
        facility: request.facility,
        selectedLocation: request.selectedLocation,
        assignmentHorizon: request.assignmentHorizon,
        upgradeOwners: request.upgradeOwners,
        formularyOwners: crossedFormularies,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });

  it('strictly rejects costs, rules, probabilities, complexity, and runtime state', () => {
    for (const extra of [
      { selectionCost: 3 },
      { clinicalRuleIds: ['rule.test'] },
      { probability: 0.5 },
      { complexityBudget: 5 },
    ]) {
      expect(
        compileSelectedLocationOperationalResourceContext({
          ...makeRequest(),
          ...extra,
        }),
      ).toMatchObject({
        ok: false,
        error: { code: 'INVALID_REQUEST' },
      });
    }

    const ownerExtension = makeRequest();
    (
      ownerExtension.upgradeOwners[0] as SelectedLocationOperationalUpgradeOwner & {
        purchaseCost?: number;
      }
    ).purchaseCost = 500;
    expect(compileSelectedLocationOperationalResourceContext(ownerExtension)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const artifact = expectSuccess(makeRequest());
    expect(artifact).not.toHaveProperty('selectedFulfillmentMethodId');
    expect(artifact).not.toHaveProperty('points');
    expect(artifact).not.toHaveProperty('complexityBudget');
    expect(artifact).not.toHaveProperty('clinicalRules');
    expect(artifact).not.toHaveProperty('patientInstance');
    expect(artifact).not.toHaveProperty('encounterInstance');
  });
});
