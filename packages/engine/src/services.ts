import type {
  ClinicState,
  LocationDefinition,
  ServiceDefinition,
  ServiceFulfillmentMethod,
} from '@psychsim/schemas';

import { err, ok, type Result } from './result';

export interface ResolvedServiceFulfillment {
  service: ServiceDefinition;
  method: ServiceFulfillmentMethod;
  externalCostAvoided: number;
}

const methodAvailable = (
  method: ServiceFulfillmentMethod,
  clinicState: ClinicState,
  capabilities: ReadonlySet<string>,
  locationId: string,
  informationActionId: string | undefined,
): boolean =>
  method.requiredCapabilities.every((capability) => capabilities.has(capability)) &&
  (!method.allowedLocationIds || method.allowedLocationIds.includes(locationId)) &&
  (!method.requiredStaffUpgradeId ||
    (informationActionId !== undefined &&
      clinicState.ownedUpgradeIds.includes(method.requiredStaffUpgradeId) &&
      clinicState.staffConfigurations.some(
        (configuration) =>
          configuration.staffUpgradeId === method.requiredStaffUpgradeId &&
          configuration.automaticInformationActionIds.includes(informationActionId),
      )));

export const resolveServiceFulfillment = (
  serviceId: string,
  clinicState: ClinicState,
  locationId: string,
  services: readonly ServiceDefinition[],
  locations: readonly LocationDefinition[],
  context: { informationActionId?: string } = {},
): Result<ResolvedServiceFulfillment> => {
  const service = services.find((candidate) => candidate.id === serviceId);
  if (!service) {
    return err({ code: 'SERVICE_NOT_FOUND', message: `Unknown service: ${serviceId}` });
  }
  const location = locations.find((candidate) => candidate.id === locationId);
  if (!location) {
    return err({ code: 'LOCATION_NOT_FOUND', message: `Unknown location: ${locationId}` });
  }
  const capabilities = new Set([...clinicState.capabilities, ...location.capabilities]);
  const available = [...service.fulfillmentMethods]
    .filter((method) =>
      methodAvailable(method, clinicState, capabilities, locationId, context.informationActionId),
    )
    .sort(
      (left, right) => left.operatingCost - right.operatingCost || left.id.localeCompare(right.id),
    );
  const method = available[0];
  if (!method) {
    return err({
      code: 'SERVICE_UNAVAILABLE',
      message: `${service.label} has no available fulfillment method at ${location.label}.`,
    });
  }
  const cheapestExternalCost = available
    .filter((candidate) => candidate.kind === 'outside_referral')
    .reduce<
      number | undefined
    >((lowest, candidate) => (lowest === undefined ? candidate.operatingCost : Math.min(lowest, candidate.operatingCost)), undefined);
  return ok({
    service,
    method,
    externalCostAvoided: Math.max(
      0,
      (cheapestExternalCost ?? method.operatingCost) - method.operatingCost,
    ),
  });
};
