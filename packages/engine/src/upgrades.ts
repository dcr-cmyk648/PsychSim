import {
  ClinicStateSchema,
  type CatalogBundle,
  type ClinicState,
  type FacilityDefinition,
  type UpgradeDefinition,
} from '@psychsim/schemas';

import { resolveClinicForFacility } from './progression';
import { err, ok, type Result } from './result';
import { calculateSatisfactionState } from './satisfaction';
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
  targetFacility: FacilityDefinition | null;
  satisfactionPreview: {
    pointsAdded: number;
    rawPointsBefore: number;
    rawPointsAfter: number;
    multiplierBefore: number;
    multiplierAfter: number;
    multiplierCap: number;
  } | null;
}

const addUnique = (current: readonly string[], additions: readonly string[]): string[] => [
  ...new Set([...current, ...additions]),
];

export const getPurchasableUpgradeDefinitions = (
  catalogs: CatalogBundle,
): readonly UpgradeDefinition[] => [...catalogs.upgrades, ...catalogs.decor.items];

const previewUpgradeBenefits = (
  clinic: ClinicState,
  upgrade: UpgradeDefinition,
  catalogs: CatalogBundle,
): ClinicState => {
  const movedClinic =
    upgrade.kind === 'facility' && upgrade.targetFacilityId
      ? resolveClinicForFacility(clinic, upgrade.targetFacilityId, catalogs)
      : ok(clinic);
  if (!movedClinic.ok) return clinic;
  const rawSatisfaction =
    movedClinic.value.satisfaction +
    (upgrade.kind === 'decor' ? (upgrade.satisfactionPoints ?? 0) : 0);
  const satisfaction = calculateSatisfactionState(rawSatisfaction, catalogs.decor.satisfaction);
  return ClinicStateSchema.parse({
    ...movedClinic.value,
    capabilities: addUnique(movedClinic.value.capabilities, upgrade.grantsCapabilities),
    formularyIds: addUnique(movedClinic.value.formularyIds, upgrade.grantsFormularyIds),
    ownedEquipmentIds:
      upgrade.kind === 'equipment'
        ? addUnique(clinic.ownedEquipmentIds, [upgrade.id])
        : clinic.ownedEquipmentIds,
    satisfaction: satisfaction.rawPoints,
    satisfactionMultiplier: satisfaction.multiplier,
  });
};

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
  if (upgrade.kind === 'facility') {
    const target = upgrade.targetFacilityId
      ? catalogs.facilities.find((candidate) => candidate.id === upgrade.targetFacilityId)
      : undefined;
    if (!target) {
      blockers.push({ code: 'facility_catalog', message: 'Target facility is not configured.' });
    }
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
  const upgrade = getPurchasableUpgradeDefinitions(catalogs).find(
    (candidate) => candidate.id === upgradeId,
  );
  if (!upgrade) {
    return err({ code: 'UPGRADE_NOT_FOUND', message: `Unknown upgrade: ${upgradeId}` });
  }
  const owned = clinic.ownedUpgradeIds.includes(upgrade.id);
  const projectedClinic = owned ? clinic : previewUpgradeBenefits(clinic, upgrade, catalogs);
  const serviceEconomics = (upgrade.kind === 'staff' ? [] : upgrade.serviceIds).flatMap(
    (serviceId) => {
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
    },
  );
  const estimatedSavingsPerUse =
    serviceEconomics.length > 0
      ? serviceEconomics.reduce((total, item) => total + item.estimatedSavingsPerUse, 0)
      : null;
  const approximateBreakEvenUses =
    estimatedSavingsPerUse && estimatedSavingsPerUse > 0
      ? Math.ceil(upgrade.purchaseCost / estimatedSavingsPerUse)
      : null;
  const blockers = purchaseBlockers(clinic, upgrade, catalogs);
  const targetFacility = upgrade.targetFacilityId
    ? (catalogs.facilities.find((candidate) => candidate.id === upgrade.targetFacilityId) ?? null)
    : null;
  const satisfactionPreview =
    upgrade.kind === 'decor'
      ? {
          pointsAdded: upgrade.satisfactionPoints ?? 0,
          rawPointsBefore: clinic.satisfaction,
          rawPointsAfter: projectedClinic.satisfaction,
          multiplierBefore: clinic.satisfactionMultiplier,
          multiplierAfter: projectedClinic.satisfactionMultiplier,
          multiplierCap: catalogs.decor.satisfaction.multiplierCap,
        }
      : null;
  return ok({
    upgrade,
    owned,
    canPurchase: blockers.length === 0,
    blockers,
    serviceEconomics,
    estimatedSavingsPerUse,
    approximateBreakEvenUses,
    targetFacility,
    satisfactionPreview,
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
  const upgraded = previewUpgradeBenefits(clinic, offer.value.upgrade, catalogs);
  const staffConfigurations =
    offer.value.upgrade.kind === 'staff'
      ? [
          ...upgraded.staffConfigurations,
          {
            staffUpgradeId: offer.value.upgrade.id,
            automaticInformationActionIds: [],
          },
        ]
      : upgraded.staffConfigurations;
  return ok(
    ClinicStateSchema.parse({
      ...upgraded,
      clinicPoints: clinic.clinicPoints - offer.value.upgrade.purchaseCost,
      lifetimePointsEarned: clinic.lifetimePointsEarned,
      ownedUpgradeIds: addUnique(clinic.ownedUpgradeIds, [offer.value.upgrade.id]),
      staffConfigurations,
    }),
  );
};

export const configureStaffAutomation = (
  clinic: ClinicState,
  staffUpgradeId: string,
  automaticInformationActionIds: readonly string[],
  catalogs: CatalogBundle,
): Result<ClinicState> => {
  if (clinic.debugUnlocksAllProgression) {
    return err({
      code: 'UPGRADE_PRACTICE_MODE',
      message: 'Practice modes cannot change the clinic.',
    });
  }
  const upgrade = catalogs.upgrades.find((candidate) => candidate.id === staffUpgradeId);
  if (
    !upgrade ||
    upgrade.kind !== 'staff' ||
    !upgrade.staffAutomation ||
    !clinic.ownedUpgradeIds.includes(staffUpgradeId)
  ) {
    return err({
      code: 'STAFF_NOT_OWNED',
      message: 'That staff workflow is not owned by this clinic.',
    });
  }
  if (new Set(automaticInformationActionIds).size !== automaticInformationActionIds.length) {
    return err({
      code: 'STAFF_CONFIGURATION_DUPLICATE',
      message: 'A routine intake action cannot be selected twice.',
    });
  }
  const allowlist = new Set(upgrade.staffAutomation.eligibleInformationActionIds);
  if (
    automaticInformationActionIds.length > upgrade.staffAutomation.maximumAutomaticActions ||
    automaticInformationActionIds.some((id) => !allowlist.has(id))
  ) {
    return err({
      code: 'STAFF_CONFIGURATION_INVALID',
      message: `Choose no more than ${upgrade.staffAutomation.maximumAutomaticActions} allowed routine actions.`,
    });
  }
  const assignedElsewhere = clinic.staffConfigurations
    .filter((configuration) => configuration.staffUpgradeId !== staffUpgradeId)
    .flatMap((configuration) => configuration.automaticInformationActionIds);
  if (automaticInformationActionIds.some((id) => assignedElsewhere.includes(id))) {
    return err({
      code: 'STAFF_CONFIGURATION_CONFLICT',
      message: 'A routine action cannot be assigned to more than one staff workflow.',
    });
  }
  const normalizedIds = upgrade.staffAutomation.eligibleInformationActionIds.filter((id) =>
    automaticInformationActionIds.includes(id),
  );
  const staffConfigurations = [
    ...clinic.staffConfigurations.filter(
      (configuration) => configuration.staffUpgradeId !== staffUpgradeId,
    ),
    {
      staffUpgradeId,
      automaticInformationActionIds: normalizedIds,
    },
  ];
  return ok(ClinicStateSchema.parse({ ...clinic, staffConfigurations }));
};
