import {
  EncounterOperationalAdmissionArtifactSchema,
  GeneratedEncounterReplaySnapshotSchema,
  GeneratedEncounterTreatmentSelectionSchema,
  GeneratedInformationPurchaseInputSchema,
  GeneratedInformationPurchaseSnapshotSchema,
  GeneratedServicePricingInputSchema,
  GeneratedTreatmentChargeSchema,
  type CatalogInstanceVersionedReference,
  type EncounterOperationalAdmissionArtifact,
  type GeneratedEncounterAttemptFingerprint,
  type GeneratedEncounterReplaySnapshot,
  type GeneratedEncounterTreatmentSelection,
  type GeneratedInformationPurchaseInput,
  type GeneratedInformationPurchaseSnapshot,
  type GeneratedServicePricingInput,
  type GeneratedServicePricingOwnerSnapshot,
  type GeneratedTreatmentCharge,
  type GeneratedTreatmentPricingOwnerSnapshot,
  type OperationalServiceDefinition,
  type ServiceDefinition,
  type ServiceFulfillmentMethod,
  type TreatmentOption,
} from '@psychsim/schemas';

import { verifyEncounterOperationalAdmissionIntegrity } from './encounter-operational-admission-compiler';

export const NATIVE_GENERATED_SERVICE_QUOTE_COMPILER_VERSION = '1.0.0';

export type GeneratedServiceQuoteCompileErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_OPERATIONAL_ADMISSION'
  | 'MISSING_TREATMENT_OWNER'
  | 'STALE_TREATMENT_OWNER'
  | 'MISSING_SERVICE_OWNER'
  | 'EXTRA_SERVICE_OWNER'
  | 'STALE_SERVICE_OWNER'
  | 'SERVICE_TOPOLOGY_MISMATCH'
  | 'MISSING_AVAILABLE_METHOD'
  | 'UNEQUAL_METHOD_QUALITY'
  | 'INVALID_OUTPUT';

export interface GeneratedInformationActionPricingHorizonEntry {
  readonly informationActionId: string;
  readonly serviceRef: CatalogInstanceVersionedReference;
  readonly servicePricingOwnerFingerprint: GeneratedEncounterAttemptFingerprint;
  readonly availableFulfillmentMethodIds: readonly string[];
}

export interface GeneratedTreatmentPricingHorizonEntry {
  readonly treatmentRef: CatalogInstanceVersionedReference;
  readonly treatmentPricingOwnerFingerprint: GeneratedEncounterAttemptFingerprint;
  readonly actionTarget:
    | { readonly kind: 'intervention'; readonly interventionId: string }
    | { readonly kind: 'disposition'; readonly dispositionId: string };
  readonly fulfillmentServiceRef: CatalogInstanceVersionedReference | null;
  readonly servicePricingOwnerFingerprint: GeneratedEncounterAttemptFingerprint | null;
  readonly availableFulfillmentMethodIds: readonly string[];
}

export type GeneratedServiceQuoteCompileResult =
  | {
      readonly ok: true;
      readonly value: {
        readonly servicePricingOwners: readonly GeneratedServicePricingOwnerSnapshot[];
        readonly treatmentPricingOwners: readonly GeneratedTreatmentPricingOwnerSnapshot[];
        readonly informationActionPricingHorizon: readonly GeneratedInformationActionPricingHorizonEntry[];
        readonly treatmentPricingHorizon: readonly GeneratedTreatmentPricingHorizonEntry[];
      };
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: GeneratedServiceQuoteCompileErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

type GeneratedInformationPurchaseQuoteErrorCode =
  | 'INVALID_INPUT'
  | 'ACTION_OUTSIDE_PRICING_HORIZON'
  | 'TREATMENT_OUTSIDE_PRICING_HORIZON'
  | 'TREATMENT_PRICING_OWNER_MISSING'
  | 'TREATMENT_PRICING_OWNER_STALE'
  | 'SERVICE_PRICING_OWNER_MISSING'
  | 'SERVICE_PRICING_OWNER_STALE'
  | 'AVAILABLE_METHOD_MISSING'
  | 'UNEQUAL_METHOD_QUALITY'
  | 'INVALID_OUTPUT';

type GeneratedInformationPurchaseQuoteFailure = {
  readonly ok: false;
  readonly error: {
    readonly code: GeneratedInformationPurchaseQuoteErrorCode;
    readonly message: string;
    readonly contentIds: readonly string[];
  };
};

export type NativeGeneratedServiceQuoteResult =
  | {
      readonly ok: true;
      readonly value: {
        readonly method: ServiceFulfillmentMethod;
        readonly externalCostAvoided: number;
        readonly upgradeSavings: number;
      };
    }
  | GeneratedInformationPurchaseQuoteFailure;

export type GeneratedInformationPurchaseQuoteResult =
  | { readonly ok: true; readonly value: GeneratedInformationPurchaseSnapshot }
  | GeneratedInformationPurchaseQuoteFailure;

export type GeneratedTreatmentChargeQuoteResult =
  | { readonly ok: true; readonly value: readonly GeneratedTreatmentCharge[] }
  | GeneratedInformationPurchaseQuoteFailure;

const compareStrings = (left: string, right: string): number =>
  left === right ? 0 : left < right ? -1 : 1;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

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

const fingerprint = (scope: string, value: unknown): GeneratedEncounterAttemptFingerprint =>
  `fingerprint.generated-encounter-attempt.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalizeObjectKeys(value)))}`;

const normalizeMethod = (method: ServiceFulfillmentMethod): ServiceFulfillmentMethod => ({
  ...method,
  requiredCapabilities: uniqueSorted(method.requiredCapabilities),
  ...(method.allowedLocationIds
    ? { allowedLocationIds: uniqueSorted(method.allowedLocationIds) }
    : {}),
});

const normalizeService = (service: ServiceDefinition): ServiceDefinition => ({
  ...service,
  fulfillmentMethods: [...service.fulfillmentMethods]
    .map(normalizeMethod)
    .sort((left, right) => compareStrings(left.id, right.id)),
});

const normalizeTreatment = (treatment: TreatmentOption): TreatmentOption => ({
  ...treatment,
  searchAliases: uniqueSorted(treatment.searchAliases),
  requiredCapabilities: uniqueSorted(treatment.requiredCapabilities),
});

export const projectServicePricingOwnerToOperationalDefinition = (
  service: ServiceDefinition,
): OperationalServiceDefinition => ({
  schemaVersion: service.schemaVersion,
  contentVersion: service.contentVersion,
  id: service.id,
  fulfillmentMethods: service.fulfillmentMethods.map((method) => ({
    id: method.id,
    requiredCapabilities: [...method.requiredCapabilities],
    ...(method.requiredStaffUpgradeId
      ? { requiredStaffUpgradeId: method.requiredStaffUpgradeId }
      : {}),
    ...(method.allowedLocationIds ? { allowedLocationIds: [...method.allowedLocationIds] } : {}),
  })),
});

export const fingerprintGeneratedServicePricingOwner = (
  service: ServiceDefinition,
): GeneratedEncounterAttemptFingerprint =>
  fingerprint('service-pricing-owner', normalizeService(service));

export const fingerprintGeneratedTreatmentPricingOwner = (
  treatment: TreatmentOption,
): GeneratedEncounterAttemptFingerprint =>
  fingerprint('treatment-pricing-owner', normalizeTreatment(treatment));

const fail = (
  code: GeneratedServiceQuoteCompileErrorCode,
  message: string,
  contentIds: readonly string[] = [],
): GeneratedServiceQuoteCompileResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const actionSpecificMethodIds = (input: {
  readonly actionId: string;
  readonly service: ServiceDefinition;
  readonly mechanicallyAvailableMethodIds: readonly string[];
  readonly operationalAdmission: EncounterOperationalAdmissionArtifact;
}): string[] => {
  const staffContexts =
    input.operationalAdmission.compileRequest.selectedLocationResourceArtifact.staffContexts;
  const mechanicallyAvailable = new Set(input.mechanicallyAvailableMethodIds);
  return input.service.fulfillmentMethods
    .filter((method) => {
      if (!mechanicallyAvailable.has(method.id)) return false;
      if (!method.requiredStaffUpgradeId) return true;
      return staffContexts.some(
        (context) =>
          context.staffUpgradeRef.id === method.requiredStaffUpgradeId &&
          context.automaticInformationActionIds.includes(input.actionId),
      );
    })
    .map((method) => method.id)
    .sort(compareStrings);
};

const assertEquivalentAvailableMethods = (
  actionId: string,
  service: ServiceDefinition,
  availableMethodIds: readonly string[],
): GeneratedServiceQuoteCompileResult | null => {
  const available = new Set(availableMethodIds);
  const qualityModifiers = new Set(
    service.fulfillmentMethods
      .filter((method) => available.has(method.id))
      .map((method) => method.qualityModifier),
  );
  if (qualityModifiers.size > 1) {
    return fail(
      'UNEQUAL_METHOD_QUALITY',
      `Information action ${actionId} has available fulfillment methods with unequal quality modifiers and requires an explicit selection policy.`,
      [actionId, service.id, ...availableMethodIds],
    );
  }
  return null;
};

export const compileGeneratedInformationServicePricing = (input: {
  readonly servicePricing: GeneratedServicePricingInput;
  readonly operationalAdmission: EncounterOperationalAdmissionArtifact;
  readonly informationActionIds: readonly string[];
  readonly interventionIds?: readonly string[];
  readonly dispositionIds?: readonly string[];
}): GeneratedServiceQuoteCompileResult => {
  const parsedPricing = GeneratedServicePricingInputSchema.safeParse(input.servicePricing);
  const parsedOperational = EncounterOperationalAdmissionArtifactSchema.safeParse(
    input.operationalAdmission,
  );
  if (!parsedPricing.success || !parsedOperational.success) {
    return fail(
      'INVALID_INPUT',
      'Native generated service pricing requires valid pricing owners and one exact operational-admission artifact.',
    );
  }
  const operationalIntegrity = verifyEncounterOperationalAdmissionIntegrity(parsedOperational.data);
  if (!operationalIntegrity.ok) {
    return fail('INVALID_OPERATIONAL_ADMISSION', operationalIntegrity.error.message, [
      parsedOperational.data.id,
    ]);
  }
  const operational = operationalIntegrity.value;
  const actionIds = uniqueSorted(input.informationActionIds);
  const interventionIds = uniqueSorted(input.interventionIds ?? []);
  const dispositionIds = uniqueSorted(input.dispositionIds ?? []);
  const treatmentIds = uniqueSorted([...interventionIds, ...dispositionIds]);
  if (
    actionIds.length !== input.informationActionIds.length ||
    interventionIds.length !== (input.interventionIds ?? []).length ||
    dispositionIds.length !== (input.dispositionIds ?? []).length ||
    treatmentIds.length !== interventionIds.length + dispositionIds.length
  ) {
    return fail(
      'INVALID_INPUT',
      'A generated pricing horizon requires unique information-action and treatment IDs.',
      [
        ...input.informationActionIds,
        ...(input.interventionIds ?? []),
        ...(input.dispositionIds ?? []),
      ],
    );
  }
  const evaluationsByActionId = new Map(
    operational.informationActionEvaluations.map((evaluation) => [
      evaluation.informationActionId,
      evaluation,
    ]),
  );
  const requiredServiceRefs = actionIds.map((actionId) => {
    const evaluation = evaluationsByActionId.get(actionId);
    return {
      actionId,
      evaluation,
      serviceRef: evaluation?.serviceOwner?.ref ?? null,
    };
  });
  const missingServiceActions = requiredServiceRefs
    .filter(
      ({ evaluation, serviceRef }) =>
        evaluation?.availability !== 'available_at_selected_location' || serviceRef === null,
    )
    .map(({ actionId }) => actionId);
  if (missingServiceActions.length > 0) {
    return fail(
      'MISSING_SERVICE_OWNER',
      'Every priced information action requires one exact available operational service owner.',
      missingServiceActions,
    );
  }
  const treatmentEvaluationsById = new Map(
    operational.treatmentEvaluations.map((evaluation) => [evaluation.treatmentId, evaluation]),
  );
  const treatmentsById = new Map(
    operational.compileRequest.treatments.map((treatment) => [treatment.id, treatment]),
  );
  const requiredTreatmentOwners = [
    ...interventionIds.map((treatmentId) => ({
      treatmentId,
      expectedKind: 'nonmedication' as const,
    })),
    ...dispositionIds.map((treatmentId) => ({
      treatmentId,
      expectedKind: 'disposition' as const,
    })),
  ].map(({ treatmentId, expectedKind }) => {
    const evaluation = treatmentEvaluationsById.get(treatmentId);
    const treatment = treatmentsById.get(treatmentId);
    return { treatmentId, expectedKind, evaluation, treatment };
  });
  const missingTreatmentIds = requiredTreatmentOwners
    .filter(
      ({ expectedKind, evaluation, treatment }) =>
        treatment === undefined ||
        treatment.kind !== expectedKind ||
        evaluation?.expectedKind !== expectedKind ||
        evaluation.availability !== 'available_at_selected_location' ||
        evaluation.treatmentOwner === null,
    )
    .map(({ treatmentId }) => treatmentId);
  if (missingTreatmentIds.length > 0) {
    return fail(
      'MISSING_TREATMENT_OWNER',
      'Every generated treatment-pricing entry requires one exact available operational treatment owner.',
      missingTreatmentIds,
    );
  }
  const treatmentServiceRefs = requiredTreatmentOwners.flatMap(
    ({ treatmentId, treatment, evaluation }) => {
      if (treatment === undefined || evaluation === undefined) return [];
      if (treatment.fulfillmentServiceId === null) {
        return evaluation.fulfillmentServiceOwner === null
          ? []
          : [{ treatmentId, serviceRef: evaluation.fulfillmentServiceOwner.ref }];
      }
      return evaluation.fulfillmentServiceOwner === null
        ? []
        : [{ treatmentId, serviceRef: evaluation.fulfillmentServiceOwner.ref }];
    },
  );
  const missingTreatmentServiceIds = requiredTreatmentOwners
    .filter(
      ({ treatment, evaluation }) =>
        treatment?.fulfillmentServiceId !== null && evaluation?.fulfillmentServiceOwner === null,
    )
    .map(({ treatmentId }) => treatmentId);
  if (missingTreatmentServiceIds.length > 0) {
    return fail(
      'MISSING_SERVICE_OWNER',
      'Every service-backed treatment requires one exact available operational service owner.',
      missingTreatmentServiceIds,
    );
  }
  const requiredServiceIds = uniqueSorted([
    ...requiredServiceRefs.flatMap(({ serviceRef }) =>
      serviceRef === null ? [] : [serviceRef.id],
    ),
    ...treatmentServiceRefs.map(({ serviceRef }) => serviceRef.id),
  ]);
  const normalizedServices = parsedPricing.data.services
    .map(normalizeService)
    .sort((left, right) => compareStrings(left.id, right.id));
  const suppliedServiceIds = normalizedServices.map((service) => service.id);
  const missingServiceIds = requiredServiceIds.filter(
    (serviceId) => !suppliedServiceIds.includes(serviceId),
  );
  const extraServiceIds = suppliedServiceIds.filter(
    (serviceId) => !requiredServiceIds.includes(serviceId),
  );
  if (missingServiceIds.length > 0) {
    return fail(
      'MISSING_SERVICE_OWNER',
      'The generated price horizon is missing a required service owner.',
      missingServiceIds,
    );
  }
  if (extraServiceIds.length > 0) {
    return fail(
      'EXTRA_SERVICE_OWNER',
      'The generated price horizon may retain only services used by this encounter.',
      extraServiceIds,
    );
  }
  const operationalServicesById = new Map(
    operational.compileRequest.services.map((service) => [service.id, service]),
  );
  const servicesById = new Map(normalizedServices.map((service) => [service.id, service]));
  for (const service of normalizedServices) {
    const operationalService = operationalServicesById.get(service.id);
    if (
      operationalService === undefined ||
      operationalService.contentVersion !== service.contentVersion
    ) {
      return fail(
        'STALE_SERVICE_OWNER',
        `Service-pricing owner ${service.id}@${service.contentVersion} does not match the exact operational service version.`,
        [service.id],
      );
    }
    if (
      !sameCanonicalValue(
        projectServicePricingOwnerToOperationalDefinition(service),
        operationalService,
      )
    ) {
      return fail(
        'SERVICE_TOPOLOGY_MISMATCH',
        `Service-pricing owner ${service.id} does not project to the exact operational service topology.`,
        [service.id],
      );
    }
  }
  const informationActionPricingHorizon: GeneratedInformationActionPricingHorizonEntry[] = [];
  for (const { actionId, evaluation, serviceRef } of requiredServiceRefs) {
    if (evaluation === undefined || serviceRef === null) {
      return fail(
        'MISSING_SERVICE_OWNER',
        `Information action ${actionId} lacks an exact operational service owner.`,
        [actionId],
      );
    }
    const service = servicesById.get(serviceRef.id);
    if (service === undefined || service.contentVersion !== serviceRef.contentVersion) {
      return fail(
        'STALE_SERVICE_OWNER',
        `Information action ${actionId} references a missing or stale pricing owner.`,
        [actionId, serviceRef.id],
      );
    }
    const mechanicallyAvailableMethodIds = evaluation.fulfillmentMethods
      .filter((method) => method.availability === 'available_at_selected_location')
      .map((method) => method.methodId);
    const availableFulfillmentMethodIds = actionSpecificMethodIds({
      actionId,
      service,
      mechanicallyAvailableMethodIds,
      operationalAdmission: operational,
    });
    if (availableFulfillmentMethodIds.length === 0) {
      return fail(
        'MISSING_AVAILABLE_METHOD',
        `Information action ${actionId} has no action-specific mechanically available fulfillment method.`,
        [actionId, service.id],
      );
    }
    const equivalenceError = assertEquivalentAvailableMethods(
      actionId,
      service,
      availableFulfillmentMethodIds,
    );
    if (equivalenceError !== null) return equivalenceError;
    informationActionPricingHorizon.push({
      informationActionId: actionId,
      serviceRef,
      servicePricingOwnerFingerprint: fingerprintGeneratedServicePricingOwner(service),
      availableFulfillmentMethodIds,
    });
  }
  const treatmentPricingOwners = requiredTreatmentOwners.map(({ treatment }) => {
    if (treatment === undefined) {
      throw new Error('A required treatment owner disappeared after validation.');
    }
    const normalized = normalizeTreatment(treatment);
    return {
      schemaVersion: 1 as const,
      compilerVersion: NATIVE_GENERATED_SERVICE_QUOTE_COMPILER_VERSION,
      treatment: normalized,
      ownerFingerprint: fingerprintGeneratedTreatmentPricingOwner(normalized),
    };
  });
  const treatmentPricingHorizon: GeneratedTreatmentPricingHorizonEntry[] = [];
  for (const { treatmentId, expectedKind, evaluation, treatment } of requiredTreatmentOwners) {
    if (evaluation === undefined || treatment === undefined) {
      return fail(
        'MISSING_TREATMENT_OWNER',
        `Treatment ${treatmentId} lacks its exact operational owner.`,
        [treatmentId],
      );
    }
    const normalizedTreatment = normalizeTreatment(treatment);
    const actionTarget =
      expectedKind === 'nonmedication'
        ? ({ kind: 'intervention', interventionId: treatmentId } as const)
        : ({ kind: 'disposition', dispositionId: treatmentId } as const);
    if (treatment.fulfillmentServiceId === null) {
      treatmentPricingHorizon.push({
        treatmentRef: {
          id: treatment.id,
          contentVersion: treatment.contentVersion,
        },
        treatmentPricingOwnerFingerprint:
          fingerprintGeneratedTreatmentPricingOwner(normalizedTreatment),
        actionTarget,
        fulfillmentServiceRef: null,
        servicePricingOwnerFingerprint: null,
        availableFulfillmentMethodIds: [],
      });
      continue;
    }
    const serviceRef = evaluation.fulfillmentServiceOwner?.ref;
    const service = serviceRef === undefined ? undefined : servicesById.get(serviceRef.id);
    if (
      serviceRef === undefined ||
      service === undefined ||
      service.contentVersion !== serviceRef.contentVersion ||
      service.id !== treatment.fulfillmentServiceId
    ) {
      return fail(
        'STALE_SERVICE_OWNER',
        `Treatment ${treatmentId} references a missing or stale service-pricing owner.`,
        [treatmentId, treatment.fulfillmentServiceId],
      );
    }
    const availableFulfillmentMethodIds = evaluation.fulfillmentMethods
      .filter((method) => method.availability === 'available_at_selected_location')
      .map((method) => method.methodId)
      .sort(compareStrings);
    if (availableFulfillmentMethodIds.length === 0) {
      return fail(
        'MISSING_AVAILABLE_METHOD',
        `Treatment ${treatmentId} has no mechanically available fulfillment method.`,
        [treatmentId, service.id],
      );
    }
    const equivalenceError = assertEquivalentAvailableMethods(
      treatmentId,
      service,
      availableFulfillmentMethodIds,
    );
    if (equivalenceError !== null) return equivalenceError;
    treatmentPricingHorizon.push({
      treatmentRef: {
        id: treatment.id,
        contentVersion: treatment.contentVersion,
      },
      treatmentPricingOwnerFingerprint:
        fingerprintGeneratedTreatmentPricingOwner(normalizedTreatment),
      actionTarget,
      fulfillmentServiceRef: serviceRef,
      servicePricingOwnerFingerprint: fingerprintGeneratedServicePricingOwner(service),
      availableFulfillmentMethodIds,
    });
  }
  const servicePricingOwners = normalizedServices.map((service) => ({
    schemaVersion: 1 as const,
    compilerVersion: NATIVE_GENERATED_SERVICE_QUOTE_COMPILER_VERSION,
    service,
    ownerFingerprint: fingerprintGeneratedServicePricingOwner(service),
  }));
  return {
    ok: true,
    value: {
      servicePricingOwners,
      treatmentPricingOwners: treatmentPricingOwners.sort((left, right) =>
        compareStrings(left.treatment.id, right.treatment.id),
      ),
      informationActionPricingHorizon: informationActionPricingHorizon.sort((left, right) =>
        compareStrings(left.informationActionId, right.informationActionId),
      ),
      treatmentPricingHorizon: treatmentPricingHorizon.sort((left, right) =>
        compareStrings(left.treatmentRef.id, right.treatmentRef.id),
      ),
    },
  };
};

export const compileGeneratedEncounterServicePricing = (input: {
  readonly servicePricing: GeneratedServicePricingInput;
  readonly operationalAdmission: EncounterOperationalAdmissionArtifact;
  readonly informationActionIds: readonly string[];
  readonly interventionIds: readonly string[];
  readonly dispositionIds: readonly string[];
}): GeneratedServiceQuoteCompileResult => compileGeneratedInformationServicePricing(input);

const quoteFail = (
  code: GeneratedInformationPurchaseQuoteErrorCode,
  message: string,
  contentIds: readonly string[] = [],
): GeneratedInformationPurchaseQuoteFailure => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const availableMethodsFor = (input: {
  readonly actionId: string;
  readonly service: ServiceDefinition;
  readonly availableMethodIds: readonly string[];
}):
  | { readonly ok: true; readonly value: readonly ServiceFulfillmentMethod[] }
  | GeneratedInformationPurchaseQuoteFailure => {
  const byId = new Map(input.service.fulfillmentMethods.map((method) => [method.id, method]));
  const available = input.availableMethodIds.flatMap((methodId) => {
    const method = byId.get(methodId);
    return method ? [method] : [];
  });
  if (available.length !== input.availableMethodIds.length) {
    return quoteFail(
      'AVAILABLE_METHOD_MISSING',
      `Priced item ${input.actionId} references a fulfillment method absent from its frozen pricing owner.`,
      [input.actionId, input.service.id, ...input.availableMethodIds],
    );
  }
  if (new Set(available.map((method) => method.qualityModifier)).size > 1) {
    return quoteFail(
      'UNEQUAL_METHOD_QUALITY',
      `Priced item ${input.actionId} has unequal frozen fulfillment quality and cannot be quoted automatically.`,
      [input.actionId, input.service.id],
    );
  }
  return {
    ok: true,
    value: available.sort(
      (left, right) =>
        left.operatingCost - right.operatingCost || compareStrings(left.id, right.id),
    ),
  };
};

export const resolveNativeGeneratedServiceQuote = (input: {
  readonly actionId: string;
  readonly service: ServiceDefinition;
  readonly availableMethodIds: readonly string[];
}): NativeGeneratedServiceQuoteResult => {
  const available = availableMethodsFor(input);
  if (!available.ok) return available;
  const method = available.value[0];
  if (method === undefined) {
    return quoteFail(
      'AVAILABLE_METHOD_MISSING',
      `Priced item ${input.actionId} has no frozen available fulfillment method.`,
      [input.actionId, input.service.id],
    );
  }
  const cheapestExternalCost = available.value
    .filter((candidate) => candidate.kind === 'outside_referral')
    .reduce<
      number | undefined
    >((lowest, candidate) => (lowest === undefined ? candidate.operatingCost : Math.min(lowest, candidate.operatingCost)), undefined);
  const cheapestNonStaffCost = available.value
    .filter((candidate) => !candidate.requiredStaffUpgradeId)
    .reduce<
      number | undefined
    >((lowest, candidate) => (lowest === undefined ? candidate.operatingCost : Math.min(lowest, candidate.operatingCost)), undefined);
  return {
    ok: true,
    value: {
      method,
      externalCostAvoided: Math.max(
        0,
        (cheapestExternalCost ?? method.operatingCost) - method.operatingCost,
      ),
      upgradeSavings: method.requiredStaffUpgradeId
        ? Math.max(0, (cheapestNonStaffCost ?? method.operatingCost) - method.operatingCost)
        : 0,
    },
  };
};

export const quoteGeneratedInformationPurchase = (input: {
  readonly purchase: GeneratedInformationPurchaseInput;
  readonly resultBindingId: string;
  readonly replaySnapshot: GeneratedEncounterReplaySnapshot;
}): GeneratedInformationPurchaseQuoteResult => {
  const purchase = GeneratedInformationPurchaseInputSchema.safeParse(input.purchase);
  const snapshot = GeneratedEncounterReplaySnapshotSchema.safeParse(input.replaySnapshot);
  if (!purchase.success || !snapshot.success) {
    return quoteFail(
      'INVALID_INPUT',
      'A generated information quote requires a strict purchase command and valid frozen replay snapshot.',
    );
  }
  const runtime = snapshot.data.informationActionRuntimeHorizon.find(
    (entry) => entry.informationActionId === purchase.data.informationActionId,
  );
  if (runtime === undefined) {
    return quoteFail(
      'ACTION_OUTSIDE_PRICING_HORIZON',
      `Information action ${purchase.data.informationActionId} is outside the frozen pricing horizon.`,
      [purchase.data.id, purchase.data.informationActionId],
    );
  }
  const owner = snapshot.data.servicePricingOwners.find(
    (entry) => entry.service.id === runtime.serviceRef.id,
  );
  if (owner === undefined) {
    return quoteFail(
      'SERVICE_PRICING_OWNER_MISSING',
      `Information action ${purchase.data.informationActionId} lacks its frozen service-pricing owner.`,
      [purchase.data.informationActionId, runtime.serviceRef.id],
    );
  }
  const expectedFingerprint = fingerprintGeneratedServicePricingOwner(owner.service);
  if (
    owner.compilerVersion !== NATIVE_GENERATED_SERVICE_QUOTE_COMPILER_VERSION ||
    owner.service.contentVersion !== runtime.serviceRef.contentVersion ||
    owner.ownerFingerprint !== runtime.servicePricingOwnerFingerprint ||
    owner.ownerFingerprint !== expectedFingerprint
  ) {
    return quoteFail(
      'SERVICE_PRICING_OWNER_STALE',
      `Information action ${purchase.data.informationActionId} does not match its exact frozen pricing owner.`,
      [purchase.data.informationActionId, runtime.serviceRef.id],
    );
  }
  const resolved = resolveNativeGeneratedServiceQuote({
    actionId: purchase.data.informationActionId,
    service: owner.service,
    availableMethodIds: runtime.availableFulfillmentMethodIds,
  });
  if (!resolved.ok) return resolved;
  const { method, externalCostAvoided, upgradeSavings } = resolved.value;
  const quoted = GeneratedInformationPurchaseSnapshotSchema.safeParse({
    ...purchase.data,
    resultBindingId: input.resultBindingId,
    serviceRef: runtime.serviceRef,
    servicePricingOwnerFingerprint: owner.ownerFingerprint,
    fulfillmentMethodId: method.id,
    fulfillmentLabel: method.label,
    operatingCost: method.operatingCost,
    externalCostAvoided,
    upgradeSavings,
    pricingDerivation: 'native_versioned_service_quote.v1',
  });
  return quoted.success
    ? { ok: true, value: quoted.data }
    : quoteFail(
        'INVALID_OUTPUT',
        'The native generated information quote failed its output schema.',
        [purchase.data.id, purchase.data.informationActionId],
      );
};

export const quoteGeneratedTreatmentCharges = (input: {
  readonly treatmentSelection: GeneratedEncounterTreatmentSelection;
  readonly replaySnapshot: GeneratedEncounterReplaySnapshot;
}): GeneratedTreatmentChargeQuoteResult => {
  const selection = GeneratedEncounterTreatmentSelectionSchema.safeParse(input.treatmentSelection);
  const snapshot = GeneratedEncounterReplaySnapshotSchema.safeParse(input.replaySnapshot);
  if (!selection.success || !snapshot.success) {
    return quoteFail(
      'INVALID_INPUT',
      'Generated treatment charges require one strict final treatment selection and valid frozen replay snapshot.',
    );
  }
  const selectedTargets = [
    ...uniqueSorted(selection.data.interventionIds).map((interventionId) => ({
      kind: 'intervention' as const,
      interventionId,
    })),
    ...(selection.data.dispositionId === null
      ? []
      : [
          {
            kind: 'disposition' as const,
            dispositionId: selection.data.dispositionId,
          },
        ]),
  ];
  const treatmentOwnersById = new Map(
    snapshot.data.treatmentPricingOwners.map((owner) => [owner.treatment.id, owner]),
  );
  const serviceOwnersById = new Map(
    snapshot.data.servicePricingOwners.map((owner) => [owner.service.id, owner]),
  );
  const runtimeByTreatmentId = new Map(
    snapshot.data.treatmentRuntimeHorizon.map((entry) => [entry.treatmentRef.id, entry]),
  );
  const charges: GeneratedTreatmentCharge[] = [];
  for (const actionTarget of selectedTargets) {
    const treatmentId =
      actionTarget.kind === 'intervention'
        ? actionTarget.interventionId
        : actionTarget.dispositionId;
    const runtime = runtimeByTreatmentId.get(treatmentId);
    if (runtime === undefined || !sameCanonicalValue(runtime.actionTarget, actionTarget)) {
      return quoteFail(
        'TREATMENT_OUTSIDE_PRICING_HORIZON',
        `Selected treatment ${treatmentId} is outside its exact frozen pricing horizon.`,
        [treatmentId],
      );
    }
    const treatmentOwner = treatmentOwnersById.get(treatmentId);
    if (treatmentOwner === undefined) {
      return quoteFail(
        'TREATMENT_PRICING_OWNER_MISSING',
        `Selected treatment ${treatmentId} lacks its frozen treatment owner.`,
        [treatmentId],
      );
    }
    const expectedTreatmentFingerprint = fingerprintGeneratedTreatmentPricingOwner(
      treatmentOwner.treatment,
    );
    if (
      treatmentOwner.compilerVersion !== NATIVE_GENERATED_SERVICE_QUOTE_COMPILER_VERSION ||
      treatmentOwner.treatment.contentVersion !== runtime.treatmentRef.contentVersion ||
      treatmentOwner.ownerFingerprint !== runtime.treatmentPricingOwnerFingerprint ||
      treatmentOwner.ownerFingerprint !== expectedTreatmentFingerprint
    ) {
      return quoteFail(
        'TREATMENT_PRICING_OWNER_STALE',
        `Selected treatment ${treatmentId} does not match its exact frozen treatment owner.`,
        [treatmentId],
      );
    }
    if (runtime.fulfillmentServiceRef === null) continue;
    const serviceOwner = serviceOwnersById.get(runtime.fulfillmentServiceRef.id);
    if (
      serviceOwner === undefined ||
      runtime.servicePricingOwnerFingerprint === null ||
      serviceOwner.compilerVersion !== NATIVE_GENERATED_SERVICE_QUOTE_COMPILER_VERSION ||
      serviceOwner.service.contentVersion !== runtime.fulfillmentServiceRef.contentVersion ||
      serviceOwner.ownerFingerprint !== runtime.servicePricingOwnerFingerprint ||
      serviceOwner.ownerFingerprint !==
        fingerprintGeneratedServicePricingOwner(serviceOwner.service)
    ) {
      return quoteFail(
        'SERVICE_PRICING_OWNER_STALE',
        `Selected treatment ${treatmentId} does not match its exact frozen service-pricing owner.`,
        [treatmentId, runtime.fulfillmentServiceRef.id],
      );
    }
    const resolved = resolveNativeGeneratedServiceQuote({
      actionId: treatmentId,
      service: serviceOwner.service,
      availableMethodIds: runtime.availableFulfillmentMethodIds,
    });
    if (!resolved.ok) return resolved;
    const { method, externalCostAvoided, upgradeSavings } = resolved.value;
    const chargeWithoutId = {
      actionTarget,
      treatmentRef: runtime.treatmentRef,
      treatmentPricingOwnerFingerprint: treatmentOwner.ownerFingerprint,
      serviceRef: runtime.fulfillmentServiceRef,
      servicePricingOwnerFingerprint: serviceOwner.ownerFingerprint,
      fulfillmentMethodId: method.id,
      fulfillmentLabel: method.label,
      label: treatmentOwner.treatment.label,
      operatingCost: method.operatingCost,
      externalCostAvoided,
      upgradeSavings,
      pricingDerivation: 'native_versioned_treatment_service_quote.v1' as const,
    };
    const quoted = GeneratedTreatmentChargeSchema.safeParse({
      id: stableId('generated-treatment-charge', chargeWithoutId),
      ...chargeWithoutId,
    });
    if (!quoted.success) {
      return quoteFail(
        'INVALID_OUTPUT',
        `Native generated treatment charge ${treatmentId} failed its output schema.`,
        [treatmentId],
      );
    }
    charges.push(quoted.data);
  }
  return {
    ok: true,
    value: charges.sort((left, right) => compareStrings(left.id, right.id)),
  };
};

export const verifyGeneratedServicePricingReplaySnapshot = (
  value: unknown,
): { readonly ok: true } | { readonly ok: false; readonly message: string } => {
  const parsed = GeneratedEncounterReplaySnapshotSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'The generated replay snapshot does not satisfy its pricing schema.',
    };
  }
  const ownersById = new Map(
    parsed.data.servicePricingOwners.map((owner) => [owner.service.id, owner]),
  );
  const treatmentOwnersById = new Map(
    parsed.data.treatmentPricingOwners.map((owner) => [owner.treatment.id, owner]),
  );
  for (const owner of parsed.data.servicePricingOwners) {
    if (
      owner.compilerVersion !== NATIVE_GENERATED_SERVICE_QUOTE_COMPILER_VERSION ||
      owner.ownerFingerprint !== fingerprintGeneratedServicePricingOwner(owner.service)
    ) {
      return {
        ok: false,
        message: `Frozen pricing owner ${owner.service.id} does not match its exact normalized payload.`,
      };
    }
  }
  for (const owner of parsed.data.treatmentPricingOwners) {
    if (
      owner.compilerVersion !== NATIVE_GENERATED_SERVICE_QUOTE_COMPILER_VERSION ||
      owner.ownerFingerprint !== fingerprintGeneratedTreatmentPricingOwner(owner.treatment)
    ) {
      return {
        ok: false,
        message: `Frozen treatment owner ${owner.treatment.id} does not match its exact normalized payload.`,
      };
    }
  }
  for (const runtime of parsed.data.informationActionRuntimeHorizon) {
    const owner = ownersById.get(runtime.serviceRef.id);
    if (
      owner === undefined ||
      owner.service.contentVersion !== runtime.serviceRef.contentVersion ||
      owner.ownerFingerprint !== runtime.servicePricingOwnerFingerprint
    ) {
      return {
        ok: false,
        message: `Frozen action ${runtime.informationActionId} does not match its pricing owner.`,
      };
    }
    const available = availableMethodsFor({
      actionId: runtime.informationActionId,
      service: owner.service,
      availableMethodIds: runtime.availableFulfillmentMethodIds,
    });
    if (!available.ok || available.value.length === 0) {
      return {
        ok: false,
        message: available.ok
          ? `Frozen action ${runtime.informationActionId} has no available price method.`
          : available.error.message,
      };
    }
  }
  for (const runtime of parsed.data.treatmentRuntimeHorizon) {
    const treatmentOwner = treatmentOwnersById.get(runtime.treatmentRef.id);
    const expectedKind =
      runtime.actionTarget.kind === 'intervention' ? 'nonmedication' : 'disposition';
    const targetId =
      runtime.actionTarget.kind === 'intervention'
        ? runtime.actionTarget.interventionId
        : runtime.actionTarget.dispositionId;
    if (
      treatmentOwner === undefined ||
      treatmentOwner.treatment.contentVersion !== runtime.treatmentRef.contentVersion ||
      treatmentOwner.ownerFingerprint !== runtime.treatmentPricingOwnerFingerprint ||
      treatmentOwner.treatment.kind !== expectedKind ||
      targetId !== runtime.treatmentRef.id
    ) {
      return {
        ok: false,
        message: `Frozen treatment ${runtime.treatmentRef.id} does not match its exact treatment owner.`,
      };
    }
    if (runtime.fulfillmentServiceRef === null) {
      if (
        treatmentOwner.treatment.fulfillmentServiceId !== null ||
        runtime.servicePricingOwnerFingerprint !== null ||
        runtime.availableFulfillmentMethodIds.length > 0
      ) {
        return {
          ok: false,
          message: `Frozen treatment ${runtime.treatmentRef.id} has an inconsistent no-service pricing binding.`,
        };
      }
      continue;
    }
    const serviceOwner = ownersById.get(runtime.fulfillmentServiceRef.id);
    if (
      treatmentOwner.treatment.fulfillmentServiceId !== runtime.fulfillmentServiceRef.id ||
      serviceOwner === undefined ||
      serviceOwner.service.contentVersion !== runtime.fulfillmentServiceRef.contentVersion ||
      serviceOwner.ownerFingerprint !== runtime.servicePricingOwnerFingerprint
    ) {
      return {
        ok: false,
        message: `Frozen treatment ${runtime.treatmentRef.id} does not match its service-pricing owner.`,
      };
    }
    const available = availableMethodsFor({
      actionId: runtime.treatmentRef.id,
      service: serviceOwner.service,
      availableMethodIds: runtime.availableFulfillmentMethodIds,
    });
    if (!available.ok || available.value.length === 0) {
      return {
        ok: false,
        message: available.ok
          ? `Frozen treatment ${runtime.treatmentRef.id} has no available price method.`
          : available.error.message,
      };
    }
  }
  return { ok: true };
};
