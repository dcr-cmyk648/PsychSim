import {
  EncounterOperationalAdmissionArtifactSchema,
  type ClinicalRuleReview,
  type EncounterCareSetting,
  type EncounterOperationalAdmissionRequest,
  type PatientTemplate,
  type SelectedLocationOperationalResourceContextArtifact,
  type SelectedLocationOperationalResourceContextRequest,
  type SelectedLocationOperationalUpgradeOwner,
  type ServiceDefinition,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import { fingerprintDecisionActionHorizon } from './catalog-instance-compiler';
import {
  compileEncounterOperationalAdmission,
  verifyEncounterOperationalAdmissionContext,
  verifyEncounterOperationalAdmissionIntegrity,
} from './encounter-operational-admission-compiler';
import {
  compileGeneratedEncounterServicePricing,
  compileGeneratedInformationServicePricing,
} from './generated-service-quote';
import {
  compileSelectedLocationOperationalResourceContext,
  fingerprintSelectedLocationFormularyOwner,
  fingerprintSelectedLocationUpgradeOwner,
} from './selected-location-operational-resource-compiler';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-30T12:00:00.000Z',
  sourceUseNoteIds: [],
};

const equipmentUpgradeId = 'upgrade.test.operational.equipment';
const staffUpgradeId = 'upgrade.test.operational.staff';
const formularyUpgradeId = 'upgrade.test.operational.formulary';
const baselineFormularyId = 'formulary.test.location-base';
const expandedFormularyId = 'formulary.test.expanded';
const globalOnlyFormularyId = 'formulary.test.global-only';

interface ResourceOptions {
  readonly assignedEquipment?: boolean;
  readonly assignedStaff?: boolean;
  readonly assignedFormulary?: boolean;
  readonly baselineMedicationIds?: string[];
  readonly baselineCapabilities?: string[];
  readonly dispositionIds?: string[];
  readonly locationContentVersion?: string;
  readonly staffAutomaticInformationActionIds?: string[];
}

const upgradeOwner = (
  id: string,
  kind: SelectedLocationOperationalUpgradeOwner['kind'],
  grantsCapabilities: string[],
  grantsFormularyIds: string[] = [],
): SelectedLocationOperationalUpgradeOwner => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id,
  kind,
  locationAssignmentMode: kind === 'formulary' ? 'shared_locations' : 'exclusive_location',
  allowedFacilityTiers: ['behavioral_health_system'],
  requiredDepartmentId: null,
  grantsCapabilities,
  grantsFormularyIds,
  staffAutomation:
    kind === 'staff'
      ? {
          eligibleInformationActionIds: ['info.history.test.timeline'],
          maximumAutomaticActions: 1,
        }
      : null,
});

const makeSelectedLocationResourceRequest = (
  careSetting: EncounterCareSetting,
  locationId: string,
  options: ResourceOptions = {},
): SelectedLocationOperationalResourceContextRequest => {
  const locationContentVersion = options.locationContentVersion ?? '1.0.0';
  const owners = [
    upgradeOwner(equipmentUpgradeId, 'equipment', ['capability.equipment.assigned']),
    upgradeOwner(staffUpgradeId, 'staff', ['capability.staff.assigned']),
    upgradeOwner(
      formularyUpgradeId,
      'formulary',
      ['capability.formulary.assigned'],
      [expandedFormularyId],
    ),
  ];
  const assignedOwners = owners.filter(
    (owner) =>
      (owner.id === equipmentUpgradeId && options.assignedEquipment) ||
      (owner.id === staffUpgradeId && options.assignedStaff) ||
      (owner.id === formularyUpgradeId && options.assignedFormulary),
  );
  const formularyOwners = [
    {
      schemaVersion: 1 as const,
      id: baselineFormularyId,
      contentVersion: '1.0.0',
      medicationIds: options.baselineMedicationIds ?? ['medication.test.available'],
    },
    {
      schemaVersion: 1 as const,
      id: expandedFormularyId,
      contentVersion: '1.0.0',
      medicationIds: ['medication.test.expanded'],
    },
    {
      schemaVersion: 1 as const,
      id: globalOnlyFormularyId,
      contentVersion: '1.0.0',
      medicationIds: ['medication.test.global-only'],
    },
  ];
  return {
    schemaVersion: 1,
    id: `selected-location-resource-request.test.operational.${careSetting}`,
    clinicOperationalContext: {
      schemaVersion: 1,
      modelVersion: 'clinic-operational-context.v1',
      clinicStateId: 'clinic.test.operational',
      facilityId: 'facility.test.operational',
      facilityTier: 'behavioral_health_system',
      locationIds: [locationId],
      departmentIds: [],
      ownedUpgradeIds: [equipmentUpgradeId, staffUpgradeId, formularyUpgradeId],
      ownedEquipmentIds: [equipmentUpgradeId],
      staffConfigurations: [
        {
          staffUpgradeId,
          automaticInformationActionIds: options.staffAutomaticInformationActionIds ?? [
            'info.history.test.timeline',
          ],
        },
      ],
      formularyIds: [baselineFormularyId, expandedFormularyId, globalOnlyFormularyId],
    },
    facility: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'facility.test.operational',
      label: 'Synthetic behavioral-health system',
      tier: 'behavioral_health_system',
      minimumLifetimePoints: 0,
      patientSlotCount: 1,
      locationIds: [locationId],
      defaultLocationId: locationId,
      allowedDepartmentIds: [],
      allowedUpgradeIds: [equipmentUpgradeId, staffUpgradeId, formularyUpgradeId],
    },
    selectedLocation: {
      schemaVersion: 1,
      contentVersion: locationContentVersion,
      id: locationId,
      label: 'Synthetic exact care location',
      facilityTier: 'behavioral_health_system',
      careSetting,
      capabilities: options.baselineCapabilities ?? [
        'history.basic',
        'counseling.basic',
        'disposition.outpatient',
      ],
      formularyId: baselineFormularyId,
      dispositionIds: options.dispositionIds ?? ['disposition.test.outpatient'],
    },
    assignmentHorizon: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: `clinic-location-resource-assignment-horizon.test.operational.${careSetting}`,
      modelVersion: 'clinic-location-resource-assignment-horizon.v1',
      clinicStateId: 'clinic.test.operational',
      assignments: [
        {
          schemaVersion: 1,
          contentVersion: '1.0.0',
          id: `selected-location-resource-assignment.test.operational.${careSetting}`,
          modelVersion: 'selected-location-operational-resource-assignment.v1',
          locationRef: { id: locationId, contentVersion: locationContentVersion },
          assignedUpgradeRefs: assignedOwners.map((owner) => ({
            id: owner.id,
            contentVersion: owner.contentVersion,
            kind: owner.kind,
            fingerprint: fingerprintSelectedLocationUpgradeOwner(owner),
          })),
          assignedFormularyRefs: options.assignedFormulary
            ? [
                {
                  id: expandedFormularyId,
                  contentVersion: '1.0.0',
                  fingerprint: fingerprintSelectedLocationFormularyOwner(
                    formularyOwners.find((owner) => owner.id === expandedFormularyId)!,
                  ),
                },
              ]
            : [],
        },
      ],
    },
    upgradeOwners: owners,
    formularyOwners,
  };
};

const compileSelectedLocationResource = (
  request: SelectedLocationOperationalResourceContextRequest,
): SelectedLocationOperationalResourceContextArtifact => {
  const result = compileSelectedLocationOperationalResourceContext(request);
  expect(result.ok, JSON.stringify(result)).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const operationalFormularies = (
  artifact: SelectedLocationOperationalResourceContextArtifact,
): EncounterOperationalAdmissionRequest['formularies'] =>
  artifact.effectiveFormularyRefs.map((reference) => {
    const owner = artifact.compileRequest.formularyOwners.find(
      (candidate) => candidate.id === reference.id,
    );
    if (!owner) {
      throw new Error(`Missing effective formulary owner ${reference.id}.`);
    }
    return {
      ...owner,
      label: `Synthetic ${reference.id}`,
      medicationIds: [...owner.medicationIds],
    };
  });

const useSelectedLocationResource = (
  request: EncounterOperationalAdmissionRequest,
  artifact: SelectedLocationOperationalResourceContextArtifact,
): void => {
  request.selectedLocationResourceArtifact = artifact;
  request.formularies = operationalFormularies(artifact);
};

const makeTemplate = (
  actionHorizon: EncounterOperationalAdmissionRequest['actionHorizon'],
  careSetting: EncounterCareSetting,
  locationId: string,
): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: `patient-template.test.operational.${careSetting}`,
  compilationMode: 'attachment_only.v6',
  internalLabel: 'Synthetic operational-admission template',
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
  review: approvedReview,
  patientPool: 'starter',
  careSetting,
  focusedDecisionId: 'decision.test.operational',
  primaryPolicyRef: {
    id: 'decision-policy.test.operational',
    contentVersion: '1.0.0',
  },
  decisionActionHorizonId: actionHorizon.id,
  decisionActionHorizonFingerprint: fingerprintDecisionActionHorizon(actionHorizon),
  diagnosisSelectionHorizonId: 'diagnosis-selection-horizon.test.operational',
  diagnosisSelectionHorizonFingerprint:
    'fingerprint.catalog-instance.diagnosis-selection-horizon.fnv1a64.0000000000000000',
  findingProjectionHorizonId: 'finding-projection-horizon.test.operational',
  findingProjectionHorizonFingerprint:
    'fingerprint.finding.projection-horizon.fnv1a64.0000000000000000',
  universalActionResultAssemblyRecipeRef: {
    id: 'universal-action-result-assembly.test.operational',
    contentVersion: '1.0.0',
  },
  universalActionResultAssemblyRecipeFingerprint:
    'fingerprint.universal-action-result.assembly.fnv1a64.0000000000000000',
  compatibleLocationRefs: [{ id: locationId, contentVersion: '1.0.0' }],
  requiredConditions: [
    {
      schemaVersion: 1,
      id: 'template-condition.test.operational',
      diagnosisDefinitionId: 'diagnosis.test.operational',
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      encounterRelevance: 'focus',
      severityId: null,
      specifierIds: [],
    },
  ],
  optionalConditionSelectionGroups: [],
  complexityProfile: {
    modelVersion: 'additional-feature-budget.v1',
    measurementStatus: 'budget_only',
    additionalFeatureBudget: 6,
    maximumSelectedModules: 2,
    selectedModules: [],
    targetEnvelope: null,
  },
  presentationRichnessEnvelope: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'presentation-richness.test.operational',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['diagnostic_attribution'],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const makeRequest = (
  careSetting: EncounterCareSetting = 'outpatient_psychiatry',
  locationId = `location.test.${careSetting}`,
  resourceOptions: ResourceOptions = {},
): EncounterOperationalAdmissionRequest => {
  const actionHorizon: EncounterOperationalAdmissionRequest['actionHorizon'] = {
    schemaVersion: 1,
    id: 'decision-action-horizon.test.operational',
    informationActionIds: ['info.history.test.timeline'],
    startMedicationIds: ['medication.test.available'],
    regimenEntryOperations: [
      {
        regimenEntryId: 'regimen-entry.test.existing',
        medicationIdentityId: 'medication.test.existing-not-stocked',
        operations: ['continue', 'taper', 'stop'],
      },
    ],
    interventionIds: ['treatment.test.cbt'],
    dispositionIds: ['disposition.test.outpatient'],
  };
  const selectedLocationResourceArtifact = compileSelectedLocationResource(
    makeSelectedLocationResourceRequest(careSetting, locationId, resourceOptions),
  );
  return {
    schemaVersion: 1,
    id: `operational-admission-request.test.${careSetting}`,
    template: makeTemplate(actionHorizon, careSetting, locationId),
    selectedLocationResourceArtifact,
    actionHorizon,
    actionCatalog: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'information-action-catalog.test.operational',
      actions: [
        {
          id: 'info.history.test.timeline',
          label: 'Focused timeline',
          searchAliases: ['timeline'],
          category: 'history',
          soapSection: 'subjective',
          resultSource: 'patient_report',
          description: 'Synthetic neutral action.',
          serviceId: 'service.test.history',
          repeatable: false,
        },
      ],
    },
    services: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'service.test.history',
        fulfillmentMethods: [
          {
            id: 'fulfillment.test.history',
            requiredCapabilities: ['history.basic'],
          },
        ],
      },
    ],
    formularies: operationalFormularies(selectedLocationResourceArtifact),
    medications: [
      {
        contentVersion: '1.0.0',
        id: 'medication.test.available',
      },
    ],
    treatments: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'treatment.test.cbt',
        label: 'Synthetic psychotherapy',
        searchAliases: [],
        kind: 'nonmedication',
        category: 'psychotherapy',
        safeReferral: false,
        requiredCapabilities: ['counseling.basic'],
        fulfillmentServiceId: null,
      },
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'disposition.test.outpatient',
        label: 'Synthetic outpatient disposition',
        searchAliases: [],
        kind: 'disposition',
        category: 'disposition',
        safeReferral: true,
        requiredCapabilities: ['disposition.outpatient'],
        fulfillmentServiceId: null,
      },
    ],
  };
};

const compile = (request: EncounterOperationalAdmissionRequest) => {
  const result = compileEncounterOperationalAdmission(request);
  expect(result.ok, JSON.stringify(result)).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const pricingOwnerFor = (
  service: EncounterOperationalAdmissionRequest['services'][number],
  methods: readonly {
    readonly id: string;
    readonly label: string;
    readonly kind: ServiceDefinition['fulfillmentMethods'][number]['kind'];
    readonly operatingCost: number;
    readonly qualityModifier?: number;
  }[],
): ServiceDefinition => ({
  schemaVersion: service.schemaVersion,
  contentVersion: service.contentVersion,
  id: service.id,
  label: `Pricing owner ${service.id}`,
  fulfillmentMethods: service.fulfillmentMethods.map((operationalMethod) => {
    const pricingMethod = methods.find((candidate) => candidate.id === operationalMethod.id);
    if (pricingMethod === undefined) {
      throw new Error(`Missing pricing method ${operationalMethod.id}.`);
    }
    return {
      ...operationalMethod,
      label: pricingMethod.label,
      kind: pricingMethod.kind,
      operatingCost: pricingMethod.operatingCost,
      qualityModifier: pricingMethod.qualityModifier ?? 1,
    };
  }),
});

describe('encounter operational admission compiler', () => {
  it('compiles a complete, point-free location-baseline admission audit', () => {
    const request = makeRequest();
    const before = structuredClone(request);
    const artifact = compile(request);

    expect(request).toEqual(before);
    expect(artifact.status).toBe('complete');
    expect(artifact.diagnostics).toEqual([]);
    expect(artifact.informationActionEvaluations[0]?.availability).toBe(
      'available_at_selected_location',
    );
    expect(artifact.startMedicationEvaluations[0]?.availability).toBe(
      'available_in_effective_formulary',
    );
    expect(artifact.regimenOperationEvaluations).toEqual([
      {
        regimenEntryId: 'regimen-entry.test.existing',
        medicationIdentityId: 'medication.test.existing-not-stocked',
        operations: ['continue', 'stop', 'taper'],
        availability: 'patient_state_owned',
      },
    ]);
    expect(EncounterOperationalAdmissionArtifactSchema.safeParse(artifact).success).toBe(true);
    expect(JSON.stringify(artifact)).not.toMatch(
      /points|reimbursement|complexityBonus|additionalFeatureBudgetSpent|grantedCapabilities/,
    );
    expect(artifact.compileRequest.template.complexityProfile).toEqual(
      before.template.complexityProfile,
    );
    expect(JSON.stringify(artifact.selectedLocationResourceRef)).not.toMatch(
      /complexity|selectedModules|totalSpent|remainingBudget/,
    );
  });

  it('admits assigned upgrade capability without leaking unassigned or clinic-global grants', () => {
    const assignedRequest = makeRequest(
      'outpatient_psychiatry',
      'location.test.outpatient_psychiatry',
      { assignedEquipment: true },
    );
    assignedRequest.services[0]!.fulfillmentMethods[0]!.requiredCapabilities = [
      'capability.equipment.assigned',
    ];
    const assigned = compile(assignedRequest);
    expect(assigned.status).toBe('complete');
    expect(
      assigned.compileRequest.selectedLocationResourceArtifact.effectiveCapabilityIds,
    ).toContain('capability.equipment.assigned');

    const unassignedRequest = makeRequest();
    unassignedRequest.services[0]!.fulfillmentMethods[0]!.requiredCapabilities = [
      'capability.equipment.assigned',
    ];
    const unassigned = compile(unassignedRequest);
    expect(unassigned.status).toBe('incomplete_coverage');
    expect(
      unassigned.compileRequest.selectedLocationResourceArtifact.effectiveCapabilityIds,
    ).not.toContain('capability.equipment.assigned');

    const globalOnly = makeRequest();
    globalOnly.services[0]!.fulfillmentMethods[0]!.requiredCapabilities = [
      'capability.global-only',
    ];
    const globalOnlyArtifact = compile(globalOnly);
    expect(globalOnlyArtifact.status).toBe('incomplete_coverage');
    expect(
      globalOnlyArtifact.compileRequest.selectedLocationResourceArtifact.effectiveCapabilityIds,
    ).not.toContain('capability.global-only');
  });

  it('uses baseline plus assigned expanded formularies without leaking a global formulary', () => {
    const request = makeRequest('outpatient_psychiatry', 'location.test.outpatient_psychiatry', {
      assignedFormulary: true,
    });
    request.actionHorizon.startMedicationIds = [
      'medication.test.available',
      'medication.test.expanded',
    ];
    request.template.decisionActionHorizonFingerprint = fingerprintDecisionActionHorizon(
      request.actionHorizon,
    );
    request.medications.push({
      id: 'medication.test.expanded',
      contentVersion: '1.0.0',
    });
    const artifact = compile(request);

    expect(artifact.status).toBe('complete');
    expect(
      artifact.compileRequest.selectedLocationResourceArtifact.effectiveFormularyRefs.map(
        (reference) => reference.id,
      ),
    ).toEqual([baselineFormularyId, expandedFormularyId].sort());
    expect(
      artifact.compileRequest.selectedLocationResourceArtifact.effectiveFormularyRefs.map(
        (reference) => reference.id,
      ),
    ).not.toContain(globalOnlyFormularyId);
    expect(
      artifact.startMedicationEvaluations.map((evaluation) => ({
        medicationId: evaluation.medicationId,
        formularies: evaluation.listedInEffectiveFormularyIds,
      })),
    ).toEqual([
      {
        medicationId: 'medication.test.available',
        formularies: [baselineFormularyId],
      },
      {
        medicationId: 'medication.test.expanded',
        formularies: [expandedFormularyId],
      },
    ]);
  });

  it('hard-blocks incomplete or tampered D-222 artifacts before ordinary action coverage', () => {
    const incompleteResourceRequest = makeSelectedLocationResourceRequest(
      'outpatient_psychiatry',
      'location.test.outpatient_psychiatry',
    );
    incompleteResourceRequest.clinicOperationalContext.locationIds.push('location.test.unassigned');
    incompleteResourceRequest.facility.locationIds.push('location.test.unassigned');
    const incompleteResource = compileSelectedLocationResource(incompleteResourceRequest);
    expect(incompleteResource.status).toBe('incomplete_coverage');

    const incomplete = makeRequest();
    useSelectedLocationResource(incomplete, incompleteResource);
    expect(compileEncounterOperationalAdmission(incomplete)).toMatchObject({
      ok: false,
      error: { code: 'SELECTED_LOCATION_RESOURCE_INCOMPLETE' },
    });

    const tampered = makeRequest();
    tampered.selectedLocationResourceArtifact.effectiveCapabilityIds.push('capability.tampered');
    expect(compileEncounterOperationalAdmission(tampered)).toMatchObject({
      ok: false,
      error: { code: 'SELECTED_LOCATION_RESOURCE_INVALID' },
    });
  });

  it.each<EncounterCareSetting>([
    'outpatient_psychiatry',
    'emergency_department',
    'inpatient_psychiatry',
    'consultation_liaison',
  ])('uses the same explicit-resource algorithm in %s', (careSetting) => {
    const artifact = compile(makeRequest(careSetting));
    expect(artifact.careSetting).toBe(careSetting);
    expect(artifact.status).toBe('complete');
    expect(artifact.informationActionEvaluations[0]?.availability).toBe(
      'available_at_selected_location',
    );
    expect(artifact.startMedicationEvaluations[0]?.availability).toBe(
      'available_in_effective_formulary',
    );
    expect(
      artifact.treatmentEvaluations.every((entry) => entry.availability.startsWith('available')),
    ).toBe(true);
  });

  it('supports an exact separate native pricing join and rejects stale or drifted owners', () => {
    const artifact = compile(makeRequest());
    const owner = pricingOwnerFor(artifact.compileRequest.services[0]!, [
      {
        id: 'fulfillment.test.history',
        label: 'Office interview',
        kind: 'in_house',
        operatingCost: 20,
      },
    ]);
    expect(
      compileGeneratedInformationServicePricing({
        servicePricing: { services: [owner] },
        operationalAdmission: artifact,
        informationActionIds: ['info.history.test.timeline'],
      }),
    ).toMatchObject({
      ok: true,
      value: {
        servicePricingOwners: [
          {
            service: { id: 'service.test.history', contentVersion: '1.0.0' },
          },
        ],
        informationActionPricingHorizon: [
          {
            informationActionId: 'info.history.test.timeline',
            availableFulfillmentMethodIds: ['fulfillment.test.history'],
          },
        ],
      },
    });

    const stale = structuredClone(owner);
    stale.contentVersion = '2.0.0';
    expect(
      compileGeneratedInformationServicePricing({
        servicePricing: { services: [stale] },
        operationalAdmission: artifact,
        informationActionIds: ['info.history.test.timeline'],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'STALE_SERVICE_OWNER' },
    });

    const drifted = structuredClone(owner);
    drifted.fulfillmentMethods[0]!.requiredCapabilities = [];
    expect(
      compileGeneratedInformationServicePricing({
        servicePricing: { services: [drifted] },
        operationalAdmission: artifact,
        informationActionIds: ['info.history.test.timeline'],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SERVICE_TOPOLOGY_MISMATCH' },
    });
  });

  it('compiles one exact native service-pricing horizon for information and treatments', () => {
    const request = makeRequest();
    request.treatments[0]!.fulfillmentServiceId = 'service.test.psychotherapy';
    request.services.push({
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'service.test.psychotherapy',
      fulfillmentMethods: [
        {
          id: 'fulfillment.test.psychotherapy.outside',
          requiredCapabilities: [],
        },
        {
          id: 'fulfillment.test.psychotherapy.in-house',
          requiredCapabilities: [],
        },
      ],
    });
    const artifact = compile(request);
    const historyOwner = pricingOwnerFor(artifact.compileRequest.services[0]!, [
      {
        id: 'fulfillment.test.history',
        label: 'Office interview',
        kind: 'in_house',
        operatingCost: 20,
      },
    ]);
    const psychotherapyOwner = pricingOwnerFor(artifact.compileRequest.services[1]!, [
      {
        id: 'fulfillment.test.psychotherapy.outside',
        label: 'Outside psychotherapy',
        kind: 'outside_referral',
        operatingCost: 80,
      },
      {
        id: 'fulfillment.test.psychotherapy.in-house',
        label: 'In-house psychotherapy',
        kind: 'in_house',
        operatingCost: 30,
      },
    ]);
    const result = compileGeneratedEncounterServicePricing({
      servicePricing: { services: [psychotherapyOwner, historyOwner] },
      operationalAdmission: artifact,
      informationActionIds: ['info.history.test.timeline'],
      interventionIds: ['treatment.test.cbt'],
      dispositionIds: ['disposition.test.outpatient'],
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        servicePricingOwners: [
          { service: { id: 'service.test.history' } },
          { service: { id: 'service.test.psychotherapy' } },
        ],
        treatmentPricingOwners: [
          { treatment: { id: 'disposition.test.outpatient' } },
          { treatment: { id: 'treatment.test.cbt' } },
        ],
        treatmentPricingHorizon: [
          {
            treatmentRef: { id: 'disposition.test.outpatient' },
            fulfillmentServiceRef: null,
            availableFulfillmentMethodIds: [],
          },
          {
            treatmentRef: { id: 'treatment.test.cbt' },
            fulfillmentServiceRef: { id: 'service.test.psychotherapy' },
            availableFulfillmentMethodIds: [
              'fulfillment.test.psychotherapy.in-house',
              'fulfillment.test.psychotherapy.outside',
            ],
          },
        ],
      },
    });

    const unequalQuality = structuredClone(psychotherapyOwner);
    unequalQuality.fulfillmentMethods[1]!.qualityModifier = 0.9;
    expect(
      compileGeneratedEncounterServicePricing({
        servicePricing: { services: [historyOwner, unequalQuality] },
        operationalAdmission: artifact,
        informationActionIds: ['info.history.test.timeline'],
        interventionIds: ['treatment.test.cbt'],
        dispositionIds: ['disposition.test.outpatient'],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'UNEQUAL_METHOD_QUALITY' },
    });
  });

  it('does not quote an assigned staff method for an action the staff configuration omits', () => {
    const request = makeRequest('outpatient_psychiatry', 'location.test.outpatient_psychiatry', {
      assignedStaff: true,
      staffAutomaticInformationActionIds: [],
    });
    request.services[0]!.fulfillmentMethods = [
      {
        id: 'fulfillment.test.history.office',
        requiredCapabilities: ['history.basic'],
      },
      {
        id: 'fulfillment.test.history.staff',
        requiredCapabilities: ['history.basic'],
        requiredStaffUpgradeId: staffUpgradeId,
      },
    ];
    const artifact = compile(request);
    expect(
      artifact.informationActionEvaluations[0]!.fulfillmentMethods.filter(
        (method) => method.availability === 'available_at_selected_location',
      ),
    ).toHaveLength(2);
    const owner = pricingOwnerFor(artifact.compileRequest.services[0]!, [
      {
        id: 'fulfillment.test.history.office',
        label: 'Office interview',
        kind: 'in_house',
        operatingCost: 30,
      },
      {
        id: 'fulfillment.test.history.staff',
        label: 'Staff checklist',
        kind: 'in_house',
        operatingCost: 18,
      },
    ]);
    expect(
      compileGeneratedInformationServicePricing({
        servicePricing: { services: [owner] },
        operationalAdmission: artifact,
        informationActionIds: ['info.history.test.timeline'],
      }),
    ).toMatchObject({
      ok: true,
      value: {
        informationActionPricingHorizon: [
          {
            availableFulfillmentMethodIds: ['fulfillment.test.history.office'],
          },
        ],
      },
    });
  });

  it.each<EncounterCareSetting>([
    'outpatient_psychiatry',
    'emergency_department',
    'inpatient_psychiatry',
    'consultation_liaison',
  ])('does not grant resources from the %s setting label', (careSetting) => {
    const request = makeRequest(careSetting, `location.test.${careSetting}`, {
      baselineCapabilities: [],
      baselineMedicationIds: [],
      dispositionIds: [],
    });

    const artifact = compile(request);
    expect(artifact.status).toBe('incomplete_coverage');
    expect(artifact.informationActionEvaluations[0]?.availability).toBe('unavailable');
    expect(artifact.startMedicationEvaluations[0]?.availability).toBe('unavailable');
    expect(
      artifact.treatmentEvaluations.every((entry) => entry.availability === 'unavailable'),
    ).toBe(true);
    expect(new Set(artifact.diagnostics.map((entry) => entry.code))).toEqual(
      new Set([
        'information_action_service_unavailable',
        'start_medication_not_in_effective_formulary',
        'treatment_capability_missing',
        'disposition_not_listed',
      ]),
    );
  });

  it('normalizes set-like operational input order deterministically', () => {
    const left = makeRequest('outpatient_psychiatry', 'location.test.outpatient_psychiatry', {
      baselineCapabilities: ['disposition.outpatient', 'counseling.basic', 'history.basic'],
    });
    left.actionHorizon.regimenEntryOperations[0]!.operations.reverse();
    left.treatments.reverse();
    const right = makeRequest();

    expect(compile(left)).toEqual(compile(right));
  });

  it('rejects a crossed care setting or stale action-horizon fingerprint', () => {
    const crossed = makeRequest();
    useSelectedLocationResource(
      crossed,
      compileSelectedLocationResource(
        makeSelectedLocationResourceRequest(
          'emergency_department',
          'location.test.outpatient_psychiatry',
        ),
      ),
    );
    expect(compileEncounterOperationalAdmission(crossed)).toMatchObject({
      ok: false,
      error: { code: 'TEMPLATE_CARE_SETTING_MISMATCH' },
    });

    const stale = makeRequest();
    stale.actionHorizon.interventionIds.push('treatment.test.other');
    expect(compileEncounterOperationalAdmission(stale)).toMatchObject({
      ok: false,
      error: { code: 'TEMPLATE_ACTION_HORIZON_MISMATCH' },
    });
  });

  it('rejects an unpinned exact location version', () => {
    const request = makeRequest();
    useSelectedLocationResource(
      request,
      compileSelectedLocationResource(
        makeSelectedLocationResourceRequest(
          'outpatient_psychiatry',
          'location.test.outpatient_psychiatry',
          { locationContentVersion: '2.0.0' },
        ),
      ),
    );
    expect(compileEncounterOperationalAdmission(request)).toMatchObject({
      ok: false,
      error: { code: 'TEMPLATE_LOCATION_MISMATCH' },
    });
  });

  it('diagnoses a missing information-action definition without inventing a result', () => {
    const request = makeRequest();
    request.actionCatalog.actions[0]!.id = 'info.history.test.unrelated';
    const artifact = compile(request);

    expect(artifact.status).toBe('incomplete_coverage');
    expect(artifact.diagnostics).toEqual([
      expect.objectContaining({ code: 'information_action_definition_missing' }),
    ]);
    expect(artifact.informationActionEvaluations[0]).toMatchObject({
      availability: 'unavailable',
      actionFingerprint: null,
      serviceOwner: null,
      fulfillmentMethods: [],
    });
  });

  it('diagnoses a missing or unreachable information-action service', () => {
    const missing = makeRequest();
    missing.services = [];
    expect(compile(missing).diagnostics).toEqual([
      expect.objectContaining({ code: 'information_action_service_missing' }),
    ]);

    const unreachable = makeRequest();
    unreachable.services[0]!.fulfillmentMethods[0]!.requiredCapabilities = [
      'capability.not-at-location',
    ];
    const artifact = compile(unreachable);
    expect(artifact.diagnostics).toEqual([
      expect.objectContaining({ code: 'information_action_service_unavailable' }),
    ]);
    expect(artifact.informationActionEvaluations[0]?.fulfillmentMethods[0]).toMatchObject({
      availability: 'unavailable',
      blockers: ['required_capability_missing'],
      missingCapabilityIds: ['capability.not-at-location'],
    });
  });

  it('requires exact assigned staff but admits an unrestricted external alternative', () => {
    const missingStaff = makeRequest();
    missingStaff.services[0]!.fulfillmentMethods[0]!.requiredStaffUpgradeId = staffUpgradeId;
    const missing = compile(missingStaff);
    expect(missing.status).toBe('incomplete_coverage');
    expect(missing.informationActionEvaluations[0]?.fulfillmentMethods[0]).toMatchObject({
      availability: 'unavailable',
      blockers: ['required_staff_missing'],
      staffUpgradeRef: null,
    });

    const assignedStaff = makeRequest(
      'outpatient_psychiatry',
      'location.test.outpatient_psychiatry',
      { assignedStaff: true },
    );
    assignedStaff.services[0]!.fulfillmentMethods[0]!.requiredStaffUpgradeId = staffUpgradeId;
    const assigned = compile(assignedStaff);
    expect(assigned.status).toBe('complete');
    expect(assigned.informationActionEvaluations[0]?.fulfillmentMethods[0]).toMatchObject({
      availability: 'available_at_selected_location',
      staffUpgradeRef: expect.objectContaining({ id: staffUpgradeId, kind: 'staff' }),
    });

    missingStaff.services[0]!.fulfillmentMethods.push({
      id: 'fulfillment.test.external',
      requiredCapabilities: [],
    });
    const available = compile(missingStaff);
    expect(available.status).toBe('complete');
    expect(available.informationActionEvaluations[0]?.availability).toBe(
      'available_at_selected_location',
    );
  });

  it('does not borrow fulfillment from another same-setting location', () => {
    const request = makeRequest();
    request.services[0]!.fulfillmentMethods[0]!.allowedLocationIds = [
      'location.test.other-outpatient',
    ];
    const artifact = compile(request);

    expect(artifact.status).toBe('incomplete_coverage');
    expect(artifact.informationActionEvaluations[0]?.fulfillmentMethods[0]).toMatchObject({
      availability: 'unavailable',
      blockers: ['location_not_allowed'],
    });
  });

  it('keeps start-medication identity and exact effective-formulary membership separate', () => {
    const missingMedication = makeRequest();
    missingMedication.medications = [];
    expect(compile(missingMedication).diagnostics).toEqual([
      expect.objectContaining({ code: 'start_medication_definition_missing' }),
    ]);

    const missingFormulary = makeRequest();
    missingFormulary.formularies = [];
    expect(compileEncounterOperationalAdmission(missingFormulary)).toMatchObject({
      ok: false,
      error: { code: 'EFFECTIVE_FORMULARY_HORIZON_MISMATCH' },
    });

    const sameVersionMembershipSubstitution = makeRequest();
    sameVersionMembershipSubstitution.formularies[0]!.medicationIds.push(
      'medication.test.same-version-added',
    );
    expect(compileEncounterOperationalAdmission(sameVersionMembershipSubstitution)).toMatchObject({
      ok: false,
      error: { code: 'EFFECTIVE_FORMULARY_HORIZON_MISMATCH' },
    });

    const notStocked = makeRequest('outpatient_psychiatry', undefined, {
      baselineMedicationIds: [],
    });
    expect(compile(notStocked).diagnostics).toEqual([
      expect.objectContaining({ code: 'start_medication_not_in_effective_formulary' }),
    ]);
  });

  it('does not formulary-gate entry-targeted operations on an existing regimen', () => {
    const request = makeRequest();
    expect(request.medications).not.toContainEqual(
      expect.objectContaining({ id: 'medication.test.existing-not-stocked' }),
    );
    expect(request.formularies[0]?.medicationIds).not.toContain(
      'medication.test.existing-not-stocked',
    );

    const artifact = compile(request);
    expect(artifact.status).toBe('complete');
    expect(artifact.regimenOperationEvaluations[0]?.availability).toBe('patient_state_owned');
  });

  it('diagnoses missing, wrong-kind, capability-blocked, and unlisted treatments', () => {
    const missing = makeRequest();
    missing.treatments = missing.treatments.filter(
      (treatment) => treatment.id !== 'treatment.test.cbt',
    );
    expect(compile(missing).diagnostics).toContainEqual(
      expect.objectContaining({ code: 'treatment_definition_missing' }),
    );

    const wrongKind = makeRequest();
    wrongKind.treatments.find((entry) => entry.id === 'treatment.test.cbt')!.kind = 'disposition';
    wrongKind.treatments.find((entry) => entry.id === 'treatment.test.cbt')!.category =
      'disposition';
    expect(compile(wrongKind).diagnostics).toContainEqual(
      expect.objectContaining({ code: 'treatment_kind_mismatch' }),
    );

    const capability = makeRequest();
    capability.treatments.find((entry) => entry.id === 'treatment.test.cbt')!.requiredCapabilities =
      ['capability.not-at-location'];
    expect(compile(capability).diagnostics).toContainEqual(
      expect.objectContaining({ code: 'treatment_capability_missing' }),
    );

    const unlisted = makeRequest();
    useSelectedLocationResource(
      unlisted,
      compileSelectedLocationResource(
        makeSelectedLocationResourceRequest(
          'outpatient_psychiatry',
          'location.test.outpatient_psychiatry',
          { dispositionIds: [] },
        ),
      ),
    );
    expect(compile(unlisted).diagnostics).toContainEqual(
      expect.objectContaining({ code: 'disposition_not_listed' }),
    );
  });

  it('audits optional treatment fulfillment through the same exact service boundary', () => {
    const request = makeRequest();
    request.treatments.find((entry) => entry.id === 'treatment.test.cbt')!.fulfillmentServiceId =
      'service.test.therapy';
    const missing = compile(request);
    expect(missing.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'treatment_service_missing' }),
    );

    request.services.push({
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'service.test.therapy',
      fulfillmentMethods: [
        {
          id: 'fulfillment.test.therapy',
          requiredCapabilities: ['capability.not-at-location'],
        },
      ],
    });
    const blocked = compile(request);
    expect(blocked.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'treatment_service_unavailable' }),
    );
  });

  it('detects artifact tampering through deterministic integrity replay', () => {
    const artifact = compile(makeRequest());
    const tampered = structuredClone(artifact);
    tampered.informationActionEvaluations[0]!.fulfillmentMethods[0]!.methodId =
      'fulfillment.test.tampered';

    expect(EncounterOperationalAdmissionArtifactSchema.safeParse(tampered).success).toBe(true);
    expect(verifyEncounterOperationalAdmissionIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });
    expect(verifyEncounterOperationalAdmissionIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });

    const obsolete = structuredClone(artifact);
    obsolete.compilerVersion = '1.0.0';
    expect(verifyEncounterOperationalAdmissionIntegrity(obsolete)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_COMPILER_VERSION' },
    });
  });

  it('requires complete exact context before activation', () => {
    const request = makeRequest();
    const artifact = compile(request);
    expect(
      verifyEncounterOperationalAdmissionContext({
        artifact,
        template: request.template,
        location: request.selectedLocationResourceArtifact.compileRequest.selectedLocation,
        selectedLocationResourceArtifact: request.selectedLocationResourceArtifact,
        actionHorizon: request.actionHorizon,
        actionCatalog: request.actionCatalog,
      }),
    ).toEqual({ ok: true, value: artifact });

    const crossedResource = compileSelectedLocationResource(
      makeSelectedLocationResourceRequest(
        'outpatient_psychiatry',
        'location.test.other-outpatient',
      ),
    );
    expect(
      verifyEncounterOperationalAdmissionContext({
        artifact,
        template: request.template,
        location: request.selectedLocationResourceArtifact.compileRequest.selectedLocation,
        selectedLocationResourceArtifact: crossedResource,
        actionHorizon: request.actionHorizon,
        actionCatalog: request.actionCatalog,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SELECTED_LOCATION_RESOURCE_CONTEXT_MISMATCH' },
    });
  });
});
