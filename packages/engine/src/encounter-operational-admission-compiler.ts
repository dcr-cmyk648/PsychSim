import {
  EncounterOperationalAdmissionArtifactSchema,
  EncounterOperationalAdmissionRequestSchema,
  type DecisionActionHorizon,
  type EncounterOperationalAdmissionArtifact,
  type EncounterOperationalAdmissionFingerprint,
  type EncounterOperationalAdmissionRequest,
  type InformationActionDefinition,
  type LocationDefinition,
  type OperationalCoverageDiagnostic,
  type OperationalCoverageDiagnosticCode,
  type OperationalFulfillmentMethodEvaluation,
  type OperationalInformationActionEvaluation,
  type OperationalMedicationOwnerDefinition,
  type OperationalRegimenOperationEvaluation,
  type OperationalServiceDefinition,
  type OperationalServiceFulfillmentMethodDefinition,
  type OperationalStartMedicationEvaluation,
  type OperationalTreatmentEvaluation,
  type PatientTemplate,
  type SelectedLocationOperationalResourceContextArtifact,
  type SelectedLocationOperationalUpgradeReference,
  type TreatmentOption,
  type UniversalInformationActionCatalog,
} from '@psychsim/schemas';

import {
  fingerprintSelectedLocationFormularyOwner,
  verifySelectedLocationOperationalResourceContextIntegrity,
} from './selected-location-operational-resource-compiler';

export const ENCOUNTER_OPERATIONAL_ADMISSION_COMPILER_VERSION = '3.0.0';

export type EncounterOperationalAdmissionCompileErrorCode =
  | 'INVALID_REQUEST'
  | 'SELECTED_LOCATION_RESOURCE_INVALID'
  | 'SELECTED_LOCATION_RESOURCE_INCOMPLETE'
  | 'EFFECTIVE_FORMULARY_HORIZON_MISMATCH'
  | 'TEMPLATE_LOCATION_MISMATCH'
  | 'TEMPLATE_CARE_SETTING_MISMATCH'
  | 'TEMPLATE_ACTION_HORIZON_MISMATCH'
  | 'INVALID_OUTPUT';

export type EncounterOperationalAdmissionCompileResult =
  | { readonly ok: true; readonly value: EncounterOperationalAdmissionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: EncounterOperationalAdmissionCompileErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type EncounterOperationalAdmissionIntegrityResult =
  | { readonly ok: true; readonly value: EncounterOperationalAdmissionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'UPSTREAM_RESOURCE_INVALID'
          | 'REPLAY_FAILED'
          | 'REPLAY_MISMATCH';
        readonly message: string;
      };
    };

export type EncounterOperationalAdmissionContextResult =
  | { readonly ok: true; readonly value: EncounterOperationalAdmissionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_ARTIFACT'
          | 'INCOMPLETE_COVERAGE'
          | 'SELECTED_LOCATION_RESOURCE_CONTEXT_INVALID'
          | 'SELECTED_LOCATION_RESOURCE_CONTEXT_MISMATCH'
          | 'TEMPLATE_CONTEXT_MISMATCH'
          | 'LOCATION_CONTEXT_MISMATCH'
          | 'ACTION_HORIZON_CONTEXT_MISMATCH'
          | 'ACTION_CATALOG_CONTEXT_MISMATCH';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

const compareStrings = (left: string, right: string): number =>
  left === right ? 0 : left < right ? -1 : 1;

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value
      .map(canonicalize)
      .sort((left, right) => compareStrings(JSON.stringify(left), JSON.stringify(right)));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
};

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

const fingerprint = (scope: string, value: unknown): EncounterOperationalAdmissionFingerprint =>
  `fingerprint.encounter-operational-admission.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalize(value)),
  )}`;

const catalogInstanceDecisionActionHorizonFingerprint = (horizon: DecisionActionHorizon): string =>
  `fingerprint.catalog-instance.decision-action-horizon.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(normalizeActionHorizon(horizon))),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalize(value)))}`;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const sortById = <Value extends { readonly id: string }>(values: readonly Value[]): Value[] =>
  [...values].sort((left, right) => compareStrings(left.id, right.id));

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const sameCanonicalValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const normalizeActionHorizon = (horizon: DecisionActionHorizon): DecisionActionHorizon => ({
  ...horizon,
  informationActionIds: uniqueSorted(horizon.informationActionIds),
  startMedicationIds: uniqueSorted(horizon.startMedicationIds),
  regimenEntryOperations: [...horizon.regimenEntryOperations]
    .map((entry) => ({
      ...entry,
      operations: [...entry.operations].sort(compareStrings),
    }))
    .sort((left, right) => compareStrings(left.regimenEntryId, right.regimenEntryId)),
  interventionIds: uniqueSorted(horizon.interventionIds),
  dispositionIds: uniqueSorted(horizon.dispositionIds),
});

const normalizeTemplate = (template: PatientTemplate): PatientTemplate => ({
  ...template,
  review: {
    ...template.review,
    sourceUseNoteIds: uniqueSorted(template.review.sourceUseNoteIds),
  },
  compatibleLocationRefs: [...template.compatibleLocationRefs].sort((left, right) =>
    compareStrings(
      `${left.id}\u0000${left.contentVersion}`,
      `${right.id}\u0000${right.contentVersion}`,
    ),
  ),
  requiredConditions: sortById(
    template.requiredConditions.map((condition) => ({
      ...condition,
      specifierIds: uniqueSorted(condition.specifierIds),
    })),
  ),
  optionalConditionSelectionGroups: sortById(
    template.optionalConditionSelectionGroups.map((group) => ({
      ...group,
      candidates: sortById(
        group.candidates.map((condition) => ({
          ...condition,
          specifierIds: uniqueSorted(condition.specifierIds),
        })),
      ),
    })),
  ),
  presentationRichnessEnvelope: {
    ...template.presentationRichnessEnvelope,
    decisionDriverCategories: [
      ...template.presentationRichnessEnvelope.decisionDriverCategories,
    ].sort(compareStrings),
  },
});

const normalizeRequest = (
  request: EncounterOperationalAdmissionRequest,
): EncounterOperationalAdmissionRequest =>
  EncounterOperationalAdmissionRequestSchema.parse({
    ...request,
    template: normalizeTemplate(request.template),
    actionHorizon: normalizeActionHorizon(request.actionHorizon),
    actionCatalog: {
      ...request.actionCatalog,
      actions: sortById(
        request.actionCatalog.actions.map((action) => ({
          ...action,
          searchAliases: uniqueSorted(action.searchAliases),
        })),
      ),
    },
    services: sortById(
      request.services.map((service) => ({
        ...service,
        fulfillmentMethods: sortById(
          service.fulfillmentMethods.map((method) => ({
            ...method,
            requiredCapabilities: uniqueSorted(method.requiredCapabilities),
            ...(method.allowedLocationIds
              ? { allowedLocationIds: uniqueSorted(method.allowedLocationIds) }
              : {}),
          })),
        ),
      })),
    ),
    formularies: sortById(
      request.formularies.map((formulary) => ({
        ...formulary,
        medicationIds: uniqueSorted(formulary.medicationIds),
      })),
    ),
    medications: sortById(request.medications),
    treatments: sortById(
      request.treatments.map((treatment) => ({
        ...treatment,
        searchAliases: uniqueSorted(treatment.searchAliases),
        requiredCapabilities: uniqueSorted(treatment.requiredCapabilities),
      })),
    ),
  });

export const fingerprintEncounterOperationalAdmissionTemplate = (
  template: PatientTemplate,
): EncounterOperationalAdmissionFingerprint => fingerprint('template', template);

export const fingerprintEncounterOperationalAdmissionLocation = (
  location: LocationDefinition,
): EncounterOperationalAdmissionFingerprint => fingerprint('location', location);

export const fingerprintEncounterOperationalAdmissionActionHorizon = (
  horizon: DecisionActionHorizon,
): EncounterOperationalAdmissionFingerprint =>
  fingerprint('action-horizon', normalizeActionHorizon(horizon));

export const fingerprintEncounterOperationalAdmissionActionCatalog = (
  catalog: UniversalInformationActionCatalog,
): EncounterOperationalAdmissionFingerprint => fingerprint('action-catalog', catalog);

const owner = (entry: {
  readonly id: string;
  readonly contentVersion: string;
}): {
  readonly ref: { readonly id: string; readonly contentVersion: string };
  readonly fingerprint: EncounterOperationalAdmissionFingerprint;
} => ({
  ref: { id: entry.id, contentVersion: entry.contentVersion },
  fingerprint: fingerprint('owner', entry),
});

const fail = (
  code: EncounterOperationalAdmissionCompileErrorCode,
  message: string,
  contentIds: readonly string[],
): EncounterOperationalAdmissionCompileResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const evaluateFulfillmentMethod = (
  method: OperationalServiceFulfillmentMethodDefinition,
  location: LocationDefinition,
  effectiveCapabilities: ReadonlySet<string>,
  assignedStaffById: ReadonlyMap<string, SelectedLocationOperationalUpgradeReference>,
): OperationalFulfillmentMethodEvaluation => {
  const missingCapabilityIds = uniqueSorted(
    method.requiredCapabilities.filter((capability) => !effectiveCapabilities.has(capability)),
  );
  const requiredStaffUpgradeId = method.requiredStaffUpgradeId ?? null;
  const staffUpgradeRef =
    requiredStaffUpgradeId === null
      ? null
      : (assignedStaffById.get(requiredStaffUpgradeId) ?? null);
  const blockers = [
    ...(missingCapabilityIds.length > 0 ? (['required_capability_missing'] as const) : []),
    ...(method.allowedLocationIds && !method.allowedLocationIds.includes(location.id)
      ? (['location_not_allowed'] as const)
      : []),
    ...(requiredStaffUpgradeId !== null && staffUpgradeRef === null
      ? (['required_staff_missing'] as const)
      : []),
  ].sort(compareStrings);
  return {
    methodId: method.id,
    availability: blockers.length === 0 ? 'available_at_selected_location' : 'unavailable',
    blockers,
    missingCapabilityIds,
    requiredStaffUpgradeId,
    staffUpgradeRef,
  };
};

const diagnostic = (
  code: OperationalCoverageDiagnosticCode,
  itemKind: OperationalCoverageDiagnostic['itemKind'],
  itemId: string,
  message: string,
  contentIds: readonly string[],
): OperationalCoverageDiagnostic => {
  const normalizedContentIds = uniqueSorted(contentIds);
  return {
    id: stableId('operational-coverage-diagnostic', {
      code,
      itemKind,
      itemId,
      contentIds: normalizedContentIds,
    }),
    code,
    itemKind,
    itemId,
    message,
    contentIds: normalizedContentIds,
  };
};

interface EvaluationContext {
  readonly location: LocationDefinition;
  readonly actionsById: ReadonlyMap<string, InformationActionDefinition>;
  readonly servicesById: ReadonlyMap<string, OperationalServiceDefinition>;
  readonly medicationsById: ReadonlyMap<string, OperationalMedicationOwnerDefinition>;
  readonly treatmentsById: ReadonlyMap<string, TreatmentOption>;
  readonly effectiveCapabilities: ReadonlySet<string>;
  readonly assignedStaffById: ReadonlyMap<string, SelectedLocationOperationalUpgradeReference>;
  readonly effectiveFormularies: EncounterOperationalAdmissionRequest['formularies'];
  readonly diagnostics: OperationalCoverageDiagnostic[];
}

const evaluateInformationAction = (
  actionId: string,
  context: EvaluationContext,
): OperationalInformationActionEvaluation => {
  const action = context.actionsById.get(actionId);
  if (!action) {
    context.diagnostics.push(
      diagnostic(
        'information_action_definition_missing',
        'information_action',
        actionId,
        `The operational action horizon references missing information action ${actionId}.`,
        [actionId],
      ),
    );
    return {
      informationActionId: actionId,
      availability: 'unavailable',
      actionFingerprint: null,
      serviceOwner: null,
      fulfillmentMethods: [],
    };
  }
  const service = context.servicesById.get(action.serviceId);
  if (!service) {
    context.diagnostics.push(
      diagnostic(
        'information_action_service_missing',
        'information_action',
        actionId,
        `${actionId} references missing service ${action.serviceId}.`,
        [actionId, action.serviceId],
      ),
    );
    return {
      informationActionId: actionId,
      availability: 'unavailable',
      actionFingerprint: fingerprint('information-action', action),
      serviceOwner: null,
      fulfillmentMethods: [],
    };
  }
  const fulfillmentMethods = service.fulfillmentMethods.map((method) =>
    evaluateFulfillmentMethod(
      method,
      context.location,
      context.effectiveCapabilities,
      context.assignedStaffById,
    ),
  );
  const available = fulfillmentMethods.some(
    (method) => method.availability === 'available_at_selected_location',
  );
  if (!available) {
    context.diagnostics.push(
      diagnostic(
        'information_action_service_unavailable',
        'information_action',
        actionId,
        `${actionId} has no available fulfillment method in the selected-location resource context for ${context.location.id}.`,
        [actionId, service.id, context.location.id],
      ),
    );
  }
  return {
    informationActionId: actionId,
    availability: available ? 'available_at_selected_location' : 'unavailable',
    actionFingerprint: fingerprint('information-action', action),
    serviceOwner: owner(service),
    fulfillmentMethods,
  };
};

const evaluateStartMedication = (
  medicationId: string,
  context: EvaluationContext,
): OperationalStartMedicationEvaluation => {
  const medication = context.medicationsById.get(medicationId);
  const matchingFormularies = context.effectiveFormularies.filter((formulary) =>
    formulary.medicationIds.includes(medicationId),
  );
  if (!medication) {
    context.diagnostics.push(
      diagnostic(
        'start_medication_definition_missing',
        'start_medication',
        medicationId,
        `The operational action horizon references missing medication ${medicationId}.`,
        [medicationId],
      ),
    );
  }
  if (matchingFormularies.length === 0) {
    context.diagnostics.push(
      diagnostic(
        'start_medication_not_in_effective_formulary',
        'start_medication',
        medicationId,
        `${medicationId} is not present in any effective formulary at selected location ${context.location.id}.`,
        [
          medicationId,
          context.location.id,
          ...context.effectiveFormularies.map((formulary) => formulary.id),
        ],
      ),
    );
  }
  const available = Boolean(medication && matchingFormularies.length > 0);
  return {
    medicationId,
    availability: available ? 'available_in_effective_formulary' : 'unavailable',
    medicationOwner: medication ? owner(medication) : null,
    matchingFormularyOwners: matchingFormularies.map(owner),
    listedInEffectiveFormularyIds: matchingFormularies.map((formulary) => formulary.id),
  };
};

const evaluateTreatment = (
  treatmentId: string,
  expectedKind: 'nonmedication' | 'disposition',
  context: EvaluationContext,
): OperationalTreatmentEvaluation => {
  const itemKind = expectedKind === 'nonmedication' ? 'intervention' : 'disposition';
  const treatment = context.treatmentsById.get(treatmentId);
  const listedByLocation =
    expectedKind === 'disposition' ? context.location.dispositionIds.includes(treatmentId) : null;
  if (!treatment) {
    context.diagnostics.push(
      diagnostic(
        'treatment_definition_missing',
        itemKind,
        treatmentId,
        `The operational action horizon references missing ${itemKind} ${treatmentId}.`,
        [treatmentId],
      ),
    );
    if (expectedKind === 'disposition' && !listedByLocation) {
      context.diagnostics.push(
        diagnostic(
          'disposition_not_listed',
          itemKind,
          treatmentId,
          `${treatmentId} is not listed by exact location ${context.location.id}.`,
          [treatmentId, context.location.id],
        ),
      );
    }
    return {
      treatmentId,
      expectedKind,
      availability: 'unavailable',
      treatmentOwner: null,
      missingCapabilityIds: [],
      listedByLocation,
      fulfillmentServiceOwner: null,
      fulfillmentMethods: [],
    };
  }
  const correctKind = treatment.kind === expectedKind;
  if (!correctKind) {
    context.diagnostics.push(
      diagnostic(
        'treatment_kind_mismatch',
        itemKind,
        treatmentId,
        `${treatmentId} is ${treatment.kind}, not required horizon kind ${expectedKind}.`,
        [treatmentId],
      ),
    );
  }
  const missingCapabilityIds = uniqueSorted(
    treatment.requiredCapabilities.filter(
      (capability) => !context.effectiveCapabilities.has(capability),
    ),
  );
  if (missingCapabilityIds.length > 0) {
    context.diagnostics.push(
      diagnostic(
        'treatment_capability_missing',
        itemKind,
        treatmentId,
        `${treatmentId} requires capabilities absent from exact location ${context.location.id}.`,
        [treatmentId, context.location.id, ...missingCapabilityIds],
      ),
    );
  }
  if (expectedKind === 'disposition' && !listedByLocation) {
    context.diagnostics.push(
      diagnostic(
        'disposition_not_listed',
        itemKind,
        treatmentId,
        `${treatmentId} is not listed by exact location ${context.location.id}.`,
        [treatmentId, context.location.id],
      ),
    );
  }

  const service = treatment.fulfillmentServiceId
    ? context.servicesById.get(treatment.fulfillmentServiceId)
    : undefined;
  let fulfillmentMethods: OperationalFulfillmentMethodEvaluation[] = [];
  let serviceReachable = treatment.fulfillmentServiceId === null;
  if (treatment.fulfillmentServiceId && !service) {
    context.diagnostics.push(
      diagnostic(
        'treatment_service_missing',
        itemKind,
        treatmentId,
        `${treatmentId} references missing fulfillment service ${treatment.fulfillmentServiceId}.`,
        [treatmentId, treatment.fulfillmentServiceId],
      ),
    );
  } else if (service) {
    fulfillmentMethods = service.fulfillmentMethods.map((method) =>
      evaluateFulfillmentMethod(
        method,
        context.location,
        context.effectiveCapabilities,
        context.assignedStaffById,
      ),
    );
    serviceReachable = fulfillmentMethods.some(
      (method) => method.availability === 'available_at_selected_location',
    );
    if (!serviceReachable) {
      context.diagnostics.push(
        diagnostic(
          'treatment_service_unavailable',
          itemKind,
          treatmentId,
          `${treatmentId} has no available fulfillment method in the selected-location resource context for ${context.location.id}.`,
          [treatmentId, service.id, context.location.id],
        ),
      );
    }
  }

  const available =
    correctKind &&
    missingCapabilityIds.length === 0 &&
    (expectedKind !== 'disposition' || listedByLocation === true) &&
    serviceReachable;
  return {
    treatmentId,
    expectedKind,
    availability: available ? 'available_at_selected_location' : 'unavailable',
    treatmentOwner: owner(treatment),
    missingCapabilityIds,
    listedByLocation,
    fulfillmentServiceOwner: service ? owner(service) : null,
    fulfillmentMethods,
  };
};

export const compileEncounterOperationalAdmission = (
  input: unknown,
): EncounterOperationalAdmissionCompileResult => {
  const parsed = EncounterOperationalAdmissionRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }
  const request = normalizeRequest(parsed.data);
  const selectedLocationResourceIntegrity =
    verifySelectedLocationOperationalResourceContextIntegrity(
      request.selectedLocationResourceArtifact,
    );
  if (!selectedLocationResourceIntegrity.ok) {
    return fail(
      'SELECTED_LOCATION_RESOURCE_INVALID',
      `The selected-location resource artifact failed integrity verification: ${selectedLocationResourceIntegrity.error.code}: ${selectedLocationResourceIntegrity.error.message}`,
      [request.selectedLocationResourceArtifact.id],
    );
  }
  const selectedLocationResource = selectedLocationResourceIntegrity.value;
  if (selectedLocationResource.status !== 'complete') {
    return fail(
      'SELECTED_LOCATION_RESOURCE_INCOMPLETE',
      'Operational admission requires a complete selected-location resource artifact.',
      [
        selectedLocationResource.id,
        ...selectedLocationResource.diagnostics.flatMap((entry) => entry.contentIds),
      ],
    );
  }
  const location = selectedLocationResource.compileRequest.selectedLocation;
  const expectedFormularyHorizon = selectedLocationResource.effectiveFormularyRefs
    .map(
      (reference) =>
        `${reference.id}\u0000${reference.contentVersion}\u0000${reference.fingerprint}`,
    )
    .sort(compareStrings);
  const providedFormularyHorizon = request.formularies
    .map(
      (formulary) =>
        `${formulary.id}\u0000${formulary.contentVersion}\u0000${fingerprintSelectedLocationFormularyOwner(
          formulary,
        )}`,
    )
    .sort(compareStrings);
  if (
    expectedFormularyHorizon.length !== providedFormularyHorizon.length ||
    expectedFormularyHorizon.some(
      (reference, index) => reference !== providedFormularyHorizon[index],
    )
  ) {
    return fail(
      'EFFECTIVE_FORMULARY_HORIZON_MISMATCH',
      'Operational admission formularies must exactly cover the selected location’s effective formulary references by stable ID, content version, and complete formulary-owner fingerprint.',
      [
        selectedLocationResource.id,
        location.id,
        ...selectedLocationResource.effectiveFormularyRefs.map((reference) => reference.id),
        ...request.formularies.map((formulary) => formulary.id),
      ],
    );
  }
  const requestFingerprint = fingerprint('input', request);
  const template = request.template;
  if (
    !template.compatibleLocationRefs.some(
      (reference) =>
        reference.id === location.id && reference.contentVersion === location.contentVersion,
    )
  ) {
    return fail(
      'TEMPLATE_LOCATION_MISMATCH',
      'The operational admission location is not an exact version admitted by the patient template.',
      [template.id, location.id],
    );
  }
  if (
    template.careSetting !== location.careSetting ||
    selectedLocationResource.careSetting !== location.careSetting
  ) {
    return fail(
      'TEMPLATE_CARE_SETTING_MISMATCH',
      'The patient template and exact operational location must share one care setting.',
      [template.id, location.id, selectedLocationResource.id],
    );
  }
  if (
    template.decisionActionHorizonId !== request.actionHorizon.id ||
    template.decisionActionHorizonFingerprint !==
      catalogInstanceDecisionActionHorizonFingerprint(request.actionHorizon)
  ) {
    return fail(
      'TEMPLATE_ACTION_HORIZON_MISMATCH',
      'The operational admission action horizon must exactly match the ID and payload pinned by the patient template.',
      [template.id, request.actionHorizon.id],
    );
  }

  const diagnostics: OperationalCoverageDiagnostic[] = [];
  const context: EvaluationContext = {
    location,
    actionsById: new Map(request.actionCatalog.actions.map((action) => [action.id, action])),
    servicesById: new Map(request.services.map((service) => [service.id, service])),
    medicationsById: new Map(request.medications.map((medication) => [medication.id, medication])),
    treatmentsById: new Map(request.treatments.map((treatment) => [treatment.id, treatment])),
    effectiveCapabilities: new Set(selectedLocationResource.effectiveCapabilityIds),
    assignedStaffById: new Map(
      selectedLocationResource.staffContexts.map((staff) => [
        staff.staffUpgradeRef.id,
        staff.staffUpgradeRef,
      ]),
    ),
    effectiveFormularies: request.formularies,
    diagnostics,
  };
  const informationActionEvaluations = request.actionHorizon.informationActionIds.map((actionId) =>
    evaluateInformationAction(actionId, context),
  );
  const startMedicationEvaluations = request.actionHorizon.startMedicationIds.map((medicationId) =>
    evaluateStartMedication(medicationId, context),
  );
  const regimenOperationEvaluations: OperationalRegimenOperationEvaluation[] =
    request.actionHorizon.regimenEntryOperations.map((entry) => ({
      ...entry,
      operations: [...entry.operations],
      availability: 'patient_state_owned',
    }));
  const treatmentEvaluations = [
    ...request.actionHorizon.interventionIds.map((treatmentId) =>
      evaluateTreatment(treatmentId, 'nonmedication', context),
    ),
    ...request.actionHorizon.dispositionIds.map((treatmentId) =>
      evaluateTreatment(treatmentId, 'disposition', context),
    ),
  ].sort((left, right) =>
    compareStrings(
      `${left.expectedKind}\u0000${left.treatmentId}`,
      `${right.expectedKind}\u0000${right.treatmentId}`,
    ),
  );
  diagnostics.sort((left, right) => compareStrings(left.id, right.id));

  const payload = {
    schemaVersion: 1 as const,
    compilerVersion: ENCOUNTER_OPERATIONAL_ADMISSION_COMPILER_VERSION,
    requestId: request.id,
    status: diagnostics.length === 0 ? ('complete' as const) : ('incomplete_coverage' as const),
    careSetting: template.careSetting,
    templateRef: { id: template.id, contentVersion: template.contentVersion },
    templateFingerprint: fingerprintEncounterOperationalAdmissionTemplate(template),
    selectedLocationResourceRef: {
      id: selectedLocationResource.id,
      payloadFingerprint: selectedLocationResource.payloadFingerprint,
    },
    locationRef: {
      id: location.id,
      contentVersion: location.contentVersion,
    },
    locationFingerprint: fingerprintEncounterOperationalAdmissionLocation(location),
    actionHorizonId: request.actionHorizon.id,
    actionHorizonFingerprint: fingerprintEncounterOperationalAdmissionActionHorizon(
      request.actionHorizon,
    ),
    actionCatalogRef: {
      id: request.actionCatalog.id,
      contentVersion: request.actionCatalog.contentVersion,
    },
    actionCatalogFingerprint: fingerprintEncounterOperationalAdmissionActionCatalog(
      request.actionCatalog,
    ),
    informationActionEvaluations,
    startMedicationEvaluations,
    regimenOperationEvaluations,
    treatmentEvaluations,
    diagnostics,
    compileRequest: request,
    inputFingerprint: requestFingerprint,
  };
  const payloadFingerprint = fingerprint('artifact', payload);
  const artifact = EncounterOperationalAdmissionArtifactSchema.safeParse({
    ...payload,
    id: `encounter-operational-admission.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!artifact.success) {
    return fail('INVALID_OUTPUT', issuesText(artifact.error.issues), [
      template.id,
      location.id,
      selectedLocationResource.id,
      request.actionHorizon.id,
    ]);
  }
  return { ok: true, value: artifact.data };
};

export const verifyEncounterOperationalAdmissionIntegrity = (
  value: unknown,
): EncounterOperationalAdmissionIntegrityResult => {
  const parsed = EncounterOperationalAdmissionArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  if (parsed.data.compilerVersion !== ENCOUNTER_OPERATIONAL_ADMISSION_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported operational-admission compiler ${parsed.data.compilerVersion}.`,
      },
    };
  }
  const selectedLocationResourceIntegrity =
    verifySelectedLocationOperationalResourceContextIntegrity(
      parsed.data.compileRequest.selectedLocationResourceArtifact,
    );
  if (
    !selectedLocationResourceIntegrity.ok ||
    selectedLocationResourceIntegrity.value.status !== 'complete'
  ) {
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_RESOURCE_INVALID',
        message: selectedLocationResourceIntegrity.ok
          ? 'The nested selected-location resource artifact is incomplete.'
          : `${selectedLocationResourceIntegrity.error.code}: ${selectedLocationResourceIntegrity.error.message}`,
      },
    };
  }
  const replay = compileEncounterOperationalAdmission(parsed.data.compileRequest);
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
        message:
          'The operational-admission artifact does not match deterministic replay of its exact request.',
      },
    };
  }
  return { ok: true, value: parsed.data };
};

export const verifyEncounterOperationalAdmissionContext = (input: {
  readonly artifact: EncounterOperationalAdmissionArtifact;
  readonly template: PatientTemplate;
  readonly location: LocationDefinition;
  readonly selectedLocationResourceArtifact: SelectedLocationOperationalResourceContextArtifact;
  readonly actionHorizon: DecisionActionHorizon;
  readonly actionCatalog: UniversalInformationActionCatalog;
}): EncounterOperationalAdmissionContextResult => {
  const integrity = verifyEncounterOperationalAdmissionIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
        contentIds: [input.artifact.id],
      },
    };
  }
  const artifact = integrity.value;
  if (artifact.status !== 'complete') {
    return {
      ok: false,
      error: {
        code: 'INCOMPLETE_COVERAGE',
        message:
          'Operational admission must be complete before a generated encounter can activate.',
        contentIds: [
          artifact.id,
          ...artifact.diagnostics.flatMap((diagnostic) => diagnostic.contentIds),
        ],
      },
    };
  }
  const expectedSelectedLocationResourceIntegrity =
    verifySelectedLocationOperationalResourceContextIntegrity(
      input.selectedLocationResourceArtifact,
    );
  if (
    !expectedSelectedLocationResourceIntegrity.ok ||
    expectedSelectedLocationResourceIntegrity.value.status !== 'complete'
  ) {
    return {
      ok: false,
      error: {
        code: 'SELECTED_LOCATION_RESOURCE_CONTEXT_INVALID',
        message: expectedSelectedLocationResourceIntegrity.ok
          ? 'The expected selected-location resource artifact is incomplete.'
          : `${expectedSelectedLocationResourceIntegrity.error.code}: ${expectedSelectedLocationResourceIntegrity.error.message}`,
        contentIds: [input.selectedLocationResourceArtifact.id],
      },
    };
  }
  const expectedSelectedLocationResource = expectedSelectedLocationResourceIntegrity.value;
  const nestedSelectedLocationResource = artifact.compileRequest.selectedLocationResourceArtifact;
  if (
    artifact.selectedLocationResourceRef.id !== expectedSelectedLocationResource.id ||
    artifact.selectedLocationResourceRef.payloadFingerprint !==
      expectedSelectedLocationResource.payloadFingerprint ||
    !sameExactValue(nestedSelectedLocationResource, expectedSelectedLocationResource)
  ) {
    return {
      ok: false,
      error: {
        code: 'SELECTED_LOCATION_RESOURCE_CONTEXT_MISMATCH',
        message:
          'Operational admission targets a different exact selected-location resource artifact.',
        contentIds: [
          artifact.id,
          nestedSelectedLocationResource.id,
          expectedSelectedLocationResource.id,
        ],
      },
    };
  }
  const location = expectedSelectedLocationResource.compileRequest.selectedLocation;
  if (
    artifact.templateRef.id !== input.template.id ||
    artifact.templateRef.contentVersion !== input.template.contentVersion ||
    artifact.templateFingerprint !==
      fingerprintEncounterOperationalAdmissionTemplate(input.template)
  ) {
    return {
      ok: false,
      error: {
        code: 'TEMPLATE_CONTEXT_MISMATCH',
        message: 'Operational admission targets a different exact patient template.',
        contentIds: [artifact.id, input.template.id],
      },
    };
  }
  if (
    !sameCanonicalValue(location, input.location) ||
    artifact.locationRef.id !== input.location.id ||
    artifact.locationRef.contentVersion !== input.location.contentVersion ||
    artifact.locationFingerprint !==
      fingerprintEncounterOperationalAdmissionLocation(input.location) ||
    artifact.locationFingerprint !== fingerprintEncounterOperationalAdmissionLocation(location) ||
    artifact.careSetting !== input.location.careSetting ||
    artifact.careSetting !== location.careSetting
  ) {
    return {
      ok: false,
      error: {
        code: 'LOCATION_CONTEXT_MISMATCH',
        message: 'Operational admission targets a different exact physical location.',
        contentIds: [artifact.id, location.id, input.location.id],
      },
    };
  }
  if (
    artifact.actionHorizonId !== input.actionHorizon.id ||
    artifact.actionHorizonFingerprint !==
      fingerprintEncounterOperationalAdmissionActionHorizon(input.actionHorizon)
  ) {
    return {
      ok: false,
      error: {
        code: 'ACTION_HORIZON_CONTEXT_MISMATCH',
        message: 'Operational admission targets a different exact decision-action horizon.',
        contentIds: [artifact.id, input.actionHorizon.id],
      },
    };
  }
  if (
    artifact.actionCatalogRef.id !== input.actionCatalog.id ||
    artifact.actionCatalogRef.contentVersion !== input.actionCatalog.contentVersion ||
    artifact.actionCatalogFingerprint !==
      fingerprintEncounterOperationalAdmissionActionCatalog(input.actionCatalog)
  ) {
    return {
      ok: false,
      error: {
        code: 'ACTION_CATALOG_CONTEXT_MISMATCH',
        message: 'Operational admission targets a different exact information-action catalog.',
        contentIds: [artifact.id, input.actionCatalog.id],
      },
    };
  }
  return { ok: true, value: artifact };
};
