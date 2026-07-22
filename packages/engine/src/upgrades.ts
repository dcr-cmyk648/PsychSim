import {
  ClinicStateSchema,
  type CatalogBundle,
  type ClinicState,
  type UpgradeDefinition,
} from '@psychsim/schemas';

import { err, ok, type Result } from './result';
import { resolveServiceFulfillment } from './services';

export type UpgradeBlockerCode =
  | 'already_owned'
  | 'insufficient_points'
  | 'lifetime_points'
  | 'facility_catalog'
  | 'facility_tier'
  | 'department'
  | 'prerequisite'
  | 'practice_mode';

export interface UpgradeBlocker {
  code: UpgradeBlockerCode;
  message: string;
}

export interface UpgradeServiceEconomics {
  serviceId: string;
  serviceLabel: string;
  currentMethodId: string;
  currentMethodLabel: string;
  currentPerUseCost: number;
  projectedMethodId: string;
  projectedMethodLabel: string;
  projectedPerUseCost: number;
  outsidePerUseCost: number | null;
  estimatedSavingsPerUse: number;
  externalCostAvoidedPerUse: number;
}

export interface UpgradeOffer {
  upgrade: UpgradeDefinition;
  owned: boolean;
  canPurchase: boolean;
  blockers: readonly UpgradeBlocker[];
  serviceEconomics: readonly UpgradeServiceEconomics[];
  estimatedSavingsPerUse: number | null;
  approximateBreakEvenUses: number | null;
}

const addUnique = (current: readonly string[], additions: readonly string[]): string[] => [
  ...new Set([...current, ...additions]),
];

const previewUpgradeBenefits = (clinic: ClinicState, upgrade: UpgradeDefinition): ClinicState =>
  ClinicStateSchema.parse({
    ...clinic,
    capabilities: addUnique(clinic.capabilities, upgrade.grantsCapabilities),
    formularyIds: addUnique(clinic.formularyIds, upgrade.grantsFormularyIds),
    ownedEquipmentIds:
      upgrade.kind === 'equipment'
        ? addUnique(clinic.ownedEquipmentIds, [upgrade.id])
        : clinic.ownedEquipmentIds,
  });

const purchaseBlockers = (
  clinic: ClinicState,
  upgrade: UpgradeDefinition,
  catalogs: CatalogBundle,
): UpgradeBlocker[] => {
  const blockers: UpgradeBlocker[] = [];
  const facility = catalogs.facilities.find((candidate) => candidate.id === clinic.facilityId);
  if (clinic.ownedUpgradeIds.includes(upgrade.id)) {
    blockers.push({ code: 'already_owned', message: 'Already owned.' });
  }
  if (clinic.debugUnlocksAllProgression) {
    blockers.push({ code: 'practice_mode', message: 'Practice modes cannot change the clinic.' });
  }
  if (clinic.clinicPoints < upgrade.purchaseCost) {
    blockers.push({
      code: 'insufficient_points',
      message: `Requires ${upgrade.purchaseCost.toLocaleString()} points; ${clinic.clinicPoints.toLocaleString()} available.`,
    });
  }
  if (clinic.lifetimePointsEarned < upgrade.minimumLifetimePoints) {
    blockers.push({
      code: 'lifetime_points',
      message: `Requires ${upgrade.minimumLifetimePoints.toLocaleString()} lifetime points.`,
    });
  }
  if (!facility?.allowedUpgradeIds.includes(upgrade.id)) {
    blockers.push({
      code: 'facility_catalog',
      message: 'This facility does not permit the upgrade.',
    });
  }
  if (!upgrade.allowedFacilityTiers.includes(clinic.facilityTier)) {
    blockers.push({ code: 'facility_tier', message: 'Facility tier requirement is not met.' });
  }
  if (
    upgrade.requiredDepartmentId &&
    !clinic.departmentIds.includes(upgrade.requiredDepartmentId)
  ) {
    blockers.push({
      code: 'department',
      message: `Requires department ${upgrade.requiredDepartmentId}.`,
    });
  }
  const missingPrerequisites = upgrade.prerequisiteUpgradeIds.filter(
    (id) => !clinic.ownedUpgradeIds.includes(id),
  );
  if (missingPrerequisites.length > 0) {
    blockers.push({
      code: 'prerequisite',
      message: `Requires ${missingPrerequisites.join(', ')}.`,
    });
  }
  return blockers;
};

export const getUpgradeOffer = (
  clinic: ClinicState,
  upgradeId: string,
  catalogs: CatalogBundle,
): Result<UpgradeOffer> => {
  const upgrade = catalogs.upgrades.find((candidate) => candidate.id === upgradeId);
  if (!upgrade) {
    return err({ code: 'UPGRADE_NOT_FOUND', message: `Unknown upgrade: ${upgradeId}` });
  }
  const projectedClinic = previewUpgradeBenefits(clinic, upgrade);
  const serviceEconomics = upgrade.serviceIds.flatMap((serviceId) => {
    const current = resolveServiceFulfillment(
      serviceId,
      clinic,
      clinic.activeLocationId,
      catalogs.services,
      catalogs.locations,
    );
    const projected = resolveServiceFulfillment(
      serviceId,
      projectedClinic,
      projectedClinic.activeLocationId,
      catalogs.services,
      catalogs.locations,
    );
    const service = catalogs.services.find((candidate) => candidate.id === serviceId);
    if (!current.ok || !projected.ok || !service) return [];
    const outsideCosts = service.fulfillmentMethods
      .filter(
        (method) =>
          method.kind === 'outside_referral' &&
          (!method.allowedLocationIds ||
            method.allowedLocationIds.includes(clinic.activeLocationId)),
      )
      .map((method) => method.operatingCost);
    const outsidePerUseCost = outsideCosts.length > 0 ? Math.min(...outsideCosts) : null;
    return [
      {
        serviceId,
        serviceLabel: service.label,
        currentMethodId: current.value.method.id,
        currentMethodLabel: current.value.method.label,
        currentPerUseCost: current.value.method.operatingCost,
        projectedMethodId: projected.value.method.id,
        projectedMethodLabel: projected.value.method.label,
        projectedPerUseCost: projected.value.method.operatingCost,
        outsidePerUseCost,
        estimatedSavingsPerUse: Math.max(
          0,
          current.value.method.operatingCost - projected.value.method.operatingCost,
        ),
        externalCostAvoidedPerUse: projected.value.externalCostAvoided,
      },
    ];
  });
  const estimatedSavingsPerUse =
    serviceEconomics.length > 0
      ? serviceEconomics.reduce((total, item) => total + item.estimatedSavingsPerUse, 0)
      : null;
  const approximateBreakEvenUses =
    estimatedSavingsPerUse && estimatedSavingsPerUse > 0
      ? Math.ceil(upgrade.purchaseCost / estimatedSavingsPerUse)
      : null;
  const blockers = purchaseBlockers(clinic, upgrade, catalogs);
  return ok({
    upgrade,
    owned: clinic.ownedUpgradeIds.includes(upgrade.id),
    canPurchase: blockers.length === 0,
    blockers,
    serviceEconomics,
    estimatedSavingsPerUse,
    approximateBreakEvenUses,
  });
};

export const purchaseUpgrade = (
  clinic: ClinicState,
  upgradeId: string,
  catalogs: CatalogBundle,
): Result<ClinicState> => {
  const offer = getUpgradeOffer(clinic, upgradeId, catalogs);
  if (!offer.ok) return offer;
  if (!offer.value.canPurchase) {
    const blocker = offer.value.blockers[0]!;
    const code =
      blocker.code === 'already_owned'
        ? 'UPGRADE_ALREADY_OWNED'
        : blocker.code === 'insufficient_points'
          ? 'INSUFFICIENT_POINTS'
          : blocker.code === 'prerequisite'
            ? 'UPGRADE_PREREQUISITE_MISSING'
            : blocker.code === 'practice_mode'
              ? 'UPGRADE_PRACTICE_MODE'
              : 'UPGRADE_NOT_ALLOWED';
    return err({ code, message: blocker.message });
  }
  const upgraded = previewUpgradeBenefits(clinic, offer.value.upgrade);
  return ok(
    ClinicStateSchema.parse({
      ...upgraded,
      clinicPoints: clinic.clinicPoints - offer.value.upgrade.purchaseCost,
      lifetimePointsEarned: clinic.lifetimePointsEarned,
      ownedUpgradeIds: addUnique(clinic.ownedUpgradeIds, [offer.value.upgrade.id]),
    }),
  );
};
