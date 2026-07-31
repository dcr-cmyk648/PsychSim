import {
  PatientTemplateLocationAdmissionMatrixArtifactSchema,
  PatientTemplateLocationAdmissionMatrixRequestSchema,
  type EncounterOperationalAdmissionArtifact,
  type PatientTemplate,
  type PatientTemplateLocationAdmissionDiagnostic,
  type PatientTemplateLocationAdmissionDiagnosticCode,
  type PatientTemplateLocationAdmissionEvaluation,
  type PatientTemplateLocationAdmissionMatrixArtifact,
  type PatientTemplateLocationAdmissionMatrixFingerprint,
  type PatientTemplateLocationAdmissionMatrixRequest,
  type PatientTemplateLocationResourceEvaluation,
} from '@psychsim/schemas';

import { fingerprintDecisionActionHorizon } from './catalog-instance-compiler';
import { compileEncounterOperationalAdmission } from './encounter-operational-admission-compiler';
import { verifyModePatientTemplateHorizonIntegrity } from './mode-patient-template-horizon-compiler';
import { compileSelectedLocationOperationalResourceContext } from './selected-location-operational-resource-compiler';
import { fingerprintUniversalActionResultAssemblyRecipe } from './universal-action-result-compiler';

export const PATIENT_TEMPLATE_LOCATION_ADMISSION_MATRIX_COMPILER_VERSION = '3.0.0';

export type PatientTemplateLocationAdmissionMatrixCompileResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateLocationAdmissionMatrixArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_REQUEST' | 'INVALID_TEMPLATE_HORIZON' | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type PatientTemplateLocationAdmissionMatrixIntegrityResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateLocationAdmissionMatrixArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'REPLAY_FAILED'
          | 'REPLAY_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

export type PatientTemplateLocationAdmissionMatrixContextResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateLocationAdmissionMatrixArtifact;
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

const sortById = <Entry extends { readonly id: string }>(entries: readonly Entry[]): Entry[] =>
  [...entries].sort((left, right) => compareStrings(left.id, right.id));

const uniqueSorted = <Value extends string>(values: readonly Value[]): Value[] =>
  [...new Set(values)].sort(compareStrings);

const sorted = <Value extends string>(values: readonly Value[]): Value[] =>
  [...values].sort(compareStrings);

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

const fingerprint = (
  scope: string,
  value: unknown,
): PatientTemplateLocationAdmissionMatrixFingerprint =>
  `fingerprint.patient-template-location-admission-matrix.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

export const fingerprintPatientTemplateLocationAdmissionTemplate = (
  template: PatientTemplate,
): PatientTemplateLocationAdmissionMatrixFingerprint => fingerprint('template', template);

export const fingerprintPatientTemplateLocationAdmissionLocation = (
  location: PatientTemplateLocationAdmissionMatrixRequest['locations'][number],
): PatientTemplateLocationAdmissionMatrixFingerprint => fingerprint('location', location);

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const normalizeRequest = (
  request: PatientTemplateLocationAdmissionMatrixRequest,
): PatientTemplateLocationAdmissionMatrixRequest => ({
  ...request,
  clinicOperationalContext: {
    ...request.clinicOperationalContext,
    locationIds: uniqueSorted(request.clinicOperationalContext.locationIds),
    departmentIds: uniqueSorted(request.clinicOperationalContext.departmentIds),
    ownedUpgradeIds: uniqueSorted(request.clinicOperationalContext.ownedUpgradeIds),
    ownedEquipmentIds: uniqueSorted(request.clinicOperationalContext.ownedEquipmentIds),
    staffConfigurations: [...request.clinicOperationalContext.staffConfigurations]
      .map((configuration) => ({
        ...configuration,
        // Preserve duplicates so D-222 can diagnose an invalid staff configuration.
        automaticInformationActionIds: sorted(configuration.automaticInformationActionIds),
      }))
      .sort((left, right) => compareStrings(left.staffUpgradeId, right.staffUpgradeId)),
    formularyIds: uniqueSorted(request.clinicOperationalContext.formularyIds),
  },
  facility: {
    ...request.facility,
    locationIds: uniqueSorted(request.facility.locationIds),
    allowedDepartmentIds: uniqueSorted(request.facility.allowedDepartmentIds),
    allowedUpgradeIds: uniqueSorted(request.facility.allowedUpgradeIds),
  },
  locations: sortById(
    request.locations.map((location) => ({
      ...location,
      capabilities: uniqueSorted(location.capabilities),
      dispositionIds: uniqueSorted(location.dispositionIds),
    })),
  ),
  assignmentHorizon: {
    ...request.assignmentHorizon,
    assignments: sortById(
      request.assignmentHorizon.assignments.map((assignment) => ({
        ...assignment,
        assignedUpgradeRefs: sortById(assignment.assignedUpgradeRefs),
        assignedFormularyRefs: sortById(assignment.assignedFormularyRefs),
      })),
    ),
  },
  upgradeOwners: sortById(
    request.upgradeOwners.map((owner) => ({
      ...owner,
      allowedFacilityTiers: uniqueSorted(owner.allowedFacilityTiers),
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
    })),
  ),
  formularies: sortById(
    request.formularies.map((formulary) => ({
      ...formulary,
      // Preserve duplicates so D-219's exact operational request rejects malformed membership.
      medicationIds: sorted(formulary.medicationIds),
    })),
  ),
  actionHorizons: sortById(
    request.actionHorizons.map((horizon) => ({
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
    })),
  ),
  universalActionResultAssemblyRecipes: sortById(request.universalActionResultAssemblyRecipes),
  services: sortById(
    request.services.map((service) => ({
      ...service,
      fulfillmentMethods: sortById(
        service.fulfillmentMethods.map((method) => ({
          ...method,
          requiredCapabilities: uniqueSorted(method.requiredCapabilities),
          ...(method.allowedLocationIds === undefined
            ? {}
            : { allowedLocationIds: uniqueSorted(method.allowedLocationIds) }),
        })),
      ),
    })),
  ),
  medications: sortById(request.medications),
  treatments: sortById(
    request.treatments.map((treatment) => ({
      ...treatment,
      searchAliases: [...treatment.searchAliases].sort(compareStrings),
      requiredCapabilities: uniqueSorted(treatment.requiredCapabilities),
    })),
  ),
});

const coordinateId = (scope: string, ...coordinates: readonly string[]): string =>
  `${scope}.${hashToHex64(coordinates.join('\u0000'))}`;

const diagnostic = (input: {
  readonly code: PatientTemplateLocationAdmissionDiagnosticCode;
  readonly message: string;
  readonly contentIds: readonly string[];
  readonly upstreamDiagnosticId?: string | null;
  readonly coordinateIds: readonly string[];
}): PatientTemplateLocationAdmissionDiagnostic => ({
  id: coordinateId(
    `patient-template-location-admission-diagnostic.${input.code.replaceAll('_', '-')}`,
    ...input.coordinateIds,
    input.upstreamDiagnosticId ?? '',
  ),
  code: input.code,
  message: input.message,
  contentIds: uniqueSorted(input.contentIds),
  upstreamDiagnosticId: input.upstreamDiagnosticId ?? null,
});

const resourceEvaluationId = (locationId: string, locationVersion: string): string =>
  coordinateId('patient-template-location-resource-evaluation', locationId, locationVersion);

const admissionEvaluationId = (
  templateId: string,
  templateVersion: string,
  locationId: string,
  locationVersion: string,
): string =>
  coordinateId(
    'patient-template-location-admission-evaluation',
    templateId,
    templateVersion,
    locationId,
    locationVersion,
  );

const compileLocationResource = (
  request: PatientTemplateLocationAdmissionMatrixRequest,
  location: PatientTemplateLocationAdmissionMatrixRequest['locations'][number],
): PatientTemplateLocationResourceEvaluation => {
  const result = compileSelectedLocationOperationalResourceContext({
    schemaVersion: 1,
    id: coordinateId(
      'selected-location-resource-request.admission-matrix',
      request.clinicOperationalContext.clinicStateId,
      location.id,
      location.contentVersion,
    ),
    clinicOperationalContext: request.clinicOperationalContext,
    facility: request.facility,
    selectedLocation: location,
    assignmentHorizon: request.assignmentHorizon,
    upgradeOwners: request.upgradeOwners,
    formularyOwners: request.formularies.map(
      ({ schemaVersion, contentVersion, id, medicationIds }) => ({
        schemaVersion,
        contentVersion,
        id,
        medicationIds,
      }),
    ),
  });
  const base = {
    schemaVersion: 1 as const,
    id: resourceEvaluationId(location.id, location.contentVersion),
    locationRef: { id: location.id, contentVersion: location.contentVersion },
    locationFingerprint: fingerprint('location', location),
  };
  if (!result.ok) {
    return {
      ...base,
      status: 'compile_failed',
      artifact: null,
      diagnostics: [
        diagnostic({
          code: 'location_resource_compile_failed',
          message: `${result.error.code}: ${result.error.message}`,
          contentIds: [location.id, ...result.error.contentIds],
          coordinateIds: [request.id, location.id, result.error.code],
        }),
      ],
    };
  }
  const artifact = result.value;
  return {
    ...base,
    status: artifact.status,
    artifact,
    diagnostics:
      artifact.status === 'complete'
        ? []
        : artifact.diagnostics.map((entry) =>
            diagnostic({
              code: 'location_resource_incomplete',
              message: entry.message,
              contentIds: [location.id, ...entry.contentIds],
              upstreamDiagnosticId: entry.id,
              coordinateIds: [request.id, location.id, entry.id],
            }),
          ),
  };
};

const oneDiagnosticCell = (input: {
  readonly request: PatientTemplateLocationAdmissionMatrixRequest;
  readonly template: PatientTemplate;
  readonly location: PatientTemplateLocationAdmissionMatrixRequest['locations'][number];
  readonly resourceEvaluation: PatientTemplateLocationResourceEvaluation;
  readonly status: Exclude<
    PatientTemplateLocationAdmissionEvaluation['status'],
    'admitted' | 'operational_coverage_incomplete'
  >;
  readonly code: PatientTemplateLocationAdmissionDiagnosticCode;
  readonly message: string;
  readonly contentIds: readonly string[];
}): PatientTemplateLocationAdmissionEvaluation => ({
  schemaVersion: 1,
  id: admissionEvaluationId(
    input.template.id,
    input.template.contentVersion,
    input.location.id,
    input.location.contentVersion,
  ),
  templateRef: {
    id: input.template.id,
    contentVersion: input.template.contentVersion,
  },
  templateFingerprint: fingerprint('template', input.template),
  patientPool: input.template.patientPool,
  templateCareSetting: input.template.careSetting,
  locationRef: {
    id: input.location.id,
    contentVersion: input.location.contentVersion,
  },
  locationFingerprint: fingerprint('location', input.location),
  locationCareSetting: input.location.careSetting,
  locationResourceEvaluationId: input.resourceEvaluation.id,
  status: input.status,
  operationalAdmissionArtifact: null,
  diagnostics: [
    diagnostic({
      code: input.code,
      message: input.message,
      contentIds: input.contentIds,
      coordinateIds: [input.request.id, input.template.id, input.location.id, input.code],
    }),
  ],
});

const compileAdmissionCell = (input: {
  readonly request: PatientTemplateLocationAdmissionMatrixRequest;
  readonly template: PatientTemplate;
  readonly location: PatientTemplateLocationAdmissionMatrixRequest['locations'][number];
  readonly resourceEvaluation: PatientTemplateLocationResourceEvaluation;
}): PatientTemplateLocationAdmissionEvaluation => {
  const { request, template, location, resourceEvaluation } = input;
  const exactLocationRef = template.compatibleLocationRefs.find(
    (reference) =>
      reference.id === location.id && reference.contentVersion === location.contentVersion,
  );
  if (exactLocationRef === undefined) {
    const staleReference = template.compatibleLocationRefs.find(
      (reference) => reference.id === location.id,
    );
    return oneDiagnosticCell({
      ...input,
      status: staleReference === undefined ? 'not_declared_compatible' : 'stale_location_reference',
      code: staleReference === undefined ? 'not_declared_compatible' : 'stale_location_reference',
      message:
        staleReference === undefined
          ? `${template.id} does not declare ${location.id} as a compatible location.`
          : `${template.id} pins ${location.id}@${staleReference.contentVersion}, not the built ${location.id}@${location.contentVersion}.`,
      contentIds: [
        template.id,
        location.id,
        ...(staleReference === undefined ? [] : [staleReference.id]),
      ],
    });
  }
  if (template.careSetting !== location.careSetting) {
    return oneDiagnosticCell({
      ...input,
      status: 'care_setting_mismatch',
      code: 'care_setting_mismatch',
      message: `${template.id} and ${location.id} declare different care settings.`,
      contentIds: [template.id, location.id],
    });
  }

  const actionHorizon = request.actionHorizons.find(
    (candidate) => candidate.id === template.decisionActionHorizonId,
  );
  if (actionHorizon === undefined) {
    return oneDiagnosticCell({
      ...input,
      status: 'template_dependency_invalid',
      code: 'action_horizon_missing',
      message: `${template.id} has no supplied decision-action horizon ${template.decisionActionHorizonId}.`,
      contentIds: [template.id, template.decisionActionHorizonId],
    });
  }
  if (
    fingerprintDecisionActionHorizon(actionHorizon) !== template.decisionActionHorizonFingerprint
  ) {
    return oneDiagnosticCell({
      ...input,
      status: 'template_dependency_invalid',
      code: 'action_horizon_mismatch',
      message: `${template.id} does not pin the supplied payload for ${actionHorizon.id}.`,
      contentIds: [template.id, actionHorizon.id],
    });
  }

  const assembly = request.universalActionResultAssemblyRecipes.find(
    (candidate) =>
      candidate.id === template.universalActionResultAssemblyRecipeRef.id &&
      candidate.contentVersion === template.universalActionResultAssemblyRecipeRef.contentVersion,
  );
  if (assembly === undefined) {
    return oneDiagnosticCell({
      ...input,
      status: 'template_dependency_invalid',
      code: 'assembly_recipe_missing',
      message: `${template.id} has no supplied universal action/result assembly ${template.universalActionResultAssemblyRecipeRef.id}@${template.universalActionResultAssemblyRecipeRef.contentVersion}.`,
      contentIds: [template.id, template.universalActionResultAssemblyRecipeRef.id],
    });
  }
  if (
    fingerprintUniversalActionResultAssemblyRecipe(assembly) !==
    template.universalActionResultAssemblyRecipeFingerprint
  ) {
    return oneDiagnosticCell({
      ...input,
      status: 'template_dependency_invalid',
      code: 'assembly_recipe_mismatch',
      message: `${template.id} does not pin the supplied payload for ${assembly.id}.`,
      contentIds: [template.id, assembly.id],
    });
  }

  if (resourceEvaluation.status !== 'complete' || resourceEvaluation.artifact === null) {
    return oneDiagnosticCell({
      ...input,
      status: 'location_resource_incomplete',
      code: 'location_resource_incomplete',
      message: `${location.id} does not have a complete selected-location resource context.`,
      contentIds: [template.id, location.id, resourceEvaluation.id],
    });
  }
  const resourceArtifact = resourceEvaluation.artifact;
  const effectiveFormularies = resourceArtifact.effectiveFormularyRefs.flatMap((reference) => {
    const owner = request.formularies.find(
      (formulary) =>
        formulary.id === reference.id && formulary.contentVersion === reference.contentVersion,
    );
    return owner === undefined ? [] : [owner];
  });
  const admission = compileEncounterOperationalAdmission({
    schemaVersion: 1,
    id: coordinateId(
      'encounter-operational-admission-request.admission-matrix',
      template.id,
      template.contentVersion,
      location.id,
      location.contentVersion,
    ),
    template,
    selectedLocationResourceArtifact: resourceArtifact,
    actionHorizon,
    actionCatalog: assembly.actionCatalog,
    services: request.services,
    formularies: effectiveFormularies,
    medications: request.medications,
    treatments: request.treatments,
  });
  if (!admission.ok) {
    return oneDiagnosticCell({
      ...input,
      status: 'operational_context_invalid',
      code: 'operational_context_invalid',
      message: `${admission.error.code}: ${admission.error.message}`,
      contentIds: [template.id, location.id, ...admission.error.contentIds],
    });
  }
  return completeAdmissionCell({
    request,
    template,
    location,
    resourceEvaluation,
    operationalAdmissionArtifact: admission.value,
  });
};

const completeAdmissionCell = (input: {
  readonly request: PatientTemplateLocationAdmissionMatrixRequest;
  readonly template: PatientTemplate;
  readonly location: PatientTemplateLocationAdmissionMatrixRequest['locations'][number];
  readonly resourceEvaluation: PatientTemplateLocationResourceEvaluation;
  readonly operationalAdmissionArtifact: EncounterOperationalAdmissionArtifact;
}): PatientTemplateLocationAdmissionEvaluation => {
  const artifact = input.operationalAdmissionArtifact;
  return {
    schemaVersion: 1,
    id: admissionEvaluationId(
      input.template.id,
      input.template.contentVersion,
      input.location.id,
      input.location.contentVersion,
    ),
    templateRef: {
      id: input.template.id,
      contentVersion: input.template.contentVersion,
    },
    templateFingerprint: fingerprintPatientTemplateLocationAdmissionTemplate(input.template),
    patientPool: input.template.patientPool,
    templateCareSetting: input.template.careSetting,
    locationRef: {
      id: input.location.id,
      contentVersion: input.location.contentVersion,
    },
    locationFingerprint: fingerprintPatientTemplateLocationAdmissionLocation(input.location),
    locationCareSetting: input.location.careSetting,
    locationResourceEvaluationId: input.resourceEvaluation.id,
    status: artifact.status === 'complete' ? 'admitted' : 'operational_coverage_incomplete',
    operationalAdmissionArtifact: artifact,
    diagnostics:
      artifact.status === 'complete'
        ? []
        : artifact.diagnostics.map((entry) =>
            diagnostic({
              code: 'operational_coverage_incomplete',
              message: entry.message,
              contentIds: [input.template.id, input.location.id, ...entry.contentIds],
              upstreamDiagnosticId: entry.id,
              coordinateIds: [input.request.id, input.template.id, input.location.id, entry.id],
            }),
          ),
  };
};

const artifactPayload = (
  artifact: Omit<PatientTemplateLocationAdmissionMatrixArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  locationResourceEvaluations: artifact.locationResourceEvaluations,
  admissionEvaluations: artifact.admissionEvaluations,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const compilePatientTemplateLocationAdmissionMatrix = (
  input: unknown,
): PatientTemplateLocationAdmissionMatrixCompileResult => {
  const parsed = PatientTemplateLocationAdmissionMatrixRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: issuesText(parsed.error.issues),
        contentIds: [],
      },
    };
  }
  const templateHorizon = verifyModePatientTemplateHorizonIntegrity(
    parsed.data.templateHorizonArtifact,
  );
  if (!templateHorizon.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_TEMPLATE_HORIZON',
        message: `${templateHorizon.error.code}: ${templateHorizon.error.message}`,
        contentIds: [parsed.data.templateHorizonArtifact.id],
      },
    };
  }
  const request = normalizeRequest({
    ...parsed.data,
    templateHorizonArtifact: templateHorizon.value,
  });
  const templates = request.templateHorizonArtifact.templates;
  const locationResourceEvaluations = request.locations.map((location) =>
    compileLocationResource(request, location),
  );
  const resourceByLocationId = new Map(
    locationResourceEvaluations.map((evaluation) => [evaluation.locationRef.id, evaluation]),
  );
  const admissionEvaluations = templates.flatMap((template) =>
    request.locations.map((location) =>
      compileAdmissionCell({
        request,
        template,
        location,
        resourceEvaluation: resourceByLocationId.get(location.id)!,
      }),
    ),
  );
  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_TEMPLATE_LOCATION_ADMISSION_MATRIX_COMPILER_VERSION,
    requestId: request.id,
    locationResourceEvaluations,
    admissionEvaluations,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = PatientTemplateLocationAdmissionMatrixArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `patient-template-location-admission-matrix.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(output.error.issues),
        contentIds: [
          request.id,
          ...templates.map((template) => template.id),
          ...request.locations.map((location) => location.id),
        ],
      },
    };
  }
  return { ok: true, value: output.data };
};

export const verifyPatientTemplateLocationAdmissionMatrixIntegrity = (
  value: unknown,
): PatientTemplateLocationAdmissionMatrixIntegrityResult => {
  const parsed = PatientTemplateLocationAdmissionMatrixArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (artifact.compilerVersion !== PATIENT_TEMPLATE_LOCATION_ADMISSION_MATRIX_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported template/location admission-matrix compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const replay = compilePatientTemplateLocationAdmissionMatrix(artifact.compileRequest);
  if (!replay.ok) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_FAILED',
        message: `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  if (!sameCanonicalValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained template/location admission matrix does not match deterministic replay from its exact request.',
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `patient-template-location-admission-matrix.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen admission-matrix payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyPatientTemplateLocationAdmissionMatrixContext = (input: {
  readonly artifact: unknown;
  readonly request: unknown;
}): PatientTemplateLocationAdmissionMatrixContextResult => {
  const integrity = verifyPatientTemplateLocationAdmissionMatrixIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = compilePatientTemplateLocationAdmissionMatrix(input.request);
  if (!expected.ok) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: `${expected.error.code}: ${expected.error.message}`,
      },
    };
  }
  if (!sameCanonicalValue(integrity.value, expected.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message:
          'The admission matrix does not match the exact current clinic, facility, location, assignment, template, and owner context.',
      },
    };
  }
  return { ok: true, value: integrity.value };
};
