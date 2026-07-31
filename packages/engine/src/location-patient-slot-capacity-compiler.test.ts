import {
  LocationPatientSlotCapacityArtifactSchema,
  LocationPatientSlotCapacityCompileRequestSchema,
  LocationPatientSlotCapacityProfileSchema,
  type LocationDefinition,
  type LocationPatientSlotCapacityArtifact,
  type LocationPatientSlotCapacityCompileRequest,
  type LocationPatientSlotCapacityProfile,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  compileLocationPatientSlotCapacity,
  fingerprintLocationPatientSlotCapacityProfile,
  projectLocationPatientSlotCapacityOwnershipContext,
  verifyLocationPatientSlotCapacityContext,
  verifyLocationPatientSlotCapacityIntegrity,
} from './location-patient-slot-capacity-compiler';
import { fingerprintPatientTemplateLocationAdmissionLocation } from './patient-template-location-admission-compiler';

const location = (
  id = 'location.test.capacity.outpatient',
  contentVersion = '1.0.0',
): LocationDefinition => ({
  schemaVersion: 1,
  contentVersion,
  id,
  label: `Synthetic capacity location ${id}`,
  facilityTier: 'outpatient_clinic',
  careSetting: 'outpatient_psychiatry',
  capabilities: ['history.basic', 'vitals.basic'],
  formularyId: 'formulary.test.capacity',
  dispositionIds: ['disposition.test.capacity.outpatient'],
});

const upgradeA = {
  id: 'upgrade.test.capacity.extra-room-a',
  contentVersion: '1.0.0',
};
const upgradeB = {
  id: 'upgrade.test.capacity.extra-room-b',
  contentVersion: '1.0.0',
};

const profile = (
  selectedLocation: LocationDefinition = location(),
): LocationPatientSlotCapacityProfile => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: `location-patient-slot-capacity-profile.test.${selectedLocation.id}`,
  modelVersion: 'location-patient-slot-capacity.v1',
  locationRef: {
    id: selectedLocation.id,
    contentVersion: selectedLocation.contentVersion,
  },
  locationFingerprint: fingerprintPatientTemplateLocationAdmissionLocation(selectedLocation),
  baseSlotCount: 2,
  upgradeContributions: [
    {
      schemaVersion: 1,
      id: 'location-capacity-contribution.test.extra-room-a',
      upgradeRef: upgradeA,
      additionalSlotCount: 2,
    },
    {
      schemaVersion: 1,
      id: 'location-capacity-contribution.test.extra-room-b',
      upgradeRef: upgradeB,
      additionalSlotCount: 1,
    },
  ],
});

const request = (input?: {
  readonly selectedLocation?: LocationDefinition;
  readonly selectedProfile?: LocationPatientSlotCapacityProfile;
  readonly owned?: readonly (typeof upgradeA)[];
  readonly assigned?: readonly (typeof upgradeA)[];
  readonly requestId?: string;
}): LocationPatientSlotCapacityCompileRequest => {
  const selectedLocation = input?.selectedLocation ?? location();
  const selectedProfile = input?.selectedProfile ?? profile(selectedLocation);
  return {
    schemaVersion: 1,
    id: input?.requestId ?? 'location-patient-slot-capacity-request.test',
    location: selectedLocation,
    capacityProfile: selectedProfile,
    ownershipContext: {
      schemaVersion: 1,
      modelVersion: 'location-patient-slot-capacity-ownership.v1',
      clinicStateId: 'clinic-state.test.capacity',
      ownedCapacityUpgradeRefs: [...(input?.owned ?? [upgradeA, upgradeB])],
    },
    assignedCapacityUpgradeRefs: [...(input?.assigned ?? [upgradeA])],
  };
};

const expectCompiled = (value: unknown): LocationPatientSlotCapacityArtifact => {
  const result = compileLocationPatientSlotCapacity(value);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
};

describe('location patient-slot capacity compiler', () => {
  it('materializes base plus exactly owned-and-assigned upgrade coordinates', () => {
    const artifact = expectCompiled(request());

    expect(LocationPatientSlotCapacityArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.baseSlotCount).toBe(2);
    expect(artifact.totalSlotCount).toBe(4);
    expect(
      artifact.slotCoordinates
        .filter((entry) => entry.authorization.kind === 'base')
        .map((entry) =>
          entry.authorization.kind === 'base' ? entry.authorization.baseSlotOrdinal : -1,
        )
        .sort(),
    ).toEqual([1, 2]);
    expect(
      artifact.slotCoordinates
        .filter(
          (entry) =>
            entry.authorization.kind === 'capacity_upgrade' &&
            entry.authorization.upgradeRef.id === upgradeA.id,
        )
        .map((entry) =>
          entry.authorization.kind === 'capacity_upgrade'
            ? entry.authorization.contributionSlotOrdinal
            : -1,
        )
        .sort(),
    ).toEqual([1, 2]);
    expect(
      artifact.upgradeEvaluations.map((evaluation) => ({
        id: evaluation.contribution.upgradeRef.id,
        applied: evaluation.applied,
        count: evaluation.appliedSlotCount,
      })),
    ).toEqual([
      { id: upgradeA.id, applied: true, count: 2 },
      { id: upgradeB.id, applied: false, count: 0 },
    ]);
  });

  it('keeps existing coordinates byte-stable when another declared upgrade is added', () => {
    const firstRequest = request({ owned: [upgradeA], assigned: [upgradeA] });
    const expandedRequest = request({
      owned: [upgradeB, upgradeA],
      assigned: [upgradeB, upgradeA],
    });
    const first = expectCompiled(firstRequest);
    const expanded = expectCompiled(expandedRequest);

    expect(first.capacityProfileFingerprint).toBe(expanded.capacityProfileFingerprint);
    expect(expanded.totalSlotCount).toBe(first.totalSlotCount + 1);
    expect(expanded.slotCoordinates).toEqual(expect.arrayContaining(first.slotCoordinates));
    expect(
      verifyLocationPatientSlotCapacityContext({
        artifact: first,
        currentRequest: expandedRequest,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });

  it('binds coordinates to one exact location and produces disjoint location sets', () => {
    const firstLocation = location();
    const secondLocation = location('location.test.capacity.consultation-liaison');
    const first = expectCompiled(
      request({
        selectedLocation: firstLocation,
        selectedProfile: profile(firstLocation),
        owned: [],
        assigned: [],
        requestId: 'location-patient-slot-capacity-request.test.first',
      }),
    );
    const second = expectCompiled(
      request({
        selectedLocation: secondLocation,
        selectedProfile: profile(secondLocation),
        owned: [],
        assigned: [],
        requestId: 'location-patient-slot-capacity-request.test.second',
      }),
    );

    expect(
      first.slotCoordinates.every(
        (entry) => entry.slotCoordinate.locationRef.id === firstLocation.id,
      ),
    ).toBe(true);
    expect(
      second.slotCoordinates.every(
        (entry) => entry.slotCoordinate.locationRef.id === secondLocation.id,
      ),
    ).toBe(true);
    expect(
      first.slotCoordinates
        .map((entry) => entry.slotCoordinate.id)
        .filter((id) => second.slotCoordinates.some((entry) => entry.slotCoordinate.id === id)),
    ).toEqual([]);
  });

  it('projects only relevant capacity ownership and rejects unprojected references', () => {
    const selectedProfile = profile();
    const projected = projectLocationPatientSlotCapacityOwnershipContext({
      schemaVersion: 1,
      clinicStateId: 'clinic-state.test.capacity',
      ownedCapacityUpgradeRefs: [
        { id: 'upgrade.test.unrelated-equipment', contentVersion: '9.0.0' },
        upgradeB,
        upgradeA,
      ],
      capacityProfile: selectedProfile,
    });
    expect(projected.ownedCapacityUpgradeRefs).toEqual([upgradeA, upgradeB]);

    const invalid = {
      ...request(),
      ownershipContext: {
        ...projected,
        ownedCapacityUpgradeRefs: [
          ...projected.ownedCapacityUpgradeRefs,
          { id: 'upgrade.test.unrelated-equipment', contentVersion: '9.0.0' },
        ],
      },
    };
    expect(compileLocationPatientSlotCapacity(invalid)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('rejects strict extras, stale references, assignment without ownership, and location drift', () => {
    expect(compileLocationPatientSlotCapacity({ ...request(), unexpected: true })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const notOwned = request({ owned: [], assigned: [upgradeA] });
    expect(compileLocationPatientSlotCapacity(notOwned)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const stale = request();
    stale.assignedCapacityUpgradeRefs[0] = {
      id: upgradeA.id,
      contentVersion: '2.0.0',
    };
    expect(compileLocationPatientSlotCapacity(stale)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const drifted = request();
    drifted.location = { ...drifted.location, label: 'Changed location payload' };
    expect(compileLocationPatientSlotCapacity(drifted)).toMatchObject({
      ok: false,
      error: { code: 'LOCATION_CONTEXT_MISMATCH' },
    });
  });

  it('replays deterministically, normalizes set order, and never mutates input', () => {
    const selectedProfile = {
      ...profile(),
      upgradeContributions: [...profile().upgradeContributions].reverse(),
    };
    const unordered = request({
      selectedProfile,
      owned: [upgradeB, upgradeA],
      assigned: [upgradeA],
    });
    const before = structuredClone(unordered);
    const first = expectCompiled(unordered);
    const second = expectCompiled(unordered);

    expect(unordered).toEqual(before);
    expect(first).toEqual(second);
    expect(first.capacityProfileFingerprint).toBe(
      fingerprintLocationPatientSlotCapacityProfile(profile()),
    );
    expect(verifyLocationPatientSlotCapacityIntegrity(first)).toEqual({
      ok: true,
      value: first,
    });
    expect(
      verifyLocationPatientSlotCapacityContext({
        artifact: first,
        currentRequest: unordered,
      }),
    ).toEqual({ ok: true, value: first });
  });

  it('rejects malformed, obsolete, replay-tampered, and stale-context artifacts', () => {
    const currentRequest = request();
    const artifact = expectCompiled(currentRequest);

    const malformed = structuredClone(artifact);
    malformed.totalSlotCount += 1;
    expect(verifyLocationPatientSlotCapacityIntegrity(malformed)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });

    const obsolete = structuredClone(artifact);
    obsolete.compilerVersion = '99.0.0';
    expect(verifyLocationPatientSlotCapacityIntegrity(obsolete)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_COMPILER_VERSION' },
    });

    const replayTampered = structuredClone(artifact);
    replayTampered.compileRequest.ownershipContext.clinicStateId =
      'clinic-state.test.capacity.changed';
    expect(verifyLocationPatientSlotCapacityIntegrity(replayTampered)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const staleContext = request({ owned: [upgradeA], assigned: [upgradeA] });
    expect(
      verifyLocationPatientSlotCapacityContext({
        artifact,
        currentRequest: staleContext,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });

  it('rejects duplicate profile identities before compilation', () => {
    const duplicate = profile();
    duplicate.upgradeContributions[1] = {
      ...duplicate.upgradeContributions[1]!,
      id: duplicate.upgradeContributions[0]!.id,
    };
    expect(LocationPatientSlotCapacityProfileSchema.safeParse(duplicate).success).toBe(false);
    expect(
      LocationPatientSlotCapacityCompileRequestSchema.safeParse(
        request({ selectedProfile: duplicate }),
      ).success,
    ).toBe(false);
  });
});
